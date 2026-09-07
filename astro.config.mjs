import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://nedworkshop.org',
  vite: {
    // pdf.js ships as ESM already; letting Vite pre-bundle its large legacy
    // build on demand makes the dev server time out serving the module.
    optimizeDeps: {
      exclude: ['pdfjs-dist'],
    },
  },
  integrations: [
    tailwind(),
    sitemap({
      // Both of these tell Google not to index them — the generator is `noindex,
      // nofollow`, and /donate is a `noindex` bounce to Givebutter — so listing
      // them in the sitemap only asks for a page we have already said to skip.
      filter: (page) =>
        !page.includes('/event-photo-generator') && !page.includes('/donate'),
    }),
  ],
});
