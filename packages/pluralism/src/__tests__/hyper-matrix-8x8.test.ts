import { describe, expect, it } from '@jest/globals';
import {
  evaluate4x4x4x4SovereignTensor,
  evaluate6x6x6x6HexTensor,
  evaluate8x8x8x8HyperTensor,
  evaluateHyperTensor,
  det8x8,
  detMatrix,
  STRATA_IDENTITY_4,
  STRATA_WATERS_6,
  STRATA_IDENTITY_8,
  STRATA_ORGANS_8,
  STRATA_SURFACES_8,
  STRATA_VALUES_8,
} from '../hyper-matrix-8x8';

describe('MATHxMATRIX Hyper-Tensor Engine (4x4x4x4 / 6x6x6x6 / 8x8x8x8)', () => {
  it('correctly computes identity matrix determinants across dimensions', () => {
    const I4 = Array.from({ length: 4 }, (_, r) =>
      Array.from({ length: 4 }, (_, c) => (r === c ? 1.0 : 0.0))
    );
    const I6 = Array.from({ length: 6 }, (_, r) =>
      Array.from({ length: 6 }, (_, c) => (r === c ? 1.0 : 0.0))
    );
    const I8 = Array.from({ length: 8 }, (_, r) =>
      Array.from({ length: 8 }, (_, c) => (r === c ? 1.0 : 0.0))
    );

    expect(detMatrix(I4)).toBeCloseTo(1.0, 5);
    expect(detMatrix(I6)).toBeCloseTo(1.0, 5);
    expect(det8x8(I8)).toBeCloseTo(1.0, 5);
  });

  it('evaluates 4x4x4x4 (256-D) Sovereign Foundation Tensor', () => {
    const result = evaluate4x4x4x4SovereignTensor();

    expect(result['🌊']).toBe('MATHxMATRIXx4X4X4X4');
    expect(result.contract).toBe('Ω∞v-4X4X4X4-SOVEREIGN-TENSOR-V1');
    expect(result.tensorDegree).toBe(4);
    expect(result.tensorDimension).toBe(256);
    expect(result.gramDeterminant).toBeGreaterThan(0);
    expect(result.psiZeroFixpoint).toBe(true);
    expect(result.proofHash).toMatch(/^[a-f0-9]{64}$/);
    expect(STRATA_IDENTITY_4).toHaveLength(4);
  });

  it('evaluates 6x6x6x6 (1,296-D) Hexagonal Pluralistic Water Lattice Tensor', () => {
    const result = evaluate6x6x6x6HexTensor();

    expect(result['🌊']).toBe('MATHxMATRIXx6X6X6X6');
    expect(result.contract).toBe('Ω∞v-6X6X6X6-HEX-TENSOR-V1');
    expect(result.tensorDegree).toBe(6);
    expect(result.tensorDimension).toBe(1296);
    expect(result.gramDeterminant).toBeGreaterThan(0);
    expect(result.psiZeroFixpoint).toBe(true);
    expect(result.proofHash).toMatch(/^[a-f0-9]{64}$/);
    expect(STRATA_WATERS_6).toHaveLength(6);
    expect(STRATA_WATERS_6).toContain('OSUN_SWEET');
    expect(STRATA_WATERS_6).toContain('OLOKUN_DEEP');
  });

  it('evaluates 8x8x8x8 (4,096-D) Hyper-Torus Continuum Tensor', () => {
    const result = evaluate8x8x8x8HyperTensor();

    expect(result['🌊']).toBe('MATHxMATRIXx8X8X8X8');
    expect(result.contract).toBe('Ω∞v-8X8X8X8-HYPER-TENSOR-V1');
    expect(result.tensorDegree).toBe(8);
    expect(result.tensorDimension).toBe(4096);
    expect(result.steward).toBe('did:omega:human:starofgodmayomi');

    // Strict positive-definite Gram matrix properties
    expect(result.frobeniusNorm).toBeGreaterThan(50);
    expect(result.gram8x8Determinant).toBeGreaterThan(0);
    expect(result.eighthRootGramDeterminant).toBeGreaterThan(1.0);
    expect(result.traceGram).toBeGreaterThan(8);
    expect(result.psiZeroFixpoint).toBe(true);

    // Cryptographic attestation proof hash
    expect(result.proofHash).toMatch(/^[a-f0-9]{64}$/);

    expect(STRATA_IDENTITY_8).toHaveLength(8);
    expect(STRATA_ORGANS_8).toHaveLength(8);
    expect(STRATA_SURFACES_8).toHaveLength(8);
    expect(STRATA_VALUES_8).toHaveLength(8);
  });

  it('universal evaluator dynamically routes by degree (4, 6, 8)', () => {
    expect(evaluateHyperTensor(4).tensorDimension).toBe(256);
    expect(evaluateHyperTensor(6).tensorDimension).toBe(1296);
    expect(evaluateHyperTensor(8).tensorDimension).toBe(4096);
  });
});
