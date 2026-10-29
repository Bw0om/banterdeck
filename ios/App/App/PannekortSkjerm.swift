import SwiftUI
import UIKit
import WebKit

/// Hvem er jeg? (lappen i panna) som native skjerm: lappen du skriver til den du fikk, forslagene, hodene med lapper
/// i panna mens dere gjetter, «Gjettet!»/«Angre», og runden som er over. Nettsiden under holder tilstanden
/// (rom.js pkNativData) – denne tegner. Skrivingen går via iPhonens dialog (sosSkjema), trykkene til nettsidens knapper.
struct PkHode: Identifiable { let id: String; let navn: String; let png: String; let oppe: Bool }
struct PkForslag: Identifiable { let id: String; let t: String; let k: String; let kat: String }
struct PkKort: Identifiable { let id: String; let navn: String; let png: String; let meg: Bool; let gjettet: Bool; let sist: Bool; let lapp: String; let skjult: Bool; let merke: String; let knapp: String; let angre: Bool }
struct PkSkriv { let til: PkHode?, lapp: String, skrevet: Bool, under: String, forslag: [PkForslag], nyeForslag: String, skjemaId: String, knapp: String, etikett: String, folk: [PkHode], status: String }

struct PkData {
    let fase: String, runde: Int, naa: Double, frist: Double, tittel: String, chip: String, gul: Bool
    let skriv: PkSkriv?, kort: [PkKort], hjelp: String, sporsmal: String, dom: String, slutt: [[String: Any]], stua: String, mer: String
    static func hode(_ h: [String: Any]?) -> PkHode? {
        guard let h = h else { return nil }
        return PkHode(id: h["id"] as? String ?? "", navn: h["navn"] as? String ?? "", png: h["png"] as? String ?? "", oppe: h["oppe"] as? Bool ?? false)
    }
    init(_ d: [String: Any]) {
        func s(_ k: String) -> String { d[k] as? String ?? "" }
        fase = s("fase"); runde = (d["runde"] as? NSNumber)?.intValue ?? 1; naa = (d["naa"] as? NSNumber)?.doubleValue ?? 0; frist = (d["frist"] as? NSNumber)?.doubleValue ?? 0
        tittel = s("tittel"); chip = s("chip"); gul = d["gul"] as? Bool ?? false
        if let x = d["skriv"] as? [String: Any] {
            skriv = PkSkriv(til: PkData.hode(x["til"] as? [String: Any]), lapp: x["lapp"] as? String ?? "", skrevet: x["skrevet"] as? Bool ?? false, under: x["under"] as? String ?? "",
                            forslag: (x["forslag"] as? [[String: Any]] ?? []).map { f in PkForslag(id: f["t"] as? String ?? "", t: f["t"] as? String ?? "", k: f["k"] as? String ?? "", kat: f["kat"] as? String ?? "") },
                            nyeForslag: x["nyeForslag"] as? String ?? "", skjemaId: x["skjemaId"] as? String ?? "sosSkjema", knapp: x["knapp"] as? String ?? "", etikett: x["etikett"] as? String ?? "",
                            folk: (x["folk"] as? [[String: Any]] ?? []).compactMap { PkData.hode($0) }, status: x["status"] as? String ?? "")
        } else { skriv = nil }
        kort = (d["kort"] as? [[String: Any]] ?? []).map { k in PkKort(id: k["id"] as? String ?? "", navn: k["navn"] as? String ?? "", png: k["png"] as? String ?? "", meg: k["meg"] as? Bool ?? false, gjettet: k["gjettet"] as? Bool ?? false, sist: k["sist"] as? Bool ?? false, lapp: k["lapp"] as? String ?? "", skjult: k["skjult"] as? Bool ?? false, merke: k["merke"] as? String ?? "", knapp: k["knapp"] as? String ?? "", angre: k["angre"] as? Bool ?? false) }
        hjelp = s("hjelp"); sporsmal = s("sporsmal"); dom = s("dom"); slutt = d["slutt"] as? [[String: Any]] ?? []
        stua = s("stua").isEmpty ? "Stua" : s("stua"); mer = s("mer").isEmpty ? "Mer" : s("mer")
    }
}

final class PkModell: ObservableObject {
    @Published var d: PkData? = nil
    let blokker = KortModell()
    private(set) var avvik: Double = 0
    weak var nett: WKWebView? { didSet { blokker.nett = nett } }
    private var bilder: [String: UIImage] = [:]
    func sett(_ dict: [String: Any]) {
        let ny = PkData(dict)
        if ny.naa > 0 { avvik = ny.naa - Date().timeIntervalSince1970 * 1000 }
        blokker.sett(["blokker": ny.slutt, "naa": dict["naa"] ?? 0])
        withAnimation(.spring(response: 0.45, dampingFraction: 0.78)) { d = ny }
    }
    func igjen(_ frist: Double) -> Int { max(0, Int(ceil((frist - 1500 - (Date().timeIntervalSince1970 * 1000 + avvik)) / 1000))) }
    func bilde(_ b64: String) -> UIImage? {
        if b64.isEmpty { return nil }
        if let b = bilder[b64] { return b }
        guard let data = Data(base64Encoded: b64), let img = UIImage(data: data, scale: 2) else { return nil }
        if bilder.count > 80 { bilder.removeAll() }
        bilder[b64] = img
        return img
    }
    func trykk(_ g: String, _ attrs: [String: String] = [:]) {
        UIImpactFeedbackGenerator(style: g == "pk-riktig" ? .medium : .light).impactOccurred()
        guard let data = try? JSONSerialization.data(withJSONObject: [g, attrs]), let json = String(data: data, encoding: .utf8) else { return }
        nett?.evaluateJavaScript("window.__mvLek && window.__mvLek.trykk.apply(null, \(json))", completionHandler: nil)
    }
    func skjema(_ id: String) {
        UIImpactFeedbackGenerator(style: .light).impactOccurred()
        guard let data = try? JSONSerialization.data(withJSONObject: [id]), let json = String(data: data, encoding: .utf8) else { return }
        nett?.evaluateJavaScript("window.__mvLek && window.__mvLek.skjema(\(json)[0])", completionHandler: nil)
    }
}

struct PannekortSkjerm: View {
    @ObservedObject var m: PkModell
    @Environment(\.colorScheme) private var modus
    @Environment(\.accessibilityReduceMotion) private var roligere
    @State private var klask = false
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

    var body: some View {
        ZStack {
            papir.ignoresSafeArea()
            if let d = m.d {
                VStack(spacing: 0) {
                    topp(d)
                    ScrollView(showsIndicators: false) {
                        VStack(alignment: .leading, spacing: 12) {
                            if let sk = d.skriv { skriv(d, sk) }
                            else if d.fase == "spill" { spill(d) }
                            else { ferdig(d) }
                        }
                        .padding(.horizontal, 16).padding(.top, 4).padding(.bottom, 24)
                    }
                }
            }
        }
        .foregroundColor(blekk)
    }

    private func topp(_ d: PkData) -> some View {
        HStack(spacing: 8) {
            VStack(alignment: .leading, spacing: 1) {
                Text(d.tittel).font(.archivo(12, vekt: 700)).opacity(0.65).lineLimit(1)
                Text(d.chip).font(.archivo(16, vekt: 900)).foregroundColor(d.gul ? rust : blekk).lineLimit(2)
            }
            Spacer()
            if d.frist > 0 {
                TimelineView(.periodic(from: .now, by: 1)) { _ in
                    let n = m.igjen(d.frist)
                    Text("\(n)").font(.archivo(16, vekt: 900)).frame(width: 40, height: 40)
                        .background(Circle().fill(n <= 10 ? oransje : gul)).overlay(Circle().stroke(morkBlekk, lineWidth: 2)).foregroundColor(morkBlekk)
                }
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
                .background(Capsule().fill(kortFarge)).overlay(Capsule().stroke(blekk, lineWidth: 2))
        }.buttonStyle(.plain)
    }
    private func hode(_ png: String, _ px: CGFloat) -> some View {
        Group {
            if let img = m.bilde(png) { Image(uiImage: img).resizable().aspectRatio(contentMode: .fit) }
            else { Circle().fill(gul).overlay(Circle().stroke(morkBlekk, lineWidth: 2)).padding(2) }
        }.frame(width: px, height: px)
    }
    /// Lappen i panna: gul post-it med litt skjevhet, teksten krymper så den får plass
    private func lapp(_ tekst: String, bredde: CGFloat, maks: CGFloat, tom: Bool = false, meg: Bool = false) -> some View {
        Text(tekst).font(.archivo(maks, vekt: 900)).foregroundColor(morkBlekk).multilineTextAlignment(.center).lineLimit(3).minimumScaleFactor(0.4)
            .padding(.horizontal, 6).padding(.vertical, 6).frame(width: bredde).frame(minHeight: bredde * 0.55)
            .background(RoundedRectangle(cornerRadius: 4).fill(meg ? rosa : gul))
            .overlay(RoundedRectangle(cornerRadius: 4).stroke(morkBlekk, style: StrokeStyle(lineWidth: 2, dash: tom ? [5, 4] : [])))
            .background(RoundedRectangle(cornerRadius: 4).fill(morkBlekk).offset(x: 2, y: 3))
            .rotationEffect(.degrees(-3))
    }
    private func storKnapp(_ t: String, farge: Color? = nil, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(t.uppercased()).font(.archivo(19, vekt: 900)).foregroundColor(morkBlekk)
                .frame(maxWidth: .infinity).frame(minHeight: 62)
                .background(RoundedRectangle(cornerRadius: 14).fill(farge ?? gul)).overlay(RoundedRectangle(cornerRadius: 14).stroke(morkBlekk, lineWidth: 3))
                .background(RoundedRectangle(cornerRadius: 14).fill(morkBlekk).offset(x: 4, y: 4))
        }.buttonStyle(TastTrykk())
    }

    // MARK: Skrive – den du fikk med lappen, forslagene, dialogen, benken
    private func skriv(_ d: PkData, _ sk: PkSkriv) -> some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(alignment: .top, spacing: 0) {
                Spacer(minLength: 0)
                ZStack(alignment: .top) {
                    if let t = sk.til { hode(t.png, 150).padding(.top, 36) }
                    lapp(sk.lapp, bredde: 128, maks: 26, tom: !sk.skrevet)
                        .scaleEffect(klask ? 1.35 : 1)
                        .onChange(of: sk.lapp) { _ in
                            // Klask: lappen lander på panna (fra stor til vanlig, med litt sprett)
                            guard sk.skrevet, !roligere else { return }
                            klask = true
                            withAnimation(.spring(response: 0.32, dampingFraction: 0.55)) { klask = false }
                            UIImpactFeedbackGenerator(style: .heavy).impactOccurred()
                        }
                }
                Spacer(minLength: 0)
            }
            Text(sk.under).font(.archivo(17, vekt: 800)).frame(maxWidth: .infinity).multilineTextAlignment(.center)
            if !sk.forslag.isEmpty {
                VStack(spacing: 8) {
                    ForEach(sk.forslag) { f in
                        Button(action: { m.trykk("pk-fyll", ["t": f.t, "k": f.k]) }) {
                            HStack(spacing: 8) {
                                Text(f.t).font(.archivo(15, vekt: 900)).lineLimit(1)
                                Spacer()
                                Text(f.kat).font(.archivo(11, vekt: 700)).opacity(0.65).lineLimit(1)
                            }
                            .padding(.horizontal, 12).frame(height: 46)
                            .background(RoundedRectangle(cornerRadius: 10).fill(kortFarge)).overlay(RoundedRectangle(cornerRadius: 10).stroke(blekk, lineWidth: 2))
                            .background(RoundedRectangle(cornerRadius: 10).fill(blekk).offset(x: 3, y: 3))
                        }.buttonStyle(TastTrykk())
                    }
                }
            }
            if !sk.nyeForslag.isEmpty {
                Button(action: { m.trykk("pk-forslag") }) { Text(sk.nyeForslag).font(.archivo(14, vekt: 800)).underline() }.buttonStyle(.plain).frame(maxWidth: .infinity)
            }
            if !sk.skrevet { Text(sk.etikett).font(.archivo(12, vekt: 800)).opacity(0.65) }
            storKnapp(sk.knapp, farge: sk.skrevet ? kortFarge : gul) { m.skjema(sk.skjemaId) }
            benk(sk.folk, sk.status)
        }
    }
    private func benk(_ folk: [PkHode], _ status: String) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(status).font(.archivo(12, vekt: 800)).opacity(0.65)
            HStack(alignment: .bottom, spacing: 6) {
                ForEach(folk) { h in
                    VStack(spacing: 2) {
                        hode(h.png, 44).offset(y: h.oppe ? -6 : 0).opacity(h.oppe ? 1 : 0.5)
                            .animation(roligere ? nil : .spring(response: 0.4, dampingFraction: 0.65), value: h.oppe)
                        Text(h.navn).font(.archivo(10, vekt: h.oppe ? 900 : 600)).lineLimit(1)
                    }.frame(maxWidth: 64)
                }
                Spacer(minLength: 0)
            }
        }.padding(.top, 4)
    }

    // MARK: Spill – hodene med lapper i panna, «Gjettet!» og «Angre»
    private func spill(_ d: PkData) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(d.hjelp).font(.archivo(13, vekt: 600)).opacity(0.75).fixedSize(horizontal: false, vertical: true)
            rutenett(d)
            if !d.sporsmal.isEmpty {
                Button(action: { m.trykk("pk-sporsmal") }) {
                    HStack(spacing: 6) { Image(systemName: "questionmark.circle").font(.system(size: 14, weight: .bold)); Text(d.sporsmal).font(.archivo(13, vekt: 800)) }
                        .padding(.horizontal, 12).frame(height: 36).background(Capsule().fill(kortFarge)).overlay(Capsule().stroke(blekk, lineWidth: 2))
                }.buttonStyle(.plain).frame(maxWidth: .infinity)
            }
        }
    }
    private func rutenett(_ d: PkData) -> some View {
        let kol = [GridItem(.flexible(), spacing: 10), GridItem(.flexible(), spacing: 10)]
        return LazyVGrid(columns: kol, spacing: 10) {
            ForEach(d.kort) { k in
                VStack(spacing: 6) {
                    ZStack(alignment: .top) {
                        hode(k.png, 96).padding(.top, 26).opacity(k.gjettet && !k.sist ? 0.55 : 1)
                        if !k.gjettet || d.fase == "ferdig" {
                            lapp(k.lapp, bredde: 84, maks: k.skjult ? 30 : 17, meg: k.skjult)
                                .transition(.asymmetric(insertion: .scale(scale: 1.3).combined(with: .opacity), removal: .move(edge: .bottom).combined(with: .opacity)))
                        }
                        if k.gjettet {
                            Image(systemName: "checkmark").font(.system(size: 14, weight: .black)).foregroundColor(morkBlekk).frame(width: 28, height: 28)
                                .background(Circle().fill(mint)).overlay(Circle().stroke(morkBlekk, lineWidth: 2)).offset(x: 44, y: 8)
                        }
                    }
                    Text(k.navn).font(.archivo(14, vekt: 900)).lineLimit(1)
                    if !k.merke.isEmpty {
                        Text(k.merke).font(.archivo(11, vekt: 800)).foregroundColor(k.gjettet ? morkBlekk : blekk).padding(.horizontal, 8).frame(height: 24)
                            .background(Capsule().fill(k.gjettet ? mint : papir)).overlay(Capsule().stroke(blekk, lineWidth: 1.5)).lineLimit(1).minimumScaleFactor(0.7)
                    }
                    if !k.knapp.isEmpty {
                        Button(action: { m.trykk(k.angre ? "pk-angre" : "pk-riktig", ["paa": k.id]) }) {
                            Text(k.knapp).font(.archivo(13, vekt: 900)).foregroundColor(morkBlekk).frame(maxWidth: .infinity).frame(height: 38)
                                .background(RoundedRectangle(cornerRadius: 10).fill(k.angre ? kortFarge : gul)).overlay(RoundedRectangle(cornerRadius: 10).stroke(morkBlekk, lineWidth: 2.5))
                                .background(RoundedRectangle(cornerRadius: 10).fill(morkBlekk).offset(x: 3, y: 3))
                        }.buttonStyle(TastTrykk())
                    }
                }
                .padding(10)
                .background(RoundedRectangle(cornerRadius: 14).fill(kortFarge)).overlay(RoundedRectangle(cornerRadius: 14).stroke(k.sist ? rust : blekk, lineWidth: k.sist ? 3 : 2))
            }
        }
    }

    // MARK: Ferdig – den siste drikker, alle lappene snudd, sluttknappene
    private func ferdig(_ d: PkData) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            if !d.dom.isEmpty {
                Text(d.dom).font(.archivo(17, vekt: 900)).foregroundColor(morkBlekk).padding(14).frame(maxWidth: .infinity, alignment: .leading)
                    .background(RoundedRectangle(cornerRadius: 14).fill(rosa)).overlay(RoundedRectangle(cornerRadius: 14).stroke(morkBlekk, lineWidth: 3))
                    .background(RoundedRectangle(cornerRadius: 14).fill(morkBlekk).offset(x: 4, y: 4))
            }
            rutenett(d)
            BlokkListe(m: m.blokker).padding(.top, 6)
        }
    }
}
