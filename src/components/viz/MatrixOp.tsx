/**
 * A matrix expression laid out as one: `[A] × [b] = [c]`, with the dot-product
 * terms that produce each output entry spelled out underneath.
 *
 * Serves the Hill cipher, AES MixColumns and the toy-LWE explainer. The terms
 * matter, without them a matrix multiply is a black box that happens to
 * produce numbers, which is exactly what the Hill page used to be.
 */

import { Cell, type CellState } from './Cell';
import { describeGrid } from './describe';
import styles from './MatrixOp.module.css';

export interface MatrixTerm {
  /** Grid values, row-major. */
  rows: (string | number)[][];
  label?: string;
  state?: CellState;
  /** Highlight a single row/column/entry. */
  highlight?: { row?: number; col?: number };
}

interface MatrixOpProps {
  terms: MatrixTerm[];
  /** Operators between terms; length should be terms.length - 1. */
  operators?: string[];
  /** e.g. ["3·7 + 3·4 = 7 (mod 26)", …]: one per output entry. */
  workings?: string[];
}

function Matrix({ rows, label, state = 'idle', highlight }: MatrixTerm) {
  return (
    <div className={styles.term}>
      {label && <span className={styles.termLabel}>{label}</span>}
      <div className={styles.bracket}>
        {/* Read as one grid; cell by cell a matrix is just a run of numbers. */}
        <div
          className={styles.matrix}
          role="img"
          aria-label={describeGrid(label, rows)}
          style={{ gridTemplateColumns: `repeat(${rows[0]?.length ?? 1}, auto)` }}
        >
          {rows.map((row, r) =>
            row.map((v, c) => {
              const lit =
                (highlight?.row === r && highlight?.col == null) ||
                (highlight?.col === c && highlight?.row == null) ||
                (highlight?.row === r && highlight?.col === c);
              return (
                <Cell key={`${r}-${c}`} state={lit ? 'active' : state}>
                  {v}
                </Cell>
              );
            }),
          )}
        </div>
      </div>
    </div>
  );
}

export function MatrixOp({ terms, operators = [], workings }: MatrixOpProps) {
  return (
    <div className={styles.wrap}>
      <div className={styles.equation}>
        {terms.map((t, i) => (
          <div className={styles.slot} key={i}>
            {i > 0 && (
              <span className={styles.op}>{operators[i - 1] ?? '='}</span>
            )}
            <Matrix {...t} />
          </div>
        ))}
      </div>

      {workings && workings.length > 0 && (
        <ul className={styles.workings}>
          {workings.map((w, i) => (
            <li key={i}>{w}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
