/**
 * Builds a branded share image for each free online tool.
 *
 * The event script letterboxes a photo, but the tools have no photo to show — a screenshot of a
 * file picker says nothing at thumbnail size. So these cards are typographic: the tool's headline
 * set in the brand face on the cream page color, a one-line reassurance under it, and the wordmark
 * bottom-left. What a reader sees in a link preview is the sentence that tells them what the tool
 * does, which is the job the image has to do when someone drops the URL into a sewing group.
 *
 * Runs as part of `npm run dev` and `npm run build`; output is gitignored and rebuilt from the
 * TOOLS table below, so the images cannot drift from a rename without someone editing this file.
 */
import { mkdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import opentype from 'opentype.js';
import sharp from 'sharp';
import { wideLockup, doc, COLORS } from './lib/wordmark.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, '..');
const outDir = resolve(repo, 'public/images/og');

const font = opentype.parse(readFileSync(resolve(here, 'assets/TitanOne-Regular.ttf')).buffer);

const OG = { w: 1200, h: 630 };
const PAD = 72;
const HEAD_SIZE = 78;
const HEAD_LEADING = 1.16;
const SUB_SIZE = 30;
const LOGO_W = 300;

const TOOLS = [
  {
    slug: 'pattern-viewer',
    headline: 'Print one size from a layered PDF pattern',
    sub: 'Free · runs in your browser · nothing uploaded',
  },
  {
    slug: 'pattern-cleaner',
    headline: 'Clean up a scanned embroidery pattern',
    sub: 'Free · runs in your browser · nothing uploaded',
  },
];

/** Greedy wrap on advance width, which is what actually decides whether a line fits. */
function wrap(text, size, maxWidth) {
  const lines = [];
  let line = '';
  for (const word of text.split(' ')) {
    const next = line ? `${line} ${word}` : word;
    if (line && font.getAdvanceWidth(next, size) > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

const r = (n) => Number(n.toFixed(3));

/**
 * Serialise the glyph outlines ourselves.
 *
 * opentype.js 2.0.0's own `toSVG()`/`toPathData()` emit a literal `NaN` for one control point in
 * strings this long — the commands it hands back are clean, so the bug is in its serialiser. An
 * SVG renderer abandons the rest of a path at the first unparseable number, which shows up as a
 * headline that stops mid-word, and nothing errors. Hence both the hand-rolled writer and the
 * assertion below.
 */
function pathData(path) {
  let d = '';
  for (const c of path.commands) {
    if (c.type === 'M') d += `M${r(c.x)} ${r(c.y)}`;
    else if (c.type === 'L') d += `L${r(c.x)} ${r(c.y)}`;
    else if (c.type === 'C') d += `C${r(c.x1)} ${r(c.y1)} ${r(c.x2)} ${r(c.y2)} ${r(c.x)} ${r(c.y)}`;
    else if (c.type === 'Q') d += `Q${r(c.x1)} ${r(c.y1)} ${r(c.x)} ${r(c.y)}`;
    else if (c.type === 'Z') d += 'Z';
  }
  if (d.includes('NaN')) throw new Error('glyph outline produced a NaN coordinate');
  return d;
}

const textPath = (text, x, baseline, size, fill) =>
  `<path d="${pathData(font.getPath(text, x, baseline, size))}" fill="${fill}"/>`;

mkdirSync(outDir, { recursive: true });

const lockScale = LOGO_W / wideLockup(1).w;
const lock = wideLockup(lockScale);

for (const { slug, headline, sub } of TOOLS) {
  const maxWidth = OG.w - PAD * 2;
  const lines = wrap(headline, HEAD_SIZE, maxWidth);
  const step = HEAD_SIZE * HEAD_LEADING;

  // Centre the headline and its subtitle in the space left above the wordmark, so a two-line
  // headline and a three-line one both sit balanced rather than riding the top edge.
  const SUB_GAP = 58;
  const blockH = step * lines.length + SUB_GAP;
  const ceiling = PAD;
  const floor = OG.h - PAD - lock.h - 40;
  const blockTop = ceiling + (floor - ceiling - blockH) / 2;
  const body =
    `<rect width="${OG.w}" height="${OG.h}" fill="${COLORS.page}"/>` +
    `<rect width="${OG.w}" height="14" fill="${COLORS.coral}"/>` +
    lines
      .map((line, i) => textPath(line, PAD, blockTop + step * (i + 1), HEAD_SIZE, COLORS.quilt))
      .join('') +
    textPath(sub, PAD, blockTop + step * lines.length + SUB_GAP, SUB_SIZE, COLORS.green) +
    `<g transform="translate(${PAD} ${OG.h - PAD - lock.h})">${lock.svg}</g>`;

  await sharp(Buffer.from(doc(OG.w, OG.h, body, 'The Ned Workshop')), { density: 300 })
    .resize(OG.w, OG.h)
    .jpeg({ quality: 88, progressive: true })
    .toFile(resolve(outDir, `${slug}.jpg`));
}

console.log(`generated ${TOOLS.length} tool share image(s) in public/images/og/`);
