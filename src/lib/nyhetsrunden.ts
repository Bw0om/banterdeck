// Alle rundene ligger som JSON i src/data/nyhetsrunden/ (én fil per uke, f.eks. 2026-39.json).
// En runde blir synlig fredag kl. 12.00 (norsk tid) i sin uke, selv om filen lastes opp tidligere.
// Vil du ha et annet tidspunkt, legg til f.eks. "publiseres": "2026-10-01T18:00" (norsk tid) i filen,
// eller "publiseres": "nå" for å vise den med én gang.
const filer = import.meta.glob('../data/nyhetsrunden/*.json', { eager: true }) as Record<string, any>;
export const alleRunder: any[] = Object.values(filer)
  .map((m: any) => m.default || m)
  .sort((a, b) => b.aar - a.aar || b.uke - a.uke);
export const rundeId = (r: any) => `${r.aar}-${String(r.uke).padStart(2, '0')}`;

/** Hvor mange minutter Oslo ligger foran UTC på et gitt tidspunkt (60 om vinteren, 120 om sommeren). */
function osloForskyvning(utcMs: number) {
  const d = new Date(utcMs);
  const p: any = {};
  new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Oslo', hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
    .formatToParts(d).forEach((x) => { p[x.type] = x.value; });
  const somUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute);
  return Math.round((somUtc - Math.floor(utcMs / 60000) * 60000) / 60000);
}
/** Norsk lokal tid → UTC-millisekunder. */
function fraOslo(aar: number, mnd: number, dag: number, time: number, min: number) {
  const gjett = Date.UTC(aar, mnd, dag, time, min);
  const f1 = osloForskyvning(gjett - 120 * 60000);
  let utc = gjett - f1 * 60000;
  const f2 = osloForskyvning(utc);
  if (f2 !== f1) utc = gjett - f2 * 60000;
  return utc;
}
/** Når runden blir synlig, i UTC-millisekunder. */
export function publiseringstid(r: any): number {
  const p = typeof r.publiseres === 'string' ? r.publiseres.trim() : '';
  if (/^n[åa]$/i.test(p)) return 0;
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/.exec(p);
  if (m) return fraOslo(+m[1], +m[2] - 1, +m[3], m[4] ? +m[4] : 12, m[5] ? +m[5] : 0);
  // Standard: fredag kl. 12.00 i ISO-uka (uke 1 er uka med 4. januar)
  const jan4 = new Date(Date.UTC(r.aar, 0, 4));
  const mandagUke1 = Date.UTC(r.aar, 0, 4 - ((jan4.getUTCDay() + 6) % 7));
  const fredag = new Date(mandagUke1 + ((r.uke - 1) * 7 + 4) * 86400000);
  return fraOslo(fredag.getUTCFullYear(), fredag.getUTCMonth(), fredag.getUTCDate(), 12, 0);
}
export const erPublisert = (r: any, naa = Date.now()) => publiseringstid(r) <= naa;
export const publiserteRunder = (naa = Date.now()) => alleRunder.filter((r) => erPublisert(r, naa));
export const sisteRunde = (naa = Date.now()) => publiserteRunder(naa)[0] || null;

/** Lite sammendrag til forsiden, så den kan velge riktig uke i nettleseren uten å vise innholdet. */
export const rundeKort = () => alleRunder.slice(0, 3).map((r) => ({ id: rundeId(r), uke: r.uke, antall: (r.sporsmal || []).length, fra: publiseringstid(r) }));
