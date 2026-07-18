import { describe, expect, it } from 'vitest';
import { run } from './engine';

const enc = (t: string, pad: string) => run(t, { pad }, 'encrypt').output;
const dec = (t: string, pad: string) => run(t, { pad }, 'decrypt').output;

describe('otp modular-addition vectors', () => {
  // HELLO + XMCKL = EQNVZ (classic OTP mod-26 example)
  it('HELLO + XMCKL → EQNVZ', () => {
    expect(enc('HELLO', 'XMCKL')).toBe('EQNVZ');
  });
  it('decrypts back', () => {
    expect(dec('EQNVZ', 'XMCKL')).toBe('HELLO');
  });
  it('a pad of all A is the identity', () => {
    expect(enc('SECRET', 'AAAAAA')).toBe('SECRET');
  });
});

describe('otp round-trips', () => {
  it('encrypt∘decrypt recovers the message', () => {
    const text = 'Meet at midnight.';
    const pad = 'QZKAPLMNBVCXYTRE'; // >= 13 letters
    expect(dec(enc(text, pad), pad)).toBe(text);
  });
});

describe('otp validation', () => {
  it('errors when the pad is shorter than the message', () => {
    const r = run('HELLO', { pad: 'AB' }, 'encrypt');
    expect(r.error).toBeDefined();
    expect(r.error?.paramKey).toBe('pad');
    expect(r.output).toBe('');
  });
  it('counts only letters toward the length requirement', () => {
    // "HI!" needs 2 pad letters; punctuation doesn't consume pad.
    expect(run('HI!', { pad: 'AB' }, 'encrypt').error).toBeUndefined();
    expect(enc('H!I', 'AB')).toBe('H!J'); // H+A=H, I+B=J
  });
  it('ignores non-letters inside the pad', () => {
    expect(enc('HELLO', 'x m c k l')).toBe(enc('HELLO', 'XMCKL'));
  });
});

describe('otp consistency', () => {
  it("last step's outputSoFar equals output", () => {
    const r = run('Attack!', { pad: 'ZZZZZZ' }, 'encrypt');
    expect(r.steps.at(-1)!.state.outputSoFar).toBe(r.output);
  });
});
