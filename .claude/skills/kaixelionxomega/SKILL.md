---
name: kaixelionxomega
description: Operate the KAI, ELION, and OMEGA loop as a compression toward one unexecuted upgrade. Use when Oceanicos work must stay evidence-bound and must not treat an answer as an upgrade.
---

# KAI × ELION × OMEGA

This skill is the operating contract for the loop in `apps/api/src/invisible-computer.ts` and `apps/api/src/execute-route.ts`. It does not grant authority, and it does not execute an upgrade.

```text
POSSIBLE → KAI OBSERVE → AUTHORITY → ELION EXECUTE → OMEGA VERIFY
→ KAI REMEMBER → COMPRESS → NOT_EXECUTED upgrade candidate | HALT
```

## States

- `VERIFIED` — the bounded answer recomputes to its SHA-256 digest and passes the contract checks.
- `DIVERGENT` — KAI Shield refused the intent, or a later digest does not match.
- `UNKNOWN` — the output is empty, the digest is broken, or a completion was fabricated.
- `NOT_EXECUTED` — authority was insufficient, memory was not written, or the compressed upgrade was not run.

## Law

`compressTowardUpgrade` may name one review candidate only after `VERIFIED` and a 64-hex digest. The candidate's execution is always `NOT_EXECUTED`. Compression is not permission. A selected id is not a merge, a deploy, or a change to the repository.

## What this skill refuses

- Treating the local composer or a model answer as proof of an external effect.
- Inventing evidence-backed value, risk, or cost. Ranking estimates stay in `selectAuthorizedNext`, and only when the caller supplies them.
- Remembering an outcome OMEGA did not verify.
- Widening `AUTONOMOUS` into a license to deploy, pay, delete, or publish.

## One cycle

Observe the repository and the loop's actual response. Compress one verified cycle into one unexecuted candidate, or stop. Run the execute-route test. Record what was not run. The next transition is a separate authorized change.

## Continuum contract

Treat this skill as one bounded organ in the repository continuum. Preserve the shared flow while keeping domain authority and specialist detail local:

`SOURCE → INTENT → AUTHORITY → ADMIT → BOUNDED ACTION → OBSERVE → RECONCILE → ATTEST → PROVENANCE → NEXT FINITE Δ`

Keep capability separate from authority, proposal separate from execution, test separate from runtime, and memory or hashes separate from truth. Preserve `UNKNOWN`, `DIVERGENT`, `NOT_EXECUTED`, and `REVIEW`; a handoff must carry intent, scope, authority, current state, evidence, uncertainty, recovery, and one next finite step. This skill may guide or route work but never grants permission for external mutation, and `∞` means repeated finite transitions rather than unlimited autonomy.
