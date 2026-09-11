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
