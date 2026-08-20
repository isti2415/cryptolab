/**
 * The atom every visualization is built from: one box holding one unit of
 * cryptographic material: a letter, a nibble, a byte, a matrix entry.
 *
 * Its `state` vocabulary is deliberately shared across all algorithms so the
 * colours mean the same thing everywhere. A learner who has worked out that
 * amber is key material on the Caesar page should not have to re-learn it on
 * the AES page. The palette behind these lives in `--cat-1…5` in tokens.css.
 */

import type { ReactNode } from 'react';
import styles from './Cell.module.css';

export type CellState =
  /** Ordinary data, nothing special about it right now. */
  | 'idle'
  /** The thing this step is about. */
  | 'active'
  /** Already processed; context, not the current concern. */
  | 'done'
  /** Changed since the previous step. */
  | 'changed'
  /** Key material. */
  | 'key'
  /** Derived from the key (round keys, subkeys, inverses). */
  | 'derived'
  /** Produced output. */
  | 'output'
  /** Discarded by the algorithm (e.g. DES parity bits). */
  | 'dropped'
  /** Present but deliberately de-emphasised. */
  | 'muted'
  /** Not yet filled in. */
  | 'empty';

export interface CellProps {
  children?: ReactNode;
  state?: CellState;
  /** Small corner annotation: an index, a bit position, a coordinate. */
  sub?: ReactNode;
  /** Overrides the default square sizing; any CSS length. */
  size?: string;
  /**
   * Lets the cell shrink below its natural width so a fixed number of them can
   * share a row without overflowing. Used by the alphabet strips, where showing
   * all 26 letters matters more than each one being comfortably wide.
   */
  fluid?: boolean;
  title?: string;
  className?: string;
}

export function Cell({
  children,
  state = 'idle',
  sub,
  size,
  fluid,
  title,
  className = '',
}: CellProps) {
  return (
    <span
      className={`${styles.cell} ${styles[state]} ${fluid ? styles.fluid : ''} ${className}`}
      style={size ? { minWidth: size, height: size } : undefined}
      title={title}
    >
      <span className={styles.value}>{children}</span>
      {sub != null && <span className={styles.sub}>{sub}</span>}
    </span>
  );
}
