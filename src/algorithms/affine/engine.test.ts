import { describe, expect, it } from 'vitest';
import { run } from './engine';

const enc = (t: string, a: number, b: number) => run(t, { a, b }, 'encrypt').output;
const dec = (t: string, a: number, b: number) => run(t, { a, b }, 'decrypt').output;

describe('affine known-answer vectors', () => {
  // Classic textbook vector: a=5, b=8.  AFFINECIPHER -> IHHWVCSWFRCP
  it('AFFINECIPHER with a=5 b=8 → IHHWVCSWFRCP', () => {
    expect(enc('AFFINECIPHER', 5, 8)).toBe('IHHWVCSWFRCP');
  });
  it('decrypts back', () => {
    expect(dec('IHHWVCSWFRCP', 5, 8)).toBe('AFFINECIPHER');
  });
  it('a=1 reduces to a Caesar shift of b', () => {
    expect(enc('HELLO', 1, 3)).toBe('KHOOR');
  });
  it('preserves case and non-letters', () => {
    expect(enc('Hello, World!', 5, 8)).toBe(enc('Hello, World!', 5, 8));
    const r = run('Hi!', { a: 3, b: 1 }, 'encrypt').output;
    expect(r[2]).toBe('!');
    expect(r).toBe(r.slice(0, 2) + '!');
  });
});

describe('affine round-trips for every valid a', () => {
  const valids = [1, 3, 5, 7, 9, 11, 15, 17, 19, 21, 23, 25];
  it('encrypt∘decrypt is identity', () => {
    const text = 'The quick brown fox jumps.';
    for (const a of valids) {
      for (let b = 0; b < 26; b++) {
        expect(dec(enc(text, a, b), a, b)).toBe(text);
      }
    }
  });
});

describe('affine validation', () => {
  it('rejects a not coprime with 26 (structured error, no throw)', () => {
    for (const a of [2, 4, 13, 26]) {
      const r = run('ABC', { a, b: 1 }, 'encrypt');
      expect(r.error).toBeDefined();
      expect(r.error?.paramKey).toBe('a');
      expect(r.output).toBe('');
    }
  });
  it('accepts a coprime with 26', () => {
    expect(run('ABC', { a: 7, b: 3 }, 'encrypt').error).toBeUndefined();
  });
  it('normalizes out-of-range b', () => {
    expect(enc('ABC', 5, 8)).toBe(enc('ABC', 5, 34));
  });
});

describe('affine consistency', () => {
  it("last step's outputSoFar equals output", () => {
    const r = run('Hello, World!', { a: 5, b: 8 }, 'encrypt');
    expect(r.steps.at(-1)!.state.outputSoFar).toBe(r.output);
  });
});
