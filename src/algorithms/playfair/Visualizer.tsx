/**
 * Playfair visualizer.
 *
 * The 5×5 square was already the strongest thing on the page; what it lacked
 * was a place to sit. It used to float right-of-centre in a half-empty box with
 * the digraph tracks stranded in the bottom-left corner. Here it is the anchored
 * context, the rule being applied is spelled out beside it, and the pairs run
 * full-width underneath.
 *
 * The addition is the rule explanation: "rectangle" was previously only a word
 * in a readout, which tells you nothing if you don't already know the cipher.
 * The square marks the two source letters filled and the two replacements
 * outlined, and the focus region says in words what geometry produced them.
 */

import { Cell } from '@/components/viz/Cell';
import { ChipTrack } from '@/components/viz/ChipTrack';
import { VizStage } from '@/components/viz/VizStage';
import type { AlgorithmVisualizerProps } from '@/core/types';
import type { PlayfairStepState } from './engine';
import styles from './Visualizer.module.css';

function eq(a: [number, number] | undefined, r: number, c: number) {
  return a !== undefined && a[0] === r && a[1] === c;
}

const RULE_TEXT: Record<string, string> = {
  row: 'Both letters share a row, so each is replaced by the letter to its right, wrapping around the end of the row.',
  column:
    'Both letters share a column, so each is replaced by the letter below it, wrapping around the bottom.',
  rectangle:
    'The two letters form the corners of a rectangle. Each is replaced by the corner in its own row and the other letter’s column.',
};

export function PlayfairVisualizer({
  step,
}: AlgorithmVisualizerProps<PlayfairStepState>) {
  const s = step.state;

  return (
    <VizStage>
      <VizStage.Context label="Key square">
        <div className={styles.square}>
          {s.grid.map((row, r) =>
            row.map((ch, c) => {
              const source = eq(s.posA, r, c) || eq(s.posB, r, c);
              const result = eq(s.posRA, r, c) || eq(s.posRB, r, c);
              return (
                <Cell
                  key={`${r}-${c}`}
                  size="2.5em"
                  state={source ? 'active' : result ? 'output' : 'idle'}
                >
                  {ch === 'I' ? 'I/J' : ch}
                </Cell>
              );
            }),
          )}
        </div>
        <p className={styles.note}>
          I and J share a cell, so the square holds 25 letters. The keyword fills
          it first, then the rest of the alphabet in order.
        </p>
      </VizStage.Context>

      <VizStage.Focus label={s.kind === 'pair' ? `${s.rule} rule` : 'How pairs work'}>
        {s.kind === 'pair' ? (
          <div className={styles.stack}>
            <p className={styles.readout}>
              <span className={styles.pair}>
                {s.a}
                {s.b}
              </span>
              <span className={styles.arrow}>→</span>
              <span className={`${styles.pair} ${styles.out}`}>
                {s.ra}
                {s.rb}
              </span>
            </p>
            <p className={styles.note}>{RULE_TEXT[s.rule!]}</p>
            <p className={styles.note}>
              Highlighted in the square: the two source letters are filled, the
              two replacements outlined.
            </p>
          </div>
        ) : (
          <p className={styles.note}>
            Playfair enciphers two letters at a time. Doubled letters inside a
            pair are separated by a filler, and an odd-length message is padded,
            so the digraph stream can be slightly longer than the original text.
          </p>
        )}
      </VizStage.Focus>

      <VizStage.Track label="Digraphs">
        <ChipTrack
          label="in"
          chips={s.inputPairs.map((p, i) => ({
            text: p,
            state: i === s.pairIndex ? 'active' : i < s.pairIndex ? 'done' : 'idle',
          }))}
        />
        <ChipTrack
          label="out"
          chips={s.outputPairs.map((p, i) => ({
            text: p,
            state: i === s.outputPairs.length - 1 ? 'output' : 'done',
          }))}
        />
      </VizStage.Track>
    </VizStage>
  );
}
