import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { n as rpc } from "./spilt_2dqjF3k8.mjs";
import { s as json } from "./konto_Cyp1VvAa.mjs";
//#region src/pages/api/stokk/[id].ts
var _id__exports = /* @__PURE__ */ __exportAll({
	GET: () => GET,
	prerender: () => false
});
var GET = async ({ params }) => {
	const id = String(params.id || "");
	if (!/^[0-9a-f-]{36}$/i.test(id)) return json({
		feil: "finnes-ikke",
		melding: "Fant ikke kortstokken."
	}, 404);
	try {
		const d = await rpc("delt_kortstokk", { p_id: id });
		if (!d) return json({
			feil: "finnes-ikke",
			melding: "Kortstokken finnes ikke, eller er ikke delt lenger."
		}, 404);
		return new Response(JSON.stringify(d), { headers: {
			"Content-Type": "application/json",
			"Cache-Control": "public, max-age=0, s-maxage=60"
		} });
	} catch (e) {
		console.warn("Delt kortstokk feilet:", e.message);
		return json({
			feil: "server",
			melding: "Fikk ikke hentet kortstokken. Prøv igjen."
		}, 503);
	}
};
//#endregion
//#region \0virtual:astro:page:src/pages/api/stokk/[id]@_@ts
var page = () => _id__exports;
//#endregion
export { page };
