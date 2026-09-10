# Homepage Project Grid — Masonry Redesign

Date: 2026-09-10
Status: approved by user in chat, pending final spec review

## Goal

Replace the homepage's bento grid (equal-row, category+title text overlaid on a background thumbnail) with a two-column, independent-height masonry grid. Each card becomes: a large thumbnail with rounded corners, an inset "VIEW CASE STUDY" pill in the top-right corner, and a caption row below the image (tagline left, monospace `NAME • STATUS • YEAR` metadata right).

This applies **only** to the homepage's project grid. No case-study page's internal layout or content changes. The Intelkin terminal-card component is untouched.

## Out of scope

- Content/data changes beyond adding the three new fields below (`tagline`/`status`/`year`) — no project's name, category, links, or existing summary/narrative changes.
- Anything on an individual case-study page.
- The `background`/`--color-bg`/`--color-surface` palette decision (CLAUDE.md §12) — still pending. Only the one accent color below is being confirmed.

## Decisions already made (confirmed with user in chat)

1. **Accent color:** Oxblood `#92140C`, added as a real token (`--color-accent`) — the first accent color actually implemented in code, replacing CLAUDE.md §12's "pending" note with a confirmed accent (background stays pending).
2. **Interaction model is preserved, not replaced.** The existing hover-preview (desktop: hovering a card fills the prompt box with its `previewPrompt`) and two-step tap-to-preview (mobile) behavior, defined in `js/home.js` and required by CLAUDE.md §1/§5, must keep working exactly as it does today. The new visual design does not introduce a second, independently-clickable element — the whole card stays one link (`.bento-card-link`), same as today; the "pill" is a visual affordance inside that link, not a nested interactive element (which would be invalid HTML — an `<a>` cannot contain another focusable control).
3. **Masonry technique:** CSS multi-column (`column-count: 2`, `break-inside: avoid` per card) — no JS masonry library, no new dependency. Trade-off, accepted: reading/tab order becomes column-first (all of column 1 top-to-bottom, then column 2) instead of the current grid's row-first order. This is a legitimate, common masonry pattern, not a keyboard-accessibility regression — CLAUDE.md's Quality Floor requires full keyboard operability, not a specific traversal order.
4. **Missing data, handled honestly, not blocked on:**
   - **Status/year:** confirmed with the user that *no* project currently has a confirmed status/year — not even Intelkin (its own case-study page already flags this: `[confirm status/year]`). All 9 cards show a visible `[NEEDS CONTENT]` flag in the metadata slot until real values are supplied — same honest-placeholder convention used everywhere else on the site this session. Never invented.
   - **Tagline:** for the 3 projects with real content (Intelkin, Recollab/`langchain-aggregator`, River AI), a tagline is written by condensing what's already true in their existing `summary`/`narrative` — not a new fact, an edit of an approved one. The other 6 placeholder projects get a `[NEEDS REAL CONTENT]` tagline, matching their existing summary/narrative/tags placeholders.
   - **Thumbnail image:** 6 of 9 projects have no image at all. Their card shows the site's existing `.media-placeholder` convention (dashed border, centered muted text) sized to the thumbnail slot, instead of inventing or omitting an image.
5. **River AI's pill label:** "VISIT SITE" instead of "VIEW CASE STUDY" (it has no case study — its link is external, `riverai.ai`, opened in a new tab, same as today). Every other card keeps "VIEW CASE STUDY".
6. **Icon:** no icon library exists anywhere in this codebase today (confirmed — `grep` for icon/svg usage returns nothing, no `package.json`). The pill's eye icon is a small inline `<svg>`, stroke-based so it inherits `currentColor` from the pill's own text color automatically (no separate color to maintain):
```html
<svg class="bento-card-pill-icon" aria-hidden="true" viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
  <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5Z"/>
  <circle cx="8" cy="8" r="2"/>
</svg>
```
No new dependency.

## Data model changes — `data/projects.json`

Three new fields per project entry:
```json
"tagline": "Predicting churn before it happens.",
"status": "[NEEDS CONTENT]",
"year": "[NEEDS CONTENT]"
```
- `tagline`: string. Real, condensed text for Intelkin/`langchain-aggregator`/`river-ai`; `"[NEEDS REAL CONTENT]"` for the other 6.
- `status` / `year`: string. `"[NEEDS CONTENT]"` for all 9 projects (see Decision 4 above) until the user supplies real values.

## Markup changes — `js/home.js`

`createCard(project)` is restructured. The outer contract stays identical (this is what `js/rail.js` and the rest of `js/home.js`'s own hover/tap-preview logic depend on, and must not change):
- `<article class="bento-card size-{project.size}">` with `data-category`, `data-project-id`, `data-previewed` — unchanged.
- `<a class="bento-card-link">` as the single interactive element, `href`/`target`/`rel` resolved exactly as today (`links.caseStudy` / `links.external` fallback, from the River AI work earlier this session) — unchanged.

Inside the link, replaced:
```html
<div class="bento-card-thumb-wrap">
  <!-- real thumbnail: -->
  <img class="bento-card-thumb" src="..." alt="" />
  <!-- OR, when project.thumbnail is absent: -->
  <div class="bento-card-thumb-placeholder media-placeholder" role="img" aria-label="[Project title] — thumbnail pending">Image pending</div>

  <span class="bento-card-pill">
    <svg class="bento-card-pill-icon" aria-hidden="true" viewBox="0 0 16 16">...</svg>
    View case study <!-- or "Visit site" for river-ai -->
  </span>
</div>

<div class="bento-card-caption">
  <p class="bento-card-tagline">...</p>
  <p class="bento-card-meta">TITLE • STATUS • YEAR</p>
</div>
```
The existing `.bento-card-category`/`.bento-card-title`/`.bento-card-hint` elements and their tier-mapped fonts (from the typography system just shipped) are removed from the card — `.bento-card-title`'s Space Grotesk treatment moves to `.bento-card-tagline` instead (still Headline tier, per the flagged decision in the original brief, confirmed). `.bento-card-hint` (the "Tap again to open" mobile-preview label) stays, unchanged in behavior, repositioned to sit visibly on the new layout (exact placement is an implementation detail, not a design constraint).

Video-thumbnail projects (currently only River AI, `thumbnailType: "video"`) keep working exactly as today (looping muted `<video>` in place of `<img>`, poster fallback under `prefers-reduced-motion`) — this logic already exists in `createCard()` from this session's earlier work and isn't being rewritten, only relocated into the new `.bento-card-thumb-wrap` container.

## CSS changes — `css/components.css`

- Container: `.bento-grid` changes from CSS Grid (`display: grid`, responsive `grid-template-columns`) to CSS multi-column (`column-count: 1` mobile-first, `column-count: 2` at `--bp-sm` (480px) and up — matching the current grid's own first breakpoint step). Each `.bento-card` gets `break-inside: avoid; margin-bottom: var(--space-4);` (multi-column has no `gap`-between-items equivalent for the vertical axis the way grid does, so this replaces `.bento-grid`'s `gap`).
- The `size-lg`/`size-wide`/`size-md` span-based sizing (`grid-column: span 2`, `grid-row: span 2`, etc.) is removed — multi-column layout has no concept of a cell span; card height is now purely a function of its own content (image + caption), which is what makes the columns independent in the first place. `project.size` in `data/projects.json` becomes unused by this component; not removed from the data (may still be meaningful later), just not read by the new `createCard()`/CSS.
- New: `.bento-card-thumb-wrap` (`position: relative`, rounded corners via `var(--radius)`/`var(--radius-lg)` — matching the site's existing corner-radius convention, `overflow: hidden`).
- New: `.bento-card-pill` — `position: absolute; top: var(--space-3); right: var(--space-3);`, background `var(--color-accent)` (Oxblood), white/light text, pill-shaped (`border-radius` large enough to fully round the ends), small icon + label, matching the site's existing button padding/min-height conventions (`--space-2`/`--space-4` padding, 44px minimum touch target per CLAUDE.md §13).
- New: `--color-accent: #92140C;` added to `css/tokens.css`, with a short comment confirming it as the first real accent-color decision (CLAUDE.md §12 updated to match — accent confirmed, background still pending).
- New: `.bento-card-caption` (flex row, `justify-content: space-between`, wraps to stacked on very narrow cards if needed), `.bento-card-tagline` (Headline tier — `var(--font-headline)`, matching what `.bento-card-title` had), `.bento-card-meta` (Label tier — `var(--font-label)`, uppercase, letter-spaced, matching `.bento-card-category`'s existing treatment).
- `.bento-card-thumb-placeholder` reuses `.media-placeholder`'s existing rule directly (same class, added alongside a sizing modifier if the thumbnail slot's fixed aspect ratio needs a size the generic placeholder doesn't already have).

## Responsive

Single column below `--bp-sm` (480px), two independent columns from 480px up — mirrors the current bento grid's own first breakpoint step, so this isn't a new breakpoint choice, just reusing an existing one per CLAUDE.md §11's "named breakpoints only" rule.

## Testing

No automated test suite on this site (established convention this session). Verification is the same as every prior task this session: visual check at 375px/768px/1440px, a live computed-style check confirming the two independent column heights don't match (proving true masonry, not row-aligned grid), and confirming the existing hover-preview/tap-preview/click-through interaction still works unchanged after the restyle.
