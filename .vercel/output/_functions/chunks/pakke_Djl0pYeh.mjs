import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { o as innloggetBruker, s as json } from "./konto_Cyp1VvAa.mjs";
import { i as harPluss } from "./pluss_Bsul_2hb.mjs";
import { m as pakkeKort, t as PAKKER } from "./rom_CLYEJdd8.mjs";
//#region src/pages/api/pluss/pakke.ts
var pakke_exports = /* @__PURE__ */ __exportAll({
	GET: () => GET,
	prerender: () => false
});
var GET = async ({ request }) => {
	const id = new URL(request.url).searchParams.get("id") || "";
	const kort = pakkeKort(id);
	const info = PAKKER.find((p) => p.pakke === id);
	if (!kort || !info) return json({ feil: "finnes-ikke" }, 404);
	const u = await innloggetBruker(request).catch(() => null);
	if (u ? await harPluss(u.id) : false) return json({
		navn: info.navn,
		pluss: true,
		kort: kort.map((x) => ({
			t: x.t,
			k: x.k || ""
		}))
	});
	const smak = kort.slice(0, 3).map((x) => ({
		t: x.t,
		k: x.k || ""
	}));
	return json({
		navn: info.navn,
		pluss: false,
		kort: smak,
		antall: kort.length
	});
};
//#endregion
//#region \0virtual:astro:page:src/pages/api/pluss/pakke@_@ts
var page = () => pakke_exports;
//#endregion
export { page };
