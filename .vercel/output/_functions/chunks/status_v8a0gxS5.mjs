import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { o as innloggetBruker, s as json } from "./konto_Cyp1VvAa.mjs";
import { a as plussStatus, d as vippsKlar } from "./pluss_Bsul_2hb.mjs";
//#region src/pages/api/pluss/status.ts
var status_exports = /* @__PURE__ */ __exportAll({
	GET: () => GET,
	prerender: () => false
});
var GET = async ({ request }) => {
	try {
		const u = await innloggetBruker(request);
		if (!u) return json({
			innlogget: false,
			aktiv: false,
			kanKjope: vippsKlar()
		});
		return json({
			innlogget: true,
			...await plussStatus(u.id),
			kanKjope: vippsKlar()
		});
	} catch (e) {
		console.warn("Pluss-status feilet:", e.message);
		return json({
			feil: "server",
			melding: "Fikk ikke sjekket Pluss akkurat nå."
		}, 503);
	}
};
//#endregion
//#region \0virtual:astro:page:src/pages/api/pluss/status@_@ts
var page = () => status_exports;
//#endregion
export { page };
