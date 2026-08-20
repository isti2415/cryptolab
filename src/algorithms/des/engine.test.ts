import { describe, expect, it } from 'vitest';
import { run } from './engine';

const enc = (data: string, key: string) => run(data, { key }, 'encrypt').output;
const dec = (data: string, key: string) => run(data, { key }, 'decrypt').output;

describe('DES official known-answer vector', () => {
  // FIPS / classic DES test vector.
  it('key 133457799BBCDFF1, PT 0123456789ABCDEF → CT 85E813540F0AB405', () => {
    expect(enc('0123456789ABCDEF', '133457799BBCDFF1')).toBe('85E813540F0AB405');
  });
  it('decrypts back to plaintext', () => {
    expect(dec('85E813540F0AB405', '133457799BBCDFF1')).toBe('0123456789ABCDEF');
  });

  // A second independent vector (all-zero key/data is a known weak-key case).
  it('key 0E329232EA6D0D73, PT 8787878787878787 → 0000000000000000', () => {
    expect(enc('8787878787878787', '0E329232EA6D0D73')).toBe('0000000000000000');
    expect(dec('0000000000000000', '0E329232EA6D0D73')).toBe('8787878787878787');
  });
});

describe('DES round-trips', () => {
  it('encrypt∘decrypt is identity for several blocks', () => {
    const key = 'AABB09182736CCDD';
    for (const pt of ['0000000000000000', 'FFFFFFFFFFFFFFFF', 'DEADBEEFCAFEBABE', '1234567890ABCDEF']) {
      expect(dec(enc(pt, key), key)).toBe(pt);
    }
  });
});

describe('DES structure', () => {
  it('traces the key schedule, the permutations and every Feistel sub-step', () => {
    const r = run('0123456789ABCDEF', { key: '133457799BBCDFF1' }, 'encrypt');
    const kinds = (k: string) => r.steps.filter((s) => s.state.kind === k).length;

    // setup + PC-1 + 16 subkeys + IP + 16×(expand, xor, sbox, mix) + FP
    expect(r.steps).toHaveLength(1 + 1 + 16 + 1 + 64 + 1);
    expect(kinds('subkey')).toBe(16);
    expect(kinds('expand')).toBe(16);
    expect(kinds('xor')).toBe(16);
    expect(kinds('sbox')).toBe(16);
    expect(kinds('mix')).toBe(16);
  });

  it('exposes the real PC-1 output, dropping the eight parity bits', () => {
    const r = run('0123456789ABCDEF', { key: '133457799BBCDFF1' }, 'encrypt');
    const pc1 = r.steps.find((s) => s.state.kind === 'pc1')!;
    expect(pc1.state.permutation?.output).toHaveLength(56);
    expect(pc1.state.permutation?.dropped).toEqual([7, 15, 23, 31, 39, 47, 55, 63]);
  });

  it('S-box lookups use outer bits for the row and inner bits for the column', () => {
    const r = run('0123456789ABCDEF', { key: '133457799BBCDFF1' }, 'encrypt');
    const sbox = r.steps.find((s) => s.state.kind === 'sbox')!;
    const boxes = sbox.state.feistel!.boxes;
    expect(boxes).toHaveLength(8);
    for (const b of boxes) {
      const [b0, b1, b2, b3, b4, b5] = b.inBits;
      expect(b.row).toBe((b0 << 1) | b5);
      expect(b.col).toBe((b1 << 3) | (b2 << 2) | (b3 << 1) | b4);
    }
  });
  it('derives 16 subkeys, reversed for decryption', () => {
    const e = run('0123456789ABCDEF', { key: '133457799BBCDFF1' }, 'encrypt');
    const d = run('85E813540F0AB405', { key: '133457799BBCDFF1' }, 'decrypt');
    expect(e.steps[0].state.allSubkeys).toEqual([...d.steps[0].state.allSubkeys].reverse());
  });
});

describe('DES validation', () => {
  it('rejects non-16-hex data', () => {
    expect(run('123', { key: '133457799BBCDFF1' }, 'encrypt').error).toBeDefined();
    expect(run('XYZ0123456789ABC', { key: '133457799BBCDFF1' }, 'encrypt').error).toBeDefined();
  });
  it('rejects a bad key', () => {
    const r = run('0123456789ABCDEF', { key: 'zzzz' }, 'encrypt');
    expect(r.error?.paramKey).toBe('key');
  });
  it('tolerates spaces in the hex input', () => {
    expect(enc('0123 4567 89AB CDEF', '1334 5779 9BBC DFF1')).toBe('85E813540F0AB405');
  });
});
