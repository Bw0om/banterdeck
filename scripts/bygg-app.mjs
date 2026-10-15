// Bygger sidene inn i appen: `npm run build:app`.
// Kjører det vanlige Astro-bygget med MV_APP=1 (siden vet da at den er appen, og at API-et ligger på mittvors.no),
// og legger de ferdige filene i app-www/, som Capacitor pakker inn i iPhone-appen (capacitor.config.json → webDir).
// Det som bare hører til nettet, tas ut: delingsbilder, adminsider og service worker.
import { spawnSync } from 'node:child_process';
import { cpSync, rmSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const UT = 'app-www';
const KILDE = join('dist', 'client');
// Nettside-ting appen ikke trenger (sparer plass i app-pakken)
const UTELAT = ['og', 'admin', 'sw.js', 'sitemap-index.xml', 'sitemap-0.xml', 'robots.txt', 'llms.txt', 'content.json', '.well-known', 'no/feillogg', 'no/salg', 'no/aksjer', 'no/statistikk'];

const r = spawnSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['astro', 'build'], { stdio: 'inherit', env: { ...process.env, MV_APP: '1' }, shell: process.platform === 'win32' });
if (r.status !== 0) process.exit(r.status || 1);
if (!existsSync(KILDE)) { console.error('Fant ikke ' + KILDE); process.exit(1); }

rmSync(UT, { recursive: true, force: true });
cpSync(KILDE, UT, { recursive: true });
for (const u of UTELAT) rmSync(join(UT, u), { recursive: true, force: true });

function storrelse(d) { let s = 0; for (const f of readdirSync(d)) { const p = join(d, f); const st = statSync(p); s += st.isDirectory() ? storrelse(p) : st.size; } return s; }
console.log(`\nAppen: ${UT}/ er klar (${(storrelse(UT) / 1e6).toFixed(1)} MB).`);
