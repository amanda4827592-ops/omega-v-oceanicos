# ORDER 004 — Alpha / bounded Composio read-only gateway

| Field | Value |
| --- | --- |
| Assigned to | Alpha — Architect (API verification, admission, evidence) |
| Domain | `apps/api/src/` |
| Branch | `agent/chatgpt/composio-readonly-gateway` |
| Status | Authorized by the human in this session for this bounded backend slice. |
| Tracking | GitHub issue #621 |
| Authority | Implement a server-side, read-only Composio gateway. No writes, command execution, production deployment, or merge. |

## Objective

Provide one bounded API boundary for explicitly allowlisted Composio reads. Preserve the existing Observe → Verify → Remember doctrine: admission precedes provider execution, provider output is untrusted until validated, and unavailable/ambiguous results remain `NOT_EXECUTED` or `UNKNOWN`.

## Authorized edits

- `apps/api/src/composio-gateway.ts` — fixed allowlist, configuration parsing, request validation, provider transport, timeout and redaction.
- `apps/api/src/composio-gateway-route.ts` — authenticated read endpoint; reuse the existing connector admission and observation contracts.
- `apps/api/src/index.ts` — register the route and server-owned configuration only.
- `apps/api/src/__tests__/composio-gateway.test.ts` — focused unit/API tests.
- `docs/COMPOSIO_READ_ONLY_GATEWAY.md` — configuration, allowlist, threat model, and limitations.
- This assignment record.
- Append this slice's receipt to `kai_ledger.json`.

## Initial fixed read-only capabilities

GitHub:
- `GITHUB_GET_A_REPOSITORY`
- `GITHUB_GET_A_BRANCH`
- `GITHUB_GET_REPOSITORY_CONTENT`
- `GITHUB_LIST_BRANCHES`
- `GITHUB_LIST_COMMITS`

Notion:
- `NOTION_SEARCH_NOTION_PAGE`
- `NOTION_RETRIEVE_PAGE`
- `NOTION_FETCH_DATABASE`
- `NOTION_GET_PAGE_MARKDOWN`
- `NOTION_FETCH_BLOCK_CONTENTS`
- `NOTION_FETCH_ALL_BLOCK_CONTENTS`
- `NOTION_FETCH_ROW`
- `NOTION_QUERY_DATABASE_WITH_FILTER`

These slugs are an allowlist, not user-selectable arbitrary tools. Provider/toolkit versions must be explicitly configured and pinned. Never accept a tool slug, connected-account ID, user ID, API key, toolkit version, or admission verdict from the browser.

## Security and behavior constraints

- Credentials and connected-account IDs are server-side only. Never return secrets or raw provider error bodies.
- Fail closed if API key, stable server-side user identity, connected account, pinned toolkit version, or trusted admission evidence is absent.
- Use HTTPS to the documented Composio v3.1 API endpoint only; no caller-selected endpoint or proxy.
- Accept only a bounded JSON object of tool arguments; reject secret-like fields and transport/handler overrides.
- Enforce fixed tool allowlist, toolkit/account mapping, maximum request size, timeout, and one attempt per request.
- Do not permit write-capable tools, arbitrary proxy execution, file upload/download, or auto-discovered tool execution.
- Record an observation receipt through the existing journal contract. A successful HTTP response is not by itself a VERIFIED reality claim.
- Keep this integration single-tenant until the API has a trusted authenticated-principal-to-Composio-user mapping; document that limitation explicitly.
- Do not modify `packages/mini` (Beta domain) or `tests/` / `scripts/` (Gamma domain). If reuse requires changes there, stop and split the task.
- Do not change the Vibe OS chat execution contract in this Alpha slice.

## Acceptance gate

```bash
pnpm --filter api exec jest --config ./jest.config.js --runInBand --runTestsByPath src/__tests__/composio-gateway.test.ts
pnpm --filter api build
pnpm validate:swarm
```

Also run the existing connector-observation and API authorization regression suites if available. Record exact commands/results; do not claim unrun checks.

## Stop conditions

Stop if the existing admission/observation interfaces cannot safely support this adapter without editing another domain; if the current Composio API request contract differs from the documented v3.1 contract; if the caller identity cannot be established server-side; or if any feature requires write-capable tools. No pushes to main, merges, or deployments.
