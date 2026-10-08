// Lager delingsbildene (og:image, 1200×630) i Champagnenatt-stil: public/og/*.jpg og public/og/lek/<slug>.jpg.
// Dette er bildet folk ser når en romlenke eller en lek deles på Snap, Messenger eller iMessage.
//
// Kjør fra prosjektmappa:  node scripts/lag-delingsbilder.mjs
// Trenger Playwright (npm i -D playwright && npx playwright install chromium).
// Finnes Chromium et annet sted, sett PW_CHROMIUM=/sti/til/chromium.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

let chromium;
try { ({ chromium } = await import('playwright')); }
catch { ({ chromium } = await import(process.env.PW_MODUL || 'playwright')); }

const ROT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const les = (f) => JSON.parse(fs.readFileSync(path.join(ROT, f), 'utf8'));
const content = les('src/data/content.json');
const decks = les('src/data/decks.json');
// Skriften bakes inn som data-URL (en side fra setContent får ikke lese lokale filer)
const fontData = (f) => 'data:font/woff2;base64,' + fs.readFileSync(path.join(ROT, 'node_modules/@fontsource-variable/archivo/files', f)).toString('base64');
const font = fontData('archivo-latin-wdth-normal.woff2');
const fontExt = fontData('archivo-latin-ext-wdth-normal.woff2');
const serifData = (f) => 'data:font/woff2;base64,' + fs.readFileSync(path.join(ROT, 'node_modules/@fontsource-variable/fraunces/files', f)).toString('base64');
const serif = serifData('fraunces-latin-wght-normal.woff2');
const serifExt = serifData('fraunces-latin-ext-wght-normal.woff2');
const serifKursiv = serifData('fraunces-latin-wght-italic.woff2');
const logo = fs.readFileSync(path.join(ROT, 'public/favicon.svg'), 'utf8').replace(/width="64" height="64"/, 'width="56" height="56"');

const t = (x) => (x && typeof x === 'object' ? x.no || x.en || '' : x || '');
const slugify = (s) => s.toLowerCase().replace(/æ/g, 'ae').replace(/ø/g, 'o').replace(/å/g, 'a').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// Én-linjere for lekene som har dem (src/lib/niva.ts)
const HOOK = {};
for (const m of fs.readFileSync(path.join(ROT, 'src/lib/niva.ts'), 'utf8').matchAll(/'([a-z0-9-]+)':\s*\['([^']+)'/g)) HOOK[m[1]] = m[2];

function side({ kicker, tittel, under, kortEtikett, kortTekst, merke }) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:A;font-weight:100 900;font-stretch:62% 125%;src:url(${font}) format('woff2-variations')}
@font-face{font-family:A;font-weight:100 900;font-stretch:62% 125%;src:url(${fontExt}) format('woff2-variations');unicode-range:U+0100-02BA,U+1E00-1EFF}
@font-face{font-family:S;font-weight:100 900;src:url(${serif}) format('woff2-variations')}
@font-face{font-family:S;font-weight:100 900;src:url(${serifExt}) format('woff2-variations');unicode-range:U+0100-02BA,U+1E00-1EFF}
@font-face{font-family:S;font-style:italic;font-weight:100 900;src:url(${serifKursiv}) format('woff2-variations')}
*{box-sizing:border-box;margin:0}
body{width:1200px;height:630px;overflow:hidden;font-family:A,sans-serif;color:#F7EFE3;
  background:radial-gradient(640px 440px at 100% 0%,rgba(228,196,127,.22),transparent 70%),radial-gradient(620px 420px at -4% 104%,rgba(122,36,72,.42),transparent 70%),#0F0A10}
body::after{content:"";position:fixed;inset:0;opacity:.12;mix-blend-mode:overlay;
  background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}
.v{position:absolute;left:72px;top:64px;bottom:64px;width:610px;display:flex;flex-direction:column}
.k{display:flex;align-items:center;gap:16px;color:#E9CD8E;font-family:S,serif;font-style:italic;font-weight:480;font-size:30px}
.k::before{content:"";width:40px;height:2px;background:#E4C47F}
h1{margin-top:20px;font-family:S,serif;font-weight:560;font-size:112px;line-height:.95;letter-spacing:-.035em;color:#F7EFE3}
.u{margin-top:26px;font-weight:500;font-stretch:100%;font-size:29px;line-height:1.3;color:#C4B5B2}
.b{margin-top:auto;display:flex;align-items:center;gap:16px;font-family:S,serif;font-weight:620;font-size:34px;letter-spacing:-.025em}
.b i{font-style:italic;font-weight:460;color:#E9CD8E}
.b small{font-family:A,sans-serif;font-weight:600;font-size:24px;color:#9C8B8E;letter-spacing:0;margin-left:2px}
.kort{position:absolute;right:70px;top:110px;width:400px;height:380px;padding:32px 32px 36px;border-radius:30px;background:#F7EFE3;color:#1A1012;
  transform:rotate(-3deg);box-shadow:14px 14px 0 #BFA27A,0 50px 90px -30px rgba(0,0,0,.7);display:flex;flex-direction:column}
.ke{font-family:S,serif;font-style:italic;font-weight:500;font-size:28px;color:#8A2A1D}
.kt{margin:auto 0;font-family:S,serif;font-weight:560;font-size:42px;line-height:1.1;letter-spacing:-.02em}
.m{position:absolute;right:46px;top:80px;transform:rotate(5deg);background:linear-gradient(180deg,#F1DAA2,#E4C47F 52%,#D2AE63);color:#1A1012;font-weight:800;font-stretch:100%;font-size:28px;
  padding:12px 22px;border-radius:999px;box-shadow:inset 0 1px 0 rgba(255,255,255,.5),0 4px 0 #8C6A2C}
</style></head><body>
<div class="v"><div class="k">${esc(kicker)}</div><h1 id="h">${esc(tittel)}</h1><div class="u">${esc(under)}</div>
<div class="b">${logo}<span>mitt<i>vors</i><small>.no</small></span></div></div>
<div class="kort"><div class="ke">${esc(kortEtikett)}</div><div class="kt" id="kt">${esc(kortTekst)}</div></div>
${merke ? `<div class="m">${esc(merke)}</div>` : ''}
<script>
// Krymp tittel og korttekst til de får plass
function pass(el, maksH, min){ var s = parseFloat(getComputedStyle(el).fontSize); while ((el.scrollWidth > el.clientWidth + 1 || el.offsetHeight > maksH) && s > min){ s -= 2; el.style.fontSize = s + 'px'; } }
document.fonts.ready.then(function(){ pass(document.getElementById('h'), 300, 54); pass(document.getElementById('kt'), 248, 22); document.body.dataset.klar = '1'; });
</script></body></html>`;
}

const bilder = [
  { fil: 'og/mittvors.jpg', kicker: 'Drikkeleker · rom · Nyhetsrunden', tittel: 'Mitt vors', under: 'Drikkeleker dere spiller fra hver deres telefon',
    kortEtikett: 'Mest sannsynlig', kortTekst: 'Hvem er mest sannsynlig til å kapre høyttaleren før klokka elleve i kveld?' },
  { fil: 'og/rom.jpg', kicker: 'Du er invitert', tittel: 'Bli med på vorset', under: 'Åpne lenken, skriv navnet ditt – så er du med',
    kortEtikett: 'Jeg har aldri', kortTekst: 'Jeg har aldri sendt «sorry for i går» uten å vite hva jeg beklaget.', merke: 'Din tur!' },
  { fil: 'og/drikkeleker.jpg', kicker: 'Over 60 drikkeleker med regler', tittel: 'Drikkeleker', under: 'Kortstokk, terninger og rom for hele gjengen',
    kortEtikett: 'Enten eller', kortTekst: 'Bo med eksen ett år til for å spare husleie – eller flytte hjem til foreldrene?' },
  { fil: 'og/nyhetsrunden.jpg', kicker: 'Ny runde hver fredag', tittel: 'Nyhetsrunden', under: 'Ukas nyheter som drikkelek – feil svar, drikk',
    kortEtikett: 'Spørsmål 1 av 30', kortTekst: 'Fulgte du med på nyhetene denne uka? Det får vi se.' },
];
bilder.push({ ...bilder[0], fil: 'og/banterdeck.jpg' });

// Én per lek
const spill = content.find((s) => s.id === 'spill');
for (const g of spill.groups) {
  for (const it of g.items) {
    const slug = it.slug || slugify(t(it.name));
    const deck = decks[slug];
    let kortTekst = '', kortEtikett = '';
    if (deck && (deck.kind === 'deck' || deck.kind === 'forraeder') && Array.isArray(deck.items) && deck.items.length && deck.items[0].t) {
      kortTekst = deck.items[0].t; kortEtikett = '1 / ' + deck.items.filter((x) => !deck.items[0].m || x.m === deck.items[0].m).length;
    } else if (HOOK[slug]) { kortTekst = HOOK[slug]; kortEtikett = 'Slik funker det'; }
    else {
      const r = (t(it.rules) || [])[0] || ''; kortTekst = (Array.isArray(r) ? r[0] : r).replace(/^b\|/, ''); kortEtikett = 'Slik funker det';
      if (kortTekst.length > 120) kortTekst = kortTekst.slice(0, 117).replace(/\s+\S*$/, '') + ' …';
    }
    const pl = it.pl ? String(it.pl) : '';
    bilder.push({ fil: 'og/lek/' + slug + '.jpg', kicker: 'Drikkelek' + (pl ? ' · ' + pl + ' spillere' : ''), tittel: t(it.name), under: t(g.title), kortEtikett, kortTekst });
  }
}

const nettleser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
const sideObj = await nettleser.newPage({ viewport: { width: 1200, height: 630 } });
fs.mkdirSync(path.join(ROT, 'public/og/lek'), { recursive: true });
for (const b of bilder) {
  await sideObj.setContent(side(b), { waitUntil: 'load' });
  await sideObj.waitForSelector('body[data-klar]');
  await sideObj.screenshot({ path: path.join(ROT, 'public', b.fil), type: 'jpeg', quality: 86 });
}
await nettleser.close();
console.log('Laget', bilder.length, 'delingsbilder');
