/**
 * Gjengens lov – et legacy-spill for faste gjenger.
 * Hver kveld spilles noen korte runder. Vinneren skriver en ny, permanent lov i gjengens lovbok,
 * taperen får en tittel til neste gang, og forseglede konvolutter åpnes når gjengen når milepæler.
 *
 * Godkjenning: medlemmene som er til stede stemmer (flertall). De som ikke var der kan anke loven
 * før neste kveld – da blir det rettssak (2/3 må stemme for å beholde den). Alle har ett veto per sesong.
 *
 * Denne fila har to deler: (1) lovboka (lagres i Supabase per gjeng) og (2) spillet i rommet.
 * Konto-id-er lagres i lovboka for å vite hvem som har stemt og brukt veto, men sendes aldri til nettleseren.
 */
type Lang = 'no' | 'en';
type Tekst = { no: string; en: string };
const T = (no: string, en: string): Tekst => ({ no, en });

/* =====================================================================
   Innhold
   ===================================================================== */
/** «Gjengen i tall»: alle svarer ja/nei i hemmelighet og gjetter hvor mange som sa ja. */
const TALL: Tekst[] = [
  T('Har du noen gang lest meldingene til noen andre uten lov?', 'Have you ever read someone else’s messages without permission?'),
  T('Har du noen gang late som du ikke så noen du kjente på gata?', 'Have you ever pretended not to see someone you know in the street?'),
  T('Har du googlet deg selv den siste måneden?', 'Have you googled yourself in the last month?'),
  T('Har du noen gang sagt «jeg er på vei» mens du fortsatt var hjemme?', 'Have you ever said “I’m on my way” while still at home?'),
  T('Har du stalket en eks på sosiale medier det siste året?', 'Have you stalked an ex on social media in the last year?'),
  T('Har du noen gang sovnet på en fest?', 'Have you ever fallen asleep at a party?'),
  T('Har du noen gang gitt bort en gave du selv fikk?', 'Have you ever regifted a present?'),
  T('Har du sendt en melding til feil person som du angret på?', 'Have you sent a message to the wrong person and regretted it?'),
  T('Synes du selv at du er den morsomste i dette rommet?', 'Do you secretly think you’re the funniest person in this room?'),
  T('Har du noen gang løyet om alderen din?', 'Have you ever lied about your age?'),
  T('Har du grått av en film det siste året?', 'Have you cried at a film in the last year?'),
  T('Har du noen gang spist noe fra kjøleskapet til noen andre uten å spørre?', 'Have you ever eaten from someone else’s fridge without asking?'),
  T('Har du noen gang skyldt på noen andre for noe du gjorde selv?', 'Have you ever blamed someone else for something you did?'),
  T('Har du en app du skammer deg over å ha på telefonen?', 'Do you have an app on your phone you’re ashamed of?'),
  T('Har du noen gang sagt at du har sett en film du ikke har sett?', 'Have you ever claimed to have seen a film you haven’t?'),
  T('Har du ringt moren eller faren din denne uka?', 'Have you called your mum or dad this week?'),
  T('Har du noen gang sneket deg inn et sted uten å betale?', 'Have you ever snuck in somewhere without paying?'),
  T('Har du lagt merke til noen i dette rommet på en litt for interessert måte?', 'Have you ever noticed someone in this room a bit too much?'),
  T('Har du noen gang kastet opp i en taxi eller et offentlig transportmiddel?', 'Have you ever thrown up in a taxi or on public transport?'),
  T('Har du noen gang blitt kastet ut av et utested?', 'Have you ever been thrown out of a bar or club?'),
  T('Har du et kallenavn du ikke vil at noen her skal vite om?', 'Do you have a nickname you don’t want anyone here to know?'),
  T('Har du noen gang sendt en tale­melding på over to minutter?', 'Have you ever sent a voice message longer than two minutes?'),
  T('Har du noen gang sagt «glad i deg» ved et uhell?', 'Have you ever said “love you” by accident?'),
  T('Har du tatt mer enn ti selfies for å få én god?', 'Have you taken more than ten selfies to get one good one?'),
  T('Har du noen gang latt være å svare på en melding i over en uke med vilje?', 'Have you ever deliberately left a message unanswered for over a week?'),
  T('Har du sjekket telefonen din under dette spillet?', 'Have you checked your phone during this game?'),
  T('Har du noen gang tapt en krangel og likevel sagt at du vant?', 'Have you ever lost an argument and still claimed you won?'),
  T('Har du noen gang sunget i dusjen så høyt at naboene kunne høre det?', 'Have you ever sung in the shower loud enough for the neighbours to hear?'),
  T('Kunne du tenke deg å bli kjent på TV?', 'Would you like to be famous on TV?'),
  T('Har du noen gang dratt fra en fest uten å si hade til noen?', 'Have you ever left a party without saying goodbye to anyone?'),
  T('Har du lagret et nummer under et falskt navn?', 'Have you saved a number under a fake name?'),
  T('Har du noen gang latt som du var syk for å slippe noe?', 'Have you ever faked being ill to get out of something?'),
  T('Er du fortsatt venn med eksen din?', 'Are you still friends with your ex?'),
  T('Har du noen gang brukt samme antrekk på to fester på rad med vilje?', 'Have you ever worn the same outfit to two parties in a row on purpose?'),
  T('Har du en hemmelig spilleliste du aldri ville vist noen?', 'Do you have a secret playlist you’d never show anyone?'),
  T('Har du noen gang blitt tatt i å snakke med deg selv?', 'Have you ever been caught talking to yourself?'),
];

/** «Kjenner du gjengen?»: hovedpersonen velger i hemmelighet, de andre gjetter. */
const KJENNER: { q: Tekst; a: Tekst; b: Tekst }[] = [
  { q: T('Fjellet eller sjøen?', 'Mountains or the sea?'), a: T('Fjellet', 'Mountains'), b: T('Sjøen', 'The sea') },
  { q: T('Taco eller pizza på fredag?', 'Tacos or pizza on Friday?'), a: T('Taco', 'Tacos'), b: T('Pizza', 'Pizza') },
  { q: T('Kaffe eller te?', 'Coffee or tea?'), a: T('Kaffe', 'Coffee'), b: T('Te', 'Tea') },
  { q: T('Syden eller hytta?', 'A sun holiday or the cabin?'), a: T('Syden', 'Sun holiday'), b: T('Hytta', 'The cabin') },
  { q: T('Morgenfugl eller B-menneske?', 'Early bird or night owl?'), a: T('Morgenfugl', 'Early bird'), b: T('B-menneske', 'Night owl') },
  { q: T('Hund eller katt?', 'Dog or cat?'), a: T('Hund', 'Dog'), b: T('Katt', 'Cat') },
  { q: T('Første eller siste til å dra fra fest?', 'First or last to leave a party?'), a: T('Første', 'First'), b: T('Siste', 'Last') },
  { q: T('Ringe eller sende melding?', 'Call or text?'), a: T('Ringe', 'Call'), b: T('Melding', 'Text') },
  { q: T('Brunost eller kaviar?', 'Brown cheese or cod roe spread?'), a: T('Brunost', 'Brown cheese'), b: T('Kaviar', 'Cod roe') },
  { q: T('Sparer eller bruker opp?', 'Saver or spender?'), a: T('Sparer', 'Saver'), b: T('Bruker opp', 'Spender') },
  { q: T('Ville du heller vært usynlig eller kunnet fly?', 'Would you rather be invisible or able to fly?'), a: T('Usynlig', 'Invisible'), b: T('Fly', 'Fly') },
  { q: T('Nachspiel eller seng?', 'Afterparty or bed?'), a: T('Nachspiel', 'Afterparty'), b: T('Seng', 'Bed') },
  { q: T('Netflix eller ut på byen?', 'Netflix or a night out?'), a: T('Netflix', 'Netflix'), b: T('Byen', 'Night out') },
  { q: T('Rydder med en gang eller i morgen?', 'Clean up right away or tomorrow?'), a: T('Med en gang', 'Right away'), b: T('I morgen', 'Tomorrow') },
  { q: T('Har du oftere rett eller oftere det siste ordet?', 'Are you more often right, or more often the one with the last word?'), a: T('Rett', 'Right'), b: T('Siste ord', 'Last word') },
  { q: T('Ville du heller mistet telefonen eller lommeboka?', 'Would you rather lose your phone or your wallet?'), a: T('Telefonen', 'Phone'), b: T('Lommeboka', 'Wallet') },
  { q: T('Sommer eller vinter?', 'Summer or winter?'), a: T('Sommer', 'Summer'), b: T('Vinter', 'Winter') },
  { q: T('Planlegger alt eller tar det som det kommer?', 'Plan everything or go with the flow?'), a: T('Planlegger', 'Plan'), b: T('Tar det som det kommer', 'Go with the flow') },
  { q: T('Karaoke: synger først eller aldri?', 'Karaoke: sing first or never?'), a: T('Først', 'First'), b: T('Aldri', 'Never') },
  { q: T('Ketchup eller sennep på pølsa?', 'Ketchup or mustard on the hot dog?'), a: T('Ketchup', 'Ketchup'), b: T('Sennep', 'Mustard') },
  { q: T('Ville du heller vært veldig rik eller veldig kjent?', 'Would you rather be very rich or very famous?'), a: T('Rik', 'Rich'), b: T('Kjent', 'Famous') },
  { q: T('Svarer på meldinger med en gang eller dager senere?', 'Reply to messages right away or days later?'), a: T('Med en gang', 'Right away'), b: T('Dager senere', 'Days later') },
  { q: T('By eller land?', 'City or countryside?'), a: T('By', 'City'), b: T('Land', 'Countryside') },
  { q: T('Sjokolade eller chips?', 'Chocolate or crisps?'), a: T('Sjokolade', 'Chocolate'), b: T('Chips', 'Crisps') },
  { q: T('Ville du heller visst når du dør eller hvordan?', 'Would you rather know when you die or how?'), a: T('Når', 'When'), b: T('Hvordan', 'How') },
  { q: T('Spiller for å vinne eller for moro skyld?', 'Play to win or for fun?'), a: T('For å vinne', 'To win'), b: T('For moro skyld', 'For fun') },
];

/** «Samme tanke»: alle skriver ett svar – poeng for å tenke likt som de andre. */
const SAMME: Tekst[] = [
  T('Et typisk norsk pålegg', 'A typical sandwich topping'),
  T('Noe man tar med på hyttetur', 'Something you bring to a cabin trip'),
  T('En kjent nordmann', 'A famous Norwegian'),
  T('Noe som er gult', 'Something yellow'),
  T('Den beste drikkeleken', 'The best drinking game'),
  T('Noe man sier når man har kommet for sent', 'Something you say when you’re late'),
  T('Et sted man drar på ferie', 'A place you go on holiday'),
  T('Noe man finner i en veske', 'Something you find in a handbag'),
  T('En sang alle kan teksten til', 'A song everyone knows the words to'),
  T('En grunn til å dra tidlig hjem', 'A reason to go home early'),
  T('Noe man angrer på dagen derpå', 'Something you regret the morning after'),
  T('En by i Norge', 'A city in Norway'),
  T('Noe som lukter godt', 'Something that smells nice'),
  T('En ting på en fredagstaco', 'Something in Friday tacos'),
  T('En kjendis alle har vært litt forelsket i', 'A celebrity everyone has had a crush on'),
  T('Noe man gjør på 17. mai', 'Something you do on Constitution Day'),
  T('Et dyr i skogen', 'A forest animal'),
  T('Noe man roper på en fotballkamp', 'Something you shout at a football match'),
  T('Et typisk nachspiel-snacks', 'A typical afterparty snack'),
  T('En serie alle har sett', 'A series everyone has watched'),
  T('Et ord som rimer på «vors»', 'A word that rhymes with “pour”'),
  T('Noe som er kaldt', 'Something cold'),
  T('En app alle har på telefonen', 'An app everyone has on their phone'),
  T('Noe man glemmer når man skal reise', 'Something you forget when you travel'),
  T('En farge på en bil', 'A colour of a car'),
  T('En julerett', 'A Christmas dish'),
  T('Noe man ikke skal si på første date', 'Something you shouldn’t say on a first date'),
  T('Et vanlig passord', 'A common password'),
];

/** «Magefølelsen»: tallspørsmål (stabile fakta). Nærmest vinner. */
const MAGE: { q: Tekst; a: number; e: Tekst }[] = [
  { q: T('Hvor høy er Galdhøpiggen?', 'How high is Galdhøpiggen, Norway’s highest mountain?'), a: 2469, e: T('meter', 'metres') },
  { q: T('Hvor høy er Snøhetta?', 'How high is Snøhetta?'), a: 2286, e: T('meter', 'metres') },
  { q: T('Hvor mange representanter sitter på Stortinget?', 'How many members does the Norwegian parliament have?'), a: 169, e: T('representanter', 'members') },
  { q: T('Hvilket år fikk Norge sin grunnlov?', 'In what year did Norway get its constitution?'), a: 1814, e: T('', '') },
  { q: T('Hvilket år ble unionen med Sverige oppløst?', 'In what year was the union with Sweden dissolved?'), a: 1905, e: T('', '') },
  { q: T('Hvilket år ble Harald V konge?', 'In what year did Harald V become king?'), a: 1991, e: T('', '') },
  { q: T('Hvor mange bokstaver har det norske alfabetet?', 'How many letters are there in the Norwegian alphabet?'), a: 29, e: T('bokstaver', 'letters') },
  { q: T('Hvor lang er Lærdalstunnelen?', 'How long is the Lærdal Tunnel?'), a: 24.5, e: T('km', 'km') },
  { q: T('Hvor høyt er Preikestolen over Lysefjorden?', 'How high is Preikestolen (Pulpit Rock) above the fjord?'), a: 604, e: T('meter', 'metres') },
  { q: T('Hvor dyp er Mjøsa på det dypeste?', 'How deep is Mjøsa, Norway’s largest lake, at its deepest?'), a: 453, e: T('meter', 'metres') },
  { q: T('Hvor lang er Sognefjorden?', 'How long is the Sognefjord?'), a: 205, e: T('km', 'km') },
  { q: T('Hvilket år fant man olje på Ekofisk?', 'In what year was oil found at Ekofisk?'), a: 1969, e: T('', '') },
  { q: T('Hvilket år startet NRK med fast TV-sending?', 'In what year did NRK start regular TV broadcasts?'), a: 1960, e: T('', '') },
  { q: T('Hvilket år kom Kvikk Lunsj på markedet?', 'In what year was Kvikk Lunsj launched?'), a: 1937, e: T('', '') },
  { q: T('Hvor mange OL-gull tok Marit Bjørgen?', 'How many Olympic golds did Marit Bjørgen win?'), a: 8, e: T('gull', 'golds') },
  { q: T('Hvor mange OL-medaljer tok Marit Bjørgen til sammen?', 'How many Olympic medals did Marit Bjørgen win in total?'), a: 15, e: T('medaljer', 'medals') },
  { q: T('Hvor mange skulpturer laget Gustav Vigeland til Vigelandsanlegget?', 'How many sculptures did Gustav Vigeland make for the Vigeland Park?'), a: 212, e: T('skulpturer', 'sculptures') },
  { q: T('Hvor mange havner anløper Hurtigruten mellom Bergen og Kirkenes?', 'How many ports does the Hurtigruten coastal route call at between Bergen and Kirkenes?'), a: 34, e: T('havner', 'ports') },
  { q: T('Hvor mange bein har et voksent menneske?', 'How many bones does an adult human have?'), a: 206, e: T('bein', 'bones') },
  { q: T('Hvor mange tenner har et voksent menneske (med visdomstenner)?', 'How many teeth does an adult have (including wisdom teeth)?'), a: 32, e: T('tenner', 'teeth') },
  { q: T('Hvor mange hjerter har en blekksprut?', 'How many hearts does an octopus have?'), a: 3, e: T('hjerter', 'hearts') },
  { q: T('Hvor høyt er Mount Everest?', 'How high is Mount Everest?'), a: 8849, e: T('meter', 'metres') },
  { q: T('Hvor raskt går lyd i luft?', 'How fast does sound travel in air?'), a: 343, e: T('meter per sekund', 'metres per second') },
  { q: T('Hvor mange prosent av kroppen til en voksen er vann?', 'What percentage of an adult body is water?'), a: 60, e: T('prosent', 'percent') },
  { q: T('Hvor mange kommuner har Norge (fra 2024)?', 'How many municipalities does Norway have (from 2024)?'), a: 357, e: T('kommuner', 'municipalities') },
  { q: T('Hvor mange fylker har Norge (fra 2024)?', 'How many counties does Norway have (from 2024)?'), a: 15, e: T('fylker', 'counties') },
  { q: T('Hvor lang er Lysefjorden?', 'How long is the Lysefjord?'), a: 42, e: T('km', 'km') },
  { q: T('Hvor mange OL-gull tok Ole Einar Bjørndalen?', 'How many Olympic golds did Ole Einar Bjørndalen win?'), a: 8, e: T('gull', 'golds') },
  { q: T('Hvor mange dager har et skuddår?', 'How many days are there in a leap year?'), a: 366, e: T('dager', 'days') },
  { q: T('Hvor mange spillere er det på banen i et håndballag?', 'How many players does a handball team have on court?'), a: 7, e: T('spillere', 'players') },
];

/** Forslag til titler vinneren kan gi taperen. */
const TITLER: Tekst[] = [
  T('Kveldens svakeste ledd', 'Weakest link of the night'), T('Gjengens lærling', 'The crew’s apprentice'), T('Visepresident for ingenting', 'Vice president of nothing'),
  T('Evig reserve', 'Eternal substitute'), T('Gjengens maskot', 'The crew’s mascot'), T('Den som bærer ølkassa', 'Keeper of the crate'),
  T('Assisterende lovbryter', 'Assistant lawbreaker'), T('Kveldens tapte sjel', 'Lost soul of the night'), T('Offisiell DJ-slave', 'Official DJ servant'),
  T('Nestleder i skam', 'Deputy head of shame'), T('Gjengens bekymring', 'The crew’s concern'), T('Hobbyfilosof', 'Hobby philosopher'),
];

/** Forseglede konvolutter: åpnes når gjengen når en milepæl, og endrer spillet for alltid. */
type Konvolutt = { id: string; nr: number; hint: Tekst; tittel: Tekst; tekst: Tekst; gir: string | null; laas: (l: any) => boolean };
export const KONVOLUTTER: Konvolutt[] = [
  { id: 'k1', nr: 1, hint: T('Åpnes etter første kveld', 'Opens after the first night'), gir: 'mage',
    tittel: T('Magefølelsen', 'Gut feeling'), laas: (l) => l.kvelder >= 1,
    tekst: T('Fra nå av får spillet tallrunder: et spørsmål med et tall som svar. Nærmest får 3 poeng, lengst unna drikker 2.',
      'From now on the game has number rounds: a question with a number as the answer. Closest gets 3 points, furthest away drinks 2.') },
  { id: 'k2', nr: 2, hint: T('Åpnes når tre lover gjelder samtidig', 'Opens when three laws are in force at the same time'), gir: 'opphev',
    tittel: T('Makt til å rive', 'The power to repeal'), laas: (l) => (l.lover || []).filter((x: any) => x.status === 'gjelder').length >= 3,
    tekst: T('Kveldens vinner kan nå velge å oppheve en lov i stedet for å lage en ny. Gjengen må fortsatt stemme.',
      'The winner of the night can now choose to repeal a law instead of making a new one. The crew still has to vote.') },
  { id: 'k3', nr: 3, hint: T('Åpnes når noen har vunnet to kvelder', 'Opens when someone has won two nights'), gir: 'mester',
    tittel: T('Kronen er tung', 'Heavy is the crown'), laas: (l) => Object.values(l.seire || {}).some((n: any) => n >= 2),
    tekst: T('Den med flest seire bærer kronen 👑 og starter hver kveld på minus to poeng. Vil du ha kronen, må du tåle den.',
      'Whoever has the most wins wears the crown 👑 and starts every night on minus two points. If you want the crown, you have to handle it.') },
  { id: 'k4', nr: 4, hint: T('Åpnes første gang noen bruker vetoen sin', 'Opens the first time someone uses their veto'), gir: 'dobbel',
    tittel: T('Alt eller ingenting', 'All or nothing'), laas: (l) => (l.vetoBrukt || 0) >= 1,
    tekst: T('Siste runde hver kveld gir dobbelt så mange poeng. Ingen ledelse er trygg.',
      'The last round of every night is worth double points. No lead is safe.') },
  { id: 'k5', nr: 5, hint: T('Åpnes når ti lover har blitt vedtatt', 'Opens when ten laws have been passed'), gir: 'grunnlov',
    tittel: T('Grunnloven', 'The constitution'), laas: (l) => (l.vedtatt || 0) >= 10,
    tekst: T('Den eldste loven som fortsatt gjelder, blir grunnlov. Den kan aldri oppheves, ankes eller vetoes.',
      'The oldest law still in force becomes the constitution. It can never be repealed, appealed or vetoed.') },
  { id: 'k6', nr: 6, hint: T('Åpnes etter sjette kveld', 'Opens after the sixth night'), gir: null,
    tittel: T('Vorsbørsen', 'The Pre-game Exchange'), laas: (l) => l.kvelder >= 6,
    tekst: T('Noen har begynt å handle aksjer i dere. Vorsbørsen åpner snart – og da er det dere som er markedet.',
      'Someone has started trading shares in you. The Pre-game Exchange opens soon – and you are the market.') },
];

/* =====================================================================
   1) Lovboka
   ===================================================================== */
export function tomLov() {
  return { v: 1, sesong: 1, kvelder: 0, vedtatt: 0, vetoBrukt: 0, lover: [] as any[], titler: [] as any[], seire: {} as any, tap: {} as any,
    konvolutter: [] as any[], ulast: [] as string[], veto: {} as any, logg: [] as any[], brukt: [] as string[] };
}
export function lesLov(x: any) {
  const l = Object.assign(tomLov(), x && typeof x === 'object' ? x : {});
  ['lover', 'titler', 'konvolutter', 'ulast', 'logg', 'brukt'].forEach((k) => { if (!Array.isArray((l as any)[k])) (l as any)[k] = []; });
  ['seire', 'tap', 'veto'].forEach((k) => { if (!(l as any)[k] || typeof (l as any)[k] !== 'object') (l as any)[k] = {}; });
  return l;
}
const nokkel = (konto: string | null | undefined, navn: string) => (konto ? 'k:' + konto : 'n:' + String(navn || '').trim().toLowerCase());
function logg(l: any, tekst: Tekst, dato: number) { l.logg.unshift({ dato, ...tekst }); l.logg = l.logg.slice(0, 200); }
function harVeto(l: any, konto: string | null) { return !!konto && l.veto[konto] !== l.sesong; }

/** Åpner konvolutter gjengen har låst opp. Gir id-ene som ble åpnet nå. */
function sjekkKonvolutter(l: any, dato: number) {
  const nye: string[] = [];
  KONVOLUTTER.forEach((k) => {
    if (l.konvolutter.some((x: any) => x.id === k.id) || !k.laas(l)) return;
    l.konvolutter.push({ id: k.id, dato, kveld: l.kvelder });
    if (k.gir && !l.ulast.includes(k.gir)) l.ulast.push(k.gir);
    if (k.gir === 'grunnlov') { const eldst = l.lover.filter((x: any) => x.status === 'gjelder').sort((a: any, b: any) => a.dato - b.dato)[0]; if (eldst) eldst.grunnlov = true; }
    logg(l, T(`✉️ Konvolutt ${k.nr} ble åpnet: ${k.tittel.no}`, `✉️ Envelope ${k.nr} was opened: ${k.tittel.en}`), dato);
    nye.push(k.id);
  });
  return nye;
}

/**
 * Legger kvelden inn i lovboka. Trygt å kjøre flere ganger (samme kveld telles bare én gang).
 * Hendelser: dom, lov, opphev, avvist, veto, tittel, kveld.
 */
export function anvend(lov: any, hendelser: any[], kveldId: string, dato = Date.now()) {
  const l = lesLov(lov);
  if (l.brukt.includes(kveldId)) return { lov: l, nye: [] as string[] };
  l.brukt.push(kveldId); l.brukt = l.brukt.slice(-60);
  l.kvelder++;
  let n = 0;
  hendelser.forEach((h) => {
    if (h.type === 'dom') {
      const x = l.lover.find((y: any) => y.id === h.lovId); if (!x || x.status !== 'anket') return;
      x.status = h.beholdt ? 'gjelder' : 'opphevet'; x.dom = { beholdt: !!h.beholdt, kveld: l.kvelder, dato };
      logg(l, h.beholdt ? T(`⚖️ Anken mot «${x.tekst}» ble avvist. Loven står.`, `⚖️ The appeal against “${x.tekst}” was rejected. The law stands.`)
        : T(`⚖️ «${x.tekst}» ble opphevet etter anke fra ${x.anketNavn}.`, `⚖️ “${x.tekst}” was repealed after an appeal by ${x.anketNavn}.`), dato);
    }
    if (h.type === 'lov') {
      l.lover.push({ id: kveldId + '-' + (n++), tekst: h.tekst, av: h.av, avKonto: h.avKonto || null, kveld: l.kvelder, dato, status: 'gjelder',
        ja: h.ja || 0, nei: h.nei || 0, stemteKonto: h.stemteKonto || [] });
      l.vedtatt = (l.vedtatt || 0) + 1;
      logg(l, T(`📜 ${h.av} innførte loven «${h.tekst}» (${h.ja}–${h.nei})`, `📜 ${h.av} introduced the law “${h.tekst}” (${h.ja}–${h.nei})`), dato);
    }
    if (h.type === 'opphev') {
      const x = l.lover.find((y: any) => y.id === h.lovId); if (!x || x.grunnlov || (x.status !== 'gjelder' && x.status !== 'anket')) return;
      x.status = 'opphevet';
      logg(l, T(`🗑️ ${h.av} fikk opphevet loven «${x.tekst}» (${h.ja}–${h.nei})`, `🗑️ ${h.av} got the law “${x.tekst}” repealed (${h.ja}–${h.nei})`), dato);
    }
    if (h.type === 'avvist') logg(l, T(`🙅 Gjengen stemte ned forslaget til ${h.av}: «${h.tekst}» (${h.ja}–${h.nei})`, `🙅 The crew voted down ${h.av}’s proposal: “${h.tekst}” (${h.ja}–${h.nei})`), dato);
    if (h.type === 'veto') {
      if (h.konto) l.veto[h.konto] = l.sesong;
      l.vetoBrukt = (l.vetoBrukt || 0) + 1;
      logg(l, T(`✋ ${h.navn} brukte vetoen sin mot «${h.tekst}»`, `✋ ${h.navn} used their veto against “${h.tekst}”`), dato);
    }
    if (h.type === 'tittel') {
      l.titler = l.titler.filter((x: any) => x.kveld === l.kvelder);        // gamle titler slippes når en ny kveld er spilt
      l.titler.push({ navn: h.navn, konto: h.konto || null, tittel: h.tittel, gittAv: h.gittAv, kveld: l.kvelder, dato, type: h.hva || 'taper' });
      logg(l, T(`🏷️ ${h.navn} fikk tittelen «${h.tittel}»`, `🏷️ ${h.navn} got the title “${h.tittel}”`), dato);
    }
    if (h.type === 'kveld') {
      if (h.vinner) { const k = nokkel(h.vinner.konto, h.vinner.navn); l.seire[k] = (l.seire[k] || 0) + 1; }
      if (h.taper) { const k = nokkel(h.taper.konto, h.taper.navn); l.tap[k] = (l.tap[k] || 0) + 1; }
      logg(l, T(`🏆 Kveld ${l.kvelder}: ${h.vinner ? h.vinner.navn : '–'} vant${h.taper ? ', ' + h.taper.navn + ' tapte' : ''}`,
        `🏆 Night ${l.kvelder}: ${h.vinner ? h.vinner.navn : '–'} won${h.taper ? ', ' + h.taper.navn + ' lost' : ''}`), dato);
    }
  });
  // Titler fra forrige kveld gjelder til en ny kveld er spilt
  if (!hendelser.some((h) => h.type === 'tittel')) l.titler = [];
  const nye = sjekkKonvolutter(l, dato);
  return { lov: l, nye };
}

/** Anke fra gjengsiden: bare medlemmer som ikke stemte over loven, og bare før neste kveld. */
export function anke(lov: any, lovId: string, konto: string, navn: string, grunn = '') {
  const l = lesLov(lov), x = l.lover.find((y: any) => y.id === lovId);
  if (!x) return { feil: 'Fant ikke loven.' };
  if (x.grunnlov) return { feil: 'Grunnloven kan ikke ankes.' };
  if (x.status !== 'gjelder') return { feil: 'Loven kan ikke ankes nå.' };
  if (x.kveld !== l.kvelder) return { feil: 'Fristen er ute – lover kan bare ankes før neste kveld.' };
  if ((x.stemteKonto || []).includes(konto)) return { feil: 'Du var med og stemte, så du kan ikke anke.' };
  x.status = 'anket'; x.anketKonto = konto; x.anketNavn = navn; x.anketDato = Date.now(); x.grunn = String(grunn || '').slice(0, 140);
  logg(l, T(`📣 ${navn} anket loven «${x.tekst}». Det blir rettssak neste kveld.`, `📣 ${navn} appealed the law “${x.tekst}”. It goes to trial next night.`), Date.now());
  return { lov: l };
}
/** Veto fra gjengsiden: ett per medlem per sesong. */
export function veto(lov: any, lovId: string, konto: string, navn: string) {
  const l = lesLov(lov), x = l.lover.find((y: any) => y.id === lovId);
  if (!x) return { feil: 'Fant ikke loven.' };
  if (x.grunnlov) return { feil: 'Grunnloven kan ikke vetoes.' };
  if (x.status !== 'gjelder' && x.status !== 'anket') return { feil: 'Loven gjelder ikke.' };
  if (!harVeto(l, konto)) return { feil: 'Du har allerede brukt vetoen din denne sesongen.' };
  x.status = 'vetoet'; x.vetoNavn = navn;
  l.veto[konto] = l.sesong; l.vetoBrukt = (l.vetoBrukt || 0) + 1;
  logg(l, T(`✋ ${navn} brukte vetoen sin mot «${x.tekst}»`, `✋ ${navn} used their veto against “${x.tekst}”`), Date.now());
  const nye = sjekkKonvolutter(l, Date.now());
  return { lov: l, nye };
}

/** Lovboka slik den vises (uten konto-id-er). meg = kontoen som ser på, for å vise hva hen kan gjøre. */
export function visLov(lov: any, meg: string | null, lang: Lang = 'no') {
  const l = lesLov(lov), tx = (x: Tekst) => x[lang];
  return {
    sesong: l.sesong, kvelder: l.kvelder,
    lover: l.lover.map((x: any) => ({ id: x.id, tekst: x.tekst, av: x.av, kveld: x.kveld, dato: x.dato, status: x.status, ja: x.ja, nei: x.nei, grunnlov: !!x.grunnlov,
      anketNavn: x.anketNavn || null, grunn: x.grunn || null, dom: x.dom || null, vetoNavn: x.vetoNavn || null,
      kanAnke: !!(meg && x.status === 'gjelder' && !x.grunnlov && x.kveld === l.kvelder && !(x.stemteKonto || []).includes(meg)),
      kanVeto: !!(meg && (x.status === 'gjelder' || x.status === 'anket') && !x.grunnlov && harVeto(l, meg)) })).reverse(),
    titler: l.titler.map((x: any) => ({ navn: x.navn, tittel: x.tittel, gittAv: x.gittAv, type: x.type })),
    konvolutter: KONVOLUTTER.map((k) => {
      const a = l.konvolutter.find((x: any) => x.id === k.id);
      return a ? { nr: k.nr, apnet: true, tittel: tx(k.tittel), tekst: tx(k.tekst), kveld: a.kveld } : { nr: k.nr, apnet: false, hint: tx(k.hint) };
    }),
    logg: l.logg.slice(0, 30).map((x: any) => ({ dato: x.dato, tekst: x[lang] || x.no })),
    harVeto: harVeto(l, meg),
    krone: kronebaerer(l),
  };
}
function kronebaerer(l: any): string | null {
  if (!l.ulast.includes('mester')) return null;
  const e = Object.entries(l.seire || {}).sort((a: any, b: any) => b[1] - a[1]);
  if (!e.length || (e[1] && e[1][1] === e[0][1])) return null;
  return e[0][0] as string;
}

/* =====================================================================
   2) Spillet i rommet
   ===================================================================== */
function tilfeldig(n: number) { const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] % n; }
function stokk<T>(xs: T[]): T[] { const a = xs.slice(); for (let i = a.length - 1; i > 0; i--) { const j = tilfeldig(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function settFrist(s: any, sek: number) { s.frist = Date.now() + sek * 1000 + 1500; }
function fristUte(s: any) { return !s.frist || Date.now() >= s.frist - 800; }
function melde(data: any, no: string, en: string) { data.nr = (data.nr || 0) + 1; data.hendelse = { nr: data.nr, tekst: no, en }; }
function giSlurker(data: any, id: string, n: number) { const p = data.spillere.find((x: any) => x.id === id); if (p) p.slurker = Math.max(0, (p.slurker || 0) + n); }
function navnPaa(data: any, id: string) { const p = data.spillere.find((x: any) => x.id === id); return p ? p.navn : '?'; }
function rens(x: any, n = 120) { return String(x == null ? '' : x).replace(/[\u0000-\u001f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, n); }
function norm(x: any) { return String(x || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9æøå ]/g, ' ').replace(/\s+/g, ' ').trim(); }
function trekk<X>(s: any, felt: string, liste: X[]): X {
  s.brukt = s.brukt || {}; const b: number[] = s.brukt[felt] || (s.brukt[felt] = []);
  if (b.length >= liste.length) b.length = 0;
  let i = tilfeldig(liste.length), vakt = 0; while (b.includes(i) && vakt++ < 200) i = tilfeldig(liste.length);
  b.push(i); return liste[i];
}
const FRIST = { rett: 75, tall: 45, kjenner: 30, samme: 35, mage: 40, forslag: 120, stem: 45, tittel: 60 };
const NAVN = T('⚖️ Gjengens lov', '⚖️ The Crew’s Law');
const ids = (data: any) => data.spillere.map((p: any) => p.id);
/** Medlemmer av gjengen som er i rommet (de kan stemme). */
function medlemmer(data: any) { return data.spillere.filter((p: any) => p.konto); }
function velgere(data: any) { const m = medlemmer(data); return m.length ? m : data.spillere; }

/** Starter kvelden. snap = lovboka slik den var i databasen (lagres i rommet, men vises aldri rått). */
export function startLov(data: any, snap: any, modus: string) {
  if (!data.gjeng) return { feil: 'gjeng', melding: 'Velg gjengen i lobbyen først.', en: 'Pick the crew in the lobby first.' };
  if (!snap) return { feil: 'gjeng', melding: 'Fikk ikke hentet lovboka. Prøv igjen.', en: 'Couldn’t load the law book. Try again.' };
  if (data.spillere.length < 3) return { feil: 'for-faa', melding: 'Gjengens lov trenger minst tre spillere.', en: 'The Crew’s Law needs at least three players.' };
  const lov = lesLov(snap.lov);
  const runder = [4, 6, 8].includes(Number(modus)) ? Number(modus) : 6;
  const kveldId = data.gjeng.id.slice(0, 8) + '-' + (data.laget || 0) + '-' + Date.now().toString(36);
  const s: any = {
    type: 'lov', lek: 'lov', navn: NAVN, modus: T(runder + ' runder', runder + ' rounds'), fase: 'intro', kveldId, snap: lov, runder, rundeNr: 0,
    poeng: {}, hendelser: [], rett: [], rettI: 0, rettStemmer: {}, ulast: lov.ulast.slice(), lagret: false, nye: [], nyI: 0,
  };
  // Anker som venter: rettssak nå, hvis den som anket er her
  const tilStede = new Set(medlemmer(data).map((p: any) => p.konto));
  s.rett = lov.lover.filter((x: any) => x.status === 'anket' && tilStede.has(x.anketKonto)).map((x: any) => x.id);
  // Kronen (konvolutt 3): den med flest seire starter på minus to
  const krone = kronebaerer(lov);
  data.spillere.forEach((p: any) => { s.poeng[p.id] = 0; if (krone && nokkel(p.konto, p.navn) === krone) { s.poeng[p.id] = -2; s.krone = p.id; } });
  // Rundetypene: tall, kjenner, samme – og magefølelsen når konvolutt 1 er åpnet
  const typer = ['tall', 'kjenner', 'samme'].concat(s.ulast.includes('mage') ? ['mage'] : []);
  s.rekke = []; while (s.rekke.length < runder) s.rekke.push(...stokk(typer));
  s.rekke = s.rekke.slice(0, runder);
  data.spill = s;
  melde(data, `⚖️ Gjengens lov – kveld ${lov.kvelder + 1} for ${data.gjeng.navn}`, `⚖️ The Crew’s Law – night ${lov.kvelder + 1} for ${data.gjeng.navn}`);
  return { ok: true };
}

function nyRunde(data: any) {
  const s = data.spill;
  s.rundeNr++;
  const type = s.rekke[s.rundeNr - 1];
  s.r = { type, svar: {}, fasit: null };
  if (type === 'tall') { s.r.q = trekk(s, 'tall', TALL); settFrist(s, FRIST.tall); }
  if (type === 'kjenner') {
    const l = ids(data); s.r.hoved = l[(s.rundeNr - 1) % l.length];
    const x = trekk(s, 'kjenner', KJENNER); Object.assign(s.r, { q: x.q, a: x.a, b: x.b }); settFrist(s, FRIST.kjenner);
  }
  if (type === 'samme') { s.r.q = trekk(s, 'samme', SAMME); settFrist(s, FRIST.samme); }
  if (type === 'mage') { const x = trekk(s, 'mage', MAGE); Object.assign(s.r, { q: x.q, fasitTall: x.a, e: x.e }); settFrist(s, FRIST.mage); }
  s.fase = 'runde';
}
const erSiste = (s: any) => s.rundeNr >= s.runder;
function gi(s: any, id: string, n: number) { s.poeng[id] = (s.poeng[id] || 0) + (erSiste(s) && s.ulast.includes('dobbel') ? n * 2 : n); }

function avgjorRunde(data: any) {
  const s = data.spill, r = s.r, alle = ids(data);
  const f: any = { poeng: {}, drikker: [] };
  const pluss = (id: string, n: number) => { gi(s, id, n); f.poeng[id] = (f.poeng[id] || 0) + n * (erSiste(s) && s.ulast.includes('dobbel') ? 2 : 1); };
  if (r.type === 'tall') {
    const svarte = Object.keys(r.svar), antallJa = svarte.filter((id) => r.svar[id].ja).length;
    f.antall = antallJa; f.av = svarte.length;
    const avvik = svarte.map((id) => [id, Math.abs(r.svar[id].gjett - antallJa)] as [string, number]);
    avvik.forEach(([id, d]) => { if (d === 0) pluss(id, 3); else if (d === 1) pluss(id, 1); });
    const maks = Math.max(0, ...avvik.map((x) => x[1]));
    if (maks > 0) f.drikker = avvik.filter((x) => x[1] === maks).map((x) => x[0]);
    f.gjett = Object.fromEntries(svarte.map((id) => [id, r.svar[id].gjett]));
  }
  if (r.type === 'kjenner') {
    const valg = r.svar[r.hoved];
    const gjettere = Object.keys(r.svar).filter((id) => id !== r.hoved);
    f.valg = valg ?? null;
    if (valg == null) { f.drikker = [r.hoved]; }   // hovedpersonen svarte ikke
    else {
      const riktige = gjettere.filter((id) => r.svar[id] === valg), feil = gjettere.filter((id) => r.svar[id] !== valg);
      riktige.forEach((id) => pluss(id, 1));
      if (feil.length > riktige.length) pluss(r.hoved, 2);
      f.drikker = feil; f.riktige = riktige;
    }
    f.gjett = Object.fromEntries(gjettere.map((id) => [id, r.svar[id]]));
  }
  if (r.type === 'samme') {
    const g: any = {};
    Object.entries(r.svar).forEach(([id, t]: any) => { const k = norm(t); if (!k) return; (g[k] = g[k] || { t, ider: [] }).ider.push(id); });
    f.grupper = Object.values(g).sort((a: any, b: any) => b.ider.length - a.ider.length);
    f.grupper.forEach((gr: any) => { if (gr.ider.length > 1) gr.ider.forEach((id: string) => pluss(id, Math.min(3, gr.ider.length - 1))); });
    f.drikker = alle.filter((id: string) => { const gr = f.grupper.find((x: any) => x.ider.includes(id)); return !gr || gr.ider.length < 2; });
  }
  if (r.type === 'mage') {
    const svarte = Object.keys(r.svar).map((id) => [id, Math.abs(r.svar[id] - r.fasitTall)] as [string, number]).sort((a, b) => a[1] - b[1]);
    f.fasit = r.fasitTall; f.svar = Object.fromEntries(Object.keys(r.svar).map((id) => [id, r.svar[id]]));
    if (svarte.length) {
      const best = svarte[0][1]; svarte.filter((x) => x[1] === best).forEach((x) => pluss(x[0], 3));
      const nest = svarte.find((x) => x[1] > best); if (nest) svarte.filter((x) => x[1] === nest[1]).forEach((x) => pluss(x[0], 1));
      const verst = svarte[svarte.length - 1][1]; if (verst > best) f.drikker = svarte.filter((x) => x[1] === verst).map((x) => x[0]);
    }
    // De som ikke svarte, drikker også
    f.drikker = (f.drikker || []).concat(alle.filter((id: string) => r.svar[id] == null && !(f.drikker || []).includes(id)));
  }
  const slurker = r.type === 'tall' || r.type === 'mage' ? 2 : 1;
  (f.drikker || []).forEach((id: string) => giSlurker(data, id, slurker));
  f.slurker = slurker;
  r.fasit = f; s.fase = 'fasit'; s.frist = null;
}
function alleHarSvart(data: any, r: any) {
  if (r.type === 'kjenner') return ids(data).every((id: string) => r.svar[id] != null);
  return ids(data).every((id: string) => r.svar[id] != null);
}

function stilling(data: any) {
  const s = data.spill;
  return data.spillere.map((p: any) => ({ id: p.id, poeng: s.poeng[p.id] || 0, slurker: p.slurker || 0 }))
    .sort((a: any, b: any) => b.poeng - a.poeng || a.slurker - b.slurker);
}
function tilResultat(data: any) {
  const s = data.spill, st = stilling(data);
  s.vinner = st[0].id;
  const lavest = st[st.length - 1];
  const tapere = st.filter((x: any) => x.poeng === lavest.poeng).sort((a: any, b: any) => b.slurker - a.slurker);
  s.taper = tapere[0].id !== s.vinner ? tapere[0].id : null;
  s.fase = 'resultat'; s.frist = null;
  melde(data, `🏆 ${navnPaa(data, s.vinner)} vant kvelden og får skrive en lov!`, `🏆 ${navnPaa(data, s.vinner)} won the night and gets to write a law!`);
}
function lovIKraft(s: any) { return s.snap.lover.filter((x: any) => (x.status === 'gjelder' || x.status === 'anket') && !x.grunnlov); }

function tilStemming(data: any) {
  const s = data.spill; s.fase = 'stem'; s.stemmer = {}; settFrist(s, FRIST.stem);
}
function tellStemmer(data: any) {
  const s = data.spill, v = velgere(data);
  const ja = v.filter((p: any) => s.stemmer[p.id] === true).length, nei = v.filter((p: any) => s.stemmer[p.id] === false).length;
  s.resultatStem = { ja, nei };
  s.vedtatt = ja >= nei;   // uavgjort: vinneren får det som hen vil
  const vinner = data.spillere.find((p: any) => p.id === s.vinner) || { navn: '?', konto: null };
  const stemteKonto = v.filter((p: any) => s.stemmer[p.id] != null && p.konto).map((p: any) => p.konto);
  if (s.forslag.type === 'opphev') {
    s.hendelser.push(s.vedtatt ? { type: 'opphev', lovId: s.forslag.lovId, av: vinner.navn, ja, nei } : { type: 'avvist', tekst: 'Opphev «' + s.forslag.tekst + '»', av: vinner.navn, ja, nei });
  } else if (!s.vedtatt) s.hendelser.push({ type: 'avvist', tekst: s.forslag.tekst, av: vinner.navn, ja, nei });
  else s.nyLov = { type: 'lov', tekst: s.forslag.tekst, av: vinner.navn, avKonto: vinner.konto || null, ja, nei, stemteKonto };
  s.fase = 'vedtatt'; s.frist = null; s.vetoAv = null;
  melde(data, s.vedtatt ? '📜 Vedtatt!' : '🙅 Nedstemt!', s.vedtatt ? '📜 Passed!' : '🙅 Voted down!');
}
function etterLov(data: any) {
  const s = data.spill;
  if (s.nyLov) { s.hendelser.push(s.nyLov); s.nyLov = null; }
  if (s.taper) {
    const valg = stokk(TITLER).slice(0, 3); s.tittelValg = valg; s.fase = 'tittel'; settFrist(s, FRIST.tittel);
  } else avslutt(data);
}
function avslutt(data: any) {
  const s = data.spill;
  const p = (id: string | null) => { const x = id && data.spillere.find((y: any) => y.id === id); return x ? { navn: x.navn, konto: x.konto || null } : null; };
  s.hendelser.push({ type: 'kveld', vinner: p(s.vinner), taper: p(s.taper) });
  // Regn ut hva som skjer i lovboka (samme regel som når den lagres) for å vise konvolutter som åpnes
  const { lov, nye } = anvend(structuredClone(s.snap), s.hendelser, s.kveldId);
  s.etter = lov; s.nye = nye; s.nyI = 0;
  s.fase = nye.length ? 'konvolutt' : 'ferdig'; s.frist = null;
  if (nye.length) melde(data, `✉️ En konvolutt skal åpnes!`, `✉️ An envelope is about to be opened!`);
}

export function lovHandling(data: any, meg: any, h: any): any {
  const s = data.spill, hd = h.handling, erVert = meg.id === data.vert;
  const kanStemme = () => velgere(data).some((p: any) => p.id === meg.id);
  // Starte kvelden (etter intro og eventuelle rettssaker)
  if (hd === 'lov-start') {
    if (!erVert) return { feil: 'bare-vert' };
    if (s.fase !== 'intro') return { ok: true };
    if (s.rett.length) { s.fase = 'rett'; s.rettI = 0; s.rettStemmer = {}; settFrist(s, FRIST.rett); return { ok: true }; }
    nyRunde(data); return { ok: true };
  }
  if (hd === 'lov-rett-stem') {
    if (s.fase !== 'rett' || !kanStemme()) return { ok: true };
    s.rettStemmer[meg.id] = h.behold === true;
    if (velgere(data).every((p: any) => s.rettStemmer[p.id] != null)) dom(data);
    return { ok: true };
  }
  if (hd === 'lov-svar') {
    if (s.fase !== 'runde') return { feil: 'for-sent', melding: 'Runden er over.', en: 'The round is over.' };
    const r = s.r;
    if (r.type === 'tall') {
      const g = Math.round(Number(h.gjett)); if (!(g >= 0 && g <= data.spillere.length) || typeof h.ja !== 'boolean') return { feil: 'ugyldig', melding: 'Svar ja eller nei, og gjett et tall.', en: 'Answer yes or no, and guess a number.' };
      r.svar[meg.id] = { ja: h.ja, gjett: g };
    } else if (r.type === 'kjenner') {
      const v = Number(h.v); if (v !== 0 && v !== 1) return { ok: true };
      r.svar[meg.id] = v;
    } else if (r.type === 'samme') {
      const t = rens(h.tekst, 40); if (!t) return { ok: true };
      r.svar[meg.id] = t;
    } else if (r.type === 'mage') {
      const n = Number(String(h.tall).replace(/\s/g, '').replace(',', '.')); if (!isFinite(n)) return { feil: 'ugyldig', melding: 'Skriv et tall.', en: 'Enter a number.' };
      r.svar[meg.id] = n;
    }
    if (alleHarSvart(data, r)) avgjorRunde(data);
    return { ok: true };
  }
  if (hd === 'tid-ute' && fristUte(s)) {
    if (s.fase === 'rett') dom(data);
    else if (s.fase === 'runde') avgjorRunde(data);
    else if (s.fase === 'forslag') { s.forslag = null; s.vedtatt = false; s.resultatStem = null; s.fase = 'vedtatt'; s.frist = null; s.utenForslag = true; }
    else if (s.fase === 'stem') tellStemmer(data);
    else if (s.fase === 'tittel') settTittel(data, (s.tittelValg[0] || TITLER[0]).no);
    return { ok: true };
  }
  if (hd === 'lov-neste') {
    if (!erVert) return { feil: 'bare-vert' };
    if (s.fase === 'runde') { const mangler = ids(data).filter((id: string) => s.r.svar[id] == null).length; if (mangler && !fristUte(s)) return { feil: 'vent', melding: `Venter på ${mangler} til.`, en: `Waiting for ${mangler} more.` }; avgjorRunde(data); return { ok: true }; }
    if (s.fase === 'dom') { lovEtterDom(data); return { ok: true }; }
    if (s.fase === 'fasit') { if (erSiste(s)) tilResultat(data); else nyRunde(data); return { ok: true }; }
    if (s.fase === 'resultat') { s.fase = 'forslag'; s.forslag = null; settFrist(s, FRIST.forslag); return { ok: true }; }
    if (s.fase === 'vedtatt') { etterLov(data); return { ok: true }; }
    if (s.fase === 'konvolutt') { s.nyI++; if (s.nyI >= s.nye.length) s.fase = 'ferdig'; return { ok: true }; }
    return { ok: true };
  }
  if (hd === 'lov-forslag') {
    if (s.fase !== 'forslag' || meg.id !== s.vinner) return { ok: true };
    if (h.opphev) {
      if (!s.ulast.includes('opphev')) return { ok: true };
      const x = lovIKraft(s).find((y: any) => y.id === h.opphev); if (!x) return { feil: 'ukjent', melding: 'Fant ikke loven.', en: 'Couldn’t find the law.' };
      s.forslag = { type: 'opphev', lovId: x.id, tekst: x.tekst };
    } else {
      const t = rens(h.tekst, 140); if (t.length < 4) return { feil: 'kort', melding: 'Skriv en lov på minst fire tegn.', en: 'Write a law of at least four characters.' };
      s.forslag = { type: 'ny', tekst: t };
    }
    tilStemming(data);
    melde(data, `📜 Nytt lovforslag – stem nå!`, `📜 New law proposed – vote now!`);
    return { ok: true };
  }
  if (hd === 'lov-stem') {
    if (s.fase !== 'stem' || !kanStemme()) return { ok: true };
    s.stemmer[meg.id] = h.ja === true;
    if (velgere(data).every((p: any) => s.stemmer[p.id] != null)) tellStemmer(data);
    return { ok: true };
  }
  if (hd === 'lov-veto') {
    if (s.fase !== 'vedtatt' || !s.vedtatt || s.vetoAv || !meg.konto || s.forslag?.type !== 'ny') return { ok: true };
    if (s.snap.veto[meg.konto] === s.snap.sesong || s.hendelser.some((x: any) => x.type === 'veto' && x.konto === meg.konto)) return { feil: 'veto', melding: 'Du har allerede brukt vetoen din denne sesongen.', en: 'You’ve already used your veto this season.' };
    s.vetoAv = meg.id; s.vedtatt = false;
    s.hendelser.push({ type: 'veto', konto: meg.konto, navn: meg.navn, tekst: s.nyLov ? s.nyLov.tekst : s.forslag.tekst });
    s.nyLov = null;
    melde(data, `✋ ${meg.navn} brukte vetoen sin!`, `✋ ${meg.navn} used their veto!`);
    return { ok: true };
  }
  if (hd === 'lov-tittel') {
    if (s.fase !== 'tittel' || meg.id !== s.vinner) return { ok: true };
    const t = rens(h.tittel, 40); if (!t) return { ok: true };
    settTittel(data, t); return { ok: true };
  }
  return { ok: true };
}
function dom(data: any) {
  const s = data.spill, v = velgere(data), id = s.rett[s.rettI];
  const x = s.snap.lover.find((y: any) => y.id === id);
  const behold = v.filter((p: any) => s.rettStemmer[p.id] === true).length, opphev = v.filter((p: any) => s.rettStemmer[p.id] === false).length;
  const beholdt = behold + opphev === 0 ? true : behold / (behold + opphev) >= 2 / 3;
  s.hendelser.push({ type: 'dom', lovId: id, beholdt });
  s.domVist = { tekst: x ? x.tekst : '', beholdt, behold, opphev };
  s.rettI++;
  s.fase = 'dom'; s.frist = null;
  melde(data, beholdt ? '⚖️ Loven står!' : '⚖️ Loven er opphevet!', beholdt ? '⚖️ The law stands!' : '⚖️ The law is repealed!');
}
function settTittel(data: any, tittel: string) {
  const s = data.spill, t = data.spillere.find((p: any) => p.id === s.taper);
  if (t) s.hendelser.push({ type: 'tittel', navn: t.navn, konto: t.konto || null, tittel, gittAv: navnPaa(data, s.vinner) });
  s.tittel = tittel;
  avslutt(data);
}
/** Etter en dom: neste rettssak, eller start rundene. */
export function lovEtterDom(data: any) {
  const s = data.spill;
  if (s.rettI < s.rett.length) { s.fase = 'rett'; s.rettStemmer = {}; settFrist(s, FRIST.rett); } else nyRunde(data);
}

/** Det telefonene får se. Aldri konto-id-er eller andres hemmelige svar før fasit. */
export function lovVisning(s: any, meg: any, data: any) {
  const m = meg ? meg.id : null;
  const lover = lovIKraft(s).concat(s.snap.lover.filter((x: any) => x.grunnlov && x.status === 'gjelder'))
    .map((x: any) => ({ id: x.id, tekst: x.tekst, av: x.av, status: x.status, grunnlov: !!x.grunnlov, anketNavn: x.anketNavn || null }));
  const kanStemme = !!(meg && velgere(data).some((p: any) => p.id === meg.id));
  const base: any = {
    fase: s.fase, rundeNr: s.rundeNr, runder: s.runder, kveld: s.snap.kvelder + 1, lover, krone: s.krone || null,
    titler: s.snap.titler.map((x: any) => ({ navn: x.navn, tittel: x.tittel })), poeng: s.poeng, ulast: s.ulast,
    medlemmer: data.spillere.filter((p: any) => p.konto).map((p: any) => p.id), kanStemme, dobbel: erSiste(s) && s.ulast.includes('dobbel'),
  };
  if (s.fase === 'rett' || s.fase === 'dom') {
    const x = s.snap.lover.find((y: any) => y.id === s.rett[Math.min(s.rettI, s.rett.length - 1)]);
    base.rett = x ? { tekst: x.tekst, av: x.av, anketNavn: x.anketNavn, grunn: x.grunn || null } : null;
    base.harStemt = Object.keys(s.rettStemmer || {}); base.minStemme = m ? (s.rettStemmer || {})[m] ?? null : null;
    base.dom = s.fase === 'dom' ? s.domVist : null; base.flereSaker = s.rettI < s.rett.length;
  }
  if (s.r && (s.fase === 'runde' || s.fase === 'fasit')) {
    const r = s.r;
    base.r = { type: r.type, q: r.q, a: r.a || null, b: r.b || null, e: r.e || null, hoved: r.hoved || null,
      harSvart: Object.keys(r.svar), mittSvar: m ? r.svar[m] ?? null : null, fasit: s.fase === 'fasit' ? r.fasit : null };
  }
  if (['resultat', 'forslag', 'stem', 'vedtatt', 'tittel', 'konvolutt', 'ferdig'].includes(s.fase)) {
    base.vinner = s.vinner; base.taper = s.taper;
  }
  if (s.fase === 'forslag') base.kanOppheve = s.ulast.includes('opphev') ? lovIKraft(s).map((x: any) => ({ id: x.id, tekst: x.tekst })) : null;
  if (s.fase === 'stem' || s.fase === 'vedtatt') {
    base.forslag = s.forslag; base.harStemt = Object.keys(s.stemmer || {}); base.minStemme = m ? (s.stemmer || {})[m] ?? null : null;
  }
  if (s.fase === 'vedtatt') {
    base.vedtatt = s.vedtatt; base.resultatStem = s.resultatStem; base.vetoAv = s.vetoAv; base.utenForslag = !!s.utenForslag;
    base.kanVeto = !!(meg && meg.konto && s.vedtatt && !s.vetoAv && s.forslag && s.forslag.type === 'ny' && s.snap.veto[meg.konto] !== s.snap.sesong);
  }
  if (s.fase === 'tittel') base.tittelValg = s.tittelValg;
  if (s.fase === 'konvolutt') {
    const k = KONVOLUTTER.find((x) => x.id === s.nye[s.nyI]);
    base.konvolutt = k ? { nr: k.nr, tittel: k.tittel, tekst: k.tekst } : null; base.flereKonvolutter = s.nyI + 1 < s.nye.length;
  }
  if (s.fase === 'ferdig' || s.fase === 'konvolutt') { base.tittel = s.tittel || null; base.lagret = !!s.lagret; base.hendelser = s.hendelser.map((h: any) => ({ type: h.type, tekst: h.tekst || null, navn: h.navn || null, tittel: h.tittel || null })); }
  return base;
}
