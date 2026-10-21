import SwiftUI
import UIKit
import WebKit

/// «Rommet» som et iOS-ark (verten): Rom, Gulv, Lys og Ting – én rute per valg. Arket står halvveis oppe, så stua bak
/// endres med en gang. Valgene gjøres av nettsiden (window.__mvRom) og lagres på kontoen som før.
struct RomRute: Identifiable {
    var id: String { v }
    let v: String, navn: String, farger: [String], ikon: String, paa: Bool, laas: String
    init?(_ d: [String: Any]) {
        guard let v = d["v"] as? String else { return nil }
        self.v = v; navn = d["navn"] as? String ?? v; farger = d["farger"] as? [String] ?? []
        ikon = d["ikon"] as? String ?? ""; paa = d["paa"] as? Bool ?? false; laas = d["laas"] as? String ?? ""
    }
}

struct RomRad: Identifiable {
    let id: String, navn: String, ruter: [RomRute]
    init?(_ d: [String: Any]) {
        guard let id = d["id"] as? String else { return nil }
        self.id = id; navn = d["navn"] as? String ?? id
        ruter = (d["ruter"] as? [[String: Any]] ?? []).compactMap(RomRute.init)
    }
}

final class RomModell: ObservableObject {
    @Published var tittel = "Rommet"
    @Published var husk = ""
    @Published var rader: [RomRad] = []
    @Published var lapp: String? = nil
    weak var nett: WKWebView?
    var pluss: (() -> Void)?
    private var lappT: Timer?

    init(_ d: [String: Any]) { sett(d) }

    func sett(_ d: [String: Any]) {
        tittel = d["tittel"] as? String ?? tittel
        husk = d["husk"] as? String ?? ""
        rader = (d["rader"] as? [[String: Any]] ?? []).compactMap(RomRad.init)
    }

    func velg(_ gruppe: String, _ v: String) {
        guard let w = nett else { return }
        UIImpactFeedbackGenerator(style: .light).impactOccurred()
        w.callAsyncJavaScript("return window.__mvRom.velg(g, v)", arguments: ["g": gruppe, "v": v], in: nil, in: .page) { [weak self] res in
            DispatchQueue.main.async {
                guard let self = self, case .success(let r) = res, let d = r as? [String: Any] else { return }
                if d["pluss"] as? Bool == true { self.pluss?(); return }
                if let m = d["melding"] as? String, !m.isEmpty { self.visLapp(m); return }
                if let ny = d["data"] as? [String: Any] { self.sett(ny) }
            }
        }
    }

    private func visLapp(_ t: String) {
        lapp = t; lappT?.invalidate()
        lappT = Timer.scheduledTimer(withTimeInterval: 2.6, repeats: false) { [weak self] _ in self?.lapp = nil }
    }
}

struct RomArk: View {
    @ObservedObject var m: RomModell
    @Environment(\.colorScheme) private var modus
    private var papir: Color { modus == .dark ? Color(red: 0.11, green: 0.106, blue: 0.122) : Color(red: 1, green: 0.973, blue: 0.933) }
    private var kort: Color { modus == .dark ? Color(red: 0.173, green: 0.169, blue: 0.188) : .white }
    private var blekk: Color { modus == .dark ? Color(red: 1, green: 0.973, blue: 0.933) : Color(red: 0.086, green: 0.071, blue: 0.059) }
    private let gul = Color(red: 1, green: 0.824, blue: 0.247)
    private let morkBlekk = Color(red: 0.086, green: 0.071, blue: 0.059)
    /// SF-symboler for gulv, lys og ting
    private let symbol: [String: String] = ["fliser": "square.grid.3x3", "lampe": "lightbulb", "lys": "sparkles", "diskokule": "circle.hexagongrid.fill", "plante": "leaf", "plakat": "newspaper", "platespiller": "opticaldisc"]

    var body: some View {
        VStack(spacing: 0) {
            Capsule().fill(blekk.opacity(0.25)).frame(width: 36, height: 5).padding(.top, 8)
            HStack(alignment: .firstTextBaseline) {
                Text(m.tittel).font(.archivo(22, vekt: 900))
                Spacer()
                if !m.husk.isEmpty { Text(m.husk).font(.archivo(12, vekt: 600)).opacity(0.6) }
            }.padding(.horizontal, 20).padding(.top, 10)
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    if let l = m.lapp {
                        Text(l).font(.archivo(15, vekt: 700)).padding(12).frame(maxWidth: .infinity, alignment: .leading)
                            .background(RoundedRectangle(cornerRadius: 12).fill(gul)).foregroundColor(morkBlekk).transition(.opacity)
                    }
                    ForEach(m.rader) { rad in
                        VStack(alignment: .leading, spacing: 8) {
                            Text(rad.navn).font(.archivo(13, vekt: 800)).opacity(0.7)
                            ScrollView(.horizontal, showsIndicators: false) {
                                HStack(spacing: 10) { ForEach(rad.ruter) { r in rute(rad.id, r) } }
                            }
                        }
                    }
                }.padding(.horizontal, 20).padding(.vertical, 14)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(papir.ignoresSafeArea())
        .foregroundColor(blekk)
        .animation(.easeOut(duration: 0.18), value: m.lapp)
    }

    private func rute(_ gruppe: String, _ r: RomRute) -> some View {
        Button(action: { m.velg(gruppe, r.v) }) {
            VStack(spacing: 6) {
                ZStack {
                    RoundedRectangle(cornerRadius: 12).fill(r.paa ? gul.opacity(0.35) : kort)
                    RoundedRectangle(cornerRadius: 12).stroke(r.paa ? gul : blekk.opacity(0.25), lineWidth: r.paa ? 3 : 1.5)
                    if !r.farger.isEmpty {
                        LazyVGrid(columns: [GridItem(.flexible(), spacing: 3), GridItem(.flexible(), spacing: 3)], spacing: 3) {
                            ForEach(Array(r.farger.prefix(4).enumerated()), id: \.offset) { _, f in RoundedRectangle(cornerRadius: 4).fill(Color(hex: f)).frame(height: 20) }
                        }.padding(10)
                    } else {
                        Image(systemName: symbol[r.ikon] ?? "circle").font(.system(size: 26, weight: .semibold))
                    }
                    if !r.laas.isEmpty {
                        Text(r.laas).font(.archivo(10, vekt: 900)).padding(.horizontal, 6).padding(.vertical, 3)
                            .background(Capsule().fill(gul)).foregroundColor(morkBlekk)
                            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topTrailing).padding(4)
                    }
                }
                .frame(width: 72, height: 64).opacity(r.laas.isEmpty ? 1 : 0.6)
                Text(r.navn).font(.archivo(12, vekt: 700)).lineLimit(1)
            }
            .frame(width: 84)
        }.buttonStyle(.plain)
    }
}
