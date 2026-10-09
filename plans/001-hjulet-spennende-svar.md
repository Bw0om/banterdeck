# 001 — Gjør svaret på drikkehjulet spennende

- **Status**: DONE – branch ui/hjul-svar (commits 7e8f811, 2728f64)
- **Commit**: 1148902
- **Severity**: LOW (tapt mulighet – ikke en feil, men øyeblikket hele rommet ser på)
- **Category**: Missed opportunities / Physicality / Accessibility
- **Estimated scope**: 2 filer – `src/components/GameTool.astro` (hjul-skriptet, ~40 linjer) og `src/styles/champagne.css` (nytt avsnitt, ~30 linjer)

## Problem

Drikkehjulet (lekesiden «Drikkehjulet», `/no/drinking-games/drikkehjulet/`) spinner i 3,2 sekunder, og så dukker svaret bare opp. Det er ingen spenning underveis og ingen landing. Pilen står stille mens hjulet suser forbi, og svaret kommer fra en fast tidtaker i stedet for når hjulet faktisk stopper.

```js
/* src/components/GameTool.astro:205-213 — nå */
body.querySelector('[data-a=snurr]').addEventListener('click', function(){
  if (snurrer) return; snurrer = true;
  var i = Math.floor(Math.random()*N), senter = i*SEG + SEG/2 + (Math.random()-0.5)*SEG*0.6;
  var maal = (360 - senter) % 360, naa = ((vinkel % 360) + 360) % 360;
  vinkel += 5*360 + ((maal - naa + 360) % 360);
  res.innerHTML = '&nbsp;'; desc.innerHTML = '&nbsp;';
  rot.style.transform = 'rotate('+vinkel+'deg)';
  setTimeout(function(){ res.textContent = D.items[i].r || D.items[i].t; desc.textContent = D.items[i].d; snurrer = false; }, 3300);
});
```

```js
/* src/components/GameTool.astro:189-195 — nå: hver bit er en løs <path> + <text> */
var deler = D.items.map(function(x,i){
  var a0 = i*SEG, a1 = a0+SEG, c = a0+SEG/2, f = FARGER[i % 3];
  return '<path d="M0 0 L'+p(a0,96)+' A96 96 0 0 1 '+p(a1,96)+' Z" fill="'+f[0]+'" stroke="#1A1012" stroke-width="1"/>' +
    (c > 180 ? '<text transform="rotate('+(c+90)+') translate(-31 0)" text-anchor="end"' : '<text transform="rotate('+(c-90)+') translate(31 0)"') +
    ' dominant-baseline="middle" fill="'+f[1]+'" font-size="7.4" font-weight="700" font-family="Archivo Variable, Archivo, sans-serif">'+esc(x.t)+'</text>';
}).join('');
```

```css
/* src/styles/global.css:544-548 — nå */
.gt-pointer{position:absolute;top:-4px;left:50%;width:26px;height:21px;transform:translateX(-50%);z-index:2;filter:drop-shadow(0 2px 3px rgba(0,0,0,.5))}
.gt-rot{transition:transform 3.2s cubic-bezier(.17,.67,.12,1);transform-origin:0 0}
.gt-result{font-family:var(--display);font-weight:800;font-size:26px;text-align:center;color:var(--gold-t);margin:14px 0 2px;min-height:34px}
.gt-desc{text-align:center;min-height:22px;margin:0 0 4px}
```

Det er også en feil ved redusert bevegelse. `src/styles/global.css:34` tvinger `transition-property` til bare farge og opasitet og slår av alle `animation` med `!important`. Hjulet hopper da rett til slutt, men svaret kommer først etter 3,3 sekunder, og i den tiden skjer det ingenting.

## Target

En kort fortelling i fire takter. Den varer omtrent like lenge som i dag, men nå skjer det noe hele tiden:

1. **Spinnet**: hjulet roterer i 4000 ms med en kurve som kryper lenger mot slutten, så de siste bitene sniker seg forbi pilen: `cubic-bezier(0.1, 0.7, 0.08, 1)`.
2. **Pilen tikker**: hver gang en grense mellom to biter passerer pilen, slår pilen kort bakover og fjærer tilbake, som klaffen på et lykkehjul. Tikket er en `rotate` på 140 ms. Mot slutten, når hjulet går sakte, gir hvert tikk også en liten vibrasjon på telefoner som støtter det (`navigator.vibrate(6)`).
3. **Landingen**: når hjulet stopper (`transitionend`, ikke en tidtaker):
   - De andre bitene dimmes til 35 % opasitet på 300 ms, og vinnerbiten står igjen i full farge.
   - Svaret spretter inn, fra liten og usynlig til litt for stort og tilbake (420 ms), i serif-skrift.
   - Beskrivelsen glir inn 120 ms etter (260 ms).
   - Telefonen gir en dobbel vibrasjon (`[18, 40, 30]`).
4. **Klar igjen**: Snurr-knappen er deaktivert mens hjulet går. Ved neste spinn kommer bitene tilbake til full farge (200 ms), og svaret tømmes.

**Redusert bevegelse**: ingen rotasjonsanimasjon (hjulet står rett på resultatet, som i dag), ingen tikk og ingen vibrasjon. Dimmingen og svaret kommer **med en gang**, som rolige opasitetsoverganger på 160–300 ms. Ingen ventetid.

### Eksakte verdier

```css
/* nytt avsnitt nederst i src/styles/champagne.css */

/* =====================================================================
   DRIKKEHJULET – spenning før svaret. Pilen tikker forbi hver bit, hjulet
   kryper inn mot slutten, vinneren lyser og svaret spretter inn.
   ===================================================================== */
.gt-rot{transition:transform 4000ms cubic-bezier(0.1, 0.7, 0.08, 1)}
/* Pilen vipper rundt toppen sin, som klaffen på et lykkehjul */
.gt-pointer{transform-origin:50% 20%}
/* Bitene: dimmes når hjulet har landet, vinneren står igjen */
.gt-del{transition:opacity 200ms var(--ease-out)}
.gt-rot.landet .gt-del:not(.vinner){opacity:.35;transition-duration:300ms}
/* Svaret: serif, større, og spretter inn */
.gt-result{font-family:var(--serif);font-weight:560;font-size:clamp(30px,8vw,38px);letter-spacing:-.02em;line-height:1.1;color:var(--gold-t);min-height:42px;text-wrap:balance}
.gt-result.inn{animation:gtSvarInn 420ms cubic-bezier(0.2, 0.9, 0.25, 1.12) both}
@keyframes gtSvarInn{0%{opacity:0;transform:scale(.6)}60%{opacity:1;transform:scale(1.08)}100%{opacity:1;transform:scale(1)}}
.gt-desc.inn{animation:gtBeskrivelseInn 260ms var(--ease-out) 120ms both}
@keyframes gtBeskrivelseInn{from{opacity:0;transform:translateY(6px)}}
/* Redusert bevegelse: global.css slår av animation med !important – vis svaret som en rolig fade i stedet */
@media (prefers-reduced-motion:reduce){
  .gt-result,.gt-desc{transition:opacity 160ms ease-out}
  .gt-result.skjult,.gt-desc.skjult{opacity:0}
}
```

`--ease-out` finnes allerede i `src/styles/global.css:16` (`cubic-bezier(.23,1,.32,1)`). Ikke lag en ny token for den.
`cubic-bezier(0.2, 0.9, 0.25, 1.12)` er samme kurve som kortene i rommet bruker (`src/styles/natt.css:464`, `.kort-inn`). Bruk den nøyaktig slik.

Tikket på pilen skal kjøres med WAAPI (ikke CSS-klasser), så et nytt tikk kan avbryte det forrige midt i:

```js
pil.animate(
  [{ transform: 'translateX(-50%) rotate(0deg)' },
   { transform: 'translateX(-50%) rotate(-22deg)', offset: 0.3 },
   { transform: 'translateX(-50%) rotate(0deg)' }],
  { duration: 140, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' }
);
```

(`translateX(-50%)` må være med, ellers hopper pilen ut av midten, fordi `.gt-pointer` allerede bruker den transformen.)

## Repo conventions to follow

- Stilene for champagnenatt-utseendet legges i `src/styles/champagne.css`, i egne avsnitt med en kommentarblokk i `/* ===== */`-stil og forklaring på norsk. Se avsnittet «TOPP 3» eller «REPLIKKER» i samme fil.
- Bevegelse sjekker redusert bevegelse med en `rolig()`-funksjon i skriptet. Se eksempelet i samme fil, `src/components/GameTool.astro:45`:
  `function rolig(){ try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } }`
- Kommentarer i koden skrives på norsk, korte og forklarende.
- Fargene ligger i `FARGER` i skriptet. Ikke endre dem.

## Steps

1. **`src/components/GameTool.astro`, linje 189–195 (`var deler = …`)**: pakk hver bit inn i en gruppe, så hele biten (flate og tekst) kan dimmes samlet. Endre bare starten og slutten av returen:
   ```js
   return '<g class="gt-del" data-i="'+i+'"><path d="M0 0 L'+p(a0,96)+' A96 96 0 0 1 '+p(a1,96)+' Z" fill="'+f[0]+'" stroke="#1A1012" stroke-width="1"/>' +
     (c > 180 ? '<text transform="rotate('+(c+90)+') translate(-31 0)" text-anchor="end"' : '<text transform="rotate('+(c-90)+') translate(31 0)"') +
     ' dominant-baseline="middle" fill="'+f[1]+'" font-size="7.4" font-weight="700" font-family="Archivo Variable, Archivo, sans-serif">'+esc(x.t)+'</text></g>';
   ```
2. **Samme fil, linje 204**: utvid oppslagslinja med pilen, knappen og redusert-bevegelse-sjekken:
   ```js
   var rot = body.querySelector('.gt-rot'), res = body.querySelector('.gt-result'), desc = body.querySelector('.gt-desc');
   var pil = body.querySelector('.gt-pointer'), knapp = body.querySelector('[data-a=snurr]');
   function rolig(){ try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } }
   // Vinkelen hjulet står i akkurat nå, lest fra den pågående CSS-overgangen
   function vinkelNaa(){ var m = getComputedStyle(rot).transform; if (!m || m === 'none') return 0; var v = m.match(/matrix\(([^)]+)\)/); if (!v) return 0; var t = v[1].split(',').map(Number); return Math.atan2(t[1], t[0]) * 180 / Math.PI; }
   ```
3. **Samme fil, linje 205–213**: erstatt hele klikk-handleren med denne. Den beholder trekningen av vinneren (`i`, `senter`, `maal`, `naa`, `vinkel`) uendret:
   ```js
   knapp.addEventListener('click', function(){
     if (snurrer) return; snurrer = true; knapp.disabled = true;
     var i = Math.floor(Math.random()*N), senter = i*SEG + SEG/2 + (Math.random()-0.5)*SEG*0.6;
     var maal = (360 - senter) % 360, naa = ((vinkel % 360) + 360) % 360;
     vinkel += 5*360 + ((maal - naa + 360) % 360);
     // Nullstill forrige runde: bitene får fargen tilbake, svaret tømmes
     rot.classList.remove('landet');
     rot.querySelectorAll('.gt-del.vinner').forEach(function(g){ g.classList.remove('vinner'); });
     res.classList.remove('inn'); desc.classList.remove('inn');
     res.innerHTML = '&nbsp;'; desc.innerHTML = '&nbsp;';
     var stille = rolig(), landet = false;

     function land(){
       if (landet) return; landet = true;
       var vinner = rot.querySelector('.gt-del[data-i="'+i+'"]'); if (vinner) vinner.classList.add('vinner');
       rot.classList.add('landet');
       res.textContent = D.items[i].r || D.items[i].t; desc.textContent = D.items[i].d;
       if (stille) {
         // Redusert bevegelse: rolig fade, ingen sprett (global.css slår av animation uansett)
         res.classList.add('skjult'); desc.classList.add('skjult');
         requestAnimationFrame(function(){ res.classList.remove('skjult'); desc.classList.remove('skjult'); });
       } else {
         void res.offsetWidth; res.classList.add('inn'); desc.classList.add('inn');
         if (navigator.vibrate) { try { navigator.vibrate([18, 40, 30]); } catch (e) {} }
       }
       snurrer = false; knapp.disabled = false;
     }

     rot.style.transform = 'rotate('+vinkel+'deg)';
     if (stille) { land(); return; }

     // Pilen tikker for hver bit som passerer. Vi følger vinkelen bilde for bilde.
     // sum følger hjulets ekte vinkel (ikke fra null), så tikkene treffer de faktiske grensene mellom bitene
     var forrige = vinkelNaa(), sum = forrige, sistGrense = Math.floor(sum / SEG);
     function folg(){
       if (landet) return;
       var na = vinkelNaa(), d = na - forrige;
       if (d < -180) d += 360; else if (d > 180) d -= 360;
       forrige = na; sum += d;
       var grense = Math.floor(sum / SEG);
       if (grense !== sistGrense) {
         sistGrense = grense;
         pil.getAnimations().forEach(function(a){ a.cancel(); });
         pil.animate([{ transform: 'translateX(-50%) rotate(0deg)' }, { transform: 'translateX(-50%) rotate(-22deg)', offset: 0.3 }, { transform: 'translateX(-50%) rotate(0deg)' }],
           { duration: 140, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' });
         // De siste, langsomme tikkene merkes også i hånda
         if (Math.abs(d) < 6 && navigator.vibrate) { try { navigator.vibrate(6); } catch (e) {} }
       }
       requestAnimationFrame(folg);
     }
     requestAnimationFrame(folg);

     rot.addEventListener('transitionend', function ferdig(e){ if (e.propertyName !== 'transform') return; rot.removeEventListener('transitionend', ferdig); land(); });
     // Sikkerhetsnett hvis transitionend aldri kommer (fanen var skjult o.l.)
     setTimeout(land, 4300);
   });
   ```
4. **`src/styles/champagne.css`**: lim inn hele CSS-blokken fra «Eksakte verdier» nederst i fila, uendret.
5. Ikke rør `.gt-rot`, `.gt-pointer`, `.gt-result` eller `.gt-desc` i `src/styles/global.css`. Den nye blokken i champagne.css lastes etter og overstyrer det som trengs.

## Boundaries

- IKKE rør de andre lekene i `GameTool.astro` (`data-gt="deck"`, `"rules"`, `"bingo"`, `"forraeder"`, `"aar"`, `"ringoffire"`), bare `data-gt="wheel"` (linje 177 og utover).
- IKKE rør hjulet i rommene (`HJULFARGER` i `src/klient/rom.js:2184`). Det er et annet hjul.
- IKKE endre hvordan vinneren trekkes (`i`, `senter`, `maal`, `vinkel`) eller fargene i `FARGER`.
- IKKE legg til nye avhengigheter eller biblioteker.
- IKKE endre `src/styles/global.css` eller `src/styles/natt.css`.
- Hvis koden på linjenumrene over ikke stemmer med utdragene (endret siden commit 1148902): STOPP og rapporter i stedet for å improvisere.

## Verification

- **Mekanisk**: `npx astro build` skal ende med `Complete!` uten feil. `node --check` virker ikke på `.astro`, så åpne siden og sjekk at konsollen ikke viser feil.
- **Følelsessjekk**: start `npx astro dev`, åpne `/no/drinking-games/drikkehjulet/` på en telefon (eller i 390 px bredde) og trykk «Snurr» fem ganger på rad:
  - Pilen vipper bakover for hver bit som passerer. Først skjelver den raskt, mot slutten tikker den sakte, én og én.
  - Hjulet kryper det siste stykket. De siste bitene sniker seg forbi så sakte at man rekker å gjette.
  - Svaret kommer akkurat når hjulet stopper, ikke før og ikke etter.
  - Vinnerbiten står i full farge mens de andre dimmes. Ved neste spinn kommer alle tilbake.
  - Svaret spretter inn og fjærer litt. Beskrivelsen kommer et øyeblikk etter.
  - «Snurr» kan ikke trykkes mens hjulet går.
  - I DevTools → Animations, sett farten til 10 % og sjekk at pilen alltid går tilbake til midten (ingen fastlåst vipp), og at svaret aldri blir stående forstørret.
  - På en Android-telefon: små vibrasjoner på de siste tikkene, og en dobbel vibrasjon ved landing.
  - Slå på `prefers-reduced-motion` (DevTools → Rendering): hjulet hopper rett til resultatet, uten tikk. Svaret og dimmingen kommer med en gang som en rolig fade, uten ventetid.
  - Tell bitene som passerer i sakte film: pilen skal tikke nøyaktig når en grense mellom to biter går forbi, ikke midt i en bit.
- **Ferdig når**: alle punktene over stemmer, og svaret alltid er biten pilen peker på.
