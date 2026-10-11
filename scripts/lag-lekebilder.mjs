// Lager bildene til drikkelekene (240x126 SVG) i stua-stilen (se DESIGN.md):
// klistremerker med tykk svart strek, flate farger og hard skygge, satt sammen til en liten scene per lek
// på et fargefelt. Bygger på de samme klistremerkene som rommet bruker (src/lib/klistremerker.js),
// pluss noen ekstra former som bare scenene trenger. Ingen tekst: bildene vises som <img>.
//
// Kjør fra prosjektmappa:  node scripts/lag-lekebilder.mjs
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MERKER } from '../src/lib/klistremerker.js';

const ROT = join(dirname(fileURLToPath(import.meta.url)), '..');
const UT_LEK = join(ROT, 'public', 'illustrasjoner', 'lek');
const UT_MOTIV = join(ROT, 'public', 'illustrasjoner');
mkdirSync(UT_LEK, { recursive: true });

const B = '#16120F', S = `stroke="${B}" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"`;
const O = '#FF5B1F', G = '#FFD23F', M = '#63E2A8', R = '#FF9CC2', P = '#FFF8EE', H = '#F2B98B', BL = '#7CC6FE', RD = '#E2363B';
const FELT = ['#63E2A8', '#FF9CC2', '#7CC6FE', '#FFF8EE', '#FFB98A', '#C7B8FF'];

/* ---------- ekstra klistremerker til scenene (64 x 64) ---------- */
const kort = (pip, flate = P) => `<rect x="14" y="5" width="36" height="54" rx="5" fill="${flate}" ${S}/>${pip}`;
const hjertePip = (c = O) => `<path d="M32 46c-10-6-14-11-14-16a7 7 0 0 1 14-3 7 7 0 0 1 14 3c0 5-4 10-14 16z" fill="${c}" ${S}/><path d="M20 14c-2-1-3-2-3-3a1.8 1.8 0 0 1 3-1 1.8 1.8 0 0 1 3 1c0 1-1 2-3 3z" fill="${c}"/>`;
const sparPip = `<path d="M32 17c-10 8-15 13-15 19a7 7 0 0 0 12 5l-3 8h12l-3-8a7 7 0 0 0 12-5c0-6-5-11-15-19z" fill="${B}"/><path d="M20 10l3 4h-6z" fill="${B}"/>`;
const ruterPip = `<path d="M32 16l12 16-12 16-12-16z" fill="${O}" ${S}/><path d="M20 9l3 4-3 4-3-4z" fill="${O}"/>`;
const kloverPip = `<g fill="${B}"><circle cx="32" cy="23" r="7"/><circle cx="24" cy="34" r="7"/><circle cx="40" cy="34" r="7"/><path d="M29 34h6l2 14H27z"/><circle cx="20" cy="12" r="2.6"/></g>`;
const kronePip = `<path d="M20 40l-2-18 8 7 6-10 6 10 8-7-2 18z" fill="${O}" ${S}/>`;
const terningSvg = (n, flate = P, prikk = B) => {
  const p = { 1: [[32, 32]], 2: [[21, 21], [43, 43]], 3: [[21, 21], [32, 32], [43, 43]], 4: [[21, 21], [43, 21], [21, 43], [43, 43]],
    5: [[21, 21], [43, 21], [32, 32], [21, 43], [43, 43]], 6: [[21, 19], [43, 19], [21, 32], [43, 32], [21, 45], [43, 45]] }[n];
  return `<rect x="8" y="8" width="48" height="48" rx="9" fill="${flate}" ${S}/>` + p.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4.4" fill="${prikk}"/>`).join('');
};
const person = (skjorte, har, hud = H) => `<path d="M8 62c0-15 11-24 24-24s24 9 24 24z" fill="${skjorte}" ${S}/><circle cx="32" cy="23" r="14" fill="${hud}" ${S}/>` +
  `<path d="M18 21a14 14 0 0 1 28 0q-7-5-14-3t-14 3z" fill="${har}" ${S}/><circle cx="27" cy="25" r="2.2" fill="${B}"/><circle cx="37" cy="25" r="2.2" fill="${B}"/><path d="M27 31q5 4 10 0" fill="none" ${S}/>`;
const ansikt = (flate, munn, oyne) => `<circle cx="32" cy="32" r="25" fill="${flate}" ${S}/>` + (oyne || `<circle cx="24" cy="27" r="3.2" fill="${B}"/><circle cx="40" cy="27" r="3.2" fill="${B}"/>`) + munn;
const E = {
  kortH: kort(hjertePip()), kortS: kort(sparPip), kortR: kort(ruterPip), kortK: kort(kloverPip), kortKrone: kort(kronePip, G),
  kortBak: `<rect x="14" y="5" width="36" height="54" rx="5" fill="${O}" ${S}/><rect x="20" y="11" width="24" height="42" rx="2" fill="none" stroke="${P}" stroke-width="3"/><path d="M32 20l7 12-7 12-7-12z" fill="${G}" ${S}/>`,
  kortGronn: kort('', M), kortGul: kort('', G), kortBla: kort('', BL), kortOransje: kort('', O),
  terning1: terningSvg(1, O, P), terning2: terningSvg(2), terning4: terningSvg(4), terning5: terningSvg(5), terning6: terningSvg(6), terning6O: terningSvg(6, O, P),
  kopp: `<rect x="9" y="8" width="46" height="8" rx="2" fill="${P}" ${S}/><path d="M12 16h40l-6 42H18z" fill="${O}" ${S}/><path d="M14 34h36" ${S}/><path d="M20 22l2 26" stroke="${P}" stroke-width="3" stroke-linecap="round" opacity=".7"/>`,
  koppMint: `<rect x="9" y="8" width="46" height="8" rx="2" fill="${P}" ${S}/><path d="M12 16h40l-6 42H18z" fill="${M}" ${S}/><path d="M14 34h36" ${S}/>`,
  koppSnudd: `<path d="M18 6h28l6 42H12z" fill="${O}" ${S}/><rect x="9" y="48" width="46" height="8" rx="2" fill="${P}" ${S}/><path d="M14 28h36" ${S}/>`,
  ol: `<path d="M44 26h5a7 7 0 0 1 7 7v8a7 7 0 0 1-7 7h-5" fill="none" stroke="${B}" stroke-width="5"/><path d="M12 20h32v34a5 5 0 0 1-5 5H17a5 5 0 0 1-5-5z" fill="${G}" ${S}/>` +
    `<path class="a-skum" d="M9 22c-2-8 5-13 11-11 2-5 12-6 15-1 6-3 13 1 11 10z" fill="${P}" ${S}/><circle class="a-b a-b1" cx="21" cy="38" r="2" fill="${P}"/><circle class="a-b a-b2" cx="31" cy="46" r="2" fill="${P}"/><circle class="a-b a-b3" cx="26" cy="30" r="1.6" fill="${P}"/>`,
  shot: `<path d="M18 18h28l-4 36H22z" fill="${P}" ${S}/><path d="M20 32h24l-2.5 20h-19z" fill="${G}"/><path d="M18 18h28l-4 36H22z" fill="none" ${S}/>`,
  flaske: `<rect x="26" y="2" width="12" height="7" rx="1.5" fill="${O}" ${S}/><path d="M27 9h10v9c7 4 10 9 10 16v22a4 4 0 0 1-4 4H21a4 4 0 0 1-4-4V34c0-7 3-12 10-16z" fill="${M}" ${S}/><rect x="17" y="34" width="30" height="14" fill="${P}" ${S}/><path d="M24 41h16" stroke="${O}" stroke-width="3.5" stroke-linecap="round"/>`,
  flaskeLigg: `<g transform="rotate(-90 32 32)"><rect x="26" y="2" width="12" height="7" rx="1.5" fill="${O}" ${S}/><path d="M27 9h10v9c7 4 10 9 10 16v22a4 4 0 0 1-4 4H21a4 4 0 0 1-4-4V34c0-7 3-12 10-16z" fill="${M}" ${S}/><rect x="17" y="34" width="30" height="14" fill="${P}" ${S}/></g>`,
  telefon: `<rect x="15" y="3" width="34" height="58" rx="7" fill="${B}" ${S}/><rect x="19" y="11" width="26" height="40" rx="2" fill="${BL}"/><path d="M23 18h14M23 25h18M23 32h10" stroke="${P}" stroke-width="3.5" stroke-linecap="round"/><rect x="28" y="54" width="8" height="2.5" rx="1" fill="${P}"/>`,
  telefonO: `<rect x="15" y="3" width="34" height="58" rx="7" fill="${B}" ${S}/><rect x="19" y="11" width="26" height="40" rx="2" fill="${O}"/><path d="M27 24q0-6 5-6t5 5q0 4-5 5v3" fill="none" stroke="${P}" stroke-width="3.5" stroke-linecap="round"/><circle cx="32" cy="40" r="2.2" fill="${P}"/>`,
  boble: `<path d="M6 8h52v34H28l-14 14V42H6z" fill="${P}" ${S}/>`,
  bobleG: `<path d="M6 8h52v34H28l-14 14V42H6z" fill="${G}" ${S}/>`,
  bobleO: `<path d="M58 8H6v34h30l14 14V42h8z" fill="${O}" ${S}/>`,
  bobleM: `<path d="M58 8H6v34h30l14 14V42h8z" fill="${M}" ${S}/>`,
  spm: `<path d="M21 24q0-13 11-13t11 11q0 8-11 11v5" fill="none" stroke="${B}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/><path d="M21 24q0-13 11-13t11 11q0 8-11 11v5" fill="none" stroke="${O}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="32" cy="51" r="5.5" fill="${O}" ${S}/>`,
  utrop: `<path d="M32 12v24" stroke="${B}" stroke-width="13" stroke-linecap="round"/><path d="M32 12v24" stroke="${O}" stroke-width="6.5" stroke-linecap="round"/><circle cx="32" cy="51" r="5.5" fill="${O}" ${S}/>`,
  hake: `<rect x="6" y="10" width="52" height="44" rx="5" fill="${M}" ${S}/><path d="M19 32l9 9 18-18" fill="none" stroke="${B}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`,
  kryss: `<rect x="6" y="10" width="52" height="44" rx="5" fill="${RD}" ${S}/><path d="M22 22l20 20M42 22L22 42" stroke="${P}" stroke-width="6" stroke-linecap="round"/>`,
  stjerne: `<path d="M32 5l8 17 18 2-13 12 4 18-17-9-17 9 4-18L6 24l18-2z" fill="${G}" ${S}/>`,
  stjerneO: `<path d="M32 5l8 17 18 2-13 12 4 18-17-9-17 9 4-18L6 24l18-2z" fill="${O}" ${S}/>`,
  personO: person(O, '#7A4A2A'), personM: person(M, G), personR: person(R, B), personB: person(BL, O, '#C98D63'),
  smil: ansikt(G, `<path d="M21 38q11 10 22 0" fill="none" ${S}/>`),
  glis: ansikt(G, `<path d="M19 36h26q-2 13-13 13t-13-13z" fill="${B}"/><path d="M22 36h20v4H22z" fill="${P}"/>`),
  overrasket: ansikt(R, `<ellipse cx="32" cy="42" rx="5" ry="6" fill="${B}"/>`),
  glidelas: ansikt(G, `<path d="M17 40h30" ${S}/><path d="M21 36v8M27 36v8M33 36v8M39 36v8M45 36v8" stroke="${B}" stroke-width="2.5"/>`, `<path d="M19 27h9M36 27h9" ${S}/>`),
  ball: `<circle cx="32" cy="32" r="26" fill="${P}" ${S}/><path d="M32 22l9 7-3 11h-12l-3-11z" fill="${B}"/><path d="M32 22V8M41 29l13-4M38 40l8 12M26 40l-8 12M23 29l-13-4" ${S}/>`,
  pingpong: `<circle cx="38" cy="30" r="13" fill="${P}" ${S}/><path d="M8 20h12M6 30h14M8 40h12" ${S}/>`,
  mikrofon: `<circle cx="32" cy="18" r="14" fill="#8A8580" ${S}/><path d="M22 12h20M20 19h24M22 26h20" stroke="${B}" stroke-width="2"/><path d="M27 31h10l-2 16h-6z" fill="${G}" ${S}/><path d="M32 47v8M22 58h20" ${S}/>`,
  kontroller: `<path d="M14 18h36c8 0 12 8 12 18 0 14-6 20-12 14l-6-6H20l-6 6C8 56 2 50 2 36c0-10 4-18 12-18z" fill="${G}" ${S}/><path d="M16 29v14M9 36h14" stroke="${B}" stroke-width="5" stroke-linecap="round"/><circle cx="46" cy="30" r="3.6" fill="${O}" ${S}/><circle cx="52" cy="38" r="3.6" fill="${M}" ${S}/>`,
  flagg: `<path d="M16 6v54" stroke="${B}" stroke-width="5" stroke-linecap="round"/><path d="M18 8h34l-8 11 8 11H18z" fill="${O}" ${S}/>`,
  maalflagg: `<path d="M14 6v54" stroke="${B}" stroke-width="5" stroke-linecap="round"/><rect x="16" y="8" width="36" height="24" fill="${P}" ${S}/><path d="M16 8h9v8h-9zM34 8h9v8h-9zM25 16h9v8h-9zM43 16h9v8h-9zM16 24h9v8h-9zM34 24h9v8h-9z" fill="${B}"/>`,
  sjakk: `<rect x="4" y="22" width="56" height="36" fill="${G}" ${S}/>` + [0, 1, 2, 3, 4, 5, 6].map((c) => [0, 1, 2, 3].map((r) => ((c + r) % 2 ? `<rect x="${4 + c * 8}" y="${22 + r * 9}" width="8" height="9" fill="${M}"/>` : '')).join('')).join('') +
    `<rect x="4" y="22" width="56" height="36" fill="none" ${S}/><path d="M24 22V8l4 3 4-4 4 4 4-3v14z" fill="${B}"/>`,
  tv: `<rect x="4" y="8" width="56" height="40" rx="5" fill="${B}" ${S}/><rect x="9" y="13" width="46" height="30" rx="2" fill="${BL}"/><path class="a-play" d="M28 21l12 7-12 7z" fill="${O}" ${S}/><path d="M24 48l-6 10M40 48l6 10" ${S}/>`,
  pilOpp: `<path d="M32 4l24 26H42v28H22V30H8z" fill="${G}" ${S}/>`,
  pilNed: `<path d="M32 60L8 34h14V6h20v28h14z" fill="${O}" ${S}/>`,
  haand: `<path d="M14 24h6c-1-8 6-15 12-12 4 2 4 8 0 12h22a5 5 0 0 1 0 10H44c3 1 3 8 0 9 3 1 3 8 0 9 1 3-2 6-5 6H22c-4 0-8-3-8-8z" fill="${H}" ${S}/>` +
    `<path d="M30 34h14M30 43h14M31 52h12M22 24c2-2 4-2 6 0" fill="none" ${S}/><rect x="2" y="23" width="13" height="30" rx="3" fill="${O}" ${S}/>`,
  maske: `<path d="M4 22q14-12 28 0 14-12 28 0-2 20-16 20-8 0-12-8-4 8-12 8-14 0-16-20z" fill="${M}" ${S}/><ellipse cx="19" cy="28" rx="7" ry="4.5" fill="${B}"/><ellipse cx="45" cy="28" rx="7" ry="4.5" fill="${B}"/>`,
  fabrikk: `<path d="M4 58V30l14-9v9l14-9v9l14-9v37z" fill="${G}" ${S}/><rect x="46" y="10" width="10" height="48" fill="#8A8580" ${S}/><circle class="a-royk" cx="52" cy="5" r="4" fill="${P}" ${S}/><path d="M10 38h8v8h-8zM24 38h8v8h-8z" fill="${O}" ${S}/>`,
  fingre: `<path d="M18 62V40c0-4-6-10-6-14a3 3 0 0 1 6-1l4 6V9a3.5 3.5 0 0 1 7 0v17V5a3.5 3.5 0 0 1 7 0v21V8a3.5 3.5 0 0 1 7 0v20V15a3.5 3.5 0 0 1 7 0v27c0 8-4 12-8 14v6z" fill="${H}" ${S}/><rect x="16" y="56" width="30" height="8" fill="${O}" ${S}/>`,
  medalje: `<path d="M18 2l10 22M46 2L36 24" stroke="${O}" stroke-width="8"/><path d="M18 2l10 22M46 2L36 24" fill="none" stroke="${B}" stroke-width="2"/><circle cx="32" cy="42" r="18" fill="${G}" ${S}/><path d="M32 31l3.5 7 7.5 1-5.5 5 1.5 7.5-7-4-7 4 1.5-7.5-5.5-5 7.5-1z" fill="${P}" ${S}/>`,
  klokke: `<rect x="27" y="2" width="10" height="7" rx="2" fill="${O}" ${S}/><circle cx="32" cy="36" r="24" fill="${P}" ${S}/><path d="M32 36V18A18 18 0 0 1 49 30z" fill="${O}" ${S}/><path class="a-viser" d="M32 36l-10 6" ${S}/><circle cx="32" cy="36" r="3" fill="${B}"/>`,
  mynt: `<circle cx="32" cy="32" r="24" fill="${G}" ${S}/><circle cx="32" cy="32" r="16" fill="none" ${S}/><path d="M32 22l3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" fill="${O}" ${S}/>`,
  tommel: `<path d="M8 30h12v28H8z" fill="${O}" ${S}/><path d="M20 30l10-14c2-4 0-10 4-12 5 0 6 6 5 12l-2 8h17a5 5 0 0 1 5 6l-5 22a6 6 0 0 1-6 4H20z" fill="${H}" ${S}/>`,
  kork: `<path d="M18 22h28l-3 30H21z" fill="#B9773F" ${S}/><ellipse cx="32" cy="22" rx="14" ry="5" fill="#D9A26A" ${S}/><circle cx="27" cy="36" r="1.6" fill="#7A4A2A"/><circle cx="36" cy="44" r="1.6" fill="#7A4A2A"/>`,
  trapp: `<path d="M4 58V46h12V34h12V22h12V10h20v48z" fill="${G}" ${S}/>`,
  mugge: `<path d="M46 20h6a6 6 0 0 1 6 6v14a6 6 0 0 1-6 6h-6" fill="none" stroke="${B}" stroke-width="5"/><path d="M10 12h36l-2 46H14z" fill="${G}" ${S}/><path class="a-skum" d="M6 14c0-7 7-10 12-7 3-5 13-5 16 0 5-3 13 0 12 7z" fill="${P}" ${S}/>`,
  tanke: `<path d="M16 34c-10 0-12-14-2-16 0-12 16-14 20-6 8-6 22 0 18 10 10 2 8 16-2 16z" fill="${P}" ${S}/><circle cx="12" cy="48" r="4" fill="${P}" ${S}/><circle cx="6" cy="58" r="2.5" fill="${P}" ${S}/><path d="M28 34V18l12-3v15" fill="none" ${S}/><circle cx="25" cy="34" r="4" fill="${O}" ${S}/><circle cx="37" cy="31" r="4" fill="${O}" ${S}/>`,
  hjerteStor: `<path d="M32 58C8 42 4 30 4 21a14 14 0 0 1 28-5 14 14 0 0 1 28 5c0 9-4 21-28 37z" fill="${O}" ${S}/><path d="M14 18q2-6 8-6" fill="none" stroke="${P}" stroke-width="3.5" stroke-linecap="round"/>`,
  bingobrett: `<rect x="6" y="6" width="52" height="52" rx="4" fill="${G}" ${S}/><path d="M23 6v52M41 6v52M6 23h52M6 41h52" stroke="${B}" stroke-width="2.5"/><circle class="a-brikke" cx="14.5" cy="14.5" r="5" fill="${O}" ${S}/><circle class="a-brikke" cx="32" cy="32" r="5" fill="${O}" ${S}/><circle class="a-brikke" cx="49.5" cy="49.5" r="5" fill="${O}" ${S}/>`,
  sverd: `<path d="M10 54L50 10M54 54L14 10" stroke="${B}" stroke-width="9" stroke-linecap="round"/><path d="M10 54L50 10M54 54L14 10" stroke="${P}" stroke-width="4" stroke-linecap="round"/><path d="M16 40l8 8M48 40l-8 8" stroke="${G}" stroke-width="7" stroke-linecap="round"/>`,
  halvt: `<circle cx="32" cy="32" r="26" fill="${G}" ${S}/><path d="M32 6a26 26 0 0 1 0 52z" fill="${O}" ${S}/><path d="M16 32l5 5 7-9" fill="none" ${S}/><path d="M40 27l9 10M49 27l-9 10" ${S}/>`,
  gaffel: `<path d="M32 60V36M32 36L14 14M32 36l18-22" fill="none" stroke="${B}" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/><path d="M32 60V36M32 36L14 14M32 36l18-22" fill="none" stroke="${G}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`,
};
const ALLE = Object.assign({}, MERKER, E);

/* ---------- scener ---------- */
function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function rng(seed) { let x = seed || 1; return () => { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; return ((x >>> 0) % 10000) / 10000; }; }
/**
 * deler: navn eller { m: navn, s: størrelse (1 = 78 px), l: løft (px), r: grader, x/y: fast plass }
 * Delene står på rad, midtstilt, med bunnen på samme linje. Litt tilfeldig skrått, som klistremerker.
 */
function scene(slug, deler, opt = {}) {
  const r = rng(hash(slug));
  const felt = FELT[hash(slug + 'felt') % FELT.length];
  const liste = deler.map((d) => (typeof d === 'string' ? { m: d } : d));
  const STR = 78, GAP = opt.gap ?? 4;
  let total = liste.reduce((a, d) => a + STR * (d.s || 1), 0) + GAP * (liste.length - 1);
  const skala = Math.min(1, 220 / total);
  total *= skala;
  let x = (240 - total) / 2;
  const bunn = opt.bunn ?? 112;
  let ut = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 126" width="240" height="126"><defs><filter id="h-${slug}" x="-30%" y="-30%" width="170%" height="170%">` +
    `<feOffset in="SourceAlpha" dx="3" dy="3" result="s"/><feMerge><feMergeNode in="s"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>` +
    `<rect width="240" height="126" fill="${felt}"/>`;
  // Pynt: noen små gnister og prikker i bakgrunnen
  for (let i = 0; i < 4; i++) {
    const gx = 12 + r() * 216, gy = 10 + r() * 100, st = 5 + r() * 4, f = r() < 0.5 ? P : B;
    ut += r() < 0.6
      ? `<path class="a-gnist" d="M${(gx).toFixed(1)} ${(gy - st).toFixed(1)}l${(st * .3).toFixed(1)} ${(st * .7).toFixed(1)} ${(st * .7).toFixed(1)} ${(st * .3).toFixed(1)}-${(st * .7).toFixed(1)} ${(st * .3).toFixed(1)}-${(st * .3).toFixed(1)} ${(st * .7).toFixed(1)}-${(st * .3).toFixed(1)}-${(st * .7).toFixed(1)}-${(st * .7).toFixed(1)}-${(st * .3).toFixed(1)} ${(st * .7).toFixed(1)}-${(st * .3).toFixed(1)}z" fill="${f}" stroke="${B}" stroke-width="1.5" stroke-linejoin="round" opacity=".9"/>`
      : `<circle class="a-gnist" cx="${gx.toFixed(1)}" cy="${gy.toFixed(1)}" r="${(st * .35).toFixed(1)}" fill="${f}" stroke="${B}" stroke-width="1.5"/>`;
  }
  liste.forEach((d, i) => {
    const str = STR * (d.s || 1) * skala;
    const px = d.x != null ? d.x : x, py = d.y != null ? d.y : bunn - str - (d.l || 0) * skala;
    const rot = d.r != null ? d.r : (r() - 0.5) * 12;
    let inn = ALLE[d.m]; if (!inn) throw new Error('Ukjent merke: ' + d.m + ' (' + slug + ')');
    inn = inn.replace(/stroke-width="3\.5"/g, 'stroke-width="2.4"');
    ut += `<g transform="translate(${px.toFixed(1)} ${py.toFixed(1)}) rotate(${rot.toFixed(1)} ${(str / 2).toFixed(1)} ${(str / 2).toFixed(1)}) scale(${(str / 64).toFixed(3)})" filter="url(#h-${slug})"><g class="a" data-a="${d.m}">${inn}</g></g>`;
    if (d.x == null) x += str + GAP * skala;
  });
  return ut + '</svg>';
}

const L = {
  '100-sporsmal': ['spm', { m: 'boble', s: 1.2, l: 10 }, 'spm'],
  '14-sporsmal': [{ m: 'bobleG', l: 18 }, { m: 'bobleO', s: 0.9 }],
  '21-med-terninger': ['terning5', 'terning6O', 'ol'],
  '50-50': [{ m: 'hake', s: 0.7, l: 14 }, { m: 'halvt', s: 1.2 }, { m: 'kryss', s: 0.7, l: 14 }],
  'beer-pong': [{ m: 'pingpong', s: 0.7, l: 46 }, 'kopp', 'kopp', 'kopp'],
  'beerio-kart': [{ m: 'kontroller', s: 1.3 }, 'maalflagg'],
  'bloffquizen': [{ m: 'fisk', s: 1.3 }, { m: 'spm', s: 0.8, l: 20 }],
  'bossen-sier': [{ m: 'krone', s: 0.75, l: 40 }, 'personM', { m: 'boble', l: 26, s: 0.9 }],
  'buffalo': [{ m: 'haand', s: 1.05, l: 12 }, 'ol'],
  'bussruta': [{ m: 'kortH', s: 0.7, l: 26 }, { m: 'buss', s: 1.35 }, { m: 'kortS', s: 0.7, l: 26 }],
  'chandelier': [{ m: 'kopp', s: 0.7 }, { m: 'kopp', s: 0.7 }, { m: 'koppMint', s: 0.8 }, { m: 'kopp', s: 0.7 }, { m: 'kopp', s: 0.7 }, { m: 'pingpong', s: 0.6, x: 108, y: 2, r: 0 }],
  'drikke-bingo': [{ m: 'bingobrett', s: 1.2 }, { m: 'note', l: 18 }],
  'drikke-uno': [{ m: 'kortOransje', r: -14 }, { m: 'kortGul', r: -5 }, { m: 'kortGronn', r: 5 }, { m: 'kortBla', r: 14 }],
  'drikke-yatzy': ['terning6', { m: 'terning6', l: 16 }, 'terning6O'],
  'drikkehjulet': [{ m: 'hjul', s: 1.35 }],
  'duoleken': ['personO', { m: 'hjerteStor', s: 0.7, l: 30 }, 'personM'],
  'enten-eller': [{ m: 'bobleO', s: 0.9, l: 26 }, { m: 'gaffel' }, { m: 'bobleM', s: 0.9, l: 26 }],
  'eurovision': [{ m: 'stjerne', s: 0.7, l: 36 }, { m: 'mikrofon', s: 1.25 }, { m: 'stjerneO', s: 0.7, l: 14 }],
  'flip-cup': ['kopp', { m: 'koppSnudd', l: 28, r: 35 }, 'kopp'],
  'flunkyball': ['flaske', 'ball', 'flaske'],
  'forraeder': [{ m: 'nese', s: 1.3 }, { m: 'spm', s: 0.8, l: 22 }],
  'fotballkamp': [{ m: 'ball', s: 1.2 }, 'flagg'],
  'fuck-the-dealer': ['kortH', { m: 'kortKrone', l: 10 }, 'kortS', { m: 'spm', s: 0.7, l: 26 }],
  'gjett-aret': [{ m: 'kalender', s: 1.2 }, { m: 'spm', s: 0.8, l: 20 }],
  'gris': [{ m: 'kortK', s: 0.8 }, { m: 'gris', s: 1.25 }, { m: 'kortH', s: 0.8 }],
  'hemmelig-oppdrag': [{ m: 'agent', s: 1.2 }, 'brev'],
  'hvem-er-jeg': [{ m: 'lapp', s: 1.25 }, { m: 'spm', s: 0.8, l: 22 }],
  'hvem-skrev-det': [{ m: 'brev', s: 1.15 }, { m: 'blyant', s: 1.05 }],
  'ja-eller-nei': ['hake', 'kryss'],
  'jeg-har-aldri': [{ m: 'fingre', s: 1.2 }, 'ol'],
  'jug': [{ m: 'mugge', s: 1.2 }, { m: 'spm', s: 0.8, l: 22 }],
  'kategorier': [{ m: 'liste', s: 1.2 }, { m: 'hake', s: 0.75, l: 20 }],
  'korken': ['flaske', { m: 'kork', s: 0.7, l: 30 }, 'ol'],
  'krig': ['kortH', { m: 'sverd', s: 0.9, l: 8 }, 'kortS'],
  'mynt-i-glasset': [{ m: 'mynt', s: 0.9, l: 26 }, 'ol'],
  'nasjonal-vorsprove': [{ m: 'liste', s: 1.15 }, { m: 'medalje', s: 1.05 }],
  'nodt-eller-sannhet': [{ m: 'flamme', s: 1.15 }, { m: 'hjerteStor', s: 0.95, l: 8 }],
  'nyhetsrunden': [{ m: 'avis', s: 1.2 }, { m: 'spm', s: 0.8, l: 22 }],
  'opus': [{ m: 'kortR', s: 0.85 }, { m: 'klokke', s: 1.15 }, { m: 'kortK', s: 0.85 }],
  'over-eller-under': [{ m: 'pilOpp', s: 0.8, l: 20 }, 'kortR', { m: 'pilNed', s: 0.8 }],
  'pekeleken': [{ m: 'haand', s: 1.15, l: 14 }, 'personM'],
  'power-hour': [{ m: 'klokke', s: 1.1 }, { m: 'lyn', s: 0.8, l: 18 }, 'ol'],
  'president': [{ m: 'kortK', r: -10 }, { m: 'kortH', l: 6, r: 0 }, { m: 'kortR', r: 10 }, { m: 'krone', s: 0.85, x: 82, y: 2, r: -4 }],
  'pyramiden': [{ m: 'pyramide', s: 1.4 }],
  'rage-cage': ['kopp', 'kopp', { m: 'koppMint', l: 6 }, 'kopp', { m: 'pingpong', s: 0.6, x: 96, y: 4, r: 0 }],
  'rask-fakta': ['glis', { m: 'lyn', s: 0.8, l: 16 }, 'overrasket'],
  'regelfabrikken': [{ m: 'fabrikk', s: 1.3 }, { m: 'kortH', s: 0.85 }],
  'ring-of-fire': [{ m: 'ring', s: 1.35 }],
  'rygg-mot-rygg': [{ m: 'rygg', s: 1.35 }],
  'samme-svar': [{ m: 'sau', s: 1.15 }, { m: 'sau', s: 1.15 }],
  'sannhet-eller-drikk': [{ m: 'boble', l: 24 }, 'ol'],
  'sjakkdrikk': [{ m: 'sjakk', s: 1.35 }, { m: 'shot', s: 0.8 }],
  'skal-refleksen': [{ m: 'ol', r: 14 }, { m: 'lyn', s: 0.8, l: 22 }, { m: 'ol', r: -14 }],
  'snurr-flasken': [{ m: 'flaskeLigg', s: 1.4, r: 24 }],
  'spionen': [{ m: 'muldvarp', s: 1.4 }],
  'stilleleken': [{ m: 'glidelas', s: 1.25 }, { m: 'stille', s: 0.85, l: 12 }],
  'tanken-bak-sangen': ['personR', { m: 'tanke', s: 1.05, l: 22 }],
  'terningen-bestemmer': ['terning4', { m: 'terning1', l: 8 }, { m: 'krone', s: 0.8, l: 40 }],
  'thunderstruck': [{ m: 'note', l: 16 }, { m: 'lyn', l: 6 }, 'ol'],
  'tilbake-til-5-trinn': [{ m: 'trapp', s: 1.3 }, { m: 'ol', s: 0.8, l: 40 }],
  'to-sannheter-og-en-logn': [{ m: 'hake', s: 0.85 }, { m: 'hake', s: 0.85 }, { m: 'kryss', s: 0.85 }],
  'tommelen': [{ m: 'tommel', s: 1.25 }, { m: 'utrop', s: 0.8, l: 16 }],
  'veddelopet': [{ m: 'kortH', s: 0.8, l: 16 }, { m: 'kortS', s: 0.8, l: 4 }, { m: 'kortR', s: 0.8, l: 24 }, { m: 'kortK', s: 0.8, l: 10 }, 'maalflagg'],
};
const MOTIV = {
  kort: ['kortH', { m: 'kortS', l: 10 }, 'kortR'],
  bobler: [{ m: 'bobleG', s: 1.1, l: 18 }, 'bobleO'],
  telefoner: ['telefon', { m: 'telefonO', l: 10 }, 'telefon'],
  musikk: [{ m: 'note', s: 1.2, l: 10 }, { m: 'note', s: 0.8 }],
  terning: [{ m: 'terning4', l: 14 }, 'terning1'],
  kopper: ['kopp', 'koppMint', 'kopp'],
  quiz: [{ m: 'liste', s: 1.2 }, { m: 'spm', s: 0.8, l: 22 }],
  klokke: [{ m: 'klokke', s: 1.35 }],
  hjul: [{ m: 'hjul', s: 1.35 }],
  skjerm: [{ m: 'tv', s: 1.4 }],
};

for (const [slug, d] of Object.entries(L)) writeFileSync(join(UT_LEK, slug + '.svg'), scene(slug, d));
for (const [navn, d] of Object.entries(MOTIV)) writeFileSync(join(UT_MOTIV, navn + '.svg'), scene(navn, d));
writeFileSync(join(ROT, 'src', 'data', 'bannere.json'), JSON.stringify(Object.keys(L).sort()));
console.log(Object.keys(L).length, 'bilder og', Object.keys(MOTIV).length, 'motiver');
