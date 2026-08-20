/**
 * SHA-3 / Keccak (FIPS 202).
 *
 * Structurally unlike SHA-2. Instead of compressing block-by-block into a
 * chaining value, Keccak keeps a large fixed state, 1600 bits as a 5×5 grid of
 * 64-bit lanes, and *absorbs* the message into part of it, then *squeezes* the
 * digest back out. The part never touched directly by the message is the
 * capacity, and it is what an attacker cannot reach.
 *
 * That sponge shape is why SHA-3 is immune to length extension by construction:
 * the digest is only a slice of the state, so knowing it does not let you
 * resume the permutation.
 */

import type { AlgorithmResult, Direction, Params, Step } from '@/core/types';

const MASK = (1n << 64n) - 1n;

/** ρ rotation offsets, indexed [x][y]. */
const RHO = [
  [0, 36, 3, 41, 18],
  [1, 44, 10, 45, 2],
  [62, 6, 43, 15, 61],
  [28, 55, 25, 21, 56],
  [27, 20, 39, 8, 14],
];

/** ι round constants; derived from a linear feedback shift register. */
const RC: bigint[] = [
  0x0000000000000001n, 0x0000000000008082n, 0x800000000000808an, 0x8000000080008000n,
  0x000000000000808bn, 0x0000000080000001n, 0x8000000080008081n, 0x8000000000008009n,
  0x000000000000008an, 0x0000000000000088n, 0x0000000080008009n, 0x000000008000000an,
  0x000000008000808bn, 0x800000000000008bn, 0x8000000000008089n, 0x8000000000008003n,
  0x8000000000008002n, 0x8000000000000080n, 0x000000000000800an, 0x800000008000000an,
  0x8000000080008081n, 0x8000000000008080n, 0x0000000080000001n, 0x8000000080008008n,
];

const rotl = (x: bigint, n: number) => {
  const s = BigInt(n % 64);
  return ((x << s) | (x >> (64n - s))) & MASK;
};

export const laneHex = (x: bigint) => x.toString(16).padStart(16, '0').toUpperCase();

type State = bigint[]; // 25 lanes, indexed x + 5y

export type KeccakPhase = 'theta' | 'rho-pi' | 'chi' | 'iota';

/** One permutation step, so the walkthrough can show each mapping separately. */
function step(a: State, phase: KeccakPhase, round: number): State {
  const s = a.slice();

  if (phase === 'theta') {
    // Each bit is XORed with the parity of two whole columns: the only step
    // that mixes across the whole state, and the reason one flipped bit
    // reaches everywhere within a couple of rounds.
    const c = Array.from({ length: 5 }, (_, x) =>
      s[x] ^ s[x + 5] ^ s[x + 10] ^ s[x + 15] ^ s[x + 20]);
    const d = Array.from({ length: 5 }, (_, x) =>
      c[(x + 4) % 5] ^ rotl(c[(x + 1) % 5], 1));
    for (let x = 0; x < 5; x++) for (let y = 0; y < 5; y++) s[x + 5 * y] ^= d[x];
    return s;
  }

  if (phase === 'rho-pi') {
    // ρ rotates each lane by a fixed amount; π moves the lanes to new
    // positions. Neither changes any bit's value, only where it sits.
    const out: State = new Array(25).fill(0n);
    for (let x = 0; x < 5; x++) {
      for (let y = 0; y < 5; y++) {
        out[y + 5 * ((2 * x + 3 * y) % 5)] = rotl(s[x + 5 * y], RHO[x][y]);
      }
    }
    return out;
  }

  if (phase === 'chi') {
    // The only non-linear step: five bits along each row become a simple
    // boolean function of themselves and their neighbours.
    const out: State = new Array(25).fill(0n);
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        out[x + 5 * y] =
          s[x + 5 * y] ^ (~s[((x + 1) % 5) + 5 * y] & MASK & s[((x + 2) % 5) + 5 * y]);
      }
    }
    return out;
  }

  // ι breaks the symmetry that the other four steps preserve; without it every
  // round would be identical and the permutation would have obvious structure.
  s[0] ^= RC[round];
  return s;
}

export interface Sha3StepState {
  kind: 'absorb' | 'permute' | 'squeeze';
  /** The 25 lanes after this step. */
  lanes: string[];
  round?: number;
  phase?: KeccakPhase;
  /** Bytes of the message absorbed into this block. */
  blockBytes?: number[];
  rate: number;
  capacity: number;
  variant: string;
  messageLength: number;
  paddedLength: number;
  block?: number;
  blockCount: number;
  digest?: string;
}

interface Variant {
  name: string;
  rate: number;
  outputBytes: number;
  padByte: number;
}

const VARIANTS: Record<string, Variant> = {
  'sha3-256': { name: 'SHA3-256', rate: 136, outputBytes: 32, padByte: 0x06 },
  'sha3-512': { name: 'SHA3-512', rate: 72, outputBytes: 64, padByte: 0x06 },
  shake128: { name: 'SHAKE128', rate: 168, outputBytes: 32, padByte: 0x1f },
  shake256: { name: 'SHAKE256', rate: 136, outputBytes: 32, padByte: 0x1f },
};

/** Multi-rate padding: pad10*1, with the domain-separation bits folded in. */
function padMessage(bytes: number[], rate: number, padByte: number): number[] {
  const out = bytes.slice();
  out.push(padByte);
  while (out.length % rate !== 0) out.push(0);
  out[out.length - 1] |= 0x80;
  return out;
}

function absorbBlock(lanes: State, chunk: number[]): State {
  const s = lanes.slice();
  for (let i = 0; i < chunk.length; i += 8) {
    let lane = 0n;
    for (let b = 7; b >= 0; b--) lane = (lane << 8n) | BigInt(chunk[i + b] ?? 0);
    s[i / 8] ^= lane;
  }
  return s;
}

function permute(lanes: State, trace?: { lanes: State; round: number; phase: KeccakPhase }[]): State {
  let s = lanes;
  for (let round = 0; round < 24; round++) {
    for (const phase of ['theta', 'rho-pi', 'chi', 'iota'] as KeccakPhase[]) {
      s = step(s, phase, round);
      trace?.push({ lanes: s, round, phase });
    }
  }
  return s;
}

function squeeze(lanes: State, rate: number, outputBytes: number): string {
  let s = lanes;
  const out: number[] = [];
  while (out.length < outputBytes) {
    for (let i = 0; i < rate / 8 && out.length < outputBytes; i++) {
      const lane = s[i];
      for (let b = 0; b < 8 && out.length < outputBytes; b++) {
        out.push(Number((lane >> BigInt(8 * b)) & 0xffn));
      }
    }
    if (out.length < outputBytes) s = permute(s);
  }
  return out.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** The bare digest, for callers that want a hash rather than a trace. */
export function sha3Hex(bytes: number[], variantId = 'sha3-256'): string {
  const v = VARIANTS[variantId];
  const padded = padMessage(bytes, v.rate, v.padByte);
  let lanes: State = new Array(25).fill(0n);
  for (let i = 0; i < padded.length; i += v.rate) {
    lanes = permute(absorbBlock(lanes, padded.slice(i, i + v.rate)));
  }
  return squeeze(lanes, v.rate, v.outputBytes);
}

/** SHAKE with an explicit output length, used by the lattice schemes. */
export function shakeBytes(bytes: number[], variantId: 'shake128' | 'shake256', outputBytes: number): number[] {
  const v = VARIANTS[variantId];
  const padded = padMessage(bytes, v.rate, v.padByte);
  let lanes: State = new Array(25).fill(0n);
  for (let i = 0; i < padded.length; i += v.rate) {
    lanes = permute(absorbBlock(lanes, padded.slice(i, i + v.rate)));
  }
  const hex = squeeze(lanes, v.rate, outputBytes);
  const out: number[] = [];
  for (let i = 0; i < hex.length; i += 2) out.push(parseInt(hex.slice(i, i + 2), 16));
  return out;
}

export function run(
  input: string,
  params: Params,
  _direction: Direction,
): AlgorithmResult<Sha3StepState> {
  const variantId = String(params.variant ?? 'sha3-256');
  const v = VARIANTS[variantId];
  if (!v) {
    return { output: '', steps: [], error: { paramKey: 'variant', message: 'Unknown variant.' } };
  }

  const messageBytes = [...new TextEncoder().encode(input)];
  if (messageBytes.length > 120) {
    return {
      output: '',
      steps: [],
      error: {
        message: `That is ${messageBytes.length} bytes. Keep it under 120: each absorbed block traces 96 permutation steps.`,
      },
    };
  }

  const padded = padMessage(messageBytes, v.rate, v.padByte);
  const blockCount = padded.length / v.rate;
  const capacity = 200 - v.rate;

  const base = {
    rate: v.rate,
    capacity,
    variant: v.name,
    messageLength: messageBytes.length,
    paddedLength: padded.length,
    blockCount,
  };

  const steps: Step<Sha3StepState>[] = [];
  let lanes: State = new Array(25).fill(0n);

  steps.push({
    id: 'init',
    title: `${v.name} · rate ${v.rate} bytes, capacity ${capacity}`,
    description: `The state is 1600 bits, a 5×5 grid of 64-bit lanes, and starts at zero. Only the first ${v.rate} bytes ever receive message data; the remaining ${capacity} are the capacity, which the message never touches directly and an attacker cannot reach. That split is where the security level comes from.`,
    phase: 'Setup',
    state: { ...base, kind: 'absorb', lanes: lanes.map(laneHex) },
  });

  for (let b = 0; b < blockCount; b++) {
    const chunk = padded.slice(b * v.rate, (b + 1) * v.rate);
    lanes = absorbBlock(lanes, chunk);

    steps.push({
      id: `b${b}-absorb`,
      title: `Absorb block ${b + 1} of ${blockCount}`,
      description: `The block is XORed into the first ${v.rate} bytes of the state. Padding appended 0x${v.padByte.toString(16)} (the domain separator that keeps ${v.name} from colliding with the other Keccak variants); then zeros, then a final 0x80.`,
      phase: blockCount > 1 ? `Block ${b + 1}` : 'Absorb',
      state: { ...base, kind: 'absorb', lanes: lanes.map(laneHex), blockBytes: chunk, block: b },
    });

    const trace: { lanes: State; round: number; phase: KeccakPhase }[] = [];
    lanes = permute(lanes, trace);

    const DESCRIPTIONS: Record<KeccakPhase, string> = {
      theta: 'θ; every bit is XORed with the parity of two entire columns. This is the only step that mixes across the whole state, and it is why one flipped input bit reaches all 1600 within a couple of rounds.',
      'rho-pi': 'ρ rotates each lane by a fixed offset; π moves the lanes to new positions. Neither changes a single bit’s value; they only decide where it sits, so that χ mixes different neighbours each round.',
      chi: 'χ: the only non-linear step. Each bit becomes a simple boolean function of itself and the two bits to its right along the row.',
      iota: 'ι XORs a round constant into one lane. Without it every round would be identical, and the permutation would have a symmetry an attacker could exploit.',
    };

    for (const entry of trace) {
      steps.push({
        id: `b${b}-r${entry.round}-${entry.phase}`,
        title: `Round ${entry.round + 1} · ${entry.phase}`,
        description: DESCRIPTIONS[entry.phase],
        phase: blockCount > 1 ? `Block ${b + 1} · permute` : 'Permutation',
        state: {
          ...base,
          kind: 'permute',
          lanes: entry.lanes.map(laneHex),
          round: entry.round,
          phase: entry.phase,
          block: b,
        },
      });
    }
  }

  const digest = squeeze(lanes, v.rate, v.outputBytes);

  steps.push({
    id: 'squeeze',
    title: `Squeeze ${v.outputBytes} bytes`,
    description: `The digest is read from the first ${v.outputBytes} bytes of the state. Because only part of the state is ever output, knowing the digest does not let anyone resume the permutation, which is why SHA-3 is immune to the length-extension attack that forces SHA-2 to be wrapped in HMAC.`,
    phase: 'Squeeze',
    state: { ...base, kind: 'squeeze', lanes: lanes.map(laneHex), digest },
  });

  return { output: digest, steps };
}
