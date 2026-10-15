// Felles for alle serverruter: avvis forespørsler som er større enn noen av API-ene våre trenger.
// Det største som sendes i dag er et komprimert bilde til Vorsbørsen (< 160 kB), så 512 kB gir god margin.
import { defineMiddleware } from 'astro:middleware';

const MAKS_BYTES = 512 * 1024;
// Appen (iPhone: capacitor://localhost, Android: https://localhost) har sidene i app-pakken og kaller API-et herfra.
// Nettleseren krever at serveren sier ja til det (CORS). Ingen andre opprinnelser slippes inn.
const APP_OPPRINNELSER = new Set(['capacitor://localhost', 'https://localhost', 'http://localhost', 'ionic://localhost']);
function medCors(res: Response, opprinnelse: string, be: Request) {
  let r = res;
  try { r.headers.set('Access-Control-Allow-Origin', opprinnelse); } catch { r = new Response(res.body, res); r.headers.set('Access-Control-Allow-Origin', opprinnelse); }
  r.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  r.headers.set('Access-Control-Allow-Headers', be.headers.get('access-control-request-headers') || 'Content-Type, Authorization');
  r.headers.set('Access-Control-Max-Age', '86400');
  r.headers.append('Vary', 'Origin');
  return r;
}

export const onRequest = defineMiddleware(async (ctx, next) => {
  const api = ctx.url.pathname.startsWith('/api/');
  const opprinnelse = api ? ctx.request.headers.get('origin') || '' : '';   // bare leses for API-et (sidene bygges på forhånd)
  if (api && APP_OPPRINNELSER.has(opprinnelse)) {
    if (ctx.request.method === 'OPTIONS') return medCors(new Response(null, { status: 204 }), opprinnelse, ctx.request);
    return medCors(await next(), opprinnelse, ctx.request);
  }
  if (api && ctx.request.method !== 'GET' && ctx.request.method !== 'HEAD') {
    const lengde = Number(ctx.request.headers.get('content-length') || 0);
    if (lengde > MAKS_BYTES) {
      return new Response(JSON.stringify({ feil: 'for-stor', melding: 'Forespørselen er for stor.' }), {
        status: 413, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      });
    }
  }
  return next();
});
