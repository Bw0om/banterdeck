// Hvilke leker som krever Pluss for å spilles på mobilen. Reglene er alltid gratis å lese.
// Endre listene her for å flytte leker mellom gratis og Pluss.
/** Lekesider (slug) der verktøyet på mobilen krever Pluss. */
export const PLUSS_SLUGS = ['bussruta', 'drikke-yatzy', 'pyramiden', 'president', 'gris', 'forraeder', 'bloffquizen', 'hemmelig-oppdrag'];
/** Leker i rom (id) som krever at verten har Pluss. Pakkene («pakke-…») krever alltid Pluss. */
export const PLUSS_ROM = ['bussruta', 'yatzy', 'pyramiden', 'president', 'gris', 'forraeder', 'bloff'];
/** Så mange telefoner kan være med i et rom uten Pluss. */
export const GRATIS_PLASSER = 4;
