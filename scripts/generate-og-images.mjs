/**
 * Builds a branded share image for every event that has its own photo.
 *
 * Event photos are portrait, landscape and square, and a link preview is a fixed 1200x630 — so
 * cover-cropping would cut the top off a portrait shot and behead a square flyer. Instead each
 * image is letterboxed onto a blurred, darkened copy of itself, and the wordmark is composited
 * bottom-left so a shared link carries the brand no matter what the photo is.
 *
 * A letterboxed portrait or square leaves empty bands at the sides; when a band is wide enough
 * to hold a legible mark the wordmark goes there instead of on top of the artwork, which matters
 * for the event flyers.
 *
 * Runs as part of `npm run dev` and `npm run build`; output is gitignored and rebuilt from the
 * event markdown, so adding an event needs no extra step. A missing source image is a hard
 * error rather than a silently broken og:image.
 */
import { readFileSync, readdirSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import sharp from 'sharp';
import { wideLockup, doc, COLORS } from './lib/wordmark.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, '..');
const eventsDir = resolve(repo, 'src/data/events');
const outDir = resolve(repo, 'public/images/og');

const OG = { w: 1200, h: 630 };
const PAD = 28; // breathing room around a letterboxed image
const LOGO_W = 330;
const LOGO_MARGIN = 36;
const LOGO_MIN_W = 200; // below this the wordmark stops being readable in a preview

/** The lockup on a cream plate, so it separates from whatever photo is behind it. */
function logoPlate(width) {
  const S = width / wideLockup(1).w;
  const lock = wideLockup(S);
  const b = 0.42 * S;
  return Buffer.from(
    doc(
      lock.w + b * 2,
      lock.h + b * 2,
      `<rect width="${(lock.w + b * 2).toFixed(2)}" height="${(lock.h + b * 2).toFixed(2)}" ` +
        `rx="${(2.2 * S).toFixed(2)}" fill="${COLORS.cream}"/>` +
        `<g transform="translate(${b.toFixed(2)} ${b.toFixed(2)})">${lock.svg}</g>`,
      'The Ned Workshop'
    )
  );
}

/** Same frontmatter shape src/lib/events.ts parses. */
function eventImages() {
  const out = [];
  for (const file of readdirSync(eventsDir).filter((f) => f.endsWith('.md'))) {
    const slug = file.replace(/\.md$/, '');
    const raw = readFileSync(resolve(eventsDir, file), 'utf8');
    const fm = raw.match(/^---\n([\s\S]*?)\n---/);
    if (!fm) continue;
    const line = fm[1].split('\n').find((l) => l.startsWith('image:'));
    if (!line) continue;
    const src = line.slice('image:'.length).trim().replace(/^['"]|['"]$/g, '');
    out.push({ slug, src: resolve(repo, src.replace(/^\/public\//, 'public/').replace(/^\//, 'public/')) });
  }
  return out;
}

const events = eventImages();
if (events.length) mkdirSync(outDir, { recursive: true });

const plates = new Map();
async function plateAt(width) {
  if (!plates.has(width)) {
    const png = await sharp(logoPlate(width), { density: 300 }).resize({ width }).png().toBuffer();
    plates.set(width, { png, height: (await sharp(png).metadata()).height });
  }
  return plates.get(width);
}

for (const { slug, src } of events) {
  if (!existsSync(src)) {
    throw new Error(`Event "${slug}" points at a missing image: ${src}`);
  }

  const backdrop = await sharp(src)
    .resize(OG.w, OG.h, { fit: 'cover' })
    .blur(28)
    .modulate({ brightness: 0.62 })
    .toBuffer();

  const foreground = await sharp(src)
    .resize(OG.w - PAD * 2, OG.h - PAD * 2, { fit: 'inside', withoutEnlargement: false })
    .toBuffer();
  const fg = await sharp(foreground).metadata();

  // Sit in the empty side band when there is room for a legible mark, otherwise overlay the image.
  const band = Math.round((OG.w - fg.width) / 2);
  const inBand = band - LOGO_MARGIN * 2 >= LOGO_MIN_W;
  const logoW = inBand ? Math.min(LOGO_W, band - LOGO_MARGIN * 2) : LOGO_W;
  const plate = await plateAt(logoW);

  await sharp(backdrop)
    .composite([
      {
        input: foreground,
        left: Math.round((OG.w - fg.width) / 2),
        top: Math.round((OG.h - fg.height) / 2),
      },
      {
        input: plate.png,
        left: inBand ? Math.round((band - logoW) / 2) : LOGO_MARGIN,
        top: OG.h - plate.height - LOGO_MARGIN,
      },
    ])
    .jpeg({ quality: 86, progressive: true })
    .toFile(resolve(outDir, `${slug}.jpg`));
}

console.log(`generated ${events.length} event share image(s) in public/images/og/`);
