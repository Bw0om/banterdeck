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
import { BEVEG_GRATIS, rensPynt, temaLov, temaFor, figurNokkel, ekstraLov, EKSTRA as ROM_EKSTRA, rensStil, STIL_PLUSS } from './pynt.js';
import { kveld, lekStartet, lekFerdig, velgVinner, kaarVinner, kveldVisning } from './kveld';
import { MAKS_REGEL } from './lovbok';
import { borsHandling, borsVisning, borsTilGjeng, settStart, nySpillerIBors, borsTilPluss, BUTIKK } from './bors';
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
const KORTLEKER = ['pekeleken', 'jeg-har-aldri', 'kategorier', 'tanken-bak-sangen', 'enten-eller', 'nodt-eller-sannhet', 'rygg-mot-rygg'];
/** Én kort linje om hver kortlek i lobbyen – hva som skjer, ikke hvordan knappene virker. */
const OM_L: Record<string, [string, string]> = {
  'pekeleken': ['Hvem passer kortet på? Pek i rommet – eller stem på mobilen.', 'Who fits the card? Point in the room – or vote on your phones.'],
  'jeg-har-aldri': ['Svar i hemmelighet. Så snus kortene.', 'Answer in secret. Then the cards flip.'],
  'kategorier': ['Bomba går rundt. Ingen vet når den smeller.', 'The bomb goes around. Nobody knows when it goes off.'],
  'enten-eller': ['Velg side i hemmelighet. Mindretallet drikker.', 'Pick a side in secret. The minority drinks.'],
  'nodt-eller-sannhet': ['Én i stolen. Alle andre er dommere.', 'One in the hot seat. Everyone else judges.'],
  'rygg-mot-rygg': ['To peker i hemmelighet. Resten gjetter.', 'Two point in secret. The rest guess.'],
};
const NAVN_L: Record<string, [string, string]> = {
  'pekeleken': ['Pekeleken', 'Most likely to'], 'jeg-har-aldri': ['Jeg har aldri', 'Never have I ever'], 'enten-eller': ['Enten eller', 'Would you rather'], 'kategorier': ['Kategorier', 'Categories'],
  'nodt-eller-sannhet': ['Nødt eller sannhet', 'Truth or dare'], 'sannhet-eller-drikk': ['Sannhet eller drikk', 'Truth or drink'], 'tanken-bak-sangen': ['Låtbekjennelsen', 'Song confessions'], 'rygg-mot-rygg': ['Rygg mot rygg', 'Back to back'], 'duoleken': ['Duoleken', 'The couples game'], '50-50': ['50/50', '50/50'],
  'ring-of-fire': ['Ring of Fire', 'Ring of Fire'], 'forraeder': ['Løgnhalsen', 'The liar'], 'mest': ['Pekeleken · på mobilen', 'Most likely to · on phones'], 'bingo': ['Drikke-bingo', 'Drinking bingo'],
};
/** Lekene som kan spilles i rom, med navn, beskrivelse og moduser på valgt språk (standard norsk). */
export function lekeliste(lang: Lang | string = 'no') {
  const sp = rensLang(lang);
  return lekelisteRa(sp).map((l: any) => (PLUSS_ROM.includes(l.id) ? { ...l, pluss: true } : l));
}
function moduserFor(lek: string, lang: Lang) {
  if (lek === 'nodt-eller-sannhet') return [{ v: 'snill', t: lang === 'en' ? 'Mild' : 'Snill' }, { v: 'droy', t: lang === 'en' ? 'Spicy' : 'Drøy' }];
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
    { id: 'mest', skjult: true, navn: nv('mest'), type: 'mest', moduser: moduserFor('pekeleken', lang), om: en ? 'Everyone votes for who it fits best. Every vote is one sip.' : 'Alle stemmer på hvem det passer best på. Hver stemme er én slurk.' },
    { id: 'forraeder', navn: nv('forraeder'), type: 'forraeder', moduser: moduserFor('forraeder', lang), om: en ? 'One player is secretly told to lie or tell the truth. Everyone else votes.' : 'Én får i hemmelighet beskjed om å lyve eller si sannheten. Resten stemmer.' },
    { id: 'bingo', navn: nv('bingo'), type: 'bingo', moduser: B.eras.map((e: any) => ({ v: e.id, t: eraTittel(e.id, lang) })), om: en ? 'Everyone gets their own board. The page calls it out when someone gets a line or bingo.' : 'Hver får sitt eget brett. Siden roper når noen får rekke eller bingo.' },
    { id: 'ring-of-fire', navn: nv('ring-of-fire'), type: 'kort', moduser: [{ v: 'ring', t: en ? '🔥 The ring – pull the cards out' : '🔥 Ringen – dra ut kortene' }, { v: 'enkel', t: en ? 'Simple – tap for the next card' : 'Enkel – trykk for neste kort' }],
      om: en ? 'The cards lie in a ring around a glass. Spin the ring and pull a card out slowly – pull too hard and the ring breaks, and you finish your drink.' : 'Kortene ligger i en ring rundt et glass. Snurr ringen og dra ut et kort forsiktig – drar du for hardt, ryker ringen og du må drikke opp.' , kortregler: rofKortregler(en) },
    ...ekstraLeker(lang),
    ...kort.map((k) => ({ ...k, om: OM_L[k.id] ? OM_L[k.id][en ? 1 : 0] : en ? 'Everyone sees the same card. Anyone can draw the next one.' : 'Alle ser samme kort. Hvem som helst kan trekke neste.' })),
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
  // En TV-kobling ligger i samme tabell, men er ikke et rom
  return rad && !(rad.data && rad.data.tvKobling) ? { data: rad.data, versjon: rad.versjon } : null;
}

/* ---------- TV-kobling: TV-en viser en QR-kode, verten skanner den ----------
   TV-en får en egen kode (samme alfabet som romkodene, i samme tabell). Verten åpner lenken i QR-koden,
   telefonen sender koden til rommet sitt, og serveren legger romkode + PIN på TV-koblingen. TV-en spør
   etter den hvert par sekunder. Koblingen varer i 15 minutter. */
const TV_LEVETID = 15 * 60 * 1000;
export async function lagTvKobling() {
  for (let i = 0; i < 6; i++) {
    const kode = nyKode();
    const ok = await rpc('rom_lag', { p_kode: kode, p_data: { tvKobling: true, laget: Date.now(), kobling: null } });
    if (ok === true) return kode;
  }
  throw new Error('Fant ingen ledig kode');
}
export async function hentTvKobling(kode: string) {
  const r = await rpc('rom_hent', { p_kode: kode });
  const rad = Array.isArray(r) ? r[0] : r;
  if (!rad || !rad.data || !rad.data.tvKobling || Date.now() - (rad.data.laget || 0) > TV_LEVETID) return null;
  return { kobling: rad.data.kobling || null };
}
export async function kobleTv(tvKode: string, romKode: string, pin: string) {
  for (let forsok = 0; forsok < 4; forsok++) {
    const r = await rpc('rom_hent', { p_kode: tvKode });
    const rad = Array.isArray(r) ? r[0] : r;
    if (!rad || !rad.data || !rad.data.tvKobling || Date.now() - (rad.data.laget || 0) > TV_LEVETID) return false;
    const data = { ...rad.data, kobling: { k: romKode, p: pin } };
    const ny = await rpc('rom_lagre', { p_kode: tvKode, p_versjon: rad.versjon, p_data: data });
    if (ny !== null && ny !== undefined) return true;
  }
  return false;
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
  if (k && k.vinner) ut.push({ ikon: '🏆', kode: 'vinner', tittel: L('Kveldens vinner', 'Winner of the night'), id: k.vinner, navn: navn(k.vinner), tall: L((k.poeng[k.vinner] || 0) + ' kveldspoeng', (k.poeng[k.vinner] || 0) + ' night points') });
  const sum = l.reduce((n: number, p: any) => n + (p.slurker || 0), 0);
  const torst = maks('slurker'); if (torst) ut.push({ ikon: '🍺', kode: 'torst', tittel: L('Kveldens tørstigste', 'Thirstiest of the night'), id: torst.id, navn: torst.navn, tall: L(torst.slurker + ' slurker', torst.slurker + ' sips') });
  if (l.length >= 3 && sum) { const e = l.slice().sort((a: any, b: any) => (a.slurker || 0) - (b.slurker || 0))[0]; ut.push({ ikon: '😇', kode: 'slapp', tittel: L('Slapp unna', 'Got away with it'), id: e.id, navn: e.navn, tall: L((e.slurker || 0) + ' slurker', (e.slurker || 0) + ' sips') }); }
  const brudd = (data.rekord && data.rekord.brudd) || {}, bId = Object.keys(brudd).sort((a, b) => brudd[b] - brudd[a])[0];
  if (bId && l.some((p: any) => p.id === bId)) ut.push({ ikon: '💥', kode: 'ring', tittel: L('Ringbryteren', 'The ring breaker'), id: bId, navn: navn(bId), tall: L(brudd[bId] + (brudd[bId] === 1 ? ' ring' : ' ringer'), brudd[bId] + (brudd[bId] === 1 ? ' ring' : ' rings')) });
  const b = data.bors;
  if (b) {
    const start = (id: string) => (b.startKr && b.startKr[id] != null ? b.startKr[id] : 1000);
    const formue = l.map((p: any) => ({ id: p.id, navn: p.navn, g: Math.round((b.saldo && b.saldo[p.id] != null ? b.saldo[p.id] : 1000) - start(p.id)) })).sort((x: any, y: any) => y.g - x.g);
    if (formue.length >= 2 && formue[0].g > 0) ut.push({ ikon: '📈', kode: 'bors', tittel: L('Børskongen', 'Market king'), id: formue[0].id, navn: formue[0].navn, tall: L('+' + formue[0].g + ' kr', '+' + formue[0].g + ' coins') });
    const bunn = formue[formue.length - 1]; if (formue.length >= 2 && bunn.g < 0) ut.push({ ikon: '💸', tittel: L('Gikk konkurs', 'Went bust'), id: bunn.id, navn: bunn.navn, tall: L(bunn.g + ' kr', bunn.g + ' coins') });
  }
  const gav = maks('sendt'); if (gav) ut.push({ ikon: '🎁', kode: 'gavmild', tittel: L('Mest gavmild', 'Most generous'), id: gav.id, navn: gav.navn, tall: L(gav.sendt + ' 🍺 sendt', gav.sendt + ' 🍺 sent') });
  const mob = maks('mottatt'); if (mob) ut.push({ ikon: '🎯', kode: 'mobbet', tittel: L('Mest mobbet', 'Most picked on'), id: mob.id, navn: mob.navn, tall: L(mob.mottatt + ' 🍺 fått', mob.mottatt + ' 🍺 received') });
  const pekt = maks('pekt'); if (pekt && pekt.pekt >= 3) ut.push({ ikon: '👉', kode: 'pekt', tittel: L('Mest utpekt', 'Most pointed at'), id: pekt.id, navn: pekt.navn, tall: L(pekt.pekt + ' fingre', pekt.pekt + ' fingers') });
  const rrE = maks('rrEnige'); if (rrE && rrE.rrEnige >= 3) ut.push({ ikon: '🤝', kode: 'tankeleser', tittel: L('Tankeleseren', 'The mind reader'), id: rrE.id, navn: rrE.navn, tall: L('enig ' + rrE.rrEnige + ' ganger rygg mot rygg', 'agreed ' + rrE.rrEnige + ' times back to back') });
  const lbv = maks('lbVant'); if (lbv && lbv.lbVant >= 2) ut.push({ ikon: '🎵', kode: 'historieforteller', tittel: L('Historiefortelleren', 'The storyteller'), id: lbv.id, navn: lbv.navn, tall: L('beste historie ' + lbv.lbVant + ' ganger', 'best story ' + lbv.lbVant + ' times') });
  const bo = maks('kbBom'); if (bo && bo.kbBom >= 3) ut.push({ ikon: '💣', kode: 'bombeoffer', tittel: L('Bombeofferet', 'Bomb magnet'), id: bo.id, navn: bo.navn, tall: L('sprengt ' + bo.kbBom + ' ganger', 'blown up ' + bo.kbBom + ' times') });
  const duo = maks('duoGang'); if (duo && duo.duoGang >= 2) ut.push({ ikon: '💞', kode: 'drommeduo', tittel: L('Halve drømmeduoen', 'Half the dream duo'), id: duo.id, navn: duo.navn, tall: L('i duoen ' + duo.duoGang + ' ganger', 'in the duo ' + duo.duoGang + ' times') });
  const vh = maks('nsNodt'); if (vh && vh.nsNodt >= 3) ut.push({ ikon: '🔥', kode: 'vaghals', tittel: L('Våghalsen', 'The daredevil'), id: vh.id, navn: vh.navn, tall: L(vh.nsNodt + ' nødt gjennomført', vh.nsNodt + ' dares done') });
  const mot = maks('mindretall'); if (mot && mot.mindretall >= 3) ut.push({ ikon: '🧭', kode: 'motstrom', tittel: L('Mot strømmen', 'Against the current'), id: mot.id, navn: mot.navn, tall: L(mot.mindretall + ' ganger i mindretall', mot.mindretall + ' times in the minority') });
  const erf = maks('harGjort'); if (erf && erf.harGjort >= 5) ut.push({ ikon: '🍹', kode: 'erfaren', tittel: L('Mest erfaren', 'Most experienced'), id: erf.id, navn: erf.navn, tall: L('har gjort ' + erf.harGjort, 'has done ' + erf.harGjort) });
  const logn = maks('lurt'); if (logn && logn.lurt >= 2) ut.push({ ikon: '🎭', kode: 'logn', tittel: L('Kveldens løgnhals', 'Liar of the night'), id: logn.id, navn: logn.navn, tall: L('lurte ' + logn.lurt, 'fooled ' + logn.lurt) });
  const quiz = maks('quiz'); if (quiz) ut.push({ ikon: '🧠', kode: 'quiz', tittel: L('Quizmester', 'Quiz master'), id: quiz.id, navn: quiz.navn, tall: L(quiz.quiz + ' riktige', quiz.quiz + ' correct') });
  return ut;
}

/** Løgnhalsen: hvem som har lurt flest i kveld (bare de som har lurt noen). */
/** Hvem kan gå videre i kortlekene. I lekene dere gjør i virkeligheten (Pekeleken, Nødt eller sannhet, vanlige kortstokker)
    er det verten og den som har tur (og den som står for tur). I lekene der alle svarer på telefonen: alle (null). */
function kortVidere(s: any, data: any): string[] | null {
  if (!s || s.type !== 'kort' || s.ring || s.aldri || s.ee || s.rr || s.kb || s.lb) return null;
  const sp = data.spillere || [], n = sp.length, ut: any[] = [data.vert];
  if (n) {
    if (s.pek) { const i = s.pekLeser ?? 0; ut.push(sp[i % n] && sp[i % n].id, sp[(i + 1) % n] && sp[(i + 1) % n].id); }
    else if (s.ns) { const j = (s.nsNr || 0) % n; ut.push(s.ns.hvem, sp[j] && sp[j].id); }
    else if (s.tur !== null && s.tur !== undefined) { const t = s.tur % n; ut.push(sp[t] && sp[t].id, sp[(t + 1) % n] && sp[(t + 1) % n].id); }
  }
  return ut.filter(Boolean);
}
function lurtTavle(data: any) {
  return (data.spillere || []).filter((p: any) => p.lurt).map((p: any) => ({ id: p.id, n: p.lurt })).sort((a: any, b: any) => b.n - a.n).slice(0, 4);
}

/* ---------- storskjerm (TV) ---------- */
/** Verten lager en PIN som PC-en/TV-en bruker for å vise rommet. Storskjermen er ingen spiller og ser aldri hemmeligheter. */
export function skjermPinOk(data: any, pin: string) {
  const p = data && data.skjerm && data.skjerm.pin;
  if (!p || typeof pin !== 'string' || pin.length !== p.length) return false;
  let d = 0; for (let i = 0; i < p.length; i++) d |= p.charCodeAt(i) ^ pin.charCodeAt(i);
  return d === 0;
}
/** Det TV-en kan vise fra lekene der alle svarer på samme spørsmål. Aldri noe hemmelig (ikke muldvarp, ikke pannekort). */
function offentligTekst(s: any, data: any) {
  try {
    if (s.type === 'hvemskrev') return { tekst: s.oppgave, sitat: (s.fase === 'gjett' || s.fase === 'fasit') ? s.svar[s.ko[s.i]] || null : null, svart: Object.keys(s.svar || {}).length };
    if (s.type === 'bloff') return { tekst: s.q, valg: s.fase === 'skriv' ? null : (s.valg || []).map((v: any) => v.t), sant: s.fase === 'fasit' ? s.sant : null, svart: Object.keys(s.falske || {}).length };
    if (s.type === 'samme') return { tekst: s.oppgave, svart: Object.keys(s.svar || {}).length };
    if (s.type === 'tosannheter') return { tekst: null, hvem: s.aktiv || null, valg: s.pastander || null };
    if (s.type === 'regelfabrikken') return s.fase === 'trekk' && s.rekke[s.pos] ? { tekst: rfKortObj(s.rekke[s.pos]).t } : null;
    if (s.type === 'en') { const v = enVisning(s, data, 'no'); return v.kort ? { tekst: v.kort.t, hvem: v.leser } : null; }
    if (s.type === 'nyhetsrunden') { const q = s.sporsmal[s.i]; const aapen = s.fase === 'svar' || s.fase === 'ferdig'; return { tekst: q ? q.q : null, fasit: aapen && q ? q.svar : null, nr: s.i + 1, antall: s.sporsmal.length }; }
  } catch { /* ufullstendig runde: vis ingenting */ }
  return null;
}
export function skjermVisning(data: any, versjon: number, sprak: Lang | string = 'no') {
  const lang = rensLang(sprak), s = data.spill;
  let spill: any = null;
  if (s) {
    spill = { type: s.type, lek: s.lek, navn: s.navn, runde: s.runde || null, frist: s.frist || null, antallLeker: (data.historikk || []).length };
    if (s.type === 'kort' && s.pek) Object.assign(spill, { pek: pekVisning(s, null), pektTavle: pektTavle(data), pekForrige: s.pekForrige || null });
    if (s.type === 'kort') Object.assign(spill, { videre: kortVidere(s, data), kort: s.kort, pos: s.pos, antall: s.rekke.length, konger: s.konger, makkere: s.makkere || [], velgMakker: s.velgMakker || null,
      aldri: aldriVisning(s, null), ee: eeVisning(s, null), rr: rrVisning(s, null), ns: nsVisning(s, null), kb: kbVisning(s), lb: lbVisning(s, null), fase: s.ferdig ? 'kort-ferdig' : s.aldri ? 'aldri-' + s.aldri.fase : s.ee ? 'ee-' + s.ee.fase : s.rr ? 'rr-' + s.rr.fase : s.ns ? 'ns-' + s.ns.fase : s.kb ? 'kb-' + s.kb.fase : s.lb ? 'lb-' + s.lb.fase + (s.lb.fase === 'gjett' || s.lb.fase === 'avslort' ? s.lb.nr : '') : undefined, ferdig: !!s.ferdig, jaTavle: s.ferdig && s.lek === 'jeg-har-aldri' ? aldriTavle(s, data) : null, pekSlutt: s.ferdig && s.lek === 'pekeleken' ? pektTavle(data) : null,
      turId: s.tur !== null && s.tur !== undefined ? (data.spillere[s.tur % Math.max(1, data.spillere.length)] || {}).id || null : null },
      s.ring ? { ring: true, tatt: s.tatt, nr: s.nr, brudd: s.brudd, ringBrutt: !!s.ringBrutt, bruddPlass: s.bruddPlass == null ? null : s.bruddPlass, igjen: s.rekke.length - s.tatt.length, holder: s.holder || null } : {});
    if (s.type === 'mest') Object.assign(spill, { tot: s.tot || {}, tekst: s.tekst, fase: s.fase, stemt: Object.keys(s.stemmer || {}).length, harStemt: Object.keys(s.stemmer || {}), resultat: s.fase === 'resultat' ? s.resultat : null });
    if (s.type === 'forraeder') Object.assign(spill, { tekst: s.tekst, fase: s.fase, aktiv: s.aktiv, stemt: Object.keys(s.stemmer || {}).length, harStemt: Object.keys(s.stemmer || {}),
      runde: s.runde || 1, lurtTavle: lurtTavle(data),
      resultat: s.fase === 'avslort' ? { svar: s.hemmelig, stemmer: s.stemmer, sikker: s.sikker || {}, drikker: s.drikker, utdeling: s.utdeling || [], lurte: s.lurte || 0 } : null });
    const off = offentligTekst(s, data); if (off) spill.offentlig = off;
    if (s.type === 'samme' || s.type === 'hvemskrev' || s.type === 'spion' || s.type === 'skal' || s.type === 'bloff') spill.sos = sosVisning(s, null, data);
    if (s.type === 'pannekort') spill.sos = pkOffentlig(s);
    if (s.type === 'tosannheter') spill.ts = ekstraVisning(s, null, data);
    if (s.type === 'bingo') spill.bingoTv = bingoOffentlig(s, data);
    if (s.type === 'overunder') spill.ou = ekstraVisning(s, null, data);
    if (s.type === 'bussruta') spill.br = ekstraVisning(s, null, data);
    if (s.type === 'yatzy') spill.yz = ekstraVisning(s, null, data);
    if (s.type === 'pyramiden') spill.py = ekstraVisning(s, null, data);
    if (s.type === 'gris') spill.gr = ekstraVisning(s, null, data);
    if (s.type === 'president') spill.pr = ekstraVisning(s, null, data);
    if (s.type === 'dealer') spill.ftd = ekstraVisning(s, null, data);
    if (s.type === 'en') spill.en = enVisning(s, data, lang);
    if (s.type === 'veddelopet') spill.vl = ekstraVisning(s, null, data);
    if (s.type === 'nyhetsrunden') spill.nr = nyeVisning(s, null, data);
    if (s.type === 'regelfabrikken') spill.rf = ekstraVisning(s, null, data);
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
    spillere: data.spillere.map((p: any) => ({ id: p.id, navn: p.navn, pynt: p.pynt || null, figur: p.konto || p.bruker ? figurNokkel(p.konto || p.bruker) : p.id, par: erPar(p), slurker: p.slurker || 0 })),
    spill: lok(spill, lang), valgt: data.valgt ? { lek: data.valgt.lek, navn: tr(lekNavnL(data.valgt.lek), lang) } : null,
    hendelse: hd ? { nr: hd.nr, tekst: lang === 'en' && hd.en ? hd.en : tr(hd.tekst, lang) } : null,
    reak: data.reak || [], stuaHend: data.stuaHend || null, utdeling: data.utdeling || null, utdelinger: data.utdelinger || [], kveld: lok(kveldVisning(data), lang), bors: lok(bors, lang),
    stua: stuaVisning(data, null),
    alkoholfri: !!data.alkoholfri, ferdig: data.ferdig || null, kaaringer: data.ferdig ? lok(kaaringer(data), lang) : null, rofRegler: data.rofRegler || null,
    gjeng: data.gjeng ? { navn: data.gjeng.navn } : null,
    mester: data.mester ? { id: data.mester.id, til: data.mester.til } : null,
    vann: data.vann ? { nr: data.vann.nr, tid: data.vann.tid, t: tr(data.vann.t, lang) } : null,
  };
}

/** Eieren og Ida: står de nær hverandre i stua, stiger et hjerte opp mellom dem. */
function erPar(p: any) { const l = Array.isArray(p.laast) ? p.laast : []; return l.includes('eierkrone') || l.includes('idakrans'); }
/** Stua: hvor folk står, og siste slurk for plaging. `plager` = hvor mange ganger du har flyttet de andre siste minutt. */
function stuaVisning(data: any, meg: any) {
  const st = data.stua || {};
  const ider = new Set(data.spillere.map((p: any) => p.id).concat((data.sofa || []).map((p: any) => p.id)));
  const pos: any = {}; Object.keys(st.pos || {}).forEach((id) => { if (ider.has(id)) pos[id] = st.pos[id]; });
  const naa = Date.now();
  const vert = data.spillere.find((p: any) => p.id === data.vert) || {};
  const stil = rensStil(st.stil);
  return { pos, sofa: (data.sofa || []).map((p: any) => ({ id: p.id, navn: p.navn, slurker: p.slurker || 0 })), tema: temaFor(st.tema).id, ekstra: Array.isArray(st.ekstra) ? st.ekstra : [],
    gulv: stil.gulv, lys: stil.lys, ute: (Array.isArray(st.ute) ? st.ute : []).filter((id: string) => ider.has(id)),
    ekstraLov: meg && meg.id === data.vert ? ROM_EKSTRA.map((e: any) => e.id).filter((id: string) => ekstraLov(id, vert, data.historikk)) : [], straff: st.straff || null, plager: meg && st.plag && st.plag[meg.id] ? st.plag[meg.id].filter((t: number) => naa - t < 60000).length : 0, grense: STUA_PLAG };
}

/* ---------- hva hver telefon får se ---------- */
/** Hva hver telefon får se. Språket er spillerens eget (meg.lang); uten spiller brukes `sprak`. */
export function visning(data: any, versjon: number, meg: any, sprak: Lang | string = 'no') {
  const lang: Lang = meg ? rensLang(meg.lang) : rensLang(sprak);
  const s = data.spill;
  let spill: any = null;
  if (s) {
    spill = { type: s.type, lek: s.lek, navn: s.navn, modus: modusNavn(s, lang), runde: s.runde, frist: s.frist || null, turStart: s.turNokkel ? s.turStart || null : null };
    if (s.type === 'kort' && s.pek) Object.assign(spill, { pek: pekVisning(s, meg), pektTavle: pektTavle(data), pekForrige: s.pekForrige || null });
    if (s.type === 'kort') Object.assign(spill, { videre: kortVidere(s, data), kort: s.kort, pos: s.pos, antall: s.rekke.length, tur: s.tur, konger: s.konger, makkere: s.makkere || [], velgMakker: s.velgMakker || null,
      aldri: aldriVisning(s, meg), ee: eeVisning(s, meg), rr: rrVisning(s, meg), ns: nsVisning(s, meg), kb: kbVisning(s), lb: lbVisning(s, meg), svarPaa: !!s.svarPaa, kanSvar: SVAR_LEKER.includes(s.lek), ferdig: !!s.ferdig, jaTavle: s.ferdig && s.lek === 'jeg-har-aldri' ? aldriTavle(s, data) : null, pekSlutt: s.ferdig && s.lek === 'pekeleken' ? pektTavle(data) : null },
      s.ring ? { ring: true, tatt: s.tatt, nr: s.nr, brudd: s.brudd, ringBrutt: !!s.ringBrutt, bruddPlass: s.bruddPlass == null ? null : s.bruddPlass, sist: s.sist, turId: (data.spillere[s.tur % Math.max(1, data.spillere.length)] || {}).id || null, igjen: s.rekke.length - s.tatt.length, holder: s.holder || null } : {});
    if (s.type === 'mest') Object.assign(spill, {
      tekst: s.tekst, fase: s.fase,
      harStemt: Object.keys(s.stemmer),
      minStemme: meg ? s.stemmer[meg.id] || null : null,
      resultat: s.fase === 'resultat' ? s.resultat : null, runde: s.runde || 1, antall: s.antall || data.spillere.length, tot: s.tot || {},
    });
    if (s.type === 'forraeder') Object.assign(spill, {
      tekst: s.tekst, fase: s.fase, aktiv: s.aktiv,
      harStemt: Object.keys(s.stemmer),
      minStemme: meg ? s.stemmer[meg.id] || null : null, minSikker: !!(meg && s.sikker && s.sikker[meg.id]),
      hemmelig: meg && meg.id === s.aktiv ? s.hemmelig : null, byttet: !!s.byttet, runde: s.runde || 1, antall: s.antall || data.spillere.length,
      lurtTavle: lurtTavle(data),
      resultat: s.fase === 'avslort' ? { svar: s.hemmelig, stemmer: s.stemmer, sikker: s.sikker || {}, drikker: s.drikker, utdeling: s.utdeling || [], lurte: s.lurte || 0 } : null,
    });
    if (EKSTRA.includes(s.type)) Object.assign(spill, ekstraVisning(s, meg, data));
    if (s.type === 'en') Object.assign(spill, enVisning(s, data, lang));
    if (s.type === 'bingo') Object.assign(spill, {
      era: s.era, tittel: typeof s.tittel === 'string' && lang === 'en' ? eraTittel(s.era, 'en') : s.tittel, spotify: s.spotify,
      mittBrett: meg && s.brett[meg.id] ? s.brett[meg.id].map((i: number) => s.sanger[i]) : null,
      mineMerker: meg && s.merket[meg.id] ? s.merket[meg.id] : null,
      rekker: s.rekker, bingo: s.bingo, ferdig: !!s.ferdig, runde: s.runde || 1, sist: s.sist ? { id: s.sist.id, laat: s.sist.laat } : null,
      andre: data.spillere.map((p: any) => ({ id: p.id, n: (s.merket[p.id] || []).filter(Boolean).length })),
    });
  }
  const hd = data.hendelse;
  return {
    versjon, vert: data.vert, meg: meg ? meg.id : null, lang,
    spillere: data.spillere.map((p: any) => ({ id: p.id, navn: p.navn, pynt: p.pynt || null, figur: p.konto || p.bruker ? figurNokkel(p.konto || p.bruker) : p.id, par: erPar(p), bruker: !!(p.konto || p.bruker), medlem: !!p.konto, invitert: !!p.invitert, immun: p.immun || 0, slurker: p.slurker || 0, gi: p.gi || 0, sendt: p.sendt || 0, mottatt: p.mottatt || 0, quiz: p.quiz || 0, lang: rensLang(p.lang) })),
    spill: lok(spill, lang),
    hendelse: hd ? { nr: hd.nr, tekst: lang === 'en' && hd.en ? hd.en : tr(hd.tekst, lang) } : null,
    nr: data.nr, reak: data.reak || [], stuaHend: data.stuaHend || null, utdeling: data.utdeling || null, utdelinger: data.utdelinger || [], valgt: data.valgt || null, naa: Date.now(), hjul: data.hjul ? hjulVisning(data, lang) : null,
    stua: stuaVisning(data, meg), tvEkstra: null, nyPynt: meg && data.nyPynt ? data.nyPynt[meg.id] || null : null,
    hjulListe: data.hjulListe || (lang === 'en' ? HJUL_STANDARD_EN : HJUL_STANDARD), oppdrag: lok(oppdragVisning(data, meg), lang), bors: lok(borsVisning(data, meg), lang), pluss: data.pluss && data.pluss.til > Date.now() ? { til: data.pluss.til } : null, gratisPlasser: GRATIS_PLASSER, fullForsok: data.fullForsok || null, laget: data.laget, ferdig: data.ferdig || null, historikk: lok(data.historikk || [], lang),
    alkoholfri: !!data.alkoholfri, gjeng: data.gjeng ? { navn: data.gjeng.navn, kode: data.gjeng.kode, kveld: !!data.gjengKveld, regler: data.gjeng.regler || [] } : null,
    kveld: lok(kveldVisning(data), lang), plan: data.plan || null,
    kaaringer: data.ferdig ? lok(kaaringer(data), lang) : null,
    rofRegler: data.rofRegler || null,
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
/** Stua: så mange ganger kan du flytte på de andre i løpet av et minutt før du må ta en slurk. */
const STUA_PLAG = 6;
const FRIST = { mest: 30, forraeder: 30, tosannheter: 45, veddelopet: 45, nrKort: 40, nrLang: 60, aldri: 30 };

/* ---------- alle svarer: kortleker der hver telefon svarer i hemmelighet, og svarene vises samtidig ----------
   Først Jeg har aldri: «Jeg har» eller «Aldri». Når alle har svart (eller tiden er ute) vises hvem som har,
   og de får én slurk hver. Den som ikke svarte, regnes som «Aldri». Verten kan slå det av og bare trekke kort. */
const SVAR_LEKER = ['jeg-har-aldri'];
/** Kortlekene (ikke Ring of Fire): så mange kort i en runde. Kort dere ikke har hatt, kommer først. Så er leken ferdig. */
const KORT_LENGDE = 30;
/** Leker som spilles på én telefon (verten + sofaen). */
// Lese-spill (leses høyt, verten teller ned) og sende-rundt-spill (Kategorier, Ring of Fire). Ingen trykker for andre.
const EN_LEKER = ['jeg-har-aldri', 'pekeleken', 'nodt-eller-sannhet', 'enten-eller', 'samme', 'kategorier', 'ring-of-fire'];
const EN_SAMME = 10;
function enRekke(lek: string) {
  if (lek === 'samme') return stokk(sosListe('samme')).slice(0, EN_SAMME).map((t: any) => ({ t }));
  if (lek === 'ring-of-fire') return kortstokkFor(lek, '*');
  if (lek === 'enten-eller') return kortstokkFor(lek, '*').filter((k: any) => eeDel(k.t)).slice(0, KORT_LENGDE);
  return trappOpp(lek, '*', kortstokkFor(lek, '*').slice(0, KORT_LENGDE));
}
/** Plassene i sofaen i stua (samme rutenett som stua på telefonen og TV-en). */
// Fylles fra midten og utover, så tre stykker sprer seg i sofaen i stedet for å klumpe seg i den ene enden
const SOFA_SETER: [number, number][] = [[1.0, 3.3], [1.0, 2.1], [1.0, 4.5], [1.0, 2.7], [1.0, 3.9], [1.0, 1.9]];
function enVisning(s: any, data: any, lang: string) {
  const k = s.rekke[s.pos];
  // Den som leser, går på rundgang: verten først, så sofaen
  const lesere = [data.vert].concat((data.sofa || []).map((p: any) => p.id));
  const ut: any = { lek: s.lek, pos: s.pos, antall: s.rekke.length, ferdig: !!s.ferdig, runde: s.runde || 1, konger: s.konger || 0,
    kort: k && !s.ferdig ? { t: tr(k.t, lang), k: k.k ? tr(k.k, lang) : null } : null, leser: lesere[s.pos % lesere.length], neste: lesere[(s.pos + 1) % lesere.length], lesere };
  if (k && !s.ferdig && s.lek === 'enten-eller') { const d = eeDel(k.t); if (d) { ut.a = tr(d.a, lang); ut.b = tr(d.b, lang); } }
  if (k && !s.ferdig && s.lek === 'ring-of-fire') {
    const vk: any = visKort({ lek: 'ring-of-fire', rekke: s.rekke, pos: s.pos, konger: s.konger || 0, tur: null }, data);
    ut.kort = { v: tr(vk.v, lang), s: vk.s, rod: !!vk.rod, regel: tr(vk.regel, lang), tekst: tr(vk.tekst, lang), konge: k.v === 'K' };
  }
  return ut;
}
/* ---------- Pekeleken: 3 · 2 · 1 · PEK! og fingertelling ----------
   Den som leser går på rundgang. Nedtellingen har et felles starttidspunkt, så alle telefoner og TV-en
   viser «PEK!» samtidig. Etterpå trykker hver person inn hvor mange som pekte på dem. Flest fingre drikker
   like mange slurker (dobbelt på vrien «Dobbel»). Hvert femte kort eller så får en vri. */
const PEK_TELL = 2400;   // 3, 2, 1 à 800 ms – så PEK!
const PEK_VRIER = ['lukk', 'flertall', 'forsvar', 'selv', 'dobbel'];
/** Duo-kort i Pekeleken: «Hvem hadde …» – alle peker med begge hender, på to forskjellige. De to med flest fingre er duoen. */
const PEK_DUO_SJANSE = 8;
function pekDuoKort(s: any) {
  if (!s.pekDuoBunke || !s.pekDuoBunke.length) {
    const d = D['duoleken'], en = (DE['duoleken'] && DE['duoleken'].items) || [];
    const ok = (m: string) => s.modus === 'droy' ? m === 'droy' : s.modus === 'snill' ? m === 'snill' : true;
    s.pekDuoBunke = stokk(d.items.map((x: any, i: number) => [x, en[i]]).filter(([x]: any) => ok(x.m)).map(([x, e]: any) => kortL(x, e)));
  }
  const k = s.pekDuoBunke.shift() || { t: L('Hvem hadde startet et band sammen?', 'Which two would start a band together?'), k: '' };
  return { ...k, duo: true };
}
function nyPekRunde(s: any, data: any) {
  if (s.lek !== 'pekeleken') { s.pek = null; return; }
  const k = s.rekke[s.pos] || {};
  const n = Math.max(1, data.spillere.length);
  const forrige = s.pek;
  s.pekLeser = ((s.pekLeser ?? -1) + 1) % n;
  if (k.h || k.smak) { s.pek = { fase: 'hendelse', leser: data.spillere[s.pekLeser]?.id || null, vri: null }; return; }
  s.pekSidenVri = (s.pekSidenVri || 0) + 1;
  s.pekSidenDuo = (s.pekSidenDuo || 0) + 1;
  // Duo-kort: sjeldent og tilfeldig (ingen fast rytme), aldri to på rad og aldri samme kort som en vri
  if (data.spillere.length >= 3 && s.pekSidenDuo >= 3 && !(forrige && forrige.duo) && tilfeldig(100) < PEK_DUO_SJANSE) {
    s.rekke[s.pos] = pekDuoKort(s); s.kort = visKort(s, data); s.pekTekst = s.kort && s.kort.t; s.pekSidenDuo = 0;
    s.pek = { fase: 'klar', leser: data.spillere[s.pekLeser]?.id || null, vri: null, duo: true, start: null, fingre: {}, selv: [], resultat: null };
    return;
  }
  let vri: string | null = null;
  if (data.spillere.length >= 3 && s.pekSidenVri >= 4 && (s.pekSidenVri >= 7 || Math.random() < 0.4) && !(forrige && forrige.vri)) {
    vri = PEK_VRIER[tilfeldig(PEK_VRIER.length)]; s.pekSidenVri = 0;
  }
  s.pek = { fase: 'klar', leser: data.spillere[s.pekLeser]?.id || null, vri, start: null, fingre: {}, selv: [], resultat: null };
}
function avgjorPek(data: any) {
  const s = data.spill, pk = s.pek; if (!pk || pk.fase === 'ferdig' || pk.fase === 'forsvar') return;
  const f = pk.fingre || {}, ider = Object.keys(f);
  const maks = ider.reduce((m: number, id: string) => Math.max(m, f[id] || 0), 0);
  const topp = maks > 0 ? ider.filter((id) => f[id] === maks) : [];
  const slurker = pk.vri === 'dobbel' ? maks * 2 : maks;
  ider.forEach((id) => { const p = data.spillere.find((x: any) => x.id === id); if (p && f[id] > 0) p.pekt = (p.pekt || 0) + f[id]; });
  if (pk.duo) {
    const rekke = ider.filter((id) => f[id] > 0).sort((a, b) => f[b] - f[a] || tilfeldig(3) - 1);
    if (rekke.length >= 2) {
      const duo = rekke.slice(0, 2);
      duo.forEach((id) => { giSlurker(data, id, f[id]); const p = data.spillere.find((x: any) => x.id === id); if (p) p.duoGang = (p.duoGang || 0) + 1; });
      pk.resultat = { topp: duo, duo: true, maks, slurker: f[duo[1]], hver: { [duo[0]]: f[duo[0]], [duo[1]]: f[duo[1]] }, fordeling: { ...f } };
      pk.fase = 'ferdig';
      melde(data, `💞 Duoen: ${duo.map((id) => navnPaa(data, id)).join(' og ')} – skål sammen!`, `💞 The duo: ${duo.map((id) => navnPaa(data, id)).join(' and ')} – cheers together!`);
      return;
    }
  }
  pk.resultat = { topp, maks, slurker, fordeling: { ...f } };
  if (pk.vri === 'forsvar' && topp.length) { pk.fase = 'forsvar'; pk.forsvarFra = Date.now(); return; }
  topp.forEach((id) => giSlurker(data, id, slurker));
  pk.fase = 'ferdig';
  if (topp.length) melde(data, `${topp.map((id) => navnPaa(data, id)).join(' og ')} fikk flest fingre – ${slurker} ${slurker === 1 ? 'slurk' : 'slurker'}`, `${topp.map((id) => navnPaa(data, id)).join(' and ')} got the most fingers – ${slurker} ${slurker === 1 ? 'sip' : 'sips'}`);
}
function pekVisning(s: any, meg: any) {
  const pk = s.pek;
  return { fase: pk.fase, leser: pk.leser, vri: pk.vri, duo: !!pk.duo, start: pk.start || null, tell: PEK_TELL, harTalt: Object.keys(pk.fingre || {}),
    mine: meg && pk.fingre ? pk.fingre[meg.id] ?? null : null, selv: pk.selv || [], forsvarFra: pk.forsvarFra || null,
    resultat: pk.fase === 'ferdig' || pk.fase === 'forsvar' ? pk.resultat : null };
}
/** Hvem som har blitt pekt mest på i kveld. */
function pektTavle(data: any) {
  return (data.spillere || []).filter((p: any) => p.pekt).map((p: any) => ({ id: p.id, n: p.pekt })).sort((a: any, b: any) => b.n - a.n).slice(0, 4);
}
/* ---------- Enten eller: velg side i hemmelighet, så ser alle hvem som valgte hva ----------
   Kortet deles i to valg («A – eller B?»). Alle velger på telefonen, og ingen ser noe før klokka er ute.
   Har alle valgt, kortes klokka ned til tre sekunder. Mindretallet drikker én. Er én helt alene (minst tre
   som valgte), får hen 20 sekunder til å forsvare valget: får hen med seg én, drikker den personen – ellers
   drikker hen to. Valgte alle det samme, drikker den som trakk kortet én. Like mange: ingen drikker. */
const EE_FRIST = 20, EE_LAAS = 3, EE_FORSVAR = 20;
function eeDel(t: L | null): { a: L; b: L } | null {
  if (!t || !t.no) return null;
  const no = t.no.split(/\s+[–-]\s+eller\s+/i), en = String(t.en || t.no).split(/\s+[–-]\s+(?:or|eller)\s+/i);
  if (no.length !== 2) return null;
  if (en.length !== 2) en.splice(0, en.length, no[0], no[1]);
  const rens = (x: string) => x.replace(/[?!.…]+\s*$/, '').trim();
  const stor = (x: string) => x.charAt(0).toUpperCase() + x.slice(1);
  return { a: L(stor(rens(no[0])), stor(rens(en[0]))), b: L(stor(rens(no[1])), stor(rens(en[1]))) };
}
function nyEeRunde(s: any) {
  if (s.lek !== 'enten-eller' || s.ferdig) { s.ee = null; return; }
  const deler = !s.kort || s.kort.h || s.kort.smak ? null : eeDel(s.kort.t);
  if (!deler) { s.ee = null; s.frist = null; return; }
  s.ee = { fase: 'svar', a: deler.a, b: deler.b, svar: {}, resultat: null, forsvarFra: null };
  settFrist(s, EE_FRIST);
}
function avgjorEe(data: any) {
  const s = data.spill, e = s && s.ee; if (!e || e.fase !== 'svar') return;
  const ider = data.spillere.map((p: any) => p.id);
  const a = ider.filter((id: string) => e.svar[id] === 'a'), b = ider.filter((id: string) => e.svar[id] === 'b');
  const stemte = a.length + b.length;
  const r: any = { a, b, mindretall: [], alene: null, kjedelig: null, uavgjort: false, med: null, drakk: false };
  if (stemte >= 2 && (!a.length || !b.length)) {
    // Alle valgte det samme: den som trakk kortet drikker én for et for lett kort
    if (s.trakk && ider.includes(s.trakk)) { r.kjedelig = s.trakk; giSlurker(data, s.trakk, 1); }
  } else if (a.length && b.length && a.length === b.length) {
    r.uavgjort = true;
  } else if (a.length && b.length) {
    r.mindretall = a.length < b.length ? a : b;
    r.mindretall.forEach((id: string) => { const p = data.spillere.find((x: any) => x.id === id); if (p) p.mindretall = (p.mindretall || 0) + 1; });
    if (r.mindretall.length === 1 && stemte >= 3) { r.alene = r.mindretall[0]; e.fase = 'forsvar'; e.forsvarFra = Date.now(); }
    else r.mindretall.forEach((id: string) => giSlurker(data, id, 1));
  }
  e.resultat = r; s.frist = null;
  if (e.fase !== 'forsvar') e.fase = 'avslort';
}
function eeVisning(s: any, meg: any) {
  const e = s.ee; if (!e) return null;
  return { fase: e.fase, a: e.a, b: e.b, harSvart: Object.keys(e.svar), mitt: meg ? e.svar[meg.id] || null : null,
    forsvarFra: e.forsvarFra || null, forsvar: EE_FORSVAR, resultat: e.fase === 'svar' ? null : e.resultat };
}
/* ---------- Rygg mot rygg: to peker i hemmelighet, alle andre gjetter ----------
   Paret går i kjede: A og B, B og C, C og A … så én person er med to kort på rad. Hver spiller er med på
   omtrent seks kort (3 kort per spiller i runden, 6–30 kort). De to peker på «meg» eller på den andre.
   Alle andre gjetter: den ene, den andre eller «uenige». Enige: den de pekte på drikker én. Uenige: begge
   drikker én. Alle som gjettet feil, drikker én. Den i paret som ikke pekte, drikker én. */
const RR_FRIST = 25, RR_LAAS = 3;
function rrLengde(n: number) { return Math.min(KORT_LENGDE, Math.max(6, 3 * n)); }
function nyRrRunde(s: any, data: any) {
  if (s.lek !== 'rygg-mot-rygg' || s.ferdig) { s.rr = null; return; }
  const n = data.spillere.length;
  if (n < 2 || !s.kort || s.kort.h || s.kort.smak) { s.rr = null; s.frist = null; return; }
  const i = s.rrNr || 0; s.rrNr = i + 1;
  const a = data.spillere[i % n].id, b = data.spillere[(i + 1) % n].id;
  s.rr = { fase: 'svar', a, b, pek: {}, gjett: {}, resultat: null };
  settFrist(s, RR_FRIST);
}
function rrKlare(s: any, data: any) {
  const r = s.rr; if (!r) return false;
  return !!(r.pek[r.a] && r.pek[r.b]) && data.spillere.every((p: any) => p.id === r.a || p.id === r.b || r.gjett[p.id]);
}
function avgjorRr(data: any) {
  const s = data.spill, r = s && s.rr; if (!r || r.fase !== 'svar') return;
  const pa = r.pek[r.a] || null, pb = r.pek[r.b] || null;
  const res: any = { pa, pb, enige: false, fasit: null, feil: [], mangler: [], gjett: { ...r.gjett } };
  if (!pa) res.mangler.push(r.a);
  if (!pb) res.mangler.push(r.b);
  res.mangler.forEach((id: string) => giSlurker(data, id, 1));
  if (pa && pb) {
    res.enige = pa === pb; res.fasit = res.enige ? pa : 'uenig';
    if (res.enige) giSlurker(data, pa, 1); else { giSlurker(data, r.a, 1); giSlurker(data, r.b, 1); }
    Object.keys(r.gjett).forEach((id) => { if (r.gjett[id] !== res.fasit && data.spillere.some((p: any) => p.id === id)) { res.feil.push(id); giSlurker(data, id, 1); } });
    if (res.enige) { const p = data.spillere.find((x: any) => x.id === r.a), q = data.spillere.find((x: any) => x.id === r.b); [p, q].forEach((x: any) => { if (x) x.rrEnige = (x.rrEnige || 0) + 1; }); }
  }
  r.resultat = res; r.fase = 'avslort'; s.frist = null;
}
function rrVisning(s: any, meg: any) {
  const r = s.rr; if (!r) return null;
  const jegIPar = !!meg && (meg.id === r.a || meg.id === r.b);
  return { fase: r.fase, a: r.a, b: r.b, harPekt: Object.keys(r.pek), harGjettet: Object.keys(r.gjett),
    mitt: meg ? (jegIPar ? r.pek[meg.id] || null : r.gjett[meg.id] || null) : null,
    resultat: r.fase === 'svar' ? null : r.resultat };
}
/* ---------- Nødt eller sannhet: én i stolen, alle andre er dommere ----------
   For hvert kort setter appen neste person i stolen (etter tur). Hen velger nødt eller sannhet, og først da
   trekkes kortet fra den bunken. Hen gjør det – eller feiger ut og drikker 3. Alle andre dømmer: «Godkjent»
   eller «Juks!». Flertallet bestemmer (likt = godkjent). Juks: drikk 2. Runden er 3 kort per spiller (6–30). */
const NS_VELG = 20, NS_DOM = 20, NS_LAAS = 2, NS_FEIG = 3, NS_JUKS = 2;
function nsLengde(n: number) { return Math.min(KORT_LENGDE, Math.max(6, 3 * n)); }
function nsBunke(modus: string, type: 'nodt' | 'sannhet', sett?: Set<string> | null) {
  const d = D['nodt-eller-sannhet'], en = (DE['nodt-eller-sannhet'] && DE['nodt-eller-sannhet'].items) || [];
  const nivaa = modus === 'snill' || modus === 'ss' || modus === 'ns' ? 's' : modus === 'droy' || modus === 'sd' || modus === 'nd' ? 'd' : '';
  const koder = (type === 'nodt' ? ['ns', 'nd'] : ['ss', 'sd']).filter((m) => !nivaa || m.endsWith(nivaa));
  const kort = d.items.map((x: any, i: number) => [x, en[i]]).filter(([x]: any) => koder.includes(x.m)).map(([x, e]: any) => ({ ...kortL(x, e), ns: type }));
  return trappOpp('nodt-eller-sannhet', nivaa ? modus : '*', usetteForst(stokk(kort), sett));
}
/** Rekka er tomme plasser: kortet trekkes først når personen i stolen har valgt. */
function nsRekke(data: any, modus: string, sett?: Set<string> | null) {
  const bunker = { nodt: nsBunke(modus, 'nodt', sett), sannhet: nsBunke(modus, 'sannhet', sett) };
  const plass = { t: L('Nødt eller sannhet?', 'Truth or dare?'), k: '', nsPlass: true };
  return { bunker, rekke: Array.from({ length: nsLengde(data.spillere.length) }, () => ({ ...plass })) };
}
function nsTrekk(s: any, type: 'nodt' | 'sannhet') {
  if (!s.nsBunker) s.nsBunker = {};
  if (!s.nsBunker[type] || !s.nsBunker[type].length) s.nsBunker[type] = nsBunke(s.modus, type, null);
  return s.nsBunker[type].shift();
}
function nyNsRunde(s: any, data: any) {
  if (s.lek !== 'nodt-eller-sannhet' || s.ferdig) { s.ns = null; return; }
  const k = s.rekke[s.pos];
  if (!k || !k.nsPlass) { s.ns = null; s.frist = null; return; }   // hendelseskort
  const n = data.spillere.length;
  if (n < 2) {   // alene: bare et kort, uten stol og dommere
    s.rekke[s.pos] = nsTrekk(s, tilfeldig(2) ? 'nodt' : 'sannhet'); s.kort = visKort(s, data); s.ns = null; s.frist = null; return;
  }
  const i = s.nsNr || 0; s.nsNr = i + 1;
  s.ns = { fase: 'velg', hvem: data.spillere[i % n].id, valg: null, stemmer: {}, resultat: null, auto: false };
  settFrist(s, NS_VELG);
}
function nsVelg(s: any, data: any, valg: 'nodt' | 'sannhet', auto = false) {
  const r = s.ns; if (!r || r.fase !== 'velg') return;
  r.valg = valg; r.auto = auto; r.fase = 'gjor'; s.frist = null;
  s.rekke[s.pos] = navnInn(nsTrekk(s, valg), data, r.hvem); s.kort = visKort(s, data);
}
/** «Personen til venstre» blir et navn fra rommet – et kort med navn på treffer hardere enn et om «naboen».
    Venstre, høyre og overfor blir tre ulike personer når det er nok folk. Originalteksten beholdes i `o`, så kortet
    telles som sett uansett navn. */
function navnInn(k: any, data: any, hvem: string) {
  if (!k || !k.t || typeof k.t !== 'object') return k;
  const andre = stokk(data.spillere.filter((p: any) => p.id !== hvem)).map((p: any) => p.navn);
  if (!andre.length) return k;
  const n = (i: number) => andre[i % andre.length];
  const no = k.t.no.replace(/personen til venstre/g, n(0)).replace(/personen til høyre/g, n(1)).replace(/personen overfor deg/g, n(2));
  const en = k.t.en.replace(/the person (on|to) your left/g, n(0)).replace(/the person (on|to) your right/g, n(1)).replace(/the person opposite you/g, n(2));
  if (no === k.t.no && en === k.t.en) return k;
  return { ...k, o: k.t.no, t: { no, en } };
}
function nsDommere(s: any, data: any) { return data.spillere.filter((p: any) => p.id !== s.ns.hvem); }
function avgjorNs(data: any) {
  const s = data.spill, r = s && s.ns; if (!r || r.fase !== 'dom') return;
  const st: any = {}; nsDommere(s, data).forEach((p: any) => { if (r.stemmer[p.id]) st[p.id] = r.stemmer[p.id]; });
  const ja = Object.values(st).filter((v) => v === 'ja').length, nei = Object.values(st).filter((v) => v === 'nei').length;
  const juks = nei > ja;
  if (juks) giSlurker(data, r.hvem, NS_JUKS);
  else if (r.valg === 'nodt') { const p = data.spillere.find((x: any) => x.id === r.hvem); if (p) p.nsNodt = (p.nsNodt || 0) + 1; }
  r.resultat = { ja, nei, juks, feig: false, stemmer: st }; r.fase = 'avslort'; s.frist = null;
}
function nsFeig(data: any) {
  const s = data.spill, r = s && s.ns; if (!r || (r.fase !== 'gjor' && r.fase !== 'dom')) return;
  giSlurker(data, r.hvem, NS_FEIG);
  r.resultat = { ja: 0, nei: 0, juks: false, feig: true, stemmer: {} }; r.fase = 'avslort'; s.frist = null;
}
function nsVisning(s: any, meg: any) {
  const r = s.ns; if (!r) return null;
  return { fase: r.fase, hvem: r.hvem, valg: r.valg, auto: r.auto, harStemt: Object.keys(r.stemmer),
    mitt: meg && r.fase === 'dom' ? r.stemmer[meg.id] || null : null, resultat: r.fase === 'avslort' ? r.resultat : null };
}
/* ---------- Kategorier: bomba går rundt ----------
   Den som har bomba, sier noe i kategorien og trykker «Sagt!», så går bomba til neste. Ingen vet når den
   smeller (20–45 s etter at kortet kom). Den som har den da, drikker 2. Neste kategori starter hos hen. */
const KB_MIN = 20, KB_SPENN = 25, KB_LES = 3, KB_SLURKER = 2, KB_PAUSE = 700;
function nyKbRunde(s: any, data: any) {
  if (s.lek !== 'kategorier' || s.ferdig) { s.kb = null; return; }
  const n = data.spillere.length;
  if (n < 2 || !s.kort || s.kort.h || s.kort.smak) { s.kb = null; return; }
  const fra = s.kbStart && data.spillere.some((p: any) => p.id === s.kbStart) ? s.kbStart : data.spillere[tilfeldig(n)].id;
  const naa = Date.now();
  s.kb = { fase: 'gaar', holder: fra, svar: 0, start: naa, smell: naa + (KB_LES + KB_MIN + tilfeldig(KB_SPENN + 1)) * 1000, sist: 0, protest: [], resultat: null };
}
function kbNeste(data: any, id: string) {
  const i = data.spillere.findIndex((p: any) => p.id === id);
  return data.spillere[(i + 1) % data.spillere.length].id;
}
function kbSmell(data: any) {
  const s = data.spill, b = s && s.kb; if (!b || b.fase !== 'gaar' || Date.now() < b.smell - 300) return;
  giSlurker(data, b.holder, KB_SLURKER);
  const p = data.spillere.find((x: any) => x.id === b.holder); if (p) p.kbBom = (p.kbBom || 0) + 1;
  b.fase = 'bom'; b.resultat = { holder: b.holder, svar: b.svar }; s.kbStart = b.holder;
}
function kbVisning(s: any) {
  const b = s.kb; if (!b) return null;
  return { fase: b.fase, holder: b.holder, svar: b.svar, start: b.start, smell: b.smell, protest: b.protest, resultat: b.resultat };
}
/* ---------- Låtbekjennelsen: hvem valgte låta? ----------
   Alle skriver inn én låt til kategorien i hemmelighet. Så kommer låtene én og én i tilfeldig rekkefølge;
   verten spiller dem på Spotify. Alle andre gjetter hvem som valgte den – feil gjett drikker én – og eieren
   forteller historien. Til slutt stemmer alle på beste historie; vinneren deler ut 3. En runde er 8 kategorier. */
const LB_SKRIV = 60, LB_GJETT = 25, LB_STEM = 25, LB_LAAS = 2, LB_LENGDE = 8, LB_PREMIE = 3;
function nyLbRunde(s: any, data: any) {
  if (s.lek !== 'tanken-bak-sangen' || s.ferdig) { s.lb = null; return; }
  if (data.spillere.length < 2 || !s.kort || s.kort.h || s.kort.smak) { s.lb = null; s.frist = null; return; }
  s.lb = { fase: 'skriv', later: {}, rekkefolge: [], nr: 0, gjett: {}, stemmer: {}, svar: null, resultat: null, logg: [] };
  settFrist(s, LB_SKRIV);
}
function lbKort(s: any) { const k = Date.now() + LB_LAAS * 1000 + 1500; if (!s.frist || s.frist > k) s.frist = k; }
function lbStartGjett(s: any) {
  const b = s.lb; b.fase = 'gjett'; b.gjett = {}; b.svar = null; settFrist(s, LB_GJETT);
}
function lbVidere(s: any, data: any) {   // klokka er ute (eller alle er ferdige)
  const b = s.lb; if (!b) return;
  if (b.fase === 'skriv') {
    b.rekkefolge = stokk(Object.keys(b.later).filter((id) => data.spillere.some((p: any) => p.id === id)));
    if (!b.rekkefolge.length) { b.fase = 'ferdig'; b.resultat = { vinnere: [], stemmer: 0, tom: true }; s.frist = null; return; }
    b.nr = 0; lbStartGjett(s); return;
  }
  if (b.fase === 'gjett') {
    const eier = b.rekkefolge[b.nr], rett: string[] = [], feil: string[] = [];
    Object.keys(b.gjett).forEach((id) => { if (!data.spillere.some((p: any) => p.id === id)) return; (b.gjett[id] === eier ? rett : feil).push(id); });
    feil.forEach((id) => giSlurker(data, id, 1));
    b.svar = { eier, rett, feil, gjett: { ...b.gjett } };
    b.logg.push({ eier, tekst: b.later[eier] });
    b.fase = 'avslort'; s.frist = null; return;
  }
  if (b.fase === 'stem') {
    const telling: Record<string, number> = {};
    Object.entries(b.stemmer).forEach(([fra, id]: any) => { if (fra !== id && data.spillere.some((p: any) => p.id === id)) telling[id] = (telling[id] || 0) + 1; });
    const maks = Math.max(0, ...Object.values(telling));
    const vinnere = maks ? Object.keys(telling).filter((id) => telling[id] === maks) : [];
    vinnere.forEach((id) => { giUtdeling(data, id, LB_PREMIE); const p = data.spillere.find((x: any) => x.id === id); if (p) p.lbVant = (p.lbVant || 0) + 1; });
    b.resultat = { vinnere, stemmer: maks, telling };
    b.fase = 'ferdig'; s.frist = null;
    if (vinnere.length) melde(data, `🎵 Beste historie: ${vinnere.map((id) => navnPaa(data, id)).join(' og ')} – deler ut ${LB_PREMIE}`, `🎵 Best story: ${vinnere.map((id) => navnPaa(data, id)).join(' and ')} – hands out ${LB_PREMIE}`);
  }
}
function lbAlleFerdige(s: any, data: any) {
  const b = s.lb; if (!b) return false;
  if (b.fase === 'skriv') return data.spillere.every((p: any) => b.later[p.id]);
  if (b.fase === 'gjett') { const eier = b.rekkefolge[b.nr]; return data.spillere.every((p: any) => p.id === eier || b.gjett[p.id]); }
  if (b.fase === 'stem') return data.spillere.every((p: any) => b.stemmer[p.id]);
  return false;
}
function lbVisning(s: any, meg: any) {
  const b = s.lb; if (!b) return null;
  const eier = b.fase === 'gjett' || b.fase === 'avslort' ? b.rekkefolge[b.nr] : null;
  return { fase: b.fase, nr: b.nr, antall: b.rekkefolge.length || Object.keys(b.later).length,
    harSkrevet: Object.keys(b.later), min: meg ? b.later[meg.id] || null : null,
    lat: eier ? b.later[eier] : null, minLat: !!(meg && eier && eier === meg.id),
    harGjettet: Object.keys(b.gjett), mittGjett: meg ? b.gjett[meg.id] || null : null,
    svar: b.fase === 'avslort' ? b.svar : null,
    harStemt: Object.keys(b.stemmer), minStemme: meg ? b.stemmer[meg.id] || null : null,
    resultat: b.fase === 'ferdig' ? b.resultat : null, logg: b.fase === 'ferdig' || b.fase === 'stem' ? b.logg : [] };
}
function nyAldriRunde(s: any) {
  if (!s.svarPaa || !s.kort || s.kort.h) { s.aldri = null; s.frist = null; return; }
  s.aldri = { fase: 'svar', svar: {}, har: [] };
  settFrist(s, FRIST.aldri);
}
function avgjorAldri(data: any) {
  const s = data.spill, a = s && s.aldri; if (!a || a.fase !== 'svar') return;
  const n = data.spillere.length;
  a.har = data.spillere.filter((p: any) => a.svar[p.id] === 'har').map((p: any) => p.id);
  // Bare én har gjort det (og dere er minst tre): fortell historien og drikk to – nekter du, blir det fire
  a.ulv = a.har.length === 1 && n >= 3 ? a.har[0] : null;
  a.har.forEach((id: string) => giSlurker(data, id, a.ulv ? 2 : 1));
  // Ingen har gjort det: den som trakk det kjedelige kortet, drikker én
  a.kjedelig = !a.har.length && n >= 2 && s.trakk && data.spillere.some((p: any) => p.id === s.trakk) ? s.trakk : null;
  if (a.kjedelig) giSlurker(data, a.kjedelig, 1);
  s.aldriTeller = s.aldriTeller || {};
  a.har.forEach((id: string) => {
    s.aldriTeller[id] = (s.aldriTeller[id] || 0) + 1;
    const p = data.spillere.find((x: any) => x.id === id); if (p) p.harGjort = (p.harGjort || 0) + 1;
  });
  a.fase = 'avslort'; s.frist = null;
}
/** Det telefonene og TV-en får se av runden. `meg` = null på TV-en. */
function aldriVisning(s: any, meg: any) {
  const a = s.aldri; if (!a) return null;
  const teller = s.aldriTeller || {};
  const topp = Object.keys(teller).sort((x, y) => teller[y] - teller[x])[0];
  return {
    fase: a.fase, harSvart: Object.keys(a.svar), mitt: meg ? a.svar[meg.id] || null : null,
    har: a.fase === 'avslort' ? a.har : null,
    ulv: a.fase === 'avslort' ? a.ulv || null : null, nektet: !!a.nektet, kjedelig: a.fase === 'avslort' ? a.kjedelig || null : null,
    mest: topp && teller[topp] >= 3 ? { id: topp, n: teller[topp] } : null,
  };
}
/** Jeg har aldri: hvem som har gjort mest i runden, når kortene er brukt opp. */
function aldriTavle(s: any, data: any) {
  const t = s.aldriTeller || {};
  return (data.spillere || []).map((p: any) => ({ id: p.id, n: t[p.id] || 0 })).sort((a: any, b: any) => b.n - a.n);
}
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
  if (n > 0 && !viaMakker) stuaHendelse(data, 'drikk', [id]);
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
  const t = String((k && k.o) || (k && k.t && typeof k.t === 'object' ? k.t.no : (k && k.t) || ''));
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
  return { t: L(x.t, et && et.t), k: x.k ? L(x.k, et && et.k) : '', m: x.m || undefined };
}
/** Blandet modus trappes opp: runden begynner snill og blir drøyere utover, med litt tilfeldig overlapp
    så den ikke blir forutsigbar. Gode selskapsleker varmer opp før de blir personlige. */
function trappOpp(lek: string, modus: string, rekke: any[]) {
  const d = D[lek]; if (modus !== '*' || !d || !d.modes || d.modes.length < 2) return rekke;
  const niv = (k: any) => Math.max(0, d.modes.findIndex((m: any) => m.v === k.m));
  return rekke.map((k) => ({ k, n: niv(k) + tilfeldig(1000) / 1000 * 1.4 })).sort((a, b) => a.n - b.n).map((x) => x.k);
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
/** Standardregelen og alternativene for hvert kort i Ring of Fire (ikke kongen), på ett språk. Telefonene viser dem i «Kortregler». */
function rofKortregler(en: boolean) {
  const r: any = D['ring-of-fire'], re: any = DE['ring-of-fire'] || {};
  const std: any = {}, alt: any = {};
  Object.keys(r.kort).forEach((v) => {
    if (v === 'K') return;
    std[v] = en && re.kort && re.kort[v] ? re.kort[v] : r.kort[v];
    alt[v] = (en && re.alternativer && re.alternativer[v]) || (r.alternativer && r.alternativer[v]) || [];
  });
  return { std, alt, rekke: ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q'].filter((v) => r.kort[v]) };
}
const ROF_BRUDD = 5;   // slurker når ringen ryker («drikk opp»)
const KONGE_NR: [string, string][] = [['Første', 'First'], ['Andre', 'Second'], ['Tredje', 'Third'], ['Fjerde', 'Fourth']];
function visKort(s: any, data: any) {
  const k = s.rekke[s.pos];
  if (s.lek !== 'ring-of-fire') return { t: k.t, k: k.k, h: k.h || undefined, ns: k.ns || undefined, id: k.smak || k.h || k.nsPlass ? null : kortId(k) };
  const info = D['ring-of-fire'].kort[k.v], infoEn = (DE['ring-of-fire'] && DE['ring-of-fire'].kort && DE['ring-of-fire'].kort[k.v]) || info;
  let regel: any = L(info[0], infoEn[0]), tekst: any = L(info[1], infoEn[1]);
  // Verten kan ha byttet regelen på kortet (standard, et alternativ eller sin egen tekst)
  const egen = data.rofRegler && data.rofRegler[k.v];
  if (egen && k.v !== 'K') { regel = egen[0]; tekst = egen[1]; }
  if (k.v === 'K') {
    const nr = s.konger; const sl = D['ring-of-fire'].konger[Math.min(nr, 4) - 1];
    const kn = KONGE_NR[nr - 1] || ['Neste', 'Next'];
    regel = L(kn[0] + ' konge', kn[1] + ' king');
    tekst = L('Drikk ' + sl + ' slurker.' + (nr === 4 ? ' Det var siste konge!' : ''), 'Drink ' + sl + ' sips.' + (nr === 4 ? ' That was the last king!' : ''));
  }
  return { v: k.v === 'J' ? L('Kn', 'J') : (k.v === 'Q' ? L('D', 'Q') : k.v), s: k.s, rod: k.rod, regel, tekst, hvem: s.tur !== null ? navnPaa(data, data.spillere[s.tur]?.id) : null };
}

/* ---------- Hendelseskort ----------
   I kortlekene i rommet dukker det opp et hendelseskort omtrent hvert 6.–10. kort: en duell, en ny regel,
   en gave eller en vri med navnene i rommet. Noen av dem gjør noe med kvelden (deler ut slurker, gir et
   skjold), og to av dem bruker slurketavla – den som har drukket minst, og den som har drukket mest.
   Ikke i Ring of Fire, som har egne regler, og bare når dere er minst to. */
const HENDELSE_MIN = 6, HENDELSE_SPENN = 5;
const nesteHendelse = () => HENDELSE_MIN + tilfeldig(HENDELSE_SPENN);
type HendelseKort = { t: L; k: L; h: true };
const HENDELSER: { id: string; navn: number; lag: (a: string[], data: any) => HendelseKort | null }[] = [
  { id: 'duell', navn: 2, lag: ([a, b]) => hk('⚔️ Duell', '⚔️ Duel', `${a} mot ${b}: stein, saks, papir. Taperen drikker 2.`, `${a} vs ${b}: rock, paper, scissors. The loser drinks 2.`) },
  { id: 'regel', navn: 1, lag: ([a]) => hk('📜 Ny regel', '📜 New rule', `${a} lager en regel som gjelder resten av kvelden. Bryter du den, drikker du.`, `${a} makes a rule that lasts the rest of the night. Break it and you drink.`) },
  { id: 'vert', navn: 0, lag: (_, data) => {
    const v = navnPaa(data, data.vert); if (v === '?') return null;
    giUtdeling(data, data.vert, 2);
    return hk('🥂 Skål for verten', '🥂 Cheers to the host', `Alle reiser seg og skåler for ${v}. ${v} får 2 slurker å dele ut.`, `Everyone stands up and toasts ${v}. ${v} gets 2 sips to hand out.`);
  } },
  { id: 'gave', navn: 1, lag: ([a], data) => { giUtdeling(data, idPaa(data, a), 3); return hk('🎁 Gave', '🎁 Gift', `${a} får 3 slurker å dele ut – bruk 🍺-knappen.`, `${a} gets 3 sips to hand out – use the 🍺 button.`); } },
  { id: 'skjold', navn: 1, lag: ([a], data) => {
    const p = data.spillere.find((x: any) => x.navn === a); if (!p || (p.immun || 0) >= BUTIKK.maksImmun) return null;
    p.immun = (p.immun || 0) + 1;
    return hk('🛡️ Skjold', '🛡️ Shield', `${a} får et skjold og slipper neste gang appen gir hen slurker.`, `${a} gets a shield and skips the next sips the app gives them.`);
  } },
  { id: 'bytt', navn: 2, lag: ([a, b]) => hk('🔄 Bytt plass', '🔄 Swap seats', `${a} og ${b} bytter plass. Den som er sist på plass, drikker 1.`, `${a} and ${b} swap seats. Whoever sits down last drinks 1.`) },
  { id: 'foss', navn: 1, lag: ([a]) => hk('🌊 Foss', '🌊 Waterfall', `${a} starter en foss. Ingen får stoppe før personen til høyre for seg har stoppet.`, `${a} starts a waterfall. Nobody can stop before the person to their right has stopped.`) },
  { id: 'stille', navn: 0, lag: () => hk('🤫 Ingen navn', '🤫 No names', 'Ingen får si et eneste navn før neste hendelse. Sier du et navn, drikker du.', 'Nobody can say a single name until the next event. Say a name and you drink.') },
  { id: 'lyn', navn: 0, lag: () => hk('⚡ Lynrunde', '⚡ Lightning round', 'De tre neste kortene går på tid: den som svarer eller peker sist, drikker 1.', 'The next three cards are against the clock: whoever answers or points last drinks 1.') },
  { id: 'skaal', navn: 0, lag: () => hk('🍻 Skål!', '🍻 Cheers!', 'Alle reiser seg og skåler. Sistemann på beina drikker 1.', 'Everyone stands up and toasts. Last one on their feet drinks 1.') },
  { id: 'makker', navn: 2, lag: ([a, b]) => hk('🤝 Drikkemakkere', '🤝 Drinking buddies', `${a} og ${b} er makkere til neste hendelse: drikker den ene, drikker den andre.`, `${a} and ${b} are buddies until the next event: when one drinks, so does the other.`) },
  { id: 'dommer', navn: 1, lag: ([a]) => hk('⚖️ Dommer', '⚖️ Judge', `${a} er dommer for de to neste kortene og bestemmer alene hvem som drikker.`, `${a} judges the next two cards and decides alone who drinks.`) },
  { id: 'historie', navn: 1, lag: ([a]) => hk('🎤 Fortell', '🎤 Story time', `${a} forteller den pinligste fyllehistorien sin – eller drikker 3.`, `${a} tells their most embarrassing drunk story – or drinks 3.`) },
  { id: 'dj', navn: 1, lag: ([a]) => hk('🎵 DJ', '🎵 DJ', `${a} velger neste låt. Kan du ikke refrenget når det kommer, drikker du 1.`, `${a} picks the next song. If you don't know the chorus when it comes, drink 1.`) },
  { id: 'stilling', navn: 0, lag: (_, data) => {
    const r = slurkeRang(data); if (!r) return null;
    return hk('📊 Stillingen nå', '📊 The standings', `${r.mest.navn} leder kvelden med ${antSl(r.mest.slurker)}. ${r.minst.navn} er sist med ${r.minst.slurker}. Skal det fortsette sånn?`, `${r.mest.navn} leads the night with ${antSlEn(r.mest.slurker)}. ${r.minst.navn} is last with ${r.minst.slurker}. Is it staying that way?`);
  } },
  { id: 'edru', navn: 0, lag: (_, data) => {
    const r = slurkeRang(data); if (!r) return null;
    giSlurker(data, r.minst.id, 2);
    return hk('😇 For edru', '😇 Too sober', `${r.minst.navn} har drukket minst så langt i kveld. Ta 2 – nå.`, `${r.minst.navn} has drunk the least so far tonight. Take 2 – now.`);
  } },
  { id: 'toff', navn: 0, lag: (_, data) => {
    const r = slurkeRang(data); if (!r) return null;
    const p = data.spillere.find((x: any) => x.id === r.mest.id); if (p && (p.immun || 0) < BUTIKK.maksImmun) p.immun = (p.immun || 0) + 1;
    giUtdeling(data, r.mest.id, 2);
    return hk('🫡 Tøffest i kveld', '🫡 Toughest tonight', `${r.mest.navn} har tatt flest slurker i kveld (${r.mest.slurker}). Får et skjold og 2 slurker å dele ut.`, `${r.mest.navn} has taken the most sips tonight (${r.mest.slurker}). Gets a shield and 2 sips to hand out.`);
  } },
];
const antSl = (n: number) => n + (n === 1 ? ' slurk' : ' slurker'), antSlEn = (n: number) => n + (n === 1 ? ' sip' : ' sips');
function hk(k: string, kEn: string, t: string, tEn: string): HendelseKort { return { k: L(k, kEn), t: L(t, tEn), h: true }; }
function idPaa(data: any, navn: string) { const p = data.spillere.find((x: any) => x.navn === navn); return p ? p.id : ''; }
/** Den som har drukket minst og mest – bare når tavla faktisk sier noe (noen har slurker, og det er en klar første og sist). */
function slurkeRang(data: any) {
  const ps = data.spillere.filter((p: any) => p.navn).map((p: any) => ({ id: p.id, navn: p.navn, slurker: p.slurker || 0 }));
  if (ps.length < 2) return null;
  const sortert = ps.slice().sort((a: any, b: any) => a.slurker - b.slurker);
  const minst = sortert[0], mest = sortert[sortert.length - 1];
  if (!mest.slurker || sortert[1].slurker === minst.slurker || sortert[sortert.length - 2].slurker === mest.slurker) return null;
  return { minst, mest };
}
/** Trekk en hendelse som passer rommet (nok spillere, ikke samme som sist). */
function lagHendelse(data: any, s: any): HendelseKort | null {
  const navn: string[] = stokk(data.spillere.map((p: any) => p.navn).filter(Boolean));
  const mulige = stokk(HENDELSER.filter((e) => e.navn <= navn.length && e.id !== s.sisteHendelse));
  for (const e of mulige) { const kort = e.lag(navn.slice(0, e.navn), data); if (kort) { s.sisteHendelse = e.id; return kort; } }
  return null;
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
  s.tekst = s.kø.pop(); s.fase = 'svar'; s.stemmer = {}; s.sikker = {}; s.drikker = []; s.utdeling = []; s.lurte = 0; s.byttet = false; s.hemmelig = tilfeldig(2) ? 'sannhet' : 'lyv';
  s.runde = (s.runde || 0) + 1;
}
const LINJER: number[][] = (() => {
  const l: number[][] = [];
  for (let r = 0; r < 4; r++) { l.push([r * 4, r * 4 + 1, r * 4 + 2, r * 4 + 3]); l.push([r, r + 4, r + 8, r + 12]); }
  l.push([0, 5, 10, 15]); l.push([3, 6, 9, 12]);
  return l;
})();
/** Drikke-bingo på TV-en: alles brett som prikker – aldri låtene. */
function bingoOffentlig(s: any, data: any) {
  return { tittel: s.tittel, ferdig: !!s.ferdig, bingo: s.bingo || [], rekker: s.rekker || [], runde: s.runde || 1,
    sist: s.sist ? { id: s.sist.id, laat: s.sist.laat } : null,
    folk: data.spillere.map((p: any) => ({ id: p.id, m: (s.merket[p.id] || Array(16).fill(false)).map(Boolean) })) };
}
function nyttBrett(s: any) { return stokk(s.sanger.map((_: any, i: number) => i)).slice(0, 16); }

export function startSpill(data: any, lek: string, modus: string, sett?: Set<string> | null) {
  // Leker som er slått sammen med andre – gamle lenker og planer virker fortsatt
  if (lek === 'duoleken' || lek === '50-50') lek = 'pekeleken';   // duo-kort og «Hvem …»-kort bor i Pekeleken, «Jeg har aldri»-kortene i Jeg har aldri
  if (lek === 'sannhet-eller-drikk') { lek = 'nodt-eller-sannhet'; modus = modus === 'sd' ? 'droy' : modus === 'ss' ? 'snill' : modus; }
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
    const nsR = lek === 'nodt-eller-sannhet' ? nsRekke(data, modus, sett) : null;
    let rekke = nsR ? nsR.rekke : kortstokkFor(lek, modus, sett);
    if (lek !== 'ring-of-fire') rekke = trappOpp(lek, modus, rekke.slice(0, lek === 'rygg-mot-rygg' ? rrLengde(data.spillere.length) : lek === 'tanken-bak-sangen' ? LB_LENGDE : KORT_LENGDE));
    if (!plussRom && !(valgt as any).pluss && lek !== 'ring-of-fire' && lek !== 'rygg-mot-rygg' && lek !== 'nodt-eller-sannhet' && lek !== 'kategorier' && lek !== 'tanken-bak-sangen' && rekke.length > 12) rekke = medSmakebiter(rekke);
    if (!rekke.length) return { feil: 'tom' };
    data.spill = { type: 'kort', lek, navn, modus, rekke, pos: 0, tur: lek === 'ring-of-fire' ? 0 : null, konger: 0, tilHendelse: nesteHendelse() };
    if (nsR) data.spill.nsBunker = nsR.bunker;
    if (lek === 'ring-of-fire' && modus !== 'enkel') {
      // Ringen: alle 52 kortene ligger rundt glasset, og den som har tur drar ut et hvilket som helst kort
      Object.assign(data.spill, { ring: true, tatt: [], nr: 0, brudd: null, kort: null, sist: null, holder: null });
    } else {
      if (lek === 'ring-of-fire' && rekke[0].v === 'K') data.spill.konger = 1;
      data.spill.kort = visKort(data.spill, data);
      if (SVAR_LEKER.includes(lek)) { data.spill.svarPaa = true; nyAldriRunde(data.spill); }
      data.spill.trakk = data.vert;
      if (lek === 'enten-eller') nyEeRunde(data.spill);
      if (lek === 'rygg-mot-rygg') nyRrRunde(data.spill, data);
      if (lek === 'nodt-eller-sannhet') nyNsRunde(data.spill, data);
      if (lek === 'kategorier') nyKbRunde(data.spill, data);
      if (lek === 'tanken-bak-sangen') nyLbRunde(data.spill, data);
      if (lek === 'pekeleken') { data.spill.pekTekst = data.spill.kort && data.spill.kort.t; nyPekRunde(data.spill, data); }
    }
  }
  if (valgt.type === 'mest') {
    const alle = teksterL('pekeleken');
    data.spill = { type: 'mest', lek, navn, modus, alle, kø: [], antall: Math.max(2, data.spillere.length), tot: {} };
    nyMestRunde(data.spill);
  }
  if (valgt.type === 'forraeder') {
    if (data.spillere.length < 3) return feilL('for-faa', 'Løgnhalsen trenger minst tre spillere.', 'The liar needs at least three players.');
    const alle = teksterL('forraeder');
    data.spill = { type: 'forraeder', lek, navn, modus, alle, kø: [], aktiv: data.spillere[data.spillere.length - 1].id, antall: Math.max(2, data.spillere.length) };
    nyForraederRunde(data.spill, data);
  }
  if (valgt.type === 'bingo') {
    const era = B.eras.find((e: any) => e.id === modus) || B.eras[0];
    const s: any = { type: 'bingo', lek, navn, modus: era.id, era: era.id, tittel: L(era.title, eraTittel(era.id, 'en')), spotify: era.spotify || '',
      sanger: era.songs.map((x: any) => [x[0], x[1]]), brett: {}, merket: {}, rekker: [], bingo: [], ferdig: false, sist: null, runde: 1 };
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
  const nrFor = data.nr || 0;
  const svar = handlingInne(data, meg, h);
  sjekkLeder(data, nrFor);
  sjekkVann(data);   // etter handlingen: klokka starter med en gang leken er i gang
  const s = data.spill, n = turNokkel(s);
  if (s && n !== s.turNokkel) { s.turNokkel = n; s.turStart = n ? Date.now() : null; }
  return svar;
}
/** Rivalisering: når noen tar ledelsen på slurketavla, får hele rommet vite det. Bare når handlingen
    ikke allerede meldte noe selv, så vi ikke skyver bort en viktigere melding. */
function sjekkLeder(data: any, nrFor: number) {
  const ps = (data.spillere || []).filter((p: any) => (p.slurker || 0) > 0).sort((a: any, b: any) => (b.slurker || 0) - (a.slurker || 0));
  const leder = data.spillere.length >= 2 && ps.length && (ps.length === 1 || ps[0].slurker > ps[1].slurker) ? ps[0] : null;
  const forrige = data.leder || null;
  data.leder = leder ? leder.id : null;
  if (!leder || leder.slurker < 3 || leder.id === forrige || (data.nr || 0) !== nrFor) return;   // ikke mas om ledelsen før det er litt å lede med
  melde(data, `🔥 ${leder.navn} har tatt ledelsen med ${antSl(leder.slurker)}`, `🔥 ${leder.navn} has taken the lead with ${antSlEn(leder.slurker)}`);
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
  const ekstra = ['start', 'avslutt', 'fjern', 'nullstill', 'slurk', 'reager', 'send', 'velg-annen', 'avslutt-kvelden', 'fortsett-kvelden', 'pluss-aktiver', 'alkoholfri', 'gjeng', 'gjeng-meg', 'kv-vinner', 'lov-valg', 'slipp-inn', 'avvis-inn', 'del-ut', 'stua-flytt', 'stua-tema', 'stua-ekstra', 'stua-stil', 'stua-ut', 'min-pynt', 'sofa-ny', 'sofa-fjern', 'en-start', 'en-neste'].includes(h.handling) ? null : ekstraHandling(data, meg, h);
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
    case 'skjerm-lag':
    case 'skjerm-kobl': {
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
      if (data.gjeng && h._konto) { meg.konto = h._konto; if (h._pynt) meg.pynt = h._pynt; }
      if (data.gjeng) melde(data, `Kvelden telles i sesongen til ${data.gjeng.navn} 🏆`, `Tonight counts towards ${data.gjeng.navn}'s season 🏆`);
      return { ok: true };
    }
    case 'gjeng-meg': {
      // API-ruta har sjekket at kontoen er med i gjengen til rommet (h._konto settes bare der)
      if (!data.gjeng || !h._konto) return { ok: true };
      if (data.spillere.some((p: any) => p.konto === h._konto && p.id !== meg.id)) return feilL('konto', 'Kontoen din er allerede med i rommet på en annen telefon.', 'Your account is already in the room on another phone.');
      const ny = !meg.konto; meg.konto = h._konto; if (h._pynt) meg.pynt = h._pynt;
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
        if (s.type === 'tosannheter' && s.aktiv === hvem && s.fase !== 'ferdig') Object.assign(s, { aktiv: data.spillere.map((p: any) => p.id).find((id: string) => !(s.sittet || []).includes(id)) || forste, fase: 'skriv', pastander: [], stemmer: {}, logn: -1, frist: null });
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
    case 'slurk':
      // Poengtavla kan ikke endres for hånd – lekene fører slurkene selv
      return feilL('ugyldig', 'Poengtavla kan ikke endres.', 'The scoreboard can’t be edited.');
    case 'stua-tema': {
      // Verten velger hvordan stua ser ut. Pluss-temaene krever Pluss i rommet (julebordstua er gratis i desember).
      if (!erVert) return { feil: 'bare-vert' };
      const t = temaFor(String(h.tema || ''));
      if (!temaLov(t.id, data.pluss && data.pluss.til > Date.now())) return feilL('pluss', 'Det temaet krever Pluss i rommet.', 'That look needs Pluss in the room.');
      data.stua = data.stua || { pos: {} };
      if (data.stua.tema !== t.id) { data.stua.tema = t.id; melde(data, `Stua ble til ${t.navn[0]}`, `The room became ${t.navn[1]}`); }
      return { ok: true };
    }
    case 'stua-stil': {
      // Verten velger gulv og lys. Disko krever Pluss i rommet, lyslenka må være låst opp.
      if (!erVert) return { feil: 'bare-vert' };
      const stil = rensStil(h);
      const harPluss = !!(data.pluss && data.pluss.til > Date.now());
      if (!harPluss && (STIL_PLUSS.includes(stil.gulv) || STIL_PLUSS.includes(stil.lys))) return feilL('pluss', 'Det krever Pluss i rommet.', 'That needs Pluss in the room.');
      if (stil.lys === 'lys' && !ekstraLov('lys', meg, data.historikk)) return feilL('laast', 'Den er ikke låst opp ennå.', 'That one is not unlocked yet.');
      data.stua = data.stua || { pos: {} };
      data.stua.stil = stil;
      return { ok: true };
    }
    case 'stua-ut': {
      // Ut døra til takterrassen, eller inn igjen. Døra er åpen når rommet har Pluss.
      const st = data.stua = data.stua || { pos: {} };
      const ute: string[] = Array.isArray(st.ute) ? st.ute : [];
      const er = ute.includes(meg.id);
      if (!er && !(data.pluss && data.pluss.til > Date.now())) return feilL('pluss', 'Døra ut er låst uten Pluss.', 'The door out is locked without Pluss.');
      st.ute = er ? ute.filter((id) => id !== meg.id) : ute.concat([meg.id]);
      melde(data, er ? `${meg.navn} kom inn igjen` : `${meg.navn} gikk ut på takterrassen`, er ? `${meg.navn} came back in` : `${meg.navn} went out to the rooftop`);
      return { ok: true };
    }
    case 'stua-ekstra': {
      // Verten slår på og av de små tingene i rommet. Bare det kontoen (eller rommet) har låst opp.
      if (!erVert) return { feil: 'bare-vert' };
      const liste = (Array.isArray(h.liste) ? h.liste : []).map(String).filter((id: string, i: number, a: string[]) => a.indexOf(id) === i);
      const ulovlig = liste.find((id: string) => !ekstraLov(id, meg, data.historikk));
      if (ulovlig) return feilL('laast', 'Den er ikke låst opp ennå.', 'That one is not unlocked yet.');
      data.stua = data.stua || { pos: {} };
      data.stua.ekstra = liste;
      return { ok: true };
    }
    case 'min-pynt': {
      // Figuren min: det kontoen har på seg (API-ruta har hentet og renset det)
      if (h._pynt) meg.pynt = h._pynt;
      if (h._bruker) meg.bruker = h._bruker;
      if (h._kvelder != null) { meg.kvelder = h._kvelder; meg.laast = h._laast || []; }
      return { ok: true };
    }
    case 'sofa-ny': {
      // Bare vertens telefon: verten skriver navnene på dem som er her, og de setter seg i sofaen i stua
      if (!erVert) return feilL('bare-vert', 'Bare verten kan sette folk i sofaen.', 'Only the host can seat people on the sofa.');
      const navn = rens(h.navn, 16); if (!navn) return { ok: true };
      const sofa = data.sofa = data.sofa || [];
      if (sofa.length >= SOFA_SETER.length) return feilL('sofa-full', 'Sofaen er full.', 'The sofa is full.');
      const id = 's' + Math.random().toString(36).slice(2, 10);
      const st = data.stua = data.stua || { pos: {} }; st.pos = st.pos || {};
      const opptatt = sofa.map((p: any) => st.pos[p.id]).filter(Boolean);
      st.pos[id] = SOFA_SETER.find((p) => !opptatt.some((q: any) => Math.abs(q[0] - p[0]) < 0.2 && Math.abs(q[1] - p[1]) < 0.2)) || SOFA_SETER[sofa.length];
      sofa.push({ id, navn, slurker: 0 });
      return { ok: true, id };
    }
    case 'sofa-fjern': {
      if (!erVert) return feilL('bare-vert', 'Bare verten kan endre sofaen.', 'Only the host can change the sofa.');
      const hvem = String(h.hvem || '');
      data.sofa = (data.sofa || []).filter((p: any) => p.id !== hvem);
      if (data.stua && data.stua.pos) delete data.stua.pos[hvem];
      return { ok: true };
    }
    case 'en-start': {
      // Leker på én telefon: kortet går rundt, og verten trykker hvem som drakk
      if (!erVert) return { feil: 'bare-vert' };
      const lek = String(h.lek || '');
      if (!EN_LEKER.includes(lek)) return { feil: 'ukjent-lek' };
      const rekke = enRekke(lek);
      if (!rekke.length) return { feil: 'tom' };
      data.spill = { type: 'en', lek, navn: lekNavnL(lek), rekke, pos: 0, ferdig: false, runde: 1, konger: rekke[0] && rekke[0].v === 'K' ? 1 : 0 };
      melde(data, `Nytt spill: ${tr(data.spill.navn, 'no')}`, `New game: ${tr(data.spill.navn, 'en')}`);
      return { ok: true };
    }
    case 'en-neste': {
      if (!erVert) return { feil: 'bare-vert' };
      if (!s || s.type !== 'en' || s.ferdig) return { ok: true };
      // Bare det appen selv avgjør (bomba smalt hos noen) noteres – verten trykker ikke for andre
      const har = Array.isArray(h.har) ? h.har.map(String).slice(0, 20) : [], n = Math.max(1, Math.min(5, Number(h.n) || 1));
      har.forEach((id: string) => {
        if (data.spillere.some((p: any) => p.id === id)) giSlurker(data, id, n);
        const sp = (data.sofa || []).find((p: any) => p.id === id); if (sp) sp.slurker = (sp.slurker || 0) + n;
      });
      if (s.lek === 'kategorier' && har.length) stuaHendelse(data, 'bom', har);
      // Ring of Fire: fjerde konge avslutter leken
      if (s.lek === 'ring-of-fire' && (s.konger || 0) >= 4) { s.ferdig = true; return { ok: true }; }
      s.pos++;
      if (s.pos >= s.rekke.length) s.ferdig = true;
      else if (s.lek === 'ring-of-fire' && s.rekke[s.pos].v === 'K') s.konger = (s.konger || 0) + 1;
      return { ok: true };
    }
    case 'stua-flytt': {
      // Stua: noen ble flyttet. Plasseringen gjelder for alle skjermer.
      // Påskeegg: flytter du de andre rundt for ofte (STUA_PLAG ganger på ett minutt), må du ta en slurk.
      const naa = Date.now();
      const hvem = data.spillere.find((x: any) => x.id === String(h.hvem)) || (data.sofa || []).find((x: any) => x.id === String(h.hvem)); if (!hvem) return { ok: true };
      const x = Number(h.x), y = Number(h.y);
      if (!Number.isFinite(x) || !Number.isFinite(y)) return { ok: true };
      if (meg.sistS && naa - meg.sistS < 300) return { ok: true };
      meg.sistS = naa;
      const st = data.stua = data.stua || { pos: {} };
      st.pos[hvem.id] = [Math.round(Math.max(0.4, Math.min(5.6, x)) * 100) / 100, Math.round(Math.max(0.4, Math.min(5.7, y)) * 100) / 100];
      if (hvem.id !== meg.id) {
        const plag = st.plag = st.plag || {};
        const liste = (plag[meg.id] || []).filter((t: number) => naa - t < 60000).concat([naa]);
        plag[meg.id] = liste;
        if (liste.length >= STUA_PLAG) {
          plag[meg.id] = [];
          giSlurker(data, meg.id, 1);
          st.straff = { nr: ((st.straff && st.straff.nr) || 0) + 1, hvem: meg.id };
          if (data.alkoholfri) melde(data, `${meg.navn} plaget de andre for mye i stua. Ett straffepoeng!`, `${meg.navn} pestered the others too much. One penalty point!`);
          else melde(data, `${meg.navn} plaget de andre for mye i stua. Én slurk!`, `${meg.navn} pestered the others too much. One sip!`);
        }
      }
      return { ok: true };
    }
    case 'reager':
    case 'beveg':
    case 'send': {
      const naa = Date.now();
      if (meg.sistR && naa - meg.sistR < 2000) return feilL('for-fort', 'Rolig nå 😄', 'Easy there 😄');
      const reak: any = { fra: meg.id };
      if (h.handling === 'reager') {
        if (!REAKSJONER.includes(h.e)) return { feil: 'ukjent' };
        reak.e = h.e;
      } else if (h.handling === 'beveg') {
        // «Din» bevegelse: den du har valgt på kontoen (vink er gratis for alle)
        const b = String(h.b || ''); const min = (meg.pynt && meg.pynt.beveg) || BEVEG_GRATIS;
        if (b !== min && b !== BEVEG_GRATIS) return { feil: 'ukjent' };
        reak.e = '✨'; reak.b = b;
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
    case 'rof-regel': {
      // Verten bytter regelen på ett kort i Ring of Fire. Gjelder rommet resten av kvelden. Kongen kan ikke byttes.
      if (!erVert) return { feil: 'bare-vert' };
      const v = String(h.v || '');
      if (!D['ring-of-fire'].kort[v] || v === 'K') return { feil: 'ugyldig' };
      data.rofRegler = data.rofRegler || {};
      if (h.std) { delete data.rofRegler[v]; if (!Object.keys(data.rofRegler).length) delete data.rofRegler; return { ok: true }; }
      const navn = rens(h.navn, 30), tekst = rens(h.tekst, 160);
      if (!navn || !tekst) return feilL('ugyldig', 'Skriv både navn og regel.', 'Write both a name and a rule.');
      data.rofRegler[v] = [navn, tekst];
      return { ok: true };
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
    case 'rof-holder': {
      // Den som trekker forteller hvor langt kortet er kommet (t 0–1) og hvor stram ringen er (sp 0–1), så de andre kan se på
      if (!s || s.type !== 'kort' || !s.ring) return { feil: 'feil-spill' };
      const tur = data.spillere[s.tur % Math.max(1, data.spillere.length)];
      if (tur && tur.id !== meg.id && !erVert) return { ok: true };
      if (Number(h.nr) !== s.nr) return { ok: true };
      const t = Math.max(0, Math.min(1, Number(h.t) || 0)), sp = Math.max(0, Math.min(1, Number(h.sp) || 0));
      s.holder = t > 0 || sp > 0 ? { hvem: tur ? tur.id : meg.id, t, sp, tid: Date.now() } : null;
      return { ok: true };
    }
    case 'rof-trekk': {
      if (!s || s.type !== 'kort' || !s.ring) return { feil: 'feil-spill' };
      if (s.ferdig) return { ok: true };
      s.holder = null;
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
      // Tomt for kort: leken er ferdig – verten velger ny ring eller noe annet
      if (s.tatt.length >= s.rekke.length) {
        s.ferdig = true; s.velgMakker = null;
        melde(data, '🔥 Ringen er tom!', '🔥 The ring is empty!');
      }
      return { ok: true };
    }
    case 'neste': {
      if (!s || s.type !== 'kort') return { feil: 'feil-spill' };
      if (s.ring) return { ok: true };
      if (typeof h.pos === 'number' && h.pos !== s.pos) return { ok: true }; // noen andre trykket samtidig
      const videre = kortVidere(s, data);
      if (videre && !videre.includes(meg.id)) return feilL('ikke-din-tur', 'Verten eller den som har tur går videre.', 'The host or whoever’s turn it is moves on.');
      if (s.aldri && s.aldri.fase === 'svar' && !erVert) return { ok: true }; // alle svarer: bare verten kan hoppe over kortet
      if (s.ee && s.ee.fase !== 'avslort' && !erVert) return { ok: true };   // Enten eller: bare verten kan hoppe over valget
      if (s.rr && s.rr.fase === 'svar' && !erVert) return { ok: true };       // Rygg mot rygg: det samme
      if (s.ns && s.ns.fase !== 'avslort' && !erVert) return { ok: true };    // Nødt eller sannhet: det samme
      if (s.kb && s.kb.fase === 'gaar' && !erVert) return { ok: true };       // Kategorier: bomba går – bare verten kan hoppe over
      if (s.lb && s.lb.fase !== 'ferdig' && !erVert) return { ok: true };     // Låtbekjennelsen: det samme
      if (s.ferdig) return { ok: true };
      s.pos++;
      if (s.pos >= s.rekke.length) {
        // Kortlekene slutter når bunken er tom – så velger verten hva dere gjør nå
        s.pos = s.rekke.length - 1; s.ferdig = true; s.aldri = null; s.ee = null; s.rr = null; s.ns = null; s.kb = null; s.lb = null; s.frist = null; s.velgMakker = null;
        if (s.pek && s.pek.resultat) s.pekForrige = { tekst: s.pekTekst || '', resultat: s.pek.resultat };
        s.pek = null;
        melde(data, 'Kortene er brukt opp!', 'The cards are used up!'); return { ok: true };
      }
      s.trakk = meg.id;
      // Hendelseskort: legges inn foran kortet som skulle kommet, så ingen kort går tapt
      if (s.lek !== 'ring-of-fire' && data.spillere.length >= 2) {
        s.tilHendelse = (s.tilHendelse ?? nesteHendelse()) - 1;
        if (s.tilHendelse <= 0) { const hkort = lagHendelse(data, s); if (hkort) s.rekke.splice(s.pos, 0, hkort); s.tilHendelse = nesteHendelse(); }
      }
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
      if (s.lek === 'pekeleken') { if (s.pek && s.pek.resultat) s.pekForrige = { tekst: s.pekTekst || '', resultat: s.pek.resultat }; s.pekTekst = s.kort && s.kort.t; nyPekRunde(s, data); }
      nyAldriRunde(s);
      nyEeRunde(s);
      nyRrRunde(s, data);
      nyNsRunde(s, data);
      nyKbRunde(s, data);
      nyLbRunde(s, data);
      return { ok: true };
    }
    case 'lb-lat': {   // «Legg i bunken»: din låt til kategorien
      const b = s && s.type === 'kort' && s.lb;
      if (!b || b.fase !== 'skriv') return { ok: true };
      const tekst = String(h.v || '').replace(/\s+/g, ' ').trim().slice(0, 80);
      if (!tekst) return { feil: 'tom' };
      b.later[meg.id] = tekst;
      if (lbAlleFerdige(s, data)) lbKort(s);
      return { ok: true };
    }
    case 'lb-gjett': {   // hvem valgte låta?
      const b = s && s.type === 'kort' && s.lb;
      if (!b || b.fase !== 'gjett' || meg.id === b.rekkefolge[b.nr] || h.v === meg.id) return { ok: true };
      if (!data.spillere.some((p: any) => p.id === h.v)) return { feil: 'ukjent' };
      b.gjett[meg.id] = h.v;
      if (lbAlleFerdige(s, data)) lbKort(s);
      return { ok: true };
    }
    case 'lb-neste': {   // neste låt – eller avstemningen etter siste låt
      const b = s && s.type === 'kort' && s.lb;
      if (!b || b.fase !== 'avslort') return { ok: true };
      if (typeof h.nr === 'number' && h.nr !== b.nr) return { ok: true };   // noen andre trykket samtidig
      if (b.nr + 1 < b.rekkefolge.length) { b.nr++; lbStartGjett(s); }
      else { b.fase = 'stem'; b.stemmer = {}; settFrist(s, LB_STEM); }
      return { ok: true };
    }
    case 'lb-stem': {   // beste historie
      const b = s && s.type === 'kort' && s.lb;
      if (!b || b.fase !== 'stem' || h.v === meg.id || !data.spillere.some((p: any) => p.id === h.v)) return { ok: true };
      b.stemmer[meg.id] = h.v;
      if (lbAlleFerdige(s, data)) lbKort(s);
      return { ok: true };
    }
    case 'kb-send': {   // «Sagt!»: bomba går til neste (verten kan sende for en som ikke er ved telefonen)
      const b = s && s.type === 'kort' && s.kb;
      if (!b || b.fase !== 'gaar' || (meg.id !== b.holder && !erVert)) return { ok: true };
      if (h.fra && h.fra !== b.holder) return { ok: true };   // noen andre sendte den allerede
      kbSmell(data); if (b.fase !== 'gaar') return { ok: true };
      if (Date.now() - b.sist < KB_PAUSE) return { ok: true };
      b.holder = kbNeste(data, b.holder); b.svar++; b.sist = Date.now(); b.protest = [];
      return { ok: true };
    }
    case 'kb-protest': {   // «Sagt før!»: alle ser det, og den med bomba må finne på noe annet
      const b = s && s.type === 'kort' && s.kb;
      if (!b || b.fase !== 'gaar' || meg.id === b.holder || b.protest.includes(meg.id)) return { ok: true };
      b.protest.push(meg.id);
      return { ok: true };
    }
    case 'kb-smell': {   // en telefon sier at tiden er ute – serveren sjekker selv
      kbSmell(data);
      return { ok: true };
    }
    case 'ns-velg': {   // den i stolen velger nødt eller sannhet (verten kan velge for en som ikke er der)
      const r = s && s.type === 'kort' && s.ns;
      if (!r || r.fase !== 'velg' || (meg.id !== r.hvem && !erVert)) return { ok: true };
      if (h.v !== 'nodt' && h.v !== 'sannhet') return { feil: 'ukjent' };
      nsVelg(s, data, h.v);
      return { ok: true };
    }
    case 'ns-ferdig': {   // ferdig – nå dømmer de andre
      const r = s && s.type === 'kort' && s.ns;
      if (!r || r.fase !== 'gjor' || (meg.id !== r.hvem && !erVert)) return { ok: true };
      r.fase = 'dom'; r.stemmer = {}; settFrist(s, NS_DOM);
      return { ok: true };
    }
    case 'ns-feig': {
      const r = s && s.type === 'kort' && s.ns;
      if (!r || (r.fase !== 'gjor' && r.fase !== 'dom') || (meg.id !== r.hvem && !erVert)) return { ok: true };
      nsFeig(data);
      melde(data, '🐔 ' + navnPaa(data, r.hvem) + ' feiget ut og drikker ' + NS_FEIG + '!', '🐔 ' + navnPaa(data, r.hvem) + ' chickened out and drinks ' + NS_FEIG + '!');
      return { ok: true };
    }
    case 'ns-stem': {   // dommerne: «ja» (godkjent) eller «nei» (juks)
      const r = s && s.type === 'kort' && s.ns;
      if (!r || r.fase !== 'dom' || meg.id === r.hvem) return { ok: true };
      if (h.v !== 'ja' && h.v !== 'nei') return { feil: 'ukjent' };
      r.stemmer[meg.id] = h.v;
      if (nsDommere(s, data).every((p: any) => r.stemmer[p.id])) { const kort = Date.now() + NS_LAAS * 1000 + 1500; if (!s.frist || s.frist > kort) s.frist = kort; }
      return { ok: true };
    }
    case 'rr-pek': {   // en i paret peker: på seg selv eller på den andre
      const r = s && s.type === 'kort' && s.rr;
      if (!r || r.fase !== 'svar' || (meg.id !== r.a && meg.id !== r.b)) return { ok: true };
      if (h.v !== r.a && h.v !== r.b) return { feil: 'ukjent' };
      r.pek[meg.id] = h.v;
      if (rrKlare(s, data)) { const kort = Date.now() + RR_LAAS * 1000 + 1500; if (!s.frist || s.frist > kort) s.frist = kort; }
      return { ok: true };
    }
    case 'rr-gjett': {   // alle andre gjetter: den ene, den andre eller «uenige»
      const r = s && s.type === 'kort' && s.rr;
      if (!r || r.fase !== 'svar' || meg.id === r.a || meg.id === r.b) return { ok: true };
      if (h.v !== r.a && h.v !== r.b && h.v !== 'uenig') return { feil: 'ukjent' };
      r.gjett[meg.id] = h.v;
      if (rrKlare(s, data)) { const kort = Date.now() + RR_LAAS * 1000 + 1500; if (!s.frist || s.frist > kort) s.frist = kort; }
      return { ok: true };
    }
    case 'ee-velg': {
      const e = s && s.type === 'kort' && s.ee;
      if (!e || e.fase !== 'svar') return { ok: true };
      if (h.v !== 'a' && h.v !== 'b') return { feil: 'ukjent' };
      e.svar[meg.id] = h.v;
      // Alle har valgt: klokka kortes ned til tre sekunder, men ingen ser noe før den er ute
      if (data.spillere.every((p: any) => e.svar[p.id])) { const kort = Date.now() + EE_LAAS * 1000 + 1500; if (!s.frist || s.frist > kort) s.frist = kort; }
      return { ok: true };
    }
    case 'ee-forsvar': {   // den som er alene: fikk hen med seg én, eller drikker hen to?
      const e = s && s.type === 'kort' && s.ee;
      if (!e || e.fase !== 'forsvar' || !e.resultat) return { ok: true };
      const r = e.resultat;
      if (meg.id !== r.alene && !erVert) return { feil: 'ikke-din-tur' };
      const med = typeof h.med === 'string' && h.med !== r.alene && data.spillere.some((p: any) => p.id === h.med) ? h.med : null;
      if (med) { r.med = med; giSlurker(data, med, 1); melde(data, `${navnPaa(data, med)} lot seg overtale av ${navnPaa(data, r.alene)} – én slurk`, `${navnPaa(data, med)} was won over by ${navnPaa(data, r.alene)} – one sip`); }
      else { r.drakk = true; giSlurker(data, r.alene, 2); }
      e.fase = 'avslort'; return { ok: true };
    }
    case 'pek-start': {
      if (!s || s.type !== 'kort' || !s.pek || s.pek.fase !== 'klar') return { ok: true };
      s.pek.fase = 'teller'; s.pek.start = Date.now() + 500;
      return { ok: true };
    }
    case 'pek-fingre': {
      const pk = s && s.type === 'kort' && s.pek;
      if (!pk || pk.fase !== 'teller' || Date.now() < pk.start + PEK_TELL - 300) return { ok: true };
      const n = Math.max(0, Math.min(20, Math.round(Number(h.n) || 0)));
      pk.fingre[meg.id] = n;
      if (data.spillere.every((p: any) => pk.fingre[p.id] != null)) avgjorPek(data);
      return { ok: true };
    }
    case 'pek-selv': {
      const pk = s && s.type === 'kort' && s.pek;
      if (!pk || pk.vri !== 'selv' || pk.fase !== 'teller' || pk.selv.includes(meg.id)) return { ok: true };
      pk.selv.push(meg.id); giUtdeling(data, meg.id, 1);
      return { ok: true };
    }
    case 'pek-tell-ferdig': {   // leseren eller verten går videre selv om noen ikke har trykket
      const pk = s && s.type === 'kort' && s.pek;
      if (!pk || pk.fase !== 'teller') return { ok: true };
      if (meg.id !== pk.leser && !erVert) return { feil: 'ikke-din-tur' };
      avgjorPek(data); return { ok: true };
    }
    case 'pek-forsvar': {   // forsvarstalen: slapp unna eller drikk
      const pk = s && s.type === 'kort' && s.pek;
      if (!pk || pk.fase !== 'forsvar') return { ok: true };
      if (meg.id !== pk.leser && !erVert) return { feil: 'ikke-din-tur' };
      const r = pk.resultat;
      if (h.slapp === true) r.slapp = true; else r.topp.forEach((id: string) => giSlurker(data, id, r.slurker));
      pk.fase = 'ferdig'; return { ok: true };
    }
    case 'aldri-svar': {
      if (!s || s.type !== 'kort' || !s.aldri || s.aldri.fase !== 'svar') return { ok: true };
      if (h.v !== 'har' && h.v !== 'aldri') return { feil: 'ukjent' };
      s.aldri.svar[meg.id] = h.v;
      if (data.spillere.every((p: any) => s.aldri.svar[p.id])) avgjorAldri(data);
      return { ok: true };
    }
    case 'aldri-nekt': {   // den ensomme ulven nekter å fortelle: to slurker til
      const a = s && s.type === 'kort' && s.aldri;
      if (!a || a.fase !== 'avslort' || !a.ulv || a.nektet) return { ok: true };
      if (meg.id !== a.ulv && !erVert) return { feil: 'ikke-din-tur' };
      a.nektet = true; giSlurker(data, a.ulv, 2);
      melde(data, `${navnPaa(data, a.ulv)} nekter å fortelle – fire slurker`, `${navnPaa(data, a.ulv)} won't tell – four sips`);
      return { ok: true };
    }
    case 'kort-igjen':
    case 'aldri-igjen': {   // nye kort: de dere ikke har hatt først, også de dere nettopp spilte
      if (!s || s.type !== 'kort' || !s.ferdig) return { ok: true };
      if (!erVert) return feilL('bare-vert', 'Verten bestemmer hva som skjer nå.', 'The host decides what happens next.');
      if (s.lek === 'ring-of-fire') {   // ny ring (eller ny kortstokk uten ring): alle 52 kortene ut igjen
        const rekke = kortstokkFor(s.lek, s.modus);
        Object.assign(s, { rekke, pos: 0, ferdig: false, konger: 0, velgMakker: null });
        if (s.ring) Object.assign(s, { tatt: [], brudd: null, ringBrutt: false, bruddPlass: null, kort: null, sist: null, holder: null });
        else { if (rekke[0].v === 'K') s.konger = 1; s.kort = visKort(s, data); }
        melde(data, s.ring ? '🔥 Ny ring!' : 'Ny kortstokk!', s.ring ? '🔥 A new ring!' : 'A new deck!');
        return { ok: true };
      }
      const sett = new Set<string>((Array.isArray(h.sett) ? h.sett : []).slice(0, 2000).filter((x: any) => typeof x === 'string' && /^[0-9a-z]{1,8}$/.test(x)));
      s.rekke.forEach((k: any) => { if (!k.h && !k.smak) sett.add(kortId(k)); });
      const nsR = s.lek === 'nodt-eller-sannhet' ? nsRekke(data, s.modus, sett) : null;
      if (nsR) s.nsBunker = nsR.bunker;
      let rekke = nsR ? nsR.rekke : trappOpp(s.lek, s.modus, kortstokkFor(s.lek, s.modus, sett).slice(0, s.lek === 'rygg-mot-rygg' ? rrLengde(data.spillere.length) : s.lek === 'tanken-bak-sangen' ? LB_LENGDE : KORT_LENGDE));
      if (!romHarPluss(data) && s.lek !== 'rygg-mot-rygg' && s.lek !== 'nodt-eller-sannhet' && s.lek !== 'kategorier' && s.lek !== 'tanken-bak-sangen') rekke = medSmakebiter(rekke);
      Object.assign(s, { rekke, pos: 0, ferdig: false, konger: 0, aldriTeller: {}, tilHendelse: nesteHendelse(), trakk: meg.id });
      s.kort = visKort(s, data); nyAldriRunde(s); nyEeRunde(s); nyRrRunde(s, data); nyNsRunde(s, data); nyKbRunde(s, data); nyLbRunde(s, data);
      if (s.lek === 'pekeleken') { s.pekTekst = s.kort && s.kort.t; nyPekRunde(s, data); }
      melde(data, 'Nye kort!', 'New cards!');
      return { ok: true };
    }
    case 'aldri-modus': {
      if (!s || s.type !== 'kort' || !SVAR_LEKER.includes(s.lek) || s.ferdig) return { ok: true };
      if (!erVert) return { feil: 'bare-vert' };
      s.svarPaa = !!h.paa;
      if (s.svarPaa) { if (!s.aldri) nyAldriRunde(s); } else { s.aldri = null; s.frist = null; }
      return { ok: true };
    }
    case 'del-ut': {
      // Del ut flere slurker på én gang: [{ id, n }]. Telefonen regner ut fordelingen, serveren sjekker den.
      const liste = Array.isArray(h.liste) ? h.liste.slice(0, 30) : [];
      const rens: { til: any; n: number }[] = [];
      for (const x of liste) {
        const n = Math.floor(Number(x && x.n));
        const til = data.spillere.find((p: any) => p.id === (x && x.id));
        if (!til || til.id === meg.id || !(n > 0) || n > 99 || rens.some((r) => r.til === til)) return { feil: 'ukjent' };
        rens.push({ til, n });
      }
      const sum = rens.reduce((a, r) => a + r.n, 0);
      if (!sum) return { feil: 'ukjent' };
      if (sum > (meg.gi || 0)) return feilL('tomt', `Du har bare ${meg.gi || 0} å dele ut.`, `You only have ${meg.gi || 0} to hand out.`);
      meg.gi -= sum; meg.sendt = (meg.sendt || 0) + sum;
      rens.forEach(({ til, n }) => { giSlurker(data, til.id, n); til.mottatt = (til.mottatt || 0) + n; });
      data.utNr = (data.utNr || 0) + 1;
      data.utdeling = { nr: data.utNr, fra: meg.id, sum, liste: rens.map((r) => ({ id: r.til.id, n: r.n })) };
      // De siste utdelingene som liste: deler to ut nesten samtidig, får TV-en og telefonene med seg begge
      data.utdelinger = ((data.utdelinger as any[]) || []).concat([data.utdeling]).slice(-8);
      return { ok: true };
    }
    case 'stem': {
      if (!s) return { feil: 'feil-spill' };
      if (s.type === 'mest') {
        if (s.fase !== 'stem') return { ok: true };
        if (!data.spillere.some((p: any) => p.id === h.paa)) return { feil: 'ukjent' };
        s.stemmer[meg.id] = h.paa;
        if (Object.keys(s.stemmer).length >= data.spillere.length) { const kort = Date.now() + 2000 + 1500; if (!s.frist || s.frist > kort) s.frist = kort; }
        return { ok: true };
      }
      if (s.type === 'forraeder') {
        if (s.fase !== 'stem' || meg.id === s.aktiv) return { ok: true };
        if (h.paa !== 'sannhet' && h.paa !== 'lyv') return { feil: 'ukjent' };
        s.stemmer[meg.id] = h.paa;
        s.sikker = s.sikker || {}; if (h.sikker === true) s.sikker[meg.id] = true; else if (h.sikker === false) delete s.sikker[meg.id];
        // Alle har stemt: avsløringen kommer etter et lite pust (så man rekker å holde for «helt sikker»)
        if (Object.keys(s.stemmer).length >= data.spillere.length - 1) { const kort = Date.now() + 2000 + 1500; if (!s.frist || s.frist > kort) s.frist = kort; }
        return { ok: true };
      }
      return { feil: 'feil-spill' };
    }
    case 'lh-bytt': {  // Løgnhalsen: den som har tur kan bytte kort én gang (f.eks. et kort de aldri har opplevd)
      if (!s || s.type !== 'forraeder' || s.fase !== 'svar' || s.byttet) return { ok: true };
      if (meg.id !== s.aktiv && !erVert) return { feil: 'ikke-din-tur' };
      if (!s.kø.length) s.kø = stokk(s.alle.slice());
      s.tekst = s.kø.pop(); s.byttet = true;
      return { ok: true };
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
      if (s.type === 'kort' && s.aldri && s.aldri.fase === 'svar') {
        const mangler = data.spillere.filter((p: any) => !s.aldri.svar[p.id]).length;
        if (mangler > 0 && !fristUte(s) && !erVert) return venter(s, mangler);
        avgjorAldri(data);
      }
      if (s.type === 'kort' && s.lb && ['skriv', 'gjett', 'stem'].includes(s.lb.fase)) {   // Låtbekjennelsen: bare verten kan gå videre før klokka er ute
        if (!erVert) return { feil: 'bare-vert' };
        lbVidere(s, data);
      }
      if (s.type === 'kort' && s.ns && s.ns.fase === 'dom') {   // Nødt eller sannhet: bare verten kan avslutte dommen før klokka er ute
        if (!erVert) return { feil: 'bare-vert' };
        avgjorNs(data);
      }
      if (s.type === 'kort' && s.rr && s.rr.fase === 'svar') {   // Rygg mot rygg: bare verten kan snu før klokka er ute
        if (!erVert) return { feil: 'bare-vert' };
        avgjorRr(data);
      }
      if (s.type === 'kort' && s.ee && s.ee.fase === 'svar') {   // Enten eller: bare verten kan vise før klokka er ute
        if (!erVert) return { feil: 'bare-vert' };
        avgjorEe(data);
      }
      return { ok: true };
    }
    case 'tid-ute': {
      // En telefon sier at klokka har gått ut. Serveren sjekker selv før den gjør noe.
      if (!s || !fristUte(s)) return { ok: true };
      if (s.type === 'kort' && s.aldri && s.aldri.fase === 'svar') avgjorAldri(data);
      if (s.type === 'kort' && s.ee && s.ee.fase === 'svar') avgjorEe(data);
      if (s.type === 'kort' && s.rr && s.rr.fase === 'svar') avgjorRr(data);
      if (s.type === 'kort' && s.ns && s.ns.fase === 'dom') avgjorNs(data);
      if (s.type === 'kort' && s.lb && ['skriv', 'gjett', 'stem'].includes(s.lb.fase)) lbVidere(s, data);
      if (s.type === 'kort' && s.ns && s.ns.fase === 'velg') nsVelg(s, data, tilfeldig(2) ? 'nodt' : 'sannhet', true);   // ingen valgte: appen velger
      if (s.type === 'mest' && s.fase === 'stem') avgjorMest(data);
      if (s.type === 'forraeder' && s.fase === 'stem') avgjorForraeder(data);
      return { ok: true };
    }
    case 'runde': {
      if (!s) return { ok: true };
      // Én runde per spiller, så er leken ferdig – verten velger spill igjen eller neste lek
      if ((s.type === 'mest' || s.type === 'forraeder') && s.fase === 'ferdig') {
        if (!erVert) return feilL('bare-vert', 'Verten bestemmer hva som skjer nå.', 'The host decides what happens next.');
        s.runde = 0; s.antall = Math.max(2, data.spillere.length);
        if (s.type === 'mest') { s.tot = {}; nyMestRunde(s); } else nyForraederRunde(s, data);
        return { ok: true };
      }
      if (s.type === 'mest' && s.fase === 'resultat') { if ((s.runde || 0) >= (s.antall || data.spillere.length)) { s.fase = 'ferdig'; s.frist = null; } else nyMestRunde(s); }
      if (s.type === 'forraeder' && s.fase === 'avslort') { if ((s.runde || 0) >= (s.antall || data.spillere.length)) { s.fase = 'ferdig'; s.frist = null; } else nyForraederRunde(s, data); }
      if (s.type === 'en' && s.ferdig) {
        if (!erVert) return feilL('bare-vert', 'Verten bestemmer hva som skjer nå.', 'The host decides what happens next.');
        const rekke = enRekke(s.lek);
        Object.assign(s, { rekke, pos: 0, ferdig: false, runde: (s.runde || 1) + 1, konger: rekke[0] && rekke[0].v === 'K' ? 1 : 0 });
      }
      if (s.type === 'bingo' && s.ferdig) {
        // Spill igjen: nye brett til alle (teller i kvelden)
        if (!erVert) return feilL('bare-vert', 'Verten bestemmer hva som skjer nå.', 'The host decides what happens next.');
        data.spillere.forEach((p: any) => { s.brett[p.id] = nyttBrett(s); s.merket[p.id] = Array(16).fill(false); });
        Object.assign(s, { rekker: [], bingo: [], ferdig: false, sist: null, runde: (s.runde || 1) + 1 });
      }
      return { ok: true };
    }
    case 'merk': {
      if (!s || s.type !== 'bingo') return { feil: 'feil-spill' };
      if (!s.brett[meg.id]) { s.brett[meg.id] = nyttBrett(s); s.merket[meg.id] = Array(16).fill(false); }
      const i = Number(h.i); if (!(i >= 0 && i < 16)) return { feil: 'ukjent' };
      if (s.ferdig) return { ok: true };
      const m = s.merket[meg.id];
      const foer = LINJER.filter((l) => l.every((k) => m[k])).length;
      m[i] = !m[i];
      if (m[i]) s.sist = { id: meg.id, laat: (s.sanger[s.brett[meg.id][i]] || [])[1] || '' };
      const etter = LINJER.filter((l) => l.every((k) => m[k])).length;
      if (m.every(Boolean) && !s.bingo.includes(meg.id)) { s.bingo.push(meg.id); s.ferdig = true; melde(data, `BINGO for ${meg.navn}! Alle andre drikker opp.`, `BINGO for ${meg.navn}! Everyone else finishes their drink.`); }
      else if (etter > foer) { s.rekker.push(meg.id); giUtdeling(data, meg.id, 2); melde(data, `${meg.navn} fikk rekke! Del ut to slurker.`, `${meg.navn} got a line! Give out two sips.`); }
      return { ok: true };
    }
    case 'nytt-brett': {
      if (!s || s.type !== 'bingo') return { feil: 'feil-spill' };
      // Bytt brett går bare før første klatt – ellers kunne man jukse seg til bingo
      if (s.ferdig || (s.merket[meg.id] || []).some(Boolean)) return feilL('merket', 'Du har begynt på brettet ditt.', 'You have already started your board.');
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
  s.tot = s.tot || {}; liste.forEach((x) => { s.tot[x.id] = (s.tot[x.id] || 0) + x.stemmer; });
  s.resultat = liste; s.fase = 'resultat';
  if (liste[0]) melde(data, `${liste[0].navn} fikk flest stemmer (${liste[0].stemmer})`, `${liste[0].navn} got the most votes (${liste[0].stemmer})`);
}
function avgjorForraeder(data: any) {
  const s = data.spill;
  const feil = Object.entries(s.stemmer).filter(([, v]) => v !== s.hemmelig).map(([id]) => id);
  const antallStemmer = Object.keys(s.stemmer).length, sikker = s.sikker || {};
  s.drikker = []; s.utdeling = []; s.lurte = feil.length;
  if (antallStemmer && feil.length === 0) { giSlurker(data, s.aktiv, 3); s.drikker.push({ id: s.aktiv, navn: navnPaa(data, s.aktiv), slurker: 3 }); }
  if (feil.length) {
    giUtdeling(data, s.aktiv, feil.length); s.utdeling.push({ id: s.aktiv, n: feil.length });
    const a = data.spillere.find((p: any) => p.id === s.aktiv); if (a) a.lurt = (a.lurt || 0) + feil.length;
  }
  feil.forEach((id) => { const n = sikker[id] ? 4 : 2; giSlurker(data, id, n); s.drikker.push({ id, navn: navnPaa(data, id), slurker: n, sikker: !!sikker[id] }); });
  Object.keys(s.stemmer).forEach((id) => { if (sikker[id] && !feil.includes(id)) { giUtdeling(data, id, 1); s.utdeling.push({ id, n: 1, sikker: true }); } });
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

/* ---------- Skriv og drikk: kort til noen, og Skammekroken ----------
   Et kort kan være til alle, til den som trekker, til én bestemt person eller til to tilfeldige.
   Kort som prøver å gi mer enn 10 slurker (tall eller ord: «500», «fem hundre», «tjuefem») kommer
   aldri med i bunken. De dukker opp i Skammekroken når bunken er tom, med hvem som skrev og en kommentar. */
const RF_MAKS = 10;
const RF_TALL: Record<string, number> = { null: 0, en: 1, ett: 1, 'én': 1, ei: 1, to: 2, tre: 3, fire: 4, fem: 5, seks: 6, sju: 7, syv: 7, 'åtte': 8, ni: 9, ti: 10, elleve: 11, tolv: 12, tretten: 13, fjorten: 14, femten: 15, seksten: 16, sytten: 17, atten: 18, nitten: 19,
  tjue: 20, tyve: 20, tretti: 30, 'førti': 40, femti: 50, seksti: 60, sytti: 70, 'åtti': 80, nitti: 90,
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
  twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90 };
const RF_GANGER: Record<string, number> = { hundre: 100, hundred: 100, tusen: 1000, thousand: 1000, million: 1e6, millioner: 1e6 };
/** Ett ord som tall, også sammensatte: «tjuefem», «femhundre», «twentyfive». NaN hvis det ikke er et tall. */
function rfOrdTall(ord: string): number {
  if (/^\d+$/.test(ord)) return Number(ord);
  let rest = ord, sum = 0, del = 0, fant = false;
  const deler = Object.keys(RF_TALL).concat(Object.keys(RF_GANGER), ['og', 'and']).sort((a, b) => b.length - a.length);
  while (rest) {
    const d = deler.find((x) => rest.startsWith(x)); if (!d) return NaN;
    rest = rest.slice(d.length);
    if (d === 'og' || d === 'and') continue;
    fant = true;
    if (RF_GANGER[d]) { const g = RF_GANGER[d]; if (g >= 1000) { sum += (del || 1) * g; del = 0; } else del = (del || 1) * g; }
    else del += RF_TALL[d];
  }
  return fant ? sum + del : NaN;
}
/** Hvor mange slurker kortet prøver å dele ut, eller 0. Tallet må stå rett før et drikkeord (slurker, shots …)
    eller rett etter et verb (drikk, gi, del ut …), så «alle som har vært i 20 land, drikk to» går fint. */
export function rfSlurker(tekst: string): number {
  const t = String(tekst || '').toLowerCase().replace(/(\d)[\s.](?=\d{3}\b)/g, '$1').replace(/[^0-9a-zæøå]+/g, ' ').trim().split(' ').filter(Boolean);
  const grupper: { v: number; fra: number; til: number }[] = [];
  for (let i = 0; i < t.length; i++) {
    let v = rfOrdTall(t[i]); if (!isFinite(v)) continue;
    let j = i, sum = 0, del = v;
    // Sett sammen «fem hundre», «to tusen og fem», «twenty five»
    while (j + 1 < t.length) {
      const n = t[j + 1]; if (n === 'og' || n === 'and') { if (j + 2 < t.length && isFinite(rfOrdTall(t[j + 2]))) { j++; continue; } break; }
      const nv = rfOrdTall(n); if (!isFinite(nv)) break;
      if (RF_GANGER[n]) { if (RF_GANGER[n] >= 1000) { sum += (del || 1) * RF_GANGER[n]; del = 0; } else del = (del || 1) * RF_GANGER[n]; } else del += nv;
      j++;
    }
    grupper.push({ v: sum + del, fra: i, til: j }); i = j;
  }
  const ENHET = /^(slurk|slurker|slurkene|slurken|sips?|shots?|shotter|glass|øl|bokser|drinker|drinks?|supen?|gulp)$/;
  const VERB = /^(drikk|drikker|drikke|drink|drinks|gi|gir|give|gives|del|deler|hand|ta|tar|take|chug|bunn)$/;
  let maks = 0;
  grupper.forEach((g) => {
    const etter = t.slice(g.til + 1, g.til + 3).some((w) => ENHET.test(w));
    const foran = t.slice(Math.max(0, g.fra - 3), g.fra).some((w) => VERB.test(w));
    if (etter || foran) maks = Math.max(maks, g.v);
  });
  return maks;
}
/** Kortet som objekt (eldre rom og egne kortstokker har bare tekst). */
function rfKortObj(x: any) { return typeof x === 'string' ? { t: x, til: 'alle' } : x; }
/** Kommentaren fra oss i Skammekroken, tilpasset det som ble skrevet. */
function rfKommentar(data: any, k: any) {
  const fra = navnPaa(data, k.fra), til = k.til && !['alle', 'trekker', 'to'].includes(k.til) ? navnPaa(data, k.til) : null;
  if (k.grunn === 'stemt') {
    const v = [
      L('Rommet var enstemmig. Kortet var ikke det.', 'The room was unanimous. The card was not.'),
      L('Folkets dom: ut. ' + fra + ' får prøve igjen neste gang.', 'The people have spoken: out. ' + fra + ' can try again next time.'),
      L('Alle stemte ja. Det har aldri skjedd i en gruppechat før.', 'Everyone voted yes. That has never happened in a group chat.'),
    ];
    return v[tilfeldig(v.length)];
  }
  const n = k.n || 0, liter = Math.round(n * 0.02 * 10) / 10;
  const v = [
    L(n + ' slurker er omtrent ' + String(liter).replace('.', ',') + ' liter. ' + (til ? til + ' er ikke et badekar.' : 'Det er ikke en vors, det er en flom.'), n + ' sips is about ' + liter + ' litres. ' + (til ? til + ' is not a bathtub.' : 'That is not a pre-party, it is a flood.')),
    til ? L(fra + ' tror ' + til + ' har en lever av rustfritt stål.', fra + ' thinks ' + til + ' has a stainless steel liver.') : L(fra + ' tror alle her har en lever av rustfritt stål.', fra + ' thinks everyone here has a stainless steel liver.'),
    L('Matematikk: 1. ' + fra + ': 0.', 'Maths: 1. ' + fra + ': 0.'),
    L(n + ' slurker. Selv en elg hadde sagt nei takk.', n + ' sips. Even a moose would say no thanks.'),
  ];
  return v[tilfeldig(v.length)];
}
function rfTilSkam(data: any, k: any) {
  const s = data.spill; s.skam = s.skam || [];
  s.skam.push({ fra: k.fra, t: k.t, til: k.til || 'alle', grunn: k.grunn || 'tall', n: k.n || 0, kommentar: rfKommentar(data, k) });
}
/** Hvem kortet som nå ligger øverst er til: ingen (alle), den som trakk, én person, eller to tilfeldige. */
function rfMottakere(data: any, k: any, trekker: string | null): string[] {
  const ider = data.spillere.map((p: any) => p.id);
  if (!k || !k.til || k.til === 'alle') return [];
  if (k.til === 'trekker') return trekker ? [trekker] : [];
  if (k.til === 'to') return stokk(ider.slice()).slice(0, 2);
  return ider.includes(k.til) ? [k.til] : [];
}
const PY_VINDU = 10000;
function pyRad(pos: number) { return pos < 5 ? 1 : pos < 9 ? 2 : pos < 12 ? 3 : pos < 14 ? 4 : 5; }
export const EKSTRA = ['opus', 'overunder', 'veddelopet', 'pyramiden', 'gris', 'president', 'regelfabrikken', 'tosannheter', 'bussruta', 'yatzy', 'nyhetsrunden', 'dealer', ...SOS];
export const REAKSJONER = ['🍻', '😂', '🔥', '😱', '👏', '😍', '🤢', '🥴', '🙈', '🤘', '🫡'];
/** Noe skjedde i rommet som figurene reagerer på (drikk, bom, pekt, vinner). Siste gjelder; telefonene spiller den av én gang. */
function stuaHendelse(data: any, type: string, ider: string[]) {
  if (!ider.length) return;
  data.stuaHendNr = (data.stuaHendNr || 0) + 1;
  data.stuaHend = { nr: data.stuaHendNr, type, ider: ider.slice(0, 8) };
}
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
  ['regelfabrikken', 'Skriv og drikk', 'Write & Drink', 'Alle skriver så mange drikkekort de rekker på sin telefon. Så stokkes alt og trekkes.', 'Everyone writes as many drinking cards as they can on their phone. Then it all gets shuffled and drawn.'],
  ['overunder', 'Over eller under', 'Higher or lower', 'Den som har tur gjetter på sin telefon. Feil = drikk hele bunken.', 'Whoever has the turn guesses on their phone. Wrong = drink the whole pile.'],
  ['veddelopet', 'Veddeløpet', 'Horse race', 'Alle vedder på sin telefon, så kjøres løpet.', 'Everyone bets on their phone, then the race is on.'],
  ['pyramiden', 'Pyramiden', 'Pyramid', 'Fire skjulte kort hver. Bløff eller si sannheten – og utfordre de andre.', 'Four hidden cards each. Bluff or tell the truth – and call out the others.'],
  ['gris', 'Gris', 'Pig', 'Send kort til venstre til noen har fire like. Sistemann på nesa drikker.', 'Pass cards to the left until someone has four of a kind. Last one to touch their nose drinks.'],
  ['president', 'President', 'President', 'Bli kvitt kortene først. Toere er høyest og rydder bordet.', 'Get rid of your cards first. Twos are highest and clear the table.'],
  ['dealer', 'Fuck the Dealer', 'Fuck the Dealer', 'Bare dealeren har kortstokken. De andre gjetter høyt – treff, og dealeren drikker kortet.', 'Only the dealer holds the deck. The others guess out loud – a hit, and the dealer drinks the card.'],
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
    info('overunder'), info('veddelopet'), info('pyramiden'), info('gris'), info('president'), info('dealer'),
  ];
}
function ftdVn(v: number) { return v === 1 ? 'A' : v <= 10 ? String(v) : ({ 11: 'Kn', 12: 'D', 13: 'K' } as any)[v]; }
function ftdVnEn(v: number) { return v === 1 ? 'A' : v <= 10 ? String(v) : ({ 11: 'J', 12: 'Q', 13: 'K' } as any)[v]; }
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
    data.spill = { type: 'tosannheter', lek, navn: EKSTRA_NAVN.tosannheter, aktiv: ider[0], fase: 'skriv', pastander: [], logn: -1, stemmer: {}, runde: 1, sittet: [], lurt: {}, forrige: null };
  } else   if (lek === 'regelfabrikken') {
    const sek = [45, 60, 90].includes(Number(modus)) ? Number(modus) : 60;
    data.spill = { type: 'regelfabrikken', lek, navn: EKSTRA_NAVN.regelfabrikken, modus: L(sek + ' sek', sek + ' sec'), fase: 'klar', frist: null, sek, kort: {}, med: {}, rekke: [], pos: 0 };
  } else   if (lek === 'opus') {
    data.spill = { type: 'opus', lek, navn: EKSTRA_NAVN.opus, holder: ider[0], kast: null, antall: 0, nr: 0 };
  } else if (lek === 'overunder') {
    const st = kortstokk52();
    data.spill = { type: 'overunder', lek, navn: EKSTRA_NAVN.overunder, stokk: st, kort: st.pop(), bunke: 1, tur: 0, sist: null, n: 0, drukket: {}, storst: null, ferdig: false, runde: 1 };
  } else if (lek === 'veddelopet') {
    const st = kortstokk52().filter((k: any) => k.v !== 14);
    data.spill = { type: 'veddelopet', lek, navn: EKSTRA_NAVN.veddelopet, fase: 'vedd', veddemaal: {}, stokk: st, bane: st.splice(0, 7), snudd: [], pos: { '♥': 0, '♠': 0, '♦': 0, '♣': 0 }, sist: null, vinner: null, n: 0, sistSnu: 0, runde: (data.spill && data.spill.type === 'veddelopet' ? (data.spill.runde || 1) + 1 : 1) };
    settFrist(data.spill, FRIST.veddelopet);
  } else if (lek === 'pyramiden') {
    if (n < 2) return feilL('for-faa', 'Pyramiden trenger minst to spillere.', 'Pyramid needs at least two players.');
    const st = kortstokk52();
    const hender: any = {}; ider.forEach((id: string) => { hender[id] = st.splice(0, 4); });
    // Første kort snus med en gang; vertens telefon snur resten, ett hvert tiende sekund
    data.spill = { type: 'pyramiden', lek, navn: EKSTRA_NAVN.pyramiden, hender, pyr: st.splice(0, 15), pos: 1, snuddVed: Date.now(), pastander: [], lurt: {}, tatt: {}, avsl: null, n: 0, ferdig: false };
  } else if (lek === 'gris') {
    if (n < 3) return feilL('for-faa', 'Gris trenger minst tre spillere.', 'Pig needs at least three players.');
    data.spill = { type: 'gris', lek, navn: EKSTRA_NAVN.gris, bokstaver: {} };
    nyGrisRunde(data);
  } else if (lek === 'president') {
    if (n < 3) return feilL('for-faa', 'President trenger minst tre spillere.', 'President needs at least three players.');
    nyPresidentRunde(data, null);
  } else if (lek === 'dealer') {
    if (n < 2) return feilL('for-faa', 'Fuck the Dealer trenger minst to spillere.', 'Fuck the Dealer needs at least two players.');
    // Ess er 1 og konge 13 – både for «høyere/lavere» og for hvor mange slurker kortet er verdt
    const st: any[] = []; ['♥', '♦', '♠', '♣'].forEach((f) => { for (let v = 1; v <= 13; v++) st.push({ v, f }); });
    const forrige = data.spill && data.spill.type === 'dealer' ? data.spill : null;
    const dealer = forrige && ider.includes(forrige.dealer) ? ider[(ider.indexOf(forrige.dealer) + 1) % n] : ider[0];
    data.spill = { type: 'dealer', lek, navn: EKSTRA_NAVN.dealer, stokk: stokk(st), pos: 0, dealer, bom: 0, fase: 'gjett', g1: null, hint: null, res: null,
      brukt: {}, drukket: {}, dealt: {}, n: 0, runde: forrige ? (forrige.runde || 1) + 1 : 1 };
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
  s.sendVed = Date.now(); s.byttNr = 0; s.taper = null; s.neseVed = 0; s.ferdigVed = 0;
}
// Gris går av seg selv: 10 s per bytte, 5 s på nesa, 4 s pause før neste runde. Vertens telefon driver klokka.
const GR_BYTT = 10000, GR_NESE = 5000, GR_PAUSE = 4000;
function grBytt(s: any, ider: string[]) {
  const sendt = ider.map((id: string) => s.hender[id].splice(s.valgt[id], 1)[0]);
  ider.forEach((id: string, j: number) => { s.hender[id].push(sendt[(j - 1 + ider.length) % ider.length]); });
  s.valgt = {}; s.byttNr = (s.byttNr || 0) + 1; s.sendVed = Date.now();
}
/** En bokstav til. Fire bokstaver = GRIS: spillet er over. */
function grBokstav(data: any, s: any, id: string) {
  s.bokstaver[id] = (s.bokstaver[id] || 0) + 1;
  if (s.bokstaver[id] >= 4 && !s.gris) {
    s.gris = id; s.fase = 'slutt';
    melde(data, `${navnPaa(data, id)} er GRIS! Ta en shot.`, `${navnPaa(data, id)} spelled PIGS! Take a shot.`);
  }
}
function fireLike(h: any[]) { return h.length === 4 && h.every((k) => k.v === h[0].v); }

/* ---------- President ---------- */
const RANG = (v: number) => (v === 2 ? 15 : v);
const PR_TUR = 20000;
function nyPresidentRunde(data: any, forrige: any) {
  const ider = aktiveIder(data, true), st = kortstokk52();
  const hender: any = {}; ider.forEach((id: string) => { hender[id] = []; });
  st.forEach((k: any, i: number) => hender[ider[i % ider.length]].push(k));
  const sorter = (id: string) => hender[id].sort((a: any, b: any) => RANG(a.v) - RANG(b.v));
  ider.forEach(sorter);
  // Rævkjøreren gir sitt beste kort til Presidenten, og får Presidentens laveste tilbake
  let bytte: any = null;
  const fe = forrige && forrige.ferdige || [];
  if (fe.length >= 2) {
    const pres = fe[0], raev = fe[fe.length - 1];
    if (hender[pres] && hender[raev] && pres !== raev) {
      const best = hender[raev].pop(), lav = hender[pres].shift();
      hender[pres].push(best); hender[raev].push(lav); sorter(pres); sorter(raev);
      bytte = { fra: raev, til: pres, kort: best, tilbake: lav };
    }
  }
  data.spill = { type: 'president', lek: 'president', navn: EKSTRA_NAVN.president, hender, bord: [], bordAv: null, pass: [], tur: 0,
    ferdige: [], titler: (forrige && forrige.titler) || {}, runde: forrige ? (forrige.runde || 1) + 1 : 1,
    turVed: Date.now(), leggNr: 0, feiNr: 0, sist: null, bytte, drikk: null };
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
        s.pastander = rekkef.map((i) => p[i]); s.logn = rekkef.indexOf(l); s.fase = 'stem'; s.stemmer = {}; s.forrige = null; settFrist(s, FRIST.tosannheter);
        melde(data, `${meg.navn} har skrevet – hvilken er løgnen?`, `${meg.navn} is done writing – which one is the lie?`); return { ok: true };
      }
      if (h.handling === 'stem') {
        if (s.fase !== 'stem' || meg.id === s.aktiv) return { ok: true };
        const v = Number(h.paa); if (!(v >= 0 && v < 3)) return { feil: 'ukjent' };
        s.stemmer[meg.id] = v;
        // Alle har stemt: 2 sekunder pust, så snus kortene (stemmen kan byttes til da)
        if (ider.filter((id: string) => id !== s.aktiv).every((id: string) => s.stemmer[id] !== undefined)) sosPust(s);
        return { ok: true };
      }
      if (h.handling === 'avslor' || h.handling === 'tid-ute') {
        if (s.fase !== 'stem') return { ok: true };
        const mangler = ider.filter((id: string) => id !== s.aktiv && s.stemmer[id] === undefined).length;
        if (!fristUte(s)) return h.handling === 'avslor' && mangler > 0 ? venter(s, mangler) : { ok: true };
        avgjorTo(data); return { ok: true };
      }
      if (h.handling === 'runde') {
        // Spill igjen: en ny runde i stolen for alle (teller i kvelden)
        if (s.fase !== 'ferdig') return { ok: true };
        if (meg.id !== data.vert) return feilL('bare-vert', 'Verten bestemmer hva som skjer nå.', 'The host decides what happens next.');
        s.runde = (s.runde || 1) + 1; s.sittet = []; s.lurt = {}; s.forrige = null;
        Object.assign(s, { aktiv: ider[(s.runde - 1) % ider.length], fase: 'skriv', pastander: [], logn: -1, stemmer: {}, frist: null });
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
        const til = ['alle', 'trekker', 'to'].includes(h.til) || data.spillere.some((p: any) => p.id === h.til) ? h.til : 'alle';
        const n = rfSlurker(tekst);
        // For mange slurker: den som skriver merker ingenting – kortet havner i Skammekroken i stedet for i bunken
        mine.push({ t: tekst, til, fra: meg.id, ...(n > RF_MAKS ? { skam: true, n } : {}) });
        return { ok: true };
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
        const alle: any[] = []; s.skam = s.skam || [];
        Object.values(s.kort).forEach((l: any) => l.forEach((x: any) => { const k = rfKortObj(x); if (k.skam) rfTilSkam(data, { ...k, grunn: 'tall' }); else alle.push(k); }));
        Object.entries(s.med || {}).forEach(([id, l]: any) => l.forEach((t: string) => alle.push({ t, til: 'alle', fra: id })));
        if (!alle.length && !s.skam.length) return feilL('tom', 'Ingen har skrevet noe ennå.', "Nobody has written anything yet.");
        s.rekke = stokk(alle); s.pos = 0; s.fase = alle.length ? 'trekk' : 'skam'; s.trekker = meg.id; s.kast = null;
        s.mottakere = rfMottakere(data, s.rekke[0], meg.id);
        melde(data, alle.length + ' kort er stokket. Trekk!', alle.length + (alle.length === 1 ? ' card' : ' cards') + ' shuffled. Draw!');
        return { ok: true };
      }
      if (h.handling === 'neste') {
        if (s.fase === 'skam') {   // videre fra Skammekroken: stokk og spill videre
          (s.skam || []).forEach((k: any) => giSlurker(data, k.fra, 1));
          s.skamVist = (s.skamVist || []).concat(s.skam || []); s.skam = [];
          s.fase = 'ferdig'; s.trukket = s.rekke.length;
          return { ok: true };
        }
        if (s.fase !== 'trekk') return { ok: true };
        if (typeof h.pos === 'number' && h.pos !== s.pos) return { ok: true };
        // Dere gjør kortene i virkeligheten: verten og den som trakk sist går videre
        if (meg.id !== data.vert && meg.id !== s.trekker) return feilL('ikke-din-tur', 'Verten eller den som trakk sist går videre.', 'The host or whoever drew last moves on.');
        s.pos++; s.trekker = meg.id; s.kast = null;
        if (s.pos >= s.rekke.length) {
          // Bunken er tom: Skammekroken først (hvis noen prøvde seg), så er leken ferdig
          if ((s.skam || []).length) { s.fase = 'skam'; melde(data, 'Skammekroken!', 'The corner of shame!'); return { ok: true }; }
          s.fase = 'ferdig'; s.trukket = s.rekke.length; s.pos = s.rekke.length - 1; melde(data, 'Bunken er tom!', 'The pile is empty!');
          return { ok: true };
        }
        s.mottakere = rfMottakere(data, rfKortObj(s.rekke[s.pos]), meg.id);
        return { ok: true };
      }
      if (h.handling === 'rf-kast') {   // verten foreslår å kaste kortet; alle unntatt den som skrev det må si ja
        if (s.fase !== 'trekk' || s.egen) return { ok: true };
        if (meg.id !== data.vert) return feilL('bare-vert', 'Bare verten kan foreslå å kaste et kort.', 'Only the host can suggest binning a card.');
        const k = rfKortObj(s.rekke[s.pos]);
        s.kast = { pos: s.pos, fra: k.fra || null, ja: [], nei: [] };
        return { ok: true };
      }
      if (h.handling === 'rf-kast-stem') {
        const kk = s.kast; if (!kk || s.fase !== 'trekk' || kk.pos !== s.pos) return { ok: true };
        if (meg.id === kk.fra) return { ok: true };
        kk.ja = kk.ja.filter((id: string) => id !== meg.id); kk.nei = kk.nei.filter((id: string) => id !== meg.id);
        (h.ja === true ? kk.ja : kk.nei).push(meg.id);
        if (kk.nei.length) { s.kast = null; melde(data, 'Kortet blir. Noen likte det.', 'The card stays. Someone liked it.'); return { ok: true }; }
        const stemmere = data.spillere.filter((p: any) => p.id !== kk.fra).map((p: any) => p.id);
        if (stemmere.every((id: string) => kk.ja.includes(id))) {
          const k = rfKortObj(s.rekke[s.pos]);
          rfTilSkam(data, { ...k, grunn: 'stemt' });
          s.rekke.splice(s.pos, 1); s.kast = null;
          melde(data, 'Kortet er kastet i Skammekroken.', 'The card went to the corner of shame.');
          if (s.pos >= s.rekke.length) { if (s.skam.length) s.fase = 'skam'; else { s.fase = 'ferdig'; s.trukket = s.rekke.length; } return { ok: true }; }
          s.mottakere = rfMottakere(data, rfKortObj(s.rekke[s.pos]), s.trekker);
        }
        return { ok: true };
      }
      if (h.handling === 'rf-kast-avbryt') { if (meg.id === data.vert) s.kast = null; return { ok: true }; }
      if (h.handling === 'rf-igjen') {   // spill de samme kortene en gang til
        if (meg.id !== data.vert) return feilL('bare-vert', 'Verten bestemmer hva som skjer nå.', 'The host decides what happens next.');
        if (s.fase !== 'ferdig' || !s.rekke.length) return { ok: true };
        s.rekke = stokk(s.rekke); s.pos = 0; s.fase = 'trekk'; s.trekker = meg.id; s.kast = null; s.mottakere = rfMottakere(data, rfKortObj(s.rekke[0]), meg.id);
        melde(data, 'Samme bunke, ny runde!', 'Same pile, new round!'); return { ok: true };
      }
      if (h.handling === 'nytt') {
        if (s.egen) { s.rekke = stokk(s.rekke); s.pos = 0; melde(data, 'Stokket på nytt.', 'Reshuffled.'); return { ok: true }; }
        return startEkstra(data, 'regelfabrikken', String(s.sek));
      }
      return null;
    }
    case 'opus': {
      if (h.handling === 'kast') {
        if (meg.id !== s.holder && !erVert) return feilL('ikke-din-tur', 'Det er ikke du som har terningen.', "You don't have the die.");
        s.kast = 1 + tilfeldig(6); s.antall++; s.nr++;
        if (s.kast === 6) { const i = ider.indexOf(s.holder); s.holder = ider[(i + 1) % ider.length]; s.fra = meg.id; }
        return { ok: true };
      }
      if (h.handling === 'drop') { giSlurker(data, s.holder, 5); melde(data, `Droppet! ${navnPaa(data, s.holder)} holdt terningen – drikk opp!`, `Dropped! ${navnPaa(data, s.holder)} had the die – finish your drink!`); return { ok: true }; }
      return null;
    }
    case 'overunder': {
      const erVert = meg.id === data.vert;
      if (h.handling === 'runde') {
        // Spill igjen: ny stokk (teller i kvelden)
        if (!s.ferdig) return { ok: true };
        if (!erVert) return feilL('bare-vert', 'Verten bestemmer hva som skjer nå.', 'The host decides what happens next.');
        const st = kortstokk52();
        Object.assign(s, { stokk: st, kort: st.pop(), bunke: 1, sist: null, drukket: {}, storst: null, ferdig: false, runde: (s.runde || 1) + 1 });
        return { ok: true };
      }
      if (h.handling === 'ou-hopp') {
        // Bare verten kan hoppe over den som har tur (ingen drikker)
        if (!erVert) return feilL('bare-vert', 'Bare verten kan hoppe over.', 'Only the host can skip.');
        if (!s.ferdig) s.tur = (s.tur + 1) % ider.length;
        return { ok: true };
      }
      if (h.handling !== 'gjett') return null;
      if (s.ferdig) return { ok: true };
      const hvem = ider[s.tur % ider.length];
      // Den som har tur svarer – eller verten svarer for hen (så ikke alle trenger telefonen oppe)
      if (hvem !== meg.id && !erVert) return feilL('ikke-din-tur', 'Vent på tur.', 'Wait for your turn.');
      if (h.paa !== 'over' && h.paa !== 'under') return { feil: 'ukjent' };
      if (!s.stokk.length) { s.ferdig = true; return { ok: true }; }
      const nytt = s.stokk.pop(), riktig = h.paa === 'over' ? nytt.v > s.kort.v : nytt.v < s.kort.v;
      s.sist = { fra: s.kort, til: nytt, riktig, hvem, bunke: s.bunke, paa: h.paa };
      s.n = (s.n || 0) + 1;
      if (riktig) s.bunke++;
      else {
        giSlurker(data, hvem, s.bunke); s.drukket = s.drukket || {}; s.drukket[hvem] = (s.drukket[hvem] || 0) + s.bunke;
        if (!s.storst || s.bunke > s.storst.n) s.storst = { id: hvem, n: s.bunke };
        melde(data, `${navnPaa(data, hvem)} bommet – drikk ${s.bunke}!`, `${navnPaa(data, hvem)} missed – drink ${s.bunke}!`); s.bunke = 1;
      }
      s.kort = nytt; s.tur = (s.tur + 1) % ider.length;
      if (!s.stokk.length) s.ferdig = true;
      return { ok: true };
    }
    case 'veddelopet': {
      const erVert = meg.id === data.vert;
      if (h.handling === 'vedd' && s.fase === 'vedd') {
        if (!['♥', '♠', '♦', '♣'].includes(h.farge)) return { feil: 'ukjent' };
        s.veddemaal[meg.id] = { farge: h.farge, slurker: Math.max(1, Math.min(10, Number(h.slurker) || 2)) };
        // Alle har veddet: 2 sekunder pust, så starter løpet av seg selv
        if (data.spillere.every((p: any) => s.veddemaal[p.id])) sosPust(s);
        return { ok: true };
      }
      if (h.handling === 'vl-start' && s.fase === 'vedd') {
        // Verten starter uten å vente – de som ikke har veddet, står over dette løpet
        if (!erVert) return feilL('bare-vert', 'Verten starter løpet.', 'The host starts the race.');
        if (!Object.keys(s.veddemaal).length) return feilL('ingen-vedd', 'Noen må vedde først.', 'Someone has to bet first.');
        s.fase = 'lop'; s.frist = null; s.sistSnu = Date.now(); melde(data, 'Løpet er i gang!', "And they're off!"); return { ok: true };
      }
      if ((h.handling === 'lop' || h.handling === 'tid-ute') && s.fase === 'vedd') {
        const mangler = data.spillere.length - Object.keys(s.veddemaal).length;
        if (mangler > 0 && !fristUte(s)) return h.handling === 'tid-ute' ? { ok: true } : venter(s, mangler);
        if (!fristUte(s)) return { ok: true };
        if (!Object.keys(s.veddemaal).length) return { ok: true };
        s.fase = 'lop'; s.frist = null; s.sistSnu = Date.now(); melde(data, 'Løpet er i gang!', "And they're off!"); return { ok: true };
      }
      if (h.handling === 'snu' && s.fase === 'lop') {
        // Løpet drives av den telefonen som er våken (verten først), ett kort i sekundet – serveren holder takten
        if (Date.now() - (s.sistSnu || 0) < 700) return { ok: true };
        s.sistSnu = Date.now(); s.n = (s.n || 0) + 1;
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
      if (h.handling === 'nytt' || h.handling === 'runde') {
        if (s.fase !== 'ferdig') return { ok: true };
        if (!erVert) return feilL('bare-vert', 'Verten bestemmer hva som skjer nå.', 'The host decides what happens next.');
        return startEkstra(data, 'veddelopet');
      }
      return null;
    }
    case 'pyramiden': {
      if (h.handling === 'snu') {
        // Ett kort hvert tiende sekund, drevet av den telefonen som er våken. Påstander ingen ropte løgn på, står.
        if (s.ferdig) return { ok: true };
        if (Date.now() - (s.snuddVed || 0) < PY_VINDU - 600) return { ok: true };
        s.pastander.filter((p: any) => p.pos === s.pos - 1 && !p.avgjort).forEach((p: any) => {
          p.avgjort = 'godtatt'; if (p.kort.v !== s.pyr[p.pos].v) s.lurt[p.id] = (s.lurt[p.id] || 0) + 1;
        });
        if (s.pos >= 15) { s.ferdig = true; melde(data, 'Toppen er snudd! Hendene vises.', 'The top is flipped! Hands are shown.'); return { ok: true }; }
        s.pos++; s.snuddVed = Date.now(); return { ok: true };
      }
      if (h.handling === 'py-legg') {
        if (s.ferdig || s.pos < 1) return { ok: true };
        const hand = s.hender[meg.id];
        if (!hand) return { feil: 'ikke-med', melding: 'Du kom inn midt i runden – du er med fra neste.', en: 'You joined mid-round – you’re in from the next one.' };
        const pos = s.pos - 1;
        if (s.pastander.some((p: any) => p.pos === pos && p.id === meg.id)) return { ok: true };
        const i = Number(h.i); if (!(i >= 0 && i < hand.length)) return { feil: 'ukjent' };
        const kort = hand.splice(i, 1)[0], rad = pyRad(pos);
        s.pastander.push({ id: meg.id, pos, rad, kort, avgjort: null, av: null });
        giUtdeling(data, meg.id, rad);
        melde(data, `${meg.navn} la på et kort – deler ut ${rad}!`, `${meg.navn} laid a card – giving out ${rad}!`);
        return { ok: true };
      }
      if (h.handling === 'utfordre') {
        const p = s.pastander.find((x: any) => x.id === h.paa && x.pos === s.pos - 1 && !x.avgjort);
        if (!p || p.id === meg.id || s.ferdig) return { ok: true };
        const sant = p.kort.v === s.pyr[p.pos].v, n = p.rad * 2;
        p.av = meg.id; p.avgjort = sant ? 'sant' : 'bløff';
        if (sant) { giSlurker(data, meg.id, n); melde(data, `${navnPaa(data, p.id)} hadde kortet! ${meg.navn} drikker ${n}.`, `${navnPaa(data, p.id)} had the card! ${meg.navn} drinks ${n}.`); }
        else {
          // Tatt i bløff: kortet går tilbake på hånda, og du drikker dobbelt
          giSlurker(data, p.id, n); (s.hender[p.id] = s.hender[p.id] || []).push(p.kort); s.tatt[p.id] = (s.tatt[p.id] || 0) + 1;
          melde(data, `${navnPaa(data, p.id)} bløffet! Drikk ${n}.`, `${navnPaa(data, p.id)} was bluffing! Drink ${n}.`);
        }
        s.n = (s.n || 0) + 1; s.avsl = { id: p.id, av: meg.id, kort: p.kort, sant, n, nr: s.n };
        return { ok: true };
      }
      if (h.handling === 'nytt' || h.handling === 'runde') { if (meg.id !== data.vert) return { feil: 'bare-vert' }; return startEkstra(data, 'pyramiden'); }
      return null;
    }
    case 'dealer': {
      /* Bare dealeren trykker (verten kan trykke for en dealer som har lagt fra seg telefonen). Hvem som gjetter er likegyldig:
         noen sier en verdi høyt, dealeren trykker den. Treff på første: dealeren drikker kortets verdi. Bom: dealeren sier
         høyere/lavere, ett forsøk til. Treff nå: halve kortet, rundet opp. Bom igjen: gjetteren drikker avstanden.
         Tre bom på rad gir stokken videre til nestemann rundt bordet; et treff nullstiller. Tom stokk = ferdig. */
      const kanStyre = meg.id === s.dealer || meg.id === data.vert;
      if (h.handling === 'ftd-gjett') {
        if (!kanStyre || (s.fase !== 'gjett' && s.fase !== 'andre')) return { ok: true };
        const v = Number(h.v), k = s.stokk[s.pos];
        if (!(v >= 1 && v <= 13) || (s.brukt[v] || 0) >= 4) return { feil: 'ukjent' };
        if (s.fase === 'andre' && ((s.hint === 'hoy' && v <= s.g1) || (s.hint === 'lav' && v >= s.g1))) return { feil: 'ukjent' };
        const treff = v === k.v;
        if (!treff && s.fase === 'gjett') { s.g1 = v; s.hint = v < k.v ? 'hoy' : 'lav'; s.fase = 'andre'; return { ok: true }; }
        s.n = (s.n || 0) + 1; s.brukt[k.v] = (s.brukt[k.v] || 0) + 1; s.dealt[s.dealer] = (s.dealt[s.dealer] || 0) + 1;
        if (treff) {
          const n = s.fase === 'gjett' ? k.v : Math.ceil(k.v / 2);
          giSlurker(data, s.dealer, n); s.drukket[s.dealer] = (s.drukket[s.dealer] || 0) + n; s.bom = 0;
          s.res = { type: s.fase === 'gjett' ? 'treff1' : 'treff2', n, kort: k, g: v, nr: s.n };
          stuaHendelse(data, 'drikk', [s.dealer]);
          melde(data, `Treff! ${navnPaa(data, s.dealer)} drikker ${n}.`, `Hit! ${navnPaa(data, s.dealer)} drinks ${n}.`);
        } else {
          const n = Math.abs(v - k.v); s.bom = (s.bom || 0) + 1;
          s.res = { type: 'bom', n, kort: k, g: v, g1: s.g1, nr: s.n };
          melde(data, `Bom – kortet var ${ftdVn(k.v)}. Gjetteren drikker ${n}.`, `Miss – the card was ${ftdVnEn(k.v)}. The guesser drinks ${n}.`);
        }
        s.fase = 'res'; return { ok: true };
      }
      if (h.handling === 'ftd-neste') {
        if (!kanStyre || s.fase !== 'res') return { ok: true };
        s.pos++; s.g1 = null; s.hint = null; s.bytt = null;
        if (s.pos >= s.stokk.length) { s.fase = 'ferdig'; melde(data, 'Stokken er tom!', 'The deck is empty!'); return { ok: true }; }
        if (s.bom >= 3) {
          const alle = aktiveIder(data), i = alle.indexOf(s.dealer), ny = alle[(i + 1) % alle.length] || s.dealer;
          s.bytt = { fra: s.dealer, til: ny }; s.dealer = ny; s.bom = 0;
          melde(data, `Tre bom på rad – ${navnPaa(data, ny)} deler nå.`, `Three misses in a row – ${navnPaa(data, ny)} deals now.`);
        }
        s.fase = 'gjett'; return { ok: true };
      }
      if (h.handling === 'nytt' || h.handling === 'runde') { if (meg.id !== data.vert) return { feil: 'bare-vert' }; return startEkstra(data, 'dealer'); }
      return null;
    }
    case 'gris': {
      const gi = ider.filter((id: string) => s.hender && s.hender[id]);
      if (h.handling === 'nytt' || h.handling === 'runde') { if (meg.id !== data.vert) return { feil: 'bare-vert' }; return startEkstra(data, 'gris'); }
      if (h.handling === 'gr-tikk') {
        if (!s.hender || !s.hender[meg.id] && meg.id !== data.vert) return { ok: true };
        const naa = Date.now();
        if (s.fase === 'send' && naa - (s.sendVed || 0) >= GR_BYTT - 300) {
          // Valgte du ikke, sendes kortet lengst til venstre
          gi.forEach((id: string) => { if (s.valgt[id] === undefined) s.valgt[id] = 0; });
          grBytt(s, gi);
        } else if (s.fase === 'nese' && naa - (s.neseVed || 0) >= GR_NESE - 300) {
          const mangler = gi.filter((id: string) => !s.neser.includes(id));
          mangler.forEach((id: string) => grBokstav(data, s, id));
          s.taper = mangler[0] || null;
          if (mangler.length) melde(data, `${mangler.map((id: string) => navnPaa(data, id)).join(', ')} rakk ikke nesa – bokstav!`, `${mangler.map((id: string) => navnPaa(data, id)).join(', ')} missed the nose – a letter!`);
          if (s.fase !== 'slutt') { s.fase = 'ferdig'; s.ferdigVed = naa; }
        } else if (s.fase === 'ferdig' && naa - (s.ferdigVed || 0) >= GR_PAUSE - 300) nyGrisRunde(data);
        return { ok: true };
      }
      if (!s.hender[meg.id] || s.fase === 'slutt') return { ok: true };  // kom inn midt i runden
      if (h.handling === 'velg' && s.fase === 'send') {
        const i = Number(h.i); if (!(i >= 0 && i < 4)) return { feil: 'ukjent' };
        s.valgt[meg.id] = i;
        if (gi.every((id: string) => s.valgt[id] !== undefined)) grBytt(s, gi);
        return { ok: true };
      }
      if (h.handling === 'nese') {
        if (s.fase === 'ferdig' || s.neser.includes(meg.id)) return { ok: true };
        if (s.fase === 'send') {
          if (!fireLike(s.hender[meg.id])) {
            melde(data, `${meg.navn} tok seg på nesa for tidlig – får en bokstav!`, `${meg.navn} touched their nose too early – gets a letter!`);
            s.tNr = (s.tNr || 0) + 1; s.tidlig = { id: meg.id, nr: s.tNr };
            grBokstav(data, s, meg.id);
            return { ok: true };
          }
          s.fase = 'nese'; s.neseVed = Date.now();
        }
        s.neser.push(meg.id);
        if (s.neser.length >= gi.length - 1) {
          const taper = gi.find((id: string) => !s.neser.includes(id));
          if (taper) {
            grBokstav(data, s, taper);
            const n = Math.min(4, s.bokstaver[taper]), b = 'GRIS'.slice(0, n), bEn = 'PIGS'.slice(0, n);
            melde(data, `${navnPaa(data, taper)} var sist på nesa – ${b}!`, `${navnPaa(data, taper)} was last to touch their nose – ${bEn}!`);
          }
          s.taper = taper || null;
          if (s.fase !== 'slutt') { s.fase = 'ferdig'; s.ferdigVed = Date.now(); }
        }
        return { ok: true };
      }
      return null;
    }
    case 'president': {
      const turId = ider[s.tur];
      if (h.handling === 'pr-tikk') {
        // Vertens telefon: 20 s per tur. Ute? Da passes det – eller laveste kort legges om du starter.
        if (s.fase === 'ferdig' || !turId) return { ok: true };
        if (Date.now() - (s.turVed || 0) < PR_TUR - 300) return { ok: true };
        const p = data.spillere.find((x: any) => x.id === turId) || { id: turId, navn: navnPaa(data, turId) };
        return ekstraHandling(data, p, s.bord.length ? { handling: 'pass' } : { handling: 'legg', kort: [0] });
      }
      if (h.handling === 'nytt' || h.handling === 'runde') { if (meg.id !== data.vert) return { feil: 'bare-vert' }; nyPresidentRunde(data, s); return { ok: true }; }
      if (h.handling === 'legg' || h.handling === 'pass') {
        if (s.fase === 'ferdig') return { ok: true };
        if (turId !== meg.id && meg.id === data.vert && h.handling === 'pass') { const p = data.spillere.find((x: any) => x.id === turId) || { id: turId, navn: navnPaa(data, turId) }; return ekstraHandling(data, p, { handling: 'pass' }); }
        if (turId !== meg.id) return feilL('ikke-din-tur', 'Vent på tur.', 'Wait for your turn.');
        const hand = s.hender[meg.id];
        if (h.handling === 'pass') {
          if (!s.bord.length) return feilL('ugyldig', 'Du starter – legg ut noe.', "You're starting – play something.");
          if (!s.pass.includes(meg.id)) s.pass.push(meg.id);
          s.turVed = Date.now(); s.sistNr = (s.sistNr || 0) + 1; s.sist = { id: meg.id, pass: true, nr: s.sistNr };
        } else {
          const valg: number[] = Array.isArray(h.kort) ? [...new Set(h.kort.map(Number))].filter((i: number) => i >= 0 && i < hand.length) as number[] : [];
          if (!valg.length) return feilL('ugyldig', 'Velg kort.', 'Pick some cards.');
          const kort = valg.map((i) => hand[i]);
          if (!kort.every((k: any) => k.v === kort[0].v)) return feilL('ugyldig', 'Kortene må være like.', 'The cards have to match.');
          if (s.bord.length && (kort.length !== s.bord.length || RANG(kort[0].v) <= RANG(s.bord[0].v))) return feilL('ugyldig', `Legg ${s.bord.length} kort som er høyere.`, `Play ${s.bord.length} ${s.bord.length === 1 ? 'card' : 'cards'} that ${s.bord.length === 1 ? 'is' : 'are'} higher.`);
          s.hender[meg.id] = hand.filter((_: any, i: number) => !valg.includes(i));
          s.bord = kort; s.bordAv = meg.id; s.pass = [];
          s.turVed = Date.now(); s.leggNr = (s.leggNr || 0) + 1; s.sistNr = (s.sistNr || 0) + 1; s.sist = { id: meg.id, kort, nr: s.sistNr };
          if (!s.hender[meg.id].length) { s.ferdige.push(meg.id); melde(data, `${meg.navn} er tom for kort!`, `${meg.navn} is out of cards!`); }
          if (kort[0].v === 2) { s.bord = []; s.pass = []; s.feiNr = (s.feiNr || 0) + 1; melde(data, `${meg.navn} la toer og rydder bordet.`, `${meg.navn} played a two and clears the table.`);
            if (s.hender[meg.id].length) return { ok: true }; }
        }
        const igjen = ider.filter((id: string) => !s.ferdige.includes(id));
        if (igjen.length <= 1) {
          if (igjen.length === 1) s.ferdige.push(igjen[0]);
          const t: any = {}; t[s.ferdige[0]] = L('President', 'President'); t[s.ferdige[s.ferdige.length - 1]] = L('Rævkjører', 'Scumbag');
          if (s.ferdige.length > 3) { t[s.ferdige[1]] = L('Visepresident', 'Vice President'); t[s.ferdige[s.ferdige.length - 2]] = L('Viserævkjører', 'Vice Scumbag'); }
          s.titler = t; s.fase = 'ferdig';
          // Drikking: Rævkjøreren 3, Viserævkjøreren 2, Presidenten deler ut 3
          const fe = s.ferdige, drikk: any[] = [{ id: fe[fe.length - 1], n: 3 }];
          if (fe.length > 3) drikk.push({ id: fe[fe.length - 2], n: 2 });
          drikk.forEach((d: any) => giSlurker(data, d.id, d.n)); giUtdeling(data, fe[0], 3);
          s.drikk = { pres: fe[0], deler: 3, drikker: drikk };
          melde(data, `${navnPaa(data, s.ferdige[0])} er President! ${navnPaa(data, s.ferdige[s.ferdige.length - 1])} er rævkjører.`, `${navnPaa(data, s.ferdige[0])} is President! ${navnPaa(data, s.ferdige[s.ferdige.length - 1])} is the Scumbag.`);
          return { ok: true };
        }
        // Har alle andre sagt pass siden siste legg? Da rydder den som la sist.
        const maaSvare = igjen.filter((id: string) => id !== s.bordAv);
        if (s.bord.length && maaSvare.every((id: string) => s.pass.includes(id))) {
          s.bord = []; s.pass = []; s.feiNr = (s.feiNr || 0) + 1;
          const idx = ider.indexOf(s.bordAv);
          if (!s.ferdige.includes(s.bordAv)) { s.tur = idx; melde(data, `Ingen gikk over – ${navnPaa(data, s.bordAv)} starter på nytt.`, `Nobody went higher – ${navnPaa(data, s.bordAv)} starts again.`); return { ok: true }; }
          s.tur = idx;
        }
        presTurVidere(data);
        return { ok: true };
      }
      return null;
    }
  }
  return null;
}

function avgjorTo(data: any) {
  const s = data.spill, ider = aktiveIder(data); let riktige = 0, lurte = 0; s.drikker = [];
  // Bommet = drikk 1. Ikke stemt = tap, også 1. Stolen drikker 1 per person som så løgnen.
  ider.filter((id: string) => id !== s.aktiv).forEach((id: string) => {
    const v = s.stemmer[id];
    if (v === s.logn) riktige++;
    else { if (v !== undefined) lurte++; giSlurker(data, id, 1); s.drikker.push({ id, navn: navnPaa(data, id), slurker: 1 }); }
  });
  if (riktige) { giSlurker(data, s.aktiv, riktige); s.drikker.push({ id: s.aktiv, navn: navnPaa(data, s.aktiv), slurker: riktige }); }
  s.lurt = s.lurt || {}; s.lurt[s.aktiv] = (s.lurt[s.aktiv] || 0) + lurte;
  s.sittet = (s.sittet || []).concat([s.aktiv]);
  s.forrige = { aktiv: s.aktiv, pastander: s.pastander, logn: s.logn, stemmer: s.stemmer, drikker: s.drikker, riktige, n: Date.now() };
  melde(data, `Løgnen var: «${s.pastander[s.logn]}»`, `The lie was: “${s.pastander[s.logn]}”`);
  // Ingen «neste»-knapp: neste i stolen kan skrive med en gang, mens fasiten står
  const neste = ider.find((id: string) => !s.sittet.includes(id));
  Object.assign(s, { pastander: [], logn: -1, stemmer: {}, frist: null });
  if (neste) { s.aktiv = neste; s.fase = 'skriv'; }
  else s.fase = 'ferdig';
}
export function ekstraVisning(s: any, meg: any, data: any) {
  if (s.type === 'bussruta' || s.type === 'yatzy' || s.type === 'nyhetsrunden') return nyeVisning(s, meg, data);
  if (SOS.includes(s.type)) return sosVisning(s, meg, data);
  const ider = aktiveIder(data);
  if (s.type === 'tosannheter') return { aktiv: s.aktiv, fase: s.fase, pastander: s.pastander, harStemt: Object.keys(s.stemmer),
    minStemme: meg ? (s.stemmer[meg.id] ?? null) : null, logn: meg && meg.id === s.aktiv && s.fase === 'stem' ? s.logn : null,
    forrige: s.forrige || null, runde: s.runde || 1, sittet: s.sittet || [], velgere: ider.filter((id: string) => id !== s.aktiv),
    lurt: Object.entries(s.lurt || {}).map(([id, n]: any) => ({ id, n })).sort((a: any, b: any) => b.n - a.n) };
  if (s.type === 'regelfabrikken') {
    const kortet = s.fase === 'trekk' ? rfKortObj(s.rekke[s.pos]) : null, kk = s.kast;
    return { fase: s.fase, frist: s.frist, naa: Date.now(), sek: s.sek,
      mineKort: meg ? (s.kort[meg.id] || []).map((x: any) => rfKortObj(x).t) : [], mineMed: meg && s.med ? (s.med[meg.id] || []).length : 0,
      antall: Object.fromEntries(data.spillere.map((p: any) => [p.id, ((s.kort[p.id] || []).length + ((s.med || {})[p.id] || []).length)])),
      kortet: kortet ? kortet.t : null, til: kortet ? (kortet.til || 'alle') : null, mottakere: s.fase === 'trekk' ? s.mottakere || [] : [], trekker: s.trekker || null,
      pos: s.pos, videre: s.fase === 'trekk' ? [data.vert, s.trekker].filter(Boolean) : null, egen: !!s.egen, alleKort: s.fase === 'trekk' && meg ? s.rekke.map((x: any) => rfKortObj(x).t) : null,
      totalt: s.fase === 'trekk' ? s.rekke.length : Object.values(s.kort).concat(Object.values(s.med || {})).reduce((n: number, l: any) => n + l.length, 0),
      kast: kk ? { ja: kk.ja.length, nei: kk.nei.length, stemmere: data.spillere.filter((p: any) => p.id !== kk.fra).length, kanStemme: !!meg && meg.id !== kk.fra, mitt: meg ? (kk.ja.includes(meg.id) ? 'ja' : kk.nei.includes(meg.id) ? 'nei' : null) : null } : null,
      trukket: s.trukket || 0,
      skam: s.fase === 'skam' ? (s.skam || []).map((k: any) => ({ fra: k.fra, t: k.t, kommentar: k.kommentar, grunn: k.grunn })) : null };
  }
  if (s.type === 'opus') return { holder: s.holder, kast: s.kast, antall: s.antall, nr: s.nr, fra: s.fra || null };
  if (s.type === 'overunder') return { kort: s.kort, bunke: s.bunke, tur: ider[s.tur % ider.length], sist: s.sist, igjen: s.stokk.length, n: s.n || 0,
    over: s.stokk.filter((k: any) => k.v > s.kort.v).length, under: s.stokk.filter((k: any) => k.v < s.kort.v).length,
    drukket: s.drukket || {}, storst: s.storst || null, ferdig: !!s.ferdig, runde: s.runde || 1, ider };
  if (s.type === 'veddelopet') return { fase: s.fase, pos: s.pos, sist: s.sist, vinner: s.vinner, bane: s.bane.map((k: any, i: number) => (s.snudd[i] ? k : null)),
    veddemaal: s.veddemaal, mittVeddemaal: meg ? s.veddemaal[meg.id] || null : null, n: s.n || 0, runde: s.runde || 1, snudd: s.snudd || [] };
  if (s.type === 'pyramiden') return { pos: s.pos, pyr: s.pyr.slice(0, s.pos), minHand: meg ? s.hender[meg.id] || null : null,
    antall: Object.fromEntries(Object.entries(s.hender).map(([id, h]: any) => [id, h.length])), ider: Object.keys(s.hender),
    // Et kort som ligger med baksiden opp, ser bare den som la det – til noen roper løgn
    pastander: s.pastander.filter((p: any) => p.pos === s.pos - 1).map((p: any) => ({ id: p.id, rad: p.rad, avgjort: p.avgjort, av: p.av || null,
      kort: (p.avgjort === 'sant' || p.avgjort === 'bløff' || (meg && p.id === meg.id)) ? p.kort : null })),
    snuddVed: s.snuddVed || 0, vindu: PY_VINDU, avsl: s.avsl || null, ferdig: !!s.ferdig, lurt: s.lurt || {}, tatt: s.tatt || {},
    fasit: s.ferdig ? s.hender : null };
  if (s.type === 'dealer') {
    const k = s.stokk[s.pos] || null, apen = s.fase === 'res' || s.fase === 'ferdig';
    return { fase: s.fase, dealer: s.dealer, bom: s.bom || 0, pos: s.pos, igjen: s.stokk.length - s.pos - (s.fase === 'res' ? 1 : 0), g1: s.g1, hint: s.hint, res: s.res || null, bytt: s.bytt || null,
      // Kortet ser bare dealeren – til det er avgjort, da ser alle det
      kort: k && (apen || (meg && meg.id === s.dealer)) ? k : null, brukt: s.brukt || {}, drukket: s.drukket || {}, dealt: s.dealt || {}, ider, runde: s.runde || 1, n: s.n || 0 };
  }
  if (s.type === 'gris') return { fase: s.fase, minHand: meg ? s.hender[meg.id] || null : null, harValgt: Object.keys(s.valgt), mittValg: meg ? s.valgt[meg.id] ?? null : null,
    neser: s.neser, bokstaver: s.bokstaver, taper: s.taper || null, harFire: meg ? fireLike(s.hender[meg.id] || []) : false, ider: Object.keys(s.hender || {}),
    runde: s.runde || 1, byttNr: s.byttNr || 0, sendVed: s.sendVed || 0, neseVed: s.neseVed || 0, ferdigVed: s.ferdigVed || 0, gris: s.gris || null, tidlig: s.tidlig || null,
    vinduer: { bytt: GR_BYTT, nese: GR_NESE, pause: GR_PAUSE },
    fasit: s.fase === 'ferdig' || s.fase === 'slutt' ? Object.fromEntries(Object.entries(s.hender).map(([id, h]: any) => [id, h])) : null };
  if (s.type === 'president') return { fase: s.fase || 'spill', bord: s.bord, bordAv: s.bordAv, tur: ider[s.tur], pass: s.pass, ferdige: s.ferdige, titler: s.titler,
    minHand: meg ? s.hender[meg.id] || null : null, antall: Object.fromEntries(Object.entries(s.hender).map(([id, h]: any) => [id, h.length])), ider: Object.keys(s.hender),
    turVed: s.turVed || 0, turTid: PR_TUR, leggNr: s.leggNr || 0, feiNr: s.feiNr || 0, sist: s.sist || null, bytte: s.bytte || null, drikk: s.drikk || null, runde: s.runde || 1 };
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
const YZ_SOMLE = 60000, YZ_STRYK = 2;
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
/** Hvor mange spørsmål en runde har når verten ikke velger noe annet. */
const NR_LENGDE = 15;
/** Velg spørsmålene til runden: de dette rommet ikke har hatt ennå først, i ukas rekkefølge. */
function nrPlukk(data: any, n: number) {
  const s = data.spill, alle = s.alle || [], brukt = new Set(((data.nrBrukt || {})[s.rid] || []) as number[]);
  const ider = alle.map((_: any, i: number) => i);
  const valgt = ider.filter((i: number) => !brukt.has(i)).concat(ider.filter((i: number) => brukt.has(i))).slice(0, Math.max(1, Math.min(n, alle.length))).sort((a: number, b: number) => a - b);
  s.idx = valgt; s.sporsmal = valgt.map((i: number) => alle[i]); s.lengde = valgt.length;
}
function nrMerkBrukt(data: any) {
  const s = data.spill; data.nrBrukt = data.nrBrukt || {};
  const l = data.nrBrukt[s.rid] || (data.nrBrukt[s.rid] = []);
  const i = s.idx[s.i]; if (i != null && !l.includes(i)) l.push(i);
}
function nrNyttSpm(s: any) {
  const q = s.sporsmal[s.i];
  s.fase = 'spm'; s.svar = {}; s.resultat = {};
  s.alt = q.type === 'valg' ? stokk((q.alt || []).slice()) : q.type === 'sant' ? ['Sant', 'Tull'] : null;
  settFrist(s, q.type === 'tall' || q.type === 'fritt' ? FRIST.nrLang : FRIST.nrKort);
}
/* Resultat per spiller: 2 = nærmest på et tallspørsmål (del ut to), 1 = riktig (del ut én),
   0 = midt på treet (ingenting), -1 = feil, lengst unna eller ikke svart (drikk én). */
function nrAvslor(data: any) {
  const s = data.spill, q = s.sporsmal[s.i], st = s.stat || (s.stat = { naermest: {}, tall: 0, lurt: {}, tull: 0, ingen: [] });
  s.fase = 'svar'; s.resultat = {}; s.frist = null;
  const fasit = q.type === 'tall' ? lesTall(q.svar) : NaN;
  if (q.type === 'tall' && isFinite(fasit)) {
    // Nærmest vinner: den (eller de) nærmest deler ut to, innen 10 % deler ut én, lengst unna drikker
    st.tall++;
    const gj = data.spillere.map((p: any) => ({ id: p.id, d: Math.abs(lesTall(s.svar[p.id]) - fasit) })).filter((g: any) => isFinite(g.d));
    const best = gj.length ? Math.min(...gj.map((g: any) => g.d)) : Infinity;
    const verst = gj.length >= 3 ? Math.max(...gj.map((g: any) => g.d)) : Infinity;
    data.spillere.forEach((p: any) => {
      const g = gj.find((x: any) => x.id === p.id);
      const k = !g ? -1 : g.d === best ? 2 : g.d <= Math.abs(fasit) * 0.1 + 1e-9 ? 1 : g.d === verst ? -1 : 0;
      s.resultat[p.id] = k; nrBrukResultat(data, p.id, k, 1);
      if (k === 2) st.naermest[p.id] = (st.naermest[p.id] || 0) + 1;
    });
  } else {
    if (q.type === 'sant' && q.svar === 'Tull') st.tull++;
    data.spillere.forEach((p: any) => {
      const k = nrRiktig(q, s.svar[p.id]) ? 1 : -1; s.resultat[p.id] = k; nrBrukResultat(data, p.id, k, 1);
      if (q.type === 'sant' && q.svar === 'Tull' && s.svar[p.id] === 'Sant') st.lurt[p.id] = (st.lurt[p.id] || 0) + 1;
    });
  }
  const antall = Object.values(s.resultat).filter((k: any) => k > 0).length;
  if (!antall && data.spillere.length > 1) st.ingen.push({ q: q.q, svar: q.svar });
  melde(data, `Svaret er «${q.svar}» – ${antall} av ${data.spillere.length} hadde rett`, `The answer is “${q.svar}” – ${antall} of ${data.spillere.length} got it right`);
}
function nrBrukResultat(data: any, id: string, k: number, fortegn: 1 | -1) {
  const s = data.spill;
  if (k === 0) return;
  if (k > 0) {
    giUtdeling(data, id, k * fortegn); s.riktige[id] = Math.max(0, (s.riktige[id] || 0) + fortegn);
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
    data.spill = { type: 'yatzy', lek, navn: EKSTRA_NAVN.yatzy, ider: ider.slice(), tur: 0, terninger: [1, 2, 3, 4, 5], hold: [false, false, false, false, false], kast: 0, nr: 0, blokker, melding: '', ferdig: null, trekkVed: Date.now(), drikk: null, sistFelt: null, fNr: 0 };
    melde(data, 'Nytt spill: Drikke-Yatzy', 'New game: Drinking Yahtzee'); return { ok: true };
  }
  if (lek === 'nyhetsrunden') {
    const runder = publiserteRunder();
    const [rid, lengdeTekst] = String(modus || '').split(':');
    const r = runder.find((x: any) => rundeId(x) === rid) || runder[0];
    if (!r || !(r.sporsmal || []).length) return feilL('tom', 'Ingen runde er ute ennå.', 'No round is out yet.');
    data.spill = { type: 'nyhetsrunden', lek, navn: EKSTRA_NAVN.nyhetsrunden, modus: L('uke ' + r.uke, 'week ' + r.uke), uke: r.uke, rid: rundeId(r), alle: r.sporsmal, sporsmal: [], idx: [], lengde: 0,
      i: 0, riktige: {}, fase: 'klar', svar: {}, resultat: {}, alt: null, stat: { naermest: {}, tall: 0, lurt: {}, tull: 0, ingen: [] } };
    nrPlukk(data, Number(lengdeTekst) || NR_LENGDE);
    melde(data, `Nyhetsrunden uke ${r.uke} – ${data.spill.sporsmal.length} spørsmål`, `Nyhetsrunden week ${r.uke} – ${data.spill.sporsmal.length} questions (in Norwegian)`); return { ok: true };
  }
  return { feil: 'ukjent-lek' };
}

function nyeHandling(data: any, meg: any, h: any): any {
  const s = data.spill, erVert = meg.id === data.vert;
  if (s.type === 'bussruta') {
    const aktiv = s.ider[s.tur];
    if (h.handling === 'br-svar') {
      if (s.fase !== 1) return { ok: true };
      if (meg.id !== aktiv && !erVert) return feilL('ikke-din-tur', 'Det er ikke din tur.', "It's not your turn.");
      const v = String(h.v || ''), k = brTrekk(s), hand = s.hender[aktiv];
      let ok = false;
      if (s.steg === 0) ok = (v === 'rod') === (k.f === '♥' || k.f === '♦');
      if (s.steg === 1) ok = v === 'over' ? k.v > hand[0].v : k.v < hand[0].v;
      if (s.steg === 2) { const lo = Math.min(hand[0].v, hand[1].v), hi = Math.max(hand[0].v, hand[1].v); ok = v === 'inn' ? (k.v > lo && k.v < hi) : (k.v < lo || k.v > hi); }
      if (s.steg === 3) ok = k.f === v;
      const n = s.steg + 1; hand.push(k); s.sist = k;
      s.n = (s.n || 0) + 1; s.sistSvar = { id: aktiv, ok, n, nr: s.n };
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
      // Pyramiden snus av seg selv, ett kort hvert tredje sekund – den telefonen som er våken driver den
      if (Date.now() - (s.sistSnu || 0) < 2200) return { ok: true };
      if (typeof h.pos === 'number' && h.pos !== s.pyrPos) return { ok: true };
      s.sistSnu = Date.now();
      const k = s.pyr[s.pyrPos], n = brRad(s.pyrPos), treff: string[] = [];
      const treffIder: string[] = [];
      s.ider.forEach((id: string) => { const hand = s.hender[id], i = hand.findIndex((x: any) => x.v === k.v); if (i !== -1) { hand.splice(i, 1); treff.push(navnPaa(data, id)); treffIder.push(id); giUtdeling(data, id, n); } });
      s.treff = { pos: s.pyrPos, ider: treffIder, n };
      s.pyrPos++;
      s.melding = L(`${vnavn(k.v)}${k.f} (rad ${n}) – ${treff.length ? treff.join(', ') + ' legger på og deler ut ' + n + '.' : 'ingen har den.'}`,
        `${vnavnEn(k.v)}${k.f} (row ${n}) – ${treff.length ? treff.join(', ') + ' ' + (treff.length === 1 ? 'plays it and gives' : 'play it and give') + ' out ' + n + '.' : 'nobody has it.'}`);
      return { ok: true };
    }
    if (h.handling === 'br-buss') {
      if (s.fase !== 2 || s.pyrPos < 15) return { ok: true };
      if (Date.now() - (s.sistSnu || 0) < 2200) return { ok: true };
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
      const k = brTrekk(s); s.sist = k; s.n = (s.n || 0) + 1;
      const straff = ({ 11: 1, 12: 2, 13: 3, 14: 4 } as any)[k.v];
      s.bussSist = { k, straff: straff || 0, nr: s.n };
      if (straff) { giSlurker(data, s.buss, straff); s.bussRekke = 0; s.melding = L(`${vnavn(k.v)}${k.f} – ${navnPaa(data, s.buss)} drikker ${straff} og starter på nytt.`, `${vnavnEn(k.v)}${k.f} – ${navnPaa(data, s.buss)} drinks ${straff} and starts over.`); }
      else { s.bussRekke++; s.melding = L(`${vnavn(k.v)}${k.f} – trygt! ${s.bussRekke >= s.maal ? navnPaa(data, s.buss) + ' er i mål. Bussen er fri!' : (s.maal - s.bussRekke) + ' igjen.'}`,
        `${vnavnEn(k.v)}${k.f} – safe! ${s.bussRekke >= s.maal ? navnPaa(data, s.buss) + ' made it. The bus is free!' : (s.maal - s.bussRekke) + ' to go.'}`); if (s.bussRekke >= s.maal) { s.ferdig = true; melde(data, 'Bussen er i mål!', 'The bus made it!'); } }
      return { ok: true };
    }
    if (h.handling === 'nytt' || h.handling === 'runde') { if (!erVert) return { feil: 'bare-vert' }; return startNye(data, 'bussruta', '', aktiveIder(data, true)); }
    return null;
  }
  if (s.type === 'yatzy') {
    const aktiv = s.ider[s.tur], kanStyre = meg.id === aktiv || erVert;
    if (h.handling === 'yz-kast') {
      if (s.ferdig) return { ok: true };
      if (!kanStyre) return feilL('ikke-din-tur', 'Det er ikke din tur.', "It's not your turn.");
      if (s.kast >= 3) return { ok: true };
      // Bare terningene som faktisk ble kastet nå, teller. Holdte enere eller fire like som allerede lå der, gir ikke slurker på nytt.
      const kastet = s.terninger.map((_: number, i: number) => !(s.hold[i] && s.kast));
      s.terninger = s.terninger.map((t: number, i: number) => (kastet[i] ? 1 + tilfeldig(6) : t));
      s.kast++; s.nr++;
      const c = yzTell(s.terninger), deler: string[] = [], delerEn: string[] = [];
      const nyEner = s.terninger.some((t: number, i: number) => kastet[i] && t === 1);
      const nyttAv = (v: number) => s.terninger.some((t: number, i: number) => kastet[i] && t === v);
      const yatzy = c.some((x, v) => x === 5 && nyttAv(v)), fireLike = c.some((x, v) => x >= 4 && nyttAv(v));
      s.drikk = { ener: nyEner, fire: 0, yatzy, nr: s.nr };
      if (nyEner) { giSlurker(data, aktiv, 2); deler.push('Ener i kastet – drikk 2.'); delerEn.push('A one in the roll – drink 2.'); }
      if (yatzy) { giUtdeling(data, aktiv, 5); deler.push('YATZY! Del ut 5 – eller en shot.'); delerEn.push('YAHTZEE! Give out 5 – or a shot.'); }
      else if (fireLike) {
        // Fire like: drikk tallet på terningen (fire seksere = 6), ikke summen – et godt kast skal ikke være en felle
        const tall = c.findIndex((x, v) => x >= 4 && nyttAv(v));
        giSlurker(data, aktiv, tall); s.drikk.fire = tall; deler.push('Fire like – drikk ' + tall + ' slurker.'); delerEn.push('Four of a kind – drink ' + tall + ' sips.');
      }
      s.melding = L(deler.join(' ') || (s.kast < 3 ? 'Hold og trill igjen, eller velg et felt.' : 'Velg et felt.'),
        delerEn.join(' ') || (s.kast < 3 ? 'Hold and roll again, or pick a box.' : 'Pick a box.'));
      return { ok: true };
    }
    if (h.handling === 'yz-hold') {
      if (!kanStyre || !s.kast || s.kast >= 3) return { ok: true };
      const i = Number(h.i); if (i >= 0 && i < 5) s.hold[i] = !s.hold[i];
      return { ok: true };
    }
    // Verten kan stryke et felt for den som somler (etter ett minutt uten trekk)
    const stryk = h.handling === 'yz-stryk' && erVert && !s.ferdig && Date.now() - (s.trekkVed || 0) >= YZ_SOMLE;
    if (h.handling === 'yz-felt' || stryk) {
      if (!stryk && (!kanStyre || !s.kast || s.ferdig)) return { ok: true };
      const b = s.blokker[aktiv], f = stryk ? YZ_FELT.find((x) => b[x] == null) || '' : String(h.f || '');
      if (!YZ_FELT.includes(f) || b[f] != null) return { ok: true };
      b[f] = stryk ? 0 : yzPoeng(f, s.terninger);
      // Stryk (0 poeng i feltet) gir slurker
      const drakk = b[f] === 0 ? YZ_STRYK : 0; if (drakk) giSlurker(data, aktiv, drakk);
      s.fNr = (s.fNr || 0) + 1; s.sistFelt = { id: aktiv, f, nr: s.fNr, stroket: stryk, drakk }; s.trekkVed = Date.now(); s.drikk = null;
      s.tur = (s.tur + 1) % s.ider.length; s.kast = 0; s.hold = [false, false, false, false, false]; s.melding = '';
      if (s.ider.every((id: string) => YZ_FELT.every((x) => s.blokker[id][x] != null))) {
        const liste = s.ider.map((id: string) => ({ id, navn: navnPaa(data, id), sum: yzSum(s.blokker[id]) })).sort((a: any, c: any) => c.sum - a.sum);
        s.ferdig = liste;
        giUtdeling(data, liste[0].id, 5); giSlurker(data, liste[liste.length - 1].id, 5);
        melde(data, `${liste[0].navn} vant Yatzy! ${liste[liste.length - 1].navn} drikker opp.`, `${liste[0].navn} won Yahtzee! ${liste[liste.length - 1].navn} finishes their drink.`);
      }
      return { ok: true };
    }
    if (h.handling === 'nytt' || h.handling === 'runde') { if (!erVert) return { feil: 'bare-vert' }; return startNye(data, 'yatzy', '', aktiveIder(data, true)); }
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
      // Alle har svart: svaret vises etter et lite pust
      if (data.spillere.every((p: any) => s.svar[p.id] != null)) { const kort = Date.now() + 2000 + 1500; if (!s.frist || s.frist > kort) s.frist = kort; }
      return { ok: true };
    }
    if (h.handling === 'tid-ute') {
      if (s.fase === 'spm' && fristUte(s)) nrAvslor(data);
      return { ok: true };
    }
    if (!erVert && ['nr-start', 'nr-vis', 'nr-flipp', 'nr-neste', 'nr-lengde', 'nytt'].includes(h.handling)) return feilL('bare-vert', 'Verten styrer runden.', 'The host runs the round.');
    if (h.handling === 'nr-lengde') { if (s.fase === 'klar') nrPlukk(data, Math.max(1, Math.min(60, Number(h.antall) || NR_LENGDE))); return { ok: true }; }
    if (h.handling === 'nr-start') { if (s.fase === 'klar') { nrNyttSpm(s); nrMerkBrukt(data); melde(data, 'Første spørsmål!', 'First question!'); } return { ok: true }; }
    if (h.handling === 'nr-vis') {
      if (s.fase !== 'spm') return { ok: true };
      const mangler = data.spillere.filter((p: any) => s.svar[p.id] == null).length;
      if (mangler > 0 && !fristUte(s)) return venter(s, mangler);
      nrAvslor(data); return { ok: true };
    }
    if (h.handling === 'nr-flipp') {
      if (s.fase !== 'svar') return { ok: true };
      const id = String(h.hvem || ''); if (!(id in s.resultat)) return { ok: true };
      nrBrukResultat(data, id, s.resultat[id], -1); s.resultat[id] = s.resultat[id] > 0 ? -1 : 1; nrBrukResultat(data, id, s.resultat[id], 1);
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
      s.i++; nrNyttSpm(s); nrMerkBrukt(data); return { ok: true };
    }
    if (h.handling === 'nytt') { const r = publiserteRunder()[0]; return startNye(data, 'nyhetsrunden', (s.rid || (r ? rundeId(r) : '')) + ':' + (Number(h.antall) || s.lengde || NR_LENGDE), []); }
    return null;
  }
  return null;
}

function nyeVisning(s: any, meg: any, data: any) {
  if (s.type === 'bussruta') return { fase: s.fase, aktiv: s.ider[s.tur] || null, steg: s.steg, sporsmal: s.fase === 1 ? BR_SPM[s.steg] : null,
    hender: s.hender, ider: s.ider, sist: s.sist, melding: s.melding, pyr: s.pyr.slice(0, s.pyrPos), pyrPos: s.pyrPos, buss: s.buss, bussRekke: s.bussRekke, maal: s.maal,
    n: s.n || 0, sistSvar: s.sistSvar || null, treff: s.treff || null, bussSist: s.bussSist || null, ferdig: !!s.ferdig };
  if (s.type === 'yatzy') return { aktiv: s.ider[s.tur], ider: s.ider, terninger: s.terninger, hold: s.hold, kast: s.kast, nr: s.nr, melding: s.melding, ferdig: s.ferdig,
    blokker: s.blokker, summer: Object.fromEntries(s.ider.map((id: string) => [id, yzSum(s.blokker[id])])),
    mulige: s.kast ? Object.fromEntries(YZ_FELT.map((f) => [f, yzPoeng(f, s.terninger)])) : null,
    trekkVed: s.trekkVed || 0, somle: YZ_SOMLE, drikk: s.drikk || null, sistFelt: s.sistFelt || null };
  if (s.type === 'nyhetsrunden') {
    const q = s.sporsmal[s.i] || s.sporsmal[s.sporsmal.length - 1], aapen = s.fase === 'svar' || s.fase === 'ferdig';
    const liste = data.spillere.map((p: any) => ({ id: p.id, navn: p.navn, riktige: s.riktige[p.id] || 0 })).sort((a: any, b: any) => b.riktige - a.riktige);
    const st = s.stat || {}, fasitTall = q && q.type === 'tall' ? lesTall(q.svar) : NaN;
    const topp = (o: any) => { let id: any = null, n = 0; Object.keys(o || {}).forEach((k) => { if (o[k] > n) { n = o[k]; id = k; } }); return id ? { id, n } : null; };
    return {
      fase: s.fase, i: s.i, antall: s.sporsmal.length, uke: s.uke, rid: s.rid || null, qtype: q ? q.type : null, alt: s.alt, vert: data.vert,
      lengde: s.lengde || s.sporsmal.length, totalt: (s.alle || s.sporsmal).length,
      // Spørsmålet står på alle telefonene (og TV-en). Verten leser det fortsatt høyt.
      q: s.fase === 'spm' || aapen ? q.q : null,
      tall: aapen && q && q.type === 'tall' && isFinite(fasitTall) ? { fasit: fasitTall, gjett: data.spillere.map((p: any) => ({ id: p.id, v: lesTall(s.svar[p.id]) })).filter((g: any) => isFinite(g.v)) } : null,
      kaaringer: s.fase === 'ferdig' ? { tall: topp(st.naermest), tallAntall: st.tall || 0, lurt: topp(st.lurt), tullAntall: st.tull || 0, ingen: (st.ingen || [])[0] || null } : null,
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
  if (s.type === 'hvemskrev') { s.fase = 'skriv'; s.oppgave = trekkFra(s, 'oppg', sosListe('hvemskrev')); s.svar = {}; s.ko = []; s.i = 0; s.stemmer = {}; s.logg = []; settFrist(s, SFRIST.skriv); }
  if (s.type === 'bloff') { const q = trekkFra(s, 'q', sosListe('bloff')); s.fase = 'skriv'; s.q = q.q; s.sant = q.a; s.fakta = q.fakta || null; s.falske = {}; s.valg = []; s.stemmer = {}; s.nr = s.nr || 0; s.lurt = s.lurt || {}; settFrist(s, SFRIST.bloffSkriv); }
  if (s.type === 'samme') { s.fase = 'skriv'; s.oppgave = trekkFra(s, 'oppg', sosListe('samme')); s.svar = {}; s.grupper = null; settFrist(s, SFRIST.samme); }
  if (s.type === 'spion') {
    // Ingen klokke: den som har tur, spør noen – og så har den personen tur. Verten snur kortene.
    s.fase = 'ring'; s.sted = trekkFra(s, 'sted', sosListe('steder')); s.spion = ider[tilfeldig(ider.length)];
    // Muldvarpen gjetter blant 24 steder (det riktige er alltid med), så lista holder seg kort selv om det finnes mange flere
    const andre = sosListe('steder').filter((x: any) => x.no !== s.sted.no); s.utvalg = stokk([s.sted, ...stokk(andre).slice(0, 23)]);
    s.tur = ider[tilfeldig(ider.length)]; s.spor = []; s.snudd = {}; s.pekt = null; s.merket = []; s.stedRett = false; s.utfall = null; s.stemmer = {};
  }
  if (s.type === 'pannekort') {
    const rekke = stokk(ider); s.tildelt = {}; rekke.forEach((id: string, i: number) => { s.tildelt[id] = rekke[(i + 1) % rekke.length]; });
    s.fase = 'skriv'; s.ord = {}; s.gjettet = []; settFrist(s, SFRIST.pannekort);
  }
  if (s.type === 'skal') { s.nr = 0; s.sum = {}; skalNy(s, 4000); }
}
function hsFasit(data: any) {
  const s = data.spill, forfatter = s.ko[s.i];
  const riktige = Object.keys(s.stemmer).filter((id) => s.stemmer[id] === forfatter);
  Object.keys(s.stemmer).forEach((id) => { if (s.stemmer[id] !== forfatter) giSlurker(data, id, 1); });
  if (!riktige.length && Object.keys(s.stemmer).length) giUtdeling(data, forfatter, 2);
  (s.logg = s.logg || []).push({ av: forfatter, t: s.svar[forfatter], lurte: Object.keys(s.stemmer).length - riktige.length });
  s.fase = 'fasit'; s.frist = null;
}
/** Alle har svart eller stemt: klokka kortes ned til 2 s, så avsløringen blir et øyeblikk (og man rekker å angre). */
function sosPust(s: any) { const kort = Date.now() + 2000 + 1500; if (!s.frist || s.frist > kort) s.frist = kort; }
function hsStartGjett(data: any) {
  const s = data.spill; s.ko = stokk(Object.keys(s.svar)); s.i = 0; s.fase = 'gjett'; s.stemmer = {}; settFrist(s, SFRIST.stem);
}
function bfStartStem(data: any) {
  const s = data.spill, grupper: any = {};
  Object.entries(s.falske).forEach(([id, t]: any) => { const k = norm(t); (grupper[k] = grupper[k] || { t, av: [] }).av.push(id); });
  s.valg = stokk([{ t: s.sant, av: ['sant'] }, ...Object.values(grupper)]);
  s.fase = 'stem'; s.stemmer = {}; settFrist(s, SFRIST.stem);
}
const BF_ANTALL = 5;
function bfFasit(data: any) {
  const s = data.spill; s.lurt = s.lurt || {};
  Object.entries(s.stemmer).forEach(([id, i]: any) => {
    const v = s.valg[i];
    if (v.av[0] === 'sant') giUtdeling(data, id, 1);
    else { giSlurker(data, id, 1); v.av.forEach((a: string) => { giUtdeling(data, a, 1); s.lurt[a] = (s.lurt[a] || 0) + 1; }); }
  });
  // Ikke valgt = tap: drikk 1
  data.spillere.forEach((p: any) => { if (s.stemmer[p.id] === undefined) giSlurker(data, p.id, 1); });
  s.fase = 'fasit'; s.frist = Date.now() + 9000;   // tid til å lese fasiten, så neste oppslag
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
const SKAL_ANTALL = 5;
/** Neste skål: SKÅL kommer etter en tilfeldig pause (ingen nedtelling). */
function skalNy(s: any, minst = 2500) {
  s.fase = 'vent'; s.tid = Date.now() + minst + tilfeldig(5000); s.trykk = {}; s.tidlig = []; s.resultat = null; s.frist = s.tid + 6000;
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
  // Samlet tid for sprinten: for tidlig eller ikke trykket teller som ett sekund
  s.sum = s.sum || {};
  data.spillere.forEach((p: any) => { s.sum[p.id] = (s.sum[p.id] || 0) + (s.trykk[p.id] != null ? s.trykk[p.id] : 1000); });
  // Ingen «ny runde»-knapp: neste skål kommer av seg selv (telefonene sier fra når pausen er over)
  s.fase = 'fasit'; s.frist = Date.now() + 4000;
}

function sosHandling(data: any, meg: any, h: any): any {
  const s = data.spill, erVert = meg.id === data.vert, hd = h.handling;
  if (s.type === 'bloff' && (hd === 'nytt' || hd === 'runde')) {
    // Spill igjen etter fem oppslag: bare verten (teller i kvelden)
    if (!erVert) return feilL('bare-vert', 'Verten bestemmer hva som skjer nå.', 'The host decides what happens next.');
    if (s.fase !== 'ferdig') return { ok: true };
    s.runde++; s.nr = 0; s.lurt = {}; sosNyRunde(data); return { ok: true };
  }
  if (s.type === 'skal' && (hd === 'nytt' || hd === 'runde')) {
    // Spill igjen etter sprinten: bare verten (teller i kvelden)
    if (!erVert) return feilL('bare-vert', 'Verten bestemmer hva som skjer nå.', 'The host decides what happens next.');
    if (s.fase !== 'ferdig') return { ok: true };
    s.runde++; sosNyRunde(data); return { ok: true };
  }
  // Hvem skrev: ett spørsmål der alle sine svar avsløres – så er leken ferdig. Saueflokken: én runde per spiller.
  if ((s.type === 'hvemskrev' || s.type === 'samme') && (hd === 'nytt' || hd === 'runde')) {
    const ferdig = s.type === 'hvemskrev' ? s.fase === 'ferdig' : s.fase === 'slutt';
    if (ferdig) {
      if (!erVert) return feilL('bare-vert', 'Verten bestemmer hva som skjer nå.', 'The host decides what happens next.');
      s.runde++; s.nr = 0; s.poeng = {}; sosNyRunde(data); return { ok: true };
    }
    if (s.type === 'samme') {
      if (!erVert && s.fase !== 'fasit') return { feil: 'bare-vert' };
      s.nr = (s.nr || 0) + 1;
      if (s.nr >= Math.max(2, data.spillere.length)) { s.fase = 'slutt'; s.frist = null; return { ok: true }; }
      s.runde++; sosNyRunde(data); return { ok: true };
    }
    if (!erVert) return { feil: 'bare-vert' };
    s.runde++; sosNyRunde(data); return { ok: true };
  }
  if (hd === 'nytt' || hd === 'runde') {
    if (!erVert && s.fase !== 'fasit' && s.fase !== 'ferdig') return { feil: 'bare-vert' };
    s.runde++; sosNyRunde(data); return { ok: true };
  }
  if (s.type === 'hvemskrev') {
    if (hd === 'hs-skriv') {
      if (s.fase !== 'skriv') return feilL('for-sent', 'Skrivetiden er ute.', 'Writing time is up.');
      const t = rens(h.tekst, 160); if (!t) return { ok: true };
      s.svar[meg.id] = t;
      if (alleHar(data, s.svar)) sosPust(s);   // alle har svart: et lite pust, så starter gjettingen
      return { ok: true };
    }
    if (hd === 'hs-stem') {
      if (s.fase !== 'gjett' || s.ko[s.i] === meg.id) return { ok: true };
      if (!data.spillere.some((p: any) => p.id === h.hvem) || h.hvem === meg.id) return { feil: 'ukjent' };
      s.stemmer[meg.id] = h.hvem;
      if (alleHar(data, s.stemmer, [s.ko[s.i]])) sosPust(s);
      return { ok: true };
    }
    if (hd === 'hs-neste') {
      if (s.fase !== 'fasit') return { ok: true };
      if (typeof h.i === 'number' && h.i !== s.i) return { ok: true };   // noen andre trykket samtidig
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
      if (alleHar(data, s.falske)) sosPust(s);   // alle har skrevet: et lite pust, så kommer oppslaget
      return { ok: true };
    }
    if (hd === 'bf-stem') {
      if (s.fase !== 'stem') return { ok: true };
      const i = Number(h.i); const v = s.valg[i]; if (!v) return { feil: 'ukjent' };
      if (v.av.includes(meg.id)) return feilL('egen', 'Du kan ikke stemme på din egen løgn.', "You can't vote for your own lie.");
      s.stemmer[meg.id] = i;
      if (alleHar(data, s.stemmer)) sosPust(s);   // alle har valgt: 2 sek (kan bytte), så fasit
      return { ok: true };
    }
    if (hd === 'tid-ute' && fristUte(s)) {
      if (s.fase === 'skriv') { if (Object.keys(s.falske).length >= 1) bfStartStem(data); else settFrist(s, 30); }
      else if (s.fase === 'stem') bfFasit(data);
      else if (s.fase === 'fasit') {
        // Ingen «neste»-knapp: neste oppslag kommer av seg selv etter fasiten
        s.nr = (s.nr || 0) + 1;
        if (s.nr >= BF_ANTALL) { s.fase = 'ferdig'; s.frist = null; }
        else sosNyRunde(data);
      }
    }
    return { ok: true };
  }
  if (s.type === 'samme') {
    if (hd === 'sm-skriv') {
      if (s.fase !== 'skriv') return feilL('for-sent', 'Tiden er ute.', "Time's up.");
      const t = rens(h.tekst, 40); if (!t) return { ok: true };
      s.svar[meg.id] = t; if (alleHar(data, s.svar)) sosPust(s); return { ok: true };
    }
    if (hd === 'sm-slaa') {
      // Verten slår sammen to svar som egentlig er like («pepperoni» og «peperoni»)
      if (s.fase !== 'fasit' || !s.grupper) return { ok: true };
      if (!erVert) return feilL('bare-vert', 'Verten slår sammen svar.', 'The host merges answers.');
      const fra = s.grupper[Number(h.fra)], til = s.grupper[Number(h.til)];
      if (!fra || !til || fra === til) return { ok: true };
      // De som stod alene og nå er i en flokk, slipper slurken likevel
      [fra, til].forEach((g: any) => { if (g.ider.length === 1) giSlurker(data, g.ider[0], -1); });
      til.ider.push(...fra.ider);
      s.grupper = s.grupper.filter((g: any) => g !== fra).sort((a: any, b: any) => b.ider.length - a.ider.length);
      s.slaatt = (s.slaatt || 0) + 1;
      return { ok: true };
    }
    if (hd === 'tid-ute' && fristUte(s) && s.fase === 'skriv') smFasit(data);
    return { ok: true };
  }
  if (s.type === 'spion') {
    const finnes = (id: any) => data.spillere.some((p: any) => p.id === id);
    if (hd === 'sp-spor') {
      // Den som har tur, trykker på den hen spør – da går turen videre
      if (s.fase !== 'ring' || meg.id !== s.tur) return { ok: true };
      const til = String(h.til || ''); if (!finnes(til) || til === meg.id) return { feil: 'ukjent' };
      s.spor = (s.spor || []).concat([[meg.id, til]]).slice(-8); s.tur = til; return { ok: true };
    }
    if (['sp-pek', 'sp-avbryt', 'sp-snu', 'sp-merk', 'sp-sted', 'sp-videre', 'sp-ferdig'].includes(hd) && !erVert) return feilL('bare-vert', 'Verten snur kortene.', 'The host flips the cards.');
    if (hd === 'sp-pek') { if (s.fase === 'ring') { s.fase = 'peke'; s.merket = []; } return { ok: true }; }
    if (hd === 'sp-avbryt') { if (s.fase === 'peke') s.fase = 'ring'; return { ok: true }; }
    if (hd === 'sp-snu') {
      if (s.fase !== 'peke') return { ok: true };
      const hvem = String(h.hvem || ''); if (!finnes(hvem) || s.snudd[hvem]) return { ok: true };
      s.snudd[hvem] = true; s.pekt = hvem; s.merket = [];
      s.fase = hvem === s.spion ? 'riktige' : 'feil';
      melde(data, hvem === s.spion ? `${navnPaa(data, hvem)} er muldvarpen!` : `${navnPaa(data, hvem)} var uskyldig!`, hvem === s.spion ? `${navnPaa(data, hvem)} is the mole!` : `${navnPaa(data, hvem)} was innocent!`);
      return { ok: true };
    }
    if (hd === 'sp-merk') {
      // Verten haker av: hvem pekte feil (feil) eller hvem gjettet riktig (riktige)
      if (s.fase !== 'feil' && s.fase !== 'riktige') return { ok: true };
      const hvem = String(h.hvem || ''); if (!finnes(hvem) || hvem === s.pekt) return { ok: true };
      s.merket = s.merket.includes(hvem) ? s.merket.filter((x: string) => x !== hvem) : s.merket.concat([hvem]); return { ok: true };
    }
    if (hd === 'sp-sted') { if (s.fase === 'riktige') s.stedRett = !s.stedRett; return { ok: true }; }
    if (hd === 'sp-videre') {
      // Uskyldig: de som pekte feil drikker 2, og ringen fortsetter
      if (s.fase !== 'feil') return { ok: true };
      s.merket.forEach((id: string) => giSlurker(data, id, 2)); s.merket = []; s.fase = 'ring'; return { ok: true };
    }
    if (hd === 'sp-ferdig') {
      if (s.fase !== 'riktige') return { ok: true };
      if (s.stedRett) spSlutt(data, 'spion-gjettet');
      else { s.fase = 'fasit'; s.utfall = 'fanget'; giSlurker(data, s.spion, 3); s.merket.forEach((id: string) => giUtdeling(data, id, 1));
        melde(data, `Muldvarpen ${navnPaa(data, s.spion)} ble tatt!`, `The mole, ${navnPaa(data, s.spion)}, got caught!`); }
      return { ok: true };
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
      s.gjettet.push(hvem); s.gjettTid = { ...(s.gjettTid || {}), [hvem]: Date.now() };
      if (s.gjettet.length === 1) giUtdeling(data, hvem, 2);
      melde(data, `${navnPaa(data, hvem)} gjettet «${tr(s.ord[hvem].t, 'no')}»!`, `${navnPaa(data, hvem)} guessed “${tr(s.ord[hvem].t, 'en')}”!`);
      const igjen = Object.keys(s.ord).filter((id) => !s.gjettet.includes(id) && data.spillere.some((p: any) => p.id === id));
      if (igjen.length <= 1) { s.fase = 'ferdig'; if (igjen[0]) { giSlurker(data, igjen[0], 3); s.sist = igjen[0]; } }
      return { ok: true };
    }
    if (hd === 'pk-angre') {
      // Feiltrykk: «Gjettet!» kan angres i noen sekunder (så lenge runden ikke er over)
      const hvem = String(h.hvem || '');
      if (s.fase !== 'spill' || !s.gjettet.includes(hvem) || Date.now() - ((s.gjettTid || {})[hvem] || 0) > 6000) return { ok: true };
      const varForst = s.gjettet[0] === hvem;
      if (varForst) giUtdeling(data, hvem, -2);
      s.gjettet = s.gjettet.filter((x: string) => x !== hvem);
      if (varForst && s.gjettet[0]) giUtdeling(data, s.gjettet[0], 2);   // nestemann blir først ut
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
    if (hd === 'sk-start') return { ok: true };   // gamle klienter: sprinten går av seg selv nå
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
    else if (hd === 'tid-ute' && s.fase === 'fasit' && fristUte(s)) {
      s.nr = (s.nr || 0) + 1;
      if (s.nr >= SKAL_ANTALL) { s.fase = 'ferdig'; s.frist = null; }
      else skalNy(s);
    }
    return { ok: true };
  }
  return null;
}

/** Hvem er jeg? på TV-en: bare lappene som er gjettet (ellers ser du din egen), alle til slutt. */
function pkOffentlig(s: any) {
  const ord: any = {}; Object.entries(s.ord || {}).forEach(([id, o]: any) => { if (s.fase === 'ferdig' || (s.gjettet || []).includes(id)) ord[id] = { t: o.t }; });
  return { fase: s.fase, harSkrevet: Object.keys(s.tildelt || {}).filter((fra) => (s.ord || {})[s.tildelt[fra]]), gjettet: s.gjettet || [], ord, sist: s.sist || null, med: Object.keys(s.tildelt || {}) };
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
    runde: s.runde || 1, logg: s.fase === 'ferdig' ? s.logg || [] : null,
  };
  if (s.type === 'bloff') return {
    fase: s.fase, q: s.q, harSkrevet: Object.keys(s.falske), mittSvar: m ? s.falske[m] || null : null,
    valg: s.fase === 'skriv' ? null : s.valg.map((v: any) => ({ t: v.t, min: v.av.includes(m), av: s.fase === 'fasit' ? v.av : null })),
    harStemt: Object.keys(s.stemmer), minStemme: m ? s.stemmer[m] ?? null : null, stemmer: s.fase === 'fasit' ? s.stemmer : null,
    sant: s.fase === 'fasit' ? s.sant : null, fakta: s.fase === 'fasit' ? s.fakta || null : null,
    nr: s.nr || 0, antall: BF_ANTALL, runde: s.runde || 1,
    lurt: Object.entries(s.lurt || {}).map(([id, n]: any) => ({ id, n })).sort((a: any, b: any) => b.n - a.n),
  };
  if (s.type === 'samme') return { fase: s.fase, oppgave: s.oppgave, harSkrevet: Object.keys(s.svar), mittSvar: m ? s.svar[m] || null : null, grupper: s.fase === 'fasit' ? s.grupper : null, runde: s.runde || 1, slaatt: s.slaatt || 0, nr: s.nr || 0, antall: Math.max(2, data.spillere.length) };
  if (s.type === 'spion') {
    const aapen = s.fase === 'fasit', kort: any = {};
    Object.keys(s.snudd || {}).forEach((id) => { kort[id] = id === s.spion ? 'muldvarp' : 'uskyldig'; });
    if (aapen) data.spillere.forEach((p: any) => { kort[p.id] = p.id === s.spion ? 'muldvarp' : 'uskyldig'; });
    return { fase: s.fase, erSpion: !!m && m === s.spion, sted: (m && m !== s.spion) || aapen ? s.sted : null, steder: s.utvalg || sosListe('steder'),
      tur: s.tur || null, spor: s.spor || [], kort, pekt: s.pekt || null, merket: s.merket || [], stedRett: !!s.stedRett,
      spion: aapen || s.fase === 'riktige' ? s.spion : null, utfall: s.utfall || null, runde: s.runde || 1 };
  }
  if (s.type === 'pannekort') {
    const ord: any = {}; Object.entries(s.ord).forEach(([id, o]: any) => { if (id !== m || s.fase === 'ferdig' || (s.gjettet || []).includes(id)) ord[id] = { t: o.t, fra: o.fra }; });
    return { fase: s.fase, mitMaal: m ? s.tildelt[m] || null : null, harSkrevet: Object.keys(s.tildelt).filter((fra) => s.ord[s.tildelt[fra]]),
      ord, gjettet: s.gjettet, sist: s.sist || null, mittOrdSkjult: !!(m && s.ord[m] && s.fase !== 'ferdig'), runde: s.runde || 1, med: Object.keys(s.tildelt || {}) };
  }
  if (s.type === 'skal') return { fase: s.fase, tid: s.tid, harTrykket: Object.keys(s.trykk || {}).concat(s.tidlig || []), resultat: s.resultat,
    trykk: s.trykk || {}, tidlig: s.tidlig || [], nr: s.nr || 0, antall: SKAL_ANTALL, sum: s.sum || {}, runde: s.runde || 1 };
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
