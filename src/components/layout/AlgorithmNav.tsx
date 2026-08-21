/**
 * What to read next.
 *
 * The catalogue is ordered as a progression — classical to modern, each
 * algorithm leaning on the one before — but until now the only way to move
 * along it was the sidebar, so reaching the end of a page was a dead end. Two
 * kinds of link fix that: the neighbours in the sequence, and the algorithms
 * whose relationship the prose already asserts (Affine *is* Caesar with a
 * multiply; ML-KEM *is* LWE with structure).
 */

import { Link } from 'react-router-dom';
import { neighbours, relatedTo } from '@/core/registry';
import styles from './AlgorithmNav.module.css';

export function AlgorithmNav({ id }: { id: string }) {
  const { prev, next } = neighbours(id);
  const related = relatedTo(id);

  if (!prev && !next && related.length === 0) return null;

  return (
    <nav className={styles.wrap} aria-label="Related algorithms">
      {related.length > 0 && (
        <section className={styles.relatedBlock}>
          <h2 className={styles.heading}>Related</h2>
          <ul className={styles.related}>
            {related.map((r) => (
              <li key={r.meta.id}>
                <Link to={`/a/${r.meta.id}`} className={styles.card}>
                  <span className={styles.cardName}>{r.meta.name}</span>
                  <span className={styles.cardTag}>{r.meta.tagline}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className={styles.sequence}>
        {prev ? (
          <Link to={`/a/${prev.meta.id}`} className={styles.step}>
            <span className={styles.stepDir}>← Previous</span>
            <span className={styles.stepName}>{prev.meta.name}</span>
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link to={`/a/${next.meta.id}`} className={`${styles.step} ${styles.stepNext}`}>
            <span className={styles.stepDir}>Next →</span>
            <span className={styles.stepName}>{next.meta.name}</span>
          </Link>
        )}
      </div>
    </nav>
  );
}
