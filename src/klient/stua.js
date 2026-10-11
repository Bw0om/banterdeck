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
};
export function figurHtml(p) {
  return `<ellipse class="skygge" cx="0" cy="0" rx="16" ry="5" fill="${B}" opacity=".22"/><g class="kropp">` +
    `<rect x="-10" y="-15" width="7" height="15" rx="2" fill="${B}"/><rect x="3" y="-15" width="7" height="15" rx="2" fill="${B}"/>` +
    `<rect x="-14" y="-42" width="28" height="30" rx="9" fill="${p.topp}" stroke="${B}" stroke-width="3"/>` +
    `<rect x="7" y="-34" width="10" height="15" rx="2.5" fill="${B}"/><rect x="9" y="-32" width="6" height="9" rx="1" fill="#FFE07A"/>` +
    `<circle cx="0" cy="-56" r="15" fill="${p.hud}" stroke="${B}" stroke-width="3"/>` +
    `<circle cx="-9" cy="-51" r="3" fill="#FF5B1F" opacity=".35"/><circle cx="9" cy="-51" r="3" fill="#FF5B1F" opacity=".35"/>` +
    HAAR[p.haar].replace(/\{h\}/g, p.h) + OYNE[p.oyne] + MUNN[p.munn] + '<g class="boble-plass"></g></g>';
}
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
export function utseende(id) {
  const h = hash(String(id)), v = (n, s) => (h >>> s) % n;
  let topp = TOPP[v(TOPP.length, 0)], har = HAARF[v(HAARF.length, 5)];
  if (har === topp) har = B;
  return { topp, hud: HUD[v(HUD.length, 9)], h: har, haar: HAARTYPE[v(HAARTYPE.length, 13)], oyne: OYETYPE[v(OYETYPE.length, 17)], munn: MUNNTYPE[v(MUNNTYPE.length, 21)] };
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
const PLASSER = [[0.9, 3.0], [3.8, 1.2], [2.1, 4.9], [3.4, 5.3], [1.1, 1.2], [4.2, 5.5], [2.0, 1.0], [1.0, 4.1], [3.3, 0.8], [0.9, 2.0],
  [2.7, 5.6], [1.7, 3.4], [4.0, 4.4], [5.0, 5.6], [1.6, 5.6], [2.9, 1.9]];
function ledig(x, y) {
  if (x > 2.2 && x < 3.8 && y > 2.4 && y < 4.0) return false;   // bordet
  if (x > 4.3 && y > 1.3 && y < 5.3) return false;              // sofaen
  if (x < 1.0 && y > 5.0) return false;                         // lampa
  return x > 0.4 && x < 5.6 && y > 0.4 && y < 5.7;
}
const DOR = [5.05, 0.25];

/**
 * Tegner stua i en tom <svg> og gir tilbake et lite API.
 * valg: { lang, navn (vis navnelapper), vandre, demo (forsidens tre faste + anonyme gjester), meg,
 *         onSlipp(id, x, y) (når noen slippes et nytt sted), tekster }
 */
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
  // Gulv, vegger, vindu, plakat og dør
  flate([I(0, 6, 0), I(6, 6, 0), I(6, 6, -16), I(0, 6, -16)], B);
  flate([I(6, 0, 0), I(6, 6, 0), I(6, 6, -16), I(6, 0, -16)], B);
  flate([I(0, 0), I(6, 0), I(6, 6), I(0, 6)], '#FFD23F');
  for (let i = 1; i < 6; i++) el('line', { x1: I(i, 0)[0], y1: I(i, 0)[1], x2: I(i, 6)[0], y2: I(i, 6)[1], stroke: B, 'stroke-width': 1.5, opacity: 0.18 });
  flate([I(1.3, 1.6), I(4.3, 1.6), I(4.3, 4.6), I(1.3, 4.6)], '#FF9CC2');
  flate([I(1.7, 2.0), I(3.9, 2.0), I(3.9, 4.2), I(1.7, 4.2)], 'none', null, { 'stroke-dasharray': '6 6', 'stroke-width': 2.5 });
  flate([I(0, 0, 0), I(0, 6, 0), I(0, 6, 100), I(0, 0, 100)], '#63E2A8');
  flate([I(0, 0, 0), I(6, 0, 0), I(6, 0, 100), I(0, 0, 100)], '#FFF8EE');
  flate([I(0.9, 0, 40), I(2.6, 0, 40), I(2.6, 0, 86), I(0.9, 0, 86)], '#1C1B1F');
  el('line', { x1: I(1.75, 0, 40)[0], y1: I(1.75, 0, 40)[1], x2: I(1.75, 0, 86)[0], y2: I(1.75, 0, 86)[1], stroke: '#FFF8EE', 'stroke-width': 3 });
  const mp = I(2.2, 0, 72); el('circle', { cx: mp[0], cy: mp[1], r: 7, fill: '#FFE07A', stroke: B, 'stroke-width': 2.5 });
  let sp = I(1.25, 0, 64); el('circle', { cx: sp[0], cy: sp[1], r: 1.8, fill: '#FFF8EE' }); sp = I(1.5, 0, 78); el('circle', { cx: sp[0], cy: sp[1], r: 1.5, fill: '#FFF8EE' });
  flate([I(3.0, 0, 44), I(3.9, 0, 44), I(3.9, 0, 88), I(3.0, 0, 88)], '#FF5B1F');
  const pp = I(3.45, 0, 66); el('circle', { cx: pp[0], cy: pp[1], r: 8, fill: '#FFD23F', stroke: B, 'stroke-width': 2.5 });
  flate([I(4.5, 0, 0), I(5.6, 0, 0), I(5.6, 0, 74), I(4.5, 0, 74)], B);
  const dor = flate([I(4.5, 0, 0), I(5.6, 0, 0), I(5.6, 0, 74), I(4.5, 0, 74)], '#FF5B1F');
  const hp = I(5.35, 0, 36), handtak = el('circle', { cx: hp[0], cy: hp[1], r: 3, fill: B });
  // TV-en på venstre vegg: viser romkoden, eller kortet som spilles nå
  const tvG = el('g', { class: 'stua-tv', style: 'cursor:pointer' });
  flate([I(0, 4.6, 32), I(0, 1.4, 32), I(0, 1.4, 88), I(0, 4.6, 88)], B, tvG);
  flate([I(0, 4.4, 36), I(0, 1.6, 36), I(0, 1.6, 84), I(0, 4.4, 84)], '#2A292E', tvG, { stroke: 'none' });
  const tvTekst = el('g', {}, tvG);
  let tvInnhold = { etikett: T('ROMKODE', 'ROOM CODE'), kode: '····', linjer: null };
  function skjev(x, y) { return 'matrix(1,-0.5,0,1,' + x.toFixed(1) + ',' + y.toFixed(1) + ')'; }
  function tegnTv(midl) {
    const v = midl || tvInnhold;
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
  tegnTv();
  let tvTimer = null;
  tvG.addEventListener('click', () => {
    clearTimeout(tvTimer); tegnTv({ etikett: T('ALLE SAMMEN', 'EVERYBODY'), kode: T('SKÅL!', 'CHEERS!'), stor: true });
    folk.forEach((f, n) => { if (!f.drar) setTimeout(() => { f.z.fart = 70; start(f); }, n * 50); });
    tvTimer = setTimeout(() => tegnTv(), 1600);
  });

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
  boks(2.4, 2.6, 0, 1.2, 1.2, 20, '#FFF8EE', '#FF5B1F', '#E04A12', bord);
  const a = I(2.85, 2.95, 20);
  el('rect', { x: a[0] - 5, y: a[1] - 26, width: 10, height: 26, rx: 2, fill: '#2ea873', stroke: B, 'stroke-width': 2.5 }, bord);
  el('rect', { x: a[0] - 2.5, y: a[1] - 35, width: 5, height: 10, fill: '#2ea873', stroke: B, 'stroke-width': 2.5 }, bord);
  el('rect', { x: a[0] - 5, y: a[1] - 18, width: 10, height: 7, fill: '#FFD23F', stroke: B, 'stroke-width': 2 }, bord);
  [I(3.2, 3.5, 20), I(2.8, 3.6, 20)].forEach((q) => el('path', { d: 'M' + (q[0] - 5) + ' ' + (q[1] - 15) + 'h10l-2 15h-6z', fill: '#FFE07A', stroke: B, 'stroke-width': 2.5, 'stroke-linejoin': 'round' }, bord));
  const sofa = ny(8.5, el('g', {}, lag));
  boks(5.3, 1.8, 0, 0.55, 3.0, 40, '#FF9CC2', '#ff7fb0', '#f06a9e', sofa);
  boks(4.5, 1.8, 0, 0.85, 3.0, 16, '#FFB3D1', '#ff7fb0', '#f06a9e', sofa);
  boks(4.5, 1.5, 0, 1.35, 0.32, 24, '#FF9CC2', '#ff7fb0', '#f06a9e', sofa);
  boks(4.5, 4.8, 0, 1.35, 0.32, 24, '#FF9CC2', '#ff7fb0', '#f06a9e', sofa);
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
  function sorter() {
    const r = ting.slice().sort((x, y) => x.dataset.d - y.dataset.d);
    const k = r.map((t) => ting.indexOf(t)).join(',');
    if (k === sist) return; sist = k; r.forEach((t) => lag.appendChild(t));
  }
  function punkt(e) { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); }

  function Figur(p, x, y, info) {
    this.p = Object.assign({}, p); this.info = info || {};
    this.g = ny(x + y, el('g', { class: 'figur' }, lag));
    this.hjem = [x, y];
    this.x = new Verdi(x); this.y = new Verdi(y); this.z = new Verdi(0, RASK); this.s = new Verdi(1, RASK); this.r = new Verdi(0);
    this.vei = []; this.drar = false; this.ut = false;
    this.tegnHtml(); this.tegn(); dra(this); this.planleggRusling();
  }
  Figur.prototype.tegnHtml = function () {
    this.g.innerHTML = figurHtml(this.p) + (valg.navn && this.info.navn
      ? `<text class="stua-navn" y="17" text-anchor="middle" font-family="Archivo Variable, Archivo, sans-serif" font-weight="850" font-size="11" fill="${B}" stroke="#FFF8EE" stroke-width="4" paint-order="stroke" stroke-linejoin="round">${esc(this.info.navn)}</text>` : '');
    this.kropp = this.g.querySelector('.kropp'); this.skygge = this.g.querySelector('.skygge'); this.boble = this.g.querySelector('.boble-plass');
  };
  Figur.prototype.tegn = function () {
    const p = I(this.x.v, this.y.v, 0), z = this.z.v, s = this.s.v;
    this.g.setAttribute('transform', 'translate(' + p[0].toFixed(1) + ',' + p[1].toFixed(1) + ')');
    this.kropp.setAttribute('transform', 'translate(0,' + (-z).toFixed(1) + ') rotate(' + this.r.v.toFixed(2) + ') scale(' + (2 - s).toFixed(3) + ',' + s.toFixed(3) + ')');
    this.skygge.setAttribute('rx', (16 - Math.min(8, z * 0.25)).toFixed(1));
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
    } else if (!this.drar) this.z.mal = 0;
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
    if (!valg.vandre || REDUSERT) return;
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
    clearTimeout(f.ruslT); f.g.remove(); aktive.delete(f);
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
      e.preventDefault(); f.g.setPointerCapture(e.pointerId);
      f.drar = true; f.vei = []; forrige = punkt(e); fra = [f.x.v, f.y.v]; risting = 0;
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
      if (Math.hypot(x - fra[0], y - fra[1]) < 0.15) return;
      let mal = [x, y];
      if (!ledig(x, y)) { mal = naermesteLedig(x, y); f.gaaTil(mal); }
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
    dor.setAttribute('fill', B); handtak.setAttribute('opacity', 0); clearTimeout(dorTid);
    dorTid = setTimeout(() => { dor.setAttribute('fill', '#FF5B1F'); handtak.setAttribute('opacity', 1); }, 900);
  }
  function hopp() { if (REDUSERT) return; folk.forEach((o, n) => { if (!o.drar) setTimeout(() => { o.z.fart = 90; start(o); }, 120 + n * 40); }); }
  function ledigPlass() {
    const opptatt = folk.map((f) => f.hjem);
    return PLASSER.find((p) => !opptatt.some((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) < 0.4)) || naermesteLedig(1 + Math.random() * 4, 1 + Math.random() * 4);
  }

  /* ---------- forsiden: tre faste, og en anonym gjest per bokstav ---------- */
  let antGjester = 0;
  if (valg.demo) {
    folk.push(new Figur(START[0], 0.9, 3.0), new Figur(START[1], 3.8, 1.2), new Figur(START[2], 2.1, 4.9));
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
        if (forste) f = new Figur(utseende(p.id), mal[0], mal[1], { id: p.id, navn: p.navn });
        else { f = new Figur(utseende(p.id), DOR[0], DOR[1], { id: p.id, navn: p.navn }); f.hjem = mal; setTimeout(() => f.gaaTil(mal, true), nye * 500); nye++; }
        f.hjem = mal; kart.set(p.id, f); folk.push(f);
        if (!forste && p.id !== valg.meg) setTimeout(() => f.si(T('Hei!', 'Hi!'), 1400), 900 + nye * 500);
        return;
      }
      if (f.info.navn !== p.navn) { f.info.navn = p.navn; f.tegnHtml(); f.tegn(); }
      // Noen har flyttet personen på en annen skjerm: gå dit
      if (lagret && !f.drar && Math.hypot(lagret[0] - f.hjem[0], lagret[1] - f.hjem[1]) > 0.05) { f.hjem = lagret; f.gaaTil(lagret); }
    });
    if (nye) { aapneDor(); hopp(); }
    forste = false; sorter();
  }
  function personSi(id, tekst, ms) { const f = kart.get(id); if (f) f.si(tekst, ms); }
  function straff(id, tekst) {
    const f = kart.get(id); if (!f) return;
    f.si(tekst, 2600); f.svimmel();
    if (!REDUSERT) { f.z.fart = 140; start(f); }
  }

  return {
    nyGjest, settFolk, personSi, straff,
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
  };
}
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

// Forsidens skript (inline) bruker disse
if (typeof window !== 'undefined') {
  window.mvFjaer = fjaer; window.mvFigur = figurHtml; window.mvHode = hodeSvg;
}
