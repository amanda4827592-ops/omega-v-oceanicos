import type { FastifyInstance } from 'fastify';
import { computeTensorDav, TENSOR_DAV_SIZES, type TensorDavSize } from '@oceanicos/verification';

type JsonError = (reply: any, status: number, error: string, extra?: Record<string, unknown>) => unknown;

export function registerTensorDavRoute(fastify: FastifyInstance, jsonError: JsonError): void {
  const handler = async (request: any, reply: any) => {
    const rawSize = Number(request.params?.size);
    if (!Number.isInteger(rawSize) || !TENSOR_DAV_SIZES.includes(rawSize as TensorDavSize)) {
      return jsonError(reply, 400, 'UNKNOWN', {
        message: `tensor size must be one of: ${TENSOR_DAV_SIZES.join(', ')}`,
      });
    }
    try {
      const result = computeTensorDav(rawSize);
      if (result.status !== 'VERIFIED' || !result.receipt) {
        return jsonError(reply, 422, 'DIVERGENT', { data: result });
      }
      return reply.code(200).send({
        success: true,
        data: result,
        meta: {
          source: 'packages/verification/tensor-dav',
          execution: 'OBSERVED',
          ledger: 'VERIFIED receipt is emitted for post-gate append only',
        },
      });
    } catch (error) {
      return jsonError(reply, 422, 'DIVERGENT', { message: String((error as Error)?.message ?? error) });
    }
  };

  // The web proxy strips /api before forwarding to Fastify. Keep both paths
  // available so direct API observation and browser-relative observation share
  // the same bounded handler.
  fastify.get('/tensor/:size', handler);
  fastify.get('/api/tensor/:size', handler);
}
