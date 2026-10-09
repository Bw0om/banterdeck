# Animasjonsplaner

Planer laget med `/improve-animations`. Hver plan er selvstendig og kan gis til hvilken som helst agent.

| # | Plan | Alvorlighet | Status |
|---|---|---|---|
| 001 | [Gjør svaret på drikkehjulet spennende](001-hjulet-spennende-svar.md) | LOW | DONE (ui/hjul-svar) |
| 002 | [Tittelkort på storskjermen når en ny lek starter](002-tv-intro-ny-lek.md) | LOW | DONE – branch ui/tv-intro |
| 003 | [Rolig inngang for leken på telefonene når en ny lek starter](003-telefon-ny-lek-inn.md) | LOW | DONE – branch ui/tv-intro |

## Rekkefølge

1. 001 – ingen avhengigheter.
2. 002 og 003 – uavhengige av hverandre (ulike filer), men hører sammen: TV-en tar det store øyeblikket, telefonene bare en kort inngang. Kan gjøres på samme branch og testes samtidig med storskjerm + telefoner.
