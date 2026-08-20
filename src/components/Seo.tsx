/**
 * Per-page SEO. Renders into the document <head> via vite-react-ssg's <Head>
 * (react-helmet-async under the hood), so the tags land in the real <head> of
 * the prerendered HTML, which is what social scrapers and crawlers read.
 *
 * Every routed page should render exactly one <Seo>. Given a page's path it
 * derives the canonical URL and the share image, so titles, descriptions and
 * previews stay correct on every route without per-page configuration.
 */

import { Head } from 'vite-react-ssg';
import {
  SITE_DESCRIPTION,
  SITE_LOCALE,
  SITE_NAME,
  TWITTER_HANDLE,
  absoluteUrl,
  ogImageForPath,
} from '@/core/site';

export interface SeoProps {
  /** Full <title> text. Also used for og:title / twitter:title. */
  title: string;
  /** Meta description, for search results. Keep it under ~155 characters. */
  description?: string;
  /**
   * Shorter description for share cards. Social previews truncate nearer 125
   * characters than Google's 155, so the two are written separately rather
   * than one being a clipped version of the other. Falls back to `description`.
   */
  socialDescription?: string;
  /** Root-relative path of this page, e.g. "/" or "/a/caesar". */
  path: string;
  /** og:type; "website" for the home page, "article" for content pages. */
  type?: 'website' | 'article';
  /** Absolute-or-relative share image. Defaults to this route's own card. */
  image?: string;
  /**
   * Alt text for the share image. Defaults to the page title, which is what the
   * card's own headline says; pass something fuller where the card carries more.
   */
  imageAlt?: string;
  /** Discourage indexing (e.g. the 404 page). */
  noindex?: boolean;
  /** Optional JSON-LD structured data objects to embed. */
  jsonLd?: object[];
}

export function Seo({
  title,
  description = SITE_DESCRIPTION,
  socialDescription,
  path,
  type = 'website',
  image,
  imageAlt,
  noindex = false,
  jsonLd,
}: SeoProps) {
  const url = absoluteUrl(path);
  const resolved = image ?? ogImageForPath(path);
  const imageUrl = resolved.startsWith('http') ? resolved : absoluteUrl(resolved);
  const alt = imageAlt ?? title;
  const social = socialDescription ?? description;

  return (
    <Head>
      <html lang="en" />
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      {noindex ? (
        <meta name="robots" content="noindex, follow" />
      ) : (
        /* Allow full-size image and text previews; the default caps both. */
        <meta
          name="robots"
          content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
        />
      )}

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content={SITE_LOCALE} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={social} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:image:type" content="image/png" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={alt} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={social} />
      <meta name="twitter:image" content={imageUrl} />
      <meta name="twitter:image:alt" content={alt} />
      {TWITTER_HANDLE && <meta name="twitter:site" content={TWITTER_HANDLE} />}

      {jsonLd?.map((data, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(data)}
        </script>
      ))}
    </Head>
  );
}
