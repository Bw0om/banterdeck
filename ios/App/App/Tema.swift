import SwiftUI
import UIKit

/// Felles utseende for alle native skjermer: fargene, skrifta, vibreringen og figurbildene.
/// Skjermene skrev før hver sin kopi av dette – nå bor det her, og en endring her gjelder hele appen.

// MARK: - Farger

/// Mittvors-paletten. Papir, blekk og kort skifter selv mellom lys og mørk modus.
enum Tema {
    static let gul = Color(red: 1, green: 0.824, blue: 0.247)
    static let oransje = Color(red: 1, green: 0.357, blue: 0.122)
    static let rust = Color(red: 0.776, green: 0.235, blue: 0.067)
    static let mint = Color(red: 0.388, green: 0.886, blue: 0.659)
    static let rosa = Color(red: 1, green: 0.612, blue: 0.761)
    static let kortRod = Color(red: 0.843, green: 0.149, blue: 0.239)
    /// Mørk blekk og lyst papir: faste farger, samme i begge modi (tekst på gule knapper osv.)
    static let morkBlekk = Color(red: 0.086, green: 0.071, blue: 0.059)
    static let lys = Color(red: 1, green: 0.973, blue: 0.933)
    static let tavle = Color(red: 0.11, green: 0.106, blue: 0.122)
    static let morkKort = Color(red: 0.173, green: 0.169, blue: 0.188)

    /// Bakgrunnen: lyst papir, eller tavle i mørk modus
    static let papir = dynamisk(lys: lys, mork: tavle)
    /// Tekstfargen: mørk blekk, eller lyst papir i mørk modus
    static let blekk = dynamisk(lys: morkBlekk, mork: lys)
    /// Kortflater: hvitt, eller mørkegrått i mørk modus
    static let kort = dynamisk(lys: .white, mork: morkKort)

    static func dynamisk(lys: Color, mork: Color) -> Color {
        let l = UIColor(lys), m = UIColor(mork)
        return Color(UIColor { $0.userInterfaceStyle == .dark ? m : l })
    }
}

/// Paletten rett i alle skjermer: `gul`, `papir`, `blekk` … uten å definere dem i hver fil.
/// En skjerm som trenger en egen nyanse, lager sin egen med samme navn – den vinner over denne.
extension View {
    var gul: Color { Tema.gul }
    var oransje: Color { Tema.oransje }
    var rust: Color { Tema.rust }
    var mint: Color { Tema.mint }
    var rosa: Color { Tema.rosa }
    var kortRod: Color { Tema.kortRod }
    var morkBlekk: Color { Tema.morkBlekk }
    var lys: Color { Tema.lys }
    var papir: Color { Tema.papir }
    var blekk: Color { Tema.blekk }
    var kortFarge: Color { Tema.kort }
}

// MARK: - Skrift

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

// MARK: - Vibrering

enum Haptikk {
    static func trykk(_ stil: UIImpactFeedbackGenerator.FeedbackStyle = .light) { UIImpactFeedbackGenerator(style: stil).impactOccurred() }
    static func valg() { UISelectionFeedbackGenerator().selectionChanged() }
    static func melding(_ type: UINotificationFeedbackGenerator.FeedbackType) { UINotificationFeedbackGenerator().notificationOccurred(type) }
}

// MARK: - Figurbilder

/// Figurene kommer som base64-PNG. Én felles buffer for hele appen, så samme figur bare pakkes ut én gang,
/// også når den vises i flere leker samme kveld. NSCache rydder selv når telefonen trenger minnet.
enum Figurbilder {
    private static let buffer: NSCache<NSString, UIImage> = { let c = NSCache<NSString, UIImage>(); c.countLimit = 120; return c }()
    static func bilde(_ b64: String) -> UIImage? {
        if b64.isEmpty { return nil }
        let n = b64 as NSString
        if let b = buffer.object(forKey: n) { return b }
        guard let data = Data(base64Encoded: b64), let img = UIImage(data: data, scale: 2) else { return nil }
        buffer.setObject(img, forKey: n)
        return img
    }
}

/// Modeller som viser figurer får `bilde(_:)` herfra.
protocol HarFigurer {}
extension HarFigurer {
    func bilde(_ b64: String) -> UIImage? { Figurbilder.bilde(b64) }
}

// MARK: - Felles deler i lekene

extension View {
    /// Den lille kapselknappen øverst i lekene (Stua, Mer)
    func liten(_ t: String, _ sym: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: 5) { Image(systemName: sym).font(.system(size: 13, weight: .bold)); Text(t).font(.archivo(13, vekt: 800)) }
                .padding(.horizontal, 11).frame(height: 34)
                .background(Capsule().fill(Tema.kort)).overlay(Capsule().stroke(Tema.blekk, lineWidth: 2))
        }.buttonStyle(.plain)
    }
}

/// Nedtellingen øverst i en lek: sekundene i en gul sirkel, oransje de siste ti
struct Nedtelling: View {
    let igjen: () -> Int
    var body: some View {
        TimelineView(.periodic(from: .now, by: 1)) { _ in
            let n = igjen()
            Text("\(n)").font(.archivo(16, vekt: 900)).frame(width: 40, height: 40)
                .background(Circle().fill(n <= 10 ? Tema.oransje : Tema.gul)).overlay(Circle().stroke(Tema.morkBlekk, lineWidth: 2))
                .foregroundColor(Tema.morkBlekk)
        }
    }
}

/// Toppen i en lek: lekens navn og hva som skjer nå (rust når det gjelder deg), plass til noe ekstra
/// (nedtelling, bom-prikker …), og Stua og Mer til høyre. `trykk` får «stua-ark» eller «mer-ark».
struct Topplinje<Ekstra: View>: View {
    let tittel: String
    let chip: String
    var uthevet = false
    /// Navnet på én linje (lange lekenavn kuttes heller enn å skyve toppen ned)
    var enLinje = false
    let stua: String
    let mer: String
    let trykk: (String) -> Void
    @ViewBuilder var ekstra: () -> Ekstra

    var body: some View {
        HStack(spacing: 8) {
            VStack(alignment: .leading, spacing: 1) {
                Text(tittel).font(.archivo(12, vekt: 700)).opacity(0.65).lineLimit(enLinje ? 1 : nil)
                Text(chip).font(.archivo(16, vekt: 900)).foregroundColor(uthevet ? Tema.rust : Tema.blekk).lineLimit(2)
            }
            Spacer()
            ekstra()
            liten(stua, "sofa.fill") { trykk("stua-ark") }
            liten(mer, "ellipsis") { trykk("mer-ark") }
        }
        .padding(.horizontal, 16).padding(.top, 6).padding(.bottom, 8)
    }
}

extension Topplinje where Ekstra == EmptyView {
    init(tittel: String, chip: String, uthevet: Bool = false, enLinje: Bool = false, stua: String, mer: String, trykk: @escaping (String) -> Void) {
        self.init(tittel: tittel, chip: chip, uthevet: uthevet, enLinje: enLinje, stua: stua, mer: mer, trykk: trykk, ekstra: { EmptyView() })
    }
}

/// En spillerfigur fra base64-PNG, eller en gul sirkel til bildet finnes. Med `px` får den fast størrelse.
struct Figur: View {
    let png: String
    var px: CGFloat? = nil
    init(_ png: String, _ px: CGFloat? = nil) { self.png = png; self.px = px }
    var body: some View {
        if let px {
            innhold.frame(width: px, height: px)
        } else {
            innhold
        }
    }
    @ViewBuilder private var innhold: some View {
        if let img = Figurbilder.bilde(png) { Image(uiImage: img).resizable().aspectRatio(contentMode: .fit) }
        else { Circle().fill(Tema.gul).overlay(Circle().stroke(Tema.morkBlekk, lineWidth: 2)).padding(px == nil ? 0 : 2) }
    }
}
