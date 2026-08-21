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
 * So both are validated, together, before `tsc` and `vite` have done any work:
 * a misconfigured deploy should fail in seconds with an actionable message, not
 * after a full build with a misleading one.
 *
 * Enforcement is conditional. On Workers Builds (`WORKERS_CI`, set only there)
 * a bad origin is fatal, because that build is about to be published. Locally
 * and in GitHub CI it is a warning, so `pnpm build` on a laptop still works.
 */

const isDeploy = Boolean(process.env.WORKERS_CI);
const problems = [];

/** Returns a normalised origin, or records why the value is unusable. */
function check(name, raw) {
  if (!raw || !raw.trim()) {
    problems.push(`${name} is not set.`);
    return null;
  }
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

const site = check('SITE_URL', process.env.SITE_URL);
const vite = check('VITE_SITE_URL', process.env.VITE_SITE_URL);

if (site && vite && site !== vite) {
  problems.push(
    `SITE_URL (${site}) and VITE_SITE_URL (${vite}) disagree.\n` +
      '      The sitemap would list URLs that the pages themselves do not claim.',
  );
}

if (problems.length === 0) {
  if (site) console.log(`\n  Building for ${site}\n`);
  process.exit(0);
}

const bullet = problems.map((p) => `    • ${p}`).join('\n');

if (!isDeploy) {
  console.warn(
    `\n  ⚠ Origin not configured; absolute URLs will use the development` +
      `\n    placeholder. Fine locally, wrong for anything published.\n\n${bullet}\n`,
  );
  process.exit(0);
}

console.error(
  '\n  ✗ Cannot build for deployment: the site origin is not usable.\n\n' +
    `${bullet}\n\n` +
    '    Set BOTH of these as *build* variables — Workers → cryptolab →\n' +
    '    Settings → Build → Variables and Secrets. The runtime "Variables and\n' +
    '    Secrets" section on the Worker itself is a different thing and is not\n' +
    '    visible to the build.\n\n' +
    '      SITE_URL       = https://<your-origin>\n' +
    '      VITE_SITE_URL  = https://<your-origin>\n',
);
process.exit(1);
