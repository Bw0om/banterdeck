import SwiftUI
import UIKit
import WebKit

/// Logg inn / ny konto / lenke på e-post som et iOS-ark. Selve innloggingen gjøres av nettsiden (window.__mvKonto),
/// så kontoen, øktene og e-postene virker nøyaktig som på nett – dette er bare skjemaet, med iPhonens tastatur og felt.
@MainActor
final class KontoModell: ObservableObject {
    enum Del: String, CaseIterable { case inn, ny, lenke, glemt }
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
        }
    }

    private func si(_ t: String, _ erFeil: Bool) {
        melding = t; feil = erFeil
        if erFeil { UINotificationFeedbackGenerator().notificationOccurred(.warning) }
    }

    private func kjor(_ js: String, _ arg: [String: Any], innlogget: Bool) {
        guard let w = nett else { return si(T("Siden er ikke klar ennå.", "The page isn’t ready yet."), true) }
        travel = true
        UIImpactFeedbackGenerator(style: .medium).impactOccurred()
        w.callAsyncJavaScript(js, arguments: arg, in: nil, in: .page) { [weak self] res in
            DispatchQueue.main.async {
                guard let self = self else { return }
                self.travel = false
                guard case .success(let v) = res, let d = v as? [String: Any] else { return self.si(self.T("Noe gikk galt. Prøv igjen.", "Something went wrong. Try again."), true) }
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
    }
}

struct LoggInnArk: View {
    @ObservedObject var m: KontoModell
    @Environment(\.colorScheme) private var modus
    @FocusState private var fokus: String?
    private var papir: Color { modus == .dark ? Color(red: 0.11, green: 0.106, blue: 0.122) : Color(red: 1, green: 0.973, blue: 0.933) }
    private var kort: Color { modus == .dark ? Color.white.opacity(0.07) : .white }
    private var blekk: Color { modus == .dark ? Color(red: 1, green: 0.973, blue: 0.933) : Color(red: 0.086, green: 0.071, blue: 0.059) }
    private let gul = Color(red: 1, green: 0.824, blue: 0.247)
    private let rust = Color(red: 0.776, green: 0.235, blue: 0.067)
    private let morkBlekk = Color(red: 0.086, green: 0.071, blue: 0.059)

    var body: some View {
        VStack(spacing: 0) {
            Capsule().fill(blekk.opacity(0.25)).frame(width: 36, height: 5).padding(.top, 8)
            ScrollView {
                VStack(alignment: .leading, spacing: 14) {
                    Text(m.T("Kontoen din", "Your account")).font(.archivo(26, vekt: 900)).padding(.top, 10)
                    Text(m.T("Med konto huskes figuren din, tingene du låser opp, og Pluss – på alle telefonene dine.",
                             "With an account your figure, the things you unlock and Plus follow you on every phone."))
                        .font(.archivo(15, vekt: 500)).opacity(0.8)

                    if m.del != .glemt {
                        HStack(spacing: 8) {
                            fane(.inn, m.T("Logg inn", "Sign in")); fane(.ny, m.T("Ny konto", "New account")); fane(.lenke, m.T("Lenke på e-post", "Email link"))
                        }
                    }

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
