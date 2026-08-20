import { describe, expect, it } from 'vitest';
import { run, signAndVerify, toChunks } from './engine';

describe('WOTS+ chunking', () => {
  it('produces ten chunks: eight message and two checksum', () => {
    expect(toChunks('a1b2c3d4')).toHaveLength(10);
  });

  it('every chunk is a base-16 digit', () => {
    for (const digest of ['00000000', 'ffffffff', '0123abcd']) {
      for (const c of toChunks(digest)) {
        expect(c).toBeGreaterThanOrEqual(0);
        expect(c).toBeLessThan(16);
      }
    }
  });

  it('the checksum moves opposite to the message chunks', () => {
    // All-zero chunks means the maximum checksum; all-f means the minimum.
    const low = toChunks('00000000').slice(8);
    const high = toChunks('ffffffff').slice(8);
    const value = (c: number[]) => c[0] * 16 + c[1];
    expect(value(low)).toBeGreaterThan(value(high));
    expect(value(high)).toBe(0);
  });
});

describe('hash-based signatures', () => {
  it('verifies a signature it produced', () => {
    expect(signAndVerify('seed', 0, 'attack at dawn').valid).toBe(true);
  });

  it('verifies from every leaf of the tree', () => {
    for (let leaf = 0; leaf < 8; leaf++) {
      expect(signAndVerify('seed', leaf, `message ${leaf}`).valid).toBe(true);
    }
  });

  it('rejects a tampered message', () => {
    const r = signAndVerify('seed', 3, 'transfer 100', 'transfer 900');
    expect(r.valid).toBe(false);
    expect(r.computed).not.toBe(r.root);
  });

  it('every leaf signs under the same root', () => {
    const roots = new Set(
      Array.from({ length: 8 }, (_, leaf) => signAndVerify('seed', leaf, 'x').root),
    );
    expect(roots.size).toBe(1);
  });

  it('a different seed gives a different public key', () => {
    expect(signAndVerify('seed a', 0, 'x').root).not.toBe(
      signAndVerify('seed b', 0, 'x').root,
    );
  });
});

describe('walkthrough', () => {
  it('reports a valid signature', () => {
    expect(run('hello', { seed: 'seed', leaf: 0 }, 'encrypt').output).toContain('valid');
  });

  it('the decrypt direction demonstrates rejection', () => {
    const out = run('hello', { seed: 'seed', leaf: 0 }, 'decrypt').output;
    expect(out).toContain('invalid');
  });

  it('builds a tree of eight leaves and height three', () => {
    const s = run('hello', { seed: 'seed', leaf: 0 }, 'encrypt').steps[0].state;
    expect(s.levels[0]).toHaveLength(8);
    expect(s.levels).toHaveLength(4);
  });
});

describe('validation', () => {
  it('rejects a leaf index outside the tree', () => {
    expect(run('m', { seed: 's', leaf: 8 }, 'encrypt').error?.paramKey).toBe('leaf');
  });
  it('rejects an empty seed', () => {
    expect(run('m', { seed: '', leaf: 0 }, 'encrypt').error?.paramKey).toBe('seed');
  });
  it('rejects an empty message', () => {
    expect(run('', { seed: 's', leaf: 0 }, 'encrypt').error).toBeDefined();
  });
});
