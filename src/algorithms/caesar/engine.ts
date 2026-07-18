/**
 * Caesar cipher engine — the reference implementation every other algorithm
 * follows. One pure `run()` produces the final output AND the step trace, so
 * the playground and the walkthrough are guaranteed consistent.
 *
 * Encrypt: c = (p + k) mod 26.  Decrypt: p = (c − k) mod 26.
 * Non-letters pass through unchanged; letter case is preserved.
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

export type CaesarStepKind = 'setup' | 'char' | 'passthrough';

export interface CaesarStepState {
  kind: CaesarStepKind;
  /** The raw key as entered. */
  shift: number;
  /** Signed shift actually applied (+k encrypt, −k decrypt). */
  effectiveShift: number;
  direction: Direction;
  input: string;
  /** Output accumulated up to and including this step. */
  outputSoFar: string;
  /** Index into `input` of the character this step processes (−1 for setup). */
  pos: number;
  /** For 'char' steps: the from/to positions on the alphabet strip (0..25). */
  fromIndex?: number;
  toIndex?: number;
  fromChar?: string;
  toChar?: string;
}

const KEY = 'shift';

function readShift(params: Params): number {
  const raw = params[KEY];
  const n = typeof raw === 'number' ? raw : parseInt(String(raw), 10);
  return Number.isFinite(n) ? mod(n, ALPHABET_SIZE) : NaN;
}

export function run(
  input: string,
  params: Params,
  direction: Direction,
): AlgorithmResult<CaesarStepState> {
  const shift = readShift(params);

  if (Number.isNaN(shift)) {
    return {
      output: '',
      steps: [],
      error: { paramKey: KEY, message: 'Shift must be a whole number.' },
    };
  }

  const effectiveShift = direction === 'encrypt' ? shift : -shift;
  const steps: Step<CaesarStepState>[] = [];
  let out = '';

  // --- Setup step: establish the shifted alphabet mapping. -----------------
  steps.push({
    id: 'setup',
    title: `Key = ${shift} · shift ${direction === 'encrypt' ? '→ forward' : '← backward'}`,
    description:
      direction === 'encrypt'
        ? `Each letter moves ${shift} place${shift === 1 ? '' : 's'} forward through the alphabet, wrapping past Z back to A.`
        : `Each letter moves ${shift} place${shift === 1 ? '' : 's'} backward through the alphabet, wrapping past A back to Z.`,
    phase: 'Setup',
    state: {
      kind: 'setup',
      shift,
      effectiveShift,
      direction,
      input,
      outputSoFar: '',
      pos: -1,
    },
  });

  // --- One step per character. ---------------------------------------------
  for (let pos = 0; pos < input.length; pos++) {
    const ch = input[pos];

    if (!isLetter(ch)) {
      out += ch;
      const label =
        ch === ' ' ? 'space' : ch === '\n' ? 'newline' : `“${ch}”`;
      steps.push({
        id: `p${pos}`,
        title: `${label} — kept as-is`,
        description: 'Non-letter characters are not enciphered; they pass through unchanged.',
        phase: 'Transform',
        state: {
          kind: 'passthrough',
          shift,
          effectiveShift,
          direction,
          input,
          outputSoFar: out,
          pos,
        },
      });
      continue;
    }

    const upper = isUpperCase(ch);
    const fromIndex = letterToIndex(ch);
    const toIndex = mod(fromIndex + effectiveShift, ALPHABET_SIZE);
    const outCharUpper = indexToLetter(toIndex);
    const outChar = upper ? outCharUpper : outCharUpper.toLowerCase();
    out += outChar;

    const sign = effectiveShift >= 0 ? '+' : '−';
    steps.push({
      id: `c${pos}`,
      title: `${ch} ${sign}${Math.abs(effectiveShift)} → ${outChar}`,
      description: `${ch.toUpperCase()} is letter ${fromIndex} → ${fromIndex} ${sign} ${Math.abs(effectiveShift)} = ${toIndex} (mod 26) → ${outCharUpper}.`,
      phase: 'Transform',
      state: {
        kind: 'char',
        shift,
        effectiveShift,
        direction,
        input,
        outputSoFar: out,
        pos,
        fromIndex,
        toIndex,
        fromChar: ch,
        toChar: outChar,
      },
    });
  }

  return { output: out, steps };
}
