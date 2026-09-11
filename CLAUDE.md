# Portfolio Website — Project Brief

Chat-searchable personal portfolio: a short intro establishes who you are, a two-column curated project grid leads with six projects, and a persistent "Ask Tianne" input — hover-previewed Krea-style — lets a recruiter ask anything, not just the preset examples. Read this file before making changes — it's the source of truth for structure, data flow, and rules.

## 1. Concept
- **Homepage layout, top to bottom:** nav (with the persistent Ask Tianne pill) → intro (headline + timeline) → prompt box → project grid.
- **Identity intro:** a real headline plus a compact, reverse-chronological timeline — year, company, role — sourced from `profile.md`. Side-by-side on desktop, stacked on mobile. Static.
- **Ask Tianne, nav pill:** lives permanently in the nav, top-right, on every page — no scroll-linked positioning. Backup access on Home once past the main prompt box; primary access everywhere else.
- **Main prompt box (Home only):** sits in normal document flow between the intro and the grid — no sticky/floating behavior needed.
- **Project grid:** two explicit columns (image-first cards, no category rail — removed 2026-09-10; full width). Shows a curated six projects, not the full list — `js/home.js`'s `HOME_COLUMNS` is the source of truth for which projects and which column each sits in (2026-09-11); every other project's data and case-study page stay intact, just off this grid, including from search.
- **Voice:** Tianne answers in first person — "I build..." — as if it's genuinely you. Paired with a small, persistent disclosure near the pill/prompt box (not a banner, just enough that nobody mistakes it for texting you live) since it's an AI, not a live conversation.
- **Two hard rules regardless of voice:** never invent a fact that isn't in the data files — say so honestly and point to contact info instead. Never claim real-time availability or scheduling ("yes I'm free Tuesday") — that always redirects to actual contact info, since Tianne has no live calendar access.
- **Hover a card (desktop):** fills the prompt box with the prompt that would surface it — e.g. hovering "Windturbine" shows "Tell me about the CDW wind turbine project."
- **Click a card, any time:** opens its case study directly.
- **Submit a prompt:** Tianne returns matching project ids, grid re-renders to just those — same component, no separate results panel.
- **While a query is active:** grid re-renders to just the matches. Clear the box → grid reverts to the full list.
- **Default to submit-triggered filtering, not live-as-you-type.**
- **Owner/role/tagline:** resolved by the intro headline — a real personal statement, not a plain name/title line. `[FILL IN copy]`

## 2. Tech Stack
- **Frontend:** plain HTML/CSS/JS, no framework, no build step.
- **Backend:** one serverless function, `/api/chat`, calling the Claude API server-side.
- **Supabase:** one table, purely for logging queries/replies for later review (§8). Not part of retrieval.
- **No vector DB/embeddings for matching** — stuff `data/projects.json` + `data/profile.md` + `data/tianne-persona.md` into the system prompt. Revisit only if the project list grows much larger.
- **Host:** Vercel or Netlify.
- **Shared UI across pages:** nav + Ask Tianne pill live once in `js/shared-ui.js`.

## 3. Site Map
- `Home` — intro + prompt box + project grid (see §5)
- `Feedback`, `Fun`, `Projects/*` — as before
- `Resume` — not a page; the nav tab links directly to the résumé PDF hosted on Google Drive, opened in a new tab
- `Tianne LLM` — not a page; the nav pill on every page, doubling as the homepage's main prompt box

## 4. File Structure
```
portfolio/
├── index.html
├── feedback.html / fun.html                # no resume.html — the nav tab links out to Drive
├── projects/*.html                     # one per §9
├── css/  (reset, tokens, layout, components)
├── js/
│   ├── shared-ui.js                      # nav + Ask Tianne pill
│   ├── home.js                            # intro, grid, hover-preview, filter re-render
│   └── chat.js                              # calls /api/chat, shared by box and pill panel
├── api/
│   └── chat.js                                # serverless function: LLM call + Supabase log
├── data/
│   ├── projects.json                           # tagged project data, see §9
│   ├── profile.md                               # bio, timeline entries, fun facts, testimonials
│   └── tianne-persona.md                         # voice rules + pre-written anchor answers
├── evals/
│   ├── test-cases.json
│   └── run-evals.js
├── assets/ (images, video)
└── CLAUDE.md
```

## 5. Interaction Detail
- **Intro:** headline + timeline, static, from `profile.md`. Side-by-side desktop, stacked mobile.
- **Grid:** two explicit columns, each project's column + position fixed by `js/home.js`'s `HOME_COLUMNS` (not auto-distributed by height). One grid component — a query changes what's rendered, never adds a second panel; matches are still constrained to the same curated six.
- **Prompt box:** in-flow, not sticky. Neutral placeholder; hover previews; submit queries; clear resets.
- **Nav pill:** identical position on every page, every scroll depth.
- **Query round-trip:** submit → `/api/chat` → `{ reply, relevantProjectIds }` → grid updates. Clear → reverts.
- **Mobile (no hover), as built:** tap once previews the prompt, tap again opens the case study.

## 6. How Tianne LLM Works
1. Visitor submits a prompt (homepage box, or nav pill panel elsewhere).
2. Frontend sends `{ message, history, pageContext }` to `/api/chat`.
3. Function assembles the system prompt from `projects.json` + `profile.md` + `tianne-persona.md` (voice + the two hard rules in §1), calls the Claude API for structured output: `{ reply: string, relevantProjectIds: string[] }`.
4. Function fires a non-blocking insert into Supabase (§8) — doesn't delay the response.
5. Homepage: grid re-renders to `relevantProjectIds`. Other pages: panel renders `reply`.
6. From a case-study page, the panel scopes answers to that project.

## 7. Evals
- `evals/test-cases.json`: `{ query, expected_project_ids }` pairs, written against the tag schema in §9 — e.g. a query about "agentic systems" should resolve to every project tagged with that domain.
- `evals/run-evals.js`: calls the chat logic directly for each case (not over HTTP), checks returned ids against expected, prints a pass/fail summary.
- Persona questions ("tell me about yourself") get lighter-touch checks — does the reply contain the must-mention facts — not exact matching; full LLM-graded evals are a later upgrade if this stops being enough.
- Run this before considering any change to `projects.json`, `profile.md`, `tianne-persona.md`, or the system prompt done.

## 8. Analytics
- Supabase table `chat_logs`: `id`, `created_at`, `message`, `reply`, `relevant_project_ids`, `page_context`. No auth, no personal identifiers — anonymous by default.
- Purpose: see what's actually being asked, and mine real queries for new eval cases and content gaps (a question nobody anticipated is a signal to add both a `tianne-persona.md` answer and a matching eval).

## 9. Confirmed Project Data
- **CDW** — Windturbine, Research Aggregator
- **Recollab** — Langchain Aggregator, Prototyping
- **Projects** (personal, not tied to a company) — Intelkin, Looped, AirBnB
- **Carbon 6** — Contact Support Redesigned with AI
- **Contract** (paid contract work, not a full-time employer) — River AI, an external product with its own site — the card links straight out (`links.external`) instead of to an in-site case study, and its thumbnail is a video (`thumbnailType: "video"`, source under `assets/video/`) rather than an image/gif.

Each `projects.json` entry: `id`, title, category, one-line summary, a `tagline` (short, for the homepage card), `status`/`year` (both `[NEEDS CONTENT]` until confirmed — not one project has a real one yet), an optional `attribution` (a single pre-composed string, e.g. "Recollab AI / Contract 2026" — overrides the default name/status/year template on the homepage card when present), a "how I think about it" narrative, links, images, and structured tags. `size` still exists on every entry but nothing reads it — kept in the data in case it's meaningful again later. Only six entries currently render on the homepage at all (`js/home.js`'s `HOME_COLUMNS`, 2026-09-11) — every entry stays in this file and its case-study page stays reachable regardless.
```json
"tags": {
  "domain": ["LLM", "agentic systems"],
  "skills": ["LangChain", "prompt engineering"],
  "employment": "contract"
}
```
`links` is normally `{ "caseStudy": "/projects/<id>.html" }`; a project with no in-site case study (an external product) uses `{ "external": "<url>" }` instead — `js/home.js` opens that in a new tab rather than navigating away from the grid. `thumbnail` is usually a gif/image; `thumbnailType: "video"` switches the card to a looping, muted, autoplaying `<video>`, and `thumbnailPoster` is required in that case (shown instead, unplayed, under `prefers-reduced-motion`).

## 10. Dedicated Page Content Needed
- [ ] **Résumé** — plain-text, structured as year/company/role, for `profile.md` (feeds the homepage timeline and Tianne's persona answers). The PDF itself lives externally on Google Drive, linked directly from the nav — no on-site copy to keep in sync.
- [ ] **Feedback**, **Fun**, **Intro headline** — as before
- [ ] **Persona answers**, first person — tell me about yourself, how I work, what I'm looking for, availability. Becomes the seed content for `tianne-persona.md`.
- [ ] Contact method

## 11. Responsive Strategy
Mobile-first, named breakpoints only:
```css
--bp-sm: 480px; --bp-md: 768px; --bp-lg: 1024px; --bp-xl: 1280px;
```
- Project grid: two explicit columns desktop, both stack to one column mobile (`--bp-sm`). Intro: side-by-side desktop, stacked mobile. Prompt box and nav pill: in-flow / fixed-nav at every size, nothing to reposition.
- Fluid type via `clamp()`. Images `max-width:100%; height:auto`. No fixed-px containers. Touch targets ≥44px.
- Test at 375px, 768px, 1440px, and one ultra-wide check.

## 12. Design Tokens — STATUS: typeface + accent confirmed, background pending
Typeface (confirmed 2026-09-10): Space Grotesk (headlines) / DM Sans (body/values) / Geist Pixel (micro-labels) — see `css/tokens.css`'s `--font-headline`/`--font-body`/`--font-label` and `docs/superpowers/specs/2026-09-10-typography-system-design.md`.
Accent (confirmed 2026-09-10): Oxblood `#92140C` — see `css/tokens.css`'s `--color-accent`. Not currently rendered anywhere (its one usage, the homepage grid's case-study pill, was removed the same day per a design change) — the color choice stands, awaiting its next real use. Reserved for tiny moments only — never a card background or large surface.
Background (still pending): working direction is a dark, desaturated navy or graphite background. Keep neutral/grayscale until fully confirmed.

## 13. Quality Floor
- Responsive down to mobile everywhere, including the intro, grid, prompt box.
- Full keyboard operability throughout, including Tianne.
- Grid re-render after a query: announce result count via ARIA live region.
- A small, persistent AI-disclosure near the pill/prompt box (§1) — legible, not an afterthought.
- Timeline stays legible stacked on mobile. `prefers-reduced-motion` respected. WCAG AA once tokens are set. Meaningful `alt` text. Semantic HTML throughout.

## 14. Rules for Claude Code
- **Never** put API keys (Anthropic or Supabase) in any client-side file — only in `api/chat.js`, via environment variables.
- Tianne speaks first person per `tianne-persona.md`, but never fabricates a fact absent from the data, and never claims real-time availability.
- Log every `/api/chat` exchange to Supabase, non-blocking — don't delay the response on it.
- Run `evals/run-evals.js` after any change to project data, profile data, or the system prompt.
- One grid component, two states — no separate results panel.
- No scroll-linked positioning for the prompt box — the nav pill is what stays reachable.
- Don't duplicate nav/pill markup across pages — lives once in `shared-ui.js`.
- No vector DB/embeddings, no framework rebuild, no new dependency beyond §2, without asking first.
- No color/font values outside `tokens.css` once §12 is confirmed. Always use the named breakpoints in §11.
- One change at a time. Flat CSS specificity. Check 375px/768px/1440px after layout changes.

## 15. Open / TBD
- Visual direction — background shade and which accent still need final confirmation
- Intro headline copy, and the persona/FAQ answers in §10
- Supabase project setup (URL + key) not yet created
