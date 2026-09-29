// Lager et nytt rom. Svarer med koden og en hemmelig pollett som bare denne telefonen får.
import type { APIRoute } from 'astro';
import { lagRom, rensNavn, lekeliste, loggRom, rensLang } from '../../../lib/rom';
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
    await loggRom('lag', 'rom');
    return json({ kode, id: spiller.id, pollett: spiller.pollett, lang, leker: lekeliste(lang) });
  } catch (e) {
    console.warn('Rom kunne ikke lages:', (e as Error).message);
    return json({ feil: 'server', melding: en ? "Couldn't create the room right now. Try again in a bit." : 'Fikk ikke laget rommet akkurat nå. Prøv igjen om litt.' }, 503);
  }
};
