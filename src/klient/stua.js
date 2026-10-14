import { FARGBAR } from '../lib/pynt.js';
// Stua: en isometrisk stue tegnet med tykk strek (se DESIGN.md). Brukes på forsiden, i rommet og på TV-en.
// - Folk går inn døra når de blir med, kan dras rundt og rusler litt rundt av seg selv.
// - Påskeegg: lampa kan slås av og på, TV-en roper SKÅL, den som dras til døra vil ikke gå,
//   og den som ristes blir svimmel. Den som plager de andre for mye, må ta en slurk (avgjøres på serveren).
// - All bevegelse er fjær med dempingsgrad 0,8 (omtrent 1,5 % oversving).

/* ---------- Fjær ---------- */
const lagFjaer = (k, z) => ({ k, c: 2 * z * Math.sqrt(k) });
const MYK = lagFjaer(170, 0.8), RASK = lagFjaer(320, 0.82), ROLIG = lagFjaer(40, 0.9);
const REDUSERT = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const aktive = new Set();
let gaar = false;
function start(o) {
  aktive.add(o); if (gaar) return; gaar = true; let t0 = performance.now();
  requestAnimationFrame(function steg(t) {
    const dt = Math.min(0.032, (t - t0) / 1000); t0 = t;
    aktive.forEach((x) => { if (x.steg(dt)) aktive.delete(x); });
    if (aktive.size) requestAnimationFrame(steg); else gaar = false;
  });
}
function Verdi(v, f) { this.v = v; this.mal = v; this.fart = 0; this.f = f || MYK; }
Verdi.prototype.tikk = function (dt) {
  const a = -this.f.k * (this.v - this.mal) - this.f.c * this.fart;
  this.fart += a * dt; this.v += this.fart * dt;
  if (Math.abs(this.fart) < 0.002 && Math.abs(this.v - this.mal) < 0.002) { this.v = this.mal; this.fart = 0; return true; }
  return false;
};
export const fjaer = { Verdi, start, stopp: (o) => aktive.delete(o), MYK, RASK, ROLIG, redusert: REDUSERT };

/* ---------- Figurer: emoji-ansikter med tykk strek ---------- */
const B = '#16120F';
const MUNN = {
  smil: `<path d="M-6 -50q6 6 12 0" fill="none" stroke="${B}" stroke-width="2.6" stroke-linecap="round"/>`,
  glis: `<path d="M-7 -51h14q-1 8-7 8t-7-8z" fill="${B}"/><path d="M-5 -51h10v2.4h-10z" fill="#FFF8EE"/>`,
  o: `<ellipse cx="0" cy="-49" rx="3" ry="3.6" fill="${B}"/>`,
  tunge: `<path d="M-6 -51q6 5 12 0" fill="none" stroke="${B}" stroke-width="2.6" stroke-linecap="round"/><path d="M1 -48.5q2 4 5 0" fill="#FF5B1F" stroke="${B}" stroke-width="2"/>`,
  sur: `<path d="M-6 -47q6-5 12 0" fill="none" stroke="${B}" stroke-width="2.6" stroke-linecap="round"/>`,
};
const OYNE = {
  vanlig: `<circle cx="-5" cy="-57" r="2.3" fill="${B}"/><circle cx="5" cy="-57" r="2.3" fill="${B}"/>`,
  blunk: `<circle cx="-5" cy="-57" r="2.3" fill="${B}"/><path d="M2.5 -57h5" stroke="${B}" stroke-width="2.4" stroke-linecap="round"/>`,
  glad: `<path d="M-7.5 -56q2.5-3.5 5 0M2.5 -56q2.5-3.5 5 0" fill="none" stroke="${B}" stroke-width="2.4" stroke-linecap="round"/>`,
  svimmel: `<path d="M-8 -60l5 5M-3 -60l-5 5M3 -60l5 5M8 -60l-5 5" stroke="${B}" stroke-width="2.2" stroke-linecap="round"/>`,
};
const HAAR = {
  kort: `<path d="M-15 -58a15 15 0 0 1 30 0q-8-6-15-3t-15 3z" fill="{h}" stroke="${B}" stroke-width="3" stroke-linejoin="round"/>`,
  lang: `<path d="M-16 -44v-14a16 16 0 0 1 32 0v14h-5v-12q-11-4-22 0v12z" fill="{h}" stroke="${B}" stroke-width="3" stroke-linejoin="round"/>`,
  lue: `<path d="M-15 -60a15 15 0 0 1 30 0z" fill="{h}" stroke="${B}" stroke-width="3" stroke-linejoin="round"/><path d="M-17 -60h34" stroke="${B}" stroke-width="3" stroke-linecap="round"/><circle cx="0" cy="-76" r="3.6" fill="{h}" stroke="${B}" stroke-width="2.6"/>`,
  krus: `<g fill="{h}" stroke="${B}" stroke-width="3"><circle cx="-11" cy="-64" r="6"/><circle cx="0" cy="-69" r="7"/><circle cx="11" cy="-64" r="6"/></g>`,
  hestehale: `<path d="M-15 -58a15 15 0 0 1 30 0q-8-5-15-3t-15 3z" fill="{h}" stroke="${B}" stroke-width="3" stroke-linejoin="round"/><path d="M13 -64q10 2 9 16q-6-4-8-10" fill="{h}" stroke="${B}" stroke-width="3" stroke-linejoin="round"/>`,
  bolle: `<circle cx="0" cy="-74" r="6" fill="{h}" stroke="${B}" stroke-width="3"/><path d="M-15 -58a15 15 0 0 1 30 0q-8-5-15-3t-15 3z" fill="{h}" stroke="${B}" stroke-width="3" stroke-linejoin="round"/>`,
  snau: '',
};
/* Pynt: luer, briller, medaljer og kjæledyr. Tegnes over håret (hode), over øynene (ansikt), på brystet, eller ved siden av (venn). */
const HS = `stroke="${B}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`;
export const PYNT_SVG = {
  partyhatt: `<path d="M-11 -66L0 -94l11 28z" fill="#FF5B1F" ${HS}/><path d="M-6 -76l12-7M-3 -85l6-3" stroke="#FFD23F" stroke-width="3" stroke-linecap="round"/><circle cx="0" cy="-94" r="3.5" fill="#FFD23F" ${HS}/>`,
  eierkrone: `<path d="M-16 -63l2-18 7 8 7-16 7 16 7-8 2 18z" fill="#FFD23F" ${HS}/><rect x="-16" y="-67" width="32" height="5" rx="1" fill="#FFD23F" stroke="${B}" stroke-width="2.5"/><path d="M0 -78l4 5-4 5-4-5z" fill="#FF9CC2" stroke="${B}" stroke-width="2"/><circle cx="-9" cy="-72" r="2" fill="#5A8DEE" stroke="${B}" stroke-width="1.5"/><circle cx="9" cy="-72" r="2" fill="#63E2A8" stroke="${B}" stroke-width="1.5"/><g class="eier-glimt"><path d="M-22 -86l1.6 3.8 3.8 1.6-3.8 1.6-1.6 3.8-1.6-3.8-3.8-1.6 3.8-1.6z" fill="#FFF8EE" stroke="${B}" stroke-width="1.4"/><path d="M20 -94l1.3 3 3 1.3-3 1.3-1.3 3-1.3-3-3-1.3 3-1.3z" fill="#FFE07A" stroke="${B}" stroke-width="1.4"/></g>`,
  krone: `<path d="M-14 -64l3-14 7 7 4-12 4 12 7-7 3 14z" fill="#FFD23F" ${HS}/><circle cx="-6" cy="-68" r="2" fill="#FF5B1F"/><circle cx="6" cy="-68" r="2" fill="#FF5B1F"/>`,
  glorie: `<ellipse cx="0" cy="-81" rx="13" ry="4" fill="none" stroke="${B}" stroke-width="6.5"/><ellipse cx="0" cy="-81" rx="13" ry="4" fill="none" stroke="#FFD23F" stroke-width="3.5"/>`,
  cowboyhatt: `<path d="M-15 -67q0-20 15-20t15 20z" fill="#B9773F" ${HS}/><path d="M-15 -69h30" stroke="${B}" stroke-width="3"/><path d="M-25 -68q25 5 50 0q-5 5-25 5t-25-5z" fill="#B9773F" ${HS}/>`,
  topphatt: `<rect x="-14" y="-94" width="28" height="28" rx="2" fill="#1C1B1F" ${HS}/><rect x="-14" y="-74" width="28" height="5" fill="#FF5B1F"/><ellipse cx="0" cy="-66" rx="21" ry="3.5" fill="#1C1B1F" ${HS}/>`,
  hjelm: `<path d="M-15 -66q0-20 15-20t15 20z" fill="#FFD23F" ${HS}/><rect x="-19" y="-68" width="38" height="5" rx="2.5" fill="#FFD23F" ${HS}/><path d="M-4 -83v12" stroke="${B}" stroke-width="3" stroke-linecap="round"/>`,
  lue: `<path d="M-15 -64a15 14 0 0 1 30 0z" fill="#63E2A8" ${HS}/><rect x="-17" y="-67" width="34" height="6" rx="3" fill="#FFF8EE" ${HS}/><circle cx="0" cy="-80" r="4" fill="#FFF8EE" ${HS}/>`,
  nisselue: `<path d="M-15 -65q2-21 15-23q14-2 19 8l-4 3q-4-6-11-3q-5 9-3 15z" fill="#E2363B" ${HS}/><rect x="-17" y="-67" width="34" height="6" rx="3" fill="#FFF8EE" ${HS}/><circle cx="19" cy="-77" r="4" fill="#FFF8EE" ${HS}/>`,
  solbriller: `<rect x="-13" y="-61" width="11" height="8" rx="3" fill="#1C1B1F" stroke="${B}" stroke-width="2.5"/><rect x="2" y="-61" width="11" height="8" rx="3" fill="#1C1B1F" stroke="${B}" stroke-width="2.5"/><path d="M-2 -58h4M-13 -59l-3-2M13 -59l3-2" stroke="${B}" stroke-width="2.5" stroke-linecap="round"/>`,
  nerdebriller: `<circle cx="-6" cy="-57" r="5.5" fill="none" stroke="${B}" stroke-width="5.5"/><circle cx="6" cy="-57" r="5.5" fill="none" stroke="${B}" stroke-width="5.5"/><circle cx="-6" cy="-57" r="5.5" fill="none" stroke="#FF5B1F" stroke-width="2.5"/><circle cx="6" cy="-57" r="5.5" fill="none" stroke="#FF5B1F" stroke-width="2.5"/>`,
  medalje: `<path d="M4 -41l3 10M12 -41l-3 10" stroke="#FF5B1F" stroke-width="4" stroke-linecap="round"/><circle cx="8" cy="-27" r="5.5" fill="#FFD23F" stroke="${B}" stroke-width="2.5"/>`,
  sloyfe: `<path d="M-15 -38l-5 10 6-1 2 4 5-10zM-7 -38l5 10-6-1-2 4-5-10z" fill="#E2363B" stroke="${B}" stroke-width="2.2" stroke-linejoin="round"/><circle cx="-11" cy="-37" r="4" fill="#7CC6FE" stroke="${B}" stroke-width="2.2"/>`,
  hund: `<ellipse cx="2" cy="0" rx="10" ry="3" fill="${B}" opacity=".22"/><path d="M-11 -8l-5-5" stroke="${B}" stroke-width="3" stroke-linecap="round"/><rect x="-11" y="-13" width="18" height="11" rx="5.5" fill="#B9773F" ${HS}/><circle cx="8" cy="-15" r="6.5" fill="#B9773F" ${HS}/><path d="M3 -20l-2-6 5 3zM13 -20l2-6-5 3z" fill="#7A4A2A" ${HS}/><circle cx="10" cy="-15" r="1.4" fill="${B}"/><path d="M-7 -2v2M3 -2v2" stroke="${B}" stroke-width="3" stroke-linecap="round"/>`,
  katt: `<ellipse cx="2" cy="0" rx="10" ry="3" fill="${B}" opacity=".22"/><path d="M-11 -8q-8 2-5-7" fill="none" stroke="${B}" stroke-width="3" stroke-linecap="round"/><rect x="-11" y="-13" width="18" height="11" rx="5.5" fill="#8A8580" ${HS}/><circle cx="8" cy="-15" r="6.5" fill="#8A8580" ${HS}/><path d="M3 -19l0-7 5 3zM13 -19l0-7-5 3z" fill="#8A8580" ${HS}/><circle cx="10" cy="-15" r="1.4" fill="${B}"/><path d="M14 -13l5 1M14 -11l5 1" stroke="${B}" stroke-width="1.6" stroke-linecap="round"/><path d="M-7 -2v2M3 -2v2" stroke="${B}" stroke-width="3" stroke-linecap="round"/>`,
  sel: `<ellipse cx="0" cy="0" rx="12" ry="3" fill="${B}" opacity=".22"/><path d="M-17 -5l-5-5 1 7z" fill="#8FA0B3" stroke="${B}" stroke-width="2.2" stroke-linejoin="round"/><path d="M-15 -2q-3-9 7-12q9-3 15 1q6 4 3 11q-1 2-5 2h-17q-3 0-3-2z" fill="#A9B8C9" ${HS}/><path d="M-9 -2q4-4 10-3" fill="none" stroke="#DDE5EE" stroke-width="2.5" stroke-linecap="round"/><circle cx="-6" cy="-9" r="1.3" fill="#7F90A3"/><circle cx="-1" cy="-11" r="1" fill="#7F90A3"/><path d="M3 -3q3 3 7 1" fill="#8FA0B3" stroke="${B}" stroke-width="2" stroke-linejoin="round"/><circle cx="9" cy="-15" r="7.5" fill="#A9B8C9" ${HS}/><circle cx="7" cy="-16" r="1.9" fill="${B}"/><circle cx="12.5" cy="-16" r="1.9" fill="${B}"/><circle cx="7.6" cy="-16.7" r=".6" fill="#FFF8EE"/><circle cx="13.1" cy="-16.7" r=".6" fill="#FFF8EE"/><ellipse cx="10" cy="-12.6" rx="1.6" ry="1.1" fill="${B}"/><path d="M6 -11.5l-4 .5M6 -10.5l-4 1.5M14 -11.5l4 .5M14 -10.5l4 1.5" stroke="${B}" stroke-width="1" stroke-linecap="round"/><circle cx="5" cy="-13" r="1.4" fill="#FF9CC2" opacity=".7"/><circle cx="15" cy="-13" r="1.4" fill="#FF9CC2" opacity=".7"/>`,
  and: `<ellipse cx="2" cy="0" rx="9" ry="3" fill="${B}" opacity=".22"/><ellipse cx="0" cy="-8" rx="10" ry="6" fill="#FFD23F" ${HS}/><circle cx="8" cy="-16" r="5.5" fill="#FFD23F" ${HS}/><path d="M13 -16l7 2-7 2z" fill="#FF5B1F" ${HS}/><circle cx="9" cy="-17" r="1.3" fill="${B}"/><path d="M-3 -2v2M3 -2v2" stroke="#FF5B1F" stroke-width="3" stroke-linecap="round"/>`,
};
/* Luer som dekker hele toppen av hodet: håret klippes under bremmen, så det ikke stikker opp gjennom lua. Verdien er bremlinja (y). */
const BREM = { cowboyhatt: -67, topphatt: -66, hjelm: -66, lue: -64, nisselue: -64 };
let klippNr = 0;
function haarHtml(p, pynt) {
  const type = pynt && pynt.hode && p.haar === 'lue' ? 'kort' : p.haar;
  const haar = HAAR[type].replace(/\{h\}/g, p.h), brem = pynt && pynt.hode ? BREM[pynt.hode] : null;
  if (brem == null) return haar;
  const id = 'hk' + (++klippNr);
  return `<clipPath id="${id}"><rect x="-40" y="${brem}" width="80" height="60"/></clipPath><g clip-path="url(#${id})">${haar}</g>`;
}
function pyntHtml(pynt) {
  if (!pynt) return '';
  let ut = '';
  ['bryst', 'hode', 'ansikt'].forEach((s) => {
    const id = pynt[s]; if (!id || !PYNT_SVG[id]) return;
    let svg = PYNT_SVG[id];
    if (s === 'hode' && pynt.fhode && FARGBAR[id]) svg = svg.split(FARGBAR[id]).join(pynt.fhode);
    ut += svg;
  });
  return ut;
}
export function figurHtml(p, pynt) {
  p = medValg(p, pynt);
  const venn = pynt && pynt.venn && PYNT_SVG[pynt.venn] ? `<g class="venn" transform="translate(23,0)">${PYNT_SVG[pynt.venn]}</g>` : '';
  const arm = (x, dir) => `<path d="M0 0L${12 * dir} -26" stroke="${p.topp}" stroke-width="7" stroke-linecap="round"/>`;
  // .beveg bæres av bevegelsene (skål, hopp, dans …), .pust av pusten. Armene ligger med skulderen i hjørnet av boksen sin,
  // så transform-origin kan settes der. Øyne og munn finnes i flere utgaver – bare én er synlig om gangen.
  return `<ellipse class="skygge" cx="0" cy="0" rx="16" ry="5" fill="${B}" opacity=".22"/>${venn}<g class="kropp"><g class="beveg"><g class="pust">` +
    `<rect x="-10" y="-15" width="7" height="15" rx="2" fill="${B}"/><rect x="3" y="-15" width="7" height="15" rx="2" fill="${B}"/>` +
    `<g class="gitar"><path d="M-22 -24L18 -40" stroke="#7A4A2A" stroke-width="4" stroke-linecap="round"/><ellipse cx="-14" cy="-24" rx="9" ry="7" fill="#FF5B1F" stroke="${B}" stroke-width="2.5"/></g>` +
    `<rect x="-14" y="-42" width="28" height="30" rx="9" fill="${p.topp}" stroke="${B}" stroke-width="3"/>` +
    `<rect x="7" y="-34" width="10" height="15" rx="2.5" fill="${B}"/><rect x="9" y="-32" width="6" height="9" rx="1" fill="#FFE07A"/>` +
    `<g class="tlf"><rect x="-8" y="-40" width="16" height="10" rx="2" fill="${B}"/><rect x="-6" y="-38" width="12" height="6" rx="1" fill="#7CC6FE"/></g>` +
    `<g class="arm-v"><g transform="translate(-10,-36)">${arm(0, -1)}<circle cx="-12" cy="-27" r="4.5" fill="${p.hud}" stroke="${B}" stroke-width="2.5"/><path class="horn" d="M-15 -28v-8M-9 -28v-8" stroke="${B}" stroke-width="3" stroke-linecap="round"/></g></g>` +
    `<g class="arm-h"><g transform="translate(10,-36)">${arm(0, 1)}<rect x="6" y="-44" width="12" height="15" rx="2" fill="#FFB020" stroke="${B}" stroke-width="2.5"/><g class="skum"><circle cx="10" cy="-48" r="2.6" fill="#FFF8EE" stroke="${B}" stroke-width="1.5"/><circle cx="16" cy="-51" r="2" fill="#FFF8EE" stroke="${B}" stroke-width="1.5"/></g></g></g>` +
    `<circle cx="0" cy="-56" r="15" fill="${p.hud}" stroke="${B}" stroke-width="3"/><circle class="gronn" cx="0" cy="-56" r="13.5" fill="#7BC96F"/>` +
    `<circle cx="-9" cy="-51" r="3" fill="#FF5B1F" opacity=".35"/><circle cx="9" cy="-51" r="3" fill="#FF5B1F" opacity=".35"/>` +
    `<g class="rodme"><ellipse cx="-9" cy="-50" rx="5" ry="3" fill="#FF3B5C" opacity=".7"/><ellipse cx="9" cy="-50" rx="5" ry="3" fill="#FF3B5C" opacity=".7"/></g>` +
    haarHtml(p, pynt) +
    `<g class="oyne"><g class="oyne-v"><g class="pupiller">${OYNE[p.oyne]}</g></g>` +
    `<g class="oyne-g"><path d="M-7.5 -56q2.5-3.5 5 0M2.5 -56q2.5-3.5 5 0" fill="none" stroke="${B}" stroke-width="2.4" stroke-linecap="round"/></g>` +
    `<g class="oyne-h"><path d="M-5 -54.5l-3-3a1.8 1.8 0 0 1 3-2a1.8 1.8 0 0 1 3 2zM5 -54.5l-3-3a1.8 1.8 0 0 1 3-2a1.8 1.8 0 0 1 3 2z" fill="#FF3B5C" stroke="${B}" stroke-width="1.2"/></g>` +
    `<g class="oyne-s"><path d="M-8 -57a3 3 0 1 0 3-3a2 2 0 1 0 1.5 2M2 -57a3 3 0 1 0 3-3a2 2 0 1 0 1.5 2" fill="none" stroke="${B}" stroke-width="1.6"/></g></g>` +
    `<g class="munn-s">${MUNN[p.munn]}</g>` +
    `<ellipse class="munn-o" cx="0" cy="-48.5" rx="3.2" ry="3.8" fill="${B}"/><path class="munn-b" d="M-7 -51h14q-1 8-7 8t-7-8z" fill="${B}"/>` +
    `<path class="munn-sur" d="M-6 -47q6-5 12 0" fill="none" stroke="${B}" stroke-width="2.6" stroke-linecap="round"/><path class="munn-kinn" d="M-4 -48h8" stroke="${B}" stroke-width="2.6" stroke-linecap="round"/>` +
    `<path class="svette" d="M14 -66q3 5 0 7q-3-2 0-7z" fill="#7CC6FE" stroke="${B}" stroke-width="1.6"/>` +
    `<g class="zzz"><text x="14" y="-70" font-size="11" font-weight="900" fill="${B}" font-family="Archivo Variable, Archivo, sans-serif">z</text><text x="20" y="-80" font-size="9" font-weight="900" fill="${B}" font-family="Archivo Variable, Archivo, sans-serif">z</text></g>` +
    `<g class="stjerner"><circle cx="-14" cy="-78" r="2.5" fill="#FFD23F" stroke="${B}" stroke-width="1.2"/><circle cx="14" cy="-78" r="2.5" fill="#FFD23F" stroke="${B}" stroke-width="1.2"/><circle cx="0" cy="-84" r="2.5" fill="#FFD23F" stroke="${B}" stroke-width="1.2"/></g>` +
    `<g class="hjerter"><path d="M-14 -80l-4-4a2.4 2.4 0 0 1 4-2.6a2.4 2.4 0 0 1 4 2.6z" fill="#FF3B5C" stroke="${B}" stroke-width="1.5"/><path d="M12 -86l-3-3a2 2 0 0 1 3-2a2 2 0 0 1 3 2z" fill="#FF3B5C" stroke="${B}" stroke-width="1.5"/></g>` +
    `<g class="dekk"><circle cx="-6" cy="-57" r="5.5" fill="${p.hud}" stroke="${B}" stroke-width="2.5"/><circle cx="6" cy="-57" r="5.5" fill="${p.hud}" stroke="${B}" stroke-width="2.5"/></g>` +
    `<g class="hender"><circle cx="-6" cy="-82" r="5" fill="${p.hud}" stroke="${B}" stroke-width="2.5"/><circle cx="6" cy="-82" r="5" fill="${p.hud}" stroke="${B}" stroke-width="2.5"/></g>` +
    pyntHtml(pynt) + `<path class="krone-v" d="M-14 -64l3-14 7 7 4-12 4 12 7-7 3 14z" fill="#FFD23F" ${HS}/>` + '<g class="boble-plass"></g></g></g></g>';
}
/** Bevegelsene som kan låses opp (slot «beveg» i pynten): små ikoner til arket. */
export const BEVEG_SVG = {
  vink: `<path d="M-6 -2v-14q0-5 5-5t5 5v14" fill="none" ${HS}/><path d="M-14 -10l-5-8M14 -10l5-8" ${HS}/>`,
  dans: `<path d="M-10 -22l10-6 10 6M-6 -2l6-12 6 12" fill="none" ${HS}/><circle cx="0" cy="-24" r="4" fill="#FFD23F" ${HS}/>`,
  bukk: `<path d="M-12 -10q12-12 24 0" fill="none" ${HS}/><circle cx="12" cy="-8" r="4" fill="#FFD23F" ${HS}/>`,
  snurr: `<path d="M-12 -14a12 12 0 1 1 4 9" fill="none" ${HS}/><path d="M-12 -8l0 -7 7 1" fill="none" ${HS}/>`,
  gitar: `<path d="M-14 -4L12 -22" ${HS}/><ellipse cx="-9" cy="-6" rx="7" ry="5" fill="#FF5B1F" ${HS}/>`,
  moon: `<path d="M-14 -4h28M-8 -4l6-14M8 -4l-6-14" fill="none" ${HS}/><circle cx="2" cy="-22" r="3.5" fill="#FFD23F" ${HS}/>`,
};
/* ---------- Hodene: søte, runde hoder med store øyne som kan se rundt seg ----------
   Samme hår, hud og farge som figuren (utseende(id)), men større og rundere. Brukes der folk skal se på
   hverandre: de står med skuldrene nederst i ruta og reiser seg når de har svart. Øynene flyttes utenfra
   (gruppa .mv-pup får en transform), så telefonen og TV-en styrer blikket uten å tegne på nytt. */
const HODE_HAAR = {
  kort: `<path d="M-22 -4a22 22 0 0 1 44 0q-6-9-14-9q-4 6-10 6q-6-7-12 0q-5-2-8 3z" fill="{h}" stroke="${B}" stroke-width="3" stroke-linejoin="round"/>`,
  lang: `<path d="M-22 -4a22 22 0 0 1 44 0q-9-6-22-6t-22 6z" fill="{h}" stroke="${B}" stroke-width="3" stroke-linejoin="round"/>`,
  lue: `<path d="M-22 -6a22 22 0 0 1 44 0z" fill="{h}" stroke="${B}" stroke-width="3" stroke-linejoin="round"/><rect x="-24" y="-9" width="48" height="7" rx="3.5" fill="{h}" stroke="${B}" stroke-width="3"/><circle cx="0" cy="-30" r="5" fill="{h}" stroke="${B}" stroke-width="3"/>`,
  krus: `<path d="M-22 -4a22 22 0 0 1 44 0q-9-6-22-6t-22 6z" fill="{h}" stroke="${B}" stroke-width="3" stroke-linejoin="round"/>`,
  hestehale: `<path d="M-22 -4a22 22 0 0 1 44 0q-9-6-22-6t-22 6z" fill="{h}" stroke="${B}" stroke-width="3" stroke-linejoin="round"/>`,
  bolle: `<circle cx="0" cy="-25" r="9" fill="{h}" stroke="${B}" stroke-width="3"/><path d="M-22 -4a22 22 0 0 1 44 0q-9-6-22-6t-22 6z" fill="{h}" stroke="${B}" stroke-width="3" stroke-linejoin="round"/>`,
  snau: '',
};
const HODE_BAK = {
  lang: `<path d="M-24 18v-20a24 24 0 0 1 48 0v20h-8v-16q-16-6-32 0v16z" fill="{h}" stroke="${B}" stroke-width="3" stroke-linejoin="round"/>`,
  krus: `<g fill="{h}" stroke="${B}" stroke-width="3"><circle cx="-17" cy="-13" r="8"/><circle cx="17" cy="-13" r="8"/><circle cx="-7" cy="-22" r="8"/><circle cx="7" cy="-22" r="8"/><circle cx="0" cy="-26" r="7"/></g>`,
  hestehale: `<path d="M18 -12q14 2 13 22q-8-5-11-14" fill="{h}" stroke="${B}" stroke-width="3" stroke-linejoin="round"/>`,
};
const HODE_MUNN = {
  smil: `<path d="M-5 15q5 4 10 0" fill="none" stroke="${B}" stroke-width="2.6" stroke-linecap="round"/>`,
  glis: `<path d="M-6 13h12q-1 7-6 7t-6-7z" fill="${B}"/><path d="M-4 13h8v2h-8z" fill="#FFF8EE"/>`,
  o: `<ellipse cx="0" cy="15" rx="2.6" ry="3" fill="${B}"/>`,
  tunge: `<path d="M-5 14q5 4 10 0" fill="none" stroke="${B}" stroke-width="2.6" stroke-linecap="round"/><path d="M1 16q2 4 5 0" fill="#FF5B1F" stroke="${B}" stroke-width="2"/>`,
  sur: `<path d="M-5 16q5-3 10 0" fill="none" stroke="${B}" stroke-width="2.6" stroke-linecap="round"/>`,
  flat: `<path d="M-5 15q5-2 10 0" fill="none" stroke="${B}" stroke-width="2.6" stroke-linecap="round"/>`,
  oi: `<ellipse cx="0" cy="16" rx="4.5" ry="5.5" fill="${B}"/><ellipse cx="0" cy="18" rx="2.5" ry="2" fill="#FF5B1F"/>`,
};
/** Innholdet i et hode. uttrykk: 'vanlig' | 'oi' (store øyne, hevede bryn, åpen munn, svettedråpe) | 'flat' (litt flau munn). */
export function hodeHtml(p, uttrykk) {
  const oi = uttrykk === 'oi', h = p.h || B, haar = HODE_HAAR[p.haar] != null ? p.haar : 'kort';
  const munn = oi ? HODE_MUNN.oi : uttrykk === 'flat' ? HODE_MUNN.flat : (HODE_MUNN[p.munn] || HODE_MUNN.smil);
  const ry = oi ? 8 : 6.5, r = oi ? 2.2 : 3.2;
  return (HODE_BAK[haar] || '').replace(/\{h\}/g, h) +
    `<path d="M-27 50q1-26 27-26t27 26z" fill="${p.topp}" stroke="${B}" stroke-width="3" stroke-linejoin="round"/><path d="M-7 25q7 6 14 0" fill="none" stroke="${B}" stroke-width="2.6" stroke-linecap="round"/>` +
    `<circle cx="0" cy="0" r="22" fill="${p.hud}" stroke="${B}" stroke-width="3"/>` +
    HODE_HAAR[haar].replace(/\{h\}/g, h) +
    `<circle cx="-15" cy="9" r="4" fill="#FF9CC2" opacity=".8"/><circle cx="15" cy="9" r="4" fill="#FF9CC2" opacity=".8"/>` +
    (oi ? `<path d="M-14 -7q6-4 11-1M3 -8q5-3 11 1" fill="none" stroke="${B}" stroke-width="2.4" stroke-linecap="round"/>` : '') +
    `<g class="mv-lokk"><ellipse cx="-8" cy="4" rx="6" ry="${ry}" fill="#FFFFFF" stroke="${B}" stroke-width="2.5"/><ellipse cx="8" cy="4" rx="6" ry="${ry}" fill="#FFFFFF" stroke="${B}" stroke-width="2.5"/>` +
    `<g class="mv-pup"><circle cx="-8" cy="4" r="${r}" fill="${B}"/><circle cx="8" cy="4" r="${r}" fill="${B}"/><circle cx="-6.8" cy="2.6" r="1.1" fill="#FFFFFF"/><circle cx="9.2" cy="2.6" r="1.1" fill="#FFFFFF"/></g></g>` +
    munn + (oi ? `<path class="mv-svette" d="M25 -12q4 5 0 8q-4-3 0-8z" fill="#7CC6FE" stroke="${B}" stroke-width="2"/>` : '');
}
/** Hodet med skuldre som SVG (60 bred, 92 høy). Skuldrene er ment å gå under kanten av ruta. */
export function hodeSvgNy(p, uttrykk, klasse) { return `<svg class="mv-hode${klasse ? ' ' + klasse : ''}" viewBox="-30 -42 60 92" aria-hidden="true">${hodeHtml(p, uttrykk)}</svg>`; }
/** Bare hodet, til små fjes (f.eks. «Hvor mange er dere?»). */
export function hodeSvg(p) { return `<svg viewBox="-19 -80 38 40" aria-hidden="true">${figurHtml(p)}</svg>`; }

const TOPP = ['#FF5B1F', '#63E2A8', '#FFD23F', '#FF9CC2', '#FFF8EE', '#1C1B1F', '#5A8DEE'];
const HUD = ['#F2C6A0', '#E9B48F', '#C98D63', '#8D5A3B', '#5E3A24'];
const HAARF = [B, '#7A4A2A', '#FFD23F', '#FF5B1F', '#FF9CC2', '#63E2A8', '#E8C15C'];
const HAARTYPE = ['kort', 'lang', 'lue', 'krus', 'hestehale'];
const OYETYPE = ['vanlig', 'glad', 'blunk', 'vanlig'];
const MUNNTYPE = ['smil', 'glis', 'tunge', 'o', 'smil'];
function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
/** Samme person ser lik ut på alle skjermer: utseendet regnes ut fra id-en. */
export function utseende(id, pynt) {
  const h = hash(String(id)), v = (n, s) => (h >>> s) % n;
  let topp = TOPP[v(TOPP.length, 0)], har = HAARF[v(HAARF.length, 5)];
  if (har === topp) har = B;
  return medValg({ topp, hud: HUD[v(HUD.length, 9)], h: har, haar: HAARTYPE[v(HAARTYPE.length, 13)], oyne: OYETYPE[v(OYETYPE.length, 17)], munn: MUNNTYPE[v(MUNNTYPE.length, 21)] }, pynt);
}
/** Frisyre og farger brukeren har valgt, oppå utseendet fra id-en. Trygt å kalle flere ganger. */
export function medValg(p, pynt) {
  if (!pynt) return p;
  const ut = Object.assign({}, p);
  if (pynt.haar && (HAAR[pynt.haar] != null)) ut.haar = pynt.haar;
  if (pynt.fh) ut.h = pynt.fh;
  if (pynt.fhud) ut.hud = pynt.fhud;
  if (pynt.ftopp) ut.topp = pynt.ftopp;
  return ut;
}
const GJESTER = [
  { topp: '#FF9CC2', hud: '#E9B48F', h: '#FF5B1F', haar: 'lue', oyne: 'blunk', munn: 'smil' },
  { topp: '#FFF8EE', hud: '#C98D63', h: '#7A4A2A', haar: 'lang', oyne: 'vanlig', munn: 'o' },
  { topp: '#63E2A8', hud: '#F2C6A0', h: B, haar: 'kort', oyne: 'glad', munn: 'glis' },
  { topp: '#FF5B1F', hud: '#8D5A3B', h: '#FFD23F', haar: 'krus', oyne: 'vanlig', munn: 'tunge' },
  { topp: '#FFD23F', hud: '#E9B48F', h: '#FF9CC2', haar: 'hestehale', oyne: 'blunk', munn: 'o' },
  { topp: '#1C1B1F', hud: '#C98D63', h: '#63E2A8', haar: 'lue', oyne: 'glad', munn: 'smil' },
];
const START = [
  { topp: '#FF5B1F', hud: '#C98D63', h: B, haar: 'kort', oyne: 'vanlig', munn: 'smil' },
  { topp: '#63E2A8', hud: '#F2C6A0', h: '#FFD23F', haar: 'lang', oyne: 'glad', munn: 'glis' },
  { topp: '#FFD23F', hud: '#8D5A3B', h: B, haar: 'krus', oyne: 'vanlig', munn: 'tunge' },
];

/* ---------- Rommet ---------- */
const NS = 'http://www.w3.org/2000/svg';
// Faste plasser på gulvet (utenfor bordet, sofaen og lampa), i den rekkefølgen folk kommer
const PLASSER = [[2.9, 1.0], [3.8, 1.2], [2.1, 4.9], [3.4, 5.3], [4.9, 3.0], [4.2, 5.5], [2.0, 1.4], [5.0, 2.0], [3.3, 0.8], [4.8, 4.2],
  [2.7, 5.6], [1.9, 3.4], [4.0, 4.4], [5.0, 5.6], [1.9, 5.6], [2.9, 1.9]];
function ledig(x, y) {
  if (x > 2.2 && x < 3.8 && y > 2.4 && y < 4.0) return false;   // bordet
  if (x < 1.7 && y > 1.3 && y < 5.1) return false;              // sofaen
  if (x < 1.0 && y > 5.0) return false;                         // lampa
  return x > 0.4 && x < 5.6 && y > 0.4 && y < 5.7;
}
const DOR = [5.05, 0.25];
/** Sofaen: de som sitter der, sitter litt høyere (på setet) og rusler ikke rundt. */
function paaSofa(p) { return p && p[0] < 1.7 && p[1] > 1.3 && p[1] < 5.1; }
const SETE_HOYDE = 15;
/** Takterrassen: fargene på det som står ute. */
const UTE = { sofa: ['#FFF8EE', '#d4cbbf', '#e8e0d4', '#FFF8EE'], bord: ['#1C1B1F', '#2A292E', '#16120F'] };
/** Hvordan stua ser ut. Fargene følger stua-paletten; hvert tema har én liten ting som er sin egen. */
export const TEMA = {
  stue: { gulv: '#FFD23F', gulv2: '#FFC928', list: '#2EA873', teppe: '#FF9CC2', veggV: '#63E2A8', veggH: '#FFF8EE', gardin: '#FF9CC2', hylle: '#B9773F', sofa: ['#FF9CC2', '#f06a9e', '#ff7fb0', '#FFB3D1'], bord: ['#FFF8EE', '#FF5B1F', '#E04A12'], plakat: '#FF5B1F', plakatPrikk: '#FFD23F', dor: '#FF5B1F', vindu: 'natt' },
  hytte: { gulv: '#D9A26A', gulv2: '#CF9660', list: '#7A4A2A', teppe: '#FFF8EE', veggV: '#B9773F', veggH: '#C98D63', hylle: '#7A4A2A', sofa: ['#2EA873', '#258a5e', '#1f7a52', '#63E2A8'], bord: ['#D9A26A', '#B9773F', '#9c6433'], plakat: '#63E2A8', plakatPrikk: '#7A4A2A', dor: '#7A4A2A', vindu: 'fjell', planker: true },
  julebord: { gulv: '#E2363B', gulv2: '#D32F34', list: '#2EA873', teppe: '#FFF8EE', veggV: '#2EA873', veggH: '#FFF8EE', gardin: '#E2363B', sofa: ['#E2363B', '#c42d31', '#a82329', '#ff6b6b'], bord: ['#FFF8EE', '#2EA873', '#258a5e'], plakat: '#E2363B', stjerne: true, dor: '#2EA873', vindu: 'sno', juletre: true, krans: true },
};
export function lagStua(svg, valg = {}) {
  const en = valg.lang === 'en';
  const T = (no, eng) => (en ? eng : no);
  svg.setAttribute('viewBox', '62 -4 396 326');
  svg.innerHTML = '';
  const I = (x, y, z) => [260 + (x - y) * 30, 112 + (x + y) * 15 - (z || 0)];
  const pts = (a) => a.map((p) => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
  function el(n, attr, mor) { const e = document.createElementNS(NS, n); for (const k in attr) e.setAttribute(k, attr[k]); (mor || svg).appendChild(e); return e; }
  const flate = (p, fyll, mor, ekstra) => el('polygon', Object.assign({ points: pts(p), fill: fyll, stroke: B, 'stroke-width': 3, 'stroke-linejoin': 'round' }, ekstra || {}), mor);
  function boks(x, y, z, w, d, h, topp, v, hoy, mor) {
    const g = el('g', {}, mor);
    flate([I(x + w, y, z), I(x + w, y + d, z), I(x + w, y + d, z + h), I(x + w, y, z + h)], hoy, g);
    flate([I(x, y + d, z), I(x + w, y + d, z), I(x + w, y + d, z + h), I(x, y + d, z + h)], v, g);
    flate([I(x, y, z + h), I(x + w, y, z + h), I(x + w, y + d, z + h), I(x, y + d, z + h)], topp, g);
    return g;
  }
  // Rommet (gulv, vegger, vindu, plakat, dør og TV) tegnes etter tema, og kan tegnes om
  const romG = el('g', { class: 'stua-rom' });
  const ref = { dor: null, handtak: null, tvTekst: null };
  let temaNaa = null;
  let ekstraNaa = [];
  let uteNaa = false, stilNaa = { gulv: 'fliser', lys: 'lampe' };
  function tegnRom(id, ekstra) {
    const t = TEMA[id] || TEMA.stue; temaNaa = TEMA[id] ? id : 'stue'; if (ekstra) ekstraNaa = ekstra.slice();
    romG.innerHTML = '';
    if (uteNaa) { tegnUte(); return; }
    const har = (x) => ekstraNaa.includes(x);
    const disko = stilNaa.gulv === 'disko';
    const r = (p, f, ekstra) => flate(p, f, romG, ekstra);
    r([I(0, 6, 0), I(6, 6, 0), I(6, 6, -16), I(0, 6, -16)], B);
    r([I(6, 0, 0), I(6, 6, 0), I(6, 6, -16), I(6, 0, -16)], B);
    // Gulvet: sjakkrutete fliser i to toner (diskogulv i fire farger)
    const DISKO = ['#FF9CC2', '#63E2A8', '#FFD23F', '#5A8DEE'];
    for (let x = 0; x < 6; x++) for (let y = 0; y < 6; y++) {
      const f = disko ? DISKO[(x * 3 + y * 5) % 4] : ((x + y) % 2 ? t.gulv : (t.gulv2 || t.gulv));
      r([I(x, y), I(x + 1, y), I(x + 1, y + 1), I(x, y + 1)], f, disko ? { 'stroke-width': 1.5, 'stroke-opacity': 0.3, class: 'disko-flis', style: '--b:' + ((x + y) * 140 + ((x * 7 + y * 3) % 4) * 90) + 'ms' } : { 'stroke-width': 1.5, 'stroke-opacity': 0.22 });
    }
    r([I(0, 0), I(6, 0), I(6, 6), I(0, 6)], 'none');
    if (!disko) { r([I(1.3, 1.6), I(4.3, 1.6), I(4.3, 4.6), I(1.3, 4.6)], t.teppe); r([I(1.7, 2.0), I(3.9, 2.0), I(3.9, 4.2), I(1.7, 4.2)], 'none', { 'stroke-dasharray': '6 6', 'stroke-width': 2.5 }); }
    // Veggene, med gulvlist og svake tapetstriper
    const vV = t.veggV, vH = t.veggH, list = t.list || t.veggV;
    r([I(0, 0, 0), I(0, 6, 0), I(0, 6, 100), I(0, 0, 100)], vV);
    r([I(0, 0, 0), I(6, 0, 0), I(6, 0, 100), I(0, 0, 100)], vH);
    for (let z = 20; z < 100; z += 20) { el('line', { x1: I(0, 6, z)[0], y1: I(0, 6, z)[1], x2: I(0, 0, z)[0], y2: I(0, 0, z)[1], stroke: B, 'stroke-width': 1.5, opacity: t.planker ? 0.25 : 0.12 }, romG); el('line', { x1: I(0, 0, z)[0], y1: I(0, 0, z)[1], x2: I(6, 0, z)[0], y2: I(6, 0, z)[1], stroke: B, 'stroke-width': 1.5, opacity: t.planker ? 0.25 : 0.12 }, romG); }
    r([I(0, 0, 0), I(0, 6, 0), I(0, 6, 8), I(0, 0, 8)], list, { 'stroke-width': 2 });
    r([I(0, 0, 0), I(6, 0, 0), I(6, 0, 8), I(0, 0, 8)], list, { 'stroke-width': 2 });
    // Vinduet på høyre vegg
    r([I(0.9, 0, 40), I(2.6, 0, 40), I(2.6, 0, 86), I(0.9, 0, 86)], t.vindu === 'fjell' ? '#7CC6FE' : '#1C1B1F');
    if (t.vindu === 'natt' || t.vindu === 'sno') {
      const mp = I(2.2, 0, 72); el('circle', { cx: mp[0], cy: mp[1], r: 7, fill: '#FFE07A', stroke: B, 'stroke-width': 2.5 }, romG);
      [[1.25, 64], [1.5, 78], [1.1, 50], [1.9, 56], [2.4, 48]].forEach(([x, z], n) => { const q = I(x, 0, z); if (t.vindu === 'sno' || n < 2) el('circle', { cx: q[0], cy: q[1], r: t.vindu === 'sno' ? 2.4 : 1.6, fill: '#FFF8EE' }, romG); });
    }
    if (t.vindu === 'fjell') { r([I(0.9, 0, 40), I(1.4, 0, 62), I(1.75, 0, 54), I(2.2, 0, 70), I(2.6, 0, 40)], '#FFF8EE', { 'stroke-width': 2.5 }); r([I(0.9, 0, 40), I(1.4, 0, 52), I(1.9, 0, 44), I(2.6, 0, 40)], '#2EA873', { 'stroke-width': 2.5 }); }
    el('line', { x1: I(1.75, 0, 40)[0], y1: I(1.75, 0, 40)[1], x2: I(1.75, 0, 86)[0], y2: I(1.75, 0, 86)[1], stroke: '#FFF8EE', 'stroke-width': 3 }, romG);
    if (t.gardin) { r([I(0.7, 0, 36), I(1.0, 0, 36), I(1.05, 0, 90), I(0.7, 0, 90)], t.gardin, { 'stroke-width': 2.5 }); r([I(2.5, 0, 36), I(2.8, 0, 36), I(2.8, 0, 90), I(2.45, 0, 90)], t.gardin, { 'stroke-width': 2.5 }); }
    // Plakat (eller lyslenke)
    if (t.plakat) { r([I(3.0, 0, 44), I(3.9, 0, 44), I(3.9, 0, 88), I(3.0, 0, 88)], t.plakat); const pp = I(3.45, 0, 66); if (t.stjerne) el('path', { d: `M${pp[0]} ${pp[1] - 10}l3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z`, fill: '#FFD23F', stroke: B, 'stroke-width': 2.5, 'stroke-linejoin': 'round' }, romG); else el('circle', { cx: pp[0], cy: pp[1], r: 8, fill: t.plakatPrikk, stroke: B, 'stroke-width': 2.5 }, romG); }
    if (stilNaa.lys === 'lys' || har('lys')) lyslenke(romG, 94);
    // Bokhylla på venstre vegg, ved døra-siden
    if (t.hylle) {
      r([I(0, 0.5, 0), I(0, 0.5, 70), I(0, 1.2, 70), I(0, 1.2, 0)], t.hylle);
      [20, 40, 58].forEach((z) => el('line', { x1: I(0, 1.2, z)[0], y1: I(0, 1.2, z)[1], x2: I(0, 0.5, z)[0], y2: I(0, 0.5, z)[1], stroke: B, 'stroke-width': 2.5 }, romG));
      [[0.56, 2, '#FF5B1F', 15], [0.72, 2, '#63E2A8', 12], [0.9, 2, '#5A8DEE', 16], [0.58, 22, '#FFD23F', 14], [0.76, 22, '#FF9CC2', 11], [0.6, 42, '#5A8DEE', 13], [0.8, 42, '#FF5B1F', 13]].forEach(([y, z, f, h]) => r([I(0, y, z), I(0, y + 0.14, z), I(0, y + 0.14, z + h), I(0, y, z + h)], f, { 'stroke-width': 1.8 }));
    }
    // Døra: står på gløtt med lys fra gangen. Dørbladet svinger inn i rommet.
    r([I(4.5, 0, 0), I(5.6, 0, 0), I(5.6, 0, 74), I(4.5, 0, 74)], B);
    r([I(4.58, 0, 2), I(5.52, 0, 2), I(5.52, 0, 72), I(4.58, 0, 72)], '#FFE07A', { 'stroke-width': 2 });
    const dorG = el('g', { class: 'stua-dor', style: 'cursor:pointer' }, romG);
    ref.dor = flate([I(4.5, 0, 0), I(4.5, 0.7, 0), I(4.5, 0.7, 74), I(4.5, 0, 74)], t.dor, dorG);
    ref.dorFarge = t.dor;
    const hp = I(4.5, 0.58, 36); ref.handtak = el('circle', { cx: hp[0], cy: hp[1], r: 3, fill: B }, dorG);
    el('polygon', { points: pts([I(4.4, 0, 0), I(5.7, 0, 0), I(5.7, 0, 78), I(4.4, 0, 78)]), fill: 'transparent' }, dorG);
    dorG.addEventListener('click', () => { if (valg.onDor) valg.onDor(); });
    if (t.krans) { const k = I(5.05, 0, 52); el('circle', { cx: k[0], cy: k[1], r: 9, fill: 'none', stroke: '#2EA873', 'stroke-width': 6 }, romG); el('circle', { cx: k[0], cy: k[1], r: 9, fill: 'none', stroke: B, 'stroke-width': 1.5 }, romG); el('circle', { cx: k[0], cy: k[1] + 9, r: 2.5, fill: '#E2363B', stroke: B, 'stroke-width': 1.5 }, romG); }
    // Juletre i hjørnet
    if (t.juletre) { const b0 = I(0.6, 0.6, 0); [[0, 26, 30], [16, 22, 52], [30, 17, 72]].forEach(([z, w, h]) => el('path', { d: `M${b0[0] - w} ${b0[1] - z}L${b0[0]} ${b0[1] - h}L${b0[0] + w} ${b0[1] - z}z`, fill: '#2EA873', stroke: B, 'stroke-width': 3, 'stroke-linejoin': 'round' }, romG)); el('rect', { x: b0[0] - 4, y: b0[1] - 2, width: 8, height: 8, fill: '#7A4A2A', stroke: B, 'stroke-width': 2.5 }, romG); [[-10, 22], [8, 38], [-6, 54], [6, 14]].forEach(([dx, dz], n) => el('circle', { cx: b0[0] + dx, cy: b0[1] - dz, r: 3.5, fill: ['#E2363B', '#FFD23F', '#FF9CC2', '#7CC6FE'][n], stroke: B, 'stroke-width': 2 }, romG)); el('path', { d: `M${b0[0]} ${b0[1] - 82}l3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z`, fill: '#FFD23F', stroke: B, 'stroke-width': 2.5, 'stroke-linejoin': 'round' }, romG); }
    // Små ting verten har låst opp
    if (har('plakat')) { r([I(0, 5.7, 48), I(0, 5.0, 48), I(0, 5.0, 82), I(0, 5.7, 82)], '#FFF8EE'); el('polygon', { points: pts([I(0, 5.6, 77), I(0, 5.1, 77), I(0, 5.1, 70), I(0, 5.6, 70)]), fill: '#FF5B1F', stroke: B, 'stroke-width': 1.5 }, romG); [62, 56].forEach((z) => el('line', { x1: I(0, 5.6, z)[0], y1: I(0, 5.6, z)[1], x2: I(0, 5.1, z)[0], y2: I(0, 5.1, z)[1], stroke: B, 'stroke-width': 2 }, romG)); el('polygon', { points: pts([I(0, 5.35, 64), I(0, 5.1, 64), I(0, 5.1, 54), I(0, 5.35, 54)]), fill: '#63E2A8', stroke: B, 'stroke-width': 1.5 }, romG); }
    if (har('platespiller')) { const g = el('g', {}, romG); boks(1.4, 0.35, 0, 0.9, 0.6, 10, '#FFF8EE', '#D9A26A', '#B9773F', g); const c = I(1.85, 0.65, 10); el('circle', { cx: c[0], cy: c[1] + 1, r: 7, fill: '#1C1B1F', stroke: B, 'stroke-width': 2 }, g); el('circle', { cx: c[0], cy: c[1] + 1, r: 2, fill: '#FF5B1F' }, g); el('line', { x1: c[0] + 9, y1: c[1] - 6, x2: c[0] + 2, y2: c[1], stroke: B, 'stroke-width': 2, 'stroke-linecap': 'round' }, g); }
    tegnTvRamme();
    if (disko) diskoLys();
  }
  /** Diskogulvet: lyskjegler fra taket som sveiper over gulvet, og fargede lysflekker som vandrer på veggene */
  function diskoLys() {
    const g = el('g', { class: 'disko-lys', 'pointer-events': 'none' }, romG);
    [[I(0.2, 0.2, 100), '#FF9CC2', 0], [I(5.8, 0.2, 100), '#63E2A8', 1], [I(0.2, 5.8, 100), '#5A8DEE', 2]].forEach(([o, f, n]) => {
      const m = I(3, 3, 0), dx = m[0] - o[0], dy = m[1] - o[1];
      const k = el('polygon', { points: pts([o, [o[0] + dx - 46, o[1] + dy + 6], [o[0] + dx + 46, o[1] + dy - 6]]), fill: f, opacity: 0.38, class: 'disko-kjegle k' + n }, g);
      el('ellipse', { cx: o[0] + dx, cy: o[1] + dy, rx: 46, ry: 20, fill: f, opacity: 0.5, class: 'disko-kjegle k' + n, style: 'transform-origin:' + o[0].toFixed(1) + 'px ' + o[1].toFixed(1) + 'px' }, g);
      k.style.transformOrigin = o[0].toFixed(1) + 'px ' + o[1].toFixed(1) + 'px';
    });
    [[0, 2.5, 60, '#FFD23F'], [0, 4.4, 40, '#FF9CC2'], [1.6, 0, 70, '#63E2A8'], [3.8, 0, 50, '#5A8DEE']].forEach(([x, y, z, f], n) => {
      const q = I(x, y, z); el('ellipse', { cx: q[0], cy: q[1], rx: 10, ry: 7, fill: f, opacity: 0.85, stroke: '#FFF8EE', 'stroke-width': 1.5, class: 'disko-flekk f' + n }, g);
    });
  }
  /** TV-en på venstre vegg: viser romkoden, eller kortet som spilles nå */
  function tegnTvRamme() {
    const tvG = el('g', { class: 'stua-tv', style: 'cursor:pointer' }, romG);
    flate([I(0, 4.6, 32), I(0, 1.4, 32), I(0, 1.4, 88), I(0, 4.6, 88)], B, tvG);
    flate([I(0, 4.4, 36), I(0, 1.6, 36), I(0, 1.6, 84), I(0, 4.4, 84)], '#2A292E', tvG, { stroke: 'none' });
    ref.tvTekst = el('g', {}, tvG);
    tvG.addEventListener('click', () => {
      clearTimeout(tvTimer); tegnTv({ etikett: T('ALLE SAMMEN', 'EVERYBODY'), kode: T('SKÅL!', 'CHEERS!'), stor: true });
      folk.forEach((f, n) => { if (!f.drar) setTimeout(() => { f.z.fart = 70; start(f); }, n * 50); });
      tvTimer = setTimeout(() => tegnTv(), 1600);
    });
  }
  function lyslenke(mor, topp) {
    const pkt = []; for (let x = 0; x <= 6; x += 0.5) pkt.push(I(x, 0, topp - Math.abs(Math.sin(x * 2.1)) * 5)); for (let y = 0.5; y <= 6; y += 0.5) pkt.unshift(I(0, y, topp - Math.abs(Math.sin(y * 2.1)) * 5));
    el('polyline', { points: pts(pkt), fill: 'none', stroke: B, 'stroke-width': 2 }, mor);
    pkt.forEach((q, n) => el('circle', { cx: q[0], cy: q[1] + 3, r: 2.6, fill: ['#FFD23F', '#FF5B1F', '#63E2A8', '#FF9CC2'][n % 4], stroke: B, 'stroke-width': 1.5, class: 'lys-paere', style: '--i:' + n }, mor));
  }
  /** Takterrassen: taket på bygget. Rekkverk i stedet for vegger, byen bak, fasaden fortsetter nedover. */
  function tegnUte() {
    const r = (p, f, ekstra) => flate(p, f, romG, ekstra);
    // Alt ute klippes til boksen, så byen aldri stikker utenfor
    const kid = 'klipp' + Math.random().toString(36).slice(2, 7);
    const cp = el('clipPath', { id: kid }, romG); el('rect', { x: 62, y: -4, width: 396, height: 416 }, cp);
    romG.setAttribute('clip-path', 'url(#' + kid + ')');
    // Kveldshimmel i bånd, måne og stjerner
    [['#5A8DEE', -4, 108], ['#FF9CC2', 96, 44], ['#FF5B1F', 136, 30], ['#1C1B1F', 162, 260]].forEach(([f, y, h]) => el('rect', { x: 62, y, width: 396, height: h, fill: f }, romG));
    el('circle', { cx: 400, cy: 24, r: 14, fill: '#FFE07A', stroke: B, 'stroke-width': 2.5 }, romG);
    [[90, 22], [140, 50], [210, 14], [330, 42], [280, 30], [440, 72]].forEach(([x, y]) => el('circle', { cx: x, cy: y, r: 2, fill: '#FFF8EE', class: 'stjerne' }, romG));
    // Byen bak: to lag. Bakerst lave, mørke blokker uten vinduer; foran dem høyere bygg med jevne vindusrader.
    const bygg = (x0, x1, y0, y1, bunn, topp, f) => r([I(x0, y0, bunn), I(x1, y1, bunn), I(x1, y1, topp), I(x0, y0, topp)], f, { 'stroke-width': 2.5 });
    const vinduer = (x0, x1, y0, y1, bunn, topp) => { for (let z = bunn + 14; z < topp - 10; z += 18) for (let t = 0.2; t < 0.95; t += 0.3) { const q = I(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, z); el('rect', { x: q[0] - 2, y: q[1] - 2, width: 4, height: 4, fill: '#FFE07A' }, romG); } };
    [[0.2, 1.4, 50], [1.8, 3.0, 40], [3.4, 4.4, 56], [4.8, 5.5, 44]].forEach(([a, b, h]) => bygg(a, b, -1.6, -1.6, -90, h, '#2A292E'));
    [[0.2, 1.4, 60], [1.8, 2.8, 36], [3.2, 4.4, 52], [4.8, 5.5, 46]].forEach(([a, b, h]) => bygg(-1.6, -1.6, a, b, -90, h, '#2A292E'));
    [[0.3, 1.1, 96], [1.6, 2.4, 70], [2.9, 3.9, 110], [4.3, 5.3, 84]].forEach(([a, b, h]) => { bygg(a, b, -1.1, -1.1, -90, h, '#16120F'); vinduer(a, b, -1.1, -1.1, -70, h); });
    [[0.3, 1.1, 80], [1.6, 2.6, 104], [3.1, 3.9, 66], [4.3, 5.3, 92]].forEach(([a, b, h]) => { bygg(-1.1, -1.1, a, b, -90, h, '#16120F'); vinduer(-1.1, -1.1, a, b, -70, h); });
    // Bygget vårt fortsetter nedover, med vinduer
    r([I(0, 6, 0), I(6, 6, 0), I(6, 6, -120), I(0, 6, -120)], '#2A292E');
    r([I(6, 0, 0), I(6, 6, 0), I(6, 6, -120), I(6, 0, -120)], '#16120F');
    for (let z = -34; z > -120; z -= 34) for (let i = 0.5; i < 6; i += 1) {
      r([I(i - 0.25, 6, z), I(i + 0.25, 6, z), I(i + 0.25, 6, z + 18), I(i - 0.25, 6, z + 18)], ((i * 7 + z) % 5 < 3) ? '#FFE07A' : '#3A3940', { 'stroke-width': 2 });
      r([I(6, i - 0.25, z), I(6, i + 0.25, z), I(6, i + 0.25, z + 18), I(6, i - 0.25, z + 18)], ((i * 3 + z) % 5 < 2) ? '#FFE07A' : '#3A3940', { 'stroke-width': 2 });
    }
    // Lavere nabobygg på begge sider, så det ikke blir tomt under terrassen
    const nabo = (x0, x1, y0, y1, topp) => { boks(x0, y0, -120, x1 - x0, y1 - y0, 120 + topp, '#2A292E', '#2A292E', '#16120F', romG); for (let z = -108; z < topp - 10; z += 30) for (let t = 0.25; t < 1; t += 0.5) { const q = I(x0 + (x1 - x0) * t, y1, z), q2 = I(x1, y0 + (y1 - y0) * t, z); el('rect', { x: q[0] - 3, y: q[1] - 3, width: 6, height: 6, fill: (z + t * 10) % 3 < 1.5 ? '#FFE07A' : '#3A3940' }, romG); el('rect', { x: q2[0] - 3, y: q2[1] - 3, width: 6, height: 6, fill: (z + t * 7) % 3 < 1.5 ? '#3A3940' : '#FFE07A' }, romG); } };
    nabo(-0.2, 2.6, 6.4, 8.0, -56);
    nabo(6.4, 8.0, -0.2, 2.6, -62);
    r([I(0, 6, 0), I(6, 6, 0), I(6, 6, -10), I(0, 6, -10)], B);
    r([I(6, 0, 0), I(6, 6, 0), I(6, 6, -10), I(6, 0, -10)], B);
    // Trappehuset bak dekket, med døra inn igjen (samme sted som døra inne)
    boks(4.4, -0.95, 0, 1.5, 0.95, 74, '#8A8580', '#FFF8EE', '#D9D2C5', romG);
    r([I(4.5, 0, 0), I(5.6, 0, 0), I(5.6, 0, 74), I(4.5, 0, 74)], B);
    r([I(4.58, 0, 2), I(5.52, 0, 2), I(5.52, 0, 72), I(4.58, 0, 72)], '#FFE07A', { 'stroke-width': 2 });
    const dorG = el('g', { class: 'stua-dor', style: 'cursor:pointer' }, romG);
    ref.dor = flate([I(4.5, 0, 0), I(4.5, 0.7, 0), I(4.5, 0.7, 74), I(4.5, 0, 74)], '#1C1B1F', dorG);
    ref.dorFarge = '#1C1B1F';
    const hp = I(4.5, 0.58, 36); ref.handtak = el('circle', { cx: hp[0], cy: hp[1], r: 3, fill: '#FFD23F' }, dorG);
    el('polygon', { points: pts([I(4.4, 0, 0), I(5.7, 0, 0), I(5.7, 0, 78), I(4.4, 0, 78)]), fill: 'transparent' }, dorG);
    dorG.addEventListener('click', () => { if (valg.onDor) valg.onDor(); });
    // Tredekk
    r([I(0, 0), I(6, 0), I(6, 6), I(0, 6)], '#B9773F');
    for (let i = 0.5; i < 6; i += 0.5) el('line', { x1: I(i, 0)[0], y1: I(i, 0)[1], x2: I(i, 6)[0], y2: I(i, 6)[1], stroke: B, 'stroke-width': 1.5, opacity: 0.3 }, romG);
    for (let i = 1; i < 6; i++) el('line', { x1: I(0, i)[0], y1: I(0, i)[1], x2: I(6, i)[0], y2: I(6, i)[1], stroke: B, 'stroke-width': 1.5, opacity: 0.12 }, romG);
    // Rekkverk i stedet for vegger (ikke foran trappehuset)
    const stolpe = (x, y) => r([I(x - 0.06, y - 0.06, 0), I(x + 0.06, y + 0.06, 0), I(x + 0.06, y + 0.06, 34), I(x - 0.06, y - 0.06, 34)], B, { 'stroke-width': 2 });
    for (let i = 0; i <= 6; i++) { stolpe(0, i); if (i < 4.3 || i > 5.8) stolpe(i, 0); }
    [16, 32].forEach((z) => { el('line', { x1: I(0, 6, z)[0], y1: I(0, 6, z)[1], x2: I(0, 0, z)[0], y2: I(0, 0, z)[1], stroke: B, 'stroke-width': 3.5, 'stroke-linecap': 'round' }, romG); el('line', { x1: I(0, 0, z)[0], y1: I(0, 0, z)[1], x2: I(4.3, 0, z)[0], y2: I(4.3, 0, z)[1], stroke: B, 'stroke-width': 3.5, 'stroke-linecap': 'round' }, romG); });
    // Lyslenke på tre stolper
    [[0, 6], [0, 0], [6, 0]].forEach(([x, y]) => el('line', { x1: I(x, y, 34)[0], y1: I(x, y, 34)[1], x2: I(x, y, 96)[0], y2: I(x, y, 96)[1], stroke: B, 'stroke-width': 3.5 }, romG));
    lyslenke(romG, 92);
    // Grillen i bakre hjørne
    const g0 = I(0.8, 1.0, 0);
    el('path', { d: `M${g0[0] - 8} ${g0[1]}l4 -22M${g0[0] + 8} ${g0[1]}l-4 -22`, stroke: B, 'stroke-width': 3, fill: 'none' }, romG);
    el('ellipse', { cx: g0[0], cy: g0[1] - 26, rx: 16, ry: 9, fill: '#1C1B1F', stroke: B, 'stroke-width': 3 }, romG);
    el('ellipse', { cx: g0[0], cy: g0[1] - 28, rx: 11, ry: 5, fill: '#FF5B1F', stroke: B, 'stroke-width': 2 }, romG);
    el('path', { d: `M${g0[0] - 4} ${g0[1] - 36}q4-8 0-14M${g0[0] + 4} ${g0[1] - 36}q4-8 0-14`, fill: 'none', stroke: B, 'stroke-width': 2, 'stroke-linecap': 'round', opacity: 0.6, class: 'grill-royk' }, romG);
    ref.tvTekst = null;
  }
  let tvInnhold = { etikett: T('ROMKODE', 'ROOM CODE'), kode: '····', linjer: null };
  function skjev(x, y) { return 'matrix(1,-0.5,0,1,' + x.toFixed(1) + ',' + y.toFixed(1) + ')'; }
  function tegnTv(midl) {
    const v = midl || tvInnhold;
    const tvTekst = ref.tvTekst; if (!tvTekst) return;
    tvTekst.innerHTML = '';
    const f = 'Archivo Variable, Archivo, sans-serif';
    if (v.linjer) {
      const a = I(0, 4.25, 77);
      el('text', { x: 0, y: 0, transform: skjev(a[0], a[1]), 'font-family': f, 'font-weight': 800, 'font-size': 8.5, fill: '#B5AA9D', 'letter-spacing': 1 }, tvTekst).textContent = v.etikett;
      v.linjer.forEach((l, i) => {
        const b = I(0, 4.25, 66 - i * 11.5);
        el('text', { x: 0, y: 0, transform: skjev(b[0], b[1]), 'font-family': f, 'font-weight': 800, 'font-size': 10.5, fill: '#FFE07A', 'font-stretch': '80%' }, tvTekst).textContent = l;
      });
      return;
    }
    const te = I(0, 4.05, 68), tk = I(0, 4.05, 50);
    el('text', { x: 0, y: 0, transform: skjev(te[0], te[1]), 'font-family': f, 'font-weight': 800, 'font-size': 11, fill: '#B5AA9D', 'letter-spacing': 1.5 }, tvTekst).textContent = v.etikett;
    el('text', { x: 0, y: 0, transform: skjev(tk[0], tk[1]), 'font-family': f, 'font-weight': 900, 'font-size': v.stor ? 26 : 21, fill: v.stor ? '#FF9CC2' : '#FFE07A', 'letter-spacing': 2.5, 'font-stretch': '75%' }, tvTekst).textContent = v.kode;
  }
  let tvTimer = null;
  // Et kort trykk på rommet (ikke på TV-en, lampa eller folk) åpner «Rommet»
  let romTrykk = null;
  romG.addEventListener('pointerdown', (e) => { if (e.target.closest('.stua-tv')) return; romTrykk = { x: e.clientX, y: e.clientY, t: Date.now() }; });
  romG.addEventListener('pointerup', (e) => {
    if (!romTrykk || e.target.closest('.stua-tv')) { romTrykk = null; return; }
    const ok = Date.now() - romTrykk.t < 400 && Math.hypot(e.clientX - romTrykk.x, e.clientY - romTrykk.y) < 8; romTrykk = null;
    if (ok && valg.onRom) valg.onRom();
  });
  tegnRom(valg.tema || 'stue');
  tegnTv();

  // Mørket (lampa av) ligger over alt annet, men under folk og møbler sin lysflekk
  const lag = el('g', {});
  const ting = [];
  const ny = (d, g) => { g.dataset.d = d; ting.push(g); return g; };
  const lampe = ny(6, el('g', { class: 'stua-lampe', style: 'cursor:pointer' }, lag));
  const l0 = I(0.6, 5.4, 0), l1 = I(0.6, 5.4, 62);
  const lys = el('ellipse', { cx: l1[0], cy: l1[1] + 40, rx: 70, ry: 46, fill: '#FFE07A', opacity: 0 }, lampe);
  el('line', { x1: l0[0], y1: l0[1], x2: l1[0], y2: l1[1], stroke: B, 'stroke-width': 3.5 }, lampe);
  const skjerm = el('polygon', { points: pts([[l1[0] - 14, l1[1] + 4], [l1[0] + 14, l1[1] + 4], [l1[0] + 9, l1[1] - 14], [l1[0] - 9, l1[1] - 14]]), fill: '#FFE07A', stroke: B, 'stroke-width': 3, 'stroke-linejoin': 'round' }, lampe);
  el('ellipse', { cx: l0[0], cy: l0[1], rx: 9, ry: 4, fill: B }, lampe);
  el('rect', { x: l1[0] - 18, y: l1[1] - 20, width: 36, height: 90, fill: 'transparent' }, lampe);
  const bord = ny(6.2, el('g', {}, lag));
  function tegnBord() {
    const t = uteNaa ? UTE : (TEMA[temaNaa] || TEMA.stue); bord.innerHTML = '';
    boks(2.4, 2.6, 0, 1.2, 1.2, 20, t.bord[0], t.bord[1], t.bord[2], bord);
  const a = I(2.85, 2.95, 20);
  el('rect', { x: a[0] - 5, y: a[1] - 26, width: 10, height: 26, rx: 2, fill: '#2ea873', stroke: B, 'stroke-width': 2.5 }, bord);
  el('rect', { x: a[0] - 2.5, y: a[1] - 35, width: 5, height: 10, fill: '#2ea873', stroke: B, 'stroke-width': 2.5 }, bord);
  el('rect', { x: a[0] - 5, y: a[1] - 18, width: 10, height: 7, fill: '#FFD23F', stroke: B, 'stroke-width': 2 }, bord);
  [I(3.2, 3.5, 20), I(2.8, 3.6, 20)].forEach((q) => el('path', { d: 'M' + (q[0] - 5) + ' ' + (q[1] - 15) + 'h10l-2 15h-6z', fill: '#FFE07A', stroke: B, 'stroke-width': 2.5, 'stroke-linejoin': 'round' }, bord));
  }
  // Sofaen ligger bak nesten alt (ryggen står mot veggen), så den tegnes tidlig i dybderekkefølgen
  const sofa = ny(2.8, el('g', {}, lag));
  function tegnSofa() {
    const t = uteNaa ? UTE : (TEMA[temaNaa] || TEMA.stue), f = t.sofa; sofa.innerHTML = '';
    const x0 = 0.25, y0 = 1.4;
    boks(x0, y0, 0, 1.35, 0.32, 26, f[0], f[1], f[2], sofa);              // armlenet bak
    boks(x0, y0 + 0.32, 0, 0.35, 3.0, 40, f[0], f[1], f[2], sofa);        // ryggen
    boks(x0 + 0.35, y0 + 0.32, 0, 1.0, 3.0, 16, f[3], f[1], f[2], sofa);  // setet
    for (let i = 0; i < 3; i++) { const y = y0 + 0.4 + i; flate([I(x0 + 0.45, y, 18), I(x0 + 1.3, y, 18), I(x0 + 1.3, y + 0.85, 18), I(x0 + 0.45, y + 0.85, 18)], f[0], sofa, { 'stroke-width': 2.5 }); }
    boks(x0, y0 + 3.32, 0, 1.35, 0.32, 26, f[0], f[1], f[2], sofa);       // armlenet foran
  }
  // Planta i hjørnet og parasollen ute: egne ting, så de sorteres riktig mot folk
  const planteG = ny(11, el('g', {}, lag)), parasoll = ny(8.0, el('g', {}, lag));
  function tegnTing() {
    planteG.innerHTML = ''; parasoll.innerHTML = '';
    if (uteNaa || ekstraNaa.includes('plante')) {
      const b0 = I(5.45, 5.55, 0), potte = uteNaa ? '#FFF8EE' : '#FF5B1F';
      el('path', { d: `M${b0[0] - 9} ${b0[1] - 2}h18l-3 14h-12z`, fill: potte, stroke: B, 'stroke-width': 2.5, 'stroke-linejoin': 'round' }, planteG);
      [[-10, -14, -4], [0, -22, 0], [10, -14, 4]].forEach(([dx, dz, lean]) => el('path', { d: `M${b0[0]} ${b0[1] - 2}q${dx * .6 + lean} ${dz * .5} ${dx} ${dz}q${-dx * .3} ${-dz * .2} ${-dx} ${-dz}z`, fill: '#2EA873', stroke: B, 'stroke-width': 2.5, 'stroke-linejoin': 'round' }, planteG));
    }
    if (uteNaa) {
      const p0 = I(4.4, 3.6, 0), p1 = I(4.4, 3.6, 92);
      el('line', { x1: p0[0], y1: p0[1], x2: p1[0], y2: p1[1], stroke: B, 'stroke-width': 3.5 }, parasoll);
      el('path', { d: `M${p1[0] - 64} ${p1[1] + 16}q64-52 128 0z`, fill: '#FF9CC2', stroke: B, 'stroke-width': 3, 'stroke-linejoin': 'round' }, parasoll);
      el('path', { d: `M${p1[0] - 64} ${p1[1] + 16}q16 8 32 0q16 8 32 0q16 8 32 0q16 8 32 0`, fill: '#FF9CC2', stroke: B, 'stroke-width': 3, 'stroke-linejoin': 'round' }, parasoll);
      el('path', { d: `M${p1[0] - 22} ${p1[1] + 10}q22-32 44 0`, fill: 'none', stroke: B, 'stroke-width': 2 }, parasoll);
    }
  }
  tegnBord(); tegnSofa(); tegnTing();
  const morke = el('polygon', { points: pts([I(0, 0, 100), I(6, 0, 100), I(6, 0, 0), I(6, 6, 0), I(6, 6, -16), I(0, 6, -16), I(0, 6, 100)]), fill: '#0b0a14', opacity: 0, 'pointer-events': 'none' });
  // Lampa: trykk for å slå lyset av og på (bare på denne skjermen)
  let mork = false;
  lampe.addEventListener('click', () => {
    mork = !mork;
    const o = { v: new Verdi(mork ? 0 : 1, RASK), steg(dt) { const r = this.v.tikk(dt); const x = Math.max(0, Math.min(1, this.v.v)); morke.setAttribute('opacity', (x * 0.55).toFixed(3)); lys.setAttribute('opacity', (x * 0.35).toFixed(3)); return r; } };
    o.v.mal = mork ? 1 : 0; if (REDUSERT) { o.v.v = o.v.mal; o.steg(0); } else start(o);
    skjerm.setAttribute('fill', mork ? '#FFF3B8' : '#FFE07A');
    svg.appendChild(morke); svg.appendChild(lag);   // lyset fra lampa og folk ligger over mørket
  });

  /* ---------- folk ---------- */
  const folk = [];
  const kart = new Map();
  let sist = '';
  // Tegnerekkefølge etter dybde. Den som holdes, flyttes aldri i DOM-en (det ville sluppet grepet):
  // den ligger øverst mens den dras, og de andre sorteres under den.
  function sorter() {
    const holdt = folk.find((f) => f.drar);
    const r = ting.filter((t) => !holdt || t !== holdt.g).sort((x, y) => x.dataset.d - y.dataset.d);
    const k = (holdt ? 'h' + ting.indexOf(holdt.g) + ':' : '') + r.map((t) => ting.indexOf(t)).join(',');
    if (k === sist) return; sist = k;
    if (holdt) r.forEach((t) => lag.insertBefore(t, holdt.g)); else r.forEach((t) => lag.appendChild(t));
  }
  function punkt(e) { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); }

  function Figur(p, x, y, info) {
    this.p = Object.assign({}, p); this.info = info || {};
    this.g = ny(x + y, el('g', { class: 'figur lever', 'data-id': this.info.id || '' }, lag));
    // Hver figur blunker i sin egen takt
    this.g.style.setProperty('--d', (hash(String(this.info.id || x + ',' + y)) % 4000) + 'ms');
    this.hjem = [x, y];
    this.x = new Verdi(x); this.y = new Verdi(y); this.z = new Verdi(0, RASK); this.s = new Verdi(1, RASK); this.r = new Verdi(0);
    this.vei = []; this.drar = false; this.ut = false;
    this.tegnHtml(); this.tegn(); dra(this); this.planleggRusling(); this.planleggVane();
  }
  /* ---------- kroppsspråk: bevegelser og ansikt ----------
     En bevegelse er en klasse på figuren (m-skal, m-latter …) som CSS-en i stua.css spiller av én gang.
     Klassen tas bort etterpå, så den samme bevegelsen kan spilles igjen. Ansiktet (u-glad, u-rodme …) byttes ut imens. */
  const BEVEG_MS = { 'm-skal': 1300, 'm-latter': 1000, 'm-hopp': 800, 'm-skvett': 800, 'm-klapp': 1100, 'm-hjerte': 1600, 'm-kvalm': 1600, 'm-full': 1700, 'm-gjem': 1600, 'm-rock': 1500,
    'm-vink': 1400, 'm-dans': 1700, 'm-snurr': 1000, 'm-bukk': 1200, 'm-gitar': 1600, 'm-moon': 1700, 'm-slurk': 1600, 'm-ooh': 1500, 'm-trekk': 1100, 'm-sulk': 1300, 'm-besvim': 1500 };
  let sistAktiv = Date.now();
  Figur.prototype.beveg = function (klasse, ansikt, ms) {
    if (!klasse || !this.g.isConnected) return;
    sistAktiv = Date.now();
    const g = this.g, alle = Array.from(g.classList).filter((c) => /^(m|u|v)-/.test(c));
    alle.forEach((c) => g.classList.remove(c));
    clearTimeout(this.bevegT);
    // Et lite pust mellom to like bevegelser, så CSS-en starter på nytt
    void g.getBoundingClientRect();
    g.classList.add(klasse); (ansikt || []).forEach((c) => g.classList.add(c));
    const varer = ms || BEVEG_MS[klasse] || 1200;
    this.bevegT = setTimeout(() => { g.classList.remove(klasse); (ansikt || []).forEach((c) => g.classList.remove(c)); }, varer);
  };
  Figur.prototype.ansikt = function (klasser, ms) {
    const g = this.g; (klasser || []).forEach((c) => g.classList.add(c));
    clearTimeout(this.ansiktT); this.ansiktT = setTimeout(() => (klasser || []).forEach((c) => g.classList.remove(c)), ms || 1500);
  };
  // Blikket: pupillene ser mot en annen i rommet
  Figur.prototype.seMot = function (annen, ms) {
    const pup = this.g.querySelector('.pupiller'); if (!pup) return;
    if (annen && annen !== this) {
      const dx = (annen.x.v - annen.y.v) - (this.x.v - this.y.v), dy = (annen.x.v + annen.y.v) - (this.x.v + this.y.v);
      pup.style.transform = 'translate(' + (Math.sign(dx) * 2) + 'px,' + (Math.sign(dy) * 1.2 - 0.6) + 'px)';
    } else pup.style.transform = '';
    clearTimeout(this.blikkT); if (annen) this.blikkT = setTimeout(() => { pup.style.transform = ''; }, ms || 2600);
  };
  // Hvilevaner: hver figur har sin egen lille greie når ingenting skjer – sjelden, så det ikke maser
  const VANER = ['v-gjesp', 'v-tlf', 'v-klo', 'v-nynn'];
  Figur.prototype.planleggVane = function () {
    if (REDUSERT) return;
    clearTimeout(this.vaneT);
    this.vaneT = setTimeout(() => {
      if (!svg.isConnected) return;
      if (!this.drar && !document.hidden && !/(^| )m-/.test(this.g.className.baseVal || '')) this.beveg(VANER[hash(String(this.info.id || this.hjem.join())) % VANER.length], [], 2300);
      this.planleggVane();
    }, 22000 + Math.random() * 18000);
  };
  Figur.prototype.tegnHtml = function () {
    this.g.innerHTML = figurHtml(this.p, this.info.pynt) + (valg.navn && this.info.navn
      ? `<text class="stua-navn" y="17" text-anchor="middle" font-family="Archivo Variable, Archivo, sans-serif" font-weight="850" font-size="11" fill="${B}" stroke="#FFF8EE" stroke-width="4" paint-order="stroke" stroke-linejoin="round">${esc(this.info.navn)}</text>` : '');
    this.kropp = this.g.querySelector('.kropp'); this.skygge = this.g.querySelector('.skygge'); this.boble = this.g.querySelector('.boble-plass');
  };
  Figur.prototype.tegn = function () {
    const p = I(this.x.v, this.y.v, 0), z = this.z.v, s = this.s.v;
    this.g.setAttribute('transform', 'translate(' + p[0].toFixed(1) + ',' + p[1].toFixed(1) + ')');
    this.kropp.setAttribute('transform', 'translate(0,' + (-z).toFixed(1) + ') rotate(' + this.r.v.toFixed(2) + ') scale(' + (2 - s).toFixed(3) + ',' + s.toFixed(3) + ')');
    this.skygge.setAttribute('rx', (16 - Math.min(8, z * 0.25)).toFixed(1));
    // I sofaen tegnes man foran sofaen (den ligger som én bit i dybderekkefølgen)
    this.g.dataset.d = this.x.v + this.y.v;
  };
  Figur.prototype.steg = function (dt) {
    if (this.vei.length && !this.drar) {
      const m = this.vei[0]; this.x.mal = m[0]; this.y.mal = m[1];
      const igjen = Math.hypot(this.x.v - m[0], this.y.v - m[1]);
      if (igjen < 0.25 && this.vei.length > 1) this.vei.shift();
      else if (this.vei.length === 1 && igjen < 0.05) {
        this.vei.shift(); this.s.v = 0.88;
        if (this.ut) { fjern(this); return true; }
      }
      this.z.mal = Math.min(10, Math.hypot(this.x.fart, this.y.fart) * 3.2);
    } else if (!this.drar) this.z.mal = paaSofa(this.hjem) ? SETE_HOYDE : 0;
    const ro = [this.x, this.y, this.z, this.s, this.r].map((v) => v.tikk(dt)).every(Boolean);
    this.tegn(); sorter();
    return ro && !this.vei.length && !this.drar;
  };
  Figur.prototype.gaaTil = function (mal, viaDor) {
    this.x.f = this.y.f = MYK;
    this.vei = viaDor ? [[4.0, 1.0], mal] : [mal];
    if (REDUSERT) { this.x.v = this.x.mal = mal[0]; this.y.v = this.y.mal = mal[1]; this.vei = []; this.tegn(); sorter(); return; }
    start(this);
  };
  // Litt rusling: et lite steg rundt plassen sin, med jevne mellomrom
  Figur.prototype.planleggRusling = function () {
    if (!valg.vandre || REDUSERT || paaSofa(this.hjem)) return;
    clearTimeout(this.ruslT);
    this.ruslT = setTimeout(() => {
      if (!svg.isConnected) return;
      if (!this.drar && !this.vei.length && !document.hidden) {
        let x, y, n = 0;
        do { x = this.hjem[0] + (Math.random() - 0.5) * 1.1; y = this.hjem[1] + (Math.random() - 0.5) * 1.1; } while (!ledig(x, y) && ++n < 8);
        if (ledig(x, y)) { this.x.f = this.y.f = ROLIG; this.vei = [[x, y]]; start(this); }
      }
      this.planleggRusling();
    }, 5000 + Math.random() * 7000);
  };
  Figur.prototype.si = function (tekst, ms) {
    if (!this.boble) return;
    const w = Math.max(30, tekst.length * 6.4 + 14);
    this.boble.innerHTML = `<g transform="translate(0,-92)"><rect x="${-w / 2}" y="-15" width="${w}" height="22" rx="4" fill="#FFF8EE" stroke="${B}" stroke-width="2.5"/>` +
      `<path d="M-5 7l5 7 5-7" fill="#FFF8EE" stroke="${B}" stroke-width="2.5" stroke-linejoin="round"/><path d="M-4 5.5h8" stroke="#FFF8EE" stroke-width="3"/>` +
      `<text y="1" text-anchor="middle" font-family="Archivo Variable, Archivo, sans-serif" font-weight="850" font-size="11" fill="${B}">${esc(tekst)}</text></g>`;
    clearTimeout(this.bobleT); this.bobleT = setTimeout(() => { if (this.boble) this.boble.innerHTML = ''; }, ms || 1600);
  };
  Figur.prototype.svimmel = function () {
    if (this.erSvimmel) return; this.erSvimmel = true;
    const gml = this.p.oyne; this.p.oyne = 'svimmel'; this.tegnHtml(); this.tegn();
    setTimeout(() => { this.p.oyne = gml; this.erSvimmel = false; if (this.g.isConnected) { this.tegnHtml(); this.tegn(); } }, 2200);
  };
  function fjern(f) {
    const i = folk.indexOf(f); if (i !== -1) folk.splice(i, 1);
    const j = ting.indexOf(f.g); if (j !== -1) ting.splice(j, 1);
    if (f.info.id) kart.delete(f.info.id);
    clearTimeout(f.ruslT); clearTimeout(f.vaneT); clearTimeout(f.bevegT); f.g.remove(); aktive.delete(f);
  }

  const SI_LOFT = en ? ['Wheee!', 'Put me down!', 'Hey!', 'Not again …', 'Careful!'] : ['Wheee!', 'Slipp meg!', 'Hei!', 'Ikke igjen …', 'Forsiktig!'];
  const SI_DOR = en ? ['Not leaving yet!', 'The vors isn’t over!'] : ['Går ikke ennå!', 'Vorset er ikke over!'];
  function dra(f) {
    let forrige = null, fra = null, risting = 0;
    // På mobil: et trykk på en person låser siden, så den ikke ruller mens du drar
    f.g.addEventListener('touchstart', (e) => { if (valg.kanDra !== false) e.preventDefault(); }, { passive: false });
    f.g.addEventListener('touchmove', (e) => { if (f.drar) e.preventDefault(); }, { passive: false });
    f.g.addEventListener('pointerdown', (e) => {
      if (valg.kanDra === false) return;
      e.preventDefault();
      if (lag.lastChild !== f.g) lag.appendChild(f.g);   // øverst mens den holdes – før grepet tas
      sist = '';
      f.g.setPointerCapture(e.pointerId);
      f.drar = true; f.vei = []; forrige = punkt(e); fra = [f.x.v, f.y.v]; risting = 0; f.trykkT = Date.now();
      f.x.f = f.y.f = MYK; f.z.mal = 26; f.s.mal = 1.06; start(f);
      document.documentElement.classList.add('stua-drar');
      if (f.info.id && f.info.id !== valg.meg) f.si(SI_LOFT[Math.random() * SI_LOFT.length | 0]);
    });
    f.g.addEventListener('pointermove', (e) => {
      if (!f.drar) return;
      const q = punkt(e), a = (q.x - 260) / 30, b = (q.y + 35 - 112) / 15;
      f.x.mal = Math.max(0.4, Math.min(5.6, (a + b) / 2)); f.y.mal = Math.max(0.4, Math.min(5.7, (b - a) / 2));
      const dx = q.x - forrige.x; f.r.mal = Math.max(-14, Math.min(14, dx * 1.4)); forrige = q;
      // Ristes noen hardt fram og tilbake, blir de svimle
      risting = risting * 0.9 + Math.abs(dx); if (risting > 120) { risting = 0; f.svimmel(); }
      start(f);
    });
    function slipp() {
      if (!f.drar) return;
      f.drar = false; f.z.mal = 0; f.r.mal = 0; f.s.mal = 1; f.s.v = 0.9; start(f);
      document.documentElement.classList.remove('stua-drar');
      if (valg.onFerdig) setTimeout(valg.onFerdig, 0);
      const x = f.x.mal, y = f.y.mal;
      // Til døra? Ingen går hjem før vorset er over
      if (x > 4.3 && y < 1.1) { f.si(SI_DOR[Math.random() * SI_DOR.length | 0], 1800); f.gaaTil(f.hjem); return; }
      if (Math.hypot(x - fra[0], y - fra[1]) < 0.15) { if (Date.now() - f.trykkT < 400 && valg.onTrykk) valg.onTrykk(f.info.id); return; }
      let mal = [x, y];
      // Sluppet i sofaen: sett deg ned på setet
      if (paaSofa([x, y])) { mal = [1.0, Math.max(1.9, Math.min(4.5, y))]; f.gaaTil(mal); }
      else if (!ledig(x, y)) { mal = naermesteLedig(x, y); f.gaaTil(mal); }
      f.hjem = mal; f.planleggRusling();
      if (valg.onSlipp && f.info.id) valg.onSlipp(f.info.id, +mal[0].toFixed(2), +mal[1].toFixed(2));
    }
    f.g.addEventListener('pointerup', slipp); f.g.addEventListener('pointercancel', slipp);
    f.g.addEventListener('lostpointercapture', slipp);
    f.slipp = slipp;
  }
  // Sikkerhetsnett: slippes fingeren et annet sted (eller nettleseren mister den), slipper vi personen likevel,
  // så rommet aldri blir stående og vente på et drag som er over
  function slippAlle() { folk.forEach((f) => { if (f.drar && f.slipp) f.slipp(); }); }
  ['pointerup', 'pointercancel', 'touchend', 'touchcancel', 'blur'].forEach((t) => window.addEventListener(t, () => setTimeout(slippAlle, 0)));
  function naermesteLedig(x, y) {
    let best = null, bd = 1e9;
    for (let gx = 0.5; gx <= 5.5; gx += 0.25) for (let gy = 0.5; gy <= 5.6; gy += 0.25) {
      if (!ledig(gx, gy)) continue; const d = Math.hypot(gx - x, gy - y); if (d < bd) { bd = d; best = [gx, gy]; }
    }
    return best || [1, 1];
  }
  let dorTid = null;
  function aapneDor() {
    ref.dor.setAttribute('opacity', 0); ref.handtak.setAttribute('opacity', 0); clearTimeout(dorTid);
    dorTid = setTimeout(() => { ref.dor.setAttribute('opacity', 1); ref.handtak.setAttribute('opacity', 1); }, 900);
  }
  function hopp() { if (REDUSERT) return; folk.forEach((o, n) => { if (!o.drar) setTimeout(() => { o.z.fart = 90; start(o); }, 120 + n * 40); }); }
  function ledigPlass() {
    const opptatt = folk.map((f) => f.hjem);
    return PLASSER.find((p) => !opptatt.some((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) < 0.4)) || naermesteLedig(1 + Math.random() * 4, 1 + Math.random() * 4);
  }

  /* ---------- forsiden: tre faste, og en anonym gjest per bokstav ---------- */
  let antGjester = 0;
  if (valg.demo) {
    folk.push(new Figur(START[0], 0.9, 3.0, { pynt: { hode: 'partyhatt' } }), new Figur(START[1], 3.8, 1.2, { pynt: { ansikt: 'solbriller' } }), new Figur(START[2], 2.1, 4.9, { pynt: { venn: 'hund' } }));
    sorter();
  }
  function nyGjest() {
    const i = antGjester % GJESTER.length; antGjester++;
    if (folk.length >= 3 + GJESTER.length) fjern(folk[3]);
    const mal = PLASSER[3 + i], f = new Figur(GJESTER[i], DOR[0], DOR[1]);
    f.hjem = mal; folk.push(f); aapneDor(); hopp(); f.gaaTil(mal, true);
  }

  /* ---------- rommet: ekte spillere, med plasser fra serveren ---------- */
  let forste = true;
  function settFolk(spillere, pos) {
    pos = pos || {};
    const ider = new Set(spillere.map((p) => p.id));
    // De som har gått: ut døra
    folk.slice().forEach((f) => { if (f.info.id && !ider.has(f.info.id) && !f.ut) { f.ut = true; aapneDor(); f.gaaTil(DOR, false); f.vei = [[4.0, 1.0], DOR]; } });
    let nye = 0;
    spillere.forEach((p) => {
      let f = kart.get(p.id);
      const lagret = Array.isArray(pos[p.id]) ? pos[p.id] : null;
      if (!f) {
        const mal = lagret || ledigPlass();
        if (forste) f = new Figur(utseende(p.figur || p.id, p.pynt), mal[0], mal[1], { id: p.id, navn: p.navn, pynt: p.pynt || null });
        else { f = new Figur(utseende(p.figur || p.id, p.pynt), DOR[0], DOR[1], { id: p.id, navn: p.navn, pynt: p.pynt || null }); f.hjem = mal; setTimeout(() => f.gaaTil(mal, true), nye * 500); nye++; }
        f.hjem = mal; kart.set(p.id, f); folk.push(f);
        if (!forste && p.id !== valg.meg) setTimeout(() => f.si(T('Hei!', 'Hi!'), 1400), 900 + nye * 500);
        return;
      }
      if (f.info.navn !== p.navn || JSON.stringify(f.info.pynt || null) !== JSON.stringify(p.pynt || null)) { f.info.navn = p.navn; f.info.pynt = p.pynt || null; f.tegnHtml(); f.tegn(); }
      // Noen har flyttet personen på en annen skjerm: gå dit
      if (lagret && !f.drar && Math.hypot(lagret[0] - f.hjem[0], lagret[1] - f.hjem[1]) > 0.05) { f.hjem = lagret; f.gaaTil(lagret); }
    });
    if (nye) { aapneDor(); hopp(); sistAktiv = Date.now(); }
    forste = false; sorter();
  }
  function personSi(id, tekst, ms) { const f = kart.get(id); if (f) f.si(tekst, ms); }
  /* ---------- rommet lever ---------- */
  // Reaksjonene: emoji → bevegelse og ansikt. De tre første smitter: de andre gjør det samme like etter.
  const REAK_BEVEG = { '🍻': ['m-skal', ['u-glad'], true], '😂': ['m-latter', ['u-glad', 'u-bred'], true], '🔥': ['m-hopp', ['u-bred']], '😱': ['m-skvett', ['u-o']], '👏': ['m-klapp', ['u-glad'], true],
    '😍': ['m-hjerte', ['u-hjerte', 'u-rodme']], '🤢': ['m-kvalm', ['u-gronn', 'u-kinn']], '🥴': ['m-full', ['u-spiral', 'u-bred']], '🙈': ['m-gjem', ['u-rodme']], '🤘': ['m-rock', ['u-bred']] };
  let dansere = [], discoT = null;
  function reaksjon(id, emoji, bevegId) {
    const f = kart.get(id); if (!f) return;
    sistAktiv = Date.now();
    if (bevegId) { f.beveg('m-' + bevegId, ['u-glad']); if (bevegId === 'dans') dans(f); folk.forEach((o) => { if (o !== f) o.seMot(f); }); return; }
    const r = REAK_BEVEG[emoji]; if (!r) return;
    f.beveg(r[0], r[1]);
    folk.forEach((o) => { if (o !== f) o.seMot(f); });
    if (r[2] && !REDUSERT) folk.filter((o) => o !== f && !o.drar).forEach((o, i) => setTimeout(() => o.beveg(r[0], r[1]), 240 + i * 90));
  }
  // Habbo-nikket: danser to samtidig, kommer diskokula ned – og hele rommet blir med
  function dans(f) {
    const naa = Date.now(); dansere = dansere.filter((d) => naa - d.t < 3000 && d.f !== f).concat([{ f, t: naa }]);
    if (dansere.length >= 2) disco();
  }
  let discoG = null;
  function lagDisco() {
    if (discoG) return;
    {
      discoG = el('g', { class: 'stua-disco' }, lag); discoG.dataset.d = 0;
      const t = I(3, 3, 112);
      el('line', { x1: t[0], y1: t[1] - 60, x2: t[0], y2: t[1], stroke: B, 'stroke-width': 3 }, discoG);
      el('circle', { cx: t[0], cy: t[1] + 14, r: 15, fill: '#FFF8EE', stroke: B, 'stroke-width': 3, class: 'disco-kule' }, discoG);
      [[-7, -7], [0, -9], [7, -7], [-9, 0], [9, 0], [-7, 7], [0, 9], [7, 7], [0, 0]].forEach(([x, y]) => el('rect', { x: t[0] + x - 3, y: t[1] + 14 + y - 3, width: 6, height: 6, fill: '#C9CFD8', stroke: B, 'stroke-width': 1 }, discoG));
      el('polygon', { points: pts([I(0, 0), I(6, 0), I(6, 6), I(0, 6)]), fill: '#7CC6FE', opacity: 0.28, class: 'disco-lys', 'pointer-events': 'none' }, discoG);
      lag.insertBefore(discoG, lag.firstChild);
    }
  }
  function disco(ms) {
    if (REDUSERT) return;
    sistAktiv = Date.now();
    lagDisco();
    discoG.classList.add('paa');
    folk.forEach((f, i) => { if (!f.drar) setTimeout(() => f.beveg('m-dans', ['u-glad'], (ms || 6000) - i * 120), i * 120); });
    clearTimeout(discoT); discoT = setTimeout(() => { if (discoG) discoG.classList.remove('paa'); }, ms || 6000);
  }
  // Spillet styrer ansiktet: det som skjer deg, vises på figuren – og de andre reagerer som et publikum
  function hendelse(type, ider) {
    ider = ider || [];
    const mine = ider.map((id) => kart.get(id)).filter(Boolean), andre = folk.filter((f) => !mine.includes(f));
    if (!mine.length) return;
    sistAktiv = Date.now();
    if (type === 'drikk') { mine.forEach((f) => f.beveg('m-slurk', ['u-kinn'])); const l = andre[hash(String(Date.now())) % Math.max(1, andre.length)]; if (l) setTimeout(() => l.beveg('m-latter', ['u-glad', 'u-bred']), 500); }
    if (type === 'bom') { mine.forEach((f) => f.beveg('m-skvett', ['u-o', 'u-rodme', 'u-svette'], 2200)); andre.forEach((f, i) => { f.seMot(mine[0]); setTimeout(() => f.beveg(i % 3 === 1 ? 'm-latter' : 'm-ooh', i % 3 === 1 ? ['u-glad', 'u-bred'] : ['u-o']), 150 + i * 60); }); }
    if (type === 'pekt') { mine.forEach((f) => f.beveg('m-skvett', ['u-rodme', 'u-svette', 'u-o'], 2200)); andre.forEach((f) => f.seMot(mine[0])); }
    if (type === 'vinner') { mine.forEach((f) => f.beveg('m-trekk', ['u-glad'])); andre.forEach((f, i) => setTimeout(() => f.beveg('m-klapp', ['u-glad']), 80 * i)); }
  }
  // Pallen når kvelden er over: vinneren hopper opp på bordet og danser, sistemann besvimer, resten klapper
  function pall(vinnerId, taperId) {
    const v = kart.get(vinnerId), t = kart.get(taperId);
    sistAktiv = Date.now();
    if (v) { v.hjem = [2.9, 3.3]; v.vei = []; v.x.mal = 2.9; v.y.mal = 3.3; v.gaaTil([2.9, 3.3]); setTimeout(() => { v.z.mal = 20; v.g.classList.add('vinner'); v.beveg('m-dans', ['u-glad'], 60000); }, REDUSERT ? 0 : 900); }
    if (t && t !== v) setTimeout(() => t.beveg('m-besvim', ['u-spiral'], 60000), 1200);
    folk.filter((f) => f !== v && f !== t).forEach((f, i) => setTimeout(() => f.beveg('m-klapp', ['u-glad'], 2400), 1400 + i * 90));
  }
  // Har ingenting skjedd på to minutter, gjesper alle – et hint til verten
  const gjespT = setInterval(() => {
    if (!svg.isConnected) { clearInterval(gjespT); return; }
    if (REDUSERT || document.hidden || Date.now() - sistAktiv < 120000) return;
    sistAktiv = Date.now();
    folk.forEach((f, i) => setTimeout(() => f.beveg('v-gjesp', [], 2300), i * 400));
  }, 15000);
  function tegnAlt() {
    tegnTv(); tegnBord(); tegnSofa(); tegnTing();
    lampe.style.display = uteNaa ? 'none' : '';
    if (stilNaa.lys === 'diskokule' && !REDUSERT) lagDisco();
    if (discoG) discoG.classList.toggle('fast', stilNaa.lys === 'diskokule' && !uteNaa);
    svg.appendChild(morke); svg.appendChild(lag);
  }
  function straff(id, tekst) {
    const f = kart.get(id); if (!f) return;
    f.si(tekst, 2600); f.svimmel();
    if (!REDUSERT) { f.z.fart = 140; start(f); }
  }

  return {
    nyGjest, settFolk, personSi, straff, reaksjon, hendelse, pall, disco,
    /** Bytt hvem som vises (inne/ute) uten at noen går gjennom døra */
    bytt(spillere, pos) { folk.slice().forEach(fjern); forste = true; settFolk(spillere, pos); },
    kode(k) { tvInnhold = { etikett: T('ROMKODE', 'ROOM CODE'), kode: k, linjer: null }; tegnTv(); },
    /** Kortet eller spørsmålet som spilles nå, på TV-en i stua (tre linjer, kuttet pent) */
    tv(tekst, etikett) {
      if (!tekst) return;
      const ord = String(tekst).replace(/\s+/g, ' ').trim().split(' '), linjer = [];
      let l = '';
      ord.forEach((w) => { if ((l + ' ' + w).trim().length > 17) { linjer.push(l); l = w; } else l = (l + ' ' + w).trim(); });
      if (l) linjer.push(l);
      if (linjer.length > 3) { linjer.length = 3; linjer[2] = linjer[2].replace(/\s*\S*$/, '') + ' …'; }
      tvInnhold = { etikett: String(etikett || '').toUpperCase().slice(0, 18), linjer };
      tegnTv();
    },
    tvKode() { tegnTv(); },
    /** Bytt hvordan stua ser ut (stue, hytte, takterrasse, julebord). Folka blir stående. */
    tema(id) { if ((TEMA[id] ? id : 'stue') === temaNaa) return; tegnRom(id); tegnAlt(); },
    /** Små ting i rommet (lys, plante, plakat, platespiller) */
    ekstra(liste) { liste = Array.isArray(liste) ? liste : []; if (liste.slice().sort().join() === ekstraNaa.slice().sort().join()) return; tegnRom(temaNaa, liste); tegnAlt(); },
    /** Inne i stua, eller ute på takterrassen. Folka som vises, velger den som kaller settFolk. */
    scene(ute) { ute = !!ute; if (ute === uteNaa) return; uteNaa = ute; svg.setAttribute('viewBox', ute ? '62 -4 396 416' : '62 -4 396 326'); tegnRom(temaNaa); tegnAlt(); },
    /** Gulv og lys (fliser/disko, lampe/lys/diskokule) */
    stil(st) { st = st || {}; const gulv = st.gulv === 'disko' ? 'disko' : 'fliser', lys = ['lys', 'diskokule'].includes(st.lys) ? st.lys : 'lampe'; if (gulv === stilNaa.gulv && lys === stilNaa.lys) return; stilNaa = { gulv, lys }; tegnRom(temaNaa); tegnAlt(); },
    temaNaa() { return temaNaa; },
    uteNaa() { return uteNaa; },
  };
}
/** Løkkende animasjoner (disko, lys, blunk) følger sideklokka. Flyttes stua i DOM-en, fortsetter de der de var. */
export function synkAnimasjoner(el) {
  if (!el || !el.getAnimations || typeof document === 'undefined' || !document.timeline) return;
  const t = document.timeline.currentTime; if (t == null) return;
  el.getAnimations({ subtree: true }).forEach((a) => {
    try { const tm = a.effect && a.effect.getTiming(); if (tm && tm.iterations === Infinity && a.playState === 'running' && Math.abs((a.currentTime || 0) - t) > 1) a.currentTime = t; } catch (e) {}
  });
}
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

// Forsidens skript (inline) bruker disse
if (typeof window !== 'undefined') {
  window.mvFjaer = fjaer; window.mvFigur = figurHtml; window.mvHode = hodeSvg;
}
