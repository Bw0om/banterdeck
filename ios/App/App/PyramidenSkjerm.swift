import SwiftUI
import UIKit
import WebKit

/// Pyramiden som native skjerm: mørk filt og messing. Pyramiden av kort snus nedenfra og opp, vinduet renner ut,
/// påstandene kommer inn med hodet og LØGN!-knappen, og kortene dine ligger med baksiden opp – hold fingeren på dem
/// for å kikke. Nettsiden under holder tilstanden, klokka og lyden (rom.js pyData); trykkene går tilbake dit.
struct PyKort: Identifiable { let id: Int; let v: String; let f: String; let rod: Bool; let snudd: Bool; let naa: Bool; let n: String }
struct PyRad: Identifiable { let id: Int; let naa: Bool; let kort: [PyKort] }
struct PyPast: Identifiable { let id: String; let navn: String; let png: String; let tekst: String; let domm: String; let kanLogn: Bool }
struct PyHand: Identifiable { let id: String; let navn: String; let png: String; let kort: [PyKort]; let tom: String }

struct PyData {
    let ferdig: Bool, tittel: String, chip: String, igjen: String, naa: Double, vindu: Double, snuddVed: Double
    let rader: [PyRad], pastander: [PyPast], tom: String
    let hand: [PyKort]?, handTekst: String, velgTekst: String, legg: String, avbryt: String, lagt: Bool, kanLegge: Bool
    let avsl: [String: Any], best: String, bestNavn: String, bestTekst: String, hender: [PyHand]
    let slutt: [[String: Any]], stua: String, mer: String

    init(_ d: [String: Any]) {
        func s(_ k: String) -> String { d[k] as? String ?? "" }
        func b(_ k: String) -> Bool { d[k] as? Bool ?? false }
        func n(_ k: String) -> Double { (d[k] as? NSNumber)?.doubleValue ?? 0 }
        func kort(_ l: Any?) -> [PyKort] {
            (l as? [[String: Any]] ?? []).enumerated().map { i, k in
                PyKort(id: (k["i"] as? NSNumber)?.intValue ?? i, v: k["v"] as? String ?? "", f: k["f"] as? String ?? "", rod: k["rod"] as? Bool ?? false, snudd: k["snudd"] as? Bool ?? true, naa: k["naa"] as? Bool ?? false, n: k["n"] as? String ?? "")
            }
        }
        ferdig = b("ferdig"); tittel = s("tittel"); chip = s("chip"); igjen = s("igjen"); naa = n("naa"); vindu = n("vindu"); snuddVed = n("snuddVed")
        rader = (d["rader"] as? [[String: Any]] ?? []).map { r in PyRad(id: (r["rad"] as? NSNumber)?.intValue ?? 0, naa: r["naa"] as? Bool ?? false, kort: kort(r["kort"])) }
        pastander = (d["pastander"] as? [[String: Any]] ?? []).map { p in
            PyPast(id: p["id"] as? String ?? "", navn: p["navn"] as? String ?? "", png: p["png"] as? String ?? "", tekst: p["tekst"] as? String ?? "", domm: p["domm"] as? String ?? "", kanLogn: p["kanLogn"] as? Bool ?? false)
        }
        tom = s("tom")
        hand = d["hand"] is NSNull || d["hand"] == nil ? nil : kort(d["hand"])
        handTekst = s("handTekst"); velgTekst = s("velgTekst"); legg = s("legg"); avbryt = s("avbryt"); lagt = b("lagt"); kanLegge = b("kanLegge")
        avsl = d["avsl"] as? [String: Any] ?? [:]
        best = s("best"); bestNavn = s("bestNavn"); bestTekst = s("bestTekst")
        hender = (d["hender"] as? [[String: Any]] ?? []).map { h in PyHand(id: h["id"] as? String ?? "", navn: h["navn"] as? String ?? "", png: h["png"] as? String ?? "", kort: kort(h["kort"]), tom: h["tom"] as? String ?? "") }
        slutt = d["slutt"] as? [[String: Any]] ?? []; stua = d["stua"] as? String ?? "Stua"; mer = d["mer"] as? String ?? "Mer"
    }
}

final class PyModell: ObservableObject {
    @Published var d: PyData? = nil
    let blokker = KortModell()
    private(set) var avvik: Double = 0
    weak var nett: WKWebView? { didSet { blokker.nett = nett } }
    private var bilder: [String: UIImage] = [:]
    func sett(_ dict: [String: Any]) {
        let ny = PyData(dict)
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

struct PyramidenSkjerm: View {
    @ObservedObject var m: PyModell
    @Environment(\.colorScheme) private var modus
    @State private var kikk = false
    @State private var velg = false
    private var papir: Color { modus == .dark ? Color(red: 0.11, green: 0.106, blue: 0.122) : Color(red: 1, green: 0.973, blue: 0.933) }
    private var kort: Color { modus == .dark ? Color.white.opacity(0.07) : .white }
    private var blekk: Color { modus == .dark ? Color(red: 1, green: 0.973, blue: 0.933) : Color(red: 0.086, green: 0.071, blue: 0.059) }
    private let gul = Color(red: 1, green: 0.824, blue: 0.247)
    private let oransje = Color(red: 1, green: 0.357, blue: 0.122)
    private let rust = Color(red: 0.776, green: 0.235, blue: 0.067)
    private let mint = Color(red: 0.388, green: 0.886, blue: 0.659)
    private let morkBlekk = Color(red: 0.086, green: 0.071, blue: 0.059)
    private let krem = Color(red: 0.957, green: 0.922, blue: 0.867)
    private let vin = Color(red: 0.353, green: 0.106, blue: 0.149)
    private let vinMork = Color(red: 0.102, green: 0.039, blue: 0.055)
    private let messing = Color(red: 0.788, green: 0.635, blue: 0.29)
    private let kortRod = Color(red: 0.843, green: 0.149, blue: 0.239)

    var body: some View {
        ZStack {
            papir.ignoresSafeArea(edges: [.top, .horizontal])
            if let d = m.d {
                VStack(spacing: 0) {
                    topp(d)
                    ScrollView {
                        VStack(alignment: .leading, spacing: 12) {
                            bord(d)
                            if d.ferdig { BlokkListe(m: m.blokker) }
                        }.padding(.horizontal, 16).padding(.bottom, 24)
                    }
                }
                if !d.avsl.isEmpty { avsl(d.avsl) }
            }
        }
        .foregroundColor(blekk)
        .onChange(of: m.d?.lagt) { _ in velg = false }
    }

    private func topp(_ d: PyData) -> some View {
        HStack(spacing: 8) {
            Spacer()
            liten(d.stua, "sofa.fill") { m.trykk("stua-ark") }
            liten(d.mer, "ellipsis") { m.trykk("mer-ark") }
        }
        .padding(.horizontal, 16).padding(.top, 6).padding(.bottom, 2)
    }

    private func liten(_ t: String, _ sym: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: 5) { Image(systemName: sym).font(.system(size: 13, weight: .bold)); Text(t).font(.archivo(13, vekt: 800)) }
                .padding(.horizontal, 11).frame(height: 34)
                .background(Capsule().fill(kort)).overlay(Capsule().stroke(blekk, lineWidth: 2))
        }.buttonStyle(.plain)
    }

    // MARK: Bordet – alt ligger på den mørke filten
    private func bord(_ d: PyData) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .firstTextBaseline, spacing: 8) {
                Text(d.tittel.uppercased()).font(.archivo(11, vekt: 900)).foregroundColor(messing)
                Text(d.chip).font(.archivo(17, vekt: 900)).foregroundColor(krem)
                Spacer()
                if !d.igjen.isEmpty { Text(d.igjen).font(.archivo(12, vekt: 700)).foregroundColor(krem.opacity(0.7)) }
            }
            pyramide(d)
            if d.ferdig {
                slutt(d)
            } else {
                vindu(d)
                pastander(d)
                hand(d)
            }
        }
        .padding(14).padding(.bottom, 4)
        .background(RoundedRectangle(cornerRadius: 18).fill(RadialGradient(colors: [vin, Color(red: 0.204, green: 0.063, blue: 0.102), vinMork], center: UnitPoint(x: 0.5, y: 0.22), startRadius: 20, endRadius: 520)))
        .overlay(RoundedRectangle(cornerRadius: 18).stroke(morkBlekk, lineWidth: 3))
        .background(RoundedRectangle(cornerRadius: 18).fill(morkBlekk).offset(x: 5, y: 5))
    }

    /// Pyramiden: fem rader, radnummeret til venstre, kortet som gjelder nå er markert
    private func pyramide(_ d: PyData) -> some View {
        VStack(spacing: 5) {
            ForEach(d.rader) { r in
                HStack(spacing: 5) {
                    Text("\(r.id)").font(.archivo(12, vekt: 900)).foregroundColor(r.naa ? gul : messing.opacity(0.7)).frame(width: 16)
                    ForEach(r.kort) { k in
                        ZStack(alignment: .topTrailing) {
                            spillkort(k, w: 34, h: 48, apen: k.snudd)
                                .overlay(k.naa ? RoundedRectangle(cornerRadius: 5).stroke(gul, lineWidth: 3).padding(-3) : nil)
                            if !k.n.isEmpty {
                                Text(k.n).font(.archivo(10, vekt: 900)).foregroundColor(morkBlekk).frame(width: 18, height: 18)
                                    .background(Circle().fill(gul)).overlay(Circle().stroke(morkBlekk, lineWidth: 1.5)).offset(x: 7, y: -7)
                            }
                        }
                        .rotation3DEffect(.degrees(k.snudd ? 0 : 180), axis: (x: 0, y: 1, z: 0))
                        .animation(.spring(response: 0.5, dampingFraction: 0.75), value: k.snudd)
                    }
                    Spacer(minLength: 0)
                }
            }
        }
    }

    /// Et spillkort: åpent med verdi og farge, ellers rutete bakside i vinrødt og messing
    private func spillkort(_ k: PyKort, w: CGFloat, h: CGFloat, apen: Bool) -> some View {
        ZStack {
            if apen {
                RoundedRectangle(cornerRadius: w * 0.14).fill(krem)
                VStack(spacing: 0) {
                    Text(k.v).font(.system(size: w * 0.42, weight: .black))
                    Text(k.f).font(.system(size: w * 0.4, weight: .black))
                }.foregroundColor(k.rod ? kortRod : vinMork)
            } else {
                RoundedRectangle(cornerRadius: w * 0.14).fill(Color(red: 0.165, green: 0.039, blue: 0.071))
                RoundedRectangle(cornerRadius: w * 0.14).stroke(messing.opacity(0.5), lineWidth: 1.5).padding(4)
                Text("♦").font(.system(size: w * 0.35)).foregroundColor(messing.opacity(0.4))
            }
            RoundedRectangle(cornerRadius: w * 0.14).stroke(apen ? vinMork : messing, lineWidth: 2)
        }
        .frame(width: w, height: h)
    }

    /// Vinduet: hvor lenge det er igjen før neste kort snus (servertid, nettsiden snur)
    private func vindu(_ d: PyData) -> some View {
        TimelineView(.periodic(from: .now, by: 0.2)) { _ in
            let andel = d.vindu > 0 ? max(0, min(1, 1 - (m.naaMs() - d.snuddVed) / d.vindu)) : 0
            GeometryReader { g in
                ZStack(alignment: .leading) {
                    Capsule().fill(messing.opacity(0.22))
                    Capsule().fill(messing).frame(width: g.size.width * CGFloat(andel))
                }
            }.frame(height: 4)
        }
    }

    /// Påstandene: hvem la på, hva de sier, og LØGN!
    @ViewBuilder private func pastander(_ d: PyData) -> some View {
        if d.pastander.isEmpty {
            Text(d.tom).font(.archivo(14, vekt: 600)).foregroundColor(krem.opacity(0.75))
        } else {
            VStack(spacing: 8) {
                ForEach(d.pastander) { p in
                    HStack(spacing: 10) {
                        hode(p.png).frame(width: 36, height: 40)
                        VStack(alignment: .leading, spacing: 1) {
                            Text(p.navn).font(.archivo(14, vekt: 900)).foregroundColor(krem)
                            Text(p.tekst).font(.archivo(12, vekt: 600)).foregroundColor(krem.opacity(0.75)).fixedSize(horizontal: false, vertical: true)
                        }
                        Spacer()
                        if !p.domm.isEmpty {
                            Text(p.domm.uppercased()).font(.archivo(12, vekt: 900)).foregroundColor(morkBlekk).padding(.horizontal, 9).padding(.vertical, 4)
                                .background(Capsule().fill(p.domm.lowercased().hasPrefix("s") ? mint : oransje))
                        } else if p.kanLogn {
                            Button(action: { m.trykk("utfordre", ["paa": p.id]) }) {
                                Text("LØGN!").font(.archivo(14, vekt: 900)).foregroundColor(morkBlekk).padding(.horizontal, 12).frame(height: 38)
                                    .background(RoundedRectangle(cornerRadius: 9).fill(oransje)).overlay(RoundedRectangle(cornerRadius: 9).stroke(morkBlekk, lineWidth: 2.5))
                                    .background(RoundedRectangle(cornerRadius: 9).fill(morkBlekk).offset(x: 3, y: 3))
                            }.buttonStyle(.plain)
                        }
                    }
                    .padding(.horizontal, 10).padding(.vertical, 8)
                    .background(RoundedRectangle(cornerRadius: 10).fill(Color.white.opacity(0.06)))
                    .transition(.move(edge: .bottom).combined(with: .opacity))
                }
            }
        }
    }

    private func hode(_ png: String) -> some View {
        Group {
            if let img = m.bilde(png) { Image(uiImage: img).resizable().aspectRatio(contentMode: .fit) }
            else { Circle().fill(gul).overlay(Circle().stroke(morkBlekk, lineWidth: 2)) }
        }
    }

    // MARK: Hånda – baksiden opp; hold fingeren på for å kikke, «Legg på et kort» → velg et
    @ViewBuilder private func hand(_ d: PyData) -> some View {
        if let h = d.hand, !h.isEmpty {
            Text(velg ? d.velgTekst : d.handTekst).font(.archivo(12, vekt: 800)).foregroundColor(messing).textCase(.uppercase)
            GeometryReader { g in
                let n = h.count, w: CGFloat = 70, steg = n > 1 ? min(w + 8, (g.size.width - w) / CGFloat(n - 1)) : 0
                ZStack(alignment: .topLeading) {
                    ForEach(h) { k in
                        spillkort(k, w: w, h: 104, apen: kikk || velg)
                            .rotationEffect(.degrees(Double(k.id) - Double(n - 1) / 2) * 3, anchor: .bottom)
                            .offset(x: CGFloat(k.id) * steg, y: velg ? -8 : 0)
                            .onTapGesture { if velg { m.trykk("py-legg", ["i": String(k.id)]) } }
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .contentShape(Rectangle())
                .simultaneousGesture(DragGesture(minimumDistance: 0).onChanged { _ in if !velg && !kikk { kikk = true } }.onEnded { _ in kikk = false })
            }
            .frame(height: 112)
            Button(action: { withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) { velg.toggle() } }) {
                Text((velg ? d.avbryt : d.legg).uppercased()).font(.archivo(16, vekt: 900)).frame(maxWidth: .infinity).frame(height: 52)
                    .foregroundColor(velg ? krem : morkBlekk)
                    .background(RoundedRectangle(cornerRadius: 12).fill(velg ? Color.white.opacity(0.1) : d.lagt ? messing.opacity(0.4) : messing))
                    .overlay(RoundedRectangle(cornerRadius: 12).stroke(velg ? messing : morkBlekk, lineWidth: 2.5))
            }.buttonStyle(.plain).disabled(d.lagt || !d.kanLegge)
        } else {
            Text(d.handTekst).font(.archivo(13, vekt: 700)).foregroundColor(krem.opacity(0.8))
        }
    }

    // MARK: LØGN! ropt – kortet snus stort for alle i et øyeblikk
    private func avsl(_ a: [String: Any]) -> some View {
        let k = a["kort"] as? [String: Any] ?? [:]
        let kortet = PyKort(id: 0, v: k["v"] as? String ?? "", f: k["f"] as? String ?? "", rod: k["rod"] as? Bool ?? false, snudd: true, naa: false, n: "")
        let sant = a["sant"] as? Bool ?? false
        return ZStack {
            Color.black.opacity(0.55).ignoresSafeArea()
            VStack(spacing: 12) {
                Text(a["over"] as? String ?? "").font(.archivo(14, vekt: 800)).foregroundColor(krem).multilineTextAlignment(.center)
                spillkort(kortet, w: 110, h: 160, apen: true)
                Text((a["domm"] as? String ?? "").uppercased()).font(.archivo(22, vekt: 900)).foregroundColor(morkBlekk).padding(.horizontal, 14).padding(.vertical, 6)
                    .background(Capsule().fill(sant ? mint : oransje))
                Text(a["tekst"] as? String ?? "").font(.archivo(16, vekt: 900)).foregroundColor(krem).multilineTextAlignment(.center)
            }
            .padding(24)
            .background(RoundedRectangle(cornerRadius: 20).fill(vin)).overlay(RoundedRectangle(cornerRadius: 20).stroke(messing, lineWidth: 3))
            .padding(28)
        }
        .transition(.scale(scale: 0.9).combined(with: .opacity))
    }

    // MARK: Slutten – største bløffer og hendene
    @ViewBuilder private func slutt(_ d: PyData) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(d.best.uppercased()).font(.archivo(11, vekt: 900)).foregroundColor(messing)
            Text(d.bestNavn).font(.archivo(26, vekt: 900)).foregroundColor(krem)
            if !d.bestTekst.isEmpty { Text(d.bestTekst).font(.archivo(13, vekt: 600)).foregroundColor(krem.opacity(0.75)) }
        }
        ForEach(d.hender) { h in
            HStack(spacing: 10) {
                hode(h.png).frame(width: 32, height: 36)
                Text(h.navn).font(.archivo(14, vekt: 900)).foregroundColor(krem).frame(width: 70, alignment: .leading)
                if h.kort.isEmpty { Text(h.tom).font(.archivo(12, vekt: 600)).foregroundColor(krem.opacity(0.7)) }
                else { HStack(spacing: 4) { ForEach(h.kort) { k in spillkort(k, w: 26, h: 36, apen: true) } } }
                Spacer()
            }
        }
    }
}
