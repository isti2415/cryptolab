/**
 * A bit permutation drawn as what it is: wires from one position to another.
 *
 * DES is mostly permutations (IP, FP, PC-1, PC-2, E, P), and every one of them
 * used to be invisible, folded silently into a step whose only visible effect
 * was that a hex string became a different hex string. Drawing the wiring is
 * the difference between "the bits moved" and "bit 58 goes to position 1".
 *
 * Rendered as one SVG rather than HTML cells plus overlaid lines, so the wires
 * land exactly on the cells they connect at any zoom level.
 */

import { useId } from 'react';
import styles from './PermutationWiring.module.css';

interface PermutationWiringProps {
  /** Values at each input position. */
  input: string[];
  /** Values at each output position. */
  output: string[];
  /** source[i] = which input index feeds output position i (0-based). */
  source: number[];
  /** Output positions whose wires are spotlighted. */
  activeOutputs?: number[];
  /** Input positions the permutation discards, e.g. DES parity bits. */
  dropped?: number[];
  labels?: { input?: string; output?: string };
  /** Cell width in px. Smaller for 64-bit fields. */
  cellW?: number;
}

const CELL_H = 20;
const GAP = 2;
const LANE = 54; // vertical space the wires occupy
const PAD_TOP = 14;

export function PermutationWiring({
  input,
  output,
  source,
  activeOutputs,
  dropped = [],
  labels,
  cellW = 20,
}: PermutationWiringProps) {
  const clipId = useId();
  const step = cellW + GAP;
  const width = Math.max(input.length, output.length) * step;
  const height = PAD_TOP + CELL_H + LANE + CELL_H + PAD_TOP;

  const yIn = PAD_TOP;
  const yOut = PAD_TOP + CELL_H + LANE;
  const active = new Set(activeOutputs ?? []);
  const droppedSet = new Set(dropped);
  const anyActive = active.size > 0;

  const cx = (i: number) => i * step + cellW / 2;

  return (
    <div className={styles.wrap}>
      {(labels?.input || labels?.output) && (
        <div className={styles.legend}>
          <span>{labels?.input}</span>
          <span>{labels?.output}</span>
        </div>
      )}
      <div className={styles.scroll}>
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className={styles.svg}
          role="img"
          aria-label={`Permutation of ${input.length} positions into ${output.length}`}
        >
          <clipPath id={clipId}>
            <rect x="0" y="0" width={width} height={height} />
          </clipPath>

          {/* Wires first, so cells sit on top of where they terminate. */}
          <g clipPath={`url(#${clipId})`}>
            {source.map((from, to) => {
              const x1 = cx(from);
              const x2 = cx(to);
              const y1 = yIn + CELL_H;
              const y2 = yOut;
              const lit = active.has(to);
              return (
                <path
                  key={to}
                  d={`M ${x1} ${y1} C ${x1} ${y1 + LANE * 0.45}, ${x2} ${y2 - LANE * 0.45}, ${x2} ${y2}`}
                  className={`${styles.wire} ${lit ? styles.wireOn : ''} ${
                    anyActive && !lit ? styles.wireDim : ''
                  }`}
                />
              );
            })}
          </g>

          {input.map((v, i) => (
            <Slot
              key={`i${i}`}
              x={i * step}
              y={yIn}
              w={cellW}
              value={v}
              variant={droppedSet.has(i) ? 'dropped' : 'idle'}
            />
          ))}

          {output.map((v, i) => (
            <Slot
              key={`o${i}`}
              x={i * step}
              y={yOut}
              w={cellW}
              value={v}
              variant={active.has(i) ? 'active' : 'output'}
            />
          ))}
        </svg>
      </div>
    </div>
  );
}

function Slot({
  x,
  y,
  w,
  value,
  variant,
}: {
  x: number;
  y: number;
  w: number;
  value: string;
  variant: 'idle' | 'active' | 'output' | 'dropped';
}) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={CELL_H}
        rx="3"
        className={`${styles.slot} ${styles[variant]}`}
      />
      <text
        x={x + w / 2}
        y={y + CELL_H / 2}
        className={`${styles.text} ${styles[`${variant}Text`]}`}
        dominantBaseline="central"
        textAnchor="middle"
      >
        {value}
      </text>
    </g>
  );
}
