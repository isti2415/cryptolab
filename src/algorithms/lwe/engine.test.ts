import { describe, expect, it } from 'vitest';
import { run } from './engine';

const enc = (bits: string, seed = 12345) => run(bits, { seed }, 'encrypt').output;
const dec = (bits: string, seed = 12345) => run(bits, { seed }, 'decrypt').output;

describe('LWE key setup', () => {
  it('publishes b = A·s + e with small error', () => {
    const s = run('0', { seed: 7 }, 'encrypt').steps[0].state;
    const q = s.q;
    for (let i = 0; i < s.m; i++) {
      const exact = s.a[i].reduce((acc, v, j) => acc + v * s.s[j], 0);
      expect(((s.b[i] - exact - s.e[i]) % q + q) % q).toBe(0);
      expect(Math.abs(s.e[i])).toBeLessThanOrEqual(2);
    }
  });

  it('is deterministic for a given seed and differs across seeds', () => {
    const a = run('0', { seed: 7 }, 'encrypt').steps[0].state;
    const b = run('0', { seed: 7 }, 'encrypt').steps[0].state;
    const c = run('0', { seed: 8 }, 'encrypt').steps[0].state;
    expect(a.s).toEqual(b.s);
    expect(a.s).not.toEqual(c.s);
  });
});

describe('LWE round-trip', () => {
  it('recovers every bit pattern it encrypts', () => {
    for (const bits of ['0', '1', '1011', '000111', '101010101010']) {
      expect(dec(bits)).toBe(bits);
      expect(enc(bits)).toBe(bits);
    }
  });

  it('recovers correctly across many seeds', () => {
    for (let seed = 1; seed <= 60; seed++) {
      expect(dec('10110', seed)).toBe('10110');
    }
  });

  it('leaves a decision margin far larger than the noise', () => {
    const steps = run('1010', { seed: 99 }, 'decrypt').steps.filter(
      (s) => s.state.kind === 'decrypt',
    );
    for (const s of steps) {
      // Noise is at most 2 per row over at most 8 rows, so well under q/4 ≈ 24.
      expect(s.state.margin).toBeLessThan(24);
      expect(s.state.recovered).toBe(s.state.bit);
    }
  });
});

describe('LWE validation', () => {
  it('rejects non-binary input', () => {
    expect(run('hello', { seed: 1 }, 'encrypt').error).toBeDefined();
  });
  it('rejects an empty message', () => {
    expect(run('', { seed: 1 }, 'encrypt').error).toBeDefined();
  });
  it('rejects a bad seed', () => {
    expect(run('1', { seed: 0 }, 'encrypt').error?.paramKey).toBe('seed');
  });
});
