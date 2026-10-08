import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { n as rpc } from "./spilt_2dqjF3k8.mjs";
import { a as gyldigEpost, o as innloggetBruker, s as json } from "./konto_Cyp1VvAa.mjs";
import { i as sendEpost, n as invitasjonEpost, t as epostKlar } from "./epost_CppH3Xk2.mjs";
//#region src/pages/api/inviter.ts
var inviter_exports = /* @__PURE__ */ __exportAll({
	POST: () => POST,
	prerender: () => false
});
var VERTER = ["mittvors.no", "www.mittvors.no"];
var POST = async ({ request }) => {
	let d;
	try {
		d = await request.json();
	} catch {
		return json({ feil: "ugyldig" }, 400);
	}
	const en = d.lang === "en";
	const M = (no, e) => en ? e : no;
	try {
		const u = await innloggetBruker(request);
		if (!u) return json({
			feil: "logg-inn",
			melding: M("Logg inn for å sende invitasjoner.", "Log in to send invites.")
		}, 401);
		if (!u.email_confirmed_at && !u.confirmed_at) return json({
			feil: "bekreft",
			melding: M("Bekreft e-posten din først.", "Confirm your email first.")
		}, 403);
		if (!epostKlar()) return json({
			feil: "av",
			melding: M("E-post er ikke satt opp ennå.", "Email is not set up yet.")
		}, 503);
		let lenke;
		try {
			lenke = new URL(String(d.url || ""));
		} catch {
			return json({ feil: "lenke" }, 400);
		}
		const egenVert = new URL(request.url).host;
		if (!(VERTER.includes(lenke.host) || lenke.host === egenVert) || !/^https?:$/.test(lenke.protocol)) return json({
			feil: "lenke",
			melding: M("Ugyldig lenke.", "Invalid link.")
		}, 400);
		const til = [...new Set((Array.isArray(d.til) ? d.til : []).map((x) => String(x || "").trim().toLowerCase()).filter(Boolean))];
		if (!til.length) return json({
			feil: "til",
			melding: M("Skriv inn minst én e-postadresse.", "Enter at least one email address.")
		}, 400);
		if (til.length > 10) return json({
			feil: "til",
			melding: M("Maks 10 adresser om gangen.", "At most 10 addresses at a time.")
		}, 400);
		const feil = til.filter((x) => !gyldigEpost(x));
		if (feil.length) return json({
			feil: "til",
			melding: M("Sjekk adressen: ", "Check the address: ") + feil[0]
		}, 400);
		const navn = String(d.navn || "").replace(/[\u0000-\u001f<>]/g, "").trim().slice(0, 30);
		if (!navn) return json({
			feil: "navn",
			melding: M("Skriv inn navnet ditt.", "Enter your name.")
		}, 400);
		const melding = String(d.melding || "").replace(/[\u0000-\u0009\u000b-\u001f<>]/g, "").trim().slice(0, 200);
		if (await rpc("invitasjon_kvote", {
			p_user: u.id,
			p_antall: til.length
		}) !== true) return json({
			feil: "kvote",
			melding: M("Du har sendt mange invitasjoner i dag. Prøv igjen i morgen.", "You’ve sent a lot of invites today. Try again tomorrow.")
		}, 429);
		const e = invitasjonEpost({
			navn,
			melding,
			lenke: lenke.toString(),
			en
		});
		let sendt = 0;
		for (const adr of til) try {
			await sendEpost(adr, e.emne, e.html, e.tekst, u.email || void 0);
			sendt++;
		} catch (x) {
			console.warn("Invitasjon feilet:", x.message);
		}
		if (!sendt) return json({
			feil: "server",
			melding: M("Fikk ikke sendt akkurat nå. Prøv igjen.", "Couldn’t send right now. Try again.")
		}, 503);
		return json({
			ok: true,
			sendt
		});
	} catch (x) {
		console.warn("Invitasjon feilet:", x.message);
		return json({
			feil: "server",
			melding: M("Det gikk ikke akkurat nå. Prøv igjen.", "That didn’t work right now. Try again.")
		}, 503);
	}
};
//#endregion
//#region \0virtual:astro:page:src/pages/api/inviter@_@ts
var page = () => inviter_exports;
//#endregion
export { page };
