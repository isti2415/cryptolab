/**
 * The notation tab: each expression with what it does, plus a glossary.
 *
 * An equation on its own is decoration. The symbols are precisely the part a
 * reader does not already know, so every line carries an explanation and every
 * symbol used gets named.
 */

import type { FormulaLine, SymbolGloss } from '@/core/types';
import styles from './Notation.module.css';

export function Notation({
  formula,
  symbols,
}: {
  formula: FormulaLine[];
  symbols?: SymbolGloss[];
}) {
  return (
    <div className={styles.notation}>
      <ol className={styles.lines}>
        {formula.map((f) => (
          <li className={styles.line} key={f.label}>
            <span className={styles.label}>{f.label}</span>
            {/* Scrollable: long expressions overflow; needs a tab stop (WCAG 2.1.1). */}
            <code className={styles.expr} tabIndex={0}>
              {f.expr}
            </code>
            <p className={styles.note}>{f.note}</p>
          </li>
        ))}
      </ol>

      {symbols && symbols.length > 0 && (
        <div className={styles.glossary}>
          <h4 className={styles.glossaryTitle}>Symbols</h4>
          <dl className={styles.symbols}>
            {symbols.map((s) => (
              <div className={styles.symbolRow} key={s.symbol}>
                <dt className={styles.symbol}>{s.symbol}</dt>
                <dd className={styles.meaning}>{s.meaning}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  );
}
