/**
 * A two-row substitution strip showing an arbitrary letter mapping: the top row
 * is A–Z, the bottom row is where each maps under the cipher. The active column
 * is highlighted. Used by monoalphabetic ciphers whose mapping isn't a simple
 * shift (Affine), and by anything that can express its step as "letter i → map[i]".
 */

import { ALPHABET, indexToLetter } from '@/core/math';
import styles from './SubstitutionStrip.module.css';

export interface SubstitutionStripProps {
  /** For each source index 0..25, the target index 0..25. */
  map: number[];
  activeIndex?: number;
  fromLabel?: string;
  toLabel?: string;
}

export function SubstitutionStrip({
  map,
  activeIndex,
  fromLabel = 'plain',
  toLabel = 'cipher',
}: SubstitutionStripProps) {
  const letters = ALPHABET.split('');
  return (
    <div className={styles.strip} role="img" aria-label="Cipher substitution alphabet">
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
          {letters.map((_, i) => (
            <span
              key={i}
              className={`${styles.cell} ${styles.toCell} ${i === activeIndex ? styles.activeTo : ''}`}
            >
              {indexToLetter(map[i])}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
