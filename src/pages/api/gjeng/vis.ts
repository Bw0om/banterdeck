// Sesongtabellen til én gjeng. Alle med gjengkoden kan se den (bare navn og tall).
import type { APIRoute } from 'astro';
import { rpc } from '../../../lib/spilt';
import { json, innloggetBruker } from '../../../lib/konto';
import { visLov } from '../../../lib/lov';
export const prerender = false;
export const GET: APIRoute = async ({ request }) => {
  const kode = String(new URL(request.url).searchParams.get('k') || '').trim().toUpperCase();
  if (!/^[A-Z0-9]{8}$/.test(kode)) return json({ feil: 'kode', melding: 'Ugyldig gjengkode.' }, 400);
  try {
    const g = await rpc('gjeng_hent', { p_kode: kode });
    if (!g) return json({ feil: 'finnes-ikke', melding: 'Fant ikke gjengen. Kanskje den er slettet?' }, 404);
    // Hvem som eier gjengen avsløres ikke – bare om det er deg
    let eier = false, medlem = false;
    const u = await innloggetBruker(request).catch(() => null);
    if (u) {
      eier = g.eier === u.id;
      medlem = eier || !!(await rpc('gjeng_tilgang', { p_user: u.id, p_id: g.id }));
    }
    // Lovboka (Gjengens lov) – uten konto-id-er. Finnes ikke tabellen ennå, vises den bare ikke.
    let lovbok = null;
    try { const l = await rpc('gjeng_lov_hent', { p_gjeng: g.id }); if (l) lovbok = visLov(l.lov, medlem && u ? u.id : null, /^en/.test(request.headers.get('x-lang') || '') ? 'en' : 'no'); } catch { /* ikke satt opp */ }
    return json({ id: g.id, navn: g.navn, kode: g.kode, kvelder: g.kvelder || [], eier, medlem, innlogget: !!u, lovbok });
  } catch (e) {
    console.warn('Gjeng kunne ikke hentes:', (e as Error).message);
    return json({ feil: 'server', melding: 'Fikk ikke hentet gjengen akkurat nå.' }, 503);
  }
};
