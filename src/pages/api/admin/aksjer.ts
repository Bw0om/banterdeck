// Admin: statistikk for aksjene i Vorsbørsen – hvilke som blir kjøpt, og hvilke som faktisk skjer. Anonymt.
import type { APIRoute } from 'astro';
import { rpc } from '../../../lib/spilt';
import { json, adminBruker } from '../../../lib/konto';
import { HVEM, JANEI, HVEM_KAT, JANEI_KAT, KATEGORIER } from '../../../lib/bors';
export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const admin = await adminBruker(request).catch(() => null);
  if (!admin) return json({ feil: 'nei', melding: 'Logg inn med admin-kontoen.' }, 403);
  let rader: any[] = [];
  try { rader = (await rpc('admin_bors_stat', {})) || []; }
  catch (e) { return json({ feil: 'server', melding: 'Fikk ikke hentet statistikken. Har du kjørt gjengkveld-supabase.sql?' }, 503); }
  const kart: Record<string, any> = {}; rader.forEach((r: any) => { kart[r.nokkel] = r; });
  // Alle aksjene som finnes, også de som aldri er vist
  const alle = HVEM.map((q, i) => ({ nokkel: 'h' + i, q: q.no, type: 'hvem', kat: HVEM_KAT[i] }))
    .concat(JANEI.map((q, i) => ({ nokkel: 'j' + i, q: q.no, type: 'janei', kat: JANEI_KAT[i] })))
    .map((a) => {
      const r = kart[a.nokkel] || {};
      return { ...a, vist: r.vist || 0, kjop: r.kjop || 0, kjopere: r.kjopere || 0, meldt: r.meldt || 0, avgjort: r.avgjort || 0, skjedde: r.skjedde || 0, vinnere: r.vinnere || 0 };
    });
  let egne: any[] = [];
  try { egne = (await rpc('admin_bors_egne', {})) || []; } catch { /* bors-egne-supabase.sql ikke kjørt */ }
  return json({ aksjer: alle, kategorier: KATEGORIER.map((k) => ({ id: k.id, navn: k.no })), egne });
};
