# Site-wide Typography System — Design

Date: 2026-09-10
Status: approved by user in chat, pending final spec review

## Goal

Replace the still-"pending" (CLAUDE.md §12) generic system-font stack with a real, chosen three-tier typography system, applied everywhere on the site — nav, homepage, the shared case-study template, every project page (including the 7 still holding placeholder content), `feedback.html`, `fun.html`. This also retires Intelkin's existing page-scoped typography exception (Instrument Serif / Public Sans / IBM Plex Mono, `css/intelkin.css`), folding Intelkin into the same site-wide system everyone else now uses.

## Out of scope

- **Color/palette** — CLAUDE.md §12 stays "pending" for palette; only the typeface portion is being confirmed.
- **"People to Meet"** — a second case study referenced in `project-data/intelkin-restructured-draft.md` but not yet built (no page, no `data/projects.json` entry). It will use this same system once it exists, but building its content is a separate, later project — it needs real content (role/timeline/team/tech stack/narrative) that doesn't exist yet, and CLAUDE.md's hard rule forbids inventing it.
- Content changes of any kind — this is a styling-only pass. No copy changes anywhere.

## The three fonts and their tiers

1. **Headline** — `--font-headline`: Space Grotesk, weight 700. Page-level H1s and every element functioning as a section/card sub-headline (H2-equivalent), regardless of its literal heading tag depth.
2. **Body** — `--font-body`: DM Sans, weights 400 (regular, default)/500 (medium, subtitle emphasis)/600/700 (existing UI-chrome bold elements). Everything read at length: paragraphs, ledes/subtitles, metadata *values*, quote text, nav/UI chrome text.
3. **Label** — `--font-label`: Geist Pixel, weight 400 (its only available weight). Short, all-caps micro-labels only: section eyebrows, metadata *labels*, and equivalents. Never a value, a sentence, or long text.

Confirmed via direct Google Fonts CSS2 API checks (not the npm `geist` package, no build step, no self-hosting):
```
https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Geist+Pixel&family=Space+Grotesk:wght@700&display=swap
```

## Token changes — `css/tokens.css`

Replace the single `--font-base` placeholder with three semantic tier tokens:
```css
--font-headline: "Space Grotesk", Georgia, serif;
--font-body: "DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
--font-label: "Geist Pixel", var(--font-body);
```
Update the file's header comment: typeface portion of §12 is now confirmed (palette remains pending). `body { font-family: var(--font-base); }` in `layout.css` becomes `var(--font-body)` — since every other tier-body selector inherits from `body`, this is the only change needed to make Body tier the site-wide default; only Headline/Label tier selectors need explicit overrides below.

## Font loading — every HTML file

Add the same four lines (preconnect ×2 + the combined `css2` link above) to `<head>`, in every one of: `index.html`, `feedback.html`, `fun.html`, and all 8 files in `projects/*.html`. This duplicates across files the same way `reset.css`/`tokens.css`/etc. links already do — no build step means no way around per-file repetition.

## Selector → tier mapping

**Headline** (`css/layout.css` unless noted) — add `font-family: var(--font-headline); font-weight: 700;`:
- `h1` (bare tag — exactly one page title per page, always Headline)
- `.case-study-section h2`
- `.case-study-section h3`, `.case-study-subbeat h3`, `.friction-point h3`, `.reflection-item h4` (sized down — mirrors the tiering Intelkin's own retiring system already established for card/grid titles)
- `.page-section h2` (feedback/fun's generic section headers, currently unused but present for future content)
- `css/components.css`: `.bento-card-title` (the project-card `<h3>`, homepage) — same "H2-equivalent, sized down" logic

**Label** (`css/layout.css` unless noted) — add `font-family: var(--font-label);` (uppercase/letter-spacing already exists on the ones that had it):
- `.case-study-category`, `.case-study-eyebrow`, `.case-study-meta dt`, `.friction-meta`, `.positioning-line-label`
- `.testimonial cite` (short attribution line — same job as an eyebrow)
- `css/components.css`: `.bento-card-category` (already uppercase/letter-spaced)

**Body** — no new rules needed for most selectors; they inherit `var(--font-body)` from `body` once the token above changes. One explicit change:
- `p.case-study-lede`: `font-weight: 600` → `500`, to match the guide's literal "medium weight" wording for a subtitle standing apart from ordinary paragraphs (DM Sans 500 is loaded for this).

**Explicitly NOT touched** (per the guide's one exception): `.terminal-card`'s `font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace` in `layout.css` — already correct, untouched.

## `css/intelkin.css` — retiring the old exception

- Delete the entire typography block: the `--intelkin-font-*` custom properties and every rule using them (base font-family, H1/H2/lede/eyebrow rules, `.friction-point h3 .friction-meta`, `.positioning-line-label` override).
- Delete `.case-study[data-project-id="intelkin"] .terminal-card { font-family: var(--intelkin-font-mono); }` — once removed, the terminal card falls back to `layout.css`'s own rule, which is already the exact system-monospace stack the guide asks for. No new CSS needed for the terminal card.
- **Keep**: the `.intelkin-columns` grid-layout rules added this session (parallel-content columns) — unrelated to fonts, stays as-is.
- Update the file's remaining header comment to reflect that Intelkin no longer carries its own type system — it inherits the site-wide one like every other page. If nothing but the columns CSS remains, the file's purpose comment gets rewritten accordingly (it's no longer "typography system for Intelkin ONLY" — it's now just Intelkin's page-scoped layout exception).
- `projects/intelkin.html`: remove the four Google-Fonts `<link>` lines specific to the old exception, replaced by the same site-wide font `<link>` tags every other page gets (§ "Font loading" above).

## `feedback.html` / `fun.html` mapping

- `.page-header h1` → Headline (covered by the bare `h1` rule above)
- `.page-intro`, testimonial paragraph text → Body (inherited, no change)
- `.testimonial cite` → Label (listed above)

## Housekeeping

- `css/layout.css`: delete the now-dead resume CSS (`.resume-download`, `.resume-entry`, `.resume-entry h3`, `.resume-entry li`, `.resume-meta`, `.tag-list`, `.tag-list li`) — unreachable since `resume.html` was deleted earlier this session. Also drop `.resume-download` from the `:focus-visible` selector list in `components.css`.
- `CLAUDE.md` §12: typeface line changes from "pending" to confirmed (three fonts + tiers, one line), palette line stays pending.

## Judgment calls (both confirmed with user)

- **Nav brand ("Tianne")** stays Body tier (bold DM Sans, existing weight 600) rather than Headline — it's a link, not a heading, and the guide defines Headline strictly as H1/section-H2-equivalents.
- **Bento card title** (`<h3>`, each project name) is Headline tier, sized down — consistent with how Intelkin's own retiring system already treated card/grid titles as "H2-equivalent."

## Testing

- Visual check at 375px/768px/1440px (existing site convention) on: homepage, one project page using the shared template (a placeholder one, e.g. `windturbine.html`), Intelkin, `feedback.html`, `fun.html`.
- Confirm the terminal card still renders in system monospace, unchanged.
- Confirm no `h1`/heading anywhere accidentally lost its text or line-height (Space Grotesk's metrics differ from the old system stack).
- Confirm Geist Pixel doesn't get applied to anything longer than a short label (visual scan of every Label-tier element).
