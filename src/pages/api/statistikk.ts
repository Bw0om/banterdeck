// Statistikk for eieren. Bare innloggede kontoer med e-post i ADMIN_EPOSTER slipper inn.
import type { APIRoute } from 'astro';
import { rpc } from '../../lib/spilt';
import { json, innloggetBruker, adminEposter } from '../../lib/konto';
export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  try {
    const bruker = await innloggetBruker(request);
    if (!bruker) return json({ feil: 'logg-inn', melding: 'Logg inn først.' }, 401);
    const tillatt = adminEposter();
    const q = new URL(request.url).searchParams;
    // Kontosiden spør bare om lenken skal vises
    if (q.get('sjekk')) return json({ ok: tillatt.includes(String(bruker.email || '').toLowerCase()) });
    if (!tillatt.length) return json({ feil: 'oppsett', melding: 'Legg inn ADMIN_EPOSTER i Vercel for å slå på statistikken.' }, 403);
    if (!tillatt.includes(String(bruker.email || '').toLowerCase())) return json({ feil: 'nei', melding: 'Denne kontoen har ikke tilgang.' }, 403);
    const dager = Math.min(90, Math.max(7, Number(q.get('dager')) || 30));
    return json(await rpc('statistikk', { p_dager: dager }));
  } catch (e) {
    console.warn('Statistikk feilet:', (e as Error).message);
    return json({ feil: 'server', melding: 'Fikk ikke hentet statistikken. Har du kjørt konto-supabase.sql?' }, 503);
  }
};
