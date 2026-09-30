/**
 * Gjengens lov (lovboka) – belønningen for kveldens vinner.
 *
 * Hver gjengkveld gir kveldspoeng i lekene dere spiller. Den med flest poeng når kvelden avsluttes,
 * er kveldens vinner og kan enten innføre en ny regel eller oppheve en som gjelder.
 * En regel gjelder til en senere vinner opphever den, eller til et flertall av medlemmene stemmer den bort.
 *
 * Lovboka lagres som jsonb i gjenger.lov. Konto-id-er lagres for å vite hvem som har stemt,
 * men sendes aldri til nettleseren (visBok fjerner dem).
 * Gamle lovbøker fra det tidligere spillet «Gjengens lov» leses inn automatisk: lover som gjaldt, gjelder fortsatt.
 */
type Lang = 'no' | 'en';

export const MAKS_REGEL = 140;
const rens = (x: any, n = MAKS_REGEL) => String(x == null ? '' : x).replace(/[\u0000-\u001f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, n);
const nokkel = (konto: string | null | undefined, navn: string) => (konto ? 'k:' + konto : 'n:' + String(navn || '').trim().toLowerCase());
const nyId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export function tomBok() {
  return { v: 2, kvelder: 0, regler: [] as any[], logg: [] as any[], seire: {} as any, borskonge: {} as any, brukt: [] as string[], ventende: null as any,
    lommebok: { sesong: new Date().getFullYear(), k: {} as any }, utsatte: [] as any[], aarskonger: [] as any[] };
}

/* =====================================================================
   Gjengens lommebok: formuen i Vorsbørsen følger med fra kveld til kveld (per konto).
   Nullstilles 1. januar – da kåres Årets Børskonge. Gjester uten konto har bare kontanter for kvelden.
   ===================================================================== */
export const START_FORMUE = 1000, LONN = 200, FRIST_UTSATT = 48 * 3600 * 1000;
function lommebok(b: any) {
  const aar = new Date().getFullYear();
  if (!b.lommebok || typeof b.lommebok !== 'object') b.lommebok = { sesong: aar, k: {} };
  if (!b.lommebok.k || typeof b.lommebok.k !== 'object') b.lommebok.k = {};
  if (b.lommebok.sesong !== aar) {
    // Ny sesong: årets Børskonge havner i historien, og alle starter likt igjen (navnene beholdes)
    const topp = Object.values(b.lommebok.k).filter((x: any) => x && x.saldo != null).sort((x: any, y: any) => y.saldo - x.saldo)[0] as any;
    if (topp) { b.aarskonger = (Array.isArray(b.aarskonger) ? b.aarskonger : []).concat([{ aar: b.lommebok.sesong, navn: topp.navn, saldo: topp.saldo }]).slice(-20); logg(b, `👑 Årets Børskonge ${b.lommebok.sesong}: ${topp.navn} med ${topp.saldo} kr`, `👑 Market King of ${b.lommebok.sesong}: ${topp.navn} with ${topp.saldo}`); }
    Object.values(b.lommebok.k).forEach((x: any) => { if (x) { x.saldo = null; x.kvelder = 0; } });
    b.lommebok.sesong = aar;
  }
  return b.lommebok;
}
function konto(b: any, k: string, navn?: string) {
  const l = lommebok(b), x = l.k[k] || (l.k[k] = { navn: navn || '', saldo: null, kvelder: 0 });
  if (navn && !x.navn) x.navn = navn;
  return x;
}
/** Hva et medlem tar med seg inn i kvelden: formuen sin + kveldens lønn. */
export function startSaldo(bok: any, k: string) {
  const b = lesBok(bok), x = lommebok(b).k[k];
  return (x && x.saldo != null ? x.saldo : START_FORMUE) + LONN;
}
/** Navnet ditt i gjengen (brukes når du blir med på en kveld). */
export function settNavn(bok: any, k: string, navn: string) {
  const b = lesBok(bok), n = rens(navn, 20);
  if (!n) return { feil: 'Skriv et navn.', en: 'Enter a name.' };
  konto(b, k).navn = n;
  return { bok: b };
}
export function profilNavn(bok: any, k: string) { const b = lesBok(bok), x = lommebok(b).k[k]; return x && x.navn ? x.navn : ''; }

/** En aksje som manglet stemmer: avgjøres når to andre har stemt, eller når fristen går ut. */
function avgjorUtsatt(b: any, u: any, tvunget: boolean, antall = 99) {
  const andre = Object.entries(u.stemmer).filter(([k, v]) => k !== u.melderKonto && k !== u.subjektKonto && (v === 'ja' || v === 'nei'));
  // To andre må ha stemt – eller alle som kan stemme, i små gjenger
  const kan = Math.max(1, antall - (u.melderKonto ? 1 : 0) - (u.subjektKonto ? 1 : 0));
  if (!tvunget && andre.length < Math.min(2, kan)) return false;
  const ja = Object.entries(u.stemmer).filter(([k, v]) => k !== u.subjektKonto && v === 'ja').length + (u.melderKonto ? 0 : 1);
  const nei = andre.filter(([, v]) => v === 'nei').length;
  const godkjent = andre.length >= 1 && ja > nei;
  u.status = godkjent ? 'godkjent' : 'avvist'; u.avgjort = Date.now();
  if (godkjent) {
    u.holdere.forEach((h: any) => { const x = konto(b, h.konto, h.navn); x.saldo = (x.saldo != null ? x.saldo : START_FORMUE) + h.n * 100; });
    if (u.subjektKonto) { const x = konto(b, u.subjektKonto, u.subjektNavn); x.saldo = (x.saldo != null ? x.saldo : START_FORMUE) + 30; }
    logg(b, `✅ Avgjort i ettertid: «${u.q}» – ${u.utfallNavn}. Aksjonærene fikk utbetalt.`, `✅ Settled afterwards: “${u.qEn}” – ${u.utfallNavn}. Shareholders were paid.`);
  } else logg(b, `❌ Avgjort i ettertid: «${u.q}» skjedde ikke – aksjene ble verdiløse.`, `❌ Settled afterwards: “${u.qEn}” didn’t happen – the shares became worthless.`);
  return true;
}
/** Avgjør de som har gått ut på tid. Gir true hvis noe ble endret. */
export function ryddUtsatte(bok: any) {
  const b = lesBok(bok); let endret = false;
  (b.utsatte || []).forEach((u: any) => { if (u.status === 'venter' && Date.now() > u.frist) { avgjorUtsatt(b, u, true); endret = true; } });
  b.utsatte = (b.utsatte || []).filter((u: any) => u.status === 'venter' || Date.now() - (u.avgjort || 0) < 14 * 24 * 3600 * 1000).slice(-60);
  return { bok: b, endret };
}
/** Et medlem stemmer på gjengsiden: skjedde det? */
export function stemUtsatt(bok: any, id: string, k: string, v: string, antall = 99) {
  const b = lesBok(bok), u = (b.utsatte || []).find((x: any) => x.id === id && x.status === 'venter');
  if (!u) return { feil: 'Den er allerede avgjort.', en: 'It’s already settled.' };
  if (k === u.subjektKonto) return { feil: 'Aksjen handler om deg, så du kan ikke stemme.', en: 'This share is about you, so you can’t vote.' };
  if (k === u.melderKonto) return { feil: 'Du meldte den, så stemmen din er allerede med.', en: 'You reported it, so your vote already counts.' };
  if (v !== 'ja' && v !== 'nei') return { feil: 'Ugyldig stemme.', en: 'Invalid vote.' };
  u.stemmer[k] = v;
  avgjorUtsatt(b, u, Date.now() > u.frist, antall);
  return { bok: b };
}

/** Leser lovboka – også den gamle formen fra det tidligere lov-spillet. */
export function lesBok(x: any) {
  const b: any = tomBok();
  if (!x || typeof x !== 'object') return b;
  if (x.v === 2) {
    Object.assign(b, x);
    ['regler', 'logg', 'brukt', 'utsatte', 'aarskonger'].forEach((k) => { if (!Array.isArray(b[k])) b[k] = []; });
    ['seire', 'borskonge'].forEach((k) => { if (!b[k] || typeof b[k] !== 'object') b[k] = {}; });
    return b;
  }
  // Gammel lovbok (v1): ta med lovene, seirene og historikken
  b.kvelder = Number(x.kvelder) || 0;
  b.regler = (Array.isArray(x.lover) ? x.lover : []).map((l: any) => ({
    id: String(l.id || nyId()), tekst: rens(l.tekst), av: rens(l.av, 40), avKonto: l.avKonto || null, kveld: l.kveld || 0, dato: l.dato || Date.now(),
    status: l.status === 'gjelder' || l.status === 'anket' ? 'aktiv' : 'fjernet',
    fjernetAv: l.status === 'vetoet' ? rens(l.vetoNavn, 40) || null : l.status === 'opphevet' ? rens(l.anketNavn, 40) || null : null,
    fjernet: l.status === 'gjelder' || l.status === 'anket' ? null : (l.dom && l.dom.dato) || l.dato || null, stemBort: [],
  })).filter((l: any) => l.tekst);
  Object.entries(x.seire || {}).forEach(([k, n]: any) => { b.seire[k] = { navn: String(k).replace(/^[nk]:/, ''), n: Number(n) || 0 }; });
  // Seire lagret med konto-nøkkel kjenner vi ikke navnet på – de får navnet neste gang personen vinner
  Object.keys(b.seire).forEach((k) => { if (k.startsWith('k:')) b.seire[k].navn = '–'; });
  b.logg = (Array.isArray(x.logg) ? x.logg : []).slice(0, 100);
  b.brukt = Array.isArray(x.brukt) ? x.brukt.slice(-60) : [];
  return b;
}
function logg(b: any, no: string, en: string, dato = Date.now()) { b.logg.unshift({ dato, no, en }); b.logg = b.logg.slice(0, 200); }
function tell(map: any, konto: string | null, navn: string) {
  const k = nokkel(konto, navn), x = map[k] || (map[k] = { navn, n: 0 });
  x.navn = navn; x.n++;
}

/**
 * Kvelden er over: tell den, gi seieren til kveldens vinner og la hen velge regel.
 * Trygt å kjøre flere ganger (samme kveld telles bare én gang).
 */
export function kveldInn(bok: any, kveldId: string, r: { vinner: { navn: string; konto: string | null } | null; borskonge?: { navn: string; konto: string | null } | null; leker?: number;
    lommer?: { konto: string; navn: string; saldo: number | null }[]; utsatte?: any[] }) {
  const b = lesBok(bok);
  if (b.brukt.includes(kveldId)) return b;
  b.brukt.push(kveldId); b.brukt = b.brukt.slice(-60);
  b.kvelder++;
  // Formuen: det du endte kvelden med (var børsen i gang), ellers bare kveldens lønn
  (r.lommer || []).forEach((l) => {
    const x = konto(b, l.konto, l.navn);
    x.saldo = l.saldo != null ? Math.max(0, Math.round(l.saldo)) : (x.saldo != null ? x.saldo : START_FORMUE) + LONN;
    x.kvelder = (x.kvelder || 0) + 1;
  });
  (r.utsatte || []).forEach((u) => { b.utsatte.push({ ...u, frist: Date.now() + FRIST_UTSATT, status: 'venter' }); });
  if ((r.utsatte || []).length) logg(b, `⏳ ${r.utsatte!.length} ${r.utsatte!.length === 1 ? 'aksje venter' : 'aksjer venter'} på stemmer – avgjøres her på gjengsiden`, `⏳ ${r.utsatte!.length} ${r.utsatte!.length === 1 ? 'share awaits' : 'shares await'} votes – settled here on the crew page`);
  if (r.vinner) {
    tell(b.seire, r.vinner.konto, r.vinner.navn);
    b.ventende = { kveldId, navn: r.vinner.navn, konto: r.vinner.konto || null, dato: Date.now() };
    logg(b, `🏆 Kveld ${b.kvelder}: ${r.vinner.navn} vant kvelden og får velge regel`, `🏆 Night ${b.kvelder}: ${r.vinner.navn} won the night and gets to pick a rule`);
  } else {
    b.ventende = null;
    logg(b, `Kveld ${b.kvelder} er spilt – ingen vinner denne gangen`, `Night ${b.kvelder} played – no winner this time`);
  }
  if (r.borskonge) {
    tell(b.borskonge, r.borskonge.konto, r.borskonge.navn);
    logg(b, `👑 ${r.borskonge.navn} ble Børskonge`, `👑 ${r.borskonge.navn} became Market King`);
  }
  return b;
}

/**
 * Kveldens vinner velger: ny regel, oppheve en regel, eller la lovboka være.
 * fraRom = valget kommer fra rommet (rommet har allerede sjekket at det er vinneren).
 */
export function vinnerValg(bok: any, kveldId: string, hvem: { navn: string; konto?: string | null; fraRom?: boolean }, valg: { type: string; tekst?: string; regel?: string }) {
  const b = lesBok(bok), v = b.ventende;
  if (!v || v.kveldId !== kveldId) return { feil: 'Det er ingen regel å velge for denne kvelden.', en: 'There’s no rule to pick for this night.' };
  if (!hvem.fraRom && (!hvem.konto || v.konto !== hvem.konto)) return { feil: 'Bare kveldens vinner kan velge regel.', en: 'Only the winner of the night can pick a rule.' };
  const navn = v.navn || hvem.navn;
  if (valg.type === 'ny') {
    const tekst = rens(valg.tekst);
    if (tekst.length < 4) return { feil: 'Skriv hele regelen.', en: 'Write the whole rule.' };
    b.regler.push({ id: nyId(), tekst, av: navn, avKonto: v.konto || null, kveld: b.kvelder, dato: Date.now(), status: 'aktiv', fjernetAv: null, fjernet: null, stemBort: [] });
    logg(b, `📜 ${navn} innførte regelen «${tekst}»`, `📜 ${navn} introduced the rule “${tekst}”`);
  } else if (valg.type === 'opphev') {
    const r = b.regler.find((x: any) => x.id === valg.regel && x.status === 'aktiv');
    if (!r) return { feil: 'Fant ikke regelen.', en: 'Couldn’t find that rule.' };
    r.status = 'fjernet'; r.fjernetAv = navn; r.fjernet = Date.now(); r.hvordan = 'vinner';
    logg(b, `🗑️ ${navn} opphevet regelen «${r.tekst}»`, `🗑️ ${navn} repealed the rule “${r.tekst}”`);
  } else {
    logg(b, `🤷 ${navn} lot lovboka være som den er`, `🤷 ${navn} left the law book as it is`);
  }
  b.ventende = null;
  return { bok: b };
}

/** Et medlem stemmer for (eller trekker stemmen) å fjerne en regel. Flertall av medlemmene fjerner den. */
export function stemBort(bok: any, regelId: string, konto: string, navn: string, antallMedlemmer: number) {
  const b = lesBok(bok), r = b.regler.find((x: any) => x.id === regelId && x.status === 'aktiv');
  if (!r) return { feil: 'Regelen gjelder ikke lenger.', en: 'The rule no longer applies.' };
  r.stemBort = Array.isArray(r.stemBort) ? r.stemBort : [];
  const i = r.stemBort.indexOf(konto);
  if (i === -1) r.stemBort.push(konto); else r.stemBort.splice(i, 1);
  const trengs = Math.floor(Math.max(1, antallMedlemmer) / 2) + 1;
  let fjernet = false;
  if (r.stemBort.length >= trengs) {
    r.status = 'fjernet'; r.fjernetAv = null; r.fjernet = Date.now(); r.hvordan = 'flertall'; fjernet = true;
    logg(b, `🗳️ Gjengen stemte bort regelen «${r.tekst}» (${r.stemBort.length} av ${antallMedlemmer})`, `🗳️ The crew voted out the rule “${r.tekst}” (${r.stemBort.length} of ${antallMedlemmer})`);
  }
  return { bok: b, fjernet, navn };
}

/** Reglene som gjelder, nyeste først – det rommet viser under kvelden. */
export function reglerForRom(bok: any) {
  const b = lesBok(bok);
  return b.regler.filter((x: any) => x.status === 'aktiv').slice().reverse().slice(0, 40).map((x: any) => ({ id: x.id, tekst: x.tekst, av: x.av, kveld: x.kveld }));
}

/** Lovboka slik gjengsiden viser den – uten konto-id-er. */
export function visBok(bok: any, meg: string | null, lang: Lang = 'no', antallMedlemmer = 0) {
  const b = lesBok(bok);
  const trengs = Math.floor(Math.max(1, antallMedlemmer) / 2) + 1;
  const regel = (x: any) => ({ id: x.id, tekst: x.tekst, av: x.av, kveld: x.kveld, dato: x.dato, fjernetAv: x.fjernetAv || null, fjernet: x.fjernet || null, hvordan: x.hvordan || null,
    stemmer: (x.stemBort || []).length, trengs, harStemt: !!(meg && (x.stemBort || []).includes(meg)) });
  const topp = (map: any) => Object.values(map || {}).filter((x: any) => x && x.n > 0).sort((a: any, c: any) => c.n - a.n).slice(0, 5).map((x: any) => ({ navn: x.navn, n: x.n }));
  const lagd: Record<string, number> = {};
  b.regler.filter((x: any) => x.status === 'aktiv').forEach((x: any) => { lagd[x.av] = (lagd[x.av] || 0) + 1; });
  return {
    kvelder: b.kvelder,
    aktive: b.regler.filter((x: any) => x.status === 'aktiv').slice().reverse().map(regel),
    fjernet: b.regler.filter((x: any) => x.status !== 'aktiv').slice().reverse().slice(0, 100).map(regel),
    rekorder: {
      seire: topp(b.seire), borskonge: topp(b.borskonge),
      regler: Object.entries(lagd).map(([navn, n]) => ({ navn, n })).sort((a, c) => c.n - a.n).slice(0, 5),
    },
    ventende: b.ventende ? { kveldId: b.ventende.kveldId, navn: b.ventende.navn, minTur: !!(meg && b.ventende.konto === meg) } : null,
    sesong: lommebok(b).sesong,
    formue: Object.entries(lommebok(b).k).filter(([, x]: any) => x && x.navn && (x.saldo != null || x.kvelder)).map(([k, x]: any) => ({ navn: x.navn, saldo: x.saldo != null ? x.saldo : START_FORMUE, kvelder: x.kvelder || 0, meg: !!(meg && k === meg) }))
      .sort((x: any, y: any) => y.saldo - x.saldo),
    meg: meg ? (() => { const x = lommebok(b).k[meg]; return { navn: x && x.navn ? x.navn : '', saldo: x && x.saldo != null ? x.saldo : START_FORMUE, kvelder: x ? x.kvelder || 0 : 0 }; })() : null,
    aarskonger: (b.aarskonger || []).slice().reverse(),
    utsatte: (b.utsatte || []).slice().reverse().map((u: any) => ({ id: u.id, q: lang === 'en' ? u.qEn : u.q, utfallNavn: u.utfallNavn, melderNavn: u.melderNavn, frist: u.frist, status: u.status,
      ja: Object.entries(u.stemmer).filter(([k, v]) => k !== u.subjektKonto && v === 'ja').length + (u.melderKonto ? 0 : 1), nei: Object.values(u.stemmer).filter((v) => v === 'nei').length,
      kanStemme: !!(meg && u.status === 'venter' && meg !== u.subjektKonto && meg !== u.melderKonto), minStemme: meg ? u.stemmer[meg] || null : null, aksjonaerer: u.holdere.length })),
    logg: b.logg.slice(0, 40).map((x: any) => ({ dato: x.dato, tekst: x[lang] || x.no })),
  };
}
