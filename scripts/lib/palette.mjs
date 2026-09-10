/**
 * The brand colours.
 *
 * Split out from wordmark.mjs so that something which only wants the palette — the /brand page,
 * say — does not also pull in the font parsing. wordmark.mjs reads the Titan One file relative to
 * its own location, and a bundler that inlines it moves that location out from under it; plain
 * data has no such problem and can be imported from anywhere.
 *
 * Must stay in sync with the custom properties in src/components/WordmarkLogo.astro.
 */
const COLORS = {
  quilt: '#23392c',
  pink: '#f2a7c6',
  coral: '#ff8383', // amber-500 in tailwind.config.mjs — the Donate button
  cream: '#fbf5e3',
  ink: '#1e3326',
  green: '#3f5c3a',
  page: '#fff8ee', // amber-50
};

export { COLORS };
