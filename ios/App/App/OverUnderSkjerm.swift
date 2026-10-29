import SwiftUI
import UIKit
import WebKit

/// Over eller under som native skjerm: folket med hvem som har tur, bunken med kortet som snus inn, potten,
/// sjansestripa, svaret og OVER/UNDER-knappene. Nettsiden under holder tilstanden (rom.js ouData) – denne tegner,
/// og trykkene går til nettsidens egne knapper (ou-gjett, ou-hopp). Sluttknappene kommer som blokker.
struct OuFolk: Identifiable { let id: String; let navn: String; let png: String; let tur: Bool; let drukket: Int; let oi: Bool }
struct OuKort { let v: String, f: String, rod: Bool }
struct OuSvar { let riktig: Bool, tittel: String, tekst: String }

struct OuData {
    let runde: Int, n: Int, ferdig: Bool, jeg: Bool, vert: Bool, naa: Double, tittel: String, chip: String, gul: Bool
    let folk: [OuFolk], kort: OuKort?, bunke: Int, pottTekst: String, lagFor: Int
    let over: Int, under: Int, andel: Double, overTekst: String, underTekst: String, svar: OuSvar?
    let overKnapp: String, underKnapp: String, kan: Bool, svarerFor: String, hopp: String, vent: String, storst: String
    let slutt: [[String: Any]], stua: String, mer: String
    init(_ d: [String: Any]) {
        func s(_ k: String) -> String { d[k] as? String ?? "" }
        func b(_ k: String) -> Bool { d[k] as? Bool ?? false }
        func i(_ k: String) -> Int { (d[k] as? NSNumber)?.intValue ?? 0 }
        runde = i("runde"); n = i("n"); ferdig = b("ferdig"); jeg = b("jeg"); vert = b("vert"); naa = (d["naa"] as? NSNumber)?.doubleValue ?? 0
        tittel = s("tittel"); chip = s("chip"); gul = b("gul")
        folk = (d["folk"] as? [[String: Any]] ?? []).map { f in OuFolk(id: f["id"] as? String ?? "", navn: f["navn"] as? String ?? "", png: f["png"] as? String ?? "", tur: f["tur"] as? Bool ?? false, drukket: (f["drukket"] as? NSNumber)?.intValue ?? 0, oi: f["oi"] as? Bool ?? false) }
        if let k = d["kort"] as? [String: Any] { kort = OuKort(v: k["v"] as? String ?? "", f: k["f"] as? String ?? "", rod: k["rod"] as? Bool ?? false) } else { kort = nil }
        bunke = max(1, i("bunke")); pottTekst = s("pottTekst"); lagFor = i("lagFor")
        over = i("over"); under = i("under"); andel = (d["andel"] as? NSNumber)?.doubleValue ?? 0.5; overTekst = s("overTekst"); underTekst = s("underTekst")
        if let v = d["svar"] as? [String: Any] { svar = OuSvar(riktig: v["riktig"] as? Bool ?? false, tittel: v["tittel"] as? String ?? "", tekst: v["tekst"] as? String ?? "") } else { svar = nil }
        overKnapp = s("overKnapp"); underKnapp = s("underKnapp"); kan = b("kan"); svarerFor = s("svarerFor"); hopp = s("hopp"); vent = s("vent"); storst = s("storst")
        slutt = d["slutt"] as? [[String: Any]] ?? []; stua = s("stua").isEmpty ? "Stua" : s("stua"); mer = s("mer").isEmpty ? "Mer" : s("mer")
    }
}

final class OuModell: ObservableObject {
    @Published var d: OuData? = nil
    let blokker = KortModell()
    weak var nett: WKWebView? { didSet { blokker.nett = nett } }
    private var bilder: [String: UIImage] = [:]
    func sett(_ dict: [String: Any]) {
        let ny = OuData(dict)
        blokker.sett(["blokker": ny.slutt, "naa": dict["naa"] ?? 0])
        withAnimation(.spring(response: 0.45, dampingFraction: 0.78)) { d = ny }
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
}

struct OverUnderSkjerm: View {
    @ObservedObject var m: OuModell
    @Environment(\.colorScheme) private var modus
    @State private var kortInn = false
    @State private var sklir = false
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
    private let kortRod = Color(red: 0.843, green: 0.149, blue: 0.239)

    var body: some View {
        ZStack {
            papir.ignoresSafeArea()
            if let d = m.d {
                VStack(spacing: 0) {
                    topp(d)
                    ScrollView(showsIndicators: false) {
                        VStack(alignment: .leading, spacing: 12) {
                            folk(d)
                            bord(d)
                            sjanse(d)
                            if let v = d.svar { svar(v) }
                            if d.ferdig {
                                if !d.storst.isEmpty {
                                    Text(d.storst).font(.archivo(17, vekt: 900)).foregroundColor(morkBlekk).padding(12).frame(maxWidth: .infinity, alignment: .leading)
                                        .background(RoundedRectangle(cornerRadius: 10).fill(gul)).overlay(RoundedRectangle(cornerRadius: 10).stroke(morkBlekk, lineWidth: 3))
                                }
                                BlokkListe(m: m.blokker).padding(.top, 6)
                            } else {
                                if !d.svarerFor.isEmpty { Text(d.svarerFor.uppercased()).font(.archivo(13, vekt: 900)).opacity(0.6) }
                                if d.kan { knapper(d) }
                                if !d.hopp.isEmpty {
                                    Button(action: { m.trykk("ou-hopp") }) { Text(d.hopp).font(.archivo(14, vekt: 800)).underline().opacity(0.7).padding(.vertical, 8).frame(maxWidth: .infinity) }.buttonStyle(.plain)
                                }
                                if !d.vent.isEmpty { Text(d.vent).font(.archivo(15, vekt: 600)).opacity(0.7).fixedSize(horizontal: false, vertical: true) }
                            }
                        }
                        .padding(.horizontal, 16).padding(.top, 4).padding(.bottom, 24)
                    }
                }
            }
        }
        .foregroundColor(blekk)
    }

    private func topp(_ d: OuData) -> some View {
        HStack(spacing: 8) {
            VStack(alignment: .leading, spacing: 1) {
                Text(d.tittel).font(.archivo(12, vekt: 700)).opacity(0.65)
                Text(d.chip).font(.archivo(16, vekt: 900)).foregroundColor(d.gul ? rust : blekk).lineLimit(2)
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

    /// Folket: den som har tur løftes opp med gul ring, slurkene drukket som rosa pille
    private func folk(_ d: OuData) -> some View {
        HStack(alignment: .top, spacing: 6) {
            ForEach(d.folk) { f in
                VStack(spacing: 4) {
                    hode(f.png, 48)
                        .background(f.tur ? Circle().stroke(gul, lineWidth: 5).padding(-2) : nil)
                        .offset(y: f.tur ? -6 : 0)
                    Text(f.navn).font(.archivo(14, vekt: 900)).lineLimit(1).minimumScaleFactor(0.7)
                    if f.drukket > 0 {
                        Text("−\(f.drukket)").font(.archivo(13, vekt: 900)).foregroundColor(morkBlekk).padding(.horizontal, 8).padding(.vertical, 1)
                            .background(Capsule().fill(rosa)).overlay(Capsule().stroke(morkBlekk, lineWidth: 2.5))
                    }
                }.frame(maxWidth: .infinity)
            }
        }
        .padding(.top, 8)
    }

    /// Bordet: bunken (lagene under og kortet som snus inn) og potten
    private func bord(_ d: OuData) -> some View {
        let lag = min(6, (sklir ? d.lagFor : d.bunke) - 1)
        return HStack(spacing: 26) {
            ZStack {
                ForEach((1...max(1, lag)).reversed(), id: \.self) { i in
                    if lag >= 1 {
                        RoundedRectangle(cornerRadius: 12).fill(kortFarge).overlay(RoundedRectangle(cornerRadius: 12).stroke(blekk, lineWidth: 3))
                            .frame(width: 150, height: 210)
                            .rotationEffect(.degrees(Double(i % 2 == 1 ? 1 : -1) * Double(i) * 1.2))
                            .offset(x: CGFloat(-i) * 4, y: CGFloat(i) * 4)
                            .offset(y: sklir ? -260 : 0).scaleEffect(sklir ? 0.4 : 1).opacity(sklir ? 0 : 1)
                    }
                }
                if let k = d.kort {
                    VStack {
                        HStack { Text(k.v).font(.archivo(30, vekt: 900)); Spacer() }
                        Spacer()
                        Text(k.f).font(.system(size: 88))
                        Spacer()
                        HStack { Spacer(); Text(k.v).font(.archivo(30, vekt: 900)).rotationEffect(.degrees(180)) }
                    }
                    .padding(.horizontal, 14).padding(.vertical, 12)
                    .frame(width: 150, height: 210).foregroundColor(k.rod ? kortRod : morkBlekk)
                    .background(RoundedRectangle(cornerRadius: 12).fill(Color.white)).overlay(RoundedRectangle(cornerRadius: 12).stroke(morkBlekk, lineWidth: 4))
                    .background(RoundedRectangle(cornerRadius: 12).fill(morkBlekk).offset(x: 6, y: 6))
                    .rotation3DEffect(.degrees(kortInn ? 0 : 180), axis: (x: 0, y: 1, z: 0))
                    .rotationEffect(.degrees(kortInn ? 0 : 8)).offset(x: kortInn ? 0 : 120, y: kortInn ? 0 : -30)
                    .id(d.n)
                    .onAppear {
                        if d.n > 0 { kortInn = false; DispatchQueue.main.asyncAfter(deadline: .now() + 0.03) { withAnimation(.spring(response: 0.6, dampingFraction: 0.75)) { kortInn = true } } }
                        else { kortInn = true }
                        if d.lagFor > 1 { sklir = false; DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) { withAnimation(.easeIn(duration: 0.7)) { sklir = true } } }
                        else { sklir = false }
                    }
                }
            }
            .frame(width: 160, height: 220)
            VStack(spacing: 6) {
                Text("\(d.bunke)").font(.archivo(44, vekt: 900)).foregroundColor(morkBlekk).frame(width: 88, height: 88)
                    .background(Circle().fill(gul)).overlay(Circle().stroke(morkBlekk, lineWidth: 4))
                    .background(Circle().fill(morkBlekk).offset(x: 4, y: 4))
                Text(d.pottTekst.uppercased()).font(.archivo(13, vekt: 900))
            }
        }
        .frame(maxWidth: .infinity).frame(minHeight: 250)
    }

    /// Sjansen: mint for høyere, rosa for lavere
    private func sjanse(_ d: OuData) -> some View {
        VStack(spacing: 6) {
            GeometryReader { g in
                ZStack(alignment: .leading) {
                    Capsule().fill(rosa)
                    Rectangle().fill(mint).frame(width: g.size.width * CGFloat(d.andel))
                        .overlay(Rectangle().fill(morkBlekk).frame(width: 3), alignment: .trailing)
                        .animation(.spring(response: 0.42, dampingFraction: 0.8), value: d.andel)
                }
                .clipShape(Capsule()).overlay(Capsule().stroke(blekk, lineWidth: 3))
            }.frame(height: 16)
            HStack { Text(d.overTekst); Spacer(); Text(d.underTekst) }.font(.archivo(13, vekt: 900))
        }
    }

    private func svar(_ v: OuSvar) -> some View {
        HStack(spacing: 10) {
            Text(v.tittel.uppercased()).font(.archivo(22, vekt: 900)).lineLimit(1).minimumScaleFactor(0.6)
            Text(v.tekst).font(.archivo(15, vekt: 800)).fixedSize(horizontal: false, vertical: true)
            Spacer(minLength: 0)
        }
        .padding(.horizontal, 14).padding(.vertical, 10).frame(maxWidth: .infinity, alignment: .leading).foregroundColor(morkBlekk)
        .background(RoundedRectangle(cornerRadius: 10).fill(v.riktig ? mint : rosa)).overlay(RoundedRectangle(cornerRadius: 10).stroke(morkBlekk, lineWidth: 3))
        .background(RoundedRectangle(cornerRadius: 10).fill(morkBlekk).offset(x: 4, y: 4))
        .transition(.asymmetric(insertion: .offset(y: 12).combined(with: .opacity), removal: .opacity))
    }

    /// OVER (mint, pil opp) og UNDER (rosa, pil ned)
    private func knapper(_ d: OuData) -> some View {
        HStack(spacing: 12) {
            gjettKnapp(d.overKnapp, "arrow.up", mint) { m.trykk("ou-gjett", ["paa": "over"]) }
            gjettKnapp(d.underKnapp, "arrow.down", rosa) { m.trykk("ou-gjett", ["paa": "under"]) }
        }
    }
    private func gjettKnapp(_ t: String, _ sym: String, _ farge: Color, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            VStack(spacing: 2) {
                Image(systemName: sym).font(.system(size: 30, weight: .black))
                Text(t.uppercased()).font(.archivo(30, vekt: 900)).lineLimit(1).minimumScaleFactor(0.6)
            }
            .frame(maxWidth: .infinity).frame(minHeight: 108).foregroundColor(morkBlekk)
            .background(RoundedRectangle(cornerRadius: 14).fill(farge)).overlay(RoundedRectangle(cornerRadius: 14).stroke(morkBlekk, lineWidth: 3))
            .background(RoundedRectangle(cornerRadius: 14).fill(morkBlekk).offset(x: 5, y: 5))
        }.buttonStyle(.plain)
    }
}
