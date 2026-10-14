# mittvors i App Store

iPhone-appen er et tynt skall (Capacitor) rundt mittvors.no. Alt innhold lastes fra nettsiden, så appen er alltid like
ny som siden. Nettsiden kjenner igjen appen og skrur på vibrering, delingsark og statuslinje (`src/klient/app.js`).

Filene:

| Fil | Hva |
|---|---|
| `capacitor.config.json` | App-ID `no.mittvors.app`, navn, adressen appen laster |
| `app-shell/index.html` | Det eneste som ligger inni appen: «Ingen nett»-siden |
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
