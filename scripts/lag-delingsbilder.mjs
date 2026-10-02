// Lager delingsbildene (og:image, 1200×630) i Nattlilla-stil: public/og/*.jpg og public/og/lek/<slug>.jpg.
// Dette er bildet folk ser når en romlenke eller en lek deles på Snap, Messenger eller iMessage.
//
// Kjør fra prosjektmappa:  node scripts/lag-delingsbilder.mjs
// Trenger Playwright (npm i -D playwright && npx playwright install chromium).
// Finnes Chromium et annet sted, sett PW_CHROMIUM=/sti/til/chromium.
import fs from 'node:fs';
import path from 'node:path';

let chromium;
try { ({ chromium } = await import('playwright')); }
catch { ({ chromium } = await import(process.env.PW_MODUL || 'playwright')); }

const ROT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const les = (f) => JSON.parse(fs.readFileSync(path.join(ROT, f), 'utf8'));
const content = les('src/data/content.json');
const decks = les('src/data/decks.json');
// Skriften bakes inn som data-URL (en side fra setContent får ikke lese lokale filer)
const fontData = (f) => 'data:font/woff2;base64,' + fs.readFileSync(path.join(ROT, 'node_modules/@fontsource-variable/archivo/files', f)).toString('base64');
const font = fontData('archivo-latin-wdth-normal.woff2');
const fontExt = fontData('archivo-latin-ext-wdth-normal.woff2');
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
*{box-sizing:border-box;margin:0}
body{width:1200px;height:630px;overflow:hidden;font-family:A,sans-serif;color:#F5F0FF;
  background:radial-gradient(620px 420px at 98% 0%,rgba(255,91,31,.34),transparent 70%),radial-gradient(520px 380px at 0% 105%,rgba(200,255,46,.10),transparent 70%),#120A1D}
body::after{content:"";position:fixed;inset:0;opacity:.16;mix-blend-mode:overlay;
  background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}
.v{position:absolute;left:72px;top:64px;bottom:64px;width:610px;display:flex;flex-direction:column}
.k{color:#C8FF2E;font-weight:800;font-stretch:100%;font-size:24px;letter-spacing:.13em;text-transform:uppercase}
h1{margin-top:22px;font-weight:900;font-stretch:118%;font-size:112px;line-height:.92;letter-spacing:-.035em;color:#F5F0FF}
.u{margin-top:26px;font-weight:600;font-stretch:100%;font-size:30px;line-height:1.25;color:#B4A7CF}
.b{margin-top:auto;display:flex;align-items:center;gap:14px;font-weight:850;font-stretch:112%;font-size:30px;letter-spacing:-.01em}
.b i{font-style:normal;color:#FF7A45}
.kort{position:absolute;right:70px;top:110px;width:400px;height:380px;padding:30px 30px 34px;border-radius:30px;background:#F7F2FF;color:#12081C;
  transform:rotate(-4deg);box-shadow:16px 16px 0 #FF5B1F;display:flex;flex-direction:column}
.ke{font-weight:850;font-stretch:66%;font-size:24px;letter-spacing:.03em;color:rgba(26,14,40,.62)}
.kt{margin:auto 0;font-weight:850;font-stretch:100%;font-size:40px;line-height:1.08;letter-spacing:-.02em}
.m{position:absolute;right:40px;top:76px;transform:rotate(7deg);background:#C8FF2E;color:#12081C;font-weight:900;font-stretch:118%;font-size:30px;
  padding:12px 22px;border-radius:16px;box-shadow:0 6px 0 #7DA80F}
</style></head><body>
<div class="v"><div class="k">${esc(kicker)}</div><h1 id="h">${esc(tittel)}</h1><div class="u">${esc(under)}</div>
<div class="b">${logo}<span>mitt<i>vors</i>.no</span></div></div>
<div class="kort"><div class="ke">${esc(kortEtikett)}</div><div class="kt" id="kt">${esc(kortTekst)}</div></div>
${merke ? `<div class="m">${esc(merke)}</div>` : ''}
<script>
// Krymp tittel og korttekst til de får plass
function pass(el, maksH, min){ var s = parseFloat(getComputedStyle(el).fontSize); while ((el.scrollWidth > el.clientWidth + 1 || el.offsetHeight > maksH) && s > min){ s -= 2; el.style.fontSize = s + 'px'; } }
document.fonts.ready.then(function(){ pass(document.getElementById('h'), 300, 54); pass(document.getElementById('kt'), 270, 22); document.body.dataset.klar = '1'; });
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
