// Ny konto med e-post, brukernavn og passord.
// Brukernavnet sjekkes og knyttes til kontoen her på serveren, så ingen kan ta andres navn.
import type { APIRoute } from 'astro';
import { rpc } from '../../../lib/spilt';
import { auth, json, BRUKERNAVN, gyldigEpost } from '../../../lib/konto';
export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  let d: any;
  try { d = await request.json(); } catch { return json({ feil: 'ugyldig' }, 400); }
  const epost = String(d.epost || '').trim().toLowerCase();
  const brukernavn = String(d.brukernavn || '').trim();
  const passord = String(d.passord || '');
  if (!gyldigEpost(epost)) return json({ feil: 'epost', melding: 'Skriv inn en gyldig e-postadresse.' }, 400);
  if (!BRUKERNAVN.test(brukernavn)) return json({ feil: 'brukernavn', melding: 'Brukernavnet må være 3–20 tegn: bokstaver, tall, punktum, bindestrek eller understrek.' }, 400);
  if (passord.length < 8 || passord.length > 72) return json({ feil: 'passord', melding: 'Passordet må være minst 8 tegn.' }, 400);
  try {
    if (!(await rpc('brukernavn_ledig', { p_brukernavn: brukernavn }))) {
      return json({ feil: 'opptatt', melding: 'Brukernavnet er tatt. Prøv et annet.' }, 409);
    }
    const tilbake = new URL('/no/account', request.url).toString();
    const r = await auth('/signup?redirect_to=' + encodeURIComponent(tilbake), {
      method: 'POST', body: { email: epost, password: passord, data: { brukernavn } },
    });
    if (!r.ok) {
      const m = String((r.data && (r.data.msg || r.data.error_description || r.data.message)) || '');
      if (/password/i.test(m)) return json({ feil: 'passord', melding: 'Passordet er for svakt. Bruk minst 8 tegn og gjerne tall.' }, 400);
      if (r.status === 429) return json({ feil: 'grense', melding: 'For mange forsøk. Vent litt og prøv igjen.' }, 429);
      return json({ feil: 'server', melding: 'Fikk ikke laget kontoen. Prøv igjen om litt.' }, 400);
    }
    const bruker = r.data.user || r.data;
    const nyKonto = bruker && bruker.id && (!Array.isArray(bruker.identities) || bruker.identities.length > 0);
    if (nyKonto) {
      try { await rpc('sett_brukernavn', { p_user: bruker.id, p_brukernavn: brukernavn }); } catch (e) { console.warn('Brukernavn feilet:', (e as Error).message); }
    }
    // Er e-postbekreftelse skrudd av i Supabase, kommer det en innlogging med én gang
    if (r.data.access_token) return json({ ok: true, access_token: r.data.access_token, refresh_token: r.data.refresh_token });
    return json({ ok: true, bekreft: true });
  } catch (e) {
    console.warn('Registrering feilet:', (e as Error).message);
    return json({ feil: 'server', melding: 'Fikk ikke laget kontoen akkurat nå. Prøv igjen om litt.' }, 503);
  }
};
