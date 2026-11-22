# ΩVØØS Swarm Assignment 048-beta: Multimodal Studio & Platform Settings

**Domain**: Multimodal Creative Suite & System Settings  
**Target Surface**: `apps/api/src/studio-route.ts`, `apps/api/src/route-contract.ts`, `apps/api/src/index.ts`, `apps/web/src/components/StudioSettingsModal.tsx`, `apps/web/src/components/StudioSettingsModal.css`, `apps/web/src/VibeOS.tsx`, `apps/web/src/__tests__/dom/harness.tsx`, `apps/web/src/__tests__/dom/VibeOS.test.tsx`  
**Worker**: `agent/gemini/vibeos-multimodal-studio-and-settings`  
**Status**: IN_PROGRESS  

---

## 1. Objective
Expand the whole ecosystem entity into a full-stack creative and operational studio:
1. **Platform Settings ("The Settening")**: Local port topology (:3000, :5000, :8088, :11434), Local-First Sovereign Auth policy, KAI Shield risk gate, and FinOps optimization formula.
2. **Harmonic Voice Studio ("The Voice")**: 432 Hz natural harmonic calibration (with 528 Hz and 888 Hz modes), 4 One Identity voice organs (Soul AI, Truth Weaver, The General, Human Root), and real-time waveform preview.
3. **Deterministic Image Studio ("The Imageneration")**: SVG Tensor Canvas grounded by the 20 Codex dimensions and SHA-256 evidence seals.
4. **Omni Multimodal Video Studio ("Video Creation")**: Real-time SSE streaming pipeline (1920×1080 @ 30 fps) with frame-level checksum verification.

## 2. Invariants & Guardrails
- **Law 1**: Attest, don't assert. Expected ≡ Observed. Reality remains the final authority.
- **Fail-Closed Gate**: All studio capabilities are read-only local observations bound by evidence hashes.
- **Aesthetic Topology**: Clean ocean palette (`#030812` background, `#00e5ff` cyan, `#38bdf8` azure).

## 3. Verification Gate
- `pnpm --filter web test -- VibeOS.test.tsx` (61/61 passing, 75 DOM tests total)
- `pnpm --filter api run build` (Clean TypeScript build)
- `node --experimental-strip-types --test ./tests/integration/api-route-contract.integration.test.ts` (3/3 passing)
- `pnpm validate:swarm` (98 verified append-only receipts)
- `pnpm compress:repo` (33/33 outward paths verified)
- `pnpm flow:water` (8/8 canonical skills verified)
