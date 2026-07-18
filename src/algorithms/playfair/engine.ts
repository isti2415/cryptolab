/**
 * Playfair cipher engine — a digraph substitution cipher over a 5×5 key square.
 *
 * A keyword fills a 5×5 grid (I and J share a cell), followed by the rest of the
 * alphabet. The message is split into letter pairs; each pair is transformed by
 * the position of its two letters in the grid:
 *   • same row     → each letter is replaced by the one to its right (wrap)
 *   • same column  → each letter is replaced by the one below it (wrap)
 *   • rectangle    → each letter is replaced by the one in its row, in the
 *                    other letter's column
 * Decryption uses the same rules shifting left / up instead.
 *
 * Playfair is destructive: it works on A–Z only (J folded to I), pads repeated
 * letters and odd lengths with a filler, and discards case/spacing. Output is
 * grouped into pairs. Because of the filler and I/J merge, decryption recovers a
 * padded, upper-case letter stream rather than the exact original text.
 */

import type { AlgorithmResult, Direction, Params, Step } from '@/core/types';

const ALPHABET_NO_J = 'ABCDEFGHIKLMNOPQRSTUVWXYZ';

export interface PlayfairStepState {
  kind: 'setup' | 'pair';
  grid: string[][];
  direction: Direction;
  inputPairs: string[];
  outputPairs: string[];
  pairIndex: number;
  rule?: 'row' | 'column' | 'rectangle';
  a?: string;
  b?: string;
  ra?: string;
  rb?: string;
  posA?: [number, number];
  posB?: [number, number];
  posRA?: [number, number];
  posRB?: [number, number];
}

function normalize(text: string): string {
  return text.toUpperCase().replace(/J/g, 'I').replace(/[^A-Z]/g, '');
}

function buildGrid(keyword: string): { grid: string[][]; pos: Map<string, [number, number]> } {
  const seen = new Set<string>();
  const seq: string[] = [];
  for (const ch of normalize(keyword) + ALPHABET_NO_J) {
    if (!seen.has(ch)) {
      seen.add(ch);
      seq.push(ch);
    }
  }
  const grid: string[][] = [];
  const pos = new Map<string, [number, number]>();
  for (let r = 0; r < 5; r++) {
    grid.push([]);
    for (let c = 0; c < 5; c++) {
      const ch = seq[r * 5 + c];
      grid[r].push(ch);
      pos.set(ch, [r, c]);
    }
  }
  return { grid, pos };
}

function filler(letter: string): string {
  return letter === 'X' ? 'Q' : 'X';
}

/** Split the (normalized) plaintext into digraphs, inserting fillers. */
function toEncryptPairs(text: string): string[] {
  const letters = normalize(text);
  const pairs: string[] = [];
  let i = 0;
  while (i < letters.length) {
    const a = letters[i];
    const b = letters[i + 1];
    if (b === undefined) {
      pairs.push(a + filler(a));
      i += 1;
    } else if (a === b) {
      pairs.push(a + filler(a));
      i += 1;
    } else {
      pairs.push(a + b);
      i += 2;
    }
  }
  return pairs;
}

/** Split ciphertext into digraphs as-is (already even after normalization). */
function toDecryptPairs(text: string): string[] {
  const letters = normalize(text);
  const pairs: string[] = [];
  for (let i = 0; i < letters.length; i += 2) {
    const a = letters[i];
    const b = letters[i + 1] ?? filler(a);
    pairs.push(a + b);
  }
  return pairs;
}

export function run(
  input: string,
  params: Params,
  direction: Direction,
): AlgorithmResult<PlayfairStepState> {
  const keyword = String(params.keyword ?? '');
  if (normalize(keyword).length === 0) {
    return {
      output: '',
      steps: [],
      error: { paramKey: 'keyword', message: 'The keyword must contain at least one letter.' },
    };
  }

  const { grid, pos } = buildGrid(keyword);
  const shift = direction === 'encrypt' ? 1 : -1;
  const m = (n: number) => ((n % 5) + 5) % 5;

  const inputPairs =
    direction === 'encrypt' ? toEncryptPairs(input) : toDecryptPairs(input);

  const steps: Step<PlayfairStepState>[] = [];
  const base = { grid, direction, inputPairs };
  const outputPairs: string[] = [];

  steps.push({
    id: 'setup',
    title: `Key square built from “${normalize(keyword)}”`,
    description:
      'The keyword fills the 5×5 grid (dropping repeats), then the rest of the alphabet follows. I and J share one cell. The message is then processed two letters at a time.',
    phase: 'Setup',
    state: { ...base, kind: 'setup', outputPairs: [], pairIndex: -1 },
  });

  inputPairs.forEach((pair, idx) => {
    const a = pair[0];
    const b = pair[1];
    const [ra1, ca1] = pos.get(a)!;
    const [rb1, cb1] = pos.get(b)!;

    let ra: string, rb: string;
    let posRA: [number, number], posRB: [number, number];
    let rule: 'row' | 'column' | 'rectangle';

    if (ra1 === rb1) {
      rule = 'row';
      posRA = [ra1, m(ca1 + shift)];
      posRB = [rb1, m(cb1 + shift)];
    } else if (ca1 === cb1) {
      rule = 'column';
      posRA = [m(ra1 + shift), ca1];
      posRB = [m(rb1 + shift), cb1];
    } else {
      rule = 'rectangle';
      posRA = [ra1, cb1];
      posRB = [rb1, ca1];
    }
    ra = grid[posRA[0]][posRA[1]];
    rb = grid[posRB[0]][posRB[1]];
    outputPairs.push(ra + rb);

    const ruleText = {
      row: `Same row → take the letter to each one's ${direction === 'encrypt' ? 'right' : 'left'} (wrapping around).`,
      column: `Same column → take the letter ${direction === 'encrypt' ? 'below' : 'above'} each (wrapping around).`,
      rectangle: `Rectangle → each letter is replaced by the one in its own row but the other letter's column.`,
    }[rule];

    steps.push({
      id: `d${idx}`,
      title: `${a}${b} → ${ra}${rb}  ·  ${rule}`,
      description: ruleText,
      phase: 'Encipher',
      state: {
        ...base,
        kind: 'pair',
        outputPairs: [...outputPairs],
        pairIndex: idx,
        rule,
        a,
        b,
        ra,
        rb,
        posA: [ra1, ca1],
        posB: [rb1, cb1],
        posRA,
        posRB,
      },
    });
  });

  return { output: outputPairs.join(' '), steps };
}
