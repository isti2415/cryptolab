# CryptoLab

Learn cryptography by watching **real algorithms transform real input, one step at a
time** — with a step-by-step animated walkthrough and a live playground side by side,
both driven by the exact same code so they can never disagree.

> Status: twenty-four algorithms across five groups.
>
> - **Classical** — Caesar, Affine, Vigenère, One-Time Pad, Playfair, Hill, Rail Fence, Enigma
> - **Symmetric** — RC4, Blowfish, ChaCha20, DES, Triple DES, AES-128
> - **Hashes & MACs** — SHA-256, SHA-3/Keccak, HMAC
> - **Public key** — Diffie–Hellman, Elliptic Curve (ECDH), RSA
> - **Post-quantum** — Learning With Errors, ML-KEM (Kyber), ML-DSA (Dilithium), Hash-Based Signatures
>
> Every engine is verified against published known-answer vectors where they
> exist (FIPS-197 for AES, FIPS 46-3 for DES, NIST for SHA-256 and SHA-3, RFC
> 4231 for HMAC, RFC 8439 for ChaCha20, Schneier's for Blowfish, the published
> RC4 and Enigma checks), and against structural identities where they do not —
> Triple DES must collapse to single DES when its keys are equal, elliptic-curve
> scalar multiplication must be a homomorphism, and every lattice round-trip must
> stay inside its noise budget. Every algorithm ships a Python implementation
> held to the same fixtures.
>
> The three post-quantum lattice pages are faithful in structure but run at toy
> parameters and are **not** FIPS 203/204 implementations; each says so plainly
> in its notes.

Each algorithm page shows three views of the same computation, all driven by one
`run()` call: a **live playground**, a **step-by-step walkthrough** that exposes the
real machinery (DES's key schedule and S-boxes, AES's key expansion and round keys,
RSA's square-and-multiply ladder), and the **source code that performs the current
step**, highlighted as you move through it.

## Stack

- **React + TypeScript + Vite**, prerendered to static HTML with **vite-react-ssg**
  (every route ships real, crawlable HTML) and deployed to **Cloudflare Pages**.
- **CSS Modules + design tokens** (`src/styles/tokens.css`) — a hand-authored
  "Modern Terminal / Signal" identity, not a template. Light and dark themes come
  from one declaration per token via CSS `light-dark()`; there is no second palette
  to keep in sync.
- **IBM Plex Sans + IBM Plex Mono**, self-hosted. Prose is set in the text face;
  everything that is literal cryptographic material — ciphertext, hex, keys,
  matrices, code — stays monospaced so columns align.
- **Vitest** for the TypeScript engines, **`unittest`** for the Python samples, both
  asserted against the same vector fixtures.

## Commands

```bash
pnpm install
pnpm dev             # dev server
pnpm check           # typecheck + both test suites — the gate before committing
pnpm test            # TypeScript engines
pnpm test:python     # Python code samples, against the same vectors
pnpm build           # typecheck + production build
pnpm preview         # serve the production build
pnpm vectors         # regenerate the shared vector fixtures after an intended change
pnpm og              # regenerate the per-page share cards and icons into public/
```

## Architecture

The whole app is organized around one idea:

> **Each algorithm exposes a single pure `run(input, params, direction)` that returns
> both the final `output` (shown in the playground) and the ordered `steps` trace
> (shown in the walkthrough).** Because both views derive from one call, they are
> guaranteed consistent.

Key pieces:

| Path | Responsibility |
| --- | --- |
| `src/core/types.ts` | The `AlgorithmDefinition` / `Step` / `ParamSpec` contract. |
| `src/core/registry.ts` | The list of algorithms. Add yours here (one line). |
| `src/core/math.ts` | Shared number-theory + alphabet helpers (`mod`, `gcd`, `modInverse`…). |
| `src/components/walkthrough/StepPlayer.tsx` | Generic, keyboard-navigable step player. |
| `src/components/playground/Console.tsx` | Generic form + live output, renders any `params`. |
| `src/components/viz/VizStage.tsx` | The three-region layout every visualization sits in. |
| `src/components/viz/` | Reusable visual primitives — see the table below. |
| `src/components/code/CodePanel.tsx` | The Python and TypeScript implementations, side by side with the algorithm. |
| `src/pages/AlgorithmPage.tsx` | Wires console + walkthrough + code + content from one `run()`. |
| `plugins/stripComments.ts` | Strips comments from source on its way to the code panel. |

### Page layout

Each algorithm page puts the playground, the walkthrough and the implementation
in three columns once there is room (two, with the code full-width beneath, at
mid widths; stacked on mobile). The algorithm list in the sidebar collapses from
the topbar and remembers the choice, because on a page you have already
navigated to it is 250px of permanent margin.

### Visualization primitives

Every visualizer composes `VizStage`, which gives all of them the same three
regions so extra screen width shows *more of the algorithm* rather than padding a
small diagram:

- **Context** — persistent reference the learner keeps glancing back at: the key
  square, the S-box, the round-key schedule, the tableau.
- **Focus** — the operation this step performs, blown up.
- **Track** — full-width progress: input consumed, output produced.

| Primitive | Renders |
| --- | --- |
| `Cell` | The atom: one unit of cryptographic material, with a shared state vocabulary (`key`, `derived`, `output`, `changed`, `dropped`…) that means the same thing on every page. |
| `BitField` | A non-wrapping row of bits/nibbles/bytes. |
| `PermutationWiring` | A fixed permutation drawn as SVG wires between two rows. |
| `XorLane` | `a`, `b`, `a ⊕ b` stacked and aligned. |
| `LookupTable` | A substitution table with a row/column crosshair on the live lookup. |
| `MatrixOp` | `[A] × [b] = [c]` with the dot-product terms written out. |
| `MappingStrip` | Two alphabets with a connector for the active pair. |
| `ValueLedger` | Named quantities, lit when the step reads them. |
| `ChipTrack` | Progress track of processed units. |
| `Histogram` | Frequency bars, for showing what a weakness actually looks like. |

## Adding a new algorithm

Adding an algorithm is a **self-contained** task — no existing code needs restructuring.

1. Create `src/algorithms/<id>/` with:
   - `engine.ts` — a pure `run()` returning `{ output, steps, error? }`. Never throw on
     bad input; return a structured `error` instead.
   - `engine.test.ts` — known-answer vectors (this is the correctness gate; use official
     test vectors where they exist).
   - `content.ts` — overview / history / weaknesses.
   - `Visualizer.tsx` — renders a single `Step`'s `state`. Build it on `VizStage`
     and reuse `components/viz/` primitives where they genuinely fit; add a new one
     when they don't. `prev` is passed in, so highlight *what changed*.
   - `content.ts` — tagline, `formula` (shown beside the page title), overview,
     history, weaknesses, notes.
   - `code/<id>.py` — a real, runnable Python implementation, written for
     readability. This is what most visitors will actually read. Comment it
     freely; comments are stripped before it reaches the panel.
   - `vectors.json` — the shared fixture (`pnpm vectors` generates it).
   - `index.ts` — the `AlgorithmDefinition` default export.
2. Add one import + one array entry in `src/core/registry.ts`.
3. Run `pnpm check`. The Python sample and the engine are asserted against the same
   `vectors.json`, so a sample that disagrees with the engine fails the build rather
   than teaching someone the wrong thing.

### Code samples

The panel shows each implementation with its comments removed
(`plugins/stripComments.ts`), so the reader sees the algorithm rather than a
commentary on it — the page already carries the explanation in prose beside it.
Comment the source files as thoroughly as they deserve; none of it reaches the
screen.

The TypeScript sample is the engine file itself, imported raw, so it cannot
drift from what produced the output being shown.

Copy `src/algorithms/caesar/` as the reference — it exercises every part of the contract.

SEO is nearly free: a new registry entry is automatically prerendered to its own
`/a/<id>` HTML page with a per-algorithm `<title>`, meta description, canonical,
Open Graph/Twitter tags and JSON-LD (see `src/pages/AlgorithmPage.tsx` and
`src/components/Seo.tsx`), and is added to `sitemap.xml` on the next build. The
one manual step is `pnpm og`, which renders that algorithm's share card; the
build fails with a pointed message if you skip it.

## SEO

- Every route is prerendered (`pnpm build` → `dist/`), so crawlers and social
  scrapers see real `<head>` metadata without running JS.
- Per-page tags come from `<Seo>` (`src/components/Seo.tsx`); site-wide constants
  live in `src/core/site.ts`. Each page emits a title, meta description,
  canonical, robots directives, full Open Graph + Twitter card tags, and JSON-LD
  (`WebSite` + `ItemList` on the home page, `LearningResource` + `BreadcrumbList`
  on each algorithm).
- **Share images are per page.** `pnpm og` renders one 1200×630 card per route
  into `public/og/` — `home.png` plus `a/<id>.png` carrying that algorithm's
  name, family, era and tagline — along with the raster icons. `<Seo>` derives
  the image from the route, so nothing is wired per page.

  The cards are generated by hand and committed rather than built on every
  deploy: rasterising needs a native module and a font decompressor, and neither
  belongs in the critical path of a deploy for something cosmetic. Re-run
  `pnpm og` after adding or renaming an algorithm; if you forget,
  `scripts/verify-og.mjs` fails the build and names the missing card.
- `scripts/verify-og.mjs` runs as part of `pnpm build` and checks every emitted
  page for a title, description, canonical and `og:image`, that the referenced
  image is actually in the output, and that the icons and crawler files shipped.
- `sitemap.xml` and `robots.txt` are both generated by
  `scripts/generate-sitemap.mjs` from the prerendered output, so the sitemap and
  the `Sitemap:` line pointing at it can never disagree.
- `scripts/validate-jsonld.mjs` checks the live structured data against Google's
  documented requirements: `pnpm preview` in one shell, then
  `SITE_URL=http://localhost:4173 node scripts/validate-jsonld.mjs`.
- **Custom domain:** set `SITE_URL` (build) / `VITE_SITE_URL` (app) to your
  domain so canonical URLs, Open Graph, JSON-LD, the sitemap and robots.txt all
  use it: `SITE_URL=https://cryptolab.dev VITE_SITE_URL=https://cryptolab.dev pnpm build`.
  In the Pages dashboard, set both as build environment variables. Nothing else
  needs editing.

## Deployment (Cloudflare Pages)

Build settings, if the project is being connected for the first time:

| Setting | Value |
| --- | --- |
| Build command | `pnpm build` |
| Output directory | `dist` |
| Node version | from `.nvmrc` (22) |
| Package manager | pnpm, pinned by `packageManager` in `package.json` |

- `wrangler.toml` pins the project name and `pages_build_output_dir`, so
  `pnpm build && npx wrangler pages deploy` works from a checkout without flags.
- `public/_headers` sets a strict CSP (everything the site needs is self-hosted,
  fonts included), HSTS, `frame-ancestors 'none'`, immutable caching for
  fingerprinted assets, day-long revalidating caching for the share cards and
  icons, and no-cache for HTML, `sitemap.xml` and `robots.txt` so a deploy is
  visible immediately.
- The CSP allows exactly one third party: `static.cloudflareinsights.com`, so
  Cloudflare Web Analytics works if it is enabled in the dashboard. It is
  cookie-free and does no fingerprinting, which is why the landing page can
  still say "no cookies" — what it does not say, deliberately, is "nothing is
  sent to a server", because page views are. The claim that matters is that
  input and keys never leave the browser, and that remains true: no algorithm
  code performs any network I/O.
- The 404 route is prerendered to `dist/404.html`, which Pages serves with a real
  `404` status for unmatched paths. There is deliberately no SPA catch-all in
  `_redirects`: every real route is its own file, so an unknown URL should 404
  rather than render an empty shell.
- CI (`.github/workflows/ci.yml`) runs typecheck, both test suites and the build.

## Accessibility & quality

- Keyboard-navigable walkthrough: `←` `→` step, `Home` `End` jump, `[` `]` move by
  phase, space plays/pauses. Shortcuts fire only when the player itself holds focus,
  so controls inside it keep their normal keyboard behaviour.
- Step changes are announced to screen readers regardless of motion preference.
- Respects `prefers-reduced-motion`: all travel collapses, and autoplay slows to a
  readable pace rather than flickering through state changes.
- Colour is chosen for WCAG AA in both themes: `--text-dim` is safe at body sizes,
  `--text-faint` is reserved for large or decorative text. See the note at the top
  of `src/styles/tokens.css` before adding a text colour.
- Light and dark themes, with a tri-state toggle (system / light / dark) and an
  inline pre-paint script so the prerendered pages never flash the wrong one.
- Errors and invalid keys/input are surfaced explicitly, never silently dropped.
- Responsive down to mobile; wide layouts are driven by **container** queries, so
  panels respond to the space they actually have rather than to the viewport.
