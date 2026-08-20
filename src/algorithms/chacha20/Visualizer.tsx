/**
 * ChaCha20 visualizer.
 *
 * The state is a 4×4 grid of words, so it is drawn as one, and because rounds
 * alternate between mixing down the columns and along the diagonals, the four
 * words each quarter-round touches are highlighted in place. Seeing the lit
 * cells move from vertical to diagonal and back is the clearest picture of how
 * a change in one word reaches all sixteen.
 */

import { Cell } from '@/components/viz/Cell';
import { VizStage } from '@/components/viz/VizStage';
import { XorLane } from '@/components/viz/XorLane';
import type { AlgorithmVisualizerProps } from '@/core/types';
import { hex32, type ChaCha20StepState } from './engine';
import styles from './Visualizer.module.css';

const hexByte = (b: number) => b.toString(16).padStart(2, '0').toUpperCase();
const ROLE = ['constant', 'constant', 'constant', 'constant',
  'key', 'key', 'key', 'key', 'key', 'key', 'key', 'key',
  'counter', 'nonce', 'nonce', 'nonce'];

export function ChaCha20Visualizer({
  step,
}: AlgorithmVisualizerProps<ChaCha20StepState>) {
  const s = step.state;
  const touched = new Set(s.touched ?? []);
  const shown = s.range ? s.inputBytes.slice(s.range[0], s.range[1]) : [];

  return (
    <VizStage>
      <VizStage.Context label="State">
        <div className={styles.grid}>
          {s.state.map((w, i) => (
            <div className={styles.slot} key={i}>
              <Cell state={touched.has(i) ? 'active' : cellRole(s, i)}>
                {hex32(w)}
              </Cell>
              {s.kind === 'setup' && (
                <span className={styles.role}>{ROLE[i]}</span>
              )}
            </div>
          ))}
        </div>
        <p className={styles.note}>
          {s.kind === 'setup'
            ? 'Four constants spelling “expand 32-byte k”, eight words of key, the block counter, then the nonce.'
            : s.round
              ? `${s.round.kind === 'column' ? 'Columns': 'Diagonals'} this round; the lit words are the ones being mixed.`
              : 'All sixteen words after the twenty rounds and the feed-forward addition.'}
        </p>
      </VizStage.Context>

      <VizStage.Focus label={focusLabel(s)}>
        {s.kind === 'xor' && s.keystream ? (
          <div className={styles.stack}>
            <XorLane
              a={shown.slice(0, 16).map(hexByte)}
              b={s.keystream.slice(0, 16).map(hexByte)}
              result={shown.slice(0, 16).map((b, i) => hexByte(b ^ s.keystream![i]))}
              labels={{
                a: s.range && s.range[0] === 0 ? 'message' : 'block',
                b: 'keystream',
                result: 'out',
              }}
              size="1.9em"
              groupEvery={4}
            />
            <p className={styles.note}>
              First 16 of up to 64 bytes. Encryption and decryption are the same
              XOR, which is why reusing a nonce with one key is fatal rather
              than merely careless.
            </p>
          </div>
        ) : s.kind === 'add' && s.keystream ? (
          <div className={styles.stack}>
            <div className={styles.keystream}>
              {s.keystream.slice(0, 32).map((b, i) => (
                <Cell key={i} fluid state="output">
                  {hexByte(b)}
                </Cell>
              ))}
            </div>
            <p className={styles.note}>
              The words are serialised little-endian, so the keystream bytes read
              in the opposite order to the hex words above. First 32 of 64 shown.
            </p>
          </div>
        ) : (
          <p className={styles.note}>
            Every operation in ChaCha20 is an addition, an XOR or a rotation, 
            "ARX". There are no lookup tables anywhere, so no memory address
            depends on the key and cache-timing attacks have nothing to observe.
            That is the design decision that separates it from AES in software.
          </p>
        )}
      </VizStage.Focus>

      <VizStage.Track label="Output">
        <span className={styles.outValue}>
          {s.outputSoFar.length
            ? s.outputSoFar.map(hexByte).join(' ')
            : 'no keystream applied yet'}
        </span>
      </VizStage.Track>
    </VizStage>
  );
}

function cellRole(s: ChaCha20StepState, i: number): 'idle' | 'key' | 'derived' {
  if (s.kind !== 'setup') return 'idle';
  return ROLE[i] === 'key' ? 'key' : ROLE[i] === 'constant' ? 'idle' : 'derived';
}

function focusLabel(s: ChaCha20StepState): string {
  if (s.kind === 'xor') return 'Applying the keystream';
  if (s.kind === 'add') return 'Keystream block';
  if (s.kind === 'round') return 'Why ARX';
  return 'Why ARX';
}
