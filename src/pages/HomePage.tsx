import { Link } from 'react-router-dom';
import { Seo } from '@/components/Seo';
import { HeroDemo } from '@/components/home/HeroDemo';
import { Icon } from '@/components/ui/Icon';
import { CATEGORIES, algorithmGroups, algorithms } from '@/core/registry';
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TAGLINE,
  SITE_URL,
  absoluteUrl,
  ogImageForPath,
} from '@/core/site';
import styles from './HomePage.module.css';

/*
 * Figures for the stat strip. Everything countable is counted from the
 * registry rather than typed in, so adding an algorithm updates the landing
 * page too — a hardcoded "24 algorithms" is stale the day after launch.
 */
const STATS = [
  {
    value: String(algorithms.length),
    label: 'algorithms',
    note: 'Caesar through ML-DSA',
  },
  {
    value: String(CATEGORIES.length),
    label: 'families',
    note: 'classical to post-quantum',
  },
  {
    value: '2',
    label: 'languages',
    note: 'Python and TypeScript, on every page',
  },
  {
    value: '1',
    label: 'shared engine',
    note: 'the walkthrough and the console cannot disagree',
  },
];

const FEATURES = [
  {
    icon: 'steps',
    title: 'A walkthrough you drive',
    body: 'Every algorithm is traced into real steps, not summarised into a black box. Move a step at a time, jump between phases, or let it play. Key schedules, S-box lookups, permutation wiring and round state are all on screen, with the intermediate values that actually produced them.',
  },
  {
    icon: 'terminal',
    title: 'A console with your own input',
    body: 'Type your own message and keys and get real output back. Bad keys are explained rather than swallowed: a Hill matrix that cannot be inverted, an affine multiplier that shares a factor with 26, a DES key of the wrong length all say so, and say why.',
  },
  {
    icon: 'code',
    title: 'The source, in two languages',
    body: 'A readable, dependency-free Python implementation sits beside the exact TypeScript engine that produced the output above it. Both are checked against the same published test vectors on every build, so neither can quietly drift from what the page is teaching.',
  },
] as const;

export function HomePage() {
  const groups = algorithmGroups();

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE_NAME,
      alternateName: `${SITE_NAME}, ${SITE_TAGLINE}`,
      url: SITE_URL,
      description: SITE_DESCRIPTION,
      image: absoluteUrl(ogImageForPath('/')),
      inLanguage: 'en',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Cryptographic algorithms',
      itemListElement: algorithms.map((a, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: a.meta.name,
        url: absoluteUrl(`/a/${a.meta.id}`),
      })),
    },
  ];

  return (
    <div className={styles.home}>
      <Seo
        title={`${SITE_NAME}, ${SITE_TAGLINE}`}
        description={SITE_DESCRIPTION}
        path="/"
        type="website"
        imageAlt={`${SITE_NAME}: ${algorithms.length} cryptographic algorithms, visualized step by step`}
        jsonLd={jsonLd}
      />

      {/* Hero ------------------------------------------------------------ */}
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.kicker}>
            <span className={styles.kickerDot} />
            an interactive cryptography lab
          </p>
          <h1 className={styles.headline}>
            Real ciphers, taken apart{' '}
            <span className={styles.headlineAccent}>one step at a time.</span>
          </h1>
          <p className={styles.sub}>
            {algorithms.length} algorithms, from the Caesar shift to lattice
            signatures, each one running its actual cryptographic logic in your
            browser. Watch the machinery work on real input, then take the keys
            and try to break it yourself.
          </p>

          <div className={styles.ctas}>
            <Link className={styles.ctaPrimary} to="/a/caesar">
              Start with the Caesar cipher
              <Icon name="arrow" size={15} />
            </Link>
            <a className={styles.ctaSecondary} href="#catalogue">
              Browse all {algorithms.length}
            </a>
          </div>

          <p className={styles.trust}>
            No accounts, no tracking, nothing sent to a server. Every
            computation happens on this page.
          </p>
        </div>

        <div className={styles.heroDemo}>
          <HeroDemo />
        </div>
      </section>

      {/* Stats ----------------------------------------------------------- */}
      <section className={styles.stats} aria-label="At a glance">
        {STATS.map((s) => (
          <div key={s.label} className={styles.stat}>
            <span className={styles.statValue}>{s.value}</span>
            <span className={styles.statLabel}>{s.label}</span>
            <span className={styles.statNote}>{s.note}</span>
          </div>
        ))}
      </section>

      {/* What a page contains -------------------------------------------- */}
      <section className={styles.section} aria-labelledby="what">
        <p className={styles.eyebrow}>What you get</p>
        <h2 className={styles.sectionTitle} id="what">
          Three views of the same algorithm
        </h2>
        <p className={styles.sectionLead}>
          Every algorithm page is built the same way, so once you know your way
          around one you know your way around all {algorithms.length}.
        </p>

        <ul className={styles.features}>
          {FEATURES.map((f, i) => (
            <li key={f.title} className={styles.feature}>
              <span className={styles.featureIcon}>
                <Icon name={f.icon} size={18} />
              </span>
              <span className={styles.featureNum}>{String(i + 1).padStart(2, '0')}</span>
              <h3 className={styles.featureTitle}>{f.title}</h3>
              <p className={styles.featureBody}>{f.body}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Catalogue -------------------------------------------------------- */}
      <section className={styles.section} id="catalogue" aria-labelledby="catalogue-title">
        <p className={styles.eyebrow}>The catalogue</p>
        <h2 className={styles.sectionTitle} id="catalogue-title">
          Pick somewhere to start
        </h2>
        <p className={styles.sectionLead}>
          Roughly in the order they were invented, and roughly in the order they
          are worth learning: each family builds on the ideas of the one before
          it.
        </p>

        <div className={styles.groups}>
          {groups.map((group) => (
            <section key={group.id} className={styles.group} aria-labelledby={`g-${group.id}`}>
              <header className={styles.groupHead}>
                <h3 className={styles.groupTitle} id={`g-${group.id}`}>
                  {group.title}
                </h3>
                <span className={styles.groupCount}>{group.items.length}</span>
                <p className={styles.groupBlurb}>{group.blurb}</p>
              </header>

              <ul className={styles.grid}>
                {group.items.map((a) => (
                  <li key={a.meta.id}>
                    <Link to={`/a/${a.meta.id}`} className={styles.card}>
                      <span className={styles.cardTop}>
                        <span className={styles.cardEra}>{a.meta.era ?? ''}</span>
                        <span className={styles.cardDiff}>
                          <span className="sr-only">
                            Difficulty {a.meta.difficulty} of 5
                          </span>
                          <span aria-hidden="true">
                            {'●'.repeat(a.meta.difficulty)}
                            <span className={styles.cardDiffOff}>
                              {'●'.repeat(5 - a.meta.difficulty)}
                            </span>
                          </span>
                        </span>
                      </span>
                      <h4 className={styles.cardName}>{a.meta.name}</h4>
                      <p className={styles.cardTag}>{a.content.tagline}</p>
                      <span className={styles.cardGo}>
                        open
                        <Icon name="arrow" size={13} />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </section>

      {/* Correctness + closing CTA ---------------------------------------- */}
      <section className={styles.closer} aria-labelledby="closer-title">
        <div className={styles.closerCopy}>
          <p className={styles.eyebrow}>Why you can trust the output</p>
          <h2 className={styles.sectionTitle} id="closer-title">
            Wrong output would teach the wrong thing
          </h2>
          <p className={styles.sectionLead}>
            A learning tool that quietly encrypts something incorrectly is worse
            than no tool at all, so correctness is tested rather than asserted.
            Every algorithm carries known-answer vectors taken from NIST, the
            relevant RFC, or the paper that introduced it, and both the
            TypeScript engine and the Python sample are run against them on
            every build.
          </p>
          <p className={styles.caveat}>
            This is a teaching tool. The implementations are written to be read,
            not to resist a side-channel attack. Use a vetted library for
            anything real, and each page says so where it matters.
          </p>
        </div>

        <div className={styles.closerCta}>
          <Link className={styles.ctaPrimary} to="/a/aes">
            Take apart AES
            <Icon name="arrow" size={15} />
          </Link>
          <Link className={styles.ctaSecondary} to="/a/ml-kem">
            Or jump to post-quantum
          </Link>
        </div>
      </section>
    </div>
  );
}
