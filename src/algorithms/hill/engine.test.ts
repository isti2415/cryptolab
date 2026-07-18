import { describe, expect, it } from 'vitest';
import { run } from './engine';

const enc = (t: string, key: string) => run(t, { key }, 'encrypt').output;
const dec = (t: string, key: string) => run(t, { key }, 'decrypt').output;

describe('hill 2x2 known-answer vectors', () => {
  const KEY = '3 3 2 5'; // [[3,3],[2,5]], det=9 (coprime with 26)
  it('HI → TC with [[3,3],[2,5]]', () => {
    // H=7,I=8: (3·7+3·8)=45=19=T, (2·7+5·8)=54=2=C
    expect(enc('HI', KEY)).toBe('TC');
  });
  it('pads odd-length input with X', () => {
    // "ACT" -> AC, TX
    const r = run('ACT', { key: KEY }, 'encrypt');
    expect(r.steps.filter((s) => s.state.kind === 'block').map((s) => s.state.inChars)).toEqual([
      'AC',
      'TX',
    ]);
  });
  it('decrypts back to the padded plaintext', () => {
    expect(dec(enc('HELP', KEY), KEY)).toBe('HELP');
    expect(dec(enc('HI', KEY), KEY)).toBe('HI');
  });
});

describe('hill round-trips over several valid keys', () => {
  const keys = ['3 3 2 5', '1 2 3 5', '5 8 17 3', '7 8 11 11'];
  it('encrypt∘decrypt recovers the padded message', () => {
    const text = 'MEETMEHERE';
    for (const k of keys) {
      const e = enc(text, k);
      expect(e.length % 2).toBe(0);
      expect(dec(e, k)).toBe(text);
    }
  });
});

describe('hill validation', () => {
  it('rejects a non-invertible matrix (det shares a factor with 26)', () => {
    // [[2,4],[6,8]] det = 16-24=-8=18 (even, shares factor 2)
    const r = run('HI', { key: '2 4 6 8' }, 'encrypt');
    expect(r.error?.paramKey).toBe('key');
    expect(r.output).toBe('');
  });
  it('rejects a key that is not four numbers', () => {
    expect(run('HI', { key: '1 2 3' }, 'encrypt').error).toBeDefined();
    expect(run('HI', { key: 'abc' }, 'encrypt').error).toBeDefined();
  });
});

describe('hill consistency', () => {
  it('joined output blocks equal the returned output', () => {
    const r = run('Attack now', { key: '3 3 2 5' }, 'encrypt');
    expect(r.steps.at(-1)!.state.outputBlocks.join('')).toBe(r.output);
  });
});
