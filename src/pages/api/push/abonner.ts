// Lagrer at denne nettleseren vil ha varsel. Bare adressen og krypteringsnøklene lagres.
import type { APIRoute } from 'astro';
import { rpc } from '../../../lib/spilt';
import { json } from '../../../lib/konto';
import { gyldigAbonnement } from '../../../lib/push';
export const prerender = false;
const EMNER = new Set(['nyhetsrunden']);
export const POST: APIRoute = async ({ request }) => {
  let d: any;
  try { d = await request.json(); } catch { return json({ feil: 'ugyldig' }, 400); }
  const emne = String(d.emne || 'nyhetsrunden');
  if (!EMNER.has(emne) || !gyldigAbonnement(d.sub)) return json({ feil: 'ugyldig' }, 400);
  try {
    await rpc('push_lagre', { p_endpoint: d.sub.endpoint, p_nokler: { p256dh: d.sub.keys.p256dh, auth: d.sub.keys.auth }, p_emne: emne });
    return json({ ok: true });
  } catch (e) {
    console.warn('Varsel-abonnement feilet:', (e as Error).message);
    return json({ feil: 'server' }, 503);
  }
};
