// Admin: salgsoversikt, refusjon og Vipps-varsel. Bare kontoer i ADMIN_EPOSTER (med bekreftet e-post) slipper inn.
import type { APIRoute } from 'astro';
import { rpc } from '../../../lib/spilt';
import { json, adminBruker } from '../../../lib/konto';
import { vippsKlar, vippsMiljo, refunderBetaling, ryddBetalinger, registrerWebhook, fjernWebhook, webhookStatus, sjekkBetaling } from '../../../lib/pluss';
export const prerender = false;

const nei = () => json({ feil: 'nei', melding: 'Logg inn på Min stokk med admin-kontoen.' }, 403);
const REF = /^bd-[0-9a-f]{20}$/;

export const GET: APIRoute = async ({ request }) => {
  const admin = await adminBruker(request).catch(() => null);
  if (!admin) return nei();
  const q = new URL(request.url).searchParams;
  try {
    const sok = String(q.get('sok') || '').trim();
    if (sok) return json({ treff: sok.length < 3 ? [] : await rpc('admin_salg_sok', { p_sok: sok.slice(0, 80) }) });
    const dager = Math.max(1, Math.min(365, Number(q.get('dager')) || 30));
    const [salg, webhook] = await Promise.all([
      rpc('admin_salg', { p_dager: dager }),
      webhookStatus().catch(() => null),
    ]);
    return json({ ...salg, vipps: { klar: vippsKlar(), miljo: vippsMiljo(), webhook } });
  } catch (e) {
    console.warn('Salgsoversikt feilet:', (e as Error).message);
    return json({ feil: 'server', melding: 'Fikk ikke hentet salget. Har du kjørt salg-supabase.sql?' }, 503);
  }
};

export const POST: APIRoute = async ({ request }) => {
  const admin = await adminBruker(request).catch(() => null);
  if (!admin) return nei();
  let d: any;
  try { d = await request.json(); } catch { return json({ feil: 'ugyldig' }, 400); }
  try {
    if (d.handling === 'refunder') {
      if (!REF.test(String(d.ref || ''))) return json({ feil: 'ugyldig' }, 400);
      if (!vippsKlar()) return json({ feil: 'vipps', melding: 'Vipps-nøklene mangler i Vercel.' }, 503);
      const r = await refunderBetaling(d.ref);
      return r.ok ? json({ ok: true }) : json({ feil: 'vipps', melding: r.melding }, 409);
    }
    if (d.handling === 'sjekk') {
      if (!REF.test(String(d.ref || ''))) return json({ feil: 'ugyldig' }, 400);
      return json({ ok: true, status: await sjekkBetaling(d.ref) });
    }
    if (d.handling === 'rydd') return json({ ok: true, fullfort: await ryddBetalinger(40) });
    if (d.handling === 'webhook-registrer') {
      if (!vippsKlar()) return json({ feil: 'vipps', melding: 'Legg inn Vipps-nøklene i Vercel først.' }, 503);
      const u = new URL(request.url);
      const vert = request.headers.get('x-forwarded-host') || u.host;
      if (/^(localhost|127\.)/.test(vert)) return json({ feil: 'lokal', melding: 'Vipps kan ikke nå en lokal adresse. Gjør dette på mittvors.no.' }, 400);
      return json({ ok: true, ...(await registrerWebhook('https://' + vert + '/api/vipps/webhook')) });
    }
    if (d.handling === 'webhook-fjern') { await fjernWebhook(); return json({ ok: true }); }
    return json({ feil: 'ugyldig' }, 400);
  } catch (e) {
    console.warn('Admin salg feilet:', (e as Error).message);
    return json({ feil: 'server', melding: (e as Error).message.slice(0, 300) }, 503);
  }
};
