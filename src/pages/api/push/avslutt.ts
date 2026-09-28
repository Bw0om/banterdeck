import type { APIRoute } from 'astro';
import { rpc } from '../../../lib/spilt';
import { json } from '../../../lib/konto';
export const prerender = false;
export const POST: APIRoute = async ({ request }) => {
  let d: any;
  try { d = await request.json(); } catch { return json({ feil: 'ugyldig' }, 400); }
  const ep = String(d.endpoint || '');
  if (!/^https:\/\//.test(ep) || ep.length > 1000) return json({ feil: 'ugyldig' }, 400);
  try { await rpc('push_fjern', { p_endpoint: ep }); return json({ ok: true }); }
  catch { return json({ feil: 'server' }, 503); }
};
