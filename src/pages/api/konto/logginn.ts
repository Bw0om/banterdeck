// Innlogging med brukernavn og passord. Serveren slår opp e-posten selv,
// så den aldri sendes til nettleseren. Svaret er bare selve innloggingen.
import type { APIRoute } from 'astro';
import { rpc } from '../../../lib/spilt';
import { auth, json, BRUKERNAVN, gyldigEpost } from '../../../lib/konto';
import { klientIp, nokler, sperretSekunder, registrerForsok } from '../../../lib/sperre';
export const prerender = false;

const FEIL = { feil: 'feil', melding: 'Feil brukernavn eller passord.' };

export const POST: APIRoute = async ({ request, clientAddress }) => {
  let d: any;
  try { d = await request.json(); } catch { return json({ feil: 'ugyldig' }, 400); }
  const navn = String(d.navn || '').trim();
  const passord = String(d.passord || '');
  if (!navn || !passord || passord.length > 72) return json(FEIL, 401);
  try {
    let epost = '';
    if (navn.includes('@')) { if (gyldigEpost(navn)) epost = navn.toLowerCase(); }
    else if (BRUKERNAVN.test(navn)) epost = (await rpc('epost_for_brukernavn', { p_brukernavn: navn })) || '';
    // Teller per konto på e-posten når vi finner den (samme sperre om man skriver brukernavn eller e-post),
    // ellers på det som ble skrevet – så ukjente brukernavn telles likt og ikke røper hvem som finnes
    const k = await nokler(klientIp(request, clientAddress), epost || navn);
    const vent = await sperretSekunder(k);
    if (vent > 0) {
      const min = Math.max(1, Math.ceil(vent / 60));
      const svar = json({ feil: 'grense', melding: 'For mange forsøk. Vent ' + min + (min === 1 ? ' minutt' : ' minutter') + ' og prøv igjen.' }, 429);
      svar.headers.set('Retry-After', String(vent));
      return svar;
    }
    if (!epost) { await registrerForsok(k, false); return json(FEIL, 401); }
    const r = await auth('/token?grant_type=password', { method: 'POST', body: { email: epost, password: passord } });
    if (!r.ok) {
      if (r.status === 429) return json({ feil: 'grense', melding: 'For mange forsøk. Vent litt og prøv igjen.' }, 429);
      const m = String((r.data && (r.data.error_description || r.data.msg || r.data.error_code)) || '');
      if (/confirm/i.test(m)) {
        // Riktig passord, men e-posten er ikke bekreftet: send en ny bekreftelseslenke med én gang
        const tilbake = new URL('/no/account', request.url).toString();
        const ny = await auth('/resend?redirect_to=' + encodeURIComponent(tilbake), { method: 'POST', body: { type: 'signup', email: epost } }).catch(() => null);
        return json({ feil: 'bekreft', melding: ny && ny.ok
          ? 'E-posten din er ikke bekreftet ennå. Vi har sendt en ny lenke – sjekk innboksen (og søppelpost).'
          : 'Bekreft e-postadressen først – sjekk innboksen. Vent et minutt før du prøver igjen hvis lenken ikke kom.' }, 401);
      }
      await registrerForsok(k, false);
      return json(FEIL, 401);
    }
    await registrerForsok(k, true);
    return json({ access_token: r.data.access_token, refresh_token: r.data.refresh_token, expires_in: r.data.expires_in });
  } catch (e) {
    console.warn('Innlogging feilet:', (e as Error).message);
    return json({ feil: 'server', melding: 'Fikk ikke logget inn akkurat nå. Prøv igjen om litt.' }, 503);
  }
};
