import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Console } from '@/components/playground/Console';
import { StepPlayer } from '@/components/walkthrough/StepPlayer';
import { getAlgorithm } from '@/core/registry';
import type { AnyAlgorithm, Direction, Params } from '@/core/types';
import { NotFoundPage } from './NotFoundPage';
import styles from './AlgorithmPage.module.css';

export function AlgorithmPage() {
  const { id } = useParams();
  const algo = id ? getAlgorithm(id) : undefined;

  if (!algo) return <NotFoundPage />;

  // `key` resets all interactive state when navigating between algorithms.
  return <AlgorithmExperience key={algo.meta.id} algo={algo} />;
}

function initialParams(algo: AnyAlgorithm): Params {
  const p: Params = { ...algo.sample.params };
  for (const spec of algo.params) {
    if (p[spec.key] === undefined) p[spec.key] = spec.default;
  }
  return p;
}

function AlgorithmExperience({ algo }: { algo: AnyAlgorithm }) {
  const [input, setInput] = useState(algo.sample.input);
  const [params, setParams] = useState<Params>(() => initialParams(algo));
  const [direction, setDirection] = useState<Direction>(
    algo.sample.direction ?? 'encrypt',
  );

  // The single source of truth: both the console output and the walkthrough
  // steps come from this one call. They cannot disagree.
  const result = useMemo(
    () => algo.run(input, params, direction),
    [algo, input, params, direction],
  );

  return (
    <article className={styles.page}>
      <header className={styles.head}>
        <div className={styles.badges}>
          <span className={styles.badge}>{algo.meta.category}</span>
          {algo.meta.era && (
            <span className={styles.badgeDim}>{algo.meta.era}</span>
          )}
          <span className={styles.difficulty} title="Difficulty">
            {'●'.repeat(algo.meta.difficulty)}
            <span className={styles.difficultyOff}>
              {'●'.repeat(5 - algo.meta.difficulty)}
            </span>
          </span>
        </div>
        <h1 className={styles.title}>{algo.meta.name}</h1>
        <p className={styles.tagline}>{algo.content.tagline}</p>
      </header>

      <Console
        algo={algo}
        input={input}
        params={params}
        direction={direction}
        result={result}
        onInputChange={setInput}
        onParamChange={(key, v) => setParams((prev) => ({ ...prev, [key]: v }))}
        onDirectionChange={setDirection}
      />

      <section className={styles.section} aria-label="Walkthrough">
        <h2 className={styles.sectionTitle}>
          <span className={styles.sectionKicker}>walkthrough</span>
          Watch it work, step by step
        </h2>
        <StepPlayer
          steps={result.steps}
          Visualizer={algo.Visualizer}
          direction={direction}
        />
      </section>

      <section className={styles.section} aria-label="About this cipher">
        <div className={styles.prose}>
          <ContentBlock title="Overview" paragraphs={algo.content.overview} />
          <ContentBlock title="History" paragraphs={algo.content.history} />
          <ContentBlock
            title="Weaknesses"
            paragraphs={algo.content.weaknesses}
            accent="warn"
          />
          {algo.content.notes && (
            <ContentBlock
              title="Implementation notes"
              paragraphs={algo.content.notes}
              muted
            />
          )}
        </div>
      </section>
    </article>
  );
}

function ContentBlock({
  title,
  paragraphs,
  accent,
  muted,
}: {
  title: string;
  paragraphs: string[];
  accent?: 'warn';
  muted?: boolean;
}) {
  return (
    <div
      className={`${styles.block} ${accent ? styles.blockWarn : ''} ${
        muted ? styles.blockMuted : ''
      }`}
    >
      <h3 className={styles.blockTitle}>{title}</h3>
      {paragraphs.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </div>
  );
}
