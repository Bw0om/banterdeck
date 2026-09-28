// Lager et nytt rom. Svarer med koden og en hemmelig pollett som bare denne telefonen får.
import type { APIRoute } from 'astro';
import { lagRom, rensNavn, lekeliste, loggRom } from '../../../lib/rom';
export const prerender = false;

const json = (d: any, status = 200) =>
  new Response(JSON.stringify(d), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

export const POST: APIRoute = async ({ request }) => {
  let d: any;
  try { d = await request.json(); } catch { return json({ feil: 'ugyldig' }, 400); }
  const navn = rensNavn(d.navn);
  if (!navn) return json({ feil: 'navn', melding: 'Skriv inn et navn.' }, 400);
  try {
    const { kode, spiller } = await lagRom(navn);
    await loggRom('lag', 'rom');
    return json({ kode, id: spiller.id, pollett: spiller.pollett, leker: lekeliste() });
  } catch (e) {
    console.warn('Rom kunne ikke lages:', (e as Error).message);
    return json({ feil: 'server', melding: 'Fikk ikke laget rommet akkurat nå. Prøv igjen om litt.' }, 503);
  }
};
