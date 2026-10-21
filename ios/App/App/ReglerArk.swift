import SwiftUI

/// «Slik spiller dere»: et ark som kommer opp når en lek starter, så verten rekker å forklare før første trekk.
/// Reglene kommer fra nettsiden (rom.js REGLER) sammen med den første skjermen i leken.
struct ReglerArk: View {
    let tittel: String
    let navn: String
    let regler: [String]
    let knapp: String
    let lukk: () -> Void
    @Environment(\.colorScheme) private var modus
    private var papir: Color { modus == .dark ? Color(red: 0.11, green: 0.106, blue: 0.122) : Color(red: 1, green: 0.973, blue: 0.933) }
    private var kort: Color { modus == .dark ? Color.white.opacity(0.07) : .white }
    private var blekk: Color { modus == .dark ? Color(red: 1, green: 0.973, blue: 0.933) : Color(red: 0.086, green: 0.071, blue: 0.059) }
    private let gul = Color(red: 1, green: 0.824, blue: 0.247)
    private let morkBlekk = Color(red: 0.086, green: 0.071, blue: 0.059)

    var body: some View {
        ZStack {
            papir.ignoresSafeArea()
            VStack(spacing: 0) {
                ScrollView {
                    VStack(alignment: .leading, spacing: 14) {
                        Text(navn.uppercased()).font(.archivo(12, vekt: 900)).opacity(0.6).padding(.top, 22)
                        Text(tittel).font(.archivo(30, vekt: 900)).fixedSize(horizontal: false, vertical: true)
                        VStack(alignment: .leading, spacing: 12) {
                            ForEach(Array(regler.enumerated()), id: \.offset) { i, r in
                                HStack(alignment: .top, spacing: 12) {
                                    Text("\(i + 1)").font(.archivo(15, vekt: 900)).frame(width: 30, height: 30).foregroundColor(morkBlekk)
                                        .background(Circle().fill(gul)).overlay(Circle().stroke(morkBlekk, lineWidth: 2))
                                    Text(r).font(.archivo(17, vekt: 600)).lineSpacing(3).fixedSize(horizontal: false, vertical: true).padding(.top, 4)
                                }
                            }
                        }
                        .padding(16).frame(maxWidth: .infinity, alignment: .leading)
                        .background(RoundedRectangle(cornerRadius: 16).fill(kort))
                        .overlay(RoundedRectangle(cornerRadius: 16).stroke(blekk, lineWidth: 3))
                        .background(RoundedRectangle(cornerRadius: 16).fill(blekk).offset(x: 5, y: 5))
                        .padding(.trailing, 5).padding(.bottom, 5)
                    }
                    .padding(.horizontal, 20).padding(.bottom, 16)
                }
                Button(action: lukk) {
                    Text(knapp.uppercased()).font(.archivo(18, vekt: 900)).frame(maxWidth: .infinity).frame(height: 60).foregroundColor(morkBlekk)
                        .background(RoundedRectangle(cornerRadius: 14).fill(gul)).overlay(RoundedRectangle(cornerRadius: 14).stroke(morkBlekk, lineWidth: 3))
                        .background(RoundedRectangle(cornerRadius: 14).fill(morkBlekk).offset(x: 4, y: 4))
                }
                .buttonStyle(.plain)
                .padding(.horizontal, 20).padding(.top, 8).padding(.bottom, 16)
            }
        }
        .foregroundColor(blekk)
    }
}
