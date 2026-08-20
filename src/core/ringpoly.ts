/**
 * Polynomial arithmetic in R_q = Z_q[X]/(Xⁿ + 1).
 *
 * Shared by the two Module-LWE schemes, because they are the same algebra used
 * twice; ML-KEM encrypts in this ring and ML-DSA signs in it.
 *
 * The quotient by Xⁿ + 1 is what makes it *negacyclic*: a term that overflows
 * past degree n wraps around with its sign flipped, since Xⁿ ≡ −1. That single
 * property is what allows the fast NTT-based multiplication real
 * implementations use; here the multiplication is schoolbook, because the
 * degrees are small and the point is to be readable.
 */

export type Poly = number[];

export const polyZero = (n: number): Poly => new Array(n).fill(0);

export const mod = (x: number, q: number) => ((x % q) + q) % q;

/** Representative in (−q/2, q/2], which is how noise is meant to be read. */
export const centered = (x: number, q: number) => {
  const r = mod(x, q);
  return r > q / 2 ? r - q : r;
};

export const polyAdd = (a: Poly, b: Poly, q: number): Poly =>
  a.map((v, i) => mod(v + b[i], q));

export const polySub = (a: Poly, b: Poly, q: number): Poly =>
  a.map((v, i) => mod(v - b[i], q));

/**
 * Negacyclic convolution: terms that pass degree n wrap round negated.
 */
export function polyMul(a: Poly, b: Poly, q: number): Poly {
  const n = a.length;
  const out = polyZero(n);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const k = i + j;
      const value = a[i] * b[j];
      if (k < n) out[k] = mod(out[k] + value, q);
      else out[k - n] = mod(out[k - n] - value, q);
    }
  }
  return out;
}

/** Largest absolute centered coefficient: the norm the schemes bound. */
export const polyNormInfinity = (a: Poly, q: number) =>
  a.reduce((max, v) => Math.max(max, Math.abs(centered(v, q))), 0);

/* ------------------------------------------------------------- vectors */

export type PolyVec = Poly[];

export const vecAdd = (a: PolyVec, b: PolyVec, q: number): PolyVec =>
  a.map((p, i) => polyAdd(p, b[i], q));

export const vecSub = (a: PolyVec, b: PolyVec, q: number): PolyVec =>
  a.map((p, i) => polySub(p, b[i], q));

/** Inner product of two vectors of polynomials. */
export function vecDot(a: PolyVec, b: PolyVec, q: number): Poly {
  const n = a[0].length;
  let out = polyZero(n);
  for (let i = 0; i < a.length; i++) out = polyAdd(out, polyMul(a[i], b[i], q), q);
  return out;
}

/** Matrix times vector, where every entry is a polynomial. */
export function matVec(m: PolyVec[], v: PolyVec, q: number): PolyVec {
  return m.map((row) => vecDot(row, v, q));
}

/** Transpose of a square matrix of polynomials. */
export function transpose(m: PolyVec[]): PolyVec[] {
  return m.map((_, i) => m.map((row) => row[i]));
}

export const vecNormInfinity = (v: PolyVec, q: number) =>
  v.reduce((max, p) => Math.max(max, polyNormInfinity(p, q)), 0);

/* ---------------------------------------------------------- randomness */

/**
 * A small deterministic generator.
 *
 * Real schemes take randomness from the system and expand it with SHAKE; the
 * seed is a parameter here so a walkthrough can be revisited. It is not a
 * cryptographic generator and must not be used as one.
 */
export function makeRandom(seed: number) {
  let state = (seed >>> 0) || 1;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    state >>>= 0;
    return state;
  };
}

/**
 * Centered binomial noise: the difference of two counts of random bits.
 *
 * Coefficients land in [−η, η] clustered around zero. Sampling noise this way
 * rather than from a discrete Gaussian is a Kyber design decision; it is far
 * easier to do in constant time, and constant-time sampling matters because
 * the noise is secret.
 */
export function sampleNoise(n: number, eta: number, rand: () => number): Poly {
  return Array.from({ length: n }, () => {
    const bits = rand();
    let a = 0;
    let b = 0;
    for (let i = 0; i < eta; i++) {
      a += (bits >>> i) & 1;
      b += (bits >>> (i + eta)) & 1;
    }
    return a - b;
  });
}

export function sampleUniform(n: number, q: number, rand: () => number): Poly {
  return Array.from({ length: n }, () => rand() % q);
}
