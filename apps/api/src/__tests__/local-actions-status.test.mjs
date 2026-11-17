import assert from 'node:assert/strict';
import test from 'node:test';

process.env.NODE_ENV = 'test';
process.env.OMEGA_DB_PATH = ':memory:';
process.env.OMEGA_PERSISTENCE = 'off';
process.env.OMEGA_AUTH_MODE = 'required';
process.env.OMEGA_READ_TOKEN = 'local-actions-test-read';
process.env.OMEGA_ADMIN_TOKEN = 'local-actions-test-admin';

const { createApp } = await import('../../dist/index.js');
const { API_ROUTE_INVENTORY } = await import('../route-contract.ts');

test('local-action status is read-only and fail-closed', async () => {
  const app = createApp(':memory:', false, { allowUnsignedCycle: true });

  try {
    await app.ready();

    const unauthenticated = await app.inject({ method: 'GET', url: '/v1/local-actions' });
    assert.equal(unauthenticated.statusCode, 401);
    assert.deepEqual(unauthenticated.json(), { success: false, error: 'READ_ACCESS_REQUIRED' });

    const readHeaders = { authorization: 'Bearer local-actions-test-read' };
    const status = await app.inject({ method: 'GET', url: '/v1/local-actions', headers: readHeaders });
    assert.equal(status.statusCode, 200);
    assert.deepEqual(status.json(), {
      success: true,
      enabled: false,
      actions: [],
      reason: 'LOCAL_RUNNER_DISABLED',
    });

    const runs = await app.inject({ method: 'GET', url: '/v1/local-actions/runs', headers: readHeaders });
    assert.equal(runs.statusCode, 200);
    assert.deepEqual(runs.json(), { success: true, enabled: false, runs: [] });

    assert.ok(API_ROUTE_INVENTORY.includes('GET /v1/local-actions'));
    assert.ok(API_ROUTE_INVENTORY.includes('GET /v1/local-actions/runs'));
    assert.equal(app.hasRoute({ method: 'POST', url: '/v1/local-actions/:actionId/run' }), false);
    const executionAttempt = await app.inject({
      method: 'POST',
      url: '/v1/local-actions/repo-status/run',
      headers: { authorization: 'Bearer local-actions-test-admin' },
    });
    assert.equal(executionAttempt.statusCode, 404);
  } finally {
    await app.close();
  }
});
