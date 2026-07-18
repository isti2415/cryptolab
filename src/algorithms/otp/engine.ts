/**
 * One-Time Pad engine (letter / mod-26 formulation).
 *
 * The pad is a random sequence of letters at least as long as the message and
 * never reused. Each plaintext letter is combined with the next pad letter:
 *   Encrypt: cᵢ = (pᵢ + padᵢ) mod 26.   Decrypt: pᵢ = (cᵢ − padᵢ) mod 26.
 *
 * Unlike Vigenère the pad is NOT repeated — if it is truly random, as long as
 * the message, and used only once, the result is information-theoretically
 * unbreakable. We enforce the length requirement; randomness and single-use are
 * the operator's responsibility (and explained in the content).
 */

import {
  ALPHABET_SIZE,
  indexToLetter,
  isLetter,
  isUpperCase,
  letterToIndex,
  mod,
} from '@/core/math';
import type { AlgorithmResult, Direction, Params, Step } from '@/core/types';

export type OtpStepKind = 'setup' | 'char' | 'passthrough';

export interface OtpStepState {
  kind: OtpStepKind;
  direction: Direction;
  input: string;
  padStream: string;
  outputSoFar: string;
  pos: number;
  fromIndex?: number;
  toIndex?: number;
  shift?: number;
  padChar?: string;
  fromChar?: string;
  toChar?: string;
}

function cleanPad(raw: unknown): string {
  return String(raw ?? '')
    .toUpperCase()
    .replace(/[^A-Z]/g, '');
}

export function run(
  input: string,
  params: Params,
  direction: Direction,
): AlgorithmResult<OtpStepState> {
  const pad = cleanPad(params.pad);
  const neededLetters = [...input].filter(isLetter).length;

  if (neededLetters === 0 && input.length === 0) {
    // Empty message: nothing to do, but still a valid (trivial) case.
  } else if (pad.length < neededLetters) {
    return {
      output: '',
      steps: [],
      error: {
        paramKey: 'pad',
        message: `The pad has ${pad.length} letter${pad.length === 1 ? '' : 's'} but the message needs ${neededLetters}. A one-time pad must be at least as long as the message.`,
      },
    };
  }

  // Build the aligned pad stream (pad letter under each input letter position).
  let pi = 0;
  const padArr: string[] = [];
  for (const ch of input) {
    if (isLetter(ch)) {
      padArr.push(pad[pi]);
      pi++;
    } else {
      padArr.push(' ');
    }
  }
  const padStream = padArr.join('');

  const steps: Step<OtpStepState>[] = [];
  const base = { direction, input, padStream };
  let out = '';

  steps.push({
    id: 'setup',
    title: `Pad supplies one fresh letter per message letter`,
    description:
      direction === 'encrypt'
        ? `Each plaintext letter is added (mod 26) to the next unused pad letter. The pad is consumed left to right and never reused.`
        : `Each ciphertext letter has its pad letter subtracted (mod 26) to recover the plaintext. Same pad, opposite operation.`,
    phase: 'Setup',
    state: { ...base, kind: 'setup', outputSoFar: '', pos: -1 },
  });

  let padPos = 0;
  for (let pos = 0; pos < input.length; pos++) {
    const ch = input[pos];

    if (!isLetter(ch)) {
      out += ch;
      steps.push({
        id: `p${pos}`,
        title: `“${ch === ' ' ? '␣' : ch}” — kept as-is`,
        description: 'Non-letters pass through and do not consume pad.',
        phase: 'Transform',
        state: { ...base, kind: 'passthrough', outputSoFar: out, pos },
      });
      continue;
    }

    const padChar = pad[padPos];
    const rawShift = letterToIndex(padChar);
    const shift = direction === 'encrypt' ? rawShift : -rawShift;
    const upper = isUpperCase(ch);
    const x = letterToIndex(ch);
    const y = mod(x + shift, ALPHABET_SIZE);
    const outChar = upper ? indexToLetter(y) : indexToLetter(y).toLowerCase();
    out += outChar;

    const sign = direction === 'encrypt' ? '+' : '−';
    steps.push({
      id: `c${pos}`,
      title: `${ch} ${sign} ${padChar}(${rawShift}) → ${indexToLetter(y)}`,
      description: `Pad letter ${padChar} = ${rawShift}. ${ch.toUpperCase()}(${x}) ${sign} ${rawShift} = ${y} (mod 26) → ${indexToLetter(y)}.`,
      phase: 'Transform',
      state: {
        ...base,
        kind: 'char',
        outputSoFar: out,
        pos,
        fromIndex: x,
        toIndex: y,
        shift,
        padChar,
        fromChar: ch,
        toChar: outChar,
      },
    });
    padPos++;
  }

  return { output: out, steps };
}
