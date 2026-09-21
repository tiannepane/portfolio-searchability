#!/usr/bin/env node
/*
  evals/run-evals.js — checks the Ask Tianne chat (CLAUDE.md section 7).

    node evals/run-evals.js                 run everything
    node evals/run-evals.js --static        only the free data checks (no API calls)
    node evals/run-evals.js --filter micro  only cases whose id or query contains "micro"
    node evals/run-evals.js --verbose       also print every reply
    node evals/run-evals.js --concurrency 6 how many questions to ask at once (default 4)
    node evals/run-evals.js --json out.json save full results

  Run it after ANY change to data/projects.json, data/profile.md,
  data/tianne-persona.md, or the system prompt in api/chat.js, and before
  pushing. Exits with code 1 if anything fails.

  How it works: it calls the same handler Vercel runs (api/chat.js), directly
  and not over HTTP, so it needs ANTHROPIC_API_KEY (read from .env, never
  printed). It makes real API calls, roughly one per test case.

  Three kinds of checks:
    1. Static: the project data, persona and test cases agree with each other.
       No API calls.
    2. Per-case: the ids returned, facts the reply must (or must not) mention.
       Persona questions use these lighter checks, not exact matching.
    3. Every reply: no em dashes, no markdown, no she/her about herself, and
       within the length cap.
  Plus one streaming check: the streamed text must equal the final reply.

  Language models are not perfectly repeatable. A case that fails once and
  passes on a rerun is a flaky case: tighten the prompt or loosen the case.
*/

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const option = (name, fallback) => {
  const i = args.indexOf(name);
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
};

const STATIC_ONLY = flag('--static');
const VERBOSE = flag('--verbose');
const FILTER = (option('--filter', '') || '').toLowerCase();
const CONCURRENCY = Math.max(1, Number(option('--concurrency', 4)) || 4);
const JSON_OUT = option('--json', '');
const DEFAULT_MAX_WORDS = 150;
const SLOW_MS = 9000; // a warning, not a failure

const useColor = process.stdout.isTTY;
const c = (code, text) => (useColor ? `\x1b[${code}m${text}\x1b[0m` : text);
const green = (t) => c(32, t);
const red = (t) => c(31, t);
const yellow = (t) => c(33, t);
const dim = (t) => c(2, t);

// --- setup -------------------------------------------------------------------

function loadEnv() {
  try {
    for (const line of fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split('\n')) {
      const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
      if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
    }
  } catch (_err) {
    // no .env: fine for --static
  }
}

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
}

// Curly quotes and dashes normalised so "can’t" matches "can't".
function norm(text) {
  return String(text)
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .toLowerCase();
}

// --- 1. static checks (no API) -----------------------------------------------

function runStaticChecks(cases, projects) {
  const results = [];
  const add = (name, ok, detail, warn = false) => results.push({ name, ok, detail, warn });
  const ids = new Set(projects.map((p) => p.id));

  // Every project has the fields the chat and the site rely on.
  const required = ['id', 'title', 'category', 'tagline', 'summary', 'narrative'];
  const incomplete = projects.filter((p) => required.some((k) => typeof p[k] !== 'string' || !p[k]));
  add('projects.json: every entry has id, title, category, tagline, summary, narrative', incomplete.length === 0,
    incomplete.map((p) => p.id).join(', '));

  // Homepage order only names real projects.
  const home = fs.readFileSync(path.join(ROOT, 'js', 'home.js'), 'utf8');
  const orderBlock = home.match(/HOME_ORDER\s*=\s*\[([\s\S]*?)\]/);
  const homeIds = orderBlock ? [...orderBlock[1].matchAll(/'([^']+)'/g)].map((m) => m[1]) : [];
  const badHome = homeIds.filter((id) => !ids.has(id));
  add('js/home.js: every HOME_ORDER id exists in projects.json', homeIds.length > 0 && badHome.length === 0,
    homeIds.length ? badHome.join(', ') : 'HOME_ORDER not found');

  // Test cases only reference real projects.
  const referenced = new Set();
  cases.forEach((tc) => {
    [...(tc.expected_project_ids || []), ...(tc.expected_any_of || []), ...(tc.forbidden_project_ids || [])].forEach((id) => referenced.add(id));
  });
  const badRefs = [...referenced].filter((id) => !ids.has(id));
  add('test-cases.json: every project id it mentions exists', badRefs.length === 0, badRefs.join(', '));

  const dupes = cases.map((tc) => tc.id).filter((id, i, all) => all.indexOf(id) !== i);
  add('test-cases.json: case ids are unique', dupes.length === 0, dupes.join(', '));

  // The persona guide exists and carries the essentials.
  let persona = '';
  try {
    persona = fs.readFileSync(path.join(ROOT, 'data', 'tianne-persona.md'), 'utf8');
  } catch (_err) {
    // reported below
  }
  add('data/tianne-persona.md exists', persona.length > 0, '');
  add('persona includes the contact email', /nadykupane@gmail\.com/i.test(persona), '');
  add('persona says never to claim live availability', /never claim live availability/i.test(persona), '');
  add('persona bans em dashes in replies', /no em dashes/i.test(persona), '');

  // Each suggested question on the homepage has persona guidance and a test.
  const suggested = home.match(/SUGGESTED_QUESTIONS\s*=\s*\[([\s\S]*?)\]/);
  const questions = suggested ? [...suggested[1].matchAll(/(['"])((?:(?!\1).)*)\1/g)].map((m) => m[2]) : [];
  const key = (q) => norm(q).replace(/[^a-z ]/g, '').trim();
  const withoutGuidance = questions.filter((q) => !norm(persona).replace(/[^a-z \n]/g, '').includes(key(q)));
  add('every suggested question has an answer in the persona guide', questions.length > 0 && withoutGuidance.length === 0,
    questions.length ? withoutGuidance.join(' | ') : 'SUGGESTED_QUESTIONS not found');
  const untested = questions.filter((q) => !cases.some((tc) => key(tc.query) === key(q)));
  add('every suggested question has a test case', untested.length === 0, untested.join(' | '));

  // Information only: entries that still say "[NEEDS REAL CONTENT]".
  const placeholders = projects.filter((p) => /NEEDS REAL CONTENT/.test(`${p.summary} ${p.narrative}`)).map((p) => p.id);
  add('projects still holding placeholder text (info)', placeholders.length === 0, placeholders.join(', '), true);

  return results;
}

// --- 2. calling the chat function ----------------------------------------------

function makeRes() {
  const res = {
    statusCode: 200,
    headers: {},
    chunks: [],
    body: null,
    ended: false,
    setHeader(k, v) {
      this.headers[String(k).toLowerCase()] = v;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(b) {
      this.body = b;
      this.ended = true;
    },
    write(chunk) {
      this.chunks.push(String(chunk));
      return true;
    },
    end(chunk) {
      if (chunk) this.chunks.push(String(chunk));
      this.ended = true;
    },
  };
  return res;
}

async function ask(handler, query, { stream = false } = {}) {
  const res = makeRes();
  const started = Date.now();
  await handler({ method: 'POST', body: { message: query, history: [], pageContext: { page: 'home' }, stream } }, res);
  const ms = Date.now() - started;
  return { res, ms };
}

// --- 3. checks on a reply -------------------------------------------------------

function styleFailures(reply, testCase) {
  const skip = testCase.skip_checks || [];
  const fails = [];
  if (/—|–|\s--\s/.test(reply)) fails.push('contains an em dash or double hyphen');
  if (/(^|\n)\s{0,3}(#{1,6}\s|[-*•]\s|\d+\.\s)/.test(reply) || /\*\*[^*]+\*\*/.test(reply)) fails.push('contains markdown (heading, list, or bold)');
  if (!skip.includes('third_person') && /\b(she|her|hers)\b/i.test(reply.replace(/hoops\s*for\s*her/gi, ''))) fails.push('refers to herself in the third person (she/her)');
  const words = reply.trim().split(/\s+/).length;
  const cap = testCase.max_words || DEFAULT_MAX_WORDS;
  if (!skip.includes('length') && words > cap) fails.push(`too long: ${words} words (cap ${cap})`);
  return fails;
}

function caseFailures(testCase, reply, ids, showAll) {
  const fails = [];
  const text = norm(reply);

  if (testCase.expect_show_all === true && !showAll) fails.push('expected showAllProjects to be true (visitor asked for everything)');
  if (testCase.expect_show_all === false && showAll) fails.push('showAllProjects was true but the visitor did not ask for everything');

  (testCase.expected_project_ids || []).forEach((id) => {
    if (!ids.includes(id)) fails.push(`missing expected project "${id}" (got ${JSON.stringify(ids)})`);
  });
  if (testCase.expected_any_of && !testCase.expected_any_of.some((id) => ids.includes(id))) {
    fails.push(`none of ${JSON.stringify(testCase.expected_any_of)} returned (got ${JSON.stringify(ids)})`);
  }
  (testCase.forbidden_project_ids || []).forEach((id) => {
    if (ids.includes(id)) fails.push(`returned forbidden project "${id}"`);
  });
  if (testCase.expect_no_projects && ids.length) fails.push(`expected no projects, got ${JSON.stringify(ids)}`);

  (testCase.must_mention || []).forEach((group) => {
    if (!group.some((alt) => text.includes(norm(alt)))) fails.push(`does not mention any of ${JSON.stringify(group)}`);
  });
  (testCase.must_not_mention || []).forEach((bad) => {
    if (text.includes(norm(bad))) fails.push(`mentions "${bad}"`);
  });
  (testCase.must_not_match || []).forEach((pattern) => {
    if (new RegExp(pattern, /\\u\{/.test(pattern) ? 'iu' : 'i').test(reply)) fails.push(`matches forbidden pattern /${pattern}/`);
  });

  return fails.concat(styleFailures(reply, testCase));
}

async function runCase(handler, testCase) {
  try {
    let { res, ms } = await ask(handler, testCase.query);
    let retried = false;
    // An API stall or 5xx says nothing about the answer's quality: try once more.
    if (res.statusCode >= 500 || res.statusCode === 429) {
      retried = true;
      ({ res, ms } = await ask(handler, testCase.query));
    }
    if (res.statusCode !== 200 || !res.body || typeof res.body.reply !== 'string') {
      return { testCase, ok: false, ms, reply: '', ids: [], failures: [`API returned HTTP ${res.statusCode}: ${JSON.stringify(res.body)}`] };
    }
    const { reply, relevantProjectIds, showAllProjects } = res.body;
    const failures = caseFailures(testCase, reply, relevantProjectIds || [], showAllProjects === true);
    return { testCase, ok: failures.length === 0, ms, reply, ids: relevantProjectIds || [], failures, slow: ms > SLOW_MS, retried };
  } catch (err) {
    return { testCase, ok: false, ms: 0, reply: '', ids: [], failures: [`threw: ${err.message}`] };
  }
}

// The streamed text pieces must add up to exactly the final reply, and the
// final event must carry valid project ids.
async function runStreamingCheck(handler, validIds) {
  const name = 'streaming: pieces add up to the final reply';
  try {
    const { res, ms } = await ask(handler, 'Tell me about the Boardy project.', { stream: true });
    if (!String(res.headers['content-type'] || '').includes('text/event-stream')) {
      return { name, ok: false, detail: `content-type was "${res.headers['content-type']}", not text/event-stream`, ms };
    }
    const events = res.chunks
      .join('')
      .split('\n\n')
      .map((e) => e.split('\n').find((l) => l.startsWith('data:')))
      .filter(Boolean)
      .map((l) => JSON.parse(l.slice(5).trim()));
    const deltas = events.filter((e) => typeof e.delta === 'string');
    const done = events.find((e) => e.done);
    const error = events.find((e) => e.error);
    if (error) return { name, ok: false, detail: `stream error event: ${error.error}`, ms };
    if (!done) return { name, ok: false, detail: 'no final "done" event', ms };
    const joined = deltas.map((e) => e.delta).join('');
    if (deltas.length < 2) return { name, ok: false, detail: `only ${deltas.length} text piece(s) arrived, so it is not really streaming`, ms };
    if (joined !== done.reply) return { name, ok: false, detail: 'streamed text differs from the final reply', ms };
    const badIds = (done.relevantProjectIds || []).filter((id) => !validIds.includes(id));
    if (badIds.length) return { name, ok: false, detail: `invalid ids in final event: ${badIds.join(', ')}`, ms };
    return { name: `${name} (${deltas.length} pieces)`, ok: true, detail: '', ms };
  } catch (err) {
    return { name, ok: false, detail: `threw: ${err.message}`, ms: 0 };
  }
}

async function pool(items, limit, worker) {
  const results = new Array(items.length);
  let next = 0;
  async function lane() {
    while (next < items.length) {
      const i = next++;
      results[i] = await worker(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, lane));
  return results;
}

// --- main ----------------------------------------------------------------------

async function main() {
  loadEnv();
  const { cases: allCases } = readJson('evals/test-cases.json');
  const projects = readJson('data/projects.json');
  const cases = FILTER
    ? allCases.filter((tc) => tc.id.toLowerCase().includes(FILTER) || tc.query.toLowerCase().includes(FILTER))
    : allCases;

  let failed = 0;

  // 1. static
  console.log(`\nStatic checks ${dim('(no API calls)')}`);
  const staticResults = runStaticChecks(allCases, projects);
  staticResults.forEach((r) => {
    const mark = r.ok ? green('PASS') : r.warn ? yellow('INFO') : red('FAIL');
    console.log(`  ${mark}  ${r.name}${!r.ok && r.detail ? dim('  -> ' + r.detail) : ''}`);
    if (!r.ok && !r.warn) failed += 1;
  });

  if (STATIC_ONLY) {
    console.log(`\n${failed ? red(failed + ' static check(s) failed.') : green('Static checks passed.')}\n`);
    process.exit(failed ? 1 : 0);
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.log(red('\nANTHROPIC_API_KEY is not set (put it in .env). Run with --static to skip the API cases.\n'));
    process.exit(1);
  }

  // The handler memoises its prompt data per process, so this is one build.
  const handler = require(path.join(ROOT, 'api', 'chat.js'));
  process.chdir(ROOT);

  // 2. questions
  console.log(`\nAsking ${cases.length} question${cases.length === 1 ? '' : 's'} ${dim(`(${CONCURRENCY} at a time)`)}\n`);
  const results = await pool(cases, CONCURRENCY, (tc) => runCase(handler, tc));

  results.forEach((r) => {
    const words = r.reply ? r.reply.trim().split(/\s+/).length : 0;
    const mark = r.ok ? green('PASS') : red('FAIL');
    const timing = `${(r.ms / 1000).toFixed(1)}s, ${words}w`;
    console.log(`  ${mark}  ${r.testCase.id.padEnd(22)} ${dim(timing)}${r.slow ? yellow('  slow') : ''}${r.retried ? yellow('  (API error, retried once)') : ''}`);
    if (!r.ok) {
      failed += 1;
      console.log(`        ${dim('Q:')} ${r.testCase.query}`);
      r.failures.forEach((f) => console.log(`        ${red('x')} ${f}`));
      if (r.reply) console.log(`        ${dim('A: ' + r.reply.replace(/\s+/g, ' ').slice(0, 400))}`);
    } else if (VERBOSE) {
      console.log(`        ${dim('A: ' + r.reply.replace(/\s+/g, ' '))}`);
    }
  });

  // 3. streaming
  let streamResult = null;
  if (!FILTER) {
    console.log('');
    streamResult = await runStreamingCheck(handler, projects.map((p) => p.id));
    console.log(`  ${streamResult.ok ? green('PASS') : red('FAIL')}  ${streamResult.name}${streamResult.ok ? '' : dim('  -> ' + streamResult.detail)}`);
    if (!streamResult.ok) failed += 1;
  }

  // summary
  const passed = results.filter((r) => r.ok).length;
  const times = results.map((r) => r.ms).sort((a, b) => a - b);
  const median = times.length ? times[Math.floor(times.length / 2)] : 0;
  const slow = results.filter((r) => r.slow).length;
  console.log(
    `\n${passed}/${results.length} questions passed` +
      dim(`  |  median ${(median / 1000).toFixed(1)}s, slowest ${((times[times.length - 1] || 0) / 1000).toFixed(1)}s`) +
      (slow ? yellow(`  |  ${slow} slower than ${SLOW_MS / 1000}s`) : '')
  );
  console.log(failed ? red(`${failed} failure(s). See above.\n`) : green('All checks passed.\n'));

  if (JSON_OUT) {
    fs.writeFileSync(
      JSON_OUT,
      JSON.stringify({ ranAt: new Date().toISOString(), static: staticResults, questions: results.map((r) => ({ id: r.testCase.id, ok: r.ok, ms: r.ms, ids: r.ids, reply: r.reply, failures: r.failures })), streaming: streamResult }, null, 2)
    );
    console.log(dim(`Saved ${JSON_OUT}\n`));
  }

  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error(red('Eval runner crashed: ' + (err && err.stack ? err.stack : err)));
  process.exit(1);
});
