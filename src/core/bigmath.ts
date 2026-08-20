/**
 * BigInt number-theory helpers.
 *
 * Shared rather than owned by one algorithm: RSA and Diffie–Hellman both rest
 * on modular exponentiation being cheap while its inverse is not, and both want
 * to trace the same square-and-multiply ladder.
 */

/** One square-and-multiply iteration, recorded for the walkthrough. */
export interface ModPowStep {
  /** Which bit of the exponent this iteration consumed, from the low end. */
  bitIndex: number;
  bit: number;
  /** The running result after this iteration. */
  result: string;
  /** The repeatedly-squared base after this iteration. */
  base: string;
  /** True when the bit was 1 and the base was folded into the result. */
  multiplied: boolean;
}

/** One row of the extended Euclidean algorithm, recorded for the walkthrough. */
export interface EuclidRow {
  quotient: string;
  remainder: string;
  coefficient: string;
}

export function bmod(a: bigint, n: bigint): bigint {
  const r = a % n;
  return r < 0n ? r + n : r;
}

/**
 * Fast modular exponentiation: base^exp mod mod (square-and-multiply).
 *
 * Nobody computes m^65537 by multiplying 65537 times; the exponent is walked
 * bit by bit, squaring the base each step and folding it into the result only
 * where a bit is set. `trace` records that ladder for the walkthrough; it is
 * observational, so the numbers shown are the numbers actually computed.
 */
export function modpow(
  base: bigint,
  exp: bigint,
  mod: bigint,
  trace?: ModPowStep[],
): bigint {
  if (mod === 1n) return 0n;
  base = bmod(base, mod);
  let result = 1n;
  let bitIndex = 0;
  while (exp > 0n) {
    const bit = Number(exp & 1n);
    if (bit) result = (result * base) % mod;
    exp >>= 1n;
    base = (base * base) % mod;
    trace?.push({
      bitIndex,
      bit,
      result: result.toString(),
      base: base.toString(),
      multiplied: bit === 1,
    });
    bitIndex++;
  }
  return result;
}

export function gcd(a: bigint, b: bigint): bigint {
  a = a < 0n ? -a : a;
  b = b < 0n ? -b : b;
  while (b) {
    [a, b] = [b, a % b];
  }
  return a;
}

/**
 * Modular inverse of a mod m via the extended Euclidean algorithm, or null if
 * it doesn't exist. `trace` records each division step so the private exponent
 * can be shown being derived rather than simply asserted.
 */
export function modInverse(
  a: bigint,
  m: bigint,
  trace?: EuclidRow[],
): bigint | null {
  let [oldR, r] = [bmod(a, m), m];
  let [oldS, s] = [1n, 0n];
  while (r !== 0n) {
    const q = oldR / r;
    [oldR, r] = [r, oldR - q * r];
    [oldS, s] = [s, oldS - q * s];
    trace?.push({
      quotient: q.toString(),
      remainder: oldR.toString(),
      coefficient: oldS.toString(),
    });
  }
  if (oldR !== 1n) return null;
  return bmod(oldS, m);
}

/**
 * Miller–Rabin primality test. Deterministic for n < 3.3·10²⁴ with these
 * witnesses, more than enough for the modest primes used in this teaching lab.
 */
export function isProbablePrime(n: bigint): boolean {
  if (n < 2n) return false;
  for (const p of [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n]) {
    if (n === p) return true;
    if (n % p === 0n) return false;
  }
  let d = n - 1n;
  let s = 0n;
  while ((d & 1n) === 0n) {
    d >>= 1n;
    s += 1n;
  }
  witness: for (const a of [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n]) {
    let x = modpow(a, d, n);
    if (x === 1n || x === n - 1n) continue;
    for (let i = 0n; i < s - 1n; i++) {
      x = (x * x) % n;
      if (x === n - 1n) continue witness;
    }
    return false;
  }
  return true;
}

/** Parse a decimal string into a BigInt, or null if not a non-negative integer. */
export function parseBig(raw: unknown): bigint | null {
  const t = String(raw ?? '').trim();
  if (!/^\d+$/.test(t)) return null;
  try {
    return BigInt(t);
  } catch {
    return null;
  }
}
