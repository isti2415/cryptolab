/**
 * Blowfish visualizer.
 *
 * The Feistel rounds look like DES's and are not what is interesting here. What
 * is interesting is that the S-boxes are *derived from the key*, so the
 * context panel shows them changing during the schedule, which is something no
 * other cipher on this site does. Watching π turn into key-dependent tables is
 * the whole point of the design.
 */

import { BitField } from '@/components/viz/BitField';
import { Cell } from '@/components/viz/Cell';
import { VizStage } from '@/components/viz/VizStage';
import type { AlgorithmVisualizerProps } from '@/core/types';
import type { BlowfishStepState } from './engine';
import styles from './Visualizer.module.css';

export function BlowfishVisualizer({
  step,
  prev,
}: AlgorithmVisualizerProps<BlowfishStepState>) {
  const s = step.state;
  const before = prev?.state;

  return (
    <VizStage>
      <VizStage.Context label="Key-dependent tables">
        <div className={styles.section}>
          <span className={styles.label}>P-array · 18 subkeys</span>
          <div className={styles.words}>
            {s.p.map((w, i) => (
              <Cell
                key={i}
                fluid
                state={before && before.p[i] !== w ? 'changed' : 'idle'}
                title={`P${i}`}
              >
                {w.slice(0, 4)}
              </Cell>
            ))}
          </div>
        </div>

        {s.sSample.map((box, b) => (
          <div className={styles.section} key={b}>
            <span className={styles.label}>S-box {b + 1} · first 8 of 256</span>
            <div className={styles.words}>
              {box.map((w, i) => (
                <Cell
                  key={i}
                  fluid
                  state={before && before.sSample[b][i] !== w ? 'changed' : 'idle'}
                >
                  {w.slice(0, 4)}
                </Cell>
              ))}
            </div>
          </div>
        ))}

        {s.stage && (
          <div className={styles.progress}>
            <div className={styles.bar}>
              <span
                className={styles.fill}
                style={{ width: `${(s.stage.progress / s.totalEncryptions) * 100}%` }}
              />
            </div>
            <span className={styles.progressLabel}>
              {s.stage.progress} of {s.totalEncryptions} encryptions
            </span>
          </div>
        )}

        {s.outputHex && (
          <p className={styles.output}>
            <span className={styles.label}>output block</span>
            <span className={styles.outputValue}>{s.outputHex}</span>
          </p>
        )}
      </VizStage.Context>

      <VizStage.Focus label={s.round ? `Round ${s.round.round}` : 'The block'}>
        <div className={styles.stack}>
          <BitField
            label="L"
            cells={[...s.l].map((c) => ({ text: c, state: 'idle' }))}
            size="1.9em"
          />
          <BitField
            label="R"
            cells={[...s.r].map((c) => ({ text: c, state: 'changed' }))}
            size="1.9em"
          />
          {s.round && (
            <p className={styles.note}>
              Subkey P{s.round.round - 1} = {s.round.p}. f splits the left half
              into four bytes and looks each up in a different S-box, combining
              them with two additions and an XOR, mixing the two operations is
              what makes f hard to attack algebraically.
            </p>
          )}
          {s.kind === 'schedule' && (
            <p className={styles.note}>
              This is the cipher encrypting itself. Each encryption's output
              overwrites two table entries and becomes the next input, so the
              tables cannot be precomputed without the key, and 521 rounds of
              setup is why Blowfish is slow to key and why bcrypt was built on it.
            </p>
          )}
          {s.kind === 'setup' && (
            <p className={styles.note}>
              Key of {s.keyBytes.length} bytes. Every entry above is currently a
              hexadecimal digit of π; none of it depends on the key yet.
            </p>
          )}
        </div>
      </VizStage.Focus>
    </VizStage>
  );
}
