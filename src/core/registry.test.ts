/**
 * Registry integrity.
 *
 * The catalogue (eager `meta.ts`) and the definition (lazy `index.ts`) are now
 * two halves of the same algorithm, discovered by two separate globs. These
 * assertions are what stop the halves drifting apart, and what stop a new
 * algorithm from being half-registered: the failure mode this replaces is a
 * page that 404s or renders an error on first load, which no engine test
 * would have caught.
 */

import { describe, expect, it } from 'vitest';
import { ORDER, algorithms, loadAlgorithm, neighbours, relatedTo } from './registry';

describe('registry', () => {
  it('has a unique id per algorithm', () => {
    const ids = algorithms.map((a) => a.meta.id);
    expect(ids).toEqual([...new Set(ids)]);
  });

  it('keeps ORDER exhaustive, so nothing sorts to the end by accident', () => {
    const ids = new Set(algorithms.map((a) => a.meta.id));
    expect([...ORDER].filter((id) => !ids.has(id))).toEqual([]);
    expect([...ids].filter((id) => !(ORDER as readonly string[]).includes(id))).toEqual([]);
  });

  it('gives every algorithm a non-empty tagline for the cards and nav', () => {
    for (const { meta } of algorithms) {
      expect(meta.tagline.length, meta.id).toBeGreaterThan(0);
    }
  });

  it('points `related` only at algorithms that exist, and never at itself', () => {
    const ids = new Set(algorithms.map((a) => a.meta.id));
    for (const { meta } of algorithms) {
      for (const r of meta.related ?? []) {
        expect(ids.has(r), `${meta.id} → unknown related id "${r}"`).toBe(true);
        expect(r, `${meta.id} lists itself as related`).not.toBe(meta.id);
      }
      // A dead end is what this field exists to prevent.
      expect(relatedTo(meta.id).length, `${meta.id} has no related links`).toBeGreaterThan(0);
    }
  });

  it('chains every algorithm to its neighbours', () => {
    const first = algorithms[0].meta.id;
    const last = algorithms[algorithms.length - 1].meta.id;
    expect(neighbours(first).prev).toBeUndefined();
    expect(neighbours(last).next).toBeUndefined();
    for (let i = 1; i < algorithms.length; i++) {
      expect(neighbours(algorithms[i].meta.id).prev?.meta.id).toBe(
        algorithms[i - 1].meta.id,
      );
    }
  });

  it('gives every algorithm an era, so no card renders an empty slot', () => {
    for (const { meta } of algorithms) {
      expect(meta.era, `${meta.id} has no era`).toBeTruthy();
    }
  });

  describe.each(algorithms.map((a) => a.meta.id))('%s', (id) => {
    it('cites at least one source, over https, with no duplicates', async () => {
      const algo = await loadAlgorithm(id);
      const sources = algo!.content.sources ?? [];
      expect(sources.length, `${id} cites nothing`).toBeGreaterThan(0);
      for (const s of sources) {
        expect(s.url.startsWith('https://'), `${id}: ${s.url}`).toBe(true);
        expect(s.label.trim().length).toBeGreaterThan(0);
      }
      const urls = sources.map((s) => s.url);
      expect(urls).toEqual([...new Set(urls)]);
    });

    it('loads, and its own sample runs clean', async () => {
      const algo = await loadAlgorithm(id);
      expect(algo, `${id} failed to load`).toBeDefined();

      // The sample is what the page renders before the visitor touches
      // anything. If it errors, the algorithm's first impression is a
      // red error box.
      const { input, params, direction } = algo!.sample;
      const result = algo!.run(input, params, direction ?? 'encrypt');
      expect(result.error, `${id} sample: ${result.error?.message}`).toBeUndefined();
      expect(result.steps.length, `${id} produced no steps`).toBeGreaterThan(0);
    });

    it('declares a default for every param its sample omits', async () => {
      const algo = await loadAlgorithm(id);
      const keys = new Set(algo!.params.map((p) => p.key));
      for (const k of Object.keys(algo!.sample.params)) {
        expect(keys.has(k), `${id}: sample sets unknown param "${k}"`).toBe(true);
      }
    });
  });
});
