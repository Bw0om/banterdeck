import SwiftUI
import UIKit
import WebKit

/// Gjengsiden native (Deg-fanen): gjengene dine, og én gjeng med kvelden, lommeboka, lovboka, kåringene, sesongtabellen og
/// kveldene. Nettsiden (Gjeng.astro) henter og regner ut alt og sender det ferdig (mv-skjerm «gjeng»); trykkene går tilbake
/// til nettsidens egne knapper (window.__mvGjeng.trykk), skjemaene fylles fra iPhonens dialog (__mvGjeng.skriv).
final class GjengModell: ObservableObject {
    @Published var d: [String: Any] = [:]
    @Published var engelsk = false
    weak var nett: WKWebView?
    /// Skallet viser dialogen med tekstfelt (tittel, plass, verdi, knapp, avbryt, ferdig)
    var dialog: ((String, String, String, String, String, @escaping (String) -> Void) -> Void)?

    func sett(_ d: [String: Any]) { self.d = d; engelsk = d["en"] as? Bool ?? engelsk }
    func T(_ no: String, _ en: String) -> String { engelsk ? en : no }
    func s(_ k: String) -> String { d[k] as? String ?? "" }
    func b(_ k: String) -> Bool { d[k] as? Bool ?? false }
    func liste(_ k: String) -> [[String: Any]] { d[k] as? [[String: Any]] ?? [] }
    func obj(_ k: String) -> [String: Any]? { d[k] as? [String: Any] }

    private func js(_ kode: String) { nett?.evaluateJavaScript(kode, completionHandler: nil) }
    private func json(_ x: Any) -> String? { (try? JSONSerialization.data(withJSONObject: x)).flatMap { String(data: $0, encoding: .utf8) } }
    func trykk(_ g: String, _ attrs: [String: String] = [:]) {
        UIImpactFeedbackGenerator(style: .light).impactOccurred()
        guard let j = json([g, attrs]) else { return }
        js("window.__mvGjeng && window.__mvGjeng.trykk.apply(null, \(j))")
    }
    func sesong(_ s: String) { UISelectionFeedbackGenerator().selectionChanged(); if let j = json([s]) { js("window.__mvGjeng && window.__mvGjeng.sesong(\(j)[0])") } }
    func sorter(_ k: String) { UISelectionFeedbackGenerator().selectionChanged(); if let j = json([k]) { js("window.__mvGjeng && window.__mvGjeng.sort(\(j)[0])") } }
    func skriv(_ skjema: String, _ felt: String, _ verdi: String) { if let j = json([skjema, felt, verdi]) { js("window.__mvGjeng && window.__mvGjeng.skriv.apply(null, \(j))") } }
    func lenke(_ href: String) { UISelectionFeedbackGenerator().selectionChanged(); if let j = json([href]) { js("window.__mvGjeng && window.__mvGjeng.lenke(\(j)[0])") } }
    func gaa(_ url: String) { UISelectionFeedbackGenerator().selectionChanged(); if let j = json([url]) { js("window.__mvGjeng && window.__mvGjeng.gaa(\(j)[0])") } }
}

struct GjengSkjerm: View {
    @ObservedObject var m: GjengModell
    @Environment(\.colorScheme) private var modus
    private var papir: Color { modus == .dark ? Color(red: 0.11, green: 0.106, blue: 0.122) : Color(red: 1, green: 0.973, blue: 0.933) }
    private var kort: Color { modus == .dark ? Color(red: 0.173, green: 0.169, blue: 0.188) : .white }
    private var blekk: Color { modus == .dark ? Color(red: 1, green: 0.973, blue: 0.933) : Color(red: 0.086, green: 0.071, blue: 0.059) }
    private let gul = Color(red: 1, green: 0.824, blue: 0.247)
    private let rust = Color(red: 0.776, green: 0.235, blue: 0.067)
    private let mint = Color(red: 0.388, green: 0.886, blue: 0.659)
    private let morkBlekk = Color(red: 0.086, green: 0.071, blue: 0.059)
    private let gjengFarger: [Color] = [Color(red: 0.388, green: 0.886, blue: 0.659), Color(red: 1, green: 0.612, blue: 0.761), Color(red: 1, green: 0.824, blue: 0.247), Color(red: 0.353, green: 0.553, blue: 0.933), Color(red: 1, green: 0.357, blue: 0.122)]

    var body: some View {
        ZStack {
            papir.ignoresSafeArea()
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    if m.s("visning") == "mine" { mine } else { gjengen }
                }
                .padding(.horizontal, 16).padding(.top, 6).padding(.bottom, 110)   // plass til fanelinja
            }
        }
        .foregroundColor(blekk)
    }

    // MARK: Gjengene dine
    @ViewBuilder private var mine: some View {
        tilbake(m.T("Deg", "You")) { m.gaa(m.s("konto")) }
        Text(m.T("Gjengene", "Crews").uppercased()).font(.archivo(34, vekt: 900))
        if !m.b("innlogget") {
            VStack(alignment: .leading, spacing: 10) {
                Text(m.T("Samle poengene fra kveld til kveld", "Keep score from night to night")).font(.archivo(17, vekt: 800))
                Button(action: { m.gaa(m.s("konto")) }) { knapp(m.T("Lag gjeng", "Make a crew"), gul: true) }.buttonStyle(TrykkStilSlutt())
            }
            .padding(16).background(RoundedRectangle(cornerRadius: 18).fill(kort)).overlay(RoundedRectangle(cornerRadius: 18).stroke(blekk.opacity(0.2), lineWidth: 1.5))
        } else {
            if !m.s("feil").isEmpty { Text(m.s("feil")).font(.archivo(14, vekt: 700)).foregroundColor(rust) }
            let g = m.liste("gjenger")
            ForEach(Array(g.enumerated()), id: \.offset) { i, x in
                HStack(spacing: 10) {
                    Button(action: { m.gaa(x["lenke"] as? String ?? "") }) {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(x["navn"] as? String ?? "").font(.archivo(20, vekt: 900)).lineLimit(1).minimumScaleFactor(0.7)
                            Text(x["under"] as? String ?? "").font(.archivo(13, vekt: 600)).opacity(0.7)
                        }
                        .frame(maxWidth: .infinity, alignment: .leading).contentShape(Rectangle())
                    }.buttonStyle(.plain)
                    Button(action: { m.gaa(x["start"] as? String ?? "") }) {
                        HStack(spacing: 5) { Image(systemName: "play.fill").font(.system(size: 12, weight: .bold)); Text(m.T("Start kveld", "Start night").uppercased()).font(.archivo(12, vekt: 900)) }
                            .padding(.horizontal, 12).frame(height: 36).foregroundColor(morkBlekk)
                            .background(ZStack { RoundedRectangle(cornerRadius: 10).fill(blekk).offset(x: 2, y: 2); RoundedRectangle(cornerRadius: 10).fill(gul); RoundedRectangle(cornerRadius: 10).stroke(blekk, lineWidth: 2) })
                    }.buttonStyle(TrykkStilSlutt())
                }
                .padding(14)
                .background(RoundedRectangle(cornerRadius: 18).fill(kort))
                .overlay(RoundedRectangle(cornerRadius: 18).stroke(blekk, lineWidth: 2.5))
                .background(RoundedRectangle(cornerRadius: 18).fill(gjengFarger[hash(x["kode"] as? String ?? "") % gjengFarger.count]).offset(x: 5, y: 5))
            }
            HStack(spacing: 10) {
                Button(action: {
                    m.dialog?(m.T("Ny gjeng", "New crew"), m.T("F.eks. Gutta på tur", "E.g. The Usual Suspects"), "", m.T("Lag", "Create"), m.T("Avbryt", "Cancel")) { t in m.skriv("gjLag", "gjNavn", t) }
                }) { knapp("+ " + m.T("Ny gjeng", "New crew"), gul: true) }.buttonStyle(TrykkStilSlutt())
                Button(action: {
                    m.dialog?(m.T("Gjengkode", "Crew code"), m.T("8 tegn", "8 characters"), "", m.T("Bli med", "Join"), m.T("Avbryt", "Cancel")) { t in m.skriv("gjBli", "gjKode", t.uppercased()) }
                }) { knapp(m.T("Har du en gjengkode?", "Got a crew code?"), gul: false) }.buttonStyle(TrykkStilSlutt())
            }
            .padding(.top, 6)
        }
    }
    private func hash(_ s: String) -> Int { var h: UInt32 = 0; for c in s.unicodeScalars { h = h &* 31 &+ c.value }; return Int(h % 1000) }

    // MARK: Én gjeng
    @ViewBuilder private var gjengen: some View {
        tilbake(m.T("Gjengene dine", "Your crews")) { m.gaa(m.s("side")) }
        Text(m.s("navn")).font(.archivo(34, vekt: 900)).tracking(-0.5).lineLimit(2).minimumScaleFactor(0.6)
        if m.b("ny") {
            VStack(alignment: .leading, spacing: 4) {
                Text(m.T("Gjengen er klar! 🎉", "The crew is ready! 🎉")).font(.archivo(17, vekt: 900))
                Text(m.T("Del lenken med gjengen. Når dere skal spille: trykk «Start kvelden» – alle får varsel og blir med uten kode.", "Share the link with the crew. When you play: tap “Start the night” – everyone gets a notification and joins without a code.")).font(.archivo(13, vekt: 600)).opacity(0.8).fixedSize(horizontal: false, vertical: true)
            }
            .padding(14).background(RoundedRectangle(cornerRadius: 16).fill(gul.opacity(modus == .dark ? 0.18 : 0.28))).overlay(RoundedRectangle(cornerRadius: 16).stroke(gul, lineWidth: 2))
        }
        HStack(spacing: 10) {
            Button(action: { m.trykk("inviter") }) { knapp(m.T("Inviter gjengen", "Invite the crew"), gul: true) }.buttonStyle(TrykkStilSlutt())
            if !m.b("medlem") {
                Button(action: { m.trykk("bli-med") }) { knapp(m.b("innlogget") ? m.T("Bli med i gjengen", "Join the crew") : m.T("Logg inn for å bli med", "Log in to join"), gul: false) }.buttonStyle(TrykkStilSlutt())
            }
        }
        kvelden
        ventende
        lomme
        lovbok
        sesonger
        tabellen
        kveldene
        eier
    }

    // MARK: Kvelden: pågår, ikke avsluttet, start
    @ViewBuilder private var kvelden: some View {
        if m.b("medlem") {
            if let k = m.obj("kveld") {
                boks {
                    etikett(m.T("Pågår nå", "Happening now"))
                    Text("🎉 " + (k["vert"] as? String ?? "") + m.T(" har startet kvelden", " has started the night")).font(.archivo(20, vekt: 900)).fixedSize(horizontal: false, vertical: true)
                    Text(k["under"] as? String ?? "").font(.archivo(13, vekt: 600)).opacity(0.75).fixedSize(horizontal: false, vertical: true)
                    Button(action: { m.lenke(m.s("startLenke")) }) { storKnapp(k["erMed"] as? Bool == true ? m.T("Tilbake til kvelden", "Back to the night") : m.T("Bli med i kvelden", "Join the night")) }.buttonStyle(TrykkStilSlutt()).padding(.top, 4)
                }
            } else {
                if let gm = m.obj("gammel") {
                    VStack(alignment: .leading, spacing: 8) {
                        etikett(m.T("Ikke avsluttet", "Not ended yet"))
                        Text("🏁 " + m.T("Kvelden fra ", "The night from ") + (gm["dato"] as? String ?? "")).font(.archivo(18, vekt: 900)).fixedSize(horizontal: false, vertical: true)
                        if gm["erVert"] as? Bool == true {
                            Text(m.T("Avslutter du den, lagres den i tabellen og vinneren får velge regel.", "Ending it saves it to the table and lets the winner pick a rule.")).font(.archivo(13, vekt: 600)).opacity(0.75).fixedSize(horizontal: false, vertical: true)
                            Button(action: { m.trykk("avslutt-kveld") }) { storKnapp(m.T("Avslutt kvelden", "End the night")) }.buttonStyle(TrykkStilSlutt()).padding(.top, 4)
                        } else {
                            Text((gm["vert"] as? String ?? "") + m.T(" var vert og kan avslutte den. Starter noen en ny kveld, avsluttes den også.", " hosted it and can end it. Starting a new night ends it too.")).font(.archivo(13, vekt: 600)).opacity(0.75).fixedSize(horizontal: false, vertical: true)
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading).padding(14)
                    .background(RoundedRectangle(cornerRadius: 16).fill(kort))
                    .overlay(RoundedRectangle(cornerRadius: 16).stroke(style: StrokeStyle(lineWidth: 2, dash: [6, 5])).foregroundColor(blekk.opacity(0.35)))
                }
                VStack(alignment: .leading, spacing: 8) {
                    Button(action: { m.lenke(m.s("startLenke")) }) { storKnapp(m.T("🎲 Start kvelden", "🎲 Start the night")) }.buttonStyle(TrykkStilSlutt())
                    Text(m.T("Gjengen får varsel og blir med uten kode. Lekene velger du i rommet.", "The crew gets a notification and joins without a code. You pick the games in the room.")).font(.archivo(13, vekt: 600)).opacity(0.7).fixedSize(horizontal: false, vertical: true)
                }
            }
        }
    }

    // MARK: Til avgjørelse (børsen)
    @ViewBuilder private var ventende: some View {
        let v = m.liste("ventende")
        if !v.isEmpty {
            overskrift("⏳ " + m.T("Til avgjørelse", "Awaiting votes"))
            Text(m.T("Meldt i løpet av kvelden, men for få rakk å stemme. Skjedde det? Avgjøres når to til har stemt – eller etter 48 timer.", "Reported during the night, but too few voted. Did it happen? Settled when two more have voted – or after 48 hours.")).font(.archivo(13, vekt: 600)).opacity(0.7).fixedSize(horizontal: false, vertical: true)
            ForEach(Array(v.enumerated()), id: \.offset) { _, u in
                VStack(alignment: .leading, spacing: 6) {
                    Text(u["q"] as? String ?? "").font(.archivo(16, vekt: 800)).fixedSize(horizontal: false, vertical: true)
                    Text(u["under"] as? String ?? "").font(.archivo(12, vekt: 600)).opacity(0.7).fixedSize(horizontal: false, vertical: true)
                    if u["kanStemme"] as? Bool == true {
                        let mitt = u["minStemme"] as? String ?? ""
                        HStack(spacing: 8) {
                            Button(action: { m.trykk("utsatt-stem", ["id": u["id"] as? String ?? "", "v": "ja"]) }) { valg(m.T("✅ Det skjedde", "✅ It happened"), paa: mitt == "ja") }.buttonStyle(.plain)
                            Button(action: { m.trykk("utsatt-stem", ["id": u["id"] as? String ?? "", "v": "nei"]) }) { valg(m.T("❌ Skjedde ikke", "❌ Didn’t happen"), paa: mitt == "nei") }.buttonStyle(.plain)
                        }
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading).padding(14)
                .background(RoundedRectangle(cornerRadius: 16).fill(kort)).overlay(RoundedRectangle(cornerRadius: 16).stroke(blekk.opacity(0.2), lineWidth: 1.5))
            }
        }
    }

    // MARK: Lommeboka: deg i gjengen og formuen
    @ViewBuilder private var lomme: some View {
        if let meg = m.obj("meg") {
            boks {
                etikett(m.T("Deg i gjengen", "You in the crew"))
                HStack(alignment: .firstTextBaseline, spacing: 6) {
                    Text(meg["saldo"] as? String ?? "").font(.archivo(26, vekt: 900)).foregroundColor(rust)
                    Text(m.T("i lommeboka", "in your wallet") + " · " + (meg["under"] as? String ?? "")).font(.archivo(13, vekt: 600)).opacity(0.7)
                }
                HStack(spacing: 10) {
                    VStack(alignment: .leading, spacing: 1) {
                        Text(m.T("Navnet ditt i gjengen", "Your name in the crew")).font(.archivo(12, vekt: 700)).opacity(0.65)
                        Text(meg["navn"] as? String ?? "").font(.archivo(17, vekt: 800)).lineLimit(1)
                    }
                    Spacer(minLength: 6)
                    Button(action: {
                        m.dialog?(m.T("Navnet ditt i gjengen", "Your name in the crew"), m.T("Navnet ditt i gjengen", "Your name in the crew"), meg["navn"] as? String ?? "", m.T("Lagre navn", "Save name"), m.T("Avbryt", "Cancel")) { t in m.skriv("gjProfil", "gjProfilNavn", t) }
                    }) { knapp(m.T("Endre", "Change"), gul: false) }.buttonStyle(TrykkStilSlutt())
                }
                Text(m.T("Formuen din i Vorsbørsen følger med fra kveld til kveld, og du får ", "Your Exchange fortune follows you from night to night, and you get ") + (meg["lonn"] as? String ?? "") + m.T(" i lønn hver kveld du er med. Alle starter likt igjen 1. januar.", " in wages every night you join. Everyone starts over on 1 January.")).font(.archivo(12, vekt: 600)).opacity(0.65).fixedSize(horizontal: false, vertical: true)
            }
        }
        let f = m.liste("formue")
        if !f.isEmpty {
            overskrift("💰 " + m.T("Formuen i gjengen ", "The crew’s fortune ") + m.s("formueSesong"))
            VStack(spacing: 0) {
                ForEach(Array(f.enumerated()), id: \.offset) { i, x in
                    HStack {
                        Text(x["navn"] as? String ?? "").font(.archivo(15, vekt: x["meg"] as? Bool == true ? 900 : 700)).lineLimit(1)
                        Spacer(minLength: 8)
                        Text(x["saldo"] as? String ?? "").font(.archivo(15, vekt: 800)).foregroundColor(i == 0 ? rust : blekk)
                    }
                    .padding(.horizontal, 14).frame(minHeight: 42)
                    if i < f.count - 1 { Rectangle().fill(blekk.opacity(0.12)).frame(height: 1).padding(.leading, 14) }
                }
            }
            .background(RoundedRectangle(cornerRadius: 16).fill(kort)).overlay(RoundedRectangle(cornerRadius: 16).stroke(blekk.opacity(0.2), lineWidth: 1.5))
            if !m.s("aarskonger").isEmpty { Text(m.s("aarskonger")).font(.archivo(12, vekt: 600)).opacity(0.65).fixedSize(horizontal: false, vertical: true) }
        }
    }

    // MARK: Gjengens lov
    @ViewBuilder private var lovbok: some View {
        if let L = m.obj("lovbok") {
            VStack(alignment: .leading, spacing: 10) {
                Text("⚖️ " + m.T("Gjengens lov", "The Crew’s Law")).font(.archivo(22, vekt: 900))
                Text(m.T("Kveldens vinner innfører en regel – eller opphever en. Regelen gjelder til en senere vinner opphever den, eller et flertall i gjengen stemmer den bort.", "The winner of each night introduces a rule – or repeals one. A rule applies until a later winner repeals it, or a majority of the crew votes it out.") + " · " + (L["kvelder"] as? String ?? "")).font(.archivo(12, vekt: 600)).opacity(0.7).fixedSize(horizontal: false, vertical: true)
                if let v = L["valg"] as? [String: Any] { lovValg(v) }
                let aktive = L["aktive"] as? [[String: Any]] ?? []
                Text(m.T("Reglene som gjelder", "Rules in force") + " (\(aktive.count))").font(.archivo(16, vekt: 900)).padding(.top, 6)
                if aktive.isEmpty {
                    Text(m.T("Ingen regler ennå. Start en kveld – vinneren skriver den første.", "No rules yet. Start a night – the winner writes the first one.")).font(.archivo(13, vekt: 600)).opacity(0.7).fixedSize(horizontal: false, vertical: true)
                }
                ForEach(Array(aktive.enumerated()), id: \.offset) { _, x in
                    VStack(alignment: .leading, spacing: 3) {
                        Text(x["tekst"] as? String ?? "").font(.archivo(16, vekt: 800)).fixedSize(horizontal: false, vertical: true)
                        Text(x["under"] as? String ?? "").font(.archivo(12, vekt: 600)).opacity(0.65)
                        let stem = x["stem"] as? String ?? ""
                        if !stem.isEmpty {
                            Button(action: { m.trykk("lov-stem", ["regel": x["id"] as? String ?? ""]) }) { Text(stem).font(.archivo(13, vekt: 700)).underline().opacity(x["harStemt"] as? Bool == true ? 1 : 0.75) }.buttonStyle(.plain).padding(.top, 2)
                        }
                    }
                    .padding(.vertical, 6)
                }
                let rek = L["rekorder"] as? [[String: Any]] ?? []
                if !rek.isEmpty {
                    Text(m.T("Rekorder", "Records")).font(.archivo(16, vekt: 900)).padding(.top, 6)
                    ForEach(Array(rek.enumerated()), id: \.offset) { _, r in
                        VStack(alignment: .leading, spacing: 1) {
                            Text((r["ikon"] as? String ?? "") + " " + (r["tittel"] as? String ?? "")).font(.archivo(12, vekt: 700)).opacity(0.65)
                            Text(r["tekst"] as? String ?? "").font(.archivo(15, vekt: 800))
                            let u = r["under"] as? String ?? ""
                            if !u.isEmpty { Text(u).font(.archivo(12, vekt: 600)).opacity(0.65) }
                        }
                    }
                }
                let fjernet = L["fjernet"] as? [[String: Any]] ?? []
                if !fjernet.isEmpty {
                    DisclosureGroup(m.T("Opphevede regler", "Repealed rules") + " (\(fjernet.count))") {
                        VStack(alignment: .leading, spacing: 8) {
                            ForEach(Array(fjernet.enumerated()), id: \.offset) { _, x in
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(x["tekst"] as? String ?? "").font(.archivo(14, vekt: 700)).strikethrough().opacity(0.6).fixedSize(horizontal: false, vertical: true)
                                    Text(x["under"] as? String ?? "").font(.archivo(12, vekt: 600)).opacity(0.65).fixedSize(horizontal: false, vertical: true)
                                }
                            }
                        }.padding(.top, 6)
                    }.font(.archivo(14, vekt: 800)).tint(blekk)
                }
                let logg = L["logg"] as? [[String: Any]] ?? []
                if !logg.isEmpty {
                    DisclosureGroup(m.T("Historikken", "History")) {
                        VStack(alignment: .leading, spacing: 6) {
                            ForEach(Array(logg.enumerated()), id: \.offset) { _, x in
                                Text((x["dato"] as? String ?? "") + "  " + (x["tekst"] as? String ?? "")).font(.archivo(13, vekt: 600)).fixedSize(horizontal: false, vertical: true)
                            }
                        }.padding(.top, 6)
                    }.font(.archivo(14, vekt: 800)).tint(blekk)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading).padding(16)
            .background(RoundedRectangle(cornerRadius: 22).fill(kort)).overlay(RoundedRectangle(cornerRadius: 22).stroke(blekk.opacity(0.2), lineWidth: 1.5))
        }
    }
    @ViewBuilder private func lovValg(_ v: [String: Any]) -> some View {
        if v["minTur"] as? Bool == true {
            VStack(alignment: .leading, spacing: 8) {
                Text(m.T("🏆 Du vant forrige kveld! Velg regelen din", "🏆 You won the last night! Pick your rule")).font(.archivo(16, vekt: 900)).fixedSize(horizontal: false, vertical: true)
                Button(action: {
                    m.dialog?(m.T("Den nye regelen", "The new rule"), m.T("Den nye regelen …", "The new rule …"), "", m.T("Innfør", "Introduce"), m.T("Avbryt", "Cancel")) { t in m.skriv("lbValg", "lbTekst", t) }
                }) { storKnapp(m.T("Skriv regelen", "Write the rule")) }.buttonStyle(TrykkStilSlutt())
                let aktive = v["aktive"] as? [[String: Any]] ?? []
                if !aktive.isEmpty {
                    Text(m.T("… eller opphev en:", "… or repeal one:")).font(.archivo(13, vekt: 700)).opacity(0.7)
                    ForEach(Array(aktive.enumerated()), id: \.offset) { _, x in
                        Button(action: { m.trykk("lov-opphev", ["regel": x["id"] as? String ?? ""]) }) {
                            Text("🗑️ " + (x["tekst"] as? String ?? "")).font(.archivo(14, vekt: 700)).multilineTextAlignment(.leading).fixedSize(horizontal: false, vertical: true)
                                .frame(maxWidth: .infinity, alignment: .leading).padding(.horizontal, 12).padding(.vertical, 9)
                                .background(RoundedRectangle(cornerRadius: 12).fill(papir)).overlay(RoundedRectangle(cornerRadius: 12).stroke(blekk.opacity(0.25), lineWidth: 1.5))
                        }.buttonStyle(.plain)
                    }
                }
            }
            .padding(12).background(RoundedRectangle(cornerRadius: 14).fill(gul.opacity(modus == .dark ? 0.18 : 0.28)))
        } else {
            Text(v["venter"] as? String ?? "").font(.archivo(14, vekt: 700)).fixedSize(horizontal: false, vertical: true)
                .padding(12).frame(maxWidth: .infinity, alignment: .leading).background(RoundedRectangle(cornerRadius: 14).fill(gul.opacity(modus == .dark ? 0.18 : 0.28)))
        }
    }

    // MARK: Sesongen: velger, tallene og kåringene
    @ViewBuilder private var sesonger: some View {
        let ss = m.d["sesonger"] as? [String] ?? []
        if ss.count > 1 {
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 6) {
                    ForEach(ss, id: \.self) { a in
                        Button(action: { m.sesong(a) }) { valg(a == "alle" ? m.T("Alle", "All") : a, paa: m.s("sesong") == a) }.buttonStyle(.plain)
                    }
                }
            }
        }
        if !m.s("tom").isEmpty {
            Text(m.T("Ingen kvelder i ", "No nights in ") + m.s("tom") + m.T(" ennå. Start et rom, velg gjengen i lobbyen og trykk «Avslutt kvelden» når dere er ferdige.", " yet. Start a room, pick the crew in the lobby and tap “End the night” when you’re done.")).font(.archivo(14, vekt: 600)).opacity(0.75).fixedSize(horizontal: false, vertical: true)
        }
        let st = m.liste("stat")
        if !st.isEmpty {
            LazyVGrid(columns: [GridItem(.flexible(), spacing: 10), GridItem(.flexible(), spacing: 10)], spacing: 10) {
                ForEach(Array(st.enumerated()), id: \.offset) { _, x in
                    VStack(alignment: .leading, spacing: 2) {
                        Text(x["tall"] as? String ?? "").font(.archivo(26, vekt: 900)).foregroundColor(rust).lineLimit(1).minimumScaleFactor(0.5)
                        Text(x["tekst"] as? String ?? "").font(.archivo(13, vekt: 600)).opacity(0.7).lineLimit(2)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading).padding(.horizontal, 14).padding(.vertical, 12)
                    .background(RoundedRectangle(cornerRadius: 16).fill(kort)).overlay(RoundedRectangle(cornerRadius: 16).stroke(blekk.opacity(0.2), lineWidth: 1.5))
                }
            }
        }
        let k = m.liste("kaaringer")
        if !k.isEmpty {
            overskrift(m.T("Kåringer", "Awards"))
            ForEach(Array(k.enumerated()), id: \.offset) { _, x in
                HStack(spacing: 12) {
                    Text(x["ikon"] as? String ?? "").font(.system(size: 26))
                    VStack(alignment: .leading, spacing: 1) {
                        Text(x["tittel"] as? String ?? "").font(.archivo(12, vekt: 700)).opacity(0.65)
                        Text((x["navn"] as? String ?? "") + " · " + (x["tall"] as? String ?? "")).font(.archivo(15, vekt: 900)).lineLimit(2).minimumScaleFactor(0.8)
                    }
                    Spacer(minLength: 0)
                }
                .padding(.horizontal, 12).padding(.vertical, 8)
                .background(RoundedRectangle(cornerRadius: 14).fill(mint.opacity(modus == .dark ? 0.16 : 0.18)))
            }
        }
    }

    // MARK: Sesongtabellen
    private let kolonner: [(String, CGFloat)] = [("kvelder", 46), ("slurker", 52), ("snitt", 46), ("seire", 34), ("quiz", 40)]
    private func kolonneNavn(_ k: String) -> String {
        switch k {
        case "kvelder": return m.T("Kvelder", "Nights")
        case "slurker": return m.T("Slurker", "Sips")
        case "snitt": return m.T("Snitt", "Avg")
        case "seire": return "🏆"
        default: return "Quiz"
        }
    }
    @ViewBuilder private var tabellen: some View {
        let t = m.liste("tabell")
        if !t.isEmpty {
            overskrift(m.T("Sesongtabellen", "Season table"))
            VStack(spacing: 0) {
                HStack(spacing: 4) {
                    Text("#").font(.archivo(12, vekt: 700)).opacity(0.5).frame(width: 22, alignment: .leading)
                    Text(m.T("Navn", "Name")).font(.archivo(12, vekt: 700)).opacity(0.6).frame(maxWidth: .infinity, alignment: .leading)
                    ForEach(Array(kolonner.enumerated()), id: \.offset) { _, k in
                        Button(action: { m.sorter(k.0) }) {
                            Text(kolonneNavn(k.0)).font(.archivo(12, vekt: 800)).lineLimit(1).minimumScaleFactor(0.7)
                                .foregroundColor(m.s("sorter") == k.0 ? rust : blekk.opacity(0.6)).underline(m.s("sorter") == k.0)
                                .frame(width: k.1, alignment: .trailing)
                        }.buttonStyle(.plain)
                    }
                }
                .padding(.horizontal, 12).frame(height: 36)
                ForEach(Array(t.enumerated()), id: \.offset) { i, p in
                    Rectangle().fill(blekk.opacity(0.12)).frame(height: 1)
                    HStack(spacing: 4) {
                        Text("\(i + 1)").font(.archivo(13, vekt: 700)).opacity(0.5).frame(width: 22, alignment: .leading)
                        HStack(spacing: 3) {
                            Text(p["navn"] as? String ?? "").font(.archivo(14, vekt: 800)).lineLimit(1).minimumScaleFactor(0.7)
                            let f = p["form"] as? String ?? ""
                            if f == "opp" { Text("▲").font(.system(size: 9)).foregroundColor(mint) } else if f == "ned" { Text("▼").font(.system(size: 9)).foregroundColor(rust) }
                        }.frame(maxWidth: .infinity, alignment: .leading)
                        Text("\(p["kvelder"] as? Int ?? 0)").font(.archivo(13, vekt: 600)).frame(width: 46, alignment: .trailing)
                        Text("\(p["slurker"] as? Int ?? 0)").font(.archivo(14, vekt: 900)).foregroundColor(i == 0 ? rust : blekk).frame(width: 52, alignment: .trailing)
                        Text(p["snitt"] as? String ?? "").font(.archivo(13, vekt: 600)).frame(width: 46, alignment: .trailing)
                        Text("\(p["seire"] as? Int ?? 0)").font(.archivo(13, vekt: 600)).frame(width: 34, alignment: .trailing)
                        Text("\(p["quiz"] as? Int ?? 0)").font(.archivo(13, vekt: 600)).frame(width: 40, alignment: .trailing)
                    }
                    .padding(.horizontal, 12).frame(minHeight: 38)
                }
            }
            .background(RoundedRectangle(cornerRadius: 16).fill(kort)).overlay(RoundedRectangle(cornerRadius: 16).stroke(blekk.opacity(0.2), lineWidth: 1.5))
            Text(m.T("🏆 = antall kvelder som kveldens tørstigste. Navn slås sammen uansett store og små bokstaver – bruk samme navn hver gang.", "🏆 = number of nights as the thirstiest of the night. Names are merged regardless of upper and lower case – use the same name every time.")).font(.archivo(12, vekt: 600)).opacity(0.65).fixedSize(horizontal: false, vertical: true)
        }
    }

    // MARK: Kveldene
    @ViewBuilder private var kveldene: some View {
        let kv = m.liste("kvelder")
        if !kv.isEmpty {
            overskrift(m.T("Kveldene", "The nights"))
            ForEach(Array(kv.enumerated()), id: \.offset) { _, k in
                VStack(alignment: .leading, spacing: 3) {
                    HStack(alignment: .firstTextBaseline) {
                        Text(k["dato"] as? String ?? "").font(.archivo(15, vekt: 900))
                        Spacer(minLength: 6)
                        Text(k["under"] as? String ?? "").font(.archivo(12, vekt: 600)).opacity(0.65).lineLimit(1).minimumScaleFactor(0.8)
                    }
                    Text(k["linje"] as? String ?? "").font(.archivo(13, vekt: 600)).fixedSize(horizontal: false, vertical: true)
                    if m.b("eier") {
                        Button(action: { m.trykk("slett-kveld", ["id": String(describing: k["id"] ?? "")]) }) { Text(m.T("Fjern fra tabellen", "Remove from the table")).font(.archivo(12, vekt: 700)).underline().opacity(0.6) }.buttonStyle(.plain).padding(.top, 2)
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading).padding(.horizontal, 14).padding(.vertical, 10)
                .background(RoundedRectangle(cornerRadius: 14).fill(kort)).overlay(RoundedRectangle(cornerRadius: 14).stroke(blekk.opacity(0.2), lineWidth: 1.5))
            }
        }
    }

    // MARK: Eieren og gjengkoden
    private var eier: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 14) {
                if m.b("eier") {
                    // Nettsiden spør om det nye navnet selv (prompt → iPhonens dialog via Capacitor)
                    Button(action: { m.trykk("endre") }) { Text(m.T("Endre navn", "Rename")).font(.archivo(13, vekt: 700)).underline() }.buttonStyle(.plain)
                    Button(action: { m.trykk("slett") }) { Text(m.T("Slett gjengen", "Delete the crew")).font(.archivo(13, vekt: 700)).underline().foregroundColor(rust) }.buttonStyle(.plain)
                } else if m.b("medlem") {
                    Button(action: { m.trykk("forlat") }) { Text(m.T("Forlat gjengen", "Leave the crew")).font(.archivo(13, vekt: 700)).underline().foregroundColor(rust) }.buttonStyle(.plain)
                }
            }
            Text(m.T("Gjengkode: ", "Crew code: ") + m.s("kode")).font(.archivo(13, vekt: 700)).opacity(0.65)
        }
        .padding(.top, 10)
    }

    // MARK: Byggeklosser
    private func tilbake(_ t: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: 4) { Image(systemName: "chevron.left").font(.system(size: 15, weight: .bold)); Text(t).font(.archivo(15, vekt: 800)) }
                .opacity(0.75).padding(.vertical, 6).contentShape(Rectangle())
        }.buttonStyle(.plain)
    }
    private func etikett(_ t: String) -> some View { Text(t.uppercased()).font(.archivo(12, vekt: 900)).opacity(0.6) }
    private func overskrift(_ t: String) -> some View { Text(t).font(.archivo(20, vekt: 900)).padding(.top, 6) }
    private func boks<V: View>(@ViewBuilder _ inn: () -> V) -> some View {
        VStack(alignment: .leading, spacing: 8) { inn() }
            .frame(maxWidth: .infinity, alignment: .leading).padding(16)
            .background(RoundedRectangle(cornerRadius: 18).fill(kort))
            .overlay(RoundedRectangle(cornerRadius: 18).stroke(blekk, lineWidth: 2.5))
            .background(RoundedRectangle(cornerRadius: 18).fill(blekk).offset(x: 4, y: 4))
    }
    private func valg(_ t: String, paa: Bool) -> some View {
        Text(t).font(.archivo(13, vekt: 800)).lineLimit(1)
            .padding(.horizontal, 12).frame(height: 34).foregroundColor(paa ? morkBlekk : blekk)
            .background(RoundedRectangle(cornerRadius: 10).fill(paa ? gul : kort)).overlay(RoundedRectangle(cornerRadius: 10).stroke(paa ? morkBlekk : blekk.opacity(0.25), lineWidth: paa ? 2 : 1.5))
    }
    private func knapp(_ t: String, gul erGul: Bool) -> some View {
        Text(t.uppercased()).font(.archivo(13, vekt: 900)).lineLimit(1).minimumScaleFactor(0.7)
            .padding(.horizontal, 12).frame(height: 40).foregroundColor(erGul ? morkBlekk : blekk)
            .background(ZStack {
                RoundedRectangle(cornerRadius: 10).fill(blekk).offset(x: 2, y: 2)
                RoundedRectangle(cornerRadius: 10).fill(erGul ? gul : kort)
                RoundedRectangle(cornerRadius: 10).stroke(blekk, lineWidth: 2)
            })
    }
    private func storKnapp(_ t: String) -> some View {
        Text(t.uppercased()).font(.archivo(16, vekt: 900)).lineLimit(2).minimumScaleFactor(0.7).multilineTextAlignment(.center)
            .padding(.horizontal, 16).frame(maxWidth: .infinity).frame(minHeight: 52).foregroundColor(morkBlekk)
            .background(ZStack {
                RoundedRectangle(cornerRadius: 14).fill(blekk).offset(x: 3, y: 3)
                RoundedRectangle(cornerRadius: 14).fill(gul)
                RoundedRectangle(cornerRadius: 14).stroke(blekk, lineWidth: 2.5)
            })
    }
}
