// «Noe galt?»: lager et GitHub-issue med merket «feil», så du får beskjed på e-post fra GitHub.
// Bruker samme GITHUB_TOKEN og GITHUB_REPO som forslagene. Ingen navn eller e-post samles inn.
import type { APIRoute } from 'astro';
import { json } from '../../lib/konto';
export const prerender = false;

const siste = new Map<string, number>();
export const POST: APIRoute = async ({ request, clientAddress }) => {
  let d: any;
  try { d = await request.json(); } catch { return json({ ok: false }, 400); }
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
  const token = env.GITHUB_TOKEN, repo = env.GITHUB_REPO;
  if (!token || !repo) return json({ ok: false, error: 'Feilrapporter er ikke satt opp ennå.' }, 500);
  const r = await fetch(`https://api.github.com/repos/${repo}/issues`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: `Feil: ${tekst.slice(0, 60)}`, body: linjer.join('\n'), labels: ['feil'] }),
  });
  if (!r.ok) return json({ ok: false, error: `Fikk ikke sendt (${r.status}).` }, 502);
  return json({ ok: true });
};
