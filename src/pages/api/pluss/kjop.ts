// Starter kjøp med Vipps. Svarer med adressen brukeren sendes til.
import type { APIRoute } from 'astro';
import { json, innloggetBruker } from '../../../lib/konto';
import { PRODUKTER, startBetaling, vippsKlar } from '../../../lib/pluss';
export const prerender = false;
export const POST: APIRoute = async ({ request }) => {
  let d: any;
  try { d = await request.json(); } catch { return json({ feil: 'ugyldig' }, 400); }
  if (!PRODUKTER[d.produkt]) return json({ feil: 'ugyldig', melding: 'Ukjent produkt.' }, 400);
  if (d.samtykke !== true) return json({ feil: 'samtykke', melding: 'Du må krysse av for at Pluss starter med en gang.' }, 400);
  if (!vippsKlar()) return json({ feil: 'ikke-klar', melding: 'Betaling med Vipps kommer snart. Prøv gratiskvelden så lenge!' }, 503);
  try {
    const u = await innloggetBruker(request);
    if (!u) return json({ feil: 'logg-inn', melding: 'Logg inn først, så Pluss havner på kontoen din.' }, 401);
    const retur = new URL('/no/pluss', request.url).toString();
    return json(await startBetaling(u.id, d.produkt, retur));
  } catch (e) {
    console.warn('Kjøp feilet:', (e as Error).message);
    return json({ feil: 'server', melding: 'Fikk ikke startet betalingen. Prøv igjen om litt.' }, 503);
  }
};
