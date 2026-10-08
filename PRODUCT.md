# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

Installable PWA (`public/manifest.webmanifest`, service worker `public/sw.js`). Mobile web is the main context, plus a big-screen TV view (`/tv`).

## Users

Groups of adults (18+) at a *vors*, the Norwegian pre-party, playing together in the same room. Someone acts as host and runs the night in one of two ways:

- **Shared TV:** the host puts the big-screen view on the TV. Everyone follows the game there and votes or answers on their own phone.
- **Phone-to-phone:** the host invites everyone at the vors into a room, and each person joins and plays on their own phone. Players can also belong to persistent crews (*gjenger*) that keep score from night to night.

The host makes the decisions and the rest of the group joins. Joining has to be instant for people who have never seen the site, are mid-conversation and have probably been drinking.

## Product Purpose

Mitt vors runs the games at the pre-party. You pick a game, and everyone plays it from their own phone, with the TV showing it to the room when there is one. Success means a group starts a game within seconds and keeps playing all night, then comes back on later nights as a crew.

## Positioning

Phone-to-phone live play is the core: rooms, the TV view, crews, the weekly Nyhetsrunden quiz and the Pluss game packs. The reference content (game rules, comebacks/*replikker*, the slang dictionary *Ord & uttrykk*) supports the core. It brings in search traffic and helps mid-game, but future surfaces should put live play first.

## Operating Context

- A social, noisy, often dim room. Phones are passed around, glanced at and used one-handed. The TV is viewed from across the room.
- Joining works by room code, link or QR code on the TV. Players join without an account. A crew link shows the crew's score table without login.
- Recurring rituals are the weekly Nyhetsrunden (a news quiz released each week, with push notification when it's out), Vorsprøven / Nasjonal vorsprøve, seasonal packs (e.g. julebord) and end-of-night awards (*Kveldens kåringer*).

## Capabilities and Constraints

- **Stack:** Astro 5 on Vercel with serverless functions under `src/pages/api`. Content lives in `src/data/*.json`, with `content.json` as the main source and editable via `/admin` through the GitHub API. Optional Supabase handles accounts (magic-link login) and the error log.
- **Languages:** English is served at the root and Norwegian under `/no/`, with Swedish partially present in content. UI copy lives in `src/lib/i18n.ts`. Some content is single-language only (`"only": "no" | "en"`).
- **Features:** live rooms, TV/big-screen mode, crews, a game finder, evening plan (`/plan`), deck builder, favourites, search (⌘K), random-line die, offline rules, web push, suggestion submission (creates GitHub issues), admin panel and automatic error capture.
- **Monetisation:** Pluss game packs sold via Vipps at 29 kr per night or 199 kr per year. Sales terms, receipt, pricing and privacy pages must stay reachable for Vipps review. AdSense slots exist but are disabled until approval.
- **Age gate:** 18+ confirmation is stored in localStorage. The copy says *"Drikk med vett – og aldri kjør etterpå."*
- **Pre-launch lock:** the site is currently behind a development lock (`UTVIKLING.paa` in `src/config.ts`).
- **Legacy redirects:** old Norwegian URLs (`/kategori`, `/drikkeleker`, `/forslag`, `/om`, `/personvern`, `/app/`) must keep redirecting.
- **Leftover copy:** `heroTitle` / `heroSub` in `src/lib/i18n.ts` (*"Aldri stå tom for svar igjen"*) are no longer rendered. The live homepage hero leads with rooms (*"Klar for vors?"*).

## Brand Commitments

- **Name:** **Mitt vors** (domain mittvors.no). "banterdeck" is a legacy repo and asset name, not the brand.
- **Paid tier:** **mittvors pluss** (one word, lowercase, also in English); short form **Pluss** in both languages. Never "Mitt vors Plus".
- **Look:** "champagnenatt" (`src/styles/champagne.css`, on top of `natt.css`): wine-black night, champagne gold for now/on/primary, Campari red for press/drink, Fraunces serif headlines. Elegant, but still a party.
- **Voice:** cheeky and Norwegian-native (*"Frekk, men morsom – det er hele regelen"*). Humour comes from recognisable everyday situations (office life, family, the crew), not shock. Content marked *Grov* stays out of featured spots like *Dagens replikk*.
- **Seller of record:** Flaten Kapital, org.nr 931976532 (see `SELGER` in `src/config.ts`).

## Evidence on Hand

- Real content: drinking games with full rules, comebacks sorted by situation, a slang dictionary, Pluss packs (`src/data/pluss*.json`), Nyhetsrunden issues (`src/data/nyhetsrunden/`), bingo and duel decks.
- Assets: per-game illustrations (`public/illustrasjoner/`), OG images (`public/og/`), app icons and favicons. `icon-192/512.png` are noted as placeholders.
- Early UI captures are in `Bilder/`.
- There are no testimonials, user counts, press or ratings. Future work must not invent them.

## Product Principles

1. **Seconds to the first round.** Every step between "let's play" and the first card is a cost paid in front of an impatient group.
2. **Built for the room.** Design for distance (TV), distraction (noise, conversation) and impaired attention. Clarity beats cleverness.
3. **The host leads, everyone plays.** Give the host control and give guests a no-account, no-explanation way in.
4. **Cheeky, never cruel.** Keep the humour sharp and inclusive, and drinking responsible.
5. **Reference serves play.** Rules, comebacks and the dictionary earn their place by feeding people into games and helping during them.

## Accessibility & Inclusion

- Adults only (18+ gate), with responsible-drinking messaging kept in place. Alcohol-free mode is supported (`src/components/Alkoholfri.astro`). Sips become penalty points and "drink" becomes "take a penalty". A player can turn it on for themselves, or the host can turn it on for the whole room. Game logic and scoring stay the same.
- Readability in low light and at TV distance is a functional requirement, not a polish item.
