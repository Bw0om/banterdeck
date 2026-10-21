import SwiftUI
import UIKit
import WebKit

/// Gris som native skjerm: fjøset med folket og GRIS-bokstavene, halmstrået som brenner ned, kortene dine
/// (trykk på det du sender til venstre) og trynet du trykker på når noen har fire like. Nettsiden under holder
/// tilstanden og klokka (rom.js grData) – denne tegner, og trykkene går tilbake til nettsidens egne knapper.
struct GrKort: Identifiable { let id: Int; let v: String; let f: String; let rod: Bool }
struct GrFolk: Identifiable { let id: String; let navn: String; let png: String; let n: Int; let klar: Bool; let status: String; let taper: Bool }

struct GrData {
    let fase: String, tittel: String, chip: String, varsel: Bool, naa: Double
    let ord: String, folk: [GrFolk]
    let halm: Bool, halmLengde: Double, halmVed: Double, nese: Bool
    let hand: [GrKort]?, handTekst: String, merke: String, mittValg: Int, kanSende: Bool, harFire: Bool, tatt: Bool
    let tryneTekst: String, tryneHjelp: String, pust: Bool, paa: Bool
    let gris: String, grisTekst: String, slutt: [[String: Any]], stua: String, mer: String

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
        gris = s("gris"); grisTekst = s("grisTekst"); slutt = d["slutt"] as? [[String: Any]] ?? []; stua = d["stua"] as? String ?? "Stua"; mer = d["mer"] as? String ?? "Mer"
    }
}

final class GrModell: ObservableObject {
    @Published var d: GrData? = nil
    let blokker = KortModell()
    private(set) var avvik: Double = 0
    weak var nett: WKWebView? { didSet { blokker.nett = nett } }
    private var bilder: [String: UIImage] = [:]
    func sett(_ dict: [String: Any]) {
        let ny = GrData(dict)
        if ny.naa > 0 { avvik = ny.naa - Date().timeIntervalSince1970 * 1000 }
        blokker.sett(["blokker": ny.slutt, "naa": dict["naa"] ?? 0])
        d = ny
    }
    func naaMs() -> Double { Date().timeIntervalSince1970 * 1000 + avvik }
    func bilde(_ b64: String) -> UIImage? {
        if b64.isEmpty { return nil }
        if let b = bilder[b64] { return b }
        guard let data = Data(base64Encoded: b64), let img = UIImage(data: data, scale: 2) else { return nil }
        if bilder.count > 60 { bilder.removeAll() }
        bilder[b64] = img
        return img
    }
    func trykk(_ g: String, _ attrs: [String: String] = [:]) {
        UIImpactFeedbackGenerator(style: .light).impactOccurred()
        guard let data = try? JSONSerialization.data(withJSONObject: [g, attrs]), let json = String(data: data, encoding: .utf8) else { return }
        nett?.evaluateJavaScript("window.__mvLek && window.__mvLek.trykk.apply(null, \(json))", completionHandler: nil)
    }
}

struct GrisSkjerm: View {
    @ObservedObject var m: GrModell
    @Environment(\.colorScheme) private var modus
    private var papir: Color { modus == .dark ? Color(red: 0.11, green: 0.106, blue: 0.122) : Color(red: 1, green: 0.973, blue: 0.933) }
    private var kort: Color { modus == .dark ? Color.white.opacity(0.07) : .white }
    private var blekk: Color { modus == .dark ? Color(red: 1, green: 0.973, blue: 0.933) : Color(red: 0.086, green: 0.071, blue: 0.059) }
    private let gul = Color(red: 1, green: 0.824, blue: 0.247)
    private let oransje = Color(red: 1, green: 0.357, blue: 0.122)
    private let rust = Color(red: 0.776, green: 0.235, blue: 0.067)
    private let mint = Color(red: 0.388, green: 0.886, blue: 0.659)
    private let rosa = Color(red: 1, green: 0.612, blue: 0.761)
    private let morkBlekk = Color(red: 0.086, green: 0.071, blue: 0.059)
    private let lys = Color(red: 1, green: 0.973, blue: 0.933)
    private let kortRod = Color(red: 0.843, green: 0.149, blue: 0.239)
    private let halmFarge = Color(red: 0.965, green: 0.906, blue: 0.722)
    private let halmMork = Color(red: 0.698, green: 0.47, blue: 0.157)

    var body: some View {
        ZStack {
            papir.ignoresSafeArea()
            if let d = m.d {
                VStack(spacing: 0) {
                    topp(d)
                    ScrollView {
                        VStack(alignment: .leading, spacing: 12) {
                            if d.fase == "slutt" {
                                grisLapp(d)
                                fjos(d)
                                BlokkListe(m: m.blokker)
                            } else {
                                fjos(d)
                            }
                        }.padding(.horizontal, 16).padding(.bottom, 24)
                    }
                }
            }
        }
        .foregroundColor(blekk)
    }

    private func topp(_ d: GrData) -> some View {
        HStack(spacing: 8) {
            VStack(alignment: .leading, spacing: 1) {
                Text(d.tittel).font(.archivo(12, vekt: 700)).opacity(0.65)
                Text(d.chip).font(.archivo(16, vekt: 900)).foregroundColor(d.varsel ? rust : blekk).lineLimit(2)
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
                .background(Capsule().fill(kort)).overlay(Capsule().stroke(blekk, lineWidth: 2))
        }.buttonStyle(.plain)
    }

    private func hode(_ png: String) -> some View {
        Group {
            if let img = m.bilde(png) { Image(uiImage: img).resizable().aspectRatio(contentMode: .fit) }
            else { Circle().fill(gul).overlay(Circle().stroke(morkBlekk, lineWidth: 2)) }
        }
    }

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
                    Button(action: { m.trykk("velg", ["i": String(k.id)]) }) {
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
            Button(action: { m.trykk("nese") }) {
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
