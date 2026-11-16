# Composio read-only gateway

## Purpose

OceanicOS exposes a server-side gateway for a fixed set of Composio read tools. The gateway is an observation boundary, not an autonomous agent and not a write-capable connector. It preserves the sequence:

1. Validate a request against the fixed tool allowlist.
2. Obtain trusted server-side authority and policy evidence.
3. Admit the connector using the existing Omega connector admission contract.
4. Execute one bounded Composio read using server-owned credentials.
5. Redact sensitive response fields and hash the returned data.
6. Append an observation receipt to the existing connector journal.
7. Return UNKNOWN until a separate verifier reconciles the provider result against an explicit expected state.

A successful Composio HTTP response is not a VERIFIED claim about the underlying world.

## API

POST /v1/omega/composio/read

This endpoint is protected by the API read bearer token (not the admin token), has a route limit of 20 requests per minute, and accepts only:

```json
{
  "toolSlug": "GITHUB_GET_A_REPOSITORY",
  "arguments": {
    "owner": "example",
    "repo": "example"
  }
}
```

The client cannot supply a toolkit name, connected-account ID, user ID, API key, endpoint, toolkit version, handler, transport, or admission verdict. Unknown top-level fields are rejected.

## Initial fixed read-only allowlist

GitHub:
- GITHUB_GET_A_REPOSITORY
- GITHUB_GET_A_BRANCH
- GITHUB_GET_REPOSITORY_CONTENT
- GITHUB_LIST_BRANCHES
- GITHUB_LIST_COMMITS

Notion:
- NOTION_SEARCH_NOTION_PAGE
- NOTION_RETRIEVE_PAGE
- NOTION_FETCH_DATABASE
- NOTION_GET_PAGE_MARKDOWN
- NOTION_FETCH_BLOCK_CONTENTS
- NOTION_FETCH_ALL_BLOCK_CONTENTS
- NOTION_FETCH_ROW
- NOTION_QUERY_DATABASE_WITH_FILTER

There is no arbitrary tool execution, tool discovery, proxy execution, upload/download, or write-capable action in this route.

## Server configuration

Configure these values in the API runtime secret manager/environment. Never commit them or send them from the browser:

- COMPOSIO_API_KEY
- COMPOSIO_USER_ID — stable server-side Composio user ID.
- COMPOSIO_GITHUB_CONNECTED_ACCOUNT_ID
- COMPOSIO_NOTION_CONNECTED_ACCOUNT_ID
- COMPOSIO_GITHUB_TOOLKIT_VERSION
- COMPOSIO_NOTION_TOOLKIT_VERSION

Toolkit versions must be pinned in YYYYMMDD_NN form. Obtain the correct version from Composio toolkit metadata and pin the exact version tested by the deployment. The API calls the documented Composio v3.1 tools execute endpoint with the x-api-key header and server-owned connected_account_id, user_id, version, and arguments.

The route is intentionally unconfigured when any required value is missing. It returns NOT_EXECUTED; it does not simulate a provider call.

## Security boundaries

- Credentials and connected-account identifiers remain server-side.
- The provider endpoint is fixed HTTPS; no caller-controlled URL or proxy.
- Tool slugs are fixed in source code.
- Tool arguments must be JSON objects under 16 KiB, bounded by depth, item count, and string length. Secret-like argument keys are rejected.
- Provider responses are limited to 64 KiB and secret-like response fields are redacted.
- One attempt is made per request, with an 8-second timeout.
- Provider errors are mapped to stable codes; raw upstream error bodies are never returned.
- Missing trusted admission evidence means NOT_EXECUTED.
- Provider response digest is recorded, but status remains UNKNOWN pending independent reconciliation.

## Identity limitation

This first slice is single-tenant: one configured COMPOSIO_USER_ID and one connected account per toolkit. The current API read bearer is not a multi-user identity mapping. Do not expose this route to multiple end users until a trusted authenticated-principal-to-Composio-user/account mapping is implemented and reviewed.

## Status meanings

- NOT_EXECUTED: no provider request was made (missing configuration or admission).
- UNKNOWN: provider request was attempted, but its data has not been independently reconciled.
- DIVERGENT: reserved for a later verifier when observed state differs from the declared expected state.
- VERIFIED: reserved for a later verifier with matching, independently checked evidence.

This journal is a local append-only hash chain. It is not proof of deployment health, durable external storage, or verified real-world state.
