// Mitt vors Pluss: hvem som har Pluss, og betaling med Vipps (ePayment-API-et).
// Miljøvariabler i Vercel: VIPPS_CLIENT_ID, VIPPS_CLIENT_SECRET, VIPPS_SUBSCRIPTION_KEY, VIPPS_MSN,
// og VIPPS_TEST=1 mens du tester mot Vipps sitt testmiljø.
import { rpc, supabaseServer } from './spilt';
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { epostKlar, sendEpost, kvitteringEpost } from './epost';

export const PRODUKTER: Record<string, { navn: string; ore: number; beskrivelse: string }> = {
  kveld: { navn: 'Kveldspass', ore: 2900, beskrivelse: 'Mitt vors Pluss i 24 timer' },
  aar: { navn: 'Årspass', ore: 19900, beskrivelse: 'Mitt vors Pluss i ett år' },
};

function env(): any { return (typeof process !== 'undefined' && process.env) || {}; }
export function vippsKlar() { const e = env(); return !!(e.VIPPS_CLIENT_ID && e.VIPPS_CLIENT_SECRET && e.VIPPS_SUBSCRIPTION_KEY && e.VIPPS_MSN); }
function base() { const e = env(); return (e.VIPPS_BASE_URL || (e.VIPPS_TEST === '1' || e.VIPPS_TEST === 'true' ? 'https://apitest.vipps.no' : 'https://api.vipps.no')).replace(/\/$/, ''); }

/* ---------- Pluss-status ---------- */
export async function plussStatus(userId: string): Promise<{ aktiv: boolean; til: string | null; gratisBrukt: boolean; kveldspass: number }> {
  const s = await rpc('pluss_status', { p_user: userId });
  return { aktiv: !!(s && s.aktiv), til: (s && s.til) || null, gratisBrukt: !!(s && s.gratisBrukt), kveldspass: Number((s && s.kveldspass) || 0) };
}
export async function harPluss(userId: string) {
  try { return (await plussStatus(userId)).aktiv; } catch { return false; }
}

/* ---------- Vipps ---------- */
let tokenCache: { token: string; utloper: number } | null = null;
async function vippsToken() {
  if (tokenCache && tokenCache.utloper > Date.now() + 60000) return tokenCache.token;
  const e = env();
  const r = await fetch(base() + '/accesstoken/get', {
    method: 'POST',
    headers: { client_id: e.VIPPS_CLIENT_ID, client_secret: e.VIPPS_CLIENT_SECRET, 'Ocp-Apim-Subscription-Key': e.VIPPS_SUBSCRIPTION_KEY, 'Merchant-Serial-Number': e.VIPPS_MSN },
  });
  if (!r.ok) throw new Error('Vipps-innlogging feilet (' + r.status + ')');
  const d: any = await r.json();
  tokenCache = { token: d.access_token, utloper: Date.now() + (Number(d.expires_in) || 3000) * 1000 };
  return tokenCache.token;
}
async function vipps(sti: string, init: { method?: string; body?: any; idem?: string } = {}) {
  const e = env();
  const h: Record<string, string> = {
    Authorization: 'Bearer ' + (await vippsToken()),
    'Ocp-Apim-Subscription-Key': e.VIPPS_SUBSCRIPTION_KEY,
    'Merchant-Serial-Number': e.VIPPS_MSN,
    'Content-Type': 'application/json',
    'Vipps-System-Name': 'mittvors', 'Vipps-System-Version': '1.0',
    'Vipps-System-Plugin-Name': 'mittvors-web', 'Vipps-System-Plugin-Version': '1.0',
  };
  if (init.idem) h['Idempotency-Key'] = init.idem;
  const r = await fetch(base() + sti, { method: init.method || 'GET', headers: h, body: init.body ? JSON.stringify(init.body) : undefined });
  const tekst = await r.text();
  let data: any = null; try { data = tekst ? JSON.parse(tekst) : null; } catch { data = null; }
  return { ok: r.ok, status: r.status, data };
}

export function nyRef() {
  const a = new Uint8Array(10); crypto.getRandomValues(a);
  return 'bd-' + Array.from(a, (x) => x.toString(16).padStart(2, '0')).join('');
}

/** Starter en betaling og gir adressen brukeren sendes til i Vipps. */
export async function startBetaling(userId: string, produkt: string, returUrl: string) {
  const p = PRODUKTER[produkt]; if (!p) throw new Error('Ukjent produkt');
  const ref = nyRef();
  await rpc('betaling_lag', { p_ref: ref, p_user: userId, p_produkt: produkt, p_belop: p.ore });
  const r = await vipps('/epayment/v1/payments', {
    method: 'POST', idem: ref,
    body: {
      amount: { currency: 'NOK', value: p.ore },
      paymentMethod: { type: 'WALLET' },
      reference: ref,
      returnUrl: returUrl + (returUrl.includes('?') ? '&' : '?') + 'ref=' + ref,
      userFlow: 'WEB_REDIRECT',
      paymentDescription: p.beskrivelse,
    },
  });
  if (!r.ok || !r.data || !r.data.redirectUrl) {
    await rpc('betaling_avbryt', { p_ref: ref }).catch(() => null);
    throw new Error('Vipps svarte ' + r.status + ': ' + JSON.stringify(r.data || {}).slice(0, 400));
  }
  return { ref, url: r.data.redirectUrl as string };
}

/**
 * Sjekker en betaling hos Vipps. Er den godkjent, trekkes pengene (digital vare levert med en gang)
 * og Pluss forlenges. Trygt å kalle mange ganger.
 */
export async function sjekkBetaling(ref: string): Promise<'fullfort' | 'venter' | 'avbrutt'> {
  const b = await rpc('betaling_hent', { p_ref: ref });
  if (!b) return 'avbrutt';
  if (b.status === 'fullfort') { await sendKvittering(ref); return 'fullfort'; }
  if (b.status === 'avbrutt' || b.status === 'refundert') return 'avbrutt';
  const r = await vipps('/epayment/v1/payments/' + encodeURIComponent(ref));
  if (!r.ok || !r.data) { console.warn('Vipps-sjekk ' + ref + ' svarte ' + r.status + ': ' + JSON.stringify(r.data || {}).slice(0, 300)); return 'venter'; }
  const state = r.data.state, agg = r.data.aggregate || {};
  if (state === 'AUTHORIZED') {
    const tatt = agg.capturedAmount ? Number(agg.capturedAmount.value) : 0;
    if (tatt < b.belop_ore) {
      const c = await vipps('/epayment/v1/payments/' + encodeURIComponent(ref) + '/capture', {
        method: 'POST', idem: 'cap-' + ref, body: { modificationAmount: { currency: 'NOK', value: b.belop_ore } },
      });
      if (!c.ok) { console.warn('Vipps-capture ' + ref + ' svarte ' + c.status + ': ' + JSON.stringify(c.data || {}).slice(0, 300)); return 'venter'; }
    }
    await rpc('betaling_fullfor', { p_ref: ref });
    await sendKvittering(ref);
    return 'fullfort';
  }
  if (state === 'ABORTED' || state === 'EXPIRED' || state === 'TERMINATED') {
    await rpc('betaling_avbryt', { p_ref: ref });
    return 'avbrutt';
  }
  return 'venter';
}

/* ---------- kvittering på e-post ---------- */
async function epostFor(userId: string): Promise<string> {
  const { url, nokkel } = supabaseServer();
  const r = await fetch(`${url}/auth/v1/admin/users/${encodeURIComponent(userId)}`, { headers: { apikey: nokkel, Authorization: `Bearer ${nokkel}` } });
  if (!r.ok) return '';
  const u: any = await r.json();
  return (u && (u.email || (u.user && u.user.email))) || '';
}
/** Sender kvitteringen én gang per kjøp. Feiler sendingen, prøves det igjen neste gang betalingen sjekkes. */
export async function sendKvittering(ref: string) {
  if (!epostKlar()) return;
  try {
    const fikk = await rpc('betaling_kvittering_krev', { p_ref: ref });
    if (fikk !== true) return;
    try {
      const b = await rpc('betaling_hent', { p_ref: ref });
      const til = b && b.user_id ? await epostFor(b.user_id) : '';
      if (!til) return;
      const k = kvitteringEpost(b, 'https://www.mittvors.no/no/kvittering?ref=' + encodeURIComponent(ref));
      await sendEpost(til, k.emne, k.html, k.tekst);
    } catch (e) {
      await rpc('betaling_kvittering_frigi', { p_ref: ref }).catch(() => null);
      throw e;
    }
  } catch (e) {
    console.warn('Kvittering på e-post feilet:', (e as Error).message);
  }
}

/* ---------- refusjon ---------- */
/** Refunderer et fullført kjøp i Vipps og tar tilbake Pluss-tiden. */
export async function refunderBetaling(ref: string): Promise<{ ok: boolean; melding?: string }> {
  const b = await rpc('betaling_hent', { p_ref: ref });
  if (!b) return { ok: false, melding: 'Fant ikke kjøpet.' };
  if (b.status === 'refundert') return { ok: true };
  if (b.status !== 'fullfort') return { ok: false, melding: 'Bare fullførte kjøp kan refunderes.' };
  const r = await vipps('/epayment/v1/payments/' + encodeURIComponent(ref) + '/refund', {
    method: 'POST', idem: 'ref-' + ref, body: { modificationAmount: { currency: 'NOK', value: b.belop_ore } },
  });
  if (!r.ok) {
    console.warn('Vipps-refusjon ' + ref + ' svarte ' + r.status + ': ' + JSON.stringify(r.data || {}).slice(0, 300));
    return { ok: false, melding: 'Vipps godtok ikke refusjonen (' + r.status + ((r.data && (r.data.detail || r.data.title)) ? ': ' + (r.data.detail || r.data.title) : '') + ').' };
  }
  await rpc('betaling_refunder', { p_ref: ref });
  return { ok: true };
}

/* ---------- opprydding ---------- */
/** Sjekker betalinger som ble startet men aldri fullført hos oss (lukket fane o.l.). */
export async function ryddBetalinger(maks = 20) {
  if (!vippsKlar()) return 0;
  let n = 0;
  try {
    const apne: any[] = (await rpc('betalinger_apne', {})) || [];
    for (const b of apne.slice(0, maks)) { if ((await sjekkBetaling(b.ref).catch(() => 'venter')) === 'fullfort') n++; }
  } catch { /* tabellen finnes kanskje ikke ennå */ }
  return n;
}

/* ---------- Vipps-varsel (webhook) ---------- */
export function vippsMiljo(): 'test' | 'prod' { const e = env(); return e.VIPPS_TEST === '1' || e.VIPPS_TEST === 'true' ? 'test' : 'prod'; }
const HENDELSER = ['epayments.payment.authorized.v1', 'epayments.payment.aborted.v1', 'epayments.payment.expired.v1', 'epayments.payment.terminated.v1'];

/** Registrerer adressen hos Vipps, og lagrer hemmeligheten i databasen. Erstatter en tidligere registrering. */
export async function registrerWebhook(url: string) {
  const miljo = vippsMiljo();
  const gammel = await rpc('vipps_webhook_hent', { p_miljo: miljo }).catch(() => null);
  if (gammel && gammel.id) await vipps('/webhooks/v1/webhooks/' + encodeURIComponent(gammel.id), { method: 'DELETE' }).catch(() => null);
  const r = await vipps('/webhooks/v1/webhooks', { method: 'POST', body: { url, events: HENDELSER } });
  if (!r.ok || !r.data || !r.data.secret) throw new Error('Vipps svarte ' + r.status + ': ' + JSON.stringify(r.data || {}).slice(0, 300));
  await rpc('vipps_webhook_lagre', { p_miljo: miljo, p_id: r.data.id, p_secret: r.data.secret, p_url: url });
  webhookCache = null;
  return { id: r.data.id, url, miljo };
}
export async function fjernWebhook() {
  const miljo = vippsMiljo();
  const w = await rpc('vipps_webhook_hent', { p_miljo: miljo }).catch(() => null);
  if (w && w.id) await vipps('/webhooks/v1/webhooks/' + encodeURIComponent(w.id), { method: 'DELETE' }).catch(() => null);
  await rpc('vipps_webhook_slett', { p_miljo: miljo });
  webhookCache = null;
}
/** Hva vi har lagret, og hva Vipps faktisk har registrert. */
export async function webhookStatus() {
  const miljo = vippsMiljo();
  const w = await rpc('vipps_webhook_hent', { p_miljo: miljo }).catch(() => null);
  const r = vippsKlar() ? await vipps('/webhooks/v1/webhooks').catch(() => null) : null;
  const liste: any[] = (r && r.ok && r.data && (r.data.webhooks || r.data)) || [];
  const hosVipps = Array.isArray(liste) && !!(w && liste.some((x: any) => x.id === w.id));
  return { miljo, registrert: !!w, url: w ? w.url : null, laget: w ? w.laget : null, hosVipps, antallHosVipps: Array.isArray(liste) ? liste.length : 0 };
}

let webhookCache: { miljo: string; w: any; t: number } | null = null;
async function webhookHemmelighet() {
  const miljo = vippsMiljo();
  if (webhookCache && webhookCache.miljo === miljo && Date.now() - webhookCache.t < 5 * 60000) return webhookCache.w;
  const w = await rpc('vipps_webhook_hent', { p_miljo: miljo });
  webhookCache = { miljo, w, t: Date.now() };
  return w;
}
function likt(a: string, b: string) {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
/** Sjekker at et varsel faktisk kommer fra Vipps (HMAC-SHA256, se Vipps sin dokumentasjon). */
export async function gyldigWebhook(request: Request, kropp: string): Promise<boolean> {
  const w = await webhookHemmelighet();
  if (!w || !w.secret) return false;
  const dato = request.headers.get('x-ms-date') || '';
  const hash = request.headers.get('x-ms-content-sha256') || '';
  const auth = request.headers.get('authorization') || '';
  if (!dato || !hash || !auth) return false;
  if (!likt(createHash('sha256').update(kropp, 'utf8').digest('base64'), hash)) return false;
  const u = new URL(request.url), registrert = new URL(w.url);
  const vert = registrert.host;                       // samme vert som adressen vi registrerte
  const sti = registrert.pathname + registrert.search || u.pathname + u.search;
  const signatur = createHmac('sha256', w.secret).update('POST\n' + sti + '\n' + dato + ';' + vert + ';' + hash).digest('base64');
  return likt('HMAC-SHA256 SignedHeaders=x-ms-date;host;x-ms-content-sha256&Signature=' + signatur, auth);
}
