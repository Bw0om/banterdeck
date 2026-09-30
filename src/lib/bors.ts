/**
 * Vorsbørsen – et aksjemarked på vennene dine som går i bakgrunnen hele kvelden.
 *
 * - Alle starter med 1000 vorskroner. En vinnende aksje betaler 100 kr.
 * - Kursen settes automatisk (LMSR): jo flere som kjøper et utfall, jo dyrere blir det.
 * - «Det skjedde!»: den som melder kan legge ved bilde og/eller et vitne. Så stemmer de andre.
 * - Innsidehandel: du kan ikke kjøpe aksjer i deg selv. Samarbeid anmeldes til Børstilsynet,
 *   der handelsloggen åpnes og de som ikke er involvert stemmer (2/3 = skyldig).
 * - Egne aksjer: én per spiller per kveld, koster 200 kr å notere, verten godkjenner.
 *   Den som noterte får 2 kr i meglerhonorar per kjøp andre gjør.
 */
type Lang = 'no' | 'en';
type Tekst = { no: string; en: string };
const T = (no: string, en: string): Tekst => ({ no, en });

export const START_KR = 1000, UTBETALING = 100, NOTERING = 200, HONORAR = 2, BOT_SKYLDIG = 300, BOT_FALSK = 200;
const B = 6;                         // likviditet: lavere = kursen flytter seg mer per kjøp
const GRATIS_AKSJER = 3;             // uten Pluss (eller opplåst gjeng): så mange aksjer per kveld
const INTERVALL = 20 * 60 * 1000;    // ny aksje fra telefonen cirka hvert 20. minutt
const MAKS_APNE = 6;
const FRIST_MELDING = 90, FRIST_FORSVAR = 60, FRIST_DOM = 45;

/* ---------- aksjene ---------- */
export const HVEM: Tekst[] = [
  T('Hvem sier «jeg er ikke full» først?', 'Who says “I’m not drunk” first?'),
  T('Hvem tar ordet for en skål først?', 'Who makes the first toast?'),
  T('Hvem bestiller mat i kveld?', 'Who orders food tonight?'),
  T('Hvem sier «én til, så drar jeg» – og blir likevel?', 'Who says “one more, then I’m off” – and stays anyway?'),
  T('Hvem blir borte lengst på do?', 'Who disappears to the bathroom the longest?'),
  T('Hvem synger høyest med på neste låt?', 'Who sings along loudest to the next song?'),
  T('Hvem starter en diskusjon om politikk?', 'Who starts a political debate?'),
  T('Hvem ringer noen som ikke er her?', 'Who calls someone who isn’t here?'),
  T('Hvem glemmer igjen noe når de drar?', 'Who leaves something behind when they go?'),
  T('Hvem viser først et bilde av et kjæledyr?', 'Who shows a pet photo first?'),
  T('Hvem søler først?', 'Who spills a drink first?'),
  T('Hvem tar første selfie?', 'Who takes the first selfie?'),
  T('Hvem bytter musikken uten å spørre?', 'Who changes the music without asking?'),
  T('Hvem forteller en historie alle har hørt før?', 'Who tells a story everyone has heard before?'),
  T('Hvem sier «seriøst» flest ganger den neste halvtimen?', 'Who says “seriously” the most in the next half hour?'),
  T('Hvem blir først sulten?', 'Who gets hungry first?'),
  T('Hvem nevner jobben sin først?', 'Who mentions their job first?'),
  T('Hvem begynner å danse først?', 'Who starts dancing first?'),
  T('Hvem spør «hva er planen?» først?', 'Who asks “what’s the plan?” first?'),
  T('Hvem sjekker Snap eller Insta midt i en samtale?', 'Who checks Snap or Insta in the middle of a conversation?'),
  T('Hvem ler så mye at de må tørke tårer?', 'Who laughs so hard they have to wipe away tears?'),
  T('Hvem havner i en lang samtale på kjøkkenet?', 'Who ends up in a long conversation in the kitchen?'),
  T('Hvem tar på seg jakka først – uten å dra?', 'Who puts their jacket on first – without leaving?'),
  T('Hvem sier et kjent sitat fra en film eller serie?', 'Who quotes a famous film or TV line?'),
  T('Hvem kommer med en «fun fact» ingen ba om?', 'Who shares a fun fact nobody asked for?'),
  T('Hvem skryter av noe de har gjort på trening?', 'Who brags about something from the gym?'),
  T('Hvem finner fram en gammel låt og sier «denne er så bra»?', 'Who puts on an old song and says “this one’s so good”?'),
  T('Hvem sender en melding de burde ventet med?', 'Who sends a text they should have waited with?'),
  T('Hvem snakker med en fremmed først?', 'Who talks to a stranger first?'),
  T('Hvem tar en powernap?', 'Who takes a power nap?'),
  T('Hvem blir først kalt «pappa» eller «mamma» av gjengen?', 'Who gets called “dad” or “mum” by the group first?'),
  T('Hvem bruker lengst tid på å bestemme seg for noe?', 'Who takes the longest to make a decision?'),
  T('Hvem mister en drink eller et glass?', 'Who drops a drink or a glass?'),
  T('Hvem starter en drikkelek?', 'Who starts a drinking game?'),
  T('Hvem sier at de skal trene i morgen?', 'Who says they’re working out tomorrow?'),
  T('Hvem roper «den låta!» først?', 'Who shouts “this song!” first?'),
  T('Hvem stjeler noe snacks fra kjøkkenet?', 'Who steals snacks from the kitchen?'),
  T('Hvem tar opp et gammelt minne fra skoletida?', 'Who brings up an old school memory?'),
  T('Hvem gir noen et kompliment først?', 'Who gives someone a compliment first?'),
  T('Hvem later som de kan en dans?', 'Who pretends they know a dance?'),
  T('Hvem prøver å få gjengen til å dra videre?', 'Who tries to get everyone to head out?'),
  T('Hvem bruker en ny slangord ingen andre skjønner?', 'Who uses slang nobody else understands?'),
  T('Hvem foreslår å bestille taxi først?', 'Who suggests ordering a taxi first?'),
  T('Hvem glemmer navnet på noen?', 'Who forgets someone’s name?'),
  T('Hvem snakker om ferie først?', 'Who talks about holidays first?'),
  T('Hvem tar på seg noe som ikke er deres?', 'Who puts on something that isn’t theirs?'),
  T('Hvem sier «vi må gjøre dette oftere»?', 'Who says “we should do this more often”?'),
  T('Hvem roper «skål!» uten grunn?', 'Who shouts “cheers!” for no reason?'),
  T('Hvem forsvinner ut på balkongen først?', 'Who disappears to the balcony first?'),
  T('Hvem blir kalt ut for å jukse i en lek?', 'Who gets called out for cheating in a game?'),
  T('Hvem imiterer noen i gjengen?', 'Who does an impression of someone in the group?'),
  T('Hvem sier «jeg har en ide»?', 'Who says “I have an idea”?'),
  T('Hvem snakker om eks-jobben, eks-skolen eller eks-byen?', 'Who talks about their old job, school or town?'),
  T('Hvem starter en høylytt diskusjon om mat?', 'Who starts a loud debate about food?'),
  T('Hvem tar flest bilder i kveld?', 'Who takes the most photos tonight?'),
  T('Hvem sovner først på nach?', 'Who falls asleep first at the afterparty?'),
  T('Hvem skryter av at de ikke er sliten?', 'Who brags about not being tired?'),
  T('Hvem finner fram en quiz eller et spill på telefonen?', 'Who brings out a quiz or game on their phone?'),
  T('Hvem gir en klem til noen uten grunn?', 'Who gives someone a hug for no reason?'),
  T('Hvem snakker om været?', 'Who talks about the weather?'),
];
export const JANEI: Tekst[] = [
  T('Blir det nachspiel i kveld?', 'Will there be an afterparty tonight?'),
  T('Kommer det pizza eller annen mat i løpet av kvelden?', 'Will pizza or other food arrive tonight?'),
  T('Søler noen på sofaen eller gulvet?', 'Will anyone spill on the sofa or floor?'),
  T('Klager naboene?', 'Will the neighbours complain?'),
  T('Blir det allsang på en låt?', 'Will there be a group sing-along?'),
  T('Går noe i stykker i kveld?', 'Will something break tonight?'),
  T('Kommer det flere folk enn planlagt?', 'Will more people show up than planned?'),
  T('Er alle ute av døra før midnatt?', 'Is everyone out the door before midnight?'),
  T('Blir det dansing i stua?', 'Will there be dancing in the living room?'),
  T('Ringer noen en eks i kveld?', 'Will anyone call an ex tonight?'),
  T('Går musikken tom for batteri eller forsvinner?', 'Will the music die or cut out?'),
  T('Blir det en diskusjon som varer over ti minutter?', 'Will an argument last more than ten minutes?'),
  T('Glemmer noen igjen jakka si?', 'Will someone forget their jacket?'),
  T('Blir det kø på do?', 'Will there be a queue for the bathroom?'),
  T('Tar gjengen et gruppebilde?', 'Will the group take a group photo?'),
  T('Spiller noen en låt fra 2000-tallet?', 'Will someone play a 2000s song?'),
  T('Blir noen sendt hjem i taxi?', 'Will someone get sent home in a taxi?'),
  T('Er drikken tom før klokka 23?', 'Will the drinks run out before 11 pm?'),
  T('Kommer noen for sent til vorset?', 'Will someone turn up late to the pre-game?'),
  T('Blir det spilt en ny drikkelek i kveld?', 'Will a new drinking game be played tonight?'),
];

/* ---------- kurs (LMSR) ---------- */
function kostnad(q: number[]) { const m = Math.max(...q); return B * (m / B + Math.log(q.reduce((s, x) => s + Math.exp((x - m) / B), 0))); }
function kurser(q: number[]) { const m = Math.max(...q), e = q.map((x) => Math.exp((x - m) / B)), s = e.reduce((a, b) => a + b, 0); return e.map((x) => x / s); }
/** Hva det koster (i kr) å kjøpe n aksjer (negativt n = selge) i utfall i. */
function pris(q: number[], i: number, n: number) { const q2 = q.slice(); q2[i] += n; return Math.round(UTBETALING * (kostnad(q2) - kostnad(q))); }

/* ---------- hjelpere ---------- */
function tilfeldig(n: number) { const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] % n; }
function nyId() { const a = new Uint8Array(4); crypto.getRandomValues(a); return Array.from(a, (x) => x.toString(16).padStart(2, '0')).join(''); }
function rens(x: any, n = 120) { return String(x == null ? '' : x).replace(/[\u0000-\u001f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, n); }
function navn(data: any, id: string) { const p = data.spillere.find((x: any) => x.id === id); return p ? p.navn : '?'; }
function melde(data: any, no: string, en: string) { data.nr = (data.nr || 0) + 1; data.hendelse = { nr: data.nr, tekst: no, en }; }
function frist(sek: number) { return Date.now() + sek * 1000 + 1500; }
const ute = (f: number) => !f || Date.now() >= f - 800;
function trekk(b: any, felt: string, liste: any[]) {
  b.brukt = b.brukt || {}; const u: number[] = b.brukt[felt] || (b.brukt[felt] = []);
  if (u.length >= liste.length) u.length = 0;
  let i = tilfeldig(liste.length), v = 0; while (u.includes(i) && v++ < 200) i = tilfeldig(liste.length);
  u.push(i); return liste[i];
}
function saldo(b: any, id: string) { if (b.saldo[id] == null) b.saldo[id] = START_KR; return b.saldo[id]; }
function beholdning(a: any, id: string) { return a.hold[id] || (a.hold[id] = { n: {}, kost: 0, fikk: 0 }); }

/* ---------- aksjer ---------- */
function lagAksje(data: any, type: 'hvem' | 'janei', q: any, av: string | null = null) {
  const b = data.bors;
  const utfall = type === 'hvem' ? data.spillere.map((p: any) => p.id) : ['ja', 'nei'];
  const a: any = { id: nyId(), type, q, av, laget: Date.now(), status: av ? 'venter' : 'apen', utfall, qs: utfall.map(() => 0), hold: {}, handler: [], melding: null, vinner: null };
  b.aksjer.push(a); b.antall = (b.antall || 0) + 1;
  return a;
}
function kanNyAksje(b: any) { return b.fri || (b.antall || 0) < GRATIS_AKSJER; }
function nyAutomatisk(data: any) {
  const b = data.bors;
  if (!kanNyAksje(b) || b.aksjer.filter((a: any) => a.status === 'apen').length >= MAKS_APNE) { b.neste = Date.now() + INTERVALL; return false; }
  const hvem = b.aksjer.filter((a: any) => a.type === 'hvem').length <= b.aksjer.filter((a: any) => a.type === 'janei').length * 2;
  const a = hvem ? lagAksje(data, 'hvem', trekk(b, 'hvem', HVEM)) : lagAksje(data, 'janei', trekk(b, 'janei', JANEI));
  b.neste = Date.now() + INTERVALL;
  melde(data, '📈 Ny aksje på Vorsbørsen: ' + (a.q.no || a.q), '📈 New share on the Exchange: ' + (a.q.en || a.q));
  return true;
}
/** Nye spillere får et utfall i «hvem»-aksjer som fortsatt er åpne. */
function oppdaterUtfall(data: any) {
  (data.bors.aksjer || []).forEach((a: any) => {
    if (a.type !== 'hvem' || (a.status !== 'apen' && a.status !== 'venter')) return;
    data.spillere.forEach((p: any) => { if (!a.utfall.includes(p.id)) { a.utfall.push(p.id); a.qs.push(0); } });
  });
}
function finn(b: any, id: any) { return b.aksjer.find((a: any) => a.id === id); }

/** Utbetaling når en aksje er avgjort. Vinner = utfall-id, eller null = ugyldig (alle får kostpris tilbake). */
function oppgjor(data: any, a: any, vinner: string | null) {
  const b = data.bors;
  a.status = vinner ? 'avgjort' : 'ugyldig'; a.vinner = vinner; a.avgjort = Date.now();
  Object.entries(a.hold).forEach(([id, h]: any) => {
    const kr = vinner ? (h.n[vinner] || 0) * UTBETALING : h.kost;
    if (kr > 0) { b.saldo[id] = saldo(b, id) + kr; h.fikk = kr; }
  });
  if (b.bilder) delete b.bilder[a.id];
  a.melding = null;
}

/* ---------- start / slutt ---------- */
export function startBors(data: any, fri: boolean, fokus = false) {
  if (data.spillere.length < 3) return { feil: 'for-faa', melding: 'Vorsbørsen trenger minst tre spillere.', en: 'The Exchange needs at least three players.' };
  data.bors = { paa: true, start: Date.now(), saldo: {}, aksjer: [], saker: [], bilder: {}, noterte: {}, fri: !!fri, fokus: !!fokus, antall: 0, neste: Date.now() + INTERVALL, brukt: {} };
  data.spillere.forEach((p: any) => saldo(data.bors, p.id));
  lagAksje(data, 'hvem', trekk(data.bors, 'hvem', HVEM));
  lagAksje(data, 'janei', trekk(data.bors, 'janei', JANEI));
  melde(data, '📈 Vorsbørsen har åpnet! Alle har 1000 vorskroner.', '📈 The Pre-game Exchange is open! Everyone has 1,000 coins.');
  return { ok: true };
}
function avsluttBors(data: any) {
  const b = data.bors;
  b.aksjer.forEach((a: any) => {
    if (a.status === 'apen' || a.status === 'meldt') oppgjor(data, a, a.type === 'janei' ? 'nei' : null);
    if (a.status === 'venter') { a.status = 'avvist'; if (a.av) b.saldo[a.av] = saldo(b, a.av) + NOTERING; }
  });
  b.saker.forEach((s: any) => { if (s.fase !== 'ferdig') s.fase = 'ferdig'; });
  const rang = data.spillere.map((p: any) => ({ id: p.id, kr: saldo(b, p.id) })).sort((x: any, y: any) => y.kr - x.kr);
  b.slutt = { tid: Date.now(), rang, konge: rang[0] ? rang[0].id : null, konkurs: rang.length > 1 ? rang[rang.length - 1].id : null };
  b.paa = false;
  if (b.slutt.konge) melde(data, `📈 Børsen er stengt! ${navn(data, b.slutt.konge)} er Børskongen – ${navn(data, b.slutt.konkurs)} gikk konkurs og spinner straffehjulet 🎡`,
    `📈 The Exchange is closed! ${navn(data, b.slutt.konge)} is the Market King – ${navn(data, b.slutt.konkurs)} went bankrupt and spins the penalty wheel 🎡`);
}

/* ---------- melding: «Det skjedde!» ---------- */
function vurderMelding(data: any, a: any, tvunget = false) {
  const m = a.melding; if (!m) return;
  const tell = (v: string) => Object.entries(m.stemmer).filter(([id, x]) => x === v && id !== m.subjekt).length;
  const ja = tell('ja'), nei = tell('nei');
  const velgere = data.spillere.filter((p: any) => p.id !== m.av && p.id !== m.subjekt);
  const alle = velgere.every((p: any) => m.stemmer[p.id] != null);
  const vitneOk = !m.vitne || m.stemmer[m.vitne] === 'ja';
  const vitneNei = m.vitne && m.stemmer[m.vitne] === 'nei';
  if (!alle && !tvunget && !vitneNei) return;
  // Godkjent: vitnet (hvis valgt) sier ja, og flere ja enn nei blant dem som så det. Ingen stemmer + vitne = godkjent.
  const godkjent = !vitneNei && vitneOk && (ja > nei || (ja === 0 && nei === 0 && !!m.vitne));
  if (godkjent) {
    oppgjor(data, a, m.utfall);
    melde(data, `✅ Bekreftet: ${a.type === 'hvem' ? navn(data, m.utfall) : 'Ja'} – aksjonærene får 100 kr per aksje!`,
      `✅ Confirmed: ${a.type === 'hvem' ? navn(data, m.utfall) : 'Yes'} – shareholders get 100 per share!`);
  } else {
    a.status = 'apen'; a.melding = null; if (data.bors.bilder) delete data.bors.bilder[a.id];
    melde(data, `❌ Ikke godkjent – aksjen handles videre.`, `❌ Not confirmed – trading continues.`);
  }
}

/* ---------- Børstilsynet ---------- */
function tilsynLogg(data: any, a: any) {
  const slutt = a.avgjort || Date.now();
  // Mistenkelig: noen som til sammen kjøpte for 200 kr eller mer på vinneren de siste 15 minuttene før det skjedde
  const sum: Record<string, number> = {};
  a.handler.forEach((h: any) => { if (h.n > 0 && h.u === a.vinner && slutt - h.t < 15 * 60000) sum[h.id] = (sum[h.id] || 0) + h.kr; });
  return a.handler.map((h: any) => ({ hvem: h.id, navn: navn(data, h.id), utfall: h.u, n: h.n, kr: h.kr, t: h.t, minFor: Math.max(0, Math.round((slutt - h.t) / 60000)),
    mistenkelig: h.n > 0 && h.u === a.vinner && slutt - h.t < 15 * 60000 && (sum[h.id] || 0) >= 200 }));
}
function dom(data: any, s: any) {
  const b = data.bors, a = finn(b, s.aksje);
  const velgere = data.spillere.filter((p: any) => p.id !== s.av && !s.mot.includes(p.id));
  const skyldig = velgere.filter((p: any) => s.stemmer[p.id] === 'skyldig').length, frikjent = velgere.filter((p: any) => s.stemmer[p.id] === 'uskyldig').length;
  s.resultat = { skyldig, frikjent, dom: skyldig + frikjent > 0 && skyldig / (skyldig + frikjent) >= 2 / 3 };
  if (s.resultat.dom) {
    s.mot.forEach((id: string) => {
      const h = a && a.hold[id];
      const beslag = h ? h.fikk || 0 : 0;
      b.saldo[id] = saldo(b, id) - beslag - BOT_SKYLDIG;
      if (h) h.fikk = 0;
    });
    melde(data, `🚨 Børstilsynet: ${s.mot.map((id: string) => navn(data, id)).join(' og ')} dømt for innsidehandel! Gevinsten beslaglegges, 300 kr i bot – og straffehjulet venter 🎡`,
      `🚨 Market watchdog: ${s.mot.map((id: string) => navn(data, id)).join(' and ')} convicted of insider trading! Profits seized, 300 fine – and the penalty wheel awaits 🎡`);
  } else {
    b.saldo[s.av] = saldo(b, s.av) - BOT_FALSK;
    melde(data, `⚖️ Frikjent! ${navn(data, s.av)} betaler 200 kr for falsk anmeldelse.`, `⚖️ Acquitted! ${navn(data, s.av)} pays 200 for a false report.`);
  }
  s.fase = 'ferdig'; s.frist = null;
}

/* ---------- handlinger ---------- */
export function borsHandling(data: any, meg: any, h: any, erVert: boolean): any {
  const hd = String(h.handling || '');
  if (hd === 'bs-start') {
    if (!erVert) return { feil: 'bare-vert' };
    if (data.bors && data.bors.paa) return { ok: true };
    return startBors(data, !!h._borsFri, !!h.fokus);
  }
  const b = data.bors;
  if (!b) return { ok: true };
  if (hd === 'bs-lukk') { if (!erVert) return { feil: 'bare-vert' }; data.bors = null; return { ok: true }; }
  if (!b.paa) return { ok: true };
  oppdaterUtfall(data);
  saldo(b, meg.id);
  if (hd === 'bs-fokus') {   // børsen som hovedspill (hele skjermen) eller i bakgrunnen ved siden av andre leker
    if (!erVert) return { feil: 'bare-vert' };
    b.fokus = !!h.paa; if (b.fokus) data.spill = null;
    return { ok: true };
  }
  if (hd === 'bs-avslutt') { if (!erVert) return { feil: 'bare-vert' }; avsluttBors(data); return { ok: true }; }
  if (hd === 'bs-lasopp') {   // Pluss aktivert i rommet i mellomtiden, eller gjeng med konvolutt 6
    if (h._borsFri) b.fri = true;
    return { ok: true };
  }
  if (hd === 'bs-tikk') {
    // Tidsstyrte ting: ny aksje, frister på meldinger og saker
    if (Date.now() >= b.neste - 1000) nyAutomatisk(data);
    b.aksjer.forEach((a: any) => { if (a.status === 'meldt' && a.melding && ute(a.melding.frist)) vurderMelding(data, a, true); });
    b.saker.forEach((s: any) => {
      if (s.fase === 'forsvar' && ute(s.frist)) { s.fase = 'stem'; s.frist = frist(FRIST_DOM); }
      else if (s.fase === 'stem' && ute(s.frist)) dom(data, s);
    });
    return { ok: true };
  }
  if (hd === 'bs-handel') {
    const a = finn(b, h.aksje); if (!a || a.status !== 'apen') return { feil: 'stengt', melding: 'Aksjen er ikke åpen for handel.', en: 'This share isn’t open for trading.' };
    const i = a.utfall.indexOf(String(h.utfall)); if (i === -1) return { feil: 'ugyldig' };
    if (a.type === 'hvem' && a.utfall[i] === meg.id && Number(h.n) > 0) return { feil: 'innside', melding: 'Du kan ikke kjøpe aksjer i deg selv – det er innsidehandel 😉', en: 'You can’t buy shares in yourself – that’s insider trading 😉' };
    if (a.av === meg.id) return { feil: 'innside', melding: 'Du kan ikke handle i en aksje du har notert selv.', en: 'You can’t trade in a share you listed yourself.' };
    const n = Math.max(-50, Math.min(50, Math.round(Number(h.n) || 0))); if (!n) return { ok: true };
    const hold = beholdning(a, meg.id), har = hold.n[a.utfall[i]] || 0;
    if (n < 0 && har + n < 0) return { feil: 'ugyldig', melding: 'Du har ikke så mange aksjer.', en: 'You don’t have that many shares.' };
    const kr = pris(a.qs, i, n), honorar = n > 0 && a.av ? HONORAR : 0;
    if (n > 0 && saldo(b, meg.id) < kr + honorar) return { feil: 'penger', melding: 'Du har ikke nok vorskroner.', en: 'You don’t have enough coins.' };
    a.qs[i] += n; hold.n[a.utfall[i]] = har + n;
    b.saldo[meg.id] = saldo(b, meg.id) - kr - honorar;
    hold.kost = Math.max(0, hold.kost + kr);
    if (honorar) b.saldo[a.av] = saldo(b, a.av) + honorar;
    a.handler.push({ id: meg.id, u: a.utfall[i], n, kr, t: Date.now() });
    return { ok: true };
  }
  if (hd === 'bs-meld') {
    const a = finn(b, h.aksje); if (!a || a.status !== 'apen') return { feil: 'stengt', melding: 'Aksjen kan ikke meldes nå.', en: 'This share can’t be reported now.' };
    const utfall = a.type === 'janei' ? 'ja' : String(h.utfall || '');
    if (!a.utfall.includes(utfall)) return { feil: 'ugyldig' };
    const vitne = h.vitne && data.spillere.some((p: any) => p.id === h.vitne && p.id !== meg.id) ? String(h.vitne) : null;
    let bilde: string | null = null;
    if (typeof h.bilde === 'string' && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(h.bilde) && h.bilde.length < 160000) bilde = h.bilde;
    a.status = 'meldt';
    a.melding = { av: meg.id, utfall, vitne, subjekt: a.type === 'hvem' ? utfall : null, stemmer: { [meg.id]: 'ja' }, frist: frist(FRIST_MELDING), bilde: !!bilde, t: Date.now() };
    if (bilde) { b.bilder = b.bilder || {}; b.bilder[a.id] = bilde; }
    melde(data, `📣 ${meg.navn} melder: ${a.type === 'hvem' ? navn(data, utfall) + ' – ' : ''}${a.q.no || a.q}. Stem nå!`, `📣 ${meg.navn} reports: ${a.type === 'hvem' ? navn(data, utfall) + ' – ' : ''}${a.q.en || a.q}. Vote now!`);
    return { ok: true };
  }
  if (hd === 'bs-stem') {
    const a = finn(b, h.aksje); if (!a || a.status !== 'meldt' || !a.melding) return { ok: true };
    if (meg.id === a.melding.subjekt) return { feil: 'innside', melding: 'Aksjen handler om deg, så du kan ikke stemme.', en: 'This share is about you, so you can’t vote.' };
    const v = ['ja', 'nei', 'vet'].includes(h.v) ? h.v : null; if (!v) return { ok: true };
    a.melding.stemmer[meg.id] = v;
    vurderMelding(data, a);
    return { ok: true };
  }
  if (hd === 'bs-noter') {
    if (b.noterte[meg.id]) return { feil: 'brukt', melding: 'Du har allerede notert en aksje i kveld.', en: 'You’ve already listed a share tonight.' };
    if (!kanNyAksje(b)) return { feil: 'pluss', melding: 'Gratisbørsen er full for i kveld. Med Pluss hos verten er det ubegrenset med aksjer.', en: 'The free exchange is full tonight. With Plus the host gets unlimited shares.' };
    const tekst = rens(h.tekst, 100); if (tekst.length < 8) return { feil: 'kort', melding: 'Skriv hele spørsmålet (minst 8 tegn).', en: 'Write the whole question (at least 8 characters).' };
    const type = h.type === 'janei' ? 'janei' : 'hvem';
    if (saldo(b, meg.id) < NOTERING) return { feil: 'penger', melding: 'Det koster 200 vorskroner å notere en aksje.', en: 'Listing a share costs 200 coins.' };
    b.saldo[meg.id] -= NOTERING; b.noterte[meg.id] = true;
    const a = lagAksje(data, type, tekst, meg.id);
    if (erVert) { a.status = 'apen'; melde(data, `📈 ${meg.navn} har notert en ny aksje: ${tekst}`, `📈 ${meg.navn} listed a new share: ${tekst}`); }
    else melde(data, `🧾 ${meg.navn} vil notere en ny aksje – verten må godkjenne`, `🧾 ${meg.navn} wants to list a new share – the host must approve`);
    return { ok: true };
  }
  if (hd === 'bs-godkjenn') {
    if (!erVert) return { feil: 'bare-vert' };
    const a = finn(b, h.aksje); if (!a || a.status !== 'venter') return { ok: true };
    if (h.ok) { a.status = 'apen'; melde(data, `📈 Ny aksje på børsen: ${a.q}`, `📈 New share on the Exchange: ${a.q}`); }
    else { a.status = 'avvist'; b.saldo[a.av] = saldo(b, a.av) + NOTERING; b.noterte[a.av] = false; b.antall = Math.max(0, (b.antall || 1) - 1); }
    return { ok: true };
  }
  if (hd === 'bs-anmeld') {
    const a = finn(b, h.aksje); if (!a || a.status !== 'avgjort') return { feil: 'ugyldig', melding: 'Du kan bare anmelde aksjer som er avgjort.', en: 'You can only report shares that are settled.' };
    const mot = (Array.isArray(h.mot) ? h.mot : []).map(String).filter((id: string, i: number, l: string[]) => l.indexOf(id) === i && id !== meg.id && data.spillere.some((p: any) => p.id === id)).slice(0, 2);
    if (!mot.length) return { feil: 'ugyldig', melding: 'Velg hvem du anmelder.', en: 'Pick who you’re reporting.' };
    if (!data.spillere.some((p: any) => p.id !== meg.id && !mot.includes(p.id))) return { feil: 'for-faa', melding: 'Det må være minst én uinvolvert igjen til å dømme. Anmeld bare én person.', en: 'At least one uninvolved person must be left to judge. Report just one person.' };
    if (b.saker.some((s: any) => s.aksje === a.id && s.fase !== 'ferdig')) return { feil: 'opptatt', melding: 'Den aksjen er allerede til behandling.', en: 'That share is already under investigation.' };
    if (b.saker.filter((s: any) => s.aksje === a.id).length >= 2) return { feil: 'opptatt', melding: 'Aksjen er ferdig etterforsket.', en: 'That share has already been investigated.' };
    b.saker.push({ id: nyId(), aksje: a.id, av: meg.id, mot, fase: 'forsvar', frist: frist(FRIST_FORSVAR), stemmer: {}, resultat: null });
    melde(data, `🚨 ${meg.navn} anmelder ${mot.map((id: string) => navn(data, id)).join(' og ')} for innsidehandel! Børstilsynet åpner loggen.`,
      `🚨 ${meg.navn} reports ${mot.map((id: string) => navn(data, id)).join(' and ')} for insider trading! The watchdog opens the trade log.`);
    return { ok: true };
  }
  if (hd === 'bs-sak-stem') {
    const s = b.saker.find((x: any) => x.id === h.sak); if (!s || (s.fase !== 'stem' && s.fase !== 'forsvar')) return { ok: true };
    if (s.av === meg.id || s.mot.includes(meg.id)) return { feil: 'innside', melding: 'Du er part i saken og kan ikke stemme.', en: 'You’re involved in the case and can’t vote.' };
    if (h.v !== 'skyldig' && h.v !== 'uskyldig') return { ok: true };
    s.stemmer[meg.id] = h.v;
    const velgere = data.spillere.filter((p: any) => p.id !== s.av && !s.mot.includes(p.id));
    if (velgere.every((p: any) => s.stemmer[p.id])) dom(data, s);
    return { ok: true };
  }
  if (hd === 'bs-sak-videre') {
    if (!erVert) return { feil: 'bare-vert' };
    const s = b.saker.find((x: any) => x.id === h.sak); if (s && s.fase === 'forsvar') { s.fase = 'stem'; s.frist = frist(FRIST_DOM); }
    return { ok: true };
  }
  return { ok: true };
}

/* ---------- det telefonene ser ---------- */
export function borsVisning(data: any, meg: any) {
  const b = data.bors; if (!b) return null;
  const m = meg ? meg.id : null;
  const aksjer = b.aksjer.filter((a: any) => a.status !== 'avvist' && (a.status !== 'venter' || m === data.vert || m === a.av)).map((a: any) => {
    const k = kurser(a.qs), hold = m ? a.hold[m] : null;
    return {
      id: a.id, type: a.type, q: a.q, status: a.status, av: a.av, egen: !!a.av,
      utfall: a.utfall.map((u: string, i: number) => ({ u, kurs: Math.round(k[i] * UTBETALING), kjop: pris(a.qs, i, 1), selg: -pris(a.qs, i, -1), mine: hold ? hold.n[u] || 0 : 0 })),
      vinner: a.vinner, fikk: hold ? hold.fikk || 0 : 0, antallHandler: a.handler.length,
      melding: a.melding ? { av: a.melding.av, utfall: a.melding.utfall, vitne: a.melding.vitne, subjekt: a.melding.subjekt, frist: a.melding.frist, bilde: a.melding.bilde,
        harStemt: Object.keys(a.melding.stemmer), minStemme: m ? a.melding.stemmer[m] || null : null } : null,
      bilde: a.status === 'meldt' && b.bilder ? b.bilder[a.id] || null : null,
    };
  });
  const saker = b.saker.map((s: any) => {
    const a = finn(b, s.aksje);
    return { id: s.id, aksje: s.aksje, q: a ? a.q : '', vinner: a ? a.vinner : null, type: a ? a.type : null, av: s.av, mot: s.mot, fase: s.fase, frist: s.frist,
      logg: a ? tilsynLogg(data, a) : [], harStemt: Object.keys(s.stemmer), minStemme: m ? s.stemmer[m] || null : null, resultat: s.resultat };
  });
  const verdi = (id: string) => b.aksjer.reduce((sum: number, a: any) => {
    if (a.status !== 'apen' && a.status !== 'meldt') return sum;
    const h = a.hold[id]; if (!h) return sum;
    const k = kurser(a.qs); return sum + a.utfall.reduce((s2: number, u: string, i: number) => s2 + (h.n[u] || 0) * k[i] * UTBETALING, 0);
  }, 0);
  return {
    paa: b.paa, fri: !!b.fri, fokus: !!b.fokus, neste: b.neste, gratisIgjen: b.fri ? null : Math.max(0, GRATIS_AKSJER - (b.antall || 0)),
    saldo: m ? saldo(b, m) : null, formue: m ? Math.round(saldo(b, m) + verdi(m)) : null,
    tavle: data.spillere.map((p: any) => ({ id: p.id, kr: Math.round(saldo(b, p.id) + verdi(p.id)) })).sort((x: any, y: any) => y.kr - x.kr),
    aksjer, saker, harNotert: m ? !!b.noterte[m] : false, slutt: b.slutt || null,
    priser: { notering: NOTERING, honorar: HONORAR, utbetaling: UTBETALING },
  };
}
