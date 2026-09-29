// Daglig opprydding (Vercel Cron): fullfører betalinger som ble godkjent i Vipps men aldri sjekket hos oss.
import type { APIRoute } from 'astro';
import { json } from '../../../lib/konto';
import { ryddBetalinger } from '../../../lib/pluss';
export const prerender = false;
let sist = 0;
export const GET: APIRoute = async () => {
  if (Date.now() - sist < 60000) return json({ ok: true, hoppet: true });
  sist = Date.now();
  return json({ ok: true, fullfort: await ryddBetalinger(40) });
};
