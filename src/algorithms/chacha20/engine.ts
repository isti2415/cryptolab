/**
 * ChaCha20 (RFC 8439).
 *
 * A stream cipher built from nothing but addition, XOR and rotation, "ARX".
 * There are no lookup tables, which is the whole point: table lookups are what
 * leak AES's key through cache timing, and a cipher with none is constant-time
 * by construction on any CPU.
 *
 * The state is sixteen 32-bit words laid out as a 4×4 grid: four fixed
 * constants, eight of key, one counter, three of nonce. Twenty rounds of
 * quarter-rounds stir it, the original state is added back, and the result is a
 * 64-byte keystream block.
 */

import type { AlgorithmResult, Direction, Params, Step } from '@/core/types';

/** "expand 32-byte k"; the constants are literally that ASCII string. */
const CONSTANTS = [0x61707865, 0x3320646e, 0x79622d32, 0x6b206574];

const rotl = (x: number, n: number) => ((x << n) | (x >>> (32 - n))) >>> 0;
const add = (a: number, b: number) => (a + b) >>> 0;

export const hex32 = (x: number) => (x >>> 0).toString(16).padStart(8, '0').toUpperCase();

/**
 * The quarter round, four times over four words.
 *
 * Every operation is add, XOR or rotate. No branch depends on the data and no
 * memory address depends on the key, so it runs in the same time whatever the
 * inputs are.
 */
function quarterRound(s: number[], a: number, b: number, c: number, d: number) {
  s[a] = add(s[a], s[b]); s[d] = rotl(s[d] ^ s[a], 16);
  s[c] = add(s[c], s[d]); s[b] = rotl(s[b] ^ s[c], 12);
  s[a] = add(s[a], s[b]); s[d] = rotl(s[d] ^ s[a], 8);
  s[c] = add(s[c], s[d]); s[b] = rotl(s[b] ^ s[c], 7);
}

/** Column rounds touch these quadruples; diagonal rounds the ones after. */
const COLUMNS: [number, number, number, number][] = [
  [0, 4, 8, 12], [1, 5, 9, 13], [2, 6, 10, 14], [3, 7, 11, 15],
];
const DIAGONALS: [number, number, number, number][] = [
  [0, 5, 10, 15], [1, 6, 11, 12], [2, 7, 8, 13], [3, 4, 9, 14],
];

function initialState(key: number[], counter: number, nonce: number[]): number[] {
  const words = (bytes: number[]) =>
    Array.from({ length: bytes.length / 4 }, (_, i) =>
      ((bytes[i * 4]) | (bytes[i * 4 + 1] << 8) | (bytes[i * 4 + 2] << 16) | (bytes[i * 4 + 3] << 24)) >>> 0,
    );
  return [...CONSTANTS, ...words(key), counter >>> 0, ...words(nonce)];
}

export interface ChaChaRound {
  /** 1…20. */
  round: number;
  kind: 'column' | 'diagonal';
  /** The four word indices this quarter round touched. */
  quad: number[];
}

export interface ChaCha20StepState {
  kind: 'setup' | 'round' | 'add' | 'keystream' | 'xor';
  /** The 16-word state after this step. */
  state: number[];
  /** The state as it was before the twenty rounds began. */
  initial: number[];
  round?: ChaChaRound;
  /** Which words this step changed. */
  touched?: number[];
  block: number;
  blockCount: number;
  keystream?: number[];
  inputBytes: number[];
  outputSoFar: number[];
  /** Byte range of the message this block covers. */
  range?: [number, number];
}

function parseHexBytes(raw: string, expected: number): number[] | null {
  const clean = raw.replace(/[\s:]/g, '');
  if (clean.length !== expected * 2 || !/^[0-9a-fA-F]*$/.test(clean)) return null;
  const out: number[] = [];
  for (let i = 0; i < clean.length; i += 2) out.push(parseInt(clean.slice(i, i + 2), 16));
  return out;
}

const encode = (t: string) => [...new TextEncoder().encode(t)];
const hexByte = (b: number) => b.toString(16).padStart(2, '0').toUpperCase();

/** One 64-byte keystream block. `trace` records each quarter round for the walkthrough. */
export function block(
  key: number[],
  counter: number,
  nonce: number[],
  trace?: { state: number[]; round: ChaChaRound }[],
): number[] {
  const initial = initialState(key, counter, nonce);
  const s = initial.slice();

  for (let round = 1; round <= 20; round++) {
    const quads = round % 2 === 1 ? COLUMNS : DIAGONALS;
    const kind = round % 2 === 1 ? 'column' : 'diagonal';
    for (const [a, b, c, d] of quads) quarterRound(s, a, b, c, d);
    trace?.push({ state: s.slice(), round: { round, kind, quad: quads.flat() } });
  }

  const out = s.map((v, i) => add(v, initial[i]));
  // Serialised little-endian, which is why the keystream reads "backwards"
  // relative to the words above it.
  const bytes: number[] = [];
  for (const w of out) {
    bytes.push(w & 0xff, (w >>> 8) & 0xff, (w >>> 16) & 0xff, (w >>> 24) & 0xff);
  }
  return bytes;
}

export function run(
  input: string,
  params: Params,
  direction: Direction,
): AlgorithmResult<ChaCha20StepState> {
  const key = parseHexBytes(String(params.key ?? ''), 32);
  if (!key) {
    return { output: '', steps: [], error: { paramKey: 'key', message: 'The key must be exactly 64 hexadecimal digits (256 bits).' } };
  }
  const nonce = parseHexBytes(String(params.nonce ?? ''), 12);
  if (!nonce) {
    return { output: '', steps: [], error: { paramKey: 'nonce', message: 'The nonce must be exactly 24 hexadecimal digits (96 bits).' } };
  }
  const counterRaw = Number(params.counter);
  if (!Number.isInteger(counterRaw) || counterRaw < 0) {
    return { output: '', steps: [], error: { paramKey: 'counter', message: 'The block counter must be a non-negative whole number.' } };
  }

  let inputBytes: number[];
  if (direction === 'encrypt') {
    inputBytes = encode(input);
  } else {
    const clean = input.replace(/\s/g, '');
    if (clean.length % 2 !== 0 || !/^[0-9a-fA-F]*$/.test(clean)) {
      return { output: '', steps: [], error: { message: 'Ciphertext must be an even number of hexadecimal digits.' } };
    }
    inputBytes = [];
    for (let i = 0; i < clean.length; i += 2) inputBytes.push(parseInt(clean.slice(i, i + 2), 16));
  }

  if (inputBytes.length === 0) {
    return { output: '', steps: [], error: { message: 'Enter something to encrypt.' } };
  }
  if (inputBytes.length > 256) {
    return {
      output: '',
      steps: [],
      error: { message: `That is ${inputBytes.length} bytes. Keep it under 256 so the walkthrough stays finite: each 64-byte block traces twenty rounds.` },
    };
  }

  const blockCount = Math.ceil(inputBytes.length / 64);
  const steps: Step<ChaCha20StepState>[] = [];
  const out: number[] = [];

  for (let b = 0; b < blockCount; b++) {
    const counter = counterRaw + b;
    const trace: { state: number[]; round: ChaChaRound }[] = [];
    const keystream = block(key, counter, nonce, trace);
    const initial = initialState(key, counter, nonce);
    const from = b * 64;
    const to = Math.min(from + 64, inputBytes.length);

    const base = {
      initial,
      block: b,
      blockCount,
      inputBytes,
      range: [from, to] as [number, number],
    };

    const phase = blockCount > 1 ? `Block ${b + 1}` : 'Rounds';

    steps.push({
      id: `b${b}-setup`,
      title: `State for block ${b + 1} · counter ${counter}`,
      description:
        'Sixteen 32-bit words: four constants spelling "expand 32-byte k", eight words of key, the block counter, and three words of nonce. The counter is what makes each block’s keystream different, and why the nonce must never repeat under one key.',
      phase: blockCount > 1 ? `Block ${b + 1}` : 'Setup',
      state: { ...base, kind: 'setup', state: initial.slice(), outputSoFar: out.slice() },
    });

    for (const entry of trace) {
      steps.push({
        id: `b${b}-r${entry.round.round}`,
        title: `Round ${entry.round.round} · ${entry.round.kind} quarter-rounds`,
        description:
          entry.round.kind === 'column'
            ? 'Four quarter-rounds down the columns, each mixing four words with adds, XORs and rotations only.'
            : 'Four quarter-rounds along the diagonals. Alternating columns and diagonals is what spreads a change in one word across all sixteen.',
        phase,
        state: {
          ...base,
          kind: 'round',
          state: entry.state,
          round: entry.round,
          touched: entry.round.quad,
          outputSoFar: out.slice(),
        },
      });
    }

    steps.push({
      id: `b${b}-add`,
      title: 'Add the original state back',
      description:
        'The twenty rounds are individually reversible, so on their own they would be a permutation an attacker could run backwards. Adding the starting state back destroys that; this single step is what makes the block function one-way.',
      phase,
      state: {
        ...base,
        kind: 'add',
        state: trace[trace.length - 1].state.map((v, i) => add(v, initial[i])),
        keystream,
        outputSoFar: out.slice(),
      },
    });

    for (let i = from; i < to; i++) out.push(inputBytes[i] ^ keystream[i - from]);

    steps.push({
      id: `b${b}-xor`,
      title: `XOR ${to - from} byte${to - from === 1 ? '' : 's'} of keystream`,
      description:
        'The keystream is XORed with the message. Encryption and decryption are the same operation, which is exactly why a nonce must never be reused: two messages under one keystream cancel it out.',
      phase,
      state: {
        ...base,
        kind: 'xor',
        state: trace[trace.length - 1].state.map((v, i) => add(v, initial[i])),
        keystream,
        outputSoFar: out.slice(),
      },
    });
  }

  const output =
    direction === 'encrypt'
      ? out.map(hexByte).join('')
      : new TextDecoder().decode(new Uint8Array(out));

  return { output, steps };
}
