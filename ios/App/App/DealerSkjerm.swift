import SwiftUI
import UIKit
import WebKit

/// Fuck the Dealer som native skjerm: dealeren ser kortet og tastene A–K, de andre ser hvem som deler og tellebrettet,
/// avgjørelsen snus for alle på et mørkt panel. Nettsiden under holder tilstanden (rom.js ftdData) – denne tegner,
/// og trykkene går til nettsidens egne knapper (ftd-gjett, ftd-neste, runde).
struct FtdKort { let v: String, f: String, rod: Bool }
struct FtdTast: Identifiable { let id: Int; let tekst: String; let ute: Bool; let mulig: Bool; let streket: Bool }
struct FtdKolonne: Identifiable { let id: Int; let v: String; let n: Int; let ute: Bool }
struct FtdRad: Identifiable { let id: String; let navn: String; let png: String; let plass: Int; let delt: String; let n: Int }
struct FtdRes { let treff: Bool, nr: Int, kort: FtdKort?, n: Int, over: String, under: String, gjettet: String, g1: String, g: String }
struct FtdHint { let opp: Bool, over: String, ord: String, enn: String }
struct FtdInfo { let n: String, tekst: String }
struct FtdFerdig { let etikett: String, navn: String, under: String, listeTittel: String, rader: [FtdRad] }

struct FtdData {
    let fase: String, jeg: Bool, styrer: Bool, pos: Int, n: Int, runde: Int, naa: Double
    let tittel: String, chip: String, bom: Int, bomTekst: String, brett: [FtdKolonne], brettTittel: String, bytt: String
    let kort: FtdKort?, taster: [FtdTast], bare: String, gjetterTittel: String, gjetterUnder: String, hint: FtdHint?, etikettAndre: String
    let infoTreff: FtdInfo?, infoBom: FtdInfo?, res: FtdRes?, videre: String, neste: String, vent: String, ventTittel: String
    let ferdig: FtdFerdig?, slutt: [[String: Any]], stua: String, mer: String

    static func kort(_ k: [String: Any]?) -> FtdKort? {
        guard let k = k else { return nil }
        return FtdKort(v: k["v"] as? String ?? "", f: k["f"] as? String ?? "", rod: k["rod"] as? Bool ?? false)
    }
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
        slutt = d["slutt"] as? [[String: Any]] ?? []
        stua = s("stua").isEmpty ? "Stua" : s("stua"); mer = s("mer").isEmpty ? "Mer" : s("mer")
    }
}

final class FtdModell: ObservableObject {
    @Published var d: FtdData? = nil
    let blokker = KortModell()
    weak var nett: WKWebView? { didSet { blokker.nett = nett } }
    private var bilder: [String: UIImage] = [:]
    func sett(_ dict: [String: Any]) {
        let ny = FtdData(dict)
        blokker.sett(["blokker": ny.slutt, "naa": dict["naa"] ?? 0])
        withAnimation(.spring(response: 0.42, dampingFraction: 0.8)) { d = ny }
    }
    func bilde(_ b64: String) -> UIImage? {
        if b64.isEmpty { return nil }
        if let b = bilder[b64] { return b }
        guard let data = Data(base64Encoded: b64), let img = UIImage(data: data, scale: 2) else { return nil }
        if bilder.count > 80 { bilder.removeAll() }
        bilder[b64] = img
        return img
    }
    func trykk(_ g: String, _ attrs: [String: String] = [:]) {
        UIImpactFeedbackGenerator(style: g == "ftd-gjett" ? .medium : .light).impactOccurred()
        guard let data = try? JSONSerialization.data(withJSONObject: [g, attrs]), let json = String(data: data, encoding: .utf8) else { return }
        nett?.evaluateJavaScript("window.__mvLek && window.__mvLek.trykk.apply(null, \(json))", completionHandler: nil)
    }
}

struct DealerSkjerm: View {
    @ObservedObject var m: FtdModell
    @Environment(\.colorScheme) private var modus
    @Environment(\.accessibilityReduceMotion) private var roligere
    @State private var snudd = 0
    private var papir: Color { modus == .dark ? Color(red: 0.11, green: 0.106, blue: 0.122) : Color(red: 1, green: 0.973, blue: 0.933) }
    private var blekk: Color { modus == .dark ? Color(red: 1, green: 0.973, blue: 0.933) : Color(red: 0.086, green: 0.071, blue: 0.059) }
    private var kortFarge: Color { modus == .dark ? Color(red: 0.173, green: 0.169, blue: 0.188) : .white }
    private let gul = Color(red: 1, green: 0.824, blue: 0.247)
    private let oransje = Color(red: 1, green: 0.357, blue: 0.122)
    private let rust = Color(red: 0.722, green: 0.22, blue: 0.039)
    private let mint = Color(red: 0.388, green: 0.886, blue: 0.659)
    private let rosa = Color(red: 1, green: 0.612, blue: 0.761)
    private let morkBlekk = Color(red: 0.086, green: 0.071, blue: 0.059)
    private let lys = Color(red: 1, green: 0.973, blue: 0.933)
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
        HStack(spacing: 8) {
            VStack(alignment: .leading, spacing: 1) {
                Text(d.tittel).font(.archivo(12, vekt: 700)).opacity(0.65).lineLimit(1)
                Text(d.chip).font(.archivo(16, vekt: 900)).foregroundColor(d.jeg ? rust : blekk).lineLimit(2)
            }
            Spacer()
            if d.bom >= 0 {
                HStack(spacing: 4) {
                    ForEach(0..<3, id: \.self) { j in
                        Circle().fill(j < d.bom ? oransje : Color.clear).overlay(Circle().stroke(blekk, lineWidth: 2)).frame(width: 12, height: 12)
                    }
                }.accessibilityLabel(d.bomTekst)
            }
            liten(d.stua, "sofa.fill") { m.trykk("stua-ark") }
            liten(d.mer, "ellipsis") { m.trykk("mer-ark") }
        }
        .padding(.horizontal, 16).padding(.top, 6).padding(.bottom, 8)
    }
    private func liten(_ t: String, _ sym: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: 5) { Image(systemName: sym).font(.system(size: 13, weight: .bold)); Text(t).font(.archivo(13, vekt: 800)) }
                .padding(.horizontal, 11).frame(height: 34)
                .background(Capsule().fill(kortFarge)).overlay(Capsule().stroke(blekk, lineWidth: 2))
        }.buttonStyle(.plain)
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
    private func hode(_ png: String, _ px: CGFloat) -> some View {
        Group {
            if let img = m.bilde(png) { Image(uiImage: img).resizable().aspectRatio(contentMode: .fit) }
            else { Circle().fill(gul).overlay(Circle().stroke(morkBlekk, lineWidth: 2)).padding(2) }
        }.frame(width: px, height: px)
    }

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
        Button(action: { m.trykk("ftd-gjett", ["v": String(t.id)]) }) {
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
            if !d.neste.isEmpty { storKnapp(d.neste) { m.trykk("ftd-neste") } }
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
