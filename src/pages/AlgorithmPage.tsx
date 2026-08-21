import { useEffect, useMemo, useState } from 'react';
import { CodePanel } from '@/components/code/CodePanel';
import { Icon } from '@/components/ui/Icon';
import { Console } from '@/components/playground/Console';
import { Difficulty } from '@/components/ui/Difficulty';
import { Notation } from '@/components/ui/Notation';
import { Tabs, type TabSpec } from '@/components/ui/Tabs';
import { StepPlayer } from '@/components/walkthrough/StepPlayer';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Seo } from '@/components/Seo';
import { AlgorithmNav } from '@/components/layout/AlgorithmNav';
import { CATEGORIES } from '@/core/registry';
import { decodeState, encodeState } from '@/core/permalink';
import {
  SITE_NAME,
  SITE_URL,
  absoluteUrl,
  clampText,
  ogImageForPath,
} from '@/core/site';
import type {
  AlgorithmContent,
  AnyAlgorithm,
  Direction,
  Params,
} from '@/core/types';
import styles from './AlgorithmPage.module.css';

/** The human-facing name of a category, rather than its enum value. */
function categoryLabel(id: AnyAlgorithm['meta']['category']): string {
  return CATEGORIES.find((c) => c.id === id)?.title ?? id;
}

function algorithmSeo(algo: AnyAlgorithm) {
  const { meta, content } = algo;
  const path = `/a/${meta.id}`;
  const title = `${meta.name}: Interactive Visualizer and Playground | ${SITE_NAME}`;
  const description = clampText(
    `${meta.tagline} Step through it on real input, then try your own keys.`,
    155,
  );
  const socialDescription = clampText(meta.tagline, 125);
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'LearningResource',
      name: meta.name,
      headline: `${meta.name}, how it works, step by step`,
      description: content.overview[0] ?? meta.tagline,
      url: absoluteUrl(path),
      image: absoluteUrl(ogImageForPath(path)),
      learningResourceType: 'Interactive visualization',
      educationalLevel: 'Beginner to intermediate',
      about: { '@type': 'Thing', name: `${meta.name} (cryptographic algorithm)` },
      isAccessibleForFree: true,
      inLanguage: 'en',
      keywords: [meta.name, categoryLabel(meta.category), 'cryptography', 'visualization']
        .join(', '),
      provider: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
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
  const imageAlt = `${meta.name}: ${meta.tagline}`;
  return { title, description, socialDescription, path, imageAlt, jsonLd };
}

/**
 * The algorithm arrives as a prop from the route's `lazy()` (see `App.tsx`)
 * rather than being looked up in a fully-loaded registry, which is what allows
 * the other twenty-three algorithms to stay out of this page's chunk.
 */
export function AlgorithmPage({ algo }: { algo: AnyAlgorithm }) {
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
  const [step, setStep] = useState(0);

  /*
   * The URL is read once, after mount, and never during render. That ordering
   * is what keeps prerendering intact: the server and the first client render
   * both produce the sample, so the HTML matches and hydration is clean, and
   * only then does a shared link take effect.
   */
  const [shareReady, setShareReady] = useState(false);
  useEffect(() => {
    const shared = decodeState(window.location.search, algo.params, algo.sample);
    setInput(shared.input);
    setParams(shared.params);
    setDirection(shared.direction);
    if (shared.step !== undefined) setStep(shared.step);
    setShareReady(true);
  }, [algo]);

  /*
   * Writes back with `replaceState`, not `pushState`: typing a message would
   * otherwise stack one history entry per keystroke and make the Back button
   * useless. The address bar stays shareable; Back still leaves the page.
   */
  useEffect(() => {
    /*
     * State, not a ref. Both effects run in the same commit, so a ref set by
     * the one above would already read true here while `input` and friends
     * still held the sample — which rewrote the address bar to the defaults
     * for one frame and threw away the very link that was being opened.
     * A state flag only becomes true on the render that also carries the
     * decoded values.
     */
    if (!shareReady) return;
    const query = encodeState(
      { input, params, direction, step },
      algo.params,
      algo.sample,
    );
    window.history.replaceState(
      null,
      '',
      `${window.location.pathname}${query}${window.location.hash}`,
    );
  }, [algo, input, params, direction, step, shareReady]);

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
        socialDescription={seo.socialDescription}
        path={seo.path}
        type="article"
        imageAlt={seo.imageAlt}
        jsonLd={seo.jsonLd}
      />
      <header className={styles.head}>
        <div className={styles.headMain}>
          <div className={styles.badges}>
          <span className={styles.badge}>{categoryLabel(algo.meta.category)}</span>
          {algo.meta.era && (
            <span className={styles.badgeDim}>{algo.meta.era}</span>
          )}
          <Difficulty level={algo.meta.difficulty} className={styles.difficulty} />
        </div>
          <h1 className={styles.title}>{algo.meta.name}</h1>
          <p className={styles.tagline}>{algo.meta.tagline}</p>
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
            step={step}
          />
        </div>

        <section className={styles.walkthrough} id="walkthrough" aria-label="Walkthrough">
          <h2 className={styles.sectionTitle}>
            <span className={styles.sectionKicker}>walkthrough</span>
            Watch it work, step by step
          </h2>
          <ErrorBoundary
            fallback={
              <p className={styles.vizFailed} role="alert">
                This walkthrough could not be drawn. The playground above still
                shows the real output; try a different input or key.
              </p>
            }
          >
            <StepPlayer
              steps={result.steps}
              Visualizer={algo.Visualizer}
              direction={direction}
              error={result.error}
              index={step}
              onIndexChange={setStep}
            />
          </ErrorBoundary>
        </section>
      </div>

      <section className={styles.implementation} id="implementation" aria-label="Implementation">
        <h2 className={styles.sectionTitle}>
          <span className={styles.sectionKicker}>implementation</span>
          The code that does it
        </h2>
        <CodePanel samples={algo.code} />
      </section>

      <AlgorithmNav id={algo.meta.id} />
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
  if (algo.content.sources?.length) {
    tabs.push({
      id: 'sources',
      label: 'Sources',
      content: <Sources sources={algo.content.sources} />,
    });
  }
  return tabs;
}

/**
 * The standards and papers the prose leans on. External, so they open in a new
 * tab and carry `rel="noreferrer"`; a teaching page that names Kasiski and
 * Sweet32 and cites neither is asking to be taken on trust.
 */
function Sources({
  sources,
}: {
  sources: NonNullable<AlgorithmContent['sources']>;
}) {
  return (
    <div className={styles.block}>
      <ul className={styles.sources}>
        {sources.map((s) => (
          <li key={s.url}>
            <a href={s.url} target="_blank" rel="noreferrer">
              {s.label}
            </a>
            {s.note && <span className={styles.sourceNote}>{s.note}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
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
