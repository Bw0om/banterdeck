import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { n as rpc } from "./spilt_2dqjF3k8.mjs";
import { o as innloggetBruker, s as json } from "./konto_Cyp1VvAa.mjs";
import { A as stemUtsatt, D as settNavn, O as startSaldo, T as reglerForRom, b as varsle, d as lagRom, f as lekeliste, g as rensNavn$1, j as vinnerValg, k as stemBort, l as hentRom, n as blimed, p as loggRom, r as endreRom, w as profilNavn, y as startSaldoFor } from "./rom_CLYEJdd8.mjs";
import { i as sendTilGjeng, t as gyldigAbonnement } from "./push_FIMjp49L.mjs";
//#region src/pages/api/gjeng/index.ts
var gjeng_exports = /* @__PURE__ */ __exportAll({
	GET: () => GET,
	POST: () => POST,
	prerender: () => false
});
var UUID = /^[0-9a-f-]{36}$/i;
var rensNavn = (x) => String(x || "").replace(/[\u0000-\u001f<>]/g, "").replace(/\s+/g, " ").trim().slice(0, 40);
var GET = async ({ request }) => {
	try {
		const u = await innloggetBruker(request);
		if (!u) return json({
			feil: "logg-inn",
			melding: "Logg inn for å se gjengene dine."
		}, 401);
		return json({ gjenger: await rpc("gjeng_mine", { p_user: u.id }) || [] });
	} catch (e) {
		console.warn("Gjenger feilet:", e.message);
		return json({
			feil: "server",
			melding: "Fikk ikke hentet gjengene akkurat nå."
		}, 503);
	}
};
var POST = async ({ request }) => {
	let d;
	try {
		d = await request.json();
	} catch {
		return json({ feil: "ugyldig" }, 400);
	}
	try {
		const u = await innloggetBruker(request);
		if (!u) return json({
			feil: "logg-inn",
			melding: "Logg inn eller lag en gratis konto først."
		}, 401);
		const id = String(d.id || "");
		const lang = /^en/.test(request.headers.get("x-lang") || "") ? "en" : "no", en = lang === "en";
		switch (d.handling) {
			case "lag": {
				const navn = rensNavn(d.navn);
				if (!navn) return json({
					feil: "navn",
					melding: "Gi gjengen et navn."
				}, 400);
				const g = await rpc("gjeng_lag", {
					p_user: u.id,
					p_navn: navn
				});
				if (!g || g.feil) return json({
					feil: "tak",
					melding: g && g.melding || "Fikk ikke laget gjengen."
				}, 400);
				return json({
					ok: true,
					gjeng: g
				});
			}
			case "bli-med": {
				const kode = String(d.kode || "").trim().toUpperCase();
				if (!/^[A-Z0-9]{8}$/.test(kode)) return json({
					feil: "kode",
					melding: "Gjengkoden har åtte tegn."
				}, 400);
				const g = await rpc("gjeng_bli_med", {
					p_user: u.id,
					p_kode: kode
				});
				if (!g || g.feil) return json({
					feil: "kode",
					melding: g && g.melding || "Fant ikke gjengen."
				}, 404);
				return json({
					ok: true,
					gjeng: g
				});
			}
			case "endre": {
				const navn = rensNavn(d.navn);
				if (!UUID.test(id) || !navn) return json({ feil: "ugyldig" }, 400);
				return await rpc("gjeng_endre", {
					p_user: u.id,
					p_id: id,
					p_navn: navn
				}) ? json({ ok: true }) : json({
					feil: "eier",
					melding: "Bare den som laget gjengen kan endre navnet."
				}, 403);
			}
			case "slett":
				if (!UUID.test(id)) return json({ feil: "ugyldig" }, 400);
				return await rpc("gjeng_slett", {
					p_user: u.id,
					p_id: id
				}) ? json({ ok: true }) : json({
					feil: "eier",
					melding: "Bare den som laget gjengen kan slette den."
				}, 403);
			case "forlat":
				if (!UUID.test(id)) return json({ feil: "ugyldig" }, 400);
				await rpc("gjeng_forlat", {
					p_user: u.id,
					p_id: id
				});
				return json({ ok: true });
			case "start-kveld": {
				if (!UUID.test(id)) return json({ feil: "ugyldig" }, 400);
				const g = await rpc("gjeng_tilgang", {
					p_user: u.id,
					p_id: id
				});
				if (!g) return json({
					feil: "medlem",
					melding: en ? "Only crew members can start a night." : "Bare medlemmer kan starte kveld."
				}, 403);
				const navn = await gjengNavn(id, u.id, d.navn);
				if (!navn) return json({
					feil: "navn",
					melding: en ? "Enter your name." : "Skriv inn navnet ditt."
				}, 400);
				const aktiv = await aktivKveld(id);
				if (aktiv) return json(await inn(aktiv, u.id, navn, lang));
				const alle = lekeliste(lang), lov = new Set(alle.map((x) => x.id).concat(["bors"]));
				const leker = (Array.isArray(d.leker) ? d.leker : []).map(String).filter((x) => lov.has(x)).slice(0, 12);
				if (!leker.length && d.rask !== true) return json({
					feil: "leker",
					melding: en ? "Pick at least one game." : "Velg minst én lek."
				}, 400);
				let regler = [];
				try {
					const l = await rpc("gjeng_lov_hent", { p_gjeng: id });
					if (l) regler = reglerForRom(l.lov);
				} catch {}
				const { kode, spiller } = await lagRom(navn, "", "", lang);
				await endreRom(kode, (data) => {
					data.gjeng = {
						id: g.id,
						navn: g.navn,
						kode: g.kode,
						regler
					};
					data.gjengKveld = true;
					data.plan = leker.length ? leker : null;
					data.spillere[0].konto = u.id;
					return { ok: true };
				});
				await rpc("gjeng_kveld_aktiv_sett", {
					p_gjeng: id,
					p_rom: kode
				}).catch(() => null);
				await loggRom("lag", "gjengkveld").catch(() => null);
				const navnPaa = (x) => x === "bors" ? "Vorsbørsen" : (lekeliste("no").find((y) => y.id === x) || {}).navn || x;
				const liste = leker.slice(0, 3).map(navnPaa).join(", ") + (leker.length > 3 ? " …" : "");
				const hva = liste ? ` – ${liste}` : "";
				try {
					await Promise.race([sendTilGjeng(id, u.id, {
						tittel: `${g.navn}: kvelden starter! 🎉`,
						tekst: `${navn} har startet kveld${hva}. Trykk for å bli med.`,
						url: "/no/gjeng?k=" + g.kode
					}), new Promise((ok) => setTimeout(ok, 4e3))]);
				} catch (e) {
					console.warn("Gjengvarsel feilet:", e.message);
				}
				return json({
					ok: true,
					kode,
					id: spiller.id,
					pollett: spiller.pollett
				});
			}
			case "bli-kveld": {
				if (!UUID.test(id)) return json({ feil: "ugyldig" }, 400);
				if (!await rpc("gjeng_tilgang", {
					p_user: u.id,
					p_id: id
				})) return json({
					feil: "medlem",
					melding: en ? "You’re not in this crew." : "Du er ikke med i gjengen."
				}, 403);
				const navn = await gjengNavn(id, u.id, d.navn);
				if (!navn) return json({
					feil: "navn",
					melding: en ? "Enter your name." : "Skriv inn navnet ditt."
				}, 400);
				const aktiv = await aktivKveld(id);
				if (!aktiv) return json({
					feil: "ingen",
					melding: en ? "The night is over." : "Kvelden er over."
				}, 404);
				const r = await inn(aktiv, u.id, navn, lang);
				return r.feil ? json(r, 409) : json(r);
			}
			case "lov-stem": {
				if (!UUID.test(id) || !/^[\w-]{3,60}$/.test(String(d.regel || ""))) return json({ feil: "ugyldig" }, 400);
				if (!await rpc("gjeng_tilgang", {
					p_user: u.id,
					p_id: id
				})) return json({
					feil: "medlem",
					melding: en ? "Only crew members can vote." : "Bare medlemmer av gjengen kan stemme."
				}, 403);
				const antall = Number(await rpc("gjeng_antall", { p_gjeng: id })) || 1;
				const r = await endreBok(id, (bok) => {
					const x = stemBort(bok, String(d.regel), u.id, "", antall);
					return x.feil ? { feil: en ? x.en : x.feil } : x.bok;
				});
				return r.feil ? json({
					feil: "lov",
					melding: r.feil
				}, 409) : json({ ok: true });
			}
			case "lov-valg": {
				if (!UUID.test(id)) return json({ feil: "ugyldig" }, 400);
				if (!await rpc("gjeng_tilgang", {
					p_user: u.id,
					p_id: id
				})) return json({ feil: "medlem" }, 403);
				const r = await endreBok(id, (bok) => {
					const x = vinnerValg(bok, String(d.kveld || ""), {
						navn: "",
						konto: u.id
					}, {
						type: String(d.type || ""),
						tekst: d.tekst,
						regel: String(d.regel || "")
					});
					return x.feil ? { feil: en ? x.en : x.feil } : x.bok;
				});
				return r.feil ? json({
					feil: "lov",
					melding: r.feil
				}, 409) : json({ ok: true });
			}
			case "profil": {
				if (!UUID.test(id)) return json({ feil: "ugyldig" }, 400);
				if (!await rpc("gjeng_tilgang", {
					p_user: u.id,
					p_id: id
				})) return json({ feil: "medlem" }, 403);
				const r = await endreBok(id, (bok) => {
					const x = settNavn(bok, u.id, String(d.navn || ""));
					return x.feil ? { feil: en ? x.en : x.feil } : x.bok;
				});
				return r.feil ? json({
					feil: "navn",
					melding: r.feil
				}, 400) : json({ ok: true });
			}
			case "utsatt-stem": {
				if (!UUID.test(id)) return json({ feil: "ugyldig" }, 400);
				if (!await rpc("gjeng_tilgang", {
					p_user: u.id,
					p_id: id
				})) return json({ feil: "medlem" }, 403);
				const antall = Number(await rpc("gjeng_antall", { p_gjeng: id }).catch(() => 99)) || 99;
				const r = await endreBok(id, (bok) => {
					const x = stemUtsatt(bok, String(d.aksje || ""), u.id, String(d.v || ""), antall);
					return x.feil ? { feil: en ? x.en : x.feil } : x.bok;
				});
				return r.feil ? json({
					feil: "stem",
					melding: r.feil
				}, 409) : json({ ok: true });
			}
			case "varsel":
				if (!UUID.test(id)) return json({ feil: "ugyldig" }, 400);
				if (!await rpc("gjeng_tilgang", {
					p_user: u.id,
					p_id: id
				})) return json({ feil: "medlem" }, 403);
				if (d.paa === false) {
					await rpc("gjeng_varsel_fjern", {
						p_gjeng: id,
						p_endpoint: String(d.sub && d.sub.endpoint || d.endpoint || "").slice(0, 1e3)
					});
					return json({ ok: true });
				}
				if (!gyldigAbonnement(d.sub)) return json({ feil: "ugyldig" }, 400);
				await rpc("gjeng_varsel_lagre", {
					p_user: u.id,
					p_gjeng: id,
					p_endpoint: d.sub.endpoint,
					p_nokler: {
						p256dh: d.sub.keys.p256dh,
						auth: d.sub.keys.auth
					}
				});
				return json({ ok: true });
			case "slett-kveld": {
				const kveld = Number(d.kveld);
				if (!UUID.test(id) || !(kveld > 0)) return json({ feil: "ugyldig" }, 400);
				return await rpc("gjeng_kveld_slett", {
					p_user: u.id,
					p_gjeng: id,
					p_kveld: kveld
				}) ? json({ ok: true }) : json({
					feil: "eier",
					melding: "Bare den som laget gjengen kan fjerne kvelder."
				}, 403);
			}
		}
		return json({ feil: "ukjent" }, 400);
	} catch (e) {
		console.warn("Gjeng-handling feilet:", e.message);
		return json({
			feil: "server",
			melding: "Det gikk ikke akkurat nå. Prøv igjen."
		}, 503);
	}
};
/** Rommet til gjengkvelden som pågår, eller null. */
async function aktivKveld(gjengId) {
	try {
		const kode = await rpc("gjeng_kveld_aktiv", { p_gjeng: gjengId });
		if (!kode || typeof kode !== "string") return null;
		const rom = await hentRom(kode);
		if (!rom || rom.data.ferdig || !rom.data.gjengKveld || Date.now() - rom.data.laget > 72e6) return null;
		return kode;
	} catch {
		return null;
	}
}
/** Et medlem blir med i kvelden (eller får plassen sin tilbake på en ny telefon). */
async function inn(kode, konto, navn, lang) {
	let meg = null, startKr = null;
	try {
		const rom = await hentRom(kode);
		if (rom && rom.data.bors && rom.data.gjeng) {
			const l = await rpc("gjeng_lov_hent", { p_gjeng: rom.data.gjeng.id });
			if (l) startKr = startSaldo(l.lov, konto);
		}
	} catch {}
	const res = await endreRom(kode, (data) => {
		const fra = data.spillere.find((p) => p.konto === konto);
		if (fra) {
			meg = fra;
			return { ok: true };
		}
		const r = blimed(data, navn, lang);
		if (r.feil) return r;
		r.spiller.konto = konto;
		meg = r.spiller;
		startSaldoFor(data, r.spiller.id, startKr);
		return { ok: true };
	});
	if (res.feil) return {
		feil: res.feil,
		melding: res.melding || (lang === "en" ? "Couldn’t join the night." : "Fikk ikke blitt med i kvelden.")
	};
	await varsle(kode, res.versjon);
	return {
		ok: true,
		kode,
		id: meg.id,
		pollett: meg.pollett
	};
}
/** Leser og lagrer lovboka med versjonssjekk. Endringen kan svare { feil }. */
async function endreBok(gjengId, endring) {
	for (let i = 0; i < 4; i++) {
		const cur = await rpc("gjeng_lov_hent", { p_gjeng: gjengId });
		if (!cur) return { feil: "Fant ikke gjengen." };
		const ny = endring(cur.lov);
		if (!ny || ny.feil) return ny || { feil: "Det gikk ikke." };
		const v = await rpc("gjeng_lov_lagre", {
			p_gjeng: gjengId,
			p_lov: ny,
			p_versjon: cur.versjon
		});
		if (v !== null && v !== void 0) return { ok: true };
	}
	return { feil: "Noen andre endret lovboka samtidig. Prøv igjen." };
}
/** Navnet ditt i gjengen: det du skrev nå (lagres i profilen), ellers det som ligger i profilen. */
async function gjengNavn(gjengId, konto, onsket) {
	const ny = rensNavn$1(onsket);
	try {
		const l = await rpc("gjeng_lov_hent", { p_gjeng: gjengId });
		const gammel = l ? profilNavn(l.lov, konto) : "";
		if (ny && ny !== gammel) await endreBok(gjengId, (bok) => {
			return settNavn(bok, konto, ny).bok || null;
		});
		return ny || gammel;
	} catch {
		return ny;
	}
}
//#endregion
//#region \0virtual:astro:page:src/pages/api/gjeng/index@_@ts
var page = () => gjeng_exports;
//#endregion
export { page };
