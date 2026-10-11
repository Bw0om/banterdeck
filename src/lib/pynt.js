// Pynt til figuren i stua, og temaer for stua. Felles for server (rom.ts), telefonene og TV-en.
// Alt er gratis og låses opp ved å spille. Sesongting kan bare låses opp og brukes i sesongen – de kommer igjen neste år.

/** Hva figuren kan ha på seg. slot: hode | ansikt | bryst | venn (kjæledyr ved siden av). */
export const PYNT = [
  { id: 'partyhatt', slot: 'hode', navn: ['Partyhatt', 'Party hat'], laas: ['Spill din første kveld', 'Play your first night'], kvelder: 1 },
  { id: 'krone', slot: 'hode', navn: ['Krone', 'Crown'], laas: ['Vinn kvelden', 'Win the night'], kaaring: 'vinner' },
  { id: 'glorie', slot: 'hode', navn: ['Glorie', 'Halo'], laas: ['Slipp unna med færrest slurker', 'Get away with the fewest sips'], kaaring: 'slapp' },
  { id: 'cowboyhatt', slot: 'hode', navn: ['Cowboyhatt', 'Cowboy hat'], laas: ['Bryt ringen i Ring of Fire', 'Break the ring in Ring of Fire'], kaaring: 'ring' },
  { id: 'topphatt', slot: 'hode', navn: ['Flosshatt', 'Top hat'], laas: ['Bli Børskongen', 'Become the Market king'], kaaring: 'bors' },
  { id: 'hjelm', slot: 'hode', navn: ['Hjelm', 'Helmet'], laas: ['Bli Mest mobbet', 'Be the most picked on'], kaaring: 'mobbet' },
  { id: 'lue', slot: 'hode', navn: ['Gjenglue', 'Crew beanie'], laas: ['Spill en kveld med gjengen din', 'Play a night with your crew'], gjeng: true },
  { id: 'nisselue', slot: 'hode', navn: ['Nisselue', 'Santa hat'], laas: ['Spill en kveld i desember', 'Play a night in December'], sesong: 'jul' },
  { id: 'solbriller', slot: 'ansikt', navn: ['Solbriller', 'Sunglasses'], laas: ['Bli Kveldens tørstigste', 'Be thirstiest of the night'], kaaring: 'torst' },
  { id: 'nerdebriller', slot: 'ansikt', navn: ['Quizbriller', 'Quiz glasses'], laas: ['Bli Quizmester', 'Become Quiz master'], kaaring: 'quiz' },
  { id: 'medalje', slot: 'bryst', navn: ['Medalje', 'Medal'], laas: ['Spill ti kvelder', 'Play ten nights'], kvelder: 10 },
  { id: 'sloyfe', slot: 'bryst', navn: ['17. mai-sløyfe', '17 May ribbon'], laas: ['Spill en kveld i mai', 'Play a night in May'], sesong: '17mai' },
  { id: 'hund', slot: 'venn', navn: ['Hund', 'Dog'], laas: ['Bli Mest gavmild', 'Be the most generous'], kaaring: 'gavmild' },
  { id: 'katt', slot: 'venn', navn: ['Katt', 'Cat'], laas: ['Spill tre kvelder', 'Play three nights'], kvelder: 3 },
  { id: 'and', slot: 'venn', navn: ['And', 'Duck'], laas: ['Spill fem kvelder', 'Play five nights'], kvelder: 5 },
];
export const SLOTS = ['hode', 'ansikt', 'bryst', 'venn'];
const AV_ID = Object.fromEntries(PYNT.map((p) => [p.id, p]));

/** Stua kan se annerledes ut. Pluss-temaene velger verten når rommet har Pluss. Julebordstua er gratis i desember. */
export const TEMAER = [
  { id: 'stue', navn: ['Stua', 'The living room'], pluss: false },
  { id: 'hytte', navn: ['Hytta', 'The cabin'], pluss: false },
  { id: 'takterrasse', navn: ['Takterrassen', 'The rooftop'], pluss: true },
  { id: 'julebord', navn: ['Julebordet', 'The Christmas party'], pluss: true, gratisI: 'jul' },
];

/** Hvilken sesong det er nå (norsk tid): 'jul' fra 24. november ut året, '17mai' 1.–17. mai, ellers null. */
export function sesong(naa) {
  const d = new Date(naa || Date.now());
  const o = new Date(d.toLocaleString('en-US', { timeZone: 'Europe/Oslo' }));
  const m = o.getMonth() + 1, dag = o.getDate();
  if ((m === 11 && dag >= 24) || m === 12) return 'jul';
  if (m === 5 && dag <= 17) return '17mai';
  return null;
}
/** Kan pynten brukes nå? Sesongpynt bare i sesongen. */
export function kanBrukes(id, naa) { const p = AV_ID[id]; return !!p && (!p.sesong || p.sesong === sesong(naa)); }

/** Rens et valg {hode, ansikt, bryst, venn}: bare kjente id-er, i riktig slot, låst opp, og i sesong. */
export function rensPynt(valg, laast, naa) {
  const ut = {};
  if (!valg || typeof valg !== 'object') return ut;
  const har = new Set(laast || []);
  SLOTS.forEach((s) => {
    const id = valg[s]; const p = typeof id === 'string' ? AV_ID[id] : null;
    if (p && p.slot === s && har.has(id) && kanBrukes(id, naa)) ut[s] = id;
  });
  return ut;
}

/**
 * Hva som låses opp når kvelden er over. kaaringer: [{kode, id}] (kode = vinner/torst/slapp/ring/bors/quiz/gavmild/mobbet),
 * spillere: [{id, konto}], kvelder: {konto: antall kvelder etter denne}. Gir {konto: [pynt-id …]}.
 */
export function laasOppForKveld({ kaaringer, spillere, kvelder, gjengKveld, naa }) {
  const ut = {};
  const gi = (konto, id) => { if (!konto || !id) return; (ut[konto] = ut[konto] || []).includes(id) || ut[konto].push(id); };
  const s = sesong(naa);
  (spillere || []).forEach((p) => {
    if (!p.konto) return;
    const n = (kvelder && kvelder[p.konto]) || 0;
    PYNT.forEach((x) => {
      if (x.kvelder && n >= x.kvelder) gi(p.konto, x.id);
      if (x.gjeng && gjengKveld) gi(p.konto, x.id);
      if (x.sesong && x.sesong === s) gi(p.konto, x.id);
    });
  });
  (kaaringer || []).forEach((k) => {
    const x = PYNT.find((p) => p.kaaring === k.kode); if (!x) return;
    const p = (spillere || []).find((sp) => sp.id === k.id);
    if (p) gi(p.konto, x.id);
  });
  return ut;
}

export function pyntNavn(id, lang) { const p = AV_ID[id]; return p ? p.navn[lang === 'en' ? 1 : 0] : id; }
export function temaFor(id) { return TEMAER.find((t) => t.id === id) || TEMAER[0]; }
/** Kan rommet bruke temaet? Pluss-temaer krever Pluss i rommet, unntatt i sesongen der temaet er gratis. */
export function temaLov(id, harPluss, naa) { const t = temaFor(id); return !t.pluss || !!harPluss || (t.gratisI && t.gratisI === sesong(naa)); }

/** Figuren ser lik ut hver kveld for en konto: en kort nøkkel laget av konto-id-en (aldri selve id-en). */
export function figurNokkel(konto) {
  let h = 2166136261; const t = String(konto);
  for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619); }
  return 'k' + (h >>> 0).toString(36);
}
