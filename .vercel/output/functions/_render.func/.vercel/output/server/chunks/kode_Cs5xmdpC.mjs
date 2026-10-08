import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { n as rpc } from "./spilt_2dqjF3k8.mjs";
import { o as innloggetBruker, s as json } from "./konto_Cyp1VvAa.mjs";
//#region src/pages/api/pluss/kode.ts
var kode_exports = /* @__PURE__ */ __exportAll({
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
	const kode = String(d.kode || "").trim().toUpperCase().replace(/\s+/g, "");
	if (!/^[A-Z0-9-]{4,24}$/.test(kode)) return json({
		feil: "ugyldig",
		melding: "Sjekk at koden er skrevet riktig."
	}, 400);
	try {
		const u = await innloggetBruker(request);
		if (!u) return json({
			feil: "logg-inn",
			melding: "Logg inn eller lag en gratis konto for å bruke koden."
		}, 401);
		const r = await rpc("gavekode_los", {
			p_kode: kode,
			p_user: u.id
		});
		if (!r || !r.ok) return json({
			feil: "kode",
			melding: r && r.melding || "Koden virket ikke."
		}, 400);
		return json({
			ok: true,
			dager: r.dager,
			...r.status
		});
	} catch (e) {
		console.warn("Gavekode feilet:", e.message);
		return json({
			feil: "server",
			melding: "Det gikk ikke akkurat nå. Prøv igjen."
		}, 503);
	}
};
//#endregion
//#region \0virtual:astro:page:src/pages/api/pluss/kode@_@ts
var page = () => kode_exports;
//#endregion
export { page };
