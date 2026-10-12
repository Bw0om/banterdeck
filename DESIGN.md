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

## Game images

`scripts/lag-lekebilder.mjs` draws all 63 game images and the 10 shared motifs as small sticker scenes: the same vector stickers as the room (`src/lib/klistremerker.js`), plus scene-only shapes defined in the script (cards in four suits, dice, cups, beer, bottles, phones, speech bubbles, people, faces, ball, microphone, controller, flags and more). In scenes the ink stroke is thinned to 2.4 (the room stickers keep 3.5) so fills stay visible at 240 px; each sticker gets a hard 3 px offset shadow and a slight tilt, and each game has its own colour field (mint, pink, blue, paper, peach or lilac) with a few sparkles. Scenes are a row of stickers, bottom-aligned and centred; wide scenes scale down to fit. Run `node scripts/lag-lekebilder.mjs` after changing it, and bump the service worker cache.

Holding a game card or sticker (`:active` on `.lk-kort`, `.lk-rad`, `.rom-lek`, `.st-lek`, `.lek-banner`, the related-game rows) makes each sticker move in its own way until the finger lifts: beer bubbles rise and foam swells, dice tumble, cups and bottles tip, stars and sparkles twinkle, the wheel spins, the fish swims, the sheep hop, the Pinocchio nose grows, phones buzz, flags wave, the mole peeks, hearts beat; anything else bobs gently. Game images are inlined as SVG (`lekebilde()` in `src/lib/illustrasjon.ts`) so the page's CSS reaches them; every sticker carries `data-a="<name>"` and moving parts carry `a-*` classes (`stua.css`, section HOLD INNE).

## Not yet migrated

Some less used in-room screens (Vorsbørsen, the wheel, card games like Bussruta and Yatzy) inherit the tokens but have not been reviewed one by one.
