/**
 * Shared number-theory + alphabet helpers used across algorithm engines.
 * Small, pure, and unit-tested — several ciphers depend on these being exact
 * (e.g. Affine and Hill need a correct modular inverse).
 */

export const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
export const ALPHABET_SIZE = 26;

/** True modulo that always returns a non-negative result for positive n. */
export function mod(a: number, n: number): number {
  return ((a % n) + n) % n;
}

/** Greatest common divisor (Euclid). Operates on absolute values. */
export function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b !== 0) {
    [a, b] = [b, a % b];
  }
  return a;
}

export function coprime(a: number, n: number): boolean {
  return gcd(a, n) === 1;
}

/**
 * Modular multiplicative inverse of `a` mod `n`, or `null` if none exists
 * (i.e. when gcd(a, n) !== 1). Extended Euclidean algorithm.
 */
export function modInverse(a: number, n: number): number | null {
  a = mod(a, n);
  let [old_r, r] = [a, n];
  let [old_s, s] = [1, 0];
  while (r !== 0) {
    const q = Math.floor(old_r / r);
    [old_r, r] = [r, old_r - q * r];
    [old_s, s] = [s, old_s - q * s];
  }
  if (old_r !== 1) return null; // not invertible
  return mod(old_s, n);
}

/** 'A'→0 … 'Z'→25 for an uppercase letter; -1 for anything else. */
export function letterToIndex(ch: string): number {
  const code = ch.charCodeAt(0);
  if (code >= 65 && code <= 90) return code - 65; // A-Z
  if (code >= 97 && code <= 122) return code - 97; // a-z
  return -1;
}

/** 0→'A' … 25→'Z'. Assumes 0..25. */
export function indexToLetter(i: number): string {
  return ALPHABET[mod(i, ALPHABET_SIZE)];
}

export function isLetter(ch: string): boolean {
  return letterToIndex(ch) !== -1;
}

export function isUpperCase(ch: string): boolean {
  const code = ch.charCodeAt(0);
  return code >= 65 && code <= 90;
}
