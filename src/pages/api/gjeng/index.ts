// Faste gjenger: mine gjenger (GET) og lage, bli med, endre, forlate, slette (POST).
import type { APIRoute } from 'astro';
import { rpc } from '../../../lib/spilt';
import { json, innloggetBruker } from '../../../lib/konto';
export const prerender = false;

const UUID = /^[0-9a-f-]{36}$/i;
const rensNavn = (x: any) => String(x || '').replace(/[\u0000-\u001f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 40);

export const GET: APIRoute = async ({ request }) => {
  try {
    const u = await innloggetBruker(request);
    if (!u) return json({ feil: 'logg-inn', melding: 'Logg inn for å se gjengene dine.' }, 401);
    return json({ gjenger: (await rpc('gjeng_mine', { p_user: u.id })) || [] });
  } catch (e) {
    console.warn('Gjenger feilet:', (e as Error).message);
    return json({ feil: 'server', melding: 'Fikk ikke hentet gjengene akkurat nå.' }, 503);
  }
};

export const POST: APIRoute = async ({ request }) => {
  let d: any;
  try { d = await request.json(); } catch { return json({ feil: 'ugyldig' }, 400); }
  try {
    const u = await innloggetBruker(request);
    if (!u) return json({ feil: 'logg-inn', melding: 'Logg inn eller lag en gratis konto først.' }, 401);
    const id = String(d.id || '');
    switch (d.handling) {
      case 'lag': {
        const navn = rensNavn(d.navn);
        if (!navn) return json({ feil: 'navn', melding: 'Gi gjengen et navn.' }, 400);
        const g = await rpc('gjeng_lag', { p_user: u.id, p_navn: navn });
        if (!g || g.feil) return json({ feil: 'tak', melding: (g && g.melding) || 'Fikk ikke laget gjengen.' }, 400);
        return json({ ok: true, gjeng: g });
      }
      case 'bli-med': {
        const kode = String(d.kode || '').trim().toUpperCase();
        if (!/^[A-Z0-9]{8}$/.test(kode)) return json({ feil: 'kode', melding: 'Gjengkoden har åtte tegn.' }, 400);
        const g = await rpc('gjeng_bli_med', { p_user: u.id, p_kode: kode });
        if (!g || g.feil) return json({ feil: 'kode', melding: (g && g.melding) || 'Fant ikke gjengen.' }, 404);
        return json({ ok: true, gjeng: g });
      }
      case 'endre': {
        const navn = rensNavn(d.navn);
        if (!UUID.test(id) || !navn) return json({ feil: 'ugyldig' }, 400);
        return (await rpc('gjeng_endre', { p_user: u.id, p_id: id, p_navn: navn })) ? json({ ok: true }) : json({ feil: 'eier', melding: 'Bare den som laget gjengen kan endre navnet.' }, 403);
      }
      case 'slett': {
        if (!UUID.test(id)) return json({ feil: 'ugyldig' }, 400);
        return (await rpc('gjeng_slett', { p_user: u.id, p_id: id })) ? json({ ok: true }) : json({ feil: 'eier', melding: 'Bare den som laget gjengen kan slette den.' }, 403);
      }
      case 'forlat': {
        if (!UUID.test(id)) return json({ feil: 'ugyldig' }, 400);
        await rpc('gjeng_forlat', { p_user: u.id, p_id: id });
        return json({ ok: true });
      }
      case 'slett-kveld': {
        const kveld = Number(d.kveld);
        if (!UUID.test(id) || !(kveld > 0)) return json({ feil: 'ugyldig' }, 400);
        return (await rpc('gjeng_kveld_slett', { p_user: u.id, p_gjeng: id, p_kveld: kveld })) ? json({ ok: true }) : json({ feil: 'eier', melding: 'Bare den som laget gjengen kan fjerne kvelder.' }, 403);
      }
    }
    return json({ feil: 'ukjent' }, 400);
  } catch (e) {
    console.warn('Gjeng-handling feilet:', (e as Error).message);
    return json({ feil: 'server', melding: 'Det gikk ikke akkurat nå. Prøv igjen.' }, 503);
  }
};
