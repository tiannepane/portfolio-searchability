/*
  js/shared-ui.js — injects the nav, the Ask Tianne side panel and the footer
  into every page, so the markup lives once here instead of being duplicated
  per file (CLAUDE.md §2/§12).

  The panel is a docked, non-modal side panel (a full-screen sheet below
  768px). On the homepage the hero search bar is the only input that starts a
  conversation, so the nav pill is left out there; on every other page the
  pill opens the same panel. The panel keeps a thread, streams answers as they
  are written, and saves its open state and thread in sessionStorage so it
  stays put across page loads until it is closed. It calls
  window.TianneChat.send() (js/chat.js), the only thing that talks to
  /api/chat, and exposes window.TiannePanel for the homepage.
  Every page includes:
    <div id="shared-nav"></div>
    <script src="/js/shared-ui.js" defer></script>
*/

(function () {
  const NAV_LINKS = [
    { href: '/index.html', label: 'Home' },
    // Resume has no on-site page — the tab opens the résumé PDF hosted on
    // Google Drive directly, in a new tab.
    { href: 'https://drive.google.com/file/d/1ynQ5cL5gl8soUbMdQFc6w_b3sWqDEdPl/view?usp=sharing', label: 'Resume', external: true },
    { href: '/feedback.html', label: 'Feedback' },
    { href: '/fun.html', label: 'Fun' },
  ];

  function isCurrentPage(href) {
    const path = window.location.pathname;
    if (href === '/index.html') {
      return path === '/' || path === '/index.html';
    }
    return path === href;
  }

  function buildNav() {
    const nav = document.createElement('nav');
    nav.className = 'site-nav';
    nav.setAttribute('aria-label', 'Primary');

    const brand = document.createElement('a');
    brand.className = 'site-nav-brand';
    brand.href = '/index.html';
    // Owner/role/tagline (CLAUDE.md §1) — three tiers fading from full
    // ink to lightest gray, see .site-nav-brand-* in components.css.
    const brandName = document.createElement('span');
    brandName.className = 'site-nav-brand-name';
    brandName.textContent = 'Tianne';
    const brandRole = document.createElement('span');
    brandRole.className = 'site-nav-brand-role';
    brandRole.textContent = 'Product Manager';
    const brandDetail = document.createElement('span');
    brandDetail.className = 'site-nav-brand-detail';
    brandDetail.textContent = '(client facing + ships weekly)';
    brand.append(brandName, brandRole, brandDetail);

    const list = document.createElement('ul');
    list.className = 'site-nav-list';
    NAV_LINKS.forEach(({ href, label, external }) => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = href;
      a.textContent = label;
      if (external) {
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
      } else if (isCurrentPage(href)) {
        a.setAttribute('aria-current', 'page');
      }
      li.append(a);
      list.append(li);
    });

    // The homepage's hero search bar is its one entry point, so no pill there.
    let toggle = null;
    if (!isCurrentPage('/index.html')) {
      toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'chat-toggle';
      toggle.textContent = 'Ask Tianne';
      toggle.id = 'tianne-toggle';
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-controls', 'tianne-panel');
    }

    nav.append(brand, list);
    if (toggle) nav.append(toggle);
    return { nav, toggle };
  }

  // --- Ask Tianne side panel ------------------------------------------------
  const STORAGE_KEY = 'tianne-thread-v1';
  const EMPTY_TEXT = "Ask about any project. I'll answer and point you to the right case study.";

  function makeEl(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function buildPanel() {
    const panel = makeEl('aside', 'tianne-panel');
    panel.id = 'tianne-panel';
    panel.setAttribute('aria-label', 'Ask Tianne');
    panel.inert = true; // closed: out of the tab order and the accessibility tree

    const header = makeEl('div', 'tianne-panel-header');
    const titles = makeEl('div', 'tianne-panel-titles');
    titles.append(makeEl('h2', 'tianne-panel-title', 'Tianne LLM'));
    const actions = makeEl('div', 'tianne-panel-actions');
    const newChatBtn = makeEl('button', 'tianne-panel-newchat', 'New chat');
    newChatBtn.type = 'button';
    const closeBtn = makeEl('button', 'tianne-panel-close', '×'); // ×
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', 'Close Ask Tianne panel');
    actions.append(newChatBtn, closeBtn);
    header.append(titles, actions);

    // Streaming text would be read out word by word, so the thread itself is
    // not a live region; the finished answer is announced once via `status`.
    const thread = makeEl('div', 'tianne-panel-body');
    thread.setAttribute('role', 'log');
    thread.setAttribute('aria-live', 'off');
    thread.setAttribute('tabindex', '0');
    thread.setAttribute('aria-label', 'Conversation with Tianne');

    const status = makeEl('p', 'sr-only');
    status.setAttribute('aria-live', 'polite');

    const form = makeEl('form', 'tianne-panel-form prompt-box');
    const label = makeEl('label', 'sr-only', 'Ask a follow-up question');
    label.setAttribute('for', 'tianne-panel-input');
    const input = makeEl('input', 'prompt-box-input');
    input.type = 'text';
    input.id = 'tianne-panel-input';
    input.placeholder = 'Ask a follow-up…';
    input.autocomplete = 'off';
    const submitBtn = makeEl('button', 'prompt-box-submit', 'Ask');
    submitBtn.type = 'submit';
    form.append(label, input, submitBtn);

    panel.append(header, thread, status, form);
    return { panel, closeBtn, newChatBtn, thread, status, form, input, submitBtn };
  }

  function wirePanel(parts, toggle) {
    const { panel, closeBtn, newChatBtn, thread, status, form, input, submitBtn } = parts;
    const root = document.documentElement;
    let messages = []; // [{ role, content, projectIds? }] — successful turns only
    let loading = false;

    // ---- persistence (sessionStorage; every access guarded: it can throw in
    // private windows or with site data blocked, and the panel must still work)
    function save() {
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ open: isOpen(), messages }));
      } catch (_err) {
        // not persisting is fine
      }
    }

    function load() {
      try {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        const data = raw ? JSON.parse(raw) : null;
        if (data && Array.isArray(data.messages)) return data;
      } catch (_err) {
        // ignore a corrupt or unavailable store
      }
      return { open: false, messages: [] };
    }

    // ---- rendering
    function showEmptyState() {
      thread.textContent = '';
      thread.append(makeEl('p', 'tianne-panel-placeholder', EMPTY_TEXT));
    }

    function clearEmptyState() {
      const placeholder = thread.querySelector('.tianne-panel-placeholder');
      if (placeholder) placeholder.remove();
    }

    function addUser(text) {
      clearEmptyState();
      const node = makeEl('p', 'tianne-msg tianne-msg--user', text);
      thread.append(node);
      return node;
    }

    function addAssistant(text, className) {
      clearEmptyState();
      const node = makeEl('p', `tianne-msg tianne-msg--assistant ${className || ''}`.trim(), text);
      thread.append(node);
      return node;
    }

    function addLinks(projects) {
      if (!projects || !projects.length) return;
      const list = makeEl('ul', 'tianne-panel-links');
      projects.forEach((project) => {
        const li = document.createElement('li');
        const a = makeEl('a', '', project.title);
        a.href = (project.links && project.links.caseStudy) || '#';
        li.append(a);
        list.append(li);
      });
      thread.append(list);
    }

    // When someone asks to see everything, point them back at the full grid.
    // On the homepage the grid has already been reset (js/home.js), so the link
    // just closes the panel; on other pages it goes to the homepage.
    function addBackToGrid() {
      const list = makeEl('ul', 'tianne-panel-links');
      const li = document.createElement('li');
      const a = makeEl('a', '', 'Back to all projects');
      a.href = '/index.html#projects';
      a.addEventListener('click', (event) => {
        if (isCurrentPage('/index.html')) {
          event.preventDefault();
          closePanel({ returnFocus: false });
          const grid = document.querySelector('[data-grid]');
          if (grid) grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
      li.append(a);
      list.append(li);
      thread.append(list);
    }

    function scrollToEnd() {
      thread.scrollTop = thread.scrollHeight;
    }

    async function renderSaved(saved) {
      messages = saved;
      thread.textContent = '';
      if (!messages.length) {
        showEmptyState();
        return;
      }
      for (const m of messages) {
        if (m.role === 'user') {
          addUser(m.content);
        } else {
          addAssistant(m.content);
          if (m.showAll) addBackToGrid();
          if (window.TianneChat && typeof window.TianneChat.getProjects === 'function' && m.projectIds && m.projectIds.length) {
            addLinks(await window.TianneChat.getProjects(m.projectIds));
          }
        }
      }
      scrollToEnd();
    }

    // ---- open / close
    function isOpen() {
      return panel.classList.contains('is-open');
    }

    function openPanel({ focus = true } = {}) {
      if (isOpen()) return;
      panel.inert = false;
      panel.classList.add('is-open');
      root.classList.add('tianne-panel-open');
      if (toggle) toggle.setAttribute('aria-expanded', 'true');
      document.addEventListener('keydown', onKeydown);
      if (focus) input.focus();
      save();
    }

    function closePanel({ returnFocus = true } = {}) {
      if (!isOpen()) return;
      const hadFocus = panel.contains(document.activeElement);
      panel.classList.remove('is-open');
      panel.inert = true;
      root.classList.remove('tianne-panel-open');
      if (toggle) toggle.setAttribute('aria-expanded', 'false');
      document.removeEventListener('keydown', onKeydown);
      if (returnFocus && hadFocus && toggle) toggle.focus();
      save();
    }

    function onKeydown(event) {
      if (event.key === 'Escape') closePanel();
    }

    // ---- asking
    function setBusy(busy) {
      loading = busy;
      input.disabled = busy;
      submitBtn.disabled = busy;
      submitBtn.textContent = busy ? 'Asking…' : 'Ask';
    }

    // Opens the panel, shows the question, streams the answer in, and
    // resolves with the chat result (or null on failure). Also announces the
    // answer to the page via a `tianne:answer` event (the homepage uses it to
    // filter its grid), for typed, suggested and follow-up questions alike.
    async function ask(question) {
      const q = (question || '').trim();
      if (!q || loading) return null;

      openPanel();
      if (!window.TianneChat) {
        addAssistant("Tianne isn't available right now. Try reloading the page.", 'tianne-msg--error');
        return null;
      }

      setBusy(true);
      addUser(q);
      const live = addAssistant('Thinking…', 'tianne-msg--pending');
      scrollToEnd();

      try {
        const result = await window.TianneChat.send(q, (textSoFar) => {
          live.classList.remove('tianne-msg--pending');
          live.textContent = textSoFar;
          scrollToEnd();
        });
        if (!result) return null;

        live.classList.remove('tianne-msg--pending');
        live.textContent = result.reply;
        if (result.showAllProjects) addBackToGrid();
        else addLinks(result.relevantProjects);

        messages.push({ role: 'user', content: q });
        messages.push({
          role: 'assistant',
          content: result.reply,
          projectIds: result.relevantProjectIds,
          showAll: result.showAllProjects === true,
        });
        save();
        status.textContent = result.reply;
        document.dispatchEvent(new CustomEvent('tianne:answer', { detail: { question: q, ...result } }));
        return result;
      } catch (err) {
        live.classList.remove('tianne-msg--pending');
        live.classList.add('tianne-msg--error');
        live.textContent = (err && err.message) || "Tianne couldn't respond just now. Try again in a moment.";
        status.textContent = live.textContent;
        return null;
      } finally {
        setBusy(false);
        scrollToEnd();
        if (isOpen()) input.focus();
      }
    }

    function resetConversation() {
      if (loading) return;
      messages = [];
      if (window.TianneChat) window.TianneChat.clearHistory();
      showEmptyState();
      status.textContent = '';
      save();
      document.dispatchEvent(new CustomEvent('tianne:reset'));
    }

    // ---- wiring
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const value = input.value.trim();
      if (!value) return;
      input.value = '';
      ask(value);
    });
    closeBtn.addEventListener('click', () => closePanel());
    newChatBtn.addEventListener('click', resetConversation);
    if (toggle) {
      toggle.addEventListener('click', () => {
        if (isOpen()) closePanel();
        else openPanel();
      });
    }

    window.TiannePanel = { ask, open: openPanel, close: closePanel, isOpen };

    // Restore the previous page's thread, and reopen if it was left open.
    const saved = load();
    if (saved.messages.length && window.TianneChat && typeof window.TianneChat.setHistory === 'function') {
      window.TianneChat.setHistory(saved.messages);
    }
    renderSaved(saved.messages).then(() => {
      if (saved.open) openPanel({ focus: false });
    });
  }

  // Contact links at the bottom of every page. Lives here once (like the nav)
  // so it can't drift between pages.
  const FOOTER_LINKS = [
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/tianne-pane/', external: true },
    { label: 'GitHub', href: 'https://github.com/tiannepane', external: true },
    { label: 'Email', href: 'mailto:nadykupane@gmail.com', external: false },
  ];

  function buildFooter() {
    const footer = document.createElement('footer');
    footer.className = 'site-footer';

    const nav = document.createElement('nav');
    nav.setAttribute('aria-label', 'Contact');

    const list = document.createElement('ul');
    list.className = 'site-footer-list';
    FOOTER_LINKS.forEach(({ label, href, external }) => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = href;
      a.textContent = label;
      if (external) {
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.setAttribute('aria-label', `${label} (opens in a new tab)`);
      }
      li.append(a);
      list.append(li);
    });

    nav.append(list);
    footer.append(nav);
    return footer;
  }

  function injectSharedUI() {
    const mount = document.querySelector('#shared-nav');
    if (!mount) return;

    const { nav, toggle } = buildNav();
    const panelParts = buildPanel();

    mount.append(nav);
    document.body.append(panelParts.panel);
    document.body.append(buildFooter());
    wirePanel(panelParts, toggle);
  }

  document.addEventListener('DOMContentLoaded', injectSharedUI);
})();
