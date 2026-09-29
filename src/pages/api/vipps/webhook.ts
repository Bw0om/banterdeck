// Vipps varsler hit i det øyeblikket en betaling godkjennes eller avbrytes.
// Da får kjøperen Pluss med en gang – også om de lukker Vipps før de sendes tilbake til siden.
// Varselet sjekkes med HMAC, og status hentes uansett på nytt fra Vipps før noe endres.
import type { APIRoute } from 'astro';
import { gyldigWebhook, sjekkBetaling } from '../../../lib/pluss';
export const prerender = false;
export const POST: APIRoute = async ({ request }) => {
  const kropp = await request.text();
  let ok = false;
  try { ok = await gyldigWebhook(request, kropp); } catch (e) { console.warn('Vipps-varsel: fikk ikke sjekket signaturen:', (e as Error).message); return new Response('feil', { status: 500 }); }
  if (!ok) { console.warn('Vipps-varsel med ugyldig signatur avvist.'); return new Response('ugyldig', { status: 401 }); }
  let d: any = {}; try { d = JSON.parse(kropp); } catch { return new Response('ok'); }
  const ref = String(d.reference || '');
  if (!/^bd-[0-9a-f]{20}$/.test(ref)) return new Response('ok');   // ikke vår betaling
  try {
    const status = await sjekkBetaling(ref);
    console.log('Vipps-varsel ' + (d.name || '?') + ' for ' + ref + ' → ' + status);
    return new Response('ok');
  } catch (e) {
    console.warn('Vipps-varsel for ' + ref + ' feilet:', (e as Error).message);
    return new Response('prøv igjen', { status: 500 });   // Vipps prøver igjen senere
  }
};
