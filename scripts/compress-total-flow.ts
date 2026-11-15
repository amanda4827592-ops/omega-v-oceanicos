import { compressTotalFlow } from '../packages/mini/src/ecosystem-body-equation.ts';

const root = process.argv[2] ?? process.cwd();
const report = compressTotalFlow(root);

process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (
  report.status === 'COMPRESSED' &&
  report.expansion === 'EXPANDED' &&
  report.reconciliation === 'VERIFIED' &&
  report.census.status === 'NOT_OBSERVED' &&
  report.upgrade.execution === 'NOT_EXECUTED'
) {
  process.exit(0);
}
if (report.status === 'HALTED') process.exit(2);
process.exit(1);
