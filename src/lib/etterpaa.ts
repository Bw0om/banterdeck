/**
 * Arbeid som ikke trenger å være ferdig før telefonen får svar (varsle de andre, statistikk, logging).
 * På Vercel holder waitUntil funksjonen i live til jobben er ferdig – svaret sendes med én gang.
 */
import { waitUntil } from '@vercel/functions';
export function etterpaa(p: Promise<unknown> | null | undefined) {
  if (!p) return;
  const trygg = Promise.resolve(p).catch((e) => console.warn('Etterarbeid feilet:', (e as Error)?.message));
  try { waitUntil(trygg); } catch { /* lokalt: løftet kjører uansett */ }
}
