// Fargelegger illustrasjonene (public/illustrasjoner/**/*.svg) fra Nattlilla til Champagnenatt.
// Hver gammel farge har én ny – motivene er de samme, bare paletten er byttet.
// Trygt å kjøre flere ganger: nye farger står ikke i lista over gamle.
//
// Kjør fra prosjektmappa:  node scripts/fargelegg-illustrasjoner.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MAPPE = path.join(ROT, 'public/illustrasjoner');

const FARGER = {
  '#2B1A44': '#2A1A22', // bakgrunn: lilla natt → vinrød natt
  '#3A2560': '#3A2230', '#43285F': '#432634', '#5A3A7A': '#5A2E3E', '#5E3D86': '#5E3446', '#7E5BA8': '#8A5566',
  '#120A1D': '#1A1012', // mørk
  '#F5F0FF': '#F7EFE3', // lys → elfenben
  '#DCD2EE': '#E9DCC6', '#8F81AD': '#9C8B8E', '#9B79C6': '#B98A92',
  '#FF5B1F': '#D9503C', '#B33A0B': '#8A2A1D', // oransje → campari
  '#C8FF2E': '#E4C47F', '#7DA80F': '#8C6A2C', // lime → champagne
  '#9B7BFF': '#C98B8F', '#8B7CF6': '#C98B8F', // lilla → støvet rosé
  '#FF8FB1': '#EFA0A6', '#FF6A8F': '#E07A86', // rosa (grisen) beholdes, bare dempet
};
const re = new RegExp(Object.keys(FARGER).join('|'), 'gi');

function filer(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) =>
    d.isDirectory() ? filer(path.join(dir, d.name)) : d.name.endsWith('.svg') ? [path.join(dir, d.name)] : []);
}

let endret = 0;
for (const f of filer(MAPPE)) {
  const før = fs.readFileSync(f, 'utf8');
  const etter = før.replace(re, (m) => FARGER[m.toUpperCase()]);
  if (etter !== før) { fs.writeFileSync(f, etter); endret++; }
}
console.log('Fargela', endret, 'illustrasjoner');
