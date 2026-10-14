// Figuren din: hva kontoen har låst opp av pynt, og hva den har på seg. Alt er gratis – man låser opp ved å spille.
import type { APIRoute } from 'astro';
import { rpc } from '../../../lib/spilt';
import { json, innloggetBruker, laastFor } from '../../../lib/konto';
import { rensPynt, sesong } from '../../../lib/pynt.js';
export const prerender = false;

async function hent(userId: string) {
  const ph: any = (await rpc('pynt_hent', { p_user: userId })) || {};
  const laast: string[] = await laastFor(userId, Array.isArray(ph.laast) ? ph.laast : []);
  return { laast, valgt: rensPynt(ph.valgt, laast), kvelder: Number(ph.kvelder) || 0, sesong: sesong() };
}

export const GET: APIRoute = async ({ request }) => {
  try {
    const bruker = await innloggetBruker(request);
    if (!bruker) return json({ feil: 'logg-inn' }, 401);
    return json(await hent(bruker.id));
  } catch (e) {
    console.warn('Pynt feilet:', (e as Error).message);
    return json({ feil: 'server', melding: 'Fikk ikke hentet figuren din akkurat nå.' }, 503);
  }
};

export const POST: APIRoute = async ({ request }) => {
  let d: any;
  try { d = await request.json(); } catch { return json({ feil: 'ugyldig' }, 400); }
  try {
    const bruker = await innloggetBruker(request);
    if (!bruker) return json({ feil: 'logg-inn', melding: 'Logg inn på nytt.' }, 401);
    const naa = await hent(bruker.id);
    const valgt = rensPynt(d.valgt, naa.laast);   // bare det som faktisk er låst opp (og i sesong)
    await rpc('pynt_velg', { p_user: bruker.id, p_valg: valgt });
    return json({ ok: true, valgt });
  } catch (e) {
    console.warn('Pynt-valg feilet:', (e as Error).message);
    return json({ feil: 'server', melding: 'Det gikk ikke akkurat nå. Prøv igjen.' }, 503);
  }
};
