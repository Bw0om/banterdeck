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
import { kveld as kveldData } from './kveld';
type Lang = 'no' | 'en';
type Tekst = { no: string; en: string };
const T = (no: string, en: string): Tekst => ({ no, en });

/** Den aksjen handler om, får en liten bonus når det skjer – så ingen tjener på å unngå det. */
export const HOVEDROLLE = 30;
/** Butikken: bruk vorskronene på hverandre. */
export const BUTIKK = { slurk: 80, slurkOkning: 25, immun: 150, poeng: 400, maksImmun: 2, maksSlurker: 5 };
/** Prisene følger formuen i rommet: blir alle rike, blir butikken dyrere (aldri billigere enn grunnprisen). */
function prisfaktor(data: any) {
  const b = data.bors, n = data.spillere.length || 1;
  const snitt = data.spillere.reduce((sum: number, p: any) => sum + (b.saldo[p.id] != null ? b.saldo[p.id] : START_KR), 0) / n;
  return Math.max(1, snitt / START_KR);
}
const rund10 = (x: number) => Math.round(x / 10) * 10;
/** Hva n slurker koster for deg nå: hver slurk du har kjøpt i kveld gjør den neste dyrere. */
function slurkPris(data: any, id: string, n: number) {
  const b = data.bors, f = prisfaktor(data), kjopt = (b.slurkKjopt && b.slurkKjopt[id]) || 0;
  let sum = 0; for (let k = 0; k < n; k++) sum += rund10((BUTIKK.slurk + BUTIKK.slurkOkning * (kjopt + k)) * f);
  return sum;
}
function varePris(data: any, vare: 'immun' | 'poeng') { return rund10(BUTIKK[vare] * prisfaktor(data)); }
export const START_KR = 1000, UTBETALING = 100, NOTERING = 200, HONORAR = 2, BOT_SKYLDIG = 300, BOT_FALSK = 200;
const STARTKURS = 10, STEG = 6, MAKSKURS = 95;
// Markedet: hver kveld trekkes en pott fra hele lista. Hver spiller har sin egen hånd – se «markedet» under.
export const POTT_GRATIS = 40, POTT_PLUSS = 100;   // aksjer i potten per kveld
export const HAND = 6;                              // aksjer hver spiller har på hånda samtidig
export const BYTT_PRIS = 25, BYTT_SLURK = 1;   // et bytte koster enten 25 kr eller én slurk
export const MELDEBONUS = 20;                       // til den som melder noe som blir bekreftet
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
  T('Hvem sier «nå tar jeg det rolig» – og gjør det motsatte?', 'Who says “I’m taking it easy now” – and does the opposite?'),
  T('Hvem blander en drink ingen har hørt om?', 'Who mixes a drink nobody’s heard of?'),
  T('Hvem sier skål på et annet språk?', 'Who says cheers in another language?'),
  T('Hvem blir først til å bytte til vann?', 'Who’s first to switch to water?'),
  T('Hvem finner ikke glasset sitt?', 'Who can’t find their glass?'),
  T('Hvem tar noen andres drink ved en feil?', 'Who picks up someone else’s drink by mistake?'),
  T('Hvem foreslår shots?', 'Who suggests shots?'),
  T('Hvem tar over som DJ resten av kvelden?', 'Who takes over as DJ for the rest of the night?'),
  T('Hvem synger feil tekst med full selvtillit?', 'Who sings the wrong lyrics with full confidence?'),
  T('Hvem spiller luftgitar eller lufttrommer?', 'Who plays air guitar or air drums?'),
  T('Hvem ønsker seg en låt ingen andre kjenner?', 'Who requests a song nobody else knows?'),
  T('Hvem prøver å lære bort en dans?', 'Who tries to teach everyone a dance?'),
  T('Hvem sier «skru opp!» først?', 'Who says “turn it up!” first?'),
  T('Hvem spiser det siste av snacksen?', 'Who eats the last of the snacks?'),
  T('Hvem snakker om hva de skal spise på vei hjem?', 'Who talks about what they’ll eat on the way home?'),
  T('Hvem søler mat på klærne?', 'Who spills food on their clothes?'),
  T('Hvem foreslår nattmat først?', 'Who suggests late-night food first?'),
  T('Hvem kritiserer snacksen?', 'Who criticises the snacks?'),
  T('Hvem legger ut noe fra vorset først?', 'Who posts something from the pre-game first?'),
  T('Hvem viser alle en video på telefonen?', 'Who shows everyone a video on their phone?'),
  T('Hvem sjekker hvem som har sett storyen sin?', 'Who checks who has seen their story?'),
  T('Hvem sender en talemelding i løpet av kvelden?', 'Who sends a voice message during the night?'),
  T('Hvem må låne en lader?', 'Who has to borrow a charger?'),
  T('Hvem tar bilde av drinken sin?', 'Who takes a photo of their drink?'),
  T('Hvem googler noe for å vinne en diskusjon?', 'Who googles something to win an argument?'),
  T('Hvem FaceTimer noen som ikke er her?', 'Who FaceTimes someone who isn’t here?'),
  T('Hvem snubler i noe?', 'Who trips over something?'),
  T('Hvem roter bort nøklene, kortet eller telefonen?', 'Who misplaces their keys, card or phone?'),
  T('Hvem får hikke?', 'Who gets the hiccups?'),
  T('Hvem sier noe helt feil med full selvtillit?', 'Who says something completely wrong with total confidence?'),
  T('Hvem kommer tilbake fra do med nyheter?', 'Who comes back from the bathroom with news?'),
  T('Hvem ødelegger en overraskelse eller røper en hemmelighet?', 'Who spoils a surprise or lets a secret slip?'),
  T('Hvem forteller en historie som blir lengre enn planlagt?', 'Who tells a story that goes on longer than planned?'),
  T('Hvem sier «ikke si det til noen» – og forteller en hemmelighet?', 'Who says “don’t tell anyone” – and shares a secret?'),
  T('Hvem ler høyest av sin egen vits?', 'Who laughs hardest at their own joke?'),
  T('Hvem sier «det er en lang historie»?', 'Who says “it’s a long story”?'),
  T('Hvem nevner en eks?', 'Who mentions an ex?'),
  T('Hvem starter en «hva ville du gjort hvis …»-diskusjon?', 'Who starts a “what would you do if …” discussion?'),
  T('Hvem forteller om en rar drøm?', 'Who tells everyone about a weird dream?'),
  T('Hvem sier «jeg sverger» for å bli trodd?', 'Who says “I swear” to be believed?'),
  T('Hvem blir plutselig filosofisk?', 'Who suddenly gets philosophical?'),
  T('Hvem anbefaler en serie eller podkast?', 'Who recommends a series or podcast?'),
  T('Hvem sier «husker dere da …»?', 'Who says “remember when …”?'),
  T('Hvem gir noen et råd ingen ba om?', 'Who gives someone advice nobody asked for?'),
  T('Hvem roper navnet til noen på tvers av rommet?', 'Who shouts someone’s name across the room?'),
  T('Hvem avbryter noen midt i en historie?', 'Who interrupts someone in the middle of a story?'),
  T('Hvem er først til å si at de er sliten?', 'Who’s first to say they’re tired?'),
  T('Hvem vil hjem først – men blir likevel?', 'Who wants to go home first – but stays anyway?'),
  T('Hvem finner på en helt ny plan for kvelden?', 'Who comes up with a brand-new plan for the night?'),
  T('Hvem tar av seg skoene først?', 'Who takes their shoes off first?'),
  T('Hvem ender opp med å sitte på gulvet?', 'Who ends up sitting on the floor?'),
  T('Hvem sier «siste drink» minst to ganger?', 'Who says “last drink” at least twice?'),
  T('Hvem blir kjent med noen nye i kveld?', 'Who gets to know someone new tonight?'),
  T('Hvem bestiller taxi – og avbestiller den?', 'Who orders a taxi – and then cancels it?'),
  T('Hvem finner et teppe eller en pute og gjør seg komfortabel?', 'Who grabs a blanket or pillow and gets comfy?'),
  T('Hvem er sist til å gå?', 'Who’s the last to leave?'),
  T('Hvem drikker opp først?', 'Who finishes their drink first?'),
  T('Hvem blander noe i glasset som ikke hører hjemme der?', 'Who mixes something into their glass that doesn’t belong?'),
  T('Hvem åpner en flaske på en kreativ måte?', 'Who opens a bottle in a creative way?'),
  T('Hvem sier «jeg drikker ikke i kveld» – og gjør det likevel?', 'Who says “I’m not drinking tonight” – and does anyway?'),
  T('Hvem må ha sugerør?', 'Who needs a straw?'),
  T('Hvem skåler med noen som ikke har noe i glasset?', 'Who toasts with someone whose glass is empty?'),
  T('Hvem forklarer hvordan man lager den perfekte drinken?', 'Who explains how to make the perfect drink?'),
  T('Hvem glemmer drinken sin i et annet rom?', 'Who leaves their drink in another room?'),
  T('Hvem blir bartender for alle andre?', 'Who becomes everyone’s bartender?'),
  T('Hvem drikker av feil glass – og innser det for sent?', 'Who drinks from the wrong glass – and realises too late?'),
  T('Hvem setter på en låt fra ungdomsskolen?', 'Who puts on a song from middle school?'),
  T('Hvem synger med i mikrofon av en flaske eller fjernkontroll?', 'Who sings into a bottle or remote like a mic?'),
  T('Hvem skrur ned musikken for å fortelle noe?', 'Who turns the music down to tell a story?'),
  T('Hvem sier «hvem er det som synger dette?»', 'Who asks “who sings this?”'),
  T('Hvem sniker inn en låt fra sin egen spilleliste?', 'Who sneaks in a song from their own playlist?'),
  T('Hvem danser alene midt i rommet?', 'Who dances alone in the middle of the room?'),
  T('Hvem hopper over en låt noen andre satte på?', 'Who skips a song someone else put on?'),
  T('Hvem vil høre på en julelåt uansett årstid?', 'Who wants a Christmas song whatever the season?'),
  T('Hvem rapper et helt vers?', 'Who raps a whole verse?'),
  T('Hvem åpner kjøleskapet uten å spørre?', 'Who opens the fridge without asking?'),
  T('Hvem dropper fingrene i dipen?', 'Who dips their fingers in the dip?'),
  T('Hvem snakker om en kebab eller pizza de spiste en gang?', 'Who talks about a kebab or pizza they once had?'),
  T('Hvem deler snacks med alle uten at noen spurte?', 'Who hands out snacks without anyone asking?'),
  T('Hvem smaker på noe og sier «den var rar»?', 'Who tastes something and says “that’s weird”?'),
  T('Hvem spiser noe rett fra kjelen eller posen?', 'Who eats straight from the pot or bag?'),
  T('Hvem vil lage mat midt på natta?', 'Who wants to cook in the middle of the night?'),
  T('Hvem viser fram en meme?', 'Who shows everyone a meme?'),
  T('Hvem svarer en melding mens noen snakker til dem?', 'Who answers a text while someone is talking to them?'),
  T('Hvem filmer noe «til Snapen»?', 'Who films something “for Snap”?'),
  T('Hvem viser bilder fra en ferie?', 'Who shows holiday photos?'),
  T('Hvem legger telefonen på feil sted og leter etter den?', 'Who puts their phone down and has to search for it?'),
  T('Hvem ser på klokka på telefonen hele tiden?', 'Who keeps checking the time on their phone?'),
  T('Hvem tar skjermbilde av noe i gruppechatten?', 'Who screenshots something from the group chat?'),
  T('Hvem bruker Shazam på en låt?', 'Who uses Shazam on a song?'),
  T('Hvem lar telefonen ringe uten å svare?', 'Who lets their phone ring without answering?'),
  T('Hvem viser fram et gammelt bilde av noen i gjengen?', 'Who shows an old photo of someone in the group?'),
  T('Hvem velter noe?', 'Who knocks something over?'),
  T('Hvem går inn i feil rom?', 'Who walks into the wrong room?'),
  T('Hvem setter seg på noe de ikke burde?', 'Who sits on something they shouldn’t?'),
  T('Hvem mister balansen?', 'Who loses their balance?'),
  T('Hvem sklir på gulvet?', 'Who slips on the floor?'),
  T('Hvem låser seg ute – eller inne?', 'Who gets locked out – or in?'),
  T('Hvem slår på feil lysbryter?', 'Who flips the wrong light switch?'),
  T('Hvem mister noe ned i et glass?', 'Who drops something into a glass?'),
  T('Hvem sier «ærlig talt» først?', 'Who says “honestly” first?'),
  T('Hvem snakker om boligprisene?', 'Who talks about house prices?'),
  T('Hvem forteller om en pinlig opplevelse?', 'Who tells an embarrassing story?'),
  T('Hvem spør alle om hva de skal i sommer?', 'Who asks everyone about their summer plans?'),
  T('Hvem starter en diskusjon om hvem som er best av to kjendiser?', 'Who starts a debate about which of two celebs is best?'),
  T('Hvem sier «jeg sa jo det»?', 'Who says “told you so”?'),
  T('Hvem snakker om trening i mer enn fem minutter?', 'Who talks about working out for more than five minutes?'),
  T('Hvem roser verten?', 'Who compliments the host?'),
  T('Hvem spør «hvem kommer?» for tredje gang?', 'Who asks “who’s coming?” for the third time?'),
  T('Hvem snakker om noe de har lest på nettet?', 'Who brings up something they read online?'),
  T('Hvem bruker ordet «liksom» tre ganger i én setning?', 'Who says “like” three times in one sentence?'),
  T('Hvem forteller om en app de er helt hekta på?', 'Who talks about an app they’re hooked on?'),
  T('Hvem forteller hva de egentlig syns om noe?', 'Who says what they really think about something?'),
  T('Hvem snakker om en sportskamp?', 'Who talks about a sports match?'),
  T('Hvem spør et veldig personlig spørsmål?', 'Who asks a very personal question?'),
  T('Hvem kommer sist?', 'Who arrives last?'),
  T('Hvem gjør klar et gruppebilde?', 'Who sets up a group photo?'),
  T('Hvem prøver å rydde litt?', 'Who tries to tidy up a bit?'),
  T('Hvem henter noe fra butikken i løpet av kvelden?', 'Who runs to the shop during the evening?'),
  T('Hvem bytter plass flest ganger?', 'Who changes seats the most?'),
  T('Hvem låner noe av verten?', 'Who borrows something from the host?'),
  T('Hvem går ut for å trekke frisk luft?', 'Who steps out for fresh air?'),
  T('Hvem blir sittende i sofaen hele kvelden?', 'Who stays on the sofa all night?'),
  T('Hvem sier «vi drar om ti minutter»?', 'Who says “we’re leaving in ten minutes”?'),
  T('Hvem tar av seg et klesplagg fordi det er for varmt?', 'Who takes off a layer because it’s too warm?'),
  T('Hvem sjekker hvor lang køen er på utestedet?', 'Who checks how long the queue is at the club?'),
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
  T('Blir samme låt spilt to ganger i kveld?', 'Will the same song be played twice tonight?'),
  T('Blir det dansekonkurranse?', 'Will there be a dance-off?'),
  T('Blir det allsang på en norsk klassiker?', 'Will there be a sing-along to a Norwegian classic?'),
  T('Blir musikken skrudd ned etter klage?', 'Will the music be turned down after a complaint?'),
  T('Blir det armbryting eller en annen konkurranse?', 'Will there be arm wrestling or another contest?'),
  T('Blir noen kalt ved feil navn?', 'Will someone be called by the wrong name?'),
  T('Søler noen ut en hel drink?', 'Will someone spill an entire drink?'),
  T('Låner noen en genser eller jakke av en annen?', 'Will someone borrow someone else’s sweater or jacket?'),
  T('Blir det bestilt mat på døra?', 'Will food be delivered to the door?'),
  T('Spiser noen noe fra kjøleskapet etter midnatt?', 'Will someone raid the fridge after midnight?'),
  T('Går noens telefon tom for strøm?', 'Will someone’s phone die?'),
  T('Ringer noen en forelder i kveld?', 'Will someone call a parent tonight?'),
  T('Blir det tatt et bilde der noen har lukkede øyne?', 'Will a photo be taken with someone’s eyes closed?'),
  T('Ringer noen på video til noen som ikke er her?', 'Will someone video-call someone who isn’t here?'),
  T('Blir det krangel om hvem som er best til noe?', 'Will there be an argument about who’s best at something?'),
  T('Blir det fortalt en historie ingen tror på?', 'Will someone tell a story nobody believes?'),
  T('Blir det snakket om jobb i mer enn fem minutter?', 'Will people talk about work for more than five minutes?'),
  T('Blir det avslørt en hemmelighet i kveld?', 'Will a secret be revealed tonight?'),
  T('Blir det skålt mer enn ti ganger?', 'Will there be more than ten toasts?'),
  T('Går noen tom for egen drikke og må låne?', 'Will someone run out of their own drinks and have to borrow?'),
  T('Blir det laget en drink med noe helt uventet i?', 'Will someone mix a drink with something totally unexpected?'),
  T('Blir en drikkelek avbrutt fordi noen jukser?', 'Will a drinking game be stopped because someone cheats?'),
  T('Sovner noen før midnatt?', 'Will someone fall asleep before midnight?'),
  T('Drar hele gjengen videre samlet?', 'Will the whole group head out together?'),
  T('Er noen hjemme før klokka 01?', 'Will anyone be home before 1 am?'),
  T('Er noen fortsatt våkne klokka 03?', 'Will anyone still be awake at 3 am?'),
  T('Kommer det en overraskelsesgjest?', 'Will a surprise guest show up?'),
  T('Blir det kø for å komme inn et sted?', 'Will there be a queue to get in somewhere?'),
  T('Blir noen bedt om å drikke vann?', 'Will someone be told to drink water?'),
  T('Blir det laget en bolle eller punsj?', 'Will someone make a punch or bowl?'),
  T('Blir det tatt en shot samtidig av alle?', 'Will everyone take a shot at the same time?'),
  T('Blir det karaoke i kveld?', 'Will there be karaoke tonight?'),
  T('Blir det spilt en låt fra en Disney-film?', 'Will a Disney song be played?'),
  T('Blir det spilt en låt to ganger på rad?', 'Will a song be played twice in a row?'),
  T('Blir det bestilt eller kjøpt nattmat?', 'Will someone order or buy late-night food?'),
  T('Går snacksen tom før vi drar?', 'Will the snacks run out before we leave?'),
  T('Blir det tatt en video som havner på sosiale medier?', 'Will a video end up on social media?'),
  T('Blir det ringt til noen på høyttaler?', 'Will someone be called on speaker?'),
  T('Knuser eller mister noen telefonen i gulvet?', 'Will someone drop or crack their phone?'),
  T('Blir det knust et glass?', 'Will a glass get broken?'),
  T('Går brannalarmen eller en alarm?', 'Will a fire alarm or other alarm go off?'),
  T('Blir noen låst ute på balkongen?', 'Will someone get locked out on the balcony?'),
  T('Faller noen av en stol?', 'Will someone fall off a chair?'),
  T('Blir det en diskusjon om noe helt absurd?', 'Will there be a debate about something totally absurd?'),
  T('Blir det nevnt en eks med navn?', 'Will an ex be mentioned by name?'),
  T('Blir det lagt en plan for en tur sammen?', 'Will the group plan a trip together?'),
  T('Kommer taxien før planlagt?', 'Will the taxi arrive earlier than planned?'),
  T('Er det noen som skifter klær i løpet av kvelden?', 'Will someone change clothes during the evening?'),
  T('Blir det lagt ut et gruppebilde i kveld?', 'Will a group photo be posted tonight?'),
  T('Blir vorset flyttet til et annet sted?', 'Will the pre-game move somewhere else?'),
  T('Går noen på feil buss, trikk eller taxi?', 'Will someone take the wrong bus, tram or taxi?'),
  T('Blir det lagt planer for neste helg?', 'Will plans be made for next weekend?'),
];

/* ---------- kurs: hvert utfall er sin egen aksje ---------- */
/** Prisen på neste aksje når n allerede er solgt. */
const kurs = (n: number) => Math.min(MAKSKURS, STARTKURS + STEG * Math.max(0, n));
/** Hva du får for én aksje hvis du selger nå (prisen på den siste som ble kjøpt). */
/** Selger du, får du det siste kjøp kostet – minus kurtasje. Da lønner det seg ikke å kjøpe og selge fort. */
export const KURTASJE = 0.25, LAAS_MIN = 10;
const salgskurs = (n: number) => (n > 0 ? Math.floor(kurs(n - 1) * (1 - KURTASJE)) : 0);
/** Odds: hvor mange ganger pengene du får igjen hvis det skjer (100 kr / kursen). */
const odds = (n: number) => Math.round((UTBETALING / kurs(n)) * 10) / 10;
/** Aksjer man har eid lenge nok til å selge (kjøpt for mer enn LAAS_MIN minutter siden), og når neste blir ledig. */
function selgbar(hold: any, u: string) {
  const tider: number[] = (hold && hold.tider && hold.tider[u]) || [], grense = Date.now() - LAAS_MIN * 60000;
  const klare = tider.filter((t) => t <= grense).length, neste = tider.filter((t) => t > grense).sort((x, y) => x - y)[0];
  return { klare, om: klare ? 0 : neste ? Math.max(1, Math.ceil((neste - grense) / 60000)) : 0 };
}

/* ---------- hjelpere ---------- */
function tilfeldig(n: number) { const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] % n; }
function nyId() { const a = new Uint8Array(4); crypto.getRandomValues(a); return Array.from(a, (x) => x.toString(16).padStart(2, '0')).join(''); }
function rens(x: any, n = 120) { return String(x == null ? '' : x).replace(/[\u0000-\u001f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, n); }
function navn(data: any, id: string) { const p = data.spillere.find((x: any) => x.id === id); return p ? p.navn : '?'; }
function melde(data: any, no: string, en: string) { data.nr = (data.nr || 0) + 1; data.hendelse = { nr: data.nr, tekst: no, en }; }
function frist(sek: number) { return Date.now() + sek * 1000 + 1500; }
const ute = (f: number) => !f || Date.now() >= f - 800;
/** Kategoriene aksjene er delt inn i. Verten kan velge hvilke som er med når børsen startes. */
export const KATEGORIER = [
  { id: 'drikke', no: '🍻 Drikke og skål', en: '🍻 Drinks and toasts' },
  { id: 'musikk', no: '🎶 Musikk og dans', en: '🎶 Music and dancing' },
  { id: 'mat', no: '🍕 Mat og snacks', en: '🍕 Food and snacks' },
  { id: 'mobil', no: '📱 Mobil og bilder', en: '📱 Phones and photos' },
  { id: 'kaos', no: '💥 Kaos og uhell', en: '💥 Chaos and accidents' },
  { id: 'prat', no: '💬 Prat og klassikere', en: '💬 Chat and classics' },
  { id: 'kvelden', no: '🌙 Kvelden og veien videre', en: '🌙 The night and what’s next' },
];
/** Kategorien til hver aksje, i samme rekkefølge som HVEM og JANEI. */
export const HVEM_KAT = ["drikke", "drikke", "mat", "kvelden", "kvelden", "musikk", "prat", "mobil", "kvelden", "mobil", "kaos", "mobil", "musikk", "prat", "prat", "mat", "prat", "musikk", "kvelden", "mobil", "prat", "prat", "kvelden", "prat", "prat", "prat", "musikk", "mobil", "kvelden", "kvelden", "prat", "prat", "kaos", "drikke", "prat", "musikk", "mat", "prat", "prat", "musikk", "kvelden", "prat", "kvelden", "kaos", "prat", "kaos", "prat", "drikke", "kvelden", "drikke", "prat", "prat", "prat", "mat", "mobil", "kvelden", "kvelden", "mobil", "prat", "prat", "drikke", "drikke", "drikke", "drikke", "drikke", "drikke", "drikke", "musikk", "musikk", "musikk", "musikk", "musikk", "musikk", "mat", "mat", "mat", "mat", "mat", "mobil", "mobil", "mobil", "mobil", "mobil", "mobil", "mobil", "mobil", "kaos", "kaos", "kaos", "kaos", "kaos", "kaos", "prat", "prat", "prat", "prat", "prat", "prat", "prat", "prat", "prat", "prat", "prat", "prat", "prat", "prat", "kvelden", "kvelden", "kvelden", "kvelden", "kvelden", "kvelden", "kvelden", "kvelden", "kvelden", "kvelden", "drikke", "drikke", "drikke", "drikke", "drikke", "drikke", "drikke", "drikke", "drikke", "drikke", "musikk", "musikk", "musikk", "musikk", "musikk", "musikk", "musikk", "musikk", "musikk", "mat", "mat", "mat", "mat", "mat", "mat", "mat", "mobil", "mobil", "mobil", "mobil", "mobil", "mobil", "mobil", "mobil", "mobil", "mobil", "kaos", "kaos", "kaos", "kaos", "kaos", "kaos", "kaos", "kaos", "prat", "prat", "prat", "prat", "prat", "prat", "prat", "prat", "prat", "prat", "prat", "prat", "prat", "prat", "prat", "kvelden", "kvelden", "kvelden", "kvelden", "kvelden", "kvelden", "kvelden", "kvelden", "kvelden", "kvelden", "kvelden"];
export const JANEI_KAT = ["kvelden", "mat", "kaos", "kaos", "musikk", "kaos", "kvelden", "kvelden", "musikk", "mobil", "musikk", "prat", "kvelden", "kvelden", "mobil", "musikk", "drikke", "drikke", "kvelden", "drikke", "musikk", "musikk", "musikk", "musikk", "kaos", "kaos", "kaos", "kaos", "mat", "mat", "mobil", "mobil", "mobil", "mobil", "prat", "prat", "prat", "prat", "drikke", "drikke", "drikke", "drikke", "kvelden", "kvelden", "kvelden", "kvelden", "kvelden", "kvelden", "drikke", "drikke", "drikke", "musikk", "musikk", "musikk", "mat", "mat", "mobil", "mobil", "mobil", "kaos", "kaos", "kaos", "kaos", "prat", "prat", "prat", "kvelden", "kvelden", "kvelden", "kvelden", "kvelden", "kvelden"];

/* Statistikk (anonym): hvilke aksjer som blir vist, kjøpt, meldt og faktisk skjer. Samles per handling og sendes av API-ruta. */
let STAT: any[] = [];
let EGNE: any[] = [];   // egne aksjer folk har notert (anonymt) – samles for statistikken
function statFor(a: any, felt: any) { if (a && a.nokkel) STAT.push({ n: a.nokkel, q: qNo(a), kat: a.kat || null, type: a.type, ...felt }); }

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
    laast: false };
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
  if (vinner && a.type === 'hvem' && data.spillere.some((p: any) => p.id === vinner)) flytt(b, vinner, HOVEDROLLE, 'Hovedrollen: ' + kortQ(qNo(a)), 'Starring role: ' + kortQ(qEn(a)));
  const kjop = a.handler.filter((h: any) => h.n > 0), skjedde = a.status === 'avgjort' && (a.type === 'hvem' || vinner === 'ja');
  statFor(a, { kjop: kjop.length, kjopere: new Set(kjop.map((h: any) => h.id)).size, skjedde: skjedde ? 1 : 0,
    vinnere: skjedde ? Object.values(a.hold).filter((h: any) => (h.n[vinner as string] || 0) > 0).length : 0 });
}

/* ---------- markedet ---------- */
const bland = <X,>(xs: X[]) => { const a = xs.slice(); for (let i = a.length - 1; i > 0; i--) { const j = tilfeldig(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
/**
 * Slik fungerer markedet:
 *  - Hver kveld trekkes en pott med aksjer fra hele lista (gratis 40, Pluss 100). Aksjene lages først når noen får dem.
 *  - Hver spiller har sin egen hånd på HAND aksjer, trukket tilfeldig. Halvparten av gangene får du en aksje
 *    som noen andre allerede har (så det blir et marked), ellers en helt ny fra potten.
 *  - Du ser bare hånden din (og aksjer du eier). Ingen vet hvem som har de samme – eller aksjen om dem.
 *  - Stenger eller avgjøres en aksje, får du en ny. Liker du ikke en, kan du bytte den.
 */
function potStr(b: any) { return b.fri ? POTT_PLUSS : POTT_GRATIS; }
function fyllPott(b: any) {
  const brukt = new Set<string>(b.aksjer.map((a: any) => a.nokkel).filter(Boolean).concat(b.pott || []));
  const ok = (k: string) => !b.kat || b.kat.includes(k);
  const allerede = brukt.size, mangler = potStr(b) - allerede; if (mangler <= 0) return 0;
  const nokler = (liste: any[], kat: string[], pre: string) => liste.map((_, i) => i).filter((i) => !brukt.has(pre + i)).map((i) => ({ k: pre + i, ok: ok(kat[i]) }));
  const hv = nokler(HVEM, HVEM_KAT, 'h'), jn = nokler(JANEI, JANEI_KAT, 'j');
  // Rundt 70 % hvem-aksjer og 30 % ja/nei. Kategoriene verten valgte trekkes først.
  const ta = (xs: any[], n: number) => bland(xs.filter((x) => x.ok)).concat(bland(xs.filter((x) => !x.ok))).slice(0, Math.max(0, n)).map((x) => x.k);
  const nJ = Math.round(mangler * 0.3), nye = bland(ta(hv, mangler - nJ).concat(ta(jn, nJ)));
  b.pott = (b.pott || []).concat(nye);
  return nye.length;
}
function fraPotten(data: any) {
  const b = data.bors, k = (b.pott || []).shift(); if (!k) return null;
  const type = k[0] === 'h' ? 'hvem' : 'janei', idx = Number(k.slice(1)), liste = type === 'hvem' ? HVEM : JANEI;
  if (!liste[idx]) return null;
  const time = 3600 * 1000, tider = [time, 1.5 * time, 2 * time, 3 * time, null, null];
  const t = tider[tilfeldig(tider.length)];
  const a = lagAksje(data, type as any, liste[idx], null, t ? Date.now() + t : null);
  a.nokkel = k; a.kat = (type === 'hvem' ? HVEM_KAT : JANEI_KAT)[idx];
  statFor(a, { vist: 1 });
  return a;
}
const erApen = (a: any) => a.status === 'apen' && !a.av && !(a.stenger && Date.now() >= a.stenger);
/** Fyll opp hånda til en spiller. */
function del(data: any, id: string) {
  const b = data.bors; if (!b || !b.paa) return;
  b.hand = b.hand || {}; b.sett = b.sett || {}; b.kastet = b.kastet || {};
  const kastet = new Set(b.kastet[id] || []);
  let hand: string[] = (b.hand[id] || []).filter((aid: string) => { const a = finn(b, aid); return a && erApen(a); });
  let vakt = 0;
  while (hand.length < HAND && vakt++ < 40) {
    // Hvor mange som har hver åpne aksje på hånda
    const seere: Record<string, number> = {};
    Object.values(b.hand).forEach((h: any) => (h || []).forEach((aid: string) => { seere[aid] = (seere[aid] || 0) + 1; }));
    const andres = b.aksjer.filter((a: any) => erApen(a) && !hand.includes(a.id) && !kastet.has(a.id) && !(b.sett[id] || []).includes(a.id));
    let a: any = null;
    // Halvparten av gangene: en aksje andre allerede har (de med færrest seere først), så det blir handel i den
    if (andres.length && (tilfeldig(2) === 0 || !(b.pott || []).length)) {
      const min = Math.min(...andres.map((x: any) => seere[x.id] || 0));
      const kand = andres.filter((x: any) => (seere[x.id] || 0) <= min + 1);
      a = kand[tilfeldig(kand.length)];
    }
    if (!a) a = fraPotten(data);
    if (!a) break;
    hand.push(a.id);
    const s = b.sett[id] || (b.sett[id] = []); if (!s.includes(a.id)) s.push(a.id);
  }
  b.hand[id] = hand;
}
function delAlle(data: any) { const b = data.bors; if (!b || !b.paa) return; data.spillere.forEach((p: any) => del(data, p.id)); }
/**
 * Kan spilleren se aksjen? Egne aksjer ser alle, aksjer du eier ser du alltid. Åpne aksjer: bare dem på hånda di.
 * Stengte og avgjorte: dem du har hatt på hånda. Meldte aksjer avsløres for alle (alle stemmer).
 */
function kanSe(b: any, a: any, id: string | null) {
  if (!id || a.av || !a.nokkel) return true;
  if (a.hold[id]) return true;
  if (!b.hand) return !Array.isArray(a.synlig) || a.synlig.includes(id) || !['apen', 'stengt'].includes(a.status);   // rom startet før hånd-systemet
  if (erApen(a)) return !!(b.hand && (b.hand[id] || []).includes(a.id));
  if (a.status === 'meldt' || a.meldtT) return true;
  return !!(b.sett && (b.sett[id] || []).includes(a.id) && !((b.kastet && b.kastet[id]) || []).includes(a.id));
}
/** Pluss aktivert etter at børsen startet: potten vokser til 100. */
export function borsTilPluss(data: any) {
  const b = data.bors; if (!b || !b.paa || b.fri) return;
  b.fri = true;
  const n = fyllPott(b);
  delAlle(data);
  if (n) melde(data, `✨ Pluss! ${n} nye aksjer er lagt i potten.`, `✨ Pluss! ${n} new shares added to the pot.`);
}

/* ---------- start / slutt ---------- */
export function startBors(data: any, fri: boolean, fokus = false, kat: string[] | null = null) {
  if (data.spillere.length < 3) return { feil: 'for-faa', melding: 'Vorsbørsen trenger minst tre spillere.', en: 'The Exchange needs at least three players.' };
  data.bors = { paa: true, start: Date.now(), saldo: {}, aksjer: [], saker: [], bilder: {}, noterte: {}, overforinger: [], fri: !!fri, fokus: !!fokus, brukt: {} };
  const b = data.bors;
  data.spillere.forEach((p: any) => saldo(b, p.id));
  const valgte = (kat || []).filter((k) => KATEGORIER.some((x) => x.id === k));
  b.kat = valgte.length && valgte.length < KATEGORIER.length ? valgte : null;
  b.pott = []; b.hand = {}; b.sett = {}; b.kastet = {}; b.bytt = {};
  fyllPott(b); delAlle(data);
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
  // Kveldens resultat: gevinst i kveld (i en gjeng har folk med seg ulik formue inn i kvelden)
  const start = (id: string) => (b.startKr && b.startKr[id] != null ? b.startKr[id] : START_KR);
  const rang = data.spillere.map((p: any) => ({ id: p.id, kr: Math.round(saldo(b, p.id)), gevinst: Math.round(saldo(b, p.id) - start(p.id)) })).sort((x: any, y: any) => y.gevinst - x.gevinst || y.kr - x.kr);
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
  const vitneNei = m.vitne && m.stemmer[m.vitne] === 'nei';
  // Hvor mange andre enn den som meldte har tatt stilling (ja eller nei)?
  const andre = Object.entries(m.stemmer).filter(([id, x]) => id !== m.av && id !== m.subjekt && (x === 'ja' || x === 'nei')).length;
  // Flertall avgjør med en gang: når over halvparten av dem som kan stemme har sagt ja (eller nei), trenger vi ikke vente
  const kan = data.spillere.filter((p: any) => p.id !== m.subjekt).length;
  const flertallJa = ja > kan / 2 && andre >= 1 && !vitneNei, flertallNei = nei >= kan / 2 && nei > 0;
  if (!alle && !tvunget && !vitneNei && !m.utsatt && !flertallJa && !flertallNei) return;
  if (!vitneNei && andre < 1 && !alle) {
    // For få har stemt: ikke avvis – vent. Stemmene kan komme senere (i en gjeng: på gjengsiden etter kvelden).
    if (!m.utsatt) {
      m.utsatt = true; m.frist = null;
      melde(data, `⏳ For få stemte på «${qNo(a)}» – den venter til flere har sett på den.`, `⏳ Too few votes on “${qEn(a)}” – it waits until more people weigh in.`);
    }
    return;
  }
  const godkjent = !vitneNei && andre >= 1 && ja > nei;
  if (godkjent) {
    oppgjor(data, a, m.utfall);
    // Den som fulgte med og meldte, får en liten bonus (ikke hvis det handlet om en selv)
    if (m.av && m.av !== m.utfall && data.spillere.some((p: any) => p.id === m.av)) flytt(data.bors, m.av, MELDEBONUS, 'Meldebonus: ' + kortQ(qNo(a)), 'Reporter bonus: ' + kortQ(qEn(a)));
    melde(data, `✅ Bekreftet: ${a.type === 'hvem' ? navn(data, m.utfall) : 'Ja'} – hver aksje betaler 100 kr!`, `✅ Confirmed: ${a.type === 'hvem' ? navn(data, m.utfall) : 'Yes'} – each share pays 100!`);
  } else {
    a.status = m.forrige || 'apen'; a.melding = null; if (data.bors.bilder) delete data.bors.bilder[a.id];
    melde(data, `❌ Ikke godkjent – aksjen er åpen igjen.`, `❌ Not confirmed – the share is open again.`);
  }
}

/**
 * Gjengkvelden er over: aksjer som fortsatt venter på stemmer flyttes ut (avgjøres på gjengsiden),
 * resten av børsen stenges, og saldoen til hver spiller blir med i gjengens lommebok.
 */
export function borsTilGjeng(data: any) {
  const b = data.bors; if (!b) return null;
  const utsatte: any[] = [];
  b.aksjer.forEach((a: any) => {
    if (a.status !== 'meldt' || !a.melding) return;
    const m = a.melding;
    utsatte.push({ id: a.id, q: a.q, type: a.type, utfall: m.utfall, melder: m.av, subjekt: m.subjekt, stemmer: { ...m.stemmer },
      holdere: Object.entries(a.hold).map(([id, h]: any) => ({ id, n: h.n[m.utfall] || 0 })).filter((x: any) => x.n > 0) });
    a.status = 'utsatt'; a.melding.frist = null;
  });
  if (b.paa) avsluttBors(data);
  const saldoer: Record<string, number> = {};
  data.spillere.forEach((p: any) => { saldoer[p.id] = Math.round(saldo(b, p.id)); });
  return { utsatte, saldoer };
}

/** Ny spiller midt i børsen: hen blir et utfall i alle hvem-aksjer som fortsatt er åpne. */
export function nySpillerIBors(data: any, id: string) {
  const b = data.bors; if (!b || !b.paa) return;
  b.aksjer.forEach((a: any) => {
    if (a.type === 'hvem' && !a.utfall.includes(id) && ['apen', 'stengt', 'venter'].includes(a.status)) { a.utfall.push(id); a.qs.push(0); }
  });
  del(data, id);   // den nye får sin egen hånd
}
/** Startsaldo fra gjengens lommebok (medlemmer tar med seg formuen sin inn i kvelden). */
export function settStart(data: any, start: Record<string, number>) {
  const b = data.bors; if (!b) return;
  b.startKr = b.startKr || {};
  Object.entries(start).forEach(([id, kr]) => {
    const n = Math.round(Number(kr));
    if (!data.spillere.some((p: any) => p.id === id) || !isFinite(n) || n < 0 || n > 10000000) return;
    b.saldo[id] = n; b.startKr[id] = n;
  });
}

/* ---------- Børstilsynet ---------- */
/** Vinnerne på en aksje (de eneste som kan anmeldes for den). */
function vinnere(a: any) { return a.vinner ? Object.keys(a.hold).filter((id) => (a.hold[id].n[a.vinner] || 0) > 0) : []; }
function tilsynLogg(data: any, a: any, mistenkt: string) {
  const slutt = a.avgjort || Date.now(), b = data.bors;
  // ⚠️ = kjøpte det som skjedde, mindre enn 10 minutter før noen meldte det
  const ref = a.meldtT || slutt;
  const handler = a.handler.map((h: any) => ({ navn: navn(data, h.id), hvem: h.id, utfall: h.u, n: h.n, kr: h.kr, minFor: Math.round((slutt - h.t) / 60000),
    mistenkelig: h.n > 0 && h.u === a.vinner && ref - h.t < 10 * 60000 && ref >= h.t }));
  const subjekt = a.type === 'hvem' ? a.vinner : null;
  const penger = (b.overforinger || []).filter((o: any) => o.fra === mistenkt || o.til === mistenkt).map((o: any) => ({
    fra: navn(data, o.fra), til: navn(data, o.til), kr: o.kr, minEtter: Math.round((o.t - slutt) / 60000),
    mistenkelig: !!subjekt && ((o.fra === mistenkt && o.til === subjekt) || (o.fra === subjekt && o.til === mistenkt)) }));
  return { handler, penger };
}
/** Straff i slurker (føres på poengtavla; immunitet hjelper ikke mot en dom). */
function straffSlurker(data: any, id: string, n: number) { const p = data.spillere.find((x: any) => x.id === id); if (p) p.slurker = Math.max(0, (p.slurker || 0) + n); }
function dom(data: any, s: any) {
  const b = data.bors, a = finn(b, s.aksje);
  const velgere = data.spillere.filter((p: any) => !s.utenfor.includes(p.id));
  const skyldig = velgere.filter((p: any) => s.stemmer[p.id] === 'skyldig').length, frikjent = velgere.filter((p: any) => s.stemmer[p.id] === 'uskyldig').length;
  s.resultat = { skyldig, frikjent, dom: skyldig + frikjent > 0 && skyldig / (skyldig + frikjent) >= 2 / 3, medskyldig: null as string | null, bevis: false, henlagt: false } as any;
  if (!velgere.length && a) {
    // For få til å dømme (f.eks. tre spillere): bevisene avgjør. ⚠️ i handelsloggen eller pengegavene = skyldig.
    const l = tilsynLogg(data, a, s.mot);
    s.resultat.bevis = true;
    s.resultat.dom = l.handler.some((x: any) => x.hvem === s.mot && x.mistenkelig) || l.penger.some((x: any) => x.mistenkelig);
  } else if (skyldig + frikjent === 0) {
    // Ingen stemte: saken henlegges, ingen straffes
    s.resultat.henlagt = true; s.fase = 'ferdig'; s.frist = null;
    melde(data, `⚖️ Ingen stemte – saken mot ${navn(data, s.mot)} er henlagt.`, `⚖️ Nobody voted – the case against ${navn(data, s.mot)} is dropped.`);
    return;
  }
  if (s.resultat.dom) {
    const h = a && a.hold[s.mot];
    const beslag = h ? h.fikk || 0 : 0;
    flytt(b, s.mot, -(beslag + BOT_SKYLDIG), 'Dømt: gevinst beslaglagt + bot', 'Convicted: profits seized + fine');
    s.resultat.beslag = beslag;
    straffSlurker(data, s.mot, 5);
    if (h) h.fikk = 0;
    // Fikk den aksjen handlet om penger fra vinneren? Da er hen medskyldig: pengene inndras og samme bot.
    const subjekt = a && a.type === 'hvem' ? a.vinner : null;
    if (subjekt && subjekt !== s.mot) {
      const bestikkelse = (b.overforinger || []).filter((o: any) => o.fra === s.mot && o.til === subjekt).reduce((n: number, o: any) => n + o.kr, 0);
      if (bestikkelse > 0) { flytt(b, subjekt, -(bestikkelse + BOT_SKYLDIG), 'Medskyldig: gaven inndratt + bot', 'Accomplice: gift seized + fine'); s.resultat.medskyldig = subjekt; straffSlurker(data, subjekt, 3); }
    }
    melde(data, `🚨 Børstilsynet: ${navn(data, s.mot)} er dømt for innsidehandel${s.resultat.medskyldig ? ' sammen med ' + navn(data, s.resultat.medskyldig) : ''}! ${beslag} kr beslaglagt, 300 kr i bot og 5 slurker 🍺`,
      `🚨 Market watchdog: ${navn(data, s.mot)} is convicted of insider trading${s.resultat.medskyldig ? ' together with ' + navn(data, s.resultat.medskyldig) : ''}! ${beslag} seized, a 300 fine and 5 sips 🍺`);
  } else {
    flytt(b, s.av, -BOT_FALSK, 'Falsk anmeldelse', 'False report');
    melde(data, `⚖️ Frikjent! ${navn(data, s.av)} betaler 200 kr for falsk anmeldelse.`, `⚖️ Acquitted! ${navn(data, s.av)} pays 200 for a false report.`);
  }
  s.fase = 'ferdig'; s.frist = null;
}

/* ---------- handlinger ---------- */
export function borsHandling(data: any, meg: any, h: any, erVert: boolean): any {
  STAT = []; EGNE = [];
  const r = borsHandlingInne(data, meg, h, erVert);
  if (data.bors && data.bors.paa && data.bors.pott) delAlle(data);   // stengte/avgjorte aksjer byttes ut med nye
  if (STAT.length && r && typeof r === 'object' && !r.feil) r.stat = STAT;
  if (EGNE.length && r && typeof r === 'object' && !r.feil) r.egne = EGNE;
  STAT = []; EGNE = [];
  return r;
}
function borsHandlingInne(data: any, meg: any, h: any, erVert: boolean): any {
  const hd = String(h.handling || '');
  if (hd === 'bs-start') {
    if (!erVert) return { feil: 'bare-vert' };
    if (data.bors && data.bors.paa) return { ok: true };
    const r: any = startBors(data, !!h._borsFri, !!h.fokus, Array.isArray(h.kat) ? h.kat.map(String).slice(0, 10) : null);
    // Gjengkveld: medlemmene tar med seg formuen sin (+ kveldens lønn) – satt av API-ruta
    if (!r.feil && h._start && typeof h._start === 'object') settStart(data, h._start);
    return r;
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
    if (a.laast && !b.fri) return { feil: 'pluss', melding: 'Denne aksjen krever Pluss hos verten.', en: 'This share needs the host to have Pluss.' };
    if (!kanSe(b, a, meg.id)) return { feil: 'ugyldig', melding: 'Denne aksjen er ikke på hånda di.', en: 'This share isn’t in your hand.' };
    if (!handelApen(b, a)) return { feil: 'stengt', melding: a.status === 'meldt' ? 'Aksjen er låst – noen har meldt at det skjedde.' : 'Aksjen er stengt for handel.', en: a.status === 'meldt' ? 'The share is locked – someone reported that it happened.' : 'This share is closed for trading.' };
    const i = a.utfall.indexOf(String(h.utfall)); if (i === -1) return { feil: 'ugyldig' };
    const n = Math.round(Number(h.n) || 0) > 0 ? 1 : -1;
    if (a.type === 'hvem' && a.utfall[i] === meg.id && n > 0) return { feil: 'innside', melding: 'Du kan ikke kjøpe aksjer i deg selv – det er innsidehandel 😉', en: 'You can’t buy shares in yourself – that’s insider trading 😉' };
    if (a.av === meg.id) return { feil: 'innside', melding: 'Du kan ikke handle i en aksje du har notert selv.', en: 'You can’t trade in a share you listed yourself.' };
    const hold = beholdning(a, meg.id), har = hold.n[a.utfall[i]] || 0;
    if (n < 0 && har < 1) return { feil: 'ugyldig', melding: 'Du har ingen slike aksjer.', en: 'You don’t own any of these.' };
    // Eldre aksjer uten kjøpstid (fra før regelen) regnes som kjøpt ved start
    hold.tider = hold.tider || {}; const tl: number[] = hold.tider[a.utfall[i]] || (hold.tider[a.utfall[i]] = []);
    while (tl.length < har) tl.unshift(0);
    if (n < 0) {
      const sb = selgbar(hold, a.utfall[i]);
      if (!sb.klare) return { feil: 'laast', melding: `Du må eie aksjen i ${LAAS_MIN} minutter før du kan selge – om ${sb.om} min.`, en: `You must hold the share for ${LAAS_MIN} minutes before selling – ${sb.om} min to go.` };
    }
    const kr = n > 0 ? kurs(a.qs[i]) : -salgskurs(a.qs[i]), honorar = n > 0 && a.av ? HONORAR : 0;
    if (n > 0 && saldo(b, meg.id) < kr + honorar) return { feil: 'penger', melding: 'Du har ikke nok vorskroner.', en: 'You don’t have enough coins.' };
    a.qs[i] += n; hold.n[a.utfall[i]] = har + n;
    if (n > 0) tl.push(Date.now()); else tl.splice(tl.findIndex((t) => t <= Date.now() - LAAS_MIN * 60000), 1);
    const hvaNo = a.type === 'hvem' ? navn(data, a.utfall[i]) : (a.utfall[i] === 'ja' ? 'Ja' : 'Nei'), hvaEn = a.type === 'hvem' ? hvaNo : (a.utfall[i] === 'ja' ? 'Yes' : 'No');
    flytt(b, meg.id, -(kr + honorar), (n > 0 ? 'Kjøpte ' : 'Solgte ') + hvaNo, (n > 0 ? 'Bought ' : 'Sold ') + hvaEn);
    hold.kost = Math.max(0, hold.kost + kr);
    if (honorar) flytt(b, a.av, honorar, 'Honorar fra aksjen din', 'Fee from your share');
    a.handler.push({ id: meg.id, u: a.utfall[i], n, kr, t: Date.now() });
    return { ok: true };
  }
  if (hd === 'bs-bytt') {
    const hand = (b.hand && b.hand[meg.id]) || [];
    if (!hand.includes(String(h.aksje))) return { feil: 'ugyldig', melding: 'Den aksjen er ikke på hånda di.', en: 'That share isn’t in your hand.' };
    const a = finn(b, h.aksje);
    if (a && a.hold[meg.id] && Object.values(a.hold[meg.id].n).some((x: any) => x > 0)) return { feil: 'ugyldig', melding: 'Du kan ikke bytte en aksje du eier.', en: 'You can’t swap a share you own.' };
    // Et bytte koster alltid noe: vorskroner eller en slurk
    if (h.med === 'slurk') {
      straffSlurker(data, meg.id, BYTT_SLURK);
      melde(data, `🔄 ${meg.navn} byttet en aksje – og tok en slurk for det 🍺`, `🔄 ${meg.navn} swapped a share – and took a sip for it 🍺`);
    } else {
      if (saldo(b, meg.id) < BYTT_PRIS) return { feil: 'penger', melding: 'Du har ikke nok vorskroner – bytt med en slurk i stedet.', en: 'Not enough coins – swap for a sip instead.' };
      flytt(b, meg.id, -BYTT_PRIS, 'Byttet en aksje', 'Swapped a share');
    }
    b.bytt = b.bytt || {}; b.bytt[meg.id] = (b.bytt[meg.id] || 0) + 1;
    b.hand[meg.id] = hand.filter((x: string) => x !== String(h.aksje));
    (b.kastet[meg.id] = b.kastet[meg.id] || []).push(String(h.aksje));
    del(data, meg.id);
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
  if (hd === 'bs-butikk') {
    const vare = String(h.vare || '');
    const p = data.spillere.find((x: any) => x.id === meg.id);
    if (vare === 'slurk') {
      const til = data.spillere.find((x: any) => x.id === h.til);
      const n = Math.max(1, Math.min(BUTIKK.maksSlurker, Math.round(Number(h.n) || 1)));
      if (!til || til.id === meg.id) return { feil: 'ugyldig', melding: 'Velg hvem som skal drikke.', en: 'Pick who should drink.' };
      const kr = slurkPris(data, meg.id, n);
      b.slurkKjopt = b.slurkKjopt || {};
      if (saldo(b, meg.id) < kr) return { feil: 'penger', melding: 'Du har ikke nok vorskroner.', en: 'You don’t have enough coins.' };
      b.slurkKjopt[meg.id] = (b.slurkKjopt[meg.id] || 0) + n;
      flytt(b, meg.id, -kr, `Kjøpte ${n} ${n === 1 ? 'slurk' : 'slurker'} til ${til.navn}`, `Bought ${n} ${n === 1 ? 'sip' : 'sips'} for ${til.navn}`);
      if ((til.immun || 0) > 0) {
        til.immun--;
        melde(data, `🛡️ ${meg.navn} kjøpte ${n} ${n === 1 ? 'slurk' : 'slurker'} til ${til.navn} – men ${til.navn} brukte immunitet!`, `🛡️ ${meg.navn} bought ${n} ${n === 1 ? 'sip' : 'sips'} for ${til.navn} – but ${til.navn} used immunity!`);
      } else {
        til.slurker = Math.max(0, (til.slurker || 0) + n); til.mottatt = (til.mottatt || 0) + n;
        melde(data, `🍺 ${meg.navn} kjøpte ${n} ${n === 1 ? 'slurk' : 'slurker'} til ${til.navn}! Drikk opp.`, `🍺 ${meg.navn} bought ${til.navn} ${n} ${n === 1 ? 'sip' : 'sips'}! Drink up.`);
      }
      return { ok: true };
    }
    if (vare === 'immun') {
      if ((p.immun || 0) >= BUTIKK.maksImmun) return { feil: 'maks', melding: `Du kan ha maks ${BUTIKK.maksImmun} immuniteter.`, en: `You can hold at most ${BUTIKK.maksImmun} immunities.` };
      const prisI = varePris(data, 'immun');
      if (saldo(b, meg.id) < prisI) return { feil: 'penger', melding: 'Du har ikke nok vorskroner.', en: 'You don’t have enough coins.' };
      flytt(b, meg.id, -prisI, 'Kjøpte immunitet 🛡️', 'Bought immunity 🛡️');
      p.immun = (p.immun || 0) + 1;
      return { ok: true };
    }
    if (vare === 'poeng') {
      b.poengKjopt = b.poengKjopt || {};
      if (b.poengKjopt[meg.id]) return { feil: 'maks', melding: 'Du har allerede kjøpt et kveldspoeng i kveld.', en: 'You’ve already bought a night point tonight.' };
      const prisP = varePris(data, 'poeng');
      if (saldo(b, meg.id) < prisP) return { feil: 'penger', melding: 'Du har ikke nok vorskroner.', en: 'You don’t have enough coins.' };
      flytt(b, meg.id, -prisP, 'Kjøpte et kveldspoeng 🏅', 'Bought a night point 🏅');
      b.poengKjopt[meg.id] = true;
      const k = kveldData(data);
      k.poeng[meg.id] = (k.poeng[meg.id] || 0) + 1;
      k.runder.push({ navn: { no: '🛒 Kjøpt kveldspoeng', en: '🛒 Bought night point' }, plass: [[meg.id]], manuell: true, kjopt: true, t: Date.now() });
      melde(data, `🏅 ${meg.navn} kjøpte seg et kveldspoeng for ${prisP} kr`, `🏅 ${meg.navn} bought a night point for ${prisP}`);
      return { ok: true };
    }
    return { feil: 'ukjent' };
  }
  if (hd === 'bs-meld') {
    const a = finn(b, h.aksje); if (!a || (a.status !== 'apen' && a.status !== 'stengt')) return { feil: 'stengt', melding: 'Aksjen kan ikke meldes nå.', en: 'This share can’t be reported now.' };
    if (a.laast && !b.fri) return { feil: 'pluss', melding: 'Denne aksjen krever Pluss hos verten.', en: 'This share needs the host to have Pluss.' };
    if (!kanSe(b, a, meg.id)) return { feil: 'ugyldig', melding: 'Denne aksjen er ikke på hånda di.', en: 'This share isn’t in your hand.' };
    const utfall = a.type === 'janei' ? 'ja' : String(h.utfall || '');
    if (!a.utfall.includes(utfall)) return { feil: 'ugyldig' };
    const vitne = h.vitne && data.spillere.some((p: any) => p.id === h.vitne && p.id !== meg.id) ? String(h.vitne) : null;
    let bilde: string | null = null;
    if (typeof h.bilde === 'string' && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(h.bilde) && h.bilde.length < 160000) bilde = h.bilde;
    a.melding = { av: meg.id, utfall, vitne, subjekt: a.type === 'hvem' ? utfall : null, stemmer: { [meg.id]: 'ja' }, frist: frist(FRIST_MELDING), bilde: !!bilde, t: Date.now(), forrige: a.status };
    statFor(a, { meldt: 1 });
    a.meldtT = Date.now();
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
    if (erVert) { a.status = 'apen'; EGNE.push({ tekst, type }); melde(data, `📈 ${meg.navn} har notert en ny aksje: ${tekst}`, `📈 ${meg.navn} listed a new share: ${tekst}`); }
    else melde(data, `🧾 ${meg.navn} vil notere en ny aksje – verten må godkjenne`, `🧾 ${meg.navn} wants to list a new share – the host must approve`);
    return { ok: true };
  }
  if (hd === 'bs-godkjenn') {
    if (!erVert) return { feil: 'bare-vert' };
    const a = finn(b, h.aksje); if (!a || a.status !== 'venter') return { ok: true };
    if (h.ok) { a.status = 'apen'; EGNE.push({ tekst: String(a.q), type: a.type }); melde(data, `📈 Ny aksje på børsen: ${a.q}`, `📈 New share on the Exchange: ${a.q}`); }
    else { a.status = 'avvist'; flytt(b, a.av, NOTERING, 'Aksjen ble avvist – pengene tilbake', 'Share rejected – refunded'); b.noterte[a.av] = false; }
    return { ok: true };
  }
  if (hd === 'bs-anmeld') {
    const a = finn(b, h.aksje); if (!a || a.status !== 'avgjort') return { feil: 'ugyldig', melding: 'Du kan bare anmelde aksjer som er avgjort.', en: 'You can only report shares that are settled.' };
    const mot = String(h.mot || '');
    if (!vinnere(a).includes(mot) || mot === meg.id) return { feil: 'ugyldig', melding: 'Bare de som vant på aksjen kan anmeldes.', en: 'Only people who won on this share can be reported.' };
    const utenfor = [meg.id, mot].concat(a.type === 'hvem' && a.vinner ? [a.vinner] : []);
    if (b.saker.some((s: any) => s.aksje === a.id && s.mot === mot)) return { feil: 'opptatt', melding: 'Den personen er allerede etterforsket for denne aksjen.', en: 'That person has already been investigated for this share.' };
    const sak = { id: nyId(), aksje: a.id, av: meg.id, mot, utenfor, fase: 'forsvar', frist: frist(FRIST_FORSVAR), stemmer: {}, resultat: null };
    b.saker.push(sak);
    // Ingen uinvolverte å spørre? Da avgjør bevisene med en gang.
    if (!data.spillere.some((p: any) => !utenfor.includes(p.id))) { dom(data, sak); return { ok: true }; }
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
  const aksjer = b.aksjer.filter((a: any) => a.status !== 'avvist' && (a.status !== 'venter' || m === data.vert || m === a.av) &&
    // Åpne aksjer vises bare for dem som har dem i sitt utvalg (eller eier noe i dem). Meldte og avgjorte ser alle.
    kanSe(b, a, m)).map((a: any) => {
    const hold = m ? a.hold[m] : null;
    const status = a.status === 'apen' && a.stenger && Date.now() >= a.stenger ? 'stengt' : a.status;
    return {
      id: a.id, type: a.type, q: a.q, kat: a.av ? 'egen' : a.kat || null, iHand: !!(m && b.hand && (b.hand[m] || []).includes(a.id)), status, av: a.av, egen: !!a.av, stenger: a.stenger, laast: !!a.laast && !b.fri,
      utfall: a.utfall.map((u: string, i: number) => { const sb = selgbar(hold, u), mine = hold ? hold.n[u] || 0 : 0; const gamle = Math.max(0, mine - ((hold && hold.tider && hold.tider[u]) || []).length);
        // Din egen rad i en hvem-aksje er skjult: du skal ikke vite at du er favoritten (og unngå å gjøre det)
        if (a.type === 'hvem' && u === m && ['apen', 'stengt'].includes(a.status)) return { u, skjult: true, kurs: null, odds: null, selg: 0, solgt: null, mine: 0, klare: 0, selgOm: 0 };
        return { u, kurs: kurs(a.qs[i]), odds: odds(a.qs[i]), selg: salgskurs(a.qs[i]), solgt: a.qs[i], mine, klare: sb.klare + gamle, selgOm: sb.klare + gamle ? 0 : sb.om }; }),
      vinner: a.vinner, fikk: hold ? hold.fikk || 0 : 0, kost: hold ? hold.kost || 0 : 0,
      vinnere: a.status === 'avgjort' ? vinnere(a).filter((id: string) => id !== m && !b.saker.some((x: any) => x.aksje === a.id && x.mot === id)) : [],
      antallVinnere: a.status === 'avgjort' ? vinnere(a).length : 0, jegVant: a.status === 'avgjort' && !!m && vinnere(a).includes(m),
      melding: a.melding ? { av: a.melding.av, utfall: a.melding.utfall, vitne: a.melding.vitne, subjekt: a.melding.subjekt, frist: a.melding.frist, bilde: a.melding.bilde,
        harStemt: Object.keys(a.melding.stemmer), minStemme: m ? a.melding.stemmer[m] || null : null, utsatt: !!a.melding.utsatt } : null,
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
    hand: b.hand && m ? { str: HAND, pris: BYTT_PRIS, slurk: BYTT_SLURK,
      pott: potStr(b), igjen: (b.pott || []).length } : null,
    aksjer, saker, harNotert: m ? !!b.noterte[m] : false, slutt: b.slutt || null,
    mineGaver: m ? (b.overforinger || []).filter((o: any) => o.fra === m || o.til === m).map((o: any) => ({ fra: o.fra, til: o.til, kr: o.kr })) : [],
    bev: m ? (b.bev || []).filter((x: any) => x.id === m).slice(-6).map((x: any) => ({ n: x.n, kr: x.kr, t: { no: x.no, en: x.en } })) : [],
    kategorier: KATEGORIER.map((k) => ({ id: k.id, t: { no: k.no, en: k.en } })), valgteKat: b.kat || null,
    butikk: { ...BUTIKK, slurkPriser: m ? Object.fromEntries([1, 2, 3, 5].map((n) => [n, slurkPris(data, m, n)])) : {}, prisPoeng: varePris(data, 'poeng'), faktor: Math.round(prisfaktor(data) * 10) / 10, immun: m ? ((data.spillere.find((p: any) => p.id === m) || {}).immun || 0) : 0, poengKjopt: !!(m && b.poengKjopt && b.poengKjopt[m]), maksImmun: BUTIKK.maksImmun, prisImmun: varePris(data, 'immun') },
    startKr: m && b.startKr && b.startKr[m] != null ? b.startKr[m] : null,
    priser: { meldebonus: MELDEBONUS, hovedrolle: HOVEDROLLE, kurtasje: KURTASJE, laas: LAAS_MIN, notering: NOTERING, honorar: HONORAR, utbetaling: UTBETALING, start: STARTKURS, maks: MAKSKURS },
  };
}
