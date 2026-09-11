# Site-Wide Typography — Switch Case Studies + Landing Page to Instrument Serif / Public Sans / IBM Plex Mono

Paste into Claude Code in the portfolio site repo. This replaces the current type system (Space Grotesk / DM Sans / Geist Pixel) with a new one on the homepage and every case study page. Note: Intelkin already runs this exact trio as a one-off exception — after this change it's no longer an exception, it's just the standard, so no changes should be needed on Intelkin itself.

## The type system

| Role | Font | Weight(s) | Used for |
|---|---|---|---|
| Display / headline | Instrument Serif | 400 (only weight it ships — no bold; italic available) | Page hero titles, section headlines (the big serif line under each eyebrow label, e.g. "Memory as the core of OpenAI's device ecosystem."), homepage project-card titles ("The future of AI & hardware") |
| Body | Public Sans | 400 body copy, 500/600 for sub-heading trios and emphasis (e.g. "Independence", "Ecosystem lock-in") | Paragraph text, card descriptions, nav links, metadata header values |
| Eyebrow / micro-label | IBM Plex Mono | 500, uppercase, ~0.06–0.08em letter-spacing | Section eyebrows ("OVERVIEW", "SOLUTION", "OPPORTUNITY", "PROBLEM"), homepage project meta line ("OPENAI X HARDWARE • CONCEPT 2025"), the ROLE/TIMELINE/TEAM/SKILLS metadata-header labels |

Fallback stacks:
- `'Instrument Serif', Georgia, 'Times New Roman', serif`
- `'Public Sans', -apple-system, 'Segoe UI', sans-serif`
- `'IBM Plex Mono', ui-monospace, 'SFMono-Regular', monospace`

Google Fonts import (add whichever weights aren't already there):
```
https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Public+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@500&display=swap
```

## Where to apply it

- **Landing page**: hero/name treatment if serif fits it, all project-card titles, and the mono meta line under each card (category • year/status).
- **Every case study page**: section eyebrow labels, section headlines, body paragraphs, sub-heading trios, and the ROLE/TIMELINE/TEAM/SKILLS metadata header (the one from the earlier 4-column prompt — keep that layout, just carry the new fonts into it).
- **Intelkin**: already matches this system, so it should need no changes — use it as the reference for exact weights/sizes if anything else needs tuning to match.

Since Instrument Serif renders differently than Space Grotesk at the same pixel size (no bold, different x-height), adjust font sizes as needed so headline hierarchy still reads correctly rather than keeping the old px values unchanged — use Intelkin's existing sizes as the reference point.

## The nav

The top nav (logo, Home/Resume/Feedback/Fun, Ask Tianne) is shared across every page, including ones out of scope here (Resume, Feedback, Fun, Ask Tianne). Decide whether the nav switches to the new fonts too (so it looks consistent everywhere) or keeps the current system (so it doesn't look mismatched against the not-yet-updated pages) — flag which you picked and why in your report rather than guessing silently.

## Don't

- Don't touch the Resume, Feedback, Fun, or Ask Tianne pages — this is landing page + case studies only, unless the nav decision above requires a shared-component change.
- Don't change any copy, spacing, or layout — this is a font swap only. Leave the sticky nav, sidebar, metadata header layout, and paragraph spacing from the earlier prompts as they are.
- Don't leave Geist Pixel or the old Space Grotesk/DM Sans declarations as dead CSS on the pages this touches.

## After

Report:
- Confirm Intelkin needed no changes (already matches).
- Which nav decision you made and why.
- Before/after screenshot of the homepage grid and one case study section.
- Any font sizes you adjusted to preserve hierarchy, before → after.
