# Banterdeck – nettsiden

Statisk nettside bygget med [Astro](https://astro.build). Gratis å hoste. Alt innhold ligger i én fil du redigerer selv.

## Hva ligger hvor

| Sti | Hva |
|---|---|
| `src/data/content.json` | **Alt innholdet.** Replikker, ordbok, Fleksnes, drikkeleker. Rediger denne. |
| `src/config.ts` | Sidenavn, slagord, AdSense-ID, kontakt-e-post. |
| `astro.config.mjs` | Domenet ditt (`site:`). Bytt når du har kjøpt domene. |
| `public/app/index.html` | Selve appen (den du hadde fra før). Ligger på `/app/`. |
| `public/app/felles.json` | Felles tillegg som appen publiserer via GitHub-tokenen. |
| `src/pages/` | Sidene: forside, `kategori/[id]`, `drikkeleker/[slug]`, om, personvern. |
| `src/styles/global.css` | Utseendet. Farger og fonter øverst under `:root`. |

## Kjøre lokalt (valgfritt)

1. Installer [Node.js](https://nodejs.org) (LTS).
2. I mappa: `npm install` (én gang), deretter `npm run dev`.
3. Åpne `http://localhost:4321`.

Du trenger ikke dette for å publisere – Vercel bygger for deg.

## Publisere (gratis) – anbefalt: Vercel

1. Legg hele mappa i et GitHub-repo (kan gjerne være det du allerede har – slett bare den gamle `index.html` i rota først).
2. Gå til [vercel.com](https://vercel.com) → logg inn med GitHub → **Add New → Project** → velg repoet → **Deploy**. Vercel gjenkjenner Astro automatisk.
3. Du får en adresse som `banterdeck.vercel.app`. Hver gang du endrer noe på GitHub bygges siden på nytt automatisk (ca. 30 sek).

**Cloudflare Pages** fungerer identisk hvis du foretrekker det.

**GitHub Pages passer ikke lenger:** siden har en serverfunksjon (`/api/forslag`), og den kjører ikke på Pages. Bruk Vercel eller Cloudflare Pages. Har du en gammel workflow i `.github/workflows/`, slett den – ellers bygger den feil filer ved siden av.

## Eget domene

1. Kjøp domene (Domeneshop for `.no`, ca. 150–300 kr/år).
2. I Vercel: prosjektet → **Settings → Domains** → legg til domenet. Vercel viser hvilke DNS-oppføringer du skal sette hos Domeneshop.
3. Bytt `site:` i `astro.config.mjs` og adressen i `public/robots.txt` til det nye domenet. HTTPS kommer av seg selv.

## Redigere innhold

Åpne `src/data/content.json` rett på GitHub (blyant-ikonet) eller lokalt. Strukturen:

```
seksjon  →  groups  →  items
```

En vanlig replikk:
```json
{"ctx":"Når noen kommer for sent","line":"God ettermiddag!","note":"Valgfri kommentar",
 "sv":{"c":"...","l":"..."},"en":{"c":"...","l":"..."}}
```
`sv` og `en` brukes bare av appen (nettsiden er norsk). Du kan utelate dem.

Et ord i ordboka: `{"word":"snurt","def":"Lettere fornærmet."}`

En drikkelek (i seksjonen `spill`):
```json
{"name":{"no":"Navn"},"gear":{"no":"Kortstokk"},"pl":"3+",
 "rules":{"no":["Første avsnitt.","b|Et punkt.","b|Et punkt til.","Siste avsnitt."]}}
```
Linjer som starter med `b|` blir punkter. Lagre → GitHub → Vercel bygger automatisk.

Merk en replikk som grov ved å skrive «Grov» i `note` – da holdes den utenfor «Dagens replikk» på forsiden.

## Reklame

Søk om Google AdSense når siden har eget domene og litt innhold/trafikk. Når du er godkjent: lim inn `ca-pub-…` og slot-ID i `src/config.ts`. Annonseplassene ligger allerede på forsiden, kategorisidene og leksidene, og personvernsiden oppdaterer seg selv. Husk at AdSense krever samtykkebanner i EØS – Google tilbyr sitt eget under «Privacy & messaging» i AdSense-kontoen.

## Appen og felles-synk

Appen på `/app/` fungerer som før: favoritter, egne tillegg, PIN-lås og synk-lenke. «Publiser til alle» skriver nå til `public/app/felles.json` i repoet – bruk `brukernavn/repo` som før. Etter publisering bygger Vercel siden på nytt, og alle får tilleggene.

## Admin-panel: legg til innhold uten å kode

Gå til `/admin` på siden din. Lim inn repo (`brukernavn/repo`) og GitHub-tokenen din – den lagres kun i din egen nettleser, aldri på serveren.

**Fanen «Innhold»:** velg seksjon og gruppe, og legg til, endre eller slett oppføringer. Skjemaet tilpasser seg: replikk (kontekst/replikk/kommentar), ordbok (ord/betydning) eller drikkelek (navn/utstyr/spillere/regler – én linje per avsnitt, `b|` foran gir punkt).

**Fanen «Forslag»:** viser innsendte forslag fra `/forslag`. «Godta» åpner forslaget i skjemaet og hopper til gruppa avsenderen valgte; «Avvis» legger det til side. Begge deler tar effekt når du trykker **Publiser endringer** – da lagres `content.json` til GitHub og forslagene lukkes. Vercel bygger automatisk, og alt er live etter ca. ett minutt.

Skriver du «Grov» i kommentarfeltet, holdes replikken utenfor «Dagens replikk» på forsiden.

## Forslagsskjemaet – oppsett i Vercel

`/forslag` sender til en liten serverfunksjon som oppretter et GitHub-issue med merkelappen `forslag`. Den trenger to miljøvariabler:

1. Vercel → prosjektet → **Settings → Environment Variables**
2. Legg til:
   - `GITHUB_TOKEN` – fine-grained token med **Issues: read & write** (og gjerne Contents: read & write) på repoet
   - `GITHUB_REPO` – f.eks. `Bw0om/lommearsenal`
3. Velg alle tre miljøene (Production, Preview, Development) → Save → **Redeploy**

Denne tokenen ligger kun på serveren og er aldri synlig i nettleseren. Du får e-post fra GitHub for hvert nye issue.

## Språk: engelsk i bunn, norsk på /no

- Engelsk ligger på rota: `/`, `/categories/fest`, `/drinking-games/ring-of-fire`
- Norsk ligger under `/no/`: `/no/`, `/no/categories/fest`, `/no/drinking-games/ring-of-fire`
- Språkknappen i menyen bytter mellom *samme* side på det andre språket
- Norske nettlesere får et lite banner nederst med tilbud om norsk – de tvinges ikke
- `hreflang`-koder forteller Google at sidene hører sammen

Teksten på selve sidene ligger i `src/lib/i18n.ts` (én blokk for `en`, én for `no`). Replikkene henter engelsk fra `en`-feltet i `content.json` og faller tilbake til norsk hvis oversettelsen mangler.

Appen på `/app/` starter nå også på engelsk, med NO/SV/EN-knappen i toppen.

## Kontoer (valgfritt – gratis via Supabase)

Uten oppsett viser `/account` bare en melding om at kontoer ikke er slått på. Slik skrur du det på:

1. Lag gratis konto på [supabase.com](https://supabase.com) → **New project**
2. I prosjektet: **SQL Editor** → kjør denne:

```sql
create table public.decks (
  user_id uuid primary key references auth.users on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);
alter table public.decks enable row level security;
create policy "egne rader" on public.decks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

3. **Project Settings → API**: kopier `Project URL` og `anon public`-nøkkelen
4. **Authentication → URL Configuration**: legg til `https://banterdeck.com/account` og `https://banterdeck.com/no/account` under Redirect URLs
5. I Vercel → **Settings → Environment Variables**: `SUPABASE_URL` og `SUPABASE_ANON_KEY`.
   Bruker du Vercels Supabase-integrasjon, lages disse automatisk og du trenger ikke gjøre noe.
   Koden godtar også `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` og `PUBLIC_`-variantene.
6. Redeploy

**Aldri** bruk `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_SECRET_KEY`, `SUPABASE_JWT_SECRET` eller `POSTGRES_*` her. De omgår radsikkerheten og gir full tilgang til databasen.

Innlogging skjer med e-postlenke – ingen passord å glemme. `anon`-nøkkelen er ment å være offentlig; det er radsikkerheten (RLS) over som gjør at ingen ser andres data.

## Enhetsgjenkjenning

Et lite skript legger klasser på `<html>`: `is-ios`, `is-android`, `is-mobile`, `is-desktop`, `is-standalone`. CSS-klassene `.ios-only`, `.android-only`, `.desktop-only` og `.standalone-only` viser riktig installasjonsveiledning på forsiden – iPhone får Safari-stegene, Android får Chrome-stegene, PC får beskjed om å åpne siden på telefonen, og har du allerede installert appen, forsvinner hele seksjonen.

## Én ting, ikke to

Appen og nettsiden er slått sammen. `/app/` sender nå videre til forsiden, og alt appen kunne finnes i selve siden:

- **Søk** – knapp i menyen (⌘K / Ctrl+K på PC, forstørrelsesglass på mobil). Søker i replikker, ord og leker på valgt språk.
- **Terning** – den runde knappen nede til høyre trekker en tilfeldig replikk.
- **Favoritter** – stjerna på hvert kort, samlet på `/favourites`.
- **Offline** – en service worker (`public/sw.js`) lagrer sidene du har besøkt.
- **Installerbar** – `public/manifest.webmanifest` gjør at «Legg til på Hjem-skjerm» oppfører seg som en app.

Favoritter og egne replikker fra den gamle appen overføres automatisk første gang noen åpner siden i samme nettleser.

### Tre toppnivå

Forsiden deler innholdet i tre, i stedet for én lang liste med kategorier:

1. **Replikker** (`/situations`) → velg situasjon → kategorisiden
2. **Ordbok** (`/dictionary`) → alfabetisk, med eget filterfelt
3. **Drikkeleker** (`/drinking-games`) → regler per lek

Ordboka er ikke lenger en kategori under replikker. Vil du legge til flere toppnivå senere (f.eks. «Annet»), lag en ny seksjon i `content.json` og et kort til i `src/components/pages/Home.astro`.

### Ikoner

`public/icon-192.png` og `icon-512.png` er enkle plassholdere. Bytt dem gjerne med en ordentlig logo i samme størrelser – filnavnene må være like.
