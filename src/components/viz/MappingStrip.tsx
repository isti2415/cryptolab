/**
 * Two aligned alphabets (the plain row over what each letter maps to), with a
 * drawn connector for the pair in play.
 *
 * Replaces `AlphabetStrip` and `SubstitutionStrip`, which were the same
 * component twice: one took a shift, the other an arbitrary map, and their CSS
 * modules had drifted into ~95% duplicates. A shift is just a map.
 */

import { Cell } from './Cell';
import styles from './MappingStrip.module.css';

const A = 'A'.charCodeAt(0);

interface MappingStripProps {
  /** map[i] = index in the target alphabet that source letter i becomes. */
  map: number[];
  /** Index into the source alphabet currently being transformed. */
  activeIndex?: number;
  labels?: { from?: string; to?: string };
  /** Alphabet size; 26 for the classical ciphers. */
  size?: number;
}

/** A shift cipher expressed as a map, so both cases share one component. */
export function shiftMap(shift: number, size = 26): number[] {
  return Array.from({ length: size }, (_, i) => (((i + shift) % size) + size) % size);
}

export function MappingStrip({
  map,
  activeIndex,
  labels,
  size = 26,
}: MappingStripProps) {
  const letters = Array.from({ length: size }, (_, i) => String.fromCharCode(A + i));
  const target = activeIndex != null ? map[activeIndex] : undefined;
  const slots = { '--slots': size } as React.CSSProperties;

  return (
    <div className={styles.strip}>
      <div className={styles.row}>
        <span className={styles.label}>{labels?.from ?? 'plain'}</span>
        <div className={styles.cells} style={slots}>
          {letters.map((l, i) => (
            <Cell key={i} state={i === activeIndex ? 'active' : 'idle'} fluid>
              {l}
            </Cell>
          ))}
        </div>
      </div>

      {/*
        The connector makes the jump explicit. Without it the two rows read as
        two unrelated alphabets and the learner has to count columns.
      */}
      <div className={styles.row} aria-hidden="true">
        <span className={styles.label} />
        <div className={styles.cells} style={slots}>
          {letters.map((_, i) => (
            <span
              key={i}
              className={`${styles.link} ${
                i === activeIndex ? styles.linkFrom : i === target ? styles.linkTo : ''
              }`}
            />
          ))}
        </div>
      </div>

      <div className={styles.row}>
        <span className={styles.label}>{labels?.to ?? 'cipher'}</span>
        <div className={styles.cells} style={slots}>
          {letters.map((_, i) => (
            <Cell key={i} state={i === target ? 'output' : 'done'} fluid>
              {String.fromCharCode(A + map[i])}
            </Cell>
          ))}
        </div>
      </div>
    </div>
  );
}
