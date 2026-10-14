# mittvors i App Store

iPhone-appen er et tynt skall (Capacitor) rundt mittvors.no. Alt innhold lastes fra nettsiden, så appen er alltid like
ny som siden. Nettsiden kjenner igjen appen og skrur på vibrering, delingsark og statuslinje (`src/klient/app.js`).

Filene:

| Fil | Hva |
|---|---|
| `capacitor.config.json` | App-ID `no.mittvors.app`, navn, adressen appen laster |
| `app-shell/index.html` | Det eneste som ligger inni appen: «Ingen nett»-siden |
| `ios/` | Xcode-prosjektet. Ikoner og oppstartsbilde ligger i `ios/App/App/Assets.xcassets` |
| `scripts/lag-app-ikoner.mjs` | Lager `assets/icon.png` og `assets/splash.png` fra `public/favicon.svg` |
| `codemagic.yaml` | Bygger appen i skyen og sender den til TestFlight |
| `APPSTORE.md` | Denne lista |

Regenerer ikonene slik: `node scripts/lag-app-ikoner.mjs && npx @capacitor/assets generate --ios`

## Når Apple-kontoen er klar

Alt under gjøres i nettleseren. Du trenger ikke Mac.

### 1. App Store Connect – appen

1. Gå til [developer.apple.com/account/resources/identifiers](https://developer.apple.com/account/resources/identifiers) → **+** → App IDs → App.
   Beskrivelse «mittvors», Bundle ID **Explicit**: `no.mittvors.app`. Huk av **Associated Domains** og **Push Notifications**. Register.
2. Gå til [appstoreconnect.apple.com/apps](https://appstoreconnect.apple.com/apps) → **+** → New App.
   Platform iOS, navn **mittvors**, primærspråk Norwegian (Bokmål), Bundle ID `no.mittvors.app`, SKU `mittvors`.
3. Apple ID på appen er `6822843955` (ligger i `codemagic.yaml`).
4. Team ID er `685JC7R3PQ`. Den ligger i `public/.well-known/apple-app-site-association` og `ios/App/App/App.entitlements`,
   slik at mittvors-lenker åpner appen.

### 2. Xcode Cloud (bygger appen og sender den til TestFlight)

Apples egen byggetjeneste, inkludert i utviklerkontoen (25 timer i måneden). Ingen Mac, ingen sertifikater.
Skriptet `ios/App/ci_scripts/ci_post_clone.sh` installerer Node og kopierer app-skallet inn før bygget.

1. App Store Connect → appen **mittvors** → fanen **Xcode Cloud** → **Get Started**.
2. Koble til **GitHub** og velg `Bw0om/banterdeck`. (Apple ber deg installere Xcode Cloud-appen på GitHub – godta.)
3. Velg prosjektet **ios/App/App.xcworkspace**, scheme **App**.
4. Workflow: start med den foreslåtte. Pass på at **Start Conditions** er gren `main`, og at **Post-Actions** har
   **TestFlight Internal Testing**. Lagre.
5. Trykk **Start Build**. Første bygg tar 15–25 minutter. Loggen ligger under Xcode Cloud → Builds.
6. Bygget havner i **TestFlight**. Installer TestFlight-appen på iPhonen, legg deg til under
   TestFlight → Internal Testing → **+** gruppe → legg til deg selv, og åpne invitasjonen på telefonen.

Hver gang `main` får nye endringer i `ios/`, bygger Xcode Cloud automatisk. Nettsiden oppdaterer seg selv uansett.

### 3. Alternativ: Codemagic

`codemagic.yaml` bygger det samme hos codemagic.io (500 gratis minutter i måneden), med en App Store Connect
API-nøkkel (Users and Access → Integrations) lagt inn under Teams → Personal account → Integrations.
Brukes bare om Xcode Cloud ikke fungerer.

### 4. Skjermbilder og tekst

Skjermbilder lages fra nettsiden i iPhone-størrelse. Si fra, så lager jeg dem (6,7" og 6,5"):
rommet, stua, en lek, poengtavla, Pluss.

Tekst til App Store (kan limes rett inn):

- **Navn:** mittvors
- **Undertittel:** Drikkeleker og vorsmoro
- **Kategori:** Entertainment (sekundær: Games → Party)
- **Aldersgrense:** 17+ (Alcohol, Tobacco, or Drug Use or References: Frequent/Intense)
- **Personvern:** Data used to track you: No. Data linked to you: Contact info (e-post, bare ved konto).
- **Prisnivå:** gratis

### 5. Før innsending

- **Demo-konto til Apple:** App Review Information → Sign-in required → lag en egen testkonto og skriv den inn.
  Skriv i Notes: «Create a room on one phone and join it with the code on another. Pluss is free the first night.»
- **Pluss i appen:** Vipps-kjøp vises ikke inne i appen (Apple krever at kjøp i appen går gjennom Apple).
  Gratis-kvelden virker. Kjøp gjennom Apple (In-App Purchase) er neste steg etter at appen er godkjent.
- **Alkohol:** vannrunden og alkoholfri modus er med i appen. Nevn dem i Notes til Apple.

### Neste steg etter godkjenning

1. Pluss som kjøp gjennom Apple (StoreKit).
2. Varsler på iPhone (push) når rommet venter på deg.
3. Android (Google Play, 25 dollar én gang) – Capacitor gjør det med `npx cap add android`.
