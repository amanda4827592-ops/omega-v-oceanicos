import { describe, it, expect, beforeAll, afterAll } from '../../../../tests/support/jest-compat.mjs';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  appendEvent,
  emptySnapshot,
  loadSnapshot,
  readEventLog,
  saveSnapshot,
} from '../../dist/persistence.js';

/**
 * Four branches in `persistence.ts` report `error instanceof Error ?
 * error.message : '<generic fallback>'`. They exist so a real failure (disk
 * unavailable, permissions, a wrong decryption key) surfaces its own
 * diagnostic instead of a generic string.
 *
 * The suite that used to cover them needed `jest.mock` to forge same-realm
 * Errors, because Jest's vm context made Node's own fs/crypto errors fail the
 * `instanceof` check. Those mocks have no counterpart in the `node:test`
 * runner this repository now uses — and the premise is gone with them: under
 * native Node every error is same-realm. So these tests drive genuine
 * failures through the real fs and crypto bindings, which is what the
 * branches exist to handle, and assert the specific message reached the
 * caller rather than the fallback.
 */
describe('persistence failure messages', () => {
  let dir: string;

  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), 'omega-persistence-failure-'));
  });

  afterAll(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('loadSnapshot surfaces a real read-failure message, not the fallback', () => {
    const storePath = join(dir, 'snapshot-is-a-directory');
    mkdirSync(storePath, { recursive: true });

    const result = loadSnapshot(storePath, true);

    expect(result.source).toBe('missing');
    expect(result.reason).not.toBe('store could not be read');
    expect(result.reason).toMatch(/EISDIR|directory/i);
  });

  it('appendEvent surfaces a real append-failure message, not the fallback', () => {
    const logPath = join(dir, 'log-is-a-directory');
    mkdirSync(logPath, { recursive: true });

    const result = appendEvent(logPath, { id: 'evt-1' }, true);

    expect(result.appended).toBe(false);
    expect(result.reason).not.toBe('append failed');
    expect(result.reason).toMatch(/EISDIR|directory/i);
  });

  it('readEventLog surfaces a real read-failure message, not the fallback', () => {
    const logPath = join(dir, 'log-read-is-a-directory');
    mkdirSync(logPath, { recursive: true });

    const result = readEventLog(logPath, true);

    expect(result.source).toBe('missing');
    expect(result.reason).not.toBe('log could not be read');
    expect(result.reason).toMatch(/EISDIR|directory/i);
  });

  it('loadSnapshot surfaces the real decryption-failure message for a wrong key', () => {
    const storePath = join(dir, 'wrong-key.json');
    saveSnapshot(storePath, emptySnapshot(), true, 'correct-secret');

    const result = loadSnapshot(storePath, true, 'wrong-secret');

    expect(result.source).toBe('corrupt');
    expect(result.reason).not.toBe('store could not be decrypted');
    expect((result.reason ?? '').length).toBeGreaterThan(0);
  });
});
