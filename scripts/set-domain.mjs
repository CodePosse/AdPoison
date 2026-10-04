/**
 * Swap the placeholder domain for your real one across every page,
 * the sitemap, robots.txt, humans.txt, security.txt and structured data.
 *
 *   npm run set-domain -- https://adpoison.yourdomain.com
 *
 * Safe to re-run: it replaces whatever domain is currently recorded
 * in .domain (defaults to the shipped placeholder).
 */
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const PLACEHOLDER = 'https://adpoison.example';
const STATE = join(ROOT, '.domain');

const next = (process.argv[2] || '').replace(/\/+$/, '');
if (!/^https:\/\/[a-z0-9.-]+(:\d+)?(\/[\w./-]*)?$/i.test(next)) {
  console.error('Usage: npm run set-domain -- https://your-domain.com');
  process.exit(1);
}
const current = existsSync(STATE) ? readFileSync(STATE, 'utf8').trim() : PLACEHOLDER;

const EXT = new Set(['.html', '.xml', '.txt', '.webmanifest', '.json']);
const SKIP = new Set(['node_modules', '.git', 'scripts']);
let changed = 0;

(function walk(dir) {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) { walk(p); continue; }
    if (!EXT.has(extname(name)) || name === 'package.json' || name === 'package-lock.json') continue;
    const src = readFileSync(p, 'utf8');
    if (!src.includes(current)) continue;
    writeFileSync(p, src.split(current).join(next));
    changed++;
    console.log('updated', p.slice(ROOT.length));
  }
})(ROOT);

writeFileSync(STATE, next + '\n');
console.log(`\n${changed} files: ${current} -> ${next}`);
