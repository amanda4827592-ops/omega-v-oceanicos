# @oceanicos/elion

**ELION** — the hands of the Invisible Online Computer.

ELION turns an intent KAI has not blocked into one bounded answer. It calls an
OpenAI-compatible completion endpoint when a credential is configured, and
otherwise returns the clearly labelled local composer. It never acts on the
world.

```text
KAI (observe) → ELION (execute) → OMEGA (verify) → KAI (remember)
```

## Purpose

- Bound what was asked to what is authorized (`deriveAuthorityLevel`)
- Compose one answer, through the model or locally (`executeElion`)
- State the expected outcome the verifier will check against

## Public API

```typescript
import { executeElion } from '@oceanicos/elion';

const result = await executeElion({ intent: 'summarize this claim', authorityLevel: 'READ_ONLY' });
// { text, authorityLevel, expectedOutcome, composer: 'local-deterministic' | 'model' }
```

- `deriveAuthorityLevel(requested)` — anything other than `AUTONOMOUS` is `READ_ONLY`
- `expectedOutcomeFor(authorityLevel)` — the contract text OMEGA checks
- `composeLocalElionResponse(intent, authorityLevel)` — the local, labelled answer
- `executeElion(...)` — the bounded execution path

## Configuration

- `OMEGA_LLM_API_KEY` — enables the model call
- `OMEGA_LLM_BASE_URL`, `OMEGA_LLM_MODEL` — optional overrides

Without a key the local composer answers, and its output says so. A failed
model call returns empty text rather than an invented answer, which OMEGA then
records as `UNKNOWN`.

## Boundary

**CAPABILITY != AUTHORITY.** An `AUTONOMOUS` request is recorded as a bounded
plan that names the next action and its authorization gate; nothing here
executes, completes, or claims completion.
