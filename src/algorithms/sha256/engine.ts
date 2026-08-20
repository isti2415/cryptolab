/**
 * SHA-256 (FIPS 180-4).
 *
 * A hash is not a cipher: there is no key and no way back. It compresses any
 * input to 256 bits such that finding two inputs with the same digest, or any
 * input matching a given digest, is infeasible.
 *
 * The construction is Merkle–Damgård: pad the message to a whole number of
 * 512-bit blocks, then fold each block into a 256-bit state with a compression
 * function. That compression function is a 64-round mixer over eight 32-bit
 * registers, and the rounds are where the work is visible.
 */

import type { AlgorithmResult, Direction, Params, Step } from '@/core/types';

/** First 32 bits of the fractional parts of the cube roots of the first 64 primes. */
const K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1,
  0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
  0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786,
  0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
  0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
  0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
  0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a,
  0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
  0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];

/** First 32 bits of the fractional parts of the square roots of the first 8 primes. */
const H0 = [
  0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c,
  0x1f83d9ab, 0x5be0cd19,
];

const rotr = (x: number, n: number) => ((x >>> n) | (x << (32 - n))) >>> 0;
const shr = (x: number, n: number) => x >>> n;
const add = (...xs: number[]) => xs.reduce((a, b) => (a + b) >>> 0, 0) >>> 0;

const bigSigma0 = (x: number) => (rotr(x, 2) ^ rotr(x, 13) ^ rotr(x, 22)) >>> 0;
const bigSigma1 = (x: number) => (rotr(x, 6) ^ rotr(x, 11) ^ rotr(x, 25)) >>> 0;
const smallSigma0 = (x: number) => (rotr(x, 7) ^ rotr(x, 18) ^ shr(x, 3)) >>> 0;
const smallSigma1 = (x: number) => (rotr(x, 17) ^ rotr(x, 19) ^ shr(x, 10)) >>> 0;

/** Choose: for each bit, take f where e is 1 and g where it is 0. */
const ch = (e: number, f: number, g: number) => ((e & f) ^ (~e & g)) >>> 0;
/** Majority: for each bit position, whichever value two of the three agree on. */
const maj = (a: number, b: number, c: number) => ((a & b) ^ (a & c) ^ (b & c)) >>> 0;

export const hex32 = (x: number) => (x >>> 0).toString(16).padStart(8, '0').toUpperCase();

/** Append 0x80, pad with zeros, and finish with the 64-bit big-endian bit length. */
export function pad(bytes: number[]): number[] {
  const out = bytes.slice();
  const bitLength = BigInt(bytes.length) * 8n;
  out.push(0x80);
  while (out.length % 64 !== 56) out.push(0);
  for (let i = 7; i >= 0; i--) {
    out.push(Number((bitLength >> BigInt(i * 8)) & 0xffn));
  }
  return out;
}

export interface Sha256Round {
  t: number;
  w: number;
  k: number;
  sigma1: number;
  chosen: number;
  t1: number;
  sigma0: number;
  majority: number;
  t2: number;
}

export interface Sha256StepState {
  kind: 'setup' | 'pad' | 'schedule' | 'round' | 'block' | 'digest';
  /** The eight working registers a…h after this step. */
  registers: number[];
  /** The running hash H0…H7 after the last completed block. */
  hash: number[];
  /** Message schedule words known so far. */
  schedule: number[];
  block?: number;
  blockCount: number;
  round?: Sha256Round;
  /** Schedule words this step derived. */
  scheduleRange?: [number, number];
  messageBytes: number[];
  paddedLength?: number;
  digest?: string;
}

/** Schedule words derived per step, so 48 expansions stay navigable. */
const SCHEDULE_BATCH = 8;

export function run(
  input: string,
  _params: Params,
  _direction: Direction,
): AlgorithmResult<Sha256StepState> {
  const messageBytes = [...new TextEncoder().encode(input)];

  if (messageBytes.length > 200) {
    return {
      output: '',
      steps: [],
      error: {
        message: `That is ${messageBytes.length} bytes, which would trace several thousand rounds. Keep it under 200 bytes so the walkthrough stays finite; the algorithm is identical at any length.`,
      },
    };
  }

  const padded = pad(messageBytes);
  const blockCount = padded.length / 64;

  const steps: Step<Sha256StepState>[] = [];
  let hash = H0.slice();

  const base = { messageBytes, blockCount, paddedLength: padded.length };

  steps.push({
    id: 'setup',
    title: `Hash ${messageBytes.length} byte${messageBytes.length === 1 ? '' : 's'}`,
    description:
      'The state starts from eight fixed constants: the fractional parts of the square roots of the first eight primes. They are "nothing up my sleeve" numbers: chosen so that nobody could have picked them to hide a weakness.',
    phase: 'Setup',
    state: { ...base, kind: 'setup', registers: hash.slice(), hash: hash.slice(), schedule: [] },
  });

  steps.push({
    id: 'pad',
    title: `Pad to ${padded.length} bytes (${blockCount} block${blockCount === 1 ? '' : 's'})`,
    description: `Append a single 1 bit, then zeros, then the original length in bits (${messageBytes.length * 8}) as a 64-bit big-endian number. Encoding the length is what stops two different messages padding to the same thing.`,
    phase: 'Setup',
    state: { ...base, kind: 'pad', registers: hash.slice(), hash: hash.slice(), schedule: [] },
  });

  for (let b = 0; b < blockCount; b++) {
    const blockBytes = padded.slice(b * 64, b * 64 + 64);
    const w: number[] = [];
    for (let t = 0; t < 16; t++) {
      w.push(
        ((blockBytes[t * 4] << 24) |
          (blockBytes[t * 4 + 1] << 16) |
          (blockBytes[t * 4 + 2] << 8) |
          blockBytes[t * 4 + 3]) >>> 0,
      );
    }

    const phaseFor = (name: string) =>
      blockCount > 1 ? `Block ${b + 1} · ${name}` : name;

    steps.push({
      id: `b${b}-w`,
      title: `Block ${b + 1} → sixteen 32-bit words`,
      description:
        'The 64 bytes of the block are read as sixteen big-endian words. These are the first sixteen entries of the message schedule; the remaining 48 are derived from them.',
      phase: phaseFor('Message schedule'),
      state: {
        ...base,
        kind: 'schedule',
        registers: hash.slice(),
        hash: hash.slice(),
        schedule: w.slice(),
        block: b,
        scheduleRange: [0, 15],
      },
    });

    for (let t = 16; t < 64; t++) {
      w.push(add(smallSigma1(w[t - 2]), w[t - 7], smallSigma0(w[t - 15]), w[t - 16]));
      if ((t - 15) % SCHEDULE_BATCH === 0 || t === 63) {
        const from = Math.max(16, t - SCHEDULE_BATCH + 1);
        steps.push({
          id: `b${b}-w${t}`,
          title: `Schedule words ${from}–${t}`,
          description:
            'Each new word mixes four earlier ones through two rotate-and-shift functions. This is what spreads a single input bit across the whole schedule, so changing one byte of the message changes almost every round.',
          phase: phaseFor('Message schedule'),
          state: {
            ...base,
            kind: 'schedule',
            registers: hash.slice(),
            hash: hash.slice(),
            schedule: w.slice(),
            block: b,
            scheduleRange: [from, t],
          },
        });
      }
    }

    let [a, bb, c, d, e, f, g, h] = hash;

    for (let t = 0; t < 64; t++) {
      const s1 = bigSigma1(e);
      const chosen = ch(e, f, g);
      const t1 = add(h, s1, chosen, K[t], w[t]);
      const s0 = bigSigma0(a);
      const majority = maj(a, bb, c);
      const t2 = add(s0, majority);

      h = g;
      g = f;
      f = e;
      e = add(d, t1);
      d = c;
      c = bb;
      bb = a;
      a = add(t1, t2);

      steps.push({
        id: `b${b}-r${t}`,
        title: `Round ${t + 1} of 64`,
        description: `T₁ = h + Σ₁(e) + Ch(e,f,g) + K${t} + W${t}; T₂ = Σ₀(a) + Maj(a,b,c). Every register shifts down one place, d absorbs T₁ into e, and a becomes T₁ + T₂.`,
        phase: phaseFor('Compression'),
        state: {
          ...base,
          kind: 'round',
          registers: [a, bb, c, d, e, f, g, h],
          hash: hash.slice(),
          schedule: w.slice(),
          block: b,
          round: { t, w: w[t], k: K[t], sigma1: s1, chosen, t1, sigma0: s0, majority, t2 },
        },
      });
    }

    hash = [a, bb, c, d, e, f, g, h].map((v, i) => add(hash[i], v));

    steps.push({
      id: `b${b}-add`,
      title: `Fold block ${b + 1} into the hash`,
      description:
        'The working registers are added back into the running hash rather than replacing it. That feed-forward is what makes the compression function one-way: without it, the rounds would be invertible and the whole hash would run backwards.',
      phase: phaseFor('Compression'),
      state: {
        ...base,
        kind: 'block',
        registers: [a, bb, c, d, e, f, g, h],
        hash: hash.slice(),
        schedule: w.slice(),
        block: b,
      },
    });
  }

  const digest = hash.map(hex32).join('').toLowerCase();

  steps.push({
    id: 'digest',
    title: `Digest ${digest.slice(0, 16)}…`,
    description:
      'The eight words of the final state, written out end to end, are the 256-bit digest. There is no key and no inverse: this is the only direction the function runs.',
    phase: 'Digest',
    state: {
      ...base,
      kind: 'digest',
      registers: hash.slice(),
      hash: hash.slice(),
      schedule: [],
      digest,
    },
  });

  return { output: digest, steps };
}

/** The digest as bytes, for callers that feed one hash into another. */
export function sha256Bytes(bytes: number[]): number[] {
  const digest = sha256Hex(bytes);
  const out: number[] = [];
  for (let i = 0; i < digest.length; i += 2) {
    out.push(parseInt(digest.slice(i, i + 2), 16));
  }
  return out;
}

/** The bare hash, for callers that want a digest rather than a trace. */
export function sha256Hex(bytes: number[]): string {
  const padded = pad(bytes);
  let hash = H0.slice();

  for (let b = 0; b < padded.length / 64; b++) {
    const blockBytes = padded.slice(b * 64, b * 64 + 64);
    const w: number[] = [];
    for (let t = 0; t < 16; t++) {
      w.push(
        ((blockBytes[t * 4] << 24) |
          (blockBytes[t * 4 + 1] << 16) |
          (blockBytes[t * 4 + 2] << 8) |
          blockBytes[t * 4 + 3]) >>> 0,
      );
    }
    for (let t = 16; t < 64; t++) {
      w.push(add(smallSigma1(w[t - 2]), w[t - 7], smallSigma0(w[t - 15]), w[t - 16]));
    }

    let [a, bb, c, d, e, f, g, h] = hash;
    for (let t = 0; t < 64; t++) {
      const t1 = add(h, bigSigma1(e), ch(e, f, g), K[t], w[t]);
      const t2 = add(bigSigma0(a), maj(a, bb, c));
      h = g; g = f; f = e; e = add(d, t1);
      d = c; c = bb; bb = a; a = add(t1, t2);
    }
    hash = [a, bb, c, d, e, f, g, h].map((v, i) => add(hash[i], v));
  }

  return hash.map(hex32).join('').toLowerCase();
}
