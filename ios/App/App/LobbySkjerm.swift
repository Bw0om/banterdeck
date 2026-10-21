import SwiftUI
import UIKit
import WebKit

/// Lobbyen native: romkoden og «Inviter» øverst, stua i midten (vises gjennom et hull i skjermen – stua er nettsidens,
/// med figurene, dra-bevegelsene og snakkeboblene), og lekene/planen/stillingen under som blokker fra nettsiden.
final class LobbyModell: ObservableObject {
    @Published var kode = ""
    @Published var n = 0
    @Published var erVert = false
    @Published var tekst: [String: String] = [:]
    let blokker = KortModell()
    var hullEndret: ((CGRect) -> Void)?
    weak var nett: WKWebView? { didSet { blokker.nett = nett } }

    func sett(_ d: [String: Any]) {
        kode = d["kode"] as? String ?? kode
        n = d["n"] as? Int ?? n
        erVert = d["erVert"] as? Bool ?? erVert
        tekst = d["tekst"] as? [String: String] ?? tekst
        blokker.sett(["blokker": d["blokker"] as? [[String: Any]] ?? [], "naa": d["naa"] ?? 0])
    }
    func t(_ k: String) -> String { tekst[k] ?? k }
}

private struct HullKey: PreferenceKey {
    static var defaultValue: CGRect = .zero
    static func reduce(value: inout CGRect, nextValue: () -> CGRect) { value = nextValue() }
}

struct LobbySkjerm: View {
    @ObservedObject var m: LobbyModell
    @Environment(\.colorScheme) private var modus
    private var papir: Color { modus == .dark ? Color(red: 0.11, green: 0.106, blue: 0.122) : Color(red: 1, green: 0.973, blue: 0.933) }
    private var kort: Color { modus == .dark ? Color.white.opacity(0.07) : .white }
    private var blekk: Color { modus == .dark ? Color(red: 1, green: 0.973, blue: 0.933) : Color(red: 0.086, green: 0.071, blue: 0.059) }
    private let gul = Color(red: 1, green: 0.824, blue: 0.247)
    private let oransje = Color(red: 1, green: 0.357, blue: 0.122)
    private let morkBlekk = Color(red: 0.086, green: 0.071, blue: 0.059)

    var body: some View {
        GeometryReader { g in
            let hull = (g.size.width - 24) * 0.823 + 28   // stua er 396 × 326 i nettsiden, pluss luft
            ZStack(alignment: .top) {
                papir.ignoresSafeArea()
                VStack(spacing: 10) {
                    topp.padding(.horizontal, 16).padding(.top, 6)
                    // Hullet: her ligger nettsidens stue, og fingeren går rett gjennom til den. Står fast – bare lista under blar.
                    Color.clear.frame(height: hull)
                        .background(GeometryReader { h in Color.clear.preference(key: HullKey.self, value: h.frame(in: .named("lobby"))) })
                    ScrollView {
                        VStack(alignment: .leading, spacing: 12) {
                            if m.erVert {
                                BlokkListe(m: m.blokker)
                            } else {
                                VStack(spacing: 10) {
                                    Text(m.t("venter")).font(.archivo(20, vekt: 900)).multilineTextAlignment(.center)
                                    HStack(spacing: 6) { ForEach(0..<3, id: \.self) { i in Circle().fill(gul).frame(width: 10, height: 10).opacity(0.5 + Double(i) * 0.25) } }
                                }.frame(maxWidth: .infinity).padding(.top, 14)
                            }
                        }
                        .padding(.horizontal, 16).padding(.top, 4).padding(.bottom, 30)
                    }
                }
            }
            .coordinateSpace(name: "lobby")
            .onPreferenceChange(HullKey.self) { r in m.hullEndret?(r) }
        }
        .foregroundColor(blekk)
    }

    private var topp: some View {
        HStack(alignment: .center, spacing: 10) {
            VStack(alignment: .leading, spacing: 2) {
                Text(m.t("kode").uppercased()).font(.archivo(11, vekt: 900)).opacity(0.6)
                Text(m.kode).font(.archivo(34, vekt: 900)).tracking(3)
                    .padding(.horizontal, 10).padding(.vertical, 2).background(RoundedRectangle(cornerRadius: 8).fill(gul)).foregroundColor(morkBlekk)
                Text(m.t("iRommet")).font(.archivo(13, vekt: 700)).opacity(0.75).padding(.top, 2)
            }
            Spacer()
            Button(action: { m.blokker.trykk(["g": "del"]) }) {
                HStack(spacing: 6) { Image(systemName: "square.and.arrow.up").font(.system(size: 15, weight: .bold)); Text(m.t("inviter").uppercased()).font(.archivo(15, vekt: 900)) }
                    .padding(.horizontal, 16).frame(height: 48).foregroundColor(morkBlekk)
                    .background(ZStack {
                        RoundedRectangle(cornerRadius: 12).fill(morkBlekk).offset(x: 3, y: 3)
                        RoundedRectangle(cornerRadius: 12).fill(gul)
                        RoundedRectangle(cornerRadius: 12).stroke(morkBlekk, lineWidth: 2.5)
                    })
            }.buttonStyle(.plain)
        }
    }
}
