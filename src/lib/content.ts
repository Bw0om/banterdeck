import raw from '../data/content.json';
import type { Lang } from './i18n';

export const sections: any[] = raw as any[];
export const catSections = sections.filter((s) => s.id !== 'spill');
/** Replikker sortert etter situasjon (alt unntatt ordbok og drikkeleker). */
export const situationSections = sections.filter((s) => s.id !== 'spill' && s.id !== 'ordbok');
/** Ordboka – egen toppnivå-seksjon. */
export const dictSection = sections.find((s) => s.id === 'ordbok');
export const dictItems: any[] = dictSection.groups.flatMap((g: any) => g.items);
export const spill = sections.find((s) => s.id === 'spill');

/** Tekst fra {no,sv,en}-objekter eller rene strenger, med norsk som reserve. */
export function t(o: any, lang: Lang = 'no'): string {
  if (!o) return '';
  if (typeof o === 'string') return o;
  return o[lang] || o.no || '';
}

/** Felt på en replikk: line/ctx/note, oversatt hvis det finnes. */
export function tf(it: any, field: 'line' | 'ctx' | 'note', lang: Lang = 'no'): string {
  if (lang !== 'no' && it[lang]) {
    const key = { line: 'l', ctx: 'c', note: 'n' }[field];
    const v = it[lang][key];
    if (v) return v;
  }
  return it[field] || '';
}

/** Ordbokdefinisjon på valgt språk. */
export function tdef(it: any, lang: Lang = 'no'): string {
  if (lang !== 'no' && typeof it[lang] === 'string') return it[lang];
  return it.def || '';
}

/** Regler for en drikkelek på valgt språk. */
export function trules(it: any, lang: Lang = 'no'): string[] {
  return (it.rules && (it.rules[lang] || it.rules.no)) || [];
}

export function slugify(s: string): string {
  return s.toLowerCase()
    .replace(/æ/g, 'ae').replace(/ø/g, 'o').replace(/å/g, 'a')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export const games: any[] = spill.groups.flatMap((g: any) =>
  g.items.map((it: any) => ({ ...it, slug: slugify(t(it.name)), group: g }))
);

export function isCrude(it: any): boolean {
  return /grov|mørk|crude|dark/i.test(it.note || '');
}

export function countSection(s: any): number {
  return s.groups.reduce((n: number, g: any) => n + g.items.length, 0);
}

export const totals = {
  lines: catSections.filter((s) => s.id !== 'ordbok').reduce((n, s) => n + countSection(s), 0),
  words: countSection(sections.find((s) => s.id === 'ordbok')),
  games: games.length,
};
