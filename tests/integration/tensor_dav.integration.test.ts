import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { computeTensorDav, expectedTensorDavStats, verifyTensorDav } from '../../packages/verification/dist/index.js';
import { createApp } from '../../apps/api/dist/index.js';

test('Tensor DAV verifies all supported sizes and exact projections', () => {
  for (const size of [4, 6, 8] as const) {
    const result = computeTensorDav(size);
    assert.equal(result.status, 'VERIFIED');
    assert.deepEqual(result.stats, expectedTensorDavStats(size));
    assert.deepEqual([result.projection.length, result.projection[0].length], [size * size, size * size]);
    assert.equal(result.receipt?.algorithm, 'sha256');
    assert.match(result.receipt?.digest ?? '', /^[a-f0-9]{64}$/);
  }
});

test('Tensor DAV detects a divergent invariant without weakening the result', () => {
  const result = computeTensorDav(4);
  const divergent = verifyTensorDav({
    ...result,
    receipt: undefined,
    stats: { ...result.stats, checksum: result.stats.checksum + 1 },
  });
  assert.equal(divergent.status, 'DIVERGENT');
  assert.equal(divergent.reason, 'tensor statistical invariant diverged');
});

test('Tensor DAV API is verified for supported sizes and fail-closed for invalid input', async (t) => {
  const directory = await mkdtemp(join(tmpdir(), 'omega-tensor-dav-'));
  const app = createApp(join(directory, 'api.db'), false);
  const ledgerPath = join(process.cwd(), 'kai_ledger.json');
  const ledgerBefore = await readFile(ledgerPath);
  t.after(async () => {
    await app.close();
    await rm(directory, { recursive: true, force: true });
  });
  for (const size of [4, 6, 8]) {
    const response = await app.inject({ method: 'GET', url: `/api/tensor/${size}` });
    assert.equal(response.statusCode, 200);
    const body = response.json();
    assert.equal(body.data.status, 'VERIFIED');
    assert.equal(body.data.stats.checksum, expectedTensorDavStats(size).checksum);
  }
  const direct = await app.inject({ method: 'GET', url: '/tensor/4' });
  assert.equal(direct.statusCode, 200);
  assert.equal(direct.json().data.receipt.status, 'VERIFIED');
  const invalid = await app.inject({ method: 'GET', url: '/api/tensor/5' });
  assert.equal(invalid.statusCode, 400);
  assert.equal(invalid.json().error, 'UNKNOWN');
  assert.deepEqual(await readFile(ledgerPath), ledgerBefore, 'ordinary tensor GETs must not mutate kai_ledger.json');
});
