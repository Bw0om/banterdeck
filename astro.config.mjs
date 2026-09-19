import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  // ← BYTT til ditt eget domene når du har kjøpt det (brukes til sitemap og canonical-lenker)
  site: 'https://banterdeck.com',
  integrations: [sitemap()],
});
