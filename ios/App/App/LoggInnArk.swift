import SwiftUI
import UIKit
import WebKit
import AuthenticationServices
import CryptoKit

/// Logg inn / ny konto / lenke på e-post som et iOS-ark. Selve innloggingen gjøres av nettsiden (window.__mvKonto),
/// så kontoen, øktene og e-postene virker nøyaktig som på nett – dette er bare skjemaet, med iPhonens tastatur og felt.
/// Øverst: Logg inn med Apple – iOS gir id-tokenet, nettsiden bytter det i en innlogging hos Supabase. Første gang
/// finnes det ikke noe brukernavn, så arket spør om det før det lukker seg.
@MainActor
final class KontoModell: ObservableObject {
    enum Del: String, CaseIterable { case inn, ny, lenke, glemt, navn }
    @Published var del: Del = .inn
    @Published var navn = ""        // brukernavn eller e-post ved innlogging
    @Published var epost = ""
    @Published var brukernavn = ""
    @Published var passord = ""
    @Published var melding = ""
    @Published var feil = false
    @Published var travel = false
    @Published var engelsk = false
    weak var nett: WKWebView?
    var ferdig: (() -> Void)?
    /// Tilfeldig nonce for Apple-innloggingen: Apple får SHA-256 av den, Supabase får den rå
    private var appleNonce = ""

    func T(_ no: String, _ en: String) -> String { engelsk ? en : no }

    func send() {
        guard !travel else { return }
        feil = false; melding = ""
        switch del {
        case .inn:
            guard !navn.isEmpty, !passord.isEmpty else { return si(T("Fyll ut alle feltene.", "Fill in all the fields."), true) }
            kjor("return await window.__mvKonto.inn(navn, pw)", ["navn": navn.trimmingCharacters(in: .whitespaces), "pw": passord], innlogget: true)
        case .ny:
            guard !epost.isEmpty, !brukernavn.isEmpty, !passord.isEmpty else { return si(T("Fyll ut alle feltene.", "Fill in all the fields."), true) }
            guard passord.count >= 8 else { return si(T("Passordet må ha minst 8 tegn.", "The password needs at least 8 characters."), true) }
            kjor("return await window.__mvKonto.ny(epost, navn, pw)", ["epost": epost.trimmingCharacters(in: .whitespaces), "navn": brukernavn.trimmingCharacters(in: .whitespaces), "pw": passord], innlogget: true)
        case .lenke:
            guard !epost.isEmpty else { return si(T("Skriv inn e-posten din.", "Enter your email."), true) }
            kjor("return await window.__mvKonto.lenke(epost)", ["epost": epost.trimmingCharacters(in: .whitespaces)], innlogget: false)
        case .glemt:
            guard !epost.isEmpty else { return si(T("Skriv inn e-posten din.", "Enter your email."), true) }
            kjor("return await window.__mvKonto.glemt(epost)", ["epost": epost.trimmingCharacters(in: .whitespaces)], innlogget: false)
        case .navn:
            lagreBrukernavn()
        }
    }

    // MARK: Logg inn med Apple
    /// Settes på forespørselen til Apple: fullt navn (bare til forslag på brukernavn) og en hashet nonce
    func appleForespoersel(_ r: ASAuthorizationAppleIDRequest) {
        appleNonce = Self.tilfeldigNonce()
        r.requestedScopes = [.fullName]
        r.nonce = Self.sha256(appleNonce)
    }
    func appleSvar(_ res: Result<ASAuthorization, Error>) {
        switch res {
        case .failure(let e):
            // Lukket arket selv: ingen feilmelding
            if let a = e as? ASAuthorizationError, a.code == .canceled { return }
            si(T("Apple-innloggingen gikk ikke gjennom. Prøv igjen.", "Apple sign-in didn’t go through. Try again."), true)
        case .success(let a):
            guard let c = a.credential as? ASAuthorizationAppleIDCredential,
                  let data = c.identityToken, let token = String(data: data, encoding: .utf8), !token.isEmpty else {
                return si(T("Fikk ikke noe svar fra Apple. Prøv igjen.", "Got no answer from Apple. Try again."), true)
            }
            let fornavn = c.fullName?.givenName ?? ""
            feil = false; melding = ""
            kjorRaa("return await window.__mvKonto.apple(token, nonce)", ["token": token, "nonce": appleNonce]) { [weak self] d in
                guard let self = self else { return }
                if let f = d["feil"] as? String, !f.isEmpty { return self.si(d["melding"] as? String ?? self.T("Noe gikk galt. Prøv igjen.", "Something went wrong. Try again."), true) }
                guard d["ok"] as? Bool == true else { return self.si(self.T("Noe gikk galt. Prøv igjen.", "Something went wrong. Try again."), true) }
                let navn = d["brukernavn"] as? String ?? ""
                UINotificationFeedbackGenerator().notificationOccurred(.success)
                if navn.isEmpty {
                    // Ny konto: velg brukernavn før arket lukkes. Forslag fra fornavnet, om Apple ga oss det.
                    self.brukernavn = Self.forslag(fornavn)
                    self.del = .navn
                } else {
                    self.si(self.T("Du er logget inn!", "You’re signed in!"), false)
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.6) { self.ferdig?() }
                }
            }
        }
    }
    private func lagreBrukernavn() {
        let n = brukernavn.trimmingCharacters(in: .whitespaces)
        guard Self.gyldigBrukernavn(n) else {
            return si(T("3–20 tegn: bokstaver, tall, punktum, strek.", "3–20 characters: letters, digits, dot, dash."), true)
        }
        kjorRaa("return await window.__mvKonto.brukernavn(navn)", ["navn": n]) { [weak self] d in
            guard let self = self else { return }
            if let f = d["feil"] as? String, !f.isEmpty { return self.si(d["melding"] as? String ?? self.T("Noe gikk galt. Prøv igjen.", "Something went wrong. Try again."), true) }
            UINotificationFeedbackGenerator().notificationOccurred(.success)
            self.si(self.T("Du er logget inn!", "You’re signed in!"), false)
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.6) { self.ferdig?() }
        }
    }
    /// «Velg senere»: kontoen er laget, brukernavnet kan velges under Innstillinger
    func hoppOverNavn() { ferdig?() }

    static func gyldigBrukernavn(_ s: String) -> Bool {
        s.count >= 3 && s.count <= 20 && s.unicodeScalars.allSatisfy { CharacterSet.alphanumerics.contains($0) && $0.isASCII || $0 == "_" || $0 == "." || $0 == "-" }
    }
    /// Et forslag til brukernavn fra fornavnet: «Ola» → «ola», «Åse Marie» → «asemarie»
    static func forslag(_ fornavn: String) -> String {
        let flat = fornavn.lowercased().folding(options: .diacriticInsensitive, locale: nil)
            .replacingOccurrences(of: "ø", with: "o").replacingOccurrences(of: "æ", with: "ae")
        let bare = flat.unicodeScalars.filter { CharacterSet.alphanumerics.contains($0) && $0.isASCII }
        let s = String(String.UnicodeScalarView(bare))
        return s.count >= 3 ? String(s.prefix(20)) : ""
    }
    private static func tilfeldigNonce() -> String {
        let tegn = Array("0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ")
        var ut = ""
        for _ in 0..<32 { ut.append(tegn[Int.random(in: 0..<tegn.count)]) }
        return ut
    }
    private static func sha256(_ s: String) -> String {
        SHA256.hash(data: Data(s.utf8)).map { String(format: "%02x", $0) }.joined()
    }

    private func si(_ t: String, _ erFeil: Bool) {
        melding = t; feil = erFeil
        if erFeil { UINotificationFeedbackGenerator().notificationOccurred(.warning) }
    }

    private func kjor(_ js: String, _ arg: [String: Any], innlogget: Bool) {
        kjorRaa(js, arg) { [weak self] d in
            guard let self = self else { return }
            if let f = d["feil"] as? String, !f.isEmpty { return self.si(d["melding"] as? String ?? self.T("Noe gikk galt. Prøv igjen.", "Something went wrong. Try again."), true) }
            if d["ok"] as? Bool == true && innlogget && d["sendt"] as? Bool != true {
                UINotificationFeedbackGenerator().notificationOccurred(.success)
                self.si(self.T("Du er logget inn!", "You’re signed in!"), false)
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.6) { self.ferdig?() }
            } else {
                self.si(d["melding"] as? String ?? self.T("Sjekk e-posten din.", "Check your email."), false)
            }
        }
    }
    /// Kjører et kall mot nettsiden og gir svaret (en ordbok) tilbake på hovedtråden. Feil blir en melding i arket.
    private func kjorRaa(_ js: String, _ arg: [String: Any], _ svar: @escaping ([String: Any]) -> Void) {
        guard let w = nett else { return si(T("Siden er ikke klar ennå.", "The page isn’t ready yet."), true) }
        travel = true
        UIImpactFeedbackGenerator(style: .medium).impactOccurred()
        w.callAsyncJavaScript(js, arguments: arg, in: nil, in: .page) { [weak self] res in
            DispatchQueue.main.async {
                guard let self = self else { return }
                self.travel = false
                guard case .success(let v) = res, let d = v as? [String: Any] else { return self.si(self.T("Noe gikk galt. Prøv igjen.", "Something went wrong. Try again."), true) }
                svar(d)
            }
        }
    }
}

struct LoggInnArk: View {
    @ObservedObject var m: KontoModell
    @Environment(\.colorScheme) private var modus
    @FocusState private var fokus: String?
    private var papir: Color { modus == .dark ? Color(red: 0.11, green: 0.106, blue: 0.122) : Color(red: 1, green: 0.973, blue: 0.933) }
    private var kort: Color { modus == .dark ? Color(red: 0.173, green: 0.169, blue: 0.188) : .white }
    private var blekk: Color { modus == .dark ? Color(red: 1, green: 0.973, blue: 0.933) : Color(red: 0.086, green: 0.071, blue: 0.059) }
    private let gul = Color(red: 1, green: 0.824, blue: 0.247)
    private let rust = Color(red: 0.776, green: 0.235, blue: 0.067)
    private let morkBlekk = Color(red: 0.086, green: 0.071, blue: 0.059)

    var body: some View {
        VStack(spacing: 0) {
            Capsule().fill(blekk.opacity(0.25)).frame(width: 36, height: 5).padding(.top, 8)
            ScrollView {
                VStack(alignment: .leading, spacing: 14) {
                    if m.del == .navn {
                        navnSteg
                    } else {
                        Text(m.T("Kontoen din", "Your account")).font(.archivo(26, vekt: 900)).padding(.top, 10)
                        Text(m.T("Med konto huskes figuren din, tingene du låser opp, og Pluss – på alle telefonene dine.",
                                 "With an account your figure, the things you unlock and Plus follow you on every phone."))
                            .font(.archivo(15, vekt: 500)).opacity(0.8)

                        if m.del == .inn || m.del == .ny {
                            appleKnapp
                            skille
                        }

                        if m.del != .glemt {
                            HStack(spacing: 8) {
                                fane(.inn, m.T("Logg inn", "Sign in")); fane(.ny, m.T("Ny konto", "New account")); fane(.lenke, m.T("Lenke på e-post", "Email link"))
                            }
                        }
                        skjema
                    }

                    if !m.melding.isEmpty {
                        Text(m.melding).font(.archivo(15, vekt: 700)).foregroundColor(m.feil ? rust : blekk).transition(.opacity)
                    }
                }
                .padding(.horizontal, 20).padding(.bottom, 30)
            }
            .scrollDismissesKeyboardIfAvailable()
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(papir.ignoresSafeArea())
        .foregroundColor(blekk)
        .animation(.easeOut(duration: 0.18), value: m.melding)
        .animation(.easeOut(duration: 0.18), value: m.del)
    }

    // MARK: Logg inn med Apple – Apples egen knapp (kravet deres), i samme form som våre
    private var appleKnapp: some View {
        let stil: SignInWithAppleButton.Style = modus == .dark ? .white : .black
        return SignInWithAppleButton(.continue, onRequest: { m.appleForespoersel($0) }, onCompletion: { m.appleSvar($0) })
            .signInWithAppleButtonStyle(stil)
            .frame(height: 56)
            .clipShape(RoundedRectangle(cornerRadius: 14))
            .overlay(RoundedRectangle(cornerRadius: 14).stroke(blekk, lineWidth: 3))
            .opacity(m.travel ? 0.5 : 1)
            .disabled(m.travel)
            .padding(.top, 4)
            .accessibilityIdentifier("konto-apple")
    }
    private var skille: some View {
        HStack(spacing: 10) {
            Rectangle().fill(blekk.opacity(0.2)).frame(height: 1.5)
            Text(m.T("eller med e-post", "or with email")).font(.archivo(13, vekt: 700)).opacity(0.6).fixedSize()
            Rectangle().fill(blekk.opacity(0.2)).frame(height: 1.5)
        }
        .padding(.vertical, 2)
    }

    @ViewBuilder private var skjema: some View {
        switch m.del {
        case .inn:
            felt(m.T("Brukernavn eller e-post", "Username or email"), tekst: $m.navn, id: "navn", type: .username, tastatur: .emailAddress)
            passordFelt()
            knapp(m.T("Logg inn", "Sign in"))
            Button(action: { m.del = .glemt; m.melding = "" }) { Text(m.T("Glemt passordet?", "Forgot your password?")).font(.archivo(14, vekt: 700)).underline() }.buttonStyle(.plain).opacity(0.75)
        case .ny:
            felt(m.T("E-post", "Email"), tekst: $m.epost, id: "epost", type: .emailAddress, tastatur: .emailAddress)
            felt(m.T("Brukernavn", "Username"), tekst: $m.brukernavn, id: "brukernavn", type: .username, tastatur: .asciiCapable)
            Text(m.T("3–20 tegn: bokstaver, tall, punktum, strek.", "3–20 characters: letters, digits, dot, dash.")).font(.archivo(12, vekt: 500)).opacity(0.6)
            passordFelt(ny: true)
            knapp(m.T("Opprett konto", "Create account"))
        case .lenke:
            Text(m.T("Vi sender deg en lenke – trykk på den, så er du inne. Ingen passord.", "We’ll email you a link – tap it and you’re in. No password."))
                .font(.archivo(14, vekt: 500)).opacity(0.75)
            felt(m.T("E-post", "Email"), tekst: $m.epost, id: "epost", type: .emailAddress, tastatur: .emailAddress)
            knapp(m.T("Send lenke", "Send link"))
        case .glemt:
            Text(m.T("Skriv inn e-posten din, så sender vi en lenke for å sette nytt passord.", "Enter your email and we’ll send a link to set a new password."))
                .font(.archivo(14, vekt: 500)).opacity(0.75)
            felt(m.T("E-post", "Email"), tekst: $m.epost, id: "epost", type: .emailAddress, tastatur: .emailAddress)
            knapp(m.T("Send lenke", "Send link"))
            Button(action: { m.del = .inn; m.melding = "" }) { Text(m.T("Tilbake", "Back")).font(.archivo(14, vekt: 700)).underline() }.buttonStyle(.plain).opacity(0.75)
        case .navn:
            EmptyView()
        }
    }

    // MARK: Første gang med Apple: velg brukernavn (det andre ser i rommet og på tavla)
    @ViewBuilder private var navnSteg: some View {
        Text(m.T("Du er inne!", "You’re in!")).font(.archivo(26, vekt: 900)).padding(.top, 10)
        Text(m.T("Velg et brukernavn – det er det de andre ser. Du kan endre det senere under Innstillinger.",
                 "Pick a username – that’s what the others see. You can change it later under Settings."))
            .font(.archivo(15, vekt: 500)).opacity(0.8)
        felt(m.T("Brukernavn", "Username"), tekst: $m.brukernavn, id: "brukernavn", type: .username, tastatur: .asciiCapable)
            .onAppear { fokus = "brukernavn" }
        Text(m.T("3–20 tegn: bokstaver, tall, punktum, strek.", "3–20 characters: letters, digits, dot, dash.")).font(.archivo(12, vekt: 500)).opacity(0.6)
        knapp(m.T("Lagre", "Save"))
        Button(action: m.hoppOverNavn) { Text(m.T("Velg senere", "Choose later")).font(.archivo(14, vekt: 700)).underline() }
            .buttonStyle(.plain).opacity(0.75).disabled(m.travel)
    }

    private func fane(_ d: KontoModell.Del, _ t: String) -> some View {
        Button(action: { m.del = d; m.melding = ""; UISelectionFeedbackGenerator().selectionChanged() }) {
            Text(t).font(.archivo(14, vekt: 800)).lineLimit(1).minimumScaleFactor(0.8)
                .frame(maxWidth: .infinity).frame(height: 38)
                .background(Capsule().fill(m.del == d ? gul : kort))
                .overlay(Capsule().stroke(blekk, lineWidth: m.del == d ? 2.5 : 1.5))
                .foregroundColor(m.del == d ? morkBlekk : blekk)
        }.buttonStyle(.plain)
    }

    private func felt(_ etikett: String, tekst: Binding<String>, id: String, type: UITextContentType, tastatur: UIKeyboardType) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(etikett).font(.archivo(14, vekt: 800))
            TextField("", text: tekst)
                .textContentType(type).keyboardType(tastatur).textInputAutocapitalization(.never).disableAutocorrection(true)
                .submitLabel(.next).focused($fokus, equals: id)
                .onSubmit { if m.del == .navn { m.send() } }
                .font(.archivo(18, vekt: 600))
                .padding(.horizontal, 14).frame(height: 52)
                .background(RoundedRectangle(cornerRadius: 12).fill(kort))
                .overlay(RoundedRectangle(cornerRadius: 12).stroke(blekk, lineWidth: 2.5))
        }
    }

    private func passordFelt(ny: Bool = false) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(ny ? m.T("Velg et passord", "Choose a password") : m.T("Passord", "Password")).font(.archivo(14, vekt: 800))
            SecureField("", text: $m.passord)
                .textContentType(ny ? .newPassword : .password).submitLabel(.go).focused($fokus, equals: "passord")
                .onSubmit { m.send() }
                .font(.archivo(18, vekt: 600))
                .padding(.horizontal, 14).frame(height: 52)
                .background(RoundedRectangle(cornerRadius: 12).fill(kort))
                .overlay(RoundedRectangle(cornerRadius: 12).stroke(blekk, lineWidth: 2.5))
        }
    }

    private func knapp(_ tekst: String) -> some View {
        Button(action: m.send) {
            ZStack {
                Text(tekst.uppercased()).font(.archivo(18, vekt: 900)).opacity(m.travel ? 0 : 1)
                if m.travel { ProgressView().tint(morkBlekk) }
            }
            .frame(maxWidth: .infinity).frame(height: 56).foregroundColor(morkBlekk)
            .background(ZStack {
                RoundedRectangle(cornerRadius: 14).fill(morkBlekk).offset(x: 4, y: 4)
                RoundedRectangle(cornerRadius: 14).fill(gul)
                RoundedRectangle(cornerRadius: 14).stroke(morkBlekk, lineWidth: 3)
            })
        }.buttonStyle(.plain).disabled(m.travel).padding(.top, 4)
    }
}

private extension View {
    @ViewBuilder func scrollDismissesKeyboardIfAvailable() -> some View {
        if #available(iOS 16.0, *) { self.scrollDismissesKeyboard(.interactively) } else { self }
    }
}
