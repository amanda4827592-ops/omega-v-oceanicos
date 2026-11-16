import { describe, expect, it, jest } from '@jest/globals';
import { createApp } from '../../dist/index.js';
const config = {
  apiKey: 'composio-test-key-never-return-this',
  userId: 'oceanicos-test-user',
  connectedAccounts: { github: 'ca_github_test', notion: 'ca_notion_test' },
  toolkitVersions: { github: '20261115_00', notion: '20261115_00' },
};
const admitted = () => ({ authorityVerified: true, policySatisfied: true, approvalVerified: false });
const response = (payload: unknown, status = 200) => new Response(JSON.stringify(payload), {
  status, headers: { 'content-type': 'application/json' },
});
describe('Composio read-only gateway', () => {
  it('keeps provider output UNKNOWN pending independent verification and redacts secrets', async () => {
    const fetchMock = jest.fn<typeof fetch>().mockResolvedValue(response({
      successful: true,
      data: { repository: { full_name: 'owner/repo', private: true }, access_token: 'must-not-escape', token: 'bare-token', nested: { api_key: 'also-secret', title: 'safe' } },
    }));
    const app = createApp(':memory:', false, { composioGatewayConfig: config, composioFetch: fetchMock, connectorAdmissionEvidence: admitted });
    try {
      const result = await app.inject({ method: 'POST', url: '/v1/omega/composio/read', payload: {
        toolSlug: 'GITHUB_GET_A_REPOSITORY', arguments: { owner: 'owner', repo: 'repo' },
      }});
      const body = result.json();
      expect(result.statusCode).toBe(200);
      expect(body.status).toBe('UNKNOWN');
      expect(body.result.access_token).toBe('[REDACTED]');
      expect(body.result.token).toBe('[REDACTED]');
      expect(body.result.nested.api_key).toBe('[REDACTED]');
      expect(body.result.repository.full_name).toBe('owner/repo');
      expect(body.evidenceHash).toMatch(/^[0-9a-f]{64}$/);
      expect(body.observation.execution.error).toContain('independent verification pending');
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
      expect(url).toBe('https://backend.composio.dev/api/v3.1/tools/execute/GITHUB_GET_A_REPOSITORY');
      expect(init.method).toBe('POST');
      expect((init.headers as Record<string, string>)['x-api-key']).toBe(config.apiKey);
      const sent = JSON.parse(String(init.body));
      expect(sent.connected_account_id).toBe(config.connectedAccounts.github);
      expect(sent.user_id).toBe(config.userId);
      expect(sent.version).toBe(config.toolkitVersions.github);
      expect(sent.arguments).toEqual({ owner: 'owner', repo: 'repo' });
    } finally { await app.close(); }
  });
  it('does not call Composio when trusted admission evidence is absent', async () => {
    const fetchMock = jest.fn<typeof fetch>();
    const app = createApp(':memory:', false, { composioGatewayConfig: config, composioFetch: fetchMock });
    try {
      const result = await app.inject({ method: 'POST', url: '/v1/omega/composio/read', payload: {
        toolSlug: 'NOTION_SEARCH_NOTION_PAGE', arguments: { query: 'OceanicOS' },
      }});
      expect(result.statusCode).toBe(200);
      expect(result.json().status).toBe('NOT_EXECUTED');
      expect(fetchMock).not.toHaveBeenCalled();
    } finally { await app.close(); }
  });
  it('fails closed when Composio configuration is absent', async () => {
    const fetchMock = jest.fn<typeof fetch>();
    const app = createApp(':memory:', false, { composioGatewayConfig: null, composioFetch: fetchMock, connectorAdmissionEvidence: admitted });
    try {
      const result = await app.inject({ method: 'POST', url: '/v1/omega/composio/read', payload: {
        toolSlug: 'NOTION_SEARCH_NOTION_PAGE', arguments: { query: 'OceanicOS' },
      }});
      expect(result.statusCode).toBe(200);
      expect(result.json().status).toBe('NOT_EXECUTED');
      expect(fetchMock).not.toHaveBeenCalled();
    } finally { await app.close(); }
  });
  it('rejects write-capable tools and caller-supplied authority or credentials', async () => {
    const fetchMock = jest.fn<typeof fetch>();
    const app = createApp(':memory:', false, { composioGatewayConfig: config, composioFetch: fetchMock, connectorAdmissionEvidence: admitted });
    try {
      const write = await app.inject({ method: 'POST', url: '/v1/omega/composio/read', payload: {
        toolSlug: 'GITHUB_CREATE_AN_ISSUE', arguments: { title: 'unsafe' },
      }});
      expect(write.statusCode).toBe(400);
      expect(write.json().error).toBe('COMPOSIO_TOOL_NOT_ALLOWLISTED');
      const forged = await app.inject({ method: 'POST', url: '/v1/omega/composio/read', payload: {
        toolSlug: 'GITHUB_GET_A_REPOSITORY', arguments: { owner: 'owner', repo: 'repo' }, authorityVerified: true,
      }});
      expect(forged.statusCode).toBe(400);
      expect(fetchMock).not.toHaveBeenCalled();
    } finally { await app.close(); }
  });
  it('rejects inline secrets in tool arguments', async () => {
    const fetchMock = jest.fn<typeof fetch>();
    const app = createApp(':memory:', false, { composioGatewayConfig: config, composioFetch: fetchMock, connectorAdmissionEvidence: admitted });
    try {
      const result = await app.inject({ method: 'POST', url: '/v1/omega/composio/read', payload: {
        toolSlug: 'GITHUB_GET_A_REPOSITORY', arguments: { owner: 'owner', repo: 'repo', access_token: 'do-not-accept' },
      }});
      expect(result.statusCode).toBe(400);
      expect(result.json().error).toBe('INVALID_COMPOSIO_ARGUMENTS');
      expect(fetchMock).not.toHaveBeenCalled();
    } finally { await app.close(); }
  });

  it('bounds recursive Notion reads and rejects transcript expansion', async () => {
    const fetchMock = jest.fn<typeof fetch>().mockResolvedValue(response({ successful: true, data: { results: [] } }));
    const app = createApp(':memory:', false, {
      composioGatewayConfig: config, composioFetch: fetchMock, connectorAdmissionEvidence: admitted,
    });
    try {
      const tooLarge = await app.inject({
        method: 'POST', url: '/v1/omega/composio/read',
        payload: {
          toolSlug: 'NOTION_FETCH_ALL_BLOCK_CONTENTS',
          arguments: { block_id: 'page-id', recursive: true, max_blocks: 10000, max_depth: 50 },
        },
      });
      expect(tooLarge.statusCode).toBe(400);
      expect(tooLarge.json().error).toBe('INVALID_COMPOSIO_ARGUMENTS');
      expect(fetchMock).not.toHaveBeenCalled();

      const transcript = await app.inject({
        method: 'POST', url: '/v1/omega/composio/read',
        payload: {
          toolSlug: 'NOTION_GET_PAGE_MARKDOWN',
          arguments: { page_id: 'page-id', include_transcript: true },
        },
      });
      expect(transcript.statusCode).toBe(400);
      expect(fetchMock).not.toHaveBeenCalled();

      const bounded = await app.inject({
        method: 'POST', url: '/v1/omega/composio/read',
        payload: {
          toolSlug: 'NOTION_FETCH_ALL_BLOCK_CONTENTS',
          arguments: { block_id: 'page-id', recursive: true },
        },
      });
      expect(bounded.statusCode).toBe(200);
      expect(bounded.json().status).toBe('UNKNOWN');
      const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
      const sent = JSON.parse(String(init.body));
      expect(sent.arguments.max_blocks).toBe(500);
      expect(sent.arguments.max_depth).toBe(4);
    } finally { await app.close(); }
  });

  it('preserves UNKNOWN and hides provider error bodies when Composio fails', async () => {
    const fetchMock = jest.fn<typeof fetch>().mockResolvedValue(response({ successful: false, error: 'sensitive provider details should not escape' }, 502));
    const app = createApp(':memory:', false, { composioGatewayConfig: config, composioFetch: fetchMock, connectorAdmissionEvidence: admitted });
    try {
      const result = await app.inject({ method: 'POST', url: '/v1/omega/composio/read', payload: {
        toolSlug: 'NOTION_SEARCH_NOTION_PAGE', arguments: { query: 'OceanicOS' },
      }});
      expect(result.statusCode).toBe(200);
      expect(result.json().status).toBe('UNKNOWN');
      expect(JSON.stringify(result.json())).not.toContain('sensitive provider details');
      expect(result.json().observation.issues).toContain('COMPOSIO_HTTP_502');
    } finally { await app.close(); }
  });
});
