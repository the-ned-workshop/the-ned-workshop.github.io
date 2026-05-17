#!/usr/bin/env node
// Generate a Facebook Event cover photo (SVG + PNG) from a wordmark.
//
// Usage:
//   node scripts/generate-event-cover.js "NED GRAVEL EXPO"
//
// Writes .stash/fb-event-cover-<slug>.svg and .png. PNG is rasterized by
// headless Google Chrome so Google Fonts (Caprasimo, Baloo 2) load at
// render time — requires network access.

import { writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(REPO_ROOT, '.stash');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const W = 1920;
const H = 1005;
const FONT_SIZE = 100;
const LETTER_SPACING = 3;
const BASELINE_Y = 510;

const COLORS = {
  cream: '#FFFBEB',
  amberLight: '#FCD34D',
  amberDeep: '#D97706',
  amberDark: '#B45309',
};

const wordmark = process.argv[2];
if (!wordmark) {
  console.error('Usage: node scripts/generate-event-cover.js "WORDMARK TEXT"');
  process.exit(1);
}

const slug = wordmark
  .toLowerCase()
  .replace(/['‘’]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

const xmlEscape = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@700&amp;family=Caprasimo&amp;display=swap');
      .wordmark { font-family: 'Caprasimo', 'Georgia', serif; fill: ${COLORS.amberDeep}; }
      .attribution { font-family: 'Baloo 2', 'Helvetica Neue', sans-serif; font-weight: 700; fill: ${COLORS.amberDark}; }
    </style>
  </defs>
  <rect width="${W}" height="${H}" fill="${COLORS.cream}"/>
  <rect x="0" y="0" width="${W}" height="6" fill="${COLORS.amberLight}"/>
  <text x="${W / 2}" y="${BASELINE_Y}" text-anchor="middle" class="wordmark" font-size="${FONT_SIZE}" letter-spacing="${LETTER_SPACING}">${xmlEscape(wordmark)}</text>
  <rect x="0" y="933" width="${W}" height="2" fill="${COLORS.amberDeep}" opacity="0.35"/>
  <rect x="0" y="935" width="${W}" height="70" fill="${COLORS.amberLight}"/>
  <text x="${W / 2}" y="982" text-anchor="middle" class="attribution" font-size="30" letter-spacing="6">THE NED WORKSHOP</text>
</svg>
`;

mkdirSync(OUT_DIR, { recursive: true });
const svgPath = join(OUT_DIR, `fb-event-cover-${slug}.svg`);
const pngPath = join(OUT_DIR, `fb-event-cover-${slug}.png`);
writeFileSync(svgPath, svg);
execFileSync(
  CHROME,
  [
    '--headless',
    '--disable-gpu',
    '--hide-scrollbars',
    `--window-size=${W},${H}`,
    `--screenshot=${pngPath}`,
    `file://${svgPath}`,
  ],
  { stdio: ['ignore', 'ignore', 'inherit'] },
);
console.log(`Wrote ${svgPath}`);
console.log(`Wrote ${pngPath}`);
