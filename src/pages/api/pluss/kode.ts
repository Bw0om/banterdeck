// Løs inn en gavekode for Pluss.
import type { APIRoute } from 'astro';
import { rpc } from '../../../lib/spilt';
import { json, innloggetBruker } from '../../../lib/konto';
export const prerender = false;
export const POST: APIRoute = async ({ request }) => {
  let d: any;
  try { d = await request.json(); } catch { return json({ feil: 'ugyldig' }, 400); }
  const kode = String(d.kode || '').trim().toUpperCase().replace(/\s+/g, '');
  if (!/^[A-Z0-9-]{4,24}$/.test(kode)) return json({ feil: 'ugyldig', melding: 'Sjekk at koden er skrevet riktig.' }, 400);
  try {
    const u = await innloggetBruker(request);
    if (!u) return json({ feil: 'logg-inn', melding: 'Logg inn eller lag en gratis konto for å bruke koden.' }, 401);
    const r = await rpc('gavekode_los', { p_kode: kode, p_user: u.id });
    if (!r || !r.ok) return json({ feil: 'kode', melding: (r && r.melding) || 'Koden virket ikke.' }, 400);
    return json({ ok: true, dager: r.dager, ...r.status });
  } catch (e) {
    console.warn('Gavekode feilet:', (e as Error).message);
    return json({ feil: 'server', melding: 'Det gikk ikke akkurat nå. Prøv igjen.' }, 503);
  }
};
