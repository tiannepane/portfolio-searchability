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
const MAX_TOKENS = 1024;
const REQUEST_TIMEOUT_MS = 30000;
const MAX_RETRIES = 2; // retries on 429/5xx only

const MAX_HISTORY_TURNS = 20;
const MAX_MESSAGE_CHARS = 4000;

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    reply: { type: 'string' },
    relevantProjectIds: { type: 'array', items: { type: 'string' } },
  },
  required: ['reply', 'relevantProjectIds'],
  additionalProperties: false,
};

// Memoized across warm invocations of the same function instance — the
// project data doesn't change mid-deploy, no need to re-read disk per request.
let cachedPromptData = null;

function loadPromptData() {
  if (cachedPromptData) return cachedPromptData;

  const projectsPath = path.join(process.cwd(), 'data', 'projects.json');
  const profilePath = path.join(process.cwd(), 'data', 'profile.md');

  const projects = JSON.parse(fs.readFileSync(projectsPath, 'utf8'));
  const profile = fs.readFileSync(profilePath, 'utf8');
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
    '## Projects',
    projectsBlock,
    '',
    '## How to answer',
    '- Ground every answer in the project narratives and profile above. Where a field above is a placeholder like "[NEEDS REAL CONTENT]" or "(none yet)", do not invent specifics — say plainly that the detail isn\'t written up yet rather than guessing.',
    `- relevantProjectIds must only ever contain ids from this exact list: ${validIds.join(', ')}. Never invent an id, and never include an id the message doesn't genuinely relate to.`,
    "- If nothing in the project list is relevant, return an empty relevantProjectIds array and just answer conversationally.",
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
    });
  } catch (err) {
    console.error('[api/chat] error:', err);
    const status = err && err.status === 429 ? 429 : 502;
    res.status(status).json({ error: "Tianne couldn't respond just now — try again in a moment." });
  }
};
