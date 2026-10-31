import SwiftUI
import UIKit
import WebKit

/// Nyhetsrunden som native skjerm: avishodet, spørsmålet, svarmåten (A–D, talltastatur eller skrivedialogen),
/// avsløringen med hoder på svarene og nåler på tallinja, lista og pallen til slutt. Nettsiden under holder
/// tilstanden og klokka (rom.js nrData) – denne tegner, og trykkene går til nettsidens egne knapper.
struct NrHode: Identifiable { let id: String; let navn: String; let png: String; let oppe: Bool }
struct NrLengde: Identifiable { let id: Int; let g: String; let tekst: String; let valgt: Bool }
struct NrAlt: Identifiable { let id: Int; let bokstav: String; let tekst: String; let valgt: Bool; let rett: Bool; let feil: Bool; let hoder: [NrHode]; let stempel: String }
struct NrPinne: Identifiable { let id: String; let png: String; let x: Double; let rad: Int; let tekst: String; let beste: Bool; let flat: Bool }
struct NrRad: Identifiable { let id: String; let navn: String; let png: String; let hva: String; let tomt: Bool; let merke: String; let klasse: String; let kanFlippe: Bool }
struct NrPall: Identifiable { let id: String; let navn: String; let png: String; let n: Int; let plass: Int }
struct NrKaaring: Identifiable { let id: Int; let tittel: String; let tekst: String }
struct NrTall { let etikett: String, taster: [String], mitt: String, las: String, bytt: String, last: String }
struct NrFritt { let skjemaId: String, knapp: String, svart: String }
struct NrKlar { let forside: String, under: String, hoder: [NrHode], lengder: [NrLengde], start: String, vent: String }
struct NrSpm { let qtype: String, mitt: String, alt: [NrAlt], tall: NrTall?, fritt: NrFritt?, vis: String, vent: String, folk: [NrHode], status: String }
struct NrTallinje { let fasitX: Double, fasitTekst: String, pinner: [NrPinne], rader: Int }
struct NrResultat { let klasse: String, tittel: String, info: String, kilde: String, url: String }
struct NrSvar { let fasitEtikett: String, fasit: String, alt: [NrAlt], tallinje: NrTallinje?, liste: [NrRad], resultat: NrResultat?, neste: String, vent: String }
struct NrFerdig { let tittel: String, pall: [NrPall], kaaringer: [NrKaaring], rest: [NrPall], nyEtikett: String, lengder: [NrLengde], smaa: String }

struct NrData {
    let fase: String, i: Int, antall: Int, uke: String, vert: Bool, naa: Double, frist: Double, lokale: String, tittel: String, under: String
    let sporsmalType: String, les: String, q: String
    let klar: NrKlar?, spm: NrSpm?, svar: NrSvar?, ferdig: NrFerdig?, slutt: [[String: Any]], stua: String, mer: String

    static func hode(_ h: [String: Any]) -> NrHode { NrHode(id: h["id"] as? String ?? "", navn: h["navn"] as? String ?? "", png: h["png"] as? String ?? "", oppe: h["oppe"] as? Bool ?? false) }
    static func hoder(_ l: Any?) -> [NrHode] { (l as? [[String: Any]] ?? []).map { hode($0) } }
    static func lengder(_ l: Any?) -> [NrLengde] { (l as? [[String: Any]] ?? []).map { x in NrLengde(id: (x["n"] as? NSNumber)?.intValue ?? 0, g: x["g"] as? String ?? "nr-lengde", tekst: x["tekst"] as? String ?? "", valgt: x["valgt"] as? Bool ?? false) } }
    static func alt(_ l: Any?) -> [NrAlt] {
        (l as? [[String: Any]] ?? []).enumerated().map { i, a in NrAlt(id: i, bokstav: a["bokstav"] as? String ?? "", tekst: a["tekst"] as? String ?? "", valgt: a["valgt"] as? Bool ?? false, rett: a["rett"] as? Bool ?? false, feil: a["feil"] as? Bool ?? false, hoder: hoder(a["hoder"]), stempel: a["stempel"] as? String ?? "") }
    }
    static func pall(_ l: Any?) -> [NrPall] { (l as? [[String: Any]] ?? []).map { p in NrPall(id: p["id"] as? String ?? "", navn: p["navn"] as? String ?? "", png: p["png"] as? String ?? "", n: (p["n"] as? NSNumber)?.intValue ?? 0, plass: (p["plass"] as? NSNumber)?.intValue ?? 1) } }
    init(_ d: [String: Any]) {
        func s(_ k: String) -> String { d[k] as? String ?? "" }
        func n(_ k: String) -> Double { (d[k] as? NSNumber)?.doubleValue ?? 0 }
        fase = s("fase"); i = Int(n("i")); antall = Int(n("antall")); uke = s("uke"); vert = d["vert"] as? Bool ?? false; naa = n("naa"); frist = n("frist"); lokale = s("lokale")
        tittel = s("tittel").isEmpty ? "Nyhetsrunden" : s("tittel"); under = s("under")
        let sp = d["sporsmal"] as? [String: Any] ?? [:]
        sporsmalType = sp["type"] as? String ?? ""; les = sp["les"] as? String ?? ""; q = sp["q"] as? String ?? ""
        if let k = d["klar"] as? [String: Any] {
            klar = NrKlar(forside: k["forside"] as? String ?? "", under: k["under"] as? String ?? "", hoder: NrData.hoder(k["hoder"]), lengder: NrData.lengder(k["lengder"]), start: k["start"] as? String ?? "", vent: k["vent"] as? String ?? "")
        } else { klar = nil }
        if let x = d["spm"] as? [String: Any] {
            var tall: NrTall? = nil, fritt: NrFritt? = nil
            if let t = x["tall"] as? [String: Any] { tall = NrTall(etikett: t["etikett"] as? String ?? "", taster: t["taster"] as? [String] ?? [], mitt: t["mitt"] as? String ?? "", las: t["las"] as? String ?? "", bytt: t["bytt"] as? String ?? "", last: t["last"] as? String ?? "") }
            if let f = x["fritt"] as? [String: Any] { fritt = NrFritt(skjemaId: f["skjemaId"] as? String ?? "nrSkjema", knapp: f["knapp"] as? String ?? "", svart: f["svart"] as? String ?? "") }
            spm = NrSpm(qtype: x["qtype"] as? String ?? "", mitt: x["mitt"] as? String ?? "", alt: NrData.alt(x["alt"]), tall: tall, fritt: fritt, vis: x["vis"] as? String ?? "", vent: x["vent"] as? String ?? "", folk: NrData.hoder(x["folk"]), status: x["status"] as? String ?? "")
        } else { spm = nil }
        if let x = d["svar"] as? [String: Any] {
            var linje: NrTallinje? = nil, res: NrResultat? = nil
            if let t = x["tallinje"] as? [String: Any] {
                linje = NrTallinje(fasitX: (t["fasitX"] as? NSNumber)?.doubleValue ?? 50, fasitTekst: t["fasitTekst"] as? String ?? "",
                                   pinner: (t["pinner"] as? [[String: Any]] ?? []).map { p in NrPinne(id: p["id"] as? String ?? "", png: p["png"] as? String ?? "", x: (p["x"] as? NSNumber)?.doubleValue ?? 50, rad: (p["rad"] as? NSNumber)?.intValue ?? 0, tekst: p["tekst"] as? String ?? "", beste: p["beste"] as? Bool ?? false, flat: p["flat"] as? Bool ?? false) },
                                   rader: (t["rader"] as? NSNumber)?.intValue ?? 1)
            }
            if let r = x["resultat"] as? [String: Any] { res = NrResultat(klasse: r["klasse"] as? String ?? "", tittel: r["tittel"] as? String ?? "", info: r["info"] as? String ?? "", kilde: r["kilde"] as? String ?? "", url: r["url"] as? String ?? "") }
            svar = NrSvar(fasitEtikett: x["fasitEtikett"] as? String ?? "", fasit: x["fasit"] as? String ?? "", alt: NrData.alt(x["alt"]), tallinje: linje,
                          liste: (x["liste"] as? [[String: Any]] ?? []).map { r in NrRad(id: r["id"] as? String ?? "", navn: r["navn"] as? String ?? "", png: r["png"] as? String ?? "", hva: r["hva"] as? String ?? "", tomt: r["tomt"] as? Bool ?? false, merke: r["merke"] as? String ?? "", klasse: r["klasse"] as? String ?? "", kanFlippe: r["kanFlippe"] as? Bool ?? false) },
                          resultat: res, neste: x["neste"] as? String ?? "", vent: x["vent"] as? String ?? "")
        } else { svar = nil }
        if let f = d["ferdig"] as? [String: Any] {
            ferdig = NrFerdig(tittel: f["tittel"] as? String ?? "", pall: NrData.pall(f["pall"]), kaaringer: (f["kaaringer"] as? [[String: Any]] ?? []).enumerated().map { i, k in NrKaaring(id: i, tittel: k["tittel"] as? String ?? "", tekst: k["tekst"] as? String ?? "") },
                              rest: NrData.pall(f["rest"]), nyEtikett: f["nyEtikett"] as? String ?? "", lengder: NrData.lengder(f["lengder"]), smaa: f["smaa"] as? String ?? "")
        } else { ferdig = nil }
        slutt = d["slutt"] as? [[String: Any]] ?? []
        stua = s("stua").isEmpty ? "Stua" : s("stua"); mer = s("mer").isEmpty ? "Mer" : s("mer")
    }
}

final class NrModell: ObservableObject {
    @Published var d: NrData? = nil
    /// Talltastaturet: sifrene du har trykket (per spørsmål)
    @Published var tall = ""
    var tallNokkel = ""
    let blokker = KortModell()
    private(set) var avvik: Double = 0
    weak var nett: WKWebView? { didSet { blokker.nett = nett } }
    private var bilder: [String: UIImage] = [:]
    func sett(_ dict: [String: Any]) {
        let ny = NrData(dict)
        if ny.naa > 0 { avvik = ny.naa - Date().timeIntervalSince1970 * 1000 }
        let nokkel = "\(ny.fase):\(ny.i)"
        if nokkel != tallNokkel { tallNokkel = nokkel; tall = ny.spm?.tall?.mitt ?? "" }
        blokker.sett(["blokker": ny.slutt, "naa": dict["naa"] ?? 0])
        withAnimation(.spring(response: 0.45, dampingFraction: 0.8)) { d = ny }
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
    func format(_ sifre: String) -> String {
        guard let n = Double(sifre) else { return sifre }
        let f = NumberFormatter(); f.numberStyle = .decimal; f.locale = Locale(identifier: d?.lokale ?? "nb-NO"); f.maximumFractionDigits = 0
        return f.string(from: NSNumber(value: n)) ?? sifre
    }
    func tast(_ k: String) {
        UIImpactFeedbackGenerator(style: .light).impactOccurred(intensity: 0.6)
        if k == "⌫" { tall = String(tall.dropLast()) }
        else if tall.count < 12 { tall = (tall == "0" ? "" : tall) + k }
        while tall.count > 1 && tall.hasPrefix("0") { tall.removeFirst() }
    }
    func trykk(_ g: String, _ attrs: [String: String] = [:]) {
        UIImpactFeedbackGenerator(style: .light).impactOccurred()
        guard let data = try? JSONSerialization.data(withJSONObject: [g, attrs]), let json = String(data: data, encoding: .utf8) else { return }
        nett?.evaluateJavaScript("window.__mvLek && window.__mvLek.trykk.apply(null, \(json))", completionHandler: nil)
    }
    func skjema(_ id: String) {
        UIImpactFeedbackGenerator(style: .light).impactOccurred()
        guard let data = try? JSONSerialization.data(withJSONObject: [id]), let json = String(data: data, encoding: .utf8) else { return }
        nett?.evaluateJavaScript("window.__mvLek && window.__mvLek.skjema(\(json)[0])", completionHandler: nil)
    }
}

struct NyhetsrundenSkjerm: View {
    @ObservedObject var m: NrModell
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
    private let blaa = Color(red: 0.486, green: 0.776, blue: 0.996)
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
                            if let k = d.klar { klar(d, k) }
                            else if let f = d.ferdig { ferdig(d, f) }
                            else if let sp = d.spm { sporsmal(d); svarer(d, sp) }
                            else if let sv = d.svar { sporsmal(d, liten: true); avslort(d, sv) }
                        }
                        .padding(.horizontal, 16).padding(.top, 4).padding(.bottom, 24)
                    }
                }
            }
        }
        .foregroundColor(blekk)
    }

    // MARK: Avishodet – NYHETSRUNDEN, uke og spørsmål nr, klokka og Stua/Mer
    private func topp(_ d: NrData) -> some View {
        HStack(spacing: 8) {
            VStack(alignment: .leading, spacing: 0) {
                Text(d.tittel.uppercased()).font(.archivo(17, vekt: 900)).tracking(-0.3).lineLimit(1).minimumScaleFactor(0.7)
                Text(d.under).font(.archivo(12, vekt: 700)).opacity(0.65).lineLimit(1).minimumScaleFactor(0.7)
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
        .overlay(Rectangle().fill(blekk).frame(height: 2).padding(.horizontal, 16), alignment: .bottom)
    }
    private func liten(_ t: String, _ sym: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: 5) { Image(systemName: sym).font(.system(size: 13, weight: .bold)); Text(t).font(.archivo(13, vekt: 800)) }
                .padding(.horizontal, 11).frame(height: 34)
                .background(Capsule().fill(kortFarge)).overlay(Capsule().stroke(blekk, lineWidth: 2))
        }.buttonStyle(.plain)
    }
    private func hode(_ png: String, _ px: CGFloat, flat: Bool = false) -> some View {
        Group {
            if let img = m.bilde(png) { Image(uiImage: img).resizable().aspectRatio(contentMode: .fit) }
            else { Circle().fill(gul).overlay(Circle().stroke(morkBlekk, lineWidth: 2)).padding(2) }
        }.frame(width: px, height: px).opacity(flat ? 0.55 : 1)
    }
    private func storKnapp(_ t: String, farge: Color? = nil, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(t.uppercased()).font(.archivo(19, vekt: 900)).foregroundColor(morkBlekk).multilineTextAlignment(.center)
                .frame(maxWidth: .infinity).frame(minHeight: 62).padding(.horizontal, 10)
                .background(RoundedRectangle(cornerRadius: 14).fill(farge ?? gul)).overlay(RoundedRectangle(cornerRadius: 14).stroke(morkBlekk, lineWidth: 3))
                .background(RoundedRectangle(cornerRadius: 14).fill(morkBlekk).offset(x: 4, y: 4))
        }.buttonStyle(TastTrykk())
    }
    private func vent(_ t: String) -> some View {
        Text(t).font(.archivo(15, vekt: 600)).opacity(0.7).frame(maxWidth: .infinity).multilineTextAlignment(.center).padding(.top, 4)
    }
    private func lengder(_ l: [NrLengde]) -> some View {
        HStack(spacing: 8) {
            ForEach(l) { x in
                Button(action: { m.trykk(x.g, ["n": String(x.id)]) }) {
                    VStack(spacing: 0) {
                        Text("\(x.id)").font(.archivo(22, vekt: 900))
                        Text(x.tekst).font(.archivo(11, vekt: 700)).opacity(0.7)
                    }
                    .foregroundColor(x.valgt ? morkBlekk : blekk).frame(maxWidth: .infinity).frame(height: 58)
                    .background(RoundedRectangle(cornerRadius: 12).fill(x.valgt ? gul : kortFarge)).overlay(RoundedRectangle(cornerRadius: 12).stroke(blekk, lineWidth: x.valgt ? 3 : 2))
                }.buttonStyle(TastTrykk())
            }
        }
    }

    // MARK: Forsiden – uke, hodene og lengden (verten)
    private func klar(_ d: NrData, _ k: NrKlar) -> some View {
        VStack(alignment: .leading, spacing: 14) {
            VStack(alignment: .leading, spacing: 2) {
                Text(k.forside).font(.archivo(40, vekt: 900)).tracking(-1)
                Text(k.under).font(.archivo(22, vekt: 800)).opacity(0.8)
            }.padding(.top, 8)
            HStack(spacing: -10) { ForEach(k.hoder) { h in hode(h.png, 56) } }
            if !k.lengder.isEmpty { lengder(k.lengder) }
            if !k.start.isEmpty { storKnapp(k.start) { m.trykk("nr-start") } }
            if !k.vent.isEmpty { vent(k.vent) }
        }
    }

    // MARK: Spørsmålet – type-merke, «Les det høyt» til verten, og teksten
    private func sporsmal(_ d: NrData, liten: Bool = false) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(spacing: 6) {
                Text(d.sporsmalType.uppercased()).font(.archivo(11, vekt: 900)).foregroundColor(morkBlekk).padding(.horizontal, 8).frame(height: 22).background(Capsule().fill(blaa)).overlay(Capsule().stroke(morkBlekk, lineWidth: 1.5))
                if !d.les.isEmpty { Text(d.les).font(.archivo(11, vekt: 900)).foregroundColor(morkBlekk).padding(.horizontal, 8).frame(height: 22).background(Capsule().fill(gul)).overlay(Capsule().stroke(morkBlekk, lineWidth: 1.5)) }
                Spacer()
            }
            Text(d.q).font(.archivo(liten ? 17 : 23, vekt: 900)).fixedSize(horizontal: false, vertical: true).lineSpacing(1)
        }
        .padding(14).frame(maxWidth: .infinity, alignment: .leading)
        .background(RoundedRectangle(cornerRadius: 16).fill(kortFarge)).overlay(RoundedRectangle(cornerRadius: 16).stroke(blekk, lineWidth: 2.5))
        .background(RoundedRectangle(cornerRadius: 16).fill(blekk).offset(x: 4, y: 4))
        .id("spm-\(d.i)-\(liten)")
        .transition(.move(edge: .trailing).combined(with: .opacity))
    }

    // MARK: Svare – A–D-klistremerker, talltastaturet eller skrivedialogen; benken med hvem som har svart
    private func svarer(_ d: NrData, _ sp: NrSpm) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            if !sp.alt.isEmpty {
                alternativer(sp.alt, apne: true)
            } else if let t = sp.tall {
                tallTastatur(t)
            } else if let f = sp.fritt {
                storKnapp(f.knapp, farge: kortFarge) { m.skjema(f.skjemaId) }
                if !f.svart.isEmpty { Text(f.svart).font(.archivo(14, vekt: 700)).opacity(0.8) }
            }
            if !sp.vis.isEmpty { storKnapp(sp.vis) { m.trykk("nr-vis") } }
            else if !sp.vent.isEmpty { vent(sp.vent) }
            benk(sp.folk, sp.status)
        }
    }
    private func alternativer(_ alt: [NrAlt], apne: Bool) -> some View {
        VStack(spacing: 8) {
            ForEach(alt) { a in
                let farge: Color = apne ? (a.valgt ? gul : kortFarge) : a.rett ? mint : a.feil ? rosa : kortFarge
                Button(action: { if apne { m.trykk("nr-svar", ["v": a.tekst]) } }) {
                    HStack(alignment: .center, spacing: 10) {
                        Text(a.bokstav).font(.archivo(15, vekt: 900)).foregroundColor(lys).frame(width: 30, height: 30).background(Circle().fill(morkBlekk))
                        Text(a.tekst).font(.archivo(16, vekt: 800)).foregroundColor(apne && !a.valgt ? blekk : morkBlekk).multilineTextAlignment(.leading).fixedSize(horizontal: false, vertical: true)
                        Spacer(minLength: 4)
                        if !apne && !a.hoder.isEmpty {
                            HStack(spacing: -8) { ForEach(a.hoder) { h in hode(h.png, 32, flat: !a.rett) } }
                                .transition(.scale(scale: 0.6).combined(with: .opacity))
                        }
                        if !a.stempel.isEmpty {
                            Text(a.stempel.uppercased()).font(.archivo(11, vekt: 900)).foregroundColor(lys).padding(.horizontal, 7).frame(height: 22)
                                .background(RoundedRectangle(cornerRadius: 5).fill(a.rett ? morkBlekk : rust)).rotationEffect(.degrees(-6))
                        }
                    }
                    .padding(.horizontal, 12).padding(.vertical, 10).frame(maxWidth: .infinity, alignment: .leading)
                    .background(RoundedRectangle(cornerRadius: 12).fill(farge)).overlay(RoundedRectangle(cornerRadius: 12).stroke(morkBlekk.opacity(!apne && !a.rett && !a.feil ? 0.35 : 1), lineWidth: 2.5))
                    .background(RoundedRectangle(cornerRadius: 12).fill(apne ? blekk : Color.clear).offset(x: 3, y: 3))
                    .opacity(!apne && !a.rett && !a.feil ? 0.75 : 1)
                }
                .buttonStyle(TastTrykk()).disabled(!apne)
            }
        }
    }
    private func tallTastatur(_ t: NrTall) -> some View {
        let kol = [GridItem(.flexible(), spacing: 8), GridItem(.flexible(), spacing: 8), GridItem(.flexible(), spacing: 8)]
        let vist = m.format(m.tall.isEmpty ? "0" : m.tall)
        let last = !t.mitt.isEmpty && t.mitt == m.tall
        return VStack(alignment: .leading, spacing: 8) {
            Text(t.etikett).font(.archivo(12, vekt: 800)).opacity(0.65)
            Text(vist).font(.archivo(40, vekt: 900)).lineLimit(1).minimumScaleFactor(0.5).frame(maxWidth: .infinity, alignment: .trailing)
                .padding(.horizontal, 14).frame(height: 68)
                .background(RoundedRectangle(cornerRadius: 12).fill(kortFarge)).overlay(RoundedRectangle(cornerRadius: 12).stroke(blekk, lineWidth: 2.5))
            LazyVGrid(columns: kol, spacing: 8) {
                ForEach(t.taster, id: \.self) { k in
                    let graa = k == "⌫" || k == "000"
                    Button(action: { m.tast(k) }) {
                        Text(k).font(.archivo(k == "000" ? 17 : 22, vekt: 900)).foregroundColor(graa ? blekk : morkBlekk)
                            .frame(maxWidth: .infinity).frame(height: 52)
                            .background(RoundedRectangle(cornerRadius: 10).fill(graa ? papir : kortFarge)).overlay(RoundedRectangle(cornerRadius: 10).stroke(blekk, lineWidth: 2))
                            .background(RoundedRectangle(cornerRadius: 10).fill(blekk).offset(x: 3, y: 3))
                    }.buttonStyle(TastTrykk())
                }
            }
            storKnapp((last ? t.last : t.mitt.isEmpty ? t.las : t.bytt) + vist, farge: last ? mint : gul) { if !m.tall.isEmpty && !last { m.trykk("nr-svar", ["v": m.tall]) } }
        }
    }
    private func benk(_ folk: [NrHode], _ status: String) -> some View {
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

    // MARK: Svaret er vist – fasit, hoder på svarene, tallinja, lista og resultatet ditt
    private func avslort(_ d: NrData, _ sv: NrSvar) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            if !sv.alt.isEmpty { alternativer(sv.alt, apne: false) }
            else {
                HStack(alignment: .firstTextBaseline, spacing: 10) {
                    Text(sv.fasitEtikett).font(.archivo(12, vekt: 800)).foregroundColor(morkBlekk).opacity(0.7)
                    Text(sv.fasit).font(.archivo(26, vekt: 900)).foregroundColor(morkBlekk).fixedSize(horizontal: false, vertical: true)
                }
                .padding(14).frame(maxWidth: .infinity, alignment: .leading)
                .background(RoundedRectangle(cornerRadius: 14).fill(mint)).overlay(RoundedRectangle(cornerRadius: 14).stroke(morkBlekk, lineWidth: 3))
                .background(RoundedRectangle(cornerRadius: 14).fill(morkBlekk).offset(x: 4, y: 4))
                if let l = sv.tallinje { tallinje(l) }
            }
            if let r = sv.resultat { resultat(r) }
            if !sv.liste.isEmpty { liste(sv.liste) }
            if !sv.neste.isEmpty { storKnapp(sv.neste) { m.trykk("nr-neste") } }
            else if !sv.vent.isEmpty { vent(sv.vent) }
        }
    }
    private func tallinje(_ l: NrTallinje) -> some View {
        let hoyde: CGFloat = 96 + CGFloat(max(0, l.rader - 1)) * 46 + 56
        return GeometryReader { g in
            let w = g.size.width
            ZStack(alignment: .topLeading) {
                Rectangle().fill(blekk).frame(height: 2).offset(y: hoyde - 56)
                ForEach(l.pinner) { p in
                    VStack(spacing: 0) {
                        hode(p.png, 40, flat: p.flat).overlay(Circle().stroke(p.beste ? gul : Color.clear, lineWidth: 3).frame(width: 44, height: 44))
                        Text(p.tekst).font(.archivo(11, vekt: 900)).lineLimit(1).padding(.horizontal, 5).frame(height: 18).background(Capsule().fill(kortFarge)).overlay(Capsule().stroke(blekk, lineWidth: 1.5))
                        Rectangle().fill(blekk).frame(width: 2, height: 14 + CGFloat(p.rad) * 46)
                    }
                    .position(x: w * CGFloat(p.x) / 100, y: hoyde - 56 - (14 + CGFloat(p.rad) * 46) / 2 - 29)
                }
                VStack(spacing: 0) {
                    Rectangle().fill(oransje).frame(width: 3, height: 14)
                    Text(l.fasitTekst).font(.archivo(13, vekt: 900)).foregroundColor(morkBlekk).padding(.horizontal, 8).frame(height: 28).background(RoundedRectangle(cornerRadius: 6).fill(oransje)).overlay(RoundedRectangle(cornerRadius: 6).stroke(morkBlekk, lineWidth: 2))
                }
                .position(x: min(max(w * CGFloat(l.fasitX) / 100, 36), w - 36), y: hoyde - 56 + 22)
            }
        }
        .frame(height: hoyde)
    }
    private func resultat(_ r: NrResultat) -> some View {
        let farge: Color = r.klasse == "rett" ? mint : r.klasse == "null" ? kortFarge : rosa
        return VStack(alignment: .leading, spacing: 4) {
            Text(r.tittel).font(.archivo(17, vekt: 900)).foregroundColor(r.klasse == "null" ? blekk : morkBlekk)
            if !r.info.isEmpty {
                Text(r.info).font(.archivo(13, vekt: 600)).foregroundColor(r.klasse == "null" ? blekk : morkBlekk).opacity(0.85).fixedSize(horizontal: false, vertical: true)
            }
            if !r.kilde.isEmpty, let u = URL(string: r.url) {
                Button(action: { UIApplication.shared.open(u) }) {
                    HStack(spacing: 4) { Text(r.kilde).font(.archivo(13, vekt: 800)).underline(); Image(systemName: "arrow.up.right").font(.system(size: 11, weight: .bold)) }
                        .foregroundColor(r.klasse == "null" ? blekk : morkBlekk)
                }.buttonStyle(.plain)
            }
        }
        .padding(12).frame(maxWidth: .infinity, alignment: .leading)
        .background(RoundedRectangle(cornerRadius: 12).fill(farge)).overlay(RoundedRectangle(cornerRadius: 12).stroke(blekk, lineWidth: 2.5))
        .transition(.scale(scale: 0.96).combined(with: .opacity))
    }
    private func liste(_ l: [NrRad]) -> some View {
        VStack(spacing: 6) {
            ForEach(l) { r in
                HStack(spacing: 10) {
                    hode(r.png, 36, flat: r.klasse == "feil")
                    VStack(alignment: .leading, spacing: 0) {
                        Text(r.navn).font(.archivo(14, vekt: 900))
                        (r.tomt ? Text(r.hva).font(.archivo(13, vekt: 400)).italic() : Text(r.hva).font(.archivo(13, vekt: 700))).opacity(r.tomt ? 0.6 : 0.85).lineLimit(2)
                    }
                    Spacer()
                    let farge: Color = r.klasse == "rett" ? mint : r.klasse == "null" ? kortFarge : rosa
                    if r.kanFlippe {
                        Button(action: { m.trykk("nr-flipp", ["id": r.id]) }) {
                            Text(r.merke).font(.archivo(12, vekt: 900)).foregroundColor(r.klasse == "null" ? blekk : morkBlekk).padding(.horizontal, 10).frame(height: 30)
                                .background(Capsule().fill(farge)).overlay(Capsule().stroke(blekk, lineWidth: 2))
                        }.buttonStyle(TastTrykk())
                    } else {
                        Text(r.merke).font(.archivo(12, vekt: 900)).foregroundColor(r.klasse == "null" ? blekk : morkBlekk).padding(.horizontal, 10).frame(height: 30)
                            .background(Capsule().fill(farge)).overlay(Capsule().stroke(blekk, lineWidth: 2))
                    }
                }
                .padding(.horizontal, 10).padding(.vertical, 7)
                .background(RoundedRectangle(cornerRadius: 12).fill(kortFarge)).overlay(RoundedRectangle(cornerRadius: 12).stroke(blekk.opacity(0.5), lineWidth: 1.5))
            }
        }
    }

    // MARK: Ferdig – vinneren, pallen med krone, kåringene, resten og ny runde (verten)
    private func ferdig(_ d: NrData, _ f: NrFerdig) -> some View {
        VStack(alignment: .leading, spacing: 14) {
            Text(f.tittel).font(.archivo(26, vekt: 900)).tracking(-0.5).fixedSize(horizontal: false, vertical: true).padding(.top, 6)
            pall(f.pall)
            if !f.kaaringer.isEmpty {
                VStack(alignment: .leading, spacing: 6) {
                    ForEach(f.kaaringer) { k in
                        (Text(k.tittel + " ").font(.archivo(13, vekt: 900)) + Text(k.tekst).font(.archivo(13, vekt: 600)))
                            .fixedSize(horizontal: false, vertical: true)
                            .padding(.horizontal, 12).padding(.vertical, 8).frame(maxWidth: .infinity, alignment: .leading)
                            .background(RoundedRectangle(cornerRadius: 10).fill(kortFarge)).overlay(RoundedRectangle(cornerRadius: 10).stroke(blekk, lineWidth: 1.5))
                    }
                }
            }
            if !f.rest.isEmpty {
                VStack(spacing: 4) {
                    ForEach(f.rest) { x in
                        HStack(spacing: 10) {
                            Text("\(x.plass)").font(.archivo(13, vekt: 900)).opacity(0.6).frame(width: 18)
                            hode(x.png, 30)
                            Text(x.navn).font(.archivo(14, vekt: 800))
                            Spacer()
                            Text("\(x.n)").font(.archivo(16, vekt: 900))
                        }.padding(.horizontal, 10).padding(.vertical, 5)
                    }
                }
            }
            if !f.nyEtikett.isEmpty {
                Text(f.nyEtikett).font(.archivo(12, vekt: 800)).opacity(0.65).padding(.top, 6)
                lengder(f.lengder)
                Text(f.smaa).font(.archivo(12, vekt: 600)).opacity(0.65)
            }
            BlokkListe(m: m.blokker)
        }
    }
    private func pall(_ p: [NrPall]) -> some View {
        let rekke = [p.first { $0.plass == 2 }, p.first { $0.plass == 1 }, p.first { $0.plass == 3 }]
        let hoyder: [CGFloat] = [62, 96, 44]
        return HStack(alignment: .bottom, spacing: 8) {
            ForEach(0..<3, id: \.self) { i in
                if let x = rekke[i] {
                    VStack(spacing: 4) {
                        if x.plass == 1 { Image(systemName: "crown.fill").font(.system(size: 20, weight: .black)).foregroundColor(gul).shadow(color: morkBlekk, radius: 0, x: 1.5, y: 1.5) }
                        hode(x.png, x.plass == 1 ? 72 : 56)
                        Text(x.navn).font(.archivo(13, vekt: 900)).lineLimit(1)
                        Text("\(x.n)").font(.archivo(20, vekt: 900)).foregroundColor(morkBlekk).frame(maxWidth: .infinity).frame(height: hoyder[i])
                            .background(RoundedRectangle(cornerRadius: 8).fill(x.plass == 1 ? gul : x.plass == 2 ? mint : rosa)).overlay(RoundedRectangle(cornerRadius: 8).stroke(morkBlekk, lineWidth: 2.5))
                    }.frame(maxWidth: .infinity)
                } else { Color.clear.frame(maxWidth: .infinity, maxHeight: 1) }
            }
        }
        .transition(.move(edge: .bottom).combined(with: .opacity))
    }
}
