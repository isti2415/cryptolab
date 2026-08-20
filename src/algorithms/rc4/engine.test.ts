import { describe, expect, it } from 'vitest';
import { run } from './engine';

const enc = (text: string, key: string) => run(text, { key }, 'encrypt').output;
const dec = (hex: string, key: string) => run(hex, { key }, 'decrypt').output;

describe('RC4 published test vectors', () => {
  it('key "Key" / "Plaintext" → BBF316E8D940AF0AD3', () => {
    expect(enc('Plaintext', 'Key')).toBe('BBF316E8D940AF0AD3');
  });
  it('key "Wiki" / "pedia" → 1021BF0420', () => {
    expect(enc('pedia', 'Wiki')).toBe('1021BF0420');
  });
  it('key "Secret" / "Attack at dawn" → 45A01F645FC35B383552544B9BF5', () => {
    expect(enc('Attack at dawn', 'Secret')).toBe('45A01F645FC35B383552544B9BF5');
  });
  it('decrypts each of them back', () => {
    expect(dec('BBF316E8D940AF0AD3', 'Key')).toBe('Plaintext');
    expect(dec('1021BF0420', 'Wiki')).toBe('pedia');
    expect(dec('45A01F645FC35B383552544B9BF5', 'Secret')).toBe('Attack at dawn');
  });
});

describe('RC4 structure', () => {
  it('the key schedule leaves S a permutation of 0…255', () => {
    const last = run('x', { key: 'anything' }, 'encrypt').steps.at(-1)!;
    expect([...last.state.s].sort((a, b) => a - b)).toEqual(
      Array.from({ length: 256 }, (_, i) => i),
    );
  });

  it('starts from the identity permutation before the key is mixed in', () => {
    const setup = run('x', { key: 'k' }, 'encrypt').steps[0];
    expect(setup.state.s).toEqual(Array.from({ length: 256 }, (_, i) => i));
  });

  it('encryption and decryption are the same operation', () => {
    // XORing a ciphertext with the same keystream returns the plaintext, so
    // running "encrypt" twice over the hex round-trips through itself.
    const cipher = enc('Round trip me', 'a longer key');
    expect(dec(cipher, 'a longer key')).toBe('Round trip me');
  });
});

describe('RC4 validation', () => {
  it('rejects an empty key', () => {
    expect(run('hi', { key: '' }, 'encrypt').error?.paramKey).toBe('key');
  });
  it('rejects ciphertext that is not hex', () => {
    expect(run('not hex!', { key: 'k' }, 'decrypt').error).toBeDefined();
  });
  it('rejects empty input', () => {
    expect(run('', { key: 'k' }, 'encrypt').error).toBeDefined();
  });
});
