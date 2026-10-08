import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { n as rpc } from "./spilt_2dqjF3k8.mjs";
import { o as innloggetBruker, s as json, t as BRUKERNAVN } from "./konto_Cyp1VvAa.mjs";
//#region src/pages/api/konto/brukernavn.ts
var brukernavn_exports = /* @__PURE__ */ __exportAll({
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
	const brukernavn = String(d.brukernavn || "").trim();
	if (!BRUKERNAVN.test(brukernavn)) return json({
		feil: "brukernavn",
		melding: "Brukernavnet må være 3–20 tegn: bokstaver, tall, punktum, bindestrek eller understrek."
	}, 400);
	try {
		const bruker = await innloggetBruker(request);
		if (!bruker) return json({
			feil: "logg-inn",
			melding: "Logg inn på nytt."
		}, 401);
		let ok;
		try {
			ok = await rpc("endre_brukernavn", {
				p_user: bruker.id,
				p_brukernavn: brukernavn
			});
		} catch (e) {
			if (!/endre_brukernavn|PGRST202|404/.test(e.message)) throw e;
			ok = await rpc("sett_brukernavn", {
				p_user: bruker.id,
				p_brukernavn: brukernavn
			});
		}
		if (!ok) return json({
			feil: "opptatt",
			melding: "Brukernavnet er tatt. Prøv et annet."
		}, 409);
		return json({
			ok: true,
			brukernavn
		});
	} catch (e) {
		console.warn("Brukernavn feilet:", e.message);
		return json({
			feil: "server",
			melding: "Det gikk ikke akkurat nå. Prøv igjen."
		}, 503);
	}
};
//#endregion
//#region \0virtual:astro:page:src/pages/api/konto/brukernavn@_@ts
var page = () => brukernavn_exports;
//#endregion
export { page };
