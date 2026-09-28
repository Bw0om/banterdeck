// Etter Vipps: sjekk betalingen og gi Pluss hvis den er godkjent.
import type { APIRoute } from 'astro';
import { json } from '../../../lib/konto';
import { sjekkBetaling, vippsKlar } from '../../../lib/pluss';
export const prerender = false;
export const POST: APIRoute = async ({ request }) => {
  let d: any;
  try { d = await request.json(); } catch { return json({ feil: 'ugyldig' }, 400); }
  const ref = String(d.ref || '');
  if (!/^bd-[0-9a-f]{20}$/.test(ref)) return json({ feil: 'ugyldig' }, 400);
  if (!vippsKlar()) return json({ status: 'venter' });
  try { return json({ status: await sjekkBetaling(ref) }); }
  catch (e) { console.warn('Sjekk feilet:', (e as Error).message); return json({ status: 'venter' }); }
};
