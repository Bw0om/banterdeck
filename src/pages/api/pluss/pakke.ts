// Kortene i en Pluss-pakke, til å spille alene med én telefon. Uten Pluss: bare tre smakebiter.
import type { APIRoute } from 'astro';
import { json, innloggetBruker } from '../../../lib/konto';
import { harPluss } from '../../../lib/pluss';
import { pakkeKort, PAKKER } from '../../../lib/rom';
export const prerender = false;
export const GET: APIRoute = async ({ request }) => {
  const id = new URL(request.url).searchParams.get('id') || '';
  const kort = pakkeKort(id);
  const info = PAKKER.find((p) => p.pakke === id);
  if (!kort || !info) return json({ feil: 'finnes-ikke' }, 404);
  const u = await innloggetBruker(request).catch(() => null);
  const pluss = u ? await harPluss(u.id) : false;
  if (pluss) return json({ navn: info.navn, pluss: true, kort: kort.map((x: any) => ({ t: x.t, k: x.k || '' })) });
  // Faste smakebiter (de tre første), så pakken ikke kan hentes ut bit for bit
  const smak = kort.slice(0, 3).map((x: any) => ({ t: x.t, k: x.k || '' }));
  return json({ navn: info.navn, pluss: false, kort: smak, antall: kort.length });
};
