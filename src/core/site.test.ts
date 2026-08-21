import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SITE_URL, absoluteUrl } from './site';

/**
 * The production origin is written in two places, because a `.mjs` postbuild
 * script cannot import a TypeScript module: `DEFAULT_SITE_URL` in this
 * directory and `FALLBACK_ORIGIN` in `scripts/generate-sitemap.mjs`. If they
 * drift, each page's canonical tag and the sitemap that lists it disagree about
 * what this site is called — which is invisible in the UI and only shows up as
 * a crawling problem later.
 */
describe('site origin', () => {
  const sitemapScript = readFileSync('scripts/generate-sitemap.mjs', 'utf8');
  const fallback = sitemapScript.match(
    /const FALLBACK_ORIGIN = '([^']+)'/,
  )?.[1];

  it('is duplicated in the sitemap script, and the copies agree', () => {
    expect(fallback, 'FALLBACK_ORIGIN not found in generate-sitemap.mjs').toBeDefined();
    expect(fallback).toBe(SITE_URL);
  });

  it('is a bare https origin with no trailing slash', () => {
    expect(SITE_URL).toMatch(/^https:\/\//);
    expect(SITE_URL).not.toMatch(/\/$/);
    expect(new URL(SITE_URL).pathname).toBe('/');
  });

  it('builds absolute URLs that a crawler can follow', () => {
    expect(absoluteUrl('/a/caesar')).toBe(`${SITE_URL}/a/caesar`);
    expect(absoluteUrl('/')).toBe(`${SITE_URL}/`);
  });
});
