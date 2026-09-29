// Banterdeck Pluss: hvem som har Pluss, og betaling med Vipps (ePayment-API-et).
// Miljøvariabler i Vercel: VIPPS_CLIENT_ID, VIPPS_CLIENT_SECRET, VIPPS_SUBSCRIPTION_KEY, VIPPS_MSN,
// og VIPPS_TEST=1 mens du tester mot Vipps sitt testmiljø.
import { rpc } from './spilt';

export const PRODUKTER: Record<string, { navn: string; ore: number; beskrivelse: string }> = {
  kveld: { navn: 'Kveldspass', ore: 2900, beskrivelse: 'Banterdeck Pluss i 24 timer' },
  aar: { navn: 'Årspass', ore: 19900, beskrivelse: 'Banterdeck Pluss i ett år' },
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
    'Vipps-System-Name': 'banterdeck', 'Vipps-System-Version': '1.0',
    'Vipps-System-Plugin-Name': 'banterdeck-web', 'Vipps-System-Plugin-Version': '1.0',
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
    throw new Error('Vipps svarte ' + r.status);
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
  if (b.status === 'fullfort') return 'fullfort';
  if (b.status === 'avbrutt') return 'avbrutt';
  const r = await vipps('/epayment/v1/payments/' + encodeURIComponent(ref));
  if (!r.ok || !r.data) return 'venter';
  const state = r.data.state, agg = r.data.aggregate || {};
  if (state === 'AUTHORIZED') {
    const tatt = agg.capturedAmount ? Number(agg.capturedAmount.value) : 0;
    if (tatt < b.belop_ore) {
      const c = await vipps('/epayment/v1/payments/' + encodeURIComponent(ref) + '/capture', {
        method: 'POST', idem: 'cap-' + ref, body: { modificationAmount: { currency: 'NOK', value: b.belop_ore } },
      });
      if (!c.ok) return 'venter';
    }
    await rpc('betaling_fullfor', { p_ref: ref });
    return 'fullfort';
  }
  if (state === 'ABORTED' || state === 'EXPIRED' || state === 'TERMINATED') {
    await rpc('betaling_avbryt', { p_ref: ref });
    return 'avbrutt';
  }
  return 'venter';
}
