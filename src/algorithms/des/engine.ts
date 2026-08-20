/**
 * DES engine: a full, from-scratch implementation of the Data Encryption
 * Standard (FIPS 46-3) so the walkthrough can expose the initial permutation,
 * the 16-round Feistel network, the key schedule and the S-box substitutions.
 * Correctness is pinned by the official known-answer vector in the test file.
 *
 * Operates on a single 64-bit block, entered as 16 hexadecimal digits, with a
 * 64-bit key (16 hex digits, including the parity bits).
 *
 * The trace is bit-level on purpose. DES is almost entirely permutations and
 * table lookups, and an earlier version of this file derived all sixteen
 * subkeys silently and folded the whole Feistel function into a single step, 
 * so the walkthrough showed two hex halves swapping places sixteen times and
 * never showed a single thing DES actually does.
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

/** Every DES table is 1-based, hence the -1. */
const permute = (bits: Bits, table: number[]): Bits => table.map((i) => bits[i - 1]);
const xor = (a: Bits, b: Bits): Bits => a.map((bit, i) => bit ^ b[i]);
const rotl = (bits: Bits, n: number): Bits => bits.slice(n).concat(bits.slice(0, n));

/** One round key, plus the C/D halves it was cut from. */
export interface SubkeyTrace {
  round: number;
  shift: number;
  cBefore: Bits;
  dBefore: Bits;
  c: Bits;
  d: Bits;
  key: Bits;
}

/**
 * PC-1 → 28-bit halves C and D → sixteen left rotations → PC-2.
 *
 * `trace` is observational only: it records the C/D halves at each round for
 * the walkthrough, so there is no second implementation of the schedule that
 * could drift away from this one.
 */
function subkeys(keyBits: Bits, trace?: SubkeyTrace[]): Bits[] {
  const pc1 = permute(keyBits, PC1);
  let c = pc1.slice(0, 28);
  let d = pc1.slice(28, 56);
  const keys: Bits[] = [];
  for (let i = 0; i < 16; i++) {
    const cBefore = c;
    const dBefore = d;
    c = rotl(c, SHIFTS[i]);
    d = rotl(d, SHIFTS[i]);
    const key = permute(c.concat(d), PC2);
    keys.push(key);
    trace?.push({ round: i + 1, shift: SHIFTS[i], cBefore, dBefore, c, d, key });
  }
  return keys;
}

/** Everything the Feistel function computes, kept for the walkthrough. */
export interface FeistelTrace {
  expanded: Bits;
  key: Bits;
  xored: Bits;
  boxes: { box: number; inBits: Bits; row: number; col: number; value: number }[];
  sboxOut: Bits;
  permuted: Bits;
}

/**
 * f(R, K): expand R to 48 bits, mix in the round key, crush back to 32 through
 * the eight S-boxes, then permute. The S-boxes are the only non-linear part of
 * DES; everything else is a fixed shuffle or an XOR.
 */
function feistel(r: Bits, k: Bits, trace?: Partial<FeistelTrace>): Bits {
  const expanded = permute(r, E); // 32 -> 48
  const xored = xor(expanded, k);
  const boxes: FeistelTrace['boxes'] = [];
  const out: Bits = [];

  for (let i = 0; i < 8; i++) {
    const c = xored.slice(i * 6, i * 6 + 6);
    // Outer two bits pick the row, inner four pick the column.
    const row = (c[0] << 1) | c[5];
    const col = (c[1] << 3) | (c[2] << 2) | (c[3] << 1) | c[4];
    const v = SBOX[i][row][col];
    boxes.push({ box: i, inBits: c, row, col, value: v });
    out.push((v >> 3) & 1, (v >> 2) & 1, (v >> 1) & 1, v & 1);
  }

  const permuted = permute(out, P);

  if (trace) {
    Object.assign(trace, { expanded, key: k, xored, boxes, sboxOut: out, permuted });
  }
  return permuted;
}

/** One round's halves, for callers that want to show the network working. */
export interface DesRound {
  round: number;
  L: string;
  R: string;
  subkeyHex: string;
}

/**
 * A single DES block operation.
 *
 * Exported so Triple DES can compose three of these instead of carrying its own
 * copy of the cipher; a second implementation is a second thing that can be
 * wrong, and the two would have no way to disagree loudly.
 */
export function desBlockHex(
  dataHex: string,
  keyHex: string,
  decrypt: boolean,
  rounds?: DesRound[],
): string {
  const keys = subkeys(hexToBits(keyHex));
  const order = decrypt ? [...keys].reverse() : keys;

  const ip = permute(hexToBits(dataHex), IP);
  let L = ip.slice(0, 32);
  let R = ip.slice(32, 64);

  for (let i = 0; i < order.length; i++) {
    const newR = xor(L, feistel(R, order[i]));
    L = R;
    R = newR;
    rounds?.push({
      round: i + 1,
      L: bitsToHex(L),
      R: bitsToHex(R),
      subkeyHex: bitsToHex(order[i]),
    });
  }

  // Preoutput swaps the halves, then the final permutation undoes IP.
  return bitsToHex(permute(R.concat(L), FP));
}

const HEX16 = /^[0-9a-fA-F]{16}$/;

function cleanHex(raw: unknown): string {
  return String(raw ?? '').replace(/\s+/g, '');
}

export type DesStepKind =
  | 'setup'
  | 'pc1'
  | 'subkey'
  | 'ip'
  | 'expand'
  | 'xor'
  | 'sbox'
  | 'mix'
  | 'final';

export interface DesStepState {
  kind: DesStepKind;
  direction: Direction;
  plaintextHex: string;
  keyHex: string;
  /** Left/right halves as 8 hex digits, at this point in the network. */
  L: string;
  R: string;
  round?: number; // 1..16
  subkeyHex?: string;
  allSubkeys: string[];

  /** A fixed permutation being applied: values in, values out, and the wiring. */
  permutation?: {
    label: string;
    input: Bits;
    output: Bits;
    /** source[i] = index into `input` feeding output position i. */
    source: number[];
    /** Input positions this table discards (PC-1 drops the parity bits). */
    dropped?: number[];
  };

  /** Key-schedule working, on pc1/subkey steps. */
  schedule?: {
    shift?: number;
    cBefore?: Bits;
    dBefore?: Bits;
    c?: Bits;
    d?: Bits;
  };

  /** Feistel working, on expand/xor/sbox/mix steps. */
  feistel?: FeistelTrace;
  /** L before this round, for the final XOR. */
  prevL?: Bits;

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

  const keyBits = hexToBits(keyHex);
  const schedule: SubkeyTrace[] = [];
  const keys = subkeys(keyBits, schedule);
  const order = direction === 'encrypt' ? keys : [...keys].reverse();
  const allSubkeys = order.map(bitsToHex);

  const steps: Step<DesStepState>[] = [];
  const base = { direction, plaintextHex: dataHex, keyHex, allSubkeys };

  const push = (
    id: string,
    phase: string,
    title: string,
    description: string,
    state: Omit<DesStepState, keyof typeof base>,
  ) => {
    steps.push({ id, title, description, phase, state: { ...base, ...state } });
  };

  const L0 = dataHex.slice(0, 8);
  const R0 = dataHex.slice(8, 16);

  push(
    'setup',
    'Setup',
    `${direction === 'encrypt' ? 'Encrypt' : 'Decrypt'} block ${dataHex}`,
    `DES derives sixteen 48-bit round keys from the 64-bit key, then runs the block through an initial permutation, sixteen Feistel rounds and a final permutation.${direction === 'decrypt' ? ' Decryption is the identical process with the round keys applied in reverse order.' : ''}`,
    { kind: 'setup', L: L0, R: R0 },
  );

  /* -------------------------------------------------------- key schedule */

  const pc1Bits = permute(keyBits, PC1);
  // The eight bits PC-1 leaves out: every 8th, the parity bits.
  const droppedParity = Array.from({ length: 64 }, (_, i) => i).filter(
    (i) => !PC1.includes(i + 1),
  );

  push(
    'pc1',
    'Key schedule',
    'PC-1 · 64 key bits → 56',
    'Permuted Choice 1 reorders the key and drops every eighth bit. Those eight were only ever parity bits, which is why DES has a 64-bit key but only 56 bits of strength.',
    {
      kind: 'pc1',
      L: L0,
      R: R0,
      permutation: {
        label: 'PC-1',
        input: keyBits,
        output: pc1Bits,
        source: PC1.map((i) => i - 1),
        dropped: droppedParity,
      },
      schedule: { c: pc1Bits.slice(0, 28), d: pc1Bits.slice(28, 56) },
    },
  );

  for (const t of schedule) {
    push(
      `k${t.round}`,
      'Key schedule',
      `Round key K${t.round} = ${bitsToHex(t.key)}`,
      `Rotate both 28-bit halves left by ${t.shift} (a total of 28 across all sixteen rounds, so C and D return to where they started). Permuted Choice 2 then selects 48 of those 56 bits as K${t.round}.`,
      {
        kind: 'subkey',
        L: L0,
        R: R0,
        round: t.round,
        subkeyHex: bitsToHex(t.key),
        schedule: { shift: t.shift, cBefore: t.cBefore, dBefore: t.dBefore, c: t.c, d: t.d },
        permutation: {
          label: 'PC-2',
          input: t.c.concat(t.d),
          output: t.key,
          source: PC2.map((i) => i - 1),
          dropped: Array.from({ length: 56 }, (_, i) => i).filter((i) => !PC2.includes(i + 1)),
        },
      },
    );
  }

  /* ------------------------------------------------------------- the block */

  const dataBits = hexToBits(dataHex);
  const ip = permute(dataBits, IP);
  let L = ip.slice(0, 32);
  let R = ip.slice(32, 64);

  push(
    'ip',
    'Initial permutation',
    'Initial permutation → L₀, R₀',
    'The 64 input bits are shuffled by the fixed initial permutation, then split into a 32-bit left half L₀ and a right half R₀. IP adds no security; it dates from how the original hardware loaded data.',
    {
      kind: 'ip',
      L: bitsToHex(L),
      R: bitsToHex(R),
      round: 0,
      permutation: { label: 'IP', input: dataBits, output: ip, source: IP.map((i) => i - 1) },
    },
  );

  for (let i = 0; i < 16; i++) {
    const k = order[i];
    const round = i + 1;
    const phase = `Round ${round}`;
    const trace: Partial<FeistelTrace> = {};
    const fOut = feistel(R, k, trace);
    const f = trace as FeistelTrace;
    const prevL = L;
    const prevR = R;

    push(
      `r${round}-e`,
      phase,
      `Round ${round} · expand R to 48 bits`,
      'The E table copies R₍ₙ₋₁₎ into 48 positions, repeating 16 of its 32 bits so the half matches the round key\u2019s width, and so each bit will influence two S-boxes.',
      {
        kind: 'expand',
        L: bitsToHex(prevL),
        R: bitsToHex(prevR),
        round,
        subkeyHex: bitsToHex(k),
        feistel: f,
        permutation: { label: 'E', input: prevR, output: f.expanded, source: E.map((n) => n - 1) },
      },
    );

    push(
      `r${round}-x`,
      phase,
      `Round ${round} · XOR round key K${round}`,
      `The expanded half is XORed with K${round} = ${bitsToHex(k)}. This is the only point in the round where the key enters.`,
      {
        kind: 'xor',
        L: bitsToHex(prevL),
        R: bitsToHex(prevR),
        round,
        subkeyHex: bitsToHex(k),
        feistel: f,
      },
    );

    push(
      `r${round}-s`,
      phase,
      `Round ${round} · eight S-boxes, 48 bits → 32`,
      'Each 6-bit group indexes one S-box: the outer two bits pick the row, the inner four pick the column, and a 4-bit value comes out. These tables are the only non-linear part of DES and the sole reason it resists differential cryptanalysis.',
      {
        kind: 'sbox',
        L: bitsToHex(prevL),
        R: bitsToHex(prevR),
        round,
        subkeyHex: bitsToHex(k),
        feistel: f,
      },
    );

    const newR = xor(prevL, fOut);
    L = prevR;
    R = newR;

    push(
      `r${round}-m`,
      phase,
      `Round ${round} · permute, then Lₙ = Rₙ₋₁, Rₙ = Lₙ₋₁ ⊕ f`,
      'The P table shuffles the S-box output so that each S-box\u2019s four bits feed different S-boxes next round. That result is XORed into the old left half, and the halves swap. Because the swap and XOR are self-inverse, decryption is this exact process with the keys reversed.',
      {
        kind: 'mix',
        L: bitsToHex(L),
        R: bitsToHex(R),
        round,
        subkeyHex: bitsToHex(k),
        feistel: f,
        prevL,
        permutation: { label: 'P', input: f.sboxOut, output: f.permuted, source: P.map((n) => n - 1) },
      },
    );
  }

  // Preoutput swaps the halves (R16 ∥ L16), then applies the final permutation.
  const preoutput = R.concat(L);
  const cipher = permute(preoutput, FP);
  const outputHex = bitsToHex(cipher);

  push(
    'final',
    'Final permutation',
    `Swap + final permutation → ${outputHex}`,
    'After sixteen rounds the halves are swapped one final time and passed through FP, the exact inverse of the initial permutation, giving the output block.',
    {
      kind: 'final',
      L: bitsToHex(R),
      R: bitsToHex(L),
      outputHex,
      permutation: { label: 'FP', input: preoutput, output: cipher, source: FP.map((n) => n - 1) },
    },
  );

  return { output: outputHex, steps };
}
