# Agent Video Gen

A plugin for **Claude Code**, **Cursor**, and **Codex**. Describe a product in plain language and get a cinematic 3D product video as an H.264 MP4.

Length follows the prompt: a short teaser, a 90-second social cut, or a walkthrough up to **10 minutes**. Copy, colours, screenshots, and motion are specific to that product. There is no preview step — the agent writes the story, validates it, and renders the master.

```text
Make a launch video for Acme Billing, an invoicing app for freelancers.
Calm, confident. It is in beta. Cover invoicing, reminders, and payments.
```

## What you get

- **1080p, 30 fps, silent MP4** (`output/<slug>.mp4`)
- On-screen headlines and labels taken from *this* product (features, screenshots, symbols)
- Claim checks so the film cannot invent “40% faster”, “best”, or “available now” unless you sourced them
- A self-contained film project the same agent can edit later

The browser is the animation engine. [Helios](https://www.heliosrender.com/) clocks every frame; Three.js draws the world. The same config always produces the same pixels.

## Requirements

- Node.js 20 or newer
- A machine that can launch Chromium (first render downloads ~100 MB)
- ffmpeg is bundled with the engine

A 75-second film takes a few minutes to render. A 10-minute film can take about an hour.

## Install

Clone this repo, then install it in your agent.

```bash
git clone https://github.com/gowtham943/agent-video-gen.git
cd agent-video-gen
```

### Claude Code

```text
/plugin marketplace add /path/to/agent-video-gen
/plugin install agent-video-gen@agent-video-gen-dev
```

Then `/make-video <your prompt>` or describe the video in chat.

### Cursor

Install this folder as a local Cursor plugin (it ships `.cursor-plugin/plugin.json` with skills, commands, and rules). Then `/make-video <your prompt>` or describe the video.

### Codex

Add this repo as a Codex plugin marketplace (`.codex-plugin/plugin.json` and `.agents/plugins/marketplace.json`). Then: “Use the make-product-video skill to make a video for …”

### Fallback (any agent)

If plugin install is not available, link the skills into the agent’s skills folder:

```bash
node scripts/install-skills.mjs --agent cursor   # ~/.cursor/skills
node scripts/install-skills.mjs --agent claude   # ~/.claude/skills
node scripts/install-skills.mjs --agent codex    # ~/.codex/skills
node scripts/install-skills.mjs --agent all
```

Add `--uninstall` to remove the links.

## Create a video

In Claude Code or Cursor, after install:

```text
/make-video Make a 75-second LinkedIn video for Acme Billing.
Invoicing for freelancers. Cover invoices, reminders, and payments.
It is in beta. Do not invent numbers.
```

The agent will:

1. Read your prompt (and a product URL, repo, or logo if you give one)
2. Pick a length (never a fixed 30 seconds; max 10 minutes)
3. Scaffold a film project and write `brief.md` + `video.config.json`
4. Run `npm run validate`, then `npm run render`
5. Point you at the MP4

Allow the render to run **outside the sandbox**. It launches Chromium.

To revise an existing film, open that project and run `/review-video`.

## Without an agent

```bash
node skills/make-product-video/scripts/scaffold.mjs ./my-film --slug my-film --install
cd my-film
# edit brief.md and video.config.json
npm run validate
npm run render          # output/my-film.mp4
```

Worked example (fictional product):

```bash
node skills/make-product-video/scripts/scaffold.mjs ./demo-film --example sample-saas --install
```

### Film project commands

| Command | What it does |
| --- | --- |
| `npm run validate` | Schema, claims, and “is this actually about this product?” |
| `npm run render` | Build and write `output/<slug>.mp4` |
| `npm run render -- --jobs 6` | More parallel browsers |
| `npm run render -- --fps 24` | Faster finish on a long film |
| `npm run still` | Optional stills — only if a human asks to see a frame |
| `npm run doctor` | Checks Node, Chromium, ffmpeg |

## How a film is built

One camera flies through a chain of 3D **motifs**. Each scene pairs one visual with one headline.

| Motif | Typical meaning |
| --- | --- |
| `document` | Source material, files, the messy before |
| `scan` | Reading, analysis |
| `lattice` | Structure, extracted data |
| `constellation` | Q&A, knowledge, citations |
| `panels` | Reports, dashboards |
| `stream` | Workflow, automation |
| `orbit` | Platform, integrations |
| `screen` / `device` / `media` | UI, phone/laptop, real screenshots |
| `icon` | One symbol (shield, leaf, rocket, …) |
| `skyline` | Scale or momentum (illustrative, never real data) |
| `portals` | Closing resolve, three pillars |

Story, brand, and claims live in `video.config.json`. Geometry is seeded from the product name, so two products do not share motion. Details: [`skills/make-product-video/references/motifs.md`](skills/make-product-video/references/motifs.md).

## Length guide

| Prompt | Typical length |
| --- | --- |
| Teaser / X / “short” | 25–40 seconds |
| LinkedIn / feature cut | 75–120 seconds |
| Explainer / YouTube | 2–4 minutes |
| Walkthrough / “full” | 5–10 minutes |

## Limits

- Silent — no voice-over or music yet. Headlines are the soundtrack (good for muted autoplay).
- Tested at **1920×1080** landscape only.
- Maximum **10 minutes**.
- Does not post to YouTube, LinkedIn, or X.

## Repository layout

| Path | Purpose |
| --- | --- |
| `skills/make-product-video/` | Create skill, storyboard rules, Helios + Three.js engine |
| `skills/review-product-video/` | Audit copy and render an existing film |
| `commands/` | `/make-video`, `/review-video` |
| `examples/sample-saas/` | Fictional worked example |
| `.claude-plugin/` `.cursor-plugin/` `.codex-plugin/` | Agent manifests |

Contributor notes: [`AGENTS.md`](AGENTS.md).

```bash
npm test                 # manifests, skills, examples, scaffold
npm run engine:test      # after: npm --prefix skills/make-product-video/engine install
npm run engine:typecheck
```
