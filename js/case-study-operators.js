/*
  js/case-study-operators.js — behavior for the two prototypes on
  projects/operators-on-the-go.html: the SMS thread ([data-phone]) and the
  Price Nudges dashboard ([data-dash]). Behavior only; all styling is in
  css/case-study-operators.css. Each prototype is self-contained and skips
  quietly if its root isn't on the page.
*/

(function () {
  // -- Prototype A: SMS thread ----------------------------------------------
  function initPhone(root) {
    var thread = root.querySelector('[data-phone-thread]');
    var input = root.querySelector('[data-phone-input]');
    var sendBtn = root.querySelector('[data-phone-send]');
    var mic = root.querySelector('[data-phone-mic]');
    var resetBtn = root.querySelector('[data-phone-reset]');
    var initialHTML = thread.innerHTML;
    var pending = [];
    var stage = root.closest('.phone-stage');
    var timeline = stage && stage.querySelector('[data-timeline]');
    var stops = timeline ? Array.prototype.slice.call(timeline.querySelectorAll('.tl-stop')) : [];
    var animate = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var timers = [];

    function scrollDown() { thread.scrollTop = thread.scrollHeight; }

    function appendBubble(text, direction) {
      var div = document.createElement('div');
      div.className = 'bubble bubble--' + direction;
      div.textContent = text;
      thread.appendChild(div);
      scrollDown();
    }

    function updateComposerState() {
      var has = input.value.trim().length > 0;
      sendBtn.classList.toggle('is-hidden', !has);
      mic.classList.toggle('is-hidden', has);
    }

    function sendMessage() {
      var raw = input.value.trim();
      if (!raw) return;
      appendBubble(raw, 'out');
      input.value = '';
      updateComposerState();
      var norm = raw.toLowerCase();
      var isYes = norm === 'yes' || norm === 'y' || norm === 'yes.';
      var priceMatch = /^\$?\d+(\.\d{1,2})?$/.test(raw);
      if (isYes || priceMatch) {
        var price = isYes ? '$2.25' : (raw.charAt(0) === '$' ? raw : '$' + raw);
        pending.push(setTimeout(function () {
          appendBubble('Done, protein bars are now ' + price + ' at Riverside Gym.', 'in');
        }, 650));
      }
    }

    input.addEventListener('input', updateComposerState);
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') sendMessage(); });
    sendBtn.addEventListener('click', sendMessage);
    resetBtn.addEventListener('click', function () {
      // A reply still in flight would otherwise land in the fresh thread.
      pending.forEach(clearTimeout);
      pending = [];
      input.value = '';
      updateComposerState();
      playIntro();
    });

    // -- Morning timeline, synced with the newest incoming bubble ------------
    // Runs once when the prototype first scrolls into view (a load-time run
    // would finish long before anyone got this far down the page), and again
    // on every Reset. With reduced motion, everything just shows, no timing.
    function later(fn, ms) { timers.push(setTimeout(fn, ms)); }

    function showFinalState() {
      timers.forEach(clearTimeout);
      timers = [];
      thread.innerHTML = initialHTML;
      if (timeline) timeline.classList.remove('is-armed');
    }

    function playIntro() {
      if (!animate || !timeline) { showFinalState(); return; }
      timers.forEach(clearTimeout);
      timers = [];
      timeline.classList.add('is-armed');
      stops.forEach(function (s) { s.classList.remove('is-in', 'is-live'); });
      thread.innerHTML = '';

      [0, 1, 2].forEach(function (i) { later(function () { stops[i].classList.add('is-in'); }, i * 100); });
      later(function () { stops[3].classList.add('is-in'); }, 500);
      later(function () { stops[3].classList.add('is-live'); }, 800);
      later(function () {
        thread.innerHTML = initialHTML;
        Array.prototype.forEach.call(thread.children, function (b) { b.classList.add('bubble--enter'); });
      }, 800);
      later(function () { stops[4].classList.add('is-in'); }, 1400);
    }

    if (animate && timeline && 'IntersectionObserver' in window) {
      // Armed and empty until first seen, so nothing flashes then vanishes.
      timeline.classList.add('is-armed');
      thread.innerHTML = '';
      var io = new IntersectionObserver(function (entries) {
        if (!entries[0].isIntersecting) return;
        io.disconnect();
        playIntro();
      }, { threshold: 0.5 });
      io.observe(root);
    }
    updateComposerState();
  }

  // -- Prototype B: dashboard -----------------------------------------------
  function initDashboard(root) {
    // The prototype's other nav items go nowhere; don't jump the page.
    root.querySelectorAll('[data-proto-link]').forEach(function (a) {
      a.addEventListener('click', function (e) { e.preventDefault(); });
    });

    var tabs = root.querySelectorAll('.dash-tabs button');
    tabs.forEach(function (btn) {
      btn.addEventListener('click', function () {
        tabs.forEach(function (b) {
          b.classList.remove('is-active');
          b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('is-active');
        btn.setAttribute('aria-pressed', 'true');
        var target = btn.getAttribute('data-tab');
        root.querySelectorAll('.dash-panel').forEach(function (p) {
          p.classList.toggle('is-hidden', p.getAttribute('data-panel') !== target);
        });
      });
    });

    root.querySelectorAll('.nudge-row').forEach(function (row) {
      row.addEventListener('click', function () {
        var id = row.getAttribute('data-nudge');
        var detail = root.querySelector('.nudge-detail[data-detail="' + id + '"]');
        var open = detail.classList.toggle('is-hidden') === false;
        row.setAttribute('aria-expanded', String(open));
      });
    });

    root.querySelectorAll('.store-row .toggle').forEach(function (t) {
      t.addEventListener('click', function () {
        var on = t.getAttribute('aria-pressed') === 'true';
        t.setAttribute('aria-pressed', String(!on));
        t.classList.toggle('is-on', !on);
      });
    });

    // Mutually-exclusive button sets: the three pricing rules (by data-group)
    // and the notification cadence pair.
    function selectOne(btn, siblings) {
      siblings.forEach(function (b) {
        b.classList.remove('is-selected');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('is-selected');
      btn.setAttribute('aria-pressed', 'true');
    }
    root.querySelectorAll('.seg-btn[data-group]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var group = btn.getAttribute('data-group');
        selectOne(btn, root.querySelectorAll('.seg-btn[data-group="' + group + '"]'));
      });
    });
    root.querySelectorAll('.cadence-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        selectOne(btn, root.querySelectorAll('.cadence-btn'));
      });
    });

    var masterToggle = root.querySelector('[data-master-toggle]');
    var notifBody = root.querySelector('[data-notif-body]');
    var notifOff = root.querySelector('[data-notif-off]');
    masterToggle.addEventListener('click', function () {
      var next = masterToggle.getAttribute('aria-pressed') !== 'true';
      masterToggle.setAttribute('aria-pressed', String(next));
      masterToggle.classList.toggle('is-on', next);
      notifBody.classList.toggle('is-hidden', !next);
      notifOff.classList.toggle('is-hidden', next);
    });

    initDashboardMotion(root);
  }


  // -- Dashboard charts and entrance animation --------------------------------
  // Data for the three charts (the same nudges as the list below them).
  var NUDGES = [
    { item: 'Protein bars', store: '315 Front St', current: 2.75, suggested: 2.25, profitNow: 180, profitNew: 246 },
    { item: 'Sparkling water', store: '241 King St', current: 3.0, suggested: 2.6, profitNow: 140, profitNew: 189 },
    { item: 'Trail mix', store: '88 Harbor Row', current: 3.5, suggested: 3.1, profitNow: 95, profitNew: 121, pending: true }
  ];
  var IMPACT = [
    { label: 'Aug 3', value: 18 }, { label: 'Aug 10', value: 41 }, { label: 'Aug 17', value: 67 },
    { label: 'Aug 24', value: 98 }, { label: 'Aug 31', value: 134 }, { label: 'Sep 7', value: 189 },
    { label: 'Sep 14', value: 251 }, { label: 'Sep 21', value: 312 }
  ];
  var BAR_CHARTS = {
    price: { now: 'current', next: 'suggested', max: 4, ticks: [0, 1, 2, 3, 4], fmt: function (v) { return '$' + v.toFixed(2); }, tickFmt: function (v) { return '$' + v; } },
    profit: { now: 'profitNow', next: 'profitNew', max: 300, ticks: [0, 100, 200, 300], fmt: function (v) { return '$' + v; }, tickFmt: function (v) { return '$' + v; } }
  };
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canAnimate = !reduceMotion && 'IntersectionObserver' in window;

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }

  function buildBars(host, cfg) {
    var y = el('div', 'bars__y');
    var plot = el('div', 'bars__plot');
    cfg.ticks.forEach(function (t) {
      var pos = (t / cfg.max) * 100;
      var tick = el('span', 'bars__tick', cfg.tickFmt(t));
      tick.style.bottom = pos + '%';
      y.appendChild(tick);
      var line = el('div', 'bars__grid' + (t === 0 ? ' bars__grid--base' : ''));
      line.style.bottom = pos + '%';
      plot.appendChild(line);
    });
    var groups = el('div', 'bars__groups');
    var xrow = el('div', 'bars__x');
    var summary = [];
    NUDGES.forEach(function (n, gi) {
      var g = el('div', 'bars__group');
      [['current', cfg.now], ['suggested', cfg.next]].forEach(function (pair, bi) {
        var v = n[pair[1]];
        var bar = el('div', 'bar bar--' + pair[0]);
        bar.style.height = (v / cfg.max) * 100 + '%';
        bar.style.setProperty('--i', gi * 2 + bi);
        bar.appendChild(el('span', 'bar__fill'));
        bar.appendChild(el('span', 'bar__val', cfg.fmt(v)));
        g.appendChild(bar);
      });
      groups.appendChild(g);
      var label = el('div', 'bars__label');
      label.appendChild(el('span', '', n.item + (n.pending ? ' (pending)' : '')));
      label.appendChild(el('span', 'bars__label-sub', n.store));
      xrow.appendChild(label);
      summary.push(n.item + ' at ' + n.store + ': ' + cfg.fmt(n[cfg.now]) + ' now, ' + cfg.fmt(n[cfg.next]) + ' suggested');
    });
    plot.appendChild(groups);
    host.setAttribute('role', 'img');
    host.setAttribute('aria-label', summary.join('; '));
    host.append(y, plot, xrow);
  }

  // Smooth monotone-cubic path through the points.
  function smoothPath(pts) {
    var n = pts.length, m = [], t = [], i;
    for (i = 0; i < n - 1; i++) m.push((pts[i + 1][1] - pts[i][1]) / (pts[i + 1][0] - pts[i][0]));
    t[0] = m[0]; t[n - 1] = m[n - 2];
    for (i = 1; i < n - 1; i++) t[i] = m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2;
    var d = 'M' + pts[0][0] + ',' + pts[0][1];
    for (i = 0; i < n - 1; i++) {
      var dx = (pts[i + 1][0] - pts[i][0]) / 3;
      d += ' C' + (pts[i][0] + dx) + ',' + (pts[i][1] + t[i] * dx) + ' ' + (pts[i + 1][0] - dx) + ',' + (pts[i + 1][1] - t[i + 1] * dx) + ' ' + pts[i + 1][0] + ',' + pts[i + 1][1];
    }
    return d;
  }

  var SVGNS = 'http://www.w3.org/2000/svg';
  function svgEl(tag, attrs) {
    var n = document.createElementNS(SVGNS, tag);
    Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    return n;
  }

  // Draws the line chart at the host's pixel width. `revealed` decides
  // whether it starts in its hidden (pre-animation) state or fully drawn.
  function drawLine(host, revealed) {
    var w = Math.round(host.clientWidth);
    if (w < 60) return null;
    var h = 240, pad = { l: 44, r: 16, t: 20, b: 30 };
    var max = 350, ticks = [0, 100, 200, 300];
    var pw = w - pad.l - pad.r, ph = h - pad.t - pad.b;
    var X = function (i) { return pad.l + (i / (IMPACT.length - 1)) * pw; };
    var Y = function (v) { return pad.t + ph - (v / max) * ph; };
    var svg = svgEl('svg', { width: w, height: h, viewBox: '0 0 ' + w + ' ' + h, role: 'img',
      'aria-label': 'Cumulative estimated impact by week: ' + IMPACT.map(function (p) { return p.label + ' $' + p.value; }).join(', ') });
    var defs = svgEl('defs');
    var grad = svgEl('linearGradient', { id: 'lc-fill', x1: '0', y1: '0', x2: '0', y2: '1' });
    var s1 = svgEl('stop', { offset: '0%' }); s1.style.stopColor = 'var(--color-app-green)'; s1.style.stopOpacity = '0.28';
    var s2 = svgEl('stop', { offset: '100%' }); s2.style.stopColor = 'var(--color-app-green)'; s2.style.stopOpacity = '0';
    grad.append(s1, s2); defs.appendChild(grad); svg.appendChild(defs);

    ticks.forEach(function (tv) {
      svg.appendChild(svgEl('line', { class: 'lc-grid' + (tv === 0 ? ' lc-grid--base' : ''), x1: pad.l, x2: w - pad.r, y1: Y(tv), y2: Y(tv) }));
      var lab = svgEl('text', { class: 'lc-tick', x: pad.l - 8, y: Y(tv) + 4, 'text-anchor': 'end' });
      lab.textContent = '$' + tv;
      svg.appendChild(lab);
    });
    // Thin the date labels when they'd collide.
    var step = pw / (IMPACT.length - 1) < 48 ? 2 : 1;
    IMPACT.forEach(function (p, i) {
      if (i % step && i !== IMPACT.length - 1) return;
      if (step === 2 && i === IMPACT.length - 2) return;
      var lab = svgEl('text', { class: 'lc-tick', x: X(i), y: h - 8, 'text-anchor': i === 0 ? 'start' : i === IMPACT.length - 1 ? 'end' : 'middle' });
      lab.textContent = p.label;
      svg.appendChild(lab);
    });

    var pts = IMPACT.map(function (p, i) { return [X(i), Y(p.value)]; });
    var d = smoothPath(pts);
    var area = svgEl('path', { d: d + ' L' + X(IMPACT.length - 1) + ',' + Y(0) + ' L' + X(0) + ',' + Y(0) + ' Z', fill: 'url(#lc-fill)', stroke: 'none' });
    var line = svgEl('path', { class: 'lc-line', d: d });
    var last = pts[pts.length - 1];
    var dot = svgEl('circle', { class: 'lc-dot', cx: last[0], cy: last[1], r: 4.5 });
    var end = svgEl('text', { class: 'lc-end', x: last[0], y: last[1] - 12, 'text-anchor': 'end' });
    end.textContent = '$' + IMPACT[IMPACT.length - 1].value;
    svg.append(area, line, dot, end);
    host.textContent = '';
    host.appendChild(svg);

    var len = line.getTotalLength();
    var api = {
      reveal: function () {
        line.style.transition = 'stroke-dashoffset 900ms cubic-bezier(0.22, 0.61, 0.36, 1)';
        line.style.strokeDashoffset = '0';
        [area, dot, end].forEach(function (n) {
          n.style.transition = 'opacity 450ms ease 900ms';
          n.style.opacity = '1';
        });
      }
    };
    line.style.strokeDasharray = len;
    if (revealed) {
      line.style.strokeDashoffset = '0';
    } else {
      line.style.strokeDashoffset = len;
      [area, dot, end].forEach(function (n) { n.style.opacity = '0'; });
    }
    return api;
  }

  function countUp(node, done) {
    var target = Number(node.dataset.statCount);
    var prefix = node.dataset.prefix || '';
    var duration = 700, start = Date.now();
    // Timer rather than requestAnimationFrame so it still lands on the final
    // figure in a background tab.
    var timer = setInterval(function () {
      var t = Math.min((Date.now() - start) / duration, 1);
      node.textContent = prefix + Math.round(target * (1 - Math.pow(1 - t, 3)));
      if (t >= 1) { clearInterval(timer); done(); }
    }, 30);
  }

  function initDashboardMotion(root) {
    root.querySelectorAll('[data-bars]').forEach(function (host) {
      buildBars(host, BAR_CHARTS[host.dataset.bars]);
    });

    var lineHost = root.querySelector('[data-line]');
    var lineApi = null, lineRevealed = !canAnimate;
    if (lineHost) {
      lineApi = drawLine(lineHost, lineRevealed);
      // Redraw at the new width; keep whatever state it was in.
      if ('ResizeObserver' in window) {
        var lastW = lineHost.clientWidth;
        new ResizeObserver(function () {
          var w = lineHost.clientWidth;
          if (Math.abs(w - lastW) < 2) return;
          lastW = w;
          lineApi = drawLine(lineHost, lineRevealed) || lineApi;
        }).observe(lineHost);
      }
    }

    if (!canAnimate) return; // final states are already showing
    root.classList.add('is-armed');

    var stats = Array.prototype.slice.call(root.querySelectorAll('.stat'));
    stats.forEach(function (s) {
      var n = s.querySelector('[data-stat-count]');
      n.textContent = (n.dataset.prefix || '') + '0';
    });

    function reveal(target) {
      if (target.matches('[data-stats]')) {
        stats.forEach(function (s) {
          countUp(s.querySelector('[data-stat-count]'), function () { s.classList.add('is-in'); });
        });
      } else if (target.matches('[data-bars]')) {
        target.classList.add('is-in');
      } else if (target.matches('[data-line]')) {
        lineRevealed = true;
        if (lineApi) lineApi.reveal();
      }
    }

    // Each piece plays once, the first time it is actually on screen. A hidden
    // tab panel never intersects, so switching tabs doesn't replay anything.
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        io.unobserve(entry.target);
        reveal(entry.target);
      });
    }, { threshold: 0.35 });
    root.querySelectorAll('[data-stats], [data-bars], [data-line]').forEach(function (n) { io.observe(n); });
  }

  // -- Vertical chart: hover / focus / tap a bar ------------------------------
  // Dims the other rows, lifts the active one, and fills a readout with
  // figures derived from the counts on the rows themselves (share of all
  // mentions, and how many times the gym count it is). Click or Enter pins a
  // row so it survives moving the pointer away and works on touch.
  function initVerticalChart(chart) {
    var rows = Array.prototype.slice.call(chart.querySelectorAll('.bd-chart-row[data-count]'));
    var readout = chart.parentElement.querySelector('[data-op-readout]');
    if (!rows.length || !readout) return;
    var hintHTML = readout.innerHTML;
    var total = rows.reduce(function (sum, r) { return sum + Number(r.dataset.count); }, 0);
    var gyms = rows.filter(function (r) { return /gym/i.test(r.dataset.name); })[0];
    var pinned = null;

    function render(row) {
      chart.classList.toggle('has-active', !!row);
      rows.forEach(function (r) { r.classList.toggle('is-active', r === row); });
      if (!row) { readout.innerHTML = hintHTML; return; }
      var n = Number(row.dataset.count);
      var pct = Math.round((n / total) * 100);
      var bits = [n + ' mentions', pct + '% of all ' + total + ' vertical mentions'];
      if (gyms && row !== gyms) bits.push((n / Number(gyms.dataset.count)).toFixed(1).replace(/\.0$/, '') + '\u00d7 the gym count');
      readout.textContent = '';
      var title = document.createElement('p');
      title.className = 'op-chart-readout__title';
      title.textContent = row.dataset.name + (row.dataset.note ? ' \u00b7 ' + row.dataset.note : '');
      var body = document.createElement('p');
      body.className = 'op-chart-readout__body';
      body.textContent = bits.join(' \u00b7 ');
      readout.append(title, body);
    }

    function settle() { render(pinned); }

    rows.forEach(function (row) {
      row.addEventListener('mouseenter', function () { render(row); });
      row.addEventListener('focus', function () { render(row); });
      row.addEventListener('mouseleave', settle);
      row.addEventListener('blur', settle);
      function toggle() {
        pinned = pinned === row ? null : row;
        rows.forEach(function (r) { r.setAttribute('aria-pressed', String(r === pinned)); });
        render(pinned || row);
      }
      row.addEventListener('click', toggle);
      row.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
      });
    });
  }

  // -- Count-up figure: runs 0 to the target once, when scrolled into view ----
  // Static markup already shows the final number, so with no JS, no
  // IntersectionObserver or reduced motion nothing changes. The width is
  // pinned to the final figure first so the centered number doesn't wobble.
  function initCountUp(el) {
    var target = Number(el.dataset.countup);
    var suffix = el.dataset.suffix || '';
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!target || reduce || !('IntersectionObserver' in window)) return;

    el.style.minWidth = el.getBoundingClientRect().width + 'px';
    el.textContent = '0' + suffix;

    var io = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      io.disconnect();
      var duration = 1600;
      var start = Date.now();
      // Time-based, on a timer rather than requestAnimationFrame, so it still
      // lands on the final figure if the tab is in the background.
      var timer = setInterval(function () {
        var t = Math.min((Date.now() - start) / duration, 1);
        var eased = 1 - Math.pow(1 - t, 3);
        el.textContent = Math.round(target * eased) + suffix;
        if (t >= 1) clearInterval(timer);
      }, 30);
    }, { threshold: 0.6 });
    io.observe(el);
  }

  function init() {
    document.querySelectorAll('[data-countup]').forEach(initCountUp);
    document.querySelectorAll('[data-op-chart]').forEach(initVerticalChart);
    document.querySelectorAll('[data-phone]').forEach(initPhone);
    document.querySelectorAll('[data-dash]').forEach(initDashboard);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
