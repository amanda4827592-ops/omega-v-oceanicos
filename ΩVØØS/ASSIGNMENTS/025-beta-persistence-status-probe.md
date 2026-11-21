# Order 025 — Persistence Status Probe

**Agent**: antigravity (Gemini)
**Branch**: `agent/gemini/vibeos-persistence-status`
**Assigned**: 2026-11-21T01:30:00Z
**Status**: IN_PROGRESS

## Domain

Add a dedicated `💾 Persistence Status` quick-action probe to the ΔVRØ HOUSE VibeOS
surface (`apps/web/src/VibeOS.tsx`) that queries `GET /persistence/status` and
surfaces local storage, custody, and coordination limitations without asserting distributed consensus.

## Law

SWARM_PROTOCOL.md § IV.4 / Law 1: ATTEST, DON'T ASSERT. UNKNOWN PRESERVED.

## Epistemic Contract

- Probe status: `OBSERVED` (not `VERIFIED`)
- Fail-closed: errors collapse to `UNKNOWN`
- Displays: enabled state · coordination mode · custody mode · scope · coordination limitations
- Limitation: "local persistence & coordination scope; not distributed consensus"

## Endpoint

`GET /persistence/status` → `{ success, persistence: { enabled, coordination, custody, recovery, deletion } }`

## Files Changed

- `apps/web/src/VibeOS.tsx` — `runPersistenceStatusCheck` handler + button
- `apps/web/src/__tests__/dom/VibeOS.test.tsx` — DOM test #55
- `ΩVØØS/ASSIGNMENTS/025-beta-persistence-status-probe.md` — this file
- `kai_ledger.json` — Receipt appended

## Done When

- DOM test passes (55/55)
- `pnpm --filter web build` succeeds
- All 5 gates pass
- PR merged to `main`
