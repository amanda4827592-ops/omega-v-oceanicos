import { createHash } from 'node:crypto';

export type ComposioToolkit = 'github' | 'notion';
const TOOLKIT_BY_SLUG: Readonly<Record<string, ComposioToolkit>> = Object.freeze({
  GITHUB_GET_A_REPOSITORY: 'github',
  GITHUB_GET_A_BRANCH: 'github',
  GITHUB_GET_REPOSITORY_CONTENT: 'github',
  GITHUB_LIST_BRANCHES: 'github',
  GITHUB_LIST_COMMITS: 'github',
  NOTION_SEARCH_NOTION_PAGE: 'notion',
  NOTION_RETRIEVE_PAGE: 'notion',
  NOTION_FETCH_DATABASE: 'notion',
  NOTION_GET_PAGE_MARKDOWN: 'notion',
  NOTION_FETCH_BLOCK_CONTENTS: 'notion',
  NOTION_FETCH_ALL_BLOCK_CONTENTS: 'notion',
  NOTION_FETCH_ROW: 'notion',
  NOTION_QUERY_DATABASE_WITH_FILTER: 'notion',
});
const SECRET_FIELD = /(token|api.?key|authorization|password|secret|cookie|credential)/i;
const PINNED_VERSION = /^\d{8}_\d{2}$/;
const MAX_ARGUMENT_BYTES = 16 * 1024;
const MAX_RESPONSE_BYTES = 64 * 1024;
const MAX_DEPTH = 6;

export interface ComposioGatewayConfig {
  readonly apiKey: string;
  readonly userId: string;
  readonly connectedAccounts: Readonly<Record<ComposioToolkit, string>>;
  readonly toolkitVersions: Readonly<Record<ComposioToolkit, string>>;
}
export interface ComposioGatewayResult {
  readonly success: boolean;
  readonly data?: unknown;
  readonly evidenceHash?: string;
  readonly error?: string;
}
export function composioToolkitForTool(toolSlug: string): ComposioToolkit | null {
  return TOOLKIT_BY_SLUG[toolSlug] ?? null;
}
export function loadComposioGatewayConfig(env: Record<string, string | undefined>): ComposioGatewayConfig | null {
  const apiKey = env.COMPOSIO_API_KEY?.trim() ?? '';
  const userId = env.COMPOSIO_USER_ID?.trim() ?? '';
  const connectedAccounts = {
    github: env.COMPOSIO_GITHUB_CONNECTED_ACCOUNT_ID?.trim() ?? '',
    notion: env.COMPOSIO_NOTION_CONNECTED_ACCOUNT_ID?.trim() ?? '',
  };
  const toolkitVersions = {
    github: env.COMPOSIO_GITHUB_TOOLKIT_VERSION?.trim() ?? '',
    notion: env.COMPOSIO_NOTION_TOOLKIT_VERSION?.trim() ?? '',
  };
  if (!apiKey || !userId || !connectedAccounts.github || !connectedAccounts.notion ||
      !PINNED_VERSION.test(toolkitVersions.github) || !PINNED_VERSION.test(toolkitVersions.notion)) return null;
  return { apiKey, userId, connectedAccounts, toolkitVersions };
}
function validateJsonValue(value: unknown, depth = 0): void {
  if (depth > MAX_DEPTH) throw new Error('ARGUMENT_DEPTH_EXCEEDED');
  if (value === null || typeof value === 'boolean') return;
  if (typeof value === 'string') {
    if (value.length > 4096) throw new Error('ARGUMENT_STRING_TOO_LONG');
    return;
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error('ARGUMENT_NUMBER_INVALID');
    return;
  }
  if (Array.isArray(value)) {
    if (value.length > 100) throw new Error('ARGUMENT_ARRAY_TOO_LARGE');
    for (const entry of value) validateJsonValue(entry, depth + 1);
    return;
  }
  if (typeof value === 'object') {
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) throw new Error('ARGUMENT_OBJECT_INVALID');
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length > 50) throw new Error('ARGUMENT_OBJECT_TOO_LARGE');
    for (const [key, entry] of entries) {
      if (SECRET_FIELD.test(key) || ['__proto__', 'prototype', 'constructor'].includes(key)) {
        throw new Error('SECRET_OR_UNSAFE_ARGUMENT_FIELD');
      }
      validateJsonValue(entry, depth + 1);
    }
    return;
  }
  throw new Error('ARGUMENT_TYPE_INVALID');
}
export function validateComposioArguments(toolSlug: string, value: unknown): Record<string, unknown> {
  if (!composioToolkitForTool(toolSlug)) throw new Error('TOOL_NOT_ALLOWLISTED');
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('ARGUMENTS_OBJECT_REQUIRED');
  validateJsonValue(value);
  const serialized = JSON.stringify(value);
  if (Buffer.byteLength(serialized, 'utf8') > MAX_ARGUMENT_BYTES) throw new Error('ARGUMENTS_TOO_LARGE');
  const bounded = { ...(value as Record<string, unknown>) };
  const capInteger = (key: string, maximum: number): void => {
    const candidate = bounded[key];
    if (candidate === undefined) return;
    if (typeof candidate !== 'number' || !Number.isInteger(candidate) || candidate < 1 || candidate > maximum) {
      throw new Error('ARGUMENT_LIMIT_EXCEEDED_' + key.toUpperCase());
    }
  };
  capInteger('page_size', 100);
  capInteger('per_page', 100);
  if (toolSlug === 'NOTION_FETCH_ALL_BLOCK_CONTENTS') {
    if (bounded.recursive === true) {
      if (bounded.max_blocks === undefined) bounded.max_blocks = 500;
      if (bounded.max_depth === undefined) bounded.max_depth = 4;
    }
    capInteger('max_blocks', 500);
    capInteger('max_depth', 4);
  }
  if (toolSlug === 'NOTION_GET_PAGE_MARKDOWN' && bounded.include_transcript === true) {
    throw new Error('TRANSCRIPT_EXPANSION_NOT_ALLOWED');
  }
  return bounded;
}
export function redactComposioData(value: unknown, depth = 0): unknown {
  if (depth > 8) return '[TRUNCATED]';
  if (Array.isArray(value)) return value.slice(0, 100).map((entry) => redactComposioData(entry, depth + 1));
  if (value && typeof value === 'object') {
    const output: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value as Record<string, unknown>).slice(0, 200)) {
      output[key] = SECRET_FIELD.test(key) ? '[REDACTED]' : redactComposioData(entry, depth + 1);
    }
    return output;
  }
  if (typeof value === 'string' && value.length > 8192) return value.slice(0, 8192) + '…[TRUNCATED]';
  return value;
}
export class ComposioGateway {
  constructor(private readonly config: ComposioGatewayConfig | null, private readonly fetcher: typeof fetch = fetch) {}
  isConfigured(): boolean { return Boolean(this.config); }
  async execute(toolSlug: string, args: Record<string, unknown>, timeoutMs = 8_000): Promise<ComposioGatewayResult> {
    const toolkit = composioToolkitForTool(toolSlug);
    if (!toolkit) return { success: false, error: 'TOOL_NOT_ALLOWLISTED' };
    if (!this.config) return { success: false, error: 'COMPOSIO_NOT_CONFIGURED' };
    const endpoint = 'https://backend.composio.dev/api/v3.1/tools/execute/' + toolSlug;
    try {
      const response = await this.fetcher(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-api-key': this.config.apiKey },
        body: JSON.stringify({
          connected_account_id: this.config.connectedAccounts[toolkit],
          user_id: this.config.userId,
          version: this.config.toolkitVersions[toolkit],
          arguments: args,
        }),
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!response.ok) return { success: false, error: 'COMPOSIO_HTTP_' + response.status };
      const raw = await response.text();
      if (Buffer.byteLength(raw, 'utf8') > MAX_RESPONSE_BYTES) return { success: false, error: 'COMPOSIO_RESPONSE_TOO_LARGE' };
      let payload: unknown;
      try { payload = JSON.parse(raw); } catch { return { success: false, error: 'COMPOSIO_RESPONSE_NOT_JSON' }; }
      if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return { success: false, error: 'COMPOSIO_RESPONSE_INVALID' };
      const envelope = payload as Record<string, unknown>;
      if (envelope.successful !== true || !('data' in envelope)) return { success: false, error: 'COMPOSIO_TOOL_FAILED' };
      const data = redactComposioData(envelope.data);
      const evidenceHash = createHash('sha256').update(JSON.stringify(data)).digest('hex');
      return { success: true, data, evidenceHash };
    } catch (error) {
      const name = (error as Error)?.name ?? '';
      return { success: false, error: name === 'TimeoutError' || name === 'AbortError' ? 'COMPOSIO_TIMEOUT' : 'COMPOSIO_TRANSPORT_ERROR' };
    }
  }
}
