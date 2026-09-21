# Portfolio Website — Project Brief

Chat-searchable personal portfolio: a short intro establishes who you are, a two-column curated project grid leads with six projects, and a persistent "Ask Tianne" input — hover-previewed Krea-style — lets a recruiter ask anything, not just the preset examples. Read this file before making changes — it's the source of truth for structure, data flow, and rules.

## 1. Concept
- **Homepage layout, top to bottom:** nav → hero search bar (with faded suggested questions under it while empty) → project grid. The nav has no Ask Tianne pill on the homepage.
- **Identity intro:** a real headline plus a compact, reverse-chronological timeline — year, company, role — sourced from `profile.md`. Side-by-side on desktop, stacked on mobile. Static.
- **Ask Tianne panel (2026-09-21):** a docked, non-modal side panel on the right (a full-screen sheet below 768px). Opens when a question is submitted from the hero bar, typed or a suggested one. The page stays visible and scrollable beside it (from 1024px the page and nav narrow to make room), and it stays open until closed, across page loads too (open state and thread live in sessionStorage). It keeps a thread and has a follow-up input. On every page except Home the nav pill opens the same panel. Streaming: answers appear as they are written.
- **Hero search bar (Home only):** the one input that starts a conversation. In normal flow above the grid, never floating. Under it, three of four suggested questions show faded and clickable, rotating gently while the bar is empty.
- **Project grid:** two-column masonry (image-first cards, no category rail — removed 2026-09-10; full width; no card chrome, one 48px gap both directions — 2026-09-21). Shows a curated set of projects, not the full list — `js/home.js`'s `HOME_ORDER` is the source of truth for which projects show and their reading order; each card goes into whichever column is currently shorter; every other project's data and case-study page stay intact, just off this grid, including from search.
- **Voice:** Tianne answers in first person — "I build..." — as if it's genuinely you. The small persistent "AI answering as Tianne" line in the panel was removed on 2026-09-21 at the owner's request; the assistant says it is an AI whenever asked (eval `persona-is-ai`), and the panel is titled "Tianne LLM".
- **Two hard rules regardless of voice:** never invent a fact that isn't in the data files — say so honestly and point to contact info instead. Never claim real-time availability or scheduling ("yes I'm free Tuesday") — that always redirects to actual contact info, since Tianne has no live calendar access.
- **Hover a card (desktop):** fills the prompt box with the prompt that would surface it — e.g. hovering "Windturbine" shows "Tell me about the CDW wind turbine project."
- **Click a card, any time:** opens its case study directly.
- **Submit a prompt:** the panel opens and answers there; the grid narrows to the matching project ids when there are any (a general question with no matches leaves the grid alone).
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
- **Grid:** two-column masonry: `js/home.js` places each card, in `HOME_ORDER`, into the shorter column (single column below 1024px). One grid component — a query changes what's rendered, never adds a second panel; matches are still constrained to the same curated six.
- **Prompt box:** in-flow, not sticky. Neutral placeholder; hover previews; submit queries; clear resets.
- **Nav pill (every page except Home):** identical position, every scroll depth; opens the Ask Tianne panel.
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
- **How to run (built 2026-09-21):** `node evals/run-evals.js` (needs the key in `.env`; about 35 API calls, under a minute). `--static` runs only the free data checks, `--filter <text>` runs a subset, `--verbose` prints every reply, `--json <file>` saves results. Exit code 1 on any failure. It calls `api/chat.js` directly, checks ids returned, `showAllProjects`, facts the reply must or must not mention, and on every reply: no em dashes, no markdown, no she/her, under the length cap. One extra check confirms streamed text equals the final reply. Cases live in `evals/test-cases.json` (field guide at the top of that file). A case that fails once and passes on a rerun is flaky: fix the prompt or loosen the case.

## 8. Analytics
- Supabase table `chat_logs`: `id`, `created_at`, `message`, `reply`, `relevant_project_ids`, `page_context`. No auth, no personal identifiers — anonymous by default.
- Purpose: see what's actually being asked, and mine real queries for new eval cases and content gaps (a question nobody anticipated is a signal to add both a `tianne-persona.md` answer and a matching eval).

## 9. Confirmed Project Data
- **CDW** — Windturbine, Research Aggregator
- **Recollab** — Langchain Aggregator, Prototyping
- **Projects** (personal, not tied to a company) — Intelkin, Looped, AirBnB
- **Carbon 6** — Contact Support Redesigned with AI
- **Micromart** — Operators on the Go (Golden Ventures case study, 2026): `projects/operators-on-the-go.html`, reusing `css/case-study-boardy.css` + `js/case-study-boardy.js` for the watercolor treatment, plus `css/case-study-operators.css` / `js/case-study-operators.js` for its two embedded prototypes (SMS thread, dashboard). Those prototypes deliberately use the `--color-app-*` green tokens in `tokens.css`, not the site accent. Added to the homepage grid's right column on 2026-09-21; AirBnB was taken off the grid the same day (its data and page stay). The grid now shows seven, not six. No thumbnail yet — the card shows the COMING SOON placeholder.
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
Typeface (confirmed 2026-09-10): Space Grotesk (headlines) / DM Sans (body/values) / Geist Pixel (micro-labels) — see `css/tokens.css`'s `--font-headline`/`--font-body`/`--font-label` and `docs/superpowers/specs/2026-09-10-typography-system-design.md`. This stays the confirmed site-wide default. As of 2026-09-11, the homepage and every case-study page (including Intelkin, whose old Instrument Serif exception was fully retired on 2026-09-10 — it doesn't get skipped, it gets this like every other case study) additionally load `css/typography-v2.css`, a page-scoped alternate system (Newsreader at weight 600 / Public Sans / IBM Plex Mono, `--font-headline-serif`/`--font-headline-serif-weight`/`--font-body-sans`/`--font-label-mono` in tokens.css; the headline serif was Instrument Serif until 2026-09-20, when Newsreader replaced it across the whole system with one token change) — Resume/Feedback/Fun and the shared nav are explicitly not in scope and stay on the default above.
Accent (confirmed 2026-09-10): Oxblood `#92140C` — see `css/tokens.css`'s `--color-accent`. In use as of the CDW case study (`research-aggregator.html`): the workflow-compare before/after arrow and the "New Workflow" caption. Reserved for tiny moments only — never a card background or large surface.
Background (still pending): working direction is a dark, desaturated navy or graphite background. Keep neutral/grayscale until fully confirmed.

## 13. Quality Floor
- Responsive down to mobile everywhere, including the intro, grid, prompt box.
- Full keyboard operability throughout, including Tianne.
- Grid re-render after a query: announce result count via ARIA live region.
- AI disclosure: the always-visible line was removed from the panel on 2026-09-21 at the owner's request (§1). The assistant must still say it is an AI when asked.
- Timeline stays legible stacked on mobile. `prefers-reduced-motion` respected. WCAG AA once tokens are set. Meaningful `alt` text. Semantic HTML throughout.

## 14. Rules for Claude Code
- **Never** put API keys (Anthropic or Supabase) in any client-side file — only in `api/chat.js`, via environment variables.
- Tianne speaks first person per `tianne-persona.md`, but never fabricates a fact absent from the data, and never claims real-time availability.
- Log every `/api/chat` exchange to Supabase, non-blocking — don't delay the response on it.
- Run `evals/run-evals.js` after any change to project data, profile data, or the system prompt.
- One grid component, two states. The conversation lives in the side panel, never in a separate results panel on the page.
- No scroll-linked positioning for the hero bar (it never floats). The side panel is what stays open while scrolling.
- Don't duplicate nav/pill markup across pages — lives once in `shared-ui.js`.
- No vector DB/embeddings, no framework rebuild, no new dependency beyond §2, without asking first.
- No color/font values outside `tokens.css` once §12 is confirmed. Always use the named breakpoints in §11.
- One change at a time. Flat CSS specificity. Check 375px/768px/1440px after layout changes.

## 15. Open / TBD
- Visual direction — background shade and which accent still need final confirmation
- Intro headline copy, and the persona/FAQ answers in §10
- Supabase project setup (URL + key) not yet created
