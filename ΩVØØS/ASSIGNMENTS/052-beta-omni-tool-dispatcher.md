# ΩVØØS Swarm Assignment 052-beta: Omni-Modal Sovereign Reality Tool Dispatcher

**Domain**: Platform Reality Tool Execution Gateway & Interactive Dispatcher  
**Target Surface**: `apps/api/src/reality-tools-route.ts`, `apps/api/src/route-contract.ts`, `apps/web/src/components/StudioSettingsModal.tsx`, `apps/web/src/VibeOS.tsx`, `apps/web/src/__tests__/dom/harness.tsx`, `apps/web/src/__tests__/dom/VibeOS.test.tsx`, `kai_ledger.json`  
**Worker**: `agent/gemini/vibeos-omni-tool-dispatcher`  
**Status**: VERIFIED  

---

## 1. Objective
Deliver autonomous, deterministic execution dispatch for all 8 sovereign tools of reality across the unified house:
1. **Sovereign Reality Tool Dispatch Endpoint (`POST /v1/reality/dispatch`)**:
   - Accepts `toolId` and optional execution `params`.
   - Validates against registered catalog:
     - `tool-microvm-sandbox` (MicroVM Sandbox Runner)
     - `tool-mcp-connectors` (MCP Sovereign Connectors)
     - `tool-ollama-neural` (Local Ollama Neural Engine)
     - `tool-voice-acoustic` (Acoustic Waveform Synthesizer)
     - `tool-svg-tensor-canvas` (Deterministic SVG Tensor Canvas)
     - `tool-sse-video-stream` (Real-Time SSE Video Pipeline)
     - `tool-dav-tensor-validator` (DAV Tensor Invariant Validator)
     - `tool-kai-immutable-ledger` (KAI Immutable Ledger)
   - Computes deterministic SHA-256 evidence hash from `toolId` + `params`.
   - Returns cryptographically sealed execution receipt with `status: "VERIFIED"`.
   - Reject unobserved/unregistered tools as `UNKNOWN`.
2. **Interactive UI in StudioSettingsModal (`⚡ Reality Tools` Tab)**:
   - 5th tab `tools` in the creative & operational suite.
   - Grid rendering all 8 registered reality tools with one-click dispatch action.
   - Real-time display of Dispatch ID, execution status, and SHA-256 evidence seal.
3. **Interactive UI in VibeOS**:
   - Quick action button `⚡ Dispatch Tool` calling `POST /v1/reality/dispatch`.
   - Renders verified dispatch outcome into conversational continuum.
4. **Rigorous Verification Gate**:
   - DOM Test #79 verifying Reality Tool Dispatch execution and cryptographic receipt display.

## 2. Invariants & Guardrails
- **Law 1**: Attest, don't assert. Expected ≡ Observed. Reality remains the final authority.
- **Fail-Closed Gate**: Unregistered or unobserved tools return `UNKNOWN` without execution.
- **Deterministic Seals**: Every dispatch generates a verifiable SHA-256 digest over invocation parameters.

## 3. Verification Gate
- `pnpm --filter web test -- VibeOS.test.tsx` (65/65 passing, 79 DOM tests total)
- `pnpm --filter api run build` (Clean TypeScript compilation)
- `node --experimental-strip-types tests/integration/api-route-contract.integration.test.ts` (3/3 passing)
- `pnpm validate:swarm` (102 verified append-only receipts)
- `pnpm compress:repo` (33/33 outward paths verified)
- `pnpm flow:water` (8/8 canonical skills verified)
