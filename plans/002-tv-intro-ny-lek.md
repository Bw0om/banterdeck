# 002 — Tittelkort på storskjermen når en ny lek starter

- **Status**: DONE – branch ui/tv-intro
- **Commit**: e718c9a
- **Severity**: LOW (tapt mulighet – øyeblikket hele rommet ser mot TV-en samtidig)
- **Category**: Missed opportunities / Purpose & frequency / Accessibility
- **Estimated scope**: 2 filer – `src/components/pages/Storskjerm.astro` (skript ~45 linjer + CSS ~30 linjer) og `src/lib/rom.ts` (1 linje)

## Problem

Når verten starter en lek, bytter storskjermen fra lobbyen (QR-kode + navn) rett til leken i én tegning. Ingenting markerer at kvelden går over i noe nytt – det er akkurat det øyeblikket alle i rommet ser mot TV-en samtidig, og TV-en er den eneste skjermen som viser alle det samme på samme tid.

```js
/* src/components/pages/Storskjerm.astro:258-270 — nå */
function tegn() {
  var d = tilstand; if (!d) return;
  if (!startet) return tegnStart();
  ...
  rot.innerHTML = '<header class="tv-hode">...' +
    '<div class="tv-hoved' + (side ? '' : ' uten-side') + '"><div class="tv-scenebox">' + scene(d) + '</div>' + ... + '</div>' + meldt;
  if (nyttKort) { var inn = rot.querySelector('.tv-kort, .tv-sporsmal, .tv-rof-kort .rof-kort'); if (inn) inn.classList.add('kort-inn'); }
}
```

```js
/* src/components/pages/Storskjerm.astro:132-145 — nå: hendelser() er stedet der TV-en reagerer på endringer (lyd, DRIKK-tavle, banner) */
var sett = null;
function hendelser(gml, d) {
  var s = d.spill || {}, b = d.bors || {};
  var na = {
    slurker: {}, brudd: ..., kortNr: ...,
    ...
    fase: s.type + ':' + (s.fase || ''), spillere: (d.spillere || []).length, vann: d.vann ? d.vann.nr : 0,
  };
  (d.spillere || []).forEach(function (p) { na.slurker[p.id] = p.slurker || 0; });
  if (!sett) { sett = na; return; }
  ...
  sett = na;
}
```

`hendelser()` kjøres fra `ta()` **før** `tegn()`, og første kall (`sett === null`) setter bare et utgangspunkt. Det betyr at et tittelkort som utløses herfra aldri vises ved første lasting, ved «Start storskjermen» eller etter at TV-en kobler seg til på nytt midt i en lek – bare når en lek faktisk starter mens TV-en ser på.

Storskjermen får sin egen visning fra serveren (`skjermVisning`), og den har i dag ikke noe som sier hvor mange leker som er spilt i kveld:

```ts
/* src/lib/rom.ts:196 — nå */
spill = { type: s.type, lek: s.lek, navn: s.navn, runde: s.runde || null, frist: s.frist || null };
```

Serveren legger navnet til hver lek som startes i `data.historikk` (`src/lib/rom.ts:666`, maks 40).

## Target

### Det rommet skal oppleve

**Vanlig lekestart (2,2 s totalt):**

| Tid | Hva skjer |
|---|---|
| 0 ms | Et helt dekkende lag (samme mørke vinrøde bakgrunn som TV-en) toner inn over alt, 200 ms. En myk tostone-klokke spilles. |
| 100 ms | Den lille etiketten «Neste lek» / «Next game» toner inn og stiger 8px, 400 ms `var(--ease-out)`. |
| 150 ms | Navnet på leken, stort, går fra `scale(.96)` + usynlig til hel størrelse, 600 ms `var(--ease-out)`. |
| 300 ms | En tynn gulllinje under navnet tegnes ut fra midten (`scaleX(0)` → `1`), 600 ms `var(--ease-in-out)`. |
| 1800 ms | Laget toner ut, 400 ms `var(--ease-out)`. Samtidig stiger leken under fram (`opacity 0, translateY(12px) scale(.98)` → på plass), 500 ms `var(--ease-out)`. |
| 2200 ms | Laget fjernes fra siden. |

**Første lek i kvelden (3,2 s totalt):** samme oppsett, men etiketten er «Kvelden er i gang» / «The night is on», og under gulllinja kommer navnene på spillerne inn ett for ett (opacity + 6px opp, 300 ms `var(--ease-out)`, start 450 ms, 60 ms mellom hver, maks 12 navn – resten vises uten forsinkelse). Laget toner ut ved 2800 ms og fjernes ved 3200 ms.

**Redusert bevegelse** (`prefers-reduced-motion: reduce`): alt blir rene overtoninger (bare `opacity`, ingen skalering, ingen strek som tegnes, ingen stigning). Laget toner ut ved 1400 ms (første lek: 2000 ms), fjernes 400 ms etter.

**Regler:**
- Laget har `pointer-events: none` og stopper aldri noe – leken tegnes under det som vanlig. TV-en er uansett ikke interaktiv.
- Laget ligger **under** DRIKK-tavla, «RINGEN RØK», vannrunden og bannere (`z-index: 8500`; de har 9997–9999 og 9000).
- Starter verten en ny lek mens et tittelkort vises, fjernes det gamle med en gang og et nytt starter.
- Avsluttes kvelden (`d.ferdig`) mens et tittelkort vises, fjernes det med en gang.

### Kode – mål

```ts
/* src/lib/rom.ts:196 — mål (antallLeker lagt til, ellers uendret) */
spill = { type: s.type, lek: s.lek, navn: s.navn, runde: s.runde || null, frist: s.frist || null, antallLeker: (data.historikk || []).length };
```

```css
/* src/components/pages/Storskjerm.astro — mål: nytt avsnitt rett før </style> */
/* Tittelkort når en ny lek starter: hele rommet ser opp samtidig */
.tv-intro{position:fixed;inset:0;z-index:8500;pointer-events:none;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2vh;padding:4vh 8vw;text-align:center;
  background:radial-gradient(ellipse at top,#2A1A22,#0A0609 70%);animation:tvIntroLag 200ms var(--ease-out) both}
.tv-intro.ut{animation:tvIntroUt 400ms var(--ease-out) forwards}
.tv-intro-etikett{margin:0;color:var(--gold);font-weight:800;font-size:1.3em;animation:tvIntroOpp 400ms var(--ease-out) 100ms both}
.tv-intro h1{margin:0;font-family:var(--display);font-stretch:125%;font-weight:900;letter-spacing:-.03em;font-size:6.5vw;line-height:1.05;max-width:18ch;text-wrap:balance;animation:tvIntroNavn 600ms var(--ease-out) 150ms both}
.tv-intro-strek{width:12vw;height:3px;border-radius:3px;background:var(--gold);transform-origin:center;animation:tvIntroStrek 600ms var(--ease-in-out) 300ms both}
.tv-intro-folk{display:flex;flex-wrap:wrap;justify-content:center;gap:10px 14px;max-width:70vw;margin-top:1vh}
.tv-intro-folk span{background:var(--card2);padding:8px 18px;border-radius:999px;font-weight:700;font-size:1.2em;animation:tvIntroOpp 300ms var(--ease-out) both}
.tv-hoved{transition:opacity 500ms var(--ease-out),transform 500ms var(--ease-out)}
body.tv-intro-paa .tv-hoved{opacity:0;transform:translateY(12px) scale(.98);transition:none}
@keyframes tvIntroLag{from{opacity:0}}
@keyframes tvIntroUt{to{opacity:0}}
@keyframes tvIntroOpp{from{opacity:0;transform:translateY(8px)}}
@keyframes tvIntroNavn{from{opacity:0;transform:scale(.96)}}
@keyframes tvIntroStrek{from{transform:scaleX(0)}}
@keyframes tvIntroFade{from{opacity:0}}
@media (prefers-reduced-motion:reduce){
  .tv-intro-etikett,.tv-intro h1,.tv-intro-folk span{animation-name:tvIntroFade}
  .tv-intro-strek{animation:tvIntroFade 300ms ease-out both}
  .tv-hoved{transition:opacity 500ms var(--ease-out)}
  body.tv-intro-paa .tv-hoved{transform:none}
}
```

`.tv-intro-folk span`-forsinkelsen settes per navn med inline `style="animation-delay:…ms"` (samme mønster som `.tv-pris` på `Storskjerm.astro:224`).

## Repo conventions to follow

- Kurvene finnes allerede som variabler i `src/styles/global.css:17`: `--ease-out:cubic-bezier(.23,1,.32,1); --ease-in-out:cubic-bezier(.77,0,.175,1);`. Bruk `var(--ease-out)` / `var(--ease-in-out)` – ikke skriv inn nye cubic-bezier-verdier.
- Fullskjermlag på TV-en lages med hjelperen `lag(klasse, html, ms)` (`Storskjerm.astro:165`), som legger elementet på `document.body` og fjerner det etter `ms`. Eksempel: `visVann` på `Storskjerm.astro:177-179`. Tittelkortet trenger å kunne avbrytes og få klassen `ut`, så lag det med `lag(...)`, men ta vare på elementet og timerne selv (se steg 3).
- Lyd lages i `spill(navn)` (`Storskjerm.astro:78-89`) med `tone(frekvens, start, varighet, bølgetype, volum)`. Legg den nye lyden til som en ny `if`-linje der, i samme stil som `inn` og `vann`.
- Tekster skrives alltid med `T('norsk', 'english')`, og alt innhold fra serveren går gjennom `esc(...)`.
- Kode og kommentarer er på norsk, kort og i samme tone som resten av filen.

## Steps

1. **`src/lib/rom.ts:196`** – legg til `antallLeker: (data.historikk || []).length` sist i `spill`-objektet, som vist under *Target*. Ingen andre endringer i denne fila.

2. **`src/components/pages/Storskjerm.astro`, i `spill(navn)` (linje 78-89)** – legg til en ny linje rett etter `if (navn === 'inn') …`:
   ```js
   if (navn === 'intro') { tone(523, 0, 0.18, 'triangle', 0.12); tone(784, 0.16, 0.5, 'triangle', 0.14); }
   ```

3. **Samme fil, rett etter linja `var drikkEl = null, drikkT = null, drikkListe = {};` (linje 166)** – legg til tittelkortet:
   ```js
   /* ---------- tittelkort: en ny lek starter, alle ser mot TV-en samtidig ---------- */
   var introEl = null, introT = [];
   function stoppIntro() {
     introT.forEach(clearTimeout); introT = [];
     if (introEl) { introEl.remove(); introEl = null; }
     document.body.classList.remove('tv-intro-paa');
   }
   function visIntro(d) {
     stoppIntro();
     var s = d.spill, forste = s.antallLeker === 1, rolig = false;
     try { rolig = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
     var folk = forste ? (d.spillere || []).map(function (p, i) { return '<span style="animation-delay:' + (450 + Math.min(i, 11) * 60) + 'ms">' + esc(p.navn) + '</span>'; }).join('') : '';
     var ut = forste ? (rolig ? 2000 : 2800) : (rolig ? 1400 : 1800);
     introEl = lag('tv-intro', '<p class="tv-intro-etikett">' + (forste ? T('Kvelden er i gang', 'The night is on') : T('Neste lek', 'Next game')) + '</p>' +
       '<h1>' + esc(s.navn) + '</h1><i class="tv-intro-strek" aria-hidden="true"></i>' + (folk ? '<div class="tv-intro-folk">' + folk + '</div>' : ''), ut + 400);
     introEl.setAttribute('aria-hidden', 'true');
     document.body.classList.add('tv-intro-paa');
     spill('intro');
     introT.push(setTimeout(function () { if (introEl) introEl.classList.add('ut'); document.body.classList.remove('tv-intro-paa'); }, ut));
     introT.push(setTimeout(function () { introEl = null; introT = []; }, ut + 400));
   }
   ```
   (`lag` fjerner selve elementet etter `ut + 400` ms; den siste timeren rydder bare opp i variablene.)

4. **Samme fil, i `hendelser(gml, d)`** – legg til en nøkkel for leken i `na`-objektet, rett etter `vann: …` på linje 140:
   ```js
   lek: d.spill ? [d.spill.antallLeker || 0, d.spill.type, d.spill.lek || '', d.spill.navn].join('|') : '',
   ```
   og rett **før** linja `if ((na.vinner && na.vinner !== sett.vinner) || …` (linje 156):
   ```js
   // Ny lek: tittelkort på TV-en. Kvelden er over: bort med det.
   if (na.lek && na.lek !== sett.lek) visIntro(d);
   if (na.ferdig) stoppIntro();
   ```

5. **Samme fil, CSS** – lim inn CSS-blokka fra *Target* rett før `</style>` nederst i fila.

## Boundaries

- Ikke endre noe på telefonene (`src/klient/rom.js`, `src/styles/natt.css`) – det er plan 003.
- Ikke endre `scene()`, `tegn()` eller `sidebar()` i `Storskjerm.astro`. Tittelkortet er et eget lag oppå; leken under tegnes akkurat som før.
- Ikke endre eksisterende lyder, `lag()`, eller lagene for DRIKK / RINGEN RØK / vann / banner.
- I `rom.ts`: bare den ene linja i `skjermVisning`. Ikke rør `historikk`-logikken.
- Ikke legg til nye avhengigheter eller nye cubic-bezier-verdier.
- Stemmer ikke koden med utdragene over (endret siden commit e718c9a), STOPP og rapporter i stedet for å improvisere.

## Verification

- **Mekanisk**: `npm run build` skal gå gjennom uten nye feil. Søk etter `antallLeker` – den skal finnes i `rom.ts` (1 gang) og i `Storskjerm.astro`.
- **Felt-sjekk** (trenger et rom med storskjerm – lokalt eller på Vercel-preview, se `deploy-safety`: test SSR-rutene på preview):
  1. Lag et rom på telefon, åpne storskjermen i en annen fane/PC med kode + PIN, trykk «Start storskjermen». **Ingen** tittelkort skal vises nå.
  2. Start første lek fra telefonen. TV-en skal vise «Kvelden er i gang», lekens navn, gulllinja og navnene på spillerne ett og ett, høre en myk tostone, og så tone over til leken etter ca. 3 sekunder.
  3. Gå tilbake til lobbyen og start en annen lek. Nå: «Neste lek» + navn, uten navnelista, over etter ca. 2 sekunder.
  4. Last TV-siden på nytt midt i en lek → ingen tittelkort.
  5. Start to leker raskt etter hverandre → det første kortet forsvinner med en gang, det andre spilles helt.
  6. Mens tittelkortet vises: få noen til å drikke (f.eks. trekk et kort som gir slurker) → DRIKK-tavla skal ligge **over** tittelkortet.
  7. Med 20+ spillere: navnelista skal bryte pent over flere linjer og ikke gå utenfor skjermen; de siste navnene kommer samtidig, ikke etter hverandre.
  - I DevTools → Animations, sett farten til 10 % og sjekk: navnet vokser fra litt mindre (aldri fra 0), streken tegnes fra midten og ut, og leken under stiger opp i samme takt som laget toner ut – ingen svart pause mellom dem.
  - I DevTools → Rendering, slå på `prefers-reduced-motion: reduce`: alt skal bare tone inn og ut, ingenting skal vokse, gli eller tegnes. Kortet skal være kortere.
  - Se det på en ekte TV fra sofaavstand: navnet skal kunne leses fra rommet, og hele greia skal føles som en rolig pause, ikke som en forsinkelse. Føles 1,8 s for lenge, prøv 1,5 s – men ikke kortere enn at navnet rekker å bli lest.
- **Ferdig når**: steg 1-7 over stemmer, bygget går gjennom, og redusert bevegelse gir bare overtoninger.
