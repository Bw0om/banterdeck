# 003 — Rolig inngang for leken på telefonene når en ny lek starter

- **Status**: DONE – branch ui/tv-intro
- **Commit**: e718c9a
- **Severity**: LOW (brått skifte – ikke en feil, men skjermen bytter innhold uten noen overgang)
- **Category**: Missed opportunities / Interruptibility / Accessibility
- **Estimated scope**: 2 filer – `src/klient/rom.js` (~8 linjer i `tegn()`) og `src/styles/natt.css` (~6 linjer)

## Problem

Når verten starter en lek, bytter alle telefonene fra lobbyen til leken i én tegning: `root.innerHTML` byttes, og siden hopper til toppen. Det er riktig at det går fort – men skiftet er brått, og første kort «deles ut» med kortanimasjonen samtidig som resten av skjermen bare dukker opp.

```js
/* src/klient/rom.js:2562-2583 — nå */
// Nytt kort? Ta vare på det gamle, så det kan kastes ut av skjermen når det nye deles ut
var nyKN = kortNokkel(s), kortByttet = !!(tegnetFor && nyKN && nyKN !== sistKortNokkel) && !roligBevegelse();
tegnetFor = true;
var gammeltKort = kortByttet ? root.querySelector('.rom-kort, .rof-kort.rom-rof') : null;
var gammelRekt = gammeltKort ? gammeltKort.getBoundingClientRect() : null;
sistKortNokkel = nyKN;
root.innerHTML = s
  ? topp + merker + borsHurtig() + innhold + '<div class="rom-bakgrunn">' + ... + '</div>' + reaksjonslinje() + vert + forlat
  : topp + ... + innhold + vert + forlat;
merkNyttInnhold(s);
...
// Nytt skjermbilde (lobby, ny lek, oppsummering): start øverst. Ellers: behold plassen.
var skjerm = s ? 'spill:' + s.type + ':' + (s.navn && s.navn.no ? s.navn.no : s.navn) : tilstand.ferdig ? 'ferdig' : 'lobby';
// 'instant': ellers stopper neste tegning en myk rulling midt på siden
if (skjerm !== sisteSkjerm) { sisteSkjerm = skjerm; window.scrollTo({ top: 0, behavior: 'instant' }); } else window.scrollTo({ top: y, behavior: 'instant' });
if (kortByttet) delUtKort(gammeltKort, gammelRekt);
```

Leken selv ligger i `<div class="rom-spill">…</div>` (bygget på `rom.js:2543`). Toppen (`hode()`), merkene og reaksjonslinja ligger utenfor den.

`tegn()` kjøres på nytt ved hver oppdatering fra serveren og bytter hele `root.innerHTML`. En CSS-klasse som legges på én gang, forsvinner altså ved neste oppdatering – og rett etter en lekestart kommer det ofte flere oppdateringer tett. Inngangen må derfor overleve en ny tegning (se steg 3).

Telefonene skal **ikke** ha noe stort tittelkort: den som har tur må se første kort med en gang. Det store øyeblikket hører hjemme på TV-en (plan 002). Det finnes også allerede en sperre på 700 ms mot bomtrykk på nytt innhold (`merkNyttInnhold`, `rom.js:2719-2722`), så det trengs ingen ekstra pause.

## Target

- Når skjermen går over til en **ny lek** (ikke ved første tegning etter at siden er åpnet, ikke ved nytt kort i samme lek): `.rom-spill` toner inn fra `opacity: 0; transform: translateY(12px) scale(.98)` til på plass, **300 ms `var(--ease-out)`**. Toppen og reaksjonslinja står stille – de er ankeret.
- Første kort i leken får **ikke** i tillegg kortanimasjonen (`kort-inn`) – én bevegelse om gangen.
- Kommer det en ny tegning midt i inngangen, fortsetter inngangen der den var (negativ `animation-delay`), i stedet for å hoppe til slutten eller starte på nytt.
- Når animasjonen er ferdig, fjernes klassen (så `.rom-spill` ikke blir stående med `transform`).
- **Redusert bevegelse**: bare `opacity` 0 → 1, 200 ms `ease-out`. Ingen bevegelse.

```css
/* src/styles/natt.css — mål: nytt avsnitt rett etter linja `@media (prefers-reduced-motion:reduce){.kort-inn,.kort-ut{animation:none}}` (linje 474) */
/* Ny lek: leken toner rolig inn på alle telefonene. Kort – den som har tur skal kunne spille med en gang. */
.spill-inn{animation:spillInn 300ms var(--ease-out) both}
@keyframes spillInn{from{opacity:0;transform:translateY(12px) scale(.98)}}
@media (prefers-reduced-motion:reduce){.spill-inn{animation:spillInnRolig 200ms ease-out both}}
@keyframes spillInnRolig{from{opacity:0}}
```

## Repo conventions to follow

- Kurvene finnes som variabler i `src/styles/global.css:17`: `--ease-out:cubic-bezier(.23,1,.32,1)`. Bruk `var(--ease-out)`.
- Eksempel på samme mønster i fila: kortet som deles ut, `.kort-inn` i `src/styles/natt.css:464-474`, og `delUtKort()` i `src/klient/rom.js:2662-2664`, som legger på klassen og fjerner den igjen på `animationend`.
- `roligBevegelse()` (`rom.js:2656`) finnes allerede, men her håndteres redusert bevegelse i CSS – ikke kall den.
- Kommentarer på norsk, korte, i samme tone som rundt.

## Steps

1. **`src/klient/rom.js`, linje 2655** – utvid variabellinja:
   ```js
   var sistKortNokkel = '', tegnetFor = false;   // første tegning (f.eks. etter oppdatering av siden) skal ikke animeres
   var spillInnFra = 0;   // når en ny lek kom inn på skjermen – inngangen skal overleve neste tegning
   ```

2. **Samme fil, linja med `if (skjerm !== sisteSkjerm) …` (2582)** – bytt ut den og linja under med:
   ```js
   // Ny lek (ikke første tegning): leken toner inn, og første kort deles ikke ut i tillegg
   var nyLek = !!(s && sisteSkjerm && skjerm !== sisteSkjerm);
   if (nyLek) spillInnFra = Date.now();
   if (skjerm !== sisteSkjerm) { sisteSkjerm = skjerm; window.scrollTo({ top: 0, behavior: 'instant' }); } else window.scrollTo({ top: y, behavior: 'instant' });
   if (kortByttet && !nyLek) delUtKort(gammeltKort, gammelRekt);
   spillInn();
   ```

3. **Samme fil, rett etter funksjonen `delUtKort` (slutter på linje 2671)** – legg til:
   ```js
   /** Ny lek: la leken tone inn. Kommer det en ny tegning midt i, fortsetter den der den var. */
   function spillInn() {
     var gaatt = Date.now() - spillInnFra, el = root.querySelector('.rom-spill');
     if (!el || gaatt >= 300) return;
     el.style.animationDelay = -gaatt + 'ms';
     el.classList.add('spill-inn');
     el.addEventListener('animationend', function (e) { if (e.target === el) { el.classList.remove('spill-inn'); el.style.animationDelay = ''; } });
   }
   ```
   (`e.target === el`-sjekken trengs fordi kort inne i `.rom-spill` har egne animasjoner som også sender `animationend` oppover.)

4. **`src/styles/natt.css`** – lim inn CSS-blokka fra *Target* rett etter linje 474.

## Boundaries

- Ikke endre noe på storskjermen (`src/components/pages/Storskjerm.astro`) eller i `src/lib/rom.ts` – det er plan 002.
- Ikke endre `.kort-inn` / `.kort-ut`, `delUtKort()` eller `merkNyttInnhold()` utover det steg 2 sier.
- Ikke animer toppen (`.rom-hode`), merkene, reaksjonslinja (`.reak-linje`) eller vertsverktøyene – bare `.rom-spill`.
- Ikke legg til noe overlegg, nedtelling eller pause på telefonene.
- Stemmer ikke koden med utdragene over (endret siden commit e718c9a), STOPP og rapporter i stedet for å improvisere.

## Verification

- **Mekanisk**: `npm run build` skal gå gjennom uten nye feil.
- **Felt-sjekk** (rom med 2+ telefoner, eller to nettleserfaner; på Vercel-preview hvis rommet trenger Supabase lokalt):
  1. Åpne et rom og start en lek. På alle telefoner: leken stiger rolig inn på ca. en tredjedels sekund, toppen står stille, og første kort kommer **sammen med** resten – det flyr ikke inn fra siden i tillegg.
  2. Trykk «Neste kort» i samme lek → vanlig kortanimasjon som før, **ingen** inngang for hele leken.
  3. Last siden på nytt midt i en lek → ingen inngang (første tegning).
  4. Gå tilbake til lobbyen → lobbyen kommer uten animasjon (som før).
  5. Den som har tur skal kunne trykke på første kort med en gang – ingenting skal føles låst ut over det som var før.
  - I DevTools → Animations på 10 %: `.rom-spill` vokser fra 98 % og stiger 12px, aldri fra 0. Utløs en ny tegning midt i (f.eks. en reaksjon fra en annen telefon) → bevegelsen fortsetter jevnt, ingen hopp.
  - Etter animasjonen: inspiser `.rom-spill` – klassen `spill-inn` og `animation-delay` skal være borte.
  - Slå på `prefers-reduced-motion: reduce` i DevTools → Rendering: bare en kort overtoning, ingen bevegelse.
  - Prøv på en ekte telefon: det skal føles som at leken «setter seg», ikke som en forsinkelse. Føles det tregt, er 250 ms nedre grense – ikke lenger enn 300 ms.
- **Ferdig når**: punktene 1-5 stemmer, bygget går gjennom, og klassen fjernes etter animasjonen.
