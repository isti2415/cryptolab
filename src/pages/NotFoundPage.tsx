import { Link } from 'react-router-dom';
import { Seo } from '@/components/Seo';
import { SITE_NAME } from '@/core/site';

export function NotFoundPage() {
  return (
    <div style={{ padding: '40px 0', maxWidth: '48ch' }}>
      <Seo
        title={`Page not found | ${SITE_NAME}`}
        description="The page you were looking for doesn’t exist."
        path="/404"
        noindex
      />
      <p
        style={{
          color: 'var(--signal)',
          fontSize: 'var(--fs-xs)',
          letterSpacing: 'var(--tracking-wider)',
          textTransform: 'uppercase',
        }}
      >
        404 · nothing to decipher
      </p>
      <h1 style={{ fontSize: 'var(--fs-xl)', margin: '8px 0 12px' }}>
        This page doesn’t exist.
      </h1>
      <p style={{ color: 'var(--text-muted)' }}>
        The algorithm or page you were looking for isn’t here.{' '}
        <Link to="/">Return to the lab →</Link>
      </p>
    </div>
  );
}
