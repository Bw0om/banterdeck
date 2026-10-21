import SwiftUI
import UIKit
import WebKit

/// President som native skjerm: trappa med titlene, folket rundt bordet med tur-ringen, bordet med bunken,
/// og hånda di der du velger kort og legger. Nettsiden under holder tilstanden og klokka (rom.js prData) –
/// denne skjermen tegner, velger kort selv, og sender «legg»/«pass» tilbake til nettsidens knapper.
struct PrKort: Identifiable { let id: Int; let v: String; let f: String; let rod: Bool; let rang: Int }
struct PrTrinn: Identifiable { let id: Int; let navn: String; let farge: String; let png: String; let harNoen: Bool }
struct PrFolk: Identifiable { let id: String; let navn: String; let png: String; let ute: Bool; let tur: Bool; let tekst: String }
struct PrTittel: Identifiable { let id: String; let navn: String; let png: String; let plass: String; let farge: String; let em: String }

struct PrData {
    let ferdig: Bool, tittel: String, chip: String, minTur: Bool, naa: Double, turVed: Double, turTid: Double
    let trapp: [PrTrinn], folk: [PrFolk]
    let bordTekst: String, bord: [PrKort], bordAntall: Int, bordRang: Int, bytte: String
    let hand: [PrKort]?, handTekst: String
    let t: [String: String], kanPasse: Bool, vertPass: String
    let titler: [PrTittel], slutt: [[String: Any]], stua: String, mer: String

    init(_ d: [String: Any]) {
        func s(_ k: String) -> String { d[k] as? String ?? "" }
        func kort(_ l: Any?) -> [PrKort] {
            (l as? [[String: Any]] ?? []).enumerated().map { i, k in PrKort(id: i, v: k["v"] as? String ?? "", f: k["f"] as? String ?? "", rod: k["rod"] as? Bool ?? false, rang: (k["rang"] as? NSNumber)?.intValue ?? 0) }
        }
        ferdig = d["ferdig"] as? Bool ?? false; tittel = s("tittel"); chip = s("chip"); minTur = d["minTur"] as? Bool ?? false
        naa = (d["naa"] as? NSNumber)?.doubleValue ?? 0; turVed = (d["turVed"] as? NSNumber)?.doubleValue ?? 0; turTid = (d["turTid"] as? NSNumber)?.doubleValue ?? 0
        trapp = (d["trapp"] as? [[String: Any]] ?? []).enumerated().map { i, t in PrTrinn(id: i, navn: t["navn"] as? String ?? "", farge: t["farge"] as? String ?? "#FFD23F", png: t["png"] as? String ?? "", harNoen: t["harNoen"] as? Bool ?? false) }
        folk = (d["folk"] as? [[String: Any]] ?? []).map { f in PrFolk(id: f["id"] as? String ?? "", navn: f["navn"] as? String ?? "", png: f["png"] as? String ?? "", ute: f["ute"] as? Bool ?? false, tur: f["tur"] as? Bool ?? false, tekst: f["tekst"] as? String ?? "") }
        bordTekst = s("bordTekst"); bord = kort(d["bord"]); bordAntall = (d["bordAntall"] as? NSNumber)?.intValue ?? 0; bordRang = (d["bordRang"] as? NSNumber)?.intValue ?? 0; bytte = s("bytte")
        hand = d["hand"] is NSNull || d["hand"] == nil ? nil : kort(d["hand"]); handTekst = s("handTekst")
        t = d["t"] as? [String: String] ?? [:]; kanPasse = d["kanPasse"] as? Bool ?? false; vertPass = s("vertPass")
        titler = (d["titler"] as? [[String: Any]] ?? []).map { x in PrTittel(id: x["id"] as? String ?? "", navn: x["navn"] as? String ?? "", png: x["png"] as? String ?? "", plass: x["plass"] as? String ?? "", farge: x["farge"] as? String ?? "#FFD23F", em: x["em"] as? String ?? "") }
        slutt = d["slutt"] as? [[String: Any]] ?? []; stua = d["stua"] as? String ?? "Stua"; mer = d["mer"] as? String ?? "Mer"
    }
}

final class PrModell: ObservableObject {
    @Published var d: PrData? = nil
    let blokker = KortModell()
    private(set) var avvik: Double = 0
    weak var nett: WKWebView? { didSet { blokker.nett = nett } }
    private var bilder: [String: UIImage] = [:]
    func sett(_ dict: [String: Any]) {
        let ny = PrData(dict)
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

struct PresidentSkjerm: View {
    @ObservedObject var m: PrModell
    @Environment(\.colorScheme) private var modus
    @State private var valgt: Set<Int> = []
    private var papir: Color { modus == .dark ? Color(red: 0.11, green: 0.106, blue: 0.122) : Color(red: 1, green: 0.973, blue: 0.933) }
    private var kort: Color { modus == .dark ? Color.white.opacity(0.07) : .white }
    private var blekk: Color { modus == .dark ? Color(red: 1, green: 0.973, blue: 0.933) : Color(red: 0.086, green: 0.071, blue: 0.059) }
    private let gul = Color(red: 1, green: 0.824, blue: 0.247)
    private let oransje = Color(red: 1, green: 0.357, blue: 0.122)
    private let rust = Color(red: 0.776, green: 0.235, blue: 0.067)
    private let mint = Color(red: 0.388, green: 0.886, blue: 0.659)
    private let morkBlekk = Color(red: 0.086, green: 0.071, blue: 0.059)
    private let lys = Color(red: 1, green: 0.973, blue: 0.933)
    private let kortRod = Color(red: 0.843, green: 0.149, blue: 0.239)
    private let bordFarge = Color(red: 0.165, green: 0.161, blue: 0.18)

    var body: some View {
        ZStack {
            papir.ignoresSafeArea()
            if let d = m.d {
                VStack(spacing: 0) {
                    topp(d)
                    ScrollView {
                        VStack(alignment: .leading, spacing: 12) {
                            trapp(d)
                            if d.ferdig {
                                titler(d)
                                BlokkListe(m: m.blokker)
                            } else {
                                folk(d)
                                bord(d)
                                hand(d)
                                knapper(d)
                            }
                        }.padding(.horizontal, 16).padding(.bottom, 24)
                    }
                }
            }
        }
        .foregroundColor(blekk)
        .onChange(of: m.d?.minTur) { _ in valgt = [] }
        .onChange(of: m.d?.hand?.count) { _ in valgt = [] }
    }

    private func topp(_ d: PrData) -> some View {
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

    private func hode(_ png: String) -> some View {
        Group {
            if let img = m.bilde(png) { Image(uiImage: img).resizable().aspectRatio(contentMode: .fit) }
            else { Circle().fill(gul).overlay(Circle().stroke(morkBlekk, lineWidth: 2)) }
        }
    }

    /// Trappa: Rævkjører nederst til venstre, President øverst til høyre – de som er ute står på trinnet sitt
    private func trapp(_ d: PrData) -> some View {
        let n = max(1, d.trapp.count)
        return HStack(alignment: .bottom, spacing: 0) {
            ForEach(d.trapp) { t in
                ZStack(alignment: .top) {
                    Rectangle().fill(Color(hex: t.farge)).overlay(Rectangle().stroke(morkBlekk, lineWidth: 2.5))
                        .frame(height: 30 + CGFloat(t.id) * 60 / CGFloat(max(1, n - 1)))
                    VStack(spacing: 0) {
                        if t.harNoen { hode(t.png).frame(width: 34, height: 38).offset(y: -30).transition(.scale.combined(with: .opacity)) }
                    }
                }
                .overlay(alignment: .bottom) { Text(t.navn).font(.archivo(9, vekt: 900)).foregroundColor(morkBlekk).lineLimit(1).minimumScaleFactor(0.6).padding(.bottom, 4).padding(.horizontal, 2) }
            }
        }
        .frame(height: 118, alignment: .bottom).padding(.top, 10)
        .background(Rectangle().fill(morkBlekk).offset(x: 3, y: 3))
    }

    /// Folket: hodene med navn, tur-ringen som renner ut, og hvor mange kort de har
    private func folk(_ d: PrData) -> some View {
        HStack(alignment: .top, spacing: 4) {
            ForEach(d.folk) { f in
                VStack(spacing: 2) {
                    ZStack {
                        if f.tur {
                            TimelineView(.periodic(from: .now, by: 0.25)) { _ in
                                let andel = d.turTid > 0 ? max(0, min(1, 1 - (m.naaMs() - d.turVed) / d.turTid)) : 0
                                Circle().trim(from: 0, to: CGFloat(andel)).stroke(gul, style: StrokeStyle(lineWidth: 3, lineCap: .round)).rotationEffect(.degrees(-90)).frame(width: 44, height: 44)
                            }
                        }
                        hode(f.png).frame(width: 36, height: 40).opacity(f.ute ? 0.4 : 1)
                    }.frame(width: 46, height: 46)
                    Text(f.navn).font(.archivo(11, vekt: f.tur ? 900 : 700)).lineLimit(1).minimumScaleFactor(0.7)
                    Text(f.tekst).font(.archivo(10, vekt: 600)).opacity(0.65).lineLimit(1).minimumScaleFactor(0.7)
                }.frame(maxWidth: .infinity)
            }
        }
    }

    /// Bordet: bunken i midten, teksten om hva som sist skjedde
    private func bord(_ d: PrData) -> some View {
        ZStack(alignment: .top) {
            RoundedRectangle(cornerRadius: 18).fill(bordFarge)
            RoundedRectangle(cornerRadius: 18).stroke(morkBlekk, lineWidth: 3)
            VStack(spacing: 6) {
                Text(d.bordTekst).font(.archivo(12, vekt: 800)).foregroundColor(lys.opacity(0.85)).lineLimit(2).multilineTextAlignment(.center).padding(.top, 10).padding(.horizontal, 10)
                if !d.bytte.isEmpty { Text(d.bytte).font(.archivo(11, vekt: 600)).foregroundColor(lys.opacity(0.7)) }
            }
            ZStack {
                ForEach(d.bord) { k in
                    let i = Double(k.id) - Double(d.bord.count - 1) / 2
                    spillkort(k, w: 64, h: 90).rotationEffect(.degrees(i * 12)).offset(x: CGFloat(i) * 30, y: 0)
                        .transition(.scale(scale: 1.3).combined(with: .opacity))
                }
            }.frame(maxWidth: .infinity).padding(.top, 60)
        }
        .frame(height: 210)
        .background(RoundedRectangle(cornerRadius: 18).fill(morkBlekk).offset(x: 4, y: 4))
        .animation(.spring(response: 0.35, dampingFraction: 0.7), value: d.bord.count)
    }

    private func spillkort(_ k: PrKort, w: CGFloat, h: CGFloat) -> some View {
        ZStack(alignment: .topLeading) {
            RoundedRectangle(cornerRadius: w * 0.13).fill(Color.white)
            RoundedRectangle(cornerRadius: w * 0.13).stroke(morkBlekk, lineWidth: 2.5)
            VStack(alignment: .leading, spacing: 0) {
                Text(k.v).font(.system(size: w * 0.3, weight: .black))
                Text(k.f).font(.system(size: w * 0.3, weight: .black))
            }.foregroundColor(k.rod ? kortRod : morkBlekk).padding(w * 0.1)
            Text(k.f).font(.system(size: w * 0.5, weight: .black)).foregroundColor(k.rod ? kortRod : morkBlekk).opacity(0.25)
                .frame(width: w, height: h, alignment: .bottomTrailing).padding(w * 0.1)
        }
        .frame(width: w, height: h)
    }

    /// Hånda: trykk for å velge, valgte kort løfter seg
    @ViewBuilder private func hand(_ d: PrData) -> some View {
        if let h = d.hand {
            GeometryReader { g in
                let n = h.count, w: CGFloat = 64, steg = n > 1 ? min(34, (g.size.width - w) / CGFloat(n - 1)) : 0
                ZStack(alignment: .topLeading) {
                    ForEach(h) { k in
                        let v = valgt.contains(k.id)
                        spillkort(k, w: w, h: 92)
                            .overlay(v ? RoundedRectangle(cornerRadius: 8).stroke(gul, lineWidth: 3) : nil)
                            .offset(x: CGFloat(k.id) * steg, y: v ? -16 : 0)
                            .onTapGesture { if d.minTur { withAnimation(.spring(response: 0.25, dampingFraction: 0.7)) { if v { valgt.remove(k.id) } else { valgt.insert(k.id) } } } }
                    }
                }.frame(maxWidth: .infinity, alignment: .leading)
            }.frame(height: 118).padding(.top, 8)
        } else {
            Text(d.handTekst).font(.archivo(14, vekt: 600)).opacity(0.7)
        }
    }

    /// Legg / Pass – gyldigheten regnes her, med samme regel som nettsiden
    @ViewBuilder private func knapper(_ d: PrData) -> some View {
        if d.minTur, let h = d.hand {
            let sv = h.filter { valgt.contains($0.id) }
            let gyldig = !sv.isEmpty && sv.allSatisfy { $0.v == sv[0].v } && (d.bordAntall == 0 || (sv.count == d.bordAntall && sv[0].rang > d.bordRang))
            let tekst = gyldig ? (d.t["legg"] ?? "Legg") + " \(sv.count) × " + sv[0].v : !sv.isEmpty ? (d.t["ugyldig"] ?? "") : d.bordAntall > 0 ? (d.t["velgOver"] ?? "") : (d.t["velgKort"] ?? "")
            HStack(spacing: 10) {
                Button(action: {
                    let ider = sv.map { String($0.id) }.joined(separator: ",")
                    valgt = []
                    m.trykk("pr-legg", ["kort": ider])
                }) {
                    Text(tekst.uppercased()).font(.archivo(17, vekt: 900)).lineLimit(1).minimumScaleFactor(0.7).frame(maxWidth: .infinity).frame(height: 58)
                        .foregroundColor(morkBlekk)
                        .background(RoundedRectangle(cornerRadius: 12).fill(gyldig ? gul : kort.opacity(0.6))).overlay(RoundedRectangle(cornerRadius: 12).stroke(morkBlekk, lineWidth: 3))
                        .background(RoundedRectangle(cornerRadius: 12).fill(morkBlekk).offset(x: gyldig ? 4 : 0, y: gyldig ? 4 : 0))
                }.buttonStyle(.plain).disabled(!gyldig)
                Button(action: { valgt = []; m.trykk("pass") }) {
                    Text("PASS").font(.archivo(17, vekt: 900)).frame(width: 96, height: 58).foregroundColor(morkBlekk)
                        .background(RoundedRectangle(cornerRadius: 12).fill(d.kanPasse ? oransje : kort.opacity(0.6))).overlay(RoundedRectangle(cornerRadius: 12).stroke(morkBlekk, lineWidth: 3))
                        .background(RoundedRectangle(cornerRadius: 12).fill(morkBlekk).offset(x: d.kanPasse ? 4 : 0, y: d.kanPasse ? 4 : 0))
                }.buttonStyle(.plain).disabled(!d.kanPasse)
            }
        } else {
            HStack(spacing: 8) {
                Text(d.handTekst.isEmpty ? d.chip : d.handTekst).font(.archivo(14, vekt: 600)).opacity(0.7)
                if !d.vertPass.isEmpty {
                    Button(action: { m.trykk("pass") }) { Text(d.vertPass).font(.archivo(14, vekt: 700)).underline().opacity(0.8) }.buttonStyle(.plain)
                }
            }
        }
    }

    /// Slutten: titlene i rekkefølge med hva hver skal drikke eller dele ut
    private func titler(_ d: PrData) -> some View {
        VStack(spacing: 8) {
            ForEach(d.titler) { x in
                HStack(spacing: 10) {
                    hode(x.png).frame(width: 34, height: 38)
                    VStack(alignment: .leading, spacing: 1) {
                        Text(x.navn).font(.archivo(15, vekt: 900))
                        Text(x.plass).font(.archivo(12, vekt: 700)).opacity(0.7)
                    }
                    Spacer()
                    if !x.em.isEmpty { Text(x.em).font(.archivo(14, vekt: 900)) }
                }
                .padding(.horizontal, 12).padding(.vertical, 8).foregroundColor(morkBlekk)
                .background(RoundedRectangle(cornerRadius: 10).fill(Color(hex: x.farge))).overlay(RoundedRectangle(cornerRadius: 10).stroke(morkBlekk, lineWidth: 2.5))
            }
        }
    }
}
