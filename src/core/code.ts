/**
 * Helpers for attaching source samples to an algorithm.
 *
 * The TypeScript sample is the engine file itself, imported through the
 * `?code` plugin; it is the code that produced the output on screen, so it
 * cannot drift. Hand-written samples in other languages can, which is why each
 * one is asserted against the same `vectors.json` fixture its engine's tests
 * use (see `tests/test_samples.py`).
 */

import type { CodeSample } from './types';

/** Shape produced by `plugins/stripComments.ts` for a `?code` import. */
export interface RawCode {
  source: string;
  path: string;
}

export function tsEngine(raw: RawCode): CodeSample {
  return { lang: 'typescript', label: 'TypeScript (this engine)', ...raw };
}

export function pythonSample(raw: RawCode): CodeSample {
  return { lang: 'python', label: 'Python', ...raw };
}
