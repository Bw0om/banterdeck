import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { n as rpc } from "./spilt_2dqjF3k8.mjs";
import { o as innloggetBruker, s as json } from "./konto_Cyp1VvAa.mjs";
import { E as ryddUtsatte, M as visBok, l as hentRom } from "./rom_CLYEJdd8.mjs";
//#region src/pages/api/gjeng/vis.ts
var vis_exports = /* @__PURE__ */ __exportAll({
	GET: () => GET,
	prerender: () => false
});
var GET = async ({ request }) => {
	const kode = String(new URL(request.url).searchParams.get("k") || "").trim().toUpperCase();
	if (!/^[A-Z0-9]{8}$/.test(kode)) return json({
		feil: "kode",
		melding: "Ugyldig gjengkode."
	}, 400);
	const lang = /^en/.test(request.headers.get("x-lang") || "") ? "en" : "no";
	try {
		const g = await rpc("gjeng_hent", { p_kode: kode });
		if (!g) return json({
			feil: "finnes-ikke",
			melding: "Fant ikke gjengen. Kanskje den er slettet?"
		}, 404);
		let eier = false, medlem = false;
		const u = await innloggetBruker(request).catch(() => null);
		if (u) {
			eier = g.eier === u.id;
			medlem = eier || !!await rpc("gjeng_tilgang", {
				p_user: u.id,
				p_id: g.id
			});
		}
		let antall = 0;
		try {
			antall = Number(await rpc("gjeng_antall", { p_gjeng: g.id })) || 0;
		} catch {}
		let lovbok = null;
		try {
			let l = await rpc("gjeng_lov_hent", { p_gjeng: g.id });
			if (l) {
				const r = ryddUtsatte(l.lov);
				if (r.endret) {
					const v = await rpc("gjeng_lov_lagre", {
						p_gjeng: g.id,
						p_lov: r.bok,
						p_versjon: l.versjon
					});
					if (v != null) l = {
						lov: r.bok,
						versjon: v
					};
				}
			}
			if (l) lovbok = visBok(l.lov, medlem && u ? u.id : null, lang, antall);
		} catch {}
		let kveld = null;
		if (medlem) try {
			const rk = await rpc("gjeng_kveld_aktiv", { p_gjeng: g.id });
			const rom = typeof rk === "string" && rk ? await hentRom(rk) : null;
			if (rom && rom.data.gjengKveld && !rom.data.ferdig && Date.now() - rom.data.laget < 72e6) {
				const vert = rom.data.spillere.find((p) => p.id === rom.data.vert);
				kveld = {
					kode: rk,
					vert: vert ? vert.navn : "",
					antall: rom.data.spillere.length,
					plan: rom.data.plan || [],
					laget: rom.data.laget,
					erMed: !!(u && rom.data.spillere.some((p) => p.konto === u.id))
				};
			}
		} catch {}
		return json({
			id: g.id,
			navn: g.navn,
			kode: g.kode,
			kvelder: g.kvelder || [],
			eier,
			medlem,
			innlogget: !!u,
			lovbok,
			kveld,
			antall
		});
	} catch (e) {
		console.warn("Gjeng kunne ikke hentes:", e.message);
		return json({
			feil: "server",
			melding: "Fikk ikke hentet gjengen akkurat nå."
		}, 503);
	}
};
//#endregion
//#region \0virtual:astro:page:src/pages/api/gjeng/vis@_@ts
var page = () => vis_exports;
//#endregion
export { page };
