import SwiftUI
import UIKit
import WebKit

/// Kveldens oppsummering native: vinneren og lovboka, tallene, kåringene, slurketavla med hodene – og knappene for å dele,
/// fortsette eller gå ut. Nettsiden (rom.js sluttData) sender alt ferdig oversatt; trykkene går tilbake til nettsidens egne
/// knapper (window.__mvLek.trykk), lenkene til dens <a> (__mvLek.lenke), og regelen skrives i iPhonens dialog (__mvLek.skriv).
final class SluttModell: ObservableObject {
    @Published var d: [String: Any] = [:]
    weak var nett: WKWebView?
    /// Skallet viser dialogen med tekstfelt (tittel, plass, verdi, knapp, avbryt, ferdig)
    var dialog: ((String, String, String, String, String, @escaping (String) -> Void) -> Void)?
    private var bilder: [String: UIImage] = [:]

    func sett(_ d: [String: Any]) { self.d = d }
    func s(_ k: String) -> String { d[k] as? String ?? "" }
    func liste(_ k: String) -> [[String: Any]] { d[k] as? [[String: Any]] ?? [] }
    func obj(_ k: String) -> [String: Any]? { d[k] as? [String: Any] }

    func bilde(_ b64: String) -> UIImage? {
        if b64.isEmpty { return nil }
        if let b = bilder[b64] { return b }
        guard let data = Data(base64Encoded: b64), let img = UIImage(data: data, scale: 2) else { return nil }
        if bilder.count > 40 { bilder.removeAll() }
        bilder[b64] = img
        return img
    }

    private func js(_ kode: String) { nett?.evaluateJavaScript(kode, completionHandler: nil) }
    private func json(_ x: Any) -> String? { (try? JSONSerialization.data(withJSONObject: x)).flatMap { String(data: $0, encoding: .utf8) } }
    func trykk(_ g: String, _ attrs: [String: String] = [:]) {
        UIImpactFeedbackGenerator(style: .light).impactOccurred()
        guard let j = json([g, attrs]) else { return }
        js("window.__mvLek && window.__mvLek.trykk.apply(null, \(j))")
    }
    func lenke(_ href: String) {
        UISelectionFeedbackGenerator().selectionChanged()
        guard let j = json([href]) else { return }
        js("window.__mvLek && window.__mvLek.lenke(\(j)[0])")
    }
    /// Regelen til lovboka: nettsidens skjema fylles og sendes (det spør selv «Innføre regelen …?»)
    func skrivRegel(_ tekst: String) {
        guard let j = json(["lovNySkjema", ["lovNyTekst": tekst]]) else { return }
        js("window.__mvLek && window.__mvLek.skriv.apply(null, \(j))")
    }
}

struct SluttSkjerm: View {
    @ObservedObject var m: SluttModell
    @Environment(\.colorScheme) private var modus
    private var papir: Color { modus == .dark ? Color(red: 0.11, green: 0.106, blue: 0.122) : Color(red: 1, green: 0.973, blue: 0.933) }
    private var kort: Color { modus == .dark ? Color(red: 0.173, green: 0.169, blue: 0.188) : .white }
    private var blekk: Color { modus == .dark ? Color(red: 1, green: 0.973, blue: 0.933) : Color(red: 0.086, green: 0.071, blue: 0.059) }
    private let gul = Color(red: 1, green: 0.824, blue: 0.247)
    private let rust = Color(red: 0.776, green: 0.235, blue: 0.067)
    private let mint = Color(red: 0.388, green: 0.886, blue: 0.659)
    private let morkBlekk = Color(red: 0.086, green: 0.071, blue: 0.059)

    var body: some View {
        ZStack {
            papir.ignoresSafeArea()
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    topp
                    if let v = m.obj("vinner") { vinnerKort(v) }
                    if !m.s("ingenPoeng").isEmpty { Text(m.s("ingenPoeng")).font(.archivo(14, vekt: 600)).opacity(0.7) }
                    pynt
                    tall
                    kaaringer
                    if !m.s("lekerTekst").isEmpty { Text(m.s("lekerTekst")).font(.archivo(13, vekt: 600)).opacity(0.7).fixedSize(horizontal: false, vertical: true) }
                    tavle
                    gjeng
                    knapper
                }
                .padding(.horizontal, 16).padding(.top, 8).padding(.bottom, 40)
            }
        }
        .foregroundColor(blekk)
    }

    private var topp: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(m.s("etikett").uppercased()).font(.archivo(12, vekt: 900)).opacity(0.6)
            Text(m.s("tittel")).font(.archivo(34, vekt: 900)).tracking(-0.5).lineLimit(2).minimumScaleFactor(0.7)
            Text(m.s("dato") + (m.s("gjengNavn").isEmpty ? "" : " · " + m.s("gjengNavn"))).font(.archivo(14, vekt: 700)).opacity(0.7)
        }
    }

    // MARK: Vinneren og lovboka
    private func vinnerKort(_ v: [String: Any]) -> some View {
        VStack(spacing: 10) {
            ZStack(alignment: .topTrailing) {
                if let b = m.bilde(v["png"] as? String ?? "") { Image(uiImage: b).resizable().scaledToFit().frame(width: 96, height: 96) } else { Text("🏆").font(.system(size: 52)) }
                if m.bilde(v["png"] as? String ?? "") != nil { Text("🏆").font(.system(size: 30)).offset(x: 14, y: -10) }
            }
            Text(v["tittel"] as? String ?? "").font(.archivo(26, vekt: 900)).multilineTextAlignment(.center).lineLimit(2).minimumScaleFactor(0.7)
            Text(v["under"] as? String ?? "").font(.archivo(13, vekt: 700)).opacity(0.7)
            if let l = m.obj("lov") { lov(l) }
            if !m.s("lovVenter").isEmpty { Text(m.s("lovVenter")).font(.archivo(14, vekt: 600)).opacity(0.8).multilineTextAlignment(.center).padding(.top, 4) }
            if let r = m.obj("skrivRegel") { skrivRegel(r) }
        }
        .frame(maxWidth: .infinity).padding(18)
        .background(RoundedRectangle(cornerRadius: 22).fill(gul.opacity(modus == .dark ? 0.18 : 0.28)))
        .overlay(RoundedRectangle(cornerRadius: 22).stroke(gul, lineWidth: 2))
    }

    private func lov(_ l: [String: Any]) -> some View {
        VStack(spacing: 6) {
            Text(l["etikett"] as? String ?? "").font(.archivo(12, vekt: 900)).opacity(0.7).padding(.top, 6)
            let t = l["tekst"] as? String ?? ""
            if !t.isEmpty {
                Text(t).font(.archivo(22, vekt: 800)).multilineTextAlignment(.center).strikethrough(l["strek"] as? Bool == true).fixedSize(horizontal: false, vertical: true)
            }
            Text(l["under"] as? String ?? "").font(.archivo(12, vekt: 600)).opacity(0.7).multilineTextAlignment(.center).fixedSize(horizontal: false, vertical: true)
            let del = l["del"] as? String ?? ""
            if !del.isEmpty { Button(action: { m.trykk("lov-del") }) { Text(del).font(.archivo(14, vekt: 800)).underline() }.buttonStyle(.plain).padding(.top, 2) }
        }
    }

    private func skrivRegel(_ r: [String: Any]) -> some View {
        VStack(spacing: 8) {
            Text(r["etikett"] as? String ?? "").font(.archivo(16, vekt: 900)).padding(.top, 6)
            Text(r["under"] as? String ?? "").font(.archivo(12, vekt: 600)).opacity(0.7).multilineTextAlignment(.center).fixedSize(horizontal: false, vertical: true)
            Button(action: {
                m.dialog?(r["etikett"] as? String ?? "", r["plass"] as? String ?? "", "", r["send"] as? String ?? "OK", r["avbryt"] as? String ?? "Avbryt") { t in m.skrivRegel(t) }
            }) { storKnapp(r["knapp"] as? String ?? "", gul: true) }.buttonStyle(TrykkStilSlutt())
            let regler = r["regler"] as? [[String: Any]] ?? []
            if !regler.isEmpty {
                Text(r["opphevEtikett"] as? String ?? "").font(.archivo(12, vekt: 900)).opacity(0.7).padding(.top, 4)
                ForEach(Array(regler.enumerated()), id: \.offset) { _, x in
                    Button(action: { m.trykk("lov-opphev", ["id": x["id"] as? String ?? ""]) }) {
                        Text("🗑️ " + (x["tekst"] as? String ?? "")).font(.archivo(14, vekt: 700)).multilineTextAlignment(.leading).fixedSize(horizontal: false, vertical: true)
                            .frame(maxWidth: .infinity, alignment: .leading).padding(.horizontal, 14).padding(.vertical, 10)
                            .background(RoundedRectangle(cornerRadius: 12).fill(kort)).overlay(RoundedRectangle(cornerRadius: 12).stroke(blekk.opacity(0.25), lineWidth: 1.5))
                    }.buttonStyle(.plain)
                }
            }
            Button(action: { m.trykk("lov-ingen") }) { Text(r["ingen"] as? String ?? "").font(.archivo(13, vekt: 700)).underline().opacity(0.8) }.buttonStyle(.plain).padding(.top, 4)
        }
    }

    // MARK: Garderoben
    @ViewBuilder private var pynt: some View {
        if !m.s("pynt").isEmpty {
            HStack(alignment: .center, spacing: 10) {
                Text("✨").font(.system(size: 22))
                Text(m.s("pynt")).font(.archivo(14, vekt: 800)).fixedSize(horizontal: false, vertical: true)
                Spacer(minLength: 6)
                Button(action: { m.trykk("figur-ark") }) { litenKnapp(m.s("pyntKnapp")) }.buttonStyle(TrykkStilSlutt())
            }
            .padding(14).background(RoundedRectangle(cornerRadius: 16).fill(kort)).overlay(RoundedRectangle(cornerRadius: 16).stroke(blekk.opacity(0.2), lineWidth: 1.5))
        } else if !m.s("pyntDytt").isEmpty {
            VStack(alignment: .leading, spacing: 6) {
                Text(m.s("pyntDytt")).font(.archivo(13, vekt: 600)).opacity(0.8).fixedSize(horizontal: false, vertical: true)
                Button(action: { m.lenke(m.s("pyntLenke")) }) { Text(m.s("pyntLenkeTekst")).font(.archivo(14, vekt: 800)).underline() }.buttonStyle(.plain)
            }
        }
    }

    // MARK: Tallene
    private var tall: some View {
        let t = m.liste("tall")
        return LazyVGrid(columns: [GridItem(.flexible(), spacing: 10), GridItem(.flexible(), spacing: 10)], spacing: 10) {
            ForEach(Array(t.enumerated()), id: \.offset) { _, x in
                VStack(alignment: .leading, spacing: 2) {
                    Text(x["tall"] as? String ?? "").font(.archivo(30, vekt: 900)).foregroundColor(rust).lineLimit(1).minimumScaleFactor(0.6)
                    Text(x["tekst"] as? String ?? "").font(.archivo(13, vekt: 600)).opacity(0.7).lineLimit(2)
                }
                .frame(maxWidth: .infinity, alignment: .leading).padding(.horizontal, 16).padding(.vertical, 14)
                .background(RoundedRectangle(cornerRadius: 18).fill(kort)).overlay(RoundedRectangle(cornerRadius: 18).stroke(blekk.opacity(0.2), lineWidth: 1.5))
            }
        }
    }

    // MARK: Kåringene
    @ViewBuilder private var kaaringer: some View {
        let k = m.liste("kaaring")
        if !k.isEmpty {
            VStack(spacing: 8) {
                ForEach(Array(k.enumerated()), id: \.offset) { _, x in
                    HStack(spacing: 12) {
                        Text(x["ikon"] as? String ?? "").font(.system(size: 26))
                        VStack(alignment: .leading, spacing: 1) {
                            Text(x["tittel"] as? String ?? "").font(.archivo(12, vekt: 700)).opacity(0.65)
                            Text((x["navn"] as? String ?? "") + " · " + (x["tall"] as? String ?? "")).font(.archivo(16, vekt: 900)).lineLimit(2).minimumScaleFactor(0.8)
                        }
                        Spacer(minLength: 0)
                    }
                    .padding(.horizontal, 12).padding(.vertical, 8)
                    .background(RoundedRectangle(cornerRadius: 14).fill(mint.opacity(modus == .dark ? 0.16 : 0.18)))
                }
            }
        }
    }

    // MARK: Slurketavla
    @ViewBuilder private var tavle: some View {
        let r = m.liste("rangert")
        if !r.isEmpty {
            let topp = max(1, r.map { $0["slurker"] as? Int ?? 0 }.max() ?? 1)
            VStack(alignment: .leading, spacing: 8) {
                Text(m.s("tavleTittel")).font(.archivo(18, vekt: 900)).padding(.top, 4)
                ForEach(Array(r.enumerated()), id: \.offset) { i, p in
                    let n = p["slurker"] as? Int ?? 0
                    let meg = p["meg"] as? Bool == true
                    ZStack(alignment: .leading) {
                        RoundedRectangle(cornerRadius: 16).fill(kort)
                        GeometryReader { g in RoundedRectangle(cornerRadius: 16).fill(mint.opacity(0.22)).frame(width: g.size.width * CGFloat(n) / CGFloat(topp)) }
                        HStack(spacing: 10) {
                            Text("\(i + 1).").font(.archivo(14, vekt: 800)).opacity(0.5).frame(width: 24, alignment: .trailing)
                            if let b = m.bilde(p["png"] as? String ?? "") { Image(uiImage: b).resizable().scaledToFit().frame(width: 34, height: 34) }
                            Text(p["navn"] as? String ?? "").font(.archivo(16, vekt: meg ? 900 : 700)).lineLimit(1).minimumScaleFactor(0.8)
                            Spacer(minLength: 6)
                            Text("\(n)").font(.archivo(18, vekt: 900)).foregroundColor(i == 0 && n > 0 ? rust : blekk)
                        }
                        .padding(.horizontal, 12)
                    }
                    .frame(height: 50)
                    .overlay(RoundedRectangle(cornerRadius: 16).stroke(meg ? blekk : blekk.opacity(0.2), lineWidth: meg ? 2 : 1.5))
                }
            }
        }
    }

    // MARK: Gjengen
    @ViewBuilder private var gjeng: some View {
        if !m.s("gjengTekst").isEmpty {
            Button(action: { m.lenke(m.s("gjengLenke")) }) {
                HStack(spacing: 8) {
                    Text(m.s("gjengTekst")).font(.archivo(14, vekt: 700)).multilineTextAlignment(.leading).fixedSize(horizontal: false, vertical: true)
                    Spacer(minLength: 4)
                    Image(systemName: "chevron.right").font(.system(size: 14, weight: .bold)).opacity(0.5)
                }
                .padding(14).background(RoundedRectangle(cornerRadius: 16).fill(kort)).overlay(RoundedRectangle(cornerRadius: 16).stroke(blekk.opacity(0.2), lineWidth: 1.5))
            }.buttonStyle(.plain)
        } else if let lg = m.obj("lagGjeng") {
            VStack(alignment: .leading, spacing: 8) {
                Text(lg["tekst"] as? String ?? "").font(.archivo(13, vekt: 600)).opacity(0.8).fixedSize(horizontal: false, vertical: true)
                Button(action: { m.lenke(lg["lenke"] as? String ?? "") }) { litenKnapp(lg["knapp"] as? String ?? "") }.buttonStyle(TrykkStilSlutt())
            }
        }
    }

    // MARK: Knappene
    private var knapper: some View {
        VStack(spacing: 10) {
            Button(action: { m.trykk("del-kveld") }) { storKnapp(m.s("del"), gul: true) }.buttonStyle(TrykkStilSlutt())
            if !m.s("fortsett").isEmpty { Button(action: { m.trykk("fortsett-kvelden") }) { storKnapp(m.s("fortsett"), gul: false) }.buttonStyle(TrykkStilSlutt()) }
            Button(action: { m.trykk("forlat") }) { Text(m.s("forlat")).font(.archivo(14, vekt: 700)).underline().opacity(0.7) }.buttonStyle(.plain).padding(.top, 6)
        }
        .padding(.top, 8)
    }

    private func storKnapp(_ t: String, gul erGul: Bool) -> some View {
        Text(t.uppercased()).font(.archivo(16, vekt: 900)).lineLimit(2).minimumScaleFactor(0.7).multilineTextAlignment(.center)
            .padding(.horizontal, 16).frame(maxWidth: .infinity).frame(minHeight: 54).foregroundColor(erGul ? morkBlekk : blekk)
            .background(ZStack {
                RoundedRectangle(cornerRadius: 14).fill(blekk).offset(x: 3, y: 3)
                RoundedRectangle(cornerRadius: 14).fill(erGul ? gul : kort)
                RoundedRectangle(cornerRadius: 14).stroke(blekk, lineWidth: 2.5)
            })
    }
    private func litenKnapp(_ t: String) -> some View {
        Text(t.uppercased()).font(.archivo(13, vekt: 900)).lineLimit(1).minimumScaleFactor(0.7)
            .padding(.horizontal, 12).frame(height: 38).foregroundColor(morkBlekk)
            .background(ZStack {
                RoundedRectangle(cornerRadius: 10).fill(blekk).offset(x: 2, y: 2)
                RoundedRectangle(cornerRadius: 10).fill(gul)
                RoundedRectangle(cornerRadius: 10).stroke(blekk, lineWidth: 2)
            })
    }
}

struct TrykkStilSlutt: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .offset(x: configuration.isPressed ? 2 : 0, y: configuration.isPressed ? 2 : 0)
            .animation(.spring(response: 0.18, dampingFraction: 0.9), value: configuration.isPressed)
    }
}
