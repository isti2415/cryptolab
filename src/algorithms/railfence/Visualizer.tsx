/**
 * Rail fence visualizer.
 *
 * The fence itself is the algorithm, so the fence is what gets drawn: a real
 * grid with the letters sitting where the zigzag puts them, and the empty cells
 * left visibly empty so the diagonal is a shape you can see rather than a
 * description you have to picture.
 */

import { Cell } from '@/components/viz/Cell';
import { ChipTrack } from '@/components/viz/ChipTrack';
import { VizStage } from '@/components/viz/VizStage';
import type { AlgorithmVisualizerProps } from '@/core/types';
import type { RailFenceStepState } from './engine';
import styles from './Visualizer.module.css';

export function RailFenceVisualizer({
  step,
}: AlgorithmVisualizerProps<RailFenceStepState>) {
  const s = step.state;
  const cols = s.letters.length;

  return (
    <VizStage layout="stack">
      <VizStage.Context label={`The fence · ${s.rails} rails`}>
        <div
          className={styles.fence}
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
          role="img"
          aria-label={`Rail fence, ${s.rails} rails by ${cols} columns`}
        >
          {s.grid.map((row, r) =>
            row.map((ch, c) => {
              const isActive = s.active?.[0] === r && s.active?.[1] === c;
              const onActiveRail = s.activeRail === r && ch !== null;
              return (
                <Cell
                  key={`${r}-${c}`}
                  fluid
                  state={
                    isActive
                      ? 'active'
                      : onActiveRail
                        ? 'output'
                        : ch === null
                          ? 'empty'
                          : 'done'
                  }
                >
                  {ch ?? ''}
                </Cell>
              );
            }),
          )}
        </div>
        <p className={styles.note}>
          Empty cells are part of the pattern, not padding; they are where the
          zigzag was not when it passed that column.
        </p>
      </VizStage.Context>

      <VizStage.Track label={s.direction === 'encrypt' ? 'Message' : 'Ciphertext'}>
        <ChipTrack
          label="in"
          chips={[...s.letters].map((ch, i) => ({
            text: ch,
            state:
              s.kind === 'place' && s.active?.[1] === i
                ? 'active'
                : s.kind === 'place' && i < (s.active?.[1] ?? 0)
                  ? 'done'
                  : 'idle',
          }))}
        />
        <ChipTrack
          label="out"
          chips={[...s.outputSoFar].map((ch) => ({ text: ch, state: 'output' }))}
          placeholder="nothing read off yet"
        />
      </VizStage.Track>
    </VizStage>
  );
}
