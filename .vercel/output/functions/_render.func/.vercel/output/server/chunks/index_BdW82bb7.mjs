import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { n as rpc } from "./spilt_2dqjF3k8.mjs";
import { o as innloggetBruker, s as json } from "./konto_Cyp1VvAa.mjs";
//#region src/pages/api/verv/index.ts
var verv_exports = /* @__PURE__ */ __exportAll({
	GET: () => GET,
	POST: () => POST,
	prerender: () => false
});
var GET = async ({ request }) => {
	try {
		const u = await innloggetBruker(request);
		if (!u) return json({
			feil: "logg-inn",
			melding: "Logg inn for å få din vervelenke."
		}, 401);
		const v = await rpc("verv_min", { p_user: u.id });
		return json({
			kode: v && v.kode,
			antall: Number(v && v.antall || 0),
			kveldspass: Number(v && v.kveldspass || 0)
		});
	} catch (e) {
		console.warn("Verving feilet:", e.message);
		return json({
			feil: "server",
			melding: "Fikk ikke hentet vervelenken akkurat nå."
		}, 503);
	}
};
var POST = async ({ request }) => {
	try {
		const u = await innloggetBruker(request);
		if (!u) return json({
			feil: "logg-inn",
			melding: "Logg inn først."
		}, 401);
		const r = await rpc("kveldspass_bruk", { p_user: u.id });
		if (!r || !r.ok) return json({
			feil: "tomt",
			melding: "Du har ingen lagrede kveldspass."
		}, 409);
		return json({
			ok: true,
			...r.status
		});
	} catch (e) {
		console.warn("Kveldspass feilet:", e.message);
		return json({
			feil: "server",
			melding: "Det gikk ikke akkurat nå. Prøv igjen."
		}, 503);
	}
};
//#endregion
//#region \0virtual:astro:page:src/pages/api/verv/index@_@ts
var page = () => verv_exports;
//#endregion
export { page };
