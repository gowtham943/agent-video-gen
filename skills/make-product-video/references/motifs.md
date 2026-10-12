# Motif catalogue

A motif is one self-contained 3D visual. The engine places motifs in a line, flies the camera through them in order, and offsets the camera sideways so each motif sits opposite its scene's text. A motif becomes *this product's* when you fill it with the scene's `items`, `images`, `icon`, or `device`.

Set `"motif"` on a scene to one of these names.

| Motif | What the viewer sees | Uses these scene fields | Meaning | Good for | Avoid when |
| --- | --- | --- | --- | --- | --- |
| `media` | Up to five real pictures hung in space with captions | `images` (1 to 5, required), `items` as captions | The actual product | Showing screenshots, artwork, photos, a gallery | You have no pictures |
| `device` | A phone, laptop, or monitor showing a screenshot, with feature callouts | `device`, `images[0]` as the screen, `items` as callouts | The product in use | Apps, websites, dashboards, hardware with a screen | The product has no screen |
| `screen` | A floating app window: three cards, sidebar, main panel | `items[0..2]` card titles, `items[3..7]` sidebar, `images[0]` main panel | The product's interface | UI-led stories without a full device | You already used `device` right before |
| `icon` | One bold extruded symbol with `items` orbiting it | `icon` or `iconPath` (required), `items` | The product's world in one shape | A concept scene: security, speed, health, money | The idea has no good symbol |
| `orbit` | A glowing core with tilted orbits and satellites | `items` label satellites | A platform, ecosystem, integrations | "Works with", marketplaces, suites | A single-purpose tool |
| `constellation` | Linked nodes around a pulsing core | `items` label up to 5 nodes | Connections, knowledge, intelligence | AI, search, graphs, networks | The scene must feel like a finished deliverable |
| `lattice` | Scattered blocks snap into a glowing grid | `items` label up to 8 cells | Structure, organisation, features laid out | Catalogues, data, "turns X into Y" | The message is emotional |
| `panels` | An arc of report panels with a rising chart | `items` title up to 5 panels | Outputs, reports, deliverables | Reporting, analytics, exports | Early, before there is anything to report |
| `stream` | Particles flow along ribbons into a ring gate | `items` label the lanes | Workflow, pipeline, delivery, automation | Automation, data movement, logistics | The scene needs stillness |
| `skyline` | Bars rise on a grid | `items` label the bars | Momentum, scale, impact (illustrative, never data) | Outcome or scale beats | Numbers would be implied |
| `document` | A stack of text-and-table pages that fans apart | `items` as chips beside the stack | Source material, the problem, content | Openings about documents, records, inputs | The product is unrelated to content |
| `scan` | A tunnel of wireframe frames flown through | `items` as tags along the tunnel | Analysis, reading, checking | A "how it works" beat | It would follow another abstract motif |
| `portals` | Three rings opening around the brand | `items[0..2]` named inside the rings | Capabilities, the closing resolve | The final scene; three pillars | Mid-story |

`items` are drawn as text, so they must be real names (at most 26 characters each, at most 8 per scene). Missing fields are fine: a motif without `items` shows its neutral form, but the validator requires **80 percent** of scenes to carry a payload (`items`, `images`, or `icon`).

## Choosing by product

- Software or SaaS: `device` or `screen` for the interface, `stream` for automation, `constellation` or `orbit` for integrations, `panels` for outputs, `portals` to close.
- Physical product: `media` for photos, `icon` for the benefit, `skyline` for impact (illustrative), `portals` to close.
- Data or AI: `document`, `scan`, `lattice`, `constellation`, `panels`.
- Finance, health, security, climate, education: lead with `icon` (coin-like `check`, `heart`, `shield`, `leaf`, `doc`) then `media` or `device`.
- Marketplace or platform: `orbit`, `stream`, `media`, `skyline`.

Vary the sequence; never repeat a motif twice in a row; open on the product's strongest picture or symbol.

## Icons

Built-in (`icon`): `shield`, `bolt`, `heart`, `cloud`, `pin`, `star`, `leaf`, `drop`, `flame`, `chat`, `lock`, `home`, `user`, `cart` (a shopping bag), `doc`, `bars`, `gear`, `sun`, `rocket`, `check`.

Custom: set `iconPath` to SVG path data in a 24x24 box using only `M L H V C S Q T Z` (absolute or relative; no arcs). A subpath that lies inside another becomes a hole. Example (a diamond): `"M12 2L22 12L12 22L2 12Z"`.

## Devices

`device`: `laptop` (default), `monitor`, `phone`. Callouts sit beneath wide devices and beside phones.

## Pictures

Images are dimmed slightly so bright screenshots do not bloom. Use landscape screenshots for `media`, `device` (laptop or monitor), and `screen`; portrait for `device: "phone"`.

## Timing

A scene's `duration` is 2 to 20 seconds; 5 to 7 reads best. A motif starts forming about 0.9 seconds before its scene and begins to depart about 1.1 seconds before it ends, so scenes under 3 seconds feel rushed.

## Adding a motif

Only when none of the thirteen can express a scene. In the project:

1. Create `src/motifs/<name>.ts` exporting a `MotifDef`: `span`, `view`, and `create({palette, random, glow, scene, label, assets})` returning `{group, update(frame)}`.
2. `update` receives `{time, local, duration, energy, exit}`. Make every pose a pure function of those values. Use `random` (seeded) only inside `create`. Draw text with `label(text, options)` and pictures with `assets.image(url)`.
3. Take colours only from `palette`. Keep bright surfaces below the bloom threshold (`surfaceColor`, `IMAGE_TINT`).
4. Register it in `src/motifs/index.ts`, `MotifName` in `src/types.ts`, and `MOTIF_NAMES` in `scripts/lib/validate.mjs`. A test fails if they drift.
5. `npm run qa`.
