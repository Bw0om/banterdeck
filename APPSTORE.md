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
3. Noter **Apple ID** (tallet under App Information → General Information). Det skal inn i `codemagic.yaml` som `APP_STORE_APPLE_ID`.
4. Noter **Team ID** (øverst til høyre på developer.apple.com/account, ti tegn). Si fra, så legger jeg det inn i
   `public/.well-known/apple-app-site-association`, slik at mittvors-lenker åpner appen.

### 2. API-nøkkel (lar Codemagic laste opp for deg)

1. App Store Connect → **Users and Access** → **Integrations** → **App Store Connect API** → **+**.
2. Navn «Codemagic», Access **App Manager**. Generate.
3. Last ned `.p8`-fila (kan bare lastes ned én gang – ta vare på den). Noter **Issuer ID** og **Key ID**.

### 3. Codemagic

1. Logg inn på [codemagic.io](https://codemagic.io) med GitHub, og legg til `Bw0om/banterdeck`.
2. **Teams → Integrations → App Store Connect**: lim inn Issuer ID, Key ID og `.p8`-fila. Kall den «mittvors».
3. **Team settings → Code signing identities → iOS**: velg **Automatic** med App Store Connect-nøkkelen. Codemagic lager
   sertifikatet og profilen selv.
4. Appen → **Start new build** → workflow «iPhone-app til TestFlight». Første bygg tar 15–25 minutter.
5. Bygget havner i TestFlight. Installer **TestFlight** fra App Store på iPhonen, legg deg til som tester under
   App Store Connect → TestFlight → Internal Testing, og prøv appen.

Hver gang du vil ha ny versjon av selve appen (ikke nettsiden – den oppdateres av seg selv): Start new build igjen.

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
