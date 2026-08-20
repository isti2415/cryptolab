/**
 * The hero's live demo.
 *
 * This is not a mockup of the product; it is the product, shrunk. It calls the
 * same `run()` the Caesar page calls, walks the same step trace the player
 * walks, and prints the same arithmetic. A landing page that illustrated the
 * walkthrough with hand-drawn markup would be the exact "simulation instead of
 * the real thing" the project promises never to ship, and it would be free to
 * drift the moment the engine changed.
 *
 * Decorative in the accessibility sense — a screen reader gets one sentence
 * instead of a tape that mutates four times a second, and the full, navigable
 * version of this is one link away on the Caesar page.
 */

import { useEffect, useState } from 'react';
import { run, type CaesarStepState } from '@/algorithms/caesar/engine';
import styles from './HeroDemo.module.css';

const INPUT = 'ATTACK AT DAWN';
const SHIFT = 3;
const A_Z = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

/* Pure, deterministic and cheap, so it runs once at module load — including
   during prerender, which is what puts real text in the static HTML. */
const { steps, output } = run(INPUT, { shift: SHIFT }, 'encrypt');

/** Per-step dwell, and the longer pause on the finished tape before looping. */
const STEP_MS = 340;
const HOLD_MS = 2600;

export function HeroDemo() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIndex(steps.length - 1);
      return;
    }
    let timer: number;
    const tick = () => {
      setIndex((i) => {
        const next = i >= steps.length - 1 ? 0 : i + 1;
        timer = window.setTimeout(tick, next === 0 ? STEP_MS : i >= steps.length - 2 ? HOLD_MS : STEP_MS);
        return next;
      });
    };
    timer = window.setTimeout(tick, STEP_MS);
    return () => window.clearTimeout(timer);
  }, []);

  const step = steps[index];
  const s = step.state as CaesarStepState;
  const done = s.outputSoFar.length;

  return (
    <div className={styles.demo}>
      <p className="sr-only">
        An animated preview of the Caesar cipher walkthrough, enciphering
        “{INPUT}” with a shift of {SHIFT} to produce “{output}”. The full
        step-by-step version is on the Caesar cipher page.
      </p>

      <div className={styles.frame} aria-hidden="true">
        <div className={styles.chrome}>
          <span className={styles.dot} />
          <span className={styles.chromeName}>caesar · encrypt · shift {SHIFT}</span>
          <span className={styles.chromeStep}>
            step {index + 1}/{steps.length}
          </span>
        </div>

        {/*
          The mapping the shift defines, kept on screen the whole time. Without
          it the tape below is just letters changing; with it you can see the
          alphabet has been slid three places and read the answer off it.
        */}
        <div className={styles.map}>
          <span className={styles.mapRow}>
            {A_Z.map((ch, i) => (
              <span
                key={ch}
                className={`${styles.mapCell} ${i === s.fromIndex ? styles.mapFrom : ''}`}
              >
                {ch}
              </span>
            ))}
          </span>
          <span className={styles.mapRow}>
            {A_Z.map((_, i) => (
              <span
                key={i}
                className={`${styles.mapCell} ${styles.mapLower} ${
                  i === s.fromIndex ? styles.mapTo : ''
                }`}
              >
                {A_Z[(i + SHIFT) % 26]}
              </span>
            ))}
          </span>
        </div>

        <div className={styles.tapes}>
          <div className={styles.tape}>
            <span className={styles.tapeLabel}>in</span>
            <span className={styles.cells}>
              {INPUT.split('').map((ch, i) => (
                <span
                  key={i}
                  className={[
                    styles.cell,
                    i === s.pos ? styles.cellActive : i < done ? styles.cellDone : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {ch === ' ' ? '·' : ch}
                </span>
              ))}
            </span>
          </div>

          <div className={styles.tape}>
            <span className={styles.tapeLabel}>out</span>
            <span className={styles.cells}>
              {INPUT.split('').map((_, i) => (
                <span
                  key={i}
                  className={[
                    styles.cell,
                    i < done ? styles.cellOut : styles.cellEmpty,
                    i === s.pos ? styles.cellJust : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {i < done ? (s.outputSoFar[i] === ' ' ? '·' : s.outputSoFar[i]) : '·'}
                </span>
              ))}
            </span>
          </div>
        </div>

        <p className={styles.calc}>
          {s.kind === 'char' ? (
            <>
              <span className={styles.calcChar}>{s.fromChar}</span>
              <span className={styles.calcOp}>
                {s.fromIndex} + {SHIFT} = {s.toIndex} (mod 26)
              </span>
              <span className={styles.calcArrow}>→</span>
              <span className={styles.calcOut}>{s.toChar}</span>
            </>
          ) : (
            <span className={styles.calcOp}>{step.title}</span>
          )}
        </p>

        <div className={styles.progress}>
          <span
            className={styles.progressFill}
            style={{ width: `${((index + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
