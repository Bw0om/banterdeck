// Offentlig oppsett som appen trenger når den bygges (GitHub bygger iPhone-appen, se .github/workflows/ios.yml):
// Supabase-adressen og den offentlige nøkkelen. Begge ligger allerede åpent i hver side på nettet (KontoKlient),
// så dette avslører ingenting nytt. Den private servernøkkelen sendes aldri.
import type { APIRoute } from 'astro';
import { supabaseUrl, supabaseAnonKey } from '../../config';
export const prerender = false;
export const GET: APIRoute = async () =>
  new Response(JSON.stringify({ url: supabaseUrl().replace(/\/$/, ''), anon: supabaseAnonKey() }), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600' },
  });
