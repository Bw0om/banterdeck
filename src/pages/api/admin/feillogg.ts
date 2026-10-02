// Admin: den automatiske feilloggen (anonym, se /api/feil og feillogg-supabase.sql).
// GET ?dager=30 lister feilene. POST { fjern: nokkel } fjerner en feil som er fikset.
import type { APIRoute } from 'astro';
import { rpc } from '../../../lib/spilt';
import { json, adminBruker } from '../../../lib/konto';
export const prerender = false;

const ikkeAdmin = () => json({ feil: 'nei', melding: 'Logg inn med admin-kontoen.' }, 403);

export const GET: APIRoute = async ({ request, url }) => {
  if (!(await adminBruker(request).catch(() => null))) return ikkeAdmin();
  const dager = Math.max(1, Math.min(365, Number(url.searchParams.get('dager')) || 30));
  try { return json({ liste: (await rpc('feillogg_liste', { p_dager: dager })) || [], dager }); }
  catch { return json({ feil: 'server', melding: 'Fikk ikke hentet feilloggen. Har du kjørt feillogg-supabase.sql?' }, 503); }
};

export const POST: APIRoute = async ({ request }) => {
  if (!(await adminBruker(request).catch(() => null))) return ikkeAdmin();
  let d: any;
  try { d = await request.json(); } catch { return json({ ok: false }, 400); }
  const nokkel = String((d && d.fjern) || '').replace(/[^a-f0-9]/g, '').slice(0, 64);
  if (nokkel.length < 8) return json({ ok: false, melding: 'Mangler hvilken feil.' }, 400);
  try { await rpc('feillogg_fjern', { p_nokkel: nokkel }); return json({ ok: true }); }
  catch { return json({ ok: false, melding: 'Fikk ikke fjernet feilen.' }, 503); }
};
