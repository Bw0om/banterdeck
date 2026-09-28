// Kalles hvert 5. minutt av Supabase (og én gang om dagen av Vercel som reserve).
// Sender varsel én gang per runde, rett etter at den er sluppet. Ellers gjør den ingenting,
// så det er ufarlig at hvem som helst kan kalle adressen.
import type { APIRoute } from 'astro';
import { rpc } from '../../../lib/spilt';
import { json } from '../../../lib/konto';
import { sendTilAlle, offentligNokkel } from '../../../lib/push';
import { sjekkBetaling, vippsKlar } from '../../../lib/pluss';
import { alleRunder, publiseringstid, rundeId } from '../../../lib/nyhetsrunden';
import { ukensLek } from '../../../lib/ukenslek';
import { games, t } from '../../../lib/content';
export const prerender = false;

const kjor: APIRoute = async () => {
  await ryddBetalinger();
  const naa = Date.now();
  // Bare runder sluppet de siste 48 timene – gamle uker gir aldri varsel
  const runde = alleRunder.find((r) => { const t = publiseringstid(r); return t <= naa && t > naa - 48 * 3600 * 1000; });
  if (!runde) return json({ ok: true, sendt: 0, grunn: 'ingen ny runde' });
  if (!offentligNokkel()) return json({ ok: false, grunn: 'VAPID-nøklene mangler i Vercel' }, 503);
  const ref = 'nyhetsrunden-' + rundeId(runde);
  try {
    const forst = await rpc('varsel_krev', { p_ref: ref });
    if (!forst) return json({ ok: true, sendt: 0, grunn: 'allerede sendt' });
    const antall = (runde.sporsmal || []).length;
    const r = await sendTilAlle('nyhetsrunden', {
      tittel: `Nyhetsrunden uke ${runde.uke} er ute 🍻`,
      tekst: (runde.ingress ? String(runde.ingress).slice(0, 110) : `${antall} spørsmål fra ukas nyheter.`) + ukensTekst(),
      url: '/no/nyhetsrunden',
    });
    await rpc('varsel_ferdig', { p_ref: ref, p_antall: r.sendt }).catch(() => null);
    return json({ ok: true, ...r });
  } catch (e) {
    console.warn('Varsel feilet:', (e as Error).message);
    return json({ feil: 'server' }, 503);
  }
};
export const GET = kjor;
export const POST = kjor;

function ukensTekst() {
  const g = games.find((x: any) => x.slug === ukensLek());
  return g ? ` · Ukens lek: ${t(g.name, 'no')}` : '';
}

/** Kjøp der noen lukket fanen før de kom tilbake fra Vipps: sjekk dem, så Pluss likevel kommer. */
async function ryddBetalinger() {
  if (!vippsKlar()) return;
  try {
    const apne: any[] = (await rpc('betalinger_apne', {})) || [];
    for (const b of apne.slice(0, 20)) await sjekkBetaling(b.ref).catch(() => null);
  } catch { /* tabellen finnes kanskje ikke ennå */ }
}
