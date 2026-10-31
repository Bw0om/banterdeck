// Kategorikongen: spørsmålsbanken ligger som JSON i src/data/quiz/ (én fil per kategori, f.eks. musikk.json).
// Hver fil: { id, navn, droy, sporsmal: [{ q, alt: [4], svar: 0–3, niva: 1–3, info }] }. Drøye kategorier (droy: true)
// koster to slurker for feil svar i stedet for én. Nye kategorier legges til ved å legge en fil i mappa.
const filer = import.meta.glob('../data/quiz/*.json', { eager: true }) as Record<string, any>;

export type QuizSporsmal = { q: string; alt: string[]; svar: number; niva?: number; info?: string };
export type QuizKategori = { id: string; navn: string; droy: boolean; sporsmal: QuizSporsmal[] };

export const KATEGORIER: QuizKategori[] = Object.values(filer)
  .map((m: any) => m.default || m)
  .filter((k: any) => k && typeof k.id === 'string' && Array.isArray(k.sporsmal) && k.sporsmal.length)
  .map((k: any) => ({ id: k.id, navn: String(k.navn || k.id), droy: !!k.droy,
    sporsmal: k.sporsmal.filter((s: any) => s && s.q && Array.isArray(s.alt) && s.alt.length === 4 && s.svar >= 0 && s.svar < 4) }))
  .sort((a: QuizKategori, b: QuizKategori) => a.navn.localeCompare(b.navn, 'nb'));

export function kategori(id: string): QuizKategori | undefined { return KATEGORIER.find((k) => k.id === id); }
export const ANTALL_SPORSMAL = KATEGORIER.reduce((n, k) => n + k.sporsmal.length, 0);
