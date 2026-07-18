/**
 * A reusable two-row alphabet strip: a "from" row (A–Z) and a "to" row showing
 * where each letter maps under a signed shift. The active column is highlighted
 * with the signal accent. Shared across shift-style ciphers (Caesar today;
 * Affine/Vigenère can reuse it later).
 */

import { ALPHABET, indexToLetter, mod } from '@/core/math';
import styles from './AlphabetStrip.module.css';

export interface AlphabetStripProps {
  /** Signed shift applied to the "from" row to produce the "to" row. */
  shift: number;
  /** Column to highlight (0..25), or undefined for none. */
  activeIndex?: number;
  fromLabel?: string;
  toLabel?: string;
}

export function AlphabetStrip({
  shift,
  activeIndex,
  fromLabel = 'plain',
  toLabel = 'cipher',
}: AlphabetStripProps) {
  const letters = ALPHABET.split('');
  const targetIndex =
    activeIndex === undefined ? undefined : mod(activeIndex + shift, 26);

  return (
    <div className={styles.strip} role="img" aria-label={`Alphabet mapped with a shift of ${shift}`}>
      <div className={styles.row}>
        <span className={styles.rowLabel} aria-hidden>
          {fromLabel}
        </span>
        <div className={styles.cells}>
          {letters.map((ch, i) => (
            <span
              key={ch}
              className={`${styles.cell} ${i === activeIndex ? styles.activeFrom : ''}`}
            >
              {ch}
            </span>
          ))}
        </div>
      </div>

      <div className={styles.row}>
        <span className={styles.rowLabel} aria-hidden>
          {toLabel}
        </span>
        <div className={styles.cells}>
          {letters.map((_, i) => {
            const mapped = indexToLetter(mod(i + shift, 26));
            const isTarget = targetIndex !== undefined && i === activeIndex;
            return (
              <span
                key={i}
                className={`${styles.cell} ${styles.toCell} ${isTarget ? styles.activeTo : ''}`}
              >
                {mapped}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
