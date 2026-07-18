import { AlphabetStrip } from '@/components/viz/AlphabetStrip';
import { TapePair } from '@/components/viz/TapePair';
import type { AlgorithmVisualizerProps } from '@/core/types';
import type { OtpStepState } from './engine';
import styles from './Visualizer.module.css';

export function OtpVisualizer({ step }: AlgorithmVisualizerProps<OtpStepState>) {
  const s = step.state;

  return (
    <div className={styles.viz}>
      {s.kind === 'char' && (
        <>
          <AlphabetStrip
            shift={s.shift!}
            activeIndex={s.fromIndex}
            fromLabel={s.direction === 'encrypt' ? 'plain' : 'cipher'}
            toLabel={s.direction === 'encrypt' ? 'cipher' : 'plain'}
          />
          <div className={styles.calc} aria-hidden>
            <span className={styles.char}>{s.fromChar}</span>
            <span className={styles.key}>pad {s.padChar}</span>
            <span className={styles.arrow}>→</span>
            <span className={`${styles.char} ${styles.out}`}>{s.toChar}</span>
          </div>
        </>
      )}

      <TapePair
        input={s.input}
        output={s.outputSoFar}
        activeIndex={s.pos}
        doneCount={s.pos}
        justCount={s.kind === 'setup' ? 0 : 1}
        middle={{ label: 'pad', text: s.padStream }}
      />
    </div>
  );
}
