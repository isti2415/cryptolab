import { describe, expect, it } from 'vitest';
import { run } from './engine';

const enc = (t: string, shift: number) => run(t, { shift }, 'encrypt').output;
const dec = (t: string, shift: number) => run(t, { shift }, 'decrypt').output;

describe('caesar known-answer vectors', () => {
  it('the classic: HELLO shift 3 → KHOOR', () => {
    expect(enc('HELLO', 3)).toBe('KHOOR');
  });

  it('wraps around Z', () => {
    expect(enc('XYZ', 3)).toBe('ABC');
  });

  it('shift 13 is ROT13 and self-inverse', () => {
    expect(enc('The quick brown fox', 13)).toBe('Gur dhvpx oebja sbk');
    expect(enc(enc('Attack at dawn', 13), 13)).toBe('Attack at dawn');
  });

  it('preserves case and non-letters', () => {
    expect(enc('Hello, World!', 3)).toBe('Khoor, Zruog!');
  });

  it('shift 0 is identity', () => {
    expect(enc('Anything123', 0)).toBe('Anything123');
  });
});

describe('caesar decrypt', () => {
  it('inverts encryption', () => {
    expect(dec('KHOOR', 3)).toBe('HELLO');
  });
  it('round-trips arbitrary text at every shift', () => {
    const text = 'Pack my box with five dozen liquor jugs.';
    for (let s = 0; s < 26; s++) {
      expect(dec(enc(text, s), s)).toBe(text);
    }
  });
});

describe('caesar edge cases', () => {
  it('empty input yields empty output and a setup step only', () => {
    const r = run('', { shift: 5 }, 'encrypt');
    expect(r.output).toBe('');
    expect(r.error).toBeUndefined();
    expect(r.steps).toHaveLength(1);
    expect(r.steps[0].state.kind).toBe('setup');
  });

  it('normalizes out-of-range shift (mod 26)', () => {
    expect(enc('ABC', 29)).toBe(enc('ABC', 3));
    expect(enc('ABC', -1)).toBe('ZAB');
  });

  it('reports a structured error on a non-numeric shift instead of throwing', () => {
    const r = run('ABC', { shift: 'oops' as unknown as number }, 'encrypt');
    expect(r.error).toBeDefined();
    expect(r.error?.paramKey).toBe('shift');
    expect(r.output).toBe('');
  });
});

describe('walkthrough/playground consistency', () => {
  it("final step's outputSoFar equals the returned output", () => {
    const r = run('Hello, World!', { shift: 7 }, 'encrypt');
    const last = r.steps[r.steps.length - 1];
    expect(last.state.outputSoFar).toBe(r.output);
  });

  it('every letter/passthrough produces exactly one step (+1 setup)', () => {
    const text = 'Hi there!';
    const r = run(text, { shift: 4 }, 'encrypt');
    expect(r.steps).toHaveLength(text.length + 1);
  });
});
