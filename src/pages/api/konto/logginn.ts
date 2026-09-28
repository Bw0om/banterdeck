// Innlogging med brukernavn og passord. Serveren slår opp e-posten selv,
// så den aldri sendes til nettleseren. Svaret er bare selve innloggingen.
import type { APIRoute } from 'astro';
import { rpc } from '../../../lib/spilt';
import { auth, json, BRUKERNAVN, gyldigEpost } from '../../../lib/konto';
export const prerender = false;

const FEIL = { feil: 'feil', melding: 'Feil brukernavn eller passord.' };

export const POST: APIRoute = async ({ request }) => {
  let d: any;
  try { d = await request.json(); } catch { return json({ feil: 'ugyldig' }, 400); }
  const navn = String(d.navn || '').trim();
  const passord = String(d.passord || '');
  if (!navn || !passord || passord.length > 72) return json(FEIL, 401);
  try {
    let epost = '';
    if (navn.includes('@')) { if (gyldigEpost(navn)) epost = navn.toLowerCase(); }
    else if (BRUKERNAVN.test(navn)) epost = (await rpc('epost_for_brukernavn', { p_brukernavn: navn })) || '';
    if (!epost) return json(FEIL, 401);
    const r = await auth('/token?grant_type=password', { method: 'POST', body: { email: epost, password: passord } });
    if (!r.ok) {
      if (r.status === 429) return json({ feil: 'grense', melding: 'For mange forsøk. Vent litt og prøv igjen.' }, 429);
      const m = String((r.data && (r.data.error_description || r.data.msg || r.data.error_code)) || '');
      if (/confirm/i.test(m)) return json({ feil: 'bekreft', melding: 'Bekreft e-postadressen først – sjekk innboksen.' }, 401);
      return json(FEIL, 401);
    }
    return json({ access_token: r.data.access_token, refresh_token: r.data.refresh_token, expires_in: r.data.expires_in });
  } catch (e) {
    console.warn('Innlogging feilet:', (e as Error).message);
    return json({ feil: 'server', melding: 'Fikk ikke logget inn akkurat nå. Prøv igjen om litt.' }, 503);
  }
};
