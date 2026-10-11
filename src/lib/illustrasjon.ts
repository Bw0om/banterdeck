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
import BANNERE from '../data/bannere.json';
const EGNE = new Set<string>(BANNERE as string[]);
/** Eget banner for leken (public/illustrasjoner/lek/<slug>.svg), ellers et felles motiv for gruppa. */
export const illustrasjon = (g: any) => (g && EGNE.has(g.slug) ? `/illustrasjoner/lek/${g.slug}.svg` : `/illustrasjoner/${motiv(g)}.svg`);

// Bildene limt rett inn i siden (ikke <img>), så «hold inne»-animasjonene i stua.css når inn i dem
const RAA = import.meta.glob('../../public/illustrasjoner/**/*.svg', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
/** Lekens bilde som inline SVG med class="lekebilde". Finnes ikke fila, blir det en vanlig <img>. */
export function lekebilde(g: any): string {
  const sti = illustrasjon(g);
  const nokkel = Object.keys(RAA).find((k) => k.endsWith('/public' + sti));
  const svg = nokkel ? RAA[nokkel] : '';
  if (!svg) return `<img class="lekebilde" src="${sti}" alt="" width="240" height="126" loading="lazy" decoding="async">`;
  return svg.replace('<svg ', '<svg class="lekebilde" aria-hidden="true" focusable="false" ');
}
