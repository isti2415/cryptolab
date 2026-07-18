import { Link } from 'react-router-dom';
import { algorithms } from '@/core/registry';
import { Seo } from '@/components/Seo';
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TAGLINE,
  SITE_URL,
  absoluteUrl,
} from '@/core/site';
import styles from './HomePage.module.css';

export function HomePage() {
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE_NAME,
      alternateName: `${SITE_NAME} — ${SITE_TAGLINE}`,
      url: SITE_URL,
      description: SITE_DESCRIPTION,
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
        title={`${SITE_NAME} — ${SITE_TAGLINE}`}
        description={SITE_DESCRIPTION}
        path="/"
        type="website"
        jsonLd={jsonLd}
      />
      <section className={styles.hero}>
        <p className={styles.kicker}>a hands-on cryptography lab</p>
        <h1 className={styles.headline}>
          Watch real ciphers turn real input into real output — one step at a
          time.
        </h1>
        <p className={styles.sub}>
          Every algorithm here runs the actual cryptographic logic, not a
          simulation. Step through the animated walkthrough to see the machinery,
          then play with your own input and keys in the live console. The two are
          driven by the exact same code, so they can never disagree.
        </p>
      </section>

      <section aria-label="Algorithms">
        <h2 className={styles.gridTitle}>Choose an algorithm</h2>
        <ul className={styles.grid}>
          {algorithms.map((a) => (
            <li key={a.meta.id}>
              <Link to={`/a/${a.meta.id}`} className={styles.card}>
                <div className={styles.cardTop}>
                  <span className={styles.cardCat}>{a.meta.category}</span>
                  {a.meta.era && (
                    <span className={styles.cardEra}>{a.meta.era}</span>
                  )}
                </div>
                <h3 className={styles.cardName}>{a.meta.name}</h3>
                <p className={styles.cardTag}>{a.content.tagline}</p>
                <span className={styles.cardGo}>open →</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
