// Klistremerker: lekeikoner tegnet med tykk svart strek og flate farger (stua-designet).
// Hvert merke er innholdet i en <svg viewBox="0 0 64 64">. Bruk klistremerke(slug) for ferdig SVG.
const B = '#16120F';
const S = `stroke="${B}" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"`;
const O = '#FF5B1F', G = '#FFD23F', M = '#63E2A8', R = '#FF9CC2', P = '#FFF8EE', H = '#F2B98B';

const MERKER: Record<string, string> = {
  muldvarp: `<path d="M6 54c4-10 14-14 26-14s22 4 26 14z" fill="#B9773F" ${S}/><path d="M14 46c0-16 8-28 18-28s18 12 18 28" fill="#7A4A2A" ${S}/><rect x="17" y="27" width="12" height="8" rx="3" fill="${B}"/><rect x="35" y="27" width="12" height="8" rx="3" fill="${B}"/><path d="M29 31h6" ${S}/><ellipse cx="32" cy="41" rx="4" ry="3" fill="${R}" ${S}/><path d="M26 47q6 3 12 0" fill="none" ${S}/>`,
  brev: `<rect x="6" y="16" width="52" height="36" fill="${P}" ${S}/><path d="M6 16l26 20 26-20" fill="none" ${S}/><circle cx="32" cy="38" r="9" fill="${O}" ${S}/><path d="M29 35q3-4 6 0t-3 4v1" fill="none" stroke="${B}" stroke-width="2.6" stroke-linecap="round"/><circle cx="32" cy="43.5" r="1.4" fill="${B}"/>`,
  fisk: `<path d="M8 32c8-12 22-16 34-8l12-8v32l-12-8c-12 8-26 4-34-8z" fill="${M}" ${S}/><circle cx="20" cy="29" r="3.5" fill="${P}" ${S}/><circle cx="20.5" cy="29.5" r="1.4" fill="${B}"/><path d="M14 36q4 3 8 1" fill="none" ${S}/><path d="M30 24q4 8 0 16" fill="none" ${S}/><path d="M44 8q4 3 0 6M52 6q3 3 0 6" fill="none" ${S}/>`,
  sau: `<g fill="${P}" ${S}><circle cx="22" cy="28" r="10"/><circle cx="34" cy="24" r="11"/><circle cx="44" cy="31" r="9"/><circle cx="28" cy="38" r="10"/><circle cx="40" cy="40" r="9"/></g><path d="M20 44v10M28 46v10M38 46v10M45 44v10" ${S}/><ellipse cx="14" cy="33" rx="8" ry="10" fill="${B}"/><circle cx="11" cy="31" r="1.8" fill="${P}"/><circle cx="17" cy="31" r="1.8" fill="${P}"/><path d="M6 26l-4-3M22 26l3-4" ${S}/>`,
  nese: `<circle cx="26" cy="32" r="18" fill="${H}" ${S}/><path d="M8 26q18-20 36 0" fill="#7A4A2A" ${S}/><circle cx="20" cy="31" r="2.4" fill="${B}"/><circle cx="31" cy="31" r="2.4" fill="${B}"/><path d="M33 36h24l-24 5z" fill="${H}" ${S}/><path d="M18 44q6 3 10 0" fill="none" ${S}/><path d="M50 30l2-5M56 34l5-2" ${S}/>`,
  blyant: `<path d="M14 50l30-30 8 8-30 30-11 3z" fill="${G}" ${S}/><path d="M44 20l5-5a4 4 0 0 1 6 0l2 2a4 4 0 0 1 0 6l-5 5" fill="${R}" ${S}/><path d="M11 61l3-11 8 8z" fill="${P}" ${S}/><path d="M4 40h10l-1 14H5z" fill="${M}" ${S}/><path d="M5 45h8" ${S}/>`,
  avis: `<rect x="8" y="10" width="44" height="46" fill="${P}" ${S}/><path d="M52 18h6v32a6 6 0 0 1-6 6" fill="${P}" ${S}/><rect x="14" y="17" width="32" height="10" fill="${O}" ${S}/><path d="M14 34h14M14 41h14M14 48h14" ${S}/><rect x="33" y="34" width="13" height="14" fill="${M}" ${S}/>`,
  agent: `<circle cx="32" cy="36" r="18" fill="${H}" ${S}/><path d="M10 26h44" ${S}/><path d="M16 26l4-14h24l4 14z" fill="${B}" ${S}/><path d="M18 21h28" stroke="${O}" stroke-width="4"/><rect x="19" y="32" width="11" height="7" rx="2" fill="${B}"/><rect x="34" y="32" width="11" height="7" rx="2" fill="${B}"/><path d="M30 35h4" ${S}/><path d="M26 46q6 2 12-1" fill="none" ${S}/>`,
  note: `<path d="M24 46V14l28-6v32" fill="none" ${S}/><path d="M24 22l28-6" ${S}/><ellipse cx="17" cy="47" rx="8" ry="6" fill="${R}" ${S}/><ellipse cx="45" cy="41" rx="8" ry="6" fill="${M}" ${S}/><path d="M6 14l4 2M8 6l3 4" ${S}/>`,
  lyn: `<path d="M20 26h24l-3 30H23z" fill="${G}" ${S}/><path d="M20 34h24" ${S}/><path d="M36 4l-8 14h8l-6 12" fill="none" stroke="${O}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M48 12l6-4M50 22l7 1M14 12l-6-4" ${S}/>`,
  stille: `<circle cx="32" cy="32" r="24" fill="${M}" ${S}/><circle cx="24" cy="27" r="3" fill="${B}"/><circle cx="40" cy="27" r="3" fill="${B}"/><path d="M20 41h24" ${S}/><path d="M24 37v8M30 37v8M36 37v8" stroke="${B}" stroke-width="2.5"/><path d="M50 12q6 0 6 6" fill="none" ${S}/>`,
  duell: `<circle cx="20" cy="30" r="13" fill="${G}" ${S}/><circle cx="44" cy="30" r="13" fill="${R}" ${S}/><circle cx="16" cy="28" r="2" fill="${B}"/><circle cx="24" cy="28" r="2" fill="${B}"/><circle cx="40" cy="28" r="2" fill="${B}"/><circle cx="48" cy="28" r="2" fill="${B}"/><path d="M15 36h10M39 36h10" ${S}/><path d="M32 46l-4 12h8z" fill="${O}" ${S}/>`,
  terning: `<rect x="10" y="10" width="44" height="44" rx="8" fill="${P}" ${S}/><circle cx="22" cy="22" r="3.6" fill="${B}"/><circle cx="42" cy="22" r="3.6" fill="${B}"/><circle cx="32" cy="32" r="3.6" fill="${O}"/><circle cx="22" cy="42" r="3.6" fill="${B}"/><circle cx="42" cy="42" r="3.6" fill="${B}"/>`,
  hjul: `<circle cx="32" cy="32" r="24" fill="${P}" ${S}/><path d="M32 8v48M8 32h48M15 15l34 34M49 15L15 49" stroke="${B}" stroke-width="2.5"/><path d="M32 32L32 8A24 24 0 0 1 49 15z" fill="${O}" ${S}/><path d="M32 32L8 32A24 24 0 0 1 15 15z" fill="${M}" ${S}/><circle cx="32" cy="32" r="5" fill="${G}" ${S}/><path d="M32 2l-4 6h8z" fill="${B}"/>`,
  krone: `<path d="M8 46l-2-28 14 12 12-18 12 18 14-12-2 28z" fill="${G}" ${S}/><rect x="8" y="46" width="48" height="8" fill="${O}" ${S}/><circle cx="32" cy="34" r="4" fill="${R}" ${S}/>`,
  gris: `<circle cx="32" cy="34" r="22" fill="${R}" ${S}/><path d="M14 18l4 10 8-6zM50 18l-4 10-8-6z" fill="${R}" ${S}/><ellipse cx="32" cy="40" rx="10" ry="7" fill="#FF7FB0" ${S}/><circle cx="28" cy="40" r="1.8" fill="${B}"/><circle cx="36" cy="40" r="1.8" fill="${B}"/><circle cx="23" cy="29" r="2.4" fill="${B}"/><circle cx="41" cy="29" r="2.4" fill="${B}"/>`,
  buss: `<rect x="6" y="14" width="52" height="34" rx="6" fill="${G}" ${S}/><rect x="12" y="20" width="12" height="10" fill="${P}" ${S}/><rect x="28" y="20" width="12" height="10" fill="${P}" ${S}/><rect x="44" y="20" width="8" height="18" fill="${P}" ${S}/><path d="M6 38h38" ${S}/><circle cx="18" cy="50" r="6" fill="${B}"/><circle cx="46" cy="50" r="6" fill="${B}"/>`,
  pyramide: `<rect x="22" y="8" width="20" height="14" rx="2" fill="${O}" ${S}/><rect x="12" y="25" width="20" height="14" rx="2" fill="${P}" ${S}/><rect x="34" y="25" width="20" height="14" rx="2" fill="${M}" ${S}/><rect x="2" y="42" width="20" height="14" rx="2" fill="${R}" ${S}/><rect x="24" y="42" width="18" height="14" rx="2" fill="${G}" ${S}/><rect x="44" y="42" width="18" height="14" rx="2" fill="${P}" ${S}/>`,
  hest: `<path d="M10 54l6-20c2-10 10-16 20-16l8-8 4 4-2 6 8 10-6 4-6-4-4 6v18z" fill="#B9773F" ${S}/><circle cx="44" cy="20" r="1.8" fill="${B}"/><path d="M24 22q-6-4-10 0" fill="none" stroke="${O}" stroke-width="4" stroke-linecap="round"/><rect x="26" y="32" width="12" height="10" fill="${P}" ${S}/>`,
  bingo: `<rect x="8" y="8" width="48" height="48" rx="4" fill="${P}" ${S}/><path d="M24 8v48M40 8v48M8 24h48M8 40h48" stroke="${B}" stroke-width="2.5"/><circle cx="16" cy="16" r="5" fill="${O}" ${S}/><circle cx="32" cy="32" r="5" fill="${O}" ${S}/><circle cx="48" cy="48" r="5" fill="${O}" ${S}/>`,
  pil: `<path d="M20 30V8M20 8l-9 9M20 8l9 9" fill="none" stroke="${B}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M44 34v22M44 56l-9-9M44 56l9-9" fill="none" stroke="${B}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/><rect x="8" y="36" width="24" height="20" rx="3" fill="${M}" ${S}/><rect x="32" y="8" width="24" height="20" rx="3" fill="${R}" ${S}/>`,
  lapp: `<circle cx="32" cy="38" r="20" fill="${H}" ${S}/><rect x="18" y="8" width="28" height="20" fill="${G}" ${S} transform="rotate(-6 32 18)"/><path d="M27 14q5-6 10 0t-5 5" fill="none" stroke="${B}" stroke-width="2.6" stroke-linecap="round" transform="rotate(-6 32 18)"/><circle cx="25" cy="40" r="2.4" fill="${B}"/><circle cx="39" cy="40" r="2.4" fill="${B}"/><path d="M27 49q5 3 10 0" fill="none" ${S}/>`,
  bobler: `<path d="M6 12h30v20H18l-8 7v-7H6z" fill="${P}" ${S}/><path d="M28 30h30v20h-4v7l-8-7H28z" fill="${G}" ${S}/><path d="M13 22h16M35 40h16" ${S}/>`,
  peke: `<circle cx="32" cy="32" r="24" fill="${G}" ${S}/><circle cx="24" cy="28" r="3" fill="${B}"/><circle cx="40" cy="28" r="3" fill="${B}"/><path d="M22 40q10 7 20 0" fill="none" ${S}/><path d="M50 10l6-4M54 18l6-1" ${S}/>`,
  aldri: `<circle cx="32" cy="32" r="24" fill="${R}" ${S}/><path d="M21 28q3-4 6 0M37 28q3-4 6 0" fill="none" ${S}/><path d="M24 42h16" ${S}/><path d="M46 14q6-2 8 4" fill="none" ${S}/><circle cx="51" cy="24" r="2.6" fill="${M}" ${S}/>`,
  enten: `<circle cx="32" cy="32" r="24" fill="${M}" ${S}/><circle cx="24" cy="29" r="3" fill="${B}"/><path d="M36 29h8" ${S}/><path d="M26 42q6-4 12 0" fill="none" ${S}/><path d="M32 2v8M32 54v8" ${S}/>`,
  ring: `<circle cx="32" cy="32" r="20" fill="none" stroke="${O}" stroke-width="8"/><circle cx="32" cy="32" r="20" fill="none" stroke="${B}" stroke-width="2" stroke-dasharray="3 6"/><path d="M26 22h12l-2 22h-8z" fill="${G}" ${S}/><path d="M26 30h12" ${S}/>`,
  liste: `<rect x="12" y="6" width="40" height="52" rx="3" fill="${P}" ${S}/><path d="M20 18h24M20 28h24M20 38h16" ${S}/><circle cx="44" cy="46" r="7" fill="${M}" ${S}/>`,
  rygg: `<circle cx="20" cy="22" r="10" fill="${H}" ${S}/><circle cx="44" cy="22" r="10" fill="#8D5A3B" ${S}/><path d="M8 58V44a12 12 0 0 1 24 0v14zM32 58V44a12 12 0 0 1 24 0v14z" fill="${G}" ${S}/><path d="M20 12a10 10 0 0 1 10 8l-10 2zM44 12a10 10 0 0 0-10 8l10 2z" fill="${B}"/>`,
  mane: `<circle cx="32" cy="32" r="22" fill="#1C1B1F" ${S}/><path d="M38 16a16 16 0 1 0 10 26a13 13 0 1 1-10-26z" fill="#FFE07A" ${S}/><path d="M18 18l1 3M14 30h3" stroke="#FFE07A" stroke-width="3" stroke-linecap="round"/>`,
  kalender: `<rect x="8" y="14" width="48" height="42" fill="${P}" ${S}/><rect x="8" y="14" width="48" height="12" fill="${O}" ${S}/><path d="M20 8v10M44 8v10" ${S}/><path d="M22 40l6 6 14-14" fill="none" stroke="${B}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>`,
  glass: `<path d="M18 10h28l-4 26a10 10 0 0 1-20 0z" fill="${G}" ${S}/><path d="M20 22h24" ${S}/><path d="M32 46v10M22 58h20" ${S}/><circle cx="28" cy="16" r="1.6" fill="${P}"/><circle cx="36" cy="28" r="1.6" fill="${P}"/>`,
  kompass: `<circle cx="32" cy="32" r="24" fill="${P}" ${S}/><path d="M32 14l6 18-6 18-6-18z" fill="${O}" ${S}/><circle cx="32" cy="32" r="3.5" fill="${B}"/>`,
  hjerte: `<path d="M32 54S8 40 8 24a12 12 0 0 1 24-4 12 12 0 0 1 24 4c0 16-24 30-24 30z" fill="${R}" ${S}/><path d="M18 22q2-6 8-6" fill="none" stroke="${P}" stroke-width="3" stroke-linecap="round"/>`,
  sveip: `<rect x="14" y="12" width="30" height="40" rx="4" fill="${R}" ${S} transform="rotate(-10 29 32)"/><rect x="20" y="12" width="30" height="40" rx="4" fill="${P}" ${S}/><path d="M28 30q7-4 14 0" fill="none" ${S}/><path d="M50 50l8-4-4 8" fill="none" ${S}/>`,
  ordbok: `<path d="M10 12h20a6 6 0 0 1 6 6v38a6 6 0 0 0-6-6H10z" fill="${M}" ${S}/><path d="M54 12H38a6 6 0 0 0-6 6v38a6 6 0 0 1 6-6h16z" fill="${P}" ${S}/><path d="M40 24h8M40 32h8" ${S}/>`,
};

// Hvilken lek får hvilket merke
const LEK: Record<string, string> = {
  'spionen': 'muldvarp', 'hvem-skrev-det': 'brev', 'bloffquizen': 'fisk', 'samme-svar': 'sau', 'forraeder': 'nese',
  'regelfabrikken': 'blyant', 'nyhetsrunden': 'avis', 'hemmelig-oppdrag': 'agent', 'tanken-bak-sangen': 'note',
  'skal-refleksen': 'lyn', 'stilleleken': 'stille', 'rask-fakta': 'duell', 'terningen-bestemmer': 'terning',
  'drikkehjulet': 'hjul', 'president': 'krone', 'gris': 'gris', 'bussruta': 'buss', 'pyramiden': 'pyramide',
  'veddelopet': 'hest', 'drikke-bingo': 'bingo', 'over-eller-under': 'pil', 'hvem-er-jeg': 'lapp',
  'to-sannheter-og-en-logn': 'bobler', 'pekeleken': 'peke', 'jeg-har-aldri': 'aldri', 'enten-eller': 'enten',
  'ring-of-fire': 'ring', 'kategorier': 'liste', 'rygg-mot-rygg': 'rygg', 'drikke-yatzy': 'terning',
};

/** Navnet på merket som hører til en lek (eller et generelt glass). */
export function merkeFor(slug: string): string { return LEK[slug] || 'glass'; }

/** Ferdig SVG for et merke eller en lek. */
export function klistremerke(navnEllerSlug: string, klasse = 'merke'): string {
  const navn = MERKER[navnEllerSlug] ? navnEllerSlug : merkeFor(navnEllerSlug);
  return `<svg class="${klasse}" viewBox="0 0 64 64" aria-hidden="true" focusable="false">${MERKER[navn]}</svg>`;
}
