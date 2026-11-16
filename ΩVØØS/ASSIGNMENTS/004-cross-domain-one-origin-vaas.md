# ORDER 004 — Cross-domain one-origin VaaS integration

| Field | Value |
| --- | --- |
| Assigned to | Copilot worker on `agent/copilot/self-hosted-oidc-identity` |
| Domain | One-origin API, web/Auth0 access, worker observation, deployment configuration, directly related documentation, and the CI/ledger validation fixes authorized below |
| Status | Authorized by the human in this session for the listed current worktree changes. |
| Publication | Update existing PR #602 by pushing to `agent/copilot/self-hosted-oidc-identity`. Do not create a duplicate PR. |
| Authority | Commit and push the listed changes to PR #602 after local verification. Do not merge or deploy. `kai_ledger.json` may receive append-only receipts only; do not rewrite or reformat existing entries. |

## Objective

Deliver the bounded one-origin Verification-as-a-Service experience: the API serves the UI, browser API calls use the shared Auth0-aware client, OIDC access remains fail-closed and human-gated, and worker observations reflect the actual API contract without overstating evidence. Also fix observed CI failures in Compose placeholder validation and append-only baseline comparison without weakening receipt validation.

## Authorized files

- `.env.compose.example`
- `.github/workflows/verify.yml`
- `scripts/validate-swarm-ledger.mjs`
- `scripts/validate-swarm-ledger.test.mjs`
- `AGENTS.md`
- `Dockerfile`
- `README.md`
- `apps/api/Dockerfile`
- `apps/api/README.md`
- `apps/api/src/__tests__/api.test.ts`
- `apps/api/src/__tests__/oidc-identity.integration.test.mjs`
- `apps/api/src/index.ts`
- `apps/api/src/omega-persistence.ts`
- `apps/api/src/omega.ts`
- `apps/api/src/runtime-globals.d.ts`
- `apps/web/src/App.tsx`
- `apps/web/src/ConnectorPanel.tsx`
- `apps/web/src/DependencyMapPanel.tsx`
- `apps/web/src/DivergenceAlertsPanel.tsx`
- `apps/web/src/EcosystemPanel.tsx`
- `apps/web/src/InvisibleComputer.tsx`
- `apps/web/src/MoodCodexPanel.tsx`
- `apps/web/src/OreadConsole.tsx`
- `apps/web/src/RealityPanel.tsx`
- `apps/web/src/SingleBodyPanel.tsx`
- `apps/web/src/SystemHealthPanel.tsx`
- `apps/web/src/TransitionProvenancePanel.tsx`
- `apps/web/src/ValueNavigatorPanel.tsx`
- `apps/web/src/WorkerCoordinationPanel.tsx`
- `apps/web/src/api-client.ts`
- `apps/web/src/__tests__/dom/ConnectorPanel.test.tsx`
- `apps/web/src/__tests__/dom/CurrentAppShell.test.tsx`
- `apps/web/src/__tests__/dom/InvisibleComputer.test.tsx`
- `apps/web/src/main.tsx`
- `docker-compose.yml`
- `docs/GOVERNANCE.md`
- `docs/LOCAL_COMPOSE_DEPLOYMENT.md`
- `package.json`
- `tests/integration/omega_distributed_coordination.test.ts`
- `tests/integration/web-api-proxy.integration.test.ts`
- This assignment file.

## Acceptance gate

```bash
pnpm elion:veral
node --test scripts/validate-swarm-ledger.test.mjs
SWARM_LEDGER_BASELINE_REF=origin/main pnpm validate:swarm
docker compose --env-file .env.compose.example config --quiet
git diff --check
```

These checks cover the one-origin integration and the authorized CI/ledger
repairs. They do not prove live Auth0 configuration or deployment.

## Stop conditions

- Keep live Auth0 tenant verification UNKNOWN until tested with a real non-production tenant.
- Preserve every historical ledger receipt exactly; any new receipt must be appended without rewriting or formatting existing entries.
- Do not merge PR #602 or deploy.

## Human-authorized bounded front-view addendum — 2026-11-15

The human authorized a calm, self-contained front-view improvement and asked
that existing matrix math be observed before adding dimensions. This addendum
permits a rank-four capacity preview in the existing Single Body panel:

- `4×4×4×4` remains the only active data/API contract.
- `6×6×6×6` and `8×8×8×8` may be displayed as capacity-only scenarios:
  `1,296` and `4,096` addresses, both `UNKNOWN` and not implemented.
- No coordinate labels, mood mapping, Copilot internals, API behavior, or
  package contract may be inferred or changed in this slice.

Additional authorized files:

- `apps/web/src/App.css`
- `apps/web/src/__tests__/dom/SingleBodyPanel.test.tsx`
- `docs/SINGLE-BODY-4X4X4X4.md`
- `docker-compose.base44.yml`
- `tests/integration/web-api-proxy.integration.test.ts`
- `AGENTS.md`

The Base44 dev stack must use the same-origin `/api` proxy, targeting the
internal `api:5000` service. It must not synthesize a public API host when
`BASE44_PUBLIC_HOST_SUFFIX` is absent.

Acceptance additions:

```bash
pnpm --filter web test --runTestsByPath src/__tests__/dom/SingleBodyPanel.test.tsx
pnpm --filter web build
node --experimental-strip-types --test ./tests/integration/web-api-proxy.integration.test.ts
```
