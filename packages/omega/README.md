# @oceanicos/omega

**OMEGA** — the verifier of the Invisible Online Computer.

OMEGA checks that what was expected is what was observed. It recomputes the
evidence digest rather than trusting a stored claim, and it is the single rule
behind both the per-record replay endpoint and the ledger-wide audit.

```text
KAI (observe) → ELION (execute) → OMEGA (verify) → KAI (remember)
```

## Purpose

- Hash evidence deterministically (`sha256Hex`)
- Verify text against its declared contract (`verifyOmega`)
- Replay a stored record and answer `VERIFIED` / `DIVERGENT` / `UNKNOWN` (`replayVerdict`)
- Fold drops into monotone memory under the loop law (`gateDrop`, `omegaFixpoint`)

## Public API

```typescript
import { sha256Hex, verifyOmega, replayVerdict } from '@oceanicos/omega';

const digest = sha256Hex('the evidence text');
const verdict = replayVerdict({ evidence_text: 'the evidence text', evidence_hash: digest, ... });
// { status: 'VERIFIED' } — or DIVERGENT / UNKNOWN with a reason code
```

- `sha256Hex(value)` — one digest function, shared by writer and reader
- `verifyOmega({ ... })` — empty text, a broken digest, or a fabricated
  completion collapses to `UNKNOWN`
- `replayVerdict(record)` — `VERIFIED`, `DIVERGENT` (`EVIDENCE_HASH_MISMATCH`),
  `UNKNOWN` (`EVIDENCE_TEXT_NOT_RETAINED`)
- `gateDrop(drop)`, `omegaFixpoint(drops)` — the fixpoint law
  `Ω∞v = Y(λf. M_{t+1} = M_t ∪ { Hash(x) | V(x) = ⊤ })`

## Boundary

A verdict is recomputed from retained evidence, never read back from the row
being judged. Rows written before evidence was retained answer `UNKNOWN`, and
a mismatch is reported and preserved — never served as good memory.

## Tests

`tests/integration/omega-fixpoint.integration.test.ts` covers the gate and the
fold; the API replay/audit suites cover the endpoints that use them.
