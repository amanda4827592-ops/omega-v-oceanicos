# ΩVØØS Swarm Assignment 040-beta: Autonomous Sandbox & Local Actions Telemetry

**Domain**: Sandboxed Execution / Layer 4 Telemetry Channels  
**Target Route**: `GET /v1/local-actions` & `GET /v1/local-actions/runs`  
**Worker**: `agent/gemini/vibeos-sandbox-local-actions-telemetry`  
**Status**: IN_PROGRESS  

---

## 1. Objective
Wire the Layer 4 MicroVM Sandboxes & Execution telemetry (`GET /v1/local-actions`) into VibeOS (`apps/web/src/VibeOS.tsx`) as a dedicated quick action probe (`🛠️ Sandbox Actions`), enforcing the fail-closed principle for local container and script runners.

## 2. Invariants & Guardrails
- **Law 1 / Principle**: Attest, don't assert. Reality remains the final authority.
- **Fail-closed Boundary**: When disabled (`LOCAL_RUNNER_DISABLED`), the status is observed as disabled with zero execution claims.
- **Capability ≠ Authority**: Even when local runners exist, consequential execution requires explicit Human Root (`Δ`) authorization.

## 3. Verification
- `pnpm --filter web test:current-dom` (67/67 DOM tests pass)
- `pnpm --filter web build`
- Append Receipt #90 to `kai_ledger.json`.
- Pass all 5 swarm gates.
