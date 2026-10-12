---
name: review-product-video
description: Review, audit, and finish an existing generated film project (one with video.config.json, brief.md, and the Helios engine). Use to check a draft video before sharing, to audit on-screen copy against the brief and claim rules, to diagnose a failing render, or to produce the MP4. Does not generate a preview; it validates and renders the video directly.
---

# Review and finish a product video

Use inside a project created by `make-product-video` (it has `video.config.json`, `brief.md`, `package.json` with `render` scripts). If those files are missing, use `make-product-video` first.

Do not run `still`, `frames`, or `render:fast` unless the user asks to see a frame. Validate, fix, then render the MP4.

## 1. Gate

```bash
npm run doctor      # node, browser, ffmpeg
npm run validate    # schema, claims, and product-specificity
```

If `validate` fails, fix `video.config.json` (or `brief.md` if the story is wrong) and re-run. Do not skip claim or story errors.

Run `npm run qa` only when the user reports a visual glitch or a failed render; it launches a browser for a forward/reverse frame audit.

## 2. Audit copy against the brief

Read `brief.md` and every scene's `eyebrow`, `heading`, `body`, `action`, `footnote`, and `items`. Report any line that:

- states a fact, number, customer, award, or comparison not in the brief;
- implies availability, speed, ease, or compliance the product stage does not support;
- renames a canonical feature;
- is leftover sample copy, or could apply to any product;
- is missing a `required` line (for example an "in development" note on the last scene).

Confirm the film's total duration matches the brief's target length (up to 10 minutes) and that at least 80 percent of scenes carry `items`, `images`, or an `icon`.

## 3. Render

```bash
npm run render       # writes output/<slug>.mp4; background it and poll
```

Rendering launches Chromium, so in a sandboxed agent request permission to run outside the sandbox. Report the output path, resolution, fps, duration, and file size. Copy the file elsewhere only when the user asks.

## Troubleshooting

| Symptom | Cause and fix |
| --- | --- |
| `validate` rejects a number or word | Not sourced. Remove it, or add the exact text to `claims.sourced` only if the user supplied a source |
| `validate` says leftover sample copy | Replace the heading with this product's own line |
| `validate` wants more items/images | Fill `items` with real feature names; add screenshots to `images` for `screen`/`device`/`media` |
| `browserType.launch: Executable doesn't exist` | Run `npx playwright install chromium`, or let the first render download it (needs network) |
| Browser launch fails or hangs in a sandbox | Run the command outside the sandbox |
| `verify` reports mismatching frames | A motif uses time-of-day, `Math.random()`, or accumulated state. Use the frame values and `seededRandom` |
| Text looks wrong or font differs | `theme.font` is not installed on this machine; install it or choose another |
| Logo or screenshot missing in render | Paths must be `./assets/<file>` and the file must be in `public/assets/`; rebuild |
| Render far slower than expected | Software WebGL; pass `-- --jobs 6` or `-- --fps 24` |
