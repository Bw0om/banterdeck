// Lager ukas Nyhetsrunden fra sakene hos NRK, VG og TV 2 – med Claude.
// Kjøres av GitHub Actions hver torsdag (se .github/workflows/nyhetsrunden.yml).
// Skriver src/data/nyhetsrunden/ÅÅÅÅ-UU.json og pr-body.md til gjennomlesing.
import fs from 'node:fs';

const NOKKEL = process.env.ANTHROPIC_API_KEY;
const MODELL = process.env.NYHETSRUNDEN_MODELL || 'claude-sonnet-5';
const KILDER = [
  ['NRK', 'https://www.nrk.no/toppsaker.rss'],
  ['VG', 'https://www.vg.no/rss/feed'],
  ['TV 2', 'https://www.tv2.no/rss/nyheter'],
];
if (!NOKKEL) { console.error('Mangler ANTHROPIC_API_KEY (legg den inn under Settings → Secrets → Actions).'); process.exit(1); }

function isoUke(d) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dag = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - dag);
  const start = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return { aar: t.getUTCFullYear(), uke: Math.ceil(((t - start) / 86400000 + 1) / 7) };
}
const iDag = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Oslo' }));
const { aar, uke } = isoUke(iDag);
const id = `${aar}-${String(uke).padStart(2, '0')}`;
const fil = `src/data/nyhetsrunden/${id}.json`;
const ut = (k, v) => process.env.GITHUB_OUTPUT && fs.appendFileSync(process.env.GITHUB_OUTPUT, `${k}=${v}\n`);
ut('id', id); ut('uke', String(uke));
if (fs.existsSync(fil) && !process.env.TVING) { console.log(`${fil} finnes allerede – hopper over.`); ut('skip', 'true'); process.exit(0); }

// 1) Hent ukas saker fra RSS
const rens = (s) => (s || '').replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]+>/g, '')
  .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
const grense = Date.now() - 8 * 86400000;
const saker = [];
for (const [navn, url] of KILDER) {
  try {
    const xml = await (await fetch(url, { headers: { 'User-Agent': 'Banterdeck Nyhetsrunden (banterdeck.com)' } })).text();
    for (const it of xml.match(/<item>[\s\S]*?<\/item>/g) || []) {
      const f = (tag) => rens((it.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`)) || [])[1]);
      const dato = Date.parse(f('pubDate'));
      if (dato && dato < grense) continue;
      saker.push(`- [${navn}] ${f('title')} — ${f('description').slice(0, 180)} (${f('link')})`);
    }
  } catch (e) { console.warn(`Klarte ikke å hente ${navn}: ${e.message}`); }
}
console.log(`Fant ${saker.length} saker fra RSS.`);

// 2) La Claude skrive runden
const SYSTEM = `Du lager «Nyhetsrunden» for Banterdeck – en norsk drikkelek der ukas nyheter blir spørsmål som går på rundgang rundt bordet.

REGLER FOR INNHOLD
- Bare saker publisert de siste sju dagene hos NRK, VG eller TV 2.
- ALDRI ulykker, dødsfall, alvorlig sykdom hos enkeltpersoner, overgrep, vold, ofre for kriminalitet, selvmord, krig eller katastrofer med tap av liv. Ikke heng ut privatpersoner.
- Politikk og samfunn er fint, men nøytralt og faktabasert.
- Velg saker folk har snakket om: kuriøse saker, kjendiser, sport, forbruk, rare vedtak, overraskende tall.
- Skriv alt med egne ord. Ikke kopier setninger fra artiklene.
- Hvert svar skal stå i kilden. Bruk nettsøk til å finne ukas største saker og sjekke fakta. Er du usikker på et faktum, dropp spørsmålet.

FORMAT
- 16 spørsmål: omtrent 7 «valg» (fire alternativer, nøyaktig ett riktig, «svar» er identisk med ett av alternativene), 4 «sant» (svar er «Sant» eller «Tull», minst to skal være «Tull» – en tull-påstand er en troverdig vri på en ekte sak), 3 «tall», 2 «fritt».
- Tone: tørr og leken, som Nytt på nytt – aldri slem. Bokmål.
- «info»: én kort setning som gir svaret litt kontekst (kan være tom).
- «ingress»: én setning som nevner tre av ukas saker.

Svar KUN med JSON, uten forklaring og uten kodeblokk:
{"ingress":"…","sporsmal":[{"type":"valg|sant|tall|fritt","q":"…","alt":["…"],"svar":"…","info":"…","kilde":"NRK|VG|TV 2","url":"https://…"}]}
(«alt» bare for type «valg».)`;

const brukerTekst = `Uke ${uke}, ${aar}. Her er sakene fra RSS de siste dagene. VG gir bare de siste sakene, så søk også etter ukas største saker hos vg.no, nrk.no og tv2.no.\n\n${saker.join('\n')}`;
const meldinger = [{ role: 'user', content: brukerTekst }];
let svar;
for (let runde = 0; runde < 5; runde++) {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': NOKKEL, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({
      model: MODELL, max_tokens: 8000, system: SYSTEM, messages: meldinger,
      tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 8, allowed_domains: ['nrk.no', 'vg.no', 'tv2.no'] }],
    }),
  });
  svar = await r.json();
  if (!r.ok) { console.error('API-feil:', JSON.stringify(svar)); process.exit(1); }
  if (svar.stop_reason !== 'pause_turn') break;       // lange søk kan pause – da fortsetter vi
  meldinger.push({ role: 'assistant', content: svar.content });
}
const tekst = svar.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
const json = tekst.slice(tekst.indexOf('{'), tekst.lastIndexOf('}') + 1);
let data;
try { data = JSON.parse(json); } catch { console.error('Fikk ikke gyldig JSON:\n', tekst.slice(0, 2000)); process.exit(1); }

// 3) Kontroller før den legges fram
const feil = [];
const S = data.sporsmal || [];
if (S.length < 12 || S.length > 20) feil.push(`Uventet antall spørsmål: ${S.length}`);
S.forEach((s, i) => {
  if (!['valg', 'sant', 'tall', 'fritt'].includes(s.type)) feil.push(`#${i + 1}: ukjent type ${s.type}`);
  if (!s.q || !s.svar) feil.push(`#${i + 1}: mangler spørsmål eller svar`);
  if (s.type === 'valg' && !(Array.isArray(s.alt) && s.alt.includes(s.svar))) feil.push(`#${i + 1}: svaret finnes ikke blant alternativene`);
  if (s.type === 'sant' && !['Sant', 'Tull'].includes(s.svar)) feil.push(`#${i + 1}: sant/tull-svar må være «Sant» eller «Tull»`);
  if (s.url && !/^https:\/\/(www\.)?(nrk|vg|tv2)\.no\//.test(s.url)) feil.push(`#${i + 1}: kilden er ikke NRK, VG eller TV 2`);
});
if (feil.length) { console.error('Runden besto ikke kontrollen:\n' + feil.join('\n')); process.exit(1); }

const runde = { aar, uke, publisert: iDag.toISOString().slice(0, 10), tittel: `Nyhetsrunden · uke ${uke}`, ingress: data.ingress, sporsmal: S };
fs.mkdirSync('src/data/nyhetsrunden', { recursive: true });
fs.writeFileSync(fil, JSON.stringify(runde, null, 1) + '\n');
const liste = S.map((s, i) => `${i + 1}. **${s.q}**\n   Svar: ${s.svar}${s.info ? ` – ${s.info}` : ''}\n   Kilde: ${s.url ? `[${s.kilde}](${s.url})` : s.kilde}`).join('\n\n');
fs.writeFileSync('pr-body.md', `## Nyhetsrunden uke ${uke}\n\n_${data.ingress}_\n\nLes gjennom og sjekk at svarene stemmer. Rett direkte i fila hvis noe er feil, og trykk **Merge** når den er klar. Vercel lager en forhåndsvisning du kan teste først.\n\n${liste}\n`);
console.log(`Skrev ${fil} med ${S.length} spørsmål.`);
ut('skip', 'false');
