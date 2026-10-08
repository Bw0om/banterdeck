// Lager app-ikonene fra public/favicon.svg: favicon-48.png, favicon.ico (16/32/48),
// apple-touch-icon*.png (180) og icon-192/512.png (PWA, også «maskable»).
// Hjemskjerm-ikonene får gullflate helt ut i kantene – iOS og Android runder hjørnene selv.
//
// Kjør fra prosjektmappa:  node scripts/lag-ikoner.mjs
// Trenger Playwright, som lag-delingsbilder.mjs (PW_MODUL / PW_CHROMIUM fungerer likt).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

let chromium;
try { ({ chromium } = await import('playwright')); }
catch { ({ chromium } = await import(process.env.PW_MODUL || 'playwright')); }

const ROT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUB = path.join(ROT, 'public');
const svg = fs.readFileSync(path.join(PUB, 'favicon.svg'), 'utf8');
const rund = svg.replace(/width="64" height="64"/, 'width="100%" height="100%"');
const full = rund.replace(/rx="26"/, 'rx="0"');

const nettleser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
const side = await nettleser.newPage();
async function png(kilde, px, gjennomsiktig) {
  await side.setViewportSize({ width: px, height: px });
  await side.setContent(`<!doctype html><style>*{margin:0}html,body{width:${px}px;height:${px}px;background:${gjennomsiktig ? 'transparent' : '#E4C47F'}}svg{display:block}</style>${kilde}`);
  return side.screenshot({ omitBackground: gjennomsiktig, type: 'png' });
}

const skriv = (fil, data) => { fs.writeFileSync(path.join(PUB, fil), data); console.log('  ' + fil); };
skriv('favicon-48.png', await png(rund, 48, true));
for (const fil of ['apple-touch-icon.png', 'apple-touch-icon-precomposed.png', 'apple-touch-icon-180x180.png']) skriv(fil, await png(full, 180, false));
skriv('icon-192.png', await png(full, 192, false));
skriv('icon-512.png', await png(full, 512, false));

// favicon.ico: PNG-bilder pakket i ICO-format (støttes av alle nettlesere siden Vista)
const deler = [];
for (const px of [16, 32, 48]) deler.push({ px, data: await png(rund, px, true) });
const hode = Buffer.alloc(6 + 16 * deler.length);
hode.writeUInt16LE(0, 0); hode.writeUInt16LE(1, 2); hode.writeUInt16LE(deler.length, 4);
let pos = hode.length;
deler.forEach((d, i) => {
  const o = 6 + 16 * i;
  hode.writeUInt8(d.px, o); hode.writeUInt8(d.px, o + 1); hode.writeUInt8(0, o + 2); hode.writeUInt8(0, o + 3);
  hode.writeUInt16LE(1, o + 4); hode.writeUInt16LE(32, o + 6); hode.writeUInt32LE(d.data.length, o + 8); hode.writeUInt32LE(pos, o + 12);
  pos += d.data.length;
});
skriv('favicon.ico', Buffer.concat([hode, ...deler.map((d) => d.data)]));

await nettleser.close();
