import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { l as sjekkBetaling, r as gyldigWebhook } from "./pluss_Bsul_2hb.mjs";
//#region src/pages/api/vipps/webhook.ts
var webhook_exports = /* @__PURE__ */ __exportAll({
	POST: () => POST,
	prerender: () => false
});
var POST = async ({ request }) => {
	const kropp = await request.text();
	let ok = false;
	try {
		ok = await gyldigWebhook(request, kropp);
	} catch (e) {
		console.warn("Vipps-varsel: fikk ikke sjekket signaturen:", e.message);
		return new Response("feil", { status: 500 });
	}
	if (!ok) {
		console.warn("Vipps-varsel med ugyldig signatur avvist.");
		return new Response("ugyldig", { status: 401 });
	}
	let d = {};
	try {
		d = JSON.parse(kropp);
	} catch {
		return new Response("ok");
	}
	const ref = String(d.reference || "");
	if (!/^bd-[0-9a-f]{20}$/.test(ref)) return new Response("ok");
	try {
		const status = await sjekkBetaling(ref);
		console.log("Vipps-varsel " + (d.name || "?") + " for " + ref + " → " + status);
		return new Response("ok");
	} catch (e) {
		console.warn("Vipps-varsel for " + ref + " feilet:", e.message);
		return new Response("prøv igjen", { status: 500 });
	}
};
//#endregion
//#region \0virtual:astro:page:src/pages/api/vipps/webhook@_@ts
var page = () => webhook_exports;
//#endregion
export { page };
