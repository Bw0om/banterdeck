// Serverfunksjon: teller at en lek eller situasjon ble åpnet. Anonymt – bare hva, aldri hvem.
import type { APIRoute } from 'astro';
import { GYLDIGE, rpc } from '../../lib/spilt';
export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  let d: any;
  try { d = await request.json(); } catch { return new Response(null, { status: 400 }); }
  const type = String(d.type || ''), ref = String(d.ref || '');
  if (!GYLDIGE[type] || !GYLDIGE[type].has(ref)) return new Response(null, { status: 400 });
  try { await rpc('registrer_spilt', { p_type: type, p_ref: ref }); }
  catch (e) { console.warn('Telling feilet:', (e as Error).message); }   // tellingen skal aldri ødelegge siden
  return new Response(null, { status: 204 });
};
