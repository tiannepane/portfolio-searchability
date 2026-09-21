/*
  js/home.js — homepage project grid render + prompt box UI.

  The homepage shows a curated six cards, not the full project list —
  HOME_COLUMNS below is the single source of truth for which projects
  are visible and which of the two explicit columns each sits in
  (2026-09-11). Every other project's data stays intact in
  data/projects.json and its case-study page stays reachable directly;
  it's just off this grid, including from Tianne search (the visible
  set is what search filters against too — see initQueryFlow).

  Makes the prompt box sticky on scroll, previews each card's prompt
  into the box (hover/focus on hover-capable devices, a two-step tap on
  touch devices — CLAUDE.md §5), and wires the real query flow: submit →
  window.TianneChat.send() (js/chat.js, which calls /api/chat) → grid
  re-renders to just the matches within the visible six → Clear reverts
  to the full six (CLAUDE.md §5/§6).
*/

(function () {
  const DATA_URL = '/data/projects.json';
  const STICKY_THRESHOLD = 96; // px scrolled before the prompt box floats

  // Homepage curation (2026-09-11): exactly these six, in these two
  // columns, top to bottom. Not derived from the data — this is a
  // deliberate homepage-only arrangement, independent of each project's
  // own category/size fields.
  const HOME_COLUMNS = {
    left: ['intelkin', 'boardy', 'river-ai', 'looped'],
    right: ['langchain-aggregator', 'research-aggregator', 'airbnb'],
  };
  const HOME_VISIBLE_IDS = [...HOME_COLUMNS.left, ...HOME_COLUMNS.right];

  async function loadProjects() {
    try {
      const res = await fetch(DATA_URL);
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      return await res.json();
    } catch (err) {
      console.error('[home.js] Could not load', DATA_URL, err);
      return [];
    }
  }

  function createCard(project) {
    const article = document.createElement('article');
    // size-* is kept for data completeness but nothing in CSS reads it —
    // the grid moved to independent-height masonry (2026-09-10).
    article.className = `bento-card size-${project.size || 'sm'}`;
    article.dataset.category = project.category;
    article.dataset.projectId = project.id;
    article.dataset.previewed = 'false';

    const link = document.createElement('a');
    link.className = 'bento-card-link';
    // Most cards open their in-site case study; a project with no case
    // study (e.g. an external product) links straight out instead —
    // opened in a new tab so the visitor never loses the grid.
    const caseStudyHref = project.links && project.links.caseStudy;
    const externalHref = project.links && project.links.external;
    link.href = caseStudyHref || externalHref || '#';
    if (!caseStudyHref && externalHref) {
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    }
    link.setAttribute('aria-label', `${project.title} — ${project.category}`);

    const thumbWrap = document.createElement('div');
    thumbWrap.className = 'bento-card-thumb-wrap';

    if (project.thumbnail) {
      // Respect prefers-reduced-motion: a still frame instead of an
      // animated gif or an autoplaying video.
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (project.thumbnailType === 'video' && !reduceMotion) {
        const thumb = document.createElement('video');
        thumb.className = 'bento-card-thumb';
        thumb.autoplay = true;
        thumb.loop = true;
        thumb.muted = true;
        thumb.playsInline = true;
        thumb.setAttribute('aria-hidden', 'true'); // decorative — the link's aria-label already names the project
        thumb.src = project.thumbnail;
        // Gives the element a real intrinsic size immediately (avoiding
        // the browser's 300x150 video default, and the layout shift that
        // causes in a masonry column) and shows a correct still frame if
        // the video is slow to load or fails.
        if (project.thumbnailPoster) thumb.poster = project.thumbnailPoster;
        thumbWrap.append(thumb);
      } else {
        const thumb = document.createElement('img');
        thumb.className = 'bento-card-thumb';
        thumb.alt = ''; // decorative — the link's aria-label already names the project
        thumb.src = reduceMotion && project.thumbnailPoster ? project.thumbnailPoster : project.thumbnail;
        thumbWrap.append(thumb);
      }
    } else {
      // No real thumbnail yet — the site's existing case-study
      // media-placeholder convention, sized for a card thumb slot.
      const placeholder = document.createElement('div');
      placeholder.className = 'bento-card-thumb-placeholder media-placeholder';
      placeholder.setAttribute('role', 'img');
      placeholder.setAttribute('aria-label', `${project.title} — thumbnail pending`);
      placeholder.textContent = 'COMING SOON';
      thumbWrap.append(placeholder);
    }

    const caption = document.createElement('div');
    caption.className = 'bento-card-caption';

    const tagline = document.createElement('h3');
    tagline.className = 'bento-card-tagline';
    tagline.textContent = project.tagline;
    // .bento-card-tagline forces a single line (nowrap + ellipsis,
    // components.css) so a long tagline can get visually truncated on a
    // narrow card — the native title tooltip keeps the full text
    // reachable on hover even when that happens.
    tagline.title = project.tagline;

    const meta = document.createElement('p');
    meta.className = 'bento-card-meta';
    // A featured project can carry a single pre-composed attribution
    // string (e.g. "Recollab AI / Contract 2026") instead of the default
    // name/status/year template — .bento-card-meta's own uppercase
    // styling applies to either shape, so this is typed in mixed case.
    meta.textContent = project.attribution || `${project.title.toUpperCase()} • ${project.status} • ${project.year}`;

    caption.append(tagline, meta);

    const hint = document.createElement('span');
    hint.className = 'bento-card-hint';
    hint.textContent = 'Tap again to open';

    link.append(thumbWrap, caption, hint);
    article.append(link);
    return article;
  }

  // projects: whatever subset should render right now (the curated six by
  // default, or a query's matches within that same six). Column
  // membership always comes from HOME_COLUMNS, never from render order —
  // that's what guarantees a card lands in its designated column
  // regardless of card height or which subset is currently showing.
  function renderGrid(projects, emptyMessage) {
    const leftColumn = document.querySelector('[data-grid-column="left"]');
    const rightColumn = document.querySelector('[data-grid-column="right"]');
    const emptyEl = document.querySelector('[data-grid-empty]');
    if (!leftColumn || !rightColumn) return;

    leftColumn.innerHTML = '';
    rightColumn.innerHTML = '';

    const byId = {};
    projects.forEach((project) => {
      byId[project.id] = project;
    });

    const leftIds = HOME_COLUMNS.left.filter((id) => byId[id]);
    const rightIds = HOME_COLUMNS.right.filter((id) => byId[id]);

    leftIds.forEach((id) => leftColumn.append(createCard(byId[id])));
    rightIds.forEach((id) => rightColumn.append(createCard(byId[id])));

    const isEmpty = leftIds.length === 0 && rightIds.length === 0;
    if (emptyEl) {
      emptyEl.hidden = !(isEmpty && emptyMessage);
      emptyEl.textContent = isEmpty && emptyMessage ? emptyMessage : '';
    }

    document.dispatchEvent(new CustomEvent('bento:grid-rendered'));
  }

  // Hover-capable, precise-pointer devices get hover/focus preview + a
  // normal single click-through. Everything else (touch) gets the
  // two-step tap in initTapPreview. See CLAUDE.md §5.
  function isHoverCapable() {
    return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  }

  function initCardPreview(projects) {
    const grid = document.querySelector('[data-grid]');
    const input = document.querySelector('.prompt-box-input');
    if (!grid || !input) return;

    const projectsById = {};
    projects.forEach((project) => {
      projectsById[project.id] = project;
    });

    if (isHoverCapable()) {
      initHoverPreview(grid, input, projectsById);
    } else {
      initTapPreview(grid, input, projectsById);
    }
  }

  function initHoverPreview(grid, input, projectsById) {
    let savedValue = null;

    function preview(card) {
      const project = projectsById[card.dataset.projectId];
      if (!project || !project.previewPrompt) return;
      if (savedValue === null) savedValue = input.value;
      input.value = project.previewPrompt;
      input.classList.add('is-preview');
    }

    function restore() {
      if (savedValue === null) return;
      input.value = savedValue;
      savedValue = null;
      input.classList.remove('is-preview');
    }

    grid.addEventListener('pointerover', (event) => {
      const card = event.target.closest('.bento-card');
      if (card) preview(card);
    });

    grid.addEventListener('pointerout', (event) => {
      const card = event.target.closest('.bento-card');
      if (!card) return;
      if (card.contains(event.relatedTarget)) return; // still inside the same card
      restore();
    });

    // Keyboard-focus parity: tabbing to a card link previews it too.
    grid.addEventListener('focusin', (event) => {
      const card = event.target.closest('.bento-card');
      if (card) preview(card);
    });

    grid.addEventListener('focusout', (event) => {
      const card = event.target.closest('.bento-card');
      if (!card) return;
      if (card.contains(event.relatedTarget)) return;
      restore();
    });

    // Typing in the box by hand cancels any pending restore, so a stray
    // mouseout right after doesn't clobber what the visitor typed.
    input.addEventListener('input', () => {
      savedValue = null;
      input.classList.remove('is-preview');
    });
  }

  function initTapPreview(grid, input, projectsById) {
    grid.addEventListener('click', (event) => {
      const link = event.target.closest('.bento-card-link');
      if (!link) return;
      const card = link.closest('.bento-card');
      const project = card && projectsById[card.dataset.projectId];
      if (!project) return;

      if (card.dataset.previewed === 'true') {
        return; // second tap on an already-previewed card: let it navigate
      }

      event.preventDefault();
      grid.querySelectorAll('.bento-card[data-previewed="true"]').forEach((other) => {
        if (other !== card) other.dataset.previewed = 'false';
      });
      card.dataset.previewed = 'true';
      input.value = project.previewPrompt || '';
      input.classList.add('is-preview');
    });

    input.addEventListener('input', () => {
      input.classList.remove('is-preview');
    });
  }

  function initPromptBoxSticky() {
    const wrap = document.querySelector('[data-prompt-box-wrap]');
    if (!wrap) return;

    let ticking = false;

    function update() {
      wrap.classList.toggle('is-floating', window.scrollY > STICKY_THRESHOLD);
      ticking = false;
    }

    window.addEventListener(
      'scroll',
      () => {
        if (!ticking) {
          requestAnimationFrame(update);
          ticking = true;
        }
      },
      { passive: true }
    );

    update();
  }

  function setResultStatus(text) {
    const statusEl = document.querySelector('[data-result-status]');
    if (statusEl) statusEl.textContent = text;
  }

  function setReplyText(text) {
    const replyEl = document.querySelector('[data-prompt-box-reply]');
    if (!replyEl) return;
    replyEl.textContent = text || '';
    replyEl.hidden = !text;
  }

  function setClearButtonVisible(visible) {
    const clearBtn = document.querySelector('[data-prompt-box-clear]');
    if (clearBtn) clearBtn.hidden = !visible;
  }

  // Wires submit → query → filtered grid + match-indicator rail, and
  // Clear → back to the full grid + browse-mode rail. See CLAUDE.md §5/§6.
  function initQueryFlow(allProjects) {
    const form = document.querySelector('[data-prompt-box]');
    const input = document.querySelector('.prompt-box-input');
    const clearBtn = document.querySelector('[data-prompt-box-clear]');
    const submitBtn = document.querySelector('.prompt-box-submit');
    if (!form || !input || !submitBtn) return;

    let isLoading = false;

    function setLoading(loading) {
      isLoading = loading;
      input.disabled = loading;
      submitBtn.disabled = loading;
      submitBtn.textContent = loading ? 'Asking…' : 'Ask';
    }

    function applyFiltered(matchedIds, reply) {
      const filtered = allProjects.filter((project) => matchedIds.includes(project.id));
      renderGrid(filtered, 'No projects matched — try rephrasing, or clear to see everything.');
      setReplyText(reply);
      setClearButtonVisible(true);

      const matchedCategories = Array.from(new Set(filtered.map((project) => project.category)));
      document.dispatchEvent(new CustomEvent('tianne:filtered', { detail: { categories: matchedCategories } }));

      setResultStatus(
        filtered.length
          ? `Showing ${filtered.length} matching project${filtered.length === 1 ? '' : 's'}.`
          : 'No projects matched your question.'
      );
    }

    function revertToAll() {
      renderGrid(allProjects);
      setReplyText('');
      setClearButtonVisible(false);
      document.dispatchEvent(new CustomEvent('tianne:cleared'));
      setResultStatus(`Showing all ${allProjects.length} projects.`);
    }

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (isLoading) return;

      const value = input.value.trim();
      if (!value) return;

      if (!window.TianneChat) {
        setReplyText("Tianne isn't available right now — try reloading the page.");
        return;
      }

      setLoading(true);
      setReplyText('');
      try {
        const result = await window.TianneChat.send(value);
        if (result) applyFiltered(result.relevantProjectIds, result.reply);
      } catch (err) {
        setReplyText((err && err.message) || "Tianne couldn't respond just now — try again in a moment.");
      } finally {
        setLoading(false);
      }
    });

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        input.value = '';
        input.classList.remove('is-preview');
        if (window.TianneChat) window.TianneChat.clearHistory();
        revertToAll();
        input.focus();
      });
    }
  }

  async function init() {
    const allProjects = await loadProjects();
    // Homepage-visible set only — search filters against this same list
    // (see initQueryFlow), so a project left off HOME_COLUMNS is fully
    // hidden, not just absent from the default view.
    const visibleProjects = allProjects.filter((project) => HOME_VISIBLE_IDS.includes(project.id));
    renderGrid(visibleProjects);
    initCardPreview(visibleProjects);
    initPromptBoxSticky();
    initQueryFlow(visibleProjects);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
