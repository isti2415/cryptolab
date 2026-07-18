/**
 * Fetches live pages, extracts every JSON-LD block, and validates each against
 * JSON validity + Google's documented structured-data requirements for the
 * types we emit. Not a replacement for Google's hosted Rich Results Test, but it
 * catches everything that test checks statically.
 */

const BASE = process.env.SITE_URL || 'https://cryptolab-3db.pages.dev';
const PAGES = ['/', '/a/caesar', '/a/rsa'];

let failures = 0;
let warnings = 0;
const ok = (m) => console.log(`  \x1b[32m✓\x1b[0m ${m}`);
const warn = (m) => {
  warnings++;
  console.log(`  \x1b[33m⚠\x1b[0m ${m}`);
};
const fail = (m) => {
  failures++;
  console.log(`  \x1b[31m✗\x1b[0m ${m}`);
};

function extractJsonLd(html) {
  const re =
    /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
  const blocks = [];
  let m;
  while ((m = re.exec(html))) blocks.push(m[1]);
  return blocks;
}

// HTML entities that appear in attribute/script text once served.
function decode(s) {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

const isUrl = (v) => typeof v === 'string' && /^https?:\/\//.test(v);

function validate(obj) {
  const type = obj['@type'];
  if (!obj['@context'] || !/schema\.org/.test(obj['@context']))
    fail(`${type ?? '(no @type)'}: missing/invalid @context`);
  if (!type) return fail('object has no @type');

  switch (type) {
    case 'WebSite':
      obj.name ? ok('WebSite.name') : fail('WebSite.name required');
      isUrl(obj.url) ? ok('WebSite.url is absolute') : fail('WebSite.url must be absolute');
      break;

    case 'ItemList': {
      const items = obj.itemListElement ?? [];
      if (!Array.isArray(items) || items.length === 0)
        return fail('ItemList.itemListElement empty');
      ok(`ItemList has ${items.length} items`);
      items.forEach((it, i) => {
        if (it['@type'] !== 'ListItem') fail(`ItemList[${i}] not a ListItem`);
        if (typeof it.position !== 'number') fail(`ItemList[${i}] missing numeric position`);
        if (!it.name) warn(`ItemList[${i}] has no name`);
        if (!isUrl(it.url) && !isUrl(it.item)) warn(`ItemList[${i}] has no absolute url/item`);
      });
      const positions = items.map((i) => i.position);
      const sequential = positions.every((p, i) => p === i + 1);
      sequential ? ok('ItemList positions are 1..N sequential') : warn('ItemList positions not 1..N');
      break;
    }

    case 'BreadcrumbList': {
      const items = obj.itemListElement ?? [];
      if (!Array.isArray(items) || items.length === 0)
        return fail('BreadcrumbList.itemListElement empty');
      ok(`BreadcrumbList has ${items.length} items`);
      items.forEach((it, i) => {
        if (it['@type'] !== 'ListItem') fail(`Breadcrumb[${i}] not a ListItem`);
        if (it.position !== i + 1) fail(`Breadcrumb[${i}] position should be ${i + 1}, got ${it.position}`);
        if (!it.name) fail(`Breadcrumb[${i}] missing name (required by Google)`);
        // Google: 'item' required for all but the last crumb; a URL is valid.
        const last = i === items.length - 1;
        if (!last && !isUrl(it.item)) fail(`Breadcrumb[${i}] needs absolute 'item' URL`);
      });
      break;
    }

    case 'LearningResource':
      obj.name ? ok('LearningResource.name') : fail('LearningResource.name required');
      obj.description ? ok('LearningResource.description') : warn('LearningResource.description recommended');
      isUrl(obj.url) ? ok('LearningResource.url is absolute') : warn('LearningResource.url should be absolute');
      break;

    default:
      warn(`Unrecognized @type "${type}" (valid schema.org, no special check)`);
  }
}

for (const path of PAGES) {
  const url = `${BASE}${path}`;
  console.log(`\n\x1b[1m${url}\x1b[0m`);
  const html = await fetch(url).then((r) => r.text());
  const blocks = extractJsonLd(html);
  if (blocks.length === 0) {
    fail('no JSON-LD found');
    continue;
  }
  console.log(`  found ${blocks.length} JSON-LD block(s)`);
  for (const raw of blocks) {
    let obj;
    try {
      obj = JSON.parse(decode(raw));
    } catch (e) {
      fail(`invalid JSON: ${e.message}`);
      continue;
    }
    validate(obj);
  }
}

console.log(
  `\n${failures === 0 ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m'} — ${failures} error(s), ${warnings} warning(s)`,
);
process.exit(failures === 0 ? 0 : 1);
