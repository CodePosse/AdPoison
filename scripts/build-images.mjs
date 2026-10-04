/**
 * Ad Poison — pixel art + social image builder (zero dependencies).
 *
 * Generates every raster/vector image the site needs from the pixel maps
 * below, so the mascot can be tweaked in one place:
 *
 *   node scripts/build-images.mjs
 *
 * Outputs (assets/img):
 *   skull.svg            static mascot (logo, favicon)
 *   skull-flap.svg       animated mascot (self-contained CSS, honours reduced motion)
 *   icon-32.png, icon-180.png, icon-192.png, icon-512.png
 *   og-image.png         1200x630 Open Graph / Twitter card
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { deflateSync, crc32 } from 'node:zlib';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'assets', 'img');
mkdirSync(OUT, { recursive: true });

/* ------------------------------------------------------------------ */
/* Palette + sprites                                                    */
/* ------------------------------------------------------------------ */
const PALETTE = {
  K: '#1a0f1f', // outline
  W: '#f4ecd8', // bone
  S: '#c9bfa8', // bone shade
  O: '#ff9f1c', // marigold
  P: '#ff3e8a', // pink
  T: '#2ec4b6', // teal
  Y: '#ffd23f', // yellow
  G: '#7bd389', // green
  V: '#8a4fff', // violet
};

// 20 x 20 sugar skull
const SKULL = [
  '......KKKKKKKK......',
  '....KKWWWWWWWWKK....',
  '...KWWWWWPPWWWWWK...',
  '..KWWWWWPYYPWWWWWK..',
  '..KWWOWWWPPWWWOWWK..',
  '.KWWOYOWWGGWWOYOWWK.',
  '.KWWWOWWWWWWWWOWWWK.',
  '.KWKKKKKWWWWKKKKKWK.',
  '.KKKTTTKKWWKKTTTKKK.',
  '.KKTKKKTKWWKTKKKTKK.',
  '.KKTKYKTKWWKTKYKTKK.',
  '.KKKTTTKKWWKKTTTKKK.',
  '..KWKKKKWKKWKKKKWK..',
  '..KWWWWWKKKKWWWWWK..',
  '...KWPWVWWWWVWPWK...',
  '...KSWPPWWWWPPWSK...',
  '....KSWWWWWWWWSK....',
  '....KWKWKWWKWKWK....',
  '.....KWKWKKWKWK.....',
  '......KKKKKKKK......',
];

// 8 x 20 left wings (mirrored for the right side)
const WING_UP = [
  'KK......',
  'KTK.....',
  'KTTK....',
  '.KTTK...',
  '.KTTTK..',
  '..KTTTK.',
  '..KTTTTK',
  '...KTTTK',
  '....KKKK',
  '........',
  '........', '........', '........', '........', '........',
  '........', '........', '........', '........', '........',
];
const WING_DOWN = [
  '........', '........', '........', '........', '........',
  '........', '........',
  '....KKKK',
  '..KKTTTK',
  '.KTTTTTK',
  'KTTTTTK.',
  'KTTTTK..',
  'KTTKK...',
  '.KK.....',
  '........', '........', '........', '........', '........', '........',
];

const mirror = (rows) => rows.map((r) => [...r].reverse().join(''));

for (const [name, rows, w] of [['SKULL', SKULL, 20], ['WING_UP', WING_UP, 8], ['WING_DOWN', WING_DOWN, 8]]) {
  rows.forEach((r, i) => {
    if (r.length !== w) throw new Error(`${name} row ${i} has width ${r.length}, expected ${w}`);
  });
  if (rows.length !== 20) throw new Error(`${name} has ${rows.length} rows`);
}

/** Compose wings + skull into one 36x20 grid. */
function compose(wing) {
  return SKULL.map((row, y) => wing[y] + row + mirror(wing)[y]);
}

/* ------------------------------------------------------------------ */
/* SVG                                                                  */
/* ------------------------------------------------------------------ */
function rects(rows, dx = 0) {
  // merge horizontal runs of the same colour to keep the SVG small
  let out = '';
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const c = row[x];
      let run = 1;
      while (x + run < row.length && row[x + run] === c) run++;
      if (c !== '.') out += `<rect x="${x + dx}" y="${y}" width="${run}" height="1" fill="${PALETTE[c]}"/>`;
      x += run;
    }
  });
  return out;
}

const svgHead = (w, h, label) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w * 8}" height="${h * 8}" shape-rendering="crispEdges" role="img" aria-label="${label}">`;

const staticSvg = `${svgHead(20, 20, 'Ad Poison sugar skull')}<title>Ad Poison sugar skull</title>${rects(SKULL)}</svg>\n`;
writeFileSync(join(OUT, 'skull.svg'), staticSvg);

const flapSvg = `${svgHead(36, 20, 'Ad Poison flapping sugar skull')}<title>Ad Poison flapping sugar skull</title>
<style>
.up{animation:a .36s steps(1) infinite}.down{animation:b .36s steps(1) infinite}
@keyframes a{0%{opacity:1}50%{opacity:0}}@keyframes b{0%{opacity:0}50%{opacity:1}}
@media (prefers-reduced-motion:reduce){.up,.down{animation:none}.down{opacity:0}}
</style>
<g class="up">${rects(WING_UP)}${rects(mirror(WING_UP), 28)}</g>
<g class="down">${rects(WING_DOWN)}${rects(mirror(WING_DOWN), 28)}</g>
${rects(SKULL, 8)}</svg>\n`;
writeFileSync(join(OUT, 'skull-flap.svg'), flapSvg);

/* ------------------------------------------------------------------ */
/* Tiny PNG encoder                                                     */
/* ------------------------------------------------------------------ */
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

class Canvas {
  constructor(w, h, bg = '#000000') {
    this.w = w; this.h = h;
    this.px = Buffer.alloc(w * h * 4);
    const [r, g, b] = hex(bg);
    for (let i = 0; i < w * h; i++) this.px.set([r, g, b, bg === 'transparent' ? 0 : 255], i * 4);
  }
  rect(x, y, w, h, color) {
    const [r, g, b] = hex(color);
    for (let yy = Math.max(0, y); yy < Math.min(this.h, y + h); yy++)
      for (let xx = Math.max(0, x); xx < Math.min(this.w, x + w); xx++)
        this.px.set([r, g, b, 255], (yy * this.w + xx) * 4);
  }
  sprite(rows, x, y, scale) {
    rows.forEach((row, yy) => [...row].forEach((c, xx) => {
      if (c !== '.') this.rect(x + xx * scale, y + yy * scale, scale, scale, PALETTE[c]);
    }));
  }
  png() {
    const raw = Buffer.alloc((this.w * 4 + 1) * this.h);
    for (let y = 0; y < this.h; y++) {
      raw[y * (this.w * 4 + 1)] = 0;
      this.px.copy(raw, y * (this.w * 4 + 1) + 1, y * this.w * 4, (y + 1) * this.w * 4);
    }
    const chunk = (type, data) => {
      const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
      const td = Buffer.concat([Buffer.from(type), data]);
      const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td) >>> 0);
      return Buffer.concat([len, td, crc]);
    };
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(this.w, 0); ihdr.writeUInt32BE(this.h, 4);
    ihdr[8] = 8; ihdr[9] = 6; // 8-bit RGBA
    return Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0)),
    ]);
  }
}

/* 5x7 pixel font */
const FONT = {
  A: '.###.#...##...#######...##...##...#', B: '####.#...##...#####.#...##...#####.',
  C: '.#####....#....#....#....#.....####', D: '####.#...##...##...##...##...#####.',
  E: '######....#....####.#....#....#####', F: '######....#....####.#....#....#....',
  G: '.#####....#....#.####...##...#.####', H: '#...##...##...#######...##...##...#',
  I: '#####..#....#....#....#....#..#####', J: '..###...#....#....#.#..#.#..#..##..',
  K: '#...##..#.#.#..##...#.#..#..#.#...#', L: '#....#....#....#....#....#....#####',
  M: '#...###.###.#.##.#.##...##...##...#', N: '#...###..##.#.##..###...##...##...#',
  O: '.###.#...##...##...##...##...#.###.', P: '####.#...##...#####.#....#....#....',
  Q: '.###.#...##...##...##.#.##..#..##.#', R: '####.#...##...#####.#.#..#..#.#...#',
  S: '.#####....#.....###.....#....#####.', T: '#####..#....#....#....#....#....#..',
  U: '#...##...##...##...##...##...#.###.', V: '#...##...##...##...##...#.#.#...#..',
  W: '#...##...##...##.#.##.#.###.###...#', X: '#...##...#.#.#...#...#.#.#...##...#',
  Y: '#...##...#.#.#...#....#....#....#..', Z: '#####....#...#...#...#...#....#####',
  ' ': '.'.repeat(35), '.': '.'.repeat(30) + '..#..', '-': '.'.repeat(15) + '.###.' + '.'.repeat(15),
  '!': '..#....#....#....#....#.........#..',
};

for (const [k, g] of Object.entries(FONT)) if (g.length !== 35) throw new Error(`glyph ${k} is ${g.length}`);
function text(cv, str, x, y, scale, color) {
  for (const ch of str.toUpperCase()) {
    const g = FONT[ch] ?? FONT[' '];
    for (let i = 0; i < 35; i++) if (g[i] === '#') cv.rect(x + (i % 5) * scale, y + Math.floor(i / 5) * scale, scale, scale, color);
    x += 6 * scale;
  }
}
const textWidth = (str, scale) => str.length * 6 * scale - scale;

/* Icons */
const FRAME = compose(WING_DOWN);
for (const size of [32, 180, 192, 512]) {
  const cv = new Canvas(size, size, '#2a1240');
  const scale = Math.max(1, Math.floor((size * 0.86) / 20));
  const off = Math.floor((size - 20 * scale) / 2);
  cv.sprite(SKULL, off, off, scale);
  writeFileSync(join(OUT, `icon-${size}.png`), cv.png());
}

/* Open Graph card 1200x630 */
{
  const cv = new Canvas(1200, 630, '#16091f');
  // starfield (deterministic)
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 140; i++) cv.rect(Math.floor(rnd() * 1200), Math.floor(rnd() * 630), 4, 4, rnd() > 0.8 ? '#ffd23f' : '#5b3f7a');
  // ground + marigold pipes
  cv.rect(0, 560, 1200, 70, '#3b1d52');
  for (let x = 0; x < 1200; x += 40) cv.rect(x, 560, 20, 10, '#ff9f1c');
  cv.rect(960, 300, 90, 260, '#2ec4b6'); cv.rect(944, 290, 122, 34, '#2ec4b6'); cv.rect(944, 290, 122, 6, '#1a0f1f');
  cv.rect(1100, 0, 90, 180, '#ff3e8a'); cv.rect(1084, 170, 122, 34, '#ff3e8a');
  // mascot
  cv.sprite(FRAME, 630, 150, 8);
  // title + tagline
  text(cv, 'AD POISON', 70, 150, 10, '#ffd23f');
  text(cv, 'SCRAMBLE YOUR', 74, 270, 6, '#f4ecd8');
  text(cv, 'AD PROFILE.', 74, 330, 6, '#f4ecd8');
  text(cv, 'NOISE - BLOCK - RESET', 74, 450, 4, '#2ec4b6');
  if (textWidth('AD POISON', 10) > 560) throw new Error('title too wide');
  writeFileSync(join(OUT, 'og-image.png'), cv.png());
}

console.log('images written to', OUT);
