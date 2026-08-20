/**
 * Elliptic-curve Diffie–Hellman.
 *
 * The same idea as ordinary Diffie–Hellman, in a different group. Instead of
 * multiplying numbers modulo a prime, you *add points on a curve*, and the
 * hard problem becomes recovering the scalar k from the point k·G rather than
 * recovering an exponent from a power.
 *
 * The payoff is size. The best known attacks on elliptic curves are far worse
 * than the index calculus that attacks finite fields, so a 256-bit curve gives
 * roughly the security of a 3072-bit prime group. That is why modern protocols
 * moved to curves.
 *
 * The curves here are absurdly small so that every point can be plotted; the
 * arithmetic is identical at any size.
 */

import type { AlgorithmResult, Direction, Params, Step } from '@/core/types';

/** null is the point at infinity: the identity of the group. */
export type Point = { x: number; y: number } | null;

export interface Curve {
  id: string;
  label: string;
  p: number;
  a: number;
  b: number;
  g: { x: number; y: number };
}

export const CURVES: Curve[] = [
  {
    id: 'tiny',
    label: 'y² = x³ + 7 mod 17',
    p: 17,
    a: 0,
    b: 7,
    g: { x: 6, y: 6 },
  },
  {
    id: 'small',
    label: 'y² = x³ + x + 1 mod 263',
    p: 263,
    a: 1,
    b: 1,
    g: { x: 3, y: 89 },
  },
];

const mod = (a: number, n: number) => ((a % n) + n) % n;

/** Modular inverse by extended Euclid; the curves here are far too small for anything cleverer. */
function inverse(a: number, n: number): number {
  let [oldR, r] = [mod(a, n), n];
  let [oldS, s] = [1, 0];
  while (r !== 0) {
    const q = Math.floor(oldR / r);
    [oldR, r] = [r, oldR - q * r];
    [oldS, s] = [s, oldS - q * s];
  }
  return mod(oldS, n);
}

export function onCurve(pt: Point, c: Curve): boolean {
  if (pt === null) return true;
  return mod(pt.y * pt.y, c.p) === mod(pt.x * pt.x * pt.x + c.a * pt.x + c.b, c.p);
}

export interface AddDetail {
  kind: 'double' | 'add' | 'infinity';
  lambda?: number;
  /** The rational slope before reduction, for the worked line. */
  numerator?: number;
  denominator?: number;
}

/**
 * The group law: draw a line through two points, take the third point it meets
 * the curve at, and reflect it across the x-axis.
 *
 * Over the real numbers that is a chord (or a tangent, when the two points
 * coincide). Over a finite field the picture scatters, but the algebra is
 * unchanged, which is the point worth taking away.
 */
export function addPoints(P: Point, Q: Point, c: Curve, detail?: { value?: AddDetail }): Point {
  if (P === null) return Q;
  if (Q === null) return P;

  // A point plus its own reflection gives the point at infinity.
  if (P.x === Q.x && mod(P.y + Q.y, c.p) === 0) {
    if (detail) detail.value = { kind: 'infinity' };
    return null;
  }

  let lambda: number;
  let numerator: number;
  let denominator: number;
  let kind: AddDetail['kind'];

  if (P.x === Q.x && P.y === Q.y) {
    kind = 'double';
    numerator = mod(3 * P.x * P.x + c.a, c.p);
    denominator = mod(2 * P.y, c.p);
  } else {
    kind = 'add';
    numerator = mod(Q.y - P.y, c.p);
    denominator = mod(Q.x - P.x, c.p);
  }
  lambda = mod(numerator * inverse(denominator, c.p), c.p);

  const x = mod(lambda * lambda - P.x - Q.x, c.p);
  const y = mod(lambda * (P.x - x) - P.y, c.p);

  if (detail) detail.value = { kind, lambda, numerator, denominator };
  return { x, y };
}

export interface LadderRung {
  /** Which bit of the scalar this rung consumed, from the high end. */
  bitIndex: number;
  bit: number;
  /** The accumulator after doubling. */
  afterDouble: Point;
  /** The accumulator after the conditional add. */
  result: Point;
  added: boolean;
  detail?: AddDetail;
}

/**
 * Double-and-add: the elliptic-curve counterpart of square-and-multiply.
 *
 * Note that the add only happens where a bit is set. A naive implementation
 * therefore takes a different amount of time depending on the secret scalar,
 * which is precisely how real private keys have been recovered from timing.
 */
export function multiply(k: number, P: Point, c: Curve, rungs?: LadderRung[]): Point {
  if (k === 0 || P === null) return null;
  const bits = k.toString(2);
  let result: Point = null;

  for (let i = 0; i < bits.length; i++) {
    const bit = Number(bits[i]);
    const detail: { value?: AddDetail } = {};
    const doubled: Point = result === null ? null : addPoints(result, result, c);
    result = doubled;
    let added = false;
    if (bit === 1) {
      result = addPoints(result, P, c, detail);
      added = true;
    }
    rungs?.push({
      bitIndex: i,
      bit,
      afterDouble: doubled,
      result,
      added,
      detail: detail.value,
    });
  }
  return result;
}

/** Every affine point on the curve, for the scatter plot. */
export function allPoints(c: Curve): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = [];
  for (let x = 0; x < c.p; x++) {
    const rhs = mod(x * x * x + c.a * x + c.b, c.p);
    for (let y = 0; y < c.p; y++) {
      if (mod(y * y, c.p) === rhs) out.push({ x, y });
    }
  }
  return out;
}

/** Order of the subgroup generated by G, bounded so a bad curve cannot hang. */
function generatorOrder(c: Curve): number | null {
  let n = 1;
  let current: Point = { ...c.g };
  while (current !== null) {
    current = addPoints(current, c.g, c);
    n += 1;
    if (n > 4 * c.p) return null;
  }
  return n;
}

export type EccStepKind =
  | 'curve'
  | 'secrets'
  | 'publicA'
  | 'publicB'
  | 'exchange'
  | 'sharedA'
  | 'sharedB'
  | 'agree';

export interface EccStepState {
  kind: EccStepKind;
  curve: Curve;
  order: number | null;
  points: { x: number; y: number }[];
  a: number;
  b: number;
  publicA: Point;
  publicB: Point;
  shared: Point;
  /** Points to spotlight on the plot for this step. */
  highlight: { point: Point; role: 'generator' | 'public' | 'shared' | 'working' }[];
  party?: 'alice' | 'bob' | 'both';
  rungs?: LadderRung[];
  scalar?: number;
  basePoint?: Point;
  sent?: boolean;
}

const fmt = (pt: Point) => (pt === null ? '∞' : `(${pt.x}, ${pt.y})`);

export function run(
  _input: string,
  params: Params,
  _direction: Direction,
): AlgorithmResult<EccStepState> {
  const curve = CURVES.find((c) => c.id === String(params.curve)) ?? CURVES[0];

  if (!onCurve(curve.g, curve)) {
    return { output: '', steps: [], error: { message: 'The generator is not on the curve.' } };
  }

  const order = generatorOrder(curve);
  const readScalar = (raw: unknown) => {
    const n = typeof raw === 'number' ? raw : parseInt(String(raw), 10);
    return Number.isFinite(n) ? Math.trunc(n) : NaN;
  };
  const a = readScalar(params.a);
  const b = readScalar(params.b);

  const limit = order ?? curve.p;
  if (!Number.isFinite(a) || a < 1 || a >= limit) {
    return { output: '', steps: [], error: { paramKey: 'a', message: `Alice's scalar must satisfy 1 ≤ a < ${limit}, the order of the generator.` } };
  }
  if (!Number.isFinite(b) || b < 1 || b >= limit) {
    return { output: '', steps: [], error: { paramKey: 'b', message: `Bob's scalar must satisfy 1 ≤ b < ${limit}.` } };
  }

  const rungsA: LadderRung[] = [];
  const rungsB: LadderRung[] = [];
  const rungsSA: LadderRung[] = [];
  const rungsSB: LadderRung[] = [];

  const publicA = multiply(a, curve.g, curve, rungsA);
  const publicB = multiply(b, curve.g, curve, rungsB);
  const sharedA = multiply(a, publicB, curve, rungsSA);
  const sharedB = multiply(b, publicA, curve, rungsSB);

  const points = allPoints(curve);
  const base = { curve, order, points, a, b, publicA, publicB, shared: sharedA };

  const steps: Step<EccStepState>[] = [];
  const push = (
    kind: EccStepKind,
    phase: string,
    title: string,
    description: string,
    extra: Partial<EccStepState> = {},
  ) =>
    steps.push({
      id: kind,
      title,
      description,
      phase,
      state: { ...base, kind, highlight: [], ...extra },
    });

  push(
    'curve',
    'The curve',
    `${curve.label} · ${points.length} points`,
    `Every point with both coordinates in the field is plotted. Together with the point at infinity they form a group of order ${order ?? '?'} under the chord-and-tangent rule, and that group is where all the arithmetic happens. Real curves have around 2²⁵⁶ points; this one has ${points.length} so that they fit on a screen.`,
    { highlight: [{ point: curve.g, role: 'generator' }], party: 'both' },
  );

  push(
    'secrets',
    'Private choices',
    `Alice picks a = ${a}, Bob picks b = ${b}`,
    'Each side chooses a private scalar and keeps it. As in ordinary Diffie–Hellman, nothing secret is ever transmitted: the scalars exist only on their own machines.',
    { highlight: [{ point: curve.g, role: 'generator' }], party: 'both' },
  );

  push(
    'publicA',
    'Public points',
    `Alice computes A = a·G = ${fmt(publicA)}`,
    `Adding G to itself ${a} times gives ${fmt(publicA)}. Recovering a from that point is the elliptic-curve discrete logarithm problem, and unlike the finite-field case, no index-calculus shortcut is known for it, which is why curves can be so much smaller.`,
    {
      highlight: [
        { point: curve.g, role: 'generator' },
        { point: publicA, role: 'public' },
      ],
      party: 'alice',
      rungs: rungsA,
      scalar: a,
      basePoint: curve.g,
    },
  );

  push(
    'publicB',
    'Public points',
    `Bob computes B = b·G = ${fmt(publicB)}`,
    'Bob does the same with his own scalar.',
    {
      highlight: [
        { point: curve.g, role: 'generator' },
        { point: publicB, role: 'public' },
      ],
      party: 'bob',
      rungs: rungsB,
      scalar: b,
      basePoint: curve.g,
    },
  );

  push(
    'exchange',
    'Exchange',
    `Alice sends ${fmt(publicA)}, Bob sends ${fmt(publicB)}`,
    'The two public points cross in the open. An eavesdropper now has the curve, the generator and both public points (everything that was transmitted), and still cannot get the shared secret without solving a discrete logarithm.',
    {
      highlight: [
        { point: publicA, role: 'public' },
        { point: publicB, role: 'public' },
      ],
      party: 'both',
      sent: true,
    },
  );

  push(
    'sharedA',
    'Derive the secret',
    `Alice computes a·B = ${fmt(sharedA)}`,
    'Alice multiplies what Bob sent by her own scalar: a·(b·G).',
    {
      highlight: [
        { point: publicB, role: 'public' },
        { point: sharedA, role: 'shared' },
      ],
      party: 'alice',
      sent: true,
      rungs: rungsSA,
      scalar: a,
      basePoint: publicB,
    },
  );

  push(
    'sharedB',
    'Derive the secret',
    `Bob computes b·A = ${fmt(sharedB)}`,
    'Bob multiplies what Alice sent by his: b·(a·G). Scalar multiplication commutes, so both land on the same point.',
    {
      highlight: [
        { point: publicA, role: 'public' },
        { point: sharedB, role: 'shared' },
      ],
      party: 'bob',
      sent: true,
      rungs: rungsSB,
      scalar: b,
      basePoint: publicA,
    },
  );

  push(
    'agree',
    'Derive the secret',
    `Shared point ${fmt(sharedA)}`,
    'Both sides hold the same point. In practice only its x-coordinate is kept, and even that is passed through a key derivation function rather than used as a key directly.',
    { highlight: [{ point: sharedA, role: 'shared' }], party: 'both', sent: true },
  );

  return { output: fmt(sharedA), steps };
}
