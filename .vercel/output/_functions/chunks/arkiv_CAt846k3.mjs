import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { a as Fragment, d as renderTemplate, f as maybeRenderHead, h as defineScriptVars, i as renderComponent, m as addAttribute, w as createAstro } from "./server_Bjx7FWTN.mjs";
import { t as createComponent } from "./compiler_Bf6GLUpQ.mjs";
import { t as $$Base } from "./Base_CrQzSnO-.mjs";
import { a as rundeId, i as publiserteRunder, r as publiseringstid, t as alleRunder } from "./nyhetsrunden_D1RpSAip.mjs";
import { t as $$NyhetsVarsel } from "./NyhetsVarsel_v9bk1ffm.mjs";
//#region src/pages/no/nyhetsrunden/arkiv.astro
var arkiv_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Arkiv,
	file: () => $$file,
	prerender: () => false,
	url: () => $$url
});
createAstro("https://www.mittvors.no");
var $$Arkiv = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$Arkiv;
	const naa = Date.now();
	const runder = publiserteRunder(naa);
	const neste = alleRunder.find((r) => publiseringstid(r) > naa) || null;
	const maks = neste ? Math.max(5, Math.min(300, Math.floor((publiseringstid(neste) - naa) / 1e3))) : 300;
	Astro.response.headers.set("Cache-Control", `public, max-age=0, s-maxage=${maks}, stale-while-revalidate=60`);
	const MND = [
		"januar",
		"februar",
		"mars",
		"april",
		"mai",
		"juni",
		"juli",
		"august",
		"september",
		"oktober",
		"november",
		"desember"
	];
	const grupper = [];
	runder.forEach((r) => {
		const d = new Date(publiseringstid(r) || Date.UTC(r.aar, 0, 1 + (r.uke - 1) * 7));
		const tittel = `${MND[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
		let g = grupper[grupper.length - 1];
		if (!g || g.tittel !== tittel) {
			g = {
				tittel,
				aar: d.getUTCFullYear(),
				runder: []
			};
			grupper.push(g);
		}
		g.runder.push(r);
	});
	const antallSpm = runder.reduce((n, r) => n + (r.sporsmal || []).length, 0);
	const ider = runder.map(rundeId);
	return renderTemplate`${renderComponent($$result, "Base", $$Base, {
		"title": "Nyhetsrunden – arkiv",
		"description": `Alle ${runder.length} ukene av Nyhetsrunden. Ta en gammel uke på nytt – alene med én telefon eller fra hver sin telefon.`,
		"lang": "no",
		"gate": true,
		"bilde": "/og/nyhetsrunden.jpg"
	}, { "default": ($$result) => renderTemplate`${maybeRenderHead($$result)}<p class="crumb"><a href="/no/">Forside</a> › <a href="/no/nyhetsrunden">Nyhetsrunden</a> › Arkiv</p><h1>Nyhetsrunden – arkivet</h1><p class="lead">Husker dere hva som skjedde i vår? Ta en gammel uke på nytt – alene med én telefon eller fra hver sin telefon.</p>${runder.length === 0 ? renderTemplate`<p>Arkivet er tomt ennå. Første runde kommer fredag kl. 12.</p>` : renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": ($$result) => renderTemplate`<div class="stat-tall nra-tall"><div><b>${runder.length}</b><span>uker</span></div><div><b>${antallSpm}</b><span>spørsmål</span></div><div><b id="nraSpilt">–</b><span>du har spilt</span></div></div><div class="nra-verktoy"><input id="nraSok" class="nra-sok" type="search" placeholder="Søk i arkivet – f.eks. «valg» eller «uke 12»" aria-label="Søk i arkivet"><button class="btn gold" id="nraTilfeldig" type="button">🎲 Tilfeldig uke</button><label class="nra-filter"><input type="checkbox" id="nraUspilte"> Bare de jeg ikke har spilt</label></div>${grupper.map((g) => renderTemplate`<section class="nra-gruppe" data-gruppe><h2>${g.tittel.charAt(0).toUpperCase() + g.tittel.slice(1)}</h2><ul class="nra-liste">${g.runder.map((r) => renderTemplate`<li${addAttribute(rundeId(r), "data-id")}${addAttribute(`uke ${r.uke} ${r.aar} ${r.ingress || ""} ${(r.sporsmal || []).map((q) => q.q).join(" ")}`.toLowerCase(), "data-sok")}><a class="nra-hoved"${addAttribute(`/no/nyhetsrunden/${rundeId(r)}`, "href")}><b>Uke ${r.uke}<span class="nra-spilt" hidden> · ✓ spilt</span></b><span>${r.ingress}</span><small>${(r.sporsmal || []).length} spørsmål</small></a><a class="btn ghost small"${addAttribute(`/no/rom?lek=nyhetsrunden&modus=${rundeId(r)}`, "href")}>Spill i rom</a></li>`)}</ul></section>`)}<p id="nraIngen" class="small" hidden>Ingen uker passer søket.</p>` })}`}${renderComponent($$result, "NyhetsVarsel", $$NyhetsVarsel, {})}<p class="small" style="margin-top:22px">Ny runde hver fredag kl. 12, laget fra ukas saker i norske nyhetsmedier.</p><script data-astro-rerun>(function(){${defineScriptVars({ IDER: ider })}
  (function () {
    var sok = document.getElementById('nraSok'); if (!sok || sok.dataset.bound) return; sok.dataset.bound = '1';
    var spilt = []; try { spilt = JSON.parse(localStorage.getItem('bd_nr_spilt') || '[]') || []; } catch (e) {}
    var n = 0;
    document.querySelectorAll('.nra-liste li').forEach(function (li) {
      if (spilt.indexOf(li.dataset.id) !== -1) { li.classList.add('spilt'); li.querySelector('.nra-spilt').hidden = false; n++; }
    });
    document.getElementById('nraSpilt').textContent = n;
    var uspilte = document.getElementById('nraUspilte');
    function filtrer() {
      var q = sok.value.trim().toLowerCase(), bare = uspilte.checked, synlige = 0;
      document.querySelectorAll('.nra-gruppe').forEach(function (g) {
        var her = 0;
        g.querySelectorAll('li').forEach(function (li) {
          var vis = (!q || li.dataset.sok.indexOf(q) !== -1) && (!bare || !li.classList.contains('spilt'));
          li.hidden = !vis; if (vis) her++;
        });
        g.hidden = !her; synlige += her;
      });
      document.getElementById('nraIngen').hidden = synlige > 0;
    }
    sok.addEventListener('input', filtrer);
    uspilte.addEventListener('change', filtrer);
    document.getElementById('nraTilfeldig').addEventListener('click', function () {
      var ikke = IDER.filter(function (id) { return spilt.indexOf(id) === -1; }), liste = ikke.length ? ikke : IDER;
      location.href = '/no/nyhetsrunden/' + liste[Math.floor(Math.random() * liste.length)];
    });
  })();
  })();<\/script>` })}`;
}, "C:/Users/jonas/Documents/GitHub/banterdeck/src/pages/no/nyhetsrunden/arkiv.astro", void 0);
var $$file = "C:/Users/jonas/Documents/GitHub/banterdeck/src/pages/no/nyhetsrunden/arkiv.astro";
var $$url = "/no/nyhetsrunden/arkiv";
//#endregion
//#region \0virtual:astro:page:src/pages/no/nyhetsrunden/arkiv@_@astro
var page = () => arkiv_exports;
//#endregion
export { page };
