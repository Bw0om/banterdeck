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

## Game images

`scripts/lag-pikselbilder.py` draws all 63 game images and the 10 shared motifs as pixel art in the stua style: big square pixels (6 px, smaller only when a scene is wide), a one-pixel ink outline around every figure, flat stua colours, a hard one-pixel ink shadow and one colour field per game (mint, pink, blue, paper, peach or lilac). Each game is composed from a small sprite library (cards, dice, cups, beer, bottles, phones, faces, animals, speech bubbles …) so every game has its own scene. Run `python scripts/lag-pikselbilder.py` after changing it, and bump the service worker cache. The in-room game symbols are the vector stickers in `src/lib/klistremerker.ts`, not these images.

## Not yet migrated

Some less used in-room screens (Vorsbørsen, the wheel, card games like Bussruta and Yatzy) inherit the tokens but have not been reviewed one by one.
