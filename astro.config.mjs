import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://nedworkshop.org',
  integrations: [
    tailwind(),
    sitemap({
      filter: (page) => !page.includes('/event-photo-generator'),
    }),
  ],
});
