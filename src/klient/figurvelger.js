// Figuren din: én stor figur på en scene, og du trykker rett på delen du vil endre (hodet, ansiktet, brystet,
// hånda, føttene). Først da kommer én rad med valg under figuren, og figuren får tingen på med en gang.
// Låste ting har hengelås; ett trykk viser hvordan du låser den opp – én linje, så forsvinner den.
// Brukes både i rommet (arket «Figuren din») og på profilsiden, så de ser helt like ut.
import { figurHtml, utseende, PYNT_SVG, BEVEG_SVG } from './stua.js';
import { PYNT, sesong } from '../lib/pynt.js';

const SLOTS = ['hode', 'ansikt', 'bryst', 'venn', 'beveg'];
const NAVN = {
  no: { hode: 'På hodet', ansikt: 'Briller', bryst: 'På brystet', venn: 'Kjæledyr', beveg: 'Bevegelse' },
  en: { hode: 'On your head', ansikt: 'Glasses', bryst: 'On your chest', venn: 'Pet', beveg: 'Move' },
};
// Hvor knappene sitter på figuren (prosent av figurboksen, viewBox -48 -100 96 106)
const PLASS = { hode: [31, 15], ansikt: [71, 33], bryst: [29, 57], venn: [75, 71], beveg: [66, 93] };
const IKON = {
  hode: '<path d="M4 16h16"/><path d="M6 16V11a6 6 0 0 1 12 0v5"/><path d="M12 5V3"/>',
  ansikt: '<circle cx="7" cy="13" r="3.5"/><circle cx="17" cy="13" r="3.5"/><path d="M10.5 13h3M3.5 13l1-4M20.5 13l-1-4"/>',
  bryst: '<path d="M8 4h8l4 4-3 2v10H7V10L4 8z"/>',
  venn: '<circle cx="12" cy="15" r="4.5"/><circle cx="6" cy="9" r="2"/><circle cx="18" cy="9" r="2"/><circle cx="9" cy="5" r="2"/><circle cx="15" cy="5" r="2"/>',
  beveg: '<circle cx="12" cy="4" r="2"/><path d="M12 6v6l-4 6M12 12l4 6M8 9l4-1 4 2"/>',
};
const LAAS = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>';
const BOKS = { hode: '-30 -100 60 56', ansikt: '-24 -74 48 32', bryst: '-26 -52 52 36', venn: '-16 -30 44 34', beveg: '-24 -34 48 40' };
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/**
 * @param rot  elementet velgeren tegnes i
 * @param o    { lang, nokkel (figurens utseende-nøkkel), inne (innlogget), laast [], valgt {}, kvelder, kontoHref, onEndre(valgt) }
 */
export function lagFigurVelger(rot, o) {
  const en = o.lang === 'en', T = (a, b) => (en ? b : a), N = NAVN[en ? 'en' : 'no'];
  const st = { slot: null, laast: o.laast || [], valgt: Object.assign({}, o.valgt || {}), kvelder: o.kvelder || 0, inne: !!o.inne, sesong: sesong(), lapp: null };
  let lappTimer = null;
  const har = () => { const h = {}; st.laast.forEach((id) => { h[id] = true; }); return h; };

  function tegn() {
    const h = har(), bev = st.slot === 'beveg' ? (st.valgt.beveg || 'vink') : '';
    const n = st.laast.length;
    const deler = SLOTS.map((sl) => `<button type="button" class="fv-del${st.slot === sl ? ' valgt' : ''}${!st.slot && sl === 'hode' ? ' puls' : ''}" data-slot="${sl}" aria-label="${N[sl]}" aria-pressed="${st.slot === sl}" style="left:${PLASS[sl][0]}%;top:${PLASS[sl][1]}%"><svg viewBox="0 0 24 24" aria-hidden="true">${IKON[sl]}</svg></button>`).join('');
    const lapp = st.lapp ? `<div class="fv-lapp inn" role="status"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4h10v3a5 5 0 0 1-10 0z"/><path d="M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4"/><path d="M12 12v4M9 20h6M12 16v4"/></svg><div><b>${esc(st.lapp.navn)}</b><span>${esc(st.lapp.tekst)}</span></div></div>` : '';
    let rad = '';
    if (st.slot) {
      const liste = PYNT.filter((x) => x.slot === st.slot);
      const ingen = st.slot === 'beveg' ? '' : `<button type="button" class="fv-valg${!st.valgt[st.slot] ? ' paa' : ''}" data-id="" aria-label="${T('Ingenting', 'Nothing')}" aria-pressed="${!st.valgt[st.slot]}"><svg viewBox="0 0 24 24" class="fv-ingen" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19"/></svg></button>`;
      rad = `<div class="fv-rad" aria-label="${N[st.slot]}">` + ingen + liste.map((x) => {
        const kan = st.inne && !!h[x.id] && (!x.sesong || x.sesong === st.sesong), paa = st.valgt[st.slot] === x.id;
        return `<button type="button" class="fv-valg${kan ? '' : ' laast'}${paa ? ' paa' : ''}" data-id="${x.id}" aria-pressed="${paa}" aria-label="${esc(x.navn[en ? 1 : 0])}${kan ? '' : ' – ' + T('låst', 'locked')}">` +
          `<svg viewBox="${BOKS[x.slot]}" aria-hidden="true">${x.slot === 'beveg' ? BEVEG_SVG[x.id] || '' : PYNT_SVG[x.id] || ''}</svg>` +
          (x.slot === 'beveg' ? `<small>${esc(x.navn[en ? 1 : 0])}</small>` : '') + (kan ? '' : `<span class="fv-laas">${LAAS}</span>`) + '</button>';
      }).join('') + '</div>';
    }
    const fot = st.slot
      ? (st.slot === 'beveg' ? T('Trykk på deg selv i stua, så gjør figuren bevegelsen – hos alle.', 'Tap yourself in the living room and your figure does the move – for everyone.')
        : (st.inne ? `${PYNT.filter((x) => x.slot === st.slot && h[x.id]).length} ${T('av', 'of')} ${PYNT.filter((x) => x.slot === st.slot).length} ${T('låst opp', 'unlocked')}` : ''))
      : (st.inne ? `${n} ${T('av', 'of')} ${PYNT.length} ${T('låst opp', 'unlocked')} · ${st.kvelder} ${st.kvelder === 1 ? T('kveld spilt', 'night played') : T('kvelder spilt', 'nights played')}` : '');
    rot.innerHTML = `<div class="fv${st.slot ? ' valgt' : ''}">` +
      `<div class="fv-scene"><i class="fv-gulv"></i><svg class="fv-figur figur${bev ? ' m-' + bev : ''}" viewBox="-48 -100 96 106" aria-hidden="true">${figurHtml(utseende(o.nokkel), st.valgt)}</svg>${deler}${lapp}</div>` +
      (st.slot ? '' : `<p class="fv-hint">${T('Trykk på en del', 'Tap a part')}</p>`) + rad +
      (st.inne ? `<p class="fv-fot">${fot}</p>` : `<p class="fv-fot"><a class="btn small gold" href="${esc(o.kontoHref || '/no/account')}">${T('Lag bruker', 'Create account')}</a> ${T('– så låser du opp alt dette ved å spille. Gratis.', '– and you unlock all of this by playing. Free.')}</p>`) +
      '</div>';
  }
  function visLapp(navn, tekst) {
    st.lapp = { navn, tekst }; tegn(); clearTimeout(lappTimer);
    lappTimer = setTimeout(() => { st.lapp = null; tegn(); }, 2600);
  }
  rot.addEventListener('click', (e) => {
    const d = e.target.closest('.fv-del');
    if (d) { st.slot = st.slot === d.dataset.slot ? null : d.dataset.slot; st.lapp = null; tegn(); return; }
    const v = e.target.closest('.fv-valg'); if (!v || !st.slot) return;
    const id = v.dataset.id, x = PYNT.find((y) => y.id === id);
    if (v.classList.contains('laast') && x) {
      const h = har();
      visLapp(x.navn[en ? 1 : 0], !st.inne ? T('Lag en bruker for å låse opp', 'Create an account to unlock') : !h[x.id] ? x.laas[en ? 1 : 0] : T('Kommer tilbake i sesongen', 'Back in season'));
      return;
    }
    st.valgt[st.slot] = id ? (st.valgt[st.slot] === id && st.slot !== 'beveg' ? null : id) : null;
    tegn();
    if (o.onEndre) o.onEndre(Object.assign({}, st.valgt));
  });
  tegn();
  return {
    /** Nye data fra serveren (låst opp, valgt, kvelder) – tegnes på nytt */
    sett(d) { if (d.laast) st.laast = d.laast; if (d.valgt) st.valgt = Object.assign({}, d.valgt); if (d.kvelder != null) st.kvelder = d.kvelder; if (d.inne != null) st.inne = !!d.inne; tegn(); },
    valgt() { return Object.assign({}, st.valgt); },
  };
}
