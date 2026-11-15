import { describe, it, expect } from '../../../../tests/support/jest-compat.mjs';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * A suite that exists but is never run is not coverage — it is the appearance
 * of it. Sixteen API suites had accumulated in this directory while
 * `pnpm test:api` ran only seven; some had not executed once since the API
 * moved to Fastify.
 *
 * This guard makes that state impossible to re-enter silently: every suite
 * file in this directory must be listed in the root `test:api` script, and the
 * script must not list a file that does not exist. Adding a suite without
 * wiring it fails here instead of being discovered months later.
 */
describe('API test-suite inventory', () => {
  const root = process.cwd();
  const directory = join(root, 'apps/api/src/__tests__');
  const suites = readdirSync(directory)
    .filter((name) => name.endsWith('.test.ts'))
    .map((name) => `apps/api/src/__tests__/${name}`)
    .sort();

  const script = (JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as {
    scripts: Record<string, string>;
  }).scripts['test:api'];
  const wired = Array.from(script.matchAll(/\.\/apps\/api\/src\/__tests__\/[A-Za-z0-9._-]+\.test\.ts/g))
    .map((match) => match[0].replace(/^\.\//, ''))
    .sort();

  it('finds the suites and the script it is meant to check', () => {
    expect(suites.length).toBeGreaterThan(5);
    expect(wired.length).toBeGreaterThan(5);
  });

  it('runs every suite in this directory', () => {
    expect(suites.filter((suite) => !wired.includes(suite))).toEqual([]);
  });

  it('does not name a suite that no longer exists', () => {
    expect(wired.filter((suite) => !suites.includes(suite))).toEqual([]);
  });
});
