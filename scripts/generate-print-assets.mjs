/**
 * Exports screen-printing artwork for merch, from the same Titan One outlines the site uses.
 *
 * Usage:  npm run brand:print -- ["/path/to/output/folder"]
 *
 * A press charges by the screen, so the job here is to spend as few as possible without the
 * mark looking like a compromise:
 *
 *   - The three dark greens on screen become one. They never touch, and at arm's length on
 *     fabric nobody could tell them apart anyway.
 *   - Words are knocked out of the patch they sit in rather than printed on top, so what shows
 *     through the letters is the garment (or the green field). One screen fewer per word, and
 *     the letters can never drift out of register.
 *   - Nothing here is a gradient or a halftone. Every file is flat spot colour, which is what a
 *     screen wants, and every variant ships as its own separation ready to burn.
 *
 * Run it by hand; the outputs are committed.  See the generated README for what to print where.
 */
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import sharp from 'sharp';
import {
  COLORS,
  PRINT_INKS,
  iconOneColor,
  wideLayout,
  stackedLayout,
  paint,
  inksUsed,
  doc,
} from './lib/wordmark.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, '..');
const outDir = resolve(repo, process.argv[2] ?? 'public/images/brand/print');
const out = (p) => {
  const full = resolve(outDir, p);
  mkdirSync(dirname(full), { recursive: true });
  return full;
};

// Both of these are generated wholesale, and their filenames carry the ink and its order — so
// a recipe that gains or loses a screen renames every file in the folder. Clear them first, or
// the run before this one leaves separations behind and the folder asks for screens twice over.
for (const dir of ['separations', 'previews']) {
  rmSync(resolve(outDir, dir), { recursive: true, force: true });
}

const INK_NAMES = {
  [COLORS.quilt]: 'green',
  [COLORS.pink]: 'pink',
  [COLORS.coral]: 'coral',
  [COLORS.cream]: 'cream',
};

/** Garment colours the variants are drawn for. */
const GARMENTS = {
  forest: '#23392c',
  black: '#16181c',
  natural: '#efe6d2',
};

// Every word cut out of its own patch. "the" and "workshop" show what is behind them either
// way; "NED" only joins them when the whole mark collapses to a single screen.
const WORDS_KNOCKED_OUT = ['the', 'shop'];
const ALL_WORDS_KNOCKED_OUT = ['the', 'shop', 'cream'];

/**
 * The variants.
 *
 * `field` is the green plate the wide lockup carries on screen. On a dark garment it is dropped
 * — the shirt is already the field — which is both cheaper and a lighter hand, and leaves the
 * three patches floating, which is the quilt metaphor the whole brand is built on.
 */
const RECIPES = {
  'dark-garment': { inks: PRINT_INKS, field: false, knockout: WORDS_KNOCKED_OUT },
  'light-garment': { inks: PRINT_INKS, field: true, knockout: WORDS_KNOCKED_OUT },
  'one-color': {
    inks: PRINT_INKS,
    field: false,
    knockout: ALL_WORDS_KNOCKED_OUT,
    flatten: '#000000',
  },
};

// The stacked lockup only carries a field when the recipe prints one; the wide one always
// has its own, and `field: false` simply leaves it undrawn.
const SHAPES = {
  wide: (S) => wideLayout(S),
  stacked: (S, recipe) => stackedLayout(S, { field: recipe.field }),
};

/**
 * Shrink an artboard to the ink on it.
 *
 * Drop the green field and the padding it carried is left behind as empty space — which would
 * quietly lie about the size of the print, since "11 inches wide" has to mean eleven inches of
 * mark. The starburst is tilted, so it reaches past its own box; its rotated extent is added
 * back before trimming, or the points would be sheared off.
 */
function trimToInk(layout) {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;

  for (const { part, x, y } of layout.items) {
    let ex = 0;
    let ey = 0;
    if (part.wrap) {
      const deg = Math.abs(parseFloat(part.wrap.match(/rotate\(\s*(-?[\d.]+)/)[1]));
      const a = (deg * Math.PI) / 180;
      const hw = part.w / 2;
      const hh = part.h / 2;
      ex = hw * Math.cos(a) + hh * Math.sin(a) - hw;
      ey = hw * Math.sin(a) + hh * Math.cos(a) - hh;
    }
    x0 = Math.min(x0, x - ex);
    y0 = Math.min(y0, y - ey);
    x1 = Math.max(x1, x + part.w + ex);
    y1 = Math.max(y1, y + part.h + ey);
  }

  return {
    w: x1 - x0,
    h: y1 - y0,
    field: null,
    items: layout.items.map((it) => ({ ...it, x: it.x - x0, y: it.y - y0 })),
  };
}

/** The artboard a recipe actually wants: the field's, or just the ink's. */
const boardFor = (shapeFn, S, recipe) => {
  const layout = shapeFn(S, recipe);
  return recipe.field ? layout : trimToInk(layout);
};

const svgFor = (layout, recipe, extra = {}) =>
  doc(layout.w, layout.h, paint(layout, { ...recipe, ...extra }), 'The Ned Workshop');

const written = [];
const note = (p) => written.push(p);

// ------------------------------------------------------- artwork + separations

const summary = [];

for (const [shapeName, shapeFn] of Object.entries(SHAPES)) {
  for (const [recipeName, recipe] of Object.entries(RECIPES)) {
    const layout = boardFor(shapeFn, 1200 / boardFor(shapeFn, 1, recipe).w, recipe);
    const base = `lockup-${shapeName}-${recipeName}`;
    writeFileSync(out(`${base}.svg`), svgFor(layout, recipe));
    note(`${base}.svg`);

    const inks = inksUsed(layout, recipe);
    summary.push({ shape: shapeName, recipe: recipeName, inks, w: layout.w, h: layout.h });

    // One file per screen. A separation is the artwork that one ink lays down, solid black —
    // what the shop burns from — so a knocked-out word arrives as a hole in its patch, not as
    // a second piece of film that has to line up with the first.
    if (recipeName === 'one-color') continue;
    inks.forEach((hex, i) => {
      const name = `${String(i + 1).padStart(2, '0')}-${INK_NAMES[hex] ?? hex.slice(1)}`;
      writeFileSync(out(`separations/${base}/${name}.svg`), svgFor(layout, recipe, { only: hex }));
      note(`separations/${base}/${name}.svg`);
    });
  }
}

// The single-ink badge for caps, sleeves and pocket hits, where the full lockup would be three
// smudges. Black art, so the shop can flood it with whatever one ink the garment wants.
const ICON = 1200;
writeFileSync(out('icon-one-color.svg'), doc(ICON, ICON, iconOneColor(ICON, '#000000'), 'The Ned Workshop'));
note('icon-one-color.svg');

// ------------------------------------------------------------------- previews

/** The mark on a garment colour, for eyeballing before anyone burns a screen. */
async function preview(name, layout, recipe, garment, { pad = 0.16, flatten = null } = {}) {
  const w = 1400;
  const markW = w * (1 - pad * 2);
  const scale = markW / layout.w;
  const h = Math.round(layout.h * scale + w * pad * 2);
  const body =
    `<rect width="${w}" height="${h}" fill="${GARMENTS[garment]}"/>` +
    `<g transform="translate(${(w * pad).toFixed(2)} ${((h - layout.h * scale) / 2).toFixed(2)}) scale(${scale.toFixed(5)})">` +
    paint(layout, flatten ? { ...recipe, flatten } : recipe) +
    `</g>`;
  await sharp(Buffer.from(doc(w, h, body, 'The Ned Workshop')), { density: 300 })
    .resize(w, h)
    .png({ compressionLevel: 9 })
    .toFile(out(`previews/${name}.png`));
  note(`previews/${name}.png`);
}

for (const [shapeName, shapeFn] of Object.entries(SHAPES)) {
  const at = (recipe) => boardFor(shapeFn, 1, recipe);
  const dark = RECIPES['dark-garment'];
  const light = RECIPES['light-garment'];
  const one = RECIPES['one-color'];
  await preview(`${shapeName}-dark-garment-forest`, at(dark), dark, 'forest');
  await preview(`${shapeName}-dark-garment-black`, at(dark), dark, 'black');
  await preview(`${shapeName}-light-garment-natural`, at(light), light, 'natural');
  await preview(`${shapeName}-one-color-forest`, at(one), one, 'forest', { flatten: COLORS.cream });
  await preview(`${shapeName}-one-color-natural`, at(one), one, 'natural', { flatten: COLORS.quilt });
}

// -------------------------------------------------------------------- masters

// A genuinely transparent lockup — nothing behind the mark at all — for overlaying on photos,
// vinyl and embroidery digitising. (The social pack's file of that name is the mark on its
// green plate; only the rounded corners are clear.)
const wideDark = boardFor(SHAPES.wide, 2400 / boardFor(SHAPES.wide, 1, RECIPES['dark-garment']).w, RECIPES['dark-garment']);
await sharp(Buffer.from(svgFor(wideDark, RECIPES['dark-garment'])), { density: 300 })
  .resize(2400)
  .png({ compressionLevel: 9 })
  .toFile(out('lockup-wide-transparent-2400.png'));
note('lockup-wide-transparent-2400.png');

// ---------------------------------------------------------------------- readme

const inkRow = (s) =>
  `| \`lockup-${s.shape}-${s.recipe}.svg\` | ${s.shape} | ${s.inks.length} | ${s.inks
    .map((h) => `${INK_NAMES[h] ?? h}`)
    .join(', ')} |`;

writeFileSync(
  out('README.md'),
  `# The Ned Workshop — screen-printing artwork

Generated from the site's own wordmark by \`scripts/generate-print-assets.mjs\`. Re-run it
rather than editing these by hand:

    npm run brand:print

Everything here is flat spot colour with the type already converted to outlines — no gradients,
no halftones, no font to install. Hand a printer the SVGs, not the PNGs.

## What to print

**On a dark green or black garment — 3 screens.** \`lockup-*-dark-garment.svg\`. The green field
is dropped and the shirt becomes the background, so the three patches float free — which is the
quilting metaphor the brand is built on, and a much lighter hand than a solid printed field.
"the" and "workshop" are knocked out, so the garment shows through the letters.

**On a natural or cream garment — 4 screens.** \`lockup-*-light-garment.svg\`. The green field is
printed, and the knocked-out words reveal it, so the mark reads exactly as it does on screen.
Note the field is a large solid area: fine in the wide ratio, heavy in the stacked one.

**One screen.** \`lockup-*-one-color.svg\` and \`icon-one-color.svg\`, supplied as black art so the
shop can flood any ink. The icon is the right choice for caps, sleeves and pocket hits, where
the full lockup would be three smudges.

## Files

| file | shape | screens | inks, in print order |
| --- | --- | --- | --- |
${summary
  .filter((s) => s.recipe !== 'one-color')
  .map(inkRow)
  .join('\n')}
| \`lockup-wide-one-color.svg\` | wide | 1 | any |
| \`lockup-stacked-one-color.svg\` | stacked | 1 | any |
| \`icon-one-color.svg\` | square | 1 | any |

\`separations/\` holds one file per screen, solid black — burn straight from these. A knocked-out
word arrives as a hole in its patch rather than as separate film that has to register.

\`previews/\` shows each variant on its garment colour. \`lockup-wide-transparent-2400.png\` is the
mark with nothing at all behind it.

## Inks

| | hex | note |
| --- | --- | --- |
| green | \`${COLORS.quilt}\` | one green, not the three the screen version uses |
| pink | \`${COLORS.pink}\` | the starburst |
| coral | \`${COLORS.coral}\` | the NED patch |
| cream | \`${COLORS.cream}\` | the workshop panel and the NED letters |

Light inks on a dark garment need an opaque ink or a white underbase — ask the shop, and budget
a screen for it if they want one.

## Sizes

Measured on the artwork itself — every file here is trimmed to the ink, so a width you give the
shop is a width of mark.

| variant | ratio | adult chest | youth |
| --- | --- | --- | --- |
${summary
  .map((s) => {
    const wIn = s.shape === 'wide' ? 11 : 10;
    const yIn = s.shape === 'wide' ? 8 : 7;
    return `| ${s.shape} / ${s.recipe} | ${(s.w / s.h).toFixed(2)}:1 | ${wIn}in wide → ${((wIn * s.h) / s.w).toFixed(1)}in tall | ${yIn}in wide |`;
  })
  .join('\n')}

The finest detail is the starburst points, about 0.13in deep even on a youth-size wide print —
comfortably above what a screen holds. Stacked reads better at youth sizes.

Type is Titan One (SIL Open Font License), glyphs converted to outlines.
`
);
note('README.md');

console.log('wrote the print pack to ' + (process.argv[2] ?? 'public/images/brand/print'));
for (const s of summary) console.log(`  ${s.shape}/${s.recipe}: ${s.inks.length} screen(s)`);
console.log(`  ${written.length} files`);
