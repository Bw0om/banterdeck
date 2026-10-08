import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { o as innloggetBruker, s as json } from "./konto_Cyp1VvAa.mjs";
import { d as vippsKlar, t as PRODUKTER, u as startBetaling } from "./pluss_Bsul_2hb.mjs";
//#region src/pages/api/pluss/kjop.ts
var kjop_exports = /* @__PURE__ */ __exportAll({
	POST: () => POST,
	prerender: () => false
});
var POST = async ({ request }) => {
	let d;
	try {
		d = await request.json();
	} catch {
		return json({ feil: "ugyldig" }, 400);
	}
	if (!PRODUKTER[d.produkt]) return json({
		feil: "ugyldig",
		melding: "Ukjent produkt."
	}, 400);
	if (d.samtykke !== true) return json({
		feil: "samtykke",
		melding: "Du må krysse av for at Pluss starter med en gang."
	}, 400);
	if (!vippsKlar()) return json({
		feil: "ikke-klar",
		melding: "Betaling med Vipps kommer snart. Prøv gratiskvelden så lenge!"
	}, 503);
	try {
		const u = await innloggetBruker(request);
		if (!u) return json({
			feil: "logg-inn",
			melding: "Logg inn først, så Pluss havner på kontoen din."
		}, 401);
		const retur = new URL(d.lang === "en" ? "/plus" : "/no/pluss", request.url).toString();
		return json(await startBetaling(u.id, d.produkt, retur));
	} catch (e) {
		console.warn("Kjøp feilet:", e.message);
		return json({
			feil: "server",
			melding: "Fikk ikke startet betalingen. Prøv igjen om litt."
		}, 503);
	}
};
//#endregion
//#region \0virtual:astro:page:src/pages/api/pluss/kjop@_@ts
var page = () => kjop_exports;
//#endregion
export { page };
