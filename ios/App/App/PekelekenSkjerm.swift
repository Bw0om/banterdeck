import SwiftUI
import UIKit
import WebKit

/// Pekeleken som native skjerm: kortet, nedtellingen 3 · 2 · 1 · PEK!, «hvor mange pekte på deg?», forsvarstalen og resultatet.
/// Nettsiden under holder tilstanden, lyden og vibrasjonen og regner ut alle tekstene (rom.js pkData) – denne skjermen tegner,
/// og trykkene går tilbake til nettsidens egne knapper (window.__mvLek.trykk).
struct PekSpiller: Identifiable { let id: String, navn: String, meg: Bool, farge: String, init_: String }

struct PekData {
    let fase: String, kan: Bool, duo: Bool, start: Double, tell: Double, naa: Double
    let toppKort: String, toppLeser: String, jegLeser: Bool
    let pre: String, tekst: String, vriNavn: String, vriTekst: String
    let spillere: [PekSpiller], pek: String, stua: String, mer: String
    let klar: [String: Any], fingre: [String: Any], forsvar: [String: Any], resultat: [String: Any]

    init(_ d: [String: Any]) {
        fase = d["fase"] as? String ?? ""; kan = d["kan"] as? Bool ?? false; duo = d["duo"] as? Bool ?? false
        start = (d["start"] as? NSNumber)?.doubleValue ?? 0; tell = (d["tell"] as? NSNumber)?.doubleValue ?? 2400; naa = (d["naa"] as? NSNumber)?.doubleValue ?? 0
        let t = d["topp"] as? [String: Any] ?? [:]
        toppKort = t["kort"] as? String ?? ""; toppLeser = t["leser"] as? String ?? ""; jegLeser = t["jegLeser"] as? Bool ?? false
        let k = d["kort"] as? [String: Any] ?? [:]
        pre = k["pre"] as? String ?? ""; tekst = k["tekst"] as? String ?? ""; vriNavn = k["vriNavn"] as? String ?? ""; vriTekst = k["vriTekst"] as? String ?? ""
        spillere = (d["spillere"] as? [[String: Any]] ?? []).compactMap { p in
            guard let id = p["id"] as? String else { return nil }
            return PekSpiller(id: id, navn: p["navn"] as? String ?? "", meg: p["meg"] as? Bool ?? false, farge: p["farge"] as? String ?? "#FFD23F", init_: p["init"] as? String ?? "")
        }
        pek = d["pek"] as? String ?? "Pek!"; stua = d["stua"] as? String ?? "Stua"; mer = d["mer"] as? String ?? "Mer"
        klar = d["klar"] as? [String: Any] ?? [:]; fingre = d["fingre"] as? [String: Any] ?? [:]
        forsvar = d["forsvar"] as? [String: Any] ?? [:]; resultat = d["resultat"] as? [String: Any] ?? [:]
    }
}

final class PekModell: ObservableObject {
    @Published var d: PekData? = nil
    /// Forskjellen mellom telefonens klokke og serverens (fra siste melding), så nedtellingen går i takt på alle telefonene
    private(set) var avvik: Double = 0
    weak var nett: WKWebView?

    func sett(_ dict: [String: Any]) {
        let ny = PekData(dict)
        if ny.naa > 0 { avvik = ny.naa - Date().timeIntervalSince1970 * 1000 }
        d = ny
    }
    /// Millisekunder siden nedtellingen startet (servertid)
    func tid() -> Double { (Date().timeIntervalSince1970 * 1000 + avvik) - (d?.start ?? 0) }

    func trykk(_ g: String, _ attrs: [String: String] = [:]) {
        UIImpactFeedbackGenerator(style: .light).impactOccurred()
        guard let data = try? JSONSerialization.data(withJSONObject: [g, attrs]), let json = String(data: data, encoding: .utf8) else { return }
        nett?.evaluateJavaScript("window.__mvLek && window.__mvLek.trykk.apply(null, \(json))", completionHandler: nil)
    }
}

struct PekelekenSkjerm: View {
    @ObservedObject var m: PekModell
    @Environment(\.colorScheme) private var modus
    private var papir: Color { modus == .dark ? Color(red: 0.11, green: 0.106, blue: 0.122) : Color(red: 1, green: 0.973, blue: 0.933) }
    private var kort: Color { modus == .dark ? Color(red: 0.173, green: 0.169, blue: 0.188) : .white }
    private var blekk: Color { modus == .dark ? Color(red: 1, green: 0.973, blue: 0.933) : Color(red: 0.086, green: 0.071, blue: 0.059) }
    private let gul = Color(red: 1, green: 0.824, blue: 0.247)
    private let oransje = Color(red: 1, green: 0.357, blue: 0.122)
    private let rust = Color(red: 0.776, green: 0.235, blue: 0.067)
    private let mint = Color(red: 0.388, green: 0.886, blue: 0.659)
    private let morkBlekk = Color(red: 0.086, green: 0.071, blue: 0.059)

    var body: some View {
        ZStack {
            papir.ignoresSafeArea()
            if let d = m.d {
                VStack(spacing: 0) {
                    topp(d)
                    VStack(alignment: .leading, spacing: 14) {
                            kortet(d)
                            switch d.fase {
                            case "klar": klar(d)
                            case "teller": teller(d)
                            case "forsvar": forsvar(d)
                            default: resultat(d)
                            }
                            Spacer(minLength: 0)
                        }.padding(.horizontal, 16).padding(.bottom, 12)
                }
            }
        }
        .foregroundColor(blekk)
        .animation(.easeOut(duration: 0.2), value: m.d?.fase)
    }

    // Toppen: kort nr, hvem som leser, og veien til stua og «Mer»
    private func topp(_ d: PekData) -> some View {
        HStack(spacing: 8) {
            VStack(alignment: .leading, spacing: 1) {
                Text(d.toppKort).font(.archivo(12, vekt: 700)).opacity(0.65)
                Text(d.toppLeser).font(.archivo(16, vekt: 900)).foregroundColor(d.jegLeser ? rust : blekk)
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

    // Kortet: «Hvem er mest sannsynlig til å …» lite, selve setningen stort, vri-merke om det er en vri
    private func kortet(_ d: PekData) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            if !d.vriNavn.isEmpty {
                Text(d.vriNavn.uppercased()).font(.archivo(12, vekt: 900)).padding(.horizontal, 10).padding(.vertical, 5)
                    .background(Capsule().fill(oransje)).foregroundColor(morkBlekk)
            }
            if !d.pre.isEmpty { Text(d.pre).font(.archivo(15, vekt: 700)).opacity(0.6) }
            Text(d.tekst).font(.archivo(d.tekst.count > 70 ? 24 : 30, vekt: 900)).lineSpacing(2).fixedSize(horizontal: false, vertical: true)
            if !d.vriTekst.isEmpty { Text(d.vriTekst).font(.archivo(14, vekt: 500)).opacity(0.75) }
        }
        .padding(18).frame(maxWidth: .infinity, alignment: .leading)
        .background(RoundedRectangle(cornerRadius: 18).fill(kort))
        .overlay(RoundedRectangle(cornerRadius: 18).stroke(blekk, lineWidth: 3))
        .background(RoundedRectangle(cornerRadius: 18).fill(Color.black).offset(x: 5, y: 5))
    }

    @ViewBuilder private func klar(_ d: PekData) -> some View {
        if let k = d.klar["knapp"] as? String, !k.isEmpty { stor(k) { m.trykk("pek-start") } }
        Text(d.klar["vent"] as? String ?? "").font(.archivo(15, vekt: 500)).opacity(0.75)
        hoder(d)
    }

    // Nedtellingen: 3 · 2 · 1 à 800 ms, så PEK! – i takt med alle de andre telefonene (servertid)
    @ViewBuilder private func teller(_ d: PekData) -> some View {
        TimelineView(.periodic(from: .now, by: 0.05)) { _ in
            let t = m.tid()
            let trinn = t < 800 ? 3 : t < 1600 ? 2 : t < d.tell ? 1 : 0
            if t <= d.tell + 1400 {
                ZStack {
                    RoundedRectangle(cornerRadius: 22).fill(trinn == 0 ? oransje : gul)
                    RoundedRectangle(cornerRadius: 22).stroke(morkBlekk, lineWidth: 3)
                    if trinn > 0 {
                        Text("\(trinn)").font(.archivo(140, vekt: 900)).foregroundColor(morkBlekk).id(trinn).transition(.scale(scale: 1.4).combined(with: .opacity))
                    } else {
                        VStack(spacing: 6) {
                            Image(systemName: "hand.point.right.fill").font(.system(size: 70, weight: .bold))
                            Text(d.pek.uppercased()).font(.archivo(44, vekt: 900))
                        }.foregroundColor(morkBlekk)
                    }
                }
                .frame(height: 260).animation(.spring(response: 0.25, dampingFraction: 0.6), value: trinn)
            } else {
                fingre(d)
            }
        }
    }

    // «Hvor mange pekte på deg?»
    @ViewBuilder private func fingre(_ d: PekData) -> some View {
        let f = d.fingre
        let maks = f["maks"] as? Int ?? 1, mine = f["mine"] as? Int ?? -1, pluss = f["pluss"] as? Bool ?? false
        VStack(alignment: .leading, spacing: 12) {
            Text(f["sporsmal"] as? String ?? "").font(.archivo(20, vekt: 900))
            HStack(spacing: 8) {
                ForEach(0...maks, id: \.self) { n in
                    Button(action: { m.trykk("pek-fingre", ["n": String(n)]) }) {
                        Text(n == maks && pluss ? "\(n)+" : "\(n)").font(.archivo(22, vekt: 900))
                            .frame(maxWidth: .infinity).frame(height: 56)
                            .background(RoundedRectangle(cornerRadius: 12).fill(mine == n ? gul : kort))
                            .overlay(RoundedRectangle(cornerRadius: 12).stroke(blekk, lineWidth: mine == n ? 3 : 2))
                            .foregroundColor(mine == n ? morkBlekk : blekk)
                    }.buttonStyle(.plain)
                }
            }
            if let s = f["selv"] as? [String: Any], let t = s["tekst"] as? String {
                let av = s["av"] as? Bool ?? false
                Button(action: { if !av { m.trykk("pek-selv") } }) {
                    Text(t).font(.archivo(15, vekt: 800)).padding(.horizontal, 14).frame(height: 44)
                        .background(Capsule().fill(av ? mint.opacity(0.5) : mint)).overlay(Capsule().stroke(morkBlekk, lineWidth: 2)).foregroundColor(morkBlekk)
                }.buttonStyle(.plain).disabled(av)
            }
            Text(f["venter"] as? String ?? "").font(.archivo(14, vekt: 500)).opacity(0.7)
            if let v = f["videre"] as? String, !v.isEmpty {
                Button(action: { m.trykk("pek-tell-ferdig") }) { Text(v).font(.archivo(14, vekt: 700)).underline() }.buttonStyle(.plain).opacity(0.75)
            }
        }
    }

    // Forsvarstalen: 15 sekunder
    @ViewBuilder private func forsvar(_ d: PekData) -> some View {
        let f = d.forsvar
        VStack(alignment: .leading, spacing: 10) {
            piller(d, f["topp"] as? [String] ?? [])
            Text(f["tittel"] as? String ?? "").font(.archivo(22, vekt: 900))
            Text(f["tekst"] as? String ?? "").font(.archivo(15, vekt: 500)).opacity(0.8)
            TimelineView(.periodic(from: .now, by: 1)) { _ in
                let igjen = max(0, (f["igjen"] as? Int ?? 15) - Int(Date().timeIntervalSince(startet)))
                HStack(spacing: 10) {
                    GeometryReader { g in
                        ZStack(alignment: .leading) {
                            Capsule().fill(blekk.opacity(0.15))
                            Capsule().fill(oransje).frame(width: g.size.width * CGFloat(igjen) / 15)
                        }
                    }.frame(height: 12)
                    Text("\(igjen) s").font(.archivo(15, vekt: 900)).frame(width: 44, alignment: .trailing)
                }
            }
            if f["kan"] as? Bool == true {
                HStack(spacing: 10) {
                    stor(f["slapp"] as? String ?? "Slapp unna", farge: mint) { m.trykk("pek-forsvar", ["slapp": "1"]) }
                    stor(f["drikk"] as? String ?? "Drikk", farge: oransje) { m.trykk("pek-forsvar", ["slapp": "0"]) }
                }
            }
        }
        .padding(16).background(RoundedRectangle(cornerRadius: 16).fill(kort)).overlay(RoundedRectangle(cornerRadius: 16).stroke(blekk, lineWidth: 2.5))
    }
    private let startet = Date()

    // Resultatet: hvem som fikk flest fingre, søylene, og «Neste kort»
    @ViewBuilder private func resultat(_ d: PekData) -> some View {
        let r = d.resultat
        let drikk = r["drikk"] as? Bool ?? false
        VStack(alignment: .leading, spacing: 10) {
            piller(d, r["topp"] as? [String] ?? [])
            Text(r["tittel"] as? String ?? "").font(.archivo(24, vekt: 900))
            if let l = r["linje"] as? String, !l.isEmpty { Text(l).font(.archivo(15, vekt: 600)).opacity(0.8) }
            if let mk = r["merk"] as? String, !mk.isEmpty { Text(mk).font(.archivo(14, vekt: 700)).foregroundColor(rust) }
        }
        .padding(16).frame(maxWidth: .infinity, alignment: .leading)
        .background(RoundedRectangle(cornerRadius: 16).fill(drikk ? oransje : mint))
        .overlay(RoundedRectangle(cornerRadius: 16).stroke(morkBlekk, lineWidth: 2.5))
        .foregroundColor(morkBlekk)

        let rader = r["rader"] as? [[String: Any]] ?? []
        if !rader.isEmpty {
            VStack(spacing: 8) {
                ForEach(Array(rader.enumerated()), id: \.offset) { _, x in
                    HStack(spacing: 10) {
                        Text(x["navn"] as? String ?? "").font(.archivo(15, vekt: 800)).frame(width: 90, alignment: .leading).lineLimit(1)
                        GeometryReader { g in
                            ZStack(alignment: .leading) {
                                Capsule().fill(blekk.opacity(0.12))
                                Capsule().fill(Color(hex: x["farge"] as? String ?? "#FFD23F")).frame(width: max(8, g.size.width * CGFloat((x["andel"] as? NSNumber)?.doubleValue ?? 0)))
                                    .overlay(Capsule().stroke(morkBlekk, lineWidth: 1.5))
                            }
                        }.frame(height: 18)
                        Text("\(x["n"] as? Int ?? 0)").font(.archivo(15, vekt: 900)).frame(width: 26, alignment: .trailing)
                    }
                }
            }
        }
        if let v = r["videre"] as? String, !v.isEmpty { stor(v) { m.trykk("neste", ["pos": String(r["pos"] as? Int ?? 0)]) } }
        else if let w = r["vent"] as? String, !w.isEmpty { Text(w).font(.archivo(15, vekt: 500)).opacity(0.75) }
    }

    // Spillerne som små fargede merker (den som er pekt på får en ring)
    private func piller(_ d: PekData, _ ider: [String]) -> some View {
        HStack(spacing: 6) {
            ForEach(d.spillere.filter { ider.contains($0.id) }) { p in
                Text(p.init_).font(.archivo(13, vekt: 900)).frame(width: 34, height: 34)
                    .background(Circle().fill(Color(hex: p.farge))).overlay(Circle().stroke(morkBlekk, lineWidth: 2)).foregroundColor(morkBlekk)
            }
        }
    }
    private func hoder(_ d: PekData) -> some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(d.spillere) { p in
                    HStack(spacing: 6) {
                        Text(p.init_).font(.archivo(12, vekt: 900)).frame(width: 28, height: 28).background(Circle().fill(Color(hex: p.farge))).overlay(Circle().stroke(morkBlekk, lineWidth: 1.5)).foregroundColor(morkBlekk)
                        Text(p.navn).font(.archivo(13, vekt: p.meg ? 900 : 600)).lineLimit(1)
                    }.padding(.trailing, 6)
                }
            }
        }.padding(.top, 4)
    }

    private func stor(_ tekst: String, farge: Color? = nil, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(tekst.uppercased()).font(.archivo(18, vekt: 900)).tracking(0.3).lineLimit(2).minimumScaleFactor(0.7)
                .frame(maxWidth: .infinity).frame(height: 60).foregroundColor(morkBlekk).padding(.horizontal, 8)
                .background(ZStack {
                    RoundedRectangle(cornerRadius: 14).fill(morkBlekk).offset(x: 4, y: 4)
                    RoundedRectangle(cornerRadius: 14).fill(farge ?? gul)
                    RoundedRectangle(cornerRadius: 14).stroke(morkBlekk, lineWidth: 3)
                })
        }.buttonStyle(.plain)
    }
}
