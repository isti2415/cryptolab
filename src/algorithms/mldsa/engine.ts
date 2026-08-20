/**
 * ML-DSA (Dilithium), at reduced parameters.
 *
 * A signature scheme over the same Module-LWE algebra as ML-KEM, built on
 * "Fiat–Shamir with aborts". The signer produces a candidate signature and then
 * *throws it away* if it would leak information about the secret key, retrying
 * until one is safe to publish.
 *
 * That rejection loop is the distinctive idea. A signature z = y + c·s₁ carries
 * the secret s₁ inside it; publishing z unconditionally would let an attacker
 * average many signatures and extract s₁, which is exactly how lattice
 * signature schemes were broken before this technique existed. Rejecting the
 * candidates whose distribution depends on s₁ makes the published ones
 * independent of it.
 *
 * IMPORTANT: this is Dilithium's structure at toy parameters, n = 8, rank 2,
 * against FIPS 204's n = 256 and larger moduli, with a simplified challenge
 * derivation. It is not FIPS 204 and produces none of its test vectors.
 */

import {
  centered,
  makeRandom,
  matVec,
  polyMul,
  polyZero,
  sampleNoise,
  sampleUniform,
  vecAdd,
  vecNormInfinity,
  vecSub,
  type Poly,
  type PolyVec,
} from '@/core/ringpoly';
import { sha256Hex } from '@/algorithms/sha256/engine';
import type { AlgorithmResult, Direction, Params, Step } from '@/core/types';

const Q = 3329;
const N = 8;
const K = 2; // rows of A
const L = 2; // columns of A
const ETA = 2; // secret key noise
/** Bound on the masking vector y. */
const GAMMA1 = 256;
/** Rounding granularity for the high bits. */
const GAMMA2 = 128;
/** Number of ±1 coefficients in the challenge. */
const TAU = 2;
/** Worst-case size of c·s, which is what the bounds have to absorb. */
const BETA = TAU * ETA;

/** Split a coefficient into high and low parts around 2γ₂. */
const highBits = (x: number) => Math.round(centered(x, Q) / (2 * GAMMA2));
const lowBits = (x: number) => centered(x, Q) - 2 * GAMMA2 * highBits(x);

const polyHigh = (p: Poly) => p.map(highBits);
const vecHigh = (v: PolyVec) => v.map(polyHigh);
const vecLowNorm = (v: PolyVec) =>
  v.reduce((max, p) => Math.max(max, ...p.map((c) => Math.abs(lowBits(c)))), 0);

/**
 * The challenge: a sparse polynomial with exactly τ coefficients of ±1,
 * derived from the message and the high bits of the commitment.
 *
 * Real ML-DSA expands this with SHAKE; the shape, sparse and tiny, is what
 * matters, because c·s₁ must stay small enough for the bounds to work.
 */
export function challenge(message: string, w1: PolyVec): Poly {
  const digest = sha256Hex([
    ...new TextEncoder().encode(message + '|' + w1.map((p) => p.join(',')).join(';')),
  ]);
  const c = polyZero(N);
  let cursor = 0;
  let placed = 0;
  while (placed < TAU && cursor + 2 <= digest.length) {
    const position = parseInt(digest[cursor], 16) % N;
    const sign = parseInt(digest[cursor + 1], 16) % 2 === 0 ? 1 : Q - 1;
    cursor += 2;
    if (c[position] === 0) {
      c[position] = sign;
      placed++;
    }
  }
  return c;
}

export interface MldsaAttempt {
  index: number;
  zNorm: number;
  lowNorm: number;
  accepted: boolean;
  reason?: string;
}

export interface MldsaStepState {
  kind: 'params' | 'keygen' | 'commit' | 'challenge' | 'respond' | 'reject' | 'accept' | 'verify' | 'done';
  q: number;
  n: number;
  k: number;
  gamma1: number;
  gamma2: number;
  beta: number;
  tau: number;
  a: PolyVec[];
  s1: PolyVec;
  s2: PolyVec;
  t: PolyVec;
  message: string;
  attempts: MldsaAttempt[];
  y?: PolyVec;
  w1?: PolyVec;
  c?: Poly;
  z?: PolyVec;
  /** Recomputed high bits during verification. */
  checkW1?: PolyVec;
  valid?: boolean;
  tampered?: boolean;
}

export function run(
  input: string,
  params: Params,
  direction: Direction,
): AlgorithmResult<MldsaStepState> {
  const seed = Number(params.seed);
  if (!Number.isInteger(seed) || seed < 1) {
    return { output: '', steps: [], error: { paramKey: 'seed', message: 'The seed must be a whole number of at least 1.' } };
  }
  if (input.length === 0) {
    return { output: '', steps: [], error: { message: 'Enter a message to sign.' } };
  }

  const rand = makeRandom(seed);

  const a: PolyVec[] = Array.from({ length: K }, () =>
    Array.from({ length: L }, () => sampleUniform(N, Q, rand)),
  );
  const s1: PolyVec = Array.from({ length: L }, () => sampleNoise(N, ETA, rand));
  const s2: PolyVec = Array.from({ length: K }, () => sampleNoise(N, ETA, rand));
  const t = vecAdd(matVec(a, s1, Q), s2, Q);

  const base = {
    q: Q,
    n: N,
    k: K,
    gamma1: GAMMA1,
    gamma2: GAMMA2,
    beta: BETA,
    tau: TAU,
    a,
    s1,
    s2,
    t,
    message: input,
  };

  const steps: Step<MldsaStepState>[] = [];
  const attempts: MldsaAttempt[] = [];
  const push = (
    kind: MldsaStepState['kind'],
    phase: string,
    title: string,
    description: string,
    extra: Partial<MldsaStepState> = {},
  ) =>
    steps.push({
      id: `${kind}-${steps.length}`,
      title,
      description,
      phase,
      state: { ...base, kind, attempts: attempts.map((x) => ({ ...x })), ...extra },
    });

  push(
    'params',
    'Parameters',
    `Module-LWE signatures · rank ${K} over Z_${Q}[X]/(X^${N}+1)`,
    `The same algebra ML-KEM encrypts in, used to sign instead. Bounds: masking vectors are drawn below γ₁ = ${GAMMA1}, high bits are rounded to multiples of 2γ₂ = ${2 * GAMMA2}, and the challenge has just ${TAU} non-zero coefficients so that c·s stays under β = ${BETA}.`,
  );

  push('keygen', 'Key generation', 'Public t = A·s₁ + s₂', 'The private key is the pair of small vectors s₁ and s₂; the public key is A and t. Recovering s₁ from t is Module-LWE, exactly as in ML-KEM.');

  /* ------------------------------------------------------------- signing */

  let y: PolyVec = [];
  let w1: PolyVec = [];
  let c: Poly = polyZero(N);
  let z: PolyVec = [];
  let accepted = false;

  for (let attempt = 1; attempt <= 64 && !accepted; attempt++) {
    // The masking vector must be fresh every attempt. Reusing one across two
    // signatures would give away s₁ by subtraction.
    y = Array.from({ length: L }, () =>
      Array.from({ length: N }, () => centered(rand() % (2 * GAMMA1), 2 * GAMMA1)),
    );

    const w = matVec(a, y, Q);
    w1 = vecHigh(w);
    c = challenge(input, w1);

    const cs1 = s1.map((p) => polyMul(c, p, Q));
    z = vecAdd(y, cs1, Q);

    const cs2 = s2.map((p) => polyMul(c, p, Q));
    const lowPart = vecSub(w, cs2, Q);

    const zNorm = vecNormInfinity(z, Q);
    const lowNorm = vecLowNorm(lowPart);

    /*
     * Two conditions, and both exist to protect the secret rather than the
     * verifier. If ||z|| is too large the signature's distribution depends on
     * s₁; if the low bits are too large the verifier's rounding would disagree
     * with the signer's.
     */
    const zOk = zNorm < GAMMA1 - BETA;
    const lowOk = lowNorm < GAMMA2 - BETA;
    accepted = zOk && lowOk;

    attempts.push({
      index: attempt,
      zNorm,
      lowNorm,
      accepted,
      reason: accepted ? undefined : !zOk ? '‖z‖ too large' : 'low bits too large',
    });

    if (attempt === 1 || !accepted || accepted) {
      push(
        accepted ? 'accept' : 'reject',
        'Sign',
        accepted
          ? `Attempt ${attempt} accepted`
: `Attempt ${attempt} rejected, ${!zOk ? '‖z‖ too large' : 'low bits too large'}`,
        accepted
          ? `‖z‖∞ = ${zNorm} is under γ₁ − β = ${GAMMA1 - BETA}, and the low bits are under γ₂ − β = ${GAMMA2 - BETA}. This candidate can be published without leaking anything about s₁.`
          : `This candidate is discarded and the whole attempt restarts with a fresh mask. Rejecting is not a failure; it is what makes the published signatures independent of the secret key, and it is why signing takes a variable number of attempts.`,
        { y, w1, c, z },
      );
    }
  }

  if (!accepted) {
    return { output: '', steps: [], error: { message: 'Rejection sampling did not converge, try another seed.' } };
  }

  /* ------------------------------------------------------------- verify */

  const tampered = direction === 'decrypt';
  const checkMessage = tampered ? `${input} ` : input;

  const az = matVec(a, z, Q);
  const ct = t.map((p) => polyMul(c, p, Q));
  const checkW1 = vecHigh(vecSub(az, ct, Q));
  const recomputed = challenge(checkMessage, checkW1);

  const sameHigh = JSON.stringify(checkW1) === JSON.stringify(w1);
  const sameChallenge = JSON.stringify(recomputed) === JSON.stringify(c);
  const normOk = vecNormInfinity(z, Q) < GAMMA1 - BETA;
  const valid = sameHigh && sameChallenge && normOk;

  push(
    'verify',
    'Verify',
    tampered ? 'Verify against a tampered message' : 'Recompute A·z − c·t',
    `A·z − c·t = A·y − c·s₂, which differs from the signer's w only by the small term c·s₂; small enough that rounding to high bits removes it entirely. ${tampered ? 'The message has been altered, so the challenge it derives no longer matches the one in the signature.' : 'The high bits therefore match, and re-deriving the challenge from them reproduces c.'}`,
    { y, w1, c, z, checkW1, tampered },
  );

  push(
    'done',
    'Verify',
    valid ? 'Signature valid' : 'Signature rejected',
    valid
      ? `The recomputed high bits match and the challenge re-derives to the same c, with ‖z‖ inside its bound. Signing took ${attempts.length} attempt${attempts.length === 1 ? '': 's'}; that count varies with the key and the message, and is characteristic of the scheme.`
      : 'The recomputed challenge does not match the one carried in the signature, so the signature is refused.',
    { y, w1, c, z, checkW1, valid, tampered },
  );

  return {
    output: valid
      ? `valid · ${attempts.length} signing attempt${attempts.length === 1 ? '' : 's'}`
      : 'invalid · challenge mismatch',
    steps,
  };
}

export const params = { Q, N, K, L, ETA, GAMMA1, GAMMA2, TAU, BETA };
