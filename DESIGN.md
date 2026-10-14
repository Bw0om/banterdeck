# Design: stua

mittvors' visual system since October 2026. It sits in `src/styles/stua.css`, loaded after the older `global.css`, `natt.css` and `champagne.css` layers, and redefines their tokens. The homepage (`src/components/pages/Home.astro`) and the living room (`src/components/Stua.astro`) are the reference build.

## Idea

The vors as a room you walk into. Neo-brutalism carries the page: full-width colour fields, thick black strokes and hard offset shadows. A drawn isometric living room is the signature: a new guest walks in through the door for every letter of the room code. Characters and game icons are flat stickers with emoji-like faces.

## Colour

| Token | Value | Role |
|---|---|---|
| `--oransje` | `#FF5B1F` | Brand field (hero, mobile top bar), press, drink |
| `--gul` | `#FFD23F` | Now / on / selected / primary button (`--gold`) |
| `--mint` | `#63E2A8` | Field and sticker colour |
| `--rosa` | `#FF9CC2` | Field and sticker colour, Pluss |
| `--papir` | `#FFF8EE` | Light ground |
| `--blekk` | `#16120F` | Ink, strokes, shadows |
| `--tavle` | `#1C1B1F` | Dark panels (code panel), dark-mode ground |
| `--flapp-tekst` | `#FFE07A` | Split-flap characters |

Light is the default theme; dark (`data-theme="dark"`) keeps the same accents on `--tavle`. Text on orange, yellow, mint and pink is always `--blekk`. Link text on light ground is `--gold-t` `#B8380A`.

## Type

One family, Archivo Variable (self-hosted, width axis).
- Display (h1, h2, prices, game names): `font-stretch` 62–75 %, weight 900, uppercase, line-height ≈ .9.
- Labels and buttons: 75–85 %, weight 850–900, uppercase.
- Body: 100 %, weight 400–650, sentence case.
- `h1 em` / `h2 em` are yellow boxes with ink text, not italics.

## Shape and depth

- Strokes: `--strek` 3px (2.5px on small controls), always ink.
- Shadows: hard and offset only. `--skygge` 5px, `--skygge-liten` 3px, `--skygge-stor` 9px. No blur.
- Radius: 4px for controls, 6–8px for cards. No pills.
- Hover lifts (translate −2/−3px, bigger shadow). Press sinks into the shadow (translate to 0 shadow, 90ms).

## Motion

- Springs everywhere, with at most a 2 % overshoot. CSS uses `--fjaer` (a `linear()` spring curve) over `--fjaer-tid` 520ms. JS uses `window.mvFjaer` from `Stua.astro` (stiffness 170 or 320, damping ratio .8).
- Nothing moves on its own. Every change follows a click, drag or keystroke: typing the code, dragging people in the room, dragging cards off the deck, the player counter.
- Split-flap (`.flapp`) is only for numbers and codes: the room code, the player count and the Nyhetsrunden week number.
- `prefers-reduced-motion` snaps to the end state.

## Components

- **Stickers** (`src/lib/klistremerker.ts`): 64×64 SVGs, 3.5px ink stroke, flat palette fills. `klistremerke(slug)` returns the game's sticker, falling back to a glass.
- **Characters** (`window.mvFigur` in `Stua.astro`): body, head, hair (short, long, beanie, curls), eyes (normal, wink, happy) and mouth (smile, grin, o, tongue).
- **Fields**: sections are full-width bands separated by a 3px ink rule, alternating orange, ground, mint, yellow, pink.
- **Tickets**: Pluss prices as tickets with a dashed stub.
- **Player counter**: "Hvor mange er dere?" with − / +, split-flap number and faces; games that fit spring to the front (FLIP with springs).

## The room (game night)

- **Stua in the room** (`src/klient/stua.js`, used by `rom.js`, the homepage and the TV): every player is a figure whose look is derived from their id, so they look the same on every screen. New players walk in through the door; players who leave walk out.
- **Synced moves**: dropping someone sends `stua-flytt` to the server; positions live in `data.stua.pos` and reach every phone and the TV. While someone is being held, the room does not redraw (max 8 s) and the page does not scroll on touch.
- **Easter eggs**: moving the others `STUA_PLAG` (6) times within a minute costs one sip (or penalty point), announced on every screen; a warning comes two moves before. Dragging someone to the door ("Not leaving yet!"), shaking someone (dizzy eyes), tapping the TV ("SKÅL!", everyone hops) and tapping the lamp (lights off, this screen only).
- **Wandering**: figures take a small step around their spot every 5–12 s. This is the one motion that is not triggered by a person, by request.
- **The TV in stua** shows the room code in the lobby and the current card or question during a game. The real TV view (`Storskjerm.astro`) shows the same stua, and now also shows the public question for Ukjent avsender, Skrøna, Saueflokken, To sannheter og en løgn, Skriv og drikk and Nyhetsrunden. Secret games (Muldvarpen, Hvem er jeg?) never show their secret.
- **Room surfaces**: panels, cards, chips and buttons use the same strokes and hard shadows; the room code and step numbers use the split-flap look; header buttons and background games use stickers instead of emoji.

## Gear and room themes

- **Gear** (`src/lib/pynt.js` is the catalogue; `PYNT_SVG` in `src/klient/stua.js` draws it): hats, glasses, a chest item and a pet beside the figure. Four slots: hode, ansikt, bryst, venn. Everything is free and unlocked by playing: the first night, three/five/ten nights, a crew night, and the end-of-night awards (crown for the winner, sunglasses for the thirstiest, halo for 'slapp unna', cowboy hat for the ring breaker, top hat for the market king, quiz glasses for the quiz master, helmet for 'mest mobbet', dog for 'mest gavmild'). Seasonal gear (Santa hat in December, 17 May ribbon in May) is unlocked and wearable only in season and comes back every year.
- **Where it lives**: table `pynt` (what is unlocked) and `profiler.pynt` (what is worn) + `profiler.kvelder`. The account page (`Figuren din`) previews the figure and lets you pick; the choice rides into every room you join or create while logged in (`p.pynt`, `p.bruker`), and the TV shows it too. A logged-in player's figure looks the same every night (`figurNokkel(konto)`); guests get a look from their player id.
- **Unlocks** happen when the host ends the night (`delUtPynt` in `api/rom/[kode].ts`): every logged-in player's night count goes up, awards hand out gear, and the summary shows "Nytt i garderoben" with a link to the account page. Guests without an account see a one-line nudge instead.
- **Room themes** (`TEMAER` in `pynt.js`, `TEMA` in `stua.js`): Stua, Hytta (free), Takterrassen and Julebordet (Pluss; Julebordet is free in December). The host picks in the lobby under the living room; every phone and the TV redraw the room while the people stay where they are. Each theme changes floor, walls, window view, sofa, table and door, plus one signature: wood planks and mountains, string lights and a skyline, or a tree and a wreath.
- **In the room** (`figurArk()` and `romArk()` in `src/klient/rom.js`): tap your own figure and the "Figuren din" sheet opens (tabs per slot, unlocked gear can be worn, locked gear says what it takes; guests get a "Lag bruker" button). The host taps the room and the "Rommet" sheet opens: the four themes with small previews, and "Små ting i rommet" (`EKSTRA` in `pynt.js`: plant after 3 nights, string lights after 5, news poster for a quiz master, record player once Låtbekjennelsen has been played in the room). After the night, "Nytt i garderoben" has a "Ta det på nå" button that opens the figure sheet. Both sheets use the page tokens (`--card`, `--ink`, `--bg2`) so they follow light/dark mode; the theme buttons use `data-stuatema`, never `data-tema`, because `data-tema` is the global light/dark toggle in `Base.astro`.
## Ring of Fire on the phone

The pull is a steady-hand test, not a speed test (`rofSpill` and the pointer handlers in `src/klient/rom.js`, everything inside one SVG, viewBox 358×500). Spin by swiping around the ring; hold the yellow card on top and follow the dotted lane out of the ring. Outside the lane tension builds (meter mint → yellow → orange, the ring shivers, the phone buzzes, a low creak), inside it bleeds off slowly. The lane narrows as cards run out (`rofHalv`), the first round is lenient, a broken ring cannot break again. The drawer sends `rof-holder` (progress and tension, at most every 400 ms) so everyone else, and the TV, watches the card on its way out. The drawn card lands on top of the ring (`.ring-over`, 420 ms spring) and stays until the next pull begins or you tap "Greit". Header is one chip (whose turn) plus two badges (cards left, kings); the page title and the global turn banner are hidden for this game. Room sounds all go through a 1 800 Hz low-pass with an 18 ms attack and a long tail, one to two octaves lower than before.
## Nyhetsrunden

Everyone sees the question (`nyhetsrundenSpill` in `src/klient/rom.js`); the host still reads it aloud and gets a "Les det høyt" tag. Header: one chip (question n of N) and a pie clock that empties with the deadline (driven by the same `fristTikk` as other deadlines). A row of initials shows who has answered (dashed = not yet). Choice and true/nonsense answers are A–D stickers; you can change until the reveal. The reveal stamps "Riktig"/"Feil" on the options, puts everyone's initials on what they picked and shows a result card for you ("Riktig – del ut én", "Feil – drikk én"). Number questions use an own keypad (the phone keyboard would cover the question) and reveal on a ratio-scaled number line: the answer is a flag under the line, guesses sit above in rows so they never overlap. Scoring for numbers (`nrAvslor` in `src/lib/rom.ts`): closest hands out two, within 10% hands out one, furthest off (with 3+ guesses) drinks, the rest nothing. Rounds are 10, 15 (default) or all 30, picked by the host before the first question or on the podium; short rounds take questions this room has not had yet (`data.nrBrukt`). The end is a podium (bars grow with a spring) with small awards: Tallgeni, Lurt av tull, the question nobody got. The TV shows the same question, A–D, who picked what after the reveal, and the standings as a row of chips. Player colours come from `NR_FARGER` by seat order, the same on phone and TV.
## Løgnhalsen

The role sits under a neutral card ("Hold for å se", `.lh-kikk` in `src/klient/rom.js`) and slides up with a spring only while the finger is on it; lie and truth share one colour, so nobody reads the role from across the sofa. The teller can ask for an idea (a random place, person and detail to build a lie on, client-side only) and swap the card once per turn (`lh-bytt`). Nobody types anything: the story is told out loud, so the TV shows the card and who is telling, never the answer. The others get a "Grill dem" hint with follow-up questions, vote Sant or Løgn, and can tick "Jeg er helt sikker" (right: hand out one; wrong: drink four instead of two). The reveal stamps "X løy!" / "X sa sannheten!" over the card and shows two columns, "Trodde sant" and "Trodde løgn", with sure voters ringed in orange. Scoring (`avgjorForraeder` in `src/lib/rom.ts`): the teller hands out one per person fooled and drinks three if nobody was fooled; fooled counts add up to the award "Kveldens løgnhals". Cards live in `decks.json` / `decks.en.json` under `forraeder` (same order in both files), with three piles: Snill, Drøy and Om rommet.
## Pekeleken

The reader rotates every card. "Hvem er mest sannsynlig til å …" is printed small and the rest of the question big, so it reads fast. The reader (or the host) taps "Tell ned"; the server stores one start time and every phone and the TV count 3 · 2 · 1 from it (adjusted for clock offset), each number landing with a short spring, then a pointing hand and "PEK!" with a low thump and a buzz. After that each person taps how many fingers pointed at them; most fingers drinks that many (`avgjorPek` in `src/lib/rom.ts`), the result card and bars spring in once. About every fifth card gets a twist on a yellow tape strip (`PEK_VRIER`: close your eyes, point where the majority points, defence speech with a 15 s bar, point at yourself, double), never two in a row. The TV shows the card, the countdown, the outcome, the last card's result and "Mest utpekt i kveld"; the evening award is "Mest utpekt". Card rule of thumb: something everyone has seen someone do, so everyone has a candidate at once; no sex or shock that is not about anyone in the room.
## Skriv og drikk

Writing is three things only: the pie clock, the card you write on and your pile (the last three cards stacked; a new card flies in with a spring and the count bumps). Above the text field you pick who the card is for: everyone, whoever draws it, one person (chips in their seat colour) or two at random (resolved to two real names when drawn). Each player gets three starters from a large pool, new after every card, so nobody sees the same ones; tapping one puts it in the field. Enter sends. Anyone can draw the next card, no fixed order. A card for you turns your phone's card area yellow with a "Til deg!" stamp, a buzz and a chime; the TV shows the person's own figure from the living room and their name on a yellow tape. Cards that try to hand out more than 10 sips (`rfSlurker` in `src/lib/rom.ts`: digits and number words in Norwegian and English, only when tied to a drink word or verb, so "20 land" is fine) quietly never enter the pile; the writer sees nothing, and the limit is not shown anywhere, it is an easter egg. Only the host can propose binning a drawn card; it goes only if everyone except its writer votes yes. Both kinds end up in Skammekroken after the last card: writer, the card struck through and a comment that fits the card (litres for big numbers, the target's name, or the vote), and one sip per attempt. Then the game ends: no endless reshuffle. The end screen (`lekSlutt` in `src/klient/rom.js`, reusable for other games) gives the host: Next in the plan (when the night has a planned order, which is kept), play again (new writing round or the same pile), pick another game, or end the night ("Avslutt gjengkvelden" in a crew). Guests see that the host is choosing.

### Jeg har aldri

- **En runde er 30 kort**, de dere ikke har hatt først. Når bunken er tom, er leken ferdig og verten får de samme valgene som i Skriv og drikk: neste i planen, nye kort, en annen lek eller avslutt kvelden.
- **Svar i hemmelighet.** To store knapper, «Jeg har» og «Aldri». Raden under viser hvem som har svart (stiplet = ikke ennå), aldri hva. Du kan bytte svar til alle har svart. Én klokke i toppen, ingen teller i hjørnet.
- **Snudd!** Ett kort per person snus etter tur (rotateY med fjær, 160 ms mellom hvert). «Har» er oransje med svart tekst, «Aldri» er papir. Dommen kommer etter siste kort.
- **Bare én har gjort det** (minst tre spillere): søkelys på personen, «Fortell historien!», to slurker. Nekter hen, trykker hen eller verten «Nekter (+2)».
- **Ingen har gjort det:** den som trakk kortet, drikker én for et kjedelig kort. **Alle har gjort det:** «Skål – dere er like ille alle sammen.»
- **TV-en** viser figuren til hver person i kortene, og «Har gjort det» i svart på oransje, aldri gult på gult.
- Kåringen «Mest erfaren» går til den som har sagt «Jeg har» flest ganger (minst fem).

### Når kortene er brukt opp (alle kortleker)

- Alle kortlekene unntatt Ring of Fire har 30 kort i en runde, de dere ikke har hatt først. Når bunken er tom, stokkes den ikke på nytt.
- Ring of Fire har alle 52 kortene. Når ringen er tom, vises siste kort først. Når det er lagt bort, kommer «Hva nå?» med **Ny ring** (eller **Ny kortstokk** uten ring). TV-en viser siste kort og hvem som brøt ringen.
- Verten får «Hva nå?»: neste i planen (hvis dere har en), **Nye kort** (30 dere ikke har hatt), en annen lek eller avslutt kvelden. De andre ser at verten velger.
- Pekeleken viser hvem som er mest utpekt i kveld. De andre viser hvor mange kort dere spilte. TV-en viser det samme, med figuren til den som ble pekt mest på.

### Enten eller

- **Kortet deles i to valg**: «Enten» (oransje) og «Eller» (mint) som to store knapper med et «eller»-merke i midten. Kortstokken har 100 kort (65 + 35 nye), 30 per runde.
- **Velg side i hemmelighet.** Klokka står på 20 sekunder. Har alle valgt, kortes den til tre sekunder, men ingen ser noe før den er ute. Du kan bytte valg så lenge klokka går. Verten kan «Snu nå».
- **Hodene.** Ny figurstil i `hodeHtml` i stua.js: samme hår, hud og genserfarge som figuren, men rundt hode, store øyne med glans, rødme og skuldre. De står på en benk nederst med skuldrene under kanten. Før du har valgt stikker bare toppen av hodet opp; når du velger, reiser hodet seg (fjær). Øynene kikker på hverandre (pupillene flyttes hvert 1,4 s, blunker av og til). Brukes foreløpig bare i Enten eller, på telefon og TV.
- **Snudd!** Sidene får antall og piller, benken deles i to farger og hodene glir til hver sin side. Mindretallet drikker én. Like mange: «Uavgjort! Skål.» Alle likt: den som trakk kortet drikker én for et for lett kort.
- **Én alene** (minst tre som valgte): alle hodene stirrer på personen, som får «OI»-fjeset (hevede bryn, store øyne, åpen munn, svettedråpe). Søkelys med «Forsvar valget ditt!» og 20 sekunder. Personen eller verten trykker «Fikk med én» (velg hvem, som drikker én) eller «Drikk to».
- Kåring «Mot strømmen» til den som har vært i mindretall flest ganger (minst tre).

### Benken med hodene (alle leker der folk svarer eller stemmer)

- `hodeBenk` (telefon) og `tvBenk` (TV) er felles: hodene står med skuldrene under kanten, bare toppen av hodet synes før personen har svart, og så reiser hodet seg. Øynene kikker på hverandre (`benkTikk`).
- Valg: `oppe` (hvem som har svart), `sider` (del benken i to, med farge og navn på hver side), `oi` («OI»-fjes), `stirr` (alle ser på én), `flat` (de andre får en flau munn), `merk` (ring rundt navnet), `status` (f.eks. «2 av 4 har svart»).
- **Jeg har aldri:** reiser seg når de har svart. Etter avsløringen: «Har gjort det» (oransje) og «Aldri». Ensom ulv eller den som trakk et kjedelig kort får «OI», og alle stirrer. Søkelyset viser det store hodet med «OI» i stedet for initialer.
- **Løgnhalsen:** de som stemmer reiser seg (den som forteller står ikke på benken). Etterpå: «Trodde sant» (mint) og «Trodde løgn» (rosa). De som tok feil får «OI»; «helt sikker» får ring rundt navnet. Erstatter kolonnene.
- **Pekeleken:** reiser seg når de har talt fingre. Etterpå får den med flest fingre «OI», og alle stirrer.
- **Nyhetsrunden:** reiser seg når de har svart.
- **Enten eller** bruker den samme benken. Vinnere på sluttskjermene og Skriv og drikk på TV viser også de nye hodene.

### Rygg mot rygg

- **Parene går i kjede:** A og B, B og C, C og A … så én person er med to kort på rad. Runden er 3 kort per spiller (6–30), så alle er med på rundt seks kort. Kortstokken har 100 kort (60 + 40 nye).
- **De to peker i hemmelighet:** «Meg» (rosa) eller den andre (blå). **Alle andre gjetter:** den ene, den andre eller «De blir uenige» (gul, hele bredden). Ingen ser noe før klokka er ute (25 s, kortes til 3 s når alle er klare).
- **Benken:** paret står i midten med gule navnelapper og lener seg fra hverandre (16°) med øynene utover. Tilskuerne står helt ut på sidene og reiser seg når de har gjettet. Når klokka er ute, snur paret seg mot hverandre (8°, fjær) og ser på hverandre.
- **Enige:** den de pekte på drikker én (grønn boks). **Uenige:** begge drikker én og får «OI»-fjeset (oransje boks). Alle som gjettet feil, drikker én. Den i paret som ikke pekte, drikker én.
- Knappen videre sier hvem som er neste par. Kåring «Tankeleseren» til den som oftest er enig med partneren sin (minst tre).

### Nødt eller sannhet

- **Én i stolen per kort, etter tur.** Verten velger bare Snill, Drøy eller Alle. Runden er 3 kort per spiller (6–30), og kortstokken har 104 kort (64 + 40 nye), delt i en nødt- og en sannhetsbunke.
- **Den i stolen velger selv:** to store knapper, **Nødt** (oransje) og **Sannhet** (mint), 20 sekunder. Først da trekkes kortet fra den bunken og snus (rotateY med fjær). Velger hen ikke, velger appen. Verten kan velge for en som ikke er ved telefonen.
- **Gjør det eller feig ut:** «Ferdig – la dem dømme» eller «Feig ut · drikk 3» (rosa boks, «OI»-fjeset).
- **Alle andre er dommere:** «Godkjent» (mint) eller «Juks!» (rosa), 20 sekunder, kortes til to når alle har stemt. Flertallet bestemmer, likt er godkjent. Juks: drikk 2 (oransje boks, «OI»). Verten kan «Døm nå».
- **Benken:** den i stolen står i midten, større, med gul navnelapp og et gult søkelys bak seg. Alle de andre ser på hen og reiser seg når de har dømt. TV-en viser det samme, med «Kasper i stolen. Nødt eller sannhet?» i stor skrift mens hen velger.
- Kåring «Våghalsen» til den som har gjennomført flest godkjente nødt (minst tre).

### Kategorier

- **Bomba går rundt.** Den som har den, får én stor oransje knapp: **«Sagt!»** (med «Send bomba →» under). Bomba flyr i en bue med fjær til neste hode på benken (FLIP med WAAPI, bare transform), og telefonen til den som får den, sier fra med lyd og en kort vibrasjon.
- **Ingen vet når den smeller:** 20–45 sekunder etter at kortet kom (pluss tre til å lese). Gnisten blafrer, og bomba vipper fortere jo nærmere smellet. Den som har bomba da, drikker 2: gul stjerne med «BOM!», «OI»-fjeset, skjermen rister én gang og TV-en sier «dundun».
- **Sagt før!** De andre har én rosa knapp. Alle ser hvem som ropte. Det nullstilles når bomba går videre.
- **Få ord:** ingen forklaringstekster i leken. Tittelen sier hvem som har bomba; «Slik spiller dere» har reglene.
- Neste kategori starter hos den som sprengte. Ingen smakebiter (det er ikke kategorier). Kortstokken har 120 kategorier (80 + 40 nye). Kåring «Bombeofferet» til den som sprengte flest ganger (minst tre).

### Pekeleken: duo-kort

- **Duoleken er ikke lenger en egen lek i rommet.** Kortene dukker opp som **duo-kort** i Pekeleken: sjelden og tilfeldig (8 % per kort, minst to vanlige kort imellom, aldri to på rad, aldri samtidig med en vri), så det kommer uten fast rytme. «Spill i rom» fra Duoleken-siden starter Pekeleken.
- Kortet får et rosa «Duo · Pek på to»-merke og «Én hånd på hver.»; nedtellingen ender på «Pek på to!».
- **De to med flest fingre er duoen.** Hver drikker fingrene sine. Bare én med fingre: vanlig resultat.
- **Benken:** duoen glir sammen midt på og lener seg mot hverandre, rosa navnelapper, og et rosa hjerte spretter opp mellom dem (én gang per kort). Alle hoder som flytter seg på benken glir nå dit med fjær (FLIP), på telefon og TV.
- Kåring «Halve drømmeduoen» til den som oftest har vært i duoen (minst to).

### Færre leker, tydeligere leker

- **50/50 er borte fra rommet.** «Jeg har aldri»-kortene fantes allerede i Jeg har aldri; de 120 «Hvem …»-kortene (Snusboksen) er nå i Pekeleken (243 kort).
- **Sannhet eller drikk er slått sammen med Nødt eller sannhet.** De 60 sannhetskortene ligger i sannhetsbunken (164 kort); «drikk i stedet» finnes allerede som «Feig ut».
- **Mest sannsynlig er Pekeleken på mobilen.** Pekeleken-kortet i lobbyen har en bryter: **Pek i rommet** (fingre, nedtelling) eller **Stem på mobilen**. Valget huskes på telefonen. Spillet heter «Pekeleken · på mobilen».
- **Stem på mobilen:** du trykker på hodet til den det passer best på (store hode-knapper, 2 kolonner opp til fire spillere). Hodene på benken reiser seg når folk har stemt; når alle har stemt, går det to sekunder før resultatet. Resultatet: stemmetall spretter opp over hodene med en liten forsinkelse etter hverandre, den med flest får «OI» og alle stirrer. Hver stemme er én slurk. TV-en viser det samme.
- Gamle lenker og planer virker: 50/50 og Duoleken starter Pekeleken, Sannhet eller drikk starter Nødt eller sannhet (snill/drøy følger med).
- Lobbyen har én kort linje per kortlek om hva som skjer («Bomba går rundt. Ingen vet når den smeller.»).

### Låtbekjennelsen

- **En runde er 8 kategorier.** Alle skriver inn én låt («Låt – artist») i hemmelighet, 60 sekunder (kortes til to når alle har valgt). Hodene reiser seg når folk har valgt.
- **Låtene kommer én og én** i tilfeldig rekkefølge. Platen glir ut med fjær og snurrer (lineært, konstant), og hodene på benken vugger i takt. **Bare verten** har «Spill på Spotify» (åpner Spotify-søket på låta), så ingen starter den samtidig.
- **Hvem valgte den?** Alle andre trykker på et hode (ikke seg selv). Eieren ser «Din låt! Hold maska.». Feil gjett drikker én. Avsløringen: eieren får gul navnelapp, alle ser på hen, «… – fortell!».
- **Beste historie:** etter siste låt stemmer alle (ikke på seg selv). Vinneren deler ut 3. Så vises hvem som valgte hva, med platefargen ved hver låt.
- Kåring «Historiefortelleren» (beste historie minst to ganger).
- **Klokka i alle leker:** telefonene ber om «tid ute» tidligst 0,9 s etter at klokka viser 0, så serveren alltid godtar det (før kunne en kategori bli stående hvis alle spurte for tidlig).

## Løgnhalsen and Nyhetsrunden

- **Løgnhalsen:** the teller sits in the chair in the middle of the bench and every head stares at them. While the others vote, the teller sweats (two drops) and keeps a flat mouth. The reveal: if they lied, their nose grows (a spring, just after the stamp). The bench splits into "Trodde sant" and "Trodde løgn", and those who were fooled get the OI face.
- **Voting:** a tap on Sant or Løgn is a normal vote. Holding for 0.7 s fills the button and votes "absolutely sure" (×2), which replaces the separate checkbox. The hold survives a redraw because the animation continues with a negative delay.
- **Grill:** one follow-up question at a time; tap for a new one.
- **Nyhetsrunden:** the top is a newspaper masthead (NYHETSRUNDEN, week and question number). Real heads replace the initial pills everywhere: on the answer options, as pins on the number line, in the lists and on the podium. On the reveal the heads hop into the answer they chose, and the answer flag drops in last. The podium rises and the winner gets the crown.
- **Short pause before the reveal:** when everyone has answered or voted, the clock drops to 2 s, the same as Pekeleken on the phones. Players can still change their answer, and the reveal feels like a moment.

## Saueflokken and Ukjent avsender

- **Saueflokken:** everyone writes one word while the heads rise on the bench. The herds are revealed one at a time, 700 ms apart: the lone answers come first as "black sheep" (pink, with the OI face, drink 1), then the herds, and the biggest herd last with the FLOKKEN! stamp. The heads hop into their herd.
- **Merging herds:** the host can tap "Slå sammen", then two answer cards, to merge answers that are really the same ("pepperoni" and "peperoni"). Anyone who stood alone and is now in a herd gets their sip back.
- **Ukjent avsender:** your answer folds into an envelope. The answers then arrive one by one as a message from "Ukjent avsender", with typing dots first. Everyone taps the head of the person they think wrote it. The bench is hidden while guessing, because a head that never rises would give the author away.
- **The reveal:** "Ukjent avsender" turns into the name, and the author's head pops in as the profile picture. The last screen names "Best gjemt", the player who fooled the most people.
- **Short pause:** when everyone has written or guessed, both games wait 2 s before moving on, the same as Løgnhalsen and Nyhetsrunden.

## Muldvarpen and Hvem er jeg?

- **Muldvarpen has no clock.** You hold your card to see the location, or the mole peeking up from the dirt.
- **The ring:** heads stand in a ring. Whoever has the turn taps the person they ask; an arrow is drawn and the turn passes on.
- **The host flips the cards.** When someone calls out a name, the host flips that person's card.
  - **Innocent:** the host ticks off who called it, and they drink 2. The ring continues.
  - **Mole:** the host ticks off who guessed right, and whether the mole guessed the location. Then every card flips.
  - The TV never shows the location until the end.
- **Hvem er jeg?:** you write directly on the note on the other person's forehead; the word appears as you type, and the note slaps on. Notes always shrink the font to fit the longest word.
  - **During play:** every head wears a yellow note. Yours is a wobbling question mark.
  - **Guessing:** one tap on "Gjettet!" makes the note fall off, with a few seconds to undo.
  - **On the TV:** only notes that have been guessed are shown.
- **End of a game:** the host gets the shared "Hva nå?" screen: "Spill igjen" (counts tonight) or the next game in the plan. There are no round numbers and no countdown.

## To sannheter og en løgn and Drikke-bingo

- **To sannheter: the chair.** One player sits in an orange chair and writes three cards, then stamps "Løgn" on one. The cards are shuffled onto the table.
  - **Voting:** the others tap the card they think is the lie, and their head lands on it. Nobody sees other votes until the reveal, so nobody follows the herd.
  - **Reveal:** when everyone has voted there is a 2 s pause, then the cards flip: SANN, SANN, and the LØGN stamp last with a shake. Every head lands on its card. Missed or no vote: drink 1. The chair drinks 1 per person who saw the lie.
  - **No "next" button:** the reveal stays on screen while the next person in the chair is already writing. When everyone has sat in the chair, a "Beste løgner" podium appears, then "Hva nå?".
- **Drikke-bingo: the dabber.** Tapping a song drops an ink blot on the square (tap again to remove). Four in a row draws a line and "Rekke! Del ut 2" pops up.
  - **Full board:** the board jumps, BINGO! is stamped over it, everyone else finishes their drink, and the game ends on "Hva nå?".
  - Under the board, "Hvor nærme er de?" shows a progress stripe per player. "Bytt brett" only works before the first blot.
  - Song titles shrink by their longest word so they always fit the square.
  - **On the TV:** a spinning record, everyone's board as dots (never the songs), who marked last, and a big BINGO! at the end.

## Over eller under and Veddeløpet

- **Over eller under: the pot.** One big card on the table. Whoever has the turn taps OVER or UNDER; the next card flips in from the deck and lands on the pot.
  - **Right:** the pot grows by one sip and the turn moves on by itself. **Wrong or equal:** the pot slides off to that player, who drinks it all, and the pot starts at 1.
  - A stripe under the card shows how many higher and lower cards are left in the deck.
  - **The host's phone** always has OVER/UNDER ("Svarer for Sara") and "Hopp over", so nobody else needs their phone out. Only the host can skip or answer for others.
  - When the deck is empty: "Største pott drukket", then "Hva nå?".
- **Veddeløpet: the racetrack.** Four aces are the horses on a green track. Tap a lane to bet and set the stake with − and +; your head appears in the lane.
  - When everyone has bet there is a 2 s pause, then the race runs itself. The host can also press "Start løpet nå"; anyone who has not bet sits out.
  - **Only the host's phone drives the race:** one card a second, and the server ignores faster or non-host flips. The horse of that suit gallops one step. Side cards flip when every horse has passed them, and that suit steps back.
  - The winner gets a rosette. Winning bets hand out double; the rest drink their stake. Then "Hva nå?".
  - Moves animate from the previous position, since every redraw replaces the elements.

## Skålsprinten

- **The whole surface is the button.** A glass fizzes while everyone waits; there is no countdown.
- **SKÅL!:** the surface turns yellow, a second glass slides in and clinks, and "SKÅL!" fills the screen. The class is set directly on the button at the planned moment (no redraw), so the reaction time is measured on the phone itself.
  - A tap shows your time ("231 ms"). **Too early:** the glass tips over into a puddle, the surface turns pink, and you drink 2.
- **Reveal:** everyone in a list with head and a bar for their time; the slowest turns pink and drinks 1. No tap counts as a loss (drink 1).
- **A sprint is five cheers**, shown as five small glasses that fill up. There is no round number and no "new round" button: after the reveal the next cheers starts by itself.
- **End:** "Raskest i stua" by total time (too early or no tap counts as one second), then "Hva nå?".
- **On the TV:** the glass while waiting, yellow with SKÅL! at the same moment, heads popping up with their time as people tap, and the list afterwards.

## Just the host's phone: the sofa

- **The waiting room is the real stua**, where people can be lifted around. If the host is still alone after a minute, a sheet slides up: "Ingen telefoner oppe?" with "Start med bare min telefon" (and "Vent litt til").
- **The sofa:** the host types the names of the people who are there. Each gets a figure that walks in through the door and sits down on the stua sofa (seats fill from the middle out, up to six). Sofa people live in `data.sofa`, not in the player list, so the regular room games are unaffected. They can be lifted like anyone; dropping someone on the sofa seats them.
- **Pick a game:** "Send rundt" (the phone goes hand to hand) or "Verten leser" (the host reads out loud). One-phone games: Jeg har aldri, Pekeleken, Nødt eller sannhet.
- **Playing:** a big card, the reader rotates (host, then the sofa). The host taps the heads of those who drink (they rise with "Drikk"), then taps the card for the next one; sips are counted per person, also for the sofa. The room stays open: anyone joining later lands straight in the game.

## Skrøna and Bussruta

- **Skrøna: the encyclopedia that lies.** The question sits as an entry on an encyclopedia page (pink margin line, "LEKSIKON · OPPSLAG n" up the margin). Everyone makes up a fake answer; it is typed onto the page in a typewriter face as you write. The app adds the real answer itself and stops anyone who writes the real one.
  - **Picking:** all suggestions stand as numbered meanings; your pick gets a yellow highlighter stroke. You can switch until everyone has picked (then 2 s).
  - **Answer:** fibs are struck through with a red pen, the author's head appears in the margin with a handwritten note (Fraunces italic) saying who it fooled, and the real one is circled in green. Fooled or no pick = drink 1; the author hands out 1 per person fooled.
  - Deliberately no cards or stamps, so it does not look like To sannheter. Five entries per round (five small books), the next comes by itself, then "Beste skrønemaker". "Visste du at …" shows only when an entry has a fact.
- **Bussruta: ticket, pyramid, bus.** A line map shows where you are instead of "round 1 of 3".
  - **The ticket:** four questions on your turn; the cards flip into your fan.
  - **The pyramid** flips by itself: only the host's phone drives it, one card every three seconds (the server ignores faster or non-host flips), then the bus starts. If you have the card, "Du har den! Del ut n".
  - **The bus** drives one stop per safe card and rolls back to the start on a face card or ace. At the finish: "Hva nå?".


## Drinking Yatzy and Pyramiden

Two games that must not look alike, so each gets its own world.

**Drinking Yatzy: the dice cup and the scorecard.** Dice sit on green felt inside a wooden rim, and below them is the familiar Yatzy scorecard written in pencil (Fraunces italic). On your turn you tap the cup. It shakes, and the dice tumble out, but only when a new roll arrives (`nr`). A held die slides up to the dashed «Held» edge. It animates from its previous position through `--fx/--fy`, because the dice are positioned with container-query units (`cqw`). Possible scores show faintly in your column, and tapping one writes the number with a pencil reveal (`clip-path`). Drink notes are taped paper slips: a red ring around a one, red for four of a kind, and yellow plus a hand-drawn «YATZY!» across the felt for Yatzy. After one minute without a move, only the host can scratch a box for whoever is stalling. Players without a phone are played by the host. The TV shows the felt large and the whole scorecard with the active column marked.

**Pyramiden: a poker face in the half-dark.** Dark wine-red felt, brass numerals and a single spotlight on the current card. This is deliberately the opposite of the bright, honest pyramid in Ride the bus. Your cards lie face down. Hold your finger on them to peek; the class is set directly on the hand with no redraw. The host's phone flips one card every ten seconds, and a brass line shows the window (a CSS animation with a negative delay, so it survives redraws). You lay a chosen card face down. The same value is true, anything else is a bluff, and the card leaves your hand. Calling LIAR! flips the card large with a stamp. If it was a bluff, the bluffer drinks double and takes the card back. If it was true, the caller drinks double. When the top card is flipped, the hands are shown and «Biggest bluffer» (bluffs never caught) gets the honour, followed by «What now?».


## Pigs and President

**Pigs: the barn and the snout.** Straw yellow and barn red inside the app's ink outlines. Your four cards lie on a hay bale. The card you pass slides out to the left, and the new one slides in from the right, once per swap (`byttNr`). Heads dip slightly when someone has picked. A big pink snout pulses for everyone when someone has four of a kind. Letters are painted onto the boards one at a time with a `clip-path` reveal. The host's phone drives the clock: 10 s per swap (your leftmost card goes if you haven't picked), 5 s on the nose (anyone who doesn't tap gets a letter), and a 4 s pause before the next round. The first to spell PIGS is the pig. After that comes «What now?».

**President: the staircase.** The app's own colours on purpose: no purple and no serif. A staircase in yellow, mint, blue and lilac sits at the top. Whoever runs out of cards jumps onto their step, and the President gets a crown. Cards are slapped down slightly crooked on the dark table, and the pile is swept off when nobody can go higher. Your hand lies as a fan, and tapping a card lifts it. The button says exactly what you need to play («Velg 2 like over 9», «Legg 2 × 10»). Each turn lasts 20 s, shown as a ring around the head (`@property --p`). After that the host's phone passes for you, or plays your lowest card if you are starting. At the end of the round the Scumbag drinks 3, the Vice Scumbag drinks 2 and the President hands out 3. The next round starts with the Scumbag's best card going to the President.


## Moving on and ending the older games

**Card games.** No game shows «Neste kort» to everyone any more. In the games you play out in real life (Pekeleken, Nødt eller sannhet, ordinary decks and the Regelfabrikken draw), only the host and whoever has the turn (or is next) see the button. Everyone else sees «Kasper eller Sara går videre», so they can put their phones away. The server checks the same thing (`kortVidere`). In the games where everyone answers on their phone (Jeg har aldri, Enten eller, Rygg mot rygg, Kategorier, Låtbekjennelsen), anyone can still move on once the answer is revealed.

**Natural endings.** The games that used to run forever end by themselves. Mest sannsynlig, Løgnhalsen and Saueflokken have one round per player. Hvem skrev is over when every message is revealed. The last button reads «Se kåringen», «Se hvem som lurte flest» or «Avslutt», and then the end screen comes with «Spill igjen» (host only) or the next game. The round numbers are gone from the headings.


## Small fixes after the round of passes

- **Skrøna:** every one of the 75 questions has a short «Visste du at …» line (in `sosial.json` and `sosial.en.json`). On the phone it sits under the answer. On the TV it is a yellow sticky note in the corner of the encyclopedia page, so it always shows, and the list is tighter during the reveal.
- **Drinking Yatzy:** the full scorecard stays. Scratching a box (0 points) means drink 2, and the note says so.
- **Hvem skrev:** everyone can press «Neste melding», guarded against two taps arriving at the same time.
- **Regelfabrikken:** «Stokk på nytt» and «Ny skriverunde» are gone from the draw. They are only on the end screen.


## More games on the sofa (one phone)

The rule is that the host never taps for other people. There are two kinds of game.
- **Read-aloud games** (Jeg har aldri, Pekeleken, Enten eller, Saueflokken, Nødt eller sannhet): the card is read out loud. A large yellow round button, «Les høyt, så tell ned», shows 3 – 2 – 1 and then a stamp: «PEK!», «SI DET!» or «DRIKK!». Under it is the drinking rule, and people take their own drinks. «Neste kort – Sara leser» stays faded until the countdown has finished, but it still works if you want to skip. Enten eller shows the two options as a pink and green card. Nødt eller sannhet has no countdown.
- **Pass-around games** (Kategorier, Ring of Fire): the phone goes from hand to hand. In Kategorier the phone is the bomb. It ticks faster and faster and goes off after 20–50 s, decided on the phone. The app logs that whoever was holding it drinks 2. In Ring of Fire whoever holds the phone draws their own card, a king fills the king's cup, and the fourth king ends the game.
The bench of heads where the host tapped who was drinking is gone.


## Show on TV

- **QR pairing:** /tv (and /no/tv) with no code shows a large QR code and three steps. You open the camera on the host's phone and scan, and the TV joins the room. The TV gets its own 4-character code in the room table (`tvKobling`, 15 min). The QR points to the room page with `?tv=`. The host's phone goes to the room it is in and sends `skjerm-kobl`, and the server puts the room code and PIN on the pairing, which the TV polls for every 2 s. «Got a room code and PIN instead?» stays as a fold-out.
- **«📺 Vis på TV»** is now a quick button for the host in both the lobby and a game. The box shows two ways in. One is «Alle har telefon?», where you open the TV's browser and scan. The other is «Bare din telefon?», where you mirror the phone with AirPlay or Smart View. Sofa mode shows mirroring first.
- **The sofa on its side:** when the phone is in landscape (for mirroring), sofa games fill the screen. The card is on the left and the countdown or bomb plus the button are on the right. The reactions bar and the rest of the page are hidden.


## The figures come alive

Everything happens in the existing living room (`src/klient/stua.js`), on every phone and on the TV. A move is a class on `<g class="figur">` that CSS in `stua.css` plays once. The body sits in two layers, `.beveg` for moves and `.pust` for breathing, under the `.kropp` group that the JS positions. Arms, raised hands, a glass, and alternate eyes and mouths are drawn in every figure and hidden until a class shows them.

- **Always on:** everyone breathes (3.6 s) and blinks in their own rhythm (`--d` per figure). Pupils look at whoever just reacted.
- **Ten reactions:** the five from before plus 😍 🤢 🥴 🙈 🤘, behind a «+» in the reaction row (the + swaps the set so the bar stays one row). Each one becomes a move with a face: toast, laugh, jump, startle, clap, hearts, green, dizzy, hide, headbang. Cheers, laughter and applause spread: the others do the same 90 ms apart. One reaction per person every 2 s.
- **Your move:** tapping yourself in the room sends `beveg`. Wave is free for everyone. The others (dance, bow, spin, air guitar, moonwalk) are unlocked like the outfit, in «Figuren din» under the new Moves tab, and the server only accepts the one on your account.
- **The game drives the face:** `stuaHendelse` on the server (`drikk` from giSlurker, `bom` from the sofa bomb). Drinking means a sip with full cheeks and one other laughs. The bomb means everyone turns with an o-mouth.
- **The podium:** when the night ends, the winner (or whoever got away with the fewest sips) jumps onto the table with a crown and dances, the thirstiest faints with stars, the rest clap. The TV plays a drum roll and applause.
- **Disco:** two people dancing within three seconds lowers a disco ball and the whole room dances.
- **Idle habits:** every 20–40 s a figure yawns, checks their phone, scratches their head or hums. Two minutes with nothing happening, and everyone yawns.
- **Reduced motion:** no moves, only the emoji bubble; the crown still shows.

## No game waits for one phone

The clocks in the timed games (Veddeløpet, Pyramiden, Gris, President, Bussruta) used to run only from the host's phone. If the host put it in a pocket, the whole room froze. Now every awake phone drives the clock: the host first, the others 1.5 s later, and the server validates the time so nothing fires twice. The host can also act for whoever has the turn (Yatzy, Bussruta, Opus, Løgnhalsen, and «Pass for X» in President), which is the one case where the host moves another player – when a phone has gone dark.

## First time hosting

A yellow card sits in the host lobby the first time someone hosts on a phone: three rows that are easy to miss otherwise – getting the room on the TV, playing with only one phone (the sofa), and the figure in the room. Each row is a button that opens the matching sheet. «Skjønner» closes it for good (`bd_vert_intro` in localStorage). Hard shadows, ink border, Archivo condensed heading: the same language as the rest of the app, with the yellow accent so it reads as a nudge rather than a warning.

## Sofa sounds

The one-phone games are played with the phone on the table, so sound carries the timing. The 3 – 2 – 1 countdown in the read-aloud games steps down in pitch from 3 to 1 and ends in a short, bright «NÅ!» so everyone answers together without looking at the screen. The bomb in Kategorier ticks like a clock in step with its pulse (slow, faster, fastest) and ends in a deep boom instead of a bell. All of it is synthesised in the browser like the other room sounds and follows the same sound toggle.

## Decks that warm up, and cards with names on

Two things the best party games do, now in the decks. In mixed mode («Blandet») a round no longer comes in random order: it starts with the mild cards and gets spicier towards the end, with enough random overlap that it never feels sorted. Nobody gets the heaviest card before the first sip. Picking a level still gives only that level.

In Nødt eller sannhet, «personen til venstre» becomes a name from the room – «Lag et dikt om Sara» lands harder than a card about a neighbour, and on phones there is no obvious left. Left, right and opposite become three different people when there are enough players, never the person in the chair. The original text is kept on the card so it still counts as seen.

## Fuck the Dealer

The phone is the deck, and only the dealer holds it. Whoever wants to guesses out loud; the dealer taps the value on an ace-to-king keypad with hard shadows. A miss turns the keypad into a yellow «Si høyt: HØYERE» card and greys out the impossible half. When the card is decided it flips for everyone on a dark panel: mint for a hit (the dealer drinks the card's value, or half of it rounded up on the second try), orange for a double miss (the guesser drinks the distance). Three misses in a row pass the deck to the next player; a hit resets the three dots that sit in the corner of every screen.

The tally board is the game's own piece: thirteen columns of four slots, filled as cards are used, a column turning orange when a value is out. It sits small under the dealer's keypad, large on the other phones, and fills the TV. Cream and ink with mint as the game's accent, so it reads as its own table next to Pyramiden's felt and Bussruta's bus.

## Game images

`scripts/lag-lekebilder.mjs` draws all 63 game images and the 10 shared motifs as small sticker scenes: the same vector stickers as the room (`src/lib/klistremerker.js`), plus scene-only shapes defined in the script (cards in four suits, dice, cups, beer, bottles, phones, speech bubbles, people, faces, ball, microphone, controller, flags and more). In scenes the ink stroke is thinned to 2.4 (the room stickers keep 3.5) so fills stay visible at 240 px; each sticker gets a hard 3 px offset shadow and a slight tilt, and each game has its own colour field (mint, pink, blue, paper, peach or lilac) with a few sparkles. Scenes are a row of stickers, bottom-aligned and centred; wide scenes scale down to fit. Run `node scripts/lag-lekebilder.mjs` after changing it, and bump the service worker cache.

Holding a game card or sticker (`:active` on `.lk-kort`, `.lk-rad`, `.rom-lek`, `.st-lek`, `.lek-banner`, the related-game rows) makes each sticker move in its own way until the finger lifts: beer bubbles rise and foam swells, dice tumble, cups and bottles tip, stars and sparkles twinkle, the wheel spins, the fish swims, the sheep hop, the Pinocchio nose grows, phones buzz, flags wave, the mole peeks, hearts beat; anything else bobs gently. Game images are inlined as SVG (`lekebilde()` in `src/lib/illustrasjon.ts`) so the page's CSS reaches them; every sticker carries `data-a="<name>"` and moving parts carry `a-*` classes (`stua.css`, section HOLD INNE).

## Not yet migrated

Some less used in-room screens (Vorsbørsen, the wheel, card games like Bussruta and Yatzy) inherit the tokens but have not been reviewed one by one.
