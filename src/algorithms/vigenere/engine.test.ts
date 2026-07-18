import { describe, expect, it } from 'vitest';
import { run } from './engine';

const enc = (t: string, keyword: string) => run(t, { keyword }, 'encrypt').output;
const dec = (t: string, keyword: string) => run(t, { keyword }, 'decrypt').output;

describe('vigenere known-answer vectors', () => {
  // Classic Wikipedia vector.
  it('ATTACKATDAWN with key LEMON → LXFOPVEFRNHR', () => {
    expect(enc('ATTACKATDAWN', 'LEMON')).toBe('LXFOPVEFRNHR');
  });
  it('decrypts back', () => {
    expect(dec('LXFOPVEFRNHR', 'LEMON')).toBe('ATTACKATDAWN');
  });
  it('a single-letter key behaves like Caesar', () => {
    expect(enc('HELLO', 'D')).toBe('KHOOR'); // D = shift 3
  });
  it('preserves case and skips non-letters (key not consumed by them)', () => {
    // "AB CD" with key "K": positions A,B,C,D get K,K,K,K -> shift 10 each.
    expect(enc('AB CD', 'K')).toBe('KL MN');
  });
});

describe('vigenere key alignment across non-letters', () => {
  it('key advances only on letters', () => {
    // key AB: A->A(+0), then space (no advance), B->B... check pattern
    const r = enc('A A A', 'BC'); // letters get B,C,B => shifts 1,2,1
    expect(r).toBe('B C B');
  });
});

describe('vigenere round-trips', () => {
  it('encrypt∘decrypt is identity for various keys', () => {
    const text = 'Meet me at the old bridge at dawn!';
    for (const k of ['KEY', 'LONGERKEYWORD', 'Z', 'ABCXYZ']) {
      expect(dec(enc(text, k), k)).toBe(text);
    }
  });
});

describe('vigenere validation', () => {
  it('rejects an empty or letterless keyword', () => {
    for (const k of ['', '123', '  !!  ']) {
      const r = run('HELLO', { keyword: k }, 'encrypt');
      expect(r.error).toBeDefined();
      expect(r.error?.paramKey).toBe('keyword');
    }
  });
  it('ignores non-letters within the keyword', () => {
    expect(enc('HELLO', 'l-e_m o n')).toBe(enc('HELLO', 'LEMON'));
  });
});

describe('vigenere consistency', () => {
  it("last step's outputSoFar equals output", () => {
    const r = run('Attack at dawn!', { keyword: 'LEMON' }, 'encrypt');
    expect(r.steps.at(-1)!.state.outputSoFar).toBe(r.output);
  });
});
