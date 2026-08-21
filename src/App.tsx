import type { RouteRecord } from 'vite-react-ssg';
import { Layout } from './components/layout/Layout';
import { HomePage } from './pages/HomePage';
import { AlgorithmPage } from './pages/AlgorithmPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { algorithms } from './core/registry';

/**
 * Route table consumed by vite-react-ssg (see `main.tsx`).
 *
 * Every algorithm gets its own literal route with its own `lazy()`, rather than
 * one `/a/:id` route reading a fully-loaded registry. That is what makes the
 * code split real: the route's chunk holds one algorithm's engine, prose,
 * visualizer and source listings, and nothing is fetched for the other
 * twenty-three.
 *
 * This is safe for prerendering and for hydration, which is the part that
 * usually makes lazy routes a bad trade on a static site:
 *
 *   - the prerender resolves `lazy` through React Router's static handler, so
 *     each page ships complete HTML (prose, walkthrough and code listing all
 *     crawlable, exactly as before);
 *   - on the client, vite-react-ssg awaits the `lazy` of every route matching
 *     the current URL *before* it builds the router and calls hydrateRoot, so
 *     there is no fallback flash and no hydration mismatch.
 *
 * Routes are derived from the registry, so adding an algorithm still needs no
 * routing change.
 */
export const routes: RouteRecord[] = [
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      ...algorithms.map((entry) => ({
        path: `a/${entry.meta.id}`,
        lazy: async () => {
          const algo = await entry.load();
          return { element: <AlgorithmPage algo={algo} /> };
        },
      })),
      // Prerendered to dist/404.html (flat dirStyle). The Workers asset layer
      // serves it with a real 404 status for any unmatched request, via
      // `assets.not_found_handling: "404-page"` in wrangler.jsonc.
      { path: '404', element: <NotFoundPage /> },
      // Client-side fallback for unknown paths; filtered out of prerendering.
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];
