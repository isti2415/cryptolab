/**
 * Post-deploy smoke test.
 *
 * Small on purpose: it checks the handful of things that are wrong at the
 * *deployment* level rather than in the app, and that no unit test can see.
 * Chiefly that an unknown path returns 404 — if `assets.not_found_handling`
 * ever reverts to "single-page-application", every typo'd URL starts answering
 * 200 with the home page, and crawlers are told the whole 404 space is real
 * content. The site would look completely fine while doing it.
 *
 * Usage:
 *   pnpm smoke https://cryptolab.example
 *   pnpm smoke                     # falls back to $SITE_URL
 */

const base = (process.argv[2] || process.env.SITE_URL || '').replace(/\/$/, '');

if (!base) {
  console.error('Usage: pnpm smoke <origin>   (or set SITE_URL)');
  process.exit(1);
}

const MUST_200 = [
  '/',
  '/a/caesar',
  '/a/aes',
  '/sitemap.xml',
  '/robots.txt',
  '/og/a/caesar.png',
];

const MUST_HAVE_HEADERS = [
  'content-security-policy',
  'strict-transport-security',
  'x-content-type-options',
];

let failures = 0;
const ok = (m) => console.log(`  \x1b[32m✓\x1b[0m ${m}`);
const bad = (m) => {
  failures++;
  console.log(`  \x1b[31m✗\x1b[0m ${m}`);
};

/** One request, with a few retries: a fresh deploy can take a moment to route. */
async function get(path, { method = 'GET' } = {}) {
  let last;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await fetch(`${base}${path}`, { method, redirect: 'manual' });
    } catch (e) {
      last = e;
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  throw last;
}

console.log(`\nSmoke testing ${base}\n`);

for (const path of MUST_200) {
  const res = await get(path);
  if (res.status === 200) ok(`${path} → 200`);
  else bad(`${path} → ${res.status} (expected 200)`);
}

const missing = await get('/this-page-should-not-exist');
if (missing.status === 404) {
  ok('unknown path → 404');
} else {
  bad(
    `unknown path → ${missing.status} (expected 404). ` +
      'Check assets.not_found_handling in wrangler.jsonc: "single-page-application" ' +
      'answers every unknown URL with a 200 and the home page.',
  );
}

const root = await get('/');
for (const header of MUST_HAVE_HEADERS) {
  if (root.headers.get(header)) ok(`header ${header}`);
  else bad(`header ${header} missing`);
}

const assetRes = await get('/robots.txt');
const cc = assetRes.headers.get('cache-control') ?? '';
if (cc.includes('must-revalidate')) ok('robots.txt revalidates');
else bad(`robots.txt cache-control is "${cc}" (expected must-revalidate)`);

console.log(
  `\n${failures === 0 ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m'} — ${failures} problem(s)\n`,
);
process.exit(failures === 0 ? 0 : 1);
