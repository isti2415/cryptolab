/**
 * A substitution table with a row/column crosshair on the active lookup.
 *
 * This is the shape of the AES S-box (16×16), a DES S-box (4×16) and the
 * Vigenère tableau (26×26) alike. Rendering the whole table and pointing at the
 * cell being read is the difference between "a byte turned into another byte"
 * and "the S-box maps 0x53 to 0xED, and here is where that lives".
 */

import { useEffect, useRef } from 'react';
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
  useEffect(() => {
    hitRef.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [active?.row, active?.col]);

  return (
    <div className={styles.wrap}>
      <table className={`${styles.table} ${dense ? styles.dense : ''}`}>
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
