import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createApp } from '../index';

describe('4D tensor DAV API', () => {
  const previousPythonUrl = process.env.OCEANICOS_PYTHON_URL;
  beforeEach(() => { process.env.OCEANICOS_PYTHON_URL = 'http://127.0.0.1:59999'; });
  afterAll(() => {
    if (previousPythonUrl === undefined) delete process.env.OCEANICOS_PYTHON_URL;
    else process.env.OCEANICOS_PYTHON_URL = previousPythonUrl;
  });

  it('uses the deterministic fallback and returns a VERIFIED receipt', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'omega-tensor-api-'));
    const app = createApp(join(directory, 'ledger.db'), false);
    try {
      const response = await app.inject({ method: 'GET', url: '/api/tensor/4' });
      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.status).toBe('VERIFIED');
      expect(body.source).toBe('typescript-fallback');
      expect(body.observation.shape_4d).toEqual([4, 4, 4, 4]);
      expect(body.observation.shape_2d).toEqual([16, 16]);
      expect(body.observation.checksum).toBe(1536);
      expect(body.verification.failedRules).toEqual([]);
      expect(body.memory.status).toBe('VERIFIED');
    } finally {
      await app.close();
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it('rejects sizes outside the bounded DAV contract', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'omega-tensor-api-invalid-'));
    const app = createApp(join(directory, 'ledger.db'), false);
    try {
      const response = await app.inject({ method: 'GET', url: '/api/tensor/5' });
      expect(response.statusCode).toBe(400);
      expect(response.json()).toMatchObject({ status: 'DIVERGENT', error: 'TENSOR_SIZE_UNSUPPORTED' });
    } finally {
      await app.close();
      rmSync(directory, { recursive: true, force: true });
    }
  });
});
