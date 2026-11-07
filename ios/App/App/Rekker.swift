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
    var farge: Color = Color(red: 1, green: 0.824, blue: 0.247)
    var strek: Color = Color(red: 0.086, green: 0.071, blue: 0.059)
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

/// Benken og andre rekker med hode + navn: kolonner med fast bredde som bryter linje når det blir mange.
func benkKolonner(_ bredde: CGFloat, avstand: CGFloat = 6) -> [GridItem] {
    [GridItem(.fixed(bredde), spacing: avstand)]
}
