import type { FastifyInstance } from 'fastify';
import {
  admitOmegaConnector,
  observeAdmittedConnector,
  type ConnectorExecutionObservation,
  type ConnectorObservationStore,
  type OmegaConnectorDeclaration,
} from '@oceanicos/mini';
import type { ConnectorAdmissionEvidenceResolver } from './connector-observation-route.js';
import {
  ComposioGateway,
  composioToolkitForTool,
  validateComposioArguments,
  type ComposioGatewayConfig,
} from './composio-gateway.js';

type JsonError = (reply: any, status: number, error: string, extra?: Record<string, unknown>) => unknown;
export interface ComposioGatewayRouteOptions {
  readonly config: ComposioGatewayConfig | null;
  readonly fetch?: typeof fetch;
  readonly resolveAdmissionEvidence?: ConnectorAdmissionEvidenceResolver;
  readonly requireReadAccess?: (request: any, reply: any) => unknown;
}
function parseObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
}
export function registerComposioGatewayRoute(
  fastify: FastifyInstance,
  jsonError: JsonError,
  store: ConnectorObservationStore,
  options: ComposioGatewayRouteOptions,
): void {
  const gateway = new ComposioGateway(options.config, options.fetch);
  fastify.post('/v1/omega/composio/read', {
    preHandler: options.requireReadAccess,
    config: { rateLimit: { max: 20, timeWindow: '1 minute' } },
  }, async (request, reply) => {
    if (!store.verifyIntegrity()) return jsonError(reply, 503, 'CONNECTOR_OBSERVATION_JOURNAL_INTEGRITY_DEGRADED');
    const body = parseObject(request.body);
    if (!body || Object.keys(body).some((key) => !['toolSlug', 'arguments'].includes(key))) {
      return jsonError(reply, 400, 'INVALID_COMPOSIO_READ_REQUEST');
    }
    const toolSlug = typeof body.toolSlug === 'string' ? body.toolSlug.trim() : '';
    const toolkit = composioToolkitForTool(toolSlug);
    if (!toolkit) return jsonError(reply, 400, 'COMPOSIO_TOOL_NOT_ALLOWLISTED');
    let args: Record<string, unknown>;
    try { args = validateComposioArguments(body.arguments); } catch (error) {
      return jsonError(reply, 400, 'INVALID_COMPOSIO_ARGUMENTS', {
        reason: String((error as Error)?.message ?? 'ARGUMENTS_INVALID'),
      });
    }
    const connector: OmegaConnectorDeclaration = {
      id: 'composio-' + toolkit + '-' + toolSlug.toLowerCase(),
      version: 'composio-readonly-v1',
      system: 'composio:' + toolkit,
      capability: toolSlug,
      authRef: 'composio:' + toolkit + ':server-connected-account',
      scope: ['tool:' + toolSlug, 'toolkit:' + toolkit],
      mode: 'read-only',
      policyRefs: ['policy:composio-fixed-readonly-allowlist-v1', 'policy:server-side-credential-custody-v1'],
      stopCondition: 'Stop on missing authority, policy, credentials, timeout, invalid response, or unrecognized tool.',
      expectedObservation: 'Provider result independently reconciled against a declared expected state.',
      timeoutMs: 8_000,
      maxAttempts: 1,
      rollbackSupported: false,
    };
    let admissionEvidence = { authorityVerified: false, policySatisfied: false, approvalVerified: false };
    if (options.resolveAdmissionEvidence) {
      try { admissionEvidence = await options.resolveAdmissionEvidence(request, connector); } catch {
        admissionEvidence = { authorityVerified: false, policySatisfied: false, approvalVerified: false };
      }
    }
    const admission = admitOmegaConnector({ connector, ...admissionEvidence });
    let providerData: unknown = null;
    let evidenceHash: string | null = null;
    let execution: ConnectorExecutionObservation | undefined;
    if (admission.admitted) {
      if (!gateway.isConfigured()) {
        execution = { attempted: false, executed: false, error: 'COMPOSIO_NOT_CONFIGURED' };
      } else {
        const provider = await gateway.execute(toolSlug, args, connector.timeoutMs);
        if (provider.success) {
          providerData = provider.data ?? null;
          evidenceHash = provider.evidenceHash ?? null;
          execution = {
            attempted: true,
            executed: true,
            error: 'Composio response captured; independent verification pending; evidence_sha256=' + evidenceHash,
          };
        } else {
          execution = { attempted: true, executed: false, error: provider.error ?? 'COMPOSIO_EXECUTION_UNKNOWN' };
        }
      }
    }
    const observation = observeAdmittedConnector({ connector, admission, execution });
    let journalEntry;
    try { journalEntry = store.append(connector.id, connector.system, observation); } catch {
      return jsonError(reply, 503, 'CONNECTOR_OBSERVATION_JOURNAL_UNAVAILABLE');
    }
    return reply.status(200).send({
      success: true,
      status: observation.status,
      toolSlug,
      toolkit,
      result: providerData,
      evidenceHash,
      observation,
      journal: { sequence: journalEntry.sequence, hash: journalEntry.hash, limitation: journalEntry.limitation },
      limitation: 'A Composio response is an observation only. This route does not independently verify provider data or authorize write actions.',
    });
  });
}
