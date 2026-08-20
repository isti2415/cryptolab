import { describe, expect, it } from 'vitest';
import { run, sha3Hex, shakeBytes } from './engine';

const bytes = (t: string) => [...new TextEncoder().encode(t)];
const hash = (t: string, variant = 'sha3-256') => run(t, { variant }, 'encrypt').output;

describe('SHA-3 NIST vectors', () => {
  it('SHA3-256 of the empty string', () => {
    expect(hash('')).toBe(
      'a7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a',
    );
  });

  it('SHA3-256 of "abc"', () => {
    expect(hash('abc')).toBe(
      '3a985da74fe225b2045c172d6bd390bd855f086e3e9d525b46bfe24511431532',
    );
  });

  it('SHA3-512 of the empty string', () => {
    expect(hash('', 'sha3-512')).toBe(
      'a69f73cca23a9ac5c8b567dc185a756e97c982164fe25859e0d1dcc1475c80a6' +
        '15b2123af1f5f94c11e3e9402c3ac558f500199d95b6d3e301758586281dcd26',
    );
  });

  it('SHA3-512 of "abc"', () => {
    expect(hash('abc', 'sha3-512')).toBe(
      'b751850b1a57168a5693cd924b6b096e08f621827444f70d884f5d0240d2712e' +
        '10e116e9192af3c91a7ec57647e3934057340b4cf408d5a56592f8274eec53f0',
    );
  });

  it('SHAKE128 of the empty string, 32 bytes out', () => {
    expect(hash('', 'shake128')).toBe(
      '7f9c2ba4e88f827d616045507605853ed73b8093f6efbc88eb1a6eacfa66ef26',
    );
  });

  it('SHAKE256 of the empty string, 32 bytes out', () => {
    expect(hash('', 'shake256')).toBe(
      '46b9dd2b0ba88d13233b3feb743eeb243fcd52ea62b81b82b50c27646ed5762f',
    );
  });
});

describe('SHA-3 sponge structure', () => {
  it('rate plus capacity is always the 200-byte state', () => {
    for (const v of ['sha3-256', 'sha3-512', 'shake128', 'shake256']) {
      const s = run('x', { variant: v }, 'encrypt').steps[0].state;
      expect(s.rate + s.capacity).toBe(200);
    }
  });

  it('traces 96 permutation steps per absorbed block', () => {
    const one = run('abc', { variant: 'sha3-256' }, 'encrypt');
    expect(one.steps.filter((s) => s.state.kind === 'permute')).toHaveLength(96);
  });

  it('SHAKE is extendable; longer output is a prefix-stable extension', () => {
    const short = shakeBytes(bytes('abc'), 'shake128', 16);
    const long = shakeBytes(bytes('abc'), 'shake128', 64);
    expect(long.slice(0, 16)).toEqual(short);
  });

  it('domain separation keeps the variants apart on identical input', () => {
    expect(sha3Hex(bytes('abc'), 'sha3-256')).not.toBe(
      sha3Hex(bytes('abc'), 'shake256'),
    );
  });

  it('avalanches on a one-bit change', () => {
    const a = hash('avalanche');
    const b = hash('avalanchf');
    expect([...a].filter((c, i) => c !== b[i]).length).toBeGreaterThan(50);
  });
});

describe('SHA-3 validation', () => {
  it('refuses inputs too long to trace', () => {
    expect(run('x'.repeat(200), { variant: 'sha3-256' }, 'encrypt').error).toBeDefined();
  });
});
