/**
 * RC4 visualizer.
 *
 * The whole cipher is one 256-byte array and two indices, so the array is the
 * visualization: sixteen rows of sixteen, with the cells each step touched lit
 * up. Watching it start as 0, 1, 2, 3 … and dissolve into disorder is the most
 * direct picture of "stirring a key into a permutation" available.
 */

import { Cell } from '@/components/viz/Cell';
import { VizStage } from '@/components/viz/VizStage';
import { XorLane } from '@/components/viz/XorLane';
import type { AlgorithmVisualizerProps } from '@/core/types';
import type { Rc4StepState } from './engine';
import styles from './Visualizer.module.css';

const hex = (b: number) => b.toString(16).padStart(2, '0').toUpperCase();

export function Rc4Visualizer({ step }: AlgorithmVisualizerProps<Rc4StepState>) {
  const s = step.state;
  const touched = new Set(s.touched);

  return (
    <VizStage layout="stack">
      <VizStage.Context label="The permutation S">
        <div className={styles.pointers}>
          <span className={styles.pointer}>
            <span className={styles.pointerLabel}>i</span>
            {s.i ?? '—'}
          </span>
          <span className={styles.pointer}>
            <span className={styles.pointerLabel}>j</span>
            {s.j ?? '—'}
          </span>
          {s.range && (
            <span className={styles.pointerNote}>
              iterations {s.range[0]}–{s.range[1]} of 256
            </span>
          )}
        </div>

        <div
          className={styles.grid}
          role="img"
          aria-label="The 256-byte RC4 permutation"
        >
          {s.s.map((v, idx) => (
            <Cell
              key={idx}
              fluid
              state={
                touched.has(idx)
                  ? 'active'
                  : s.kind === 'setup'
                    ? 'muted'
                    : 'done'
              }
            >
              {hex(v)}
            </Cell>
          ))}
        </div>
        <p className={styles.note}>
          {s.kind === 'setup'
            ? 'Before the key schedule runs, S is simply 00, 01, 02 … FF in order: every RC4 run starts from the same array.'
            : 'Lit cells are the ones this step swapped or read.'}
        </p>
      </VizStage.Context>

      <VizStage.Focus label={s.kind === 'prga' ? 'This byte' : 'Key'}>
        {s.kind === 'prga' && s.inputByte != null ? (
          <XorLane
            a={[hex(s.inputByte)]}
            b={[hex(s.keystreamByte!)]}
            result={[hex(s.outputByte!)]}
            labels={{
              a: s.direction === 'encrypt' ? 'plain' : 'cipher',
              b: 'keystream',
              result: s.direction === 'encrypt' ? 'cipher' : 'plain',
            }}
          />
        ) : (
          <div className={styles.keyRow}>
            {s.keyBytes.map((b, i) => (
              <Cell key={i} state="key" sub={String(i)}>
                {hex(b)}
              </Cell>
            ))}
          </div>
        )}
        <p className={styles.note}>
          {s.kind === 'prga'
            ? 'Encryption and decryption are the same XOR, which is why reusing a key is fatal: the keystream cancels out between two ciphertexts.'
            : `The key is ${s.keyBytes.length} bytes and is consumed cyclically across all 256 iterations.`}
        </p>
      </VizStage.Focus>

      <VizStage.Track label="Bytes">
        <div className={styles.bytes}>
          <span className={styles.bytesLabel}>in</span>
          <span className={styles.bytesValue}>
            {s.inputBytes.map(hex).join(' ')}
          </span>
        </div>
        <div className={styles.bytes}>
          <span className={styles.bytesLabel}>out</span>
          <span className={`${styles.bytesValue} ${styles.bytesOut}`}>
            {s.outputSoFar.length
              ? s.outputSoFar.map(hex).join(' ')
              : 'no keystream generated yet'}
          </span>
        </div>
      </VizStage.Track>
    </VizStage>
  );
}
