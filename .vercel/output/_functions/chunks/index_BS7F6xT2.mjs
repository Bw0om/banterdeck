import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { d as lagRom, f as lekeliste, g as rensNavn, h as rensLang, p as loggRom } from "./rom_CLYEJdd8.mjs";
//#region src/pages/api/rom/index.ts
var rom_exports = /* @__PURE__ */ __exportAll({
	POST: () => POST,
	prerender: () => false
});
var json = (d, status = 200) => new Response(JSON.stringify(d), {
	status,
	headers: {
		"Content-Type": "application/json",
		"Cache-Control": "no-store"
	}
});
var POST = async ({ request }) => {
	const hLang = rensLang(request.headers.get("x-lang"));
	let d;
	try {
		d = await request.json();
	} catch {
		return json({ feil: "ugyldig" }, 400);
	}
	const lang = d && (d.lang === "en" || d.lang === "no") ? rensLang(d.lang) : hLang;
	const en = lang === "en";
	const navn = rensNavn(d.navn);
	if (!navn) return json({
		feil: "navn",
		melding: en ? "Enter a name." : "Skriv inn et navn."
	}, 400);
	try {
		const { kode, spiller } = await lagRom(navn, String(d.lek || "").slice(0, 30), String(d.modus || ""), lang);
		await loggRom("lag", "rom");
		return json({
			kode,
			id: spiller.id,
			pollett: spiller.pollett,
			lang,
			leker: lekeliste(lang)
		});
	} catch (e) {
		console.warn("Rom kunne ikke lages:", e.message);
		return json({
			feil: "server",
			melding: en ? "Couldn't create the room right now. Try again in a bit." : "Fikk ikke laget rommet akkurat nå. Prøv igjen om litt."
		}, 503);
	}
};
//#endregion
//#region \0virtual:astro:page:src/pages/api/rom/index@_@ts
var page = () => rom_exports;
//#endregion
export { page };
