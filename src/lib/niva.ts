// Hvor mye appen betyr for hver lek. Brukes til sortering, merker og «Prøv i appen»-forslag.
//  rom    = spilles i appen, fra hver sin telefon (kan ikke spilles uten oss – her skjer salget)
//  app    = telefonen hjelper: digital kortstokk, terning, klokke eller spørsmål
//  regler = klassikere der dere bare trenger reglene
import DECKS from '../data/decks.json';
import { ROMLEK } from './romlenke';

export type Niva = 'rom' | 'app' | 'regler';
const ROM = new Set([...Object.keys(ROMLEK), 'hemmelig-oppdrag']);
const APP = new Set(['stilleleken', ...Object.keys(DECKS as any), 'over-eller-under', 'fuck-the-dealer', 'krig', 'veddelopet', 'terningen-bestemmer',
  '21-med-terninger', 'opus', 'power-hour', 'snurr-flasken', 'beer-pong', 'rask-fakta', 'jug', '14-sporsmal', 'bossen-sier', 'gjett-aret',
  '100-sporsmal', 'nasjonal-vorsprove', 'drikkehjulet', 'tilbake-til-5-trinn']);

export function niva(slug: string): Niva {
  if (ROM.has(slug)) return 'rom';
  if (APP.has(slug)) return 'app';
  return 'regler';
}

/** Kort, fengende beskrivelse av lekene som spilles i appen. */
export const HOOK: Record<string, [string, string]> = {
  'spionen': ['Alle vet hvor dere er – bortsett fra muldvarpen. Avslør hen før hen avslører stedet.', 'Everyone knows where you are – except the mole. Unmask them before they work it out.'],
  'bloffquizen': ['Finn på et troverdig feil svar og lur de andre.', 'Make up a believable wrong answer and fool the others.'],
  'hvem-skrev-det': ['Alle svarer anonymt. Så gjetter dere hvem som skrev hva.', 'Everyone answers anonymously. Then guess who wrote what.'],
  'samme-svar': ['Tenk som de andre – den som står alene, drikker.', 'Think like the others – whoever stands alone drinks.'],
  'hvem-er-jeg': ['Du ser alles ord, bortsett fra ditt eget.', 'You see everyone’s word except your own.'],
  'skal-refleksen': ['Trykk når det står SKÅL! Treigest drikker.', 'Tap when it says CHEERS! Slowest drinks.'],
  'hemmelig-oppdrag': ['Alle får et hemmelig oppdrag som varer hele kvelden.', 'Everyone gets a secret mission that lasts all night.'],
  'nyhetsrunden': ['Ukas nyheter som quiz – ny runde hver fredag.', 'This week’s news as a quiz – a new round every Friday.'],
  'forraeder': ['Én får beskjed om å lyve. Finn løgnhalsen.', 'One person is told to lie. Find the liar.'],
  'to-sannheter-og-en-logn': ['Tre påstander – stem på løgnen fra telefonen.', 'Three statements – vote for the lie from your phone.'],
  'regelfabrikken': ['Alle skriver egne drikkekort. Så stokkes alt.', 'Everyone writes their own drinking cards. Then it all gets shuffled.'],
  'pyramiden': ['Skjulte kort på hver telefon. Bløff eller si sannheten.', 'Hidden cards on every phone. Bluff or tell the truth.'],
  'president': ['Bli kvitt kortene først – fra hver deres hånd.', 'Get rid of your cards first – each from your own hand.'],
  'gris': ['Send kort til noen har fire like. Sistemann på nesa drikker.', 'Pass cards until someone has four of a kind. Last to the nose drinks.'],
  'bussruta': ['Fire spørsmål hver, så pyramiden – taperen kjører bussen.', 'Four questions each, then the pyramid – the loser rides the bus.'],
  'drikke-yatzy': ['Trill på din telefon, alle ser blokka.', 'Roll on your phone, everyone sees the scorecard.'],
  'veddelopet': ['Vedd på en kortfarge og se løpet.', 'Bet on a suit and watch the race.'],
  'over-eller-under': ['Gjett over eller under – feil, og du drikker bunken.', 'Guess higher or lower – wrong, and you drink the pile.'],
  'drikke-bingo': ['Hver sitt brett, samme spilleliste.', 'Everyone gets their own card, same playlist.'],
  'ring-of-fire': ['Klassikeren – kortene ligger i en ring rundt glasset. Dra ut et kort uten å bryte ringen.', 'The classic – the cards lie in a ring around the glass. Pull one out without breaking the ring.'],
  'pekeleken': ['«Hvem er mest sannsynlig til …» – pek på telefonen.', '“Who’s most likely to …” – point on your phone.'],
  'jeg-har-aldri': ['Hundrevis av «Jeg har aldri» på skjermen.', 'Hundreds of “Never have I ever” on screen.'],
  'enten-eller': ['Umulige valg – alle stemmer.', 'Impossible choices – everyone votes.'],
  'kategorier': ['Si et ord i kategorien før tiden går ut.', 'Name something in the category before time runs out.'],
  'nodt-eller-sannhet': ['Nødt eller sannhet med ferdige kort.', 'Truth or dare with ready-made cards.'],
  'rygg-mot-rygg': ['Pek på den som passer – uten å se.', 'Point at who fits – without looking.'],
  'duoleken': ['Hvilket par i rommet passer best?', 'Which pair in the room fits best?'],
  '50-50': ['Ja eller nei – blir det 50/50?', 'Yes or no – will it be 50/50?'],
  'sannhet-eller-drikk': ['Svar ærlig – eller drikk.', 'Answer honestly – or drink.'],
  'tanken-bak-sangen': ['Hva tenkte egentlig artisten?', 'What was the artist really thinking?'],
};

/** Lekene man kan foreslå i stedet for en ren regellek, etter gruppe. */
const FORSLAG: Record<string, string[]> = {
  kopper: ['skal-refleksen', 'veddelopet'], musikk: ['drikke-bingo', 'tanken-bak-sangen'], regler: ['spionen', 'regelfabrikken'],
  skjerm: ['nyhetsrunden', 'bloffquizen'], brett: ['pyramiden', 'president'], kort: ['bussruta', 'pyramiden'], terninger: ['drikke-yatzy', 'veddelopet'],
  sporsmal: ['hvem-skrev-det', 'spionen'], prover: ['nyhetsrunden', 'bloffquizen'], blikjent: ['to-sannheter-og-en-logn', 'hvem-skrev-det'],
};
/** To leker som spilles i appen og ligner på denne (for regelsidene). */
export function provIAppen(g: any, synlige: any[]): any[] {
  const fra = FORSLAG[g.group && g.group.id] || ['spionen', 'hvem-skrev-det'];
  const reserve = ['spionen', 'hvem-skrev-det', 'bloffquizen', 'ring-of-fire', 'pekeleken', 'regelfabrikken'];
  const ut: any[] = [];
  for (const sl of fra.concat(reserve)) {
    const x = synlige.find((y: any) => y.slug === sl);
    if (x && x.slug !== g.slug && !ut.includes(x)) ut.push(x);
    if (ut.length === 2) break;
  }
  return ut;
}

/** Laveste og høyeste antall spillere fra «3+», «2–12», «2». */
export function spillere(pl: string): [number, number] {
  const m = String(pl || '').match(/(\d+)\s*[–-]\s*(\d+)/);
  if (m) return [Number(m[1]), Number(m[2])];
  const n = parseInt(String(pl || ''), 10) || 2;
  return /\+/.test(String(pl)) ? [n, 99] : [n, n];
}
