import SwiftUI
import UIKit
import WebKit
import Network

/// Forsiden i appen (Spill-fanen): «Klar for vors?», stua, «Lag rom» og koden med «Bli med». Ligger over nettvisningen
/// når siden står på sin startskjerm, og bruker nettkoden (window.__mvStart) til selve jobben – så innlogging,
/// lekevalg fra lenker og alt annet virker som før. Stua er nettsidens demo-stue, vist gjennom et hull i skjermen
/// (gjestene går inn døra for hver bokstav du skriver, og folka kan dras). Når rommet er klart, sier siden fra og skjermen glir bort.
final class StartModell: ObservableObject {
    @Published var navn = ""
    /// Navnet er kjent fra før (huskes på telefonen, endres under Deg) – da vises ikke feltet. Ikke «navnet er tomt»: da forsvant
    /// feltet idet du skrev den første bokstaven
    @Published var navnKjent = false
    @Published var kode = ""
    @Published var fortsett = ""          // rommet du var i sist (kode), om noe
    @Published var feil = ""
    @Published var travel: String? = nil   // «lag» eller «bli» mens vi venter på serveren
    @Published var engelsk = false
    /// Høyden stua har i nettsiden (meldt derfra), så hullet er like stort som stua
    @Published var stuaH: CGFloat = 0
    @Published var harNett = true
    /// Tastaturets høyde (0 når det er nede) – skjermen skyver seg opp så kodefeltet ikke havner under det. Skallet lukker
    /// hullet til stua så lenge tastaturet er oppe: skjermen er skjøvet, og feltene kan ligge der hullet var
    @Published var tastaturH: CGFloat = 0 { didSet { tastaturEndret?() } }
    var tastaturEndret: (() -> Void)?
    weak var nett: WKWebView?
    private let nettVakt = NWPathMonitor()
    private var sistPlass = ""

    init() {
        // Rommet bor på serveren: uten nett får du en kort beskjed i stedet for en nettfeil
        nettVakt.pathUpdateHandler = { [weak self] sti in DispatchQueue.main.async { self?.harNett = sti.status == .satisfied } }
        nettVakt.start(queue: DispatchQueue(label: "no.mittvors.nett"))
        NotificationCenter.default.addObserver(forName: UIResponder.keyboardWillChangeFrameNotification, object: nil, queue: .main) { [weak self] n in
            guard let r = (n.userInfo?[UIResponder.keyboardFrameEndUserInfoKey] as? NSValue)?.cgRectValue else { return }
            let h = max(0, UIScreen.main.bounds.height - r.minY)
            if abs(h - (self?.tastaturH ?? 0)) > 1 { self?.tastaturH = h }
        }
    }

    /// Hvor stua skal stå i nettsiden (toppen i nettvisningens punkter, og bredden): nettsiden flytter den dit og melder ruta tilbake (hullet)
    private var onsket: (topp: Int, bredde: Int)? = nil
    func plass(topp: CGFloat, bredde: CGFloat) {
        let n = (Int(topp.rounded()), Int(bredde.rounded()))
        guard n != (onsket?.topp ?? -1, onsket?.bredde ?? -1) else { return }
        onsket = n
        sendPlass(forsok: 0)
    }
    /// Siden svarer true når stua er flyttet. Er ikke nettkoden klar ennå (window.__mvStart mangler), prøves det igjen litt senere –
    /// alltid med den siste ønskede plasseringen, så et gammelt forsøk aldri overskriver en nyere (det la stua oppå tittelen)
    /// Forsiden vises (ikke på vei ut): bare da plasseres stua
    var aktiv = true
    private func sendPlass(forsok: Int) {
        guard aktiv, let w = nett, let o = onsket else { return }
        if forsok == 0 { SjekkLogg.skriv("plass: topp=\(o.topp) bredde=\(o.bredde)") }
        w.evaluateJavaScript("!!(window.__mvStart && window.__mvStart.plass && (window.__mvStart.plass(\(o.topp), \(o.bredde)), true))") { [weak self] v, _ in
            guard (v as? Bool) != true, forsok < 20 else { return }
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.4) { self?.sendPlass(forsok: forsok + 1) }
        }
    }

    func T(_ no: String, _ en: String) -> String { engelsk ? en : no }

    private var utenNett: Bool {
        guard !harNett else { return false }
        feil = T("Ingen nett. Telefonene snakker sammen via nettet, så rommet trenger dekning.", "No internet. The phones talk through the server, so the room needs a connection.")
        UINotificationFeedbackGenerator().notificationOccurred(.warning)
        return true
    }

    func lagRom() {
        guard travel == nil, !utenNett else { return }
        let n = navn.trimmingCharacters(in: .whitespacesAndNewlines)
        if n.isEmpty { feil = T("Skriv inn navnet ditt.", "Enter your name."); UINotificationFeedbackGenerator().notificationOccurred(.warning); return }
        kjor("lag", "return await window.__mvStart.lag(navn)", ["navn": n])
    }

    func bliMed() {
        guard travel == nil, !utenNett else { return }
        let k = kode.uppercased().filter { $0.isLetter || $0.isNumber }, n = navn.trimmingCharacters(in: .whitespacesAndNewlines)
        if k.count < 4 { feil = T("Skriv inn koden fra verten.", "Enter the code from the host."); UINotificationFeedbackGenerator().notificationOccurred(.warning); return }
        if n.isEmpty { feil = T("Skriv inn navnet ditt.", "Enter your name."); UINotificationFeedbackGenerator().notificationOccurred(.warning); return }
        kjor("bli", "return await window.__mvStart.bliMed(kode, navn)", ["kode": k, "navn": n])
    }

    func fortsettRom() {
        guard travel == nil, let w = nett else { return }
        UIImpactFeedbackGenerator(style: .medium).impactOccurred()
        travel = "fortsett"
        w.evaluateJavaScript("window.__mvStart && window.__mvStart.fortsett()", completionHandler: nil)
    }

    /// Koden speiles til stua: TV-en viser den, og en ny gjest går inn døra for hver bokstav
    func stuaKode(_ k: String, nyGjest: Bool) {
        guard let w = nett, let data = try? JSONSerialization.data(withJSONObject: [k, nyGjest]), let json = String(data: data, encoding: .utf8) else { return }
        w.evaluateJavaScript("window.__mvStart && window.__mvStart.kode && window.__mvStart.kode.apply(null, \(json))", completionHandler: nil)
    }

    private func kjor(_ hva: String, _ js: String, _ arg: [String: Any]) {
        guard let w = nett else { feil = T("Siden er ikke klar ennå.", "The page isn’t ready yet."); return }
        UIImpactFeedbackGenerator(style: .medium).impactOccurred()
        feil = ""; travel = hva
        w.callAsyncJavaScript(js, arguments: arg, in: nil, in: .page) { [weak self] res in
            guard let self = self else { return }
            DispatchQueue.main.async {
                switch res {
                case .success(let v):
                    let d = v as? [String: Any] ?? [:]
                    if let f = d["feil"] as? String, !f.isEmpty { self.feil = f; self.travel = nil; UINotificationFeedbackGenerator().notificationOccurred(.error) }
                    else { UINotificationFeedbackGenerator().notificationOccurred(.success) }   // siden melder «rom», og skjermen går bort
                case .failure:
                    self.feil = self.T("Fikk ikke kontakt. Prøv igjen.", "Couldn’t connect. Try again."); self.travel = nil
                }
            }
        }
    }
}

struct StartSkjerm: View {
    @ObservedObject var m: StartModell
    @FocusState private var fokus: Felt?
    enum Felt { case navn, kode }

    // Forsiden er oransje i begge moduser, som på nettet
    private let oransje = Color(red: 1, green: 0.357, blue: 0.122)   // #FF5B1F
    private let gul = Color(red: 1, green: 0.824, blue: 0.247)      // #FFD23F
    private let blekk = Color(red: 0.086, green: 0.071, blue: 0.059) // #16120F
    private let papir = Color(red: 1, green: 0.973, blue: 0.933)     // #FFF8EE

    /// Alt står fast – ingen blaing. Tittelen er to linjer (112 pt) på vanlige iPhoner og én linje (60 pt) på korte skjermer,
    /// og stua får den plassen som er igjen når knappene nederst har fått sin. Nettsiden flytter stua dit (plass) og melder ruta (hullet).
    var body: some View {
        GeometryReader { g in
            let W = g.size.width, H = g.size.height
            let kortSkjerm = H < 720
            let toppH: CGFloat = kortSkjerm ? 60 : 112
            let alderH: CGFloat = kortSkjerm ? 0 : 44
            // Tastaturet: skyv alt opp så kodepanelet (nederst, over aldersteksten) står over det
            let skyv = m.tastaturH > 0 ? max(0, m.tastaturH - g.safeAreaInsets.bottom - alderH - 8) : 0
            VStack(spacing: 0) {
                tittel(kortSkjerm).frame(height: toppH).padding(.horizontal, 20).frame(maxWidth: .infinity, alignment: .leading)
                // Hullet: her ligger nettsidens stue, og fingeren går rett gjennom til den (Skall.settStua). Hullet tar plassen som er
                // igjen mellom tittelen og knappene; hvor det faktisk havnet måles etter utlegget og sendes til siden, som legger stua
                // der (12 pt luft øverst, så bred som hullet tillater – stua er 0,823 ganger så høy som bred). Ett nøkkelord for både
                // plass og størrelse, så et gammelt tall aldri sendes sammen med et nytt
                Color.clear.frame(maxWidth: .infinity, minHeight: 120, maxHeight: .infinity)
                    .background(GeometryReader { hg in
                        let r = hg.frame(in: .global)
                        let n = "\(Int(r.minY))|\(Int(r.height))|\(Int(r.width))"
                        Color.clear
                            .onAppear { hullPlass(r) }
                            .onChange(of: n) { _ in hullPlass(r) }
                            // Første utlegg gir gjerne 0 i størrelse, og endringen like etter kommer ikke alltid som onChange:
                            // be om en ny runde til hullet har fått mål (maks ti ganger)
                            .onChange(of: tikk) { _ in hullPlass(r) }
                            .onAppear { if r.width == 0 { nyRunde() } }
                    })
                VStack(alignment: .leading, spacing: 14) {
                    if !m.fortsett.isEmpty {
                        Button(action: m.fortsettRom) {
                            HStack {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(m.T("Du er i rom ", "You’re in room ") + m.fortsett).font(.archivo(17, vekt: 800))
                                    Text(m.T("Trykk for å gå tilbake til rommet", "Tap to go back to the room")).font(.archivo(14, vekt: 500)).opacity(0.75)
                                }
                                Spacer()
                                Text("→").font(.archivo(22, vekt: 800))
                            }
                            .padding(14).frame(height: 72).foregroundColor(blekk)
                            .background(RoundedRectangle(cornerRadius: 14).fill(papir))
                            .overlay(RoundedRectangle(cornerRadius: 14).stroke(blekk, lineWidth: 3))
                        }
                        .buttonStyle(TrykkStil())
                    }

                    // Navnet huskes (endres under Deg) – feltet vises bare til vi har et
                    if !m.navnKjent {
                        VStack(alignment: .leading, spacing: 6) {
                            Text(m.T("Navnet ditt", "Your name")).font(.archivo(14, vekt: 800))
                            TextField(m.T("F.eks. Maria", "E.g. Sam"), text: $m.navn)
                                .accessibilityIdentifier("start-navn")
                                .textContentType(.nickname).disableAutocorrection(true)
                                .submitLabel(.go).focused($fokus, equals: .navn)
                                .onSubmit { if m.kode.isEmpty { m.lagRom() } else { m.bliMed() } }
                                .font(.archivo(20, vekt: 600))
                                .padding(.horizontal, 14).frame(height: 56)
                                .background(RoundedRectangle(cornerRadius: 14).fill(papir))
                                .overlay(RoundedRectangle(cornerRadius: 14).stroke(blekk, lineWidth: 3))
                        }
                    }

                    knapp(m.T("Lag rom", "Create room") + "  →", travel: m.travel == "lag", action: m.lagRom)

                    // Koden fra verten: mørkt panel med feltet og «Bli med», som på nettet
                    HStack(spacing: 10) {
                        TextField("ABCD", text: $m.kode)
                            .accessibilityIdentifier("start-kode")
                            .font(.archivo(28, vekt: 900))
                            .foregroundColor(papir)
                            .textInputAutocapitalization(.characters).disableAutocorrection(true)
                            .submitLabel(.go).focused($fokus, equals: .kode)
                            .onChange(of: m.kode) { v in
                                let r = String(v.uppercased().filter { $0.isLetter || $0.isNumber }.prefix(6))
                                if r != v { m.kode = r; return }
                                m.stuaKode(r, nyGjest: r.count > forrigeKode.count)
                                forrigeKode = r
                                if r.count == 4 && !m.navnKjent && m.navn.isEmpty { fokus = .navn }
                            }
                            .onSubmit { m.bliMed() }
                            .padding(.horizontal, 12).frame(height: 56)
                            .background(RoundedRectangle(cornerRadius: 10).fill(Color.white.opacity(0.08)))
                            .overlay(RoundedRectangle(cornerRadius: 10).stroke(papir.opacity(0.25), lineWidth: 2))
                        Button(action: m.bliMed) {
                            ZStack {
                                Text(m.T("Bli med", "Join").uppercased()).font(.archivo(18, vekt: 900)).opacity(m.travel == "bli" ? 0 : 1)
                                if m.travel == "bli" { ProgressView().progressViewStyle(.circular).tint(blekk) }
                            }
                            .padding(.horizontal, 18).frame(height: 56).foregroundColor(blekk)
                            .background(
                                ZStack {
                                    RoundedRectangle(cornerRadius: 10).fill(blekk).offset(x: 3, y: 3)
                                    RoundedRectangle(cornerRadius: 10).fill(papir)
                                    RoundedRectangle(cornerRadius: 10).stroke(blekk, lineWidth: 3)
                                }
                            )
                        }
                        .buttonStyle(TrykkStil()).disabled(m.travel != nil)
                    }
                    .padding(12)
                    .background(RoundedRectangle(cornerRadius: 14).fill(blekk))
                    .overlay(RoundedRectangle(cornerRadius: 14).stroke(blekk, lineWidth: 3))
                    .background(RoundedRectangle(cornerRadius: 14).fill(blekk).offset(x: 4, y: 4))

                    if !m.feil.isEmpty {
                        Text(m.feil).font(.archivo(15, vekt: 800)).foregroundColor(blekk)
                            .padding(.horizontal, 12).padding(.vertical, 8).frame(maxWidth: .infinity, alignment: .leading)
                            .background(RoundedRectangle(cornerRadius: 10).fill(papir))
                            .transition(.opacity)
                    }

                    if !kortSkjerm {
                        Text(m.T("Ved å lage eller bli med i et rom bekrefter du at du er over 18. Drikk med vett – og aldri kjør etterpå.",
                                 "By creating or joining a room you confirm you’re over 18. Drink responsibly – and never drive afterwards."))
                            .font(.archivo(13, vekt: 600)).opacity(0.8).padding(.top, 2)
                    }
                }
                .padding(.horizontal, 20).padding(.top, 4)
            }
            .offset(y: -skyv)
            .frame(width: W, height: H, alignment: .top)
            // Ingen bakgrunn her: nettsiden under er oransje (global.css, start-nativ) og viser stua i hullet – en oransje flate
            // her ville dekket stua helt
            .animation(.spring(response: 0.35, dampingFraction: 0.86), value: skyv)
            .onAppear { SjekkLogg.skriv("startskjerm: W=\(Int(W)) H=\(Int(H)) safe=\(Int(g.safeAreaInsets.top))/\(Int(g.safeAreaInsets.bottom)) global=\(Int(g.frame(in: .global).minY)) kort=\(kortSkjerm)") }
        }
        .ignoresSafeArea(.keyboard)
        .foregroundColor(blekk)
        .animation(.easeOut(duration: 0.18), value: m.feil)
    }

    @State private var forrigeKode = ""

    @State private var tikk = 0
    private func nyRunde() { if tikk < 10 { DispatchQueue.main.asyncAfter(deadline: .now() + 0.15) { tikk += 1 } } }

    /// Hullets rute (vinduets koordinater = nettvisningens): stua får 12 pt luft over og under, og bredden hullet gir plass til
    private func hullPlass(_ r: CGRect) {
        guard r.width > 0, r.height > 0 else { nyRunde(); return }
        let bredde = min(r.width - 24, max(140, (r.height - 24) / 0.823))
        m.plass(topp: r.minY + 12, bredde: bredde)
    }

    /// «KLAR FOR» og «VORS?» i en svart boks, som på nettsiden – på korte skjermer på én linje
    private func tittel(_ kort: Bool) -> some View {
        Group {
            if kort {
                HStack(spacing: 10) {
                    Text(m.T("Klar for", "Ready to").uppercased()).font(.archivo(32, vekt: 900)).tracking(-1)
                    Text(m.T("vors?", "pre-game?").uppercased()).font(.archivo(32, vekt: 900)).tracking(-1)
                        .foregroundColor(oransje).padding(.horizontal, 6)
                        .background(Rectangle().fill(blekk).rotationEffect(.degrees(-1.5)))
                }
            } else {
                VStack(alignment: .leading, spacing: 2) {
                    Text(m.T("Klar for", "Ready to").uppercased()).font(.archivo(44, vekt: 900)).tracking(-1.5)
                    Text(m.T("vors?", "pre-game?").uppercased()).font(.archivo(44, vekt: 900)).tracking(-1.5)
                        .foregroundColor(oransje).padding(.horizontal, 8)
                        .background(Rectangle().fill(blekk).rotationEffect(.degrees(-1.5)))
                }
            }
        }
        .lineLimit(1).minimumScaleFactor(0.7)
        .padding(.vertical, 8)
    }

    /// Den gule knappen med hard skygge – som på nettsiden
    private func knapp(_ tekst: String, travel: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            ZStack {
                Text(tekst.uppercased()).font(.archivo(20, vekt: 900)).tracking(0.5).opacity(travel ? 0 : 1)
                if travel { ProgressView().progressViewStyle(.circular).tint(blekk) }
            }
            .frame(maxWidth: .infinity).frame(height: 60).foregroundColor(blekk)
            .background(
                ZStack {
                    RoundedRectangle(cornerRadius: 14).fill(blekk).offset(x: 4, y: 4)
                    RoundedRectangle(cornerRadius: 14).fill(gul)
                    RoundedRectangle(cornerRadius: 14).stroke(blekk, lineWidth: 3)
                }
            )
        }
        .buttonStyle(TrykkStil())
        .disabled(m.travel != nil)
    }
}

/// Knappen går ned i skyggen sin når du trykker
private struct TrykkStil: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .offset(x: configuration.isPressed ? 3 : 0, y: configuration.isPressed ? 3 : 0)
            .animation(.spring(response: 0.18, dampingFraction: 0.9), value: configuration.isPressed)
    }
}

extension Font {
    /// Archivo – samme skrift som på nettsiden (Fonter/Archivo.ttf, variabel). `vekt` 100–900 som i CSS.
    /// Mangler fonten, brukes systemfonten med tilsvarende vekt.
    static func archivo(_ size: CGFloat, vekt: CGFloat = 700) -> Font {
        let wght = 0x77676874   // aksen 'wght'
        let variasjon = UIFontDescriptor.AttributeName(rawValue: kCTFontVariationAttribute as String)
        let d = UIFontDescriptor(fontAttributes: [.name: "Archivo-SemiBold", variasjon: [NSNumber(value: wght): NSNumber(value: Double(vekt))]])
        let f = UIFont(descriptor: d, size: size)
        if f.familyName.hasPrefix("Archivo") { return Font(f) }
        return .system(size: size, weight: vekt >= 850 ? .black : vekt >= 750 ? .heavy : vekt >= 650 ? .bold : .semibold)
    }
}

private extension View {
    @ViewBuilder func scrollDismissesKeyboardIfAvailable() -> some View {
        if #available(iOS 16.0, *) { self.scrollDismissesKeyboard(.interactively) } else { self }
    }
}
