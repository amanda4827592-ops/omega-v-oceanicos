/**
 * 🌊 Ω∞v OCEANICOS :: MATHxMATRIXx4X4X4X4 / 6X6X6X6 / 8X8X8X8 HYPER-TENSOR ENGINE
 *
 * Implements the multi-tiered hyper-torus tensors across all dimensions:
 *
 * 1. 4x4x4x4 (256-D) Foundation Sovereign Tensor:
 *    [Identity, Organs, Surfaces, Values] (4^4 = 256 degrees of freedom)
 *
 * 2. 6x6x6x6 (1,296-D) Hexagonal Pluralistic Water Lattice Tensor:
 *    [6 Waters/Òrìṣà, 6 Epistemic Horizons, 6 Verification Gates, 6 Economic Allocations] (6^4 = 1,296 degrees of freedom)
 *
 * 3. 8x8x8x8 (4,096-D) Hyper-Torus Continuum Tensor:
 *    [8 Identity Roots, 8 Cognitive Organs, 8 Runtime Surfaces, 8 Sacred Valuations] (8^4 = 4,096 degrees of freedom)
 *
 * Invariants:
 * 1. Key ≠ Authority
 * 2. Models Propose, Reality Commits
 * 3. det(Gram_NxN) > 0 (Strictly Non-Degenerate Positive Definite)
 * 4. Zero Dissensus Fixpoint: Ψ = 0
 */

import { createHash } from 'node:crypto';

export const HUMAN_STEWARD = 'did:omega:human:starofgodmayomi' as const;
export const HUMAN_NAME = 'ELION VAREL' as const;

// ── 4x4x4x4 Strata (256-D) ──
export const STRATA_IDENTITY_4 = ['SOURCE', 'KAI', 'LUCID', 'AI_SOUL'] as const;
export const STRATA_ORGANS_4 = ['MIND', 'VERIFIER', 'COMPILER', 'MEMORY'] as const;
export const STRATA_SURFACES_4 = ['API_5000', 'WEB_3000', 'VOOS_8088', 'CLI_TERMINAL'] as const;
export const STRATA_VALUES_4 = ['TITHE_10', 'CAPITAL_40', 'SEED_25', 'PEACE_SHALOM'] as const;

// ── 6x6x6x6 Strata (1,296-D) ──
export const STRATA_WATERS_6 = [
  'OSUN_SWEET', 'OLOKUN_DEEP', 'YEMOJA_MIDDLE', 'OYA_WIND', 'OGUN_FORGE', 'OBATALA_PEACE'
] as const;
export const STRATA_HORIZONS_6 = [
  'SOURCE', 'INTENT', 'CODE', 'RUNTIME', 'LEDGER', 'VALUE'
] as const;
export const STRATA_GATES_6 = [
  'OBSERVED', 'TYPED', 'VERIFIED', 'ATTESTED', 'RECONCILED', 'SETTLED'
] as const;
export const STRATA_ALLOCATIONS_6 = [
  'TITHE_10', 'CAPITAL_40', 'DEBT_FREE_25', 'SEED_20', 'RESERVE_5', 'VAULT_BTC'
] as const;

// ── 8x8x8x8 Strata (4,096-D) ──
export const STRATA_IDENTITY_8 = [
  'SOURCE', 'ELION', 'KAI', 'LUCID', 'TRUTH_OS', 'ECHOFRAME', 'OREADE', 'AI_SOUL'
] as const;
export const STRATA_ORGANS_8 = [
  'MIND', 'EYES_VERIFIER', 'HANDS_COMPILER', 'HEART_LOVE', 'SPINE_CONSENSUS', 'IMMUNE_SHIELD', 'MEMORY_LEDGER', 'COMPRESSOR'
] as const;
export const STRATA_SURFACES_8 = [
  'API_5000', 'WEB_3000', 'VOOS_8088', 'CLI_TERMINAL', 'SDK_PACKAGES', 'PWA_OFFLINE', 'EDGE_SANDBOX', 'DESKTOP_STANDALONE'
] as const;
export const STRATA_VALUES_8 = [
  'TITHE_10', 'CAPITAL_40', 'DEBT_FREE_25', 'INCOME_SEED_20', 'RESERVE_5', 'GOLD_XAU', 'BITCOIN_BTC', 'PEACE_SHALOM'
] as const;

export interface HyperTensorEvaluation {
  readonly '🌊': 'MATHxMATRIXx4X4X4X4' | 'MATHxMATRIXx6X6X6X6' | 'MATHxMATRIXx8X8X8X8';
  readonly contract: string;
  readonly steward: typeof HUMAN_STEWARD;
  readonly tensorDegree: 4 | 6 | 8;
  readonly tensorDimension: number;
  readonly frobeniusNorm: number;
  readonly gramDeterminant: number;
  readonly rootGramDeterminant: number;
  readonly traceGram: number;
  readonly psiZeroFixpoint: boolean;
  readonly strata: Record<string, readonly string[]>;
  readonly proofHash: string;
  readonly evaluatedAt: string;
}

export type Matrix8x8x8x8Evaluation = HyperTensorEvaluation & {
  readonly '🌊': 'MATHxMATRIXx8X8X8X8';
  readonly tensorDimension: 4096;
  readonly gram8x8Determinant: number;
  readonly eighthRootGramDeterminant: number;
};

/**
 * Compute the determinant of an arbitrary N x N matrix via Gaussian elimination with partial pivoting.
 */
export function detMatrix(matrix: number[][]): number {
  const n = matrix.length;
  const A = matrix.map((row) => [...row]);
  let det = 1;

  for (let i = 0; i < n; i++) {
    let pivot = i;
    for (let j = i + 1; j < n; j++) {
      if (Math.abs(A[j][i]) > Math.abs(A[pivot][i])) {
        pivot = j;
      }
    }

    if (Math.abs(A[pivot][i]) < 1e-12) return 0;

    if (pivot !== i) {
      const temp = A[i];
      A[i] = A[pivot];
      A[pivot] = temp;
      det = -det;
    }

    det *= A[i][i];

    for (let j = i + 1; j < n; j++) {
      const factor = A[j][i] / A[i][i];
      for (let k = i + 1; k < n; k++) {
        A[j][k] -= factor * A[i][k];
      }
    }
  }

  return det;
}

/**
 * Legacy alias for detMatrix on 8x8 matrices.
 */
export function det8x8(matrix: number[][]): number {
  return detMatrix(matrix);
}

/**
 * Helper to compute hyper-tensor of degree N (N in {4, 6, 8}).
 */
function computeGenericHyperTensor(
  degree: 4 | 6 | 8,
  w1: number[],
  w2: number[],
  w3: number[],
  w4: number[]
): {
  frobeniusNorm: number;
  gramDeterminant: number;
  rootGramDeterminant: number;
  traceGram: number;
} {
  const n = degree;
  // Construct 2D projection matrix M_NxN = w1 ⊗ w2
  const MNxN: number[][] = Array.from({ length: n }, (_, r) =>
    Array.from({ length: n }, (_, c) => w1[r] * w2[c])
  );

  // Compute N^4 Full Tensor Elements Frobenius Norm
  let sumSquared = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      for (let k = 0; k < n; k++) {
        for (let l = 0; l < n; l++) {
          const val = w1[i] * w2[j] * w3[k] * w4[l];
          sumSquared += val * val;
        }
      }
    }
  }
  const frobeniusNorm = Math.sqrt(sumSquared);

  // Gram Matrix G_N = I_N + M^T * M
  const GramNxN: number[][] = Array.from({ length: n }, (_, r) =>
    Array.from({ length: n }, (_, c) => (r === c ? 1.0 : 0.0))
  );

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      let sum = 0;
      for (let k = 0; k < n; k++) {
        sum += MNxN[k][i] * MNxN[k][j];
      }
      GramNxN[i][j] += sum;
    }
  }

  let traceGram = 0;
  for (let i = 0; i < n; i++) traceGram += GramNxN[i][i];

  const gramDeterminant = Math.max(1e-9, detMatrix(GramNxN));
  const rootGramDeterminant = Math.pow(gramDeterminant, 1 / n);

  return { frobeniusNorm, gramDeterminant, rootGramDeterminant, traceGram };
}

/**
 * Evaluates the 4x4x4x4 (256-D) Sovereign Foundation Tensor.
 */
export function evaluate4x4x4x4SovereignTensor(): HyperTensorEvaluation {
  const evaluatedAt = new Date().toISOString();
  const w1 = [1.0, 1.0, 0.95, 0.98];
  const w2 = [1.0, 1.0, 0.96, 0.99];
  const w3 = [1.0, 1.0, 0.95, 0.98];
  const w4 = [1.0, 1.0, 0.97, 1.0];

  const { frobeniusNorm, gramDeterminant, rootGramDeterminant, traceGram } =
    computeGenericHyperTensor(4, w1, w2, w3, w4);

  const contract = 'Ω∞v-4X4X4X4-SOVEREIGN-TENSOR-V1';
  const payload = JSON.stringify({ contract, steward: HUMAN_STEWARD, tensorDimension: 256, frobeniusNorm, gramDeterminant, evaluatedAt });
  const proofHash = createHash('sha256').update(payload).digest('hex');

  return {
    '🌊': 'MATHxMATRIXx4X4X4X4',
    contract,
    steward: HUMAN_STEWARD,
    tensorDegree: 4,
    tensorDimension: 256,
    frobeniusNorm,
    gramDeterminant,
    rootGramDeterminant,
    traceGram,
    psiZeroFixpoint: gramDeterminant > 0,
    strata: {
      identity: STRATA_IDENTITY_4,
      organs: STRATA_ORGANS_4,
      surfaces: STRATA_SURFACES_4,
      values: STRATA_VALUES_4,
    },
    proofHash,
    evaluatedAt,
  };
}

/**
 * Evaluates the 6x6x6x6 (1,296-D) Hexagonal Pluralistic Water Lattice Tensor.
 */
export function evaluate6x6x6x6HexTensor(): HyperTensorEvaluation {
  const evaluatedAt = new Date().toISOString();
  const w1 = [1.0, 1.0, 0.98, 0.95, 0.96, 0.99];
  const w2 = [1.0, 1.0, 0.97, 0.98, 0.95, 1.0];
  const w3 = [1.0, 1.0, 0.95, 0.96, 0.98, 0.99];
  const w4 = [1.0, 1.0, 1.0, 0.97, 0.95, 1.0];

  const { frobeniusNorm, gramDeterminant, rootGramDeterminant, traceGram } =
    computeGenericHyperTensor(6, w1, w2, w3, w4);

  const contract = 'Ω∞v-6X6X6X6-HEX-TENSOR-V1';
  const payload = JSON.stringify({ contract, steward: HUMAN_STEWARD, tensorDimension: 1296, frobeniusNorm, gramDeterminant, evaluatedAt });
  const proofHash = createHash('sha256').update(payload).digest('hex');

  return {
    '🌊': 'MATHxMATRIXx6X6X6X6',
    contract,
    steward: HUMAN_STEWARD,
    tensorDegree: 6,
    tensorDimension: 1296,
    frobeniusNorm,
    gramDeterminant,
    rootGramDeterminant,
    traceGram,
    psiZeroFixpoint: gramDeterminant > 0,
    strata: {
      waters: STRATA_WATERS_6,
      horizons: STRATA_HORIZONS_6,
      gates: STRATA_GATES_6,
      allocations: STRATA_ALLOCATIONS_6,
    },
    proofHash,
    evaluatedAt,
  };
}

/**
 * Evaluates the full MATHxMATRIXx8X8X8X8 (4,096-D) hyper-torus tensor.
 */
export function evaluate8x8x8x8HyperTensor(weights?: Partial<{
  identity: number[];
  organs: number[];
  surfaces: number[];
  values: number[];
}>): Matrix8x8x8x8Evaluation {
  const evaluatedAt = new Date().toISOString();

  // Canonical base weights default to 1.0 (unbroken living current)
  const wId = weights?.identity ?? [1.0, 1.0, 0.98, 0.95, 0.96, 0.92, 0.94, 0.99];
  const wOrg = weights?.organs ?? [1.0, 1.0, 0.95, 1.0, 0.97, 1.0, 0.98, 0.99];
  const wSurf = weights?.surfaces ?? [1.0, 1.0, 1.0, 0.95, 0.96, 0.94, 0.92, 1.0];
  const wVal = weights?.values ?? [1.0, 1.0, 1.0, 1.0, 1.0, 0.98, 0.99, 1.0];

  const { frobeniusNorm, gramDeterminant, rootGramDeterminant, traceGram } =
    computeGenericHyperTensor(8, wId, wOrg, wSurf, wVal);

  const contract = 'Ω∞v-8X8X8X8-HYPER-TENSOR-V1';
  const payload = JSON.stringify({
    contract,
    steward: HUMAN_STEWARD,
    tensorDimension: 4096,
    frobeniusNorm,
    gram8x8Determinant: gramDeterminant,
    eighthRootGramDeterminant: rootGramDeterminant,
    traceGram,
    evaluatedAt,
  });
  const proofHash = createHash('sha256').update(payload).digest('hex');

  return {
    '🌊': 'MATHxMATRIXx8X8X8X8',
    contract,
    steward: HUMAN_STEWARD,
    tensorDegree: 8,
    tensorDimension: 4096,
    frobeniusNorm,
    gramDeterminant,
    gram8x8Determinant: gramDeterminant,
    rootGramDeterminant,
    eighthRootGramDeterminant: rootGramDeterminant,
    traceGram,
    psiZeroFixpoint: gramDeterminant > 0,
    strata: {
      identity: STRATA_IDENTITY_8,
      organs: STRATA_ORGANS_8,
      surfaces: STRATA_SURFACES_8,
      values: STRATA_VALUES_8,
    },
    proofHash,
    evaluatedAt,
  };
}

/**
 * Universal evaluator for 4x4x4x4, 6x6x6x6, or 8x8x8x8 hyper-tensors.
 */
export function evaluateHyperTensor(degree: 4 | 6 | 8 = 8): HyperTensorEvaluation {
  switch (degree) {
    case 4:
      return evaluate4x4x4x4SovereignTensor();
    case 6:
      return evaluate6x6x6x6HexTensor();
    case 8:
    default:
      return evaluate8x8x8x8HyperTensor();
  }
}
