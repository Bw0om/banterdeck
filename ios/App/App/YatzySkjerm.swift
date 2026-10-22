import SwiftUI
import UIKit
import WebKit

/// Drikke-Yatzy som native skjerm: fem terninger på grønn filt, begeret som rister, holdte terninger på kanten,
/// lappen med straffen og den kjente blokka. Nettsiden under holder tilstanden og lyden (rom.js yzData) –
/// denne skjermen tegner, og trykkene går tilbake til nettsidens egne knapper (window.__mvLek.trykk).
struct YzTerning: Identifiable { let id: Int; let v: Int; let hold: Bool; let ring: Bool }
struct YzCelle { let tekst: String; let mulig: String; let aktiv: Bool; let skriv: Bool; let f: String }
struct YzRad: Identifiable { let id: String; let navn: String; let stil: String; let celler: [YzCelle] }

struct YzData {
    let ferdig: Bool, tittel: String, chip: String, minTur: Bool, jeg: Bool, kast: Int, nr: Int, naa: Double
    let terninger: [YzTerning], kanKaste: Bool, kanHolde: Bool, beger: String, holdt: String
    let yatzy: Bool, lapp: String, lappStil: String, stryk: String
    let hode: [String], aktivKol: Int, rader: [YzRad]
    let vinner: String, vinnerTekst: String, taper: String
    let slutt: [[String: Any]], stua: String, mer: String

    init(_ d: [String: Any]) {
        func s(_ k: String) -> String { d[k] as? String ?? "" }
        func b(_ k: String) -> Bool { d[k] as? Bool ?? false }
        func i(_ k: String) -> Int { (d[k] as? NSNumber)?.intValue ?? 0 }
        ferdig = b("ferdig"); tittel = s("tittel"); chip = s("chip"); minTur = b("minTur"); jeg = b("jeg"); kast = i("kast"); nr = i("nr")
        naa = (d["naa"] as? NSNumber)?.doubleValue ?? 0
        terninger = (d["terninger"] as? [[String: Any]] ?? []).enumerated().map { n, t in
            YzTerning(id: n, v: (t["v"] as? NSNumber)?.intValue ?? 1, hold: t["hold"] as? Bool ?? false, ring: t["ring"] as? Bool ?? false)
        }
        kanKaste = b("kanKaste"); kanHolde = b("kanHolde"); beger = s("beger"); holdt = s("holdt")
        yatzy = b("yatzy"); lapp = s("lapp"); lappStil = s("lappStil"); stryk = s("stryk")
        let bl = d["blokk"] as? [String: Any] ?? [:]
        hode = bl["hode"] as? [String] ?? []; aktivKol = (bl["aktiv"] as? NSNumber)?.intValue ?? -1
        rader = (bl["rader"] as? [[String: Any]] ?? []).map { r in
            YzRad(id: r["f"] as? String ?? "", navn: r["navn"] as? String ?? "", stil: r["stil"] as? String ?? "",
                  celler: (r["celler"] as? [[String: Any]] ?? []).map { c in
                    YzCelle(tekst: c["tekst"] as? String ?? "", mulig: c["mulig"] as? String ?? "", aktiv: c["aktiv"] as? Bool ?? false, skriv: c["skriv"] as? Bool ?? false, f: r["f"] as? String ?? "")
                  })
        }
        vinner = s("vinner"); vinnerTekst = s("vinnerTekst"); taper = s("taper")
        slutt = d["slutt"] as? [[String: Any]] ?? []; stua = d["stua"] as? String ?? "Stua"; mer = d["mer"] as? String ?? "Mer"
    }
}

final class YzModell: ObservableObject {
    @Published var d: YzData? = nil
    let blokker = KortModell()
    weak var nett: WKWebView? { didSet { blokker.nett = nett } }
    func sett(_ dict: [String: Any]) {
        let ny = YzData(dict)
        blokker.sett(["blokker": ny.slutt, "naa": dict["naa"] ?? 0])
        d = ny
    }
    func trykk(_ g: String, _ attrs: [String: String] = [:]) {
        UIImpactFeedbackGenerator(style: .light).impactOccurred()
        guard let data = try? JSONSerialization.data(withJSONObject: [g, attrs]), let json = String(data: data, encoding: .utf8) else { return }
        nett?.evaluateJavaScript("window.__mvLek && window.__mvLek.trykk.apply(null, \(json))", completionHandler: nil)
    }
}

struct YatzySkjerm: View {
    @ObservedObject var m: YzModell
    @Environment(\.colorScheme) private var modus
    @State private var rist = 0
    private var papir: Color { modus == .dark ? Color(red: 0.11, green: 0.106, blue: 0.122) : Color(red: 1, green: 0.973, blue: 0.933) }
    private var kort: Color { modus == .dark ? Color(red: 0.173, green: 0.169, blue: 0.188) : .white }
    private var blekk: Color { modus == .dark ? Color(red: 1, green: 0.973, blue: 0.933) : Color(red: 0.086, green: 0.071, blue: 0.059) }
    private let gul = Color(red: 1, green: 0.824, blue: 0.247)
    private let oransje = Color(red: 1, green: 0.357, blue: 0.122)
    private let rust = Color(red: 0.776, green: 0.235, blue: 0.067)
    private let mint = Color(red: 0.388, green: 0.886, blue: 0.659)
    private let morkBlekk = Color(red: 0.086, green: 0.071, blue: 0.059)
    private let lys = Color(red: 1, green: 0.973, blue: 0.933)
    private let filt = Color(red: 0.118, green: 0.361, blue: 0.227)
    private let filtLys = Color(red: 0.173, green: 0.478, blue: 0.306)
    private let tre = Color(red: 0.42, green: 0.227, blue: 0.118)
    private let messing = Color(red: 0.784, green: 0.573, blue: 0.29)

    var body: some View {
        ZStack {
            papir.ignoresSafeArea()
            if let d = m.d {
                VStack(spacing: 0) {
                    topp(d)
                    VStack(alignment: .leading, spacing: 10) {
                            if d.ferdig {
                                slutt(d)
                            } else {
                                brett(d)
                                if !d.lapp.isEmpty { lapp(d.lapp, d.lappStil) }
                            }
                            blokk(d)
                            if !d.stryk.isEmpty {
                                Button(action: { m.trykk("yz-stryk") }) {
                                    Text(d.stryk).font(.archivo(13, vekt: 800)).padding(.horizontal, 12).frame(height: 38)
                                        .background(Capsule().fill(kort)).overlay(Capsule().stroke(blekk, lineWidth: 2))
                                }.buttonStyle(.plain)
                            }
                            if d.ferdig { BlokkListe(m: m.blokker) }
                            Spacer(minLength: 0)
                        }.padding(.horizontal, 16).padding(.bottom, 12)
                }
            }
        }
        .foregroundColor(blekk)
        .onChange(of: m.d?.nr) { _ in withAnimation(.spring(response: 0.42, dampingFraction: 0.5)) { rist += 1 } }
    }

    private func topp(_ d: YzData) -> some View {
        HStack(spacing: 8) {
            VStack(alignment: .leading, spacing: 1) {
                Text(d.tittel).font(.archivo(12, vekt: 700)).opacity(0.65)
                Text(d.chip).font(.archivo(16, vekt: 900)).foregroundColor(d.minTur ? rust : blekk).lineLimit(2)
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

    // MARK: Brettet – filt, holdt-kant øverst, terningene, begeret til høyre
    private func brett(_ d: YzData) -> some View {
        GeometryReader { g in
            let w = g.size.width
            ZStack(alignment: .topLeading) {
                RoundedRectangle(cornerRadius: 14).fill(RadialGradient(colors: [filtLys, filt, Color(red: 0.09, green: 0.28, blue: 0.18)], center: UnitPoint(x: 0.4, y: 0.6), startRadius: 10, endRadius: w))
                RoundedRectangle(cornerRadius: 14).stroke(morkBlekk, lineWidth: 3)
                // kanten der holdte terninger ligger
                HStack(spacing: 4) {
                    Text(d.holdt.uppercased()).font(.archivo(10, vekt: 900)).foregroundColor(lys.opacity(0.75))
                    Rectangle().fill(messing.opacity(0.5)).frame(height: 2)
                }.padding(.horizontal, 12).padding(.top, 10)
                // kast 1 · 2 · 3
                HStack(spacing: 5) { ForEach(0..<3, id: \.self) { i in Circle().fill(i < d.kast ? gul : lys.opacity(0.25)).frame(width: 8, height: 8) } }
                    .padding(.leading, 12).padding(.top, 50)
                // terningene
                ForEach(d.terninger) { t in
                    let p = plass(t, w)
                    terning(t, kanHolde: d.kanHolde, borte: d.kast == 0)
                        .rotationEffect(.degrees(p.r))
                        .position(x: p.x, y: p.y)
                        .animation(.spring(response: 0.45, dampingFraction: 0.65), value: t.hold)
                }
                // begeret
                HStack { Spacer(); beger(d).padding(.trailing, 14) }.padding(.top, 70)
                if d.yatzy {
                    Text("YATZY!").font(.system(size: 50, weight: .heavy, design: .serif)).italic().foregroundColor(lys)
                        .shadow(color: morkBlekk, radius: 0, x: 3, y: 3).rotationEffect(.degrees(-6))
                        .frame(maxWidth: .infinity, maxHeight: .infinity).transition(.scale.combined(with: .opacity))
                }
            }
        }
        .frame(height: 232)
    }

    /// Hvor terningen ligger: holdt → på kanten øverst, ellers i rulleområdet
    private func plass(_ t: YzTerning, _ w: CGFloat) -> (x: CGFloat, y: CGFloat, r: Double) {
        let hvile: [(CGFloat, CGFloat, Double)] = [(0.08, 110, -10), (0.3, 170, 12), (0.5, 105, -5), (0.68, 165, 16), (0.1, 190, 8)]
        if t.hold { return (24 + CGFloat(t.id) * 52, 34, 0) }
        let h = hvile[t.id % hvile.count]
        return (24 + h.0 * (w - 120), h.1, h.2)
    }

    private func terning(_ t: YzTerning, kanHolde: Bool, borte: Bool) -> some View {
        Button(action: { m.trykk("yz-hold", ["i": String(t.id)]) }) {
            ZStack {
                RoundedRectangle(cornerRadius: 9).fill(lys)
                RoundedRectangle(cornerRadius: 9).stroke(morkBlekk, lineWidth: 2.5)
                if t.ring { RoundedRectangle(cornerRadius: 9).stroke(oransje, lineWidth: 3).padding(-4) }
                prikker(t.v)
            }
            .frame(width: 40, height: 40)
            .shadow(color: morkBlekk.opacity(0.5), radius: 0, x: 2, y: 2)
            .opacity(borte ? 0 : 1)
            .rotation3DEffect(.degrees(Double(rist % 2) * 360), axis: (x: 1, y: 1, z: 0))
        }.buttonStyle(.plain).disabled(!kanHolde || borte)
    }

    private func prikker(_ v: Int) -> some View {
        let paa: [Int] = [[], [5], [1, 9], [1, 5, 9], [1, 3, 7, 9], [1, 3, 5, 7, 9], [1, 3, 4, 6, 7, 9]][max(0, min(6, v))]
        return VStack(spacing: 3) {
            ForEach(0..<3, id: \.self) { r in
                HStack(spacing: 3) {
                    ForEach(0..<3, id: \.self) { c in
                        Circle().fill(paa.contains(r * 3 + c + 1) ? (v == 1 ? rust : morkBlekk) : .clear).frame(width: v == 1 ? 11 : 7, height: v == 1 ? 11 : 7)
                    }
                }
            }
        }
    }

    /// Begeret: trykk for å riste og trille
    private func beger(_ d: YzData) -> some View {
        Button(action: { m.trykk("yz-kast") }) {
            VStack(spacing: 4) {
                ZStack {
                    Path { p in p.move(to: CGPoint(x: 8, y: 8)); p.addLine(to: CGPoint(x: 70, y: 8)); p.addLine(to: CGPoint(x: 62, y: 90)); p.addLine(to: CGPoint(x: 16, y: 90)); p.closeSubpath() }
                        .fill(tre).overlay(Path { p in p.move(to: CGPoint(x: 8, y: 8)); p.addLine(to: CGPoint(x: 70, y: 8)); p.addLine(to: CGPoint(x: 62, y: 90)); p.addLine(to: CGPoint(x: 16, y: 90)); p.closeSubpath() }.stroke(morkBlekk, lineWidth: 3))
                    Path { p in p.move(to: CGPoint(x: 8, y: 8)); p.addLine(to: CGPoint(x: 70, y: 8)) }.stroke(morkBlekk, style: StrokeStyle(lineWidth: 7, lineCap: .round))
                    Path { p in p.move(to: CGPoint(x: 12, y: 26)); p.addLine(to: CGPoint(x: 66, y: 26)); p.move(to: CGPoint(x: 14, y: 72)); p.addLine(to: CGPoint(x: 64, y: 72)) }.stroke(messing, lineWidth: 4)
                }
                .frame(width: 78, height: 96)
                .rotationEffect(.degrees(rist % 2 == 0 ? 0 : -12), anchor: .bottom)
                .opacity(d.kanKaste ? 1 : 0.55)
                if d.kanKaste && d.kast == 0 { Text(d.beger.uppercased()).font(.archivo(10, vekt: 900)).foregroundColor(lys).multilineTextAlignment(.center).frame(width: 90) }
            }
        }.buttonStyle(.plain).disabled(!d.kanKaste)
    }

    /// Lappen: «Ener i kastet – drikk 2», skrevet litt skjevt
    private func lapp(_ t: String, _ stil: String) -> some View {
        Text(t).font(.archivo(15, vekt: 900)).foregroundColor(morkBlekk).padding(.horizontal, 12).padding(.vertical, 6)
            .background(Rectangle().fill(stil == "gull" ? gul : stil == "rod" ? Color(red: 1, green: 0.85, blue: 0.8) : lys))
            .overlay(Rectangle().stroke(morkBlekk, lineWidth: 2.5))
            .background(Rectangle().fill(morkBlekk).offset(x: 3, y: 3))
            .rotationEffect(.degrees(-1.5))
            .padding(.vertical, 4)
    }

    // MARK: Blokka – navnene øverst, feltene, summer; mulige felt kan trykkes
    private func blokk(_ d: YzData) -> some View {
        let kol = max(1, d.hode.count)
        return ScrollView([.horizontal, .vertical], showsIndicators: false) {
            VStack(spacing: 0) {
                rad(navn: "Yatzy", stil: "hode", celler: d.hode.enumerated().map { i, n in YzCelle(tekst: n, mulig: "", aktiv: i == d.aktivKol, skriv: false, f: "") }, kol: kol)
                ForEach(d.rader) { r in rad(navn: r.navn, stil: r.stil, celler: r.celler, kol: kol) }
            }
            .background(Color(red: 0.984, green: 0.98, blue: 0.957))
            .overlay(RoundedRectangle(cornerRadius: 4).stroke(morkBlekk, lineWidth: 3))
            .background(RoundedRectangle(cornerRadius: 4).fill(morkBlekk).offset(x: 4, y: 4))
            .padding(.trailing, 6).padding(.bottom, 6)
        }
        .frame(maxHeight: .infinity)
    }

    private func rad(navn: String, stil: String, celler: [YzCelle], kol: Int) -> some View {
        let sum = stil == "sum" || stil == "bonus" || stil == "total" || stil == "hode"
        let cw: CGFloat = kol <= 3 ? 64 : kol <= 5 ? 50 : 42
        return HStack(spacing: 0) {
            Text(navn).font(.archivo(12, vekt: sum ? 900 : 700)).foregroundColor(morkBlekk).lineLimit(1).minimumScaleFactor(0.7)
                .frame(width: 96, alignment: .leading).padding(.leading, 8)
            ForEach(Array(celler.enumerated()), id: \.offset) { _, c in
                Group {
                    if !c.mulig.isEmpty {
                        Button(action: { m.trykk("yz-felt", ["f": c.f]) }) {
                            Text(c.mulig).font(.archivo(14, vekt: 900)).foregroundColor(morkBlekk).frame(width: cw - 6, height: 28)
                                .background(RoundedRectangle(cornerRadius: 6).fill(gul)).overlay(RoundedRectangle(cornerRadius: 6).stroke(morkBlekk, lineWidth: 2))
                        }.buttonStyle(.plain)
                    } else {
                        Text(c.tekst).font(.archivo(stil == "total" ? 15 : 13, vekt: sum ? 900 : 700)).foregroundColor(c.skriv ? rust : morkBlekk)
                    }
                }
                .frame(width: cw, height: 34)
                .background(c.aktiv ? gul.opacity(0.22) : .clear)
            }
        }
        .frame(height: 34)
        .background(stil == "hode" ? gul.opacity(0.5) : stil == "total" ? Color(red: 0.95, green: 0.93, blue: 0.86) : .clear)
        .overlay(Rectangle().fill(morkBlekk.opacity(stil == "hode" || sum ? 0.6 : 0.18)).frame(height: 1), alignment: .bottom)
    }

    // MARK: Slutten – vinneren og taperen
    @ViewBuilder private func slutt(_ d: YzData) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(d.vinner).font(.archivo(28, vekt: 900))
            Text(d.vinnerTekst).font(.archivo(15, vekt: 700)).opacity(0.75)
        }
        .padding(16).frame(maxWidth: .infinity, alignment: .leading)
        .background(RoundedRectangle(cornerRadius: 14).fill(mint)).foregroundColor(morkBlekk)
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(morkBlekk, lineWidth: 3))
        .background(RoundedRectangle(cornerRadius: 14).fill(morkBlekk).offset(x: 4, y: 4))
        if !d.taper.isEmpty { lapp(d.taper, "rod") }
    }
}
