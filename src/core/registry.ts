/**
 * The algorithm registry.
 *
 * Split in two on purpose:
 *
 *   meta.ts   — eager, globbed, tiny. Everything the nav, the home page cards
 *               and the route table need, for all algorithms at once.
 *   index.ts  — lazy, one chunk per algorithm. Engine, prose, visualizer and
 *               the two source listings; only the algorithm being viewed.
 *
 * Before this split every page shipped all twenty-four engines, all the prose
 * and ~200KB of source-code strings for algorithms the visitor was not looking
 * at. The `run()`-is-the-single-source-of-truth contract is untouched: the
 * lazy module still default-exports one `AlgorithmDefinition`.
 *
 * Adding an algorithm: create the folder (with a `meta.ts`) and add its id to
 * ORDER below. Both globs pick it up automatically; there is no import list to
 * maintain and no way for the two halves to disagree, because `index.ts`
 * imports its own `meta.ts` rather than restating it.
 */

import type { AlgorithmEntry, AlgorithmMeta, AnyAlgorithm, Category } from './types';

/**
 * Pedagogical order: classical → modern. Ids not listed here still appear (a
 * new algorithm is never silently dropped), they just sort to the end; a test
 * asserts ORDER stays exhaustive so that is a warning, not a hiding place.
 */
export const ORDER = [
  'caesar', 'affine', 'vigenere', 'otp', 'playfair', 'hill', 'railfence', 'enigma',
  'rc4', 'blowfish', 'chacha20', 'des', '3des', 'aes',
  'sha256', 'sha3', 'hmac',
  'diffie-hellman', 'ecdh', 'rsa',
  'lwe', 'ml-kem', 'ml-dsa', 'hash-signatures',
] as const;

/*
 * Both globs are keyed by folder path. Six ids differ from their folder name
 * (`3des`/tripledes, `ecdh`/ecc, `ml-kem`/mlkem …), so the two halves are
 * joined on the folder, never on the id, and the id is read from the meta.
 */
const metaModules = import.meta.glob<{ meta: AlgorithmMeta }>(
  '../algorithms/*/meta.ts',
  { eager: true },
);
const defModules = import.meta.glob<{ default: AnyAlgorithm }>(
  '../algorithms/*/index.ts',
);

const folderOf = (path: string) => path.split('/').at(-2)!;

const orderIndex = (id: string) => {
  const i = (ORDER as readonly string[]).indexOf(id);
  return i === -1 ? Number.MAX_SAFE_INTEGER : i;
};

export const algorithms: AlgorithmEntry[] = Object.entries(metaModules)
  .map(([path, mod]) => {
    const folder = folderOf(path);
    const loader = defModules[`../algorithms/${folder}/index.ts`];
    if (!loader) {
      throw new Error(
        `[registry] ${folder}/meta.ts exists but ${folder}/index.ts does not.`,
      );
    }
    return {
      meta: mod.meta,
      load: () => loader().then((m) => m.default),
    };
  })
  .sort((a, b) => orderIndex(a.meta.id) - orderIndex(b.meta.id));

const byId = new Map(algorithms.map((a) => [a.meta.id, a]));

export function getEntry(id: string): AlgorithmEntry | undefined {
  return byId.get(id);
}

/**
 * The algorithms either side of `id` in the pedagogical order.
 *
 * The list is deliberately a progression, and until now the only way to follow
 * it was the sidebar: reaching the end of RSA offered no hint that ML-KEM was
 * the next thing to read.
 */
export function neighbours(id: string): {
  prev?: AlgorithmEntry;
  next?: AlgorithmEntry;
} {
  const i = algorithms.findIndex((a) => a.meta.id === id);
  if (i === -1) return {};
  return { prev: algorithms[i - 1], next: algorithms[i + 1] };
}

/** Catalogue entries for `meta.related`, skipping any id that no longer exists. */
export function relatedTo(id: string): AlgorithmEntry[] {
  return (byId.get(id)?.meta.related ?? [])
    .map((r) => byId.get(r))
    .filter((e): e is AlgorithmEntry => e !== undefined && e.meta.id !== id);
}

/**
 * Resolved definitions, memoised. A second visit to an algorithm reuses the
 * already-fetched chunk rather than re-importing it.
 */
const loaded = new Map<string, AnyAlgorithm>();

export async function loadAlgorithm(id: string): Promise<AnyAlgorithm | undefined> {
  const cached = loaded.get(id);
  if (cached) return cached;
  const entry = byId.get(id);
  if (!entry) return undefined;
  const algo = await entry.load();
  loaded.set(id, algo);
  return algo;
}

/** Display order and labels for the category groups. */
export const CATEGORIES: { id: Category; title: string; blurb: string }[] = [
  {
    id: 'classical',
    title: 'Classical',
    blurb: 'Pen-and-paper ciphers, from Caesar to the eve of the computer age.',
  },
  {
    id: 'symmetric',
    title: 'Symmetric',
    blurb: 'Block and stream ciphers: one shared key encrypts and decrypts.',
  },
  {
    id: 'hash',
    title: 'Hashes & MACs',
    blurb: 'One-way functions, and what you build on them to detect tampering.',
  },
  {
    id: 'publickey',
    title: 'Public key',
    blurb: 'Different keys to encrypt and decrypt, and to agree a secret in the open.',
  },
  {
    id: 'pqc',
    title: 'Post-quantum',
    blurb: 'Schemes designed to survive an adversary with a quantum computer.',
  },
];

/** Algorithms grouped for navigation, in `CATEGORIES` order, empties dropped. */
export function algorithmGroups() {
  return CATEGORIES.map((c) => ({
    ...c,
    items: algorithms.filter((a) => a.meta.category === c.id),
  })).filter((g) => g.items.length > 0);
}
