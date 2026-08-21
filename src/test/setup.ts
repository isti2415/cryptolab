/**
 * Runs before every test file. Component tests opt into jsdom per-file with
 * `// @vitest-environment jsdom`; everything here is guarded so the Node-based
 * engine tests are unaffected.
 */

import { afterEach } from 'vitest';

if (typeof window !== 'undefined') {
  const { cleanup } = await import('@testing-library/react');
  afterEach(cleanup);

  /*
   * jsdom implements no media queries at all, and the app reads
   * `prefers-reduced-motion` (StepPlayer, HeroDemo) and the drawer breakpoint
   * (Layout). A stub that always answers "no match" is the right default:
   * tests then exercise the full-motion, wide-viewport path unless they
   * override it.
   */
  if (!window.matchMedia) {
    window.matchMedia = (query: string): MediaQueryList => {
      const list: MediaQueryList = {
        matches: false,
        media: query,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      };
      return list;
    };
  }
}
