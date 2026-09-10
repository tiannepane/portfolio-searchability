# Homepage Masonry Grid Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the homepage's bento grid with a two-column, independent-height masonry layout: image-first cards with an inset accent pill and a tagline/metadata caption row, while preserving every bit of existing hover/tap-preview interaction behavior.

**Architecture:** Data model gets three new fields per project (`tagline`/`status`/`year`). CSS gets a new accent token, a CSS multi-column container, and an entirely new card visual structure (thumbnail block + inset pill + caption row, replacing the old text-over-scrim overlay). `js/home.js`'s `createCard()` is restructured to emit the new markup, but its outer contract (`.bento-card`, `.bento-card-link`, `data-category`/`data-project-id`/`data-previewed`) and all existing event-delegation logic (hover-preview, tap-preview, click-through) are untouched.

**Tech Stack:** Plain CSS (`column-count` multi-column layout, no JS masonry library), inline SVG (no icon library, none exists in this codebase). No new dependencies.

**Spec:** `docs/superpowers/specs/2026-09-10-homepage-masonry-grid-design.md`

## Global Constraints

- No color/font values outside `tokens.css` — every new color/font reference elsewhere in CSS must be a `var(--*)`.
- Named breakpoints only: reuse `--bp-sm` (480px), the current bento grid's own first breakpoint step — no new breakpoint.
- No copy changes to any project's name, category, links, or existing summary/narrative/tags — only the three new fields are added.
- Never invent a fact: `status`/`year` are `"[NEEDS CONTENT]"` for all 9 projects (confirmed with the user — not even Intelkin has a real status/year yet); `tagline` is real (condensed from existing approved content) for `intelkin`/`langchain-aggregator`/`river-ai` only, `"[NEEDS REAL CONTENT]"` for the other 6.
- The existing hover-preview (desktop) / two-step tap-preview (mobile) / click-through interaction, and `js/rail.js`'s scrollspy (which reads `.bento-card` + `data-category`), must keep working exactly as today — this plan changes the card's visuals, not its interaction contract.
- River AI's pill says "Visit site"; every other project's pill says "View case study".
- This site has no automated test suite — "testing" below means concrete browser-tool verification (computed styles, a live screenshot, a responsive check), not a unit-test framework.

---

### Task 1: Data model — add tagline/status/year to every project

**Files:**
- Modify: `data/projects.json`

**Interfaces:**
- Produces: every project entry gains `"tagline"`, `"status"`, `"year"` string fields, consumed by Task 4's `createCard()`.

- [ ] **Step 1: Add the three fields to each of the 9 entries**

For `windturbine`, `prototyping`, `contact-support-ai`, `research-aggregator`, `looped`, `airbnb` (the 6 placeholder projects), add, right after each entry's `"summary"` line:
```json
    "tagline": "[NEEDS REAL CONTENT]",
    "status": "[NEEDS CONTENT]",
    "year": "[NEEDS CONTENT]",
```

For `intelkin`, add (after its `"summary"` line):
```json
    "tagline": "Predicting churn before it happens.",
    "status": "[NEEDS CONTENT]",
    "year": "[NEEDS CONTENT]",
```

For `langchain-aggregator`, add (after its `"summary"` line):
```json
    "tagline": "Five agents, one human approving every step.",
    "status": "[NEEDS CONTENT]",
    "year": "[NEEDS CONTENT]",
```

For `river-ai`, add (after its `"summary"` line):
```json
    "tagline": "What if your social media team used AI effectively?",
    "status": "[NEEDS CONTENT]",
    "year": "[NEEDS CONTENT]",
```

- [ ] **Step 2: Verify the file is still valid JSON and every entry has all three new fields**

Run:
```bash
python3 -c "
import json
data = json.load(open('data/projects.json'))
assert len(data) == 9, f'expected 9 entries, got {len(data)}'
for p in data:
    for field in ('tagline', 'status', 'year'):
        assert field in p, f'{p[\"id\"]} missing {field}'
print('OK: 9 entries, all have tagline/status/year')
"
```
Expected: `OK: 9 entries, all have tagline/status/year`, no assertion error.

- [ ] **Step 3: Commit**

```bash
git add data/projects.json
git commit -m "Data: add tagline/status/year fields to every project

status/year are [NEEDS CONTENT] for all 9 (none confirmed yet, not
even Intelkin). tagline is real, condensed from existing approved
copy, for the 3 projects with real content; [NEEDS REAL CONTENT] for
the other 6, matching their existing summary/narrative placeholders."
```

---

### Task 2: Design tokens — accent color

**Files:**
- Modify: `css/tokens.css`
- Modify: `CLAUDE.md` (§12)

**Interfaces:**
- Produces: `--color-accent` custom property, consumed by Task 3's pill styling.

- [ ] **Step 1: Add the accent token**

In `css/tokens.css`, find:
```css
  /* Dark overlay for text legibility over a background image/gif (e.g. a
     bento card thumbnail) — grayscale (black + alpha), not a new hue. */
  --scrim: rgba(0, 0, 0, 0.65);
```
replace with:
```css
  /* Dark overlay for text legibility over a background image/gif (e.g. a
     bento card thumbnail) — grayscale (black + alpha), not a new hue. */
  --scrim: rgba(0, 0, 0, 0.65);

  /* Accent (confirmed 2026-09-10, CLAUDE.md §12) — the first real accent
     color in this codebase. Oxblood. Used sparingly: the homepage grid's
     "View case study" pill only, not a card background or large surface. */
  --color-accent: #92140C;
  --color-accent-text: #ffffff;
```

- [ ] **Step 2: Update CLAUDE.md §12**

Find:
```
## 12. Design Tokens — STATUS: typeface confirmed, palette pending
Typeface (confirmed 2026-09-10): Space Grotesk (headlines) / DM Sans (body/values) / Geist Pixel (micro-labels) — see `css/tokens.css`'s `--font-headline`/`--font-body`/`--font-label` and `docs/superpowers/specs/2026-09-10-typography-system-design.md`.
Palette (still pending): working direction is a dark, desaturated navy or graphite background, with a rich accent (Dark Amaranth `#840032` or Oxblood `#92140C`) reserved for tiny moments only — never a card background or large surface. Keep neutral/grayscale until fully confirmed.
```
replace with:
```
## 12. Design Tokens — STATUS: typeface + accent confirmed, background pending
Typeface (confirmed 2026-09-10): Space Grotesk (headlines) / DM Sans (body/values) / Geist Pixel (micro-labels) — see `css/tokens.css`'s `--font-headline`/`--font-body`/`--font-label` and `docs/superpowers/specs/2026-09-10-typography-system-design.md`.
Accent (confirmed 2026-09-10): Oxblood `#92140C` — see `css/tokens.css`'s `--color-accent`. First real usage: the homepage grid's "View case study" pill. Reserved for tiny moments only — never a card background or large surface.
Background (still pending): working direction is a dark, desaturated navy or graphite background. Keep neutral/grayscale until fully confirmed.
```

- [ ] **Step 3: Verify the token resolves**

Using the browser tool against any page (e.g. `http://localhost:3000/index.html`):
```js
getComputedStyle(document.documentElement).getPropertyValue('--color-accent').trim()
```
Expected: `"#92140C"`.

- [ ] **Step 4: Commit**

```bash
git add css/tokens.css CLAUDE.md
git commit -m "Design tokens: confirm accent color (Oxblood #92140C)

First real accent color in this codebase, per CLAUDE.md §12's own
working-direction note (which offered Dark Amaranth or Oxblood — the
user picked Oxblood). Background/palette otherwise stays pending."
```

---

### Task 3: CSS — masonry container + card component

**Files:**
- Modify: `css/components.css`

**Interfaces:**
- Consumes: `--color-accent`, `--color-accent-text` (Task 2), `--font-headline`, `--font-label` (already in `tokens.css` from the typography system).
- Produces: the exact class names Task 4's `createCard()` must emit — `.bento-card` (unchanged), `.bento-card-link` (unchanged as the interactive element, restructured internals), `.bento-card-thumb-wrap`, `.bento-card-thumb` (unchanged name, now block-flow not absolute), `.bento-card-thumb-placeholder`, `.bento-card-pill`, `.bento-card-pill-icon`, `.bento-card-caption`, `.bento-card-tagline`, `.bento-card-meta`, `.bento-card-hint` (unchanged).

- [ ] **Step 1: Replace the entire bento grid/card CSS block**

In `css/components.css`, find the exact block starting at the `/* --- Bento grid` comment and ending at the `@media (min-width: 1280px)` block that closes it (do not touch anything before or after this block — the `--- Focus visibility ---` section right after it, and the `.prompt-box-input.is-preview` rule sitting in the middle of the old block, are handled in later steps below):

```css
/* --- Bento grid — full list by default, or just the current query's
   matches (js/home.js, CLAUDE.md §5/§6). One grid, two states — never a
   separate results panel. --- */
.bento-grid {
  display: grid;
  grid-template-columns: 1fr;
  grid-auto-rows: minmax(120px, auto);
  gap: var(--space-4);
}

.bento-empty {
  grid-column: 1 / -1;
  padding: var(--space-6);
  text-align: center;
  color: var(--color-text-muted);
}

.bento-card-link {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: var(--space-1);
  height: 100%;
  min-height: 44px;
  padding: var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-surface);
  transition: border-color 0.15s ease;
  /* Inert for cards with no thumbnail — just gives .bento-card-thumb and
     the has-thumbnail scrim below a positioning/clipping context. */
  position: relative;
  overflow: hidden;
}

.bento-card-link:hover {
  border-color: var(--color-text-muted);
}

.bento-card-category {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-text-muted);
  font-family: var(--font-label);
}

.bento-card-title {
  font-size: 1.125rem;
  font-weight: 700;
  font-family: var(--font-headline);
}

/* Card thumbnail (real project preview, once one exists — e.g. Intelkin).
   Cards without a thumbnail are unaffected. */
.bento-card-thumb {
  position: absolute;
  inset: 0;
  z-index: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.bento-card.has-thumbnail .bento-card-link {
  background: var(--color-text); /* dark fallback while the image loads */
}

.bento-card.has-thumbnail .bento-card-link::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 1;
  background: linear-gradient(to top, var(--scrim), transparent 65%);
}

.bento-card.has-thumbnail .bento-card-category,
.bento-card.has-thumbnail .bento-card-title,
.bento-card.has-thumbnail .bento-card-hint {
  position: relative;
  z-index: 2;
  color: var(--color-bg);
}

/* Two-step tap preview state (touch devices only, see js/home.js §5).
   Hover-capable devices never set data-previewed — they preview on
   hover/focus instead and navigate on the first click. */
.bento-card[data-previewed="true"] .bento-card-link {
  border-color: var(--color-text);
}

.bento-card-hint {
  display: none;
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin-top: var(--space-1);
}

.bento-card[data-previewed="true"] .bento-card-hint {
  display: block;
}

@media (hover: hover) and (pointer: fine) {
  .bento-card-hint {
    display: none !important;
  }
}

.prompt-box-input.is-preview {
  color: var(--color-text-muted);
}

@media (min-width: 480px) {
  .bento-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .bento-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .bento-card.size-lg {
    grid-column: span 2;
    grid-row: span 2;
  }

  .bento-card.size-wide {
    grid-column: span 2;
  }

  .bento-card.size-md {
    grid-row: span 2;
  }
}

@media (min-width: 1280px) {
  .bento-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
```

replace with:

```css
/* --- Homepage project grid — two-column, independent-height masonry
   (CSS multi-column, no JS library), full list by default or just the
   current query's matches (js/home.js, CLAUDE.md §5/§6). One grid, two
   states — never a separate results panel. Single column below --bp-sm
   (480px), matching the bento grid's own original first breakpoint
   step (§9/§11). --- */
.bento-grid {
  column-count: 1;
  column-gap: var(--space-4);
}

@media (min-width: 480px) {
  .bento-grid {
    column-count: 2;
  }
}

.bento-empty {
  padding: var(--space-6);
  text-align: center;
  color: var(--color-text-muted);
}

.bento-card {
  break-inside: avoid;
  margin-bottom: var(--space-4);
}

.bento-card-link {
  display: block;
  min-height: 44px;
  border-radius: var(--radius-lg);
  transition: opacity 0.15s ease;
}

.bento-card-link:hover {
  opacity: 0.85;
}

/* Two-step tap preview state (touch devices only, see js/home.js §5).
   Hover-capable devices never set data-previewed — they preview on
   hover/focus instead and navigate on the first click. */
.bento-card[data-previewed="true"] .bento-card-link {
  outline: 2px solid var(--color-text);
  outline-offset: 2px;
}

.bento-card-thumb-wrap {
  position: relative;
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--color-surface);
}

.bento-card-thumb {
  display: block;
  width: 100%;
  height: auto;
}

/* Reuses .media-placeholder (layout.css) for projects with no real
   thumbnail yet — this modifier only removes its standalone margin,
   which doesn't apply inside a thumb slot that already has its own
   caption spacing below. */
.bento-card-thumb-placeholder {
  margin-bottom: 0;
}

.bento-card-pill {
  position: absolute;
  top: var(--space-3);
  right: var(--space-3);
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  min-height: 32px;
  padding: var(--space-1) var(--space-3);
  border-radius: 999px;
  background: var(--color-accent);
  color: var(--color-accent-text);
  font-family: var(--font-label);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.bento-card-pill-icon {
  flex-shrink: 0;
}

.bento-card-caption {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: baseline;
  gap: var(--space-2);
  padding-top: var(--space-2);
}

.bento-card-tagline {
  font-family: var(--font-headline);
  font-weight: 700;
  font-size: 1rem;
  color: var(--color-text);
}

.bento-card-meta {
  font-family: var(--font-label);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-text-muted);
  white-space: nowrap;
}

.bento-card-hint {
  display: none;
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin-top: var(--space-1);
}

.bento-card[data-previewed="true"] .bento-card-hint {
  display: block;
}

@media (hover: hover) and (pointer: fine) {
  .bento-card-hint {
    display: none !important;
  }
}

.prompt-box-input.is-preview {
  color: var(--color-text-muted);
}
```

Note: `.prompt-box-input.is-preview` is NOT a bento-card rule (it styles the prompt box's own input text color during preview) — it's kept, unchanged, in the replacement above purely because it sat physically in the middle of the old block being replaced. Don't lose it.

- [ ] **Step 2: Verify no leftover reference to the removed classes**

Run:
```bash
grep -n "has-thumbnail\|bento-card-category\|bento-card-title\b\|size-lg\|size-wide\|size-md" css/components.css
```
Expected: no output (all removed from CSS — `js/home.js` still references some of these until Task 4 runs; that's fine, Task 4 is next).

- [ ] **Step 3: Commit**

```bash
git add css/components.css
git commit -m "CSS: masonry grid container + new card component

Replaces the equal-row bento grid (CSS Grid + size-lg/wide/md spans)
with a two-column CSS multi-column masonry layout — cards size purely
by their own content, independent column heights. New card structure:
.bento-card-thumb-wrap (image or placeholder + inset accent pill) and
.bento-card-caption (tagline + monospace-style metadata). Old
.bento-card-category/.bento-card-title/has-thumbnail-scrim styling
removed. js/home.js's createCard() is updated to match in the next
task — until then the homepage will render unstyled/broken, expected
mid-plan."
```

---

### Task 4: JS — restructure `createCard()`

**Files:**
- Modify: `js/home.js:29-67` (the `createCard` function)

**Interfaces:**
- Consumes: `project.tagline`/`project.status`/`project.year` (Task 1), the CSS class names from Task 3.
- Produces: no change to `createCard`'s own signature or the DOM contract `js/rail.js` and the rest of `js/home.js` depend on (`.bento-card`, `data-category`, `data-project-id`, `data-previewed`, `.bento-card-link`) — every other function in this file is untouched.

- [ ] **Step 1: Replace `createCard`**

In `js/home.js`, find:
```javascript
  function createCard(project) {
    const article = document.createElement('article');
    article.className = `bento-card size-${project.size || 'sm'}`;
    if (project.thumbnail) article.classList.add('has-thumbnail');
    article.dataset.category = project.category;
    article.dataset.projectId = project.id;
    article.dataset.previewed = 'false';

    const link = document.createElement('a');
    link.className = 'bento-card-link';
    // Most cards open their in-site case study; a project with no case
    // study (e.g. an external product) links straight out instead —
    // opened in a new tab so the visitor never loses the grid.
    const caseStudyHref = project.links && project.links.caseStudy;
    const externalHref = project.links && project.links.external;
    link.href = caseStudyHref || externalHref || '#';
    if (!caseStudyHref && externalHref) {
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    }
    link.setAttribute('aria-label', `${project.title} — ${project.category}`);

    if (project.thumbnail) {
      // Respect prefers-reduced-motion: a still frame instead of an
      // animated gif or an autoplaying video.
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (project.thumbnailType === 'video' && !reduceMotion) {
        const thumb = document.createElement('video');
        thumb.className = 'bento-card-thumb';
        thumb.autoplay = true;
        thumb.loop = true;
        thumb.muted = true;
        thumb.playsInline = true;
        thumb.setAttribute('aria-hidden', 'true'); // decorative — the link's aria-label already names the project
        thumb.src = project.thumbnail;
        link.append(thumb);
      } else {
        const thumb = document.createElement('img');
        thumb.className = 'bento-card-thumb';
        thumb.alt = ''; // decorative — the link's aria-label already names the project
        thumb.src = reduceMotion && project.thumbnailPoster ? project.thumbnailPoster : project.thumbnail;
        link.append(thumb);
      }
    }

    const category = document.createElement('span');
    category.className = 'bento-card-category';
    category.textContent = project.category;

    const title = document.createElement('h3');
    title.className = 'bento-card-title';
    title.textContent = project.title;

    const hint = document.createElement('span');
    hint.className = 'bento-card-hint';
    hint.textContent = 'Tap again to open';

    link.append(category, title, hint);
    article.append(link);
    return article;
  }
```
replace with:
```javascript
  function createCard(project) {
    const article = document.createElement('article');
    article.className = `bento-card size-${project.size || 'sm'}`;
    article.dataset.category = project.category;
    article.dataset.projectId = project.id;
    article.dataset.previewed = 'false';

    const link = document.createElement('a');
    link.className = 'bento-card-link';
    // Most cards open their in-site case study; a project with no case
    // study (e.g. an external product) links straight out instead —
    // opened in a new tab so the visitor never loses the grid.
    const caseStudyHref = project.links && project.links.caseStudy;
    const externalHref = project.links && project.links.external;
    link.href = caseStudyHref || externalHref || '#';
    if (!caseStudyHref && externalHref) {
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    }
    link.setAttribute('aria-label', `${project.title} — ${project.category}`);

    const thumbWrap = document.createElement('div');
    thumbWrap.className = 'bento-card-thumb-wrap';

    if (project.thumbnail) {
      // Respect prefers-reduced-motion: a still frame instead of an
      // animated gif or an autoplaying video.
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (project.thumbnailType === 'video' && !reduceMotion) {
        const thumb = document.createElement('video');
        thumb.className = 'bento-card-thumb';
        thumb.autoplay = true;
        thumb.loop = true;
        thumb.muted = true;
        thumb.playsInline = true;
        thumb.setAttribute('aria-hidden', 'true'); // decorative — the link's aria-label already names the project
        thumb.src = project.thumbnail;
        thumbWrap.append(thumb);
      } else {
        const thumb = document.createElement('img');
        thumb.className = 'bento-card-thumb';
        thumb.alt = ''; // decorative — the link's aria-label already names the project
        thumb.src = reduceMotion && project.thumbnailPoster ? project.thumbnailPoster : project.thumbnail;
        thumbWrap.append(thumb);
      }
    } else {
      // No real thumbnail yet — the site's existing case-study
      // media-placeholder convention, sized for a card thumb slot.
      const placeholder = document.createElement('div');
      placeholder.className = 'bento-card-thumb-placeholder media-placeholder';
      placeholder.setAttribute('role', 'img');
      placeholder.setAttribute('aria-label', `${project.title} — thumbnail pending`);
      placeholder.textContent = 'Image pending';
      thumbWrap.append(placeholder);
    }

    const pill = document.createElement('span');
    pill.className = 'bento-card-pill';
    // Static icon markup only, never interpolated data — safe as innerHTML.
    pill.innerHTML = '<svg class="bento-card-pill-icon" aria-hidden="true" viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5Z"/><circle cx="8" cy="8" r="2"/></svg>';
    const pillLabel = document.createElement('span');
    // A project with no in-site case study links out instead — its pill
    // says what actually happens on click.
    pillLabel.textContent = caseStudyHref ? 'View case study' : 'Visit site';
    pill.append(pillLabel);
    thumbWrap.append(pill);

    const caption = document.createElement('div');
    caption.className = 'bento-card-caption';

    const tagline = document.createElement('p');
    tagline.className = 'bento-card-tagline';
    tagline.textContent = project.tagline;

    const meta = document.createElement('p');
    meta.className = 'bento-card-meta';
    meta.textContent = `${project.title.toUpperCase()} • ${project.status} • ${project.year}`;

    caption.append(tagline, meta);

    const hint = document.createElement('span');
    hint.className = 'bento-card-hint';
    hint.textContent = 'Tap again to open';

    link.append(thumbWrap, caption, hint);
    article.append(link);
    return article;
  }
```

- [ ] **Step 2: Verify no syntax errors and the file still loads**

Run:
```bash
node --check js/home.js
```
Expected: no output (valid syntax). Note: this only checks JS syntax validity, not DOM behavior — Task 5 does the real browser verification.

- [ ] **Step 3: Commit**

```bash
git add js/home.js
git commit -m "JS: restructure createCard() for the new masonry card markup

Emits .bento-card-thumb-wrap (image/video/placeholder + inset pill)
and .bento-card-caption (tagline + TITLE • STATUS • YEAR) instead of
the old text-over-scrim overlay. The outer .bento-card/.bento-card-link
contract, data-category/data-project-id/data-previewed, and every
other function in this file (hover-preview, tap-preview, query flow)
are untouched — same interaction, new visuals."
```

---

### Task 5: Visual verification across breakpoints

No code changes — this task exists specifically so the required visual pass actually happens and is recorded, rather than silently skipped (as happened once already in this session's typography work, caught only by a whole-branch review). Every step below must be run against the live rendered page, not inferred from the CSS/JS alone.

**Files:** none modified.

- [ ] **Step 1: Confirm the grid renders and is genuinely two independent columns, not row-aligned**

Using the browser tool against `http://localhost:3000/index.html` at 1280px width, run:
```js
const grid = document.querySelector('.bento-grid');
({
  columnCount: getComputedStyle(grid).columnCount,
  cardCount: document.querySelectorAll('.bento-card').length,
})
```
Expected: `columnCount: "2"`, `cardCount: 9`.

Take a screenshot. Confirm visually: the two columns do NOT have matching whitespace at the bottom lining up — if the left column's last card ends noticeably higher or lower than the right column's last card, that's correct (independent masonry). If both columns end at exactly the same height with visible padding to match, something reverted to row-aligned behavior — stop and report BLOCKED.

- [ ] **Step 2: Confirm every card's content**

For each of the 9 cards, using the browser tool, confirm: a pill is visible in the thumbnail's top-right corner reading "View case study" (or "Visit site" for River AI only), a tagline is visible, and a `TITLE • STATUS • YEAR` line is visible (reading `[NEEDS CONTENT]` for status/year on all 9 — this is expected, not a bug). For the 6 projects with no real thumbnail, confirm a dashed-border placeholder box renders instead of a broken image.

- [ ] **Step 3: Confirm the existing interaction model survived**

Using the browser tool, hover over any card with a `previewPrompt` (desktop simulation — `hover: hover` matchMedia): confirm the prompt box's input value changes to that project's `previewPrompt`. Click a card (any card with a real `caseStudy` link): confirm it navigates to that project's case-study page. This is the interaction CLAUDE.md §1/§5 requires and this plan promised not to change — if either doesn't work, stop and report BLOCKED, don't proceed to commit anything further.

- [ ] **Step 4: Mobile check**

Using the iframe technique (create a same-origin `<iframe>` at 375px width pointed at `/index.html`, since resizing the actual browser window doesn't reliably change the viewport in this environment — see this session's earlier precedent), confirm:
```js
getComputedStyle(iframeDoc.querySelector('.bento-grid')).columnCount
```
Expected: `"1"` (single column below 480px).

- [ ] **Step 5: Report**

Write a short report to `/Users/tianne/searchability/.superpowers/sdd/2026-09-10-homepage-masonry-grid/task-5-report.md` (create the directory if it doesn't exist) covering what was checked in Steps 1-4 and the result of each, plus any screenshots taken. No commit — this task produces no file changes, only verification evidence.

---

## Final Verification

- [ ] `grep -rn "has-thumbnail\|bento-card-category\|bento-card-title\b" css/ js/` returns nothing.
- [ ] `python3 -c "import json; json.load(open('data/projects.json'))"` succeeds (valid JSON).
- [ ] All 4 code-bearing commits (Tasks 1-4) exist in `git log`.
- [ ] Task 5's visual pass is recorded with a concrete pass/fail per step, not just "looks fine."

