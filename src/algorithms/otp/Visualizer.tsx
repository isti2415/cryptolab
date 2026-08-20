/**
 * One-time pad visualizer.
 *
 * This page used to render almost identically to Vigenère: a shifted alphabet
 * strip and a key tape, which taught the wrong lesson entirely. Mechanically
 * the two are close; what makes the one-time pad different is not its mechanism
 * but its guarantee, and that guarantee is a statement about what an attacker
 * *cannot* rule out.
 *
 * So the focus region shows the thing that actually distinguishes it: for this
 * exact ciphertext, some other pad decrypts it to a completely different, wholly
 * sensible message. An attacker holding the ciphertext has no way to prefer one
 * over the other. That is perfect secrecy, made checkable instead of claimed.
 */

import { Cell } from '@/components/viz/Cell';
import { TapePair } from '@/components/viz/TapePair';
import { VizStage } from '@/components/viz/VizStage';
import { ALPHABET_SIZE, indexToLetter, letterToIndex, mod } from '@/core/math';
import type { AlgorithmVisualizerProps } from '@/core/types';
import type { OtpStepState } from './engine';
import styles from './Visualizer.module.css';

/**
 * A decoy plaintext of the same length, and the pad that would produce the
 * observed ciphertext from it. Derived, not invented: `pad = decoy → cipher`
 * is exactly the calculation an attacker could run for any message they like.
 */
const DECOY =
  'ATTACKATDAWNBRINGTHEHEAVYGUNSANDWAITFORTHESIGNALATDUSK';

function forgedPad(cipher: string, decoy: string): { decoy: string; pad: string } {
  const letters = [...cipher].filter((c) => letterToIndex(c) >= 0);
  const source = decoy.repeat(Math.ceil(letters.length / decoy.length));
  let pad = '';
  let out = '';
  for (let i = 0; i < letters.length; i++) {
    const c = letterToIndex(letters[i]);
    const m = letterToIndex(source[i]);
    pad += indexToLetter(mod(c - m, ALPHABET_SIZE));
    out += source[i];
  }
  return { decoy: out, pad };
}

export function OtpVisualizer({ step }: AlgorithmVisualizerProps<OtpStepState>) {
  const s = step.state;
  const encrypting = s.direction === 'encrypt';

  // The pad stream is aligned to the input, with a space wherever a character
  // consumes no pad, so counting non-spaces gives the letters this message
  // actually needs.
  const padLetters = s.padStream.replace(/\s/g, '').length;
  const consumed = [...s.padStream.slice(0, Math.max(0, s.pos + 1))].filter(
    (c) => c !== ' ',
  ).length;

  const cipherSoFar = encrypting ? s.outputSoFar : s.input;
  const forgery =
    cipherSoFar.replace(/[^A-Za-z]/g, '').length >= 3
      ? forgedPad(cipherSoFar.toUpperCase(), DECOY)
      : null;

  return (
    <VizStage>
      <VizStage.Context label="Pad">
        <div className={styles.meter}>
          <div className={styles.meterBar}>
            <span
              className={styles.meterFill}
              style={{
              width: `${padLetters ? (consumed / padLetters) * 100 : 0}%`,
            }}
            />
          </div>
          <span className={styles.meterLabel}>
            {consumed} of {padLetters} pad letters used: each one exactly once,
            then destroyed
          </span>
        </div>

        {s.kind === 'char' && (
          <div className={styles.combine}>
            <Cell state="idle" size="2.4em">{s.fromChar}</Cell>
            <span className={styles.op}>+</span>
            <Cell state="key" size="2.4em">{s.padChar}</Cell>
            <span className={styles.op}>=</span>
            <Cell state="output" size="2.4em">{s.toChar}</Cell>
            <span className={styles.mod}>mod 26</span>
          </div>
        )}
      </VizStage.Context>

      <VizStage.Focus label="Why it cannot be broken">
        {forgery ? (
          <div className={styles.stack}>
            <div className={styles.forge}>
              <Row label="ciphertext" text={cipherSoFar.toUpperCase().replace(/[^A-Z]/g, '')} state="output" />
              <Row label="a different pad" text={forgery.pad} state="key" />
              <Row label="decrypts to" text={forgery.decoy} state="changed" />
            </div>
            <p className={styles.note}>
              That pad is real: it is what you get by subtracting the decoy from
              the ciphertext. Every possible message of this length has some pad
              that produces this exact ciphertext, so intercepting it tells an
              attacker nothing beyond the length. No amount of computing power
              changes that, which is why the one-time pad is the only cipher
              here with a proof rather than a track record.
            </p>
            <p className={styles.note}>
              The catch is the conditions: the pad must be truly random, as long
              as the message, shared in advance, and never reused. Break any one
              of those and the guarantee evaporates.
            </p>
          </div>
        ) : (
          <p className={styles.note}>
            Enter a few more letters and this panel will show a second pad that
            decrypts the same ciphertext into an entirely different message, 
            the reason a one-time pad leaks nothing.
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
          middle={{ label: 'pad', text: s.padStream }}
        />
      </VizStage.Track>
    </VizStage>
  );
}

function Row({
  label,
  text,
  state,
}: {
  label: string;
  text: string;
  state: 'output' | 'key' | 'changed';
}) {
  return (
    <div className={styles.forgeRow}>
      <span className={styles.forgeLabel}>{label}</span>
      <div className={styles.forgeCells}>
        {[...text].map((ch, i) => (
          <Cell key={i} state={state} size="1.6em">
            {ch}
          </Cell>
        ))}
      </div>
    </div>
  );
}
