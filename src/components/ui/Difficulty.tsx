/**
 * The 1–5 difficulty pips.
 *
 * Written out twice before this existed — once on the home page cards, once in
 * the algorithm header — with two sets of class names and one silent
 * disagreement in how the unfilled pips were coloured. The interesting part is
 * not the markup but the accessibility contract, and having two copies of that
 * is how one of them drifts.
 *
 * The pips are decoration: the meaning lives in the `sr-only` sentence, which
 * is why the unfilled ones can sit below text-contrast minimums without that
 * being a defect.
 */

import styles from './Difficulty.module.css';

export function Difficulty({
  level,
  className,
}: {
  level: 1 | 2 | 3 | 4 | 5;
  /** Lets each site pass its own sizing/colour context. */
  className?: string;
}) {
  return (
    <span className={`${styles.pips} ${className ?? ''}`}>
      <span className="sr-only">Difficulty {level} of 5</span>
      <span aria-hidden="true">
        {'●'.repeat(level)}
        <span className={styles.off}>{'●'.repeat(5 - level)}</span>
      </span>
    </span>
  );
}
