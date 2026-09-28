// Første kveld gratis – én gang per konto.
import type { APIRoute } from 'astro';
import { rpc } from '../../../lib/spilt';
import { json, innloggetBruker } from '../../../lib/konto';
export const prerender = false;
export const POST: APIRoute = async ({ request }) => {
  try {
    const u = await innloggetBruker(request);
    if (!u) return json({ feil: 'logg-inn', melding: 'Logg inn eller lag en gratis konto først.' }, 401);
    const s = await rpc('pluss_gratis', { p_user: u.id });
    if (!s || !s.aktiv) return json({ feil: 'brukt', melding: 'Du har allerede brukt gratiskvelden din.' }, 409);
    return json(s);
  } catch (e) {
    console.warn('Gratis Pluss feilet:', (e as Error).message);
    return json({ feil: 'server', melding: 'Det gikk ikke akkurat nå. Prøv igjen.' }, 503);
  }
};
