/**
 * Site-wide constants and SEO helpers.
 *
 * `SITE_URL` is the single source of truth for absolute URLs (canonical tags,
 * Open Graph, sitemap, JSON-LD). Override it at build time with VITE_SITE_URL
 * when a custom domain is attached — e.g. `VITE_SITE_URL=https://cryptolab.dev`.
 * The postbuild sitemap script reads the same value from `SITE_URL`.
 */

const DEFAULT_SITE_URL = 'https://cryptolab-3db.pages.dev';

/** Absolute origin, no trailing slash. */
export const SITE_URL = (
  import.meta.env.VITE_SITE_URL || DEFAULT_SITE_URL
).replace(/\/$/, '');

export const SITE_NAME = 'CryptoLab';

export const SITE_TAGLINE = 'cryptography, one step at a time';

export const SITE_DESCRIPTION =
  'Learn cryptography by watching real algorithms transform real input into real output, step by step — then experiment yourself in a live playground. Caesar, Vigenère, AES, RSA and more.';

/** Default social share image (1200×630). Lives in /public. */
export const OG_IMAGE_PATH = '/og.png';

export const TWITTER_HANDLE = ''; // set if/when an account exists, e.g. '@cryptolab'

/** Build an absolute URL from a root-relative path. */
export function absoluteUrl(path: string): string {
  if (!path.startsWith('/')) path = `/${path}`;
  return `${SITE_URL}${path}`;
}
