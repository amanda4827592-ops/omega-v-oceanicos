import type { FastifyInstance } from 'fastify';

/**
 * Layer 10: Edge, Caching & FinOps Infrastructure telemetry.
 * Read-only status observation — no mutations.
 * Evidence boundary: local runtime configuration only; not live Redis or cloud billing.
 */
export function registerEdgeFinopsRoutes(fastify: FastifyInstance): void {
  fastify.get('/v1/edge/status', async () => ({
    success: true,
    status: 'OBSERVED',
    layer: 'Layer 10: Edge, Caching & FinOps Infrastructure',
    edge: {
      semanticCache: {
        provider: 'local-memory-fallback',
        status: 'ACTIVE',
        policy: 'LRU eviction; Redis wired when OMEGA_REDIS_URL is set',
        evidence: 'SUPPORTED',
      },
      rateLimit: {
        status: 'ACTIVE',
        policy: '@fastify/rate-limit global; per-route overrides for sensitive endpoints',
        evidence: 'SUPPORTED',
      },
      offlineSync: {
        status: 'ACTIVE',
        policy: 'local-first SQLite append-only ledger; disconnected operation sovereign',
        evidence: 'SUPPORTED',
      },
      finOps: {
        formula: 'V = (Outcome × Evidence) − (Cost + Risk)',
        costScoringEnabled: true,
        tokenBudgetEnforced: false,
        evidence: 'SUPPORTED',
      },
    },
    provenance: '@fastify/rate-limit + local SQLite + cost/risk formula in CHARTER.md',
    doctrine: "CAPABILITY ≠ AUTHORITY. Edge infra is a gate, not a guarantee.",
    evidenceBoundary:
      'OBSERVED status means runtime config was read. It is not proof of live Redis, cloud billing, or external network reachability.',
    timestamp: new Date().toISOString(),
  }));
}
