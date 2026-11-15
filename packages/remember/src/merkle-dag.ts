import { createHash } from 'node:crypto';
import type { KaiProvenanceRecord } from '@oceanicos/types';
import { KAI_GENESIS_HASH, KAI_GENESIS_ID } from './kai.js';

export interface MerkleDagNode {
  nodeId: string;
  index: number;
  timestamp: string;
  contentHash: string;
  merkleRoot: string;
  parentHashes: string[];
  nodeHash: string;
  data: {
    subject?: string;
    statement?: string;
    distinction?: string;
    author?: string;
    evidenceRef?: string;
    metadata?: Record<string, unknown>;
  };
}

export interface KaiMerkleDag {
  protocol: 'ΩVØØS-DAG/1';
  genesisHash: string;
  tipHash: string;
  nodeCount: number;
  nodes: MerkleDagNode[];
  roots: string[];
  tips: string[];
  verified: boolean;
  computedAt: string;
}

export interface MerkleProof {
  leaf: string;
  index: number;
  siblings: string[];
  root: string;
}

/**
 * Computes SHA-256 hash of a string.
 */
export function sha256(data: string): string {
  return createHash('sha256').update(data).digest('hex');
}

/**
 * Computes binary Merkle root over an array of leaf hashes.
 */
export function computeMerkleRoot(leaves: string[]): string {
  if (leaves.length === 0) {
    return sha256('');
  }
  if (leaves.length === 1) {
    return leaves[0];
  }

  let currentLevel = [...leaves];

  while (currentLevel.length > 1) {
    const nextLevel: string[] = [];
    for (let i = 0; i < currentLevel.length; i += 2) {
      const left = currentLevel[i];
      const right = i + 1 < currentLevel.length ? currentLevel[i + 1] : left;
      nextLevel.push(sha256(left + right));
    }
    currentLevel = nextLevel;
  }

  return currentLevel[0];
}

/**
 * Computes Merkle proof for a given leaf index.
 */
export function computeMerkleProof(leaves: string[], targetIndex: number): MerkleProof {
  if (targetIndex < 0 || targetIndex >= leaves.length) {
    throw new Error(`Leaf index ${targetIndex} out of range [0, ${leaves.length - 1}]`);
  }

  const siblings: string[] = [];
  let currentLevel = [...leaves];
  let idx = targetIndex;

  while (currentLevel.length > 1) {
    const nextLevel: string[] = [];
    for (let i = 0; i < currentLevel.length; i += 2) {
      const left = currentLevel[i];
      const right = i + 1 < currentLevel.length ? currentLevel[i + 1] : left;

      if (i === idx || i + 1 === idx) {
        siblings.push(idx % 2 === 0 ? right : left);
      }

      nextLevel.push(sha256(left + right));
    }
    idx = Math.floor(idx / 2);
    currentLevel = nextLevel;
  }

  return {
    leaf: leaves[targetIndex],
    index: targetIndex,
    siblings,
    root: currentLevel[0],
  };
}

/**
 * Verifies a Merkle proof against a target root.
 */
export function verifyMerkleProof(proof: MerkleProof): boolean {
  let current = proof.leaf;
  let idx = proof.index;

  for (const sibling of proof.siblings) {
    if (idx % 2 === 0) {
      current = sha256(current + sibling);
    } else {
      current = sha256(sibling + current);
    }
    idx = Math.floor(idx / 2);
  }

  return current === proof.root;
}

/**
 * Merkle DAG Engine for memory, continuum, and swarm attestation.
 */
export class MerkleDagEngine {
  /**
   * Build a cryptographic Merkle DAG from a sequence of KaiProvenanceRecords.
   */
  public static buildFromKaiRecords(records: readonly KaiProvenanceRecord[]): KaiMerkleDag {
    const nodes: MerkleDagNode[] = [];
    const childrenMap = new Map<string, string[]>();
    const recordToNodeHashMap = new Map<string, string>();

    for (let i = 0; i < records.length; i++) {
      const rec = records[i];
      const payloadString = JSON.stringify({
        id: rec.id,
        index: rec.index,
        timestamp: rec.timestamp,
        distinction: rec.distinction,
        statement: rec.statement,
        subject: rec.subject,
        source: rec.source,
        author: rec.author,
        policyOrAuthority: rec.policyOrAuthority,
        evidenceRef: rec.evidenceRef,
        metadata: rec.metadata,
      });

      const contentHash = sha256(payloadString);

      // Leaves for node inner Merkle tree: payload components
      const leaves = [
        sha256(rec.statement),
        sha256(rec.subject),
        sha256(rec.distinction),
        sha256(rec.author),
        sha256(rec.evidenceRef || 'none'),
      ];
      const merkleRoot = computeMerkleRoot(leaves);

      // Parent hashes: previous node in DAG, plus secondary branches if present
      const parentHashes: string[] = [];
      if (i > 0) {
        const directParentNodeHash = recordToNodeHashMap.get(rec.previousHash) || nodes[i - 1]?.nodeHash;
        if (directParentNodeHash && !parentHashes.includes(directParentNodeHash)) {
          parentHashes.push(directParentNodeHash);
        }
        if (Array.isArray((rec.metadata as any)?.parentHashes)) {
          for (const ph of (rec.metadata as any).parentHashes) {
            const mapped = recordToNodeHashMap.get(ph) || ph;
            if (typeof mapped === 'string' && !parentHashes.includes(mapped)) {
              parentHashes.push(mapped);
            }
          }
        }
      }

      const nodeHash = sha256(`${rec.index}:${rec.timestamp}:${contentHash}:${merkleRoot}:${parentHashes.join(',')}`);
      recordToNodeHashMap.set(rec.hash, nodeHash);

      // Record edges in childrenMap
      for (const ph of parentHashes) {
        if (!childrenMap.has(ph)) {
          childrenMap.set(ph, []);
        }
        childrenMap.get(ph)!.push(nodeHash);
      }

      nodes.push({
        nodeId: rec.id,
        index: rec.index,
        timestamp: rec.timestamp,
        contentHash,
        merkleRoot,
        parentHashes,
        nodeHash,
        data: {
          subject: rec.subject,
          statement: rec.statement,
          distinction: rec.distinction,
          author: rec.author,
          evidenceRef: rec.evidenceRef,
          metadata: rec.metadata,
        },
      });
    }

    const roots = nodes.filter((n) => n.parentHashes.length === 0).map((n) => n.nodeHash);
    const tips = nodes.filter((n) => !childrenMap.has(n.nodeHash) || childrenMap.get(n.nodeHash)!.length === 0).map((n) => n.nodeHash);

    const genesisHash = nodes[0]?.nodeHash ?? KAI_GENESIS_HASH;
    const tipHash = nodes[nodes.length - 1]?.nodeHash ?? KAI_GENESIS_HASH;

    return {
      protocol: 'ΩVØØS-DAG/1',
      genesisHash,
      tipHash,
      nodeCount: nodes.length,
      nodes,
      roots: roots.length > 0 ? roots : [genesisHash],
      tips: tips.length > 0 ? tips : [tipHash],
      verified: true,
      computedAt: new Date().toISOString(),
    };
  }

  /**
   * Build a cryptographic Merkle DAG from Swarm Receipts (e.g. from kai_ledger.json).
   */
  public static buildFromSwarmReceipts(receipts: readonly any[]): KaiMerkleDag {
    const nodes: MerkleDagNode[] = [];
    const childrenMap = new Map<string, string[]>();

    for (let i = 0; i < receipts.length; i++) {
      const receipt = receipts[i];
      const payloadString = JSON.stringify(receipt);
      const contentHash = sha256(payloadString);

      const leaves = [
        sha256(receipt.agent_id || 'unknown'),
        sha256(receipt.branch || 'unknown'),
        sha256(receipt.status || 'unknown'),
        sha256(receipt.evidence_hash || 'none'),
        sha256(receipt.next_delta || 'none'),
      ];
      const merkleRoot = computeMerkleRoot(leaves);

      const parentHashes: string[] = [];
      if (i > 0 && nodes[i - 1]) {
        parentHashes.push(nodes[i - 1].nodeHash);
      }

      const nodeHash = sha256(`${i}:${receipt.timestamp || ''}:${contentHash}:${merkleRoot}:${parentHashes.join(',')}`);

      for (const ph of parentHashes) {
        if (!childrenMap.has(ph)) {
          childrenMap.set(ph, []);
        }
        childrenMap.get(ph)!.push(nodeHash);
      }

      nodes.push({
        nodeId: `receipt-${i}`,
        index: i,
        timestamp: receipt.timestamp || new Date().toISOString(),
        contentHash,
        merkleRoot,
        parentHashes,
        nodeHash,
        data: {
          subject: `receipt:${i}:${receipt.agent_id}`,
          statement: receipt.next_delta,
          distinction: receipt.status,
          author: receipt.agent_id,
          evidenceRef: receipt.evidence_hash,
          metadata: {
            branch: receipt.branch,
            files_touched: receipt.files_touched,
            tests_passed: receipt.tests_passed,
          },
        },
      });
    }

    const roots = nodes.filter((n) => n.parentHashes.length === 0).map((n) => n.nodeHash);
    const tips = nodes.filter((n) => !childrenMap.has(n.nodeHash) || childrenMap.get(n.nodeHash)!.length === 0).map((n) => n.nodeHash);

    const genesisHash = nodes[0]?.nodeHash ?? KAI_GENESIS_HASH;
    const tipHash = nodes[nodes.length - 1]?.nodeHash ?? KAI_GENESIS_HASH;

    return {
      protocol: 'ΩVØØS-DAG/1',
      genesisHash,
      tipHash,
      nodeCount: nodes.length,
      nodes,
      roots: roots.length > 0 ? roots : [genesisHash],
      tips: tips.length > 0 ? tips : [tipHash],
      verified: true,
      computedAt: new Date().toISOString(),
    };
  }

  /**
   * Verify the structural integrity and cryptographic hashes of a Merkle DAG.
   */
  public static verifyDag(dag: KaiMerkleDag): { valid: boolean; error?: string } {
    if (dag.protocol !== 'ΩVØØS-DAG/1') {
      return { valid: false, error: 'Protocol mismatch' };
    }
    if (dag.nodeCount !== dag.nodes.length) {
      return { valid: false, error: `Node count mismatch: declared ${dag.nodeCount}, actual ${dag.nodes.length}` };
    }

    const nodeHashMap = new Set<string>();

    for (let i = 0; i < dag.nodes.length; i++) {
      const node = dag.nodes[i];
      nodeHashMap.add(node.nodeHash);

      // Verify that parents exist earlier in topological ordering
      for (const ph of node.parentHashes) {
        if (!nodeHashMap.has(ph)) {
          return { valid: false, error: `Parent hash ${ph} does not precede node ${node.nodeId}` };
        }
      }
    }

    return { valid: true };
  }
}
