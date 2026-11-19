# Order 020: VibeOS Single Body 4×4×4×4 Compression Probe

## Intent
Connect the live Single Body 4×4×4×4 matrix compression and lossless expansion proof (`GET /v1/ecosystem/body`) directly into the VibeOS desktop surface as a dedicated quick action probe (`🧊 Single Body (4×4×4×4)`).

## Scope
- Domain: `apps/web/src/VibeOS.tsx`
- Endpoint: `GET /v1/ecosystem/body`
- Surfaces:
  - 4×4×4×4 rank 4 tensor space capacity (`256` total cells) and filled cells count (`7` runtime layer cells)
  - Cryptographic matrix compression digest (`b52fcb6c8b...`)
  - Lossless round-trip expansion proof status (`VERIFIED`, `lossless: YES`, `LOCAL_ROUND_TRIP_ONLY`)
  - Governing ecosystem fixpoint equation (`omega.ecosystem-body.fixpoint.v1`, `status: VERIFIED`)
  - Epistemic boundary: declared projection (`body.layers.v1`), not inferred truth; local round-trip only.
- DOM Test Suite: `apps/web/src/__tests__/dom/VibeOS.test.tsx` (added test 47, 47/47 passing)
- Epistemic Boundary: Compression is not permission; projection is not physical reality.

## Verification Evidence
- 47/47 DOM unit tests passing across all 6 test suites.
- Web application bundles cleanly with Vite and TypeScript.
- Fail-closed verification preserved: empty or malformed responses collapse to `UNKNOWN`.
