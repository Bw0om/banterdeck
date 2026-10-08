import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { n as rpc } from "./spilt_2dqjF3k8.mjs";
import { o as innloggetBruker, s as json } from "./konto_Cyp1VvAa.mjs";
//#region src/pages/api/verv/fullfor.ts
var fullfor_exports = /* @__PURE__ */ __exportAll({
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
	const kode = String(d.kode || "").trim().toUpperCase();
	if (!/^[A-Z0-9]{6}$/.test(kode)) return json({
		feil: "kode",
		ferdig: true
	}, 400);
	try {
		const u = await innloggetBruker(request);
		if (!u) return json({ feil: "logg-inn" }, 401);
		const laget = Date.parse(u.created_at || "");
		if (!laget || Date.now() - laget > 2592e6) return json({
			feil: "gammel",
			ferdig: true,
			melding: "Vervinger gjelder bare nye kontoer."
		}, 409);
		if (!u.email_confirmed_at && !u.confirmed_at) return json({
			feil: "bekreft",
			melding: "Bekreft e-posten din først."
		}, 409);
		const r = await rpc("verv_fullfor", {
			p_user: u.id,
			p_kode: kode
		});
		if (!r || !r.ok) return json({
			feil: r && r.grunn || "nei",
			ferdig: !(r && (r.grunn === "ikke-spilt" || r.grunn === "bekreft"))
		}, 409);
		return json({
			ok: true,
			ferdig: true
		});
	} catch (e) {
		console.warn("Verving kunne ikke fullføres:", e.message);
		return json({
			feil: "server",
			melding: "Prøver igjen senere."
		}, 503);
	}
};
//#endregion
//#region \0virtual:astro:page:src/pages/api/verv/fullfor@_@ts
var page = () => fullfor_exports;
//#endregion
export { page };
