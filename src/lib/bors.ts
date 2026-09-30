/**
 * Vorsbørsen – et aksjemarked på vennene dine som går hele kvelden.
 *
 * - Alle starter med 1000 vorskroner. Skjer det aksjen spør om, betaler hver aksje 100 kr.
 * - Hvert utfall (hvert navn, eller ja/nei) er sin egen aksje: kursen starter på 10 kr og stiger for
 *   hvert kjøp (maks 95). Den som kjøper tidlig, tjener mest.
 * - Alle aksjene ligger ute fra start. Noen stenger for handel etter én, to eller tre timer, resten er åpne hele kvelden.
 * - «Det skjedde!» låser aksjen med en gang. Den som melder kan legge ved bilde og/eller vitne, så stemmer de andre.
 * - Innsidehandel: du kan ikke kjøpe aksjer i deg selv. Bare de som vant på en aksje kan anmeldes.
 *   Børstilsynet viser handelsloggen og alle pengeoverføringer – en «gave» fra vinneren til den aksjen
 *   handlet om, er et tydelig tegn på bestikkelse.
 * - Egne aksjer: én per spiller per kveld, koster 200 kr å notere, verten godkjenner.
 */
type Lang = 'no' | 'en';
type Tekst = { no: string; en: string };
const T = (no: string, en: string): Tekst => ({ no, en });

export const START_KR = 1000, UTBETALING = 100, NOTERING = 200, HONORAR = 2, BOT_SKYLDIG = 300, BOT_FALSK = 200;
const STARTKURS = 10, STEG = 6, MAKSKURS = 95;
const GRATIS_AKSJER = 4;                 // uten Pluss (eller opplåst gjeng): så mange av aksjene er åpne
const ANTALL_HVEM = 9, ANTALL_JANEI = 5;  // så mange aksjer legges ut ved start
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

/* ---------- kurs: hvert utfall er sin egen aksje ---------- */
/** Prisen på neste aksje når n allerede er solgt. */
const kurs = (n: number) => Math.min(MAKSKURS, STARTKURS + STEG * Math.max(0, n));
/** Hva du får for én aksje hvis du selger nå (prisen på den siste som ble kjøpt). */
const salgskurs = (n: number) => (n > 0 ? kurs(n - 1) : 0);

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
/** Flytt penger og husk hvorfor, så telefonen til den det gjelder kan vise +xx / −xx. */
function flytt(b: any, id: string, kr: number, no: string, en: string) {
  kr = Math.round(kr); if (!kr || !id) return;
  b.saldo[id] = saldo(b, id) + kr;
  b.bevNr = (b.bevNr || 0) + 1;
  (b.bev = b.bev || []).push({ n: b.bevNr, id, kr, no, en });
  if (b.bev.length > 120) b.bev.splice(0, b.bev.length - 120);
}
const qNo = (a: any) => String((a && a.q && (a.q.no || a.q)) || ''), qEn = (a: any) => String((a && a.q && (a.q.en || a.q.no || a.q)) || '');
const kortQ = (t: string) => (t.length > 42 ? t.slice(0, 40).trimEnd() + '…' : t);
function beholdning(a: any, id: string) { return a.hold[id] || (a.hold[id] = { n: {}, kost: 0, fikk: 0 }); }
function finn(b: any, id: any) { return b.aksjer.find((a: any) => a.id === id); }
/** Kan det handles i aksjen akkurat nå? */
function handelApen(b: any, a: any) { return a.status === 'apen' && (!a.laast || b.fri) && !(a.stenger && Date.now() >= a.stenger); }

/* ---------- aksjer ---------- */
function lagAksje(data: any, type: 'hvem' | 'janei', q: any, av: string | null = null, stenger: number | null = null) {
  const b = data.bors;
  const utfall = type === 'hvem' ? data.spillere.map((p: any) => p.id) : ['ja', 'nei'];
  const a: any = { id: nyId(), type, q, av, laget: Date.now(), stenger, status: av ? 'venter' : 'apen', utfall, qs: utfall.map(() => 0), hold: {}, handler: [], melding: null, vinner: null,
    laast: !av && !b.fri && b.aksjer.filter((x: any) => !x.av).length >= GRATIS_AKSJER };
  b.aksjer.push(a);
  return a;
}
/** Nye spillere får et utfall i «hvem»-aksjer som ikke er avgjort. */
function oppdaterUtfall(data: any) {
  (data.bors.aksjer || []).forEach((a: any) => {
    if (a.type !== 'hvem' || !['apen', 'venter', 'stengt'].includes(a.status)) return;
    data.spillere.forEach((p: any) => { if (!a.utfall.includes(p.id)) { a.utfall.push(p.id); a.qs.push(0); } });
  });
}
/** Utbetaling når en aksje er avgjort. Vinner = utfall-id, eller null = ugyldig (alle får kostpris tilbake). */
function oppgjor(data: any, a: any, vinner: string | null) {
  const b = data.bors;
  a.status = vinner ? 'avgjort' : 'ugyldig'; a.vinner = vinner; a.avgjort = Date.now();
  Object.entries(a.hold).forEach(([id, h]: any) => {
    const kr = vinner ? (h.n[vinner] || 0) * UTBETALING : h.kost;
    if (kr > 0) { flytt(b, id, kr, vinner ? 'Utbetaling: ' + kortQ(qNo(a)) : 'Pengene tilbake: ' + kortQ(qNo(a)), vinner ? 'Payout: ' + kortQ(qEn(a)) : 'Refund: ' + kortQ(qEn(a))); h.fikk = kr; }
  });
  if (b.bilder) delete b.bilder[a.id];
  a.melding = null;
}

/* ---------- start / slutt ---------- */
export function startBors(data: any, fri: boolean, fokus = false) {
  if (data.spillere.length < 3) return { feil: 'for-faa', melding: 'Vorsbørsen trenger minst tre spillere.', en: 'The Exchange needs at least three players.' };
  data.bors = { paa: true, start: Date.now(), saldo: {}, aksjer: [], saker: [], bilder: {}, noterte: {}, overforinger: [], fri: !!fri, fokus: !!fokus, brukt: {} };
  const b = data.bors;
  data.spillere.forEach((p: any) => saldo(b, p.id));
  // Blandet rekkefølge, og stengetider spredt utover kvelden: 1, 2 eller 3 timer – eller åpen hele kvelden
  const time = 3600 * 1000, tider = [time, null, 2 * time, null, 3 * time];
  const liste: [string, any][] = [];
  for (let i = 0; i < ANTALL_HVEM; i++) liste.push(['hvem', trekk(b, 'hvem', HVEM)]);
  for (let i = 0; i < ANTALL_JANEI; i++) liste.push(['janei', trekk(b, 'janei', JANEI)]);
  for (let i = liste.length - 1; i > 0; i--) { const j = tilfeldig(i + 1); [liste[i], liste[j]] = [liste[j], liste[i]]; }
  liste.forEach(([type, q], i) => { const t = tider[i % tider.length]; lagAksje(data, type as any, q, null, t ? Date.now() + t : null); });
  melde(data, '📈 Vorsbørsen har åpnet! Alle har 1000 vorskroner – kjøp tidlig, det lønner seg.', '📈 The Pre-game Exchange is open! Everyone has 1,000 coins – buy early, it pays off.');
  return { ok: true };
}
function avsluttBors(data: any) {
  const b = data.bors;
  b.aksjer.forEach((a: any) => {
    if (['apen', 'stengt', 'meldt'].includes(a.status)) oppgjor(data, a, a.type === 'janei' ? 'nei' : null);
    if (a.status === 'venter') { a.status = 'avvist'; if (a.av) flytt(b, a.av, NOTERING, 'Noteringen tilbake', 'Listing refunded'); }
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
  const godkjent = !vitneNei && vitneOk && (ja > nei || (ja === 0 && nei === 0 && !!m.vitne));
  if (godkjent) {
    oppgjor(data, a, m.utfall);
    melde(data, `✅ Bekreftet: ${a.type === 'hvem' ? navn(data, m.utfall) : 'Ja'} – hver aksje betaler 100 kr!`, `✅ Confirmed: ${a.type === 'hvem' ? navn(data, m.utfall) : 'Yes'} – each share pays 100!`);
  } else {
    a.status = m.forrige || 'apen'; a.melding = null; if (data.bors.bilder) delete data.bors.bilder[a.id];
    melde(data, `❌ Ikke godkjent – aksjen er åpen igjen.`, `❌ Not confirmed – the share is open again.`);
  }
}

/* ---------- Børstilsynet ---------- */
/** Vinnerne på en aksje (de eneste som kan anmeldes for den). */
function vinnere(a: any) { return a.vinner ? Object.keys(a.hold).filter((id) => (a.hold[id].n[a.vinner] || 0) > 0) : []; }
function tilsynLogg(data: any, a: any, mistenkt: string) {
  const slutt = a.avgjort || Date.now(), b = data.bors;
  const sum: Record<string, number> = {};
  a.handler.forEach((h: any) => { if (h.n > 0 && h.u === a.vinner && slutt - h.t < 15 * 60000) sum[h.id] = (sum[h.id] || 0) + h.kr; });
  const handler = a.handler.map((h: any) => ({ navn: navn(data, h.id), hvem: h.id, utfall: h.u, n: h.n, kr: h.kr, minFor: Math.round((slutt - h.t) / 60000),
    mistenkelig: h.n > 0 && h.u === a.vinner && slutt - h.t < 15 * 60000 && (sum[h.id] || 0) >= 60 }));
  const subjekt = a.type === 'hvem' ? a.vinner : null;
  const penger = (b.overforinger || []).filter((o: any) => o.fra === mistenkt || o.til === mistenkt).map((o: any) => ({
    fra: navn(data, o.fra), til: navn(data, o.til), kr: o.kr, minEtter: Math.round((o.t - slutt) / 60000),
    mistenkelig: !!subjekt && ((o.fra === mistenkt && o.til === subjekt) || (o.fra === subjekt && o.til === mistenkt)) }));
  return { handler, penger };
}
function dom(data: any, s: any) {
  const b = data.bors, a = finn(b, s.aksje);
  const velgere = data.spillere.filter((p: any) => !s.utenfor.includes(p.id));
  const skyldig = velgere.filter((p: any) => s.stemmer[p.id] === 'skyldig').length, frikjent = velgere.filter((p: any) => s.stemmer[p.id] === 'uskyldig').length;
  s.resultat = { skyldig, frikjent, dom: skyldig + frikjent > 0 && skyldig / (skyldig + frikjent) >= 2 / 3, medskyldig: null as string | null };
  if (s.resultat.dom) {
    const h = a && a.hold[s.mot];
    flytt(b, s.mot, -((h ? h.fikk || 0 : 0) + BOT_SKYLDIG), 'Dømt: gevinst beslaglagt + bot', 'Convicted: profits seized + fine');
    if (h) h.fikk = 0;
    // Fikk den aksjen handlet om penger fra vinneren? Da er hen medskyldig: pengene inndras og samme bot.
    const subjekt = a && a.type === 'hvem' ? a.vinner : null;
    if (subjekt && subjekt !== s.mot) {
      const bestikkelse = (b.overforinger || []).filter((o: any) => o.fra === s.mot && o.til === subjekt).reduce((n: number, o: any) => n + o.kr, 0);
      if (bestikkelse > 0) { flytt(b, subjekt, -(bestikkelse + BOT_SKYLDIG), 'Medskyldig: gaven inndratt + bot', 'Accomplice: gift seized + fine'); s.resultat.medskyldig = subjekt; }
    }
    melde(data, `🚨 Børstilsynet: ${navn(data, s.mot)} er dømt for innsidehandel${s.resultat.medskyldig ? ' sammen med ' + navn(data, s.resultat.medskyldig) : ''}! Gevinsten beslaglegges – og straffehjulet venter 🎡`,
      `🚨 Market watchdog: ${navn(data, s.mot)} is convicted of insider trading${s.resultat.medskyldig ? ' together with ' + navn(data, s.resultat.medskyldig) : ''}! Profits seized – and the penalty wheel awaits 🎡`);
  } else {
    flytt(b, s.av, -BOT_FALSK, 'Falsk anmeldelse', 'False report');
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
  if (h._borsFri) b.fri = true;
  oppdaterUtfall(data);
  saldo(b, meg.id);
  if (hd === 'bs-fokus') { if (!erVert) return { feil: 'bare-vert' }; b.fokus = !!h.paa; if (b.fokus) data.spill = null; return { ok: true }; }
  if (hd === 'bs-avslutt') { if (!erVert) return { feil: 'bare-vert' }; avsluttBors(data); return { ok: true }; }
  if (hd === 'bs-lasopp') return { ok: true };
  if (hd === 'bs-tikk') {
    b.aksjer.forEach((a: any) => {
      if (a.status === 'apen' && a.stenger && Date.now() >= a.stenger) a.status = 'stengt';
      if (a.status === 'meldt' && a.melding && ute(a.melding.frist)) vurderMelding(data, a, true);
    });
    b.saker.forEach((s: any) => {
      if (s.fase === 'forsvar' && ute(s.frist)) { s.fase = 'stem'; s.frist = frist(FRIST_DOM); }
      else if (s.fase === 'stem' && ute(s.frist)) dom(data, s);
    });
    return { ok: true };
  }
  if (hd === 'bs-handel') {
    const a = finn(b, h.aksje); if (!a) return { feil: 'ugyldig' };
    if (a.stenger && Date.now() >= a.stenger && a.status === 'apen') a.status = 'stengt';
    if (a.laast && !b.fri) return { feil: 'pluss', melding: 'Denne aksjen krever Pluss hos verten.', en: 'This share needs the host to have Plus.' };
    if (!handelApen(b, a)) return { feil: 'stengt', melding: a.status === 'meldt' ? 'Aksjen er låst – noen har meldt at det skjedde.' : 'Aksjen er stengt for handel.', en: a.status === 'meldt' ? 'The share is locked – someone reported that it happened.' : 'This share is closed for trading.' };
    const i = a.utfall.indexOf(String(h.utfall)); if (i === -1) return { feil: 'ugyldig' };
    const n = Math.round(Number(h.n) || 0) > 0 ? 1 : -1;
    if (a.type === 'hvem' && a.utfall[i] === meg.id && n > 0) return { feil: 'innside', melding: 'Du kan ikke kjøpe aksjer i deg selv – det er innsidehandel 😉', en: 'You can’t buy shares in yourself – that’s insider trading 😉' };
    if (a.av === meg.id) return { feil: 'innside', melding: 'Du kan ikke handle i en aksje du har notert selv.', en: 'You can’t trade in a share you listed yourself.' };
    const hold = beholdning(a, meg.id), har = hold.n[a.utfall[i]] || 0;
    if (n < 0 && har < 1) return { feil: 'ugyldig', melding: 'Du har ingen slike aksjer.', en: 'You don’t own any of these.' };
    const kr = n > 0 ? kurs(a.qs[i]) : -salgskurs(a.qs[i]), honorar = n > 0 && a.av ? HONORAR : 0;
    if (n > 0 && saldo(b, meg.id) < kr + honorar) return { feil: 'penger', melding: 'Du har ikke nok vorskroner.', en: 'You don’t have enough coins.' };
    a.qs[i] += n; hold.n[a.utfall[i]] = har + n;
    const hvaNo = a.type === 'hvem' ? navn(data, a.utfall[i]) : (a.utfall[i] === 'ja' ? 'Ja' : 'Nei'), hvaEn = a.type === 'hvem' ? hvaNo : (a.utfall[i] === 'ja' ? 'Yes' : 'No');
    flytt(b, meg.id, -(kr + honorar), (n > 0 ? 'Kjøpte ' : 'Solgte ') + hvaNo, (n > 0 ? 'Bought ' : 'Sold ') + hvaEn);
    hold.kost = Math.max(0, hold.kost + kr);
    if (honorar) flytt(b, a.av, honorar, 'Honorar fra aksjen din', 'Fee from your share');
    a.handler.push({ id: meg.id, u: a.utfall[i], n, kr, t: Date.now() });
    return { ok: true };
  }
  if (hd === 'bs-gi') {
    const til = String(h.til || ''), kr = Math.round(Number(h.kr) || 0);
    if (!data.spillere.some((p: any) => p.id === til) || til === meg.id) return { feil: 'ugyldig', melding: 'Velg hvem du vil gi penger til.', en: 'Pick who to give money to.' };
    if (!(kr >= 10 && kr <= 1000)) return { feil: 'ugyldig', melding: 'Gi mellom 10 og 1000 kr.', en: 'Give between 10 and 1,000.' };
    if (saldo(b, meg.id) < kr) return { feil: 'penger', melding: 'Du har ikke så mange vorskroner.', en: 'You don’t have that many coins.' };
    flytt(b, meg.id, -kr, 'Gave til ' + navn(data, til), 'Gift to ' + navn(data, til)); flytt(b, til, kr, 'Gave fra ' + meg.navn, 'Gift from ' + meg.navn);
    (b.overforinger = b.overforinger || []).push({ fra: meg.id, til, kr, t: Date.now() });
    return { ok: true };
  }
  if (hd === 'bs-meld') {
    const a = finn(b, h.aksje); if (!a || (a.status !== 'apen' && a.status !== 'stengt')) return { feil: 'stengt', melding: 'Aksjen kan ikke meldes nå.', en: 'This share can’t be reported now.' };
    if (a.laast && !b.fri) return { feil: 'pluss', melding: 'Denne aksjen krever Pluss hos verten.', en: 'This share needs the host to have Plus.' };
    const utfall = a.type === 'janei' ? 'ja' : String(h.utfall || '');
    if (!a.utfall.includes(utfall)) return { feil: 'ugyldig' };
    const vitne = h.vitne && data.spillere.some((p: any) => p.id === h.vitne && p.id !== meg.id) ? String(h.vitne) : null;
    let bilde: string | null = null;
    if (typeof h.bilde === 'string' && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(h.bilde) && h.bilde.length < 160000) bilde = h.bilde;
    a.melding = { av: meg.id, utfall, vitne, subjekt: a.type === 'hvem' ? utfall : null, stemmer: { [meg.id]: 'ja' }, frist: frist(FRIST_MELDING), bilde: !!bilde, t: Date.now(), forrige: a.status };
    a.status = 'meldt';   // låst: ingen kan kjøpe eller selge mens det stemmes
    if (bilde) { b.bilder = b.bilder || {}; b.bilder[a.id] = bilde; }
    melde(data, `📣 ${meg.navn} melder: ${a.type === 'hvem' ? navn(data, utfall) + ' – ' : ''}${a.q.no || a.q} Aksjen er låst – stem nå!`, `📣 ${meg.navn} reports: ${a.type === 'hvem' ? navn(data, utfall) + ' – ' : ''}${a.q.en || a.q} The share is locked – vote now!`);
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
    const tekst = rens(h.tekst, 100); if (tekst.length < 8) return { feil: 'kort', melding: 'Skriv hele spørsmålet (minst 8 tegn).', en: 'Write the whole question (at least 8 characters).' };
    const type = h.type === 'janei' ? 'janei' : 'hvem';
    if (saldo(b, meg.id) < NOTERING) return { feil: 'penger', melding: 'Det koster 200 vorskroner å notere en aksje.', en: 'Listing a share costs 200 coins.' };
    flytt(b, meg.id, -NOTERING, 'Noterte egen aksje', 'Listed your own share'); b.noterte[meg.id] = true;
    const a = lagAksje(data, type, tekst, meg.id);
    if (erVert) { a.status = 'apen'; melde(data, `📈 ${meg.navn} har notert en ny aksje: ${tekst}`, `📈 ${meg.navn} listed a new share: ${tekst}`); }
    else melde(data, `🧾 ${meg.navn} vil notere en ny aksje – verten må godkjenne`, `🧾 ${meg.navn} wants to list a new share – the host must approve`);
    return { ok: true };
  }
  if (hd === 'bs-godkjenn') {
    if (!erVert) return { feil: 'bare-vert' };
    const a = finn(b, h.aksje); if (!a || a.status !== 'venter') return { ok: true };
    if (h.ok) { a.status = 'apen'; melde(data, `📈 Ny aksje på børsen: ${a.q}`, `📈 New share on the Exchange: ${a.q}`); }
    else { a.status = 'avvist'; flytt(b, a.av, NOTERING, 'Aksjen ble avvist – pengene tilbake', 'Share rejected – refunded'); b.noterte[a.av] = false; }
    return { ok: true };
  }
  if (hd === 'bs-anmeld') {
    const a = finn(b, h.aksje); if (!a || a.status !== 'avgjort') return { feil: 'ugyldig', melding: 'Du kan bare anmelde aksjer som er avgjort.', en: 'You can only report shares that are settled.' };
    const mot = String(h.mot || '');
    if (!vinnere(a).includes(mot) || mot === meg.id) return { feil: 'ugyldig', melding: 'Bare de som vant på aksjen kan anmeldes.', en: 'Only people who won on this share can be reported.' };
    const utenfor = [meg.id, mot].concat(a.type === 'hvem' && a.vinner ? [a.vinner] : []);
    if (!data.spillere.some((p: any) => !utenfor.includes(p.id))) return { feil: 'for-faa', melding: 'Det må være minst én uinvolvert igjen til å dømme.', en: 'At least one uninvolved person must be left to judge.' };
    if (b.saker.some((s: any) => s.aksje === a.id && s.mot === mot)) return { feil: 'opptatt', melding: 'Den personen er allerede etterforsket for denne aksjen.', en: 'That person has already been investigated for this share.' };
    b.saker.push({ id: nyId(), aksje: a.id, av: meg.id, mot, utenfor, fase: 'forsvar', frist: frist(FRIST_FORSVAR), stemmer: {}, resultat: null });
    melde(data, `🚨 ${meg.navn} anmelder ${navn(data, mot)} for innsidehandel! Børstilsynet åpner loggen.`, `🚨 ${meg.navn} reports ${navn(data, mot)} for insider trading! The watchdog opens the log.`);
    return { ok: true };
  }
  if (hd === 'bs-sak-stem') {
    const s = b.saker.find((x: any) => x.id === h.sak); if (!s || (s.fase !== 'stem' && s.fase !== 'forsvar')) return { ok: true };
    if (s.utenfor.includes(meg.id)) return { feil: 'innside', melding: 'Du er part i saken og kan ikke stemme.', en: 'You’re involved in the case and can’t vote.' };
    if (h.v !== 'skyldig' && h.v !== 'uskyldig') return { ok: true };
    s.stemmer[meg.id] = h.v;
    if (data.spillere.filter((p: any) => !s.utenfor.includes(p.id)).every((p: any) => s.stemmer[p.id])) dom(data, s);
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
    const hold = m ? a.hold[m] : null;
    const status = a.status === 'apen' && a.stenger && Date.now() >= a.stenger ? 'stengt' : a.status;
    return {
      id: a.id, type: a.type, q: a.q, status, av: a.av, egen: !!a.av, stenger: a.stenger, laast: !!a.laast && !b.fri,
      utfall: a.utfall.map((u: string, i: number) => ({ u, kurs: kurs(a.qs[i]), selg: salgskurs(a.qs[i]), solgt: a.qs[i], mine: hold ? hold.n[u] || 0 : 0 })),
      vinner: a.vinner, fikk: hold ? hold.fikk || 0 : 0, kost: hold ? hold.kost || 0 : 0,
      vinnere: a.status === 'avgjort' ? vinnere(a).filter((id: string) => id !== m) : [],
      melding: a.melding ? { av: a.melding.av, utfall: a.melding.utfall, vitne: a.melding.vitne, subjekt: a.melding.subjekt, frist: a.melding.frist, bilde: a.melding.bilde,
        harStemt: Object.keys(a.melding.stemmer), minStemme: m ? a.melding.stemmer[m] || null : null } : null,
      bilde: a.status === 'meldt' && b.bilder ? b.bilder[a.id] || null : null,
    };
  });
  const saker = b.saker.map((s: any) => {
    const a = finn(b, s.aksje), logg = a ? tilsynLogg(data, a, s.mot) : { handler: [], penger: [] };
    return { id: s.id, aksje: s.aksje, q: a ? a.q : '', vinner: a ? a.vinner : null, type: a ? a.type : null, av: s.av, mot: s.mot, utenfor: s.utenfor, fase: s.fase, frist: s.frist,
      logg: logg.handler, penger: logg.penger, harStemt: Object.keys(s.stemmer), minStemme: m ? s.stemmer[m] || null : null, resultat: s.resultat };
  });
  const verdi = (id: string) => b.aksjer.reduce((sum: number, a: any) => {
    if (!['apen', 'stengt', 'meldt'].includes(a.status)) return sum;
    const h = a.hold[id]; if (!h) return sum;
    return sum + a.utfall.reduce((s2: number, u: string, i: number) => s2 + (h.n[u] || 0) * salgskurs(a.qs[i]), 0);
  }, 0);
  return {
    paa: b.paa, fri: !!b.fri, fokus: !!b.fokus, laaste: b.fri ? 0 : b.aksjer.filter((a: any) => a.laast && ['apen', 'stengt'].includes(a.status)).length,
    saldo: m ? saldo(b, m) : null, formue: m ? Math.round(saldo(b, m) + verdi(m)) : null,
    tavle: data.spillere.map((p: any) => ({ id: p.id, kr: Math.round(saldo(b, p.id) + verdi(p.id)) })).sort((x: any, y: any) => y.kr - x.kr),
    aksjer, saker, harNotert: m ? !!b.noterte[m] : false, slutt: b.slutt || null,
    mineGaver: m ? (b.overforinger || []).filter((o: any) => o.fra === m || o.til === m).map((o: any) => ({ fra: o.fra, til: o.til, kr: o.kr })) : [],
    bev: m ? (b.bev || []).filter((x: any) => x.id === m).slice(-6).map((x: any) => ({ n: x.n, kr: x.kr, t: { no: x.no, en: x.en } })) : [],
    priser: { notering: NOTERING, honorar: HONORAR, utbetaling: UTBETALING, start: STARTKURS, maks: MAKSKURS },
  };
}
