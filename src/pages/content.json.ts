// Innholdet som JSON – brukes av søk og terning i nettleseren.
// Hver replikk får situasjonsnavnene på begge språk (_s), så søket treffer
// «drar tidlig» selv om selve replikken ikke inneholder de ordene.
import type { APIRoute } from 'astro';
import { sections, situationById } from '../lib/content';

export const GET: APIRoute = () => {
  const out = sections.map((s: any) => ({
    ...s,
    groups: s.groups.map((g: any) => ({
      ...g,
      items: g.items.map((it: any) => {
        if (!it.sit) return it;
        const names = it.sit.map(situationById).filter(Boolean)
          .map((x: any) => `${x.title.no} ${x.title.en}`).join(' ');
        return { ...it, _s: names };
      }),
    })),
  }));
  return new Response(JSON.stringify(out), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
