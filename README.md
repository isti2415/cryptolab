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
> under its Weaknesses tab.

Each algorithm page shows three views of the same computation, all driven by one
`run()` call: a **live playground**, a **step-by-step walkthrough** that exposes the
real machinery (DES's key schedule and S-boxes, AES's key expansion and round keys,
RSA's square-and-multiply ladder), and the **source code that performs the current
step**, highlighted as you move through it.

## Stack

- **React + TypeScript + Vite**, prerendered to static HTML with **vite-react-ssg**
  (every route ships real, crawlable HTML) and deployed to **Cloudflare Workers**
  as an assets-only Worker.
- **CSS Modules + design tokens** (`src/styles/tokens.css`) — a hand-authored
  "Modern Terminal / Signal" identity, not a template. Light and dark themes come
  from one declaration per token via CSS `light-dark()`; there is no second palette
  to keep in sync.
- **IBM Plex Sans + IBM Plex Mono**, self-hosted. Prose is set in the text face;
  everything that is literal cryptographic material — ciphertext, hex, keys,
  matrices, code — stays monospaced so columns align.
- **Vitest** for the TypeScript engines, **`unittest`** for the Python samples, both
  asserted against the same vector fixtures. **Biome** lints (`pnpm lint`); it runs
  first in CI and in `pnpm check`.

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
| `TapePair` | Input and output tapes advancing together, for stream ciphers. |
| `CurvePlot` | Points of an elliptic curve over a finite field, with the chord/tangent construction. |
| `PolyVecGrid` | Rows of polynomial coefficients, for the lattice schemes. |

Each carries its own screen-reader description (`components/viz/describe.ts`):
a row of cells is announced as one labelled value — "Round key 1, 48 bits:
000110 110000 …" — rather than as forty-eight separate digits.

## Adding a new algorithm

Adding an algorithm is a **self-contained** task — no existing code needs restructuring.

1. Create `src/algorithms/<folder>/` with:
   - `meta.ts` — id, name, category, era, difficulty, tagline. This is the only
     file loaded eagerly for every algorithm (nav, home page cards, route table),
     so keep it tiny. The folder name need not match the id.
   - `engine.ts` — a pure `run()` returning `{ output, steps, error? }`. Never throw on
     bad input; return a structured `error` instead.
   - `engine.test.ts` — known-answer vectors (this is the correctness gate; use official
     test vectors where they exist).
   - `content.ts` — `formula` (rendered as the Notation tab), `symbols`, overview,
     history, weaknesses.
   - `Visualizer.tsx` (+ `Visualizer.module.css`) — renders a single `Step`'s `state`.
     Build it on `VizStage` and reuse `components/viz/` primitives where they genuinely
     fit; add a new one when they don't. `prev` is passed in, so highlight *what changed*.
   - `code/<name>.py` — a real, runnable Python implementation, written for
     readability. This is what most visitors will actually read. Comment it
     freely; comments are stripped before it reaches the panel.
   - `vectors.json` — the shared fixture. Add a case to `CASES` in
     `scripts/gen-vectors.mjs`, then run `pnpm vectors`; without that entry no
     vectors are generated and the cross-language check silently covers nothing.
   - `index.ts` — the `AlgorithmDefinition` default export, importing `meta` from
     `./meta` rather than restating it, plus `params`, `supportsDecrypt` and `sample`.
2. Add the id to `ORDER` in `src/core/registry.ts` — that is the whole registration.
   Both the eager `meta.ts` glob and the lazy `index.ts` glob pick the folder up
   automatically; there is no import list to maintain, and routing needs no change.
3. Run `pnpm check`. Three gates apply: `registry.test.ts` asserts the algorithm
   loads and its own `sample` runs clean, and the Python sample and the engine are
   asserted against the same `vectors.json`, so a sample that disagrees with the
   engine fails the build rather than teaching someone the wrong thing.

### Sharing and export

Playground state — input, key/parameters, direction and the step you are on —
lives in the query string (`src/core/permalink.ts`), so any configured example is
a link. It is written with `replaceState` so typing does not fill the history,
and read only in an effect, which keeps the prerendered HTML and the first client
render identical.

Decoding validates against the algorithm's own `ParamSpec`: an out-of-range
number, an unknown select option, a direction that is not encrypt/decrypt, or a
parameter the algorithm never declared are all dropped in favour of the sample
value. A malformed link degrades to the default page rather than erroring or
quietly running something other than what it said.

The address bar is written in a *minimal* form — fields still at their default
are left out, so reading a page does not litter the URL. **Copy link** writes the
*explicit* form instead, naming every field. A bare URL would look like the
button had done nothing, and it would pin nothing: samples are content, so a link
shared today would show something else the day a default input is reworded.

The console's export row copies that link, copies the output as hex or Base64 (of
its UTF-8 bytes), and downloads the step trace as JSON.

### Code loading

Each algorithm is its own chunk. `meta.ts` ships for all of them (it is what the nav
and cards need); the engine, prose, visualizer and the two source listings load only
for the algorithm being viewed, via the route's `lazy()` in `App.tsx`. Prerendering
is unaffected — every page still ships complete, crawlable HTML — because
vite-react-ssg resolves the matching `lazy` route before it hydrates.

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

## Deployment (Cloudflare Workers)

The site is an **assets-only Worker**: 26 prerendered HTML pages plus
fingerprinted assets, no `main`, no server-side logic. Asset requests are served
by Cloudflare's asset layer and never invoke a Worker.

Pushing to `main` deploys: the repo is connected to Cloudflare and Workers
Builds does the work (see **Continuous deployment** below). These are for
working locally and for the occasions when you need to bypass it:

```bash
pnpm preview:worker   # wrangler dev — the real asset layer, locally
pnpm deploy:dry       # validate wrangler.jsonc and enumerate what would upload
pnpm smoke <origin>   # post-deploy checks against any origin
pnpm deploy           # manual deploy: build → validate JSON-LD → wrangler deploy
```

`pnpm deploy` needs `npx wrangler login` first, and — because absolute URLs are
baked in at build time — the origin passed explicitly:

```bash
VITE_SITE_URL=https://example.com SITE_URL=https://example.com pnpm deploy
```

### Attaching a custom domain

Add it under **Workers → cryptolab → Settings → Domains & Routes**, then set
`SITE_URL` and `VITE_SITE_URL` to the new origin in the build variables and
redeploy. Both steps are needed: the domain routes traffic, but the canonical
tags, the sitemap and the share-card URLs are compiled in and will keep pointing
at the old origin until something rebuilds them.

### `wrangler.jsonc`

The setting that matters is `assets.not_found_handling`:

| Value | Effect |
| --- | --- |
| `"404-page"` ✅ | Unknown paths serve `dist/404.html` with a real **404** |
| `"single-page-application"` ❌ | Unknown paths serve `index.html` with a **200** |

This site prerenders a real page per route, so SPA mode would tell crawlers that
every typo'd URL is a valid page and quietly undo the SEO work. The deploy
workflow smoke-tests for exactly this and fails the deploy if a nonsense URL
returns anything but 404.

`html_handling: "auto-trailing-slash"` serves the flat output (`dist/a/caesar.html`)
at `/a/caesar` and redirects `/a/caesar/` onto it, matching the canonical tags,
which are written without trailing slashes.

### Headers

`public/_headers` is copied into `dist/` by Vite and read natively by the Workers
asset layer. It sets a strict CSP (everything the site needs is self-hosted,
fonts included), HSTS, `frame-ancestors 'none'`, immutable caching for
fingerprinted assets, day-long revalidating caching for share cards and icons,
and no-cache for HTML, `sitemap.xml` and `robots.txt` so a deploy is visible
immediately.

The CSP allows exactly one third party: `static.cloudflareinsights.com`. Note
that **Workers does not inject the Web Analytics beacon the way Pages did** — to
enable it you add the snippet to `index.html` yourself. The allowance is kept so
that doing so does not also require a CSP change to discover. It is cookie-free
and does no fingerprinting; what the site does not claim is that "nothing is sent
to a server", because page views are. The claim that matters is that input and
keys never leave the browser, and that holds: no algorithm code performs any
network I/O.

### Continuous deployment (Workers Builds)

Deploys are driven by Cloudflare, not by GitHub Actions: the repo is connected
under **Workers → cryptolab → Settings → Build**, and Cloudflare builds and
deploys on push. The Worker name in the dashboard must match `name` in
`wrangler.jsonc` (`cryptolab`) or the build fails.

| Setting | Value |
| --- | --- |
| Build command | `pnpm install --frozen-lockfile && pnpm build` |
| Deploy command | `npx wrangler deploy` (the default) |
| Root directory | *(blank)* |
| Non-production branches | `npx wrangler versions upload` (the default) — uploads a preview without taking production |

Build variables (**Settings → Build → Variables and Secrets**):

| Variable | Value | Why |
| --- | --- | --- |
| `SITE_URL` | `https://cryptolab.<subdomain>.workers.dev` | Read by the postbuild scripts: sitemap and robots.txt |
| `VITE_SITE_URL` | *same value* | Read by the bundle: canonical tags, Open Graph, JSON-LD |
| `PNPM_VERSION` | `10.32.1` | Matches `packageManager`; the build image ships an older pnpm |

Two things these get wrong easily, both of which now fail the build immediately
rather than producing a broken site:

- **They must be *build* variables** — Settings → **Build** → Variables and
  Secrets. The Worker's own "Variables and Secrets" screen is a different thing
  (runtime bindings) and is not visible to the build. An assets-only Worker has
  no runtime code to read them anyway.
- **They must include the scheme.** `cryptolab.example.workers.dev` is not an
  origin; without `https://` every canonical tag and share-card URL is emitted
  as a relative-looking string that resolves to nothing.

No API token or account ID is needed — Cloudflare authenticates itself. Node
comes from `.nvmrc` (22), which the build image reads automatically, and the
`wrangler` version comes from `package.json`, which is why it is pinned as a
devDependency rather than run through `npx` at an unknown version.

Both are genuinely required, not conveniences: absolute URLs (canonical tags,
the sitemap, all 25 share cards) are baked in at build time, because there is no
server to work them out per request. Without them the whole site advertises a
placeholder origin — a failure that looks like nothing at all until it surfaces
in Search Console weeks later.

`scripts/preflight.mjs` runs first in the build and validates both: present,
`https://`, a bare origin, and *agreeing with each other*. The last check
matters because they are read by two different processes, so setting only one
yields a build whose sitemap and pages disagree about what the site is called,
which nothing downstream would notice. On Workers Builds (`WORKERS_CI`, set only
there) any of these is fatal; locally and in GitHub CI it is a warning, so
`pnpm build` on a laptop is unaffected.

### After a deploy

```bash
pnpm smoke https://your-origin
```

Checks the pages, the security headers and the cache behaviour, and — the one
that matters — that an unknown path returns **404**. If `not_found_handling`
ever reverts to `"single-page-application"`, every mistyped URL starts answering
`200` with the home page, and the site looks entirely healthy while telling
crawlers that its whole 404 space is real content.

### CI

`.github/workflows/ci.yml` runs lint → typecheck → vitest → Python samples →
build → JSON-LD validation on every push and PR. It does **not** deploy;
Cloudflare does that. It is still worth keeping, because the Workers build runs
none of the tests.

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
