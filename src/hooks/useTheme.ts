import { useCallback, useEffect, useState } from 'react';

export type ThemePreference = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'cryptolab-theme';
const ORDER: ThemePreference[] = ['system', 'light', 'dark'];

function read(): ThemePreference {
  if (typeof document === 'undefined') return 'system';
  const attr = document.documentElement.getAttribute('data-theme');
  return attr === 'light' || attr === 'dark' ? attr : 'system';
}

function apply(pref: ThemePreference) {
  const root = document.documentElement;
  if (pref === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', pref);

  try {
    if (pref === 'system') localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, pref);
  } catch {
    /* storage disabled: the choice simply won't persist across reloads */
  }
}

/**
 * Theme preference, tri-state: follow the system, or pin light/dark.
 *
 * The actual colours come from `light-dark()` in tokens.css reacting to
 * `color-scheme`, so all this has to do is own the `data-theme` attribute.
 * The attribute is already set before first paint by the inline script in
 * index.html; we start at 'system' and sync in an effect so the prerendered
 * markup and the first client render agree (no hydration mismatch). Only the
 * toggle's own icon settles a frame late, never the page colours.
 */
export function useTheme() {
  const [preference, setPreference] = useState<ThemePreference>('system');

  useEffect(() => {
    setPreference(read());
  }, []);


  const cycleTheme = useCallback(() => {
    setPreference((current) => {
      const next = ORDER[(ORDER.indexOf(current) + 1) % ORDER.length];
      apply(next);
      return next;
    });
  }, []);

  // `setTheme` is deliberately not returned: the toggle cycles, and an unused
  // second way to set the same state is how the two drift apart.
  return { preference, cycleTheme };
}
