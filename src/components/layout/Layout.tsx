import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Icon } from '@/components/ui/Icon';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { algorithmGroups } from '@/core/registry';
import type { AnyAlgorithm } from '@/core/types';
import styles from './Layout.module.css';

const NAV_KEY = 'cryptolab-nav-collapsed';
/** Below this the sidebar stops being a column and becomes an overlay drawer. */
const DRAWER = '(max-width: 760px)';

const isDrawer = () =>
  typeof window !== 'undefined' && window.matchMedia(DRAWER).matches;

export function Layout() {
  const groups = algorithmGroups();

  /*
   * The algorithm list is navigation, not content. On a wide screen it is a
   * column that can be tucked away to hand its width to the work area; on a
   * narrow one it is an overlay drawer, because a nav list stacked above the
   * content would push the actual page below the fold on every visit.
   *
   * Starts expanded and syncs in an effect, so the prerendered markup and the
   * first client render agree.
   */
  const [navOpen, setNavOpen] = useState(true);

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(NAV_KEY);
    } catch {
      /* storage disabled; fall through to the viewport default */
    }
    // In drawer mode the panel is an overlay, so it always starts closed —
    // the stored preference is about the desktop column, not this.
    if (isDrawer() || stored === '1') setNavOpen(false);
  }, []);

  /*
   * Crossing the breakpoint with the column open would leave a drawer sitting
   * over the page on arrival at a narrow width (rotation, a resized window).
   */
  useEffect(() => {
    const mq = window.matchMedia(DRAWER);
    const onChange = (e: MediaQueryListEvent) => {
      if (e.matches) setNavOpen(false);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Escape closes the drawer, which is the expected way out of an overlay.
  useEffect(() => {
    if (!navOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDrawer()) setNavOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navOpen]);

  function toggleNav() {
    setNavOpen((open) => {
      // Only the desktop column's state is worth remembering; persisting an
      // open drawer would reopen the overlay on the next page load.
      if (!isDrawer()) {
        try {
          localStorage.setItem(NAV_KEY, open ? '1' : '0');
        } catch {
          /* nothing to persist to; the toggle still works for this session */
        }
      }
      return !open;
    });
  }

  /* Following a link on a phone should get the drawer out of the way. */
  function closeIfDrawer() {
    if (isDrawer()) setNavOpen(false);
  }

  return (
    <div className={`${styles.shell} ${navOpen ? '' : styles.navCollapsed}`}>
      <a href="#main" className="skip-link">
        Skip to content
      </a>

      <header className={styles.topbar}>
        <button
          type="button"
          className={styles.navButton}
          onClick={toggleNav}
          aria-expanded={navOpen}
          aria-controls="algorithm-nav"
          title={navOpen ? 'Hide algorithm list' : 'Show algorithm list'}
        >
          <span className="sr-only">
            {navOpen ? 'Hide algorithm list' : 'Show algorithm list'}
          </span>
          <Icon name="sidebar" size={17} />
        </button>

        <NavLink to="/" className={styles.brand}>
          <span className={styles.brandMark}>▚</span>
          <span className={styles.brandName}>CryptoLab</span>
        </NavLink>
        <span className={styles.tagline}>cryptography, one step at a time</span>
        <div className={styles.topbarRight}>
          <ThemeToggle />
        </div>
      </header>

      <div className={styles.body}>
        {/* Only ever visible in drawer mode; CSS hides it on wide screens. */}
        <button
          type="button"
          className={styles.scrim}
          onClick={() => setNavOpen(false)}
          tabIndex={-1}
          aria-hidden="true"
        />

        <nav
          id="algorithm-nav"
          className={styles.sidebar}
          aria-label="Algorithms"
          {...(navOpen ? {} : { inert: true })}
        >
          {groups.map((g) => (
            <NavAccordion
              key={g.id}
              title={g.title}
              items={g.items}
              onNavigate={closeIfDrawer}
            />
          ))}
        </nav>

        <main id="main" className={styles.main}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function NavAccordion({
  title,
  items,
  onNavigate,
}: {
  title: string;
  items: AnyAlgorithm[];
  onNavigate?: () => void;
}) {
  // Groups start expanded; each can then be freely collapsed by the user.
  const [open, setOpen] = useState(true);
  const panelId = `nav-panel-${title.toLowerCase()}`;

  return (
    <div className={styles.navGroup}>
      <button
        type="button"
        className={styles.navToggle}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
      >
        <span className={styles.navTitle}>{title}</span>
        <span className={styles.navCount}>{items.length}</span>
        <svg
          className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`}
          viewBox="0 0 12 12"
          width="12"
          height="12"
          aria-hidden="true"
        >
          <path
            d="M2.5 4.5 6 8l3.5-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <div
        id={panelId}
        className={`${styles.navPanel} ${open ? styles.navPanelOpen : ''}`}
        // Collapsed content is removed from tab order & the a11y tree.
        {...(!open ? { inert: true } : {})}
      >
        <ul className={styles.navList}>
          {items.map((a) => (
            <li key={a.meta.id}>
              <NavLink
                to={`/a/${a.meta.id}`}
                onClick={onNavigate}
                className={({ isActive }) =>
                  `${styles.navLink} ${isActive ? styles.navActive : ''}`
                }
              >
                <span className={styles.navLinkName}>{a.meta.name}</span>
                {a.meta.era && (
                  <span className={styles.navEra}>{a.meta.era}</span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
