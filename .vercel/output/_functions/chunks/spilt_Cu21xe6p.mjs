import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { n as rpc, t as GYLDIGE } from "./spilt_2dqjF3k8.mjs";
//#region src/pages/api/spilt.ts
var spilt_exports = /* @__PURE__ */ __exportAll({
	POST: () => POST,
	prerender: () => false
});
var POST = async ({ request }) => {
	let d;
	try {
		d = await request.json();
	} catch {
		return new Response(null, { status: 400 });
	}
	const type = String(d.type || ""), ref = String(d.ref || "");
	if (!GYLDIGE[type] || !GYLDIGE[type].has(ref)) return new Response(null, { status: 400 });
	try {
		await rpc("registrer_spilt", {
			p_type: type,
			p_ref: ref
		});
	} catch (e) {
		console.warn("Telling feilet:", e.message);
	}
	return new Response(null, { status: 204 });
};
//#endregion
//#region \0virtual:astro:page:src/pages/api/spilt@_@ts
var page = () => spilt_exports;
//#endregion
export { page };
