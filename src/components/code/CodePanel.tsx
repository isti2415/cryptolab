/**
 * The implementation, shown beside the algorithm it implements.
 *
 * Two tabs: a hand-written Python version, which is what most visitors will
 * actually read, and the TypeScript engine driving the page, imported raw, so
 * it cannot drift from what produced the output on screen.
 *
 * Comments are stripped at build time (see `plugins/stripComments.ts`). The
 * repo keeps them; the panel shows the algorithm. Reading a cipher and reading
 * prose about a cipher are different activities, and the page already has
 * somewhere for the prose.
 */

import { useId, useRef, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import type { CodeSample } from '@/core/types';
import styles from './CodePanel.module.css';

/*
 * The tab semantics are implemented here rather than by reusing `ui/Tabs`,
 * which owns its own chrome and renders every panel: this panel is a header
 * bar with a copy button and one `<pre>` body. The ARIA contract is the same
 * one `ui/Tabs` implements, and it has to be complete — a `role="tab"` without
 * roving focus, arrow keys and a matching `tabpanel` is worse than no role at
 * all, because it promises a screen-reader user an interaction that isn't there.
 */
export function CodePanel({ samples }: { samples: CodeSample[] }) {
  const [activeLang, setActiveLang] = useState(0);
  const [copied, setCopied] = useState(false);
  const baseId = useId();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const tabId = (i: number) => `${baseId}-tab-${i}`;
  const panelId = `${baseId}-panel`;

  function focusTab(i: number) {
    const next = (i + samples.length) % samples.length;
    setActiveLang(next);
    tabRefs.current[next]?.focus();
  }

  function onTabKeyDown(e: React.KeyboardEvent) {
    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault();
        focusTab(activeLang + 1);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        focusTab(activeLang - 1);
        break;
      case 'Home':
        e.preventDefault();
        focusTab(0);
        break;
      case 'End':
        e.preventDefault();
        focusTab(samples.length - 1);
        break;
    }
  }

  const sample = samples[Math.min(activeLang, samples.length - 1)];
  if (!sample) return null;

  async function copy() {
    try {
      await navigator.clipboard.writeText(sample.source);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      /* clipboard unavailable; the source is selectable regardless */
    }
  }

  const lines = sample.source.split('\n');

  return (
    <div className={styles.panel}>
      <div className={styles.head}>
        <div
          className={styles.langs}
          role="tablist"
          aria-label="Language"
          onKeyDown={onTabKeyDown}
        >
          {samples.map((s, i) => (
            <button
              key={s.lang}
              id={tabId(i)}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              role="tab"
              type="button"
              aria-selected={i === activeLang}
              aria-controls={panelId}
              // Roving tabindex: the tablist is one stop, arrows move within it.
              tabIndex={i === activeLang ? 0 : -1}
              className={`${styles.lang} ${i === activeLang ? styles.langOn : ''}`}
              onClick={() => setActiveLang(i)}
              title={s.path}
            >
              {s.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          className={`${styles.copy} ${copied ? styles.copied : ''}`}
          onClick={copy}
          title="Copy source"
          aria-label="Copy source"
        >
          <Icon name={copied ? 'check' : 'copy'} size={13} />
        </button>
      </div>

      {/* tabIndex makes the horizontally scrollable listing reachable by keyboard. */}
      <pre
        id={panelId}
        role="tabpanel"
        aria-labelledby={tabId(activeLang)}
        className={styles.pre}
        tabIndex={0}
      >
        <code>
          {lines.map((line, i) => (
            <span key={i} className={styles.line}>
              <span className={styles.gutter} aria-hidden="true">
                {i + 1}
              </span>
              <span className={styles.text}>{line || ' '}</span>
            </span>
          ))}
        </code>
      </pre>

      <div className={styles.foot}>
        <span className={styles.path}>{sample.path}</span>
      </div>
    </div>
  );
}
