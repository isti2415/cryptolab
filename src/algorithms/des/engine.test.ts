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
  it('produces setup + IP + 16 rounds + final = 19 steps', () => {
    const r = run('0123456789ABCDEF', { key: '133457799BBCDFF1' }, 'encrypt');
    expect(r.steps).toHaveLength(19);
    expect(r.steps.filter((s) => s.state.kind === 'round')).toHaveLength(16);
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
