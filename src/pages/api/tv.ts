// TV-kobling: TV-en ber om en kode (POST) og spør etter romkode + PIN (GET ?k=) til verten har skannet QR-koden.
import type { APIRoute } from 'astro';
import { lagTvKobling, hentTvKobling, gyldigKode } from '../../lib/rom';
export const prerender = false;

const json = (d: any, status = 200) =>
  new Response(JSON.stringify(d), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

export const POST: APIRoute = async () => {
  try { return json({ kode: await lagTvKobling() }); }
  catch { return json({ feil: 'server' }, 503); }
};

export const GET: APIRoute = async ({ url }) => {
  const k = String(url.searchParams.get('k') || '').toUpperCase();
  if (!gyldigKode(k)) return json({ feil: 'ugyldig' }, 400);
  try {
    const r = await hentTvKobling(k);
    return r ? json(r) : json({ feil: 'utlopt' }, 404);
  } catch { return json({ feil: 'server' }, 503); }
};
