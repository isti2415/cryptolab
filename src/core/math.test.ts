import { describe, expect, it } from 'vitest';
import {
  coprime,
  gcd,
  indexToLetter,
  letterToIndex,
  mod,
  modInverse,
} from './math';

describe('mod', () => {
  it('returns non-negative for negative inputs', () => {
    expect(mod(-1, 26)).toBe(25);
    expect(mod(-27, 26)).toBe(25);
    expect(mod(3, 26)).toBe(3);
    expect(mod(26, 26)).toBe(0);
  });
});

describe('gcd', () => {
  it('computes gcd', () => {
    expect(gcd(48, 18)).toBe(6);
    expect(gcd(5, 26)).toBe(1);
    expect(gcd(0, 9)).toBe(9);
  });
});

describe('modInverse', () => {
  it('finds inverses that exist', () => {
    // 5 * 21 = 105 = 4*26 + 1  ≡ 1 (mod 26)
    expect(modInverse(5, 26)).toBe(21);
    expect(modInverse(7, 26)).toBe(15);
    expect(modInverse(1, 26)).toBe(1);
  });
  it('returns null when no inverse exists', () => {
    expect(modInverse(2, 26)).toBeNull();
    expect(modInverse(13, 26)).toBeNull();
  });
  it('inverse is a true inverse', () => {
    for (let a = 1; a < 26; a++) {
      if (!coprime(a, 26)) continue;
      const inv = modInverse(a, 26)!;
      expect(mod(a * inv, 26)).toBe(1);
    }
  });
});

describe('letter <-> index', () => {
  it('maps both cases to indices', () => {
    expect(letterToIndex('A')).toBe(0);
    expect(letterToIndex('Z')).toBe(25);
    expect(letterToIndex('a')).toBe(0);
    expect(letterToIndex('z')).toBe(25);
    expect(letterToIndex('5')).toBe(-1);
    expect(letterToIndex(' ')).toBe(-1);
  });
  it('round-trips', () => {
    expect(indexToLetter(0)).toBe('A');
    expect(indexToLetter(25)).toBe('Z');
    expect(indexToLetter(26)).toBe('A'); // wraps
  });
});
