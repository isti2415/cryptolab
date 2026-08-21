/**
 * Generates dist/sitemap.xml and dist/robots.txt from the prerendered output.
 *
 * Runs after `vite-react-ssg build`. It walks the emitted .html files rather
 * than a hand-kept route list, so every prerendered page — including any newly
 * added algorithm — appears in the sitemap automatically with zero maintenance.
 *
 * Override the origin with SITE_URL to match a custom domain, e.g.
 *   SITE_URL=https://cryptolab.dev pnpm build
 *
 * robots.txt is written here rather than kept in /public so its `Sitemap:` line
 * cannot disagree with the sitemap it points at; both come from SITE_URL.
 */

import { readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const DIST = 'dist';
// Kept in step with DEFAULT_SITE_URL in src/core/site.ts: the page's canonical
// tag and the sitemap it appears in must not disagree.
const FALLBACK_ORIGIN = 'https://cryptolab.workers.dev';
const SITE_URL = (process.env.SITE_URL || FALLBACK_ORIGIN).replace(/\/$/, '');

if (!process.env.SITE_URL) {
  /*
   * WORKERS_CI is set only by Cloudflare Workers Builds, i.e. only on a build
   * that is about to be deployed. A missing origin is a warning locally and in
   * GitHub Actions (where CI builds purely to check the build), but a hard
   * failure there: shipping the placeholder would point every canonical tag,
   * the sitemap and every share card at an origin that is not this site, and
   * that is the sort of mistake that surfaces weeks later in Search Console.
   *
   * This guard used to live in the GitHub Actions deploy workflow. It lives
   * here so it applies to whichever path actually does the deploying.
   */
  if (process.env.WORKERS_CI) {
    console.error(
      '\n  ✗ SITE_URL is not set, and this is a Workers Builds deploy.\n' +
        '\n    Absolute URLs (canonical tags, sitemap, Open Graph images) are' +
        '\n    baked in at build time, so they would all point at the' +
        `\n    placeholder ${FALLBACK_ORIGIN}.` +
        '\n' +
        '\n    Fix: Workers → cryptolab → Settings → Build → Variables, add' +
        '\n      SITE_URL       = https://<your-origin>' +
        '\n      VITE_SITE_URL  = https://<your-origin>\n',
    );
    process.exit(1);
  }
  console.warn(
    `\n  ⚠ SITE_URL is not set, so absolute URLs fall back to ${FALLBACK_ORIGIN}.` +
      '\n    Fine locally; wrong for anything you publish. Build with' +
      '\n    VITE_SITE_URL=<origin> SITE_URL=<origin> pnpm build\n',
  );
}

// Pages that should never be indexed / listed.
const EXCLUDE = new Set(['404']);

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (name.endsWith('.html')) out.push(full);
  }
  return out;
}

/** dist/index.html -> "/", dist/a/caesar.html -> "/a/caesar". */
function toRoute(file) {
  let rel = relative(DIST, file).split(sep).join('/');
  rel = rel.replace(/\.html$/, '');
  if (rel === 'index') return '/';
  rel = rel.replace(/\/index$/, '');
  return `/${rel}`;
}

const routes = walk(DIST)
  .map(toRoute)
  .filter((r) => !EXCLUDE.has(r.replace(/^\//, '')))
  .sort((a, b) => a.length - b.length || a.localeCompare(b));

const now = new Date().toISOString().slice(0, 10);
const urls = routes
  .map((route) => {
    const priority = route === '/' ? '1.0' : '0.8';
    return `  <url>\n    <loc>${SITE_URL}${route}</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
  })
  .join('\n');

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;

writeFileSync(join(DIST, 'sitemap.xml'), xml);

const robots = `User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`;
writeFileSync(join(DIST, 'robots.txt'), robots);

console.log(
  `sitemap.xml + robots.txt written with ${routes.length} routes (origin ${SITE_URL})`,
);
