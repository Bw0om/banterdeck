// Kjøp i iPhone-appen: appen sender Apples signerte transaksjon, vi sjekker den og gir Pluss på kontoen.
// Trygt å kalle flere ganger med samme transaksjon (gjenopprett kjøp): den gis bare én gang.
import type { APIRoute } from 'astro';
import { json, innloggetBruker } from '../../../lib/konto';
import { PRODUKTER, plussStatus } from '../../../lib/pluss';
import { sjekkAppleJws, APPLE_PRODUKTER } from '../../../lib/apple';
import { rpc } from '../../../lib/spilt';
export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  let d: any;
  try { d = await request.json(); } catch { return json({ feil: 'ugyldig' }, 400); }
  const en = (request.headers.get('x-lang') || '') === 'en';
  try {
    const u = await innloggetBruker(request);
    if (!u) return json({ feil: 'logg-inn', melding: en ? 'Sign in first, so Plus ends up on your account.' : 'Logg inn først, så havner Pluss på kontoen din.' }, 401);
    let t;
    try { t = sjekkAppleJws(d.jws); } catch (e) { return json({ feil: 'kvittering', melding: (e as Error).message }, 400); }
    const produkt = APPLE_PRODUKTER[t.productId], p = PRODUKTER[produkt];
    const ref = 'apple-' + t.transactionId;
    const finnes = await rpc('betaling_hent', { p_ref: ref });
    if (!finnes) {
      await rpc('betaling_lag', { p_ref: ref, p_user: u.id, p_produkt: produkt, p_belop: p.ore });
      await rpc('betaling_fullfor', { p_ref: ref });
    } else if (finnes.user_id && finnes.user_id !== u.id) {
      // Samme Apple-kjøp på en annen mittvors-konto: det ble brukt der
      return json({ feil: 'brukt', melding: en ? 'This purchase is already used on another account.' : 'Dette kjøpet er allerede brukt på en annen konto.' }, 409);
    }
    return json({ ok: true, ny: !finnes, produkt, miljo: t.environment, ...(await plussStatus(u.id)) });
  } catch (e) {
    console.warn('Apple-kjøp feilet:', (e as Error).message);
    return json({ feil: 'server', melding: en ? 'Couldn’t register the purchase. Try “Restore purchases” in a moment.' : 'Fikk ikke registrert kjøpet. Prøv «Gjenopprett kjøp» om litt.' }, 503);
  }
};
