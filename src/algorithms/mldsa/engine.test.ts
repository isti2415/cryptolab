import { describe, expect, it } from 'vitest';
import { matVec, vecAdd } from '@/core/ringpoly';
import { params, run } from './engine';

const sign = (message: string, seed: number) => run(message, { seed }, 'encrypt').output;

describe('ML-DSA key generation', () => {
  it('t really is A·s₁ + s₂', () => {
    const s = run('hello', { seed: 5 }, 'encrypt').steps[0].state;
    expect(vecAdd(matVec(s.a, s.s1, params.Q), s.s2, params.Q)).toEqual(s.t);
  });
});

describe('ML-DSA signing', () => {
  it('produces a valid signature', () => {
    expect(sign('attack at dawn', 12345)).toContain('valid');
  });

  it('verifies across many seeds and messages', () => {
    for (let seed = 1; seed <= 40; seed++) {
      expect(sign(`message ${seed}`, seed)).toContain('valid');
    }
  });

  it('rejects a tampered message', () => {
    expect(run('transfer 100', { seed: 9 }, 'decrypt').output).toContain('invalid');
  });

  it('every accepted signature satisfies the published norm bound', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const accepted = run(`m${seed}`, { seed }, 'encrypt').steps.find(
        (s) => s.state.kind === 'accept',
      )!.state;
      const last = accepted.attempts.at(-1)!;
      expect(last.accepted).toBe(true);
      expect(last.zNorm).toBeLessThan(params.GAMMA1 - params.BETA);
      expect(last.lowNorm).toBeLessThan(params.GAMMA2 - params.BETA);
    }
  });

  it('the challenge is sparse; exactly τ non-zero coefficients', () => {
    const s = run('hello', { seed: 3 }, 'encrypt').steps.find(
      (x) => x.state.kind === 'accept',
    )!.state;
    expect(s.c!.filter((v) => v !== 0)).toHaveLength(params.TAU);
  });

  it('rejection actually happens for some keys', () => {
    // The whole point of the scheme is that candidates get discarded; if no
    // seed in a reasonable range ever rejects, the bounds are not doing their job.
    let sawRejection = false;
    for (let seed = 1; seed <= 60 && !sawRejection; seed++) {
      const r = run(`m${seed}`, { seed }, 'encrypt');
      if (r.steps.some((s) => s.state.kind === 'reject')) sawRejection = true;
    }
    expect(sawRejection).toBe(true);
  });
});

describe('ML-DSA validation', () => {
  it('rejects an empty message', () => {
    expect(run('', { seed: 1 }, 'encrypt').error).toBeDefined();
  });
  it('rejects a bad seed', () => {
    expect(run('m', { seed: 0 }, 'encrypt').error?.paramKey).toBe('seed');
  });
});
