// Felles for alle serverruter: avvis forespørsler som er større enn noen av API-ene våre trenger.
// Det største som sendes i dag er et komprimert bilde til Vorsbørsen (< 160 kB), så 512 kB gir god margin.
import { defineMiddleware } from 'astro:middleware';

const MAKS_BYTES = 512 * 1024;

export const onRequest = defineMiddleware((ctx, next) => {
  if (ctx.url.pathname.startsWith('/api/') && ctx.request.method !== 'GET' && ctx.request.method !== 'HEAD') {
    const lengde = Number(ctx.request.headers.get('content-length') || 0);
    if (lengde > MAKS_BYTES) {
      return new Response(JSON.stringify({ feil: 'for-stor', melding: 'Forespørselen er for stor.' }), {
        status: 413, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      });
    }
  }
  return next();
});
