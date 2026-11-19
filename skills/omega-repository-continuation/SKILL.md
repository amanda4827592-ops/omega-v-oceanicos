---
name: omega-repository-continuation
description: "Evidence-bound continuation of an existing repository task: re-anchor Git and governance state, inspect workers and ledgers, choose one finite delta, diagnose toolchain and wrapper failures, make the smallest authorized contract-aligned change, run layered full-stack verification, and report exact state boundaries. Use for /next, continue, full-stack repo work, Ω∞v/OCEANICOS transitions, worker handoffs, stale acceptance gates, test-contract drift, and reality-first repository upgrades."
---

# Ω Repository Continuation

Continue an existing repository task as a bounded copilot. Reconstruct current reality before acting, preserve human and worker authority, select exactly one useful finite transition, verify it at the relevant boundaries, and keep `UNKNOWN`, `DIVERGENT`, `NOT_EXECUTED`, and `REVIEW` visible.

This skill produces a verified working-tree state and evidence record. It does not silently commit, push, merge, deploy, append a ledger receipt, install undeclared dependencies, or turn a green test into production health.

## State contract

Keep these states separate:

```text
SOURCE → RE-ANCHORED → PROPOSED → PERMITTED → ATTEMPTED
→ EXECUTED → OBSERVED → LOCAL_VERIFIED | DIVERGENT | UNKNOWN
→ REVIEW / COMMIT / RECEIPT / PUSH / MERGE / DEPLOY
```

A passing command proves only its observed scope. A build is not runtime health; a local test is not CI; a merge is not deployment; a ledger hash is not reality. Use precise labels such as `USER-STATED`, `DOCUMENTED`, `OBSERVED`, `SUPPORTED`, `LOCAL_VERIFIED`, `DIVERGENT`, `UNKNOWN`, `NOT_EXECUTED`, and `REVIEW`.

## Finite continuation workflow

### 1. Frame the transition

Preserve the user's literal intent, repository target, beneficiary, constraints, non-goals, and permission. Convert it into one contract:

```text
Δ:
  identity: bounded repository copilot
  target: exact checkout, branch, HEAD, and relevant files
  intent: one observable result
  scope: included files, gates, and environments
  exclusions: unrelated domains, secrets, publication, deployment, and broad cleanup
  authority: exact user permission and protected workflow boundary
  expected: concrete output or test result
  stop: missing authority, dirty-scope conflict, failed gate, or material divergence
  recovery: preserve worktree; keep generated evidence outside the repo
```

Treat words such as `next`, `continue`, `full stack`, `autopilot`, or `sovereign` as permission to continue safe bounded work, not as permission to bypass review, protections, or irreversible actions.

### 2. Re-anchor before replaying history

In the target checkout inspect:

```bash
git remote -v
git fetch origin <target-ref>                 # only when refreshing the remote is in scope
git branch --show-current
git log -1 --oneline --decorate
git status --short --untracked-files=all
git diff --check
```

Read current repository instructions, assignment/worker files, package manifests, lockfile, relevant ledger schema and latest receipts, and the exact target test or implementation. Historical logs are leads, not current proof. Never replay old commands automatically.

Preserve unexpected dirty files. If the worktree contains unrelated changes, isolate the authorized delta on a worker branch or stop for review; never reset, clean, stash, or overwrite user work without explicit authorization.

### 3. Select one finite delta

Prefer the repository's declared next assignment or latest ledger `next_delta`. Inspect the named code and its public contract before choosing implementation versus test correction.

Use this decision tree:

- **Acceptance command unavailable:** inspect package scripts, workspace manifests, lockfile, and installed binaries. Use an existing locked workspace-local tool if possible. Do not install undeclared dependencies merely to make a gate green.
- **Runner wrapper exits nonzero:** inspect stage markers and direct exit codes. Do not treat a large pass stream as success until the failing stage is isolated. Avoid `PIPESTATUS` under `set -u`; run gates individually or capture status immediately and safely.
- **Test reaches execution and fails on a field shape:** inspect the producer and shared contract. If the implementation matches the public contract and the test expects an internal/private shape, make the smallest authorized test-contract correction. If the implementation diverges, fix the implementation only within the assignment boundary.
- **A required gate is blocked by another domain:** preserve `UNKNOWN` or `REVIEW`; do not widen scope or modify package/tooling files unless explicitly authorized.
- **All gates pass:** do not invent another code change. Record the state and select review/commit as the next transition.

### 4. Apply the smallest authorized change

Inspect at least three unchanged context lines before editing. Keep changes narrow and reversible. For test-contract drift, prefer an assertion that matches the public response schema rather than exposing internal state. Do not weaken assertions, disable diagnostics, add broad catches, or alter security boundaries to hide a failure.

Temporary runner configurations, shims, logs, and reports belong outside the checkout. If a temporary configuration is needed to diagnose an existing toolchain, label its scope and never mistake it for repository configuration.

Do not modify ledgers on read paths. Do not append a receipt for an uncommitted change. Do not commit on protected `main` by default; use the repository's worker-branch and review policy.

### 5. Verify progressively

Run the narrowest relevant check first, then the broader spine. Use repository-native commands and record exact working directory, commit, tool versions, timestamp, exit code, counts, warnings, and artifacts.

Typical sequence, adapting to the repository:

```bash
pnpm install --frozen-lockfile
pnpm format:check
pnpm validate:ci
pnpm validate:docs
pnpm validate:skills
pnpm validate:swarm
pnpm typecheck
pnpm build
pnpm test
pnpm verify:full
```

For API or gateway work also run the focused test, package build, admission/observation/authorization regressions, and any documented runtime smoke path. A local totality or smoke result remains local evidence only. Observe actual response shapes, health fields, ledger state, and worktree changes; do not infer hosted health.

When a shell wrapper fails after successful stages, rerun the affected commands directly and report both facts: the wrapper failure and the independently observed gate result. Never erase an earlier failure; explain the correction and rerun.

### 6. Reconcile and classify

Compare expected versus observed results. Classify each relevant surface:

| Surface | State | Evidence boundary |
| --- | --- | --- |
| Focused behavior | `LOCAL_VERIFIED`, `DIVERGENT`, or `UNKNOWN` | Exact test and response contract |
| Package/build | `LOCAL_VERIFIED` or failure | Build/typecheck scope |
| Repository contracts | `LOCAL_VERIFIED` | CI/docs/skills/swarm checks |
| Full stack | `LOCAL_VERIFIED` | Full test/totality commands |
| CI/deployment/production | `UNKNOWN` unless separately observed | Never inferred from local gates |
| Commit/receipt/push/merge | Exact state only | Git and remote evidence |

Check `git diff --check`, intended diff scope, generated files, secrets, and `git fsck --full --no-reflogs`. Preserve the final dirty state if a review/commit gate remains.

### 7. Record evidence

Keep generated reports and logs outside the repository. Use a concise report containing:

```text
TRUTH: strongest scoped finding
EVIDENCE: repository, ref/commit, timestamp, exact commands, counts, warnings, artifacts
ACTION: proposed/attempted/executed; committed/pushed/merged/deployed or not
CHANGE: exact files and why
STATE: LOCAL_VERIFIED | SUPPORTED | DIVERGENT | UNKNOWN | REVIEW | HALTED
LIMITS: unrun gates, wrapper issues, runtime/deployment boundary, risks, rollback
NEXT Δ: exactly one finite action and its prerequisite
```

Include an explicit non-action list: no secrets used, no unrelated mutation, no ledger append, no commit, no push, no merge, no deployment, or no persistent service unless observed and authorized.

## Commit, ledger, and external boundaries

A passing working tree is not permission to commit. Before committing:

1. obtain human review/authorization for the exact diff and worker branch;
2. preserve the base commit and inspect `git diff --stat`, `git diff --check`, and status;
3. commit only the scoped change using repository attribution rules;
4. rerun required post-commit gates;
5. append one ledger receipt only when the repository contract requires it and the committed diff/gates satisfy that contract;
6. verify receipt integrity and prior-entry preservation;
7. keep push, PR, merge, and deployment as separate explicitly authorized transitions.

Never claim `COMMITTED`, `PUSHED`, `MERGED`, `DEPLOYED`, `HEALTHY`, or `CORRECT` without current evidence for that exact state.

## Return format

For consequential continuation work, return exactly this shape:

```text
TRUTH: ...
EVIDENCE: ...
ACTION: ...
STATE: ...
LIMITS: ...
NEXT Δ: ...
```

End with one actionable next step. If no safe transition is justified, use `REVIEW`, `PAUSE`, or `STOP` rather than inventing work.
