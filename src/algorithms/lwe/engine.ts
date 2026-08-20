/**
 * Learning With Errors; Regev's encryption scheme, at toy parameters.
 *
 * This is the foundation the lattice-based post-quantum standards are built on,
 * reduced to numbers you can check by hand.
 *
 * The idea is one small change to a problem every schoolchild can solve. Given
 * a matrix A and the product A·s, recovering s is Gaussian elimination. Add a
 * little noise; publish A·s + e instead, where every entry of e is off by one
 * or two, and the same problem is believed to be hard, for classical and
 * quantum computers alike. Everything else is bookkeeping around that gap.
 */

import type { AlgorithmResult, Direction, Params, Step } from '@/core/types';

/** Small enough to print, large enough that rounding still works. */
const Q = 97;
const N = 4; // secret dimension
const M = 8; // number of public samples

/**
 * A tiny deterministic generator.
 *
 * Real schemes take randomness from the system and would produce a different
 * key every run; here the seed is a parameter so that a walkthrough can be
 * revisited and discussed. It is not, and must not be taken for, a source of
 * cryptographic randomness.
 */
function makeRandom(seed: number) {
  let state = (seed >>> 0) || 1;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    state >>>= 0;
    return state;
  };
}

const mod = (x: number) => ((x % Q) + Q) % Q;

export interface LweStepState {
  kind: 'secret' | 'samples' | 'public' | 'encrypt' | 'decrypt' | 'done';
  q: number;
  n: number;
  m: number;
  /** The secret vector, never published. */
  s: number[];
  /** Public matrix A, m × n. */
  a: number[][];
  /** Noise vector, small and secret. */
  e: number[];
  /** b = A·s + e, published alongside A. */
  b: number[];
  /** Bits of the message. */
  bits: number[];
  /** Which bit this step handles. */
  bitIndex?: number;
  bit?: number;
  /** The random subset selector used for this bit. */
  r?: number[];
  u?: number[];
  v?: number;
  /** v − u·s, before rounding. */
  raw?: number;
  recovered?: number;
  outputSoFar: string;
  /** How far the decrypted value sat from the nearest of 0 and q/2. */
  margin?: number;
}

export function run(
  input: string,
  params: Params,
  direction: Direction,
): AlgorithmResult<LweStepState> {
  const seedRaw = Number(params.seed);
  if (!Number.isInteger(seedRaw) || seedRaw < 1) {
    return { output: '', steps: [], error: { paramKey: 'seed', message: 'The seed must be a whole number of at least 1.' } };
  }

  const bitsText = input.replace(/\s/g, '');
  if (!/^[01]*$/.test(bitsText)) {
    return {
      output: '',
      steps: [],
      error: { message: 'Enter a string of bits; Regev encryption handles one bit at a time.' },
    };
  }
  if (bitsText.length === 0) {
    return { output: '', steps: [], error: { message: 'Enter at least one bit.' } };
  }
  if (bitsText.length > 12) {
    return { output: '', steps: [], error: { message: 'Twelve bits is plenty to see the pattern; each one gets its own step.' } };
  }

  const bits = [...bitsText].map(Number);
  const random = makeRandom(seedRaw);

  const s = Array.from({ length: N }, () => random() % Q);
  const a = Array.from({ length: M }, () => Array.from({ length: N }, () => random() % Q));
  // Noise is deliberately tiny: −2 … +2. Too much and decryption fails; too
  // little and the problem becomes linear algebra again.
  const e = Array.from({ length: M }, () => (random() % 5) - 2);
  const b = a.map((row, i) => mod(row.reduce((acc, v, j) => acc + v * s[j], 0) + e[i]));

  const half = Math.floor(Q / 2);
  const steps: Step<LweStepState>[] = [];
  const base = { q: Q, n: N, m: M, s, a, e, b, bits };

  const push = (
    kind: LweStepState['kind'],
    phase: string,
    title: string,
    description: string,
    extra: Partial<LweStepState> = {},
  ) =>
    steps.push({
      id: `${kind}-${steps.length}`,
      title,
      description,
      phase,
      state: { ...base, kind, outputSoFar: '', ...extra },
    });

  push(
    'secret',
    'Key setup',
    `Secret s = (${s.join(', ')})`,
    `The private key is a short vector of ${N} numbers mod ${Q}. Everything published below is designed to determine it uniquely and still not reveal it.`,
  );

  push(
    'samples',
    'Key setup',
    `Public matrix A · ${M} rows of ${N}`,
    'A is chosen uniformly at random and published. On its own it says nothing at all.',
  );

  push(
    'public',
    'Key setup',
    'Publish b = A·s + e',
    `Each row of A is dotted with the secret and a small error, between −2 and +2, is added. Without that error, ${M} equations in ${N} unknowns would give s away by Gaussian elimination in a moment. With it, the best known attacks are exponential in the dimension. That single change is the entire scheme.`,
  );

  let out = '';

  if (direction === 'encrypt') {
    bits.forEach((bit, i) => {
      /*
       * Encryption picks a random subset of the published equations and adds
       * them up. The sum is still a valid noisy equation, so it carries no more
       * information than the public key did, but the sender knows which rows
       * they used and the receiver does not need to.
       */
      const r = Array.from({ length: M }, () => random() % 2);
      const u = Array.from({ length: N }, (_, j) =>
        mod(r.reduce((acc, rk, k) => acc + rk * a[k][j], 0)),
      );
      const v = mod(r.reduce((acc, rk, k) => acc + rk * b[k], 0) + bit * half);
      out += String(bit);

      push(
        'encrypt',
        'Encrypt',
        `Bit ${i + 1} = ${bit} → (u, v = ${v})`,
        `Add up the ${r.reduce((x, y) => x + y, 0)} selected rows to get u = A ᵀ·r and v = b·r. Then add ${bit === 1 ? `⌊q/2⌋ = ${half} to v, because this bit is 1` : 'nothing, because this bit is 0'}. The message is hidden in the *gap* between 0 and q/2, and the accumulated noise is far smaller than that gap.`,
        { bitIndex: i, bit, r, u, v, outputSoFar: out },
      );
    });

    push('done', 'Encrypt', 'Ciphertext complete', 'Each bit became a vector u and a number v. The ciphertext is larger than the plaintext by an enormous factor, which is characteristic of lattice schemes and the reason they are used to transport keys rather than bulk data.', { outputSoFar: out });
    return { output: out, steps };
  }

  bits.forEach((bit, i) => {
    const r = Array.from({ length: M }, () => random() % 2);
    const u = Array.from({ length: N }, (_, j) =>
      mod(r.reduce((acc, rk, k) => acc + rk * a[k][j], 0)),
    );
    const v = mod(r.reduce((acc, rk, k) => acc + rk * b[k], 0) + bit * half);

    const raw = mod(v - u.reduce((acc, uj, j) => acc + uj * s[j], 0));
    // Which of 0 and q/2 is it closer to, going round the circle?
    const distToZero = Math.min(raw, Q - raw);
    const distToHalf = Math.abs(raw - half);
    const recovered = distToHalf < distToZero ? 1 : 0;
    out += String(recovered);

    push(
      'decrypt',
      'Decrypt',
      `v − u·s = ${raw} → bit ${recovered}`,
      `Only the holder of s can compute u·s. Subtracting it leaves the message plus accumulated noise: ${raw}, which is ${Math.min(distToZero, distToHalf)} away from ${recovered === 1 ? `⌊q/2⌋ = ${half}` : '0'}. Rounding to the nearer of the two recovers the bit, and the noise is small enough that the rounding is never in doubt.`,
      {
        bitIndex: i,
        bit,
        r,
        u,
        v,
        raw,
        recovered,
        margin: Math.min(distToZero, distToHalf),
        outputSoFar: out,
      },
    );
  });

  push('done', 'Decrypt', 'Message recovered', 'Every bit rounded back to the value it started as. If the noise ever grew past q/4, this rounding would start producing wrong answers, which is why real schemes budget their noise carefully and why they can, in principle, fail.', { outputSoFar: out });

  return { output: out, steps };
}
