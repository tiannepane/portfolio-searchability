/*
  js/chat.js — Tianne LLM logic, shared by the homepage prompt box (js/home.js)
  and the nav-toggle panel on every other page (js/shared-ui.js). Only ever
  talks to /api/chat — the API key never appears in this file or anywhere
  under js/ or in any .html file; it lives server-side only in
  api/chat.js, read from process.env (CLAUDE.md §6/§7/§12).

  No module system in this project, so this exposes a small public API on
  window.TianneChat rather than using import/export.
*/

(function () {
  const ENDPOINT = '/api/chat';
  const PROJECTS_URL = '/data/projects.json';

  let history = []; // [{role, content}, ...] — one shared thread per page load
  let projectsByIdPromise = null;

  function getPageContext() {
    const path = window.location.pathname;
    const projectMatch = path.match(/^\/projects\/([a-z0-9-]+)\.html$/i);
    if (projectMatch) return { page: 'project', projectId: projectMatch[1] };
    if (path === '/' || path === '/index.html') return { page: 'home', projectId: null };
    if (path === '/resume.html') return { page: 'resume', projectId: null };
    if (path === '/feedback.html') return { page: 'feedback', projectId: null };
    if (path === '/fun.html') return { page: 'fun', projectId: null };
    return { page: 'other', projectId: null };
  }

  function loadProjectsById() {
    if (!projectsByIdPromise) {
      projectsByIdPromise = fetch(PROJECTS_URL)
        .then((res) => (res.ok ? res.json() : []))
        .then((projects) => {
          const byId = {};
          projects.forEach((project) => {
            byId[project.id] = project;
          });
          return byId;
        })
        .catch(() => ({}));
    }
    return projectsByIdPromise;
  }

  // Sends a message, appends the turn to the shared history, and resolves
  // with { reply, relevantProjectIds, relevantProjects }. Throws an Error
  // with a user-safe message on failure — callers should catch and display it.
  async function send(message) {
    const trimmed = (message || '').trim();
    if (!trimmed) return null;

    const pageContext = getPageContext();

    let res;
    try {
      res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, history, pageContext }),
      });
    } catch (networkErr) {
      throw new Error("Couldn't reach Tianne — check your connection and try again.");
    }

    if (!res.ok) {
      let errorMessage = "Tianne couldn't respond just now — try again in a moment.";
      try {
        const errBody = await res.json();
        if (errBody && errBody.error) errorMessage = errBody.error;
      } catch (_parseErr) {
        // keep the generic message
      }
      throw new Error(errorMessage);
    }

    const data = await res.json();
    const reply = typeof data.reply === 'string' ? data.reply : '';
    const relevantProjectIds = Array.isArray(data.relevantProjectIds) ? data.relevantProjectIds : [];

    history.push({ role: 'user', content: trimmed });
    history.push({ role: 'assistant', content: reply });

    const projectsById = await loadProjectsById();
    const relevantProjects = relevantProjectIds.map((id) => projectsById[id]).filter(Boolean);

    return { reply, relevantProjectIds, relevantProjects };
  }

  function clearHistory() {
    history = [];
  }

  window.TianneChat = { send, clearHistory, getPageContext };
})();
