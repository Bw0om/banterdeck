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

**GitHub Pages** går også: `.github/workflows/deploy.yml` ligger klar, men da må Settings → Pages → Source stå på «GitHub Actions».

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
