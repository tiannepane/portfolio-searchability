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
*/

(function () {
  const DATA_URL = '/data/testimonials.json';
  const STAGGER_MS = 60;
  const MAX_STAGGER_MS = 300;

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
  }

  document.addEventListener('DOMContentLoaded', initTestimonials);
})();
