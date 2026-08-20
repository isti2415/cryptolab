/**
 * ML-KEM (Kyber), at reduced parameters.
 *
 * A key encapsulation mechanism built on Module-LWE. Rather than encrypting a
 * message, it produces a shared secret and a ciphertext that lets the key
 * holder recover it, which is what a modern protocol actually wants, since the
 * symmetric cipher does the real work.
 *
 * Kyber is LWE with the flat matrix of numbers replaced by a small matrix of
 * *polynomials*. That structure is what makes the keys small enough to use: a
 * plain LWE public key grows with the square of the dimension, while a module
 * of rank k over a degree-n ring carries the same weight in k² polynomials.
 *
 * IMPORTANT: this is Kyber's structure at toy parameters, n = 8 and k = 2,
 * against FIPS 203's n = 256 and k = 2 to 4, and it implements the CPA-secure
 * core (K-PKE) without the Fujisaki–Okamoto transform that makes real ML-KEM
 * CCA-secure. It is not FIPS 203 and produces none of its test vectors. The
 * shapes are faithful; the security is not.
 */

import {
  centered,
  makeRandom,
  matVec,
  polyAdd,
  polySub,
  polyZero,
  sampleNoise,
  sampleUniform,
  transpose,
  vecDot,
  type Poly,
  type PolyVec,
} from '@/core/ringpoly';
import type { AlgorithmResult, Direction, Params, Step } from '@/core/types';

/** Kyber's real modulus, kept so the arithmetic is genuine. */
const Q = 3329;
/** Degree of the ring. FIPS 203 uses 256; 8 keeps every coefficient on screen. */
const N = 8;
/** Module rank: the same value ML-KEM-512 uses. */
const K = 2;
/** Noise parameter; ML-KEM-512 uses 3 and 2. */
const ETA = 2;

const HALF = Math.round(Q / 2);

export interface MlkemStepState {
  kind: 'params' | 'matrix' | 'secret' | 'public' | 'encaps-noise' | 'encaps' | 'decaps' | 'done';
  q: number;
  n: number;
  k: number;
  eta: number;
  /** Public matrix A, k × k polynomials. */
  a: PolyVec[];
  /** Secret vector s and its error e. */
  s: PolyVec;
  e: PolyVec;
  /** Public t = A·s + e. */
  t: PolyVec;
  /** Message bits being transported. */
  bits: number[];
  r?: PolyVec;
  e1?: PolyVec;
  e2?: Poly;
  u?: PolyVec;
  v?: Poly;
  /** v − sᵀ·u, before rounding. */
  raw?: Poly;
  recovered?: number[];
  /** Distance of each coefficient from the nearer of 0 and q/2. */
  margins?: number[];
  outputSoFar: string;
}

export function run(
  input: string,
  params: Params,
  direction: Direction,
): AlgorithmResult<MlkemStepState> {
  const seed = Number(params.seed);
  if (!Number.isInteger(seed) || seed < 1) {
    return { output: '', steps: [], error: { paramKey: 'seed', message: 'The seed must be a whole number of at least 1.' } };
  }

  const bitsText = input.replace(/\s/g, '');
  if (!/^[01]*$/.test(bitsText)) {
    return { output: '', steps: [], error: { message: `The shared secret is carried as ${N} bits; enter a string of 0s and 1s.` } };
  }
  if (bitsText.length !== N) {
    return { output: '', steps: [], error: { message: `Enter exactly ${N} bits: one per coefficient of the ring.` } };
  }

  const bits = [...bitsText].map(Number);
  const rand = makeRandom(seed);

  // Public matrix: in the real scheme this is expanded from a seed with SHAKE
  // so it never has to be transmitted, only the seed.
  const a: PolyVec[] = Array.from({ length: K }, () =>
    Array.from({ length: K }, () => sampleUniform(N, Q, rand)),
  );
  const s: PolyVec = Array.from({ length: K }, () => sampleNoise(N, ETA, rand));
  const e: PolyVec = Array.from({ length: K }, () => sampleNoise(N, ETA, rand));
  const t = matVec(a, s, Q).map((p, i) => polyAdd(p, e[i], Q));

  const base = { q: Q, n: N, k: K, eta: ETA, a, s, e, t, bits };
  const steps: Step<MlkemStepState>[] = [];
  const push = (
    kind: MlkemStepState['kind'],
    phase: string,
    title: string,
    description: string,
    extra: Partial<MlkemStepState> = {},
  ) =>
    steps.push({
      id: `${kind}-${steps.length}`,
      title,
      description,
      phase,
      state: { ...base, kind, outputSoFar: '', ...extra },
    });

  push(
    'params',
    'Parameters',
    `Module-LWE · rank ${K} over Z_${Q}[X]/(X^${N}+1)`,
    `Every entry below is a polynomial of degree under ${N}, and arithmetic wraps negacyclically: a term passing X^${N} comes back with its sign flipped. Replacing plain LWE's flat matrix of numbers with a small matrix of polynomials is what shrinks the keys from megabytes to about a kilobyte.`,
  );

  push('matrix', 'Key generation', `Public matrix A · ${K}×${K} polynomials`, 'A is uniform and public. In the real scheme it is not even transmitted; both sides expand it from a short seed with SHAKE, which is why SHA-3 is a prerequisite for this construction.');

  push('secret', 'Key generation', 'Secret s and error e, both small', `Every coefficient of s and e comes from a centered binomial distribution in [−${ETA}, ${ETA}]. Smallness is the whole point: it is what makes t = A·s + e hard to invert, and what keeps the decryption noise inside its budget.`);

  push('public', 'Key generation', 'Publish t = A·s + e', 'The public key is (A, t). Recovering s from it is Module-LWE; the same problem as plain LWE with extra algebraic structure, which buys efficiency at the cost of a slightly stronger assumption.');

  /* --------------------------------------------------------- encapsulate */

  const r: PolyVec = Array.from({ length: K }, () => sampleNoise(N, ETA, rand));
  const e1: PolyVec = Array.from({ length: K }, () => sampleNoise(N, ETA, rand));
  const e2 = sampleNoise(N, ETA, rand);

  const u = matVec(transpose(a), r, Q).map((p, i) => polyAdd(p, e1[i], Q));
  const encoded = bits.map((b) => b * HALF);
  const v = polyAdd(polyAdd(vecDot(t, r, Q), e2, Q), encoded, Q);

  push(
    'encaps-noise',
    'Encapsulate',
    'Fresh noise r, e₁, e₂',
    'The sender draws their own small vectors. Nothing about the sender is reused between messages, which is why two encapsulations under the same public key produce unrelated ciphertexts.',
    { r, e1, e2 },
  );

  push(
    'encaps',
    'Encapsulate',
    'u = Aᵀ·r + e₁,  v = tᵀ·r + e₂ + ⌈q/2⌋·m',
    `The ciphertext is the pair (u, v). Each message bit is scaled by ⌈q/2⌋ = ${HALF} and added into one coefficient of v, so the secret lives in the gap between 0 and q/2, exactly as in plain LWE, just one bit per coefficient.`,
    { r, e1, e2, u, v },
  );

  /* --------------------------------------------------------- decapsulate */

  const raw = polySub(v, vecDot(s, u, Q), Q);
  const margins: number[] = [];
  const recovered = raw.map((coefficient) => {
    const value = centered(coefficient, Q);
    const distZero = Math.abs(value);
    const distHalf = Math.abs(Math.abs(value) - HALF);
    margins.push(Math.min(distZero, distHalf));
    return distHalf < distZero ? 1 : 0;
  });

  push(
    'decaps',
    'Decapsulate',
    'v − sᵀ·u, then round each coefficient',
    `Only the holder of s can compute sᵀ·u. What is left is the message plus accumulated noise: the largest coefficient here sits ${Math.max(...margins)} from its target, against a budget of q/4 = ${Math.round(Q / 4)}. Comfortably inside, which is why decapsulation succeeds.`,
    { r, e1, e2, u, v, raw, recovered, margins },
  );

  const out = recovered.join('');

  push(
    'done',
    'Decapsulate',
    `Shared secret ${out}`,
    'Both sides now hold the same bits. Real ML-KEM does not stop here: it hashes the result and re-encrypts to check the ciphertext was honestly formed, the Fujisaki–Okamoto transform, which is what upgrades this CPA-secure core to the CCA security the standard requires.',
    { r, e1, e2, u, v, raw, recovered, margins, outputSoFar: out },
  );

  void direction;
  return { output: out, steps };
}

/** Round-trip without the trace, for the tests. */
export function roundTrip(bits: string, seed: number): string {
  return run(bits, { seed }, 'encrypt').output;
}

/** Exposed so a test can confirm the noise never approaches its budget. */
export const noiseBudget = Math.round(Q / 4);
export const params = { Q, N, K, ETA };
export type { Poly, PolyVec };
export { polyZero };
