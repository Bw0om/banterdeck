import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { a as t, i as games } from "./content_g9BS9nOd.mjs";
import { n as rpc } from "./spilt_2dqjF3k8.mjs";
import { s as json } from "./konto_Cyp1VvAa.mjs";
import { c as ryddBetalinger } from "./pluss_Bsul_2hb.mjs";
import { a as rundeId, r as publiseringstid, t as alleRunder } from "./nyhetsrunden_D1RpSAip.mjs";
import { n as offentligNokkel, r as sendTilAlle } from "./push_FIMjp49L.mjs";
//#region src/lib/ukenslek.ts
var UKENS_LEKER = [
	"ring-of-fire",
	"regelfabrikken",
	"bussruta",
	"forraeder",
	"drikke-bingo",
	"pyramiden",
	"veddelopet",
	"president",
	"drikke-yatzy",
	"tanken-bak-sangen",
	"kategorier",
	"gris",
	"to-sannheter-og-en-logn",
	"opus",
	"over-eller-under",
	"pekeleken"
];
/** ISO-ukenummer som ett tall (år*100 + uke), regnet i norsk tid. */
function ukeNr(d = /* @__PURE__ */ new Date()) {
	const o = new Date(d.toLocaleString("en-US", { timeZone: "Europe/Oslo" }));
	const t = new Date(Date.UTC(o.getFullYear(), o.getMonth(), o.getDate()));
	const dag = (t.getUTCDay() + 6) % 7;
	t.setUTCDate(t.getUTCDate() - dag + 3);
	const aar = t.getUTCFullYear(), jan4 = new Date(Date.UTC(aar, 0, 4));
	return aar * 100 + 1 + Math.round(((t.getTime() - jan4.getTime()) / 864e5 - 3 + (jan4.getUTCDay() + 6) % 7) / 7);
}
function ukensLek(d = /* @__PURE__ */ new Date(), liste = UKENS_LEKER) {
	const n = ukeNr(d);
	return liste[(Math.floor(n / 100) * 53 + n % 100) % liste.length];
}
//#endregion
//#region src/pages/api/varsel/nyhetsrunden.ts
var nyhetsrunden_exports = /* @__PURE__ */ __exportAll({
	GET: () => GET,
	POST: () => POST,
	prerender: () => false
});
var sisteRydd = 0;
var kjor = async () => {
	if (Date.now() - sisteRydd > 6e4) {
		sisteRydd = Date.now();
		await ryddBetalinger();
	}
	const naa = Date.now();
	const runde = alleRunder.find((r) => {
		const t = publiseringstid(r);
		return t <= naa && t > naa - 1728e5;
	});
	if (!runde) return json({
		ok: true,
		sendt: 0,
		grunn: "ingen ny runde"
	});
	if (!offentligNokkel()) return json({
		ok: false,
		grunn: "VAPID-nøklene mangler i Vercel"
	}, 503);
	const ref = "nyhetsrunden-" + rundeId(runde);
	try {
		if (!await rpc("varsel_krev", { p_ref: ref })) return json({
			ok: true,
			sendt: 0,
			grunn: "allerede sendt"
		});
		const antall = (runde.sporsmal || []).length;
		const r = await sendTilAlle("nyhetsrunden", {
			tittel: `Nyhetsrunden uke ${runde.uke} er ute 🍻`,
			tekst: (runde.ingress ? String(runde.ingress).slice(0, 110) : `${antall} spørsmål fra ukas nyheter.`) + ukensTekst(),
			url: "/no/nyhetsrunden"
		});
		await rpc("varsel_ferdig", {
			p_ref: ref,
			p_antall: r.sendt
		}).catch(() => null);
		return json({
			ok: true,
			...r
		});
	} catch (e) {
		console.warn("Varsel feilet:", e.message);
		return json({ feil: "server" }, 503);
	}
};
var GET = kjor;
var POST = kjor;
function ukensTekst() {
	const g = games.find((x) => x.slug === ukensLek());
	return g ? ` · Ukens lek: ${t(g.name, "no")}` : "";
}
/** Kjøp der noen lukket fanen før de kom tilbake fra Vipps: sjekk dem, så Pluss likevel kommer. */
//#endregion
//#region \0virtual:astro:page:src/pages/api/varsel/nyhetsrunden@_@ts
var page = () => nyhetsrunden_exports;
//#endregion
export { page };
