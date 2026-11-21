# Order 022 — Command Pipeline Probe

**Agent**: antigravity (Gemini)
**Branch**: `agent/gemini/vibeos-command-pipeline`
**Assigned**: 2026-11-21T00:52:00Z
**Status**: IN_PROGRESS

## Domain

Add a dedicated `📋 Command Pipeline` quick-action probe to the ΔVRØ HOUSE VibeOS
surface (`apps/web/src/VibeOS.tsx`) that queries `GET /v1/omega/commands` and
surfaces the sovereign command ledger state without asserting execution authority.

## Law

SWARM_PROTOCOL.md § IV.4 / Law 1: ATTEST, DON'T ASSERT. UNKNOWN PRESERVED.

## Epistemic Contract

- Probe status: `OBSERVED` (not `VERIFIED`)
- Fail-closed: errors collapse to `UNKNOWN`
- Displays: total count, VERIFIED count, Under Review count, Executed count, Redacted flag
- Limitation: command output is evidence, not authority; not deployment health

## Endpoint

`GET /v1/omega/commands` → `{ success, count, commands[], redacted }`

## Files Changed

- `apps/web/src/VibeOS.tsx` — `runCommandPipelineCheck` handler + button
- `apps/web/src/__tests__/dom/VibeOS.test.tsx` — DOM test (52nd test)
- `ΩVØØS/ASSIGNMENTS/022-beta-command-pipeline-probe.md` — this file
- `kai_ledger.json` — Receipt appended

## Done When

- DOM test passes (52/52)
- `pnpm --filter web build` succeeds
- All 5 gates pass
- PR merged to `main`
