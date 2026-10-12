---
name: make-product-video
description: Create a cinematic product video of any length up to 10 minutes (promo, launch film, explainer, walkthrough, website hero, sales opener) from a plain-language prompt about any product. Use when the user asks to make, generate, or render a video, film, promo, teaser, demo reel, or animation for a product, feature, company, or app. Builds product-specific 3D scenes from the product's own words, screenshots, images, and symbols, checks copy against claim guardrails, and renders the MP4 directly with no preview step.
---

# Make a product video

You turn "make a video about X" into a finished MP4, in one pass. Each scene is a 3D visual filled with *this product's* words, pictures, and symbols. All of it is one `video.config.json`.

`SKILL_DIR` means the folder containing this `SKILL.md`.

## Ground rules

- **Straight to the video.** Do not run `still`, `frames`, `preview`, `render:fast`, or `qa`. Do not open images or contact sheets. Write the config, `npm run validate`, then `npm run render`. Only generate stills if the user asks to see a frame.
- **Length follows the request, 10 minutes maximum.** Never default to 30 seconds. Decide length in step 1 and write it into the brief before you storyboard.
- **Every video is about its own product.** Copy, `items`, images, icons, palette, motifs, and seed come from this product. Leftover sample headlines are a validation error. Generic placeholder text is a failure.
- Never invent facts, numbers, customers, or availability.

## 1. Understand the product and pick a length

Collect, marking inferences `ASSUMED`: name exactly as written, one-line description, stage, audience, tone. Then **lock the duration**:

1. If the user named a length, use it (15 s to 10 min).
2. Otherwise count distinct talking points in the prompt and any captured page:

| Talking points | Length | Scenes |
| --- | --- | --- |
| Teaser / ad / "short" / 1–2 points | 25–40 s | 5–7 |
| Typical "make a video about X" / 3–5 points | **75–120 s** | 12–20 |
| Overview / explainer / 6–10 points | 2–4 min | 18–30 |
| Walkthrough / "full" / lots of source | 5–10 min | 30–60 at 10–15 s each |

Real source material, in this order:

1. Files or text the user supplied (docs, README, decks, logos, screenshots).
2. The product's web page: after scaffolding, `npm run capture -- <url> --name <slug>` saves screenshots and the share image to `public/assets/` and prints real headings, paragraphs, navigation, and colours. Use that language for copy and `items`. Only capture pages the user owns or has said to use.
3. The repository (README, docs, package description) when the product is the current project.
4. Web search for public facts.
5. An image-generation tool, if your agent has one: 1 to 4 abstract, on-brand artworks or product scenes with **no text, logos, or people's faces**, saved to `public/assets/`. Skip if unavailable.

If facts are still missing, ask at most three questions in one message with defaults. Otherwise proceed.

## 2. Scaffold

```bash
node "SKILL_DIR/scripts/scaffold.mjs" ./<slug>-film --slug <slug> --install
cd <slug>-film
```

Use the current workspace as the parent unless the user says otherwise. The project is a self-contained copy of the engine. If the render fails to launch a browser later, run `npm run doctor`.

## 3. Brief, then storyboard

Fill `brief.md` (product, audience, stage, **target length**, canonical feature names, claim boundaries, brand). Read `references/storytelling.md` and `references/motifs.md`. For **each scene** decide what makes it this product's:

| Payload | What it is | Source |
| --- | --- | --- |
| `items` | 3 to 8 real names: features, integrations, document types, steps | The brief or the captured page. Never made up |
| `images` | Screenshots or artwork shown in `media`, `device`, `screen` | `public/assets/` from capture, the user, or generation |
| `icon` / `iconPath` | A symbol of the domain | Pick the best fit |
| `device` | `phone`, `laptop`, `monitor` | The product's real form factor |

Rules the validator enforces: at least 80 percent of scenes carry a payload, no motif twice in a row, no leftover sample headlines, no numbers or superlatives without a source. Choose motifs by meaning, not at random, and vary them. Choose `theme` and `look` from the product's brand; if there is no brand, pick a palette that fits the category and say it was assumed.

For films over about 90 seconds, group scenes into chapters: a short opening, one 4-to-6-scene chapter per major capability, and a close.

## 4. Write `video.config.json`

Follow `references/config-schema.md`. Essentials:

- `slug`, `title`, `brand` (`logo` as `./assets/<file>` after copying into `public/assets/`, or `null` for a text wordmark), `theme`, optional `look`, `fps` (30 unless the user asks otherwise), `width`, `height`.
- `seed`: any integer unique to this product (for example the date plus a hash of the slug). The engine also mixes the slug into the random stream so two products never share geometry.
- `claims`: `forbidden` phrases, `required` phrases (`"scope": "last"` for availability lines), `sourced` numbers with sources the user gave.
- Copy limits: heading at most 3 lines of 30 characters (aim for 24); body at most 190 characters (aim for 120); each item at most 26 characters; `duration` 2 to 20 s.
- Let `align` default; only the closing scene gets `action` and `footnote`.

Write the whole file in one edit. Scene durations must sum to the target length.

## 5. Validate and render

```bash
npm run validate     # fix every message; it is fast
npm run render       # writes output/<slug>.mp4
```

`render` re-validates, builds, and renders in parallel browsers. Run it **in the background** and poll its log: it prints percent, elapsed, and minutes left. Expect roughly 1 to 2 minutes of rendering per 30 seconds of film on a typical laptop (a 10-minute film takes about an hour); mention the estimate to the user. Options: `npm run render -- --jobs 6` for more parallelism, `-- --fps 24` to finish sooner. The first run downloads a headless Chromium (about 100 MB). Rendering launches a browser, so in sandboxed agents request permission to run outside the sandbox.

Do not run a second "preview" render. The file in `output/<slug>.mp4` is the video.

## 6. Report

Finish with the MP4 path, duration, resolution, the scene list (chapter and headline), the assumptions you made, the claims you left out, and two concrete ways to change it. Copy files outside the project only when asked.

## Editing an existing film

If the folder already has `video.config.json` and `brief.md`, skip scaffolding: update the brief if the story changes, edit the config, validate, render.
