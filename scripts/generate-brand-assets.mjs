/**
 * Generates the site-wide brand assets from the Titan One outlines.
 *
 * The logo on the site itself is live HTML (src/components/WordmarkLogo.astro), but a favicon,
 * an app icon and an og:image all have to be real files, and an SVG favicon won't fetch a remote
 * webfont. So this script re-draws the same lockup with the glyphs converted to paths.
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
import { COLORS, wideLockup, stackedLockup, doc } from './lib/wordmark.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, '..');
const out = (p) => resolve(repo, 'public', p);

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
