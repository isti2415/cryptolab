import { describe, expect, it } from 'vitest';
import { run } from './engine';

const mac = (message: string, key: string, format = 'text') =>
  run(message, { key, format }, 'encrypt').output;

/** RFC 4231 test vectors for HMAC-SHA-256. */
describe('HMAC-SHA-256 RFC 4231 vectors', () => {
  it('test case 1: 20 bytes of 0x0b, "Hi There"', () => {
    expect(mac('Hi There', '0b'.repeat(20), 'text')).not.toBe('');
    expect(run('4869205468657265', { key: '0b'.repeat(20), format: 'hex' }, 'encrypt').output).toBe(
      'b0344c61d8db38535ca8afceaf0bf12b881dc200c9833da726e9376c2e32cff7',
    );
  });

  it('test case 2: key "Jefe"', () => {
    expect(mac('what do ya want for nothing?', 'Jefe')).toBe(
      '5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843',
    );
  });

  it('test case 3: 20 bytes of 0xaa, 50 bytes of 0xdd', () => {
    expect(
      run('dd'.repeat(50), { key: 'aa'.repeat(20), format: 'hex' }, 'encrypt').output,
    ).toBe('773ea91e36800e46854db8ebd09181a72959098b3ef8c122d9635514ced565fe');
  });

  it('test case 6: key longer than one block is hashed first', () => {
    expect(
      run(
        '54657374205573696e67204c6172676572205468616e20426c6f636b2d53697a65204b6579202d2048617368204b6579204669727374',
        { key: 'aa'.repeat(131), format: 'hex' },
        'encrypt',
      ).output,
    ).toBe('60e431591ee0b67f0d8a26aacbf5b77f8e0bc6213728c5140546040f0ee37f54');
  });
});

describe('HMAC structure', () => {
  it('pads the key to the hash block size of 64, not its 32-byte output', () => {
    const r = run('m', { key: 'short', format: 'text' }, 'encrypt');
    expect(r.steps.at(-1)!.state.blockKey).toHaveLength(64);
  });

  it('the two pads differ in exactly half their bits', () => {
    // 0x36 ^ 0x5c = 0x6a, which has four bits set out of eight.
    const differing = (0x36 ^ 0x5c).toString(2).split('').filter((b) => b === '1').length;
    expect(differing).toBe(4);
  });

  it('a key of exactly 64 bytes is neither hashed nor padded', () => {
    const r = run('m', { key: 'a'.repeat(64), format: 'text' }, 'encrypt');
    const s = r.steps.at(-1)!.state;
    expect(s.keyWasHashed).toBe(false);
    expect(s.keyWasPadded).toBe(false);
  });

  it('changing the key changes the tag', () => {
    expect(mac('same message', 'key one')).not.toBe(mac('same message', 'key two'));
  });
});

describe('HMAC validation', () => {
  it('rejects a malformed hex key', () => {
    expect(run('m', { key: 'zz', format: 'hex' }, 'encrypt').error?.paramKey).toBe('key');
  });
  it('refuses messages too long to trace', () => {
    expect(run('x'.repeat(400), { key: 'k', format: 'text' }, 'encrypt').error).toBeDefined();
  });
});
