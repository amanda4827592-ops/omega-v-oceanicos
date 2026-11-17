import { createHash } from 'node:crypto';
import type {
  TensorDavReceipt as SharedTensorDavReceipt,
  TensorDavSize as SharedTensorDavSize,
  TensorDavStats as SharedTensorDavStats,
  TensorObservation,
  TensorVerification,
} from '@oceanicos/types';

export const TENSOR_DAV_SIZES = [4, 6, 8] as const;
export type TensorDavSize = SharedTensorDavSize;
export type TensorDavStatus = TensorVerification['status'];
export type TensorDavStats = SharedTensorDavStats;
export type TensorDavReceipt = SharedTensorDavReceipt;
export type TensorDavPayload = TensorObservation & TensorVerification;

const isTensorDavSize = (value: number): value is TensorDavSize =>
  TENSOR_DAV_SIZES.includes(value as TensorDavSize);

const canonicalReceiptPayload = (payload: Omit<TensorDavPayload, 'receipt'>): string =>
  JSON.stringify({
    size: payload.size,
    shape_4d: payload.shape_4d,
    shape_2d: payload.shape_2d,
    projection: payload.projection,
    stats: payload.stats,
    status: payload.status,
    reason: payload.reason,
  });

export const expectedTensorDavStats = (size: TensorDavSize): TensorDavStats => ({
  minVal: 0,
  maxVal: 4 * (size - 1),
  mean: 2 * (size - 1),
  checksum: 2 * size ** 4 * (size - 1),
});

export const computeTensorDav = (size: number): TensorDavPayload => {
  if (!Number.isInteger(size) || !isTensorDavSize(size)) {
    throw new Error(`tensor size must be one of: ${TENSOR_DAV_SIZES.join(', ')}`);
  }
  const projection = Array.from({ length: size * size }, (_, row) =>
    Array.from({ length: size * size }, (_, column) => {
      const i = Math.floor(row / size);
      const j = row % size;
      const k = Math.floor(column / size);
      const l = column % size;
      return i + j + k + l;
    }),
  );
  const values = projection.flat();
  const shape_4d = [size, size, size, size] as const;
  const shape_2d = [size * size, size * size] as const;
  const stats: TensorDavStats = {
    minVal: Math.min(...values),
    maxVal: Math.max(...values),
    mean: values.reduce((sum, value) => sum + value, 0) / values.length,
    checksum: values.reduce((sum, value) => sum + value, 0),
  };
  const candidate: Omit<TensorDavPayload, 'receipt'> = {
    size,
    shape_4d,
    shape_2d,
    projection,
    stats,
    status: 'UNKNOWN',
    reason: null,
  };
  const verified = verifyTensorDav(candidate);
  const receipt = verified.status === 'VERIFIED'
    ? createTensorDavReceipt(verified)
    : null;
  return { ...verified, receipt };
};

export const verifyTensorDav = (
  candidate: Omit<TensorDavPayload, 'receipt'>,
): Omit<TensorDavPayload, 'receipt'> => {
  if (!isTensorDavSize(candidate.size)) {
    return { ...candidate, status: 'DIVERGENT', reason: 'unsupported tensor size' };
  }
  const expected = expectedTensorDavStats(candidate.size);
  const expectedDimension = candidate.size * candidate.size;
  const shapesMatch = candidate.shape_4d.length === 4
    && candidate.shape_4d.every((dimension) => dimension === candidate.size)
    && candidate.shape_2d[0] === expectedDimension
    && candidate.shape_2d[1] === expectedDimension;
  const dimensionsMatch = candidate.projection.length === expectedDimension
    && candidate.projection.every((row) => row.length === expectedDimension);
  const statsMatch = candidate.stats.minVal === expected.minVal
    && candidate.stats.maxVal === expected.maxVal
    && candidate.stats.mean === expected.mean
    && candidate.stats.checksum === expected.checksum;
  if (!shapesMatch || !dimensionsMatch || !statsMatch) {
    return {
      ...candidate,
      status: 'DIVERGENT',
      reason: !shapesMatch
        ? 'tensor shapes diverge from tensor size'
        : !dimensionsMatch
          ? 'projection dimensions diverge from tensor size'
          : 'tensor statistical invariant diverged',
    };
  }
  return { ...candidate, status: 'VERIFIED', reason: null };
};

export const createTensorDavReceipt = (
  payload: Omit<TensorDavPayload, 'receipt'>,
): TensorDavReceipt => {
  if (payload.status !== 'VERIFIED') throw new Error('only verified tensors can receive a receipt');
  const digest = createHash('sha256').update(canonicalReceiptPayload(payload)).digest('hex');
  return { algorithm: 'sha256', digest, status: 'VERIFIED' };
};

export const tensorDavReceiptInput = (payload: TensorDavPayload): string =>
  canonicalReceiptPayload({ ...payload, receipt: undefined } as Omit<TensorDavPayload, 'receipt'>);
