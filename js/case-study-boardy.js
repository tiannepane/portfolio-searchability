/*
  js/case-study-boardy.js — scroll and hand-drawn layers for
  projects/boardy.html ONLY (loaded by that page alone, alongside
  RoughJS). Styles live in css/case-study-boardy.css.

  Everything here is progressive enhancement over a page that already
  looks finished without it (plain-SVG charts and diagram, all content
  visible). Five layers, each independent and each safe to fail:

    1. Hand-drawn shapes: redraws the inline SVG shapes inside any
       [data-rough] group with RoughJS. If RoughJS didn't load, or a draw
       throws, the plain SVG in the markup stays as it is.
    2. Pattern A: sections rise into place the first time they scroll in.
    3. Pattern B: the four-stage diagram stays pinned (>= 1024px) while
       the step cards scroll past; the active step lights its stage.
    4. Chart draw: bars grow out from their zero line when first seen.
    5. Interview scrubber: custom player + quote-card buttons that seek the
       audio and swap the transcript panel (works without the audio file).

  prefers-reduced-motion: layers 2-4 stay off entirely and all content is
  simply shown; the scrubber's panel fade is CSS-gated the same way. Layer 1
  is a still drawing, not motion, so it still runs.
*/

(function () {
  'use strict';

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canObserve = 'IntersectionObserver' in window;
  const canAnimate = canObserve && !reduceMotion;

  // -- 1. Hand-drawn shapes (RoughJS) ---------------------------------------
  // Adapted from boardy/watercolor/ components.md's drawHandLine /
  // drawHandRect. Colors arrive already resolved (read off the plain
  // shape's computed style, which the page's tokens.css-based classes
  // set), never as var(--…) strings. Each helper catches its own failure
  // and returns the plain SVG equivalent, per that file's fallback.

  function plainShape(tag, attrs) {
    const el = document.createElementNS(SVG_NS, tag);
    Object.keys(attrs).forEach((k) => el.setAttribute(k, attrs[k]));
    return el;
  }

  function drawHandLine(svgEl, points, { color, width = 1.5, roughness = 1, seed } = {}) {
    try {
      return rough.svg(svgEl).linearPath(points, {
        stroke: color,
        strokeWidth: width,
        roughness,
        bowing: 1,
        seed,
      });
    } catch (err) {
      return plainShape('polyline', {
        points: points.map((p) => p.join(',')).join(' '),
        fill: 'none',
        stroke: color,
        'stroke-width': width,
      });
    }
  }

  function drawHandRect(svgEl, x, y, w, h, { fill, stroke, width = 1.5, roughness = 1, seed } = {}) {
    try {
      return rough.svg(svgEl).rectangle(x, y, w, h, {
        fill: fill === 'none' ? undefined : fill,
        fillStyle: 'solid',
        stroke,
        strokeWidth: width,
        roughness,
        bowing: 1,
        seed,
      });
    } catch (err) {
      return plainShape('rect', {
        x, y, width: w, height: h, rx: 3, fill, stroke, 'stroke-width': width,
      });
    }
  }

  function drawHandCircle(svgEl, cx, cy, r, { fill, seed } = {}) {
    try {
      return rough.svg(svgEl).circle(cx, cy, r * 2, {
        fill,
        fillStyle: 'solid',
        stroke: 'none',
        roughness: 1,
        seed,
      });
    } catch (err) {
      return plainShape('circle', { cx, cy, r, fill });
    }
  }

  let seedCounter = 11;

  // Redraws one plain shape by hand. Returns the replacement node, or
  // null for anything it doesn't know how to redraw (text, etc.).
  function roughVersionOf(svgEl, el) {
    const cs = getComputedStyle(el);
    const seed = seedCounter++;
    const stroke = cs.stroke;
    const fill = cs.fill;
    const width = parseFloat(cs.strokeWidth) || 1.5;
    const tag = el.tagName.toLowerCase();

    if (tag === 'rect') {
      return drawHandRect(
        svgEl,
        +el.getAttribute('x'),
        +el.getAttribute('y'),
        +el.getAttribute('width'),
        +el.getAttribute('height'),
        { fill, stroke, width, seed }
      );
    }
    if (tag === 'polyline') {
      const points = el
        .getAttribute('points')
        .trim()
        .split(/\s+/)
        .map((pair) => pair.split(',').map(Number));
      // Low roughness: RoughJS strokes each line twice, and at 0.9 the
      // short zero-line ticks came out as a heavy scribble.
      return drawHandLine(svgEl, points, { color: stroke, width, roughness: 0.5, seed });
    }
    if (tag === 'circle') {
      return drawHandCircle(svgEl, +el.getAttribute('cx'), +el.getAttribute('cy'), +el.getAttribute('r'), { fill, seed });
    }
    return null;
  }

  function enhanceSvg(svgEl) {
    svgEl.querySelectorAll('[data-rough]').forEach((group) => {
      // Build every replacement first, swap only if all of them worked, so
      // a failure halfway through can't leave a half-drawn group.
      const swaps = [];
      Array.from(group.children).forEach((el) => {
        const node = roughVersionOf(svgEl, el);
        if (!node) return;
        // Keep the plain shape's classes/inline style: the chart-draw
        // transition targets .bd-bar / .bd-dot on whatever replaced it.
        const cls = el.getAttribute('class');
        if (cls) node.setAttribute('class', cls);
        const style = el.getAttribute('style');
        if (style) node.setAttribute('style', style);
        swaps.push([el, node]);
      });
      swaps.forEach(([el, node]) => el.replaceWith(node));
    });
  }

  function initHandDrawn() {
    if (typeof window.rough === 'undefined') return; // script failed to load: keep plain SVG
    document.querySelectorAll('.case-study-boardy svg').forEach((svgEl) => {
      if (!svgEl.querySelector('[data-rough]')) return;
      try {
        enhanceSvg(svgEl);
      } catch (err) {
        console.warn('[case-study-boardy] hand-drawn pass skipped for one SVG', err);
      }
    });
  }

  // -- 2. Pattern A: sequential reveal --------------------------------------
  function initReveal() {
    if (!canAnimate) return;
    const sections = document.querySelectorAll('.case-study-boardy .case-study-section');
    if (!sections.length) return;

    // threshold 0 rather than a ratio: a tall section (Technical
    // Feasibility) may never reach a percentage-of-its-height on a short
    // viewport, but always crosses the bottom edge. A section already
    // scrolled past (deep-link, reload mid-page) counts as seen.
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting || entry.boundingClientRect.top < 0) {
            entry.target.classList.add('in');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0, rootMargin: '0px 0px -8% 0px' }
    );
    sections.forEach((el) => io.observe(el));
    document.documentElement.classList.add('bd-reveal');
  }

  // -- 3. Pattern B: pinned diagram, scrolling steps ------------------------
  function initScrolly(section) {
    const steps = Array.from(section.querySelectorAll('.bd-step'));
    const stages = Array.from(section.querySelectorAll('[data-stage]'));
    if (!steps.length) return;

    const wide = window.matchMedia('(min-width: 1024px)');
    let io = null;

    function setActive(index) {
      steps.forEach((s, i) => s.classList.toggle('is-active', i === index));
      stages.forEach((g) => g.classList.toggle('is-active', +g.dataset.stage === index));
    }

    function enable() {
      if (io) return;
      section.classList.add('is-live');
      setActive(0);
      // A thin band across the middle of the viewport: whichever step
      // crosses it is the one being read. Works for any card height,
      // unlike a percent-visible threshold.
      io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) setActive(+entry.target.dataset.step);
          });
        },
        { rootMargin: '-42% 0px -42% 0px', threshold: 0 }
      );
      steps.forEach((s) => io.observe(s));
    }

    function disable() {
      if (io) {
        io.disconnect();
        io = null;
      }
      section.classList.remove('is-live');
      steps.forEach((s) => s.classList.remove('is-active'));
      stages.forEach((g) => g.classList.remove('is-active'));
    }

    function sync() {
      if (wide.matches && canAnimate) enable();
      else disable();
    }

    wide.addEventListener('change', sync);
    sync();
  }

  // -- 4. Charts: bars grow from the zero line ------------------------------
  function initCharts() {
    const charts = document.querySelectorAll('.case-study-boardy .bd-chart');
    charts.forEach((chart) => {
      if (!canAnimate) {
        chart.dataset.drawn = 'true';
        return;
      }
      chart.querySelectorAll('.bd-bar').forEach((bar, i) => {
        bar.style.setProperty('--bd-delay', i * 90 + 'ms');
      });
      chart.dataset.drawn = 'false';
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            chart.dataset.drawn = 'true';
            io.unobserve(chart);
          });
        },
        { threshold: 0.3 }
      );
      io.observe(chart);
    });
  }

  // -- 5. Interview scrubber ------------------------------------------------
  // A custom player wired to a native <audio> element, plus quote-card
  // <button>s that seek it and swap the transcript panel. If the audio
  // file isn't there (404, blocked, unsupported), everything except
  // playback still works: the range becomes a read-only playhead that
  // jumps to the chosen moment, and the transcript panel opens as usual.
  function formatClock(seconds) {
    const s = Math.max(0, Math.floor(seconds));
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  }

  function initScrubber(root) {
    const audio = root.querySelector('.bd-audio');
    const play = root.querySelector('.bd-play');
    const range = root.querySelector('.bd-range');
    const timeEl = root.querySelector('.bd-time');
    const status = root.querySelector('.bd-player-status');
    const markersEl = root.querySelector('.bd-markers');
    const transcript = root.querySelector('.bd-transcript');
    const empty = root.querySelector('.bd-tx-empty');
    const cards = Array.from(root.querySelectorAll('.bd-moment'));
    const panels = Array.from(root.querySelectorAll('.bd-tx'));
    if (!range || !cards.length) return;

    let duration = +root.dataset.duration || 0; // nominal until real audio reports its own
    let hasAudio = false;
    let dragging = false;

    function render(t) {
      range.value = t;
      const pct = duration ? Math.min(100, (t / duration) * 100) : 0;
      range.style.setProperty('--bd-progress', pct + '%');
      const text = formatClock(t) + ' of ' + formatClock(duration);
      range.setAttribute('aria-valuetext', text);
      timeEl.textContent = formatClock(t) + ' / ' + formatClock(duration);
    }

    function drawMarkers() {
      markersEl.textContent = '';
      cards.forEach((card) => {
        const start = +card.dataset.time;
        const tick = document.createElement('span');
        tick.className = 'bd-marker';
        tick.style.left = (start / duration) * 100 + '%';
        markersEl.appendChild(tick);
        if (card.dataset.end) {
          const band = document.createElement('span');
          band.className = 'bd-marker bd-marker--range';
          band.style.left = (start / duration) * 100 + '%';
          band.style.width = ((+card.dataset.end - start) / duration) * 100 + '%';
          markersEl.appendChild(band);
        }
      });
    }

    function setDuration(d) {
      duration = d;
      range.max = String(Math.floor(d));
      drawMarkers();
    }

    // Live mode: hide every transcript until a moment is chosen.
    root.classList.add('is-live');
    panels.forEach((p) => { p.hidden = true; });
    if (empty) empty.hidden = false;
    setDuration(duration);
    render(0);

    function selectMoment(card) {
      const id = card.dataset.moment;
      cards.forEach((c) => c.setAttribute('aria-pressed', String(c === card)));
      let shown = null;
      panels.forEach((p) => {
        const on = p.dataset.moment === id;
        p.hidden = !on;
        p.classList.remove('is-entering');
        if (on) shown = p;
      });
      if (empty) empty.hidden = true;
      if (shown) {
        void shown.offsetWidth; // restart the fade if the same panel is re-chosen
        shown.classList.add('is-entering');
      }
      transcript.scrollTop = 0;

      const t = +card.dataset.time;
      if (hasAudio) {
        audio.currentTime = t;
        const p = audio.play();
        if (p && p.catch) p.catch(() => {});
      }
      render(t);
    }

    cards.forEach((card) => card.addEventListener('click', () => selectMoment(card)));

    range.addEventListener('input', () => {
      const t = +range.value;
      dragging = true;
      if (hasAudio) audio.currentTime = t;
      render(t);
    });
    range.addEventListener('change', () => { dragging = false; });

    play.addEventListener('click', () => {
      if (!hasAudio) return;
      if (audio.paused) {
        const p = audio.play();
        if (p && p.catch) p.catch(() => {});
      } else {
        audio.pause();
      }
    });

    audio.addEventListener('loadedmetadata', () => {
      if (!isFinite(audio.duration) || audio.duration <= 0) return;
      hasAudio = true;
      setDuration(audio.duration);
      render(audio.currentTime);
      play.disabled = false;
      range.disabled = false;
      if (status) status.hidden = true;
      root.classList.add('has-audio');
    });
    audio.addEventListener('timeupdate', () => { if (!dragging) render(audio.currentTime); });
    audio.addEventListener('play', () => {
      root.classList.add('is-playing');
      play.setAttribute('aria-label', 'Pause recording');
    });
    const stopped = () => {
      root.classList.remove('is-playing');
      play.setAttribute('aria-label', 'Play recording');
    };
    audio.addEventListener('pause', stopped);
    audio.addEventListener('ended', stopped);
    // No file at that path: stay in the "coming soon" state, no error.
    audio.addEventListener('error', () => { hasAudio = false; });

    if (root.dataset.audioSrc) audio.src = root.dataset.audioSrc;
  }

  function init() {
    initHandDrawn(); // first, so the later layers act on the final shapes
    document.querySelectorAll('.case-study-boardy [data-scrubber]').forEach(initScrubber);
    initReveal();
    document.querySelectorAll('.case-study-boardy [data-scrolly]').forEach(initScrolly);
    initCharts();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
