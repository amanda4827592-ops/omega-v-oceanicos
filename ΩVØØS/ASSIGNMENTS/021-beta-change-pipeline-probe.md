# Order 021: VibeOS Change Pipeline Probe

## Intent
Connect the live C0→C6 change pipeline (`POST /v1/pipeline`) to the VibeOS desktop as a dedicated quick action (`🔁 Change Pipeline`).

## Scope
- Domain: `apps/web/src/VibeOS.tsx`
- Endpoint: `POST /v1/pipeline`
- The probe sends one bounded dry-run compile. `admission` is `{}`. It does not send `authorityVerified`, `policySatisfied`, `handlerStateAfter`, or `observedState`.
- Surfaces the server's own stage, halt, authorization, execution, and reality fields.
- A missing pipeline, a non-OK response, or a thrown fetch collapses to `UNKNOWN`.
- The bubble stays `verified: false`. A server word inside the text is not a local upgrade.
- DOM: `apps/web/src/__tests__/dom/VibeOS.test.tsx`
- Epistemic boundary: server owns admission. A dry run is not permission. `upgrade.execution` stays `NOT_EXECUTED`.

## Not claimed
This probe does not merge, deploy, or execute an upgrade. Full `pnpm build`, `pnpm lint`, and `pnpm test` are outside this slice unless the receipt says they ran.
