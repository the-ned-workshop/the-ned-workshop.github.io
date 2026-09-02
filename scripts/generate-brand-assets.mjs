/**
 * Generates the site-wide brand assets from the Titan One outlines.
 *
 * The logo on the site itself is live HTML (src/components/WordmarkLogo.astro), but a favicon,
 * an app icon and an og:image all have to be real files, and an SVG favicon won't fetch a remote
 * webfont. So this script re-draws the mark with the glyphs converted to paths — the full lockup
 * where there is room for it, the icon mark in the square slots that get rendered tiny.
 *
 * Run it by hand after changing the mark:  npm run brand:assets
 * It is deliberately NOT part of `npm run build` — the outputs are committed.
 *
 * Per-event share images are generated separately, at build time, by generate-og-images.mjs.
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import sharp from 'sharp';
import { COLORS, iconMark, wideLockup, doc } from './lib/wordmark.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, '..');
const out = (p) => resolve(repo, 'public', p);

// ---------------------------------------------------------------- outputs

// 1. Square tile: favicon + the source for the app icon. This one is the icon mark,
//    not the lockup — a favicon is drawn at 16px in a browser tab and next to a Google
//    search result, and three words of Titan One at that size is just three smudges.
const TILE = 64;
const tileSvg = doc(TILE, TILE, iconMark(TILE), 'The Ned Workshop');
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
// Google renders the search-result favicon from a raster it fetches itself, and its
// docs ask for a square multiple of 48px. The SVG covers browsers; this covers Google.
await png(tileSvg, 96).toFile(out('favicon-96.png'));
await sharp(Buffer.from(ogSvg), { density: 192 })
  .resize(OG.w, OG.h)
  .jpeg({ quality: 88, progressive: true })
  .toFile(out('images/meta-image.jpg'));

console.log('wrote:');
for (const f of [
  'favicon.svg',
  'favicon-96.png',
  'apple-touch-icon.png',
  'images/logo.svg',
  'images/meta-image.jpg',
]) {
  console.log('  public/' + f);
}
