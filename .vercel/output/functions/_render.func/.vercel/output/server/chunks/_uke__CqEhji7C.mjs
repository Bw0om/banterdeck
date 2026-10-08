import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { d as renderTemplate, i as renderComponent, w as createAstro } from "./server_Bjx7FWTN.mjs";
import { t as createComponent } from "./compiler_Bf6GLUpQ.mjs";
import { a as rundeId, n as erPublisert, r as publiseringstid, t as alleRunder } from "./nyhetsrunden_D1RpSAip.mjs";
import { n as $$Nyhetsrunden, t as $$NyhetsrundenKommer } from "./NyhetsrundenKommer_BOVPXHXB.mjs";
//#region src/pages/no/nyhetsrunden/[uke].astro
var _uke__exports = /* @__PURE__ */ __exportAll({
	default: () => $$Uke,
	file: () => $$file,
	prerender: () => false,
	url: () => $$url
});
createAstro("https://www.mittvors.no");
var $$Uke = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$Uke;
	const naa = Date.now();
	const runde = alleRunder.find((r) => rundeId(r) === Astro.params.uke);
	if (!runde) return new Response(null, { status: 404 });
	const klar = erPublisert(runde, naa);
	const maks = klar ? 3600 : Math.max(5, Math.min(300, Math.floor((publiseringstid(runde) - naa) / 1e3)));
	Astro.response.headers.set("Cache-Control", `public, max-age=0, s-maxage=${maks}, stale-while-revalidate=60`);
	return renderTemplate`${klar ? renderTemplate`${renderComponent($$result, "Nyhetsrunden", $$Nyhetsrunden, { "runde": runde })}` : renderTemplate`${renderComponent($$result, "Kommer", $$NyhetsrundenKommer, { "neste": runde })}`}`;
}, "C:/Users/jonas/Documents/GitHub/banterdeck/src/pages/no/nyhetsrunden/[uke].astro", void 0);
var $$file = "C:/Users/jonas/Documents/GitHub/banterdeck/src/pages/no/nyhetsrunden/[uke].astro";
var $$url = "/no/nyhetsrunden/[uke]";
//#endregion
//#region \0virtual:astro:page:src/pages/no/nyhetsrunden/[uke]@_@astro
var page = () => _uke__exports;
//#endregion
export { page };
