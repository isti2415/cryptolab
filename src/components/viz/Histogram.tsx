/**
 * Frequency bars over an alphabet.
 *
 * Exists to make the "weaknesses" prose checkable. Every classical page asserts
 * that a monoalphabetic cipher preserves letter frequencies; showing the plain
 * and cipher distributions side by side turns that claim into something the
 * learner can see for themselves; the profile is the same shape, just slid
 * along.
 */

import styles from './Histogram.module.css';

export interface Series {
  label: string;
  counts: number[];
  /** Which `--cat-N` role this series takes. */
  role?: 1 | 2 | 3 | 4 | 5;
}

interface HistogramProps {
  series: Series[];
  /** Bucket labels; defaults to A–Z. */
  buckets?: string[];
}

const ALPHABET = Array.from({ length: 26 }, (_, i) =>
  String.fromCharCode(65 + i),
);

export function Histogram({ series, buckets = ALPHABET }: HistogramProps) {
  // One shared scale across series, otherwise the two profiles are not
  // comparable, which is the entire point of drawing them together.
  const peak = Math.max(1, ...series.flatMap((s) => s.counts));

  return (
    <div className={styles.chart}>
      {series.map((s) => (
        <div className={styles.series} key={s.label}>
          <span className={styles.label}>{s.label}</span>
          <div className={styles.bars}>
            {buckets.map((b, i) => {
              const n = s.counts[i] ?? 0;
              return (
                <span
                  className={styles.slot}
                  key={b}
                  title={`${b}: ${n}`}
                  style={
                    {
                      '--h': `${(n / peak) * 100}%`,
                      '--role': `var(--cat-${s.role ?? 1})`,
                    } as React.CSSProperties
                  }
                >
                  <span className={styles.bar} />
                  <span className={styles.tick}>{b}</span>
                </span>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
