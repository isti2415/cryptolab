import { describe, expect, it } from 'vitest';
import { pad, run, sha256Hex } from './engine';

const hash = (text: string) => run(text, {}, 'encrypt').output;
const bytes = (text: string) => [...new TextEncoder().encode(text)];

describe('SHA-256 NIST vectors', () => {
  it('the empty string', () => {
    expect(hash('')).toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    );
  });

  it('"abc"', () => {
    expect(hash('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });

  it('the 56-character two-block vector', () => {
    expect(hash('abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq')).toBe(
      '248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1',
    );
  });

  it('"The quick brown fox jumps over the lazy dog"', () => {
    expect(hash('The quick brown fox jumps over the lazy dog')).toBe(
      'd7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592',
    );
  });

  it('a million-character input is out of scope for the tracer but not the hash', () => {
    expect(sha256Hex(bytes('a'.repeat(1000)))).toBe(
      '41edece42d63e8d9bf515a9ba6932e1c20cbc9f5a5d134645adb5db1b9737ea3',
    );
  });
});

describe('SHA-256 padding', () => {
  it('always lands on a whole number of 512-bit blocks', () => {
    for (const n of [0, 1, 55, 56, 63, 64, 65, 119, 120]) {
      expect(pad(new Array(n).fill(0x61)).length % 64).toBe(0);
    }
  });

  it('a 55-byte message fits one block, 56 needs two', () => {
    expect(pad(new Array(55).fill(0x61)).length).toBe(64);
    expect(pad(new Array(56).fill(0x61)).length).toBe(128);
  });

  it('encodes the original bit length in the last eight bytes', () => {
    const padded = pad(bytes('abc'));
    expect(padded.slice(-8)).toEqual([0, 0, 0, 0, 0, 0, 0, 24]);
    expect(padded[3]).toBe(0x80);
  });
});

describe('SHA-256 behaviour', () => {
  it('changing one bit changes roughly half the digest bits', () => {
    const a = hash('avalanche');
    const b = hash('avalanchf');
    const differing = [...a].filter((ch, i) => ch !== b[i]).length;
    expect(differing).toBeGreaterThan(50);
  });

  it('traces 64 compression rounds per block', () => {
    const one = run('abc', {}, 'encrypt');
    expect(one.steps.filter((s) => s.state.kind === 'round')).toHaveLength(64);

    const two = run('a'.repeat(56), {}, 'encrypt');
    expect(two.steps.filter((s) => s.state.kind === 'round')).toHaveLength(128);
  });

  it('refuses inputs too long to trace, rather than hanging', () => {
    expect(run('x'.repeat(500), {}, 'encrypt').error).toBeDefined();
  });
});
