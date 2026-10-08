import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { n as rpc } from "./spilt_2dqjF3k8.mjs";
import { n as adminBruker, s as json } from "./konto_Cyp1VvAa.mjs";
import { a as KATEGORIER, i as JANEI_KAT, n as HVEM_KAT, r as JANEI, t as HVEM } from "./bors_Cf8trQO6.mjs";
//#region src/pages/api/admin/aksjer.ts
var aksjer_exports = /* @__PURE__ */ __exportAll({
	GET: () => GET,
	prerender: () => false
});
var GET = async ({ request }) => {
	if (!await adminBruker(request).catch(() => null)) return json({
		feil: "nei",
		melding: "Logg inn med admin-kontoen."
	}, 403);
	let rader = [];
	try {
		rader = await rpc("admin_bors_stat", {}) || [];
	} catch (e) {
		return json({
			feil: "server",
			melding: "Fikk ikke hentet statistikken. Har du kjørt gjengkveld-supabase.sql?"
		}, 503);
	}
	const kart = {};
	rader.forEach((r) => {
		kart[r.nokkel] = r;
	});
	const alle = HVEM.map((q, i) => ({
		nokkel: "h" + i,
		q: q.no,
		type: "hvem",
		kat: HVEM_KAT[i]
	})).concat(JANEI.map((q, i) => ({
		nokkel: "j" + i,
		q: q.no,
		type: "janei",
		kat: JANEI_KAT[i]
	}))).map((a) => {
		const r = kart[a.nokkel] || {};
		return {
			...a,
			vist: r.vist || 0,
			kjop: r.kjop || 0,
			kjopere: r.kjopere || 0,
			meldt: r.meldt || 0,
			avgjort: r.avgjort || 0,
			skjedde: r.skjedde || 0,
			vinnere: r.vinnere || 0
		};
	});
	let egne = [];
	try {
		egne = await rpc("admin_bors_egne", {}) || [];
	} catch {}
	return json({
		aksjer: alle,
		kategorier: KATEGORIER.map((k) => ({
			id: k.id,
			navn: k.no
		})),
		egne
	});
};
//#endregion
//#region \0virtual:astro:page:src/pages/api/admin/aksjer@_@ts
var page = () => aksjer_exports;
//#endregion
export { page };
