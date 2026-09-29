// Felles for kontoene på serveren. Service-nøkkelen brukes bare til databasefunksjonene (rpc),
// mens selve innloggingen går mot Supabase Auth med den offentlige anon-nøkkelen.
import { supabaseServer } from './spilt';
import { supabaseAnonKey } from '../config';

export const json = (d: any, status = 200) =>
  new Response(JSON.stringify(d), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

export function anon() {
  const { url } = supabaseServer();
  return { url, nokkel: supabaseAnonKey() };
}

/** Kaller Supabase Auth som en vanlig nettleser ville gjort. */
export async function auth(sti: string, init: { method?: string; body?: any; token?: string } = {}) {
  const { url, nokkel } = anon();
  if (!url || !nokkel) throw new Error('Supabase mangler i miljøvariablene');
  const r = await fetch(url + '/auth/v1' + sti, {
    method: init.method || 'GET',
    headers: {
      apikey: nokkel,
      Authorization: 'Bearer ' + (init.token || nokkel),
      'Content-Type': 'application/json',
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
  });
  const tekst = await r.text();
  let data: any = null;
  try { data = tekst ? JSON.parse(tekst) : null; } catch { data = null; }
  return { ok: r.ok, status: r.status, data };
}

/** Hvem er innlogget? Leser Bearer-tokenen fra forespørselen og spør Supabase. */
export async function innloggetBruker(request: Request) {
  const h = request.headers.get('authorization') || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : '';
  if (!token) return null;
  const r = await auth('/user', { token });
  return r.ok && r.data && r.data.id ? r.data : null;
}

export const BRUKERNAVN = /^[A-Za-z0-9_.-]{3,20}$/;
export const gyldigEpost = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) && e.length <= 200;

/** Adressene som får se statistikksiden, fra miljøvariabelen ADMIN_EPOSTER (kommaseparert). */
export function adminEposter() {
  const env: any = (typeof process !== 'undefined' && process.env) || {};
  return String(env.ADMIN_EPOSTER || '').split(',').map((x) => x.trim().toLowerCase()).filter(Boolean);
}

/** Innlogget konto med e-post i ADMIN_EPOSTER, ellers null. */
export async function adminBruker(request: Request) {
  const u = await innloggetBruker(request);
  if (!u) return null;
  return adminEposter().includes(String(u.email || '').toLowerCase()) ? u : null;
}
