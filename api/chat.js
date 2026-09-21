/*
  api/chat.js — Tianne LLM serverless function (Vercel Node runtime, CommonJS).

  Loads data/projects.json + data/profile.md into the system prompt, calls
  the Claude API for structured output, and returns
  { reply: string, relevantProjectIds: string[] } — see CLAUDE.md §6.

  ANTHROPIC_API_KEY is read from process.env only. It is never hardcoded,
  never echoed back to the client, and this is the only file in the project
  that touches it — see CLAUDE.md §12.

  Uses plain fetch() against the Messages API (no @anthropic-ai/sdk), by
  request, to keep this a zero-dependency, zero-build-step project per
  CLAUDE.md §2/§12.
*/

const fs = require('fs');
const path = require('path');

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';
const MODEL = 'claude-opus-5';
const MAX_TOKENS = 700; // replies are capped to ~60 words by the persona rules; this is only a safety ceiling
const REQUEST_TIMEOUT_MS = 30000;
const MAX_RETRIES = 2; // retries on 429/5xx only

const MAX_HISTORY_TURNS = 20;
const MAX_MESSAGE_CHARS = 4000;

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    reply: { type: 'string' },
    relevantProjectIds: { type: 'array', items: { type: 'string' } },
    showAllProjects: { type: 'boolean' },
  },
  required: ['reply', 'relevantProjectIds', 'showAllProjects'],
  additionalProperties: false,
};

// Memoized across warm invocations of the same function instance — the
// project data doesn't change mid-deploy, no need to re-read disk per request.
let cachedPromptData = null;

function loadPromptData() {
  if (cachedPromptData) return cachedPromptData;

  const projectsPath = path.join(process.cwd(), 'data', 'projects.json');
  const profilePath = path.join(process.cwd(), 'data', 'profile.md');
  const personaPath = path.join(process.cwd(), 'data', 'tianne-persona.md');

  const projects = JSON.parse(fs.readFileSync(projectsPath, 'utf8'));
  const profile = fs.readFileSync(profilePath, 'utf8');
  // Voice, length rules, the two hard rules and the anchor answers. Optional
  // so a missing file degrades to the older behavior instead of a 502.
  let persona = '';
  try {
    persona = fs.readFileSync(personaPath, 'utf8');
  } catch (_err) {
    console.warn('[api/chat] data/tianne-persona.md not found; continuing without it.');
  }
  const validIds = projects.map((p) => p.id);

  const projectsBlock = projects
    .map((p) =>
      [
        `- id: ${p.id}`,
        `  title: ${p.title}`,
        `  category: ${p.category}`,
        `  summary: ${p.summary || '(none yet)'}`,
        `  tags: ${(p.tags || []).join(', ') || '(none)'}`,
        `  how I think about it: ${p.narrative || '(none yet)'}`,
      ].join('\n')
    )
    .join('\n\n');

  const systemPromptBase = [
    "You are Tianne's portfolio assistant, speaking as Tianne (first person) to visitors — mostly recruiters and collaborators browsing the site.",
    'Be conversational and specific, the way Tianne herself would answer — never a generic support-bot tone. A few sentences is usually enough.',
    '',
    '## About Tianne',
    profile.trim(),
    '',
    '## Persona, voice and length rules (these override any looser guidance below)',
    persona.trim() || '(no persona file loaded)',
    '',
    '## Projects',
    projectsBlock,
    '',
    '## How to answer',
    '- Ground every answer in the persona guide, the project narratives and the profile above. The persona guide is the most authoritative source: if it covers a fact that a project entry below leaves as a placeholder, use the guide. Where a detail is a placeholder like "[NEEDS REAL CONTENT]" or "(none yet)" and the guide does not cover it either, do not invent specifics — say plainly that the detail isn\'t written up yet rather than guessing.',
    `- relevantProjectIds must only ever contain ids from this exact list: ${validIds.join(', ')}. Never invent an id, and never include an id the message doesn't genuinely relate to.`,
    "- relevantProjectIds is only for projects the visitor's message is actually about. A project you merely suggest as a next step or a call to action does NOT belong in it. General questions (where I work, hobbies, how to reach me, availability, salary) get an empty relevantProjectIds array, even if your reply points to a case study.",
    "- showAllProjects: set it to true ONLY when the visitor asks to browse or see the whole set: 'show me all your projects', 'what projects do you have', the whole portfolio or grid, 'show me your work', or asks to go back, reset or clear the view. Questions about accomplishments or track record ('what have you shipped', 'what have you achieved', 'what's your experience') are NOT browse requests: answer them from the bio and persona guide, and set it to false. Never call concept or case-study work 'shipped'. When it is true, return an empty relevantProjectIds array and keep the reply to one or two short sentences saying the full grid is back on the page.",
  ].join('\n');

  cachedPromptData = { validIds, systemPromptBase };
  return cachedPromptData;
}

function describePageContext(pageContext) {
  if (pageContext && typeof pageContext === 'object') {
    if (pageContext.page === 'project' && typeof pageContext.projectId === 'string') {
      return `The visitor is on the "${pageContext.projectId}" case-study page right now — prioritize that project in your answer, and feel free to point toward a related one if it fits.`;
    }
    if (typeof pageContext.page === 'string' && pageContext.page !== 'home') {
      return `The visitor opened this from the "${pageContext.page}" page — there's no project grid visible there.`;
    }
  }
  return "The visitor is on the homepage, browsing the full project grid.";
}

function sanitizeHistory(history) {
  if (!Array.isArray(history)) return [];
  return history
    .filter(
      (turn) =>
        turn &&
        (turn.role === 'user' || turn.role === 'assistant') &&
        typeof turn.content === 'string' &&
        turn.content.trim()
    )
    .slice(-MAX_HISTORY_TURNS)
    .map((turn) => ({ role: turn.role, content: turn.content.slice(0, MAX_MESSAGE_CHARS) }));
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callClaudeOnce(systemPrompt, messages, apiKey) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: systemPrompt,
        messages,
        output_config: {
          effort: 'medium',
          format: { type: 'json_schema', schema: RESPONSE_SCHEMA },
        },
      }),
      signal: controller.signal,
    });

    const bodyText = await res.text();

    if (!res.ok) {
      let message = `Claude API error (${res.status})`;
      try {
        const parsedError = JSON.parse(bodyText);
        if (parsedError && parsedError.error && parsedError.error.message) {
          message = parsedError.error.message;
        }
      } catch (_parseErr) {
        // keep the generic message
      }
      const err = new Error(message);
      err.status = res.status;
      err.retryable = res.status === 429 || res.status >= 500;
      throw err;
    }

    return JSON.parse(bodyText);
  } finally {
    clearTimeout(timeoutId);
  }
}

async function callClaudeWithRetry(systemPrompt, messages, apiKey) {
  let lastErr;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await callClaudeOnce(systemPrompt, messages, apiKey);
    } catch (err) {
      lastErr = err;
      if (!err.retryable || attempt === MAX_RETRIES) throw err;
      await sleep(300 * 2 ** attempt); // 300ms, 600ms, ...
    }
  }
  throw lastErr;
}

// --- Streaming ----------------------------------------------------------
// The model answers as JSON ({ reply, relevantProjectIds }) with `reply`
// first. While the JSON is still arriving, this pulls the growing `reply`
// string out of it (handling JSON escapes) so the visitor can watch the
// answer being written. The ids arrive at the end, in the final event.

function makeReplyExtractor() {
  let buf = '';
  let started = false;
  let i = 0;
  let done = false;
  const ESCAPES = { n: '\n', t: '\t', r: '\r', '"': '"', '\\': '\\', '/': '/', b: '\b', f: '\f' };

  return function push(chunk) {
    buf += chunk;
    let out = '';
    if (!started) {
      const m = /"reply"\s*:\s*"/.exec(buf);
      if (!m) return '';
      started = true;
      i = m.index + m[0].length;
    }
    while (i < buf.length && !done) {
      const ch = buf[i];
      if (ch === '"') {
        done = true;
        break;
      }
      if (ch === '\\') {
        if (i + 1 >= buf.length) break; // escape split across chunks: wait
        const next = buf[i + 1];
        if (next === 'u') {
          if (i + 6 > buf.length) break;
          out += String.fromCharCode(parseInt(buf.slice(i + 2, i + 6), 16));
          i += 6;
          continue;
        }
        out += ESCAPES[next] !== undefined ? ESCAPES[next] : next;
        i += 2;
        continue;
      }
      out += ch;
      i += 1;
    }
    return out;
  };
}

// Opens the streaming request, retrying only before any bytes are read
// (429 / 5xx), same policy as the non-streaming path.
async function openClaudeStream(systemPrompt, messages, apiKey, signal) {
  let lastErr;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(ANTHROPIC_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': ANTHROPIC_VERSION,
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: MAX_TOKENS,
          stream: true,
          system: systemPrompt,
          messages,
          output_config: {
            effort: 'medium',
            format: { type: 'json_schema', schema: RESPONSE_SCHEMA },
          },
        }),
        signal,
      });
      if (res.ok) return res;

      const bodyText = await res.text();
      let message = `Claude API error (${res.status})`;
      try {
        const parsedError = JSON.parse(bodyText);
        if (parsedError && parsedError.error && parsedError.error.message) message = parsedError.error.message;
      } catch (_parseErr) {
        // keep the generic message
      }
      const err = new Error(message);
      err.status = res.status;
      err.retryable = res.status === 429 || res.status >= 500;
      throw err;
    } catch (err) {
      lastErr = err;
      if (!err.retryable || attempt === MAX_RETRIES) throw err;
      await sleep(300 * 2 ** attempt);
    }
  }
  throw lastErr;
}

// Reads Claude's server-sent events, calling onText with each text delta.
// Resolves with the full concatenated text.
async function pumpClaudeStream(upstream, onText) {
  const decoder = new TextDecoder();
  let pending = '';
  let full = '';
  let stopReason = null;

  function handleEvent(raw) {
    const dataLine = raw.split('\n').find((line) => line.startsWith('data:'));
    if (!dataLine) return;
    let evt;
    try {
      evt = JSON.parse(dataLine.slice(5).trim());
    } catch (_e) {
      return;
    }
    if (evt.type === 'error') {
      throw new Error((evt.error && evt.error.message) || 'Claude stream error');
    }
    if (evt.type === 'content_block_delta' && evt.delta && evt.delta.type === 'text_delta') {
      full += evt.delta.text;
      onText(evt.delta.text);
    }
    if (evt.type === 'message_delta' && evt.delta && evt.delta.stop_reason) {
      stopReason = evt.delta.stop_reason;
    }
  }

  for await (const chunk of upstream.body) {
    pending += decoder.decode(chunk, { stream: true });
    let idx;
    while ((idx = pending.indexOf('\n\n')) !== -1) {
      handleEvent(pending.slice(0, idx));
      pending = pending.slice(idx + 2);
    }
  }
  if (pending.trim()) handleEvent(pending);
  if (stopReason === 'max_tokens') throw new Error('The reply was cut off.');
  return full;
}

async function streamReply(res, systemPrompt, messages, apiKey, validIds) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    // Errors here happen before any bytes are sent, so they still get a
    // proper HTTP status from the caller's catch.
    const upstream = await openClaudeStream(systemPrompt, messages, apiKey, controller.signal);

    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('X-Accel-Buffering', 'no');
    const send = (obj) => res.write(`data: ${JSON.stringify(obj)}\n\n`);

    try {
      const extract = makeReplyExtractor();
      const fullText = await pumpClaudeStream(upstream, (textDelta) => {
        const visible = extract(textDelta);
        if (visible) send({ delta: visible });
      });

      const parsed = JSON.parse(fullText);
      const relevantProjectIds = Array.isArray(parsed.relevantProjectIds)
        ? parsed.relevantProjectIds.filter((id) => validIds.includes(id))
        : [];
      send({
        done: true,
        reply: typeof parsed.reply === 'string' ? parsed.reply : '',
        relevantProjectIds,
        showAllProjects: parsed.showAllProjects === true,
      });
    } catch (err) {
      console.error('[api/chat] stream error:', err);
      send({ error: "Tianne couldn't respond just now — try again in a moment." });
    }
    res.end();
  } finally {
    clearTimeout(timeoutId);
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('[api/chat] ANTHROPIC_API_KEY is not set.');
    res.status(500).json({ error: "Tianne isn't configured on the server yet." });
    return;
  }

  const body = req.body || {};
  const message = typeof body.message === 'string' ? body.message.trim() : '';

  if (!message) {
    res.status(400).json({ error: 'message is required.' });
    return;
  }

  try {
    const { validIds, systemPromptBase } = loadPromptData();
    const systemPrompt = `${systemPromptBase}\n\n## Current context\n${describePageContext(body.pageContext)}`;

    const messages = [
      ...sanitizeHistory(body.history),
      { role: 'user', content: message.slice(0, MAX_MESSAGE_CHARS) },
    ];

    if (body.stream === true) {
      await streamReply(res, systemPrompt, messages, apiKey, validIds);
      return;
    }

    const completion = await callClaudeWithRetry(systemPrompt, messages, apiKey);

    // output_config.format guarantees the first content block is text
    // containing JSON matching RESPONSE_SCHEMA.
    const textBlock = (completion.content || []).find((block) => block.type === 'text');
    if (!textBlock) throw new Error('No structured text block in the Claude response.');

    const parsed = JSON.parse(textBlock.text);
    const relevantProjectIds = Array.isArray(parsed.relevantProjectIds)
      ? parsed.relevantProjectIds.filter((id) => validIds.includes(id))
      : [];

    res.status(200).json({
      reply: typeof parsed.reply === 'string' ? parsed.reply : '',
      relevantProjectIds,
      showAllProjects: parsed.showAllProjects === true,
    });
  } catch (err) {
    console.error('[api/chat] error:', err);
    const status = err && err.status === 429 ? 429 : 502;
    res.status(status).json({ error: "Tianne couldn't respond just now — try again in a moment." });
  }
};
