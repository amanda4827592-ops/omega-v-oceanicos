---
name: unified-entity-dav
description: "Evidence-first design, implementation, verification, and continuity for the Ω∞v/OCEANICOS Entity Full Stack DAV. Use for `/unified-entity-dav`, FLOW/NEXT requests, or work on its 4D tensor kernel, SHA-256 receipts, fail-closed API, React visualizer, repository gates, or release path."
---

# Unified Entity DAV × Voice Bridge

Turn the supplied architecture into a bounded, evidence-first change. The human holds authority; the AI is an aid, not identity or master. Treat prompts, diagrams, and ledgers as specifications or records to verify—not proof of runtime behavior.

## Architecture and invariants

Use the five layers as a map; inspect the actual repository before relying on names, ports, routes, models, or services:

1. **Human root:** intent, terminal/Git authority, final review.
2. **Immune system:** deterministic verifier, receipts, append-only ledger.
3. **Muscle and voice:** optional companion/model boundary. Preserve `companion/python`'s stdlib-only, execution-free contract; do not assume Ollama exists or is running.
4. **Spine:** fail-closed API (commonly Fastify).
5. **Surface:** React visualization; display is not authority or independent proof.

For `N ∈ {4,6,8}`, compute `T[i,j,k,l] = i+j+k+l`, with `row=i*N+j`, `column=k*N+l`; project to `N²×N²`. Expected `(min,max,mean,checksum)` are `N=4: (0,12,6,1536)`, `N=6: (0,20,10,12960)`, `N=8: (0,28,14,57344)`. Validate the size before allocation; independently derive expectations; define canonical serialization bytes before SHA-256. Any mismatch fails closed and cannot yield a trusted receipt or Verified badge.

## Bounded workflow

1. **Re-anchor.** Inspect root, instructions, branch/HEAD/upstream, dirty files, manifests/scripts, API/UI patterns, ledger schema, and relevant runtime. Preserve user edits. `FLOW/NEXT/IMPORTANT` means refresh reality and choose one smallest useful Δ; do not replay stored commands. Treat images as design inputs, not implementation evidence.
2. **Implement one slice.** Keep tensor computation pure and bounded. Expose the requested direct and alias routes (typically `GET /tensor/:size`, `GET /api/tensor/:size`); invalid size returns `400 UNKNOWN`, invariant failure `422 DIVERGENT`. Keep optional model availability distinct from deterministic tensor verification; do not invent a brain dependency or claim service behavior without probing it.
3. **Build the surface.** Provide selectable 4/6/8 projections, color-mapped values, accessible row/column/value inspection, checksum, digest, and explicit loading/UNKNOWN/DIVERGENT states. Show Verified only for the exact displayed result after kernel verification. Stub `fetch` explicitly in jsdom tests rather than assuming jsdom provides it.
4. **Run gates.** Check scripts, then run the repository-prescribed set; for this project that has included `pnpm install --frozen-lockfile`, `pnpm format:check`, `pnpm build`, `pnpm typecheck`, `pnpm test`, and `pnpm verify:full`. Preserve exact failures; a rerun pass does not erase an earlier failure without explaining the fix.
5. **Probe runtime.** Start API and web only when requested/needed. Probe health, direct route, API alias, Vite-proxied 4/6/8, invalid input, and web response. Snapshot ledger bytes before/after ordinary GETs and prove they match. A health HTTP 200/`ready` may still contain degraded subchecks or memory-only persistence; report fields, not just status. Do not claim deployment from local runtime.
6. **Browser-smoke the feature.** Open the actual dashboard, not only the root HTML. If the root is a landing page, navigate through its visible dashboard control; refresh the page snapshot after each action and use current element indices. Select all three sizes and observe dimensions, checksums, digest badges, and the rendered heatmap. Do not submit intents, execute actions, or create records for a visual check. Trace unrelated UI errors to their own route/source and report separately; do not widen scope automatically. A screenshot confirms presentation, not backend correctness.
7. **Attest after gates.** Read `SWARM_PROTOCOL.md` and the live ledger schema. Only after required command and runtime gates pass, preserve the baseline entries and append exactly one chronological receipt. Hash the committed implementation diff before adding the receipt (avoid self-referential hashing); record all touched paths, status, test state, and one bounded next delta. Verify JSON, unchanged prior entries, uniqueness, and run `pnpm validate:swarm`. Never claim VERIFIED with a failed or unobserved required gate.

## Git and external boundaries

Use a worker branch and follow repository review policy. Keep these actions distinct: commit code, commit the post-gate receipt, local merge, push a branch, create a PR, and merge remotely. Require explicit authority for external changes; resolve the exact ref/destination before pushing. A vague “push it” after a local merge must not silently become a direct push to protected `main`; clarify or use the authorized worker-branch review path. Refresh the remote ref, require a clean worktree, use non-force pushes, and verify the published SHA with `git ls-remote`. A successful `git push --dry-run` does not prove branch protection will accept the real push. If required checks block `main`, stop—never force, bypass rules, or infer approval for a PR/merge. Report local and remote refs separately.

### Check-gated merge and re-anchor

- Treat “merge PR #N once checks pass” as conditional authority for that PR and base only—not permission to waive checks, reviews, or protection. Confirm head/base, mergeability, required checks and approvals; use the repository’s established merge method.
- Prefer GitHub’s native auto-merge for this condition. Do not substitute agent polling, a scheduled job, force-push, or bypass. After invoking it, inspect the live PR before retrying an ambiguous command. Claim merged only when GitHub reports `MERGED`; capture the merge SHA/time and final check results. Otherwise report queued, blocked, or unknown precisely.
- After merge, fetch the target and inspect worktree, graph, and local-only commits. Fast-forward when possible. If histories differ only by equivalent merge commits, verify the worktree is clean and all local changes are represented remotely; preserve a recovery ref before aligning the local target. Never reset based on tree equality alone. Verify final HEAD, upstream, and cleanliness.

## Voice and reporting

Use SOUL AI for architecture, TRUTH WEAVER for evidence, THE GENERAL for execution, and ECHOFRAME for communication—as lenses, not identities. Separate `OBSERVED`, `VERIFIED`, `UNKNOWN`, and `NOT_EXECUTED`; distinguish tests, local runtime, browser presentation, remote CI, and deployment. Name degraded services, unrelated 404s, unavailable Ollama, and unrun steps plainly. Close substantive work with one practical next step; keep the human in control of external action and final merge decisions.
