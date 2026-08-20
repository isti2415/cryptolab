/**
 * Vigenère visualizer.
 *
 * The tableau is the canonical way this cipher has been taught since the 16th
 * century, and it was missing: the page instead re-shifted a single alphabet
 * strip per letter, which showed the *result* of the key letter while hiding
 * the idea that a Vigenère key is just a sequence of Caesar shifts chosen by a
 * table. Here the full 26×26 square is permanent context, with the row and
 * column the current letter reads picked out.
 *
 * The key ruler under the tape makes the other half of the story visible: the
 * key repeats, and that repetition is precisely what Kasiski examination
 * exploits.
 */

import { LookupTable } from '@/components/viz/LookupTable';
import { TapePair } from '@/components/viz/TapePair';
import { VizStage } from '@/components/viz/VizStage';
import type { AlgorithmVisualizerProps } from '@/core/types';
import type { VigenereStepState } from './engine';
import styles from './Visualizer.module.css';

const LETTERS = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));

/** tableau[row][col] = the letter at (key letter, plain letter). */
const TABLEAU = LETTERS.map((_, r) =>
  LETTERS.map((_, c) => LETTERS[(r + c) % 26]),
);

export function VigenereVisualizer({
  step,
}: AlgorithmVisualizerProps<VigenereStepState>) {
  const s = step.state;
  const encrypting = s.direction === 'encrypt';

  /*
   * Encrypting reads the tableau forwards: row = key letter, column = plain
   * letter, cell = ciphertext. Decrypting runs the same table backwards, so the
   * cell that gets highlighted is the ciphertext sitting in the key's row.
   */
  const active =
    s.kind === 'char' && s.keyChar
      ? {
          row: s.keyChar.charCodeAt(0) - 65,
          col: encrypting ? s.fromIndex! : s.toIndex!,
        }
      : undefined;

  return (
    <VizStage>
      <VizStage.Context label="Vigenère tableau">
        <LookupTable
          rows={TABLEAU}
          rowHeaders={LETTERS}
          colHeaders={LETTERS}
          corner="key ↓"
          active={active}
          dense
        />
      </VizStage.Context>

      <VizStage.Focus label={s.kind === 'char' ? 'This letter' : 'The key'}>
        {s.kind === 'char' ? (
          <div className={styles.stack}>
            <p className={styles.calc}>
              <span className={styles.char}>{s.fromChar}</span>
              <span className={styles.key}>{s.keyChar}</span>
              <span className={styles.arrow}>→</span>
              <span className={`${styles.char} ${styles.out}`}>{s.toChar}</span>
            </p>
            <p className={styles.note}>
              Key letter <strong>{s.keyChar}</strong> selects row{' '}
              {s.keyChar} of the tableau: a Caesar shift of {s.shift}. Each
              position in the message gets a different row, which is why the
              flat frequency profile that breaks Caesar does not appear here.
            </p>
          </div>
        ) : (
          <p className={styles.note}>
            The keyword “{s.key}” repeats across the message. Every letter is
            enciphered with the Caesar shift named by the key letter above it, 
            the cipher is a stack of 26 Caesar alphabets, chosen one per
            position.
          </p>
        )}
      </VizStage.Focus>

      <VizStage.Track label="Message">
        <TapePair
          input={s.input}
          output={s.outputSoFar}
          activeIndex={s.pos}
          doneCount={s.pos}
          justCount={s.kind === 'setup' ? 0 : 1}
          middle={{ label: 'key', text: s.keyStream }}
        />
        {/*
          The repeat ruler: identical key letters land under identical positions
          every `key.length` characters. Kasiski's attack is nothing more than
          noticing that repeated plaintext at those intervals produces repeated
          ciphertext.
        */}
        <p className={styles.period}>
          key length {s.key.length}; it repeats every {s.key.length} letters,
          and that period is what an attacker looks for first.
        </p>
      </VizStage.Track>
    </VizStage>
  );
}
