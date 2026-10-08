import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { n as rpc } from "./spilt_2dqjF3k8.mjs";
//#region src/pages/api/populaert.ts
var populaert_exports = /* @__PURE__ */ __exportAll({
	GET: () => GET,
	prerender: () => false
});
var GET = async () => {
	try {
		const rader = await rpc("populaert", {
			p_dager: 7,
			p_antall: 8
		});
		return new Response(JSON.stringify(rader || []), { headers: {
			"Content-Type": "application/json",
			"Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600"
		} });
	} catch (e) {
		console.warn("Populært feilet:", e.message);
		return new Response("[]", { headers: {
			"Content-Type": "application/json",
			"Cache-Control": "public, s-maxage=60"
		} });
	}
};
//#endregion
//#region \0virtual:astro:page:src/pages/api/populaert@_@ts
var page = () => populaert_exports;
//#endregion
export { page };
