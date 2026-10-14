// Lager kildebildene til iPhone-appen fra public/favicon.svg: assets/icon.png (1024 × 1024, gul flate helt ut i
// kantene, iOS runder hjørnene selv) og assets/splash.png (2732 × 2732, merket midt på papirfargen).
// Etterpå lager `npx @capacitor/assets generate --ios` alle størrelsene i ios/App/App/Assets.xcassets.
//
// Kjør fra prosjektmappa:  node scripts/lag-app-ikoner.mjs && npx @capacitor/assets generate --ios
// Trenger Playwright, som lag-ikoner.mjs (PW_MODUL / PW_CHROMIUM fungerer likt).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

let chromium;
try { ({ chromium } = await import('playwright')); }
catch { ({ chromium } = await import(process.env.PW_MODUL || 'playwright')); }

const ROT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const UT = path.join(ROT, 'assets');
fs.mkdirSync(UT, { recursive: true });
const svg = fs.readFileSync(path.join(ROT, 'public', 'favicon.svg'), 'utf8');
const rund = svg.replace(/width="64" height="64"/, 'width="100%" height="100%"');
// Appikon: hele flaten gul, ingen svart ramme, merket litt mindre så det ikke klippes av iOS sine runde hjørner
const full = rund.replace(/<rect x="2" y="2" width="60" height="60" rx="14" fill="#FFD23F" stroke="#16120F" stroke-width="4"\/>/, '<rect width="64" height="64" fill="#FFD23F"/>')
  .replace(/(<g fill="#F[^>]*>)/, '<g transform="translate(32 32) scale(.86) translate(-32 -32)">$1').replace(/<\/svg>\s*$/, '</g></svg>');

const nettleser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
const side = await nettleser.newPage();
async function png(html, px) {
  await side.setViewportSize({ width: px, height: px });
  await side.setContent(`<!doctype html><style>*{margin:0}html,body{width:${px}px;height:${px}px}</style>${html}`);
  return side.screenshot({ type: 'png' });
}
const skriv = (fil, data) => { fs.writeFileSync(path.join(UT, fil), data); console.log('  assets/' + fil); };
skriv('icon.png', await png(`<div style="width:100%;height:100%;background:#FFD23F">${full}</div>`, 1024));
// Oppstartsbildet: papirfarge med det runde merket (med ramme) midt på, 2732 px så det dekker alle iPhone-er
skriv('splash.png', await png(`<div style="width:100%;height:100%;background:#FFF8EE;display:grid;place-items:center"><div style="width:560px;height:560px">${rund}</div></div>`, 2732));
await nettleser.close();
