import SwiftUI
import UIKit
import WebKit

/// Leker-fanen native: alle drikkelekene med søk og filter. Lista kommer fra nettsiden (mv-skjerm «leker», med bildene som PNG),
/// og et trykk på en lek åpner lekesiden (nettsiden) i samme fane – pila tilbake eller et drag fra venstre kant henter lista igjen.
/// Alderssjekken er en iPhone-dialog her, én gang; svaret huskes der nettsiden leser det (la_age_ok).
struct LekeKort: Identifiable {
    let id: String        // adressen til lekesiden
    let navn: String, niva: String, pl: String, gruppe: String, utstyr: String, q: String
    let fra: Int, til: Int   // antall spillere (ikke «min»/«maks» – de navnene kolliderer med Swift sine)
    let pluss: Bool
    var bilde: UIImage?
    init?(_ d: [String: Any]) {
        guard let href = d["href"] as? String, let navn = d["navn"] as? String else { return nil }
        id = href; self.navn = navn
        niva = d["niva"] as? String ?? "rom"
        pl = d["pl"] as? String ?? ""; gruppe = d["gruppe"] as? String ?? ""; utstyr = d["utstyr"] as? String ?? ""
        q = (d["q"] as? String ?? navn).lowercased()
        fra = d["min"] as? Int ?? 2; til = d["maks"] as? Int ?? 99
        pluss = d["pluss"] as? Bool ?? false
        bilde = FigurData.bilde(d["png"] as? String)
    }
}

final class LekerModell: ObservableObject {
    @Published var leker: [LekeKort] = []
    @Published var sok = ""
    @Published var niva = ""        // «», rom, app, regler
    @Published var pl = 0           // 0, 2, 4, 6
    @Published var bareGratis = false
    @Published var alkfri = false
    @Published var alderOk = true
    @Published var tekst: [String: String] = [:]
    @Published var engelsk = false
    weak var nett: WKWebView?
    var handling: ((String) -> Void)?

    func t(_ k: String) -> String { tekst[k] ?? k }

    func sett(_ d: [String: Any]) {
        tekst = d["tekst"] as? [String: String] ?? tekst
        alderOk = d["alder"] as? Bool ?? alderOk
        alkfri = d["alkfri"] as? Bool ?? alkfri
        let nye = (d["leker"] as? [[String: Any]] ?? []).compactMap(LekeKort.init)
        if !nye.isEmpty {
            // Bildene kommer gjerne i en melding etter lista: behold de vi har til de nye er på plass
            let gamle = Dictionary(leker.map { ($0.id, $0.bilde) }, uniquingKeysWith: { a, _ in a })
            leker = nye.map { l in var x = l; if x.bilde == nil { x.bilde = gamle[l.id] ?? nil }; return x }
        }
    }

    func passer(_ l: LekeKort) -> Bool {
        let q = sok.trimmingCharacters(in: .whitespaces).lowercased()
        if !q.isEmpty && !l.q.contains(q) { return false }
        if !niva.isEmpty && l.niva != niva { return false }
        if bareGratis && l.pluss { return false }
        switch pl {
        case 2: if !(l.fra <= 2 && l.til >= 2) { return false }
        case 4: if !(l.fra <= 5 && l.til >= 3) { return false }
        case 6: if !(l.til >= 6) { return false }
        default: break
        }
        return true
    }
    func liste(_ n: String) -> [LekeKort] { leker.filter { $0.niva == n && passer($0) } }

    private func js(_ kall: String, _ arg: Any? = nil) {
        var json = ""
        if let a = arg, let data = try? JSONSerialization.data(withJSONObject: [a]), let s = String(data: data, encoding: .utf8) { json = s + "[0]" }
        nett?.evaluateJavaScript("window.__mvLeker && window.__mvLeker.\(kall)(\(json))", completionHandler: nil)
    }
    func aapne(_ l: LekeKort) { UISelectionFeedbackGenerator().selectionChanged(); js("gaa", l.id) }
    func settAlkfri(_ v: Bool) { UISelectionFeedbackGenerator().selectionChanged(); js("alkfri", v) }
    func alderJa() { alderOk = true; js("alder") }
}

struct LekerSkjerm: View {
    @ObservedObject var m: LekerModell
    @Environment(\.colorScheme) private var modus
    @FocusState private var sokFokus: Bool

    private var papir: Color { modus == .dark ? Color(red: 0.11, green: 0.106, blue: 0.122) : Color(red: 1, green: 0.973, blue: 0.933) }
    private var kort: Color { modus == .dark ? Color(red: 0.173, green: 0.169, blue: 0.188) : .white }
    private var blekk: Color { modus == .dark ? Color(red: 1, green: 0.973, blue: 0.933) : Color(red: 0.086, green: 0.071, blue: 0.059) }
    private let gul = Color(red: 1, green: 0.824, blue: 0.247)
    private let rust = Color(red: 0.776, green: 0.235, blue: 0.067)
    private let morkBlekk = Color(red: 0.086, green: 0.071, blue: 0.059)
    private let mint = Color(red: 0.388, green: 0.886, blue: 0.659)

    var body: some View {
        ScrollView {
            LazyVStack(alignment: .leading, spacing: 18, pinnedViews: []) {
                Text(m.t("tittel").uppercased()).font(.archivo(40, vekt: 900)).padding(.top, 8).padding(.horizontal, 16)

                // Søket
                HStack(spacing: 8) {
                    Image(systemName: "magnifyingglass").font(.system(size: 16, weight: .bold)).opacity(0.5)
                    TextField(m.t("sok"), text: $m.sok).font(.archivo(17, vekt: 600)).disableAutocorrection(true).submitLabel(.search).focused($sokFokus)
                    if !m.sok.isEmpty { Button(action: { m.sok = "" }) { Image(systemName: "xmark.circle.fill").opacity(0.5) }.buttonStyle(.plain) }
                }
                .padding(.horizontal, 14).frame(height: 50)
                .background(RoundedRectangle(cornerRadius: 14).fill(kort))
                .overlay(RoundedRectangle(cornerRadius: 14).stroke(blekk, lineWidth: 2.5))
                .padding(.horizontal, 16)

                // Filterrad
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        chip(m.t("alle"), paa: m.niva.isEmpty) { m.niva = "" }
                        chip(m.t("rom"), paa: m.niva == "rom") { m.niva = "rom" }
                        chip(m.t("app"), paa: m.niva == "app") { m.niva = "app" }
                        chip(m.t("regler"), paa: m.niva == "regler") { m.niva = "regler" }
                        skille
                        chip(m.t("forTo"), paa: m.pl == 2) { m.pl = m.pl == 2 ? 0 : 2 }
                        chip("3–5", paa: m.pl == 4) { m.pl = m.pl == 4 ? 0 : 4 }
                        chip(m.t("seks"), paa: m.pl == 6) { m.pl = m.pl == 6 ? 0 : 6 }
                        chip(m.t("bareGratis"), paa: m.bareGratis) { m.bareGratis.toggle() }
                        skille
                        chip(m.t("alkfri"), paa: m.alkfri) { m.alkfri.toggle(); m.settAlkfri(m.alkfri) }
                    }
                    .padding(.horizontal, 16)
                }

                let rom = m.liste("rom"), app = m.liste("app"), regler = m.liste("regler")
                if rom.isEmpty && app.isEmpty && regler.isEmpty {
                    Text(m.t("ingen")).font(.archivo(16, vekt: 600)).opacity(0.7).padding(.horizontal, 16)
                }

                if !rom.isEmpty {
                    seksjon(m.t("romH2"), m.t("romP"))
                    LazyVGrid(columns: [GridItem(.flexible(), spacing: 12), GridItem(.flexible(), spacing: 12)], spacing: 12) {
                        ForEach(rom) { l in Button(action: { m.aapne(l) }) { stortKort(l) }.buttonStyle(TrykkStil3()) }
                    }
                    .padding(.horizontal, 16)
                }

                if !app.isEmpty {
                    seksjon(m.t("appH2"), m.t("appP"))
                    VStack(spacing: 10) {
                        ForEach(app) { l in Button(action: { m.aapne(l) }) { rad(l) }.buttonStyle(TrykkStil3()) }
                    }
                    .padding(.horizontal, 16)
                }

                if !regler.isEmpty {
                    seksjon(m.t("reglerH2"), m.t("reglerP"))
                    VStack(spacing: 0) {
                        ForEach(Array(regler.enumerated()), id: \.element.id) { i, l in
                            Button(action: { m.aapne(l) }) {
                                HStack(spacing: 10) {
                                    VStack(alignment: .leading, spacing: 2) {
                                        Text(l.navn).font(.archivo(16, vekt: 800))
                                        Text([l.utstyr, l.pl].filter { !$0.isEmpty }.joined(separator: " · ")).font(.archivo(13, vekt: 600)).opacity(0.6).lineLimit(1)
                                    }
                                    Spacer(minLength: 8)
                                    Image(systemName: "chevron.right").font(.system(size: 13, weight: .bold)).opacity(0.4)
                                }
                                .padding(.horizontal, 14).frame(minHeight: 52).contentShape(Rectangle())
                            }
                            .buttonStyle(.plain)
                            if i < regler.count - 1 { Rectangle().fill(blekk.opacity(0.12)).frame(height: 1).padding(.leading, 14) }
                        }
                    }
                    .background(RoundedRectangle(cornerRadius: 16).fill(kort))
                    .overlay(RoundedRectangle(cornerRadius: 16).stroke(blekk.opacity(0.2), lineWidth: 1.5))
                    .padding(.horizontal, 16)
                }
            }
            .padding(.bottom, 40)
        }
        .background(papir.ignoresSafeArea())
        .foregroundColor(blekk)
        .scrollDismissesKeyboardIfAvailable()
        .alert(m.t("alderTittel"), isPresented: Binding(get: { !m.alderOk }, set: { _ in })) {
            Button(m.t("alderJa"), action: m.alderJa)
            Button(m.t("alderNei"), role: .cancel) { m.handling?("tilbake") }
        } message: { Text(m.t("alderTekst")) }
    }

    private var skille: some View { Rectangle().fill(blekk.opacity(0.2)).frame(width: 1.5, height: 22) }

    private func chip(_ tekst: String, paa: Bool, action: @escaping () -> Void) -> some View {
        Button(action: { UISelectionFeedbackGenerator().selectionChanged(); action() }) {
            Text(tekst).font(.archivo(14, vekt: 800))
                .padding(.horizontal, 12).frame(height: 36)
                .foregroundColor(paa ? morkBlekk : blekk)
                .background(Capsule().fill(paa ? gul : kort))
                .overlay(Capsule().stroke(paa ? morkBlekk : blekk.opacity(0.35), lineWidth: 2))
        }
        .buttonStyle(.plain)
    }

    private func seksjon(_ h2: String, _ p: String) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(h2).font(.archivo(22, vekt: 900))
            if !p.isEmpty { Text(p).font(.archivo(14, vekt: 600)).opacity(0.7) }
        }
        .padding(.horizontal, 16).padding(.top, 4)
    }

    /// Kortene i «Spill fra hver sin telefon»: bildet, navnet, antall og Pluss/Gratis
    private func stortKort(_ l: LekeKort) -> some View {
        VStack(alignment: .leading, spacing: 0) {
            ZStack {
                mint.opacity(0.35)
                if let b = l.bilde { Image(uiImage: b).resizable().scaledToFill() }
            }
            .frame(height: 92).clipped()
            VStack(alignment: .leading, spacing: 4) {
                Text(l.navn.uppercased()).font(.archivo(15, vekt: 900)).lineLimit(2).minimumScaleFactor(0.8).multilineTextAlignment(.leading)
                HStack(spacing: 6) {
                    HStack(spacing: 3) { Image(systemName: "person.2").font(.system(size: 11, weight: .bold)); Text(l.pl).font(.archivo(12, vekt: 700)) }.opacity(0.7)
                    merke(l.pluss)
                }
            }
            .padding(10).frame(maxWidth: .infinity, alignment: .leading)
        }
        .foregroundColor(blekk)
        .background(RoundedRectangle(cornerRadius: 14).fill(kort))
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(blekk, lineWidth: 2.5))
        .background(RoundedRectangle(cornerRadius: 14).fill(blekk).offset(x: 4, y: 4))
    }

    /// Radene i «Telefonen er kortstokken»: lite bilde, navn, antall og gruppa
    private func rad(_ l: LekeKort) -> some View {
        HStack(spacing: 12) {
            ZStack {
                mint.opacity(0.35)
                if let b = l.bilde { Image(uiImage: b).resizable().scaledToFill() }
            }
            .frame(width: 72, height: 44).clipShape(RoundedRectangle(cornerRadius: 8))
            VStack(alignment: .leading, spacing: 3) {
                Text(l.navn).font(.archivo(16, vekt: 800)).lineLimit(1)
                HStack(spacing: 8) {
                    HStack(spacing: 3) { Image(systemName: "person.2").font(.system(size: 11, weight: .bold)); Text(l.pl).font(.archivo(12, vekt: 700)) }.opacity(0.7)
                    if !l.gruppe.isEmpty { Text(l.gruppe).font(.archivo(12, vekt: 700)).opacity(0.6).lineLimit(1) }
                    if l.pluss { merke(true) }
                }
            }
            Spacer(minLength: 6)
            Image(systemName: "chevron.right").font(.system(size: 13, weight: .bold)).opacity(0.4)
        }
        .padding(10).foregroundColor(blekk)
        .background(RoundedRectangle(cornerRadius: 14).fill(kort))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(blekk, lineWidth: 2.5))
        .background(RoundedRectangle(cornerRadius: 14).fill(blekk).offset(x: 3, y: 3))
    }

    private func merke(_ pluss: Bool) -> some View {
        Text(pluss ? "✦ " + m.t("pluss") : m.t("gratis")).font(.archivo(11, vekt: 900))
            .padding(.horizontal, 7).frame(height: 20)
            .foregroundColor(pluss ? morkBlekk : blekk)
            .background(Capsule().fill(pluss ? gul : Color.clear))
            .overlay(Capsule().stroke(pluss ? morkBlekk : blekk.opacity(0.4), lineWidth: 1.5))
    }
}

private struct TrykkStil3: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .offset(x: configuration.isPressed ? 3 : 0, y: configuration.isPressed ? 3 : 0)
            .animation(.easeOut(duration: 0.08), value: configuration.isPressed)
    }
}

private extension View {
    @ViewBuilder func scrollDismissesKeyboardIfAvailable() -> some View {
        if #available(iOS 16.0, *) { self.scrollDismissesKeyboard(.interactively) } else { self }
    }
}
