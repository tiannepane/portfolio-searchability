/*
  js/shared-ui.js — injects the nav + Tianne LLM toggle/panel into every
  page, so the markup lives once here instead of being duplicated per file
  (CLAUDE.md §2/§12).

  The toggle opens/closes a panel that runs the same Tianne LLM chat as the
  homepage prompt box — same component, same backend, just without a grid
  alongside it (CLAUDE.md §1/§6). It calls window.TianneChat.send()
  (js/chat.js), which is the only thing that ever talks to /api/chat.
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

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'chat-toggle';
    toggle.textContent = 'Ask Tianne';
    toggle.id = 'tianne-toggle';
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-controls', 'tianne-panel');

    nav.append(brand, list, toggle);
    return { nav, toggle };
  }

  function buildPanel() {
    const panel = document.createElement('div');
    panel.className = 'tianne-panel';
    panel.id = 'tianne-panel';
    panel.hidden = true;
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Tianne LLM');

    const header = document.createElement('div');
    header.className = 'tianne-panel-header';

    const heading = document.createElement('h2');
    heading.className = 'tianne-panel-title';
    heading.textContent = 'Tianne LLM';

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'tianne-panel-close';
    closeBtn.setAttribute('aria-label', 'Close Tianne LLM panel');
    closeBtn.textContent = '×'; // ×

    header.append(heading, closeBtn);

    const form = document.createElement('form');
    form.className = 'tianne-panel-form prompt-box';

    const label = document.createElement('label');
    label.className = 'sr-only';
    label.setAttribute('for', 'tianne-panel-input');
    label.textContent = 'Ask about a project';

    const input = document.createElement('input');
    input.type = 'text';
    input.id = 'tianne-panel-input';
    input.className = 'prompt-box-input';
    input.placeholder = 'Ask Tianne…';
    input.autocomplete = 'off';

    const submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.className = 'prompt-box-submit';
    submitBtn.textContent = 'Ask';

    form.append(label, input, submitBtn);

    const body = document.createElement('div');
    body.className = 'tianne-panel-body';
    body.setAttribute('aria-live', 'polite');

    const placeholder = document.createElement('p');
    placeholder.className = 'tianne-panel-placeholder';
    placeholder.textContent = "Ask about any project — I'll answer and point you to the right case study.";
    body.append(placeholder);

    panel.append(header, form, body);
    return { panel, closeBtn, form, input, submitBtn, body };
  }

  function wirePanelToggle(toggle, panelParts) {
    const { panel, closeBtn, input } = panelParts;

    function onKeydown(event) {
      if (event.key === 'Escape') closePanel();
    }

    function onOutsideClick(event) {
      if (panel.contains(event.target) || toggle.contains(event.target)) return;
      closePanel({ returnFocus: false });
    }

    function openPanel() {
      panel.hidden = false;
      toggle.setAttribute('aria-expanded', 'true');
      document.addEventListener('keydown', onKeydown);
      document.addEventListener('click', onOutsideClick, true);
      input.focus();
    }

    function closePanel({ returnFocus = true } = {}) {
      if (panel.hidden) return;
      panel.hidden = true;
      toggle.setAttribute('aria-expanded', 'false');
      document.removeEventListener('keydown', onKeydown);
      document.removeEventListener('click', onOutsideClick, true);
      if (returnFocus) toggle.focus();
    }

    toggle.addEventListener('click', () => {
      if (panel.hidden) openPanel();
      else closePanel();
    });

    closeBtn.addEventListener('click', () => closePanel());
  }

  // Wires the panel's own mini prompt box to window.TianneChat.send() —
  // the same chat backend the homepage box uses (CLAUDE.md §6).
  function wirePanelChat({ form, input, submitBtn, body }) {
    let isLoading = false;

    function renderStatus(text) {
      body.innerHTML = '';
      const statusEl = document.createElement('p');
      statusEl.className = 'tianne-panel-placeholder';
      statusEl.textContent = text;
      body.append(statusEl);
    }

    function renderReply(reply, relevantProjects) {
      body.innerHTML = '';

      const replyEl = document.createElement('p');
      replyEl.className = 'tianne-panel-reply';
      replyEl.textContent = reply;
      body.append(replyEl);

      if (relevantProjects && relevantProjects.length) {
        const list = document.createElement('ul');
        list.className = 'tianne-panel-links';
        relevantProjects.forEach((project) => {
          const li = document.createElement('li');
          const a = document.createElement('a');
          a.href = (project.links && project.links.caseStudy) || '#';
          a.textContent = project.title;
          li.append(a);
          list.append(li);
        });
        body.append(list);
      }
    }

    function renderError(message) {
      body.innerHTML = '';
      const errorEl = document.createElement('p');
      errorEl.className = 'tianne-panel-error';
      errorEl.textContent = message;
      body.append(errorEl);
    }

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (isLoading) return;

      const value = input.value.trim();
      if (!value) return;

      if (!window.TianneChat) {
        renderError("Tianne isn't available right now — try reloading the page.");
        return;
      }

      isLoading = true;
      input.disabled = true;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Asking…';
      renderStatus('Thinking…');

      try {
        const result = await window.TianneChat.send(value);
        if (result) renderReply(result.reply, result.relevantProjects);
        input.value = '';
      } catch (err) {
        renderError((err && err.message) || "Tianne couldn't respond just now — try again in a moment.");
      } finally {
        isLoading = false;
        input.disabled = false;
        submitBtn.disabled = false;
        submitBtn.textContent = 'Ask';
      }
    });
  }

  function injectSharedUI() {
    const mount = document.querySelector('#shared-nav');
    if (!mount) return;

    const { nav, toggle } = buildNav();
    const panelParts = buildPanel();

    mount.append(nav);
    document.body.append(panelParts.panel);
    wirePanelToggle(toggle, panelParts);
    wirePanelChat(panelParts);
  }

  document.addEventListener('DOMContentLoaded', injectSharedUI);
})();
