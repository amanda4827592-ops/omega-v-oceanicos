# ΩVØØS Swarm Assignment 051-beta: Omni-Modal Sovereign Reality Tool Gateway & Acoustic Synthesis

**Domain**: Platform Reality Tools Gateway & Python Acoustic Waveform Synthesis  
**Target Surface**: `companion/python/main.py`, `apps/api/src/reality-tools-route.ts`, `apps/api/src/route-contract.ts`, `apps/api/src/index.ts`, `apps/web/src/components/StudioSettingsModal.tsx`, `apps/web/src/VibeOS.tsx`, `apps/web/src/__tests__/dom/harness.tsx`, `apps/web/src/__tests__/dom/VibeOS.test.tsx`, `kai_ledger.json`  
**Worker**: `agent/gemini/vibeos-omni-reality-tools-gateway`  
**Status**: VERIFIED  

---

## 1. Objective
Expand the sovereign entity platform to provide attested access to all tools of reality, paired with acoustic harmonic waveform synthesis:
1. **Python Acoustic Harmonic Waveform Synthesizer**:
   - Zero-dependency PCM sinusoidal audio synthesis in Python stdlib (`companion/python/main.py`).
   - Generates playable base64 WAV data URI at 432 Hz / 528 Hz / 888 Hz.
   - Forwarding proxy route `POST /v1/companion/synthesize` in Fastify spine.
   - Interactive audio playback button (`▶️ Play Harmonic Tone`) in `StudioSettingsModal`.
2. **Sovereign Reality Tools Gateway (`GET /v1/reality/tools`)**:
   - Registers all 8 sovereign tools of reality inside the house:
     - 🛠️ `tool-microvm-sandbox`: MicroVM Sandbox Runner (`/v1/local-actions`)
     - 🔍 `tool-mcp-connectors`: MCP Sovereign Connectors (`/v1/omega/connectors`)
     - 🧠 `tool-ollama-neural`: Local Ollama Neural Engine (`11434/v1`)
     - 🎙️ `tool-voice-acoustic`: Acoustic Waveform Synthesizer (`8088/voice/synthesize`)
     - 🎨 `tool-svg-tensor-canvas`: Deterministic SVG Tensor Canvas (`/v1/studio/synthesize`)
     - 🎬 `tool-sse-video-stream`: Real-Time SSE Video Pipeline (`/v1/stream`)
     - ⚖️ `tool-dav-tensor-validator`: DAV Tensor Invariant Validator (`/tensor/8`, 57,344)
     - 📜 `tool-kai-immutable-ledger`: KAI Immutable Ledger (`/api/kai/memory`)
3. **Interactive UI in VibeOS**:
   - Quick action button: `🛠️ Reality Tools` (`runRealityToolsGatewayCheck`).
4. **Rigorous Verification Gate**:
   - DOM Test #78 verifying Reality Tools Gateway inspection and catalog attestation.

## 2. Invariants & Guardrails
- **Law 1**: Attest, don't assert. Expected ≡ Observed. Reality remains the final authority.
- **Fail-Closed Gate**: Unobserved tools remain UNKNOWN.
- **Zero External Dependencies**: Pure Python stdlib audio generation.

## 3. Verification Gate
- `pnpm --filter web test -- VibeOS.test.tsx` (64/64 passing, 78 DOM tests total)
- `pnpm --filter api run build` (Clean TypeScript build)
- `node --experimental-strip-types tests/integration/api-route-contract.integration.test.ts` (3/3 passing)
- `pnpm validate:swarm` (101 verified append-only receipts)
- `pnpm compress:repo` (33/33 outward paths verified)
- `pnpm flow:water` (8/8 canonical skills verified)
