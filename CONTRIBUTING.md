# Contributing to CryptoLab

Thanks for considering it. The most useful contributions are, roughly in order:
a correction to something the site teaches wrongly, a new algorithm, and an
improvement to an existing visualization.

## Before anything else

```bash
pnpm install
pnpm dev            # http://localhost:5173
pnpm check          # lint → typecheck → vitest → python samples
```

`pnpm check` is the gate. CI runs the same thing plus a build and a
structured-data check, so if it passes locally it will pass there.

## The one rule that is not negotiable

**The cryptography has to be real and correct.** Someone is going to read this
and believe it. That means:

- an engine's `run()` is pure, never throws, and returns a structured `error`
  for bad input rather than guessing what the user meant;
- the walkthrough and the playground are both derived from that single `run()`
  call, so they cannot disagree;
- known-answer vectors from the published standard where one exists (FIPS, RFC,
  NIST). Where none exists, assert structural identities instead and say so in
  a comment — see `tripledes/engine.test.ts` for the pattern;
- if an implementation is a toy — reduced parameters, no padding, textbook RSA —
  it says so plainly in `content.weaknesses`, not just in a code comment.

## Adding an algorithm

The full recipe is in the README under **Adding a new algorithm**. In short:
create `src/algorithms/<folder>/` with `meta.ts`, `engine.ts`, `engine.test.ts`,
`content.ts`, `Visualizer.tsx`, `code/<name>.py` and `index.ts`; add a `CASES`
entry in `scripts/gen-vectors.mjs` and run `pnpm vectors`; add the id to `ORDER`
in `src/core/registry.ts`. Nothing else needs to change — routing, the sitemap,
the nav and the share cards all derive from the registry.

`registry.test.ts` will tell you if you missed a step.

## Reporting something wrong

If the site teaches something incorrect, that is a bug and it matters more than
anything else here. Open an issue with the algorithm, what it says, and what it
should say. A citation helps but is not required — being right is what matters.

## Style

Biome handles linting (`pnpm lint`). Beyond that: comments explain *why*, not
what, and prose written for readers of the site is held to the same standard as
the code. If you are unsure about wording, write it plainly and someone will
suggest an edit.
