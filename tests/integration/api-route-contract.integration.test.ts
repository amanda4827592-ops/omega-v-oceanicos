import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import { createApp } from '../../apps/api/dist/index.js';
import {
  API_ROUTE_INVENTORY,
  parseApiRouteContract,
  validateApiRouteInventory,
} from '../../apps/api/src/route-contract.ts';

test('compiled API registers every inventoried method/path pair', async () => {
  validateApiRouteInventory();
  const directory = mkdtempSync(join(tmpdir(), 'omega-api-route-contract-'));
  const app = createApp(join(directory, 'ledger.db'), false, { allowUnsignedCycle: true });

  try {
    await app.ready();
    const missing = API_ROUTE_INVENTORY.filter((contract) => {
      const { method, path } = parseApiRouteContract(contract);
      return !app.hasRoute({ method, url: path });
    });

    assert.deepEqual(missing, [], `missing compiled routes: ${missing.join(', ')}`);
    assert.ok(API_ROUTE_INVENTORY.length > 0);
  } finally {
    await app.close();
    rmSync(directory, { recursive: true, force: true });
  }
});

test('route inventory rejects malformed and duplicate method/path contracts', () => {
  assert.throws(() => parseApiRouteContract('PATCH /v1/unsupported'), /invalid API route contract/);
  assert.throws(() => parseApiRouteContract('GET v1/missing-leading-slash'), /invalid API route contract/);
  assert.throws(
    () => validateApiRouteInventory(['GET /health', 'GET /health']),
    /duplicate API route contract: GET \/health/,
  );
});

test('compiled API serves JavaScript and CSS assets with browser-compatible MIME types', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'omega-api-static-mime-'));
  const distDir = join(directory, 'dist');
  mkdirSync(join(distDir, 'assets'), { recursive: true });
  writeFileSync(join(distDir, 'assets', 'app.js'), 'export const verified = true;');
  writeFileSync(join(distDir, 'assets', 'app.css'), 'body { color: #000; }');
  const previousWebDist = process.env.OMEGA_WEB_DIST;
  process.env.OMEGA_WEB_DIST = distDir;
  const app = createApp(join(directory, 'api.db'), false);

  try {
    await app.ready();
    const javascript = await app.inject({ method: 'GET', url: '/assets/app.js' });
    assert.equal(javascript.statusCode, 200);
    assert.match(javascript.headers['content-type'] ?? '', /^text\/javascript(?:;|$)/);
    assert.equal(javascript.body, 'export const verified = true;');

    const stylesheet = await app.inject({ method: 'GET', url: '/assets/app.css' });
    assert.equal(stylesheet.statusCode, 200);
    assert.match(stylesheet.headers['content-type'] ?? '', /^text\/css(?:;|$)/);
    assert.equal(stylesheet.body, 'body { color: #000; }');
  } finally {
    await app.close();
    if (previousWebDist === undefined) delete process.env.OMEGA_WEB_DIST;
    else process.env.OMEGA_WEB_DIST = previousWebDist;
    rmSync(directory, { recursive: true, force: true });
  }
});
