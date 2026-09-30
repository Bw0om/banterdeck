// Minifiserer inline <script>-blokker i de ferdige HTML-sidene etter bygging.
// Astro minifiserer ikke skript med is:inline / define:vars – rommet alene hadde 250 kB uminifisert JavaScript.
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { transform } from 'esbuild';

async function* htmlFiler(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* htmlFiler(p);
    else if (e.name.endsWith('.html')) yield p;
  }
}
const SKRIPT = /<script(\s[^>]*)?>([\s\S]*?)<\/script>/g;

export default function minifyInline() {
  return {
    name: 'minify-inline',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const rot = fileURLToPath(dir);
        let for_ = 0, etter = 0, filer = 0;
        for await (const fil of htmlFiler(rot)) {
          const html = await readFile(fil, 'utf8');
          const deler = []; let sist = 0, endret = false;
          for (const m of html.matchAll(SKRIPT)) {
            const attr = m[1] || '', kode = m[2];
            // Bare vanlige skript med innhold: ikke src, ikke JSON/moduler/maler
            if (/\ssrc=/.test(attr) || /type=["']?(?!text\/javascript)/i.test(attr) || kode.trim().length < 400) continue;
            try {
              const r = await transform(kode, { minify: true, loader: 'js', target: 'es2017', legalComments: 'none' });
              const ny = r.code.trim().replace(/<\/script/gi, '<\\/script');
              if (ny.length < kode.length) {
                deler.push(html.slice(sist, m.index), '<script' + attr + '>' + ny + '</script>');
                sist = m.index + m[0].length; for_ += kode.length; etter += ny.length; endret = true;
              }
            } catch (e) { logger.warn(`Kunne ikke minifisere et skript i ${fil}: ${e.message.split('\n')[0]}`); }
          }
          if (endret) { deler.push(html.slice(sist)); await writeFile(fil, deler.join('')); filer++; }
        }
        logger.info(`Minifiserte inline-skript i ${filer} sider: ${Math.round(for_ / 1024)} kB → ${Math.round(etter / 1024)} kB`);
      },
    },
  };
}
