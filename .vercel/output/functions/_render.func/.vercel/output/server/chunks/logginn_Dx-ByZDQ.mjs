import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { n as rpc } from "./spilt_2dqjF3k8.mjs";
import { a as gyldigEpost, i as auth, s as json, t as BRUKERNAVN } from "./konto_Cyp1VvAa.mjs";
//#region src/pages/api/konto/logginn.ts
var logginn_exports = /* @__PURE__ */ __exportAll({
	POST: () => POST,
	prerender: () => false
});
var FEIL = {
	feil: "feil",
	melding: "Feil brukernavn eller passord."
};
var POST = async ({ request }) => {
	let d;
	try {
		d = await request.json();
	} catch {
		return json({ feil: "ugyldig" }, 400);
	}
	const navn = String(d.navn || "").trim();
	const passord = String(d.passord || "");
	if (!navn || !passord || passord.length > 72) return json(FEIL, 401);
	try {
		let epost = "";
		if (navn.includes("@")) {
			if (gyldigEpost(navn)) epost = navn.toLowerCase();
		} else if (BRUKERNAVN.test(navn)) epost = await rpc("epost_for_brukernavn", { p_brukernavn: navn }) || "";
		if (!epost) return json(FEIL, 401);
		const r = await auth("/token?grant_type=password", {
			method: "POST",
			body: {
				email: epost,
				password: passord
			}
		});
		if (!r.ok) {
			if (r.status === 429) return json({
				feil: "grense",
				melding: "For mange forsøk. Vent litt og prøv igjen."
			}, 429);
			const m = String(r.data && (r.data.error_description || r.data.msg || r.data.error_code) || "");
			if (/confirm/i.test(m)) {
				const tilbake = new URL("/no/account", request.url).toString();
				const ny = await auth("/resend?redirect_to=" + encodeURIComponent(tilbake), {
					method: "POST",
					body: {
						type: "signup",
						email: epost
					}
				}).catch(() => null);
				return json({
					feil: "bekreft",
					melding: ny && ny.ok ? "E-posten din er ikke bekreftet ennå. Vi har sendt en ny lenke – sjekk innboksen (og søppelpost)." : "Bekreft e-postadressen først – sjekk innboksen. Vent et minutt før du prøver igjen hvis lenken ikke kom."
				}, 401);
			}
			return json(FEIL, 401);
		}
		return json({
			access_token: r.data.access_token,
			refresh_token: r.data.refresh_token,
			expires_in: r.data.expires_in
		});
	} catch (e) {
		console.warn("Innlogging feilet:", e.message);
		return json({
			feil: "server",
			melding: "Fikk ikke logget inn akkurat nå. Prøv igjen om litt."
		}, 503);
	}
};
//#endregion
//#region \0virtual:astro:page:src/pages/api/konto/logginn@_@ts
var page = () => logginn_exports;
//#endregion
export { page };
