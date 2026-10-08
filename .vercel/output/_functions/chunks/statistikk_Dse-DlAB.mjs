import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { n as rpc } from "./spilt_2dqjF3k8.mjs";
import { o as innloggetBruker, r as adminEposter, s as json } from "./konto_Cyp1VvAa.mjs";
//#region src/pages/api/statistikk.ts
var statistikk_exports = /* @__PURE__ */ __exportAll({
	GET: () => GET,
	prerender: () => false
});
var GET = async ({ request }) => {
	try {
		const bruker = await innloggetBruker(request);
		if (!bruker) return json({
			feil: "logg-inn",
			melding: "Logg inn først."
		}, 401);
		const tillatt = adminEposter();
		const q = new URL(request.url).searchParams;
		if (q.get("sjekk")) return json({ ok: tillatt.includes(String(bruker.email || "").toLowerCase()) });
		if (!tillatt.length) return json({
			feil: "oppsett",
			melding: "Legg inn ADMIN_EPOSTER i Vercel for å slå på statistikken."
		}, 403);
		if (!tillatt.includes(String(bruker.email || "").toLowerCase())) return json({
			feil: "nei",
			melding: "Denne kontoen har ikke tilgang."
		}, 403);
		const dager = Math.min(90, Math.max(7, Number(q.get("dager")) || 30));
		return json(await rpc("statistikk", { p_dager: dager }));
	} catch (e) {
		console.warn("Statistikk feilet:", e.message);
		return json({
			feil: "server",
			melding: "Fikk ikke hentet statistikken. Har du kjørt konto-supabase.sql?"
		}, 503);
	}
};
//#endregion
//#region \0virtual:astro:page:src/pages/api/statistikk@_@ts
var page = () => statistikk_exports;
//#endregion
export { page };
