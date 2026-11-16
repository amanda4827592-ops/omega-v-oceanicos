# Unified Entity DAV Architecture

## Scope

This document defines a bounded, local data-analysis and visualization slice for OCEANICOS. It translates the Human Root request into a deterministic tensor computation, a typed verification result, a Fastify read surface, and a React inspection surface.

This is an implementation contract, not a claim of consciousness, universal intelligence, physical-world control, or deployment health.

## Flow

```text
Human Root
    ↓ named finite tensor request
packages/verification + post-gate kai_ledger.json
    ↓ deterministic invariants and SHA-256 receipt
Fastify Spine :5000
    ↓ GET /tensor/:size and GET /api/tensor/:size
React Surface :3000
    ↓ browser-relative /api/tensor/:size
TensorDavVisualizer
```

## Tensor contract

For each allowed size `N ∈ {4, 6, 8}`, the pure TypeScript kernel computes:

```text
T[i,j,k,l] = i + j + k + l
```

with zero-based indices. The 4D values are projected into a matrix where:

```text
row = i * N + j
column = k * N + l
```

The required projection sizes and invariants are:

| N | Projection | min | max | mean | checksum |
|---:|---:|---:|---:|---:|---:|
| 4 | 16 × 16 | 0 | 12 | 6 | 1,536 |
| 6 | 36 × 36 | 0 | 20 | 10 | 12,960 |
| 8 | 64 × 64 | 0 | 28 | 14 | 57,344 |

A result is `VERIFIED` only when dimensions and every declared statistical invariant match the analytical expectation. Otherwise it is `DIVERGENT`; unsupported sizes are rejected as `UNKNOWN` at the API boundary.

## Evidence and ledger boundary

The kernel creates a SHA-256 receipt over the canonical verified result. The Fastify endpoint exposes that receipt but does not mutate the swarm ledger during ordinary GET requests. After the complete repository verification gate passes, an operator may append one matching `VERIFIED` receipt to `kai_ledger.json` according to `SWARM_PROTOCOL.md` §VI.

The ledger is append-only. A receipt is not proof that a tensor describes external reality; it proves only the integrity of the bounded result bytes used to create that digest and the observed verification process that produced it.

## Companion boundary

`companion/python` remains the repository's stdlib-only, execution-free evidence adapter. This DAV slice does not modify it, start it as an HTTP daemon, or grant it network, shell, credential, or file-mutation capability.

## API behavior

- `GET /tensor/:size` is the direct Fastify path.
- `GET /api/tensor/:size` is retained for direct observation and browser-proxy compatibility.
- The Vite `/api` proxy rewrites `/api/tensor/:size` to `/tensor/:size`.
- Allowed sizes are `4`, `6`, and `8`.
- Invalid sizes return HTTP `400` with error `UNKNOWN`.
- A failed invariant returns HTTP `422` with error `DIVERGENT`.
- Successful responses contain `status: VERIFIED`, statistics, the projection, and a SHA-256 receipt.

## UI behavior

`TensorDavVisualizer` is a human inspection surface. It provides:

- size toggles for `4 × 4 × 4 × 4`, `6 × 6 × 6 × 6`, and `8 × 8 × 8 × 8`;
- a color-mapped projection heatmap;
- hover row/column coordinates and the exact `i + j + k + l` value;
- checksum and statistical summary;
- a `🔒 Verified` badge only when the API returns a verified receipt;
- explicit `UNKNOWN` or `DIVERGENT` error states.

The UI does not execute commands, contact the Python companion, or infer external-world truth.

## Verification vocabulary

- `OBSERVED`: a route, file, process, or response was directly inspected.
- `VERIFIED`: the deterministic invariant check and the relevant bounded test passed.
- `UNKNOWN`: the requested state or dependency was unavailable or not inspected.
- `DIVERGENT`: observed data conflicted with the declared tensor contract.
- `NOT_EXECUTED`: a separately authorized external or production action was not run.
