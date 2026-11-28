import SwiftUI
import UIKit
import WebKit

/// Fuck the Dealer som native skjerm: dealeren ser kortet og tastene A–K, de andre ser hvem som deler og tellebrettet,
/// avgjørelsen snus for alle på et mørkt panel.
/// Fase 3: skjermen leser rommet selv (LekKobling/RomKlient) og sender verdien og «Neste kort» rett til rommet. Nettsiden
/// gir plassen i rommet, figurene og «Hva nå?»-knappene til slutt. Med eldre rom.js brukes ftdData som reserve.
struct FtdKort { let v: String, f: String, rod: Bool }
struct FtdTast: Identifiable { let id: Int; let tekst: String; let ute: Bool; let mulig: Bool; let streket: Bool }
struct FtdKolonne: Identifiable { let id: Int; let v: String; let n: Int; let ute: Bool }
struct FtdRad: Identifiable { let id: String; let navn: String; let png: String; let plass: Int; let delt: String; let n: Int }
struct FtdRes { let treff: Bool, nr: Int, kort: FtdKort?, n: Int, over: String, under: String, gjettet: String, g1: String, g: String }
struct FtdHint { let opp: Bool, over: String, ord: String, enn: String }
struct FtdInfo { let n: String, tekst: String }
struct FtdFerdig { let etikett: String, navn: String, under: String, listeTittel: String, rader: [FtdRad] }

struct FtdData {
    var fase = "", jeg = false, styrer = false, pos = 0, n = 0, runde = 1, naa: Double = 0
    var tittel = "", chip = "", bom = 0, bomTekst = "", brett: [FtdKolonne] = [], brettTittel = "", bytt = ""
    var kort: FtdKort? = nil, taster: [FtdTast] = [], bare = "", gjetterTittel = "", gjetterUnder = "", hint: FtdHint? = nil, etikettAndre = ""
    var infoTreff: FtdInfo? = nil, infoBom: FtdInfo? = nil, res: FtdRes? = nil, videre = "", neste = "", vent = "", ventTittel = ""
    var ferdig: FtdFerdig? = nil, stua = "Stua", mer = "Mer"

    static func kort(_ k: [String: Any]?) -> FtdKort? {
        guard let k = k else { return nil }
        return FtdKort(v: k["v"] as? String ?? "", f: k["f"] as? String ?? "", rod: k["rod"] as? Bool ?? false)
    }
    /// Reserven: skjermen slik eldre rom.js lager den (ftdData)
    init(_ d: [String: Any]) {
        func s(_ k: String) -> String { d[k] as? String ?? "" }
        func b(_ k: String) -> Bool { d[k] as? Bool ?? false }
        func i(_ k: String) -> Int { (d[k] as? NSNumber)?.intValue ?? 0 }
        fase = s("fase"); jeg = b("jeg"); styrer = b("styrer"); pos = i("pos"); n = i("n"); runde = i("runde"); naa = (d["naa"] as? NSNumber)?.doubleValue ?? 0
        tittel = s("tittel"); chip = s("chip"); bom = (d["bom"] as? NSNumber)?.intValue ?? 0; bomTekst = s("bomTekst"); brettTittel = s("brettTittel"); bytt = s("bytt")
        brett = (d["brett"] as? [[String: Any]] ?? []).enumerated().map { j, k in FtdKolonne(id: j, v: k["v"] as? String ?? "", n: (k["n"] as? NSNumber)?.intValue ?? 0, ute: k["ute"] as? Bool ?? false) }
        kort = FtdData.kort(d["kort"] as? [String: Any])
        taster = (d["taster"] as? [[String: Any]] ?? []).map { t in FtdTast(id: (t["v"] as? NSNumber)?.intValue ?? 0, tekst: t["tekst"] as? String ?? "", ute: t["ute"] as? Bool ?? false, mulig: t["mulig"] as? Bool ?? false, streket: t["streket"] as? Bool ?? false) }
        bare = s("bare"); gjetterTittel = s("gjetterTittel"); gjetterUnder = s("gjetterUnder"); etikettAndre = s("etikettAndre")
        if let h = d["hint"] as? [String: Any] { hint = FtdHint(opp: h["opp"] as? Bool ?? true, over: h["over"] as? String ?? "", ord: h["ord"] as? String ?? "", enn: h["enn"] as? String ?? "") } else { hint = nil }
        func info(_ k: String) -> FtdInfo? { guard let x = d[k] as? [String: Any] else { return nil }; return FtdInfo(n: x["n"] as? String ?? "", tekst: x["tekst"] as? String ?? "") }
        infoTreff = info("infoTreff"); infoBom = info("infoBom")
        if let r = d["res"] as? [String: Any] {
            res = FtdRes(treff: r["treff"] as? Bool ?? false, nr: (r["nr"] as? NSNumber)?.intValue ?? 0, kort: FtdData.kort(r["kort"] as? [String: Any]), n: (r["n"] as? NSNumber)?.intValue ?? 0,
                         over: r["over"] as? String ?? "", under: r["under"] as? String ?? "", gjettet: r["gjettet"] as? String ?? "", g1: r["g1"] as? String ?? "", g: r["g"] as? String ?? "")
        } else { res = nil }
        videre = s("videre"); neste = s("neste"); vent = s("vent"); ventTittel = s("ventTittel")
        if let f = d["ferdig"] as? [String: Any] {
            ferdig = FtdFerdig(etikett: f["etikett"] as? String ?? "", navn: f["navn"] as? String ?? "", under: f["under"] as? String ?? "", listeTittel: f["listeTittel"] as? String ?? "",
                               rader: (f["rader"] as? [[String: Any]] ?? []).map { x in FtdRad(id: x["id"] as? String ?? "", navn: x["navn"] as? String ?? "", png: x["png"] as? String ?? "", plass: (x["plass"] as? NSNumber)?.intValue ?? 0, delt: x["delt"] as? String ?? "", n: (x["n"] as? NSNumber)?.intValue ?? 0) })
        } else { ferdig = nil }
        if !s("stua").isEmpty { stua = s("stua") }
        if !s("mer").isEmpty { mer = s("mer") }
    }

    /// Skjermen bygd rett fra rommet: `spill` er serverens visning av Fuck the Dealer (ekstraVisning i rom.ts).
    /// Kortet sender serveren bare til dealeren (og til alle når det er avgjort).
    init(rom t: RomTilstand, hoder: [String: [String: String]]) {
        let s = t.spill ?? .null
        let en = t.lang == "en"
        func T(_ no: String, _ eng: String) -> String { en ? eng : no }
        let meg = t.meg ?? ""
        func navn(_ id: String?) -> String { id.flatMap { t.spiller($0)?.navn } ?? "?" }
        func nv(_ id: String) -> String { id == meg ? T("Du", "You") : navn(id) }
        func tall(_ v: JSONVerdi?) -> Int { Int(v?.tall ?? 0) }
        /// Verdien slik nettsiden skriver den (ftdVn): ess er 1
        func vn(_ v: Int) -> String { v == 1 ? "A" : v <= 10 ? String(v) : (en ? [11: "J", 12: "Q", 13: "K"] : [11: "Kn", 12: "D", 13: "K"])[v] ?? String(v) }
        func kortFra(_ k: JSONVerdi?) -> FtdKort? {
            guard let k, let v = k["v"]?.tall, let f = k["f"]?.tekst else { return nil }
            return FtdKort(v: vn(Int(v)), f: f, rod: rodFarge(f))
        }

        let dealer = s["dealer"]?.tekst ?? ""
        fase = s["fase"]?.tekst ?? ""
        jeg = dealer == meg
        styrer = jeg || t.jegErVert
        pos = tall(s["pos"]); n = tall(s["n"]); runde = max(1, tall(s["runde"])); naa = t.naa
        let andre = fase == "andre", tomt = fase == "ferdig"
        let g1 = tall(s["g1"]), retning = s["hint"]?.tekst ?? ""
        let bomN = tall(s["bom"])
        tittel = "Fuck the Dealer · \(pos + (tomt ? 0 : 1)) / 52"
        chip = tomt ? T("Stokken er tom", "The deck is empty") : jeg ? T("Du deler", "You deal") : navn(dealer) + T(" deler", " deals")
        bom = tomt ? -1 : bomN
        bomTekst = "\(bomN)" + T(" av 3 bom", " of 3 misses")
        let brukt = s["brukt"]?.objekt ?? [:]
        func bruktN(_ v: Int) -> Int { tall(brukt[String(v)]) }
        brett = (1...13).map { v in FtdKolonne(id: v - 1, v: vn(v), n: bruktN(v), ute: bruktN(v) >= 4) }
        brettTittel = T("Tellebrettet", "The tally board")
        if let b = s["bytt"], b != .null, !tomt {
            let fra = b["fra"]?.tekst ?? "", til = b["til"]?.tekst ?? ""
            bytt = fra == meg ? T("Tre bom på rad – stokken gikk til ", "Three misses in a row – the deck went to ") + navn(til) + "."
                : jeg ? T("Tre bom på rad hos ", "Three misses in a row for ") + navn(fra) + T(" – du deler nå!", " – you deal now!")
                : T("Stokken gikk til ", "The deck went to ") + navn(til) + "."
        }
        stua = T("Stua", "Lounge"); mer = T("Mer", "More")

        if tomt {
            let dr = s["drukket"]?.objekt ?? [:], dt = s["dealt"]?.objekt ?? [:]
            let ider = (s["ider"]?.liste ?? []).compactMap(\.tekst)
            // Flest slurker først; like mange beholder rekkefølgen rundt bordet (som sorteringen i nettleseren)
            let rekke = ider.enumerated().sorted { a, b in
                let x = tall(dr[a.element]), y = tall(dr[b.element])
                return x != y ? x > y : a.offset < b.offset
            }.map(\.element)
            let topp = rekke.first
            ferdig = FtdFerdig(etikett: T("Kveldens dealer", "Dealer of the night"), navn: topp.map(nv) ?? "–",
                               under: topp.map { T("Drakk ", "Drank ") + "\(tall(dr[$0]))" + T(" slurker bak stokken.", " sips behind the deck.") } ?? "",
                               listeTittel: T("Slurker som dealer", "Sips as dealer"),
                               rader: rekke.enumerated().map { i, id in
                                   FtdRad(id: id, navn: nv(id), png: figurPng(hoder, id), plass: i + 1, delt: "\(tall(dt[id]))" + T(" kort delt", " cards dealt"), n: tall(dr[id]))
                               })
            return
        }

        if fase == "res", let r = s["res"], r != .null {
            let type = r["type"]?.tekst ?? "", treff = type != "bom"
            res = FtdRes(treff: treff, nr: tall(r["nr"]), kort: kortFra(r["kort"]), n: tall(r["n"]),
                         over: treff ? (type == "treff1" ? T("Treff på første · dealeren drikker kortet", "First-try hit · the dealer drinks the card") : T("Treff på andre · dealeren drikker halve", "Second-try hit · the dealer drinks half"))
                            : T("Avstanden ", "The distance ") + vn(tall(r["g"])) + "–" + vn(tall(r["kort"]?["v"])) + T(" · gjetteren drikker", " · the guesser drinks"),
                         under: treff ? (jeg ? "Fuck the dealer 🍻" : navn(dealer) + T(" drikker", " drinks")) : "",
                         gjettet: treff ? "" : T("Gjettet", "Guessed"), g1: treff ? "" : vn(tall(r["g1"])), g: treff ? "" : vn(tall(r["g"])))
            videre = bomN >= 3 ? T("Tre bom på rad – stokken går videre.", "Three misses in a row – the deck moves on.") : ""
            neste = styrer ? T("Neste kort →", "Next card →") : ""
            vent = styrer ? "" : navn(dealer) + T(" trykker neste.", " taps next.")
            return
        }

        if !styrer {
            ventTittel = andre ? T("Ett forsøk til", "One more try") : T("Noen gjetter", "Someone guesses")
            vent = andre ? navn(dealer) + T(" sa «", " said “") + (retning == "hoy" ? T("høyere", "higher") : T("lavere", "lower")) + T("» enn ", "” than ") + vn(g1)
                : T("Si en verdi høyt – ", "Call a value out loud – ") + navn(dealer) + T(" trykker den.", " taps it.")
            return
        }

        kort = kortFra(s["kort"])
        bare = jeg ? T("Bare du", "Only you") : T("Du trykker for ", "You tap for ") + navn(dealer)
        gjetterTittel = andre ? "" : T("Noen gjetter", "Someone guesses")
        gjetterUnder = andre ? "" : T("Trykk det som sies ↓", "Tap what they say ↓")
        if andre {
            hint = FtdHint(opp: retning == "hoy", over: jeg ? T("Si høyt", "Say it out loud") : navn(dealer) + T(" sier", " says"),
                           ord: retning == "hoy" ? T("«Høyere»", "“Higher”") : T("«Lavere»", "“Lower”"), enn: T(" enn ", " than ") + vn(g1))
        }
        etikettAndre = andre ? T("Ett forsøk til – trykk det som sies ↓", "One more try – tap what they say ↓") : ""
        taster = (1...13).map { v in
            let ute = bruktN(v) >= 4
            let feilSide = andre && ((retning == "hoy" && v <= g1) || (retning == "lav" && v >= g1))
            return FtdTast(id: v, tekst: vn(v), ute: ute || feilSide, mulig: andre && !ute && !feilSide, streket: andre && v == g1)
        }
        // Kortet: dealeren ser det. Verten som trykker for dealeren, får det ikke fra serveren – da står info-linjene tomme.
        if let kv = s["kort"]?["v"]?.tall.map({ Int($0) }) {
            infoTreff = FtdInfo(n: String(andre ? (kv + 1) / 2 : kv), tekst: andre ? T("treff – du drikker halve", "hit – you drink half") : T("treff – du drikker kortet", "hit – you drink the card"))
            infoBom = andre ? FtdInfo(n: "|" + vn(kv) + "–?|", tekst: T("bom – gjetteren drikker", "miss – the guesser drinks")) : FtdInfo(n: "", tekst: T("bom – si høyere/lavere", "miss – say higher/lower"))
        }
    }
}

@MainActor
@Observable
final class FtdModell: HarFigurer {
    var d: FtdData? = nil
    let blokker = KortModell()
    private let kobling = LekKobling("dealer")
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
            ((d["ferdig"] as? [String: Any])?["rader"] as? [[String: Any]] ?? []).map { x in (id: x["id"] as? String ?? "", oi: false, png: x["png"] as? String ?? "") }
        }
        bygg()
    }

    /// Leken er over på denne telefonen
    func slipp() { kobling.slipp(); d = nil; sist = [:]; sender = false }

    /// Rommet når det er hentet og viser Fuck the Dealer – ellers skjermen nettsiden sendte
    private func bygg() {
        let ny: FtdData
        if let t = kobling.tilstand("dealer") { ny = FtdData(rom: t, hoder: kobling.hoder) }
        else if !sist.isEmpty { ny = FtdData(sist) }
        else { return }
        withAnimation(.spring(response: 0.42, dampingFraction: 0.8)) { d = ny }
    }

    /// Verdien som ble sagt høyt (A–K) – rett til rommet
    func gjett(_ v: Int) {
        guard d?.styrer == true else { return }
        send(["handling": "ftd-gjett", "v": v], ellers: "ftd-gjett", ["v": String(v)], .medium)
    }
    /// Neste kort etter avgjørelsen
    func neste() { send(["handling": "ftd-neste"], ellers: "ftd-neste", [:], .light) }

    private func send(_ h: [String: Any], ellers g: String, _ attrs: [String: String], _ stil: UIImpactFeedbackGenerator.FeedbackStyle) {
        guard !sender else { return }
        sender = true
        Haptikk.trykk(stil)
        Task {
            let ok = await kobling.gjor(h, ellers: g, attrs)
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

struct DealerSkjerm: View {
    var m: FtdModell
    @Environment(\.accessibilityReduceMotion) private var roligere
    @State private var snudd = 0
    private let rust = Color(red: 0.722, green: 0.22, blue: 0.039)
    private let kortRod = Color(red: 0.85, green: 0.16, blue: 0.16)

    var body: some View {
        ZStack {
            papir.ignoresSafeArea()
            if let d = m.d {
                VStack(spacing: 0) {
                    topp(d)
                    ScrollView(showsIndicators: false) {
                        VStack(alignment: .leading, spacing: 12) {
                            if !d.bytt.isEmpty { merk(d.bytt) }
                            if let f = d.ferdig { ferdig(d, f) }
                            else if let r = d.res { resultat(d, r) }
                            else if d.styrer { dealer(d) }
                            else { venter(d) }
                        }
                        .padding(.horizontal, 16).padding(.top, 4).padding(.bottom, 24)
                    }
                }
            }
        }
        .foregroundColor(blekk)
    }

    // MARK: Toppen – tittel, chip, bom-prikkene og Stua/Mer
    private func topp(_ d: FtdData) -> some View {
        Topplinje(tittel: d.tittel, chip: d.chip, uthevet: d.jeg, enLinje: true, stua: d.stua, mer: d.mer, trykk: { m.trykk($0) }) {
            if d.bom >= 0 {
                HStack(spacing: 4) {
                    ForEach(0..<3, id: \.self) { j in
                        Circle().fill(j < d.bom ? oransje : Color.clear).overlay(Circle().stroke(blekk, lineWidth: 2)).frame(width: 12, height: 12)
                    }
                }.accessibilityLabel(d.bomTekst)
            }
        }
    }
    private func merk(_ t: String) -> some View {
        Text(t).font(.archivo(14, vekt: 800)).foregroundColor(morkBlekk).padding(.horizontal, 12).padding(.vertical, 9).frame(maxWidth: .infinity, alignment: .leading)
            .background(RoundedRectangle(cornerRadius: 10).fill(gul)).overlay(RoundedRectangle(cornerRadius: 10).stroke(morkBlekk, lineWidth: 2))
            .transition(.move(edge: .top).combined(with: .opacity))
    }
    private func visir(_ px: CGFloat) -> some View {
        Image(systemName: "eyeglasses").font(.system(size: px * 0.5, weight: .bold)).foregroundColor(morkBlekk)
            .frame(width: px, height: px).background(Circle().fill(mint)).overlay(Circle().stroke(morkBlekk, lineWidth: 2.5))
    }
    private func hode(_ png: String, _ px: CGFloat) -> some View { Figur(png, px) }

    // MARK: Kortet – spillkort med verdi og farge (baksiden når det ikke er ditt å se)
    private func spillkort(_ k: FtdKort?, bredde: CGFloat) -> some View {
        let h = bredde * 1.4
        return ZStack {
            RoundedRectangle(cornerRadius: bredde * 0.1).fill(morkBlekk).offset(x: 4, y: 4)
            if let k = k {
                RoundedRectangle(cornerRadius: bredde * 0.1).fill(Color.white)
                VStack(spacing: 0) {
                    HStack { Text(k.v).font(.archivo(bredde * 0.22, vekt: 900)); Spacer() }
                    Spacer()
                    Text(k.f).font(.system(size: bredde * 0.42))
                    Spacer()
                    HStack { Spacer(); Text(k.v).font(.archivo(bredde * 0.22, vekt: 900)).rotationEffect(.degrees(180)) }
                }
                .padding(bredde * 0.09).foregroundColor(k.rod ? kortRod : morkBlekk)
            } else {
                RoundedRectangle(cornerRadius: bredde * 0.1).fill(oransje)
                RoundedRectangle(cornerRadius: bredde * 0.06).stroke(lys.opacity(0.6), style: StrokeStyle(lineWidth: 2, dash: [5, 4])).padding(bredde * 0.1)
            }
            RoundedRectangle(cornerRadius: bredde * 0.1).stroke(morkBlekk, lineWidth: 3)
        }
        .frame(width: bredde, height: h)
    }

    // MARK: Dealeren – kortet, hintet, tastene A–K og hva treff/bom koster
    private func dealer(_ d: FtdData) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .center, spacing: 14) {
                spillkort(d.kort, bredde: 96).id(d.pos)
                    .transition(.asymmetric(insertion: .scale(scale: 0.92).combined(with: .opacity), removal: .opacity))
                VStack(alignment: .leading, spacing: 4) {
                    HStack(spacing: 5) { Image(systemName: "eye.slash").font(.system(size: 12, weight: .bold)); Text(d.bare).font(.archivo(12, vekt: 800)) }
                        .padding(.horizontal, 9).frame(height: 26).background(Capsule().fill(kortFarge)).overlay(Capsule().stroke(blekk, lineWidth: 1.5))
                    if !d.gjetterTittel.isEmpty {
                        Text(d.gjetterTittel).font(.archivo(20, vekt: 900)).padding(.top, 4)
                        Text(d.gjetterUnder).font(.archivo(14, vekt: 600)).opacity(0.75)
                    }
                }
                Spacer(minLength: 0)
            }
            if let h = d.hint {
                HStack(spacing: 12) {
                    Image(systemName: h.opp ? "arrow.up" : "arrow.down").font(.system(size: 22, weight: .black)).foregroundColor(morkBlekk)
                        .frame(width: 46, height: 46).background(Circle().fill(lys)).overlay(Circle().stroke(morkBlekk, lineWidth: 2.5))
                    VStack(alignment: .leading, spacing: 1) {
                        Text(h.over).font(.archivo(12, vekt: 800)).foregroundColor(morkBlekk).opacity(0.75)
                        (Text(h.ord).font(.archivo(22, vekt: 900)) + Text(h.enn).font(.archivo(16, vekt: 800))).foregroundColor(morkBlekk)
                    }
                    Spacer()
                }
                .padding(12).background(RoundedRectangle(cornerRadius: 14).fill(gul)).overlay(RoundedRectangle(cornerRadius: 14).stroke(morkBlekk, lineWidth: 3))
                .background(RoundedRectangle(cornerRadius: 14).fill(morkBlekk).offset(x: 4, y: 4))
                .transition(.scale(scale: 0.96).combined(with: .opacity))
            }
            if !d.etikettAndre.isEmpty { Text(d.etikettAndre).font(.archivo(13, vekt: 800)).opacity(0.7) }
            taster(d)
            HStack(spacing: 10) {
                if let t = d.infoTreff { info(t.n, t.tekst, mint) }
                if let b = d.infoBom { info(b.n.isEmpty ? "↕" : b.n, b.tekst, kortFarge) }
            }
            brett(d, stor: false)
        }
    }
    private func info(_ n: String, _ t: String, _ farge: Color) -> some View {
        HStack(spacing: 8) {
            Text(n).font(.archivo(n.count > 3 ? 15 : 24, vekt: 900)).foregroundColor(farge == mint ? morkBlekk : blekk).lineLimit(1).minimumScaleFactor(0.6)
            Text(t).font(.archivo(12, vekt: 700)).foregroundColor(farge == mint ? morkBlekk : blekk).opacity(0.85).fixedSize(horizontal: false, vertical: true)
        }
        .padding(.horizontal, 10).padding(.vertical, 8).frame(maxWidth: .infinity, alignment: .leading)
        .background(RoundedRectangle(cornerRadius: 10).fill(farge)).overlay(RoundedRectangle(cornerRadius: 10).stroke(blekk, lineWidth: 2))
    }
    private func taster(_ d: FtdData) -> some View {
        let kol = [GridItem(.flexible(), spacing: 8), GridItem(.flexible(), spacing: 8), GridItem(.flexible(), spacing: 8), GridItem(.flexible(), spacing: 8)]
        return VStack(spacing: 8) {
            LazyVGrid(columns: kol, spacing: 8) { ForEach(d.taster.filter { $0.id < 13 }) { t in tast(t) } }
            // Kongen er bred (to kolonner), som på nettsiden
            HStack(spacing: 8) { ForEach(d.taster.filter { $0.id == 13 }) { t in tast(t) }; Color.clear.frame(height: 1) }
        }
    }
    private func tast(_ t: FtdTast) -> some View {
        Button(action: { m.gjett(t.id) }) {
            Text(t.tekst).font(.archivo(22, vekt: 900)).strikethrough(t.streket, color: blekk)
                .foregroundColor(t.ute ? blekk.opacity(0.3) : morkBlekk)
                .frame(maxWidth: .infinity).frame(height: 58)
                .background(RoundedRectangle(cornerRadius: 12).fill(t.ute ? papir : t.mulig ? mint : kortFarge))
                .overlay(RoundedRectangle(cornerRadius: 12).stroke(t.ute ? blekk.opacity(0.25) : blekk, lineWidth: 2.5))
                .background(RoundedRectangle(cornerRadius: 12).fill(t.ute ? Color.clear : blekk).offset(x: 3, y: 3))
        }
        .buttonStyle(TastTrykk())
        .disabled(t.ute)
    }

    // MARK: De andre – hvem som deler og hva som ble sagt, tellebrettet stort
    private func venter(_ d: FtdData) -> some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(alignment: .top, spacing: 12) {
                visir(52)
                VStack(alignment: .leading, spacing: 3) {
                    Text(d.ventTittel).font(.archivo(22, vekt: 900))
                    Text(d.vent).font(.archivo(15, vekt: 600)).opacity(0.8).fixedSize(horizontal: false, vertical: true)
                }
            }
            .padding(14).frame(maxWidth: .infinity, alignment: .leading)
            .background(RoundedRectangle(cornerRadius: 16).fill(kortFarge)).overlay(RoundedRectangle(cornerRadius: 16).stroke(blekk, lineWidth: 2.5))
            brett(d, stor: true)
        }
    }

    // MARK: Avgjort – kortet snus for alle, slurkene smeller inn på det mørke panelet
    private func resultat(_ d: FtdData, _ r: FtdRes) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            VStack(spacing: 14) {
                if !r.gjettet.isEmpty {
                    HStack(spacing: 8) {
                        Text(r.gjettet).font(.archivo(12, vekt: 800)).opacity(0.7)
                        Text(r.g1).font(.archivo(18, vekt: 900)).strikethrough(true, color: lys)
                        Text(r.g).font(.archivo(18, vekt: 900))
                        Image(systemName: "arrow.right").font(.system(size: 13, weight: .bold))
                    }.foregroundColor(lys)
                }
                spillkort(r.kort, bredde: 120)
                    .rotation3DEffect(.degrees(snudd == r.nr ? 0 : 90), axis: (x: 0, y: 1, z: 0))
                    .onAppear { if roligere { snudd = r.nr } else { withAnimation(.spring(response: 0.5, dampingFraction: 0.8)) { snudd = r.nr } } }
                    .onChange(of: r.nr) { nr in snudd = 0; withAnimation(.spring(response: 0.5, dampingFraction: 0.8).delay(0.05)) { snudd = nr } }
                VStack(spacing: 2) {
                    Text(r.over).font(.archivo(12, vekt: 800)).opacity(0.8).multilineTextAlignment(.center)
                    Text("\(r.n)").font(.archivo(56, vekt: 900)).foregroundColor(r.treff ? mint : rosa)
                    if !r.under.isEmpty { Text(r.under).font(.archivo(18, vekt: 900)) }
                }
                .foregroundColor(lys)
            }
            .padding(.vertical, 18).frame(maxWidth: .infinity)
            .background(RoundedRectangle(cornerRadius: 18).fill(morkBlekk)).overlay(RoundedRectangle(cornerRadius: 18).stroke(r.treff ? mint : rosa, lineWidth: 3))
            if !d.videre.isEmpty { merk(d.videre) }
            if !d.neste.isEmpty { storKnapp(d.neste) { m.neste() } }
            else if !d.vent.isEmpty { Text(d.vent).font(.archivo(15, vekt: 600)).opacity(0.7).frame(maxWidth: .infinity) }
            brett(d, stor: false)
        }
    }
    private func storKnapp(_ t: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(t.uppercased()).font(.archivo(20, vekt: 900)).foregroundColor(morkBlekk)
                .frame(maxWidth: .infinity).frame(minHeight: 64)
                .background(RoundedRectangle(cornerRadius: 14).fill(gul)).overlay(RoundedRectangle(cornerRadius: 14).stroke(morkBlekk, lineWidth: 3))
                .background(RoundedRectangle(cornerRadius: 14).fill(morkBlekk).offset(x: 4, y: 4))
        }.buttonStyle(TastTrykk())
    }

    // MARK: Tellebrettet – tretten kolonner med fire plasser, oransje når verdien er ute
    private func brett(_ d: FtdData, stor: Bool) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            if stor { Text(d.brettTittel).font(.archivo(12, vekt: 800)).opacity(0.65) }
            HStack(spacing: stor ? 4 : 3) {
                ForEach(d.brett) { k in
                    VStack(spacing: stor ? 3 : 2) {
                        Text(k.v).font(.archivo(stor ? 13 : 10, vekt: 900)).foregroundColor(k.ute ? oransje : blekk).lineLimit(1).minimumScaleFactor(0.6)
                        ForEach(0..<4, id: \.self) { j in
                            RoundedRectangle(cornerRadius: 2)
                                .fill(j < k.n ? (k.ute ? oransje : blekk) : Color.clear)
                                .overlay(RoundedRectangle(cornerRadius: 2).stroke(blekk.opacity(j < k.n ? 1 : 0.35), lineWidth: 1))
                                .frame(height: stor ? 12 : 7)
                        }
                    }
                    .frame(maxWidth: .infinity)
                }
            }
            .padding(stor ? 12 : 8)
            .background(RoundedRectangle(cornerRadius: 12).fill(kortFarge)).overlay(RoundedRectangle(cornerRadius: 12).stroke(blekk, lineWidth: 2))
        }
        .accessibilityElement(children: .ignore).accessibilityLabel(d.brettTittel)
    }

    // MARK: Ferdig – kveldens dealer og lista
    private func ferdig(_ d: FtdData, _ f: FtdFerdig) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 12) {
                visir(56)
                VStack(alignment: .leading, spacing: 2) {
                    Text(f.etikett).font(.archivo(12, vekt: 800)).foregroundColor(morkBlekk).opacity(0.7)
                    Text(f.navn).font(.archivo(24, vekt: 900)).foregroundColor(morkBlekk)
                    Text(f.under).font(.archivo(13, vekt: 600)).foregroundColor(morkBlekk).opacity(0.8)
                }
                Spacer()
            }
            .padding(14).background(RoundedRectangle(cornerRadius: 16).fill(mint)).overlay(RoundedRectangle(cornerRadius: 16).stroke(morkBlekk, lineWidth: 3))
            .background(RoundedRectangle(cornerRadius: 16).fill(morkBlekk).offset(x: 4, y: 4))
            Text(f.listeTittel).font(.archivo(12, vekt: 800)).opacity(0.65).padding(.top, 4)
            VStack(spacing: 6) {
                ForEach(f.rader) { r in
                    HStack(spacing: 10) {
                        Text("\(r.plass)").font(.archivo(13, vekt: 900)).opacity(0.6).frame(width: 18)
                        hode(r.png, 36)
                        VStack(alignment: .leading, spacing: 0) {
                            Text(r.navn).font(.archivo(15, vekt: 900))
                            Text(r.delt).font(.archivo(12, vekt: 600)).opacity(0.65)
                        }
                        Spacer()
                        Text("\(r.n)").font(.archivo(22, vekt: 900)).foregroundColor(r.plass == 1 ? rust : blekk)
                    }
                    .padding(.horizontal, 12).padding(.vertical, 8)
                    .background(RoundedRectangle(cornerRadius: 12).fill(kortFarge)).overlay(RoundedRectangle(cornerRadius: 12).stroke(blekk, lineWidth: r.plass == 1 ? 2.5 : 1.5))
                }
            }
            BlokkListe(m: m.blokker).padding(.top, 6)
        }
    }
}

/// Tastene trykkes ned i skyggen (100 ms), som nettsidens `:active`
struct TastTrykk: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .offset(x: configuration.isPressed ? 3 : 0, y: configuration.isPressed ? 3 : 0)
            .animation(.easeOut(duration: 0.1), value: configuration.isPressed)
    }
}
