import SwiftUI
import UIKit
import WebKit

/// Kategorikongen som native skjerm. Nettsiden (rom.js quizData) sender én ordbok per tegning: fasen (klar / trekk / spm /
/// svar / ferdig), kategorikortene i hånda, spørsmålet med A–D, satsingen, svaret med hodene på alternativene, kongene og
/// sluttskjermen. Trykkene går tilbake til nettsidens egne knapper (window.__mvLek.trykk), så all logikk bor ett sted.
struct QzHode: Identifiable { let id: String; let navn: String; let png: String; let oppe: Bool }
struct QzLengde: Identifiable { let id: Int; let tekst: String; let valgt: Bool }
struct QzKortet: Identifiable { let id: String; let navn: String; let droy: Bool }
struct QzAlt: Identifiable { let id: Int; let bokstav: String; let tekst: String; let valgt: Bool; let rett: Bool; let feil: Bool; let hoder: [QzHode]; let stempel: String }
struct QzKonge: Identifiable { let id: String; let navn: String; let kat: String; let n: Int }
struct QzPall: Identifiable { let id: String; let navn: String; let png: String; let n: Int; let plass: Int }
struct QzKaaring: Identifiable { let id: Int; let tittel: String; let tekst: String }
struct QzSatsing: Identifiable { let id: String; let png: String; let treff: Bool; let tekst: String; let under: String }
struct QzKat { let navn: String, droy: Bool, droyTekst: String, konge: String }
struct QzKlar { let forside: String, hoder: [QzHode], lengder: [QzLengde], start: String, vent: String }
struct QzTrekk { let min: Bool, chip: String, tekst: String, hand: [QzKortet], droyTag: String, forAndre: String }
struct QzSats { let etikett: String, valgt: String, hjelp: String, folk: [QzHode] }
struct QzSpm { let chip: String, mitt: String, alt: [QzAlt], sats: QzSats, vis: String, folk: [QzHode], status: String }
struct QzMitt { let rett: Bool, over: String, tittel: String, under: String }
struct QzSvar { let chip: String, info: String, alt: [QzAlt], mitt: QzMitt?, nyKonge: String, satsinger: [QzSatsing], neste: String }
struct QzFerdig { let tittel: String, pall: [QzPall], kaaringer: [QzKaaring], rest: [QzPall] }

struct QzData {
    let fase: String, i: Int, lengde: Int, vert: Bool, naa: Double, frist: Double, tittel: String, under: String, q: String
    let kat: QzKat?, klar: QzKlar?, trekk: QzTrekk?, spm: QzSpm?, svar: QzSvar?, ferdig: QzFerdig?
    let konger: [QzKonge], kongerEtikett: String, slutt: [[String: Any]], stua: String, mer: String

    static func hode(_ h: [String: Any]) -> QzHode { QzHode(id: h["id"] as? String ?? "", navn: h["navn"] as? String ?? "", png: h["png"] as? String ?? "", oppe: h["oppe"] as? Bool ?? false) }
    static func hoder(_ l: Any?) -> [QzHode] { (l as? [[String: Any]] ?? []).map { hode($0) } }
    static func alt(_ l: Any?) -> [QzAlt] {
        (l as? [[String: Any]] ?? []).enumerated().map { i, a in QzAlt(id: i, bokstav: a["bokstav"] as? String ?? "", tekst: a["tekst"] as? String ?? "", valgt: a["valgt"] as? Bool ?? false, rett: a["rett"] as? Bool ?? false, feil: a["feil"] as? Bool ?? false, hoder: hoder(a["hoder"]), stempel: a["stempel"] as? String ?? "") }
    }
    static func pall(_ l: Any?) -> [QzPall] { (l as? [[String: Any]] ?? []).map { p in QzPall(id: p["id"] as? String ?? "", navn: p["navn"] as? String ?? "", png: p["png"] as? String ?? "", n: (p["n"] as? NSNumber)?.intValue ?? 0, plass: (p["plass"] as? NSNumber)?.intValue ?? 0) } }
    init(_ d: [String: Any]) {
        func s(_ k: String) -> String { d[k] as? String ?? "" }
        func n(_ k: String) -> Double { (d[k] as? NSNumber)?.doubleValue ?? 0 }
        fase = s("fase"); i = Int(n("i")); lengde = Int(n("lengde")); vert = d["vert"] as? Bool ?? false; naa = n("naa"); frist = n("frist")
        tittel = s("tittel").isEmpty ? "Kategorikongen" : s("tittel"); under = s("under"); q = s("q")
        if let k = d["kat"] as? [String: Any] { kat = QzKat(navn: k["navn"] as? String ?? "", droy: k["droy"] as? Bool ?? false, droyTekst: k["droyTekst"] as? String ?? "", konge: k["konge"] as? String ?? "") } else { kat = nil }
        if let k = d["klar"] as? [String: Any] {
            klar = QzKlar(forside: k["forside"] as? String ?? "", hoder: QzData.hoder(k["hoder"]),
                          lengder: (k["lengder"] as? [[String: Any]] ?? []).map { x in QzLengde(id: (x["n"] as? NSNumber)?.intValue ?? 0, tekst: x["tekst"] as? String ?? "", valgt: x["valgt"] as? Bool ?? false) },
                          start: k["start"] as? String ?? "", vent: k["vent"] as? String ?? "")
        } else { klar = nil }
        if let t = d["trekk"] as? [String: Any] {
            trekk = QzTrekk(min: t["min"] as? Bool ?? false, chip: t["chip"] as? String ?? "", tekst: t["tekst"] as? String ?? "",
                            hand: (t["hand"] as? [[String: Any]] ?? []).map { k in QzKortet(id: k["id"] as? String ?? "", navn: k["navn"] as? String ?? "", droy: k["droy"] as? Bool ?? false) },
                            droyTag: t["droyTag"] as? String ?? "", forAndre: t["forAndre"] as? String ?? "")
        } else { trekk = nil }
        if let x = d["spm"] as? [String: Any] {
            let sa = x["sats"] as? [String: Any] ?? [:]
            spm = QzSpm(chip: x["chip"] as? String ?? "", mitt: x["mitt"] as? String ?? "", alt: QzData.alt(x["alt"]),
                        sats: QzSats(etikett: sa["etikett"] as? String ?? "", valgt: sa["valgt"] as? String ?? "", hjelp: sa["hjelp"] as? String ?? "", folk: QzData.hoder(sa["folk"])),
                        vis: x["vis"] as? String ?? "", folk: QzData.hoder(x["folk"]), status: x["status"] as? String ?? "")
        } else { spm = nil }
        if let x = d["svar"] as? [String: Any] {
            var mitt: QzMitt? = nil
            if let m = x["mitt"] as? [String: Any] { mitt = QzMitt(rett: m["rett"] as? Bool ?? false, over: m["over"] as? String ?? "", tittel: m["tittel"] as? String ?? "", under: m["under"] as? String ?? "") }
            svar = QzSvar(chip: x["chip"] as? String ?? "", info: x["info"] as? String ?? "", alt: QzData.alt(x["alt"]), mitt: mitt, nyKonge: x["nyKonge"] as? String ?? "",
                          satsinger: (x["satsinger"] as? [[String: Any]] ?? []).map { r in QzSatsing(id: r["id"] as? String ?? "", png: r["png"] as? String ?? "", treff: r["treff"] as? Bool ?? false, tekst: r["tekst"] as? String ?? "", under: r["under"] as? String ?? "") },
                          neste: x["neste"] as? String ?? "")
        } else { svar = nil }
        if let f = d["ferdig"] as? [String: Any] {
            ferdig = QzFerdig(tittel: f["tittel"] as? String ?? "", pall: QzData.pall(f["pall"]),
                              kaaringer: (f["kaaringer"] as? [[String: Any]] ?? []).enumerated().map { i, k in QzKaaring(id: i, tittel: k["tittel"] as? String ?? "", tekst: k["tekst"] as? String ?? "") },
                              rest: QzData.pall(f["rest"]))
        } else { ferdig = nil }
        konger = (d["konger"] as? [[String: Any]] ?? []).map { k in QzKonge(id: (k["id"] as? String ?? "") + "|" + (k["kat"] as? String ?? ""), navn: k["navn"] as? String ?? "", kat: k["kat"] as? String ?? "", n: (k["n"] as? NSNumber)?.intValue ?? 0) }
        kongerEtikett = s("kongerEtikett")
        slutt = d["slutt"] as? [[String: Any]] ?? []
        stua = s("stua").isEmpty ? "Stua" : s("stua"); mer = s("mer").isEmpty ? "Mer" : s("mer")
    }
}

final class QzModell: ObservableObject {
    @Published var d: QzData? = nil
    let blokker = KortModell()
    private(set) var avvik: Double = 0
    weak var nett: WKWebView? { didSet { blokker.nett = nett } }
    private var bilder: [String: UIImage] = [:]
    func sett(_ dict: [String: Any]) {
        let ny = QzData(dict)
        if ny.naa > 0 { avvik = ny.naa - Date().timeIntervalSince1970 * 1000 }
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
    func trykk(_ g: String, _ attrs: [String: String] = [:], tung: Bool = false) {
        UIImpactFeedbackGenerator(style: tung ? .medium : .light).impactOccurred()
        guard let data = try? JSONSerialization.data(withJSONObject: [g, attrs]), let json = String(data: data, encoding: .utf8) else { return }
        nett?.evaluateJavaScript("window.__mvLek && window.__mvLek.trykk.apply(null, \(json))", completionHandler: nil)
    }
}

struct QuizSkjerm: View {
    @ObservedObject var m: QzModell
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
    private let tavle = Color(red: 0.11, green: 0.106, blue: 0.122)
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
                            else if let t = d.trekk { trekk(d, t) }
                            else if let sp = d.spm { chipRad(sp.chip, gul: sp.mitt.isEmpty); katChip(d); sporsmal(d); svarer(d, sp) }
                            else if let sv = d.svar { chipRad(sv.chip, gul: false); katChip(d); sporsmal(d, liten: true); avslort(d, sv) }
                        }
                        .padding(.horizontal, 16).padding(.top, 8).padding(.bottom, 24)
                    }
                }
            }
        }
        .foregroundColor(blekk)
    }

    // MARK: Toppen – KATEGORIKONGEN, spørsmål nr, klokka og Stua/Mer
    private func topp(_ d: QzData) -> some View {
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
    /// Den store gule (eller hvite) merkelappen øverst: «Din tur – trekk!», «Svar!», «Svaret»
    private func chipRad(_ t: String, gul erGul: Bool) -> some View {
        Text(t.uppercased()).font(.archivo(22, vekt: 900)).tracking(-0.3).foregroundColor(erGul ? morkBlekk : blekk).lineLimit(1).minimumScaleFactor(0.6)
            .padding(.horizontal, 10).padding(.vertical, 5)
            .background(RoundedRectangle(cornerRadius: 6).fill(erGul ? gul : kortFarge)).overlay(RoundedRectangle(cornerRadius: 6).stroke(blekk, lineWidth: 2.5))
            .background(RoundedRectangle(cornerRadius: 6).fill(blekk).offset(x: 3, y: 3))
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
    private func lenke(_ t: String, action: @escaping () -> Void) -> some View {
        Button(action: action) { Text(t).font(.archivo(14, vekt: 700)).underline().opacity(0.8).padding(.vertical, 4).frame(maxWidth: .infinity) }.buttonStyle(.plain)
    }
    private func vent(_ t: String) -> some View { Text(t).font(.archivo(14, vekt: 700)).multilineTextAlignment(.center).frame(maxWidth: .infinity).opacity(0.75).padding(.top, 2) }
    private func etikett(_ t: String) -> some View { Text(t.uppercased()).font(.archivo(11, vekt: 900)).tracking(0.8).opacity(0.65) }

    // MARK: Kategorichip – navn, drøy og hvem som er konge
    @ViewBuilder private func katChip(_ d: QzData) -> some View {
        if let k = d.kat {
            HStack(spacing: 8) {
                Text(k.navn.uppercased()).font(.archivo(14, vekt: 900)).foregroundColor(morkBlekk).padding(.horizontal, 9).padding(.vertical, 4)
                    .background(RoundedRectangle(cornerRadius: 4).fill(k.droy ? oransje : gul)).overlay(RoundedRectangle(cornerRadius: 4).stroke(morkBlekk, lineWidth: 2.5))
                    .background(RoundedRectangle(cornerRadius: 4).fill(morkBlekk).offset(x: 3, y: 3))
                if k.droy { Text(k.droyTekst.uppercased()).font(.archivo(11, vekt: 900)).tracking(0.6).opacity(0.65) }
                Spacer(minLength: 4)
                if !k.konge.isEmpty { Text("👑 " + k.konge).font(.archivo(12, vekt: 800)).lineLimit(1) }
            }
        }
    }
    private func sporsmal(_ d: QzData, liten: Bool = false) -> some View {
        Text(d.q).font(.archivo(liten ? 17 : 23, vekt: 900)).fixedSize(horizontal: false, vertical: true).lineSpacing(1)
            .padding(14).frame(maxWidth: .infinity, alignment: .leading)
            .background(RoundedRectangle(cornerRadius: 16).fill(kortFarge)).overlay(RoundedRectangle(cornerRadius: 16).stroke(blekk, lineWidth: 2.5))
            .background(RoundedRectangle(cornerRadius: 16).fill(blekk).offset(x: 4, y: 4))
            .id("spm-\(d.i)-\(liten)")
            .transition(.move(edge: .trailing).combined(with: .opacity))
    }

    // MARK: Klar – forsiden med folka og lengden
    private func klar(_ d: QzData, _ k: QzKlar) -> some View {
        VStack(alignment: .leading, spacing: 14) {
            Text(k.forside).font(.archivo(34, vekt: 900)).tracking(-0.5).lineSpacing(-2).fixedSize(horizontal: false, vertical: true).padding(.top, 6)
            HStack(spacing: -10) { ForEach(k.hoder) { h in hode(h.png, 52) } }
            if !k.lengder.isEmpty {
                HStack(spacing: 8) {
                    ForEach(k.lengder) { l in
                        Button(action: { m.trykk("qz-lengde", ["n": String(l.id)]) }) {
                            VStack(spacing: 1) { Text("\(l.id)").font(.archivo(22, vekt: 900)); Text(l.tekst.uppercased()).font(.archivo(10, vekt: 800)).opacity(0.7) }
                                .foregroundColor(l.valgt ? morkBlekk : blekk).frame(maxWidth: .infinity).frame(height: 58)
                                .background(RoundedRectangle(cornerRadius: 10).fill(l.valgt ? gul : kortFarge)).overlay(RoundedRectangle(cornerRadius: 10).stroke(blekk, lineWidth: 2.5))
                                .background(RoundedRectangle(cornerRadius: 10).fill(blekk).offset(x: l.valgt ? 1 : 3, y: l.valgt ? 1 : 3))
                        }.buttonStyle(TastTrykk())
                    }
                }
            }
            if !k.start.isEmpty { storKnapp(k.start) { m.trykk("qz-start") } }
            else if !k.vent.isEmpty { vent(k.vent) }
            konger(d)
        }
    }

    // MARK: Trekk – vifta med fem kategorikort
    private func trekk(_ d: QzData, _ t: QzTrekk) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            chipRad(t.chip, gul: t.min)
            Text(t.tekst).font(.archivo(15, vekt: 700)).frame(maxWidth: .infinity).multilineTextAlignment(.center)
            vifte(t)
            if !t.forAndre.isEmpty { lenke(t.forAndre) { m.trykk("qz-trekk", ["kat": ""]) } }
            konger(d)
        }
    }
    private func vifte(_ t: QzTrekk) -> some View {
        let n = t.hand.count
        return ZStack {
            ForEach(Array(t.hand.enumerated()), id: \.element.id) { i, k in
                let midt = Double(i) - Double(n - 1) / 2
                Button(action: { if t.min { m.trykk("qz-trekk", ["kat": k.id], tung: true) } }) {
                    kortet(k, t)
                }
                .buttonStyle(TastTrykk()).disabled(!t.min)
                .rotationEffect(.degrees(midt * 9), anchor: .bottom)
                .offset(x: midt * 58, y: abs(midt) * 6)
                .zIndex(Double(i))
                .transition(.asymmetric(insertion: .offset(y: 40).combined(with: .opacity), removal: .opacity))
                .animation(roligere ? nil : .spring(response: 0.5, dampingFraction: 0.78).delay(Double(i) * 0.06), value: n)
            }
        }
        .frame(maxWidth: .infinity).frame(height: 200)
    }
    private func kortet(_ k: QzKortet, _ t: QzTrekk) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            if t.min {
                Spacer(minLength: 0)
                Text(k.navn.uppercased()).font(.archivo(13, vekt: 900)).tracking(-0.2).lineLimit(4).minimumScaleFactor(0.7).multilineTextAlignment(.leading).fixedSize(horizontal: false, vertical: true)
                if k.droy {
                    Text(t.droyTag.uppercased()).font(.archivo(10, vekt: 900)).tracking(0.6).padding(.horizontal, 6).padding(.vertical, 2)
                        .background(RoundedRectangle(cornerRadius: 4).fill(gul)).overlay(RoundedRectangle(cornerRadius: 4).stroke(morkBlekk, lineWidth: 2))
                }
            } else {
                Spacer(minLength: 0)
                Text("?").font(.archivo(44, vekt: 900)).frame(maxWidth: .infinity)
                Spacer(minLength: 0)
            }
        }
        .padding(9).frame(width: 96, height: 150, alignment: .leading)
        .foregroundColor(t.min ? morkBlekk : lys)
        .background(RoundedRectangle(cornerRadius: 9).fill(t.min ? (k.droy ? oransje : lys) : tavle))
        .overlay(RoundedRectangle(cornerRadius: 6).strokeBorder(style: StrokeStyle(lineWidth: 2, dash: [4, 4])).foregroundColor((t.min ? morkBlekk : lys).opacity(0.3)).padding(6))
        .overlay(RoundedRectangle(cornerRadius: 9).stroke(morkBlekk, lineWidth: 3))
        .background(RoundedRectangle(cornerRadius: 9).fill(morkBlekk).offset(x: 3, y: 3))
    }

    // MARK: Svare – A–D, satsingen og benken
    private func svarer(_ d: QzData, _ sp: QzSpm) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            alternativer(sp.alt, apne: true)
            satsBoks(sp.sats)
            if !sp.vis.isEmpty { storKnapp(sp.vis) { m.trykk("qz-vis") } }
            benk(sp.folk, sp.status)
        }
    }
    private func alternativer(_ alt: [QzAlt], apne: Bool) -> some View {
        VStack(spacing: 8) {
            ForEach(alt) { a in
                let farge: Color = apne ? (a.valgt ? gul : kortFarge) : a.rett ? mint : a.feil ? oransje : kortFarge
                Button(action: { if apne { m.trykk("qz-svar", ["v": a.tekst]) } }) {
                    HStack(alignment: .center, spacing: 10) {
                        Text(a.bokstav).font(.archivo(15, vekt: 900)).foregroundColor(lys).frame(width: 30, height: 30).background(RoundedRectangle(cornerRadius: 5).fill(morkBlekk))
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
                    .background(RoundedRectangle(cornerRadius: 8).fill(farge)).overlay(RoundedRectangle(cornerRadius: 8).stroke(morkBlekk.opacity(!apne && !a.rett && !a.feil ? 0.35 : 1), lineWidth: 2.5))
                    .background(RoundedRectangle(cornerRadius: 8).fill(apne ? blekk : Color.clear).offset(x: a.valgt ? 1 : 3, y: a.valgt ? 1 : 3))
                    .opacity(!apne && !a.rett && !a.feil ? 0.75 : 1)
                }
                .buttonStyle(TastTrykk()).disabled(!apne)
            }
        }
    }
    private func satsBoks(_ s: QzSats) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            etikett(s.etikett)
            if s.folk.isEmpty { Text(s.hjelp).font(.archivo(12, vekt: 700)).opacity(0.65) }
            else {
                LazyVGrid(columns: [GridItem(.adaptive(minimum: 104), spacing: 8)], alignment: .leading, spacing: 8) {
                    ForEach(s.folk) { h in
                        let paa = s.valgt == h.id
                        Button(action: { m.trykk("qz-sats", ["paa": h.id], tung: true) }) {
                            HStack(spacing: 6) { hode(h.png, 28); Text(h.navn).font(.archivo(13, vekt: 800)).lineLimit(1).minimumScaleFactor(0.8); Spacer(minLength: 0) }
                                .padding(.leading, 4).padding(.trailing, 8).frame(height: 38)
                                .foregroundColor(paa ? morkBlekk : blekk)
                                .background(Capsule().fill(paa ? oransje : kortFarge)).overlay(Capsule().stroke(blekk, lineWidth: 2.5))
                                .background(Capsule().fill(blekk).offset(x: paa ? 1 : 3, y: paa ? 1 : 3))
                        }.buttonStyle(TastTrykk())
                    }
                }
                Text(s.hjelp).font(.archivo(12, vekt: 700)).opacity(0.65)
            }
        }
        .padding(12).frame(maxWidth: .infinity, alignment: .leading)
        .overlay(RoundedRectangle(cornerRadius: 10).strokeBorder(style: StrokeStyle(lineWidth: 2.5, dash: [6, 5])).foregroundColor(blekk))
    }
    private func benk(_ folk: [QzHode], _ status: String) -> some View {
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

    // MARK: Svaret er vist – fasit, ditt resultat, ny konge og satsingene
    private func avslort(_ d: QzData, _ sv: QzSvar) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            alternativer(sv.alt, apne: false)
            if !sv.info.isEmpty { Text(sv.info).font(.archivo(14, vekt: 600)).opacity(0.7).fixedSize(horizontal: false, vertical: true) }
            if let mitt = sv.mitt {
                VStack(alignment: .leading, spacing: 2) {
                    Text(mitt.over.uppercased()).font(.archivo(11, vekt: 900)).tracking(0.8).opacity(0.75)
                    Text(mitt.tittel).font(.archivo(20, vekt: 900))
                    if !mitt.under.isEmpty { Text(mitt.under).font(.archivo(13, vekt: 700)).opacity(0.75) }
                }
                .padding(12).frame(maxWidth: .infinity, alignment: .leading).foregroundColor(morkBlekk)
                .background(RoundedRectangle(cornerRadius: 10).fill(mitt.rett ? mint : oransje)).overlay(RoundedRectangle(cornerRadius: 10).stroke(morkBlekk, lineWidth: 2.5))
                .background(RoundedRectangle(cornerRadius: 10).fill(morkBlekk).offset(x: 3, y: 3))
                .transition(.scale(scale: 0.96).combined(with: .opacity))
            }
            if !sv.nyKonge.isEmpty {
                Text(sv.nyKonge).font(.archivo(16, vekt: 800)).foregroundColor(morkBlekk).multilineTextAlignment(.center)
                    .padding(12).frame(maxWidth: .infinity)
                    .background(RoundedRectangle(cornerRadius: 10).fill(gul)).overlay(RoundedRectangle(cornerRadius: 10).stroke(morkBlekk, lineWidth: 2.5))
                    .background(RoundedRectangle(cornerRadius: 10).fill(morkBlekk).offset(x: 3, y: 3))
                    .transition(.scale(scale: 0.9).combined(with: .opacity))
            }
            if !sv.satsinger.isEmpty {
                VStack(spacing: 6) {
                    ForEach(sv.satsinger) { s in
                        HStack(spacing: 10) {
                            hode(s.png, 36)
                            VStack(alignment: .leading, spacing: 1) {
                                Text(s.tekst).font(.archivo(13, vekt: 700)).lineLimit(2)
                                Text(s.under).font(.archivo(13, vekt: 900)).foregroundColor(s.treff ? blekk : rust)
                            }
                            Spacer(minLength: 0)
                        }
                        .padding(.horizontal, 10).padding(.vertical, 8)
                        .background(RoundedRectangle(cornerRadius: 8).fill(kortFarge)).overlay(RoundedRectangle(cornerRadius: 8).stroke(blekk.opacity(0.5), lineWidth: 2))
                    }
                }
            }
            storKnapp(sv.neste) { m.trykk("qz-neste") }
        }
    }

    // MARK: Kongene i kveld
    @ViewBuilder private func konger(_ d: QzData) -> some View {
        if !d.konger.isEmpty {
            VStack(alignment: .leading, spacing: 4) {
                etikett(d.kongerEtikett)
                ForEach(d.konger) { k in
                    HStack(spacing: 6) { Text("👑").font(.system(size: 14)); Text(k.navn).font(.archivo(14, vekt: 900)); Text("\(k.kat) · \(k.n)").font(.archivo(13, vekt: 600)).opacity(0.65).lineLimit(1) }
                }
            }.padding(.top, 6)
        }
    }

    // MARK: Ferdig – pallen, kåringene, kongene og «Hva nå?»
    private func ferdig(_ d: QzData, _ f: QzFerdig) -> some View {
        VStack(alignment: .leading, spacing: 14) {
            Text(f.tittel).font(.archivo(26, vekt: 900)).tracking(-0.4).fixedSize(horizontal: false, vertical: true)
            HStack(alignment: .bottom, spacing: 10) {
                ForEach(f.pall) { p in
                    VStack(spacing: 4) {
                        hode(p.png, p.plass == 1 ? 76 : 58)
                        Text(p.navn).font(.archivo(12, vekt: 800)).lineLimit(1)
                        Text("\(p.n)").font(.archivo(22, vekt: 900)).foregroundColor(morkBlekk).frame(width: 44, height: 36)
                            .background(RoundedRectangle(cornerRadius: 6).fill(p.plass == 1 ? gul : p.plass == 2 ? mint : rosa)).overlay(RoundedRectangle(cornerRadius: 6).stroke(morkBlekk, lineWidth: 2.5))
                    }.frame(maxWidth: .infinity)
                }
            }
            if !f.kaaringer.isEmpty {
                VStack(alignment: .leading, spacing: 4) {
                    ForEach(f.kaaringer) { k in
                        (Text(k.tittel + " ").font(.archivo(14, vekt: 900)) + Text(k.tekst).font(.archivo(14, vekt: 600))).fixedSize(horizontal: false, vertical: true)
                    }
                }
            }
            if !f.rest.isEmpty {
                VStack(spacing: 4) {
                    ForEach(f.rest) { p in
                        HStack(spacing: 8) { Text("\(p.plass).").font(.archivo(13, vekt: 800)).frame(width: 22, alignment: .trailing); hode(p.png, 28); Text(p.navn).font(.archivo(14, vekt: 700)); Spacer(); Text("\(p.n)").font(.archivo(16, vekt: 900)) }
                    }
                }
            }
            konger(d)
            BlokkListe(m: m.blokker).padding(.top, 6)
        }
    }
}
