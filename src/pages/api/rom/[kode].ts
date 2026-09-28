// Ett rom: hente tilstanden (GET) eller gjøre noe i det (POST).
// Telefonen identifiserer seg med spiller-id og pollett i egne felt, aldri i adressen.
import type { APIRoute } from 'astro';
import { hentRom, endreRom, visning, handling, blimed, finnSpiller, gyldigKode, rensNavn, lekeliste, varsle, loggRom, erPlussLek } from '../../../lib/rom';
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

export const GET: APIRoute = async ({ params, request }) => {
  const kode = String(params.kode || '').toUpperCase();
  if (!gyldigKode(kode)) return json({ feil: 'finnes-ikke', melding: MELDINGER['finnes-ikke'] }, 404);
  try {
    const rom = await hentRom(kode);
    if (!rom) return json({ feil: 'finnes-ikke', melding: MELDINGER['finnes-ikke'] }, 404);
    const v = Number(new URL(request.url).searchParams.get('v') || 0);
    const meg = finnSpiller(rom.data, request.headers.get('x-spiller') || '', request.headers.get('x-pollett') || '');
    if (v && v === rom.versjon && meg) return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
    return json({ ...visning(rom.data, rom.versjon, meg), kode, leker: lekeliste() });
  } catch (e) {
    console.warn('Rom kunne ikke hentes:', (e as Error).message);
    return json({ feil: 'server', melding: 'Mistet kontakten. Prøver igjen …' }, 503);
  }
};

export const POST: APIRoute = async ({ params, request }) => {
  const kode = String(params.kode || '').toUpperCase();
  if (!gyldigKode(kode)) return json({ feil: 'finnes-ikke', melding: MELDINGER['finnes-ikke'] }, 404);
  let d: any;
  try { d = await request.json(); } catch { return json({ feil: 'ugyldig' }, 400); }
  // Pluss sjekkes her på serveren – aldri på det nettleseren påstår
  delete d._plussTil;
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
        if (!navn) return { feil: 'navn', melding: 'Skriv inn et navn.' };
        const r: any = blimed(data, navn);
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
      return json({ feil: res.feil, melding: res.melding || MELDINGER[res.feil] || 'Det gikk ikke.' }, status);
    }
    // Si fra til de andre telefonene, og tell hvilke leker som startes (uten navn)
    await Promise.all([
      varsle(kode, res.versjon),
      d.handling === 'start' && res.data.spill ? loggRom('lek', d.lek === 'egen' ? 'egen-kortstokk' : String(d.lek || '')) : null,
    ]);
    const svar: any = { ...visning(res.data, res.versjon, meg), kode, leker: lekeliste() };
    if (ny) { svar.id = ny.id; svar.pollett = ny.pollett; }
    return json(svar);
  } catch (e) {
    console.warn('Rom-handling feilet:', (e as Error).message);
    return json({ feil: 'server', melding: 'Mistet kontakten. Prøv igjen.' }, 503);
  }
};
