// Når kvelden er over: sesongtabellen, lovboka, pynt til kontoene – og gjengen frigjøres.
// Brukes både av rommet («Avslutt kvelden» i Mer-menyen) og av gjengsiden (en kveld som aldri ble avsluttet).
import { kaaringer, hentRom, endreRom, handling, varsle, kveldForGjeng } from './rom';
import { rpc } from './spilt';
import { etterpaa } from './etterpaa';
import { laasOppForKveld } from './pynt.js';
import { kveldInn } from './lovbok';

/** Etter kvelden: tell kvelden på hver konto, og lås opp pynt etter kåringene. Det nye vises i oppsummeringen. */
export async function delUtPynt(kode: string, data: any) {
  try {
    const med = data.spillere.filter((p: any) => p.konto || p.bruker).map((p: any) => ({ id: p.id, konto: p.konto || p.bruker }));
    const kvelder: Record<string, number> = {};
    for (const p of med) { try { kvelder[p.konto] = Number(await rpc('kveld_tell', { p_user: p.konto })) || 0; } catch { kvelder[p.konto] = 0; } }
    const ka = kaaringer(data).filter((k: any) => k.kode && k.id).map((k: any) => ({ kode: k.kode, id: k.id }));
    const nye = laasOppForKveld({ kaaringer: ka, spillere: med, kvelder, gjengKveld: !!data.gjengKveld, naa: Date.now() });
    const nyPynt: Record<string, string[]> = {};
    for (const p of med) {
      const ider = nye[p.konto] || []; if (!ider.length) continue;
      const fikk: any = await rpc('pynt_laas_opp', { p_user: p.konto, p_ider: ider });
      if (Array.isArray(fikk) && fikk.length) nyPynt[p.id] = fikk;
    }
    const r: any = await endreRom(kode, (d) => { d.pyntDelt = true; if (Object.keys(nyPynt).length) d.nyPynt = nyPynt; return { ok: true }; });
    if (!r.feil && Object.keys(nyPynt).length) await varsle(kode, r.versjon);
  } catch (e) { console.warn('Pynt ble ikke delt ut:', (e as Error).message); }
}

export const kveldId = (data: any, kode: string) => kode + '-' + data.laget;

/** Leser og lagrer lovboka med versjonssjekk, så to telefoner ikke overskriver hverandre. */
export async function endreBok(gjengId: string, endring: (bok: any) => any) {
  for (let i = 0; i < 4; i++) {
    const cur = await rpc('gjeng_lov_hent', { p_gjeng: gjengId });
    if (!cur) return null;
    const ny = endring(cur.lov);
    if (!ny) return null;
    const v = await rpc('gjeng_lov_lagre', { p_gjeng: gjengId, p_lov: ny, p_versjon: cur.versjon });
    if (v !== null && v !== undefined) return ny;
  }
  return null;
}

/** Alt kvelden skal skrive i lovboka: vinner, Børskonge, formuen til medlemmene og aksjer som venter på stemmer. */
export function kveldData(data: any, kode: string, p: any, bk: any) {
  const e = (data.kveld && data.kveld.eksport) || null;
  const sp = (id: string) => data.spillere.find((x: any) => x.id === id);
  const tekst = (q: any, l: 'no' | 'en') => (q && typeof q === 'object' ? q[l] || q.no : String(q || ''));
  return {
    vinner: p ? { navn: p.navn, konto: p.konto || null } : null, borskonge: bk ? { navn: bk.navn, konto: bk.konto || null } : null,
    lommer: data.spillere.filter((x: any) => x.konto).map((x: any) => ({ konto: x.konto, navn: x.navn, saldo: e && e.saldoer && e.saldoer[x.id] != null ? e.saldoer[x.id] : null })),
    utsatte: e ? e.utsatte.map((u: any) => {
      const melder = sp(u.melder), subjekt = u.subjekt ? sp(u.subjekt) : null, stemmer: any = {};
      Object.entries(u.stemmer || {}).forEach(([id, v]) => { const x = sp(id); if (x && x.konto) stemmer[x.konto] = v; });
      return { id: kveldId(data, kode) + '-' + u.id, q: tekst(u.q, 'no'), qEn: tekst(u.q, 'en'), type: u.type,
        utfallNavn: u.type === 'hvem' ? (subjekt ? subjekt.navn : '?') : 'Ja',
        melderNavn: melder ? melder.navn : '?', melderKonto: melder && melder.konto ? melder.konto : null,
        subjektKonto: subjekt && subjekt.konto ? subjekt.konto : null, subjektNavn: subjekt ? subjekt.navn : null, stemmer,
        holdere: u.holdere.map((h: any) => { const x = sp(h.id); return x && x.konto ? { konto: x.konto, navn: x.navn, n: h.n } : null; }).filter(Boolean) };
    }) : [],
  };
}
export async function gjengKveldSlutt(data: any, kode: string) {
  const k = data.kveld || {};
  const p = k.vinner ? data.spillere.find((x: any) => x.id === k.vinner) : null;
  const bk = data.bors && data.bors.slutt && data.bors.slutt.konge ? data.spillere.find((x: any) => x.id === data.bors.slutt.konge) : null;
  try {
    await endreBok(data.gjeng.id, (bok) => kveldInn(bok, kveldId(data, kode), kveldData(data, kode, p, bk)));
  } catch (e) { console.warn('Lovboka ble ikke oppdatert:', (e as Error).message); }
  try { if (data.gjengKveld) await rpc('gjeng_kveld_aktiv_sett', { p_gjeng: data.gjeng.id, p_rom: null }); } catch { /* ikke satt opp */ }
}

/** Alt som skjer etter at «avslutt-kvelden» er gjort i rommet: lagre i sesongen, skriv lovboka, frigjør gjengen, del ut pynt. */
export async function etterAvslutt(kode: string, data: any) {
  // Kvelden er over: lagre den i sesongtabellen til gjengen
  if (data.gjeng && data.spillere.length >= 2 && (data.historikk || []).length) {
    try { await rpc('gjeng_kveld_lagre', { p_gjeng: data.gjeng.id, p_rom: kode + '-' + data.laget, p_data: kveldForGjeng(data) }); }
    catch (e) { console.warn('Gjengkvelden ble ikke lagret:', (e as Error).message); }
  }
  // Gjengkveld over: tell kvelden i lovboka (kveldens vinner får velge regel) og frigjør gjengen
  if (data.gjeng) await gjengKveldSlutt(data, kode);
  // Del ut pynt til kontoene som var med (krone til vinneren, kveldstelling osv.)
  if (!data.pyntDelt && data.spillere.some((p: any) => p.konto || p.bruker)) etterpaa(delUtPynt(kode, data));
}

/** En gjengkveld som aldri ble avsluttet: rommet finnes, er ikke ferdig, men er eldre enn vinduet for «pågår nå» (20 timer). */
export async function gammelKveld(gjengId: string): Promise<{ kode: string; data: any } | null> {
  try {
    const kode = await rpc('gjeng_kveld_aktiv', { p_gjeng: gjengId });
    if (!kode || typeof kode !== 'string') return null;
    const rom = await hentRom(kode);
    // Rommet er borte: da er det ingenting å avslutte – gjengen frigjøres med en gang
    if (!rom) { await rpc('gjeng_kveld_aktiv_sett', { p_gjeng: gjengId, p_rom: null }).catch(() => null); return null; }
    if (!rom.data.gjengKveld || rom.data.ferdig || Date.now() - rom.data.laget < 20 * 3600 * 1000) return null;
    return { kode, data: rom.data };
  } catch { return null; }
}

/** Avslutter kvelden på vertens vegne (gjengsiden, eller før en ny kveld startes). Samme som «Avslutt kvelden» i rommet. */
export async function avsluttKveldForGjeng(kode: string): Promise<boolean> {
  const res: any = await endreRom(kode, (data) => {
    if (data.ferdig) return { ok: true };
    const vert = data.spillere.find((p: any) => p.id === data.vert) || data.spillere[0];
    if (!vert) return { feil: 'tom' };
    return handling(data, vert, { handling: 'avslutt-kvelden' });
  });
  if (res.feil) return false;
  etterpaa(varsle(kode, res.versjon));
  await etterAvslutt(kode, res.data);
  return true;
}
