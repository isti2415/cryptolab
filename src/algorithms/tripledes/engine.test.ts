import { describe, expect, it } from 'vitest';
import { run as desRun } from '@/algorithms/des/engine';
import { run } from './engine';

const enc = (block: string, key: string) => run(block, { key }, 'encrypt').output;
const dec = (block: string, key: string) => run(block, { key }, 'decrypt').output;
const des = (block: string, key: string) => desRun(block, { key }, 'encrypt').output;

const K1 = '133457799BBCDFF1';
const K2 = '0E329232EA6D0D73';
const K3 = 'AABB09182736CCDD';
const BLOCK = '0123456789ABCDEF';

/*
 * Triple DES has no independent constant to check against; it is DES composed
 * with itself, and DES is already pinned to the FIPS vector. What can be
 * checked independently are the structural identities the EDE ordering was
 * chosen to satisfy, and they pin the composition exactly.
 */
describe('Triple DES reduces to single DES where it must', () => {
  it('collapses to single DES when all three keys are equal', () => {
    expect(enc(BLOCK, K1 + K1 + K1)).toBe(des(BLOCK, K1));
    expect(des(BLOCK, K1)).toBe('85E813540F0AB405');
  });

  it('collapses when K2 = K3, because the last two passes cancel', () => {
    expect(enc(BLOCK, K1 + K2 + K2)).toBe(des(BLOCK, K1));
  });

  it('two-key mode reuses K1 as K3', () => {
    expect(enc(BLOCK, K1 + K2)).toBe(enc(BLOCK, K1 + K2 + K1));
  });

  it('does not collapse with three independent keys', () => {
    expect(enc(BLOCK, K1 + K2 + K3)).not.toBe(des(BLOCK, K1));
  });
});

describe('Triple DES round-trips', () => {
  it('decrypts three-key ciphertext', () => {
    expect(dec(enc(BLOCK, K1 + K2 + K3), K1 + K2 + K3)).toBe(BLOCK);
  });

  it('decrypts two-key ciphertext', () => {
    for (const block of ['0000000000000000', 'FFFFFFFFFFFFFFFF', 'DEADBEEFCAFEBABE']) {
      expect(dec(enc(block, K1 + K2), K1 + K2)).toBe(block);
    }
  });
});

describe('Triple DES structure', () => {
  it('runs three passes in E, D, E order when encrypting', () => {
    const r = run(BLOCK, { key: K1 + K2 + K3 }, 'encrypt');
    const passes = r.steps.at(-1)!.state.passes;
    expect(passes.map((p) => p.op)).toEqual(['E', 'D', 'E']);
    expect(passes.map((p) => p.keyName)).toEqual(['K1', 'K2', 'K3']);
  });

  it('reverses both the order and each operation when decrypting', () => {
    const r = run(BLOCK, { key: K1 + K2 + K3 }, 'decrypt');
    const passes = r.steps.at(-1)!.state.passes;
    expect(passes.map((p) => p.op)).toEqual(['D', 'E', 'D']);
    expect(passes.map((p) => p.keyName)).toEqual(['K3', 'K2', 'K1']);
  });

  it('chains each pass into the next', () => {
    const passes = run(BLOCK, { key: K1 + K2 + K3 }, 'encrypt').steps.at(-1)!.state.passes;
    expect(passes[0].inputHex).toBe(BLOCK);
    expect(passes[1].inputHex).toBe(passes[0].outputHex);
    expect(passes[2].inputHex).toBe(passes[1].outputHex);
  });

  it('flags the all-equal-keys configuration as degenerate', () => {
    expect(run(BLOCK, { key: K1 + K1 + K1 }, 'encrypt').steps[0].state.degenerate).toBe(true);
    expect(run(BLOCK, { key: K1 + K2 + K3 }, 'encrypt').steps[0].state.degenerate).toBe(false);
  });
});

describe('Triple DES validation', () => {
  it('rejects a key that is not 32 or 48 hex digits', () => {
    expect(run(BLOCK, { key: K1 }, 'encrypt').error?.paramKey).toBe('key');
  });
  it('rejects a bad block', () => {
    expect(run('abc', { key: K1 + K2 }, 'encrypt').error).toBeDefined();
  });
});
