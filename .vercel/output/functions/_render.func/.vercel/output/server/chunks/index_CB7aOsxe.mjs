import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { d as renderTemplate, i as renderComponent, w as createAstro } from "./server_Bjx7FWTN.mjs";
import { t as createComponent } from "./compiler_Bf6GLUpQ.mjs";
import { o as sisteRunde, r as publiseringstid, t as alleRunder } from "./nyhetsrunden_D1RpSAip.mjs";
import { n as $$Nyhetsrunden, t as $$NyhetsrundenKommer } from "./NyhetsrundenKommer_BOVPXHXB.mjs";
//#region src/pages/no/nyhetsrunden/index.astro
var nyhetsrunden_exports = /* @__PURE__ */ __exportAll({
	default: () => $$Index,
	file: () => $$file,
	prerender: () => false,
	url: () => $$url
});
createAstro("https://www.mittvors.no");
var $$Index = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$Index;
	const naa = Date.now();
	const runde = sisteRunde(naa);
	const neste = alleRunder.find((r) => publiseringstid(r) > naa) || null;
	const maks = neste ? Math.max(5, Math.min(300, Math.floor((publiseringstid(neste) - naa) / 1e3))) : 300;
	Astro.response.headers.set("Cache-Control", `public, max-age=0, s-maxage=${maks}, stale-while-revalidate=60`);
	return renderTemplate`${runde ? renderTemplate`${renderComponent($$result, "Nyhetsrunden", $$Nyhetsrunden, {
		"runde": runde,
		"erSiste": true,
		"neste": neste
	})}` : renderTemplate`${renderComponent($$result, "Kommer", $$NyhetsrundenKommer, { "neste": neste })}`}`;
}, "C:/Users/jonas/Documents/GitHub/banterdeck/src/pages/no/nyhetsrunden/index.astro", void 0);
var $$file = "C:/Users/jonas/Documents/GitHub/banterdeck/src/pages/no/nyhetsrunden/index.astro";
var $$url = "/no/nyhetsrunden";
//#endregion
//#region \0virtual:astro:page:src/pages/no/nyhetsrunden/index@_@astro
var page = () => nyhetsrunden_exports;
//#endregion
export { page };
