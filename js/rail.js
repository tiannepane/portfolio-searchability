/*
  js/rail.js — scrollspy / match-indicator logic for the category rail
  (vertical sidebar on md+, horizontal tab bar on mobile — CSS in
  components.css handles the layout swap, this logic is orientation-agnostic).

  Browse mode (default): the category with the most total visible card area
  in the viewport is marked active, debounced ~200ms so passing a boundary
  row doesn't flicker between two labels (CLAUDE.md §5/§12).

  Filtered mode: while a Tianne query is active, js/home.js dispatches
  'tianne:filtered' with the categories present in the results — the rail
  switches to a match indicator (dot/highlight on categories with a result,
  quiet otherwise) and browse-mode scrollspy pauses. 'tianne:cleared'
  reverts to browse mode. The rail only ever reflects position/match state —
  it never hides, dims, or reorders cards itself.
*/

(function () {
  const DEBOUNCE_MS = 200;

  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function initRail() {
    const rail = document.querySelector('[data-rail]');
    if (!rail) return;

    const railItems = Array.from(rail.querySelectorAll('[data-category]'));
    if (!railItems.length) return;

    let debounceTimer = null;
    let isFiltered = false;

    function setActiveCategory(category) {
      let activeItem = null;
      railItems.forEach((item) => {
        const isActive = item.dataset.category === category;
        item.classList.toggle('is-active', isActive);
        item.setAttribute('aria-current', isActive ? 'true' : 'false');
        if (isActive) activeItem = item;
      });

      // On the horizontal mobile tab bar, keep the active tab in view.
      // block:'nearest' avoids also scrolling the page vertically.
      if (activeItem) {
        activeItem.scrollIntoView({
          behavior: prefersReducedMotion() ? 'auto' : 'smooth',
          inline: 'center',
          block: 'nearest',
        });
      }
    }

    function computeActiveCategory() {
      if (isFiltered) return; // browse-mode scrollspy pauses in filtered mode

      const cards = Array.from(document.querySelectorAll('.bento-card'));
      if (!cards.length) return;

      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const areaByCategory = {};

      cards.forEach((card) => {
        const category = card.dataset.category;
        if (!category) return;

        const rect = card.getBoundingClientRect();
        const visibleHeight = Math.max(0, Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0));
        const visibleWidth = Math.max(0, Math.min(rect.right, viewportWidth) - Math.max(rect.left, 0));
        const visibleArea = visibleHeight * visibleWidth;

        areaByCategory[category] = (areaByCategory[category] || 0) + visibleArea;
      });

      let maxCategory = null;
      let maxArea = 0;
      Object.entries(areaByCategory).forEach(([category, area]) => {
        if (area > maxArea) {
          maxArea = area;
          maxCategory = category;
        }
      });

      if (maxCategory) setActiveCategory(maxCategory);
    }

    function onScrollOrResize() {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(computeActiveCategory, DEBOUNCE_MS);
    }

    function applyMatchIndicator(matchedCategories) {
      isFiltered = true;
      rail.classList.add('is-filtered');
      const matchedSet = new Set(matchedCategories);
      railItems.forEach((item) => {
        item.classList.remove('is-active');
        item.setAttribute('aria-current', 'false');
        item.classList.toggle('has-match', matchedSet.has(item.dataset.category));
      });
    }

    function revertToBrowseMode() {
      isFiltered = false;
      rail.classList.remove('is-filtered');
      railItems.forEach((item) => item.classList.remove('has-match'));
      computeActiveCategory();
    }

    function jumpToCategory(category) {
      const card = document.querySelector(`.bento-card[data-category="${category}"]`);
      if (!card) return;
      card.scrollIntoView({
        behavior: prefersReducedMotion() ? 'auto' : 'smooth',
        block: 'center',
      });
    }

    railItems.forEach((item) => {
      item.addEventListener('click', () => jumpToCategory(item.dataset.category));
    });

    window.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', onScrollOrResize, { passive: true });

    // Initial state once cards are rendered (js/home.js dispatches this).
    // No-ops while filtered, per the guard in computeActiveCategory.
    document.addEventListener('bento:grid-rendered', computeActiveCategory);

    // Filtered mode, driven by js/home.js after a Tianne query resolves.
    document.addEventListener('tianne:filtered', (event) => {
      applyMatchIndicator((event.detail && event.detail.categories) || []);
    });
    document.addEventListener('tianne:cleared', revertToBrowseMode);
  }

  document.addEventListener('DOMContentLoaded', initRail);
})();
