import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { n as rpc } from "./spilt_2dqjF3k8.mjs";
import { s as json } from "./konto_Cyp1VvAa.mjs";
import { t as gyldigAbonnement } from "./push_FIMjp49L.mjs";
//#region src/pages/api/push/abonner.ts
var abonner_exports = /* @__PURE__ */ __exportAll({
	POST: () => POST,
	prerender: () => false
});
var EMNER = /* @__PURE__ */ new Set(["nyhetsrunden"]);
var POST = async ({ request }) => {
	let d;
	try {
		d = await request.json();
	} catch {
		return json({ feil: "ugyldig" }, 400);
	}
	const emne = String(d.emne || "nyhetsrunden");
	if (!EMNER.has(emne) || !gyldigAbonnement(d.sub)) return json({ feil: "ugyldig" }, 400);
	try {
		await rpc("push_lagre", {
			p_endpoint: d.sub.endpoint,
			p_nokler: {
				p256dh: d.sub.keys.p256dh,
				auth: d.sub.keys.auth
			},
			p_emne: emne
		});
		return json({ ok: true });
	} catch (e) {
		console.warn("Varsel-abonnement feilet:", e.message);
		return json({ feil: "server" }, 503);
	}
};
//#endregion
//#region \0virtual:astro:page:src/pages/api/push/abonner@_@ts
var page = () => abonner_exports;
//#endregion
export { page };
