import { i as games, t as allSituations } from "./content_g9BS9nOd.mjs";
//#region src/lib/spilt.ts
var GYLDIGE = {
	lek: new Set(games.map((g) => g.slug)),
	situasjon: new Set(allSituations.map((s) => s.id))
};
/** Supabase-adresse og servernøkkel, lest ved kjøring på Vercel. */
function supabaseServer() {
	const env = typeof process !== "undefined" && process.env || {};
	const url = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || env.PUBLIC_SUPABASE_URL || "";
	const nokkel = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SECRET_KEY || "";
	return {
		url: url.replace(/\/$/, ""),
		nokkel
	};
}
async function rpc(navn, args) {
	const { url, nokkel } = supabaseServer();
	if (!url || !nokkel) throw new Error("Supabase mangler i miljøvariablene");
	const r = await fetch(`${url}/rest/v1/rpc/${navn}`, {
		method: "POST",
		headers: {
			apikey: nokkel,
			Authorization: `Bearer ${nokkel}`,
			"Content-Type": "application/json"
		},
		body: JSON.stringify(args)
	});
	if (!r.ok) throw new Error(`Supabase svarte ${r.status}: ${(await r.text()).slice(0, 200)}`);
	const tekst = await r.text();
	return tekst ? JSON.parse(tekst) : null;
}
//#endregion
export { rpc as n, supabaseServer as r, GYLDIGE as t };
