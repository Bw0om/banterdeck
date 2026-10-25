import SwiftUI
import UIKit
import WebKit

/// Deg-fanen native: figuren din, Pluss, navnet i rommet, mørk modus, språk – og kontoen når du er logget inn.
/// Ligger over kontosiden (nettsiden), som sier fra hva den vet (window.__mvDeg / mv-skjerm «deg») og gjør jobben.
/// Dypere sider (gjengene, kortstokkene, innstillingene) er fortsatt nettsiden: da går denne skjermen bort, og
/// pila tilbake på nettsiden (eller et drag fra venstre kant) henter den igjen.
final class DegModell: ObservableObject {
    @Published var innlogget = false
    @Published var navn = ""          // navnet i rommet (huskes på telefonen)
    @Published var brukernavn = ""
    @Published var epost = ""
    @Published var gjeng = ""         // «2 gjenger: Hytta, Kollektivet» – tom til siden har hentet
    @Published var stokker = ""
    @Published var replikker = ""
    @Published var stat = false
    @Published var moerk = false
    @Published var plussAktiv = false
    @Published var plussTil = ""
    @Published var plussGratisBrukt = false
    @Published var plussGave = false
    @Published var plussKjent = false
    @Published var bilde: UIImage? = nil
    @Published var engelsk = false
    /// Navnefeltet har fokus: siden får ikke skrive over det du holder på å skrive
    var navnRedigeres = false
    weak var nett: WKWebView?
    /// Ting skallet gjør selv: «inn», «ny» (innloggingsarket), «figur» (figurarket), «pluss» (Pluss-arket)
    var handling: ((String) -> Void)?
    private var sistPng = ""

    func T(_ no: String, _ en: String) -> String { engelsk ? en : no }

    func sett(_ d: [String: Any]) {
        innlogget = d["innlogget"] as? Bool ?? false
        if !navnRedigeres { navn = d["navn"] as? String ?? "" }
        brukernavn = d["brukernavn"] as? String ?? ""
        epost = d["epost"] as? String ?? ""
        gjeng = d["gjeng"] as? String ?? ""
        stokker = d["stokker"] as? String ?? ""
        replikker = d["replikker"] as? String ?? ""
        stat = d["stat"] as? Bool ?? false
        moerk = d["moerk"] as? Bool ?? false
        if let p = d["pluss"] as? [String: Any] {
            plussKjent = true
            plussAktiv = p["aktiv"] as? Bool ?? false
            plussTil = p["til"] as? String ?? ""
            plussGratisBrukt = p["gratisBrukt"] as? Bool ?? false
            plussGave = p["gave"] as? Bool ?? false
        }
        if let p = d["png"] as? String, p != sistPng { sistPng = p; bilde = FigurData.bilde(p) }
    }

    /// Datoen Pluss varer til, slik iPhonen skriver den
    var plussTilTekst: String {
        let f = ISO8601DateFormatter(); f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        let g = ISO8601DateFormatter()
        guard let d = f.date(from: plussTil) ?? g.date(from: plussTil) else { return plussTil }
        let df = DateFormatter(); df.locale = Locale(identifier: engelsk ? "en_GB" : "nb_NO"); df.dateStyle = .long; df.timeStyle = .none
        return df.string(from: d)
    }

    // Nettsiden gjør jobben (window.__mvDeg i Account.astro)
    private func js(_ kall: String, _ arg: Any? = nil) {
        var json = ""
        if let a = arg, let data = try? JSONSerialization.data(withJSONObject: [a]), let s = String(data: data, encoding: .utf8) { json = s + "[0]" }
        nett?.evaluateJavaScript("window.__mvDeg && window.__mvDeg.\(kall)(\(json))", completionHandler: nil)
    }
    func lagreNavn() { js("navn", navn.trimmingCharacters(in: .whitespacesAndNewlines)) }
    func settMoerk(_ b: Bool) { UISelectionFeedbackGenerator().selectionChanged(); js("tema", b) }
    func visning(_ n: String) { UISelectionFeedbackGenerator().selectionChanged(); js("visning", n) }
    func gaa(_ url: String) { UISelectionFeedbackGenerator().selectionChanged(); js("gaa", url) }
    func siFra() { js("feil") }
    func byttSprak() { js("sprak") }
    func loggUt() { UINotificationFeedbackGenerator().notificationOccurred(.success); js("loggUt") }
}

struct DegSkjerm: View {
    @ObservedObject var m: DegModell
    @Environment(\.colorScheme) private var modus
    @FocusState private var navnFokus: Bool
    @State private var spoerLoggUt = false

    private var papir: Color { modus == .dark ? Color(red: 0.11, green: 0.106, blue: 0.122) : Color(red: 1, green: 0.973, blue: 0.933) }
    private var kort: Color { modus == .dark ? Color(red: 0.173, green: 0.169, blue: 0.188) : .white }
    private var blekk: Color { modus == .dark ? Color(red: 1, green: 0.973, blue: 0.933) : Color(red: 0.086, green: 0.071, blue: 0.059) }
    private let gul = Color(red: 1, green: 0.824, blue: 0.247)
    private let rust = Color(red: 0.776, green: 0.235, blue: 0.067)
    private let morkBlekk = Color(red: 0.086, green: 0.071, blue: 0.059)

    private var versjon: String {
        let i = Bundle.main.infoDictionary ?? [:]
        return "mittvors \(i["CFBundleShortVersionString"] as? String ?? "") (\(i["CFBundleVersion"] as? String ?? ""))"
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                Text(m.T("Deg", "You").uppercased()).font(.archivo(40, vekt: 900)).padding(.top, 8)

                figurKort

                gruppe(m.T("Innstillinger", "Settings")) {
                    // Navnet i rommet: skrives rett i rada, lagres når du går ut av feltet
                    HStack {
                        Text(m.T("Navnet ditt i rommet", "Your name in the room")).font(.archivo(17, vekt: 700))
                        Spacer(minLength: 12)
                        TextField(m.T("F.eks. Jonas", "E.g. Alex"), text: $m.navn)
                            .font(.archivo(17, vekt: 700)).multilineTextAlignment(.trailing)
                            .textContentType(.nickname).disableAutocorrection(true).submitLabel(.done)
                            .focused($navnFokus)
                            .onSubmit { m.lagreNavn() }
                            .onChange(of: navnFokus) { har in m.navnRedigeres = har; if !har { m.lagreNavn() } }
                            .frame(maxWidth: 160)
                    }
                    .padding(.horizontal, 16).frame(minHeight: 54)
                    strek
                    Toggle(isOn: Binding(get: { m.moerk }, set: { m.moerk = $0; m.settMoerk($0) })) {
                        Text(m.T("Mørk modus", "Dark mode")).font(.archivo(17, vekt: 700))
                    }
                    .tint(rust).padding(.horizontal, 16).frame(minHeight: 54)
                    strek
                    rad(m.T("English", "Norsk"), action: m.byttSprak)
                    strek
                    rad(m.T("Noe galt? Si fra", "Something wrong? Tell us"), action: m.siFra)
                }

                if m.innlogget {
                    gruppe(m.T("Kontoen", "Account")) {
                        rad(m.T("Gjengene", "Crews"), under: m.gjeng, action: { m.gaa(m.engelsk ? "/crew" : "/no/gjeng") })
                        strek
                        rad(m.T("Kortstokkene", "Decks"), verdi: m.stokker, action: { m.visning("stokker") })
                        strek
                        rad(m.T("Replikkene", "Lines"), verdi: m.replikker, action: { m.visning("replikker") })
                        if m.stat {
                            strek
                            rad(m.T("Statistikk", "Stats"), action: { m.gaa(m.engelsk ? "/stats" : "/no/statistikk") })
                        }
                        strek
                        rad(m.T("Verv en venn", "Refer a friend"), action: { m.visning("verv") })
                        strek
                        rad(m.T("Brukernavn, passord og e-post", "Username, password and email"), under: m.epost, action: { m.visning("innstillinger") })
                    }

                    Button(action: { spoerLoggUt = true }) {
                        Text(m.T("Logg ut", "Sign out")).font(.archivo(17, vekt: 800)).foregroundColor(rust)
                            .frame(maxWidth: .infinity).frame(height: 54)
                            .background(RoundedRectangle(cornerRadius: 14).fill(kort))
                            .overlay(RoundedRectangle(cornerRadius: 14).stroke(blekk.opacity(0.2), lineWidth: 1.5))
                    }
                    .confirmationDialog(m.T("Logge ut?", "Sign out?"), isPresented: $spoerLoggUt, titleVisibility: .visible) {
                        Button(m.T("Logg ut", "Sign out"), role: .destructive, action: m.loggUt)
                        Button(m.T("Avbryt", "Cancel"), role: .cancel) {}
                    }
                }

                Text(versjon).font(.archivo(12, vekt: 600)).opacity(0.5).frame(maxWidth: .infinity).padding(.top, 6)
            }
            .padding(.horizontal, 16).padding(.bottom, 110)   // plass til fanelinja
        }
        .background(papir.ignoresSafeArea())
        .foregroundColor(blekk)
        .scrollDismissesKeyboardIfAvailable()
    }

    /// Figuren din: bildet, navnet – og Logg inn/Ny konto, eller Figuren din/Pluss når du er inne
    private var figurKort: some View {
        HStack(alignment: .center, spacing: 14) {
            Group {
                if let b = m.bilde { Image(uiImage: b).resizable().scaledToFit() } else { Color.clear }
            }
            .frame(width: 96, height: 106)
            VStack(alignment: .leading, spacing: 8) {
                Text(m.innlogget ? (m.brukernavn.isEmpty ? m.T("Du", "You") : m.brukernavn) : (m.navn.isEmpty ? m.T("Figuren din", "Your figure") : m.navn))
                    .font(.archivo(22, vekt: 900)).lineLimit(1).minimumScaleFactor(0.7)
                if m.innlogget {
                    Button(action: { m.handling?("figur") }) { knappTekst(m.T("Figuren din", "Your figure"), gul: true) }.buttonStyle(TrykkStil2())
                    Button(action: { m.handling?("pluss") }) {
                        HStack(spacing: 6) {
                            Text("✨")
                            Text(plussTekst).font(.archivo(14, vekt: 700)).lineLimit(2).multilineTextAlignment(.leading)
                        }
                        .foregroundColor(blekk).opacity(m.plussKjent ? 1 : 0.5)
                    }
                    .buttonStyle(.plain)
                } else {
                    Text(m.T("Logg inn, så blir figuren din – og alt du låser opp følger med.", "Sign in and the figure is yours – everything you unlock comes along."))
                        .font(.archivo(13, vekt: 600)).opacity(0.75)
                    HStack(spacing: 8) {
                        Button(action: { m.handling?("inn") }) { knappTekst(m.T("Logg inn", "Sign in"), gul: true) }.buttonStyle(TrykkStil2())
                        Button(action: { m.handling?("ny") }) { knappTekst(m.T("Ny konto", "New account"), gul: false) }.buttonStyle(TrykkStil2())
                    }
                }
            }
            Spacer(minLength: 0)
        }
        .padding(16)
        .background(RoundedRectangle(cornerRadius: 18).fill(kort))
        .overlay(RoundedRectangle(cornerRadius: 18).stroke(blekk, lineWidth: 3))
        .background(RoundedRectangle(cornerRadius: 18).fill(blekk).offset(x: 5, y: 5))
    }

    private var plussTekst: String {
        if !m.plussKjent { return m.T("Henter Pluss …", "Checking Pluss…") }
        if m.plussGave { return m.T("Du har en gavekode som venter", "You have a gift code waiting") }
        if m.plussAktiv { return m.T("Pluss til ", "Pluss until ") + m.plussTilTekst }
        return m.plussGratisBrukt ? m.T("Få mittvors pluss", "Get mittvors pluss") : m.T("Prøv mittvors pluss gratis i kveld", "Try mittvors pluss free tonight")
    }

    private func knappTekst(_ t: String, gul erGul: Bool) -> some View {
        Text(t.uppercased()).font(.archivo(14, vekt: 900))
            .padding(.horizontal, 14).frame(height: 40).foregroundColor(erGul ? morkBlekk : blekk)
            .background(
                ZStack {
                    RoundedRectangle(cornerRadius: 10).fill(blekk).offset(x: 3, y: 3)
                    RoundedRectangle(cornerRadius: 10).fill(erGul ? gul : kort)
                    RoundedRectangle(cornerRadius: 10).stroke(blekk, lineWidth: 2.5)
                }
            )
    }

    private var strek: some View { Rectangle().fill(blekk.opacity(0.12)).frame(height: 1).padding(.leading, 16) }

    private func gruppe<V: View>(_ tittel: String, @ViewBuilder _ inn: () -> V) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(tittel.uppercased()).font(.archivo(12, vekt: 900)).opacity(0.55).padding(.leading, 4)
            VStack(spacing: 0) { inn() }
                .background(RoundedRectangle(cornerRadius: 16).fill(kort))
                .overlay(RoundedRectangle(cornerRadius: 16).stroke(blekk.opacity(0.2), lineWidth: 1.5))
        }
    }

    /// En rad med pil: tittel, en verdi til høyre (tall) eller en linje under (gjengene, e-posten)
    private func rad(_ tittel: String, verdi: String = "", under: String = "", action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: 10) {
                VStack(alignment: .leading, spacing: 2) {
                    Text(tittel).font(.archivo(17, vekt: 700))
                    if !under.isEmpty { Text(under).font(.archivo(13, vekt: 600)).opacity(0.6).lineLimit(1) }
                }
                Spacer(minLength: 8)
                if !verdi.isEmpty { Text(verdi).font(.archivo(16, vekt: 700)).opacity(0.6) }
                Image(systemName: "chevron.right").font(.system(size: 14, weight: .bold)).opacity(0.4)
            }
            .padding(.horizontal, 16).frame(minHeight: 54).contentShape(Rectangle())
        }
        .buttonStyle(.plain).foregroundColor(blekk)
    }
}

private struct TrykkStil2: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .offset(x: configuration.isPressed ? 2 : 0, y: configuration.isPressed ? 2 : 0)
            .animation(.easeOut(duration: 0.08), value: configuration.isPressed)
    }
}

private extension View {
    @ViewBuilder func scrollDismissesKeyboardIfAvailable() -> some View {
        if #available(iOS 16.0, *) { self.scrollDismissesKeyboard(.interactively) } else { self }
    }
}
