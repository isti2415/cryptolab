import { describe, expect, it } from 'vitest';
import { railPattern, run } from './engine';

const enc = (t: string, rails: number) => run(t, { rails }, 'encrypt').output;
const dec = (t: string, rails: number) => run(t, { rails }, 'decrypt').output;

describe('rail fence known examples', () => {
  it('the textbook WEAREDISCOVEREDFLEEATONCE on 3 rails', () => {
    expect(enc('WE ARE DISCOVERED FLEE AT ONCE', 3)).toBe(
      'WECRLTEERDSOEEFEAOCAIVDEN',
    );
  });

  it('decrypts it back', () => {
    expect(dec('WECRLTEERDSOEEFEAOCAIVDEN', 3)).toBe(
      'WEAREDISCOVEREDFLEEATONCE',
    );
  });

  it('the same message on 4 rails', () => {
    expect(enc('WEAREDISCOVEREDFLEEATONCE', 4)).toBe(
      'WIREEEDSEEEACAECVDLTNROFO',
    );
  });
});

describe('rail fence structure', () => {
  it('the zigzag has period 2r − 2', () => {
    expect(railPattern(10, 3)).toEqual([0, 1, 2, 1, 0, 1, 2, 1, 0, 1]);
    expect(railPattern(8, 4)).toEqual([0, 1, 2, 3, 2, 1, 0, 1]);
  });

  it('is a pure transposition; the letters are unchanged', () => {
    const plain = 'THEQUICKBROWNFOXJUMPS';
    const cipher = enc(plain, 5);
    expect([...cipher].sort().join('')).toBe([...plain].sort().join(''));
  });

  it('round-trips across every usable rail count', () => {
    const plain = 'ATTACKATDAWNBRINGREINFORCEMENTS';
    for (let rails = 2; rails <= 12; rails++) {
      expect(dec(enc(plain, rails), rails)).toBe(plain);
    }
  });
});

describe('rail fence validation', () => {
  it('rejects fewer than two rails', () => {
    expect(run('HELLO', { rails: 1 }, 'encrypt').error?.paramKey).toBe('rails');
  });

  it('rejects more rails than letters, which would be a no-op', () => {
    expect(run('HI', { rails: 5 }, 'encrypt').error?.paramKey).toBe('rails');
  });

  it('rejects input with no letters', () => {
    expect(run('12345', { rails: 3 }, 'encrypt').error).toBeDefined();
  });
});
