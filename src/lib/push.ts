// Web push: nøklene (VAPID) ligger i miljøvariablene på Vercel.
import webpush from 'web-push';
import { rpc } from './spilt';

function env() { return ((typeof process !== 'undefined' && process.env) || {}) as any; }
export function offentligNokkel() { return String(env().VAPID_PUBLIC_KEY || ''); }

export function gyldigAbonnement(sub: any) {
  return sub && typeof sub.endpoint === 'string' && /^https:\/\//.test(sub.endpoint) && sub.endpoint.length < 1000 &&
    sub.keys && typeof sub.keys.p256dh === 'string' && typeof sub.keys.auth === 'string' &&
    sub.keys.p256dh.length < 200 && sub.keys.auth.length < 100;
}

/** Sender samme melding til alle som abonnerer på et emne. Fjerner utgåtte abonnementer. */
export async function sendTilAlle(emne: string, melding: { tittel: string; tekst: string; url: string }) {
  const e = env();
  if (!e.VAPID_PUBLIC_KEY || !e.VAPID_PRIVATE_KEY) throw new Error('VAPID-nøklene mangler');
  webpush.setVapidDetails(e.VAPID_SUBJECT || 'mailto:post@mittvors.no', e.VAPID_PUBLIC_KEY, e.VAPID_PRIVATE_KEY);
  const mottakere: any[] = (await rpc('push_mottakere', { p_emne: emne })) || [];
  const data = JSON.stringify({ title: melding.tittel, body: melding.tekst, url: melding.url });
  let sendt = 0;
  for (let i = 0; i < mottakere.length; i += 50) {
    await Promise.all(mottakere.slice(i, i + 50).map(async (m) => {
      try {
        await webpush.sendNotification({ endpoint: m.endpoint, keys: m.nokler }, data, { TTL: 60 * 60 * 12, urgency: 'normal' });
        sendt++;
      } catch (err: any) {
        if (err && (err.statusCode === 404 || err.statusCode === 410)) await rpc('push_fjern', { p_endpoint: m.endpoint }).catch(() => null);
      }
    }));
  }
  return { mottakere: mottakere.length, sendt };
}
