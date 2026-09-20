// Innstillinger du redigerer selv.
export const SITE_NAME = 'Banterdeck';
export const TAGLINE = 'Frekke replikker, slengordbok og drikkeleker – klare til bruk.';

// Google AdSense: lim inn client-ID (f.eks. 'ca-pub-1234567890123456') og slot-ID når du er godkjent.
// Tomme strenger = ingen annonser vises.
export const ADSENSE_CLIENT = '';
export const ADSENSE_SLOT = '';

// Kontaktadresse som vises på personvern- og om-siden.
export const CONTACT_EMAIL = 'post@banterdeck.com';

// GitHub-repoet som innholdet ligger i (brukes av /admin og av forslag-funksjonen).
export const GITHUB_REPO = 'Bw0om/lommearsenal';

// Supabase (valgfritt) for brukerkontoer.
// Leses ved BYGGING, så vi kan bruke navnene Vercels Supabase-integrasjon lager selv —
// uten PUBLIC_-prefiks. Verdiene havner uansett i nettsiden, som de skal:
// anon-nøkkelen er laget for å være offentlig, og radsikkerheten (RLS) i databasen
// er det som beskytter dataene. Service-role-nøkkelen må ALDRI brukes her.
const env: any = (typeof process !== 'undefined' && process.env) || {};
const pick = (...names: string[]) => {
  for (const n of names) {
    const v = env[n] || (import.meta.env as any)[n];
    if (v) return String(v);
  }
  return '';
};

export const supabaseUrl = () => pick(
  'SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_URL',
  'PUBLIC_SUPABASE_URL',
);

export const supabaseAnonKey = () => pick(
  'SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_PUBLISHABLE_KEY',
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  'PUBLIC_SUPABASE_ANON_KEY',
);

// Beholdt for sider som bygges på forhånd (personvernsiden).
export const SUPABASE_URL = supabaseUrl();

/** Diagnose: hvilke Supabase-navn finnes akkurat nå? Viser KUN navn, aldri verdier. */
export const supabaseDebug = () => {
  const e: any = (typeof process !== 'undefined' && process.env) || {};
  const found = Object.keys(e).filter((k) => /SUPABASE/i.test(k)).sort();
  return {
    runtime: typeof process !== 'undefined' ? 'ja' : 'nei',
    antall: Object.keys(e).length,
    funnet: found.length ? found.join(', ') : '(ingen)',
  };
};
