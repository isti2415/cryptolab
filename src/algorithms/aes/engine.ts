/**
 * AES-128 engine — a from-scratch implementation of the Advanced Encryption
 * Standard (FIPS-197) for a single 128-bit block under a 128-bit key. Built from
 * scratch so the walkthrough can expose the 4×4 state matrix as it moves through
 * SubBytes, ShiftRows, MixColumns and AddRoundKey across all ten rounds.
 * Correctness is pinned by the FIPS-197 known-answer vectors in the test file.
 */

import type { AlgorithmResult, Direction, Params, Step } from '@/core/types';
import { gmul, INV_SBOX, SBOX } from './gf';

type State = number[][]; // [row][col], 4×4

const HEX32 = /^[0-9a-fA-F]{32}$/;
const clean = (raw: unknown) => String(raw ?? '').replace(/\s+/g, '');

function hexToBytes(hex: string): number[] {
  const out: number[] = [];
  for (let i = 0; i < hex.length; i += 2) out.push(parseInt(hex.slice(i, i + 2), 16));
  return out;
}
function bytesToState(b: number[]): State {
  const s: State = [[], [], [], []];
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) s[r][c] = b[c * 4 + r];
  return s;
}
function stateToHex(s: State): string {
  let hex = '';
  for (let c = 0; c < 4; c++)
    for (let r = 0; r < 4; r++) hex += s[r][c].toString(16).padStart(2, '0');
  return hex.toUpperCase();
}
const cloneState = (s: State): State => s.map((r) => r.slice());

/** 128-bit key expansion → 44 words (each a 4-byte array). */
function expandKey(key: number[]): number[][] {
  const w: number[][] = [];
  for (let i = 0; i < 4; i++) w.push([key[4 * i], key[4 * i + 1], key[4 * i + 2], key[4 * i + 3]]);
  let rcon = 1;
  for (let i = 4; i < 44; i++) {
    let temp = w[i - 1].slice();
    if (i % 4 === 0) {
      temp = [temp[1], temp[2], temp[3], temp[0]]; // RotWord
      temp = temp.map((b) => SBOX[b]); // SubWord
      temp[0] ^= rcon;
      rcon = gmul(rcon, 2);
    }
    w.push(w[i - 4].map((b, j) => b ^ temp[j]));
  }
  return w;
}

function addRoundKey(s: State, w: number[][], round: number): State {
  const out = cloneState(s);
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) out[r][c] ^= w[round * 4 + c][r];
  return out;
}
const subBytes = (s: State): State => s.map((row) => row.map((b) => SBOX[b]));
const invSubBytes = (s: State): State => s.map((row) => row.map((b) => INV_SBOX[b]));

function shiftRows(s: State): State {
  const out = cloneState(s);
  for (let r = 1; r < 4; r++) out[r] = out[r].slice(r).concat(out[r].slice(0, r));
  return out;
}
function invShiftRows(s: State): State {
  const out = cloneState(s);
  for (let r = 1; r < 4; r++) out[r] = out[r].slice(4 - r).concat(out[r].slice(0, 4 - r));
  return out;
}

function mixColumns(s: State): State {
  const out = cloneState(s);
  for (let c = 0; c < 4; c++) {
    const [a0, a1, a2, a3] = [s[0][c], s[1][c], s[2][c], s[3][c]];
    out[0][c] = gmul(a0, 2) ^ gmul(a1, 3) ^ a2 ^ a3;
    out[1][c] = a0 ^ gmul(a1, 2) ^ gmul(a2, 3) ^ a3;
    out[2][c] = a0 ^ a1 ^ gmul(a2, 2) ^ gmul(a3, 3);
    out[3][c] = gmul(a0, 3) ^ a1 ^ a2 ^ gmul(a3, 2);
  }
  return out;
}
function invMixColumns(s: State): State {
  const out = cloneState(s);
  for (let c = 0; c < 4; c++) {
    const [a0, a1, a2, a3] = [s[0][c], s[1][c], s[2][c], s[3][c]];
    out[0][c] = gmul(a0, 14) ^ gmul(a1, 11) ^ gmul(a2, 13) ^ gmul(a3, 9);
    out[1][c] = gmul(a0, 9) ^ gmul(a1, 14) ^ gmul(a2, 11) ^ gmul(a3, 13);
    out[2][c] = gmul(a0, 13) ^ gmul(a1, 9) ^ gmul(a2, 14) ^ gmul(a3, 11);
    out[3][c] = gmul(a0, 11) ^ gmul(a1, 13) ^ gmul(a2, 9) ^ gmul(a3, 14);
  }
  return out;
}

export interface AesStepState {
  kind: 'setup' | 'op' | 'final';
  direction: Direction;
  op: string;
  round: number; // 0..10
  state: string; // 32 hex
  outputHex?: string;
}

export function run(
  input: string,
  params: Params,
  direction: Direction,
): AlgorithmResult<AesStepState> {
  const dataHex = clean(input).toUpperCase();
  const keyHex = clean(params.key).toUpperCase();

  if (!HEX32.test(dataHex)) {
    return {
      output: '',
      steps: [],
      error: {
        message: `The ${direction === 'encrypt' ? 'plaintext' : 'ciphertext'} must be exactly 32 hexadecimal digits (one 128-bit block). Got ${dataHex.length}.`,
      },
    };
  }
  if (!HEX32.test(keyHex)) {
    return {
      output: '',
      steps: [],
      error: { paramKey: 'key', message: 'The key must be exactly 32 hexadecimal digits (128 bits).' },
    };
  }

  const w = expandKey(hexToBytes(keyHex));
  const steps: Step<AesStepState>[] = [];
  let s = bytesToState(hexToBytes(dataHex));

  const push = (kind: AesStepState['kind'], op: string, round: number, title: string, description: string, extra?: Partial<AesStepState>) => {
    steps.push({
      id: `${round}-${op}-${steps.length}`,
      title,
      description,
      phase: round === 0 ? 'Setup' : round === (direction === 'encrypt' ? 10 : 0) ? 'Final round' : `Round ${round}`,
      state: { kind, direction, op, round, state: stateToHex(s), ...extra },
    });
  };

  push('setup', 'input', 0, `${direction === 'encrypt' ? 'Encrypt' : 'Decrypt'} block ${dataHex}`, 'The 16 input bytes are laid out column by column into a 4×4 state matrix. AES then transforms this matrix over 10 rounds.');

  if (direction === 'encrypt') {
    s = addRoundKey(s, w, 0);
    push('op', 'AddRoundKey', 0, 'AddRoundKey (round key 0)', 'XOR the state with the first round key — the original key. This is the only step before the main rounds begin.');

    for (let round = 1; round <= 10; round++) {
      s = subBytes(s);
      push('op', 'SubBytes', round, `Round ${round} · SubBytes`, 'Each byte is replaced via the S-box — the non-linear substitution that gives AES its confusion.');
      s = shiftRows(s);
      push('op', 'ShiftRows', round, `Round ${round} · ShiftRows`, 'Row r is rotated left by r bytes, spreading each column’s bytes across the block.');
      if (round !== 10) {
        s = mixColumns(s);
        push('op', 'MixColumns', round, `Round ${round} · MixColumns`, 'Each column is mixed by a fixed matrix multiply in GF(2⁸) — the diffusion step. Skipped in the final round.');
      }
      s = addRoundKey(s, w, round);
      push('op', 'AddRoundKey', round, `Round ${round} · AddRoundKey`, `XOR in round key ${round} derived from the key schedule.`);
    }
  } else {
    s = addRoundKey(s, w, 10);
    push('op', 'AddRoundKey', 10, 'AddRoundKey (round key 10)', 'Decryption runs the network backwards, starting by XORing in the last round key.');

    for (let round = 9; round >= 0; round--) {
      s = invShiftRows(s);
      push('op', 'InvShiftRows', round + 1, `Round ${10 - round} · InvShiftRows`, 'Rotate each row right by its index — the inverse of ShiftRows.');
      s = invSubBytes(s);
      push('op', 'InvSubBytes', round + 1, `Round ${10 - round} · InvSubBytes`, 'Apply the inverse S-box to every byte.');
      s = addRoundKey(s, w, round);
      push('op', 'AddRoundKey', round, `Round ${10 - round} · AddRoundKey`, `XOR in round key ${round}.`);
      if (round !== 0) {
        s = invMixColumns(s);
        push('op', 'InvMixColumns', round, `Round ${10 - round} · InvMixColumns`, 'Undo the column mixing with the inverse matrix. Skipped in the last decryption round.');
      }
    }
  }

  const outputHex = stateToHex(s);
  push('final', 'output', direction === 'encrypt' ? 10 : 0, `Output block ${outputHex}`, 'Reading the final state matrix back out column by column gives the output block.', { outputHex });

  return { output: outputHex, steps };
}
