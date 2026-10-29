import SwiftUI
import UIKit
import WebKit

/// Opus som native skjerm: hvem som har terningen, terningen som lander, og «Trill». Nettsiden under holder
/// tilstanden (rom.js opData) – denne tegner, og trykkene går til nettsidens egne knapper (kast, drop).
struct OpData {
    let holder: String, jeg: Bool, kast: Int, nr: Int, antall: Int, naa: Double, tittel: String, chip: String
    let spotify: String, spotifyUrl: String, etikett: String, holderTekst: String, melding: String, trill: String, vent: String, kastTekst: String, drop: String, stua: String, mer: String
    init(_ d: [String: Any]) {
        func s(_ k: String) -> String { d[k] as? String ?? "" }
        func i(_ k: String) -> Int { (d[k] as? NSNumber)?.intValue ?? 0 }
        holder = s("holder"); jeg = d["jeg"] as? Bool ?? false; kast = i("kast"); nr = i("nr"); antall = i("antall"); naa = (d["naa"] as? NSNumber)?.doubleValue ?? 0
        tittel = s("tittel"); chip = s("chip"); spotify = s("spotify"); spotifyUrl = s("spotifyUrl"); etikett = s("etikett"); holderTekst = s("holderTekst")
        melding = s("melding"); trill = s("trill"); vent = s("vent"); kastTekst = s("kastTekst"); drop = s("drop")
        stua = s("stua").isEmpty ? "Stua" : s("stua"); mer = s("mer").isEmpty ? "Mer" : s("mer")
    }
}

final class OpModell: ObservableObject {
    @Published var d: OpData? = nil
    weak var nett: WKWebView?
    func sett(_ dict: [String: Any]) { withAnimation(.spring(response: 0.45, dampingFraction: 0.7)) { d = OpData(dict) } }
    func trykk(_ g: String, _ attrs: [String: String] = [:]) {
        UIImpactFeedbackGenerator(style: g == "kast" ? .medium : .light).impactOccurred()
        guard let data = try? JSONSerialization.data(withJSONObject: [g, attrs]), let json = String(data: data, encoding: .utf8) else { return }
        nett?.evaluateJavaScript("window.__mvLek && window.__mvLek.trykk.apply(null, \(json))", completionHandler: nil)
    }
}

struct OpusSkjerm: View {
    @ObservedObject var m: OpModell
    @Environment(\.colorScheme) private var modus
    @State private var landet = 0
    @State private var vri: Double = 0
    private var papir: Color { modus == .dark ? Color(red: 0.11, green: 0.106, blue: 0.122) : Color(red: 1, green: 0.973, blue: 0.933) }
    private var blekk: Color { modus == .dark ? Color(red: 1, green: 0.973, blue: 0.933) : Color(red: 0.086, green: 0.071, blue: 0.059) }
    private var kortFarge: Color { modus == .dark ? Color(red: 0.173, green: 0.169, blue: 0.188) : .white }
    private let gul = Color(red: 1, green: 0.824, blue: 0.247)
    private let rust = Color(red: 0.722, green: 0.22, blue: 0.039)
    private let morkBlekk = Color(red: 0.086, green: 0.071, blue: 0.059)
    private let mint = Color(red: 0.388, green: 0.886, blue: 0.659)

    var body: some View {
        ZStack {
            papir.ignoresSafeArea()
            if let d = m.d {
                VStack(spacing: 0) {
                    topp(d)
                    VStack(spacing: 14) {
                        Button(action: { if let u = URL(string: d.spotifyUrl) { UIApplication.shared.open(u) } }) {
                            HStack(spacing: 6) { Image(systemName: "music.note").font(.system(size: 13, weight: .bold)); Text(d.spotify).font(.archivo(13, vekt: 800)) }
                                .padding(.horizontal, 12).frame(height: 36)
                                .background(Capsule().fill(mint)).overlay(Capsule().stroke(morkBlekk, lineWidth: 2.5)).foregroundColor(morkBlekk)
                        }.buttonStyle(.plain)
                        VStack(spacing: 2) {
                            Text(d.etikett.uppercased()).font(.archivo(12, vekt: 900)).opacity(0.6)
                            Text(d.holderTekst.uppercased()).font(.archivo(34, vekt: 900)).foregroundColor(rust).lineLimit(2).minimumScaleFactor(0.6).multilineTextAlignment(.center)
                        }
                        Terning(n: d.kast == 0 ? 6 : d.kast, farge: kortFarge, prikk: blekk, strek: blekk)
                            .frame(width: 132, height: 132)
                            .rotationEffect(.degrees(vri))
                            .scaleEffect(landet == d.nr ? 1 : 0.6)
                            .padding(.vertical, 10)
                            .onAppear { landet = d.nr }
                            .onChange(of: d.nr) { nr in
                                vri = -200
                                withAnimation(.spring(response: 0.55, dampingFraction: 0.62)) { landet = nr; vri = 0 }
                            }
                        Text(d.melding).font(.archivo(22, vekt: 900)).multilineTextAlignment(.center).fixedSize(horizontal: false, vertical: true)
                            .foregroundColor(d.kast == 6 ? rust : blekk)
                        if !d.trill.isEmpty {
                            Button(action: { m.trykk("kast") }) {
                                Text(d.trill.uppercased()).font(.archivo(22, vekt: 900)).foregroundColor(morkBlekk)
                                    .frame(maxWidth: .infinity).frame(minHeight: 72)
                                    .background(RoundedRectangle(cornerRadius: 14).fill(gul)).overlay(RoundedRectangle(cornerRadius: 14).stroke(morkBlekk, lineWidth: 3))
                                    .background(RoundedRectangle(cornerRadius: 14).fill(morkBlekk).offset(x: 4, y: 4))
                            }.buttonStyle(.plain)
                        } else {
                            Text(d.vent).font(.archivo(15, vekt: 600)).opacity(0.7).multilineTextAlignment(.center)
                        }
                        Text(d.kastTekst).font(.archivo(13, vekt: 800)).opacity(0.6)
                        if !d.drop.isEmpty {
                            Button(action: { m.trykk("drop") }) {
                                Text(d.drop).font(.archivo(14, vekt: 800)).padding(.horizontal, 14).frame(height: 40)
                                    .background(Capsule().fill(kortFarge)).overlay(Capsule().stroke(blekk, lineWidth: 2))
                            }.buttonStyle(.plain)
                        }
                        Spacer(minLength: 0)
                    }
                    .padding(.horizontal, 16).padding(.top, 8).padding(.bottom, 24)
                }
            }
        }
        .foregroundColor(blekk)
    }

    private func topp(_ d: OpData) -> some View {
        HStack(spacing: 8) {
            VStack(alignment: .leading, spacing: 1) {
                Text(d.tittel).font(.archivo(12, vekt: 700)).opacity(0.65)
                Text(d.chip).font(.archivo(16, vekt: 900)).foregroundColor(d.jeg ? rust : blekk).lineLimit(2)
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
}

/// En terning med prikker, som nettsidens `.dice`
struct Terning: View {
    let n: Int, farge: Color, prikk: Color, strek: Color
    private static let prikker: [Int: [Int]] = [1: [5], 2: [1, 9], 3: [1, 5, 9], 4: [1, 3, 7, 9], 5: [1, 3, 5, 7, 9], 6: [1, 3, 4, 6, 7, 9]]
    var body: some View {
        GeometryReader { g in
            let s = min(g.size.width, g.size.height), r = s * 0.22, p = s * 0.11
            ZStack {
                RoundedRectangle(cornerRadius: r).fill(strek).offset(x: s * 0.05, y: s * 0.05)
                RoundedRectangle(cornerRadius: r).fill(farge)
                RoundedRectangle(cornerRadius: r).stroke(strek, lineWidth: 3.5)
                ForEach(0..<9, id: \.self) { i in
                    let paa = (Terning.prikker[n] ?? []).contains(i + 1)
                    Circle().fill(prikk).frame(width: p, height: p)
                        .position(x: s * (0.25 + 0.25 * CGFloat(i % 3)), y: s * (0.25 + 0.25 * CGFloat(i / 3)))
                        .opacity(paa ? 1 : 0)
                }
            }
            .frame(width: s, height: s)
        }
    }
}
