/**
 * A single row of cryptographic units, bits, nibbles, bytes, letters.
 *
 * Does not wrap: a 64-bit DES block read across two lines stops being a block.
 * It scrolls horizontally instead, inside its own container, so the page body
 * never gains a horizontal scrollbar.
 */

import { Cell, type CellState } from './Cell';
import { describeCells, inferUnit } from './describe';
import styles from './BitField.module.css';

export interface BitCell {
  text: string;
  state?: CellState;
  sub?: string;
  title?: string;
}

interface BitFieldProps {
  cells: BitCell[];
  /** Leading label, e.g. "L" or "R". */
  label?: string;
  /** Cell edge length; smaller for dense fields like a 64-bit block. */
  size?: string;
  /** Visually group every N cells; bytes within a block, words within a key. */
  groupEvery?: number;
}

export function BitField({ cells, label, size, groupEvery }: BitFieldProps) {
  return (
    <div className={styles.row}>
      {label && <span className={styles.label}>{label}</span>}
      {/*
        One label for the whole row, and the cells themselves hidden: read
        individually a 64-bit block is sixty-four announcements of a single
        digit. Scrollable, so it also needs a tab stop (WCAG 2.1.1).
      */}
      <div
        className={styles.cells}
        tabIndex={0}
        role="img"
        aria-label={describeCells(
          label,
          cells.map((c) => c.text),
          { groupEvery, unit: inferUnit(cells.map((c) => c.text)) },
        )}
      >
        {cells.map((c, i) => (
          <span
            key={i}
            className={
              groupEvery && i > 0 && i % groupEvery === 0 ? styles.gap : undefined
            }
          >
            <Cell state={c.state} sub={c.sub} size={size} title={c.title}>
              {c.text}
            </Cell>
          </span>
        ))}
      </div>
    </div>
  );
}
