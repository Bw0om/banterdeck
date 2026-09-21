import raw from '../data/content.json';
import type { Lang } from './i18n';

export const sections: any[] = raw as any[];

/**
 * Noe innhold finnes bare på ett språk – gamle norske ord og fornemme vendinger
 * lar seg ikke oversette. Slike seksjoner og grupper merkes med `only: 'no'`
 * og vises kun der.
 */
export function visible(x: any, lang: Lang = 'no'): boolean {
  return !x || !x.only || x.only === lang;
}
export function langSections(lang: Lang = 'no'): any[] {
  return sections.filter((s) => visible(s, lang));
}
export function langGroups(s: any, lang: Lang = 'no'): any[] {
  return (s.groups || []).filter((g: any) => visible(g, lang));
}
/** Oppføringene i en gruppe som vises på dette språket (en replikk kan være kun norsk). */
export function itemsOf(g: any, lang: Lang = 'no'): any[] {
  return (g.items || []).filter((it: any) => visible(it, lang));
}

export const catSections = sections.filter((s) => s.id !== 'spill');
/** Replikker sortert etter situasjon (alt unntatt ordbok og drikkeleker). */
export function situationSectionsFor(lang: Lang = 'no'): any[] {
  return sections.filter((s) => s.id !== 'spill' && s.id !== 'ordbok' && visible(s, lang));
}
export const situationSections = sections.filter((s) => s.id !== 'spill' && s.id !== 'ordbok');
/** Ordboka – egen toppnivå-seksjon. */
export const dictSection = sections.find((s) => s.id === 'ordbok');
export function dictItemsFor(lang: Lang = 'no'): any[] {
  return langGroups(dictSection, lang).flatMap((g: any) => itemsOf(g, lang));
}
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

export function countSection(s: any, lang: Lang = 'no'): number {
  if (!visible(s, lang)) return 0;
  return langGroups(s, lang).reduce((n: number, g: any) => n + itemsOf(g, lang).length, 0);
}

export function totalsFor(lang: Lang = 'no') {
  return {
    lines: situationSectionsFor(lang).reduce((n, s) => n + countSection(s, lang), 0),
    words: countSection(dictSection, lang),
    games: games.length,
  };
}
export const totals = totalsFor('no');

/* ---------------- Situasjoner: hva som skjer, på tvers av kategoriene ---------------- */
import situationsRaw from '../data/situations.json';
export const situationThemes: any[] = situationsRaw as any[];
export const allSituations: any[] = situationThemes.flatMap((th: any) => th.items.map((x: any) => ({ ...x, theme: th })));
export function situationById(id: string) { return allSituations.find((x) => x.id === id); }

/** Alle replikker som hører til en situasjon, med kategorien de kommer fra. */
export function itemsForSituation(id: string, lang: Lang = 'no'): { it: any; s: any; g: any }[] {
  const out: { it: any; s: any; g: any }[] = [];
  for (const s of langSections(lang)) {
    for (const g of langGroups(s, lang)) {
      if (g.type === 'dict' || g.type === 'game') continue; // bare replikker her
      for (const it of itemsOf(g, lang)) if ((it.sit || []).includes(id)) out.push({ it, s, g });
    }
  }
  return out;
}

/** Ord, uttrykk og ordtak fra ordboka som passer til en situasjon. */
export function dictForSituation(id: string, lang: Lang = 'no'): { it: any; g: any }[] {
  if (!visible(dictSection, lang)) return [];
  const out: { it: any; g: any }[] = [];
  for (const g of langGroups(dictSection, lang)) {
    for (const it of itemsOf(g, lang)) if ((it.sit || []).includes(id)) out.push({ it, g });
  }
  return out;
}
/** Stabil anker-id for en ordbokoppføring, så situasjonssidene kan lenke rett til den. */
export function dictAnchor(word: string): string {
  return 'd-' + slugify(word);
}
/** Situasjoner som faktisk har innhold på dette språket. */
export function situationsFor(lang: Lang = 'no'): any[] {
  return allSituations
    .map((x) => ({ ...x, count: itemsForSituation(x.id, lang).length }))
    .filter((x) => x.count > 0);
}

/* ---------------- Samlinger: innhold som ikke er svar på en situasjon ---------------- */
export function collectionsFor(lang: Lang = 'no'): any[] {
  return sections.filter((s) => s.kind === 'collection' && visible(s, lang));
}
/** De mest brukte øyeblikkene – til hurtigvalg. */
export function topSituationsFor(lang: Lang = 'no'): any[] {
  return situationsFor(lang).filter((x) => x.top).sort((a, b) => a.top - b.top);
}

/**
 * Kort «stikkord» fra en kontekst, til bruk på situasjonssider der du allerede vet
 * situasjonen. «Når noen sier «stol på meg»» blir «stol på meg»,
 * «Når printeren streiker» blir «Printeren streiker».
 */
const STRIP: Record<string, RegExp[]> = {
  no: [/^Når noen /i, /^Når du /i, /^Når de /i, /^Når /i, /^Til den som /i, /^Til en som /i, /^Til en /i,
       /^Til /i, /^Etter en /i, /^Etter et /i, /^Etter å /i, /^Etter /i, /^Om en /i, /^Om /i, /^Som svar på /i, /^På noen /i],
  en: [/^When someone /i, /^When you /i, /^When /i, /^To whoever is /i, /^To someone /i, /^To a /i, /^To /i,
       /^After a /i, /^After an /i, /^After /i, /^On a /i, /^On /i, /^In response to /i, /^Every time you /i],
};
export function cueText(ctx: string, lang: Lang = 'no'): string {
  if (!ctx) return '';
  const q = ctx.match(/[«“"]([^»”"]+)[»”"]/);
  if (q) return `«${q[1]}»`;
  let out = ctx;
  for (const r of STRIP[lang] || STRIP.no) { if (r.test(out)) { out = out.replace(r, ''); break; } }
  return out.charAt(0).toUpperCase() + out.slice(1);
}

/** Gamle situasjonsadresser som er slått sammen eller har fått nytt navn. */
export const situationAliases: Record<string, string> = {
  'heading-home': 'pickup-lines',
  'someone-brags': 'tall-tales',
  'offers': 'questions',
  'wont-come-out': 'about-drinking',
};
