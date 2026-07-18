import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { algorithmsByCategory } from '@/core/registry';
import type { AnyAlgorithm } from '@/core/types';
import styles from './Layout.module.css';

export function Layout() {
  const { classical, modern } = algorithmsByCategory();
  const groups = [
    { title: 'Classical', items: classical },
    { title: 'Modern', items: modern },
  ].filter((g) => g.items.length > 0);

  return (
    <div className={styles.shell}>
      <a href="#main" className="skip-link">
        Skip to content
      </a>

      <header className={styles.topbar}>
        <NavLink to="/" className={styles.brand}>
          <span className={styles.brandMark}>▚</span>
          <span className={styles.brandName}>CryptoLab</span>
        </NavLink>
        <span className={styles.tagline}>cryptography, one step at a time</span>
      </header>

      <div className={styles.body}>
        <nav className={styles.sidebar} aria-label="Algorithms">
          {groups.map((g) => (
            <NavAccordion key={g.title} title={g.title} items={g.items} />
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
}: {
  title: string;
  items: AnyAlgorithm[];
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
