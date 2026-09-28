// Sletter kontoen til den som er logget inn. Brukernavn og kortstokker forsvinner automatisk
// (on delete cascade), replikkene i «decks» slettes eksplisitt først.
import type { APIRoute } from 'astro';
import { supabaseServer } from '../../../lib/spilt';
import { json, innloggetBruker } from '../../../lib/konto';
export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  let d: any;
  try { d = await request.json(); } catch { return json({ feil: 'ugyldig' }, 400); }
  if (d.bekreft !== true) return json({ feil: 'bekreft', melding: 'Bekreft slettingen.' }, 400);
  try {
    const bruker = await innloggetBruker(request);
    if (!bruker) return json({ feil: 'logg-inn', melding: 'Logg inn på nytt.' }, 401);
    const { url, nokkel } = supabaseServer();
    if (!url || !nokkel) throw new Error('Supabase mangler');
    const h = { apikey: nokkel, Authorization: 'Bearer ' + nokkel, 'Content-Type': 'application/json' };
    await fetch(`${url}/rest/v1/decks?user_id=eq.${encodeURIComponent(bruker.id)}`, { method: 'DELETE', headers: h }).catch(() => null);
    const r = await fetch(`${url}/auth/v1/admin/users/${encodeURIComponent(bruker.id)}`, { method: 'DELETE', headers: h });
    if (!r.ok) throw new Error('Supabase svarte ' + r.status);
    return json({ ok: true });
  } catch (e) {
    console.warn('Sletting feilet:', (e as Error).message);
    return json({ feil: 'server', melding: 'Fikk ikke slettet kontoen akkurat nå. Prøv igjen, eller send oss en e-post.' }, 503);
  }
};
