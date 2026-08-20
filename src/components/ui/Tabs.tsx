/**
 * Tab set with roving focus and arrow-key navigation.
 *
 * Every panel stays in the rendered markup, inactive ones carry `hidden`
 * rather than being conditionally rendered, because these pages are
 * prerendered and the prose in them (overview, history, weaknesses) is the
 * substance a search engine has to see. Conditional rendering would ship a
 * static page containing a quarter of its own content.
 */

import { useId, useRef, useState, type ReactNode } from 'react';
import styles from './Tabs.module.css';

export interface TabSpec {
  id: string;
  label: string;
  content: ReactNode;
}

export function Tabs({ tabs, label }: { tabs: TabSpec[]; label: string }) {
  const [active, setActive] = useState(0);
  const baseId = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  function focusTab(i: number) {
    const next = (i + tabs.length) % tabs.length;
    setActive(next);
    refs.current[next]?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault();
        focusTab(active + 1);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        focusTab(active - 1);
        break;
      case 'Home':
        e.preventDefault();
        focusTab(0);
        break;
      case 'End':
        e.preventDefault();
        focusTab(tabs.length - 1);
        break;
    }
  }

  return (
    <div className={styles.tabs}>
      <div
        className={styles.list}
        role="tablist"
        aria-label={label}
        onKeyDown={onKeyDown}
      >
        {tabs.map((t, i) => (
          <button
            key={t.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            id={`${baseId}-tab-${t.id}`}
            className={`${styles.tab} ${i === active ? styles.tabOn : ''}`}
            role="tab"
            type="button"
            aria-selected={i === active}
            aria-controls={`${baseId}-panel-${t.id}`}
            // Roving tabindex: one stop for the whole set, arrows move within.
            tabIndex={i === active ? 0 : -1}
            onClick={() => setActive(i)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tabs.map((t, i) => (
        <div
          key={t.id}
          id={`${baseId}-panel-${t.id}`}
          className={styles.panel}
          role="tabpanel"
          aria-labelledby={`${baseId}-tab-${t.id}`}
          hidden={i !== active}
          tabIndex={0}
        >
          {t.content}
        </div>
      ))}
    </div>
  );
}
