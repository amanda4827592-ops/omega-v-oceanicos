# ΩVØØS Swarm Assignment 042-beta: Automated Evals Flywheel Telemetry

**Domain**: Automated Evals & Data Flywheel / Layer 9 Continuous Benchmarks  
**Target Route**: `GET /v1/evals/status`  
**Worker**: `agent/gemini/vibeos-evals-flywheel-telemetry`  
**Status**: IN_PROGRESS  

---

## 1. Objective
Wire the Layer 9 Automated Evals & Data Flywheel (`GET /v1/evals/status`) into VibeOS (`apps/web/src/VibeOS.tsx`) as a dedicated quick action probe (`📊 Evals Flywheel`), reporting DOM test suites, integration suites, swarm receipt count, protocol status, and fail-closed gating status.

## 2. Invariants & Guardrails
- **Law 1 / Principle**: Attest, don't assert. Reality remains the final authority.
- **Fail-closed Protocol**: Any non-200 or missing evals object collapses to `status: 'UNKNOWN'`, `verified: false`.
- **Evidence Boundary**: Test counts are runtime telemetry metadata, not proof that tests are currently passing.

## 3. Verification
- `pnpm --filter web test:current-dom` (69/69 DOM tests pass)
- `pnpm --filter web build`
- Append Receipt #92 to `kai_ledger.json`.
- Pass all 5 swarm gates.
