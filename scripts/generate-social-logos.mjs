/**
 * Exports a social profile / banner pack from the same Titan One outlines the site uses.
 *
 * Usage:  npm run brand:social -- "/path/to/output/folder"
 *
 * Instagram, Facebook and YouTube all crop a profile picture to a circle, so the square
 * profile art comes in two cuts: one sized to survive the circle mask, and a squarer one for
 * the places that don't mask it.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import sharp from 'sharp';
import { COLORS, wideLockup, stackedLockup, doc } from './lib/wordmark.mjs';

const outDir = process.argv[2];
if (!outDir) {
  console.error('Usage: npm run brand:social -- "/path/to/output/folder"');
  process.exit(1);
}
mkdirSync(outDir, { recursive: true });
const out = (name) => resolve(outDir, name);

const png = (svg, w, h) =>
  sharp(Buffer.from(svg), { density: 400 }).resize(w, h).png({ compressionLevel: 9 });

/** Square tile, green to the edges. `fit` is the fraction of the side the mark may occupy. */
function tile(side, fit) {
  const S = (side * fit) / stackedLockup(1).w;
  const l = stackedLockup(S);
  return doc(
    side,
    side,
    `<rect width="${side}" height="${side}" fill="${COLORS.quilt}"/>` +
      `<g transform="translate(${((side - l.w) / 2).toFixed(2)} ${((side - l.h) / 2).toFixed(2)})">${l.svg}</g>`,
    'The Ned Workshop'
  );
}

/**
 * Circle-safe tile: every platform masks a profile picture to a circle, so the mark has to fit
 * inside the inscribed circle by its diagonal, not its width.
 */
function circleSafeTile(side) {
  const unit = stackedLockup(1);
  const diag = Math.hypot(unit.w, unit.h);
  const S = (side * 0.88) / diag;
  const l = stackedLockup(S);
  return doc(
    side,
    side,
    `<rect width="${side}" height="${side}" fill="${COLORS.quilt}"/>` +
      `<g transform="translate(${((side - l.w) / 2).toFixed(2)} ${((side - l.h) / 2).toFixed(2)})">${l.svg}</g>`,
    'The Ned Workshop'
  );
}

/** Wide lockup centred on the site's page colour — for covers and banners. */
function banner(w, h, safeW) {
  const l = wideLockup(Math.min(safeW * 0.82, w * 0.5) / wideLockup(1).w);
  return doc(
    w,
    h,
    `<rect width="${w}" height="${h}" fill="${COLORS.page}"/>` +
      `<g transform="translate(${((w - l.w) / 2).toFixed(2)} ${((h - l.h) / 2).toFixed(2)})">${l.svg}</g>`,
    'The Ned Workshop'
  );
}

const wide = wideLockup(2400 / wideLockup(1).w);
const wideSvg = doc(wide.w, wide.h, wide.svg, 'The Ned Workshop');

// Vector masters
writeFileSync(out('wordmark-wide.svg'), wideSvg);
writeFileSync(out('logo-tile.svg'), tile(1024, 0.84));

// Profile pictures
await png(circleSafeTile(1024), 1024, 1024).toFile(out('profile-circle-safe-1024.png'));
await png(tile(1024, 0.84), 1024, 1024).toFile(out('profile-square-1024.png'));

// Transparent wordmark, for overlaying on photos or print
await png(wideSvg, 2400, Math.round((2400 * wide.h) / wide.w)).toFile(
  out('wordmark-wide-2400-transparent.png')
);

// Covers
await png(banner(1640, 624, 1640), 1640, 624).toFile(out('facebook-cover-1640x624.png'));
await png(banner(2560, 1440, 1546), 2560, 1440).toFile(out('youtube-banner-2560x1440.png'));

writeFileSync(
  out('README.md'),
  `# The Ned Workshop — social branding

Generated from the site's own wordmark by \`scripts/generate-social-logos.mjs\` in the
website repo. Re-run it rather than editing these by hand:

    npm run brand:social -- "${outDir}"

## Files

| file | use |
| --- | --- |
| \`profile-circle-safe-1024.png\` | **Instagram, Facebook, YouTube profile.** All three mask to a circle; the mark is sized to fit inside it. |
| \`profile-square-1024.png\` | Profile art where the image is *not* circle-cropped. The mark is larger, so the corners would clip under a circle mask. |
| \`facebook-cover-1640x624.png\` | Facebook page cover. |
| \`youtube-banner-2560x1440.png\` | YouTube channel banner; the mark sits inside the 1546×423 area that shows on every device. |
| \`wordmark-wide-2400-transparent.png\` | The lockup with nothing behind it, for overlaying on photos or print. |
| \`wordmark-wide.svg\` | Vector master, wide lockup. |
| \`logo-tile.svg\` | Vector master, square tile. |

## Colors

| | hex | where |
| --- | --- | --- |
| quilt green | \`${COLORS.quilt}\` | the field behind the mark |
| pink | \`${COLORS.pink}\` | the "the" starburst |
| coral | \`${COLORS.coral}\` | the "NED" tile — same coral as the site's Donate button |
| cream | \`${COLORS.cream}\` | the "workshop" panel |
| dark green | \`${COLORS.green}\` | the word "workshop" |
| page cream | \`${COLORS.page}\` | banner backgrounds, the site's page colour |

Type is Titan One (SIL Open Font License), with the glyphs converted to outlines — nothing here
depends on the font being installed.
`
);

console.log(`wrote the social pack to ${outDir}`);
