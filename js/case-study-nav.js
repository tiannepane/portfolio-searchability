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
    ul.className = 'case-study-sidenav-list';
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

  // Static, not part of the scroll-spy section list — sits above it so
  // it's the first thing in the sidenav regardless of how long that
  // list is. The page also keeps its own "back to all projects" link
  // at the bottom (case-study-back), for after a long scroll — this
  // is a second, faster exit at the top.
  function buildBackLink() {
    const a = document.createElement('a');
    a.href = '/index.html';
    a.className = 'case-study-sidenav-back';
    a.textContent = '← Back to all projects';
    return a;
  }

  function initSidenav() {
    const hook = document.getElementById('case-study-sidenav');
    if (!hook) return;

    const sections = buildSections();
    if (!sections.length) return;

    hook.setAttribute('role', 'navigation');
    hook.setAttribute('aria-label', 'Section navigation');

    hook.append(buildBackLink());

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
    const sectionOrder = [];
    links.forEach((link) => {
      linksById[link.dataset.sectionLink] = link;
      sectionOrder.push(link.dataset.sectionLink);
    });

    // Exactly one link is ever active: whichever section the observer most
    // recently reported as intersecting. Clearing every link before setting
    // one (rather than toggling each independently) avoids two adjacent
    // short sections both registering active at once, since the ~10%-tall
    // observation band can briefly overlap a short section's boundary.
    function setActive(id) {
      Object.values(linksById).forEach((link) => link.classList.remove('is-active'));
      const link = linksById[id];
      if (link) link.classList.add('is-active');
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: '-10% 0px -80% 0px', threshold: 0 }
    );

    sections.forEach(({ id }) => {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    });

    // The observer's band is anchored near the top of the viewport, so it
    // can never reach a short trailing section if the page doesn't have
    // enough scroll room left below it once that section is in view —
    // force the last section active once the user has actually scrolled to
    // the bottom of the page, regardless of what the observer last
    // reported. Same scroll-throttle pattern as js/home.js's
    // initPromptBoxSticky.
    let ticking = false;
    function checkBottom() {
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      if (atBottom && sectionOrder.length) {
        setActive(sectionOrder[sectionOrder.length - 1]);
      }
      ticking = false;
    }
    window.addEventListener(
      'scroll',
      () => {
        if (!ticking) {
          requestAnimationFrame(checkBottom);
          ticking = true;
        }
      },
      { passive: true }
    );
    checkBottom();
  }

  document.addEventListener('DOMContentLoaded', initSidenav);
})();
