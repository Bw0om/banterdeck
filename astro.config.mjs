import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

export default defineConfig({
  site: 'https://banterdeck.com',
  integrations: [sitemap({
    filter: (p) => !p.includes('/admin') && !p.includes('/statistikk') && !p.includes('/kortstokk'),
    // Nyhetsrunden lages på serveren (slippes fredag kl. 12), så den legges til her
    customPages: ['https://banterdeck.com/no/nyhetsrunden'],
  })],
  // Statisk side, men med én serverfunksjon (/api/forslag) som kjører på Vercel.
  adapter: vercel(),
  build: {
    // Legger CSS-en rett inn i hver side i stedet for en egen fil.
    // Da kan ikke stilene "forsvinne" underveis, og siden slipper et ekstra nedlastingskall.
    inlineStylesheets: 'always',
  },
});
