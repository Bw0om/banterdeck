import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';
import minifyInline from './integrations/minify-inline.mjs';

// Byggversjonen (git-commit på Vercel, ellers datoen). Den automatiske feilloggen viser hvilken versjon en feil kom fra.
const BYGG = String(process.env.VERCEL_GIT_COMMIT_SHA || '').slice(0, 7) || new Date().toISOString().slice(0, 10);

export default defineConfig({
  site: 'https://www.mittvors.no',
  integrations: [minifyInline(), sitemap({
    filter: (p) => !p.includes('/admin') && !/\/tv\/?$/.test(p) && !/\/(statistikk|kortstokk|aksjer|salg|feillogg)\/?$/.test(p) && !p.includes('/kortstokk'),
    // Nyhetsrunden lages på serveren (slippes fredag kl. 12), så den legges til her
    customPages: ['https://mittvors.no/no/nyhetsrunden', 'https://mittvors.no/no/nyhetsrunden/arkiv'],
  })],
  // Statisk side, men med én serverfunksjon (/api/forslag) som kjører på Vercel.
  adapter: vercel(),
  vite: { define: { __MV_BYGG__: JSON.stringify(BYGG) } },
  build: {
    // Legger CSS-en rett inn i hver side i stedet for en egen fil.
    // Da kan ikke stilene "forsvinne" underveis, og siden slipper et ekstra nedlastingskall.
    inlineStylesheets: 'always',
  },
});
