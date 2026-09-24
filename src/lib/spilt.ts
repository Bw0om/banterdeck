// Felles for tellingen av hva som blir spilt. Bare disse referansene godtas av serveren.
import { games, allSituations } from './content';
export const GYLDIGE: Record<string, Set<string>> = {
  lek: new Set(games.map((g: any) => g.slug)),
  situasjon: new Set(allSituations.map((s: any) => s.id)),
};
/** Supabase-adresse og servernøkkel, lest ved kjøring på Vercel. */
export function supabaseServer() {
  const env: any = (typeof process !== 'undefined' && process.env) || {};
  const url = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || env.PUBLIC_SUPABASE_URL || '';
  const nokkel = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SECRET_KEY || '';
  return { url: url.replace(/\/$/, ''), nokkel };
}
export async function rpc(navn: string, args: any) {
  const { url, nokkel } = supabaseServer();
  if (!url || !nokkel) throw new Error('Supabase mangler i miljøvariablene');
  const r = await fetch(`${url}/rest/v1/rpc/${navn}`, {
    method: 'POST',
    headers: { apikey: nokkel, Authorization: `Bearer ${nokkel}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  });
  if (!r.ok) throw new Error(`Supabase svarte ${r.status}: ${(await r.text()).slice(0, 200)}`);
  const tekst = await r.text();
  return tekst ? JSON.parse(tekst) : null;
}
