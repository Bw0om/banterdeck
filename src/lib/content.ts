import raw from '../data/content.json';

export const sections: any[] = raw as any[];
export const catSections = sections.filter((s) => s.id !== 'spill');
export const spill = sections.find((s) => s.id === 'spill');

/** Henter norsk tekst fra {no,sv,en}-objekter eller rene strenger. */
export function t(o: any): string {
  if (!o) return '';
  return typeof o === 'string' ? o : o.no || '';
}

export function slugify(s: string): string {
  return s.toLowerCase()
    .replace(/æ/g, 'ae').replace(/ø/g, 'o').replace(/å/g, 'a')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export const games: any[] = spill.groups.flatMap((g: any) =>
  g.items.map((it: any) => ({ ...it, slug: slugify(t(it.name)), groupTitle: t(g.title) }))
);

export function isCrude(it: any): boolean {
  return /grov|mørk/i.test(it.note || '');
}

export function countSection(s: any): number {
  return s.groups.reduce((n: number, g: any) => n + g.items.length, 0);
}

export const totals = {
  lines: catSections.filter((s) => s.id !== 'ordbok').reduce((n, s) => n + countSection(s), 0),
  words: countSection(sections.find((s) => s.id === 'ordbok')),
  games: games.length,
};
