/**
 * The other half of the cross-language contract.
 *
 * `src/algorithms/<id>/vectors.json` pins what each algorithm must produce.
 * The Python samples are asserted against it by `tests/test_samples.py`; this
 * asserts the TypeScript engines against the same file. Neither side can drift
 * without one of the two failing, which is the point: a code sample that
 * disagrees with the engine actively misteaches whoever reads it.
 *
 * Regenerate with `node scripts/gen-vectors.mjs` after an intentional change,
 * and expect the published known-answer tests in each `engine.test.ts` to catch
 * you if the change was not, in fact, intentional.
 */

import { describe, expect, it } from 'vitest';
import { algorithms, loadAlgorithm } from './registry';
import type { Direction, Params } from './types';

interface VectorFile {
  algorithm: string;
  cases: {
    name: string;
    direction: Direction;
    input: string;
    params: Params;
    output: string;
  }[];
}

const files = import.meta.glob<VectorFile>('../algorithms/*/vectors.json', {
  eager: true,
  import: 'default',
});

const byAlgorithm = new Map(
  Object.values(files).map((f) => [f.algorithm, f]),
);

describe('shared vectors', () => {
  it('covers every registered algorithm', () => {
    const missing = algorithms
      .map((a) => a.meta.id)
      .filter((id) => !byAlgorithm.has(id));
    expect(missing).toEqual([]);
  });

  for (const entry of algorithms) {
    const file = byAlgorithm.get(entry.meta.id);
    if (!file) continue;

    describe(entry.meta.id, () => {
      for (const c of file.cases) {
        // The definition is code-split now, so each case resolves the chunk
        // first; `loadAlgorithm` memoises, so this is one import per algorithm.
        it(c.name, async () => {
          const algo = await loadAlgorithm(entry.meta.id);
          const result = algo!.run(c.input, c.params, c.direction);
          expect(result.error).toBeUndefined();
          expect(result.output).toBe(c.output);
        });
      }
    });
  }
});
