/**
 * Rail fence cipher: the site's first transposition.
 *
 * Every other classical cipher here substitutes: it replaces each letter with a
 * different one. This one replaces nothing. The letters of the message are all
 * still present and all still the same; only their order has changed, which is
 * why it is invisible to frequency analysis and why it needs a completely
 * different attack.
 */

import type { AlgorithmResult, Direction, Params, Step } from '@/core/types';

export type RailFenceStepKind = 'setup' | 'place' | 'read' | 'fill';

export interface RailFenceStepState {
  kind: RailFenceStepKind;
  direction: Direction;
  rails: number;
  /** grid[rail][column]: a letter once placed, otherwise null. */
  grid: (string | null)[][];
  /** Cell this step touches, as [rail, column]. */
  active?: [number, number];
  /** Rail this step reads from or fills. */
  activeRail?: number;
  /** The normalised message being transposed. */
  letters: string;
  outputSoFar: string;
}

const MIN_RAILS = 2;
const MAX_RAILS = 12;

/** Uppercase A–Z only: spacing would otherwise dominate the fence diagram. */
function normalise(text: string): string {
  return text.toUpperCase().replace(/[^A-Z]/g, '');
}

/**
 * The rail each position lands on: down to the bottom, back up to the top, and
 * repeat. The cycle is 2r−2 because the top and bottom rails are visited once
 * per cycle while every rail between them is visited twice.
 */
export function railPattern(length: number, rails: number): number[] {
  if (rails < 2) return new Array(length).fill(0);
  const cycle = 2 * rails - 2;
  return Array.from({ length }, (_, i) => {
    const j = i % cycle;
    return j < rails ? j : cycle - j;
  });
}

const emptyGrid = (rails: number, cols: number): (string | null)[][] =>
  Array.from({ length: rails }, () => new Array<string | null>(cols).fill(null));

const cloneGrid = (g: (string | null)[][]) => g.map((row) => row.slice());

function readRails(params: Params): number {
  const raw = params.rails;
  const n = typeof raw === 'number' ? raw : parseInt(String(raw), 10);
  return Number.isFinite(n) ? Math.trunc(n) : NaN;
}

export function run(
  input: string,
  params: Params,
  direction: Direction,
): AlgorithmResult<RailFenceStepState> {
  const rails = readRails(params);

  if (Number.isNaN(rails)) {
    return {
      output: '',
      steps: [],
      error: { paramKey: 'rails', message: 'The number of rails must be a whole number.' },
    };
  }
  if (rails < MIN_RAILS || rails > MAX_RAILS) {
    return {
      output: '',
      steps: [],
      error: {
        paramKey: 'rails',
        message: `Use between ${MIN_RAILS} and ${MAX_RAILS} rails. One rail leaves the message unchanged, and more rails than letters does the same.`,
      },
    };
  }

  const letters = normalise(input);
  if (letters.length === 0) {
    return { output: '', steps: [], error: { message: 'Enter some letters to transpose.' } };
  }
  if (rails >= letters.length) {
    return {
      output: '',
      steps: [],
      error: {
        paramKey: 'rails',
        message: `With ${rails} rails and only ${letters.length} letters the zigzag never turns, so the message would come back unchanged. Use fewer rails or a longer message.`,
      },
    };
  }

  const pattern = railPattern(letters.length, rails);
  const steps: Step<RailFenceStepState>[] = [];
  const base = { direction, rails, letters };

  let grid = emptyGrid(rails, letters.length);
  let out = '';

  steps.push({
    id: 'setup',
    title: `${letters.length} letters across ${rails} rails`,
    description:
      direction === 'encrypt'
        ? `The message is written diagonally down and up across ${rails} rails, then read back one rail at a time. Nothing is substituted; every letter you started with is still there.`
        : `Rebuild the fence: mark the zigzag the letters must have followed, fill the rails in order from the ciphertext, then read the zigzag back off.`,
    phase: 'Setup',
    state: { ...base, kind: 'setup', grid: cloneGrid(grid), outputSoFar: '' },
  });

  if (direction === 'encrypt') {
    // Write phase: one step per letter, following the zigzag.
    for (let i = 0; i < letters.length; i++) {
      const rail = pattern[i];
      grid[rail][i] = letters[i];
      steps.push({
        id: `w${i}`,
        title: `${letters[i]} → rail ${rail + 1}`,
        description:
          i > 0 && pattern[i] === pattern[i - 1]
            ? `The zigzag turns here and comes back on rail ${rail + 1}.`
            : `Letter ${i + 1} sits on rail ${rail + 1}, column ${i + 1}.`,
        phase: 'Write the fence',
        state: {
          ...base,
          kind: 'place',
          grid: cloneGrid(grid),
          active: [rail, i],
          outputSoFar: '',
        },
      });
    }

    // Read phase: one step per rail, top to bottom.
    for (let r = 0; r < rails; r++) {
      const row = grid[r].filter((c): c is string => c !== null).join('');
      out += row;
      steps.push({
        id: `r${r}`,
        title: `Rail ${r + 1} reads ${row}`,
        description: `Reading rail ${r + 1} left to right gives ${row}. The ciphertext is every rail read in turn.`,
        phase: 'Read the rails',
        state: {
          ...base,
          kind: 'read',
          grid: cloneGrid(grid),
          activeRail: r,
          outputSoFar: out,
        },
      });
    }
  } else {
    /*
     * Decryption is the same fence built in the other order. The shape is known
     * from the length and the rail count alone, so the rails can be measured
     * before a single letter is placed; that measurement is the whole trick.
     */
    const counts = new Array(rails).fill(0);
    for (const r of pattern) counts[r]++;

    let cursor = 0;
    for (let r = 0; r < rails; r++) {
      const chunk = letters.slice(cursor, cursor + counts[r]);
      cursor += counts[r];
      let k = 0;
      for (let i = 0; i < pattern.length; i++) {
        if (pattern[i] === r) grid[r][i] = chunk[k++];
      }
      steps.push({
        id: `f${r}`,
        title: `Rail ${r + 1} takes ${counts[r]} letters`,
        description: `The zigzag visits rail ${r + 1} exactly ${counts[r]} times, so the next ${counts[r]} ciphertext letters, ${chunk}, belong to it.`,
        phase: 'Fill the rails',
        state: {
          ...base,
          kind: 'fill',
          grid: cloneGrid(grid),
          activeRail: r,
          outputSoFar: '',
        },
      });
    }

    for (let i = 0; i < pattern.length; i++) {
      const rail = pattern[i];
      out += grid[rail][i] ?? '';
      steps.push({
        id: `z${i}`,
        title: `Column ${i + 1} → ${grid[rail][i]}`,
        description: `Following the zigzag back across the filled fence recovers the original order.`,
        phase: 'Read the zigzag',
        state: {
          ...base,
          kind: 'place',
          grid: cloneGrid(grid),
          active: [rail, i],
          outputSoFar: out,
        },
      });
    }
  }

  return { output: out, steps };
}
