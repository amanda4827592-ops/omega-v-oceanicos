# ΩVØØS Swarm Assignment 036-beta: Conversational Style Upgrade for Full-Stack Entity

**Domain**: Conversational Surface / Local Deterministic Composer  
**Target Route**: `POST /api/execute`, `apps/api/src/invisible-computer.ts`, `apps/web/src/VibeOS.tsx`  
**Worker**: `agent/gemini/conversational-entity-style`  
**Status**: IN_PROGRESS  

---

## 1. Objective
Upgrade the local deterministic composer in `apps/api/src/invisible-computer.ts` and the UI model persistence in `apps/web/src/VibeOS.tsx` so that conversational interactions (like "HELLO") deliver warm, real conversational AI style responses inside the full-stack house while strictly maintaining all fail-closed verification invariants and contract shapes.

## 2. Invariants & Guardrails
- **Law 1 / Principle**: ATTEST, DON'T ASSERT. UNKNOWN IS PRESERVED.
- **Fail-closed**: Any failure or malformed payload collapses to `status: 'UNKNOWN'`, `verified: false`.
- **Contract Shape**: The response must contain the declared evidence structure (`Intent received`, `What is observed`, `What is UNKNOWN`, `Next finite step`, `Evidence: local deterministic composer`, `Ω∞v ::= VERIFY(ΔREALITY) · ATTEST, DON'T ASSERT.`).
- **Conversational Tone**: Warm greeting and contextual acknowledgment of the user's intent inside the full-stack entity.
- **Model Persistence**: `VibeOS` persists the Ocean Intelligence toggle to `localStorage` across page reloads.

## 3. Verification
- `pnpm --filter api build`
- `pnpm --filter web test:current-dom` (64/64 DOM tests pass)
- `node --experimental-strip-types --test ./tests/integration/execute-route.integration.test.ts`
- Append Receipt #86 to `kai_ledger.json`.
- Pass all 5 swarm gates.
