import { describe, it, expect, beforeAll, afterAll } from '../../../../tests/support/jest-compat.mjs';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp } from '../../dist/index.js';
import {
  appendEvent,
  emptySnapshot,
  loadSnapshot,
  readEventLog,
  saveSnapshot,
} from '../../dist/persistence.js';

/**
 * `POST /persistence/reencrypt` is the only route that rewrites every stored
 * record from the previous key to the current one. Its route-level behaviour
 * — the readiness gate, the reason bound, and the actual rotation — survived
 * the Express→Fastify move untested: the suite that covered it drove retired
 * routes through an Express harness.
 *
 * These tests call the live `createApp` surface and read the store back with
 * `loadSnapshot`/`readEventLog`, so "the response said success" is not the
 * evidence; the bytes on disk are.
 */
describe('persistence re-encryption route', () => {
  let dir: string;

  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), 'omega-reencrypt-route-'));
  });

  afterAll(() => {
    rmSync(dir, { recursive: true, force: true });
    for (const name of [
      'OMEGA_PERSISTENCE',
      'OMEGA_PERSISTENCE_KEY',
      'OMEGA_PERSISTENCE_KEY_PREVIOUS',
      'OMEGA_RUNTIME_STORE_PATH',
      'OMEGA_EVENT_LOG_PATH',
    ]) {
      delete process.env[name];
    }
  });

  const withServer = async (
    run: (app: ReturnType<typeof createApp>, paths: { storePath: string; logPath: string }) => Promise<void>
  ) => {
    const runDir = mkdtempSync(join(dir, 'run-'));
    const storePath = join(runDir, 'runtime.json');
    const logPath = join(runDir, 'runtime.log.jsonl');
    saveSnapshot(storePath, emptySnapshot(), true, 'previous-secret');
    appendEvent(logPath, { id: 'evt-previous' }, true, 'previous-secret');

    process.env.OMEGA_PERSISTENCE = 'on';
    process.env.OMEGA_RUNTIME_STORE_PATH = storePath;
    process.env.OMEGA_EVENT_LOG_PATH = logPath;

    const app = createApp(join(runDir, 'ledger.db'), false);
    try {
      await app.ready();
      await run(app, { storePath, logPath });
    } finally {
      await app.close();
    }
  };

  it('refuses to rotate when no previous key is configured', async () => {
    process.env.OMEGA_PERSISTENCE_KEY = 'current-secret';
    delete process.env.OMEGA_PERSISTENCE_KEY_PREVIOUS;

    await withServer(async (app) => {
      const response = await app.inject({
        method: 'POST',
        url: '/persistence/reencrypt',
        payload: { reason: 'rotate local persistence to the current key' },
      });

      expect(response.statusCode).toBe(409);
      expect(response.json().error).toBe('PERSISTENCE_REENCRYPTION_NOT_READY');
    });
  });

  it('rejects a reason outside the documented bounds', async () => {
    process.env.OMEGA_PERSISTENCE_KEY = 'current-secret';
    process.env.OMEGA_PERSISTENCE_KEY_PREVIOUS = 'previous-secret';

    await withServer(async (app) => {
      const response = await app.inject({
        method: 'POST',
        url: '/persistence/reencrypt',
        payload: { reason: 'short' },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().error).toBe('INVALID_REENCRYPTION_REASON');
    });
  });

  it('rotates complete previous-key evidence to the current key', async () => {
    process.env.OMEGA_PERSISTENCE_KEY = 'current-secret';
    process.env.OMEGA_PERSISTENCE_KEY_PREVIOUS = 'previous-secret';

    await withServer(async (app, { storePath, logPath }) => {
      const response = await app.inject({
        method: 'POST',
        url: '/persistence/reencrypt',
        payload: { reason: 'rotate local persistence to the current key' },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json() as {
        success: boolean;
        reencrypt: {
          rewritten: boolean;
          snapshotRecords: number;
          eventRecords: number;
          snapshotKeySource: string;
          eventLogKeySource: string;
        };
      };
      expect(body.success).toBe(true);
      expect(body.reencrypt.rewritten).toBe(true);
      expect(body.reencrypt.snapshotRecords).toBe(0);
      // Booting the app appends its own lifecycle events, so the count is
      // bounded below by the seeded record rather than pinned to it.
      expect(body.reencrypt.eventRecords).toBeGreaterThanOrEqual(1);
      expect(body.reencrypt.snapshotKeySource).toBe('previous');
      expect(body.reencrypt.eventLogKeySource).not.toBe('none');

      const snapshot = loadSnapshot(storePath, true, 'current-secret');
      expect(snapshot.keySource).toBe('current');
      expect(snapshot.source).toBe('restored');

      const log = readEventLog<{ id?: string }>(logPath, true, 'current-secret');
      expect(log.source).toBe('restored');
      expect(log.entries).toEqual(expect.arrayContaining([expect.objectContaining({ id: 'evt-previous' })]));
    });
  });
});
