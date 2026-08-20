import { describe, expect, it } from 'vitest';
import { CURVES, addPoints, allPoints, multiply, onCurve, run } from './engine';

const tiny = CURVES[0]; // y² = x³ + 7 mod 17, G = (6, 6)
const small = CURVES[1];

describe('elliptic-curve group law', () => {
  it('the generator is on the curve', () => {
    for (const c of CURVES) expect(onCurve(c.g, c)).toBe(true);
  });

  it('every computed point stays on the curve', () => {
    for (let k = 1; k < 18; k++) {
      expect(onCurve(multiply(k, tiny.g, tiny), tiny)).toBe(true);
    }
  });

  it('the generator has order 18 on the tiny curve', () => {
    expect(multiply(18, tiny.g, tiny)).toBeNull();
    expect(multiply(17, tiny.g, tiny)).not.toBeNull();
  });

  it('adding a point to its reflection gives the point at infinity', () => {
    const P = multiply(3, tiny.g, tiny)!;
    expect(addPoints(P, { x: P.x, y: (tiny.p - P.y) % tiny.p }, tiny)).toBeNull();
  });

  it('addition is commutative', () => {
    const P = multiply(3, tiny.g, tiny);
    const Q = multiply(5, tiny.g, tiny);
    expect(addPoints(P, Q, tiny)).toEqual(addPoints(Q, P, tiny));
  });

  it('doubling agrees with adding a point to itself', () => {
    const P = multiply(4, small.g, small);
    expect(multiply(2, P, small)).toEqual(addPoints(P, P, small));
  });

  it('scalar multiplication is a homomorphism: (j+k)·G = j·G + k·G', () => {
    for (const [j, k] of [[3, 5], [7, 9], [11, 2]]) {
      expect(multiply(j + k, small.g, small)).toEqual(
        addPoints(multiply(j, small.g, small), multiply(k, small.g, small), small),
      );
    }
  });

  it('finds the expected number of affine points', () => {
    expect(allPoints(tiny)).toHaveLength(17);
    expect(allPoints(small)).toHaveLength(259);
  });
});

describe('ECDH', () => {
  const shared = (curve: string, a: number, b: number) =>
    run('', { curve, a, b }, 'encrypt').output;

  it('both sides derive the same point', () => {
    const r = run('', { curve: 'small', a: 47, b: 131 }, 'encrypt');
    const last = r.steps.at(-1)!.state;
    expect(multiply(last.a, last.publicB, last.curve)).toEqual(
      multiply(last.b, last.publicA, last.curve),
    );
  });

  it('is symmetric in the two scalars', () => {
    expect(shared('small', 47, 131)).toBe(shared('small', 131, 47));
  });

  it('agrees with direct computation of (a·b)·G', () => {
    const a = 5;
    const b = 7;
    const direct = multiply(a * b, tiny.g, tiny);
    expect(shared('tiny', a, b)).toBe(`(${direct!.x}, ${direct!.y})`);
  });
});

describe('ECDH validation', () => {
  it('rejects a scalar at or beyond the generator order', () => {
    expect(run('', { curve: 'tiny', a: 18, b: 5 }, 'encrypt').error?.paramKey).toBe('a');
  });
  it('rejects a zero scalar', () => {
    expect(run('', { curve: 'tiny', a: 5, b: 0 }, 'encrypt').error?.paramKey).toBe('b');
  });
});
