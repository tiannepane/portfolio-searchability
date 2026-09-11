/*
  js/feedback.js — feedback.html testimonial grid.

  Fetches data/testimonials.json and renders it as a bento-style card
  grid (css/feedback.css). Card color treatment is derived here, not
  stored in the JSON (which only carries name/role/quote/image/size,
  matching the data/projects.json convention of no presentation
  details baked into content data): the one "large" card that appears
  first gets the solid blue accent treatment as the page's single
  visual anchor, "small" cards get the solid black treatment, and
  everything else is the default paper card. Scroll-reveal is a plain
  IntersectionObserver toggling .is-visible per card (CSS transition
  handles the blur/translateY/opacity — see feedback.css), with a
  small stagger by index via transition-delay, same restraint as
  js/case-study-nav.js's approach elsewhere on the site.

  layoutMasonry() below hand-rolls a masonry layout (independent
  per-column heights, not CSS Grid's row-locked height) so a "large"
  card next to a shorter card never leaves a dead gap before the next
  row — see the comment on .testimonial-grid in feedback.css for why
  CSS Grid alone couldn't do this. COLUMNS/GAP_PX here must stay in
  sync with the column count and var(--space-4) in feedback.css's
  >=768px breakpoint; there's no way to read a CSS custom property's
  computed px value back into a layout calculation like this without
  it, short of parsing getComputedStyle, which isn't worth it for two
  numbers that only change if the design does.
*/

(function () {
  const DATA_URL = '/data/testimonials.json';
  const STAGGER_MS = 60;
  const MAX_STAGGER_MS = 300;
  const COLUMNS = 3;
  const GAP_PX = 16; // var(--space-4)
  const DESKTOP_QUERY = '(min-width: 768px)';

  function linkedInGlyph() {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('class', 'testimonial-linkedin-glyph');
    svg.setAttribute('width', '14');
    svg.setAttribute('height', '14');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'currentColor');
    svg.setAttribute('aria-hidden', 'true');
    const path = document.createElementNS(ns, 'path');
    path.setAttribute(
      'd',
      'M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z'
    );
    svg.append(path);
    return svg;
  }

  function buildCard(testimonial, variant) {
    const card = document.createElement('article');
    card.className = `testimonial-card testimonial-card--${variant}`;
    if (testimonial.size === 'large') card.classList.add('testimonial-card--large');

    card.append(linkedInGlyph());

    const quote = document.createElement('p');
    quote.className = 'testimonial-quote';
    quote.textContent = `"${testimonial.quote}"`;
    card.append(quote);

    const byline = document.createElement('div');
    byline.className = 'testimonial-byline';

    const avatar = document.createElement('img');
    avatar.className = 'testimonial-avatar';
    avatar.src = testimonial.image;
    avatar.alt = testimonial.name;
    byline.append(avatar);

    const identity = document.createElement('div');
    const name = document.createElement('p');
    name.className = 'testimonial-name';
    name.textContent = testimonial.name;
    const role = document.createElement('p');
    role.className = 'testimonial-role';
    role.textContent = testimonial.role;
    identity.append(name, role);
    byline.append(identity);

    card.append(byline);
    return card;
  }

  function assignVariant(testimonial, accentAssigned) {
    if (testimonial.size === 'large' && !accentAssigned.done) {
      accentAssigned.done = true;
      return 'accent';
    }
    if (testimonial.size === 'small') return 'dark';
    return 'paper';
  }

  // True masonry: places each card into whichever column(s) currently
  // have the least height, rather than letting CSS Grid lock a whole
  // row's height to its tallest cell. Mobile (<768px) is untouched —
  // feedback.css keeps a plain single-column grid there, this
  // function no-ops and clears any leftover inline positioning.
  function layoutMasonry(grid, cards) {
    if (!window.matchMedia(DESKTOP_QUERY).matches) {
      cards.forEach((card) => {
        card.style.position = '';
        card.style.top = '';
        card.style.left = '';
        card.style.width = '';
      });
      grid.style.height = '';
      return;
    }

    const containerWidth = grid.clientWidth;
    const colWidth = (containerWidth - GAP_PX * (COLUMNS - 1)) / COLUMNS;
    const colHeights = new Array(COLUMNS).fill(0);

    cards.forEach((card) => {
      const span = card.classList.contains('testimonial-card--large') ? 2 : 1;
      const width = colWidth * span + GAP_PX * (span - 1);

      // Whichever starting column (0..COLUMNS-span) has the lowest MAX
      // height across the span it would occupy — a 2-column card can't
      // start somewhere that leaves one of its two columns shorter
      // than the other underneath it. On a tie (common right after a
      // large card: two different pairs can share the same max), fall
      // back to the lower SUM across the span, so a still-empty column
      // gets used instead of stacking on top of columns that are
      // already tied-tallest — without this, a second large card kept
      // stacking directly under the first instead of using the empty
      // third column next to it, leaving that whole column blank.
      let bestCol = 0;
      let bestTop = Infinity;
      let bestSum = Infinity;
      for (let c = 0; c <= COLUMNS - span; c++) {
        const slice = colHeights.slice(c, c + span);
        const top = Math.max(...slice);
        const sum = slice.reduce((a, b) => a + b, 0);
        if (top < bestTop || (top === bestTop && sum < bestSum)) {
          bestTop = top;
          bestSum = sum;
          bestCol = c;
        }
      }

      card.style.width = `${width}px`;
      card.style.left = `${bestCol * (colWidth + GAP_PX)}px`;
      card.style.top = `${bestTop}px`;

      const newHeight = bestTop + card.offsetHeight + GAP_PX;
      for (let c = bestCol; c < bestCol + span; c++) colHeights[c] = newHeight;
    });

    grid.style.height = `${Math.max(...colHeights) - GAP_PX}px`;
  }

  function initRevealObserver(cards) {
    if (!('IntersectionObserver' in window)) {
      cards.forEach((card) => card.classList.add('is-visible'));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    cards.forEach((card) => observer.observe(card));
  }

  async function initTestimonials() {
    const grid = document.querySelector('[data-testimonial-grid]');
    if (!grid) return;

    let testimonials;
    try {
      const res = await fetch(DATA_URL);
      testimonials = await res.json();
    } catch (err) {
      console.error('[feedback] failed to load testimonials:', err);
      return;
    }

    const accentAssigned = { done: false };
    const cards = testimonials.map((testimonial, index) => {
      const variant = assignVariant(testimonial, accentAssigned);
      const card = buildCard(testimonial, variant);
      card.style.transitionDelay = `${Math.min(index * STAGGER_MS, MAX_STAGGER_MS)}ms`;
      return card;
    });

    grid.append(...cards);
    initRevealObserver(cards);

    layoutMasonry(grid, cards);
    // Heights measured before the real fonts finish loading reflect
    // fallback-font metrics — re-run once document.fonts.ready
    // resolves so the layout matches what's actually on screen.
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => layoutMasonry(grid, cards));
    }

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => layoutMasonry(grid, cards), 150);
    });
  }

  document.addEventListener('DOMContentLoaded', initTestimonials);
})();
