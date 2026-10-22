import SwiftUI
import UIKit
import WebKit

/// Veddeløpet som native skjerm: fire ess galopperer på grønn bane, sidekortene snus ett og ett, du vedder på en bane
/// og setter innsats. Nettsiden under holder tilstanden, klokka, musikken og kommentatoren (rom.js vlData) –
/// denne skjermen tegner, og trykkene går tilbake til nettsidens egne knapper (window.__mvLek.trykk).
struct VlSide: Identifiable { let id: Int; let snudd: Bool; let v: String; let f: String; let rod: Bool }
struct VlHode: Identifiable { let id: String; let png: String; let oi: Bool }
struct VlBane: Identifiable { let id: String; let navn: String; let pos: Int; let rod: Bool; let valgt: Bool; let vant: Bool; let hoder: [VlHode] }

struct VlData {
    let fase: String, runde: Int, naa: Double
    let tittel: String, chip: String, hjelp: String
    let sider: [VlSide], baner: [VlBane]
    let sats: Int, satsTekst: String, status: String, statusHoder: [VlHode]
    let frist: Double, fristTekst: String, start: String
    let sist: [String: Any], dom: [String: Any]
    let slutt: [[String: Any]]
    let stua: String, mer: String

    init(_ d: [String: Any]) {
        fase = d["fase"] as? String ?? ""; runde = (d["runde"] as? NSNumber)?.intValue ?? 1; naa = (d["naa"] as? NSNumber)?.doubleValue ?? 0
        tittel = d["tittel"] as? String ?? ""; chip = d["chip"] as? String ?? ""; hjelp = d["hjelp"] as? String ?? ""
        sider = (d["sider"] as? [[String: Any]] ?? []).enumerated().map { i, s in
            VlSide(id: i, snudd: s["snudd"] as? Bool ?? false, v: s["v"] as? String ?? "", f: s["f"] as? String ?? "", rod: s["rod"] as? Bool ?? false)
        }
        func hoder(_ l: Any?) -> [VlHode] { (l as? [[String: Any]] ?? []).map { VlHode(id: $0["id"] as? String ?? "", png: $0["png"] as? String ?? "", oi: $0["oi"] as? Bool ?? false) } }
        baner = (d["baner"] as? [[String: Any]] ?? []).map { b in
            VlBane(id: b["f"] as? String ?? "", navn: b["navn"] as? String ?? "", pos: (b["pos"] as? NSNumber)?.intValue ?? 0, rod: b["rod"] as? Bool ?? false,
                   valgt: b["valgt"] as? Bool ?? false, vant: b["vant"] as? Bool ?? false, hoder: hoder(b["hoder"]))
        }
        sats = (d["sats"] as? NSNumber)?.intValue ?? 2; satsTekst = d["satsTekst"] as? String ?? ""
        status = d["status"] as? String ?? ""; statusHoder = hoder(d["statusHoder"])
        frist = (d["frist"] as? NSNumber)?.doubleValue ?? 0; fristTekst = d["fristTekst"] as? String ?? ""; start = d["start"] as? String ?? ""
        sist = d["sist"] as? [String: Any] ?? [:]; dom = d["dom"] as? [String: Any] ?? [:]
        slutt = d["slutt"] as? [[String: Any]] ?? []
        stua = d["stua"] as? String ?? "Stua"; mer = d["mer"] as? String ?? "Mer"
    }
}

final class VlModell: ObservableObject {
    @Published var d: VlData? = nil
    /// Knappene på slutten (Spill igjen, Velg en annen lek …) kommer som blokker og tegnes av BlokkListe
    let blokker = KortModell()
    private(set) var avvik: Double = 0
    weak var nett: WKWebView? { didSet { blokker.nett = nett } }
    private var bilder: [String: UIImage] = [:]

    func sett(_ dict: [String: Any]) {
        let ny = VlData(dict)
        if ny.naa > 0 { avvik = ny.naa - Date().timeIntervalSince1970 * 1000 }
        blokker.sett(["blokker": ny.slutt, "naa": dict["naa"] ?? 0])
        d = ny
    }
    func igjen(_ frist: Double) -> Int { max(0, Int(ceil((frist - 1500 - (Date().timeIntervalSince1970 * 1000 + avvik)) / 1000))) }
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

struct VeddelopSkjerm: View {
    @ObservedObject var m: VlModell
    @Environment(\.colorScheme) private var modus
    private var papir: Color { modus == .dark ? Color(red: 0.11, green: 0.106, blue: 0.122) : Color(red: 1, green: 0.973, blue: 0.933) }
    private var kort: Color { modus == .dark ? Color(red: 0.173, green: 0.169, blue: 0.188) : .white }
    private var blekk: Color { modus == .dark ? Color(red: 1, green: 0.973, blue: 0.933) : Color(red: 0.086, green: 0.071, blue: 0.059) }
    private let gul = Color(red: 1, green: 0.824, blue: 0.247)
    private let oransje = Color(red: 1, green: 0.357, blue: 0.122)
    private let rust = Color(red: 0.776, green: 0.235, blue: 0.067)
    private let mint = Color(red: 0.388, green: 0.886, blue: 0.659)
    private let morkBlekk = Color(red: 0.086, green: 0.071, blue: 0.059)
    private let gress = Color(red: 0.184, green: 0.42, blue: 0.227)
    private let sand = Color(red: 0.914, green: 0.875, blue: 0.788)
    private let kortRod = Color(red: 0.843, green: 0.149, blue: 0.239)
    private let lys = Color(red: 1, green: 0.973, blue: 0.933)

    var body: some View {
        ZStack {
            papir.ignoresSafeArea()
            if let d = m.d {
                VStack(spacing: 0) {
                    topp(d)
                    VStack(alignment: .leading, spacing: 12) {
                            if !d.hjelp.isEmpty { Text(d.hjelp).font(.archivo(15, vekt: 800)).opacity(0.65) }
                            banen(d)
                            if d.fase == "vedd" { vedd(d) }
                            if !d.sist.isEmpty { sist(d) }
                            if d.fase == "ferdig" { ferdig(d) }
                            Spacer(minLength: 0)
                        }.padding(.horizontal, 16).padding(.bottom, 12)
                }
            }
        }
        .foregroundColor(blekk)
    }

    private func topp(_ d: VlData) -> some View {
        HStack(spacing: 8) {
            VStack(alignment: .leading, spacing: 1) {
                Text(d.tittel).font(.archivo(12, vekt: 700)).opacity(0.65)
                Text(d.chip).font(.archivo(16, vekt: 900)).foregroundColor(d.fase == "vedd" ? rust : blekk)
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

    // MARK: Banen – grønt gress, sidekortene øverst, fire baner under
    private func banen(_ d: VlData) -> some View {
        VStack(spacing: 8) {
            GeometryReader { g in
                let steg = (g.size.width - 60) / 8
                ZStack(alignment: .topLeading) {
                    ForEach(d.sider) { s in
                        sidekort(s).frame(width: 26, height: 38).offset(x: 9 + CGFloat(s.id + 1) * steg - 13)
                    }
                }
            }.frame(height: 40)
            VStack(spacing: 6) {
                ForEach(d.baner) { b in
                    if d.fase == "vedd" {
                        Button(action: { m.trykk("vl-vedd", ["farge": b.id]) }) { bane(b, d) }.buttonStyle(.plain)
                    } else { bane(b, d) }
                }
            }
        }
        .padding(10)
        .background(RoundedRectangle(cornerRadius: 12).fill(gress))
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(morkBlekk, lineWidth: 3))
        .background(RoundedRectangle(cornerRadius: 12).fill(morkBlekk).offset(x: 5, y: 5))
    }

    /// Sidekortet: rød bakside, snus til framsiden når det er trukket
    private func sidekort(_ s: VlSide) -> some View {
        ZStack {
            RoundedRectangle(cornerRadius: 5).fill(kortRod).overlay(RoundedRectangle(cornerRadius: 5).stroke(morkBlekk, lineWidth: 2.5))
                .opacity(s.snudd ? 0 : 1)
            RoundedRectangle(cornerRadius: 5).fill(Color.white).overlay(RoundedRectangle(cornerRadius: 5).stroke(morkBlekk, lineWidth: 2.5))
                .overlay(Text(s.f).font(.system(size: 15, weight: .black)).foregroundColor(s.rod ? kortRod : morkBlekk))
                .opacity(s.snudd ? 1 : 0)
        }
        .rotation3DEffect(.degrees(s.snudd ? 0 : 180), axis: (x: 0, y: 1, z: 0))
        .animation(.spring(response: 0.5, dampingFraction: 0.7), value: s.snudd)
    }

    /// Én bane: hesten (et ess) rykker fram, målstreken, rosett til vinneren, hodene til dem som veddet
    private func bane(_ b: VlBane, _ d: VlData) -> some View {
        GeometryReader { g in
            let steg = (g.size.width - 80) / 8
            ZStack(alignment: .leading) {
                RoundedRectangle(cornerRadius: 8).fill(b.vant ? mint : b.valgt ? Color(red: 1, green: 0.945, blue: 0.722) : sand)
                RoundedRectangle(cornerRadius: 8).stroke(morkBlekk, lineWidth: 3)
                if b.valgt && !b.vant { RoundedRectangle(cornerRadius: 8).stroke(gul, lineWidth: 4).padding(-4) }
                // målstreken
                VStack(spacing: 0) { ForEach(0..<5, id: \.self) { i in Rectangle().fill(i % 2 == 0 ? lys : morkBlekk) } }
                    .frame(width: 4).padding(.vertical, 4).offset(x: g.size.width - 44)
                hest(b, lop: d.fase == "lop")
                    .offset(x: 6 + CGFloat(min(8, b.pos)) * steg)
                    .animation(.spring(response: 0.52, dampingFraction: 0.72), value: b.pos)
                if b.vant {
                    Text("1").font(.archivo(16, vekt: 900)).frame(width: 34, height: 34).foregroundColor(morkBlekk)
                        .background(Circle().fill(gul)).overlay(Circle().stroke(morkBlekk, lineWidth: 3))
                        .offset(x: g.size.width - 48 - 34)
                        .transition(.scale.combined(with: .opacity))
                }
                HStack { Spacer(); VStack(spacing: -10) { ForEach(b.hoder) { h in hode(h) } }.padding(.trailing, 4) }
            }
        }
        .frame(height: 56)
    }

    private func hode(_ h: VlHode) -> some View {
        Group {
            if let img = m.bilde(h.png) { Image(uiImage: img).resizable().aspectRatio(contentMode: .fit) }
            else { Circle().fill(gul).overlay(Circle().stroke(morkBlekk, lineWidth: 2)) }
        }
        .frame(width: 24, height: 26).opacity(h.oi ? 0.8 : 1)
    }

    /// Hesten: et ess i fargen, galopperer under løpet
    private func hest(_ b: VlBane, lop: Bool) -> some View {
        TimelineView(.periodic(from: .now, by: 0.05)) { tl in
            let t = tl.date.timeIntervalSince1970
            let hopp = lop ? CGFloat(abs(sin(t * .pi * 2))) * -4 : 0
            let vink = lop ? sin(t * .pi * 2 + 0.6) * 5 : 0
            VStack(spacing: 1) {
                Text("A").font(.system(size: 13, weight: .black))
                Text(b.id).font(.system(size: 20, weight: .black))
            }
            .frame(width: 32, height: 44).foregroundColor(b.rod ? kortRod : morkBlekk)
            .background(RoundedRectangle(cornerRadius: 5).fill(Color.white)).overlay(RoundedRectangle(cornerRadius: 5).stroke(morkBlekk, lineWidth: 2.5))
            .rotationEffect(.degrees(vink)).offset(y: hopp)
        }
    }

    // MARK: Vedding – innsats, hvem har veddet, frist, vertens «Start løpet nå»
    @ViewBuilder private func vedd(_ d: VlData) -> some View {
        HStack(spacing: 12) {
            Text(d.satsTekst.uppercased()).font(.archivo(15, vekt: 900)).frame(maxWidth: .infinity, alignment: .leading)
            satsKnapp("−", lys) { m.trykk("vl-sats", ["d": "-1"]) }
            Text("\(d.sats)").font(.archivo(40, vekt: 900)).frame(width: 52)
            satsKnapp("+", gul) { m.trykk("vl-sats", ["d": "1"]) }
        }
        .padding(.horizontal, 12).padding(.vertical, 10)
        .background(RoundedRectangle(cornerRadius: 10).fill(kort))
        .overlay(RoundedRectangle(cornerRadius: 10).stroke(blekk, lineWidth: 3))
        .background(RoundedRectangle(cornerRadius: 10).fill(Color.black).offset(x: 4, y: 4))
        HStack(spacing: 10) {
            HStack(spacing: -8) { ForEach(d.statusHoder) { h in hode(h).frame(width: 30, height: 32) } }
            Text(d.status).font(.archivo(14, vekt: 800))
        }
        if d.frist > 0 {
            TimelineView(.periodic(from: .now, by: 1)) { _ in
                Text("\(m.igjen(d.frist)) \(d.fristTekst)").font(.archivo(13, vekt: 700)).opacity(0.65)
            }
        }
        if !d.start.isEmpty { stor(d.start) { m.trykk("vl-start") } }
    }

    private func satsKnapp(_ t: String, _ farge: Color, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(t).font(.archivo(26, vekt: 900)).frame(width: 48, height: 48).foregroundColor(morkBlekk)
                .background(RoundedRectangle(cornerRadius: 8).fill(farge)).overlay(RoundedRectangle(cornerRadius: 8).stroke(morkBlekk, lineWidth: 3))
                .background(RoundedRectangle(cornerRadius: 8).fill(morkBlekk).offset(x: 3, y: 3))
        }.buttonStyle(.plain)
    }

    private func stor(_ t: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(t.uppercased()).font(.archivo(18, vekt: 900)).frame(maxWidth: .infinity).frame(height: 60).foregroundColor(morkBlekk)
                .background(RoundedRectangle(cornerRadius: 14).fill(gul)).overlay(RoundedRectangle(cornerRadius: 14).stroke(morkBlekk, lineWidth: 3))
                .background(RoundedRectangle(cornerRadius: 14).fill(morkBlekk).offset(x: 4, y: 4))
        }.buttonStyle(.plain)
    }

    // MARK: Siste trekk – kortet og «Hjerter rykker fram»
    private func sist(_ d: VlData) -> some View {
        let v = d.sist["v"] as? String ?? "", f = d.sist["f"] as? String ?? "", rod = d.sist["rod"] as? Bool ?? false
        return HStack(spacing: 14) {
            VStack(spacing: 0) {
                Text(v).font(.system(size: 14, weight: .black)).frame(maxWidth: .infinity, alignment: .leading)
                Text(f).font(.system(size: 22, weight: .black))
                Text(v).font(.system(size: 14, weight: .black)).frame(maxWidth: .infinity, alignment: .trailing).rotationEffect(.degrees(180))
            }
            .padding(5).frame(width: 44, height: 60).foregroundColor(rod ? kortRod : morkBlekk)
            .background(RoundedRectangle(cornerRadius: 6).fill(Color.white)).overlay(RoundedRectangle(cornerRadius: 6).stroke(morkBlekk, lineWidth: 2.5))
            Text((d.sist["tekst"] as? String ?? "").uppercased()).font(.archivo(20, vekt: 900))
        }
        .id("\(d.runde)-\(v)\(f)")
        .transition(.move(edge: .leading).combined(with: .opacity))
    }

    // MARK: Mål – dommen (vant/tapte) og hva nå
    @ViewBuilder private func ferdig(_ d: VlData) -> some View {
        if let t = d.dom["tekst"] as? String, !t.isEmpty {
            let rett = d.dom["rett"] as? Bool ?? false
            Text(t).font(.archivo(22, vekt: 900)).multilineTextAlignment(.center).frame(maxWidth: .infinity).padding(16)
                .foregroundColor(morkBlekk)
                .background(RoundedRectangle(cornerRadius: 14).fill(rett ? mint : oransje))
                .overlay(RoundedRectangle(cornerRadius: 14).stroke(morkBlekk, lineWidth: 3))
                .background(RoundedRectangle(cornerRadius: 14).fill(morkBlekk).offset(x: 4, y: 4))
        }
        BlokkListe(m: m.blokker)
    }
}
