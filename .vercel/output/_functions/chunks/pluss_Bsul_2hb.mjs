import { n as rpc, r as supabaseServer } from "./spilt_2dqjF3k8.mjs";
import { i as sendEpost, r as kvitteringEpost, t as epostKlar } from "./epost_CppH3Xk2.mjs";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
//#region src/lib/pluss.ts
var PRODUKTER = {
	kveld: {
		navn: "Kveldspass",
		ore: 2900,
		beskrivelse: "Mitt vors Pluss i 24 timer"
	},
	aar: {
		navn: "Årspass",
		ore: 19900,
		beskrivelse: "Mitt vors Pluss i ett år"
	}
};
function env() {
	return typeof process !== "undefined" && process.env || {};
}
function vippsKlar() {
	const e = env();
	return !!(e.VIPPS_CLIENT_ID && e.VIPPS_CLIENT_SECRET && e.VIPPS_SUBSCRIPTION_KEY && e.VIPPS_MSN);
}
function base() {
	const e = env();
	return (e.VIPPS_BASE_URL || (e.VIPPS_TEST === "1" || e.VIPPS_TEST === "true" ? "https://apitest.vipps.no" : "https://api.vipps.no")).replace(/\/$/, "");
}
async function plussStatus(userId) {
	const s = await rpc("pluss_status", { p_user: userId });
	return {
		aktiv: !!(s && s.aktiv),
		til: s && s.til || null,
		gratisBrukt: !!(s && s.gratisBrukt),
		kveldspass: Number(s && s.kveldspass || 0)
	};
}
async function harPluss(userId) {
	try {
		return (await plussStatus(userId)).aktiv;
	} catch {
		return false;
	}
}
var tokenCache = null;
async function vippsToken() {
	if (tokenCache && tokenCache.utloper > Date.now() + 6e4) return tokenCache.token;
	const e = env();
	const r = await fetch(base() + "/accesstoken/get", {
		method: "POST",
		headers: {
			client_id: e.VIPPS_CLIENT_ID,
			client_secret: e.VIPPS_CLIENT_SECRET,
			"Ocp-Apim-Subscription-Key": e.VIPPS_SUBSCRIPTION_KEY,
			"Merchant-Serial-Number": e.VIPPS_MSN
		}
	});
	if (!r.ok) throw new Error("Vipps-innlogging feilet (" + r.status + ")");
	const d = await r.json();
	tokenCache = {
		token: d.access_token,
		utloper: Date.now() + (Number(d.expires_in) || 3e3) * 1e3
	};
	return tokenCache.token;
}
async function vipps(sti, init = {}) {
	const e = env();
	const h = {
		Authorization: "Bearer " + await vippsToken(),
		"Ocp-Apim-Subscription-Key": e.VIPPS_SUBSCRIPTION_KEY,
		"Merchant-Serial-Number": e.VIPPS_MSN,
		"Content-Type": "application/json",
		"Vipps-System-Name": "mittvors",
		"Vipps-System-Version": "1.0",
		"Vipps-System-Plugin-Name": "mittvors-web",
		"Vipps-System-Plugin-Version": "1.0"
	};
	if (init.idem) h["Idempotency-Key"] = init.idem;
	const r = await fetch(base() + sti, {
		method: init.method || "GET",
		headers: h,
		body: init.body ? JSON.stringify(init.body) : void 0
	});
	const tekst = await r.text();
	let data = null;
	try {
		data = tekst ? JSON.parse(tekst) : null;
	} catch {
		data = null;
	}
	return {
		ok: r.ok,
		status: r.status,
		data
	};
}
function nyRef() {
	const a = /* @__PURE__ */ new Uint8Array(10);
	crypto.getRandomValues(a);
	return "bd-" + Array.from(a, (x) => x.toString(16).padStart(2, "0")).join("");
}
/** Starter en betaling og gir adressen brukeren sendes til i Vipps. */
async function startBetaling(userId, produkt, returUrl) {
	const p = PRODUKTER[produkt];
	if (!p) throw new Error("Ukjent produkt");
	const ref = nyRef();
	await rpc("betaling_lag", {
		p_ref: ref,
		p_user: userId,
		p_produkt: produkt,
		p_belop: p.ore
	});
	const r = await vipps("/epayment/v1/payments", {
		method: "POST",
		idem: ref,
		body: {
			amount: {
				currency: "NOK",
				value: p.ore
			},
			paymentMethod: { type: "WALLET" },
			reference: ref,
			returnUrl: returUrl + (returUrl.includes("?") ? "&" : "?") + "ref=" + ref,
			userFlow: "WEB_REDIRECT",
			paymentDescription: p.beskrivelse
		}
	});
	if (!r.ok || !r.data || !r.data.redirectUrl) {
		await rpc("betaling_avbryt", { p_ref: ref }).catch(() => null);
		throw new Error("Vipps svarte " + r.status + ": " + JSON.stringify(r.data || {}).slice(0, 400));
	}
	return {
		ref,
		url: r.data.redirectUrl
	};
}
/**
* Sjekker en betaling hos Vipps. Er den godkjent, trekkes pengene (digital vare levert med en gang)
* og Pluss forlenges. Trygt å kalle mange ganger.
*/
async function sjekkBetaling(ref) {
	const b = await rpc("betaling_hent", { p_ref: ref });
	if (!b) return "avbrutt";
	if (b.status === "fullfort") {
		await sendKvittering(ref);
		return "fullfort";
	}
	if (b.status === "avbrutt" || b.status === "refundert") return "avbrutt";
	const r = await vipps("/epayment/v1/payments/" + encodeURIComponent(ref));
	if (!r.ok || !r.data) {
		console.warn("Vipps-sjekk " + ref + " svarte " + r.status + ": " + JSON.stringify(r.data || {}).slice(0, 300));
		return "venter";
	}
	const state = r.data.state, agg = r.data.aggregate || {};
	if (state === "AUTHORIZED") {
		if ((agg.capturedAmount ? Number(agg.capturedAmount.value) : 0) < b.belop_ore) {
			const c = await vipps("/epayment/v1/payments/" + encodeURIComponent(ref) + "/capture", {
				method: "POST",
				idem: "cap-" + ref,
				body: { modificationAmount: {
					currency: "NOK",
					value: b.belop_ore
				} }
			});
			if (!c.ok) {
				console.warn("Vipps-capture " + ref + " svarte " + c.status + ": " + JSON.stringify(c.data || {}).slice(0, 300));
				return "venter";
			}
		}
		await rpc("betaling_fullfor", { p_ref: ref });
		await sendKvittering(ref);
		return "fullfort";
	}
	if (state === "ABORTED" || state === "EXPIRED" || state === "TERMINATED") {
		await rpc("betaling_avbryt", { p_ref: ref });
		return "avbrutt";
	}
	return "venter";
}
async function epostFor(userId) {
	const { url, nokkel } = supabaseServer();
	const r = await fetch(`${url}/auth/v1/admin/users/${encodeURIComponent(userId)}`, { headers: {
		apikey: nokkel,
		Authorization: `Bearer ${nokkel}`
	} });
	if (!r.ok) return "";
	const u = await r.json();
	return u && (u.email || u.user && u.user.email) || "";
}
/** Sender kvitteringen én gang per kjøp. Feiler sendingen, prøves det igjen neste gang betalingen sjekkes. */
async function sendKvittering(ref) {
	if (!epostKlar()) return;
	try {
		if (await rpc("betaling_kvittering_krev", { p_ref: ref }) !== true) return;
		try {
			const b = await rpc("betaling_hent", { p_ref: ref });
			const til = b && b.user_id ? await epostFor(b.user_id) : "";
			if (!til) return;
			const k = kvitteringEpost(b, "https://www.mittvors.no/no/kvittering?ref=" + encodeURIComponent(ref));
			await sendEpost(til, k.emne, k.html, k.tekst);
		} catch (e) {
			await rpc("betaling_kvittering_frigi", { p_ref: ref }).catch(() => null);
			throw e;
		}
	} catch (e) {
		console.warn("Kvittering på e-post feilet:", e.message);
	}
}
/** Refunderer et fullført kjøp i Vipps og tar tilbake Pluss-tiden. */
async function refunderBetaling(ref) {
	const b = await rpc("betaling_hent", { p_ref: ref });
	if (!b) return {
		ok: false,
		melding: "Fant ikke kjøpet."
	};
	if (b.status === "refundert") return { ok: true };
	if (b.status !== "fullfort") return {
		ok: false,
		melding: "Bare fullførte kjøp kan refunderes."
	};
	const r = await vipps("/epayment/v1/payments/" + encodeURIComponent(ref) + "/refund", {
		method: "POST",
		idem: "ref-" + ref,
		body: { modificationAmount: {
			currency: "NOK",
			value: b.belop_ore
		} }
	});
	if (!r.ok) {
		console.warn("Vipps-refusjon " + ref + " svarte " + r.status + ": " + JSON.stringify(r.data || {}).slice(0, 300));
		return {
			ok: false,
			melding: "Vipps godtok ikke refusjonen (" + r.status + (r.data && (r.data.detail || r.data.title) ? ": " + (r.data.detail || r.data.title) : "") + ")."
		};
	}
	await rpc("betaling_refunder", { p_ref: ref });
	return { ok: true };
}
/** Sjekker betalinger som ble startet men aldri fullført hos oss (lukket fane o.l.). */
async function ryddBetalinger(maks = 20) {
	if (!vippsKlar()) return 0;
	let n = 0;
	try {
		const apne = await rpc("betalinger_apne", {}) || [];
		for (const b of apne.slice(0, maks)) if (await sjekkBetaling(b.ref).catch(() => "venter") === "fullfort") n++;
	} catch {}
	return n;
}
function vippsMiljo() {
	const e = env();
	return e.VIPPS_TEST === "1" || e.VIPPS_TEST === "true" ? "test" : "prod";
}
var HENDELSER = [
	"epayments.payment.authorized.v1",
	"epayments.payment.aborted.v1",
	"epayments.payment.expired.v1",
	"epayments.payment.terminated.v1"
];
/** Registrerer adressen hos Vipps, og lagrer hemmeligheten i databasen. Erstatter en tidligere registrering. */
async function registrerWebhook(url) {
	const miljo = vippsMiljo();
	const gammel = await rpc("vipps_webhook_hent", { p_miljo: miljo }).catch(() => null);
	if (gammel && gammel.id) await vipps("/webhooks/v1/webhooks/" + encodeURIComponent(gammel.id), { method: "DELETE" }).catch(() => null);
	const r = await vipps("/webhooks/v1/webhooks", {
		method: "POST",
		body: {
			url,
			events: HENDELSER
		}
	});
	if (!r.ok || !r.data || !r.data.secret) throw new Error("Vipps svarte " + r.status + ": " + JSON.stringify(r.data || {}).slice(0, 300));
	await rpc("vipps_webhook_lagre", {
		p_miljo: miljo,
		p_id: r.data.id,
		p_secret: r.data.secret,
		p_url: url
	});
	webhookCache = null;
	return {
		id: r.data.id,
		url,
		miljo
	};
}
async function fjernWebhook() {
	const miljo = vippsMiljo();
	const w = await rpc("vipps_webhook_hent", { p_miljo: miljo }).catch(() => null);
	if (w && w.id) await vipps("/webhooks/v1/webhooks/" + encodeURIComponent(w.id), { method: "DELETE" }).catch(() => null);
	await rpc("vipps_webhook_slett", { p_miljo: miljo });
	webhookCache = null;
}
/** Hva vi har lagret, og hva Vipps faktisk har registrert. */
async function webhookStatus() {
	const miljo = vippsMiljo();
	const w = await rpc("vipps_webhook_hent", { p_miljo: miljo }).catch(() => null);
	const r = vippsKlar() ? await vipps("/webhooks/v1/webhooks").catch(() => null) : null;
	const liste = r && r.ok && r.data && (r.data.webhooks || r.data) || [];
	const hosVipps = Array.isArray(liste) && !!(w && liste.some((x) => x.id === w.id));
	return {
		miljo,
		registrert: !!w,
		url: w ? w.url : null,
		laget: w ? w.laget : null,
		hosVipps,
		antallHosVipps: Array.isArray(liste) ? liste.length : 0
	};
}
var webhookCache = null;
async function webhookHemmelighet() {
	const miljo = vippsMiljo();
	if (webhookCache && webhookCache.miljo === miljo && Date.now() - webhookCache.t < 3e5) return webhookCache.w;
	const w = await rpc("vipps_webhook_hent", { p_miljo: miljo });
	webhookCache = {
		miljo,
		w,
		t: Date.now()
	};
	return w;
}
function likt(a, b) {
	const x = Buffer.from(a), y = Buffer.from(b);
	return x.length === y.length && timingSafeEqual(x, y);
}
/** Sjekker at et varsel faktisk kommer fra Vipps (HMAC-SHA256, se Vipps sin dokumentasjon). */
async function gyldigWebhook(request, kropp) {
	const w = await webhookHemmelighet();
	if (!w || !w.secret) return false;
	const dato = request.headers.get("x-ms-date") || "";
	const hash = request.headers.get("x-ms-content-sha256") || "";
	const auth = request.headers.get("authorization") || "";
	if (!dato || !hash || !auth) return false;
	if (!likt(createHash("sha256").update(kropp, "utf8").digest("base64"), hash)) return false;
	const u = new URL(request.url), registrert = new URL(w.url);
	const vert = registrert.host;
	const sti = registrert.pathname + registrert.search || u.pathname + u.search;
	return likt("HMAC-SHA256 SignedHeaders=x-ms-date;host;x-ms-content-sha256&Signature=" + createHmac("sha256", w.secret).update("POST\n" + sti + "\n" + dato + ";" + vert + ";" + hash).digest("base64"), auth);
}
//#endregion
export { plussStatus as a, ryddBetalinger as c, vippsKlar as d, vippsMiljo as f, harPluss as i, sjekkBetaling as l, fjernWebhook as n, refunderBetaling as o, webhookStatus as p, gyldigWebhook as r, registrerWebhook as s, PRODUKTER as t, startBetaling as u };
