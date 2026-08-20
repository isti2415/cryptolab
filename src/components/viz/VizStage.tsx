/**
 * The layout system every visualization sits in.
 *
 * Before this existed, each visualizer dropped a loosely-aligned column into a
 * centred flex box with a 220px min-height, which is why the Playfair square
 * and the Hill matrix floated in half-empty rectangles: there was no shared
 * notion of where anything belonged. Three named regions fix that, and give
 * extra width something useful to do:
 *
 *   Context  persistent reference the learner keeps glancing back at: the key
 *            square, the S-box, the round-key schedule, the tableau.
 *   Focus    the operation this particular step performs, blown up.
 *   Track    full-width progress: input consumed, output produced.
 *
 * Context and Focus sit side by side once there is room and stack when there
 * isn't. Width is used to show *more of the algorithm*, never to pad a small
 * diagram out to the panel edge.
 */

import type { ReactNode } from 'react';
import styles from './VizStage.module.css';

function Region({
  children,
  label,
  className,
}: {
  children: ReactNode;
  label?: ReactNode;
  className: string;
}) {
  return (
    <section className={className}>
      {label && <h4 className={styles.label}>{label}</h4>}
      <div className={styles.regionBody}>{children}</div>
    </section>
  );
}

interface VizStageProps {
  children: ReactNode;
  /**
   * `split` (default) puts Context beside Focus once there is room.
   * `stack` keeps every region full-width: the right choice when both regions
   * are themselves wide (a 26-column alphabet strip over a 26-bucket
   * histogram), where splitting would starve one of them.
   */
  layout?: 'split' | 'stack';
}

export function VizStage({ children, layout = 'split' }: VizStageProps) {
  return (
    <div className={styles.viz}>
      <div className={`${styles.grid} ${layout === 'stack' ? styles.stack : ''}`}>
        {children}
      </div>
    </div>
  );
}

VizStage.Context = function Context(props: {
  children: ReactNode;
  label?: ReactNode;
}) {
  return <Region {...props} className={styles.context} />;
};

VizStage.Focus = function Focus(props: {
  children: ReactNode;
  label?: ReactNode;
}) {
  return <Region {...props} className={styles.focus} />;
};

VizStage.Track = function Track(props: {
  children: ReactNode;
  label?: ReactNode;
}) {
  return <Region {...props} className={styles.track} />;
};
