import { describe, it, expect } from '@jest/globals';
import { InferenceClient } from '../index.js';

describe('InferenceClient Local & Sovereign Generation', () => {
  it('initializes with default local host configuration', () => {
    const client = new InferenceClient();
    expect(client).toBeDefined();
  });

  it('reports status with model metadata and availability boolean', async () => {
    const client = new InferenceClient({ timeoutMs: 500, fallbackToStub: true });
    const status = await client.getStatus();
    expect(status).toBeDefined();
    expect(typeof status.available).toBe('boolean');
    expect(status.model).toBe('phi3:mini');
    expect(Array.isArray(status.loadedModels)).toBe(true);
  });

  it('generates text completion in zero-dependency sovereign mode', async () => {
    const client = new InferenceClient({ timeoutMs: 500, fallbackToStub: true });
    const result = await client.generateCompletion('What is the sovereign bitcoin treasury status?');
    expect(result).toBeDefined();
    expect(typeof result.text).toBe('string');
    expect(result.text).toContain('bc1qaj8jmp5as80zwew09ep86w6fgw37zwhwzr89mp');
    expect(result.source).toBe('STUB');
  });

  it('generates water protocol response accurately', async () => {
    const client = new InferenceClient({ timeoutMs: 500, fallbackToStub: true });
    const result = await client.generateCompletion('Connect water protocol session room');
    expect(result.text).toContain('Water Protocol P2P room active');
  });

  it('generates Merkle DAG provenance response accurately', async () => {
    const client = new InferenceClient({ timeoutMs: 500, fallbackToStub: true });
    const result = await client.generateCompletion('Verify KAI Merkle DAG ledger memory');
    expect(result.text).toContain('KAI Merkle DAG memory continuum verified');
  });

  it('handles pullModel safely when local host is offline', async () => {
    const client = new InferenceClient({ timeoutMs: 500, fallbackToStub: true });
    const result = await client.pullModel('llama3.2:1b');
    expect(result).toBeDefined();
    expect(result.success).toBe(false);
    expect(result.status).toBe('UNAVAILABLE');
    expect(result.message).toContain('offline or unreachable');
  });
});
