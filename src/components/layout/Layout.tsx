import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Icon } from "@/components/ui/Icon";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { algorithmGroups } from "@/core/registry";
import { SITE_TAGLINE } from "@/core/site";
import type { AlgorithmEntry } from "@/core/types";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Footer } from "./Footer";
import styles from "./Layout.module.css";

const NAV_KEY = "cryptolab-nav-collapsed";
/** Below this the sidebar stops being a column and becomes an overlay drawer. */
const DRAWER = "(max-width: 760px)";

const isDrawer = () =>
  typeof window !== "undefined" && window.matchMedia(DRAWER).matches;

export function Layout() {
  const groups = algorithmGroups();

  /*
   * The landing page is the one route that is not the app. It carries its own
   * full catalogue, so an algorithm sidebar beside it would be a second copy of
   * the same list competing with the hero for the width the hero needs.
   */
  const isLanding = useLocation().pathname === "/";

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
    if (isDrawer() || stored === "1") setNavOpen(false);
  }, []);

  /*
   * Whether the sidebar is currently an overlay rather than a column. Tracked
   * in state, not read imperatively, because the focus handling below has to
   * re-run when the viewport crosses the breakpoint.
   */
  const [drawerMode, setDrawerMode] = useState(false);

  /*
   * Crossing the breakpoint with the column open would leave a drawer sitting
   * over the page on arrival at a narrow width (rotation, a resized window).
   */
  useEffect(() => {
    const mq = window.matchMedia(DRAWER);
    const sync = () => {
      setDrawerMode(mq.matches);
      if (mq.matches) setNavOpen(false);
    };
    setDrawerMode(mq.matches);
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const navRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  /** True only when the sidebar is an overlay covering the page. */
  const drawerOpen = drawerMode && navOpen && !isLanding;

  /*
   * An overlay that leaves the page behind it focusable is a trap of the worst
   * kind: tab moves the caret through content the user cannot see. So while the
   * drawer is open `<main>` is inert, focus moves into the drawer, and closing
   * it hands focus back to the button that opened it.
   *
   * The topbar deliberately stays live: that toggle is the drawer's close
   * control (`aria-expanded` and all), and inerting it would leave a keyboard
   * user with no visible way out but the Escape key.
   */
  useEffect(() => {
    if (!drawerOpen) return;
    const nav = navRef.current;
    /*
     * Focus the panel itself rather than its first link. The accordions start
     * collapsed and collapsed panels are `inert`, so the first anchor in the
     * markup is usually unfocusable and `.focus()` on it silently does nothing.
     * Focusing the container is also what a screen reader wants: it announces
     * the nav's own label before the list, rather than dropping the user onto
     * an item with no idea where they are.
     */
    /*
     * Next frame, not this one. The drawer is mid-transition when the effect
     * fires and `focus()` on a not-yet-visible element is silently dropped,
     * which is exactly the bug this effect exists to fix.
     */
    const frame = requestAnimationFrame(() => nav?.focus());
    return () => {
      cancelAnimationFrame(frame);
      // Only reclaim focus if it is still inside the drawer being closed;
      // following a link has already moved it somewhere more useful.
      if (nav?.contains(document.activeElement)) toggleRef.current?.focus();
    };
  }, [drawerOpen]);

  // Escape closes the drawer, which is the expected way out of an overlay.
  useEffect(() => {
    if (!navOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isDrawer()) setNavOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navOpen]);

  function toggleNav() {
    setNavOpen((open) => {
      // Only the desktop column's state is worth remembering; persisting an
      // open drawer would reopen the overlay on the next page load.
      if (!isDrawer()) {
        try {
          localStorage.setItem(NAV_KEY, open ? "1" : "0");
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
    <div
      className={[
        styles.shell,
        navOpen ? "" : styles.navCollapsed,
        isLanding ? styles.landing : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <a href="#main" className="skip-link">
        Skip to content
      </a>

      <header className={styles.topbar}>
        <div className={styles.bar}>
          {!isLanding && (
            <button
              type="button"
              ref={toggleRef}
              className={styles.navButton}
              onClick={toggleNav}
              aria-expanded={navOpen}
              aria-controls="algorithm-nav"
              title={navOpen ? "Hide algorithm list" : "Show algorithm list"}
            >
              <span className="sr-only">
                {navOpen ? "Hide algorithm list" : "Show algorithm list"}
              </span>
              <Icon name="sidebar" size={17} />
            </button>
          )}

          <NavLink to="/" className={styles.brand}>
            <span className={styles.brandMark}>▚</span>
            <span className={styles.brandName}>CryptoLab</span>
          </NavLink>
          <span className={styles.tagline}>{SITE_TAGLINE}</span>
          <div className={styles.topbarRight}>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className={styles.body}>
        {!isLanding && (
          <>
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
              ref={navRef}
              className={styles.sidebar}
              aria-label="Algorithms"
              // Programmatic focus target when it opens as a drawer; not a tab stop.
              tabIndex={-1}
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
          </>
        )}

        <main
          id="main"
          className={styles.main}
          {...(drawerOpen ? { inert: true } : {})}
        >
          {/*
            Outer net. The walkthrough has its own, tighter boundary; this one
            only catches a failure in the page shell itself, where the
            alternative is a blank document with no way back.
          */}
          <ErrorBoundary
            fallback={
              <div className={styles.pageFailed} role="alert">
                <h1>Something went wrong on this page.</h1>
                <p>
                  Reloading usually clears it. If it keeps happening, the
                  algorithm list in the sidebar still works.
                </p>
              </div>
            }
          >
            <Outlet />
          </ErrorBoundary>
          <Footer />
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
  items: AlgorithmEntry[];
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
        <span className={`${styles.chevron} ${open ? styles.chevronOpen : ""}`}>
          <Icon name="chevron" size={12} />
        </span>
      </button>

      <div
        id={panelId}
        className={`${styles.navPanel} ${open ? styles.navPanelOpen : ""}`}
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
                  `${styles.navLink} ${isActive ? styles.navActive : ""}`
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
