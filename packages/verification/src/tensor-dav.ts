import { createHash } from 'node:crypto';

export const TENSOR_DAV_SIZES = [4, 6, 8] as const;
export type TensorDavSize = (typeof TENSOR_DAV_SIZES)[number];
export type TensorDavInvariants = {
  min: number;
  max: number;
  mean: number;
  checksum: number;
};

export type TensorDavPayload = {
  schema: 'omega.tensor-dav.v1';
  size: TensorDavSize;
  projection: {
    rows: number;
    columns: number;
    rowCoordinate: 'i * N + j';
    columnCoordinate: 'k * N + l';
  };
  values: number[][];
  invariants: TensorDavInvariants;
};

export type TensorDavVerification =
  | { status: 'VERIFIED'; payload: TensorDavPayload; sha256: string }
  | { status: 'DIVERGENT'; issues: string[] };

export function isTensorDavSize(value: unknown): value is TensorDavSize {
  return typeof value === 'number' && TENSOR_DAV_SIZES.includes(value as TensorDavSize);
}

/** Canonical JSON for the verified result; excludes the digest itself. */
export function canonicalTensorDavPayload(payload: TensorDavPayload): string {
  return JSON.stringify({
    schema: payload.schema,
    size: payload.size,
    projection: payload.projection,
    invariants: payload.invariants,
    values: payload.values,
  });
}

/**
 * Recompute every cell and invariant from the declared tensor, then hash only
 * the canonical result if all comparisons agree. An altered candidate fails closed.
 */
export function verifyTensorDav(candidate: unknown): TensorDavVerification {
  const issues: string[] = [];
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) {
    return { status: 'DIVERGENT', issues: ['candidate must be an object'] };
  }

  const value = candidate as Partial<TensorDavPayload>;
  if (!isTensorDavSize(value.size)) return { status: 'DIVERGENT', issues: ['unsupported tensor size'] };
  const size = value.size;
  const expectedValues = Array.from({ length: size * size }, (_, row) =>
    Array.from({ length: size * size }, (_, column) => {
      const i = Math.floor(row / size);
      const j = row % size;
      const k = Math.floor(column / size);
      const l = column % size;
      return i + j + k + l;
    }),
  );
  const flat = expectedValues.flat();
  const expectedInvariants: TensorDavInvariants = {
    min: 0,
    max: 4 * (size - 1),
    mean: 2 * (size - 1),
    checksum: 2 * size ** 4 * (size - 1),
  };

  if (value.schema !== 'omega.tensor-dav.v1') issues.push('schema mismatch');
  if (
    value.projection?.rows !== size ** 2
    || value.projection?.columns !== size ** 2
    || value.projection?.rowCoordinate !== 'i * N + j'
    || value.projection?.columnCoordinate !== 'k * N + l'
  ) issues.push('projection metadata mismatch');
  if (!Array.isArray(value.values) || JSON.stringify(value.values) !== JSON.stringify(expectedValues)) {
    issues.push('tensor values diverge from i + j + k + l');
  }
  const observedInvariants = value.invariants;
  if (
    !observedInvariants
    || observedInvariants.min !== expectedInvariants.min
    || observedInvariants.max !== expectedInvariants.max
    || observedInvariants.mean !== expectedInvariants.mean
    || observedInvariants.checksum !== expectedInvariants.checksum
  ) issues.push('invariant mismatch');
  if (flat.length !== size ** 4 || Math.min(...flat) !== expectedInvariants.min
    || Math.max(...flat) !== expectedInvariants.max
    || flat.reduce((sum, cell) => sum + cell, 0) !== expectedInvariants.checksum) {
    issues.push('recomputed tensor invariant mismatch');
  }

  if (issues.length > 0) return { status: 'DIVERGENT', issues };

  const payload: TensorDavPayload = {
    schema: 'omega.tensor-dav.v1',
    size,
    projection: {
      rows: size ** 2,
      columns: size ** 2,
      rowCoordinate: 'i * N + j',
      columnCoordinate: 'k * N + l',
    },
    values: expectedValues,
    invariants: expectedInvariants,
  };
  const sha256 = createHash('sha256').update(canonicalTensorDavPayload(payload), 'utf8').digest('hex');
  return { status: 'VERIFIED', payload, sha256 };
}

/** Build and independently verify the deterministic projected tensor. */
export function createTensorDav(size: TensorDavSize): TensorDavVerification {
  const values = Array.from({ length: size * size }, (_, row) =>
    Array.from({ length: size * size }, (_, column) => {
      const i = Math.floor(row / size);
      const j = row % size;
      const k = Math.floor(column / size);
      const l = column % size;
      return i + j + k + l;
    }),
  );
  const invariants = {
    min: Math.min(...values.flat()),
    max: Math.max(...values.flat()),
    mean: values.flat().reduce((sum, cell) => sum + cell, 0) / size ** 4,
    checksum: values.flat().reduce((sum, cell) => sum + cell, 0),
  };
  return verifyTensorDav({
    schema: 'omega.tensor-dav.v1',
    size,
    projection: {
      rows: size ** 2,
      columns: size ** 2,
      rowCoordinate: 'i * N + j',
      columnCoordinate: 'k * N + l',
    },
    values,
    invariants,
  });
}
