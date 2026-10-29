import SwiftUI
import UIKit
import WebKit

/// To sannheter og en løgn som native skjerm: stolen med den som sitter, de tre kortene du trykker på, hodene som
/// lander på kortet du stemte på, avsløringen med stempler, og pallen til slutt. Nettsiden under holder tilstanden
/// og klokka (rom.js tsData) – denne tegner. Skrivingen går via iPhonens dialog (tsSkjema), stemmen til nettsidens
/// egen «stem»-knapp, og pallen/sluttknappene kommer som blokker (BlokkListe).
struct TsHode: Identifiable { let id: String; let navn: String; let png: String }
struct TsKort: Identifiable { let id: Int; let tekst: String; let logn: Bool; let hoder: [TsHode] }
struct TsFasit {
    let n: Double, stol: TsHode?, stolTekst: String, under: String, logn: Int, kort: [TsKort], drikker: [String], sann: String, logntekst: String
}
struct TsPall: Identifiable { let id: String; let navn: String; let png: String; let n: Int; let plass: Int }

struct TsData {
    let fase: String, jeg: Bool, naa: Double, frist: Double, tittel: String, chip: String, gul: Bool
    let stol: TsHode?, stolTekst: String, stolUnder: String, skriver: Bool
    let du: String, hjelp: String, skjema: String, skjemaId: String
    let kort: [TsKort], kan: Bool, minStemme: Int, dinLogn: Int, dinTekst: String
    let stemt: [TsHode], status: String, fristTekst: String
    let forrige: TsFasit?, forrigeEtikett: String, neste: String, nesteNavn: String
    let pall: [TsPall], pallTittel: String, lurtTekst: String, slutt: [[String: Any]], stua: String, mer: String

    static func hode(_ h: [String: Any]?) -> TsHode? {
        guard let h = h else { return nil }
        return TsHode(id: h["id"] as? String ?? "", navn: h["navn"] as? String ?? "", png: h["png"] as? String ?? "")
    }
    static func kort(_ l: [[String: Any]]) -> [TsKort] {
        l.enumerated().map { i, k in TsKort(id: i, tekst: k["tekst"] as? String ?? "", logn: k["logn"] as? Bool ?? false, hoder: (k["hoder"] as? [[String: Any]] ?? []).compactMap { hode($0) }) }
    }
    init(_ d: [String: Any]) {
        func s(_ k: String) -> String { d[k] as? String ?? "" }
        func b(_ k: String) -> Bool { d[k] as? Bool ?? false }
        func n(_ k: String) -> Double { (d[k] as? NSNumber)?.doubleValue ?? 0 }
        fase = s("fase"); jeg = b("jeg"); naa = n("naa"); frist = n("frist"); tittel = s("tittel"); chip = s("chip"); gul = b("gul")
        stol = TsData.hode(d["stol"] as? [String: Any]); stolTekst = s("stolTekst"); stolUnder = s("stolUnder"); skriver = b("skriver")
        du = s("du"); hjelp = s("hjelp"); skjema = s("skjema"); skjemaId = s("skjemaId").isEmpty ? "tsSkjema" : s("skjemaId")
        kort = TsData.kort(d["kort"] as? [[String: Any]] ?? []); kan = b("kan")
        minStemme = (d["minStemme"] as? NSNumber)?.intValue ?? -1; dinLogn = (d["dinLogn"] as? NSNumber)?.intValue ?? -1; dinTekst = s("dinTekst")
        stemt = (d["stemt"] as? [[String: Any]] ?? []).compactMap { TsData.hode($0) }; status = s("status"); fristTekst = s("fristTekst")
        if let f = d["forrige"] as? [String: Any] {
            forrige = TsFasit(n: (f["n"] as? NSNumber)?.doubleValue ?? 0, stol: TsData.hode(f["stol"] as? [String: Any]), stolTekst: f["stolTekst"] as? String ?? "", under: f["under"] as? String ?? "",
                              logn: (f["logn"] as? NSNumber)?.intValue ?? -1, kort: TsData.kort(f["kort"] as? [[String: Any]] ?? []), drikker: f["drikker"] as? [String] ?? [],
                              sann: f["sann"] as? String ?? "Sann", logntekst: f["logntekst"] as? String ?? "Løgn")
        } else { forrige = nil }
        forrigeEtikett = s("forrigeEtikett"); neste = s("neste"); nesteNavn = s("nesteNavn")
        pall = (d["pall"] as? [[String: Any]] ?? []).map { p in TsPall(id: p["id"] as? String ?? "", navn: p["navn"] as? String ?? "", png: p["png"] as? String ?? "", n: (p["n"] as? NSNumber)?.intValue ?? 0, plass: (p["plass"] as? NSNumber)?.intValue ?? 1) }
        pallTittel = s("pallTittel"); lurtTekst = s("lurtTekst"); slutt = d["slutt"] as? [[String: Any]] ?? []
        stua = s("stua").isEmpty ? "Stua" : s("stua"); mer = s("mer").isEmpty ? "Mer" : s("mer")
    }
}

final class TsModell: ObservableObject {
    @Published var d: TsData? = nil
    let blokker = KortModell()
    private(set) var avvik: Double = 0
    weak var nett: WKWebView? { didSet { blokker.nett = nett } }
    private var bilder: [String: UIImage] = [:]
    func sett(_ dict: [String: Any]) {
        let ny = TsData(dict)
        if ny.naa > 0 { avvik = ny.naa - Date().timeIntervalSince1970 * 1000 }
        blokker.sett(["blokker": ny.slutt, "naa": dict["naa"] ?? 0])
        withAnimation(.spring(response: 0.45, dampingFraction: 0.78)) { d = ny }
    }
    /// Sekunder igjen til fristen (servertid, samme regning som nettsiden)
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
        UIImpactFeedbackGenerator(style: .light).impactOccurred()
        guard let data = try? JSONSerialization.data(withJSONObject: [g, attrs]), let json = String(data: data, encoding: .utf8) else { return }
        nett?.evaluateJavaScript("window.__mvLek && window.__mvLek.trykk.apply(null, \(json))", completionHandler: nil)
    }
    /// Skrivingen: nettsidens skjema (tre felt + løgnen) åpnes som iPhone-dialog
    func skjema(_ id: String) {
        UIImpactFeedbackGenerator(style: .light).impactOccurred()
        guard let data = try? JSONSerialization.data(withJSONObject: [id]), let json = String(data: data, encoding: .utf8) else { return }
        nett?.evaluateJavaScript("window.__mvLek && window.__mvLek.skjema(\(json)[0])", completionHandler: nil)
    }
}

struct TosannheterSkjerm: View {
    @ObservedObject var m: TsModell
    @Environment(\.colorScheme) private var modus
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
                            if d.fase == "ferdig" { ferdig(d) }
                            else if d.fase == "skriv" { skriv(d) }
                            else { stem(d) }
                        }
                        .padding(.horizontal, 16).padding(.top, 4).padding(.bottom, 24)
                    }
                }
            }
        }
        .foregroundColor(blekk)
    }

    // MARK: Toppen – tittel, chip, klokke og Stua/Mer
    private func topp(_ d: TsData) -> some View {
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

    // MARK: Stolen – den som sitter, med tekst ved siden
    private func stol(_ h: TsHode?, _ tittel: String, _ under: String, skriver: Bool) -> some View {
        HStack(alignment: .bottom, spacing: 14) {
            ZStack(alignment: .top) {
                Stol().fill(oransje).overlay(Stol().stroke(morkBlekk, style: StrokeStyle(lineWidth: 3.5, lineJoin: .round)))
                StolBein().stroke(morkBlekk, style: StrokeStyle(lineWidth: 5, lineCap: .round))
                hode(h?.png ?? "", 64).offset(x: 0, y: 2)
            }
            .frame(width: 92, height: 112)
            VStack(alignment: .leading, spacing: 6) {
                Text(tittel.uppercased()).font(.archivo(28, vekt: 900)).lineLimit(3).minimumScaleFactor(0.7).fixedSize(horizontal: false, vertical: true)
                if skriver { Prikker(farge: blekk, bakgrunn: kortFarge) }
                if !under.isEmpty { Text(under).font(.archivo(15, vekt: 800)).opacity(0.7).fixedSize(horizontal: false, vertical: true) }
            }
            .padding(.bottom, 6)
            Spacer(minLength: 0)
        }
    }

    // MARK: Skriv-fasen
    @ViewBuilder private func skriv(_ d: TsData) -> some View {
        if d.jeg {
            Text(d.du.uppercased()).font(.archivo(26, vekt: 900))
            Text(d.hjelp).font(.archivo(15, vekt: 800)).opacity(0.7)
            VStack(spacing: 10) {
                ForEach(0..<3, id: \.self) { i in
                    HStack(spacing: 10) {
                        Text("\(i + 1)").font(.archivo(17, vekt: 900)).frame(width: 34, height: 34).foregroundColor(morkBlekk)
                            .background(Circle().fill(lys)).overlay(Circle().stroke(morkBlekk, lineWidth: 3))
                        RoundedRectangle(cornerRadius: 6).stroke(blekk.opacity(0.35), style: StrokeStyle(lineWidth: 2.5, dash: [7, 6])).frame(height: 40)
                    }
                }
                storKnapp(d.skjema) { m.skjema(d.skjemaId) }
            }
            .padding(12)
            .background(RoundedRectangle(cornerRadius: 10).fill(kortFarge)).overlay(RoundedRectangle(cornerRadius: 10).stroke(blekk, lineWidth: 3))
            .background(RoundedRectangle(cornerRadius: 10).fill(blekk).offset(x: 4, y: 4))
            if let fr = d.forrige {
                Text(d.forrigeEtikett.uppercased()).font(.archivo(12, vekt: 900)).opacity(0.65).padding(.top, 8)
                FasitVisning(m: m, f: fr, modus: modus).id(fr.n)
            }
        } else if let fr = d.forrige {
            FasitVisning(m: m, f: fr, modus: modus).id(fr.n)
            HStack(spacing: 10) {
                Text(d.neste.uppercased()).font(.archivo(13, vekt: 900)).opacity(0.65)
                Prikker(farge: blekk, bakgrunn: kortFarge, liten: true)
                Spacer()
                Text(d.nesteNavn.uppercased()).font(.archivo(22, vekt: 900)).lineLimit(1).minimumScaleFactor(0.6)
            }
            .padding(.horizontal, 14).padding(.vertical, 12)
            .background(RoundedRectangle(cornerRadius: 10).fill(kortFarge)).overlay(RoundedRectangle(cornerRadius: 10).stroke(blekk, lineWidth: 3))
            .background(RoundedRectangle(cornerRadius: 10).fill(blekk).offset(x: 4, y: 4))
        } else {
            stol(d.stol, d.stolTekst, d.stolUnder, skriver: true)
        }
    }

    // MARK: Stem-fasen – trykk på løgnen
    @ViewBuilder private func stem(_ d: TsData) -> some View {
        stol(d.stol, d.stolTekst, d.stolUnder, skriver: false)
        VStack(spacing: 14) {
            ForEach(d.kort) { k in
                let valgt = d.minStemme == k.id
                Button(action: { m.trykk("stem", ["paa": String(k.id)]) }) {
                    kortRad(k, bakgrunn: valgt ? gul : lys, nedtrykt: valgt, hodeUttrykk: true)
                }
                .buttonStyle(.plain).disabled(!d.kan)
                .overlay(alignment: .topTrailing) {
                    if d.dinLogn == k.id {
                        Text(d.dinTekst.uppercased()).font(.archivo(11, vekt: 900)).foregroundColor(morkBlekk)
                            .padding(.horizontal, 8).padding(.vertical, 2)
                            .background(RoundedRectangle(cornerRadius: 4).fill(rosa)).overlay(RoundedRectangle(cornerRadius: 4).stroke(morkBlekk, lineWidth: 2.5))
                            .offset(x: -10, y: -11)
                    }
                }
            }
        }
        HStack(spacing: 10) {
            HStack(spacing: -8) {
                ForEach(d.stemt) { h in hode(h.png, 30).transition(.asymmetric(insertion: .offset(y: -30).combined(with: .opacity), removal: .opacity)) }
            }
            Text(d.status).font(.archivo(15, vekt: 900))
            Spacer()
        }
        if d.frist > 0 {
            TimelineView(.periodic(from: .now, by: 1)) { _ in
                let n = m.igjen(d.frist)
                HStack(spacing: 8) {
                    Capsule().fill(n <= 10 ? oransje : gul).frame(width: 10, height: 10)
                    Text("\(n) " + d.fristTekst).font(.archivo(14, vekt: 700)).opacity(0.8)
                }
            }
        }
    }

    /// Ett av de tre kortene: nummer, teksten og hodene som har landet på det
    private func kortRad(_ k: TsKort, bakgrunn: Color, nedtrykt: Bool, hodeUttrykk: Bool) -> some View {
        HStack(spacing: 12) {
            Text("\(k.id + 1)").font(.archivo(17, vekt: 900)).frame(width: 34, height: 34).foregroundColor(morkBlekk)
                .background(Circle().fill(lys)).overlay(Circle().stroke(morkBlekk, lineWidth: 3))
            Text(k.tekst).font(.archivo(tsStorrelse(k.tekst), vekt: 850)).lineSpacing(1).multilineTextAlignment(.leading)
                .fixedSize(horizontal: false, vertical: true).frame(maxWidth: .infinity, alignment: .leading)
            HStack(spacing: -12) {
                ForEach(k.hoder) { h in hode(h.png, 34).transition(.asymmetric(insertion: .offset(y: -34).combined(with: .opacity), removal: .opacity)) }
            }
            .frame(minWidth: 34, alignment: .trailing)
        }
        .padding(12).frame(minHeight: 92).foregroundColor(morkBlekk)
        .background(RoundedRectangle(cornerRadius: 10).fill(bakgrunn))
        .overlay(RoundedRectangle(cornerRadius: 10).stroke(morkBlekk, lineWidth: 3))
        .background(RoundedRectangle(cornerRadius: 10).fill(morkBlekk).offset(x: nedtrykt ? 2 : 5, y: nedtrykt ? 2 : 5))
        .offset(x: nedtrykt ? 3 : 0, y: nedtrykt ? 3 : 0)
    }

    // MARK: Ferdig – pallen og hva nå
    @ViewBuilder private func ferdig(_ d: TsData) -> some View {
        if let fr = d.forrige { FasitVisning(m: m, f: fr, modus: modus).id(fr.n) }
        if !d.pall.isEmpty {
            Text(d.pallTittel.uppercased()).font(.archivo(32, vekt: 900)).padding(.top, 10)
            HStack(alignment: .bottom, spacing: 10) {
                ForEach(pallRekke(d.pall)) { p in
                    VStack(spacing: 4) {
                        hode(p.png, 64)
                        Text(p.navn).font(.archivo(15, vekt: 900)).lineLimit(1).minimumScaleFactor(0.7)
                        VStack(spacing: 0) {
                            Text("\(p.n)").font(.archivo(26, vekt: 900))
                            Text(d.lurtTekst.uppercased()).font(.archivo(11, vekt: 900))
                        }
                        .frame(maxWidth: .infinity).frame(minHeight: p.plass == 1 ? 96 : p.plass == 2 ? 62 : 40)
                        .foregroundColor(p.plass == 1 ? morkBlekk : blekk)
                        .background(PallForm().fill(p.plass == 1 ? gul : kortFarge)).overlay(PallForm().stroke(blekk, lineWidth: 3))
                    }
                    .frame(width: 96)
                }
            }
            .frame(maxWidth: .infinity)
            Rectangle().fill(blekk).frame(height: 3)
        }
        BlokkListe(m: m.blokker).padding(.top, 6)
    }
    private func pallRekke(_ p: [TsPall]) -> [TsPall] {
        let a = p.first { $0.plass == 1 }, b = p.first { $0.plass == 2 }, c = p.first { $0.plass == 3 }
        return [b, a, c].compactMap { $0 }
    }

    private func storKnapp(_ t: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(t.uppercased()).font(.archivo(18, vekt: 900)).foregroundColor(morkBlekk).lineLimit(2).minimumScaleFactor(0.7)
                .frame(maxWidth: .infinity).frame(minHeight: 60).padding(.horizontal, 10)
                .background(RoundedRectangle(cornerRadius: 14).fill(gul)).overlay(RoundedRectangle(cornerRadius: 14).stroke(morkBlekk, lineWidth: 3))
                .background(RoundedRectangle(cornerRadius: 14).fill(morkBlekk).offset(x: 4, y: 4))
        }.buttonStyle(.plain)
    }
}

/// Tekststørrelse som på nettsiden: lange ord og lange kort får mindre skrift
func tsStorrelse(_ t: String) -> CGFloat {
    let lengste = t.components(separatedBy: " ").map { $0.count }.max() ?? 1
    let a = floor(210 / (Double(max(lengste, 1)) * 0.56)), b = floor(420 / (Double(max(t.count, 1)) * 0.5))
    return CGFloat(max(14, min(21, min(a, b))))
}

/// Avsløringen: kortene farges ett og ett, stemplene klasker på, hodene lander og løgnen rister – bare første gang.
struct FasitVisning: View {
    @ObservedObject var m: TsModell
    let f: TsFasit
    let modus: ColorScheme
    @State private var inn = false
    private let gul = Color(red: 1, green: 0.824, blue: 0.247)
    private let mint = Color(red: 0.388, green: 0.886, blue: 0.659)
    private let rosa = Color(red: 1, green: 0.612, blue: 0.761)
    private let morkBlekk = Color(red: 0.086, green: 0.071, blue: 0.059)
    private let lys = Color(red: 1, green: 0.973, blue: 0.933)
    private let oransje = Color(red: 1, green: 0.357, blue: 0.122)
    private var blekk: Color { modus == .dark ? lys : morkBlekk }
    private var kortFarge: Color { modus == .dark ? Color(red: 0.173, green: 0.169, blue: 0.188) : .white }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .bottom, spacing: 14) {
                ZStack(alignment: .top) {
                    Stol().fill(oransje).overlay(Stol().stroke(morkBlekk, style: StrokeStyle(lineWidth: 3.5, lineJoin: .round)))
                    StolBein().stroke(morkBlekk, style: StrokeStyle(lineWidth: 5, lineCap: .round))
                    hode(f.stol?.png ?? "", 64).offset(y: 2)
                }.frame(width: 92, height: 112)
                VStack(alignment: .leading, spacing: 6) {
                    Text(f.stolTekst.uppercased()).font(.archivo(28, vekt: 900)).lineLimit(3).minimumScaleFactor(0.7).fixedSize(horizontal: false, vertical: true)
                    Text(f.under).font(.archivo(15, vekt: 800)).opacity(0.7)
                }.padding(.bottom, 6)
                Spacer(minLength: 0)
            }
            VStack(spacing: 14) {
                ForEach(f.kort) { k in
                    let forsink = k.logn ? 0.76 : Double(k.id) * 0.26
                    HStack(spacing: 12) {
                        Text("\(k.id + 1)").font(.archivo(17, vekt: 900)).frame(width: 34, height: 34).foregroundColor(morkBlekk)
                            .background(Circle().fill(lys)).overlay(Circle().stroke(morkBlekk, lineWidth: 3))
                        Text(k.tekst).font(.archivo(tsStorrelse(k.tekst), vekt: 850)).multilineTextAlignment(.leading)
                            .fixedSize(horizontal: false, vertical: true).frame(maxWidth: .infinity, alignment: .leading)
                        HStack(spacing: -12) {
                            ForEach(Array(k.hoder.enumerated()), id: \.offset) { j, h in
                                hode(h.png, 34)
                                    .offset(y: inn ? 0 : -34).opacity(inn ? 1 : 0)
                                    .animation(.spring(response: 0.5, dampingFraction: 0.72).delay(forsink + 0.2 + Double(j) * 0.07), value: inn)
                            }
                        }.frame(minWidth: 34, alignment: .trailing)
                    }
                    .padding(12).frame(minHeight: 92).foregroundColor(inn ? morkBlekk : blekk)
                    .background(RoundedRectangle(cornerRadius: 10).fill(inn ? (k.logn ? rosa : mint) : kortFarge))
                    .overlay(RoundedRectangle(cornerRadius: 10).stroke(inn ? morkBlekk : blekk, lineWidth: 3))
                    .background(RoundedRectangle(cornerRadius: 10).fill(morkBlekk).offset(x: 5, y: 5))
                    .animation(.easeOut(duration: 0.26).delay(forsink), value: inn)
                    .overlay(alignment: .topTrailing) {
                        Text((k.logn ? f.logntekst : f.sann).uppercased())
                            .font(.archivo(k.logn ? 24 : 19, vekt: 900)).foregroundColor(k.logn ? lys : morkBlekk)
                            .padding(.horizontal, 10).padding(.vertical, 2)
                            .background(RoundedRectangle(cornerRadius: 4).fill(k.logn ? morkBlekk : lys)).overlay(RoundedRectangle(cornerRadius: 4).stroke(morkBlekk, lineWidth: 3))
                            .rotationEffect(.degrees(inn ? -7 : -16)).scaleEffect(inn ? 1 : 1.6).opacity(inn ? 1 : 0)
                            .offset(x: k.logn ? -54 : -62, y: -14)
                            .animation(.spring(response: 0.45, dampingFraction: 0.7).delay(forsink), value: inn)
                    }
                    .modifier(TsRist(paa: inn && k.logn, forsink: 0.9))
                }
            }
            if !f.drikker.isEmpty {
                FlytRad(spacing: 8) {
                    ForEach(Array(f.drikker.enumerated()), id: \.offset) { j, t in
                        Text(t).font(.archivo(17, vekt: 900)).foregroundColor(morkBlekk)
                            .padding(.horizontal, 12).padding(.vertical, 6)
                            .background(Capsule().fill(rosa)).overlay(Capsule().stroke(morkBlekk, lineWidth: 3))
                            .opacity(inn ? 1 : 0).offset(y: inn ? 0 : 12)
                            .animation(.spring(response: 0.4, dampingFraction: 0.8).delay(1.2 + Double(j) * 0.08), value: inn)
                    }
                }
            }
        }
        .onAppear { DispatchQueue.main.asyncAfter(deadline: .now() + 0.05) { inn = true } }
    }
    private func hode(_ png: String, _ px: CGFloat) -> some View {
        Group {
            if let img = m.bilde(png) { Image(uiImage: img).resizable().aspectRatio(contentMode: .fit) }
            else { Circle().fill(gul).overlay(Circle().stroke(morkBlekk, lineWidth: 2)).padding(2) }
        }.frame(width: px, height: px)
    }
}

/// Løgnen rister litt når den er avslørt (én gang)
struct TsRist: ViewModifier {
    let paa: Bool, forsink: Double
    @State private var x: CGFloat = 0
    func body(content: Content) -> some View {
        content.offset(x: x).onChange(of: paa) { v in
            guard v else { return }
            DispatchQueue.main.asyncAfter(deadline: .now() + forsink) {
                withAnimation(.easeInOut(duration: 0.1)) { x = -5 }
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) { withAnimation(.easeInOut(duration: 0.1)) { x = 5 } }
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) { withAnimation(.easeInOut(duration: 0.1)) { x = -3 } }
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) { withAnimation(.easeInOut(duration: 0.12)) { x = 0 } }
            }
        }
    }
}

/// Stolen fra nettsiden (ts-stolsvg): rygg og sete
struct Stol: Shape {
    func path(in r: CGRect) -> Path {
        let sx = r.width / 92, sy = r.height / 112
        var p = Path()
        p.addRect(CGRect(x: 18 * sx, y: 30 * sy, width: 56 * sx, height: 40 * sy))
        p.addRect(CGRect(x: 10 * sx, y: 70 * sy, width: 72 * sx, height: 12 * sy))
        return p
    }
}
struct StolBein: Shape {
    func path(in r: CGRect) -> Path {
        let sx = r.width / 92, sy = r.height / 112
        var p = Path()
        p.move(to: CGPoint(x: 16 * sx, y: 82 * sy)); p.addLine(to: CGPoint(x: 16 * sx, y: 108 * sy))
        p.move(to: CGPoint(x: 76 * sx, y: 82 * sy)); p.addLine(to: CGPoint(x: 76 * sx, y: 108 * sy))
        return p
    }
}
/// Pallen: runde hjørner oppe, rett kant nede
struct PallForm: Shape {
    func path(in r: CGRect) -> Path {
        var p = Path()
        p.move(to: CGPoint(x: r.minX, y: r.maxY))
        p.addLine(to: CGPoint(x: r.minX, y: r.minY + 6)); p.addQuadCurve(to: CGPoint(x: r.minX + 6, y: r.minY), control: CGPoint(x: r.minX, y: r.minY))
        p.addLine(to: CGPoint(x: r.maxX - 6, y: r.minY)); p.addQuadCurve(to: CGPoint(x: r.maxX, y: r.minY + 6), control: CGPoint(x: r.maxX, y: r.minY))
        p.addLine(to: CGPoint(x: r.maxX, y: r.maxY))
        return p
    }
}

/// «Skriver …»-prikkene i en snakkeboble
struct Prikker: View {
    let farge: Color, bakgrunn: Color
    var liten = false
    @State private var opp = false
    var body: some View {
        HStack(spacing: liten ? 4 : 6) {
            ForEach(0..<3, id: \.self) { i in
                Circle().fill(farge).frame(width: liten ? 6 : 8, height: liten ? 6 : 8)
                    .offset(y: opp ? -3 : 1)
                    .animation(.easeInOut(duration: 0.55).repeatForever(autoreverses: true).delay(Double(i) * 0.16), value: opp)
            }
        }
        .padding(.horizontal, liten ? 8 : 12).padding(.vertical, liten ? 5 : 8)
        .background(RoundedRectangle(cornerRadius: liten ? 10 : 14).fill(bakgrunn)).overlay(RoundedRectangle(cornerRadius: liten ? 10 : 14).stroke(farge, lineWidth: liten ? 2 : 3))
        .onAppear { opp = true }
    }
}

/// Enkel flytende rad (som flex-wrap): elementene legges etter hverandre og bryter når raden er full
struct FlytRad<Innhold: View>: View {
    var spacing: CGFloat = 8
    @ViewBuilder let innhold: () -> Innhold
    var body: some View {
        if #available(iOS 16.0, *) { FlytLayout(spacing: spacing) { innhold() } }
        else { VStack(alignment: .leading, spacing: spacing) { innhold() } }
    }
}
@available(iOS 16.0, *)
struct FlytLayout: Layout {
    var spacing: CGFloat = 8
    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let bredde = proposal.width ?? 360
        var x: CGFloat = 0, y: CGFloat = 0, radH: CGFloat = 0
        for v in subviews {
            let s = v.sizeThatFits(.unspecified)
            if x > 0 && x + s.width > bredde { x = 0; y += radH + spacing; radH = 0 }
            x += s.width + spacing; radH = max(radH, s.height)
        }
        return CGSize(width: bredde, height: y + radH)
    }
    func placeSubviews(in b: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        var x: CGFloat = b.minX, y: CGFloat = b.minY, radH: CGFloat = 0
        for v in subviews {
            let s = v.sizeThatFits(.unspecified)
            if x > b.minX && x + s.width > b.maxX { x = b.minX; y += radH + spacing; radH = 0 }
            v.place(at: CGPoint(x: x, y: y), proposal: ProposedViewSize(s))
            x += s.width + spacing; radH = max(radH, s.height)
        }
    }
}
