import { describe, expect, it } from 'vitest';
import { INITIAL_P, run } from './engine';

const enc = (block: string, key: string) => run(block, { key }, 'encrypt').output;
const dec = (block: string, key: string) => run(block, { key }, 'decrypt').output;

/** Schneier's published Blowfish test vectors. */
describe('Blowfish published vectors', () => {
  const vectors: [string, string, string][] = [
    ['0000000000000000', '0000000000000000', '4EF997456198DD78'],
    ['FFFFFFFFFFFFFFFF', 'FFFFFFFFFFFFFFFF', '51866FD5B85ECB8A'],
    ['1000000000000001', '3000000000000000', '7D856F9A613063F2'],
    ['1111111111111111', '1111111111111111', '2466DD878B963C9D'],
    ['1111111111111111', '0123456789ABCDEF', '61F9C3802281B096'],
    ['0123456789ABCDEF', 'FEDCBA9876543210', '0ACEAB0FC6A0A28D'],
    ['01A1D6D039776742', '7CA110454A1A6E57', '59C68245EB05282B'],
  ];

  for (const [plain, key, cipher] of vectors) {
    it(`key ${key} / block ${plain}`, () => {
      expect(enc(plain, key)).toBe(cipher);
    });
  }

  it('decrypts every vector back', () => {
    for (const [plain, key, cipher] of vectors) {
      expect(dec(cipher, key)).toBe(plain);
    }
  });
});

describe('Blowfish tables', () => {
  it('the P-array starts as the hex digits of π', () => {
    // π = 3.243F6A8885A308D313198A2E03707344…
    expect(INITIAL_P.slice(0, 4)).toEqual([
      0x243f6a88, 0x85a308d3, 0x13198a2e, 0x03707344,
    ]);
    expect(INITIAL_P).toHaveLength(18);
  });

  it('the key schedule runs 521 encryptions', () => {
    const r = run('0000000000000000', { key: '0000000000000000' }, 'encrypt');
    const last = r.steps.filter((s) => s.state.stage).at(-1)!;
    expect(last.state.stage!.progress).toBe(521);
  });

  it('different keys produce different S-boxes', () => {
    const a = run('0000000000000000', { key: '0000000000000000' }, 'encrypt').steps.at(-1)!;
    const b = run('0000000000000000', { key: 'FFFFFFFFFFFFFFFF' }, 'encrypt').steps.at(-1)!;
    expect(a.state.sSample[0]).not.toEqual(b.state.sSample[0]);
  });

  it('traces sixteen rounds', () => {
    const r = run('0123456789ABCDEF', { key: 'FEDCBA9876543210' }, 'encrypt');
    expect(r.steps.filter((s) => s.state.kind === 'round')).toHaveLength(16);
  });
});

describe('Blowfish validation', () => {
  it('rejects a key shorter than 4 bytes', () => {
    expect(run('0000000000000000', { key: 'AABB' }, 'encrypt').error?.paramKey).toBe('key');
  });
  it('rejects a key longer than 56 bytes', () => {
    expect(run('0000000000000000', { key: 'AA'.repeat(57) }, 'encrypt').error?.paramKey).toBe('key');
  });
  it('rejects a malformed block', () => {
    expect(run('xyz', { key: '0000000000000000' }, 'encrypt').error).toBeDefined();
  });
});
