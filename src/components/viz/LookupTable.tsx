/**
 * A substitution table with a row/column crosshair on the active lookup.
 *
 * This is the shape of the AES S-box (16×16), a DES S-box (4×16) and the
 * Vigenère tableau (26×26) alike. Rendering the whole table and pointing at the
 * cell being read is the difference between "a byte turned into another byte"
 * and "the S-box maps 0x53 to 0xED, and here is where that lives".
 */

import { useEffect, useRef } from 'react';
import { describeLookup } from './describe';
import styles from './LookupTable.module.css';

interface LookupTableProps {
  /** rows[r][c]: the table body. */
  rows: string[][];
  rowHeaders: string[];
  colHeaders: string[];
  /** The cell being read this step. */
  active?: { row: number; col: number };
  /** Corner label, e.g. "S" or the key letter axis. */
  corner?: string;
  /** Shrinks type for large tables (26×26 needs it, 4×16 does not). */
  dense?: boolean;
}

export function LookupTable({
  rows,
  rowHeaders,
  colHeaders,
  active,
  corner = '',
  dense = false,
}: LookupTableProps) {
  const hitRef = useRef<HTMLTableCellElement>(null);

  /*
   * Bring the looked-up cell into view. Without this the Vigenère tableau, 
   * 26 rows inside a scroll box a third that tall, sat parked at row A while
   * the highlight it exists to show was somewhere below the fold.
   */
  const activeRow = active?.row;
  const activeCol = active?.col;
  // activeRow/activeCol are change triggers, not values the body reads:
  // dropping them would run this once on mount and never follow the
  // highlight again.
  // biome-ignore lint/correctness/useExhaustiveDependencies: see above.
  useEffect(() => {
    hitRef.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [activeRow, activeCol]);

  // The wrapper scrolls, so it needs a tab stop or keyboard users cannot pan
  // the tableau at all (WCAG 2.1.1).
  /*
   * The table itself is already good for a screen reader: real <th scope>
   * headers mean a user can walk it and hear "row E, column 3". What was
   * missing is the answer to "which cell is this step reading?", which the
   * highlight conveys visually and nothing conveyed otherwise. A caption
   * states it outright; the S-box lookups in DES and AES are the whole point
   * of the step they appear in.
   */
  const lookup =
    active && rows[active.row]?.[active.col] !== undefined
      ? describeLookup(
          corner,
          rowHeaders[active.row],
          colHeaders[active.col],
          rows[active.row][active.col],
        )
      : undefined;

  return (
    <div className={styles.wrap} tabIndex={0}>
      <table className={`${styles.table} ${dense ? styles.dense : ''}`}>
        {lookup && <caption className="sr-only">{lookup}</caption>}
        <thead>
          <tr>
            <th className={styles.corner} scope="col">
              {corner}
            </th>
            {colHeaders.map((h, c) => (
              <th
                key={c}
                scope="col"
                className={`${styles.head} ${active?.col === c ? styles.headOn : ''}`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, r) => (
            <tr key={r}>
              <th
                scope="row"
                className={`${styles.head} ${active?.row === r ? styles.headOn : ''}`}
              >
                {rowHeaders[r]}
              </th>
              {row.map((v, c) => {
                const onRow = active?.row === r;
                const onCol = active?.col === c;
                const hit = onRow && onCol;
                return (
                  <td
                    key={c}
                    ref={hit ? hitRef : undefined}
                    className={`${styles.cell} ${
                      hit ? styles.hit : onRow || onCol ? styles.cross : ''
                    }`}
                    aria-current={hit ? 'true' : undefined}
                  >
                    {v}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
