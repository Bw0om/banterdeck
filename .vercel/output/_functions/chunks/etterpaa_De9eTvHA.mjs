import { waitUntil } from "@vercel/functions";
//#region src/lib/etterpaa.ts
/**
* Arbeid som ikke trenger å være ferdig før telefonen får svar (varsle de andre, statistikk, logging).
* På Vercel holder waitUntil funksjonen i live til jobben er ferdig – svaret sendes med én gang.
*/
function etterpaa(p) {
	if (!p) return;
	const trygg = Promise.resolve(p).catch((e) => console.warn("Etterarbeid feilet:", e?.message));
	try {
		waitUntil(trygg);
	} catch {}
}
//#endregion
export { etterpaa as t };
