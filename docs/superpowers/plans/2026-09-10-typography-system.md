# Site-wide Typography System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the site's still-"pending" generic font stack with a three-tier typography system (Space Grotesk headlines, DM Sans body/values, Geist Pixel micro-labels), applied everywhere — nav, homepage, the shared case-study template, all 8 project pages, `feedback.html`, `fun.html` — and retire Intelkin's existing page-scoped typography exception into this same system.

**Architecture:** Three semantic CSS custom properties (`--font-headline`/`--font-body`/`--font-label`) replace the single `--font-base` placeholder in `tokens.css`. `body`'s font-family becomes `--font-body`, so every element inherits Body tier by default; only Headline- and Label-tier selectors get explicit overrides. All three families load from Google Fonts (confirmed reachable directly — no npm package, no build step) via identical `<link>` tags repeated in every HTML file's `<head>`, matching the site's existing no-build-step convention.

**Tech Stack:** Plain CSS custom properties, Google Fonts (`fonts.googleapis.com/css2`). No new dependencies.

**Spec:** `docs/superpowers/specs/2026-09-10-typography-system-design.md`

## Global Constraints

- No build step — every HTML file repeats its own `<link>` tags (CLAUDE.md §2).
- No color/font values outside `tokens.css` (CLAUDE.md §14) — every font-family reference elsewhere in CSS must be a `var(--font-*)`, never a literal family name.
- Named breakpoints only: `--bp-sm: 480px`, `--bp-md: 768px`, `--bp-lg: 1024px`, `--bp-xl: 1280px` (CLAUDE.md §11) — this plan adds no new breakpoints.
- No copy changes anywhere in this plan — styling only.
- The Intelkin terminal card (`.terminal-card` in `css/layout.css`) keeps `font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace` — never touched by any task below.
- This site has no automated test suite (CLAUDE.md's own quality floor is manual visual verification at 375px/768px/1440px, §11/§13) — every task's "test" steps are concrete verification commands (curl for markup, a headless browser computed-style check for CSS), not a unit-test framework.

---

### Task 1: Font tokens + site-wide font loading (10 of 11 HTML files)

`projects/intelkin.html` is deliberately excluded from this task — it currently has its own (soon-to-be-retired) font `<link>` tags, which Task 4 replaces in one atomic edit so the page is never left with two conflicting font-loading blocks at once.

**Files:**
- Modify: `css/tokens.css`
- Modify: `css/layout.css:21-25` (the `body` rule)
- Modify: `CLAUDE.md` (§12)
- Modify: `index.html`, `feedback.html`, `fun.html`, `projects/airbnb.html`, `projects/contact-support-ai.html`, `projects/langchain-aggregator.html`, `projects/looped.html`, `projects/prototyping.html`, `projects/research-aggregator.html`, `projects/windturbine.html` (`<head>`, after the existing `components.css` link)

**Interfaces:**
- Produces: `--font-headline`, `--font-body`, `--font-label` custom properties on `:root`, consumed by every later task. `--font-base` no longer exists — any later task that finds a lingering `var(--font-base)` reference must replace it with `var(--font-body)`.

- [ ] **Step 1: Replace `--font-base` with the three tier tokens in `css/tokens.css`**

Replace:
```css
  /* System font stack placeholder — not a chosen typeface, see status note above */
  --font-base: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
```
with:
```css
  /* Typeface system (CLAUDE.md §12 confirmed 2026-09-10 — see
     docs/superpowers/specs/2026-09-10-typography-system-design.md).
     Headline: Space Grotesk, weight 700 — H1s and every H2-equivalent
     sub-headline. Body: DM Sans — paragraphs, ledes, metadata values,
     UI chrome. Label: Geist Pixel, weight 400 (its only weight) —
     short all-caps eyebrows/metadata labels only, never a value or a
     sentence. Loaded via Google Fonts in every page's <head> — see any
     page for the exact <link> tags. Palette (color) is still pending. */
  --font-headline: "Space Grotesk", Georgia, serif;
  --font-body: "DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  --font-label: "Geist Pixel", var(--font-body);
```

Also update the file's header status comment. Replace:
```
  STATUS: visual direction (palette, typeface) is still pending — CLAUDE.md §10.
  Everything below is neutral/grayscale placeholder styling only, not a chosen
  palette or typeface. Replace with real tokens once direction is confirmed;
  nothing outside this file should hardcode a color or font (§12).
```
with:
```
  STATUS: typeface is confirmed (Space Grotesk / DM Sans / Geist Pixel, see
  the font tokens below and docs/superpowers/specs/2026-09-10-typography-system-design.md).
  Palette is still pending — colors below remain neutral/grayscale
  placeholder styling only. Nothing outside this file should hardcode a
  color or font (§12).
```

- [ ] **Step 2: Point `body`'s font-family at the new Body token in `css/layout.css`**

Replace:
```css
body {
  font-family: var(--font-base);
  color: var(--color-text);
  background: var(--color-bg);
}
```
with:
```css
body {
  font-family: var(--font-body);
  color: var(--color-text);
  background: var(--color-bg);
}
```

- [ ] **Step 3: Add the font `<link>` tags to the 10 non-Intelkin HTML files**

In each of `index.html`, `feedback.html`, `fun.html`, `projects/airbnb.html`, `projects/contact-support-ai.html`, `projects/langchain-aggregator.html`, `projects/looped.html`, `projects/prototyping.html`, `projects/research-aggregator.html`, `projects/windturbine.html`, find:
```html
  <link rel="stylesheet" href="/css/components.css" />
```
and insert immediately after it:
```html
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link
    href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Geist+Pixel&family=Space+Grotesk:wght@700&display=swap"
    rel="stylesheet"
  />
```

- [ ] **Step 4: Update CLAUDE.md §12**

Replace:
```
## 12. Design Tokens — STATUS: pending
Working direction: dark, desaturated navy or graphite background, with a rich accent (Dark Amaranth `#840032` or Oxblood `#92140C`) reserved for tiny moments only — never a card background or large surface. Keep neutral/grayscale until fully confirmed.
```
with:
```
## 12. Design Tokens — STATUS: typeface confirmed, palette pending
Typeface (confirmed 2026-09-10): Space Grotesk (headlines) / DM Sans (body/values) / Geist Pixel (micro-labels) — see `css/tokens.css`'s `--font-headline`/`--font-body`/`--font-label` and `docs/superpowers/specs/2026-09-10-typography-system-design.md`.
Palette (still pending): working direction is a dark, desaturated navy or graphite background, with a rich accent (Dark Amaranth `#840032` or Oxblood `#92140C`) reserved for tiny moments only — never a card background or large surface. Keep neutral/grayscale until fully confirmed.
```

- [ ] **Step 5: Verify markup — every non-Intelkin page has the font links, in order**

Run:
```bash
for f in index.html feedback.html fun.html projects/airbnb.html projects/contact-support-ai.html projects/langchain-aggregator.html projects/looped.html projects/prototyping.html projects/research-aggregator.html projects/windturbine.html; do
  grep -q "family=DM+Sans" "$f" && echo "OK: $f" || echo "MISSING: $f"
done
```
Expected: `OK: <file>` for all 10 files, no `MISSING` lines.

- [ ] **Step 6: Verify computed style — body text renders in DM Sans**

With the local dev server running on `localhost:3000` (`curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/` should return `200`; if not, the working session already has `vercel dev` running — check `lsof -i :3000` before starting a second one), open `http://localhost:3000/index.html` in the browser tool and run:
```js
getComputedStyle(document.body).fontFamily
```
Expected: string starting with `"DM Sans"` (quotes included, per how Chrome reports a quoted family name).

- [ ] **Step 7: Commit**

```bash
git add css/tokens.css css/layout.css CLAUDE.md index.html feedback.html fun.html projects/airbnb.html projects/contact-support-ai.html projects/langchain-aggregator.html projects/looped.html projects/prototyping.html projects/research-aggregator.html projects/windturbine.html
git commit -m "Typography: font tokens + site-wide font loading (non-Intelkin pages)

Replaces --font-base with --font-headline/--font-body/--font-label
(Space Grotesk / DM Sans / Geist Pixel). body now uses --font-body.
projects/intelkin.html is handled separately in the task that retires
its existing font exception, so it isn't touched here."
```

---

### Task 2: Case-study shared template — Headline/Label tier mapping

**Files:**
- Modify: `css/layout.css`

**Interfaces:**
- Consumes: `--font-headline`, `--font-body`, `--font-label` from Task 1.

- [ ] **Step 1: Headline tier — page H1 and every section/card sub-headline**

In `css/layout.css`, add a new rule right after the `body` rule (from Task 1, Step 2):
```css
h1 {
  font-family: var(--font-headline);
  font-weight: 700;
}
```

Find:
```css
.case-study-section h2 {
  margin-bottom: var(--space-3);
  font-size: 1.25rem;
}
```
replace with:
```css
.case-study-section h2 {
  margin-bottom: var(--space-3);
  font-size: 1.25rem;
  font-family: var(--font-headline);
  font-weight: 700;
}
```

Find:
```css
.case-study-section h3 {
  margin-top: var(--space-5);
  margin-bottom: var(--space-2);
  font-size: 1.0625rem;
  color: var(--color-text);
}
```
replace with:
```css
.case-study-section h3 {
  margin-top: var(--space-5);
  margin-bottom: var(--space-2);
  font-size: 1.0625rem;
  color: var(--color-text);
  font-family: var(--font-headline);
  font-weight: 700;
}
```

Find:
```css
.case-study-section h4 {
  margin-bottom: var(--space-1);
  font-size: 1rem;
  color: var(--color-text);
}
```
replace with:
```css
.case-study-section h4 {
  margin-bottom: var(--space-1);
  font-size: 1rem;
  color: var(--color-text);
  font-family: var(--font-headline);
  font-weight: 700;
}
```

Find:
```css
.case-study-subbeat h3 {
  margin-top: 0;
  margin-bottom: var(--space-2);
}
```
(this selector already inherits the Headline styling from `.case-study-section h3` above via the combined selector it was originally paired with — but since Task 1 removed the old combined intelkin.css rule, add it explicitly here so it doesn't silently fall back to Body tier):
replace with:
```css
.case-study-subbeat h3 {
  margin-top: 0;
  margin-bottom: var(--space-2);
  font-family: var(--font-headline);
  font-weight: 700;
}
```

Find:
```css
.friction-point h3 {
  margin-top: 0;
  margin-bottom: var(--space-1);
}
```
replace with:
```css
.friction-point h3 {
  margin-top: 0;
  margin-bottom: var(--space-1);
  font-family: var(--font-headline);
  font-weight: 700;
}
```

Find:
```css
.page-section h2 {
  margin-bottom: var(--space-3);
  font-size: 1.25rem;
}
```
replace with:
```css
.page-section h2 {
  margin-bottom: var(--space-3);
  font-size: 1.25rem;
  font-family: var(--font-headline);
  font-weight: 700;
}
```

Note: `.reflection-item h4` is already covered by the `.case-study-section h4` rule above (reflection items live inside `.case-study-section`) — no separate rule needed. Verify this assumption in Step 3 below.

- [ ] **Step 2: Label tier — eyebrows and metadata labels**

Find:
```css
.case-study-eyebrow {
  color: var(--color-text-muted);
  font-size: 0.8125rem;
  margin-top: var(--space-2);
}
```
replace with:
```css
.case-study-eyebrow {
  color: var(--color-text-muted);
  font-size: 0.8125rem;
  margin-top: var(--space-2);
  font-family: var(--font-label);
}
```

Find:
```css
.case-study-category {
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin-bottom: var(--space-2);
}
```
replace with:
```css
.case-study-category {
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin-bottom: var(--space-2);
  font-family: var(--font-label);
}
```

Find:
```css
.case-study-meta dt {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-text-muted);
}
```
replace with:
```css
.case-study-meta dt {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-text-muted);
  font-family: var(--font-label);
}
```

Find:
```css
.friction-meta {
  display: block;
  font-size: 0.8125rem;
  font-weight: 400;
  color: var(--color-text-muted);
  margin-top: var(--space-1);
}
```
replace with:
```css
.friction-meta {
  display: block;
  font-size: 0.8125rem;
  font-weight: 400;
  color: var(--color-text-muted);
  margin-top: var(--space-1);
  font-family: var(--font-label);
}
```

Find:
```css
.testimonial cite {
  font-style: normal;
  color: var(--color-text-muted);
  font-size: 0.875rem;
}
```
replace with:
```css
.testimonial cite {
  font-style: normal;
  color: var(--color-text-muted);
  font-size: 0.875rem;
  font-family: var(--font-label);
}
```

- [ ] **Step 3: Lede weight — "medium" per the spec, not the old bold**

Find:
```css
p.case-study-lede {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: var(--space-3);
}
```
replace with:
```css
p.case-study-lede {
  font-size: 1.125rem;
  font-weight: 500;
  color: var(--color-text);
  margin-bottom: var(--space-3);
}
```

- [ ] **Step 4: Verify no bare `var(--font-base)` references remain**

Run:
```bash
grep -rn "font-base" css/ projects/ *.html 2>/dev/null
```
Expected: no output (empty). If anything matches, replace it with `var(--font-body)` before continuing.

- [ ] **Step 5: Visual verification — a placeholder project page and feedback.html**

Using the browser tool against `http://localhost:3000/projects/windturbine.html` and `http://localhost:3000/feedback.html`:
```js
({
  h1: getComputedStyle(document.querySelector('h1')).fontFamily,
  eyebrow: document.querySelector('.case-study-category, .case-study-eyebrow') ? getComputedStyle(document.querySelector('.case-study-category, .case-study-eyebrow')).fontFamily : 'n/a on this page',
})
```
Expected: `h1` starts with `"Space Grotesk"`; the eyebrow (where present) starts with `"Geist Pixel"`.

- [ ] **Step 6: Commit**

```bash
git add css/layout.css
git commit -m "Typography: Headline/Label tier mapping for the shared case-study template

h1, section/card sub-headlines -> Space Grotesk (Headline). Eyebrows,
metadata labels, friction-point risk lines, testimonial attribution ->
Geist Pixel (Label). Lede weight 600 -> 500 (medium, not bold) per spec."
```

---

### Task 3: Homepage — bento card tier mapping

**Files:**
- Modify: `css/components.css`

**Interfaces:**
- Consumes: `--font-headline`, `--font-label` from Task 1.

- [ ] **Step 1: Bento card title — Headline tier, sized down**

Find:
```css
.bento-card-title {
  font-size: 1.125rem;
  font-weight: 600;
}
```
replace with:
```css
.bento-card-title {
  font-size: 1.125rem;
  font-weight: 700;
  font-family: var(--font-headline);
}
```

- [ ] **Step 2: Bento card category — Label tier**

Find:
```css
.bento-card-category {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-text-muted);
}
```
replace with:
```css
.bento-card-category {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-text-muted);
  font-family: var(--font-label);
}
```

- [ ] **Step 3: Visual verification — homepage bento grid**

Using the browser tool against `http://localhost:3000/index.html` (after `js/home.js` has rendered the grid from `data/projects.json`):
```js
({
  title: getComputedStyle(document.querySelector('.bento-card-title')).fontFamily,
  category: getComputedStyle(document.querySelector('.bento-card-category')).fontFamily,
})
```
Expected: `title` starts with `"Space Grotesk"`, `category` starts with `"Geist Pixel"`.

- [ ] **Step 4: Commit**

```bash
git add css/components.css
git commit -m "Typography: bento card title/category tier mapping

Card title (H2-equivalent, sized down) -> Space Grotesk. Card category
eyebrow -> Geist Pixel, matching the shared template's own eyebrow tier."
```

---

### Task 4: Retire Intelkin's page-scoped typography exception

**Files:**
- Modify: `projects/intelkin.html` (`<head>`)
- Modify: `css/intelkin.css`

**Interfaces:**
- Consumes: `--font-headline`, `--font-body`, `--font-label` from Task 1; the shared-template Headline/Label rules from Task 2 (Intelkin's `.case-study-section h2/h3`, `.friction-point h3`, `.case-study-eyebrow`, etc. now inherit those automatically once its own overrides are deleted).

- [ ] **Step 1: Swap Intelkin's font `<link>` tags for the site-wide ones**

In `projects/intelkin.html`, replace:
```html
  <!--
    This page only: a deliberate, disclosed typography exception (see
    css/intelkin.css header comment). No other page loads these fonts or
    this stylesheet — CLAUDE.md §10's typeface status stays "pending"
    everywhere else on the site.
  -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link
    href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Instrument+Serif&family=Public+Sans:wght@400;500;600;700&display=swap"
    rel="stylesheet"
  />
  <link rel="stylesheet" href="/css/intelkin.css" />
```
with:
```html
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link
    href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Geist+Pixel&family=Space+Grotesk:wght@700&display=swap"
    rel="stylesheet"
  />
  <!-- css/intelkin.css now only carries this page's parallel-content
       column layout — typography is the site-wide system, same as
       every other page (see docs/superpowers/specs/2026-09-10-typography-system-design.md). -->
  <link rel="stylesheet" href="/css/intelkin.css" />
```

- [ ] **Step 2: Delete `css/intelkin.css`'s entire typography block**

Read the current file first — the `.positioning-line-label` override was already removed from it earlier this session (the diagram it styled became a static image), so the block to delete now runs from the file's header comment through the terminal-card font override. Delete everything from the `/* css/intelkin.css — typography system...` header comment down through:
```css
.case-study[data-project-id="intelkin"] .terminal-card {
  font-family: var(--intelkin-font-mono);
}
```
inclusive — i.e., every rule that references `--intelkin-font-serif`, `--intelkin-font-sans`, or `--intelkin-font-mono`, and the `:root { --intelkin-font-*: ...; }` block itself. **Do not delete** the `.intelkin-columns` grid-layout rules below that point — those stay untouched.

- [ ] **Step 3: Add a new, short header comment to `css/intelkin.css`**

At the top of the file (where the deleted typography header comment used to be), add:
```css
/*
  css/intelkin.css — Intelkin-only page-scoped exceptions that aren't
  typography (that's now the site-wide system in tokens.css, same as
  every other page — see docs/superpowers/specs/2026-09-10-typography-system-design.md).

  Currently: the parallel-content column layout below (Market Research's
  three approaches, Key Friction Points, Reflection's two takeaways).
  Scoped under [data-project-id="intelkin"], and only ever loaded by
  projects/intelkin.html.
*/
```

- [ ] **Step 4: Verify the old Intelkin font tokens are gone and the columns CSS survived**

Run:
```bash
grep -n "intelkin-font\|Instrument Serif\|Public Sans\|IBM Plex Mono" css/intelkin.css projects/intelkin.html
```
Expected: no output.

Run:
```bash
grep -c "intelkin-columns" css/intelkin.css
```
Expected: a number greater than 0 (the columns rules are still there).

- [ ] **Step 5: Visual verification — Intelkin page**

Using the browser tool against `http://localhost:3000/projects/intelkin.html`:
```js
({
  h1: getComputedStyle(document.querySelector('h1')).fontFamily,
  category: getComputedStyle(document.querySelector('.case-study-category')).fontFamily,
  terminalCard: getComputedStyle(document.querySelector('.terminal-card')).fontFamily,
  columnsStillGrid: getComputedStyle(document.querySelector('.intelkin-columns--3')).display,
})
```
Expected: `h1` starts with `"Space Grotesk"`; `category` starts with `"Geist Pixel"`; `terminalCard` is the system monospace stack (`ui-monospace, "SF Mono", Menlo, Consolas, monospace` — NOT `"IBM Plex Mono"`); `columnsStillGrid` is `"grid"`.

- [ ] **Step 6: Commit**

```bash
git add projects/intelkin.html css/intelkin.css
git commit -m "Typography: retire Intelkin's page-scoped exception into the site-wide system

Intelkin now loads the same Space Grotesk/DM Sans/Geist Pixel fonts as
every other page instead of its own Instrument Serif/Public Sans/IBM
Plex Mono. The terminal card correctly falls back to layout.css's own
system-monospace rule now that the override is gone. css/intelkin.css
keeps only its parallel-content column layout, unrelated to fonts."
```

---

### Task 5: Housekeeping — dead resume CSS

**Files:**
- Modify: `css/layout.css`
- Modify: `css/components.css`

- [ ] **Step 1: Delete the dead resume-page CSS block from `css/layout.css`**

`resume.html` was deleted earlier this session (the nav's Resume tab now links straight to an external Google Drive PDF), so this block is unreachable. Delete:
```css
/* --- Resume page --- */
.resume-download {
  display: inline-block;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  padding: var(--space-2) var(--space-4);
  min-height: 44px;
  line-height: 28px;
  margin-bottom: var(--space-5);
}

.resume-entry {
  margin-bottom: var(--space-4);
}

.resume-entry h3 {
  font-size: 1rem;
}

.resume-entry li {
  color: var(--color-text-muted);
  margin-bottom: var(--space-1);
}

.resume-meta {
  color: var(--color-text-muted);
  font-size: 0.875rem;
  margin-bottom: var(--space-2);
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.tag-list li {
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  padding: var(--space-1) var(--space-3);
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

```

- [ ] **Step 2: Drop `.resume-download` from the `:focus-visible` selector list in `css/components.css`**

Find:
```css
.prompt-box-submit:focus-visible,
.prompt-box-input:focus-visible,
.prompt-box-clear:focus-visible,
.rail-item:focus-visible,
.bento-card-link:focus-visible,
.chat-toggle:focus-visible,
.tianne-panel-close:focus-visible,
.tianne-panel-links a:focus-visible,
.case-study-section a:focus-visible,
.resume-download:focus-visible {
```
replace with:
```css
.prompt-box-submit:focus-visible,
.prompt-box-input:focus-visible,
.prompt-box-clear:focus-visible,
.rail-item:focus-visible,
.bento-card-link:focus-visible,
.chat-toggle:focus-visible,
.tianne-panel-close:focus-visible,
.tianne-panel-links a:focus-visible,
.case-study-section a:focus-visible {
```

- [ ] **Step 3: Verify no remaining references anywhere**

Run:
```bash
grep -rn "resume-download\|resume-entry\|resume-meta\|tag-list" css/ *.html projects/ 2>/dev/null
```
Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add css/layout.css css/components.css
git commit -m "Cleanup: remove dead resume-page CSS

resume.html was deleted earlier this session (nav's Resume tab links
externally now) — this CSS has been unreachable since."
```

---

## Final Verification

- [ ] Run the full markup check from Task 1 Step 5 again — all 11 HTML files (10 + Intelkin) now load the same font `<link>` tags.
- [ ] Visual check at 375px / 768px / 1440px (CLAUDE.md §11 convention) on: homepage, `windturbine.html`, `intelkin.html`, `feedback.html`, `fun.html` — headings read in Space Grotesk, body text in DM Sans, eyebrows/labels in Geist Pixel and never longer than a short phrase.
- [ ] `grep -rn "font-base\|intelkin-font\|Instrument Serif\|Public Sans\|IBM Plex Mono" css/ projects/ *.html` returns nothing.
- [ ] Intelkin's terminal card still renders in system monospace, unchanged from before this plan.
