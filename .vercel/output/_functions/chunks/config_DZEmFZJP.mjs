//#region src/config.ts
var SITE_NAME = "Mitt vors";
var GITHUB_REPO = "Bw0om/banterdeck";
var env = typeof process !== "undefined" && process.env || {};
var pick = (...names) => {
	for (const n of names) {
		const v = env[n] || Object.assign({
			"ASSETS_PREFIX": void 0,
			"BASE_URL": "/",
			"DEV": false,
			"MODE": "production",
			"PROD": true,
			"SITE": "https://www.mittvors.no",
			"SSR": true
		}, {
			PUBLIC: "C:\\Users\\Public",
			_: "C:/Program Files/nodejs/node.exe"
		})[n];
		if (v) return String(v);
	}
	return "";
};
var supabaseUrl = () => pick("SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL", "PUBLIC_SUPABASE_URL");
var supabaseAnonKey = () => pick("SUPABASE_ANON_KEY", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_PUBLISHABLE_KEY", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "PUBLIC_SUPABASE_ANON_KEY");
supabaseUrl();
var supabaseDebug = () => {
	const e = typeof process !== "undefined" && process.env || {};
	const found = Object.keys(e).filter((k) => /SUPABASE/i.test(k)).sort();
	return {
		runtime: typeof process !== "undefined" ? "ja" : "nei",
		antall: Object.keys(e).length,
		funnet: found.length ? found.join(", ") : "(ingen)"
	};
};
var SELGER = {
	navn: "Flaten Kapital",
	orgnr: "931976532",
	adresse: "Skanseløkka 21, 1383 Asker",
	epost: "post@mittvors.no",
	telefon: "911 96 359"
};
var UTVIKLING = {
	paa: true,
	kode: "1991"
};
//#endregion
export { supabaseAnonKey as a, UTVIKLING as i, SELGER as n, supabaseDebug as o, SITE_NAME as r, supabaseUrl as s, GITHUB_REPO as t };
