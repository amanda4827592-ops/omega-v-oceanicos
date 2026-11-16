# Ω∞v OCEANICOS — End-to-End Flow

This document is an operator-facing map of the bounded tensor DAV slice. It connects human intent, the local API, deterministic verification, the read/attestation boundary, and the web observation surface. A named layer is an interface contract; it does not prove that an external service is running, that a deployment exists, or that a receipt is authoritative outside the observed process.

## Core rule

```text
Human intent → bounded admission → deterministic compute → invariant verification
→ canonical SHA-256 digest → local observation → human review
```

The implementation is finite and local. `T[i,j,k,l] = i + j + k + l` is a deterministic program rule, not a claim about physical infinity, consciousness, or a universal external system. Evidence outranks assertion; a failed or unavailable observation remains `UNKNOWN` or `DIVERGENT` rather than being promoted to `VERIFIED`.

## Runtime path

### 1. Human root

A person selects a bounded tensor size and reviews the result. Human authorization remains the decision boundary; the API and digest provide evidence, not autonomous authority.

### 2. Fastify spine (`:5000`)

The API accepts the read-only routes:

- `GET /tensor/:size`
- `GET /api/tensor/:size` (browser-compatible alias)

Only `N ∈ {4, 6, 8}` is admitted. Any other value returns HTTP `400` with `status: UNKNOWN`, `error: UNKNOWN_TENSOR_SIZE`, and the allowed-size list. The route does not append to `kai_ledger.json`.

### 3. Deterministic kernel

`packages/verification` computes the four-dimensional tensor with zero-based indices and exposes an `N² × N²` projection:

```text
row    = i * N + j
column = k * N + l
value  = i + j + k + l
```

The kernel checks the declared invariants before producing a receipt:

```text
min      = 0
max      = 4 * (N - 1)
mean     = 2 * (N - 1)
checksum = 2 * N^4 * (N - 1)
```

Expected checksums are `1536` for `N=4`, `12960` for `N=6`, and `57344` for `N=8`.

### 4. Verification and digest

The implementation recomputes the expected matrix and invariants, then hashes canonical JSON for the verified payload. A successful response has `success: true`, `status: VERIFIED`, the computed payload, and a 64-character SHA-256 digest. A failed invariant returns HTTP `422` with `status: DIVERGENT`; it does not produce a verified digest.

The digest proves integrity for that exact local serialization. It is not a signature, external attestation, deployment proof, or proof of physical reality.

### 5. Memory and attestation boundary

Ordinary tensor `GET` requests are read-only. They do not mutate `kai_ledger.json`. A swarm receipt may be appended only after the repository verification gate has actually passed and the receipt satisfies `SWARM_PROTOCOL.md`; no failed, incomplete, or merely proposed run may be recorded as `VERIFIED`.

The optional Ollama endpoint at `:11434` is outside the deterministic tensor kernel and is not required for tensor verification. The execution-free `companion/python` adapter is not invoked by this read-only route.

### 6. React observation surface (`:3000`)

The web dashboard renders the projected heatmap, coordinates, checksum, digest, and explicit error states. Browser requests may use `/api/tensor/:size`; Vite proxies that path to the API. The dashboard is an observation surface, not an authority source.

## State interpretation

| State | Meaning | Allowed next action |
| --- | --- | --- |
| `UNKNOWN` | Input or required evidence is unavailable or outside the bounded contract. | Correct the input or collect permitted evidence. |
| `DIVERGENT` | A computed observation conflicts with the declared invariant. | Halt, inspect, and repair; do not promote the result. |
| `VERIFIED` | The local verifier observed matching invariants and emitted a digest. | Review the receipt and decide whether a separately authorized action is needed. |
| `NOT_EXECUTED` | A capability or candidate exists, but no execution was authorized. | Preserve the boundary; require explicit human authorization for any external action. |

## Local proof commands

From the repository root:

```bash
pnpm verify:full
pnpm dev
curl -fsS http://localhost:5000/health
curl -fsS http://localhost:5000/api/tensor/4
curl -i http://localhost:5000/api/tensor/5
curl -fsS http://localhost:3000/
```

A healthy development observation should show API readiness and a served web document. Local health may still report intentionally limited states such as degraded attestation, disabled persistence encryption, or single-process coordination. Those are observations to reconcile, not reasons to claim production readiness.

## Scope and non-proof

This flow documents one bounded local vertical slice. It does not prove distributed consistency, backup or restore correctness, external key custody, deployment health, demand, revenue, or physical-world outcomes. Merge, deployment, external publication, and consequential actions remain separate human-gated transitions.
