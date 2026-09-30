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
  return { v: 2, kvelder: 0, regler: [] as any[], logg: [] as any[], seire: {} as any, borskonge: {} as any, brukt: [] as string[], ventende: null as any };
}

/** Leser lovboka – også den gamle formen fra det tidligere lov-spillet. */
export function lesBok(x: any) {
  const b: any = tomBok();
  if (!x || typeof x !== 'object') return b;
  if (x.v === 2) {
    Object.assign(b, x);
    ['regler', 'logg', 'brukt'].forEach((k) => { if (!Array.isArray(b[k])) b[k] = []; });
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
export function kveldInn(bok: any, kveldId: string, r: { vinner: { navn: string; konto: string | null } | null; borskonge?: { navn: string; konto: string | null } | null; leker?: number }) {
  const b = lesBok(bok);
  if (b.brukt.includes(kveldId)) return b;
  b.brukt.push(kveldId); b.brukt = b.brukt.slice(-60);
  b.kvelder++;
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
    logg: b.logg.slice(0, 40).map((x: any) => ({ dato: x.dato, tekst: x[lang] || x.no })),
  };
}
