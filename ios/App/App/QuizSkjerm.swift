import SwiftUI
import UIKit
import WebKit

/// Kategorikongen som native skjerm: fasen (klar / trekk / spm / svar / ferdig), kategorikortene i hånda, spørsmålet med
/// A–D, satsingen, svaret med hodene på alternativene, kongene og sluttskjermen.
/// Fase 3: skjermen leser rommet selv (LekKobling/RomKlient) og sender trekk, svar, satsing og vertens knapper rett til
/// rommet. Nettsiden gir plassen i rommet, figurene og «Hva nå?»-knappene til slutt. Med eldre rom.js brukes quizData som reserve.
struct QzHode: Identifiable { let id: String; let navn: String; let png: String; let oppe: Bool }
struct QzLengde: Identifiable { let id: Int; let tekst: String; let valgt: Bool }
struct QzKortet: Identifiable { let id: String; let navn: String; let droy: Bool }
struct QzAlt: Identifiable { let id: Int; let bokstav: String; let tekst: String; let valgt: Bool; let rett: Bool; let feil: Bool; let hoder: [QzHode]; let stempel: String }
struct QzKonge: Identifiable { let id: String; let navn: String; let kat: String; let n: Int }
struct QzPall: Identifiable { let id: String; let navn: String; let png: String; let n: Int; let plass: Int }
struct QzKaaring: Identifiable { let id: Int; let tittel: String; let tekst: String }
struct QzSatsing: Identifiable { let id: String; let png: String; let treff: Bool; let tekst: String; let under: String }
struct QzKat { let navn: String, droy: Bool, droyTekst: String, konge: String }
struct QzKlar { let forside: String, hoder: [QzHode], lengder: [QzLengde], start: String, vent: String }
struct QzTrekk { let min: Bool, chip: String, tekst: String, hand: [QzKortet], droyTag: String, forAndre: String }
struct QzSats { let etikett: String, valgt: String, hjelp: String, folk: [QzHode] }
struct QzSpm { let chip: String, mitt: String, alt: [QzAlt], sats: QzSats, vis: String, folk: [QzHode], status: String }
struct QzMitt { let rett: Bool, over: String, tittel: String, under: String }
struct QzSvar { let chip: String, info: String, alt: [QzAlt], mitt: QzMitt?, nyKonge: String, satsinger: [QzSatsing], neste: String }
struct QzFerdig { let tittel: String, pall: [QzPall], kaaringer: [QzKaaring], rest: [QzPall] }

struct QzData {
    var fase = "", i = 0, lengde = 0, vert = false, naa: Double = 0, frist: Double = 0, tittel = "Kategorikongen", under = "", q = ""
    var kat: QzKat? = nil, klar: QzKlar? = nil, trekk: QzTrekk? = nil, spm: QzSpm? = nil, svar: QzSvar? = nil, ferdig: QzFerdig? = nil
    var konger: [QzKonge] = [], kongerEtikett = "", stua = "Stua", mer = "Mer"

    static func hode(_ h: [String: Any]) -> QzHode { QzHode(id: h["id"] as? String ?? "", navn: h["navn"] as? String ?? "", png: h["png"] as? String ?? "", oppe: h["oppe"] as? Bool ?? false) }
    static func hoder(_ l: Any?) -> [QzHode] { (l as? [[String: Any]] ?? []).map { hode($0) } }
    static func alt(_ l: Any?) -> [QzAlt] {
        (l as? [[String: Any]] ?? []).enumerated().map { i, a in QzAlt(id: i, bokstav: a["bokstav"] as? String ?? "", tekst: a["tekst"] as? String ?? "", valgt: a["valgt"] as? Bool ?? false, rett: a["rett"] as? Bool ?? false, feil: a["feil"] as? Bool ?? false, hoder: hoder(a["hoder"]), stempel: a["stempel"] as? String ?? "") }
    }
    static func pall(_ l: Any?) -> [QzPall] { (l as? [[String: Any]] ?? []).map { p in QzPall(id: p["id"] as? String ?? "", navn: p["navn"] as? String ?? "", png: p["png"] as? String ?? "", n: (p["n"] as? NSNumber)?.intValue ?? 0, plass: (p["plass"] as? NSNumber)?.intValue ?? 0) } }
    /// Reserven: skjermen slik eldre rom.js lager den (quizData)
    init(_ d: [String: Any]) {
        func s(_ k: String) -> String { d[k] as? String ?? "" }
        func n(_ k: String) -> Double { (d[k] as? NSNumber)?.doubleValue ?? 0 }
        fase = s("fase"); i = Int(n("i")); lengde = Int(n("lengde")); vert = d["vert"] as? Bool ?? false; naa = n("naa"); frist = n("frist")
        tittel = s("tittel").isEmpty ? "Kategorikongen" : s("tittel"); under = s("under"); q = s("q")
        if let k = d["kat"] as? [String: Any] { kat = QzKat(navn: k["navn"] as? String ?? "", droy: k["droy"] as? Bool ?? false, droyTekst: k["droyTekst"] as? String ?? "", konge: k["konge"] as? String ?? "") } else { kat = nil }
        if let k = d["klar"] as? [String: Any] {
            klar = QzKlar(forside: k["forside"] as? String ?? "", hoder: QzData.hoder(k["hoder"]),
                          lengder: (k["lengder"] as? [[String: Any]] ?? []).map { x in QzLengde(id: (x["n"] as? NSNumber)?.intValue ?? 0, tekst: x["tekst"] as? String ?? "", valgt: x["valgt"] as? Bool ?? false) },
                          start: k["start"] as? String ?? "", vent: k["vent"] as? String ?? "")
        } else { klar = nil }
        if let t = d["trekk"] as? [String: Any] {
            trekk = QzTrekk(min: t["min"] as? Bool ?? false, chip: t["chip"] as? String ?? "", tekst: t["tekst"] as? String ?? "",
                            hand: (t["hand"] as? [[String: Any]] ?? []).map { k in QzKortet(id: k["id"] as? String ?? "", navn: k["navn"] as? String ?? "", droy: k["droy"] as? Bool ?? false) },
                            droyTag: t["droyTag"] as? String ?? "", forAndre: t["forAndre"] as? String ?? "")
        } else { trekk = nil }
        if let x = d["spm"] as? [String: Any] {
            let sa = x["sats"] as? [String: Any] ?? [:]
            spm = QzSpm(chip: x["chip"] as? String ?? "", mitt: x["mitt"] as? String ?? "", alt: QzData.alt(x["alt"]),
                        sats: QzSats(etikett: sa["etikett"] as? String ?? "", valgt: sa["valgt"] as? String ?? "", hjelp: sa["hjelp"] as? String ?? "", folk: QzData.hoder(sa["folk"])),
                        vis: x["vis"] as? String ?? "", folk: QzData.hoder(x["folk"]), status: x["status"] as? String ?? "")
        } else { spm = nil }
        if let x = d["svar"] as? [String: Any] {
            var mitt: QzMitt? = nil
            if let m = x["mitt"] as? [String: Any] { mitt = QzMitt(rett: m["rett"] as? Bool ?? false, over: m["over"] as? String ?? "", tittel: m["tittel"] as? String ?? "", under: m["under"] as? String ?? "") }
            svar = QzSvar(chip: x["chip"] as? String ?? "", info: x["info"] as? String ?? "", alt: QzData.alt(x["alt"]), mitt: mitt, nyKonge: x["nyKonge"] as? String ?? "",
                          satsinger: (x["satsinger"] as? [[String: Any]] ?? []).map { r in QzSatsing(id: r["id"] as? String ?? "", png: r["png"] as? String ?? "", treff: r["treff"] as? Bool ?? false, tekst: r["tekst"] as? String ?? "", under: r["under"] as? String ?? "") },
                          neste: x["neste"] as? String ?? "")
        } else { svar = nil }
        if let f = d["ferdig"] as? [String: Any] {
            ferdig = QzFerdig(tittel: f["tittel"] as? String ?? "", pall: QzData.pall(f["pall"]),
                              kaaringer: (f["kaaringer"] as? [[String: Any]] ?? []).enumerated().map { i, k in QzKaaring(id: i, tittel: k["tittel"] as? String ?? "", tekst: k["tekst"] as? String ?? "") },
                              rest: QzData.pall(f["rest"]))
        } else { ferdig = nil }
        konger = (d["konger"] as? [[String: Any]] ?? []).map { k in QzKonge(id: (k["id"] as? String ?? "") + "|" + (k["kat"] as? String ?? ""), navn: k["navn"] as? String ?? "", kat: k["kat"] as? String ?? "", n: (k["n"] as? NSNumber)?.intValue ?? 0) }
        kongerEtikett = s("kongerEtikett")
        if !s("stua").isEmpty { stua = s("stua") }
        if !s("mer").isEmpty { mer = s("mer") }
    }

    /// Skjermen bygd rett fra rommet: `spill` er serverens visning av Kategorikongen (quizVisning i rom.ts)
    init(rom t: RomTilstand, hoder: [String: [String: String]]) {
        let s = t.spill ?? .null
        let en = t.lang == "en"
        func T(_ no: String, _ eng: String) -> String { en ? eng : no }
        let meg = t.meg ?? ""
        let alle = t.spillere.map(\.id)
        func navn(_ id: String?) -> String { id.flatMap { t.spiller($0)?.navn } ?? "?" }
        func tall(_ v: JSONVerdi?) -> Int { Int(v?.tall ?? 0) }
        func tekster(_ v: JSONVerdi?) -> [String] { (v?.liste ?? []).compactMap(\.tekst) }
        func fjes(_ id: String, _ uttrykk: String = "", oppe: Bool = false) -> QzHode {
            QzHode(id: id, navn: id == meg ? T("Du", "You") : navn(id), png: figurPng(hoder, id, uttrykk: uttrykk), oppe: oppe)
        }
        func navnKort(_ id: String) -> String { id == meg ? T("deg", "you") : navn(id) }

        let f = s["fase"]?.tekst ?? ""
        fase = f
        i = tall(s["i"]); lengde = tall(s["lengde"]); vert = t.jegErVert; naa = t.naa
        under = f == "klar" || f == "ferdig" ? "\(lengde)" + T(" spørsmål", " questions") : T("Spørsmål ", "Question ") + "\(i + 1)" + T(" av ", " of ") + "\(lengde)"
        konger = (s["konger"]?.liste ?? []).map { k in
            let id = k["id"]?.tekst ?? "", kn = k["navn"]?.tekst ?? ""
            return QzKonge(id: id + "|" + kn, navn: navn(id), kat: kn, n: tall(k["n"]))
        }
        kongerEtikett = T("Kongene i kveld", "Tonight’s kings")
        stua = T("Stua", "Lounge"); mer = T("Mer", "More")
        let katV = s["kat"].flatMap { $0 == .null ? nil : $0 }
        let katKonge = katV?["konge"]?.tekst, katDroy = katV?["droy"]?.bool ?? false, katNavn = katV?["navn"]?.tekst ?? ""
        if katV != nil { kat = QzKat(navn: katNavn, droy: katDroy, droyTekst: T("Drøy · feil = 2", "Spicy · wrong = 2"), konge: katKonge.map { navn($0) } ?? "") }

        if f == "klar" {
            let naaLengde = lengde
            klar = QzKlar(forside: T("Trekk kategori.\nSvar. Sats.\nBli konge.", "Draw a category.\nAnswer. Bet.\nBecome king."), hoder: alle.map { fjes($0) },
                          lengder: vert ? [6, 10, 15].map { n in QzLengde(id: n, tekst: n <= 6 ? T("Kort", "Short") : n <= 10 ? T("Vanlig", "Usual") : T("Lang", "Long"), valgt: naaLengde == n) } : [],
                          start: vert ? T("Første kategori", "First category") : "",
                          vent: vert ? "" : T("Venter på at ", "Waiting for ") + navn(s["vert"]?.tekst) + T(" starter …", " to start …"))
            return
        }
        if f == "ferdig" {
            let l = (s["tavle"]?.liste ?? []).map { x in (id: x["id"]?.tekst ?? "", navn: x["navn"]?.tekst ?? "", riktige: tall(x["riktige"])) }
            let k = s["kaaringer"]
            let delt = l.filter { x in l.first.map { x.riktige == $0.riktige } ?? false }
            var kaar: [QzKaaring] = []
            func legg(_ tittel: String, _ tekst: String) { kaar.append(QzKaaring(id: kaar.count, tittel: tittel, tekst: tekst)) }
            if let x = k?["sats"], let id = x["id"]?.tekst { legg(T("Gambleren:", "The gambler:"), navn(id) + T(" traff ", " hit ") + "\(tall(x["n"]))" + T(" satsinger", " bets")) }
            if let x = k?["bom"], let id = x["id"]?.tekst { legg(T("Feilsatser:", "Bad bettor:"), navn(id) + T(" bommet på ", " missed ") + "\(tall(x["n"]))" + T(" satsinger", " bets")) }
            if let x = k?["droy"], let id = x["id"]?.tekst { legg(T("Drøyest:", "Spiciest:"), navn(id) + T(" tok ", " got ") + "\(tall(x["n"]))" + T(" drøye riktige", " spicy ones right")) }
            let tittel: String
            if l.first == nil || l[0].riktige == 0 { tittel = T("Ingen fikk noe riktig", "Nobody got anything right") }
            else if delt.count > 1 { tittel = T("Delt seier: ", "Shared win: ") + delt.map(\.navn).joined(separator: T(" og ", " and ")) }
            else { tittel = T("Kveldens quizmester: ", "Quiz master of the night: ") + l[0].navn }
            func plass(_ x: (id: String, navn: String, riktige: Int), _ plass: Int) -> QzPall { QzPall(id: x.id, navn: x.navn, png: figurPng(hoder, x.id), n: x.riktige, plass: plass) }
            ferdig = QzFerdig(tittel: tittel, pall: l.prefix(3).enumerated().map { j, x in plass(x, j + 1) }, kaaringer: kaar,
                              rest: l.dropFirst(3).enumerated().map { j, x in plass(x, j + 4) })
            return
        }
        if f == "trekk" {
            let trekker = s["trekker"]?.tekst
            let minTur = trekker == meg
            frist = s["frist"]?.tall ?? 0
            trekk = QzTrekk(min: minTur, chip: minTur ? T("Din tur – trekk!", "Your turn – draw!") : navn(trekker) + T(" trekker", " draws"),
                            tekst: minTur ? T("Velg et kort. Ett av dem er drøyt.", "Pick a card. One of them is spicy.") : navn(trekker) + T(" velger kategori …", " is picking a category …"),
                            hand: (s["hand"]?.liste ?? []).map { k in QzKortet(id: k["id"]?.tekst ?? "", navn: k["navn"]?.tekst ?? "", droy: k["droy"]?.bool ?? false) },
                            droyTag: T("Drøy", "Spicy"), forAndre: vert && !minTur ? T("Trekk for ", "Draw for ") + navn(trekker) : "")
            return
        }
        let har = tekster(s["harSvart"]), alts = tekster(s["alt"]), mitt = s["mittSvar"]?.tekst
        q = s["q"]?.tekst ?? ""
        let bokstaver = Array("ABCD")
        func bokstav(_ i: Int) -> String { i < bokstaver.count ? String(bokstaver[i]) : "" }
        if f == "spm" {
            frist = s["frist"]?.tall ?? 0
            let mangler = alle.count - har.count
            spm = QzSpm(chip: mitt != nil ? T("Svart", "Answered") : T("Svar!", "Answer!"), mitt: mitt ?? "",
                        alt: alts.enumerated().map { i, a in QzAlt(id: i, bokstav: bokstav(i), tekst: a, valgt: mitt == a, rett: false, feil: false, hoder: [], stempel: "") },
                        sats: QzSats(etikett: T("Sats 2 slurker på at én bommer", "Bet 2 sips that someone misses"), valgt: s["minSats"]?.tekst ?? "",
                                     hjelp: T("Treff: hen drikker 2. Bom: du drikker 2.", "Hit: they drink 2. Miss: you drink 2."), folk: alle.filter { $0 != meg }.map { fjes($0) }),
                        vis: vert ? (mangler > 0 ? T("Vis svaret nå", "Show the answer now") + " (\(mangler)" + T(" mangler", " missing") + ")" : T("Vis svaret", "Show the answer")) : "",
                        folk: alle.map { fjes($0, oppe: har.contains($0)) }, status: "\(har.count)" + T(" av ", " of ") + "\(alle.count)" + T(" har svart", " answered"))
            return
        }
        // Svaret er vist
        let res = (s["resultat"]?.objekt ?? [:]).compactMapValues(\.tall)
        let sv = (s["svarene"]?.objekt ?? [:]).compactMapValues(\.tekst)
        let sats = (s["sats"]?.objekt ?? [:]).compactMapValues(\.tekst)
        let satsRes = (s["satsRes"]?.objekt ?? [:]).compactMapValues(\.tekst)
        let fasit = s["fasit"]?.tekst
        let k2 = res[meg].map { Int($0) }
        var mittRes: QzMitt? = nil
        if alle.contains(meg) {
            let rett = (k2 ?? 0) > 0
            var underTekst = ""
            if let k = k2, k < -1, let konge = katKonge, konge != meg { underTekst = (katDroy ? T("Drøy kategori", "Spicy category") + " · " : "") + T("én for kongen ", "one for the king ") + navn(konge) }
            else if katDroy, let k = k2, k < 0 { underTekst = T("Drøy kategori: dobbelt", "Spicy category: double") }
            mittRes = QzMitt(rett: rett, over: rett ? T("Riktig", "Right") : sv[meg] != nil ? T("Feil", "Wrong") : T("Ikke svart", "No answer"),
                             tittel: rett ? T("Du deler ut 1", "You hand out 1") : T("Du drikker ", "You drink ") + "\(abs(k2 == 0 ? 1 : (k2 ?? 1)))", under: underTekst)
        }
        let nyKonge = s["nyKonge"]?.tekst
        svar = QzSvar(chip: T("Svaret", "The answer"), info: s["info"]?.tekst ?? "",
                      alt: alts.enumerated().map { i, a in
                          let rett = a == fasit, minn = mitt == a
                          return QzAlt(id: i, bokstav: bokstav(i), tekst: a, valgt: false, rett: rett, feil: !rett && minn,
                                       hoder: alle.filter { sv[$0] == a }.map { fjes($0, rett ? "" : "flat") }, stempel: rett ? T("Riktig", "Right") : minn ? T("Feil", "Wrong") : "")
                      },
                      mitt: mittRes,
                      nyKonge: nyKonge.map { "👑 " + navn($0) + T(" er ny konge av ", " is the new king of ") + katNavn } ?? "",
                      // Satsingene i rekkefølgen rundt bordet
                      satsinger: alle.filter { satsRes[$0] != nil && sats[$0] != nil }.map { fra in
                          let treff = satsRes[fra] == "treff", paa = sats[fra] ?? ""
                          return QzSatsing(id: fra, png: figurPng(hoder, fra), treff: treff, tekst: navn(fra) + T(" satset på ", " bet on ") + navnKort(paa),
                                           under: treff ? T("Treff – ", "Hit – ") + navnKort(paa) + T(" drikker 2", " drinks 2") : T("Bom – drikker 2 selv", "Miss – drinks 2"))
                      },
                      neste: i + 1 < lengde ? T("Neste kategori", "Next category") : T("Se hvem som vant", "See who won"))
    }
}

@MainActor
@Observable
final class QzModell: HarFigurer {
    var d: QzData? = nil
    let blokker = KortModell()
    private let kobling = LekKobling("quiz")
    @ObservationIgnored private(set) var avvik: Double = 0
    @ObservationIgnored private var avvikFra: Double = 0
    /// Det nettsiden sendte sist – reserven til rommet er hentet (eller hvis plassen ikke finnes)
    @ObservationIgnored private var sist: [String: Any] = [:]
    /// En av vertens knapper (start, vis, neste, trekk) er på vei: ett trykk gir ett steg
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

    /// Rommet når det er hentet og viser Kategorikongen – ellers skjermen nettsiden sendte
    private func bygg() {
        let ny: QzData
        if let t = kobling.tilstand("quiz") {
            if t.naa > 0 && t.naa != avvikFra { avvikFra = t.naa; avvik = t.naa - Date().timeIntervalSince1970 * 1000 }
            ny = QzData(rom: t, hoder: kobling.hoder)
        } else if !sist.isEmpty {
            ny = QzData(sist)
            if ny.naa > 0 { avvik = ny.naa - Date().timeIntervalSince1970 * 1000 }
        } else { return }
        withAnimation(.spring(response: 0.45, dampingFraction: 0.8)) { d = ny }
    }

    func igjen(_ frist: Double) -> Int { max(0, Int(ceil((frist - 1500 - (Date().timeIntervalSince1970 * 1000 + avvik)) / 1000))) }

    /// Svaret (kan byttes så lenge klokka går) – rett til rommet
    func svar(_ v: String) { send(["handling": "qz-svar", "v": v], ellers: "qz-svar", ["v": v], tung: false, las: false) }
    /// Satsingen på en annen spiller (trykk igjen for å angre)
    func sats(_ paa: String) { send(["handling": "qz-sats", "paa": paa], ellers: "qz-sats", ["paa": paa], tung: true, las: false) }
    /// Kategorikortet (tom `kat`: verten trekker for den som har tur)
    func trekk(_ kat: String) {
        if kobling.direkte { kobling.lyd("kortsnu") }   // nettsiden spiller lyden selv når den sender
        send(["handling": "qz-trekk", "kat": kat], ellers: "qz-trekk", ["kat": kat], tung: !kat.isEmpty, las: true)
    }
    func lengde(_ n: Int) { send(["handling": "qz-lengde", "antall": n], ellers: "qz-lengde", ["n": String(n)], tung: false, las: false) }
    /// Vertens knapper: qz-start, qz-vis, qz-neste
    func steg(_ g: String) { send(["handling": g], ellers: g, [:], tung: false, las: true) }

    private func send(_ h: [String: Any], ellers g: String, _ attrs: [String: String], tung: Bool, las: Bool) {
        if las { guard !sender else { return }; sender = true }
        Haptikk.trykk(tung ? .medium : .light)
        Task {
            let ok = await kobling.gjor(h, ellers: g, attrs)
            if las { sender = false }
            if !ok { Haptikk.melding(.error) }
        }
    }

    /// Stua og Mer: nettsidens egne knapper
    func trykk(_ g: String, _ attrs: [String: String] = [:], tung: Bool = false) {
        Haptikk.trykk(tung ? .medium : .light)
        kobling.trykkNett(g, attrs)
    }
}

struct QuizSkjerm: View {
    var m: QzModell
    @Environment(\.accessibilityReduceMotion) private var roligere
    private let rust = Color(red: 0.722, green: 0.22, blue: 0.039)
    private let blaa = Color(red: 0.486, green: 0.776, blue: 0.996)
    private let tavle = Color(red: 0.11, green: 0.106, blue: 0.122)

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
                            else if let t = d.trekk { trekk(d, t) }
                            else if let sp = d.spm { chipRad(sp.chip, gul: sp.mitt.isEmpty); katChip(d); sporsmal(d); svarer(d, sp) }
                            else if let sv = d.svar { chipRad(sv.chip, gul: false); katChip(d); sporsmal(d, liten: true); avslort(d, sv) }
                        }
                        .padding(.horizontal, 16).padding(.top, 8).padding(.bottom, 24)
                    }
                }
            }
        }
        .foregroundColor(blekk)
    }

    // MARK: Toppen – KATEGORIKONGEN, spørsmål nr, klokka og Stua/Mer
    private func topp(_ d: QzData) -> some View {
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
    /// Den store gule (eller hvite) merkelappen øverst: «Din tur – trekk!», «Svar!», «Svaret»
    private func chipRad(_ t: String, gul erGul: Bool) -> some View {
        Text(t.uppercased()).font(.archivo(22, vekt: 900)).tracking(-0.3).foregroundColor(erGul ? morkBlekk : blekk).lineLimit(1).minimumScaleFactor(0.6)
            .padding(.horizontal, 10).padding(.vertical, 5)
            .background(RoundedRectangle(cornerRadius: 6).fill(erGul ? gul : kortFarge)).overlay(RoundedRectangle(cornerRadius: 6).stroke(blekk, lineWidth: 2.5))
            .background(RoundedRectangle(cornerRadius: 6).fill(blekk).offset(x: 3, y: 3))
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
    private func lenke(_ t: String, action: @escaping () -> Void) -> some View {
        Button(action: action) { Text(t).font(.archivo(14, vekt: 700)).underline().opacity(0.8).padding(.vertical, 4).frame(maxWidth: .infinity) }.buttonStyle(.plain)
    }
    private func vent(_ t: String) -> some View { Text(t).font(.archivo(14, vekt: 700)).multilineTextAlignment(.center).frame(maxWidth: .infinity).opacity(0.75).padding(.top, 2) }
    private func etikett(_ t: String) -> some View { Text(t.uppercased()).font(.archivo(11, vekt: 900)).tracking(0.8).opacity(0.65) }

    // MARK: Kategorichip – navn, drøy og hvem som er konge
    @ViewBuilder private func katChip(_ d: QzData) -> some View {
        if let k = d.kat {
            HStack(spacing: 8) {
                Text(k.navn.uppercased()).font(.archivo(14, vekt: 900)).foregroundColor(morkBlekk).padding(.horizontal, 9).padding(.vertical, 4)
                    .background(RoundedRectangle(cornerRadius: 4).fill(k.droy ? oransje : gul)).overlay(RoundedRectangle(cornerRadius: 4).stroke(morkBlekk, lineWidth: 2.5))
                    .background(RoundedRectangle(cornerRadius: 4).fill(morkBlekk).offset(x: 3, y: 3))
                if k.droy { Text(k.droyTekst.uppercased()).font(.archivo(11, vekt: 900)).tracking(0.6).opacity(0.65) }
                Spacer(minLength: 4)
                if !k.konge.isEmpty { Text("👑 " + k.konge).font(.archivo(12, vekt: 800)).lineLimit(1) }
            }
        }
    }
    private func sporsmal(_ d: QzData, liten: Bool = false) -> some View {
        Text(d.q).font(.archivo(liten ? 17 : 23, vekt: 900)).fixedSize(horizontal: false, vertical: true).lineSpacing(1)
            .padding(14).frame(maxWidth: .infinity, alignment: .leading)
            .background(RoundedRectangle(cornerRadius: 16).fill(kortFarge)).overlay(RoundedRectangle(cornerRadius: 16).stroke(blekk, lineWidth: 2.5))
            .background(RoundedRectangle(cornerRadius: 16).fill(blekk).offset(x: 4, y: 4))
            .id("spm-\(d.i)-\(liten)")
            .transition(.move(edge: .trailing).combined(with: .opacity))
    }

    // MARK: Klar – forsiden med folka og lengden
    private func klar(_ d: QzData, _ k: QzKlar) -> some View {
        VStack(alignment: .leading, spacing: 14) {
            Text(k.forside).font(.archivo(34, vekt: 900)).tracking(-0.5).lineSpacing(-2).fixedSize(horizontal: false, vertical: true).padding(.top, 6)
            Hodestabel(antall: k.hoder.count, maks: 6, storrelse: 52) { i in hode(k.hoder[i].png, 52) }
            if !k.lengder.isEmpty {
                HStack(spacing: 8) {
                    ForEach(k.lengder) { l in
                        Button(action: { m.lengde(l.id) }) {
                            VStack(spacing: 1) { Text("\(l.id)").font(.archivo(22, vekt: 900)); Text(l.tekst.uppercased()).font(.archivo(10, vekt: 800)).opacity(0.7) }
                                .foregroundColor(l.valgt ? morkBlekk : blekk).frame(maxWidth: .infinity).frame(height: 58)
                                .background(RoundedRectangle(cornerRadius: 10).fill(l.valgt ? gul : kortFarge)).overlay(RoundedRectangle(cornerRadius: 10).stroke(blekk, lineWidth: 2.5))
                                .background(RoundedRectangle(cornerRadius: 10).fill(blekk).offset(x: l.valgt ? 1 : 3, y: l.valgt ? 1 : 3))
                        }.buttonStyle(TastTrykk())
                    }
                }
            }
            if !k.start.isEmpty { storKnapp(k.start) { m.steg("qz-start") } }
            else if !k.vent.isEmpty { vent(k.vent) }
            konger(d)
        }
    }

    // MARK: Trekk – vifta med fem kategorikort
    private func trekk(_ d: QzData, _ t: QzTrekk) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            chipRad(t.chip, gul: t.min)
            Text(t.tekst).font(.archivo(15, vekt: 700)).frame(maxWidth: .infinity).multilineTextAlignment(.center)
            vifte(t)
            if !t.forAndre.isEmpty { lenke(t.forAndre) { m.trekk("") } }
            konger(d)
        }
    }
    private func vifte(_ t: QzTrekk) -> some View {
        let n = t.hand.count
        return ZStack {
            ForEach(Array(t.hand.enumerated()), id: \.element.id) { i, k in
                let midt = Double(i) - Double(n - 1) / 2
                Button(action: { if t.min { m.trekk(k.id) } }) {
                    kortet(k, t)
                }
                .buttonStyle(TastTrykk()).disabled(!t.min)
                .rotationEffect(.degrees(midt * 9), anchor: .bottom)
                .offset(x: midt * 58, y: abs(midt) * 6)
                .zIndex(Double(i))
                .transition(.asymmetric(insertion: .offset(y: 40).combined(with: .opacity), removal: .opacity))
                .animation(roligere ? nil : .spring(response: 0.5, dampingFraction: 0.78).delay(Double(i) * 0.06), value: n)
            }
        }
        .frame(maxWidth: .infinity).frame(height: 200)
    }
    private func kortet(_ k: QzKortet, _ t: QzTrekk) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            if t.min {
                Spacer(minLength: 0)
                Text(k.navn.uppercased()).font(.archivo(13, vekt: 900)).tracking(-0.2).lineLimit(4).minimumScaleFactor(0.7).multilineTextAlignment(.leading).fixedSize(horizontal: false, vertical: true)
                if k.droy {
                    Text(t.droyTag.uppercased()).font(.archivo(10, vekt: 900)).tracking(0.6).padding(.horizontal, 6).padding(.vertical, 2)
                        .background(RoundedRectangle(cornerRadius: 4).fill(gul)).overlay(RoundedRectangle(cornerRadius: 4).stroke(morkBlekk, lineWidth: 2))
                }
            } else {
                Spacer(minLength: 0)
                Text("?").font(.archivo(44, vekt: 900)).frame(maxWidth: .infinity)
                Spacer(minLength: 0)
            }
        }
        .padding(9).frame(width: 96, height: 150, alignment: .leading)
        .foregroundColor(t.min ? morkBlekk : lys)
        .background(RoundedRectangle(cornerRadius: 9).fill(t.min ? (k.droy ? oransje : lys) : tavle))
        .overlay(RoundedRectangle(cornerRadius: 6).strokeBorder(style: StrokeStyle(lineWidth: 2, dash: [4, 4])).foregroundColor((t.min ? morkBlekk : lys).opacity(0.3)).padding(6))
        .overlay(RoundedRectangle(cornerRadius: 9).stroke(morkBlekk, lineWidth: 3))
        .background(RoundedRectangle(cornerRadius: 9).fill(morkBlekk).offset(x: 3, y: 3))
    }

    // MARK: Svare – A–D, satsingen og benken
    private func svarer(_ d: QzData, _ sp: QzSpm) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            alternativer(sp.alt, apne: true)
            satsBoks(sp.sats)
            if !sp.vis.isEmpty { storKnapp(sp.vis) { m.steg("qz-vis") } }
            benk(sp.folk, sp.status)
        }
    }
    private func alternativer(_ alt: [QzAlt], apne: Bool) -> some View {
        VStack(spacing: 8) {
            ForEach(alt) { a in
                let farge: Color = apne ? (a.valgt ? gul : kortFarge) : a.rett ? mint : a.feil ? oransje : kortFarge
                Button(action: { if apne { m.svar(a.tekst) } }) {
                    HStack(alignment: .center, spacing: 10) {
                        Text(a.bokstav).font(.archivo(15, vekt: 900)).foregroundColor(lys).frame(width: 30, height: 30).background(RoundedRectangle(cornerRadius: 5).fill(morkBlekk))
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
                    .background(RoundedRectangle(cornerRadius: 8).fill(farge)).overlay(RoundedRectangle(cornerRadius: 8).stroke(morkBlekk.opacity(!apne && !a.rett && !a.feil ? 0.35 : 1), lineWidth: 2.5))
                    .background(RoundedRectangle(cornerRadius: 8).fill(apne ? blekk : Color.clear).offset(x: a.valgt ? 1 : 3, y: a.valgt ? 1 : 3))
                    .opacity(!apne && !a.rett && !a.feil ? 0.75 : 1)
                }
                .buttonStyle(TastTrykk()).disabled(!apne)
            }
        }
    }
    private func satsBoks(_ s: QzSats) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            etikett(s.etikett)
            if s.folk.isEmpty { Text(s.hjelp).font(.archivo(12, vekt: 700)).opacity(0.65) }
            else {
                LazyVGrid(columns: [GridItem(.adaptive(minimum: 104), spacing: 8)], alignment: .leading, spacing: 8) {
                    ForEach(s.folk) { h in
                        let paa = s.valgt == h.id
                        Button(action: { m.sats(h.id) }) {
                            HStack(spacing: 6) { hode(h.png, 28); Text(h.navn).font(.archivo(13, vekt: 800)).lineLimit(1).minimumScaleFactor(0.8); Spacer(minLength: 0) }
                                .padding(.leading, 4).padding(.trailing, 8).frame(height: 38)
                                .foregroundColor(paa ? morkBlekk : blekk)
                                .background(Capsule().fill(paa ? oransje : kortFarge)).overlay(Capsule().stroke(blekk, lineWidth: 2.5))
                                .background(Capsule().fill(blekk).offset(x: paa ? 1 : 3, y: paa ? 1 : 3))
                        }.buttonStyle(TastTrykk())
                    }
                }
                Text(s.hjelp).font(.archivo(12, vekt: 700)).opacity(0.65)
            }
        }
        .padding(12).frame(maxWidth: .infinity, alignment: .leading)
        .overlay(RoundedRectangle(cornerRadius: 10).strokeBorder(style: StrokeStyle(lineWidth: 2.5, dash: [6, 5])).foregroundColor(blekk))
    }
    private func benk(_ folk: [QzHode], _ status: String) -> some View {
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

    // MARK: Svaret er vist – fasit, ditt resultat, ny konge og satsingene
    private func avslort(_ d: QzData, _ sv: QzSvar) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            alternativer(sv.alt, apne: false)
            if !sv.info.isEmpty { Text(sv.info).font(.archivo(14, vekt: 600)).opacity(0.7).fixedSize(horizontal: false, vertical: true) }
            if let mitt = sv.mitt {
                VStack(alignment: .leading, spacing: 2) {
                    Text(mitt.over.uppercased()).font(.archivo(11, vekt: 900)).tracking(0.8).opacity(0.75)
                    Text(mitt.tittel).font(.archivo(20, vekt: 900))
                    if !mitt.under.isEmpty { Text(mitt.under).font(.archivo(13, vekt: 700)).opacity(0.75) }
                }
                .padding(12).frame(maxWidth: .infinity, alignment: .leading).foregroundColor(morkBlekk)
                .background(RoundedRectangle(cornerRadius: 10).fill(mitt.rett ? mint : oransje)).overlay(RoundedRectangle(cornerRadius: 10).stroke(morkBlekk, lineWidth: 2.5))
                .background(RoundedRectangle(cornerRadius: 10).fill(morkBlekk).offset(x: 3, y: 3))
                .transition(.scale(scale: 0.96).combined(with: .opacity))
            }
            if !sv.nyKonge.isEmpty {
                Text(sv.nyKonge).font(.archivo(16, vekt: 800)).foregroundColor(morkBlekk).multilineTextAlignment(.center)
                    .padding(12).frame(maxWidth: .infinity)
                    .background(RoundedRectangle(cornerRadius: 10).fill(gul)).overlay(RoundedRectangle(cornerRadius: 10).stroke(morkBlekk, lineWidth: 2.5))
                    .background(RoundedRectangle(cornerRadius: 10).fill(morkBlekk).offset(x: 3, y: 3))
                    .transition(.scale(scale: 0.9).combined(with: .opacity))
            }
            if !sv.satsinger.isEmpty {
                VStack(spacing: 6) {
                    ForEach(sv.satsinger) { s in
                        HStack(spacing: 10) {
                            hode(s.png, 36)
                            VStack(alignment: .leading, spacing: 1) {
                                Text(s.tekst).font(.archivo(13, vekt: 700)).lineLimit(2)
                                Text(s.under).font(.archivo(13, vekt: 900)).foregroundColor(s.treff ? blekk : rust)
                            }
                            Spacer(minLength: 0)
                        }
                        .padding(.horizontal, 10).padding(.vertical, 8)
                        .background(RoundedRectangle(cornerRadius: 8).fill(kortFarge)).overlay(RoundedRectangle(cornerRadius: 8).stroke(blekk.opacity(0.5), lineWidth: 2))
                    }
                }
            }
            storKnapp(sv.neste) { m.steg("qz-neste") }
        }
    }

    // MARK: Kongene i kveld
    @ViewBuilder private func konger(_ d: QzData) -> some View {
        if !d.konger.isEmpty {
            VStack(alignment: .leading, spacing: 4) {
                etikett(d.kongerEtikett)
                ForEach(d.konger) { k in
                    HStack(spacing: 6) { Text("👑").font(.system(size: 14)); Text(k.navn).font(.archivo(14, vekt: 900)); Text("\(k.kat) · \(k.n)").font(.archivo(13, vekt: 600)).opacity(0.65).lineLimit(1) }
                }
            }.padding(.top, 6)
        }
    }

    // MARK: Ferdig – pallen, kåringene, kongene og «Hva nå?»
    private func ferdig(_ d: QzData, _ f: QzFerdig) -> some View {
        VStack(alignment: .leading, spacing: 14) {
            Text(f.tittel).font(.archivo(26, vekt: 900)).tracking(-0.4).fixedSize(horizontal: false, vertical: true)
            HStack(alignment: .bottom, spacing: 10) {
                ForEach(f.pall) { p in
                    VStack(spacing: 4) {
                        hode(p.png, p.plass == 1 ? 76 : 58)
                        Text(p.navn).font(.archivo(12, vekt: 800)).lineLimit(1)
                        Text("\(p.n)").font(.archivo(22, vekt: 900)).foregroundColor(morkBlekk).frame(width: 44, height: 36)
                            .background(RoundedRectangle(cornerRadius: 6).fill(p.plass == 1 ? gul : p.plass == 2 ? mint : rosa)).overlay(RoundedRectangle(cornerRadius: 6).stroke(morkBlekk, lineWidth: 2.5))
                    }.frame(maxWidth: .infinity)
                }
            }
            if !f.kaaringer.isEmpty {
                VStack(alignment: .leading, spacing: 4) {
                    ForEach(f.kaaringer) { k in
                        (Text(k.tittel + " ").font(.archivo(14, vekt: 900)) + Text(k.tekst).font(.archivo(14, vekt: 600))).fixedSize(horizontal: false, vertical: true)
                    }
                }
            }
            if !f.rest.isEmpty {
                VStack(spacing: 4) {
                    ForEach(f.rest) { p in
                        HStack(spacing: 8) { Text("\(p.plass).").font(.archivo(13, vekt: 800)).frame(width: 22, alignment: .trailing); hode(p.png, 28); Text(p.navn).font(.archivo(14, vekt: 700)); Spacer(); Text("\(p.n)").font(.archivo(16, vekt: 900)) }
                    }
                }
            }
            konger(d)
            BlokkListe(m: m.blokker).padding(.top, 6)
        }
    }
}
