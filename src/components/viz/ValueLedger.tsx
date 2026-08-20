/**
 * Named quantities with their values, lit when the current step touches them.
 *
 * Public-key schemes have no block of data to watch move around; what they have
 * is a handful of numbers with roles (secret, public, derived). Showing which
 * of them a step is reading is the closest thing RSA, Diffie–Hellman and ML-KEM
 * have to "watch the machinery turn".
 */

import type { ReactNode } from 'react';
import styles from './ValueLedger.module.css';

export interface LedgerRow {
  key: string;
  /** e.g. "n = p·q" */
  label: ReactNode;
  value: ReactNode;
  /** Marks the value as key material that must stay private. */
  secret?: boolean;
  /** Lit because this step reads or produces it. */
  active?: boolean;
  /** Longer-form note shown under the value. */
  note?: ReactNode;
}

export function ValueLedger({ rows }: { rows: LedgerRow[] }) {
  return (
    <dl className={styles.ledger}>
      {rows.map((r) => (
        <div
          key={r.key}
          className={`${styles.row} ${r.active ? styles.on : ''}`}
        >
          <dt className={styles.label}>
            {r.label}
            {r.secret && (
              <>
                {/* A marker, not text: the meaning lives in the label beside
                    it, so the dot itself is exempt from text contrast. */}
                <span className={styles.lock} aria-hidden="true">
                  ●
                </span>
                <span className="sr-only">(secret)</span>
              </>
            )}
          </dt>
          <dd className={styles.value}>
            {r.value}
            {r.note && <span className={styles.note}>{r.note}</span>}
          </dd>
        </div>
      ))}
    </dl>
  );
}
