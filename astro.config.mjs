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
    // Små stilark legges rett inn i siden, det store felles stilarket blir en egen fil med versjonsnavn.
    // Før lå 430 kB CSS inne i hver eneste side og ble lastet ned på nytt ved hver sidevisning;
    // nå lagres den én gang (også av appens service worker, så den virker uten nett).
    inlineStylesheets: 'auto',
  },
});
