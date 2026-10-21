import SwiftUI
import UIKit
import WebKit

/// «Figuren din» som et iOS-ark: velg hva figuren har på hodet, frisyre og farger, briller, genser, kjæledyr og bevegelse.
/// Arket står halvveis oppe, så figuren i stua bak endres med en gang. Bildene av hvert valg lages av nettsiden
/// (window.__mvFigur, SVG → PNG), og valgene lagres der – så alt låses opp og huskes som før.
struct FigurTing: Identifiable {
    let id: String, slot: String, navn: String, kan: Bool, har: Bool, laas: String
    let bilde: UIImage?
    init?(_ d: [String: Any]) {
        guard let id = d["id"] as? String, let slot = d["slot"] as? String else { return nil }
        self.id = id; self.slot = slot
        self.navn = d["navn"] as? String ?? id
        self.kan = d["kan"] as? Bool ?? false; self.har = d["har"] as? Bool ?? false
        self.laas = d["laas"] as? String ?? ""
        self.bilde = FigurData.bilde(d["png"] as? String)
    }
}

struct FigurBilde: Identifiable {
    let id: String, navn: String, bilde: UIImage?
}

struct FigurData {
    let inne: Bool, kvelder: Int
    let valgt: [String: String], naa: [String: String]
    let slots: [(id: String, navn: String)]
    let ting: [FigurTing], frisyrer: [FigurBilde], skjegg: [FigurBilde]
    let farger: [String: [String]], fargenavn: [String: String], fargbar: [String: String]
    let konto: String, tekst: [String: String]

    static func bilde(_ b64: String?) -> UIImage? {
        guard let b = b64, !b.isEmpty, let data = Data(base64Encoded: b) else { return nil }
        return UIImage(data: data, scale: 2)
    }

    init(_ d: [String: Any]) {
        inne = d["inne"] as? Bool ?? false; kvelder = d["kvelder"] as? Int ?? 0
        valgt = d["valgt"] as? [String: String] ?? [:]; naa = d["naa"] as? [String: String] ?? [:]
        slots = (d["slots"] as? [[String: Any]] ?? []).compactMap { s in
            guard let id = s["id"] as? String else { return nil }
            return (id: id, navn: s["navn"] as? String ?? id)
        }
        ting = (d["ting"] as? [[String: Any]] ?? []).compactMap(FigurTing.init)
        let bilder: ([[String: Any]]) -> [FigurBilde] = { liste in
            liste.compactMap { x in
                guard let id = x["id"] as? String else { return nil }
                return FigurBilde(id: id, navn: x["navn"] as? String ?? id, bilde: FigurData.bilde(x["png"] as? String))
            }
        }
        frisyrer = bilder(d["frisyrer"] as? [[String: Any]] ?? [])
        skjegg = bilder(d["skjegg"] as? [[String: Any]] ?? [])
        farger = d["farger"] as? [String: [String]] ?? [:]
        fargenavn = d["fargenavn"] as? [String: String] ?? [:]
        fargbar = d["fargbar"] as? [String: String] ?? [:]
        konto = d["konto"] as? String ?? "/no/account#signin"
        tekst = d["tekst"] as? [String: String] ?? [:]
    }
    func t(_ k: String) -> String { tekst[k] ?? k }
}

final class FigurModell: ObservableObject {
    @Published var d: FigurData? = nil
    @Published var slot = "hode"
    @Published var lapp: String? = nil
    @Published var travel = false
    weak var nett: WKWebView?
    var loggInn: ((String) -> Void)?
    private var lappT: Timer?

    func last() { kall("return await window.__mvFigur.data()", [:]) }
    func velg(_ e: [String: Any]) {
        UIImpactFeedbackGenerator(style: .light).impactOccurred()
        kall("return await window.__mvFigur.velg(e)", ["e": e])
    }
    func visLapp(_ t: String) {
        lapp = t; lappT?.invalidate()
        lappT = Timer.scheduledTimer(withTimeInterval: 2.6, repeats: false) { [weak self] _ in self?.lapp = nil }
    }
    private func kall(_ js: String, _ arg: [String: Any]) {
        guard let w = nett else { return }
        travel = true
        w.callAsyncJavaScript(js, arguments: arg, in: nil, in: .page) { [weak self] res in
            DispatchQueue.main.async {
                self?.travel = false
                if case .success(let v) = res, let dict = v as? [String: Any] { self?.d = FigurData(dict) }
            }
        }
    }
}

struct FigurArk: View {
    @ObservedObject var m: FigurModell
    @Environment(\.colorScheme) private var modus
    private var papir: Color { modus == .dark ? Color(red: 0.11, green: 0.106, blue: 0.122) : Color(red: 1, green: 0.973, blue: 0.933) }
    private var kort: Color { modus == .dark ? Color(red: 0.173, green: 0.169, blue: 0.188) : .white }
    private var blekk: Color { modus == .dark ? Color(red: 1, green: 0.973, blue: 0.933) : Color(red: 0.086, green: 0.071, blue: 0.059) }
    private let gul = Color(red: 1, green: 0.824, blue: 0.247)
    private let rust = Color(red: 0.776, green: 0.235, blue: 0.067)
    private let morkBlekk = Color(red: 0.086, green: 0.071, blue: 0.059)
    private let kolonner = [GridItem(.adaptive(minimum: 72), spacing: 10)]

    var body: some View {
        VStack(spacing: 0) {
            Capsule().fill(blekk.opacity(0.25)).frame(width: 36, height: 5).padding(.top, 8)
            if let d = m.d {
                HStack {
                    Text(d.t("tittel")).font(.archivo(22, vekt: 900))
                    Spacer()
                    if m.travel { ProgressView().scaleEffect(0.8) }
                }.padding(.horizontal, 20).padding(.top, 10)
                deler(d)
                ScrollView {
                    VStack(alignment: .leading, spacing: 14) {
                        if let l = m.lapp {
                            Text(l).font(.archivo(15, vekt: 700)).padding(12).frame(maxWidth: .infinity, alignment: .leading)
                                .background(RoundedRectangle(cornerRadius: 12).fill(gul)).foregroundColor(morkBlekk)
                                .transition(.opacity)
                        }
                        innhold(d)
                        fot(d)
                    }
                    .padding(.horizontal, 20).padding(.vertical, 14)
                }
            } else {
                Spacer()
                ProgressView()
                Spacer()
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(papir.ignoresSafeArea())
        .foregroundColor(blekk)
        .animation(.easeOut(duration: 0.18), value: m.lapp)
        .onAppear { if m.d == nil { m.last() } }
    }

    /// Fanene: På hodet · Deg · Briller · Genser · Kjæledyr · Bevegelse
    private func deler(_ d: FigurData) -> some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(d.slots, id: \.id) { s in
                    Button(action: { m.slot = s.id; m.lapp = nil; UISelectionFeedbackGenerator().selectionChanged() }) {
                        Text(s.navn).font(.archivo(15, vekt: 800))
                            .padding(.horizontal, 14).padding(.vertical, 8)
                            .background(Capsule().fill(m.slot == s.id ? gul : kort))
                            .overlay(Capsule().stroke(blekk, lineWidth: m.slot == s.id ? 2.5 : 1.5))
                            .foregroundColor(m.slot == s.id ? morkBlekk : blekk)
                    }.buttonStyle(.plain)
                }
            }.padding(.horizontal, 20).padding(.vertical, 12)
        }
    }

    @ViewBuilder private func innhold(_ d: FigurData) -> some View {
        if m.slot == "deg" {
            etikett(d.t("frisyre"))
            LazyVGrid(columns: kolonner, spacing: 10) {
                ForEach(d.frisyrer) { f in rute(bilde: f.bilde, navn: nil, paa: d.naa["haar"] == f.id, laast: false) { m.velg(["haar": f.id]) } }
            }
            prikker(d, "fh", valgt: d.naa["h"] ?? "")
            prikker(d, "fhud", valgt: d.naa["hud"] ?? "")
            etikett(d.t("skjegg"))
            LazyVGrid(columns: kolonner, spacing: 10) {
                ForEach(d.skjegg) { f in rute(bilde: f.bilde, navn: nil, paa: (d.naa["skjegg"] ?? "ingen") == f.id, laast: false) { m.velg(["skjegg": f.id]) } }
            }
        } else {
            if m.slot == "bryst" { prikker(d, "ftopp", valgt: d.naa["topp"] ?? "") }
            LazyVGrid(columns: kolonner, spacing: 10) {
                if m.slot != "beveg" {
                    rute(bilde: nil, navn: d.t("ingenting"), paa: d.valgt[m.slot] == nil, laast: false) { m.velg(["slot": m.slot, "id": ""]) }
                }
                ForEach(d.ting.filter { $0.slot == m.slot }) { x in
                    rute(bilde: x.bilde, navn: m.slot == "beveg" ? x.navn : nil, paa: d.valgt[m.slot] == x.id, laast: !x.kan) {
                        if !x.kan {
                            if !d.inne { m.loggInn?(d.konto) } else { m.visLapp(x.navn + ": " + x.laas) }
                        } else { m.velg(["slot": m.slot, "id": x.id]) }
                    }
                }
            }
            if m.slot == "hode", let hatt = d.valgt["hode"], let std = d.fargbar[hatt] {
                prikker(d, "fhode", valgt: d.valgt["fhode"] ?? std)
            }
        }
    }

    private func etikett(_ t: String) -> some View { Text(t).font(.archivo(13, vekt: 800)).opacity(0.7) }

    /// En rute i rutenettet: bilde (eller navn), gul ramme når den er på, hengelås når den er låst
    private func rute(bilde: UIImage?, navn: String?, paa: Bool, laast: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            ZStack {
                RoundedRectangle(cornerRadius: 14).fill(paa ? gul.opacity(0.35) : kort)
                RoundedRectangle(cornerRadius: 14).stroke(paa ? gul : blekk.opacity(0.25), lineWidth: paa ? 3 : 1.5)
                VStack(spacing: 4) {
                    if let b = bilde { Image(uiImage: b).resizable().aspectRatio(contentMode: .fit).frame(height: navn == nil ? 52 : 40) }
                    else if navn != nil && m.slot != "beveg" { Image(systemName: "circle.slash").font(.system(size: 26, weight: .light)).opacity(0.5) }
                    if let n = navn { Text(n).font(.archivo(12, vekt: 700)).lineLimit(1).minimumScaleFactor(0.7) }
                }.padding(6).opacity(laast ? 0.45 : 1)
                if laast {
                    Image(systemName: "lock.fill").font(.system(size: 12, weight: .bold)).padding(5).background(Circle().fill(gul)).foregroundColor(morkBlekk)
                        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topTrailing).padding(5)
                }
            }
            .frame(height: 76)
        }.buttonStyle(.plain)
    }

    /// Fargeprikker (hår, hud, genser, hatt)
    private func prikker(_ d: FigurData, _ k: String, valgt: String) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            etikett(d.fargenavn[k] ?? k)
            HStack(spacing: 10) {
                ForEach(d.farger[k] ?? [], id: \.self) { f in
                    Button(action: { m.velg(["farge": k, "verdi": f]) }) {
                        Circle().fill(Color(hex: f)).frame(width: 30, height: 30)
                            .overlay(Circle().stroke(blekk, lineWidth: f.lowercased() == valgt.lowercased() ? 3.5 : 1.5))
                            .overlay(Circle().stroke(gul, lineWidth: f.lowercased() == valgt.lowercased() ? 2 : 0).padding(3))
                    }.buttonStyle(.plain)
                }
            }
        }
    }

    @ViewBuilder private func fot(_ d: FigurData) -> some View {
        if !d.inne {
            VStack(alignment: .leading, spacing: 8) {
                Text(d.t("gjest")).font(.archivo(14, vekt: 500)).opacity(0.75)
                HStack(spacing: 10) {
                    Button(action: { m.loggInn?(d.konto) }) { Text(d.t("loggInn").uppercased()).font(.archivo(14, vekt: 900)).padding(.horizontal, 16).padding(.vertical, 10).background(RoundedRectangle(cornerRadius: 10).fill(gul)).overlay(RoundedRectangle(cornerRadius: 10).stroke(morkBlekk, lineWidth: 2.5)).foregroundColor(morkBlekk) }.buttonStyle(.plain)
                    Button(action: { m.loggInn?(d.konto) }) { Text(d.t("nyKonto").uppercased()).font(.archivo(14, vekt: 900)).padding(.horizontal, 16).padding(.vertical, 10).overlay(RoundedRectangle(cornerRadius: 10).stroke(blekk, lineWidth: 2.5)) }.buttonStyle(.plain)
                }
            }.padding(.top, 6)
        } else if m.slot == "beveg" {
            Text(d.t("beveg")).font(.archivo(13, vekt: 500)).opacity(0.7)
        } else if m.slot != "deg" {
            let alle = d.ting.filter { $0.slot == m.slot }, har = alle.filter { $0.har }.count
            Text("\(har) \(d.t("av")) \(alle.count) \(d.t("laastOpp")) · \(d.kvelder) \(d.kvelder == 1 ? d.t("kveld") : d.t("kvelder"))").font(.archivo(13, vekt: 500)).opacity(0.7)
        }
    }
}

extension Color {
    /// «#FFD23F» → Color
    init(hex: String) {
        var s = hex.trimmingCharacters(in: .whitespacesAndNewlines); if s.hasPrefix("#") { s.removeFirst() }
        var v: UInt64 = 0; Scanner(string: s).scanHexInt64(&v)
        let r = Double((v >> 16) & 0xFF) / 255, g = Double((v >> 8) & 0xFF) / 255, b = Double(v & 0xFF) / 255
        self.init(red: r, green: g, blue: b)
    }
}
