/**
 * Gruppekoder («rom»): flere telefoner i samme spill.
 * All spillogikk kjører her på serveren. Nettleseren får bare det den skal se:
 * ingen polletter, og hemmeligheter bare til spilleren de gjelder.
 */
import { rpc, supabaseServer } from './spilt';
import DECKS from '../data/decks.json';
import BINGO from '../data/bingo.json';
import PLUSSPAKKER from '../data/pluss.json';
import { publiserteRunder, rundeId } from './nyhetsrunden';

const D: any = DECKS;
const B: any = BINGO;
/** Pluss-pakkene ligger bare på serveren – nettleseren får bare kortet som trekkes. */
const P: any = PLUSSPAKKER;
export const PAKKER = Object.keys(P).map((id) => ({ id: 'pakke-' + id, pakke: id, navn: P[id].navn, om: P[id].om, antall: P[id].items.length }));
export function erPlussLek(lek: string) { return String(lek || '').startsWith('pakke-'); }
export function pakkeKort(id: string) { return P[id] ? P[id].items : null; }

export const MAKS_SPILLERE = 16;
const KODETEGN = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/* ---------- hjelpere ---------- */
function tilfeldig(n: number) { const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] % n; }
function stokk<T>(xs: T[]): T[] { const a = xs.slice(); for (let i = a.length - 1; i > 0; i--) { const j = tilfeldig(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; }
export function nyKode() { let s = ''; for (let i = 0; i < 4; i++) s += KODETEGN[tilfeldig(KODETEGN.length)]; return s; }
function nyId() { const a = new Uint8Array(6); crypto.getRandomValues(a); return Array.from(a, (x) => x.toString(16).padStart(2, '0')).join(''); }
function nyPollett() { const a = new Uint8Array(18); crypto.getRandomValues(a); return Array.from(a, (x) => x.toString(16).padStart(2, '0')).join(''); }
export function rensNavn(n: any) { return String(n || '').replace(/[\u0000-\u001f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 20); }

/* ---------- hvilke leker som finnes i rom ---------- */
const KORTLEKER = ['pekeleken', 'jeg-har-aldri', '50-50', 'kategorier', 'tanken-bak-sangen', 'sannhet-eller-drikk', 'enten-eller', 'nodt-eller-sannhet', 'rygg-mot-rygg', 'duoleken'];
const NAVN: Record<string, string> = {
  'pekeleken': 'Pekeleken', 'jeg-har-aldri': 'Jeg har aldri', 'enten-eller': 'Enten eller', 'kategorier': 'Kategorier',
  'nodt-eller-sannhet': 'Nødt eller sannhet', 'sannhet-eller-drikk': 'Sannhet eller drikk', 'tanken-bak-sangen': 'Tanken bak sangen', 'rygg-mot-rygg': 'Rygg mot rygg', 'duoleken': 'Duoleken', '50-50': '50/50',
  'ring-of-fire': 'Ring of Fire', 'forraeder': 'Forræder', 'mest': 'Mest sannsynlig', 'bingo': 'Drikke-bingo',
};
export function lekeliste() {
  const kort = KORTLEKER.filter((s) => D[s]).map((s) => ({ id: s, navn: NAVN[s], type: 'kort', moduser: D[s].modes || [] }));
  return [
    { id: 'mest', navn: NAVN.mest, type: 'mest', moduser: D.pekeleken.modes, om: 'Alle stemmer på hvem det passer best på. Hver stemme er én slurk.' },
    { id: 'forraeder', navn: NAVN.forraeder, type: 'forraeder', moduser: D.forraeder.modes, om: 'Én får i hemmelighet beskjed om å lyve eller si sannheten. Resten stemmer.' },
    { id: 'bingo', navn: NAVN.bingo, type: 'bingo', moduser: B.eras.map((e: any) => ({ v: e.id, t: e.title })), om: 'Hver får sitt eget brett. Siden roper når noen får rekke eller bingo.' },
    { id: 'ring-of-fire', navn: NAVN['ring-of-fire'], type: 'kort', moduser: [], om: 'Telefonene er kortstokken. Alle ser samme kort.' },
    ...ekstraLeker(),
    ...kort.map((k) => ({ ...k, om: 'Alle ser samme kort. Hvem som helst kan trekke neste.' })),
    ...PAKKER.map((p) => ({ id: p.id, navn: p.navn, type: 'kort', moduser: [], pluss: true, om: p.om + ' ' + p.antall + ' kort.' })),
  ];
}

/* ---------- lagring ---------- */
export async function hentRom(kode: string): Promise<{ data: any; versjon: number } | null> {
  const r = await rpc('rom_hent', { p_kode: kode });
  const rad = Array.isArray(r) ? r[0] : r;
  return rad ? { data: rad.data, versjon: rad.versjon } : null;
}
/** Leser, endrer og lagrer. Prøver igjen hvis en annen telefon lagret samtidig. */
export async function endreRom(kode: string, endring: (data: any) => any) {
  for (let forsok = 0; forsok < 5; forsok++) {
    const rom = await hentRom(kode);
    if (!rom) return { feil: 'finnes-ikke' as const };
    const data = structuredClone(rom.data);
    const svar = endring(data);
    if (svar && svar.feil) return svar;
    const ny = await rpc('rom_lagre', { p_kode: kode, p_versjon: rom.versjon, p_data: data });
    if (ny !== null && ny !== undefined) return { data, versjon: ny as number, svar };
  }
  return { feil: 'opptatt' as const };
}
export async function lagRom(navn: string, lek = '', modus = '') {
  const vert = { id: nyId(), navn, pollett: nyPollett(), slurker: 0 };
  // Kommer man fra en lekeside, er leken valgt på forhånd – men den starter først når alle er med
  const l = lek ? lekeliste().find((x: any) => x.id === lek) : null;
  const valgt = l ? { lek: l.id, modus: String(modus || '').slice(0, 20) } : null;
  const data = { laget: Date.now(), vert: vert.id, spillere: [vert], spill: null, hendelse: null, nr: 0, valgt };
  for (let i = 0; i < 6; i++) {
    const kode = nyKode();
    const ok = await rpc('rom_lag', { p_kode: kode, p_data: data });
    if (ok === true) return { kode, spiller: vert };
  }
  throw new Error('Fant ingen ledig kode');
}

/* ---------- hva hver telefon får se ---------- */
export function visning(data: any, versjon: number, meg: any) {
  const s = data.spill;
  let spill: any = null;
  if (s) {
    spill = { type: s.type, lek: s.lek, navn: s.navn, modus: s.modus, runde: s.runde, frist: s.frist || null, turStart: s.turNokkel ? s.turStart || null : null };
    if (s.type === 'kort') Object.assign(spill, { kort: s.kort, pos: s.pos, antall: s.rekke.length, tur: s.tur, konger: s.konger });
    if (s.type === 'mest') Object.assign(spill, {
      tekst: s.tekst, fase: s.fase,
      harStemt: Object.keys(s.stemmer),
      minStemme: meg ? s.stemmer[meg.id] || null : null,
      resultat: s.fase === 'resultat' ? s.resultat : null,
    });
    if (s.type === 'forraeder') Object.assign(spill, {
      tekst: s.tekst, fase: s.fase, aktiv: s.aktiv,
      harStemt: Object.keys(s.stemmer),
      minStemme: meg ? s.stemmer[meg.id] || null : null,
      hemmelig: meg && meg.id === s.aktiv ? s.hemmelig : null,
      resultat: s.fase === 'avslort' ? { svar: s.hemmelig, stemmer: s.stemmer, drikker: s.drikker } : null,
    });
    if (EKSTRA.includes(s.type)) Object.assign(spill, ekstraVisning(s, meg, data));
    if (s.type === 'bingo') Object.assign(spill, {
      era: s.era, tittel: s.tittel, spotify: s.spotify,
      mittBrett: meg && s.brett[meg.id] ? s.brett[meg.id].map((i: number) => s.sanger[i]) : null,
      mineMerker: meg && s.merket[meg.id] ? s.merket[meg.id] : null,
      rekker: s.rekker, bingo: s.bingo,
    });
  }
  return {
    versjon, vert: data.vert, meg: meg ? meg.id : null,
    spillere: data.spillere.map((p: any) => ({ id: p.id, navn: p.navn, slurker: p.slurker || 0, gi: p.gi || 0, sendt: p.sendt || 0, mottatt: p.mottatt || 0, quiz: p.quiz || 0 })),
    spill, hendelse: data.hendelse, nr: data.nr, reak: data.reak || [], valgt: data.valgt || null, naa: Date.now(), hjul: data.hjul || null, hjulListe: data.hjulListe || HJUL_STANDARD, pluss: data.pluss && data.pluss.til > Date.now() ? { til: data.pluss.til } : null, laget: data.laget, ferdig: data.ferdig || null, historikk: data.historikk || [],
  };
}

/* ---------- spillene ---------- */
/* ---------- svarfrister: runden går ikke videre før alle har svart eller tiden er ute ---------- */
const FRIST = { mest: 30, forraeder: 30, tosannheter: 45, veddelopet: 45, nrKort: 40, nrLang: 60 };
function settFrist(s: any, sek: number) { s.frist = Date.now() + sek * 1000 + 1500; }
function fristUte(s: any) { return !s.frist || Date.now() >= s.frist - 800; }
/** Feilmelding når noen prøver å gå videre for tidlig. */
function venter(s: any, mangler: number) {
  const sek = Math.max(1, Math.ceil((s.frist - Date.now()) / 1000));
  return { feil: 'vent', melding: `Venter på ${mangler} ${mangler === 1 ? 'svar' : 'svar'} – eller ${sek} sekunder til tiden er ute.` };
}
function melde(data: any, tekst: string) { data.nr = (data.nr || 0) + 1; data.hendelse = { nr: data.nr, tekst }; }
function navnPaa(data: any, id: string) { const p = data.spillere.find((x: any) => x.id === id); return p ? p.navn : '?'; }
function giSlurker(data: any, id: string, n: number) { const p = data.spillere.find((x: any) => x.id === id); if (p) p.slurker = Math.max(0, (p.slurker || 0) + n); }
/** Slurker spilleren har vunnet og kan sende til andre (🍺-knappen). */
function giUtdeling(data: any, id: string, n: number) { const p = data.spillere.find((x: any) => x.id === id); if (p) p.gi = Math.max(0, Math.min(99, (p.gi || 0) + n)); }

function kortstokkFor(lek: string, modus: string) {
  if (lek === 'ring-of-fire') {
    const sorter = [['♥', 1], ['♦', 1], ['♠', 0], ['♣', 0]] as const;
    const verdier = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const kort: any[] = [];
    sorter.forEach(([s, rod]) => verdier.forEach((v) => kort.push({ v, s, rod })));
    return stokk(kort);
  }
  if (erPlussLek(lek)) {
    const pk = P[lek.slice(6)];
    return stokk(pk.items.map((x: any) => ({ t: x.t, k: x.k || '' })));
  }
  const d = D[lek];
  const items = d.items.filter((x: any) => !modus || modus === '*' || (d.modes || []).length <= 1 || x.m === modus);
  return stokk(items.map((x: any) => ({ t: x.t, k: x.k || '' })));
}
/** Smakebiter: i rom uten Pluss dukker et par kort fra pakkene opp innimellom. */
function medSmakebiter(rekke: any[]) {
  const ut = rekke.slice(), ider = Object.keys(P);
  for (let n = 0; n < 2 && ider.length; n++) {
    const id = ider[tilfeldig(ider.length)], it = P[id].items[tilfeldig(P[id].items.length)];
    ut.splice(8 + tilfeldig(Math.max(1, ut.length - 8)), 0, { t: it.t, k: '✨ Smakebit fra ' + P[id].navn + '-pakken', smak: true });
  }
  return ut;
}
function visKort(s: any, data: any) {
  const k = s.rekke[s.pos];
  if (s.lek !== 'ring-of-fire') return { t: k.t, k: k.k };
  const info = D['ring-of-fire'].kort[k.v];
  let regel = info[0], tekst = info[1];
  if (k.v === 'K') {
    const nr = s.konger; const sl = D['ring-of-fire'].konger[Math.min(nr, 4) - 1];
    regel = (['Første', 'Andre', 'Tredje', 'Fjerde'][nr - 1] || 'Neste') + ' konge';
    tekst = 'Drikk ' + sl + ' slurker.' + (nr === 4 ? ' Det var siste konge!' : '');
  }
  return { v: k.v === 'J' ? 'Kn' : (k.v === 'Q' ? 'D' : k.v), s: k.s, rod: k.rod, regel, tekst, hvem: s.tur !== null ? navnPaa(data, data.spillere[s.tur]?.id) : null };
}

function nyMestRunde(s: any) {
  if (!s.kø.length) s.kø = stokk(s.alle.slice());
  s.tekst = s.kø.pop(); s.fase = 'stem'; s.stemmer = {}; s.resultat = null; s.runde = (s.runde || 0) + 1;
  settFrist(s, FRIST.mest);
}
function nyForraederRunde(s: any, data: any) {
  if (!s.kø.length) s.kø = stokk(s.alle.slice());
  const ider = data.spillere.map((p: any) => p.id);
  const idx = ider.indexOf(s.aktiv);
  s.aktiv = ider[(idx + 1) % ider.length];
  s.tekst = s.kø.pop(); s.fase = 'svar'; s.stemmer = {}; s.drikker = []; s.hemmelig = tilfeldig(2) ? 'sannhet' : 'lyv';
  s.runde = (s.runde || 0) + 1;
}
const LINJER: number[][] = (() => {
  const l: number[][] = [];
  for (let r = 0; r < 4; r++) { l.push([r * 4, r * 4 + 1, r * 4 + 2, r * 4 + 3]); l.push([r, r + 4, r + 8, r + 12]); }
  l.push([0, 5, 10, 15]); l.push([3, 6, 9, 12]);
  return l;
})();
function nyttBrett(s: any) { return stokk(s.sanger.map((_: any, i: number) => i)).slice(0, 16); }

export function startSpill(data: any, lek: string, modus: string) {
  if (EKSTRA.includes(lek)) return startEkstra(data, lek, modus);
  const liste = lekeliste();
  const valgt = liste.find((x) => x.id === lek);
  if (!valgt) return { feil: 'ukjent-lek' };
  if (valgt.type === 'kort') {
    const plussRom = !!(data.pluss && data.pluss.til > Date.now());
    if ((valgt as any).pluss && !plussRom) return { feil: 'pluss', melding: 'Denne pakken krever Banterdeck Pluss.' };
    let rekke = kortstokkFor(lek, modus);
    if (!plussRom && !(valgt as any).pluss && lek !== 'ring-of-fire' && rekke.length > 12) rekke = medSmakebiter(rekke);
    if (!rekke.length) return { feil: 'tom' };
    data.spill = { type: 'kort', lek, navn: valgt.navn, modus, rekke, pos: 0, tur: lek === 'ring-of-fire' ? 0 : null, konger: 0 };
    if (lek === 'ring-of-fire' && rekke[0].v === 'K') data.spill.konger = 1;
    data.spill.kort = visKort(data.spill, data);
  }
  if (valgt.type === 'mest') {
    const alle = D.pekeleken.items.filter((x: any) => !modus || modus === '*' || x.m === modus).map((x: any) => x.t);
    data.spill = { type: 'mest', lek, navn: valgt.navn, modus, alle, kø: [] };
    nyMestRunde(data.spill);
  }
  if (valgt.type === 'forraeder') {
    if (data.spillere.length < 3) return { feil: 'for-faa', melding: 'Forræder trenger minst tre spillere.' };
    const alle = D.forraeder.items.filter((x: any) => !modus || modus === '*' || x.m === modus).map((x: any) => x.t);
    data.spill = { type: 'forraeder', lek, navn: valgt.navn, modus, alle, kø: [], aktiv: data.spillere[data.spillere.length - 1].id };
    nyForraederRunde(data.spill, data);
  }
  if (valgt.type === 'bingo') {
    const era = B.eras.find((e: any) => e.id === modus) || B.eras[0];
    const s: any = { type: 'bingo', lek, navn: valgt.navn, modus: era.id, era: era.id, tittel: era.title, spotify: era.spotify || '',
      sanger: era.songs.map((x: any) => [x[0], x[1]]), brett: {}, merket: {}, rekker: [], bingo: [] };
    data.spillere.forEach((p: any) => { s.brett[p.id] = nyttBrett(s); s.merket[p.id] = Array(16).fill(false); });
    data.spill = s;
  }
  melde(data, `Nytt spill: ${valgt.navn}`);
  return { ok: true };
}

/** Hvem har tur akkurat nå (for «hopp over»)? null når ingen enkeltperson holder spillet. */
function turNokkel(s: any) {
  if (!s) return null;
  if (s.type === 'bussruta' && s.fase === 1) return 'b1:' + s.tur;
  if (s.type === 'yatzy' && !s.ferdig) return 'y:' + s.tur;
  if (s.type === 'overunder') return 'o:' + s.tur;
  return null;
}
const HOPP_ETTER = 40000;
export function handling(data: any, meg: any, h: any) {
  const svar = handlingInne(data, meg, h);
  const s = data.spill, n = turNokkel(s);
  if (s && n !== s.turNokkel) { s.turNokkel = n; s.turStart = n ? Date.now() : null; }
  return svar;
}
function hoppOver(data: any) {
  const s = data.spill, ider = aktiveIder(data);
  if (s.type === 'bussruta' && s.fase === 1) {
    const hvem = s.ider[s.tur]; s.steg = 0; s.tur++;
    s.melding = `${navnPaa(data, hvem)} ble hoppet over.`;
    if (s.tur >= s.ider.length) { s.fase = 2; s.pyr = []; for (let i = 0; i < 15; i++) s.pyr.push(brTrekk(s)); s.pyrPos = 0; s.sist = null; }
  } else if (s.type === 'yatzy') {
    const hvem = s.ider[s.tur], b = s.blokker[hvem], f = YZ_FELT.find((x) => b[x] == null);
    if (f) b[f] = 0;   // strøk et felt, så spillet fortsatt kan bli ferdig
    s.tur = (s.tur + 1) % s.ider.length; s.kast = 0; s.hold = [false, false, false, false, false];
    s.melding = `${navnPaa(data, hvem)} ble hoppet over (strøk ett felt).`;
    if (s.ider.every((id: string) => YZ_FELT.every((x) => s.blokker[id][x] != null))) {
      const liste = s.ider.map((id: string) => ({ id, navn: navnPaa(data, id), sum: yzSum(s.blokker[id]) })).sort((a: any, c: any) => c.sum - a.sum);
      s.ferdig = liste;
    }
  } else if (s.type === 'overunder') {
    s.tur = (s.tur + 1) % Math.max(1, ider.length);
  }
  melde(data, 'Hoppet over den som hadde tur');
}
function handlingInne(data: any, meg: any, h: any) {
  const s = data.spill;
  const erVert = meg.id === data.vert;
  if (h.handling === 'hopp-over') {
    if (!erVert) return { feil: 'bare-vert' };
    if (!s || !s.turStart || !turNokkel(s)) return { ok: true };
    if (Date.now() - s.turStart < HOPP_ETTER - 1000) return { feil: 'vent', melding: 'Gi dem litt tid til.' };
    hoppOver(data); return { ok: true };
  }
  if (h.handling === 'hjul') return spinnHjul(data, meg, h, erVert);
  if (h.handling === 'hjul-liste') {
    if (!erVert) return { feil: 'bare-vert' };
    const l = (Array.isArray(h.liste) ? h.liste : []).map((x: any) => String(x || '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 60)).filter(Boolean).slice(0, 12);
    data.hjulListe = l.length >= 2 ? l : null; return { ok: true };
  }
  const ekstra = ['start', 'avslutt', 'fjern', 'nullstill', 'slurk', 'reager', 'send', 'velg-annen', 'avslutt-kvelden', 'fortsett-kvelden', 'pluss-aktiver'].includes(h.handling) ? null : ekstraHandling(data, meg, h);
  if (ekstra) return ekstra;
  switch (h.handling) {
    case 'start': {
      if (!erVert) return { feil: 'bare-vert' };
      // Verten har Pluss (sjekket av API-ruta): lås opp rommet for kvelden
      if (h._plussTil > Date.now() && !(data.pluss && data.pluss.til > Date.now())) data.pluss = { til: Math.min(h._plussTil, Date.now() + 24 * 3600 * 1000) };
      const r = h.lek === 'egen' ? startEgen(data, h.kort, h.navn) : startSpill(data, String(h.lek || ''), String(h.modus || '*'));
      if (!(r as any).feil && data.spill) { data.valgt = null; data.ferdig = null; data.historikk = (data.historikk || []).concat([data.spill.navn]).slice(-40); }
      return r;
    }
    case 'avslutt-kvelden': {
      if (!erVert) return { feil: 'bare-vert' };
      data.spill = null; data.valgt = null; data.ferdig = Date.now(); melde(data, 'Kvelden er over – her er oppsummeringen!'); return { ok: true };
    }
    case 'fortsett-kvelden': {
      if (!erVert) return { feil: 'bare-vert' };
      data.ferdig = null; return { ok: true };
    }
    case 'pluss-aktiver': {
      // Serveren har allerede sjekket kontoen (h._plussTil settes bare av API-ruta)
      if (!erVert) return { feil: 'bare-vert' };
      if (!(h._plussTil > Date.now())) return { feil: 'pluss', melding: 'Kontoen din har ikke Pluss akkurat nå.' };
      const hadde = !!(data.pluss && data.pluss.til > Date.now());
      data.pluss = { til: Math.min(h._plussTil, Date.now() + 24 * 3600 * 1000) };
      if (!hadde) melde(data, '✨ Rommet har Pluss i kveld – alle pakker er låst opp!');
      return { ok: true };
    }
    case 'velg-annen': {
      if (!erVert) return { feil: 'bare-vert' };
      data.valgt = null; return { ok: true };
    }
    case 'avslutt': {
      if (!erVert) return { feil: 'bare-vert' };
      data.spill = null; melde(data, 'Tilbake i lobbyen'); return { ok: true };
    }
    case 'fjern': {
      const hvem = String(h.hvem || '');
      if (!erVert || !hvem || hvem === data.vert) return { feil: 'bare-vert' };
      const p = data.spillere.find((x: any) => x.id === hvem); if (!p) return { ok: true };
      data.spillere = data.spillere.filter((x: any) => x.id !== hvem);
      melde(data, `${p.navn} ble fjernet`); return { ok: true };
    }
    case 'slurk': {
      // Poengtavla: alle kan føre sine egne slurker, verten kan rette på alle
      const hvem = String(h.hvem || meg.id);
      if (hvem !== meg.id && !erVert) return { feil: 'bare-vert', melding: 'Bare verten kan endre andres slurker.' };
      const p = data.spillere.find((x: any) => x.id === hvem); if (!p) return { ok: true };
      const n = Number(h.n) === -1 ? -1 : 1;
      p.slurker = Math.max(0, Math.min(999, (p.slurker || 0) + n));
      return { ok: true };
    }
    case 'reager':
    case 'send': {
      const naa = Date.now();
      if (meg.sistR && naa - meg.sistR < 900) return { feil: 'for-fort', melding: 'Rolig nå 😄' };
      const reak: any = { fra: meg.id };
      if (h.handling === 'reager') {
        if (!REAKSJONER.includes(h.e)) return { feil: 'ukjent' };
        reak.e = h.e;
      } else {
        const til = data.spillere.find((x: any) => x.id === h.hvem);
        if (!til || til.id === meg.id) return { feil: 'ukjent' };
        if (!(meg.gi > 0)) return { feil: 'tomt', melding: 'Du har ingen slurker å dele ut. Vinn noe først!' };
        meg.gi--; til.slurker = (til.slurker || 0) + 1; reak.e = '🍺'; reak.til = til.id;
        meg.sendt = (meg.sendt || 0) + 1; til.mottatt = (til.mottatt || 0) + 1;
      }
      meg.sistR = naa;
      data.reakNr = (data.reakNr || 0) + 1; reak.nr = data.reakNr;
      data.reak = (data.reak || []).concat([reak]).slice(-12);
      return { ok: true };
    }
    case 'nullstill': {
      if (!erVert) return { feil: 'bare-vert' };
      data.spillere.forEach((p: any) => { p.slurker = 0; p.gi = 0; }); melde(data, 'Slurketelleren er nullstilt'); return { ok: true };
    }
    case 'neste': {
      if (!s || s.type !== 'kort') return { feil: 'feil-spill' };
      if (typeof h.pos === 'number' && h.pos !== s.pos) return { ok: true }; // noen andre trykket samtidig
      s.pos++;
      if (s.pos >= s.rekke.length) { s.rekke = kortstokkFor(s.lek, s.modus); s.pos = 0; s.konger = 0; melde(data, 'Stokket på nytt'); }
      if (s.tur !== null) s.tur = (s.tur + 1) % Math.max(1, data.spillere.length);
      if (s.lek === 'ring-of-fire' && s.rekke[s.pos].v === 'K') s.konger++;
      s.kort = visKort(s, data);
      if (s.lek === 'ring-of-fire' && s.tur !== null) {
        // Poengtavla fylles av seg selv: konger og «3 Me» drikker, «2 You» gir en slurk å dele ut
        const hvem = data.spillere[s.tur] && data.spillere[s.tur].id, v = s.rekke[s.pos].v;
        if (hvem && v === 'K') giSlurker(data, hvem, D['ring-of-fire'].konger[Math.min(s.konger, 4) - 1] || 5);
        if (hvem && v === '3') giSlurker(data, hvem, 1);
        if (hvem && v === '2') giUtdeling(data, hvem, 1);
      }
      return { ok: true };
    }
    case 'stem': {
      if (!s) return { feil: 'feil-spill' };
      if (s.type === 'mest') {
        if (s.fase !== 'stem') return { ok: true };
        if (!data.spillere.some((p: any) => p.id === h.paa)) return { feil: 'ukjent' };
        s.stemmer[meg.id] = h.paa;
        if (Object.keys(s.stemmer).length >= data.spillere.length) avgjorMest(data);
        return { ok: true };
      }
      if (s.type === 'forraeder') {
        if (s.fase !== 'stem' || meg.id === s.aktiv) return { ok: true };
        if (h.paa !== 'sannhet' && h.paa !== 'lyv') return { feil: 'ukjent' };
        s.stemmer[meg.id] = h.paa;
        if (Object.keys(s.stemmer).length >= data.spillere.length - 1) avgjorForraeder(data);
        return { ok: true };
      }
      return { feil: 'feil-spill' };
    }
    case 'svart': {  // Forræder: den aktive har svart, nå kan resten stemme
      if (!s || s.type !== 'forraeder' || s.fase !== 'svar') return { ok: true };
      if (meg.id !== s.aktiv && !erVert) return { feil: 'ikke-din-tur' };
      s.fase = 'stem'; settFrist(s, FRIST.forraeder); return { ok: true };
    }
    case 'avslor': {
      if (!s) return { ok: true };
      if (s.type === 'mest' && s.fase === 'stem') {
        const mangler = data.spillere.length - Object.keys(s.stemmer).length;
        if (mangler > 0 && !fristUte(s)) return venter(s, mangler);
        avgjorMest(data);
      }
      if (s.type === 'forraeder' && s.fase === 'stem') {
        const mangler = data.spillere.length - 1 - Object.keys(s.stemmer).length;
        if (mangler > 0 && !fristUte(s)) return venter(s, mangler);
        avgjorForraeder(data);
      }
      return { ok: true };
    }
    case 'tid-ute': {
      // En telefon sier at klokka har gått ut. Serveren sjekker selv før den gjør noe.
      if (!s || !fristUte(s)) return { ok: true };
      if (s.type === 'mest' && s.fase === 'stem') avgjorMest(data);
      if (s.type === 'forraeder' && s.fase === 'stem') avgjorForraeder(data);
      return { ok: true };
    }
    case 'runde': {
      if (!s) return { ok: true };
      if (s.type === 'mest' && s.fase === 'resultat') nyMestRunde(s);
      if (s.type === 'forraeder' && s.fase === 'avslort') nyForraederRunde(s, data);
      return { ok: true };
    }
    case 'merk': {
      if (!s || s.type !== 'bingo') return { feil: 'feil-spill' };
      if (!s.brett[meg.id]) { s.brett[meg.id] = nyttBrett(s); s.merket[meg.id] = Array(16).fill(false); }
      const i = Number(h.i); if (!(i >= 0 && i < 16)) return { feil: 'ukjent' };
      const m = s.merket[meg.id];
      const foer = LINJER.filter((l) => l.every((k) => m[k])).length;
      m[i] = !m[i];
      const etter = LINJER.filter((l) => l.every((k) => m[k])).length;
      if (m.every(Boolean) && !s.bingo.includes(meg.id)) { s.bingo.push(meg.id); melde(data, `BINGO for ${meg.navn}! Alle andre drikker opp.`); }
      else if (etter > foer) { s.rekker.push(meg.id); giUtdeling(data, meg.id, 2); melde(data, `${meg.navn} fikk rekke! Del ut to slurker.`); }
      return { ok: true };
    }
    case 'nytt-brett': {
      if (!s || s.type !== 'bingo') return { feil: 'feil-spill' };
      s.brett[meg.id] = nyttBrett(s); s.merket[meg.id] = Array(16).fill(false); return { ok: true };
    }
  }
  return { feil: 'ukjent-handling' };
}

function avgjorMest(data: any) {
  const s = data.spill;
  const telling: Record<string, number> = {};
  Object.values(s.stemmer).forEach((id: any) => { telling[id] = (telling[id] || 0) + 1; });
  const liste = Object.entries(telling).map(([id, n]) => ({ id, navn: navnPaa(data, id), stemmer: n })).sort((a, b) => b.stemmer - a.stemmer);
  liste.forEach((x) => giSlurker(data, x.id, x.stemmer));
  s.resultat = liste; s.fase = 'resultat';
  if (liste[0]) melde(data, `${liste[0].navn} fikk flest stemmer (${liste[0].stemmer})`);
}
function avgjorForraeder(data: any) {
  const s = data.spill;
  const feil = Object.entries(s.stemmer).filter(([, v]) => v !== s.hemmelig).map(([id]) => id);
  const antallStemmer = Object.keys(s.stemmer).length;
  s.drikker = [];
  if (antallStemmer && feil.length === 0) { giSlurker(data, s.aktiv, 3); s.drikker.push({ id: s.aktiv, navn: navnPaa(data, s.aktiv), slurker: 3 }); }
  feil.forEach((id) => { giSlurker(data, id, 2); s.drikker.push({ id, navn: navnPaa(data, id), slurker: 2 }); });
  s.fase = 'avslort';
  melde(data, `${navnPaa(data, s.aktiv)} ${s.hemmelig === 'lyv' ? 'løy' : 'sa sannheten'}!`);
}

/* ---------- inn i rommet ---------- */
export function blimed(data: any, navn: string) {
  if (data.spillere.length >= MAKS_SPILLERE) return { feil: 'fullt' };
  let n = navn, i = 2;
  while (data.spillere.some((p: any) => p.navn.toLowerCase() === n.toLowerCase())) n = `${navn} ${i++}`;
  const p = { id: nyId(), navn: n, pollett: nyPollett(), slurker: 0 };
  data.spillere.push(p);
  const s = data.spill;
  if (s && s.type === 'bingo') { s.brett[p.id] = nyttBrett(s); s.merket[p.id] = Array(16).fill(false); }
  melde(data, `${n} ble med`);
  return { spiller: p };
}
export function finnSpiller(data: any, id: string, pollett: string) {
  if (!id || !pollett) return null;
  const p = data.spillere.find((x: any) => x.id === id);
  if (!p) return null;
  // Sammenlign uten å røpe noe via tid
  if (p.pollett.length !== pollett.length) return null;
  let diff = 0; for (let i = 0; i < pollett.length; i++) diff |= p.pollett.charCodeAt(i) ^ pollett.charCodeAt(i);
  return diff === 0 ? p : null;
}
export function gyldigKode(k: any) { return typeof k === 'string' && /^[A-Z0-9]{4,6}$/.test(k); }

/* =====================================================================
   Kort- og terningleker i rom: Opus, Over eller under, Veddeløpet,
   Pyramiden, Gris og President. Skjulte hender vises bare til eieren.
   ===================================================================== */
export const EKSTRA = ['opus', 'overunder', 'veddelopet', 'pyramiden', 'gris', 'president', 'regelfabrikken', 'tosannheter', 'bussruta', 'yatzy', 'nyhetsrunden'];
export const REAKSJONER = ['🍻', '😂', '🔥', '😱', '👏', '🫡'];
export function ekstraLeker() {
  const nr = publiserteRunder().slice(0, 6).map((r: any) => ({ v: rundeId(r), t: 'Uke ' + r.uke }));
  return [
    ...(nr.length ? [{ id: 'nyhetsrunden', navn: 'Nyhetsrunden', type: 'nyhetsrunden', moduser: nr, om: 'Verten leser opp ukas spørsmål. Alle svarer på sin egen telefon – så ser dere hvem som bommet.' }] : []),
    { id: 'bussruta', navn: 'Bussruta', type: 'bussruta', moduser: [], om: 'Fire spørsmål hver på egen telefon, så pyramiden – og taperen kjører bussen.' },
    { id: 'yatzy', navn: 'Drikke-Yatzy', type: 'yatzy', moduser: [], om: 'Trill på din telefon når det er din tur. Alle ser terningene og blokka.' },
    { id: 'tosannheter', navn: 'To sannheter og en løgn', type: 'tosannheter', moduser: [], om: 'Én skriver tre påstander i hemmelighet. Resten stemmer på løgnen fra sin telefon.' },
    { id: 'regelfabrikken', navn: 'Regelfabrikken', type: 'regelfabrikken', moduser: [{ v: '45', t: '45 sek' }, { v: '60', t: '60 sek' }, { v: '90', t: '90 sek' }], om: 'Alle skriver så mange drikkekort de rekker på sin telefon. Så stokkes alt og trekkes.' },
    { id: 'overunder', navn: 'Over eller under', type: 'overunder', moduser: [], om: 'Den som har tur gjetter på sin telefon. Feil = drikk hele bunken.' },
    { id: 'veddelopet', navn: 'Veddeløpet', type: 'veddelopet', moduser: [], om: 'Alle vedder på sin telefon, så kjøres løpet.' },
    { id: 'pyramiden', navn: 'Pyramiden', type: 'pyramiden', moduser: [], om: 'Fire skjulte kort hver. Bløff eller si sannheten – og utfordre de andre.' },
    { id: 'gris', navn: 'Gris', type: 'gris', moduser: [], om: 'Send kort til venstre til noen har fire like. Sistemann på nesa drikker.' },
    { id: 'president', navn: 'President', type: 'president', moduser: [], om: 'Bli kvitt kortene først. Toere er høyest og rydder bordet.' },
  ];
}
function kortstokk52() { const s: any[] = []; ['♥', '♦', '♠', '♣'].forEach((f) => { for (let v = 2; v <= 14; v++) s.push({ v, f }); }); return stokk(s); }
function vnavn(v: number) { return v <= 10 ? String(v) : ({ 11: 'Kn', 12: 'D', 13: 'K', 14: 'A' } as any)[v]; }
function aktiveIder(data: any, alle = false) {
  const ider = data.spillere.map((p: any) => p.id);
  // I leker med kort på hånda sitter de som kom inn midt i en runde over til neste runde
  const h = !alle && data.spill && data.spill.hender;
  return h ? ider.filter((id: string) => h[id]) : ider;
}

export function startEkstra(data: any, lek: string, modus = ''): any {
  const n = data.spillere.length, ider = aktiveIder(data, true);
  if (lek === 'bussruta' || lek === 'yatzy' || lek === 'nyhetsrunden') return startNye(data, lek, modus, ider);
  if (lek === 'tosannheter') {
    if (n < 2) return { feil: 'for-faa', melding: 'Trenger minst to spillere.' };
    data.spill = { type: 'tosannheter', lek, navn: 'To sannheter og en løgn', aktiv: ider[0], fase: 'skriv', pastander: [], logn: -1, stemmer: {}, runde: 1 };
  } else   if (lek === 'regelfabrikken') {
    const sek = [45, 60, 90].includes(Number(modus)) ? Number(modus) : 60;
    data.spill = { type: 'regelfabrikken', lek, navn: 'Regelfabrikken', modus: sek + ' sek', fase: 'klar', frist: null, sek, kort: {}, med: {}, rekke: [], pos: 0 };
  } else   if (lek === 'opus') {
    data.spill = { type: 'opus', lek, navn: 'Opus', holder: ider[0], kast: null, antall: 0, nr: 0 };
  } else if (lek === 'overunder') {
    const st = kortstokk52();
    data.spill = { type: 'overunder', lek, navn: 'Over eller under', stokk: st, kort: st.pop(), bunke: 1, tur: 0, sist: null };
  } else if (lek === 'veddelopet') {
    const st = kortstokk52().filter((k: any) => k.v !== 14);
    data.spill = { type: 'veddelopet', lek, navn: 'Veddeløpet', fase: 'vedd', veddemaal: {}, stokk: st, bane: st.splice(0, 7), snudd: [], pos: { '♥': 0, '♠': 0, '♦': 0, '♣': 0 }, sist: null, vinner: null };
    settFrist(data.spill, FRIST.veddelopet);
  } else if (lek === 'pyramiden') {
    if (n < 2) return { feil: 'for-faa', melding: 'Pyramiden trenger minst to spillere.' };
    const st = kortstokk52();
    const hender: any = {}; ider.forEach((id: string) => { hender[id] = st.splice(0, 4); });
    data.spill = { type: 'pyramiden', lek, navn: 'Pyramiden', hender, pyr: st.splice(0, 15), pos: 0, pastander: [] };
  } else if (lek === 'gris') {
    if (n < 3) return { feil: 'for-faa', melding: 'Gris trenger minst tre spillere.' };
    data.spill = { type: 'gris', lek, navn: 'Gris', bokstaver: {} };
    nyGrisRunde(data);
  } else if (lek === 'president') {
    if (n < 3) return { feil: 'for-faa', melding: 'President trenger minst tre spillere.' };
    nyPresidentRunde(data, null);
  } else return { feil: 'ukjent-lek' };
  melde(data, `Nytt spill: ${data.spill.navn}`);
  return { ok: true };
}

/* ---------- Gris ---------- */
function nyGrisRunde(data: any) {
  const s = data.spill, ider = aktiveIder(data, true);
  const verdier = stokk([14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2]).slice(0, ider.length);
  const kort: any[] = []; verdier.forEach((v) => ['♥', '♦', '♠', '♣'].forEach((f) => kort.push({ v, f })));
  const bl = stokk(kort);
  s.hender = {}; ider.forEach((id: string) => { s.hender[id] = bl.splice(0, 4); if (s.bokstaver[id] === undefined) s.bokstaver[id] = 0; });
  s.valgt = {}; s.fase = 'send'; s.neser = []; s.runde = (s.runde || 0) + 1;
}
function fireLike(h: any[]) { return h.length === 4 && h.every((k) => k.v === h[0].v); }

/* ---------- President ---------- */
const RANG = (v: number) => (v === 2 ? 15 : v);
function nyPresidentRunde(data: any, forrige: any) {
  const ider = aktiveIder(data, true), st = kortstokk52();
  const hender: any = {}; ider.forEach((id: string) => { hender[id] = []; });
  st.forEach((k: any, i: number) => hender[ider[i % ider.length]].push(k));
  ider.forEach((id: string) => hender[id].sort((a: any, b: any) => RANG(a.v) - RANG(b.v)));
  data.spill = { type: 'president', lek: 'president', navn: 'President', hender, bord: [], bordAv: null, pass: [], tur: 0,
    ferdige: [], titler: forrige || {}, runde: ((data.spill && data.spill.runde) || 0) + 1 };
}
function presTurVidere(data: any) {
  const s = data.spill, ider = aktiveIder(data);
  for (let i = 1; i <= ider.length; i++) {
    const j = (s.tur + i) % ider.length;
    if (!s.ferdige.includes(ider[j])) { s.tur = j; return; }
  }
}

export function ekstraHandling(data: any, meg: any, h: any): any {
  const s = data.spill; if (!s || !EKSTRA.includes(s.type)) return null;
  if (s.type === 'bussruta' || s.type === 'yatzy' || s.type === 'nyhetsrunden') return nyeHandling(data, meg, h);
  const ider = aktiveIder(data);
  const min = ider.indexOf(meg.id);
  switch (s.type) {
    case 'tosannheter': {
      if (h.handling === 'pastander') {
        if (meg.id !== s.aktiv || s.fase !== 'skriv') return { ok: true };
        const p = (Array.isArray(h.p) ? h.p : []).map((x: any) => String(x || '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 120));
        const l = Number(h.logn);
        if (p.length !== 3 || p.some((x: string) => !x) || !(l >= 0 && l < 3)) return { feil: 'ugyldig', melding: 'Skriv tre påstander og merk løgnen.' };
        const rekkef = stokk([0, 1, 2]);
        s.pastander = rekkef.map((i) => p[i]); s.logn = rekkef.indexOf(l); s.fase = 'stem'; s.stemmer = {}; settFrist(s, FRIST.tosannheter);
        melde(data, `${meg.navn} har skrevet – hvilken er løgnen?`); return { ok: true };
      }
      if (h.handling === 'stem') {
        if (s.fase !== 'stem' || meg.id === s.aktiv) return { ok: true };
        const v = Number(h.paa); if (!(v >= 0 && v < 3)) return { feil: 'ukjent' };
        s.stemmer[meg.id] = v;
        if (Object.keys(s.stemmer).length >= ider.length - 1) avgjorTo(data);
        return { ok: true };
      }
      if (h.handling === 'avslor' || h.handling === 'tid-ute') {
        if (s.fase !== 'stem') return { ok: true };
        const mangler = ider.length - 1 - Object.keys(s.stemmer).length;
        if (mangler > 0 && !fristUte(s)) return h.handling === 'tid-ute' ? { ok: true } : venter(s, mangler);
        avgjorTo(data); return { ok: true };
      }
      if (h.handling === 'runde') {
        if (s.fase !== 'avslort') return { ok: true };
        s.aktiv = ider[(ider.indexOf(s.aktiv) + 1) % ider.length]; s.fase = 'skriv'; s.pastander = []; s.logn = -1; s.stemmer = {}; s.runde++;
        return { ok: true };
      }
      return null;
    }
    case 'regelfabrikken': {
      if (h.handling === 'startklokke') {
        if (s.fase !== 'klar') return { ok: true };
        if (meg.id !== data.vert) return { feil: 'bare-vert', melding: 'Verten starter klokka.' };
        s.fase = 'skriv'; s.frist = Date.now() + s.sek * 1000 + 3000;
        melde(data, 'Klokka går – skriv!');
        return { ok: true };
      }
      if (h.handling === 'skriv') {
        if (s.fase !== 'skriv') return { feil: 'for-sent', melding: 'Tiden er ute!' };
        if (Date.now() > s.frist + 2000) return { feil: 'for-sent', melding: 'Tiden er ute!' };
        const tekst = String(h.tekst || '').replace(/[\u0000-\u001f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 140);
        if (!tekst) return { ok: true };
        const mine = s.kort[meg.id] || (s.kort[meg.id] = []);
        if (mine.length >= 40) return { feil: 'fullt', melding: 'Maks 40 kort hver.' };
        mine.push(tekst); return { ok: true };
      }
      if (h.handling === 'rf-legg-til') {
        // Kort fra egne lagrede kortstokker, tatt med før eller mens klokka går
        if (s.fase !== 'klar' && s.fase !== 'skriv') return { feil: 'for-sent', melding: 'Kortene er allerede stokket.' };
        const nye = rensKort(h.kort);
        const med = s.med || (s.med = {}); const mine = med[meg.id] || (med[meg.id] = []);
        nye.forEach((t) => { if (mine.length < 60 && !mine.includes(t)) mine.push(t); });
        return { ok: true };
      }
      if (h.handling === 'stokk') {
        if (s.fase !== 'skriv') return { ok: true };
        if (Date.now() < s.frist - 3000 && meg.id !== data.vert) return { feil: 'bare-vert', melding: 'Vent til tiden er ute.' };
        const alle: string[] = []; Object.values(s.kort).forEach((l: any) => l.forEach((t: string) => alle.push(t)));
        Object.values(s.med || {}).forEach((l: any) => l.forEach((t: string) => alle.push(t)));
        if (!alle.length) return { feil: 'tom', melding: 'Ingen har skrevet noe ennå.' };
        s.rekke = stokk(alle); s.pos = 0; s.fase = 'trekk';
        melde(data, alle.length + ' kort er stokket. Trekk!');
        return { ok: true };
      }
      if (h.handling === 'neste') {
        if (s.fase !== 'trekk') return { ok: true };
        if (typeof h.pos === 'number' && h.pos !== s.pos) return { ok: true };
        s.pos++; if (s.pos >= s.rekke.length) { s.rekke = stokk(s.rekke); s.pos = 0; melde(data, 'Alle kortene er trukket – stokket på nytt.'); }
        return { ok: true };
      }
      if (h.handling === 'nytt') {
        if (s.egen) { s.rekke = stokk(s.rekke); s.pos = 0; melde(data, 'Stokket på nytt.'); return { ok: true }; }
        return startEkstra(data, 'regelfabrikken', String(s.sek));
      }
      return null;
    }
    case 'opus': {
      if (h.handling === 'kast') {
        if (meg.id !== s.holder) return { feil: 'ikke-din-tur', melding: 'Det er ikke du som har terningen.' };
        s.kast = 1 + tilfeldig(6); s.antall++; s.nr++;
        if (s.kast === 6) { const i = ider.indexOf(s.holder); s.holder = ider[(i + 1) % ider.length]; s.fra = meg.id; }
        return { ok: true };
      }
      if (h.handling === 'drop') { giSlurker(data, s.holder, 5); melde(data, `Droppet! ${navnPaa(data, s.holder)} holdt terningen – drikk opp!`); return { ok: true }; }
      return null;
    }
    case 'overunder': {
      if (h.handling !== 'gjett') return null;
      if (ider[s.tur % ider.length] !== meg.id) return { feil: 'ikke-din-tur', melding: 'Vent på tur.' };
      if (!s.stokk.length) s.stokk = kortstokk52();
      const nytt = s.stokk.pop(), riktig = h.paa === 'over' ? nytt.v > s.kort.v : nytt.v < s.kort.v;
      s.sist = { fra: s.kort, til: nytt, riktig, hvem: meg.id, bunke: s.bunke };
      if (riktig) s.bunke++;
      else { giSlurker(data, meg.id, s.bunke); melde(data, `${meg.navn} bommet – drikk ${s.bunke}!`); s.bunke = 1; }
      s.kort = nytt; s.tur = (s.tur + 1) % ider.length;
      return { ok: true };
    }
    case 'veddelopet': {
      if (h.handling === 'vedd' && s.fase === 'vedd') {
        if (!['♥', '♠', '♦', '♣'].includes(h.farge)) return { feil: 'ukjent' };
        s.veddemaal[meg.id] = { farge: h.farge, slurker: Math.max(1, Math.min(10, Number(h.slurker) || 2)) }; return { ok: true };
      }
      if ((h.handling === 'lop' || h.handling === 'tid-ute') && s.fase === 'vedd') {
        const mangler = data.spillere.length - Object.keys(s.veddemaal).length;
        if (mangler > 0 && !fristUte(s)) return h.handling === 'tid-ute' ? { ok: true } : venter(s, mangler);
        if (h.handling === 'tid-ute' && !Object.keys(s.veddemaal).length) return { ok: true };
        s.fase = 'lop'; s.frist = null; melde(data, 'Løpet er i gang!'); return { ok: true };
      }
      if (h.handling === 'snu' && s.fase === 'lop') {
        if (!s.stokk.length) s.stokk = kortstokk52().filter((k: any) => k.v !== 14);
        const k = s.stokk.pop(); s.sist = k; s.pos[k.f]++;
        const minst = Math.min(...(['♥', '♠', '♦', '♣'] as const).map((f) => s.pos[f]));
        for (let i = 0; i < 7; i++) if (!s.snudd[i] && minst >= i + 1) { s.snudd[i] = true; const f = s.bane[i].f; if (s.pos[f] > 0 && s.pos[f] <= 7) s.pos[f]--; }
        const vinner = (['♥', '♠', '♦', '♣'] as const).find((f) => s.pos[f] >= 8);
        if (vinner) {
          s.vinner = vinner; s.fase = 'ferdig';
          Object.entries(s.veddemaal).forEach(([id, v]: any) => { if (v.farge !== vinner) giSlurker(data, id, v.slurker); else giUtdeling(data, id, v.slurker * 2); });
          melde(data, `${({ '♥': 'Hjerter', '♠': 'Spar', '♦': 'Ruter', '♣': 'Kløver' } as any)[vinner]} vant løpet!`);
        }
        return { ok: true };
      }
      if (h.handling === 'nytt') { return startEkstra(data, 'veddelopet'); }
      return null;
    }
    case 'pyramiden': {
      if (h.handling === 'snu') {
        if (s.pos >= 15) return { ok: true };
        // Påstander fra forrige kort som ikke ble utfordret, gjelder nå: kortet legges på
        s.pastander.filter((p: any) => p.pos === s.pos - 1 && !p.avgjort).forEach((p: any) => {
          const hand = s.hender[p.id]; const i = hand.findIndex((k: any) => k.v === s.pyr[p.pos].v);
          if (i !== -1) hand.splice(i, 1); p.avgjort = 'godtatt';
        });
        s.pos++; return { ok: true };
      }
      if (h.handling === 'pastand') {
        if (s.pos < 1) return { ok: true };
        const pos = s.pos - 1;
        if (s.pastander.some((p: any) => p.pos === pos && p.id === meg.id)) return { ok: true };
        const rad = pos < 5 ? 1 : pos < 9 ? 2 : pos < 12 ? 3 : pos < 14 ? 4 : 5;
        s.pastander.push({ id: meg.id, pos, rad, avgjort: null });
        melde(data, `${meg.navn} sier de har ${vnavn(s.pyr[pos].v)} – deler ut ${rad}!`);
        return { ok: true };
      }
      if (h.handling === 'utfordre') {
        const p = s.pastander.find((x: any) => x.id === h.paa && x.pos === s.pos - 1 && !x.avgjort);
        if (!p || p.id === meg.id) return { ok: true };
        const hand = s.hender[p.id], i = hand.findIndex((k: any) => k.v === s.pyr[p.pos].v);
        if (i !== -1) { hand.splice(i, 1); giSlurker(data, meg.id, p.rad * 2); p.avgjort = 'sant'; melde(data, `${navnPaa(data, p.id)} hadde kortet! ${meg.navn} drikker ${p.rad * 2}.`); }
        else { giSlurker(data, p.id, p.rad * 2); p.avgjort = 'bløff'; melde(data, `${navnPaa(data, p.id)} bløffet! Drikk ${p.rad * 2}.`); }
        return { ok: true };
      }
      if (h.handling === 'nytt') return startEkstra(data, 'pyramiden');
      return null;
    }
    case 'gris': {
      if (h.handling === 'velg' && s.fase === 'send') {
        const i = Number(h.i); if (!(i >= 0 && i < 4)) return { feil: 'ukjent' };
        s.valgt[meg.id] = i;
        if (ider.every((id: string) => s.valgt[id] !== undefined)) {
          const sendt = ider.map((id: string) => s.hender[id].splice(s.valgt[id], 1)[0]);
          ider.forEach((id: string, j: number) => { s.hender[id].push(sendt[(j - 1 + ider.length) % ider.length]); });
          s.valgt = {};
        }
        return { ok: true };
      }
      if (h.handling === 'nese') {
        if (s.fase === 'ferdig' || s.neser.includes(meg.id)) return { ok: true };
        if (s.fase === 'send') {
          if (!fireLike(s.hender[meg.id])) {
            s.bokstaver[meg.id]++; melde(data, `${meg.navn} tok seg på nesa for tidlig – får en bokstav!`);
            if (s.bokstaver[meg.id] >= 4) { melde(data, `${meg.navn} er GRIS! Ta en shot.`); s.bokstaver[meg.id] = 0; }
            return { ok: true };
          }
          s.fase = 'nese';
        }
        s.neser.push(meg.id);
        if (s.neser.length >= ider.length - 1) {
          const taper = ider.find((id: string) => !s.neser.includes(id));
          s.bokstaver[taper]++;
          const b = 'GRIS'.slice(0, s.bokstaver[taper]);
          melde(data, `${navnPaa(data, taper)} var sist på nesa – ${b}!` + (s.bokstaver[taper] >= 4 ? ' Ta en shot!' : ''));
          if (s.bokstaver[taper] >= 4) s.bokstaver[taper] = 0;
          s.fase = 'ferdig'; s.taper = taper;
        }
        return { ok: true };
      }
      if (h.handling === 'nytt') { nyGrisRunde(data); return { ok: true }; }
      return null;
    }
    case 'president': {
      const turId = ider[s.tur];
      if (h.handling === 'legg' || h.handling === 'pass') {
        if (turId !== meg.id) return { feil: 'ikke-din-tur', melding: 'Vent på tur.' };
        const hand = s.hender[meg.id];
        if (h.handling === 'pass') {
          if (!s.bord.length) return { feil: 'ugyldig', melding: 'Du starter – legg ut noe.' };
          if (!s.pass.includes(meg.id)) s.pass.push(meg.id);
        } else {
          const valg: number[] = Array.isArray(h.kort) ? [...new Set(h.kort.map(Number))].filter((i: number) => i >= 0 && i < hand.length) as number[] : [];
          if (!valg.length) return { feil: 'ugyldig', melding: 'Velg kort.' };
          const kort = valg.map((i) => hand[i]);
          if (!kort.every((k: any) => k.v === kort[0].v)) return { feil: 'ugyldig', melding: 'Kortene må være like.' };
          if (s.bord.length && (kort.length !== s.bord.length || RANG(kort[0].v) <= RANG(s.bord[0].v))) return { feil: 'ugyldig', melding: `Legg ${s.bord.length} kort som er høyere.` };
          s.hender[meg.id] = hand.filter((_: any, i: number) => !valg.includes(i));
          s.bord = kort; s.bordAv = meg.id; s.pass = [];
          if (!s.hender[meg.id].length) { s.ferdige.push(meg.id); melde(data, `${meg.navn} er tom for kort!`); }
          if (kort[0].v === 2) { s.bord = []; s.pass = []; melde(data, `${meg.navn} la toer og rydder bordet.`);
            if (s.hender[meg.id].length) return { ok: true }; }
        }
        const igjen = ider.filter((id: string) => !s.ferdige.includes(id));
        if (igjen.length <= 1) {
          if (igjen.length === 1) s.ferdige.push(igjen[0]);
          const t: any = {}; t[s.ferdige[0]] = 'President'; t[s.ferdige[s.ferdige.length - 1]] = 'Rævkjører';
          if (s.ferdige.length > 3) { t[s.ferdige[1]] = 'Visepresident'; t[s.ferdige[s.ferdige.length - 2]] = 'Viserævkjører'; }
          s.titler = t; s.fase = 'ferdig';
          melde(data, `${navnPaa(data, s.ferdige[0])} er President! ${navnPaa(data, s.ferdige[s.ferdige.length - 1])} er rævkjører.`);
          return { ok: true };
        }
        // Har alle andre sagt pass siden siste legg? Da rydder den som la sist.
        const maaSvare = igjen.filter((id: string) => id !== s.bordAv);
        if (s.bord.length && maaSvare.every((id: string) => s.pass.includes(id))) {
          s.bord = []; s.pass = [];
          const idx = ider.indexOf(s.bordAv);
          if (!s.ferdige.includes(s.bordAv)) { s.tur = idx; melde(data, `Ingen gikk over – ${navnPaa(data, s.bordAv)} starter på nytt.`); return { ok: true }; }
          s.tur = idx;
        }
        presTurVidere(data);
        return { ok: true };
      }
      if (h.handling === 'nytt') { nyPresidentRunde(data, s.titler); return { ok: true }; }
      return null;
    }
  }
  return null;
}

function avgjorTo(data: any) {
  const s = data.spill; let riktige = 0; s.drikker = [];
  Object.entries(s.stemmer).forEach(([id, v]: any) => { if (v === s.logn) riktige++; else { giSlurker(data, id, 1); s.drikker.push({ navn: navnPaa(data, id), slurker: 1 }); } });
  if (riktige) { giSlurker(data, s.aktiv, riktige); s.drikker.push({ navn: navnPaa(data, s.aktiv), slurker: riktige }); }
  s.fase = 'avslort'; melde(data, `Løgnen var: «${s.pastander[s.logn]}»`);
}
export function ekstraVisning(s: any, meg: any, data: any) {
  if (s.type === 'bussruta' || s.type === 'yatzy' || s.type === 'nyhetsrunden') return nyeVisning(s, meg, data);
  const ider = aktiveIder(data);
  if (s.type === 'tosannheter') return { aktiv: s.aktiv, fase: s.fase, pastander: s.pastander, harStemt: Object.keys(s.stemmer),
    minStemme: meg ? (s.stemmer[meg.id] ?? null) : null, logn: s.fase === 'avslort' ? s.logn : null, stemmer: s.fase === 'avslort' ? s.stemmer : null, drikker: s.fase === 'avslort' ? s.drikker : null };
  if (s.type === 'regelfabrikken') return { fase: s.fase, frist: s.frist, naa: Date.now(), sek: s.sek,
    mineKort: meg ? s.kort[meg.id] || [] : [], mineMed: meg && s.med ? (s.med[meg.id] || []).length : 0,
    antall: Object.fromEntries(data.spillere.map((p: any) => [p.id, ((s.kort[p.id] || []).length + ((s.med || {})[p.id] || []).length)])),
    kortet: s.fase === 'trekk' ? s.rekke[s.pos] : null, pos: s.pos, egen: !!s.egen, alleKort: s.fase === 'trekk' && meg ? s.rekke : null, totalt: s.fase === 'trekk' ? s.rekke.length : Object.values(s.kort).concat(Object.values(s.med || {})).reduce((n: number, l: any) => n + l.length, 0) };
  if (s.type === 'opus') return { holder: s.holder, kast: s.kast, antall: s.antall, nr: s.nr, fra: s.fra || null };
  if (s.type === 'overunder') return { kort: s.kort, bunke: s.bunke, tur: ider[s.tur % ider.length], sist: s.sist, igjen: s.stokk.length };
  if (s.type === 'veddelopet') return { fase: s.fase, pos: s.pos, sist: s.sist, vinner: s.vinner, bane: s.bane.map((k: any, i: number) => (s.snudd[i] ? k : null)),
    veddemaal: s.veddemaal, mittVeddemaal: meg ? s.veddemaal[meg.id] || null : null };
  if (s.type === 'pyramiden') return { pos: s.pos, pyr: s.pyr.slice(0, s.pos), minHand: meg ? s.hender[meg.id] : null,
    antall: Object.fromEntries(Object.entries(s.hender).map(([id, h]: any) => [id, h.length])),
    pastander: s.pastander.filter((p: any) => p.pos === s.pos - 1).map((p: any) => ({ id: p.id, rad: p.rad, avgjort: p.avgjort })) };
  if (s.type === 'gris') return { fase: s.fase, minHand: meg ? s.hender[meg.id] : null, harValgt: Object.keys(s.valgt), mittValg: meg ? s.valgt[meg.id] ?? null : null,
    neser: s.neser, bokstaver: s.bokstaver, taper: s.taper || null, harFire: meg ? fireLike(s.hender[meg.id] || []) : false,
    fasit: s.fase === 'ferdig' ? Object.fromEntries(Object.entries(s.hender).map(([id, h]: any) => [id, h])) : null };
  if (s.type === 'president') return { fase: s.fase || 'spill', bord: s.bord, bordAv: s.bordAv, tur: ider[s.tur], pass: s.pass, ferdige: s.ferdige, titler: s.titler,
    minHand: meg ? s.hender[meg.id] : null, antall: Object.fromEntries(Object.entries(s.hender).map(([id, h]: any) => [id, h.length])) };
  return {};
}

/* =====================================================================
   Raskere rom: etter hver endring sendes et lite signal via Supabase
   Realtime («rommet har versjon N»). Telefonene henter da med én gang.
   Selve innholdet går aldri via signalet – bare versjonsnummeret.
   ===================================================================== */
export async function varsle(kode: string, versjon: number) {
  const { url, nokkel } = supabaseServer();
  if (!url || !nokkel) return;
  try {
    await fetch(url + '/realtime/v1/api/broadcast', {
      method: 'POST',
      headers: { apikey: nokkel, Authorization: 'Bearer ' + nokkel, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [{ topic: 'rom-' + kode, event: 'endret', payload: { v: versjon }, private: false }] }),
      signal: AbortSignal.timeout(1500),
    });
  } catch { /* polling tar over */ }
}
/** Teller rom og leker per dag, uten navn. Feiler stille hvis tabellen ikke finnes ennå. */
export async function loggRom(hva: 'lag' | 'lek', ref: string) {
  try { await Promise.race([rpc('logg_rom', { p_hva: hva, p_ref: ref.slice(0, 40) }), new Promise((r) => setTimeout(r, 1500))]); } catch { /* ignorert */ }
}

/* ---------- egen kortstokk (lagret på kontoen) ---------- */
export function rensKort(kort: any): string[] {
  if (!Array.isArray(kort)) return [];
  return kort.slice(0, 300).map((t) => String(t || '').replace(/[\u0000-\u001f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 140)).filter(Boolean);
}
export function startEgen(data: any, kort: any, navn: any) {
  const liste = rensKort(kort);
  if (!liste.length) return { feil: 'tom', melding: 'Kortstokken er tom.' };
  const tittel = String(navn || '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 40) || 'Egen kortstokk';
  data.spill = { type: 'regelfabrikken', lek: 'regelfabrikken', navn: tittel, modus: '', fase: 'trekk', frist: null, sek: 60, kort: {}, rekke: stokk(liste), pos: 0, egen: true };
  melde(data, `Nytt spill: ${tittel} (${liste.length} kort)`);
  return { ok: true };
}


/* =====================================================================
   Bussruta, Drikke-Yatzy og Nyhetsrunden i rom.
   Slurker føres automatisk på poengtavla: «drikk» → slurker, «del ut» → 🍺 å sende.
   ===================================================================== */
const BR_SPM = ['Rød eller svart?', 'Over eller under forrige kort?', 'Innenfor eller utenfor de to første?', 'Hvilken kortfarge?'];
function brTrekk(s: any) { if (!s.stokk.length) s.stokk = kortstokk52(); return s.stokk.pop(); }
function brRad(i: number) { return i < 5 ? 1 : i < 9 ? 2 : i < 12 ? 3 : i < 14 ? 4 : 5; }
const YZ_FELT = ['1', '2', '3', '4', '5', '6', 'p', 'pp', '3l', '4l', 'ls', 'ss', 'hus', 'sj', 'y'];
function yzTell(t: number[]) { const c = [0, 0, 0, 0, 0, 0, 0]; t.forEach((x) => c[x]++); return c; }
function yzPoeng(f: string, t: number[]) {
  const c = yzTell(t), sum = t.reduce((a, b) => a + b, 0);
  if (/^[1-6]$/.test(f)) return c[+f] * +f;
  const hoy = (n: number) => { for (let i = 6; i >= 1; i--) if (c[i] >= n) return i; return 0; };
  if (f === 'p') return hoy(2) * 2;
  if (f === 'pp') { const par: number[] = []; for (let i = 6; i >= 1; i--) if (c[i] >= 2) par.push(i); return par.length >= 2 ? (par[0] + par[1]) * 2 : 0; }
  if (f === '3l') return hoy(3) * 3;
  if (f === '4l') return hoy(4) * 4;
  if (f === 'ls') return [1, 2, 3, 4, 5].every((x) => c[x] === 1) ? 15 : 0;
  if (f === 'ss') return [2, 3, 4, 5, 6].every((x) => c[x] === 1) ? 20 : 0;
  if (f === 'hus') { let tre = 0, to = 0; for (let i = 1; i <= 6; i++) { if (c[i] === 3) tre = i; if (c[i] === 2) to = i; } return tre && to ? sum : 0; }
  if (f === 'sj') return sum;
  if (f === 'y') return c.some((x) => x === 5) ? 50 : 0;
  return 0;
}
function yzSum(b: any) { let ov = 0, sum = 0; YZ_FELT.forEach((f) => { const v = b[f]; if (v != null) { sum += v; if (/^[1-6]$/.test(f)) ov += v; } }); return sum + (ov >= 63 ? 50 : 0); }

/** Tall fra tekst som «4,2 milliarder kroner» eller «12 000». */
function lesTall(x: any): number {
  let t = String(x == null ? '' : x).toLowerCase().replace(/ /g, ' ');
  t = t.replace(/(\d)[\s.](?=\d{3}(\D|$))/g, '$1');
  const m = /-?\d+(?:[.,]\d+)?/.exec(t); if (!m) return NaN;
  let n = parseFloat(m[0].replace(',', '.'));
  const rest = t.slice(m.index + m[0].length);
  if (/^\s*(milliard|mrd)/.test(rest)) n *= 1e9; else if (/^\s*(million|mill\b|mill\.|mnok)/.test(rest)) n *= 1e6; else if (/^\s*tusen/.test(rest)) n *= 1e3;
  return n;
}
function norm(x: any) { return String(x || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9æøå ]/g, ' ').replace(/\s+/g, ' ').trim(); }
function nrRiktig(q: any, svar: any): boolean {
  if (svar == null || svar === '') return false;
  if (q.type === 'valg' || q.type === 'sant') return String(svar) === String(q.svar);
  if (q.type === 'tall') { const a = lesTall(q.svar), g = lesTall(svar); return isFinite(a) && isFinite(g) && Math.abs(g - a) <= Math.abs(a) * 0.1 + 1e-9; }
  const a = norm(q.svar), g = norm(svar);
  return !!g && (a === g || (g.length >= 3 && a.includes(g)) || (a.length >= 3 && g.includes(a)));
}
function nrNyttSpm(s: any) {
  const q = s.sporsmal[s.i];
  s.fase = 'spm'; s.svar = {}; s.resultat = {};
  s.alt = q.type === 'valg' ? stokk((q.alt || []).slice()) : q.type === 'sant' ? ['Sant', 'Tull'] : null;
  settFrist(s, q.type === 'tall' || q.type === 'fritt' ? FRIST.nrLang : FRIST.nrKort);
}
function nrAvslor(data: any) {
  const s = data.spill, q = s.sporsmal[s.i];
  s.fase = 'svar'; s.resultat = {}; s.frist = null;
  data.spillere.forEach((p: any) => { const r = nrRiktig(q, s.svar[p.id]); s.resultat[p.id] = r; nrBrukResultat(data, p.id, r, 1); });
  const antall = Object.values(s.resultat).filter(Boolean).length;
  melde(data, `Svaret er «${q.svar}» – ${antall} av ${data.spillere.length} hadde rett`);
}
function nrBrukResultat(data: any, id: string, riktig: boolean, fortegn: 1 | -1) {
  const s = data.spill;
  if (riktig) {
    giUtdeling(data, id, fortegn); s.riktige[id] = Math.max(0, (s.riktige[id] || 0) + fortegn);
    const p = data.spillere.find((x: any) => x.id === id); if (p) p.quiz = Math.max(0, (p.quiz || 0) + fortegn);
  }
  else giSlurker(data, id, fortegn);
}

function startNye(data: any, lek: string, modus: string, ider: string[]): any {
  if (lek === 'bussruta') {
    if (ider.length < 2) return { feil: 'for-faa', melding: 'Bussruta trenger minst to spillere.' };
    const hender: any = {}; ider.forEach((id) => { hender[id] = []; });
    data.spill = { type: 'bussruta', lek, navn: 'Bussruta', ider: ider.slice(), fase: 1, tur: 0, steg: 0, hender, stokk: kortstokk52(), sist: null, melding: '', pyr: [], pyrPos: 0, buss: null, bussRekke: 0, maal: 5 };
    melde(data, 'Nytt spill: Bussruta'); return { ok: true };
  }
  if (lek === 'yatzy') {
    const blokker: any = {}; ider.forEach((id) => { blokker[id] = {}; });
    data.spill = { type: 'yatzy', lek, navn: 'Drikke-Yatzy', ider: ider.slice(), tur: 0, terninger: [1, 2, 3, 4, 5], hold: [false, false, false, false, false], kast: 0, nr: 0, blokker, melding: '', ferdig: null };
    melde(data, 'Nytt spill: Drikke-Yatzy'); return { ok: true };
  }
  if (lek === 'nyhetsrunden') {
    const runder = publiserteRunder();
    const r = runder.find((x: any) => rundeId(x) === modus) || runder[0];
    if (!r || !(r.sporsmal || []).length) return { feil: 'tom', melding: 'Ingen runde er ute ennå.' };
    data.spill = { type: 'nyhetsrunden', lek, navn: 'Nyhetsrunden', modus: 'uke ' + r.uke, uke: r.uke, sporsmal: r.sporsmal, i: 0, riktige: {}, fase: 'klar', svar: {}, resultat: {}, alt: null };
    melde(data, `Nyhetsrunden uke ${r.uke} – ${r.sporsmal.length} spørsmål`); return { ok: true };
  }
  return { feil: 'ukjent-lek' };
}

function nyeHandling(data: any, meg: any, h: any): any {
  const s = data.spill, erVert = meg.id === data.vert;
  if (s.type === 'bussruta') {
    const aktiv = s.ider[s.tur];
    if (h.handling === 'br-svar') {
      if (s.fase !== 1) return { ok: true };
      if (meg.id !== aktiv && !(erVert && !data.spillere.some((p: any) => p.id === aktiv))) return { feil: 'ikke-din-tur', melding: 'Det er ikke din tur.' };
      const v = String(h.v || ''), k = brTrekk(s), hand = s.hender[aktiv];
      let ok = false;
      if (s.steg === 0) ok = (v === 'rod') === (k.f === '♥' || k.f === '♦');
      if (s.steg === 1) ok = v === 'over' ? k.v > hand[0].v : k.v < hand[0].v;
      if (s.steg === 2) { const lo = Math.min(hand[0].v, hand[1].v), hi = Math.max(hand[0].v, hand[1].v); ok = v === 'inn' ? (k.v > lo && k.v < hi) : (k.v < lo || k.v > hi); }
      if (s.steg === 3) ok = k.f === v;
      const n = s.steg + 1; hand.push(k); s.sist = k;
      if (ok) giUtdeling(data, aktiv, n); else giSlurker(data, aktiv, n);
      s.melding = `${navnPaa(data, aktiv)}: ${vnavn(k.v)}${k.f} – ${ok ? 'riktig! Del ut ' + n + '.' : 'feil! Drikk ' + n + '.'}`;
      s.steg++;
      if (s.steg === 4) { s.steg = 0; s.tur++; }
      if (s.tur >= s.ider.length) { s.fase = 2; s.pyr = []; for (let i = 0; i < 15; i++) s.pyr.push(brTrekk(s)); s.pyrPos = 0; s.sist = null; melde(data, 'Alle har fire kort. Nå snus pyramiden!'); }
      return { ok: true };
    }
    if (h.handling === 'br-snu') {
      if (s.fase !== 2 || s.pyrPos >= 15) return { ok: true };
      if (typeof h.pos === 'number' && h.pos !== s.pyrPos) return { ok: true };
      const k = s.pyr[s.pyrPos], n = brRad(s.pyrPos), treff: string[] = [];
      s.ider.forEach((id: string) => { const hand = s.hender[id], i = hand.findIndex((x: any) => x.v === k.v); if (i !== -1) { hand.splice(i, 1); treff.push(navnPaa(data, id)); giUtdeling(data, id, n); } });
      s.pyrPos++;
      s.melding = `${vnavn(k.v)}${k.f} (rad ${n}) – ${treff.length ? treff.join(', ') + ' legger på og deler ut ' + n + '.' : 'ingen har den.'}`;
      return { ok: true };
    }
    if (h.handling === 'br-buss') {
      if (s.fase !== 2 || s.pyrPos < 15) return { ok: true };
      const maks = Math.max(...s.ider.map((id: string) => s.hender[id].length));
      const kand = s.ider.filter((id: string) => s.hender[id].length === maks);
      s.buss = kand[tilfeldig(kand.length)]; s.fase = 3; s.bussRekke = 0; s.stokk = kortstokk52(); s.sist = null;
      s.melding = `${navnPaa(data, s.buss)} har flest kort igjen (${maks}) og kjører bussen! Kom deg forbi ${s.maal} kort uten bildekort eller ess.`;
      melde(data, `${navnPaa(data, s.buss)} kjører bussen!`); return { ok: true };
    }
    if (h.handling === 'br-kjor') {
      if (s.fase !== 3 || s.bussRekke >= s.maal) return { ok: true };
      if (meg.id !== s.buss && !erVert) return { feil: 'ikke-din-tur', melding: 'Det er sjåføren som snur.' };
      const k = brTrekk(s); s.sist = k;
      const straff = ({ 11: 1, 12: 2, 13: 3, 14: 4 } as any)[k.v];
      if (straff) { giSlurker(data, s.buss, straff); s.bussRekke = 0; s.melding = `${vnavn(k.v)}${k.f} – ${navnPaa(data, s.buss)} drikker ${straff} og starter på nytt.`; }
      else { s.bussRekke++; s.melding = `${vnavn(k.v)}${k.f} – trygt! ${s.bussRekke >= s.maal ? navnPaa(data, s.buss) + ' er i mål. Bussen er fri!' : (s.maal - s.bussRekke) + ' igjen.'}`; if (s.bussRekke >= s.maal) melde(data, 'Bussen er i mål!'); }
      return { ok: true };
    }
    if (h.handling === 'nytt') { if (!erVert) return { feil: 'bare-vert' }; return startNye(data, 'bussruta', '', aktiveIder(data, true)); }
    return null;
  }
  if (s.type === 'yatzy') {
    const aktiv = s.ider[s.tur], kanStyre = meg.id === aktiv || (erVert && !data.spillere.some((p: any) => p.id === aktiv));
    if (h.handling === 'yz-kast') {
      if (s.ferdig) return { ok: true };
      if (!kanStyre) return { feil: 'ikke-din-tur', melding: 'Det er ikke din tur.' };
      if (s.kast >= 3) return { ok: true };
      s.terninger = s.terninger.map((t: number, i: number) => (s.hold[i] && s.kast ? t : 1 + tilfeldig(6)));
      s.kast++; s.nr++;
      const c = yzTell(s.terninger), deler: string[] = [];
      if (c[1] > 0) { giSlurker(data, aktiv, 2); deler.push('Ener i kastet – drikk 2.'); }
      if (c.some((x) => x === 5)) { giUtdeling(data, aktiv, 5); deler.push('YATZY! Del ut 5 – eller en shot.'); }
      else if (c.some((x) => x >= 4)) { const sum = s.terninger.reduce((a: number, b: number) => a + b, 0); giSlurker(data, aktiv, sum); deler.push('Fire like – drikk ' + sum + ' slurker.'); }
      s.melding = deler.join(' ') || (s.kast < 3 ? 'Hold og trill igjen, eller velg et felt.' : 'Velg et felt.');
      return { ok: true };
    }
    if (h.handling === 'yz-hold') {
      if (!kanStyre || !s.kast || s.kast >= 3) return { ok: true };
      const i = Number(h.i); if (i >= 0 && i < 5) s.hold[i] = !s.hold[i];
      return { ok: true };
    }
    if (h.handling === 'yz-felt') {
      if (!kanStyre || !s.kast || s.ferdig) return { ok: true };
      const f = String(h.f || ''), b = s.blokker[aktiv];
      if (!YZ_FELT.includes(f) || b[f] != null) return { ok: true };
      b[f] = yzPoeng(f, s.terninger);
      s.tur = (s.tur + 1) % s.ider.length; s.kast = 0; s.hold = [false, false, false, false, false]; s.melding = '';
      if (s.ider.every((id: string) => YZ_FELT.every((x) => s.blokker[id][x] != null))) {
        const liste = s.ider.map((id: string) => ({ id, navn: navnPaa(data, id), sum: yzSum(s.blokker[id]) })).sort((a: any, c: any) => c.sum - a.sum);
        s.ferdig = liste;
        giUtdeling(data, liste[0].id, 5); giSlurker(data, liste[liste.length - 1].id, 5);
        melde(data, `${liste[0].navn} vant Yatzy! ${liste[liste.length - 1].navn} drikker opp.`);
      }
      return { ok: true };
    }
    if (h.handling === 'nytt') { if (!erVert) return { feil: 'bare-vert' }; return startNye(data, 'yatzy', '', aktiveIder(data, true)); }
    return null;
  }
  if (s.type === 'nyhetsrunden') {
    const q = s.sporsmal[s.i];
    if (h.handling === 'nr-svar') {
      if (s.fase !== 'spm') return { feil: 'for-sent', melding: 'Svaret er allerede vist.' };
      let v = String(h.v == null ? '' : h.v).replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 80);
      if (s.alt && !s.alt.includes(v)) return { feil: 'ukjent' };
      if (!v) { delete s.svar[meg.id]; return { ok: true }; }
      s.svar[meg.id] = v;
      // Alle har svart: vis svaret med én gang
      if (data.spillere.every((p: any) => s.svar[p.id] != null)) nrAvslor(data);
      return { ok: true };
    }
    if (h.handling === 'tid-ute') {
      if (s.fase === 'spm' && fristUte(s)) nrAvslor(data);
      return { ok: true };
    }
    if (!erVert && ['nr-start', 'nr-vis', 'nr-flipp', 'nr-neste', 'nytt'].includes(h.handling)) return { feil: 'bare-vert', melding: 'Verten styrer runden.' };
    if (h.handling === 'nr-start') { if (s.fase === 'klar') { nrNyttSpm(s); melde(data, 'Første spørsmål!'); } return { ok: true }; }
    if (h.handling === 'nr-vis') {
      if (s.fase !== 'spm') return { ok: true };
      const mangler = data.spillere.filter((p: any) => s.svar[p.id] == null).length;
      if (mangler > 0 && !fristUte(s)) return venter(s, mangler);
      nrAvslor(data); return { ok: true };
    }
    if (h.handling === 'nr-flipp') {
      if (s.fase !== 'svar') return { ok: true };
      const id = String(h.hvem || ''); if (!(id in s.resultat)) return { ok: true };
      nrBrukResultat(data, id, s.resultat[id], -1); s.resultat[id] = !s.resultat[id]; nrBrukResultat(data, id, s.resultat[id], 1);
      return { ok: true };
    }
    if (h.handling === 'nr-neste') {
      if (s.fase !== 'svar') return { ok: true };
      if (s.i + 1 >= s.sporsmal.length) {
        s.fase = 'ferdig';
        const liste = data.spillere.map((p: any) => ({ id: p.id, navn: p.navn, riktige: s.riktige[p.id] || 0 })).sort((a: any, b: any) => b.riktige - a.riktige);
        if (liste[0]) melde(data, `${liste[0].navn} vant Nyhetsrunden med ${liste[0].riktige} riktige!`);
        return { ok: true };
      }
      s.i++; nrNyttSpm(s); return { ok: true };
    }
    if (h.handling === 'nytt') { const r = publiserteRunder()[0]; return startNye(data, 'nyhetsrunden', r ? rundeId(r) : '', []); }
    return null;
  }
  return null;
}

function nyeVisning(s: any, meg: any, data: any) {
  if (s.type === 'bussruta') return { fase: s.fase, aktiv: s.ider[s.tur] || null, steg: s.steg, sporsmal: s.fase === 1 ? BR_SPM[s.steg] : null,
    hender: s.hender, ider: s.ider, sist: s.sist, melding: s.melding, pyr: s.pyr.slice(0, s.pyrPos), pyrPos: s.pyrPos, buss: s.buss, bussRekke: s.bussRekke, maal: s.maal };
  if (s.type === 'yatzy') return { aktiv: s.ider[s.tur], ider: s.ider, terninger: s.terninger, hold: s.hold, kast: s.kast, nr: s.nr, melding: s.melding, ferdig: s.ferdig,
    blokker: s.blokker, summer: Object.fromEntries(s.ider.map((id: string) => [id, yzSum(s.blokker[id])])),
    mulige: s.kast ? Object.fromEntries(YZ_FELT.map((f) => [f, yzPoeng(f, s.terninger)])) : null };
  if (s.type === 'nyhetsrunden') {
    const q = s.sporsmal[s.i], vert = meg && meg.id === data.vert, aapen = s.fase === 'svar' || s.fase === 'ferdig';
    const liste = data.spillere.map((p: any) => ({ id: p.id, navn: p.navn, riktige: s.riktige[p.id] || 0 })).sort((a: any, b: any) => b.riktige - a.riktige);
    return {
      fase: s.fase, i: s.i, antall: s.sporsmal.length, uke: s.uke, qtype: q.type, alt: s.alt,
      // Spørsmålet vises bare hos verten (som leser det høyt) til svaret er avslørt
      q: (vert && s.fase === 'spm') || aapen ? q.q : null,
      fasit: aapen ? q.svar : null, info: aapen ? q.info || '' : null, kilde: aapen ? q.kilde || '' : null, url: aapen ? q.url || '' : null,
      harSvart: Object.keys(s.svar), mittSvar: meg ? s.svar[meg.id] ?? null : null,
      svarene: aapen ? s.svar : null, resultat: aapen ? s.resultat : null, tavle: liste,
    };
  }
  return {};
}


/* =====================================================================
   Straffehjulet: én spinner, alle ser hjulet stoppe samtidig.
   Utfallet leses som tekst: «Drikk 3», «Del ut 2», «Shot», «Alle andre drikker 1».
   ===================================================================== */
export const HJUL_STANDARD = ['Drikk 1', 'Drikk 2', 'Drikk 3', 'Shot!', 'Del ut 2', 'Vannpause 💧', 'Trygg – ingenting skjer', 'Alle andre drikker 1', 'Velg en drikkepartner', 'Pinlig historie – eller drikk 4'];
function hjulEffekt(data: any, hvem: string, tekst: string) {
  const t = tekst.toLowerCase();
  let m;
  if ((m = /alle andre drikker (\d+)/.exec(t))) { data.spillere.forEach((p: any) => { if (p.id !== hvem) giSlurker(data, p.id, +m![1]); }); return; }
  if ((m = /del ut (\d+)/.exec(t))) { giUtdeling(data, hvem, +m[1]); return; }
  if (/shot/.test(t) && !/eller/.test(t)) { giSlurker(data, hvem, 5); return; }
  if ((m = /^drikk (\d+)/.exec(t))) giSlurker(data, hvem, +m[1]);
}
function spinnHjul(data: any, meg: any, h: any, erVert: boolean) {
  const naa = Date.now();
  if (data.hjul && naa - data.hjul.tid < 7000) return { feil: 'for-fort', melding: 'Hjulet spinner allerede!' };
  const hvem = h.hvem && erVert ? String(h.hvem) : meg.id;
  if (!data.spillere.some((p: any) => p.id === hvem)) return { feil: 'ukjent' };
  const liste = data.hjulListe || HJUL_STANDARD, i = tilfeldig(liste.length);
  data.hjul = { nr: ((data.hjul && data.hjul.nr) || 0) + 1, fra: meg.id, hvem, i, tekst: liste[i], tid: naa, antall: liste.length };
  hjulEffekt(data, hvem, liste[i]);
  return { ok: true };
}
