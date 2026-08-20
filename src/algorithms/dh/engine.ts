/**
 * Diffie–Hellman key exchange.
 *
 * The first published solution to the problem every earlier cipher had: two
 * parties who have never met, talking over a channel an adversary is listening
 * to, ending up with a shared secret the adversary does not have.
 *
 * Nothing secret is ever transmitted. Alice sends g^a, Bob sends g^b, and each
 * raises what they received to their own exponent. Both arrive at g^(a·b),
 * while an eavesdropper holding g, g^a and g^b has to solve the discrete
 * logarithm to get there.
 */

import { gcd, isProbablePrime, modpow, parseBig, type ModPowStep } from '@/core/bigmath';
import type { AlgorithmResult, Direction, Params, Step } from '@/core/types';

export type DhStepKind =
  | 'params'
  | 'secretA'
  | 'secretB'
  | 'publicA'
  | 'publicB'
  | 'exchange'
  | 'sharedA'
  | 'sharedB'
  | 'agree';

export interface DhStepState {
  kind: DhStepKind;
  p: string;
  g: string;
  /** Private exponents, never transmitted. */
  a: string;
  b: string;
  /** Public values, safe to send in the clear. */
  publicA?: string;
  publicB?: string;
  /** Each side's computed secret. */
  sharedA?: string;
  sharedB?: string;
  /** Which party this step belongs to, for the two-lane diagram. */
  party?: 'alice' | 'bob' | 'both';
  /** Square-and-multiply working for the exponentiation this step performs. */
  ladder?: ModPowStep[];
  exponent?: string;
  base?: string;
  /** True once the value has crossed the wire and is public. */
  sent?: boolean;
}

function err(message: string, paramKey?: string): AlgorithmResult<DhStepState> {
  return { output: '', steps: [], error: { message, paramKey } };
}

/**
 * How many distinct values powers of g run through, or null when p is too large
 * to answer cheaply.
 *
 * A generator of a tiny subgroup makes the shared secret take only a handful of
 * values, which an attacker simply enumerates, so this is a real check rather
 * than a formality. Finding the order in general needs the factorisation of
 * p−1; walking the powers is only affordable for small p, so it is bounded and
 * reported as unknown beyond that rather than hanging the page.
 */
const ORDER_WALK_LIMIT = 200_000n;

function subgroupOrder(g: bigint, p: bigint): bigint | null {
  if (p > ORDER_WALK_LIMIT) return null;
  let order = 1n;
  let value = g % p;
  while (value !== 1n && order < p) {
    value = (value * g) % p;
    order += 1n;
  }
  return order;
}

export function run(
  _input: string,
  params: Params,
  _direction: Direction,
): AlgorithmResult<DhStepState> {
  const p = parseBig(params.p);
  const g = parseBig(params.g);
  const a = parseBig(params.a);
  const b = parseBig(params.b);

  if (p === null || g === null || a === null || b === null) {
    return err('p, g and both private exponents must be positive whole numbers.');
  }
  if (p < 5n) return err('Use a prime of at least 5 so the group is not trivial.', 'p');
  if (!isProbablePrime(p)) return err(`p = ${p} is not prime.`, 'p');
  if (g < 2n || g >= p) return err(`g must satisfy 2 ≤ g < p = ${p}.`, 'g');
  if (gcd(g, p) !== 1n) return err(`g = ${g} shares a factor with p.`, 'g');
  if (a < 1n || a >= p - 1n) return err(`Alice's exponent must satisfy 1 ≤ a < p−1 = ${p - 1n}.`, 'a');
  if (b < 1n || b >= p - 1n) return err(`Bob's exponent must satisfy 1 ≤ b < p−1 = ${p - 1n}.`, 'b');

  const order = subgroupOrder(g, p);
  if (order !== null && order < 4n) {
    return err(
      `g = ${g} generates only ${order} distinct values mod ${p}, so the shared secret could take at most ${order} values and an attacker would simply try them all. Choose a generator with larger order.`,
      'g',
    );
  }
  // Cheap version of the same check when p is too large to walk.
  if (order === null && modpow(g, 2n, p) === 1n) {
    return err(`g = ${g} squares to 1 mod p, so it generates almost nothing.`, 'g');
  }

  const ladderA: ModPowStep[] = [];
  const ladderB: ModPowStep[] = [];
  const ladderSA: ModPowStep[] = [];
  const ladderSB: ModPowStep[] = [];

  const A = modpow(g, a, p, ladderA);
  const B = modpow(g, b, p, ladderB);
  const sA = modpow(B, a, p, ladderSA);
  const sB = modpow(A, b, p, ladderSB);

  const base = {
    p: p.toString(),
    g: g.toString(),
    a: a.toString(),
    b: b.toString(),
    publicA: A.toString(),
    publicB: B.toString(),
    sharedA: sA.toString(),
    sharedB: sB.toString(),
  };

  const steps: Step<DhStepState>[] = [];
  const push = (
    kind: DhStepKind,
    phase: string,
    title: string,
    description: string,
    extra: Partial<DhStepState> = {},
  ) => steps.push({ id: kind, title, description, phase, state: { ...base, kind, ...extra } });

  push(
    'params',
    'Public setup',
    `Public parameters: p = ${p}, g = ${g}`,
    `Both sides agree on a prime modulus p and a generator g. Neither is secret; they are published, standardised, and identical for everyone using the same group.${order !== null ? ` Powers of ${g} run through ${order} distinct values mod ${p} before repeating.` : ''}`,
    { party: 'both' },
  );

  push(
    'secretA',
    'Private choices',
    `Alice picks a = ${a}`,
    'Alice chooses a private exponent at random and never sends it anywhere. It exists only on her machine, and every claim Diffie–Hellman makes rests on that.',
    { party: 'alice' },
  );

  push(
    'secretB',
    'Private choices',
    `Bob picks b = ${b}`,
    'Bob does the same, independently. The two sides have never communicated a secret and still do not share one.',
    { party: 'bob' },
  );

  push(
    'publicA',
    'Public values',
    `Alice computes A = g^a mod p = ${A}`,
    `Raising ${g} to her private exponent gives ${A}. Recovering a from this is the discrete logarithm problem; easy to compute forwards, believed hard to reverse.`,
    { party: 'alice', ladder: ladderA, exponent: a.toString(), base: g.toString() },
  );

  push(
    'publicB',
    'Public values',
    `Bob computes B = g^b mod p = ${B}`,
    `Bob's public value, derived the same way from his own exponent.`,
    { party: 'bob', ladder: ladderB, exponent: b.toString(), base: g.toString() },
  );

  push(
    'exchange',
    'Exchange',
    `Alice sends ${A}, Bob sends ${B}`,
    'The two public values cross in the open. An eavesdropper now holds p, g, A and B (everything that was transmitted), and still cannot compute the shared secret without solving a discrete logarithm.',
    { party: 'both', sent: true },
  );

  push(
    'sharedA',
    'Derive the secret',
    `Alice computes B^a mod p = ${sA}`,
    `Alice raises what Bob sent to her own private exponent: (g^b)^a = g^(b·a).`,
    { party: 'alice', sent: true, ladder: ladderSA, exponent: a.toString(), base: B.toString() },
  );

  push(
    'sharedB',
    'Derive the secret',
    `Bob computes A^b mod p = ${sB}`,
    `Bob raises what Alice sent to his own private exponent: (g^a)^b = g^(a·b). Exponentiation commutes, so the two land on the same number.`,
    { party: 'bob', sent: true, ladder: ladderSB, exponent: b.toString(), base: A.toString() },
  );

  push(
    'agree',
    'Derive the secret',
    `Shared secret = ${sA}`,
    'Both sides now hold the same value, having transmitted nothing that reveals it. In practice this number is not used as a key directly; it is put through a key derivation function first, because its bits are not uniformly distributed.',
    { party: 'both', sent: true },
  );

  return { output: sA.toString(), steps };
}
