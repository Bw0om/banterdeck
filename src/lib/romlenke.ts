// Hvilken lek i rommet hører til hvilken lekeside. Brukes til «Spill fra hver sin telefon»-knappene,
// så rommet lages med riktig lek valgt på forhånd.
export const ROMLEK: Record<string, string> = {
  'nyhetsrunden': 'nyhetsrunden', 'bussruta': 'bussruta', 'drikke-yatzy': 'yatzy', 'over-eller-under': 'overunder',
  'veddelopet': 'veddelopet', 'pyramiden': 'pyramiden', 'president': 'president', 'gris': 'gris',
  'to-sannheter-og-en-logn': 'tosannheter', 'regelfabrikken': 'regelfabrikken', 'forraeder': 'forraeder',
  'drikke-bingo': 'bingo', 'ring-of-fire': 'ring-of-fire', 'pekeleken': 'pekeleken', 'jeg-har-aldri': 'jeg-har-aldri',
  'enten-eller': 'enten-eller', 'kategorier': 'kategorier', 'nodt-eller-sannhet': 'nodt-eller-sannhet',
  'rygg-mot-rygg': 'rygg-mot-rygg', 'duoleken': 'duoleken', '50-50': '50-50', 'sannhet-eller-drikk': 'sannhet-eller-drikk',
  'tanken-bak-sangen': 'tanken-bak-sangen', 'hvem-skrev-det': 'hvemskrev', 'bloffquizen': 'bloff', 'samme-svar': 'samme',
  'spionen': 'spion', 'hvem-er-jeg': 'pannekort', 'skal-refleksen': 'skal',
};
/** Lenke til rommet med leken valgt. Norsk: /no/rom, engelsk: /room – samme spørreparametre. */
export function romLenke(slug: string, modus = '', lang: string = 'no') {
  const lek = ROMLEK[slug];
  const base = lang === 'en' ? '/room' : '/no/rom';
  return lek ? `${base}?lek=${encodeURIComponent(lek)}${modus ? '&modus=' + encodeURIComponent(modus) : ''}` : base;
}
