// Min vervekode, hvor mange jeg har vervet og lagrede kveldspass (GET). Bruk et kveldspass (POST).
import type { APIRoute } from 'astro';
import { rpc } from '../../../lib/spilt';
import { json, innloggetBruker } from '../../../lib/konto';
export const prerender = false;
export const GET: APIRoute = async ({ request }) => {
  try {
    const u = await innloggetBruker(request);
    if (!u) return json({ feil: 'logg-inn', melding: 'Logg inn for å få din vervelenke.' }, 401);
    const v = await rpc('verv_min', { p_user: u.id });
    return json({ kode: v && v.kode, antall: Number((v && v.antall) || 0), kveldspass: Number((v && v.kveldspass) || 0) });
  } catch (e) {
    console.warn('Verving feilet:', (e as Error).message);
    return json({ feil: 'server', melding: 'Fikk ikke hentet vervelenken akkurat nå.' }, 503);
  }
};
export const POST: APIRoute = async ({ request }) => {
  try {
    const u = await innloggetBruker(request);
    if (!u) return json({ feil: 'logg-inn', melding: 'Logg inn først.' }, 401);
    const r = await rpc('kveldspass_bruk', { p_user: u.id });
    if (!r || !r.ok) return json({ feil: 'tomt', melding: 'Du har ingen lagrede kveldspass.' }, 409);
    return json({ ok: true, ...r.status });
  } catch (e) {
    console.warn('Kveldspass feilet:', (e as Error).message);
    return json({ feil: 'server', melding: 'Det gikk ikke akkurat nå. Prøv igjen.' }, 503);
  }
};
