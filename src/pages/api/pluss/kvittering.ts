// Kvittering for et fullført kjøp. Bare kontoen som kjøpte får se den.
import type { APIRoute } from 'astro';
import { rpc } from '../../../lib/spilt';
import { json, innloggetBruker } from '../../../lib/konto';
import { PRODUKTER } from '../../../lib/pluss';
export const prerender = false;
export const GET: APIRoute = async ({ request }) => {
  const ref = String(new URL(request.url).searchParams.get('ref') || '');
  if (!/^bd-[0-9a-f]{20}$/.test(ref)) return json({ feil: 'ugyldig', melding: 'Ugyldig kvittering.' }, 400);
  try {
    const u = await innloggetBruker(request);
    if (!u) return json({ feil: 'logg-inn', melding: 'Logg inn med kontoen som kjøpte.' }, 401);
    const b = await rpc('betaling_hent', { p_ref: ref });
    if (!b || b.user_id !== u.id) return json({ feil: 'finnes-ikke', melding: 'Fant ikke kjøpet på denne kontoen.' }, 404);
    if (b.status !== 'fullfort') return json({ feil: 'ikke-fullfort', melding: 'Kjøpet er ikke fullført.' }, 409);
    const p = PRODUKTER[b.produkt] || { navn: b.produkt };
    return json({ ref: b.ref, produkt: b.produkt, navn: p.navn, belopOre: b.belop_ore, laget: b.laget, fullfort: b.fullfort, epost: u.email || '' });
  } catch (e) {
    console.warn('Kvittering feilet:', (e as Error).message);
    return json({ feil: 'server', melding: 'Fikk ikke hentet kvitteringen akkurat nå.' }, 503);
  }
};
