// En delt kortstokk: bare navn og kort, aldri hvem som laget den.
import type { APIRoute } from 'astro';
import { rpc } from '../../../lib/spilt';
import { json } from '../../../lib/konto';
export const prerender = false;
export const GET: APIRoute = async ({ params }) => {
  const id = String(params.id || '');
  if (!/^[0-9a-f-]{36}$/i.test(id)) return json({ feil: 'finnes-ikke', melding: 'Fant ikke kortstokken.' }, 404);
  try {
    const d = await rpc('delt_kortstokk', { p_id: id });
    if (!d) return json({ feil: 'finnes-ikke', melding: 'Kortstokken finnes ikke, eller er ikke delt lenger.' }, 404);
    return new Response(JSON.stringify(d), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=0, s-maxage=60' } });
  } catch (e) {
    console.warn('Delt kortstokk feilet:', (e as Error).message);
    return json({ feil: 'server', melding: 'Fikk ikke hentet kortstokken. Prøv igjen.' }, 503);
  }
};
