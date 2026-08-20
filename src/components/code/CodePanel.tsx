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

import { useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import type { CodeSample } from '@/core/types';
import styles from './CodePanel.module.css';

export function CodePanel({ samples }: { samples: CodeSample[] }) {
  const [activeLang, setActiveLang] = useState(0);
  const [copied, setCopied] = useState(false);

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
        <div className={styles.langs} role="tablist" aria-label="Language">
          {samples.map((s, i) => (
            <button
              key={s.lang}
              role="tab"
              type="button"
              aria-selected={i === activeLang}
              className={`${styles.lang} ${i === activeLang ? styles.langOn : ''}`}
              onClick={() => setActiveLang(i)}
              title={s.path}
            >
              {s.label}
            </button>
          ))}
        </div>
        <button
          className={`${styles.copy} ${copied ? styles.copied : ''}`}
          onClick={copy}
          title="Copy source"
          aria-label="Copy source"
        >
          <Icon name={copied ? 'check' : 'copy'} size={13} />
        </button>
      </div>

      <pre className={styles.pre} tabIndex={0}>
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
