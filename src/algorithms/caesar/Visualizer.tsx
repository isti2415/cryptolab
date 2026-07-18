import { AlphabetStrip } from '@/components/viz/AlphabetStrip';
import { TapePair } from '@/components/viz/TapePair';
import type { AlgorithmVisualizerProps } from '@/core/types';
import type { CaesarStepState } from './engine';
import styles from './Visualizer.module.css';

export function CaesarVisualizer({
  step,
}: AlgorithmVisualizerProps<CaesarStepState>) {
  const s = step.state;

  return (
    <div className={styles.viz}>
      <AlphabetStrip
        shift={s.effectiveShift}
        activeIndex={s.kind === 'char' ? s.fromIndex : undefined}
        fromLabel={s.direction === 'encrypt' ? 'plain' : 'cipher'}
        toLabel={s.direction === 'encrypt' ? 'cipher' : 'plain'}
      />

      {s.kind === 'char' && (
        <div className={styles.transform} aria-hidden>
          <span className={styles.tChar}>{s.fromChar}</span>
          <span className={styles.tArrow}>
            {s.effectiveShift >= 0 ? '+' : '−'}
            {Math.abs(s.effectiveShift)} →
          </span>
          <span className={`${styles.tChar} ${styles.tOut}`}>{s.toChar}</span>
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
