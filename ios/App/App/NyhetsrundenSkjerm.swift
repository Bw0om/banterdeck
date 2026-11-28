import SwiftUI
import UIKit
import WebKit

/// Nyhetsrunden som native skjerm: avishodet, spørsmålet, svarmåten (A–D, talltastatur eller skrivedialogen),
/// avsløringen med hoder på svarene og nåler på tallinja, lista og pallen til slutt.
/// Fase 3: skjermen leser rommet selv (LekKobling/RomKlient) og sender svar og vertens knapper rett til rommet. Nettsiden
/// gir plassen i rommet, figurene, skrivedialogen for fritt svar og «Hva nå?»-knappene. Med eldre rom.js brukes nrData som reserve.
struct NrHode: Identifiable { let id: String; let navn: String; let png: String; let oppe: Bool }
struct NrLengde: Identifiable { let id: Int; let g: String; let tekst: String; let valgt: Bool }
struct NrAlt: Identifiable { let id: Int; let bokstav: String; let tekst: String; let valgt: Bool; let rett: Bool; let feil: Bool; let hoder: [NrHode]; let stempel: String }
struct NrPinne: Identifiable { let id: String; let png: String; let x: Double; let rad: Int; let tekst: String; let beste: Bool; let flat: Bool }
struct NrRad: Identifiable { let id: String; let navn: String; let png: String; let hva: String; let tomt: Bool; let merke: String; let klasse: String; let kanFlippe: Bool }
struct NrPall: Identifiable { let id: String; let navn: String; let png: String; let n: Int; let plass: Int }
struct NrKaaring: Identifiable { let id: Int; let tittel: String; let tekst: String }
struct NrTall { let etikett: String, taster: [String], mitt: String, las: String, bytt: String, last: String }
struct NrFritt { let skjemaId: String, knapp: String, svart: String }
struct NrKlar { let forside: String, under: String, hoder: [NrHode], lengder: [NrLengde], start: String, vent: String }
struct NrSpm { let qtype: String, mitt: String, alt: [NrAlt], tall: NrTall?, fritt: NrFritt?, vis: String, vent: String, folk: [NrHode], status: String }
struct NrTallinje { let fasitX: Double, fasitTekst: String, pinner: [NrPinne], rader: Int }
struct NrResultat { let klasse: String, tittel: String, info: String, kilde: String, url: String }
struct NrSvar { let fasitEtikett: String, fasit: String, alt: [NrAlt], tallinje: NrTallinje?, liste: [NrRad], resultat: NrResultat?, neste: String, vent: String }
struct NrFerdig { let tittel: String, pall: [NrPall], kaaringer: [NrKaaring], rest: [NrPall], nyEtikett: String, lengder: [NrLengde], smaa: String }

struct NrData {
    var fase = "", i = 0, antall = 0, uke = "", vert = false, naa: Double = 0, frist: Double = 0, lokale = "nb-NO", tittel = "Nyhetsrunden", under = ""
    var sporsmalType = "", les = "", q = ""
    var klar: NrKlar? = nil, spm: NrSpm? = nil, svar: NrSvar? = nil, ferdig: NrFerdig? = nil, stua = "Stua", mer = "Mer"

    static func hode(_ h: [String: Any]) -> NrHode { NrHode(id: h["id"] as? String ?? "", navn: h["navn"] as? String ?? "", png: h["png"] as? String ?? "", oppe: h["oppe"] as? Bool ?? false) }
    static func hoder(_ l: Any?) -> [NrHode] { (l as? [[String: Any]] ?? []).map { hode($0) } }
    static func lengder(_ l: Any?) -> [NrLengde] { (l as? [[String: Any]] ?? []).map { x in NrLengde(id: (x["n"] as? NSNumber)?.intValue ?? 0, g: x["g"] as? String ?? "nr-lengde", tekst: x["tekst"] as? String ?? "", valgt: x["valgt"] as? Bool ?? false) } }
    static func alt(_ l: Any?) -> [NrAlt] {
        (l as? [[String: Any]] ?? []).enumerated().map { i, a in NrAlt(id: i, bokstav: a["bokstav"] as? String ?? "", tekst: a["tekst"] as? String ?? "", valgt: a["valgt"] as? Bool ?? false, rett: a["rett"] as? Bool ?? false, feil: a["feil"] as? Bool ?? false, hoder: hoder(a["hoder"]), stempel: a["stempel"] as? String ?? "") }
    }
    static func pall(_ l: Any?) -> [NrPall] { (l as? [[String: Any]] ?? []).map { p in NrPall(id: p["id"] as? String ?? "", navn: p["navn"] as? String ?? "", png: p["png"] as? String ?? "", n: (p["n"] as? NSNumber)?.intValue ?? 0, plass: (p["plass"] as? NSNumber)?.intValue ?? 1) } }
    /// Reserven: skjermen slik eldre rom.js lager den (nrData)
    init(_ d: [String: Any]) {
        func s(_ k: String) -> String { d[k] as? String ?? "" }
        func n(_ k: String) -> Double { (d[k] as? NSNumber)?.doubleValue ?? 0 }
        fase = s("fase"); i = Int(n("i")); antall = Int(n("antall")); uke = s("uke"); vert = d["vert"] as? Bool ?? false; naa = n("naa"); frist = n("frist"); lokale = s("lokale")
        tittel = s("tittel").isEmpty ? "Nyhetsrunden" : s("tittel"); under = s("under")
        let sp = d["sporsmal"] as? [String: Any] ?? [:]
        sporsmalType = sp["type"] as? String ?? ""; les = sp["les"] as? String ?? ""; q = sp["q"] as? String ?? ""
        if let k = d["klar"] as? [String: Any] {
            klar = NrKlar(forside: k["forside"] as? String ?? "", under: k["under"] as? String ?? "", hoder: NrData.hoder(k["hoder"]), lengder: NrData.lengder(k["lengder"]), start: k["start"] as? String ?? "", vent: k["vent"] as? String ?? "")
        } else { klar = nil }
        if let x = d["spm"] as? [String: Any] {
            var tall: NrTall? = nil, fritt: NrFritt? = nil
            if let t = x["tall"] as? [String: Any] { tall = NrTall(etikett: t["etikett"] as? String ?? "", taster: t["taster"] as? [String] ?? [], mitt: t["mitt"] as? String ?? "", las: t["las"] as? String ?? "", bytt: t["bytt"] as? String ?? "", last: t["last"] as? String ?? "") }
            if let f = x["fritt"] as? [String: Any] { fritt = NrFritt(skjemaId: f["skjemaId"] as? String ?? "nrSkjema", knapp: f["knapp"] as? String ?? "", svart: f["svart"] as? String ?? "") }
            spm = NrSpm(qtype: x["qtype"] as? String ?? "", mitt: x["mitt"] as? String ?? "", alt: NrData.alt(x["alt"]), tall: tall, fritt: fritt, vis: x["vis"] as? String ?? "", vent: x["vent"] as? String ?? "", folk: NrData.hoder(x["folk"]), status: x["status"] as? String ?? "")
        } else { spm = nil }
        if let x = d["svar"] as? [String: Any] {
            var linje: NrTallinje? = nil, res: NrResultat? = nil
            if let t = x["tallinje"] as? [String: Any] {
                linje = NrTallinje(fasitX: (t["fasitX"] as? NSNumber)?.doubleValue ?? 50, fasitTekst: t["fasitTekst"] as? String ?? "",
                                   pinner: (t["pinner"] as? [[String: Any]] ?? []).map { p in NrPinne(id: p["id"] as? String ?? "", png: p["png"] as? String ?? "", x: (p["x"] as? NSNumber)?.doubleValue ?? 50, rad: (p["rad"] as? NSNumber)?.intValue ?? 0, tekst: p["tekst"] as? String ?? "", beste: p["beste"] as? Bool ?? false, flat: p["flat"] as? Bool ?? false) },
                                   rader: (t["rader"] as? NSNumber)?.intValue ?? 1)
            }
            if let r = x["resultat"] as? [String: Any] { res = NrResultat(klasse: r["klasse"] as? String ?? "", tittel: r["tittel"] as? String ?? "", info: r["info"] as? String ?? "", kilde: r["kilde"] as? String ?? "", url: r["url"] as? String ?? "") }
            svar = NrSvar(fasitEtikett: x["fasitEtikett"] as? String ?? "", fasit: x["fasit"] as? String ?? "", alt: NrData.alt(x["alt"]), tallinje: linje,
                          liste: (x["liste"] as? [[String: Any]] ?? []).map { r in NrRad(id: r["id"] as? String ?? "", navn: r["navn"] as? String ?? "", png: r["png"] as? String ?? "", hva: r["hva"] as? String ?? "", tomt: r["tomt"] as? Bool ?? false, merke: r["merke"] as? String ?? "", klasse: r["klasse"] as? String ?? "", kanFlippe: r["kanFlippe"] as? Bool ?? false) },
                          resultat: res, neste: x["neste"] as? String ?? "", vent: x["vent"] as? String ?? "")
        } else { svar = nil }
        if let f = d["ferdig"] as? [String: Any] {
            ferdig = NrFerdig(tittel: f["tittel"] as? String ?? "", pall: NrData.pall(f["pall"]), kaaringer: (f["kaaringer"] as? [[String: Any]] ?? []).enumerated().map { i, k in NrKaaring(id: i, tittel: k["tittel"] as? String ?? "", tekst: k["tekst"] as? String ?? "") },
                              rest: NrData.pall(f["rest"]), nyEtikett: f["nyEtikett"] as? String ?? "", lengder: NrData.lengder(f["lengder"]), smaa: f["smaa"] as? String ?? "")
        } else { ferdig = nil }
        if !s("stua").isEmpty { stua = s("stua") }
        if !s("mer").isEmpty { mer = s("mer") }
    }

    /// Skjermen bygd rett fra rommet: `spill` er serverens visning av Nyhetsrunden (nyeVisning i rom.ts)
    init(rom t: RomTilstand, hoder: [String: [String: String]]) {
        let s = t.spill ?? .null
        let en = t.lang == "en"
        func T(_ no: String, _ eng: String) -> String { en ? eng : no }
        let meg = t.meg ?? ""
        let alle = t.spillere
        func navn(_ id: String?) -> String { id.flatMap { t.spiller($0)?.navn } ?? "?" }
        func tall(_ v: JSONVerdi?) -> Int { Int(v?.tall ?? 0) }
        func tekster(_ v: JSONVerdi?) -> [String] { (v?.liste ?? []).compactMap(\.tekst) }
        /// Som String(x) i nettleseren: tall uten «.0», tekst som den er
        func som(_ v: JSONVerdi?) -> String {
            switch v {
            case .tekst(let x)?: return x
            case .tall(let n)?: return n == n.rounded() && abs(n) < 1e15 ? String(Int(n)) : String(n)
            default: return ""
            }
        }
        let lok = en ? "en-GB" : "nb-NO"
        /// Som nrFormat: tall med skilletegn etter språket, ellers teksten
        func format(_ x: String) -> String {
            guard !x.isEmpty, let n = Double(x) else { return x }
            let f = NumberFormatter(); f.numberStyle = .decimal; f.locale = Locale(identifier: lok); f.maximumFractionDigits = 3
            return f.string(from: NSNumber(value: n)) ?? x
        }
        func fjes(_ id: String, _ uttrykk: String = "", oppe: Bool = false) -> NrHode {
            NrHode(id: id, navn: id == meg ? T("Du", "You") : navn(id), png: figurPng(hoder, id, uttrykk: uttrykk), oppe: oppe)
        }

        let f = s["fase"]?.tekst ?? ""
        fase = f; i = tall(s["i"]); antall = tall(s["antall"]); uke = som(s["uke"]); vert = t.jegErVert; naa = t.naa; lokale = lok
        let lengde = tall(s["lengde"]), totalt = tall(s["totalt"])
        let vertId = s["vert"]?.tekst ?? t.vert
        under = T("Uke ", "Week ") + uke + " · " + (f == "klar" ? "\(lengde)" + T(" spørsmål", " questions") : f == "ferdig" ? "\(antall)" + T(" spørsmål", " questions") : T("Spørsmål ", "Question ") + "\(i + 1)" + T(" av ", " of ") + "\(antall)")
        stua = T("Stua", "Lounge"); mer = T("Mer", "More")
        func lengder(_ g: String) -> [NrLengde] {
            var valg = [10, 15, 30].filter { $0 < totalt }
            if !valg.contains(totalt) { valg.append(totalt) }
            return valg.map { n in NrLengde(id: n, g: g, tekst: n == totalt ? T("Hele", "All") : n <= 10 ? T("Kort", "Short") : T("Vanlig", "Usual"), valgt: g == "nr-lengde" && lengde == n) }
        }

        if f == "klar" {
            klar = NrKlar(forside: T("Uke ", "Week ") + uke + ".", under: T("Hva fikk dere med dere?", "Were you paying attention?"), hoder: alle.map { fjes($0.id) },
                          lengder: vert ? lengder("nr-lengde") : [], start: vert ? T("Første spørsmål", "First question") : "",
                          vent: vert ? "" : T("Venter på at ", "Waiting for ") + navn(vertId) + T(" starter …", " to start …"))
            return
        }
        if f == "ferdig" {
            let l = (s["tavle"]?.liste ?? []).map { x in (id: x["id"]?.tekst ?? "", navn: x["navn"]?.tekst ?? "", riktige: tall(x["riktige"])) }
            let k = s["kaaringer"]
            let delt = l.filter { x in l.first.map { x.riktige == $0.riktige } ?? false }
            var kaar: [NrKaaring] = []
            func legg(_ tittel: String, _ tekst: String) { kaar.append(NrKaaring(id: kaar.count, tittel: tittel, tekst: tekst)) }
            if let x = k?["tall"], let id = x["id"]?.tekst {
                legg(T("Tallgeni:", "Number genius:"), navn(id) + T(" var nærmest på ", " was closest on ") + "\(tall(x["n"]))" + T(" av ", " of ") + "\(tall(k?["tallAntall"]))" + T(" tallspørsmål", " number questions"))
            }
            if let x = k?["lurt"], let id = x["id"]?.tekst {
                legg(T("Lurt av tull:", "Fooled by nonsense:"), navn(id) + T(" trodde på ", " believed ") + "\(tall(x["n"]))" + T(" av ", " of ") + "\(tall(k?["tullAntall"]))" + T(" tullesaker", " made-up stories"))
            }
            if let x = k?["ingen"], x != .null {
                let q = som(x["q"])
                legg(T("Ingen fikk:", "Nobody got:"), "«" + String(q.prefix(90)) + (q.count > 90 ? "…" : "") + "» (" + som(x["svar"]) + ")")
            }
            let tittel: String
            if l.first == nil || l[0].riktige == 0 { tittel = T("Ingen fikk noe riktig", "Nobody got anything right") }
            else if delt.count > 1 { tittel = T("Delt seier: ", "Shared win: ") + delt.map(\.navn).joined(separator: T(" og ", " and ")) }
            else { tittel = T("Ukens nyhetsnerd: ", "News nerd of the week: ") + l[0].navn }
            func plass(_ x: (id: String, navn: String, riktige: Int), _ nr: Int) -> NrPall { NrPall(id: x.id, navn: x.navn, png: figurPng(hoder, x.id), n: x.riktige, plass: nr) }
            ferdig = NrFerdig(tittel: tittel, pall: l.prefix(3).enumerated().map { j, x in plass(x, j + 1) }, kaaringer: kaar,
                              rest: l.dropFirst(3).enumerated().map { j, x in plass(x, j + 4) },
                              nyEtikett: vert ? T("Ny runde fra uke ", "New round from week ") + uke : "", lengder: vert ? lengder("nr-nytt") : [],
                              smaa: vert ? T("Kort og vanlig tar spørsmål dere ikke har hatt ennå.", "Short and usual pick questions you have not had yet.") : "")
            return
        }

        let spmFase = f == "spm", har = tekster(s["harSvart"])
        let mitt: String? = { let m = som(s["mittSvar"]); return m.isEmpty ? nil : m }()
        let qtype = s["qtype"]?.tekst ?? ""
        let alts: [String]? = s["alt"]?.liste.map { $0.compactMap(\.tekst) }
        let typer = en ? ["valg": "Pick the right one", "sant": "True or nonsense?", "tall": "Which number? Closest wins", "fritt": "Free answer",
                          "naermest": "Closest – furthest off drinks", "hvemskalut": "Odd one out", "bloff": "Bluff – which one is real?"]
                       : ["valg": "Velg riktig", "sant": "Sant eller tull?", "tall": "Hvilket tall? Nærmest vinner", "fritt": "Svar fritt",
                          "naermest": "Nærmest – lengst unna drikker", "hvemskalut": "Hvem skal ut?", "bloff": "Bløff – hvilken er ekte?"]
        // Format 2 av ukefilene: den egentlige typen, runden (finalen teller dobbelt), enheten på nærmest-spørsmål og «godtas også»
        let egenType = s["type"]?.tekst ?? qtype, rundeNavn = s["runde"]?["navn"]?.tekst ?? "", finale = s["runde"]?["finale"] == .bool(true)
        let enhet = s["enhet"]?.tekst ?? "", godtas = tekster(s["godtas"])
        let bokstaver = Array("ABCD")
        func bokstav(_ i: Int) -> String { i < bokstaver.count ? String(bokstaver[i]) : "" }
        frist = spmFase ? (s["frist"]?.tall ?? 0) : 0
        sporsmalType = (rundeNavn.isEmpty ? "" : rundeNavn + " · ") + (typer[egenType] ?? typer[qtype] ?? "")
        les = vert && spmFase ? T("Les det høyt", "Read it out loud") : ""
        q = som(s["q"])

        if spmFase {
            let mangler = alle.count - har.count
            var tastatur: NrTall? = nil, fritt: NrFritt? = nil
            if qtype == "tall" && alts == nil {
                tastatur = NrTall(etikett: T("Gjetningen din", "Your guess") + (enhet.isEmpty ? "" : " (\(enhet))"), taster: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "000", "0", "⌫"],
                                  mitt: (mitt ?? "").filter(\.isNumber), las: T("Lås inn ", "Lock in "), bytt: T("Bytt til ", "Change to "), last: T("Låst inn: ", "Locked in: "))
            }
            if alts == nil && qtype != "tall" {
                fritt = NrFritt(skjemaId: "nrSkjema", knapp: mitt != nil ? T("Endre svaret", "Change the answer") : T("Skriv svaret ditt", "Type your answer"),
                                svart: mitt.map { T("Du svarte: ", "You answered: ") + $0 } ?? "")
            }
            spm = NrSpm(qtype: qtype, mitt: mitt ?? "",
                        alt: (alts ?? []).enumerated().map { i, a in NrAlt(id: i, bokstav: bokstav(i), tekst: a, valgt: mitt == a, rett: false, feil: false, hoder: [], stempel: "") },
                        tall: tastatur, fritt: fritt,
                        vis: vert ? (mangler > 0 ? T("Vis svaret nå", "Show the answer now") + " (\(mangler)" + T(" mangler", " missing") + ")" : T("Vis svaret", "Show the answer")) : "",
                        vent: vert ? "" : mitt != nil ? T("Låst inn.", "Locked in.") : "",
                        folk: alle.map { fjes($0.id, oppe: har.contains($0.id)) }, status: "\(har.count)" + T(" av ", " of ") + "\(alle.count)" + T(" har svart", " answered"))
            return
        }

        // Svaret er vist
        let res = (s["resultat"]?.objekt ?? [:]).compactMapValues(\.tall).mapValues { Int($0) }
        let sv = (s["svarene"]?.objekt ?? [:]).mapValues { som($0) }.filter { !$0.value.isEmpty }
        let erTall = qtype == "tall", k2 = res[meg], fasit = som(s["fasit"])
        var alt: [NrAlt] = [], linje: NrTallinje? = nil, liste: [NrRad] = [], resultat: NrResultat? = nil
        if let alts {
            alt = alts.enumerated().map { i, a in
                let rett = a == fasit, minn = mitt == a
                return NrAlt(id: i, bokstav: bokstav(i), tekst: a, valgt: false, rett: rett, feil: !rett && minn,
                             hoder: alle.filter { sv[$0.id] == a }.map { fjes($0.id, rett ? "" : "flat") }, stempel: rett ? T("Riktig", "Right") : minn ? T("Feil", "Wrong") : "")
            }
        }
        if erTall, let tl = s["tall"], tl != .null {
            // Fasiten i midten, gjetningene etter hvor mange ganger for høyt eller lavt de var (som nrTallinje)
            let tf = tl["fasit"]?.tall ?? 0
            let gjett = (tl["gjett"]?.liste ?? []).map { g in (id: g["id"]?.tekst ?? "", v: g["v"]?.tall ?? 0) }
            let pos: (Double) -> Double
            if tf > 0 && gjett.allSatisfy({ $0.v > 0 }) {
                let maks = ([0.05] + gjett.map { abs(log($0.v / tf)) }).max() ?? 0.05
                pos = { v in 50 + 44 * log(v / tf) / maks }
            } else {
                let alleV = gjett.map(\.v) + [tf]
                var lo = alleV.min() ?? 0, hi = alleV.max() ?? 0
                if hi - lo < 1e-9 { lo -= 1; hi += 1 }
                let pad = (hi - lo) * 0.08, lo2 = lo, hi2 = hi
                pos = { v in (v - lo2 + pad) / (hi2 - lo2 + 2 * pad) * 100 }
            }
            var rader: [Double] = []
            var pinner: [NrPinne] = []
            let sortert = gjett.enumerated().sorted { a, b in a.element.v != b.element.v ? a.element.v < b.element.v : a.offset < b.offset }.map(\.element)
            for g in sortert {
                let x = pos(g.v)
                var rad = 0
                while rad < rader.count && x - rader[rad] < 17 { rad += 1 }
                if rad < rader.count { rader[rad] = x } else { rader.append(x) }
                let r = res[g.id]
                pinner.append(NrPinne(id: g.id, png: figurPng(hoder, g.id, uttrykk: (r ?? 0) < 0 ? "flat" : ""), x: x, rad: rad,
                                      tekst: format(som(.tall(g.v))), beste: r == 2, flat: (r ?? 0) < 0))
            }
            linje = NrTallinje(fasitX: pos(tf), fasitTekst: format(som(.tall(tf))), pinner: pinner, rader: rader.count)
        }
        if alts == nil {
            // Som sorteringen i nettleseren, (res || -1): 0 og «ingen» står likt; ellers rekkefølgen rundt bordet
            func noekkel(_ id: String) -> Int { let r = res[id] ?? 0; return r == 0 ? -1 : r }
            liste = alle.enumerated().sorted { a, b in
                noekkel(a.element.id) != noekkel(b.element.id) ? noekkel(a.element.id) > noekkel(b.element.id) : a.offset < b.offset
            }.map { _, p in
                let kk = res[p.id], hva = sv[p.id]
                let merke = kk == 2 ? T("Nærmest", "Closest") : kk == 1 ? (erTall ? T("Innen 10 %", "Within 10%") : T("Riktig", "Right")) : kk == 0 ? "–" : T("Drikk", "Drink")
                let vis = hva.map { erTall && !$0.isEmpty && $0.allSatisfy(\.isNumber) ? format($0) : $0 } ?? T("ingen svar", "no answer")
                return NrRad(id: p.id, navn: p.navn, png: figurPng(hoder, p.id, uttrykk: (kk ?? 0) < 0 ? "flat" : ""), hva: vis, tomt: hva == nil, merke: merke,
                             klasse: (kk ?? -1) > 0 ? "rett" : kk == 0 ? "null" : "feil", kanFlippe: t.jegErVert)
            }
        }
        if alle.contains(where: { $0.id == meg }) {
            let tittel = k2 == 2 ? T("Nærmest – del ut to", "Closest – hand out two")
                : k2 == 1 ? (erTall ? T("Innen 10 % – del ut én", "Within 10% – hand out one") : T("Riktig – del ut én", "Right – hand out one"))
                : k2 == 0 ? T("Midt på treet – ingenting", "Somewhere in between – nothing")
                : mitt == nil ? T("Ingen svar – drikk én", "No answer – drink one")
                : erTall ? T("Lengst unna – drikk én", "Furthest off – drink one") : T("Feil – drikk én", "Wrong – drink one")
            let kilde = s["kilde"]?.tekst ?? ""
            let ekstra = [finale && k2 != 0 ? T("Finale: dobbelt opp.", "Final: it counts double.") : "",
                          godtas.isEmpty ? "" : T("Godtas også: ", "Also accepted: ") + godtas.joined(separator: ", ")].filter { !$0.isEmpty }
            resultat = NrResultat(klasse: (k2 ?? -1) > 0 ? "rett" : k2 == 0 ? "null" : "feil", tittel: tittel, info: (ekstra + [s["info"]?.tekst ?? ""]).filter { !$0.isEmpty }.joined(separator: " "),
                                  kilde: kilde.isEmpty ? "" : T("Les saken hos ", "Read it at ") + kilde, url: s["url"]?.tekst ?? "")
        }
        svar = NrSvar(fasitEtikett: T("Svaret", "The answer"), fasit: fasit, alt: alt, tallinje: linje, liste: liste, resultat: resultat,
                      neste: vert ? (i + 1 < antall ? T("Neste spørsmål", "Next question") : T("Se hvem som vant", "See who won")) : "",
                      vent: vert ? "" : navn(vertId) + T(" tar neste spørsmål.", " moves on to the next question."))
    }
}

@MainActor
@Observable
final class NrModell: HarFigurer {
    var d: NrData? = nil
    /// Talltastaturet: sifrene du har trykket (per spørsmål)
    var tall = ""
    @ObservationIgnored var tallNokkel = ""
    let blokker = KortModell()
    private let kobling = LekKobling("nyhetsrunden")
    @ObservationIgnored private(set) var avvik: Double = 0
    @ObservationIgnored private var avvikFra: Double = 0
    /// Det nettsiden sendte sist – reserven til rommet er hentet (eller hvis plassen ikke finnes)
    @ObservationIgnored private var sist: [String: Any] = [:]
    /// En av vertens knapper (start, vis, neste, ny runde) er på vei: ett trykk gir ett steg
    @ObservationIgnored private var sender = false
    @ObservationIgnored weak var nett: WKWebView? { didSet { blokker.nett = nett; kobling.nett = nett } }

    init() { kobling.endret = { [weak self] in self?.bygg() } }

    func sett(_ dict: [String: Any]) {
        sist = dict
        blokker.sett(["blokker": dict["slutt"] as? [[String: Any]] ?? [], "naa": dict["naa"] ?? 0])
        kobling.ta(dict) { d in
            // Eldre rom.js: figurene fra hodene i skjermdataene
            var ut: [(id: String, oi: Bool, png: String)] = []
            func ta(_ l: Any?) { for h in l as? [[String: Any]] ?? [] { ut.append((id: h["id"] as? String ?? "", oi: false, png: h["png"] as? String ?? "")) } }
            ta((d["klar"] as? [String: Any])?["hoder"]); ta((d["spm"] as? [String: Any])?["folk"])
            ta((d["ferdig"] as? [String: Any])?["pall"]); ta((d["ferdig"] as? [String: Any])?["rest"])
            return ut
        }
        bygg()
    }

    /// Leken er over på denne telefonen
    func slipp() { kobling.slipp(); d = nil; sist = [:]; sender = false; avvikFra = 0 }

    /// Rommet når det er hentet og viser Nyhetsrunden – ellers skjermen nettsiden sendte
    private func bygg() {
        let ny: NrData
        if let t = kobling.tilstand("nyhetsrunden") {
            if t.naa > 0 && t.naa != avvikFra { avvikFra = t.naa; avvik = t.naa - Date().timeIntervalSince1970 * 1000 }
            ny = NrData(rom: t, hoder: kobling.hoder)
        } else if !sist.isEmpty {
            ny = NrData(sist)
            if ny.naa > 0 { avvik = ny.naa - Date().timeIntervalSince1970 * 1000 }
        } else { return }
        let nokkel = "\(ny.fase):\(ny.i)"
        if nokkel != tallNokkel { tallNokkel = nokkel; tall = ny.spm?.tall?.mitt ?? "" }
        withAnimation(.spring(response: 0.45, dampingFraction: 0.8)) { d = ny }
    }

    /// Svaret (A–D eller tallet) – rett til rommet
    func svar(_ v: String) { send(["handling": "nr-svar", "v": v], ellers: "nr-svar", ["v": v], las: false) }
    /// Verten setter lengden (nr-lengde) eller starter en ny runde (nr-nytt) med så mange spørsmål
    func lengde(_ g: String, _ n: Int) {
        send(["handling": g == "nr-nytt" ? "nytt" : "nr-lengde", "antall": n], ellers: g, ["n": String(n)], las: g == "nr-nytt")
    }
    /// Verten snur et svar (riktig ↔ feil) for fritt svar
    func flipp(_ id: String) { send(["handling": "nr-flipp", "hvem": id], ellers: "nr-flipp", ["id": id], las: false) }
    /// Vertens knapper: nr-start, nr-vis, nr-neste
    func steg(_ g: String) { send(["handling": g], ellers: g, [:], las: true) }

    private func send(_ h: [String: Any], ellers g: String, _ attrs: [String: String], las: Bool) {
        if las { guard !sender else { return }; sender = true }
        Haptikk.trykk()
        Task {
            let ok = await kobling.gjor(h, ellers: g, attrs)
            if las { sender = false }
            if !ok { Haptikk.melding(.error) }
        }
    }
    func igjen(_ frist: Double) -> Int { max(0, Int(ceil((frist - 1500 - (Date().timeIntervalSince1970 * 1000 + avvik)) / 1000))) }
    func format(_ sifre: String) -> String {
        guard let n = Double(sifre) else { return sifre }
        let f = NumberFormatter(); f.numberStyle = .decimal; f.locale = Locale(identifier: d?.lokale ?? "nb-NO"); f.maximumFractionDigits = 0
        return f.string(from: NSNumber(value: n)) ?? sifre
    }
    func tast(_ k: String) {
        UIImpactFeedbackGenerator(style: .light).impactOccurred(intensity: 0.6)
        if k == "⌫" { tall = String(tall.dropLast()) }
        else if tall.count < 12 { tall = (tall == "0" ? "" : tall) + k }
        while tall.count > 1 && tall.hasPrefix("0") { tall.removeFirst() }
    }
    func trykk(_ g: String, _ attrs: [String: String] = [:]) {
        Haptikk.trykk()
        guard let data = try? JSONSerialization.data(withJSONObject: [g, attrs]), let json = String(data: data, encoding: .utf8) else { return }
        nett?.evaluateJavaScript("window.__mvLek && window.__mvLek.trykk.apply(null, \(json))", completionHandler: nil)
    }
    func skjema(_ id: String) {
        Haptikk.trykk()
        guard let data = try? JSONSerialization.data(withJSONObject: [id]), let json = String(data: data, encoding: .utf8) else { return }
        nett?.evaluateJavaScript("window.__mvLek && window.__mvLek.skjema(\(json)[0])", completionHandler: nil)
    }
}

struct NyhetsrundenSkjerm: View {
    var m: NrModell
    @Environment(\.accessibilityReduceMotion) private var roligere
    private let rust = Color(red: 0.722, green: 0.22, blue: 0.039)
    private let blaa = Color(red: 0.486, green: 0.776, blue: 0.996)

    var body: some View {
        ZStack {
            papir.ignoresSafeArea()
            if let d = m.d {
                VStack(spacing: 0) {
                    topp(d)
                    ScrollView(showsIndicators: false) {
                        VStack(alignment: .leading, spacing: 12) {
                            if let k = d.klar { klar(d, k) }
                            else if let f = d.ferdig { ferdig(d, f) }
                            else if let sp = d.spm { sporsmal(d); svarer(d, sp) }
                            else if let sv = d.svar { sporsmal(d, liten: true); avslort(d, sv) }
                        }
                        .padding(.horizontal, 16).padding(.top, 4).padding(.bottom, 24)
                    }
                }
            }
        }
        .foregroundColor(blekk)
    }

    // MARK: Avishodet – NYHETSRUNDEN, uke og spørsmål nr, klokka og Stua/Mer
    private func topp(_ d: NrData) -> some View {
        HStack(spacing: 8) {
            VStack(alignment: .leading, spacing: 0) {
                Text(d.tittel.uppercased()).font(.archivo(17, vekt: 900)).tracking(-0.3).lineLimit(1).minimumScaleFactor(0.7)
                Text(d.under).font(.archivo(12, vekt: 700)).opacity(0.65).lineLimit(1).minimumScaleFactor(0.7)
            }
            Spacer()
            if d.frist > 0 { Nedtelling { m.igjen(d.frist) } }
            liten(d.stua, "sofa.fill") { m.trykk("stua-ark") }
            liten(d.mer, "ellipsis") { m.trykk("mer-ark") }
        }
        .padding(.horizontal, 16).padding(.top, 6).padding(.bottom, 8)
        .overlay(Rectangle().fill(blekk).frame(height: 2).padding(.horizontal, 16), alignment: .bottom)
    }
    private func hode(_ png: String, _ px: CGFloat, flat: Bool = false) -> some View { Figur(png, px).opacity(flat ? 0.55 : 1) }
    private func storKnapp(_ t: String, farge: Color? = nil, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(t.uppercased()).font(.archivo(19, vekt: 900)).foregroundColor(morkBlekk).multilineTextAlignment(.center)
                .frame(maxWidth: .infinity).frame(minHeight: 62).padding(.horizontal, 10)
                .background(RoundedRectangle(cornerRadius: 14).fill(farge ?? gul)).overlay(RoundedRectangle(cornerRadius: 14).stroke(morkBlekk, lineWidth: 3))
                .background(RoundedRectangle(cornerRadius: 14).fill(morkBlekk).offset(x: 4, y: 4))
        }.buttonStyle(TastTrykk())
    }
    private func vent(_ t: String) -> some View {
        Text(t).font(.archivo(15, vekt: 600)).opacity(0.7).frame(maxWidth: .infinity).multilineTextAlignment(.center).padding(.top, 4)
    }
    private func lengder(_ l: [NrLengde]) -> some View {
        HStack(spacing: 8) {
            ForEach(l) { x in
                Button(action: { m.lengde(x.g, x.id) }) {
                    VStack(spacing: 0) {
                        Text("\(x.id)").font(.archivo(22, vekt: 900))
                        Text(x.tekst).font(.archivo(11, vekt: 700)).opacity(0.7)
                    }
                    .foregroundColor(x.valgt ? morkBlekk : blekk).frame(maxWidth: .infinity).frame(height: 58)
                    .background(RoundedRectangle(cornerRadius: 12).fill(x.valgt ? gul : kortFarge)).overlay(RoundedRectangle(cornerRadius: 12).stroke(blekk, lineWidth: x.valgt ? 3 : 2))
                }.buttonStyle(TastTrykk())
            }
        }
    }

    // MARK: Forsiden – uke, hodene og lengden (verten)
    private func klar(_ d: NrData, _ k: NrKlar) -> some View {
        VStack(alignment: .leading, spacing: 14) {
            VStack(alignment: .leading, spacing: 2) {
                Text(k.forside).font(.archivo(40, vekt: 900)).tracking(-1)
                Text(k.under).font(.archivo(22, vekt: 800)).opacity(0.8)
            }.padding(.top, 8)
            Hodestabel(antall: k.hoder.count, maks: 6, storrelse: 56) { i in hode(k.hoder[i].png, 56) }
            if !k.lengder.isEmpty { lengder(k.lengder) }
            if !k.start.isEmpty { storKnapp(k.start) { m.steg("nr-start") } }
            if !k.vent.isEmpty { vent(k.vent) }
        }
    }

    // MARK: Spørsmålet – type-merke, «Les det høyt» til verten, og teksten
    private func sporsmal(_ d: NrData, liten: Bool = false) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(spacing: 6) {
                Text(d.sporsmalType.uppercased()).font(.archivo(11, vekt: 900)).foregroundColor(morkBlekk).padding(.horizontal, 8).frame(height: 22).background(Capsule().fill(blaa)).overlay(Capsule().stroke(morkBlekk, lineWidth: 1.5))
                if !d.les.isEmpty { Text(d.les).font(.archivo(11, vekt: 900)).foregroundColor(morkBlekk).padding(.horizontal, 8).frame(height: 22).background(Capsule().fill(gul)).overlay(Capsule().stroke(morkBlekk, lineWidth: 1.5)) }
                Spacer()
            }
            Text(d.q).font(.archivo(liten ? 17 : 23, vekt: 900)).fixedSize(horizontal: false, vertical: true).lineSpacing(1)
        }
        .padding(14).frame(maxWidth: .infinity, alignment: .leading)
        .background(RoundedRectangle(cornerRadius: 16).fill(kortFarge)).overlay(RoundedRectangle(cornerRadius: 16).stroke(blekk, lineWidth: 2.5))
        .background(RoundedRectangle(cornerRadius: 16).fill(blekk).offset(x: 4, y: 4))
        .id("spm-\(d.i)-\(liten)")
        .transition(.move(edge: .trailing).combined(with: .opacity))
    }

    // MARK: Svare – A–D-klistremerker, talltastaturet eller skrivedialogen; benken med hvem som har svart
    private func svarer(_ d: NrData, _ sp: NrSpm) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            if !sp.alt.isEmpty {
                alternativer(sp.alt, apne: true)
            } else if let t = sp.tall {
                tallTastatur(t)
            } else if let f = sp.fritt {
                storKnapp(f.knapp, farge: kortFarge) { m.skjema(f.skjemaId) }
                if !f.svart.isEmpty { Text(f.svart).font(.archivo(14, vekt: 700)).opacity(0.8) }
            }
            if !sp.vis.isEmpty { storKnapp(sp.vis) { m.steg("nr-vis") } }
            else if !sp.vent.isEmpty { vent(sp.vent) }
            benk(sp.folk, sp.status)
        }
    }
    private func alternativer(_ alt: [NrAlt], apne: Bool) -> some View {
        VStack(spacing: 8) {
            ForEach(alt) { a in
                let farge: Color = apne ? (a.valgt ? gul : kortFarge) : a.rett ? mint : a.feil ? rosa : kortFarge
                Button(action: { if apne { m.svar(a.tekst) } }) {
                    HStack(alignment: .center, spacing: 10) {
                        Text(a.bokstav).font(.archivo(15, vekt: 900)).foregroundColor(lys).frame(width: 30, height: 30).background(Circle().fill(morkBlekk))
                        Text(a.tekst).font(.archivo(16, vekt: 800)).foregroundColor(apne && !a.valgt ? blekk : morkBlekk).multilineTextAlignment(.leading).fixedSize(horizontal: false, vertical: true)
                        Spacer(minLength: 4)
                        if !apne && !a.hoder.isEmpty {
                            Hodestabel(antall: a.hoder.count, maks: 4, storrelse: 32, avstand: -8) { i in hode(a.hoder[i].png, 32, flat: !a.rett) }
                                .transition(.scale(scale: 0.6).combined(with: .opacity))
                        }
                        if !a.stempel.isEmpty {
                            Text(a.stempel.uppercased()).font(.archivo(11, vekt: 900)).foregroundColor(lys).padding(.horizontal, 7).frame(height: 22)
                                .background(RoundedRectangle(cornerRadius: 5).fill(a.rett ? morkBlekk : rust)).rotationEffect(.degrees(-6))
                        }
                    }
                    .padding(.horizontal, 12).padding(.vertical, 10).frame(maxWidth: .infinity, alignment: .leading)
                    .background(RoundedRectangle(cornerRadius: 12).fill(farge)).overlay(RoundedRectangle(cornerRadius: 12).stroke(morkBlekk.opacity(!apne && !a.rett && !a.feil ? 0.35 : 1), lineWidth: 2.5))
                    .background(RoundedRectangle(cornerRadius: 12).fill(apne ? blekk : Color.clear).offset(x: 3, y: 3))
                    .opacity(!apne && !a.rett && !a.feil ? 0.75 : 1)
                }
                .buttonStyle(TastTrykk()).disabled(!apne)
            }
        }
    }
    private func tallTastatur(_ t: NrTall) -> some View {
        let kol = [GridItem(.flexible(), spacing: 8), GridItem(.flexible(), spacing: 8), GridItem(.flexible(), spacing: 8)]
        let vist = m.format(m.tall.isEmpty ? "0" : m.tall)
        let last = !t.mitt.isEmpty && t.mitt == m.tall
        return VStack(alignment: .leading, spacing: 8) {
            Text(t.etikett).font(.archivo(12, vekt: 800)).opacity(0.65)
            Text(vist).font(.archivo(40, vekt: 900)).lineLimit(1).minimumScaleFactor(0.5).frame(maxWidth: .infinity, alignment: .trailing)
                .padding(.horizontal, 14).frame(height: 68)
                .background(RoundedRectangle(cornerRadius: 12).fill(kortFarge)).overlay(RoundedRectangle(cornerRadius: 12).stroke(blekk, lineWidth: 2.5))
            LazyVGrid(columns: kol, spacing: 8) {
                ForEach(t.taster, id: \.self) { k in
                    let graa = k == "⌫" || k == "000"
                    Button(action: { m.tast(k) }) {
                        Text(k).font(.archivo(k == "000" ? 17 : 22, vekt: 900)).foregroundColor(graa ? blekk : morkBlekk)
                            .frame(maxWidth: .infinity).frame(height: 52)
                            .background(RoundedRectangle(cornerRadius: 10).fill(graa ? papir : kortFarge)).overlay(RoundedRectangle(cornerRadius: 10).stroke(blekk, lineWidth: 2))
                            .background(RoundedRectangle(cornerRadius: 10).fill(blekk).offset(x: 3, y: 3))
                    }.buttonStyle(TastTrykk())
                }
            }
            storKnapp((last ? t.last : t.mitt.isEmpty ? t.las : t.bytt) + vist, farge: last ? mint : gul) { if !m.tall.isEmpty && !last { m.svar(m.tall) } }
        }
    }
    private func benk(_ folk: [NrHode], _ status: String) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(status).font(.archivo(12, vekt: 800)).opacity(0.65)
            // Rutenett som bryter linje – én rekke vokste ut av skjermen med store gjenger (Rekker.swift)
            LazyVGrid(columns: benkKolonner(58), alignment: .leading, spacing: 10) {
                ForEach(folk) { h in
                    VStack(spacing: 2) {
                        hode(h.png, 44).offset(y: h.oppe ? -6 : 0).opacity(h.oppe ? 1 : 0.5)
                            .animation(roligere ? nil : .spring(response: 0.4, dampingFraction: 0.65), value: h.oppe)
                        Text(h.navn).font(.archivo(10, vekt: h.oppe ? 900 : 600)).lineLimit(1).minimumScaleFactor(0.8)
                    }.frame(width: 58)
                }
            }.padding(.top, 6)
        }.padding(.top, 4)
    }

    // MARK: Svaret er vist – fasit, hoder på svarene, tallinja, lista og resultatet ditt
    private func avslort(_ d: NrData, _ sv: NrSvar) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            if !sv.alt.isEmpty { alternativer(sv.alt, apne: false) }
            else {
                HStack(alignment: .firstTextBaseline, spacing: 10) {
                    Text(sv.fasitEtikett).font(.archivo(12, vekt: 800)).foregroundColor(morkBlekk).opacity(0.7)
                    Text(sv.fasit).font(.archivo(26, vekt: 900)).foregroundColor(morkBlekk).fixedSize(horizontal: false, vertical: true)
                }
                .padding(14).frame(maxWidth: .infinity, alignment: .leading)
                .background(RoundedRectangle(cornerRadius: 14).fill(mint)).overlay(RoundedRectangle(cornerRadius: 14).stroke(morkBlekk, lineWidth: 3))
                .background(RoundedRectangle(cornerRadius: 14).fill(morkBlekk).offset(x: 4, y: 4))
                if let l = sv.tallinje { tallinje(l) }
            }
            if let r = sv.resultat { resultat(r) }
            if !sv.liste.isEmpty { liste(sv.liste) }
            if !sv.neste.isEmpty { storKnapp(sv.neste) { m.steg("nr-neste") } }
            else if !sv.vent.isEmpty { vent(sv.vent) }
        }
    }
    private func tallinje(_ l: NrTallinje) -> some View {
        let hoyde: CGFloat = 96 + CGFloat(max(0, l.rader - 1)) * 46 + 56
        return GeometryReader { g in
            let w = g.size.width
            ZStack(alignment: .topLeading) {
                Rectangle().fill(blekk).frame(height: 2).offset(y: hoyde - 56)
                ForEach(l.pinner) { p in
                    VStack(spacing: 0) {
                        hode(p.png, 40, flat: p.flat).overlay(Circle().stroke(p.beste ? gul : Color.clear, lineWidth: 3).frame(width: 44, height: 44))
                        Text(p.tekst).font(.archivo(11, vekt: 900)).lineLimit(1).padding(.horizontal, 5).frame(height: 18).background(Capsule().fill(kortFarge)).overlay(Capsule().stroke(blekk, lineWidth: 1.5))
                        Rectangle().fill(blekk).frame(width: 2, height: 14 + CGFloat(p.rad) * 46)
                    }
                    .position(x: w * CGFloat(p.x) / 100, y: hoyde - 56 - (14 + CGFloat(p.rad) * 46) / 2 - 29)
                }
                VStack(spacing: 0) {
                    Rectangle().fill(oransje).frame(width: 3, height: 14)
                    Text(l.fasitTekst).font(.archivo(13, vekt: 900)).foregroundColor(morkBlekk).padding(.horizontal, 8).frame(height: 28).background(RoundedRectangle(cornerRadius: 6).fill(oransje)).overlay(RoundedRectangle(cornerRadius: 6).stroke(morkBlekk, lineWidth: 2))
                }
                .position(x: min(max(w * CGFloat(l.fasitX) / 100, 36), w - 36), y: hoyde - 56 + 22)
            }
        }
        .frame(height: hoyde)
    }
    private func resultat(_ r: NrResultat) -> some View {
        let farge: Color = r.klasse == "rett" ? mint : r.klasse == "null" ? kortFarge : rosa
        return VStack(alignment: .leading, spacing: 4) {
            Text(r.tittel).font(.archivo(17, vekt: 900)).foregroundColor(r.klasse == "null" ? blekk : morkBlekk)
            if !r.info.isEmpty {
                Text(r.info).font(.archivo(13, vekt: 600)).foregroundColor(r.klasse == "null" ? blekk : morkBlekk).opacity(0.85).fixedSize(horizontal: false, vertical: true)
            }
            if !r.kilde.isEmpty, let u = URL(string: r.url) {
                Button(action: { UIApplication.shared.open(u) }) {
                    HStack(spacing: 4) { Text(r.kilde).font(.archivo(13, vekt: 800)).underline(); Image(systemName: "arrow.up.right").font(.system(size: 11, weight: .bold)) }
                        .foregroundColor(r.klasse == "null" ? blekk : morkBlekk)
                }.buttonStyle(.plain)
            }
        }
        .padding(12).frame(maxWidth: .infinity, alignment: .leading)
        .background(RoundedRectangle(cornerRadius: 12).fill(farge)).overlay(RoundedRectangle(cornerRadius: 12).stroke(blekk, lineWidth: 2.5))
        .transition(.scale(scale: 0.96).combined(with: .opacity))
    }
    private func liste(_ l: [NrRad]) -> some View {
        VStack(spacing: 6) {
            ForEach(l) { r in
                HStack(spacing: 10) {
                    hode(r.png, 36, flat: r.klasse == "feil")
                    VStack(alignment: .leading, spacing: 0) {
                        Text(r.navn).font(.archivo(14, vekt: 900))
                        (r.tomt ? Text(r.hva).font(.archivo(13, vekt: 400)).italic() : Text(r.hva).font(.archivo(13, vekt: 700))).opacity(r.tomt ? 0.6 : 0.85).lineLimit(2)
                    }
                    Spacer()
                    let farge: Color = r.klasse == "rett" ? mint : r.klasse == "null" ? kortFarge : rosa
                    if r.kanFlippe {
                        Button(action: { m.flipp(r.id) }) {
                            Text(r.merke).font(.archivo(12, vekt: 900)).foregroundColor(r.klasse == "null" ? blekk : morkBlekk).padding(.horizontal, 10).frame(height: 30)
                                .background(Capsule().fill(farge)).overlay(Capsule().stroke(blekk, lineWidth: 2))
                        }.buttonStyle(TastTrykk())
                    } else {
                        Text(r.merke).font(.archivo(12, vekt: 900)).foregroundColor(r.klasse == "null" ? blekk : morkBlekk).padding(.horizontal, 10).frame(height: 30)
                            .background(Capsule().fill(farge)).overlay(Capsule().stroke(blekk, lineWidth: 2))
                    }
                }
                .padding(.horizontal, 10).padding(.vertical, 7)
                .background(RoundedRectangle(cornerRadius: 12).fill(kortFarge)).overlay(RoundedRectangle(cornerRadius: 12).stroke(blekk.opacity(0.5), lineWidth: 1.5))
            }
        }
    }

    // MARK: Ferdig – vinneren, pallen med krone, kåringene, resten og ny runde (verten)
    private func ferdig(_ d: NrData, _ f: NrFerdig) -> some View {
        VStack(alignment: .leading, spacing: 14) {
            Text(f.tittel).font(.archivo(26, vekt: 900)).tracking(-0.5).fixedSize(horizontal: false, vertical: true).padding(.top, 6)
            pall(f.pall)
            if !f.kaaringer.isEmpty {
                VStack(alignment: .leading, spacing: 6) {
                    ForEach(f.kaaringer) { k in
                        (Text(k.tittel + " ").font(.archivo(13, vekt: 900)) + Text(k.tekst).font(.archivo(13, vekt: 600)))
                            .fixedSize(horizontal: false, vertical: true)
                            .padding(.horizontal, 12).padding(.vertical, 8).frame(maxWidth: .infinity, alignment: .leading)
                            .background(RoundedRectangle(cornerRadius: 10).fill(kortFarge)).overlay(RoundedRectangle(cornerRadius: 10).stroke(blekk, lineWidth: 1.5))
                    }
                }
            }
            if !f.rest.isEmpty {
                VStack(spacing: 4) {
                    ForEach(f.rest) { x in
                        HStack(spacing: 10) {
                            Text("\(x.plass)").font(.archivo(13, vekt: 900)).opacity(0.6).frame(width: 18)
                            hode(x.png, 30)
                            Text(x.navn).font(.archivo(14, vekt: 800))
                            Spacer()
                            Text("\(x.n)").font(.archivo(16, vekt: 900))
                        }.padding(.horizontal, 10).padding(.vertical, 5)
                    }
                }
            }
            if !f.nyEtikett.isEmpty {
                Text(f.nyEtikett).font(.archivo(12, vekt: 800)).opacity(0.65).padding(.top, 6)
                lengder(f.lengder)
                Text(f.smaa).font(.archivo(12, vekt: 600)).opacity(0.65)
            }
            BlokkListe(m: m.blokker)
        }
    }
    private func pall(_ p: [NrPall]) -> some View {
        let rekke = [p.first { $0.plass == 2 }, p.first { $0.plass == 1 }, p.first { $0.plass == 3 }]
        let hoyder: [CGFloat] = [62, 96, 44]
        return HStack(alignment: .bottom, spacing: 8) {
            ForEach(0..<3, id: \.self) { i in
                if let x = rekke[i] {
                    VStack(spacing: 4) {
                        if x.plass == 1 { Image(systemName: "crown.fill").font(.system(size: 20, weight: .black)).foregroundColor(gul).shadow(color: morkBlekk, radius: 0, x: 1.5, y: 1.5) }
                        hode(x.png, x.plass == 1 ? 72 : 56)
                        Text(x.navn).font(.archivo(13, vekt: 900)).lineLimit(1)
                        Text("\(x.n)").font(.archivo(20, vekt: 900)).foregroundColor(morkBlekk).frame(maxWidth: .infinity).frame(height: hoyder[i])
                            .background(RoundedRectangle(cornerRadius: 8).fill(x.plass == 1 ? gul : x.plass == 2 ? mint : rosa)).overlay(RoundedRectangle(cornerRadius: 8).stroke(morkBlekk, lineWidth: 2.5))
                    }.frame(maxWidth: .infinity)
                } else { Color.clear.frame(maxWidth: .infinity, maxHeight: 1) }
            }
        }
        .transition(.move(edge: .bottom).combined(with: .opacity))
    }
}
