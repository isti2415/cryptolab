import { describe, expect, it } from 'vitest';
import { decodeState, encodeState } from './permalink';
import type { ParamSpec } from './types';

const specs: ParamSpec[] = [
  { key: 'shift', label: 'Shift', type: 'int', min: 0, max: 25, default: 3 },
  { key: 'keyword', label: 'Keyword', type: 'text', default: 'LEMON' },
  {
    key: 'mode',
    label: 'Mode',
    type: 'select',
    default: 'a',
    options: [
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B' },
    ],
  },
];
const sample = {
  input: 'The die is cast',
  params: { shift: 3, keyword: 'LEMON', mode: 'a' },
  direction: 'encrypt' as const,
};

describe('encodeState', () => {
  it('is empty for the sample, so a default page has a bare URL', () => {
    expect(
      encodeState(
        { input: sample.input, params: sample.params, direction: 'encrypt' },
        specs,
        sample,
      ),
    ).toBe('');
  });

  it('carries only what differs', () => {
    const q = encodeState(
      { input: 'HELLO', params: { ...sample.params, shift: 7 }, direction: 'encrypt' },
      specs,
      sample,
    );
    expect(q).toContain('i=HELLO');
    expect(q).toContain('p.shift=7');
    expect(q).not.toContain('p.keyword');
    expect(q).not.toContain('d=');
  });

  it('omits step 0 but keeps a real position', () => {
    const base = { input: sample.input, params: sample.params, direction: 'encrypt' as const };
    expect(encodeState({ ...base, step: 0 }, specs, sample)).toBe('');
    expect(encodeState({ ...base, step: 12 }, specs, sample)).toBe('?s=12');
  });
});

describe('encodeState explicit', () => {
  const base = {
    input: sample.input,
    params: sample.params,
    direction: 'encrypt' as const,
  };

  it('writes every field even when nothing differs from the sample', () => {
    // The Copy link case: a bare URL looks like the button did nothing, and
    // pins nothing if the sample is later reworded.
    const q = encodeState(base, specs, sample, 'explicit');
    expect(q).toContain('i=The+die+is+cast');
    expect(q).toContain('d=encrypt');
    expect(q).toContain('p.shift=3');
    expect(q).toContain('p.keyword=LEMON');
    expect(q).toContain('p.mode=a');
  });

  it('still round-trips', () => {
    const state = { ...base, params: { ...sample.params, shift: 9 }, step: 3 };
    expect(
      decodeState(encodeState(state, specs, sample, 'explicit'), specs, sample),
    ).toEqual(state);
  });

  it('survives the sample changing underneath it', () => {
    const link = encodeState(base, specs, sample, 'explicit');
    const reworded = { ...sample, input: 'A completely new default' };
    // Decoded against the NEW sample, the link still yields what was shared.
    expect(decodeState(link, specs, reworded).input).toBe('The die is cast');
    // Whereas the minimal form silently follows the new default.
    expect(
      decodeState(encodeState(base, specs, sample), specs, reworded).input,
    ).toBe('A completely new default');
  });

  it('leaves step 0 out, since it is the start of every trace', () => {
    expect(encodeState({ ...base, step: 0 }, specs, sample, 'explicit')).not.toContain('s=');
  });
});

describe('decodeState', () => {
  it('round-trips', () => {
    const state = {
      input: 'Attack at dawn',
      params: { shift: 11, keyword: 'ZEBRA', mode: 'b' },
      direction: 'decrypt' as const,
      step: 4,
    };
    expect(decodeState(encodeState(state, specs, sample), specs, sample)).toEqual(state);
  });

  it('falls back to the sample for anything absent', () => {
    expect(decodeState('', specs, sample)).toEqual({
      input: sample.input,
      params: sample.params,
      direction: 'encrypt',
      step: undefined,
    });
  });

  // A URL is untrusted: these are the cases that must not reach an engine.
  it('rejects an out-of-range int rather than clamping it', () => {
    expect(decodeState('?p.shift=99', specs, sample).params.shift).toBe(3);
    expect(decodeState('?p.shift=-4', specs, sample).params.shift).toBe(3);
  });

  it('rejects a non-numeric int instead of reading it as zero', () => {
    expect(decodeState('?p.shift=abc', specs, sample).params.shift).toBe(3);
    expect(decodeState('?p.shift=', specs, sample).params.shift).toBe(3);
    expect(decodeState('?p.shift=%20', specs, sample).params.shift).toBe(3);
  });

  it('rejects a select option that does not exist', () => {
    expect(decodeState('?p.mode=zzz', specs, sample).params.mode).toBe('a');
    expect(decodeState('?p.mode=b', specs, sample).params.mode).toBe('b');
  });

  it('rejects an unknown direction', () => {
    expect(decodeState('?d=sideways', specs, sample).direction).toBe('encrypt');
  });

  it('ignores parameters the algorithm never declared', () => {
    const out = decodeState('?p.nope=1&p.shift=5', specs, sample);
    expect(out.params).not.toHaveProperty('nope');
    expect(out.params.shift).toBe(5);
  });

  it('ignores a negative or non-numeric step', () => {
    expect(decodeState('?s=-1', specs, sample).step).toBeUndefined();
    expect(decodeState('?s=x', specs, sample).step).toBeUndefined();
  });

  it('preserves input that needs escaping', () => {
    const tricky = 'a&b=c d+e%f#g';
    const q = encodeState(
      { input: tricky, params: sample.params, direction: 'encrypt' },
      specs,
      sample,
    );
    expect(decodeState(q, specs, sample).input).toBe(tricky);
  });
});
