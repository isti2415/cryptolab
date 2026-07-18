/**
 * Hill cipher engine (2×2).
 *
 * The key is a 2×2 matrix K. Plaintext letters are taken two at a time as a
 * vector p; the ciphertext block is c = K·p mod 26. Decryption multiplies by the
 * matrix inverse mod 26: p = K⁻¹·c mod 26, where K⁻¹ = det(K)⁻¹ · adj(K).
 *
 * K is only usable if det(K) is coprime with 26 (so det has an inverse mod 26);
 * otherwise the transform isn't invertible and we return a structured error.
 * Operates on A–Z (case/punctuation dropped), padding an odd length with X.
 */

import { ALPHABET_SIZE, coprime, indexToLetter, letterToIndex, mod, modInverse } from '@/core/math';
import type { AlgorithmResult, Direction, Params, Step } from '@/core/types';

export interface HillStepState {
  kind: 'setup' | 'block';
  direction: Direction;
  /** The matrix actually applied this run (K for encrypt, K⁻¹ for decrypt). */
  matrix: number[][];
  keyMatrix: number[][];
  det: number;
  detInv: number;
  invMatrix: number[][];
  inputBlocks: string[];
  outputBlocks: string[];
  blockIndex: number;
  inVec?: [number, number];
  outVec?: [number, number];
  inChars?: string;
  outChars?: string;
  calc0?: string;
  calc1?: string;
}

function parseKey(raw: unknown): number[] | null {
  const nums = String(raw ?? '')
    .split(/[^\d-]+/)
    .filter((t) => t.length > 0)
    .map((t) => parseInt(t, 10));
  if (nums.length !== 4 || nums.some((n) => !Number.isFinite(n))) return null;
  return nums.map((n) => mod(n, ALPHABET_SIZE));
}

function normalize(text: string): string {
  return text.toUpperCase().replace(/[^A-Z]/g, '');
}

export function run(
  input: string,
  params: Params,
  direction: Direction,
): AlgorithmResult<HillStepState> {
  const nums = parseKey(params.key);
  if (!nums) {
    return {
      output: '',
      steps: [],
      error: { paramKey: 'key', message: 'The key must be four whole numbers (the 2×2 matrix, row by row).' },
    };
  }
  const [a, b, c, d] = nums;
  const keyMatrix = [
    [a, b],
    [c, d],
  ];
  const det = mod(a * d - b * c, ALPHABET_SIZE);

  if (!coprime(det, ALPHABET_SIZE)) {
    return {
      output: '',
      steps: [],
      error: {
        paramKey: 'key',
        message: `The key matrix has determinant ${det} (mod 26), which shares a factor with 26, so it can't be inverted. Choose a matrix whose determinant is coprime with 26.`,
      },
    };
  }

  const detInv = modInverse(det, ALPHABET_SIZE)!;
  // adj([[a,b],[c,d]]) = [[d,-b],[-c,a]]
  const invMatrix = [
    [mod(detInv * d, ALPHABET_SIZE), mod(detInv * -b, ALPHABET_SIZE)],
    [mod(detInv * -c, ALPHABET_SIZE), mod(detInv * a, ALPHABET_SIZE)],
  ];

  const matrix = direction === 'encrypt' ? keyMatrix : invMatrix;

  // Split into 2-letter blocks, padding with X.
  const letters = normalize(input);
  const padded = letters.length % 2 === 1 ? letters + 'X' : letters;
  const inputBlocks: string[] = [];
  for (let i = 0; i < padded.length; i += 2) inputBlocks.push(padded.slice(i, i + 2));

  const steps: Step<HillStepState>[] = [];
  const base = {
    direction,
    matrix,
    keyMatrix,
    det,
    detInv,
    invMatrix,
    inputBlocks,
  };
  const outputBlocks: string[] = [];

  steps.push({
    id: 'setup',
    title: `det K = ${det},  det⁻¹ = ${detInv} (mod 26)`,
    description:
      direction === 'encrypt'
        ? `Each pair of letters becomes a vector and is multiplied by the key matrix, mod 26. The determinant is coprime with 26, so the matrix can be inverted for decryption.`
        : `Decryption multiplies by the inverse key matrix K⁻¹ = det⁻¹ · adj(K), computed mod 26.`,
    phase: 'Setup',
    state: { ...base, kind: 'setup', outputBlocks: [], blockIndex: -1 },
  });

  inputBlocks.forEach((block, idx) => {
    const x0 = letterToIndex(block[0]);
    const x1 = letterToIndex(block[1]);
    const y0 = mod(matrix[0][0] * x0 + matrix[0][1] * x1, ALPHABET_SIZE);
    const y1 = mod(matrix[1][0] * x0 + matrix[1][1] * x1, ALPHABET_SIZE);
    const outChars = indexToLetter(y0) + indexToLetter(y1);
    outputBlocks.push(outChars);

    steps.push({
      id: `b${idx}`,
      title: `${block} → ${outChars}`,
      description: `[${x0}, ${x1}] × the matrix = [${y0}, ${y1}] (mod 26) → ${outChars}.`,
      phase: 'Transform',
      state: {
        ...base,
        kind: 'block',
        outputBlocks: [...outputBlocks],
        blockIndex: idx,
        inVec: [x0, x1],
        outVec: [y0, y1],
        inChars: block,
        outChars,
        calc0: `${matrix[0][0]}·${x0} + ${matrix[0][1]}·${x1} = ${y0}`,
        calc1: `${matrix[1][0]}·${x0} + ${matrix[1][1]}·${x1} = ${y1}`,
      },
    });
  });

  return { output: outputBlocks.join(''), steps };
}
