/**
 * Vigenère cipher engine — a polyalphabetic cipher. Each plaintext letter is
 * Caesar-shifted by the corresponding letter of a repeating keyword, so the
 * same plaintext letter can encrypt to different ciphertext letters depending
 * on its position. The key advances only over letters; other characters pass
 * through and do not consume a key letter.
 *
 * Encrypt: cᵢ = (pᵢ + kᵢ) mod 26.   Decrypt: pᵢ = (cᵢ − kᵢ) mod 26.
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

export type VigenereStepKind = 'setup' | 'char' | 'passthrough';

export interface VigenereStepState {
  kind: VigenereStepKind;
  key: string;
  direction: Direction;
  input: string;
  /** Key letter aligned under each input position (space where none applies). */
  keyStream: string;
  outputSoFar: string;
  pos: number;
  fromIndex?: number;
  toIndex?: number;
  shift?: number;
  keyChar?: string;
  keyPos?: number;
  fromChar?: string;
  toChar?: string;
}

function cleanKey(raw: unknown): string {
  return String(raw ?? '')
    .toUpperCase()
    .replace(/[^A-Z]/g, '');
}

export function run(
  input: string,
  params: Params,
  direction: Direction,
): AlgorithmResult<VigenereStepState> {
  const key = cleanKey(params.keyword);

  if (key.length === 0) {
    return {
      output: '',
      steps: [],
      error: { paramKey: 'keyword', message: 'The keyword must contain at least one letter.' },
    };
  }

  // Precompute the aligned key stream for the visualization.
  let kp = 0;
  const keyStreamArr: string[] = [];
  for (const ch of input) {
    if (isLetter(ch)) {
      keyStreamArr.push(key[kp % key.length]);
      kp++;
    } else {
      keyStreamArr.push(' ');
    }
  }
  const keyStream = keyStreamArr.join('');

  const steps: Step<VigenereStepState>[] = [];
  const base = { key, direction, input, keyStream };
  let out = '';

  steps.push({
    id: 'setup',
    title: `Keyword “${key}” repeats across the message`,
    description:
      direction === 'encrypt'
        ? `Write the keyword under the plaintext, repeating it. Each plaintext letter is shifted forward by its key letter (A = 0, B = 1, …).`
        : `Write the keyword under the ciphertext, repeating it. Each ciphertext letter is shifted back by its key letter.`,
    phase: 'Setup',
    state: { ...base, kind: 'setup', outputSoFar: '', pos: -1 },
  });

  let keyPos = 0;
  for (let pos = 0; pos < input.length; pos++) {
    const ch = input[pos];

    if (!isLetter(ch)) {
      out += ch;
      steps.push({
        id: `p${pos}`,
        title: `“${ch === ' ' ? '␣' : ch}” — kept as-is`,
        description: 'Non-letters pass through and do not consume a key letter.',
        phase: 'Transform',
        state: { ...base, kind: 'passthrough', outputSoFar: out, pos },
      });
      continue;
    }

    const keyChar = key[keyPos % key.length];
    const rawShift = letterToIndex(keyChar);
    const shift = direction === 'encrypt' ? rawShift : -rawShift;
    const upper = isUpperCase(ch);
    const x = letterToIndex(ch);
    const y = mod(x + shift, ALPHABET_SIZE);
    const outChar = upper ? indexToLetter(y) : indexToLetter(y).toLowerCase();
    out += outChar;

    const sign = direction === 'encrypt' ? '+' : '−';
    steps.push({
      id: `c${pos}`,
      title: `${ch} ${sign} ${keyChar}(${rawShift}) → ${indexToLetter(y)}`,
      description: `Key letter ${keyChar} = ${rawShift}. ${ch.toUpperCase()}(${x}) ${sign} ${rawShift} = ${y} (mod 26) → ${indexToLetter(y)}.`,
      phase: 'Transform',
      state: {
        ...base,
        kind: 'char',
        outputSoFar: out,
        pos,
        fromIndex: x,
        toIndex: y,
        shift,
        keyChar,
        keyPos: keyPos % key.length,
        fromChar: ch,
        toChar: outChar,
      },
    });
    keyPos++;
  }

  return { output: out, steps };
}
