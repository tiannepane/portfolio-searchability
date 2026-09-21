---
name: watercolor-scrollytelling
description: >-
  Build hand-drawn, watercolor-textured interactive scrollytelling explainer
  pages — the "scroll to reveal a data story" format used by pieces like
  Anthropic's economic-scenarios explorer. Use this whenever the user wants
  an interactive report, explainer, case study, or "page you can scroll
  through" that turns a PDF, report, or dataset into a visual narrative,
  especially if they mention scrollytelling, an interactive explainer, a
  "scenario predictor" or "input your assumptions" tool, a hand-drawn or
  watercolor or sketchy visual style, scroll-triggered animation, a
  pinned/sticky chart with text scrolling past it, or a page "like" some
  data-journalism site that animates as you scroll. Also trigger this for
  requests to turn a PDF, report, or research paper into an engaging web
  page or artifact, since that's this skill's primary use case. Produces a
  self-contained HTML component library (design tokens plus copy-paste
  snippets) and a working demo page, not just a one-off page.
---

# Watercolor Scrollytelling

A design system + component library for turning static content (PDFs, reports,
research write-ups) into an interactive, hand-illustrated, scroll-driven web
page — think: cream paper background, watercolor-textured shapes, hand-drawn
wobbly borders, sections that animate in as you scroll, a pinned chart that
stays put while interpretive text scrolls past it, and (optionally) a
"predict your own scenario" tool that compares the reader's inputs against
reference scenarios from the source material.

This is a **component library**, not a single template. Pull the pieces you
need from `references/components.md` and assemble them around the user's
actual content. `assets/example.html` is a full worked demo showing every
component wired together — reuse its structure as a starting skeleton.

## When to reach for which file

- **This file (SKILL.md)** — design tokens, workflow, and an index of what's
  available. Read this first.
- **`references/components.md`** — every reusable snippet (CSS + HTML + JS):
  paper background, watercolor swatches, hand-drawn cards, mosaic reveal
  grids, hand-drawn charts via RoughJS, the two scrollytelling patterns, and
  the scenario-predictor tool. Copy-paste and adapt; don't reinvent these.
- **`assets/example.html`** — a complete, working, self-contained demo page.
  Open it, steal its `<head>` boilerplate (font links, RoughJS script tag,
  the SVG filter defs, the base CSS reset), and swap its placeholder content
  for the real thing.

## Design language at a glance

- **Paper, not screen.** Warm cream background with a faint graph-paper grid
  underneath everything. Nothing pure white, nothing pure black.
- **Watercolor, not flat color.** Shapes have soft, slightly irregular edges
  and subtle texture — never a crisp `border-radius: 4px` rectangle.
- **Hand-drawn, not vector-perfect.** Chart lines wobble slightly. Card
  borders aren't perfectly straight. Corners are asymmetric.
- **Serif for voice, sans for UI.** Editorial serif type (a Caslon-style
  face) for headings and narrative text; a plain grotesk sans only for nav
  chrome, labels, and data readouts.
- **Muted, cohesive palette.** Dusty lavender, sky blue, sage green, tan,
  amber, dusty rose — desaturated, watercolor-swatch colors that never
  clash. See tokens below.
- **Scroll = narrative engine.** Content reveals itself as the reader
  scrolls — squares color in, chart lines draw themselves, text cards fade
  up — rather than everything being visible at once.
- **Let the reader participate.** The strongest version of this format ends
  with (or is built around) a tool where the reader inputs their own
  assumptions and sees them plotted against the source material's reference
  scenarios.

## Design tokens

Paste this `:root` block at the top of every page's stylesheet. Everything
else in the component library depends on these variables existing.

```css
:root {
  /* paper */
  --paper: #F7F4EC;
  --paper-grid: #E5E2D6;
  --ink: #21201C;
  --ink-soft: #5B584E;
  --card-bg: #F1EEE3;
  --card-border: #D9D5C6;

  /* watercolor palette — use for swatches, chart lines, fills */
  --wc-lavender: #ABA0E0;
  --wc-blue: #82BCE8;
  --wc-tan: #DDD6BC;
  --wc-gold: #EAC069;
  --wc-sage: #8AAE90;
  --wc-rose: #E093A6;
  --wc-gray: #ACA89C;

  /* type */
  --font-serif: 'Libre Caslon Text', Georgia, 'Times New Roman', serif;
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;

  /* rhythm */
  --radius-hand: 14px 17px 13px 16px / 16px 13px 18px 14px;
  --shadow-card: 2px 3px 0 rgba(30,28,20,0.05), 0 10px 26px rgba(30,28,20,0.08);
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --paper: #26241E;
    --paper-grid: #34322A;
    --ink: #F1EFE6;
    --ink-soft: #B8B4A6;
    --card-bg: #2E2C24;
    --card-border: #45422F;
  }
}

:root[data-theme="dark"] {
  --paper: #26241E;
  --paper-grid: #34322A;
  --ink: #F1EFE6;
  --ink-soft: #B8B4A6;
  --card-bg: #2E2C24;
  --card-border: #45422F;
}
```

Two Google Fonts cover the whole system:
`https://fonts.googleapis.com/css2?family=Libre+Caslon+Text:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600&display=swap`

## Build workflow

1. **Extract the beats.** Read the source PDF/report and pull out 5–9 "beats"
   — the individual claims or moments a reader should walk through in order
   (e.g. "here's the framework," "here are the three scenarios," "finding 1,"
   "finding 2," "try it yourself," "closing caveat"). Each beat becomes one
   scroll section. Don't try to fit the whole document in — pick the beats
   that carry the narrative.
2. **Pick one hero metaphor.** The reference page uses "the economy is made
   of tasks" as a recurring visual (a grid of squares) that reappears
   throughout. Find (or invent) one simple visual metaphor for the user's
   content and reuse it across 2–3 beats so the page feels like one story,
   not a slideshow.
3. **Assign a component to each beat.** Use the index below. Simple
   explanatory beats → sequential reveal sections. A beat that compares
   multiple trajectories over time → the pinned-chart pattern. A "try it
   yourself" beat → the predictor tool.
4. **Build the skeleton from `assets/example.html`.** Copy its `<head>`,
   the SVG filter defs, the nav bar, and the base CSS. Then replace its demo
   sections one at a time with real content and real components from
   `references/components.md`.
5. **Wire up scroll behavior last.** Get all content in and looking right in
   a static state first, then layer in the IntersectionObserver triggers
   (from `components.md`) so nothing is ever fighting broken layout *and*
   broken animation at the same time.
6. **Check `prefers-reduced-motion`.** Every animated component in
   `components.md` has a reduced-motion fallback (content simply appears,
   no transform/stagger). Don't strip these out.
7. **Publish, don't just save.** This is an interactive page — publish it as
   an artifact rather than handing back a file, per the standard rule for
   apps/interactive pieces.

## Component index

Full code for all of these lives in `references/components.md`, under the
matching heading.

| Component | Use for | Heading in components.md |
|---|---|---|
| Paper canvas + grid | Page/section background | `## Paper canvas` |
| Watercolor swatch | Small colored blocks, legend chips, single icons | `## Watercolor swatch` |
| Hand-drawn card | Floating callout / narration box | `## Hand-drawn card` |
| Mosaic reveal grid | "X is made of many small things" metaphor, task/category grids that color in on scroll | `## Mosaic reveal grid` |
| Hand-drawn line/area chart (RoughJS) | Any time-series or trend comparison | `## Hand-drawn charts with RoughJS` |
| Waffle / dot-matrix bar | Proportions, part-to-whole (e.g. "X% of every dollar") | `## Waffle bar` |
| Flow ribbon | Migration/transition between two states (e.g. workers moving between categories) | `## Flow ribbon` |
| Sequential reveal sections | Straightforward explanatory beats, one idea per screen | `## Pattern A — sequential reveal sections` |
| Pinned visual + scrolling steps | One chart, several interpretive text beats walking through it | `## Pattern B — pinned visual, scrolling steps` |
| Scenario predictor | Reader inputs assumptions via sliders, sees them plotted against and interpolated between the source material's reference scenarios | `## Scenario predictor` |
| Spectrum marker | Standalone "where does your answer fall" number line, without the full predictor tool | `## Spectrum marker` |

## Publishing constraints (don't skip this)

Pages built with this skill are meant to be published as artifacts, which
run under a locked-down environment:

- **Scripts** may only load from `cdnjs.cloudflare.com`,
  `cdn.jsdelivr.net/npm/`, `cdn.tailwindcss.com`, or `code.jquery.com`, each
  pinned to an exact version. RoughJS from cdnjs is the one external
  dependency this system uses — confirm the version you reference actually
  exists on cdnjs before shipping.
- **Stylesheets/fonts** may only load from `fonts.googleapis.com` (which
  pulls files from `fonts.gstatic.com`). Always give the serif and sans a
  real fallback stack (already done in the tokens above).
- **No other network calls, no other CDNs** (not even unpkg or esm.sh) —
  everything else must be inlined in the one HTML file.
- Declare `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`
  and respect safe-area insets on any fixed/sticky header — see
  `components.md` for the exact CSS.
- Define light **and** dark tokens (done above) — the page renders inside a
  viewer with its own theme setting.
- Wrap any RoughJS draw calls in `try/catch` and give every hand-drawn shape
  a sensible CSS-only fallback appearance, in case the script fails to load.

## Content-mapping cheat sheet

When the user hands you a PDF or report to turn into a page:

- **Headline stat or thesis** → hero section, oversized serif type, maybe one
  watercolor swatch or simple chart as a teaser.
- **"Here's the underlying model/framework"** → mosaic reveal grid walking
  through categories/states one at a time (mirrors "the economy is made of
  tasks → some tasks get automated → new tasks appear").
- **Multiple named scenarios/trajectories over time** → pinned line chart
  with scrolling steps, one step per scenario.
- **A set of numbered findings** → sequential reveal sections, one finding
  per section, each with its own small chart (waffle bar, flow ribbon, or a
  simple RoughJS bar/line).
- **"What would happen if..." / assumptions the reader might disagree with**
  → the scenario predictor, parameterized on whatever variables the source
  material varies (see `components.md` for how `anchors` map to named
  scenarios).
- **Caveats/limitations/credits** → plain prose section, no special
  component — don't over-decorate the fine print.

Keep prose short per section (2–4 sentences per card, like the reference).
This format lives or dies on restraint — resist the urge to cram an entire
report's worth of text into one card.
