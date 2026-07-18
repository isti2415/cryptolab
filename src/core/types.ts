/**
 * CryptoLab core contract.
 *
 * The single most important design rule lives here: an algorithm exposes ONE
 * pure `run()` function that returns BOTH the final `output` (what the live
 * playground shows) and the ordered `steps` trace (what the walkthrough shows).
 * Because both views are derived from the same call, they can never disagree.
 *
 * Adding a new algorithm = create one self-contained folder that default-exports
 * an `AlgorithmDefinition`, then register it in `core/registry.ts`. Nothing else
 * in the app needs to change.
 */

import type { ComponentType } from 'react';

export type Direction = 'encrypt' | 'decrypt';

export type Category = 'classical' | 'modern';

/* ------------------------------------------------------------------ params */

/**
 * A declarative description of one input a user supplies (a key, a shift, a
 * keyword…). Drives BOTH the playground form UI and validation, so the two
 * cannot drift apart.
 */
export type ParamSpec =
  | IntParamSpec
  | TextParamSpec
  | SelectParamSpec;

interface BaseParamSpec {
  /** Stable key used in the `params` object passed to `run`. */
  key: string;
  label: string;
  /** Short helper text shown under the field. */
  help?: string;
}

export interface IntParamSpec extends BaseParamSpec {
  type: 'int';
  min?: number;
  max?: number;
  default: number;
}

export interface TextParamSpec extends BaseParamSpec {
  type: 'text';
  placeholder?: string;
  default: string;
  /** If set, characters not matching are visibly flagged (not silently dropped). */
  pattern?: RegExp;
}

export interface SelectParamSpec extends BaseParamSpec {
  type: 'select';
  options: { value: string; label: string }[];
  default: string;
}

/** The runtime bag of parameter values, keyed by ParamSpec.key. */
export type Params = Record<string, string | number>;

/* ------------------------------------------------------------------ steps */

/**
 * A structured, serializable snapshot the algorithm's Visualizer knows how to
 * render. Kept as `unknown` at the contract level so each algorithm owns its
 * own state shape without leaking it into the generic shells.
 */
export interface Step<S = unknown> {
  id: string;
  /** Terse title, e.g. "Shift E (+3) → H". */
  title: string;
  /** One or two sentences narrating what happens and why. */
  description: string;
  /** Algorithm-specific state snapshot for the Visualizer. */
  state: S;
  /** Optional phase grouping, e.g. "Key schedule" vs "Rounds". */
  phase?: string;
}

/* ------------------------------------------------------------------ result */

export interface ValidationError {
  /** Which param caused it, if attributable to one. */
  paramKey?: string;
  message: string;
}

export interface AlgorithmResult<S = unknown> {
  /** Final output — what the playground displays. Empty string when errored. */
  output: string;
  /** Ordered trace — what the walkthrough displays. Empty when errored. */
  steps: Step<S>[];
  /** Present when input/params could not be processed. Never throws instead. */
  error?: ValidationError;
}

/* ------------------------------------------------------------ definition */

export interface AlgorithmContent {
  /** One-liner shown in cards/nav. */
  tagline: string;
  /** What it does, plainly. Markdown-free plain paragraphs. */
  overview: string[];
  /** Where it came from / why it mattered. */
  history: string[];
  /** How it breaks. Honest — this is a teaching tool. */
  weaknesses: string[];
  /** Optional extra notes (implementation caveats, etc.). */
  notes?: string[];
}

export interface AlgorithmMeta {
  /** URL slug + registry key, e.g. "caesar". */
  id: string;
  name: string;
  category: Category;
  /** Human-facing era, e.g. "~100 BC" or "1977". */
  era?: string;
  /** 1 (gentlest) … 5 (hardest), for ordering/《at-a-glance》. */
  difficulty: 1 | 2 | 3 | 4 | 5;
}

export interface AlgorithmVisualizerProps<S = unknown> {
  step: Step<S>;
  /** Direction the trace was produced for (some visuals mirror by direction). */
  direction: Direction;
  /** True while the player is animating toward this step (vs. jumped to it). */
  animating: boolean;
}

/**
 * Type-erased algorithm handle for the registry and generic shells. Each
 * algorithm's own `S` (its step-state shape) is existential from the app's
 * point of view; only its Visualizer needs to know it, and that pairing is
 * fixed inside the definition. `any` here is the deliberate erasure.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyAlgorithm = AlgorithmDefinition<any>;

export interface AlgorithmDefinition<S = unknown> {
  meta: AlgorithmMeta;
  content: AlgorithmContent;
  params: ParamSpec[];
  /** Whether this algorithm supports decrypt as well as encrypt. */
  supportsDecrypt: boolean;
  /**
   * The one source of truth. Pure: same inputs → same result, no side effects,
   * never throws on bad input (returns `error` instead).
   */
  run(input: string, params: Params, direction: Direction): AlgorithmResult<S>;
  /** Renders a single step's state. */
  Visualizer: ComponentType<AlgorithmVisualizerProps<S>>;
  /** Sensible starting values for the playground/walkthrough. */
  sample: { input: string; params: Params; direction?: Direction };
}
