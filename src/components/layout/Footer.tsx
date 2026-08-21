/**
 * The site had no footer at all, which meant the licence, the source and the
 * accessibility notes existed in the repository and nowhere a reader could
 * reach them — and, more importantly, that someone who spotted an error had no
 * route for saying so. On a site whose whole claim is "this is real and
 * correct", that route is part of the argument.
 */

import { Link } from 'react-router-dom';
import { REPO_URL, SITE_NAME } from '@/core/site';
import styles from './Footer.module.css';

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <p className={styles.note}>
          {SITE_NAME} teaches cryptography by running it. The implementations are
          written to be read, not deployed: several are deliberately broken
          constructions, shown because they are broken. Never use them to protect
          anything.
        </p>

        <nav className={styles.links} aria-label="About this site">
          <Link to="/">Home</Link>
          <a href={REPO_URL} target="_blank" rel="noreferrer">
            Source
          </a>
          <a
            href={`${REPO_URL}/issues/new`}
            target="_blank"
            rel="noreferrer"
          >
            Report an error
          </a>
          <a href={`${REPO_URL}/blob/main/LICENSE`} target="_blank" rel="noreferrer">
            MIT licence
          </a>
        </nav>
      </div>
    </footer>
  );
}
