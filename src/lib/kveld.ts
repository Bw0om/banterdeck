/**
 * Kveldspoeng: hver lek dere spiller i rommet gir 3, 2 og 1 poeng til de tre beste.
 * Den med flest poeng når kvelden avsluttes, er kveldens vinner (og i en gjeng: velger regel til lovboka).
 *
 * Hvem som var best, regnes ut av det leken allerede fører:
 *  - Yatzy: summen. President: rekkefølgen man ble ferdig. Bingo: bingo før rekker.
 *  - Quiz (Nyhetsrunden osv.): riktige svar i leken.
 *  - Ellers: slurker man vant (å dele ut) minus slurker man måtte drikke i leken.
 * Leker uten noe å måle (vanlige kortstokker) lar verten velge vinneren – eller hoppe over.
 */
const POENG = [3, 2, 1];
const MIN_TID = 60 * 1000;   // leker kortere enn et minutt teller ikke

function navnPaa(data: any, id: string) { const p = data.spillere.find((x: any) => x.id === id); return p ? p.navn : '?'; }

export function kveld(data: any) {
  if (!data.kveld) data.kveld = { poeng: {}, runder: [], aktiv: null, sporsmal: null, vinner: null, lovValg: null, ettere: {} };
  return data.kveld;
}

/** En lek er startet: husk hvordan stillingen var, så vi kan se hvem som gjorde det best i akkurat denne leken. */
export function lekStartet(data: any) {
  const k = kveld(data), s = data.spill; if (!s) return;
  const start: any = {};
  data.spillere.forEach((p: any) => { start[p.id] = { sl: p.slurker || 0, gi: p.gi || 0, se: p.sendt || 0, mo: p.mottatt || 0, q: p.quiz || 0 }; });
  k.aktiv = { navn: s.navn, type: s.type, t: Date.now(), start };
  k.sporsmal = null;
}

/** Plasseringer i leken som nettopp ble spilt: [[id, id], [id], …] (delte plasser i samme gruppe), eller null. */
function ranger(data: any, a: any): string[][] | null {
  const s = data.spill;
  const ider = data.spillere.map((p: any) => p.id).filter((id: string) => a.start[id]);
  if (ider.length < 2) return null;
  const grupper = (score: Record<string, number>, hoyestBest = true) => {
    const verdier = Array.from(new Set(ider.map((id: string) => score[id] ?? 0))).sort((x: any, y: any) => (hoyestBest ? y - x : x - y));
    if (verdier.length < 2) return null;   // alle likt: ingenting å kåre
    return verdier.map((v) => ider.filter((id: string) => (score[id] ?? 0) === v));
  };
  if (s && s.type === 'yatzy' && Array.isArray(s.ferdig) && s.ferdig.length) {
    const sc: any = {}; s.ferdig.forEach((x: any) => { sc[x.id] = x.sum; }); return grupper(sc);
  }
  if (s && s.type === 'president' && Array.isArray(s.ferdige) && s.ferdige.length) {
    const sc: any = {}; s.ferdige.forEach((id: string, i: number) => { sc[id] = 1000 - i; }); return grupper(sc);
  }
  if (s && s.type === 'bingo' && ((s.bingo || []).length || (s.rekker || []).length)) {
    const sc: any = {}; (s.rekker || []).forEach((id: string) => { sc[id] = (sc[id] || 0) + 1; }); (s.bingo || []).forEach((id: string, i: number) => { sc[id] = (sc[id] || 0) + 100 - i; });
    return grupper(sc);
  }
  const naa: any = {}; data.spillere.forEach((p: any) => { naa[p.id] = p; });
  const quiz: any = {}; let quizBrukt = false;
  ider.forEach((id: string) => { const d = (naa[id].quiz || 0) - a.start[id].q; quiz[id] = d; if (d > 0) quizBrukt = true; });
  if (quizBrukt) return grupper(quiz);
  const netto: any = {}; let noe = false;
  ider.forEach((id: string) => {
    const p = naa[id], st = a.start[id];
    const vant = ((p.gi || 0) - st.gi) + ((p.sendt || 0) - st.se);
    const drakk = ((p.slurker || 0) - st.sl) - ((p.mottatt || 0) - st.mo);   // slurker andre sendte deg teller ikke mot deg
    if (vant || drakk) noe = true;
    netto[id] = vant - drakk;
  });
  return noe ? grupper(netto) : null;
}

function giPoeng(data: any, navn: any, plass: string[][], manuell = false) {
  const k = kveld(data), topp = plass.slice(0, 3);
  topp.forEach((gruppe, i) => gruppe.forEach((id) => { k.poeng[id] = (k.poeng[id] || 0) + POENG[i]; if (i === 0) k.ettere[id] = (k.ettere[id] || 0) + 1; }));
  k.runder.push({ navn, plass: topp, manuell, t: Date.now() });
  k.runder = k.runder.slice(-40);
}

/** Leken er over (ny lek, tilbake til lobbyen eller slutt på kvelden): del ut kveldspoeng. */
export function lekFerdig(data: any) {
  const k = kveld(data), a = k.aktiv;
  if (!a) return;
  k.aktiv = null;
  if (Date.now() - a.t < MIN_TID) return;
  const plass = ranger(data, a);
  if (plass) giPoeng(data, a.navn, plass);
  else if (data.spillere.length >= 2) k.sporsmal = { navn: a.navn, t: Date.now() };   // verten velger vinneren selv
}

/** Verten velger vinneren av en lek appen ikke kunne måle (eller hopper over). */
export function velgVinner(data: any, hvem: string | null) {
  const k = kveld(data); if (!k.sporsmal) return { ok: true };
  const navn = k.sporsmal.navn; k.sporsmal = null;
  if (hvem && data.spillere.some((p: any) => p.id === hvem)) giPoeng(data, navn, [[hvem]], true);
  return { ok: true };
}

/** Kveldens vinner: flest poeng, så flest førsteplasser, så færrest slurker. Ingen poeng = ingen vinner. */
export function kaarVinner(data: any) {
  const k = kveld(data);
  const liste = data.spillere.filter((p: any) => (k.poeng[p.id] || 0) > 0).sort((a: any, b: any) =>
    (k.poeng[b.id] || 0) - (k.poeng[a.id] || 0) || (k.ettere[b.id] || 0) - (k.ettere[a.id] || 0) || (a.slurker || 0) - (b.slurker || 0));
  k.vinner = liste.length ? liste[0].id : null;
  return k.vinner;
}

/** Det telefonene ser. */
export function kveldVisning(data: any) {
  const k = data.kveld; if (!k) return null;
  return {
    stilling: data.spillere.map((p: any) => ({ id: p.id, p: k.poeng[p.id] || 0 })).sort((a: any, b: any) => b.p - a.p),
    runder: k.runder.slice(-8).map((r: any) => ({ navn: r.navn, plass: r.plass, manuell: !!r.manuell })),
    sporsmal: k.sporsmal ? { navn: k.sporsmal.navn } : null,
    aktiv: k.aktiv ? { navn: k.aktiv.navn } : null,
    vinner: data.ferdig ? k.vinner : null,
    lovValg: k.lovValg ? { type: k.lovValg.type, tekst: k.lovValg.tekst || null, lagret: !!k.lovValg.lagret, navn: k.lovValg.navn } : null,
  };
}
export { navnPaa as kveldNavn };
