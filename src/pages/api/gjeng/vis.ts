// Én gjeng: sesongtabellen, lovboka og kvelden som pågår. Alle med gjengkoden kan se tabellen (bare navn og tall).
import type { APIRoute } from 'astro';
import { rpc } from '../../../lib/spilt';
import { json, innloggetBruker } from '../../../lib/konto';
import { visBok, ryddUtsatte } from '../../../lib/lovbok';
import { hentRom } from '../../../lib/rom';
export const prerender = false;
export const GET: APIRoute = async ({ request }) => {
  const kode = String(new URL(request.url).searchParams.get('k') || '').trim().toUpperCase();
  if (!/^[A-Z0-9]{8}$/.test(kode)) return json({ feil: 'kode', melding: 'Ugyldig gjengkode.' }, 400);
  const lang = /^en/.test(request.headers.get('x-lang') || '') ? 'en' : 'no';
  try {
    const g = await rpc('gjeng_hent', { p_kode: kode });
    if (!g) return json({ feil: 'finnes-ikke', melding: 'Fant ikke gjengen. Kanskje den er slettet?' }, 404);
    // Hvem som eier gjengen avsløres ikke – bare om det er deg
    let eier = false, medlem = false;
    const u = await innloggetBruker(request).catch(() => null);
    if (u) {
      eier = g.eier === u.id;
      medlem = eier || !!(await rpc('gjeng_tilgang', { p_user: u.id, p_id: g.id }));
    }
    let antall = 0;
    try { antall = Number(await rpc('gjeng_antall', { p_gjeng: g.id })) || 0; } catch { /* ikke satt opp */ }
    // Lovboka – uten konto-id-er. Finnes ikke tabellen ennå, vises den bare ikke.
    let lovbok = null;
    try {
      let l = await rpc('gjeng_lov_hent', { p_gjeng: g.id });
      // Aksjer som har ventet på stemmer i over 48 timer, avgjøres nå
      if (l) { const r = ryddUtsatte(l.lov); if (r.endret) { const v = await rpc('gjeng_lov_lagre', { p_gjeng: g.id, p_lov: r.bok, p_versjon: l.versjon }); if (v != null) l = { lov: r.bok, versjon: v }; } }
      if (l) lovbok = visBok(l.lov, medlem && u ? u.id : null, lang, antall);
    } catch { /* ikke satt opp */ }
    // Kvelden som pågår: bare medlemmer får vite om den (og blir med uten kode)
    let kveld = null;
    if (medlem) {
      try {
        const rk = await rpc('gjeng_kveld_aktiv', { p_gjeng: g.id });
        const rom = typeof rk === 'string' && rk ? await hentRom(rk) : null;
        if (rom && rom.data.gjengKveld && !rom.data.ferdig && Date.now() - rom.data.laget < 20 * 3600 * 1000) {
          const vert = rom.data.spillere.find((p: any) => p.id === rom.data.vert);
          kveld = { kode: rk, vert: vert ? vert.navn : '', antall: rom.data.spillere.length, plan: rom.data.plan || [], laget: rom.data.laget,
            erMed: !!(u && rom.data.spillere.some((p: any) => p.konto === u.id)) };
        }
      } catch { /* ikke satt opp */ }
    }
    return json({ id: g.id, navn: g.navn, kode: g.kode, kvelder: g.kvelder || [], eier, medlem, innlogget: !!u, lovbok, kveld, antall });
  } catch (e) {
    console.warn('Gjeng kunne ikke hentes:', (e as Error).message);
    return json({ feil: 'server', melding: 'Fikk ikke hentet gjengen akkurat nå.' }, 503);
  }
};
