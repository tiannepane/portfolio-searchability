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
  function initTerminalCard() {
    const card = document.querySelector('.terminal-card');
    if (!card) return;

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
