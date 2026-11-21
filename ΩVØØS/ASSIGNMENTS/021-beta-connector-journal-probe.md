# Order 021: VibeOS Connector Journal Probe

## Intent
Connect the live connector admission journal (`GET /v1/omega/connectors/observations`) directly into the VibeOS desktop surface as a dedicated quick action probe (`🔗 Connector Journal`).

## Scope
- Domain: `apps/web/src/VibeOS.tsx`
- Endpoint: `GET /v1/omega/connectors/observations`
- Surfaces:
  - Total observation count recorded in the hash-chain journal
  - Truncation status (up to 200 entries returned)
  - Integrity type: `verified-local-hash-chain`
  - Epistemic limitation: `"local connector journal is not deployment health, not live GitHub execution, not revenue"`
  - Explicit boundary: connector journal is not execution evidence; does not grant authority or claim live deployment
- DOM Test Suite: `apps/web/src/__tests__/dom/VibeOS.test.tsx` (added test 48, 48/48 passing)
- Epistemic Boundary: Observation of admission records; not deployment state or execution authority.

## Verification Evidence
- 48/48 DOM unit tests passing across all 6 test suites.
- Web application bundles cleanly with Vite and TypeScript.
- Fail-closed verification preserved: empty or malformed responses collapse to `UNKNOWN`.
