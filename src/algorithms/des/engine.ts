/**
 * DES engine — a full, from-scratch implementation of the Data Encryption
 * Standard (FIPS 46-3) so the walkthrough can expose the initial permutation,
 * the 16-round Feistel network, the key schedule and the S-box substitutions.
 * Correctness is pinned by the official known-answer vector in the test file.
 *
 * Operates on a single 64-bit block, entered as 16 hexadecimal digits, with a
 * 64-bit key (16 hex digits, including the parity bits).
 */

import type { AlgorithmResult, Direction, Params, Step } from '@/core/types';
import { E, FP, IP, P, PC1, PC2, SBOX, SHIFTS } from './tables';

type Bits = number[];

function hexToBits(hex: string): Bits {
  const bits: Bits = [];
  for (const ch of hex) {
    const v = parseInt(ch, 16);
    bits.push((v >> 3) & 1, (v >> 2) & 1, (v >> 1) & 1, v & 1);
  }
  return bits;
}

function bitsToHex(bits: Bits): string {
  let hex = '';
  for (let i = 0; i < bits.length; i += 4) {
    const v = (bits[i] << 3) | (bits[i + 1] << 2) | (bits[i + 2] << 1) | bits[i + 3];
    hex += v.toString(16).toUpperCase();
  }
  return hex;
}

const permute = (bits: Bits, table: number[]): Bits => table.map((i) => bits[i - 1]);
const xor = (a: Bits, b: Bits): Bits => a.map((bit, i) => bit ^ b[i]);
const rotl = (bits: Bits, n: number): Bits => bits.slice(n).concat(bits.slice(0, n));

function subkeys(keyBits: Bits): Bits[] {
  const pc1 = permute(keyBits, PC1);
  let c = pc1.slice(0, 28);
  let d = pc1.slice(28, 56);
  const keys: Bits[] = [];
  for (let i = 0; i < 16; i++) {
    c = rotl(c, SHIFTS[i]);
    d = rotl(d, SHIFTS[i]);
    keys.push(permute(c.concat(d), PC2));
  }
  return keys;
}

function feistel(r: Bits, k: Bits): Bits {
  const expanded = xor(permute(r, E), k); // 48 bits
  const out: Bits = [];
  for (let i = 0; i < 8; i++) {
    const c = expanded.slice(i * 6, i * 6 + 6);
    const row = (c[0] << 1) | c[5];
    const col = (c[1] << 3) | (c[2] << 2) | (c[3] << 1) | c[4];
    const v = SBOX[i][row][col];
    out.push((v >> 3) & 1, (v >> 2) & 1, (v >> 1) & 1, v & 1);
  }
  return permute(out, P);
}

const HEX16 = /^[0-9a-fA-F]{16}$/;

function cleanHex(raw: unknown): string {
  return String(raw ?? '').replace(/\s+/g, '');
}

export interface DesStepState {
  kind: 'setup' | 'ip' | 'round' | 'final';
  direction: Direction;
  plaintextHex: string;
  keyHex: string;
  /** Left/right halves as 8 hex digits, at this point in the network. */
  L: string;
  R: string;
  round?: number; // 1..16
  subkeyHex?: string;
  allSubkeys: string[];
  outputHex?: string;
}

export function run(
  input: string,
  params: Params,
  direction: Direction,
): AlgorithmResult<DesStepState> {
  const dataHex = cleanHex(input).toUpperCase();
  const keyHex = cleanHex(params.key).toUpperCase();

  if (!HEX16.test(dataHex)) {
    return {
      output: '',
      steps: [],
      error: {
        message: `The ${direction === 'encrypt' ? 'plaintext' : 'ciphertext'} must be exactly 16 hexadecimal digits (one 64-bit block). Got ${dataHex.length}.`,
      },
    };
  }
  if (!HEX16.test(keyHex)) {
    return {
      output: '',
      steps: [],
      error: { paramKey: 'key', message: 'The key must be exactly 16 hexadecimal digits (64 bits).' },
    };
  }

  const keys = subkeys(hexToBits(keyHex));
  const order = direction === 'encrypt' ? keys : [...keys].reverse();
  const allSubkeys = order.map(bitsToHex);

  const steps: Step<DesStepState>[] = [];
  const base = { direction, plaintextHex: dataHex, keyHex, allSubkeys };

  steps.push({
    id: 'setup',
    title: `${direction === 'encrypt' ? 'Encrypt' : 'Decrypt'} block ${dataHex}`,
    description: `DES derives 16 round subkeys from the 64-bit key, then runs the block through an initial permutation, 16 Feistel rounds and a final permutation. ${direction === 'decrypt' ? 'Decryption is identical but applies the subkeys in reverse order.' : ''}`,
    phase: 'Setup',
    state: { ...base, kind: 'setup', L: dataHex.slice(0, 8), R: dataHex.slice(8, 16) },
  });

  const ip = permute(hexToBits(dataHex), IP);
  let L = ip.slice(0, 32);
  let R = ip.slice(32, 64);

  steps.push({
    id: 'ip',
    title: 'Initial permutation → L₀, R₀',
    description: 'The 64 input bits are shuffled by the fixed initial permutation, then split into a 32-bit left half L₀ and right half R₀.',
    phase: 'Permute',
    state: { ...base, kind: 'ip', L: bitsToHex(L), R: bitsToHex(R), round: 0 },
  });

  for (let i = 0; i < 16; i++) {
    const k = order[i];
    const newR = xor(L, feistel(R, k));
    L = R;
    R = newR;
    steps.push({
      id: `r${i + 1}`,
      title: `Round ${i + 1}  ·  key ${bitsToHex(k)}`,
      description: `Lₙ = Rₙ₋₁. Rₙ = Lₙ₋₁ ⊕ f(Rₙ₋₁, Kₙ), where f expands R to 48 bits, mixes in the round key, substitutes through the 8 S-boxes, and permutes the result.`,
      phase: 'Rounds',
      state: {
        ...base,
        kind: 'round',
        L: bitsToHex(L),
        R: bitsToHex(R),
        round: i + 1,
        subkeyHex: bitsToHex(k),
      },
    });
  }

  // Preoutput swaps the halves (R16 ∥ L16), then applies the final permutation.
  const preoutput = R.concat(L);
  const cipher = permute(preoutput, FP);
  const outputHex = bitsToHex(cipher);

  steps.push({
    id: 'final',
    title: `Swap + final permutation → ${outputHex}`,
    description: 'After 16 rounds the two halves are swapped one last time and passed through the final permutation (the inverse of the initial one) to produce the output block.',
    phase: 'Permute',
    state: {
      ...base,
      kind: 'final',
      L: bitsToHex(R),
      R: bitsToHex(L),
      outputHex,
    },
  });

  return { output: outputHex, steps };
}
