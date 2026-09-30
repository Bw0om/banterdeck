import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';
import minifyInline from './integrations/minify-inline.mjs';

export default defineConfig({
  site: 'https://www.mittvors.no',
  integrations: [minifyInline(), sitemap({
    filter: (p) => !p.includes('/admin') && !p.includes('/statistikk') && !p.includes('/kortstokk'),
    // Nyhetsrunden lages på serveren (slippes fredag kl. 12), så den legges til her
    customPages: ['https://mittvors.no/no/nyhetsrunden', 'https://mittvors.no/no/nyhetsrunden/arkiv'],
  })],
  // Statisk side, men med én serverfunksjon (/api/forslag) som kjører på Vercel.
  adapter: vercel(),
  build: {
    // Legger CSS-en rett inn i hver side i stedet for en egen fil.
    // Da kan ikke stilene "forsvinne" underveis, og siden slipper et ekstra nedlastingskall.
    inlineStylesheets: 'always',
  },
});
