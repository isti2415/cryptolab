/**
 * RC4: a stream cipher, and a cautionary tale.
 *
 * Two loops over a 256-byte permutation. The key schedule stirs the key into
 * the array by repeated swapping; the generator then keeps swapping and emits
 * one byte per step, which is XORed with the plaintext. There are no rounds, no
 * S-boxes and no tables: the whole cipher is an array and two indices, which is
 * why it fitted in a handful of lines and ran everywhere.
 *
 * It is also thoroughly broken, and is here to be understood rather than used.
 */

import type { AlgorithmResult, Direction, Params, Step } from '@/core/types';

/** KSA iterations folded into one step, so 256 swaps stay navigable. */
const BATCH = 8;

export interface Rc4StepState {
  kind: 'setup' | 'ksa' | 'prga';
  direction: Direction;
  keyBytes: number[];
  /** The 256-byte permutation as it stands after this step. */
  s: number[];
  /** Positions this step swapped or read. */
  touched: number[];
  i?: number;
  j?: number;
  /** Inclusive KSA iteration range covered by this step. */
  range?: [number, number];
  /** PRGA: which output byte this is. */
  index?: number;
  keystreamByte?: number;
  inputByte?: number;
  outputByte?: number;
  inputBytes: number[];
  outputSoFar: number[];
}

const hex = (b: number) => b.toString(16).padStart(2, '0').toUpperCase();
const toHex = (bytes: number[]) => bytes.map(hex).join('');

function parseHex(raw: string): number[] | null {
  const clean = raw.replace(/\s+/g, '');
  if (clean.length === 0 || clean.length % 2 !== 0 || !/^[0-9a-fA-F]+$/.test(clean)) {
    return null;
  }
  const out: number[] = [];
  for (let i = 0; i < clean.length; i += 2) out.push(parseInt(clean.slice(i, i + 2), 16));
  return out;
}

const encode = (text: string): number[] => [...new TextEncoder().encode(text)];

/**
 * Key-scheduling algorithm: fold the key into a permutation of 0…255.
 *
 * `trace` is observational, recording the state after each swap so the
 * walkthrough can show the array being stirred rather than simply appearing.
 */
function ksa(key: number[], trace?: { i: number; j: number; s: number[] }[]): number[] {
  const s = Array.from({ length: 256 }, (_, i) => i);
  let j = 0;
  for (let i = 0; i < 256; i++) {
    j = (j + s[i] + key[i % key.length]) % 256;
    [s[i], s[j]] = [s[j], s[i]];
    trace?.push({ i, j, s: s.slice() });
  }
  return s;
}

export function run(
  input: string,
  params: Params,
  direction: Direction,
): AlgorithmResult<Rc4StepState> {
  const keyText = String(params.key ?? '');
  const keyBytes = encode(keyText);

  if (keyBytes.length === 0) {
    return {
      output: '',
      steps: [],
      error: { paramKey: 'key', message: 'The key must not be empty.' },
    };
  }
  if (keyBytes.length > 256) {
    return {
      output: '',
      steps: [],
      error: { paramKey: 'key', message: 'RC4 keys are at most 256 bytes.' },
    };
  }

  let inputBytes: number[];
  if (direction === 'encrypt') {
    inputBytes = encode(input);
  } else {
    const parsed = parseHex(input);
    if (parsed === null) {
      return {
        output: '',
        steps: [],
        error: {
          message: 'Ciphertext must be an even number of hexadecimal digits: the output of an encryption.',
        },
      };
    }
    inputBytes = parsed;
  }

  if (inputBytes.length === 0) {
    return { output: '', steps: [], error: { message: 'Enter something to encrypt.' } };
  }

  const swaps: { i: number; j: number; s: number[] }[] = [];
  const s = ksa(keyBytes, swaps);

  const steps: Step<Rc4StepState>[] = [];
  const base = { direction, keyBytes, inputBytes };

  steps.push({
    id: 'setup',
    title: `Key “${keyText}”, ${keyBytes.length} bytes`,
    description:
      'RC4 starts from the identity permutation: S holds 0 through 255 in order, carrying no key material at all. The key schedule then stirs the key through it 256 times.',
    phase: 'Setup',
    state: {
      ...base,
      kind: 'setup',
      s: Array.from({ length: 256 }, (_, i) => i),
      touched: [],
      outputSoFar: [],
    },
  });

  /* ------------------------------------------------------------------ KSA */

  for (let start = 0; start < 256; start += BATCH) {
    const end = Math.min(start + BATCH, 256) - 1;
    const last = swaps[end];
    const touched = new Set<number>();
    for (let k = start; k <= end; k++) {
      touched.add(swaps[k].i);
      touched.add(swaps[k].j);
    }

    steps.push({
      id: `ksa${start}`,
      title: `Key schedule · i = ${start}…${end}`,
      description:
        start === 0
          ? `For each i, j moves on by S[i] plus a key byte, and S[i] and S[j] swap. The key is consumed cyclically, so a short key is simply reused, which is the root of most of RC4’s problems.`
          : `Eight more swaps. j has reached ${last.j}; the highlighted cells are the ones this batch moved.`,
      phase: 'Key schedule',
      state: {
        ...base,
        kind: 'ksa',
        s: last.s,
        touched: [...touched],
        i: last.i,
        j: last.j,
        range: [start, end],
        outputSoFar: [],
      },
    });
  }

  /* ----------------------------------------------------------------- PRGA */

  const state = s.slice();
  let i = 0;
  let j = 0;
  const out: number[] = [];

  for (let n = 0; n < inputBytes.length; n++) {
    i = (i + 1) % 256;
    j = (j + state[i]) % 256;
    [state[i], state[j]] = [state[j], state[i]];
    const k = state[(state[i] + state[j]) % 256];
    const outByte = inputBytes[n] ^ k;
    out.push(outByte);

    steps.push({
      id: `prga${n}`,
      title: `Byte ${n + 1} · keystream ${hex(k)}`,
      description: `i advances to ${i}, j to ${j}; the two entries swap, and the keystream byte is S[(S[i] + S[j]) mod 256] = ${hex(k)}. XOR it with ${hex(inputBytes[n])} to get ${hex(outByte)}.`,
      phase: 'Keystream',
      state: {
        ...base,
        kind: 'prga',
        s: state.slice(),
        touched: [i, j, (state[i] + state[j]) % 256],
        i,
        j,
        index: n,
        keystreamByte: k,
        inputByte: inputBytes[n],
        outputByte: outByte,
        outputSoFar: out.slice(),
      },
    });
  }

  const output =
    direction === 'encrypt'
      ? toHex(out)
      : new TextDecoder().decode(new Uint8Array(out));

  return { output, steps };
}
