/**
 * Build preflight: check the origin before anything is compiled.
 *
 * This site has no server, so every absolute URL — canonical tags, Open Graph
 * images, JSON-LD, the sitemap — is baked in at build time from two variables:
 *
 *   VITE_SITE_URL   read by the client/SSG bundle  → the tags inside each page
 *   SITE_URL        read by the postbuild scripts  → sitemap.xml and robots.txt
 *
 * They are separate because they are read by separate processes, and that is
 * exactly the trap: setting only one produces a build where the sitemap and the
 * pages it lists disagree about what this site is called. Nothing downstream
 * notices, and the damage is invisible until a crawler acts on it.
 *
 * Leaving both unset is fine and is the normal case: the production origin is
 * committed as the default in `src/core/site.ts`. This checks the *override*,
 * which is what a custom domain or a staging build uses.
 *
 * A broken override is fatal wherever it happens, because there is no reading
 * of "https:/example.com" or of two origins that disagree that is worth
 * guessing at. Running before `tsc` and `vite` means that failure costs seconds
 * rather than a full build.
 */

const problems = [];

/** Returns a normalised origin, `null` if unset, or records why it is unusable. */
function check(name, raw) {
  // Unset is not a problem: the committed default takes over.
  if (!raw?.trim()) return null;
  const value = raw.trim();

  if (!/^https?:\/\//i.test(value)) {
    problems.push(
      `${name} is "${value}", which has no scheme.\n` +
        `      It must start with https://, e.g. https://${value}\n` +
        '      Without it every canonical tag and share-card URL is emitted as\n' +
        '      a relative-looking string that resolves to nothing.',
    );
    return null;
  }

  if (!/^https:\/\//i.test(value)) {
    problems.push(`${name} is "${value}". Use https:// for a public origin.`);
    return null;
  }

  let url;
  try {
    url = new URL(value);
  } catch {
    problems.push(`${name} is "${value}", which is not a valid URL.`);
    return null;
  }

  if (url.pathname !== '/' || url.search || url.hash) {
    problems.push(
      `${name} is "${value}". It must be a bare origin with no path, ` +
        `e.g. ${url.origin}`,
    );
    return null;
  }

  return url.origin;
}

const siteSet = Boolean(process.env.SITE_URL?.trim());
const viteSet = Boolean(process.env.VITE_SITE_URL?.trim());
const site = check('SITE_URL', process.env.SITE_URL);
const vite = check('VITE_SITE_URL', process.env.VITE_SITE_URL);

// Half an override is the dangerous state: the two are read by different
// processes, so the sitemap would list URLs the pages themselves do not claim,
// and nothing downstream would notice.
if (siteSet !== viteSet) {
  problems.push(
    `Only ${siteSet ? 'SITE_URL' : 'VITE_SITE_URL'} is set. Set both, or neither.\n` +
      '      SITE_URL is read by the postbuild scripts (sitemap, robots.txt);\n' +
      '      VITE_SITE_URL is read by the bundle (canonical tags, Open Graph).',
  );
} else if (site && vite && site !== vite) {
  problems.push(
    `SITE_URL (${site}) and VITE_SITE_URL (${vite}) disagree.\n` +
      '      The sitemap would list URLs that the pages themselves do not claim.',
  );
}

if (problems.length === 0) {
  console.log(
    site
      ? `\n  Building for ${site} (from SITE_URL)\n`
      : '\n  Building for the default origin in src/core/site.ts.\n' +
          '  Set SITE_URL and VITE_SITE_URL to build for somewhere else.\n',
  );
  process.exit(0);
}

console.error(
  '\n  \u2717 The site origin override is not usable:\n\n' +
    problems.map((p) => `    \u2022 ${p}`).join('\n') +
    '\n\n    Both must be a bare https origin and must match, e.g.\n' +
    '      SITE_URL       = https://example.com\n' +
    '      VITE_SITE_URL  = https://example.com\n\n' +
    '    On Workers Builds these go under Settings \u2192 Build \u2192 Variables and\n' +
    "    Secrets, not the Worker's own runtime Variables and Secrets screen.\n" +
    '    Unset them entirely to use the committed production origin.\n',
);
process.exit(1);
