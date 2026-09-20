/*
  js/case-study-boardy.js — scroll and hand-drawn layers for
  projects/boardy.html ONLY (loaded by that page alone, alongside
  RoughJS). Styles live in css/case-study-boardy.css.

  Everything here is progressive enhancement over a page that already
  looks finished without it (plain-SVG charts and diagram, all content
  visible). Seven layers, each independent and each safe to fail:

    1. Hand-drawn shapes: redraws the inline SVG shapes inside any
       [data-rough] group with RoughJS. If RoughJS didn't load, or a draw
       throws, the plain SVG in the markup stays as it is.
    2. Pattern A: sections (and the Risks cards, one after another) rise into
       place the first time they scroll in.
    3. Pattern B: the four-stage diagram stays pinned (>= 1024px) while
       the step cards scroll past; the active step lights its stage.
    4. Chart draw: bars grow out from their zero line when first seen.
    5. Interview scrubber: custom player + quote-card buttons that seek the
       audio and open the transcript drawer (works without the audio file).
    6. Technical Feasibility bento: expandable tiles + a cursor spotlight for
       fine pointers (off under reduced motion).
    7. Brainstormed Solutions: options resolve (mute + stamp) as you scroll on,
       and a connector draws from the chosen option into the stage cards.

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

    // Same trigger for the Risks cards and the option beats, one after another: cards that enter
    // the viewport in the same pass get a short stagger between them.
    const cards = document.querySelectorAll('.case-study-boardy .bd-risk, .case-study-boardy .bd-option');
    if (cards.length) {
      const cardIo = new IntersectionObserver(
        (entries) => {
          let n = 0;
          entries.forEach((entry) => {
            if (entry.isIntersecting || entry.boundingClientRect.top < 0) {
              entry.target.style.transitionDelay = n * 110 + 'ms';
              entry.target.classList.add('in');
              cardIo.unobserve(entry.target);
              n += 1;
            }
          });
        },
        { threshold: 0, rootMargin: '0px 0px -8% 0px' }
      );
      cards.forEach((el) => cardIo.observe(el));
    }

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
    const cards = Array.from(root.querySelectorAll('.bd-moment'));
    const lines = Array.from(transcript.querySelectorAll('.bd-tx-line'));
    const bar = transcript.querySelector('.bd-tx-bar');
    const title = transcript.querySelector('.bd-tx-title');
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

    // Live mode: no card starts selected. The full transcript becomes a drawer
    // pinned to the right edge of the page (the site nav is on the left),
    // closed until a card is chosen.
    root.classList.add('is-live');
    transcript.hidden = false; // the drawer is closed by CSS (visibility), not by [hidden]
    transcript.classList.add('is-drawer');

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'bd-tx-close';
    closeBtn.setAttribute('aria-label', 'Close transcript');
    closeBtn.innerHTML = '<span aria-hidden="true">\u00d7</span>';
    bar.appendChild(closeBtn);

    const scrim = document.createElement('div');
    scrim.className = 'bd-tx-scrim';
    scrim.setAttribute('aria-hidden', 'true');

    // Mount the drawer and its scrim directly under <main>, outside every
    // .case-study-section. A section that hasn't been revealed yet still
    // carries a transform, and a position:fixed element inside a transformed
    // ancestor stops being viewport-fixed: the parked-offscreen drawer then
    // widened the page and the scrim was mis-sized. (Selectors are scoped to
    // .case-study-boardy, which <main> carries.)
    const host = root.closest('main') || document.body;
    host.appendChild(transcript);
    host.appendChild(scrim);

    let lastCard = null;
    const isOpen = () => transcript.classList.contains('is-open');

    // Wide windows have a gutter to the right of the content column: the
    // drawer sits there and covers nothing. Narrower ones get an overlay +
    // scrim.
    function layoutDrawer() {
      const gutter = document.documentElement.clientWidth - root.getBoundingClientRect().right - 16;
      const beside = gutter >= 360;
      const width = beside ? Math.min(416, gutter) : Math.min(416, window.innerWidth * 0.92);
      transcript.style.setProperty('--bd-drawer-w', Math.floor(width) + 'px');
      scrim.classList.toggle('is-on', isOpen() && !beside);
    }

    function closeDrawer(restoreFocus) {
      transcript.classList.remove('is-open');
      scrim.classList.remove('is-on');
      cards.forEach((c) => c.setAttribute('aria-pressed', 'false'));
      if (restoreFocus && lastCard) lastCard.focus();
    }

    closeBtn.addEventListener('click', () => closeDrawer(true));
    scrim.addEventListener('click', () => closeDrawer(false));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen()) closeDrawer(true);
    });
    window.addEventListener('resize', () => { if (isOpen()) layoutDrawer(); });
    setDuration(duration);
    render(0);

    function selectMoment(card) {
      const id = card.dataset.moment;
      cards.forEach((c) => c.setAttribute('aria-pressed', String(c === card)));
      const wasOpen = isOpen();

      // Highlight every turn inside this moment's time range; the rest of the
      // transcript stays in place above and below it.
      const start = +card.dataset.time;
      const end = +(card.dataset.end || card.dataset.time);
      let first = null;
      lines.forEach((line) => {
        const t = +line.dataset.time;
        const on = t >= start && t <= end;
        line.classList.toggle('bd-tx-line--target', on);
        if (on) {
          line.setAttribute('aria-current', 'true');
          if (!first) first = line;
        } else {
          line.removeAttribute('aria-current');
        }
      });
      title.textContent = card.querySelector('.bd-moment-label').textContent +
        ' \u00b7 ' + card.querySelector('.bd-moment-time').textContent;

      lastCard = card;
      transcript.classList.add('is-open');
      layoutDrawer();

      // Open scrolled to the moment (with the turn before it in view for
      // context). Instant while the drawer is sliding in; a smooth glide when
      // switching moments in an already-open drawer, unless motion is reduced.
      if (first) {
        const offset = first.getBoundingClientRect().top - transcript.getBoundingClientRect().top;
        const top = transcript.scrollTop + offset - bar.offsetHeight - 24;
        transcript.scrollTo({ top: Math.max(0, top), behavior: wasOpen && !reduceMotion ? 'smooth' : 'auto' });
      }
      // Move focus into the drawer so keyboard and screen-reader users land
      // on what just opened; Escape or the close button hands it back.
      transcript.focus({ preventScroll: true });

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

  // -- 6. Technical Feasibility bento ---------------------------------------
  // Expand/collapse per tile (the real <button> carries aria-expanded; the
  // tile mirrors it as .is-open / data-expanded for styling), plus a soft
  // spotlight that trails the cursor across the grid. The spotlight only runs
  // for fine pointers with hover, and never under reduced motion.
  function initBento(grid) {
    const tiles = Array.from(grid.querySelectorAll('.bd-tile'));

    tiles.forEach((tile) => {
      const btn = tile.querySelector('.bd-tile-toggle');
      if (!btn) return;
      btn.addEventListener('click', () => {
        const open = btn.getAttribute('aria-expanded') !== 'true';
        btn.setAttribute('aria-expanded', String(open));
        tile.classList.toggle('is-open', open);
        tile.dataset.expanded = String(open);
      });
    });

    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!fine || reduceMotion) return;

    let targetX = 0;
    let targetY = 0;
    let x = 0;
    let y = 0;
    let raf = 0;

    // Each tile needs its own offset inside the grid so one grid-level
    // (--x, --y) can place the glow correctly on every tile. Re-measured each
    // frame: an expanding tile shifts the ones below it.
    function place() {
      const g = grid.getBoundingClientRect();
      tiles.forEach((tile) => {
        const r = tile.getBoundingClientRect();
        tile.style.setProperty('--tx', r.left - g.left + 'px');
        tile.style.setProperty('--ty', r.top - g.top + 'px');
      });
      grid.style.setProperty('--x', x + 'px');
      grid.style.setProperty('--y', y + 'px');
    }

    function step() {
      x += (targetX - x) * 0.2;
      y += (targetY - y) * 0.2;
      place();
      raf = Math.abs(targetX - x) > 0.5 || Math.abs(targetY - y) > 0.5 ? requestAnimationFrame(step) : 0;
    }

    grid.addEventListener('mouseenter', (e) => {
      const g = grid.getBoundingClientRect();
      targetX = x = e.clientX - g.left;
      targetY = y = e.clientY - g.top;
      place();
      grid.style.setProperty('--bd-glow', '1');
    });
    grid.addEventListener('mousemove', (e) => {
      const g = grid.getBoundingClientRect();
      targetX = e.clientX - g.left;
      targetY = e.clientY - g.top;
      if (!raf) raf = requestAnimationFrame(step);
    });
    grid.addEventListener('mouseleave', () => {
      grid.style.setProperty('--bd-glow', '0');
    });
  }

  // -- 7. Brainstormed Solutions: options resolve as you scroll on ---------
  // Each beat gets roughly a screen of its own (CSS spacing), so one option is
  // on screen at a time. A beat "resolves" (muted, status label stamped) as it
  // leaves the top of the screen: once its bottom edge rises above a line 35%
  // down the viewport, while it is still visible, so the change can be seen.
  // The chosen (last) beat never resolves; once its top passes 55% down the
  // viewport the connector to the first stage card draws. An
  // IntersectionObserver whose band edges sit exactly on those two lines
  // triggers the check, the same mechanism as the pinned-scroll steps. With
  // reduced motion (or no IntersectionObserver) every beat simply shows its
  // final state at once, compactly spaced. Without JS, CSS
  // (@media (scripting: none)) does the same.
  function initOptions(box) {
    const beats = Array.from(box.querySelectorAll('.bd-option'));
    if (!beats.length) return;
    const last = beats.length - 1;
    const bridge = box.nextElementSibling && box.nextElementSibling.matches('[data-bridge]')
      ? box.nextElementSibling
      : null;
    const RESOLVE_LINE = 0.35;
    const DRAW_LINE = 0.55;

    if (!canAnimate) {
      beats.forEach((beat, i) => beat.classList.toggle('is-resolved', i < last));
      if (bridge) bridge.classList.add('is-drawn');
      return;
    }

    box.classList.add('is-live');
    if (bridge) bridge.classList.add('is-armed');

    function evaluate() {
      const h = window.innerHeight;
      beats.forEach((beat, i) => {
        const passed = beat.getBoundingClientRect().bottom <= h * RESOLVE_LINE;
        beat.classList.toggle('is-resolved', i < last && passed);
      });
      if (bridge && beats[last].getBoundingClientRect().top <= h * DRAW_LINE) {
        bridge.classList.add('is-drawn');
      }
    }

    // Band from 35% to 55% of the viewport: a beat leaves it when its bottom
    // crosses the resolve line and enters it when its top crosses the draw line.
    const io = new IntersectionObserver(evaluate, { rootMargin: '-35% 0px -45% 0px', threshold: 0 });
    beats.forEach((beat) => io.observe(beat));
    window.addEventListener('resize', evaluate);
    evaluate();
  }

  function init() {
    initHandDrawn(); // first, so the later layers act on the final shapes
    document.querySelectorAll('.case-study-boardy [data-scrubber]').forEach(initScrubber);
    initReveal();
    document.querySelectorAll('.case-study-boardy [data-scrolly]').forEach(initScrolly);
    initCharts();
    document.querySelectorAll('.case-study-boardy [data-bento]').forEach(initBento);
    document.querySelectorAll('.case-study-boardy [data-options]').forEach(initOptions);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
