import { describe, expect, it } from 'vitest';
import { run } from './engine';

const shared = (p: string, g: string, a: string, b: string) =>
  run('', { p, g, a, b }, 'encrypt').output;

describe('Diffie–Hellman known examples', () => {
  it('the textbook p = 23, g = 5, a = 6, b = 15 → 2', () => {
    expect(shared('23', '5', '6', '15')).toBe('2');
  });

  it('p = 23, g = 5, a = 4, b = 3 → 18', () => {
    expect(shared('23', '5', '4', '3')).toBe('18');
  });

  it('works over a 31-bit prime', () => {
    expect(shared('2147483647', '7', '12345', '67890')).toBe('579536727');
  });
});

describe('Diffie–Hellman properties', () => {
  it('both sides derive the same value', () => {
    const last = run('', { p: '2147483647', g: '7', a: '999', b: '4242' }, 'encrypt')
      .steps.at(-1)!;
    expect(last.state.sharedA).toBe(last.state.sharedB);
  });

  it('is symmetric in the two private exponents', () => {
    expect(shared('104729', '3', '111', '222')).toBe(
      shared('104729', '3', '222', '111'),
    );
  });

  it('publishes only gᵃ and gᵇ, never the exponents', () => {
    const r = run('', { p: '23', g: '5', a: '6', b: '15' }, 'encrypt');
    const exchange = r.steps.find((s) => s.state.kind === 'exchange')!;
    expect(exchange.state.publicA).toBe('8');
    expect(exchange.state.publicB).toBe('19');
  });
});

describe('Diffie–Hellman validation', () => {
  it('rejects a composite modulus', () => {
    expect(run('', { p: '25', g: '5', a: '3', b: '4' }, 'encrypt').error?.paramKey).toBe('p');
  });
  it('rejects a generator outside 2 ≤ g < p', () => {
    expect(run('', { p: '23', g: '23', a: '3', b: '4' }, 'encrypt').error?.paramKey).toBe('g');
  });
  it('rejects a generator of tiny order', () => {
    // 22 ≡ −1 (mod 23), so its powers cycle through just {22, 1}.
    expect(run('', { p: '23', g: '22', a: '3', b: '4' }, 'encrypt').error?.paramKey).toBe('g');
  });
  it('rejects an out-of-range exponent', () => {
    expect(run('', { p: '23', g: '5', a: '0', b: '4' }, 'encrypt').error?.paramKey).toBe('a');
  });
});
