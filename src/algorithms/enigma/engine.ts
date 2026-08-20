/**
 * Enigma (Wehrmacht M3).
 *
 * A polyalphabetic substitution machine. Every keypress steps the rotors before
 * the current flows, so the substitution alphabet changes with each letter and
 * never repeats until the whole rotor assembly comes back around, 16,900
 * positions for three rotors.
 *
 * The reflector is what made it usable and what broke it. Sending the current
 * back through the rotors means encryption and decryption are the same
 * operation: set the machine identically and type the ciphertext to recover the
 * plaintext. It also means no letter can ever encrypt to itself, and that single
 * fact is the crib that Bletchley Park built its attack on.
 */

import type { AlgorithmResult, Direction, Params, Step } from '@/core/types';

const A = 'A'.charCodeAt(0);
const idx = (ch: string) => ch.charCodeAt(0) - A;
const chr = (i: number) => String.fromCharCode(A + ((i % 26) + 26) % 26);

export interface RotorSpec {
  id: string;
  wiring: string;
  /** The letter showing in the window when this rotor steps the next one. */
  notch: string;
}

export const ROTORS: RotorSpec[] = [
  { id: 'I', wiring: 'EKMFLGDQVZNTOWYHXUSPAIBRCJ', notch: 'Q' },
  { id: 'II', wiring: 'AJDKSIRUXBLHWTMCQGZNPYFVOE', notch: 'E' },
  { id: 'III', wiring: 'BDFHJLCPRTXVZNYEIWGAKMUSQO', notch: 'V' },
  { id: 'IV', wiring: 'ESOVPZJAYQUIRHXLNFTGKDCMWB', notch: 'J' },
  { id: 'V', wiring: 'VZBRGITYUPSDNHLXAWMJQOFECK', notch: 'Z' },
];

export const REFLECTORS: Record<string, string> = {
  B: 'YRUHQSLDPXNGOKMIEBFZCWVJAT',
  C: 'FVPJIAOYEDRZXWGCTKUQSBNMHL',
};

/** One leg of the current's journey, for the path display. */
export interface Hop {
  stage: string;
  from: string;
  to: string;
}

export interface EnigmaStepState {
  kind: 'setup' | 'letter' | 'skipped';
  rotorIds: string[];
  /** Window letters, left to right. */
  positions: string[];
  ringSettings: string[];
  reflector: string;
  plugboard: [string, string][];
  input: string;
  outputSoFar: string;
  pos: number;
  inChar?: string;
  outChar?: string;
  hops?: Hop[];
  /** Which rotors advanced before this letter, left to right. */
  stepped?: boolean[];
  doubleStep?: boolean;
}

function parsePlugboard(raw: string): { pairs: [string, string][]; error?: string } {
  const tokens = raw.toUpperCase().split(/[\s,]+/).filter(Boolean);
  const pairs: [string, string][] = [];
  const used = new Set<string>();
  for (const t of tokens) {
    if (!/^[A-Z]{2}$/.test(t)) {
      return { pairs, error: `“${t}” is not a letter pair. Write pairs like "AB CD EF".` };
    }
    const [x, y] = [t[0], t[1]];
    if (x === y) return { pairs, error: `“${t}” connects a letter to itself.` };
    if (used.has(x) || used.has(y)) {
      return { pairs, error: `“${t}” reuses a letter already plugged elsewhere.` };
    }
    used.add(x);
    used.add(y);
    pairs.push([x, y]);
  }
  if (pairs.length > 13) return { pairs, error: 'At most 13 plugboard pairs are possible.' };
  return { pairs };
}

const plug = (pairs: [string, string][], ch: string) => {
  for (const [x, y] of pairs) {
    if (ch === x) return y;
    if (ch === y) return x;
  }
  return ch;
};

/** Right-to-left through one rotor, accounting for its position and ring setting. */
function forward(spec: RotorSpec, position: number, ring: number, c: number): number {
  const shift = position - ring;
  return (idx(spec.wiring[(((c + shift) % 26) + 26) % 26]) - shift + 52) % 26;
}

/** Left-to-right: the same wiring read backwards. */
function backward(spec: RotorSpec, position: number, ring: number, c: number): number {
  const shift = position - ring;
  const target = chr(c + shift);
  return (spec.wiring.indexOf(target) - shift + 52) % 26;
}

export function run(
  input: string,
  params: Params,
  _direction: Direction,
): AlgorithmResult<EnigmaStepState> {
  const ids = String(params.rotors ?? 'I II III').toUpperCase().split(/[\s,]+/).filter(Boolean);
  if (ids.length !== 3) {
    return { output: '', steps: [], error: { paramKey: 'rotors', message: 'Choose exactly three rotors, e.g. "I II III", leftmost first.' } };
  }
  const specs = ids.map((id) => ROTORS.find((r) => r.id === id));
  if (specs.some((s) => !s)) {
    return { output: '', steps: [], error: { paramKey: 'rotors', message: `Rotors are I to V. Got “${ids.join(' ')}”.` } };
  }
  if (new Set(ids).size !== 3) {
    return { output: '', steps: [], error: { paramKey: 'rotors', message: 'A rotor cannot be fitted twice; the machine has three slots and each takes a different rotor.' } };
  }

  const reflectorId = String(params.reflector ?? 'B').toUpperCase();
  const reflector = REFLECTORS[reflectorId];
  if (!reflector) {
    return { output: '', steps: [], error: { paramKey: 'reflector', message: 'The reflector must be B or C.' } };
  }

  /** Three letters, or null. */
  const clean = (raw: unknown) => {
    const v = String(raw ?? '').toUpperCase().replace(/[^A-Z]/g, '');
    return v.length === 3 ? v : null;
  };
  const startRaw = clean(params.positions);
  if (!startRaw) {
    return { output: '', steps: [], error: { paramKey: 'positions', message: 'Give three letters for the rotor windows, e.g. "AAA".' } };
  }
  const ringRaw = clean(params.rings);
  if (!ringRaw) {
    return { output: '', steps: [], error: { paramKey: 'rings', message: 'Give three letters for the ring settings, e.g. "AAA".' } };
  }

  const { pairs, error: plugError } = parsePlugboard(String(params.plugboard ?? ''));
  if (plugError) {
    return { output: '', steps: [], error: { paramKey: 'plugboard', message: plugError } };
  }

  const rotors = specs as RotorSpec[];
  const positions = [...startRaw].map(idx);
  const rings = [...ringRaw].map(idx);

  const steps: Step<EnigmaStepState>[] = [];
  const base = {
    rotorIds: ids,
    ringSettings: [...ringRaw],
    reflector: reflectorId,
    plugboard: pairs,
    input,
  };

  let out = '';

  steps.push({
    id: 'setup',
    title: `Rotors ${ids.join('-')}, reflector ${reflectorId}, windows ${startRaw}`,
    description: `The daily key is the rotor choice and order, their ring settings, the plugboard pairs and the starting window letters. Encryption and decryption are the same operation; set another machine identically and type the ciphertext back in.`,
    phase: 'Setup',
    state: {
      ...base,
      kind: 'setup',
      positions: positions.map(chr),
      outputSoFar: '',
      pos: -1,
    },
  });

  for (let p = 0; p < input.length; p++) {
    const raw = input[p];
    if (!/[a-zA-Z]/.test(raw)) {
      out += raw;
      steps.push({
        id: `s${p}`,
        title: `“${raw === ' ' ? '␣': raw}”, not typed`,
        description: 'The machine had 26 keys and nothing else. Spaces and punctuation were spelled out or dropped by the operator before enciphering.',
        phase: 'Typing',
        state: { ...base, kind: 'skipped', positions: positions.map(chr), outputSoFar: out, pos: p },
      });
      continue;
    }

    /*
     * Stepping happens before the current flows, and includes the double-step
     * anomaly: if the middle rotor is sitting on its own notch it advances
     * again on the next keypress, carrying the left rotor with it. That quirk
     * of the pawl mechanism reduced the period from 26³ to 26×25×26.
     */
    const atNotch = (i: number) => chr(positions[i]) === rotors[i].notch;
    const middleAtNotch = atNotch(1);
    const rightAtNotch = atNotch(2);
    const stepped = [false, false, true];

    if (middleAtNotch) {
      positions[0] = (positions[0] + 1) % 26;
      positions[1] = (positions[1] + 1) % 26;
      stepped[0] = true;
      stepped[1] = true;
    } else if (rightAtNotch) {
      positions[1] = (positions[1] + 1) % 26;
      stepped[1] = true;
    }
    positions[2] = (positions[2] + 1) % 26;

    const upper = raw.toUpperCase();
    const hops: Hop[] = [];

    let c = idx(upper);
    const afterPlug = plug(pairs, upper);
    hops.push({ stage: 'plugboard', from: upper, to: afterPlug });
    c = idx(afterPlug);

    for (let r = 2; r >= 0; r--) {
      const before = chr(c);
      c = forward(rotors[r], positions[r], rings[r], c);
      hops.push({ stage: `rotor ${rotors[r].id}`, from: before, to: chr(c) });
    }

    const beforeReflector = chr(c);
    c = idx(reflector[c]);
    hops.push({ stage: `reflector ${reflectorId}`, from: beforeReflector, to: chr(c) });

    for (let r = 0; r < 3; r++) {
      const before = chr(c);
      c = backward(rotors[r], positions[r], rings[r], c);
      hops.push({ stage: `rotor ${rotors[r].id} back`, from: before, to: chr(c) });
    }

    const beforeOutPlug = chr(c);
    const outChar = plug(pairs, beforeOutPlug);
    hops.push({ stage: 'plugboard', from: beforeOutPlug, to: outChar });

    out += outChar;

    steps.push({
      id: `c${p}`,
      title: `${upper} → ${outChar}`,
      description: `The rotors step first, then the current runs right to left through them, hits the reflector, and comes back through a different path. ${middleAtNotch ? 'The middle rotor was on its notch, so it double-stepped and carried the left rotor with it. ' : ''}Because the reflector pairs letters, ${upper} could never come out as ${upper}.`,
      phase: 'Typing',
      state: {
        ...base,
        kind: 'letter',
        positions: positions.map(chr),
        outputSoFar: out,
        pos: p,
        inChar: upper,
        outChar,
        hops,
        stepped,
        doubleStep: middleAtNotch,
      },
    });
  }

  return { output: out, steps };
}
