# Les dette før du laster opp

Opplasting via github.com kan **legge til og overskrive** filer, men **ikke slette** dem.
Derfor samler repoet på gamle filer, og nye filer blir noen ganger hoppet over uten varsel.
Det har kostet oss flere feilsøkingsrunder.

## Anbefalt: GitHub Desktop (10 min én gang, 30 sek hver gang etterpå)

1. Last ned GitHub Desktop fra https://desktop.github.com og logg inn
2. **File → Clone repository** → velg `Bw0om/banterdeck`
3. Åpne mappa i Utforsker. Slett **alt** unntatt den skjulte `.git`-mappa
   (slå på «Skjulte elementer» i Vis-menyen for å se den)
4. Kopier inn hele innholdet i denne zip-en
5. I GitHub Desktop ser du nå hver endring – både nye og slettede filer.
   **Den lista er beviset på at alt kom med.**
6. Skriv en melding → **Commit to main** → **Push origin**

Vercel bygger automatisk. Ferdig etter ca. ett minutt.

## Sjekk at det gikk bra

Åpne byggeloggen i Vercel og se etter disse tre linjene:

```
▶ src/pages/situations.astro
▶ src/pages/dictionary.astro
▶ src/pages/favourites.astro
```

Er de der, kjører den nye koden. Test så `banterdeck.com/situations`.

## Gamle adresser

Disse filene ligger med vilje i zip-en og viderekobler til de nye sidene,
slik at gamle lenker og bokmerker fortsatt virker:

| Gammel | Ny |
|---|---|
| `/kategori/<navn>` | `/no/categories/<navn>` |
| `/kategori/ordbok` | `/no/dictionary` |
| `/drikkeleker/...` | `/no/drinking-games/...` |
| `/forslag` | `/no/suggest` |
| `/om` | `/no/about` |
| `/personvern` | `/no/privacy` |
| `/app/` | `/` |

Vil du rydde dem bort senere, slett disse i GitHub Desktop:
`src/pages/kategori/`, `src/pages/drikkeleker/`, `src/pages/forslag.astro`,
`src/pages/om.astro`, `src/pages/personvern.astro`.
