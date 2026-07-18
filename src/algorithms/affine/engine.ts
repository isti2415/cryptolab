/**
 * Affine cipher engine.
 *
 * Encrypt: c = (a·p + b) mod 26.   Decrypt: p = a⁻¹·(c − b) mod 26.
 * `a` must be coprime with 26 (so that a⁻¹ exists); otherwise the mapping is
 * not invertible and we return a structured error rather than garbage.
 */

import {
  ALPHABET_SIZE,
  coprime,
  indexToLetter,
  isLetter,
  isUpperCase,
  letterToIndex,
  mod,
  modInverse,
} from '@/core/math';
import type { AlgorithmResult, Direction, Params, Step } from '@/core/types';

export type AffineStepKind = 'setup' | 'char' | 'passthrough';

export interface AffineStepState {
  kind: AffineStepKind;
  a: number;
  b: number;
  aInv: number;
  direction: Direction;
  /** Full plain→cipher map (source index → target index) for the strip. */
  map: number[];
  input: string;
  outputSoFar: string;
  pos: number;
  fromIndex?: number;
  toIndex?: number;
  fromChar?: string;
  toChar?: string;
  /** Human-readable arithmetic for this character. */
  calc?: string;
}

/** a is only valid if gcd(a,26)=1. Returns [a,b] normalized, or null on bad a. */
function readParams(params: Params): { a: number; b: number } | null {
  const a = Number(params.a);
  const b = Number(params.b);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return { a: mod(Math.trunc(a), ALPHABET_SIZE), b: mod(Math.trunc(b), ALPHABET_SIZE) };
}

export function run(
  input: string,
  params: Params,
  direction: Direction,
): AlgorithmResult<AffineStepState> {
  const parsed = readParams(params);
  if (!parsed) {
    return { output: '', steps: [], error: { message: 'a and b must be whole numbers.' } };
  }
  const { a, b } = parsed;

  if (!coprime(a, ALPHABET_SIZE)) {
    return {
      output: '',
      steps: [],
      error: {
        paramKey: 'a',
        message: `a = ${a} shares a factor with 26, so the cipher can't be reversed. Pick an a coprime with 26 (e.g. 1, 3, 5, 7, 9, 11, 15, 17, 19, 21, 23, 25).`,
      },
    };
  }

  const aInv = modInverse(a, ALPHABET_SIZE)!;

  // Precompute the full substitution map for the visualization.
  const map: number[] = [];
  for (let i = 0; i < ALPHABET_SIZE; i++) {
    map[i] =
      direction === 'encrypt'
        ? mod(a * i + b, ALPHABET_SIZE)
        : mod(aInv * (i - b), ALPHABET_SIZE);
  }

  const steps: Step<AffineStepState>[] = [];
  let out = '';

  const base = {
    a,
    b,
    aInv,
    direction,
    map,
    input,
  };

  steps.push({
    id: 'setup',
    title: `a = ${a}, b = ${b}  ·  a⁻¹ = ${aInv} (mod 26)`,
    description:
      direction === 'encrypt'
        ? `Encryption maps each letter x to (a·x + b) mod 26. The whole alphabet is remapped at once — every letter has a fixed substitute.`
        : `Decryption inverts the multiply-then-shift: x = a⁻¹·(y − b) mod 26, using the modular inverse a⁻¹ = ${aInv}.`,
    phase: 'Setup',
    state: { ...base, kind: 'setup', outputSoFar: '', pos: -1 },
  });

  for (let pos = 0; pos < input.length; pos++) {
    const ch = input[pos];

    if (!isLetter(ch)) {
      out += ch;
      steps.push({
        id: `p${pos}`,
        title: `“${ch === ' ' ? '␣' : ch}” — kept as-is`,
        description: 'Non-letters are passed through unchanged.',
        phase: 'Transform',
        state: { ...base, kind: 'passthrough', outputSoFar: out, pos },
      });
      continue;
    }

    const upper = isUpperCase(ch);
    const x = letterToIndex(ch);
    const y = map[x];
    const outChar = upper ? indexToLetter(y) : indexToLetter(y).toLowerCase();
    out += outChar;

    const calc =
      direction === 'encrypt'
        ? `(${a}·${x} + ${b}) mod 26 = ${mod(a * x + b, ALPHABET_SIZE)}`
        : `${aInv}·(${x} − ${b}) mod 26 = ${mod(aInv * (x - b), ALPHABET_SIZE)}`;

    steps.push({
      id: `c${pos}`,
      title: `${ch} → ${indexToLetter(y)}`,
      description: `${ch.toUpperCase()} is letter ${x}. ${calc} → ${indexToLetter(y)}.`,
      phase: 'Transform',
      state: {
        ...base,
        kind: 'char',
        outputSoFar: out,
        pos,
        fromIndex: x,
        toIndex: y,
        fromChar: ch,
        toChar: outChar,
        calc,
      },
    });
  }

  return { output: out, steps };
}
