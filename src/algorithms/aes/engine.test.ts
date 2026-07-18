import { describe, expect, it } from 'vitest';
import { run } from './engine';
import { INV_SBOX, SBOX } from './gf';

const enc = (data: string, key: string) => run(data, { key }, 'encrypt').output;
const dec = (data: string, key: string) => run(data, { key }, 'decrypt').output;

describe('AES S-box (computed from GF(2⁸))', () => {
  it('matches the standard S-box at known points', () => {
    expect(SBOX[0x00]).toBe(0x63);
    expect(SBOX[0x01]).toBe(0x7c);
    expect(SBOX[0x53]).toBe(0xed);
    expect(SBOX[0x10]).toBe(0xca);
    expect(SBOX[0xff]).toBe(0x16);
  });
  it('is a bijection with its inverse', () => {
    for (let b = 0; b < 256; b++) expect(INV_SBOX[SBOX[b]]).toBe(b);
  });
});

describe('AES-128 FIPS-197 known-answer vectors', () => {
  it('Appendix C.1: key 000102…0f, PT 00112233…ff → 69C4E0D8…C55A', () => {
    expect(enc('00112233445566778899aabbccddeeff', '000102030405060708090a0b0c0d0e0f')).toBe(
      '69C4E0D86A7B0430D8CDB78070B4C55A',
    );
  });
  it('Appendix B: key 2b7e15…4f3c, PT 3243f6a8…0734 → 3925841D…0B32', () => {
    expect(enc('3243f6a8885a308d313198a2e0370734', '2b7e151628aed2a6abf7158809cf4f3c')).toBe(
      '3925841D02DC09FBDC118597196A0B32',
    );
  });
  it('decrypts both vectors back', () => {
    expect(dec('69C4E0D86A7B0430D8CDB78070B4C55A', '000102030405060708090a0b0c0d0e0f')).toBe(
      '00112233445566778899AABBCCDDEEFF',
    );
    expect(dec('3925841D02DC09FBDC118597196A0B32', '2b7e151628aed2a6abf7158809cf4f3c')).toBe(
      '3243F6A8885A308D313198A2E0370734',
    );
  });
});

describe('AES round-trips', () => {
  it('encrypt∘decrypt is identity', () => {
    const key = 'cafebabedeadbeef0011223344556677';
    for (const pt of [
      '00000000000000000000000000000000',
      'ffffffffffffffffffffffffffffffff',
      '0f1e2d3c4b5a69788796a5b4c3d2e1f0',
    ]) {
      expect(dec(enc(pt, key), key)).toBe(pt.toUpperCase());
    }
  });
});

describe('AES validation', () => {
  it('rejects non-32-hex data or key', () => {
    expect(run('abc', { key: '000102030405060708090a0b0c0d0e0f' }, 'encrypt').error).toBeDefined();
    expect(run('00112233445566778899aabbccddeeff', { key: 'short' }, 'encrypt').error?.paramKey).toBe('key');
  });
  it('ignores whitespace in the hex', () => {
    expect(enc('0011 2233 4455 6677 8899 aabb ccdd eeff', '00010203 04050607 08090a0b 0c0d0e0f')).toBe(
      '69C4E0D86A7B0430D8CDB78070B4C55A',
    );
  });
});
