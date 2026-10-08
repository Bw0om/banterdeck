import { S as unescapeHTML, c as renderSlot, d as renderTemplate, f as maybeRenderHead, g as createRenderInstruction, h as defineScriptVars, i as renderComponent, m as addAttribute, p as renderHead, w as createAstro } from "./server_Bjx7FWTN.mjs";
import { t as createComponent } from "./compiler_Bf6GLUpQ.mjs";
import { a as supabaseAnonKey, i as UTVIKLING, n as SELGER, r as SITE_NAME, s as supabaseUrl } from "./config_DZEmFZJP.mjs";
import { a as t, n as collectionsFor, o as visible, r as dictSection } from "./content_g9BS9nOd.mjs";
//#region node_modules/astro/dist/runtime/server/render/script.js
async function renderScript(result, id) {
	const inlined = result.inlinedScripts.get(id);
	let content = "";
	if (inlined != null) {
		if (inlined) content = `<script type="module">${inlined}<\/script>`;
	} else {
		const resolved = await result.resolve(id);
		content = `<script type="module" src="${result.userAssetsBase ? (result.base === "/" ? "" : result.base) + result.userAssetsBase : ""}${resolved}"><\/script>`;
	}
	return createRenderInstruction({
		type: "script",
		id,
		content
	});
}
//#endregion
//#region node_modules/@fontsource-variable/archivo/files/archivo-latin-wdth-normal.woff2?url
var archivo_latin_wdth_normal_default = "/_astro/archivo-latin-wdth-normal.DY7AcnAa.woff2";
//#endregion
//#region src/lib/i18n.ts
/** Legger på /no foran stien for norsk. Engelsk ligger på rota. */
function path(lang, p) {
	const clean = p === "/" ? "/" : p.replace(/\/$/, "");
	return lang === "no" ? clean === "/" ? "/no/" : "/no" + clean : clean === "/" ? "/en" : clean;
}
/** Samme side på det andre språket. */
var NAVNEPAR = [
	["/rom", "/room"],
	["/pluss", "/plus"],
	["/gjeng", "/crew"],
	["/kveld", "/plan"],
	["/finn-lek", "/find-a-game"],
	["/vilkar", "/terms"],
	["/kortstokk", "/deck"]
];
function otherLangPath(lang, pathname) {
	const clean = pathname.replace(/\/$/, "") || "/";
	if (lang === "no") {
		const stripped = clean.replace(/^\/no(?=\/|$)/, "") || "/";
		const par = NAVNEPAR.find(([no]) => stripped === no);
		if (par) return par[1];
		if (/^\/(nyhetsrunden|statistikk|leker|vorsproven)(\/|$)/.test(stripped)) return "/en";
		return stripped === "/" ? "/en" : stripped;
	}
	if (clean === "/en") return "/no/";
	const par = NAVNEPAR.find(([, en]) => clean === en);
	if (par) return "/no" + par[0];
	return path("no", clean);
}
var UI = {
	en: {
		locale: "en",
		htmlLang: "en",
		tagline: "Drinking games and pre-party fun – everyone plays from their own phone.",
		nav: {
			home: "Home",
			games: "Drinking games",
			suggest: "Submit",
			about: "About",
			privacy: "Privacy",
			account: "My deck"
		},
		openApp: "Open the app",
		heroTitle: "Never be lost for words again.",
		heroSub: (l, w, g) => w > 0 ? `${l} comebacks, ${w} slang expressions and ${g} drinking games — sorted by the situation you are in.` : `${l} comebacks and ${g} drinking games — sorted by the situation you are in.`,
		todayLabel: "Line of the day",
		todayPre: "Line of the day from ",
		todayPost: ". Click to copy.",
		seeGames: "See the drinking games",
		pickSituation: "Pick a situation",
		itemsLabel: "items",
		gamesLabel: "games",
		gamesTeaser: "Ring of Fire, Ride the Bus, Opus, War and more — with the rules.",
		takeItWithYou: "Put the party on your home screen",
		takeItBody: "The app is free, opens straight into the games and keeps the rules available offline.",
		copy: "Copy",
		copied: "Copied",
		copyHint: "Click to copy",
		copyRules: "Copy the rules",
		otherSituations: "Other situations",
		moreGames: "More drinking games",
		allGames: "All drinking games",
		equipment: "Equipment",
		players: "players",
		breadcrumbHome: "Home",
		gamesTitle: "Drinking games",
		gamesLead: "Clear rules for tonight — with cards, music, dice or nothing at all.",
		gamesDesc: (n) => `Rules for ${n} drinking games: Ring of Fire, Fuck the Dealer, Ride the Bus, Horse Race, Opus, Thunderstruck and more.`,
		gateTitle: "Are you over 18?",
		gateBody: "The drinking games are for adults. Drink sensibly — and never drive after.",
		gateYes: "Yes, I am over 18",
		gateNo: "No, take me back",
		suggestTitle: "Submit a line",
		suggestLead: "Cheeky but funny — that is the whole rule. The best ones make it into the deck.",
		fSituation: "Which situation does it fit?",
		fPick: "Pick a situation…",
		fWhen: "When do you say it?",
		fWhenHelp: "The situation it fits — makes it easier to find later.",
		fWhenPh: "E.g. When someone turns up late",
		fLine: "The line",
		fLinePh: "Write the line here",
		fName: "Name or nickname",
		fNamePh: "So we know who to thank",
		optional: "optional",
		send: "Submit",
		sending: "Sending…",
		sentOk: "Thanks! Your line has been submitted. Feel free to send another.",
		errShort: "Write the line first.",
		errGeneric: "Something went wrong. Please try again.",
		errNetwork: "Could not reach the server. Try again shortly.",
		suggestNotice: "Submissions are read through before they go live. Unsure whether something is too crude? Send it anyway — it will just be marked “crude”.",
		getApp: "Get it on your phone",
		iosSteps: "In Safari: tap the Share button, then “Add to Home Screen”.",
		androidSteps: "In Chrome: tap the menu, then “Install app” or “Add to Home screen”.",
		desktopSteps: "You are on a computer. Open mittvors.no on your phone to add it to your home screen.",
		standalone: "You are running the installed app. Nice.",
		accountTitle: "My deck",
		accountLead: "Sign in to save your own lines and favourites, and get them on every device.",
		email: "Email address",
		sendLink: "Send me a sign-in link",
		linkSent: "Check your inbox — the sign-in link is on its way.",
		linkBad: "That sign-in link did not work. Request a new one below.",
		signOut: "Sign out",
		signedInAs: "Signed in as",
		myLines: "My lines",
		addLine: "Add a line",
		noLines: "No lines saved yet.",
		save: "Save",
		cancel: "Cancel",
		delete: "Delete",
		syncing: "Syncing…",
		synced: "Saved to your account ✓",
		notConfigured: "Accounts are not set up yet. See the README for how to connect a free Supabase project.",
		linesTitle: "Comebacks",
		linesLead: "Sorted by the situation you are in — arrivals, the office, winding up your mates.",
		dictTitle: "Slang dictionary",
		dictTab: "Dictionary",
		ordTitle: "Words",
		ordLead: "Norwegian slang and old words worth reviving.",
		ordSearch: "Search for a word…",
		uttrykkTitle: "Expressions",
		uttrykkLead: "Set phrases and proverbs.",
		uttrykkSearch: "Search for an expression…",
		dictLead: "Norwegian slang and expressions worth knowing, with what they actually mean.",
		dictSearch: "Search the dictionary…",
		pickMode: "What are you after?",
		browseLines: "Browse by situation",
		browseDict: "Look up a word",
		browseGames: "Read the rules",
		search: "Search",
		searchPh: "Search every line, word and game…",
		searchHint: "Type at least two letters.",
		noResults: "Nothing found. Try another word.",
		results: "results",
		close: "Close",
		dice: "Deal me a line",
		another: "Another",
		favourites: "Favourites",
		favEmpty: "No favourites yet — tap the star on a line to keep it here.",
		favAdd: "Save to favourites",
		favRemove: "Remove from favourites",
		install: "Add to home screen",
		whatsHappening: "What's happening?",
		whatsHappeningLead: "Pick the moment you are in — every line that fits, from every category.",
		filterSituations: "Find a situation… e.g. “leaves”, “late”, “joke”",
		byPlace: "Or browse by place",
		related: "Similar situations",
		allSituations: "All situations",
		fromCat: "from",
		collections: "Humour on the side",
		fitsExpr: "Expressions that fit",
		fitsExprLead: "Words and phrases to drop into exactly this moment.",
		fitsIn: "Fits when",
		seeDict: "The whole dictionary",
		collectionsLead: "Themed sets — not answers to a moment, just good to have.",
		popular: "Popular moments",
		share: "Share",
		shared: "Copied — ready to share",
		langName: "English",
		switchTo: "Les på norsk",
		bannerNo: "Denne siden finnes på norsk.",
		bannerGo: "Bytt til norsk",
		bannerClose: "Dismiss"
	},
	no: {
		locale: "nb_NO",
		htmlLang: "no",
		tagline: "Drikkeleker og vorsmoro – alle spiller fra sin egen telefon.",
		nav: {
			home: "Forside",
			games: "Drikkeleker",
			suggest: "Send inn",
			about: "Om",
			privacy: "Personvern",
			account: "Min stokk"
		},
		openApp: "Åpne appen",
		heroTitle: "Aldri stå tom for svar igjen.",
		heroSub: (l, w, g) => w > 0 ? `${l} frekke replikker, ${w} ord og uttrykk og ${g} drikkeleker – sortert etter situasjonen du står i.` : `${l} frekke replikker og ${g} drikkeleker – sortert etter situasjonen du står i.`,
		todayLabel: "Dagens replikk",
		todayPre: "Dagens replikk fra ",
		todayPost: ". Klikk for å kopiere.",
		seeGames: "Se drikkelekene",
		pickSituation: "Velg situasjon",
		itemsLabel: "stk",
		gamesLabel: "leker",
		gamesTeaser: "Ring of Fire, Bussruta, Opus, Krig og flere – med regler.",
		takeItWithYou: "Ha vorset på hjemskjermen",
		takeItBody: "Appen er gratis, åpner rett i lekene, virker uten nett for reglene – og kan si fra når ukas Nyhetsrunde er ute.",
		copy: "Kopier",
		copied: "Kopiert",
		copyHint: "Klikk for å kopiere",
		copyRules: "Kopier reglene",
		otherSituations: "Andre situasjoner",
		moreGames: "Flere drikkeleker",
		allGames: "Alle drikkeleker",
		equipment: "Utstyr",
		players: "spillere",
		breadcrumbHome: "Forside",
		gamesTitle: "Drikkeleker",
		gamesLead: "Klare regler til kveldens leker – med kortstokk, musikk, terninger eller helt uten utstyr.",
		gamesDesc: (n) => `Regler til ${n} drikkeleker: Ring of Fire, Fuck the Dealer, Bussruta, Veddeløpet, Opus, Thunderstruck og flere.`,
		gateTitle: "Er du over 18?",
		gateBody: "Drikkelekene er for voksne. Drikk med vett – og aldri kjør etterpå.",
		gateYes: "Ja, jeg er over 18",
		gateNo: "Nei, ta meg tilbake",
		suggestTitle: "Send inn en replikk",
		suggestLead: "Frekk, men morsom – det er hele regelen. De beste forslagene havner i stokken.",
		fSituation: "Hvilken situasjon passer den til?",
		fPick: "Velg situasjon…",
		fWhen: "Når sier man den?",
		fWhenHelp: "Situasjonen replikken passer til – det gjør den lettere å finne igjen.",
		fWhenPh: "F.eks. Når noen kommer for sent",
		fLine: "Replikken",
		fLinePh: "Skriv replikken her",
		fName: "Navn eller kallenavn",
		fNamePh: "Så vi vet hvem vi skal takke",
		optional: "valgfritt",
		send: "Send inn",
		sending: "Sender…",
		sentOk: "Takk! Forslaget er sendt inn. Send gjerne en til.",
		errShort: "Skriv replikken først.",
		errGeneric: "Noe gikk galt. Prøv igjen.",
		errNetwork: "Fikk ikke kontakt med serveren. Prøv igjen om litt.",
		suggestNotice: "Forslagene leses gjennom før de legges ut. Er du usikker på om noe er for grovt – send det inn likevel, så merkes det heller som «grov».",
		getApp: "Få den på telefonen",
		iosSteps: "I Safari: trykk Del-knappen, så «Legg til på Hjem-skjerm».",
		androidSteps: "I Chrome: trykk menyen, så «Installer app» eller «Legg til på startskjerm».",
		desktopSteps: "Du er på en datamaskin. Åpne mittvors.no på telefonen for å legge den til på hjem-skjermen.",
		standalone: "Du kjører den installerte appen. Fint.",
		accountTitle: "Min stokk",
		accountLead: "Logg inn for å lagre egne replikker og favoritter, og få dem på alle enheter.",
		email: "E-postadresse",
		sendLink: "Send meg en innloggingslenke",
		linkSent: "Sjekk innboksen – innloggingslenken er på vei.",
		linkBad: "Innloggingslenken virket ikke. Be om en ny under.",
		signOut: "Logg ut",
		signedInAs: "Innlogget som",
		myLines: "Mine replikker",
		addLine: "Legg til replikk",
		noLines: "Ingen replikker lagret ennå.",
		save: "Lagre",
		cancel: "Avbryt",
		delete: "Slett",
		syncing: "Synkroniserer…",
		synced: "Lagret på kontoen din ✓",
		notConfigured: "Kontoer er ikke satt opp ennå. Se README for hvordan du kobler til et gratis Supabase-prosjekt.",
		linesTitle: "Replikker",
		linesLead: "Sortert etter situasjonen du står i – ankomst, kontoret, erting av gjengen.",
		dictTitle: "Ord & uttrykk",
		dictTab: "Ordbok",
		ordTitle: "Ord",
		ordLead: "Slengord og gamle ord som fortjener et comeback – med hva de faktisk betyr.",
		ordSearch: "Søk etter et ord …",
		uttrykkTitle: "Uttrykk",
		uttrykkLead: "Faste vendinger og ordtak – hva de betyr, og når du kan bruke dem.",
		uttrykkSearch: "Søk etter et uttrykk eller ordtak …",
		dictLead: "Slengord, faste vendinger, ordtak og gamle ord som fortjener et comeback – med hva de faktisk betyr.",
		dictSearch: "Søk etter ord, uttrykk eller ordtak…",
		pickMode: "Hva er du ute etter?",
		browseLines: "Bla etter situasjon",
		browseDict: "Slå opp et ord",
		browseGames: "Les reglene",
		search: "Søk",
		searchPh: "Søk i alle replikker, ord og leker…",
		searchHint: "Skriv minst to bokstaver.",
		noResults: "Ingen treff. Prøv et annet ord.",
		results: "treff",
		close: "Lukk",
		dice: "Trekk en replikk",
		another: "En til",
		favourites: "Favoritter",
		favEmpty: "Ingen favoritter ennå – trykk stjerna på en replikk for å ta vare på den.",
		favAdd: "Lagre som favoritt",
		favRemove: "Fjern fra favoritter",
		install: "Legg til på Hjem-skjerm",
		whatsHappening: "Hva skjer?",
		whatsHappeningLead: "Velg øyeblikket du står i – alle replikker som passer, fra alle kategorier.",
		filterSituations: "Finn en situasjon … f.eks. «drar», «sent», «vits»",
		byPlace: "Eller bla etter sted",
		related: "Lignende situasjoner",
		allSituations: "Alle situasjoner",
		fromCat: "fra",
		collections: "Humor ved siden",
		fitsExpr: "Uttrykk som passer",
		fitsExprLead: "Ord og vendinger du kan strø inn i akkurat denne situasjonen.",
		fitsIn: "Passer når",
		seeDict: "Hele ordboka",
		collectionsLead: "Tematiske sett – ikke svar på et øyeblikk, bare godt å ha.",
		popular: "Populære øyeblikk",
		share: "Del",
		shared: "Kopiert – klar til å deles",
		langName: "Norsk",
		switchTo: "Read in English",
		bannerNo: "",
		bannerGo: "",
		bannerClose: ""
	}
};
function ui(lang) {
	return UI[lang];
}
//#endregion
//#region src/components/AgeGate.astro
createAstro("https://www.mittvors.no");
var $$AgeGate = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$AgeGate;
	const { lang = "en" } = Astro.props;
	const L = ui(lang);
	return renderTemplate`${maybeRenderHead($$result)}<div class="gate" id="gate" hidden><div class="gatebox" role="dialog" aria-modal="true" aria-labelledby="gateTitle"><h2 id="gateTitle">${L.gateTitle}</h2><p>${L.gateBody}</p><div class="row"><button class="btn gold" id="gateYes">${L.gateYes}</button><a class="btn ghost"${addAttribute(path(lang, "/"), "href")}>${L.gateNo}</a></div></div></div><script data-astro-rerun>
  (function () {
    var ok = false;
    try { ok = localStorage.getItem('la_age_ok') === '1'; } catch (e) {}
    if (ok) return;
    var g = document.getElementById('gate');
    g.hidden = false;
    document.body.classList.add('gated');
    document.getElementById('gateYes').addEventListener('click', function () {
      try { localStorage.setItem('la_age_ok', '1'); } catch (e) {}
      g.hidden = true;
      document.body.classList.remove('gated');
    });
  })();
<\/script>`;
}, "C:/Users/jonas/Documents/GitHub/banterdeck/src/components/AgeGate.astro", void 0);
//#endregion
//#region src/lib/icons.ts
var ICONS = {
	"nyhet": "<rect x=\"4\" y=\"5\" width=\"13\" height=\"14\" rx=\"2\"/><path d=\"M17 9h2.5a.5.5 0 0 1 .5.5V17a2 2 0 0 1-2 2H6\"/><path d=\"M7.5 9h6M7.5 12.5h6M7.5 16h3.5\"/>",
	"uttrykk": "<path d=\"M9.2 7.8 5.8 12l3.4 4.2M14 7.8 10.6 12l3.4 4.2M15.6 7.8 19 12l-3.4 4.2\"/>",
	"del": "<path d=\"M12 14.5V4M8 7.8 12 4l4 3.8\"/><path d=\"M7.5 11H6a1.5 1.5 0 0 0-1.5 1.5v6A1.5 1.5 0 0 0 6 20h12a1.5 1.5 0 0 0 1.5-1.5v-6A1.5 1.5 0 0 0 18 11h-1.5\"/>",
	"drikkeleker": "<path d=\"M6 8h10v11a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2Z\"/><path d=\"M16 10.5h1.5a2 2 0 0 1 2 2V15a2 2 0 0 1-2 2H16\"/><path d=\"M6 8c0-1.7 1.3-3 3-3 .6-1 1.7-1.5 2.8-1.2C13 3 14.6 3.4 15.3 4.6 16.4 5.2 16.5 6.8 16 8\"/>",
	"favoritt": "<path d=\"m12 3.8 2.5 5.1 5.6.8-4 3.9.9 5.6-5-2.6-5 2.6.9-5.6-4-3.9 5.6-.8Z\"/>",
	"grov": "<path d=\"M12 3.2c.9 3.6 4.9 5.4 4.9 10.3 0 3.6-2.2 6.5-4.9 6.5s-4.9-2.3-4.9-5.3c0-2.4 1.3-3.9 2.3-4.9.1 1.7.9 2.8 2 3 .1-3.7.6-6.4.6-9.6Z\"/>",
	"hjem": "<path d=\"M4 11 12 4.5 20 11v8.5a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1Z\"/>",
	"kopier": "<rect x=\"8.5\" y=\"8.5\" width=\"11.5\" height=\"11.5\" rx=\"2\"/><path d=\"M15.5 8.5V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7.5a2 2 0 0 0 2 2h2.5\"/>",
	"ordbok": "<path d=\"M12 6.5C10 5 7 4.5 4 5v13.5c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5V5c-3-.5-6 0-8 1.5Z\"/><path d=\"M12 6.5V20\"/>",
	"replikker": "<path d=\"M5.5 4.5h13a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H11l-4.5 4v-4h-1a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2Z\"/><path d=\"M8 9h8M8 12.5h5\"/>",
	"sok": "<circle cx=\"11\" cy=\"11\" r=\"6.5\"/><path d=\"m16 16 4.5 4.5\"/>",
	"terning": "<rect x=\"4\" y=\"4\" width=\"16\" height=\"16\" rx=\"3.5\"/><circle cx=\"8.6\" cy=\"8.6\" r=\"1.25\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"12\" cy=\"12\" r=\"1.25\" fill=\"currentColor\" stroke=\"none\"/><circle cx=\"15.4\" cy=\"15.4\" r=\"1.25\" fill=\"currentColor\" stroke=\"none\"/>",
	"mal": "<circle cx=\"12\" cy=\"12\" r=\"8\"/><circle cx=\"12\" cy=\"12\" r=\"4\"/><path d=\"M12 12h.01\"/>",
	"kalender": "<rect x=\"4\" y=\"5.5\" width=\"16\" height=\"14.5\" rx=\"2\"/><path d=\"M4 10h16M8.5 3.5v4M15.5 3.5v4\"/>",
	"sveip": "<rect x=\"9\" y=\"3.5\" width=\"10.5\" height=\"14.5\" rx=\"2\"/><path d=\"M9 7 6 7.8a1.5 1.5 0 0 0-1 1.8l2.4 9a1.5 1.5 0 0 0 1.8 1.1l5-1.3\"/>",
	"gjeng": "<circle cx=\"9\" cy=\"8.5\" r=\"3\"/><path d=\"M3.5 19c.4-3 2.6-5 5.5-5s5.1 2 5.5 5\"/><path d=\"M15 5.8a3 3 0 0 1 0 5.4M17.5 14.4c1.7.7 2.8 2.4 3 4.6\"/>"
};
/** Ferdig SVG-streng – til kode som bygger HTML i nettleseren. */
function iconSvg(name, size = 18) {
	return `<svg class="icon" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ""}</svg>`;
}
//#endregion
//#region src/components/Icon.astro
createAstro("https://www.mittvors.no");
var $$Icon = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$Icon;
	const { name, size = 18, class: cls = "" } = Astro.props;
	return renderTemplate`${maybeRenderHead($$result)}<svg${addAttribute(`icon ${cls}`, "class")} viewBox="0 0 24 24"${addAttribute(size, "width")}${addAttribute(size, "height")} fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${unescapeHTML(ICONS[name])}</svg>`;
}, "C:/Users/jonas/Documents/GitHub/banterdeck/src/components/Icon.astro", void 0);
//#endregion
//#region src/components/Tools.astro
createAstro("https://www.mittvors.no");
var $$Tools = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$Tools;
	const { lang = "en" } = Astro.props;
	const L = ui(lang);
	return renderTemplate`${maybeRenderHead($$result)}<button class="tool dice" id="diceBtn"${addAttribute(L.dice, "aria-label")}${addAttribute(L.dice, "title")}>${renderComponent($$result, "Icon", $$Icon, {
		"name": "terning",
		"size": 26
	})}</button><div class="overlay search" id="searchOverlay" hidden><div class="searchbox"><div class="searchhead"><input id="searchInput" type="search" autocomplete="off"${addAttribute(L.searchPh, "placeholder")}${addAttribute(L.search, "aria-label")}><button class="linkbtn" id="searchClose"${addAttribute(L.close, "aria-label")}>✕</button></div><p class="small searchnote" id="searchNote">${L.searchHint}</p><div class="cards" id="searchResults"></div></div></div><div class="overlay" id="diceOverlay" hidden><div class="sheet"><p class="deal-eyebrow">${L.dice}</p><div class="dealcard" id="dealCard"></div><div class="row"><button class="btn" id="dealCopy">${L.copy}</button><button class="btn gold" id="dealAgain">${L.another}</button><button class="btn ghost" id="dealClose">${L.close}</button></div></div></div><script>(function(){${defineScriptVars({
		T: {
			hint: L.searchHint,
			none: L.noResults,
			results: L.results,
			copy: L.copy,
			favAdd: L.favAdd,
			favRemove: L.favRemove,
			copied: L.copied,
			star: iconSvg("favoritt"),
			share: iconSvg("del")
		},
		LANG: lang,
		FAVPATH: path(lang, "/favourites")
	})}
(function () {
  if (window.__bdTools) { window.__bdTools.rebind(); return; }
  var FAVS = 'bd_favs', OLD = 'lommearsenalet_v3';
  var data = null, favs = [];

  /* ---------- favoritter, med overføring fra den gamle appen ---------- */
  function load() { try { return JSON.parse(localStorage.getItem(FAVS) || '[]'); } catch (e) { return []; } }
  function save() { try { localStorage.setItem(FAVS, JSON.stringify(favs)); } catch (e) {} }
  favs = load();
  (function migrate() {
    try {
      if (localStorage.getItem('bd_migrated') === '1') return;
      var old = JSON.parse(localStorage.getItem(OLD) || 'null');
      if (old) {
        (old.favs || []).forEach(function (f) { if (favs.indexOf(f) === -1) favs.push(f); });
        var mine = [];
        try { mine = JSON.parse(localStorage.getItem('bd_mine') || '[]'); } catch (e) {}
        Object.keys(old.custom || {}).forEach(function (k) {
          (old.custom[k] || []).forEach(function (it) {
            if (it && it.line && !mine.some(function (m) { return m.line === it.line; })) mine.push(it);
          });
        });
        localStorage.setItem('bd_mine', JSON.stringify(mine));
        save();
      }
      localStorage.setItem('bd_migrated', '1');
    } catch (e) {}
  })();

  function isFav(t) { return favs.indexOf(t) !== -1; }
  function paintStars(root) {
    (root || document).querySelectorAll('[data-fav]').forEach(function (b) {
      var on = isFav(b.getAttribute('data-fav'));
      b.classList.toggle('on', on);
      b.setAttribute('aria-label', on ? T.favRemove : T.favAdd);
    });
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-fav]');
    if (!b) return;
    e.preventDefault(); e.stopPropagation();
    var t = b.getAttribute('data-fav');
    var i = favs.indexOf(t);
    if (i === -1) favs.push(t); else favs.splice(i, 1);
    save(); paintStars();
    if (window.BDKonto && window.BDKonto.favEndret) window.BDKonto.favEndret();
    if (document.body.dataset.page === 'favourites') location.reload();
  });
  // Favorittene kan komme inn fra kontoen etter at siden er tegnet
  document.addEventListener('bd:favs', function () {
    favs = load(); paintStars();
    if (document.body.dataset.page === 'favourites') location.reload();
  });
  paintStars();

  /* ---------- felles innhold ---------- */
  function getData() {
    if (data) return Promise.resolve(data);
    return fetch('/content.json').then(function (r) { return r.json(); }).then(function (j) { data = j; return j; });
  }
  function pick(o) { return !o ? '' : (typeof o === 'string' ? o : (o[LANG] || o.no || '')); }
  function tf(it, f) {
    if (LANG !== 'no' && it[LANG]) { var k = { line: 'l', ctx: 'c', note: 'n' }[f]; if (it[LANG][k]) return it[LANG][k]; }
    return it[f] || '';
  }
  function vis(x) { return !x.only || x.only === LANG; }
  function flat(d) {
    var out = [];
    d.filter(vis).forEach(function (s) {
      s.groups.filter(vis).forEach(function (g) {
        g.items.filter(vis).forEach(function (it) {
          if (g.type === 'dict') out.push({ kind: 'dict', word: it.word, def: (LANG !== 'no' && typeof it[LANG] === 'string') ? it[LANG] : it.def, tags: it._s || '', cat: pick(s.title) });
          else if (g.type === 'game') out.push({ kind: 'game', name: pick(it.name), cat: pick(s.title) });
          else out.push({ kind: 'line', line: tf(it, 'line'), ctx: tf(it, 'ctx'), note: tf(it, 'note'), tags: it._s || '', cat: pick(s.title) });
        });
      });
    });
    return out;
  }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function cardHTML(it) {
    var copy = it.kind === 'dict' ? (it.word + ' – ' + it.def) : (it.kind === 'game' ? it.name : it.line);
    var body = it.kind === 'dict'
      ? '<p class="word">' + esc(it.word) + '</p><p class="def">' + esc(it.def) + '</p>'
      : it.kind === 'game'
        ? '<p class="word">' + esc(it.name) + '</p>'
        : (it.ctx ? '<p class="ctx">' + esc(it.ctx) + '</p>' : '') + '<p class="line">«' + esc(it.line) + '»</p>' +
          (it.note ? '<p class="note">' + esc(it.note) + '</p>' : '');
    return '<article class="card" data-copy="' + esc(copy) + '" tabindex="0">' +
      '<p class="catlabel">' + esc(it.cat) + '</p>' + body +
      '<div class="cardacts"><button class="starbtn" data-fav="' + esc(copy) + '">' + T.star + '</button>' +
      '<button class="sharebtn" data-share="' + esc(copy) + '">' + T.share + '</button></div></article>';
  }

  /* ---------- søk ---------- */
  var so, si, sr, sn, dov, dc, timer, last = null;
  function openSearch() {
    if (!so) return;
    so.hidden = false; document.body.classList.add('noscroll');
    getData().then(function () { setTimeout(function () { si.focus(); }, 60); });
  }
  function closeSearch() { if (so) so.hidden = true; document.body.classList.remove('noscroll'); }
  function closeDice() { if (dov) dov.hidden = true; document.body.classList.remove('noscroll'); }

  document.addEventListener('click', function (e) { if (e.target.closest('[data-search]')) { e.preventDefault(); openSearch(); } });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { closeSearch(); closeDice(); }
    if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) { e.preventDefault(); openSearch(); }
  });

  function onInput() {
    clearTimeout(timer);
    timer = setTimeout(function () {
      var q = si.value.trim().toLowerCase();
      if (q.length < 2) { sr.innerHTML = ''; sn.textContent = T.hint; return; }
      getData().then(function (d) {
        var hits = flat(d).filter(function (it) {
          return JSON.stringify(it).toLowerCase().indexOf(q) !== -1;
        }).slice(0, 60);
        sn.textContent = hits.length ? hits.length + ' ' + T.results : T.none;
        sr.innerHTML = hits.map(cardHTML).join('');
        paintStars(sr);
      });
    }, 120);
  }

  /* ---------- terning ---------- */
  function deal() {
    getData().then(function (d) {
      var pool = flat(d).filter(function (x) { return x.kind === 'line'; });
      var p = pool[Math.floor(Math.random() * pool.length)];
      var guard = 0;
      while (last && p.line === last && pool.length > 1 && guard++ < 10) p = pool[Math.floor(Math.random() * pool.length)];
      last = p.line;
      dc.innerHTML = (p.ctx ? '<p class="ctx">' + esc(p.ctx) + '</p>' : '') +
        '<p class="line">«' + esc(p.line) + '»</p>' + (p.note ? '<p class="note">' + esc(p.note) + '</p>' : '');
      dc.setAttribute('data-copy', p.line);
      dov.hidden = false; document.body.classList.add('noscroll');
    });
  }

  /* ---------- binding, kjøres på nytt ved hver sidevisning ---------- */
  function rebind() {
    so = document.getElementById('searchOverlay');
    si = document.getElementById('searchInput');
    sr = document.getElementById('searchResults');
    sn = document.getElementById('searchNote');
    dov = document.getElementById('diceOverlay');
    dc = document.getElementById('dealCard');
    document.body.classList.remove('noscroll');

    if (si) si.addEventListener('input', onInput);
    var sc = document.getElementById('searchClose');
    if (sc) sc.addEventListener('click', closeSearch);
    if (so) so.addEventListener('click', function (e) { if (e.target === so) closeSearch(); });

    var db = document.getElementById('diceBtn');
    if (db) db.addEventListener('click', deal);
    var da = document.getElementById('dealAgain');
    if (da) da.addEventListener('click', deal);
    var dcp = document.getElementById('dealCopy');
    if (dcp) dcp.addEventListener('click', function () { if (dc) dc.click(); });
    var dcl = document.getElementById('dealClose');
    if (dcl) dcl.addEventListener('click', closeDice);
    if (dov) dov.addEventListener('click', function (e) { if (e.target === dov) closeDice(); });

    paintStars();
  }

  window.__bdTools = { rebind: rebind };
  rebind();
  document.addEventListener('astro:page-load', rebind);
})();
})();<\/script>`;
}, "C:/Users/jonas/Documents/GitHub/banterdeck/src/components/Tools.astro", void 0);
//#endregion
//#region src/components/KontoKlient.astro
var $$KontoKlient = createComponent(($$result, $$props, $$slots) => {
	const URL_ = supabaseUrl().replace(/\/$/, "");
	const KEY = supabaseAnonKey();
	return renderTemplate`<script>(function(){${defineScriptVars({
		URL_,
		KEY
	})}
(function () {
  if (window.BDKonto) return;
  var NOKKEL = 'bd_session';
  function les() { try { return JSON.parse(localStorage.getItem(NOKKEL) || 'null'); } catch (e) { return null; } }
  function lagre(s) {
    try { s ? localStorage.setItem(NOKKEL, JSON.stringify(s)) : localStorage.removeItem(NOKKEL); } catch (e) {}
    lyttere.forEach(function (f) { try { f(s); } catch (e) {} });
  }
  var lyttere = [], brukerLagret = null, oppfrisker = null;

  function oppfrisk() {
    var s = les();
    if (!s || !s.refresh_token) return Promise.resolve(false);
    if (oppfrisker) return oppfrisker;
    oppfrisker = fetch(URL_ + '/auth/v1/token?grant_type=refresh_token', {
      method: 'POST', headers: { apikey: KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: s.refresh_token })
    }).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
      oppfrisker = null;
      if (!d || !d.access_token) { lagre(null); return false; }
      lagre({ access_token: d.access_token, refresh_token: d.refresh_token });
      return true;
    }).catch(function () { oppfrisker = null; return false; });
    return oppfrisker;
  }

  /** Supabase-kall med innloggingen. Prøver å fornye den én gang hvis den er utløpt. */
  function sb(sti, opts, igjen) {
    opts = Object.assign({}, opts || {});
    var s = les();
    opts.headers = Object.assign({ apikey: KEY, 'Content-Type': 'application/json' }, opts.headers || {});
    if (s && s.access_token) opts.headers.Authorization = 'Bearer ' + s.access_token;
    return fetch(URL_ + sti, opts).then(function (r) {
      if (r.status === 401 && s && !igjen) return oppfrisk().then(function (ok) { return ok ? sb(sti, opts, true) : r; });
      return r;
    });
  }
  /** Kall til våre egne /api-ruter med innloggingen. */
  function api(sti, opts, igjen) {
    opts = Object.assign({}, opts || {});
    var s = les();
    opts.headers = Object.assign({ 'Content-Type': 'application/json' }, opts.headers || {});
    if (s && s.access_token) opts.headers.Authorization = 'Bearer ' + s.access_token;
    return fetch(sti, opts).then(function (r) {
      if (r.status === 401 && s && !igjen) return oppfrisk().then(function (ok) { return ok ? api(sti, opts, true) : r; });
      return r;
    });
  }

  /** Hvem er logget inn? Gir { id, email, brukernavn } eller null. */
  function bruker(tving) {
    if (!URL_ || !KEY || !les()) return Promise.resolve(null);
    if (brukerLagret && !tving) return brukerLagret;
    brukerLagret = sb('/auth/v1/user').then(function (r) {
      if (!r.ok) { if (r.status === 401 || r.status === 403) lagre(null); brukerLagret = null; return null; }
      return r.json();
    }).then(function (u) {
      if (!u) return null;
      return sb('/rest/v1/profiler?select=brukernavn&user_id=eq.' + u.id).then(function (r) { return r.ok ? r.json() : []; })
        .catch(function () { return []; })
        .then(function (rader) { return { id: u.id, email: u.email || '', brukernavn: (rader[0] && rader[0].brukernavn) || '' }; });
    }).catch(function () { brukerLagret = null; return null; });
    return brukerLagret;
  }

  /* ---------- lagrede kortstokker ---------- */
  var stokker = {
    liste: function () {
      return sb('/rest/v1/kortstokker?select=id,navn,kort,oppdatert,delt&order=oppdatert.desc').then(function (r) {
        if (!r.ok) throw new Error('Fikk ikke hentet kortstokkene.'); return r.json();
      });
    },
    lagre: function (st) {
      var kropp = { navn: String(st.navn || 'Uten navn').slice(0, 40), kort: (st.kort || []).slice(0, 300).map(function (t) { return String(t).slice(0, 140); }), oppdatert: new Date().toISOString() };
      var sti = '/rest/v1/kortstokker' + (st.id ? '?id=eq.' + encodeURIComponent(st.id) : '');
      return sb(sti, { method: st.id ? 'PATCH' : 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify(kropp) })
        .then(function (r) { if (!r.ok) throw new Error('Fikk ikke lagret kortstokken.'); return r.json(); })
        .then(function (rader) { return rader[0]; });
    },
    del: function (id, delt) {
      return sb('/rest/v1/kortstokker?id=eq.' + encodeURIComponent(id), { method: 'PATCH', body: JSON.stringify({ delt: !!delt }) })
        .then(function (r) { if (!r.ok) throw new Error('Fikk ikke endret delingen.'); });
    },
    slett: function (id) {
      return sb('/rest/v1/kortstokker?id=eq.' + encodeURIComponent(id), { method: 'DELETE' }).then(function (r) { if (!r.ok) throw new Error('Fikk ikke slettet.'); });
    }
  };

  /* ---------- kontodata: én rad i «decks» med replikker og favoritter ---------- */
  var data = {
    hent: function () {
      return sb('/rest/v1/decks?select=data').then(function (r) { return r.ok ? r.json() : null; })
        .then(function (rows) { return rows ? ((rows[0] && rows[0].data) || {}) : null; }).catch(function () { return null; });
    },
    /** Slår sammen endringene med det som ligger der fra før, så replikker og favoritter ikke overskriver hverandre. */
    lagre: function (endring) {
      // Én lagring av gangen, ellers kan to samtidige lagringer overskrive hverandre
      var jobb = koe.then(function () { return lagreNaa(endring); });
      koe = jobb.catch(function () {});
      return jobb;
    }
  };
  var koe = Promise.resolve();
  function lagreNaa(endring) {
      return bruker().then(function (u) {
        if (!u) return false;
        return data.hent().then(function (naa) {
          if (naa === null) return false;
          var ny = Object.assign({}, naa, endring);
          return sb('/rest/v1/decks', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates' }, body: JSON.stringify({ user_id: u.id, data: ny }) })
            .then(function (r) { return r.ok; });
        });
      }).catch(function () { return false; });
  }

  /* ---------- favoritter følger kontoen ----------
     Nyeste endring vinner. Første gang på en ny enhet slås lokale og lagrede sammen. */
  function lesLS(k, d) { try { var v = JSON.parse(localStorage.getItem(k) || 'null'); return v == null ? d : v; } catch (e) { return d; } }
  function skrivLS(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  var synkTimer = null;
  function synkFav(bareSend) {
    if (!les()) return Promise.resolve(false);
    var lokal = lesLS('bd_favs', []), tid = Number(lesLS('bd_favs_tid', 0)) || 0;
    var sendt = function (ok) { if (ok) skrivLS('bd_favs_sendt', tid); return ok; };
    if (bareSend && tid) return data.lagre({ favs: lokal, favTid: tid }).then(sendt);
    return data.hent().then(function (d) {
      if (!d) return false;
      var fjern = d.favs || [], ft = Number(d.favTid) || 0;
      if (!tid) {
        var alle = lokal.slice(); fjern.forEach(function (f) { if (alle.indexOf(f) === -1) alle.push(f); });
        var naa = Date.now(); skrivLS('bd_favs', alle); skrivLS('bd_favs_tid', naa);
        if (alle.length !== lokal.length) document.dispatchEvent(new CustomEvent('bd:favs'));
        return data.lagre({ favs: alle, favTid: naa });
      }
      if (ft > tid) { skrivLS('bd_favs', fjern); skrivLS('bd_favs_tid', ft); document.dispatchEvent(new CustomEvent('bd:favs')); return true; }
      if (tid > ft) return data.lagre({ favs: lokal, favTid: tid }).then(sendt);
      return true;
    });
  }
  function favEndret() {
    skrivLS('bd_favs_tid', Date.now());
    clearTimeout(synkTimer); synkTimer = setTimeout(function () { synkFav(true); }, 800);
  }
  // Én gang per økt: hent favorittene fra kontoen. Endringer som ikke rakk å bli sendt, sendes nå.
  try {
    if (les()) {
      if (!sessionStorage.getItem('bd_favsynk')) { sessionStorage.setItem('bd_favsynk', '1'); setTimeout(function () { synkFav(); }, 400); }
      else if ((Number(lesLS('bd_favs_tid', 0)) || 0) > (Number(lesLS('bd_favs_sendt', 0)) || 0)) setTimeout(function () { synkFav(true); }, 400);
    }
  } catch (e) {}

  window.BDKonto = {
    klar: Boolean(URL_ && KEY),
    cfg: { url: URL_, anon: KEY },
    les: les, lagre: function (s) { brukerLagret = null; lagre(s); },
    loggUt: function () {
      var s = les();
      if (s && s.access_token) sb('/auth/v1/logout', { method: 'POST' }).catch(function () {});
      brukerLagret = null; lagre(null);
      try { sessionStorage.removeItem('bd_favsynk'); localStorage.removeItem('bd_favs_tid'); } catch (e) {}
    },
    sb: sb, api: api, bruker: bruker, stokker: stokker, data: data, synkFav: synkFav, favEndret: favEndret,
    naarEndret: function (f) { lyttere.push(f); }
  };
})();
})();<\/script>`;
}, "C:/Users/jonas/Documents/GitHub/banterdeck/src/components/KontoKlient.astro", void 0);
//#endregion
//#region src/components/FeilRapport.astro
createAstro("https://www.mittvors.no");
var $$FeilRapport = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$FeilRapport;
	const { lang = "no" } = Astro.props;
	return renderTemplate`<script>(function(){${defineScriptVars({ NO: lang === "no" })}
(function () {
  if (window.__bdFeil) return; window.__bdFeil = true;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-feil]'); if (!b) return;
    e.preventDefault();
    var m = document.createElement('div'); m.className = 'rom-tavle'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-label', NO ? 'Meld fra om feil' : 'Report a problem');
    m.innerHTML = '<form class="rom-tavle-innhold feil-skjema"><div class="rom-tavle-topp"><h2>' + (NO ? 'Noe galt?' : 'Something wrong?') + '</h2><button class="linkbtn" type="button" data-f="lukk">' + (NO ? 'Lukk' : 'Close') + '</button></div>' +
      '<p class="small">' + (NO ? 'Skriv kort hva du gjorde og hva som skjedde. Vi sender med hvilken side du er på – ikke navn eller e-post.' : 'Tell us briefly what you did and what happened. We include which page you are on – never your name or email.') + '</p>' +
      '<textarea name="tekst" maxlength="1500" required aria-label="' + (NO ? 'Hva skjedde?' : 'What happened?') + '" placeholder="' + (NO ? 'F.eks. «Maria fikk ikke opp svaralternativene i Nyhetsrunden»' : 'E.g. “The next card did not show up”') + '"></textarea>' +
      '<input name="website" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">' +
      '<div class="dl-knapper"><button class="btn gold" type="submit">' + (NO ? 'Send' : 'Send') + '</button></div><p class="formmsg" role="status"></p></form>';
    document.body.appendChild(m);
    var f = m.querySelector('form'), msg = m.querySelector('.formmsg');
    m.querySelector('textarea').focus();
    // Lukk vinduet og gi fokus tilbake til lenken som åpnet det
    function lukk() { if (!m.isConnected) return; m.remove(); if (b.isConnected) b.focus(); }
    m.addEventListener('click', function (ev) { if (ev.target === m || ev.target.closest('[data-f=lukk]')) lukk(); });
    m.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') lukk(); });
    f.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var tekst = f.tekst.value.trim(); if (tekst.length < 5) return;
      var k = { side: location.pathname + location.search };
      try { if (window.__bdFeilKontekst) Object.assign(k, window.__bdFeilKontekst()); } catch (x) {}
      f.querySelector('button[type=submit]').disabled = true;
      fetch('/api/feil', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tekst: tekst, kontekst: k, website: f.website.value }) })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          if (d.ok) { msg.className = 'formmsg ok'; msg.textContent = NO ? 'Takk! Det er sendt.' : 'Thanks! Sent.'; setTimeout(lukk, 1400); }
          else { msg.className = 'formmsg err'; msg.textContent = d.error || (NO ? 'Fikk ikke sendt.' : 'Could not send.'); f.querySelector('button[type=submit]').disabled = false; }
        })
        .catch(function () { msg.className = 'formmsg err'; msg.textContent = NO ? 'Ingen kontakt. Prøv igjen.' : 'No connection. Try again.'; f.querySelector('button[type=submit]').disabled = false; });
    });
  });
})();
})();<\/script>`;
}, "C:/Users/jonas/Documents/GitHub/banterdeck/src/components/FeilRapport.astro", void 0);
//#endregion
//#region src/components/FeilFangst.astro
var $$FeilFangst = createComponent(($$result, $$props, $$slots) => {
	return renderTemplate`<script>(function(){${defineScriptVars({ BYGG: "2026-10-08" })}
(function () {
  if (window.__mvFeilFangst) return; window.__mvFeilFangst = true;
  var ORIGO = location.origin, sett = {}, antall = 0;
  // Støy vi ikke kan gjøre noe med: brudd i nettet, utvidelser, andre domener, lyd og vekking som nettleseren nekter
  var STOY = /^(Uncaught )?Script error\\.?$|ResizeObserver loop|Failed to fetch|Load failed|NetworkError|Network request failed|AbortError|aborted|cancell?ed|avbrutt|webkit-masked-url|extension:\\/\\/|NotAllowedError|wake ?lock|play\\(\\)|vibrate|QuotaExceeded|Non-Error promise rejection/i;
  /** Bare stien for våre egne adresser (ingen ?-del), null for andre domener. */
  function sti(u) {
    try { var x = new URL(u, location.href); return x.origin === ORIGO ? x.pathname : null; } catch (e) { return null; }
  }
  /** Fjerner alt som kan si noe om hvem: fulle adresser blir til stien, e-poster forsvinner. */
  function vask(s, n) {
    return String(s == null ? '' : s)
      .replace(/https?:\\/\\/[^\\s)'"]+/g, function (m) {
        var lk = (m.match(/(:\\d+){1,2}$/) || [''])[0], p = sti(m.slice(0, m.length - lk.length));
        return p === null ? '[annet nettsted]' : p + lk;
      })
      .replace(/[\\w.+-]+@[\\w-]+(\\.[\\w-]+)+/g, '[e-post]')
      .slice(0, n);
  }
  function meld(melding, fil, linje, kol, stakk) {
    melding = vask(melding, 300).trim();
    if (!melding || STOY.test(melding) || antall >= 5) return;
    var kilde = '';
    if (fil) {
      var p = sti(String(fil));
      if (p === null) return;   // feil i et skript fra et annet nettsted eller en utvidelse
      kilde = p + (linje ? ':' + linje + ':' + (kol || 0) : '');
    }
    stakk = String(stakk || '');
    if (stakk && stakk.indexOf(ORIGO) === -1 && /https?:\\/\\/|extension:\\/\\//.test(stakk)) return;   // ingen av linjene er våre
    var nokkel = melding + '|' + kilde;
    if (sett[nokkel]) return; sett[nokkel] = 1; antall++;
    var k = '';
    try { var x = window.__bdFeilKontekst && window.__bdFeilKontekst(); if (x) k = [x.lekId, x.fase].filter(Boolean).join(' · '); } catch (e) {}
    var body = JSON.stringify({ auto: 1, melding: melding, kilde: kilde, side: location.pathname, stakk: vask(stakk, 1500).split('\\n').slice(0, 10).join('\\n'), versjon: BYGG, kontekst: vask(k, 80) });
    try { fetch('/api/feil', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body, keepalive: true }).catch(function () {}); } catch (e) {}
  }
  window.addEventListener('error', function (e) {
    if (!e || !e.message) return;
    meld(e.message, e.filename, e.lineno, e.colno, e.error && e.error.stack);
  });
  window.addEventListener('unhandledrejection', function (e) {
    var r = e && e.reason; if (r == null) return;
    if (typeof r === 'object' && (r.status !== undefined || r.kode !== undefined)) return;   // serveren svarte med en feil – ikke en feil i koden
    var m = r && r.message ? ((r.name && r.name !== 'Error' ? r.name + ': ' : '') + r.message) : (typeof r === 'string' ? r : '');
    if (m) meld(m, '', 0, 0, r && r.stack);
  });
  // Nytt sidebytte (uten full lasting): nye fem. Samme feil sendes likevel bare én gang.
  document.addEventListener('astro:after-swap', function () { antall = 0; });
})();
})();<\/script>`;
}, "C:/Users/jonas/Documents/GitHub/banterdeck/src/components/FeilFangst.astro", void 0);
//#endregion
//#region src/components/Alkoholfri.astro
var $$Alkoholfri = createComponent(($$result, $$props, $$slots) => {
	return renderTemplate`<script>
(function () {
  if (window.BDTorr) return;
  var TALL = '(\\\\d+|en|én|ett|to|tre|fire|fem|seks|sju|syv|åtte|ni|ti)';
  var REGLER = [
    [/🍺/g, '🥤'], [/🍻/g, '🎉'],
    [/(^|[^\\wæøåé])(en|én|1)\\s+shot\\b/gi, function (m, p) { return p + '5 straffepoeng'; }],
    [/\\bshots?\\b/gi, '5 straffepoeng'],
    [/\\bdrikker (du|dere|han|hun|de|alle|den|vedkommende) opp( glasset \\w+| glasset| drikken \\w+| resten)?/gi, function (m, h) { return 'tar ' + h + ' 5 straffepoeng'; }],
    [/\\b(drikk|drikke) opp( glasset \\w+| glasset| drikken \\w+| resten)/gi, 'ta 5 straffepoeng'],
    [/\\bbegynner å drikke\\b/gi, 'begynner å klappe'], [/\\bslutte å drikke\\b/gi, 'slutte å klappe'], [/\\bstoppe å drikke\\b/gi, 'stoppe å klappe'],
    [/\\bdrikker opp\\b/gi, 'tar 5 straffepoeng'],
    [/\\bdrikke opp\\b/gi, 'ta 5 straffepoeng'],
    [/\\bdrikk opp\\b/gi, 'ta 5 straffepoeng'],
    [/\\bdrakk opp\\b/gi, 'tok 5 straffepoeng'],
    [/\\bdrikker dobbelt\\b/gi, 'får dobbelt straff'],
    [/\\bdrikke-/gi, 'Fest-'],
    [/\\bdrikkeleke/gi, 'festleke'], [/\\bdrikkelek/gi, 'festlek'], [/\\bdrikkekort/gi, 'festkort'], [/\\bdrikkespill/gi, 'festspill'],
    [/\\bdrikkehjul/gi, 'straffehjul'], [/\\bdrikkepartner/gi, 'straffepartner'],
    [/(^|[^\\wæøåé])(en|én)\\s+slurk\\b/gi, function (m, p) { return p + 'ett straffepoeng'; }],
    [/\\bslurkene\\b/gi, 'straffepoengene'], [/\\bslurken\\b/gi, 'straffepoenget'], [/\\bslurker\\b/gi, 'straffepoeng'], [/\\bslurk\\b/gi, 'straffepoeng'],
    [/\\bslurke/gi, 'straffe'],
    [/\\bmest tørste?\\b/gi, 'mest straffet'], [/\\btørstigste\\b/gi, 'mest straffede'],
    [/\\bmest edru\\b/gi, 'minst straffet'], [/\\bedruste\\b/gi, 'minst straffede'],
    [new RegExp('\\\\bdrikker\\\\s+' + TALL + '(?![\\\\wæøåé])(?!\\\\s+straff)', 'gi'), function (m, n) { return 'tar ' + ett(n) + ' straffepoeng'; }],
    [new RegExp('\\\\bdrikke\\\\s+' + TALL + '(?![\\\\wæøåé])(?!\\\\s+straff)', 'gi'), function (m, n) { return 'ta ' + ett(n) + ' straffepoeng'; }],
    [new RegExp('\\\\bdrikk\\\\s+' + TALL + '(?![\\\\wæøåé])(?!\\\\s+straff)', 'gi'), function (m, n) { return 'ta ' + ett(n) + ' straffepoeng'; }],
    [/\\bdrikker(?=\\s+\\d|\\s+(to|tre|fire|fem|ett)\\s+straff)/gi, 'tar'],
    [/\\bdrikk(?=\\s+(\\d|to|tre|fire|fem|ett)\\S*\\s+straff)/gi, 'ta'],
    [/\\bdrikke(?=\\s+(\\d|to|tre|fire|fem|ett)\\S*\\s+straff)/gi, 'ta'],
    [/\\bdrakk\\b/gi, 'fikk straff'],
    [/\\bdrikker\\b/gi, 'tar straff'], [/\\bdrikke\\b/gi, 'ta straff'], [/\\bdrikk\\b/gi, 'ta straff'],
  ];
  // Engelsk: sips → penalty points, drink → take a penalty
  var N_EN = '(\\\\d+|one|two|three|four|five|six|seven|eight|nine|ten)';
  var REGLER_EN = [
    [/🍺/g, '🥤'], [/🍻/g, '🎉'],
    [/(^|[^\\w])(a|one|1)\\s+shot\\b/gi, function (m, p) { return p + '5 penalty points'; }],
    [/\\bshots?\\b/gi, '5 penalty points'],
    [/\\bfinish(es)? (your|their|his|her|the) (drink|glass)\\b/gi, function (m, e) { return 'take' + (e ? 's' : '') + ' 5 penalty points'; }],
    [/\\bdrinks? double\\b/gi, 'gets a double penalty'],
    [/\\bdrinking games\\b/gi, 'party games'], [/\\bdrinking game\\b/gi, 'party game'], [/\\bdrinking wheel\\b/gi, 'penalty wheel'],
    [/\\bdrinking (bingo|yahtzee|buddy|partner)\\b/gi, function (m, x) { return 'party ' + x; }],
    [/\\b(a|one) sip\\b/gi, 'one penalty point'], [/\\bsips\\b/gi, 'penalty points'], [/\\bsip\\b/gi, 'penalty point'],
    [new RegExp('\\\\bdrinks\\\\s+' + N_EN + '\\\\b(?!\\\\s+penalty)', 'gi'), function (m, n) { return 'takes ' + n + ' penalty points'; }],
    [new RegExp('\\\\bdrink\\\\s+' + N_EN + '\\\\b(?!\\\\s+penalty)', 'gi'), function (m, n) { return 'take ' + n + ' penalty points'; }],
    [/\\bdrinks(?=\\s+(\\d|one|two|three|four|five)\\S*\\s+penalty)/gi, 'takes'], [/\\bdrink(?=\\s+(\\d|one|two|three|four|five)\\S*\\s+penalty)/gi, 'take'],
    [/\\b(starts?|stop|stops) (to )?drink(ing)?\\b/gi, function (m, v, to) { return v + ' ' + (to || '') + (m.slice(-3) === 'ing' ? 'clapping' : 'clap'); }],
    [/\\bthirstiest\\b/gi, 'most penalised'], [/\\bmost sober\\b/gi, 'least penalised'],
    // «drink» som verb (ikke «your drink», «a drink»)
    [/(\\b(?:your|their|his|her|a|the|my|of|no)\\s+)?\\b(drinks|drink)\\b/gi, function (m, foran, v) {
      if (foran) return m;
      return v.toLowerCase() === 'drinks' ? 'takes a penalty' : 'take a penalty';
    }],
    [/\\b(1|one) penalty points\\b/gi, function (m, n) { return n + ' penalty point'; }],
  ];
  function ett(n) { return /^(en|én)$/i.test(n) ? 'ett' : n; }
  function erEngelsk() { return /^en/.test(document.documentElement.lang || ''); }
  function tekst(s) {
    var en = erEngelsk();
    if (!s || !(en ? /drink|sip|shot|thirst|sober|🍺|🍻/i : /drikk|drakk|slurk|shot|tørst|edru|🍺|🍻/i).test(s)) return s;
    var ut = String(s);
    (en ? REGLER_EN : REGLER).forEach(function (r) {
      ut = ut.replace(r[0], function () {
        var m = arguments[0], ny = typeof r[1] === 'function' ? r[1].apply(null, arguments) : r[1];
        // Behold stor forbokstav
        if (m && m[0] !== m[0].toLowerCase() && ny) ny = ny[0].toUpperCase() + ny.slice(1);
        return ny;
      });
    });
    return ut;
  }
  var original = new WeakMap(), satt = new WeakMap();
  function hopp(node) {
    var p = node.parentElement;
    return !p || p.closest('script,style,textarea,input,code,[contenteditable],[data-ikke-torr]');
  }
  function aktiv() {
    var h = document.documentElement;
    if (!/^(no|nb|nn|en)/.test(h.lang || '')) return false;
    if (h.dataset.alkoholfri === '1') return true;
    if (h.dataset.alkoholfri === '0') return false;
    try { return localStorage.getItem('bd_alkoholfri') === '1'; } catch (e) { return false; }
  }
  function node(n) {
    if (n.nodeType !== 3 || hopp(n)) return;
    if (satt.get(n) === n.nodeValue) return;           // det er vi som skrev teksten
    var ny = tekst(n.nodeValue);
    if (ny !== n.nodeValue) { original.set(n, n.nodeValue); n.nodeValue = ny; satt.set(n, ny); }
  }
  function tre(rot) {
    if (!rot) return;
    if (rot.nodeType === 3) return node(rot);
    var w = document.createTreeWalker(rot, NodeFilter.SHOW_TEXT), n;
    while ((n = w.nextNode())) node(n);
  }
  function tilbake(rot) {
    var w = document.createTreeWalker(rot || document.body, NodeFilter.SHOW_TEXT), n;
    while ((n = w.nextNode())) {
      if (original.has(n) && satt.get(n) === n.nodeValue) { n.nodeValue = original.get(n); satt.delete(n); original.delete(n); }
    }
  }
  var paa = false;
  function oppdater() {
    var skal = aktiv();
    document.documentElement.classList.toggle('alkoholfri', skal);
    if (skal) tre(document.body);
    else if (paa) tilbake(document.body);
    paa = skal;
    document.querySelectorAll('[data-alkoholfri-bryter]').forEach(function (b) { b.setAttribute('aria-pressed', String(egen())); });
  }
  function egen() { try { return localStorage.getItem('bd_alkoholfri') === '1'; } catch (e) { return false; } }
  var obs = new MutationObserver(function (liste) {
    if (!paa) return;
    liste.forEach(function (m) {
      if (m.type === 'characterData') node(m.target);
      else m.addedNodes.forEach(function (n) { tre(n); });
    });
  });
  function start() {
    obs.observe(document.documentElement, { subtree: true, childList: true, characterData: true });
    oppdater();
  }
  // Rommet skrur av og på via <html data-alkoholfri>
  new MutationObserver(oppdater).observe(document.documentElement, { attributes: true, attributeFilter: ['data-alkoholfri', 'lang'] });
  document.addEventListener('astro:after-swap', oppdater);
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-alkoholfri-bryter]'); if (!b) return;
    BDTorr.sett(!egen());
  });
  window.BDTorr = {
    tekst: function (s) { return aktiv() ? tekst(s) : s; },
    alltid: tekst,
    aktiv: aktiv,
    egen: egen,
    sett: function (v) { try { localStorage.setItem('bd_alkoholfri', v ? '1' : '0'); } catch (e) {} oppdater(); },
  };
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
})();
<\/script>`;
}, "C:/Users/jonas/Documents/GitHub/banterdeck/src/components/Alkoholfri.astro", void 0);
//#endregion
//#region src/components/Verving.astro
var $$Verving = createComponent(($$result, $$props, $$slots) => {
	return renderTemplate`<script>
(function () {
  if (window.BDDel) return;
  function L(no, en) { return /^en/.test(document.documentElement.lang || '') ? en : no; }
  /* ---------- husk vervekoden ---------- */
  function fangKode() {
    try {
      var u = new URL(location.href), v = (u.searchParams.get('v') || '').toUpperCase();
      if (!/^[A-Z0-9]{6}$/.test(v)) return;
      if (!localStorage.getItem('bd_verv_ferdig')) localStorage.setItem('bd_verv', JSON.stringify({ k: v, t: Date.now() }));
      u.searchParams.delete('v');
      history.replaceState(history.state, '', u.pathname + (u.search || '') + u.hash);
    } catch (e) {}
  }
  fangKode();
  document.addEventListener('astro:after-swap', fangKode);

  window.BDVerv = {
    kode: function () {
      try {
        var x = JSON.parse(localStorage.getItem('bd_verv') || 'null');
        return x && x.k && Date.now() - x.t < 60 * 864e5 ? x.k : null;
      } catch (e) { return null; }
    },
    /** Kalles når man er innlogget og med i et rom med minst to telefoner. */
    fullfor: function () {
      var k = this.kode(), K = window.BDKonto;
      if (!k || !K || !K.les || !K.les()) return;
      try { if (localStorage.getItem('bd_verv_ferdig')) return; } catch (e) { return; }
      K.api('/api/verv/fullfor', { method: 'POST', body: JSON.stringify({ kode: k }) }).then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (d) {
          if (r.ok || d.ferdig) { try { localStorage.setItem('bd_verv_ferdig', '1'); localStorage.removeItem('bd_verv'); } catch (e) {} }
          if (r.ok && d.ok && window.BDToast) window.BDToast(L('🎁 Du og vennen som vervet deg fikk et gratis kveldspass!', '🎁 You and the friend who invited you each got a free night pass!'));
        });
      }).catch(function () {});
    },
  };

  /* ---------- delingsvalg ---------- */
  var ark = null;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function lukk() { if (ark) { ark.remove(); ark = null; } }
  function kopier(t) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(t);
    var i = document.createElement('textarea'); i.value = t; document.body.appendChild(i); i.select();
    try { document.execCommand('copy'); } catch (e) {} i.remove(); return Promise.resolve();
  }
  /** Skjema for å invitere på e-post. Innlogget: siden sender fra post@mittvors.no. Ellers: åpner e-postappen. */
  function epostSkjema(url, tekst) {
    if (!ark) return;
    var K = window.BDKonto, inne = !!(K && K.les && K.les());
    var navn = ''; try { navn = JSON.parse(localStorage.getItem('bd_mittnavn') || '""') || ''; } catch (e) {}
    var inn = ark.querySelector('.del-ark-innhold');
    inn.innerHTML = '<div class="del-ark-topp"><h2>' + L('Inviter på e-post', 'Invite by email') + '</h2><button class="linkbtn" data-d="lukk" type="button">' + L('Lukk', 'Close') + '</button></div>' +
      '<form class="form del-epost" id="delEpost">' +
        '<label class="lab" for="deTil">' + L('Til (én eller flere e-postadresser)', 'To (one or more email addresses)') + '</label>' +
        '<textarea id="deTil" rows="2" spellcheck="false" autocapitalize="none" placeholder="' + L('ola@eksempel.no, kari@eksempel.no', 'alex@example.com, sam@example.com') + '" required></textarea>' +
        (inne ? '<label class="lab" for="deNavn">' + L('Navnet ditt', 'Your name') + '</label><input id="deNavn" maxlength="30" value="' + esc(navn) + '" required>' +
          '<label class="lab" for="deMelding">' + L('Hilsen (valgfritt)', 'Message (optional)') + '</label><textarea id="deMelding" rows="2" maxlength="200" placeholder="' + L('Vi er i gang – bli med!', 'We’re getting started – join us!') + '"></textarea>' : '') +
        '<button class="btn gold" type="submit">' + (inne ? L('Send invitasjon', 'Send invite') : L('Åpne e-postappen', 'Open email app')) + '</button>' +
        (inne ? '<p class="small">' + L('Invitasjonen sendes fra post@mittvors.no med navnet ditt. Vi lagrer ikke adressene.', 'The invite is sent from post@mittvors.no with your name. We don’t store the addresses.') + '</p>'
              : '<p class="small">' + L('Logg inn for å sende en pen invitasjon direkte fra Mitt vors.', 'Log in to send a nice invite straight from Mitt vors.') + '</p>') +
        '<p class="formmsg" id="deMsg" role="status"></p>' +
      '</form>';
    var f = inn.querySelector('#delEpost');
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var til = inn.querySelector('#deTil').value.split(/[\\s,;]+/).map(function (x) { return x.trim(); }).filter(Boolean);
      var msg = inn.querySelector('#deMsg');
      if (!til.length) return;
      if (!inne) {
        location.href = 'mailto:' + encodeURIComponent(til.join(',')).replace(/%2C/g, ',') + '?subject=' + encodeURIComponent(L('Bli med på Mitt vors', 'Join me on Mitt vors')) + '&body=' + encodeURIComponent((tekst ? tekst + '\\n\\n' : '') + url);
        return;
      }
      var navnV = inn.querySelector('#deNavn').value.trim();
      try { if (navnV) localStorage.setItem('bd_mittnavn', JSON.stringify(navnV)); } catch (x) {}
      var knapp = f.querySelector('button[type=submit]'); knapp.disabled = true;
      msg.className = 'formmsg'; msg.textContent = L('Sender …', 'Sending …');
      K.api('/api/inviter', { method: 'POST', body: JSON.stringify({ url: url, til: til, navn: navnV, melding: inn.querySelector('#deMelding').value.trim(), lang: /^en/.test(document.documentElement.lang || '') ? 'en' : 'no' }) })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (d) { return { ok: r.ok, d: d }; }); })
        .then(function (x) {
          knapp.disabled = false;
          if (!x.ok) { msg.className = 'formmsg err'; msg.textContent = x.d.melding || L('Fikk ikke sendt.', 'Could not send.'); return; }
          msg.className = 'formmsg ok';
          msg.textContent = L('Sendt til ', 'Sent to ') + x.d.sendt + (x.d.sendt === 1 ? L(' person 🎉', ' person 🎉') : L(' personer 🎉', ' people 🎉'));
          inn.querySelector('#deTil').value = '';
        }).catch(function () { knapp.disabled = false; msg.className = 'formmsg err'; msg.textContent = L('Fikk ikke kontakt.', 'Could not connect.'); });
    });
    inn.querySelector('#deTil').focus();
  }
  window.BDDel = {
    /** Åpner delingsvalget for en lenke. fil (valgfri) er et bilde som deles via telefonens delingsmeny. */
    lenke: function (url, tekst, opts) {
      opts = opts || {};
      lukk();
      var hel = (tekst ? tekst + ' ' : '') + url;
      var mobil = document.documentElement.classList.contains('is-mobile');
      var kanDele = !!navigator.share;
      ark = document.createElement('div'); ark.className = 'del-ark'; ark.setAttribute('role', 'dialog'); ark.setAttribute('aria-label', opts.tittel || L('Del', 'Share'));
      ark.innerHTML = '<div class="del-ark-innhold">' +
        '<div class="del-ark-topp"><h2>' + esc(opts.tittel || L('Del', 'Share')) + '</h2><button class="linkbtn" data-d="lukk" type="button">' + L('Lukk', 'Close') + '</button></div>' +
        (opts.ingress ? '<p class="small">' + esc(opts.ingress) + '</p>' : '') +
        '<div class="del-valg">' +
          (opts.bilde ? '<button type="button" data-d="bilde"><span>📸</span>Snapchat / Instagram<small>' + L('Del bildet i story', 'Post the image to your story') + '</small></button>' : '') +
          (kanDele ? '<button type="button" data-d="dele"><span>📤</span>' + (opts.bilde ? L('Andre apper', 'Other apps') : 'Snapchat, Instagram …') + '<small>' + L('Telefonens delingsmeny', 'Your phone’s share menu') + '</small></button>' : '') +
          (mobil ? '<a href="fb-messenger://share/?link=' + encodeURIComponent(url) + '"><span>💬</span>Messenger<small>' + L('Send lenken', 'Send the link') + '</small></a>' : '') +
          '<a href="sms:?&body=' + encodeURIComponent(hel) + '"><span>✉️</span>SMS<small>' + L('Send lenken', 'Send the link') + '</small></a>' +
          '<button type="button" data-d="epost"><span>📧</span>' + L('E-post', 'Email') + '<small>' + L('Send invitasjon på e-post', 'Send an invite by email') + '</small></button>' +
          '<button type="button" data-d="kopier"><span>🔗</span>' + L('Kopier lenke', 'Copy link') + '<small>' + esc(url.replace(/^https?:\\/\\//, '').slice(0, 40)) + '</small></button>' +
          (opts.bilde && !kanDele ? '<button type="button" data-d="last"><span>⬇️</span>' + L('Last ned bildet', 'Download the image') + '<small>' + L('Legg det ut selv', 'Post it yourself') + '</small></button>' : '') +
        '</div></div>';
      ark.addEventListener('click', function (e) {
        if (e.target === ark) return lukk();
        var b = e.target.closest('[data-d]'); if (!b) return;
        var d = b.dataset.d;
        if (d === 'lukk') return lukk();
        if (d === 'epost') return epostSkjema(url, tekst);
        if (d === 'kopier') return kopier(url).then(function () { b.querySelector('small').textContent = L('Kopiert! ✓', 'Copied! ✓'); });
        if (d === 'dele') return navigator.share({ title: opts.tittel || 'Mitt vors', text: tekst || '', url: url }).catch(function () {});
        if (d === 'bilde' || d === 'last') {
          Promise.resolve(opts.bilde()).then(function (fil) {
            if (!fil) return;
            if (d === 'bilde' && navigator.canShare && navigator.canShare({ files: [fil] })) {
              navigator.share({ files: [fil], title: opts.tittel || 'Mitt vors' }).catch(function () {});
            } else {
              var a = document.createElement('a'); a.href = URL.createObjectURL(fil); a.download = fil.name;
              document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 5000);
            }
          });
        }
      });
      document.body.appendChild(ark);
    },
    lukk: lukk,
    kopier: kopier,
  };
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') lukk(); });
  document.addEventListener('astro:before-swap', lukk);
})();
<\/script>`;
}, "C:/Users/jonas/Documents/GitHub/banterdeck/src/components/Verving.astro", void 0);
//#endregion
//#region node_modules/astro/components/ClientRouter.astro
createAstro("https://www.mittvors.no");
var $$ClientRouter = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$ClientRouter;
	const { fallback = "animate" } = Astro.props;
	return renderTemplate`<meta name="astro-view-transitions-enabled" content="true"><meta name="astro-view-transitions-fallback"${addAttribute(fallback, "content")}>${renderScript($$result, "C:/Users/jonas/Documents/GitHub/banterdeck/node_modules/astro/components/ClientRouter.astro?astro&type=script&index=0&lang.ts")}`;
}, "C:/Users/jonas/Documents/GitHub/banterdeck/node_modules/astro/components/ClientRouter.astro", void 0);
//#endregion
//#region src/layouts/Base.astro
createAstro("https://www.mittvors.no");
var $$Base = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$Base;
	const { title, description, lang = "en", gate = false, noindex = false, bilde = "/og/mittvors.jpg" } = Astro.props;
	const bildeUrl = new URL(bilde, Astro.site);
	if (bildeUrl.pathname.startsWith("/og/")) bildeUrl.searchParams.set("v", "3");
	const L = ui(lang);
	const desc = description || L.tagline;
	const fullTitle = title ? `${title} – ${SITE_NAME}` : `${SITE_NAME} – ${L.tagline}`;
	const canonical = new URL(Astro.url.pathname, Astro.site);
	const altPath = otherLangPath(lang, Astro.url.pathname);
	const enHref = new URL(lang === "en" ? Astro.url.pathname : altPath, Astro.site);
	const noHref = new URL(lang === "no" ? Astro.url.pathname : altPath, Astro.site);
	const current = Astro.url.pathname.replace(/\/$/, "") || "/";
	const erHumor = current === "/" || /^(\/no)?\/(situations|ord|uttrykk|dictionary|favourites|categories|kategori)(\/|$)/.test(current);
	const hasDict = visible(dictSection, lang);
	const nav = [
		{
			href: path(lang, "/"),
			label: L.nav.home,
			icon: "hjem"
		},
		{
			href: path(lang, "/situations"),
			label: L.linesTitle,
			icon: "replikker"
		},
		...hasDict ? [{
			href: path(lang, "/ord"),
			label: L.ordTitle,
			icon: "ordbok"
		}, {
			href: path(lang, "/uttrykk"),
			label: L.uttrykkTitle,
			icon: "uttrykk"
		}] : [],
		{
			href: path(lang, "/drinking-games"),
			label: L.nav.games,
			icon: "drikkeleker"
		}
	];
	const humorNav = nav.filter((n) => [
		"replikker",
		"ordbok",
		"uttrykk"
	].includes(n.icon));
	nav.length = 0;
	if (lang === "no") nav.push({
		href: "/no/",
		label: "Forside",
		icon: "hjem"
	}, {
		href: "/no/drinking-games",
		label: "Drikkeleker",
		icon: "drikkeleker"
	}, {
		href: "/no/rom",
		label: "Spill sammen",
		icon: "terning"
	}, {
		href: "/no/nyhetsrunden",
		label: "Nyhetsrunden",
		icon: "nyhet"
	});
	else nav.push({
		href: "/en",
		label: "Home",
		icon: "hjem"
	}, {
		href: "/drinking-games",
		label: "Drinking games",
		icon: "drikkeleker"
	}, {
		href: "/room",
		label: "Play together",
		icon: "terning"
	}, {
		href: "/plan",
		label: "Plan the night",
		icon: "nyhet"
	});
	const subNav = collectionsFor(lang).map((s) => ({
		href: path(lang, `/categories/${s.id}`),
		label: t(s.title, lang)
	}));
	const quick = lang === "no" ? [
		{
			href: "/no/rom",
			label: "Spill sammen"
		},
		{
			href: "/no/drinking-games",
			label: "Drikkeleker"
		},
		{
			href: "/no/nyhetsrunden",
			label: "Nyhetsrunden"
		},
		{
			href: "/no/kveld",
			label: "Kveldsplan"
		},
		{
			href: "/no/finn-lek",
			label: "Finn lek"
		},
		{
			href: "/no/gjeng",
			label: "Gjengen"
		},
		{
			href: "/no/situations",
			label: "Replikker"
		}
	] : [
		{
			href: "/room",
			label: "Play together"
		},
		{
			href: "/drinking-games",
			label: "Drinking games"
		},
		{
			href: "/plan",
			label: "Plan the night"
		},
		{
			href: "/find-a-game",
			label: "Find a game"
		},
		{
			href: "/crew",
			label: "Your crew"
		},
		{
			href: "/situations",
			label: "Comebacks"
		}
	];
	const isCurrent = (href) => {
		const h = href.replace(/\/$/, "") || "/";
		return current === h || h !== "/" && h !== "/no" && current.startsWith(h + "/");
	};
	return renderTemplate`<html${addAttribute(L.htmlLang, "lang")}><head><meta charset="utf-8"><link rel="preload"${addAttribute(archivo_latin_wdth_normal_default, "href")} as="font" type="font/woff2" crossorigin><meta name="viewport" content="width=device-width, initial-scale=1">${renderComponent($$result, "FeilFangst", $$FeilFangst, {})}<title>${fullTitle}</title><meta name="description"${addAttribute(desc, "content")}>${(noindex || UTVIKLING.paa) && renderTemplate`<meta name="robots" content="noindex, nofollow">`}${UTVIKLING.paa && renderTemplate`<script>(function(){${defineScriptVars({ KODE: UTVIKLING.kode })}
      /* «Under utvikling»: skjul siden til riktig kode er skrevet inn (unntatt sidene Vipps må se).
         Tilgangen huskes i localStorage, sessionStorage OG en informasjonskapsel – noen nettlesere
         (f.eks. Chrome på iPhone med blokkerte informasjonskapsler) nekter localStorage. */
      (function () {
        var APEN = /^\\/(no\\/)?(vilkar|terms|privacy|pluss|plus|kvittering|receipt|account)(\\/|$)/;
        window.mvSlippInn = function () {
          window.__mvTilgang = true;
          try { localStorage.setItem('mv_tilgang', 'ja'); } catch (e) {}
          try { sessionStorage.setItem('mv_tilgang', 'ja'); } catch (e) {}
          try { document.cookie = 'mv_tilgang=ja; path=/; max-age=31536000; SameSite=Lax' + (location.protocol === 'https:' ? '; Secure' : ''); } catch (e) {}
          delete document.documentElement.dataset.laast;
        };
        window.mvRiktigKode = function (v) { return String(v || '').normalize('NFKC').replace(/\\D/g, '') === String(KODE); };
        function harTilgang() {
          if (window.__mvTilgang) return true;
          try { if (localStorage.getItem('mv_tilgang') === 'ja') return true; } catch (e) {}
          try { if (sessionStorage.getItem('mv_tilgang') === 'ja') return true; } catch (e) {}
          try { if (/(^|;\\s*)mv_tilgang=ja/.test(document.cookie)) return true; } catch (e) {}
          return false;
        }
        // Lenke med koden (…?kode=1991) slipper deg rett inn
        try {
          var u = new URL(location.href);
          if (u.searchParams.has('kode')) {
            if (window.mvRiktigKode(u.searchParams.get('kode'))) window.mvSlippInn();
            u.searchParams.delete('kode'); history.replaceState(history.state, '', u.pathname + u.search + u.hash);
          }
        } catch (e) {}
        function sperret(sti) { return !harTilgang() && !APEN.test(sti); }
        if (sperret(location.pathname)) document.documentElement.dataset.laast = '1';
        document.addEventListener('astro:before-swap', function (e) {
          if (sperret(new URL(e.to).pathname)) e.newDocument.documentElement.dataset.laast = '1';
          else delete e.newDocument.documentElement.dataset.laast;
        });
      })();
    })();<\/script>`}<link rel="canonical"${addAttribute(canonical, "href")}><link rel="alternate" hreflang="en"${addAttribute(enHref, "href")}><link rel="alternate" hreflang="no"${addAttribute(noHref, "href")}><link rel="alternate" hreflang="x-default"${addAttribute(noHref, "href")}><meta property="og:title"${addAttribute(fullTitle, "content")}><meta property="og:description"${addAttribute(desc, "content")}><meta property="og:type" content="website"><meta property="og:url"${addAttribute(canonical, "content")}><meta property="og:locale"${addAttribute(L.locale, "content")}><meta property="og:site_name" content="Mitt vors"><meta property="og:image"${addAttribute(bildeUrl, "content")}><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image"${addAttribute(bildeUrl, "content")}><meta name="theme-color" content="#120A1D"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="icon" href="/favicon-48.png" type="image/png" sizes="48x48"><link rel="alternate icon" href="/favicon.ico" sizes="any"><!-- Ikonet på hjemskjermen (iPhone/iPad). ?v= tvinger telefonen til å hente det nye ikonet. --><link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v=4"><link rel="sitemap" href="/sitemap-index.xml"><link rel="manifest" href="/manifest.webmanifest"><meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"><meta name="apple-mobile-web-app-title" content="Mitt vors"><script>
    /* Lys eller mørk modus: settes før siden tegnes, og på nytt ved hvert sidebytte */
    (function () {
      function tema() { try { return localStorage.getItem('bd_tema') === 'lys' ? 'light' : 'dark'; } catch (e) { return 'dark'; } }
      function sett(doc) {
        var t = tema(); doc.documentElement.dataset.theme = t;
        var m = doc.querySelector('meta[name="theme-color"]'); if (m) m.setAttribute('content', t === 'light' ? '#F3EFF8' : '#120A1D');
      }
      sett(document);
      document.addEventListener('astro:before-swap', function (e) { sett(e.newDocument); });
      window.BDTema = {
        hent: tema,
        bytt: function () {
          var ny = tema() === 'light' ? 'mork' : 'lys';
          try { localStorage.setItem('bd_tema', ny); } catch (e) {}
          sett(document);
        },
      };
      document.addEventListener('click', function (e) {
        var b = e.target.closest && e.target.closest('[data-tema]'); if (!b) return;
        window.BDTema.bytt();
      });
    })();
  <\/script>${renderComponent($$result, "KontoKlient", $$KontoKlient, {})}<script>
  (function () {
    // Pluss-knappen i toppen: viser «Pluss ✓» når du har det (sjekkes én gang per økt, bare når du er logget inn)
    // Har du Pluss, trenger du ikke se reklamen for det: html.har-pluss skjuler den (se natt.css)
    // Svaret huskes i localStorage med tidsstempel: «ja» i 30 min, «nei» bare i 1 min,
    // så et nytt kjøp eller en innløst kode slår inn raskt. Endres innloggingen, sjekkes det på nytt.
    var NOK = 'mv_pluss_v2', JA_MS = 30 * 60e3, NEI_MS = 60e3, henter = false;
    try { sessionStorage.removeItem('mv_pluss'); } catch (e) {}
    function cache() { try { return JSON.parse(localStorage.getItem(NOK) || 'null'); } catch (e) { return null; } }
    function innlogget() { var K = window.BDKonto; return !!(K && K.les && K.les()); }
    function harPluss() { var c = cache(); return !!(c && c.a && innlogget()); }
    function merk() {
      var aktiv = harPluss(), en = /^en/.test(document.documentElement.lang);
      document.documentElement.classList.toggle('har-pluss', aktiv);
      document.querySelectorAll('[data-pluss-pille]').forEach(function (a) {
        if (!a.dataset.opprinnelig) a.dataset.opprinnelig = a.textContent;
        a.classList.toggle('aktiv', aktiv);
        a.textContent = aktiv ? (en ? 'Plus ✓' : 'Pluss ✓') : a.dataset.opprinnelig;
      });
    }
    function sjekk(tving) {
      merk();
      var K = window.BDKonto; if (!innlogget() || henter) return;
      var c = cache();
      if (!tving && c && (Date.now() - c.t) < (c.a ? JA_MS : NEI_MS)) return;
      henter = true;
      K.api('/api/pluss/status').then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
        henter = false; if (!d || d.feil) return;
        try { localStorage.setItem(NOK, JSON.stringify({ a: d.aktiv ? 1 : 0, t: Date.now() })); } catch (e) {}
        merk();
      }).catch(function () { henter = false; });
    }
    merk();
    document.addEventListener('astro:after-swap', merk);
    if (window.BDKonto && window.BDKonto.naarEndret) window.BDKonto.naarEndret(function () {
      merk(); setTimeout(function () { sjekk(true); }, 50);
    });
    window.mvPlussSjekk = function () { sjekk(true); };
    document.addEventListener('astro:page-load', function () { sjekk(); });
    if (document.readyState !== 'loading') setTimeout(sjekk, 0); else document.addEventListener('DOMContentLoaded', sjekk);
  })();
  <\/script>${renderComponent($$result, "Alkoholfri", $$Alkoholfri, {})}${renderComponent($$result, "Verving", $$Verving, {})}<script>
    /* Innloggingslenker fra Supabase kan lande på feil side – send dem til kontosiden. */
    (function () {
      var h = location.hash || '';
      if ((h.indexOf('access_token=') !== -1 || h.indexOf('error_description=') !== -1)
          && !/\\/account\\/?$/.test(location.pathname)) {
        var acc = location.pathname.indexOf('/no/') === 0 || location.pathname === '/no' ? '/no/account' : '/account';
        location.replace(acc + h);
      }
    })();
    /* Kjenner igjen enheten før siden tegnes, så innholdet kan tilpasses uten hopp.
       Sidenavigasjonen bytter ut merkene på <html> ved hvert klikk, så sjekken må kjøre på nytt da også. */
    (function merkEnhet() {
      document.addEventListener('astro:after-swap', merkEnhet);
      var h = document.documentElement, ua = navigator.userAgent || '';
      var ios = /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
      var android = /Android/.test(ua);
      var coarse = window.matchMedia && window.matchMedia('(pointer:coarse)').matches;
      var mobile = ios || android || (coarse && window.innerWidth < 900);
      var standalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
      h.classList.add(mobile ? 'is-mobile' : 'is-desktop');
      if (ios) h.classList.add('is-ios');
      if (android) h.classList.add('is-android');
      if (standalone) h.classList.add('is-standalone');
    })();
  <\/script>${renderComponent($$result, "ClientRouter", $$ClientRouter, {})}${renderSlot($$result, $$slots["head"])}${renderHead($$result)}</head><body${addAttribute(erHumor ? "humor" : void 0, "class")}><a class="skip" href="#innhold">${lang === "no" ? "Hopp til innhold" : "Skip to content"}</a><div class="shell"><aside class="side"><a class="brand"${addAttribute(path(lang, "/"), "href")}><svg class="brandmark" viewBox="0 0 100 100" aria-hidden="true" focusable="false"><rect x="4" y="4" width="92" height="92" rx="30" fill="#FF5B1F"></rect><g transform="translate(45.5 78) rotate(-24)"><path d="M-8 0 L-12 -41 H12 L8 0 Z" fill="#120A1D"></path><rect x="-12.5" y="-41" width="25" height="6" rx="2" fill="#F5F0FF"></rect></g><g transform="translate(54.5 78) rotate(24)"><path d="M-8 0 L-12 -41 H12 L8 0 Z" fill="#120A1D"></path><rect x="-12.5" y="-41" width="25" height="6" rx="2" fill="#F5F0FF"></rect></g><g stroke="#F5F0FF" stroke-width="5" stroke-linecap="round"><path d="M50 29 V18"></path><path d="M40.5 31 L35.5 24.5"></path><path d="M59.5 31 L64.5 24.5"></path></g></svg><span class="bt"${addAttribute(SITE_NAME, "aria-label")}>mitt<i>vors</i></span></a><button class="searchbtn" data-search>${renderComponent($$result, "Icon", $$Icon, { "name": "sok" })}${L.search}<kbd>⌘K</kbd></button><nav class="sidenav"${addAttribute(L.pickMode, "aria-label")}>${nav.map((n) => renderTemplate`<a${addAttribute(n.href, "href")}${addAttribute(isCurrent(n.href) ? "page" : void 0, "aria-current")}>${renderComponent($$result, "Icon", $$Icon, { "name": n.icon })}${n.label}</a>`)}<span class="navsplit">${L.collections}</span>${humorNav.map((n) => renderTemplate`<a${addAttribute(n.href, "href")}${addAttribute(isCurrent(n.href) ? "page" : void 0, "aria-current")}>${renderComponent($$result, "Icon", $$Icon, { "name": n.icon })}${n.label}</a>`)}${subNav.map((n) => renderTemplate`<a class="sub"${addAttribute(n.href, "href")}${addAttribute(isCurrent(n.href) ? "page" : void 0, "aria-current")}>${n.label}</a>`)}</nav><a class="pluss-pille"${addAttribute(lang === "no" ? "/no/pluss" : "/plus", "href")} data-pluss-pille>${lang === "no" ? "Mitt vors Pluss" : "Mitt vors Plus"}</a><a class="appbtn"${addAttribute(path(lang, "/favourites"), "href")}>${renderComponent($$result, "Icon", $$Icon, { "name": "favoritt" })}${L.favourites}</a><button class="langlink temaknapp" type="button" data-tema${addAttribute(lang === "no" ? "Bytt mellom lys og mørk modus" : "Switch light or dark mode", "aria-label")}><svg class="tema-sol" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.2"></circle><path d="M12 2.5v2.2M12 19.3v2.2M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6"></path></svg><svg class="tema-maane" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"></path></svg><span class="tema-sol">${lang === "no" ? "Lys modus" : "Light mode"}</span><span class="tema-maane">${lang === "no" ? "Mørk modus" : "Dark mode"}</span></button><a class="langlink"${addAttribute(altPath, "href")}${addAttribute(lang === "en" ? "no" : "en", "hreflang")}>${L.switchTo}</a><p class="sidefoot"><a${addAttribute(path(lang, "/suggest"), "href")}>${L.nav.suggest}</a><a${addAttribute(path(lang, "/account"), "href")}>${L.nav.account}</a><a${addAttribute(path(lang, "/about"), "href")}>${L.nav.about}</a></p></aside><div class="topbars"><div class="mobilebar"><a class="brand"${addAttribute(path(lang, "/"), "href")}><svg class="brandmark" viewBox="0 0 100 100" aria-hidden="true" focusable="false"><rect x="4" y="4" width="92" height="92" rx="30" fill="#FF5B1F"></rect><g transform="translate(45.5 78) rotate(-24)"><path d="M-8 0 L-12 -41 H12 L8 0 Z" fill="#120A1D"></path><rect x="-12.5" y="-41" width="25" height="6" rx="2" fill="#F5F0FF"></rect></g><g transform="translate(54.5 78) rotate(24)"><path d="M-8 0 L-12 -41 H12 L8 0 Z" fill="#120A1D"></path><rect x="-12.5" y="-41" width="25" height="6" rx="2" fill="#F5F0FF"></rect></g><g stroke="#F5F0FF" stroke-width="5" stroke-linecap="round"><path d="M50 29 V18"></path><path d="M40.5 31 L35.5 24.5"></path><path d="M59.5 31 L64.5 24.5"></path></g></svg><span class="bt"${addAttribute(SITE_NAME, "aria-label")}>mitt<i>vors</i></span></a><span class="mobilebar-right"><button class="langlink compact" data-search${addAttribute(L.search, "aria-label")}>${renderComponent($$result, "Icon", $$Icon, {
		"name": "sok",
		"size": 19
	})}</button><a class="pluss-pille"${addAttribute(lang === "no" ? "/no/pluss" : "/plus", "href")} data-pluss-pille>${lang === "no" ? "Pluss" : "Plus"}</a><button class="langlink compact" type="button" data-tema${addAttribute(lang === "no" ? "Bytt mellom lys og mørk modus" : "Switch light or dark mode", "aria-label")}><svg class="tema-sol" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.2"></circle><path d="M12 2.5v2.2M12 19.3v2.2M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6"></path></svg><svg class="tema-maane" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"></path></svg></button><a class="langlink compact"${addAttribute(altPath, "href")}${addAttribute(lang === "en" ? "no" : "en", "hreflang")}>${lang === "en" ? "NO" : "EN"}</a></span></div><nav class="mobilenav"${addAttribute(L.popular, "aria-label")}>${quick.map((n) => renderTemplate`<a${addAttribute(n.href, "href")}${addAttribute(isCurrent(n.href) ? "page" : void 0, "aria-current")}>${n.label}</a>`)}</nav></div><main class="main" id="innhold">${renderSlot($$result, $$slots["default"])}<footer class="foot"><span>© ${(/* @__PURE__ */ new Date()).getFullYear()} ${SITE_NAME}</span><a${addAttribute(path(lang, "/suggest"), "href")}>${L.nav.suggest}</a><a${addAttribute(path(lang, "/account"), "href")}>${L.nav.account}</a><a${addAttribute(path(lang, "/about"), "href")}>${L.nav.about}</a><a${addAttribute(path(lang, "/privacy"), "href")}>${L.nav.privacy}</a><a${addAttribute(path(lang, "/favourites"), "href")}>${L.favourites}</a><a${addAttribute(altPath, "href")}>${L.switchTo}</a><a${addAttribute(lang === "no" ? "/no/vilkar" : "/terms", "href")}>${lang === "no" ? "Salgsvilkår" : "Terms of sale"}</a><button type="button" class="feilknapp" data-feil>${lang === "no" ? "Noe galt?" : "Something wrong?"}</button><span class="foot-firma">${SELGER.navn} · ${lang === "no" ? "Org.nr." : "Org. no."} ${SELGER.orgnr} · ${SELGER.adresse} · ${lang === "no" ? "Tlf." : "Phone"} ${SELGER.telefon} · ${SELGER.epost}</span></footer>${renderComponent($$result, "FeilRapport", $$FeilRapport, { "lang": lang })}</main></div><nav class="tabbar"${addAttribute(lang === "no" ? "Hovedmeny" : "Main menu", "aria-label")}><a${addAttribute(path(lang, "/"), "href")}${addAttribute(current === (lang === "no" ? "/no" : "/en") || lang !== "no" && current === "/" ? "page" : void 0, "aria-current")}><span class="ti">${renderComponent($$result, "Icon", $$Icon, {
		"name": "hjem",
		"size": 22
	})}</span><span class="tl">${lang === "no" ? "Forside" : "Home"}</span></a><a${addAttribute(path(lang, "/drinking-games"), "href")}${addAttribute(isCurrent(path(lang, "/drinking-games")) ? "page" : void 0, "aria-current")}><span class="ti">${renderComponent($$result, "Icon", $$Icon, {
		"name": "drikkeleker",
		"size": 22
	})}</span><span class="tl">${lang === "no" ? "Leker" : "Games"}</span></a><a${addAttribute(lang === "no" ? "/no/rom" : "/room", "href")}${addAttribute(isCurrent(lang === "no" ? "/no/rom" : "/room") ? "page" : void 0, "aria-current")}><span class="ti">${renderComponent($$result, "Icon", $$Icon, {
		"name": "terning",
		"size": 22
	})}</span><span class="tl">${lang === "no" ? "Spill sammen" : "Play"}</span></a><a${addAttribute(lang === "no" ? "/no/nyhetsrunden" : "/plan", "href")}${addAttribute(isCurrent(lang === "no" ? "/no/nyhetsrunden" : "/plan") ? "page" : void 0, "aria-current")}><span class="ti">${renderComponent($$result, "Icon", $$Icon, {
		"name": "nyhet",
		"size": 22
	})}</span><span class="tl">${lang === "no" ? "Nyheter" : "Plan"}</span></a><a${addAttribute(path(lang, "/situations"), "href")}${addAttribute(isCurrent(path(lang, "/situations")) || current.includes("/categories/") || isCurrent(path(lang, "/ord")) || isCurrent(path(lang, "/uttrykk")) ? "page" : void 0, "aria-current")}><span class="ti">${renderComponent($$result, "Icon", $$Icon, {
		"name": "replikker",
		"size": 22
	})}</span><span class="tl">${lang === "no" ? "Humor" : "Humour"}</span></a></nav><!-- Aldersspørringen ligger UTENFOR .main, ellers blir den uskarp sammen med innholdet. -->${gate && renderTemplate`${renderComponent($$result, "AgeGate", $$AgeGate, { "lang": lang })}`}${renderComponent($$result, "Tools", $$Tools, { "lang": lang })}${lang === "en" && renderTemplate`<div class="langbanner" id="langbanner" hidden><span>${L.bannerNo}</span><a class="btn gold small"${addAttribute(altPath, "href")}>${L.bannerGo}</a><button class="linkbtn" id="bannerClose"${addAttribute(L.bannerClose, "aria-label")}>✕</button></div>`}<div id="toast" class="toast" role="status">${L.copied}</div>${UTVIKLING.paa && renderTemplate`<div id="utvikling" class="utvikling" role="dialog" aria-modal="true" aria-labelledby="utvTittel"><form class="utv-boks" id="utvSkjema" novalidate><svg viewBox="0 0 100 100" width="72" height="72" aria-hidden="true"><rect x="4" y="4" width="92" height="92" rx="30" fill="#FF5B1F"></rect><g transform="translate(45.5 78) rotate(-24)"><path d="M-8 0 L-12 -41 H12 L8 0 Z" fill="#120A1D"></path><rect x="-12.5" y="-41" width="25" height="6" rx="2" fill="#F5F0FF"></rect></g><g transform="translate(54.5 78) rotate(24)"><path d="M-8 0 L-12 -41 H12 L8 0 Z" fill="#120A1D"></path><rect x="-12.5" y="-41" width="25" height="6" rx="2" fill="#F5F0FF"></rect></g><g stroke="#F5F0FF" stroke-width="5" stroke-linecap="round"><path d="M50 29 V18"></path><path d="M40.5 31 L35.5 24.5"></path><path d="M59.5 31 L64.5 24.5"></path></g></svg><h1 id="utvTittel">mitt<span>vors</span></h1><p>${lang === "no" ? "Vi legger siste hånd på vorset. Siden åpner snart!" : "We’re putting the final touches on the party. Opening soon!"}</p><label for="utvKode" class="small">${lang === "no" ? "Har du fått en kode?" : "Got a code?"}</label><div class="utv-rad"><input id="utvKode" type="text" inputmode="numeric" autocomplete="one-time-code" autocorrect="off" autocapitalize="off" spellcheck="false" maxlength="12"><button class="btn gold" type="submit">${lang === "no" ? "Slipp meg inn" : "Let me in"}</button></div><p class="utv-feil" id="utvFeil" hidden>${lang === "no" ? "Feil kode." : "Wrong code."}</p><p class="utv-fot small"><a${addAttribute(lang === "no" ? "/no/pluss" : "/plus", "href")}>${lang === "no" ? "Priser" : "Prices"}</a> · <a${addAttribute(lang === "no" ? "/no/vilkar" : "/terms", "href")}>${lang === "no" ? "Salgsvilkår" : "Terms of sale"}</a> · <a${addAttribute(lang === "no" ? "/no/privacy" : "/privacy", "href")}>${lang === "no" ? "Personvern" : "Privacy"}</a><br>${SELGER.navn} · Org.nr. ${SELGER.orgnr} · ${SELGER.adresse} · ${SELGER.telefon} · ${SELGER.epost}</p></form><script data-astro-rerun>(function(){${defineScriptVars({ KODE: UTVIKLING.kode })}
        (function () {
          var f = document.getElementById('utvSkjema'); if (!f || f.dataset.bound) return; f.dataset.bound = '1';
          f.addEventListener('submit', function (e) {
            e.preventDefault();
            var v = document.getElementById('utvKode').value;
            if (window.mvRiktigKode ? window.mvRiktigKode(v) : String(v).trim() === String(KODE)) { if (window.mvSlippInn) window.mvSlippInn(); else delete document.documentElement.dataset.laast; }
            else { document.getElementById('utvFeil').hidden = false; }
          });
        })();
      })();<\/script></div>`}<script>(function(){${defineScriptVars({ SHARED: L.shared })}
    (function () {
      /* Sideoverganger kjører dette på nytt ved hvert sidebytte.
         Lyttere på document skal bare registreres én gang, ellers dobles de. */
      if (window.__bdBase) { window.__bdBase.page(); return; }
      function flash(el) {
        el.classList.add('copied');
        setTimeout(function () { el.classList.remove('copied'); }, 1100);
        var t = document.getElementById('toast');
        t.classList.add('show');
        setTimeout(function () { t.classList.remove('show'); }, 1200);
      }
      /* Mobil: toppen glir opp når du blar nedover, og kommer tilbake når du blar opp. */
      var sisteY = window.scrollY;
      window.addEventListener('scroll', function () {
        if (window.innerWidth >= 900) return;
        var y = window.scrollY;
        if (y < 120) document.body.classList.remove('bars-skjult');
        else if (y > sisteY + 6) document.body.classList.add('bars-skjult');
        else if (y < sisteY - 6) document.body.classList.remove('bars-skjult');
        sisteY = y;
      }, { passive: true });
      document.addEventListener('astro:page-load', function () { document.body.classList.remove('bars-skjult'); });

      function toast(msg, ms) {
        var t = document.getElementById('toast');
        if (!t) return;
        var old = t.textContent;
        if (msg) t.textContent = msg;
        t.classList.add('show');
        setTimeout(function () { t.classList.remove('show'); t.textContent = old; }, ms || 1400);
      }
      window.BDToast = function (m) { toast(m, 4500); };
      document.addEventListener('click', function (e) {
        var sb = e.target.closest('[data-share]');
        if (!sb) return;
        e.preventDefault(); e.stopPropagation();
        var text = sb.getAttribute('data-share');
        var msg = '«' + text + '»';
        if (navigator.share) {
          navigator.share({ text: msg + '\\n— mittvors.no' }).catch(function () {});
        } else if (navigator.clipboard) {
          navigator.clipboard.writeText(msg + '\\n— mittvors.no').then(function () { toast(SHARED); });
        }
      });
      document.addEventListener('click', function (e) {
        if (e.target.closest('a, .starbtn, .sharebtn')) return;
        var c = e.target.closest('[data-copy]');
        if (!c) return;
        var text = c.getAttribute('data-copy');
        if (navigator.clipboard && navigator.clipboard.writeText)
          navigator.clipboard.writeText(text).then(function () { flash(c); }).catch(function () { flash(c); });
        else flash(c);
      });
      document.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        var c = e.target.closest && e.target.closest('[data-copy]');
        if (c && c.tagName !== 'BUTTON') { e.preventDefault(); c.click(); }
      });

      /* Offline-støtte, så siden virker som appen gjorde. */
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', function () { navigator.serviceWorker.register('/sw.js').catch(function () {}); });
        // Tas vare på, så «Legg til på hjemskjermen» kan vises senere
        window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); window.__bdInstall = e; });
      }

      /* Tilbyr norsk til norske nettlesere – uten å tvinge noe. Kjøres per side. */
      function page() {
      /* Klebrige filtre (PC): husk hvor de starter, så de kan få bakgrunn når de er festet. */
      document.querySelectorAll('.sticky').forEach(function (el) {
        if (el._mark) return;
        var mark = document.createElement('div');
        mark.style.cssText = 'height:1px;margin-bottom:-1px';
        el.parentNode.insertBefore(mark, el); el._mark = mark;
      });
      /* Mobil: en smal linje med «Søk» og «Hopp til ▾» når du har blatt forbi filteret. */
      var filt = document.querySelector('.dictfilter, .sitfilter, .chips.sticky');
      var tb = document.querySelector('.topbars');
      document.documentElement.style.setProperty('--barh', (tb ? tb.offsetHeight : 0) + 'px');
      if (filt && !document.querySelector('.minibar')) {
        var no = (document.documentElement.lang || '').indexOf('no') === 0;
        var chips = filt.matches('.chips') ? filt : filt.querySelector('.chips');
        var inp = filt.querySelector('input');
        var lenker = chips ? chips.querySelectorAll('a') : [];
        var mb = document.createElement('div');
        mb.className = 'minibar';
        mb.innerHTML = '<div class="mb-row">' +
          (inp ? '<button type="button" class="mb-btn" data-mb="sok">' + (no ? 'Søk' : 'Search') + '</button>' : '') +
          (lenker.length > 1 ? '<button type="button" class="mb-btn" data-mb="hopp" aria-expanded="false">' + (no ? 'Hopp til' : 'Jump to') + ' <span aria-hidden="true">▾</span></button>' : '') +
          '</div>';
        if (lenker.length > 1) {
          var panel = document.createElement('div');
          panel.className = 'mb-panel chips';
          lenker.forEach(function (a) { panel.appendChild(a.cloneNode(true)); });
          mb.appendChild(panel);
        }
        mb.addEventListener('click', function (e) {
          var knapp = e.target.closest('[data-mb]');
          if (e.target.closest('.mb-panel a')) { mb.classList.remove('open'); return; }
          if (!knapp) return;
          if (knapp.dataset.mb === 'hopp') {
            var aapen = mb.classList.toggle('open');
            knapp.setAttribute('aria-expanded', aapen ? 'true' : 'false');
          } else {
            mb.classList.remove('open');
            /* Et klistret filter oppgir sin fastlåste posisjon, så vi måler fra merket som står der det egentlig hører hjemme. */
            var anker = filt._mark || (filt.closest('.sticky') || {})._mark || filt;
            document.body.classList.remove('bars-skjult');
            var maal = window.scrollY + anker.getBoundingClientRect().top - (tb ? tb.offsetHeight : 0) - 10;
            /* Fokus må skje direkte i trykket, ellers åpner ikke telefonen tastaturet. */
            if (inp) inp.focus({ preventScroll: true });
            window.scrollTo({ top: Math.max(0, maal), behavior: 'smooth' });
          }
        });
        document.body.appendChild(mb);
        mb._filt = filt;
      }
      oppdaterRulling();
      /* Tell anonymt at en lek eller situasjon ble åpnet – én gang per besøk. */
      var sm = document.querySelector('[data-spilt]');
      if (sm) {
        var v = sm.getAttribute('data-spilt').split(':'), nk = 'bd_spilt_' + v.join('_');
        try {
          if (!sessionStorage.getItem(nk)) {
            sessionStorage.setItem(nk, '1');
            fetch('/api/spilt', { method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ type: v[0], ref: v[1] }), keepalive: true }).catch(function () {});
          }
        } catch (e) {}
      }
      var b = document.getElementById('langbanner');
      if (b && !b.dataset.bound) {
        b.dataset.bound = '1';
        var wantsNo = (navigator.languages || [navigator.language || '']).some(function (l) { return /^(nb|nn|no)/i.test(l); });
        var off = false;
        try { off = localStorage.getItem('bd_lang_banner') === '0'; } catch (e) {}
        if (wantsNo && !off) b.hidden = false;
        document.getElementById('bannerClose').addEventListener('click', function () {
          b.hidden = true;
          try { localStorage.setItem('bd_lang_banner', '0'); } catch (e) {}
        });
      }
      }
      function oppdaterRulling() {
        document.querySelectorAll('.sticky').forEach(function (el) {
          if (!el._mark) return;
          var topp = parseFloat(getComputedStyle(el).top) || 0;
          el.classList.toggle('is-stuck', el._mark.getBoundingClientRect().top < topp + 1);
        });
        var mb = document.querySelector('.minibar');
        if (mb && mb._filt) {
          var skjult = document.body.classList.contains('bars-skjult');
          var tb = document.querySelector('.topbars');
          var kant = skjult || !tb ? 0 : tb.offsetHeight;
          var forbi = mb._filt.getBoundingClientRect().bottom < kant + 4;
          mb.classList.toggle('vis', forbi);
          if (!forbi) mb.classList.remove('open');
        }
      }
      var venter = false;
      window.addEventListener('scroll', function () {
        if (venter) return; venter = true;
        requestAnimationFrame(function () { venter = false; oppdaterRulling(); });
      }, { passive: true });
      document.addEventListener('astro:page-load', page);
      window.__bdBase = { page: page };
      page();
    })();
  })();<\/script></body></html>`;
}, "C:/Users/jonas/Documents/GitHub/banterdeck/src/layouts/Base.astro", void 0);
//#endregion
export { ui as n, $$Base as t };
