import SwiftUI
import UIKit
import WebKit

/// Bussruta som native skjerm: billetten (fire spørsmål med store knapper), pyramiden som snus av seg selv,
/// og bussen som kjører ett stopp per trygt kort. Nettsiden under holder tilstanden, klokka og lyden (rom.js brData) –
/// denne skjermen tegner, og trykkene går tilbake til nettsidens egne knapper (window.__mvLek.trykk).
struct BrKort: Identifiable { let id: Int; let v: String; let f: String; let rod: Bool; let snudd: Bool; let naa: Bool }
struct BrKnapp: Identifiable { let id: String; let tekst: String; let stil: String }

struct BrData {
    let fase: Int, ferdig: Bool, tittel: String, chip: String, minTur: Bool
    let linje: [String], naa: Double
    let sporsmal: String, hand: [BrKort], svar: [String: Any], knapper: [BrKnapp], vent: String
    let pyr: [[BrKort]], treff: String, etikett: String
    let hjelp: String, maal: Int, rekke: Int, buss: [String: Any], kjor: String
    let slutt: [[String: Any]], stua: String, mer: String

    init(_ d: [String: Any]) {
        func s(_ k: String) -> String { d[k] as? String ?? "" }
        func kort(_ l: Any?) -> [BrKort] {
            (l as? [[String: Any]] ?? []).enumerated().map { i, k in
                BrKort(id: i, v: k["v"] as? String ?? "", f: k["f"] as? String ?? "", rod: k["rod"] as? Bool ?? false, snudd: k["snudd"] as? Bool ?? true, naa: k["naa"] as? Bool ?? false)
            }
        }
        fase = (d["fase"] as? NSNumber)?.intValue ?? 1; ferdig = d["ferdig"] as? Bool ?? false; tittel = s("tittel"); chip = s("chip"); minTur = d["minTur"] as? Bool ?? false
        linje = d["linje"] as? [String] ?? []; naa = (d["naa"] as? NSNumber)?.doubleValue ?? 0
        sporsmal = s("sporsmal"); hand = kort(d["hand"]); svar = d["svar"] as? [String: Any] ?? [:]
        knapper = (d["knapper"] as? [[String: Any]] ?? []).map { BrKnapp(id: $0["v"] as? String ?? "", tekst: $0["tekst"] as? String ?? "", stil: $0["stil"] as? String ?? "") }
        vent = s("vent")
        pyr = (d["pyr"] as? [[[String: Any]]] ?? []).map { kort($0) }; treff = s("treff"); etikett = s("etikett")
        hjelp = s("hjelp"); maal = (d["maal"] as? NSNumber)?.intValue ?? 5; rekke = (d["rekke"] as? NSNumber)?.intValue ?? 0; buss = d["buss"] as? [String: Any] ?? [:]; kjor = s("kjor")
        slutt = d["slutt"] as? [[String: Any]] ?? []; stua = d["stua"] as? String ?? "Stua"; mer = d["mer"] as? String ?? "Mer"
    }
}

final class BrModell: ObservableObject {
    @Published var d: BrData? = nil
    let blokker = KortModell()
    weak var nett: WKWebView? { didSet { blokker.nett = nett } }
    func sett(_ dict: [String: Any]) {
        let ny = BrData(dict)
        blokker.sett(["blokker": ny.slutt, "naa": dict["naa"] ?? 0])
        d = ny
    }
    func trykk(_ g: String, _ attrs: [String: String] = [:]) {
        UIImpactFeedbackGenerator(style: .light).impactOccurred()
        guard let data = try? JSONSerialization.data(withJSONObject: [g, attrs]), let json = String(data: data, encoding: .utf8) else { return }
        nett?.evaluateJavaScript("window.__mvLek && window.__mvLek.trykk.apply(null, \(json))", completionHandler: nil)
    }
}

struct BussrutaSkjerm: View {
    @ObservedObject var m: BrModell
    @Environment(\.colorScheme) private var modus
    private var papir: Color { modus == .dark ? Color(red: 0.11, green: 0.106, blue: 0.122) : Color(red: 1, green: 0.973, blue: 0.933) }
    private var kort: Color { modus == .dark ? Color.white.opacity(0.07) : .white }
    private var blekk: Color { modus == .dark ? Color(red: 1, green: 0.973, blue: 0.933) : Color(red: 0.086, green: 0.071, blue: 0.059) }
    private let gul = Color(red: 1, green: 0.824, blue: 0.247)
    private let oransje = Color(red: 1, green: 0.357, blue: 0.122)
    private let rust = Color(red: 0.776, green: 0.235, blue: 0.067)
    private let mint = Color(red: 0.388, green: 0.886, blue: 0.659)
    private let rosa = Color(red: 1, green: 0.612, blue: 0.761)
    private let morkBlekk = Color(red: 0.086, green: 0.071, blue: 0.059)
    private let lys = Color(red: 1, green: 0.973, blue: 0.933)
    private let kortRod = Color(red: 0.843, green: 0.149, blue: 0.239)
    private let asfalt = Color(red: 0.227, green: 0.224, blue: 0.251)

    var body: some View {
        ZStack {
            papir.ignoresSafeArea()
            if let d = m.d {
                VStack(spacing: 0) {
                    topp(d)
                    VStack(alignment: .leading, spacing: 12) {
                            linje(d)
                            switch d.fase {
                            case 1: billetten(d)
                            case 2: pyramiden(d)
                            default: bussen(d)
                            }
                            if d.ferdig { BlokkListe(m: m.blokker) }
                            Spacer(minLength: 0)
                        }.padding(.horizontal, 16).padding(.bottom, 12)
                }
            }
        }
        .foregroundColor(blekk)
    }

    private func topp(_ d: BrData) -> some View {
        HStack(spacing: 8) {
            VStack(alignment: .leading, spacing: 1) {
                Text(d.tittel).font(.archivo(12, vekt: 700)).opacity(0.65)
                Text(d.chip).font(.archivo(16, vekt: 900)).foregroundColor(d.minTur ? rust : blekk).lineLimit(2)
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
                .background(Capsule().fill(kort)).overlay(Capsule().stroke(blekk, lineWidth: 2))
        }.buttonStyle(.plain)
    }

    /// Ruta: Billetten → Pyramiden → Bussen
    private func linje(_ d: BrData) -> some View {
        HStack(spacing: 0) {
            ForEach(Array(d.linje.enumerated()), id: \.offset) { i, t in
                let ferdig = i + 1 < d.fase, naa = i + 1 == d.fase
                VStack(spacing: 4) {
                    Circle().fill(ferdig ? mint : naa ? gul : kort).overlay(Circle().stroke(blekk, lineWidth: 2.5)).frame(width: 18, height: 18)
                    Text(t).font(.archivo(12, vekt: naa ? 900 : 700)).opacity(naa ? 1 : 0.6)
                }.frame(maxWidth: .infinity)
            }
        }
        .padding(.vertical, 4)
        .background(Rectangle().fill(blekk.opacity(0.25)).frame(height: 2).offset(y: -10))
    }

    /// Et spillkort: hvitt med verdi og farge, eller rød bakside
    private func spillkort(_ k: BrKort, w: CGFloat, h: CGFloat) -> some View {
        ZStack {
            if k.snudd {
                RoundedRectangle(cornerRadius: w * 0.12).fill(Color.white)
                VStack(spacing: 2) {
                    Text(k.v).font(.system(size: w * 0.4, weight: .black))
                    Text(k.f).font(.system(size: w * 0.42, weight: .black))
                }.foregroundColor(k.rod ? kortRod : morkBlekk)
            } else {
                RoundedRectangle(cornerRadius: w * 0.12).fill(kortRod)
                RoundedRectangle(cornerRadius: w * 0.12).stroke(Color.white.opacity(0.5), lineWidth: 1.5).padding(4)
            }
            RoundedRectangle(cornerRadius: w * 0.12).stroke(morkBlekk, lineWidth: 2.5)
            if k.naa { RoundedRectangle(cornerRadius: w * 0.12).stroke(gul, lineWidth: 3).padding(-3) }
        }
        .frame(width: w, height: h)
        .rotation3DEffect(.degrees(k.snudd ? 0 : 180), axis: (x: 0, y: 1, z: 0))
        .animation(.spring(response: 0.5, dampingFraction: 0.75), value: k.snudd)
    }

    /// Vifta: kortene til den som svarer
    private func vifte(_ hand: [BrKort], w: CGFloat, h: CGFloat) -> some View {
        let n = hand.count
        return ZStack {
            ForEach(hand) { k in
                let i = Double(k.id) - Double(n - 1) / 2
                spillkort(k, w: w, h: h).rotationEffect(.degrees(i * 7), anchor: .bottom).offset(x: CGFloat(i) * (w * 0.78))
                    .transition(.scale(scale: 0.6).combined(with: .opacity))
            }
        }
        .frame(maxWidth: .infinity).frame(height: h + 16)
    }

    /// Svaret: riktig/feil-lappen
    @ViewBuilder private func svarLapp(_ sv: [String: Any]) -> some View {
        if let t = sv["tittel"] as? String, !t.isEmpty {
            let ok = sv["ok"] as? Bool ?? false
            HStack(spacing: 10) {
                if let k = sv["kort"] as? [String: Any] {
                    spillkort(BrKort(id: 0, v: k["v"] as? String ?? "", f: k["f"] as? String ?? "", rod: k["rod"] as? Bool ?? false, snudd: true, naa: false), w: 36, h: 50)
                }
                VStack(alignment: .leading, spacing: 2) {
                    Text(t).font(.archivo(16, vekt: 900))
                    if let u = sv["tekst"] as? String, !u.isEmpty { Text(u).font(.archivo(13, vekt: 600)).opacity(0.8) }
                }
                Spacer(minLength: 0)
            }
            .padding(.horizontal, 14).padding(.vertical, 10).foregroundColor(morkBlekk)
            .background(RoundedRectangle(cornerRadius: 10).fill(ok ? mint : Color(red: 1, green: 0.85, blue: 0.8)))
            .overlay(RoundedRectangle(cornerRadius: 10).stroke(morkBlekk, lineWidth: 3))
            .background(RoundedRectangle(cornerRadius: 10).fill(morkBlekk).offset(x: 4, y: 4))
            .transition(.move(edge: .bottom).combined(with: .opacity))
        }
    }

    // MARK: Fase 1 – billetten: spørsmålet, vifta, og de store knappene
    @ViewBuilder private func billetten(_ d: BrData) -> some View {
        Text(d.sporsmal).font(.archivo(22, vekt: 900)).fixedSize(horizontal: false, vertical: true)
        vifte(d.hand, w: 72, h: 100)
        svarLapp(d.svar)
        if d.knapper.isEmpty {
            Text(d.vent).font(.archivo(14, vekt: 600)).opacity(0.7)
        } else {
            let fire = d.knapper.count == 4
            LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 10), count: fire ? 4 : 2), spacing: 10) {
                ForEach(d.knapper) { k in
                    Button(action: { m.trykk("br-svar", ["v": k.id]) }) {
                        Text(k.tekst.uppercased()).font(.archivo(fire ? 30 : 24, vekt: 900)).lineLimit(1).minimumScaleFactor(0.6)
                            .frame(maxWidth: .infinity).frame(minHeight: 96)
                            .foregroundColor(k.stil == "svart" ? lys : k.stil.contains("rod") ? kortRod : morkBlekk)
                            .background(RoundedRectangle(cornerRadius: 10).fill(k.stil == "svart" ? morkBlekk : k.stil == "rosa" ? rosa : k.stil == "mint" ? mint : k.stil == "gul" ? gul : Color.white))
                            .overlay(RoundedRectangle(cornerRadius: 10).stroke(morkBlekk, lineWidth: 4))
                            .background(RoundedRectangle(cornerRadius: 10).fill(morkBlekk).offset(x: 5, y: 5))
                    }.buttonStyle(.plain)
                }
            }.padding(.trailing, 5).padding(.bottom, 5)
        }
    }

    // MARK: Fase 2 – pyramiden snus nedenfra, treffene, og hånda di
    @ViewBuilder private func pyramiden(_ d: BrData) -> some View {
        VStack(spacing: 6) {
            ForEach(Array(d.pyr.enumerated().reversed()), id: \.offset) { _, rad in
                HStack(spacing: 6) { ForEach(rad) { k in spillkort(k, w: 44, h: 62) } }
            }
        }.frame(maxWidth: .infinity)
        if !d.treff.isEmpty { svarLapp(["tittel": d.treff, "ok": true]) }
        Text(d.etikett.uppercased()).font(.archivo(11, vekt: 900)).opacity(0.6)
        if !d.hand.isEmpty { vifte(d.hand, w: 48, h: 68) }
    }

    // MARK: Fase 3 – veien, stoppene og bussen
    @ViewBuilder private func bussen(_ d: BrData) -> some View {
        Text(d.hjelp).font(.archivo(14, vekt: 600)).opacity(0.75).fixedSize(horizontal: false, vertical: true)
        GeometryReader { g in
            let steg = (g.size.width - 90) / CGFloat(max(1, d.maal))
            ZStack(alignment: .leading) {
                RoundedRectangle(cornerRadius: 12).fill(asfalt)
                RoundedRectangle(cornerRadius: 12).stroke(morkBlekk, lineWidth: 3)
                // midtstripen
                HStack(spacing: 10) { ForEach(0..<12, id: \.self) { _ in Rectangle().fill(gul.opacity(0.8)).frame(width: 18, height: 3) } }.padding(.leading, 12).offset(y: 22)
                // stoppene
                ForEach(0...d.maal, id: \.self) { j in
                    Circle().fill(j <= d.rekke ? mint : lys.opacity(0.3)).overlay(Circle().stroke(morkBlekk, lineWidth: 2)).frame(width: 14, height: 14)
                        .offset(x: 20 + CGFloat(j) * steg, y: 40)
                }
                buss().offset(x: 6 + CGFloat(d.rekke) * steg, y: -8)
                    .animation(.spring(response: 0.6, dampingFraction: 0.75), value: d.rekke)
            }
        }
        .frame(height: 110)
        svarLapp(d.buss)
        if !d.kjor.isEmpty {
            Button(action: { m.trykk("br-kjor") }) {
                HStack(spacing: 12) {
                    ZStack {
                        RoundedRectangle(cornerRadius: 6).fill(kortRod).frame(width: 34, height: 46).offset(x: 4, y: -4)
                        RoundedRectangle(cornerRadius: 6).fill(kortRod).frame(width: 34, height: 46).overlay(RoundedRectangle(cornerRadius: 6).stroke(morkBlekk, lineWidth: 2.5))
                    }
                    Text(d.kjor.uppercased()).font(.archivo(20, vekt: 900))
                }
                .frame(maxWidth: .infinity).frame(height: 68).foregroundColor(morkBlekk)
                .background(RoundedRectangle(cornerRadius: 14).fill(gul)).overlay(RoundedRectangle(cornerRadius: 14).stroke(morkBlekk, lineWidth: 3))
                .background(RoundedRectangle(cornerRadius: 14).fill(morkBlekk).offset(x: 4, y: 4))
            }.buttonStyle(.plain)
        } else if !d.vent.isEmpty && !d.ferdig {
            Text(d.vent).font(.archivo(14, vekt: 600)).opacity(0.7)
        }
    }

    /// Bussen: en liten gul buss med vinduer og hjul
    private func buss() -> some View {
        ZStack {
            RoundedRectangle(cornerRadius: 8).fill(gul).frame(width: 64, height: 34).overlay(RoundedRectangle(cornerRadius: 8).stroke(morkBlekk, lineWidth: 2.5))
            HStack(spacing: 4) { ForEach(0..<3, id: \.self) { _ in RoundedRectangle(cornerRadius: 2).fill(Color(red: 0.49, green: 0.78, blue: 1)).frame(width: 12, height: 11) } }.offset(y: -5)
            HStack(spacing: 28) { Circle().fill(morkBlekk).frame(width: 12, height: 12); Circle().fill(morkBlekk).frame(width: 12, height: 12) }.offset(y: 17)
        }
        .frame(width: 70, height: 50)
    }
}
