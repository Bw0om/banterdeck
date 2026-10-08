import { a as supabaseAnonKey } from "./config_DZEmFZJP.mjs";
import { r as supabaseServer } from "./spilt_2dqjF3k8.mjs";
//#region src/lib/konto.ts
var json = (d, status = 200) => new Response(JSON.stringify(d), {
	status,
	headers: {
		"Content-Type": "application/json",
		"Cache-Control": "no-store"
	}
});
function anon() {
	const { url } = supabaseServer();
	return {
		url,
		nokkel: supabaseAnonKey()
	};
}
/** Kaller Supabase Auth som en vanlig nettleser ville gjort. */
async function auth(sti, init = {}) {
	const { url, nokkel } = anon();
	if (!url || !nokkel) throw new Error("Supabase mangler i miljøvariablene");
	const r = await fetch(url + "/auth/v1" + sti, {
		method: init.method || "GET",
		headers: {
			apikey: nokkel,
			Authorization: "Bearer " + (init.token || nokkel),
			"Content-Type": "application/json"
		},
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
/** Hvem er innlogget? Leser Bearer-tokenen fra forespørselen og spør Supabase. */
async function innloggetBruker(request) {
	const h = request.headers.get("authorization") || "";
	const token = h.startsWith("Bearer ") ? h.slice(7) : "";
	if (!token) return null;
	const r = await auth("/user", { token });
	return r.ok && r.data && r.data.id ? r.data : null;
}
var BRUKERNAVN = /^[A-Za-z0-9_.-]{3,20}$/;
var gyldigEpost = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) && e.length <= 200;
/** Adressene som får se statistikksiden, fra miljøvariabelen ADMIN_EPOSTER (kommaseparert). */
function adminEposter() {
	const env = typeof process !== "undefined" && process.env || {};
	return String(env.ADMIN_EPOSTER || "").split(",").map((x) => x.trim().toLowerCase()).filter(Boolean);
}
/** Innlogget konto med e-post i ADMIN_EPOSTER, ellers null. */
async function adminBruker(request) {
	const u = await innloggetBruker(request);
	if (!u) return null;
	return adminEposter().includes(String(u.email || "").toLowerCase()) && (u.email_confirmed_at || u.confirmed_at) ? u : null;
}
//#endregion
export { gyldigEpost as a, auth as i, adminBruker as n, innloggetBruker as o, adminEposter as r, json as s, BRUKERNAVN as t };
