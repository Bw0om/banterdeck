// Alle rundene ligger som JSON i src/data/nyhetsrunden/ (én fil per uke, f.eks. 2026-39.json).
// Den automatiske jobben legger til en ny fil hver torsdag.
const filer = import.meta.glob('../data/nyhetsrunden/*.json', { eager: true }) as Record<string, any>;
export const runder: any[] = Object.values(filer)
  .map((m: any) => m.default || m)
  .sort((a, b) => b.aar - a.aar || b.uke - a.uke);
export const sisteRunde = runder[0];
export const rundeId = (r: any) => `${r.aar}-${String(r.uke).padStart(2, '0')}`;
