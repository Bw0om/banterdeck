// For kontoer uten brukernavn (f.eks. laget med e-postlenke): velg ett.
import type { APIRoute } from 'astro';
import { rpc } from '../../../lib/spilt';
import { json, innloggetBruker, BRUKERNAVN } from '../../../lib/konto';
export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  let d: any;
  try { d = await request.json(); } catch { return json({ feil: 'ugyldig' }, 400); }
  const brukernavn = String(d.brukernavn || '').trim();
  if (!BRUKERNAVN.test(brukernavn)) return json({ feil: 'brukernavn', melding: 'Brukernavnet må være 3–20 tegn: bokstaver, tall, punktum, bindestrek eller understrek.' }, 400);
  try {
    const bruker = await innloggetBruker(request);
    if (!bruker) return json({ feil: 'logg-inn', melding: 'Logg inn på nytt.' }, 401);
    const ok = await rpc('sett_brukernavn', { p_user: bruker.id, p_brukernavn: brukernavn });
    if (!ok) return json({ feil: 'opptatt', melding: 'Brukernavnet er tatt, eller du har allerede ett.' }, 409);
    return json({ ok: true, brukernavn });
  } catch (e) {
    console.warn('Brukernavn feilet:', (e as Error).message);
    return json({ feil: 'server', melding: 'Det gikk ikke akkurat nå. Prøv igjen.' }, 503);
  }
};
