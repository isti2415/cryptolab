/**
 * AES-128 engine: a from-scratch implementation of the Advanced Encryption
 * Standard (FIPS-197) for a single 128-bit block under a 128-bit key. Built from
 * scratch so the walkthrough can expose the 4×4 state matrix as it moves through
 * SubBytes, ShiftRows, MixColumns and AddRoundKey across all ten rounds.
 * Correctness is pinned by the FIPS-197 known-answer vectors in the test file.
 *
 * The trace also covers the key schedule. It used to run silently inside
 * `expandKey` and never produce a step, so the walkthrough showed round keys
 * being XORed in without ever showing where they came from, which is half of
 * what makes AES AES.
 */

import type { AlgorithmResult, Direction, Params, Step } from '@/core/types';
import { gmul, INV_SBOX, SBOX } from './gf';

type State = number[][]; // [row][col], 4×4

const HEX32 = /^[0-9a-fA-F]{32}$/;
const clean = (raw: unknown) => String(raw ?? '').replace(/\s+/g, '');
const hex2 = (b: number) => b.toString(16).padStart(2, '0').toUpperCase();
const wordHex = (w: number[]) => w.map(hex2).join('');

function hexToBytes(hex: string): number[] {
  const out: number[] = [];
  for (let i = 0; i < hex.length; i += 2) out.push(parseInt(hex.slice(i, i + 2), 16));
  return out;
}
/** The 16 input bytes fill the state column by column, not row by row. */
function bytesToState(b: number[]): State {
  const s: State = [[], [], [], []];
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) s[r][c] = b[c * 4 + r];
  return s;
}
function stateToHex(s: State): string {
  let hex = '';
  for (let c = 0; c < 4; c++)
    for (let r = 0; r < 4; r++) hex += hex2(s[r][c]);
  return hex;
}
const cloneState = (s: State): State => s.map((r) => r.slice());

/** Round key `round` as a state matrix, so it can be shown beside the state. */
function roundKeyState(w: number[][], round: number): State {
  const s: State = [[], [], [], []];
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) s[r][c] = w[round * 4 + c][r];
  return s;
}

/** Per-round-key working shown in the walkthrough's key-schedule phase. */
export interface ScheduleDetail {
  round: number;
  /** w[4r-1], the word the transform starts from. */
  prevWord: string;
  rotated: string;
  subbed: string;
  rcon: string;
  afterRcon: string;
  /** w[4r-4], XORed with the transformed word to give w[4r]. */
  fromWord: string;
  /** The four words of this round key. */
  words: string[];
}

/**
 * 128-bit key expansion → 44 words (each a 4-byte array).
 *
 * `trace` is optional and purely observational: passing it records the
 * intermediate RotWord / SubWord / Rcon values for the walkthrough without
 * there being a second implementation that could disagree with this one.
 */
function expandKey(key: number[], trace?: ScheduleDetail[]): number[][] {
  const w: number[][] = [];
  for (let i = 0; i < 4; i++) w.push([key[4 * i], key[4 * i + 1], key[4 * i + 2], key[4 * i + 3]]);

  let rcon = 1;
  for (let i = 4; i < 44; i++) {
    let temp = w[i - 1].slice();
    const prevWord = wordHex(temp);
    let rotated = '';
    let subbed = '';
    let rconHex = '';
    let afterRcon = '';

    if (i % 4 === 0) {
      temp = [temp[1], temp[2], temp[3], temp[0]]; // RotWord
      rotated = wordHex(temp);
      temp = temp.map((b) => SBOX[b]); // SubWord
      subbed = wordHex(temp);
      rconHex = hex2(rcon);
      temp[0] ^= rcon;
      afterRcon = wordHex(temp);
      rcon = gmul(rcon, 2);
    }

    w.push(w[i - 4].map((b, j) => b ^ temp[j]));

    if (trace && i % 4 === 0) {
      trace.push({
        round: i / 4,
        prevWord,
        rotated,
        subbed,
        rcon: rconHex,
        afterRcon,
        fromWord: wordHex(w[i - 4]),
        words: [],
      });
    }
  }

  // Fill in each round key's four words once they all exist.
  if (trace) {
    for (const d of trace) {
      d.words = [0, 1, 2, 3].map((k) => wordHex(w[d.round * 4 + k]));
    }
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

export interface SboxLookup {
  /** Byte going in, as hex. */
  from: string;
  /** Byte coming out. */
  to: string;
  /** Position in the state this example was taken from. */
  cell: [number, number];
  /** High and low nibble: the S-box row and column. */
  row: number;
  col: number;
  inverse: boolean;
}

export interface AesStepState {
  kind: 'setup' | 'schedule' | 'op' | 'final';
  direction: Direction;
  op: string;
  round: number; // 0..10
  /** 32 hex: the state after this step. */
  state: string;
  /** 32 hex; the round key this step involves, when one does. */
  roundKey?: string;
  /** Key-schedule working, on `schedule` steps. */
  schedule?: ScheduleDetail;
  /** A representative S-box read, on Sub/InvSubBytes steps. */
  sboxLookup?: SboxLookup;
  /** Per-row rotation amounts, on Shift/InvShiftRows steps. */
  shifts?: number[];
  /** The column used as the worked example, on Mix/InvMixColumns steps. */
  column?: number;
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

  const schedule: ScheduleDetail[] = [];
  const w = expandKey(hexToBytes(keyHex), schedule);
  const steps: Step<AesStepState>[] = [];
  let s = bytesToState(hexToBytes(dataHex));

  const rkHex = (round: number) => stateToHex(roundKeyState(w, round));

  const push = (
    kind: AesStepState['kind'],
    op: string,
    round: number,
    phase: string,
    title: string,
    description: string,
    extra?: Partial<AesStepState>,
  ) => {
    steps.push({
      id: `${phase}-${op}-${steps.length}`,
      title,
      description,
      phase,
      state: { kind, direction, op, round, state: stateToHex(s), ...extra },
    });
  };

  /* ---------------------------------------------------------- key schedule */

  push(
    'schedule',
    'expand',
    0,
    'Key schedule',
    'The key becomes round key 0',
    'The 128-bit key is split into four 4-byte words, w₀–w₃. These are used unchanged as the first round key; every later round key is derived from them.',
    { roundKey: rkHex(0) },
  );

  for (const d of schedule) {
    push(
      'schedule',
      'expand',
      d.round,
      'Key schedule',
      `Round key ${d.round} from round key ${d.round - 1}`,
      `Take the previous word ${d.prevWord}, rotate its bytes left (${d.rotated}), push each through the S-box (${d.subbed}), then XOR the round constant ${d.rcon} into the first byte (${d.afterRcon}). XOR that with w${(d.round - 1) * 4} to get the next word, and each remaining word is the XOR of the two before it.`,
      { roundKey: rkHex(d.round), schedule: d },
    );
  }

  /* ---------------------------------------------------------------- setup */

  push(
    'setup',
    'input',
    0,
    'Setup',
    `${direction === 'encrypt' ? 'Encrypt' : 'Decrypt'} block ${dataHex}`,
    'The 16 input bytes are laid out column by column into a 4×4 state matrix. Every later step transforms this matrix in place.',
  );

  /** Captures a representative S-box read before the substitution happens. */
  const sboxExample = (before: State, inverse: boolean): SboxLookup => {
    const b = before[0][0];
    const table = inverse ? INV_SBOX : SBOX;
    return {
      from: hex2(b),
      to: hex2(table[b]),
      cell: [0, 0],
      row: b >> 4,
      col: b & 0x0f,
      inverse,
    };
  };

  if (direction === 'encrypt') {
    s = addRoundKey(s, w, 0);
    push('op', 'AddRoundKey', 0, 'Setup', 'AddRoundKey (round key 0)', 'XOR the state with the first round key: the original key. This is the only step before the main rounds begin.', { roundKey: rkHex(0) });

    for (let round = 1; round <= 10; round++) {
      const phase = round === 10 ? 'Final round' : `Round ${round}`;

      const beforeSub = s;
      s = subBytes(s);
      push('op', 'SubBytes', round, phase, `Round ${round} · SubBytes`, 'Every byte is replaced by its S-box entry; the non-linear substitution that gives AES its confusion. The S-box is indexed by the byte itself: high nibble picks the row, low nibble the column.', { sboxLookup: sboxExample(beforeSub, false) });

      s = shiftRows(s);
      push('op', 'ShiftRows', round, phase, `Round ${round} · ShiftRows`, 'Row r rotates left by r bytes. Row 0 stays put, row 1 moves one, row 2 two, row 3 three, which scatters each original column across all four.', { shifts: [0, 1, 2, 3] });

      if (round !== 10) {
        s = mixColumns(s);
        push('op', 'MixColumns', round, phase, `Round ${round} · MixColumns`, 'Each column is multiplied by a fixed matrix in GF(2⁸): the diffusion step, where one byte affects all four in its column. Skipped in the final round.', { column: 0 });
      }

      s = addRoundKey(s, w, round);
      push('op', 'AddRoundKey', round, phase, `Round ${round} · AddRoundKey`, `XOR in round key ${round} from the schedule. This is the only place the key enters the round.`, { roundKey: rkHex(round) });
    }
  } else {
    s = addRoundKey(s, w, 10);
    push('op', 'AddRoundKey', 10, 'Setup', 'AddRoundKey (round key 10)', 'Decryption runs the network backwards, starting by XORing in the last round key.', { roundKey: rkHex(10) });

    for (let round = 9; round >= 0; round--) {
      const phase = round === 0 ? 'Final round' : `Round ${10 - round}`;

      s = invShiftRows(s);
      push('op', 'InvShiftRows', round + 1, phase, `Round ${10 - round} · InvShiftRows`, 'Rotate each row right by its index: the inverse of ShiftRows.', { shifts: [0, -1, -2, -3] });

      const beforeSub = s;
      s = invSubBytes(s);
      push('op', 'InvSubBytes', round + 1, phase, `Round ${10 - round} · InvSubBytes`, 'Apply the inverse S-box to every byte, undoing the substitution.', { sboxLookup: sboxExample(beforeSub, true) });

      s = addRoundKey(s, w, round);
      push('op', 'AddRoundKey', round, phase, `Round ${10 - round} · AddRoundKey`, `XOR in round key ${round}. Because XOR is its own inverse, this undoes the matching encryption step exactly.`, { roundKey: rkHex(round) });

      if (round !== 0) {
        s = invMixColumns(s);
        push('op', 'InvMixColumns', round, phase, `Round ${10 - round} · InvMixColumns`, 'Undo the column mixing with the inverse matrix. Skipped in the last decryption round.', { column: 0 });
      }
    }
  }

  const outputHex = stateToHex(s);
  push('final', 'output', direction === 'encrypt' ? 10 : 0, 'Output', `Output block ${outputHex}`, 'Reading the final state matrix back out column by column gives the output block.', { outputHex });

  return { output: outputHex, steps };
}
