import type { AlgorithmVisualizerProps } from '@/core/types';
import type { RsaStepState } from './engine';
import styles from './Visualizer.module.css';

/** Which key rows to emphasize at each step. */
function activeRows(s: RsaStepState): Set<string> {
  switch (s.kind) {
    case 'primes':
      return new Set(['p', 'q']);
    case 'modulus':
      return new Set(['n']);
    case 'totient':
      return new Set(['phi']);
    case 'public':
      return new Set(['e']);
    case 'private':
      return new Set(['d']);
    case 'char':
      return new Set(s.direction === 'encrypt' ? ['n', 'e'] : ['n', 'd']);
  }
}

const ROWS: { key: string; label: string; secret?: boolean }[] = [
  { key: 'p', label: 'p', secret: true },
  { key: 'q', label: 'q', secret: true },
  { key: 'n', label: 'n = p·q' },
  { key: 'phi', label: 'φ(n)', secret: true },
  { key: 'e', label: 'e (public)' },
  { key: 'd', label: 'd (private)', secret: true },
];

export function RsaVisualizer({ step }: AlgorithmVisualizerProps<RsaStepState>) {
  const s = step.state;
  const active = activeRows(s);

  return (
    <div className={styles.viz}>
      <div className={styles.keys}>
        {ROWS.map((row) => {
          const value = s[row.key as keyof RsaStepState] as string;
          const on = active.has(row.key);
          return (
            <div key={row.key} className={`${styles.keyRow} ${on ? styles.keyOn : ''}`}>
              <span className={styles.keyLabel}>
                {row.label}
                {row.secret && <span className={styles.lock} title="secret">•</span>}
              </span>
              <span className={styles.keyVal}>{value}</span>
            </div>
          );
        })}
      </div>

      {s.kind === 'char' && (
        <div className={styles.op} aria-hidden>
          {s.direction === 'encrypt' ? (
            <>
              <span className={styles.glyph}>{s.glyph}</span>
              <span className={styles.eq}>= {s.inValue}</span>
              <span className={styles.formula}>{s.formula}</span>
            </>
          ) : (
            <>
              <span className={styles.formula}>{s.formula}</span>
              <span className={styles.eq}>→</span>
              <span className={styles.glyph}>{s.glyph}</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
