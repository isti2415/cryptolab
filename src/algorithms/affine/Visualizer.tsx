/**
 * Affine visualizer.
 *
 * Affine is "multiply, then shift", but the engine precomputes the composed
 * substitution map, so a strip showing only plain → cipher made it look like a
 * Caesar cipher with a stranger table. The focus region breaks the composition
 * back apart: the letter index, the multiply, the shift, and the result, the
 * one thing that distinguishes this cipher from the previous one.
 */

import { Cell } from '@/components/viz/Cell';
import { MappingStrip } from '@/components/viz/MappingStrip';
import { TapePair } from '@/components/viz/TapePair';
import { VizStage } from '@/components/viz/VizStage';
import { indexToLetter } from '@/core/math';
import type { AlgorithmVisualizerProps } from '@/core/types';
import type { AffineStepState } from './engine';
import styles from './Visualizer.module.css';

export function AffineVisualizer({
  step,
}: AlgorithmVisualizerProps<AffineStepState>) {
  const s = step.state;
  const encrypting = s.direction === 'encrypt';

  return (
    <VizStage layout="stack">
      <VizStage.Context label={`Substitution · a = ${s.a}, b = ${s.b}`}>
        <MappingStrip
          map={s.map}
          activeIndex={s.kind === 'char' ? s.fromIndex : undefined}
          labels={{
            from: encrypting ? 'plain' : 'cipher',
            to: encrypting ? 'cipher' : 'plain',
          }}
        />
      </VizStage.Context>

      <VizStage.Focus label={s.kind === 'char' ? 'Two operations' : 'The key'}>
        {s.kind === 'char' && s.stages ? (
          <div className={styles.stack}>
            <div className={styles.pipeline}>
              <Stage label={s.fromChar!} sub={`index ${s.fromIndex}`} state="idle" />
              <span className={styles.op}>{s.stages[0]}</span>
              <Stage
                label={indexToLetter(s.midIndex!)}
                sub={`index ${s.midIndex}`}
                state="changed"
              />
              <span className={styles.op}>{s.stages[1]}</span>
              <Stage
                label={indexToLetter(s.toIndex!)}
                sub={`index ${s.toIndex}`}
                state="output"
              />
            </div>
            <p className={styles.expr}>{s.calc} (mod 26)</p>
            <p className={styles.note}>
              The multiply is what Caesar lacks. It stretches the alphabet around
              the ring before the shift slides it, which is why a must be coprime
              with 26; otherwise the stretch collapses letters together and the
              cipher stops being reversible.
            </p>
          </div>
        ) : (
          <p className={styles.note}>
            a = {s.a} multiplies each letter index, b = {s.b} then shifts it, all
            mod 26. Decryption needs a⁻¹ = {s.aInv}, which only exists because a
            is coprime with 26.
          </p>
        )}
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

function Stage({
  label,
  sub,
  state,
}: {
  label: string;
  sub: string;
  state: 'idle' | 'changed' | 'output';
}) {
  return (
    <span className={styles.stage}>
      <Cell state={state} size="2.4em">
        {label}
      </Cell>
      <span className={styles.stageSub}>{sub}</span>
    </span>
  );
}
