/**
 * Gruppekoder («rom»): flere telefoner i samme spill.
 * All spillogikk kjører her på serveren. Nettleseren får bare det den skal se:
 * ingen polletter, og hemmeligheter bare til spilleren de gjelder.
 */
import { rpc, supabaseServer } from './spilt';
import DECKS from '../data/decks.json';
import BINGO from '../data/bingo.json';
import PLUSSPAKKER from '../data/pluss.json';
import SOSIAL from '../data/sosial.json';
import DECKS_EN from '../data/decks.en.json';
import BINGO_EN from '../data/bingo.en.json';
import PLUSSPAKKER_EN from '../data/pluss.en.json';
import SOSIAL_EN from '../data/sosial.en.json';
import { PLUSS_ROM, GRATIS_PLASSER } from './plussleker';
import { kveld, lekStartet, lekFerdig, velgVinner, kaarVinner, kveldVisning } from './kveld';
import { MAKS_REGEL } from './lovbok';
import { borsHandling, borsVisning, borsTilGjeng, settStart, nySpillerIBors, borsTilPluss } from './bors';
import { publiserteRunder, rundeId } from './nyhetsrunden';

const D: any = DECKS;
const B: any = BINGO;
/** Engelske utgaver: samme struktur og rekkefølge (indeks i = oversettelse av indeks i). */
const DE: any = DECKS_EN;
const BE: any = BINGO_EN;
/** Pluss-pakkene ligger bare på serveren – nettleseren får bare kortet som trekkes. */
const P: any = PLUSSPAKKER;
const PE: any = PLUSSPAKKER_EN;
export const PAKKER = Object.keys(P).map((id) => ({ id: 'pakke-' + id, pakke: id, navn: P[id].navn, om: P[id].om, antall: P[id].items.length,
  en: { navn: (PE[id] && PE[id].navn) || P[id].navn, om: (PE[id] && PE[id].om) || P[id].om } }));

/* ---------- språk: hver spiller ser rommet på sitt eget språk ---------- */
export type Lang = 'no' | 'en';
export function rensLang(x: any): Lang { return x === 'en' ? 'en' : 'no'; }
/** Tekst på begge språk. Lagres i rommet; visning() plukker språket til den som ser på. */
type L = { no: string; en: string };
function L(no: string, en?: string | null): L { return { no, en: en || no }; }
function erL(x: any): boolean {
  return !!x && typeof x === 'object' && !Array.isArray(x) && typeof x.no === 'string' && typeof x.en === 'string' && Object.keys(x).length === 2;
}
/** Velger språk for én tekst. Vanlige strenger (egne kort, gamle rom) vises som de er. */
export function tr(x: any, lang: Lang = 'no'): any { return erL(x) ? (x[lang] || x.no) : x; }
/** Går gjennom et svar-objekt og bytter alle tospråklige tekster med riktig språk. */
function lok(x: any, lang: Lang): any {
  if (x === null || typeof x !== 'object') return x;
  if (Array.isArray(x)) return x.map((v) => lok(v, lang));
  if (erL(x)) return x[lang] || x.no;
  const ut: any = {};
  for (const k of Object.keys(x)) ut[k] = lok(x[k], lang);
  return ut;
}
/** Feilmelding på begge språk. API-ruta velger språket til den som trykket. */
function feilL(feil: string, no: string, en: string, ekstra: any = {}) { return { feil, melding: no, en, ...ekstra }; }
export function erPlussLek(lek: string) { return String(lek || '').startsWith('pakke-') || PLUSS_ROM.includes(String(lek || '')); }
function romHarPluss(data: any) { return !!(data.pluss && data.pluss.til > Date.now()); }
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
const NAVN_L: Record<string, [string, string]> = {
  'pekeleken': ['Pekeleken', 'Most likely to'], 'jeg-har-aldri': ['Jeg har aldri', 'Never have I ever'], 'enten-eller': ['Enten eller', 'Would you rather'], 'kategorier': ['Kategorier', 'Categories'],
  'nodt-eller-sannhet': ['Nødt eller sannhet', 'Truth or dare'], 'sannhet-eller-drikk': ['Sannhet eller drikk', 'Truth or drink'], 'tanken-bak-sangen': ['Låtbekjennelsen', 'Song confessions'], 'rygg-mot-rygg': ['Rygg mot rygg', 'Back to back'], 'duoleken': ['Duoleken', 'The couples game'], '50-50': ['50/50', '50/50'],
  'ring-of-fire': ['Ring of Fire', 'Ring of Fire'], 'forraeder': ['Løgnhalsen', 'The liar'], 'mest': ['Mest sannsynlig', 'Most likely to (vote)'], 'bingo': ['Drikke-bingo', 'Drinking bingo'],
};
/** Lekene som kan spilles i rom, med navn, beskrivelse og moduser på valgt språk (standard norsk). */
export function lekeliste(lang: Lang | string = 'no') {
  const sp = rensLang(lang);
  return lekelisteRa(sp).map((l: any) => (PLUSS_ROM.includes(l.id) ? { ...l, pluss: true } : l));
}
function moduserFor(lek: string, lang: Lang) {
  const no = D[lek] ? D[lek].modes || [] : [];
  if (lang !== 'en') return no;
  const en = DE[lek] ? DE[lek].modes || [] : [];
  return no.map((m: any, i: number) => ({ ...m, t: (en[i] && en[i].v === m.v && en[i].t) || (en.find((x: any) => x.v === m.v) || {}).t || m.t }));
}
function eraTittel(id: string, lang: Lang) {
  const no = B.eras.find((e: any) => e.id === id);
  if (lang !== 'en') return no ? no.title : id;
  const en = BE.eras.find((e: any) => e.id === id);
  return (en && en.title) || (no ? no.title : id);
}
function lekelisteRa(lang: Lang) {
  const en = lang === 'en';
  const nv = (id: string) => (NAVN_L[id] ? NAVN_L[id][en ? 1 : 0] : id);
  const kort = KORTLEKER.filter((s) => D[s]).map((s) => ({ id: s, navn: nv(s), type: 'kort', moduser: moduserFor(s, lang) }));
  return [
    { id: 'mest', navn: nv('mest'), type: 'mest', moduser: moduserFor('pekeleken', lang), om: en ? 'Everyone votes for who it fits best. Every vote is one sip.' : 'Alle stemmer på hvem det passer best på. Hver stemme er én slurk.' },
    { id: 'forraeder', navn: nv('forraeder'), type: 'forraeder', moduser: moduserFor('forraeder', lang), om: en ? 'One player is secretly told to lie or tell the truth. Everyone else votes.' : 'Én får i hemmelighet beskjed om å lyve eller si sannheten. Resten stemmer.' },
    { id: 'bingo', navn: nv('bingo'), type: 'bingo', moduser: B.eras.map((e: any) => ({ v: e.id, t: eraTittel(e.id, lang) })), om: en ? 'Everyone gets their own board. The page calls it out when someone gets a line or bingo.' : 'Hver får sitt eget brett. Siden roper når noen får rekke eller bingo.' },
    { id: 'ring-of-fire', navn: nv('ring-of-fire'), type: 'kort', moduser: [{ v: 'ring', t: en ? '🔥 The ring – pull the cards out' : '🔥 Ringen – dra ut kortene' }, { v: 'enkel', t: en ? 'Simple – tap for the next card' : 'Enkel – trykk for neste kort' }],
      om: en ? 'The cards lie in a ring around a glass. Spin the ring and pull a card out slowly – pull too hard and the ring breaks, and you finish your drink.' : 'Kortene ligger i en ring rundt et glass. Snurr ringen og dra ut et kort forsiktig – drar du for hardt, ryker ringen og du må drikke opp.' },
    ...ekstraLeker(lang),
    ...kort.map((k) => ({ ...k, om: en ? 'Everyone sees the same card. Anyone can draw the next one.' : 'Alle ser samme kort. Hvem som helst kan trekke neste.' })),
    ...PAKKER.map((p) => ({ id: p.id, navn: en ? p.en.navn : p.navn, type: 'kort', moduser: [], pluss: true, om: en ? p.en.om + ' ' + p.antall + ' cards.' : p.om + ' ' + p.antall + ' kort.' })),
  ];
}
/** Navnet på en lek på begge språk (lagres i spill.navn). */
function lekNavnL(id: string): L | string {
  const no = lekeliste('no').find((x: any) => x.id === id), en = lekeliste('en').find((x: any) => x.id === id);
  return no ? L(no.navn, en && en.navn) : id;
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
    if (svar && svar.feil && !svar.lagre) return svar;
    const ny = await rpc('rom_lagre', { p_kode: kode, p_versjon: rom.versjon, p_data: data });
    // Noen feil skal likevel lagres (f.eks. at noen prøvde å bli med i et fullt rom, så verten ser det)
    if (ny !== null && ny !== undefined) return svar && svar.feil ? svar : { data, versjon: ny as number, svar };
  }
  return { feil: 'opptatt' as const };
}
export async function lagRom(navn: string, lek = '', modus = '', lang: Lang | string = 'no') {
  const vert = { id: nyId(), navn, pollett: nyPollett(), slurker: 0, lang: rensLang(lang) };
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

/** Modus vises med navnet («Snill»/«Mild»), ikke koden («snill»). */
function modusNavn(s: any, lang: Lang) {
  if (typeof s.modus !== 'string' || !s.modus || s.modus === '*') return s.modus;
  try {
    const l: any = lekeliste(lang).find((x: any) => x.id === s.lek);
    const m = l && (l.moduser || []).find((x: any) => x.v === s.modus);
    return m ? m.t : s.modus;
  } catch { return s.modus; }
}

/* ---------- kveldens kåringer ---------- */
/** Prisene når kvelden er over – regnet ut av det rommet allerede vet. */
export function kaaringer(data: any) {
  const l = data.spillere || [], ut: any[] = [];
  const navn = (id: string) => navnPaa(data, id);
  const maks = (felt: string) => { const m = l.slice().sort((a: any, b: any) => (b[felt] || 0) - (a[felt] || 0))[0]; return m && m[felt] ? m : null; };
  const k = data.kveld;
  if (k && k.vinner) ut.push({ ikon: '🏆', tittel: L('Kveldens vinner', 'Winner of the night'), id: k.vinner, navn: navn(k.vinner), tall: L((k.poeng[k.vinner] || 0) + ' kveldspoeng', (k.poeng[k.vinner] || 0) + ' night points') });
  const sum = l.reduce((n: number, p: any) => n + (p.slurker || 0), 0);
  const torst = maks('slurker'); if (torst) ut.push({ ikon: '🍺', tittel: L('Kveldens tørstigste', 'Thirstiest of the night'), id: torst.id, navn: torst.navn, tall: L(torst.slurker + ' slurker', torst.slurker + ' sips') });
  if (l.length >= 3 && sum) { const e = l.slice().sort((a: any, b: any) => (a.slurker || 0) - (b.slurker || 0))[0]; ut.push({ ikon: '😇', tittel: L('Slapp unna', 'Got away with it'), id: e.id, navn: e.navn, tall: L((e.slurker || 0) + ' slurker', (e.slurker || 0) + ' sips') }); }
  const brudd = (data.rekord && data.rekord.brudd) || {}, bId = Object.keys(brudd).sort((a, b) => brudd[b] - brudd[a])[0];
  if (bId && l.some((p: any) => p.id === bId)) ut.push({ ikon: '💥', tittel: L('Ringbryteren', 'The ring breaker'), id: bId, navn: navn(bId), tall: L(brudd[bId] + (brudd[bId] === 1 ? ' ring' : ' ringer'), brudd[bId] + (brudd[bId] === 1 ? ' ring' : ' rings')) });
  const b = data.bors;
  if (b) {
    const start = (id: string) => (b.startKr && b.startKr[id] != null ? b.startKr[id] : 1000);
    const formue = l.map((p: any) => ({ id: p.id, navn: p.navn, g: Math.round((b.saldo && b.saldo[p.id] != null ? b.saldo[p.id] : 1000) - start(p.id)) })).sort((x: any, y: any) => y.g - x.g);
    if (formue.length >= 2 && formue[0].g > 0) ut.push({ ikon: '📈', tittel: L('Børskongen', 'Market king'), id: formue[0].id, navn: formue[0].navn, tall: L('+' + formue[0].g + ' kr', '+' + formue[0].g + ' coins') });
    const bunn = formue[formue.length - 1]; if (formue.length >= 2 && bunn.g < 0) ut.push({ ikon: '💸', tittel: L('Gikk konkurs', 'Went bust'), id: bunn.id, navn: bunn.navn, tall: L(bunn.g + ' kr', bunn.g + ' coins') });
  }
  const gav = maks('sendt'); if (gav) ut.push({ ikon: '🎁', tittel: L('Mest gavmild', 'Most generous'), id: gav.id, navn: gav.navn, tall: L(gav.sendt + ' 🍺 sendt', gav.sendt + ' 🍺 sent') });
  const mob = maks('mottatt'); if (mob) ut.push({ ikon: '🎯', tittel: L('Mest mobbet', 'Most picked on'), id: mob.id, navn: mob.navn, tall: L(mob.mottatt + ' 🍺 fått', mob.mottatt + ' 🍺 received') });
  const quiz = maks('quiz'); if (quiz) ut.push({ ikon: '🧠', tittel: L('Quizmester', 'Quiz master'), id: quiz.id, navn: quiz.navn, tall: L(quiz.quiz + ' riktige', quiz.quiz + ' correct') });
  return ut;
}

/* ---------- storskjerm (TV) ---------- */
/** Verten lager en PIN som PC-en/TV-en bruker for å vise rommet. Storskjermen er ingen spiller og ser aldri hemmeligheter. */
export function skjermPinOk(data: any, pin: string) {
  const p = data && data.skjerm && data.skjerm.pin;
  if (!p || typeof pin !== 'string' || pin.length !== p.length) return false;
  let d = 0; for (let i = 0; i < p.length; i++) d |= p.charCodeAt(i) ^ pin.charCodeAt(i);
  return d === 0;
}
export function skjermVisning(data: any, versjon: number, sprak: Lang | string = 'no') {
  const lang = rensLang(sprak), s = data.spill;
  let spill: any = null;
  if (s) {
    spill = { type: s.type, lek: s.lek, navn: s.navn, runde: s.runde || null, frist: s.frist || null };
    if (s.type === 'kort') Object.assign(spill, { kort: s.kort, pos: s.pos, antall: s.rekke.length, konger: s.konger, makkere: s.makkere || [], velgMakker: s.velgMakker || null,
      turId: s.tur !== null && s.tur !== undefined ? (data.spillere[s.tur % Math.max(1, data.spillere.length)] || {}).id || null : null },
      s.ring ? { ring: true, tatt: s.tatt, nr: s.nr, brudd: s.brudd, ringBrutt: !!s.ringBrutt, bruddPlass: s.bruddPlass == null ? null : s.bruddPlass, igjen: s.rekke.length - s.tatt.length } : {});
    if (s.type === 'mest') Object.assign(spill, { tekst: s.tekst, fase: s.fase, stemt: Object.keys(s.stemmer || {}).length, resultat: s.fase === 'resultat' ? s.resultat : null });
    if (s.type === 'forraeder') Object.assign(spill, { tekst: s.tekst, fase: s.fase, aktiv: s.aktiv, stemt: Object.keys(s.stemmer || {}).length,
      resultat: s.fase === 'avslort' ? { svar: s.hemmelig, drikker: s.drikker } : null });
  }
  // Børsen: bare det som er offentlig – tavla, meldte og avgjorte aksjer og sakene. Aldri hendene til folk.
  let bors: any = null;
  const b = data.bors;
  if (b) {
    const bv: any = borsVisning(data, null);
    const synlig = (b.aksjer || []).filter((a: any) => a.status === 'meldt' || ((a.status === 'avgjort') && a.meldtT));
    bors = {
      paa: !!b.paa, tavle: bv ? bv.tavle : [], slutt: b.slutt || null,
      meldte: synlig.filter((a: any) => a.status === 'meldt').map((a: any) => ({ id: a.id, q: a.q, type: a.type, utfall: a.melding ? a.melding.utfall : null, av: a.melding ? a.melding.av : null })),
      avgjort: synlig.filter((a: any) => a.status === 'avgjort').slice(-4).reverse().map((a: any) => ({ id: a.id, q: a.q, type: a.type, vinner: a.vinner })),
      saker: (b.saker || []).map((x: any) => ({ id: x.id, mot: x.mot, fase: x.fase, dom: x.resultat ? !!x.resultat.dom : null })),
    };
  }
  const hd = data.hendelse;
  return {
    skjerm: true, versjon, vert: data.vert, lang, naa: Date.now(), laget: data.laget,
    spillere: data.spillere.map((p: any) => ({ id: p.id, navn: p.navn, slurker: p.slurker || 0 })),
    spill: lok(spill, lang), valgt: data.valgt ? { lek: data.valgt.lek, navn: tr(lekNavnL(data.valgt.lek), lang) } : null,
    hendelse: hd ? { nr: hd.nr, tekst: lang === 'en' && hd.en ? hd.en : tr(hd.tekst, lang) } : null,
    reak: data.reak || [], kveld: lok(kveldVisning(data), lang), bors: lok(bors, lang),
    alkoholfri: !!data.alkoholfri, ferdig: data.ferdig || null, kaaringer: data.ferdig ? lok(kaaringer(data), lang) : null,
    gjeng: data.gjeng ? { navn: data.gjeng.navn } : null,
    mester: data.mester ? { id: data.mester.id, til: data.mester.til } : null,
    vann: data.vann ? { nr: data.vann.nr, tid: data.vann.tid, t: tr(data.vann.t, lang) } : null,
  };
}

/* ---------- hva hver telefon får se ---------- */
/** Hva hver telefon får se. Språket er spillerens eget (meg.lang); uten spiller brukes `sprak`. */
export function visning(data: any, versjon: number, meg: any, sprak: Lang | string = 'no') {
  const lang: Lang = meg ? rensLang(meg.lang) : rensLang(sprak);
  const s = data.spill;
  let spill: any = null;
  if (s) {
    spill = { type: s.type, lek: s.lek, navn: s.navn, modus: modusNavn(s, lang), runde: s.runde, frist: s.frist || null, turStart: s.turNokkel ? s.turStart || null : null };
    if (s.type === 'kort') Object.assign(spill, { kort: s.kort, pos: s.pos, antall: s.rekke.length, tur: s.tur, konger: s.konger, makkere: s.makkere || [], velgMakker: s.velgMakker || null },
      s.ring ? { ring: true, tatt: s.tatt, nr: s.nr, brudd: s.brudd, ringBrutt: !!s.ringBrutt, bruddPlass: s.bruddPlass == null ? null : s.bruddPlass, sist: s.sist, turId: (data.spillere[s.tur % Math.max(1, data.spillere.length)] || {}).id || null, igjen: s.rekke.length - s.tatt.length } : {});
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
      era: s.era, tittel: typeof s.tittel === 'string' && lang === 'en' ? eraTittel(s.era, 'en') : s.tittel, spotify: s.spotify,
      mittBrett: meg && s.brett[meg.id] ? s.brett[meg.id].map((i: number) => s.sanger[i]) : null,
      mineMerker: meg && s.merket[meg.id] ? s.merket[meg.id] : null,
      rekker: s.rekker, bingo: s.bingo,
    });
  }
  const hd = data.hendelse;
  return {
    versjon, vert: data.vert, meg: meg ? meg.id : null, lang,
    spillere: data.spillere.map((p: any) => ({ id: p.id, navn: p.navn, medlem: !!p.konto, invitert: !!p.invitert, immun: p.immun || 0, slurker: p.slurker || 0, gi: p.gi || 0, sendt: p.sendt || 0, mottatt: p.mottatt || 0, quiz: p.quiz || 0, lang: rensLang(p.lang) })),
    spill: lok(spill, lang),
    hendelse: hd ? { nr: hd.nr, tekst: lang === 'en' && hd.en ? hd.en : tr(hd.tekst, lang) } : null,
    nr: data.nr, reak: data.reak || [], valgt: data.valgt || null, naa: Date.now(), hjul: data.hjul ? hjulVisning(data, lang) : null,
    hjulListe: data.hjulListe || (lang === 'en' ? HJUL_STANDARD_EN : HJUL_STANDARD), oppdrag: lok(oppdragVisning(data, meg), lang), bors: lok(borsVisning(data, meg), lang), pluss: data.pluss && data.pluss.til > Date.now() ? { til: data.pluss.til } : null, gratisPlasser: GRATIS_PLASSER, fullForsok: data.fullForsok || null, laget: data.laget, ferdig: data.ferdig || null, historikk: lok(data.historikk || [], lang),
    alkoholfri: !!data.alkoholfri, gjeng: data.gjeng ? { navn: data.gjeng.navn, kode: data.gjeng.kode, kveld: !!data.gjengKveld, regler: data.gjeng.regler || [] } : null,
    kveld: lok(kveldVisning(data), lang), plan: data.plan || null,
    kaaringer: data.ferdig ? lok(kaaringer(data), lang) : null,
    mester: data.mester ? { id: data.mester.id, til: data.mester.til } : null,
    vann: data.vann ? { nr: data.vann.nr, tid: data.vann.tid, t: tr(data.vann.t, lang) } : null,
    vannAv: !!data.vannAv, vannNeste: meg && meg.id === data.vert ? vannNeste(data) : null,
    skjermPin: meg && meg.id === data.vert && data.skjerm ? data.skjerm.pin : null,
    // Gjester som venter på å bli sluppet inn: bare verten og medlemmene ser dem
    venter: meg && (meg.id === data.vert || meg.konto) ? (data.venter || []).map((v: any) => ({ id: v.id, navn: v.navn })) : [],
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
  return feilL('vent', `Venter på ${mangler} ${mangler === 1 ? 'svar' : 'svar'} – eller ${sek} sekunder til tiden er ute.`,
    `Waiting for ${mangler} ${mangler === 1 ? 'answer' : 'answers'} – or ${sek} ${sek === 1 ? 'second' : 'seconds'} until time's up.`);
}
/** Hendelsen alle ser. Lagres på begge språk; visning() viser tekst på språket til den som ser på. */
function melde(data: any, tekst: string, en?: string) { data.nr = (data.nr || 0) + 1; data.hendelse = { nr: data.nr, tekst, en: en || tekst }; }
function navnPaa(data: any, id: string) { const p = data.spillere.find((x: any) => x.id === id); return p ? p.navn : '?'; }
function giSlurker(data: any, id: string, n: number, viaMakker = false) {
  const p = data.spillere.find((x: any) => x.id === id); if (!p) return;
  // Immunitet fra butikken: slipp neste gang du får slurker
  if (n > 0 && (p.immun || 0) > 0) { p.immun--; melde(data, `🛡️ ${p.navn} brukte immunitet og slapp ${n} ${n === 1 ? 'slurk' : 'slurker'}!`, `🛡️ ${p.navn} used immunity and skipped ${n} ${n === 1 ? 'sip' : 'sips'}!`); return; }
  p.slurker = Math.max(0, (p.slurker || 0) + n);
  // Makkere (8 i Ring of Fire): drikker du, drikker makkeren din også – og makkeren til makkeren
  if (!viaMakker && n > 0) makkereTil(data, id).forEach((m) => giSlurker(data, m, n, true));
}
/** Alle som henger sammen med spilleren gjennom makkerpar i leken som pågår (ikke spilleren selv). */
function makkereTil(data: any, id: string): string[] {
  const par: string[][] = (data.spill && data.spill.makkere) || [];
  if (!par.length) return [];
  const sett = new Set([id]), ko = [id];
  while (ko.length) { const x = ko.pop() as string; par.forEach(([a, b]) => { const y = a === x ? b : b === x ? a : null; if (y && !sett.has(y)) { sett.add(y); ko.push(y); } }); }
  sett.delete(id);
  return Array.from(sett).filter((m) => data.spillere.some((p: any) => p.id === m));
}
/** Gjengkveld: gi et nytt medlem startsaldoen sin fra gjengens lommebok hvis børsen er i gang. */
export function startSaldoFor(data: any, id: string, kr: any) { if (data.bors && kr != null) settStart(data, { [id]: Number(kr) }); }
/** Slurker spilleren har vunnet og kan sende til andre (🍺-knappen). */
function giUtdeling(data: any, id: string, n: number) { const p = data.spillere.find((x: any) => x.id === id); if (p) p.gi = Math.max(0, Math.min(99, (p.gi || 0) + n)); }

/** Kort id for et kort (fra den norske teksten) – brukes til å huske hva telefonen har sett før. */
export function kortId(k: any) {
  const t = String(k && k.t && typeof k.t === 'object' ? k.t.no : (k && k.t) || '');
  let h = 5381; for (let i = 0; i < t.length; i++) h = ((h << 5) + h + t.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}
/** Kort dere ikke har sett før kommer først – de dere har sett, havner (stokket) bakerst. */
function usetteForst(rekke: any[], sett?: Set<string> | null) {
  if (!sett || !sett.size) return rekke;
  const nye = rekke.filter((k) => !sett.has(kortId(k))), gamle = rekke.filter((k) => sett.has(kortId(k)));
  return nye.concat(gamle);
}
function kortstokkFor(lek: string, modus: string, sett?: Set<string> | null) {
  return lek === 'ring-of-fire' ? kortstokkRa(lek, modus) : usetteForst(kortstokkRa(lek, modus), sett);
}
function kortstokkRa(lek: string, modus: string) {
  if (lek === 'ring-of-fire') {
    const sorter = [['♥', 1], ['♦', 1], ['♠', 0], ['♣', 0]] as const;
    const verdier = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const kort: any[] = [];
    sorter.forEach(([s, rod]) => verdier.forEach((v) => kort.push({ v, s, rod })));
    return stokk(kort);
  }
  if (erPlussLek(lek)) {
    const id = lek.slice(6), pk = P[id], en = (PE[id] && PE[id].items) || [];
    return stokk(pk.items.map((x: any, i: number) => kortL(x, en[i])));
  }
  const d = D[lek], en = (DE[lek] && DE[lek].items) || [];
  const items = d.items.map((x: any, i: number) => [x, en[i]]).filter(([x]: any) => !modus || modus === '*' || (d.modes || []).length <= 1 || x.m === modus);
  return stokk(items.map(([x, e]: any) => kortL(x, e)));
}
/** Ett kort på begge språk: { t: {no, en}, k: {no, en} | '' }. */
function kortL(x: any, e: any) {
  const et = e && typeof e === 'object' ? e : null;
  return { t: L(x.t, et && et.t), k: x.k ? L(x.k, et && et.k) : '' };
}
/** Smakebiter: i rom uten Pluss dukker et par kort fra pakkene opp innimellom. */
function medSmakebiter(rekke: any[]) {
  const ut = rekke.slice(), ider = Object.keys(P);
  for (let n = 0; n < 2 && ider.length; n++) {
    // Bare de fem første kortene i hver pakke brukes som smakebiter, så pakkene ikke lekker ut
    const id = ider[tilfeldig(ider.length)], i = tilfeldig(Math.min(5, P[id].items.length)), it = P[id].items[i];
    const en = PE[id] && PE[id].items ? PE[id].items[i] : null, enNavn = (PE[id] && PE[id].navn) || P[id].navn;
    ut.splice(8 + tilfeldig(Math.max(1, ut.length - 8)), 0, { t: L(it.t, en && en.t), k: L('✨ Smakebit fra ' + P[id].navn + '-pakken', '✨ Sneak peek from the ' + enNavn + ' pack'), smak: true });
  }
  return ut;
}
const ROF_BRUDD = 5;   // slurker når ringen ryker («drikk opp»)
const KONGE_NR: [string, string][] = [['Første', 'First'], ['Andre', 'Second'], ['Tredje', 'Third'], ['Fjerde', 'Fourth']];
function visKort(s: any, data: any) {
  const k = s.rekke[s.pos];
  if (s.lek !== 'ring-of-fire') return { t: k.t, k: k.k, id: k.smak ? null : kortId(k) };
  const info = D['ring-of-fire'].kort[k.v], infoEn = (DE['ring-of-fire'] && DE['ring-of-fire'].kort && DE['ring-of-fire'].kort[k.v]) || info;
  let regel: any = L(info[0], infoEn[0]), tekst: any = L(info[1], infoEn[1]);
  if (k.v === 'K') {
    const nr = s.konger; const sl = D['ring-of-fire'].konger[Math.min(nr, 4) - 1];
    const kn = KONGE_NR[nr - 1] || ['Neste', 'Next'];
    regel = L(kn[0] + ' konge', kn[1] + ' king');
    tekst = L('Drikk ' + sl + ' slurker.' + (nr === 4 ? ' Det var siste konge!' : ''), 'Drink ' + sl + ' sips.' + (nr === 4 ? ' That was the last king!' : ''));
  }
  return { v: k.v === 'J' ? L('Kn', 'J') : (k.v === 'Q' ? L('D', 'Q') : k.v), s: k.s, rod: k.rod, regel, tekst, hvem: s.tur !== null ? navnPaa(data, data.spillere[s.tur]?.id) : null };
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

export function startSpill(data: any, lek: string, modus: string, sett?: Set<string> | null) {
  if (EKSTRA.includes(lek)) return startEkstra(data, lek, modus);
  const liste = lekeliste('no');
  const valgt = liste.find((x) => x.id === lek);
  if (!valgt) return { feil: 'ukjent-lek' };
  const navn = lekNavnL(lek);
  /** Tekstene i en kortstokk på begge språk, filtrert på modus. */
  const teksterL = (dekk: string) => {
    const en = (DE[dekk] && DE[dekk].items) || [];
    return D[dekk].items.map((x: any, i: number) => [x, en[i]]).filter(([x]: any) => !modus || modus === '*' || x.m === modus)
      .map(([x, e]: any) => L(x.t, e && e.t));
  };
  if (valgt.type === 'kort') {
    const plussRom = !!(data.pluss && data.pluss.til > Date.now());
    if ((valgt as any).pluss && !plussRom) return feilL('pluss', 'Denne pakken krever mittvors pluss.', 'This pack needs mittvors pluss.');
    let rekke = kortstokkFor(lek, modus, sett);
    if (!plussRom && !(valgt as any).pluss && lek !== 'ring-of-fire' && rekke.length > 12) rekke = medSmakebiter(rekke);
    if (!rekke.length) return { feil: 'tom' };
    data.spill = { type: 'kort', lek, navn, modus, rekke, pos: 0, tur: lek === 'ring-of-fire' ? 0 : null, konger: 0 };
    if (lek === 'ring-of-fire' && modus !== 'enkel') {
      // Ringen: alle 52 kortene ligger rundt glasset, og den som har tur drar ut et hvilket som helst kort
      Object.assign(data.spill, { ring: true, tatt: [], nr: 0, brudd: null, kort: null, sist: null });
    } else {
      if (lek === 'ring-of-fire' && rekke[0].v === 'K') data.spill.konger = 1;
      data.spill.kort = visKort(data.spill, data);
    }
  }
  if (valgt.type === 'mest') {
    const alle = teksterL('pekeleken');
    data.spill = { type: 'mest', lek, navn, modus, alle, kø: [] };
    nyMestRunde(data.spill);
  }
  if (valgt.type === 'forraeder') {
    if (data.spillere.length < 3) return feilL('for-faa', 'Løgnhalsen trenger minst tre spillere.', 'The liar needs at least three players.');
    const alle = teksterL('forraeder');
    data.spill = { type: 'forraeder', lek, navn, modus, alle, kø: [], aktiv: data.spillere[data.spillere.length - 1].id };
    nyForraederRunde(data.spill, data);
  }
  if (valgt.type === 'bingo') {
    const era = B.eras.find((e: any) => e.id === modus) || B.eras[0];
    const s: any = { type: 'bingo', lek, navn, modus: era.id, era: era.id, tittel: L(era.title, eraTittel(era.id, 'en')), spotify: era.spotify || '',
      sanger: era.songs.map((x: any) => [x[0], x[1]]), brett: {}, merket: {}, rekker: [], bingo: [] };
    data.spillere.forEach((p: any) => { s.brett[p.id] = nyttBrett(s); s.merket[p.id] = Array(16).fill(false); });
    data.spill = s;
  }
  melde(data, `Nytt spill: ${tr(navn, 'no')}`, `New game: ${tr(navn, 'en')}`);
  return { ok: true };
}

/** Hvem har tur akkurat nå (for «hopp over»)? null når ingen enkeltperson holder spillet. */
function turNokkel(s: any) {
  if (!s) return null;
  if (s.type === 'bussruta' && s.fase === 1) return 'b1:' + s.tur;
  if (s.type === 'yatzy' && !s.ferdig) return 'y:' + s.tur;
  if (s.type === 'overunder') return 'o:' + s.tur;
  if (s.type === 'kort' && s.ring) return 'r:' + s.tur + ':' + s.nr;
  return null;
}
const HOPP_ETTER = 40000;
/* ---------- Spørsmålsmesteren (bakgrunnslek) ---------- */
// Svarer du på et spørsmål fra spørsmålsmesteren, drikker du. Appen bytter mester av seg selv hvert 25. minutt.
const MESTER_MIN = 25;
function nyMester(data: any) {
  const ider = data.spillere.map((p: any) => p.id).filter((id: string) => !data.mester || id !== data.mester.id);
  if (!ider.length) return;
  data.mester = { id: ider[tilfeldig(ider.length)], til: Date.now() + MESTER_MIN * 60000 };
  melde(data, `❓ ${navnPaa(data, data.mester.id)} er ny spørsmålsmester – svarer du på et spørsmål fra hen, drikker du!`, `❓ ${navnPaa(data, data.mester.id)} is the new question master – answer one of their questions and you drink!`);
}
function sjekkMester(data: any) {
  const m = data.mester; if (!m) return;
  if (!data.spillere.some((p: any) => p.id === m.id) || Date.now() >= m.til) nyMester(data);
}
/* ---------- Vannrunde (bakgrunn) ----------
   Omtrent én gang i timen mens dere spiller: alle tar et glass vann. Kvelden varer lenger, og færre
   er ferdige før midnatt. Klokka starter når dere spiller, og nullstilles etter en lang pause uten lek.
   Verten kan ta en vannrunde når som helst («Vannrunde nå») – en grei måte å senke tempoet på uten
   å peke på noen – og slå av den automatiske under «Mer til kvelden». Ikke i alkoholfrie rom. */
const VANN_MIN = 60, VANN_PAUSE_MIN = 20;
const VANN_TEKST: [string, string][] = [
  ['Alle tar et glass vann. Sistemann ferdig velger neste låt.', 'Everyone drinks a glass of water. Last one done picks the next song.'],
  ['Leveren ba om fem minutter. Et glass vann før neste kort.', 'Your liver asked for five minutes. A glass of water before the next card.'],
  ['Skål i kranvann – Norges beste drikke, og helt gratis.', 'Cheers with tap water – the best drink there is, and it’s free.'],
  ['Et glass vann nå er en bedre morgen i morgen. Førstemann ferdig deler ut en slurk.', 'A glass of water now is a better morning tomorrow. First one done hands out a sip.'],
  ['Vann-skål! Alle reiser seg, sier «skål for leveren» og tømmer et glass vann.', 'Water toast! Everyone stands up, says “cheers to the liver” and empties a glass of water.'],
  ['Vannpause. Ingen drikker noe annet før alle glassene med vann er tomme.', 'Water break. Nobody drinks anything else until every glass of water is empty.'],
];
function vannrunde(data: any, naa: number) {
  data.vannFra = naa;
  const nr = ((data.vann && data.vann.nr) || 0) + 1, t = VANN_TEKST[(nr - 1) % VANN_TEKST.length];
  data.vann = { nr, tid: naa, t: L(t[0], t[1]) };
}
function sjekkVann(data: any) {
  if (data.vannAv || data.alkoholfri || !data.spill) return;
  const naa = Date.now();
  if (!data.vannFra || naa - (data.vannAktiv || 0) > VANN_PAUSE_MIN * 60000) data.vannFra = naa;   // første lek, eller lenge siden sist
  data.vannAktiv = naa;
  if (naa - data.vannFra >= VANN_MIN * 60000) vannrunde(data, naa);
}
/** Når kommer neste vannrunde av seg selv (for verten)? */
function vannNeste(data: any) {
  return data.vannAv || data.alkoholfri || !data.vannFra ? null : data.vannFra + VANN_MIN * 60000;
}
export function handling(data: any, meg: any, h: any) {
  sjekkMester(data);
  if (h.handling === 'vann-naa' || h.handling === 'vann-av' || h.handling === 'vann-paa') {
    if (meg.id !== data.vert) return { feil: 'bare-vert' };
    // To trykk rett etter hverandre gir ikke to vannrunder
    if (h.handling === 'vann-naa') { if (!data.vann || Date.now() - data.vann.tid > 30000) vannrunde(data, Date.now()); }
    else { data.vannAv = h.handling === 'vann-av'; if (!data.vannAv) data.vannFra = Date.now();
      melde(data, data.vannAv ? '💧 Vannrunden hver time er slått av' : '💧 Vannrunde omtrent hver time er slått på', data.vannAv ? '💧 The hourly water round is off' : '💧 A water round about every hour is on'); }
    return { ok: true };
  }
  if (h.handling === 'mester-paa' || h.handling === 'mester-bytt') {
    if (meg.id !== data.vert) return { feil: 'bare-vert' };
    if (data.spillere.length < 2) return feilL('for-faa', 'Spørsmålsmester trenger minst to spillere.', 'Question master needs at least two players.');
    nyMester(data); return { ok: true };
  }
  if (h.handling === 'mester-av') {
    if (meg.id !== data.vert) return { feil: 'bare-vert' };
    data.mester = null; melde(data, 'Spørsmålsmesteren er slått av', 'The question master is turned off'); return { ok: true };
  }
  const svar = handlingInne(data, meg, h);
  sjekkVann(data);   // etter handlingen: klokka starter med en gang leken er i gang
  const s = data.spill, n = turNokkel(s);
  if (s && n !== s.turNokkel) { s.turNokkel = n; s.turStart = n ? Date.now() : null; }
  return svar;
}
function hoppOver(data: any) {
  const s = data.spill, ider = aktiveIder(data);
  if (s.type === 'bussruta' && s.fase === 1) {
    const hvem = s.ider[s.tur]; s.steg = 0; s.tur++;
    s.melding = L(`${navnPaa(data, hvem)} ble hoppet over.`, `${navnPaa(data, hvem)} was skipped.`);
    if (s.tur >= s.ider.length) { s.fase = 2; s.pyr = []; for (let i = 0; i < 15; i++) s.pyr.push(brTrekk(s)); s.pyrPos = 0; s.sist = null; }
  } else if (s.type === 'yatzy') {
    const hvem = s.ider[s.tur], b = s.blokker[hvem], f = YZ_FELT.find((x) => b[x] == null);
    if (f) b[f] = 0;   // strøk et felt, så spillet fortsatt kan bli ferdig
    s.tur = (s.tur + 1) % s.ider.length; s.kast = 0; s.hold = [false, false, false, false, false];
    s.melding = L(`${navnPaa(data, hvem)} ble hoppet over (strøk ett felt).`, `${navnPaa(data, hvem)} was skipped (one box scratched).`);
    if (s.ider.every((id: string) => YZ_FELT.every((x) => s.blokker[id][x] != null))) {
      const liste = s.ider.map((id: string) => ({ id, navn: navnPaa(data, id), sum: yzSum(s.blokker[id]) })).sort((a: any, c: any) => c.sum - a.sum);
      s.ferdig = liste;
    }
  } else if (s.type === 'overunder') {
    s.tur = (s.tur + 1) % Math.max(1, ider.length);
  } else if (s.type === 'kort' && s.ring) {
    s.tur = (s.tur + 1) % Math.max(1, data.spillere.length);
  }
  melde(data, 'Hoppet over den som hadde tur', 'Skipped whoever had the turn');
}
function handlingInne(data: any, meg: any, h: any) {
  const s = data.spill;
  const erVert = meg.id === data.vert;
  if (h.handling === 'hopp-over') {
    if (!erVert) return { feil: 'bare-vert' };
    if (!s || !s.turStart || !turNokkel(s)) return { ok: true };
    if (Date.now() - s.turStart < HOPP_ETTER - 1000) return feilL('vent', 'Gi dem litt tid til.', 'Give them a bit more time.');
    hoppOver(data); return { ok: true };
  }
  if (h.handling === 'hjul') return spinnHjul(data, meg, h, erVert);
  // Bytt språk for denne spilleren ('no' | 'en'). 'lang' godtas også som alias.
  if (h.handling === 'sprak' || h.handling === 'lang') { meg.lang = rensLang(h.lang); return { ok: true }; }
  if (String(h.handling || '').startsWith('op-')) return oppdragHandling(data, meg, h, erVert);
  if (String(h.handling || '').startsWith('bs-')) {
    // Pluss i rommet låser opp hele børsen (også om den ble aktivert etter at børsen startet)
    const r = borsHandling(data, meg, { ...h, _borsFri: h._borsFri || romHarPluss(data) }, erVert);
    if (data.bors && romHarPluss(data)) borsTilPluss(data);   // Pluss etter start: fyll opp til det store markedet
    return r;
  }
  if (h.handling === 'hjul-liste') {
    if (!erVert) return { feil: 'bare-vert' };
    const l = (Array.isArray(h.liste) ? h.liste : []).map((x: any) => String(x || '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 60)).filter(Boolean).slice(0, 12);
    data.hjulListe = l.length >= 2 ? l : null; return { ok: true };
  }
  const ekstra = ['start', 'avslutt', 'fjern', 'nullstill', 'slurk', 'reager', 'send', 'velg-annen', 'avslutt-kvelden', 'fortsett-kvelden', 'pluss-aktiver', 'alkoholfri', 'gjeng', 'gjeng-meg', 'kv-vinner', 'lov-valg', 'slipp-inn', 'avvis-inn'].includes(h.handling) ? null : ekstraHandling(data, meg, h);
  if (ekstra) return ekstra;
  switch (h.handling) {
    case 'start': {
      if (!erVert) return { feil: 'bare-vert' };
      // Verten har Pluss (sjekket av API-ruta): lås opp rommet for kvelden
      if (h._plussTil > Date.now() && !(data.pluss && data.pluss.til > Date.now())) data.pluss = { til: Math.min(h._plussTil, Date.now() + 24 * 3600 * 1000) };
      if (h.lek !== 'egen' && erPlussLek(String(h.lek || '')) && !romHarPluss(data)) return feilL('pluss', 'Denne leken krever mittvors pluss hos verten.', 'This game needs the host to have mittvors pluss.');
      if (h.lek === 'lov') return feilL('ukjent-lek', 'Gjengens lov er ikke lenger et eget spill – vinneren av kvelden velger regel.', 'The Crew’s Law is no longer a separate game – the winner of the night picks a rule.');
      const forrige = data.spill;
      if (forrige) lekFerdig(data);
      const r = h.lek === 'egen' ? startEgen(data, h.kort, h.navn) : startSpill(data, String(h.lek || ''), String(h.modus || '*'), new Set((Array.isArray(h.sett) ? h.sett : []).slice(0, 2000).filter((x: any) => typeof x === 'string' && /^[0-9a-z]{1,8}$/.test(x))));
      if (!(r as any).feil && data.spill) { data.valgt = null; data.ferdig = null; data.historikk = (data.historikk || []).concat([data.spill.navn]).slice(-40); lekStartet(data); }
      return r;
    }
    case 'skjerm-lag': {
      if (!erVert) return { feil: 'bare-vert' };
      if (!data.skjerm || h.ny) { let pin = ''; for (let i = 0; i < 6; i++) pin += tilfeldig(10); data.skjerm = { pin, laget: Date.now() }; }
      return { ok: true };
    }
    case 'avslutt-kvelden': {
      if (!erVert) return { feil: 'bare-vert' };
      if (data.spill) lekFerdig(data);
      data.spill = null; data.valgt = null; data.ferdig = Date.now();
      // Gjengkveld: børsen stenges, formuen går til gjengens lommebok, og aksjer som mangler stemmer avgjøres på gjengsiden
      if (data.gjeng && data.bors) { const e = borsTilGjeng(data); if (e) kveld(data).eksport = e; }
      const vinner = kaarVinner(data);
      if (vinner) melde(data, `🏆 ${navnPaa(data, vinner)} vant kvelden!` + (data.gjeng ? ' Nå får hen velge en regel til lovboka.' : ''), `🏆 ${navnPaa(data, vinner)} won the night!` + (data.gjeng ? ' Now they get to pick a rule for the law book.' : ''));
      else melde(data, 'Kvelden er over – her er oppsummeringen!', "The night is over – here's the recap!");
      return { ok: true };
    }
    case 'fortsett-kvelden': {
      if (!erVert) return { feil: 'bare-vert' };
      data.ferdig = null; return { ok: true };
    }
    case 'pluss-aktiver': {
      // Serveren har allerede sjekket kontoen (h._plussTil settes bare av API-ruta)
      if (!erVert) return { feil: 'bare-vert' };
      if (!(h._plussTil > Date.now())) return feilL('pluss', 'Kontoen din har ikke Pluss akkurat nå.', "Your account doesn't have Pluss right now.");
      const hadde = !!(data.pluss && data.pluss.til > Date.now());
      data.pluss = { til: Math.min(h._plussTil, Date.now() + 24 * 3600 * 1000) };
      if (!hadde) melde(data, '✨ Rommet har Pluss i kveld – alle leker er låst opp!', '✨ The room has Pluss tonight – every game is unlocked!');
      return { ok: true };
    }
    case 'alkoholfri': {
      if (!erVert) return { feil: 'bare-vert' };
      data.alkoholfri = !!h.paa;
      melde(data, data.alkoholfri ? '🥤 Alkoholfri modus: slurker er straffepoeng i kveld' : 'Alkoholfri modus er skrudd av',
        data.alkoholfri ? '🥤 Alcohol-free mode: sips are penalty points tonight' : 'Alcohol-free mode is off');
      return { ok: true };
    }
    case 'gjeng': {
      // API-ruta har sjekket at verten er med i gjengen (h._gjeng settes bare der)
      if (!erVert) return { feil: 'bare-vert' };
      data.gjeng = h._gjeng && h._gjeng.id ? { id: h._gjeng.id, navn: h._gjeng.navn, kode: h._gjeng.kode, regler: Array.isArray(h._regler) ? h._regler : [] } : null;
      // Nytt valg av gjeng: medlemskap må sjekkes på nytt for alle (verten er sjekket nå)
      data.spillere.forEach((p: any) => { delete p.konto; });
      if (data.gjeng && h._konto) meg.konto = h._konto;
      if (data.gjeng) melde(data, `Kvelden telles i sesongen til ${data.gjeng.navn} 🏆`, `Tonight counts towards ${data.gjeng.navn}'s season 🏆`);
      return { ok: true };
    }
    case 'gjeng-meg': {
      // API-ruta har sjekket at kontoen er med i gjengen til rommet (h._konto settes bare der)
      if (!data.gjeng || !h._konto) return { ok: true };
      if (data.spillere.some((p: any) => p.konto === h._konto && p.id !== meg.id)) return feilL('konto', 'Kontoen din er allerede med i rommet på en annen telefon.', 'Your account is already in the room on another phone.');
      const ny = !meg.konto; meg.konto = h._konto;
      if (ny && h._ble) melde(data, `${meg.navn} ble med i gjengen ${data.gjeng.navn} 🤝`, `${meg.navn} joined the crew ${data.gjeng.navn} 🤝`);
      return { ok: true };
    }
    case 'kv-vinner': {
      if (!erVert) return { feil: 'bare-vert' };
      return velgVinner(data, h.hvem ? String(h.hvem) : null);
    }
    case 'lov-valg': {
      // Kveldens vinner velger regel. API-ruta skriver valget inn i lovboka etterpå.
      const k = kveld(data);
      if (!data.gjeng || !data.ferdig || k.vinner !== meg.id) return feilL('ikke-vinner', 'Bare kveldens vinner kan velge regel.', 'Only the winner of the night can pick a rule.');
      if (k.lovValg) return { ok: true };
      const type = ['ny', 'opphev', 'ingen'].includes(h.type) ? h.type : '';
      if (!type) return { feil: 'ukjent' };
      const tekst = String(h.tekst || '').replace(/[\u0000-\u001f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, MAKS_REGEL);
      if (type === 'ny' && tekst.length < 4) return feilL('kort', 'Skriv hele regelen.', 'Write the whole rule.');
      const regel = type === 'opphev' ? (data.gjeng.regler || []).find((x: any) => x.id === h.regel) : null;
      if (type === 'opphev' && !regel) return feilL('ukjent', 'Fant ikke regelen.', 'Couldn’t find that rule.');
      k.lovValg = { type, tekst: type === 'ny' ? tekst : regel ? regel.tekst : '', regel: regel ? regel.id : null, navn: meg.navn, lagret: false };
      melde(data, type === 'ny' ? `📜 ${meg.navn} innfører regelen «${tekst}»` : type === 'opphev' ? `🗑️ ${meg.navn} opphever regelen «${regel.tekst}»` : `🤷 ${meg.navn} lar lovboka være som den er`,
        type === 'ny' ? `📜 ${meg.navn} introduces the rule “${tekst}”` : type === 'opphev' ? `🗑️ ${meg.navn} repeals the rule “${regel.tekst}”` : `🤷 ${meg.navn} leaves the law book as it is`);
      return { ok: true };
    }
    case 'slipp-inn':
    case 'avvis-inn': {
      // Verten eller et medlem av gjengen slipper inn (eller avviser) en som venter
      if (!erVert && !meg.konto) return feilL('bare-medlem', 'Bare verten og medlemmer av gjengen kan slippe inn folk.', 'Only the host and crew members can let people in.');
      const i = (data.venter || []).findIndex((v: any) => v.id === h.hvem);
      if (i === -1) return { ok: true };
      const v = data.venter.splice(i, 1)[0];
      if (h.handling === 'avvis-inn') return { ok: true };
      const r: any = leggTil(data, v, v.navn);
      if (r.feil) { data.venter.splice(i, 0, v); return r; }
      if (h.som === 'medlem') r.spiller.invitert = true;
      melde(data, `${r.spiller.navn} ble sluppet inn av ${meg.navn}` + (h.som === 'medlem' ? ' – og er invitert inn i gjengen' : ''), `${r.spiller.navn} was let in by ${meg.navn}` + (h.som === 'medlem' ? ' – and invited to join the crew' : ''));
      return { ok: true };
    }
    case 'velg-annen': {
      if (!erVert) return { feil: 'bare-vert' };
      data.valgt = null; return { ok: true };
    }
    case 'avslutt': {
      if (!erVert) return { feil: 'bare-vert' };
      if (data.spill) lekFerdig(data);
      data.spill = null; melde(data, 'Tilbake i lobbyen', 'Back in the lobby'); return { ok: true };
    }
    case 'fjern': {
      const hvem = String(h.hvem || '');
      if (!erVert || !hvem || hvem === data.vert) return { feil: 'bare-vert' };
      const p = data.spillere.find((x: any) => x.id === hvem); if (!p) return { ok: true };
      data.spillere = data.spillere.filter((x: any) => x.id !== hvem);
      // Reparer leker der den som ble fjernet, holdt spillet
      if (s && data.spillere.length) {
        const forste = data.spillere[0].id;
        if (s.type === 'opus' && s.holder === hvem) s.holder = forste;
        if (s.type === 'tosannheter' && s.aktiv === hvem) Object.assign(s, { aktiv: forste, fase: 'skriv', pastander: [], stemmer: {}, logn: -1 });
        if (s.type === 'forraeder' && s.aktiv === hvem) nyForraederRunde(s, data);
        if (typeof s.tur === 'number' && Array.isArray(s.ider)) {
          const i = s.ider.indexOf(hvem);
          if (i !== -1 && s.type !== 'yatzy' && s.type !== 'bussruta') { s.ider.splice(i, 1); if (s.tur > i) s.tur--; }
          if (s.tur >= s.ider.length) s.tur = 0;
        }
        if (s.type === 'president' || s.type === 'overunder') { const n = aktiveIder(data).length; if (s.tur >= n) s.tur = 0; }
        if (s.hender && s.hender[hvem]) delete s.hender[hvem];
      }
      melde(data, `${p.navn} ble fjernet`, `${p.navn} was removed`); return { ok: true };
    }
    case 'slurk': {
      // Poengtavla: alle kan føre sine egne slurker, verten kan rette på alle
      const hvem = String(h.hvem || meg.id);
      if (hvem !== meg.id && !erVert) return feilL('bare-vert', 'Bare verten kan endre andres slurker.', "Only the host can change other people's sips.");
      const p = data.spillere.find((x: any) => x.id === hvem); if (!p) return { ok: true };
      const n = Number(h.n) === -1 ? -1 : 1;
      p.slurker = Math.max(0, Math.min(999, (p.slurker || 0) + n));
      return { ok: true };
    }
    case 'reager':
    case 'send': {
      const naa = Date.now();
      if (meg.sistR && naa - meg.sistR < 900) return feilL('for-fort', 'Rolig nå 😄', 'Easy there 😄');
      const reak: any = { fra: meg.id };
      if (h.handling === 'reager') {
        if (!REAKSJONER.includes(h.e)) return { feil: 'ukjent' };
        reak.e = h.e;
      } else {
        const til = data.spillere.find((x: any) => x.id === h.hvem);
        if (!til || til.id === meg.id) return { feil: 'ukjent' };
        if (!(meg.gi > 0)) return feilL('tomt', 'Du har ingen slurker å dele ut. Vinn noe først!', 'You have no sips to give out. Win something first!');
        meg.gi--; reak.e = '🍺'; reak.til = til.id;
        if ((til.immun || 0) > 0) { til.immun--; reak.e = '🛡️'; melde(data, `🛡️ ${til.navn} brukte immunitet mot slurken fra ${meg.navn}!`, `🛡️ ${til.navn} used immunity against ${meg.navn}’s sip!`); }
        else til.slurker = (til.slurker || 0) + 1;
        meg.sendt = (meg.sendt || 0) + 1; til.mottatt = (til.mottatt || 0) + 1;
      }
      meg.sistR = naa;
      data.reakNr = (data.reakNr || 0) + 1; reak.nr = data.reakNr;
      data.reak = (data.reak || []).concat([reak]).slice(-12);
      return { ok: true };
    }
    case 'nullstill': {
      if (!erVert) return { feil: 'bare-vert' };
      data.spillere.forEach((p: any) => { p.slurker = 0; p.gi = 0; }); melde(data, 'Slurketelleren er nullstilt', 'The sip counter has been reset'); return { ok: true };
    }
    case 'rof-makker': {
      if (!s || s.type !== 'kort' || s.lek !== 'ring-of-fire' || !s.velgMakker) return { ok: true };
      if (meg.id !== s.velgMakker && !erVert) return feilL('ikke-tur', 'Det er den som trakk åtteren som velger makker.', 'Whoever drew the eight picks the mate.');
      const paa = String(h.paa || '');
      if (!data.spillere.some((p: any) => p.id === paa) || paa === s.velgMakker) return feilL('ugyldig', 'Velg en annen spiller.', 'Pick another player.');
      s.makkere = (s.makkere || []).filter(([a, b]: string[]) => !((a === s.velgMakker && b === paa) || (a === paa && b === s.velgMakker)));
      s.makkere.push([s.velgMakker, paa]);
      melde(data, `🤝 ${navnPaa(data, s.velgMakker)} og ${navnPaa(data, paa)} er makkere – drikker den ene, drikker den andre!`, `🤝 ${navnPaa(data, s.velgMakker)} and ${navnPaa(data, paa)} are mates – when one drinks, so does the other!`);
      s.velgMakker = null;
      return { ok: true };
    }
    case 'rof-trekk': {
      if (!s || s.type !== 'kort' || !s.ring) return { feil: 'feil-spill' };
      // (Samme kort to ganger avvises under – så et dobbelt trykk eller en telefon som henger litt etter gjør ingen skade)
      const tur = data.spillere[s.tur % Math.max(1, data.spillere.length)];
      if (tur && tur.id !== meg.id && !erVert) return feilL('ikke-tur', 'Det er ikke din tur å trekke.', "It's not your turn to draw.");
      const plass = Math.round(Number(h.plass));
      if (!(plass >= 0 && plass < s.rekke.length) || s.tatt.includes(plass)) return { ok: true };
      const hvem = tur ? tur.id : meg.id;
      s.tatt.push(plass); s.pos = plass; s.nr++; s.sist = plass;
      const v = s.rekke[plass].v;
      if (v === 'K') s.konger++;
      s.kort = visKort(s, data);
      // Ringen røk: drikk opp glasset (føres som 5 slurker), og ringen lappes sammen igjen
      // Ringen kan bare brytes én gang – etter det er det bare å trekke videre
      if (h.brutt === true && !s.ringBrutt) {
        s.ringBrutt = true; s.bruddPlass = plass;
        s.brudd = { hvem, nr: s.nr, navn: navnPaa(data, hvem) };
        giSlurker(data, hvem, ROF_BRUDD);
        melde(data, `💥 ${navnPaa(data, hvem)} brøt ringen – drikk opp glasset! Resten av ringen er trygg.`, `💥 ${navnPaa(data, hvem)} broke the ring – finish your drink! The rest of the ring is safe.`);
      }
      if (v === 'K') giSlurker(data, hvem, D['ring-of-fire'].konger[Math.min(s.konger, 4) - 1] || 5);
      if (v === '3') giSlurker(data, hvem, 1);
      if (v === '2') giUtdeling(data, hvem, 1);
      s.velgMakker = v === '8' && data.spillere.length >= 2 ? hvem : null;   // 8: den som trakk, velger makker
      if (h.brutt === true && s.brudd && s.brudd.nr === s.nr) { data.rekord = data.rekord || {}; const r = data.rekord.brudd || (data.rekord.brudd = {}); r[hvem] = (r[hvem] || 0) + 1; }
      s.tur = (s.tur + 1) % Math.max(1, data.spillere.length);
      // Tomt for kort: ny ring
      if (s.tatt.length >= s.rekke.length) {
        s.rekke = kortstokkFor(s.lek, s.modus); s.tatt = []; s.konger = 0; s.ringBrutt = false; s.bruddPlass = null;
        melde(data, '🔥 Ringen er tom – en ny ring er lagt ut', '🔥 The ring is empty – a new ring is laid out');
      }
      return { ok: true };
    }
    case 'neste': {
      if (!s || s.type !== 'kort') return { feil: 'feil-spill' };
      if (s.ring) return { ok: true };
      if (typeof h.pos === 'number' && h.pos !== s.pos) return { ok: true }; // noen andre trykket samtidig
      s.pos++;
      if (s.pos >= s.rekke.length) { s.rekke = kortstokkFor(s.lek, s.modus); s.pos = 0; s.konger = 0; melde(data, 'Stokket på nytt', 'Reshuffled'); }
      if (s.tur !== null) s.tur = (s.tur + 1) % Math.max(1, data.spillere.length);
      if (s.lek === 'ring-of-fire' && s.rekke[s.pos].v === 'K') s.konger++;
      s.kort = visKort(s, data);
      if (s.lek === 'ring-of-fire' && s.tur !== null) {
        // Poengtavla fylles av seg selv: konger og «3 Me» drikker, «2 You» gir en slurk å dele ut
        const hvem = data.spillere[s.tur] && data.spillere[s.tur].id, v = s.rekke[s.pos].v;
        if (hvem && v === 'K') giSlurker(data, hvem, D['ring-of-fire'].konger[Math.min(s.konger, 4) - 1] || 5);
        if (hvem && v === '3') giSlurker(data, hvem, 1);
        if (hvem && v === '2') giUtdeling(data, hvem, 1);
        s.velgMakker = hvem && v === '8' && data.spillere.length >= 2 ? hvem : null;
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
      if (m.every(Boolean) && !s.bingo.includes(meg.id)) { s.bingo.push(meg.id); melde(data, `BINGO for ${meg.navn}! Alle andre drikker opp.`, `BINGO for ${meg.navn}! Everyone else finishes their drink.`); }
      else if (etter > foer) { s.rekker.push(meg.id); giUtdeling(data, meg.id, 2); melde(data, `${meg.navn} fikk rekke! Del ut to slurker.`, `${meg.navn} got a line! Give out two sips.`); }
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
  if (liste[0]) melde(data, `${liste[0].navn} fikk flest stemmer (${liste[0].stemmer})`, `${liste[0].navn} got the most votes (${liste[0].stemmer})`);
}
function avgjorForraeder(data: any) {
  const s = data.spill;
  const feil = Object.entries(s.stemmer).filter(([, v]) => v !== s.hemmelig).map(([id]) => id);
  const antallStemmer = Object.keys(s.stemmer).length;
  s.drikker = [];
  if (antallStemmer && feil.length === 0) { giSlurker(data, s.aktiv, 3); s.drikker.push({ id: s.aktiv, navn: navnPaa(data, s.aktiv), slurker: 3 }); }
  feil.forEach((id) => { giSlurker(data, id, 2); s.drikker.push({ id, navn: navnPaa(data, id), slurker: 2 }); });
  s.fase = 'avslort';
  melde(data, `${navnPaa(data, s.aktiv)} ${s.hemmelig === 'lyv' ? 'løy' : 'sa sannheten'}!`, `${navnPaa(data, s.aktiv)} ${s.hemmelig === 'lyv' ? 'lied' : 'told the truth'}!`);
}

/** Kvelden slik den lagres i sesongtabellen til en gjeng: bare navn og tall. */
export function kveldForGjeng(data: any) {
  return {
    spillere: data.spillere.map((p: any) => ({ navn: p.navn, slurker: p.slurker || 0, quiz: p.quiz || 0, sendt: p.sendt || 0, mottatt: p.mottatt || 0 })),
    leker: (data.historikk || []).slice(-40).map((x: any) => tr(x, 'no')),
    minutter: Math.max(1, Math.round(((data.ferdig || Date.now()) - (data.laget || Date.now())) / 60000)),
    alkoholfri: !!data.alkoholfri,
  };
}

/* ---------- inn i rommet ---------- */
/** Gjengkveld: den som ikke er medlem, venter på at verten eller et medlem slipper hen inn. */
export function venteInn(data: any, navn: string, lang: Lang | string = 'no') {
  data.venter = (data.venter || []).filter((v: any) => Date.now() - v.t < 6 * 3600 * 1000).slice(-9);
  const v = { id: nyId(), navn, pollett: nyPollett(), lang: rensLang(lang), t: Date.now() };
  data.venter.push(v);
  melde(data, `🚪 ${navn} vil bli med – slipp inn?`, `🚪 ${navn} wants to join – let them in?`);
  return { spiller: v };
}
export function finnVenter(data: any, id: string, pollett: string) {
  const v = (data.venter || []).find((x: any) => x.id === id);
  return v && v.pollett === pollett ? v : null;
}
export function blimed(data: any, navn: string, lang: Lang | string = 'no') {
  return leggTil(data, { id: nyId(), pollett: nyPollett(), lang: rensLang(lang) }, navn);
}
function leggTil(data: any, fra: { id: string; pollett: string; lang: string }, navn: string) {
  if (data.spillere.length >= MAKS_SPILLERE) return { feil: 'fullt' };
  if (data.spillere.length >= GRATIS_PLASSER && !romHarPluss(data)) {
    data.fullForsok = Date.now();
    return feilL('fullt-gratis', `Rommet er fullt – gratisversjonen har plass til ${GRATIS_PLASSER} telefoner. Be verten låse opp med Pluss, så kan dere bli opptil ${MAKS_SPILLERE}.`,
      `The room is full – the free version has room for ${GRATIS_PLASSER} phones. Ask the host to unlock Pluss and you can be up to ${MAKS_SPILLERE}.`, { lagre: true });
  }
  let n = navn, i = 2;
  while (data.spillere.some((p: any) => p.navn.toLowerCase() === n.toLowerCase())) n = `${navn} ${i++}`;
  const p: any = { id: fra.id, navn: n, pollett: fra.pollett, slurker: 0, lang: rensLang(fra.lang) };
  data.spillere.push(p);
  const s = data.spill;
  if (s && s.type === 'bingo') { s.brett[p.id] = nyttBrett(s); s.merket[p.id] = Array(16).fill(false); }
  if (data.oppdrag && data.oppdrag.paa) nyttOppdrag(data, p.id);
  nySpillerIBors(data, p.id);
  melde(data, `${n} ble med`, `${n} joined`);
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
export const SOS = ['hvemskrev', 'bloff', 'samme', 'spion', 'skal', 'pannekort'];
export const EKSTRA = ['opus', 'overunder', 'veddelopet', 'pyramiden', 'gris', 'president', 'regelfabrikken', 'tosannheter', 'bussruta', 'yatzy', 'nyhetsrunden', ...SOS];
export const REAKSJONER = ['🍻', '😂', '🔥', '😱', '👏', '🫡'];
type EkstraInfo = [id: string, navnNo: string, navnEn: string, omNo: string, omEn: string];
const EKSTRA_INFO: EkstraInfo[] = [
  ['hvemskrev', 'Ukjent avsender', 'Unknown sender', 'Alle svarer anonymt på samme spørsmål. Så gjetter dere hvem som skrev hva.', 'Everyone answers the same question anonymously. Then you guess who wrote what.'],
  ['bloff', 'Skrøna', 'Tall tales', 'Finn på et troverdig feil svar. Lur de andre – og finn det ekte.', 'Make up a believable wrong answer. Fool the others – and spot the real one.'],
  ['samme', 'Saueflokken', 'The herd', 'Alle skriver ett ord i hemmelighet. Unike svar drikker.', 'Everyone secretly writes one word. Unique answers drink.'],
  ['spion', 'Muldvarpen', 'The mole', 'Alle vet hvor dere er – bortsett fra muldvarpen. Still spørsmål og avslør hen.', 'Everyone knows where you are – except the mole. Ask questions and unmask them.'],
  ['pannekort', 'Hvem er jeg?', 'Who am I?', 'Skriv et ord til den du får tildelt. Du ser alles ord – bortsett fra ditt eget.', "Write a word for the person you're assigned. You see everyone's word – except your own."],
  ['skal', 'Skålsprinten', 'Cheers sprint', 'Trykk når det står SKÅL! Treigest drikker. For tidlig drikker dobbelt.', 'Tap when it says CHEERS! Slowest drinks. Too early drinks double.'],
  ['bussruta', 'Bussruta', 'Ride the bus', 'Fire spørsmål hver på egen telefon, så pyramiden – og taperen kjører bussen.', 'Four questions each on your own phone, then the pyramid – and the loser rides the bus.'],
  ['yatzy', 'Drikke-Yatzy', 'Drinking Yahtzee', 'Trill på din telefon når det er din tur. Alle ser terningene og blokka.', "Roll on your phone when it's your turn. Everyone sees the dice and the scorecard."],
  ['tosannheter', 'To sannheter og en løgn', 'Two truths and a lie', 'Én skriver tre påstander i hemmelighet. Resten stemmer på løgnen fra sin telefon.', 'One player secretly writes three statements. Everyone else votes for the lie on their phone.'],
  ['regelfabrikken', 'Hjemmesnekra', 'Homemade', 'Alle skriver så mange drikkekort de rekker på sin telefon. Så stokkes alt og trekkes.', 'Everyone writes as many drinking cards as they can on their phone. Then it all gets shuffled and drawn.'],
  ['overunder', 'Over eller under', 'Higher or lower', 'Den som har tur gjetter på sin telefon. Feil = drikk hele bunken.', 'Whoever has the turn guesses on their phone. Wrong = drink the whole pile.'],
  ['veddelopet', 'Veddeløpet', 'Horse race', 'Alle vedder på sin telefon, så kjøres løpet.', 'Everyone bets on their phone, then the race is on.'],
  ['pyramiden', 'Pyramiden', 'Pyramid', 'Fire skjulte kort hver. Bløff eller si sannheten – og utfordre de andre.', 'Four hidden cards each. Bluff or tell the truth – and call out the others.'],
  ['gris', 'Gris', 'Pig', 'Send kort til venstre til noen har fire like. Sistemann på nesa drikker.', 'Pass cards to the left until someone has four of a kind. Last one to touch their nose drinks.'],
  ['president', 'President', 'President', 'Bli kvitt kortene først. Toere er høyest og rydder bordet.', 'Get rid of your cards first. Twos are highest and clear the table.'],
  ['opus', 'Opus', 'Opus', '', ''],
];
const EKSTRA_NAVN: Record<string, L> = Object.fromEntries(EKSTRA_INFO.map((x) => [x[0], L(x[1], x[2])]));
EKSTRA_NAVN.nyhetsrunden = L('Nyhetsrunden', 'Nyhetsrunden (Norwegian news quiz)');
export function ekstraLeker(lang: Lang | string = 'no') {
  const en = rensLang(lang) === 'en';
  // Alle publiserte uker kan spilles i rom – de nyeste som knapper, resten fra arkivet
  const nr = publiserteRunder().slice(0, 150).map((r: any) => ({ v: rundeId(r), t: (en ? 'Week ' : 'Uke ') + r.uke + (r.aar !== new Date().getFullYear() ? ' ' + r.aar : '') }));
  const info = (id: string, moduser: any[] = []) => {
    const x = EKSTRA_INFO.find((y) => y[0] === id)!;
    return { id, navn: en ? x[2] : x[1], type: id, moduser, om: en ? x[4] : x[3] };
  };
  const sek = en ? 'sec' : 'sek';
  return [
    ...(nr.length ? [{ id: 'nyhetsrunden', navn: tr(EKSTRA_NAVN.nyhetsrunden, en ? 'en' : 'no'), type: 'nyhetsrunden', moduser: nr,
      om: en ? "The host reads out this week's questions and everyone answers on their own phone – then you see who missed. The questions are in Norwegian." : 'Verten leser opp ukas spørsmål. Alle svarer på sin egen telefon – så ser dere hvem som bommet.' }] : []),
    info('hvemskrev'), info('bloff'), info('samme'), info('spion'), info('pannekort'), info('skal'), info('bussruta'), info('yatzy'), info('tosannheter'),
    info('regelfabrikken', [{ v: '45', t: '45 ' + sek }, { v: '60', t: '60 ' + sek }, { v: '90', t: '90 ' + sek }]),
    info('overunder'), info('veddelopet'), info('pyramiden'), info('gris'), info('president'),
  ];
}
function kortstokk52() { const s: any[] = []; ['♥', '♦', '♠', '♣'].forEach((f) => { for (let v = 2; v <= 14; v++) s.push({ v, f }); }); return stokk(s); }
function vnavn(v: number) { return v <= 10 ? String(v) : ({ 11: 'Kn', 12: 'D', 13: 'K', 14: 'A' } as any)[v]; }
function vnavnEn(v: number) { return v <= 10 ? String(v) : ({ 11: 'J', 12: 'Q', 13: 'K', 14: 'A' } as any)[v]; }
function aktiveIder(data: any, alle = false) {
  const ider = data.spillere.map((p: any) => p.id);
  // I leker med kort på hånda sitter de som kom inn midt i en runde over til neste runde
  const h = !alle && data.spill && data.spill.hender;
  return h ? ider.filter((id: string) => h[id]) : ider;
}

export function startEkstra(data: any, lek: string, modus = ''): any {
  const n = data.spillere.length, ider = aktiveIder(data, true);
  if (lek === 'bussruta' || lek === 'yatzy' || lek === 'nyhetsrunden') return startNye(data, lek, modus, ider);
  if (SOS.includes(lek)) return startSos(data, lek, ider);
  if (lek === 'tosannheter') {
    if (n < 2) return feilL('for-faa', 'Trenger minst to spillere.', 'Needs at least two players.');
    data.spill = { type: 'tosannheter', lek, navn: EKSTRA_NAVN.tosannheter, aktiv: ider[0], fase: 'skriv', pastander: [], logn: -1, stemmer: {}, runde: 1 };
  } else   if (lek === 'regelfabrikken') {
    const sek = [45, 60, 90].includes(Number(modus)) ? Number(modus) : 60;
    data.spill = { type: 'regelfabrikken', lek, navn: EKSTRA_NAVN.regelfabrikken, modus: L(sek + ' sek', sek + ' sec'), fase: 'klar', frist: null, sek, kort: {}, med: {}, rekke: [], pos: 0 };
  } else   if (lek === 'opus') {
    data.spill = { type: 'opus', lek, navn: EKSTRA_NAVN.opus, holder: ider[0], kast: null, antall: 0, nr: 0 };
  } else if (lek === 'overunder') {
    const st = kortstokk52();
    data.spill = { type: 'overunder', lek, navn: EKSTRA_NAVN.overunder, stokk: st, kort: st.pop(), bunke: 1, tur: 0, sist: null };
  } else if (lek === 'veddelopet') {
    const st = kortstokk52().filter((k: any) => k.v !== 14);
    data.spill = { type: 'veddelopet', lek, navn: EKSTRA_NAVN.veddelopet, fase: 'vedd', veddemaal: {}, stokk: st, bane: st.splice(0, 7), snudd: [], pos: { '♥': 0, '♠': 0, '♦': 0, '♣': 0 }, sist: null, vinner: null };
    settFrist(data.spill, FRIST.veddelopet);
  } else if (lek === 'pyramiden') {
    if (n < 2) return feilL('for-faa', 'Pyramiden trenger minst to spillere.', 'Pyramid needs at least two players.');
    const st = kortstokk52();
    const hender: any = {}; ider.forEach((id: string) => { hender[id] = st.splice(0, 4); });
    data.spill = { type: 'pyramiden', lek, navn: EKSTRA_NAVN.pyramiden, hender, pyr: st.splice(0, 15), pos: 0, pastander: [] };
  } else if (lek === 'gris') {
    if (n < 3) return feilL('for-faa', 'Gris trenger minst tre spillere.', 'Pig needs at least three players.');
    data.spill = { type: 'gris', lek, navn: EKSTRA_NAVN.gris, bokstaver: {} };
    nyGrisRunde(data);
  } else if (lek === 'president') {
    if (n < 3) return feilL('for-faa', 'President trenger minst tre spillere.', 'President needs at least three players.');
    nyPresidentRunde(data, null);
  } else return { feil: 'ukjent-lek' };
  melde(data, `Nytt spill: ${tr(data.spill.navn, 'no')}`, `New game: ${tr(data.spill.navn, 'en')}`);
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
  data.spill = { type: 'president', lek: 'president', navn: EKSTRA_NAVN.president, hender, bord: [], bordAv: null, pass: [], tur: 0,
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
  if (SOS.includes(s.type)) return sosHandling(data, meg, h);
  const ider = aktiveIder(data);
  const min = ider.indexOf(meg.id);
  switch (s.type) {
    case 'tosannheter': {
      if (h.handling === 'pastander') {
        if (meg.id !== s.aktiv || s.fase !== 'skriv') return { ok: true };
        const p = (Array.isArray(h.p) ? h.p : []).map((x: any) => String(x || '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 120));
        const l = Number(h.logn);
        if (p.length !== 3 || p.some((x: string) => !x) || !(l >= 0 && l < 3)) return feilL('ugyldig', 'Skriv tre påstander og merk løgnen.', 'Write three statements and mark the lie.');
        const rekkef = stokk([0, 1, 2]);
        s.pastander = rekkef.map((i) => p[i]); s.logn = rekkef.indexOf(l); s.fase = 'stem'; s.stemmer = {}; settFrist(s, FRIST.tosannheter);
        melde(data, `${meg.navn} har skrevet – hvilken er løgnen?`, `${meg.navn} is done writing – which one is the lie?`); return { ok: true };
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
        if (meg.id !== data.vert) return feilL('bare-vert', 'Verten starter klokka.', 'The host starts the clock.');
        s.fase = 'skriv'; s.frist = Date.now() + s.sek * 1000 + 3000;
        melde(data, 'Klokka går – skriv!', 'The clock is running – write!');
        return { ok: true };
      }
      if (h.handling === 'skriv') {
        if (s.fase !== 'skriv') return feilL('for-sent', 'Tiden er ute!', "Time's up!");
        if (Date.now() > s.frist + 2000) return feilL('for-sent', 'Tiden er ute!', "Time's up!");
        const tekst = String(h.tekst || '').replace(/[\u0000-\u001f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 140);
        if (!tekst) return { ok: true };
        const mine = s.kort[meg.id] || (s.kort[meg.id] = []);
        if (mine.length >= 40) return feilL('fullt', 'Maks 40 kort hver.', 'Max 40 cards each.');
        mine.push(tekst); return { ok: true };
      }
      if (h.handling === 'rf-legg-til') {
        // Kort fra egne lagrede kortstokker, tatt med før eller mens klokka går
        if (s.fase !== 'klar' && s.fase !== 'skriv') return feilL('for-sent', 'Kortene er allerede stokket.', 'The cards have already been shuffled.');
        const nye = rensKort(h.kort);
        const med = s.med || (s.med = {}); const mine = med[meg.id] || (med[meg.id] = []);
        nye.forEach((t) => { if (mine.length < 60 && !mine.includes(t)) mine.push(t); });
        return { ok: true };
      }
      if (h.handling === 'stokk') {
        if (s.fase !== 'skriv') return { ok: true };
        if (Date.now() < s.frist - 3000 && meg.id !== data.vert) return feilL('bare-vert', 'Vent til tiden er ute.', "Wait until time's up.");
        const alle: string[] = []; Object.values(s.kort).forEach((l: any) => l.forEach((t: string) => alle.push(t)));
        Object.values(s.med || {}).forEach((l: any) => l.forEach((t: string) => alle.push(t)));
        if (!alle.length) return feilL('tom', 'Ingen har skrevet noe ennå.', "Nobody has written anything yet.");
        s.rekke = stokk(alle); s.pos = 0; s.fase = 'trekk';
        melde(data, alle.length + ' kort er stokket. Trekk!', alle.length + (alle.length === 1 ? ' card' : ' cards') + ' shuffled. Draw!');
        return { ok: true };
      }
      if (h.handling === 'neste') {
        if (s.fase !== 'trekk') return { ok: true };
        if (typeof h.pos === 'number' && h.pos !== s.pos) return { ok: true };
        s.pos++; if (s.pos >= s.rekke.length) { s.rekke = stokk(s.rekke); s.pos = 0; melde(data, 'Alle kortene er trukket – stokket på nytt.', 'All the cards have been drawn – reshuffled.'); }
        return { ok: true };
      }
      if (h.handling === 'nytt') {
        if (s.egen) { s.rekke = stokk(s.rekke); s.pos = 0; melde(data, 'Stokket på nytt.', 'Reshuffled.'); return { ok: true }; }
        return startEkstra(data, 'regelfabrikken', String(s.sek));
      }
      return null;
    }
    case 'opus': {
      if (h.handling === 'kast') {
        if (meg.id !== s.holder) return feilL('ikke-din-tur', 'Det er ikke du som har terningen.', "You don't have the die.");
        s.kast = 1 + tilfeldig(6); s.antall++; s.nr++;
        if (s.kast === 6) { const i = ider.indexOf(s.holder); s.holder = ider[(i + 1) % ider.length]; s.fra = meg.id; }
        return { ok: true };
      }
      if (h.handling === 'drop') { giSlurker(data, s.holder, 5); melde(data, `Droppet! ${navnPaa(data, s.holder)} holdt terningen – drikk opp!`, `Dropped! ${navnPaa(data, s.holder)} had the die – finish your drink!`); return { ok: true }; }
      return null;
    }
    case 'overunder': {
      if (h.handling !== 'gjett') return null;
      if (ider[s.tur % ider.length] !== meg.id) return feilL('ikke-din-tur', 'Vent på tur.', 'Wait for your turn.');
      if (!s.stokk.length) s.stokk = kortstokk52();
      const nytt = s.stokk.pop(), riktig = h.paa === 'over' ? nytt.v > s.kort.v : nytt.v < s.kort.v;
      s.sist = { fra: s.kort, til: nytt, riktig, hvem: meg.id, bunke: s.bunke };
      if (riktig) s.bunke++;
      else { giSlurker(data, meg.id, s.bunke); melde(data, `${meg.navn} bommet – drikk ${s.bunke}!`, `${meg.navn} missed – drink ${s.bunke}!`); s.bunke = 1; }
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
        s.fase = 'lop'; s.frist = null; melde(data, 'Løpet er i gang!', "And they're off!"); return { ok: true };
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
          melde(data, `${({ '♥': 'Hjerter', '♠': 'Spar', '♦': 'Ruter', '♣': 'Kløver' } as any)[vinner]} vant løpet!`, `${({ '♥': 'Hearts', '♠': 'Spades', '♦': 'Diamonds', '♣': 'Clubs' } as any)[vinner]} won the race!`);
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
          const hand = s.hender[p.id] || []; const i = hand.findIndex((k: any) => k.v === s.pyr[p.pos].v);
          if (i !== -1) hand.splice(i, 1); p.avgjort = 'godtatt';
        });
        s.pos++; return { ok: true };
      }
      if (h.handling === 'pastand') {
        if (!s.hender[meg.id]) return { feil: 'ikke-med', melding: 'Du kom inn midt i runden – du er med fra neste.', en: 'You joined mid-round – you’re in from the next one.' };
        if (s.pos < 1) return { ok: true };
        const pos = s.pos - 1;
        if (s.pastander.some((p: any) => p.pos === pos && p.id === meg.id)) return { ok: true };
        const rad = pos < 5 ? 1 : pos < 9 ? 2 : pos < 12 ? 3 : pos < 14 ? 4 : 5;
        s.pastander.push({ id: meg.id, pos, rad, avgjort: null });
        melde(data, `${meg.navn} sier de har ${vnavn(s.pyr[pos].v)} – deler ut ${rad}!`, `${meg.navn} says they have ${vnavnEn(s.pyr[pos].v)} – giving out ${rad}!`);
        return { ok: true };
      }
      if (h.handling === 'utfordre') {
        const p = s.pastander.find((x: any) => x.id === h.paa && x.pos === s.pos - 1 && !x.avgjort);
        if (!p || p.id === meg.id) return { ok: true };
        const hand = s.hender[p.id] || [], i = hand.findIndex((k: any) => k.v === s.pyr[p.pos].v);
        if (i !== -1) { hand.splice(i, 1); giSlurker(data, meg.id, p.rad * 2); p.avgjort = 'sant'; melde(data, `${navnPaa(data, p.id)} hadde kortet! ${meg.navn} drikker ${p.rad * 2}.`, `${navnPaa(data, p.id)} had the card! ${meg.navn} drinks ${p.rad * 2}.`); }
        else { giSlurker(data, p.id, p.rad * 2); p.avgjort = 'bløff'; melde(data, `${navnPaa(data, p.id)} bløffet! Drikk ${p.rad * 2}.`, `${navnPaa(data, p.id)} was bluffing! Drink ${p.rad * 2}.`); }
        return { ok: true };
      }
      if (h.handling === 'nytt') return startEkstra(data, 'pyramiden');
      return null;
    }
    case 'gris': {
      if (s.hender && !s.hender[meg.id] && h.handling !== 'nytt') return { ok: true };  // kom inn midt i runden
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
            s.bokstaver[meg.id]++; melde(data, `${meg.navn} tok seg på nesa for tidlig – får en bokstav!`, `${meg.navn} touched their nose too early – gets a letter!`);
            if (s.bokstaver[meg.id] >= 4) { melde(data, `${meg.navn} er GRIS! Ta en shot.`, `${meg.navn} spelled PIGS! Take a shot.`); s.bokstaver[meg.id] = 0; }
            return { ok: true };
          }
          s.fase = 'nese';
        }
        s.neser.push(meg.id);
        if (s.neser.length >= ider.length - 1) {
          const taper = ider.find((id: string) => !s.neser.includes(id));
          s.bokstaver[taper]++;
          const b = 'GRIS'.slice(0, s.bokstaver[taper]), bEn = 'PIGS'.slice(0, s.bokstaver[taper]);
          melde(data, `${navnPaa(data, taper)} var sist på nesa – ${b}!` + (s.bokstaver[taper] >= 4 ? ' Ta en shot!' : ''),
            `${navnPaa(data, taper)} was last to touch their nose – ${bEn}!` + (s.bokstaver[taper] >= 4 ? ' Take a shot!' : ''));
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
        if (turId !== meg.id) return feilL('ikke-din-tur', 'Vent på tur.', 'Wait for your turn.');
        const hand = s.hender[meg.id];
        if (h.handling === 'pass') {
          if (!s.bord.length) return feilL('ugyldig', 'Du starter – legg ut noe.', "You're starting – play something.");
          if (!s.pass.includes(meg.id)) s.pass.push(meg.id);
        } else {
          const valg: number[] = Array.isArray(h.kort) ? [...new Set(h.kort.map(Number))].filter((i: number) => i >= 0 && i < hand.length) as number[] : [];
          if (!valg.length) return feilL('ugyldig', 'Velg kort.', 'Pick some cards.');
          const kort = valg.map((i) => hand[i]);
          if (!kort.every((k: any) => k.v === kort[0].v)) return feilL('ugyldig', 'Kortene må være like.', 'The cards have to match.');
          if (s.bord.length && (kort.length !== s.bord.length || RANG(kort[0].v) <= RANG(s.bord[0].v))) return feilL('ugyldig', `Legg ${s.bord.length} kort som er høyere.`, `Play ${s.bord.length} ${s.bord.length === 1 ? 'card' : 'cards'} that ${s.bord.length === 1 ? 'is' : 'are'} higher.`);
          s.hender[meg.id] = hand.filter((_: any, i: number) => !valg.includes(i));
          s.bord = kort; s.bordAv = meg.id; s.pass = [];
          if (!s.hender[meg.id].length) { s.ferdige.push(meg.id); melde(data, `${meg.navn} er tom for kort!`, `${meg.navn} is out of cards!`); }
          if (kort[0].v === 2) { s.bord = []; s.pass = []; melde(data, `${meg.navn} la toer og rydder bordet.`, `${meg.navn} played a two and clears the table.`);
            if (s.hender[meg.id].length) return { ok: true }; }
        }
        const igjen = ider.filter((id: string) => !s.ferdige.includes(id));
        if (igjen.length <= 1) {
          if (igjen.length === 1) s.ferdige.push(igjen[0]);
          const t: any = {}; t[s.ferdige[0]] = L('President', 'President'); t[s.ferdige[s.ferdige.length - 1]] = L('Rævkjører', 'Scumbag');
          if (s.ferdige.length > 3) { t[s.ferdige[1]] = L('Visepresident', 'Vice President'); t[s.ferdige[s.ferdige.length - 2]] = L('Viserævkjører', 'Vice Scumbag'); }
          s.titler = t; s.fase = 'ferdig';
          melde(data, `${navnPaa(data, s.ferdige[0])} er President! ${navnPaa(data, s.ferdige[s.ferdige.length - 1])} er rævkjører.`, `${navnPaa(data, s.ferdige[0])} is President! ${navnPaa(data, s.ferdige[s.ferdige.length - 1])} is the Scumbag.`);
          return { ok: true };
        }
        // Har alle andre sagt pass siden siste legg? Da rydder den som la sist.
        const maaSvare = igjen.filter((id: string) => id !== s.bordAv);
        if (s.bord.length && maaSvare.every((id: string) => s.pass.includes(id))) {
          s.bord = []; s.pass = [];
          const idx = ider.indexOf(s.bordAv);
          if (!s.ferdige.includes(s.bordAv)) { s.tur = idx; melde(data, `Ingen gikk over – ${navnPaa(data, s.bordAv)} starter på nytt.`, `Nobody went higher – ${navnPaa(data, s.bordAv)} starts again.`); return { ok: true }; }
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
  s.fase = 'avslort'; melde(data, `Løgnen var: «${s.pastander[s.logn]}»`, `The lie was: “${s.pastander[s.logn]}”`);
}
export function ekstraVisning(s: any, meg: any, data: any) {
  if (s.type === 'bussruta' || s.type === 'yatzy' || s.type === 'nyhetsrunden') return nyeVisning(s, meg, data);
  if (SOS.includes(s.type)) return sosVisning(s, meg, data);
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
  if (!liste.length) return feilL('tom', 'Kortstokken er tom.', 'The deck is empty.');
  // Egne kortstokker vises slik de er skrevet; bare standardnavnet oversettes
  const skrevet = String(navn || '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 40);
  const tittel: any = skrevet || L('Egen kortstokk', 'Custom deck');
  data.spill = { type: 'regelfabrikken', lek: 'regelfabrikken', navn: tittel, modus: '', fase: 'trekk', frist: null, sek: 60, kort: {}, rekke: stokk(liste), pos: 0, egen: true };
  melde(data, `Nytt spill: ${tr(tittel, 'no')} (${liste.length} kort)`, `New game: ${tr(tittel, 'en')} (${liste.length} ${liste.length === 1 ? 'card' : 'cards'})`);
  return { ok: true };
}


/* =====================================================================
   Bussruta, Drikke-Yatzy og Nyhetsrunden i rom.
   Slurker føres automatisk på poengtavla: «drikk» → slurker, «del ut» → 🍺 å sende.
   ===================================================================== */
const BR_SPM = [L('Rød eller svart?', 'Red or black?'), L('Over eller under forrige kort?', 'Higher or lower than the last card?'), L('Innenfor eller utenfor de to første?', 'Inside or outside the first two?'), L('Hvilken kortfarge?', 'Which suit?')];
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
  melde(data, `Svaret er «${q.svar}» – ${antall} av ${data.spillere.length} hadde rett`, `The answer is “${q.svar}” – ${antall} of ${data.spillere.length} got it right`);
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
    if (ider.length < 2) return feilL('for-faa', 'Bussruta trenger minst to spillere.', 'Ride the bus needs at least two players.');
    const hender: any = {}; ider.forEach((id) => { hender[id] = []; });
    data.spill = { type: 'bussruta', lek, navn: EKSTRA_NAVN.bussruta, ider: ider.slice(), fase: 1, tur: 0, steg: 0, hender, stokk: kortstokk52(), sist: null, melding: '', pyr: [], pyrPos: 0, buss: null, bussRekke: 0, maal: 5 };
    melde(data, 'Nytt spill: Bussruta', 'New game: Ride the bus'); return { ok: true };
  }
  if (lek === 'yatzy') {
    const blokker: any = {}; ider.forEach((id) => { blokker[id] = {}; });
    data.spill = { type: 'yatzy', lek, navn: EKSTRA_NAVN.yatzy, ider: ider.slice(), tur: 0, terninger: [1, 2, 3, 4, 5], hold: [false, false, false, false, false], kast: 0, nr: 0, blokker, melding: '', ferdig: null };
    melde(data, 'Nytt spill: Drikke-Yatzy', 'New game: Drinking Yahtzee'); return { ok: true };
  }
  if (lek === 'nyhetsrunden') {
    const runder = publiserteRunder();
    const r = runder.find((x: any) => rundeId(x) === modus) || runder[0];
    if (!r || !(r.sporsmal || []).length) return feilL('tom', 'Ingen runde er ute ennå.', 'No round is out yet.');
    data.spill = { type: 'nyhetsrunden', lek, navn: EKSTRA_NAVN.nyhetsrunden, modus: L('uke ' + r.uke, 'week ' + r.uke), uke: r.uke, rid: rundeId(r), sporsmal: r.sporsmal, i: 0, riktige: {}, fase: 'klar', svar: {}, resultat: {}, alt: null };
    melde(data, `Nyhetsrunden uke ${r.uke} – ${r.sporsmal.length} spørsmål`, `Nyhetsrunden week ${r.uke} – ${r.sporsmal.length} ${r.sporsmal.length === 1 ? 'question' : 'questions'} (in Norwegian)`); return { ok: true };
  }
  return { feil: 'ukjent-lek' };
}

function nyeHandling(data: any, meg: any, h: any): any {
  const s = data.spill, erVert = meg.id === data.vert;
  if (s.type === 'bussruta') {
    const aktiv = s.ider[s.tur];
    if (h.handling === 'br-svar') {
      if (s.fase !== 1) return { ok: true };
      if (meg.id !== aktiv && !(erVert && !data.spillere.some((p: any) => p.id === aktiv))) return feilL('ikke-din-tur', 'Det er ikke din tur.', "It's not your turn.");
      const v = String(h.v || ''), k = brTrekk(s), hand = s.hender[aktiv];
      let ok = false;
      if (s.steg === 0) ok = (v === 'rod') === (k.f === '♥' || k.f === '♦');
      if (s.steg === 1) ok = v === 'over' ? k.v > hand[0].v : k.v < hand[0].v;
      if (s.steg === 2) { const lo = Math.min(hand[0].v, hand[1].v), hi = Math.max(hand[0].v, hand[1].v); ok = v === 'inn' ? (k.v > lo && k.v < hi) : (k.v < lo || k.v > hi); }
      if (s.steg === 3) ok = k.f === v;
      const n = s.steg + 1; hand.push(k); s.sist = k;
      if (ok) giUtdeling(data, aktiv, n); else giSlurker(data, aktiv, n);
      s.melding = L(`${navnPaa(data, aktiv)}: ${vnavn(k.v)}${k.f} – ${ok ? 'riktig! Del ut ' + n + '.' : 'feil! Drikk ' + n + '.'}`,
        `${navnPaa(data, aktiv)}: ${vnavnEn(k.v)}${k.f} – ${ok ? 'correct! Give out ' + n + '.' : 'wrong! Drink ' + n + '.'}`);
      s.steg++;
      if (s.steg === 4) { s.steg = 0; s.tur++; }
      if (s.tur >= s.ider.length) { s.fase = 2; s.pyr = []; for (let i = 0; i < 15; i++) s.pyr.push(brTrekk(s)); s.pyrPos = 0; s.sist = null; melde(data, 'Alle har fire kort. Nå snus pyramiden!', 'Everyone has four cards. Time to flip the pyramid!'); }
      return { ok: true };
    }
    if (h.handling === 'br-snu') {
      if (s.fase !== 2 || s.pyrPos >= 15) return { ok: true };
      if (typeof h.pos === 'number' && h.pos !== s.pyrPos) return { ok: true };
      const k = s.pyr[s.pyrPos], n = brRad(s.pyrPos), treff: string[] = [];
      s.ider.forEach((id: string) => { const hand = s.hender[id], i = hand.findIndex((x: any) => x.v === k.v); if (i !== -1) { hand.splice(i, 1); treff.push(navnPaa(data, id)); giUtdeling(data, id, n); } });
      s.pyrPos++;
      s.melding = L(`${vnavn(k.v)}${k.f} (rad ${n}) – ${treff.length ? treff.join(', ') + ' legger på og deler ut ' + n + '.' : 'ingen har den.'}`,
        `${vnavnEn(k.v)}${k.f} (row ${n}) – ${treff.length ? treff.join(', ') + ' ' + (treff.length === 1 ? 'plays it and gives' : 'play it and give') + ' out ' + n + '.' : 'nobody has it.'}`);
      return { ok: true };
    }
    if (h.handling === 'br-buss') {
      if (s.fase !== 2 || s.pyrPos < 15) return { ok: true };
      const maks = Math.max(...s.ider.map((id: string) => s.hender[id].length));
      const kand = s.ider.filter((id: string) => s.hender[id].length === maks);
      s.buss = kand[tilfeldig(kand.length)]; s.fase = 3; s.bussRekke = 0; s.stokk = kortstokk52(); s.sist = null;
      s.melding = L(`${navnPaa(data, s.buss)} har flest kort igjen (${maks}) og kjører bussen! Kom deg forbi ${s.maal} kort uten bildekort eller ess.`,
        `${navnPaa(data, s.buss)} has the most cards left (${maks}) and rides the bus! Get past ${s.maal} cards without a face card or an ace.`);
      melde(data, `${navnPaa(data, s.buss)} kjører bussen!`, `${navnPaa(data, s.buss)} rides the bus!`); return { ok: true };
    }
    if (h.handling === 'br-kjor') {
      if (s.fase !== 3 || s.bussRekke >= s.maal) return { ok: true };
      if (meg.id !== s.buss && !erVert) return feilL('ikke-din-tur', 'Det er sjåføren som snur.', 'The bus rider flips the cards.');
      const k = brTrekk(s); s.sist = k;
      const straff = ({ 11: 1, 12: 2, 13: 3, 14: 4 } as any)[k.v];
      if (straff) { giSlurker(data, s.buss, straff); s.bussRekke = 0; s.melding = L(`${vnavn(k.v)}${k.f} – ${navnPaa(data, s.buss)} drikker ${straff} og starter på nytt.`, `${vnavnEn(k.v)}${k.f} – ${navnPaa(data, s.buss)} drinks ${straff} and starts over.`); }
      else { s.bussRekke++; s.melding = L(`${vnavn(k.v)}${k.f} – trygt! ${s.bussRekke >= s.maal ? navnPaa(data, s.buss) + ' er i mål. Bussen er fri!' : (s.maal - s.bussRekke) + ' igjen.'}`,
        `${vnavnEn(k.v)}${k.f} – safe! ${s.bussRekke >= s.maal ? navnPaa(data, s.buss) + ' made it. The bus is free!' : (s.maal - s.bussRekke) + ' to go.'}`); if (s.bussRekke >= s.maal) melde(data, 'Bussen er i mål!', 'The bus made it!'); }
      return { ok: true };
    }
    if (h.handling === 'nytt') { if (!erVert) return { feil: 'bare-vert' }; return startNye(data, 'bussruta', '', aktiveIder(data, true)); }
    return null;
  }
  if (s.type === 'yatzy') {
    const aktiv = s.ider[s.tur], kanStyre = meg.id === aktiv || (erVert && !data.spillere.some((p: any) => p.id === aktiv));
    if (h.handling === 'yz-kast') {
      if (s.ferdig) return { ok: true };
      if (!kanStyre) return feilL('ikke-din-tur', 'Det er ikke din tur.', "It's not your turn.");
      if (s.kast >= 3) return { ok: true };
      s.terninger = s.terninger.map((t: number, i: number) => (s.hold[i] && s.kast ? t : 1 + tilfeldig(6)));
      s.kast++; s.nr++;
      const c = yzTell(s.terninger), deler: string[] = [], delerEn: string[] = [];
      if (c[1] > 0) { giSlurker(data, aktiv, 2); deler.push('Ener i kastet – drikk 2.'); delerEn.push('A one in the roll – drink 2.'); }
      if (c.some((x) => x === 5)) { giUtdeling(data, aktiv, 5); deler.push('YATZY! Del ut 5 – eller en shot.'); delerEn.push('YAHTZEE! Give out 5 – or a shot.'); }
      else if (c.some((x) => x >= 4)) { const sum = s.terninger.reduce((a: number, b: number) => a + b, 0); giSlurker(data, aktiv, sum); deler.push('Fire like – drikk ' + sum + ' slurker.'); delerEn.push('Four of a kind – drink ' + sum + ' sips.'); }
      s.melding = L(deler.join(' ') || (s.kast < 3 ? 'Hold og trill igjen, eller velg et felt.' : 'Velg et felt.'),
        delerEn.join(' ') || (s.kast < 3 ? 'Hold and roll again, or pick a box.' : 'Pick a box.'));
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
        melde(data, `${liste[0].navn} vant Yatzy! ${liste[liste.length - 1].navn} drikker opp.`, `${liste[0].navn} won Yahtzee! ${liste[liste.length - 1].navn} finishes their drink.`);
      }
      return { ok: true };
    }
    if (h.handling === 'nytt') { if (!erVert) return { feil: 'bare-vert' }; return startNye(data, 'yatzy', '', aktiveIder(data, true)); }
    return null;
  }
  if (s.type === 'nyhetsrunden') {
    const q = s.sporsmal[s.i];
    if (h.handling === 'nr-svar') {
      if (s.fase !== 'spm') return feilL('for-sent', 'Svaret er allerede vist.', 'The answer has already been revealed.');
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
    if (!erVert && ['nr-start', 'nr-vis', 'nr-flipp', 'nr-neste', 'nytt'].includes(h.handling)) return feilL('bare-vert', 'Verten styrer runden.', 'The host runs the round.');
    if (h.handling === 'nr-start') { if (s.fase === 'klar') { nrNyttSpm(s); melde(data, 'Første spørsmål!', 'First question!'); } return { ok: true }; }
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
        if (liste[0]) melde(data, `${liste[0].navn} vant Nyhetsrunden med ${liste[0].riktige} riktige!`, `${liste[0].navn} won Nyhetsrunden with ${liste[0].riktige} correct!`);
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
      fase: s.fase, i: s.i, antall: s.sporsmal.length, uke: s.uke, rid: s.rid || null, qtype: q.type, alt: s.alt,
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
/** Samme hjul på engelsk (samme rekkefølge). Effekten leses alltid fra den norske teksten. */
export const HJUL_STANDARD_EN = ['Drink 1', 'Drink 2', 'Drink 3', 'Shot!', 'Give out 2', 'Water break 💧', 'Safe – nothing happens', 'Everyone else drinks 1', 'Pick a drinking buddy', 'Embarrassing story – or drink 4'];
/** Hjulet slik én telefon ser det: standardhjulet på eget språk, egne hjul slik verten skrev dem. */
function hjulVisning(data: any, lang: Lang) {
  const h = lok(data.hjul, lang);
  // Gamle rom lagret bare norsk tekst for standardhjulet
  if (lang === 'en' && !data.hjulListe && typeof data.hjul.tekst === 'string' && HJUL_STANDARD[data.hjul.i] === data.hjul.tekst) h.tekst = HJUL_STANDARD_EN[data.hjul.i];
  return h;
}
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
  if (data.hjul && naa - data.hjul.tid < 7000) return feilL('for-fort', 'Hjulet spinner allerede!', 'The wheel is already spinning!');
  const hvem = h.hvem && erVert ? String(h.hvem) : meg.id;
  if (!data.spillere.some((p: any) => p.id === hvem)) return { feil: 'ukjent' };
  const liste = data.hjulListe || HJUL_STANDARD, i = tilfeldig(liste.length);
  const tekst = data.hjulListe ? liste[i] : L(HJUL_STANDARD[i], HJUL_STANDARD_EN[i]);
  data.hjul = { nr: ((data.hjul && data.hjul.nr) || 0) + 1, fra: meg.id, hvem, i, tekst, tid: naa, antall: liste.length };
  hjulEffekt(data, hvem, liste[i]);
  return { ok: true };
}


/* =====================================================================
   Sosiale leker: Ukjent avsender, Skrøna, Saueflokken, Muldvarpen,
   Hvem er jeg? og Skålsprinten – pluss Agent 0,5 (hemmelige oppdrag) hele kvelden.
   ===================================================================== */
const S_: any = SOSIAL;
const SE: any = SOSIAL_EN;
/** Ett innholdselement på begge språk: tekst → {no, en}, objekt (bløff {q, a}) → hvert felt som {no, en}. */
function sosL(no: any, en: any): any {
  if (typeof no === 'string') return L(no, typeof en === 'string' ? en : null);
  if (no && typeof no === 'object') { const ut: any = {}; Object.keys(no).forEach((k) => { ut[k] = sosL(no[k], en && typeof en === 'object' ? en[k] : null); }); return ut; }
  return no;
}
/** Lista på begge språk (samme rekkefølge i sosial.json og sosial.en.json). */
function sosListe(felt: string) { const en = SE[felt] || []; return (S_[felt] || []).map((x: any, i: number) => sosL(x, en[i])); }
const SFRIST = { skriv: 90, bloffSkriv: 60, stem: 30, samme: 30, sporsmal: 180, spionGjett: 30, pannekort: 75 };
function rens(x: any, n = 120) { return String(x == null ? '' : x).replace(/[\u0000-\u001f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, n); }
function trekkFra(s: any, felt: string, liste: any[]) {
  // Trekker uten å gjenta før lista er brukt opp
  s.brukt = s.brukt || {}; const b: number[] = s.brukt[felt] || (s.brukt[felt] = []);
  if (b.length >= liste.length) b.length = 0;
  let i = tilfeldig(liste.length); let vakt = 0;
  while (b.includes(i) && vakt++ < 200) i = tilfeldig(liste.length);
  b.push(i); return liste[i];
}
function alleHar(data: any, obj: any, unntak: string[] = []) { return data.spillere.every((p: any) => unntak.includes(p.id) || obj[p.id] != null); }

function startSos(data: any, lek: string, ider: string[]): any {
  const n = data.spillere.length;
  const trenger: any = { hvemskrev: 3, bloff: 3, samme: 3, spion: 3, pannekort: 3, skal: 2 };
  if (n < trenger[lek]) return feilL('for-faa', `Trenger minst ${trenger[lek]} spillere.`, `Needs at least ${trenger[lek]} players.`);
  const gammel = data.spill && data.spill.type === lek ? data.spill.brukt : null;
  const navn: L = EKSTRA_NAVN[lek];
  const s: any = { type: lek, lek, navn, brukt: gammel || {}, runde: 1 };
  data.spill = s;
  sosNyRunde(data);
  melde(data, `Nytt spill: ${navn.no}`, `New game: ${navn.en}`);
  return { ok: true };
}
function sosNyRunde(data: any) {
  const s = data.spill, ider = data.spillere.map((p: any) => p.id);
  s.frist = null;
  if (s.type === 'hvemskrev') { s.fase = 'skriv'; s.oppgave = trekkFra(s, 'oppg', sosListe('hvemskrev')); s.svar = {}; s.ko = []; s.i = 0; s.stemmer = {}; settFrist(s, SFRIST.skriv); }
  if (s.type === 'bloff') { const q = trekkFra(s, 'q', sosListe('bloff')); s.fase = 'skriv'; s.q = q.q; s.sant = q.a; s.falske = {}; s.valg = []; s.stemmer = {}; settFrist(s, SFRIST.bloffSkriv); }
  if (s.type === 'samme') { s.fase = 'skriv'; s.oppgave = trekkFra(s, 'oppg', sosListe('samme')); s.svar = {}; s.grupper = null; settFrist(s, SFRIST.samme); }
  if (s.type === 'spion') {
    s.fase = 'sporsmal'; s.sted = trekkFra(s, 'sted', sosListe('steder')); s.spion = ider[tilfeldig(ider.length)];
    s.start = ider[tilfeldig(ider.length)]; s.stemmer = {}; s.utfall = null; s.spionGjett = null; settFrist(s, SFRIST.sporsmal);
  }
  if (s.type === 'pannekort') {
    const rekke = stokk(ider); s.tildelt = {}; rekke.forEach((id: string, i: number) => { s.tildelt[id] = rekke[(i + 1) % rekke.length]; });
    s.fase = 'skriv'; s.ord = {}; s.gjettet = []; settFrist(s, SFRIST.pannekort);
  }
  if (s.type === 'skal') { s.fase = 'klar'; s.tid = null; s.trykk = {}; s.tidlig = []; s.resultat = null; }
}
function hsFasit(data: any) {
  const s = data.spill, forfatter = s.ko[s.i];
  const riktige = Object.keys(s.stemmer).filter((id) => s.stemmer[id] === forfatter);
  Object.keys(s.stemmer).forEach((id) => { if (s.stemmer[id] !== forfatter) giSlurker(data, id, 1); });
  if (!riktige.length && Object.keys(s.stemmer).length) giUtdeling(data, forfatter, 2);
  s.fase = 'fasit'; s.frist = null;
}
function hsStartGjett(data: any) {
  const s = data.spill; s.ko = stokk(Object.keys(s.svar)); s.i = 0; s.fase = 'gjett'; s.stemmer = {}; settFrist(s, SFRIST.stem);
}
function bfStartStem(data: any) {
  const s = data.spill, grupper: any = {};
  Object.entries(s.falske).forEach(([id, t]: any) => { const k = norm(t); (grupper[k] = grupper[k] || { t, av: [] }).av.push(id); });
  s.valg = stokk([{ t: s.sant, av: ['sant'] }, ...Object.values(grupper)]);
  s.fase = 'stem'; s.stemmer = {}; settFrist(s, SFRIST.stem);
}
function bfFasit(data: any) {
  const s = data.spill;
  Object.entries(s.stemmer).forEach(([id, i]: any) => {
    const v = s.valg[i];
    if (v.av[0] === 'sant') giUtdeling(data, id, 1);
    else { giSlurker(data, id, 1); v.av.forEach((a: string) => giUtdeling(data, a, 1)); }
  });
  s.fase = 'fasit'; s.frist = null;
}
function smFasit(data: any) {
  const s = data.spill, g: any = {};
  Object.entries(s.svar).forEach(([id, t]: any) => { const k = norm(t); (g[k] = g[k] || { t, ider: [] }).ider.push(id); });
  s.grupper = Object.values(g).sort((a: any, b: any) => b.ider.length - a.ider.length);
  data.spillere.forEach((p: any) => { const gr = s.grupper.find((x: any) => x.ider.includes(p.id)); if (!gr || gr.ider.length < 2) giSlurker(data, p.id, 1); });
  s.fase = 'fasit'; s.frist = null;
}
function spTelling(data: any) {
  const s = data.spill, t: any = {};
  Object.values(s.stemmer).forEach((id: any) => { t[id] = (t[id] || 0) + 1; });
  const liste = Object.entries(t).sort((a: any, b: any) => b[1] - a[1]);
  const topp = liste[0] && (!liste[1] || liste[1][1] < liste[0][1]) ? liste[0][0] : null;
  if (topp === s.spion) { s.fase = 'gjett'; settFrist(s, SFRIST.spionGjett); melde(data, 'Muldvarpen er avslørt! Men kan hen gjette stedet?', 'The mole has been exposed! But can they guess the location?'); }
  else spSlutt(data, 'spion-vant', topp);
}
function spSlutt(data: any, utfall: string, feilMistenkt: string | null = null) {
  const s = data.spill; s.fase = 'fasit'; s.frist = null; s.utfall = utfall; s.feilMistenkt = feilMistenkt;
  if (utfall === 'fanget') { giSlurker(data, s.spion, 3); data.spillere.forEach((p: any) => { if (p.id !== s.spion) giUtdeling(data, p.id, 1); }); }
  else { data.spillere.forEach((p: any) => { if (p.id !== s.spion) giSlurker(data, p.id, 2); }); giUtdeling(data, s.spion, 3); }
  melde(data, utfall === 'fanget' ? `Muldvarpen ${navnPaa(data, s.spion)} ble tatt!` : `Muldvarpen ${navnPaa(data, s.spion)} vant!`,
    utfall === 'fanget' ? `The mole, ${navnPaa(data, s.spion)}, got caught!` : `The mole, ${navnPaa(data, s.spion)}, won!`);
}
function pkStartSpill(data: any) {
  const s = data.spill;
  Object.keys(s.tildelt).forEach((fra) => { const til = s.tildelt[fra]; if (!s.ord[til]) s.ord[til] = { t: trekkFra(s, 'ord', sosListe('ord')), fra: null }; });
  s.fase = 'spill'; s.frist = null;
}
function skalFasit(data: any) {
  const s = data.spill, tider = Object.entries(s.trykk).sort((a: any, b: any) => a[1] - b[1]);
  const deltakere = data.spillere.map((p: any) => p.id).filter((id: string) => !s.tidlig.includes(id));
  const ikke = deltakere.filter((id: string) => s.trykk[id] == null);
  ikke.forEach((id: string) => giSlurker(data, id, 1));
  let treigest: string | null = null;
  if (!ikke.length && tider.length) { treigest = tider[tider.length - 1][0] as string; giSlurker(data, treigest, 1); }
  if (tider.length) giUtdeling(data, tider[0][0] as string, 1);
  s.resultat = { tider, tidlig: s.tidlig, ikke, treigest, raskest: tider.length ? tider[0][0] : null };
  s.fase = 'fasit'; s.frist = null;
}

function sosHandling(data: any, meg: any, h: any): any {
  const s = data.spill, erVert = meg.id === data.vert, hd = h.handling;
  if (hd === 'nytt' || hd === 'runde') {
    if (!erVert && s.fase !== 'fasit' && s.fase !== 'ferdig') return { feil: 'bare-vert' };
    s.runde++; sosNyRunde(data); return { ok: true };
  }
  if (s.type === 'hvemskrev') {
    if (hd === 'hs-skriv') {
      if (s.fase !== 'skriv') return feilL('for-sent', 'Skrivetiden er ute.', 'Writing time is up.');
      const t = rens(h.tekst, 160); if (!t) return { ok: true };
      s.svar[meg.id] = t;
      if (alleHar(data, s.svar)) hsStartGjett(data);
      return { ok: true };
    }
    if (hd === 'hs-stem') {
      if (s.fase !== 'gjett' || s.ko[s.i] === meg.id) return { ok: true };
      if (!data.spillere.some((p: any) => p.id === h.hvem) || h.hvem === meg.id) return { feil: 'ukjent' };
      s.stemmer[meg.id] = h.hvem;
      if (alleHar(data, s.stemmer, [s.ko[s.i]])) hsFasit(data);
      return { ok: true };
    }
    if (hd === 'hs-neste') {
      if (s.fase !== 'fasit') return { ok: true };
      s.i++; if (s.i >= s.ko.length) { s.fase = 'ferdig'; return { ok: true }; }
      s.fase = 'gjett'; s.stemmer = {}; settFrist(s, SFRIST.stem); return { ok: true };
    }
    if (hd === 'tid-ute' && fristUte(s)) {
      if (s.fase === 'skriv') { if (Object.keys(s.svar).length >= 2) hsStartGjett(data); else settFrist(s, 30); }
      else if (s.fase === 'gjett') hsFasit(data);
      return { ok: true };
    }
    if (hd === 'avslor' && s.fase === 'skriv' && erVert) {
      const mangler = data.spillere.filter((p: any) => s.svar[p.id] == null).length;
      if (mangler && !fristUte(s)) return venter(s, mangler);
    }
    return { ok: true };
  }
  if (s.type === 'bloff') {
    if (hd === 'bf-skriv') {
      if (s.fase !== 'skriv') return feilL('for-sent', 'Skrivetiden er ute.', 'Writing time is up.');
      const t = rens(h.tekst, 80); if (!t) return { ok: true };
      // Sjekk mot det riktige svaret på begge språk
      const sante = erL(s.sant) ? [s.sant.no, s.sant.en] : [String(s.sant || '')];
      if (sante.some((sa) => norm(t) === norm(sa) || (norm(t).length > 3 && norm(sa).includes(norm(t))))) return feilL('for-riktig', 'Det der er jo det riktige svaret! Finn på en løgn.', "That's the actual answer! Make up a lie.");
      s.falske[meg.id] = t;
      if (alleHar(data, s.falske)) bfStartStem(data);
      return { ok: true };
    }
    if (hd === 'bf-stem') {
      if (s.fase !== 'stem') return { ok: true };
      const i = Number(h.i); const v = s.valg[i]; if (!v) return { feil: 'ukjent' };
      if (v.av.includes(meg.id)) return feilL('egen', 'Du kan ikke stemme på din egen løgn.', "You can't vote for your own lie.");
      s.stemmer[meg.id] = i;
      if (alleHar(data, s.stemmer)) bfFasit(data);
      return { ok: true };
    }
    if (hd === 'tid-ute' && fristUte(s)) {
      if (s.fase === 'skriv') { if (Object.keys(s.falske).length >= 1) bfStartStem(data); else settFrist(s, 30); }
      else if (s.fase === 'stem') bfFasit(data);
    }
    return { ok: true };
  }
  if (s.type === 'samme') {
    if (hd === 'sm-skriv') {
      if (s.fase !== 'skriv') return feilL('for-sent', 'Tiden er ute.', "Time's up.");
      const t = rens(h.tekst, 40); if (!t) return { ok: true };
      s.svar[meg.id] = t; if (alleHar(data, s.svar)) smFasit(data); return { ok: true };
    }
    if (hd === 'tid-ute' && fristUte(s) && s.fase === 'skriv') smFasit(data);
    return { ok: true };
  }
  if (s.type === 'spion') {
    if (hd === 'sp-til-stemming') {
      if (s.fase !== 'sporsmal') return { ok: true };
      if (!erVert) return feilL('bare-vert', 'Verten sender dere til stemming.', 'The host sends you to the vote.');
      s.fase = 'stem'; s.stemmer = {}; settFrist(s, SFRIST.stem); return { ok: true };
    }
    if (hd === 'sp-stem') {
      if (s.fase !== 'stem') return { ok: true };
      if (!data.spillere.some((p: any) => p.id === h.hvem) || h.hvem === meg.id) return { feil: 'ukjent' };
      s.stemmer[meg.id] = h.hvem; if (alleHar(data, s.stemmer)) spTelling(data); return { ok: true };
    }
    if (hd === 'sp-gjett') {
      if (s.fase !== 'gjett' || meg.id !== s.spion) return { ok: true };
      // Spionen velger fra lista på sitt eget språk – godta stedet på begge språk
      const g = String(h.sted || ''), riktig = erL(s.sted) ? (g === s.sted.no || g === s.sted.en) : g === s.sted;
      const steder = sosListe('steder'), treff = steder.find((x: any) => x.no === g || x.en === g);
      s.spionGjett = treff || g;
      spSlutt(data, riktig ? 'spion-gjettet' : 'fanget'); return { ok: true };
    }
    if (hd === 'tid-ute' && fristUte(s)) {
      if (s.fase === 'sporsmal') { s.fase = 'stem'; s.stemmer = {}; settFrist(s, SFRIST.stem); }
      else if (s.fase === 'stem') spTelling(data);
      else if (s.fase === 'gjett') spSlutt(data, 'fanget');
    }
    return { ok: true };
  }
  if (s.type === 'pannekort') {
    if (hd === 'pk-skriv') {
      if (s.fase !== 'skriv') return feilL('for-sent', 'Ordene er allerede delt ut.', 'The words have already been handed out.');
      const t = rens(h.tekst, 40); if (!t) return { ok: true };
      const til = s.tildelt[meg.id]; if (!til) return { ok: true };
      s.ord[til] = { t, fra: meg.id };
      if (Object.keys(s.tildelt).every((fra) => s.ord[s.tildelt[fra]])) pkStartSpill(data);
      return { ok: true };
    }
    if (hd === 'pk-riktig') {
      if (s.fase !== 'spill') return { ok: true };
      const hvem = String(h.hvem || '');
      if (hvem === meg.id) return feilL('ukjent', 'Det er de andre som bekrefter at du gjettet riktig.', "The others confirm that you guessed right.");
      if (!s.ord[hvem] || s.gjettet.includes(hvem)) return { ok: true };
      s.gjettet.push(hvem);
      if (s.gjettet.length === 1) giUtdeling(data, hvem, 2);
      melde(data, `${navnPaa(data, hvem)} gjettet «${tr(s.ord[hvem].t, 'no')}»!`, `${navnPaa(data, hvem)} guessed “${tr(s.ord[hvem].t, 'en')}”!`);
      const igjen = Object.keys(s.ord).filter((id) => !s.gjettet.includes(id) && data.spillere.some((p: any) => p.id === id));
      if (igjen.length <= 1) { s.fase = 'ferdig'; if (igjen[0]) { giSlurker(data, igjen[0], 3); s.sist = igjen[0]; } }
      return { ok: true };
    }
    if (hd === 'pk-avslutt') {
      if (!erVert || s.fase !== 'spill') return { ok: true };
      const igjen = Object.keys(s.ord).filter((id) => !s.gjettet.includes(id));
      igjen.forEach((id) => giSlurker(data, id, 2)); s.fase = 'ferdig'; return { ok: true };
    }
    if (hd === 'tid-ute' && fristUte(s) && s.fase === 'skriv') pkStartSpill(data);
    return { ok: true };
  }
  if (s.type === 'skal') {
    if (hd === 'sk-start') {
      if (s.fase === 'vent') return { ok: true };
      s.fase = 'vent'; s.tid = Date.now() + 2500 + tilfeldig(5000); s.trykk = {}; s.tidlig = []; s.resultat = null; s.frist = s.tid + 6000;
      return { ok: true };
    }
    if (hd === 'sk-trykk') {
      if (s.fase !== 'vent' || s.trykk[meg.id] != null || s.tidlig.includes(meg.id)) return { ok: true };
      // Telefonen måler selv reaksjonstiden (rettferdig uansett nett); serveren sjekker at den er rimelig
      if (h.tidlig || Date.now() < s.tid - 400) { s.tidlig.push(meg.id); giSlurker(data, meg.id, 2); }
      else s.trykk[meg.id] = Math.max(80, Math.min(6000, Math.round(Number(h.ms) || (Date.now() - s.tid))));
      const ferdige = data.spillere.every((p: any) => s.trykk[p.id] != null || s.tidlig.includes(p.id));
      if (ferdige) skalFasit(data);
      return { ok: true };
    }
    if (hd === 'tid-ute' && s.fase === 'vent' && fristUte(s)) skalFasit(data);
    return { ok: true };
  }
  return null;
}

function sosVisning(s: any, meg: any, data: any) {
  const m = meg ? meg.id : null;
  if (s.type === 'hvemskrev') return {
    fase: s.fase, oppgave: s.oppgave, harSkrevet: Object.keys(s.svar), mittSvar: m ? s.svar[m] || null : null,
    i: s.i, antallSvar: s.ko.length || Object.keys(s.svar).length,
    tekst: s.fase === 'gjett' || s.fase === 'fasit' ? s.svar[s.ko[s.i]] : null,
    erMitt: (s.fase === 'gjett' || s.fase === 'fasit') && s.ko[s.i] === m,
    harStemt: Object.keys(s.stemmer || {}), minStemme: m ? (s.stemmer || {})[m] || null : null,
    forfatter: s.fase === 'fasit' ? s.ko[s.i] : null, stemmer: s.fase === 'fasit' ? s.stemmer : null,
  };
  if (s.type === 'bloff') return {
    fase: s.fase, q: s.q, harSkrevet: Object.keys(s.falske), mittSvar: m ? s.falske[m] || null : null,
    valg: s.fase === 'skriv' ? null : s.valg.map((v: any) => ({ t: v.t, min: v.av.includes(m), av: s.fase === 'fasit' ? v.av : null })),
    harStemt: Object.keys(s.stemmer), minStemme: m ? s.stemmer[m] ?? null : null, stemmer: s.fase === 'fasit' ? s.stemmer : null,
    sant: s.fase === 'fasit' ? s.sant : null,
  };
  if (s.type === 'samme') return { fase: s.fase, oppgave: s.oppgave, harSkrevet: Object.keys(s.svar), mittSvar: m ? s.svar[m] || null : null, grupper: s.fase === 'fasit' ? s.grupper : null };
  if (s.type === 'spion') {
    const aapen = s.fase === 'fasit';
    return { fase: s.fase, erSpion: m === s.spion, sted: m !== s.spion || aapen ? s.sted : null, steder: sosListe('steder'), start: s.start,
      harStemt: Object.keys(s.stemmer), minStemme: m ? s.stemmer[m] || null : null,
      spion: aapen || s.fase === 'gjett' ? s.spion : null, stemmer: aapen ? s.stemmer : null, utfall: s.utfall, spionGjett: aapen ? s.spionGjett : null };
  }
  if (s.type === 'pannekort') {
    const ord: any = {}; Object.entries(s.ord).forEach(([id, o]: any) => { if (id !== m || s.fase === 'ferdig') ord[id] = { t: o.t, fra: o.fra }; });
    return { fase: s.fase, mitMaal: m ? s.tildelt[m] || null : null, harSkrevet: Object.keys(s.tildelt).filter((fra) => s.ord[s.tildelt[fra]]),
      ord, gjettet: s.gjettet, sist: s.sist || null, mittOrdSkjult: !!(m && s.ord[m] && s.fase !== 'ferdig') };
  }
  if (s.type === 'skal') return { fase: s.fase, tid: s.tid, harTrykket: Object.keys(s.trykk || {}).concat(s.tidlig || []), resultat: s.resultat };
  return {};
}

/* ---------- hemmelige oppdrag (går i bakgrunnen hele kvelden) ---------- */
function nyttOppdrag(data: any, id: string) {
  const o = data.oppdrag; const andre = data.spillere.filter((p: any) => p.id !== id);
  if (!andre.length) return;
  const maal = andre[tilfeldig(andre.length)];
  const mal = trekkFra(o, 'op', sosListe('oppdrag'));
  o.per[id] = { t: L(mal.no.replace('{navn}', maal.navn), mal.en.replace('{navn}', maal.navn)), maal: maal.id, nr: ((o.per[id] && o.per[id].nr) || 0) + 1 };
}
function oppdragHandling(data: any, meg: any, h: any, erVert: boolean): any {
  const hd = h.handling;
  if (hd === 'op-paa') {
    if (!erVert) return { feil: 'bare-vert' };
    if (!romHarPluss(data)) return feilL('pluss', 'Agent 0,5 (hemmelige oppdrag) krever Pluss hos verten.', 'Agent 0.5 (secret missions) needs the host to have Pluss.');
    if (data.spillere.length < 3) return feilL('for-faa', 'Trenger minst tre spillere.', 'Needs at least three players.');
    data.oppdrag = { paa: true, per: {}, venter: [], anklager: [], brukt: {} };
    data.spillere.forEach((p: any) => nyttOppdrag(data, p.id));
    melde(data, '🕵️ Agent 0,5 er i gang! Sjekk ditt hemmelige oppdrag – ikke vis det til noen.', "🕵️ Agent 0.5 is on! Check your secret mission – don't show it to anyone."); return { ok: true };
  }
  const o = data.oppdrag; if (!o || !o.paa) return { ok: true };
  if (hd === 'op-av') { if (!erVert) return { feil: 'bare-vert' }; o.paa = false; melde(data, 'Agent 0,5 er over – oppdragene er avsluttet.', 'Agent 0.5 is over – the missions have ended.'); return { ok: true }; }
  const mitt = o.per[meg.id];
  if (hd === 'op-fullfort') {
    if (!mitt) return { ok: true };
    if (o.venter.some((v: any) => v.fra === meg.id)) return feilL('venter', 'Venter på at den andre bekrefter.', 'Waiting for the other person to confirm.');
    o.venter.push({ fra: meg.id, til: mitt.maal, t: mitt.t }); return { ok: true };
  }
  if (hd === 'op-bekreft') {
    const i = o.venter.findIndex((v: any) => v.til === meg.id && v.fra === h.fra); if (i < 0) return { ok: true };
    const v = o.venter.splice(i, 1)[0];
    if (h.ja) { giUtdeling(data, v.fra, 3); melde(data, `🕵️ ${navnPaa(data, v.fra)} fullførte: «${tr(v.t, 'no')}»`, `🕵️ ${navnPaa(data, v.fra)} completed: “${tr(v.t, 'en')}”`); nyttOppdrag(data, v.fra); }
    return { ok: true };
  }
  if (hd === 'op-bytt') { if (!mitt) return { ok: true }; giSlurker(data, meg.id, 1); nyttOppdrag(data, meg.id); return { ok: true }; }
  if (hd === 'op-beskyld') {
    const hvem = String(h.hvem || ''); if (hvem === meg.id || !o.per[hvem]) return { feil: 'ukjent' };
    if (o.anklager.some((a: any) => a.fra === meg.id)) return feilL('venter', 'Du har allerede en anklage som venter.', 'You already have an accusation waiting.');
    o.anklager.push({ fra: meg.id, til: hvem }); return { ok: true };
  }
  if (hd === 'op-svar') {
    const i = o.anklager.findIndex((a: any) => a.til === meg.id && a.fra === h.fra); if (i < 0) return { ok: true };
    const a = o.anklager.splice(i, 1)[0];
    if (h.tatt) { giSlurker(data, meg.id, 2); melde(data, `🕵️ ${navnPaa(data, a.fra)} avslørte ${meg.navn}: «${tr(o.per[meg.id].t, 'no')}»`, `🕵️ ${navnPaa(data, a.fra)} exposed ${meg.navn}: “${tr(o.per[meg.id].t, 'en')}”`); nyttOppdrag(data, meg.id); }
    else { giSlurker(data, a.fra, 1); melde(data, `🕵️ ${navnPaa(data, a.fra)} tok feil om ${meg.navn} – drikk!`, `🕵️ ${navnPaa(data, a.fra)} was wrong about ${meg.navn} – drink!`); }
    return { ok: true };
  }
  return { ok: true };
}
function oppdragVisning(data: any, meg: any) {
  const o = data.oppdrag; if (!o || !o.paa) return null;
  const m = meg ? meg.id : null;
  return {
    paa: true, mitt: m && o.per[m] ? { t: o.per[m].t, nr: o.per[m].nr } : null,
    venterPaaBekreftelse: !!(m && o.venter.some((v: any) => v.fra === m)),
    bekreft: m ? o.venter.filter((v: any) => v.til === m).map((v: any) => ({ fra: v.fra, t: v.t })) : [],
    anklager: m ? o.anklager.filter((a: any) => a.til === m).map((a: any) => ({ fra: a.fra })) : [],
    minAnklage: !!(m && o.anklager.some((a: any) => a.fra === m)),
  };
}
