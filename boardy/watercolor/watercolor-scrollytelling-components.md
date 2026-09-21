# Component Library

All snippets assume the design tokens from `SKILL.md` are already loaded on
`:root`, and that the page has loaded:

```html
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Libre+Caslon+Text:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<script src="https://cdnjs.cloudflare.com/ajax/libs/rough.js/4.6.6/rough.umd.min.js"></script>
```

Verify the RoughJS version is actually present on cdnjs before shipping; if
it 404s, try the next available tag. Everything that uses RoughJS is wrapped
in `try/catch` with a CSS-only fallback, so a failed script load degrades
gracefully rather than breaking the page.

Base reset to put near the top of every page's `<style>`:

```css
* { box-sizing: border-box; }
html { scroll-padding-top: env(safe-area-inset-top, 0px); }
body {
  margin: 0;
  background: var(--paper);
  color: var(--ink);
  font-family: var(--font-sans);
  padding-top: env(safe-area-inset-top, 0px);
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
h1, h2, h3, .serif { font-family: var(--font-serif); font-weight: 400; }
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
```

---

## Paper canvas

Faint graph-paper grid behind everything — apply to `body` or any full-bleed
section.

```css
.paper-bg {
  background-color: var(--paper);
  background-image:
    linear-gradient(var(--paper-grid) 1px, transparent 1px),
    linear-gradient(90deg, var(--paper-grid) 1px, transparent 1px);
  background-size: 34px 34px;
}
```

---

## Watercolor swatch

The cheap, reliable technique for *repeated small shapes* (grid squares,
legend chips, icons). Don't use live SVG filters here at scale — asymmetric
`border-radius` plus two soft radial-gradient highlights reads as "painted"
without any per-element filter cost.

```css
.wc-swatch {
  width: 42px;
  height: 42px;
  border-radius: 3px 6px 4px 7px / 6px 3px 7px 4px;
  background:
    radial-gradient(circle at 28% 22%, rgba(255,255,255,0.35), transparent 60%),
    radial-gradient(circle at 72% 78%, rgba(0,0,0,0.07), transparent 55%),
    var(--swatch-color, var(--wc-tan));
  transition: opacity .5s ease, transform .5s cubic-bezier(.22,.8,.3,1);
}
.wc-swatch.c-lavender { --swatch-color: var(--wc-lavender); }
.wc-swatch.c-blue     { --swatch-color: var(--wc-blue); }
.wc-swatch.c-tan      { --swatch-color: var(--wc-tan); }
.wc-swatch.c-gold     { --swatch-color: var(--wc-gold); }
.wc-swatch.c-sage     { --swatch-color: var(--wc-sage); }
.wc-swatch.c-rose     { --swatch-color: var(--wc-rose); }
.wc-swatch.c-gray     { --swatch-color: var(--wc-gray); }
```

For a **one-off hero shape** (not repeated many times) where true watercolor
bleed is worth the cost, use this SVG filter instead. Define it once, hidden,
near the top of `<body>`:

```html
<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <defs>
    <filter id="wc-bleed" x="-20%" y="-20%" width="140%" height="140%">
      <feTurbulence type="fractalNoise" baseFrequency="0.012 0.08" numOctaves="2" seed="7" result="noise"/>
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="8" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
  </defs>
</svg>
```

```css
.wc-hero-shape { filter: url(#wc-bleed); }
```

---

## Hand-drawn card

The floating narration box that sits over/beside a visual.

```css
.hd-card {
  background: var(--card-bg);
  border: 1.5px solid var(--card-border);
  border-radius: var(--radius-hand);
  box-shadow: var(--shadow-card);
  padding: 28px 32px;
  max-width: 30rem;
}
.hd-card h3 { font-family: var(--font-serif); font-size: 1.4rem; margin: 0 0 12px; }
.hd-card p { font-family: var(--font-serif); font-size: 1.05rem; line-height: 1.55; color: var(--ink); margin: 0 0 10px; }
.hd-card p:last-child { margin-bottom: 0; }
.hd-card .fine-print { font-family: var(--font-sans); font-size: 0.82rem; color: var(--ink-soft); }
```

```html
<div class="hd-card">
  <h3>Section headline</h3>
  <p>Two to four sentences of narration. Keep it short — this format works
  because each card says one thing.</p>
</div>
```

---

## Mosaic reveal grid

The recurring "made of many small things" metaphor — a grid of swatches that
color in as the section scrolls into view, optionally staggered.

```html
<div class="mosaic-grid" data-stagger="35">
  <div class="wc-swatch c-tan" data-label="Unchanged"></div>
  <div class="wc-swatch c-lavender" data-label="Augmented"></div>
  <div class="wc-swatch c-tan" data-label="Unchanged"></div>
  <div class="wc-swatch c-blue" data-label="Automated"></div>
  <!-- repeat as needed -->
</div>
```

```css
.mosaic-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, 42px);
  gap: 14px;
}
.mosaic-grid .wc-swatch { opacity: 0; transform: scale(.35); }
.mosaic-grid .wc-swatch.revealed { opacity: 1; transform: scale(1); }
```

```js
function initMosaics(selector = '.mosaic-grid') {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const grid = entry.target;
      const stagger = reduce ? 0 : (+grid.dataset.stagger || 30);
      grid.querySelectorAll('.wc-swatch').forEach((el, i) => {
        setTimeout(() => el.classList.add('revealed'), i * stagger);
      });
      io.unobserve(grid);
    });
  }, { threshold: 0.25 });
  document.querySelectorAll(selector).forEach((el) => io.observe(el));
}
```

Call `initMosaics()` once on `DOMContentLoaded`.

---

## Hand-drawn charts with RoughJS

A sketchy line/area chart. `points` is an array of `[x, y]` in SVG
coordinate space (compute these from your data with a simple linear scale
before calling this).

```js
function drawHandLine(svgEl, points, { color = 'var(--wc-rose)', width = 3, roughness = 1.1 } = {}) {
  const resolved = getComputedStyle(document.documentElement)
    .getPropertyValue(color.replace('var(', '').replace(')', '')) || color;
  try {
    const rc = rough.svg(svgEl);
    const node = rc.curve(points, {
      stroke: resolved.trim() || '#333',
      strokeWidth: width,
      roughness,
      bowing: 1,
    });
    svgEl.appendChild(node);
    return node;
  } catch (err) {
    // Fallback: plain SVG polyline if RoughJS failed to load.
    const ns = 'http://www.w3.org/2000/svg';
    const poly = document.createElementNS(ns, 'polyline');
    poly.setAttribute('points', points.map((p) => p.join(',')).join(' '));
    poly.setAttribute('fill', 'none');
    poly.setAttribute('stroke', resolved.trim() || '#333');
    poly.setAttribute('stroke-width', width);
    svgEl.appendChild(poly);
    return poly;
  }
}

function drawHandRect(svgEl, x, y, w, h, { color = 'var(--wc-sage)', roughness = 1 } = {}) {
  const resolved = getComputedStyle(document.documentElement)
    .getPropertyValue(color.replace('var(', '').replace(')', '')) || color;
  try {
    const rc = rough.svg(svgEl);
    const node = rc.rectangle(x, y, w, h, {
      fill: resolved.trim(),
      fillStyle: 'solid',
      stroke: 'none',
      roughness,
    });
    svgEl.appendChild(node);
    return node;
  } catch (err) {
    const ns = 'http://www.w3.org/2000/svg';
    const rect = document.createElementNS(ns, 'rect');
    rect.setAttribute('x', x); rect.setAttribute('y', y);
    rect.setAttribute('width', w); rect.setAttribute('height', h);
    rect.setAttribute('fill', resolved.trim());
    rect.setAttribute('rx', 4);
    svgEl.appendChild(rect);
    return rect;
  }
}
```

Usage:

```html
<svg id="trendChart" viewBox="0 0 640 320" width="100%" height="320"></svg>
<script>
  const svg = document.getElementById('trendChart');
  const points = [[20,280],[160,250],[300,190],[440,110],[600,40]]; // pre-scaled
  drawHandLine(svg, points, { color: 'var(--wc-rose)', width: 3 });
</script>
```

For multiple series, call `drawHandLine` once per series with different
`color` values and slightly different `roughness`/`seed`-like variation
(RoughJS randomizes each call automatically, so repeated calls already look
distinct).

---

## Waffle bar

Proportional "N% of every dollar" bar rendered as a grid of small squares
plus a painted percentage bar — mirrors the GDP/labor-share visuals in the
reference.

```html
<div class="waffle-row">
  <div class="waffle-dots" data-filled="6" data-total="24">
    <!-- JS fills this with 24 .wc-swatch elements, `filled` colored -->
  </div>
  <svg class="waffle-bar" viewBox="0 0 400 46" width="100%" height="46"></svg>
  <div class="waffle-label"><strong>59.4%</strong> to labor</div>
</div>
```

```css
.waffle-row { display: grid; grid-template-columns: 160px 1fr 200px; align-items: center; gap: 20px; }
.waffle-dots { display: grid; grid-template-columns: repeat(6, 1fr); gap: 4px; }
.waffle-dots .wc-swatch { width: 100%; aspect-ratio: 1; border-radius: 2px 3px 2px 3px; }
```

```js
function buildWaffle(container, filled, total, colorClass = 'c-sage') {
  container.innerHTML = '';
  for (let i = 0; i < total; i++) {
    const d = document.createElement('div');
    d.className = 'wc-swatch ' + (i < filled ? colorClass : 'c-tan');
    d.style.opacity = 1; // static, not scroll-revealed
    container.appendChild(d);
  }
}
function drawWaffleBar(svgEl, pct, color = 'var(--wc-sage)') {
  const w = 400, h = 46;
  drawHandRect(svgEl, 0, 0, w, h, { color: 'var(--wc-gray)', roughness: 0.6 });
  drawHandRect(svgEl, 0, 0, w * (pct / 100), h, { color, roughness: 0.8 });
}
```

---

## Flow ribbon

Two states connected by a curved hand-drawn ribbon (e.g. "workers who
switched categories"). Simplest robust version: two `drawHandRect` blocks
plus one `drawHandLine` curve connecting a point on the right edge of the
top block to a point on the left edge of the bottom block.

```js
function drawFlowRibbon(svgEl, from, to, color = 'var(--wc-rose)') {
  // from/to are [x, y] anchor points already in SVG coordinate space
  const mid1 = [from[0] + (to[0] - from[0]) * 0.4, from[1]];
  const mid2 = [from[0] + (to[0] - from[0]) * 0.6, to[1]];
  drawHandLine(svgEl, [from, mid1, mid2, to], { color, width: 2.5, roughness: 1.3 });
}
```

Layer several ribbons with different opacities (`svgEl.lastChild.style.opacity = 0.6`)
for the "several small flows" look from the reference's worker-transition
diagram.

---

## Pattern A — sequential reveal sections

The default pattern: one idea per full-height (or content-height) section,
fading/rising into place the first time it enters the viewport.

```html
<section class="beat" data-reveal>
  <div class="hd-card beat-card">
    <h3>Headline for this beat</h3>
    <p>Narration.</p>
  </div>
  <div class="beat-visual">
    <!-- mosaic grid, chart, waffle bar, etc. -->
  </div>
</section>
```

```css
.beat {
  min-height: 70vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 32px;
  padding: 64px clamp(20px, 6vw, 96px);
  opacity: 0;
  transform: translateY(24px);
  transition: opacity .6s ease, transform .6s ease;
}
.beat.in { opacity: 1; transform: none; }
@media (min-width: 900px) {
  .beat { flex-direction: row; align-items: center; }
  .beat-card { flex: 0 0 380px; }
  .beat-visual { flex: 1; }
}
```

```js
function initBeats(selector = '.beat') {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.2 });
  document.querySelectorAll(selector).forEach((el) => io.observe(el));
}
```

---

## Pattern B — pinned visual, scrolling steps

One visual stays pinned (via `position: sticky`) while several interpretive
text cards scroll past it. Use for "here's one chart, three different
readings of it."

```html
<section class="scrolly">
  <div class="scrolly-visual">
    <svg id="pinnedChart" viewBox="0 0 640 360" width="100%" height="360"></svg>
  </div>
  <div class="scrolly-steps">
    <div class="step hd-card" data-step="0"><p>First reading of the chart.</p></div>
    <div class="step hd-card" data-step="1"><p>Second reading.</p></div>
    <div class="step hd-card" data-step="2"><p>Third reading.</p></div>
  </div>
</section>
```

```css
.scrolly { position: relative; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; padding: 40px clamp(20px, 6vw, 96px); }
.scrolly-visual { position: sticky; top: calc(12vh + env(safe-area-inset-top, 0px)); height: 60vh; align-self: start; }
.scrolly-steps { display: flex; flex-direction: column; gap: 50vh; padding: 20vh 0; }
.step { opacity: .3; transition: opacity .4s ease; }
.step.active { opacity: 1; }
@media (max-width: 899px) {
  .scrolly { grid-template-columns: 1fr; }
  .scrolly-visual { position: static; height: 42vh; }
  .scrolly-steps { gap: 24px; padding: 0; }
}
```

```js
function initScrolly(section, onStep) {
  const steps = section.querySelectorAll('.step');
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      steps.forEach((s) => s.classList.remove('active'));
      entry.target.classList.add('active');
      onStep(+entry.target.dataset.step, entry.target);
    });
  }, { threshold: 0.6, rootMargin: '-35% 0px -35% 0px' });
  steps.forEach((s) => io.observe(s));
}
```

`onStep` is where you redraw or highlight the pinned SVG for the given step
index (e.g. re-run `drawHandLine` with a bold color for the active series
and dim the others).

---

## Scenario predictor

The signature "predict your own scenario" tool. Sliders drive a single
0–100 "position" on a named spectrum (e.g. Modest → Substantial → Extreme);
that position is linearly interpolated between reference anchors to produce
live result numbers.

```html
<div id="predictor" class="hd-card predictor">
  <div class="predictor-sliders"></div>
  <div class="spectrum">
    <div class="spectrum-track"></div>
    <div class="spectrum-marker" id="youMarker"><span>You</span></div>
  </div>
  <div class="result-grid"></div>
</div>
```

```css
.predictor { max-width: 640px; }
.predictor-sliders label { display: block; font-family: var(--font-sans); font-size: .82rem; color: var(--ink-soft); margin: 14px 0 4px; display: flex; justify-content: space-between; }
.predictor-sliders input[type="range"] { width: 100%; accent-color: var(--wc-lavender); }
.spectrum { position: relative; height: 54px; margin: 28px 0 8px; }
.spectrum-track { position: absolute; top: 24px; left: 0; right: 0; height: 4px; background: var(--wc-tan); border-radius: 4px; }
.spectrum-marker { position: absolute; top: 0; transform: translateX(-50%); transition: left .25s ease; text-align: center; }
.spectrum-marker::after { content: ''; display: block; width: 14px; height: 14px; margin: 6px auto 0; border-radius: 50% 45% 50% 48%; background: var(--wc-rose); }
.spectrum-marker span { font-family: var(--font-sans); font-size: .78rem; color: var(--ink-soft); }
.result-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 14px; margin-top: 20px; }
.result-card { background: var(--paper); border: 1px solid var(--card-border); border-radius: 10px 12px 9px 11px; padding: 14px 16px; }
.result-card .result-label { font-size: .74rem; color: var(--ink-soft); text-transform: uppercase; letter-spacing: .04em; }
.result-card .result-value { font-family: var(--font-serif); font-size: 1.5rem; margin-top: 4px; }
.result-card .result-delta { font-size: .78rem; color: var(--ink-soft); margin-top: 2px; }
```

```js
class ScenarioPredictor {
  /**
   * @param {Object} cfg
   * @param {string} cfg.mount - CSS selector for the root element (the .hd-card.predictor)
   * @param {Array}  cfg.sliders - [{key,label,min,max,value,step?}]
   * @param {Array}  cfg.anchors - [{name, pos /* 0-100 *\/, values:{metricKey:number}}], sorted by pos ascending
   * @param {Array}  cfg.metrics - [{key,label,format:(v)=>string}]
   * @param {(sliderValues:Object)=>number} cfg.computePosition - combine sliders into a 0-100 position
   */
  constructor(cfg) {
    this.cfg = cfg;
    this.root = document.querySelector(cfg.mount);
    this.values = Object.fromEntries(cfg.sliders.map((s) => [s.key, s.value]));
    this._buildSliders();
    this._buildResultCards();
    this._buildAnchorTicks();
    this.update();
  }

  _buildSliders() {
    const wrap = this.root.querySelector('.predictor-sliders');
    wrap.innerHTML = '';
    this.cfg.sliders.forEach((s) => {
      const label = document.createElement('label');
      label.innerHTML = `<span>${s.label}</span><span data-readout="${s.key}">${s.value}</span>`;
      const input = document.createElement('input');
      Object.assign(input, { type: 'range', min: s.min, max: s.max, value: s.value, step: s.step || 1 });
      input.addEventListener('input', () => {
        this.values[s.key] = +input.value;
        label.querySelector(`[data-readout="${s.key}"]`).textContent = input.value;
        this.update();
      });
      wrap.appendChild(label);
      wrap.appendChild(input);
    });
  }

  _buildAnchorTicks() {
    const track = this.root.querySelector('.spectrum');
    this.cfg.anchors.forEach((a) => {
      const tick = document.createElement('div');
      tick.className = 'spectrum-marker';
      tick.style.left = a.pos + '%';
      tick.innerHTML = `<span>${a.name}</span>`;
      tick.querySelector = null;
      track.insertBefore(tick, track.querySelector('#youMarker') || null);
    });
  }

  _buildResultCards() {
    const grid = this.root.querySelector('.result-grid');
    grid.innerHTML = '';
    this.cfg.metrics.forEach((m) => {
      const card = document.createElement('div');
      card.className = 'result-card';
      card.innerHTML = `<div class="result-label">${m.label}</div><div class="result-value" data-metric="${m.key}"></div><div class="result-delta" data-delta="${m.key}"></div>`;
      grid.appendChild(card);
    });
  }

  _interpolate(pos) {
    const anchors = this.cfg.anchors;
    let lo = anchors[0], hi = anchors[anchors.length - 1];
    for (let i = 0; i < anchors.length - 1; i++) {
      if (pos >= anchors[i].pos && pos <= anchors[i + 1].pos) { lo = anchors[i]; hi = anchors[i + 1]; break; }
    }
    const span = hi.pos - lo.pos || 1;
    const t = Math.min(1, Math.max(0, (pos - lo.pos) / span));
    const out = {};
    this.cfg.metrics.forEach((m) => {
      const a = lo.values[m.key], b = hi.values[m.key];
      out[m.key] = a + (b - a) * t;
    });
    return out;
  }

  update() {
    const pos = Math.min(100, Math.max(0, this.cfg.computePosition(this.values)));
    this.root.querySelector('#youMarker').style.left = pos + '%';
    const results = this._interpolate(pos);
    const baseline = this.cfg.anchors[0].values; // treat first anchor as "without" baseline, adjust as needed
    this.cfg.metrics.forEach((m) => {
      const val = results[m.key];
      this.root.querySelector(`[data-metric="${m.key}"]`).textContent = m.format(val);
      const delta = this.root.querySelector(`[data-delta="${m.key}"]`);
      if (delta && m.deltaAgainst !== false) {
        const base = baseline[m.key];
        const pct = base ? (((val - base) / base) * 100).toFixed(1) : null;
        delta.textContent = pct !== null ? `${pct > 0 ? '+' : ''}${pct}% vs. baseline` : '';
      }
    });
  }
}
```

Usage — anchors here should come straight from the source material's named
reference scenarios (Modest/Substantial/Extreme in the inspiration piece; use
whatever the user's content actually calls them):

```js
new ScenarioPredictor({
  mount: '#predictor',
  sliders: [
    { key: 'capability', label: 'Capability', min: 0, max: 100, value: 40 },
    { key: 'adoption', label: 'Adoption', min: 0, max: 100, value: 30 },
  ],
  anchors: [
    { name: 'Modest', pos: 15, values: { gdp: 34.1, unemployment: 4.6 } },
    { name: 'Substantial', pos: 55, values: { gdp: 36.3, unemployment: 5.1 } },
    { name: 'Extreme', pos: 90, values: { gdp: 44.4, unemployment: 8.4 } },
  ],
  metrics: [
    { key: 'gdp', label: 'GDP in 2030', format: (v) => '$' + v.toFixed(1) + 'T' },
    { key: 'unemployment', label: 'Unemployment', format: (v) => v.toFixed(1) + '%' },
  ],
  computePosition: (v) => (v.capability + v.adoption) / 2,
});
```

---

## Spectrum marker

If you just need the "where does this fall on a range" number line without
the full slider tool (e.g. showing where survey respondents landed), reuse
just the `.spectrum` / `.spectrum-track` / `.spectrum-marker` CSS above with
static, pre-set `left` percentages instead of wiring it to `update()`.
