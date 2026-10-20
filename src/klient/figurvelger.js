// Figuren din: én stor figur på en scene, og du trykker rett på delen du vil endre (hodet, deg selv, ansiktet,
// brystet, hånda, føttene). Først da kommer én rad med valg under figuren, og figuren endres med en gang.
// Frisyre og farger er gratis; luer, briller, merker, kjæledyr og bevegelser låses opp ved å spille.
// Låste ting har hengelås; ett trykk viser hvordan du låser den opp – én linje, så forsvinner den.
// Brukes både i rommet (arket «Figuren din») og på profilsiden, så de ser helt like ut.
import { figurHtml, utseende, PYNT_SVG, BEVEG_SVG } from './stua.js';
import { PYNT, sesong, FRISYRER, SKJEGG, FARGER, FARGBAR, synligPynt } from '../lib/pynt.js';

const SLOTS = ['hode', 'deg', 'ansikt', 'bryst', 'venn', 'beveg'];
const NAVN = {
  no: { hode: 'På hodet', deg: 'Deg', ansikt: 'Briller', bryst: 'Genser', venn: 'Kjæledyr', beveg: 'Bevegelse' },
  en: { hode: 'On your head', deg: 'You', ansikt: 'Glasses', bryst: 'Top', venn: 'Pet', beveg: 'Move' },
};
const FARGENAVN = {
  fh: ['Hårfarge', 'Hair colour'], fhud: ['Hudtone', 'Skin tone'], ftopp: ['Farge på genseren', 'Top colour'], fhode: ['Farge på hatten', 'Hat colour'],
};
const SKJEGGNAVN = { ingen: ['Glattbarbert', 'Clean-shaven'], bart: ['Bart', 'Moustache'], stubb: ['Skjeggstubber', 'Stubble'], fullskjegg: ['Fullskjegg', 'Full beard'] };
const FRISYRENAVN = { midtskill: ['Midtskill', 'Centre part'], undercut: ['Undercut', 'Undercut'], mullet: ['Mullet', 'Mullet'], kort: ['Kort', 'Short'], sidebena: ['Sidebena', 'Side part'], quiff: ['Quiff', 'Quiff'], hanekam: ['Hanekam', 'Mohawk'], krus: ['Krøller', 'Curls'], snau: ['Snau', 'Shaved'], pannelugg: ['Pannelugg', 'Bangs'], langrett: ['Langt rett', 'Long straight'], lang: ['Langt', 'Long'], fletter: ['Fletter', 'Braids'], tuer: ['Tuer', 'Space buns'], hestehale: ['Hestehale', 'Ponytail'], bolle: ['Bolle', 'Bun'], afro: ['Afro', 'Afro'], langkrus: ['Lange krøller', 'Long curls'] };
// Hvor knappene sitter på figuren (prosent av figurboksen, viewBox -48 -100 96 106)
const PLASS = { hode: [31, 13], deg: [21, 35], ansikt: [74, 33], bryst: [28, 58], venn: [76, 71], beveg: [66, 93] };
const IKON = {
  hode: '<path d="M4 16h16"/><path d="M6 16V11a6 6 0 0 1 12 0v5"/><path d="M12 5V3"/>',
  deg: '<circle cx="12" cy="13" r="7"/><path d="M5 11q2-7 7-7t7 7"/><path d="M10 16q2 1.5 4 0"/>',
  ansikt: '<circle cx="7" cy="13" r="3.5"/><circle cx="17" cy="13" r="3.5"/><path d="M10.5 13h3M3.5 13l1-4M20.5 13l-1-4"/>',
  bryst: '<path d="M8 4h8l4 4-3 2v10H7V10L4 8z"/>',
  venn: '<circle cx="12" cy="15" r="4.5"/><circle cx="6" cy="9" r="2"/><circle cx="18" cy="9" r="2"/><circle cx="9" cy="5" r="2"/><circle cx="15" cy="5" r="2"/>',
  beveg: '<circle cx="12" cy="4" r="2"/><path d="M12 6v6l-4 6M12 12l4 6M8 9l4-1 4 2"/>',
};
const FARGEIKON = {
  fh: '<path d="M5 13q0-9 7-9t7 9"/><path d="M5 13v6M19 13v6"/>',
  fhud: '<path d="M7 11V6a1.5 1.5 0 0 1 3 0v5M10 10V4a1.5 1.5 0 0 1 3 0v6M13 10V5a1.5 1.5 0 0 1 3 0v7M16 12V8a1.5 1.5 0 0 1 3 0v6a6 6 0 0 1-12 0v-3"/>',
  ftopp: '<path d="M8 4h8l4 4-3 2v10H7V10L4 8z"/>',
  fhode: '<path d="M12 3q6 8 6 12a6 6 0 0 1-12 0q0-4 6-12z"/>',
};
const LAAS = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>';
const BOKS = { hode: '-30 -100 60 56', ansikt: '-24 -74 48 32', bryst: '-26 -52 52 36', venn: '-16 -36 44 40', beveg: '-24 -34 48 40' };
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/**
 * @param rot  elementet velgeren tegnes i
 * @param o    { lang, nokkel (figurens utseende-nøkkel), inne (innlogget), laast [], valgt {}, kvelder, kontoHref, onEndre(valgt) }
 */
export function lagFigurVelger(rot, o) {
  const en = o.lang === 'en', T = (a, b) => (en ? b : a), N = NAVN[en ? 'en' : 'no'];
  const st = { slot: 'hode', laast: o.laast || [], valgt: Object.assign({}, o.valgt || {}), kvelder: o.kvelder || 0, inne: !!o.inne, sesong: sesong(), lapp: null };
  let lappTimer = null;
  const har = () => { const h = {}; st.laast.forEach((id) => { h[id] = true; }); return h; };
  /** Utseendet slik figuren ser ut nå (fra id-en, med valgt frisyre og farger) – til å markere valgt prikk */
  const naa = () => utseende(o.nokkel, st.valgt);

  function prikker(k, valgtFarge) {
    return `<div class="fv-prikker" role="group" aria-label="${FARGENAVN[k][en ? 1 : 0]}"><span class="fv-prikk-ik"><svg viewBox="0 0 24 24" aria-hidden="true">${FARGEIKON[k]}</svg></span>` +
      FARGER[k].map((f) => `<button type="button" class="fv-prikk${f === valgtFarge ? ' paa' : ''}" data-farge="${k}" data-verdi="${f}" style="background:${f}" aria-label="${FARGENAVN[k][en ? 1 : 0]} ${f}" aria-pressed="${f === valgtFarge}"></button>`).join('') + '</div>';
  }
  function frisyrer(p) {
    // Små hoder med hver frisyre, i ditt hår og din hud
    return `<div class="fv-rad" aria-label="${T('Frisyre', 'Hairstyle')}">` + FRISYRER.map((f) => {
      const paa = p.haar === f;
      return `<button type="button" class="fv-valg fv-frisyre${paa ? ' paa' : ''}" data-frisyre="${f}" aria-pressed="${paa}" aria-label="${(FRISYRENAVN[f] || [f, f])[en ? 1 : 0]}">` +
        `<svg class="figur" viewBox="-24 -84 48 44" aria-hidden="true">${figurHtml(Object.assign({}, p, { haar: f }), {})}</svg></button>`;
    }).join('') + '</div>';
  }

  function skjegg(p) {
    return `<p class="fv-etikett">${T('Skjegg', 'Beard')}</p><div class="fv-rad" aria-label="${T('Skjegg', 'Beard')}">` + SKJEGG.map((k) => {
      const paa = (p.skjegg || 'ingen') === k;
      return `<button type="button" class="fv-valg fv-skjegg${paa ? ' paa' : ''}" data-skjegg="${k}" aria-pressed="${paa}" aria-label="${SKJEGGNAVN[k][en ? 1 : 0]}">` +
        `<svg class="figur" viewBox="-24 -84 48 50" aria-hidden="true">${figurHtml(Object.assign({}, p, { skjegg: k === 'ingen' ? null : k }), {})}</svg></button>`;
    }).join('') + '</div>';
  }
  function tegn() {
    const sammeDel = st.tegnet === st.slot && rot.firstChild, rull = sammeDel ? [...rot.querySelectorAll('.fv-rad,.fv-prikker')].map((e) => e.scrollLeft) : [];
    st.tegnet = st.slot;
    tegnInn();
    if (sammeDel) { rot.querySelector('.fv').classList.add('stille'); rot.querySelectorAll('.fv-rad,.fv-prikker').forEach((e, i) => { if (rull[i]) e.scrollLeft = rull[i]; }); }
  }
  function tegnInn() {
    const h = har(), bev = st.slot === 'beveg' ? (st.valgt.beveg || 'vink') : '', p = naa();
    const n = st.laast.length;
    const deler = '<div class="fv-deler" role="tablist">' + SLOTS.map((sl) => `<button type="button" role="tab" class="fv-del${st.slot === sl ? ' valgt' : ''}${sl === 'deg' ? ' deg' : ''}" data-slot="${sl}" aria-selected="${st.slot === sl}"><svg viewBox="0 0 24 24" aria-hidden="true">${IKON[sl]}</svg><small>${N[sl]}</small></button>`).join('') + '</div>';
    const lapp = st.lapp ? `<div class="fv-lapp inn" role="status"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4h10v3a5 5 0 0 1-10 0z"/><path d="M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4"/><path d="M12 12v4M9 20h6M12 16v4"/></svg><div><b>${esc(st.lapp.navn)}</b><span>${esc(st.lapp.tekst)}</span></div></div>` : '';
    let rad = '';
    if (st.slot === 'deg') {
      rad = `<p class="fv-etikett">${T('Frisyre', 'Hairstyle')}</p>` + frisyrer(p) + prikker('fh', p.h) + prikker('fhud', p.hud) + skjegg(p);
    } else if (st.slot) {
      const liste = synligPynt(st.laast).filter((x) => x.slot === st.slot);
      const ingen = st.slot === 'beveg' ? '' : `<button type="button" class="fv-valg${!st.valgt[st.slot] ? ' paa' : ''}" data-id="" aria-label="${T('Ingenting', 'Nothing')}" aria-pressed="${!st.valgt[st.slot]}"><svg viewBox="0 0 24 24" class="fv-ingen" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19"/></svg></button>`;
      const valg = `<div class="fv-rad" aria-label="${N[st.slot]}">` + ingen + liste.map((x) => {
        const kan = st.inne && !!h[x.id] && (!x.sesong || x.sesong === st.sesong), paa = st.valgt[st.slot] === x.id;
        let svg = x.slot === 'beveg' ? BEVEG_SVG[x.id] || '' : PYNT_SVG[x.id] || '';
        if (x.slot === 'hode' && st.valgt.fhode && FARGBAR[x.id]) svg = svg.split(FARGBAR[x.id]).join(st.valgt.fhode);
        return `<button type="button" class="fv-valg${kan ? '' : ' laast'}${paa ? ' paa' : ''}" data-id="${x.id}" aria-pressed="${paa}" aria-label="${esc(x.navn[en ? 1 : 0])}${kan ? '' : ' – ' + T('låst', 'locked')}">` +
          `<svg viewBox="${BOKS[x.slot]}" aria-hidden="true">${svg}</svg>` +
          (x.slot === 'beveg' ? `<small>${esc(x.navn[en ? 1 : 0])}</small>` : '') + (kan ? '' : `<span class="fv-laas">${LAAS}</span>`) + '</button>';
      }).join('') + '</div>';
      // Genseren farges over merkene; hatten farges under hattene når hatten kan farges (krone og glorie er alltid gull)
      if (st.slot === 'bryst') rad = prikker('ftopp', p.topp) + valg;
      else if (st.slot === 'hode') rad = valg + (st.valgt.hode && FARGBAR[st.valgt.hode] ? prikker('fhode', st.valgt.fhode || FARGBAR[st.valgt.hode]) : '');
      else rad = valg;
    }
    const fot = st.slot === 'beveg' ? T('Trykk på deg selv i stua, så gjør figuren bevegelsen – hos alle.', 'Tap yourself in the living room and your figure does the move – for everyone.')
      : st.slot === 'deg' ? ''
      : `${synligPynt(st.laast).filter((x) => x.slot === st.slot && h[x.id]).length} ${T('av', 'of')} ${synligPynt(st.laast).filter((x) => x.slot === st.slot).length} ${T('låst opp', 'unlocked')} · ${st.kvelder} ${st.kvelder === 1 ? T('kveld spilt', 'night played') : T('kvelder spilt', 'nights played')}`;
    const konto = esc(o.kontoHref || '/no/account');
    rot.innerHTML = `<div class="fv valgt">` +
      `<div class="fv-scene"><i class="fv-gulv"></i><svg class="fv-figur figur${bev ? ' m-' + bev : ''}" viewBox="-48 -100 96 106" aria-hidden="true">${figurHtml(p, st.valgt)}</svg>${lapp}</div>` +
      deler + rad +
      (st.inne ? (fot ? `<p class="fv-fot">${fot}</p>` : '') : `<p class="fv-fot"><a class="btn small gold" href="${konto}#signin">${T('Logg inn', 'Sign in')}</a><a class="btn small ghost" href="${konto}#signin">${T('Ny konto', 'New account')}</a></p>`) +
      '</div>';
  }
  function visLapp(navn, tekst) {
    st.lapp = { navn, tekst }; tegn(); clearTimeout(lappTimer);
    lappTimer = setTimeout(() => { st.lapp = null; tegn(); }, 2600);
  }
  function endret() { tegn(); if (o.onEndre) o.onEndre(Object.assign({}, st.valgt)); }
  rot.addEventListener('click', (e) => {
    const d = e.target.closest('.fv-del');
    if (d) { st.slot = st.slot === d.dataset.slot ? null : d.dataset.slot; st.lapp = null; tegn(); return; }
    const pr = e.target.closest('.fv-prikk');
    if (pr) { st.valgt[pr.dataset.farge] = pr.dataset.verdi; endret(); return; }
    const fr = e.target.closest('.fv-frisyre');
    if (fr) { st.valgt.haar = fr.dataset.frisyre; endret(); return; }
    const sk = e.target.closest('.fv-skjegg');
    if (sk) { if (sk.dataset.skjegg === 'ingen') delete st.valgt.skjegg; else st.valgt.skjegg = sk.dataset.skjegg; endret(); return; }
    const v = e.target.closest('.fv-valg'); if (!v || !st.slot) return;
    const id = v.dataset.id, x = PYNT.find((y) => y.id === id);
    if (v.classList.contains('laast') && x) {
      if (!st.inne) { location.href = (o.kontoHref || '/no/account') + '#signin'; return; }
      const h = har();
      visLapp(x.navn[en ? 1 : 0], !h[x.id] ? x.laas[en ? 1 : 0] : T('Kommer tilbake i sesongen', 'Back in season'));
      return;
    }
    st.valgt[st.slot] = id ? (st.valgt[st.slot] === id && st.slot !== 'beveg' ? null : id) : null;
    endret();
  });
  tegn();
  return {
    /** Nye data fra serveren (låst opp, valgt, kvelder) – tegnes på nytt */
    sett(d) { if (d.laast) st.laast = d.laast; if (d.valgt) st.valgt = Object.assign({}, d.valgt); if (d.kvelder != null) st.kvelder = d.kvelder; if (d.inne != null) st.inne = !!d.inne; tegn(); },
    valgt() { return Object.assign({}, st.valgt); },
  };
}

// Swift-skallet: det native arket «Figuren din» bruker de samme navnene og utsnittene
export { NAVN as FV_NAVN, FARGENAVN as FV_FARGENAVN, SKJEGGNAVN as FV_SKJEGGNAVN, FRISYRENAVN as FV_FRISYRENAVN, BOKS as FV_BOKS };
