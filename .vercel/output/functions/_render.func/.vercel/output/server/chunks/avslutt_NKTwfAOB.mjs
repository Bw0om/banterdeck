import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { n as rpc } from "./spilt_2dqjF3k8.mjs";
import { s as json } from "./konto_Cyp1VvAa.mjs";
//#region src/pages/api/push/avslutt.ts
var avslutt_exports = /* @__PURE__ */ __exportAll({
	POST: () => POST,
	prerender: () => false
});
var POST = async ({ request }) => {
	let d;
	try {
		d = await request.json();
	} catch {
		return json({ feil: "ugyldig" }, 400);
	}
	const ep = String(d.endpoint || "");
	if (!/^https:\/\//.test(ep) || ep.length > 1e3) return json({ feil: "ugyldig" }, 400);
	try {
		await rpc("push_fjern", { p_endpoint: ep });
		return json({ ok: true });
	} catch {
		return json({ feil: "server" }, 503);
	}
};
//#endregion
//#region \0virtual:astro:page:src/pages/api/push/avslutt@_@ts
var page = () => avslutt_exports;
//#endregion
export { page };
