/*
  dev-server.js — local development server. Run it from the project root:

    node dev-server.js            (then open http://localhost:8000)

  Serves the static site and runs the same api/chat.js function that Vercel
  runs in production, reading ANTHROPIC_API_KEY from .env. A plain static
  server (e.g. `python3 -m http.server`) can't run the chat function, so
  Ask Tianne fails there with "couldn't respond just now".

  No dependencies, nothing to install. The key stays in .env (gitignored) and
  is never sent to the browser. Not used in production: Vercel serves the site
  and the api/ folder itself.
*/

const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 8000;

// Load .env (KEY=value lines) without a dependency.
try {
  for (const line of fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split('\n')) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
  }
} catch (_err) {
  console.warn('No .env found: chat will answer "not configured" until ANTHROPIC_API_KEY is set.');
}

process.chdir(ROOT); // api/chat.js reads data/ relative to the working directory
const chatHandler = require(path.join(ROOT, 'api', 'chat.js'));

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.m4a': 'audio/mp4',
  '.mp3': 'audio/mpeg',
  '.pdf': 'application/pdf',
  '.ico': 'image/x-icon',
};

function serveStatic(req, res) {
  let pathname = decodeURIComponent(req.url.split('?')[0]);
  if (pathname.endsWith('/')) pathname += 'index.html';
  const file = path.normalize(path.join(ROOT, pathname));

  // Stay inside the project, and never serve secrets or git internals.
  const rel = path.relative(ROOT, file);
  if (rel.startsWith('..') || rel.split(path.sep).some((part) => part === '.env' || part === '.git' || part.startsWith('.env'))) {
    res.statusCode = 404;
    res.end('Not found');
    return;
  }

  fs.readFile(file, (err, data) => {
    if (err) {
      res.statusCode = 404;
      res.end('Not found');
      return;
    }
    res.setHeader('Content-Type', TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream');
    res.setHeader('Cache-Control', 'no-store'); // always fresh while developing
    res.end(data);
  });
}

http
  .createServer((req, res) => {
    if (req.url.split('?')[0] === '/api/chat') {
      let raw = '';
      req.on('data', (chunk) => (raw += chunk));
      req.on('end', () => {
        try {
          req.body = raw ? JSON.parse(raw) : {};
        } catch (_err) {
          req.body = {};
        }
        // The two Express-style helpers the Vercel handler uses.
        res.status = (code) => {
          res.statusCode = code;
          return res;
        };
        res.json = (body) => {
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify(body));
        };
        chatHandler(req, res);
      });
      return;
    }
    serveStatic(req, res);
  })
  .listen(PORT, () => {
    console.log(`Local site with chat: http://localhost:${PORT}`);
  });
