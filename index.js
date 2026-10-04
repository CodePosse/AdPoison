/**
 * Ad Poison — zero-dependency local dev server.
 *
 *   npm start            -> http://localhost:8080
 *   PORT=3000 npm start  -> custom port
 *   NO_HEADERS=1 npm start -> skip security headers (iframe previews)
 *
 * Mirrors a static host: serves files, maps "/" to index.html,
 * falls back to 404.html, and applies the headers from _headers.
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
const PORT = Number(process.env.PORT) || 8080;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

const BLOCKED = ['node_modules', '.git', 'scripts', 'package.json', 'package-lock.json', 'index.js', '_headers'];

/** Parse the global "/*" block of _headers so local dev matches production. */
async function loadHeaders() {
  try {
    const raw = await readFile(join(ROOT, '_headers'), 'utf8');
    const headers = {};
    let inGlobal = false;
    for (const line of raw.split(/\r?\n/)) {
      if (!line.trim() || line.trim().startsWith('#')) continue;
      if (!/^\s/.test(line)) { inGlobal = line.trim() === '/*'; continue; }
      if (inGlobal) {
        const i = line.indexOf(':');
        headers[line.slice(0, i).trim()] = line.slice(i + 1).trim();
      }
    }
    return headers;
  } catch {
    return {};
  }
}

// NO_HEADERS=1 disables them (e.g. to preview pages inside iframes while testing).
const securityHeaders = process.env.NO_HEADERS ? {} : await loadHeaders();

async function resolve(urlPath) {
  let p = decodeURIComponent(urlPath.split('?')[0].split('#')[0]);
  if (p.endsWith('/')) p += 'index.html';
  const file = normalize(join(ROOT, p));
  if (!file.startsWith(ROOT)) return null; // path traversal
  const rel = file.slice(ROOT.length).split(sep).filter(Boolean);
  if (rel.length && BLOCKED.includes(rel[0])) return null;
  try {
    const s = await stat(file);
    if (s.isDirectory()) return resolve(p + '/');
    return file;
  } catch {
    return null;
  }
}

createServer(async (req, res) => {
  const file = await resolve(req.url || '/');
  const target = file || join(ROOT, '404.html');
  try {
    const body = await readFile(target);
    res.writeHead(file ? 200 : 404, {
      'Content-Type': TYPES[extname(target)] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
      ...securityHeaders,
    });
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Server error');
  }
  console.log(`${file ? 200 : 404} ${req.method} ${req.url}`);
}).listen(PORT, () => {
  console.log(`\n  Ad Poison running at http://localhost:${PORT}\n`);
});
