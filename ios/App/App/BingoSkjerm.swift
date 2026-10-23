import SwiftUI
import UIKit
import WebKit

/// Drikke-bingo som native skjerm: brettet med 16 ruter, en klatt lander der du trykker, fire på rad tegner en strek,
/// fullt brett er BINGO. Nettsiden under holder tilstanden (rom.js bgData) – denne tegner, og trykkene går tilbake dit.
struct BgRute: Identifiable { let id: Int; let tittel: String; let under: String; let merket: Bool }
struct BgLinje: Identifiable { let id: Int; let a: Int; let z: Int }

struct BgData {
    let ferdig: Bool, tittel: String, chip: String, naa: Double
    let ruter: [BgRute], linjer: [BgLinje], rekkeSiden: Double, rekke: String, rekkeUnder: String
    let jegBingo: Bool, domRett: Bool, domTekst: String, bytt: String, spotify: String, spotifyTekst: String
    let slutt: [[String: Any]], stua: String, mer: String

    init(_ d: [String: Any]) {
        func s(_ k: String) -> String { d[k] as? String ?? "" }
        ferdig = d["ferdig"] as? Bool ?? false; tittel = s("tittel"); chip = s("chip"); naa = (d["naa"] as? NSNumber)?.doubleValue ?? 0
        ruter = (d["ruter"] as? [[String: Any]] ?? []).enumerated().map { i, r in BgRute(id: i, tittel: r["tittel"] as? String ?? "", under: r["under"] as? String ?? "", merket: r["merket"] as? Bool ?? false) }
        linjer = (d["linjer"] as? [[String: Any]] ?? []).enumerated().map { i, l in BgLinje(id: (l["k"] as? NSNumber)?.intValue ?? i, a: (l["a"] as? NSNumber)?.intValue ?? 0, z: (l["z"] as? NSNumber)?.intValue ?? 0) }
        rekkeSiden = (d["rekkeSiden"] as? NSNumber)?.doubleValue ?? 99999; rekke = s("rekke"); rekkeUnder = s("rekkeUnder")
        jegBingo = d["jegBingo"] as? Bool ?? false; domRett = d["domRett"] as? Bool ?? false; domTekst = s("domTekst"); bytt = s("bytt"); spotify = s("spotify"); spotifyTekst = s("spotifyTekst")
        slutt = d["slutt"] as? [[String: Any]] ?? []; stua = d["stua"] as? String ?? "Stua"; mer = d["mer"] as? String ?? "Mer"
    }
}

final class BgModell: ObservableObject {
    @Published var d: BgData? = nil
    let blokker = KortModell()
    private(set) var avvik: Double = 0
    weak var nett: WKWebView? { didSet { blokker.nett = nett } }
    func sett(_ dict: [String: Any]) {
        let ny = BgData(dict)
        if ny.naa > 0 { avvik = ny.naa - Date().timeIntervalSince1970 * 1000 }
        blokker.sett(["blokker": ny.slutt, "naa": dict["naa"] ?? 0])
        d = ny
    }
    /// Millisekunder siden meldingen fra nettsiden kom (servertid)
    func siden(_ d: BgData) -> Double { d.naa > 0 ? Date().timeIntervalSince1970 * 1000 + avvik - d.naa : 0 }
    func trykk(_ g: String, _ attrs: [String: String] = [:]) {
        UIImpactFeedbackGenerator(style: .light).impactOccurred()
        guard let data = try? JSONSerialization.data(withJSONObject: [g, attrs]), let json = String(data: data, encoding: .utf8) else { return }
        nett?.evaluateJavaScript("window.__mvLek && window.__mvLek.trykk.apply(null, \(json))", completionHandler: nil)
    }
}

/// Bingoklatten: en ujevn flekk
struct Klatt: Shape {
    func path(in r: CGRect) -> Path {
        var p = Path()
        let c = CGPoint(x: r.midX, y: r.midY), R = min(r.width, r.height) / 2
        let n = 9
        for i in 0..<n {
            let a = Double(i) / Double(n) * .pi * 2, rad = R * (0.78 + 0.22 * (i % 2 == 0 ? 1 : 0.6))
            let pt = CGPoint(x: c.x + CGFloat(cos(a)) * rad, y: c.y + CGFloat(sin(a)) * rad)
            if i == 0 { p.move(to: pt) } else { p.addQuadCurve(to: pt, control: CGPoint(x: c.x + CGFloat(cos(a - 0.35)) * R * 1.05, y: c.y + CGFloat(sin(a - 0.35)) * R * 1.05)) }
        }
        p.closeSubpath()
        return p
    }
}

struct BingoSkjerm: View {
    @ObservedObject var m: BgModell
    @Environment(\.colorScheme) private var modus
    private var papir: Color { modus == .dark ? Color(red: 0.11, green: 0.106, blue: 0.122) : Color(red: 1, green: 0.973, blue: 0.933) }
    private var kort: Color { modus == .dark ? Color(red: 0.173, green: 0.169, blue: 0.188) : .white }
    private var blekk: Color { modus == .dark ? Color(red: 1, green: 0.973, blue: 0.933) : Color(red: 0.086, green: 0.071, blue: 0.059) }
    private let gul = Color(red: 1, green: 0.824, blue: 0.247)
    private let oransje = Color(red: 1, green: 0.357, blue: 0.122)
    private let rust = Color(red: 0.776, green: 0.235, blue: 0.067)
    private let mint = Color(red: 0.388, green: 0.886, blue: 0.659)
    private let rosa = Color(red: 1, green: 0.612, blue: 0.761)
    private let morkBlekk = Color(red: 0.086, green: 0.071, blue: 0.059)
    private let tusj = Color(red: 0.55, green: 0.2, blue: 0.75)

    var body: some View {
        ZStack {
            papir.ignoresSafeArea()
            if let d = m.d {
                VStack(spacing: 0) {
                    topp(d)
                    VStack(alignment: .leading, spacing: 12) {
                            brett(d)
                            // «Rekke!» i fire sekunder – og den går bort av seg selv, ikke først når neste melding kommer
                            if !d.ferdig && d.rekkeSiden < 4000 {
                                TimelineView(.periodic(from: .now, by: 0.5)) { _ in
                                    if d.rekkeSiden + m.siden(d) < 4000 { rekkeLapp(d) }
                                }
                            }
                            if d.ferdig {
                                dom(d)
                                BlokkListe(m: m.blokker)
                            } else if !d.bytt.isEmpty {
                                Button(action: { m.trykk("bg-nytt") }) {
                                    Text(d.bytt).font(.archivo(14, vekt: 800)).padding(.horizontal, 14).frame(height: 40)
                                        .background(Capsule().fill(kort)).overlay(Capsule().stroke(blekk, lineWidth: 2))
                                }.buttonStyle(.plain)
                            }
                            Spacer(minLength: 0)
                        }.padding(.horizontal, 16).padding(.bottom, 12)
                }
            }
        }
        .foregroundColor(blekk)
    }

    private func topp(_ d: BgData) -> some View {
        HStack(spacing: 8) {
            VStack(alignment: .leading, spacing: 1) {
                Text(d.tittel).font(.archivo(12, vekt: 700)).opacity(0.65)
                Text(d.chip).font(.archivo(16, vekt: 900)).lineLimit(2)
            }
            Spacer()
            if !d.spotify.isEmpty, let u = URL(string: d.spotify) {
                Button(action: { UIApplication.shared.open(u) }) {
                    Image(systemName: "music.note.list").font(.system(size: 14, weight: .bold)).frame(width: 34, height: 34)
                        .background(Circle().fill(mint)).overlay(Circle().stroke(morkBlekk, lineWidth: 2)).foregroundColor(morkBlekk)
                }.buttonStyle(.plain)
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
                .background(Capsule().fill(kort)).overlay(Capsule().stroke(blekk, lineWidth: 2))
        }.buttonStyle(.plain)
    }

    // MARK: Brettet – 4 × 4 ruter, klatter, streker og Bingo!
    private func brett(_ d: BgData) -> some View {
        GeometryReader { g in
            let w = g.size.width, celle = (w - 3 * 6) / 4
            ZStack(alignment: .topLeading) {
                LazyVGrid(columns: Array(repeating: GridItem(.fixed(celle), spacing: 6), count: 4), spacing: 6) {
                    ForEach(d.ruter) { r in
                        Button(action: { m.trykk("merk", ["i": String(r.id)]) }) {
                            ZStack {
                                RoundedRectangle(cornerRadius: 8).fill(kort)
                                RoundedRectangle(cornerRadius: 8).stroke(blekk, lineWidth: 2)
                                if r.merket {
                                    Klatt().fill(tusj.opacity(0.8)).frame(width: celle * 0.86, height: celle * 0.86)
                                        .rotationEffect(.degrees(Double((r.id * 47) % 50 - 25)))
                                        .transition(.scale(scale: 0.3).combined(with: .opacity))
                                }
                                VStack(spacing: 2) {
                                    Text(r.tittel).font(.archivo(r.tittel.count > 18 ? 9 : 11, vekt: 900)).multilineTextAlignment(.center).lineLimit(4).minimumScaleFactor(0.6)
                                    Text(r.under).font(.archivo(9, vekt: 600)).opacity(0.7).lineLimit(2).minimumScaleFactor(0.6)
                                }.padding(5).foregroundColor(r.merket ? .white : blekk)
                            }
                            .frame(width: celle, height: celle)
                            .animation(.spring(response: 0.35, dampingFraction: 0.55), value: r.merket)
                        }.buttonStyle(.plain).disabled(d.ferdig)
                    }
                }
                // strekene for fulle rekker
                if !(d.ferdig && d.jegBingo) {
                    ForEach(d.linjer) { l in
                        let steg = celle + 6
                        let ax = CGFloat(l.a % 4) * steg + celle / 2, ay = CGFloat(l.a / 4) * steg + celle / 2
                        let zx = CGFloat(l.z % 4) * steg + celle / 2, zy = CGFloat(l.z / 4) * steg + celle / 2
                        Path { p in p.move(to: CGPoint(x: ax, y: ay)); p.addLine(to: CGPoint(x: zx, y: zy)) }
                            .stroke(oransje, style: StrokeStyle(lineWidth: 7, lineCap: .round))
                            .transition(.opacity)
                    }
                }
                if d.ferdig && d.jegBingo {
                    Text("Bingo!").font(.archivo(56, vekt: 900)).foregroundColor(gul).shadow(color: morkBlekk, radius: 0, x: 4, y: 4)
                        .rotationEffect(.degrees(-8)).frame(width: w, height: w)
                }
            }
        }
        .aspectRatio(1, contentMode: .fit)
    }

    private func rekkeLapp(_ d: BgData) -> some View {
        HStack(spacing: 10) {
            Text(d.rekke.uppercased()).font(.archivo(18, vekt: 900))
            Text(d.rekkeUnder).font(.archivo(14, vekt: 700))
        }
        .padding(.horizontal, 14).padding(.vertical, 10).foregroundColor(morkBlekk)
        .background(RoundedRectangle(cornerRadius: 10).fill(gul)).overlay(RoundedRectangle(cornerRadius: 10).stroke(morkBlekk, lineWidth: 2.5))
        .background(RoundedRectangle(cornerRadius: 10).fill(morkBlekk).offset(x: 3, y: 3))
        .transition(.move(edge: .bottom).combined(with: .opacity))
    }

    private func dom(_ d: BgData) -> some View {
        Text(d.domTekst).font(.archivo(20, vekt: 900)).multilineTextAlignment(.center).frame(maxWidth: .infinity).padding(16)
            .foregroundColor(morkBlekk)
            .background(RoundedRectangle(cornerRadius: 14).fill(d.domRett ? mint : oransje))
            .overlay(RoundedRectangle(cornerRadius: 14).stroke(morkBlekk, lineWidth: 3))
            .background(RoundedRectangle(cornerRadius: 14).fill(morkBlekk).offset(x: 4, y: 4))
    }
}
