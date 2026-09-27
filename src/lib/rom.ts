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
