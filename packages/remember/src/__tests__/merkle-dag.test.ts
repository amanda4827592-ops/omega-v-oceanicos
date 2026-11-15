import { describe, it, expect } from '@jest/globals';
import {
  computeMerkleRoot,
  computeMerkleProof,
  verifyMerkleProof,
  MerkleDagEngine,
  sha256,
} from '../merkle-dag.js';
import { KaiLedger } from '../kai.js';

describe('MerkleDagEngine and Cryptographic Proofs', () => {
  it('computes deterministic Merkle roots over arbitrary leaf sets', () => {
    const leaves = [sha256('leaf-0'), sha256('leaf-1'), sha256('leaf-2')];
    const root = computeMerkleRoot(leaves);
    expect(root).toBeDefined();
    expect(typeof root).toBe('string');
    expect(root.length).toBe(64);

    // Determinism
    expect(computeMerkleRoot(leaves)).toBe(root);
  });

  it('generates and verifies Merkle inclusion proofs correctly', () => {
    const leaves = [
      sha256('assertion-1'),
      sha256('assertion-2'),
      sha256('assertion-3'),
      sha256('assertion-4'),
    ];
    const root = computeMerkleRoot(leaves);

    for (let i = 0; i < leaves.length; i++) {
      const proof = computeMerkleProof(leaves, i);
      expect(proof.root).toBe(root);
      expect(verifyMerkleProof(proof)).toBe(true);
    }
  });

  it('builds a verified Merkle DAG from KaiLedger records', () => {
    const ledger = new KaiLedger(':memory:');
    ledger.append({
      distinction: 'OBSERVED',
      statement: 'Local fastify node active on port 5000',
      subject: 'network:fastify',
      source: 'test',
      author: 'agent:antigravity',
    });
    ledger.append({
      distinction: 'VERIFIED',
      statement: 'Vite web preview serving React 18 on port 3000',
      subject: 'network:vite',
      source: 'test',
      author: 'agent:antigravity',
    });

    const dag = ledger.getDag();
    expect(dag.protocol).toBe('ΩVØØS-DAG/1');
    expect(dag.nodeCount).toBe(3);
    expect(dag.nodes.length).toBe(3);
    expect(dag.verified).toBe(true);

    const verification = MerkleDagEngine.verifyDag(dag);
    expect(verification.valid).toBe(true);

    // Genesis node has 0 or genesis parents
    expect(dag.nodes[0].nodeId).toBe('kai-genesis-0');
    // Child node has previousHash as parent
    expect(dag.nodes[1].parentHashes.length).toBeGreaterThan(0);
  });

  it('builds a verified Merkle DAG from swarm ledger receipts', () => {
    const sampleReceipts = [
      {
        agent_id: 'genesis',
        branch: 'agent/genesis/init',
        status: 'VERIFIED',
        files_touched: ['kai_ledger.json'],
        tests_passed: true,
        evidence_hash: sha256('genesis-evidence'),
        next_delta: 'Initialize continuum',
        timestamp: '2026-09-06T14:15:00.000Z',
      },
      {
        agent_id: 'antigravity',
        branch: 'agent/antigravity/step-1',
        status: 'VERIFIED',
        files_touched: ['apps/api/src/index.ts'],
        tests_passed: true,
        evidence_hash: sha256('step-1-evidence'),
        next_delta: 'Expand memory',
        timestamp: '2026-11-15T00:00:00.000Z',
      },
    ];

    const dag = MerkleDagEngine.buildFromSwarmReceipts(sampleReceipts);
    expect(dag.protocol).toBe('ΩVØØS-DAG/1');
    expect(dag.nodeCount).toBe(2);
    expect(dag.nodes[1].parentHashes[0]).toBe(dag.nodes[0].nodeHash);

    const verification = MerkleDagEngine.verifyDag(dag);
    expect(verification.valid).toBe(true);
  });
});
