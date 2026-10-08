import { n as rpc, r as supabaseServer } from "./spilt_2dqjF3k8.mjs";
import { _ as velgVinner, c as borsTilPluss, d as settStart, f as kaarVinner, g as lekStartet, h as lekFerdig, l as borsVisning, m as kveldVisning, o as borsHandling, p as kveld, s as borsTilGjeng, u as nySpillerIBors } from "./bors_Cf8trQO6.mjs";
import { a as bingo_default, i as decks_en_default, o as decks_default, r as bingo_en_default, t as PLUSS_ROM } from "./plussleker_D1MVk9p6.mjs";
import { a as rundeId, i as publiserteRunder } from "./nyhetsrunden_D1RpSAip.mjs";
var rens$1 = (x, n = 140) => String(x == null ? "" : x).replace(/[\u0000-\u001f<>]/g, "").replace(/\s+/g, " ").trim().slice(0, n);
var nokkel = (konto, navn) => konto ? "k:" + konto : "n:" + String(navn || "").trim().toLowerCase();
var nyId$1 = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
function tomBok() {
	return {
		v: 2,
		kvelder: 0,
		regler: [],
		logg: [],
		seire: {},
		borskonge: {},
		brukt: [],
		ventende: null,
		lommebok: {
			sesong: (/* @__PURE__ */ new Date()).getFullYear(),
			k: {}
		},
		utsatte: [],
		aarskonger: []
	};
}
var START_FORMUE = 1e3;
var FRIST_UTSATT = 1728e5;
function lommebok(b) {
	const aar = (/* @__PURE__ */ new Date()).getFullYear();
	if (!b.lommebok || typeof b.lommebok !== "object") b.lommebok = {
		sesong: aar,
		k: {}
	};
	if (!b.lommebok.k || typeof b.lommebok.k !== "object") b.lommebok.k = {};
	if (b.lommebok.sesong !== aar) {
		const topp = Object.values(b.lommebok.k).filter((x) => x && x.saldo != null).sort((x, y) => y.saldo - x.saldo)[0];
		if (topp) {
			b.aarskonger = (Array.isArray(b.aarskonger) ? b.aarskonger : []).concat([{
				aar: b.lommebok.sesong,
				navn: topp.navn,
				saldo: topp.saldo
			}]).slice(-20);
			logg(b, `👑 Årets Børskonge ${b.lommebok.sesong}: ${topp.navn} med ${topp.saldo} kr`, `👑 Market King of ${b.lommebok.sesong}: ${topp.navn} with ${topp.saldo}`);
		}
		Object.values(b.lommebok.k).forEach((x) => {
			if (x) {
				x.saldo = null;
				x.kvelder = 0;
			}
		});
		b.lommebok.sesong = aar;
	}
	return b.lommebok;
}
function konto(b, k, navn) {
	const l = lommebok(b), x = l.k[k] || (l.k[k] = {
		navn: navn || "",
		saldo: null,
		kvelder: 0
	});
	if (navn && !x.navn) x.navn = navn;
	return x;
}
/** Hva et medlem tar med seg inn i kvelden: formuen sin + kveldens lønn. */
function startSaldo(bok, k) {
	const x = lommebok(lesBok(bok)).k[k];
	return (x && x.saldo != null ? x.saldo : START_FORMUE) + 200;
}
/** Navnet ditt i gjengen (brukes når du blir med på en kveld). */
function settNavn(bok, k, navn) {
	const b = lesBok(bok), n = rens$1(navn, 20);
	if (!n) return {
		feil: "Skriv et navn.",
		en: "Enter a name."
	};
	konto(b, k).navn = n;
	return { bok: b };
}
function profilNavn(bok, k) {
	const x = lommebok(lesBok(bok)).k[k];
	return x && x.navn ? x.navn : "";
}
/** En aksje som manglet stemmer: avgjøres når to andre har stemt, eller når fristen går ut. */
function avgjorUtsatt(b, u, tvunget, antall = 99) {
	const andre = Object.entries(u.stemmer).filter(([k, v]) => k !== u.melderKonto && k !== u.subjektKonto && (v === "ja" || v === "nei"));
	const kan = Math.max(1, antall - (u.melderKonto ? 1 : 0) - (u.subjektKonto ? 1 : 0));
	if (!tvunget && andre.length < Math.min(2, kan)) return false;
	const ja = Object.entries(u.stemmer).filter(([k, v]) => k !== u.subjektKonto && v === "ja").length + (u.melderKonto ? 0 : 1);
	const nei = andre.filter(([, v]) => v === "nei").length;
	const godkjent = andre.length >= 1 && ja > nei;
	u.status = godkjent ? "godkjent" : "avvist";
	u.avgjort = Date.now();
	if (godkjent) {
		u.holdere.forEach((h) => {
			const x = konto(b, h.konto, h.navn);
			x.saldo = (x.saldo != null ? x.saldo : START_FORMUE) + h.n * 100;
		});
		if (u.subjektKonto) {
			const x = konto(b, u.subjektKonto, u.subjektNavn);
			x.saldo = (x.saldo != null ? x.saldo : START_FORMUE) + 30;
		}
		logg(b, `✅ Avgjort i ettertid: «${u.q}» – ${u.utfallNavn}. Aksjonærene fikk utbetalt.`, `✅ Settled afterwards: “${u.qEn}” – ${u.utfallNavn}. Shareholders were paid.`);
	} else logg(b, `❌ Avgjort i ettertid: «${u.q}» skjedde ikke – aksjene ble verdiløse.`, `❌ Settled afterwards: “${u.qEn}” didn’t happen – the shares became worthless.`);
	return true;
}
/** Avgjør de som har gått ut på tid. Gir true hvis noe ble endret. */
function ryddUtsatte(bok) {
	const b = lesBok(bok);
	let endret = false;
	(b.utsatte || []).forEach((u) => {
		if (u.status === "venter" && Date.now() > u.frist) {
			avgjorUtsatt(b, u, true);
			endret = true;
		}
	});
	b.utsatte = (b.utsatte || []).filter((u) => u.status === "venter" || Date.now() - (u.avgjort || 0) < 12096e5).slice(-60);
	return {
		bok: b,
		endret
	};
}
/** Et medlem stemmer på gjengsiden: skjedde det? */
function stemUtsatt(bok, id, k, v, antall = 99) {
	const b = lesBok(bok), u = (b.utsatte || []).find((x) => x.id === id && x.status === "venter");
	if (!u) return {
		feil: "Den er allerede avgjort.",
		en: "It’s already settled."
	};
	if (k === u.subjektKonto) return {
		feil: "Aksjen handler om deg, så du kan ikke stemme.",
		en: "This share is about you, so you can’t vote."
	};
	if (k === u.melderKonto) return {
		feil: "Du meldte den, så stemmen din er allerede med.",
		en: "You reported it, so your vote already counts."
	};
	if (v !== "ja" && v !== "nei") return {
		feil: "Ugyldig stemme.",
		en: "Invalid vote."
	};
	u.stemmer[k] = v;
	avgjorUtsatt(b, u, Date.now() > u.frist, antall);
	return { bok: b };
}
/** Leser lovboka – også den gamle formen fra det tidligere lov-spillet. */
function lesBok(x) {
	const b = tomBok();
	if (!x || typeof x !== "object") return b;
	if (x.v === 2) {
		Object.assign(b, x);
		[
			"regler",
			"logg",
			"brukt",
			"utsatte",
			"aarskonger"
		].forEach((k) => {
			if (!Array.isArray(b[k])) b[k] = [];
		});
		["seire", "borskonge"].forEach((k) => {
			if (!b[k] || typeof b[k] !== "object") b[k] = {};
		});
		return b;
	}
	b.kvelder = Number(x.kvelder) || 0;
	b.regler = (Array.isArray(x.lover) ? x.lover : []).map((l) => ({
		id: String(l.id || nyId$1()),
		tekst: rens$1(l.tekst),
		av: rens$1(l.av, 40),
		avKonto: l.avKonto || null,
		kveld: l.kveld || 0,
		dato: l.dato || Date.now(),
		status: l.status === "gjelder" || l.status === "anket" ? "aktiv" : "fjernet",
		fjernetAv: l.status === "vetoet" ? rens$1(l.vetoNavn, 40) || null : l.status === "opphevet" ? rens$1(l.anketNavn, 40) || null : null,
		fjernet: l.status === "gjelder" || l.status === "anket" ? null : l.dom && l.dom.dato || l.dato || null,
		stemBort: []
	})).filter((l) => l.tekst);
	Object.entries(x.seire || {}).forEach(([k, n]) => {
		b.seire[k] = {
			navn: String(k).replace(/^[nk]:/, ""),
			n: Number(n) || 0
		};
	});
	Object.keys(b.seire).forEach((k) => {
		if (k.startsWith("k:")) b.seire[k].navn = "–";
	});
	b.logg = (Array.isArray(x.logg) ? x.logg : []).slice(0, 100);
	b.brukt = Array.isArray(x.brukt) ? x.brukt.slice(-60) : [];
	return b;
}
function logg(b, no, en, dato = Date.now()) {
	b.logg.unshift({
		dato,
		no,
		en
	});
	b.logg = b.logg.slice(0, 200);
}
function tell(map, konto, navn) {
	const k = nokkel(konto, navn), x = map[k] || (map[k] = {
		navn,
		n: 0
	});
	x.navn = navn;
	x.n++;
}
/**
* Kvelden er over: tell den, gi seieren til kveldens vinner og la hen velge regel.
* Trygt å kjøre flere ganger (samme kveld telles bare én gang).
*/
function kveldInn(bok, kveldId, r) {
	const b = lesBok(bok);
	if (b.brukt.includes(kveldId)) return b;
	b.brukt.push(kveldId);
	b.brukt = b.brukt.slice(-60);
	b.kvelder++;
	(r.lommer || []).forEach((l) => {
		const x = konto(b, l.konto, l.navn);
		x.saldo = l.saldo != null ? Math.max(0, Math.round(l.saldo)) : (x.saldo != null ? x.saldo : START_FORMUE) + 200;
		x.kvelder = (x.kvelder || 0) + 1;
	});
	(r.utsatte || []).forEach((u) => {
		b.utsatte.push({
			...u,
			frist: Date.now() + FRIST_UTSATT,
			status: "venter"
		});
	});
	if ((r.utsatte || []).length) logg(b, `⏳ ${r.utsatte.length} ${r.utsatte.length === 1 ? "aksje venter" : "aksjer venter"} på stemmer – avgjøres her på gjengsiden`, `⏳ ${r.utsatte.length} ${r.utsatte.length === 1 ? "share awaits" : "shares await"} votes – settled here on the crew page`);
	if (r.vinner) {
		tell(b.seire, r.vinner.konto, r.vinner.navn);
		b.ventende = {
			kveldId,
			navn: r.vinner.navn,
			konto: r.vinner.konto || null,
			dato: Date.now()
		};
		logg(b, `🏆 Kveld ${b.kvelder}: ${r.vinner.navn} vant kvelden og får velge regel`, `🏆 Night ${b.kvelder}: ${r.vinner.navn} won the night and gets to pick a rule`);
	} else {
		b.ventende = null;
		logg(b, `Kveld ${b.kvelder} er spilt – ingen vinner denne gangen`, `Night ${b.kvelder} played – no winner this time`);
	}
	if (r.borskonge) {
		tell(b.borskonge, r.borskonge.konto, r.borskonge.navn);
		logg(b, `👑 ${r.borskonge.navn} ble Børskonge`, `👑 ${r.borskonge.navn} became Market King`);
	}
	return b;
}
/**
* Kveldens vinner velger: ny regel, oppheve en regel, eller la lovboka være.
* fraRom = valget kommer fra rommet (rommet har allerede sjekket at det er vinneren).
*/
function vinnerValg(bok, kveldId, hvem, valg) {
	const b = lesBok(bok), v = b.ventende;
	if (!v || v.kveldId !== kveldId) return {
		feil: "Det er ingen regel å velge for denne kvelden.",
		en: "There’s no rule to pick for this night."
	};
	if (!hvem.fraRom && (!hvem.konto || v.konto !== hvem.konto)) return {
		feil: "Bare kveldens vinner kan velge regel.",
		en: "Only the winner of the night can pick a rule."
	};
	const navn = v.navn || hvem.navn;
	if (valg.type === "ny") {
		const tekst = rens$1(valg.tekst);
		if (tekst.length < 4) return {
			feil: "Skriv hele regelen.",
			en: "Write the whole rule."
		};
		b.regler.push({
			id: nyId$1(),
			tekst,
			av: navn,
			avKonto: v.konto || null,
			kveld: b.kvelder,
			dato: Date.now(),
			status: "aktiv",
			fjernetAv: null,
			fjernet: null,
			stemBort: []
		});
		logg(b, `📜 ${navn} innførte regelen «${tekst}»`, `📜 ${navn} introduced the rule “${tekst}”`);
	} else if (valg.type === "opphev") {
		const r = b.regler.find((x) => x.id === valg.regel && x.status === "aktiv");
		if (!r) return {
			feil: "Fant ikke regelen.",
			en: "Couldn’t find that rule."
		};
		r.status = "fjernet";
		r.fjernetAv = navn;
		r.fjernet = Date.now();
		r.hvordan = "vinner";
		logg(b, `🗑️ ${navn} opphevet regelen «${r.tekst}»`, `🗑️ ${navn} repealed the rule “${r.tekst}”`);
	} else logg(b, `🤷 ${navn} lot lovboka være som den er`, `🤷 ${navn} left the law book as it is`);
	b.ventende = null;
	return { bok: b };
}
/** Et medlem stemmer for (eller trekker stemmen) å fjerne en regel. Flertall av medlemmene fjerner den. */
function stemBort(bok, regelId, konto, navn, antallMedlemmer) {
	const b = lesBok(bok), r = b.regler.find((x) => x.id === regelId && x.status === "aktiv");
	if (!r) return {
		feil: "Regelen gjelder ikke lenger.",
		en: "The rule no longer applies."
	};
	r.stemBort = Array.isArray(r.stemBort) ? r.stemBort : [];
	const i = r.stemBort.indexOf(konto);
	if (i === -1) r.stemBort.push(konto);
	else r.stemBort.splice(i, 1);
	const trengs = Math.floor(Math.max(1, antallMedlemmer) / 2) + 1;
	let fjernet = false;
	if (r.stemBort.length >= trengs) {
		r.status = "fjernet";
		r.fjernetAv = null;
		r.fjernet = Date.now();
		r.hvordan = "flertall";
		fjernet = true;
		logg(b, `🗳️ Gjengen stemte bort regelen «${r.tekst}» (${r.stemBort.length} av ${antallMedlemmer})`, `🗳️ The crew voted out the rule “${r.tekst}” (${r.stemBort.length} of ${antallMedlemmer})`);
	}
	return {
		bok: b,
		fjernet,
		navn
	};
}
/** Reglene som gjelder, nyeste først – det rommet viser under kvelden. */
function reglerForRom(bok) {
	return lesBok(bok).regler.filter((x) => x.status === "aktiv").slice().reverse().slice(0, 40).map((x) => ({
		id: x.id,
		tekst: x.tekst,
		av: x.av,
		kveld: x.kveld
	}));
}
/** Lovboka slik gjengsiden viser den – uten konto-id-er. */
function visBok(bok, meg, lang = "no", antallMedlemmer = 0) {
	const b = lesBok(bok);
	const trengs = Math.floor(Math.max(1, antallMedlemmer) / 2) + 1;
	const regel = (x) => ({
		id: x.id,
		tekst: x.tekst,
		av: x.av,
		kveld: x.kveld,
		dato: x.dato,
		fjernetAv: x.fjernetAv || null,
		fjernet: x.fjernet || null,
		hvordan: x.hvordan || null,
		stemmer: (x.stemBort || []).length,
		trengs,
		harStemt: !!(meg && (x.stemBort || []).includes(meg))
	});
	const topp = (map) => Object.values(map || {}).filter((x) => x && x.n > 0).sort((a, c) => c.n - a.n).slice(0, 5).map((x) => ({
		navn: x.navn,
		n: x.n
	}));
	const lagd = {};
	b.regler.filter((x) => x.status === "aktiv").forEach((x) => {
		lagd[x.av] = (lagd[x.av] || 0) + 1;
	});
	return {
		kvelder: b.kvelder,
		aktive: b.regler.filter((x) => x.status === "aktiv").slice().reverse().map(regel),
		fjernet: b.regler.filter((x) => x.status !== "aktiv").slice().reverse().slice(0, 100).map(regel),
		rekorder: {
			seire: topp(b.seire),
			borskonge: topp(b.borskonge),
			regler: Object.entries(lagd).map(([navn, n]) => ({
				navn,
				n
			})).sort((a, c) => c.n - a.n).slice(0, 5)
		},
		ventende: b.ventende ? {
			kveldId: b.ventende.kveldId,
			navn: b.ventende.navn,
			minTur: !!(meg && b.ventende.konto === meg)
		} : null,
		sesong: lommebok(b).sesong,
		formue: Object.entries(lommebok(b).k).filter(([, x]) => x && x.navn && (x.saldo != null || x.kvelder)).map(([k, x]) => ({
			navn: x.navn,
			saldo: x.saldo != null ? x.saldo : START_FORMUE,
			kvelder: x.kvelder || 0,
			meg: !!(meg && k === meg)
		})).sort((x, y) => y.saldo - x.saldo),
		meg: meg ? (() => {
			const x = lommebok(b).k[meg];
			return {
				navn: x && x.navn ? x.navn : "",
				saldo: x && x.saldo != null ? x.saldo : START_FORMUE,
				kvelder: x ? x.kvelder || 0 : 0
			};
		})() : null,
		aarskonger: (b.aarskonger || []).slice().reverse(),
		utsatte: (b.utsatte || []).slice().reverse().map((u) => ({
			id: u.id,
			q: lang === "en" ? u.qEn : u.q,
			utfallNavn: u.utfallNavn,
			melderNavn: u.melderNavn,
			frist: u.frist,
			status: u.status,
			ja: Object.entries(u.stemmer).filter(([k, v]) => k !== u.subjektKonto && v === "ja").length + (u.melderKonto ? 0 : 1),
			nei: Object.values(u.stemmer).filter((v) => v === "nei").length,
			kanStemme: !!(meg && u.status === "venter" && meg !== u.subjektKonto && meg !== u.melderKonto),
			minStemme: meg ? u.stemmer[meg] || null : null,
			aksjonaerer: u.holdere.length
		})),
		logg: b.logg.slice(0, 40).map((x) => ({
			dato: x.dato,
			tekst: x[lang] || x.no
		}))
	};
}
var pluss_default = {
	julebord: /* @__PURE__ */ JSON.parse("{\"navn\":\"Julebord\",\"om\":\"Til julebordet, førjulsfesten og nissefesten. Trygt å spille med kolleger – men ikke kjedelig.\",\"items\":[{\"t\":\"Alle som har snakket i et helt minutt før noen sa «du er på mute», drikker.\",\"k\":\"Drikk hvis\"},{\"t\":\"Pek på den som sier «jeg skal fatte meg i korthet» og snakker i ti minutter. Den med flest pekere drikker.\",\"k\":\"Pek\"},{\"t\":\"Forklar jobben din slik du ville gjort for bestemor på julaften. Skjønner ikke bordet det, drikk to.\",\"k\":\"Utfordring\"},{\"t\":\"Alle som har varmet fisk i mikroen på jobben, drikker. Kollegaene har ikke glemt det.\",\"k\":\"Drikk hvis\"},{\"t\":\"Skål for alle kontorplantene som ikke overlevde året.\",\"k\":\"Skål\"},{\"t\":\"Alle som har skrevet «Mvh» og ment det passiv-aggressivt, drikker.\",\"k\":\"Drikk hvis\"},{\"t\":\"Pek på den som mest sannsynlig stikker uten å si ha det i kveld. Den med flest pekere drikker nå – før det er for sent.\",\"k\":\"Pek\"},{\"t\":\"Hold en tale på 20 sekunder om hvorfor årets julebord er tidenes beste. Klarer du det uten å le, del ut tre.\",\"k\":\"Utfordring\"},{\"t\":\"Fortell om årets pinligste jobbøyeblikk – eller drikk tre.\",\"k\":\"Sannhet\"},{\"t\":\"Skål for den som bærer mest av jobben uten å få skryt for det.\",\"k\":\"Skål\"},{\"t\":\"Ny regel: Alle peker med albuen. Bruker du fingeren, drikk.\",\"k\":\"Regel\"},{\"t\":\"Den som har vært lengst i jobben, deler ut tre.\",\"k\":\"Del ut\"},{\"t\":\"Alle som har trykket «Svar alle» på noe som bare skulle til én person, drikker.\",\"k\":\"Drikk hvis\"},{\"t\":\"Pek på den som kommer til å kjøpe julegavene på lille julaften. Den med flest pekere drikker.\",\"k\":\"Pek\"},{\"t\":\"Imiter ringelyden i Teams. Bordet stemmer – er den ikke god nok, drikk.\",\"k\":\"Utfordring\"},{\"t\":\"Hvilket jobbuttrykk har du begynt å bruke hjemme? Si det – eller drikk to.\",\"k\":\"Sannhet\"},{\"t\":\"Skål for IT, som har skrudd av og på igjen alt vi har ødelagt i år.\",\"k\":\"Skål\"},{\"t\":\"Ny regel: Alle må si «god jul» før de drikker. Glemmer du det, drikk en til.\",\"k\":\"Regel\"},{\"t\":\"Den som har reist lengst for å være her i kveld, deler ut tre.\",\"k\":\"Del ut\"},{\"t\":\"Alle som har sittet i et Teams-møte i pen skjorte og joggebukse, drikker.\",\"k\":\"Drikk hvis\"},{\"t\":\"Pek på den som alltid har noe godt i skuffen. Vinneren deler ut tre.\",\"k\":\"Pek\"},{\"t\":\"Gi personen til venstre en LinkedIn-anbefaling – høyt og helt seriøst. Ler du, drikk.\",\"k\":\"Utfordring\"},{\"t\":\"Hva er det rareste du har gjort på hjemmekontor med kameraet av? Fortell – eller drikk to.\",\"k\":\"Sannhet\"},{\"t\":\"Skål for dem som ordnet julebordet. Uten dere satt vi hjemme.\",\"k\":\"Skål\"},{\"t\":\"Ny regel: Alle skal tiltales med jobbtittel – «Kan du sende saltet, HR-sjef?» Glemmer du det, drikk.\",\"k\":\"Regel\"},{\"t\":\"Den som har jobbet mest overtid i år, deler ut fire. Det er fortjent.\",\"k\":\"Del ut\"},{\"t\":\"Alle som har booket et falskt møte i kalenderen for å få være i fred, drikker.\",\"k\":\"Drikk hvis\"},{\"t\":\"Pek på den som ser ut til å ha sterke meninger om hvordan oppvaskmaskinen skal fylles. Den med flest pekere drikker.\",\"k\":\"Pek\"},{\"t\":\"Lag fraværsmeldingen din for romjula – høyt og helt ærlig. Ler bordet, del ut to.\",\"k\":\"Utfordring\"},{\"t\":\"Hva står på CV-en din som du egentlig bare kan litt? Svar – eller drikk to.\",\"k\":\"Sannhet\"},{\"t\":\"Skål for alle som har vært nye i år – velkommen til gjengen!\",\"k\":\"Skål\"},{\"t\":\"Ny regel: Rekk opp hånda før du snakker, akkurat som i Teams. Glemmer du det, drikk.\",\"k\":\"Regel\"},{\"t\":\"Den som har bursdag nærmest julaften, deler ut tre.\",\"k\":\"Del ut\"},{\"t\":\"Alle som har tatt med kjøpekake på jobben og latt folk tro den var hjemmelaget, drikker.\",\"k\":\"Drikk hvis\"},{\"t\":\"Pek på den som mest sannsynlig sitter med nisselua på i taxien hjem. Den med flest pekere drikker.\",\"k\":\"Pek\"},{\"t\":\"Si navnet på alle rundt bordet. Glemmer du ett, drikk to.\",\"k\":\"Utfordring\"},{\"t\":\"Rundt bordet: Alle forteller om den rareste gaven de har fått på hemmelig nisse. Den med den rareste deler ut tre.\",\"k\":\"Sannhet\"},{\"t\":\"Skål for den som alltid fyller på kaffemaskinen – og aldri får takk.\",\"k\":\"Skål\"},{\"t\":\"Ny regel: Ingen får si «jobb» før neste regelkort. Sier du det, drikk.\",\"k\":\"Regel\"},{\"t\":\"Den som har mest ferie igjen i år, deler ut tre. Resten lurer på hvordan.\",\"k\":\"Del ut\"},{\"t\":\"Alle som har en kopp på jobben som ingen andre får bruke, drikker.\",\"k\":\"Drikk hvis\"},{\"t\":\"Pek på den som mest sannsynlig går hjem i feil jakke i kveld. Den med flest pekere drikker.\",\"k\":\"Pek\"},{\"t\":\"Nevn fem av de sju slagene på ti sekunder – eller drikk to.\",\"k\":\"Utfordring\"},{\"t\":\"Hva var førsteinntrykket ditt av personen til høyre? Si det – eller drikk to.\",\"k\":\"Sannhet\"},{\"t\":\"Skål for alle som jobber i romjula – dere er de ekte nissene.\",\"k\":\"Skål\"},{\"t\":\"Ny regel: Sjekker du jobbmailen før neste regelkort, drikker du to.\",\"k\":\"Regel\"},{\"t\":\"Den som har mest julepynt hjemme, deler ut tre. Bilde som bevis!\",\"k\":\"Del ut\"},{\"t\":\"Alle som leste julebordinvitasjonen bare for å sjekke menyen, drikker.\",\"k\":\"Drikk hvis\"},{\"t\":\"Pek på den som mest sannsynlig svarer på jobbmail i juleferien. Den med flest pekere drikker – og skrur av varslene.\",\"k\":\"Pek\"},{\"t\":\"Rundt bordet: Alle sier et jobbord ingen utenfor firmaet skjønner. Den som står fast, drikker.\",\"k\":\"Utfordring\"},{\"t\":\"Hva er det mest meningsløse møtet du har sittet i? Fortell – uten navn – eller drikk to.\",\"k\":\"Sannhet\"},{\"t\":\"Skål for alle som har sagt «det kan jeg ta» – og angret i samme sekund.\",\"k\":\"Skål\"},{\"t\":\"Ny regel: «Skål» heter nå «takk for godt samarbeid». Sier du «skål», drikk.\",\"k\":\"Regel\"},{\"t\":\"Den som har vært på flest julebord i år, deler ut tre.\",\"k\":\"Del ut\"},{\"t\":\"Alle som fortsatt ikke vet hva halvparten av kollegaene faktisk jobber med, drikker.\",\"k\":\"Drikk hvis\"},{\"t\":\"Pek på den som har tatt flest bilder i kveld. Den med flest pekere viser det beste – eller drikker to.\",\"k\":\"Pek\"},{\"t\":\"Nynn en julesang. Den som gjetter den først, deler ut to.\",\"k\":\"Utfordring\"},{\"t\":\"Hva er det morsomste du har sett på et julebord? Ingen navn. Fortell – eller drikk to.\",\"k\":\"Sannhet\"},{\"t\":\"Skål for kakefredag – ukas viktigste møte.\",\"k\":\"Skål\"},{\"t\":\"Ny regel: Alt du ber om, må starte med «som nevnt i forrige e-post». Glemmer du det, drikk.\",\"k\":\"Regel\"},{\"t\":\"Alle som har kjøpt julegave til seg selv «ved et uhell», drikker.\",\"k\":\"Drikk hvis\"},{\"t\":\"Pek på den som kan alle versene når dere går rundt juletreet. Vinneren deler ut tre.\",\"k\":\"Pek\"},{\"t\":\"Fullfør setningen «Neste år skal jeg …». Bordet stemmer: Er det ikke troverdig, drikk.\",\"k\":\"Utfordring\"},{\"t\":\"Hvilken kollega ville du helst sittet fast i heisen med i tre timer? Svar – eller drikk to.\",\"k\":\"Sannhet\"},{\"t\":\"Skål for sjefen! Er sjefen her, holder sjefen en tale på maks ti sekunder.\",\"k\":\"Skål\"},{\"t\":\"Alle som har kjøpt gaven til hemmelig nisse på bensinstasjonen samme morgen, drikker.\",\"k\":\"Drikk hvis\"},{\"t\":\"Pek på den som kjøper gave til hemmelig nisse for 500 kroner når grensa er 200. Den med flest pekere drikker.\",\"k\":\"Pek\"},{\"t\":\"Si «god jul» på så mange språk du klarer på ti sekunder. Færre enn tre, drikk.\",\"k\":\"Utfordring\"},{\"t\":\"Hvilken julegave har du byttet uten at giveren vet om det? Svar – eller drikk to.\",\"k\":\"Sannhet\"},{\"t\":\"Alle som har sagt «vi må ta en øl snart» til en kollega uten å mene det, drikker.\",\"k\":\"Drikk hvis\"},{\"t\":\"Pek på den som mest sannsynlig googler midt i en diskusjon i kveld bare for å vinne. Den med flest pekere drikker.\",\"k\":\"Pek\"},{\"t\":\"Pitch en idé til neste års julebord på 15 sekunder. Bordet stemmer: Ja = del ut tre. Nei = drikk.\",\"k\":\"Utfordring\"},{\"t\":\"Alle som har fri hele romjula, drikker. Resten skåler misunnelig.\",\"k\":\"Drikk hvis\"},{\"t\":\"Pek på den som har den beste julegenseren i kveld. Vinneren deler ut tre.\",\"k\":\"Pek\"},{\"t\":\"Lag den mest passiv-aggressive lappen til kjøkkenet på jobben – høyt. Får du bordet til å le, del ut tre.\",\"k\":\"Utfordring\"},{\"t\":\"Alle som har sagt «jeg skal bare ta én» i kveld, drikker.\",\"k\":\"Drikk hvis\"},{\"t\":\"Pek på den man kan høre le fra andre siden av kontorlandskapet. Vinneren deler ut tre.\",\"k\":\"Pek\"},{\"t\":\"Les opp emnefeltet i den siste jobbmailen du sendte – med full teaterstemme. Eller drikk to.\",\"k\":\"Utfordring\"},{\"t\":\"Alle som foretrekker pinnekjøtt framfor ribbe, drikker. Ribbefolket rister på hodet.\",\"k\":\"Drikk hvis\"},{\"t\":\"Pek på den som mest sannsynlig drar hele bordet med ut på dansegulvet. Vinneren deler ut tre.\",\"k\":\"Pek\"},{\"t\":\"Forsvar lutefisk i 20 sekunder. Overbeviser du ingen, drikk to.\",\"k\":\"Utfordring\"},{\"t\":\"Alle som har åpnet adventskalenderen på forskudd i år, drikker.\",\"k\":\"Drikk hvis\"},{\"t\":\"Alle som har gjemt mandelen i kinnet så de andre måtte spise opp grøten, drikker.\",\"k\":\"Drikk hvis\"},{\"t\":\"Alle som har hørt på julemusikk før 1. november i år, drikker.\",\"k\":\"Drikk hvis\"},{\"t\":\"Alle som har sendt en e-post klokka elleve om kvelden bare så sjefen skulle se tidspunktet, drikker.\",\"k\":\"Drikk hvis\"},{\"t\":\"Alle som har gått rett forbi en printer som blinket rødt, drikker.\",\"k\":\"Drikk hvis\"},{\"t\":\"Alle som har snudd i døra fordi noen andre sto ved kaffemaskinen, drikker.\",\"k\":\"Drikk hvis\"},{\"t\":\"Alle som har byttet fane i full fart da sjefen gikk forbi, drikker.\",\"k\":\"Drikk hvis\"},{\"t\":\"Alle som har sagt «jeg tar en titt på det» og aldri gjort det, drikker.\",\"k\":\"Drikk hvis\"},{\"t\":\"Alle som har blitt litt sure fordi noen satt på «plassen deres» i lunsjen, drikker.\",\"k\":\"Drikk hvis\"},{\"t\":\"Alle som har løpt til kjøkkenet etter e-posten «Rester fra møtet står på kjøkkenet!», drikker.\",\"k\":\"Drikk hvis\"},{\"t\":\"Alle som har svart med en tommel opp for å slippe å svare ordentlig, drikker.\",\"k\":\"Drikk hvis\"},{\"t\":\"Alle som har nikket til en forkortelse i et møte uten å ane hva den betydde, drikker.\",\"k\":\"Drikk hvis\"},{\"t\":\"Alle som har glemt navnet på en kollega og unngått å si det i et halvt år, drikker.\",\"k\":\"Drikk hvis\"},{\"t\":\"Alle som har spist pepperkaker fra kaffekroken til lunsj, drikker.\",\"k\":\"Drikk hvis\"}]}"),
	vill: {
		"navn": "Vill",
		"om": "For gjengen som kjenner hverandre godt og tåler det meste. 18+.",
		"items": [
			{
				"t": "Alle som har vært med i en gruppechat om noen i dette rommet, drikker.",
				"k": "Drikk hvis"
			},
			{
				"t": "Pek på den som ser mest uskyldig ut, men garantert ikke er det. Den med flest pekere drikker.",
				"k": "Pek"
			},
			{
				"t": "Hvem her ville du ringt klokka fire om natta – og hvem ville du aldri ringt? Svar – eller drikk tre.",
				"k": "Sannhet"
			},
			{
				"t": "Alle som har våknet til en Vipps fra natta de ikke kan forklare, drikker.",
				"k": "Drikk hvis"
			},
			{
				"t": "Vis det siste skjermbildet du tok – eller drikk tre.",
				"k": "Utfordring"
			},
			{
				"t": "Alle som har sendt «Er du våken?» etter midnatt, drikker.",
				"k": "Drikk hvis"
			},
			{
				"t": "Pek på den som lyver mest overbevisende. Den med flest pekere forteller sin beste løgn – eller drikker tre.",
				"k": "Pek"
			},
			{
				"t": "Hva er den største løgnen du har fortalt denne gjengen? Fortell – eller drikk tre.",
				"k": "Sannhet"
			},
			{
				"t": "Les opp den siste meldingen du sendte til et crush – med nyhetsoppleserstemme. Eller drikk tre.",
				"k": "Utfordring"
			},
			{
				"t": "Ny regel: Avslutt hver setning med «… i senga». Glemmer du det, drikk.",
				"k": "Regel"
			},
			{
				"t": "Alle som har blitt dumpet over melding, deler ut to. Dere har lidd nok.",
				"k": "Del ut"
			},
			{
				"t": "Alle drikker. Har du kysset noen i dette rommet, drikk to. Ingen spørsmål.",
				"k": "Alle"
			},
			{
				"t": "Skål for alle dårlige beslutninger som ble gode historier.",
				"k": "Skål"
			},
			{
				"t": "Alle som har slettet en fyllemelding før den andre rakk å lese den, drikker.",
				"k": "Drikk hvis"
			},
			{
				"t": "Pek på den som har de verste idéene klokka tre om natta. Den med flest pekere drikker.",
				"k": "Pek"
			},
			{
				"t": "Si hvem i gjengen du tror snakker mest om deg. Innrømmer hen det, drikker hen – ellers drikker du.",
				"k": "Sannhet"
			},
			{
				"t": "Ta en stirrekonkurranse med den rett overfor deg – med ditt mest forførende blikk. Den som ler først, drikker.",
				"k": "Utfordring"
			},
			{
				"t": "Ny regel: Ingen får si «eks». Sier du det, drikk to.",
				"k": "Regel"
			},
			{
				"t": "Den som har hatt flest nachspiel hjemme hos seg i år, deler ut tre. Takk for husly.",
				"k": "Del ut"
			},
			{
				"t": "Alle som har brukt et datingbilde som er over tre år gammelt, drikker.",
				"k": "Drikk hvis"
			},
			{
				"t": "Pek på den som har flest skjermbilder av andres meldinger. Den med flest pekere drikker.",
				"k": "Pek"
			},
			{
				"t": "Hva er det dummeste du har gjort i fylla? Gjengen stemmer – er det for kjedelig, drikk tre.",
				"k": "Sannhet"
			},
			{
				"t": "Gi personen til venstre ditt beste flørtekompliment – om det er greit. Blir det rødming, del ut tre. Blir det latter, drikk.",
				"k": "Utfordring"
			},
			{
				"t": "Ny regel: Den som sier «full», «brisen» eller «dritings», drikker.",
				"k": "Regel"
			},
			{
				"t": "Den som kom seinest hjem forrige helg, deler ut tre.",
				"k": "Del ut"
			},
			{
				"t": "Alle som har stalket eksens nye kjæreste og vært livredde for å like et gammelt bilde ved et uhell, drikker.",
				"k": "Drikk hvis"
			},
			{
				"t": "Pek på den som sier «bare én øl» og blir sist ut av nachspielet. Den med flest pekere drikker.",
				"k": "Pek"
			},
			{
				"t": "Hva er den dårligste unnskyldningen du har brukt for å slippe å bli over natta? Fortell – eller drikk tre.",
				"k": "Sannhet"
			},
			{
				"t": "Gjør din beste imitasjon av en i gjengen i fylla. Gjetter de andre hvem, del ut tre. Hvis ikke, drikk.",
				"k": "Utfordring"
			},
			{
				"t": "Ny regel: Alle drikker med den andre hånda. Glemmer du det, drikk en til.",
				"k": "Regel"
			},
			{
				"t": "Alle som googlet noen her før de møtte dem i kveld, drikker.",
				"k": "Drikk hvis"
			},
			{
				"t": "Pek på den som mest sannsynlig forsvinner med noen før klokka to i kveld. Den med flest pekere drikker.",
				"k": "Pek"
			},
			{
				"t": "Hva er det mest pinlige du har kjøpt på nett i fylla? Fortell – eller drikk tre.",
				"k": "Sannhet"
			},
			{
				"t": "La gjengen skrive en ny datingprofil til deg på 20 sekunder. Les den høyt, helt alvorlig – eller drikk tre.",
				"k": "Utfordring"
			},
			{
				"t": "Velg en drikkepartner. Hver gang du drikker fram til neste regelkort, drikker partneren også.",
				"k": "Regel"
			},
			{
				"t": "Alle som har ligget med en eks «bare én siste gang», drikker.",
				"k": "Drikk hvis"
			},
			{
				"t": "Pek på den som er verst til å holde på en hemmelighet. Den med flest pekere drikker to.",
				"k": "Pek"
			},
			{
				"t": "Hva er den dårligste sjekkereplikken du faktisk har brukt? Si den – eller drikk tre.",
				"k": "Sannhet"
			},
			{
				"t": "Fortell en fyllahistorie på 30 sekunder der én detalj er løgn. Finner gjengen løgnen, drikk.",
				"k": "Utfordring"
			},
			{
				"t": "Alle som har gått hjem en søndag morgen i gårsdagens festklær, drikker.",
				"k": "Drikk hvis"
			},
			{
				"t": "Pek på den som mest sannsynlig ville datet noen bare for hytta. Den med flest pekere drikker.",
				"k": "Pek"
			},
			{
				"t": "Hva er det mest smålige du har gjort etter et brudd? Fortell – eller drikk tre.",
				"k": "Sannhet"
			},
			{
				"t": "Snakk om eksen din i 30 sekunder uten å si noe negativt. Klarer du det ikke, drikk.",
				"k": "Utfordring"
			},
			{
				"t": "Alle som har hatt et fast ligg de aldri har spist middag med, drikker.",
				"k": "Drikk hvis"
			},
			{
				"t": "Pek på den som sier «jeg Vippser deg» og aldri gjør det. Den med flest pekere gjør opp nå – eller drikker tre.",
				"k": "Pek"
			},
			{
				"t": "Hvem i gjengen har du vært mest misunnelig på – og hvorfor? Svar – eller drikk tre.",
				"k": "Sannhet"
			},
			{
				"t": "Si tre ting du liker med personen til høyre – og én vane som irriterer deg. Eller drikk tre.",
				"k": "Utfordring"
			},
			{
				"t": "Alle som har blitt avbrutt fordi noen i kollektivet kom hjem for tidlig, drikker.",
				"k": "Drikk hvis"
			},
			{
				"t": "Pek på den som mest sannsynlig har en eks i hver bydel. Den med flest pekere drikker.",
				"k": "Pek"
			},
			{
				"t": "Hva er det kleineste som har skjedd deg på et one night stand? Fortell – eller drikk tre.",
				"k": "Sannhet"
			},
			{
				"t": "Anmeld den siste daten din på ti sekunder – med terningkast. Eller drikk tre.",
				"k": "Utfordring"
			},
			{
				"t": "Alle som har løyet om hvor mye de tjener, drikker.",
				"k": "Drikk hvis"
			},
			{
				"t": "Pek på den som er farligst å ta med på byen når du skal tidlig opp dagen etter. Den med flest pekere drikker.",
				"k": "Pek"
			},
			{
				"t": "Alle som har takket nei til noen her og så blitt avslørt på Insta et annet sted, drikker.",
				"k": "Drikk hvis"
			},
			{
				"t": "Pek på den som har det mest kaotiske datinglivet. Den med flest pekere forteller siste kapittel – eller drikker tre.",
				"k": "Pek"
			},
			{
				"t": "Alle som har latt foreldrene betale noe i år som de egentlig burde betalt selv, drikker.",
				"k": "Drikk hvis"
			},
			{
				"t": "Alle som har sendt et bilde og angret i det sekundet det sto «sett», drikker.",
				"k": "Drikk hvis"
			},
			{
				"t": "Alle som har våknet ved siden av en kebab de ikke husker at de kjøpte, drikker.",
				"k": "Drikk hvis"
			},
			{
				"t": "Alle som har lånt soverommet til verten på en fest, drikker.",
				"k": "Drikk hvis"
			},
			{
				"t": "Alle som har lest meldingene til en kjæreste uten lov, drikker.",
				"k": "Drikk hvis"
			}
		]
	},
	"bli-kjent": {
		"navn": "Bli kjent",
		"om": "Til fadderuka, nytt kollektiv og første vors med nye folk. Ingen trenger å kjenne noen fra før.",
		"items": [
			{
				"t": "Alle som har gått for håndtrykk mens den andre gikk for klem, drikker. Endte det i en high five, drikk to.",
				"k": "Drikk hvis"
			},
			{
				"t": "Ny regel: Det er forbudt å spørre «hva studerer du?» og «hva jobber du med?». Den som gjør det, drikker.",
				"k": "Regel"
			},
			{
				"t": "Pek på den som virker som typen som lager gruppechatten etter i kveld. Vinneren deler ut tre.",
				"k": "Pek"
			},
			{
				"t": "Den som leser: si navnet og én ting du vet om hver person rundt bordet. Klarer du alle, del ut tre. Bommer du, drikk to.",
				"k": "Utfordring"
			},
			{
				"t": "Skål for verten! Alle som ikke vet hva verten heter til etternavn, drikker en ekstra.",
				"k": "Skål"
			},
			{
				"t": "Alle som har sagt «rett utenfor Oslo» om et sted som ligger to timer unna, drikker.",
				"k": "Drikk hvis"
			},
			{
				"t": "Hva er den rareste sommerjobben du har hatt? Svar – eller drikk to.",
				"k": "Sannhet"
			},
			{
				"t": "Pek på den du tror har den beste historien om hvordan hen havnet her i kveld. Den med flest pekere forteller – eller drikker to.",
				"k": "Pek"
			},
			{
				"t": "Bytt plass med den du har snakket minst med i kveld. Still hverandre ett spørsmål hver før neste kort – ellers drikker begge.",
				"k": "Utfordring"
			},
			{
				"t": "Alle som har sagt «hæ?» tre ganger og så bare nikket og smilt, drikker.",
				"k": "Drikk hvis"
			},
			{
				"t": "Ny regel: Før du drikker, må du si navnet til den som sitter til venstre for deg. Feil navn: drikk én til.",
				"k": "Regel"
			},
			{
				"t": "Hvilken app ville du skammet deg mest over om noen så skjermtiden din? Svar – eller drikk to.",
				"k": "Sannhet"
			},
			{
				"t": "Alle som har presentert seg for samme person to ganger på én fest, drikker. Skjedde det i kveld, drikk to.",
				"k": "Drikk hvis"
			},
			{
				"t": "Du og den til høyre har ti sekunder på å finne noe dere begge hater. Klarer dere det, skål. Hvis ikke, drikk én hver.",
				"k": "Utfordring"
			},
			{
				"t": "Hvis dere bodde i kollektiv sammen: Pek på den som ville kjøpt dopapir uten å sende Vipps-krav. Vinneren deler ut tre.",
				"k": "Pek"
			},
			{
				"t": "Den som er oppvokst lengst nord, deler ut tre. Den som er oppvokst lengst sør, drikker én.",
				"k": "Del ut"
			},
			{
				"t": "Alle som har kommet for tidlig til en fest og gått en runde rundt kvartalet, drikker.",
				"k": "Drikk hvis"
			},
			{
				"t": "Hva kjøpte du for den aller første lønna di? Svar – eller drikk to.",
				"k": "Sannhet"
			},
			{
				"t": "Gjett hvor den til venstre for deg er oppvokst. Riktig fylke: del ut to. Riktig sted: del ut fire. Bom: drikk én.",
				"k": "Utfordring"
			},
			{
				"t": "Alle som har vært på en fest der den eneste de kjente, dro først, drikker.",
				"k": "Drikk hvis"
			},
			{
				"t": "Skål for alle som kom hit i kveld og bare kjente én person – nå kjenner dere flere!",
				"k": "Skål"
			},
			{
				"t": "Pek på den som virker som typen som kjenner noen overalt. Den med flest pekere nevner en bekjent i Hammerfest – eller drikker.",
				"k": "Pek"
			},
			{
				"t": "Hva er den beste avgjørelsen du har tatt på fylla? Svar – eller drikk to.",
				"k": "Sannhet"
			},
			{
				"t": "Alle som har fått en ny bestevenn i dokøen på en fest, drikker.",
				"k": "Drikk hvis"
			},
			{
				"t": "Alle med en annen dialekt enn den som leser: si «jeg må bare innom butikken» på dialekt. Beste versjon deler ut tre.",
				"k": "Utfordring"
			},
			{
				"t": "Ny regel: Hver gang noen sier navnet ditt, må du løfte glasset. Glemmer du det, drikk.",
				"k": "Regel"
			},
			{
				"t": "Alle som har danset hele kvelden med noen uten å få vite hva de het, drikker.",
				"k": "Drikk hvis"
			},
			{
				"t": "Pek på den som garantert rekker opp hånda når foreleseren sier «da var vi ferdige». Den med flest pekere drikker.",
				"k": "Pek"
			},
			{
				"t": "Hva er det kuleste du har latt som du kunne – på CV-en eller på date? Svar – eller drikk to.",
				"k": "Sannhet"
			},
			{
				"t": "Vis den siste sangen du spilte. Synes bordet den er pinlig, drikk to. Har noen andre den på en spilleliste, skål med dem.",
				"k": "Utfordring"
			},
			{
				"t": "Alle som allerede har fulgt noen her på Insta i kveld, drikker.",
				"k": "Drikk hvis"
			},
			{
				"t": "Runde: Alle sier navnet sitt og én ting de er gode på som ingen ville gjettet. Den beste deler ut tre.",
				"k": "Alle"
			},
			{
				"t": "Pek på den som virker som typen som aldri har vært på låvefest. Den med flest pekere drikker – eller forteller om sin første.",
				"k": "Pek"
			},
			{
				"t": "Alle som har bodd på en hybel der man nådde kjøleskapet fra senga, drikker.",
				"k": "Drikk hvis"
			},
			{
				"t": "Lær navnet til den som sitter lengst unna deg. På neste kort må du skåle med hen og si navnet. Glemmer du det: drikk to.",
				"k": "Utfordring"
			},
			{
				"t": "Hva er din mest upopulære mening om mat? Svar – den som er mest uenig, drikker.",
				"k": "Sannhet"
			},
			{
				"t": "Den som har hatt bursdag sist, deler ut to. Den som har bursdag snarest, drikker én – på forskudd.",
				"k": "Del ut"
			},
			{
				"t": "Alle som vet hva naboens katt heter, men ikke hva naboen heter, drikker.",
				"k": "Drikk hvis"
			},
			{
				"t": "Pek på den du tror studerer eller jobber med noe helt annet enn resten. Den med flest pekere sier hva – og deler ut to.",
				"k": "Pek"
			},
			{
				"t": "Skål for Lånekassen – den eneste som har trodd på oss alle.",
				"k": "Skål"
			},
			{
				"t": "Lag en hemmelig hilsen med den til høyre: en high five, en lyd og en bevegelse. Liker bordet den, deler dere ut to hver.",
				"k": "Utfordring"
			},
			{
				"t": "Ny regel: Sjekker du mobilen, må du fortelle bordet hva du sjekket – eller drikke to.",
				"k": "Regel"
			},
			{
				"t": "Alle som har klart seg en hel ferie på «takk», «øl» og peking, drikker.",
				"k": "Drikk hvis"
			},
			{
				"t": "Hvilken låt får deg til å synge høyt i bilen når du er alene? Svar – eller drikk to.",
				"k": "Sannhet"
			},
			{
				"t": "Pek på den du tror har vært på flest konserter i år. Den med flest pekere nevner den beste – og deler ut to.",
				"k": "Pek"
			},
			{
				"t": "Finn en ting i rommet som sier mye om verten. Forklar hvorfor på ti sekunder. Morsomste forklaring deler ut to.",
				"k": "Utfordring"
			},
			{
				"t": "Alle som har måttet si en «fun fact» om seg selv og fått totalt jernteppe, drikker.",
				"k": "Drikk hvis"
			},
			{
				"t": "Ny regel: Du kan bare stille spørsmål til folk du ikke kjente før i kveld. Spør du en du kjente fra før, drikk.",
				"k": "Regel"
			},
			{
				"t": "Hvilken vane hos en romkamerat har fått deg til å flytte – eller nesten? Svar – eller drikk to.",
				"k": "Sannhet"
			},
			{
				"t": "Skål for den som kom først i kveld – hen fikk se verten i joggebukse.",
				"k": "Skål"
			},
			{
				"t": "Alle som har sagt «vi må finne på noe!» til en de aldri så igjen, drikker.",
				"k": "Drikk hvis"
			},
			{
				"t": "Pek på den som har snakket med flest nye folk i kveld. Vinneren deler ut tre.",
				"k": "Pek"
			},
			{
				"t": "Gjett stjernetegnet til den til venstre for deg. Riktig: del ut tre. Feil: drikk én – og hør hvorfor det er så typisk.",
				"k": "Utfordring"
			},
			{
				"t": "Hva er det mest overvurderte ved stedet du vokste opp? Svar – eller drikk to.",
				"k": "Sannhet"
			},
			{
				"t": "Alle som har banan i tacoen, drikker – og forklarer seg.",
				"k": "Drikk hvis"
			},
			{
				"t": "Spør den til høyre om det verste stedet hen har bodd. Gjenfortell historien til bordet på 20 sekunder. God historie: del ut to.",
				"k": "Utfordring"
			},
			{
				"t": "Den med færrest uleste e-poster deler ut tre. Den med flest drikker én per tusen – maks tre.",
				"k": "Del ut"
			},
			{
				"t": "Pek på den som virker som typen som sier «hei» til alle på søndagsturen. Vinneren deler ut to.",
				"k": "Pek"
			},
			{
				"t": "Alle skåler på et annet språk eller en annen dialekt. Den mest overbevisende deler ut to.",
				"k": "Skål"
			},
			{
				"t": "Hva er det beste du har kjøpt brukt på Finn – og det verste? Svar – eller drikk to.",
				"k": "Sannhet"
			},
			{
				"t": "Ny regel: Glasset i venstre hånd. Blir du tatt med det i høyre, drikker du – og sier navnet til den som tok deg.",
				"k": "Regel"
			},
			{
				"t": "Gi den til venstre et kallenavn basert på noe hen har fortalt i kveld. Liker hen det, del ut to. Hvis ikke, drikk én.",
				"k": "Utfordring"
			},
			{
				"t": "Runde: Alle sier hvilken låt de ville satt på nå. Bordet stemmer – vinnerlåten settes på, og den som foreslo den, deler ut to.",
				"k": "Alle"
			},
			{
				"t": "Alle som har sagt «jeg er så dårlig på navn» i kveld, drikker. Spør på nytt – det er lov.",
				"k": "Drikk hvis"
			}
		]
	},
	hyttetur: {
		"navn": "Hyttetur",
		"om": "For gjengen på hytta – fra fredagsankomst til søndagsvasken. Noen regler varer hele helga.",
		"items": [
			{
				"t": "Alle som har brukt utedo med hodelykt og døra på gløtt, drikker.",
				"k": "Drikk hvis"
			},
			{
				"t": "Pek på den som alltid sniker seg unna oppvasken. Den med flest pekere drikker – og tar den i morgen.",
				"k": "Pek"
			},
			{
				"t": "Helgeregel: Den som sier ordet «hytta» resten av turen, drikker. Ja, det blir vanskelig.",
				"k": "Helgeregel"
			},
			{
				"t": "Skål for den som planla turen! Alle som aldri svarte i gruppechatten om den, drikker en ekstra.",
				"k": "Skål"
			},
			{
				"t": "Imiter en lyd hytta lager om natta. Gjetter bordet hva det er, del ut to. Hvis ikke, drikk én.",
				"k": "Utfordring"
			},
			{
				"t": "Alle som har glemt noe som stod på pakkelista, drikker. Var det soveposen, drikk to.",
				"k": "Drikk hvis"
			},
			{
				"t": "Pek på den som sikret seg dobbeltsenga før noen andre hadde fått av seg skoa. Den med flest pekere drikker.",
				"k": "Pek"
			},
			{
				"t": "Hva er det verste du har glemt å ta med på en hyttetur? Svar – eller drikk to.",
				"k": "Sannhet"
			},
			{
				"t": "Alle som har lagt ut for felleskassa og fortsatt venter på Vipps, drikker – på felleskassas regning.",
				"k": "Drikk hvis"
			},
			{
				"t": "Alle som har sovet i en køyeseng og slått hodet i taket om morgenen, drikker.",
				"k": "Drikk hvis"
			},
			{
				"t": "Lag en ny regel for hytta og skriv den i hytteboka – eller på en lapp på kjøleskapet. Liker bordet den, del ut tre.",
				"k": "Utfordring"
			},
			{
				"t": "Alle som har spilt Alias og forklart et ord med ordet selv, drikker.",
				"k": "Drikk hvis"
			},
			{
				"t": "Pek på den som kommer til å sovne først i kveld – gjerne i sofaen med jakka på. Den med flest pekere drikker.",
				"k": "Pek"
			},
			{
				"t": "Den som bar mest inn fra bilen, deler ut tre.",
				"k": "Del ut"
			},
			{
				"t": "Alle som har lovet å stå opp tidlig for å gå på tur – og ikke gjorde det, drikker.",
				"k": "Drikk hvis"
			},
			{
				"t": "Ny regel: Alle snakker om seg selv i tredjeperson. Den som glemmer det, drikker.",
				"k": "Regel"
			},
			{
				"t": "Fortell om den verste hytteturen du har vært på – uten å nevne navn. Svar – eller drikk to.",
				"k": "Sannhet"
			},
			{
				"t": "Pek på den som står opp først i morgen og lager frokost til alle. Vinneren deler ut tre.",
				"k": "Pek"
			},
			{
				"t": "Alle som har tatt med mer øl enn klær, drikker.",
				"k": "Drikk hvis"
			},
			{
				"t": "Helgeregel: Den som tar siste kopp kaffe uten å sette på ny, drikker to.",
				"k": "Helgeregel"
			},
			{
				"t": "Hold en 20 sekunders værmelding for i morgen – med dramatisk stemme. Godkjenner bordet den, del ut to.",
				"k": "Utfordring"
			},
			{
				"t": "Alle som har sovet på en luftmadrass som var flat innen morgenen, drikker.",
				"k": "Drikk hvis"
			},
			{
				"t": "Pek på den som jukser i brettspill og kaller det «strategi». Den med flest pekere drikker.",
				"k": "Pek"
			},
			{
				"t": "Skål for hyttefreden! Alle legger mobilen midt på bordet til neste kort. Den som tar sin først, drikker to.",
				"k": "Skål"
			},
			{
				"t": "Alle som har prøvd å tenne i peisen i ti minutter og endt med en stue full av røyk, drikker.",
				"k": "Drikk hvis"
			},
			{
				"t": "Hva er den mest unødvendige tingen du har pakket til denne turen? Vis den fram – eller drikk to.",
				"k": "Sannhet"
			},
			{
				"t": "Pek på den som garantert sier «vi burde gjøre dette oftere» i løpet av helga. Den med flest pekere drikker.",
				"k": "Pek"
			},
			{
				"t": "Gjett hvor mange tomme flasker som står på kjøkkenet akkurat nå. Nærmest deler ut to, lengst unna rydder dem.",
				"k": "Utfordring"
			},
			{
				"t": "Alle som har bladd i hytteboka og lest opp en hilsen fra 1997, drikker.",
				"k": "Drikk hvis"
			},
			{
				"t": "Helgeregel: Den som står opp først i morgen, velger plass i bilen hjem. Ingen protester.",
				"k": "Helgeregel"
			},
			{
				"t": "Den som har vært på denne hytta flest ganger, deler ut én for hver gang – maks fem.",
				"k": "Del ut"
			},
			{
				"t": "Alle som har kommet fram og oppdaget at Polet stengte for en time siden, drikker – hvis det er noe igjen.",
				"k": "Drikk hvis"
			},
			{
				"t": "Pek på den som har pakket som om dere skulle være borte i tre uker. Den med flest pekere drikker.",
				"k": "Pek"
			},
			{
				"t": "Bygg et tårn av ting fra bordet – ikke glass – på 30 sekunder. Står det i fem sekunder, del ut tre.",
				"k": "Utfordring"
			},
			{
				"t": "Alle som har gått på ski, falt og sagt «det var med vilje», drikker.",
				"k": "Drikk hvis"
			},
			{
				"t": "Hvilken hyttetradisjon fra barndommen savner du – og hvilken er du glad er borte? Svar – eller drikk to.",
				"k": "Sannhet"
			},
			{
				"t": "Ny regel: Alle snakker lavt, som om naboene i hytta ved siden av sover. Den som blir høylytt, drikker.",
				"k": "Regel"
			},
			{
				"t": "Pek på den som har kjørt mest og drukket minst på hytteturer opp gjennom. Vinneren deler ut fire.",
				"k": "Pek"
			},
			{
				"t": "Alle som har brukt ørepropper på hyttetur på grunn av noen i dette rommet, drikker.",
				"k": "Drikk hvis"
			},
			{
				"t": "Helgeregel: Den som snorker i natt, lager frokost. Bevisbyrden ligger hos de som lå våkne.",
				"k": "Helgeregel"
			},
			{
				"t": "Ta på deg det mest hytteaktige plagget du finner – ullsokker, anorakk eller lue – og behold det til neste kort. Nekter du, drikk to.",
				"k": "Utfordring"
			},
			{
				"t": "Alle som har tatt med jobb-PC-en «i tilfelle», drikker.",
				"k": "Drikk hvis"
			},
			{
				"t": "Skål for hytteeieren – og for å bli invitert tilbake. Alle som har knust noe her, drikker en ekstra.",
				"k": "Skål"
			},
			{
				"t": "Pek på den som har sendt bilde av utsikten til familiechatten i dag. Den med flest pekere drikker.",
				"k": "Pek"
			},
			{
				"t": "Fjellet eller sjøen – og hva er det dummeste argumentet ditt for det? Svar – eller drikk to.",
				"k": "Sannhet"
			},
			{
				"t": "Alle som har lett etter dekning med mobilen strukket over hodet, drikker.",
				"k": "Drikk hvis"
			},
			{
				"t": "Velg en ting i rommet. De andre får fem ja/nei-spørsmål. Gjetter de det ikke, del ut to.",
				"k": "Utfordring"
			},
			{
				"t": "Helgeregel: Den som taper et brettspill, skriver en hilsen i hytteboka på vegne av vinneren.",
				"k": "Helgeregel"
			},
			{
				"t": "Alle som har spist kvikklunsj på tur og sagt «det smaker bedre på fjellet», drikker.",
				"k": "Drikk hvis"
			},
			{
				"t": "Den som handlet inn maten, deler ut tre. Den som bare har spist den, drikker én.",
				"k": "Del ut"
			},
			{
				"t": "Pek på den som først foreslår «én runde til» med kortspillet klokka tre i natt. Den med flest pekere drikker.",
				"k": "Pek"
			},
			{
				"t": "Hva er det pinligste som har skjedd deg på en hyttetur – som du kan fortelle her? Svar – eller drikk to.",
				"k": "Sannhet"
			},
			{
				"t": "Alle som har kjørt til en hytte med feil adresse på GPS-en, drikker.",
				"k": "Drikk hvis"
			},
			{
				"t": "Ny regel: Den som går på do, må si «skal bare ut og sjekke været». Glemmer du det, drikk.",
				"k": "Regel"
			},
			{
				"t": "Lag en pakkeliste til neste tur med fem ting – uten mobil. Glemmer du dopapir, drikk to.",
				"k": "Utfordring"
			},
			{
				"t": "Pek på den som har en pakkeliste – i notatappen eller laminert. Den med flest pekere deler ut tre.",
				"k": "Pek"
			},
			{
				"t": "Alle som har dratt på en «kjapp» hyttetur og blitt en dag ekstra, drikker.",
				"k": "Drikk hvis"
			},
			{
				"t": "Helgeregel: Sko av inne. Den som blir tatt i sko, drikker – og tørker gulvet.",
				"k": "Helgeregel"
			},
			{
				"t": "Skål for felleskassa – måtte den gå i null på søndag. Den som har oversikten, deler ut tre.",
				"k": "Skål"
			},
			{
				"t": "Vis hvordan hytteeieren viser fram hytta: «og her er sikringsskapet …». Treffer du, del ut to.",
				"k": "Utfordring"
			},
			{
				"t": "Pek på den som bruker lengst tid på badet om morgenen – på en hytte med ett bad. Den med flest pekere drikker.",
				"k": "Pek"
			},
			{
				"t": "Hvis dere ble snødd inne en uke, hvem her blir lederen – og hvem starter et opprør? Svar – eller drikk to.",
				"k": "Sannhet"
			},
			{
				"t": "Den som har gått lengst tur i dag, deler ut én per kilometer – maks fire.",
				"k": "Del ut"
			},
			{
				"t": "Helgeregel: Den som går sist til sengs i kveld, bærer inn ved i morgen.",
				"k": "Helgeregel"
			}
		]
	},
	bursdag: {
		"navn": "Bursdag",
		"om": "Til bursdagsvorset: bursdagsbarnet står i sentrum, og alle får høre de beste historiene.",
		"items": [
			{
				"t": "Alle som kjøpte gaven på vei hit, drikker.",
				"k": "Drikk hvis"
			},
			{
				"t": "Bursdagsbarnet velger kveldens DJ. Den som bytter låt uten lov, drikker.",
				"k": "Bursdagsbarnet"
			},
			{
				"t": "Hold en tale for bursdagsbarnet på 20 sekunder – uten å si «gratulerer» eller «fantastisk». Klarer du det, del ut tre.",
				"k": "Utfordring"
			},
			{
				"t": "Pek på den som garantert har glemt å kjøpe kort. Den med flest pekere drikker – og skriver et på en serviett.",
				"k": "Pek"
			},
			{
				"t": "Ny regel: Bursdagsbarnet skal ikke skjenke seg selv. Ser noen det skje, drikker den som satt nærmest.",
				"k": "Regel"
			},
			{
				"t": "Alle som har kjent bursdagsbarnet i mer enn ti år, drikker. Mer enn tjue år: drikk to.",
				"k": "Drikk hvis"
			},
			{
				"t": "Bursdagsbarnet sier hvem i rommet hen har kjent lengst. Dere skåler – og den andre forteller sitt første minne av dere to.",
				"k": "Bursdagsbarnet"
			},
			{
				"t": "Hva tenkte du om bursdagsbarnet første gang dere møttes – og når endret det seg? Svar – eller drikk to.",
				"k": "Sannhet"
			},
			{
				"t": "Alle som møtte bursdagsbarnet for første gang i kveld, drikker – velkommen!",
				"k": "Drikk hvis"
			},
			{
				"t": "Skål for bursdagsbarnet med et rungende «hipp hipp hurra». Den som roper svakest, drikker en ekstra.",
				"k": "Skål"
			},
			{
				"t": "Pek på den som kommer til å holde en tale ingen ba om senere i kveld. Den med flest pekere drikker – og øver.",
				"k": "Pek"
			},
			{
				"t": "Bursdagsbarnet innfører en lov som gjelder resten av kvelden – og er den eneste som slipper å følge den. Brudd: drikk.",
				"k": "Bursdagsbarnet"
			},
			{
				"t": "Alle som har pakket inn en gave i avispapir eller en handlepose fordi de glemte gavepapir, drikker.",
				"k": "Drikk hvis"
			},
			{
				"t": "Fortell hvordan du møtte bursdagsbarnet – på ti sekunder. God historie: del ut to. Hvis ikke, drikk én.",
				"k": "Utfordring"
			},
			{
				"t": "Alle som har glemt bursdagen til bursdagsbarnet minst én gang, drikker. Var det i år, drikk to.",
				"k": "Drikk hvis"
			},
			{
				"t": "Bursdagsbarnet: Nevn det beste som har skjedd deg det siste året. Alle som var med på det, skåler.",
				"k": "Bursdagsbarnet"
			},
			{
				"t": "Hva er den verste gaven du noen gang har fått – og sa du takk? Svar – eller drikk to.",
				"k": "Sannhet"
			},
			{
				"t": "Pek på den som har vært på flest av bursdagsbarnets bursdager. Den med flest pekere deler ut én per bursdag – maks fem.",
				"k": "Pek"
			},
			{
				"t": "Alle som har fått en lydmelding på over to minutter fra bursdagsbarnet, drikker.",
				"k": "Drikk hvis"
			},
			{
				"t": "Finn noen du ikke kjente før i kveld, og finn ut hvordan hen kjenner bursdagsbarnet. Presenter hen for bordet – klarer du det, del ut to.",
				"k": "Utfordring"
			},
			{
				"t": "Bursdagsbarnet peker på den som kjenner hen best. Tre spørsmål fra bursdagsbarnet: alle riktige, del ut tre. Ellers drikk tre.",
				"k": "Bursdagsbarnet"
			},
			{
				"t": "Skål for alle de andre bursdagene vi har glemt i år.",
				"k": "Skål"
			},
			{
				"t": "Alle som har sagt «jeg er for gammel til dette» i år, drikker – og blir med likevel.",
				"k": "Drikk hvis"
			},
			{
				"t": "Hvilken historie om bursdagsbarnet blir fortalt på hver eneste fest? Fortell den – eller drikk to.",
				"k": "Sannhet"
			},
			{
				"t": "Bursdagsbarnet slipper å drikke på neste kort – og kan gi slurken sin til hvem hen vil.",
				"k": "Bursdagsbarnet"
			},
			{
				"t": "Pek på den som garantert har bladd gjennom bursdagsbarnets gamle bilder for å finne et pinlig ett. Den med flest pekere drikker.",
				"k": "Pek"
			},
			{
				"t": "Alle som har blåst ut lysene på en kake som ikke var deres egen, drikker.",
				"k": "Drikk hvis"
			},
			{
				"t": "Lag et bursdagsrim på to linjer om bursdagsbarnet – det må rime på «kake». Godkjenner bursdagsbarnet det, del ut tre.",
				"k": "Utfordring"
			},
			{
				"t": "Bursdagsbarnet velger to som ikke kjente hverandre fra før. De er makkere til neste kort: drikker én, drikker begge.",
				"k": "Bursdagsbarnet"
			},
			{
				"t": "Alle som har ønsket seg «ingenting» til bursdagen og blitt skuffet da de fikk det, drikker.",
				"k": "Drikk hvis"
			},
			{
				"t": "Skål for gjestene som ikke kjente hverandre før i kveld – og som snart gjør det.",
				"k": "Skål"
			},
			{
				"t": "Pek på den som har gitt bursdagsbarnet den beste gaven noensinne. Vinneren deler ut tre.",
				"k": "Pek"
			},
			{
				"t": "Bordet gjetter hva bursdagsbarnet ønsker seg mest akkurat nå. Bursdagsbarnet avgjør – riktig gjetning deler ut tre.",
				"k": "Bursdagsbarnet"
			},
			{
				"t": "Alle som har startet bursdagssangen i feil toneart og ikke kommet seg ut av det, drikker.",
				"k": "Drikk hvis"
			},
			{
				"t": "Hva er det rareste du har gjort på en bursdag? Svar – eller drikk to.",
				"k": "Sannhet"
			},
			{
				"t": "Syng bursdagssangen som en operasanger eller en metal-vokalist – bursdagsbarnet velger. Nekter du, drikk to.",
				"k": "Utfordring"
			},
			{
				"t": "Bursdagsbarnet kårer kveldens beste antrekk. Vinneren deler ut tre.",
				"k": "Bursdagsbarnet"
			},
			{
				"t": "Alle som har et bilde av bursdagsbarnet på mobilen som hen ikke vet om, drikker.",
				"k": "Drikk hvis"
			},
			{
				"t": "Ny regel: Alle må si «gratulerer» hver gang de snakker til bursdagsbarnet. Den som glemmer det, drikker.",
				"k": "Regel"
			},
			{
				"t": "Pek på den som garantert blir rørt under talene i kveld. Den med flest pekere drikker – og finner fram tørkepapiret.",
				"k": "Pek"
			},
			{
				"t": "Bursdagsbarnet imiterer noen i rommet. Gjetter bordet hvem det er innen ti sekunder, drikker den som ble imitert.",
				"k": "Bursdagsbarnet"
			},
			{
				"t": "Alle som har vært på nachspiel med bursdagsbarnet som varte til frokost, drikker.",
				"k": "Drikk hvis"
			},
			{
				"t": "Vis det eldste bildet du har av bursdagsbarnet. Eldste bilde deler ut tre – bursdagsbarnet har vetorett.",
				"k": "Utfordring"
			},
			{
				"t": "Hva er det dyreste du har kjøpt til deg selv «i bursdagsgave»? Svar – eller drikk to.",
				"k": "Sannhet"
			},
			{
				"t": "Skål for kaken – eller for at det ikke ble noen. Den som skulle ta med kake, drikker uansett.",
				"k": "Skål"
			},
			{
				"t": "Bursdagsbarnet forteller om sin verste bursdag noensinne. Alle som var der, drikker.",
				"k": "Bursdagsbarnet"
			},
			{
				"t": "Alle som har kranglet med bursdagsbarnet om noe helt uviktig, drikker. Fortsatt uenige: drikk to.",
				"k": "Drikk hvis"
			},
			{
				"t": "Pek på den som kommer til å legge ut flest bilder fra i kveld. Den med flest pekere drikker – og lover å spørre før hen poster.",
				"k": "Pek"
			},
			{
				"t": "Spå hvordan bursdagsbarnet har det om ti år – jobb, bosted og én dårlig vane. Beste spådom deler ut to.",
				"k": "Utfordring"
			},
			{
				"t": "Bursdagsbarnet gir én slurk til alle som ikke har sagt gratulerer ennå i kveld.",
				"k": "Bursdagsbarnet"
			},
			{
				"t": "Alle som har skrevet «gratulerer!» i en gruppechat uten å vite hvem som hadde bursdag, drikker.",
				"k": "Drikk hvis"
			},
			{
				"t": "Hva er én ting du har lært av bursdagsbarnet? Svar – eller drikk to.",
				"k": "Sannhet"
			},
			{
				"t": "Skål for alle som har tatt seg fri, reist langt eller kommet rett fra jobb for å være her i kveld!",
				"k": "Skål"
			},
			{
				"t": "Den som kom sist i kveld, drikker to. Den som kom først, deler ut to.",
				"k": "Del ut"
			},
			{
				"t": "Bursdagsbarnet velger en sang. Alle synger med på refrenget – den som ikke kan teksten, drikker.",
				"k": "Bursdagsbarnet"
			},
			{
				"t": "Alle som har bodd sammen med bursdagsbarnet, drikker – og avslører én av bursdagsbarnets vaner.",
				"k": "Drikk hvis"
			},
			{
				"t": "Fortell én ting om bursdagsbarnet som du tror ingen andre her vet – noe snilt. Visste noen det, drikk to.",
				"k": "Utfordring"
			},
			{
				"t": "Hva er det mest desperate du har gjort for å skjule at du glemte noens bursdag? Svar – eller drikk to.",
				"k": "Sannhet"
			},
			{
				"t": "Skål for at bursdagsbarnet har de beste årene foran seg – og den beste kvelden i kveld.",
				"k": "Skål"
			},
			{
				"t": "Ny regel: Den som nevner alderen til bursdagsbarnet, drikker. Bursdagsbarnet selv drikker dobbelt.",
				"k": "Regel"
			},
			{
				"t": "Pek på den som ville planlagt den beste overraskelsesfesten for bursdagsbarnet. Vinneren deler ut tre.",
				"k": "Pek"
			},
			{
				"t": "Gjett hvor gammel bursdagsbarnet blir – i måneder. Nærmest deler ut tre.",
				"k": "Utfordring"
			},
			{
				"t": "Hvilken alder har vært den beste for deg så langt – og hvorfor? Svar – eller drikk to.",
				"k": "Sannhet"
			},
			{
				"t": "Den som har bursdag nærmest etter bursdagsbarnet, deler ut tre – og arrangerer neste fest.",
				"k": "Del ut"
			}
		]
	}
};
var sosial_default = {
	hvemskrev: [
		"Det eneste du alltid har i kjøleskapet",
		"Kebabbestillingen din klokka tre om natta",
		"Det du alltid ender opp med å kjøpe på Vinmonopolet",
		"Låta du setter på når du får tak i høyttaleren",
		"Ordet du bruker altfor mye",
		"Det første tegnet på at du begynner å bli full",
		"Det du gjør dagen derpå for å bli et menneske igjen",
		"Det du er mest snobbete på",
		"Det du er overraskende gjerrig på",
		"Det mest forfengelige du gjør",
		"Det du dømmer folk for i hemmelighet",
		"Noe du kan snakke om i en time uten forberedelse",
		"Den mest ubrukelige tingen du kan utenat",
		"Noe du er uforståelig dårlig på",
		"Noe du er altfor konkurranseinnstilt på",
		"En regel du har for deg selv som ingen andre skjønner",
		"Gjemmestedet ditt på fest når du trenger en pause",
		"Den egentlige grunnen til at du kom i kveld",
		"Antall uleste e-poster i innboksen din akkurat nå",
		"Det du egentlig gjør på hjemmekontoret mellom ett og to",
		"Noe du har sagt at du skal begynne med «etter nyttår»",
		"Den mest pensjonistaktige tingen du gjør",
		"Teksten på bilskiltet ditt, hvis du fikk velge fritt",
		"Den verste matkombinasjonen du elsker",
		"Drinken du bestiller når du vil virke voksen",
		"Yrket du hadde valgt hvis du startet helt på nytt i morgen",
		"Noe du er stolt av som ingen andre bryr seg om",
		"Det første du ville forbudt på et vors",
		"Det du sier til deg selv i speilet før du går ut",
		"Det rareste som står i notatappen din",
		"Det rareste du har i lomma eller veska akkurat nå",
		"Karaokelåta di",
		"Dansemoven din når den rette låta kommer på",
		"Tatoveringen du ville tatt hvis du måtte ta en i kveld",
		"Den verste gaven du har fått",
		"Det du gjør når du får en lydmelding på fire minutter",
		"Noe alle elsker som du synes er overvurdert",
		"Noe du ikke klarer å kaste",
		"Appen du bruker mest og skammer deg litt over",
		"Det du ville gjort i Syden som du aldri ville gjort hjemme",
		"Tida du egentlig bruker på å gjøre deg klar før en fest",
		"Det mamma eller pappa heter i kontaktlista di",
		"Det siste du leste om på Wikipedia midt på natta",
		"Den viktigste jobben din på en fest",
		"Det du tror folk tenker om deg første gang de møter deg",
		"En lukt du elsker som alle andre hater",
		"Det du gjør mens noen synger bursdagssangen for deg",
		"Det du har altfor mange av i klesskapet",
		"Det du alltid maser om at alle må se",
		"Det du er mest overtroisk på"
	],
	bloff: [
		{
			"q": "Hva er Skottlands nasjonaldyr?",
			"a": "Enhjørningen"
		},
		{
			"q": "Hvor mange hjerter har en blekksprut?",
			"a": "Tre"
		},
		{
			"q": "Hva ble Coca-Cola opprinnelig solgt som?",
			"a": "Medisin"
		},
		{
			"q": "Hva kalles en flokk flamingoer på engelsk?",
			"a": "A flamboyance"
		},
		{
			"q": "Hvilket land har flest innsjøer i verden?",
			"a": "Canada"
		},
		{
			"q": "Hva het Google før det het Google?",
			"a": "BackRub"
		},
		{
			"q": "Hvor lenge varte den korteste krigen i historien?",
			"a": "Rundt 38 minutter"
		},
		{
			"q": "Hvilken farge har isbjørnens hud?",
			"a": "Svart"
		},
		{
			"q": "Hva kalles redselen for lange ord?",
			"a": "Hippopotomonstrosesquippedaliofobi"
		},
		{
			"q": "Hvilket land fant opp ostehøvelen?",
			"a": "Norge"
		},
		{
			"q": "Hva ble bindersen et symbol på i Norge under andre verdenskrig?",
			"a": "Motstand mot okkupasjonen"
		},
		{
			"q": "Hvilket dyr har firkantet bæsj?",
			"a": "Vombaten"
		},
		{
			"q": "Hva kalles plastbiten ytterst på en skolisse?",
			"a": "Aglett"
		},
		{
			"q": "Hvilket dyr står på Wales' flagg?",
			"a": "En rød drage"
		},
		{
			"q": "Hvilken fugl kan fly baklengs?",
			"a": "Kolibrien"
		},
		{
			"q": "Hvilken planet roterer motsatt vei av de fleste andre?",
			"a": "Venus"
		},
		{
			"q": "Hvor mange øyne har en honningbie?",
			"a": "Fem"
		},
		{
			"q": "Hva er verdens dyreste krydder?",
			"a": "Safran"
		},
		{
			"q": "Hvor mange bein har en hummer?",
			"a": "Ti"
		},
		{
			"q": "Hvilken amerikansk delstat har bare én stavelse i navnet?",
			"a": "Maine"
		},
		{
			"q": "Hvor kommer Tetris-melodien fra?",
			"a": "En russisk folkesang"
		},
		{
			"q": "Hvilket dyr kan ikke kaste opp?",
			"a": "Hesten"
		},
		{
			"q": "Hvor i kroppen sitter kroppens minste bein?",
			"a": "I øret"
		},
		{
			"q": "Hva betyr navnet LEGO?",
			"a": "Lek godt (på dansk)"
		},
		{
			"q": "Hvilket land har flest pyramider?",
			"a": "Sudan"
		},
		{
			"q": "Hvilken farge hadde gulrøtter før de ble oransje?",
			"a": "Lilla"
		},
		{
			"q": "Hvilket dyr har verdens sterkeste bitt?",
			"a": "Saltvannskrokodillen"
		},
		{
			"q": "Hva er Norges nasjonalinstrument?",
			"a": "Hardingfela"
		},
		{
			"q": "Hvilken by var Norges hovedstad før Oslo?",
			"a": "Bergen"
		},
		{
			"q": "Hvilket pattedyr legger egg?",
			"a": "Nebbdyret"
		},
		{
			"q": "Hvilket land har flest tidssoner (med alle territorier)?",
			"a": "Frankrike"
		},
		{
			"q": "Hva het den første sauen som ble klonet?",
			"a": "Dolly"
		},
		{
			"q": "Hvilken frukt er egentlig et bær: banan eller jordbær?",
			"a": "Banan"
		},
		{
			"q": "Hvilket dyr har blått blod?",
			"a": "Blekkspruten"
		},
		{
			"q": "Hvilket hav er verdens største?",
			"a": "Stillehavet"
		},
		{
			"q": "Hvilken bokstav finnes ikke i navnet til noen amerikansk delstat?",
			"a": "Q"
		},
		{
			"q": "Hvilken by får et juletre fra Oslo hvert år som takk for hjelpen under krigen?",
			"a": "London"
		},
		{
			"q": "Hvor mange tangenter har et vanlig piano?",
			"a": "88"
		}
	],
	samme: [
		"Noe man roper i taxikøen",
		"Den beste pizzatoppingen",
		"En ting alle har i skuffa med rot",
		"Noe man finner i et kjøleskap",
		"Appen man åpner først om morgenen",
		"Det første man gjør når man våkner bakfull",
		"Ukedagen alle gleder seg til",
		"Det verste å tråkke på",
		"Den klassiske fredagsmiddagen",
		"En supermarkedkjede",
		"Drinken man angrer mest på",
		"Noe som alltid er tomt i et kollektiv",
		"En kjent nordmann med skjegg",
		"Den beste datingappen",
		"Pølse med …",
		"Noe man alltid leter etter",
		"Det man snakker om når man ikke har noe å snakke om",
		"Noe som alltid forsvinner fra jobbkjøkkenet",
		"Noe som er gult",
		"Emojien man sender når man ikke vet hva man skal svare",
		"Det beste pålegget",
		"Svaret man sender når man ikke gidder å svare ordentlig",
		"Den kjedeligste sporten",
		"Det første man kjøper på Syden-ferie",
		"Noe man alltid glemmer igjen på hytta",
		"Den beste plassen i sofaen",
		"Gaven man alltid får til jul",
		"Noe man alltid har med på søndagstur",
		"Låta alle synger med på klokka to om natta",
		"Noe man tar med seg hjem fra jobben",
		"Sausen som passer til alt",
		"Et ord som rimer på «øl»",
		"Den vanligste unnskyldningen for å komme for sent",
		"Strømmetjenesten man bruker på noen andres innlogging",
		"Det verste dyret",
		"Noe man tar med til verten",
		"Den mest norske tingen som finnes",
		"Det som ligger på stolen på soverommet",
		"Noe man kjøper på Vinmonopolet",
		"Et klassisk sted for en første date",
		"Det man bestiller i baren når man ikke klarer å bestemme seg",
		"Noe man alltid sier at man skal begynne med",
		"Et kallenavn på bestemor",
		"Det første man pakker til ferien",
		"Måneden med flest fester",
		"Det man egentlig gjør med kameraet av i et Teams-møte",
		"En klassisk unnskyldning for ikke å svare på en melding",
		"Den første man plukker fra Twist-posen",
		"Noe man roper på fotballkamp",
		"Det første man rydder bort etter en fest",
		"En film alle har sett",
		"Noe som kommer i posten og som ingen vil ha",
		"Det som står på bordet på julaften",
		"Den verste måten å bli dumpet på",
		"Et land alle har vært i",
		"Det første man ser etter når man kommer på fest",
		"Noe som er altfor dyrt",
		"Noe man spiser i påska",
		"Den klassiske hyttemiddagen",
		"Det nordmenn gjør på søndager"
	],
	oppdrag: [
		"Få {navn} til å si ordet «faktisk».",
		"Få {navn} til å skåle for noe helt meningsløst, som tirsdager.",
		"Få {navn} til å gi deg en high five.",
		"Få {navn} til å avsløre sin første e-postadresse.",
		"Få {navn} til å bytte plass med deg.",
		"Få {navn} til å si «hæ?» tre ganger.",
		"Få {navn} til å fortelle hvor hen var på sommerferie som 12-åring.",
		"Få {navn} til å holde glasset ditt.",
		"Få {navn} til å forklare deg offside-regelen.",
		"Få {navn} til å avsløre stjernetegnet sitt.",
		"Få {navn} til å kalle deg «sjef».",
		"Få {navn} til å stå på ett bein.",
		"Få {navn} til å si «jeg er enig med deg».",
		"Få {navn} til å fortelle hvor mange uleste e-poster hen har.",
		"Få {navn} til å herme etter et dyr.",
		"Få {navn} til å si ordet «sykt».",
		"Få {navn} til å nevne tre ting som står i kjøleskapet hjemme.",
		"Få {navn} til å si en hel setning på en annen dialekt enn sin egen.",
		"Få {navn} til å fortelle hva det ble til middag i går.",
		"Få {navn} til å si «skål» på et annet språk.",
		"Få {navn} til å tegne noe til deg på en serviett.",
		"Få {navn} til å vinke til deg fra andre siden av rommet.",
		"Få {navn} til å fortelle om den verste jobben sin.",
		"Få {navn} til å forklare deg hvordan man laster oppvaskmaskinen riktig.",
		"Få {navn} til å gjette alderen din.",
		"Få {navn} til å forklare deg hva en situationship er.",
		"Få {navn} til å synge en linje fra en julesang.",
		"Få {navn} til å skru opp musikken.",
		"Få {navn} til å avsløre toppartisten sin på Spotify Wrapped.",
		"Få {navn} til å si unnskyld til deg for noe hen ikke har gjort.",
		"Få {navn} til å si ordet «banan».",
		"Få {navn} til å fortelle om sin første konsert.",
		"Få {navn} til å foreslå en dato for en hyttetur med deg.",
		"Få {navn} til å ta et bilde av deg med telefonen din.",
		"Få {navn} til å gi deg et datingråd.",
		"Få {navn} til å spille luftgitar.",
		"Få {navn} til å gi deg et kompliment.",
		"Få {navn} til å foreslå hvor festen skal fortsette.",
		"Få {navn} til å fortelle en vits.",
		"Få {navn} til å fortelle hvor skoene er kjøpt.",
		"Få {navn} til å fortelle om den rareste gaven hen har fått.",
		"Få {navn} til å vise deg en dansebevegelse.",
		"Få {navn} til å låne deg noe – en penn, en strikk eller en lader.",
		"Få {navn} til å fortelle om sitt dummeste kjøp på nett.",
		"Få {navn} til å si ordet «pingvin».",
		"Få {navn} til å spå hvem som blir sist igjen i kveld.",
		"Få {navn} til å love å sende deg en oppskrift.",
		"Få {navn} til å fortelle om sin aller første mobil.",
		"Få {navn} til å anbefale deg det beste kebabstedet i byen.",
		"Få {navn} til å bestemme hva du skal ha på deg i morgen."
	],
	steder: [
		"Hytta på fjellet",
		"Syden-charter",
		"Russebussen",
		"Julebordet",
		"Legevakten",
		"Vinmonopolet en fredag",
		"Et fly til Alicante",
		"Kinosalen",
		"Studentkollektivet",
		"En fotballkamp",
		"Tannlegen",
		"Treningssenteret",
		"IKEA en lørdag",
		"Et bryllup",
		"Konfirmasjonen",
		"Nachspielet",
		"Bussen hjem",
		"Festivalen",
		"Campingplassen",
		"Frisøren",
		"Eksamenslokalet",
		"Karaokebaren",
		"Båten i skjærgården",
		"Hurtigruten",
		"Sykehuset",
		"Svømmehallen",
		"Skiheisen",
		"Kebabsjappa klokka tre",
		"Politistasjonen",
		"Et første date"
	],
	ord: [
		"Elvis",
		"Kong Harald",
		"Pingvin",
		"Julenissen",
		"Taco",
		"Ola Nordmann",
		"Brunost",
		"Donald Duck",
		"Hurtigruten",
		"Batman",
		"Snømann",
		"Sjørøver",
		"Astronaut",
		"Dronning Maud",
		"Mjølner",
		"Harry Potter",
		"Troll",
		"Pølse i lompe",
		"Gollum",
		"Ronaldo",
		"Hello Kitty",
		"Kaptein Sabeltann",
		"Beyoncé",
		"Viking",
		"Dinosaur",
		"Shrek",
		"Mario",
		"Pippi Langstrømpe",
		"Kjøttkake",
		"Taylor Swift",
		"Frosken",
		"Spiderman",
		"Karius",
		"Bestemor",
		"Einstein",
		"Rudolf",
		"Kamel",
		"Isbjørn",
		"Snoop Dogg",
		"Nissen på låven"
	]
};
var pluss_en_default = {
	julebord: /* @__PURE__ */ JSON.parse("{\"navn\":\"Christmas Party\",\"om\":\"For the office Christmas party, the holiday pre-game and the Santa party. Safe to play with coworkers – but never boring.\",\"items\":[{\"t\":\"Everyone who has talked for a whole minute before someone said “you're on mute”, drink.\",\"k\":\"Drink if\"},{\"t\":\"Point at whoever says “I'll keep this short” and then talks for ten minutes. Whoever gets the most fingers drinks.\",\"k\":\"Point\"},{\"t\":\"Explain your job the way you would to your gran on Christmas Day. If the table doesn't get it, drink two.\",\"k\":\"Challenge\"},{\"t\":\"Everyone who has microwaved fish at work, drink. Your colleagues haven't forgotten.\",\"k\":\"Drink if\"},{\"t\":\"A toast to all the office plants that didn't survive the year.\",\"k\":\"Cheers\"},{\"t\":\"Everyone who has signed off with just “Regards” and meant it passive-aggressively, drink.\",\"k\":\"Drink if\"},{\"t\":\"Point at whoever is most likely to slip away tonight without a goodbye. Whoever gets the most fingers drinks now – while they still can.\",\"k\":\"Point\"},{\"t\":\"Give a 20-second speech on why this is the best Christmas party ever. Get through it without laughing and give out three.\",\"k\":\"Challenge\"},{\"t\":\"Tell us your most embarrassing work moment this year – or drink three.\",\"k\":\"Truth\"},{\"t\":\"Cheers to whoever carries the most work without ever getting the credit.\",\"k\":\"Cheers\"},{\"t\":\"New rule: everyone points with their elbow. Use a finger and drink.\",\"k\":\"Rule\"},{\"t\":\"Whoever has been at the company the longest gives out three.\",\"k\":\"Give out\"},{\"t\":\"Everyone who has hit “Reply all” on something meant for just one person, drink.\",\"k\":\"Drink if\"},{\"t\":\"Point at whoever will be buying their Christmas presents on Christmas Eve. Whoever gets the most fingers drinks.\",\"k\":\"Point\"},{\"t\":\"Do your best impression of the Teams ringtone. The table votes – not convincing enough, drink.\",\"k\":\"Challenge\"},{\"t\":\"Which bit of work jargon have you started using at home? Say it – or drink two.\",\"k\":\"Truth\"},{\"t\":\"Cheers to IT, who've turned everything we broke this year off and on again.\",\"k\":\"Cheers\"},{\"t\":\"New rule: everyone has to say “Merry Christmas” before they drink. Forget and drink another.\",\"k\":\"Rule\"},{\"t\":\"Whoever travelled the furthest to be here tonight gives out three.\",\"k\":\"Give out\"},{\"t\":\"Everyone who has been on a Teams call in a smart shirt and joggers, drink.\",\"k\":\"Drink if\"},{\"t\":\"Point at whoever always has snacks in their desk drawer. The winner gives out three.\",\"k\":\"Point\"},{\"t\":\"Give the person on your left a LinkedIn recommendation – out loud and completely straight-faced. Laugh and you drink.\",\"k\":\"Challenge\"},{\"t\":\"What's the strangest thing you've done working from home with the camera off? Tell us – or drink two.\",\"k\":\"Truth\"},{\"t\":\"Cheers to the people who organised tonight. Without you, we'd all be sitting at home.\",\"k\":\"Cheers\"},{\"t\":\"New rule: address everyone by job title – “Pass the salt, Head of HR?” Forget and drink.\",\"k\":\"Rule\"},{\"t\":\"Whoever has worked the most overtime this year gives out four. Well earned.\",\"k\":\"Give out\"},{\"t\":\"Everyone who has booked a fake meeting in their calendar just to be left alone, drink.\",\"k\":\"Drink if\"},{\"t\":\"Point at whoever looks like they have strong opinions on how to load a dishwasher. Whoever gets the most fingers drinks.\",\"k\":\"Point\"},{\"t\":\"Make up your Christmas out-of-office – out loud and brutally honest. If the table laughs, give out two.\",\"k\":\"Challenge\"},{\"t\":\"What's on your CV that you can really only sort of do? Answer – or drink two.\",\"k\":\"Truth\"},{\"t\":\"Cheers to everyone who's new this year – welcome to the gang!\",\"k\":\"Cheers\"},{\"t\":\"New rule: raise your hand before you speak, just like on Teams. Forget and drink.\",\"k\":\"Rule\"},{\"t\":\"Whoever has the birthday closest to Christmas gives out three.\",\"k\":\"Give out\"},{\"t\":\"Everyone who has brought shop-bought cake to work and let people think it was homemade, drink.\",\"k\":\"Drink if\"},{\"t\":\"Point at whoever is most likely to still be wearing the Santa hat in the taxi home. Whoever gets the most fingers drinks.\",\"k\":\"Point\"},{\"t\":\"Name everyone at the table. Miss one and drink two.\",\"k\":\"Challenge\"},{\"t\":\"Round the table: everyone shares the strangest Secret Santa gift they've ever got. Whoever got the strangest gives out three.\",\"k\":\"Truth\"},{\"t\":\"Cheers to whoever always refills the coffee machine – and never gets thanked.\",\"k\":\"Cheers\"},{\"t\":\"New rule: nobody says “work” until the next rule card. Say it and drink.\",\"k\":\"Rule\"},{\"t\":\"Whoever has the most holiday left this year gives out three. The rest of us want to know how.\",\"k\":\"Give out\"},{\"t\":\"Everyone who has a mug at work that nobody else is allowed to use, drink.\",\"k\":\"Drink if\"},{\"t\":\"Point at whoever is most likely to go home in the wrong coat tonight. Whoever gets the most fingers drinks.\",\"k\":\"Point\"},{\"t\":\"Name five of Santa's reindeer in ten seconds – or drink two.\",\"k\":\"Challenge\"},{\"t\":\"What was your first impression of the person on your right? Say it – or drink two.\",\"k\":\"Truth\"},{\"t\":\"Cheers to everyone working between Christmas and New Year – you're the real Santas.\",\"k\":\"Cheers\"},{\"t\":\"New rule: check your work email before the next rule card and you drink two.\",\"k\":\"Rule\"},{\"t\":\"Whoever has the most Christmas decorations at home gives out three. Photo evidence required!\",\"k\":\"Give out\"},{\"t\":\"Everyone who read the party invite just to check the menu, drink.\",\"k\":\"Drink if\"},{\"t\":\"Point at whoever is most likely to answer work emails over Christmas. Whoever gets the most fingers drinks – and turns off notifications.\",\"k\":\"Point\"},{\"t\":\"Round the table: everyone says a bit of work jargon no outsider would understand. Whoever gets stuck drinks.\",\"k\":\"Challenge\"},{\"t\":\"What's the most pointless meeting you've ever sat through? Tell us – no names – or drink two.\",\"k\":\"Truth\"},{\"t\":\"Cheers to everyone who's said “I can take that one” – and regretted it the same second.\",\"k\":\"Cheers\"},{\"t\":\"New rule: “cheers” is now “thanks for a great collaboration”. Say “cheers” and drink.\",\"k\":\"Rule\"},{\"t\":\"Whoever has been to the most Christmas parties this year gives out three.\",\"k\":\"Give out\"},{\"t\":\"Everyone who still doesn't know what half their colleagues actually do, drink.\",\"k\":\"Drink if\"},{\"t\":\"Point at whoever has taken the most photos tonight. Whoever gets the most fingers shows the best one – or drinks two.\",\"k\":\"Point\"},{\"t\":\"Hum a Christmas song. The first to guess it gives out two.\",\"k\":\"Challenge\"},{\"t\":\"What's the funniest thing you've seen at a Christmas party? No names. Tell us – or drink two.\",\"k\":\"Truth\"},{\"t\":\"Cheers to cake Friday – the most important meeting of the week.\",\"k\":\"Cheers\"},{\"t\":\"New rule: every request must start with “as per my last email”. Forget and drink.\",\"k\":\"Rule\"},{\"t\":\"Everyone who has bought themselves a Christmas present “by accident”, drink.\",\"k\":\"Drink if\"},{\"t\":\"Point at whoever knows every single verse once the carols start. The winner gives out three.\",\"k\":\"Point\"},{\"t\":\"Finish the sentence “Next year I'm going to …”. The table votes – not believable, drink.\",\"k\":\"Challenge\"},{\"t\":\"Which colleague would you most like to be stuck in a lift with for three hours? Answer – or drink two.\",\"k\":\"Truth\"},{\"t\":\"Cheers to the boss! If the boss is here, the boss makes a speech – ten seconds, tops.\",\"k\":\"Cheers\"},{\"t\":\"Everyone who has bought their Secret Santa gift at a petrol station that same morning, drink.\",\"k\":\"Drink if\"},{\"t\":\"Point at whoever spends triple the Secret Santa limit. Whoever gets the most fingers drinks.\",\"k\":\"Point\"},{\"t\":\"Say “Merry Christmas” in as many languages as you can in ten seconds. Fewer than three, drink.\",\"k\":\"Challenge\"},{\"t\":\"Which Christmas present have you swapped without the giver knowing? Answer – or drink two.\",\"k\":\"Truth\"},{\"t\":\"Everyone who has told a colleague “we must grab a pint soon” without meaning it, drink.\",\"k\":\"Drink if\"},{\"t\":\"Point at whoever is most likely to google something mid-argument tonight just to win. Whoever gets the most fingers drinks.\",\"k\":\"Point\"},{\"t\":\"Pitch an idea for next year's Christmas party in 15 seconds. The table votes: yes = give out three, no = drink.\",\"k\":\"Challenge\"},{\"t\":\"Everyone who's off for the whole week after Christmas, drink. Everyone else, toast enviously.\",\"k\":\"Drink if\"},{\"t\":\"Point at whoever has the best Christmas jumper tonight. The winner gives out three.\",\"k\":\"Point\"},{\"t\":\"Compose the most passive-aggressive office-kitchen note you can – out loud. Make the table laugh and give out three.\",\"k\":\"Challenge\"},{\"t\":\"Everyone who has said “I'm only having one” tonight, drink.\",\"k\":\"Drink if\"},{\"t\":\"Point at whoever you can hear laughing from the other side of the open-plan office. The winner gives out three.\",\"k\":\"Point\"},{\"t\":\"Read out the subject line of the last work email you sent – in your most dramatic voice. Or drink two.\",\"k\":\"Challenge\"},{\"t\":\"Everyone who thinks turkey is the worst bit of Christmas dinner, drink. Turkey fans, shake your heads.\",\"k\":\"Drink if\"},{\"t\":\"Point at whoever is most likely to drag the whole table onto the dance floor. The winner gives out three.\",\"k\":\"Point\"},{\"t\":\"Defend Brussels sprouts for 20 seconds. Convince nobody and drink two.\",\"k\":\"Challenge\"},{\"t\":\"Everyone who has opened their advent calendar ahead of schedule this year, drink.\",\"k\":\"Drink if\"},{\"t\":\"Everyone who has quietly cheated at a family board game over Christmas, drink.\",\"k\":\"Drink if\"},{\"t\":\"Everyone who was playing Christmas music before November this year, drink.\",\"k\":\"Drink if\"},{\"t\":\"Everyone who has sent an email at 11 p.m. just so the boss would see the timestamp, drink.\",\"k\":\"Drink if\"},{\"t\":\"Everyone who has walked straight past a printer flashing red, drink.\",\"k\":\"Drink if\"},{\"t\":\"Everyone who has turned back at the door because someone else was at the coffee machine, drink.\",\"k\":\"Drink if\"},{\"t\":\"Everyone who has switched tabs at lightning speed when the boss walked past, drink.\",\"k\":\"Drink if\"},{\"t\":\"Everyone who has said “I'll take a look at it” and never did, drink.\",\"k\":\"Drink if\"},{\"t\":\"Everyone who has been quietly annoyed that someone took “their” seat at lunch, drink.\",\"k\":\"Drink if\"},{\"t\":\"Everyone who has sprinted to the kitchen after a “leftover sandwiches in the kitchen!” email, drink.\",\"k\":\"Drink if\"},{\"t\":\"Everyone who has replied with a thumbs-up to get out of writing a proper answer, drink.\",\"k\":\"Drink if\"},{\"t\":\"Everyone who has nodded along to an acronym in a meeting with no idea what it meant, drink.\",\"k\":\"Drink if\"},{\"t\":\"Everyone who has forgotten a colleague's name and avoided saying it for six months, drink.\",\"k\":\"Drink if\"},{\"t\":\"Everyone who has had mince pies from the office kitchen for lunch, drink.\",\"k\":\"Drink if\"}]}"),
	vill: {
		"navn": "Wild",
		"om": "For the crew who know each other well and can handle almost anything. 18+.",
		"items": [
			{
				"t": "Everyone who has been in a group chat about someone in this room, drink.",
				"k": "Drink if"
			},
			{
				"t": "Point at whoever looks the most innocent but definitely isn't. Whoever gets the most fingers drinks.",
				"k": "Point"
			},
			{
				"t": "Who here would you call at 4 a.m. – and who would you never call? Answer – or drink three.",
				"k": "Truth"
			},
			{
				"t": "Everyone who has woken up to a payment from last night they can't explain, drink.",
				"k": "Drink if"
			},
			{
				"t": "Show the last screenshot you took – or drink three.",
				"k": "Challenge"
			},
			{
				"t": "Everyone who has sent “You up?” after midnight, drink.",
				"k": "Drink if"
			},
			{
				"t": "Point at the most convincing liar here. Whoever gets the most fingers tells their best lie – or drinks three.",
				"k": "Point"
			},
			{
				"t": "What's the biggest lie you've ever told this group? Tell us – or drink three.",
				"k": "Truth"
			},
			{
				"t": "Read out the last message you sent to a crush – in your best newsreader voice. Or drink three.",
				"k": "Challenge"
			},
			{
				"t": "New rule: end every sentence with “… in bed”. Forget and drink.",
				"k": "Rule"
			},
			{
				"t": "Everyone who has been dumped by text gives out two. You've suffered enough.",
				"k": "Give out"
			},
			{
				"t": "Everyone drinks. If you've kissed someone in this room, drink two. No questions asked.",
				"k": "Everyone"
			},
			{
				"t": "Cheers to all the bad decisions that turned into great stories.",
				"k": "Cheers"
			},
			{
				"t": "Everyone who has unsent a drunk text before the other person could read it, drink.",
				"k": "Drink if"
			},
			{
				"t": "Point at whoever has the worst ideas at 3 a.m. Whoever gets the most fingers drinks.",
				"k": "Point"
			},
			{
				"t": "Say who here you think talks about you the most. If they admit it, they drink – if not, you drink.",
				"k": "Truth"
			},
			{
				"t": "Have a staring contest with the person opposite you – using your most seductive look. First to laugh drinks.",
				"k": "Challenge"
			},
			{
				"t": "New rule: nobody says “ex”. Say it and drink two.",
				"k": "Rule"
			},
			{
				"t": "Whoever has hosted the most afterparties this year gives out three. Thanks for having us.",
				"k": "Give out"
			},
			{
				"t": "Everyone who has used a dating profile photo that's more than three years old, drink.",
				"k": "Drink if"
			},
			{
				"t": "Point at whoever has the most screenshots of other people's messages. Whoever gets the most fingers drinks.",
				"k": "Point"
			},
			{
				"t": "What's the dumbest thing you've done drunk? The group votes – if it's too boring, drink three.",
				"k": "Truth"
			},
			{
				"t": "Give the person on your left your best flirty compliment – if they're up for it. A blush means you give out three. A laugh means you drink.",
				"k": "Challenge"
			},
			{
				"t": "New rule: whoever says “drunk”, “tipsy” or “wasted” drinks.",
				"k": "Rule"
			},
			{
				"t": "Whoever got home latest last weekend gives out three.",
				"k": "Give out"
			},
			{
				"t": "Everyone who has stalked their ex's new partner while terrified of accidentally liking an old photo, drink.",
				"k": "Drink if"
			},
			{
				"t": "Point at whoever says “just one drink” and is the last to leave the afterparty. Whoever gets the most fingers drinks.",
				"k": "Point"
			},
			{
				"t": "What's the worst excuse you've used to get out of staying the night? Tell us – or drink three.",
				"k": "Truth"
			},
			{
				"t": "Do your best impression of someone here when they're drunk. If the others guess who, give out three. If not, drink.",
				"k": "Challenge"
			},
			{
				"t": "New rule: everyone drinks with their other hand. Forget and drink another.",
				"k": "Rule"
			},
			{
				"t": "Everyone who googled someone here before meeting them tonight, drink.",
				"k": "Drink if"
			},
			{
				"t": "Point at whoever is most likely to vanish with someone before 2 a.m. tonight. Whoever gets the most fingers drinks.",
				"k": "Point"
			},
			{
				"t": "What's the most embarrassing thing you've bought online while drunk? Tell us – or drink three.",
				"k": "Truth"
			},
			{
				"t": "Let the group write you a new dating profile in 20 seconds. Read it out with a straight face – or drink three.",
				"k": "Challenge"
			},
			{
				"t": "Pick a drinking buddy. Every time you drink until the next rule card, they drink too.",
				"k": "Rule"
			},
			{
				"t": "Everyone who has slept with an ex “just one last time”, drink.",
				"k": "Drink if"
			},
			{
				"t": "Point at whoever is worst at keeping a secret. Whoever gets the most fingers drinks two.",
				"k": "Point"
			},
			{
				"t": "What's the worst chat-up line you've actually used? Say it – or drink three.",
				"k": "Truth"
			},
			{
				"t": "Tell a drunk story in 30 seconds with one detail that's a lie. If the group spots it, drink.",
				"k": "Challenge"
			},
			{
				"t": "Everyone who has walked home on a Sunday morning in last night's outfit, drink.",
				"k": "Drink if"
			},
			{
				"t": "Point at whoever would most likely date someone just for their holiday home. Whoever gets the most fingers drinks.",
				"k": "Point"
			},
			{
				"t": "What's the pettiest thing you've done after a break-up? Tell us – or drink three.",
				"k": "Truth"
			},
			{
				"t": "Talk about your ex for 30 seconds without saying anything negative. Can't manage it? Drink.",
				"k": "Challenge"
			},
			{
				"t": "Everyone who has had a regular hook-up they've never once had dinner with, drink.",
				"k": "Drink if"
			},
			{
				"t": "Point at whoever says “I'll pay you back” and never does. Whoever gets the most fingers settles up now – or drinks three.",
				"k": "Point"
			},
			{
				"t": "Who in this group have you been most envious of – and why? Answer – or drink three.",
				"k": "Truth"
			},
			{
				"t": "Say three things you like about the person on your right – and one habit of theirs that annoys you. Or drink three.",
				"k": "Challenge"
			},
			{
				"t": "Everyone who has been interrupted by a flatmate coming home too early, drink.",
				"k": "Drink if"
			},
			{
				"t": "Point at whoever most likely has an ex in every part of town. Whoever gets the most fingers drinks.",
				"k": "Point"
			},
			{
				"t": "What's the most awkward thing that's happened to you on a one-night stand? Tell us – or drink three.",
				"k": "Truth"
			},
			{
				"t": "Review your last date in ten seconds – with a star rating. Or drink three.",
				"k": "Challenge"
			},
			{
				"t": "Everyone who has lied about how much they earn, drink.",
				"k": "Drink if"
			},
			{
				"t": "Point at the most dangerous person to go out with when you've got an early start. Whoever gets the most fingers drinks.",
				"k": "Point"
			},
			{
				"t": "Everyone who has turned down plans with someone here and then been caught out on Instagram somewhere else, drink.",
				"k": "Drink if"
			},
			{
				"t": "Point at whoever has the most chaotic dating life. Whoever gets the most fingers shares the latest episode – or drinks three.",
				"k": "Point"
			},
			{
				"t": "Everyone who has let their parents pay for something this year they really should've covered themselves, drink.",
				"k": "Drink if"
			},
			{
				"t": "Everyone who has sent a photo and regretted it the second it said “seen”, drink.",
				"k": "Drink if"
			},
			{
				"t": "Everyone who has woken up next to a kebab they don't remember buying, drink.",
				"k": "Drink if"
			},
			{
				"t": "Everyone who has borrowed the host's bedroom at a party, drink.",
				"k": "Drink if"
			},
			{
				"t": "Everyone who has read a partner's messages without asking, drink.",
				"k": "Drink if"
			}
		]
	},
	"bli-kjent": {
		"navn": "Icebreaker",
		"om": "For freshers’ week, a new flatshare or the first party with new people. Nobody needs to know anyone yet.",
		"items": [
			{
				"t": "Everyone who has gone in for a handshake while the other person went for a hug, drink. If it ended in a high five, drink two.",
				"k": "Drink if"
			},
			{
				"t": "New rule: “what do you study?” and “what do you do?” are banned. Whoever asks drinks.",
				"k": "Rule"
			},
			{
				"t": "Point at whoever seems most likely to set up the group chat after tonight. The winner gives out three.",
				"k": "Point"
			},
			{
				"t": "Whoever’s reading: say the name of everyone round the table and one thing you know about each. Get them all and give out three. Miss any and drink two.",
				"k": "Challenge"
			},
			{
				"t": "Cheers to the host! Anyone who doesn’t know the host’s surname drinks an extra one.",
				"k": "Cheers"
			},
			{
				"t": "Everyone who has said they live “just outside the city” about somewhere two hours away, drink.",
				"k": "Drink if"
			},
			{
				"t": "What’s the weirdest summer job you’ve ever had? Answer – or drink two.",
				"k": "Truth"
			},
			{
				"t": "Point at whoever you think has the best story about how they ended up here tonight. Whoever gets the most fingers tells it – or drinks two.",
				"k": "Point"
			},
			{
				"t": "Swap seats with whoever you’ve talked to least tonight. Ask each other one question before the next card – or you both drink.",
				"k": "Challenge"
			},
			{
				"t": "Everyone who has said “sorry, what?” three times and then just nodded and smiled, drink.",
				"k": "Drink if"
			},
			{
				"t": "New rule: before you drink, say the name of the person on your left. Wrong name: drink another.",
				"k": "Rule"
			},
			{
				"t": "Which app would you be most embarrassed for someone to see in your screen time? Answer – or drink two.",
				"k": "Truth"
			},
			{
				"t": "Everyone who has introduced themselves to the same person twice at one party, drink. If it happened tonight, drink two.",
				"k": "Drink if"
			},
			{
				"t": "You and the person on your right have ten seconds to find something you both hate. Manage it and cheers. If not, drink one each.",
				"k": "Challenge"
			},
			{
				"t": "If you all shared a flat: point at whoever would buy the loo roll without asking anyone to pay them back. The winner gives out three.",
				"k": "Point"
			},
			{
				"t": "Whoever grew up furthest north gives out three. Whoever grew up furthest south drinks one.",
				"k": "Give out"
			},
			{
				"t": "Everyone who has turned up to a party too early and walked round the block to kill time, drink.",
				"k": "Drink if"
			},
			{
				"t": "What did you buy with your very first pay cheque? Answer – or drink two.",
				"k": "Truth"
			},
			{
				"t": "Guess where the person on your left grew up. Right region: give out two. Right town: give out four. Wrong: drink one.",
				"k": "Challenge"
			},
			{
				"t": "Everyone who has been at a party where the only person they knew left first, drink.",
				"k": "Drink if"
			},
			{
				"t": "Cheers to everyone who came tonight knowing just one person – you know more now!",
				"k": "Cheers"
			},
			{
				"t": "Point at whoever seems to know someone everywhere. Whoever gets the most fingers names someone they know in Lisbon – or drinks.",
				"k": "Point"
			},
			{
				"t": "What’s the best decision you’ve ever made after a few drinks? Answer – or drink two.",
				"k": "Truth"
			},
			{
				"t": "Everyone who has made a new best friend in the queue for the loo at a party, drink.",
				"k": "Drink if"
			},
			{
				"t": "Everyone with a different accent from whoever’s reading: say “I’m just popping to the shop” in your accent. The best one gives out three.",
				"k": "Challenge"
			},
			{
				"t": "New rule: every time someone says your name, raise your glass. Forget and you drink.",
				"k": "Rule"
			},
			{
				"t": "Everyone who has danced all night with someone without ever finding out their name, drink.",
				"k": "Drink if"
			},
			{
				"t": "Point at whoever would definitely put their hand up just as the lecturer says “that’s all for today”. Whoever gets the most fingers drinks.",
				"k": "Point"
			},
			{
				"t": "What’s the coolest thing you’ve pretended you could do – on your CV or on a date? Answer – or drink two.",
				"k": "Truth"
			},
			{
				"t": "Show the last song you played. If the table finds it embarrassing, drink two. If someone else has it on a playlist, cheers with them.",
				"k": "Challenge"
			},
			{
				"t": "Everyone who has already followed someone here on Instagram tonight, drink.",
				"k": "Drink if"
			},
			{
				"t": "Round: everyone says their name and one thing they’re good at that nobody would guess. The best one gives out three.",
				"k": "Everyone"
			},
			{
				"t": "Point at whoever seems like they’ve never camped at a festival. Whoever gets the most fingers drinks – or tells us about their first.",
				"k": "Point"
			},
			{
				"t": "Everyone who has lived somewhere so small they could reach the fridge from bed, drink.",
				"k": "Drink if"
			},
			{
				"t": "Learn the name of whoever’s sitting furthest from you. On the next card, cheers with them and say their name. Forget it: drink two.",
				"k": "Challenge"
			},
			{
				"t": "What’s your most unpopular food opinion? Answer – whoever disagrees most drinks.",
				"k": "Truth"
			},
			{
				"t": "Whoever had the most recent birthday gives out two. Whoever’s birthday is coming up next drinks one – in advance.",
				"k": "Give out"
			},
			{
				"t": "Everyone who knows their neighbour’s cat’s name but not their neighbour’s, drink.",
				"k": "Drink if"
			},
			{
				"t": "Point at whoever you think studies or works in something completely different from everyone else. Whoever gets the most fingers says what – and gives out two.",
				"k": "Point"
			},
			{
				"t": "Cheers to student loans – the only ones who have ever truly believed in us.",
				"k": "Cheers"
			},
			{
				"t": "Make up a secret handshake with the person on your right: a high five, a sound and a move. If the table likes it, you each give out two.",
				"k": "Challenge"
			},
			{
				"t": "New rule: check your phone and you have to tell the table what you were checking – or drink two.",
				"k": "Rule"
			},
			{
				"t": "Everyone who has got through a whole holiday on “thank you”, “beer” and pointing, drink.",
				"k": "Drink if"
			},
			{
				"t": "Which song makes you sing at the top of your voice when you’re alone in the car? Answer – or drink two.",
				"k": "Truth"
			},
			{
				"t": "Point at whoever you think has been to the most gigs this year. Whoever gets the most fingers names the best one – and gives out two.",
				"k": "Point"
			},
			{
				"t": "Find something in this room that says a lot about the host. Explain why in ten seconds. The funniest explanation gives out two.",
				"k": "Challenge"
			},
			{
				"t": "Everyone who has been asked for a fun fact about themselves and gone completely blank, drink.",
				"k": "Drink if"
			},
			{
				"t": "New rule: you can only ask questions to people you didn’t know before tonight. Ask someone you already knew and you drink.",
				"k": "Rule"
			},
			{
				"t": "What flatmate habit has made you move out – or nearly? Answer – or drink two.",
				"k": "Truth"
			},
			{
				"t": "Cheers to whoever turned up first tonight – they got to see the host in joggers.",
				"k": "Cheers"
			},
			{
				"t": "Everyone who has said “we should hang out!” to someone they never saw again, drink.",
				"k": "Drink if"
			},
			{
				"t": "Point at whoever has talked to the most new people tonight. The winner gives out three.",
				"k": "Point"
			},
			{
				"t": "Guess the star sign of the person on your left. Right: give out three. Wrong: drink one – and hear why that’s so typical.",
				"k": "Challenge"
			},
			{
				"t": "What’s the most overrated thing about where you grew up? Answer – or drink two.",
				"k": "Truth"
			},
			{
				"t": "Everyone who puts pineapple on pizza, drink – and explain yourselves.",
				"k": "Drink if"
			},
			{
				"t": "Ask the person on your right about the worst place they’ve ever lived. Retell it to the table in 20 seconds. Good story: give out two.",
				"k": "Challenge"
			},
			{
				"t": "Whoever has the fewest unread emails gives out three. Whoever has the most drinks one per thousand – up to three.",
				"k": "Give out"
			},
			{
				"t": "Point at whoever seems like the type to say hello to everyone they pass on a Sunday walk. The winner gives out two.",
				"k": "Point"
			},
			{
				"t": "Everyone says cheers in a different language or accent. The most convincing one gives out two.",
				"k": "Cheers"
			},
			{
				"t": "What’s the best thing you’ve ever bought second-hand – and the worst? Answer – or drink two.",
				"k": "Truth"
			},
			{
				"t": "New rule: drinks in your left hand only. Get caught with it in your right and you drink – and say the name of whoever caught you.",
				"k": "Rule"
			},
			{
				"t": "Give the person on your left a nickname based on something they’ve told you tonight. If they like it, give out two. If not, drink one.",
				"k": "Challenge"
			},
			{
				"t": "Round: everyone says what song they’d put on next. The table votes – the winner goes on, and whoever suggested it gives out two.",
				"k": "Everyone"
			},
			{
				"t": "Everyone who has said “I’m terrible with names” tonight, drink. Ask again – it’s allowed.",
				"k": "Drink if"
			}
		]
	},
	hyttetur: {
		"navn": "Cabin Trip",
		"om": "For the crew at the cabin – from Friday arrival to the Sunday clean-up. Some rules last all weekend.",
		"items": [
			{
				"t": "Everyone who has used an outdoor loo by headtorch with the door ajar, drink.",
				"k": "Drink if"
			},
			{
				"t": "Point at whoever always dodges the washing-up. Whoever gets the most fingers drinks – and does it tomorrow.",
				"k": "Point"
			},
			{
				"t": "Weekend rule: whoever says the word “cabin” for the rest of the trip drinks. Yes, it’s going to be hard.",
				"k": "Weekend rule"
			},
			{
				"t": "Cheers to whoever planned this trip! Anyone who never replied in the group chat about it drinks an extra one.",
				"k": "Cheers"
			},
			{
				"t": "Do an impression of a noise the cabin makes at night. If the table guesses what it is, give out two. If not, drink one.",
				"k": "Challenge"
			},
			{
				"t": "Everyone who forgot something that was on the packing list, drink. If it was your sleeping bag, drink two.",
				"k": "Drink if"
			},
			{
				"t": "Point at whoever claimed the double bed before anyone else had their shoes off. Whoever gets the most fingers drinks.",
				"k": "Point"
			},
			{
				"t": "What’s the worst thing you’ve ever forgotten to bring on a cabin trip? Answer – or drink two.",
				"k": "Truth"
			},
			{
				"t": "Everyone who has paid into the kitty and is still waiting to be paid back, drink – on the kitty.",
				"k": "Drink if"
			},
			{
				"t": "Everyone who has slept in a bunk bed and banged their head on the ceiling in the morning, drink.",
				"k": "Drink if"
			},
			{
				"t": "Write a new house rule for the cabin in the guestbook – or on a note on the fridge. If the table likes it, give out three.",
				"k": "Challenge"
			},
			{
				"t": "Everyone who has ever explained a word in a guessing game by saying the word itself, drink.",
				"k": "Drink if"
			},
			{
				"t": "Point at whoever will fall asleep first tonight – probably on the sofa with their coat on. Whoever gets the most fingers drinks.",
				"k": "Point"
			},
			{
				"t": "Whoever carried the most in from the car gives out three.",
				"k": "Give out"
			},
			{
				"t": "Everyone who has promised to get up early for a hike – and didn’t, drink.",
				"k": "Drink if"
			},
			{
				"t": "New rule: everyone talks about themselves in the third person. Forget and you drink.",
				"k": "Rule"
			},
			{
				"t": "Tell us about the worst cabin trip you’ve ever been on – no names. Answer – or drink two.",
				"k": "Truth"
			},
			{
				"t": "Point at whoever will be up first tomorrow making breakfast for everyone. The winner gives out three.",
				"k": "Point"
			},
			{
				"t": "Everyone who packed more beer than clothes, drink.",
				"k": "Drink if"
			},
			{
				"t": "Weekend rule: whoever takes the last cup of coffee without making more drinks two.",
				"k": "Weekend rule"
			},
			{
				"t": "Give a 20-second weather forecast for tomorrow – in your most dramatic voice. If the table approves, give out two.",
				"k": "Challenge"
			},
			{
				"t": "Everyone who has slept on an airbed that was flat by morning, drink.",
				"k": "Drink if"
			},
			{
				"t": "Point at whoever cheats at board games and calls it “strategy”. Whoever gets the most fingers drinks.",
				"k": "Point"
			},
			{
				"t": "Cheers to cabin peace! Everyone puts their phone in the middle of the table until the next card. First to grab theirs drinks two.",
				"k": "Cheers"
			},
			{
				"t": "Everyone who has spent ten minutes trying to light the fire and ended up with a room full of smoke, drink.",
				"k": "Drink if"
			},
			{
				"t": "What’s the most pointless thing you packed for this trip? Show us – or drink two.",
				"k": "Truth"
			},
			{
				"t": "Point at whoever is guaranteed to say “we should do this more often” at some point this weekend. Whoever gets the most fingers drinks.",
				"k": "Point"
			},
			{
				"t": "Guess how many empty bottles are in the kitchen right now. Closest gives out two; furthest off clears them away.",
				"k": "Challenge"
			},
			{
				"t": "Everyone who has flicked through a cabin guestbook and read out an entry from 1997, drink.",
				"k": "Drink if"
			},
			{
				"t": "Weekend rule: whoever gets up first tomorrow picks their seat in the car home. No arguments.",
				"k": "Weekend rule"
			},
			{
				"t": "Whoever has been to this cabin the most times gives out one for each visit – up to five.",
				"k": "Give out"
			},
			{
				"t": "Everyone who has arrived to find the off-licence shut an hour ago, drink – if there’s anything left.",
				"k": "Drink if"
			},
			{
				"t": "Point at whoever packed like you were going away for three weeks. Whoever gets the most fingers drinks.",
				"k": "Point"
			},
			{
				"t": "Build a tower out of things on the table – no glasses – in 30 seconds. If it stands for five seconds, give out three.",
				"k": "Challenge"
			},
			{
				"t": "Everyone who has fallen over on skis and claimed it was on purpose, drink.",
				"k": "Drink if"
			},
			{
				"t": "Which cabin tradition from childhood do you miss – and which are you glad is gone? Answer – or drink two.",
				"k": "Truth"
			},
			{
				"t": "New rule: everyone talks quietly, as if the neighbours in the next cabin are asleep. Whoever gets loud drinks.",
				"k": "Rule"
			},
			{
				"t": "Point at whoever has done the most driving – and the least drinking – on cabin trips over the years. The winner gives out four.",
				"k": "Point"
			},
			{
				"t": "Everyone who has worn earplugs on a cabin trip because of someone in this room, drink.",
				"k": "Drink if"
			},
			{
				"t": "Weekend rule: whoever snores tonight makes breakfast. The burden of proof lies with whoever lay awake.",
				"k": "Weekend rule"
			},
			{
				"t": "Put on the most cabin-ish thing you can find – wool socks, an anorak or a beanie – and keep it on until the next card. Refuse and drink two.",
				"k": "Challenge"
			},
			{
				"t": "Everyone who brought their work laptop “just in case”, drink.",
				"k": "Drink if"
			},
			{
				"t": "Cheers to the cabin owner – and to being invited back. Anyone who’s broken something here drinks an extra one.",
				"k": "Cheers"
			},
			{
				"t": "Point at whoever has sent a photo of the view to the family group chat today. Whoever gets the most fingers drinks.",
				"k": "Point"
			},
			{
				"t": "Mountains or seaside – and what’s your silliest argument for it? Answer – or drink two.",
				"k": "Truth"
			},
			{
				"t": "Everyone who has hunted for signal with their phone held up over their head, drink.",
				"k": "Drink if"
			},
			{
				"t": "Pick an object in this room. Everyone else gets five yes/no questions. If they don’t guess it, give out two.",
				"k": "Challenge"
			},
			{
				"t": "Weekend rule: whoever loses a board game writes a guestbook entry on behalf of the winner.",
				"k": "Weekend rule"
			},
			{
				"t": "Everyone who has eaten a chocolate bar on a hike and said “it just tastes better up here”, drink.",
				"k": "Drink if"
			},
			{
				"t": "Whoever did the food shop gives out three. Whoever has only eaten it drinks one.",
				"k": "Give out"
			},
			{
				"t": "Point at whoever will be first to suggest “one more round” of cards at 3 a.m. Whoever gets the most fingers drinks.",
				"k": "Point"
			},
			{
				"t": "What’s the most embarrassing thing that’s happened to you on a cabin trip – that you can tell here? Answer – or drink two.",
				"k": "Truth"
			},
			{
				"t": "Everyone who has driven to a cabin with the wrong address in the sat nav, drink.",
				"k": "Drink if"
			},
			{
				"t": "New rule: whoever goes to the loo has to announce “just popping out to check the weather”. Forget and you drink.",
				"k": "Rule"
			},
			{
				"t": "Write a five-item packing list for the next trip – no phone. Forget loo roll and drink two.",
				"k": "Challenge"
			},
			{
				"t": "Point at whoever has a packing list – in their notes app or laminated. Whoever gets the most fingers gives out three.",
				"k": "Point"
			},
			{
				"t": "Everyone who has gone on a “quick” cabin trip and stayed an extra day, drink.",
				"k": "Drink if"
			},
			{
				"t": "Weekend rule: shoes off indoors. Anyone caught in shoes drinks – and mops the floor.",
				"k": "Weekend rule"
			},
			{
				"t": "Cheers to the kitty – may it balance on Sunday. Whoever’s keeping track gives out three.",
				"k": "Cheers"
			},
			{
				"t": "Do an impression of a cabin owner giving the tour: “and this is the fuse box …”. Nail it and give out two.",
				"k": "Challenge"
			},
			{
				"t": "Point at whoever takes longest in the bathroom in the morning – at a cabin with one bathroom. Whoever gets the most fingers drinks.",
				"k": "Point"
			},
			{
				"t": "If you got snowed in for a week, who here becomes the leader – and who starts a mutiny? Answer – or drink two.",
				"k": "Truth"
			},
			{
				"t": "Whoever walked furthest today gives out one per kilometre – up to four.",
				"k": "Give out"
			},
			{
				"t": "Weekend rule: whoever goes to bed last tonight brings in the firewood tomorrow.",
				"k": "Weekend rule"
			}
		]
	},
	bursdag: {
		"navn": "Birthday",
		"om": "For the birthday pre-party: the birthday person takes centre stage, and everyone hears the best stories.",
		"items": [
			{
				"t": "Everyone who bought the present on the way here, drink.",
				"k": "Drink if"
			},
			{
				"t": "The birthday person picks tonight’s DJ. Anyone who changes the song without permission drinks.",
				"k": "Birthday person"
			},
			{
				"t": "Give a 20-second speech for the birthday person – without saying “happy birthday” or “amazing”. Pull it off and give out three.",
				"k": "Challenge"
			},
			{
				"t": "Point at whoever definitely forgot to buy a card. Whoever gets the most fingers drinks – and writes one on a napkin.",
				"k": "Point"
			},
			{
				"t": "New rule: the birthday person doesn’t pour their own drinks. If anyone sees it happen, whoever was sitting closest drinks.",
				"k": "Rule"
			},
			{
				"t": "Everyone who has known the birthday person for more than ten years, drink. More than twenty: drink two.",
				"k": "Drink if"
			},
			{
				"t": "The birthday person says who here they’ve known longest. You cheers – and that person shares their first memory of the two of you.",
				"k": "Birthday person"
			},
			{
				"t": "What did you think of the birthday person when you first met – and when did that change? Answer – or drink two.",
				"k": "Truth"
			},
			{
				"t": "Everyone who met the birthday person for the first time tonight, drink – welcome!",
				"k": "Drink if"
			},
			{
				"t": "Cheers to the birthday person with a booming “hip hip hooray”. Whoever shouts quietest drinks an extra one.",
				"k": "Cheers"
			},
			{
				"t": "Point at whoever is going to give a speech nobody asked for later tonight. Whoever gets the most fingers drinks – and practises.",
				"k": "Point"
			},
			{
				"t": "The birthday person brings in a law for the rest of the night – and is the only one exempt from it. Break it: drink.",
				"k": "Birthday person"
			},
			{
				"t": "Everyone who has wrapped a present in newspaper or a carrier bag because they forgot wrapping paper, drink.",
				"k": "Drink if"
			},
			{
				"t": "Tell us how you met the birthday person – in ten seconds. Good story: give out two. If not, drink one.",
				"k": "Challenge"
			},
			{
				"t": "Everyone who has forgotten the birthday person’s birthday at least once, drink. If it was this year, drink two.",
				"k": "Drink if"
			},
			{
				"t": "Birthday person: name the best thing that’s happened to you in the past year. Everyone who was part of it, cheers.",
				"k": "Birthday person"
			},
			{
				"t": "What’s the worst present you’ve ever received – and did you say thank you? Answer – or drink two.",
				"k": "Truth"
			},
			{
				"t": "Point at whoever has been to the most of the birthday person’s birthdays. Whoever gets the most fingers gives out one per birthday – up to five.",
				"k": "Point"
			},
			{
				"t": "Everyone who has had a voice note over two minutes long from the birthday person, drink.",
				"k": "Drink if"
			},
			{
				"t": "Find someone you didn’t know before tonight and find out how they know the birthday person. Introduce them to the table – manage it and give out two.",
				"k": "Challenge"
			},
			{
				"t": "The birthday person points at whoever knows them best. Three questions from the birthday person: all right, give out three. Otherwise drink three.",
				"k": "Birthday person"
			},
			{
				"t": "Cheers to all the other birthdays we forgot this year.",
				"k": "Cheers"
			},
			{
				"t": "Everyone who has said “I’m too old for this” this year, drink – and join in anyway.",
				"k": "Drink if"
			},
			{
				"t": "Which story about the birthday person gets told at every single party? Tell it – or drink two.",
				"k": "Truth"
			},
			{
				"t": "The birthday person skips their drink on the next card – and can give it to whoever they like.",
				"k": "Birthday person"
			},
			{
				"t": "Point at whoever has definitely scrolled through the birthday person’s old photos looking for an embarrassing one. Whoever gets the most fingers drinks.",
				"k": "Point"
			},
			{
				"t": "Everyone who has blown out the candles on someone else’s cake, drink.",
				"k": "Drink if"
			},
			{
				"t": "Make up a two-line birthday rhyme about the birthday person – it has to rhyme with “cake”. If they approve, give out three.",
				"k": "Challenge"
			},
			{
				"t": "The birthday person picks two people who didn’t know each other before tonight. They’re drinking buddies until the next card: if one drinks, both drink.",
				"k": "Birthday person"
			},
			{
				"t": "Everyone who has asked for “nothing” for their birthday and been disappointed to get exactly that, drink.",
				"k": "Drink if"
			},
			{
				"t": "Cheers to the guests who didn’t know each other before tonight – and soon will.",
				"k": "Cheers"
			},
			{
				"t": "Point at whoever has given the birthday person the best present ever. The winner gives out three.",
				"k": "Point"
			},
			{
				"t": "The table guesses what the birthday person wants most right now. The birthday person decides – the right guess gives out three.",
				"k": "Birthday person"
			},
			{
				"t": "Everyone who has started the birthday song in the wrong key and never recovered, drink.",
				"k": "Drink if"
			},
			{
				"t": "What’s the weirdest thing you’ve ever done on a birthday? Answer – or drink two.",
				"k": "Truth"
			},
			{
				"t": "Sing the birthday song like an opera singer or a metal vocalist – the birthday person chooses. Refuse and drink two.",
				"k": "Challenge"
			},
			{
				"t": "The birthday person crowns tonight’s best outfit. The winner gives out three.",
				"k": "Birthday person"
			},
			{
				"t": "Everyone who has a photo of the birthday person on their phone that they don’t know about, drink.",
				"k": "Drink if"
			},
			{
				"t": "New rule: say “happy birthday” every time you speak to the birthday person. Forget and you drink.",
				"k": "Rule"
			},
			{
				"t": "Point at whoever is bound to get emotional during the speeches tonight. Whoever gets the most fingers drinks – and finds the tissues.",
				"k": "Point"
			},
			{
				"t": "The birthday person does an impression of someone in this room. If the table guesses who within ten seconds, that person drinks.",
				"k": "Birthday person"
			},
			{
				"t": "Everyone who has been to an afterparty with the birthday person that lasted until breakfast, drink.",
				"k": "Drink if"
			},
			{
				"t": "Show the oldest photo you’ve got of the birthday person. The oldest one gives out three – the birthday person has a veto.",
				"k": "Challenge"
			},
			{
				"t": "What’s the most expensive thing you’ve bought yourself “as a birthday present”? Answer – or drink two.",
				"k": "Truth"
			},
			{
				"t": "Cheers to the cake – or to there being no cake. Whoever was meant to bring it drinks either way.",
				"k": "Cheers"
			},
			{
				"t": "The birthday person tells us about their worst birthday ever. Anyone who was there drinks.",
				"k": "Birthday person"
			},
			{
				"t": "Everyone who has argued with the birthday person about something completely trivial, drink. Still disagree: drink two.",
				"k": "Drink if"
			},
			{
				"t": "Point at whoever will post the most photos from tonight. Whoever gets the most fingers drinks – and promises to ask before posting.",
				"k": "Point"
			},
			{
				"t": "Predict the birthday person’s life in ten years – job, home and one bad habit. The best prediction gives out two.",
				"k": "Challenge"
			},
			{
				"t": "The birthday person gives a sip to everyone who hasn’t said happy birthday yet tonight.",
				"k": "Birthday person"
			},
			{
				"t": "Everyone who has written “happy birthday!” in a group chat without knowing whose birthday it was, drink.",
				"k": "Drink if"
			},
			{
				"t": "What’s one thing you’ve learned from the birthday person? Answer – or drink two.",
				"k": "Truth"
			},
			{
				"t": "Cheers to everyone who took time off, travelled far or came straight from work to be here tonight!",
				"k": "Cheers"
			},
			{
				"t": "Whoever arrived last tonight drinks two. Whoever arrived first gives out two.",
				"k": "Give out"
			},
			{
				"t": "The birthday person picks a song. Everyone sings the chorus – anyone who doesn’t know the words drinks.",
				"k": "Birthday person"
			},
			{
				"t": "Everyone who has lived with the birthday person, drink – and reveal one of their habits.",
				"k": "Drink if"
			},
			{
				"t": "Share one thing about the birthday person you think nobody else here knows – something nice. If someone already knew, drink two.",
				"k": "Challenge"
			},
			{
				"t": "What’s the most desperate thing you’ve done to cover up forgetting someone’s birthday? Answer – or drink two.",
				"k": "Truth"
			},
			{
				"t": "Cheers to the birthday person’s best years still being ahead – and the best night being tonight.",
				"k": "Cheers"
			},
			{
				"t": "New rule: anyone who mentions the birthday person’s age drinks. The birthday person drinks double.",
				"k": "Rule"
			},
			{
				"t": "Point at whoever would plan the best surprise party for the birthday person. The winner gives out three.",
				"k": "Point"
			},
			{
				"t": "Guess how old the birthday person is turning – in months. Closest gives out three.",
				"k": "Challenge"
			},
			{
				"t": "Which age has been your best so far – and why? Answer – or drink two.",
				"k": "Truth"
			},
			{
				"t": "Whoever’s birthday comes next after the birthday person’s gives out three – and hosts the next party.",
				"k": "Give out"
			}
		]
	}
};
var sosial_en_default = {
	hvemskrev: [
		"The one thing that's always in your fridge",
		"Your 3 a.m. kebab order",
		"What you always end up buying at the off-licence",
		"The song you put on the moment you get hold of the speaker",
		"The word you use way too much",
		"The first sign that you're getting drunk",
		"What you do the morning after to feel human again",
		"The thing you're most snobbish about",
		"The thing you're surprisingly stingy about",
		"The vainest thing you do",
		"What you secretly judge people for",
		"Something you could talk about for an hour with zero preparation",
		"The most useless thing you know by heart",
		"Something you're inexplicably bad at",
		"Something you're way too competitive about",
		"A personal rule of yours that nobody else understands",
		"Your hiding spot at a party when you need a break",
		"The real reason you came tonight",
		"The number of unread emails in your inbox right now",
		"What you actually do between one and two when working from home",
		"Something you've said you'll start “after New Year”",
		"The most pensioner-like thing you do",
		"What your personalised number plate would say",
		"The worst food combo you secretly love",
		"The drink you order when you want to seem grown-up",
		"The job you'd pick if you could start over tomorrow",
		"Something you're proud of that nobody else cares about",
		"The first thing you'd ban at pre-drinks",
		"What you tell yourself in the mirror before a night out",
		"The weirdest thing in your notes app",
		"The weirdest thing in your pocket or bag right now",
		"Your go-to karaoke song",
		"Your signature dance move when the right song comes on",
		"The tattoo you'd get if you had to get one tonight",
		"The worst present you've ever been given",
		"What you do when someone sends you a four-minute voice note",
		"Something everyone loves that you think is overrated",
		"Something you can't bring yourself to throw away",
		"The app you use most and are slightly ashamed of",
		"Something you'd do on a beach holiday that you'd never do at home",
		"How long it really takes you to get ready for a night out",
		"What your mum or dad is saved as in your phone",
		"The last thing you read about on Wikipedia in the middle of the night",
		"Your most important job at a party",
		"What you think people assume about you when they first meet you",
		"A smell you love that everyone else hates",
		"What you do while people sing “Happy Birthday” to you",
		"What you've got far too many of in your wardrobe",
		"The thing you keep telling everyone they have to watch",
		"The thing you're most superstitious about"
	],
	bloff: [
		{
			"q": "What is Scotland's national animal?",
			"a": "The unicorn"
		},
		{
			"q": "How many hearts does an octopus have?",
			"a": "Three"
		},
		{
			"q": "What was Coca-Cola originally sold as?",
			"a": "Medicine"
		},
		{
			"q": "What is a group of flamingos called?",
			"a": "A flamboyance"
		},
		{
			"q": "Which country has the most lakes in the world?",
			"a": "Canada"
		},
		{
			"q": "What was Google called before it was called Google?",
			"a": "BackRub"
		},
		{
			"q": "How long did the shortest war in history last?",
			"a": "About 38 minutes"
		},
		{
			"q": "What colour is a polar bear's skin?",
			"a": "Black"
		},
		{
			"q": "What is the fear of long words called?",
			"a": "Hippopotomonstrosesquippedaliophobia"
		},
		{
			"q": "Which country invented the cheese slicer?",
			"a": "Norway"
		},
		{
			"q": "During World War II, what did Norwegians wear paper clips as a symbol of?",
			"a": "Resistance against the Nazi occupation"
		},
		{
			"q": "Which animal has cube-shaped poop?",
			"a": "The wombat"
		},
		{
			"q": "What is the plastic tip at the end of a shoelace called?",
			"a": "An aglet"
		},
		{
			"q": "What animal is on the flag of Wales?",
			"a": "A red dragon"
		},
		{
			"q": "Which bird can fly backwards?",
			"a": "The hummingbird"
		},
		{
			"q": "Which planet spins the opposite way to most of the others?",
			"a": "Venus"
		},
		{
			"q": "How many eyes does a honeybee have?",
			"a": "Five"
		},
		{
			"q": "What is the world's most expensive spice?",
			"a": "Saffron"
		},
		{
			"q": "How many legs does a lobster have?",
			"a": "Ten"
		},
		{
			"q": "Which US state has only one syllable in its name?",
			"a": "Maine"
		},
		{
			"q": "Where does the Tetris theme come from?",
			"a": "A Russian folk song"
		},
		{
			"q": "Which animal can't throw up?",
			"a": "The horse"
		},
		{
			"q": "Where in the body is the smallest bone?",
			"a": "In the ear"
		},
		{
			"q": "What does the name LEGO mean?",
			"a": "“Play well” (from the Danish “leg godt”)"
		},
		{
			"q": "Which country has the most pyramids?",
			"a": "Sudan"
		},
		{
			"q": "What colour were carrots before they were orange?",
			"a": "Purple"
		},
		{
			"q": "Which animal has the strongest bite in the world?",
			"a": "The saltwater crocodile"
		},
		{
			"q": "What is Norway's national instrument?",
			"a": "The Hardanger fiddle"
		},
		{
			"q": "Which city was Norway's capital before Oslo?",
			"a": "Bergen"
		},
		{
			"q": "Which mammal lays eggs?",
			"a": "The platypus"
		},
		{
			"q": "Which country has the most time zones (counting all its territories)?",
			"a": "France"
		},
		{
			"q": "What was the name of the first cloned sheep?",
			"a": "Dolly"
		},
		{
			"q": "Which fruit is actually a berry: the banana or the strawberry?",
			"a": "The banana"
		},
		{
			"q": "Which animal has blue blood?",
			"a": "The octopus"
		},
		{
			"q": "What is the largest ocean in the world?",
			"a": "The Pacific Ocean"
		},
		{
			"q": "Which letter doesn't appear in the name of any US state?",
			"a": "Q"
		},
		{
			"q": "Which city gets a Christmas tree from Oslo every year as thanks for its help during WWII?",
			"a": "London"
		},
		{
			"q": "How many keys does a standard piano have?",
			"a": "88"
		}
	],
	samme: [
		"Something people shout in the taxi queue",
		"The best pizza topping",
		"Something everyone has in their junk drawer",
		"Something you find in a fridge",
		"The first app you open in the morning",
		"The first thing you do when you wake up hungover",
		"The weekday everyone looks forward to",
		"The worst thing to step on",
		"The classic Friday night dinner",
		"A supermarket chain",
		"The drink you regret the most",
		"Something that's always run out in a shared flat",
		"A famous person with a beard",
		"The best dating app",
		"A hot dog with …",
		"Something you're always looking for",
		"What you talk about when there's nothing to talk about",
		"Something that always goes missing from the office kitchen",
		"Something yellow",
		"The emoji you send when you don’t know what to say",
		"The best sandwich filling",
		"The reply you send when you can't be bothered to reply properly",
		"The most boring sport",
		"The first thing you buy on a beach holiday",
		"Something you always leave behind at the cabin",
		"The best spot on the sofa",
		"The present you always get for Christmas",
		"Something you always pack for a Sunday hike",
		"The song everyone sings along to at 2 a.m.",
		"Something you take home from work",
		"The sauce that goes with everything",
		"A word that rhymes with “beer”",
		"The classic excuse for being late",
		"The streaming service you use on someone else's login",
		"The worst animal",
		"Something you bring for the host",
		"The most Scandinavian thing there is",
		"What's piled on the chair in your bedroom",
		"Something you buy at the off-licence",
		"A classic place for a first date",
		"What you order at the bar when you can’t decide",
		"Something you keep saying you'll start doing",
		"A nickname for your grandma",
		"The first thing you pack for a holiday",
		"The month with the most parties",
		"What you're really doing with your camera off in a Teams meeting",
		"A classic excuse for not replying to a message",
		"The first one you grab from a tin of chocolates",
		"Something people shout at a football match",
		"The first thing you clear away after a party",
		"A film everyone has seen",
		"Something that arrives in the post that nobody wants",
		"What's on the table for Christmas dinner",
		"The worst way to get dumped",
		"A country everyone has been to",
		"The first thing you look for when you arrive at a party",
		"Something that's far too expensive",
		"Something you eat at Easter",
		"The classic cabin dinner",
		"The classic way to spend a Sunday"
	],
	oppdrag: [
		"Get {navn} to say the word “actually”.",
		"Get {navn} to raise a toast to something pointless, like Tuesdays.",
		"Get {navn} to give you a high five.",
		"Get {navn} to reveal their very first email address.",
		"Get {navn} to swap seats with you.",
		"Get {navn} to say “what?” three times.",
		"Get {navn} to tell you where they went on summer holiday aged 12.",
		"Get {navn} to hold your drink for you.",
		"Get {navn} to explain the offside rule to you.",
		"Get {navn} to tell you their star sign.",
		"Get {navn} to call you “boss”.",
		"Get {navn} to stand on one leg.",
		"Get {navn} to say “I agree with you”.",
		"Get {navn} to tell you how many unread emails they have.",
		"Get {navn} to do an animal impression.",
		"Get {navn} to say the word “insane”.",
		"Get {navn} to name three things in their fridge at home.",
		"Get {navn} to say a whole sentence in a regional accent that isn't their own.",
		"Get {navn} to tell you what they had for dinner yesterday.",
		"Get {navn} to say “cheers” in another language.",
		"Get {navn} to draw you something on a napkin.",
		"Get {navn} to wave at you from across the room.",
		"Get {navn} to tell you about the worst job they've ever had.",
		"Get {navn} to explain the right way to load a dishwasher.",
		"Get {navn} to guess your age.",
		"Get {navn} to explain to you what a situationship is.",
		"Get {navn} to sing a line from a Christmas song.",
		"Get {navn} to turn the music up.",
		"Get {navn} to reveal their top artist on Spotify Wrapped.",
		"Get {navn} to apologise to you for something they didn't do.",
		"Get {navn} to say the word “banana”.",
		"Get {navn} to tell you about the first gig they went to.",
		"Get {navn} to suggest a date for a cabin trip with you.",
		"Get {navn} to take a photo of you on your phone.",
		"Get {navn} to give you a piece of dating advice.",
		"Get {navn} to play air guitar.",
		"Get {navn} to pay you a compliment.",
		"Get {navn} to suggest where the party should go next.",
		"Get {navn} to tell you a joke.",
		"Get {navn} to tell you where they got their shoes.",
		"Get {navn} to tell you about the weirdest present they've ever been given.",
		"Get {navn} to show you a dance move.",
		"Get {navn} to lend you something – a pen, a hair tie or a charger.",
		"Get {navn} to tell you about the dumbest thing they've bought online.",
		"Get {navn} to say the word “penguin”.",
		"Get {navn} to predict who'll be the last to leave tonight.",
		"Get {navn} to promise to send you a recipe.",
		"Get {navn} to tell you what their very first mobile phone was.",
		"Get {navn} to recommend the best late-night kebab in town.",
		"Get {navn} to decide what you're wearing tomorrow."
	],
	steder: [
		"Mountain cabin",
		"Package holiday in the sun",
		"Graduation party bus",
		"The office Christmas party",
		"The ER",
		"The liquor store on a Friday",
		"A flight to Alicante",
		"The cinema",
		"Student flatshare",
		"A football match",
		"The dentist",
		"The gym",
		"IKEA on a Saturday",
		"A wedding",
		"A confirmation party",
		"The afterparty",
		"The last bus home",
		"A music festival",
		"The campsite",
		"The hairdresser",
		"The exam hall",
		"The karaoke bar",
		"A boat in the archipelago",
		"A coastal cruise ship",
		"The hospital",
		"The swimming pool",
		"The ski lift",
		"The kebab shop at 3 a.m.",
		"The police station",
		"A first date"
	],
	ord: [
		"Elvis",
		"King Harald of Norway",
		"Penguin",
		"Santa Claus",
		"Taco",
		"Average Joe",
		"Swiss cheese",
		"Donald Duck",
		"Cruise ship",
		"Batman",
		"Snowman",
		"Pirate",
		"Astronaut",
		"Queen Elizabeth II",
		"Thor's hammer",
		"Harry Potter",
		"Troll",
		"Hot dog",
		"Gollum",
		"Ronaldo",
		"Hello Kitty",
		"Captain Jack Sparrow",
		"Beyoncé",
		"Viking",
		"Dinosaur",
		"Shrek",
		"Mario",
		"Pippi Longstocking",
		"Meatball",
		"Taylor Swift",
		"Kermit the Frog",
		"Spider-Man",
		"Tooth Fairy",
		"Grandma",
		"Einstein",
		"Rudolph the Red-Nosed Reindeer",
		"Camel",
		"Polar bear",
		"Snoop Dogg",
		"Christmas elf"
	]
};
//#endregion
//#region src/lib/rom.ts
/**
* Gruppekoder («rom»): flere telefoner i samme spill.
* All spillogikk kjører her på serveren. Nettleseren får bare det den skal se:
* ingen polletter, og hemmeligheter bare til spilleren de gjelder.
*/
var D = decks_default;
var B = bingo_default;
/** Engelske utgaver: samme struktur og rekkefølge (indeks i = oversettelse av indeks i). */
var DE = decks_en_default;
var BE = bingo_en_default;
/** Pluss-pakkene ligger bare på serveren – nettleseren får bare kortet som trekkes. */
var P = pluss_default;
var PE = pluss_en_default;
var PAKKER = Object.keys(P).map((id) => ({
	id: "pakke-" + id,
	pakke: id,
	navn: P[id].navn,
	om: P[id].om,
	antall: P[id].items.length,
	en: {
		navn: PE[id] && PE[id].navn || P[id].navn,
		om: PE[id] && PE[id].om || P[id].om
	}
}));
function rensLang(x) {
	return x === "en" ? "en" : "no";
}
function L(no, en) {
	return {
		no,
		en: en || no
	};
}
function erL(x) {
	return !!x && typeof x === "object" && !Array.isArray(x) && typeof x.no === "string" && typeof x.en === "string" && Object.keys(x).length === 2;
}
/** Velger språk for én tekst. Vanlige strenger (egne kort, gamle rom) vises som de er. */
function tr(x, lang = "no") {
	return erL(x) ? x[lang] || x.no : x;
}
/** Går gjennom et svar-objekt og bytter alle tospråklige tekster med riktig språk. */
function lok(x, lang) {
	if (x === null || typeof x !== "object") return x;
	if (Array.isArray(x)) return x.map((v) => lok(v, lang));
	if (erL(x)) return x[lang] || x.no;
	const ut = {};
	for (const k of Object.keys(x)) ut[k] = lok(x[k], lang);
	return ut;
}
/** Feilmelding på begge språk. API-ruta velger språket til den som trykket. */
function feilL(feil, no, en, ekstra = {}) {
	return {
		feil,
		melding: no,
		en,
		...ekstra
	};
}
function erPlussLek(lek) {
	return String(lek || "").startsWith("pakke-") || PLUSS_ROM.includes(String(lek || ""));
}
function romHarPluss(data) {
	return !!(data.pluss && data.pluss.til > Date.now());
}
function pakkeKort(id) {
	return P[id] ? P[id].items : null;
}
var KODETEGN = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function tilfeldig(n) {
	const a = /* @__PURE__ */ new Uint32Array(1);
	crypto.getRandomValues(a);
	return a[0] % n;
}
function stokk(xs) {
	const a = xs.slice();
	for (let i = a.length - 1; i > 0; i--) {
		const j = tilfeldig(i + 1);
		[a[i], a[j]] = [a[j], a[i]];
	}
	return a;
}
function nyKode() {
	let s = "";
	for (let i = 0; i < 4; i++) s += KODETEGN[tilfeldig(32)];
	return s;
}
function nyId() {
	const a = /* @__PURE__ */ new Uint8Array(6);
	crypto.getRandomValues(a);
	return Array.from(a, (x) => x.toString(16).padStart(2, "0")).join("");
}
function nyPollett() {
	const a = /* @__PURE__ */ new Uint8Array(18);
	crypto.getRandomValues(a);
	return Array.from(a, (x) => x.toString(16).padStart(2, "0")).join("");
}
function rensNavn(n) {
	return String(n || "").replace(/[\u0000-\u001f<>]/g, "").replace(/\s+/g, " ").trim().slice(0, 20);
}
var KORTLEKER = [
	"pekeleken",
	"jeg-har-aldri",
	"50-50",
	"kategorier",
	"tanken-bak-sangen",
	"sannhet-eller-drikk",
	"enten-eller",
	"nodt-eller-sannhet",
	"rygg-mot-rygg",
	"duoleken"
];
var NAVN_L = {
	"pekeleken": ["Pekeleken", "Most likely to"],
	"jeg-har-aldri": ["Jeg har aldri", "Never have I ever"],
	"enten-eller": ["Enten eller", "Would you rather"],
	"kategorier": ["Kategorier", "Categories"],
	"nodt-eller-sannhet": ["Nødt eller sannhet", "Truth or dare"],
	"sannhet-eller-drikk": ["Sannhet eller drikk", "Truth or drink"],
	"tanken-bak-sangen": ["Låtbekjennelsen", "Song confessions"],
	"rygg-mot-rygg": ["Rygg mot rygg", "Back to back"],
	"duoleken": ["Duoleken", "The couples game"],
	"50-50": ["50/50", "50/50"],
	"ring-of-fire": ["Ring of Fire", "Ring of Fire"],
	"forraeder": ["Løgnhalsen", "The liar"],
	"mest": ["Mest sannsynlig", "Most likely to (vote)"],
	"bingo": ["Drikke-bingo", "Drinking bingo"]
};
/** Lekene som kan spilles i rom, med navn, beskrivelse og moduser på valgt språk (standard norsk). */
function lekeliste(lang = "no") {
	return lekelisteRa(rensLang(lang)).map((l) => PLUSS_ROM.includes(l.id) ? {
		...l,
		pluss: true
	} : l);
}
function moduserFor(lek, lang) {
	const no = D[lek] ? D[lek].modes || [] : [];
	if (lang !== "en") return no;
	const en = DE[lek] ? DE[lek].modes || [] : [];
	return no.map((m, i) => ({
		...m,
		t: en[i] && en[i].v === m.v && en[i].t || (en.find((x) => x.v === m.v) || {}).t || m.t
	}));
}
function eraTittel(id, lang) {
	const no = B.eras.find((e) => e.id === id);
	if (lang !== "en") return no ? no.title : id;
	const en = BE.eras.find((e) => e.id === id);
	return en && en.title || (no ? no.title : id);
}
function lekelisteRa(lang) {
	const en = lang === "en";
	const nv = (id) => NAVN_L[id] ? NAVN_L[id][en ? 1 : 0] : id;
	const kort = KORTLEKER.filter((s) => D[s]).map((s) => ({
		id: s,
		navn: nv(s),
		type: "kort",
		moduser: moduserFor(s, lang)
	}));
	return [
		{
			id: "mest",
			navn: nv("mest"),
			type: "mest",
			moduser: moduserFor("pekeleken", lang),
			om: en ? "Everyone votes for who it fits best. Every vote is one sip." : "Alle stemmer på hvem det passer best på. Hver stemme er én slurk."
		},
		{
			id: "forraeder",
			navn: nv("forraeder"),
			type: "forraeder",
			moduser: moduserFor("forraeder", lang),
			om: en ? "One player is secretly told to lie or tell the truth. Everyone else votes." : "Én får i hemmelighet beskjed om å lyve eller si sannheten. Resten stemmer."
		},
		{
			id: "bingo",
			navn: nv("bingo"),
			type: "bingo",
			moduser: B.eras.map((e) => ({
				v: e.id,
				t: eraTittel(e.id, lang)
			})),
			om: en ? "Everyone gets their own board. The page calls it out when someone gets a line or bingo." : "Hver får sitt eget brett. Siden roper når noen får rekke eller bingo."
		},
		{
			id: "ring-of-fire",
			navn: nv("ring-of-fire"),
			type: "kort",
			moduser: [{
				v: "ring",
				t: en ? "🔥 The ring – pull the cards out" : "🔥 Ringen – dra ut kortene"
			}, {
				v: "enkel",
				t: en ? "Simple – tap for the next card" : "Enkel – trykk for neste kort"
			}],
			om: en ? "The cards lie in a ring around a glass. Spin the ring and pull a card out slowly – pull too hard and the ring breaks, and you finish your drink." : "Kortene ligger i en ring rundt et glass. Snurr ringen og dra ut et kort forsiktig – drar du for hardt, ryker ringen og du må drikke opp."
		},
		...ekstraLeker(lang),
		...kort.map((k) => ({
			...k,
			om: en ? "Everyone sees the same card. Anyone can draw the next one." : "Alle ser samme kort. Hvem som helst kan trekke neste."
		})),
		...PAKKER.map((p) => ({
			id: p.id,
			navn: en ? p.en.navn : p.navn,
			type: "kort",
			moduser: [],
			pluss: true,
			om: en ? p.en.om + " " + p.antall + " cards." : p.om + " " + p.antall + " kort."
		}))
	];
}
/** Navnet på en lek på begge språk (lagres i spill.navn). */
function lekNavnL(id) {
	const no = lekeliste("no").find((x) => x.id === id), en = lekeliste("en").find((x) => x.id === id);
	return no ? L(no.navn, en && en.navn) : id;
}
async function hentRom(kode) {
	const r = await rpc("rom_hent", { p_kode: kode });
	const rad = Array.isArray(r) ? r[0] : r;
	return rad ? {
		data: rad.data,
		versjon: rad.versjon
	} : null;
}
/** Leser, endrer og lagrer. Prøver igjen hvis en annen telefon lagret samtidig. */
async function endreRom(kode, endring) {
	for (let forsok = 0; forsok < 5; forsok++) {
		const rom = await hentRom(kode);
		if (!rom) return { feil: "finnes-ikke" };
		const data = structuredClone(rom.data);
		const svar = endring(data);
		if (svar && svar.feil && !svar.lagre) return svar;
		const ny = await rpc("rom_lagre", {
			p_kode: kode,
			p_versjon: rom.versjon,
			p_data: data
		});
		if (ny !== null && ny !== void 0) return svar && svar.feil ? svar : {
			data,
			versjon: ny,
			svar
		};
	}
	return { feil: "opptatt" };
}
async function lagRom(navn, lek = "", modus = "", lang = "no") {
	const vert = {
		id: nyId(),
		navn,
		pollett: nyPollett(),
		slurker: 0,
		lang: rensLang(lang)
	};
	const l = lek ? lekeliste().find((x) => x.id === lek) : null;
	const valgt = l ? {
		lek: l.id,
		modus: String(modus || "").slice(0, 20)
	} : null;
	const data = {
		laget: Date.now(),
		vert: vert.id,
		spillere: [vert],
		spill: null,
		hendelse: null,
		nr: 0,
		valgt
	};
	for (let i = 0; i < 6; i++) {
		const kode = nyKode();
		if (await rpc("rom_lag", {
			p_kode: kode,
			p_data: data
		}) === true) return {
			kode,
			spiller: vert
		};
	}
	throw new Error("Fant ingen ledig kode");
}
/** Modus vises med navnet («Snill»/«Mild»), ikke koden («snill»). */
function modusNavn(s, lang) {
	if (typeof s.modus !== "string" || !s.modus || s.modus === "*") return s.modus;
	try {
		const l = lekeliste(lang).find((x) => x.id === s.lek);
		const m = l && (l.moduser || []).find((x) => x.v === s.modus);
		return m ? m.t : s.modus;
	} catch {
		return s.modus;
	}
}
/** Prisene når kvelden er over – regnet ut av det rommet allerede vet. */
function kaaringer(data) {
	const l = data.spillere || [], ut = [];
	const navn = (id) => navnPaa(data, id);
	const maks = (felt) => {
		const m = l.slice().sort((a, b) => (b[felt] || 0) - (a[felt] || 0))[0];
		return m && m[felt] ? m : null;
	};
	const k = data.kveld;
	if (k && k.vinner) ut.push({
		ikon: "🏆",
		tittel: L("Kveldens vinner", "Winner of the night"),
		id: k.vinner,
		navn: navn(k.vinner),
		tall: L((k.poeng[k.vinner] || 0) + " kveldspoeng", (k.poeng[k.vinner] || 0) + " night points")
	});
	const sum = l.reduce((n, p) => n + (p.slurker || 0), 0);
	const torst = maks("slurker");
	if (torst) ut.push({
		ikon: "🍺",
		tittel: L("Kveldens tørstigste", "Thirstiest of the night"),
		id: torst.id,
		navn: torst.navn,
		tall: L(torst.slurker + " slurker", torst.slurker + " sips")
	});
	if (l.length >= 3 && sum) {
		const e = l.slice().sort((a, b) => (a.slurker || 0) - (b.slurker || 0))[0];
		ut.push({
			ikon: "😇",
			tittel: L("Slapp unna", "Got away with it"),
			id: e.id,
			navn: e.navn,
			tall: L((e.slurker || 0) + " slurker", (e.slurker || 0) + " sips")
		});
	}
	const brudd = data.rekord && data.rekord.brudd || {}, bId = Object.keys(brudd).sort((a, b) => brudd[b] - brudd[a])[0];
	if (bId && l.some((p) => p.id === bId)) ut.push({
		ikon: "💥",
		tittel: L("Ringbryteren", "The ring breaker"),
		id: bId,
		navn: navn(bId),
		tall: L(brudd[bId] + (brudd[bId] === 1 ? " ring" : " ringer"), brudd[bId] + (brudd[bId] === 1 ? " ring" : " rings"))
	});
	const b = data.bors;
	if (b) {
		const start = (id) => b.startKr && b.startKr[id] != null ? b.startKr[id] : 1e3;
		const formue = l.map((p) => ({
			id: p.id,
			navn: p.navn,
			g: Math.round((b.saldo && b.saldo[p.id] != null ? b.saldo[p.id] : 1e3) - start(p.id))
		})).sort((x, y) => y.g - x.g);
		if (formue.length >= 2 && formue[0].g > 0) ut.push({
			ikon: "📈",
			tittel: L("Børskongen", "Market king"),
			id: formue[0].id,
			navn: formue[0].navn,
			tall: L("+" + formue[0].g + " kr", "+" + formue[0].g + " coins")
		});
		const bunn = formue[formue.length - 1];
		if (formue.length >= 2 && bunn.g < 0) ut.push({
			ikon: "💸",
			tittel: L("Gikk konkurs", "Went bust"),
			id: bunn.id,
			navn: bunn.navn,
			tall: L(bunn.g + " kr", bunn.g + " coins")
		});
	}
	const gav = maks("sendt");
	if (gav) ut.push({
		ikon: "🎁",
		tittel: L("Mest gavmild", "Most generous"),
		id: gav.id,
		navn: gav.navn,
		tall: L(gav.sendt + " 🍺 sendt", gav.sendt + " 🍺 sent")
	});
	const mob = maks("mottatt");
	if (mob) ut.push({
		ikon: "🎯",
		tittel: L("Mest mobbet", "Most picked on"),
		id: mob.id,
		navn: mob.navn,
		tall: L(mob.mottatt + " 🍺 fått", mob.mottatt + " 🍺 received")
	});
	const quiz = maks("quiz");
	if (quiz) ut.push({
		ikon: "🧠",
		tittel: L("Quizmester", "Quiz master"),
		id: quiz.id,
		navn: quiz.navn,
		tall: L(quiz.quiz + " riktige", quiz.quiz + " correct")
	});
	return ut;
}
/** Verten lager en PIN som PC-en/TV-en bruker for å vise rommet. Storskjermen er ingen spiller og ser aldri hemmeligheter. */
function skjermPinOk(data, pin) {
	const p = data && data.skjerm && data.skjerm.pin;
	if (!p || typeof pin !== "string" || pin.length !== p.length) return false;
	let d = 0;
	for (let i = 0; i < p.length; i++) d |= p.charCodeAt(i) ^ pin.charCodeAt(i);
	return d === 0;
}
function skjermVisning(data, versjon, sprak = "no") {
	const lang = rensLang(sprak), s = data.spill;
	let spill = null;
	if (s) {
		spill = {
			type: s.type,
			lek: s.lek,
			navn: s.navn,
			runde: s.runde || null,
			frist: s.frist || null
		};
		if (s.type === "kort") Object.assign(spill, {
			kort: s.kort,
			pos: s.pos,
			antall: s.rekke.length,
			konger: s.konger,
			makkere: s.makkere || [],
			velgMakker: s.velgMakker || null,
			turId: s.tur !== null && s.tur !== void 0 ? (data.spillere[s.tur % Math.max(1, data.spillere.length)] || {}).id || null : null
		}, s.ring ? {
			ring: true,
			tatt: s.tatt,
			nr: s.nr,
			brudd: s.brudd,
			ringBrutt: !!s.ringBrutt,
			bruddPlass: s.bruddPlass == null ? null : s.bruddPlass,
			igjen: s.rekke.length - s.tatt.length
		} : {});
		if (s.type === "mest") Object.assign(spill, {
			tekst: s.tekst,
			fase: s.fase,
			stemt: Object.keys(s.stemmer || {}).length,
			resultat: s.fase === "resultat" ? s.resultat : null
		});
		if (s.type === "forraeder") Object.assign(spill, {
			tekst: s.tekst,
			fase: s.fase,
			aktiv: s.aktiv,
			stemt: Object.keys(s.stemmer || {}).length,
			resultat: s.fase === "avslort" ? {
				svar: s.hemmelig,
				drikker: s.drikker
			} : null
		});
	}
	let bors = null;
	const b = data.bors;
	if (b) {
		const bv = borsVisning(data, null);
		const synlig = (b.aksjer || []).filter((a) => a.status === "meldt" || a.status === "avgjort" && a.meldtT);
		bors = {
			paa: !!b.paa,
			tavle: bv ? bv.tavle : [],
			slutt: b.slutt || null,
			meldte: synlig.filter((a) => a.status === "meldt").map((a) => ({
				id: a.id,
				q: a.q,
				type: a.type,
				utfall: a.melding ? a.melding.utfall : null,
				av: a.melding ? a.melding.av : null
			})),
			avgjort: synlig.filter((a) => a.status === "avgjort").slice(-4).reverse().map((a) => ({
				id: a.id,
				q: a.q,
				type: a.type,
				vinner: a.vinner
			})),
			saker: (b.saker || []).map((x) => ({
				id: x.id,
				mot: x.mot,
				fase: x.fase,
				dom: x.resultat ? !!x.resultat.dom : null
			}))
		};
	}
	const hd = data.hendelse;
	return {
		skjerm: true,
		versjon,
		vert: data.vert,
		lang,
		naa: Date.now(),
		laget: data.laget,
		spillere: data.spillere.map((p) => ({
			id: p.id,
			navn: p.navn,
			slurker: p.slurker || 0
		})),
		spill: lok(spill, lang),
		valgt: data.valgt ? {
			lek: data.valgt.lek,
			navn: tr(lekNavnL(data.valgt.lek), lang)
		} : null,
		hendelse: hd ? {
			nr: hd.nr,
			tekst: lang === "en" && hd.en ? hd.en : tr(hd.tekst, lang)
		} : null,
		reak: data.reak || [],
		kveld: lok(kveldVisning(data), lang),
		bors: lok(bors, lang),
		alkoholfri: !!data.alkoholfri,
		ferdig: data.ferdig || null,
		kaaringer: data.ferdig ? lok(kaaringer(data), lang) : null,
		gjeng: data.gjeng ? { navn: data.gjeng.navn } : null,
		mester: data.mester ? {
			id: data.mester.id,
			til: data.mester.til
		} : null,
		vann: data.vann ? {
			nr: data.vann.nr,
			tid: data.vann.tid,
			t: tr(data.vann.t, lang)
		} : null
	};
}
/** Hva hver telefon får se. Språket er spillerens eget (meg.lang); uten spiller brukes `sprak`. */
function visning(data, versjon, meg, sprak = "no") {
	const lang = meg ? rensLang(meg.lang) : rensLang(sprak);
	const s = data.spill;
	let spill = null;
	if (s) {
		spill = {
			type: s.type,
			lek: s.lek,
			navn: s.navn,
			modus: modusNavn(s, lang),
			runde: s.runde,
			frist: s.frist || null,
			turStart: s.turNokkel ? s.turStart || null : null
		};
		if (s.type === "kort") Object.assign(spill, {
			kort: s.kort,
			pos: s.pos,
			antall: s.rekke.length,
			tur: s.tur,
			konger: s.konger,
			makkere: s.makkere || [],
			velgMakker: s.velgMakker || null
		}, s.ring ? {
			ring: true,
			tatt: s.tatt,
			nr: s.nr,
			brudd: s.brudd,
			ringBrutt: !!s.ringBrutt,
			bruddPlass: s.bruddPlass == null ? null : s.bruddPlass,
			sist: s.sist,
			turId: (data.spillere[s.tur % Math.max(1, data.spillere.length)] || {}).id || null,
			igjen: s.rekke.length - s.tatt.length
		} : {});
		if (s.type === "mest") Object.assign(spill, {
			tekst: s.tekst,
			fase: s.fase,
			harStemt: Object.keys(s.stemmer),
			minStemme: meg ? s.stemmer[meg.id] || null : null,
			resultat: s.fase === "resultat" ? s.resultat : null
		});
		if (s.type === "forraeder") Object.assign(spill, {
			tekst: s.tekst,
			fase: s.fase,
			aktiv: s.aktiv,
			harStemt: Object.keys(s.stemmer),
			minStemme: meg ? s.stemmer[meg.id] || null : null,
			hemmelig: meg && meg.id === s.aktiv ? s.hemmelig : null,
			resultat: s.fase === "avslort" ? {
				svar: s.hemmelig,
				stemmer: s.stemmer,
				drikker: s.drikker
			} : null
		});
		if (EKSTRA.includes(s.type)) Object.assign(spill, ekstraVisning(s, meg, data));
		if (s.type === "bingo") Object.assign(spill, {
			era: s.era,
			tittel: typeof s.tittel === "string" && lang === "en" ? eraTittel(s.era, "en") : s.tittel,
			spotify: s.spotify,
			mittBrett: meg && s.brett[meg.id] ? s.brett[meg.id].map((i) => s.sanger[i]) : null,
			mineMerker: meg && s.merket[meg.id] ? s.merket[meg.id] : null,
			rekker: s.rekker,
			bingo: s.bingo
		});
	}
	const hd = data.hendelse;
	return {
		versjon,
		vert: data.vert,
		meg: meg ? meg.id : null,
		lang,
		spillere: data.spillere.map((p) => ({
			id: p.id,
			navn: p.navn,
			medlem: !!p.konto,
			invitert: !!p.invitert,
			immun: p.immun || 0,
			slurker: p.slurker || 0,
			gi: p.gi || 0,
			sendt: p.sendt || 0,
			mottatt: p.mottatt || 0,
			quiz: p.quiz || 0,
			lang: rensLang(p.lang)
		})),
		spill: lok(spill, lang),
		hendelse: hd ? {
			nr: hd.nr,
			tekst: lang === "en" && hd.en ? hd.en : tr(hd.tekst, lang)
		} : null,
		nr: data.nr,
		reak: data.reak || [],
		valgt: data.valgt || null,
		naa: Date.now(),
		hjul: data.hjul ? hjulVisning(data, lang) : null,
		hjulListe: data.hjulListe || (lang === "en" ? HJUL_STANDARD_EN : HJUL_STANDARD),
		oppdrag: lok(oppdragVisning(data, meg), lang),
		bors: lok(borsVisning(data, meg), lang),
		pluss: data.pluss && data.pluss.til > Date.now() ? { til: data.pluss.til } : null,
		gratisPlasser: 4,
		fullForsok: data.fullForsok || null,
		laget: data.laget,
		ferdig: data.ferdig || null,
		historikk: lok(data.historikk || [], lang),
		alkoholfri: !!data.alkoholfri,
		gjeng: data.gjeng ? {
			navn: data.gjeng.navn,
			kode: data.gjeng.kode,
			kveld: !!data.gjengKveld,
			regler: data.gjeng.regler || []
		} : null,
		kveld: lok(kveldVisning(data), lang),
		plan: data.plan || null,
		kaaringer: data.ferdig ? lok(kaaringer(data), lang) : null,
		mester: data.mester ? {
			id: data.mester.id,
			til: data.mester.til
		} : null,
		vann: data.vann ? {
			nr: data.vann.nr,
			tid: data.vann.tid,
			t: tr(data.vann.t, lang)
		} : null,
		vannAv: !!data.vannAv,
		vannNeste: meg && meg.id === data.vert ? vannNeste(data) : null,
		skjermPin: meg && meg.id === data.vert && data.skjerm ? data.skjerm.pin : null,
		venter: meg && (meg.id === data.vert || meg.konto) ? (data.venter || []).map((v) => ({
			id: v.id,
			navn: v.navn
		})) : []
	};
}
var FRIST = {
	mest: 30,
	forraeder: 30,
	tosannheter: 45,
	veddelopet: 45,
	nrKort: 40,
	nrLang: 60
};
function settFrist(s, sek) {
	s.frist = Date.now() + sek * 1e3 + 1500;
}
function fristUte(s) {
	return !s.frist || Date.now() >= s.frist - 800;
}
/** Feilmelding når noen prøver å gå videre for tidlig. */
function venter(s, mangler) {
	const sek = Math.max(1, Math.ceil((s.frist - Date.now()) / 1e3));
	return feilL("vent", `Venter på ${mangler} ${mangler === 1 ? "svar" : "svar"} – eller ${sek} sekunder til tiden er ute.`, `Waiting for ${mangler} ${mangler === 1 ? "answer" : "answers"} – or ${sek} ${sek === 1 ? "second" : "seconds"} until time's up.`);
}
/** Hendelsen alle ser. Lagres på begge språk; visning() viser tekst på språket til den som ser på. */
function melde(data, tekst, en) {
	data.nr = (data.nr || 0) + 1;
	data.hendelse = {
		nr: data.nr,
		tekst,
		en: en || tekst
	};
}
function navnPaa(data, id) {
	const p = data.spillere.find((x) => x.id === id);
	return p ? p.navn : "?";
}
function giSlurker(data, id, n, viaMakker = false) {
	const p = data.spillere.find((x) => x.id === id);
	if (!p) return;
	if (n > 0 && (p.immun || 0) > 0) {
		p.immun--;
		melde(data, `🛡️ ${p.navn} brukte immunitet og slapp ${n} ${n === 1 ? "slurk" : "slurker"}!`, `🛡️ ${p.navn} used immunity and skipped ${n} ${n === 1 ? "sip" : "sips"}!`);
		return;
	}
	p.slurker = Math.max(0, (p.slurker || 0) + n);
	if (!viaMakker && n > 0) makkereTil(data, id).forEach((m) => giSlurker(data, m, n, true));
}
/** Alle som henger sammen med spilleren gjennom makkerpar i leken som pågår (ikke spilleren selv). */
function makkereTil(data, id) {
	const par = data.spill && data.spill.makkere || [];
	if (!par.length) return [];
	const sett = /* @__PURE__ */ new Set([id]), ko = [id];
	while (ko.length) {
		const x = ko.pop();
		par.forEach(([a, b]) => {
			const y = a === x ? b : b === x ? a : null;
			if (y && !sett.has(y)) {
				sett.add(y);
				ko.push(y);
			}
		});
	}
	sett.delete(id);
	return Array.from(sett).filter((m) => data.spillere.some((p) => p.id === m));
}
/** Gjengkveld: gi et nytt medlem startsaldoen sin fra gjengens lommebok hvis børsen er i gang. */
function startSaldoFor(data, id, kr) {
	if (data.bors && kr != null) settStart(data, { [id]: Number(kr) });
}
/** Slurker spilleren har vunnet og kan sende til andre (🍺-knappen). */
function giUtdeling(data, id, n) {
	const p = data.spillere.find((x) => x.id === id);
	if (p) p.gi = Math.max(0, Math.min(99, (p.gi || 0) + n));
}
/** Kort id for et kort (fra den norske teksten) – brukes til å huske hva telefonen har sett før. */
function kortId(k) {
	const t = String(k && k.t && typeof k.t === "object" ? k.t.no : k && k.t || "");
	let h = 5381;
	for (let i = 0; i < t.length; i++) h = (h << 5) + h + t.charCodeAt(i) | 0;
	return (h >>> 0).toString(36);
}
/** Kort dere ikke har sett før kommer først – de dere har sett, havner (stokket) bakerst. */
function usetteForst(rekke, sett) {
	if (!sett || !sett.size) return rekke;
	const nye = rekke.filter((k) => !sett.has(kortId(k))), gamle = rekke.filter((k) => sett.has(kortId(k)));
	return nye.concat(gamle);
}
function kortstokkFor(lek, modus, sett) {
	return lek === "ring-of-fire" ? kortstokkRa(lek, modus) : usetteForst(kortstokkRa(lek, modus), sett);
}
function kortstokkRa(lek, modus) {
	if (lek === "ring-of-fire") {
		const sorter = [
			["♥", 1],
			["♦", 1],
			["♠", 0],
			["♣", 0]
		];
		const verdier = [
			"A",
			"2",
			"3",
			"4",
			"5",
			"6",
			"7",
			"8",
			"9",
			"10",
			"J",
			"Q",
			"K"
		];
		const kort = [];
		sorter.forEach(([s, rod]) => verdier.forEach((v) => kort.push({
			v,
			s,
			rod
		})));
		return stokk(kort);
	}
	if (erPlussLek(lek)) {
		const id = lek.slice(6), pk = P[id], en = PE[id] && PE[id].items || [];
		return stokk(pk.items.map((x, i) => kortL(x, en[i])));
	}
	const d = D[lek], en = DE[lek] && DE[lek].items || [];
	return stokk(d.items.map((x, i) => [x, en[i]]).filter(([x]) => !modus || modus === "*" || (d.modes || []).length <= 1 || x.m === modus).map(([x, e]) => kortL(x, e)));
}
/** Ett kort på begge språk: { t: {no, en}, k: {no, en} | '' }. */
function kortL(x, e) {
	const et = e && typeof e === "object" ? e : null;
	return {
		t: L(x.t, et && et.t),
		k: x.k ? L(x.k, et && et.k) : ""
	};
}
/** Smakebiter: i rom uten Pluss dukker et par kort fra pakkene opp innimellom. */
function medSmakebiter(rekke) {
	const ut = rekke.slice(), ider = Object.keys(P);
	for (let n = 0; n < 2 && ider.length; n++) {
		const id = ider[tilfeldig(ider.length)], i = tilfeldig(Math.min(5, P[id].items.length)), it = P[id].items[i];
		const en = PE[id] && PE[id].items ? PE[id].items[i] : null, enNavn = PE[id] && PE[id].navn || P[id].navn;
		ut.splice(8 + tilfeldig(Math.max(1, ut.length - 8)), 0, {
			t: L(it.t, en && en.t),
			k: L("✨ Smakebit fra " + P[id].navn + "-pakken", "✨ Sneak peek from the " + enNavn + " pack"),
			smak: true
		});
	}
	return ut;
}
var ROF_BRUDD = 5;
var KONGE_NR = [
	["Første", "First"],
	["Andre", "Second"],
	["Tredje", "Third"],
	["Fjerde", "Fourth"]
];
function visKort(s, data) {
	const k = s.rekke[s.pos];
	if (s.lek !== "ring-of-fire") return {
		t: k.t,
		k: k.k,
		id: k.smak ? null : kortId(k)
	};
	const info = D["ring-of-fire"].kort[k.v], infoEn = DE["ring-of-fire"] && DE["ring-of-fire"].kort && DE["ring-of-fire"].kort[k.v] || info;
	let regel = L(info[0], infoEn[0]), tekst = L(info[1], infoEn[1]);
	if (k.v === "K") {
		const nr = s.konger;
		const sl = D["ring-of-fire"].konger[Math.min(nr, 4) - 1];
		const kn = KONGE_NR[nr - 1] || ["Neste", "Next"];
		regel = L(kn[0] + " konge", kn[1] + " king");
		tekst = L("Drikk " + sl + " slurker." + (nr === 4 ? " Det var siste konge!" : ""), "Drink " + sl + " sips." + (nr === 4 ? " That was the last king!" : ""));
	}
	return {
		v: k.v === "J" ? L("Kn", "J") : k.v === "Q" ? L("D", "Q") : k.v,
		s: k.s,
		rod: k.rod,
		regel,
		tekst,
		hvem: s.tur !== null ? navnPaa(data, data.spillere[s.tur]?.id) : null
	};
}
function nyMestRunde(s) {
	if (!s.kø.length) s.kø = stokk(s.alle.slice());
	s.tekst = s.kø.pop();
	s.fase = "stem";
	s.stemmer = {};
	s.resultat = null;
	s.runde = (s.runde || 0) + 1;
	settFrist(s, FRIST.mest);
}
function nyForraederRunde(s, data) {
	if (!s.kø.length) s.kø = stokk(s.alle.slice());
	const ider = data.spillere.map((p) => p.id);
	s.aktiv = ider[(ider.indexOf(s.aktiv) + 1) % ider.length];
	s.tekst = s.kø.pop();
	s.fase = "svar";
	s.stemmer = {};
	s.drikker = [];
	s.hemmelig = tilfeldig(2) ? "sannhet" : "lyv";
	s.runde = (s.runde || 0) + 1;
}
var LINJER = (() => {
	const l = [];
	for (let r = 0; r < 4; r++) {
		l.push([
			r * 4,
			r * 4 + 1,
			r * 4 + 2,
			r * 4 + 3
		]);
		l.push([
			r,
			r + 4,
			r + 8,
			r + 12
		]);
	}
	l.push([
		0,
		5,
		10,
		15
	]);
	l.push([
		3,
		6,
		9,
		12
	]);
	return l;
})();
function nyttBrett(s) {
	return stokk(s.sanger.map((_, i) => i)).slice(0, 16);
}
function startSpill(data, lek, modus, sett) {
	if (EKSTRA.includes(lek)) return startEkstra(data, lek, modus);
	const valgt = lekeliste("no").find((x) => x.id === lek);
	if (!valgt) return { feil: "ukjent-lek" };
	const navn = lekNavnL(lek);
	/** Tekstene i en kortstokk på begge språk, filtrert på modus. */
	const teksterL = (dekk) => {
		const en = DE[dekk] && DE[dekk].items || [];
		return D[dekk].items.map((x, i) => [x, en[i]]).filter(([x]) => !modus || modus === "*" || x.m === modus).map(([x, e]) => L(x.t, e && e.t));
	};
	if (valgt.type === "kort") {
		const plussRom = !!(data.pluss && data.pluss.til > Date.now());
		if (valgt.pluss && !plussRom) return feilL("pluss", "Denne pakken krever Mitt vors Pluss.", "This pack needs Mitt vors Plus.");
		let rekke = kortstokkFor(lek, modus, sett);
		if (!plussRom && !valgt.pluss && lek !== "ring-of-fire" && rekke.length > 12) rekke = medSmakebiter(rekke);
		if (!rekke.length) return { feil: "tom" };
		data.spill = {
			type: "kort",
			lek,
			navn,
			modus,
			rekke,
			pos: 0,
			tur: lek === "ring-of-fire" ? 0 : null,
			konger: 0
		};
		if (lek === "ring-of-fire" && modus !== "enkel") Object.assign(data.spill, {
			ring: true,
			tatt: [],
			nr: 0,
			brudd: null,
			kort: null,
			sist: null
		});
		else {
			if (lek === "ring-of-fire" && rekke[0].v === "K") data.spill.konger = 1;
			data.spill.kort = visKort(data.spill, data);
		}
	}
	if (valgt.type === "mest") {
		data.spill = {
			type: "mest",
			lek,
			navn,
			modus,
			alle: teksterL("pekeleken"),
			kø: []
		};
		nyMestRunde(data.spill);
	}
	if (valgt.type === "forraeder") {
		if (data.spillere.length < 3) return feilL("for-faa", "Løgnhalsen trenger minst tre spillere.", "The liar needs at least three players.");
		data.spill = {
			type: "forraeder",
			lek,
			navn,
			modus,
			alle: teksterL("forraeder"),
			kø: [],
			aktiv: data.spillere[data.spillere.length - 1].id
		};
		nyForraederRunde(data.spill, data);
	}
	if (valgt.type === "bingo") {
		const era = B.eras.find((e) => e.id === modus) || B.eras[0];
		const s = {
			type: "bingo",
			lek,
			navn,
			modus: era.id,
			era: era.id,
			tittel: L(era.title, eraTittel(era.id, "en")),
			spotify: era.spotify || "",
			sanger: era.songs.map((x) => [x[0], x[1]]),
			brett: {},
			merket: {},
			rekker: [],
			bingo: []
		};
		data.spillere.forEach((p) => {
			s.brett[p.id] = nyttBrett(s);
			s.merket[p.id] = Array(16).fill(false);
		});
		data.spill = s;
	}
	melde(data, `Nytt spill: ${tr(navn, "no")}`, `New game: ${tr(navn, "en")}`);
	return { ok: true };
}
/** Hvem har tur akkurat nå (for «hopp over»)? null når ingen enkeltperson holder spillet. */
function turNokkel(s) {
	if (!s) return null;
	if (s.type === "bussruta" && s.fase === 1) return "b1:" + s.tur;
	if (s.type === "yatzy" && !s.ferdig) return "y:" + s.tur;
	if (s.type === "overunder") return "o:" + s.tur;
	if (s.type === "kort" && s.ring) return "r:" + s.tur + ":" + s.nr;
	return null;
}
var MESTER_MIN = 25;
function nyMester(data) {
	const ider = data.spillere.map((p) => p.id).filter((id) => !data.mester || id !== data.mester.id);
	if (!ider.length) return;
	data.mester = {
		id: ider[tilfeldig(ider.length)],
		til: Date.now() + MESTER_MIN * 6e4
	};
	melde(data, `❓ ${navnPaa(data, data.mester.id)} er ny spørsmålsmester – svarer du på et spørsmål fra hen, drikker du!`, `❓ ${navnPaa(data, data.mester.id)} is the new question master – answer one of their questions and you drink!`);
}
function sjekkMester(data) {
	const m = data.mester;
	if (!m) return;
	if (!data.spillere.some((p) => p.id === m.id) || Date.now() >= m.til) nyMester(data);
}
var VANN_MIN = 60;
var VANN_PAUSE_MIN = 20;
var VANN_TEKST = [
	["Alle tar et glass vann. Sistemann ferdig velger neste låt.", "Everyone drinks a glass of water. Last one done picks the next song."],
	["Leveren ba om fem minutter. Et glass vann før neste kort.", "Your liver asked for five minutes. A glass of water before the next card."],
	["Skål i kranvann – Norges beste drikke, og helt gratis.", "Cheers with tap water – the best drink there is, and it’s free."],
	["Et glass vann nå er en bedre morgen i morgen. Førstemann ferdig deler ut en slurk.", "A glass of water now is a better morning tomorrow. First one done hands out a sip."],
	["Vann-skål! Alle reiser seg, sier «skål for leveren» og tømmer et glass vann.", "Water toast! Everyone stands up, says “cheers to the liver” and empties a glass of water."],
	["Vannpause. Ingen drikker noe annet før alle glassene med vann er tomme.", "Water break. Nobody drinks anything else until every glass of water is empty."]
];
function vannrunde(data, naa) {
	data.vannFra = naa;
	const nr = (data.vann && data.vann.nr || 0) + 1, t = VANN_TEKST[(nr - 1) % VANN_TEKST.length];
	data.vann = {
		nr,
		tid: naa,
		t: L(t[0], t[1])
	};
}
function sjekkVann(data) {
	if (data.vannAv || data.alkoholfri || !data.spill) return;
	const naa = Date.now();
	if (!data.vannFra || naa - (data.vannAktiv || 0) > VANN_PAUSE_MIN * 6e4) data.vannFra = naa;
	data.vannAktiv = naa;
	if (naa - data.vannFra >= VANN_MIN * 6e4) vannrunde(data, naa);
}
/** Når kommer neste vannrunde av seg selv (for verten)? */
function vannNeste(data) {
	return data.vannAv || data.alkoholfri || !data.vannFra ? null : data.vannFra + VANN_MIN * 6e4;
}
function handling(data, meg, h) {
	sjekkMester(data);
	if (h.handling === "vann-naa" || h.handling === "vann-av" || h.handling === "vann-paa") {
		if (meg.id !== data.vert) return { feil: "bare-vert" };
		if (h.handling === "vann-naa") {
			if (!data.vann || Date.now() - data.vann.tid > 3e4) vannrunde(data, Date.now());
		} else {
			data.vannAv = h.handling === "vann-av";
			if (!data.vannAv) data.vannFra = Date.now();
			melde(data, data.vannAv ? "💧 Vannrunden hver time er slått av" : "💧 Vannrunde omtrent hver time er slått på", data.vannAv ? "💧 The hourly water round is off" : "💧 A water round about every hour is on");
		}
		return { ok: true };
	}
	if (h.handling === "mester-paa" || h.handling === "mester-bytt") {
		if (meg.id !== data.vert) return { feil: "bare-vert" };
		if (data.spillere.length < 2) return feilL("for-faa", "Spørsmålsmester trenger minst to spillere.", "Question master needs at least two players.");
		nyMester(data);
		return { ok: true };
	}
	if (h.handling === "mester-av") {
		if (meg.id !== data.vert) return { feil: "bare-vert" };
		data.mester = null;
		melde(data, "Spørsmålsmesteren er slått av", "The question master is turned off");
		return { ok: true };
	}
	const svar = handlingInne(data, meg, h);
	sjekkVann(data);
	const s = data.spill, n = turNokkel(s);
	if (s && n !== s.turNokkel) {
		s.turNokkel = n;
		s.turStart = n ? Date.now() : null;
	}
	return svar;
}
function hoppOver(data) {
	const s = data.spill, ider = aktiveIder(data);
	if (s.type === "bussruta" && s.fase === 1) {
		const hvem = s.ider[s.tur];
		s.steg = 0;
		s.tur++;
		s.melding = L(`${navnPaa(data, hvem)} ble hoppet over.`, `${navnPaa(data, hvem)} was skipped.`);
		if (s.tur >= s.ider.length) {
			s.fase = 2;
			s.pyr = [];
			for (let i = 0; i < 15; i++) s.pyr.push(brTrekk(s));
			s.pyrPos = 0;
			s.sist = null;
		}
	} else if (s.type === "yatzy") {
		const hvem = s.ider[s.tur], b = s.blokker[hvem], f = YZ_FELT.find((x) => b[x] == null);
		if (f) b[f] = 0;
		s.tur = (s.tur + 1) % s.ider.length;
		s.kast = 0;
		s.hold = [
			false,
			false,
			false,
			false,
			false
		];
		s.melding = L(`${navnPaa(data, hvem)} ble hoppet over (strøk ett felt).`, `${navnPaa(data, hvem)} was skipped (one box scratched).`);
		if (s.ider.every((id) => YZ_FELT.every((x) => s.blokker[id][x] != null))) s.ferdig = s.ider.map((id) => ({
			id,
			navn: navnPaa(data, id),
			sum: yzSum(s.blokker[id])
		})).sort((a, c) => c.sum - a.sum);
	} else if (s.type === "overunder") s.tur = (s.tur + 1) % Math.max(1, ider.length);
	else if (s.type === "kort" && s.ring) s.tur = (s.tur + 1) % Math.max(1, data.spillere.length);
	melde(data, "Hoppet over den som hadde tur", "Skipped whoever had the turn");
}
function handlingInne(data, meg, h) {
	const s = data.spill;
	const erVert = meg.id === data.vert;
	if (h.handling === "hopp-over") {
		if (!erVert) return { feil: "bare-vert" };
		if (!s || !s.turStart || !turNokkel(s)) return { ok: true };
		if (Date.now() - s.turStart < 39e3) return feilL("vent", "Gi dem litt tid til.", "Give them a bit more time.");
		hoppOver(data);
		return { ok: true };
	}
	if (h.handling === "hjul") return spinnHjul(data, meg, h, erVert);
	if (h.handling === "sprak" || h.handling === "lang") {
		meg.lang = rensLang(h.lang);
		return { ok: true };
	}
	if (String(h.handling || "").startsWith("op-")) return oppdragHandling(data, meg, h, erVert);
	if (String(h.handling || "").startsWith("bs-")) {
		const r = borsHandling(data, meg, {
			...h,
			_borsFri: h._borsFri || romHarPluss(data)
		}, erVert);
		if (data.bors && romHarPluss(data)) borsTilPluss(data);
		return r;
	}
	if (h.handling === "hjul-liste") {
		if (!erVert) return { feil: "bare-vert" };
		const l = (Array.isArray(h.liste) ? h.liste : []).map((x) => String(x || "").replace(/[\u0000-\u001f<>]/g, "").trim().slice(0, 60)).filter(Boolean).slice(0, 12);
		data.hjulListe = l.length >= 2 ? l : null;
		return { ok: true };
	}
	const ekstra = [
		"start",
		"avslutt",
		"fjern",
		"nullstill",
		"slurk",
		"reager",
		"send",
		"velg-annen",
		"avslutt-kvelden",
		"fortsett-kvelden",
		"pluss-aktiver",
		"alkoholfri",
		"gjeng",
		"gjeng-meg",
		"kv-vinner",
		"lov-valg",
		"slipp-inn",
		"avvis-inn"
	].includes(h.handling) ? null : ekstraHandling(data, meg, h);
	if (ekstra) return ekstra;
	switch (h.handling) {
		case "start": {
			if (!erVert) return { feil: "bare-vert" };
			if (h._plussTil > Date.now() && !(data.pluss && data.pluss.til > Date.now())) data.pluss = { til: Math.min(h._plussTil, Date.now() + 864e5) };
			if (h.lek !== "egen" && erPlussLek(String(h.lek || "")) && !romHarPluss(data)) return feilL("pluss", "Denne leken krever Mitt vors Pluss hos verten.", "This game needs the host to have Mitt vors Plus.");
			if (h.lek === "lov") return feilL("ukjent-lek", "Gjengens lov er ikke lenger et eget spill – vinneren av kvelden velger regel.", "The Crew’s Law is no longer a separate game – the winner of the night picks a rule.");
			if (data.spill) lekFerdig(data);
			const r = h.lek === "egen" ? startEgen(data, h.kort, h.navn) : startSpill(data, String(h.lek || ""), String(h.modus || "*"), new Set((Array.isArray(h.sett) ? h.sett : []).slice(0, 2e3).filter((x) => typeof x === "string" && /^[0-9a-z]{1,8}$/.test(x))));
			if (!r.feil && data.spill) {
				data.valgt = null;
				data.ferdig = null;
				data.historikk = (data.historikk || []).concat([data.spill.navn]).slice(-40);
				lekStartet(data);
			}
			return r;
		}
		case "skjerm-lag":
			if (!erVert) return { feil: "bare-vert" };
			if (!data.skjerm || h.ny) {
				let pin = "";
				for (let i = 0; i < 6; i++) pin += tilfeldig(10);
				data.skjerm = {
					pin,
					laget: Date.now()
				};
			}
			return { ok: true };
		case "avslutt-kvelden": {
			if (!erVert) return { feil: "bare-vert" };
			if (data.spill) lekFerdig(data);
			data.spill = null;
			data.valgt = null;
			data.ferdig = Date.now();
			if (data.gjeng && data.bors) {
				const e = borsTilGjeng(data);
				if (e) kveld(data).eksport = e;
			}
			const vinner = kaarVinner(data);
			if (vinner) melde(data, `🏆 ${navnPaa(data, vinner)} vant kvelden!` + (data.gjeng ? " Nå får hen velge en regel til lovboka." : ""), `🏆 ${navnPaa(data, vinner)} won the night!` + (data.gjeng ? " Now they get to pick a rule for the law book." : ""));
			else melde(data, "Kvelden er over – her er oppsummeringen!", "The night is over – here's the recap!");
			return { ok: true };
		}
		case "fortsett-kvelden":
			if (!erVert) return { feil: "bare-vert" };
			data.ferdig = null;
			return { ok: true };
		case "pluss-aktiver": {
			if (!erVert) return { feil: "bare-vert" };
			if (!(h._plussTil > Date.now())) return feilL("pluss", "Kontoen din har ikke Pluss akkurat nå.", "Your account doesn't have Plus right now.");
			const hadde = !!(data.pluss && data.pluss.til > Date.now());
			data.pluss = { til: Math.min(h._plussTil, Date.now() + 864e5) };
			if (!hadde) melde(data, "✨ Rommet har Pluss i kveld – alle leker er låst opp!", "✨ The room has Plus tonight – every game is unlocked!");
			return { ok: true };
		}
		case "alkoholfri":
			if (!erVert) return { feil: "bare-vert" };
			data.alkoholfri = !!h.paa;
			melde(data, data.alkoholfri ? "🥤 Alkoholfri modus: slurker er straffepoeng i kveld" : "Alkoholfri modus er skrudd av", data.alkoholfri ? "🥤 Alcohol-free mode: sips are penalty points tonight" : "Alcohol-free mode is off");
			return { ok: true };
		case "gjeng":
			if (!erVert) return { feil: "bare-vert" };
			data.gjeng = h._gjeng && h._gjeng.id ? {
				id: h._gjeng.id,
				navn: h._gjeng.navn,
				kode: h._gjeng.kode,
				regler: Array.isArray(h._regler) ? h._regler : []
			} : null;
			data.spillere.forEach((p) => {
				delete p.konto;
			});
			if (data.gjeng && h._konto) meg.konto = h._konto;
			if (data.gjeng) melde(data, `Kvelden telles i sesongen til ${data.gjeng.navn} 🏆`, `Tonight counts towards ${data.gjeng.navn}'s season 🏆`);
			return { ok: true };
		case "gjeng-meg": {
			if (!data.gjeng || !h._konto) return { ok: true };
			if (data.spillere.some((p) => p.konto === h._konto && p.id !== meg.id)) return feilL("konto", "Kontoen din er allerede med i rommet på en annen telefon.", "Your account is already in the room on another phone.");
			const ny = !meg.konto;
			meg.konto = h._konto;
			if (ny && h._ble) melde(data, `${meg.navn} ble med i gjengen ${data.gjeng.navn} 🤝`, `${meg.navn} joined the crew ${data.gjeng.navn} 🤝`);
			return { ok: true };
		}
		case "kv-vinner":
			if (!erVert) return { feil: "bare-vert" };
			return velgVinner(data, h.hvem ? String(h.hvem) : null);
		case "lov-valg": {
			const k = kveld(data);
			if (!data.gjeng || !data.ferdig || k.vinner !== meg.id) return feilL("ikke-vinner", "Bare kveldens vinner kan velge regel.", "Only the winner of the night can pick a rule.");
			if (k.lovValg) return { ok: true };
			const type = [
				"ny",
				"opphev",
				"ingen"
			].includes(h.type) ? h.type : "";
			if (!type) return { feil: "ukjent" };
			const tekst = String(h.tekst || "").replace(/[\u0000-\u001f<>]/g, "").replace(/\s+/g, " ").trim().slice(0, 140);
			if (type === "ny" && tekst.length < 4) return feilL("kort", "Skriv hele regelen.", "Write the whole rule.");
			const regel = type === "opphev" ? (data.gjeng.regler || []).find((x) => x.id === h.regel) : null;
			if (type === "opphev" && !regel) return feilL("ukjent", "Fant ikke regelen.", "Couldn’t find that rule.");
			k.lovValg = {
				type,
				tekst: type === "ny" ? tekst : regel ? regel.tekst : "",
				regel: regel ? regel.id : null,
				navn: meg.navn,
				lagret: false
			};
			melde(data, type === "ny" ? `📜 ${meg.navn} innfører regelen «${tekst}»` : type === "opphev" ? `🗑️ ${meg.navn} opphever regelen «${regel.tekst}»` : `🤷 ${meg.navn} lar lovboka være som den er`, type === "ny" ? `📜 ${meg.navn} introduces the rule “${tekst}”` : type === "opphev" ? `🗑️ ${meg.navn} repeals the rule “${regel.tekst}”` : `🤷 ${meg.navn} leaves the law book as it is`);
			return { ok: true };
		}
		case "slipp-inn":
		case "avvis-inn": {
			if (!erVert && !meg.konto) return feilL("bare-medlem", "Bare verten og medlemmer av gjengen kan slippe inn folk.", "Only the host and crew members can let people in.");
			const i = (data.venter || []).findIndex((v) => v.id === h.hvem);
			if (i === -1) return { ok: true };
			const v = data.venter.splice(i, 1)[0];
			if (h.handling === "avvis-inn") return { ok: true };
			const r = leggTil(data, v, v.navn);
			if (r.feil) {
				data.venter.splice(i, 0, v);
				return r;
			}
			if (h.som === "medlem") r.spiller.invitert = true;
			melde(data, `${r.spiller.navn} ble sluppet inn av ${meg.navn}` + (h.som === "medlem" ? " – og er invitert inn i gjengen" : ""), `${r.spiller.navn} was let in by ${meg.navn}` + (h.som === "medlem" ? " – and invited to join the crew" : ""));
			return { ok: true };
		}
		case "velg-annen":
			if (!erVert) return { feil: "bare-vert" };
			data.valgt = null;
			return { ok: true };
		case "avslutt":
			if (!erVert) return { feil: "bare-vert" };
			if (data.spill) lekFerdig(data);
			data.spill = null;
			melde(data, "Tilbake i lobbyen", "Back in the lobby");
			return { ok: true };
		case "fjern": {
			const hvem = String(h.hvem || "");
			if (!erVert || !hvem || hvem === data.vert) return { feil: "bare-vert" };
			const p = data.spillere.find((x) => x.id === hvem);
			if (!p) return { ok: true };
			data.spillere = data.spillere.filter((x) => x.id !== hvem);
			if (s && data.spillere.length) {
				const forste = data.spillere[0].id;
				if (s.type === "opus" && s.holder === hvem) s.holder = forste;
				if (s.type === "tosannheter" && s.aktiv === hvem) Object.assign(s, {
					aktiv: forste,
					fase: "skriv",
					pastander: [],
					stemmer: {},
					logn: -1
				});
				if (s.type === "forraeder" && s.aktiv === hvem) nyForraederRunde(s, data);
				if (typeof s.tur === "number" && Array.isArray(s.ider)) {
					const i = s.ider.indexOf(hvem);
					if (i !== -1 && s.type !== "yatzy" && s.type !== "bussruta") {
						s.ider.splice(i, 1);
						if (s.tur > i) s.tur--;
					}
					if (s.tur >= s.ider.length) s.tur = 0;
				}
				if (s.type === "president" || s.type === "overunder") {
					const n = aktiveIder(data).length;
					if (s.tur >= n) s.tur = 0;
				}
				if (s.hender && s.hender[hvem]) delete s.hender[hvem];
			}
			melde(data, `${p.navn} ble fjernet`, `${p.navn} was removed`);
			return { ok: true };
		}
		case "slurk": {
			const hvem = String(h.hvem || meg.id);
			if (hvem !== meg.id && !erVert) return feilL("bare-vert", "Bare verten kan endre andres slurker.", "Only the host can change other people's sips.");
			const p = data.spillere.find((x) => x.id === hvem);
			if (!p) return { ok: true };
			const n = Number(h.n) === -1 ? -1 : 1;
			p.slurker = Math.max(0, Math.min(999, (p.slurker || 0) + n));
			return { ok: true };
		}
		case "reager":
		case "send": {
			const naa = Date.now();
			if (meg.sistR && naa - meg.sistR < 900) return feilL("for-fort", "Rolig nå 😄", "Easy there 😄");
			const reak = { fra: meg.id };
			if (h.handling === "reager") {
				if (!REAKSJONER.includes(h.e)) return { feil: "ukjent" };
				reak.e = h.e;
			} else {
				const til = data.spillere.find((x) => x.id === h.hvem);
				if (!til || til.id === meg.id) return { feil: "ukjent" };
				if (!(meg.gi > 0)) return feilL("tomt", "Du har ingen slurker å dele ut. Vinn noe først!", "You have no sips to give out. Win something first!");
				meg.gi--;
				reak.e = "🍺";
				reak.til = til.id;
				if ((til.immun || 0) > 0) {
					til.immun--;
					reak.e = "🛡️";
					melde(data, `🛡️ ${til.navn} brukte immunitet mot slurken fra ${meg.navn}!`, `🛡️ ${til.navn} used immunity against ${meg.navn}’s sip!`);
				} else til.slurker = (til.slurker || 0) + 1;
				meg.sendt = (meg.sendt || 0) + 1;
				til.mottatt = (til.mottatt || 0) + 1;
			}
			meg.sistR = naa;
			data.reakNr = (data.reakNr || 0) + 1;
			reak.nr = data.reakNr;
			data.reak = (data.reak || []).concat([reak]).slice(-12);
			return { ok: true };
		}
		case "nullstill":
			if (!erVert) return { feil: "bare-vert" };
			data.spillere.forEach((p) => {
				p.slurker = 0;
				p.gi = 0;
			});
			melde(data, "Slurketelleren er nullstilt", "The sip counter has been reset");
			return { ok: true };
		case "rof-makker": {
			if (!s || s.type !== "kort" || s.lek !== "ring-of-fire" || !s.velgMakker) return { ok: true };
			if (meg.id !== s.velgMakker && !erVert) return feilL("ikke-tur", "Det er den som trakk åtteren som velger makker.", "Whoever drew the eight picks the mate.");
			const paa = String(h.paa || "");
			if (!data.spillere.some((p) => p.id === paa) || paa === s.velgMakker) return feilL("ugyldig", "Velg en annen spiller.", "Pick another player.");
			s.makkere = (s.makkere || []).filter(([a, b]) => !(a === s.velgMakker && b === paa || a === paa && b === s.velgMakker));
			s.makkere.push([s.velgMakker, paa]);
			melde(data, `🤝 ${navnPaa(data, s.velgMakker)} og ${navnPaa(data, paa)} er makkere – drikker den ene, drikker den andre!`, `🤝 ${navnPaa(data, s.velgMakker)} and ${navnPaa(data, paa)} are mates – when one drinks, so does the other!`);
			s.velgMakker = null;
			return { ok: true };
		}
		case "rof-trekk": {
			if (!s || s.type !== "kort" || !s.ring) return { feil: "feil-spill" };
			const tur = data.spillere[s.tur % Math.max(1, data.spillere.length)];
			if (tur && tur.id !== meg.id && !erVert) return feilL("ikke-tur", "Det er ikke din tur å trekke.", "It's not your turn to draw.");
			const plass = Math.round(Number(h.plass));
			if (!(plass >= 0 && plass < s.rekke.length) || s.tatt.includes(plass)) return { ok: true };
			const hvem = tur ? tur.id : meg.id;
			s.tatt.push(plass);
			s.pos = plass;
			s.nr++;
			s.sist = plass;
			const v = s.rekke[plass].v;
			if (v === "K") s.konger++;
			s.kort = visKort(s, data);
			if (h.brutt === true && !s.ringBrutt) {
				s.ringBrutt = true;
				s.bruddPlass = plass;
				s.brudd = {
					hvem,
					nr: s.nr,
					navn: navnPaa(data, hvem)
				};
				giSlurker(data, hvem, ROF_BRUDD);
				melde(data, `💥 ${navnPaa(data, hvem)} brøt ringen – drikk opp glasset! Resten av ringen er trygg.`, `💥 ${navnPaa(data, hvem)} broke the ring – finish your drink! The rest of the ring is safe.`);
			}
			if (v === "K") giSlurker(data, hvem, D["ring-of-fire"].konger[Math.min(s.konger, 4) - 1] || 5);
			if (v === "3") giSlurker(data, hvem, 1);
			if (v === "2") giUtdeling(data, hvem, 1);
			s.velgMakker = v === "8" && data.spillere.length >= 2 ? hvem : null;
			if (h.brutt === true && s.brudd && s.brudd.nr === s.nr) {
				data.rekord = data.rekord || {};
				const r = data.rekord.brudd || (data.rekord.brudd = {});
				r[hvem] = (r[hvem] || 0) + 1;
			}
			s.tur = (s.tur + 1) % Math.max(1, data.spillere.length);
			if (s.tatt.length >= s.rekke.length) {
				s.rekke = kortstokkFor(s.lek, s.modus);
				s.tatt = [];
				s.konger = 0;
				s.ringBrutt = false;
				s.bruddPlass = null;
				melde(data, "🔥 Ringen er tom – en ny ring er lagt ut", "🔥 The ring is empty – a new ring is laid out");
			}
			return { ok: true };
		}
		case "neste":
			if (!s || s.type !== "kort") return { feil: "feil-spill" };
			if (s.ring) return { ok: true };
			if (typeof h.pos === "number" && h.pos !== s.pos) return { ok: true };
			s.pos++;
			if (s.pos >= s.rekke.length) {
				s.rekke = kortstokkFor(s.lek, s.modus);
				s.pos = 0;
				s.konger = 0;
				melde(data, "Stokket på nytt", "Reshuffled");
			}
			if (s.tur !== null) s.tur = (s.tur + 1) % Math.max(1, data.spillere.length);
			if (s.lek === "ring-of-fire" && s.rekke[s.pos].v === "K") s.konger++;
			s.kort = visKort(s, data);
			if (s.lek === "ring-of-fire" && s.tur !== null) {
				const hvem = data.spillere[s.tur] && data.spillere[s.tur].id, v = s.rekke[s.pos].v;
				if (hvem && v === "K") giSlurker(data, hvem, D["ring-of-fire"].konger[Math.min(s.konger, 4) - 1] || 5);
				if (hvem && v === "3") giSlurker(data, hvem, 1);
				if (hvem && v === "2") giUtdeling(data, hvem, 1);
				s.velgMakker = hvem && v === "8" && data.spillere.length >= 2 ? hvem : null;
			}
			return { ok: true };
		case "stem":
			if (!s) return { feil: "feil-spill" };
			if (s.type === "mest") {
				if (s.fase !== "stem") return { ok: true };
				if (!data.spillere.some((p) => p.id === h.paa)) return { feil: "ukjent" };
				s.stemmer[meg.id] = h.paa;
				if (Object.keys(s.stemmer).length >= data.spillere.length) avgjorMest(data);
				return { ok: true };
			}
			if (s.type === "forraeder") {
				if (s.fase !== "stem" || meg.id === s.aktiv) return { ok: true };
				if (h.paa !== "sannhet" && h.paa !== "lyv") return { feil: "ukjent" };
				s.stemmer[meg.id] = h.paa;
				if (Object.keys(s.stemmer).length >= data.spillere.length - 1) avgjorForraeder(data);
				return { ok: true };
			}
			return { feil: "feil-spill" };
		case "svart":
			if (!s || s.type !== "forraeder" || s.fase !== "svar") return { ok: true };
			if (meg.id !== s.aktiv && !erVert) return { feil: "ikke-din-tur" };
			s.fase = "stem";
			settFrist(s, FRIST.forraeder);
			return { ok: true };
		case "avslor":
			if (!s) return { ok: true };
			if (s.type === "mest" && s.fase === "stem") {
				const mangler = data.spillere.length - Object.keys(s.stemmer).length;
				if (mangler > 0 && !fristUte(s)) return venter(s, mangler);
				avgjorMest(data);
			}
			if (s.type === "forraeder" && s.fase === "stem") {
				const mangler = data.spillere.length - 1 - Object.keys(s.stemmer).length;
				if (mangler > 0 && !fristUte(s)) return venter(s, mangler);
				avgjorForraeder(data);
			}
			return { ok: true };
		case "tid-ute":
			if (!s || !fristUte(s)) return { ok: true };
			if (s.type === "mest" && s.fase === "stem") avgjorMest(data);
			if (s.type === "forraeder" && s.fase === "stem") avgjorForraeder(data);
			return { ok: true };
		case "runde":
			if (!s) return { ok: true };
			if (s.type === "mest" && s.fase === "resultat") nyMestRunde(s);
			if (s.type === "forraeder" && s.fase === "avslort") nyForraederRunde(s, data);
			return { ok: true };
		case "merk": {
			if (!s || s.type !== "bingo") return { feil: "feil-spill" };
			if (!s.brett[meg.id]) {
				s.brett[meg.id] = nyttBrett(s);
				s.merket[meg.id] = Array(16).fill(false);
			}
			const i = Number(h.i);
			if (!(i >= 0 && i < 16)) return { feil: "ukjent" };
			const m = s.merket[meg.id];
			const foer = LINJER.filter((l) => l.every((k) => m[k])).length;
			m[i] = !m[i];
			const etter = LINJER.filter((l) => l.every((k) => m[k])).length;
			if (m.every(Boolean) && !s.bingo.includes(meg.id)) {
				s.bingo.push(meg.id);
				melde(data, `BINGO for ${meg.navn}! Alle andre drikker opp.`, `BINGO for ${meg.navn}! Everyone else finishes their drink.`);
			} else if (etter > foer) {
				s.rekker.push(meg.id);
				giUtdeling(data, meg.id, 2);
				melde(data, `${meg.navn} fikk rekke! Del ut to slurker.`, `${meg.navn} got a line! Give out two sips.`);
			}
			return { ok: true };
		}
		case "nytt-brett":
			if (!s || s.type !== "bingo") return { feil: "feil-spill" };
			s.brett[meg.id] = nyttBrett(s);
			s.merket[meg.id] = Array(16).fill(false);
			return { ok: true };
	}
	return { feil: "ukjent-handling" };
}
function avgjorMest(data) {
	const s = data.spill;
	const telling = {};
	Object.values(s.stemmer).forEach((id) => {
		telling[id] = (telling[id] || 0) + 1;
	});
	const liste = Object.entries(telling).map(([id, n]) => ({
		id,
		navn: navnPaa(data, id),
		stemmer: n
	})).sort((a, b) => b.stemmer - a.stemmer);
	liste.forEach((x) => giSlurker(data, x.id, x.stemmer));
	s.resultat = liste;
	s.fase = "resultat";
	if (liste[0]) melde(data, `${liste[0].navn} fikk flest stemmer (${liste[0].stemmer})`, `${liste[0].navn} got the most votes (${liste[0].stemmer})`);
}
function avgjorForraeder(data) {
	const s = data.spill;
	const feil = Object.entries(s.stemmer).filter(([, v]) => v !== s.hemmelig).map(([id]) => id);
	const antallStemmer = Object.keys(s.stemmer).length;
	s.drikker = [];
	if (antallStemmer && feil.length === 0) {
		giSlurker(data, s.aktiv, 3);
		s.drikker.push({
			id: s.aktiv,
			navn: navnPaa(data, s.aktiv),
			slurker: 3
		});
	}
	feil.forEach((id) => {
		giSlurker(data, id, 2);
		s.drikker.push({
			id,
			navn: navnPaa(data, id),
			slurker: 2
		});
	});
	s.fase = "avslort";
	melde(data, `${navnPaa(data, s.aktiv)} ${s.hemmelig === "lyv" ? "løy" : "sa sannheten"}!`, `${navnPaa(data, s.aktiv)} ${s.hemmelig === "lyv" ? "lied" : "told the truth"}!`);
}
/** Kvelden slik den lagres i sesongtabellen til en gjeng: bare navn og tall. */
function kveldForGjeng(data) {
	return {
		spillere: data.spillere.map((p) => ({
			navn: p.navn,
			slurker: p.slurker || 0,
			quiz: p.quiz || 0,
			sendt: p.sendt || 0,
			mottatt: p.mottatt || 0
		})),
		leker: (data.historikk || []).slice(-40).map((x) => tr(x, "no")),
		minutter: Math.max(1, Math.round(((data.ferdig || Date.now()) - (data.laget || Date.now())) / 6e4)),
		alkoholfri: !!data.alkoholfri
	};
}
/** Gjengkveld: den som ikke er medlem, venter på at verten eller et medlem slipper hen inn. */
function venteInn(data, navn, lang = "no") {
	data.venter = (data.venter || []).filter((v) => Date.now() - v.t < 216e5).slice(-9);
	const v = {
		id: nyId(),
		navn,
		pollett: nyPollett(),
		lang: rensLang(lang),
		t: Date.now()
	};
	data.venter.push(v);
	melde(data, `🚪 ${navn} vil bli med – slipp inn?`, `🚪 ${navn} wants to join – let them in?`);
	return { spiller: v };
}
function finnVenter(data, id, pollett) {
	const v = (data.venter || []).find((x) => x.id === id);
	return v && v.pollett === pollett ? v : null;
}
function blimed(data, navn, lang = "no") {
	return leggTil(data, {
		id: nyId(),
		pollett: nyPollett(),
		lang: rensLang(lang)
	}, navn);
}
function leggTil(data, fra, navn) {
	if (data.spillere.length >= 16) return { feil: "fullt" };
	if (data.spillere.length >= 4 && !romHarPluss(data)) {
		data.fullForsok = Date.now();
		return feilL("fullt-gratis", `Rommet er fullt – gratisversjonen har plass til 4 telefoner. Be verten låse opp med Pluss, så kan dere bli opptil 16.`, `The room is full – the free version has room for 4 phones. Ask the host to unlock Plus and you can be up to 16.`, { lagre: true });
	}
	let n = navn, i = 2;
	while (data.spillere.some((p) => p.navn.toLowerCase() === n.toLowerCase())) n = `${navn} ${i++}`;
	const p = {
		id: fra.id,
		navn: n,
		pollett: fra.pollett,
		slurker: 0,
		lang: rensLang(fra.lang)
	};
	data.spillere.push(p);
	const s = data.spill;
	if (s && s.type === "bingo") {
		s.brett[p.id] = nyttBrett(s);
		s.merket[p.id] = Array(16).fill(false);
	}
	if (data.oppdrag && data.oppdrag.paa) nyttOppdrag(data, p.id);
	nySpillerIBors(data, p.id);
	melde(data, `${n} ble med`, `${n} joined`);
	return { spiller: p };
}
function finnSpiller(data, id, pollett) {
	if (!id || !pollett) return null;
	const p = data.spillere.find((x) => x.id === id);
	if (!p) return null;
	if (p.pollett.length !== pollett.length) return null;
	let diff = 0;
	for (let i = 0; i < pollett.length; i++) diff |= p.pollett.charCodeAt(i) ^ pollett.charCodeAt(i);
	return diff === 0 ? p : null;
}
function gyldigKode(k) {
	return typeof k === "string" && /^[A-Z0-9]{4,6}$/.test(k);
}
var SOS = [
	"hvemskrev",
	"bloff",
	"samme",
	"spion",
	"skal",
	"pannekort"
];
var EKSTRA = [
	"opus",
	"overunder",
	"veddelopet",
	"pyramiden",
	"gris",
	"president",
	"regelfabrikken",
	"tosannheter",
	"bussruta",
	"yatzy",
	"nyhetsrunden",
	...SOS
];
var REAKSJONER = [
	"🍻",
	"😂",
	"🔥",
	"😱",
	"👏",
	"🫡"
];
var EKSTRA_INFO = [
	[
		"hvemskrev",
		"Ukjent avsender",
		"Unknown sender",
		"Alle svarer anonymt på samme spørsmål. Så gjetter dere hvem som skrev hva.",
		"Everyone answers the same question anonymously. Then you guess who wrote what."
	],
	[
		"bloff",
		"Skrøna",
		"Tall tales",
		"Finn på et troverdig feil svar. Lur de andre – og finn det ekte.",
		"Make up a believable wrong answer. Fool the others – and spot the real one."
	],
	[
		"samme",
		"Saueflokken",
		"The herd",
		"Alle skriver ett ord i hemmelighet. Unike svar drikker.",
		"Everyone secretly writes one word. Unique answers drink."
	],
	[
		"spion",
		"Muldvarpen",
		"The mole",
		"Alle vet hvor dere er – bortsett fra muldvarpen. Still spørsmål og avslør hen.",
		"Everyone knows where you are – except the mole. Ask questions and unmask them."
	],
	[
		"pannekort",
		"Hvem er jeg?",
		"Who am I?",
		"Skriv et ord til den du får tildelt. Du ser alles ord – bortsett fra ditt eget.",
		"Write a word for the person you're assigned. You see everyone's word – except your own."
	],
	[
		"skal",
		"Skålsprinten",
		"Cheers sprint",
		"Trykk når det står SKÅL! Treigest drikker. For tidlig drikker dobbelt.",
		"Tap when it says CHEERS! Slowest drinks. Too early drinks double."
	],
	[
		"bussruta",
		"Bussruta",
		"Ride the bus",
		"Fire spørsmål hver på egen telefon, så pyramiden – og taperen kjører bussen.",
		"Four questions each on your own phone, then the pyramid – and the loser rides the bus."
	],
	[
		"yatzy",
		"Drikke-Yatzy",
		"Drinking Yahtzee",
		"Trill på din telefon når det er din tur. Alle ser terningene og blokka.",
		"Roll on your phone when it's your turn. Everyone sees the dice and the scorecard."
	],
	[
		"tosannheter",
		"To sannheter og en løgn",
		"Two truths and a lie",
		"Én skriver tre påstander i hemmelighet. Resten stemmer på løgnen fra sin telefon.",
		"One player secretly writes three statements. Everyone else votes for the lie on their phone."
	],
	[
		"regelfabrikken",
		"Hjemmesnekra",
		"Homemade",
		"Alle skriver så mange drikkekort de rekker på sin telefon. Så stokkes alt og trekkes.",
		"Everyone writes as many drinking cards as they can on their phone. Then it all gets shuffled and drawn."
	],
	[
		"overunder",
		"Over eller under",
		"Higher or lower",
		"Den som har tur gjetter på sin telefon. Feil = drikk hele bunken.",
		"Whoever has the turn guesses on their phone. Wrong = drink the whole pile."
	],
	[
		"veddelopet",
		"Veddeløpet",
		"Horse race",
		"Alle vedder på sin telefon, så kjøres løpet.",
		"Everyone bets on their phone, then the race is on."
	],
	[
		"pyramiden",
		"Pyramiden",
		"Pyramid",
		"Fire skjulte kort hver. Bløff eller si sannheten – og utfordre de andre.",
		"Four hidden cards each. Bluff or tell the truth – and call out the others."
	],
	[
		"gris",
		"Gris",
		"Pig",
		"Send kort til venstre til noen har fire like. Sistemann på nesa drikker.",
		"Pass cards to the left until someone has four of a kind. Last one to touch their nose drinks."
	],
	[
		"president",
		"President",
		"President",
		"Bli kvitt kortene først. Toere er høyest og rydder bordet.",
		"Get rid of your cards first. Twos are highest and clear the table."
	],
	[
		"opus",
		"Opus",
		"Opus",
		"",
		""
	]
];
var EKSTRA_NAVN = Object.fromEntries(EKSTRA_INFO.map((x) => [x[0], L(x[1], x[2])]));
EKSTRA_NAVN.nyhetsrunden = L("Nyhetsrunden", "Nyhetsrunden (Norwegian news quiz)");
function ekstraLeker(lang = "no") {
	const en = rensLang(lang) === "en";
	const nr = publiserteRunder().slice(0, 150).map((r) => ({
		v: rundeId(r),
		t: (en ? "Week " : "Uke ") + r.uke + (r.aar !== (/* @__PURE__ */ new Date()).getFullYear() ? " " + r.aar : "")
	}));
	const info = (id, moduser = []) => {
		const x = EKSTRA_INFO.find((y) => y[0] === id);
		return {
			id,
			navn: en ? x[2] : x[1],
			type: id,
			moduser,
			om: en ? x[4] : x[3]
		};
	};
	const sek = en ? "sec" : "sek";
	return [
		...nr.length ? [{
			id: "nyhetsrunden",
			navn: tr(EKSTRA_NAVN.nyhetsrunden, en ? "en" : "no"),
			type: "nyhetsrunden",
			moduser: nr,
			om: en ? "The host reads out this week's questions and everyone answers on their own phone – then you see who missed. The questions are in Norwegian." : "Verten leser opp ukas spørsmål. Alle svarer på sin egen telefon – så ser dere hvem som bommet."
		}] : [],
		info("hvemskrev"),
		info("bloff"),
		info("samme"),
		info("spion"),
		info("pannekort"),
		info("skal"),
		info("bussruta"),
		info("yatzy"),
		info("tosannheter"),
		info("regelfabrikken", [
			{
				v: "45",
				t: "45 " + sek
			},
			{
				v: "60",
				t: "60 " + sek
			},
			{
				v: "90",
				t: "90 " + sek
			}
		]),
		info("overunder"),
		info("veddelopet"),
		info("pyramiden"),
		info("gris"),
		info("president")
	];
}
function kortstokk52() {
	const s = [];
	[
		"♥",
		"♦",
		"♠",
		"♣"
	].forEach((f) => {
		for (let v = 2; v <= 14; v++) s.push({
			v,
			f
		});
	});
	return stokk(s);
}
function vnavn(v) {
	return v <= 10 ? String(v) : {
		11: "Kn",
		12: "D",
		13: "K",
		14: "A"
	}[v];
}
function vnavnEn(v) {
	return v <= 10 ? String(v) : {
		11: "J",
		12: "Q",
		13: "K",
		14: "A"
	}[v];
}
function aktiveIder(data, alle = false) {
	const ider = data.spillere.map((p) => p.id);
	const h = !alle && data.spill && data.spill.hender;
	return h ? ider.filter((id) => h[id]) : ider;
}
function startEkstra(data, lek, modus = "") {
	const n = data.spillere.length, ider = aktiveIder(data, true);
	if (lek === "bussruta" || lek === "yatzy" || lek === "nyhetsrunden") return startNye(data, lek, modus, ider);
	if (SOS.includes(lek)) return startSos(data, lek, ider);
	if (lek === "tosannheter") {
		if (n < 2) return feilL("for-faa", "Trenger minst to spillere.", "Needs at least two players.");
		data.spill = {
			type: "tosannheter",
			lek,
			navn: EKSTRA_NAVN.tosannheter,
			aktiv: ider[0],
			fase: "skriv",
			pastander: [],
			logn: -1,
			stemmer: {},
			runde: 1
		};
	} else if (lek === "regelfabrikken") {
		const sek = [
			45,
			60,
			90
		].includes(Number(modus)) ? Number(modus) : 60;
		data.spill = {
			type: "regelfabrikken",
			lek,
			navn: EKSTRA_NAVN.regelfabrikken,
			modus: L(sek + " sek", sek + " sec"),
			fase: "klar",
			frist: null,
			sek,
			kort: {},
			med: {},
			rekke: [],
			pos: 0
		};
	} else if (lek === "opus") data.spill = {
		type: "opus",
		lek,
		navn: EKSTRA_NAVN.opus,
		holder: ider[0],
		kast: null,
		antall: 0,
		nr: 0
	};
	else if (lek === "overunder") {
		const st = kortstokk52();
		data.spill = {
			type: "overunder",
			lek,
			navn: EKSTRA_NAVN.overunder,
			stokk: st,
			kort: st.pop(),
			bunke: 1,
			tur: 0,
			sist: null
		};
	} else if (lek === "veddelopet") {
		const st = kortstokk52().filter((k) => k.v !== 14);
		data.spill = {
			type: "veddelopet",
			lek,
			navn: EKSTRA_NAVN.veddelopet,
			fase: "vedd",
			veddemaal: {},
			stokk: st,
			bane: st.splice(0, 7),
			snudd: [],
			pos: {
				"♥": 0,
				"♠": 0,
				"♦": 0,
				"♣": 0
			},
			sist: null,
			vinner: null
		};
		settFrist(data.spill, FRIST.veddelopet);
	} else if (lek === "pyramiden") {
		if (n < 2) return feilL("for-faa", "Pyramiden trenger minst to spillere.", "Pyramid needs at least two players.");
		const st = kortstokk52();
		const hender = {};
		ider.forEach((id) => {
			hender[id] = st.splice(0, 4);
		});
		data.spill = {
			type: "pyramiden",
			lek,
			navn: EKSTRA_NAVN.pyramiden,
			hender,
			pyr: st.splice(0, 15),
			pos: 0,
			pastander: []
		};
	} else if (lek === "gris") {
		if (n < 3) return feilL("for-faa", "Gris trenger minst tre spillere.", "Pig needs at least three players.");
		data.spill = {
			type: "gris",
			lek,
			navn: EKSTRA_NAVN.gris,
			bokstaver: {}
		};
		nyGrisRunde(data);
	} else if (lek === "president") {
		if (n < 3) return feilL("for-faa", "President trenger minst tre spillere.", "President needs at least three players.");
		nyPresidentRunde(data, null);
	} else return { feil: "ukjent-lek" };
	melde(data, `Nytt spill: ${tr(data.spill.navn, "no")}`, `New game: ${tr(data.spill.navn, "en")}`);
	return { ok: true };
}
function nyGrisRunde(data) {
	const s = data.spill, ider = aktiveIder(data, true);
	const verdier = stokk([
		14,
		13,
		12,
		11,
		10,
		9,
		8,
		7,
		6,
		5,
		4,
		3,
		2
	]).slice(0, ider.length);
	const kort = [];
	verdier.forEach((v) => [
		"♥",
		"♦",
		"♠",
		"♣"
	].forEach((f) => kort.push({
		v,
		f
	})));
	const bl = stokk(kort);
	s.hender = {};
	ider.forEach((id) => {
		s.hender[id] = bl.splice(0, 4);
		if (s.bokstaver[id] === void 0) s.bokstaver[id] = 0;
	});
	s.valgt = {};
	s.fase = "send";
	s.neser = [];
	s.runde = (s.runde || 0) + 1;
}
function fireLike(h) {
	return h.length === 4 && h.every((k) => k.v === h[0].v);
}
var RANG = (v) => v === 2 ? 15 : v;
function nyPresidentRunde(data, forrige) {
	const ider = aktiveIder(data, true), st = kortstokk52();
	const hender = {};
	ider.forEach((id) => {
		hender[id] = [];
	});
	st.forEach((k, i) => hender[ider[i % ider.length]].push(k));
	ider.forEach((id) => hender[id].sort((a, b) => RANG(a.v) - RANG(b.v)));
	data.spill = {
		type: "president",
		lek: "president",
		navn: EKSTRA_NAVN.president,
		hender,
		bord: [],
		bordAv: null,
		pass: [],
		tur: 0,
		ferdige: [],
		titler: forrige || {},
		runde: (data.spill && data.spill.runde || 0) + 1
	};
}
function presTurVidere(data) {
	const s = data.spill, ider = aktiveIder(data);
	for (let i = 1; i <= ider.length; i++) {
		const j = (s.tur + i) % ider.length;
		if (!s.ferdige.includes(ider[j])) {
			s.tur = j;
			return;
		}
	}
}
function ekstraHandling(data, meg, h) {
	const s = data.spill;
	if (!s || !EKSTRA.includes(s.type)) return null;
	if (s.type === "bussruta" || s.type === "yatzy" || s.type === "nyhetsrunden") return nyeHandling(data, meg, h);
	if (SOS.includes(s.type)) return sosHandling(data, meg, h);
	const ider = aktiveIder(data);
	ider.indexOf(meg.id);
	switch (s.type) {
		case "tosannheter":
			if (h.handling === "pastander") {
				if (meg.id !== s.aktiv || s.fase !== "skriv") return { ok: true };
				const p = (Array.isArray(h.p) ? h.p : []).map((x) => String(x || "").replace(/[\u0000-\u001f<>]/g, "").trim().slice(0, 120));
				const l = Number(h.logn);
				if (p.length !== 3 || p.some((x) => !x) || !(l >= 0 && l < 3)) return feilL("ugyldig", "Skriv tre påstander og merk løgnen.", "Write three statements and mark the lie.");
				const rekkef = stokk([
					0,
					1,
					2
				]);
				s.pastander = rekkef.map((i) => p[i]);
				s.logn = rekkef.indexOf(l);
				s.fase = "stem";
				s.stemmer = {};
				settFrist(s, FRIST.tosannheter);
				melde(data, `${meg.navn} har skrevet – hvilken er løgnen?`, `${meg.navn} is done writing – which one is the lie?`);
				return { ok: true };
			}
			if (h.handling === "stem") {
				if (s.fase !== "stem" || meg.id === s.aktiv) return { ok: true };
				const v = Number(h.paa);
				if (!(v >= 0 && v < 3)) return { feil: "ukjent" };
				s.stemmer[meg.id] = v;
				if (Object.keys(s.stemmer).length >= ider.length - 1) avgjorTo(data);
				return { ok: true };
			}
			if (h.handling === "avslor" || h.handling === "tid-ute") {
				if (s.fase !== "stem") return { ok: true };
				const mangler = ider.length - 1 - Object.keys(s.stemmer).length;
				if (mangler > 0 && !fristUte(s)) return h.handling === "tid-ute" ? { ok: true } : venter(s, mangler);
				avgjorTo(data);
				return { ok: true };
			}
			if (h.handling === "runde") {
				if (s.fase !== "avslort") return { ok: true };
				s.aktiv = ider[(ider.indexOf(s.aktiv) + 1) % ider.length];
				s.fase = "skriv";
				s.pastander = [];
				s.logn = -1;
				s.stemmer = {};
				s.runde++;
				return { ok: true };
			}
			return null;
		case "regelfabrikken":
			if (h.handling === "startklokke") {
				if (s.fase !== "klar") return { ok: true };
				if (meg.id !== data.vert) return feilL("bare-vert", "Verten starter klokka.", "The host starts the clock.");
				s.fase = "skriv";
				s.frist = Date.now() + s.sek * 1e3 + 3e3;
				melde(data, "Klokka går – skriv!", "The clock is running – write!");
				return { ok: true };
			}
			if (h.handling === "skriv") {
				if (s.fase !== "skriv") return feilL("for-sent", "Tiden er ute!", "Time's up!");
				if (Date.now() > s.frist + 2e3) return feilL("for-sent", "Tiden er ute!", "Time's up!");
				const tekst = String(h.tekst || "").replace(/[\u0000-\u001f<>]/g, "").replace(/\s+/g, " ").trim().slice(0, 140);
				if (!tekst) return { ok: true };
				const mine = s.kort[meg.id] || (s.kort[meg.id] = []);
				if (mine.length >= 40) return feilL("fullt", "Maks 40 kort hver.", "Max 40 cards each.");
				mine.push(tekst);
				return { ok: true };
			}
			if (h.handling === "rf-legg-til") {
				if (s.fase !== "klar" && s.fase !== "skriv") return feilL("for-sent", "Kortene er allerede stokket.", "The cards have already been shuffled.");
				const nye = rensKort(h.kort);
				const med = s.med || (s.med = {});
				const mine = med[meg.id] || (med[meg.id] = []);
				nye.forEach((t) => {
					if (mine.length < 60 && !mine.includes(t)) mine.push(t);
				});
				return { ok: true };
			}
			if (h.handling === "stokk") {
				if (s.fase !== "skriv") return { ok: true };
				if (Date.now() < s.frist - 3e3 && meg.id !== data.vert) return feilL("bare-vert", "Vent til tiden er ute.", "Wait until time's up.");
				const alle = [];
				Object.values(s.kort).forEach((l) => l.forEach((t) => alle.push(t)));
				Object.values(s.med || {}).forEach((l) => l.forEach((t) => alle.push(t)));
				if (!alle.length) return feilL("tom", "Ingen har skrevet noe ennå.", "Nobody has written anything yet.");
				s.rekke = stokk(alle);
				s.pos = 0;
				s.fase = "trekk";
				melde(data, alle.length + " kort er stokket. Trekk!", alle.length + (alle.length === 1 ? " card" : " cards") + " shuffled. Draw!");
				return { ok: true };
			}
			if (h.handling === "neste") {
				if (s.fase !== "trekk") return { ok: true };
				if (typeof h.pos === "number" && h.pos !== s.pos) return { ok: true };
				s.pos++;
				if (s.pos >= s.rekke.length) {
					s.rekke = stokk(s.rekke);
					s.pos = 0;
					melde(data, "Alle kortene er trukket – stokket på nytt.", "All the cards have been drawn – reshuffled.");
				}
				return { ok: true };
			}
			if (h.handling === "nytt") {
				if (s.egen) {
					s.rekke = stokk(s.rekke);
					s.pos = 0;
					melde(data, "Stokket på nytt.", "Reshuffled.");
					return { ok: true };
				}
				return startEkstra(data, "regelfabrikken", String(s.sek));
			}
			return null;
		case "opus":
			if (h.handling === "kast") {
				if (meg.id !== s.holder) return feilL("ikke-din-tur", "Det er ikke du som har terningen.", "You don't have the die.");
				s.kast = 1 + tilfeldig(6);
				s.antall++;
				s.nr++;
				if (s.kast === 6) {
					s.holder = ider[(ider.indexOf(s.holder) + 1) % ider.length];
					s.fra = meg.id;
				}
				return { ok: true };
			}
			if (h.handling === "drop") {
				giSlurker(data, s.holder, 5);
				melde(data, `Droppet! ${navnPaa(data, s.holder)} holdt terningen – drikk opp!`, `Dropped! ${navnPaa(data, s.holder)} had the die – finish your drink!`);
				return { ok: true };
			}
			return null;
		case "overunder": {
			if (h.handling !== "gjett") return null;
			if (ider[s.tur % ider.length] !== meg.id) return feilL("ikke-din-tur", "Vent på tur.", "Wait for your turn.");
			if (!s.stokk.length) s.stokk = kortstokk52();
			const nytt = s.stokk.pop(), riktig = h.paa === "over" ? nytt.v > s.kort.v : nytt.v < s.kort.v;
			s.sist = {
				fra: s.kort,
				til: nytt,
				riktig,
				hvem: meg.id,
				bunke: s.bunke
			};
			if (riktig) s.bunke++;
			else {
				giSlurker(data, meg.id, s.bunke);
				melde(data, `${meg.navn} bommet – drikk ${s.bunke}!`, `${meg.navn} missed – drink ${s.bunke}!`);
				s.bunke = 1;
			}
			s.kort = nytt;
			s.tur = (s.tur + 1) % ider.length;
			return { ok: true };
		}
		case "veddelopet":
			if (h.handling === "vedd" && s.fase === "vedd") {
				if (![
					"♥",
					"♠",
					"♦",
					"♣"
				].includes(h.farge)) return { feil: "ukjent" };
				s.veddemaal[meg.id] = {
					farge: h.farge,
					slurker: Math.max(1, Math.min(10, Number(h.slurker) || 2))
				};
				return { ok: true };
			}
			if ((h.handling === "lop" || h.handling === "tid-ute") && s.fase === "vedd") {
				const mangler = data.spillere.length - Object.keys(s.veddemaal).length;
				if (mangler > 0 && !fristUte(s)) return h.handling === "tid-ute" ? { ok: true } : venter(s, mangler);
				if (h.handling === "tid-ute" && !Object.keys(s.veddemaal).length) return { ok: true };
				s.fase = "lop";
				s.frist = null;
				melde(data, "Løpet er i gang!", "And they're off!");
				return { ok: true };
			}
			if (h.handling === "snu" && s.fase === "lop") {
				if (!s.stokk.length) s.stokk = kortstokk52().filter((k) => k.v !== 14);
				const k = s.stokk.pop();
				s.sist = k;
				s.pos[k.f]++;
				const minst = Math.min(...[
					"♥",
					"♠",
					"♦",
					"♣"
				].map((f) => s.pos[f]));
				for (let i = 0; i < 7; i++) if (!s.snudd[i] && minst >= i + 1) {
					s.snudd[i] = true;
					const f = s.bane[i].f;
					if (s.pos[f] > 0 && s.pos[f] <= 7) s.pos[f]--;
				}
				const vinner = [
					"♥",
					"♠",
					"♦",
					"♣"
				].find((f) => s.pos[f] >= 8);
				if (vinner) {
					s.vinner = vinner;
					s.fase = "ferdig";
					Object.entries(s.veddemaal).forEach(([id, v]) => {
						if (v.farge !== vinner) giSlurker(data, id, v.slurker);
						else giUtdeling(data, id, v.slurker * 2);
					});
					melde(data, `${{
						"♥": "Hjerter",
						"♠": "Spar",
						"♦": "Ruter",
						"♣": "Kløver"
					}[vinner]} vant løpet!`, `${{
						"♥": "Hearts",
						"♠": "Spades",
						"♦": "Diamonds",
						"♣": "Clubs"
					}[vinner]} won the race!`);
				}
				return { ok: true };
			}
			if (h.handling === "nytt") return startEkstra(data, "veddelopet");
			return null;
		case "pyramiden":
			if (h.handling === "snu") {
				if (s.pos >= 15) return { ok: true };
				s.pastander.filter((p) => p.pos === s.pos - 1 && !p.avgjort).forEach((p) => {
					const hand = s.hender[p.id] || [];
					const i = hand.findIndex((k) => k.v === s.pyr[p.pos].v);
					if (i !== -1) hand.splice(i, 1);
					p.avgjort = "godtatt";
				});
				s.pos++;
				return { ok: true };
			}
			if (h.handling === "pastand") {
				if (!s.hender[meg.id]) return {
					feil: "ikke-med",
					melding: "Du kom inn midt i runden – du er med fra neste.",
					en: "You joined mid-round – you’re in from the next one."
				};
				if (s.pos < 1) return { ok: true };
				const pos = s.pos - 1;
				if (s.pastander.some((p) => p.pos === pos && p.id === meg.id)) return { ok: true };
				const rad = pos < 5 ? 1 : pos < 9 ? 2 : pos < 12 ? 3 : pos < 14 ? 4 : 5;
				s.pastander.push({
					id: meg.id,
					pos,
					rad,
					avgjort: null
				});
				melde(data, `${meg.navn} sier de har ${vnavn(s.pyr[pos].v)} – deler ut ${rad}!`, `${meg.navn} says they have ${vnavnEn(s.pyr[pos].v)} – giving out ${rad}!`);
				return { ok: true };
			}
			if (h.handling === "utfordre") {
				const p = s.pastander.find((x) => x.id === h.paa && x.pos === s.pos - 1 && !x.avgjort);
				if (!p || p.id === meg.id) return { ok: true };
				const hand = s.hender[p.id] || [], i = hand.findIndex((k) => k.v === s.pyr[p.pos].v);
				if (i !== -1) {
					hand.splice(i, 1);
					giSlurker(data, meg.id, p.rad * 2);
					p.avgjort = "sant";
					melde(data, `${navnPaa(data, p.id)} hadde kortet! ${meg.navn} drikker ${p.rad * 2}.`, `${navnPaa(data, p.id)} had the card! ${meg.navn} drinks ${p.rad * 2}.`);
				} else {
					giSlurker(data, p.id, p.rad * 2);
					p.avgjort = "bløff";
					melde(data, `${navnPaa(data, p.id)} bløffet! Drikk ${p.rad * 2}.`, `${navnPaa(data, p.id)} was bluffing! Drink ${p.rad * 2}.`);
				}
				return { ok: true };
			}
			if (h.handling === "nytt") return startEkstra(data, "pyramiden");
			return null;
		case "gris":
			if (s.hender && !s.hender[meg.id] && h.handling !== "nytt") return { ok: true };
			if (h.handling === "velg" && s.fase === "send") {
				const i = Number(h.i);
				if (!(i >= 0 && i < 4)) return { feil: "ukjent" };
				s.valgt[meg.id] = i;
				if (ider.every((id) => s.valgt[id] !== void 0)) {
					const sendt = ider.map((id) => s.hender[id].splice(s.valgt[id], 1)[0]);
					ider.forEach((id, j) => {
						s.hender[id].push(sendt[(j - 1 + ider.length) % ider.length]);
					});
					s.valgt = {};
				}
				return { ok: true };
			}
			if (h.handling === "nese") {
				if (s.fase === "ferdig" || s.neser.includes(meg.id)) return { ok: true };
				if (s.fase === "send") {
					if (!fireLike(s.hender[meg.id])) {
						s.bokstaver[meg.id]++;
						melde(data, `${meg.navn} tok seg på nesa for tidlig – får en bokstav!`, `${meg.navn} touched their nose too early – gets a letter!`);
						if (s.bokstaver[meg.id] >= 4) {
							melde(data, `${meg.navn} er GRIS! Ta en shot.`, `${meg.navn} spelled PIGS! Take a shot.`);
							s.bokstaver[meg.id] = 0;
						}
						return { ok: true };
					}
					s.fase = "nese";
				}
				s.neser.push(meg.id);
				if (s.neser.length >= ider.length - 1) {
					const taper = ider.find((id) => !s.neser.includes(id));
					s.bokstaver[taper]++;
					const b = "GRIS".slice(0, s.bokstaver[taper]), bEn = "PIGS".slice(0, s.bokstaver[taper]);
					melde(data, `${navnPaa(data, taper)} var sist på nesa – ${b}!` + (s.bokstaver[taper] >= 4 ? " Ta en shot!" : ""), `${navnPaa(data, taper)} was last to touch their nose – ${bEn}!` + (s.bokstaver[taper] >= 4 ? " Take a shot!" : ""));
					if (s.bokstaver[taper] >= 4) s.bokstaver[taper] = 0;
					s.fase = "ferdig";
					s.taper = taper;
				}
				return { ok: true };
			}
			if (h.handling === "nytt") {
				nyGrisRunde(data);
				return { ok: true };
			}
			return null;
		case "president": {
			const turId = ider[s.tur];
			if (h.handling === "legg" || h.handling === "pass") {
				if (turId !== meg.id) return feilL("ikke-din-tur", "Vent på tur.", "Wait for your turn.");
				const hand = s.hender[meg.id];
				if (h.handling === "pass") {
					if (!s.bord.length) return feilL("ugyldig", "Du starter – legg ut noe.", "You're starting – play something.");
					if (!s.pass.includes(meg.id)) s.pass.push(meg.id);
				} else {
					const valg = Array.isArray(h.kort) ? [...new Set(h.kort.map(Number))].filter((i) => i >= 0 && i < hand.length) : [];
					if (!valg.length) return feilL("ugyldig", "Velg kort.", "Pick some cards.");
					const kort = valg.map((i) => hand[i]);
					if (!kort.every((k) => k.v === kort[0].v)) return feilL("ugyldig", "Kortene må være like.", "The cards have to match.");
					if (s.bord.length && (kort.length !== s.bord.length || RANG(kort[0].v) <= RANG(s.bord[0].v))) return feilL("ugyldig", `Legg ${s.bord.length} kort som er høyere.`, `Play ${s.bord.length} ${s.bord.length === 1 ? "card" : "cards"} that ${s.bord.length === 1 ? "is" : "are"} higher.`);
					s.hender[meg.id] = hand.filter((_, i) => !valg.includes(i));
					s.bord = kort;
					s.bordAv = meg.id;
					s.pass = [];
					if (!s.hender[meg.id].length) {
						s.ferdige.push(meg.id);
						melde(data, `${meg.navn} er tom for kort!`, `${meg.navn} is out of cards!`);
					}
					if (kort[0].v === 2) {
						s.bord = [];
						s.pass = [];
						melde(data, `${meg.navn} la toer og rydder bordet.`, `${meg.navn} played a two and clears the table.`);
						if (s.hender[meg.id].length) return { ok: true };
					}
				}
				const igjen = ider.filter((id) => !s.ferdige.includes(id));
				if (igjen.length <= 1) {
					if (igjen.length === 1) s.ferdige.push(igjen[0]);
					const t = {};
					t[s.ferdige[0]] = L("President", "President");
					t[s.ferdige[s.ferdige.length - 1]] = L("Rævkjører", "Scumbag");
					if (s.ferdige.length > 3) {
						t[s.ferdige[1]] = L("Visepresident", "Vice President");
						t[s.ferdige[s.ferdige.length - 2]] = L("Viserævkjører", "Vice Scumbag");
					}
					s.titler = t;
					s.fase = "ferdig";
					melde(data, `${navnPaa(data, s.ferdige[0])} er President! ${navnPaa(data, s.ferdige[s.ferdige.length - 1])} er rævkjører.`, `${navnPaa(data, s.ferdige[0])} is President! ${navnPaa(data, s.ferdige[s.ferdige.length - 1])} is the Scumbag.`);
					return { ok: true };
				}
				const maaSvare = igjen.filter((id) => id !== s.bordAv);
				if (s.bord.length && maaSvare.every((id) => s.pass.includes(id))) {
					s.bord = [];
					s.pass = [];
					const idx = ider.indexOf(s.bordAv);
					if (!s.ferdige.includes(s.bordAv)) {
						s.tur = idx;
						melde(data, `Ingen gikk over – ${navnPaa(data, s.bordAv)} starter på nytt.`, `Nobody went higher – ${navnPaa(data, s.bordAv)} starts again.`);
						return { ok: true };
					}
					s.tur = idx;
				}
				presTurVidere(data);
				return { ok: true };
			}
			if (h.handling === "nytt") {
				nyPresidentRunde(data, s.titler);
				return { ok: true };
			}
			return null;
		}
	}
	return null;
}
function avgjorTo(data) {
	const s = data.spill;
	let riktige = 0;
	s.drikker = [];
	Object.entries(s.stemmer).forEach(([id, v]) => {
		if (v === s.logn) riktige++;
		else {
			giSlurker(data, id, 1);
			s.drikker.push({
				navn: navnPaa(data, id),
				slurker: 1
			});
		}
	});
	if (riktige) {
		giSlurker(data, s.aktiv, riktige);
		s.drikker.push({
			navn: navnPaa(data, s.aktiv),
			slurker: riktige
		});
	}
	s.fase = "avslort";
	melde(data, `Løgnen var: «${s.pastander[s.logn]}»`, `The lie was: “${s.pastander[s.logn]}”`);
}
function ekstraVisning(s, meg, data) {
	if (s.type === "bussruta" || s.type === "yatzy" || s.type === "nyhetsrunden") return nyeVisning(s, meg, data);
	if (SOS.includes(s.type)) return sosVisning(s, meg, data);
	const ider = aktiveIder(data);
	if (s.type === "tosannheter") return {
		aktiv: s.aktiv,
		fase: s.fase,
		pastander: s.pastander,
		harStemt: Object.keys(s.stemmer),
		minStemme: meg ? s.stemmer[meg.id] ?? null : null,
		logn: s.fase === "avslort" ? s.logn : null,
		stemmer: s.fase === "avslort" ? s.stemmer : null,
		drikker: s.fase === "avslort" ? s.drikker : null
	};
	if (s.type === "regelfabrikken") return {
		fase: s.fase,
		frist: s.frist,
		naa: Date.now(),
		sek: s.sek,
		mineKort: meg ? s.kort[meg.id] || [] : [],
		mineMed: meg && s.med ? (s.med[meg.id] || []).length : 0,
		antall: Object.fromEntries(data.spillere.map((p) => [p.id, (s.kort[p.id] || []).length + ((s.med || {})[p.id] || []).length])),
		kortet: s.fase === "trekk" ? s.rekke[s.pos] : null,
		pos: s.pos,
		egen: !!s.egen,
		alleKort: s.fase === "trekk" && meg ? s.rekke : null,
		totalt: s.fase === "trekk" ? s.rekke.length : Object.values(s.kort).concat(Object.values(s.med || {})).reduce((n, l) => n + l.length, 0)
	};
	if (s.type === "opus") return {
		holder: s.holder,
		kast: s.kast,
		antall: s.antall,
		nr: s.nr,
		fra: s.fra || null
	};
	if (s.type === "overunder") return {
		kort: s.kort,
		bunke: s.bunke,
		tur: ider[s.tur % ider.length],
		sist: s.sist,
		igjen: s.stokk.length
	};
	if (s.type === "veddelopet") return {
		fase: s.fase,
		pos: s.pos,
		sist: s.sist,
		vinner: s.vinner,
		bane: s.bane.map((k, i) => s.snudd[i] ? k : null),
		veddemaal: s.veddemaal,
		mittVeddemaal: meg ? s.veddemaal[meg.id] || null : null
	};
	if (s.type === "pyramiden") return {
		pos: s.pos,
		pyr: s.pyr.slice(0, s.pos),
		minHand: meg ? s.hender[meg.id] : null,
		antall: Object.fromEntries(Object.entries(s.hender).map(([id, h]) => [id, h.length])),
		pastander: s.pastander.filter((p) => p.pos === s.pos - 1).map((p) => ({
			id: p.id,
			rad: p.rad,
			avgjort: p.avgjort
		}))
	};
	if (s.type === "gris") return {
		fase: s.fase,
		minHand: meg ? s.hender[meg.id] : null,
		harValgt: Object.keys(s.valgt),
		mittValg: meg ? s.valgt[meg.id] ?? null : null,
		neser: s.neser,
		bokstaver: s.bokstaver,
		taper: s.taper || null,
		harFire: meg ? fireLike(s.hender[meg.id] || []) : false,
		fasit: s.fase === "ferdig" ? Object.fromEntries(Object.entries(s.hender).map(([id, h]) => [id, h])) : null
	};
	if (s.type === "president") return {
		fase: s.fase || "spill",
		bord: s.bord,
		bordAv: s.bordAv,
		tur: ider[s.tur],
		pass: s.pass,
		ferdige: s.ferdige,
		titler: s.titler,
		minHand: meg ? s.hender[meg.id] : null,
		antall: Object.fromEntries(Object.entries(s.hender).map(([id, h]) => [id, h.length]))
	};
	return {};
}
async function varsle(kode, versjon) {
	const { url, nokkel } = supabaseServer();
	if (!url || !nokkel) return;
	try {
		await fetch(url + "/realtime/v1/api/broadcast", {
			method: "POST",
			headers: {
				apikey: nokkel,
				Authorization: "Bearer " + nokkel,
				"Content-Type": "application/json"
			},
			body: JSON.stringify({ messages: [{
				topic: "rom-" + kode,
				event: "endret",
				payload: { v: versjon },
				private: false
			}] }),
			signal: AbortSignal.timeout(1500)
		});
	} catch {}
}
/** Teller rom og leker per dag, uten navn. Feiler stille hvis tabellen ikke finnes ennå. */
async function loggRom(hva, ref) {
	try {
		await Promise.race([rpc("logg_rom", {
			p_hva: hva,
			p_ref: ref.slice(0, 40)
		}), new Promise((r) => setTimeout(r, 1500))]);
	} catch {}
}
function rensKort(kort) {
	if (!Array.isArray(kort)) return [];
	return kort.slice(0, 300).map((t) => String(t || "").replace(/[\u0000-\u001f<>]/g, "").replace(/\s+/g, " ").trim().slice(0, 140)).filter(Boolean);
}
function startEgen(data, kort, navn) {
	const liste = rensKort(kort);
	if (!liste.length) return feilL("tom", "Kortstokken er tom.", "The deck is empty.");
	const tittel = String(navn || "").replace(/[\u0000-\u001f<>]/g, "").trim().slice(0, 40) || L("Egen kortstokk", "Custom deck");
	data.spill = {
		type: "regelfabrikken",
		lek: "regelfabrikken",
		navn: tittel,
		modus: "",
		fase: "trekk",
		frist: null,
		sek: 60,
		kort: {},
		rekke: stokk(liste),
		pos: 0,
		egen: true
	};
	melde(data, `Nytt spill: ${tr(tittel, "no")} (${liste.length} kort)`, `New game: ${tr(tittel, "en")} (${liste.length} ${liste.length === 1 ? "card" : "cards"})`);
	return { ok: true };
}
var BR_SPM = [
	L("Rød eller svart?", "Red or black?"),
	L("Over eller under forrige kort?", "Higher or lower than the last card?"),
	L("Innenfor eller utenfor de to første?", "Inside or outside the first two?"),
	L("Hvilken kortfarge?", "Which suit?")
];
function brTrekk(s) {
	if (!s.stokk.length) s.stokk = kortstokk52();
	return s.stokk.pop();
}
function brRad(i) {
	return i < 5 ? 1 : i < 9 ? 2 : i < 12 ? 3 : i < 14 ? 4 : 5;
}
var YZ_FELT = [
	"1",
	"2",
	"3",
	"4",
	"5",
	"6",
	"p",
	"pp",
	"3l",
	"4l",
	"ls",
	"ss",
	"hus",
	"sj",
	"y"
];
function yzTell(t) {
	const c = [
		0,
		0,
		0,
		0,
		0,
		0,
		0
	];
	t.forEach((x) => c[x]++);
	return c;
}
function yzPoeng(f, t) {
	const c = yzTell(t), sum = t.reduce((a, b) => a + b, 0);
	if (/^[1-6]$/.test(f)) return c[+f] * +f;
	const hoy = (n) => {
		for (let i = 6; i >= 1; i--) if (c[i] >= n) return i;
		return 0;
	};
	if (f === "p") return hoy(2) * 2;
	if (f === "pp") {
		const par = [];
		for (let i = 6; i >= 1; i--) if (c[i] >= 2) par.push(i);
		return par.length >= 2 ? (par[0] + par[1]) * 2 : 0;
	}
	if (f === "3l") return hoy(3) * 3;
	if (f === "4l") return hoy(4) * 4;
	if (f === "ls") return [
		1,
		2,
		3,
		4,
		5
	].every((x) => c[x] === 1) ? 15 : 0;
	if (f === "ss") return [
		2,
		3,
		4,
		5,
		6
	].every((x) => c[x] === 1) ? 20 : 0;
	if (f === "hus") {
		let tre = 0, to = 0;
		for (let i = 1; i <= 6; i++) {
			if (c[i] === 3) tre = i;
			if (c[i] === 2) to = i;
		}
		return tre && to ? sum : 0;
	}
	if (f === "sj") return sum;
	if (f === "y") return c.some((x) => x === 5) ? 50 : 0;
	return 0;
}
function yzSum(b) {
	let ov = 0, sum = 0;
	YZ_FELT.forEach((f) => {
		const v = b[f];
		if (v != null) {
			sum += v;
			if (/^[1-6]$/.test(f)) ov += v;
		}
	});
	return sum + (ov >= 63 ? 50 : 0);
}
/** Tall fra tekst som «4,2 milliarder kroner» eller «12 000». */
function lesTall(x) {
	let t = String(x == null ? "" : x).toLowerCase().replace(/ /g, " ");
	t = t.replace(/(\d)[\s.](?=\d{3}(\D|$))/g, "$1");
	const m = /-?\d+(?:[.,]\d+)?/.exec(t);
	if (!m) return NaN;
	let n = parseFloat(m[0].replace(",", "."));
	const rest = t.slice(m.index + m[0].length);
	if (/^\s*(milliard|mrd)/.test(rest)) n *= 1e9;
	else if (/^\s*(million|mill\b|mill\.|mnok)/.test(rest)) n *= 1e6;
	else if (/^\s*tusen/.test(rest)) n *= 1e3;
	return n;
}
function norm(x) {
	return String(x || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9æøå ]/g, " ").replace(/\s+/g, " ").trim();
}
function nrRiktig(q, svar) {
	if (svar == null || svar === "") return false;
	if (q.type === "valg" || q.type === "sant") return String(svar) === String(q.svar);
	if (q.type === "tall") {
		const a = lesTall(q.svar), g = lesTall(svar);
		return isFinite(a) && isFinite(g) && Math.abs(g - a) <= Math.abs(a) * .1 + 1e-9;
	}
	const a = norm(q.svar), g = norm(svar);
	return !!g && (a === g || g.length >= 3 && a.includes(g) || a.length >= 3 && g.includes(a));
}
function nrNyttSpm(s) {
	const q = s.sporsmal[s.i];
	s.fase = "spm";
	s.svar = {};
	s.resultat = {};
	s.alt = q.type === "valg" ? stokk((q.alt || []).slice()) : q.type === "sant" ? ["Sant", "Tull"] : null;
	settFrist(s, q.type === "tall" || q.type === "fritt" ? FRIST.nrLang : FRIST.nrKort);
}
function nrAvslor(data) {
	const s = data.spill, q = s.sporsmal[s.i];
	s.fase = "svar";
	s.resultat = {};
	s.frist = null;
	data.spillere.forEach((p) => {
		const r = nrRiktig(q, s.svar[p.id]);
		s.resultat[p.id] = r;
		nrBrukResultat(data, p.id, r, 1);
	});
	const antall = Object.values(s.resultat).filter(Boolean).length;
	melde(data, `Svaret er «${q.svar}» – ${antall} av ${data.spillere.length} hadde rett`, `The answer is “${q.svar}” – ${antall} of ${data.spillere.length} got it right`);
}
function nrBrukResultat(data, id, riktig, fortegn) {
	const s = data.spill;
	if (riktig) {
		giUtdeling(data, id, fortegn);
		s.riktige[id] = Math.max(0, (s.riktige[id] || 0) + fortegn);
		const p = data.spillere.find((x) => x.id === id);
		if (p) p.quiz = Math.max(0, (p.quiz || 0) + fortegn);
	} else giSlurker(data, id, fortegn);
}
function startNye(data, lek, modus, ider) {
	if (lek === "bussruta") {
		if (ider.length < 2) return feilL("for-faa", "Bussruta trenger minst to spillere.", "Ride the bus needs at least two players.");
		const hender = {};
		ider.forEach((id) => {
			hender[id] = [];
		});
		data.spill = {
			type: "bussruta",
			lek,
			navn: EKSTRA_NAVN.bussruta,
			ider: ider.slice(),
			fase: 1,
			tur: 0,
			steg: 0,
			hender,
			stokk: kortstokk52(),
			sist: null,
			melding: "",
			pyr: [],
			pyrPos: 0,
			buss: null,
			bussRekke: 0,
			maal: 5
		};
		melde(data, "Nytt spill: Bussruta", "New game: Ride the bus");
		return { ok: true };
	}
	if (lek === "yatzy") {
		const blokker = {};
		ider.forEach((id) => {
			blokker[id] = {};
		});
		data.spill = {
			type: "yatzy",
			lek,
			navn: EKSTRA_NAVN.yatzy,
			ider: ider.slice(),
			tur: 0,
			terninger: [
				1,
				2,
				3,
				4,
				5
			],
			hold: [
				false,
				false,
				false,
				false,
				false
			],
			kast: 0,
			nr: 0,
			blokker,
			melding: "",
			ferdig: null
		};
		melde(data, "Nytt spill: Drikke-Yatzy", "New game: Drinking Yahtzee");
		return { ok: true };
	}
	if (lek === "nyhetsrunden") {
		const runder = publiserteRunder();
		const r = runder.find((x) => rundeId(x) === modus) || runder[0];
		if (!r || !(r.sporsmal || []).length) return feilL("tom", "Ingen runde er ute ennå.", "No round is out yet.");
		data.spill = {
			type: "nyhetsrunden",
			lek,
			navn: EKSTRA_NAVN.nyhetsrunden,
			modus: L("uke " + r.uke, "week " + r.uke),
			uke: r.uke,
			rid: rundeId(r),
			sporsmal: r.sporsmal,
			i: 0,
			riktige: {},
			fase: "klar",
			svar: {},
			resultat: {},
			alt: null
		};
		melde(data, `Nyhetsrunden uke ${r.uke} – ${r.sporsmal.length} spørsmål`, `Nyhetsrunden week ${r.uke} – ${r.sporsmal.length} ${r.sporsmal.length === 1 ? "question" : "questions"} (in Norwegian)`);
		return { ok: true };
	}
	return { feil: "ukjent-lek" };
}
function nyeHandling(data, meg, h) {
	const s = data.spill, erVert = meg.id === data.vert;
	if (s.type === "bussruta") {
		const aktiv = s.ider[s.tur];
		if (h.handling === "br-svar") {
			if (s.fase !== 1) return { ok: true };
			if (meg.id !== aktiv && !(erVert && !data.spillere.some((p) => p.id === aktiv))) return feilL("ikke-din-tur", "Det er ikke din tur.", "It's not your turn.");
			const v = String(h.v || ""), k = brTrekk(s), hand = s.hender[aktiv];
			let ok = false;
			if (s.steg === 0) ok = v === "rod" === (k.f === "♥" || k.f === "♦");
			if (s.steg === 1) ok = v === "over" ? k.v > hand[0].v : k.v < hand[0].v;
			if (s.steg === 2) {
				const lo = Math.min(hand[0].v, hand[1].v), hi = Math.max(hand[0].v, hand[1].v);
				ok = v === "inn" ? k.v > lo && k.v < hi : k.v < lo || k.v > hi;
			}
			if (s.steg === 3) ok = k.f === v;
			const n = s.steg + 1;
			hand.push(k);
			s.sist = k;
			if (ok) giUtdeling(data, aktiv, n);
			else giSlurker(data, aktiv, n);
			s.melding = L(`${navnPaa(data, aktiv)}: ${vnavn(k.v)}${k.f} – ${ok ? "riktig! Del ut " + n + "." : "feil! Drikk " + n + "."}`, `${navnPaa(data, aktiv)}: ${vnavnEn(k.v)}${k.f} – ${ok ? "correct! Give out " + n + "." : "wrong! Drink " + n + "."}`);
			s.steg++;
			if (s.steg === 4) {
				s.steg = 0;
				s.tur++;
			}
			if (s.tur >= s.ider.length) {
				s.fase = 2;
				s.pyr = [];
				for (let i = 0; i < 15; i++) s.pyr.push(brTrekk(s));
				s.pyrPos = 0;
				s.sist = null;
				melde(data, "Alle har fire kort. Nå snus pyramiden!", "Everyone has four cards. Time to flip the pyramid!");
			}
			return { ok: true };
		}
		if (h.handling === "br-snu") {
			if (s.fase !== 2 || s.pyrPos >= 15) return { ok: true };
			if (typeof h.pos === "number" && h.pos !== s.pyrPos) return { ok: true };
			const k = s.pyr[s.pyrPos], n = brRad(s.pyrPos), treff = [];
			s.ider.forEach((id) => {
				const hand = s.hender[id], i = hand.findIndex((x) => x.v === k.v);
				if (i !== -1) {
					hand.splice(i, 1);
					treff.push(navnPaa(data, id));
					giUtdeling(data, id, n);
				}
			});
			s.pyrPos++;
			s.melding = L(`${vnavn(k.v)}${k.f} (rad ${n}) – ${treff.length ? treff.join(", ") + " legger på og deler ut " + n + "." : "ingen har den."}`, `${vnavnEn(k.v)}${k.f} (row ${n}) – ${treff.length ? treff.join(", ") + " " + (treff.length === 1 ? "plays it and gives" : "play it and give") + " out " + n + "." : "nobody has it."}`);
			return { ok: true };
		}
		if (h.handling === "br-buss") {
			if (s.fase !== 2 || s.pyrPos < 15) return { ok: true };
			const maks = Math.max(...s.ider.map((id) => s.hender[id].length));
			const kand = s.ider.filter((id) => s.hender[id].length === maks);
			s.buss = kand[tilfeldig(kand.length)];
			s.fase = 3;
			s.bussRekke = 0;
			s.stokk = kortstokk52();
			s.sist = null;
			s.melding = L(`${navnPaa(data, s.buss)} har flest kort igjen (${maks}) og kjører bussen! Kom deg forbi ${s.maal} kort uten bildekort eller ess.`, `${navnPaa(data, s.buss)} has the most cards left (${maks}) and rides the bus! Get past ${s.maal} cards without a face card or an ace.`);
			melde(data, `${navnPaa(data, s.buss)} kjører bussen!`, `${navnPaa(data, s.buss)} rides the bus!`);
			return { ok: true };
		}
		if (h.handling === "br-kjor") {
			if (s.fase !== 3 || s.bussRekke >= s.maal) return { ok: true };
			if (meg.id !== s.buss && !erVert) return feilL("ikke-din-tur", "Det er sjåføren som snur.", "The bus rider flips the cards.");
			const k = brTrekk(s);
			s.sist = k;
			const straff = {
				11: 1,
				12: 2,
				13: 3,
				14: 4
			}[k.v];
			if (straff) {
				giSlurker(data, s.buss, straff);
				s.bussRekke = 0;
				s.melding = L(`${vnavn(k.v)}${k.f} – ${navnPaa(data, s.buss)} drikker ${straff} og starter på nytt.`, `${vnavnEn(k.v)}${k.f} – ${navnPaa(data, s.buss)} drinks ${straff} and starts over.`);
			} else {
				s.bussRekke++;
				s.melding = L(`${vnavn(k.v)}${k.f} – trygt! ${s.bussRekke >= s.maal ? navnPaa(data, s.buss) + " er i mål. Bussen er fri!" : s.maal - s.bussRekke + " igjen."}`, `${vnavnEn(k.v)}${k.f} – safe! ${s.bussRekke >= s.maal ? navnPaa(data, s.buss) + " made it. The bus is free!" : s.maal - s.bussRekke + " to go."}`);
				if (s.bussRekke >= s.maal) melde(data, "Bussen er i mål!", "The bus made it!");
			}
			return { ok: true };
		}
		if (h.handling === "nytt") {
			if (!erVert) return { feil: "bare-vert" };
			return startNye(data, "bussruta", "", aktiveIder(data, true));
		}
		return null;
	}
	if (s.type === "yatzy") {
		const aktiv = s.ider[s.tur], kanStyre = meg.id === aktiv || erVert && !data.spillere.some((p) => p.id === aktiv);
		if (h.handling === "yz-kast") {
			if (s.ferdig) return { ok: true };
			if (!kanStyre) return feilL("ikke-din-tur", "Det er ikke din tur.", "It's not your turn.");
			if (s.kast >= 3) return { ok: true };
			s.terninger = s.terninger.map((t, i) => s.hold[i] && s.kast ? t : 1 + tilfeldig(6));
			s.kast++;
			s.nr++;
			const c = yzTell(s.terninger), deler = [], delerEn = [];
			if (c[1] > 0) {
				giSlurker(data, aktiv, 2);
				deler.push("Ener i kastet – drikk 2.");
				delerEn.push("A one in the roll – drink 2.");
			}
			if (c.some((x) => x === 5)) {
				giUtdeling(data, aktiv, 5);
				deler.push("YATZY! Del ut 5 – eller en shot.");
				delerEn.push("YAHTZEE! Give out 5 – or a shot.");
			} else if (c.some((x) => x >= 4)) {
				const sum = s.terninger.reduce((a, b) => a + b, 0);
				giSlurker(data, aktiv, sum);
				deler.push("Fire like – drikk " + sum + " slurker.");
				delerEn.push("Four of a kind – drink " + sum + " sips.");
			}
			s.melding = L(deler.join(" ") || (s.kast < 3 ? "Hold og trill igjen, eller velg et felt." : "Velg et felt."), delerEn.join(" ") || (s.kast < 3 ? "Hold and roll again, or pick a box." : "Pick a box."));
			return { ok: true };
		}
		if (h.handling === "yz-hold") {
			if (!kanStyre || !s.kast || s.kast >= 3) return { ok: true };
			const i = Number(h.i);
			if (i >= 0 && i < 5) s.hold[i] = !s.hold[i];
			return { ok: true };
		}
		if (h.handling === "yz-felt") {
			if (!kanStyre || !s.kast || s.ferdig) return { ok: true };
			const f = String(h.f || ""), b = s.blokker[aktiv];
			if (!YZ_FELT.includes(f) || b[f] != null) return { ok: true };
			b[f] = yzPoeng(f, s.terninger);
			s.tur = (s.tur + 1) % s.ider.length;
			s.kast = 0;
			s.hold = [
				false,
				false,
				false,
				false,
				false
			];
			s.melding = "";
			if (s.ider.every((id) => YZ_FELT.every((x) => s.blokker[id][x] != null))) {
				const liste = s.ider.map((id) => ({
					id,
					navn: navnPaa(data, id),
					sum: yzSum(s.blokker[id])
				})).sort((a, c) => c.sum - a.sum);
				s.ferdig = liste;
				giUtdeling(data, liste[0].id, 5);
				giSlurker(data, liste[liste.length - 1].id, 5);
				melde(data, `${liste[0].navn} vant Yatzy! ${liste[liste.length - 1].navn} drikker opp.`, `${liste[0].navn} won Yahtzee! ${liste[liste.length - 1].navn} finishes their drink.`);
			}
			return { ok: true };
		}
		if (h.handling === "nytt") {
			if (!erVert) return { feil: "bare-vert" };
			return startNye(data, "yatzy", "", aktiveIder(data, true));
		}
		return null;
	}
	if (s.type === "nyhetsrunden") {
		s.sporsmal[s.i];
		if (h.handling === "nr-svar") {
			if (s.fase !== "spm") return feilL("for-sent", "Svaret er allerede vist.", "The answer has already been revealed.");
			let v = String(h.v == null ? "" : h.v).replace(/[\u0000-\u001f<>]/g, "").trim().slice(0, 80);
			if (s.alt && !s.alt.includes(v)) return { feil: "ukjent" };
			if (!v) {
				delete s.svar[meg.id];
				return { ok: true };
			}
			s.svar[meg.id] = v;
			if (data.spillere.every((p) => s.svar[p.id] != null)) nrAvslor(data);
			return { ok: true };
		}
		if (h.handling === "tid-ute") {
			if (s.fase === "spm" && fristUte(s)) nrAvslor(data);
			return { ok: true };
		}
		if (!erVert && [
			"nr-start",
			"nr-vis",
			"nr-flipp",
			"nr-neste",
			"nytt"
		].includes(h.handling)) return feilL("bare-vert", "Verten styrer runden.", "The host runs the round.");
		if (h.handling === "nr-start") {
			if (s.fase === "klar") {
				nrNyttSpm(s);
				melde(data, "Første spørsmål!", "First question!");
			}
			return { ok: true };
		}
		if (h.handling === "nr-vis") {
			if (s.fase !== "spm") return { ok: true };
			const mangler = data.spillere.filter((p) => s.svar[p.id] == null).length;
			if (mangler > 0 && !fristUte(s)) return venter(s, mangler);
			nrAvslor(data);
			return { ok: true };
		}
		if (h.handling === "nr-flipp") {
			if (s.fase !== "svar") return { ok: true };
			const id = String(h.hvem || "");
			if (!(id in s.resultat)) return { ok: true };
			nrBrukResultat(data, id, s.resultat[id], -1);
			s.resultat[id] = !s.resultat[id];
			nrBrukResultat(data, id, s.resultat[id], 1);
			return { ok: true };
		}
		if (h.handling === "nr-neste") {
			if (s.fase !== "svar") return { ok: true };
			if (s.i + 1 >= s.sporsmal.length) {
				s.fase = "ferdig";
				const liste = data.spillere.map((p) => ({
					id: p.id,
					navn: p.navn,
					riktige: s.riktige[p.id] || 0
				})).sort((a, b) => b.riktige - a.riktige);
				if (liste[0]) melde(data, `${liste[0].navn} vant Nyhetsrunden med ${liste[0].riktige} riktige!`, `${liste[0].navn} won Nyhetsrunden with ${liste[0].riktige} correct!`);
				return { ok: true };
			}
			s.i++;
			nrNyttSpm(s);
			return { ok: true };
		}
		if (h.handling === "nytt") {
			const r = publiserteRunder()[0];
			return startNye(data, "nyhetsrunden", r ? rundeId(r) : "", []);
		}
		return null;
	}
	return null;
}
function nyeVisning(s, meg, data) {
	if (s.type === "bussruta") return {
		fase: s.fase,
		aktiv: s.ider[s.tur] || null,
		steg: s.steg,
		sporsmal: s.fase === 1 ? BR_SPM[s.steg] : null,
		hender: s.hender,
		ider: s.ider,
		sist: s.sist,
		melding: s.melding,
		pyr: s.pyr.slice(0, s.pyrPos),
		pyrPos: s.pyrPos,
		buss: s.buss,
		bussRekke: s.bussRekke,
		maal: s.maal
	};
	if (s.type === "yatzy") return {
		aktiv: s.ider[s.tur],
		ider: s.ider,
		terninger: s.terninger,
		hold: s.hold,
		kast: s.kast,
		nr: s.nr,
		melding: s.melding,
		ferdig: s.ferdig,
		blokker: s.blokker,
		summer: Object.fromEntries(s.ider.map((id) => [id, yzSum(s.blokker[id])])),
		mulige: s.kast ? Object.fromEntries(YZ_FELT.map((f) => [f, yzPoeng(f, s.terninger)])) : null
	};
	if (s.type === "nyhetsrunden") {
		const q = s.sporsmal[s.i], vert = meg && meg.id === data.vert, aapen = s.fase === "svar" || s.fase === "ferdig";
		const liste = data.spillere.map((p) => ({
			id: p.id,
			navn: p.navn,
			riktige: s.riktige[p.id] || 0
		})).sort((a, b) => b.riktige - a.riktige);
		return {
			fase: s.fase,
			i: s.i,
			antall: s.sporsmal.length,
			uke: s.uke,
			rid: s.rid || null,
			qtype: q.type,
			alt: s.alt,
			q: vert && s.fase === "spm" || aapen ? q.q : null,
			fasit: aapen ? q.svar : null,
			info: aapen ? q.info || "" : null,
			kilde: aapen ? q.kilde || "" : null,
			url: aapen ? q.url || "" : null,
			harSvart: Object.keys(s.svar),
			mittSvar: meg ? s.svar[meg.id] ?? null : null,
			svarene: aapen ? s.svar : null,
			resultat: aapen ? s.resultat : null,
			tavle: liste
		};
	}
	return {};
}
var HJUL_STANDARD = [
	"Drikk 1",
	"Drikk 2",
	"Drikk 3",
	"Shot!",
	"Del ut 2",
	"Vannpause 💧",
	"Trygg – ingenting skjer",
	"Alle andre drikker 1",
	"Velg en drikkepartner",
	"Pinlig historie – eller drikk 4"
];
/** Samme hjul på engelsk (samme rekkefølge). Effekten leses alltid fra den norske teksten. */
var HJUL_STANDARD_EN = [
	"Drink 1",
	"Drink 2",
	"Drink 3",
	"Shot!",
	"Give out 2",
	"Water break 💧",
	"Safe – nothing happens",
	"Everyone else drinks 1",
	"Pick a drinking buddy",
	"Embarrassing story – or drink 4"
];
/** Hjulet slik én telefon ser det: standardhjulet på eget språk, egne hjul slik verten skrev dem. */
function hjulVisning(data, lang) {
	const h = lok(data.hjul, lang);
	if (lang === "en" && !data.hjulListe && typeof data.hjul.tekst === "string" && HJUL_STANDARD[data.hjul.i] === data.hjul.tekst) h.tekst = HJUL_STANDARD_EN[data.hjul.i];
	return h;
}
function hjulEffekt(data, hvem, tekst) {
	const t = tekst.toLowerCase();
	let m;
	if (m = /alle andre drikker (\d+)/.exec(t)) {
		data.spillere.forEach((p) => {
			if (p.id !== hvem) giSlurker(data, p.id, +m[1]);
		});
		return;
	}
	if (m = /del ut (\d+)/.exec(t)) {
		giUtdeling(data, hvem, +m[1]);
		return;
	}
	if (/shot/.test(t) && !/eller/.test(t)) {
		giSlurker(data, hvem, 5);
		return;
	}
	if (m = /^drikk (\d+)/.exec(t)) giSlurker(data, hvem, +m[1]);
}
function spinnHjul(data, meg, h, erVert) {
	const naa = Date.now();
	if (data.hjul && naa - data.hjul.tid < 7e3) return feilL("for-fort", "Hjulet spinner allerede!", "The wheel is already spinning!");
	const hvem = h.hvem && erVert ? String(h.hvem) : meg.id;
	if (!data.spillere.some((p) => p.id === hvem)) return { feil: "ukjent" };
	const liste = data.hjulListe || HJUL_STANDARD, i = tilfeldig(liste.length);
	const tekst = data.hjulListe ? liste[i] : L(HJUL_STANDARD[i], HJUL_STANDARD_EN[i]);
	data.hjul = {
		nr: (data.hjul && data.hjul.nr || 0) + 1,
		fra: meg.id,
		hvem,
		i,
		tekst,
		tid: naa,
		antall: liste.length
	};
	hjulEffekt(data, hvem, liste[i]);
	return { ok: true };
}
var S_ = sosial_default;
var SE = sosial_en_default;
/** Ett innholdselement på begge språk: tekst → {no, en}, objekt (bløff {q, a}) → hvert felt som {no, en}. */
function sosL(no, en) {
	if (typeof no === "string") return L(no, typeof en === "string" ? en : null);
	if (no && typeof no === "object") {
		const ut = {};
		Object.keys(no).forEach((k) => {
			ut[k] = sosL(no[k], en && typeof en === "object" ? en[k] : null);
		});
		return ut;
	}
	return no;
}
/** Lista på begge språk (samme rekkefølge i sosial.json og sosial.en.json). */
function sosListe(felt) {
	const en = SE[felt] || [];
	return (S_[felt] || []).map((x, i) => sosL(x, en[i]));
}
var SFRIST = {
	skriv: 90,
	bloffSkriv: 60,
	stem: 30,
	samme: 30,
	sporsmal: 180,
	spionGjett: 30,
	pannekort: 75
};
function rens(x, n = 120) {
	return String(x == null ? "" : x).replace(/[\u0000-\u001f<>]/g, "").replace(/\s+/g, " ").trim().slice(0, n);
}
function trekkFra(s, felt, liste) {
	s.brukt = s.brukt || {};
	const b = s.brukt[felt] || (s.brukt[felt] = []);
	if (b.length >= liste.length) b.length = 0;
	let i = tilfeldig(liste.length);
	let vakt = 0;
	while (b.includes(i) && vakt++ < 200) i = tilfeldig(liste.length);
	b.push(i);
	return liste[i];
}
function alleHar(data, obj, unntak = []) {
	return data.spillere.every((p) => unntak.includes(p.id) || obj[p.id] != null);
}
function startSos(data, lek, ider) {
	const n = data.spillere.length;
	const trenger = {
		hvemskrev: 3,
		bloff: 3,
		samme: 3,
		spion: 3,
		pannekort: 3,
		skal: 2
	};
	if (n < trenger[lek]) return feilL("for-faa", `Trenger minst ${trenger[lek]} spillere.`, `Needs at least ${trenger[lek]} players.`);
	const gammel = data.spill && data.spill.type === lek ? data.spill.brukt : null;
	const navn = EKSTRA_NAVN[lek];
	data.spill = {
		type: lek,
		lek,
		navn,
		brukt: gammel || {},
		runde: 1
	};
	sosNyRunde(data);
	melde(data, `Nytt spill: ${navn.no}`, `New game: ${navn.en}`);
	return { ok: true };
}
function sosNyRunde(data) {
	const s = data.spill, ider = data.spillere.map((p) => p.id);
	s.frist = null;
	if (s.type === "hvemskrev") {
		s.fase = "skriv";
		s.oppgave = trekkFra(s, "oppg", sosListe("hvemskrev"));
		s.svar = {};
		s.ko = [];
		s.i = 0;
		s.stemmer = {};
		settFrist(s, SFRIST.skriv);
	}
	if (s.type === "bloff") {
		const q = trekkFra(s, "q", sosListe("bloff"));
		s.fase = "skriv";
		s.q = q.q;
		s.sant = q.a;
		s.falske = {};
		s.valg = [];
		s.stemmer = {};
		settFrist(s, SFRIST.bloffSkriv);
	}
	if (s.type === "samme") {
		s.fase = "skriv";
		s.oppgave = trekkFra(s, "oppg", sosListe("samme"));
		s.svar = {};
		s.grupper = null;
		settFrist(s, SFRIST.samme);
	}
	if (s.type === "spion") {
		s.fase = "sporsmal";
		s.sted = trekkFra(s, "sted", sosListe("steder"));
		s.spion = ider[tilfeldig(ider.length)];
		s.start = ider[tilfeldig(ider.length)];
		s.stemmer = {};
		s.utfall = null;
		s.spionGjett = null;
		settFrist(s, SFRIST.sporsmal);
	}
	if (s.type === "pannekort") {
		const rekke = stokk(ider);
		s.tildelt = {};
		rekke.forEach((id, i) => {
			s.tildelt[id] = rekke[(i + 1) % rekke.length];
		});
		s.fase = "skriv";
		s.ord = {};
		s.gjettet = [];
		settFrist(s, SFRIST.pannekort);
	}
	if (s.type === "skal") {
		s.fase = "klar";
		s.tid = null;
		s.trykk = {};
		s.tidlig = [];
		s.resultat = null;
	}
}
function hsFasit(data) {
	const s = data.spill, forfatter = s.ko[s.i];
	const riktige = Object.keys(s.stemmer).filter((id) => s.stemmer[id] === forfatter);
	Object.keys(s.stemmer).forEach((id) => {
		if (s.stemmer[id] !== forfatter) giSlurker(data, id, 1);
	});
	if (!riktige.length && Object.keys(s.stemmer).length) giUtdeling(data, forfatter, 2);
	s.fase = "fasit";
	s.frist = null;
}
function hsStartGjett(data) {
	const s = data.spill;
	s.ko = stokk(Object.keys(s.svar));
	s.i = 0;
	s.fase = "gjett";
	s.stemmer = {};
	settFrist(s, SFRIST.stem);
}
function bfStartStem(data) {
	const s = data.spill, grupper = {};
	Object.entries(s.falske).forEach(([id, t]) => {
		const k = norm(t);
		(grupper[k] = grupper[k] || {
			t,
			av: []
		}).av.push(id);
	});
	s.valg = stokk([{
		t: s.sant,
		av: ["sant"]
	}, ...Object.values(grupper)]);
	s.fase = "stem";
	s.stemmer = {};
	settFrist(s, SFRIST.stem);
}
function bfFasit(data) {
	const s = data.spill;
	Object.entries(s.stemmer).forEach(([id, i]) => {
		const v = s.valg[i];
		if (v.av[0] === "sant") giUtdeling(data, id, 1);
		else {
			giSlurker(data, id, 1);
			v.av.forEach((a) => giUtdeling(data, a, 1));
		}
	});
	s.fase = "fasit";
	s.frist = null;
}
function smFasit(data) {
	const s = data.spill, g = {};
	Object.entries(s.svar).forEach(([id, t]) => {
		const k = norm(t);
		(g[k] = g[k] || {
			t,
			ider: []
		}).ider.push(id);
	});
	s.grupper = Object.values(g).sort((a, b) => b.ider.length - a.ider.length);
	data.spillere.forEach((p) => {
		const gr = s.grupper.find((x) => x.ider.includes(p.id));
		if (!gr || gr.ider.length < 2) giSlurker(data, p.id, 1);
	});
	s.fase = "fasit";
	s.frist = null;
}
function spTelling(data) {
	const s = data.spill, t = {};
	Object.values(s.stemmer).forEach((id) => {
		t[id] = (t[id] || 0) + 1;
	});
	const liste = Object.entries(t).sort((a, b) => b[1] - a[1]);
	const topp = liste[0] && (!liste[1] || liste[1][1] < liste[0][1]) ? liste[0][0] : null;
	if (topp === s.spion) {
		s.fase = "gjett";
		settFrist(s, SFRIST.spionGjett);
		melde(data, "Muldvarpen er avslørt! Men kan hen gjette stedet?", "The mole has been exposed! But can they guess the location?");
	} else spSlutt(data, "spion-vant", topp);
}
function spSlutt(data, utfall, feilMistenkt = null) {
	const s = data.spill;
	s.fase = "fasit";
	s.frist = null;
	s.utfall = utfall;
	s.feilMistenkt = feilMistenkt;
	if (utfall === "fanget") {
		giSlurker(data, s.spion, 3);
		data.spillere.forEach((p) => {
			if (p.id !== s.spion) giUtdeling(data, p.id, 1);
		});
	} else {
		data.spillere.forEach((p) => {
			if (p.id !== s.spion) giSlurker(data, p.id, 2);
		});
		giUtdeling(data, s.spion, 3);
	}
	melde(data, utfall === "fanget" ? `Muldvarpen ${navnPaa(data, s.spion)} ble tatt!` : `Muldvarpen ${navnPaa(data, s.spion)} vant!`, utfall === "fanget" ? `The mole, ${navnPaa(data, s.spion)}, got caught!` : `The mole, ${navnPaa(data, s.spion)}, won!`);
}
function pkStartSpill(data) {
	const s = data.spill;
	Object.keys(s.tildelt).forEach((fra) => {
		const til = s.tildelt[fra];
		if (!s.ord[til]) s.ord[til] = {
			t: trekkFra(s, "ord", sosListe("ord")),
			fra: null
		};
	});
	s.fase = "spill";
	s.frist = null;
}
function skalFasit(data) {
	const s = data.spill, tider = Object.entries(s.trykk).sort((a, b) => a[1] - b[1]);
	const ikke = data.spillere.map((p) => p.id).filter((id) => !s.tidlig.includes(id)).filter((id) => s.trykk[id] == null);
	ikke.forEach((id) => giSlurker(data, id, 1));
	let treigest = null;
	if (!ikke.length && tider.length) {
		treigest = tider[tider.length - 1][0];
		giSlurker(data, treigest, 1);
	}
	if (tider.length) giUtdeling(data, tider[0][0], 1);
	s.resultat = {
		tider,
		tidlig: s.tidlig,
		ikke,
		treigest,
		raskest: tider.length ? tider[0][0] : null
	};
	s.fase = "fasit";
	s.frist = null;
}
function sosHandling(data, meg, h) {
	const s = data.spill, erVert = meg.id === data.vert, hd = h.handling;
	if (hd === "nytt" || hd === "runde") {
		if (!erVert && s.fase !== "fasit" && s.fase !== "ferdig") return { feil: "bare-vert" };
		s.runde++;
		sosNyRunde(data);
		return { ok: true };
	}
	if (s.type === "hvemskrev") {
		if (hd === "hs-skriv") {
			if (s.fase !== "skriv") return feilL("for-sent", "Skrivetiden er ute.", "Writing time is up.");
			const t = rens(h.tekst, 160);
			if (!t) return { ok: true };
			s.svar[meg.id] = t;
			if (alleHar(data, s.svar)) hsStartGjett(data);
			return { ok: true };
		}
		if (hd === "hs-stem") {
			if (s.fase !== "gjett" || s.ko[s.i] === meg.id) return { ok: true };
			if (!data.spillere.some((p) => p.id === h.hvem) || h.hvem === meg.id) return { feil: "ukjent" };
			s.stemmer[meg.id] = h.hvem;
			if (alleHar(data, s.stemmer, [s.ko[s.i]])) hsFasit(data);
			return { ok: true };
		}
		if (hd === "hs-neste") {
			if (s.fase !== "fasit") return { ok: true };
			s.i++;
			if (s.i >= s.ko.length) {
				s.fase = "ferdig";
				return { ok: true };
			}
			s.fase = "gjett";
			s.stemmer = {};
			settFrist(s, SFRIST.stem);
			return { ok: true };
		}
		if (hd === "tid-ute" && fristUte(s)) {
			if (s.fase === "skriv") {
				if (Object.keys(s.svar).length >= 2) hsStartGjett(data);
				else settFrist(s, 30);
			} else if (s.fase === "gjett") hsFasit(data);
			return { ok: true };
		}
		if (hd === "avslor" && s.fase === "skriv" && erVert) {
			const mangler = data.spillere.filter((p) => s.svar[p.id] == null).length;
			if (mangler && !fristUte(s)) return venter(s, mangler);
		}
		return { ok: true };
	}
	if (s.type === "bloff") {
		if (hd === "bf-skriv") {
			if (s.fase !== "skriv") return feilL("for-sent", "Skrivetiden er ute.", "Writing time is up.");
			const t = rens(h.tekst, 80);
			if (!t) return { ok: true };
			if ((erL(s.sant) ? [s.sant.no, s.sant.en] : [String(s.sant || "")]).some((sa) => norm(t) === norm(sa) || norm(t).length > 3 && norm(sa).includes(norm(t)))) return feilL("for-riktig", "Det der er jo det riktige svaret! Finn på en løgn.", "That's the actual answer! Make up a lie.");
			s.falske[meg.id] = t;
			if (alleHar(data, s.falske)) bfStartStem(data);
			return { ok: true };
		}
		if (hd === "bf-stem") {
			if (s.fase !== "stem") return { ok: true };
			const i = Number(h.i);
			const v = s.valg[i];
			if (!v) return { feil: "ukjent" };
			if (v.av.includes(meg.id)) return feilL("egen", "Du kan ikke stemme på din egen løgn.", "You can't vote for your own lie.");
			s.stemmer[meg.id] = i;
			if (alleHar(data, s.stemmer)) bfFasit(data);
			return { ok: true };
		}
		if (hd === "tid-ute" && fristUte(s)) {
			if (s.fase === "skriv") {
				if (Object.keys(s.falske).length >= 1) bfStartStem(data);
				else settFrist(s, 30);
			} else if (s.fase === "stem") bfFasit(data);
		}
		return { ok: true };
	}
	if (s.type === "samme") {
		if (hd === "sm-skriv") {
			if (s.fase !== "skriv") return feilL("for-sent", "Tiden er ute.", "Time's up.");
			const t = rens(h.tekst, 40);
			if (!t) return { ok: true };
			s.svar[meg.id] = t;
			if (alleHar(data, s.svar)) smFasit(data);
			return { ok: true };
		}
		if (hd === "tid-ute" && fristUte(s) && s.fase === "skriv") smFasit(data);
		return { ok: true };
	}
	if (s.type === "spion") {
		if (hd === "sp-til-stemming") {
			if (s.fase !== "sporsmal") return { ok: true };
			if (!erVert) return feilL("bare-vert", "Verten sender dere til stemming.", "The host sends you to the vote.");
			s.fase = "stem";
			s.stemmer = {};
			settFrist(s, SFRIST.stem);
			return { ok: true };
		}
		if (hd === "sp-stem") {
			if (s.fase !== "stem") return { ok: true };
			if (!data.spillere.some((p) => p.id === h.hvem) || h.hvem === meg.id) return { feil: "ukjent" };
			s.stemmer[meg.id] = h.hvem;
			if (alleHar(data, s.stemmer)) spTelling(data);
			return { ok: true };
		}
		if (hd === "sp-gjett") {
			if (s.fase !== "gjett" || meg.id !== s.spion) return { ok: true };
			const g = String(h.sted || ""), riktig = erL(s.sted) ? g === s.sted.no || g === s.sted.en : g === s.sted;
			s.spionGjett = sosListe("steder").find((x) => x.no === g || x.en === g) || g;
			spSlutt(data, riktig ? "spion-gjettet" : "fanget");
			return { ok: true };
		}
		if (hd === "tid-ute" && fristUte(s)) {
			if (s.fase === "sporsmal") {
				s.fase = "stem";
				s.stemmer = {};
				settFrist(s, SFRIST.stem);
			} else if (s.fase === "stem") spTelling(data);
			else if (s.fase === "gjett") spSlutt(data, "fanget");
		}
		return { ok: true };
	}
	if (s.type === "pannekort") {
		if (hd === "pk-skriv") {
			if (s.fase !== "skriv") return feilL("for-sent", "Ordene er allerede delt ut.", "The words have already been handed out.");
			const t = rens(h.tekst, 40);
			if (!t) return { ok: true };
			const til = s.tildelt[meg.id];
			if (!til) return { ok: true };
			s.ord[til] = {
				t,
				fra: meg.id
			};
			if (Object.keys(s.tildelt).every((fra) => s.ord[s.tildelt[fra]])) pkStartSpill(data);
			return { ok: true };
		}
		if (hd === "pk-riktig") {
			if (s.fase !== "spill") return { ok: true };
			const hvem = String(h.hvem || "");
			if (hvem === meg.id) return feilL("ukjent", "Det er de andre som bekrefter at du gjettet riktig.", "The others confirm that you guessed right.");
			if (!s.ord[hvem] || s.gjettet.includes(hvem)) return { ok: true };
			s.gjettet.push(hvem);
			if (s.gjettet.length === 1) giUtdeling(data, hvem, 2);
			melde(data, `${navnPaa(data, hvem)} gjettet «${tr(s.ord[hvem].t, "no")}»!`, `${navnPaa(data, hvem)} guessed “${tr(s.ord[hvem].t, "en")}”!`);
			const igjen = Object.keys(s.ord).filter((id) => !s.gjettet.includes(id) && data.spillere.some((p) => p.id === id));
			if (igjen.length <= 1) {
				s.fase = "ferdig";
				if (igjen[0]) {
					giSlurker(data, igjen[0], 3);
					s.sist = igjen[0];
				}
			}
			return { ok: true };
		}
		if (hd === "pk-avslutt") {
			if (!erVert || s.fase !== "spill") return { ok: true };
			Object.keys(s.ord).filter((id) => !s.gjettet.includes(id)).forEach((id) => giSlurker(data, id, 2));
			s.fase = "ferdig";
			return { ok: true };
		}
		if (hd === "tid-ute" && fristUte(s) && s.fase === "skriv") pkStartSpill(data);
		return { ok: true };
	}
	if (s.type === "skal") {
		if (hd === "sk-start") {
			if (s.fase === "vent") return { ok: true };
			s.fase = "vent";
			s.tid = Date.now() + 2500 + tilfeldig(5e3);
			s.trykk = {};
			s.tidlig = [];
			s.resultat = null;
			s.frist = s.tid + 6e3;
			return { ok: true };
		}
		if (hd === "sk-trykk") {
			if (s.fase !== "vent" || s.trykk[meg.id] != null || s.tidlig.includes(meg.id)) return { ok: true };
			if (h.tidlig || Date.now() < s.tid - 400) {
				s.tidlig.push(meg.id);
				giSlurker(data, meg.id, 2);
			} else s.trykk[meg.id] = Math.max(80, Math.min(6e3, Math.round(Number(h.ms) || Date.now() - s.tid)));
			if (data.spillere.every((p) => s.trykk[p.id] != null || s.tidlig.includes(p.id))) skalFasit(data);
			return { ok: true };
		}
		if (hd === "tid-ute" && s.fase === "vent" && fristUte(s)) skalFasit(data);
		return { ok: true };
	}
	return null;
}
function sosVisning(s, meg, data) {
	const m = meg ? meg.id : null;
	if (s.type === "hvemskrev") return {
		fase: s.fase,
		oppgave: s.oppgave,
		harSkrevet: Object.keys(s.svar),
		mittSvar: m ? s.svar[m] || null : null,
		i: s.i,
		antallSvar: s.ko.length || Object.keys(s.svar).length,
		tekst: s.fase === "gjett" || s.fase === "fasit" ? s.svar[s.ko[s.i]] : null,
		erMitt: (s.fase === "gjett" || s.fase === "fasit") && s.ko[s.i] === m,
		harStemt: Object.keys(s.stemmer || {}),
		minStemme: m ? (s.stemmer || {})[m] || null : null,
		forfatter: s.fase === "fasit" ? s.ko[s.i] : null,
		stemmer: s.fase === "fasit" ? s.stemmer : null
	};
	if (s.type === "bloff") return {
		fase: s.fase,
		q: s.q,
		harSkrevet: Object.keys(s.falske),
		mittSvar: m ? s.falske[m] || null : null,
		valg: s.fase === "skriv" ? null : s.valg.map((v) => ({
			t: v.t,
			min: v.av.includes(m),
			av: s.fase === "fasit" ? v.av : null
		})),
		harStemt: Object.keys(s.stemmer),
		minStemme: m ? s.stemmer[m] ?? null : null,
		stemmer: s.fase === "fasit" ? s.stemmer : null,
		sant: s.fase === "fasit" ? s.sant : null
	};
	if (s.type === "samme") return {
		fase: s.fase,
		oppgave: s.oppgave,
		harSkrevet: Object.keys(s.svar),
		mittSvar: m ? s.svar[m] || null : null,
		grupper: s.fase === "fasit" ? s.grupper : null
	};
	if (s.type === "spion") {
		const aapen = s.fase === "fasit";
		return {
			fase: s.fase,
			erSpion: m === s.spion,
			sted: m !== s.spion || aapen ? s.sted : null,
			steder: sosListe("steder"),
			start: s.start,
			harStemt: Object.keys(s.stemmer),
			minStemme: m ? s.stemmer[m] || null : null,
			spion: aapen || s.fase === "gjett" ? s.spion : null,
			stemmer: aapen ? s.stemmer : null,
			utfall: s.utfall,
			spionGjett: aapen ? s.spionGjett : null
		};
	}
	if (s.type === "pannekort") {
		const ord = {};
		Object.entries(s.ord).forEach(([id, o]) => {
			if (id !== m || s.fase === "ferdig") ord[id] = {
				t: o.t,
				fra: o.fra
			};
		});
		return {
			fase: s.fase,
			mitMaal: m ? s.tildelt[m] || null : null,
			harSkrevet: Object.keys(s.tildelt).filter((fra) => s.ord[s.tildelt[fra]]),
			ord,
			gjettet: s.gjettet,
			sist: s.sist || null,
			mittOrdSkjult: !!(m && s.ord[m] && s.fase !== "ferdig")
		};
	}
	if (s.type === "skal") return {
		fase: s.fase,
		tid: s.tid,
		harTrykket: Object.keys(s.trykk || {}).concat(s.tidlig || []),
		resultat: s.resultat
	};
	return {};
}
function nyttOppdrag(data, id) {
	const o = data.oppdrag;
	const andre = data.spillere.filter((p) => p.id !== id);
	if (!andre.length) return;
	const maal = andre[tilfeldig(andre.length)];
	const mal = trekkFra(o, "op", sosListe("oppdrag"));
	o.per[id] = {
		t: L(mal.no.replace("{navn}", maal.navn), mal.en.replace("{navn}", maal.navn)),
		maal: maal.id,
		nr: (o.per[id] && o.per[id].nr || 0) + 1
	};
}
function oppdragHandling(data, meg, h, erVert) {
	const hd = h.handling;
	if (hd === "op-paa") {
		if (!erVert) return { feil: "bare-vert" };
		if (!romHarPluss(data)) return feilL("pluss", "Agent 0,5 (hemmelige oppdrag) krever Pluss hos verten.", "Agent 0.5 (secret missions) needs the host to have Plus.");
		if (data.spillere.length < 3) return feilL("for-faa", "Trenger minst tre spillere.", "Needs at least three players.");
		data.oppdrag = {
			paa: true,
			per: {},
			venter: [],
			anklager: [],
			brukt: {}
		};
		data.spillere.forEach((p) => nyttOppdrag(data, p.id));
		melde(data, "🕵️ Agent 0,5 er i gang! Sjekk ditt hemmelige oppdrag – ikke vis det til noen.", "🕵️ Agent 0.5 is on! Check your secret mission – don't show it to anyone.");
		return { ok: true };
	}
	const o = data.oppdrag;
	if (!o || !o.paa) return { ok: true };
	if (hd === "op-av") {
		if (!erVert) return { feil: "bare-vert" };
		o.paa = false;
		melde(data, "Agent 0,5 er over – oppdragene er avsluttet.", "Agent 0.5 is over – the missions have ended.");
		return { ok: true };
	}
	const mitt = o.per[meg.id];
	if (hd === "op-fullfort") {
		if (!mitt) return { ok: true };
		if (o.venter.some((v) => v.fra === meg.id)) return feilL("venter", "Venter på at den andre bekrefter.", "Waiting for the other person to confirm.");
		o.venter.push({
			fra: meg.id,
			til: mitt.maal,
			t: mitt.t
		});
		return { ok: true };
	}
	if (hd === "op-bekreft") {
		const i = o.venter.findIndex((v) => v.til === meg.id && v.fra === h.fra);
		if (i < 0) return { ok: true };
		const v = o.venter.splice(i, 1)[0];
		if (h.ja) {
			giUtdeling(data, v.fra, 3);
			melde(data, `🕵️ ${navnPaa(data, v.fra)} fullførte: «${tr(v.t, "no")}»`, `🕵️ ${navnPaa(data, v.fra)} completed: “${tr(v.t, "en")}”`);
			nyttOppdrag(data, v.fra);
		}
		return { ok: true };
	}
	if (hd === "op-bytt") {
		if (!mitt) return { ok: true };
		giSlurker(data, meg.id, 1);
		nyttOppdrag(data, meg.id);
		return { ok: true };
	}
	if (hd === "op-beskyld") {
		const hvem = String(h.hvem || "");
		if (hvem === meg.id || !o.per[hvem]) return { feil: "ukjent" };
		if (o.anklager.some((a) => a.fra === meg.id)) return feilL("venter", "Du har allerede en anklage som venter.", "You already have an accusation waiting.");
		o.anklager.push({
			fra: meg.id,
			til: hvem
		});
		return { ok: true };
	}
	if (hd === "op-svar") {
		const i = o.anklager.findIndex((a) => a.til === meg.id && a.fra === h.fra);
		if (i < 0) return { ok: true };
		const a = o.anklager.splice(i, 1)[0];
		if (h.tatt) {
			giSlurker(data, meg.id, 2);
			melde(data, `🕵️ ${navnPaa(data, a.fra)} avslørte ${meg.navn}: «${tr(o.per[meg.id].t, "no")}»`, `🕵️ ${navnPaa(data, a.fra)} exposed ${meg.navn}: “${tr(o.per[meg.id].t, "en")}”`);
			nyttOppdrag(data, meg.id);
		} else {
			giSlurker(data, a.fra, 1);
			melde(data, `🕵️ ${navnPaa(data, a.fra)} tok feil om ${meg.navn} – drikk!`, `🕵️ ${navnPaa(data, a.fra)} was wrong about ${meg.navn} – drink!`);
		}
		return { ok: true };
	}
	return { ok: true };
}
function oppdragVisning(data, meg) {
	const o = data.oppdrag;
	if (!o || !o.paa) return null;
	const m = meg ? meg.id : null;
	return {
		paa: true,
		mitt: m && o.per[m] ? {
			t: o.per[m].t,
			nr: o.per[m].nr
		} : null,
		venterPaaBekreftelse: !!(m && o.venter.some((v) => v.fra === m)),
		bekreft: m ? o.venter.filter((v) => v.til === m).map((v) => ({
			fra: v.fra,
			t: v.t
		})) : [],
		anklager: m ? o.anklager.filter((a) => a.til === m).map((a) => ({ fra: a.fra })) : [],
		minAnklage: !!(m && o.anklager.some((a) => a.fra === m))
	};
}
//#endregion
export { stemUtsatt as A, kveldInn as C, settNavn as D, ryddUtsatte as E, visBok as M, startSaldo as O, visning as S, reglerForRom as T, skjermPinOk as _, finnSpiller as a, varsle as b, handling as c, lagRom as d, lekeliste as f, rensNavn as g, rensLang as h, erPlussLek as i, vinnerValg as j, stemBort as k, hentRom as l, pakkeKort as m, blimed as n, finnVenter as o, loggRom as p, endreRom as r, gyldigKode as s, PAKKER as t, kveldForGjeng as u, skjermVisning as v, profilNavn as w, venteInn as x, startSaldoFor as y };
