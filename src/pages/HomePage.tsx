import { Link } from 'react-router-dom';
import { algorithms } from '@/core/registry';
import styles from './HomePage.module.css';

export function HomePage() {
  return (
    <div className={styles.home}>
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
