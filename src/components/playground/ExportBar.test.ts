import { describe, expect, it } from 'vitest';
import { toBase64, toHex, traceToJson } from './ExportBar';
import type { AnyAlgorithm, Step } from '@/core/types';

describe('export encodings', () => {
  it('hex-encodes the UTF-8 bytes', () => {
    expect(toHex('KHOOR')).toBe('4b484f4f52');
    expect(toHex('')).toBe('');
  });

  it('base64-encodes the UTF-8 bytes', () => {
    expect(toBase64('KHOOR')).toBe('S0hPT1I=');
    expect(toBase64('')).toBe('');
  });

  it('survives non-ASCII, which btoa alone would throw on', () => {
    // Enigma and the lattice pages put ≪, ⊕ and subscripts in their output.
    expect(toHex('λ')).toBe('cebb');
    expect(() => toBase64('s₀ ⊕ e₁')).not.toThrow();
    expect(toBase64('λ')).toBe('zrs=');
  });
});

describe('traceToJson', () => {
  const algo = { meta: { id: 'caesar', name: 'Caesar Cipher' } } as AnyAlgorithm;
  const steps: Step[] = [
    { id: 'a', title: 'Shift E', description: 'plus three', state: {}, phase: 'Setup' },
  ];

  it('records the run and numbers the steps from one', () => {
    const out = JSON.parse(
      traceToJson(algo, 'HELLO', { shift: 3 }, 'encrypt', 'KHOOR', steps),
    );
    expect(out.algorithm).toEqual({ id: 'caesar', name: 'Caesar Cipher' });
    expect(out.input).toBe('HELLO');
    expect(out.output).toBe('KHOOR');
    expect(out.params).toEqual({ shift: 3 });
    expect(out.steps[0]).toMatchObject({ n: 1, title: 'Shift E', phase: 'Setup' });
  });

  it('omits the per-step state, which is not portable', () => {
    const out = JSON.parse(traceToJson(algo, 'x', {}, 'encrypt', 'y', steps));
    expect(out.steps[0]).not.toHaveProperty('state');
  });
});
