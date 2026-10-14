// Lager et nytt rom. Svarer med koden og en hemmelig pollett som bare denne telefonen får.
import type { APIRoute } from 'astro';
import { lagRom, endreRom, rensNavn, lekeliste, loggRom, rensLang } from '../../../lib/rom';
import { rpc } from '../../../lib/spilt';
import { innloggetBruker, laastFor } from '../../../lib/konto';
import { rensPynt } from '../../../lib/pynt.js';
export const prerender = false;

const json = (d: any, status = 200) =>
  new Response(JSON.stringify(d), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

export const POST: APIRoute = async ({ request }) => {
  const hLang = rensLang(request.headers.get('x-lang'));
  let d: any;
  try { d = await request.json(); } catch { return json({ feil: 'ugyldig' }, 400); }
  // Språket til den som lager rommet: body.lang, ellers x-lang-headeren
  const lang = d && (d.lang === 'en' || d.lang === 'no') ? rensLang(d.lang) : hLang;
  const en = lang === 'en';
  const navn = rensNavn(d.navn);
  if (!navn) return json({ feil: 'navn', melding: en ? 'Enter a name.' : 'Skriv inn et navn.' }, 400);
  try {
    const { kode, spiller } = await lagRom(navn, String(d.lek || '').slice(0, 30), String(d.modus || ''), lang);
    // Innlogget vert: figuren tar med seg pynten sin, og kvelden teller på kontoen
    if (request.headers.get('authorization')) {
      try {
        const u = await innloggetBruker(request);
        if (u) {
          const ph: any = await rpc('pynt_hent', { p_user: u.id });
          const laast = await laastFor(u.id, ph && Array.isArray(ph.laast) ? ph.laast : []);
          const pynt = ph ? rensPynt(ph.valgt, laast) : {};
          await endreRom(kode, (data) => { const v = data.spillere[0]; if (v) { v.bruker = u.id; v.pynt = pynt; v.kvelder = Number(ph && ph.kvelder) || 0; v.laast = laast; } return { ok: true }; });
        }
      } catch { /* rommet virker uten */ }
    }
    await loggRom('lag', 'rom');
    return json({ kode, id: spiller.id, pollett: spiller.pollett, lang, leker: lekeliste(lang) });
  } catch (e) {
    console.warn('Rom kunne ikke lages:', (e as Error).message);
    return json({ feil: 'server', melding: en ? "Couldn't create the room right now. Try again in a bit." : 'Fikk ikke laget rommet akkurat nå. Prøv igjen om litt.' }, 503);
  }
};
