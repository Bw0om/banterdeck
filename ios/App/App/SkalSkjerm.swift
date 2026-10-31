import SwiftUI
import UIKit
import WebKit

/// Skålsprinten som native skjerm: hele flaten er knappen, glasset bobler mens dere venter, og i SKÅL-øyeblikket
/// (regnet ut fra servertiden, som nettsiden gjør) blir flaten gul og glass nummer to klinker inn. Trykket går til
/// nettsidens sk-trykk, som måler reaksjonstiden. Lista etter hver skål og summen til slutt kommer fra rom.js skData.
struct SkHode: Identifiable { let id: String; let navn: String; let png: String }
struct SkRad: Identifiable { let id: String; let navn: String; let png: String; let tekst: String; let bredde: Double; let kl: String; let stripe: Bool; let oi: Bool }
struct SkMitt { let tidlig: Bool, tekst: String }
struct SkVent { let tekst: String, skal: String, mitt: SkMitt?, hint: String, folk: [SkHode], status: String }

struct SkData {
    let fase: String, tid: Double, nr: Int, antall: Int, naa: Double, tittel: String, chip: String, gul: Bool, smaa: String
    let vent: SkVent?, tittelRes: String, rader: [SkRad], neste: String, slutt: [[String: Any]], stua: String, mer: String
    init(_ d: [String: Any]) {
        func s(_ k: String) -> String { d[k] as? String ?? "" }
        func n(_ k: String) -> Double { (d[k] as? NSNumber)?.doubleValue ?? 0 }
        fase = s("fase"); tid = n("tid"); nr = Int(n("nr")); antall = max(1, Int(n("antall"))); naa = n("naa"); tittel = s("tittel"); chip = s("chip"); gul = d["gul"] as? Bool ?? false; smaa = s("smaa")
        if let v = d["vent"] as? [String: Any] {
            var mitt: SkMitt? = nil
            if let m = v["mitt"] as? [String: Any] { mitt = SkMitt(tidlig: m["tidlig"] as? Bool ?? false, tekst: m["tekst"] as? String ?? "") }
            vent = SkVent(tekst: v["tekst"] as? String ?? "", skal: v["skal"] as? String ?? "", mitt: mitt, hint: v["hint"] as? String ?? "",
                          folk: (v["folk"] as? [[String: Any]] ?? []).map { h in SkHode(id: h["id"] as? String ?? "", navn: h["navn"] as? String ?? "", png: h["png"] as? String ?? "") }, status: v["status"] as? String ?? "")
        } else { vent = nil }
        tittelRes = s("tittelRes"); neste = s("neste")
        rader = (d["rader"] as? [[String: Any]] ?? []).map { r in SkRad(id: r["id"] as? String ?? "", navn: r["navn"] as? String ?? "", png: r["png"] as? String ?? "", tekst: r["tekst"] as? String ?? "", bredde: (r["bredde"] as? NSNumber)?.doubleValue ?? 100, kl: r["kl"] as? String ?? "", stripe: r["stripe"] as? Bool ?? false, oi: r["oi"] as? Bool ?? false) }
        slutt = d["slutt"] as? [[String: Any]] ?? []
        stua = s("stua").isEmpty ? "Stua" : s("stua"); mer = s("mer").isEmpty ? "Mer" : s("mer")
    }
}

final class SkModell: ObservableObject {
    @Published var d: SkData? = nil
    /// SKÅL er kommet for denne skålen (tid)
    @Published var naa: Double = 0
    /// Trykket (før nettsiden har sagt fra): tidlig eller ikke
    @Published var trykket: (tid: Double, tidlig: Bool)? = nil
    let blokker = KortModell()
    private(set) var avvik: Double = 0
    private var timer: Timer?
    weak var nett: WKWebView? { didSet { blokker.nett = nett } }
    private var bilder: [String: UIImage] = [:]
    func sett(_ dict: [String: Any]) {
        let ny = SkData(dict)
        if ny.naa > 0 { avvik = ny.naa - Date().timeIntervalSince1970 * 1000 }
        blokker.sett(["blokker": ny.slutt, "naa": dict["naa"] ?? 0])
        planlegg(ny)
        withAnimation(.spring(response: 0.4, dampingFraction: 0.8)) { d = ny }
    }
    /// Samme øyeblikk som nettsiden: SKÅL vises når servertiden passerer `tid`
    private func planlegg(_ ny: SkData) {
        guard ny.fase == "vent", ny.tid > 0 else { timer?.invalidate(); timer = nil; naa = 0; return }
        if naa == ny.tid { return }
        if trykket != nil && trykket!.tid != ny.tid { trykket = nil }
        let om = (ny.tid - (Date().timeIntervalSince1970 * 1000 + avvik)) / 1000
        timer?.invalidate()
        if om <= 0 { naa = ny.tid; return }
        timer = Timer.scheduledTimer(withTimeInterval: om, repeats: false) { [weak self] _ in
            guard let self = self else { return }
            self.naa = ny.tid
            UINotificationFeedbackGenerator().notificationOccurred(.success)
        }
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
        UIImpactFeedbackGenerator(style: .light).impactOccurred()
        guard let data = try? JSONSerialization.data(withJSONObject: [g, attrs]), let json = String(data: data, encoding: .utf8) else { return }
        nett?.evaluateJavaScript("window.__mvLek && window.__mvLek.trykk.apply(null, \(json))", completionHandler: nil)
    }
    /// Skål-trykket: nettsiden måler tiden (sk-trykk); her huskes bare at det er trykket, så flaten svarer med én gang
    func skaal() {
        guard let d = d, d.fase == "vent", d.vent?.mitt == nil, trykket == nil else { return }
        let tidlig = naa != d.tid
        trykket = (d.tid, tidlig)
        UIImpactFeedbackGenerator(style: tidlig ? .rigid : .heavy).impactOccurred()
        guard let data = try? JSONSerialization.data(withJSONObject: ["sk-trykk", [:]]), let json = String(data: data, encoding: .utf8) else { return }
        nett?.evaluateJavaScript("window.__mvLek && window.__mvLek.trykk.apply(null, \(json))", completionHandler: nil)
    }
}

struct SkalSkjerm: View {
    @ObservedObject var m: SkModell
    @Environment(\.colorScheme) private var modus
    @Environment(\.accessibilityReduceMotion) private var roligere
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
    private let ol = Color(red: 1, green: 0.72, blue: 0.2)

    var body: some View {
        ZStack {
            papir.ignoresSafeArea()
            if let d = m.d {
                VStack(spacing: 0) {
                    topp(d)
                    if let v = d.vent { flate(d, v) }
                    else {
                        ScrollView(showsIndicators: false) {
                            VStack(alignment: .leading, spacing: 12) { liste(d) }
                                .padding(.horizontal, 16).padding(.top, 4).padding(.bottom, 24)
                        }
                    }
                }
            }
        }
        .foregroundColor(blekk)
    }

    private func topp(_ d: SkData) -> some View {
        HStack(spacing: 8) {
            VStack(alignment: .leading, spacing: 3) {
                Text(d.tittel).font(.archivo(12, vekt: 700)).opacity(0.65).lineLimit(1)
                Text(d.chip).font(.archivo(16, vekt: 900)).foregroundColor(d.gul ? rust : blekk).lineLimit(1)
                HStack(spacing: 3) {
                    ForEach(0..<d.antall, id: \.self) { i in
                        let full = d.fase == "ferdig" || i < d.nr, naa = i == d.nr && d.fase != "ferdig"
                        GlassForm().fill(full ? ol : Color.clear).overlay(GlassForm().stroke(blekk, lineWidth: 1.5)).frame(width: 10, height: 14).opacity(full || naa ? 1 : 0.45)
                    }
                }.accessibilityLabel(d.smaa)
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
    private func hode(_ png: String, _ px: CGFloat) -> some View {
        Group {
            if let img = m.bilde(png) { Image(uiImage: img).resizable().aspectRatio(contentMode: .fit) }
            else { Circle().fill(gul).overlay(Circle().stroke(morkBlekk, lineWidth: 2)).padding(2) }
        }.frame(width: px, height: px)
    }

    // MARK: Flaten – vent (bobler), SKÅL (gul, to glass), trykket (tiden din), for tidlig (veltet, rosa)
    private func flate(_ d: SkData, _ v: SkVent) -> some View {
        let skal = m.naa == d.tid && d.tid > 0
        let mitt: SkMitt? = v.mitt ?? (m.trykket.map { t in SkMitt(tidlig: t.tidlig, tekst: t.tidlig ? "" : "…") })
        let tidlig = mitt?.tidlig ?? false
        let bakgrunn: Color = tidlig ? rosa : skal || (mitt != nil) ? gul : kortFarge
        return Button(action: { m.skaal() }) {
            VStack(spacing: 10) {
                Spacer(minLength: 0)
                ZStack {
                    if tidlig {
                        Glass(bobler: false, skum: true).frame(width: 120, height: 168).rotationEffect(.degrees(78), anchor: .bottom).offset(x: 30, y: 10)
                        Ellipse().fill(ol.opacity(0.8)).frame(width: 150, height: 26).offset(x: 70, y: 80)
                    } else {
                        Glass(bobler: !skal, skum: true).frame(width: 150, height: 210).offset(x: skal ? -34 : 0).rotationEffect(.degrees(skal ? -8 : 0), anchor: .bottom)
                        if skal {
                            Glass(bobler: false, skum: true).frame(width: 120, height: 168).offset(x: 54, y: 20).rotationEffect(.degrees(10), anchor: .bottom)
                                .transition(.move(edge: .trailing).combined(with: .opacity))
                        }
                    }
                }
                .frame(height: 240)
                .animation(roligere ? nil : .spring(response: 0.35, dampingFraction: 0.6), value: skal)
                Text(tidlig ? v.skal : skal ? v.skal.uppercased() : v.tekst).font(.archivo(skal && !tidlig ? 64 : 34, vekt: 900)).foregroundColor(morkBlekk).lineLimit(1).minimumScaleFactor(0.5)
                if let mt = mitt { Text(mt.tekst).font(.archivo(26, vekt: 900)).foregroundColor(tidlig ? rust : morkBlekk).transition(.scale(scale: 0.7).combined(with: .opacity)) }
                Text(v.hint).font(.archivo(13, vekt: 700)).foregroundColor(morkBlekk).opacity(0.7).multilineTextAlignment(.center).padding(.horizontal, 24)
                Spacer(minLength: 0)
                HStack(spacing: 6) {
                    HStack(spacing: -8) { ForEach(v.folk) { h in hode(h.png, 30) } }
                    Text(v.status).font(.archivo(12, vekt: 800)).foregroundColor(morkBlekk).opacity(0.8)
                }.padding(.bottom, 14)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(RoundedRectangle(cornerRadius: 22).fill(bakgrunn))
            .overlay(RoundedRectangle(cornerRadius: 22).stroke(morkBlekk, lineWidth: 3))
            .background(RoundedRectangle(cornerRadius: 22).fill(morkBlekk).offset(x: 5, y: 5))
            .padding(.horizontal, 16).padding(.bottom, 20)
        }
        .buttonStyle(.plain)
        // ikke .disabled: SwiftUI gråner hele flaten – skaal() avviser selv trykk nummer to
        .accessibilityLabel(skal ? v.skal : v.tekst)
    }

    // MARK: Lista – hoder med stolper for tiden, treigest i rosa; summen til slutt
    private func liste(_ d: SkData) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(d.tittelRes).font(.archivo(24, vekt: 900)).fixedSize(horizontal: false, vertical: true).padding(.top, 4)
                .transition(.move(edge: .leading).combined(with: .opacity))
            VStack(spacing: 6) {
                ForEach(Array(d.rader.enumerated()), id: \.element.id) { j, r in
                    HStack(spacing: 10) {
                        hode(r.png, 36)
                        Text(r.navn).font(.archivo(14, vekt: 900)).lineLimit(1).frame(width: 64, alignment: .leading)
                        GeometryReader { g in
                            ZStack(alignment: .leading) {
                                RoundedRectangle(cornerRadius: 5).fill(papir).overlay(RoundedRectangle(cornerRadius: 5).stroke(blekk.opacity(0.3), lineWidth: 1))
                                RoundedRectangle(cornerRadius: 5).fill(r.kl == "feil" ? rosa : r.kl == "rett" ? mint : ol)
                                    .frame(width: max(8, g.size.width * CGFloat(r.bredde) / 100))
                                    .opacity(r.stripe ? 0.5 : 1)
                                    .overlay(RoundedRectangle(cornerRadius: 5).stroke(blekk, lineWidth: 1.5).frame(width: max(8, g.size.width * CGFloat(r.bredde) / 100)), alignment: .leading)
                            }
                        }.frame(height: 18)
                        Text(r.tekst).font(.archivo(13, vekt: 900)).lineLimit(1).frame(width: 76, alignment: .trailing)
                    }
                    .padding(.horizontal, 10).padding(.vertical, 7)
                    .background(RoundedRectangle(cornerRadius: 12).fill(kortFarge)).overlay(RoundedRectangle(cornerRadius: 12).stroke(r.kl == "feil" ? rust : blekk.opacity(0.5), lineWidth: r.kl == "feil" ? 2.5 : 1.5))
                    .transition(.move(edge: .leading).combined(with: .opacity))
                    .animation(roligere ? nil : .spring(response: 0.4, dampingFraction: 0.8).delay(Double(j) * 0.09), value: d.nr)
                }
            }
            HStack(spacing: 8) {
                GlassForm().fill(ol).overlay(GlassForm().stroke(blekk, lineWidth: 1.5)).frame(width: 14, height: 20)
                Text(d.neste).font(.archivo(14, vekt: 700)).opacity(0.8)
            }.padding(.top, 4)
            BlokkListe(m: m.blokker).padding(.top, 6)
        }
    }
}

/// Et ølglass med skum og bobler, som nettsidens `.sk-glass`
struct Glass: View {
    let bobler: Bool, skum: Bool
    @State private var fase = false
    private let morkBlekk = Color(red: 0.086, green: 0.071, blue: 0.059)
    private let ol = Color(red: 1, green: 0.72, blue: 0.2)
    private let lys = Color(red: 1, green: 0.973, blue: 0.933)
    var body: some View {
        GeometryReader { g in
            let w = g.size.width, h = g.size.height
            ZStack {
                GlassForm().fill(lys)
                GlassForm().fill(ol).padding(.top, h * 0.2).padding(.horizontal, w * 0.05)
                if bobler {
                    ForEach(0..<3, id: \.self) { i in
                        Circle().fill(lys.opacity(0.9)).frame(width: 6 + CGFloat(i) * 2, height: 6 + CGFloat(i) * 2)
                            .position(x: w * [0.33, 0.53, 0.69][i], y: fase ? h * 0.3 : h * 0.86)
                            .opacity(fase ? 0 : 0.9)
                            .animation(.easeOut(duration: 1.8).repeatForever(autoreverses: false).delay(Double(i) * 0.6), value: fase)
                    }
                }
                if skum { Skum().fill(lys).frame(height: h * 0.2).overlay(Skum().stroke(morkBlekk, lineWidth: 3).frame(height: h * 0.2), alignment: .top).frame(maxHeight: .infinity, alignment: .top) }
                GlassForm().stroke(morkBlekk, lineWidth: 4)
            }
            .onAppear { fase = true }
        }
    }
}
/// Glasset: litt smalere nederst
struct GlassForm: Shape {
    func path(in r: CGRect) -> Path {
        var p = Path()
        p.move(to: CGPoint(x: r.minX + r.width * 0.06, y: r.minY + r.height * 0.04))
        p.addLine(to: CGPoint(x: r.maxX - r.width * 0.06, y: r.minY + r.height * 0.04))
        p.addLine(to: CGPoint(x: r.maxX - r.width * 0.16, y: r.maxY - r.height * 0.02))
        p.addLine(to: CGPoint(x: r.minX + r.width * 0.16, y: r.maxY - r.height * 0.02))
        p.closeSubpath()
        return p
    }
}
/// Skummet på toppen: tre bølger
struct Skum: Shape {
    func path(in r: CGRect) -> Path {
        var p = Path()
        let y = r.minY + r.height * 0.45, b = r.width / 3.3
        p.move(to: CGPoint(x: r.minX + r.width * 0.07, y: r.maxY))
        p.addLine(to: CGPoint(x: r.minX + r.width * 0.07, y: y))
        for i in 0..<3 {
            let x0 = r.minX + r.width * 0.07 + b * CGFloat(i)
            p.addQuadCurve(to: CGPoint(x: x0 + b, y: y), control: CGPoint(x: x0 + b / 2, y: r.minY))
        }
        p.addLine(to: CGPoint(x: r.maxX - r.width * 0.07, y: r.maxY))
        p.closeSubpath()
        return p
    }
}
