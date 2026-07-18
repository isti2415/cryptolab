import type { RouteRecord } from 'vite-react-ssg';
import { Layout } from './components/layout/Layout';
import { HomePage } from './pages/HomePage';
import { AlgorithmPage } from './pages/AlgorithmPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { algorithms } from './core/registry';

/**
 * Route table consumed by vite-react-ssg (see `main.tsx`).
 *
 * `getStaticPaths` on the algorithm route is what makes every algorithm ship as
 * its own prerendered HTML page — derived straight from the registry, so adding
 * an algorithm there automatically gives it a real, crawlable, share-previewable
 * page with zero routing changes.
 */
export const routes: RouteRecord[] = [
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      {
        path: 'a/:id',
        element: <AlgorithmPage />,
        getStaticPaths: () => algorithms.map((a) => `/a/${a.meta.id}`),
      },
      // Prerendered to dist/404.html (flat dirStyle); Cloudflare Pages serves it
      // with a 404 status for any unmatched request.
      { path: '404', element: <NotFoundPage /> },
      // Client-side fallback for unknown paths; filtered out of prerendering.
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];
