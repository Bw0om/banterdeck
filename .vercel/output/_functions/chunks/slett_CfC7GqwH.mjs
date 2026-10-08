import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { r as supabaseServer } from "./spilt_2dqjF3k8.mjs";
import { o as innloggetBruker, s as json } from "./konto_Cyp1VvAa.mjs";
//#region src/pages/api/konto/slett.ts
var slett_exports = /* @__PURE__ */ __exportAll({
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
	if (d.bekreft !== true) return json({
		feil: "bekreft",
		melding: "Bekreft slettingen."
	}, 400);
	try {
		const bruker = await innloggetBruker(request);
		if (!bruker) return json({
			feil: "logg-inn",
			melding: "Logg inn på nytt."
		}, 401);
		const { url, nokkel } = supabaseServer();
		if (!url || !nokkel) throw new Error("Supabase mangler");
		const h = {
			apikey: nokkel,
			Authorization: "Bearer " + nokkel,
			"Content-Type": "application/json"
		};
		await fetch(`${url}/rest/v1/decks?user_id=eq.${encodeURIComponent(bruker.id)}`, {
			method: "DELETE",
			headers: h
		}).catch(() => null);
		const r = await fetch(`${url}/auth/v1/admin/users/${encodeURIComponent(bruker.id)}`, {
			method: "DELETE",
			headers: h
		});
		if (!r.ok) throw new Error("Supabase svarte " + r.status);
		return json({ ok: true });
	} catch (e) {
		console.warn("Sletting feilet:", e.message);
		return json({
			feil: "server",
			melding: "Fikk ikke slettet kontoen akkurat nå. Prøv igjen, eller send oss en e-post."
		}, 503);
	}
};
//#endregion
//#region \0virtual:astro:page:src/pages/api/konto/slett@_@ts
var page = () => slett_exports;
//#endregion
export { page };
