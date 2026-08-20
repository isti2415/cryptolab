/**
 * WCAG contrast regression test.
 *
 * Walks every route in both themes, computes the real rendered contrast of
 * every text node against its effective background, and fails on anything below
 * AA. This exists because the site once shipped 31 distinct failing colour
 * pairs — form labels, step counters, section headings and the cipher row of
 * the alphabet strips were all between 1.8:1 and 3.5:1 — and nothing caught it.
 *
 * Exemptions follow WCAG 1.4.3 rather than being conveniences: disabled
 * controls and `aria-hidden` decoration are out of scope. Anything a user is
 * expected to read is in scope.
 *
 * Usage:  node scripts/audit-contrast.mjs [baseUrl]
 * Requires a server already running (pnpm dev, or pnpm preview after a build).
 */

import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const puppeteer = require('puppeteer-core');

const BASE = process.argv[2] || process.env.AUDIT_URL || 'http://localhost:5173';
const CHROME =
  process.env.CHROME_PATH ||
  ['/usr/bin/chromium', '/usr/bin/google-chrome', '/usr/bin/chromium-browser'].find(
    (p) => {
      try {
        return require('node:fs').existsSync(p);
      } catch {
        return false;
      }
    },
  );

/*
 * Derived from the vector fixtures rather than hardcoded, so a newly added
 * algorithm is audited automatically. A hardcoded list would quietly stop
 * covering the site as it grew, which is the failure mode this script exists
 * to prevent.
 */
const ROUTES = [
  '/',
  ...require('node:fs')
    .readdirSync(new URL('../src/algorithms', import.meta.url), { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => {
      const file = new URL(`../src/algorithms/${d.name}/vectors.json`, import.meta.url);
      try {
        return `/a/${JSON.parse(require('node:fs').readFileSync(file, 'utf8')).algorithm}`;
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .sort(),
];
const THEMES = ['light', 'dark'];

/** Runs in the page. Returns every text node that fails AA. */
function collect() {
  const parse = (c) => {
    const m = c.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(',').map((x) => parseFloat(x));
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  };
  const lum = ({ r, g, b }) => {
    const f = (v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const over = (fg, bg) => ({
    r: fg.r * fg.a + bg.r * (1 - fg.a),
    g: fg.g * fg.a + bg.g * (1 - fg.a),
    b: fg.b * fg.a + bg.b * (1 - fg.a),
    a: 1,
  });
  const effBg = (el) => {
    let n = el;
    let acc = null;
    while (n) {
      const c = parse(getComputedStyle(n).backgroundColor);
      if (c && c.a > 0) {
        acc = acc ? over(acc, c) : c;
        if (c.a >= 1) return over(acc, { r: 0, g: 0, b: 0, a: 1 });
      }
      n = n.parentElement;
    }
    // Nothing opaque found: fall back to the canvas colour.
    const body = parse(getComputedStyle(document.body).backgroundColor);
    return over(acc ?? { r: 0, g: 0, b: 0, a: 0 }, body ?? { r: 255, g: 255, b: 255, a: 1 });
  };

  const out = [];
  for (const el of document.querySelectorAll('body *')) {
    // WCAG 1.4.3 exempts inactive controls and pure decoration.
    if (el.closest('[aria-hidden="true"], :disabled, [hidden]')) continue;
    if (el.classList.contains('sr-only')) continue;

    const txt = Array.from(el.childNodes)
      .filter((n) => n.nodeType === 3)
      .map((n) => n.textContent.trim())
      .join(' ')
      .trim();
    if (!txt) continue;

    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.opacity === '0') continue;

    const fgRaw = parse(cs.color);
    if (!fgRaw) continue;
    const bg = effBg(el);
    const fg = over(fgRaw, bg);
    const l1 = lum(fg);
    const l2 = lum(bg);
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

    const px = parseFloat(cs.fontSize);
    const bold = parseInt(cs.fontWeight, 10) >= 700;
    const need = px >= 24 || (bold && px >= 18.66) ? 3 : 4.5;

    if (ratio < need) {
      out.push({
        ratio: +ratio.toFixed(2),
        need,
        px: +px.toFixed(1),
        cls: typeof el.className === 'string' ? el.className : '',
        tag: el.tagName.toLowerCase(),
        color: cs.color,
        bg: `rgb(${Math.round(bg.r)}, ${Math.round(bg.g)}, ${Math.round(bg.b)})`,
        text: txt.slice(0, 44),
      });
    }
  }
  return out;
}

if (!CHROME) {
  console.error('No Chrome/Chromium found. Set CHROME_PATH.');
  process.exit(2);
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

const failures = new Map();
let checked = 0;

for (const theme of THEMES) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1000 });
  await page.emulateMediaFeatures([
    { name: 'prefers-color-scheme', value: theme },
  ]);

  for (const route of ROUTES) {
    await page.goto(BASE + route, { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 350));

    /*
     * Inactive tab panels carry `hidden`, so they are invisible to the
     * collector — which would leave four fifths of every algorithm's prose
     * unaudited. Each tab is selected in turn.
     */
    const tabCount = await page.evaluate(
      () => document.querySelectorAll('[role="tab"]').length,
    );

    for (let tab = 0; tab < Math.max(1, tabCount); tab++) {
      if (tabCount > 0) {
        await page.evaluate((i) => {
          const tabs = document.querySelectorAll('[role="tab"]');
          if (tabs[i]) tabs[i].click();
        }, tab);
        await new Promise((r) => setTimeout(r, 120));
      }
      checked++;
      for (const row of await page.evaluate(collect)) {
        const key = `${theme}|${row.cls}|${row.color}|${row.bg}`;
        if (!failures.has(key)) failures.set(key, { ...row, theme, routes: new Set() });
        failures.get(key).routes.add(route);
      }
    }
  }
  await page.close();
}

await browser.close();

const rows = [...failures.values()].sort((a, b) => a.ratio - b.ratio);
for (const r of rows) {
  console.log(
    `  ${String(r.ratio).padStart(5)}:1 (need ${r.need}) ${r.theme.padEnd(5)} ${r.px}px  ${r.color} on ${r.bg}`,
  );
  console.log(`        .${r.cls || r.tag}  "${r.text}"  [${[...r.routes].join(' ')}]`);
}

console.log(
  `\n${rows.length} failing combination${rows.length === 1 ? '' : 's'} across ${checked} page renders (${THEMES.join(' + ')}).`,
);
process.exit(rows.length === 0 ? 0 : 1);
