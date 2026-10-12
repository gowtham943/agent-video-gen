# Storytelling and copy for a product film

Length follows the request, up to **10 minutes**. Do not default to 30 seconds.

## Pick the length first

Write `Target length:` in the brief before you storyboard, then do not shrink it later.

1. If the user named a duration, use it (minimum 15 seconds, maximum 10 minutes).
2. Otherwise count the distinct things to say in the prompt and any captured page (features, steps, benefits, audiences):

| Prompt | Length | Scenes (about 6–12 s each) |
| --- | --- | --- |
| Teaser, ad, spot, "short", 1–2 talking points | 25–40 s | 5–7 |
| Typical "make a video about X" with 3–5 points | **75–120 s** | 12–20 |
| Overview, explainer, 6–10 points | 2–4 min | 18–30 |
| Walkthrough, deep dive, "full", many source pages | 5–10 min | 30–60 |

A 10-minute film uses longer scenes (10–15 s) grouped into chapters, not 100 tiny cuts.

## Shape

1. **Hook:** the viewer's situation or the product's promise, in their words.
2. **Mechanism:** what the product does. One idea per scene, shown as a visual that belongs to *this* product (its feature names, screenshots, symbols).
3. **Payoff:** the outcome the viewer gets.
4. **Close:** the name, one line, one action or availability note.

For films over about 90 seconds, group scenes into chapters: a short opening, one 4-to-6-scene chapter per capability (the chapter label names it), and a close.

## Every film must look like this product

- Headlines, items, and images come from this product. Never ship leftover sample copy ("One place for the work", "Inbox", "Weekly summary").
- Put the product's real feature, file, integration, or step names on the 3D objects via `items`.
- Put screenshots or product photos on `screen`, `device`, and `media` scenes via `images`.
- Pick `icon` / `device` from the domain (shield for security, phone if it is a mobile app).
- Palette and `look` come from the brand; if none, pick from the table below and mark it `ASSUMED`.
- Derive `seed` from the product (any integer unique to this slug). The engine also mixes the slug into the random stream, so two products never share procedural geometry.

## Copy rules

- Headline: 2 to 7 words per line, 2 lines. Concrete verbs: "Turn", "Ask", "See", "Ship". No "revolutionary", "seamless", "next-generation", "leverage".
- Body: one sentence, 12 to 20 words, written for the viewer ("you", "your team"), not about the company.
- Parallel structure across feature scenes ("Capture. Organize. Share.").
- Say what the product does before saying how well. Do not say how well at all without a sourced fact.
- Availability must match the product stage. In development: say so on the last scene (`claims.required`). Never imply "available now", "instant", or "no setup".
- Use the product's own feature names verbatim. Never invent new product labels.
- No numbers, percentages, customer names, awards, or comparisons unless the user supplied them with a source.

## Eyebrows and chapters

- `eyebrow`: a category or step label, uppercase: `"01 / EXTRACT"`, `"HOW IT WORKS"`.
- `chapter`: the same idea in one or two words for the footer: `"EXTRACT"`.

## Palette defaults (when the user gives none)

Pick one family, keep contrast high against a dark background, and keep `ink` darker than every other colour so text on light surfaces is readable.

| Feel | background | primary | secondary | highlight | ink |
| --- | --- | --- | --- | --- | --- |
| Trustworthy data / AI | `#10162c` | `#a1ec83` | `#c1e8ee` | `#f3663f` | `#29335c` |
| Calm software | `#0f1530` | `#7cf0c8` | `#b8d4ff` | `#ff7a59` | `#232b52` |
| Energetic consumer | `#150d24` | `#ff7ad9` | `#ffd166` | `#5ce1e6` | `#2b1745` |
| Industrial / infrastructure | `#0b1118` | `#ffb703` | `#8ecae6` | `#fb5607` | `#1d2b36` |
| Health / sustainability | `#0a1a17` | `#6ee7b7` | `#d1fae5` | `#fbbf24` | `#16403a` |

State the palette as an assumption when you chose it.

## Pacing

- Under 90 s: scenes of 5 to 7 seconds, last one slightly longer.
- 2 to 4 min: scenes of 7 to 10 seconds.
- 5 to 10 min: scenes of 10 to 15 seconds.
- Alternate text sides (the default) so the eye zig-zags; centre only the close.

## Presenting the result

Lead with the MP4 path, duration, and the scene list. Then the assumptions, then claims you left out. Offer two specific variants (shorter cut, extra chapter). Do not generate a preview or stills unless asked.
