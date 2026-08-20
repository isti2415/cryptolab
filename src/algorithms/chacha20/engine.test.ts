import { describe, expect, it } from 'vitest';
import { block, run } from './engine';

const hexBytes = (s: string) => {
  const clean = s.replace(/[\s:]/g, '');
  const out: number[] = [];
  for (let i = 0; i < clean.length; i += 2) out.push(parseInt(clean.slice(i, i + 2), 16));
  return out;
};
const toHex = (b: number[]) => b.map((x) => x.toString(16).padStart(2, '0')).join('');

const KEY = '000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f';

/** RFC 8439 section 2.4.2 expected ciphertext. */
const RFC_2_4_2 =
  '6e2e359a2568f98041ba0728dd0d6981e97e7aec1d4360c20a27afccfd9fae0b' +
  'f91b65c5524733ab8f593dabcd62b3571639d624e65152ab8f530c359f0861d8' +
  '07ca0dbf500d6a6156a38e088a22b65e52bc514d16ccf806818ce91ab7793736' +
  '5af90bbf74a35be6b40b8eedf2785e42874d';

describe('ChaCha20 RFC 8439 block function', () => {
  it('section 2.3.2: the keystream block for counter 1', () => {
    const ks = block(hexBytes(KEY), 1, hexBytes('000000090000004a00000000'));
    expect(toHex(ks)).toBe(
      '10f1e7e4d13b5915500fdd1fa32071c4c7d1f4c733c068030422aa9ac3d46c4e' +
        'd2826446079faa0914c2d705d98b02a2b5129cd1de164eb9cbd083e8a2503c4e',
    );
  });

  it('section 2.4.2: encrypts the sunscreen plaintext', () => {
    const plaintext =
      "Ladies and Gentlemen of the class of '99: If I could offer you only one tip for the future, sunscreen would be it.";
    const r = run(
      plaintext,
      { key: KEY, nonce: '000000000000004a00000000', counter: 1 },
      'encrypt',
    );
    expect(r.output.toLowerCase()).toBe(RFC_2_4_2);
  });

  it('decrypts it back', () => {
    const r = run(
      RFC_2_4_2,
      { key: KEY, nonce: '000000000000004a00000000', counter: 1 },
      'decrypt',
    );
    expect(r.output).toBe(
      "Ladies and Gentlemen of the class of '99: If I could offer you only one tip for the future, sunscreen would be it.",
    );
  });
});

describe('ChaCha20 structure', () => {
  it('traces twenty rounds per 64-byte block', () => {
    const one = run('short', { key: KEY, nonce: '00'.repeat(12), counter: 0 }, 'encrypt');
    expect(one.steps.filter((s) => s.state.kind === 'round')).toHaveLength(20);

    const two = run('x'.repeat(100), { key: KEY, nonce: '00'.repeat(12), counter: 0 }, 'encrypt');
    expect(two.steps.filter((s) => s.state.kind === 'round')).toHaveLength(40);
  });

  it('the counter changes the keystream, the nonce changes it differently', () => {
    const a = toHex(block(hexBytes(KEY), 0, hexBytes('00'.repeat(12))));
    const b = toHex(block(hexBytes(KEY), 1, hexBytes('00'.repeat(12))));
    const c = toHex(block(hexBytes(KEY), 0, hexBytes('01' + '00'.repeat(11))));
    expect(a).not.toBe(b);
    expect(a).not.toBe(c);
    expect(b).not.toBe(c);
  });

  it('the first four words are always the ASCII constants', () => {
    const setup = run('x', { key: KEY, nonce: '00'.repeat(12), counter: 0 }, 'encrypt').steps[0];
    expect(setup.state.state.slice(0, 4)).toEqual([
      0x61707865, 0x3320646e, 0x79622d32, 0x6b206574,
    ]);
  });
});

describe('ChaCha20 validation', () => {
  it('rejects a key that is not 32 bytes', () => {
    expect(run('x', { key: 'aabb', nonce: '00'.repeat(12), counter: 0 }, 'encrypt').error?.paramKey).toBe('key');
  });
  it('rejects a nonce that is not 12 bytes', () => {
    expect(run('x', { key: KEY, nonce: 'aabb', counter: 0 }, 'encrypt').error?.paramKey).toBe('nonce');
  });
  it('rejects a negative counter', () => {
    expect(run('x', { key: KEY, nonce: '00'.repeat(12), counter: -1 }, 'encrypt').error?.paramKey).toBe('counter');
  });
});
