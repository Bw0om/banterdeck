import SwiftUI
import UIKit
import WebKit

/// Sofa-lekene på én telefon som native skjerm: kortet som leses høyt med 3–2–1, bomba i Kategorier som går rundt,
/// og kortet i Ring of Fire. Nettsiden under holder tilstanden, nedtellingen og bombas klokke (rom.js enData) –
/// denne tegner, og trykkene går til nettsidens knapper (en-tell, en-bombe-start, en-bombe-send, en-bom-neste, en-neste).
struct EnKat { let etikett: String, tekst: String }
struct EnBombe { let fase: String, start: Double, lengde: Double, paa: String, tittel: String, tekst: String, knapp: String, g: String }
struct EnKopp { let etikett: String, konger: Int, tekst: String }
struct EnRof { let v: String, s: String, rod: Bool, regel: String, tekst: String, em: String }
struct EnEe { let enten: String, a: String, eller: String, b: String }
struct EnLest { let k: String, t: String }
struct EnTell { let fase: String, tall: Int, knapp: String, si: String, regel: String }

struct EnData {
    let lek: String, pos: Int, runde: Int, ferdig: Bool, naa: Double, rundt: Bool, tittel: String, chip: String, gul: Bool
    let regel: String, kat: EnKat?, bombe: EnBombe?, kopp: EnKopp?, rof: EnRof?, ee: EnEe?, lest: EnLest?, tell: EnTell?, klar: Bool, neste: String
    let slutt: [[String: Any]], stua: String, mer: String
    init(_ d: [String: Any]) {
        func s(_ k: String) -> String { d[k] as? String ?? "" }
        func n(_ k: String) -> Double { (d[k] as? NSNumber)?.doubleValue ?? 0 }
        func b(_ k: String) -> Bool { d[k] as? Bool ?? false }
        lek = s("lek"); pos = Int(n("pos")); runde = Int(n("runde")); ferdig = b("ferdig"); naa = n("naa"); rundt = b("rundt"); tittel = s("tittel"); chip = s("chip"); gul = b("gul")
        regel = s("regel"); klar = b("klar"); neste = s("neste")
        if let x = d["kat"] as? [String: Any] { kat = EnKat(etikett: x["etikett"] as? String ?? "", tekst: x["tekst"] as? String ?? "") } else { kat = nil }
        if let x = d["bombe"] as? [String: Any] {
            bombe = EnBombe(fase: x["fase"] as? String ?? "klar", start: (x["start"] as? NSNumber)?.doubleValue ?? 0, lengde: (x["lengde"] as? NSNumber)?.doubleValue ?? 0, paa: x["paa"] as? String ?? "",
                            tittel: x["tittel"] as? String ?? "", tekst: x["tekst"] as? String ?? "", knapp: x["knapp"] as? String ?? "", g: x["g"] as? String ?? "en-bombe-start")
        } else { bombe = nil }
        if let x = d["kopp"] as? [String: Any] { kopp = EnKopp(etikett: x["etikett"] as? String ?? "", konger: (x["konger"] as? NSNumber)?.intValue ?? 0, tekst: x["tekst"] as? String ?? "") } else { kopp = nil }
        if let x = d["rof"] as? [String: Any] { rof = EnRof(v: x["v"] as? String ?? "", s: x["s"] as? String ?? "", rod: x["rod"] as? Bool ?? false, regel: x["regel"] as? String ?? "", tekst: x["tekst"] as? String ?? "", em: x["em"] as? String ?? "") } else { rof = nil }
        if let x = d["ee"] as? [String: Any] { ee = EnEe(enten: x["enten"] as? String ?? "", a: x["a"] as? String ?? "", eller: x["eller"] as? String ?? "", b: x["b"] as? String ?? "") } else { ee = nil }
        if let x = d["lest"] as? [String: Any] { lest = EnLest(k: x["k"] as? String ?? "", t: x["t"] as? String ?? "") } else { lest = nil }
        if let x = d["tell"] as? [String: Any] { tell = EnTell(fase: x["fase"] as? String ?? "klar", tall: (x["tall"] as? NSNumber)?.intValue ?? 3, knapp: x["knapp"] as? String ?? "", si: x["si"] as? String ?? "", regel: x["regel"] as? String ?? "") } else { tell = nil }
        slutt = d["slutt"] as? [[String: Any]] ?? []
        stua = s("stua").isEmpty ? "Stua" : s("stua"); mer = s("mer").isEmpty ? "Mer" : s("mer")
    }
}

final class EnModell: ObservableObject {
    @Published var d: EnData? = nil
    let blokker = KortModell()
    weak var nett: WKWebView? { didSet { blokker.nett = nett } }
    func sett(_ dict: [String: Any]) {
        let ny = EnData(dict)
        blokker.sett(["blokker": ny.slutt, "naa": dict["naa"] ?? 0])
        withAnimation(.spring(response: 0.42, dampingFraction: 0.8)) { d = ny }
    }
    func trykk(_ g: String, _ attrs: [String: String] = [:]) {
        UIImpactFeedbackGenerator(style: g == "en-tell" || g == "en-bombe-start" ? .medium : .light).impactOccurred()
        guard let data = try? JSONSerialization.data(withJSONObject: [g, attrs]), let json = String(data: data, encoding: .utf8) else { return }
        nett?.evaluateJavaScript("window.__mvLek && window.__mvLek.trykk.apply(null, \(json))", completionHandler: nil)
    }
}

struct SofaSkjerm: View {
    @ObservedObject var m: EnModell
    @Environment(\.colorScheme) private var modus
    @Environment(\.accessibilityReduceMotion) private var roligere
    @State private var puls = false
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
                            if d.ferdig { ferdig(d) }
                            else if let b = d.bombe, let kat = d.kat { kategorier(d, kat, b) }
                            else if let r = d.rof, let kopp = d.kopp { ring(d, r, kopp) }
                            else { leser(d) }
                        }
                        .padding(.horizontal, 16).padding(.top, 4).padding(.bottom, 24)
                    }
                }
            }
        }
        .foregroundColor(blekk)
    }

    private func topp(_ d: EnData) -> some View {
        HStack(spacing: 8) {
            VStack(alignment: .leading, spacing: 1) {
                Text(d.tittel).font(.archivo(12, vekt: 700)).opacity(0.65).lineLimit(1)
                Text(d.chip).font(.archivo(16, vekt: 900)).foregroundColor(d.gul ? rust : blekk).lineLimit(2)
            }
            Spacer()
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
    private func storKnapp(_ t: String, farge: Color? = nil, svak: Bool = false, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(t.uppercased()).font(.archivo(19, vekt: 900)).foregroundColor(morkBlekk).multilineTextAlignment(.center).padding(.horizontal, 10)
                .frame(maxWidth: .infinity).frame(minHeight: 64)
                .background(RoundedRectangle(cornerRadius: 14).fill(farge ?? gul)).overlay(RoundedRectangle(cornerRadius: 14).stroke(morkBlekk, lineWidth: 3))
                .background(RoundedRectangle(cornerRadius: 14).fill(morkBlekk).offset(x: 4, y: 4))
                .opacity(svak ? 0.55 : 1)
        }.buttonStyle(TastTrykk())
    }

    // MARK: Lese-lekene – kortet, 3–2–1, «Si det!» og neste kort
    private func leser(_ d: EnData) -> some View {
        VStack(alignment: .leading, spacing: 14) {
            Group {
                if let e = d.ee {
                    HStack(spacing: 10) {
                        side(e.enten, e.a, mint)
                        side(e.eller, e.b, rosa)
                    }
                } else if let l = d.lest {
                    VStack(alignment: .leading, spacing: 6) {
                        if !l.k.isEmpty { Text(l.k.uppercased()).font(.archivo(11, vekt: 900)).opacity(0.6) }
                        Text(l.t).font(.archivo(l.t.count > 90 ? 22 : 28, vekt: 900)).fixedSize(horizontal: false, vertical: true).lineSpacing(1)
                    }
                    .padding(18).frame(maxWidth: .infinity, alignment: .leading)
                    .background(RoundedRectangle(cornerRadius: 18).fill(kortFarge)).overlay(RoundedRectangle(cornerRadius: 18).stroke(blekk, lineWidth: 3))
                    .background(RoundedRectangle(cornerRadius: 18).fill(blekk).offset(x: 5, y: 5))
                }
            }
            .id("kort-\(d.runde)-\(d.pos)")
            .transition(.asymmetric(insertion: .move(edge: .trailing).combined(with: .opacity), removal: .move(edge: .leading).combined(with: .opacity)))
            ZStack {
                if let t = d.tell {
                    if t.fase == "klar" {
                        storKnapp(t.knapp, farge: kortFarge) { m.trykk("en-tell") }
                    } else if t.fase == "teller" {
                        Text("\(t.tall)").font(.archivo(120, vekt: 900)).foregroundColor(rust).frame(maxWidth: .infinity).frame(height: 150)
                            .id("tall-\(t.tall)")
                            .transition(.scale(scale: 1.6).combined(with: .opacity))
                    } else {
                        VStack(spacing: 6) {
                            Text(t.si.uppercased()).font(.archivo(56, vekt: 900)).foregroundColor(morkBlekk).lineLimit(1).minimumScaleFactor(0.5)
                            Text(t.regel).font(.archivo(14, vekt: 700)).foregroundColor(morkBlekk).opacity(0.85).multilineTextAlignment(.center).fixedSize(horizontal: false, vertical: true)
                        }
                        .padding(16).frame(maxWidth: .infinity)
                        .background(RoundedRectangle(cornerRadius: 16).fill(gul)).overlay(RoundedRectangle(cornerRadius: 16).stroke(morkBlekk, lineWidth: 3))
                        .transition(.scale(scale: 0.85).combined(with: .opacity))
                    }
                } else {
                    Text(d.regel).font(.archivo(15, vekt: 600)).opacity(0.75).frame(maxWidth: .infinity).multilineTextAlignment(.center)
                }
            }
            .animation(roligere ? nil : .spring(response: 0.35, dampingFraction: 0.7), value: d.tell?.fase)
            .animation(roligere ? nil : .spring(response: 0.3, dampingFraction: 0.6), value: d.tell?.tall)
            storKnapp(d.neste, svak: !d.klar) { m.trykk("en-neste") }
        }
    }
    private func side(_ etikett: String, _ tekst: String, _ farge: Color) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(etikett.uppercased()).font(.archivo(11, vekt: 900)).foregroundColor(morkBlekk).opacity(0.7)
            Text(tekst).font(.archivo(18, vekt: 900)).foregroundColor(morkBlekk).fixedSize(horizontal: false, vertical: true)
            Spacer(minLength: 0)
        }
        .padding(14).frame(maxWidth: .infinity, minHeight: 150, alignment: .topLeading)
        .background(RoundedRectangle(cornerRadius: 16).fill(farge)).overlay(RoundedRectangle(cornerRadius: 16).stroke(morkBlekk, lineWidth: 3))
        .background(RoundedRectangle(cornerRadius: 16).fill(morkBlekk).offset(x: 4, y: 4))
    }

    // MARK: Kategorier – telefonen er bomba
    private func kategorier(_ d: EnData, _ kat: EnKat, _ b: EnBombe) -> some View {
        let gaar = b.fase == "gaar", bom = b.fase == "bom"
        return VStack(alignment: .leading, spacing: 14) {
            VStack(alignment: .leading, spacing: 4) {
                Text(kat.etikett.uppercased()).font(.archivo(11, vekt: 900)).opacity(0.6)
                Text(kat.tekst).font(.archivo(26, vekt: 900)).fixedSize(horizontal: false, vertical: true)
            }
            .padding(16).frame(maxWidth: .infinity, alignment: .leading)
            .background(RoundedRectangle(cornerRadius: 16).fill(kortFarge)).overlay(RoundedRectangle(cornerRadius: 16).stroke(blekk, lineWidth: 3))
            .background(RoundedRectangle(cornerRadius: 16).fill(blekk).offset(x: 4, y: 4))
            VStack(spacing: 10) {
                if bom {
                    Text(b.tittel).font(.archivo(72, vekt: 900)).foregroundColor(lys).lineLimit(1).minimumScaleFactor(0.5)
                        .transition(.scale(scale: 2).combined(with: .opacity))
                    Text(b.tekst).font(.archivo(20, vekt: 900)).foregroundColor(gul)
                } else {
                    TimelineView(.periodic(from: .now, by: 0.08)) { tid in
                        let a = gaar && b.lengde > 0 ? min(1, (tid.date.timeIntervalSince1970 * 1000 - b.start) / b.lengde) : 0
                        let takt: Double = a < 0.5 ? 1.0 : a < 0.8 ? 0.6 : 0.32
                        let fase = gaar ? (tid.date.timeIntervalSince1970.truncatingRemainder(dividingBy: takt)) / takt : 0
                        Bombe(gnist: gaar, lunte: 1 - a, glod: fase < 0.3 ? 1 - fase / 0.3 : 0)
                            .frame(width: 190, height: 190)
                            .scaleEffect(gaar ? 1 + 0.05 * (1 - fase) : 1)
                    }
                    Text(b.tittel).font(.archivo(22, vekt: 900)).foregroundColor(gaar ? lys : morkBlekk)
                    Text(b.tekst).font(.archivo(14, vekt: 600)).foregroundColor(gaar ? lys : morkBlekk).opacity(0.85).multilineTextAlignment(.center).fixedSize(horizontal: false, vertical: true)
                }
            }
            .padding(18).frame(maxWidth: .infinity)
            .background(RoundedRectangle(cornerRadius: 18).fill(bom ? oransje : gaar ? morkBlekk : gul)).overlay(RoundedRectangle(cornerRadius: 18).stroke(morkBlekk, lineWidth: 3))
            .background(RoundedRectangle(cornerRadius: 18).fill(morkBlekk).offset(x: 5, y: 5))
            .animation(roligere ? nil : .spring(response: 0.4, dampingFraction: 0.7), value: b.fase)
            storKnapp(b.knapp, farge: bom ? kortFarge : gaar ? mint : gul) { m.trykk(b.g, b.g == "en-bom-neste" ? ["paa": b.paa] : [:]) }
        }
    }

    // MARK: Ring of Fire – kongekoppen og kortet du trekker selv
    private func ring(_ d: EnData, _ r: EnRof, _ kopp: EnKopp) -> some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(spacing: 10) {
                Text(kopp.etikett).font(.archivo(13, vekt: 800)).opacity(0.7)
                HStack(spacing: 5) {
                    ForEach(0..<4, id: \.self) { i in Circle().fill(i < kopp.konger ? oransje : Color.clear).overlay(Circle().stroke(blekk, lineWidth: 2)).frame(width: 14, height: 14) }
                }
                Spacer()
            }.accessibilityElement(children: .ignore).accessibilityLabel(kopp.tekst)
            Button(action: { m.trykk("en-neste") }) {
                VStack(alignment: .leading, spacing: 12) {
                    HStack(alignment: .firstTextBaseline, spacing: 4) {
                        Text(r.v).font(.archivo(40, vekt: 900)); Text(r.s).font(.system(size: 30))
                        Spacer()
                    }.foregroundColor(r.rod ? kortRod : morkBlekk)
                    VStack(alignment: .leading, spacing: 6) {
                        Text(r.regel).font(.archivo(28, vekt: 900)).foregroundColor(morkBlekk).fixedSize(horizontal: false, vertical: true)
                        Text(r.tekst).font(.archivo(16, vekt: 600)).foregroundColor(morkBlekk).opacity(0.85).fixedSize(horizontal: false, vertical: true)
                    }
                    Spacer(minLength: 20)
                    Text(r.em).font(.archivo(13, vekt: 700)).foregroundColor(morkBlekk).opacity(0.7).fixedSize(horizontal: false, vertical: true)
                }
                .padding(20).frame(maxWidth: .infinity, minHeight: 360, alignment: .topLeading)
                .background(RoundedRectangle(cornerRadius: 20).fill(Color.white)).overlay(RoundedRectangle(cornerRadius: 20).stroke(morkBlekk, lineWidth: 3.5))
                .background(RoundedRectangle(cornerRadius: 20).fill(morkBlekk).offset(x: 5, y: 5))
            }
            .buttonStyle(TastTrykk())
            .id("rof-\(d.runde)-\(d.pos)")
            .transition(.asymmetric(insertion: .scale(scale: 0.92).combined(with: .opacity), removal: .opacity))
        }
    }

    private func ferdig(_ d: EnData) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            if !d.regel.isEmpty { Text(d.regel).font(.archivo(17, vekt: 800)).fixedSize(horizontal: false, vertical: true) }
            BlokkListe(m: m.blokker).padding(.top, 6)
        }
    }
}

/// Bomba med lunte og gnist, som nettsidens `.en-bombe`
struct Bombe: View {
    let gnist: Bool, lunte: Double, glod: Double
    private let morkBlekk = Color(red: 0.086, green: 0.071, blue: 0.059)
    private let lys = Color(red: 1, green: 0.973, blue: 0.933)
    private let gul = Color(red: 1, green: 0.824, blue: 0.247)
    private let oransje = Color(red: 1, green: 0.357, blue: 0.122)
    var body: some View {
        GeometryReader { g in
            let w = g.size.width, h = g.size.height
            ZStack {
                // Lunta: forkortes etter hvor langt bomba er kommet
                Path { p in
                    p.move(to: CGPoint(x: w * 0.61, y: h * 0.25))
                    p.addCurve(to: CGPoint(x: w * 0.84, y: h * 0.11), control1: CGPoint(x: w * 0.67, y: h * 0.14), control2: CGPoint(x: w * 0.76, y: h * 0.1))
                }
                .trimmedPath(from: 0, to: CGFloat(max(0.05, lunte)))
                .stroke(morkBlekk, style: StrokeStyle(lineWidth: 5, lineCap: .round))
                RoundedRectangle(cornerRadius: 6).fill(morkBlekk).frame(width: w * 0.16, height: h * 0.12).rotationEffect(.degrees(30)).position(x: w * 0.58, y: h * 0.27)
                Circle().fill(Color(red: 0.16, green: 0.15, blue: 0.17)).frame(width: w * 0.67, height: w * 0.67).position(x: w * 0.46, y: h * 0.59)
                Circle().stroke(morkBlekk, lineWidth: 4).frame(width: w * 0.67, height: w * 0.67).position(x: w * 0.46, y: h * 0.59)
                Path { p in
                    p.move(to: CGPoint(x: w * 0.28, y: h * 0.47))
                    p.addQuadCurve(to: CGPoint(x: w * 0.48, y: h * 0.33), control: CGPoint(x: w * 0.33, y: h * 0.34))
                }.stroke(lys.opacity(0.7), style: StrokeStyle(lineWidth: 4, lineCap: .round))
                if gnist {
                    ZStack {
                        Circle().fill(gul).frame(width: 20 + 10 * glod, height: 20 + 10 * glod)
                        Circle().fill(oransje).frame(width: 10 + 6 * glod, height: 10 + 6 * glod)
                        ForEach(0..<4, id: \.self) { i in
                            Capsule().fill(gul).frame(width: 3, height: 10 + 8 * glod).offset(y: -(16 + 8 * glod)).rotationEffect(.degrees(Double(i) * 90 + 45 * glod))
                        }
                    }
                    .position(x: w * (0.61 + 0.23 * max(0.05, lunte)), y: h * (0.25 - 0.14 * max(0.05, lunte)))
                }
            }
        }
    }
}
