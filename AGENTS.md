# Agent Video Gen

A cross-agent plugin (Claude Code, Cursor, Codex) that turns a prompt about any product into a cinematic, deterministic 3D video. Skills are the shared source of truth; the three manifests only point at them.

## Layout

| Path | Purpose |
| --- | --- |
| `skills/make-product-video/` | Main skill: workflow in `SKILL.md`, guidance in `references/`, `scripts/scaffold.mjs`, and `engine/` (the Helios + Three.js project template) |
| `skills/review-product-video/` | QA, copy audit, troubleshooting, final render |
| `commands/` | `/make-video`, `/review-video` (Claude Code and Cursor) |
| `rules/` | Cursor rule applied when editing a film's `video.config.json` or `brief.md` |
| `examples/groundx-studio/` | Worked example: config, brief, assets. Product-specific content lives only here |
| `.claude-plugin/`, `.cursor-plugin/`, `.codex-plugin/`, `.agents/plugins/` | Manifests and local marketplaces |
| `scripts/install-skills.mjs` | Symlink fallback install for any agent |
| `tests/plugin.test.mjs` | Manifest, skill, example, and scaffold checks |

## Commands

```bash
npm test                              # repo checks (manifests, skills, examples, scaffold)
npm --prefix skills/make-product-video/engine install
npm run engine:test                   # engine unit tests (config lint, timeline, motif determinism)
npm run engine:typecheck
```

## Rules

- Keep the plugin product-agnostic. Never hard-code a product name, claim, or palette in the engine or skills; those belong in `examples/`.
- Manifests must share `name`, `version`, and `description`; `tests/plugin.test.mjs` enforces it. Bump the version in all three plus the root `package.json`.
- Skill frontmatter is exactly `name` then `description`; `name` equals the folder name.
- In the engine, every visible state derives from the Helios `currentFrame` (no `Date.now()`, `Math.random()`, or previous-frame state); randomness comes from `seededRandom`. `engine/tests/motifs.test.ts` enforces order-independence for every motif.
- The motif list lives in `engine/src/motifs/index.ts`, `engine/src/types.ts`, and `engine/scripts/lib/validate.mjs`; a test fails if they drift. Document new motifs in `skills/make-product-video/references/motifs.md`.
- Engine dotfiles are stored as `_gitignore` and `_cursor/` and renamed by the scaffold script.
- Visual work: scaffold into `.scratch/`, symlink the engine's `node_modules`, run `npm run still`, and read the contact sheet. Stills and renders launch Chromium, which needs to run outside an agent sandbox.
