# `video.config.json` schema (version 2)

`npm run validate` enforces everything below, plus claims and product-specificity. Total duration is the sum of scene durations, and may not exceed **600 seconds (10 minutes)**.

```json
{
  "schema": 2,
  "slug": "acme-launch",
  "title": "Acme Launch Film",
  "brand": {"name": "Acme", "logo": "./assets/acme-white.png", "hudLabel": "Product film"},
  "theme": {
    "background": "#10162c", "primary": "#a1ec83", "secondary": "#c1e8ee",
    "highlight": "#f3663f", "ink": "#29335c", "text": "#ffffff", "font": "Inter"
  },
  "fps": 30, "width": 1920, "height": 1080, "seed": 20260101,
  "pillars": ["Connect", "Automate", "Share"],
  "claims": {
    "forbidden": ["available now"],
    "required": [{"phrase": "in beta", "scope": "last"}],
    "sourced": [{"text": "40%", "source": "Acme customer study, May 2026"}]
  },
  "scenes": [
    {
      "motif": "screen", "duration": 6, "chapter": "Overview",
      "eyebrow": "ONE WORKSPACE", "heading": "Invoices in\none place.",
      "body": "Short supporting sentence.",
      "items": ["Invoices", "Clients", "Payments"],
      "images": ["./assets/app-home.png"],
      "accent": "primary", "align": "left", "pillar": 0
    }
  ]
}
```

Output file: `output/<slug>.mp4`. There is no preview file.

## Top level

| Field | Rule |
| --- | --- |
| `schema` | Must be `2`. |
| `slug` | Lowercase letters, digits, dashes. Names the output file `output/<slug>.mp4`. Mixed into the world seed so two products never share geometry. |
| `title` | Browser tab and project title. Not shown on screen. |
| `brand.name` | Shown as a text wordmark when there is no logo. Also mixed into the world seed. |
| `brand.logo` | `null`, or `./assets/<file>` (must be relative; the file lives in `public/assets/`). Use a light-on-dark PNG with transparency. Never recolor, stretch, or add effects. |
| `brand.hudLabel` | Optional small label in the top-right corner. |
| `theme` | Six `#rrggbb` colours plus `font`. `background` is the world colour; `primary` is the main accent; `secondary` a cool or light companion; `highlight` a warm contrast; `ink` the dark colour used on light surfaces; `text` the headline colour. |
| `theme.font` | A font installed on the render machine. Falls back to the system sans-serif. |
| `fps` | 12 to 60. 30 is standard. Pass `--fps 24` on `npm run render` to finish a long film sooner without changing the config. |
| `width`, `height` | Pixels. Use 1920x1080; it is the only tested size (layout is tuned for landscape). |
| `seed` | Any integer unique to this product. Same seed + slug, same pixels. |
| `pillars` | Optional list of canonical feature names. Rendered as a right-hand rail. |
| `look` | Optional: `bloom` (0–1.5), `fog` (0.004–0.03), `exposure` (0.7–1.4), `dust` (`particles` or `none`). |
| `claims` | Guardrails. See below. |

## Scenes

| Field | Rule |
| --- | --- |
| `motif` | One of `document`, `scan`, `lattice`, `constellation`, `panels`, `portals`, `skyline`, `orbit`, `stream`, `screen`, `icon`, `device`, `media`. |
| `duration` | Seconds, 2 to 20. Sum of all scenes is the film length, maximum 600. |
| `chapter` | Short label shown bottom-left while the scene plays. |
| `eyebrow` | Uppercase kicker above the headline. A leading `01 / ` numeral is allowed. |
| `heading` | Up to 3 lines separated by `\n`, at most 30 characters per line (aim for 24). Font size shrinks automatically for longer lines. |
| `body` | Optional. At most 190 characters (aim for 120). |
| `items` | Optional. Up to 8 product-specific labels (1–26 characters) drawn on the 3D visual. |
| `images` | Optional. Up to 5 relative `./assets/...` paths. Required for `media`. Used by `screen` and `device` too. |
| `icon` | Built-in symbol for the `icon` motif: `shield`, `bolt`, `heart`, `cloud`, `pin`, `star`, `leaf`, `drop`, `flame`, `chat`, `lock`, `home`, `user`, `cart`, `doc`, `bars`, `gear`, `sun`, `rocket`, `check`. |
| `iconPath` | Custom SVG path in a 24×24 box. Overrides `icon`. |
| `device` | `phone`, `laptop`, or `monitor` for the `device` motif. Defaults to `laptop`. |
| `action` | Optional pill-shaped line, typically only on the closing scene. |
| `footnote` | Optional small line under the action, for availability or legal notes. |
| `accent` | `primary` (default), `secondary`, or `highlight`. Colours the kicker and action. |
| `align` | `left`, `right`, or `center`. Default alternates left/right and centres a final scene that has an `action`. The 3D subject always sits opposite the text. |
| `pillar` | Index into `pillars`; highlights that item while the scene plays. Omit on scenes that are not about a pillar. |

## Product-specificity

At least **80 percent** of scenes must carry `items`, `images`, or an `icon`. Adjacent scenes may not share a motif. Headlines from the sample film are rejected on any slug other than `sample-film`. Films of 4 or more scenes need at least as many distinct `items` as `min(6, scene count)`.

## Claims

- `forbidden`: phrases that must not appear in any scene field (case-insensitive).
- `required`: `{"phrase": "...", "scope": "any" | "last"}`. Use `last` for availability or legal lines that must close the film.
- `sourced`: `{"text": "...", "source": "..."}`. Any digit, percentage, or superlative ("best", "fastest", "instantly", "guaranteed", "world-class", "zero effort", ...) is rejected unless that exact text is listed here with a source the user approved. Do not add entries the user did not supply.

Fields checked: `eyebrow`, `heading`, `body`, `action`, `footnote`, `items`.
