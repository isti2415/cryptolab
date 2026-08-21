/**
 * Three aligned rows (A, B, and A ⊕ B), with each output cell coloured by
 * which input flipped it.
 *
 * XOR is the single most reused operation in the whole field (DES's Feistel
 * round, AES's AddRoundKey, the one-time pad, HMAC's ipad/opad, ChaCha20), and
 * it is invisible when rendered as a hex string that simply changes. Showing
 * the two operands stacked over the result makes "the key is what changed
 * these bytes" a thing you can see rather than a thing you're told.
 */

import { Cell } from './Cell';
import type { CellState } from './Cell';
import { describeCells } from './describe';
import styles from './XorLane.module.css';

interface XorLaneProps {
  a: string[];
  b: string[];
  result: string[];
  labels?: { a?: string; b?: string; result?: string };
  /** Role colour for the second operand, usually key material. */
  bState?: CellState;
  /** Index to spotlight across all three rows. */
  activeIndex?: number;
  size?: string;
  groupEvery?: number;
}

export function XorLane({
  a,
  b,
  result,
  labels,
  bState = 'key',
  activeIndex,
  size,
  groupEvery,
}: XorLaneProps) {
  const rows: { label: string; values: string[]; state: CellState }[] = [
    { label: labels?.a ?? 'a', values: a, state: 'idle' },
    { label: labels?.b ?? 'b', values: b, state: bState },
    { label: labels?.result ?? 'a ⊕ b', values: result, state: 'output' },
  ];

  return (
    <div className={styles.lane}>
      {rows.map((row, r) => (
        <div className={styles.row} key={row.label}>
          <span className={styles.label}>
            {r === 2 && <span className={styles.op}>⊕</span>}
            {row.label}
          </span>
          {/* One label per lane; see BitField. Scrollable, so also a tab stop. */}
          <div
            className={styles.cells}
            tabIndex={0}
            role="img"
            aria-label={describeCells(row.label, row.values, { groupEvery })}
          >
            {row.values.map((v, i) => (
              <span
                key={i}
                className={
                  groupEvery && i > 0 && i % groupEvery === 0
                    ? styles.gap
                    : undefined
                }
              >
                <Cell
                  size={size}
                  state={i === activeIndex ? 'active' : row.state}
                >
                  {v}
                </Cell>
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
