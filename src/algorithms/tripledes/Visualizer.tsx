/**
 * Triple DES visualizer.
 *
 * The DES page already shows what happens inside a round, so this one shows the
 * thing that is actually new: the composition. Three passes in a row, each
 * feeding the next, with the middle one visibly a *decryption*, which is the
 * detail everyone finds strange and which the EDE ordering exists to provide.
 */

import { BitField } from '@/components/viz/BitField';
import { VizStage } from '@/components/viz/VizStage';
import type { AlgorithmVisualizerProps } from '@/core/types';
import type { TripleDesStepState } from './engine';
import styles from './Visualizer.module.css';

const nibbles = (hex: string) => hex.split('');

export function TripleDesVisualizer({
  step,
}: AlgorithmVisualizerProps<TripleDesStepState>) {
  const s = step.state;

  return (
    <VizStage>
      <VizStage.Context label="The E–D–E chain">
        <ol className={styles.chain}>
          {s.keys.map((_, i) => {
            const pass = s.passes[i];
            const active = s.activePass === i + 1;
            return (
              <li
                key={i}
                className={`${styles.pass} ${active ? styles.passOn : ''} ${
                  pass ? styles.passDone : ''
                }`}
              >
                <span className={styles.passHead}>
                  <span className={styles.passOp}>
                    {pass ? pass.op : i === 1 ? 'D' : 'E'}
                  </span>
                  <span className={styles.passKey}>
                    {pass ? pass.keyName : s.keys[i].name}
                  </span>
                </span>
                <span className={styles.passValue}>
                  {pass ? pass.outputHex: ', '}
                </span>
              </li>
            );
          })}
        </ol>

        {s.degenerate && (
          <p className={styles.warn}>
            All three keys are identical, so this is single DES with extra steps
, 56 bits of security, not 168.
          </p>
        )}

        {s.outputHex && (
          <p className={styles.output}>
            <span className={styles.outputLabel}>output block</span>
            <span className={styles.outputValue}>{s.outputHex}</span>
          </p>
        )}
      </VizStage.Context>

      <VizStage.Focus
        label={s.round ? `Round ${s.round.round}` : 'Keys and block'}
      >
        {s.round ? (
          <div className={styles.stack}>
            <BitField
              label="L"
              cells={nibbles(s.round.L).map((t) => ({ text: t, state: 'idle' }))}
              size="1.9em"
            />
            <BitField
              label="R"
              cells={nibbles(s.round.R).map((t) => ({ text: t, state: 'changed' }))}
              size="1.9em"
            />
            <p className={styles.note}>
              Round key {s.round.subkeyHex}. Each pass is a complete sixteen-round
              DES; the DES page walks a single one of these in full detail.
            </p>
          </div>
        ) : (
          <div className={styles.stack}>
            <BitField
              label="block"
              cells={nibbles(s.blockHex).map((t) => ({ text: t, state: 'idle' }))}
              size="1.9em"
            />
            {s.keys.map((k) => (
              <BitField
                key={k.name}
                label={k.name}
                cells={nibbles(k.hex).map((t) => ({ text: t, state: 'key' }))}
                size="1.9em"
              />
            ))}
            <p className={styles.note}>
              Three DES keys of 56 effective bits each, but meet-in-the-middle
              means the pair only buys about 112, and two-key mode rather less.
            </p>
          </div>
        )}
      </VizStage.Focus>
    </VizStage>
  );
}
