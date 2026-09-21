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
  //
  // onDelta (optional): called with the reply text so far each time more of
  // it arrives, so the UI can show the answer being written. The server
  // streams; if it ever answers with plain JSON instead, this still works and
  // onDelta is simply called once, with the whole reply.
  async function send(message, onDelta) {
    const trimmed = (message || '').trim();
    if (!trimmed) return null;

    const pageContext = getPageContext();

    let res;
    try {
      res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, history, pageContext, stream: true }),
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

    let reply = '';
    let relevantProjectIds = [];

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('text/event-stream') && res.body) {
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let pending = '';
      let finished = false;
      let soFar = '';

      function handleEvent(raw) {
        const line = raw.split('\n').find((l) => l.startsWith('data:'));
        if (!line) return;
        let evt;
        try {
          evt = JSON.parse(line.slice(5).trim());
        } catch (_e) {
          return;
        }
        if (evt.error) throw new Error(evt.error);
        if (typeof evt.delta === 'string') {
          soFar += evt.delta;
          if (onDelta) onDelta(soFar);
        }
        if (evt.done) {
          finished = true;
          reply = typeof evt.reply === 'string' ? evt.reply : soFar;
          relevantProjectIds = Array.isArray(evt.relevantProjectIds) ? evt.relevantProjectIds : [];
        }
      }

      try {
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          pending += decoder.decode(value, { stream: true });
          let idx;
          while ((idx = pending.indexOf('\n\n')) !== -1) {
            handleEvent(pending.slice(0, idx));
            pending = pending.slice(idx + 2);
          }
        }
        if (pending.trim()) handleEvent(pending);
      } catch (streamErr) {
        throw new Error(
          (streamErr && streamErr.message) || "Tianne couldn't respond just now — try again in a moment."
        );
      }
      if (!finished) throw new Error("Tianne couldn't respond just now — try again in a moment.");
      if (onDelta) onDelta(reply); // settle on the final, validated text
    } else {
      const data = await res.json();
      reply = typeof data.reply === 'string' ? data.reply : '';
      relevantProjectIds = Array.isArray(data.relevantProjectIds) ? data.relevantProjectIds : [];
      if (onDelta) onDelta(reply);
    }

    history.push({ role: 'user', content: trimmed });
    history.push({ role: 'assistant', content: reply });

    const projectsById = await loadProjectsById();
    const relevantProjects = relevantProjectIds.map((id) => projectsById[id]).filter(Boolean);

    return { reply, relevantProjectIds, relevantProjects };
  }

  function clearHistory() {
    history = [];
  }

  // The panel saves its thread in sessionStorage so it survives page loads;
  // on the next page it hands the plain [{role, content}] turns back here so
  // follow-up questions keep their context.
  function setHistory(turns) {
    history = Array.isArray(turns)
      ? turns
          .filter((t) => t && (t.role === 'user' || t.role === 'assistant') && typeof t.content === 'string')
          .map((t) => ({ role: t.role, content: t.content }))
      : [];
  }

  // Resolves project ids to their projects.json entries (for the link list
  // under a restored answer).
  async function getProjects(ids) {
    const byId = await loadProjectsById();
    return (ids || []).map((id) => byId[id]).filter(Boolean);
  }

  window.TianneChat = { send, clearHistory, setHistory, getProjects, getPageContext };
})();
