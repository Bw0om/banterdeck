import SwiftUI
import UIKit
import WebKit

/// Deg-fanen native: figuren din, Pluss, navnet i rommet, mørk modus, språk – og kontoen når du er logget inn.
/// Ligger over kontosiden (nettsiden), som sier fra hva den vet (window.__mvDeg / mv-skjerm «deg») og gjør jobben.
/// Undersidene (innstillingene, vervingen, replikkene, kortstokkene) er også native og glir inn fra høyre; nettsiden
/// svarer med {ok, melding} på hvert kall. Gjengene og statistikken er fortsatt nettsider: da går denne skjermen bort.
struct DegReplikk: Identifiable {
    let id: Int, line: String, ctx: String
}

struct DegStokk: Identifiable {
    let id: String, navn: String, kort: [String], delt: Bool, farge: Color
    init?(_ d: [String: Any]) {
        guard let id = d["id"] as? String ?? (d["id"] as? Int).map(String.init), let navn = d["navn"] as? String else { return nil }
        self.id = id; self.navn = navn
        kort = d["kort"] as? [String] ?? []
        delt = d["delt"] as? Bool ?? false
        farge = Color(hex: d["farge"] as? String ?? "#FFD23F")
    }
}

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
    /// Undersiden som vises: profil, innstillinger, verv, replikker, stokker
    @Published var visning = "profil"
    @Published var replikkListe: [DegReplikk] = []
    @Published var stokkListe: [DegStokk] = []
    @Published var utkast: (n: Int, navn: String)? = nil
    @Published var verv: (kode: String, antall: Int, kveldspass: Int)? = nil
    @Published var tekst: [String: Any] = [:]
    /// Navnefeltet har fokus: siden får ikke skrive over det du holder på å skrive
    var navnRedigeres = false
    /// Undersiden ble valgt her for et øyeblikk siden: en gammel melding fra siden skal ikke flytte oss tilbake
    private var visningSatt = Date.distantPast
    weak var nett: WKWebView?
    /// Ting skallet gjør selv: «inn», «ny» (innloggingsarket), «figur» (figurarket), «pluss» (Pluss-arket)
    var handling: ((String) -> Void)?
    private var sistPng = ""

    func T(_ no: String, _ en: String) -> String { engelsk ? en : no }
    func t(_ k: String) -> String { tekst[k] as? String ?? k }
    var ideer: [[String]] { tekst["ideer"] as? [[String]] ?? [] }

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
        if let t = d["tekst"] as? [String: Any], !t.isEmpty { tekst = t }
        if let p = d["pluss"] as? [String: Any] {
            plussKjent = true
            plussAktiv = p["aktiv"] as? Bool ?? false
            plussTil = p["til"] as? String ?? ""
            plussGratisBrukt = p["gratisBrukt"] as? Bool ?? false
            plussGave = p["gave"] as? Bool ?? false
        }
        if let p = d["png"] as? String, p != sistPng { sistPng = p; bilde = FigurData.bilde(p) }
        replikkListe = (d["replikkListe"] as? [[String: Any]] ?? []).enumerated().map { i, r in DegReplikk(id: i, line: r["line"] as? String ?? "", ctx: r["ctx"] as? String ?? "") }
        stokkListe = (d["stokkListe"] as? [[String: Any]] ?? []).compactMap(DegStokk.init)
        if let u = d["utkast"] as? [String: Any], let n = u["n"] as? Int, n > 0 { utkast = (n, u["navn"] as? String ?? "") } else { utkast = nil }
        if let v = d["verv"] as? [String: Any], let k = v["kode"] as? String { verv = (k, v["antall"] as? Int ?? 0, v["kveldspass"] as? Int ?? 0) } else { verv = nil }
        let v = d["visning"] as? String ?? "profil"
        if v != visning && Date().timeIntervalSince(visningSatt) > 1.5 { visning = innlogget ? v : "profil" }
        if !innlogget { visning = "profil" }
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
    /// Et kall som svarer: nettsiden gir {ok, melding, …} tilbake når jobben er gjort (lagret, slettet …)
    func kall(_ navn: String, _ args: [Any] = [], _ ferdig: @escaping ([String: Any]) -> Void) {
        guard let nett = nett else { ferdig(["ok": false]); return }
        nett.callAsyncJavaScript("if (!window.__mvDeg || !window.__mvDeg[navn]) return { ok: false }; return await window.__mvDeg[navn].apply(window.__mvDeg, args);",
                                 arguments: ["navn": navn, "args": args], in: nil, in: .page) { r in
            DispatchQueue.main.async {
                switch r {
                case .success(let v): ferdig(v as? [String: Any] ?? ["ok": true])
                case .failure(let e): ferdig(["ok": false, "melding": e.localizedDescription])
                }
            }
        }
    }
    func lagreNavn() { js("navn", navn.trimmingCharacters(in: .whitespacesAndNewlines)) }
    func settMoerk(_ b: Bool) { UISelectionFeedbackGenerator().selectionChanged(); js("tema", b) }
    func visning(_ n: String) { UISelectionFeedbackGenerator().selectionChanged(); visningSatt = Date(); visning = n; js("visning", n) }
    func gaa(_ url: String) { UISelectionFeedbackGenerator().selectionChanged(); js("gaa", url) }
    func siFra() { js("feil") }
    func byttSprak() { js("sprak") }
    func loggUt() { UINotificationFeedbackGenerator().notificationOccurred(.success); js("loggUt") }
    /// En kort beskjed nederst (skallets toast) – det nettsiden ellers skriver i sin egen melding
    func toast(_ t: String) { if !t.isEmpty { SkallViewController.delt?.visToast(t) } }
    /// Svaret fra nettsiden som toast: meldingen om den er der, og et lite dunk ved feil
    func svar(_ r: [String: Any]) {
        let ok = r["ok"] as? Bool ?? false
        if !ok { UINotificationFeedbackGenerator().notificationOccurred(.warning) }
        toast(r["melding"] as? String ?? (ok ? "" : T("Noe gikk galt. Prøv igjen.", "Something went wrong. Try again.")))
    }
}

struct DegSkjerm: View {
    @ObservedObject var m: DegModell
    @Environment(\.colorScheme) private var modus
    @FocusState private var navnFokus: Bool
    @State private var spoerLoggUt = false
    /// Sveip fra venstre kant på en underside = tilbake
    @State private var kantDrag: CGFloat = 0
    private let fjaer = Animation.spring(response: 0.42, dampingFraction: 0.88)

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
        ZStack {
            profil
            if m.visning != "profil" {
                underside
                    .offset(x: kantDrag)
                    .transition(.move(edge: .trailing))
                    .zIndex(1)
                    .simultaneousGesture(
                        DragGesture(minimumDistance: 12, coordinateSpace: .global)
                            .onChanged { g in if g.startLocation.x < 28 && g.translation.width > 0 { kantDrag = g.translation.width * 0.6 } }
                            .onEnded { g in
                                let tilbake = g.startLocation.x < 28 && (g.translation.width > 90 || g.predictedEndTranslation.width > 220)
                                withAnimation(.spring(response: 0.3, dampingFraction: 0.9)) { kantDrag = 0 }
                                if tilbake { m.visning("profil") }
                            }
                    )
            }
        }
        .animation(fjaer, value: m.visning)
        .background(papir.ignoresSafeArea())
        .foregroundColor(blekk)
    }

    // MARK: Forsiden i Deg
    private var profil: some View {
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
        .scrollDismissesKeyboardIfAvailable()
    }

    // MARK: Undersidene
    @ViewBuilder private var underside: some View {
        switch m.visning {
        case "innstillinger": DegUnderside(m: m, tittel: m.t("innstillinger")) { InnstillingerVisning(m: m) }
        case "verv": DegUnderside(m: m, tittel: m.t("verv")) { VervVisning(m: m) }
        case "replikker": DegUnderside(m: m, tittel: m.t("replikker")) { ReplikkerVisning(m: m) }
        case "stokker": StokkerVisning(m: m)
        default: DegUnderside(m: m, tittel: "") { EmptyView() }
        }
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

// MARK: - Felles for undersidene

/// Ramma rundt en underside: pil tilbake og tittel øverst, innholdet i en rulleflate
struct DegUnderside<Innhold: View>: View {
    @ObservedObject var m: DegModell
    let tittel: String
    @ViewBuilder let innhold: () -> Innhold
    @Environment(\.colorScheme) private var modus
    private var papir: Color { modus == .dark ? Color(red: 0.11, green: 0.106, blue: 0.122) : Color(red: 1, green: 0.973, blue: 0.933) }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                DegTopp(tittel: tittel, tilbake: m.T("Tilbake", "Back")) { m.visning("profil") }
                innhold()
            }
            .padding(.horizontal, 16).padding(.bottom, 110)
        }
        .background(papir.ignoresSafeArea())
        .scrollDismissesKeyboardIfAvailable()
    }
}

/// Pila tilbake og tittelen på en underside
struct DegTopp: View {
    let tittel: String
    let tilbake: String
    let handling: () -> Void
    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Button(action: handling) {
                HStack(spacing: 4) {
                    Image(systemName: "chevron.left").font(.system(size: 17, weight: .bold))
                    Text(tilbake).font(.archivo(16, vekt: 800))
                }
                .frame(minHeight: 44).padding(.trailing, 12).contentShape(Rectangle())
            }
            .buttonStyle(.plain).accessibilityLabel(tilbake)
            Text(tittel.uppercased()).font(.archivo(32, vekt: 900)).fixedSize(horizontal: false, vertical: true)
        }
        .padding(.top, 4)
    }
}

/// Fargene og knappene undersidene deler
struct DegStil {
    let modus: ColorScheme
    var papir: Color { modus == .dark ? Color(red: 0.11, green: 0.106, blue: 0.122) : Color(red: 1, green: 0.973, blue: 0.933) }
    var kort: Color { modus == .dark ? Color(red: 0.173, green: 0.169, blue: 0.188) : .white }
    var blekk: Color { modus == .dark ? Color(red: 1, green: 0.973, blue: 0.933) : Color(red: 0.086, green: 0.071, blue: 0.059) }
    let gul = Color(red: 1, green: 0.824, blue: 0.247)
    let rust = Color(red: 0.776, green: 0.235, blue: 0.067)
    let mint = Color(red: 0.388, green: 0.886, blue: 0.659)
    let rosa = Color(red: 1, green: 0.612, blue: 0.761)
    let oransje = Color(red: 1, green: 0.357, blue: 0.122)
    let morkBlekk = Color(red: 0.086, green: 0.071, blue: 0.059)

    /// Den gule hovedknappen med strek og hard skygge
    func stor(_ t: String, gul erGul: Bool = true, hoyde: CGFloat = 56) -> some View {
        Text(t.uppercased()).font(.archivo(17, vekt: 900)).lineLimit(1).minimumScaleFactor(0.8)
            .frame(maxWidth: .infinity).frame(height: hoyde).foregroundColor(erGul ? morkBlekk : blekk)
            .background(RoundedRectangle(cornerRadius: 14).fill(erGul ? gul : kort))
            .overlay(RoundedRectangle(cornerRadius: 14).stroke(morkBlekk, lineWidth: 3))
            .background(RoundedRectangle(cornerRadius: 14).fill(morkBlekk).offset(x: 4, y: 4))
    }
    /// En stille knapp: lys flate, tynn strek
    func stille(_ t: String, farge: Color? = nil) -> some View {
        Text(t).font(.archivo(15, vekt: 800)).lineLimit(1)
            .frame(maxWidth: .infinity).frame(height: 48).foregroundColor(farge ?? blekk)
            .background(RoundedRectangle(cornerRadius: 12).fill(kort))
            .overlay(RoundedRectangle(cornerRadius: 12).stroke(blekk.opacity(0.3), lineWidth: 1.5))
    }
    /// Et skrivefelt i appens stil
    func felt<V: View>(_ v: V) -> some View {
        v.padding(.horizontal, 14).frame(minHeight: 50)
            .background(RoundedRectangle(cornerRadius: 12).fill(kort))
            .overlay(RoundedRectangle(cornerRadius: 12).stroke(blekk, lineWidth: 2.5))
    }
}

/// Et skrivefelt som vokser med teksten (iOS 16); på iOS 15 et vanlig felt
struct FlerlinjeFelt: View {
    let plassholder: String
    @Binding var tekst: String
    var linjer: Int = 1
    var body: some View {
        if #available(iOS 16.0, *) {
            TextField(plassholder, text: $tekst, axis: .vertical).lineLimit(linjer...5)
        } else {
            TextField(plassholder, text: $tekst)
        }
    }
}

/// Knappen trykkes ned i skyggen sin
struct TrykkStilDeg: ButtonStyle {
    var flytt: CGFloat = 3
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .offset(x: configuration.isPressed ? flytt : 0, y: configuration.isPressed ? flytt : 0)
            .animation(.spring(response: 0.18, dampingFraction: 0.9), value: configuration.isPressed)
    }
}

/// iPhone-dialog med skrivefelt (UIAlertController – SwiftUI har ikke felt i .alert før iOS 16)
enum DegDialog {
    static func vis(tittel: String, melding: String?, felt: [(plassholder: String, verdi: String, skjult: Bool, store: Bool)], knapp: String, avbryt: String, fare: Bool = false, ferdig: @escaping ([String]) -> Void) {
        let a = UIAlertController(title: tittel, message: melding, preferredStyle: .alert)
        for f in felt {
            a.addTextField { tf in
                tf.placeholder = f.plassholder; tf.text = f.verdi; tf.isSecureTextEntry = f.skjult
                tf.autocorrectionType = .no; tf.autocapitalizationType = f.store ? .allCharacters : .none
                if f.skjult { tf.textContentType = .newPassword }
            }
        }
        a.addAction(UIAlertAction(title: avbryt, style: .cancel))
        a.addAction(UIAlertAction(title: knapp, style: fare ? .destructive : .default) { _ in ferdig((a.textFields ?? []).map { $0.text ?? "" }) })
        guard let s = SkallViewController.delt else { return }
        var vc: UIViewController = s
        while let p = vc.presentedViewController { vc = p }
        vc.present(a, animated: true)
    }
}

extension Color {
    /// «#FFD23F» → farge (nettsidens stokkfarger)
    init(hex: String) {
        var h = hex.trimmingCharacters(in: .whitespaces); if h.hasPrefix("#") { h.removeFirst() }
        var v: UInt64 = 0; Scanner(string: h).scanHexInt64(&v)
        if h.count == 6 { self.init(red: Double((v >> 16) & 0xFF) / 255, green: Double((v >> 8) & 0xFF) / 255, blue: Double(v & 0xFF) / 255) }
        else { self.init(red: 1, green: 0.824, blue: 0.247) }
    }
}

// MARK: - Innstillinger: brukernavn, passord, e-post, logg ut, slett

struct InnstillingerVisning: View {
    @ObservedObject var m: DegModell
    @Environment(\.colorScheme) private var modus
    @State private var spoerSlett = false
    @State private var spoerLoggUt = false
    private var s: DegStil { DegStil(modus: modus) }

    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            VStack(spacing: 0) {
                rad(m.t("brukernavn"), verdi: m.brukernavn, pil: true) {
                    DegDialog.vis(tittel: m.brukernavn.isEmpty ? m.t("velgBrukernavn") : m.t("endreBrukernavn"), melding: m.t("brukernavnLead"),
                                  felt: [(m.t("brukernavn"), m.brukernavn, false, false)], knapp: m.t("lagre"), avbryt: m.t("avbryt")) { v in
                        m.kall("brukernavn", [v.first ?? ""]) { m.svar($0) }
                    }
                }
                strek
                rad(m.t("passord"), verdi: "••••••••", pil: true) {
                    DegDialog.vis(tittel: m.t("nyttPassord"), melding: m.t("passordLead"), felt: [(m.t("passord"), "", true, false)], knapp: m.t("lagre"), avbryt: m.t("avbryt")) { v in
                        m.kall("passord", [v.first ?? ""]) { m.svar($0) }
                    }
                }
                strek
                rad(m.t("epost"), verdi: m.epost, pil: false) {}
                if m.stat {
                    strek
                    rad(m.t("statistikk"), verdi: "", pil: true) { m.gaa(m.engelsk ? "/stats" : "/no/statistikk") }
                }
            }
            .background(RoundedRectangle(cornerRadius: 16).fill(s.kort))
            .overlay(RoundedRectangle(cornerRadius: 16).stroke(s.blekk.opacity(0.2), lineWidth: 1.5))

            Button(action: { m.visning("verv") }) {
                HStack(spacing: 12) {
                    Text("🎁").font(.system(size: 26))
                    VStack(alignment: .leading, spacing: 2) {
                        Text(m.t("verv")).font(.archivo(16, vekt: 800))
                        Text(m.T("Gratis kveld til dere begge", "A free night for you both")).font(.archivo(13, vekt: 600)).opacity(0.7)
                    }
                    Spacer(minLength: 8)
                    Text(m.T("Del", "Share").uppercased()).font(.archivo(12, vekt: 900)).padding(.horizontal, 10).frame(height: 30).foregroundColor(s.morkBlekk)
                        .background(Capsule().fill(s.gul)).overlay(Capsule().stroke(s.morkBlekk, lineWidth: 2))
                }
                .padding(14).foregroundColor(s.blekk)
                .background(RoundedRectangle(cornerRadius: 16).fill(s.oransje.opacity(modus == .dark ? 0.25 : 0.18)))
                .overlay(RoundedRectangle(cornerRadius: 16).stroke(s.blekk, lineWidth: 2.5))
            }
            .buttonStyle(TrykkStilDeg(flytt: 2))

            VStack(spacing: 0) {
                rad(m.t("loggUt"), verdi: "", pil: false, farge: s.rust) { spoerLoggUt = true }
                strek
                rad(m.t("slett"), verdi: "", pil: false, farge: s.rust) { spoerSlett = true }
            }
            .background(RoundedRectangle(cornerRadius: 16).fill(s.kort))
            .overlay(RoundedRectangle(cornerRadius: 16).stroke(s.blekk.opacity(0.2), lineWidth: 1.5))
            .confirmationDialog(m.T("Logge ut?", "Sign out?"), isPresented: $spoerLoggUt, titleVisibility: .visible) {
                Button(m.t("loggUt"), role: .destructive, action: m.loggUt)
                Button(m.t("avbryt"), role: .cancel) {}
            }
            .confirmationDialog(m.t("slett"), isPresented: $spoerSlett, titleVisibility: .visible) {
                Button(m.t("slett"), role: .destructive) {
                    // Andre steg: skriv SLETT, som på nettsiden
                    DegDialog.vis(tittel: m.t("slett"), melding: m.t("slettLead") + "\n\n" + m.t("slettSkriv"), felt: [(m.t("slettOrd"), "", false, true)], knapp: m.t("slett"), avbryt: m.t("avbryt"), fare: true) { v in
                        let ord = (v.first ?? "").trimmingCharacters(in: .whitespaces).uppercased()
                        guard ord == "SLETT" || ord == "DELETE" else { m.toast(m.t("slettSkriv")); return }
                        m.kall("slett") { m.svar($0) }
                    }
                }
                Button(m.t("avbryt"), role: .cancel) {}
            } message: { Text(m.t("slettLead")) }
        }
    }

    private var strek: some View { Rectangle().fill(s.blekk.opacity(0.12)).frame(height: 1).padding(.leading, 16) }

    private func rad(_ tittel: String, verdi: String, pil: Bool, farge: Color? = nil, action: @escaping () -> Void) -> some View {
        Button(action: { if pil || farge != nil { UISelectionFeedbackGenerator().selectionChanged() }; action() }) {
            HStack(spacing: 10) {
                Text(tittel).font(.archivo(17, vekt: 700)).foregroundColor(farge ?? s.blekk)
                Spacer(minLength: 8)
                if !verdi.isEmpty { Text(verdi).font(.archivo(15, vekt: 700)).opacity(0.6).lineLimit(1).truncationMode(.middle).frame(maxWidth: 170, alignment: .trailing) }
                if pil { Image(systemName: "chevron.right").font(.system(size: 14, weight: .bold)).opacity(0.4) }
            }
            .padding(.horizontal, 16).frame(minHeight: 54).contentShape(Rectangle())
        }
        .buttonStyle(.plain).foregroundColor(s.blekk)
    }
}

// MARK: - Verv en venn

struct VervVisning: View {
    @ObservedObject var m: DegModell
    @Environment(\.colorScheme) private var modus
    @State private var jobber = false
    private var s: DegStil { DegStil(modus: modus) }

    private var tekst: String {
        guard let v = m.verv else { return m.t("vervHenter") }
        let en = m.engelsk
        var t = v.antall > 0
            ? (en ? "You’ve referred \(v.antall) \(v.antall == 1 ? "friend" : "friends"). " : "Du har vervet \(v.antall) \(v.antall == 1 ? "venn" : "venner"). ")
            : m.t("vervLead") + " "
        if v.kveldspass > 0 { t += en ? "You have \(v.kveldspass) \(v.kveldspass == 1 ? "night pass" : "night passes") saved up." : "Du har \(v.kveldspass) kveldspass på lur." }
        return t
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("🎁").font(.system(size: 44))
            Text(tekst).font(.archivo(17, vekt: 600)).lineSpacing(3).fixedSize(horizontal: false, vertical: true)
            Button(action: { m.kall("vervDel") { m.svar($0) } }) { s.stor(m.t("vervDel")) }
                .buttonStyle(TrykkStilDeg()).disabled(m.verv == nil).opacity(m.verv == nil ? 0.5 : 1).padding(.top, 6).padding(.trailing, 4)
            if let v = m.verv, v.kveldspass > 0 {
                Button(action: { jobber = true; m.kall("vervBruk") { jobber = false; m.svar($0) } }) { s.stille(m.t("vervBruk")) }
                    .buttonStyle(TrykkStilDeg(flytt: 1)).disabled(jobber)
            }
        }
        .padding(18)
        .background(RoundedRectangle(cornerRadius: 18).fill(s.kort))
        .overlay(RoundedRectangle(cornerRadius: 18).stroke(s.blekk, lineWidth: 3))
        .background(RoundedRectangle(cornerRadius: 18).fill(s.blekk).offset(x: 5, y: 5))
        .padding(.trailing, 5)
    }
}

// MARK: - Replikkene: boblene dine, og en ny nederst

struct ReplikkerVisning: View {
    @ObservedObject var m: DegModell
    @Environment(\.colorScheme) private var modus
    @State private var linje = ""
    @State private var naar = ""
    @FocusState private var fokus: Bool
    private var s: DegStil { DegStil(modus: modus) }
    private let farger: [Color] = [Color(red: 1, green: 0.824, blue: 0.247), .white, Color(red: 0.388, green: 0.886, blue: 0.659), Color(red: 1, green: 0.612, blue: 0.761), .white, Color(red: 0.353, green: 0.553, blue: 0.933)]

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            if m.replikkListe.isEmpty {
                Text(m.t("replikkTom")).font(.archivo(15, vekt: 600)).opacity(0.7).fixedSize(horizontal: false, vertical: true)
            }
            // Nyeste øverst, som på nettsiden
            ForEach(m.replikkListe.reversed()) { r in
                Button(action: {
                    UIPasteboard.general.string = r.line
                    UIImpactFeedbackGenerator(style: .light).impactOccurred()
                    m.toast(m.t("kopiert"))
                }) {
                    HStack(alignment: .top, spacing: 10) {
                        VStack(alignment: .leading, spacing: 4) {
                            if !r.ctx.isEmpty { Text(r.ctx).font(.archivo(12, vekt: 800)).opacity(0.65) }
                            Text("«\(r.line)»").font(.archivo(17, vekt: 650)).lineSpacing(2).fixedSize(horizontal: false, vertical: true).multilineTextAlignment(.leading)
                        }
                        Spacer(minLength: 6)
                        Button(action: { m.kall("replikkSlett", [r.id]) { m.svar($0) } }) {
                            Image(systemName: "xmark").font(.system(size: 13, weight: .bold)).frame(width: 32, height: 32)
                                .background(Circle().fill(s.kort)).overlay(Circle().stroke(s.morkBlekk, lineWidth: 2))
                        }
                        .buttonStyle(.plain).accessibilityLabel(m.t("slettStokk"))
                    }
                    .padding(14).foregroundColor(s.morkBlekk)
                    .background(RoundedRectangle(cornerRadius: 16).fill(farger[r.id % farger.count]))
                    .overlay(RoundedRectangle(cornerRadius: 16).stroke(s.morkBlekk, lineWidth: 2.5))
                    .background(RoundedRectangle(cornerRadius: 16).fill(s.blekk).offset(x: 4, y: 4))
                }
                .buttonStyle(TrykkStilDeg(flytt: 2))
                .transition(.opacity.combined(with: .scale(scale: 0.96)))
            }

            // Ny replikk
            VStack(alignment: .leading, spacing: 10) {
                Text(m.t("replikkNy").uppercased()).font(.archivo(12, vekt: 900)).opacity(0.55)
                s.felt(FlerlinjeFelt(plassholder: m.t("replikkLinje"), tekst: $linje).font(.archivo(17, vekt: 650)).focused($fokus))
                s.felt(TextField(m.t("replikkNaar"), text: $naar).font(.archivo(15, vekt: 600)))
                Button(action: {
                    let l = linje.trimmingCharacters(in: .whitespacesAndNewlines); guard !l.isEmpty else { fokus = true; return }
                    UIImpactFeedbackGenerator(style: .medium).impactOccurred()
                    m.kall("replikkNy", [l, naar.trimmingCharacters(in: .whitespacesAndNewlines)]) { r in if r["ok"] as? Bool == true { linje = ""; naar = "" } else { m.svar(r) } }
                }) { s.stor(m.t("replikkLegg")) }
                .buttonStyle(TrykkStilDeg()).padding(.trailing, 4).padding(.top, 2)
            }
            .padding(.top, 10)
        }
        .padding(.trailing, 4)
        .animation(.spring(response: 0.35, dampingFraction: 0.88), value: m.replikkListe.count)
    }
}

// MARK: - Kortstokkene: bunkene, arket, skjemaet og spill alene

struct StokkerVisning: View {
    @ObservedObject var m: DegModell
    @Environment(\.colorScheme) private var modus
    @State private var valgt: DegStokk? = nil       // bunken arket gjelder
    @State private var spoerSlett: DegStokk? = nil
    @State private var redigerer: StokkUtkast? = nil  // skjemaet er oppe
    @State private var spiller: DegStokk? = nil     // spill alene
    private var s: DegStil { DegStil(modus: modus) }

    var body: some View {
        ZStack {
            if let u = redigerer {
                StokkSkjema(m: m, start: u, lukk: { redigerer = nil }, spill: { st in spiller = st })
                    .transition(.move(edge: .trailing)).zIndex(2)
            } else {
                liste.transition(.opacity)
            }
            if let st = spiller {
                StokkSpill(m: m, stokk: st) { spiller = nil }.transition(.move(edge: .bottom)).zIndex(3)
            }
        }
        .animation(.spring(response: 0.42, dampingFraction: 0.88), value: redigerer == nil)
        .animation(.spring(response: 0.42, dampingFraction: 0.88), value: spiller == nil)
        .background(s.papir.ignoresSafeArea())
    }

    private var liste: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                DegTopp(tittel: m.t("stokker"), tilbake: m.T("Tilbake", "Back")) { m.visning("profil") }

                if let u = m.utkast {
                    HStack(spacing: 12) {
                        (Text("\(u.n) ").font(.archivo(16, vekt: 900)) + Text(m.t("utkast")).font(.archivo(14, vekt: 600))).fixedSize(horizontal: false, vertical: true)
                        Spacer(minLength: 8)
                        Button(action: { m.kall("utkastLagre") { m.svar($0) } }) {
                            Text(m.t("utkastLagre").uppercased()).font(.archivo(12, vekt: 900)).padding(.horizontal, 12).frame(height: 34).foregroundColor(s.morkBlekk)
                                .background(Capsule().fill(s.gul)).overlay(Capsule().stroke(s.morkBlekk, lineWidth: 2))
                        }
                        .buttonStyle(TrykkStilDeg(flytt: 1))
                    }
                    .padding(14)
                    .background(RoundedRectangle(cornerRadius: 14).fill(s.rosa.opacity(modus == .dark ? 0.3 : 0.4)))
                    .overlay(RoundedRectangle(cornerRadius: 14).stroke(s.blekk, lineWidth: 2))
                }

                if m.stokkListe.isEmpty {
                    Text(m.t("stokkTom")).font(.archivo(15, vekt: 600)).opacity(0.7).fixedSize(horizontal: false, vertical: true)
                }

                LazyVGrid(columns: [GridItem(.flexible(), spacing: 14), GridItem(.flexible(), spacing: 14)], spacing: 18) {
                    ForEach(m.stokkListe) { st in bunke(st) }
                    Button(action: { UISelectionFeedbackGenerator().selectionChanged(); redigerer = StokkUtkast(id: nil, navn: "", kort: [], farge: StokkUtkast.farger[m.stokkListe.count % StokkUtkast.farger.count]) }) {
                        VStack(spacing: 6) {
                            Image(systemName: "plus").font(.system(size: 26, weight: .black))
                            Text(m.t("stokkNy").uppercased()).font(.archivo(14, vekt: 900))
                        }
                        .frame(maxWidth: .infinity).frame(height: 128).foregroundColor(s.blekk)
                        .background(RoundedRectangle(cornerRadius: 14).fill(s.kort))
                        .overlay(RoundedRectangle(cornerRadius: 14).stroke(s.blekk, style: StrokeStyle(lineWidth: 2.5, dash: [7, 5])))
                    }
                    .buttonStyle(TrykkStilDeg(flytt: 2))
                }
                .padding(.trailing, 6)
            }
            .padding(.horizontal, 16).padding(.bottom, 110)
        }
        .confirmationDialog(valgt?.navn ?? "", isPresented: Binding(get: { valgt != nil }, set: { if !$0 { valgt = nil } }), titleVisibility: .visible) {
            if let st = valgt {
                Button(m.t("spillHer")) { spiller = st }
                Button(m.t("spillRom")) { m.kall("stokkRom", [st.id]) { m.svar($0) } }
                Button(m.t("del")) { m.kall("stokkDel", [st.id]) { m.svar($0) } }
                Button(m.t("endre")) { redigerer = StokkUtkast(id: st.id, navn: st.navn, kort: st.kort, farge: st.farge) }
                Button(m.t("slettStokk"), role: .destructive) { spoerSlett = st }
                Button(m.t("avbryt"), role: .cancel) {}
            }
        }
        .confirmationDialog(m.t("slettSikker"), isPresented: Binding(get: { spoerSlett != nil }, set: { if !$0 { spoerSlett = nil } }), titleVisibility: .visible) {
            if let st = spoerSlett {
                Button(m.t("slettStokk") + " «\(st.navn)»", role: .destructive) { m.kall("stokkSlett", [st.id]) { m.svar($0) } }
                Button(m.t("avbryt"), role: .cancel) {}
            }
        }
    }

    /// En bunke: to kort bak, det fremste med navnet og antallet, og en spill-knapp i hjørnet
    private func bunke(_ st: DegStokk) -> some View {
        ZStack(alignment: .bottomTrailing) {
            Button(action: { UISelectionFeedbackGenerator().selectionChanged(); valgt = st }) {
                ZStack {
                    RoundedRectangle(cornerRadius: 14).fill(st.farge.opacity(0.55)).overlay(RoundedRectangle(cornerRadius: 14).stroke(s.morkBlekk, lineWidth: 2.5)).offset(x: 8, y: -8).rotationEffect(.degrees(4))
                    RoundedRectangle(cornerRadius: 14).fill(st.farge.opacity(0.75)).overlay(RoundedRectangle(cornerRadius: 14).stroke(s.morkBlekk, lineWidth: 2.5)).offset(x: 4, y: -4).rotationEffect(.degrees(2))
                    VStack(alignment: .leading, spacing: 4) {
                        Text(st.navn.uppercased()).font(.archivo(16, vekt: 900)).lineLimit(3).minimumScaleFactor(0.75).multilineTextAlignment(.leading)
                        Spacer(minLength: 0)
                        Text("\(st.kort.count) \(m.t("kort"))" + (st.delt ? " · \(m.t("delt"))" : "")).font(.archivo(12, vekt: 700)).opacity(0.75)
                    }
                    .padding(12).frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading).foregroundColor(s.morkBlekk)
                    .background(RoundedRectangle(cornerRadius: 14).fill(st.farge))
                    .overlay(RoundedRectangle(cornerRadius: 14).stroke(s.morkBlekk, lineWidth: 2.5))
                }
                .frame(height: 128)
            }
            .buttonStyle(TrykkStilDeg(flytt: 2))
            Button(action: { UIImpactFeedbackGenerator(style: .medium).impactOccurred(); spiller = st }) {
                Image(systemName: "play.fill").font(.system(size: 15, weight: .black)).frame(width: 40, height: 40).foregroundColor(s.morkBlekk)
                    .background(Circle().fill(s.gul)).overlay(Circle().stroke(s.morkBlekk, lineWidth: 2.5))
                    .background(Circle().fill(s.morkBlekk).offset(x: 2, y: 2))
            }
            .buttonStyle(TrykkStilDeg(flytt: 2)).offset(x: -8, y: -8).accessibilityLabel("\(m.t("spill")) \(st.navn)")
        }
    }
}

/// Det som redigeres i skjemaet
struct StokkUtkast: Equatable {
    static let farger = ["#FF9CC2", "#FFD23F", "#63E2A8", "#5A8DEE", "#FF5B1F"]
    var id: String?
    var navn: String
    var kort: [String]
    var farge: Color
}

/// Skjemaet: ett kort om gangen ned i bunken. Alt lagres mens du skriver – ingen lagre-knapp.
struct StokkSkjema: View {
    @ObservedObject var m: DegModell
    let start: StokkUtkast
    let lukk: () -> Void
    let spill: (DegStokk) -> Void
    @Environment(\.colorScheme) private var modus
    @State private var id: String? = nil
    @State private var navn = ""
    @State private var kort: [String] = []
    @State private var farge = Color.yellow
    @State private var fargeHex = StokkUtkast.farger[1]
    @State private var nytt = ""
    @State private var endrer: Int? = nil
    @State private var limInn = false
    @State private var limTekst = ""
    @State private var lagret = ""
    @State private var dunk = false
    @State private var lagreArbeid: DispatchWorkItem? = nil
    @FocusState private var fokus: Felt?
    private enum Felt { case navn, kort, lim }
    private var s: DegStil { DegStil(modus: modus) }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                HStack(spacing: 10) {
                    Button(action: { lagreNaa(); lukk() }) {
                        HStack(spacing: 4) { Image(systemName: "chevron.left").font(.system(size: 17, weight: .bold)); Text(m.t("ferdig")).font(.archivo(16, vekt: 800)) }
                            .frame(minHeight: 44).padding(.trailing, 8).contentShape(Rectangle())
                    }
                    .buttonStyle(.plain).accessibilityLabel(m.t("ferdig"))
                    Spacer(minLength: 0)
                    if !lagret.isEmpty { Text(lagret).font(.archivo(13, vekt: 700)).opacity(0.6).transition(.opacity) }
                }
                .padding(.top, 4)

                s.felt(TextField(m.t("stokkNavn"), text: $navn).font(.archivo(22, vekt: 900)).focused($fokus, equals: .navn).submitLabel(.next).onSubmit { fokus = .kort })
                    .onChange(of: navn) { _ in lagreSnart() }

                // Fargen på bunken
                HStack(spacing: 10) {
                    ForEach(StokkUtkast.farger, id: \.self) { f in
                        Button(action: { UISelectionFeedbackGenerator().selectionChanged(); fargeHex = f; farge = Color(hex: f) }) {
                            Circle().fill(Color(hex: f)).frame(width: 34, height: 34)
                                .overlay(Circle().stroke(s.morkBlekk, lineWidth: fargeHex == f ? 3.5 : 2))
                                .scaleEffect(fargeHex == f ? 1.12 : 1)
                                .animation(.spring(response: 0.25, dampingFraction: 0.7), value: fargeHex == f)
                        }
                        .buttonStyle(.plain).accessibilityLabel(f)
                    }
                }

                // Kortet som skrives, oppå bunken
                ZStack {
                    RoundedRectangle(cornerRadius: 16).fill(farge.opacity(0.5)).overlay(RoundedRectangle(cornerRadius: 16).stroke(s.morkBlekk, lineWidth: 2.5)).offset(x: 10, y: -10).rotationEffect(.degrees(3))
                    RoundedRectangle(cornerRadius: 16).fill(farge.opacity(0.7)).overlay(RoundedRectangle(cornerRadius: 16).stroke(s.morkBlekk, lineWidth: 2.5)).offset(x: 5, y: -5).rotationEffect(.degrees(1.5))
                    VStack(alignment: .leading, spacing: 10) {
                        HStack {
                            Text("\(m.t("kortNr")) \((endrer ?? kort.count) + 1)").font(.archivo(12, vekt: 900)).opacity(0.7)
                            Spacer()
                            if !kort.isEmpty { Text("\(kort.count) \(m.t("iBunken"))").font(.archivo(12, vekt: 800)).opacity(0.7) }
                        }
                        FlerlinjeFelt(plassholder: m.t("stokkSkriv"), tekst: $nytt, linjer: 2).font(.archivo(19, vekt: 700)).focused($fokus, equals: .kort)
                            .onChange(of: nytt) { v in if v.contains("\n") { nytt = v.replacingOccurrences(of: "\n", with: ""); leggTil() } }
                        Button(action: leggTil) {
                            HStack(spacing: 6) { Text((endrer == nil ? m.t("leggIBunken") : m.t("lagreKortet")).uppercased()).font(.archivo(14, vekt: 900)); Image(systemName: "plus").font(.system(size: 13, weight: .black)) }
                                .padding(.horizontal, 14).frame(height: 42).foregroundColor(s.morkBlekk)
                                .background(RoundedRectangle(cornerRadius: 10).fill(s.gul)).overlay(RoundedRectangle(cornerRadius: 10).stroke(s.morkBlekk, lineWidth: 2.5))
                                .background(RoundedRectangle(cornerRadius: 10).fill(s.morkBlekk).offset(x: 3, y: 3))
                        }
                        .buttonStyle(TrykkStilDeg())
                    }
                    .padding(14).foregroundColor(s.morkBlekk)
                    .background(RoundedRectangle(cornerRadius: 16).fill(farge))
                    .overlay(RoundedRectangle(cornerRadius: 16).stroke(s.morkBlekk, lineWidth: 2.5))
                    .scaleEffect(dunk ? 0.96 : 1).offset(y: dunk ? 10 : 0).opacity(dunk ? 0.4 : 1)
                }
                .padding(.top, 8).padding(.trailing, 10)

                // Idéer: en start på et kort
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(Array(m.ideer.enumerated()), id: \.offset) { _, i in
                            Button(action: { nytt = (i.first ?? "") + (i.count > 1 ? i[1] : ""); fokus = .kort }) {
                                Text(i.count > 2 ? i[2] : (i.first ?? "")).font(.archivo(13, vekt: 800)).padding(.horizontal, 12).frame(height: 34).foregroundColor(s.blekk)
                                    .background(Capsule().fill(s.kort)).overlay(Capsule().stroke(s.blekk.opacity(0.35), lineWidth: 2))
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding(.vertical, 2)
                }

                // Bunken, nyeste øverst
                VStack(spacing: 8) {
                    ForEach(Array(kort.enumerated().reversed()), id: \.offset) { i, k in
                        HStack(spacing: 10) {
                            Button(action: { endrer = i; nytt = k; fokus = .kort }) {
                                Text(k).font(.archivo(15, vekt: 650)).multilineTextAlignment(.leading).fixedSize(horizontal: false, vertical: true)
                                    .frame(maxWidth: .infinity, alignment: .leading).contentShape(Rectangle())
                            }
                            .buttonStyle(.plain)
                            Button(action: { fjern(i) }) {
                                Image(systemName: "xmark").font(.system(size: 12, weight: .bold)).frame(width: 30, height: 30)
                                    .background(Circle().fill(s.kort)).overlay(Circle().stroke(s.blekk.opacity(0.4), lineWidth: 1.5))
                            }
                            .buttonStyle(.plain).accessibilityLabel(m.t("slettStokk"))
                        }
                        .padding(.horizontal, 14).padding(.vertical, 10).foregroundColor(s.blekk)
                        .background(RoundedRectangle(cornerRadius: 12).fill(endrer == i ? s.gul.opacity(0.35) : s.kort))
                        .overlay(RoundedRectangle(cornerRadius: 12).stroke(s.blekk.opacity(endrer == i ? 0.8 : 0.2), lineWidth: 1.5))
                    }
                }
                .animation(.spring(response: 0.35, dampingFraction: 0.88), value: kort.count)

                // Lim inn en liste
                if limInn {
                    VStack(alignment: .leading, spacing: 8) {
                        Text(m.t("limInnLead")).font(.archivo(13, vekt: 700)).opacity(0.7)
                        TextEditor(text: $limTekst).font(.archivo(15, vekt: 600)).frame(minHeight: 120).focused($fokus, equals: .lim)
                            .padding(8).background(RoundedRectangle(cornerRadius: 12).fill(s.kort)).overlay(RoundedRectangle(cornerRadius: 12).stroke(s.blekk, lineWidth: 2.5))
                        Button(action: {
                            let nye = limTekst.split(whereSeparator: \.isNewline).map { $0.trimmingCharacters(in: .whitespaces) }.filter { !$0.isEmpty }
                            guard !nye.isEmpty else { return }
                            kort = Array((kort + nye).prefix(300)); limTekst = ""; limInn = false; lagreSnart()
                        }) { s.stor(m.t("leggAlle"), hoyde: 48) }
                        .buttonStyle(TrykkStilDeg()).padding(.trailing, 4)
                    }
                    .transition(.opacity.combined(with: .move(edge: .top)))
                }

                HStack(spacing: 10) {
                    Button(action: {
                        guard !kort.isEmpty else { return }
                        lagreNaa()
                        spill(DegStokk(["id": id ?? "", "navn": navn.trimmingCharacters(in: .whitespaces).isEmpty ? m.t("stokkNy") : navn, "kort": kort, "delt": false, "farge": fargeHex])!)
                    }) {
                        HStack(spacing: 6) { Image(systemName: "play.fill").font(.system(size: 13, weight: .black)); Text(m.t("spillNaa").uppercased()).font(.archivo(14, vekt: 900)) }
                            .padding(.horizontal, 16).frame(height: 46).foregroundColor(s.morkBlekk)
                            .background(RoundedRectangle(cornerRadius: 12).fill(s.gul)).overlay(RoundedRectangle(cornerRadius: 12).stroke(s.morkBlekk, lineWidth: 2.5))
                            .background(RoundedRectangle(cornerRadius: 12).fill(s.morkBlekk).offset(x: 3, y: 3))
                    }
                    .buttonStyle(TrykkStilDeg()).disabled(kort.isEmpty).opacity(kort.isEmpty ? 0.45 : 1)
                    Button(action: { withAnimation(.spring(response: 0.3, dampingFraction: 0.9)) { limInn.toggle() }; if limInn { fokus = .lim } }) {
                        Text(m.t("limInn")).font(.archivo(14, vekt: 800)).padding(.horizontal, 14).frame(height: 46).foregroundColor(s.blekk)
                            .background(RoundedRectangle(cornerRadius: 12).fill(s.kort)).overlay(RoundedRectangle(cornerRadius: 12).stroke(s.blekk.opacity(0.3), lineWidth: 1.5))
                    }
                    .buttonStyle(TrykkStilDeg(flytt: 1))
                    Spacer(minLength: 0)
                }
                .padding(.top, 4)
            }
            .padding(.horizontal, 16).padding(.bottom, 110)
        }
        .background(s.papir.ignoresSafeArea())
        .scrollDismissesKeyboardIfAvailable()
        .onAppear {
            id = start.id; navn = start.navn; kort = start.kort; farge = start.farge
            fargeHex = StokkUtkast.farger.first { Color(hex: $0) == start.farge } ?? StokkUtkast.farger[1]
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.45) { fokus = navn.isEmpty ? .navn : .kort }
        }
        .onDisappear { lagreArbeid?.cancel() }
    }

    private func leggTil() {
        let t = nytt.replacingOccurrences(of: "\\s+", with: " ", options: .regularExpression).trimmingCharacters(in: .whitespaces)
        guard !t.isEmpty else { fokus = .kort; return }
        if let i = endrer, i < kort.count { kort[i] = t; endrer = nil }
        else {
            kort.append(t)
            // Kortet glir ned i bunken
            UIImpactFeedbackGenerator(style: .light).impactOccurred()
            withAnimation(.easeOut(duration: 0.16)) { dunk = true }
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.17) { withAnimation(.spring(response: 0.3, dampingFraction: 0.75)) { dunk = false } }
        }
        nytt = ""; lagreSnart(); fokus = .kort
    }
    private func fjern(_ i: Int) {
        guard i < kort.count else { return }
        kort.remove(at: i)
        if endrer == i { endrer = nil; nytt = "" } else if let e = endrer, e > i { endrer = e - 1 }
        lagreSnart()
    }
    private func lagreSnart() {
        lagreArbeid?.cancel()
        let w = DispatchWorkItem { lagreNaa() }
        lagreArbeid = w
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.7, execute: w)
    }
    private func lagreNaa() {
        lagreArbeid?.cancel()
        guard !kort.isEmpty else { return }
        var d: [String: Any] = ["navn": navn.trimmingCharacters(in: .whitespaces), "kort": kort, "farge": fargeHex]
        if let i = id { d["id"] = i }
        m.kall("stokkLagre", [d]) { r in
            if let ny = r["id"] as? String { id = ny } else if let ny = r["id"] as? Int { id = String(ny) }
            withAnimation { lagret = r["ok"] as? Bool == true ? m.t("lagret") : (r["melding"] as? String ?? "") }
        }
    }
}

/// Spill en kortstokk alene: send telefonen rundt
struct StokkSpill: View {
    @ObservedObject var m: DegModell
    let stokk: DegStokk
    let lukk: () -> Void
    @Environment(\.colorScheme) private var modus
    @State private var rekke: [String] = []
    @State private var pos = 0
    @State private var bla = false
    private var s: DegStil { DegStil(modus: modus) }

    var body: some View {
        VStack(spacing: 18) {
            Text(stokk.navn.uppercased()).font(.archivo(14, vekt: 900)).opacity(0.65).padding(.top, 20)
            Spacer(minLength: 0)
            ZStack {
                RoundedRectangle(cornerRadius: 20).fill(stokk.farge.opacity(0.5)).overlay(RoundedRectangle(cornerRadius: 20).stroke(s.morkBlekk, lineWidth: 3)).offset(x: 12, y: -12).rotationEffect(.degrees(4))
                RoundedRectangle(cornerRadius: 20).fill(stokk.farge.opacity(0.7)).overlay(RoundedRectangle(cornerRadius: 20).stroke(s.morkBlekk, lineWidth: 3)).offset(x: 6, y: -6).rotationEffect(.degrees(2))
                VStack(spacing: 14) {
                    Text("\(pos + 1) \(m.t("av")) \(rekke.count)").font(.archivo(12, vekt: 900)).opacity(0.7)
                    Text(rekke.isEmpty ? "" : rekke[pos]).font(.archivo(26, vekt: 800)).multilineTextAlignment(.center).lineSpacing(3).minimumScaleFactor(0.6)
                        .frame(maxWidth: .infinity).frame(minHeight: 160)
                        .id(pos)
                        .transition(.asymmetric(insertion: .move(edge: .trailing).combined(with: .opacity), removal: .move(edge: .leading).combined(with: .opacity)))
                }
                .padding(22).foregroundColor(s.morkBlekk)
                .background(RoundedRectangle(cornerRadius: 20).fill(stokk.farge))
                .overlay(RoundedRectangle(cornerRadius: 20).stroke(s.morkBlekk, lineWidth: 3))
                .background(RoundedRectangle(cornerRadius: 20).fill(s.morkBlekk).offset(x: 5, y: 5))
            }
            .padding(.horizontal, 24).padding(.trailing, 12)
            .animation(.spring(response: 0.38, dampingFraction: 0.86), value: pos)
            Spacer(minLength: 0)
            Button(action: {
                UIImpactFeedbackGenerator(style: .medium).impactOccurred()
                if pos + 1 >= rekke.count { rekke = rekke.shuffled(); pos = 0 } else { pos += 1 }
            }) { s.stor(m.t("neste"), hoyde: 60) }
            .buttonStyle(TrykkStilDeg()).padding(.horizontal, 20).padding(.trailing, 4)
            Button(action: lukk) { Text(m.t("lukk")).font(.archivo(16, vekt: 800)).frame(minHeight: 44).opacity(0.75) }.buttonStyle(.plain)
                .padding(.bottom, 100)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(s.papir.ignoresSafeArea())
        .foregroundColor(s.blekk)
        .onAppear { rekke = stokk.kort.shuffled(); pos = 0 }
    }
}

private struct TrykkStil2: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .offset(x: configuration.isPressed ? 2 : 0, y: configuration.isPressed ? 2 : 0)
            .animation(.spring(response: 0.18, dampingFraction: 0.9), value: configuration.isPressed)
    }
}

private extension View {
    @ViewBuilder func scrollDismissesKeyboardIfAvailable() -> some View {
        if #available(iOS 16.0, *) { self.scrollDismissesKeyboard(.interactively) } else { self }
    }
}
