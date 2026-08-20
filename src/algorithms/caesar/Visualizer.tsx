/**
 * Caesar visualizer.
 *
 * The mapping stays as permanent context, with a connector drawn between the
 * letter going in and the letter coming out so the jump is visible rather than
 * something you count columns to find. Beneath it, the two frequency profiles:
 * the whole point of the Caesar cipher's weakness is that the shape does not
 * change, only its position, and that is far more convincing shown than
 * asserted in a paragraph further down the page.
 */

import { Histogram } from '@/components/viz/Histogram';
import { MappingStrip, shiftMap } from '@/components/viz/MappingStrip';
import { TapePair } from '@/components/viz/TapePair';
import { VizStage } from '@/components/viz/VizStage';
import type { AlgorithmVisualizerProps } from '@/core/types';
import type { CaesarStepState } from './engine';
import styles from './Visualizer.module.css';

export function CaesarVisualizer({
  step,
}: AlgorithmVisualizerProps<CaesarStepState>) {
  const s = step.state;
  const encrypting = s.direction === 'encrypt';

  return (
    <VizStage layout="stack">
      <VizStage.Context label={`Shift ${s.effectiveShift >= 0 ? '+' : '−'}${Math.abs(s.effectiveShift)}`}>
        <MappingStrip
          map={shiftMap(s.effectiveShift)}
          activeIndex={s.kind === 'char' ? s.fromIndex : undefined}
          labels={{
            from: encrypting ? 'plain' : 'cipher',
            to: encrypting ? 'cipher' : 'plain',
          }}
        />

        {s.kind === 'char' && (
          <p className={styles.transform}>
            <span className={styles.tChar}>{s.fromChar}</span>
            <span className={styles.tArrow}>
              {s.effectiveShift >= 0 ? '+' : '−'}
              {Math.abs(s.effectiveShift)} →
            </span>
            <span className={`${styles.tChar} ${styles.tOut}`}>{s.toChar}</span>
          </p>
        )}
      </VizStage.Context>

      <VizStage.Focus label="Letter frequencies">
        <Histogram
          series={[
            { label: encrypting ? 'plaintext' : 'ciphertext', counts: s.inputFreq, role: 1 },
            { label: encrypting ? 'ciphertext so far' : 'plaintext so far', counts: s.outputFreq, role: 4 },
          ]}
        />
        <p className={styles.note}>
          The two profiles are the same shape, slid along by the shift. That is
          the whole attack: find the offset that lines the ciphertext up with
          normal English letter frequencies and you have the key, without ever
          guessing it.
        </p>
      </VizStage.Focus>

      <VizStage.Track>
        <TapePair
          input={s.input}
          output={s.outputSoFar}
          activeIndex={s.pos}
          doneCount={s.pos}
          justCount={s.kind === 'setup' ? 0 : 1}
        />
      </VizStage.Track>
    </VizStage>
  );
}
