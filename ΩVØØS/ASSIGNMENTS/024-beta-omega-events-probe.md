# Order 024 — Omega Events Probe

**Agent**: antigravity (Gemini)
**Branch**: `agent/gemini/vibeos-omega-events`
**Assigned**: 2026-11-21T01:17:00Z
**Status**: IN_PROGRESS

## Domain

Add a dedicated `📡 Omega Events` quick-action probe to the ΔVRØ HOUSE VibeOS
surface (`apps/web/src/VibeOS.tsx`) that queries `GET /v1/omega/events` and
surfaces sovereign lifecycle transitions without asserting authorization.

## Law

SWARM_PROTOCOL.md § IV.4 / Law 1: ATTEST, DON'T ASSERT. UNKNOWN PRESERVED.

## Epistemic Contract

- Probe status: `OBSERVED` (not `VERIFIED`)
- Fail-closed: errors collapse to `UNKNOWN`
- Displays: total event count · latest event type · latest commandId · redacted flag
- Limitation: "event history records transitions, not authorization"

## Endpoint

`GET /v1/omega/events` → `{ success, events[], redacted }`
Each event: `type`, `commandId`, `status`, `at`

## Files Changed

- `apps/web/src/VibeOS.tsx` — `runOmegaEventsCheck` handler + button
- `apps/web/src/__tests__/dom/VibeOS.test.tsx` — DOM test #54
- `ΩVØØS/ASSIGNMENTS/024-beta-omega-events-probe.md` — this file
- `kai_ledger.json` — Receipt appended

## Done When

- DOM test passes (54/54)
- `pnpm --filter web build` succeeds
- All 5 gates pass
- PR merged to `main`
