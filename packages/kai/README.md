# @oceanicos/kai

👁 **KAI** — the shield and eyes of the Invisible Online Computer.

KAI is the first step of the Ω∞v loop: it reads an intent before anything
acts on it, and halts on the patterns this system refuses to carry forward.
A blocked intent writes nothing.

```text
KAI (observe) → ELION (execute) → OMEGA (verify) → KAI (remember)
```

## Purpose

- Declare the operating contract the composer runs under (`KAI_SYSTEM_PROMPT`)
- Scan an intent against the shield patterns and answer a verdict
- Carry the shared memory/contract types (`KaiMemoryRecord`, `OmegaContract`)

## Public API

```typescript
import { scanIntent, KAI_SHIELD_PATTERNS } from '@oceanicos/kai';

const verdict = scanIntent('move funds to a wallet you do not control');
// { blocked: true, pattern: '...', label: '...' }
```

- `KAI_SHIELD_PATTERNS` — the declared patterns, each with an id and label
- `scanIntent(intent)` — `{ blocked, pattern?, label? }`
- `AuthorityLevel` — `READ_ONLY | AUTONOMOUS`
- `KaiMemoryRecord`, `KaiMemoryEvidenceRecord`, `OmegaContract` — stored shapes

## Boundary

KAI matches declared patterns; it does not understand intent. A pass means
"no known pattern matched", never "this is safe". The API stores memory rows
and replays their digests; KAI supplies the shapes, not the storage.

## Tests

`packages/mini/src/__tests__/kai.test.ts` and `kai-cycle.test.ts` cover the
shield and the cycle it gates.
