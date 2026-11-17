# DAV / OCEANICOS bounded architecture reference

**Provenance:** Derived from the user-provided `pasted_content.txt` attachment in this session (2026-11-17). This is an architecture brief, not a live repository, CI, service, or deployment observation. Treat repository-specific statements below as `USER-STATED`/`DOCUMENTED` until refreshed against the exact current checkout and runtime.

## Purpose and boundary

Use this reference when work concerns the DAV tensor, the `omega-v-oceanicos` repository, its UI/API/ledger/companion boundaries, or a related review or handoff. It supplements—not overrides—the root law, non-collapse contract, specialist skills, repository safeguards, and current user authorization in `../SKILL.md`.

The architecture is eight bounded planes, not eight autonomous agents or grants of permission:

1. **Surface — `apps/web` (attachment says port 3000):** intent/Δ capture, chat canvas, tensor heatmap visualization, and honest status presentation. UI badges must never imply verification without backend evidence; show `UNKNOWN` or `DIVERGENT` when dependencies or checks fail.
2. **Verification and lineage — `packages/verification`, `kai_ledger.json`:** deterministic invariant checks and canonical SHA-256 receipts. Fail closed on mismatches. Preserve append-only history; ordinary read/GET paths must not mutate the ledger.
3. **API spine — `apps/api` (attachment says port 5000):** Fastify routes and runtime contract. The attachment lists health, tensor, and chat routes and proposes `400` for invalid sizes, `422` for invariant divergence, and `503` for unavailable local inference. Treat these as expected contract only after inspecting current code/tests; never infer live route behavior from this document.
4. **DAV kernel — `packages/verification`:** pure deterministic 4D tensor `T[i,j,k,l] = i + j + k + l` for `N ∈ {4,6,8}`, projected as `row = i*N + j`, `column = k*N + l` to an `N² × N²` heatmap.
5. **Companion and voice — `companion/python`, local Ollama:** the attachment specifies a stdlib-only, execution-free Python evidence adapter, with no daemon, shell, network, or mutation rights, plus private local inference and no cloud fallback. Preserve these as design constraints when authorized; inspect current code/config before asserting they are satisfied or running anything.
6. **Memory loop — `kai_ledger.json`:** attachment proposes reading the last three verified entries and validated tensor metrics for local chat context. Validate JSON, receipt/hash semantics, and entry status before use; fail closed on integrity failure. Reading history does not authorize writing it. Keep context bounded and avoid unnecessary personal/sensitive data.
7. **Terminal execution gate:** use only a currently refreshed checkout and an explicitly authorized worker branch. Attachment lists `pnpm install --frozen-lockfile`, `pnpm format:check`, `pnpm build`, `pnpm typecheck`, `pnpm test`, and `pnpm verify:full`; first confirm the current repository defines these scripts and run the applicable gates. A green local run is not independent review, merge, deployment, or runtime health.
8. **Human root:** the human supplies finite intent, controls physical/repository authority and final merge decisions. Do not push to protected branches, merge, bypass review, alter the companion boundary, or deploy without the exact required authorization and specialist workflow.

## Mathematical reference values

The following values are derived from the formula above, not evidence that any implementation was tested:

| N | Projection | Minimum | Maximum | Mean | Sum/checksum |
|---|---:|---:|---:|---:|---:|
| 4 | 16 × 16 | 0 | 12 | 6 | 1,536 |
| 6 | 36 × 36 | 0 | 20 | 10 | 12,960 |
| 8 | 64 × 64 | 0 | 28 | 14 | 57,344 |

For these dimensions, each of the four indices ranges uniformly from `0` to `N-1`; therefore the mean is `2(N-1)` and the sum is `N⁴ × 2(N-1)`. A production receipt additionally needs the implementation's canonical serialization, hashing rules, tests, and observed output. Do not treat a matching sum alone as a cryptographic or runtime attestation.

## Execution and release safeguards

- Before repository action, refresh origin, branch/HEAD, working-tree changes, exact diff, current checks, branch protection, reviews, workflows, and any named deployment target. Preserve existing user work.
- Treat the attachment's Windows one-liner as **not approved for replay**. It force-kills all `node.exe` processes and uses `git checkout -B`, which can reset an existing branch reference; its displayed path also appears malformed/escaped. Never run it as a shortcut. Inspect processes and Git state first; use a non-destructive, uniquely named worker branch only when authorized.
- The listed port numbers, model name (`qwen2.5:0.5b`), routes, ledger behavior, and gate names are attachment claims, not live observations. Verify them at the exact source/config/runtime boundary before relying on them.
- A completed build/test suite is scoped evidence only. For PRs, respect independent-review and branch-protection rules; verify actual merge state and capture the merge SHA. For deployment, identify the exact provider/project/service/host, mechanism, smoke test, and rollback, then observe runtime separately.
- Stop at `REVIEW`/`UNKNOWN` when a material target, authority, dependency, integrity check, or recovery path is missing. Record failures and partial effects; do not convert them into success language.

## Compact DAV transition record

```text
Δ: human intent · exact repository/branch/target · scope/non-goals · authority
   current state · changes · gate names/results · stop condition · recovery
   expected vs observed · provenance/time · status · remaining UNKNOWN/DIVERGENT
```
