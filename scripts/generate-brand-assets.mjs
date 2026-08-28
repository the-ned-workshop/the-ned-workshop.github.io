/**
 * Generates the brand assets from the Titan One outlines.
 *
 * The logo on the site itself is live HTML (src/components/WordmarkLogo.astro), but a favicon,
 * an app icon and an og:image all have to be real files, and an SVG favicon won't fetch a remote
 * webfont. So this script re-draws the same lockup with the glyphs converted to paths.
 *
 * Run it by hand after changing the mark:  npm run brand:assets
 * It is deliberately NOT part of `npm run build` — the outputs are committed.
 *
 * Titan One is licensed under the SIL Open Font License; see scripts/assets/TitanOne-OFL.txt.
 * Outlining and redistributing the glyphs is permitted under it.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import opentype from 'opentype.js';
import sharp from 'sharp';

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, '..');
const out = (p) => resolve(repo, 'public', p);

const font = opentype.parse(
  readFileSync(resolve(here, 'assets/TitanOne-Regular.ttf')).buffer
);

// Must stay in sync with the custom properties in WordmarkLogo.astro.
const COLORS = {
  quilt: '#23392c',
  pink: '#f2a7c6',
  coral: '#ff8383', // amber-500 in tailwind.config.mjs — the Donate button
  cream: '#fbf5e3',
  ink: '#1e3326',
  green: '#3f5c3a',
  page: '#fff8ee', // amber-50
};

/** A word in a rounded rectangle, sized to the glyph outlines rather than the line box. */
function patch(text, fontSize, padX, padY, { fill, bg, radius }) {
  const path = font.getPath(text, 0, 0, fontSize);
  const bb = path.getBoundingBox();
  const w = bb.x2 - bb.x1 + padX * 2;
  const h = bb.y2 - bb.y1 + padY * 2;
  path.fill = fill;
  const glyphs = path
    .toSVG(3)
    .replace('<path', `<path transform="translate(${-bb.x1 + padX} ${-bb.y1 + padY})"`);
  const plate =
    bg === null
      ? ''
      : `<rect width="${w.toFixed(2)}" height="${h.toFixed(2)}" rx="${radius.toFixed(2)}" fill="${bg}"/>`;
  return { w, h, svg: `${plate}${glyphs}` };
}

/** The 12-point starburst behind "the". */
function starburst(size, fill) {
  const pts = [];
  for (let i = 0; i < 24; i++) {
    const a = ((-90 + i * 15) * Math.PI) / 180;
    const r = (i % 2 === 0 ? 0.5 : 0.39) * size;
    pts.push(`${(size / 2 + r * Math.cos(a)).toFixed(2)},${(size / 2 + r * Math.sin(a)).toFixed(2)}`);
  }
  return `<polygon points="${pts.join(' ')}" fill="${fill}"/>`;
}

function theStar(S) {
  const size = 6.2 * S;
  const inner = patch('the', 2.2 * S, 0, 0, { fill: COLORS.ink, bg: null });
  const x = (size - inner.w) / 2;
  const y = (size - inner.h) / 2;
  return {
    w: size,
    h: size,
    svg:
      `<g transform="rotate(-6 ${size / 2} ${size / 2})">` +
      starburst(size, COLORS.pink) +
      `<g transform="translate(${x.toFixed(2)} ${y.toFixed(2)})">${inner.svg}</g>` +
      `</g>`,
  };
}

const nedPatch = (S) =>
  patch('NED', 3.0 * S, 1.1 * S, 0.55 * S, {
    fill: COLORS.cream,
    bg: COLORS.coral,
    radius: 1.2 * S,
  });

const shopPatch = (S, padX) =>
  patch('workshop', 3.4 * S, padX * S, 0.5 * S, {
    fill: COLORS.green,
    bg: COLORS.cream,
    radius: 1.2 * S,
  });

/** One row: the ★ NED workshop, on the green field. */
function wideLockup(S) {
  const gap = 1.1 * S;
  const padX = 1.6 * S;
  const padY = 1.4 * S;
  const parts = [theStar(S), nedPatch(S), shopPatch(S, 1.2)];
  const rowW = parts.reduce((a, p) => a + p.w, 0) + gap * (parts.length - 1);
  const rowH = Math.max(...parts.map((p) => p.h));
  const w = rowW + padX * 2;
  const h = rowH + padY * 2;

  let x = padX;
  const placed = parts
    .map((p) => {
      const g = `<g transform="translate(${x.toFixed(2)} ${(padY + (rowH - p.h) / 2).toFixed(2)})">${p.svg}</g>`;
      x += p.w + gap;
      return g;
    })
    .join('');

  return {
    w,
    h,
    svg:
      `<rect width="${w.toFixed(2)}" height="${h.toFixed(2)}" rx="${(1.8 * S).toFixed(2)}" fill="${COLORS.quilt}"/>` +
      placed,
  };
}

/** Two rows, for square slots. No field of its own — the tile behind it is the green. */
function stackedLockup(S) {
  const gap = 1.1 * S;
  const rowGap = 0.9 * S;
  const top = [theStar(S), nedPatch(S)];
  const shop = shopPatch(S, 0.5);
  const topW = top.reduce((a, p) => a + p.w, 0) + gap;
  const topH = Math.max(...top.map((p) => p.h));
  const w = Math.max(topW, shop.w);
  const h = topH + rowGap + shop.h;

  let x = (w - topW) / 2;
  const row1 = top
    .map((p) => {
      const g = `<g transform="translate(${x.toFixed(2)} ${((topH - p.h) / 2).toFixed(2)})">${p.svg}</g>`;
      x += p.w + gap;
      return g;
    })
    .join('');
  const row2 = `<g transform="translate(${((w - shop.w) / 2).toFixed(2)} ${(topH + rowGap).toFixed(2)})">${shop.svg}</g>`;

  return { w, h, svg: row1 + row2 };
}

const doc = (w, h, body, title) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w.toFixed(2)} ${h.toFixed(2)}" ` +
  `width="${w.toFixed(2)}" height="${h.toFixed(2)}" role="img" aria-label="The Ned Workshop">` +
  `<title>${title}</title>${body}</svg>\n`;

// ---------------------------------------------------------------- outputs

// 1. Square tile: favicon + the source for the app icon. Green bleeds to the edges;
//    the lockup is inset so the "workshop" panel never touches them.
const TILE = 64;
const tileS = (TILE * 0.84) / stackedLockup(1).w;
const tile = stackedLockup(tileS);
const tileSvg = doc(
  TILE,
  TILE,
  `<rect width="${TILE}" height="${TILE}" fill="${COLORS.quilt}"/>` +
    `<g transform="translate(${((TILE - tile.w) / 2).toFixed(2)} ${((TILE - tile.h) / 2).toFixed(2)})">${tile.svg}</g>`,
  'The Ned Workshop'
);
writeFileSync(out('favicon.svg'), tileSvg);

// 2. Wide lockup, for the JSON-LD Organization logo. Transparent outside the green field.
const logo = wideLockup(1200 / wideLockup(1).w);
writeFileSync(out('images/logo.svg'), doc(logo.w, logo.h, logo.svg, 'The Ned Workshop'));

// 3. og:image — 1200x630, the lockup centred on the page background.
const OG = { w: 1200, h: 630 };
const ogLock = wideLockup((OG.w * 0.78) / wideLockup(1).w);
const ogSvg = doc(
  OG.w,
  OG.h,
  `<rect width="${OG.w}" height="${OG.h}" fill="${COLORS.page}"/>` +
    `<g transform="translate(${((OG.w - ogLock.w) / 2).toFixed(2)} ${((OG.h - ogLock.h) / 2).toFixed(2)})">${ogLock.svg}</g>`,
  'The Ned Workshop'
);

const png = (svg, size) =>
  sharp(Buffer.from(svg), { density: 384 }).resize(size, size).png({ compressionLevel: 9 });

await png(tileSvg, 180).toFile(out('apple-touch-icon.png'));
await sharp(Buffer.from(ogSvg), { density: 192 })
  .resize(OG.w, OG.h)
  .jpeg({ quality: 88, progressive: true })
  .toFile(out('images/meta-image.jpg'));

console.log('wrote:');
for (const f of ['favicon.svg', 'apple-touch-icon.png', 'images/logo.svg', 'images/meta-image.jpg']) {
  console.log('  public/' + f);
}
