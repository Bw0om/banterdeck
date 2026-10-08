import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { n as rpc } from "./spilt_2dqjF3k8.mjs";
import { o as innloggetBruker, s as json } from "./konto_Cyp1VvAa.mjs";
import { t as PRODUKTER } from "./pluss_Bsul_2hb.mjs";
//#region src/pages/api/pluss/kvittering.ts
var kvittering_exports = /* @__PURE__ */ __exportAll({
	GET: () => GET,
	prerender: () => false
});
var GET = async ({ request }) => {
	const ref = String(new URL(request.url).searchParams.get("ref") || "");
	if (!/^bd-[0-9a-f]{20}$/.test(ref)) return json({
		feil: "ugyldig",
		melding: "Ugyldig kvittering."
	}, 400);
	try {
		const u = await innloggetBruker(request);
		if (!u) return json({
			feil: "logg-inn",
			melding: "Logg inn med kontoen som kjøpte."
		}, 401);
		const b = await rpc("betaling_hent", { p_ref: ref });
		if (!b || b.user_id !== u.id) return json({
			feil: "finnes-ikke",
			melding: "Fant ikke kjøpet på denne kontoen."
		}, 404);
		if (b.status !== "fullfort") return json({
			feil: "ikke-fullfort",
			melding: "Kjøpet er ikke fullført."
		}, 409);
		const p = PRODUKTER[b.produkt] || { navn: b.produkt };
		return json({
			ref: b.ref,
			produkt: b.produkt,
			navn: p.navn,
			belopOre: b.belop_ore,
			laget: b.laget,
			fullfort: b.fullfort,
			epost: u.email || ""
		});
	} catch (e) {
		console.warn("Kvittering feilet:", e.message);
		return json({
			feil: "server",
			melding: "Fikk ikke hentet kvitteringen akkurat nå."
		}, 503);
	}
};
//#endregion
//#region \0virtual:astro:page:src/pages/api/pluss/kvittering@_@ts
var page = () => kvittering_exports;
//#endregion
export { page };
