import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { n as rpc } from "./spilt_2dqjF3k8.mjs";
import { o as innloggetBruker, s as json } from "./konto_Cyp1VvAa.mjs";
//#region src/pages/api/pluss/gratis.ts
var gratis_exports = /* @__PURE__ */ __exportAll({
	POST: () => POST,
	prerender: () => false
});
var POST = async ({ request }) => {
	try {
		const u = await innloggetBruker(request);
		if (!u) return json({
			feil: "logg-inn",
			melding: "Logg inn eller lag en gratis konto først."
		}, 401);
		const en = /^en/.test(request.headers.get("x-lang") || "");
		if (!u.email_confirmed_at && !u.confirmed_at) return json({
			feil: "bekreft",
			melding: en ? "Confirm your email first – check your inbox." : "Bekreft e-posten din først – sjekk innboksen."
		}, 409);
		const s = await rpc("pluss_gratis", { p_user: u.id });
		if (!s || !s.aktiv) {
			const grunn = s && s.grunn;
			return json({
				feil: "brukt",
				grunn,
				melding: grunn === "engangs" ? en ? "The free night isn’t available for temporary email addresses." : "Gratiskvelden gjelder ikke for engangs-e-postadresser." : grunn === "epost-brukt" ? en ? "The free night has already been used with this email address." : "Gratiskvelden er allerede brukt med denne e-postadressen." : en ? "You’ve already used your free night." : "Du har allerede brukt gratiskvelden din."
			}, 409);
		}
		return json(s);
	} catch (e) {
		console.warn("Gratis Pluss feilet:", e.message);
		return json({
			feil: "server",
			melding: "Det gikk ikke akkurat nå. Prøv igjen."
		}, 503);
	}
};
//#endregion
//#region \0virtual:astro:page:src/pages/api/pluss/gratis@_@ts
var page = () => gratis_exports;
//#endregion
export { page };
