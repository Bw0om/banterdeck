import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { s as json } from "./konto_Cyp1VvAa.mjs";
import { n as offentligNokkel } from "./push_FIMjp49L.mjs";
//#region src/pages/api/push/nokkel.ts
var nokkel_exports = /* @__PURE__ */ __exportAll({
	GET: () => GET,
	prerender: () => false
});
var GET = async () => json({ nokkel: offentligNokkel() });
//#endregion
//#region \0virtual:astro:page:src/pages/api/push/nokkel@_@ts
var page = () => nokkel_exports;
//#endregion
export { page };
