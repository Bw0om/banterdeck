import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { s as json } from "./konto_Cyp1VvAa.mjs";
import { c as ryddBetalinger } from "./pluss_Bsul_2hb.mjs";
//#region src/pages/api/pluss/rydd.ts
var rydd_exports = /* @__PURE__ */ __exportAll({
	GET: () => GET,
	prerender: () => false
});
var sist = 0;
var GET = async () => {
	if (Date.now() - sist < 6e4) return json({
		ok: true,
		hoppet: true
	});
	sist = Date.now();
	return json({
		ok: true,
		fullfort: await ryddBetalinger(40)
	});
};
//#endregion
//#region \0virtual:astro:page:src/pages/api/pluss/rydd@_@ts
var page = () => rydd_exports;
//#endregion
export { page };
