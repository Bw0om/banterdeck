// En ny konto har spilt sitt første rom: den og vennen som vervet den får hvert sitt kveldspass.
// Krav: kontoen er under 30 dager gammel, e-posten er bekreftet, og den er ikke vervet før.
import type { APIRoute } from 'astro';
import { rpc } from '../../../lib/spilt';
import { json, innloggetBruker } from '../../../lib/konto';
export const prerender = false;
export const POST: APIRoute = async ({ request }) => {
  let d: any;
  try { d = await request.json(); } catch { return json({ feil: 'ugyldig' }, 400); }
  const kode = String(d.kode || '').trim().toUpperCase();
  if (!/^[A-Z0-9]{6}$/.test(kode)) return json({ feil: 'kode', ferdig: true }, 400);
  try {
    const u = await innloggetBruker(request);
    if (!u) return json({ feil: 'logg-inn' }, 401);
    const laget = Date.parse(u.created_at || '');
    if (!laget || Date.now() - laget > 30 * 864e5) return json({ feil: 'gammel', ferdig: true, melding: 'Vervinger gjelder bare nye kontoer.' }, 409);
    if (!u.email_confirmed_at && !u.confirmed_at) return json({ feil: 'bekreft', melding: 'Bekreft e-posten din først.' }, 409);
    const r = await rpc('verv_fullfor', { p_user: u.id, p_kode: kode });
    // «ikke-spilt»: kontoen har ikke spilt et rom med andre ennå – prøv igjen senere
    if (!r || !r.ok) return json({ feil: (r && r.grunn) || 'nei', ferdig: !(r && (r.grunn === 'ikke-spilt' || r.grunn === 'bekreft')) }, 409);
    return json({ ok: true, ferdig: true });
  } catch (e) {
    console.warn('Verving kunne ikke fullføres:', (e as Error).message);
    return json({ feil: 'server', melding: 'Prøver igjen senere.' }, 503);
  }
};
