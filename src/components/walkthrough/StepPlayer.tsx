/**
 * Generic, learner-paced player for a step trace. It owns navigation (first /
 * prev / next / last, scrubber, autoplay, arrow keys) and delegates rendering
 * of each step's *content* to the algorithm's Visualizer. Every algorithm
 * reuses this shell — the bespoke part is only the Visualizer.
 */

import {
  type ComponentType,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import type { AlgorithmVisualizerProps, Direction, Step } from '@/core/types';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import styles from './StepPlayer.module.css';

interface StepPlayerProps<S> {
  steps: Step<S>[];
  Visualizer: ComponentType<AlgorithmVisualizerProps<S>>;
  direction: Direction;
}

const SPEEDS = [
  { label: '0.5×', ms: 1600 },
  { label: '1×', ms: 900 },
  { label: '2×', ms: 450 },
];

export function StepPlayer<S>({
  steps,
  Visualizer,
  direction,
}: StepPlayerProps<S>) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speedIdx, setSpeedIdx] = useState(1);
  const [animating, setAnimating] = useState(false);
  const reducedMotion = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);

  const count = steps.length;
  const clamped = Math.min(index, Math.max(0, count - 1));
  const atStart = clamped === 0;
  const atEnd = clamped >= count - 1;

  // If the trace changes (new input/key) and our index is now out of range,
  // snap back into range and stop playing.
  useEffect(() => {
    setIndex((i) => Math.min(i, Math.max(0, count - 1)));
  }, [count]);

  const go = useCallback(
    (next: number, viaPlay = false) => {
      setAnimating(viaPlay);
      setIndex(() => Math.max(0, Math.min(next, count - 1)));
    },
    [count],
  );

  // Autoplay.
  useEffect(() => {
    if (!playing) return;
    if (atEnd) {
      setPlaying(false);
      return;
    }
    const id = window.setTimeout(
      () => go(clamped + 1, true),
      SPEEDS[speedIdx].ms,
    );
    return () => window.clearTimeout(id);
  }, [playing, clamped, atEnd, speedIdx, go]);

  const togglePlay = useCallback(() => {
    if (atEnd) {
      go(0);
      setPlaying(true);
    } else {
      setPlaying((p) => !p);
    }
  }, [atEnd, go]);

  // Keyboard: arrows navigate, space toggles play, Home/End jump.
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault();
          setPlaying(false);
          go(clamped + 1);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          setPlaying(false);
          go(clamped - 1);
          break;
        case 'Home':
          e.preventDefault();
          setPlaying(false);
          go(0);
          break;
        case 'End':
          e.preventDefault();
          setPlaying(false);
          go(count - 1);
          break;
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
      }
    },
    [clamped, count, go, togglePlay],
  );

  if (count === 0) {
    return (
      <div className={styles.empty}>
        Enter some input to generate a walkthrough.
      </div>
    );
  }

  const step = steps[clamped];

  return (
    <div
      className={styles.player}
      ref={rootRef}
      role="group"
      aria-roledescription="algorithm walkthrough"
      aria-label="Step-by-step walkthrough"
      tabIndex={0}
      onKeyDown={onKeyDown}
    >
      <div className={styles.header}>
        <div className={styles.stepMeta}>
          {step.phase && <span className={styles.phase}>{step.phase}</span>}
          <span className={styles.counter}>
            step {clamped + 1} / {count}
          </span>
        </div>
        <h3 className={styles.title}>{step.title}</h3>
        <p className={styles.desc}>{step.description}</p>
      </div>

      <div
        className={styles.stage}
        aria-live={reducedMotion ? 'polite' : 'off'}
      >
        <Visualizer
          step={step}
          direction={direction}
          animating={animating && !reducedMotion}
        />
      </div>

      <div className={styles.controls}>
        <div className={styles.buttons}>
          <button
            className={styles.ctrl}
            onClick={() => {
              setPlaying(false);
              go(0);
            }}
            disabled={atStart}
            aria-label="First step"
            title="First (Home)"
          >
            ⏮
          </button>
          <button
            className={styles.ctrl}
            onClick={() => {
              setPlaying(false);
              go(clamped - 1);
            }}
            disabled={atStart}
            aria-label="Previous step"
            title="Previous (←)"
          >
            ‹
          </button>
          <button
            className={`${styles.ctrl} ${styles.play}`}
            onClick={togglePlay}
            aria-label={playing ? 'Pause' : 'Play'}
            title="Play / pause (space)"
          >
            {playing ? '❚❚' : '▶'}
          </button>
          <button
            className={styles.ctrl}
            onClick={() => {
              setPlaying(false);
              go(clamped + 1);
            }}
            disabled={atEnd}
            aria-label="Next step"
            title="Next (→)"
          >
            ›
          </button>
          <button
            className={styles.ctrl}
            onClick={() => {
              setPlaying(false);
              go(count - 1);
            }}
            disabled={atEnd}
            aria-label="Last step"
            title="Last (End)"
          >
            ⏭
          </button>
        </div>

        <label className={styles.scrubberWrap}>
          <span className="sr-only">Step position</span>
          <input
            className={styles.scrubber}
            type="range"
            min={0}
            max={count - 1}
            value={clamped}
            onChange={(e) => {
              setPlaying(false);
              go(Number(e.target.value));
            }}
            aria-label="Scrub steps"
          />
        </label>

        <div className={styles.speed} role="group" aria-label="Playback speed">
          {SPEEDS.map((sp, i) => (
            <button
              key={sp.label}
              className={`${styles.speedBtn} ${i === speedIdx ? styles.speedOn : ''}`}
              onClick={() => setSpeedIdx(i)}
              aria-pressed={i === speedIdx}
            >
              {sp.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
