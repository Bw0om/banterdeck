// Feil på siden. To veier inn:
// 1) «Noe galt?»: lager et GitHub-issue med merket «feil», så du får beskjed på e-post fra GitHub.
//    Bruker samme GITHUB_TOKEN og GITHUB_REPO som forslagene. Ingen navn eller e-post samles inn.
// 2) Automatisk feilfangst (auto: 1, fra components/FeilFangst.astro): tekniske feil fra nettleseren lagres
//    anonymt i feilloggen (feillogg-supabase.sql) – se dem på /no/feillogg. Lagres: melding, fil og linje,
//    side uten ?-delen, grov nettlesertype og byggversjon. Aldri IP-adresse, hele nettleserstrengen,
//    navn, romkode eller innhold.
import type { APIRoute } from 'astro';
import { createHash } from 'node:crypto';
import { GITHUB_REPO } from '../../config';
import { json } from '../../lib/konto';
import { rpc } from '../../lib/spilt';
import { etterpaa } from '../../lib/etterpaa';
export const prerender = false;

const siste = new Map<string, number>();
export const POST: APIRoute = async ({ request, clientAddress }) => {
  let d: any;
  try {
    const tekst = await request.text();
    if (tekst.length > 12000) return json({ ok: false }, 413);
    d = JSON.parse(tekst);
  } catch { return json({ ok: false }, 400); }
  if (!d || typeof d !== 'object') return json({ ok: false }, 400);
  if (d.auto) return autoFeil(d, request, clientAddress);
  if (d.website) return json({ ok: true });
  const rens = (x: any, n: number) => String(x == null ? '' : x).replace(/[\u0000-\u0008\u000b-\u001f]/g, '').trim().slice(0, n);
  const tekst = rens(d.tekst, 1500);
  if (tekst.length < 5) return json({ ok: false, error: 'Skriv litt om hva som skjedde.' }, 400);
  // Enkel bremse: én rapport per halve minutt fra samme adresse
  const ip = String(clientAddress || request.headers.get('x-forwarded-for') || '?');
  const naa = Date.now();
  if (naa - (siste.get(ip) || 0) < 30000) return json({ ok: false, error: 'Vent litt før du sender en ny.' }, 429);
  siste.set(ip, naa);
  const k = d.kontekst || {};
  const linjer = [
    tekst, '', '---',
    `**Side:** ${rens(k.side, 200)}`,
    k.rom ? `**Rom:** ${rens(k.rom, 10)} · **lek:** ${rens(k.lek, 40)} · **fase:** ${rens(k.fase, 40)} · **versjon:** ${rens(k.versjon, 12)}` : '',
    k.vert !== undefined ? `**Er vert:** ${k.vert ? 'ja' : 'nei'} · **spillere:** ${rens(k.spillere, 4)}` : '',
    `**Nettleser:** ${rens(request.headers.get('user-agent'), 200)}`,
    `**Tid:** ${new Date().toISOString()}`,
  ].filter((x, i) => x !== '' || i < 2);
  const env: any = (typeof process !== 'undefined' && process.env) || {};
  const token = env.GITHUB_TOKEN, repo = env.GITHUB_REPO || GITHUB_REPO;
  if (!token || !repo) return json({ ok: false, error: 'Feilrapporter er ikke satt opp ennå.' }, 500);
  const r = await fetch(`https://api.github.com/repos/${repo}/issues`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: `Feil: ${tekst.slice(0, 60)}`, body: linjer.join('\n'), labels: ['feil'] }),
  });
  if (!r.ok) return json({ ok: false, error: `Fikk ikke sendt (${r.status}).` }, 502);
  return json({ ok: true });
};

/* ---------- automatisk feilfangst ---------- */
// Bremser per serverinstans: maks 40 feil i minuttet totalt, og 6 fra samme telefon. Adressen holdes bare
// i minnet, som en hash, i ett minutt – den lagres aldri.
const auto = { vindu: 0, antall: 0, perKilde: new Map<string, number>() };
const AUTO_PER_MIN = 40, AUTO_PER_KILDE = 6;
const tom = () => new Response(null, { status: 204 });

/** Fjerner alt som kan si noe om hvem: adresser blir til stien (uten ?-delen), e-poster forsvinner. */
function vask(x: any, n: number) {
  return String(x == null ? '' : x)
    .replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, ' ')
    .replace(/https?:\/\/[^\s)'"]+/g, (m) => {
      const lk = (m.match(/(:\d+){1,2}$/) || [''])[0];
      try { return new URL(m.slice(0, m.length - lk.length)).pathname + lk; } catch { return '[adresse]'; }
    })
    .replace(/(\/[\w./%-]*)\?[^\s)'":]*/g, '$1')
    .replace(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g, '[e-post]')
    .trim().slice(0, n);
}

/** Grov nettlesertype, f.eks. «Safari 18 · iOS» eller «Snapchat · Android». Aldri hele strengen. */
function nettleserNavn(ua: string) {
  const v = (re: RegExp) => { const x = ua.match(re); return x ? ' ' + x[1].split('.')[0] : ''; };
  let n = 'Annen';
  if (/Snapchat/i.test(ua)) n = 'Snapchat';
  else if (/Instagram/i.test(ua)) n = 'Instagram';
  else if (/FBAN|FBAV|FB_IAB|Messenger/i.test(ua)) n = 'Facebook';
  else if (/TikTok|musical_ly|BytedanceWebview/i.test(ua)) n = 'TikTok';
  else if (/Edg(A|iOS)?\//.test(ua)) n = 'Edge' + v(/Edg(?:A|iOS)?\/([\d.]+)/);
  else if (/SamsungBrowser/.test(ua)) n = 'Samsung' + v(/SamsungBrowser\/([\d.]+)/);
  else if (/OPR\/|Opera/.test(ua)) n = 'Opera' + v(/OPR\/([\d.]+)/);
  else if (/Firefox\/|FxiOS/.test(ua)) n = 'Firefox' + v(/(?:Firefox|FxiOS)\/([\d.]+)/);
  else if (/CriOS|Chrome\//.test(ua)) n = 'Chrome' + v(/(?:CriOS|Chrome)\/([\d.]+)/);
  else if (/Safari\//.test(ua)) n = 'Safari' + v(/Version\/([\d.]+)/);
  const os = /iPhone|iPad|iPod/.test(ua) ? 'iOS' : /Android/.test(ua) ? 'Android' : /Mac OS X|Macintosh/.test(ua) ? 'Mac'
    : /Windows/.test(ua) ? 'Windows' : /CrOS/.test(ua) ? 'ChromeOS' : /Linux/.test(ua) ? 'Linux' : '';
  return (n + (os ? ' · ' + os : '')).slice(0, 40);
}

function autoFeil(d: any, request: Request, clientAddress: string | undefined) {
  const ua = String(request.headers.get('user-agent') || '');
  if (!ua || /bot|crawl|spider|slurp|headless|lighthouse|pagespeed|preview|facebookexternalhit/i.test(ua)) return tom();
  // Bremsen
  const naa = Date.now();
  if (naa - auto.vindu > 60000) { auto.vindu = naa; auto.antall = 0; auto.perKilde.clear(); }
  const ip = String(clientAddress || request.headers.get('x-forwarded-for') || '?');
  const hvem = createHash('sha256').update(ip).digest('base64').slice(0, 12);
  const fraHer = (auto.perKilde.get(hvem) || 0) + 1;
  auto.perKilde.set(hvem, fraHer);
  if (++auto.antall > AUTO_PER_MIN || fraHer > AUTO_PER_KILDE) return tom();

  const melding = vask(d.melding, 300).replace(/^Uncaught\s+/, '');   // Chrome skriver «Uncaught» foran, Safari ikke
  if (melding.length < 3) return tom();
  const kilde = vask(d.kilde, 200), side = vask(String(d.side || '').split(/[?#]/)[0], 120);
  // Samme feil i et nytt bygg skal bli samme rad: uten linjenummer og uten hashen i filnavnet
  const fil = kilde.replace(/(:\d+){1,2}$/, '').replace(/\.[\w-]{8}(?=\.js$)/, '');
  const nokkel = createHash('sha256').update(melding.replace(/\d+/g, '#') + '|' + fil).digest('hex').slice(0, 32);
  etterpaa(rpc('registrer_feil', {
    p_nokkel: nokkel, p_melding: melding, p_kilde: kilde, p_side: side, p_stakk: vask(d.stakk, 1200),
    p_nettleser: nettleserNavn(ua), p_versjon: vask(d.versjon, 20), p_kontekst: vask(d.kontekst, 120),
  }));
  return tom();
}
