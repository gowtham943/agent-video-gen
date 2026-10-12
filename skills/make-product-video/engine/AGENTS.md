# Agent Video Gen film project

A deterministic Helios + Three.js film. One continuous camera journey flies through a chain of 3D "motifs"; each scene pairs one motif with one headline filled with this product's words, pictures, and symbols. Output: H.264 MP4, 1920x1080, 30 fps, up to 10 minutes.

## Read first

1. `brief.md` for the product, audience, story, target length, and claim boundaries.
2. `video.config.json` for brand, theme, claims policy, and every scene.
3. `src/motifs/` only when adding or changing a visual.

## Commands

```bash
npm install
npm run doctor        # can this machine render? prints exact fixes
npm run validate      # schema, claims, and product-specificity on video.config.json
npm run capture -- <url> --name <slug>   # optional: screenshots + copy from a product page
npm run render        # writes output/<slug>.mp4 (run in the background and poll)
npm run still         # optional, only if a human asks to see a frame
```

## Rules

- Story copy, theme, claims, items, and images live in `video.config.json`. Rendering lives in `src/`. Do not hard-code copy in `src/`.
- Derive every visible state from the Helios `currentFrame`. Never use `Date.now()`, `performance.now()`, `Math.random()`, or previous-frame state. Use `seededRandom(seed)` from `src/timeline.ts`. The world seed is `config.seed` mixed with the product slug, so two products never share geometry.
- No CSS `transition`, `animation`, or `will-change`: they carry state between frames and fail `npm run verify`.
- Keep one continuous camera journey. No slide-card transitions.
- Keep asset URLs relative (`./assets/...`) so file-based rendering works.
- Never edit `dist/` or `output/`; they are generated.
- Do not add numbers, customer claims, superlatives, or availability promises that are not in `brief.md` and `claims.sourced`.
- `npm run validate` must pass before any render.
- Do not generate a preview or stills unless the user asks. `npm run render` is the video.

## Completion gate

1. `npm run validate` passes.
2. `npm run render` writes `output/<slug>.mp4`.
3. Copy files outside the project only when the user asks.
