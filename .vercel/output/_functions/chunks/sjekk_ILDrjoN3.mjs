import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { s as json } from "./konto_Cyp1VvAa.mjs";
import { d as vippsKlar, l as sjekkBetaling } from "./pluss_Bsul_2hb.mjs";
//#region src/pages/api/pluss/sjekk.ts
var sjekk_exports = /* @__PURE__ */ __exportAll({
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
	const ref = String(d.ref || "");
	if (!/^bd-[0-9a-f]{20}$/.test(ref)) return json({ feil: "ugyldig" }, 400);
	if (!vippsKlar()) return json({ status: "venter" });
	try {
		return json({ status: await sjekkBetaling(ref) });
	} catch (e) {
		console.warn("Sjekk feilet:", e.message);
		return json({ status: "venter" });
	}
};
//#endregion
//#region \0virtual:astro:page:src/pages/api/pluss/sjekk@_@ts
var page = () => sjekk_exports;
//#endregion
export { page };
