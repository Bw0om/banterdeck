import type { APIRoute } from 'astro';
import { json, innloggetBruker } from '../../../lib/konto';
import { plussStatus, vippsKlar } from '../../../lib/pluss';
export const prerender = false;
export const GET: APIRoute = async ({ request }) => {
  try {
    const u = await innloggetBruker(request);
    if (!u) return json({ innlogget: false, aktiv: false, kanKjope: vippsKlar() });
    return json({ innlogget: true, ...(await plussStatus(u.id)), kanKjope: vippsKlar() });
  } catch (e) {
    console.warn('Pluss-status feilet:', (e as Error).message);
    return json({ feil: 'server', melding: 'Fikk ikke sjekket Pluss akkurat nå.' }, 503);
  }
};
