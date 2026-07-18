import { describe, expect, it } from 'vitest';
import { run } from './engine';
import { isProbablePrime, modInverse, modpow } from './bigmath';

const P = '61';
const Q = '53';
const E = '17';
const encParams = { p: P, q: Q, e: E };

const enc = (t: string) => run(t, encParams, 'encrypt').output;
const dec = (t: string) => run(t, encParams, 'decrypt').output;

describe('rsa bigmath', () => {
  it('modpow matches known values', () => {
    // 65^17 mod 3233 = 2790 (classic RSA example)
    expect(modpow(65n, 17n, 3233n)).toBe(2790n);
    expect(modpow(2790n, 2753n, 3233n)).toBe(65n);
  });
  it('modInverse: e·d ≡ 1 mod φ', () => {
    expect(modInverse(17n, 3120n)).toBe(2753n);
  });
  it('Miller–Rabin identifies primes', () => {
    expect(isProbablePrime(61n)).toBe(true);
    expect(isProbablePrime(53n)).toBe(true);
    expect(isProbablePrime(3233n)).toBe(false); // 61*53
    expect(isProbablePrime(7919n)).toBe(true);
    expect(isProbablePrime(1n)).toBe(false);
  });
});

describe('rsa textbook vector (n=3233, e=17, d=2753)', () => {
  it("encrypts 'A' (65) to 2790", () => {
    expect(enc('A')).toBe('2790');
  });
  it('derives d = 2753', () => {
    expect(run('A', encParams, 'encrypt').steps[0].state.d).toBe('2753');
  });
  it('round-trips text through per-character encryption', () => {
    const msg = 'Hi!';
    const c = enc(msg);
    expect(c.split(' ')).toHaveLength(3);
    expect(dec(c)).toBe(msg);
  });
});

describe('rsa round-trips over several keys', () => {
  const keys = [
    { p: '61', q: '53', e: '17' },
    { p: '17', q: '11', e: '7' },
    { p: '101', q: '113', e: '3533' },
  ];
  it('decrypt∘encrypt recovers the message', () => {
    for (const k of keys) {
      const c = run('Yo', k, 'encrypt').output;
      expect(run(c, k, 'decrypt').output).toBe('Yo');
    }
  });
});

describe('rsa validation', () => {
  it('rejects non-prime p or q', () => {
    expect(run('A', { p: '60', q: '53', e: '17' }, 'encrypt').error?.paramKey).toBe('p');
    expect(run('A', { p: '61', q: '52', e: '17' }, 'encrypt').error?.paramKey).toBe('q');
  });
  it('rejects e not coprime with φ(n)', () => {
    // φ = 3120 = 2^4·3·5·13; e=15 shares factors 3,5
    expect(run('A', { p: '61', q: '53', e: '15' }, 'encrypt').error?.paramKey).toBe('e');
  });
  it('rejects p = q', () => {
    expect(run('A', { p: '61', q: '61', e: '17' }, 'encrypt').error?.paramKey).toBe('q');
  });
  it('errors when a character code is ≥ n', () => {
    // n = 17*11 = 187 < 65 no... choose tiny primes so n < 65
    const r = run('A', { p: '5', q: '7', e: '5' }, 'encrypt'); // n=35 < 65
    expect(r.error).toBeDefined();
  });
});

describe('rsa consistency', () => {
  it("last step's outputSoFar equals the returned output", () => {
    const r = run('Hey', encParams, 'encrypt');
    expect(r.steps.at(-1)!.state.outputSoFar).toBe(r.output);
  });
});
