/**
 * Enigma visualizer.
 *
 * The machine's whole character is that the current makes a round trip: in
 * through the plugboard and three rotors, off the reflector, and back out
 * through the same rotors by a different path. So the path is drawn as exactly
 * that; a chain of hops you can follow letter by letter.
 *
 * The rotor windows sit above it with the ones that advanced this keypress
 * marked, because the stepping is the other half of the machine and the
 * double-step anomaly is invisible unless you are watching for it.
 */

import { Cell } from '@/components/viz/Cell';
import { VizStage } from '@/components/viz/VizStage';
import { TapePair } from '@/components/viz/TapePair';
import type { AlgorithmVisualizerProps } from '@/core/types';
import type { EnigmaStepState } from './engine';
import styles from './Visualizer.module.css';

export function EnigmaVisualizer({
  step,
}: AlgorithmVisualizerProps<EnigmaStepState>) {
  const s = step.state;

  return (
    <VizStage>
      <VizStage.Context label="The machine">
        <div className={styles.rotors}>
          {s.positions.map((letter, i) => (
            <div className={styles.rotor} key={i}>
              <span className={styles.rotorId}>{s.rotorIds[i]}</span>
              <Cell state={s.stepped?.[i] ? 'active' : 'idle'} size="2.6em">
                {letter}
              </Cell>
              <span className={styles.rotorRing}>ring {s.ringSettings[i]}</span>
            </div>
          ))}
          <div className={styles.rotor}>
            <span className={styles.rotorId}>UKW</span>
            <Cell state="derived" size="2.6em">
              {s.reflector}
            </Cell>
            <span className={styles.rotorRing}>reflector</span>
          </div>
        </div>

        {s.doubleStep && (
          <p className={styles.anomaly}>
            Double step; the middle rotor was on its notch, so it advanced again
            and carried the left rotor with it.
          </p>
        )}

        <div className={styles.plugboard}>
          <span className={styles.label}>plugboard</span>
          <div className={styles.pairs}>
            {s.plugboard.length === 0 ? (
              <span className={styles.none}>nothing plugged</span>
            ) : (
              s.plugboard.map(([x, y]) => (
                <span
                  className={`${styles.pair} ${
                    s.inChar === x || s.inChar === y || s.outChar === x || s.outChar === y
                      ? styles.pairOn
                      : ''
                  }`}
                  key={x + y}
                >
                  {x}–{y}
                </span>
              ))
            )}
          </div>
        </div>
      </VizStage.Context>

      <VizStage.Focus label={s.hops ? 'The current' : 'Setup'}>
        {s.hops ? (
          <div className={styles.stack}>
            <ol className={styles.path}>
              {s.hops.map((hop, i) => (
                <li
                  className={`${styles.hop} ${
                    hop.stage.startsWith('reflector') ? styles.hopTurn : ''
                  }`}
                  key={i}
                >
                  <span className={styles.hopStage}>{hop.stage}</span>
                  <span className={styles.hopPair}>
                    {hop.from} <span className={styles.arrow}>→</span> {hop.to}
                  </span>
                </li>
              ))}
            </ol>
            <p className={styles.note}>
              The return path runs through the same rotors in the opposite
              direction, so it never retraces the way it came. That is what makes
              the machine its own inverse, and why no letter can ever come out
              as itself, the weakness Bletchley Park built its cribs on.
            </p>
          </div>
        ) : (
          <p className={styles.note}>
            The daily key was the rotor choice and order, their ring settings,
            the plugboard pairs and the starting window letters, around 10²³
            combinations. It was never the key space that failed.
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
        />
      </VizStage.Track>
    </VizStage>
  );
}
