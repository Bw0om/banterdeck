import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { n as rpc } from "./spilt_2dqjF3k8.mjs";
import { n as adminBruker, s as json } from "./konto_Cyp1VvAa.mjs";
import { c as ryddBetalinger, d as vippsKlar, f as vippsMiljo, l as sjekkBetaling, n as fjernWebhook, o as refunderBetaling, p as webhookStatus, s as registrerWebhook } from "./pluss_Bsul_2hb.mjs";
//#region src/pages/api/admin/salg.ts
var salg_exports = /* @__PURE__ */ __exportAll({
	GET: () => GET,
	POST: () => POST,
	prerender: () => false
});
var nei = () => json({
	feil: "nei",
	melding: "Logg inn på Min stokk med admin-kontoen."
}, 403);
var REF = /^bd-[0-9a-f]{20}$/;
var GET = async ({ request }) => {
	if (!await adminBruker(request).catch(() => null)) return nei();
	const q = new URL(request.url).searchParams;
	try {
		const sok = String(q.get("sok") || "").trim();
		if (sok) return json({ treff: sok.length < 3 ? [] : await rpc("admin_salg_sok", { p_sok: sok.slice(0, 80) }) });
		const dager = Math.max(1, Math.min(365, Number(q.get("dager")) || 30));
		const [salg, webhook] = await Promise.all([rpc("admin_salg", { p_dager: dager }), webhookStatus().catch(() => null)]);
		return json({
			...salg,
			vipps: {
				klar: vippsKlar(),
				miljo: vippsMiljo(),
				webhook
			}
		});
	} catch (e) {
		console.warn("Salgsoversikt feilet:", e.message);
		return json({
			feil: "server",
			melding: "Fikk ikke hentet salget. Har du kjørt salg-supabase.sql?"
		}, 503);
	}
};
var POST = async ({ request }) => {
	if (!await adminBruker(request).catch(() => null)) return nei();
	let d;
	try {
		d = await request.json();
	} catch {
		return json({ feil: "ugyldig" }, 400);
	}
	try {
		if (d.handling === "refunder") {
			if (!REF.test(String(d.ref || ""))) return json({ feil: "ugyldig" }, 400);
			if (!vippsKlar()) return json({
				feil: "vipps",
				melding: "Vipps-nøklene mangler i Vercel."
			}, 503);
			const r = await refunderBetaling(d.ref);
			return r.ok ? json({ ok: true }) : json({
				feil: "vipps",
				melding: r.melding
			}, 409);
		}
		if (d.handling === "sjekk") {
			if (!REF.test(String(d.ref || ""))) return json({ feil: "ugyldig" }, 400);
			return json({
				ok: true,
				status: await sjekkBetaling(d.ref)
			});
		}
		if (d.handling === "rydd") return json({
			ok: true,
			fullfort: await ryddBetalinger(40)
		});
		if (d.handling === "webhook-registrer") {
			if (!vippsKlar()) return json({
				feil: "vipps",
				melding: "Legg inn Vipps-nøklene i Vercel først."
			}, 503);
			const u = new URL(request.url);
			const vert = request.headers.get("x-forwarded-host") || u.host;
			if (/^(localhost|127\.)/.test(vert)) return json({
				feil: "lokal",
				melding: "Vipps kan ikke nå en lokal adresse. Gjør dette på mittvors.no."
			}, 400);
			return json({
				ok: true,
				...await registrerWebhook("https://" + vert + "/api/vipps/webhook")
			});
		}
		if (d.handling === "webhook-fjern") {
			await fjernWebhook();
			return json({ ok: true });
		}
		return json({ feil: "ugyldig" }, 400);
	} catch (e) {
		console.warn("Admin salg feilet:", e.message);
		return json({
			feil: "server",
			melding: e.message.slice(0, 300)
		}, 503);
	}
};
//#endregion
//#region \0virtual:astro:page:src/pages/api/admin/salg@_@ts
var page = () => salg_exports;
//#endregion
export { page };
