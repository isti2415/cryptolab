/**
 * Hash-based signatures: WOTS+ one-time signatures under a Merkle tree.
 *
 * This is the core of SLH-DSA (FIPS 205), the one NIST post-quantum standard
 * that rests on nothing but hash functions. No number theory, no lattices, no
 * new hardness assumption; if the hash is secure, the signature is secure.
 * That makes it the most conservative option available, and the slowest and
 * bulkiest.
 *
 * Two ideas stacked on each other:
 *
 *   WOTS+   signs one message with one key, by revealing partial hash chains.
 *           Reusing the key reveals enough of the chains to forge.
 *   Merkle  fixes the "one" by hashing many WOTS+ public keys into a tree.
 *           The root is the long-term public key; each signature carries the
 *           path proving its leaf belongs to that root.
 *
 * Parameters here are reduced so the whole tree fits on screen. FIPS 205 adds a
 * hypertree of these trees plus FORS to make the scheme stateless, but the
 * machinery below is the part that does the work.
 */

import { sha256Hex } from '@/algorithms/sha256/engine';
import type { AlgorithmResult, Direction, Params, Step } from '@/core/types';

/** Hash output kept to 4 bytes so values are readable; FIPS 205 uses 16–32. */
const N = 4;
/** Winternitz parameter: each chunk is log2(w) = 4 bits. */
const W = 16;
const LOG_W = 4;
/** Chunks needed for a 32-bit message digest, plus a 2-chunk checksum. */
const LEN1 = 8;
const LEN2 = 2;
const LEN = LEN1 + LEN2;
/** Tree height: 2³ = 8 one-time keys under one root. */
const HEIGHT = 3;
const LEAVES = 1 << HEIGHT;

const bytes = (t: string) => [...new TextEncoder().encode(t)];
const short = (hex: string) => hex.slice(0, N * 2).toUpperCase();

/** Domain-separated hash truncated to n bytes; every call goes through here. */
function H(...parts: string[]): string {
  return short(sha256Hex(bytes(parts.join('|'))));
}

/** One step along a WOTS+ chain. */
const chainStep = (value: string, address: string) => H('chain', address, value);

/** Walk a chain `count` steps from `value`. */
function chain(value: string, from: number, count: number, address: string): string {
  let out = value;
  for (let i = 0; i < count; i++) out = chainStep(out, `${address}:${from + i}`);
  return out;
}

/**
 * Split a digest into base-w chunks and append a checksum.
 *
 * The checksum is what makes WOTS+ a signature rather than a giveaway. Without
 * it an attacker could take a signature and walk any chain *further* forward,
 * producing a valid signature on a larger chunk value. The checksum moves in
 * the opposite direction, so increasing any message chunk decreases a checksum
 * chunk, and walking a chain backwards requires inverting the hash.
 */
export function toChunks(digest: string): number[] {
  const chunks: number[] = [];
  for (let i = 0; i < LEN1; i++) chunks.push(parseInt(digest[i], 16));

  let checksum = 0;
  for (const c of chunks) checksum += W - 1 - c;

  const checkChunks: number[] = [];
  for (let i = LEN2 - 1; i >= 0; i--) {
    checkChunks[i] = (checksum >> (LOG_W * (LEN2 - 1 - i))) % W;
  }
  return [...chunks, ...checkChunks];
}

/** The private values of one WOTS+ key, derived from the seed and leaf index. */
function wotsSecret(seed: string, leaf: number): string[] {
  return Array.from({ length: LEN }, (_, i) => H('sk', seed, String(leaf), String(i)));
}

/** Public key: every chain walked all the way to the end, then hashed together. */
function wotsPublic(seed: string, leaf: number): { chainEnds: string[]; compressed: string } {
  const sk = wotsSecret(seed, leaf);
  const chainEnds = sk.map((v, i) => chain(v, 0, W - 1, `${leaf}:${i}`));
  return { chainEnds, compressed: H('wotspk', ...chainEnds) };
}

export interface MerkleNode {
  level: number;
  index: number;
  value: string;
}

/** All levels of the tree, bottom-up. levels[0] are the leaves. */
function buildTree(seed: string): MerkleNode[][] {
  const leaves = Array.from({ length: LEAVES }, (_, i) => ({
    level: 0,
    index: i,
    value: wotsPublic(seed, i).compressed,
  }));

  const levels: MerkleNode[][] = [leaves];
  for (let level = 1; level <= HEIGHT; level++) {
    const below = levels[level - 1];
    const row: MerkleNode[] = [];
    for (let i = 0; i < below.length; i += 2) {
      row.push({
        level,
        index: i / 2,
        value: H('node', below[i].value, below[i + 1].value),
      });
    }
    levels.push(row);
  }
  return levels;
}

/** The siblings needed to walk from a leaf back up to the root. */
function authPath(levels: MerkleNode[][], leaf: number): MerkleNode[] {
  const path: MerkleNode[] = [];
  let index = leaf;
  for (let level = 0; level < HEIGHT; level++) {
    path.push(levels[level][index ^ 1]);
    index >>= 1;
  }
  return path;
}

export interface HashSigStepState {
  kind: 'keygen' | 'digest' | 'wots' | 'leaf' | 'path' | 'root' | 'verify' | 'done';
  seed: string;
  leaf: number;
  leaves: number;
  height: number;
  w: number;
  levels: MerkleNode[][];
  root: string;
  message: string;
  digest?: string;
  chunks?: number[];
  /** WOTS+ signature: each chain walked partway. */
  signature?: string[];
  /** Which chunk this step is signing. */
  chunkIndex?: number;
  authPath?: MerkleNode[];
  /** Nodes to spotlight in the tree diagram. */
  highlight?: { level: number; index: number; role: 'leaf' | 'path' | 'computed' | 'root' }[];
  verified?: boolean;
  /** Set when the walkthrough is demonstrating a tampered message. */
  tampered?: boolean;
}

export function run(
  input: string,
  params: Params,
  direction: Direction,
): AlgorithmResult<HashSigStepState> {
  const seed = String(params.seed ?? '').trim();
  if (seed.length === 0) {
    return { output: '', steps: [], error: { paramKey: 'seed', message: 'The key seed must not be empty.' } };
  }

  const leafRaw = Number(params.leaf);
  if (!Number.isInteger(leafRaw) || leafRaw < 0 || leafRaw >= LEAVES) {
    return {
      output: '',
      steps: [],
      error: { paramKey: 'leaf', message: `The one-time key index must be between 0 and ${LEAVES - 1}. Each may be used for exactly one signature.` },
    };
  }

  if (input.length === 0) {
    return { output: '', steps: [], error: { message: 'Enter a message to sign.' } };
  }

  const levels = buildTree(seed);
  const root = levels[HEIGHT][0].value;
  const leaf = leafRaw;

  const digest = H('msg', input);
  const chunks = toChunks(digest);

  const sk = wotsSecret(seed, leaf);
  // The signature reveals each chain walked as far as its chunk says.
  const signature = sk.map((v, i) => chain(v, 0, chunks[i], `${leaf}:${i}`));
  const path = authPath(levels, leaf);

  const base = {
    seed,
    leaf,
    leaves: LEAVES,
    height: HEIGHT,
    w: W,
    levels,
    root,
    message: input,
  };

  const steps: Step<HashSigStepState>[] = [];
  const push = (
    kind: HashSigStepState['kind'],
    phase: string,
    title: string,
    description: string,
    extra: Partial<HashSigStepState> = {},
  ) => steps.push({ id: `${kind}-${steps.length}`, title, description, phase, state: { ...base, kind, ...extra } });

  push(
    'keygen',
    'Key generation',
    `${LEAVES} one-time keys under one root`,
    `Each leaf is a complete WOTS+ key pair, derived from the seed. Hashing them pairwise up the tree gives a single ${N}-byte root, and that root is the entire long-term public key, no matter how many one-time keys sit beneath it.`,
    { highlight: [{ level: HEIGHT, index: 0, role: 'root' }] },
  );

  push(
    'digest',
    'Sign',
    `Message digest ${digest}`,
    `The message is hashed to ${N} bytes and split into ${LEN1} chunks of ${LOG_W} bits, then a ${LEN2}-chunk checksum is appended. The checksum is essential: without it an attacker could walk any chain further forward and forge a signature on a larger chunk value.`,
    { digest, chunks },
  );

  chunks.forEach((chunkValue, i) => {
    push(
      'wots',
      'Sign',
      `Chunk ${i + 1} of ${LEN} = ${chunkValue} → walk ${chunkValue} steps`,
      i < LEN1
        ? `Chain ${i} starts at a secret value and is hashed ${chunkValue} time${chunkValue === 1 ? '' : 's'}. The result is published; the ${W - 1 - chunkValue} remaining steps to the chain end stay secret, and a verifier finishes them to check the signature.`
        : `Checksum chunk. These move opposite to the message chunks, so raising any message chunk lowers a checksum one, and walking a chain backwards would mean inverting the hash.`,
      { digest, chunks, signature, chunkIndex: i },
    );
  });

  push(
    'leaf',
    'Sign',
    `Leaf ${leaf} = ${levels[0][leaf].value}`,
    'The ten chain ends are hashed together into this leaf of the tree. A verifier reconstructs exactly this value from the signature alone.',
    {
      digest,
      chunks,
      signature,
      highlight: [{ level: 0, index: leaf, role: 'leaf' }],
    },
  );

  push(
    'path',
    'Sign',
    `Authentication path · ${HEIGHT} siblings`,
    'The signature also carries one sibling per level. Those are what let a verifier climb from the leaf to the root without knowing any other leaf.',
    {
      digest,
      chunks,
      signature,
      authPath: path,
      highlight: [
        { level: 0, index: leaf, role: 'leaf' },
        ...path.map((n) => ({ level: n.level, index: n.index, role: 'path' as const })),
      ],
    },
  );

  /* ------------------------------------------------------------- verify */

  const tampered = direction === 'decrypt';
  const checkMessage = tampered ? `${input} ` : input;
  const checkDigest = H('msg', checkMessage);
  const checkChunks = toChunks(checkDigest);

  // A verifier finishes each chain from where the signature stopped.
  const recoveredEnds = signature.map((v, i) =>
    chain(v, checkChunks[i], W - 1 - checkChunks[i], `${leaf}:${i}`),
  );
  const recoveredLeaf = H('wotspk', ...recoveredEnds);

  let node = recoveredLeaf;
  let index = leaf;
  for (const sibling of path) {
    node = index % 2 === 0 ? H('node', node, sibling.value) : H('node', sibling.value, node);
    index >>= 1;
  }
  const verified = node === root;

  push(
    'verify',
    'Verify',
    tampered ? 'Verify a tampered message' : 'Finish every chain',
    tampered
      ? 'The same signature is checked against a message with one extra character. Each chain now gets walked a different number of steps, so the reconstructed leaf, and therefore the root, comes out wrong.'
      : 'The verifier walks each chain the remaining steps to its end, using only the signature and the message. No secret is needed, and no secret is revealed.',
    {
      digest: checkDigest,
      chunks: checkChunks,
      signature,
      authPath: path,
      highlight: [{ level: 0, index: leaf, role: 'computed' }],
    },
  );

  push(
    'done',
    'Verify',
    verified ? `Root matches: ${root}`: `Root mismatch, signature rejected`,
    verified
      ? 'Climbing the authentication path reproduces the published root, so the signature is valid. Note what was never needed: no modular arithmetic, no elliptic curve, no assumption beyond the hash function itself.'
      : `Climbing the path gives ${node}, which is not the published root ${root}. The signature is rejected.`,
    {
      digest: checkDigest,
      chunks: checkChunks,
      signature,
      authPath: path,
      verified,
      tampered,
      highlight: [{ level: HEIGHT, index: 0, role: verified ? 'root' : 'computed' }],
    },
  );

  return { output: verified ? `valid · root ${root}` : `invalid · expected ${root}, got ${node}`, steps };
}

/** Exposed for the tests: sign and verify without the trace. */
export function signAndVerify(seed: string, leaf: number, message: string, check = message) {
  const levels = buildTree(seed);
  const root = levels[HEIGHT][0].value;
  const chunks = toChunks(H('msg', message));
  const sk = wotsSecret(seed, leaf);
  const signature = sk.map((v, i) => chain(v, 0, chunks[i], `${leaf}:${i}`));
  const path = authPath(levels, leaf);

  const checkChunks = toChunks(H('msg', check));
  const ends = signature.map((v, i) => chain(v, checkChunks[i], W - 1 - checkChunks[i], `${leaf}:${i}`));
  let node = H('wotspk', ...ends);
  let index = leaf;
  for (const sibling of path) {
    node = index % 2 === 0 ? H('node', node, sibling.value) : H('node', sibling.value, node);
    index >>= 1;
  }
  return { root, computed: node, valid: node === root };
}
