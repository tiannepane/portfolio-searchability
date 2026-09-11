# Case Study Sidebar Nav + Spacing Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a sticky, scroll-spy left sidebar of section links to the shared case-study template — built dynamically from each page's own section headings, never hardcoded — and open up vertical spacing on the case-study template and the homepage grid.

**Architecture:** A new shared script (`js/case-study-nav.js`) discovers each case-study page's own `.case-study-section h2` headings at runtime, slugifies them into anchor ids, and injects a link list into an empty hook div — mirroring `js/shared-ui.js`'s existing empty-hook-populated-at-runtime pattern. CSS turns that hook into a sticky flex sidebar at `--bp-md` (768px) and up, or a native `<details>` accordion below it. The spacing pass is a set of existing-token substitutions in `css/layout.css`/`css/components.css`, independent of the sidebar work.

**Tech Stack:** Plain JS (`IntersectionObserver`, no library), plain CSS. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-09-11-case-study-sidenav-spacing-design.md`

## Global Constraints

- No copy changes anywhere on any page.
- The Intelkin terminal-card component (`.terminal-card`) — untouched, pixel-identical before/after.
- No font changes anywhere — the sidebar uses `var(--font-body)` (already-existing token), the spacing pass touches only spacing properties.
- No new spacing-scale tokens — only which existing `--space-*` token a rule references changes.
- Reuse `--bp-md` (768px) for the sidebar's mobile/desktop split — the same breakpoint the Intelkin `.case-study-columns` already uses, per the spec.
- This site has no automated test suite — every task's "test" steps are concrete browser-tool verification (computed styles, live screenshots, a responsive check), not a unit-test framework.

---

### Task 1: Sidebar script + CSS + wire-up on one page (proof of concept)

Builds the whole feature end-to-end on `projects/langchain-aggregator.html` (5 sections) first, so it can be fully verified working before repeating the markup change across 7 more files.

**Files:**
- Create: `js/case-study-nav.js`
- Modify: `css/layout.css` (new rules, appended near the existing `.case-study-*` block)
- Modify: `projects/langchain-aggregator.html`

**Interfaces:**
- Produces: `#case-study-sidenav` as the hook id every later task's markup change depends on; `.case-study-page`/`.case-study-sidenav`/`.is-active` as the CSS class names Task 2's rollout must match exactly.

- [ ] **Step 1: Create `js/case-study-nav.js`**

```javascript
/*
  js/case-study-nav.js — sticky, scroll-spy sidebar of section links for
  case-study pages. Discovers each page's own .case-study-section h2
  headings at runtime and builds the link list from them — nothing here
  is hardcoded per case study (docs/superpowers/specs/2026-09-11-case-study-sidenav-spacing-design.md).

  Only case-study pages load this script. Mirrors js/shared-ui.js's own
  pattern: an empty hook element (#case-study-sidenav) populated here.
*/

(function () {
  function slugify(text) {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  // Finds every section heading, assigns each section a stable id (used
  // as the anchor target — the section itself, not the bare heading, so
  // a sticky layout never clips heading text on jump), and returns
  // [{ id, label }] in document order.
  function buildSections() {
    const headings = document.querySelectorAll('.case-study-section h2');
    const sections = [];
    const usedIds = new Set();

    headings.forEach((heading) => {
      const section = heading.closest('.case-study-section');
      if (!section) return;

      let id = section.id;
      if (!id) {
        const base = slugify(heading.textContent);
        id = base;
        let n = 2;
        while (usedIds.has(id) || document.getElementById(id)) {
          id = `${base}-${n}`;
          n += 1;
        }
        section.id = id;
      }
      usedIds.add(id);
      sections.push({ id, label: heading.textContent });
    });

    return sections;
  }

  function buildLinkList(sections) {
    const ul = document.createElement('ul');
    sections.forEach(({ id, label }) => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = `#${id}`;
      a.textContent = label;
      a.dataset.sectionLink = id;
      li.append(a);
      ul.append(li);
    });
    return ul;
  }

  function initSidenav() {
    const hook = document.getElementById('case-study-sidenav');
    if (!hook) return;

    const sections = buildSections();
    if (!sections.length) return;

    hook.setAttribute('role', 'navigation');
    hook.setAttribute('aria-label', 'Section navigation');

    const isDesktop = window.matchMedia('(min-width: 768px)').matches;
    const linkList = buildLinkList(sections);

    if (isDesktop) {
      hook.append(linkList);
    } else {
      const details = document.createElement('details');
      const summary = document.createElement('summary');
      summary.textContent = 'Jump to section';
      details.append(summary, linkList);
      hook.append(details);
    }

    const links = hook.querySelectorAll('a[data-section-link]');
    const linksById = {};
    links.forEach((link) => {
      linksById[link.dataset.sectionLink] = link;
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const link = linksById[entry.target.id];
          if (!link) return;
          link.classList.toggle('is-active', entry.isIntersecting);
        });
      },
      { rootMargin: '-10% 0px -80% 0px', threshold: 0 }
    );

    sections.forEach(({ id }) => {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    });
  }

  document.addEventListener('DOMContentLoaded', initSidenav);
})();
```

- [ ] **Step 2: Verify syntax**

Run: `node --check js/case-study-nav.js`
Expected: no output.

- [ ] **Step 3: Add the sidebar CSS to `css/layout.css`**

Find (exact text, the `.case-study` rule):
```css
/* --- Case-study page shell (projects/*) --- */
.case-study {
  padding: var(--space-6) var(--space-4);
  max-width: 720px;
  margin-inline: auto;
}
```
replace with:
```css
/* --- Case-study page shell (projects/*) --- */
.case-study {
  padding: var(--space-6) var(--space-4);
  max-width: 720px;
  margin-inline: auto;
}

/* --- Case-study sidebar nav — sticky, scroll-spy list of section
   links, built at runtime by js/case-study-nav.js from that page's own
   headings (docs/superpowers/specs/2026-09-11-case-study-sidenav-spacing-design.md).
   Below --bp-md (768px, same breakpoint the Intelkin column layout
   already uses) the script builds a <details> accordion instead of a
   bare list — this styles both shapes. --- */
.case-study-page {
  display: block;
  margin-bottom: var(--space-6);
}

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
   (mobile) or the bare hook div (desktop, below) — only the container
   layout differs by breakpoint, not the active/muted color treatment. */
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

  .case-study-sidenav > ul {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .case-study {
    flex: 1;
    margin-inline: 0;
    padding-inline: 0;
  }
}
```

- [ ] **Step 4: Wire up `projects/langchain-aggregator.html`**

Find (exact text, current lines 19-20):
```html
  <div id="shared-nav"></div>
  <main class="case-study" data-project-id="langchain-aggregator">
```
replace with:
```html
  <div id="shared-nav"></div>
  <div class="case-study-page">
    <div id="case-study-sidenav" class="case-study-sidenav"></div>
    <main class="case-study" data-project-id="langchain-aggregator">
```

Find (exact text, the closing tag — there is exactly one `</main>` in this file):
```html
  </main>
  <script src="/js/shared-ui.js" defer></script>
  <script src="/js/chat.js" defer></script>
```
replace with:
```html
  </main>
  </div>
  <script src="/js/shared-ui.js" defer></script>
  <script src="/js/chat.js" defer></script>
  <script src="/js/case-study-nav.js" defer></script>
```

- [ ] **Step 5: Verify on the live page**

Using the browser tool against `http://localhost:3000/projects/langchain-aggregator.html` (1280px width):
```js
({
  sidebarLinks: Array.from(document.querySelectorAll('#case-study-sidenav a')).map(a => a.textContent),
  sectionIds: Array.from(document.querySelectorAll('.case-study-section')).map(s => s.id),
  sidebarDisplay: getComputedStyle(document.querySelector('.case-study-page')).display,
  sidenavPosition: getComputedStyle(document.querySelector('.case-study-sidenav')).position,
})
```
Expected: `sidebarLinks` is `["Overview", "Outcomes", "The Journey", "Wins", "Reflection"]` (5 items, matching this page's actual `<h2>`s); `sectionIds` is 5 non-empty, unique slugs; `sidebarDisplay` is `"flex"`; `sidenavPosition` is `"sticky"`.

Scroll the page and re-check `document.querySelector('#case-study-sidenav a.is-active')?.textContent` at a few scroll positions — confirm it changes as different sections come into view, and exactly one link is active at a time (`document.querySelectorAll('#case-study-sidenav a.is-active').length === 1`).

- [ ] **Step 6: Verify mobile collapse**

Using a same-origin iframe at 375px width pointed at the same URL (this environment's window resize doesn't reliably change the viewport — use the iframe technique):
```js
const iframe = document.createElement('iframe');
iframe.style.cssText = 'position:fixed;top:0;left:0;width:375px;height:1200px;z-index:99999;border:2px solid red;background:white;';
iframe.src = '/projects/langchain-aggregator.html';
document.body.appendChild(iframe);
await new Promise(res => iframe.onload = res);
await new Promise(res => setTimeout(res, 400));
const doc = iframe.contentDocument;
({
  hasDetails: !!doc.querySelector('#case-study-sidenav details'),
  isOpenByDefault: doc.querySelector('#case-study-sidenav details')?.open,
  summaryText: doc.querySelector('#case-study-sidenav summary')?.textContent,
  linkCount: doc.querySelectorAll('#case-study-sidenav a').length,
})
```
Expected: `hasDetails: true`, `isOpenByDefault: false` (collapsed by default — `<details>` without an `open` attribute), `summaryText: "Jump to section"`, `linkCount: 5`. Remove the iframe when done (`iframe.remove()`).

- [ ] **Step 7: Commit**

```bash
git add js/case-study-nav.js css/layout.css projects/langchain-aggregator.html
git commit -m "Case study sidebar nav: script + CSS + proof-of-concept on one page

New js/case-study-nav.js discovers a page's own section headings at
runtime and builds a sticky, scroll-spy sidebar from them — nothing
hardcoded per case study. Below 768px it builds a <details> accordion
instead. Wired up on langchain-aggregator.html first to verify the
whole feature end-to-end before rolling the markup change out further."
```

---

### Task 2: Roll the markup change out to the remaining 7 case-study pages

**Files:**
- Modify: `projects/airbnb.html`
- Modify: `projects/contact-support-ai.html`
- Modify: `projects/intelkin.html`
- Modify: `projects/looped.html`
- Modify: `projects/prototyping.html`
- Modify: `projects/research-aggregator.html`
- Modify: `projects/windturbine.html`

**Interfaces:**
- Consumes: `#case-study-sidenav`, `.case-study-page`, `js/case-study-nav.js` from Task 1 — applies the identical transformation Task 1 already proved works, to 7 more files.

- [ ] **Step 1: Apply the identical transformation to all 7 files**

Every one of these files has the exact same two anchor points Task 1 already handled on `langchain-aggregator.html`, differing only in the `data-project-id` value (and `intelkin.html` alone has one extra script tag after the other two). For **each** file below, make both edits:

**Edit A** — find `<div id="shared-nav"></div>` immediately followed by `<main class="case-study" data-project-id="ID">` (where `ID` is that file's own value from the table below) and insert the sidebar wrapper exactly as in Task 1:
```html
  <div id="shared-nav"></div>
  <div class="case-study-page">
    <div id="case-study-sidenav" class="case-study-sidenav"></div>
    <main class="case-study" data-project-id="ID">
```

**Edit B** — find that file's `</main>` line followed by its `<script src="/js/shared-ui.js" defer></script>` and `<script src="/js/chat.js" defer></script>` lines, and insert the closing `</div>` plus the new script tag exactly as in Task 1:
```html
  </main>
  </div>
  <script src="/js/shared-ui.js" defer></script>
  <script src="/js/chat.js" defer></script>
  <script src="/js/case-study-nav.js" defer></script>
```
(`projects/intelkin.html` has a third script tag, `<script src="/js/intelkin-terminal.js" defer></script>`, right after the `chat.js` line — leave it exactly where it is, after the new `case-study-nav.js` line, unchanged.)

The `ID` value for each file:

| File | `data-project-id` value |
|---|---|
| `projects/airbnb.html` | `airbnb` |
| `projects/contact-support-ai.html` | `contact-support-ai` |
| `projects/intelkin.html` | `intelkin` |
| `projects/looped.html` | `looped` |
| `projects/prototyping.html` | `prototyping` |
| `projects/research-aggregator.html` | `research-aggregator` |
| `projects/windturbine.html` | `windturbine` |

- [ ] **Step 2: Verify markup landed correctly on all 8 case-study pages (the 7 here + Task 1's)**

Run:
```bash
for f in projects/*.html; do
  grep -q 'id="case-study-sidenav"' "$f" && grep -q 'case-study-nav.js' "$f" && echo "OK: $f" || echo "MISSING: $f"
done
```
Expected: `OK: <file>` for all 8 files listed, no `MISSING` lines.

- [ ] **Step 3: Verify Intelkin specifically — 11 sections, the largest page**

Using the browser tool against `http://localhost:3000/projects/intelkin.html`:
```js
({
  sidebarLinks: Array.from(document.querySelectorAll('#case-study-sidenav a')).map(a => a.textContent),
  sectionIds: Array.from(document.querySelectorAll('.case-study-section')).map(s => s.id),
})
```
Expected: `sidebarLinks` has exactly 11 items — `["Overview", "The Problem", "Market Research", "Research: Dogfooding on Recollab", "Key Friction Points Found", "The Solution", "How It Works", "Trade-offs", "Where It Is Now", "Reflection", "Get in Touch"]`; `sectionIds` has 11 unique, non-empty values.

Confirm the terminal card is unaffected — `getComputedStyle(document.querySelector('.terminal-card')).fontFamily` should still be the system monospace stack (`ui-monospace, "SF Mono", Menlo, Consolas, monospace`), unchanged by this task.

- [ ] **Step 4: Commit**

```bash
git add projects/airbnb.html projects/contact-support-ai.html projects/intelkin.html projects/looped.html projects/prototyping.html projects/research-aggregator.html projects/windturbine.html
git commit -m "Case study sidebar nav: roll out to the remaining 7 pages

Identical markup transformation Task 1 already proved on
langchain-aggregator.html. Verified Intelkin specifically (11 sections,
this site's largest case study) renders all 11 links correctly and its
terminal card is unaffected."
```

---

### Task 3: Spacing pass

**Files:**
- Modify: `css/layout.css`
- Modify: `css/components.css`

- [ ] **Step 1: Case-study template spacing — `css/layout.css`**

Find (exact text):
```css
.case-study-section {
  margin-bottom: var(--space-6);
}

.case-study-section h2 {
  margin-bottom: var(--space-3);
  font-size: clamp(2.25rem, 1.5rem + 4vw, 3.25rem);
  line-height: 1.05;
  font-family: var(--font-headline);
  font-weight: 700;
}
```
replace with:
```css
.case-study-section {
  margin-bottom: var(--space-7);
}

.case-study-section h2 {
  margin-bottom: var(--space-4);
  font-size: clamp(2.25rem, 1.5rem + 4vw, 3.25rem);
  line-height: 1.05;
  font-family: var(--font-headline);
  font-weight: 700;
}
```

Find (exact text):
```css
.case-study-hero {
  margin-bottom: var(--space-5);
```
replace with:
```css
.case-study-hero {
  margin-bottom: var(--space-6);
```

Find (exact text):
```css
.case-study-meta {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-3);
  margin-bottom: var(--space-6);
  padding: var(--space-4);
```
replace with:
```css
.case-study-meta {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-3);
  margin-bottom: var(--space-7);
  padding: var(--space-4);
```

- [ ] **Step 2: Homepage grid spacing — `css/components.css`**

Find (exact text):
```css
.bento-grid-column {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  flex: 1;
  min-width: 0;
}
```
replace with:
```css
.bento-grid-column {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  flex: 1;
  min-width: 0;
}
```

Find (exact text):
```css
.bento-card-caption {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: baseline;
  gap: var(--space-2);
  padding-top: var(--space-2);
}
```
replace with:
```css
.bento-card-caption {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: baseline;
  gap: var(--space-2);
  padding-top: var(--space-3);
}
```

- [ ] **Step 3: Verify the six substitutions landed and nothing else in these files changed**

Run:
```bash
git diff --stat css/layout.css css/components.css
```
Expected: 2 files changed, a small number of insertions/deletions (roughly 6 lines changed each direction) — not a large diff. If either file shows more than a handful of changed lines, something matched an unintended second location; stop and check.

- [ ] **Step 4: Visual check — before/after feel**

Using the browser tool, screenshot `http://localhost:3000/projects/langchain-aggregator.html` and `http://localhost:3000/index.html` at 1280px width. Confirm by eye: noticeably more air between the hero image, the metadata row, and the first section heading on the case-study page; noticeably more gap between rows of cards and between each card's thumbnail and its caption on the homepage. This is a subjective check — the goal is "opened up, not spot-fixed," not an exact pixel target (none was given).

- [ ] **Step 5: Commit**

```bash
git add css/layout.css css/components.css
git commit -m "Spacing pass: case-study template + homepage grid

Existing --space-* tokens only, no new scale values. Each rule moved
to a token roughly one tier up, applied consistently rather than
spot-fixing one section:
  .case-study-section margin-bottom: --space-6 -> --space-7
  .case-study-section h2 margin-bottom: --space-3 -> --space-4
  .case-study-hero margin-bottom: --space-5 -> --space-6
  .case-study-meta margin-bottom: --space-6 -> --space-7
  .bento-grid-column gap: --space-4 -> --space-6
  .bento-card-caption padding-top: --space-2 -> --space-3"
```

---

### Task 4: Cross-page, responsive, and Intelkin-integrity verification

No code changes — this task exists so the full combined result actually gets looked at across pages and breakpoints, not just the two individual pages Tasks 1-2 already checked in isolation.

**Files:** none modified.

- [ ] **Step 1: Confirm the sidebar on a third distinct page, at desktop width**

Using the browser tool against `http://localhost:3000/projects/windturbine.html` (a placeholder-content page — confirms the sidebar works even on a page with lorem/placeholder sections, not just the two fully-built case studies):
```js
({
  sidebarLinks: Array.from(document.querySelectorAll('#case-study-sidenav a')).map(a => a.textContent),
  display: getComputedStyle(document.querySelector('.case-study-page')).display,
})
```
Expected: `sidebarLinks` matches that page's actual `<h2>` headings (whatever the generic template currently has — e.g. "Overview", "My Role", "Approach", "Outcome"), `display: "flex"`.

- [ ] **Step 2: Screenshot Intelkin and langchain-aggregator at 375px, 768px, 1024px, 1440px**

For each of the two URLs, resize/screenshot (or use the iframe technique for the narrow width) at each of the four widths (matching the site's own standard test-width convention, CLAUDE.md §11). Confirm:
- 375px: sidebar is the collapsed `<details>` accordion, above the content, not beside it.
- 768px: sidebar sits beside the content as a sticky column (this is the breakpoint's exact edge — confirm it doesn't overlap or wrap awkwardly at exactly 768px).
- 1024px: same flex layout, no regression between the two known-good widths.
- 1440px: same flex layout, content column not exceeding its 720px cap, sidebar still sticky.

- [ ] **Step 3: Confirm the Intelkin terminal card is unaffected end-to-end**

Using the browser tool against `http://localhost:3000/projects/intelkin.html`, scroll to the terminal card and screenshot it. Confirm visually it's unchanged from before this plan (dark background, traffic-light dots, monospace font, green glow animation) — this plan's spacing/sidebar changes must not have touched anything inside `.terminal-card`.

- [ ] **Step 4: Confirm no copy changed anywhere**

Find this plan's own commits and check what they actually touched in `projects/`:
```bash
git log --oneline --grep="Case study sidebar nav" --grep="Spacing pass" --all-match -n 20
```
Then, for the commit(s) matching "Case study sidebar nav: roll out to the remaining 7 pages" and "...proof-of-concept on one page", run `git show --stat <that-commit-sha>` and `git show <that-commit-sha> -- projects/` — read the actual diff. Confirm every changed line in every `projects/*.html` file is one of: the `<div class="case-study-page">` line, the `<div id="case-study-sidenav" class="case-study-sidenav"></div>` line, the closing `</div>` line, or the `<script src="/js/case-study-nav.js" defer></script>` line. No heading text, paragraph text, or any other existing line should appear as changed.

- [ ] **Step 5: Write the verification report**

Write a short report to `/Users/tianne/searchability/.superpowers/sdd/2026-09-11-case-study-sidenav-spacing/task-4-report.md` (create the directory if needed) covering the result of each step above. No commit — this task produces no file changes, only verification evidence.

---

## Final Verification

- [ ] All 8 case-study pages load `js/case-study-nav.js` and render a sidebar matching their own headings.
- [ ] Scroll-spy confirmed working on at least 2 pages with different section counts (5 and 11).
- [ ] Mobile `<details>` collapse confirmed on at least 1 page.
- [ ] All 6 spacing substitutions from Task 3 landed, nothing else in those two CSS files changed.
- [ ] The Intelkin terminal card is pixel-identical to before this plan.
- [ ] No copy changed anywhere.
