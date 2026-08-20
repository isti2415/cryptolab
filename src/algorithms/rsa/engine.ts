/**
 * RSA engine (textbook / educational).
 *
 * From two primes p and q we build the modulus n = p·q and Euler’s totient
 * φ(n) = (p−1)(q−1). A public exponent e coprime with φ(n) is chosen, and the
 * private exponent is its inverse d = e⁻¹ mod φ(n). Then:
 *   Encrypt: c = mᵉ mod n.   Decrypt: m = c^d mod n.
 *
 * This is "textbook" RSA, no padding, encrypting one code point at a time, so
 * it faithfully shows the maths while being explicitly NOT how RSA is used for
 * real (see the content notes). Uses native BigInt so the modular exponentiation
 * is genuinely exact.
 */

import type { AlgorithmResult, Direction, Params, Step } from '@/core/types';
import {
  gcd,
  isProbablePrime,
  modInverse,
  modpow,
  parseBig,
  type EuclidRow,
  type ModPowStep,
} from '@/core/bigmath';

export type RsaStepKind =
  | 'primes'
  | 'modulus'
  | 'trapdoor'
  | 'totient'
  | 'public'
  | 'private'
  | 'char';

export interface RsaStepState {
  kind: RsaStepKind;
  direction: Direction;
  p: string;
  q: string;
  n: string;
  phi: string;
  e: string;
  d: string;
  outputSoFar: string;
  /** For char steps. */
  index?: number;
  inValue?: string; // m (encrypt) or c (decrypt)
  outValue?: string; // c (encrypt) or m (decrypt)
  glyph?: string; // the character involved
  formula?: string;
  /** Square-and-multiply ladder for this character's exponentiation. */
  ladder?: ModPowStep[];
  /** Exponent used, and its binary expansion, what the ladder walks. */
  exponent?: string;
  exponentBits?: string;
  /** All characters/tokens in the message, for the progress track. */
  units?: string[];

  /** Extended-Euclid working that produced d, on the `private` step. */
  euclid?: EuclidRow[];

  /** The asymmetry, on the `trapdoor` step. */
  trapdoor?: {
    /** Multiplications needed to build n from p and q. */
    forward: string;
    /** Trial divisions needed to factor n back apart. */
    backward: string;
    /** Where trial division actually finds the factor. */
    foundAt: string;
  };
}

function err(message: string, paramKey?: string): AlgorithmResult<RsaStepState> {
  return { output: '', steps: [], error: { message, paramKey } };
}

/** Integer square root, for sizing the trial-division comparison. */
function bigintSqrt(n: bigint): bigint {
  if (n < 2n) return n;
  let x = n;
  let y = (x + 1n) / 2n;
  while (y < x) {
    x = y;
    y = (x + n / x) / 2n;
  }
  return x;
}

const bits = (v: bigint) => v.toString(2);

export function run(
  input: string,
  params: Params,
  direction: Direction,
): AlgorithmResult<RsaStepState> {
  const p = parseBig(params.p);
  const q = parseBig(params.q);
  const e = parseBig(params.e);

  if (p === null || q === null || e === null) {
    return err('p, q and e must all be positive whole numbers.');
  }
  if (!isProbablePrime(p)) return err(`p = ${p} is not prime.`, 'p');
  if (!isProbablePrime(q)) return err(`q = ${q} is not prime.`, 'q');
  if (p === q) return err('p and q must be two different primes.', 'q');

  const n = p * q;
  const phi = (p - 1n) * (q - 1n);

  if (e <= 1n || e >= phi) return err(`e must satisfy 1 < e < φ(n) = ${phi}.`, 'e');
  if (gcd(e, phi) !== 1n) {
    return err(`e = ${e} is not coprime with φ(n) = ${phi}; no private key exists. Pick another e.`, 'e');
  }
  const euclid: EuclidRow[] = [];
  const d = modInverse(e, phi, euclid)!;

  const base = {
    direction,
    p: p.toString(),
    q: q.toString(),
    n: n.toString(),
    phi: phi.toString(),
    e: e.toString(),
    d: d.toString(),
  };

  const steps: Step<RsaStepState>[] = [];
  const setup = (
    kind: RsaStepKind,
    title: string,
    description: string,
    extra?: Partial<RsaStepState>,
  ) =>
    steps.push({
      id: kind,
      title,
      description,
      phase: 'Key setup',
      state: { ...base, kind, outputSoFar: '', ...extra },
    });

  setup('primes', `Two primes: p = ${p}, q = ${q}`, 'RSA starts from two secret prime numbers. Both are checked with Miller–Rabin; a composite here would silently break the key rather than fail loudly.');
  setup('modulus', `Modulus n = p·q = ${n}`, 'The modulus n is public. All arithmetic happens mod n, and n is part of both the public and private keys.');

  // How lopsided the trapdoor is, measured on the actual numbers in play.
  const root = bigintSqrt(n);
  const trials = root / 2n + 1n;
  setup('trapdoor', 'One multiplication forward, a search backward', `Building n took a single multiplication. Recovering p and q from n by trial division takes roughly ${trials} divisions even for these tiny primes. That gap is the entire security of RSA, and it widens astronomically with key size.`, {
    trapdoor: { forward: '1', backward: trials.toString(), foundAt: (p < q ? p : q).toString() },
  });

  setup('totient', `φ(n) = (p−1)(q−1) = ${phi}`, 'Euler’s totient counts the numbers below n that are coprime with it. It stays secret; knowing φ(n) is equivalent to knowing the private key, because d follows immediately from it.');
  setup('public', `Public exponent e = ${e}`, 'e is chosen coprime with φ(n). The public key is the pair (n, e); anyone can use it to encrypt.');
  setup('private', `Private exponent d = e⁻¹ mod φ(n) = ${d}`, `d is the modular inverse of e modulo φ(n), found by running the extended Euclidean algorithm on ${e} and ${phi}. Because e·d ≡ 1 (mod φ(n)), raising to e and then to d returns the original message.`, { euclid });

  // --- Message processing --------------------------------------------------
  let out = '';

  if (direction === 'encrypt') {
    const chars = [...input];
    for (let i = 0; i < chars.length; i++) {
      const m = BigInt(chars[i].codePointAt(0)!);
      if (m >= n) {
        return err(
          `The character “${chars[i]}” has code ${m}, which is ≥ n = ${n}. Textbook RSA needs n larger than every message value, choose bigger primes.`,
        );
      }
      const ladder: ModPowStep[] = [];
      const c = modpow(m, e, n, ladder);
      out += (out ? ' ' : '') + c.toString();
      steps.push({
        id: `c${i}`,
        title: `“${chars[i]}” (${m}) → ${c}`,
        description: `Encrypt the code point m = ${m} as c = mᵉ mod n. The exponent ${e} is binary ${bits(e)}, so square-and-multiply gets there in ${ladder.length} squarings instead of ${e} multiplications.`,
        phase: 'Encrypt',
        state: {
          ...base,
          kind: 'char',
          outputSoFar: out,
          index: i,
          inValue: m.toString(),
          outValue: c.toString(),
          glyph: chars[i],
          formula: `${m}^${e} mod ${n} = ${c}`,
          ladder,
          exponent: e.toString(),
          exponentBits: bits(e),
          units: chars,
        },
      });
    }
  } else {
    const tokens = input.trim().length ? input.trim().split(/\s+/) : [];
    for (let i = 0; i < tokens.length; i++) {
      const c = parseBig(tokens[i]);
      if (c === null) return err(`“${tokens[i]}” is not a whole number. Ciphertext should be space-separated integers.`);
      if (c >= n) return err(`Ciphertext value ${c} is ≥ n = ${n}; it can’t have come from this key.`);
      const ladder: ModPowStep[] = [];
      const m = modpow(c, d, n, ladder);
      let glyph: string;
      try {
        glyph = String.fromCodePoint(Number(m));
      } catch {
        return err(`Decryption produced ${m}, which is not a valid character code. The ciphertext or key is wrong.`);
      }
      out += glyph;
      steps.push({
        id: `m${i}`,
        title: `${c} → “${glyph}” (${m})`,
        description: `Decrypt c = ${c} as m = c^d mod n = ${m}, the code point for “${glyph}”. The private exponent ${d} is binary ${bits(d)}, walked bit by bit.`,
        phase: 'Decrypt',
        state: {
          ...base,
          kind: 'char',
          outputSoFar: out,
          index: i,
          inValue: c.toString(),
          outValue: m.toString(),
          glyph,
          formula: `${c}^d mod ${n} = ${m}`,
          ladder,
          exponent: d.toString(),
          exponentBits: bits(d),
          units: tokens,
        },
      });
    }
  }

  return { output: out, steps };
}
