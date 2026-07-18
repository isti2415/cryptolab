/**
 * Two aligned character tapes — the input being consumed and the output being
 * produced — shared by every letter-oriented cipher (Caesar, Affine, Vigenère,
 * OTP, Playfair, Hill). The active input slot and the freshly-written output
 * slot are highlighted with the signal accent.
 */

import styles from './TapePair.module.css';

export interface TapePairProps {
  input: string;
  output: string;
  /** Index in `input` currently being processed (−1 for none). */
  activeIndex?: number;
  /** Number of input indices already fully processed. */
  doneCount?: number;
  /** Highlight the last N output chars as just-written. */
  justCount?: number;
  inputLabel?: string;
  outputLabel?: string;
  /** Optional row rendered between input and output (e.g. a key/pad stream). */
  middle?: { label: string; text: string; activeIndex?: number };
}

export function TapePair({
  input,
  output,
  activeIndex = -1,
  doneCount = 0,
  justCount = 0,
  inputLabel = 'input',
  outputLabel = 'output',
  middle,
}: TapePairProps) {
  return (
    <div className={styles.tapes}>
      <Tape label={inputLabel} text={input} activeIndex={activeIndex} doneCount={doneCount} />
      {middle && (
        <Tape
          label={middle.label}
          text={middle.text}
          activeIndex={middle.activeIndex ?? activeIndex}
          accent
        />
      )}
      <Tape
        label={outputLabel}
        text={output}
        justFrom={output.length - justCount}
        cursor
      />
    </div>
  );
}

function Tape({
  label,
  text,
  activeIndex = -1,
  doneCount = 0,
  justFrom = Infinity,
  cursor = false,
  accent = false,
}: {
  label: string;
  text: string;
  activeIndex?: number;
  doneCount?: number;
  justFrom?: number;
  cursor?: boolean;
  accent?: boolean;
}) {
  const chars = text.split('');
  return (
    <div className={styles.tapeRow}>
      <span className={styles.tapeLabel}>{label}</span>
      <div className={`${styles.tape} ${accent ? styles.tapeAccent : ''}`}>
        {chars.map((ch, i) => (
          <span
            key={i}
            className={[
              styles.slot,
              ch === ' ' ? styles.slotSpace : '',
              i === activeIndex ? styles.slotActive : '',
              i < doneCount && i !== activeIndex ? styles.slotDone : '',
              i >= justFrom ? styles.slotJust : '',
            ].join(' ')}
          >
            {ch === ' ' ? ' ' : ch}
          </span>
        ))}
        {chars.length === 0 && <span className={styles.empty}>—</span>}
        {cursor && <span className={styles.cursor} aria-hidden />}
      </div>
    </div>
  );
}
