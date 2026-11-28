import SwiftUI
import UIKit
import WebKit

/// Gris som native skjerm: fjøset med folket og GRIS-bokstavene, halmstrået som brenner ned, kortene dine
/// (trykk på det du sender til venstre) og trynet du trykker på når noen har fire like.
/// Fase 3: skjermen leser rommet selv (LekKobling/RomKlient) og sender kortvalget og nesa rett til rommet. Nettsiden
/// driver fortsatt klokka (grDriv: bytte, nese, pause) og gir plassen i rommet, figurene og «Hva nå?»-knappene.
/// Med eldre rom.js brukes grData som reserve.
struct GrKort: Identifiable { let id: Int; let v: String; let f: String; let rod: Bool }
struct GrFolk: Identifiable { let id: String; let navn: String; let png: String; let n: Int; let klar: Bool; let status: String; let taper: Bool }

struct GrData {
    var fase = "", tittel = "", chip = "", varsel = false, naa: Double = 0
    var ord = "GRIS", folk: [GrFolk] = []
    var halm = false, halmLengde: Double = 0, halmVed: Double = 0, nese = false
    var hand: [GrKort]? = nil, handTekst = "", merke = "", mittValg = -1, kanSende = false, harFire = false, tatt = false
    var tryneTekst = "", tryneHjelp = "", pust = false, paa = false
    var gris = "", grisTekst = "", stua = "Stua", mer = "Mer"

    /// Reserven: skjermen slik eldre rom.js lager den (grData)
    init(_ d: [String: Any]) {
        func s(_ k: String) -> String { d[k] as? String ?? "" }
        func b(_ k: String) -> Bool { d[k] as? Bool ?? false }
        func n(_ k: String) -> Double { (d[k] as? NSNumber)?.doubleValue ?? 0 }
        fase = s("fase"); tittel = s("tittel"); chip = s("chip"); varsel = b("varsel"); naa = n("naa"); ord = s("ord")
        folk = (d["folk"] as? [[String: Any]] ?? []).map { f in GrFolk(id: f["id"] as? String ?? "", navn: f["navn"] as? String ?? "", png: f["png"] as? String ?? "", n: (f["n"] as? NSNumber)?.intValue ?? 0, klar: f["klar"] as? Bool ?? false, status: f["status"] as? String ?? "", taper: f["taper"] as? Bool ?? false) }
        halm = b("halm"); halmLengde = n("halmLengde"); halmVed = n("halmVed"); nese = b("nese")
        hand = d["hand"] is NSNull || d["hand"] == nil ? nil : (d["hand"] as? [[String: Any]] ?? []).enumerated().map { i, k in GrKort(id: i, v: k["v"] as? String ?? "", f: k["f"] as? String ?? "", rod: k["rod"] as? Bool ?? false) }
        handTekst = s("handTekst"); merke = s("merke"); mittValg = (d["mittValg"] as? NSNumber)?.intValue ?? -1; kanSende = b("kanSende"); harFire = b("harFire"); tatt = b("tatt")
        tryneTekst = s("tryneTekst"); tryneHjelp = s("tryneHjelp"); pust = b("pust"); paa = b("paa")
        gris = s("gris"); grisTekst = s("grisTekst"); stua = d["stua"] as? String ?? "Stua"; mer = d["mer"] as? String ?? "Mer"
    }

    /// Skjermen bygd rett fra rommet: `spill` er serverens visning av Gris (ekstraVisning i rom.ts)
    init(rom t: RomTilstand, hoder: [String: [String: String]]) {
        let s = t.spill ?? .null
        let en = t.lang == "en"
        func T(_ no: String, _ eng: String) -> String { en ? eng : no }
        let meg = t.meg ?? ""
        func jaNavn(_ id: String?) -> String { guard let id else { return "?" }; return id == meg ? T("Du", "You") : (t.spiller(id)?.navn ?? "?") }
        func ider(_ v: JSONVerdi?) -> [String] { (v?.liste ?? []).compactMap(\.tekst) }
        let bokstaver = s["bokstaver"]?.objekt ?? [:]
        func antall(_ id: String) -> Int { min(4, Int(bokstaver[id]?.tall ?? 0)) }

        fase = s["fase"]?.tekst ?? ""
        naa = t.naa
        ord = T("GRIS", "PIGS")
        let ordet = Array(ord)
        func bokst(_ id: String) -> String { let n = antall(id); return n >= 1 ? String(ordet[n - 1]) : "" }
        let neser = ider(s["neser"]), harValgt = ider(s["harValgt"])
        let taperId = s["taper"]?.tekst, grisId = s["gris"]?.tekst
        let tattNr = neser.firstIndex(of: meg)
        tatt = tattNr != nil
        let valg = s["mittValg"]?.tall.map { Int($0) }
        harFire = s["harFire"]?.bool ?? false
        let runde = Int(s["runde"]?.tall ?? 1)
        let send = fase == "send", nesa = fase == "nese", slutt = fase == "slutt", ferdigNa = fase == "ferdig"

        tittel = slutt ? T("Gris", "Pigs") : T("Gris · runde ", "Pigs · round ") + "\(runde)"
        varsel = nesa && !tatt
        if slutt { chip = jaNavn(grisId) + T(" er GRIS!", " is the PIG!") }
        else if send { chip = harFire ? T("Fire like! Trykk på trynet", "Four of a kind! Tap the snout") : valg != nil ? T("Venter på de andre …", "Waiting for the others …") : T("Send et kort til venstre", "Pass a card to the left") }
        else if nesa { chip = tattNr.map { T("Du var nr ", "You were no. ") + "\($0 + 1)" } ?? T("NESA! Fort!", "NOSE! Quick!") }
        else { chip = taperId.map { jaNavn($0) + T(" var sist – ", " was last – ") + bokst($0) + "!" } ?? T("Alle rakk nesa", "Everyone made it") }

        folk = ider(s["ider"]).map { id in
            let klar = send ? harValgt.contains(id) : neser.contains(id)
            let nr = neser.firstIndex(of: id)
            let status = send ? (klar ? T("valgt", "picked") : "") : nr.map { T("nr ", "no. ") + "\($0 + 1)" } ?? ((ferdigNa || slutt) && taperId == id ? T("sist!", "last!") : "")
            return GrFolk(id: id, navn: jaNavn(id), png: figurPng(hoder, id), n: antall(id), klar: klar, status: status, taper: taperId == id && !send)
        }

        let vinduer = s["vinduer"]
        halm = send || nesa
        halmLengde = (nesa ? vinduer?["nese"]?.tall : vinduer?["bytt"]?.tall) ?? 0
        halmVed = (nesa ? s["neseVed"]?.tall : s["sendVed"]?.tall) ?? 0
        nese = nesa

        if let h = s["minHand"]?.liste {
            hand = h.enumerated().map { i, k in
                let f = k["f"]?.tekst ?? ""
                return GrKort(id: i, v: kortVerdi(Int(k["v"]?.tall ?? 0), en: en), f: f, rod: rodFarge(f))
            }
        }
        handTekst = T("Du er med fra neste runde.", "You’re in from the next round.")
        merke = send ? (valg != nil ? T("Sendt!", "Sent!") : T("Trykk på kortet du sender", "Tap the card to pass")) : T("Hånda di", "Your hand")
        mittValg = valg ?? -1
        kanSende = send && valg == nil && hand != nil
        tryneTekst = nesa ? (tatt ? T("Tatt!", "Got it!") : T("NESA!", "NOSE!")) : T("Nesa", "The nose")
        tryneHjelp = nesa ? (tatt ? T("Vent på de andre – sistemann får en bokstav.", "Wait for the others – the last one gets a letter.") : T("Noen har fire like. Trykk før det er for sent!", "Someone has four of a kind. Tap before it’s too late!"))
            : ferdigNa ? T("Ny runde kommer straks …", "A new round is coming …") : T("Har du fire like? Trykk. Trykker du for tidlig, får du en bokstav.", "Four of a kind? Tap. Tap too early and you get a letter.")
        pust = (nesa && !tatt) || (harFire && send)
        paa = nesa || harFire
        gris = T("GRIS!", "PIGS!")
        grisTekst = slutt ? jaNavn(grisId) + T(" tar en shot.", " takes a shot.") : ""
        stua = T("Stua", "Lounge"); mer = T("Mer", "More")
    }
}

@MainActor
@Observable
final class GrModell: HarFigurer {
    var d: GrData? = nil
    let blokker = KortModell()
    private let kobling = LekKobling("gris")
    @ObservationIgnored private(set) var avvik: Double = 0
    @ObservationIgnored private var avvikFra: Double = 0
    /// Det nettsiden sendte sist – reserven til rommet er hentet (eller hvis plassen ikke finnes)
    @ObservationIgnored private var sist: [String: Any] = [:]
    /// Et trykk er på vei: ett trykk gir én handling
    @ObservationIgnored private var sender = false
    @ObservationIgnored weak var nett: WKWebView? { didSet { blokker.nett = nett; kobling.nett = nett } }

    init() { kobling.endret = { [weak self] in self?.bygg() } }

    func sett(_ dict: [String: Any]) {
        sist = dict
        blokker.sett(["blokker": dict["slutt"] as? [[String: Any]] ?? [], "naa": dict["naa"] ?? 0])
        kobling.ta(dict) { d in
            (d["folk"] as? [[String: Any]] ?? []).map { f in (id: f["id"] as? String ?? "", oi: false, png: f["png"] as? String ?? "") }
        }
        bygg()
    }

    /// Leken er over på denne telefonen
    func slipp() { kobling.slipp(); d = nil; sist = [:]; sender = false; avvikFra = 0 }

    func naaMs() -> Double { Date().timeIntervalSince1970 * 1000 + avvik }

    /// Rommet når det er hentet og viser Gris – ellers skjermen nettsiden sendte
    private func bygg() {
        let ny: GrData
        if let t = kobling.tilstand("gris") {
            // Bare et nytt svar sier noe om klokka: et gammelt svar bygd på nytt ville flyttet halmstrået
            if t.naa > 0 && t.naa != avvikFra { avvikFra = t.naa; avvik = t.naa - Date().timeIntervalSince1970 * 1000 }
            ny = GrData(rom: t, hoder: kobling.hoder)
        } else if !sist.isEmpty {
            ny = GrData(sist)
            if ny.naa > 0 { avvik = ny.naa - Date().timeIntervalSince1970 * 1000 }
        } else { return }
        d = ny
    }

    /// Kortet du sender til venstre – rett til rommet. Det glir ut med én gang; serveren bekrefter.
    func velg(_ i: Int) {
        guard !sender, d?.kanSende == true else { return }
        sender = true
        Haptikk.trykk()
        if kobling.direkte { kobling.lyd("kortlegg") }   // nettsiden spiller lyden selv når den sender
        d?.mittValg = i
        d?.kanSende = false
        Task {
            let ok = await kobling.gjor(["handling": "velg", "i": i], ellers: "velg", ["i": String(i)])
            sender = false
            if !ok { Haptikk.melding(.error); bygg() }
        }
    }

    /// Trynet: når noen har fire like (eller for tidlig – da får du en bokstav)
    func nese() {
        guard !sender, let d, !(d.tatt && d.fase == "nese"), d.fase == "send" || d.fase == "nese" else { return }
        sender = true
        Haptikk.trykk(.heavy)
        Task {
            let ok = await kobling.gjor(["handling": "nese"], ellers: "nese")
            sender = false
            if !ok { Haptikk.melding(.error) }
        }
    }

    /// Stua og Mer: nettsidens egne knapper
    func trykk(_ g: String, _ attrs: [String: String] = [:]) {
        Haptikk.trykk()
        kobling.trykkNett(g, attrs)
    }
}

struct GrisSkjerm: View {
    var m: GrModell
    private var kort: Color { Tema.kort }
    private let halmFarge = Color(red: 0.965, green: 0.906, blue: 0.722)
    private let halmMork = Color(red: 0.698, green: 0.47, blue: 0.157)

    var body: some View {
        ZStack {
            papir.ignoresSafeArea()
            if let d = m.d {
                VStack(spacing: 0) {
                    topp(d)
                    VStack(alignment: .leading, spacing: 12) {
                            if d.fase == "slutt" {
                                grisLapp(d)
                                fjos(d)
                                BlokkListe(m: m.blokker)
                            } else {
                                fjos(d)
                            }
                            Spacer(minLength: 0)
                        }.padding(.horizontal, 16).padding(.bottom, 12)
                }
            }
        }
        .foregroundColor(blekk)
    }

    private func topp(_ d: GrData) -> some View {
        Topplinje(tittel: d.tittel, chip: d.chip, uthevet: d.varsel, stua: d.stua, mer: d.mer, trykk: { m.trykk($0) })
    }

    private func hode(_ png: String) -> some View { Figur(png) }

    // MARK: Fjøset – alt ligger på halmgul bakgrunn
    private func fjos(_ d: GrData) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            folk(d)
            if d.halm { halmen(d) }
            if d.fase != "slutt" {
                hand(d)
                tryne(d)
            }
        }
        .padding(12)
        .background(ZStack {
            RoundedRectangle(cornerRadius: 18).fill(halmFarge)
            RoundedRectangle(cornerRadius: 18).fill(LinearGradient(colors: [halmMork.opacity(0.1), .clear, halmMork.opacity(0.1)], startPoint: .topLeading, endPoint: .bottomTrailing))
        })
        .overlay(RoundedRectangle(cornerRadius: 18).stroke(d.nese ? oransje : morkBlekk, lineWidth: 3))
        .background(RoundedRectangle(cornerRadius: 18).fill(morkBlekk).offset(x: 4, y: 4))
        .foregroundColor(morkBlekk)
    }

    /// Folket: hodet, navnet, G-R-I-S-bokstavene og status
    private func folk(_ d: GrData) -> some View {
        VStack(spacing: 6) {
            ForEach(d.folk) { f in
                HStack(spacing: 10) {
                    hode(f.png).frame(width: 34, height: 38).overlay(f.klar ? Circle().stroke(mint, lineWidth: 3).frame(width: 40, height: 40) : nil)
                    Text(f.navn).font(.archivo(14, vekt: 900)).lineLimit(1).frame(width: 64, alignment: .leading)
                    HStack(spacing: 3) {
                        ForEach(Array(d.ord.enumerated()), id: \.offset) { j, t in
                            Text(String(t)).font(.archivo(13, vekt: 900)).frame(width: 22, height: 24)
                                .foregroundColor(j < f.n ? lys : morkBlekk.opacity(0.35))
                                .background(RoundedRectangle(cornerRadius: 5).fill(j < f.n ? rust : lys.opacity(0.5)))
                                .overlay(RoundedRectangle(cornerRadius: 5).stroke(morkBlekk.opacity(j < f.n ? 1 : 0.3), lineWidth: 1.5))
                                .scaleEffect(j < f.n ? 1 : 0.92)
                                .animation(.spring(response: 0.3, dampingFraction: 0.5), value: f.n)
                        }
                    }
                    Spacer()
                    Text(f.status).font(.archivo(12, vekt: 800)).foregroundColor(f.taper ? rust : morkBlekk.opacity(0.7))
                }
                .padding(.horizontal, 8).padding(.vertical, 5)
                .background(RoundedRectangle(cornerRadius: 10).fill(f.taper ? rosa.opacity(0.5) : lys.opacity(0.45)))
            }
        }
    }

    /// Halmstrået: brenner ned i byttevinduet (gult) eller nesevinduet (oransje)
    private func halmen(_ d: GrData) -> some View {
        TimelineView(.periodic(from: .now, by: 0.2)) { _ in
            let andel = d.halmLengde > 0 ? max(0, min(1, 1 - (m.naaMs() - d.halmVed) / d.halmLengde)) : 0
            GeometryReader { g in
                ZStack(alignment: .leading) {
                    Capsule().fill(morkBlekk.opacity(0.15))
                    Capsule().fill(d.nese ? oransje : halmMork).frame(width: g.size.width * CGFloat(andel))
                }
            }.frame(height: 6)
        }
    }

    /// Hånda: fire kort, trykk på det du sender – det valgte glir ut
    @ViewBuilder private func hand(_ d: GrData) -> some View {
        if let h = d.hand {
            Text(d.merke.uppercased()).font(.archivo(11, vekt: 900)).opacity(0.7)
            HStack(spacing: 8) {
                ForEach(h) { k in
                    let ut = d.mittValg == k.id
                    Button(action: { m.velg(k.id) }) {
                        ZStack {
                            RoundedRectangle(cornerRadius: 8).fill(Color.white)
                            RoundedRectangle(cornerRadius: 8).stroke(morkBlekk, lineWidth: 2.5)
                            if d.harFire && d.fase == "send" { RoundedRectangle(cornerRadius: 8).stroke(gul, lineWidth: 3).padding(-3) }
                            VStack(spacing: 2) {
                                Text(k.v).font(.system(size: 22, weight: .black))
                                Text(k.f).font(.system(size: 24, weight: .black))
                            }.foregroundColor(k.rod ? kortRod : morkBlekk)
                        }
                        .frame(maxWidth: .infinity).frame(height: 92)
                        .offset(x: ut ? -40 : 0).opacity(ut ? 0.35 : 1).rotationEffect(.degrees(ut ? -8 : 0))
                        .animation(.spring(response: 0.4, dampingFraction: 0.7), value: ut)
                    }.buttonStyle(.plain).disabled(!d.kanSende)
                }
            }
        } else {
            Text(d.handTekst).font(.archivo(14, vekt: 600)).opacity(0.7)
        }
    }

    /// Trynet: stort og rundt, puster når du bør trykke
    private func tryne(_ d: GrData) -> some View {
        VStack(spacing: 8) {
            Button(action: { m.nese() }) {
                ZStack {
                    Circle().fill(d.paa ? rosa : rosa.opacity(0.55))
                    Circle().stroke(morkBlekk, lineWidth: 3)
                    HStack(spacing: 14) {
                        Circle().fill(morkBlekk).frame(width: 14, height: 14)
                        Circle().fill(morkBlekk).frame(width: 14, height: 14)
                    }
                }
                .frame(width: 96, height: 76)
                .scaleEffect(d.pust ? 1.08 : 1)
                .animation(d.pust ? .easeInOut(duration: 0.5).repeatForever(autoreverses: true) : .default, value: d.pust)
                .background(Ellipse().fill(morkBlekk).offset(x: 4, y: 4))
            }.buttonStyle(.plain).disabled(d.tatt && d.fase == "nese")
            Text(d.tryneTekst.uppercased()).font(.archivo(d.fase == "nese" ? 24 : 16, vekt: 900)).foregroundColor(d.fase == "nese" && !d.tatt ? rust : morkBlekk)
            Text(d.tryneHjelp).font(.archivo(13, vekt: 600)).opacity(0.75).multilineTextAlignment(.center).fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity).padding(.top, 6)
    }

    /// Slutten: GRIS! og hvem som tar en shot
    private func grisLapp(_ d: GrData) -> some View {
        VStack(spacing: 4) {
            Text(d.gris).font(.archivo(40, vekt: 900)).rotationEffect(.degrees(-3))
            Text(d.grisTekst).font(.archivo(16, vekt: 800))
        }
        .frame(maxWidth: .infinity).padding(16).foregroundColor(morkBlekk)
        .background(RoundedRectangle(cornerRadius: 14).fill(rosa)).overlay(RoundedRectangle(cornerRadius: 14).stroke(morkBlekk, lineWidth: 3))
        .background(RoundedRectangle(cornerRadius: 14).fill(morkBlekk).offset(x: 4, y: 4))
    }
}
