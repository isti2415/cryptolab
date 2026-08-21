/**
 * Generic, learner-paced player for a step trace. It owns navigation (first /
 * prev / next / last, phase chapters, scrubber, autoplay, keyboard) and
 * delegates rendering of each step's *content* to the algorithm's Visualizer.
 * Every algorithm reuses this shell; the bespoke part is only the Visualizer.
 */

import {
  type ComponentType,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Icon } from '@/components/ui/Icon';
import type {
  AlgorithmVisualizerProps,
  Direction,
  Step,
  ValidationError,
} from '@/core/types';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import styles from './StepPlayer.module.css';

interface StepPlayerProps<S> {
  steps: Step<S>[];
  Visualizer: ComponentType<AlgorithmVisualizerProps<S>>;
  direction: Direction;
  /**
   * The error from the same `run()` that produced `steps`, if there was one.
   * An engine returns no steps both when there is nothing to do and when the
   * parameters were rejected, and those need to say different things: telling
   * someone to "enter some input" while the console beside it explains that
   * their Hill matrix is not invertible sends them looking in the wrong place.
   */
  error?: ValidationError;
  /**
   * Current step, lifted so the page can put it in the URL and a shared link
   * can land on the step someone wanted to show you. Uncontrolled if omitted.
   */
  index?: number;
  onIndexChange?: (index: number) => void;
}

const SPEEDS = [
  { label: '0.5×', ms: 1600 },
  { label: '1×', ms: 900 },
  { label: '2×', ms: 450 },
];

interface Chapter {
  phase: string;
  start: number;
  count: number;
}

/**
 * Contiguous runs of the same `phase`, used for the chapter rail. A 70-step DES
 * trace is unnavigable as an undifferentiated scrubber; as "Key schedule ·
 * Initial permutation · Rounds · Final" it is not.
 */
function toChapters<S>(steps: Step<S>[]): Chapter[] {
  const chapters: Chapter[] = [];
  steps.forEach((step, i) => {
    const phase = step.phase ?? '';
    const last = chapters[chapters.length - 1];
    if (last && last.phase === phase) last.count += 1;
    else chapters.push({ phase, start: i, count: 1 });
  });
  return chapters;
}

export function StepPlayer<S>({
  steps,
  Visualizer,
  direction,
  error,
  index: controlledIndex,
  onIndexChange,
}: StepPlayerProps<S>) {
  const [uncontrolledIndex, setUncontrolledIndex] = useState(0);
  const index = controlledIndex ?? uncontrolledIndex;

  /*
   * `setIndex` is kept referentially stable via refs rather than memoised on
   * `index`. Every callback below depends on it, so an identity that changed
   * once per step would rebuild the whole transport and re-run the autoplay
   * effect on every tick.
   */
  const indexRef = useRef(index);
  indexRef.current = index;
  const onIndexChangeRef = useRef(onIndexChange);
  onIndexChangeRef.current = onIndexChange;

  const setIndex = useCallback((next: number | ((prev: number) => number)) => {
    const resolve = (prev: number) =>
      typeof next === 'function' ? next(prev) : next;
    setUncontrolledIndex(resolve);
    onIndexChangeRef.current?.(resolve(indexRef.current));
  }, []);
  const [playing, setPlaying] = useState(false);
  const [speedIdx, setSpeedIdx] = useState(1);
  const [animating, setAnimating] = useState(false);
  const reducedMotion = useReducedMotion();

  const count = steps.length;
  const clamped = Math.min(index, Math.max(0, count - 1));
  const atStart = clamped === 0;
  const atEnd = clamped >= count - 1;

  const chapters = useMemo(() => toChapters(steps), [steps]);
  const hasChapters = chapters.length > 1 && chapters.some((c) => c.phase);

  // If the trace changes (new input/key) and our index is now out of range,
  // snap back into range and stop playing.
  useEffect(() => {
    setIndex((i) => Math.min(i, Math.max(0, count - 1)));
  }, [count, setIndex]);

  const go = useCallback(
    (next: number, viaPlay = false) => {
      setAnimating(viaPlay);
      setIndex(() => Math.max(0, Math.min(next, count - 1)));
    },
    [count, setIndex],
  );

  const stopAnd = useCallback(
    (next: number) => {
      setPlaying(false);
      go(next);
    },
    [go],
  );

  // Autoplay. Under `prefers-reduced-motion` the same trace still plays, but
  // slowly enough to read rather than as a flicker of state changes.
  useEffect(() => {
    if (!playing) return;
    if (atEnd) {
      setPlaying(false);
      return;
    }
    const base = SPEEDS[speedIdx].ms;
    const id = window.setTimeout(
      () => go(clamped + 1, true),
      reducedMotion ? Math.max(base, 1600) : base,
    );
    return () => window.clearTimeout(id);
  }, [playing, clamped, atEnd, speedIdx, go, reducedMotion]);

  const togglePlay = useCallback(() => {
    if (atEnd) {
      go(0);
      setPlaying(true);
    } else {
      setPlaying((p) => !p);
    }
  }, [atEnd, go]);

  /** Index of the first step of the chapter `delta` chapters away. */
  const jumpChapter = useCallback(
    (delta: number) => {
      const current = chapters.findIndex(
        (c) => clamped >= c.start && clamped < c.start + c.count,
      );
      const next = chapters[Math.max(0, Math.min(current + delta, chapters.length - 1))];
      if (next) stopAnd(next.start);
    },
    [chapters, clamped, stopAnd],
  );

  /**
   * Keyboard shortcuts fire only when the group itself holds focus.
   *
   * Previously this handler sat on the wrapper with no target check, so an
   * event bubbling up from a child hit `case ' '` and its `preventDefault()`
   * suppressed the child's own click; pressing Space on the "2×" button
   * toggled playback instead of changing speed.
   */
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.target !== e.currentTarget) return;
      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault();
          stopAnd(clamped + 1);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          stopAnd(clamped - 1);
          break;
        case 'Home':
          e.preventDefault();
          stopAnd(0);
          break;
        case 'End':
          e.preventDefault();
          stopAnd(count - 1);
          break;
        case ']':
          e.preventDefault();
          jumpChapter(1);
          break;
        case '[':
          e.preventDefault();
          jumpChapter(-1);
          break;
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
      }
    },
    [clamped, count, stopAnd, togglePlay, jumpChapter],
  );

  if (count === 0) {
    return (
      <div className={styles.empty}>
        {error
          ? 'No walkthrough yet: fix the highlighted field above and it will appear here.'
          : 'Enter some input to generate a walkthrough.'}
      </div>
    );
  }

  const step = steps[clamped];
  const prev = clamped > 0 ? steps[clamped - 1] : undefined;

  return (
    <div
      className={styles.player}
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
            Step {clamped + 1} / {count}
          </span>
        </div>
        <h3 className={styles.title}>{step.title}</h3>
        <p className={styles.desc}>{step.description}</p>
        {step.warning && (
          // `note`, not `alert`: nothing has gone wrong and nothing needs
          // interrupting; the run is valid and this is a remark about it.
          <p className={styles.warning} role="note">
            <span className={styles.warnBadge}>note</span>
            {step.warning}
          </p>
        )}
      </div>

      {/*
        Announced on every step change regardless of motion preference. The
        stage itself is not a live region: re-reading a whole visualization on
        each step is unusable, whereas this one line is the actual update.
      */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {`Step ${clamped + 1} of ${count}${step.phase ? `, ${step.phase}` : ''}. ${step.title}`}
      </div>

      <div className={styles.stage}>
        <Visualizer
          step={step}
          prev={prev}
          index={clamped}
          steps={steps}
          direction={direction}
          animating={animating && !reducedMotion}
        />
      </div>

      <div className={styles.controls}>
        {hasChapters && (
          <div className={styles.chapters} role="group" aria-label="Phases">
            {chapters.map((c) => {
              const active = clamped >= c.start && clamped < c.start + c.count;
              return (
                <button
                  key={`${c.phase}-${c.start}`}
                  type="button"
                  className={`${styles.chapter} ${active ? styles.chapterOn : ''}`}
                  style={{ flexGrow: c.count }}
                  onClick={() => stopAnd(c.start)}
                  aria-current={active ? 'step' : undefined}
                  title={`${c.phase || 'Steps'}; ${c.count} step${c.count === 1 ? '' : 's'}`}
                >
                  <span className="sr-only">
                    Jump to {c.phase || 'these steps'}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <div className={styles.transport}>
          <div className={styles.buttons}>
            <button
              type="button"
              className={styles.ctrl}
              onClick={() => stopAnd(0)}
              disabled={atStart}
              aria-label="First step"
              title="First (Home)"
            >
              <Icon name="first" />
            </button>
            <button
              type="button"
              className={styles.ctrl}
              onClick={() => stopAnd(clamped - 1)}
              disabled={atStart}
              aria-label="Previous step"
              title="Previous (←)"
            >
              <Icon name="prev" />
            </button>
            <button
              type="button"
              className={`${styles.ctrl} ${styles.play}`}
              onClick={togglePlay}
              aria-label={playing ? 'Pause' : 'Play'}
              title="Play / pause (space)"
            >
              <Icon name={playing ? 'pause' : 'play'} />
            </button>
            <button
              type="button"
              className={styles.ctrl}
              onClick={() => stopAnd(clamped + 1)}
              disabled={atEnd}
              aria-label="Next step"
              title="Next (→)"
            >
              <Icon name="next" />
            </button>
            <button
              type="button"
              className={styles.ctrl}
              onClick={() => stopAnd(count - 1)}
              disabled={atEnd}
              aria-label="Last step"
              title="Last (End)"
            >
              <Icon name="last" />
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
              onChange={(e) => stopAnd(Number(e.target.value))}
              aria-label="Scrub steps"
              aria-valuetext={`Step ${clamped + 1} of ${count}: ${step.title}`}
            />
          </label>

          <div className={styles.speed} role="group" aria-label="Playback speed">
            {SPEEDS.map((sp, i) => (
              <button
                type="button"
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
    </div>
  );
}
