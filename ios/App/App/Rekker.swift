import SwiftUI

// Rekker med spillere. Én HStack uten tak ble bredere enn telefonen med store gjenger (11 i rommet),
// og SwiftUI sentrerer det som er for bredt – så begge kantene av hele skjermen forsvant. Nettsiden bryter linje med CSS;
// her gjør Hodestabel (tak + «+N») og benkKolonner (rutenett som bryter linje) det samme.

/// Hoder oppå hverandre: maks `maks` stykker, resten blir én «+N»-rund i samme størrelse.
struct Hodestabel<Hode: View>: View {
    let antall: Int
    var maks: Int = 6
    let storrelse: CGFloat
    var avstand: CGFloat = -10
    var farge: Color = Tema.gul
    var strek: Color = Tema.morkBlekk
    @ViewBuilder let hode: (Int) -> Hode

    var body: some View {
        let vis: Int = antall > maks ? maks - 1 : antall   // plass til +N-runden
        HStack(spacing: avstand) {
            ForEach(0..<vis, id: \.self) { i in hode(i) }
            if antall > vis {
                Text("+\(antall - vis)").font(.archivo(max(10, storrelse * 0.34), vekt: 900)).foregroundColor(strek).lineLimit(1).minimumScaleFactor(0.6)
                    .frame(width: storrelse, height: storrelse)
                    .background(Circle().fill(farge)).overlay(Circle().stroke(strek, lineWidth: 2))
            }
        }
    }
}

/// Benken og andre rekker med hode + navn: så mange kolonner som får plass på én linje, resten bryter til neste.
/// (`.fixed` gir bare ÉN kolonne – da sto hodene under hverandre; `.adaptive` fyller linja først.)
func benkKolonner(_ bredde: CGFloat, avstand: CGFloat = 6) -> [GridItem] {
    [GridItem(.adaptive(minimum: bredde, maximum: bredde), spacing: avstand)]
}

/// Flytende rad (som flex-wrap): elementene legges etter hverandre og bryter når raden er full.
struct FlytLayout: Layout {
    var spacing: CGFloat = 8
    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let bredde = proposal.width ?? 360
        var x: CGFloat = 0, y: CGFloat = 0, radH: CGFloat = 0
        for v in subviews {
            let s = v.sizeThatFits(.unspecified)
            if x > 0 && x + s.width > bredde { x = 0; y += radH + spacing; radH = 0 }
            x += s.width + spacing; radH = max(radH, s.height)
        }
        return CGSize(width: bredde, height: y + radH)
    }
    func placeSubviews(in b: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        var x: CGFloat = b.minX, y: CGFloat = b.minY, radH: CGFloat = 0
        for v in subviews {
            let s = v.sizeThatFits(.unspecified)
            if x > b.minX && x + s.width > b.maxX { x = b.minX; y += radH + spacing; radH = 0 }
            v.place(at: CGPoint(x: x, y: y), proposal: ProposedViewSize(s))
            x += s.width + spacing; radH = max(radH, s.height)
        }
    }
}
