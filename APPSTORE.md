# mittvors i App Store

iPhone-appen er nettsiden pakket inn i Capacitor. Sidene (leker, regler, rommet, figuren, kontoen) ligger i selve
app-pakken og åpner øyeblikkelig, også uten nett. Rommet, kontoen og Pluss snakker med serveren på mittvors.no via
API-et (`/api/…`), som slipper appen inn (CORS i `src/middleware.ts`). Appen skrur på vibrering, delingsark, statuslinje
og AirPlay (`src/klient/app.js`).

Bygg: `npm run build:app` (scripts/bygg-app.mjs) kjører Astro med `MV_APP=1` og legger filene i `app-www/`, som
Capacitor pakker inn. GitHub gjør dette av seg selv i `.github/workflows/ios.yml`, og henter Supabase-adressene fra
`https://www.mittvors.no/api/oppsett`. **Innholdsendringer i leker og regler krever derfor ny appversjon**
(Actions → «iPhone-app til TestFlight» → Run workflow). Rommet og alt som bor på serveren oppdateres uten.

Appen har sitt eget skall: ingen sidemeny, topplinje eller bunntekst, men tre faner nederst (`.app-tabbar` i
`src/layouts/Base.astro`): **Spill** (rommet – lag, bli med, spill), **Leker** (reglene) og **Deg** (figur og konto).
Appen starter rett i rommet (`/no/rom?app=1`). Skallet velges før siden tegnes: Capacitor legger «mittvors-app» i user
agent, og `html.is-app` styrer CSS-en (nederst i `src/styles/global.css`). Fanelinja er borte under en lek.

Veien til godkjenning (Apple-regel 4.2, «minimum functionality», avviser rene nettside-apper):
1. ✅ Eget app-skall med fanelinje.
2. ✅ Sidene pakket inn i appen (Astro bygger, Capacitor legger filene i app-pakken).
3. ✅ Leker og regler virker uten nett. Rommet trenger nett (telefonene snakker via serveren).
4. Pluss som kjøp gjennom Apple (StoreKit). Vipps vises aldri i appen.
5. Push når rommet venter på deg.

Filene:

| Fil | Hva |
|---|---|
| `capacitor.config.json` | App-ID `no.mittvors.app`, navn, adressen appen laster |
| `scripts/bygg-app.mjs` | Bygger sidene inn i `app-www/` (ikke i git) |
| `src/pages/api/oppsett.ts` | Supabase-adresse og offentlig nøkkel, som appen bygges med |
| `ios/App/App/TvSkjerm.swift` | AirPlay-skjermen, og `MittvorsRuter` som finner `no/rom/index.html` i pakken |
| `ios/` | Xcode-prosjektet. Ikoner og oppstartsbilde ligger i `ios/App/App/Assets.xcassets` |
| `ios/App/App/App.entitlements` | Lenker som åpner appen (associated domains) og push |
| `public/.well-known/apple-app-site-association` | Forteller iPhone at mittvors.no-lenker tilhører appen |
| `scripts/lag-app-ikoner.mjs` | Lager `assets/icon.png` og `assets/splash.png` fra `public/favicon.svg` |
| `.github/workflows/ios.yml` | Bygger appen på GitHub sine Mac-er og sender den til TestFlight |
| `APPSTORE.md` | Denne lista |

Regenerer ikonene slik: `node scripts/lag-app-ikoner.mjs && npx @capacitor/assets generate --ios`

Nøkler og ID-er:

- Team ID: `685JC7R3PQ`
- Bundle ID: `no.mittvors.app`
- Apple ID på appen i App Store Connect: `6822843955`
- Signeringsnøkkel (ikke i repoet): `C:\Users\jonas\Documents\mittvors-app-nokler\sertifikat-nokkel.pem`

## Gjort

- [x] App-ID registrert med Associated Domains og Push Notifications
- [x] Appen opprettet i App Store Connect

## Det som gjenstår

Alt gjøres i nettleseren. Du trenger ikke Mac.

### 1. API-nøkkel (lar GitHub laste opp til Apple for deg)

1. App Store Connect → **Users and Access** → fanen **Integrations** → **App Store Connect API**.
   Første gang: **Request Access** → godta.
2. **+** (Generate API Key). Name `GitHub`, Access **App Manager** → Generate.
3. **Download API Key** – `.p8`-fila kan bare lastes ned én gang. Noter **Issuer ID** (øverst på siden) og
   **Key ID** (i raden til nøkkelen).

### 2. GitHub Actions (bygger appen og sender den til TestFlight)

Repoet er åpent, så GitHub sine Mac-maskiner er gratis uten kvote.

1. Gå til https://github.com/Bw0om/banterdeck/settings/secrets/actions → **New repository secret**, fire ganger:

   | Name | Secret |
   |---|---|
   | `APP_STORE_CONNECT_ISSUER_ID` | Issuer ID fra steg 1 |
   | `APP_STORE_CONNECT_KEY_IDENTIFIER` | Key ID fra steg 1 |
   | `APP_STORE_CONNECT_PRIVATE_KEY` | hele innholdet i `.p8`-fila (åpne i Notepad, Ctrl+A, Ctrl+C) |
   | `CERTIFICATE_PRIVATE_KEY` | hele innholdet i `sertifikat-nokkel.pem` (samme måte) |

2. https://github.com/Bw0om/banterdeck/actions → **iPhone-app til TestFlight** → **Run workflow** → **Run workflow**.
   Første bygg tar 15–25 minutter. Grønt = appen ligger i TestFlight.
3. Installer **TestFlight** fra App Store på iPhonen. App Store Connect → appen → **TestFlight** → Internal Testing
   → **+** → gruppe «Vi» → legg til deg selv. Åpne invitasjonen på telefonen.

Hver gang `main` får endringer i `ios/` eller app-skallet, bygges appen på nytt av seg selv. Nettsiden oppdaterer
seg uansett, uten nytt bygg.

### 3. Skjermbilder og tekst

Skjermbilder lages fra nettsiden i iPhone-størrelse. Si fra, så lager jeg dem (6,9" og 6,5"):
rommet, stua, en lek, poengtavla, Pluss.

Tekst til App Store (kan limes rett inn):

- **Navn:** mittvors
- **Undertittel:** Drikkeleker og vorsmoro
- **Kategori:** Entertainment (sekundær: Games → Party)
- **Aldersgrense:** 17+ (Alcohol, Tobacco, or Drug Use or References: Frequent/Intense)
- **Personvern:** Data used to track you: No. Data linked to you: Contact info (e-post, bare ved konto).
- **Prisnivå:** gratis

### 4. Før innsending

- **Demo-konto til Apple:** App Review → Sign-in required → lag en egen testkonto og skriv den inn.
  Skriv i Notes: «Create a room on one phone and join it with the code on another. Pluss is free the first night.»
- **Pluss i appen:** Vipps-kjøp vises ikke inne i appen (Apple krever at kjøp i appen går gjennom Apple).
  Gratis-kvelden virker. Kjøp gjennom Apple (In-App Purchase) er neste steg etter at appen er godkjent.
- **Alkohol:** vannrunden og alkoholfri modus er med i appen. Nevn dem i Notes til Apple.
- **Trader status (EU):** bare nødvendig om appen skal kunne lastes ned i EU-land. Norge trenger det ikke.

### Neste steg etter godkjenning

1. Pluss som kjøp gjennom Apple (StoreKit).
2. Varsler på iPhone (push) når rommet venter på deg.
3. Android (Google Play, 25 dollar én gang) – Capacitor gjør det med `npx cap add android`.
