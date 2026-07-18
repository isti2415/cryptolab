# CryptoLab — Project Handoff

## What this project is

A web app that teaches cryptography by visualizing algorithms step by step, alongside the real, working code that performs each step. Someone should be able to land on the page, pick an algorithm, watch it transform actual input into actual output one step at a time, and separately play with it live — type their own input and key, and see real output update.

This document intentionally does not make implementation decisions. It lays out the requirements, constraints, and open questions. Claude Code should make the actual technical decisions (stack specifics, file structure, state management, exact visual design, exact data shapes) and is expected to use its own judgment, propose a plan, and explain tradeoffs where more than one reasonable approach exists.

The eventual goal is to publish this publicly, so treat it as a real product, not a prototype or a one-off demo.

---

## Core requirements

### Algorithm coverage

Launch with at least these algorithms, in roughly this order of introduction (classical first, moving toward modern):

1. Caesar Cipher
2. Affine Cipher
3. Vigenère Cipher
4. One-Time Pad (OTP)
5. Playfair Cipher
6. Hill Cipher
7. DES
8. AES
9. RSA

More algorithms will be added after launch (examples that may come later: Diffie-Hellman, ECC, hash functions, MACs, stream ciphers, post-quantum schemes). The system must be designed so that adding a new algorithm later does not require restructuring existing code — figure out what that means concretely and design for it.

Do not treat this list as exhaustive or final. If there are natural inclusions or orderings within this set that make more pedagogical or technical sense, use judgment.

### Per-algorithm experience

Each algorithm needs, at minimum:

- A **step-by-step animated walkthrough** that shows the algorithm transforming real input into real output, exposing intermediate state along the way (not just "input → output" as a black box).
- A **live interactive playground** where the person can supply their own input and key(s) and see real, correct output, using the same underlying logic as the walkthrough (the two should never be able to disagree with each other — decide how to guarantee this).
- Enough surrounding context that a person unfamiliar with the algorithm can understand roughly what it does, why it mattered historically or practically, and what its weaknesses are. Decide the right amount and placement of this content.

### Real implementations, not simulations

The cryptographic logic must actually work — real encryption/decryption on real input, not illustrative pseudocode standing in for the algorithm. Decide how to source or write these implementations (from scratch vs. audited libraries vs. a mix) per algorithm, and explain the reasoning, especially for algorithms where a wrong implementation would be actively misleading to someone learning from it.

Use good judgment about correctness, edge cases (e.g. invalid keys, keys that don't meet an algorithm's mathematical constraints, empty input, non-alphabetic input, etc.), and what should happen when a person's input can't be processed as given.

### Visualization

The visualization approach does not need to be uniform across all algorithms — different algorithms may call for different visual metaphors (grids, matrices, sequences, graphs, etc.), and some algorithms may share visual components where that's genuinely appropriate rather than forced. Decide this per algorithm based on what actually clarifies the mechanism.

Step-through should be navigable at the learner's pace (not just an uncontrollable autoplay animation) — figure out what controls make sense.

### Design and identity

This should not look like a generic dashboard or a generic "learning platform" template. Give it a considered visual identity appropriate to the subject matter. Make deliberate, specific choices about typography, color, and layout rather than defaulting to common AI-generated design patterns. Justify the direction taken.

If a frontend design skill or similar guidance is available in the environment, consult it before making visual design decisions.

### Architecture for extensibility

Since more algorithms will be added over time by someone who may not be deeply familiar with the existing codebase, the project structure, data contracts, and conventions should make adding a new algorithm a well-defined, ideally self-contained task. Decide what that contract looks like.

### Platform

This is a web app intended for eventual public deployment. Choose an appropriate stack. Optimize for something that is realistic to build incrementally, maintain over time, and deploy without unusual infrastructure requirements.

### Accessibility and quality bar

Should work reasonably well on mobile as well as desktop. Should be keyboard-navigable. Should respect reduced-motion preferences. Should not silently fail — errors and invalid states should be communicated clearly. Beyond these baseline expectations, use judgment on how far to go.

---

## Explicit non-decisions (for Claude Code to resolve)

These are intentionally left open. Propose an approach, note tradeoffs briefly, and proceed — don't block on asking permission for every one of these:

- Exact frontend framework, libraries, and tooling
- State management approach
- Exact data structure/contract for representing an algorithm and its steps
- Whether/how animation state and playground state share underlying logic
- Visual design system (palette, type, layout, motion language)
- File and folder structure
- Whether classical and modern algorithms share UI components, and which ones
- How key validation, error states, and edge cases are surfaced to the user
- How much explanatory/historical content accompanies each algorithm, and where it lives
- Build tooling and deployment target
- Testing approach for correctness of cryptographic implementations (this matters more here than in typical apps, since wrong output actively misleads someone learning — decide how to gain confidence in correctness, e.g. known test vectors where they exist)
- Order and grouping of algorithms in navigation, beyond the rough classical-to-modern arc above
- Anything else not explicitly pinned down in this document

## Explicit constraints (not open for reinterpretation)

- The algorithm list in "Algorithm coverage" is a minimum for launch, not a suggestion to trim.
- Cryptographic operations must be real and correct, not illustrative stand-ins.
- The system must be designed for painless extension with new algorithms after launch.
- The animated walkthrough and the live playground must be consistent with each other for a given algorithm — they cannot use divergent logic that could disagree.
- Do not ship a generic/templated visual design without deliberate reasoning behind the choices made.

---

## How to work

Start by proposing a concrete plan (stack, architecture, data contract, visual direction) before writing significant code, since several of the open decisions above compound — get the foundational ones right first. After the plan is in place, build incrementally, algorithm by algorithm, in a way that surfaces working, checkable progress early rather than building everything in parallel and integrating at the end.
