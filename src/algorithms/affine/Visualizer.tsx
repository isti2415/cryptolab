import { SubstitutionStrip } from '@/components/viz/SubstitutionStrip';
import { TapePair } from '@/components/viz/TapePair';
import type { AlgorithmVisualizerProps } from '@/core/types';
import { indexToLetter } from '@/core/math';
import type { AffineStepState } from './engine';
import styles from './Visualizer.module.css';

export function AffineVisualizer({
  step,
}: AlgorithmVisualizerProps<AffineStepState>) {
  const s = step.state;

  return (
    <div className={styles.viz}>
      <SubstitutionStrip
        map={s.map}
        activeIndex={s.kind === 'char' ? s.fromIndex : undefined}
        fromLabel={s.direction === 'encrypt' ? 'plain' : 'cipher'}
        toLabel={s.direction === 'encrypt' ? 'cipher' : 'plain'}
      />

      {s.kind === 'char' && (
        <div className={styles.calc} aria-hidden>
          <span className={styles.char}>{s.fromChar}</span>
          <span className={styles.expr}>{s.calc}</span>
          <span className={styles.arrow}>→</span>
          <span className={`${styles.char} ${styles.out}`}>
            {indexToLetter(s.toIndex!)}
          </span>
        </div>
      )}

      <TapePair
        input={s.input}
        output={s.outputSoFar}
        activeIndex={s.pos}
        doneCount={s.pos}
        justCount={s.kind === 'setup' ? 0 : 1}
      />
    </div>
  );
}
