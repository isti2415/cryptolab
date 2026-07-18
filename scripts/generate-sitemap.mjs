/**
 * Generates dist/sitemap.xml from the prerendered HTML output.
 *
 * Runs after `vite-react-ssg build`. It walks the emitted .html files rather
 * than a hand-kept route list, so every prerendered page — including any newly
 * added algorithm — appears in the sitemap automatically with zero maintenance.
 *
 * Override the origin with SITE_URL to match a custom domain, e.g.
 *   SITE_URL=https://cryptolab.dev pnpm build
 */

import { readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const DIST = 'dist';
const SITE_URL = (process.env.SITE_URL || 'https://cryptolab-3db.pages.dev').replace(/\/$/, '');

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
console.log(`sitemap.xml written with ${routes.length} routes (origin ${SITE_URL})`);
