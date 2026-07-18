import { describe, expect, it } from 'vitest';
import { run } from './engine';

const enc = (t: string, keyword: string) =>
  run(t, { keyword }, 'encrypt').output.replace(/ /g, '');
const dec = (t: string, keyword: string) =>
  run(t, { keyword }, 'decrypt').output.replace(/ /g, '');

describe('playfair classic vector (Wikipedia)', () => {
  const key = 'playfair example';
  it('HIDE THE GOLD... → BMODZBXDNABEKUDMUIXMMOUVIF', () => {
    expect(enc('Hide the gold in the tree stump', key)).toBe(
      'BMODZBXDNABEKUDMUIXMMOUVIF',
    );
  });
  it('decrypts to the padded plaintext stream', () => {
    // Decryption recovers the prepared (filler-padded) letters.
    expect(dec('BMODZBXDNABEKUDMUIXMMOUVIF', key)).toBe(
      'HIDETHEGOLDINTHETREXESTUMP',
    );
  });
});

describe('playfair digraph rules', () => {
  it('doubled letters are split by a filler', () => {
    // "BALLOON" -> BA LX LO ON
    const pairs = run('BALLOON', { keyword: 'MONARCHY' }, 'encrypt').steps
      .filter((s) => s.state.kind === 'pair')
      .map((s) => `${s.state.a}${s.state.b}`);
    expect(pairs).toEqual(['BA', 'LX', 'LO', 'ON']);
  });
  it('I and J are folded together', () => {
    expect(enc('JUMP', 'KEY')).toBe(enc('IUMP', 'KEY'));
  });
  it('odd-length messages get a trailing filler', () => {
    const pairs = run('CAT', { keyword: 'KEY' }, 'encrypt').steps
      .filter((s) => s.state.kind === 'pair')
      .map((s) => `${s.state.a}${s.state.b}`);
    expect(pairs).toEqual(['CA', 'TX']);
  });
});

describe('playfair validation', () => {
  it('rejects a letterless keyword', () => {
    const r = run('HELLO', { keyword: '123' }, 'encrypt');
    expect(r.error?.paramKey).toBe('keyword');
  });
});

describe('playfair consistency', () => {
  it('joined output pairs equal the returned output', () => {
    const r = run('Hide the gold', { keyword: 'playfair example' }, 'encrypt');
    const last = r.steps.at(-1)!.state;
    expect(last.outputPairs.join(' ')).toBe(r.output);
  });
});
