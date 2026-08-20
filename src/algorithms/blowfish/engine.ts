/**
 * Blowfish.
 *
 * A 16-round Feistel cipher whose S-boxes are not fixed: they are *generated
 * from the key*. That is the design's distinguishing idea and also its cost, 
 * setting up a key runs the cipher 521 times before a single byte of plaintext
 * can be encrypted, which is slow for bulk data and exactly what you want for
 * hashing passwords. bcrypt is built on that property.
 *
 * The initial P-array and S-boxes are the hexadecimal digits of π, computed
 * here from Machin's formula rather than pasted in as 1042 magic constants.
 * They are "nothing up my sleeve" numbers, and deriving them shows why.
 */

import type { AlgorithmResult, Direction, Params, Step } from '@/core/types';

const ROUNDS = 16;
const P_LENGTH = ROUNDS + 2;
const S_BOXES = 4;
const S_SIZE = 256;
const WORDS_NEEDED = P_LENGTH + S_BOXES * S_SIZE; // 1042

/** Fixed-point arctangent of 1/x, for Machin's formula. */
function atanInv(x: bigint, one: bigint): bigint {
  let term = one / x;
  let sum = term;
  const x2 = x * x;
  let n = 1n;
  while (term !== 0n) {
    term /= x2;
    n += 2n;
    sum += (n % 4n === 3n ? -term : term) / n;
  }
  return sum;
}

/**
 * The first `count` 32-bit words of π's fractional part in hexadecimal.
 *
 * π = 16·arctan(1/5) − 4·arctan(1/239). Computing it takes a few tens of
 * milliseconds once at module load, and makes it checkable that the tables
 * contain nothing but π, which is the entire reason Schneier chose them.
 */
function piWords(count: number): number[] {
  const hexDigits = count * 8;
  const guard = 16;
  const one = 1n << BigInt(4 * (hexDigits + guard));
  const pi = 16n * atanInv(5n, one) - 4n * atanInv(239n, one);
  const frac = pi - (3n << BigInt(4 * (hexDigits + guard)));
  const hex = (frac >> BigInt(4 * guard)).toString(16).padStart(hexDigits, '0');

  const out: number[] = [];
  for (let i = 0; i < count; i++) {
    out.push(parseInt(hex.slice(i * 8, i * 8 + 8), 16) >>> 0);
  }
  return out;
}

const PI = piWords(WORDS_NEEDED);
export const INITIAL_P = PI.slice(0, P_LENGTH);
const INITIAL_S = Array.from({ length: S_BOXES }, (_, i) =>
  PI.slice(P_LENGTH + i * S_SIZE, P_LENGTH + (i + 1) * S_SIZE),
);

const add = (a: number, b: number) => (a + b) >>> 0;
export const hex32 = (x: number) => (x >>> 0).toString(16).padStart(8, '0').toUpperCase();

export interface BlowfishKey {
  p: number[];
  s: number[][];
}

/**
 * f(x): split the word into four bytes, look each up in its own S-box, then
 * combine with two additions and an XOR. Mixing addition (mod 2³²) with XOR is
 * deliberate; the two operations do not distribute over each other, which is
 * what makes the function hard to analyse algebraically.
 */
function f(key: BlowfishKey, x: number): number {
  const a = (x >>> 24) & 0xff;
  const b = (x >>> 16) & 0xff;
  const c = (x >>> 8) & 0xff;
  const d = x & 0xff;
  return (((add(key.s[0][a], key.s[1][b]) ^ key.s[2][c]) >>> 0) + key.s[3][d]) >>> 0;
}

/** One 64-bit block through the Feistel network. */
export function encryptBlock(
  key: BlowfishKey,
  left: number,
  right: number,
  decrypt = false,
  rounds?: { round: number; l: number; r: number; p: number }[],
): [number, number] {
  let l = left >>> 0;
  let r = right >>> 0;

  for (let i = 0; i < ROUNDS; i++) {
    const pi = decrypt ? key.p[ROUNDS + 1 - i] : key.p[i];
    l = (l ^ pi) >>> 0;
    r = (r ^ f(key, l)) >>> 0;
    [l, r] = [r, l];
    rounds?.push({ round: i + 1, l, r, p: pi });
  }

  // Undo the final swap, then apply the two remaining subkeys.
  [l, r] = [r, l];
  if (decrypt) {
    r = (r ^ key.p[1]) >>> 0;
    l = (l ^ key.p[0]) >>> 0;
  } else {
    r = (r ^ key.p[ROUNDS]) >>> 0;
    l = (l ^ key.p[ROUNDS + 1]) >>> 0;
  }
  return [l, r];
}

export interface ScheduleStage {
  /** 'xor' folds the key in; 'fill' replaces a pair of table entries. */
  kind: 'xor' | 'fill';
  label: string;
  /** How far through the 521 encryptions this stage is. */
  progress: number;
}

/**
 * Expand a key into the P-array and four S-boxes.
 *
 * The tables start as π, are XORed with the key, and are then *overwritten* by
 * the cipher's own output: 521 encryptions, each feeding the next. There is no
 * shortcut; this is why Blowfish key setup is expensive and why bcrypt could
 * be built by making it more expensive still.
 */
export function expandKey(keyBytes: number[], stages?: ScheduleStage[]): BlowfishKey {
  const key: BlowfishKey = {
    p: INITIAL_P.slice(),
    s: INITIAL_S.map((box) => box.slice()),
  };

  for (let i = 0; i < P_LENGTH; i++) {
    let word = 0;
    for (let j = 0; j < 4; j++) {
      word = ((word << 8) | keyBytes[(i * 4 + j) % keyBytes.length]) >>> 0;
    }
    key.p[i] = (key.p[i] ^ word) >>> 0;
  }
  stages?.push({ kind: 'xor', label: 'P-array XORed with the key', progress: 0 });

  let l = 0;
  let r = 0;
  let done = 0;

  for (let i = 0; i < P_LENGTH; i += 2) {
    [l, r] = encryptBlock(key, l, r);
    key.p[i] = l;
    key.p[i + 1] = r;
    done++;
    stages?.push({ kind: 'fill', label: `P${i} and P${i + 1}`, progress: done });
  }

  for (let box = 0; box < S_BOXES; box++) {
    for (let i = 0; i < S_SIZE; i += 2) {
      [l, r] = encryptBlock(key, l, r);
      key.s[box][i] = l;
      key.s[box][i + 1] = r;
      done++;
      if (i % 64 === 0 || i === S_SIZE - 2) {
        stages?.push({
          kind: 'fill',
          label: `S-box ${box + 1}, entries ${i}–${Math.min(i + 63, S_SIZE - 1)}`,
          progress: done,
        });
      }
    }
  }

  return key;
}

export interface BlowfishStepState {
  kind: 'setup' | 'schedule' | 'round' | 'final';
  keyBytes: number[];
  /** Sample of the live P-array, for the context panel. */
  p: string[];
  /** First row of each S-box, enough to see them change. */
  sSample: string[][];
  stage?: ScheduleStage;
  totalEncryptions: number;
  round?: { round: number; l: string; r: string; p: string };
  l: string;
  r: string;
  blockHex: string;
  outputHex?: string;
}

const HEX16 = /^[0-9a-fA-F]{16}$/;
const clean = (raw: unknown) => String(raw ?? '').replace(/\s+/g, '');

export function run(
  input: string,
  params: Params,
  direction: Direction,
): AlgorithmResult<BlowfishStepState> {
  const dataHex = clean(input).toUpperCase();
  const keyHex = clean(params.key).toUpperCase();

  if (!HEX16.test(dataHex)) {
    return {
      output: '',
      steps: [],
      error: {
        message: `The ${direction === 'encrypt' ? 'plaintext' : 'ciphertext'} must be exactly 16 hexadecimal digits (one 64-bit block). Got ${dataHex.length}.`,
      },
    };
  }
  if (keyHex.length < 8 || keyHex.length > 112 || keyHex.length % 2 !== 0 || !/^[0-9A-F]+$/.test(keyHex)) {
    return {
      output: '',
      steps: [],
      error: {
        paramKey: 'key',
        message: 'The key must be 4 to 56 bytes, entered as an even number of hexadecimal digits (8–112).',
      },
    };
  }

  const keyBytes: number[] = [];
  for (let i = 0; i < keyHex.length; i += 2) keyBytes.push(parseInt(keyHex.slice(i, i + 2), 16));

  const stages: ScheduleStage[] = [];
  const key = expandKey(keyBytes, stages);

  const sSample = (k: BlowfishKey) => k.s.map((box) => box.slice(0, 8).map(hex32));
  const totalEncryptions = 521;

  const steps: Step<BlowfishStepState>[] = [];
  const l0 = parseInt(dataHex.slice(0, 8), 16) >>> 0;
  const r0 = parseInt(dataHex.slice(8, 16), 16) >>> 0;

  const base = {
    keyBytes,
    totalEncryptions,
    blockHex: dataHex,
  };

  steps.push({
    id: 'setup',
    title: `Key of ${keyBytes.length} bytes`,
    description:
      'The P-array and four S-boxes begin as the hexadecimal digits of π, 1042 words of it. Those are "nothing up my sleeve" numbers: chosen so nobody could have picked them to hide a weakness, and derived here from Machin’s formula rather than pasted in.',
    phase: 'Setup',
    state: {
      ...base,
      kind: 'setup',
      p: INITIAL_P.map(hex32),
      sSample: INITIAL_S.map((box) => box.slice(0, 8).map(hex32)),
      l: hex32(l0),
      r: hex32(r0),
    },
  });

  /*
   * The 521 encryptions are summarised rather than traced individually: each is
   * a complete 16-round Feistel pass, so tracing them all would be 8336 steps
   * to say the same thing 521 times.
   */
  for (const stage of stages) {
    steps.push({
      id: `sched-${stage.label}`,
      title: stage.kind === 'xor' ? stage.label : `Overwrite ${stage.label}`,
      description:
        stage.kind === 'xor'
          ? 'Each of the 18 P-array words is XORed with the key, which is cycled if it is shorter than 72 bytes. This is the only place the key is used directly; everything after this is the cipher rewriting its own tables.'
          : `Encrypt the running block and write the two output halves into the tables, then feed the result into the next encryption. ${stage.progress} of ${totalEncryptions} encryptions done.`,
      phase: 'Key schedule',
      state: {
        ...base,
        kind: 'schedule',
        p: key.p.map(hex32),
        sSample: sSample(key),
        stage,
        l: hex32(l0),
        r: hex32(r0),
      },
    });
  }

  const rounds: { round: number; l: number; r: number; p: number }[] = [];
  const [outL, outR] = encryptBlock(key, l0, r0, direction === 'decrypt', rounds);

  for (const round of rounds) {
    steps.push({
      id: `r${round.round}`,
      title: `Round ${round.round} of 16`,
      description:
        'XOR the left half with a subkey, push it through f, XOR the result into the right half, and swap. f splits the word into four bytes and looks each one up in its own key-dependent S-box.',
      phase: 'Rounds',
      state: {
        ...base,
        kind: 'round',
        p: key.p.map(hex32),
        sSample: sSample(key),
        round: { round: round.round, l: hex32(round.l), r: hex32(round.r), p: hex32(round.p) },
        l: hex32(round.l),
        r: hex32(round.r),
      },
    });
  }

  const outputHex = hex32(outL) + hex32(outR);

  steps.push({
    id: 'final',
    title: `Output block ${outputHex}`,
    description:
      'The final swap is undone and the last two subkeys are XORed in, giving the output block.',
    phase: 'Output',
    state: {
      ...base,
      kind: 'final',
      p: key.p.map(hex32),
      sSample: sSample(key),
      l: hex32(outL),
      r: hex32(outR),
      outputHex,
    },
  });

  return { output: outputHex, steps };
}
