import SwiftUI
import StoreKit

/// Pluss-tilbudet som et iOS-ark: hva Pluss er, «Prøv gratis i kveld», Kveldspass og Årspass med App Store-pris,
/// og «Gjenopprett kjøp». Prisene kommer fra App Store (riktig valuta for den som ser på).
struct PlussArk: View {
    @ObservedObject var m: PlussModell
    @Environment(\.colorScheme) private var modus
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
                    Text("✨ mittvors pluss").font(.archivo(26, vekt: 900)).padding(.top, 10)
                    Text(m.T("Med Pluss hos verten får hele rommet alle lekene og pakkene, og dere kan være opptil 16 telefoner. Gjestene trenger ikke betale.",
                             "When the host has Plus, the whole room gets every game and pack, and up to 16 phones can join. Guests don’t pay."))
                        .font(.archivo(16, vekt: 500)).lineSpacing(3)

                    if m.aktiv {
                        HStack(spacing: 8) {
                            Image(systemName: "checkmark.seal.fill").foregroundColor(rust)
                            Text(m.T("Du har Pluss", "You have Plus") + (datoTekst.isEmpty ? "" : " · " + m.T("til ", "until ") + datoTekst)).font(.archivo(15, vekt: 800))
                        }
                        .padding(12).frame(maxWidth: .infinity, alignment: .leading)
                        .background(RoundedRectangle(cornerRadius: 12).fill(gul.opacity(0.35)))
                    }

                    if !m.inne {
                        knapp(m.T("Logg inn for å kjøpe", "Sign in to buy"), travel: false, action: { m.loggInn?() })
                    } else if !m.gratisBrukt && !m.aktiv {
                        knapp(m.T("Prøv gratis i kveld", "Try it free tonight"), travel: m.travel == "gratis", action: m.gratis)
                        Text(m.T("Første kveld er gratis. Etterpå:", "Your first night is free. After that:")).font(.archivo(14, vekt: 700)).opacity(0.7)
                    }

                    if m.produkter.isEmpty {
                        if m.klarTilKjop { ProgressView().frame(maxWidth: .infinity) }
                    } else {
                        ForEach(m.produkter, id: \.id) { p in produktKort(p) }
                    }

                    if !m.melding.isEmpty {
                        Text(m.melding).font(.archivo(14, vekt: 700)).foregroundColor(m.feil ? rust : blekk).transition(.opacity)
                    }

                    Button(action: m.gjenopprett) {
                        HStack(spacing: 6) {
                            if m.travel == "gjenopprett" { ProgressView().scaleEffect(0.7) }
                            Text(m.T("Gjenopprett kjøp", "Restore purchases")).font(.archivo(14, vekt: 700)).underline()
                        }
                    }.buttonStyle(.plain).opacity(0.75).padding(.top, 4)

                    Text(m.T("Passet starter med en gang og fornyes ikke av seg selv. Betaling trekkes via App Store.",
                             "The pass starts right away and does not renew by itself. Payment is charged through the App Store."))
                        .font(.archivo(12, vekt: 500)).opacity(0.6)
                }
                .padding(.horizontal, 20).padding(.bottom, 30)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(papir.ignoresSafeArea())
        .foregroundColor(blekk)
        .animation(.easeOut(duration: 0.18), value: m.melding)
        .onAppear { m.last() }
    }

    private var datoTekst: String {
        guard !m.til.isEmpty else { return "" }
        let f = ISO8601DateFormatter(); f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        var d = f.date(from: m.til)
        if d == nil { f.formatOptions = [.withInternetDateTime]; d = f.date(from: m.til) }
        guard let dato = d else { return "" }
        let ut = DateFormatter(); ut.locale = Locale(identifier: m.engelsk ? "en_GB" : "nb_NO"); ut.dateStyle = .medium; ut.timeStyle = .short
        return ut.string(from: dato)
    }

    private func produktKort(_ p: Product) -> some View {
        let kveld = p.id.hasSuffix("kveld")
        return HStack(alignment: .center, spacing: 12) {
            VStack(alignment: .leading, spacing: 3) {
                Text(p.displayName.isEmpty ? (kveld ? m.T("Kveldspass", "Night pass") : m.T("Årspass", "Year pass")) : p.displayName).font(.archivo(19, vekt: 900))
                Text(kveld ? m.T("Pluss i 24 timer", "Plus for 24 hours") : m.T("Pluss i ett år", "Plus for one year")).font(.archivo(14, vekt: 500)).opacity(0.7)
            }
            Spacer()
            Button(action: { m.kjop(p) }) {
                ZStack {
                    Text(p.displayPrice).font(.archivo(17, vekt: 900)).opacity(m.travel == p.id ? 0 : 1)
                    if m.travel == p.id { ProgressView().tint(morkBlekk) }
                }
                .padding(.horizontal, 16).frame(height: 46).foregroundColor(morkBlekk)
                .background(ZStack {
                    RoundedRectangle(cornerRadius: 12).fill(morkBlekk).offset(x: 3, y: 3)
                    RoundedRectangle(cornerRadius: 12).fill(gul)
                    RoundedRectangle(cornerRadius: 12).stroke(morkBlekk, lineWidth: 2.5)
                })
            }.buttonStyle(.plain).disabled(m.travel != nil)
        }
        .padding(14)
        .background(RoundedRectangle(cornerRadius: 14).fill(kort))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(blekk.opacity(0.25), lineWidth: 1.5))
    }

    private func knapp(_ tekst: String, travel: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            ZStack {
                Text(tekst.uppercased()).font(.archivo(18, vekt: 900)).opacity(travel ? 0 : 1)
                if travel { ProgressView().tint(morkBlekk) }
            }
            .frame(maxWidth: .infinity).frame(height: 56).foregroundColor(morkBlekk)
            .background(ZStack {
                RoundedRectangle(cornerRadius: 14).fill(morkBlekk).offset(x: 4, y: 4)
                RoundedRectangle(cornerRadius: 14).fill(gul)
                RoundedRectangle(cornerRadius: 14).stroke(morkBlekk, lineWidth: 3)
            })
        }.buttonStyle(.plain).disabled(m.travel != nil)
    }
}
