import SwiftUI
import UIKit
import WebKit

/// Kortlekene («Jeg har aldri», «Nødt eller sannhet» …) som native skjerm. Nettsiden oversetter sin egen skjerm til
/// enkle blokker (rom.js skjermBlokker): topp, kort, knapper, benk med hodene, dom, søyler, tekst – og denne tegner dem
/// i appens stil. Trykkene går tilbake til nettsidens egne knapper (window.__mvLek.trykk), så all logikk bor ett sted.
final class KortModell: ObservableObject {
    @Published var blokker: [[String: Any]] = []
    @Published var lek = ""
    @Published var stua = "Stua"
    @Published var mer = "Mer"
    private(set) var avvik: Double = 0
    weak var nett: WKWebView?
    private var bilder: [String: UIImage] = [:]

    func sett(_ d: [String: Any]) {
        if let n = (d["naa"] as? NSNumber)?.doubleValue, n > 0 { avvik = n - Date().timeIntervalSince1970 * 1000 }
        lek = d["lek"] as? String ?? lek
        stua = d["stua"] as? String ?? stua; mer = d["mer"] as? String ?? mer
        blokker = d["blokker"] as? [[String: Any]] ?? []
    }
    /// Sekunder igjen til en frist (servertid)
    func igjen(_ frist: Double) -> Int { max(0, Int(ceil((frist - 1500 - (Date().timeIntervalSince1970 * 1000 + avvik)) / 1000))) }

    func bilde(_ b64: String) -> UIImage? {
        if b64.isEmpty { return nil }
        if let b = bilder[b64] { return b }
        guard let data = Data(base64Encoded: b64), let img = UIImage(data: data, scale: 2) else { return nil }
        if bilder.count > 80 { bilder.removeAll() }
        bilder[b64] = img
        return img
    }

    func trykk(_ k: [String: Any]) {
        guard let g = k["g"] as? String, !g.isEmpty else { return }
        UIImpactFeedbackGenerator(style: .light).impactOccurred()
        let attrs = k["attrs"] as? [String: String] ?? [:]
        guard let data = try? JSONSerialization.data(withJSONObject: [g, attrs]), let json = String(data: data, encoding: .utf8) else { return }
        nett?.evaluateJavaScript("window.__mvLek && window.__mvLek.trykk.apply(null, \(json))", completionHandler: nil)
    }
    func trykk(_ g: String) { trykk(["g": g]) }
}

struct KortSkjerm: View {
    @ObservedObject var m: KortModell
    @Environment(\.colorScheme) private var modus
    private var papir: Color { modus == .dark ? Color(red: 0.11, green: 0.106, blue: 0.122) : Color(red: 1, green: 0.973, blue: 0.933) }
    private var blekk: Color { modus == .dark ? Color(red: 1, green: 0.973, blue: 0.933) : Color(red: 0.086, green: 0.071, blue: 0.059) }
    var body: some View {
        ZStack {
            papir.ignoresSafeArea(edges: [.top, .horizontal])
            ScrollView { BlokkListe(m: m).padding(.horizontal, 16).padding(.top, 6).padding(.bottom, 24) }
        }
        .foregroundColor(blekk)
    }
}

/// Blokkene fra nettsiden, tegnet i appens stil. Brukes av kortlekene og lobbyen.
struct BlokkListe: View {
    @ObservedObject var m: KortModell
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

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            ForEach(Array(m.blokker.enumerated()), id: \.offset) { _, b in blokk(b) }
        }
        .animation(.easeOut(duration: 0.2), value: m.blokker.count)
    }

    private func s(_ b: [String: Any], _ k: String) -> String { b[k] as? String ?? "" }

    @ViewBuilder private func blokk(_ b: [String: Any]) -> some View {
        switch s(b, "type") {
        case "topp": topp(b)
        case "kort": kortet(b)
        case "knapp": knapp(b, bred: true)
        case "rad":
            let kn = b["knapper"] as? [[String: Any]] ?? []
            HStack(alignment: .top, spacing: 10) { ForEach(Array(kn.enumerated()), id: \.offset) { _, k in knapp(k, bred: true) } }
        case "benk": benk(b)
        case "sider": sider(b)
        case "dom": dom(b)
        case "stolper": stolper(b)
        case "liste": liste(b)
        case "ulv": ulv(b)
        case "vinner": vinner(b)
        default: tekst(b)
        }
    }

    private func topp(_ b: [String: Any]) -> some View {
        HStack(spacing: 8) {
            VStack(alignment: .leading, spacing: 1) {
                Text(s(b, "tekst")).font(.archivo(12, vekt: 700)).opacity(0.65)
                Text(s(b, "chip")).font(.archivo(16, vekt: 900)).foregroundColor(b["gul"] as? Bool == true ? rust : blekk)
            }
            Spacer()
            if let f = (b["frist"] as? NSNumber)?.doubleValue, f > 0 {
                TimelineView(.periodic(from: .now, by: 1)) { _ in
                    let n = m.igjen(f)
                    Text("\(n)").font(.archivo(16, vekt: 900)).frame(width: 40, height: 40)
                        .background(Circle().fill(n <= 10 ? oransje : gul)).overlay(Circle().stroke(morkBlekk, lineWidth: 2)).foregroundColor(morkBlekk)
                }
            }
            liten(m.stua, "sofa.fill") { m.trykk("stua-ark") }
            liten(m.mer, "ellipsis") { m.trykk("mer-ark") }
        }
    }

    private func liten(_ t: String, _ sym: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: 5) { Image(systemName: sym).font(.system(size: 13, weight: .bold)); Text(t).font(.archivo(13, vekt: 800)) }
                .padding(.horizontal, 11).frame(height: 34)
                .background(Capsule().fill(kort)).overlay(Capsule().stroke(blekk, lineWidth: 2))
        }.buttonStyle(.plain)
    }

    private func kortet(_ b: [String: Any]) -> some View {
        let stil = s(b, "stil"), liten = b["liten"] as? Bool ?? false, tekst = s(b, "tekst")
        let bg: Color = stil == "nodt" ? oransje : stil == "sannhet" ? mint : kort
        return VStack(alignment: .leading, spacing: 8) {
            if !s(b, "tag").isEmpty {
                Text(s(b, "tag").uppercased()).font(.archivo(11, vekt: 900)).padding(.horizontal, 9).padding(.vertical, 4)
                    .background(Capsule().fill(stil.isEmpty ? gul : morkBlekk)).foregroundColor(stil.isEmpty ? morkBlekk : papir)
            }
            if !s(b, "pre").isEmpty { Text(s(b, "pre")).font(.archivo(liten ? 13 : 15, vekt: 700)).opacity(0.65) }
            Text(tekst).font(.archivo(liten ? 19 : tekst.count > 80 ? 23 : 28, vekt: 900)).lineSpacing(2).fixedSize(horizontal: false, vertical: true)
            if !s(b, "under").isEmpty { Text(s(b, "under")).font(.archivo(14, vekt: 500)).opacity(0.75) }
        }
        .padding(liten ? 14 : 18).frame(maxWidth: .infinity, alignment: .leading)
        .foregroundColor(stil.isEmpty ? blekk : morkBlekk)
        .background(RoundedRectangle(cornerRadius: 18).fill(bg))
        .overlay(RoundedRectangle(cornerRadius: 18).stroke(stil.isEmpty ? blekk : morkBlekk, lineWidth: 3))
        .background(RoundedRectangle(cornerRadius: 18).fill(blekk).offset(x: 5, y: 5))
    }

    /// Knappene: stor (gul med skygge), valg (nødt/sannhet/ja/nei med egne farger), vanlig, lenke
    private func knapp(_ k: [String: Any], bred: Bool) -> some View {
        let stil = s(k, "stil"), paa = k["paa"] as? Bool ?? false, av = k["av"] as? Bool ?? false
        let tekst = s(k, "tekst"), under = s(k, "under")
        let farge: Color = stil == "nodt" || stil == "nei" ? oransje : stil == "sann" || stil == "ja" ? mint : stil == "stor" ? gul : kort
        let hoy: CGFloat = stil == "stor" ? 60 : (!under.isEmpty ? 68 : 50)
        return Button(action: { m.trykk(k) }) {
            if stil == "link" {
                Text(tekst).font(.archivo(14, vekt: 700)).underline().opacity(0.8).padding(.vertical, 4)
            } else {
                VStack(spacing: 3) {
                    Text(tekst.uppercased()).font(.archivo(stil == "stor" ? 18 : 16, vekt: 900)).lineLimit(2).minimumScaleFactor(0.7).multilineTextAlignment(.center)
                    if !under.isEmpty { Text(under).font(.archivo(12, vekt: 600)).opacity(0.8).lineLimit(2).multilineTextAlignment(.center) }
                }
                .frame(maxWidth: bred ? .infinity : nil).frame(minHeight: hoy).padding(.horizontal, 10)
                .foregroundColor(stil == "vanlig" || stil == "" ? blekk : morkBlekk)
                .background(ZStack {
                    RoundedRectangle(cornerRadius: 14).fill(morkBlekk).offset(x: paa ? 1 : 4, y: paa ? 1 : 4)
                    RoundedRectangle(cornerRadius: 14).fill(farge.opacity(av ? 0.5 : 1))
                    RoundedRectangle(cornerRadius: 14).stroke(morkBlekk, lineWidth: paa ? 4 : 3)
                })
                .offset(x: paa ? 3 : 0, y: paa ? 3 : 0)
            }
        }.buttonStyle(.plain).disabled(av)
    }

    /// Benken: hodene nederst – de som har svart står oppe
    private func benk(_ b: [String: Any]) -> some View {
        let folk = b["folk"] as? [[String: Any]] ?? []
        let bombe = b["bombe"] as? [String: Any]
        let harBombe = bombe != nil
        return VStack(alignment: .leading, spacing: 6) {
            if !s(b, "status").isEmpty { Text(s(b, "status")).font(.archivo(12, vekt: 700)).opacity(0.65) }
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(alignment: .bottom, spacing: 10) {
                    ForEach(Array(folk.enumerated()), id: \.offset) { _, f in
                        let oppe = f["oppe"] as? Bool ?? false, stol = f["stol"] as? Bool ?? false, oi = f["oi"] as? Bool ?? false
                        VStack(spacing: 2) {
                            if !s(f, "tall").isEmpty { Text(s(f, "tall")).font(.archivo(13, vekt: 900)).padding(.horizontal, 7).padding(.vertical, 2).background(Capsule().fill(gul)).foregroundColor(morkBlekk) }
                            ZStack {
                                if let img = m.bilde(s(f, "png")) { Image(uiImage: img).resizable().aspectRatio(contentMode: .fit).frame(width: 56, height: 86) }
                                else { Circle().fill(rosa).frame(width: 44, height: 44) }
                            }
                            .offset(y: oppe ? -10 : 0)
                            .overlay(stol || oi ? Circle().stroke(oi ? oransje : gul, lineWidth: 3).frame(width: 60, height: 60).offset(y: oppe ? -18 : -8) : nil)
                            .overlay(alignment: .top) {
                                if let bo = bombe, s(bo, "id") == s(f, "id") {
                                    BombeVisning(bom: bo["bom"] as? Bool ?? false, start: (bo["start"] as? NSNumber)?.doubleValue ?? 0, smell: (bo["smell"] as? NSNumber)?.doubleValue ?? 0, avvik: m.avvik)
                                        .frame(width: 64, height: 76).offset(y: -62)
                                }
                            }
                            .animation(.spring(response: 0.3, dampingFraction: 0.6), value: oppe)
                            Text(s(f, "navn")).font(.archivo(12, vekt: oppe ? 900 : 600)).lineLimit(1).opacity(oppe ? 1 : 0.7)
                        }.frame(minWidth: 60)
                    }
                }.padding(.top, harBombe ? 70 : 14).padding(.horizontal, 4)
            }
        }
        .padding(.top, 8)
    }

    /// Enten eller: de to sidene med hvem som valgte hva
    private func sider(_ b: [String: Any]) -> some View {
        HStack(alignment: .top, spacing: 10) {
            ForEach(["a", "b"], id: \.self) { k in
                if let sd = b[k] as? [String: Any] {
                    VStack(alignment: .leading, spacing: 6) {
                        Text(s(sd, "tekst").uppercased()).font(.archivo(11, vekt: 900)).opacity(0.7)
                        Text(s(sd, "valg")).font(.archivo(16, vekt: 900)).fixedSize(horizontal: false, vertical: true)
                        let folk = sd["folk"] as? [[String: Any]] ?? []
                        HStack(spacing: -6) {
                            ForEach(Array(folk.enumerated()), id: \.offset) { _, p in
                                Text(s(p, "init")).font(.archivo(11, vekt: 900)).frame(width: 30, height: 30)
                                    .background(Circle().fill(Color(hex: s(p, "farge")))).overlay(Circle().stroke(morkBlekk, lineWidth: 2)).foregroundColor(morkBlekk)
                            }
                        }.frame(minHeight: 30)
                    }
                    .padding(12).frame(maxWidth: .infinity, alignment: .leading)
                    .background(RoundedRectangle(cornerRadius: 14).fill(k == "a" ? mint.opacity(0.35) : rosa.opacity(0.35)))
                    .overlay(RoundedRectangle(cornerRadius: 14).stroke(blekk, lineWidth: 2.5))
                }
            }
        }
    }

    private func dom(_ b: [String: Any]) -> some View {
        let stil = s(b, "stil")
        let bg: Color = stil == "feig" ? oransje : stil == "uenige" ? rosa : stil == "tom" ? gul : mint
        return VStack(alignment: .leading, spacing: 4) {
            if !s(b, "over").isEmpty { Text(s(b, "over").uppercased()).font(.archivo(12, vekt: 900)).opacity(0.75) }
            Text(s(b, "tittel")).font(.archivo(24, vekt: 900))
            if !s(b, "under").isEmpty { Text(s(b, "under")).font(.archivo(14, vekt: 500)).opacity(0.85) }
        }
        .padding(16).frame(maxWidth: .infinity, alignment: .leading).foregroundColor(morkBlekk)
        .background(RoundedRectangle(cornerRadius: 16).fill(bg)).overlay(RoundedRectangle(cornerRadius: 16).stroke(morkBlekk, lineWidth: 2.5))
    }

    private func stolper(_ b: [String: Any]) -> some View {
        let rader = b["rader"] as? [[String: Any]] ?? []
        return VStack(spacing: 8) {
            ForEach(Array(rader.enumerated()), id: \.offset) { _, x in
                HStack(spacing: 10) {
                    Text(s(x, "navn")).font(.archivo(15, vekt: 800)).frame(width: 90, alignment: .leading).lineLimit(1)
                    GeometryReader { g in
                        ZStack(alignment: .leading) {
                            Capsule().fill(blekk.opacity(0.12))
                            Capsule().fill(Color(hex: s(x, "farge"))).frame(width: max(8, g.size.width * CGFloat((x["andel"] as? NSNumber)?.doubleValue ?? 0))).overlay(Capsule().stroke(morkBlekk, lineWidth: 1.5))
                        }
                    }.frame(height: 18)
                    Text(s(x, "n")).font(.archivo(15, vekt: 900)).frame(width: 30, alignment: .trailing)
                }
            }
        }
    }

    private func liste(_ b: [String: Any]) -> some View {
        let rader = b["rader"] as? [[String: Any]] ?? []
        return VStack(spacing: 6) {
            ForEach(Array(rader.enumerated()), id: \.offset) { _, x in
                HStack {
                    Text(s(x, "navn")).font(.archivo(15, vekt: 800))
                    if !s(x, "mellom").isEmpty { Text(s(x, "mellom")).font(.archivo(13, vekt: 500)).opacity(0.7).lineLimit(1) }
                    Spacer()
                    Text(s(x, "tekst")).font(.archivo(13, vekt: 800)).padding(.horizontal, 9).padding(.vertical, 4)
                        .background(Capsule().fill(x["rett"] as? Bool == true ? mint : oransje)).foregroundColor(morkBlekk)
                }
                .padding(.horizontal, 12).padding(.vertical, 8)
                .background(RoundedRectangle(cornerRadius: 12).fill(kort)).overlay(RoundedRectangle(cornerRadius: 12).stroke(blekk.opacity(0.25), lineWidth: 1.5))
            }
        }
    }

    /// «Bare én har gjort det» – den som må fortelle
    private func ulv(_ b: [String: Any]) -> some View {
        VStack(spacing: 6) {
            Text(s(b, "etikett").uppercased()).font(.archivo(12, vekt: 900)).opacity(0.75)
            if let img = m.bilde(s(b, "png")) { Image(uiImage: img).resizable().aspectRatio(contentMode: .fit).frame(height: 110) }
            Text(s(b, "navn")).font(.archivo(26, vekt: 900))
            Text(s(b, "be")).font(.archivo(16, vekt: 800)).foregroundColor(rust)
            Text(s(b, "tekst")).font(.archivo(14, vekt: 500)).opacity(0.8).multilineTextAlignment(.center)
            if let k = b["knapp"] as? [String: Any] { knapp(k, bred: false) }
        }
        .padding(16).frame(maxWidth: .infinity)
        .background(RoundedRectangle(cornerRadius: 16).fill(gul.opacity(0.35))).overlay(RoundedRectangle(cornerRadius: 16).stroke(blekk, lineWidth: 2.5))
    }

    private func vinner(_ b: [String: Any]) -> some View {
        HStack(spacing: 12) {
            if let img = m.bilde(s(b, "png")) { Image(uiImage: img).resizable().aspectRatio(contentMode: .fit).frame(height: 90) }
            Text(s(b, "navn")).font(.archivo(24, vekt: 900))
            Spacer()
            Text(s(b, "n")).font(.archivo(30, vekt: 900)).foregroundColor(rust)
        }
        .padding(14).background(RoundedRectangle(cornerRadius: 16).fill(kort)).overlay(RoundedRectangle(cornerRadius: 16).stroke(blekk, lineWidth: 2.5))
    }

    private func tekst(_ b: [String: Any]) -> some View {
        let stil = s(b, "stil")
        return Text(s(b, "tekst"))
            .font(.archivo(stil == "stor" ? 24 : stil == "dom" ? 18 : stil == "etikett" ? 12 : 15, vekt: stil == "stor" || stil == "dom" ? 900 : stil == "etikett" ? 900 : 500))
            .foregroundColor(stil == "merk" ? rust : blekk)
            .opacity(stil == "vent" ? 0.75 : stil == "etikett" ? 0.65 : 1)
            .fixedSize(horizontal: false, vertical: true)
    }
}

/// Kategorier: bomba over hodet til den som har den. Rister raskere jo nærmere smellet (start → smell, servertid),
/// og smeller som en stjerne med «BOM!». Tiden holdes av nettsiden – denne tegner bare.
struct BombeVisning: View {
    var bom: Bool
    var start: Double
    var smell: Double
    var avvik: Double
    private let gul = Color(red: 1, green: 0.824, blue: 0.247)
    private let oransje = Color(red: 1, green: 0.357, blue: 0.122)
    private let morkBlekk = Color(red: 0.086, green: 0.071, blue: 0.059)

    var body: some View {
        if bom {
            ZStack {
                Stjerne(n: 14, indre: 0.55).fill(gul).overlay(Stjerne(n: 14, indre: 0.55).stroke(morkBlekk, lineWidth: 3))
                Stjerne(n: 7, indre: 0.5).fill(oransje).scaleEffect(0.55)
                Text("BOM!").font(.archivo(15, vekt: 900)).foregroundColor(morkBlekk).rotationEffect(.degrees(-8))
            }
            .transition(.scale(scale: 0.3).combined(with: .opacity))
        } else {
            TimelineView(.animation) { tl in
                let naa = tl.date.timeIntervalSince1970 * 1000 + avvik
                let brent = smell > start ? min(1, max(0, (naa - start) / (smell - start))) : 0
                let periode = 0.7 - 0.56 * brent   // sekunder per rist, som nettsiden
                let fase = (naa / 1000).truncatingRemainder(dividingBy: periode) / periode
                let vink = sin(fase * .pi * 2) * (4 + 8 * brent)
                let gnist = Int(naa / 90) % 2 == 0
                bombe(gnist: gnist, brent: brent)
                    .rotationEffect(.degrees(vink), anchor: .bottom)
                    .offset(x: CGFloat(sin(fase * .pi * 4)) * CGFloat(1 + 2 * brent))
            }
        }
    }

    private func bombe(gnist: Bool, brent: Double) -> some View {
        ZStack {
            // lunta
            Path { p in p.move(to: CGPoint(x: 42, y: 22)); p.addQuadCurve(to: CGPoint(x: 58, y: 8), control: CGPoint(x: 46, y: 8)) }
                .stroke(morkBlekk, style: StrokeStyle(lineWidth: 3.5, lineCap: .round))
            // gnisten
            Circle().fill(gul).frame(width: gnist ? 14 : 11, height: gnist ? 14 : 11).position(x: 58, y: 8)
            Circle().fill(oransje).frame(width: 6, height: 6).position(x: 58, y: 8)
            // halsen
            RoundedRectangle(cornerRadius: 2).fill(Color(red: 0.29, green: 0.247, blue: 0.216)).frame(width: 18, height: 10)
                .overlay(RoundedRectangle(cornerRadius: 2).stroke(morkBlekk, lineWidth: 2.5)).rotationEffect(.degrees(30)).position(x: 40, y: 24)
            // kula
            Circle().fill(brent > 0.75 ? Color(red: 0.35, green: 0.12, blue: 0.08) : morkBlekk).frame(width: 46, height: 46)
                .overlay(Circle().stroke(morkBlekk, lineWidth: 3)).position(x: 30, y: 50)
            Path { p in p.move(to: CGPoint(x: 16, y: 40)); p.addQuadCurve(to: CGPoint(x: 28, y: 32), control: CGPoint(x: 19, y: 33)) }
                .stroke(Color(red: 1, green: 0.973, blue: 0.933).opacity(0.7), style: StrokeStyle(lineWidth: 3.5, lineCap: .round))
        }
    }
}

/// Stjerne med n tagger (smellet)
struct Stjerne: Shape {
    var n: Int
    var indre: CGFloat
    func path(in r: CGRect) -> Path {
        var p = Path()
        let c = CGPoint(x: r.midX, y: r.midY), R = min(r.width, r.height) / 2
        for i in 0..<(n * 2) {
            let a = Double(i) * .pi / Double(n) - .pi / 2, rad = i % 2 == 0 ? R : R * indre
            let pt = CGPoint(x: c.x + CGFloat(cos(a)) * rad, y: c.y + CGFloat(sin(a)) * rad)
            if i == 0 { p.move(to: pt) } else { p.addLine(to: pt) }
        }
        p.closeSubpath()
        return p
    }
}
