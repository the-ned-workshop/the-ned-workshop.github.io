/**
 * The wordmark, drawn from the Titan One outlines.
 *
 * Shared by scripts/generate-brand-assets.mjs (favicon, app icon, og:image),
 * scripts/generate-og-images.mjs (per-event share images), generate-social-logos.mjs and
 * generate-print-assets.mjs (screen-printing artwork), so the mark is defined once.
 *
 * The mark is described as a list of *parts* — each one a plate (the rounded patch, or the
 * starburst behind a word) and the glyphs sitting on it — which a painter then inks. On screen
 * every piece is filled with its own colour. On a garment a word is usually knocked out of its
 * plate instead, so whatever is behind shows through the letters: that costs one screen fewer
 * and the letters cannot drift out of register, because they are the same piece of film as the
 * patch they sit in. Both come from this one copy of the geometry.
 *
 * Geometry and colors mirror src/components/WordmarkLogo.astro — change both together.
 *
 * Titan One is licensed under the SIL Open Font License; see assets/TitanOne-OFL.txt.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import opentype from 'opentype.js';
import { COLORS } from './palette.mjs';

const here = dirname(fileURLToPath(import.meta.url));

const font = opentype.parse(
  readFileSync(resolve(here, '../assets/TitanOne-Regular.ttf')).buffer
);

// Re-exported below, so everything that already reaches for COLORS here still works.


/**
 * Which ink each piece of the mark takes.
 *
 * On screen the mark uses three different dark greens — one for "the", one for the field, one
 * for "workshop". They never touch each other, and at arm's length on fabric nobody can tell
 * them apart, so the press palette collapses all three into one and saves two screens.
 */
const SCREEN_INKS = {
  pink: COLORS.pink,
  the: COLORS.ink,
  coral: COLORS.coral,
  cream: COLORS.cream,
  shop: COLORS.green,
  field: COLORS.quilt,
};

const PRINT_INKS = {
  pink: COLORS.pink,
  the: COLORS.quilt,
  coral: COLORS.coral,
  cream: COLORS.cream,
  shop: COLORS.quilt,
  field: COLORS.quilt,
};

// ------------------------------------------------------------------ geometry

const n3 = (n) => n.toFixed(3);

/** A rounded rectangle as path data, so a plate can share one path with the holes cut in it. */
function roundRectPath(w, h, r) {
  const R = Math.min(r, w / 2, h / 2);
  return (
    `M${n3(R)},0H${n3(w - R)}A${n3(R)},${n3(R)} 0 0 1 ${n3(w)},${n3(R)}` +
    `V${n3(h - R)}A${n3(R)},${n3(R)} 0 0 1 ${n3(w - R)},${n3(h)}` +
    `H${n3(R)}A${n3(R)},${n3(R)} 0 0 1 0,${n3(h - R)}` +
    `V${n3(R)}A${n3(R)},${n3(R)} 0 0 1 ${n3(R)},0Z`
  );
}

/** The 12-point starburst behind "the". */
function starburstPath(size, dx = 0, dy = 0) {
  const pts = [];
  for (let i = 0; i < 24; i++) {
    const a = ((-90 + i * 15) * Math.PI) / 180;
    const r = (i % 2 === 0 ? 0.5 : 0.39) * size;
    pts.push(
      `${(dx + size / 2 + r * Math.cos(a)).toFixed(2)},${(dy + size / 2 + r * Math.sin(a)).toFixed(2)}`
    );
  }
  return `M${pts.join('L')}Z`;
}

/** Rotate a glyph path in place, so it can be baked into a parent's rotated frame. */
function rotatePath(path, deg, cx, cy) {
  const a = (deg * Math.PI) / 180;
  const cos = Math.cos(a);
  const sin = Math.sin(a);
  for (const c of path.commands) {
    for (const [kx, ky] of [['x', 'y'], ['x1', 'y1'], ['x2', 'y2']]) {
      if (c[kx] === undefined) continue;
      const x = c[kx] - cx;
      const y = c[ky] - cy;
      c[kx] = cx + x * cos - y * sin;
      c[ky] = cy + x * sin + y * cos;
    }
  }
  return path;
}

/**
 * A word's outlines, measured by the glyphs rather than the line box and positioned so the
 * inked area starts at (padX, padY) — plus any extra offset the caller wants baked in.
 */
function wordPath(text, fontSize, padX, padY, dx = 0, dy = 0) {
  const bb = font.getPath(text, 0, 0, fontSize).getBoundingBox();
  const path = font.getPath(text, -bb.x1 + padX + dx, -bb.y1 + padY + dy, fontSize);
  return {
    path,
    d: path.toPathData(3),
    w: bb.x2 - bb.x1 + padX * 2,
    h: bb.y2 - bb.y1 + padY * 2,
  };
}

// --------------------------------------------------------------------- parts

/** A word in a rounded rectangle. */
function patchPart(text, fontSize, padX, padY, { glyph, plate, radius }) {
  const word = wordPath(text, fontSize, padX, padY);
  return {
    w: word.w,
    h: word.h,
    wrap: '',
    plate: { d: roundRectPath(word.w, word.h, radius), ink: plate },
    glyphs: { d: word.d, ink: glyph },
  };
}

/** "the", on its starburst, tilted. */
function starPart(S) {
  const size = 6.2 * S;
  const probe = wordPath('the', 2.2 * S, 0, 0);
  const word = wordPath('the', 2.2 * S, 0, 0, (size - probe.w) / 2, (size - probe.h) / 2);
  return {
    w: size,
    h: size,
    wrap: `rotate(-6 ${size / 2} ${size / 2})`,
    plate: { d: starburstPath(size), ink: 'pink' },
    glyphs: { d: word.d, ink: 'the' },
  };
}

const nedPart = (S) =>
  patchPart('NED', 3.0 * S, 1.1 * S, 0.55 * S, { glyph: 'cream', plate: 'coral', radius: 1.2 * S });

const shopPart = (S, padX) =>
  patchPart('workshop', 3.4 * S, padX * S, 0.5 * S, { glyph: 'shop', plate: 'cream', radius: 1.2 * S });

// ------------------------------------------------------------------- layouts

/** One row: the ★ NED workshop, on the green field. */
function wideLayout(S) {
  const gap = 1.1 * S;
  const padX = 1.6 * S;
  const padY = 1.4 * S;
  const parts = [starPart(S), nedPart(S), shopPart(S, 1.2)];
  const rowW = parts.reduce((a, p) => a + p.w, 0) + gap * (parts.length - 1);
  const rowH = Math.max(...parts.map((p) => p.h));
  const w = rowW + padX * 2;
  const h = rowH + padY * 2;

  let x = padX;
  const items = parts.map((part) => {
    const item = { part, x, y: padY + (rowH - part.h) / 2 };
    x += part.w + gap;
    return item;
  });

  return { w, h, items, field: { d: roundRectPath(w, h, 1.8 * S), ink: 'field' } };
}

/**
 * Two rows, for square slots. No field of its own — the tile behind it supplies the green.
 *
 * `field: true` gives it one anyway, padded like the wide lockup's. A knocked-out word needs
 * something behind it to reveal: printed on a cream garment with nothing under it, "workshop"
 * would be cream letters cut out of a cream panel, which is to say nothing at all.
 */
function stackedLayout(S, { field = false } = {}) {
  const gap = 1.1 * S;
  const rowGap = 0.9 * S;
  const pad = field ? 1.5 * S : 0;
  const top = [starPart(S), nedPart(S)];
  const shop = shopPart(S, 0.5);
  const topW = top.reduce((a, p) => a + p.w, 0) + gap;
  const topH = Math.max(...top.map((p) => p.h));
  const inner = Math.max(topW, shop.w);
  const w = inner + pad * 2;
  const h = topH + rowGap + shop.h + pad * 2;

  let x = pad + (inner - topW) / 2;
  const items = top.map((part) => {
    const item = { part, x, y: pad + (topH - part.h) / 2 };
    x += part.w + gap;
    return item;
  });
  items.push({ part: shop, x: pad + (inner - shop.w) / 2, y: pad + topH + rowGap });

  return { w, h, items, field: field ? { d: roundRectPath(w, h, 1.8 * S), ink: 'field' } : null };
}

// ------------------------------------------------------------------ painting

/** The paths one part contributes, already resolved to an ink. */
function partPaths(part, inks, knockout, flatten) {
  const hex = (role) => flatten ?? inks[role];
  if (part.plate && knockout.has(part.glyphs.ink)) {
    // Plate and holes as a single even-odd path. The words' outlines never overlap each other,
    // so nesting depth is all that decides what is inked: the patch fills, the letters cut
    // through it, and a counter inside a letter stays an island of patch, as it looks on screen.
    return [{ hex: hex(part.plate.ink), d: part.plate.d + part.glyphs.d, evenodd: true }];
  }
  const paths = [];
  if (part.plate) paths.push({ hex: hex(part.plate.ink), d: part.plate.d, evenodd: false });
  paths.push({ hex: hex(part.glyphs.ink), d: part.glyphs.d, evenodd: false });
  return paths;
}

/**
 * Ink a layout.
 *
 * `knockout` names the glyph inks to cut out of the plate they sit on instead of printing on
 * top of it. `flatten` forces every piece to one ink, for a single-screen print. `only` keeps
 * just the geometry that one ink lays down and draws it solid black — a separation.
 */
function paint(layout, opts = {}) {
  const { inks = SCREEN_INKS, field = true, knockout = [], flatten = null, only = null } = opts;
  const ko = new Set(knockout);

  const draw = ({ hex, d, evenodd }) =>
    only && hex !== only
      ? ''
      : `<path${evenodd ? ' fill-rule="evenodd"' : ''} d="${d}" fill="${only ? '#000000' : hex}"/>`;

  let out = '';
  if (field && layout.field) {
    out += draw({ hex: flatten ?? inks[layout.field.ink], d: layout.field.d, evenodd: false });
  }
  for (const { part, x, y } of layout.items) {
    const inner = partPaths(part, inks, ko, flatten).map(draw).join('');
    if (!inner) continue;
    const body = part.wrap ? `<g transform="${part.wrap}">${inner}</g>` : inner;
    out += `<g transform="translate(${x.toFixed(2)} ${y.toFixed(2)})">${body}</g>`;
  }
  return out;
}

/** Every ink a given painting recipe actually lays down, in the order it would be printed. */
function inksUsed(layout, opts = {}) {
  const { inks = SCREEN_INKS, field = true, knockout = [], flatten = null } = opts;
  const ko = new Set(knockout);
  const used = [];
  const add = (hex) => {
    if (hex && !used.includes(hex)) used.push(hex);
  };
  if (field && layout.field) add(flatten ?? inks[layout.field.ink]);
  for (const { part } of layout.items) {
    for (const p of partPaths(part, inks, ko, flatten)) add(p.hex);
  }
  return used;
}

// ------------------------------------------------------------- the icon mark

/**
 * A single-glyph mark for small square slots — the favicon and the app icon.
 *
 * The full lockup is three words of Titan One; below about 48px it collapses into
 * three unreadable smudges, which is what Google renders next to a search result.
 * So the icon keeps only the two parts that survive: the starburst and an N.
 */
function iconMark(size) {
  const burst = size * 0.98;
  const inset = (size - burst) / 2;
  const probe = wordPath('N', size * 0.46, 0, 0);
  const n = wordPath('N', size * 0.46, 0, 0, (size - probe.w) / 2, (size - probe.h) / 2);
  return (
    // Cream rather than the quilt green the lockup sits on: at 16px so little of the
    // ground shows around the starburst that a dark one just reads as a black chip.
    `<rect width="${size}" height="${size}" fill="${COLORS.cream}"/>` +
    `<g transform="rotate(-6 ${(size / 2).toFixed(2)} ${(size / 2).toFixed(2)})">` +
    `<path d="${starburstPath(burst, inset, inset)}" fill="${COLORS.pink}"/>` +
    `</g>` +
    `<path d="${n.d}" fill="${COLORS.ink}"/>`
  );
}

/**
 * The icon mark in one ink: the burst with the N cut out of it.
 *
 * The burst is tilted and the N is not, so the N is counter-rotated into the burst's frame —
 * it lands upright on the page, but as path data it lives in the same frame as the burst and
 * the two can be one even-odd path, which is what a single screen needs.
 */
function iconOneColor(size, hex) {
  const burst = size * 0.98;
  const inset = (size - burst) / 2;
  const probe = wordPath('N', size * 0.46, 0, 0);
  const n = wordPath('N', size * 0.46, 0, 0, (size - probe.w) / 2, (size - probe.h) / 2);
  const upright = rotatePath(n.path, 6, size / 2, size / 2).toPathData(3);
  return (
    `<g transform="rotate(-6 ${(size / 2).toFixed(2)} ${(size / 2).toFixed(2)})">` +
    `<path fill-rule="evenodd" d="${starburstPath(burst, inset, inset)}${upright}" fill="${hex}"/>` +
    `</g>`
  );
}

// -------------------------------------------------------------- public shape

/** The lockups as the site generators want them: laid out and inked in the screen palette. */
const wideLockup = (S) => {
  const layout = wideLayout(S);
  return { w: layout.w, h: layout.h, svg: paint(layout) };
};

const stackedLockup = (S) => {
  const layout = stackedLayout(S);
  return { w: layout.w, h: layout.h, svg: paint(layout) };
};

const doc = (w, h, body, title) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w.toFixed(2)} ${h.toFixed(2)}" ` +
  `width="${w.toFixed(2)}" height="${h.toFixed(2)}" role="img" aria-label="The Ned Workshop">` +
  `<title>${title}</title>${body}</svg>\n`;

export {
  COLORS,
  SCREEN_INKS,
  PRINT_INKS,
  iconMark,
  iconOneColor,
  wideLockup,
  stackedLockup,
  wideLayout,
  stackedLayout,
  paint,
  inksUsed,
  doc,
};
