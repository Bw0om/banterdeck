// Første kveld gratis – én gang per konto og per e-postadresse (ola+1@gmail.com teller som ola@gmail.com).
import type { APIRoute } from 'astro';
import { rpc } from '../../../lib/spilt';
import { json, innloggetBruker } from '../../../lib/konto';
export const prerender = false;
export const POST: APIRoute = async ({ request }) => {
  try {
    const u = await innloggetBruker(request);
    if (!u) return json({ feil: 'logg-inn', melding: 'Logg inn eller lag en gratis konto først.' }, 401);
    const en = /^en/.test(request.headers.get('x-lang') || '');
    if (!u.email_confirmed_at && !u.confirmed_at) return json({ feil: 'bekreft', melding: en ? 'Confirm your email first – check your inbox.' : 'Bekreft e-posten din først – sjekk innboksen.' }, 409);
    const s = await rpc('pluss_gratis', { p_user: u.id });
    if (!s || !s.aktiv) {
      const grunn = s && s.grunn;
      const melding = grunn === 'engangs'
        ? (en ? 'The free night isn’t available for temporary email addresses.' : 'Gratiskvelden gjelder ikke for engangs-e-postadresser.')
        : grunn === 'epost-brukt'
          ? (en ? 'The free night has already been used with this email address.' : 'Gratiskvelden er allerede brukt med denne e-postadressen.')
          : (en ? 'You’ve already used your free night.' : 'Du har allerede brukt gratiskvelden din.');
      return json({ feil: 'brukt', grunn, melding }, 409);
    }
    return json(s);
  } catch (e) {
    console.warn('Gratis Pluss feilet:', (e as Error).message);
    return json({ feil: 'server', melding: 'Det gikk ikke akkurat nå. Prøv igjen.' }, 503);
  }
};
