/**
 * A generic cell grid for matrix/table visualizations: the Playfair 5×5 key
 * square, the Hill key matrix and vectors, and the AES 4×4 state. Each cell
 * carries an optional highlight state so callers can emphasize the rows,
 * columns, or bytes involved in the current step.
 */

import styles from './Grid.module.css';

export type CellState = 'normal' | 'primary' | 'secondary' | 'muted';

export interface GridCell {
  text: string;
  state?: CellState;
  /** Small superscript / sublabel (e.g. a hex index or coordinate). */
  sub?: string;
}

export interface GridProps {
  cells: GridCell[][];
  /** Fixed cell size in em; defaults to a comfortable square. */
  size?: number;
  gap?: number;
  ariaLabel?: string;
  mono?: boolean;
}

export function Grid({ cells, size = 2.4, gap = 4, ariaLabel, mono }: GridProps) {
  return (
    <div
      className={styles.gridWrap}
      role="img"
      aria-label={ariaLabel ?? 'grid'}
    >
      <div className={styles.grid} style={{ gap: `${gap}px` }}>
        {cells.map((row, r) => (
          <div key={r} className={styles.row} style={{ gap: `${gap}px` }}>
            {row.map((cell, c) => (
              <span
                key={c}
                className={`${styles.cell} ${styles[cell.state ?? 'normal']} ${mono ? styles.mono : ''}`}
                style={{ width: `${size}em`, height: `${size}em` }}
              >
                <span className={styles.text}>{cell.text}</span>
                {cell.sub && <span className={styles.sub}>{cell.sub}</span>}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
