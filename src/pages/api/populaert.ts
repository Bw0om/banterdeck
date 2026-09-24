// Serverfunksjon: det mest spilte de siste sju dagene. Mellomlagres i ti minutter hos Vercel.
import type { APIRoute } from 'astro';
import { rpc } from '../../lib/spilt';
export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const rader = await rpc('populaert', { p_dager: 7, p_antall: 8 });
    return new Response(JSON.stringify(rader || []), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600' },
    });
  } catch (e) {
    console.warn('Populært feilet:', (e as Error).message);
    return new Response('[]', { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, s-maxage=60' } });
  }
};
