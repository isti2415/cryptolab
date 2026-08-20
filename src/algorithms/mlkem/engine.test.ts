import { describe, expect, it } from 'vitest';
import { centered, matVec, polyAdd, polyMul, polySub, polyZero, vecDot } from '@/core/ringpoly';
import { noiseBudget, params, roundTrip, run } from './engine';

const { Q, N } = params;

describe('ring arithmetic', () => {
  it('wraps negacyclically: Xⁿ ≡ −1', () => {
    const x = polyZero(N);
    x[1] = 1; // the polynomial X
    let power = x;
    for (let i = 1; i < N; i++) power = polyMul(power, x, Q);
    // X^n should be −1, i.e. the constant q−1.
    expect(power[0]).toBe(Q - 1);
    expect(power.slice(1).every((c) => c === 0)).toBe(true);
  });

  it('addition and subtraction are inverse', () => {
    const a = [1, 2, 3, 4, 5, 6, 7, 8];
    const b = [8, 7, 6, 5, 4, 3, 2, 1];
    expect(polySub(polyAdd(a, b, Q), b, Q)).toEqual(a);
  });

  it('multiplication is commutative', () => {
    const a = [3, 1, 4, 1, 5, 9, 2, 6];
    const b = [2, 7, 1, 8, 2, 8, 1, 8];
    expect(polyMul(a, b, Q)).toEqual(polyMul(b, a, Q));
  });
});

describe('ML-KEM key generation', () => {
  it('t really is A·s + e', () => {
    const s = run('10110011', { seed: 42 }, 'encrypt').steps[0].state;
    const recomputed = matVec(s.a, s.s, Q).map((p, i) => polyAdd(p, s.e[i], Q));
    expect(recomputed).toEqual(s.t);
  });

  it('the secret and error stay inside the noise bound', () => {
    const s = run('10110011', { seed: 42 }, 'encrypt').steps[0].state;
    for (const vec of [s.s, s.e]) {
      for (const poly of vec) {
        for (const c of poly) {
          expect(Math.abs(centered(c, Q))).toBeLessThanOrEqual(s.eta);
        }
      }
    }
  });

  it('the ciphertext really is (Aᵀ·r + e₁, tᵀ·r + e₂ + encoded)', () => {
    const s = run('11001010', { seed: 7 }, 'encrypt').steps.find(
      (x) => x.state.kind === 'encaps',
    )!.state;
    const half = Math.round(Q / 2);
    const encoded = s.bits.map((b) => b * half);
    const expected = polyAdd(polyAdd(vecDot(s.t, s.r!, Q), s.e2!, Q), encoded, Q);
    expect(s.v).toEqual(expected);
  });
});

describe('ML-KEM round-trip', () => {
  it('recovers the transported bits', () => {
    for (const bits of ['00000000', '11111111', '10110011', '01010101']) {
      expect(roundTrip(bits, 12345)).toBe(bits);
    }
  });

  it('works across many seeds', () => {
    for (let seed = 1; seed <= 80; seed++) {
      expect(roundTrip('10110011', seed)).toBe('10110011');
    }
  });

  it('stays well inside the noise budget', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const decaps = run('10110011', { seed }, 'encrypt').steps.find(
        (s) => s.state.kind === 'decaps',
      )!.state;
      expect(Math.max(...decaps.margins!)).toBeLessThan(noiseBudget);
    }
  });

  it('a different seed gives a different public key', () => {
    const a = run('10110011', { seed: 1 }, 'encrypt').steps[0].state;
    const b = run('10110011', { seed: 2 }, 'encrypt').steps[0].state;
    expect(a.t).not.toEqual(b.t);
  });
});

describe('ML-KEM validation', () => {
  it('requires exactly n bits', () => {
    expect(run('101', { seed: 1 }, 'encrypt').error).toBeDefined();
  });
  it('rejects non-binary input', () => {
    expect(run('abcdefgh', { seed: 1 }, 'encrypt').error).toBeDefined();
  });
  it('rejects a bad seed', () => {
    expect(run('10110011', { seed: 0 }, 'encrypt').error?.paramKey).toBe('seed');
  });
});
