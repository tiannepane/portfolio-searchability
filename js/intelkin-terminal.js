/*
  js/intelkin-terminal.js — click/Enter-to-open behavior for the terminal
  repo card in the "Where It Is Now" section of projects/intelkin.html.
  Page-specific (only intelkin.html loads this) — not part of the shared
  nav/chat shell, so it doesn't belong in shared-ui.js/chat.js/home.js.

  The keydown listener is bound to the card element itself, not document,
  so Enter is only ever handled while the card is focused — nothing here
  intercepts Enter globally.
*/

(function () {
  // Types the hint onto the prompt line the first time the card is on screen.
  // The full text is already in the markup, so no JS or reduced motion just
  // shows it. Typed character by character (not a width animation) so it
  // wraps correctly on a narrow screen and the cursor stays at the end.
  function initTyping(card) {
    const el = card.querySelector('[data-typed]');
    if (!el || !('IntersectionObserver' in window)) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const text = el.textContent;
    el.textContent = '';

    const io = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting) return;
      io.disconnect();
      let i = 0;
      const timer = setInterval(() => {
        i += 1;
        el.textContent = text.slice(0, i);
        if (i >= text.length) clearInterval(timer);
      }, 55);
    }, { threshold: 0.6 });
    io.observe(card);
  }

  function initTerminalCard() {
    const card = document.querySelector('.terminal-card');
    if (!card) return;

    initTyping(card);

    const url = card.dataset.repoUrl;
    if (!url) return;

    function openRepo() {
      window.open(url, '_blank', 'noopener');
    }

    card.addEventListener('click', openRepo);

    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !event.metaKey && !event.ctrlKey && !event.altKey) {
        event.preventDefault();
        openRepo();
      }
    });
  }

  document.addEventListener('DOMContentLoaded', initTerminalCard);
})();
