# CryptoLab

Learn cryptography by watching **real algorithms transform real input, one step at a
time** — with a step-by-step animated walkthrough and a live playground side by side,
both driven by the exact same code so they can never disagree.

> Status: all nine launch algorithms complete — Caesar, Affine, Vigenère, One-Time
> Pad, Playfair and Hill (classical), plus DES, AES-128 and RSA (modern). Every
> engine is verified against published known-answer test vectors (e.g. FIPS-197 for
> AES, the FIPS DES vector, the textbook RSA example). New algorithms follow the
> self-contained pattern in `src/algorithms/caesar/`.

## Stack

- **React + TypeScript + Vite**, shipped as a static SPA (deploys to any static host).
- **CSS Modules + design tokens** (`src/styles/tokens.css`) — a hand-authored
  "Modern Terminal / Signal" identity, not a template.
- **Vitest** for correctness — every engine ships known-answer tests.

## Commands

```bash
pnpm install
pnpm dev        # dev server
pnpm test       # run the correctness suite
pnpm build      # typecheck + production build
pnpm preview    # serve the production build
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
| `src/components/viz/` | Reusable visual primitives (`AlphabetStrip`, …). |
| `src/pages/AlgorithmPage.tsx` | Wires console + walkthrough + content from one `run()`. |

## Adding a new algorithm

Adding an algorithm is a **self-contained** task — no existing code needs restructuring.

1. Create `src/algorithms/<id>/` with:
   - `engine.ts` — a pure `run()` returning `{ output, steps, error? }`. Never throw on
     bad input; return a structured `error` instead.
   - `engine.test.ts` — known-answer vectors (this is the correctness gate; use official
     test vectors where they exist).
   - `content.ts` — overview / history / weaknesses.
   - `Visualizer.tsx` — renders a single `Step`'s `state`. Reuse `components/viz/`
     primitives where they genuinely fit; add a new one when they don't.
   - `index.ts` — the `AlgorithmDefinition` default export.
2. Add one import + one array entry in `src/core/registry.ts`.

Copy `src/algorithms/caesar/` as the reference — it exercises every part of the contract.

## Accessibility & quality

- Keyboard-navigable walkthrough (← → Home End, space to play/pause).
- Respects `prefers-reduced-motion` (motion is presentational only).
- Errors and invalid keys/input are surfaced explicitly, never silently dropped.
- Responsive down to mobile.
