/**
 * A vector or matrix of polynomials, laid out as rows of coefficients.
 *
 * Module lattice schemes work over vectors of polynomials, and the shape of
 * that data is the thing people find hardest to hold onto, "a rank-2 module
 * over a degree-8 ring" is two rows of eight numbers, and seeing it as such
 * removes most of the mystery.
 */

import { Cell, type CellState } from './Cell';
import styles from './PolyVecGrid.module.css';

interface PolyVecGridProps {
  /** Rows of coefficients. */
  rows: number[][];
  label?: string;
  state?: CellState;
  /** Show coefficients as signed values around zero rather than 0…q−1. */
  centered?: boolean;
  modulus?: number;
  /** Row labels, e.g. s₀ and s₁. */
  rowLabels?: string[];
}

export function PolyVecGrid({
  rows,
  label,
  state = 'idle',
  centered = false,
  modulus = 0,
  rowLabels,
}: PolyVecGridProps) {
  const show = (v: number) => {
    if (!centered || !modulus) return v;
    const r = ((v % modulus) + modulus) % modulus;
    return r > modulus / 2 ? r - modulus : r;
  };

  return (
    <div className={styles.wrap}>
      {label && <span className={styles.label}>{label}</span>}
      <div className={styles.rows}>
        {rows.map((row, r) => (
          <div className={styles.row} key={r}>
            {rowLabels && <span className={styles.rowLabel}>{rowLabels[r]}</span>}
            <div
              className={styles.cells}
              style={{ gridTemplateColumns: `repeat(${row.length}, minmax(0, 1fr))` }}
            >
              {row.map((v, i) => (
                <Cell key={i} fluid state={state}>
                  {show(v)}
                </Cell>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
