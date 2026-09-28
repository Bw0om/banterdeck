/**
 * Gruppekoder («rom»): flere telefoner i samme spill.
 * All spillogikk kjører her på serveren. Nettleseren får bare det den skal se:
 * ingen polletter, og hemmeligheter bare til spilleren de gjelder.
 */
import { rpc } from './spilt';
import DECKS from '../data/decks.json';
import BINGO from '../data/bingo.json';

const D: any = DECKS;
const B: any = BINGO;

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
const KORTLEKER = ['pekeleken', 'jeg-har-aldri', 'enten-eller', 'kategorier', 'nodt-eller-sannhet', 'rygg-mot-rygg', 'duoleken', '50-50'];
const NAVN: Record<string, string> = {
  'pekeleken': 'Pekeleken', 'jeg-har-aldri': 'Jeg har aldri', 'enten-eller': 'Enten eller', 'kategorier': 'Kategorier',
  'nodt-eller-sannhet': 'Nødt eller sannhet', 'rygg-mot-rygg': 'Rygg mot rygg', 'duoleken': 'Duoleken', '50-50': '50/50',
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
export async function lagRom(navn: string) {
  const vert = { id: nyId(), navn, pollett: nyPollett(), slurker: 0 };
  const data = { laget: Date.now(), vert: vert.id, spillere: [vert], spill: null, hendelse: null, nr: 0 };
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
    spill = { type: s.type, lek: s.lek, navn: s.navn, modus: s.modus, runde: s.runde };
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
    spillere: data.spillere.map((p: any) => ({ id: p.id, navn: p.navn, slurker: p.slurker || 0 })),
    spill, hendelse: data.hendelse, nr: data.nr,
  };
}

/* ---------- spillene ---------- */
function melde(data: any, tekst: string) { data.nr = (data.nr || 0) + 1; data.hendelse = { nr: data.nr, tekst }; }
function navnPaa(data: any, id: string) { const p = data.spillere.find((x: any) => x.id === id); return p ? p.navn : '?'; }
function giSlurker(data: any, id: string, n: number) { const p = data.spillere.find((x: any) => x.id === id); if (p) p.slurker = (p.slurker || 0) + n; }

function kortstokkFor(lek: string, modus: string) {
  if (lek === 'ring-of-fire') {
    const sorter = [['♥', 1], ['♦', 1], ['♠', 0], ['♣', 0]] as const;
    const verdier = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const kort: any[] = [];
    sorter.forEach(([s, rod]) => verdier.forEach((v) => kort.push({ v, s, rod })));
    return stokk(kort);
  }
  const d = D[lek];
  const items = d.items.filter((x: any) => !modus || modus === '*' || (d.modes || []).length <= 1 || x.m === modus);
  return stokk(items.map((x: any) => ({ t: x.t, k: x.k || '' })));
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
    const rekke = kortstokkFor(lek, modus);
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

export function handling(data: any, meg: any, h: any) {
  const s = data.spill;
  const erVert = meg.id === data.vert;
  const ekstra = ['start', 'avslutt', 'fjern', 'nullstill'].includes(h.handling) ? null : ekstraHandling(data, meg, h);
  if (ekstra) return ekstra;
  switch (h.handling) {
    case 'start': {
      if (!erVert) return { feil: 'bare-vert' };
      return startSpill(data, String(h.lek || ''), String(h.modus || '*'));
    }
    case 'avslutt': {
      if (!erVert) return { feil: 'bare-vert' };
      data.spill = null; melde(data, 'Tilbake i lobbyen'); return { ok: true };
    }
    case 'fjern': {
      if (!erVert || h.id === data.vert) return { feil: 'bare-vert' };
      const p = data.spillere.find((x: any) => x.id === h.id); if (!p) return { ok: true };
      data.spillere = data.spillere.filter((x: any) => x.id !== h.id);
      melde(data, `${p.navn} ble fjernet`); return { ok: true };
    }
    case 'nullstill': {
      if (!erVert) return { feil: 'bare-vert' };
      data.spillere.forEach((p: any) => { p.slurker = 0; }); melde(data, 'Slurketelleren er nullstilt'); return { ok: true };
    }
    case 'neste': {
      if (!s || s.type !== 'kort') return { feil: 'feil-spill' };
      if (typeof h.pos === 'number' && h.pos !== s.pos) return { ok: true }; // noen andre trykket samtidig
      s.pos++;
      if (s.pos >= s.rekke.length) { s.rekke = kortstokkFor(s.lek, s.modus); s.pos = 0; s.konger = 0; melde(data, 'Stokket på nytt'); }
      if (s.tur !== null) s.tur = (s.tur + 1) % Math.max(1, data.spillere.length);
      if (s.lek === 'ring-of-fire' && s.rekke[s.pos].v === 'K') s.konger++;
      s.kort = visKort(s, data);
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
      s.fase = 'stem'; return { ok: true };
    }
    case 'avslor': {
      if (!s) return { ok: true };
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
      else if (etter > foer) { s.rekker.push(meg.id); melde(data, `${meg.navn} fikk rekke! Del ut to slurker.`); }
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
export const EKSTRA = ['opus', 'overunder', 'veddelopet', 'pyramiden', 'gris', 'president', 'regelfabrikken'];
export function ekstraLeker() {
  return [
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
  if (lek === 'regelfabrikken') {
    const sek = [45, 60, 90].includes(Number(modus)) ? Number(modus) : 60;
    data.spill = { type: 'regelfabrikken', lek, navn: 'Regelfabrikken', modus: sek + ' sek', fase: 'skriv', frist: Date.now() + sek * 1000 + 3000, sek, kort: {}, rekke: [], pos: 0 };
  } else   if (lek === 'opus') {
    data.spill = { type: 'opus', lek, navn: 'Opus', holder: ider[0], kast: null, antall: 0, nr: 0 };
  } else if (lek === 'overunder') {
    const st = kortstokk52();
    data.spill = { type: 'overunder', lek, navn: 'Over eller under', stokk: st, kort: st.pop(), bunke: 1, tur: 0, sist: null };
  } else if (lek === 'veddelopet') {
    const st = kortstokk52().filter((k: any) => k.v !== 14);
    data.spill = { type: 'veddelopet', lek, navn: 'Veddeløpet', fase: 'vedd', veddemaal: {}, stokk: st, bane: st.splice(0, 7), snudd: [], pos: { '♥': 0, '♠': 0, '♦': 0, '♣': 0 }, sist: null, vinner: null };
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
  const ider = aktiveIder(data);
  const min = ider.indexOf(meg.id);
  switch (s.type) {
    case 'regelfabrikken': {
      if (h.handling === 'skriv') {
        if (s.fase !== 'skriv') return { feil: 'for-sent', melding: 'Tiden er ute!' };
        if (Date.now() > s.frist + 2000) return { feil: 'for-sent', melding: 'Tiden er ute!' };
        const tekst = String(h.tekst || '').replace(/[\u0000-\u001f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 140);
        if (!tekst) return { ok: true };
        const mine = s.kort[meg.id] || (s.kort[meg.id] = []);
        if (mine.length >= 40) return { feil: 'fullt', melding: 'Maks 40 kort hver.' };
        mine.push(tekst); return { ok: true };
      }
      if (h.handling === 'stokk') {
        if (s.fase !== 'skriv') return { ok: true };
        if (Date.now() < s.frist - 3000 && meg.id !== data.vert) return { feil: 'bare-vert', melding: 'Vent til tiden er ute.' };
        const alle: string[] = []; Object.values(s.kort).forEach((l: any) => l.forEach((t: string) => alle.push(t)));
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
      if (h.handling === 'nytt') return startEkstra(data, 'regelfabrikken', String(s.sek));
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
      if (h.handling === 'lop' && s.fase === 'vedd') { s.fase = 'lop'; melde(data, 'Løpet er i gang!'); return { ok: true }; }
      if (h.handling === 'snu' && s.fase === 'lop') {
        if (!s.stokk.length) s.stokk = kortstokk52().filter((k: any) => k.v !== 14);
        const k = s.stokk.pop(); s.sist = k; s.pos[k.f]++;
        const minst = Math.min(...(['♥', '♠', '♦', '♣'] as const).map((f) => s.pos[f]));
        for (let i = 0; i < 7; i++) if (!s.snudd[i] && minst >= i + 1) { s.snudd[i] = true; const f = s.bane[i].f; if (s.pos[f] > 0 && s.pos[f] <= 7) s.pos[f]--; }
        const vinner = (['♥', '♠', '♦', '♣'] as const).find((f) => s.pos[f] >= 8);
        if (vinner) {
          s.vinner = vinner; s.fase = 'ferdig';
          Object.entries(s.veddemaal).forEach(([id, v]: any) => { if (v.farge !== vinner) giSlurker(data, id, v.slurker); });
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

export function ekstraVisning(s: any, meg: any, data: any) {
  const ider = aktiveIder(data);
  if (s.type === 'regelfabrikken') return { fase: s.fase, frist: s.frist, naa: Date.now(), sek: s.sek,
    mineKort: meg ? s.kort[meg.id] || [] : [], antall: Object.fromEntries(Object.entries(s.kort).map(([id, l]: any) => [id, l.length])),
    kortet: s.fase === 'trekk' ? s.rekke[s.pos] : null, pos: s.pos, totalt: s.fase === 'trekk' ? s.rekke.length : Object.values(s.kort).reduce((n: number, l: any) => n + l.length, 0) };
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
