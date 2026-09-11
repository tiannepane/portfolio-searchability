# Case Study Sidebar Nav + Spacing Pass

Date: 2026-09-11
Status: approved by user in chat, pending final spec review

## Goal

Add a sticky, scroll-spy left sidebar of section links to the shared case-study template (every project page, present and future), built dynamically from each page's own section headings — never hardcoded per page. Separately, open up vertical spacing on both the case-study template and the homepage grid, per a verbal reference description (no screenshot available).

## Correction to the original brief

The brief's "one thing to watch" — that Intelkin runs its own typography system (Instrument Serif/Public Sans/IBM Plex Mono) requiring font-inheritance handling in the sidebar — is out of date. That exception was retired into the site-wide system on 2026-09-09 (commit `39ce51f`, an earlier plan this same session). Intelkin now uses the same Space Grotesk/DM Sans/Geist Pixel as every other page. There is no dual-font scenario to design for — the sidebar uses `var(--font-body)` (DM Sans) unconditionally, everywhere.

## Out of scope

- No copy changes anywhere.
- The Intelkin terminal-card component — untouched.
- Font choices anywhere — this changes spacing and adds the sidebar's own (single, site-wide) font, nothing about existing type choices.
- No new spacing-scale tokens — the pass only changes which existing `--space-*` token a rule uses.

## Part 1 — Sidebar section nav

### Discovery & injection (`js/case-study-nav.js`, new file)

A new script, loaded only on case-study pages. On `DOMContentLoaded`:
1. Finds `document.querySelectorAll('.case-study-section h2')`.
2. For each, generates a URL-safe `id` if the heading doesn't already have one (slugify: lowercase, spaces/punctuation to hyphens, e.g. "The Problem" → `the-problem`; "Research: Dogfooding on Recollab" → `research-dogfooding-on-recollab`), and sets it on the heading's parent `.case-study-section` (the anchor target is the section, not the bare heading, so a sticky top-nav doesn't clip the heading text on jump).
3. Sets `role="navigation"` and `aria-label="Section navigation"` on the `#case-study-sidenav` hook itself (a plain `<div>` in the static markup — see below; this is what makes it an accessible nav landmark, rather than nesting a redundant inner `<nav>` inside it).
4. Builds one `<ul><li><a href="#<id>">...</a></li>...</ul>` (link text taken verbatim from each heading's `textContent`) and injects it into the hook — wrapped in `<details><summary>Jump to section</summary>...</details>` below 768px, or bare above it. The breakpoint check happens once, matching the site's existing mobile-detection convention (e.g. `js/home.js`'s `isHoverCapable()`).
5. Sets up an `IntersectionObserver` (`rootMargin: '-10% 0px -80% 0px'`, `threshold: 0`) watching every `.case-study-section`. Whichever section is intersecting gets its corresponding sidebar link marked `.is-active`; every other link loses that class. (`rootMargin` biases activation toward a section as its heading nears the top ~10-20% of the viewport, rather than requiring the whole section to be visible — standard scroll-spy tuning, no exact section is ever ambiguous since sections don't overlap vertically.)

This mirrors the existing pattern in `js/shared-ui.js` (an empty hook div, populated by a script at runtime) rather than inventing a new one.

### Markup (identical, small addition to all 8 `projects/*.html` files)

Find:
```html
  <div id="shared-nav"></div>
  <main class="case-study" data-project-id="...">
```
wrap as:
```html
  <div id="shared-nav"></div>
  <div class="case-study-page">
    <div id="case-study-sidenav" class="case-study-sidenav"></div>
    <main class="case-study" data-project-id="...">
```
with a matching closing `</div>` added right after the existing `</main>`, and `<script src="/js/case-study-nav.js" defer></script>` added alongside each page's other script tags. The hook is a plain, unstyled-by-semantics `<div>` — the script sets its `role`/`aria-label` and decides its content shape (bare list vs. `<details>`-wrapped), so there's no nav-inside-nav or details-inside-nav redundancy.

This is the one piece of "per-page markup" this design requires — structurally identical on every page (a wrapper + an empty hook), no section content or list hardcoded. `#case-study-sidenav`'s actual content is 100% JS-generated from that page's own headings.

### CSS (`css/layout.css`)

```css
.case-study-page {
  display: block;
  margin-bottom: var(--space-6);
}

/* Mobile (below 768px): the script builds a <details><summary> inside
   this hook instead of a bare <ul> — this styles that collapsed
   state, matching the site's existing bordered-box convention (e.g.
   .case-study-meta). */
.case-study-sidenav {
  margin-bottom: var(--space-5);
}

.case-study-sidenav details {
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  padding: var(--space-3) var(--space-4);
}

.case-study-sidenav summary {
  cursor: pointer;
  font-family: var(--font-body);
  font-weight: 600;
  color: var(--color-text);
}

.case-study-sidenav details ul {
  margin-top: var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

/* Link styling applies identically whether the ancestor is <details>
   (mobile) or the bare hook div (desktop, see below) — only the
   container layout differs by breakpoint, not the active/muted color
   treatment. */
.case-study-sidenav a {
  display: block;
  font-family: var(--font-body);
  font-size: 0.9375rem;
  color: var(--color-text-muted);
  padding: var(--space-1) 0;
}

.case-study-sidenav a.is-active {
  color: var(--color-text);
  font-weight: 600;
}

@media (min-width: 768px) {
  .case-study-page {
    display: flex;
    align-items: flex-start;
    gap: var(--space-6);
    max-width: 960px;
    margin-inline: auto;
    padding-inline: var(--space-4);
  }

  .case-study-sidenav {
    margin-bottom: 0;
    position: sticky;
    top: var(--space-6);
    flex: 0 0 180px;
  }

  /* At this width the script builds a bare <ul> directly inside the
     hook (no <details>) — this rule targets that shape, not the
     mobile accordion above. */
  .case-study-sidenav > ul {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  /* .case-study keeps its own max-width (720px) and centering — inside
     the flex row above it just needs to give up centering itself and
     take the remaining space instead. */
  .case-study {
    flex: 1;
    margin-inline: 0;
    padding-inline: 0;
  }
}
```

Below 768px, the script builds `#case-study-sidenav`'s content as `<details><summary>Jump to section</summary><ul>...</ul></details>` instead of a bare `<ul>` — native, keyboard-operable, zero extra JS for the collapse/expand mechanic itself, and (unlike a `display:none` approach) still fully visible and usable, just collapsed by default. The active-link highlighting rule (`a.is-active`) applies inside the `<details>` version too, just without the sticky positioning, which only matters once the content column is tall enough to scroll past a fixed-width sidebar.

`.case-study` itself keeps its existing `max-width: 720px; margin-inline: auto;` at the base (mobile) level — only overridden inside the `.case-study-page` flex row at 768px+, where the flex row's own `max-width: 960px` and centering take over.

## Part 2 — Spacing pass

All values already approved:

| File | Selector | Property | Before | After |
|---|---|---|---|---|
| `css/layout.css` | `.case-study-section h2` | `margin-bottom` | `var(--space-3)` (12px) | `var(--space-4)` (16px) |
| `css/layout.css` | `.case-study-section` | `margin-bottom` | `var(--space-6)` (32px) | `var(--space-7)` (48px) |
| `css/layout.css` | `.case-study-hero` | `margin-bottom` | `var(--space-5)` (24px) | `var(--space-6)` (32px) |
| `css/layout.css` | `.case-study-meta` | `margin-bottom` | `var(--space-6)` (32px) | `var(--space-7)` (48px) |
| `css/components.css` | `.bento-card-caption` | `padding-top` | `var(--space-2)` (8px) | `var(--space-3)` (12px) |
| `css/components.css` | `.bento-grid-column` | `gap` | `var(--space-4)` (16px) | `var(--space-6)` (32px) |

No new tokens — existing `--space-*` scale only, each rule moved to a token roughly one tier up. Consistent across every case-study page and the homepage grid (not spot-fixed).

## Testing

- Visual check at 375px/768px/1024px/1440px on Intelkin (11 sections) and Recollab/`langchain-aggregator` (5 sections) — two genuinely different section counts, per the "After" report's own requirement.
- Confirm scroll-spy: scrolling through a page highlights each section's link in turn, exactly one active at a time.
- Confirm the mobile `<details>` collapses/expands via click and via keyboard (Enter/Space on the `<summary>`).
- Confirm no copy changed anywhere (diff should be structural/CSS only, plus the one new JS file).
- Confirm the Intelkin terminal card is pixel-identical before/after (spacing pass doesn't touch anything inside `.terminal-card`).
