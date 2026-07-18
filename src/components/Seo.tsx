/**
 * Per-page SEO. Renders into the document <head> via vite-react-ssg's <Head>
 * (react-helmet-async under the hood), so the tags land in the real <head> of
 * the prerendered HTML — which is what social scrapers and crawlers read.
 *
 * Every routed page should render exactly one <Seo>. Given a page's path it
 * derives the canonical + Open Graph URL, so titles/descriptions and share
 * previews stay correct on every route.
 */

import { Head } from 'vite-react-ssg';
import {
  OG_IMAGE_PATH,
  SITE_DESCRIPTION,
  SITE_NAME,
  TWITTER_HANDLE,
  absoluteUrl,
} from '@/core/site';

export interface SeoProps {
  /** Full <title> text. Also used for og:title / twitter:title. */
  title: string;
  /** Meta description. Falls back to the site default. */
  description?: string;
  /** Root-relative path of this page, e.g. "/" or "/a/caesar". */
  path: string;
  /** og:type — "website" for the home page, "article" for content pages. */
  type?: 'website' | 'article';
  /** Absolute-or-relative share image. Defaults to the site OG image. */
  image?: string;
  /** Discourage indexing (e.g. the 404 page). */
  noindex?: boolean;
  /** Optional JSON-LD structured data objects to embed. */
  jsonLd?: object[];
}

export function Seo({
  title,
  description = SITE_DESCRIPTION,
  path,
  type = 'website',
  image = OG_IMAGE_PATH,
  noindex = false,
  jsonLd,
}: SeoProps) {
  const url = absoluteUrl(path);
  const imageUrl = image.startsWith('http') ? image : absoluteUrl(image);

  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex, follow" />}

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
      {TWITTER_HANDLE && <meta name="twitter:site" content={TWITTER_HANDLE} />}

      {jsonLd?.map((data, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(data)}
        </script>
      ))}
    </Head>
  );
}
