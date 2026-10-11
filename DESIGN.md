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

## Game images

`scripts/lag-lekebilder.mjs` draws all 63 game images and the 10 shared motifs as small sticker scenes: the same vector stickers as the room (`src/lib/klistremerker.js`), plus scene-only shapes defined in the script (cards in four suits, dice, cups, beer, bottles, phones, speech bubbles, people, faces, ball, microphone, controller, flags and more). In scenes the ink stroke is thinned to 2.4 (the room stickers keep 3.5) so fills stay visible at 240 px; each sticker gets a hard 3 px offset shadow and a slight tilt, and each game has its own colour field (mint, pink, blue, paper, peach or lilac) with a few sparkles. Scenes are a row of stickers, bottom-aligned and centred; wide scenes scale down to fit. Run `node scripts/lag-lekebilder.mjs` after changing it, and bump the service worker cache.

Holding a game card or sticker (`:active` on `.lk-kort`, `.lk-rad`, `.rom-lek`, `.st-lek`, `.lek-banner`, the related-game rows) makes each sticker move in its own way until the finger lifts: beer bubbles rise and foam swells, dice tumble, cups and bottles tip, stars and sparkles twinkle, the wheel spins, the fish swims, the sheep hop, the Pinocchio nose grows, phones buzz, flags wave, the mole peeks, hearts beat; anything else bobs gently. Game images are inlined as SVG (`lekebilde()` in `src/lib/illustrasjon.ts`) so the page's CSS reaches them; every sticker carries `data-a="<name>"` and moving parts carry `a-*` classes (`stua.css`, section HOLD INNE).

## Not yet migrated

Some less used in-room screens (Vorsbørsen, the wheel, card games like Bussruta and Yatzy) inherit the tokens but have not been reviewed one by one.
