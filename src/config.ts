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

// Supabase (gratis) for brukerkontoer. Settes som miljøvariabler i Vercel:
// PUBLIC_SUPABASE_URL og PUBLIC_SUPABASE_ANON_KEY. Tomme = kontoer skrudd av.
export const SUPABASE_URL = import.meta.env.PUBLIC_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || '';
