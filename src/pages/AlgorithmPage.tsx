import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CodePanel } from '@/components/code/CodePanel';
import { Icon } from '@/components/ui/Icon';
import { Console } from '@/components/playground/Console';
import { Notation } from '@/components/ui/Notation';
import { Tabs, type TabSpec } from '@/components/ui/Tabs';
import { StepPlayer } from '@/components/walkthrough/StepPlayer';
import { Seo } from '@/components/Seo';
import { CATEGORIES, getAlgorithm } from '@/core/registry';
import { SITE_NAME, SITE_URL, absoluteUrl } from '@/core/site';
import type { AnyAlgorithm, Direction, Params } from '@/core/types';
import { NotFoundPage } from './NotFoundPage';
import styles from './AlgorithmPage.module.css';

/** The human-facing name of a category, rather than its enum value. */
function categoryLabel(id: AnyAlgorithm['meta']['category']): string {
  return CATEGORIES.find((c) => c.id === id)?.title ?? id;
}

function algorithmSeo(algo: AnyAlgorithm) {
  const { meta, content } = algo;
  const path = `/a/${meta.id}`;
  const title = `${meta.name}; Interactive Visualizer & Playground | ${SITE_NAME}`;
  const description =
    `${content.tagline} Step through ${meta.name} on real input and experiment with your own keys in a live playground.`.slice(
      0,
      160,
    );
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'LearningResource',
      name: meta.name,
      headline: `${meta.name}, how it works, step by step`,
      description: content.overview[0] ?? content.tagline,
      url: absoluteUrl(path),
      learningResourceType: 'Interactive visualization',
      educationalLevel: 'Beginner to intermediate',
      about: { '@type': 'Thing', name: `${meta.name} (cryptographic algorithm)` },
      isAccessibleForFree: true,
      inLanguage: 'en',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: SITE_NAME, item: SITE_URL },
        {
          '@type': 'ListItem',
          position: 2,
          name: meta.name,
          item: absoluteUrl(path),
        },
      ],
    },
  ];
  return { title, description, path, jsonLd };
}

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

  const seo = algorithmSeo(algo);

  return (
    <article className={styles.page}>
      <Seo
        title={seo.title}
        description={seo.description}
        path={seo.path}
        type="article"
        jsonLd={seo.jsonLd}
      />
      <header className={styles.head}>
        <div className={styles.headMain}>
          <div className={styles.badges}>
          <span className={styles.badge}>{categoryLabel(algo.meta.category)}</span>
          {algo.meta.era && (
            <span className={styles.badgeDim}>{algo.meta.era}</span>
          )}
          {/* Pips are decoration; the sr-only text carries the meaning, so
              the unfilled ones are exempt from text-contrast rules. */}
          <span className={styles.difficulty}>
            <span className="sr-only">
              Difficulty {algo.meta.difficulty} of 5
            </span>
            <span aria-hidden="true">
              {'\u25cf'.repeat(algo.meta.difficulty)}
              <span className={styles.difficultyOff}>
                {'\u25cf'.repeat(5 - algo.meta.difficulty)}
              </span>
            </span>
          </span>
        </div>
          <h1 className={styles.title}>{algo.meta.name}</h1>
          <p className={styles.tagline}>{algo.content.tagline}</p>
        </div>

        {/*
          The background now comes first, which is right for a reader arriving
          cold and wrong for one who already knows the cipher. Two destinations
          are enough: the interactive half of the page, and the code. They sit
          in the empty space beside the title on a wide screen.
        */}
        <nav className={styles.jump} aria-label="Jump to section">
          <a className={`${styles.jumpLink} ${styles.jumpPrimary}`} href="#playground">
            <Icon name="play" size={15} />
            <span className={styles.jumpText}>
              <span className={styles.jumpTitle}>Try it yourself</span>
            </span>
          </a>
          <a className={styles.jumpLink} href="#implementation">
            <Icon name="code" size={15} />
            <span className={styles.jumpText}>
              <span className={styles.jumpTitle}>See the code</span>
            </span>
          </a>
        </nav>
      </header>

      {/*
        Context first. A reader arriving cold needs to know what the algorithm
        is before a step trace means anything, and the tabs keep it to one
        screenful so the interactive parts stay within reach.
      */}
      <section className={styles.section} aria-label="About this cipher">
        <h2 className={styles.sectionTitle}>
          <span className={styles.sectionKicker}>about</span>
          What it is, and how it breaks
        </h2>
        <Tabs label="About this cipher" tabs={contentTabs(algo)} />
      </section>

      {/*
        Playground beside the walkthrough, both driven by the one `result`
        computed above, so what the console prints and where the walkthrough
        ends up cannot disagree.
      */}
      <div className={styles.work}>
        <div className={styles.playground} id="playground">
          <h2 className={styles.sectionTitle}>
            <span className={styles.sectionKicker}>playground</span>
            Try it yourself
          </h2>
          <Console
            algo={algo}
            input={input}
            params={params}
            direction={direction}
            result={result}
            onInputChange={setInput}
            onParamChange={(key, v) =>
              setParams((prev) => ({ ...prev, [key]: v }))
            }
            onDirectionChange={setDirection}
          />
        </div>

        <section className={styles.walkthrough} id="walkthrough" aria-label="Walkthrough">
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
      </div>

      <section className={styles.implementation} id="implementation" aria-label="Implementation">
        <h2 className={styles.sectionTitle}>
          <span className={styles.sectionKicker}>implementation</span>
          The code that does it
        </h2>
        <CodePanel samples={algo.code} />
      </section>
    </article>
  );
}

/**
 * The surrounding context every algorithm carries. Tabs rather than four
 * stacked cards: on the modern pages the prose ran longer than the
 * visualization it was explaining, which buried the walkthrough.
 */
function contentTabs(algo: AnyAlgorithm): TabSpec[] {
  const tabs: TabSpec[] = [
    { id: 'overview', label: 'Overview', content: <Prose paragraphs={algo.content.overview} /> },
    {
      id: 'notation',
      label: 'Notation',
      content: (
        <Notation formula={algo.content.formula} symbols={algo.content.symbols} />
      ),
    },
    { id: 'history', label: 'History', content: <Prose paragraphs={algo.content.history} /> },
    {
      id: 'weaknesses',
      label: 'Weaknesses',
      content: <Prose paragraphs={algo.content.weaknesses} accent="warn" />,
    },
  ];
  return tabs;
}

function Prose({
  paragraphs,
  accent,
}: {
  paragraphs: string[];
  accent?: 'warn';
}) {
  return (
    <div className={`${styles.block} ${accent ? styles.blockWarn : ''}`}>
      {paragraphs.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </div>
  );
}
