import { describe, it, expect } from '../../../../tests/support/jest-compat.mjs';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { API_ROUTE_INVENTORY } from '../../dist/route-contract.js';

/**
 * Documentation drift is a correctness problem, not a cosmetic one: an
 * operator who cannot find a route in the README concludes it does not exist.
 *
 * The earlier version of this suite parsed `app.get(...)` — an Express-era
 * surface the API no longer uses — so after the move to Fastify it found zero
 * routes, failed its own "finds the routes it is meant to check" guard, and
 * never ran again. It also checked a startup banner that no longer exists.
 *
 * This version reads the shipped contract (`route-contract.ts`, the same
 * inventory `route-inventory.test.ts` requires `createApp` to register) and
 * holds the README to it in both directions: every supported route is
 * documented, and the README advertises no route the server does not serve.
 */
describe('API documentation', () => {
  const root = process.cwd();
  const readme = readFileSync(join(root, 'apps/api/README.md'), 'utf8');

  const advertised = new Set(
    Array.from(readme.matchAll(/\b(GET|POST)\s+(\/[A-Za-z0-9:/*_.-]*)/g)).map(
      (match) => `${match[1]} ${match[2]}`
    )
  );

  it('finds routes in the shipped contract it is meant to check', () => {
    expect(API_ROUTE_INVENTORY.length).toBeGreaterThan(20);
    expect(advertised.size).toBeGreaterThan(20);
  });

  it('documents every supported route', () => {
    const undocumented = API_ROUTE_INVENTORY.filter((route) => !advertised.has(route));
    expect(undocumented).toEqual([]);
  });

  it('advertises nothing the server does not serve', () => {
    const supported = new Set<string>(API_ROUTE_INVENTORY);
    expect([...advertised].filter((route) => !supported.has(route))).toEqual([]);
  });

  it('documents the environment variables the API depends on', () => {
    for (const variable of [
      'OMEGA_AUTH_MODE',
      'OMEGA_READ_TOKEN',
      'OMEGA_ADMIN_TOKEN',
      'OMEGA_PERSISTENCE',
      'OMEGA_RUNTIME_STORE_PATH',
      'OMEGA_EVENT_LOG_PATH',
      'OMEGA_LOCAL_JOB_LEDGER',
    ]) {
      expect(readme).toContain(variable);
    }
  });

  it('does not advertise a signing key value', () => {
    expect(readme).not.toContain('key-2026-08-production-v1');
    expect(readme.toLowerCase()).not.toMatch(/"signingkey":\s*"(?!sha256:)/);
  });
});
