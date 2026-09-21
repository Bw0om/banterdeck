// Serverfunksjon (kjører på Vercel): tar imot forslag fra /forslag og oppretter et GitHub-issue.
// Trenger to miljøvariabler i Vercel: GITHUB_TOKEN (fine-grained, Issues: read & write) og GITHUB_REPO.
import type { APIRoute } from 'astro';
export const prerender = false;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

export const POST: APIRoute = async ({ request }) => {
  let d: any;
  try { d = await request.json(); } catch { return json({ ok: false, error: 'Ugyldig forespørsel' }, 400); }

  // Honeypot: feltet «website» skal alltid være tomt for mennesker.
  if (d.website) return json({ ok: true });

  const line = String(d.line || '').trim();
  const ctx = String(d.ctx || '').trim().slice(0, 120);
  const kategori = String(d.kategori || '').trim().slice(0, 80);
  const navn = String(d.navn || '').trim().slice(0, 60);
  if (line.length < 3 || line.length > 300) return json({ ok: false, error: 'Replikken må være 3–300 tegn' }, 400);

  // process.env leses ved kjøring på Vercel; import.meta.env er reserve for lokal kjøring.
  const env: any = (typeof process !== 'undefined' && process.env) || {};
  const token = env.GITHUB_TOKEN || import.meta.env.GITHUB_TOKEN;
  const repo = env.GITHUB_REPO || import.meta.env.GITHUB_REPO;
  if (!token) return json({ ok: false, error: 'GITHUB_TOKEN mangler i Vercel (Settings → Environment Variables)' }, 500);
  if (!repo) return json({ ok: false, error: 'GITHUB_REPO mangler i Vercel (Settings → Environment Variables)' }, 500);

  const meta = JSON.stringify({ k: kategori, c: ctx, l: line, n: navn });
  const body = [
    `**Kategori:** ${kategori || 'ikke valgt'}`,
    ctx ? `**Kontekst:** ${ctx}` : '',
    `**Replikk:** ${line}`,
    navn ? `**Fra:** ${navn}` : '',
    '',
    `<!-- ${meta} -->`,
  ].filter((x) => x !== '').join('\n');

  const r = await fetch(`https://api.github.com/repos/${repo}/issues`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: `Forslag: ${line.slice(0, 60)}`, body, labels: ['forslag'] }),
  });
  if (!r.ok) {
    let detail = '';
    try { detail = ((await r.json()) as any).message || ''; } catch {}
    return json({ ok: false, error: `GitHub svarte ${r.status}. ${detail}`.trim() }, 502);
  }
  return json({ ok: true });
};
