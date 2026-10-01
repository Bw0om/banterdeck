// Ett rom: hente tilstanden (GET) eller gjøre noe i det (POST).
// Telefonen identifiserer seg med spiller-id og pollett i egne felt, aldri i adressen.
import type { APIRoute } from 'astro';
import { hentRom, endreRom, visning, skjermVisning, skjermPinOk, handling, blimed, startSaldoFor, venteInn, finnVenter, finnSpiller, gyldigKode, rensNavn, lekeliste, varsle, loggRom, erPlussLek, kveldForGjeng, rensLang } from '../../../lib/rom';
import { rpc } from '../../../lib/spilt';
import { etterpaa } from '../../../lib/etterpaa';
import { innloggetBruker } from '../../../lib/konto';
import { plussStatus } from '../../../lib/pluss';
import { kveldInn, vinnerValg, reglerForRom, startSaldo } from '../../../lib/lovbok';
export const prerender = false;

const json = (d: any, status = 200) =>
  new Response(JSON.stringify(d), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
const MELDINGER: Record<string, string> = {
  'finnes-ikke': 'Fant ikke rommet. Sjekk koden – rom forsvinner etter ett døgn.',
  'fullt': 'Rommet er fullt.',
  'bare-vert': 'Bare den som laget rommet kan gjøre det.',
  'ikke-med': 'Du er ikke med i dette rommet lenger.',
  'opptatt': 'Mange trykket samtidig. Prøv igjen.',
};
const MELDINGER_EN: Record<string, string> = {
  'finnes-ikke': "Couldn't find the room. Check the code – rooms disappear after 24 hours.",
  'fullt': 'The room is full.',
  'bare-vert': 'Only the person who created the room can do that.',
  'ikke-med': "You're no longer in this room.",
  'opptatt': 'Lots of people tapped at once. Try again.',
};
type Sprak = 'no' | 'en';
/** Lekelista er lik hele kvelden – telefonen sier fra hvilket språk den allerede har, så slipper vi å sende den hver gang. */
const trengerLeker = (request: Request, lang: Sprak) => request.headers.get('x-leker') !== lang;
/** Melding på riktig språk: engelsk variant fra rom.ts (res.en) eller fra kartet over. */
function melding(kode: string, lang: Sprak, egen?: { melding?: string; en?: string }) {
  if (lang === 'en') return (egen && egen.en) || MELDINGER_EN[kode] || (egen && egen.melding) || "That didn't work.";
  return (egen && egen.melding) || MELDINGER[kode] || 'Det gikk ikke.';
}
/** Språket forespørselen ber om: x-lang-header eller ?lang= (brukes før vi vet hvem spilleren er). */
function forespurtLang(request: Request): Sprak {
  const h = request.headers.get('x-lang');
  if (h === 'en' || h === 'no') return h;
  return rensLang(new URL(request.url).searchParams.get('lang'));
}

export const GET: APIRoute = async ({ params, request }) => {
  const kode = String(params.kode || '').toUpperCase();
  const qLang = forespurtLang(request);
  if (!gyldigKode(kode)) return json({ feil: 'finnes-ikke', melding: melding('finnes-ikke', qLang) }, 404);
  try {
    const rom = await hentRom(kode);
    if (!rom) return json({ feil: 'finnes-ikke', melding: melding('finnes-ikke', qLang) }, 404);
    const v = Number(new URL(request.url).searchParams.get('v') || 0);
    // Storskjerm (TV/PC): verten har gitt den en PIN. Den ser bare det alle i rommet skal se.
    const pin = request.headers.get('x-skjerm');
    if (pin) {
      if (!skjermPinOk(rom.data, pin)) return json({ feil: 'skjerm-pin', melding: qLang === 'en' ? 'Wrong code or PIN. The host finds the PIN under “Big screen”.' : 'Feil kode eller PIN. Verten finner PIN-en under «Storskjerm».' }, 403);
      if (v && v === rom.versjon) return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
      return json({ ...skjermVisning(rom.data, rom.versjon, qLang), kode });
    }
    const meg = finnSpiller(rom.data, request.headers.get('x-spiller') || '', request.headers.get('x-pollett') || '');
    // Venter på å bli sluppet inn i en gjengkveld: vis bare venterommet
    if (!meg) {
      const vt = finnVenter(rom.data, request.headers.get('x-spiller') || '', request.headers.get('x-pollett') || '');
      if (vt) return json(venterSvar(rom.data, rom.versjon, vt, kode));
    }
    if (v && v === rom.versjon && meg) return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
    const lang: Sprak = meg ? rensLang(meg.lang) : qLang;
    const vis: any = visning(rom.data, rom.versjon, meg, lang);
    // Den som ikke er med i rommet, får bare se lobbyen – aldri hemmeligheter fra spillet (spionens sted, ord osv.)
    if (!meg) return json({ versjon: vis.versjon, vert: vis.vert, meg: null, spillere: vis.spillere, spill: vis.spill ? { type: vis.spill.type, navn: vis.spill.navn } : null, lang, kode, leker: lekeliste(lang) });
    const ut: any = { ...vis, kode };
    if (trengerLeker(request, lang)) ut.leker = lekeliste(lang);
    return json(ut);
  } catch (e) {
    console.warn('Rom kunne ikke hentes:', (e as Error).message);
    return json({ feil: 'server', melding: qLang === 'en' ? 'Lost connection. Retrying …' : 'Mistet kontakten. Prøver igjen …' }, 503);
  }
};

export const POST: APIRoute = async ({ params, request }) => {
  const kode = String(params.kode || '').toUpperCase();
  const hLang = forespurtLang(request);
  if (!gyldigKode(kode)) return json({ feil: 'finnes-ikke', melding: melding('finnes-ikke', hLang) }, 404);
  let d: any;
  try { d = await request.json(); } catch { return json({ feil: 'ugyldig' }, 400); }
  if (!d || typeof d !== 'object') return json({ feil: 'ugyldig' }, 400);
  // Språk før vi vet hvem spilleren er: body.lang (bli-med), ellers x-lang-headeren
  const bLang: Sprak = d.lang === 'en' || d.lang === 'no' ? d.lang : hLang;
  // Pluss sjekkes her på serveren – aldri på det nettleseren påstår
  delete d._plussTil; delete d._gjeng; delete d._konto; delete d._lov; delete d._ble; delete d._borsFri; delete d._venter; delete d._medlem; delete d._regler; delete d._start; delete d._startKr;
  // Gjengen sjekkes også her: verten må være innlogget og med i gjengen
  if (d.handling === 'gjeng' && d.gjengId) {
    try {
      const u = await innloggetBruker(request);
      const g = u && /^[0-9a-f-]{36}$/i.test(String(d.gjengId)) ? await rpc('gjeng_tilgang', { p_user: u.id, p_id: String(d.gjengId) }) : null;
      if (!g) return json({ feil: 'gjeng', melding: bLang === 'en' ? 'Log in with an account that belongs to the crew.' : 'Logg inn med en konto som er med i gjengen.' }, 403);
      d._gjeng = g; d._konto = u!.id;
      try { const l = await rpc('gjeng_lov_hent', { p_gjeng: g.id }); d._regler = l ? reglerForRom(l.lov) : []; } catch { d._regler = []; }
    } catch { return json({ feil: 'server', melding: bLang === 'en' ? "Couldn't check the crew. Try again." : 'Fikk ikke sjekket gjengen. Prøv igjen.' }, 503); }
  }
  // Gjengkveld: medlemmer kommer rett inn, alle andre venter på å bli sluppet inn
  if (d.handling === 'bli-med') {
    try {
      const rom = await hentRom(kode);
      const gj = rom && rom.data && rom.data.gjengKveld && rom.data.gjeng;
      if (gj) {
        const u = await innloggetBruker(request).catch(() => null);
        const g = u ? await rpc('gjeng_tilgang', { p_user: u.id, p_id: gj.id }) : null;
        if (g && u) {
          d._medlem = true; d._konto = u.id;
          // Blir med midt i børsen: ta med formuen fra gjengens lommebok
          if (rom.data.bors) { try { const l = await rpc('gjeng_lov_hent', { p_gjeng: gj.id }); if (l) d._startKr = startSaldo(l.lov, u.id); } catch { /* standard */ } }
        } else d._venter = true;
      }
    } catch { /* vanlig rom */ }
  }
  // Koble spilleren til kontoen sin i gjengen (og bli medlem hvis man er invitert)
  if (d.handling === 'gjeng-meg') {
    try {
      const u = await innloggetBruker(request);
      if (!u) return json({ feil: 'logg-inn', melding: bLang === 'en' ? 'Log in to vote on laws.' : 'Logg inn for å stemme over lover.' }, 401);
      const rom = await hentRom(kode);
      const gj = rom && rom.data && rom.data.gjeng;
      if (!gj) return json({ feil: 'gjeng', melding: bLang === 'en' ? 'The room isn’t linked to a crew.' : 'Rommet er ikke koblet til en gjeng.' }, 400);
      let g = await rpc('gjeng_tilgang', { p_user: u.id, p_id: gj.id });
      // Bli medlem krever invitasjon (sluppet inn «som medlem») – eller at du er verten
      const jeg = finnSpiller(rom.data, String(d.id || ''), String(d.pollett || ''));
      if (!g && d.bli === true && jeg && (jeg.invitert || rom.data.vert === jeg.id)) { const r = await rpc('gjeng_bli_med', { p_user: u.id, p_kode: gj.kode }); if (r && !r.feil) { g = r; d._ble = true; } }
      if (!g) return json({ feil: 'ikke-medlem', melding: bLang === 'en' ? 'You’re not in the crew yet.' : 'Du er ikke med i gjengen ennå.' }, 403);
      d._konto = u.id;
    } catch { return json({ feil: 'server', melding: bLang === 'en' ? "Couldn't check the crew. Try again." : 'Fikk ikke sjekket gjengen. Prøv igjen.' }, 503); }
  }
  // Vorsbørsen i en gjeng: medlemmene tar med seg formuen sin (+ kveldens lønn) inn i kvelden
  if (d.handling === 'bs-start') {
    try {
      const rom = await hentRom(kode);
      const gj = rom && rom.data && rom.data.gjeng;
      if (gj) {
        const l = await rpc('gjeng_lov_hent', { p_gjeng: gj.id });
        if (l) { const st: any = {}; rom.data.spillere.forEach((p: any) => { if (p.konto) st[p.id] = startSaldo(l.lov, p.konto); }); d._start = st; }
      }
    } catch { /* alle starter med 1000 */ }
  }
  if (d.handling === 'pluss-aktiver' || (d.handling === 'start' && erPlussLek(d.lek))) {
    try {
      const u = await innloggetBruker(request);
      if (u) { const st = await plussStatus(u.id); if (st.aktiv && st.til) d._plussTil = Date.parse(st.til); }
    } catch { /* uten Pluss */ }
  }
  try {
    let meg: any = null, ny: any = null, vent: any = null;
    const res: any = await endreRom(kode, (data) => {
      if (d.handling === 'bli-med') {
        const navn = rensNavn(d.navn);
        if (!navn) return { feil: 'navn', melding: 'Skriv inn et navn.', en: 'Enter a name.' };
        if (d._venter) { const v: any = venteInn(data, navn, bLang); vent = v.spiller; return { ok: true }; }
        // Medlem som allerede er i rommet (f.eks. på en annen telefon): samme plass igjen
        const fra = d._konto ? data.spillere.find((p: any) => p.konto === d._konto) : null;
        if (fra) { meg = fra; ny = fra; return { ok: true }; }
        const r: any = blimed(data, navn, bLang);
        if (!r.feil && d._konto) { r.spiller.konto = d._konto; startSaldoFor(data, r.spiller.id, d._startKr); }
        if (r.feil) return r;
        meg = r.spiller; ny = r.spiller;
        return { ok: true };
      }
      meg = finnSpiller(data, String(d.id || ''), String(d.pollett || ''));
      if (!meg) return { feil: 'ikke-med' };
      return handling(data, meg, d);
    });
    if (res.feil === 'fullt-gratis') etterpaa(varsle(kode, 0));
    if (vent && !res.feil) { etterpaa(varsle(kode, res.versjon)); return json(venterSvar(res.data, res.versjon, vent, kode)); }   // verten får se at noen prøvde å bli med
    if (res.feil) {
      const status = res.feil === 'finnes-ikke' ? 404 : res.feil === 'ikke-med' ? 403 : res.feil === 'opptatt' ? 409 : 400;
      // Feilen vises på språket til den som trykket (bli-med: body.lang / x-lang)
      const lang: Sprak = meg ? rensLang(meg.lang) : bLang;
      return json({ feil: res.feil, melding: melding(res.feil, lang, res) }, status);
    }
    // Si fra til de andre telefonene, og tell hvilke leker som startes (uten navn).
    // Dette skjer etter at svaret er sendt – telefonen som trykket, slipper å vente på det.
    etterpaa(varsle(kode, res.versjon));
    if (d.handling === 'start' && res.data.spill) etterpaa(loggRom('lek', d.lek === 'egen' ? 'egen-kortstokk' : String(d.lek || '')));
    // Verving: husk at en innlogget konto faktisk har spilt i et rom med andre (sjekkes før vervebelønning)
    if ((d.handling === 'bli-med' || d.handling === 'start') && res.data.spillere.length >= 2 && request.headers.get('authorization')) {
      etterpaa(innloggetBruker(request).then((u) => (u ? rpc('konto_rom_spilt', { p_user: u.id }) : null)));
    }
    // Kvelden er over: lagre den i sesongtabellen til gjengen
    if (d.handling === 'avslutt-kvelden' && res.data.gjeng && res.data.spillere.length >= 2 && (res.data.historikk || []).length) {
      try { await rpc('gjeng_kveld_lagre', { p_gjeng: res.data.gjeng.id, p_rom: kode + '-' + res.data.laget, p_data: kveldForGjeng(res.data) }); }
      catch (e) { console.warn('Gjengkvelden ble ikke lagret:', (e as Error).message); }
    }
    // Gjengkveld over: tell kvelden i lovboka (kveldens vinner får velge regel) og frigjør gjengen
    if (d.handling === 'avslutt-kvelden' && res.data.gjeng) await gjengKveldSlutt(res.data, kode);
    // Kveldens vinner har valgt regel: skriv den inn i lovboka
    if (d.handling === 'lov-valg' && res.data.gjeng && res.data.kveld && res.data.kveld.lovValg && !res.data.kveld.lovValg.lagret) {
      const ok = await lagreLovValg(res.data, kode);
      if (ok) { const r2: any = await endreRom(kode, (data) => { if (data.kveld && data.kveld.lovValg) data.kveld.lovValg.lagret = true; if (data.gjeng) data.gjeng.regler = ok; return { ok: true }; }); if (!r2.feil) { res.data = r2.data; res.versjon = r2.versjon; etterpaa(varsle(kode, r2.versjon)); } }
    }
    // Vorsbørsen: anonym statistikk over hvilke aksjer som blir kjøpt og skjer
    if (res.svar && Array.isArray(res.svar.stat) && res.svar.stat.length) etterpaa(rpc('bors_stat_logg', { p_rader: res.svar.stat }));
    // Egne aksjer folk har laget: lagres anonymt, så de beste kan bli faste aksjer senere
    if (res.svar && Array.isArray(res.svar.egne)) {
      for (const x of res.svar.egne.slice(0, 3)) etterpaa(rpc('bors_egen_logg', { p_tekst: String(x.tekst || '').slice(0, 100), p_type: x.type === 'janei' ? 'janei' : 'hvem' }));
    }
    const lang: Sprak = meg ? rensLang(meg.lang) : bLang;
    const svar: any = { ...visning(res.data, res.versjon, meg, lang), kode };
    if (trengerLeker(request, lang)) svar.leker = lekeliste(lang);
    if (ny) { svar.id = ny.id; svar.pollett = ny.pollett; }
    return json(svar);
  } catch (e) {
    console.warn('Rom-handling feilet:', (e as Error).message);
    return json({ feil: 'server', melding: bLang === 'en' ? 'Lost connection. Try again.' : 'Mistet kontakten. Prøv igjen.' }, 503);
  }
};

/** Venterommet: bare navnet ditt, gjengen og verten – ingenting fra spillet. */
function venterSvar(data: any, versjon: number, v: any, kode: string) {
  const vert = data.spillere.find((p: any) => p.id === data.vert);
  return { venter: true, versjon, meg: v.id, id: v.id, pollett: v.pollett, navn: v.navn, kode, lang: rensLang(v.lang), naa: Date.now(),
    gjeng: data.gjeng ? { navn: data.gjeng.navn } : null, vertNavn: vert ? vert.navn : '', spillere: data.spillere.map((p: any) => ({ id: p.id, navn: p.navn })) };
}
const kveldId = (data: any, kode: string) => kode + '-' + data.laget;

/** Leser og lagrer lovboka med versjonssjekk, så to telefoner ikke overskriver hverandre. */
async function endreBok(gjengId: string, endring: (bok: any) => any) {
  for (let i = 0; i < 4; i++) {
    const cur = await rpc('gjeng_lov_hent', { p_gjeng: gjengId });
    if (!cur) return null;
    const ny = endring(cur.lov);
    if (!ny) return null;
    const v = await rpc('gjeng_lov_lagre', { p_gjeng: gjengId, p_lov: ny, p_versjon: cur.versjon });
    if (v !== null && v !== undefined) return ny;
  }
  return null;
}

/** Alt kvelden skal skrive i lovboka: vinner, Børskonge, formuen til medlemmene og aksjer som venter på stemmer. */
function kveldData(data: any, kode: string, p: any, bk: any) {
  const e = (data.kveld && data.kveld.eksport) || null;
  const sp = (id: string) => data.spillere.find((x: any) => x.id === id);
  const tekst = (q: any, l: 'no' | 'en') => (q && typeof q === 'object' ? q[l] || q.no : String(q || ''));
  return {
    vinner: p ? { navn: p.navn, konto: p.konto || null } : null, borskonge: bk ? { navn: bk.navn, konto: bk.konto || null } : null,
    lommer: data.spillere.filter((x: any) => x.konto).map((x: any) => ({ konto: x.konto, navn: x.navn, saldo: e && e.saldoer && e.saldoer[x.id] != null ? e.saldoer[x.id] : null })),
    utsatte: e ? e.utsatte.map((u: any) => {
      const melder = sp(u.melder), subjekt = u.subjekt ? sp(u.subjekt) : null, stemmer: any = {};
      Object.entries(u.stemmer || {}).forEach(([id, v]) => { const x = sp(id); if (x && x.konto) stemmer[x.konto] = v; });
      return { id: kveldId(data, kode) + '-' + u.id, q: tekst(u.q, 'no'), qEn: tekst(u.q, 'en'), type: u.type,
        utfallNavn: u.type === 'hvem' ? (subjekt ? subjekt.navn : '?') : 'Ja',
        melderNavn: melder ? melder.navn : '?', melderKonto: melder && melder.konto ? melder.konto : null,
        subjektKonto: subjekt && subjekt.konto ? subjekt.konto : null, subjektNavn: subjekt ? subjekt.navn : null, stemmer,
        holdere: u.holdere.map((h: any) => { const x = sp(h.id); return x && x.konto ? { konto: x.konto, navn: x.navn, n: h.n } : null; }).filter(Boolean) };
    }) : [],
  };
}
async function gjengKveldSlutt(data: any, kode: string) {
  const k = data.kveld || {};
  const p = k.vinner ? data.spillere.find((x: any) => x.id === k.vinner) : null;
  const bk = data.bors && data.bors.slutt && data.bors.slutt.konge ? data.spillere.find((x: any) => x.id === data.bors.slutt.konge) : null;
  try {
    await endreBok(data.gjeng.id, (bok) => kveldInn(bok, kveldId(data, kode), kveldData(data, kode, p, bk)));
  } catch (e) { console.warn('Lovboka ble ikke oppdatert:', (e as Error).message); }
  try { if (data.gjengKveld) await rpc('gjeng_kveld_aktiv_sett', { p_gjeng: data.gjeng.id, p_rom: null }); } catch { /* ikke satt opp */ }
}

/** Skriver vinnerens valg inn i lovboka. Gir de nye reglene for rommet, eller null. */
async function lagreLovValg(data: any, kode: string) {
  const k = data.kveld, v = k.lovValg, p = data.spillere.find((x: any) => x.id === k.vinner);
  const bk = data.bors && data.bors.slutt && data.bors.slutt.konge ? data.spillere.find((x: any) => x.id === data.bors.slutt.konge) : null;
  try {
    const bok = await endreBok(data.gjeng.id, (b0) => {
      const b1 = kveldInn(b0, kveldId(data, kode), kveldData(data, kode, p, bk));
      const r: any = vinnerValg(b1, kveldId(data, kode), { navn: v.navn, fraRom: true }, { type: v.type, tekst: v.tekst, regel: v.regel });
      return r.bok || null;
    });
    return bok ? reglerForRom(bok) : null;
  } catch (e) { console.warn('Regelen ble ikke lagret:', (e as Error).message); return null; }
}
