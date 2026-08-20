/**
 * Progress track: the units a cipher has consumed or produced, with the one
 * currently in play highlighted.
 *
 * Extracted from Playfair and Hill, whose CSS modules had drifted into
 * byte-for-byte copies of each other.
 */

import { Cell, type CellState } from './Cell';
import styles from './ChipTrack.module.css';

export interface Chip {
  text: string;
  state?: CellState;
  title?: string;
}

interface ChipTrackProps {
  chips: Chip[];
  label?: string;
  /** Shown when there is nothing yet, instead of an empty row. */
  placeholder?: string;
}

export function ChipTrack({
  chips,
  label,
  placeholder = 'nothing yet',
}: ChipTrackProps) {
  return (
    <div className={styles.track}>
      {label && <span className={styles.label}>{label}</span>}
      <div className={styles.chips}>
        {chips.length === 0 ? (
          <span className={styles.placeholder}>{placeholder}</span>
        ) : (
          chips.map((c, i) => (
            <Cell key={i} state={c.state} title={c.title}>
              {c.text}
            </Cell>
          ))
        )}
      </div>
    </div>
  );
}
