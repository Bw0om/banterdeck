// Admin: gi Pluss til en konto, og lag gavekoder. Bare kontoer i ADMIN_EPOSTER slipper inn.
import type { APIRoute } from 'astro';
import { rpc } from '../../../lib/spilt';
import { json, adminBruker } from '../../../lib/konto';
export const prerender = false;

const TEGN = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function nyKode() { const a = new Uint32Array(6); crypto.getRandomValues(a); return 'BD-' + Array.from(a, (x) => TEGN[x % TEGN.length]).join(''); }

export const GET: APIRoute = async ({ request }) => {
  const admin = await adminBruker(request).catch(() => null);
  if (!admin) return json({ feil: 'nei', melding: 'Logg inn på Min stokk med admin-kontoen.' }, 403);
  const q = new URL(request.url).searchParams;
  try {
    if (q.get('koder')) return json({ koder: await rpc('gavekoder_liste', {}) });
    const sok = String(q.get('sok') || '').trim();
    if (sok.length < 3) return json({ treff: [] });
    return json({ treff: await rpc('admin_finn_bruker', { p_sok: sok }) });
  } catch (e) {
    return json({ feil: 'server', melding: 'Fikk ikke kontakt med databasen. Har du kjørt pluss-gave-supabase.sql?' }, 503);
  }
};

export const POST: APIRoute = async ({ request }) => {
  const admin = await adminBruker(request).catch(() => null);
  if (!admin) return json({ feil: 'nei', melding: 'Logg inn på Min stokk med admin-kontoen.' }, 403);
  let d: any;
  try { d = await request.json(); } catch { return json({ feil: 'ugyldig' }, 400); }
  const dager = Math.max(1, Math.min(3650, Math.round(Number(d.dager) || 0)));
  try {
    if (d.handling === 'gi') {
      if (!/^[0-9a-f-]{36}$/i.test(String(d.user_id || ''))) return json({ feil: 'ugyldig' }, 400);
      return json({ ok: true, status: await rpc('pluss_gi', { p_user: d.user_id, p_dager: dager }) });
    }
    if (d.handling === 'kode-lag') {
      const kode = String(d.kode || '').trim().toUpperCase() || nyKode();
      if (!/^[A-Z0-9-]{4,24}$/.test(kode)) return json({ feil: 'ugyldig', melding: 'Koden kan bare ha bokstaver, tall og bindestrek (4–24 tegn).' }, 400);
      const maks = Math.max(1, Math.min(10000, Math.round(Number(d.maks) || 1)));
      const utloper = d.utloper ? new Date(d.utloper).toISOString() : null;
      const notat = String(d.notat || '').slice(0, 80) || null;
      try { return json({ ok: true, kode: await rpc('gavekode_lag', { p_kode: kode, p_dager: dager, p_maks: maks, p_utloper: utloper, p_notat: notat }) }); }
      catch (e) { if (/duplicate|unique|23505/.test((e as Error).message)) return json({ feil: 'finnes', melding: 'Den koden finnes allerede.' }, 409); throw e; }
    }
    if (d.handling === 'kode-slett') { await rpc('gavekode_slett', { p_kode: String(d.kode || '') }); return json({ ok: true }); }
    return json({ feil: 'ugyldig' }, 400);
  } catch (e) {
    console.warn('Admin Pluss feilet:', (e as Error).message);
    return json({ feil: 'server', melding: 'Det gikk ikke. Har du kjørt pluss-gave-supabase.sql?' }, 503);
  }
};
