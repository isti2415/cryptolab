/**
 * Inline SVG icon set.
 *
 * These replace the emoji codepoints the transport controls used to use
 * (⏮ ▶ ⏭), which render as full-colour emoji in Chromium and Safari, orange
 * glyphs dropped into a monochrome UI. Drawn on a 16×16 grid, stroked with
 * `currentColor` so they inherit whatever state colour their button has.
 */

import type { SVGProps } from 'react';

export type IconName =
  | 'first'
  | 'prev'
  | 'play'
  | 'pause'
  | 'next'
  | 'last'
  | 'sun'
  | 'moon'
  | 'system'
  | 'copy'
  | 'check'
  | 'chevron'
  | 'code'
  | 'sidebar'
  | 'steps'
  | 'terminal'
  | 'arrow';

const STROKE = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

const PATHS: Record<IconName, React.ReactNode> = {
  first: (
    <>
      <path d="M12.5 3.5 6 8l6.5 4.5V3.5Z" {...STROKE} />
      <path d="M4 3.5v9" {...STROKE} />
    </>
  ),
  prev: <path d="M10 3.5 5.5 8 10 12.5" {...STROKE} />,
  play: <path d="M5 3.4 12.6 8 5 12.6V3.4Z" {...STROKE} />,
  pause: (
    <>
      <path d="M6 3.5v9" {...STROKE} />
      <path d="M10 3.5v9" {...STROKE} />
    </>
  ),
  next: <path d="M6 3.5 10.5 8 6 12.5" {...STROKE} />,
  last: (
    <>
      <path d="M3.5 3.5 10 8l-6.5 4.5V3.5Z" {...STROKE} />
      <path d="M12 3.5v9" {...STROKE} />
    </>
  ),
  sun: (
    <>
      <circle cx="8" cy="8" r="3" {...STROKE} />
      <path
        d="M8 1.5v1.4M8 13.1v1.4M2.4 2.4l1 1M12.6 12.6l1 1M1.5 8h1.4M13.1 8h1.4M2.4 13.6l1-1M12.6 3.4l1-1"
        {...STROKE}
      />
    </>
  ),
  moon: <path d="M13 9.6A5.6 5.6 0 0 1 6.4 3a5.6 5.6 0 1 0 6.6 6.6Z" {...STROKE} />,
  system: (
    <>
      <rect x="2" y="3" width="12" height="8" rx="1.2" {...STROKE} />
      <path d="M6 13.5h4" {...STROKE} />
    </>
  ),
  copy: (
    <>
      <rect x="5.5" y="5.5" width="8" height="8" rx="1.2" {...STROKE} />
      <path d="M10.5 3.5h-7a1 1 0 0 0-1 1v7" {...STROKE} />
    </>
  ),
  check: <path d="m3 8.4 3.2 3.2L13 4.8" {...STROKE} />,
  code: (
    <>
      <path d="m5.5 5.5-3 2.5 3 2.5" {...STROKE} />
      <path d="m10.5 5.5 3 2.5-3 2.5" {...STROKE} />
      <path d="M9.2 3.4 6.8 12.6" {...STROKE} />
    </>
  ),
  chevron: <path d="M3.5 5.5 8 10l4.5-4.5" {...STROKE} />,
  sidebar: (
    <>
      <rect x="2" y="3" width="12" height="10" rx="1.4" {...STROKE} />
      <path d="M6.4 3v10" {...STROKE} />
    </>
  ),
  /* A trace: three rungs climbing, the middle one lit by the player. */
  steps: (
    <>
      <path d="M2 12.5h3.5V9H9V5.5h5" {...STROKE} />
      <circle cx="9" cy="5.5" r="1.5" {...STROKE} />
    </>
  ),
  terminal: (
    <>
      <rect x="1.8" y="2.8" width="12.4" height="10.4" rx="1.4" {...STROKE} />
      <path d="m4.8 6.6 2 1.8-2 1.8" {...STROKE} />
      <path d="M8.6 10.4h2.8" {...STROKE} />
    </>
  ),
  arrow: (
    <>
      <path d="M2.8 8h10.4" {...STROKE} />
      <path d="m9.4 4.2 3.8 3.8-3.8 3.8" {...STROKE} />
    </>
  ),
};

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName;
  /** Rendered size in px. Defaults to 1em so it tracks the button's font size. */
  size?: number | string;
}

export function Icon({ name, size = '1em', ...rest }: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {PATHS[name]}
    </svg>
  );
}
