import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { n as rpc } from "./spilt_2dqjF3k8.mjs";
import { n as adminBruker, s as json } from "./konto_Cyp1VvAa.mjs";
//#region src/pages/api/admin/feillogg.ts
var feillogg_exports = /* @__PURE__ */ __exportAll({
	GET: () => GET,
	POST: () => POST,
	prerender: () => false
});
var ikkeAdmin = () => json({
	feil: "nei",
	melding: "Logg inn med admin-kontoen."
}, 403);
var GET = async ({ request, url }) => {
	if (!await adminBruker(request).catch(() => null)) return ikkeAdmin();
	const dager = Math.max(1, Math.min(365, Number(url.searchParams.get("dager")) || 30));
	try {
		return json({
			liste: await rpc("feillogg_liste", { p_dager: dager }) || [],
			dager
		});
	} catch {
		return json({
			feil: "server",
			melding: "Fikk ikke hentet feilloggen. Har du kjørt feillogg-supabase.sql?"
		}, 503);
	}
};
var POST = async ({ request }) => {
	if (!await adminBruker(request).catch(() => null)) return ikkeAdmin();
	let d;
	try {
		d = await request.json();
	} catch {
		return json({ ok: false }, 400);
	}
	const nokkel = String(d && d.fjern || "").replace(/[^a-f0-9]/g, "").slice(0, 64);
	if (nokkel.length < 8) return json({
		ok: false,
		melding: "Mangler hvilken feil."
	}, 400);
	try {
		await rpc("feillogg_fjern", { p_nokkel: nokkel });
		return json({ ok: true });
	} catch {
		return json({
			ok: false,
			melding: "Fikk ikke fjernet feilen."
		}, 503);
	}
};
//#endregion
//#region \0virtual:astro:page:src/pages/api/admin/feillogg@_@ts
var page = () => feillogg_exports;
//#endregion
export { page };
