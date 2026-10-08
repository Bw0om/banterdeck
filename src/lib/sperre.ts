// Hastighetsbegrensning og midlertidig sperre for innlogging.
// Innloggingen går via vår server, så Supabase ser alle forsøk fra Vercels IP – derfor teller vi selv:
// maks 10 feil per IP og 5 per konto på 15 minutter (se databasefunksjonene innlogging_sperre/_registrer).
// IP og konto lagres bare som HMAC med en hemmelig servernøkkel: kan telles, men ikke leses eller gjettes tilbake.
import { rpc, supabaseServer } from './spilt';

let nokkel: Promise<CryptoKey> | null = null;
function hentNokkel() {
  if (!nokkel) {
    const env: any = (typeof process !== 'undefined' && process.env) || {};
    const hemmelig = env.SUPABASE_JWT_SECRET || supabaseServer().nokkel || '';
    if (!hemmelig) throw new Error('Mangler hemmelig nøkkel for innloggingssperren');
    nokkel = crypto.subtle.importKey('raw', new TextEncoder().encode(hemmelig), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  }
  return nokkel;
}
async function hmac(tekst: string) {
  const sig = await crypto.subtle.sign('HMAC', await hentNokkel(), new TextEncoder().encode(tekst));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Klientens IP: Astro/Vercel gir den direkte; ellers første adresse i x-forwarded-for. */
export function klientIp(request: Request, clientAddress?: string) {
  return String(clientAddress || (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'ukjent');
}

export async function nokler(ip: string, konto: string) {
  const [ipHash, kontoHash] = await Promise.all([hmac('ip:' + ip), hmac('konto:' + konto.trim().toLowerCase())]);
  return { ipHash, kontoHash };
}

/** Sekunder til sperren løftes (0 = ikke sperret). Feiler databasen, slipper vi forsøket gjennom heller enn å stenge alle ute. */
export async function sperretSekunder(k: { ipHash: string; kontoHash: string }) {
  try { return Number(await rpc('innlogging_sperre', { p_ip_hash: k.ipHash, p_konto_hash: k.kontoHash })) || 0; }
  catch (e) { console.warn('Innloggingssperre: fikk ikke sjekket:', (e as Error).message); return 0; }
}

/** Logg forsøket (sikkerhetsloggen). Et vellykket forsøk nullstiller kontoens feiltelling. */
export async function registrerForsok(k: { ipHash: string; kontoHash: string }, ok: boolean) {
  try { await rpc('innlogging_registrer', { p_ip_hash: k.ipHash, p_konto_hash: k.kontoHash, p_ok: ok }); }
  catch (e) { console.warn('Innloggingssperre: fikk ikke logget forsøket:', (e as Error).message); }
}
