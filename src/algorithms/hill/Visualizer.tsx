/**
 * Hill visualizer.
 *
 * The matrix equation used to float in the upper-right of a mostly-empty box,
 * with a bare "?" where the answer would go and the block tracks stranded
 * lower-left. The equation is now the focus, anchored, with the dot-product
 * terms written out underneath so the multiply is something you can follow
 * rather than a box that emits numbers.
 *
 * The context region finally uses what the engine has been computing all along
 * and the old visualizer ignored: the key matrix, its determinant, and the
 * inverse that makes decryption possible.
 */

import { ChipTrack } from '@/components/viz/ChipTrack';
import { MatrixOp } from '@/components/viz/MatrixOp';
import { ValueLedger } from '@/components/viz/ValueLedger';
import { VizStage } from '@/components/viz/VizStage';
import type { AlgorithmVisualizerProps } from '@/core/types';
import type { HillStepState } from './engine';
import styles from './Visualizer.module.css';

const fmt = (m: number[][]) => m.map((row) => row.map(String));

export function HillVisualizer({ step }: AlgorithmVisualizerProps<HillStepState>) {
  const s = step.state;
  const encrypting = s.direction === 'encrypt';
  const active = s.kind === 'block' && s.inVec;

  return (
    <VizStage>
      <VizStage.Context label="Key">
        <ValueLedger
          rows={[
            {
              key: 'det',
              label: 'det K',
              value: String(s.det),
              active: s.kind === 'setup',
              note: 'must be coprime with 26, or no inverse exists',
            },
            {
              key: 'detInv',
              label: 'det⁻¹',
              value: String(s.detInv),
              active: s.kind === 'setup',
            },
          ]}
        />
        <div className={styles.keyPair}>
          <MatrixOp
            terms={[
              { rows: fmt(s.keyMatrix), label: 'K', state: encrypting ? 'key' : 'muted' },
              { rows: fmt(s.invMatrix), label: 'K⁻¹ mod 26', state: encrypting ? 'muted' : 'key' },
            ]}
            operators={['']}
          />
        </div>
        <p className={styles.note}>
          Encryption multiplies by K; decryption multiplies by K⁻¹. The one being
          applied this run is highlighted.
        </p>
      </VizStage.Context>

      <VizStage.Focus label={active ? 'This block' : 'The transform'}>
        {active ? (
          <MatrixOp
            terms={[
              { rows: fmt(s.matrix), label: encrypting ? 'K' : 'K⁻¹', state: 'key' },
              { rows: s.inVec!.map((n) => [String(n)]), label: s.inChars, state: 'idle' },
              { rows: s.outVec!.map((n) => [String(n)]), label: s.outChars, state: 'output' },
            ]}
            operators={['×', '=']}
            workings={[`${s.calc0} (mod 26)`, `${s.calc1} (mod 26)`]}
          />
        ) : (
          <p className={styles.note}>
            Letters are taken two at a time as a vector and multiplied by the key
            matrix mod 26. Because every output letter depends on both input
            letters, Hill diffuses information across the block: the property
            single-letter substitution ciphers completely lack.
          </p>
        )}
      </VizStage.Focus>

      <VizStage.Track label="Blocks">
        <ChipTrack
          label="in"
          chips={s.inputBlocks.map((b, i) => ({
            text: b,
            state: i === s.blockIndex ? 'active' : i < s.blockIndex ? 'done' : 'idle',
          }))}
        />
        <ChipTrack
          label="out"
          chips={s.outputBlocks.map((b, i) => ({
            text: b,
            state: i === s.outputBlocks.length - 1 ? 'output' : 'done',
          }))}
        />
      </VizStage.Track>
    </VizStage>
  );
}
