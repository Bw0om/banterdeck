// llms.txt: en ryddig oversikt over nettsiden for AI-søk og språkmodeller (se llmstxt.org).
// Lages fra de samme dataene som sidene, så den er alltid oppdatert når leker kommer til eller forsvinner.
import type { APIRoute } from 'astro';
import { sections, gamesFor, gameHref, t, trules } from '../lib/content';
import { path } from '../lib/i18n';
import GUIDER from '../data/guider.json';

const SIDE = 'https://www.mittvors.no';
const url = (p: string) => SIDE + p;
/** Første setning i reglene, uten avsluttende punktum-støy. */
const kort = (s: string) => (s.match(/^.*?[.!?](\s|$)/)?.[0] || s).trim();

export const GET: APIRoute = () => {
  const leker = gamesFor('no');
  const spill = sections.find((s: any) => s.id === 'spill');
  const ut: string[] = [];
  ut.push('# mittvors');
  ut.push('');
  ut.push(`> Norsk nettside med regler for ${leker.length} drikkeleker og festleker, leker dere spiller sammen fra hver sin telefon (med visning på TV-en), en ukentlig nyhetsquiz og replikker, ord og uttrykk. Alle drikkelekene har en alkoholfri modus.`);
  ut.push('');
  ut.push('mittvors er på norsk (/no/…) og engelsk (uten /no). Lekene er for voksne (18+). Drikk med vett.');
  ut.push('');
  ut.push('## Hovedsider');
  ut.push('');
  ut.push(`- [Drikkeleker](${url('/no/drinking-games')}): alle lekene med regler, antall spillere og utstyr.`);
  ut.push(`- [Spill sammen](${url('/no/rom')}): lag et rom, alle blir med fra sin egen telefon, og TV-en viser spørsmål og resultater. Lekene i rommet: Pekeleken, Jeg har aldri, Enten eller, Kategorier, Nødt eller sannhet, Rygg mot rygg, Låtbekjennelsen, Ring of Fire, Løgnhalsen, Skriv og drikk, Nyhetsrunden og flere.`);
  ut.push(`- [Nyhetsrunden](${url('/no/nyhetsrunden')}): ny quiz om ukas nyheter hver fredag kl. 12, med arkiv over tidligere uker.`);
  ut.push(`- [Finn lek](${url('/no/finn-lek')}): velg antall, utstyr og stemning, og få forslag til leker.`);
  ut.push(`- [Kveldsplan](${url('/no/kveld')}): en plan for hele kvelden, fra vors til nach.`);
  ut.push(`- [mittvors pluss](${url('/no/pluss')}): flere kortpakker og flere plasser i rommet.`);
  ut.push(`- [English version](${url('/drinking-games')}): the drinking games in English.`);
  ut.push('');
  ut.push('## Guider');
  ut.push('');
  for (const [id, g] of Object.entries(GUIDER as any)) ut.push(`- [${(g as any).tittel}](${url('/no/leker/' + id)}): ${(g as any).lead}`);
  ut.push('');
  for (const gruppe of (spill?.groups || [])) {
    const iGruppe = leker.filter((x: any) => x.group === gruppe);
    if (!iGruppe.length) continue;
    ut.push(`## Drikkeleker: ${t(gruppe.title, 'no')}`);
    ut.push('');
    for (const x of iGruppe) {
      const regler = trules(x, 'no'), utstyr = x.gear ? t(x.gear, 'no') : '';
      const detaljer = [x.pl ? x.pl + ' spillere' : '', utstyr && utstyr !== 'Ingen' ? 'utstyr: ' + utstyr.toLowerCase() : 'ingen utstyr'].filter(Boolean).join(', ');
      ut.push(`- [${t(x.name, 'no')}](${url(gameHref(x, (p) => path('no', p), 'no'))}): ${detaljer}. ${regler[0] ? kort(regler[0].replace(/^b\|/, '')) : ''}`.trim());
    }
    ut.push('');
  }
  ut.push('## Annet');
  ut.push('');
  ut.push(`- [Om mittvors](${url('/no/about')})`);
  ut.push(`- [Personvern](${url('/no/privacy')})`);
  ut.push(`- [Salgsvilkår](${url('/no/vilkar')})`);
  ut.push('');
  return new Response(ut.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
