import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { REPO_OUTWARD_ROLES, TOTAL_FLOW, TOTAL_FLOW_SKIPPED_DIRECTORIES, compressTotalFlow } from '../../packages/mini/src/ecosystem-body-equation.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../..');

const STAGE_IDS = [
  'math',
  'matrix',
  'equation',
  'total',
  'action',
  'execution',
  'work',
  'expand',
  'upgrade',
  'compress',
] as const;

test('the total flow is ten real stages in the declared order', () => {
  assert.equal(TOTAL_FLOW.length, STAGE_IDS.length);
  assert.deepEqual(
    TOTAL_FLOW.map((surface) => surface.id),
    [...STAGE_IDS],
  );
  const ids = TOTAL_FLOW.map((surface) => surface.id);
  const paths = TOTAL_FLOW.map((surface) => surface.path);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(new Set(paths).size, paths.length);
  for (const surface of TOTAL_FLOW) {
    assert.ok(REPO_OUTWARD_ROLES.includes(surface.role));
    assert.equal(surface.path.includes('..'), false);
    assert.ok(readFileSync(join(repoRoot, surface.path)).length > 0);
  }
});

test('this checkout compresses the ten stages and leaves the rest unobserved', () => {
  const report = compressTotalFlow(repoRoot);
  assert.equal(report.current, 'TOTAL_FLOW');
  assert.equal(report.stages, TOTAL_FLOW.length);
  assert.equal(report.status, 'COMPRESSED');
  assert.equal(report.halt, null);
  assert.match(report.digest ?? '', /^[0-9a-f]{64}$/);
  assert.equal(report.expansion, 'EXPANDED');
  assert.equal(report.reconciliation, 'VERIFIED');
  assert.equal(report.upgrade.execution, 'NOT_EXECUTED');
  assert.equal(report.upgrade.authority, 'compression-is-not-permission');
  assert.equal(report.upgrade.selected?.kind, 'review-verified-repo');
  assert.equal(report.upgrade.selected?.evidenceHash, report.digest);
  assert.equal(report.census.status, 'NOT_OBSERVED');
  assert.equal(report.census.declared, TOTAL_FLOW.length);
  assert.equal(report.census.declaredPresent, TOTAL_FLOW.length);
  assert.ok(report.census.treeFiles > TOTAL_FLOW.length);
  assert.ok(report.census.unobservedFiles > 0);
  assert.match(report.census.pathDigest, /^[0-9a-f]{64}$/);
  assert.deepEqual(report.census.skippedDirectories, [...TOTAL_FLOW_SKIPPED_DIRECTORIES]);
  assert.deepEqual(
    report.flow.map((entry) => entry.id),
    [...STAGE_IDS],
  );
});

test('a missing stage halts the flow and still does not observe the remainder', () => {
  const root = mkdtempSync(join(tmpdir(), 'omega-total-flow-'));
  try {
    for (const surface of TOTAL_FLOW.slice(0, -1)) {
      const file = join(root, surface.path);
      mkdirSync(join(file, '..'), { recursive: true });
      writeFileSync(file, `${surface.id}\n`);
    }
    writeFileSync(join(root, 'outside.txt'), 'not in the flow\n');
    const report = compressTotalFlow(root);
    assert.equal(report.status, 'HALTED');
    assert.equal(report.halt?.verdict, 'UNKNOWN');
    assert.equal(report.halt?.id, 'compress');
    assert.equal(report.upgrade.execution, 'NOT_EXECUTED');
    assert.equal(report.upgrade.selected, null);
    assert.equal(report.expansion, null);
    assert.equal(report.census.status, 'NOT_OBSERVED');
    assert.equal(report.census.unobservedFiles, 1);
    assert.equal(report.census.declaredPresent, TOTAL_FLOW.length - 1);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('release scripts and the verification job name the total flow and do not execute it', () => {
  const manifest = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8')) as {
    scripts: Record<string, string>;
  };
  assert.equal(
    manifest.scripts['flow:total'],
    'node --experimental-strip-types scripts/compress-total-flow.ts',
  );
  for (const name of ['test', 'test:e2e'] as const) {
    assert.ok(
      manifest.scripts[name].includes('./tests/integration/total-flow.integration.test.ts'),
      `${name} omits the total flow`,
    );
  }
  const workflow = readFileSync(join(repoRoot, '.github/workflows/verify.yml'), 'utf8');
  assert.match(workflow, /pnpm --silent flow:total/);
  assert.match(workflow, /total\.census\?\.status !== 'NOT_OBSERVED'/);
  assert.doesNotMatch(workflow, /upgrade\.execution\s*=\s*VERIFIED/);
});
