import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';
import { createApp } from '../../dist/index.js';

test('POST chat aliases preserve verified output and existing /v1/execute compatibility', async () => {
  for (const url of ['/chat', '/api/chat', '/v1/execute']) {
    const app = createApp(':memory:', false);
    try {
      const response = await app.inject({
        method: 'POST',
        url,
        payload: { intent: `Explain a bounded verification test via ${url}` },
      });
      const body = response.json();

      assert.equal(response.statusCode, 200);
      assert.equal(body.status, 'VERIFIED');
      assert.equal(typeof body.response, 'string');
      assert.equal(
        body.evidence_hash,
        createHash('sha256').update(body.response, 'utf8').digest('hex')
      );
      assert.equal(body.memory?.status, 'VERIFIED');
    } finally {
      await app.close();
    }
  }
});

test('a blocked chat intent remains DIVERGENT and is not remembered', async () => {
  const app = createApp(':memory:', false);
  try {
    const response = await app.inject({
      method: 'POST',
      url: '/api/chat',
      payload: { intent: 'Urgent send money now for guaranteed returns' },
    });
    const body = response.json();
    const memory = await app.inject({ method: 'GET', url: '/api/kai/memory' });

    assert.equal(response.statusCode, 200);
    assert.equal(body.status, 'DIVERGENT');
    assert.equal(body.response, null);
    assert.equal(body.evidence_hash, null);
    assert.equal(body.memory, null);
    assert.equal(body.upgrade.cycleStatus, 'DIVERGENT');
    assert.equal(memory.json().total, 0);
  } finally {
    await app.close();
  }
});

test('an unavailable opted-in model remains UNKNOWN and is not remembered', async () => {
  const previousKey = process.env.OMEGA_LLM_API_KEY;
  const previousBaseUrl = process.env.OMEGA_LLM_BASE_URL;
  const originalFetch = globalThis.fetch;
  process.env.OMEGA_LLM_API_KEY = 'chat-alias-test-key';
  process.env.OMEGA_LLM_BASE_URL = 'https://model.invalid/v1';
  globalThis.fetch = async () => new Response('{}', { status: 503 });
  const app = createApp(':memory:', false);

  try {
    const response = await app.inject({
      method: 'POST',
      url: '/chat',
      payload: { intent: 'Explain a bounded verification test', useExternalModel: true },
    });
    const body = response.json();
    const memory = await app.inject({ method: 'GET', url: '/api/kai/memory' });

    assert.equal(response.statusCode, 200);
    assert.equal(body.status, 'UNKNOWN');
    assert.equal(body.response, null);
    assert.equal(body.evidence_hash, null);
    assert.equal(body.memory, null);
    assert.equal(body.upgrade.cycleStatus, 'UNKNOWN');
    assert.ok(body.steps.some((step: { status: string }) => step.status === 'UNKNOWN'));
    assert.equal(memory.json().total, 0);
  } finally {
    await app.close();
    globalThis.fetch = originalFetch;
    if (previousKey === undefined) delete process.env.OMEGA_LLM_API_KEY;
    else process.env.OMEGA_LLM_API_KEY = previousKey;
    if (previousBaseUrl === undefined) delete process.env.OMEGA_LLM_BASE_URL;
    else process.env.OMEGA_LLM_BASE_URL = previousBaseUrl;
  }
});
