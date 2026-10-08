import { n as rpc } from "./spilt_2dqjF3k8.mjs";
import webpush from "web-push";
//#region src/lib/push.ts
function env() {
	return typeof process !== "undefined" && process.env || {};
}
function offentligNokkel() {
	return String(env().VAPID_PUBLIC_KEY || "");
}
function gyldigAbonnement(sub) {
	return sub && typeof sub.endpoint === "string" && /^https:\/\//.test(sub.endpoint) && sub.endpoint.length < 1e3 && sub.keys && typeof sub.keys.p256dh === "string" && typeof sub.keys.auth === "string" && sub.keys.p256dh.length < 200 && sub.keys.auth.length < 100;
}
/** Sender samme melding til alle som abonnerer på et emne. Fjerner utgåtte abonnementer. */
async function sendTilAlle(emne, melding) {
	const e = env();
	if (!e.VAPID_PUBLIC_KEY || !e.VAPID_PRIVATE_KEY) throw new Error("VAPID-nøklene mangler");
	webpush.setVapidDetails(e.VAPID_SUBJECT || "mailto:post@mittvors.no", e.VAPID_PUBLIC_KEY, e.VAPID_PRIVATE_KEY);
	const mottakere = await rpc("push_mottakere", { p_emne: emne }) || [];
	const data = JSON.stringify({
		title: melding.tittel,
		body: melding.tekst,
		url: melding.url
	});
	let sendt = 0;
	for (let i = 0; i < mottakere.length; i += 50) await Promise.all(mottakere.slice(i, i + 50).map(async (m) => {
		try {
			await webpush.sendNotification({
				endpoint: m.endpoint,
				keys: m.nokler
			}, data, {
				TTL: 43200,
				urgency: "normal"
			});
			sendt++;
		} catch (err) {
			if (err && (err.statusCode === 404 || err.statusCode === 410)) await rpc("push_fjern", { p_endpoint: m.endpoint }).catch(() => null);
		}
	}));
	return {
		mottakere: mottakere.length,
		sendt
	};
}
/** Varsler medlemmene i en gjeng som har skrudd på gjengvarsler (ikke den som startet kvelden). */
async function sendTilGjeng(gjengId, utenom, melding) {
	const e = env();
	if (!e.VAPID_PUBLIC_KEY || !e.VAPID_PRIVATE_KEY) return {
		mottakere: 0,
		sendt: 0
	};
	webpush.setVapidDetails(e.VAPID_SUBJECT || "mailto:post@mittvors.no", e.VAPID_PUBLIC_KEY, e.VAPID_PRIVATE_KEY);
	const mottakere = await rpc("gjeng_varsel_mottakere", {
		p_gjeng: gjengId,
		p_utenom: utenom
	}) || [];
	const data = JSON.stringify({
		title: melding.tittel,
		body: melding.tekst,
		url: melding.url
	});
	let sendt = 0;
	await Promise.all(mottakere.slice(0, 200).map(async (m) => {
		try {
			await webpush.sendNotification({
				endpoint: m.endpoint,
				keys: m.nokler
			}, data, {
				TTL: 10800,
				urgency: "high"
			});
			sendt++;
		} catch (err) {
			if (err && (err.statusCode === 404 || err.statusCode === 410)) await rpc("gjeng_varsel_fjern", {
				p_gjeng: gjengId,
				p_endpoint: m.endpoint
			}).catch(() => null);
		}
	}));
	return {
		mottakere: mottakere.length,
		sendt
	};
}
//#endregion
export { sendTilGjeng as i, offentligNokkel as n, sendTilAlle as r, gyldigAbonnement as t };
