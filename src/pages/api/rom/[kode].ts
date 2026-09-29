// Ett rom: hente tilstanden (GET) eller gjøre noe i det (POST).
// Telefonen identifiserer seg med spiller-id og pollett i egne felt, aldri i adressen.
import type { APIRoute } from 'astro';
import { hentRom, endreRom, visning, handling, blimed, finnSpiller, gyldigKode, rensNavn, lekeliste, varsle, loggRom, erPlussLek, kveldForGjeng, rensLang } from '../../../lib/rom';
import { rpc } from '../../../lib/spilt';
import { innloggetBruker } from '../../../lib/konto';
import { plussStatus } from '../../../lib/pluss';
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
    const meg = finnSpiller(rom.data, request.headers.get('x-spiller') || '', request.headers.get('x-pollett') || '');
    if (v && v === rom.versjon && meg) return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
    const lang: Sprak = meg ? rensLang(meg.lang) : qLang;
    return json({ ...visning(rom.data, rom.versjon, meg, lang), kode, leker: lekeliste(lang) });
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
  delete d._plussTil; delete d._gjeng;
  // Gjengen sjekkes også her: verten må være innlogget og med i gjengen
  if (d.handling === 'gjeng' && d.gjengId) {
    try {
      const u = await innloggetBruker(request);
      const g = u && /^[0-9a-f-]{36}$/i.test(String(d.gjengId)) ? await rpc('gjeng_tilgang', { p_user: u.id, p_id: String(d.gjengId) }) : null;
      if (!g) return json({ feil: 'gjeng', melding: bLang === 'en' ? 'Log in with an account that belongs to the crew.' : 'Logg inn med en konto som er med i gjengen.' }, 403);
      d._gjeng = g;
    } catch { return json({ feil: 'server', melding: bLang === 'en' ? "Couldn't check the crew. Try again." : 'Fikk ikke sjekket gjengen. Prøv igjen.' }, 503); }
  }
  if (d.handling === 'pluss-aktiver' || (d.handling === 'start' && erPlussLek(d.lek))) {
    try {
      const u = await innloggetBruker(request);
      if (u) { const st = await plussStatus(u.id); if (st.aktiv && st.til) d._plussTil = Date.parse(st.til); }
    } catch { /* uten Pluss */ }
  }
  try {
    let meg: any = null, ny: any = null;
    const res: any = await endreRom(kode, (data) => {
      if (d.handling === 'bli-med') {
        const navn = rensNavn(d.navn);
        if (!navn) return { feil: 'navn', melding: 'Skriv inn et navn.', en: 'Enter a name.' };
        const r: any = blimed(data, navn, bLang);
        if (r.feil) return r;
        meg = r.spiller; ny = r.spiller;
        return { ok: true };
      }
      meg = finnSpiller(data, String(d.id || ''), String(d.pollett || ''));
      if (!meg) return { feil: 'ikke-med' };
      return handling(data, meg, d);
    });
    if (res.feil === 'fullt-gratis') await varsle(kode, 0);   // verten får se at noen prøvde å bli med
    if (res.feil) {
      const status = res.feil === 'finnes-ikke' ? 404 : res.feil === 'ikke-med' ? 403 : res.feil === 'opptatt' ? 409 : 400;
      // Feilen vises på språket til den som trykket (bli-med: body.lang / x-lang)
      const lang: Sprak = meg ? rensLang(meg.lang) : bLang;
      return json({ feil: res.feil, melding: melding(res.feil, lang, res) }, status);
    }
    // Si fra til de andre telefonene, og tell hvilke leker som startes (uten navn)
    await Promise.all([
      varsle(kode, res.versjon),
      d.handling === 'start' && res.data.spill ? loggRom('lek', d.lek === 'egen' ? 'egen-kortstokk' : String(d.lek || '')) : null,
    ]);
    // Kvelden er over: lagre den i sesongtabellen til gjengen
    if (d.handling === 'avslutt-kvelden' && res.data.gjeng && res.data.spillere.length >= 2 && (res.data.historikk || []).length) {
      try { await rpc('gjeng_kveld_lagre', { p_gjeng: res.data.gjeng.id, p_rom: kode + '-' + res.data.laget, p_data: kveldForGjeng(res.data) }); }
      catch (e) { console.warn('Gjengkvelden ble ikke lagret:', (e as Error).message); }
    }
    const lang: Sprak = meg ? rensLang(meg.lang) : bLang;
    const svar: any = { ...visning(res.data, res.versjon, meg, lang), kode, leker: lekeliste(lang) };
    if (ny) { svar.id = ny.id; svar.pollett = ny.pollett; }
    return json(svar);
  } catch (e) {
    console.warn('Rom-handling feilet:', (e as Error).message);
    return json({ feil: 'server', melding: bLang === 'en' ? 'Lost connection. Try again.' : 'Mistet kontakten. Prøv igjen.' }, 503);
  }
};
