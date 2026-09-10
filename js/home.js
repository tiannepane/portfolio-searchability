/*
  js/home.js — bento grid render + prompt box UI (homepage only).

  Renders the full project list as placeholder cards (title + category
  only), makes the prompt box sticky on scroll, previews each card's prompt
  into the box (hover/focus on hover-capable devices, a two-step tap on
  touch devices — CLAUDE.md §5), and wires the real query flow: submit →
  window.TianneChat.send() (js/chat.js, which calls /api/chat) → grid
  re-renders to just the matches → rail switches to match-indicator mode
  (js/rail.js, via the 'tianne:filtered' event) → Clear reverts both
  (CLAUDE.md §5/§6).
*/

(function () {
  const DATA_URL = '/data/projects.json';
  const STICKY_THRESHOLD = 96; // px scrolled before the prompt box floats

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
    article.className = `bento-card size-${project.size || 'sm'}`;
    article.dataset.category = project.category;
    article.dataset.projectId = project.id;
    article.dataset.previewed = 'false';

    const link = document.createElement('a');
    link.className = 'bento-card-link';
    link.href = (project.links && project.links.caseStudy) || '#';
    link.setAttribute('aria-label', `${project.title} — ${project.category}`);

    const category = document.createElement('span');
    category.className = 'bento-card-category';
    category.textContent = project.category;

    const title = document.createElement('h3');
    title.className = 'bento-card-title';
    title.textContent = project.title;

    const hint = document.createElement('span');
    hint.className = 'bento-card-hint';
    hint.textContent = 'Tap again to open';

    link.append(category, title, hint);
    article.append(link);
    return article;
  }

  function renderGrid(projects, emptyMessage) {
    const grid = document.querySelector('[data-grid]');
    if (!grid) return;
    grid.innerHTML = '';
    if (!projects.length && emptyMessage) {
      const empty = document.createElement('p');
      empty.className = 'bento-empty';
      empty.textContent = emptyMessage;
      grid.append(empty);
    } else {
      projects.forEach((project) => grid.append(createCard(project)));
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
    const projects = await loadProjects();
    renderGrid(projects);
    initCardPreview(projects);
    initPromptBoxSticky();
    initQueryFlow(projects);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
