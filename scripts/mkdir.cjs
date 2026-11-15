const { mkdirSync } = require('node:fs');

/**
 * Portable directory creation for package scripts.
 *
 * `mkdir -p` is not available in a Windows shell. Pair with
 * scripts/rimraf.cjs when a script needs an empty directory.
 *
 * Usage: node scripts/mkdir.cjs coverage
 */
const targets = process.argv.slice(2);

if (targets.length === 0) {
  console.error('mkdir.cjs: expected at least one directory');
  process.exit(1);
}

for (const target of targets) {
  mkdirSync(target, { recursive: true });
}
