// Felles for kontoene på serveren. Service-nøkkelen brukes bare til databasefunksjonene (rpc),
// mens selve innloggingen går mot Supabase Auth med den offentlige anon-nøkkelen.
import { supabaseServer } from './spilt';
import { PYNT } from './pynt.js';
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

/** Ting bare én konto får: eieren (Bw0om) og Ida. Kontoen i miljøvariabelen, ellers brukernavnet.
    Eieren (som designer appen) har i tillegg alt som ikke er laget for én bestemt person (alt: true). */
const EKSKLUSIV: { navn: string; env: string; ting: string[]; alt?: boolean }[] = [
  { navn: 'bw0om', env: 'EIER_KONTO', ting: ['eierkrone', 'axolotl'], alt: true },
  { navn: 'ida', env: 'IDA_KONTO', ting: ['idakrans', 'idapanda'] },
];
const ALT_VANLIG: string[] = (PYNT as any[]).filter((p) => !p.eier).map((p) => p.id);
const navnSvar = new Map<string, string>();
async function brukernavnFor(userId: string) {
  if (navnSvar.has(userId)) return navnSvar.get(userId)!;
  try {
    const { url, nokkel } = supabaseServer();
    const r = await fetch(`${url}/rest/v1/profiler?select=brukernavn&user_id=eq.${encodeURIComponent(userId)}`, { headers: { apikey: nokkel, Authorization: `Bearer ${nokkel}` } });
    const rader: any = r.ok ? await r.json() : [];
    const navn = String((Array.isArray(rader) && rader[0] && rader[0].brukernavn) || '').toLowerCase();
    navnSvar.set(userId, navn);
    return navn;
  } catch { return ''; }
}
export async function eksklusivFor(userId: string) {
  if (!userId) return [] as string[];
  const env: any = (typeof process !== 'undefined' && process.env) || {};
  let navn: string | null = null;
  const ut: string[] = [];
  for (const e of EKSKLUSIV) {
    const faste = String(env[e.env] || '').split(',').map((x) => x.trim()).filter(Boolean);
    let ja: boolean;
    if (faste.length) ja = faste.includes(userId);
    else { if (navn === null) navn = await brukernavnFor(userId); ja = navn === e.navn; }
    if (ja) { ut.push(...e.ting); if (e.alt) ut.push(...ALT_VANLIG); }
  }
  return ut;
}
export async function erEier(userId: string) { return (await eksklusivFor(userId)).includes('eierkrone'); }
/** Pynten kontoen har låst opp, med de eksklusive tingene lagt til for eieren og Ida. */
export async function laastFor(userId: string, laast: string[]) {
  const ut = Array.isArray(laast) ? laast.slice() : [];
  (await eksklusivFor(userId)).forEach((id) => { if (!ut.includes(id)) ut.push(id); });
  return ut;
}
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
  // Må også ha bekreftet e-posten, så ingen kan registrere seg med en admin-adresse de ikke eier
  return adminEposter().includes(String(u.email || '').toLowerCase()) && (u.email_confirmed_at || u.confirmed_at) ? u : null;
}
