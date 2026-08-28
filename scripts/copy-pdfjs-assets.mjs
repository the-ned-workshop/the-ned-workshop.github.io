#!/usr/bin/env node
// Copy pdf.js runtime data files out of node_modules and into public/ so the
// pattern viewer can self-host them instead of reaching for a CDN.
//
// Only `standard_fonts` is copied: pdf.js needs it to draw PDFs that reference
// the 14 standard PDF fonts (Helvetica, Times, ...) without embedding them,
// which plenty of sewing patterns do. `cmaps` is skipped — it is 1.6 MB and
// only matters for CJK encodings.
//
// Runs automatically from `npm run dev` and `npm run build`. The output lives
// at public/pdfjs/ and is gitignored.

import { cp, mkdir, rm, access } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(REPO_ROOT, 'node_modules', 'pdfjs-dist', 'standard_fonts');
const DEST = join(REPO_ROOT, 'public', 'pdfjs', 'standard_fonts');

try {
  await access(SRC);
} catch {
  console.error(`copy-pdfjs-assets: ${SRC} not found — run \`npm install\` first.`);
  process.exit(1);
}

await rm(DEST, { recursive: true, force: true });
await mkdir(dirname(DEST), { recursive: true });
await cp(SRC, DEST, { recursive: true });

console.log(`copy-pdfjs-assets: standard_fonts -> ${DEST.replace(REPO_ROOT + '/', '')}`);
