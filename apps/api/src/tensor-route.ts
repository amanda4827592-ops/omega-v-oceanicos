import { randomUUID } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import type { RememberEngine } from '@oceanicos/remember';
import type { TensorObservation, TensorSize } from '@oceanicos/types';
import { verifyTensorObservation } from '@oceanicos/verification';

const SUPPORTED_SIZES = new Set<number>([4, 6, 8]);
const PYTHON_TIMEOUT_MS = 750;

type TensorPayload = Omit<TensorObservation, 'id' | 'observedAt' | 'source'> & {
  id?: string;
  observedAt?: string;
  source?: TensorObservation['source'];
};

export function generateTensor(size: TensorSize): TensorPayload {
  const width = size ** 2;
  const matrix_2d: number[][] = [];
  for (let row = 0; row < width; row += 1) {
    const i = Math.floor(row / size);
    const k = row % size;
    const values: number[] = [];
    for (let column = 0; column < width; column += 1) {
      const j = Math.floor(column / size);
      const l = column % size;
      values.push(i + j + k + l);
    }
    matrix_2d.push(values);
  }
  return {
    size,
    shape_4d: [size, size, size, size],
    shape_2d: [width, width],
    min_val: 0,
    max_val: 4 * (size - 1),
    checksum: 2 * size ** 4 * (size - 1),
    matrix_2d,
  };
}

function parseSize(value: string): TensorSize | null {
  const size = Number(value);
  return Number.isInteger(size) && SUPPORTED_SIZES.has(size) ? size as TensorSize : null;
}

function toObservation(payload: TensorPayload, source: TensorObservation['source']): TensorObservation {
  return {
    id: typeof payload.id === 'string' && payload.id ? payload.id : `tensor-${randomUUID()}`,
    observedAt: typeof payload.observedAt === 'string' && payload.observedAt ? payload.observedAt : new Date().toISOString(),
    source,
    size: payload.size,
    shape_4d: payload.shape_4d,
    shape_2d: payload.shape_2d,
    min_val: payload.min_val,
    max_val: payload.max_val,
    checksum: payload.checksum,
    matrix_2d: payload.matrix_2d,
  };
}

async function observeFromPython(size: TensorSize): Promise<TensorObservation | null> {
  const base = (process.env.OCEANICOS_PYTHON_URL?.trim() || 'http://127.0.0.1:8000').replace(/\/$/, '');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PYTHON_TIMEOUT_MS);
  try {
    const response = await fetch(`${base}/tensor/${size}`, { signal: controller.signal });
    if (!response.ok) return null;
    const payload = await response.json() as TensorPayload;
    return toObservation(payload, 'companion-python');
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function rememberTensor(engine: RememberEngine, observation: TensorObservation, verified: boolean, digest: string): { status: 'VERIFIED' | 'UNKNOWN'; blockIndex: number | null } {
  try {
    const block = engine.append(
      {
        uuid: observation.id,
        timestamp: observation.observedAt,
        siliconYield: verified ? 1 : 0,
        gridLoadMegawatts: observation.checksum,
        acceleratorInventory: observation.size,
      },
      {
        status: verified ? 'PASS' : 'DIVERGENT',
        lawRoute: 'OBSERVE → VERIFY → REMEMBER → DAV',
        timestamp: new Date().toISOString(),
        observationUuid: observation.id,
        signatureProof: digest,
      },
    );
    return { status: 'VERIFIED', blockIndex: block.index };
  } catch {
    return { status: 'UNKNOWN', blockIndex: null };
  }
}

export function registerTensorRoute(fastify: FastifyInstance, ledgerMemory: RememberEngine): void {
  fastify.get('/api/tensor/:size', async (request, reply) => {
    const size = parseSize((request.params as { size?: string }).size ?? '');
    if (size === null) {
      return reply.status(400).send({
        success: false,
        status: 'DIVERGENT',
        error: 'TENSOR_SIZE_UNSUPPORTED',
        supportedSizes: [4, 6, 8],
      });
    }

    const pythonObservation = await observeFromPython(size);
    const observation = pythonObservation ?? toObservation(generateTensor(size), 'typescript-fallback');
    const verification = verifyTensorObservation(observation);
    const memory = rememberTensor(ledgerMemory, observation, verification.status === 'VERIFIED', verification.digest);
    return {
      success: true,
      status: verification.status,
      observation,
      verification,
      memory: {
        status: memory.status,
        blockIndex: memory.blockIndex,
        evidenceBoundary: 'local SQLite RememberEngine receipt; memory is not proof of deployment or external truth',
      },
      sourceStatus: pythonObservation ? 'OBSERVED' : 'UNKNOWN',
      source: observation.source,
      evidenceBoundary: 'bounded local tensor computation and exact formula verification',
    };
  });
}
