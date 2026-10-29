import SwiftUI
import UIKit
import WebKit

/// Skriv og drikk som native skjerm: klokka, kortet du skriver på (iPhonens dialog), bunken din som vokser,
/// kortet som trekkes med «Til deg!»-stempel, Skammekroken og slutten. Nettsiden under holder tilstanden,
/// klokka og hvem kortet er til (rom.js sdData) – denne tegner, og trykkene går til nettsidens egne knapper.
struct SdHode: Identifiable { let id: String; let navn: String; let farge: String; let png: String }
struct SdTil: Identifiable { var id: String { v }; let v: String; let tekst: String; let farge: String }
struct SdSkam: Identifiable { let id: Int; let hode: SdHode; let fra: String; let tekst: String; let kommentar: String }
struct SdKast { let tittel: String, tekst: String, kanStemme: Bool, mitt: String, ja: String, nei: String, ikke: String, avbryt: String }

struct SdData {
    let fase: String, naa: Double, frist: Double, egen: Bool, pos: Int, sek: Double, tittel: String, chip: String, gul: Bool
    let intro: String, folk: [SdHode], med: String, start: String, vent: String
    let til: [SdTil], tilValgt: String, tilEtikett: String, skriv: String, plass: String, startere: [String], skjemaId: String
    let bunke: [String], mine: Int, mineTekst: String, totaltTekst: String, stokk: String, stokkLink: String, tidUte: String
    let kortet: String, kortUnder: String, mottakere: [SdHode], tilAlle: String, tilDeg: String, tilMeg: Bool, trekkNr: String, kast: SdKast?
    let neste: String, nesteVent: String, kastLink: String
    let stempel: String, skamIntro: String, skam: [SdSkam], straff: String, videre: String
    let trukket: Int, trukketTekst: String, slutt: [[String: Any]], stua: String, mer: String

    static func hode(_ h: [String: Any]) -> SdHode { SdHode(id: h["id"] as? String ?? "", navn: h["navn"] as? String ?? "", farge: h["farge"] as? String ?? "", png: h["png"] as? String ?? "") }
    init(_ d: [String: Any]) {
        func s(_ k: String) -> String { d[k] as? String ?? "" }
        func b(_ k: String) -> Bool { d[k] as? Bool ?? false }
        func n(_ k: String) -> Double { (d[k] as? NSNumber)?.doubleValue ?? 0 }
        func i(_ k: String) -> Int { (d[k] as? NSNumber)?.intValue ?? 0 }
        fase = s("fase"); naa = n("naa"); frist = n("frist"); egen = b("egen"); pos = i("pos"); sek = n("sek"); tittel = s("tittel"); chip = s("chip"); gul = b("gul")
        intro = s("intro"); folk = (d["folk"] as? [[String: Any]] ?? []).map { SdData.hode($0) }; med = s("med"); start = s("start"); vent = s("vent")
        til = (d["til"] as? [[String: Any]] ?? []).map { SdTil(v: $0["v"] as? String ?? "", tekst: $0["tekst"] as? String ?? "", farge: $0["farge"] as? String ?? "") }
        tilValgt = s("tilValgt"); tilEtikett = s("tilEtikett"); skriv = s("skriv"); plass = s("plass"); startere = d["startere"] as? [String] ?? []
        skjemaId = s("skjemaId").isEmpty ? "rfSkjema" : s("skjemaId")
        bunke = d["bunke"] as? [String] ?? []; mine = i("mine"); mineTekst = s("mineTekst"); totaltTekst = s("totaltTekst"); stokk = s("stokk"); stokkLink = s("stokkLink"); tidUte = s("tidUte")
        kortet = s("kortet"); kortUnder = s("kortUnder"); mottakere = (d["mottakere"] as? [[String: Any]] ?? []).map { SdData.hode($0) }
        tilAlle = s("tilAlle"); tilDeg = s("tilDeg"); tilMeg = b("tilMeg"); trekkNr = s("trekkNr")
        if let k = d["kast"] as? [String: Any] {
            kast = SdKast(tittel: k["tittel"] as? String ?? "", tekst: k["tekst"] as? String ?? "", kanStemme: k["kanStemme"] as? Bool ?? false, mitt: k["mitt"] as? String ?? "",
                          ja: k["ja"] as? String ?? "", nei: k["nei"] as? String ?? "", ikke: k["ikke"] as? String ?? "", avbryt: k["avbryt"] as? String ?? "")
        } else { kast = nil }
        neste = s("neste"); nesteVent = s("nesteVent"); kastLink = s("kastLink")
        stempel = s("stempel"); skamIntro = s("skamIntro")
        skam = (d["skam"] as? [[String: Any]] ?? []).enumerated().map { j, k in SdSkam(id: j, hode: SdData.hode(k), fra: k["fra"] as? String ?? "", tekst: k["tekst"] as? String ?? "", kommentar: k["kommentar"] as? String ?? "") }
        straff = s("straff"); videre = s("videre")
        trukket = i("trukket"); trukketTekst = s("trukketTekst"); slutt = d["slutt"] as? [[String: Any]] ?? []
        stua = s("stua").isEmpty ? "Stua" : s("stua"); mer = s("mer").isEmpty ? "Mer" : s("mer")
    }
}

final class SdModell: ObservableObject {
    @Published var d: SdData? = nil
    let blokker = KortModell()
    private(set) var avvik: Double = 0
    weak var nett: WKWebView? { didSet { blokker.nett = nett } }
    private var bilder: [String: UIImage] = [:]
    func sett(_ dict: [String: Any]) {
        let ny = SdData(dict)
        if ny.naa > 0 { avvik = ny.naa - Date().timeIntervalSince1970 * 1000 }
        blokker.sett(["blokker": ny.slutt, "naa": dict["naa"] ?? 0])
        withAnimation(.spring(response: 0.45, dampingFraction: 0.78)) { d = ny }
    }
    func naaMs() -> Double { Date().timeIntervalSince1970 * 1000 + avvik }
    /// Sekunder igjen å skrive (samme regning som nettsidens rfIgjen)
    func igjen(_ frist: Double) -> Int { max(0, Int(ceil((frist - 3000 - naaMs()) / 1000))) }
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
    /// Skrivingen: nettsidens skjema åpnes som iPhone-dialog
    func skjema(_ id: String) {
        UIImpactFeedbackGenerator(style: .light).impactOccurred()
        guard let data = try? JSONSerialization.data(withJSONObject: [id]), let json = String(data: data, encoding: .utf8) else { return }
        nett?.evaluateJavaScript("window.__mvLek && window.__mvLek.skjema(\(json)[0])", completionHandler: nil)
    }
}

struct SkrivDrikkSkjerm: View {
    @ObservedObject var m: SdModell
    @Environment(\.colorScheme) private var modus
    @State private var tilValgt = ""
    @State private var kortInn = false
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
                            switch d.fase {
                            case "klar": klar(d)
                            case "skriv": skriv(d)
                            case "skam": skam(d)
                            case "ferdig": ferdig(d)
                            default: trekk(d)
                            }
                        }
                        .padding(.horizontal, 16).padding(.top, 4).padding(.bottom, 24)
                    }
                }
            }
        }
        .foregroundColor(blekk)
        .onChange(of: m.d?.tilValgt ?? "") { v in if !v.isEmpty { tilValgt = v } }
        .onAppear { tilValgt = m.d?.tilValgt ?? "" }
    }

    // MARK: Toppen – tittel, chip, klokka og Stua/Mer
    private func topp(_ d: SdData) -> some View {
        HStack(spacing: 8) {
            VStack(alignment: .leading, spacing: 1) {
                Text(d.tittel).font(.archivo(12, vekt: 700)).opacity(0.65).lineLimit(1)
                if d.fase == "skriv" && d.frist > 0 {
                    TimelineView(.periodic(from: .now, by: 0.5)) { _ in
                        let n = m.igjen(d.frist)
                        Text(n > 0 ? d.chip : d.tidUte).font(.archivo(16, vekt: 900)).foregroundColor(n > 0 ? rust : blekk).lineLimit(2)
                    }
                } else {
                    Text(d.chip).font(.archivo(16, vekt: 900)).foregroundColor(d.gul ? rust : blekk).lineLimit(2)
                }
            }
            Spacer()
            if d.fase == "skriv" && d.frist > 0 { klokke(d) }
            liten(d.stua, "sofa.fill") { m.trykk("stua-ark") }
            liten(d.mer, "ellipsis") { m.trykk("mer-ark") }
        }
        .padding(.horizontal, 16).padding(.top, 6).padding(.bottom, 8)
    }

    /// Klokka: en kake som spises opp, tallet i midten – oransje de siste ti sekundene
    private func klokke(_ d: SdData) -> some View {
        TimelineView(.periodic(from: .now, by: 0.25)) { _ in
            let n = m.igjen(d.frist)
            let andel = d.sek > 0 ? max(0, min(1, (d.frist - 3000 - m.naaMs()) / (d.sek * 1000))) : 0
            ZStack {
                Circle().fill(kortFarge)
                Kake(andel: andel).fill(n <= 10 ? oransje : gul)
                Circle().stroke(morkBlekk, lineWidth: 2.5)
                Text("\(n)").font(.archivo(16, vekt: 900)).foregroundColor(blekk)
                    .padding(.horizontal, 6).background(Capsule().fill(kortFarge.opacity(0.85)))
            }
            .frame(width: 44, height: 44)
        }
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

    private func farge(_ hex: String) -> Color {
        var h = hex.trimmingCharacters(in: .whitespaces); if h.hasPrefix("#") { h.removeFirst() }
        guard h.count == 6, let v = UInt32(h, radix: 16) else { return gul }
        return Color(red: Double((v >> 16) & 255) / 255, green: Double((v >> 8) & 255) / 255, blue: Double(v & 255) / 255)
    }

    // MARK: Klar – hva som skjer, hvem som er med, og vertens startknapp
    @ViewBuilder private func klar(_ d: SdData) -> some View {
        Text(d.intro).font(.archivo(20, vekt: 700)).lineSpacing(2).fixedSize(horizontal: false, vertical: true)
            .padding(16).frame(maxWidth: .infinity, alignment: .leading)
            .background(RoundedRectangle(cornerRadius: 10).fill(kortFarge)).overlay(RoundedRectangle(cornerRadius: 10).stroke(blekk, lineWidth: 3))
            .background(RoundedRectangle(cornerRadius: 10).fill(blekk).offset(x: 4, y: 4))
        HStack(spacing: 8) {
            HStack(spacing: -10) { ForEach(d.folk) { h in hode(h.png, 36) } }
            Text(d.med).font(.archivo(13, vekt: 800)).opacity(0.7)
        }
        if !d.start.isEmpty { storKnapp(d.start) { m.trykk("startklokke") } }
        if !d.vent.isEmpty { Text(d.vent).font(.archivo(15, vekt: 600)).opacity(0.7) }
    }

    // MARK: Skriv – til hvem, kortet (dialogen), forslag, og bunken din
    @ViewBuilder private func skriv(_ d: SdData) -> some View {
        TimelineView(.periodic(from: .now, by: 0.5)) { _ in
            let n = m.igjen(d.frist)
            VStack(alignment: .leading, spacing: 12) {
                if n > 0 {
                    VStack(alignment: .leading, spacing: 12) {
                        FlytRad(spacing: 6) {
                            Text(d.tilEtikett.uppercased()).font(.archivo(11, vekt: 900)).opacity(0.6).padding(.trailing, 2)
                            ForEach(d.til) { t in
                                let paa = tilValgt == t.v
                                Button(action: { tilValgt = t.v; m.trykk("rf-til", ["til": t.v]) }) {
                                    Text(t.tekst).font(.archivo(14, vekt: 800))
                                        .foregroundColor(paa ? (t.farge.isEmpty ? lys : morkBlekk) : blekk)
                                        .padding(.horizontal, 11).padding(.vertical, 7)
                                        .background(Capsule().fill(paa ? (t.farge.isEmpty ? blekk : farge(t.farge)) : kortFarge))
                                        .overlay(Capsule().stroke(blekk, lineWidth: 2.5))
                                        .background(Capsule().fill(blekk).offset(x: paa ? 1 : 3, y: paa ? 1 : 3))
                                        .offset(x: paa ? 2 : 0, y: paa ? 2 : 0)
                                }.buttonStyle(.plain)
                            }
                        }
                        Button(action: { m.skjema(d.skjemaId) }) {
                            HStack(alignment: .top, spacing: 10) {
                                Text(d.plass).font(.archivo(18, vekt: 800)).opacity(0.45).multilineTextAlignment(.leading).fixedSize(horizontal: false, vertical: true)
                                Spacer(minLength: 0)
                                Image(systemName: "pencil").font(.system(size: 18, weight: .bold)).opacity(0.6)
                            }
                            .padding(12).frame(maxWidth: .infinity, minHeight: 72, alignment: .topLeading)
                            .background(RoundedRectangle(cornerRadius: 4).fill(papir))
                            .overlay(RoundedRectangle(cornerRadius: 4).stroke(blekk, style: StrokeStyle(lineWidth: 2.5, dash: [8, 6])))
                        }.buttonStyle(.plain)
                        VStack(spacing: 6) {
                            ForEach(d.startere, id: \.self) { t in
                                Button(action: { m.trykk("rf-starter", ["t": t]) }) {
                                    Text(t).font(.archivo(13, vekt: 800)).multilineTextAlignment(.leading).fixedSize(horizontal: false, vertical: true)
                                        .padding(.horizontal, 10).padding(.vertical, 7).frame(maxWidth: .infinity, alignment: .leading)
                                        .background(RoundedRectangle(cornerRadius: 4).fill(papir)).overlay(RoundedRectangle(cornerRadius: 4).stroke(blekk, lineWidth: 2))
                                }.buttonStyle(.plain)
                            }
                        }
                        storKnapp(d.skriv) { m.skjema(d.skjemaId) }
                    }
                    .padding(14)
                    .background(RoundedRectangle(cornerRadius: 8).fill(kortFarge)).overlay(RoundedRectangle(cornerRadius: 8).stroke(blekk, lineWidth: 3))
                    .background(RoundedRectangle(cornerRadius: 8).fill(blekk).offset(x: 6, y: 6))
                }
                bunken(d)
                if n <= 0 { storKnapp(d.stokk) { m.trykk("stokk") } }
                else if !d.stokkLink.isEmpty { lenke(d.stokkLink) { m.trykk("stokk") }.frame(maxWidth: .infinity) }
            }
        }
    }

    /// Bunken din: de siste tre kortene i en stabel, og tallet som dunker når et nytt kort lander
    private func bunken(_ d: SdData) -> some View {
        HStack(alignment: .bottom, spacing: 12) {
            ZStack(alignment: .bottomLeading) {
                ForEach(Array(d.bunke.enumerated()), id: \.offset) { i, t in
                    Text(t).font(.archivo(11, vekt: 800)).foregroundColor(morkBlekk).lineLimit(4).multilineTextAlignment(.leading)
                        .padding(8).frame(width: 130, height: 84, alignment: .topLeading)
                        .background(RoundedRectangle(cornerRadius: 6).fill(Color.white)).overlay(RoundedRectangle(cornerRadius: 6).stroke(morkBlekk, lineWidth: 2.5))
                        .background(RoundedRectangle(cornerRadius: 6).fill(morkBlekk).offset(x: 3, y: 3))
                        .rotationEffect(.degrees(Double(i - 1) * 3))
                        .offset(x: CGFloat(i) * 5, y: CGFloat(-i) * 3)
                        .transition(.asymmetric(insertion: .offset(y: -140).combined(with: .opacity), removal: .opacity))
                        .id(t + "\(d.mine - d.bunke.count + i)")
                }
            }
            .frame(width: 150, height: 104, alignment: .bottomLeading)
            Spacer()
            VStack(alignment: .trailing, spacing: 4) {
                Text("\(d.mine)").font(.archivo(46, vekt: 900)).lineLimit(1)
                    .scaleEffect(kortInn ? 1.18 : 1, anchor: .bottomTrailing)
                    .animation(.spring(response: 0.3, dampingFraction: 0.45), value: kortInn)
                Text(d.mineTekst).font(.archivo(12, vekt: 800)).opacity(0.6)
                Text(d.totaltTekst).font(.archivo(12, vekt: 800)).opacity(0.6)
            }
        }
        .frame(minHeight: 108)
        .onChange(of: d.mine) { _ in
            kortInn = true
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.18) { kortInn = false }
        }
    }

    // MARK: Trekk – kortet, hvem det er til, kast-avstemning og videre
    @ViewBuilder private func trekk(_ d: SdData) -> some View {
        VStack(alignment: .leading, spacing: 0) {
            ZStack(alignment: .topLeading) {
                if d.tilMeg {
                    RoundedRectangle(cornerRadius: 10).fill(gul).overlay(RoundedRectangle(cornerRadius: 10).stroke(morkBlekk, lineWidth: 3))
                }
                VStack(spacing: 0) {
                    ZStack {
                        RoundedRectangle(cornerRadius: 10).fill(kortFarge).overlay(RoundedRectangle(cornerRadius: 10).stroke(blekk, lineWidth: 3)).rotationEffect(.degrees(3)).padding(.horizontal, 4)
                        RoundedRectangle(cornerRadius: 10).fill(kortFarge).overlay(RoundedRectangle(cornerRadius: 10).stroke(blekk, lineWidth: 3)).rotationEffect(.degrees(-2)).padding(.horizontal, 2)
                        kortet(d)
                    }
                }
                .padding(.horizontal, d.tilMeg ? 12 : 0).padding(.top, d.tilMeg ? 56 : 0).padding(.bottom, d.tilMeg ? 16 : 0)
                if d.tilMeg {
                    Text(d.tilDeg.uppercased()).font(.archivo(44, vekt: 900)).foregroundColor(gul)
                        .padding(.horizontal, 12).padding(.top, 4).padding(.bottom, 8)
                        .background(Rectangle().fill(morkBlekk)).background(Rectangle().fill(oransje).offset(x: 6, y: 6))
                        .rotationEffect(.degrees(-3))
                        .scaleEffect(kortInn ? 1 : 1.6, anchor: .topLeading).opacity(kortInn ? 1 : 0)
                        .offset(x: 10, y: -8)
                }
            }
            .padding(.top, d.tilMeg ? 10 : 0)
        }
        .id(d.trekkNr)
        .onAppear { kortInn = false; DispatchQueue.main.asyncAfter(deadline: .now() + 0.05) { withAnimation(.spring(response: 0.5, dampingFraction: 0.72)) { kortInn = true } } }
        if let k = d.kast { kast(k) }
        if !d.neste.isEmpty { storKnapp(d.neste) { m.trykk("neste", ["pos": String(d.pos)]) } }
        if !d.nesteVent.isEmpty { Text(d.nesteVent).font(.archivo(15, vekt: 600)).opacity(0.7).frame(maxWidth: .infinity) }
        if !d.kastLink.isEmpty { lenke(d.kastLink) { m.trykk("rf-kast") }.frame(maxWidth: .infinity) }
    }

    /// Selve kortet: hvem det er til øverst, teksten stor, og hvor det kom fra
    private func kortet(_ d: SdData) -> some View {
        VStack(alignment: .leading, spacing: 14) {
            FlytRad(spacing: 8) {
                if d.mottakere.isEmpty {
                    Text(d.tilAlle.uppercased()).font(.archivo(12, vekt: 900)).opacity(0.6)
                } else {
                    Text(d.tilEtikett.uppercased()).font(.archivo(12, vekt: 900)).opacity(0.6)
                    ForEach(d.mottakere) { h in
                        HStack(spacing: 6) { hode(h.png, 24); Text(h.navn).font(.archivo(14, vekt: 900)) }
                            .padding(.leading, 3).padding(.trailing, 10).padding(.vertical, 3).foregroundColor(morkBlekk)
                            .background(Capsule().fill(gul)).overlay(Capsule().stroke(morkBlekk, lineWidth: 2.5))
                    }
                }
            }
            Spacer(minLength: 0)
            Text(d.kortet).font(.archivo(d.kortet.count > 90 ? 24 : 30, vekt: 900)).lineSpacing(1).multilineTextAlignment(.leading)
                .fixedSize(horizontal: false, vertical: true).frame(maxWidth: .infinity, alignment: .leading)
            Spacer(minLength: 0)
            if !d.kortUnder.isEmpty { Text(d.kortUnder).font(.archivo(12, vekt: 800)).opacity(0.6) }
        }
        .padding(18).frame(maxWidth: .infinity, minHeight: 300, alignment: .topLeading)
        .background(RoundedRectangle(cornerRadius: 10).fill(kortFarge)).overlay(RoundedRectangle(cornerRadius: 10).stroke(blekk, lineWidth: 3))
        .background(RoundedRectangle(cornerRadius: 10).fill(blekk).offset(x: 8, y: 8))
        .scaleEffect(kortInn ? 1 : 0.94).rotationEffect(.degrees(kortInn ? 0 : -4)).offset(y: kortInn ? 0 : 30).opacity(kortInn ? 1 : 0)
    }

    /// Kast i Skammekroken? Alle unntatt den som skrev kortet stemmer
    private func kast(_ k: SdKast) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(k.tittel).font(.archivo(16, vekt: 900))
            Text(k.tekst).font(.archivo(13, vekt: 700))
            if k.kanStemme {
                HStack(spacing: 8) {
                    kastKnapp(k.ja, paa: k.mitt == "ja") { m.trykk("rf-kast-stem", ["ja": "1"]) }
                    kastKnapp(k.nei, paa: false) { m.trykk("rf-kast-stem", ["ja": "0"]) }
                }
            } else { Text(k.ikke).font(.archivo(13, vekt: 700)) }
            if !k.avbryt.isEmpty { lenke(k.avbryt) { m.trykk("rf-kast-avbryt") } }
        }
        .padding(.horizontal, 14).padding(.vertical, 12).frame(maxWidth: .infinity, alignment: .leading).foregroundColor(morkBlekk)
        .background(RoundedRectangle(cornerRadius: 6).fill(rosa)).overlay(RoundedRectangle(cornerRadius: 6).stroke(morkBlekk, lineWidth: 3))
        .background(RoundedRectangle(cornerRadius: 6).fill(morkBlekk).offset(x: 3, y: 3))
    }
    private func kastKnapp(_ t: String, paa: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(t.uppercased()).font(.archivo(15, vekt: 900)).foregroundColor(morkBlekk).lineLimit(2).minimumScaleFactor(0.7)
                .frame(maxWidth: .infinity).frame(minHeight: 48)
                .background(RoundedRectangle(cornerRadius: 4).fill(paa ? oransje : lys)).overlay(RoundedRectangle(cornerRadius: 4).stroke(morkBlekk, lineWidth: 3))
                .background(RoundedRectangle(cornerRadius: 4).fill(morkBlekk).offset(x: 3, y: 3))
        }.buttonStyle(.plain)
    }

    // MARK: Skammekroken
    @ViewBuilder private func skam(_ d: SdData) -> some View {
        Text(d.stempel.uppercased()).font(.archivo(44, vekt: 900)).foregroundColor(morkBlekk).lineLimit(1).minimumScaleFactor(0.6)
            .padding(.horizontal, 14).padding(.top, 6).padding(.bottom, 10)
            .background(Rectangle().fill(oransje)).overlay(Rectangle().stroke(morkBlekk, lineWidth: 4))
            .background(Rectangle().fill(morkBlekk).offset(x: 8, y: 8))
            .rotationEffect(.degrees(-3)).padding(.top, 8).padding(.bottom, 6)
        Text(d.skamIntro).font(.archivo(15, vekt: 700))
        ForEach(d.skam) { k in
            VStack(alignment: .leading, spacing: 8) {
                HStack(spacing: 8) { hode(k.hode.png, 28); Text(k.fra).font(.archivo(17, vekt: 900)) }
                Text("«" + k.tekst + "»").font(.archivo(16, vekt: 700)).strikethrough(true, color: blekk).opacity(0.6).fixedSize(horizontal: false, vertical: true)
                if !k.kommentar.isEmpty { Text(k.kommentar).font(.archivo(14, vekt: 800)).fixedSize(horizontal: false, vertical: true) }
            }
            .padding(.horizontal, 14).padding(.vertical, 12).frame(maxWidth: .infinity, alignment: .leading)
            .background(RoundedRectangle(cornerRadius: 6).fill(kortFarge)).overlay(RoundedRectangle(cornerRadius: 6).stroke(blekk, lineWidth: 3))
            .background(RoundedRectangle(cornerRadius: 6).fill(blekk).offset(x: 4, y: 4))
        }
        Text(d.straff.uppercased()).font(.archivo(16, vekt: 900)).foregroundColor(morkBlekk)
            .padding(.horizontal, 12).padding(.vertical, 10).frame(maxWidth: .infinity, alignment: .leading)
            .background(RoundedRectangle(cornerRadius: 6).fill(gul)).overlay(RoundedRectangle(cornerRadius: 6).stroke(morkBlekk, lineWidth: 3))
        storKnapp(d.videre) { m.trykk("neste") }
    }

    // MARK: Ferdig – hvor mange kort, og hva nå
    @ViewBuilder private func ferdig(_ d: SdData) -> some View {
        HStack(alignment: .firstTextBaseline, spacing: 12) {
            Text("\(d.trukket)").font(.archivo(64, vekt: 900))
            Text(d.trukketTekst).font(.archivo(18, vekt: 700)).fixedSize(horizontal: false, vertical: true)
        }
        .padding(16).frame(maxWidth: .infinity, alignment: .leading)
        .background(RoundedRectangle(cornerRadius: 10).fill(kortFarge)).overlay(RoundedRectangle(cornerRadius: 10).stroke(blekk, lineWidth: 3))
        .background(RoundedRectangle(cornerRadius: 10).fill(blekk).offset(x: 4, y: 4))
        BlokkListe(m: m.blokker).padding(.top, 6)
    }

    private func storKnapp(_ t: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(t.uppercased()).font(.archivo(18, vekt: 900)).foregroundColor(morkBlekk).lineLimit(2).minimumScaleFactor(0.7)
                .frame(maxWidth: .infinity).frame(minHeight: 60).padding(.horizontal, 10)
                .background(RoundedRectangle(cornerRadius: 14).fill(gul)).overlay(RoundedRectangle(cornerRadius: 14).stroke(morkBlekk, lineWidth: 3))
                .background(RoundedRectangle(cornerRadius: 14).fill(morkBlekk).offset(x: 4, y: 4))
        }.buttonStyle(.plain)
    }
    private func lenke(_ t: String, action: @escaping () -> Void) -> some View {
        Button(action: action) { Text(t).font(.archivo(14, vekt: 700)).underline().opacity(0.8).padding(.vertical, 6) }.buttonStyle(.plain)
    }
}

/// Kakestykket i klokka: fylt fra toppen og med klokka, krymper når tida går
struct Kake: Shape {
    var andel: Double
    func path(in r: CGRect) -> Path {
        var p = Path()
        guard andel > 0 else { return p }
        let c = CGPoint(x: r.midX, y: r.midY), rad = min(r.width, r.height) / 2 - 3
        p.move(to: c)
        p.addArc(center: c, radius: rad, startAngle: .degrees(-90), endAngle: .degrees(-90 + 360 * andel), clockwise: false)
        p.closeSubpath()
        return p
    }
}
