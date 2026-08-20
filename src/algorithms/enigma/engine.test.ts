import { describe, expect, it } from 'vitest';
import { run } from './engine';

const enigma = (text: string, over: Record<string, string> = {}) =>
  run(
    text,
    {
      rotors: 'I II III',
      reflector: 'B',
      positions: 'AAA',
      rings: 'AAA',
      plugboard: '',
      ...over,
    },
    'encrypt',
  ).output;

describe('Enigma known behaviour', () => {
  it('rotors I-II-III at AAA turns AAAAA into BDZGO', () => {
    expect(enigma('AAAAA')).toBe('BDZGO');
  });

  it('continues the same run to 26 letters', () => {
    // The standard extended check for this configuration.
    expect(enigma('A'.repeat(26))).toBe('BDZGOWCXLTKSBTMCDLPBMUQOFX');
  });

  it('is its own inverse; the reflector makes encryption symmetric', () => {
    const cipher = enigma('ATTACKATDAWN');
    expect(enigma(cipher)).toBe('ATTACKATDAWN');
  });

  it('no letter ever encrypts to itself', () => {
    const plain = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.repeat(4);
    const cipher = enigma(plain);
    for (let i = 0; i < plain.length; i++) {
      expect(cipher[i]).not.toBe(plain[i]);
    }
  });

  it('the plugboard is an involution and stays self-inverse', () => {
    const cipher = enigma('ATTACKATDAWN', { plugboard: 'AV BS CG DL FU HZ IN KM OW RX' });
    expect(enigma(cipher, { plugboard: 'AV BS CG DL FU HZ IN KM OW RX' })).toBe(
      'ATTACKATDAWN',
    );
    expect(cipher).not.toBe(enigma('ATTACKATDAWN'));
  });
});

describe('Enigma rotor stepping', () => {
  it('the right rotor advances on every keypress', () => {
    const r = run('AAAA', { rotors: 'I II III', reflector: 'B', positions: 'AAA', rings: 'AAA', plugboard: '' }, 'encrypt');
    const letters = r.steps.filter((s) => s.state.kind === 'letter');
    expect(letters.map((s) => s.state.positions[2])).toEqual(['B', 'C', 'D', 'E']);
  });

  it('double-steps the middle rotor when it sits on its notch', () => {
    // Rotor II notches at E; starting the middle rotor at D reaches it quickly.
    const r = run('AAAA', { rotors: 'I II III', reflector: 'B', positions: 'ADU', rings: 'AAA', plugboard: '' }, 'encrypt');
    const letters = r.steps.filter((s) => s.state.kind === 'letter');
    const windows = letters.map((s) => s.state.positions.join(''));
    expect(windows).toEqual(['ADV', 'AEW', 'BFX', 'BFY']);
    expect(letters[2].state.doubleStep).toBe(true);
  });
});

describe('Enigma validation', () => {
  it('rejects a repeated rotor', () => {
    expect(run('A', { rotors: 'I I III', reflector: 'B', positions: 'AAA', rings: 'AAA', plugboard: '' }, 'encrypt').error?.paramKey).toBe('rotors');
  });
  it('rejects an unknown reflector', () => {
    expect(run('A', { rotors: 'I II III', reflector: 'D', positions: 'AAA', rings: 'AAA', plugboard: '' }, 'encrypt').error?.paramKey).toBe('reflector');
  });
  it('rejects a plugboard letter used twice', () => {
    expect(run('A', { rotors: 'I II III', reflector: 'B', positions: 'AAA', rings: 'AAA', plugboard: 'AB AC' }, 'encrypt').error?.paramKey).toBe('plugboard');
  });
});
