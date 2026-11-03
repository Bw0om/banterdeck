import SwiftUI
import UIKit
import WebKit

/// Lekesiden native: bildet, navnet, fakta, «Spill i rommet» / «Bare én telefon», reglene og flere leker i samme gruppe.
/// Innholdet kommer fra nettsiden (Game.astro, mv-skjerm «lekeside», bildene som PNG); trykkene går tilbake via window.__mvLekeside.
/// Kortbunken («Bare én telefon») er fortsatt nettsiden: da trekker denne skjermen seg til side til siden sier «lekeside» igjen.
struct LekesideRegel: Identifiable {
    let id: Int
    let type: String       // «p» eller «ul»
    let items: [String]
}

struct LekesideLek: Identifiable {
    let id: String         // adressen
    let navn: String, pl: String, hook: String
    var bilde: UIImage?
    init?(_ d: [String: Any]) {
        guard let href = d["href"] as? String, let navn = d["navn"] as? String else { return nil }
        id = href; self.navn = navn
        pl = d["pl"] as? String ?? ""; hook = d["hook"] as? String ?? ""
        bilde = FigurData.bilde(d["png"] as? String)
    }
}

final class LekesideModell: ObservableObject {
    @Published var slug = ""
    @Published var navn = ""
    @Published var fra = ""
    @Published var niva = "rom"
    @Published var nivaTekst = ""
    @Published var pl = ""
    @Published var utstyr = ""
    @Published var gruppe = ""
    @Published var alkfri = false
    @Published var iRom = false
    @Published var harVerktoy = false
    @Published var pluss = false
    @Published var lenke: (href: String, label: String)? = nil
    @Published var regler: [LekesideRegel] = []
    @Published var forslag: [LekesideLek] = []
    @Published var flere: [LekesideLek] = []
    @Published var bilde: UIImage? = nil
    @Published var tekst: [String: String] = [:]
    @Published var engelsk = false
    weak var nett: WKWebView?
    private var sistPng = ""

    func t(_ k: String) -> String { tekst[k] ?? k }

    func sett(_ d: [String: Any]) {
        let nySlug = d["slug"] as? String ?? ""
        if nySlug != slug { sistPng = ""; bilde = nil }   // en annen lek: det gamle bildet skal ikke stå igjen
        slug = nySlug
        navn = d["navn"] as? String ?? navn
        fra = d["fra"] as? String ?? ""
        niva = d["niva"] as? String ?? "rom"
        nivaTekst = d["nivaTekst"] as? String ?? ""
        pl = d["pl"] as? String ?? ""; utstyr = d["utstyr"] as? String ?? ""; gruppe = d["gruppe"] as? String ?? ""
        alkfri = d["alkfri"] as? Bool ?? false
        iRom = d["iRom"] as? Bool ?? false
        harVerktoy = d["harVerktoy"] as? Bool ?? false
        pluss = d["pluss"] as? Bool ?? false
        if let l = d["link"] as? [String: Any], let h = l["href"] as? String, !h.isEmpty { lenke = (h, l["label"] as? String ?? h) } else { lenke = nil }
        tekst = d["tekst"] as? [String: String] ?? tekst
        regler = (d["regler"] as? [[String: Any]] ?? []).enumerated().map { i, b in LekesideRegel(id: i, type: b["type"] as? String ?? "p", items: b["items"] as? [String] ?? []) }
        // Bildene kommer gjerne i en melding etter innholdet: behold de vi har til de nye er på plass
        forslag = slaaSammen((d["forslag"] as? [[String: Any]] ?? []).compactMap(LekesideLek.init), forslag)
        flere = slaaSammen((d["flere"] as? [[String: Any]] ?? []).compactMap(LekesideLek.init), flere)
        if let p = d["png"] as? String, !p.isEmpty, p != sistPng { sistPng = p; bilde = FigurData.bilde(p) }
    }
    private func slaaSammen(_ nye: [LekesideLek], _ gamle: [LekesideLek]) -> [LekesideLek] {
        let g = Dictionary(gamle.map { ($0.id, $0.bilde) }, uniquingKeysWith: { a, _ in a })
        return nye.map { l in var x = l; if x.bilde == nil { x.bilde = g[l.id] ?? nil }; return x }
    }

    // Nettsiden gjør jobben (window.__mvLekeside i Game.astro)
    private func js(_ kall: String, _ arg: Any? = nil) {
        var json = ""
        if let a = arg, let data = try? JSONSerialization.data(withJSONObject: [a]), let s = String(data: data, encoding: .utf8) { json = s + "[0]" }
        nett?.evaluateJavaScript("window.__mvLekeside && window.__mvLekeside.\(kall)(\(json))", completionHandler: nil)
    }
    func tilbake() { UISelectionFeedbackGenerator().selectionChanged(); js("tilbake") }
    func rom() { UIImpactFeedbackGenerator(style: .medium).impactOccurred(); js("rom") }
    func verktoy() { UIImpactFeedbackGenerator(style: .light).impactOccurred(); js("verktoy") }
    func settAlkfri(_ v: Bool) { UISelectionFeedbackGenerator().selectionChanged(); js("alkfri", v) }
    func kopier() { UINotificationFeedbackGenerator().notificationOccurred(.success); js("kopier") }
    func aapneLenke() { UISelectionFeedbackGenerator().selectionChanged(); js("lenke") }
    func gaa(_ l: LekesideLek) { UISelectionFeedbackGenerator().selectionChanged(); js("gaa", l.id) }
    func lagRom() { UIImpactFeedbackGenerator(style: .medium).impactOccurred(); js("gaa", engelsk ? "/room" : "/no/rom") }
}

struct LekesideSkjerm: View {
    @ObservedObject var m: LekesideModell
    @Environment(\.colorScheme) private var modus
    /// Sveip fra venstre kant = tilbake, som i resten av iOS (nettsidens eget sveip når ikke gjennom den native skjermen)
    @State private var kantDrag: CGFloat = 0

    private var papir: Color { modus == .dark ? Color(red: 0.11, green: 0.106, blue: 0.122) : Color(red: 1, green: 0.973, blue: 0.933) }
    private var kort: Color { modus == .dark ? Color(red: 0.173, green: 0.169, blue: 0.188) : .white }
    private var blekk: Color { modus == .dark ? Color(red: 1, green: 0.973, blue: 0.933) : Color(red: 0.086, green: 0.071, blue: 0.059) }
    private let gul = Color(red: 1, green: 0.824, blue: 0.247)
    private let mint = Color(red: 0.388, green: 0.886, blue: 0.659)
    private let rosa = Color(red: 1, green: 0.612, blue: 0.761)
    private let oransje = Color(red: 1, green: 0.357, blue: 0.122)
    private let rust = Color(red: 0.776, green: 0.235, blue: 0.067)
    private let morkBlekk = Color(red: 0.086, green: 0.071, blue: 0.059)

    /// Fargen på feltet bak bildet følger nivået: rom = mint, telefonen hjelper = rosa, bare regler = gul
    private var felt: Color { m.niva == "rom" ? mint : m.niva == "app" ? rosa : gul }
    private var nivaIkon: String { m.niva == "rom" ? "iphone" : m.niva == "app" ? "rectangle.stack" : "book" }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                // Tilbake til lista
                Button(action: m.tilbake) {
                    HStack(spacing: 4) {
                        Image(systemName: "chevron.left").font(.system(size: 17, weight: .bold))
                        Text(m.t("tilbake")).font(.archivo(16, vekt: 800))
                    }
                    .frame(minHeight: 44).padding(.trailing, 12).contentShape(Rectangle())
                }
                .buttonStyle(.plain).accessibilityLabel(m.t("tilbake"))
                .padding(.horizontal, 16).padding(.top, 4)

                // Bildet stort på et farget felt, med strek og hard skygge
                ZStack {
                    felt
                    if let b = m.bilde { Image(uiImage: b).resizable().scaledToFit().padding(14) }
                }
                .frame(height: 170).frame(maxWidth: .infinity)
                .clipShape(RoundedRectangle(cornerRadius: 16))
                .overlay(RoundedRectangle(cornerRadius: 16).stroke(blekk, lineWidth: 3))
                .background(RoundedRectangle(cornerRadius: 16).fill(blekk).offset(x: 5, y: 5))
                .padding(.horizontal, 16).padding(.top, 8).padding(.trailing, 5)
                .animation(.spring(response: 0.35, dampingFraction: 0.9), value: m.bilde == nil)

                Text(m.navn.uppercased()).font(.archivo(34, vekt: 900)).fixedSize(horizontal: false, vertical: true)
                    .padding(.horizontal, 16).padding(.top, 20)
                if !m.fra.isEmpty {
                    (Text(m.t("sendtInn") + " ").font(.archivo(14, vekt: 600)) + Text(m.fra).font(.archivo(14, vekt: 800)))
                        .opacity(0.75).padding(.horizontal, 16).padding(.top, 4)
                }

                // Fakta: nivå og spillere som merker, utstyr og gruppe som en stille linje under
                HStack(spacing: 8) {
                    fakta(nivaIkon, m.nivaTekst, farget: true)
                    fakta("person.2", m.pl)
                    Spacer(minLength: 0)
                }
                .padding(.horizontal, 16).padding(.top, 12)
                let detaljer = [m.utstyr, m.gruppe].filter { !$0.isEmpty }.joined(separator: " · ")
                if !detaljer.isEmpty {
                    Text(detaljer).font(.archivo(14, vekt: 600)).opacity(0.7).lineLimit(2).padding(.horizontal, 16).padding(.top, 8)
                }

                // Alkoholfri: slurker blir straffepoeng – gjelder deg, på denne telefonen
                Toggle(isOn: Binding(get: { m.alkfri }, set: { m.alkfri = $0; m.settAlkfri($0) })) {
                    Text(m.t("alkfri")).font(.archivo(16, vekt: 700))
                }
                .tint(rust)
                .padding(.horizontal, 16).frame(minHeight: 52)
                .background(RoundedRectangle(cornerRadius: 14).fill(kort))
                .overlay(RoundedRectangle(cornerRadius: 14).stroke(blekk.opacity(0.2), lineWidth: 1.5))
                .padding(.horizontal, 16).padding(.top, 16)

                // Knappene: rommet først (gul), kortbunken stille under
                if m.iRom || m.harVerktoy {
                    VStack(spacing: 10) {
                        if m.iRom { Button(action: m.rom) { storKnapp(m.t("rom"), gul: true) }.buttonStyle(TrykkStilLs()) }
                        if m.harVerktoy {
                            Button(action: m.verktoy) {
                                HStack(spacing: 8) {
                                    Text((m.iRom ? m.t("enTelefon") : m.t("start")).uppercased()).font(.archivo(m.iRom ? 15 : 18, vekt: 900))
                                    if m.pluss { plussMerke }
                                    Image(systemName: "arrow.down").font(.system(size: 13, weight: .bold)).opacity(0.6)
                                }
                                .frame(maxWidth: .infinity).frame(height: m.iRom ? 48 : 60).foregroundColor(m.iRom ? blekk : morkBlekk)
                                .background(RoundedRectangle(cornerRadius: 14).fill(m.iRom ? kort : gul))
                                .overlay(RoundedRectangle(cornerRadius: 14).stroke(m.iRom ? blekk.opacity(0.3) : morkBlekk, lineWidth: m.iRom ? 1.5 : 3))
                                .background(RoundedRectangle(cornerRadius: 14).fill(morkBlekk).offset(x: m.iRom ? 0 : 4, y: m.iRom ? 0 : 4))
                            }
                            .buttonStyle(m.iRom ? TrykkStilLs(flytt: 1) : TrykkStilLs())
                        }
                    }
                    .padding(.horizontal, 16).padding(.top, 14).padding(.trailing, 4)
                }

                // Reglene
                Text(m.t("slik")).font(.archivo(22, vekt: 900)).padding(.horizontal, 16).padding(.top, 28)
                VStack(alignment: .leading, spacing: 12) {
                    ForEach(m.regler) { b in
                        if b.type == "ul" {
                            VStack(alignment: .leading, spacing: 8) {
                                ForEach(Array(b.items.enumerated()), id: \.offset) { _, x in
                                    HStack(alignment: .top, spacing: 10) {
                                        RoundedRectangle(cornerRadius: 2).fill(gul).frame(width: 10, height: 10).overlay(RoundedRectangle(cornerRadius: 2).stroke(morkBlekk, lineWidth: 1.5)).padding(.top, 7)
                                        Text(x).font(.archivo(17, vekt: 550)).lineSpacing(3).fixedSize(horizontal: false, vertical: true)
                                    }
                                }
                            }
                            .padding(.leading, 4)
                        } else if let p = b.items.first {
                            Text(p).font(.archivo(17, vekt: 550)).lineSpacing(3).fixedSize(horizontal: false, vertical: true)
                        }
                    }
                }
                .padding(16).frame(maxWidth: .infinity, alignment: .leading)
                .background(RoundedRectangle(cornerRadius: 16).fill(kort))
                .overlay(RoundedRectangle(cornerRadius: 16).stroke(blekk, lineWidth: 3))
                .background(RoundedRectangle(cornerRadius: 16).fill(blekk).offset(x: 5, y: 5))
                .padding(.horizontal, 16).padding(.top, 12).padding(.trailing, 5)

                HStack(spacing: 10) {
                    if let l = m.lenke {
                        Button(action: m.aapneLenke) {
                            HStack(spacing: 6) { Text(l.label).font(.archivo(14, vekt: 900)).lineLimit(1); Image(systemName: "arrow.up.right").font(.system(size: 12, weight: .bold)) }
                                .padding(.horizontal, 14).frame(height: 44).foregroundColor(morkBlekk)
                                .background(RoundedRectangle(cornerRadius: 10).fill(gul)).overlay(RoundedRectangle(cornerRadius: 10).stroke(morkBlekk, lineWidth: 2.5))
                                .background(RoundedRectangle(cornerRadius: 10).fill(morkBlekk).offset(x: 3, y: 3))
                        }
                        .buttonStyle(TrykkStilLs(flytt: 2))
                    }
                    Button(action: m.kopier) {
                        HStack(spacing: 6) { Image(systemName: "doc.on.doc").font(.system(size: 13, weight: .bold)); Text(m.t("kopier")).font(.archivo(14, vekt: 800)) }
                            .padding(.horizontal, 14).frame(height: 44).foregroundColor(blekk)
                            .background(RoundedRectangle(cornerRadius: 10).fill(kort)).overlay(RoundedRectangle(cornerRadius: 10).stroke(blekk.opacity(0.3), lineWidth: 1.5))
                    }
                    .buttonStyle(TrykkStilLs(flytt: 1))
                    Spacer(minLength: 0)
                }
                .padding(.horizontal, 16).padding(.top, 18)

                // Ren regellek: forslag om en lek dere spiller i appen
                if !m.forslag.isEmpty {
                    VStack(alignment: .leading, spacing: 12) {
                        Text(m.t("likerDere")).font(.archivo(13, vekt: 900)).opacity(0.6)
                        Text(m.t("provEn")).font(.archivo(22, vekt: 900)).fixedSize(horizontal: false, vertical: true)
                        VStack(spacing: 10) {
                            ForEach(m.forslag) { l in
                                Button(action: { m.gaa(l) }) {
                                    HStack(spacing: 12) {
                                        ZStack { mint.opacity(0.4); if let b = l.bilde { Image(uiImage: b).resizable().scaledToFill() } }
                                            .frame(width: 84, height: 50).clipShape(RoundedRectangle(cornerRadius: 8))
                                        VStack(alignment: .leading, spacing: 3) {
                                            Text(l.navn).font(.archivo(16, vekt: 800)).lineLimit(1)
                                            if !l.hook.isEmpty { Text(l.hook).font(.archivo(13, vekt: 600)).opacity(0.7).lineLimit(2).multilineTextAlignment(.leading) }
                                        }
                                        Spacer(minLength: 6)
                                        Image(systemName: "chevron.right").font(.system(size: 13, weight: .bold)).opacity(0.4)
                                    }
                                    .padding(10).foregroundColor(blekk)
                                    .background(RoundedRectangle(cornerRadius: 14).fill(kort))
                                    .overlay(RoundedRectangle(cornerRadius: 14).stroke(blekk, lineWidth: 2.5))
                                    .background(RoundedRectangle(cornerRadius: 14).fill(blekk).offset(x: 3, y: 3))
                                }
                                .buttonStyle(TrykkStilLs())
                            }
                        }
                        .padding(.trailing, 3)
                        Button(action: m.lagRom) { storKnapp(m.t("lagRom"), gul: true) }.buttonStyle(TrykkStilLs()).padding(.trailing, 4).padding(.top, 4)
                    }
                    .padding(16)
                    .background(RoundedRectangle(cornerRadius: 18).fill(oransje.opacity(modus == .dark ? 0.22 : 0.16)))
                    .padding(.horizontal, 16).padding(.top, 28)
                }

                // Flere leker i samme gruppe
                if !m.flere.isEmpty {
                    Text(m.t("flere")).font(.archivo(20, vekt: 900)).lineLimit(2).padding(.horizontal, 16).padding(.top, 32)
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 12) {
                            ForEach(m.flere) { l in
                                Button(action: { m.gaa(l) }) {
                                    VStack(alignment: .leading, spacing: 0) {
                                        ZStack { felt.opacity(0.4); if let b = l.bilde { Image(uiImage: b).resizable().scaledToFill() } }
                                            .frame(width: 156, height: 82).clipped()
                                        VStack(alignment: .leading, spacing: 3) {
                                            Text(l.navn.uppercased()).font(.archivo(14, vekt: 900)).lineLimit(2).minimumScaleFactor(0.8).multilineTextAlignment(.leading)
                                            Text(l.pl).font(.archivo(12, vekt: 700)).opacity(0.65)
                                        }
                                        .padding(10).frame(width: 156, alignment: .leading)
                                    }
                                    .foregroundColor(blekk)
                                    .background(RoundedRectangle(cornerRadius: 14).fill(kort))
                                    .clipShape(RoundedRectangle(cornerRadius: 14))
                                    .overlay(RoundedRectangle(cornerRadius: 14).stroke(blekk, lineWidth: 2.5))
                                    .background(RoundedRectangle(cornerRadius: 14).fill(blekk).offset(x: 4, y: 4))
                                }
                                .buttonStyle(TrykkStilLs())
                            }
                        }
                        .padding(.horizontal, 16).padding(.vertical, 12).padding(.trailing, 4)
                    }
                }
            }
            .padding(.bottom, 110)   // plass til fanelinja
        }
        .background(papir.ignoresSafeArea())
        .foregroundColor(blekk)
        .offset(x: kantDrag)
        .simultaneousGesture(
            DragGesture(minimumDistance: 12, coordinateSpace: .global)
                .onChanged { g in if g.startLocation.x < 28 && g.translation.width > 0 { kantDrag = g.translation.width * 0.6 } }
                .onEnded { g in
                    let tilbake = g.startLocation.x < 28 && (g.translation.width > 90 || g.predictedEndTranslation.width > 220)
                    withAnimation(.spring(response: 0.3, dampingFraction: 0.9)) { kantDrag = 0 }
                    if tilbake { m.tilbake() }
                }
        )
    }

    private var plussMerke: some View {
        Text("✦ " + m.t("pluss")).font(.archivo(11, vekt: 900))
            .padding(.horizontal, 7).frame(height: 20).foregroundColor(morkBlekk)
            .background(Capsule().fill(gul)).overlay(Capsule().stroke(morkBlekk, lineWidth: 1.5))
    }

    private func fakta(_ ikon: String?, _ tekst: String, farget: Bool = false) -> some View {
        HStack(spacing: 5) {
            if let i = ikon { Image(systemName: i).font(.system(size: 12, weight: .bold)) }
            Text(tekst).font(.archivo(13, vekt: 800)).lineLimit(1)
        }
        .padding(.horizontal, 10).frame(height: 30)
        .foregroundColor(farget ? morkBlekk : blekk)
        .background(Capsule().fill(farget ? felt : Color.clear))
        .overlay(Capsule().stroke(farget ? morkBlekk : blekk.opacity(0.35), lineWidth: 1.5))
    }

    private func storKnapp(_ t: String, gul erGul: Bool) -> some View {
        Text(t.uppercased()).font(.archivo(18, vekt: 900)).lineLimit(1).minimumScaleFactor(0.8)
            .frame(maxWidth: .infinity).frame(height: 60).foregroundColor(erGul ? morkBlekk : blekk)
            .background(RoundedRectangle(cornerRadius: 14).fill(erGul ? gul : kort))
            .overlay(RoundedRectangle(cornerRadius: 14).stroke(morkBlekk, lineWidth: 3))
            .background(RoundedRectangle(cornerRadius: 14).fill(morkBlekk).offset(x: 4, y: 4))
    }
}

/// Knappen trykkes ned i skyggen sin – samme fjær som resten av appen
private struct TrykkStilLs: ButtonStyle {
    var flytt: CGFloat = 3
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .offset(x: configuration.isPressed ? flytt : 0, y: configuration.isPressed ? flytt : 0)
            .animation(.spring(response: 0.18, dampingFraction: 0.9), value: configuration.isPressed)
    }
}
