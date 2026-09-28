// «Ukens lek»: én lek fremheves hver uke. Samme valg på forsiden og i fredagsvarselet.
export const UKENS_LEKER = [
  'ring-of-fire', 'regelfabrikken', 'bussruta', 'forraeder', 'drikke-bingo', 'pyramiden', 'veddelopet', 'president',
  'drikke-yatzy', 'tanken-bak-sangen', 'kategorier', 'gris', 'to-sannheter-og-en-logn', 'opus', 'over-eller-under', 'pekeleken',
];
/** ISO-ukenummer som ett tall (år*100 + uke), regnet i norsk tid. */
export function ukeNr(d = new Date()) {
  const o = new Date(d.toLocaleString('en-US', { timeZone: 'Europe/Oslo' }));
  const t = new Date(Date.UTC(o.getFullYear(), o.getMonth(), o.getDate()));
  const dag = (t.getUTCDay() + 6) % 7; t.setUTCDate(t.getUTCDate() - dag + 3);
  const aar = t.getUTCFullYear(), jan4 = new Date(Date.UTC(aar, 0, 4));
  return aar * 100 + 1 + Math.round(((t.getTime() - jan4.getTime()) / 86400000 - 3 + ((jan4.getUTCDay() + 6) % 7)) / 7);
}
export function ukensLek(d = new Date(), liste = UKENS_LEKER) {
  const n = ukeNr(d);
  return liste[(Math.floor(n / 100) * 53 + (n % 100)) % liste.length];
}
