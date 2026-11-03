import SwiftUI
import UIKit
import WebKit

/// Gjengene native: lista over gjengene dine, og én gjeng med kvelden, lovboka, formuen, kåringene og sesongtabellen.
/// Nettsiden (Gjeng.astro) regner ut alt og sender det ferdig (mv-skjerm «gjeng»); trykkene går tilbake via window.__mvGjeng
/// og svarer {ok, melding}. Varslene (nettpush) finnes ikke i appen – den raden er utelatt her.
struct GjMine: Identifiable {
    let id: String   // koden
    let navn: String, kvelder: Int, eier: Bool
    init?(_ d: [String: Any]) {
        guard let k = d["kode"] as? String, let n = d["navn"] as? String else { return nil }
        id = k; navn = n; kvelder = d["kvelder"] as? Int ?? 0; eier = d["eier"] as? Bool ?? false
    }
}

struct GjRegel: Identifiable {
    let id: String, tekst: String, av: String, harStemt: Bool, stemmer: Int, trengs: Int
    init(_ d: [String: Any]) {
        id = d["id"] as? String ?? UUID().uuidString; tekst = d["tekst"] as? String ?? ""; av = d["av"] as? String ?? ""
        harStemt = d["harStemt"] as? Bool ?? false; stemmer = d["stemmer"] as? Int ?? 0; trengs = d["trengs"] as? Int ?? 0
    }
}

struct GjUtsatt: Identifiable {
    let id: String, q: String, melderNavn: String, utfallNavn: String, ja: Int, nei: Int, timer: Int, aksjonaerer: Int, kanStemme: Bool, minStemme: String
    init(_ d: [String: Any]) {
        id = (d["id"] as? String) ?? (d["id"] as? Int).map(String.init) ?? UUID().uuidString
        q = d["q"] as? String ?? ""; melderNavn = d["melderNavn"] as? String ?? ""; utfallNavn = d["utfallNavn"] as? String ?? ""
        ja = d["ja"] as? Int ?? 0; nei = d["nei"] as? Int ?? 0; timer = d["timer"] as? Int ?? 0; aksjonaerer = d["aksjonaerer"] as? Int ?? 0
        kanStemme = d["kanStemme"] as? Bool ?? false; minStemme = d["minStemme"] as? String ?? ""
    }
}

struct GjRad: Identifiable {
    let id: Int
    let navn: String, form: String, kvelder: Int, slurker: Int, snitt: String, seire: Int, quiz: Int
}

struct GjKveld: Identifiable {
    let id: Int, dato: String, info: String, topp: String, resten: String
}

struct GjGjeng {
    let id: String, kode: String, navn: String, eier: Bool, medlem: Bool, ny: Bool
    let kveld: (vert: String, antall: Int, plan: String, erMed: Bool)?
    let utsatte: [GjUtsatt]
    let meg: (saldo: String, kvelder: Int, navn: String)?
    let formue: [(navn: String, saldo: String, meg: Bool)]
    let sesongAar: String, aarskonger: String
    let lovKvelder: Int
    let ventende: (minTur: Bool, navn: String)?
    let aktive: [GjRegel], fjernet: [GjRegel]
    let rekorder: [(ikon: String, tittel: String, navn: String, n: Int, enhet: String, flere: String)]
    let logg: [(dato: String, tekst: String)]
    let sesonger: [String], sesong: String, sorter: String
    let tall: [(b: String, s: String)]
    let kaaringer: [(i: String, t: String, n: String, v: String)]
    let tabell: [GjRad]
    let kvelder: [GjKveld]
    let harLovbok: Bool

    init(_ d: [String: Any]) {
        id = (d["id"] as? String) ?? (d["id"] as? Int).map(String.init) ?? ""
        kode = d["kode"] as? String ?? ""; navn = d["navn"] as? String ?? ""
        eier = d["eier"] as? Bool ?? false; medlem = d["medlem"] as? Bool ?? false; ny = d["ny"] as? Bool ?? false
        if let k = d["kveld"] as? [String: Any] { kveld = (k["vert"] as? String ?? "", k["antall"] as? Int ?? 0, k["plan"] as? String ?? "", k["erMed"] as? Bool ?? false) } else { kveld = nil }
        utsatte = (d["utsatte"] as? [[String: Any]] ?? []).map(GjUtsatt.init)
        if let m = d["meg"] as? [String: Any] { meg = (m["saldo"] as? String ?? "", m["kvelder"] as? Int ?? 0, m["navn"] as? String ?? "") } else { meg = nil }
        formue = (d["formue"] as? [[String: Any]] ?? []).map { ($0["navn"] as? String ?? "", $0["saldo"] as? String ?? "", $0["meg"] as? Bool ?? false) }
        sesongAar = d["sesongAar"] as? String ?? ""; aarskonger = d["aarskonger"] as? String ?? ""
        let l = d["lovbok"] as? [String: Any]
        harLovbok = l != nil
        lovKvelder = l?["kvelder"] as? Int ?? 0
        if let v = l?["ventende"] as? [String: Any] { ventende = (v["minTur"] as? Bool ?? false, v["navn"] as? String ?? "") } else { ventende = nil }
        aktive = (l?["aktive"] as? [[String: Any]] ?? []).map(GjRegel.init)
        fjernet = (l?["fjernet"] as? [[String: Any]] ?? []).map(GjRegel.init)
        rekorder = (l?["rekorder"] as? [[String: Any]] ?? []).map { ($0["ikon"] as? String ?? "", $0["tittel"] as? String ?? "", $0["navn"] as? String ?? "", $0["n"] as? Int ?? 0, $0["enhet"] as? String ?? "", $0["flere"] as? String ?? "") }
        logg = (l?["logg"] as? [[String: Any]] ?? []).map { ($0["dato"] as? String ?? "", $0["tekst"] as? String ?? "") }
        sesonger = d["sesonger"] as? [String] ?? []; sesong = d["sesong"] as? String ?? ""; sorter = d["sorter"] as? String ?? "slurker"
        tall = (d["tall"] as? [[String: Any]] ?? []).map { ($0["b"] as? String ?? "", $0["s"] as? String ?? "") }
        kaaringer = (d["kaaringer"] as? [[String: Any]] ?? []).map { ($0["i"] as? String ?? "", $0["t"] as? String ?? "", $0["n"] as? String ?? "", $0["v"] as? String ?? "") }
        tabell = (d["tabell"] as? [[String: Any]] ?? []).enumerated().map { i, r in
            GjRad(id: i, navn: r["navn"] as? String ?? "", form: r["form"] as? String ?? "", kvelder: r["kvelder"] as? Int ?? 0, slurker: r["slurker"] as? Int ?? 0, snitt: r["snitt"] as? String ?? "", seire: r["seire"] as? Int ?? 0, quiz: r["quiz"] as? Int ?? 0)
        }
        kvelder = (d["kvelder"] as? [[String: Any]] ?? []).enumerated().map { i, k in
            GjKveld(id: (k["id"] as? Int) ?? i, dato: k["dato"] as? String ?? "", info: k["info"] as? String ?? "", topp: k["topp"] as? String ?? "", resten: k["resten"] as? String ?? "")
        }
    }
}

final class GjengModell: ObservableObject {
    @Published var modus = "henter"   // ut, henter, feil, mine, en
    @Published var innlogget = false
    @Published var feil = ""
    @Published var tekst: [String: String] = [:]
    @Published var mittNavn = ""
    @Published var leker: [(id: String, navn: String)] = []
    @Published var standard: [String] = []
    @Published var mine: [GjMine] = []
    @Published var gjeng: GjGjeng? = nil
    @Published var engelsk = false
    weak var nett: WKWebView?

    func t(_ k: String) -> String { tekst[k] ?? k }
    func T(_ no: String, _ en: String) -> String { engelsk ? en : no }

    func sett(_ d: [String: Any]) {
        modus = d["modus"] as? String ?? "henter"
        innlogget = d["innlogget"] as? Bool ?? false
        feil = d["feil"] as? String ?? ""
        if let t = d["tekst"] as? [String: String], !t.isEmpty { tekst = t }
        mittNavn = d["mittNavn"] as? String ?? mittNavn
        leker = (d["leker"] as? [[String: Any]] ?? []).compactMap { l in (l["id"] as? String).map { ($0, l["navn"] as? String ?? $0) } }
        standard = d["standard"] as? [String] ?? standard
        mine = (d["mine"] as? [[String: Any]] ?? []).compactMap(GjMine.init)
        gjeng = (d["gjeng"] as? [String: Any]).map(GjGjeng.init)
    }

    private func js(_ kall: String, _ args: [Any] = []) {
        var json = "[]"
        if let data = try? JSONSerialization.data(withJSONObject: args), let s = String(data: data, encoding: .utf8) { json = s }
        nett?.evaluateJavaScript("window.__mvGjeng && window.__mvGjeng.\(kall).apply(window.__mvGjeng, \(json))", completionHandler: nil)
    }
    /// Et kall som svarer {ok, melding}
    func kall(_ navn: String, _ args: [Any] = [], _ ferdig: @escaping ([String: Any]) -> Void) {
        guard let nett = nett else { ferdig(["ok": false]); return }
        nett.callAsyncJavaScript("if (!window.__mvGjeng || !window.__mvGjeng[navn]) return { ok: false }; return await window.__mvGjeng[navn].apply(window.__mvGjeng, args);",
                                 arguments: ["navn": navn, "args": args], in: nil, in: .page) { r in
            DispatchQueue.main.async {
                switch r {
                case .success(let v): ferdig(v as? [String: Any] ?? ["ok": true])
                case .failure(let e): ferdig(["ok": false, "melding": e.localizedDescription])
                }
            }
        }
    }
    func toast(_ t: String) { if !t.isEmpty { SkallViewController.delt?.visToast(t) } }
    func svar(_ r: [String: Any]) {
        let ok = r["ok"] as? Bool ?? false
        if !ok { UINotificationFeedbackGenerator().notificationOccurred(.warning) }
        toast(r["melding"] as? String ?? (ok ? "" : t("ikke")))
    }
    func gaa(_ kode: String, ny: Bool = false) { UISelectionFeedbackGenerator().selectionChanged(); js("gaa", [kode, ny]) }
    func tilbake() { UISelectionFeedbackGenerator().selectionChanged(); js("tilbake") }
    func ut() { UISelectionFeedbackGenerator().selectionChanged(); js("ut") }
    func konto() { UISelectionFeedbackGenerator().selectionChanged(); js("konto") }
    func inviter() { UIImpactFeedbackGenerator(style: .medium).impactOccurred(); js("inviter") }
    func sesong(_ s: String) { UISelectionFeedbackGenerator().selectionChanged(); js("sesong", [s]) }
    func sort(_ k: String) { UISelectionFeedbackGenerator().selectionChanged(); js("sort", [k]) }
}

struct GjengSkjerm: View {
    @ObservedObject var m: GjengModell
    @Environment(\.colorScheme) private var modus
    private var s: DegStil { DegStil(modus: modus) }

    var body: some View {
        Group {
            switch m.modus {
            case "en": if let g = m.gjeng { GjengEn(m: m, g: g) } else { henter }
            case "mine": GjengMine(m: m)
            case "ut": ut
            case "feil": feilVisning
            default: henter
            }
        }
        .background(s.papir.ignoresSafeArea())
        .foregroundColor(s.blekk)
    }

    private var henter: some View {
        VStack(alignment: .leading, spacing: 16) {
            DegTopp(tittel: m.t("gjengene"), tilbake: m.t("tilbake")) { m.ut() }
            HStack(spacing: 10) { ProgressView(); Text(m.t("henter")).font(.archivo(15, vekt: 600)).opacity(0.7) }
            Spacer()
        }
        .padding(.horizontal, 16)
    }
    private var ut: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                DegTopp(tittel: m.t("gjengene"), tilbake: m.t("tilbake")) { m.ut() }
                VStack(alignment: .leading, spacing: 12) {
                    Text(m.t("utLead")).font(.archivo(20, vekt: 900)).fixedSize(horizontal: false, vertical: true)
                    VStack(alignment: .leading, spacing: 8) {
                        ForEach(["slik1", "slik2", "slik3"], id: \.self) { k in
                            HStack(alignment: .top, spacing: 10) {
                                Text("\((["slik1", "slik2", "slik3"].firstIndex(of: k) ?? 0) + 1)").font(.archivo(13, vekt: 900)).frame(width: 26, height: 26).foregroundColor(s.morkBlekk).background(Circle().fill(s.gul)).overlay(Circle().stroke(s.morkBlekk, lineWidth: 2))
                                Text(m.t(k)).font(.archivo(15, vekt: 600)).fixedSize(horizontal: false, vertical: true).padding(.top, 3)
                            }
                        }
                    }
                    Button(action: m.konto) { s.stor(m.t("lagGjeng")) }.buttonStyle(TrykkStilDeg()).padding(.trailing, 4).padding(.top, 4)
                }
                .padding(16)
                .background(RoundedRectangle(cornerRadius: 18).fill(s.kort))
                .overlay(RoundedRectangle(cornerRadius: 18).stroke(s.blekk, lineWidth: 3))
                .background(RoundedRectangle(cornerRadius: 18).fill(s.blekk).offset(x: 5, y: 5))
                .padding(.trailing, 5)
            }
            .padding(.horizontal, 16).padding(.bottom, 110)
        }
    }
    private var feilVisning: some View {
        VStack(alignment: .leading, spacing: 16) {
            DegTopp(tittel: m.t("gjengene"), tilbake: m.t("tilbake")) { m.ut() }
            Text(m.feil).font(.archivo(16, vekt: 700)).foregroundColor(s.rust).fixedSize(horizontal: false, vertical: true)
            Button(action: m.tilbake) { s.stille(m.t("tilGjengene")) }.buttonStyle(TrykkStilDeg(flytt: 1))
            Spacer()
        }
        .padding(.horizontal, 16)
    }
}

// MARK: - Gjengene dine

struct GjengMine: View {
    @ObservedObject var m: GjengModell
    @Environment(\.colorScheme) private var modus
    @State private var nyAapen = false
    @State private var nyNavn = ""
    @State private var kodeAapen = false
    @State private var kode = ""
    @State private var jobber = false
    @FocusState private var fokus: Felt?
    private enum Felt { case navn, kode }
    private var s: DegStil { DegStil(modus: modus) }
    private let farger: [Color] = [Color(red: 0.388, green: 0.886, blue: 0.659), Color(red: 1, green: 0.612, blue: 0.761), Color(red: 1, green: 0.824, blue: 0.247), Color(red: 0.353, green: 0.553, blue: 0.933), Color(red: 1, green: 0.357, blue: 0.122)]
    private func farge(_ k: String) -> Color { var h: UInt32 = 0; for c in k.unicodeScalars { h = h &* 31 &+ c.value }; return farger[Int(h % UInt32(farger.count))] }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                DegTopp(tittel: m.t("gjengene"), tilbake: m.t("tilbake")) { m.ut() }

                ForEach(m.mine) { g in
                    HStack(spacing: 0) {
                        Button(action: { m.gaa(g.id) }) {
                            VStack(alignment: .leading, spacing: 4) {
                                Text(g.navn.uppercased()).font(.archivo(18, vekt: 900)).lineLimit(2).multilineTextAlignment(.leading)
                                Text("\(m.t("kveld")) \(g.kvelder)" + (g.eier ? " · \(m.t("din"))" : "")).font(.archivo(13, vekt: 700)).opacity(0.75)
                            }
                            .frame(maxWidth: .infinity, alignment: .leading).padding(14).contentShape(Rectangle())
                        }
                        .buttonStyle(.plain)
                        Button(action: { m.gaa(g.id, ny: true) }) {
                            HStack(spacing: 5) { Image(systemName: "play.fill").font(.system(size: 12, weight: .black)); Text(m.t("startKveld")).font(.archivo(12, vekt: 900)) }
                                .padding(.horizontal, 12).frame(height: 38).foregroundColor(s.morkBlekk)
                                .background(Capsule().fill(s.gul)).overlay(Capsule().stroke(s.morkBlekk, lineWidth: 2))
                        }
                        .buttonStyle(TrykkStilDeg(flytt: 1)).padding(.trailing, 12)
                    }
                    .foregroundColor(s.morkBlekk)
                    .background(RoundedRectangle(cornerRadius: 16).fill(farge(g.id)))
                    .overlay(RoundedRectangle(cornerRadius: 16).stroke(s.morkBlekk, lineWidth: 2.5))
                    .background(RoundedRectangle(cornerRadius: 16).fill(s.blekk).offset(x: 4, y: 4))
                }
                .padding(.trailing, 4)

                // Ny gjeng
                VStack(alignment: .leading, spacing: 10) {
                    Button(action: { withAnimation(.spring(response: 0.3, dampingFraction: 0.9)) { nyAapen.toggle() }; if nyAapen { fokus = .navn } }) {
                        HStack(spacing: 8) { Image(systemName: "plus").font(.system(size: 15, weight: .black)); Text(m.t("nyGjeng").uppercased()).font(.archivo(15, vekt: 900)) }
                            .frame(maxWidth: .infinity).frame(height: 52).foregroundColor(s.blekk)
                            .background(RoundedRectangle(cornerRadius: 14).fill(s.kort))
                            .overlay(RoundedRectangle(cornerRadius: 14).stroke(s.blekk, style: StrokeStyle(lineWidth: 2.5, dash: nyAapen ? [] : [7, 5])))
                    }
                    .buttonStyle(TrykkStilDeg(flytt: 2))
                    if nyAapen || m.mine.isEmpty {
                        HStack(spacing: 8) {
                            s.felt(TextField(m.t("navnEks"), text: $nyNavn).font(.archivo(17, vekt: 700)).focused($fokus, equals: .navn).submitLabel(.go).onSubmit(lag))
                            Button(action: lag) { s.stor(m.t("lag"), hoyde: 50).frame(width: 96) }.buttonStyle(TrykkStilDeg()).disabled(jobber)
                        }
                        .padding(.trailing, 4)
                    }
                }
                .padding(.top, 8)

                // Gjengkode
                VStack(alignment: .leading, spacing: 10) {
                    Button(action: { withAnimation(.spring(response: 0.3, dampingFraction: 0.9)) { kodeAapen.toggle() }; if kodeAapen { fokus = .kode } }) {
                        Text(m.t("harKode")).font(.archivo(15, vekt: 800)).frame(minHeight: 44).opacity(0.85)
                    }
                    .buttonStyle(.plain)
                    if kodeAapen {
                        HStack(spacing: 8) {
                            s.felt(TextField(m.t("tegn"), text: $kode).font(.archivo(17, vekt: 800)).textInputAutocapitalization(.characters).disableAutocorrection(true).focused($fokus, equals: .kode).submitLabel(.go).onSubmit(bliMed))
                            Button(action: bliMed) { s.stor(m.t("bliMed"), hoyde: 50).frame(width: 110) }.buttonStyle(TrykkStilDeg()).disabled(jobber)
                        }
                        .padding(.trailing, 4)
                    }
                }
            }
            .padding(.horizontal, 16).padding(.bottom, 110)
        }
        .scrollDismissesKeyboardIfAvailable()
        .onAppear { if m.mine.isEmpty { nyAapen = true } }
    }

    private func lag() {
        let n = nyNavn.trimmingCharacters(in: .whitespaces); guard !n.isEmpty, !jobber else { fokus = .navn; return }
        jobber = true; UIImpactFeedbackGenerator(style: .medium).impactOccurred()
        m.kall("lag", [n]) { r in jobber = false; if r["ok"] as? Bool != true { m.svar(r) } }
    }
    private func bliMed() {
        let k = kode.replacingOccurrences(of: " ", with: "").uppercased(); guard !k.isEmpty, !jobber else { fokus = .kode; return }
        jobber = true; UIImpactFeedbackGenerator(style: .medium).impactOccurred()
        m.kall("bliMed", [k]) { r in jobber = false; if r["ok"] as? Bool != true { m.svar(r) } }
    }
}

// MARK: - Én gjeng

struct GjengEn: View {
    @ObservedObject var m: GjengModell
    let g: GjGjeng
    @Environment(\.colorScheme) private var modus
    @State private var startAapen = false
    @State private var kveldNavn = ""
    @State private var valgteLeker: Set<String> = []
    @State private var profilNavn = ""
    @State private var nyRegel = ""
    @State private var jobber = false
    @State private var spoer: Spoersmaal? = nil
    @State private var visOpphevede = false
    @State private var visLogg = false
    private var s: DegStil { DegStil(modus: modus) }

    private enum Spoersmaal: Identifiable {
        case slett, forlat, opphev(String), slettKveld(Int)
        var id: String { switch self { case .slett: return "slett"; case .forlat: return "forlat"; case .opphev(let r): return "opphev-" + r; case .slettKveld(let i): return "kveld-\(i)" } }
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                DegTopp(tittel: g.navn, tilbake: m.t("dine")) { m.tilbake() }

                if g.ny {
                    VStack(alignment: .leading, spacing: 6) {
                        Text(m.t("nyKlar")).font(.archivo(18, vekt: 900))
                        Text(m.t("nyLead")).font(.archivo(14, vekt: 600)).fixedSize(horizontal: false, vertical: true)
                    }
                    .padding(14).frame(maxWidth: .infinity, alignment: .leading)
                    .background(RoundedRectangle(cornerRadius: 14).fill(s.mint.opacity(modus == .dark ? 0.3 : 0.45)))
                    .overlay(RoundedRectangle(cornerRadius: 14).stroke(s.blekk, lineWidth: 2))
                }

                HStack(spacing: 10) {
                    Button(action: m.inviter) { s.stor(m.t("inviter")) }.buttonStyle(TrykkStilDeg())
                    if !g.medlem {
                        Button(action: { jobber = true; m.kall("bliMedGjeng") { jobber = false; m.svar($0) } }) { s.stille(m.innlogget ? m.t("bliMedGjeng") : m.t("loggInn")) }
                            .buttonStyle(TrykkStilDeg(flytt: 1)).frame(height: 56)
                    }
                }
                .padding(.trailing, 4)

                if g.medlem { kveldBoks }
                if !g.utsatte.isEmpty { utsatteBoks }
                if g.medlem, let meg = g.meg { megBoks(meg) }
                if !g.formue.isEmpty { formueBoks }
                if g.harLovbok { lovbokBoks }

                // Sesongen
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(g.sesonger + ["alle"], id: \.self) { a in chip(a == "alle" ? m.t("alle") : a, paa: g.sesong == a) { m.sesong(a) } }
                    }
                }
                if g.kvelder.isEmpty {
                    Text(m.t("ingenKvelder").replacingOccurrences(of: "{s}", with: g.sesong == "alle" ? m.t("tabellen") : g.sesong)).font(.archivo(15, vekt: 600)).opacity(0.75).fixedSize(horizontal: false, vertical: true)
                } else {
                    // Tallene
                    LazyVGrid(columns: [GridItem(.flexible(), spacing: 10), GridItem(.flexible(), spacing: 10)], spacing: 10) {
                        ForEach(Array(g.tall.enumerated()), id: \.offset) { _, t in
                            VStack(alignment: .leading, spacing: 2) {
                                Text(t.b).font(.archivo(24, vekt: 900)).lineLimit(1).minimumScaleFactor(0.6)
                                Text(t.s).font(.archivo(12, vekt: 700)).opacity(0.65)
                            }
                            .padding(12).frame(maxWidth: .infinity, alignment: .leading)
                            .background(RoundedRectangle(cornerRadius: 12).fill(s.kort))
                            .overlay(RoundedRectangle(cornerRadius: 12).stroke(s.blekk.opacity(0.25), lineWidth: 1.5))
                        }
                    }
                    // Kåringene
                    if !g.kaaringer.isEmpty {
                        h2(m.t("kaaringer"))
                        VStack(spacing: 8) {
                            ForEach(Array(g.kaaringer.enumerated()), id: \.offset) { _, k in
                                HStack(spacing: 12) {
                                    Text(k.i).font(.system(size: 26))
                                    VStack(alignment: .leading, spacing: 2) {
                                        Text(k.t).font(.archivo(12, vekt: 800)).opacity(0.65)
                                        Text("\(k.n) · \(k.v)").font(.archivo(16, vekt: 800)).fixedSize(horizontal: false, vertical: true)
                                    }
                                    Spacer(minLength: 0)
                                }
                                .padding(12)
                                .background(RoundedRectangle(cornerRadius: 12).fill(s.gul.opacity(modus == .dark ? 0.2 : 0.35)))
                                .overlay(RoundedRectangle(cornerRadius: 12).stroke(s.blekk.opacity(0.3), lineWidth: 1.5))
                            }
                        }
                    }
                    // Tabellen
                    h2(m.t("sesongtabell"))
                    tabellBoks
                    Text(m.t("tabellLead")).font(.archivo(12, vekt: 600)).opacity(0.65).fixedSize(horizontal: false, vertical: true)
                    // Kveldene
                    h2(m.t("kveldene"))
                    VStack(spacing: 8) {
                        ForEach(g.kvelder) { k in
                            VStack(alignment: .leading, spacing: 4) {
                                HStack { Text(k.dato).font(.archivo(15, vekt: 900)); Spacer(); Text(k.info).font(.archivo(12, vekt: 700)).opacity(0.65).lineLimit(1) }
                                if !k.topp.isEmpty || !k.resten.isEmpty { Text(k.topp + (k.resten.isEmpty ? "" : " · " + k.resten)).font(.archivo(14, vekt: 600)).opacity(0.85).fixedSize(horizontal: false, vertical: true) }
                                if g.eier { Button(action: { spoer = .slettKveld(k.id) }) { Text(m.t("fjernKveld")).font(.archivo(13, vekt: 800)).opacity(0.7).frame(minHeight: 32) }.buttonStyle(.plain) }
                            }
                            .padding(12).frame(maxWidth: .infinity, alignment: .leading)
                            .background(RoundedRectangle(cornerRadius: 12).fill(s.kort))
                            .overlay(RoundedRectangle(cornerRadius: 12).stroke(s.blekk.opacity(0.25), lineWidth: 1.5))
                        }
                    }
                }

                // Eieren / medlemmet
                VStack(alignment: .leading, spacing: 8) {
                    HStack(spacing: 14) {
                        if g.eier {
                            Button(action: {
                                DegDialog.vis(tittel: m.t("nyttNavn"), melding: nil, felt: [(m.t("navnPaa"), g.navn, false, false)], knapp: m.t("lagre"), avbryt: m.t("avbryt")) { v in m.kall("endre", [v.first ?? ""]) { m.svar($0) } }
                            }) { Text(m.t("endreNavn")).font(.archivo(14, vekt: 800)).frame(minHeight: 40) }.buttonStyle(.plain)
                            Button(action: { spoer = .slett }) { Text(m.t("slettGjeng")).font(.archivo(14, vekt: 800)).foregroundColor(s.rust).frame(minHeight: 40) }.buttonStyle(.plain)
                        } else if g.medlem {
                            Button(action: { spoer = .forlat }) { Text(m.t("forlat")).font(.archivo(14, vekt: 800)).foregroundColor(s.rust).frame(minHeight: 40) }.buttonStyle(.plain)
                        }
                    }
                    (Text(m.t("gjengkode") + ": ").font(.archivo(13, vekt: 600)) + Text(g.kode).font(.archivo(13, vekt: 900))).opacity(0.7)
                }
                .padding(.top, 8)
            }
            .padding(.horizontal, 16).padding(.bottom, 110)
        }
        .scrollDismissesKeyboardIfAvailable()
        .onAppear {
            startAapen = g.ny
            kveldNavn = m.mittNavn
            profilNavn = g.meg?.navn ?? m.mittNavn
            valgteLeker = Set(m.standard)
        }
        .confirmationDialog(spoerTittel, isPresented: Binding(get: { spoer != nil }, set: { if !$0 { spoer = nil } }), titleVisibility: .visible) {
            if let sp = spoer {
                switch sp {
                case .slett: Button(m.t("slettGjeng"), role: .destructive) { m.kall("slett") { m.svar($0) } }
                case .forlat: Button(m.t("forlat"), role: .destructive) { m.kall("forlat") { m.svar($0) } }
                case .opphev(let r): Button(m.T("Opphev", "Repeal"), role: .destructive) { m.kall("lovOpphev", [r]) { m.svar($0) } }
                case .slettKveld(let i): Button(m.t("fjernKveld"), role: .destructive) { m.kall("slettKveld", [i]) { m.svar($0) } }
                }
            }
            Button(m.t("avbryt"), role: .cancel) {}
        }
    }

    private var spoerTittel: String {
        switch spoer {
        case .slett: return m.t("slettSikker").replacingOccurrences(of: "{n}", with: g.navn)
        case .forlat: return m.t("forlatSikker").replacingOccurrences(of: "{n}", with: g.navn)
        case .opphev: return m.t("opphevSikker")
        case .slettKveld: return m.t("fjernKveldSikker")
        case nil: return ""
        }
    }

    private func h2(_ t: String) -> some View { Text(t).font(.archivo(20, vekt: 900)).padding(.top, 6) }
    private func etikett(_ t: String) -> some View { Text(t.uppercased()).font(.archivo(12, vekt: 900)).opacity(0.6) }

    private func chip(_ tekst: String, paa: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(tekst).font(.archivo(14, vekt: 800)).padding(.horizontal, 12).frame(height: 36)
                .foregroundColor(paa ? s.morkBlekk : s.blekk)
                .background(Capsule().fill(paa ? s.gul : s.kort))
                .overlay(Capsule().stroke(paa ? s.morkBlekk : s.blekk.opacity(0.35), lineWidth: 2))
                .animation(.spring(response: 0.25, dampingFraction: 0.85), value: paa)
        }
        .buttonStyle(TrykkStilDeg(flytt: 1))
    }

    private func boks<V: View>(farge: Color? = nil, @ViewBuilder _ inn: () -> V) -> some View {
        VStack(alignment: .leading, spacing: 10) { inn() }
            .padding(14).frame(maxWidth: .infinity, alignment: .leading)
            .background(RoundedRectangle(cornerRadius: 16).fill(farge ?? s.kort))
            .overlay(RoundedRectangle(cornerRadius: 16).stroke(s.blekk, lineWidth: 2.5))
            .background(RoundedRectangle(cornerRadius: 16).fill(s.blekk).offset(x: 4, y: 4))
            .padding(.trailing, 4)
    }

    // Kvelden: pågår, eller start den
    @ViewBuilder private var kveldBoks: some View {
        if let k = g.kveld {
            boks(farge: s.gul.opacity(modus == .dark ? 0.25 : 0.4)) {
                etikett(m.t("paagaar"))
                Text("🎉 \(k.vert) \(m.t("harStartet"))").font(.archivo(20, vekt: 900)).fixedSize(horizontal: false, vertical: true)
                Text("\(k.antall) \(m.t("iRommet"))" + (k.plan.isEmpty ? "" : " · " + k.plan)).font(.archivo(13, vekt: 600)).opacity(0.75)
                if !k.erMed {
                    etikett(m.t("navnIKveld"))
                    s.felt(TextField(m.t("navnIKveld"), text: $kveldNavn).font(.archivo(17, vekt: 700)).disableAutocorrection(true))
                }
                Button(action: { kveld("bli-kveld") }) { s.stor(k.erMed ? m.t("tilbakeKveld") : m.t("bliKveld")) }.buttonStyle(TrykkStilDeg()).disabled(jobber).padding(.top, 2)
            }
        } else {
            boks {
                Button(action: { withAnimation(.spring(response: 0.35, dampingFraction: 0.88)) { startAapen.toggle() } }) {
                    HStack { Text("🎲 " + m.t("startKvelden").uppercased()).font(.archivo(17, vekt: 900)); Spacer(); Image(systemName: "chevron.down").font(.system(size: 14, weight: .bold)).rotationEffect(.degrees(startAapen ? 180 : 0)).opacity(0.5) }
                        .frame(minHeight: 40).contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                if startAapen {
                    Text(m.t("startLead")).font(.archivo(13, vekt: 600)).opacity(0.75).fixedSize(horizontal: false, vertical: true)
                    etikett(m.t("navnIKveld"))
                    s.felt(TextField(m.t("navnIKveld"), text: $kveldNavn).font(.archivo(17, vekt: 700)).disableAutocorrection(true))
                    etikett(m.t("leker"))
                    VStack(spacing: 6) {
                        ForEach(m.leker, id: \.id) { l in
                            Button(action: { UISelectionFeedbackGenerator().selectionChanged(); if valgteLeker.contains(l.id) { valgteLeker.remove(l.id) } else { valgteLeker.insert(l.id) } }) {
                                HStack(spacing: 10) {
                                    Image(systemName: valgteLeker.contains(l.id) ? "checkmark.square.fill" : "square").font(.system(size: 20, weight: .bold)).foregroundColor(valgteLeker.contains(l.id) ? s.rust : s.blekk.opacity(0.5))
                                    Text(l.navn).font(.archivo(15, vekt: 700)).lineLimit(1)
                                    Spacer(minLength: 0)
                                }
                                .frame(minHeight: 40).contentShape(Rectangle())
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    Button(action: { kveld("start-kveld") }) { s.stor(m.t("startVarsle")) }.buttonStyle(TrykkStilDeg()).disabled(jobber).padding(.top, 2)
                }
            }
        }
    }
    private func kveld(_ handling: String) {
        guard !jobber else { return }
        jobber = true; UIImpactFeedbackGenerator(style: .medium).impactOccurred()
        m.kall("kveld", [handling, kveldNavn.trimmingCharacters(in: .whitespaces), Array(valgteLeker)]) { r in jobber = false; if r["ok"] as? Bool != true { m.svar(r) } }
    }

    // Aksjer som venter på stemmer
    private var utsatteBoks: some View {
        VStack(alignment: .leading, spacing: 10) {
            h2("⏳ " + m.t("tilAvgj"))
            Text(m.t("tilAvgjLead")).font(.archivo(13, vekt: 600)).opacity(0.75).fixedSize(horizontal: false, vertical: true)
            ForEach(g.utsatte) { u in
                VStack(alignment: .leading, spacing: 8) {
                    Text(u.q).font(.archivo(16, vekt: 800)).fixedSize(horizontal: false, vertical: true)
                    (Text("\(u.melderNavn) \(m.t("melder")): ").font(.archivo(13, vekt: 600)) + Text(u.utfallNavn).font(.archivo(13, vekt: 900)) + Text(" · \(u.ja)–\(u.nei) · \(u.timer) \(m.t("igjen")) · \(u.aksjonaerer) \(m.t("aksjonaerer"))").font(.archivo(13, vekt: 600))).opacity(0.8)
                    if u.kanStemme {
                        HStack(spacing: 8) {
                            chip(m.t("detSkjedde"), paa: u.minStemme == "ja") { m.kall("utsattStem", [u.id, "ja"]) { m.svar($0) } }
                            chip(m.t("ikkeSkjedde"), paa: u.minStemme == "nei") { m.kall("utsattStem", [u.id, "nei"]) { m.svar($0) } }
                        }
                    }
                }
                .padding(12).frame(maxWidth: .infinity, alignment: .leading)
                .background(RoundedRectangle(cornerRadius: 12).fill(s.kort))
                .overlay(RoundedRectangle(cornerRadius: 12).stroke(s.blekk.opacity(0.3), lineWidth: 1.5))
            }
        }
    }

    // Deg i gjengen: lommeboka og navnet
    private func megBoks(_ meg: (saldo: String, kvelder: Int, navn: String)) -> some View {
        boks {
            etikett(m.t("degIGjengen"))
            (Text(meg.saldo + " ").font(.archivo(22, vekt: 900)) + Text(m.t("iLommeboka") + " · \(meg.kvelder) \(meg.kvelder == 1 ? m.t("kveldEn") : m.t("kvelder")) \(m.t("denneSesongen"))").font(.archivo(14, vekt: 600))).fixedSize(horizontal: false, vertical: true)
            HStack(spacing: 8) {
                s.felt(TextField(m.t("navnIGjengen"), text: $profilNavn).font(.archivo(16, vekt: 700)).disableAutocorrection(true))
                Button(action: { let n = profilNavn.trimmingCharacters(in: .whitespaces); guard !n.isEmpty else { return }; m.kall("profil", [n]) { m.svar($0) } }) { s.stille(m.t("lagre")).frame(width: 90) }.buttonStyle(TrykkStilDeg(flytt: 1))
            }
            Text(m.t("formueLead")).font(.archivo(12, vekt: 600)).opacity(0.65).fixedSize(horizontal: false, vertical: true)
        }
    }

    private var formueBoks: some View {
        VStack(alignment: .leading, spacing: 8) {
            h2("💰 \(m.t("formuen")) \(g.sesongAar)")
            VStack(spacing: 0) {
                ForEach(Array(g.formue.enumerated()), id: \.offset) { i, f in
                    HStack {
                        Text((i == 0 ? "👑 " : "\(i + 1). ") + f.navn).font(.archivo(15, vekt: f.meg ? 900 : 700)).lineLimit(1)
                        Spacer()
                        Text(f.saldo).font(.archivo(15, vekt: 900))
                    }
                    .padding(.horizontal, 14).frame(minHeight: 42)
                    .background(f.meg ? s.gul.opacity(0.25) : Color.clear)
                    if i < g.formue.count - 1 { Rectangle().fill(s.blekk.opacity(0.12)).frame(height: 1).padding(.leading, 14) }
                }
            }
            .background(RoundedRectangle(cornerRadius: 12).fill(s.kort))
            .overlay(RoundedRectangle(cornerRadius: 12).stroke(s.blekk.opacity(0.25), lineWidth: 1.5))
            .clipShape(RoundedRectangle(cornerRadius: 12))
            if !g.aarskonger.isEmpty { Text(m.t("aarskonger") + g.aarskonger).font(.archivo(12, vekt: 600)).opacity(0.65) }
        }
    }

    // Gjengens lov
    private var lovbokBoks: some View {
        VStack(alignment: .leading, spacing: 10) {
            h2(m.t("lovbok"))
            Text(m.t("lovLead") + " · \(g.lovKvelder) \(g.lovKvelder == 1 ? m.t("kveldEn") : m.t("kvelder"))").font(.archivo(13, vekt: 600)).opacity(0.75).fixedSize(horizontal: false, vertical: true)
            if let v = g.ventende {
                if v.minTur {
                    boks(farge: s.gul.opacity(modus == .dark ? 0.25 : 0.4)) {
                        Text(m.t("duVant")).font(.archivo(17, vekt: 900)).fixedSize(horizontal: false, vertical: true)
                        HStack(spacing: 8) {
                            s.felt(TextField(m.t("nyRegel"), text: $nyRegel).font(.archivo(16, vekt: 700)))
                            Button(action: { let t = nyRegel.trimmingCharacters(in: .whitespaces); guard t.count >= 4 else { return }; m.kall("lovNy", [t]) { r in if r["ok"] as? Bool == true { nyRegel = "" } else { m.svar(r) } } }) { s.stor(m.t("innfor"), hoyde: 50).frame(width: 100) }.buttonStyle(TrykkStilDeg())
                        }
                        if !g.aktive.isEmpty {
                            Text(m.t("ellerOpphev")).font(.archivo(13, vekt: 600)).opacity(0.75)
                            ForEach(g.aktive) { r in
                                Button(action: { spoer = .opphev(r.id) }) {
                                    HStack(spacing: 8) { Text("🗑️"); Text(r.tekst).font(.archivo(14, vekt: 700)).lineLimit(2).multilineTextAlignment(.leading); Spacer(minLength: 0) }
                                        .padding(.horizontal, 12).frame(minHeight: 40).foregroundColor(s.blekk)
                                        .background(RoundedRectangle(cornerRadius: 10).fill(s.kort)).overlay(RoundedRectangle(cornerRadius: 10).stroke(s.blekk.opacity(0.3), lineWidth: 1.5))
                                }
                                .buttonStyle(TrykkStilDeg(flytt: 1))
                            }
                        }
                    }
                } else {
                    Text("⏳ \(v.navn) \(m.t("venterPaa"))").font(.archivo(14, vekt: 700)).fixedSize(horizontal: false, vertical: true)
                        .padding(12).frame(maxWidth: .infinity, alignment: .leading)
                        .background(RoundedRectangle(cornerRadius: 12).fill(s.gul.opacity(0.3))).overlay(RoundedRectangle(cornerRadius: 12).stroke(s.blekk.opacity(0.3), lineWidth: 1.5))
                }
            }
            (Text(m.t("gjelder") + " ").font(.archivo(16, vekt: 900)) + Text("(\(g.aktive.count))").font(.archivo(13, vekt: 700)).foregroundColor(s.blekk.opacity(0.6))).padding(.top, 4)
            if g.aktive.isEmpty {
                Text(m.t("ingenRegler")).font(.archivo(14, vekt: 600)).opacity(0.75).fixedSize(horizontal: false, vertical: true)
            } else {
                VStack(spacing: 8) { ForEach(g.aktive) { r in regel(r, aktiv: true) } }
            }
            if !g.rekorder.isEmpty {
                Text(m.t("rekorder")).font(.archivo(16, vekt: 900)).padding(.top, 4)
                VStack(spacing: 6) {
                    ForEach(Array(g.rekorder.enumerated()), id: \.offset) { _, r in
                        HStack(alignment: .top, spacing: 10) {
                            Text(r.ikon).font(.system(size: 20))
                            VStack(alignment: .leading, spacing: 2) {
                                Text(r.tittel).font(.archivo(12, vekt: 800)).opacity(0.65)
                                Text("\(r.navn) · \(r.n) \(r.enhet)").font(.archivo(15, vekt: 800))
                                if !r.flere.isEmpty { Text(r.flere).font(.archivo(12, vekt: 600)).opacity(0.6) }
                            }
                            Spacer(minLength: 0)
                        }
                        .padding(10).frame(maxWidth: .infinity, alignment: .leading)
                        .background(RoundedRectangle(cornerRadius: 12).fill(s.kort)).overlay(RoundedRectangle(cornerRadius: 12).stroke(s.blekk.opacity(0.25), lineWidth: 1.5))
                    }
                }
            }
            if !g.fjernet.isEmpty {
                brett(m.t("opphevede") + " (\(g.fjernet.count))", aapen: $visOpphevede) {
                    VStack(spacing: 8) { ForEach(g.fjernet) { r in regel(r, aktiv: false) } }
                }
            }
            if !g.logg.isEmpty {
                brett(m.t("historikk"), aapen: $visLogg) {
                    VStack(alignment: .leading, spacing: 6) {
                        ForEach(Array(g.logg.enumerated()), id: \.offset) { _, l in
                            (Text(l.dato + " ").font(.archivo(12, vekt: 700)).foregroundColor(s.blekk.opacity(0.6)) + Text(l.tekst).font(.archivo(13, vekt: 600))).fixedSize(horizontal: false, vertical: true)
                        }
                    }
                }
            }
        }
    }
    private func regel(_ r: GjRegel, aktiv: Bool) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("«\(r.tekst)»").font(.archivo(15, vekt: 800)).fixedSize(horizontal: false, vertical: true)
            Text(r.av).font(.archivo(12, vekt: 600)).opacity(0.65).fixedSize(horizontal: false, vertical: true)
            if aktiv && g.medlem {
                Button(action: { m.kall("lovStem", [r.id]) { m.svar($0) } }) {
                    Text((r.harStemt ? m.t("stemt") : m.t("stemFjern")) + (r.stemmer > 0 ? " (\(r.stemmer)/\(r.trengs))" : "")).font(.archivo(13, vekt: 800)).frame(minHeight: 32)
                        .foregroundColor(r.harStemt ? s.rust : s.blekk).opacity(r.harStemt ? 1 : 0.75)
                }
                .buttonStyle(.plain)
            }
        }
        .padding(12).frame(maxWidth: .infinity, alignment: .leading)
        .background(RoundedRectangle(cornerRadius: 12).fill(aktiv ? s.kort : s.kort.opacity(0.6)))
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(s.blekk.opacity(aktiv ? 0.3 : 0.15), lineWidth: 1.5))
    }
    private func brett<V: View>(_ tittel: String, aapen: Binding<Bool>, @ViewBuilder _ inn: () -> V) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Button(action: { withAnimation(.spring(response: 0.3, dampingFraction: 0.9)) { aapen.wrappedValue.toggle() } }) {
                HStack(spacing: 6) { Image(systemName: "chevron.right").font(.system(size: 12, weight: .bold)).rotationEffect(.degrees(aapen.wrappedValue ? 90 : 0)); Text(tittel).font(.archivo(14, vekt: 800)) }
                    .frame(minHeight: 36).opacity(0.8).contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            if aapen.wrappedValue { inn() }
        }
    }

    // Sesongtabellen: rader med sorterbare overskrifter
    private var tabellBoks: some View {
        let kolonner: [(String, String)] = [("kvelder", m.t("kvelder").capitalized), ("slurker", m.t("slurker")), ("snitt", m.t("snitt")), ("seire", "🏆"), ("quiz", m.t("quiz"))]
        return VStack(spacing: 0) {
            HStack(spacing: 0) {
                Text("#").font(.archivo(11, vekt: 900)).frame(width: 24, alignment: .leading)
                Text(m.t("navn")).font(.archivo(11, vekt: 900)).frame(maxWidth: .infinity, alignment: .leading)
                ForEach(kolonner, id: \.0) { k in
                    Button(action: { m.sort(k.0) }) {
                        Text(k.1).font(.archivo(11, vekt: 900)).lineLimit(1).minimumScaleFactor(0.7).frame(width: k.0 == "seire" ? 28 : 44, alignment: .trailing)
                            .foregroundColor(g.sorter == k.0 ? s.morkBlekk : s.blekk)
                            .padding(.vertical, 4).background(RoundedRectangle(cornerRadius: 6).fill(g.sorter == k.0 ? s.gul : Color.clear))
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.horizontal, 10).frame(minHeight: 36).opacity(0.9)
            ForEach(g.tabell) { r in
                Rectangle().fill(s.blekk.opacity(0.12)).frame(height: 1)
                HStack(spacing: 0) {
                    Text("\(r.id + 1)").font(.archivo(13, vekt: 700)).opacity(0.6).frame(width: 24, alignment: .leading)
                    HStack(spacing: 4) {
                        Text(r.navn).font(.archivo(14, vekt: 800)).lineLimit(1)
                        if r.form == "opp" { Text("▲").font(.system(size: 9)).foregroundColor(s.rust) } else if r.form == "ned" { Text("▼").font(.system(size: 9)).opacity(0.5) }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    Text("\(r.kvelder)").font(.archivo(14, vekt: 700)).frame(width: 44, alignment: .trailing)
                    Text("\(r.slurker)").font(.archivo(14, vekt: 900)).frame(width: 44, alignment: .trailing)
                    Text(r.snitt).font(.archivo(14, vekt: 700)).frame(width: 44, alignment: .trailing)
                    Text("\(r.seire)").font(.archivo(14, vekt: 700)).frame(width: 28, alignment: .trailing)
                    Text("\(r.quiz)").font(.archivo(14, vekt: 700)).frame(width: 44, alignment: .trailing)
                }
                .padding(.horizontal, 10).frame(minHeight: 40)
            }
        }
        .background(RoundedRectangle(cornerRadius: 12).fill(s.kort))
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(s.blekk.opacity(0.3), lineWidth: 1.5))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }
}

private extension View {
    @ViewBuilder func scrollDismissesKeyboardIfAvailable() -> some View {
        if #available(iOS 16.0, *) { self.scrollDismissesKeyboard(.interactively) } else { self }
    }
}
