import type { FastifyInstance } from 'fastify';

export function registerLocalActionsStatusRoutes(fastify: FastifyInstance): void {
  fastify.get('/v1/local-actions', async () => ({
    success: true,
    enabled: false,
    actions: [],
    reason: 'LOCAL_RUNNER_DISABLED',
  }));

  fastify.get('/v1/local-actions/runs', async () => ({
    success: true,
    enabled: false,
    runs: [],
  }));
}
