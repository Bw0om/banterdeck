// Illustrasjon for hver lek (public/illustrasjoner/<motiv>.svg), valgt ut fra gruppa, med noen unntak.
const GRUPPE: Record<string, string> = {
  kort: 'kort', sporsmal: 'bobler', musikk: 'musikk', terninger: 'terning', kopper: 'kopper',
  prover: 'quiz', regler: 'bobler', skjerm: 'skjerm', brett: 'kort', blikjent: 'bobler',
};
const UNNTAK: Record<string, string> = {
  'forraeder': 'telefoner', 'regelfabrikken': 'telefoner', 'hvem-skrev-det': 'telefoner', 'bloffquizen': 'telefoner',
  'samme-svar': 'telefoner', 'spionen': 'telefoner', 'hemmelig-oppdrag': 'telefoner', 'hvem-er-jeg': 'telefoner',
  'power-hour': 'klokke', 'skal-refleksen': 'klokke', 'stilleleken': 'klokke', 'drikkehjulet': 'hjul', 'gjett-aret': 'quiz',
  'drikke-bingo': 'musikk', '100-sporsmal': 'bobler', '50-50': 'bobler', 'jug': 'kopper', 'rask-fakta': 'kopper',
};
export function motiv(g: any): string {
  if (!g) return 'kort';
  return UNNTAK[g.slug] || GRUPPE[g.group && g.group.id] || 'bobler';
}
export const illustrasjon = (g: any) => `/illustrasjoner/${motiv(g)}.svg`;
