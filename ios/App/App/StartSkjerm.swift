import SwiftUI
import UIKit
import WebKit

/// Den native startskjermen i Spill-fanen: navnet ditt, «Lag rom», og kode + «Bli med». Ligger over nettvisningen
/// når siden står på sin startskjerm, og bruker nettkoden (window.__mvStart) til selve jobben – så innlogging,
/// lekevalg fra lenker og alt annet virker som før. Når rommet er klart, sier siden fra og skjermen glir bort.
final class StartModell: ObservableObject {
    @Published var navn = ""
    @Published var kode = ""
    @Published var fortsett = ""          // rommet du var i sist (kode), om noe
    @Published var feil = ""
    @Published var travel: String? = nil   // «lag» eller «bli» mens vi venter på serveren
    @Published var engelsk = false
    weak var nett: WKWebView?

    func T(_ no: String, _ en: String) -> String { engelsk ? en : no }

    func lagRom() {
        guard travel == nil else { return }
        let n = navn.trimmingCharacters(in: .whitespacesAndNewlines)
        if n.isEmpty { feil = T("Skriv inn navnet ditt.", "Enter your name."); UINotificationFeedbackGenerator().notificationOccurred(.warning); return }
        kjor("lag", "return await window.__mvStart.lag(navn)", ["navn": n])
    }

    func bliMed() {
        guard travel == nil else { return }
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
    @Environment(\.colorScheme) private var modus
    @FocusState private var fokus: Felt?
    enum Felt { case navn, kode }

    private var papir: Color { modus == .dark ? Color(red: 0.11, green: 0.106, blue: 0.122) : Color(red: 1, green: 0.973, blue: 0.933) }   // #1C1B1F / #FFF8EE
    private var blekk: Color { modus == .dark ? Color(red: 1, green: 0.973, blue: 0.933) : Color(red: 0.086, green: 0.071, blue: 0.059) }   // tekst og streker
    private let gul = Color(red: 1, green: 0.824, blue: 0.247)      // #FFD23F
    private let rust = Color(red: 0.776, green: 0.235, blue: 0.067)
    private let morkBlekk = Color(red: 0.086, green: 0.071, blue: 0.059)   // tekst på gult er alltid blekk

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                Text(m.T("Spill sammen", "Play together").uppercased())
                    .font(.system(size: 40, weight: .black)).tracking(-1.5)
                    .padding(.top, 8)

                if !m.fortsett.isEmpty {
                    Button(action: m.fortsettRom) {
                        HStack {
                            VStack(alignment: .leading, spacing: 2) {
                                Text(m.T("Du er i rom ", "You’re in room ") + m.fortsett).font(.system(size: 17, weight: .heavy))
                                Text(m.T("Trykk for å gå tilbake til rommet", "Tap to go back to the room")).font(.system(size: 14)).opacity(0.75)
                            }
                            Spacer()
                            Text("→").font(.system(size: 22, weight: .heavy))
                        }
                        .padding(14).foregroundColor(morkBlekk)
                        .background(RoundedRectangle(cornerRadius: 14).fill(gul))
                        .overlay(RoundedRectangle(cornerRadius: 14).stroke(morkBlekk, lineWidth: 3))
                    }
                }

                felt(m.T("Navnet ditt", "Your name")) {
                    TextField(m.T("F.eks. Maria", "E.g. Sam"), text: $m.navn)
                        .textContentType(.nickname).disableAutocorrection(true)
                        .submitLabel(.go).focused($fokus, equals: .navn)
                        .onSubmit { if m.kode.isEmpty { m.lagRom() } else { m.bliMed() } }
                }

                knapp(m.T("Lag rom", "Create room"), travel: m.travel == "lag", action: m.lagRom)

                HStack { linje; Text(m.T("eller", "or")).font(.system(size: 14, weight: .bold)).opacity(0.6); linje }

                felt(m.T("Kode fra verten", "Code from the host")) {
                    TextField("ABCD", text: $m.kode)
                        .font(.system(size: 26, weight: .black, design: .monospaced)).tracking(6)
                        .textInputAutocapitalization(.characters).disableAutocorrection(true)
                        .submitLabel(.go).focused($fokus, equals: .kode)
                        .onChange(of: m.kode) { v in
                            let r = String(v.uppercased().filter { $0.isLetter || $0.isNumber }.prefix(6))
                            if r != v { m.kode = r }
                            if r.count == 4 && m.navn.isEmpty { fokus = .navn }
                        }
                        .onSubmit { m.bliMed() }
                }

                knapp(m.T("Bli med", "Join"), travel: m.travel == "bli", action: m.bliMed)

                if !m.feil.isEmpty {
                    Text(m.feil).font(.system(size: 15, weight: .bold)).foregroundColor(rust)
                        .transition(.opacity)
                }

                Text(m.T("Ved å lage eller bli med i et rom bekrefter du at du er over 18. Drikk med vett – og aldri kjør etterpå.",
                         "By creating or joining a room you confirm you’re over 18. Drink responsibly – and never drive afterwards."))
                    .font(.system(size: 13)).opacity(0.7).padding(.top, 6)
            }
            .padding(.horizontal, 20).padding(.bottom, 32)
        }
        .scrollDismissesKeyboardIfAvailable()
        .background(papir.ignoresSafeArea())
        .foregroundColor(blekk)
        .animation(.easeOut(duration: 0.18), value: m.feil)
    }

    private var linje: some View { Rectangle().fill(blekk.opacity(0.25)).frame(height: 2) }

    private func felt<V: View>(_ etikett: String, @ViewBuilder _ inn: () -> V) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(etikett).font(.system(size: 14, weight: .heavy))
            inn()
                .font(.system(size: 20, weight: .semibold))
                .padding(.horizontal, 14).frame(height: 56)
                .background(RoundedRectangle(cornerRadius: 14).fill(modus == .dark ? Color.white.opacity(0.06) : Color.white))
                .overlay(RoundedRectangle(cornerRadius: 14).stroke(blekk, lineWidth: 3))
        }
    }

    /// Den gule knappen med hard skygge – som på nettsiden
    private func knapp(_ tekst: String, travel: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            ZStack {
                Text(tekst.uppercased()).font(.system(size: 20, weight: .black)).tracking(0.5).opacity(travel ? 0 : 1)
                if travel { ProgressView().progressViewStyle(.circular).tint(morkBlekk) }
            }
            .frame(maxWidth: .infinity).frame(height: 60).foregroundColor(morkBlekk)
            .background(
                ZStack {
                    RoundedRectangle(cornerRadius: 14).fill(morkBlekk).offset(x: 4, y: 4)
                    RoundedRectangle(cornerRadius: 14).fill(gul)
                    RoundedRectangle(cornerRadius: 14).stroke(morkBlekk, lineWidth: 3)
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
            .animation(.easeOut(duration: 0.08), value: configuration.isPressed)
    }
}

private extension View {
    @ViewBuilder func scrollDismissesKeyboardIfAvailable() -> some View {
        if #available(iOS 16.0, *) { self.scrollDismissesKeyboard(.interactively) } else { self }
    }
}
