/**
 * Playground state in the URL.
 *
 * Until now every configured example was unshareable and every reload threw
 * away what you had typed. The state that matters is small — an input, a
 * direction, one bag of parameters and where you are in the trace — so it goes
 * in the query string rather than into storage, which makes it a link.
 *
 * Decoding is validating. A URL is untrusted input: it can name parameters an
 * algorithm does not have, put a word where a number belongs, or select an
 * option that was removed. Every field is checked against the algorithm's own
 * `ParamSpec` — the same declaration that builds the form — and anything that
 * does not fit is dropped in favour of the sample value. A bad link therefore
 * degrades to the default page instead of rendering an error or, worse,
 * silently running something other than what the link said.
 */

import type { Direction, Params, ParamSpec } from './types';

/** Short keys: these end up in a URL people paste into chat windows. */
const INPUT = 'i';
const DIRECTION = 'd';
const STEP = 's';

/** Param keys are namespaced so they cannot collide with the three above. */
const paramKey = (key: string) => `p.${key}`;

export interface PermalinkState {
  input: string;
  params: Params;
  direction: Direction;
  /** Zero-based index into the trace. */
  step?: number;
}

/**
 * Serialize. Two modes, because the address bar and a shared link want
 * different things.
 *
 * The default is `minimal`: anything equal to the algorithm's own sample is
 * left out, so simply reading a page keeps a clean URL instead of one
 * restating the defaults back at you.
 *
 * `explicit` writes every field, and is what the Copy link button uses. A link
 * has to survive the page changing underneath it: the samples are content and
 * they get edited, so a bare URL shared today would show a different input the
 * day someone improves the default. It also means the copied link visibly
 * contains what was copied, rather than looking like nothing happened.
 */
export function encodeState(
  state: PermalinkState,
  specs: ParamSpec[],
  sample: { input: string; params: Params; direction?: Direction },
  mode: 'minimal' | 'explicit' = 'minimal',
): string {
  const q = new URLSearchParams();
  const explicit = mode === 'explicit';

  if (explicit || state.input !== sample.input) q.set(INPUT, state.input);
  if (explicit || state.direction !== (sample.direction ?? 'encrypt')) {
    q.set(DIRECTION, state.direction);
  }

  for (const spec of specs) {
    const value = state.params[spec.key];
    if (value === undefined) continue;
    const fallback = sample.params[spec.key] ?? spec.default;
    if (!explicit && String(value) === String(fallback)) continue;
    q.set(paramKey(spec.key), String(value));
  }

  // Step 0 is the start of every trace and needs no pinning either way.
  if (state.step !== undefined && state.step > 0) q.set(STEP, String(state.step));

  const s = q.toString();
  return s ? `?${s}` : '';
}

/**
 * Read whatever of `search` is valid, falling back to `sample` per field.
 * Never throws, and never returns a parameter the algorithm did not declare.
 */
export function decodeState(
  search: string,
  specs: ParamSpec[],
  sample: { input: string; params: Params; direction?: Direction },
): PermalinkState {
  const q = new URLSearchParams(search);

  const rawDirection = q.get(DIRECTION);
  const direction: Direction =
    rawDirection === 'encrypt' || rawDirection === 'decrypt'
      ? rawDirection
      : (sample.direction ?? 'encrypt');

  const params: Params = {};
  for (const spec of specs) {
    const fallback = sample.params[spec.key] ?? spec.default;
    const raw = q.get(paramKey(spec.key));
    params[spec.key] = raw === null ? fallback : coerce(spec, raw, fallback);
  }

  const rawStep = q.get(STEP);
  const step =
    rawStep !== null && /^\d+$/.test(rawStep) ? Number(rawStep) : undefined;

  return {
    input: q.get(INPUT) ?? sample.input,
    params,
    direction,
    step,
  };
}

/** One parameter, checked against its own spec. */
function coerce(
  spec: ParamSpec,
  raw: string,
  fallback: string | number,
): string | number {
  switch (spec.type) {
    case 'int': {
      // `Number` accepts "" and " " as 0, which would silently rewrite a
      // malformed link into a valid-looking shift of zero.
      if (!/^-?\d+$/.test(raw.trim())) return fallback;
      const n = Number(raw);
      if (spec.min !== undefined && n < spec.min) return fallback;
      if (spec.max !== undefined && n > spec.max) return fallback;
      return n;
    }
    case 'select':
      return spec.options.some((o) => o.value === raw) ? raw : fallback;
    case 'text':
      return raw;
  }
}
