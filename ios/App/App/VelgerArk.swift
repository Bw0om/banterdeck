import SwiftUI
import UIKit

/// Lekvelgeren i lobbyen som et ekte iOS-ark: anbefalte leker øverst, så alle lekene gruppert, ⓘ med regler, og Start.
/// Lista kommer fra nettsiden (window.__mvLobby.leker()), og valget går tilbake dit (window.__mvLobby.trykk) –
/// så uke-valg i Nyhetsrunden, kortreglene i Ring of Fire og Pluss-låsen virker som før.
struct Lek: Identifiable {
    let id: String, navn: String, om: String, g: String, lek: String, modus: String
    let laast: Bool, pluss: Bool, min: Int, regler: [String]

    init?(_ d: [String: Any]) {
        guard let id = d["id"] as? String, let navn = d["navn"] as? String else { return nil }
        self.id = id; self.navn = navn
        om = d["om"] as? String ?? ""; g = d["g"] as? String ?? "start"; lek = d["lek"] as? String ?? id; modus = d["modus"] as? String ?? "*"
        laast = d["laast"] as? Bool ?? false; pluss = d["pluss"] as? Bool ?? false; min = d["min"] as? Int ?? 0
        regler = d["regler"] as? [String] ?? []
    }
}

struct LekGruppe: Identifiable {
    let id = UUID(), navn: String, leker: [Lek]
}

final class VelgerModell: ObservableObject {
    let tittel: String, anbefaltNavn: String, senereNavn: String, startOrd: String, minstOrd: String, spillereOrd: String, plussTekst: String
    let anbefalt: [Lek], grupper: [LekGruppe], senere: [Lek]
    var velg: ((Lek) -> Void)?

    init(_ d: [String: Any]) {
        tittel = d["tittel"] as? String ?? "Velg lek"; anbefaltNavn = d["anbefaltNavn"] as? String ?? "Anbefalt nå"; senereNavn = d["senere"] as? String ?? "Når dere er flere"
        startOrd = d["start"] as? String ?? "Start"; minstOrd = d["minst"] as? String ?? "Minst"; spillereOrd = d["spillereOrd"] as? String ?? "spillere"; plussTekst = d["plussTekst"] as? String ?? "Krever Pluss"
        var alle: [Lek] = [], grupperUt: [LekGruppe] = [], senereUt: [Lek] = []
        for g in d["grupper"] as? [[String: Any]] ?? [] {
            let leker = (g["leker"] as? [[String: Any]] ?? []).compactMap(Lek.init)
            alle += leker
            let naa = leker.filter { $0.min == 0 }; senereUt += leker.filter { $0.min > 0 }
            if !naa.isEmpty { grupperUt.append(LekGruppe(navn: g["navn"] as? String ?? "", leker: naa)) }
        }
        let ider = d["anbefalt"] as? [String] ?? []
        anbefalt = ider.compactMap { id in alle.first { $0.id == id && !$0.laast && $0.min == 0 } }
        grupper = grupperUt; senere = senereUt
    }
}

struct VelgerArk: View {
    @ObservedObject var m: VelgerModell
    @Environment(\.colorScheme) private var modus
    @State private var detalj: Lek? = nil   // ⓘ: leken som vises med regler
    private var papir: Color { modus == .dark ? Color(red: 0.11, green: 0.106, blue: 0.122) : Color(red: 1, green: 0.973, blue: 0.933) }
    private let rust = Color(red: 0.776, green: 0.235, blue: 0.067)
    private let gul = Color(red: 1, green: 0.824, blue: 0.247)

    var body: some View {
        NavigationView {
            List {
                if !m.anbefalt.isEmpty {
                    Section(header: etikett(m.anbefaltNavn)) { ForEach(m.anbefalt) { rad($0) } }
                }
                ForEach(m.grupper) { g in
                    Section(header: etikett(g.navn)) { ForEach(g.leker) { rad($0) } }
                }
                if !m.senere.isEmpty {
                    Section(header: etikett(m.senereNavn)) {
                        ForEach(m.senere) { l in
                            HStack {
                                Text(l.navn).font(.archivo(18, vekt: 800)).opacity(0.45)
                                Spacer()
                                Text("👥 \(m.minstOrd) \(l.min)").font(.archivo(14, vekt: 600)).opacity(0.6)
                                info(l)
                            }
                        }
                    }
                }
            }
            .listStyle(.insetGrouped)
            .bakgrunn(papir)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .principal) { Text(m.tittel).font(.archivo(18, vekt: 900)) } }
            // Én skjult lenke for alle ⓘ-ene: trykk på ⓘ setter `detalj`, og lenka åpner seg
            .background(
                NavigationLink(destination: Group { if let l = detalj { LekDetalj(l: l, m: m, trykk: trykk) } },
                               isActive: Binding(get: { detalj != nil }, set: { if !$0 { detalj = nil } })) { EmptyView() }.hidden()
            )
        }
        .navigationViewStyle(.stack)
        .accentColor(rust)
    }

    private func etikett(_ t: String) -> some View { Text(t).font(.archivo(13, vekt: 800)).textCase(nil) }

    private func rad(_ l: Lek) -> some View {
        HStack(spacing: 10) {
            Button(action: { trykk(l) }) {
                HStack(spacing: 8) {
                    Text(l.navn).font(.archivo(18, vekt: 800)).foregroundColor(.primary)
                    if l.pluss { Text(l.laast ? "🔒 Pluss" : "✨ Pluss").font(.archivo(12, vekt: 800)).padding(.horizontal, 7).padding(.vertical, 3).background(Capsule().fill(gul.opacity(l.laast ? 0.35 : 1))).foregroundColor(.black) }
                    Spacer()
                }
                .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            info(l)
        }
    }

    /// ⓘ: hva leken går ut på, reglene, og Start
    private func info(_ l: Lek) -> some View {
        Button(action: { detalj = l }) {
            Image(systemName: "info.circle").font(.system(size: 21, weight: .semibold)).foregroundColor(rust)
                .frame(width: 36, height: 36).contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }

    private func trykk(_ l: Lek) {
        UIImpactFeedbackGenerator(style: .medium).impactOccurred()
        m.velg?(l)
    }
}

struct LekDetalj: View {
    let l: Lek
    @ObservedObject var m: VelgerModell
    let trykk: (Lek) -> Void
    @Environment(\.colorScheme) private var modus
    private var papir: Color { modus == .dark ? Color(red: 0.11, green: 0.106, blue: 0.122) : Color(red: 1, green: 0.973, blue: 0.933) }
    private let gul = Color(red: 1, green: 0.824, blue: 0.247)
    private let blekk = Color(red: 0.086, green: 0.071, blue: 0.059)

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                Text(l.navn).font(.archivo(30, vekt: 900)).padding(.top, 6)
                if !l.om.isEmpty { Text(l.om).font(.archivo(17, vekt: 500)).lineSpacing(3) }
                if !l.regler.isEmpty {
                    VStack(alignment: .leading, spacing: 8) {
                        ForEach(Array(l.regler.enumerated()), id: \.offset) { i, r in
                            HStack(alignment: .top, spacing: 10) {
                                Text("\(i + 1)").font(.archivo(15, vekt: 900)).frame(width: 22, height: 22).background(Circle().fill(gul)).foregroundColor(blekk)
                                Text(r).font(.archivo(16, vekt: 500)).lineSpacing(2)
                            }
                        }
                    }.padding(.top, 4)
                }
                if l.min > 0 {
                    Text("👥 \(m.minstOrd) \(l.min) \(m.spillereOrd)").font(.archivo(15, vekt: 700)).opacity(0.7)
                } else if l.laast {
                    Text("✨ \(m.plussTekst)").font(.archivo(15, vekt: 700)).opacity(0.7)
                }
                if l.min == 0 {
                    Button(action: { trykk(l) }) {
                        Text("\(m.startOrd) \(l.navn)".uppercased()).font(.archivo(18, vekt: 900)).tracking(0.5)
                            .frame(maxWidth: .infinity).frame(height: 58).foregroundColor(blekk)
                            .background(ZStack {
                                RoundedRectangle(cornerRadius: 14).fill(blekk).offset(x: 4, y: 4)
                                RoundedRectangle(cornerRadius: 14).fill(gul)
                                RoundedRectangle(cornerRadius: 14).stroke(blekk, lineWidth: 3)
                            })
                    }.padding(.top, 10)
                }
            }
            .padding(.horizontal, 20).padding(.bottom, 30)
        }
        .background(papir.ignoresSafeArea())
        .navigationBarTitleDisplayMode(.inline)
    }
}

private extension View {
    /// Papirfarge bak lista der iOS lar oss (16+); på iOS 15 beholder lista systemfargen
    @ViewBuilder func bakgrunn(_ c: Color) -> some View {
        if #available(iOS 16.0, *) { self.scrollContentBackground(.hidden).background(c) } else { self }
    }
}
