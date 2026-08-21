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

/**
 * Navigation grouping. Two buckets stopped scaling once the list outgrew a
 * handful of ciphers: "modern" was covering block ciphers, hashes and
 * public-key schemes at once, which is three unrelated things.
 */
export type Category =
  | 'classical'
  | 'symmetric'
  | 'hash'
  | 'publickey'
  | 'pqc';

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
  /**
   * Phase grouping, e.g. "Key schedule" vs "Rounds". Drives the walkthrough's
   * chapter markers, so long traces (DES ~70 steps, AES ~80) stay navigable.
   */
  phase?: string;
  /**
   * Something true and worth knowing about *this* run that is not an error.
   *
   * A DES weak key is the motivating case: it is a perfectly valid key that
   * produces a perfectly correct result, and also makes the cipher its own
   * inverse. Rejecting it would be wrong and staying silent would waste the
   * best teachable moment the page has, so it is surfaced beside the step it
   * concerns rather than left in the prose two tabs away.
   */
  warning?: string;
}

/* ------------------------------------------------------------------ result */

export interface ValidationError {
  /** Which param caused it, if attributable to one. */
  paramKey?: string;
  message: string;
}

export interface AlgorithmResult<S = unknown> {
  /** Final output, what the playground displays. Empty string when errored. */
  output: string;
  /** Ordered trace, what the walkthrough displays. Empty when errored. */
  steps: Step<S>[];
  /** Present when input/params could not be processed. Never throws instead. */
  error?: ValidationError;
}

export interface FormulaLine {
  /** What the expression is for, e.g. "encrypt" or "round key". */
  label: string;
  /** The expression itself, in plain Unicode notation. */
  expr: string;
  /** What it does, in a sentence or two. Required: an unexplained equation teaches nothing. */
  note: string;
}

export interface SymbolGloss {
  symbol: string;
  meaning: string;
}

/* ------------------------------------------------------------------- code */

export type CodeLang = 'python' | 'typescript';

/**
 * A real, runnable implementation shown beside the walkthrough: the project's
 * founding promise of "the actual code that performs each step".
 *
 * `source` is the file with its comments stripped (see `plugins/stripComments.ts`).
 * The repo keeps its commentary; the panel shows the algorithm, because reading
 * a cipher and reading prose about a cipher are different activities and the
 * page already has somewhere for the prose.
 *
 * Correctness matters as much here as in the engines: a sample that disagrees
 * with the running code actively misteaches. Every non-TypeScript sample is
 * asserted against the same `vectors.json` fixture the engine's tests use, so
 * drift fails CI rather than shipping.
 */
export interface CodeSample {
  lang: CodeLang;
  /** Shown on the tab, e.g. "Python" or "TypeScript (this engine)". */
  label: string;
  /** Full source text, comments removed. */
  source: string;
  /** Repo-relative path, for the "view source" link. */
  path: string;
}

/* ------------------------------------------------------------ definition */

export interface AlgorithmContent {
  /**
   * The algorithm in notation, shown as its own tab.
   *
   * Every line carries an explanation as well as an expression: an equation a
   * reader cannot decode is decoration, and the symbols are exactly the part
   * that is unfamiliar.
   */
  formula: FormulaLine[];
  /** What each symbol in the formulas stands for. */
  symbols?: SymbolGloss[];
  /** What it does, plainly. Markdown-free plain paragraphs. */
  overview: string[];
  /** Where it came from / why it mattered. */
  history: string[];
  /** How it breaks. Honest; this is a teaching tool. */
  weaknesses: string[];
  /**
   * Where to read further: the standard, the paper that broke it, the archive.
   *
   * The prose names attacks and authors constantly ("Fluhrer, Mantin and
   * Shamir", "Sweet32", Kasiski) and cited none of them, which is a poor habit
   * in something that asks to be believed about cryptography.
   */
  sources?: { label: string; url: string; note?: string }[];
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
  /**
   * One-liner shown in cards and nav. Lives here rather than in `content`
   * because the catalogue needs it for all 24 algorithms at once, and
   * `content` is only loaded for the algorithm actually being viewed.
   */
  tagline: string;
  /**
   * Ids of algorithms this one builds on or is usually confused with.
   *
   * The prose already makes these connections — Affine explains itself as
   * Caesar with a multiply, ML-KEM as LWE with structure — but a reader had no
   * way to follow them except by hunting the sidebar. Kept in `meta` so a card
   * can be rendered without loading the other algorithm.
   */
  related?: string[];
}

/**
 * What the app knows about an algorithm *before* loading it: its catalogue
 * entry plus the loader for the rest. Keeping these apart is what lets a page
 * ship one algorithm's engine, prose and visualizer instead of all of them.
 */
export interface AlgorithmEntry {
  meta: AlgorithmMeta;
  /** Resolves the full definition. Code-split; call it, then cache the result. */
  load: () => Promise<AnyAlgorithm>;
}

export interface AlgorithmVisualizerProps<S = unknown> {
  step: Step<S>;
  /**
   * The previous step, when there is one. Lets a visualizer highlight *what
   * changed* rather than just re-rendering a new snapshot: the difference
   * between "the hex is different now" and "these four bytes were substituted".
   */
  prev?: Step<S>;
  /** Position of `step` within `steps`. */
  index: number;
  /**
   * The whole trace. Lets a visualizer render persistent context: the full key
   * schedule with the live subkey lit, the output produced so far, without
   * every engine having to duplicate whole-trace data into every single step.
   */
  steps: Step<S>[];
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
// biome-ignore lint/suspicious/noExplicitAny: the erasure is the point; see above.
export type AnyAlgorithm = AlgorithmDefinition<any>;

export interface AlgorithmDefinition<S = unknown> {
  meta: AlgorithmMeta;
  content: AlgorithmContent;
  params: ParamSpec[];
  /** Whether this algorithm supports decrypt as well as encrypt. */
  supportsDecrypt: boolean;
  /**
   * False for algorithms that transform no message: a key exchange derives a
   * shared secret from its parameters alone. The playground then hides the
   * input field rather than showing one that does nothing.
   */
  takesInput?: boolean;
  /**
   * The one source of truth. Pure: same inputs → same result, no side effects,
   * never throws on bad input (returns `error` instead).
   */
  run(input: string, params: Params, direction: Direction): AlgorithmResult<S>;
  /** Renders a single step's state. */
  Visualizer: ComponentType<AlgorithmVisualizerProps<S>>;
  /**
   * Source implementations shown beside the walkthrough. Always contains at
   * least the TypeScript engine itself (imported raw, so it cannot drift from
   * what is actually running); a hand-written Python implementation is added
   * per algorithm as the primary teaching version.
   */
  code: CodeSample[];
  /** Sensible starting values for the playground/walkthrough. */
  sample: { input: string; params: Params; direction?: Direction };
}
