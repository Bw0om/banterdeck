import SwiftUI
import UIKit
import WebKit

/// Opus som native skjerm: hvem som har terningen, terningen som lander, og «Trill».
/// Fase 3: skjermen leser rommet selv (LekKobling/RomKlient) og sender trillingen og «Droppet kom!» rett til rommet.
/// Nettsiden gir plassen i rommet. Med eldre rom.js brukes opData som reserve.
struct OpData {
    var holder = "", jeg = false, kast = 0, nr = 0, antall = 0, naa: Double = 0, tittel = "Opus", chip = ""
    var spotify = "", spotifyUrl = "https://open.spotify.com/search/Opus%20Eric%20Prydz", etikett = "", holderTekst = "", melding = "", trill = "", vent = "", kastTekst = "", drop = ""
    var stua = "Stua", mer = "Mer"

    /// Reserven: skjermen slik eldre rom.js lager den (opData)
    init(_ d: [String: Any]) {
        func s(_ k: String) -> String { d[k] as? String ?? "" }
        func i(_ k: String) -> Int { (d[k] as? NSNumber)?.intValue ?? 0 }
        holder = s("holder"); jeg = d["jeg"] as? Bool ?? false; kast = i("kast"); nr = i("nr"); antall = i("antall"); naa = (d["naa"] as? NSNumber)?.doubleValue ?? 0
        tittel = s("tittel"); chip = s("chip"); spotify = s("spotify"); spotifyUrl = s("spotifyUrl"); etikett = s("etikett"); holderTekst = s("holderTekst")
        melding = s("melding"); trill = s("trill"); vent = s("vent"); kastTekst = s("kastTekst"); drop = s("drop")
        if !s("stua").isEmpty { stua = s("stua") }
        if !s("mer").isEmpty { mer = s("mer") }
    }

    /// Skjermen bygd rett fra rommet: `spill` er serverens visning av Opus (ekstraVisning i rom.ts)
    init(rom t: RomTilstand) {
        let s = t.spill ?? .null
        let en = t.lang == "en"
        func T(_ no: String, _ eng: String) -> String { en ? eng : no }
        func navn(_ id: String?) -> String { id.flatMap { t.spiller($0)?.navn } ?? "?" }
        let h = s["holder"]?.tekst
        jeg = h != nil && h == t.meg
        holder = navn(h)
        kast = Int(s["kast"]?.tall ?? 0); nr = Int(s["nr"]?.tall ?? 0); antall = Int(s["antall"]?.tall ?? 0); naa = t.naa
        let fra = s["fra"]?.tekst
        chip = jeg ? T("Du har terningen", "You have the die") : holder + T(" har terningen", " has the die")
        spotify = T("«Opus» i Spotify", "“Opus” on Spotify")
        etikett = T("Terningen er hos", "The die is with")
        holderTekst = holder + (jeg ? T(" (deg!)", " (you!)") : "")
        if kast == 6, let fra { melding = T("SEKSER! ", "SIX! ") + navn(fra) + T(" sendte videre.", " passed it on.") }
        else if kast > 0 { melding = "\(kast)" + (jeg ? T(" – trill igjen!", " – roll again!") : "") }
        else { melding = T("Start sangen og trill!", "Start the song and roll!") }
        trill = jeg ? T("Trill", "Roll") : ""
        vent = jeg ? "" : T("Vent til terningen kommer til deg.", "Wait until the die comes to you.")
        kastTekst = "\(antall)" + T(" kast", " rolls")
        drop = t.jegErVert ? T("Droppet kom!", "The drop hit!") : ""
        stua = T("Stua", "Lounge"); mer = T("Mer", "More")
    }
}

@MainActor
@Observable
final class OpModell {
    var d: OpData? = nil
    private let kobling = LekKobling("opus")
    /// Det nettsiden sendte sist – reserven til rommet er hentet (eller hvis plassen ikke finnes)
    @ObservationIgnored private var sist: [String: Any] = [:]
    /// En trilling er på vei: ett trykk gir ett kast
    @ObservationIgnored private var sender = false
    @ObservationIgnored weak var nett: WKWebView? { didSet { kobling.nett = nett } }

    init() { kobling.endret = { [weak self] in self?.bygg() } }

    func sett(_ dict: [String: Any]) {
        sist = dict
        kobling.ta(dict) { _ in [] }
        bygg()
    }

    /// Leken er over på denne telefonen
    func slipp() { kobling.slipp(); d = nil; sist = [:]; sender = false }

    /// Rommet når det er hentet og viser Opus – ellers skjermen nettsiden sendte
    private func bygg() {
        let ny: OpData
        if let t = kobling.tilstand("opus") { ny = OpData(rom: t) }
        else if !sist.isEmpty { ny = OpData(sist) }
        else { return }
        withAnimation(.spring(response: 0.45, dampingFraction: 0.7)) { d = ny }
    }

    /// Trill – rett til rommet
    func trill() { send("kast", .medium) }
    /// Verten: droppet i sangen kom, den som holder terningen drikker opp
    func drop() { send("drop", .light) }

    private func send(_ handling: String, _ stil: UIImpactFeedbackGenerator.FeedbackStyle) {
        guard !sender else { return }
        sender = true
        Haptikk.trykk(stil)
        Task {
            let ok = await kobling.gjor(["handling": handling], ellers: handling)
            sender = false
            if !ok { Haptikk.melding(.error) }
        }
    }

    /// Stua og Mer: nettsidens egne knapper
    func trykk(_ g: String, _ attrs: [String: String] = [:]) {
        Haptikk.trykk()
        kobling.trykkNett(g, attrs)
    }
}

struct OpusSkjerm: View {
    var m: OpModell
    @State private var landet = 0
    @State private var vri: Double = 0
    private let rust = Color(red: 0.722, green: 0.22, blue: 0.039)

    var body: some View {
        ZStack {
            papir.ignoresSafeArea()
            if let d = m.d {
                VStack(spacing: 0) {
                    topp(d)
                    VStack(spacing: 14) {
                        Button(action: { if let u = URL(string: d.spotifyUrl) { UIApplication.shared.open(u) } }) {
                            HStack(spacing: 6) { Image(systemName: "music.note").font(.system(size: 13, weight: .bold)); Text(d.spotify).font(.archivo(13, vekt: 800)) }
                                .padding(.horizontal, 12).frame(height: 36)
                                .background(Capsule().fill(mint)).overlay(Capsule().stroke(morkBlekk, lineWidth: 2.5)).foregroundColor(morkBlekk)
                        }.buttonStyle(.plain)
                        VStack(spacing: 2) {
                            Text(d.etikett.uppercased()).font(.archivo(12, vekt: 900)).opacity(0.6)
                            Text(d.holderTekst.uppercased()).font(.archivo(34, vekt: 900)).foregroundColor(rust).lineLimit(2).minimumScaleFactor(0.6).multilineTextAlignment(.center)
                        }
                        Terning(n: d.kast == 0 ? 6 : d.kast, farge: kortFarge, prikk: blekk, strek: blekk)
                            .frame(width: 132, height: 132)
                            .rotationEffect(.degrees(vri))
                            .scaleEffect(landet == d.nr ? 1 : 0.6)
                            .padding(.vertical, 10)
                            .onAppear { landet = d.nr }
                            .onChange(of: d.nr) { nr in
                                vri = -200
                                withAnimation(.spring(response: 0.55, dampingFraction: 0.62)) { landet = nr; vri = 0 }
                            }
                        Text(d.melding).font(.archivo(22, vekt: 900)).multilineTextAlignment(.center).fixedSize(horizontal: false, vertical: true)
                            .foregroundColor(d.kast == 6 ? rust : blekk)
                        if !d.trill.isEmpty {
                            Button(action: { m.trill() }) {
                                Text(d.trill.uppercased()).font(.archivo(22, vekt: 900)).foregroundColor(morkBlekk)
                                    .frame(maxWidth: .infinity).frame(minHeight: 72)
                                    .background(RoundedRectangle(cornerRadius: 14).fill(gul)).overlay(RoundedRectangle(cornerRadius: 14).stroke(morkBlekk, lineWidth: 3))
                                    .background(RoundedRectangle(cornerRadius: 14).fill(morkBlekk).offset(x: 4, y: 4))
                            }.buttonStyle(.plain)
                        } else {
                            Text(d.vent).font(.archivo(15, vekt: 600)).opacity(0.7).multilineTextAlignment(.center)
                        }
                        Text(d.kastTekst).font(.archivo(13, vekt: 800)).opacity(0.6)
                        if !d.drop.isEmpty {
                            Button(action: { m.drop() }) {
                                Text(d.drop).font(.archivo(14, vekt: 800)).padding(.horizontal, 14).frame(height: 40)
                                    .background(Capsule().fill(kortFarge)).overlay(Capsule().stroke(blekk, lineWidth: 2))
                            }.buttonStyle(.plain)
                        }
                        Spacer(minLength: 0)
                    }
                    .padding(.horizontal, 16).padding(.top, 8).padding(.bottom, 24)
                }
            }
        }
        .foregroundColor(blekk)
    }

    private func topp(_ d: OpData) -> some View {
        Topplinje(tittel: d.tittel, chip: d.chip, uthevet: d.jeg, stua: d.stua, mer: d.mer, trykk: { m.trykk($0) })
    }
}

/// En terning med prikker, som nettsidens `.dice`
struct Terning: View {
    let n: Int, farge: Color, prikk: Color, strek: Color
    private static let prikker: [Int: [Int]] = [1: [5], 2: [1, 9], 3: [1, 5, 9], 4: [1, 3, 7, 9], 5: [1, 3, 5, 7, 9], 6: [1, 3, 4, 6, 7, 9]]
    var body: some View {
        GeometryReader { g in
            let s = min(g.size.width, g.size.height), r = s * 0.22, p = s * 0.11
            ZStack {
                RoundedRectangle(cornerRadius: r).fill(strek).offset(x: s * 0.05, y: s * 0.05)
                RoundedRectangle(cornerRadius: r).fill(farge)
                RoundedRectangle(cornerRadius: r).stroke(strek, lineWidth: 3.5)
                ForEach(0..<9, id: \.self) { i in
                    let paa = (Terning.prikker[n] ?? []).contains(i + 1)
                    Circle().fill(prikk).frame(width: p, height: p)
                        .position(x: s * (0.25 + 0.25 * CGFloat(i % 3)), y: s * (0.25 + 0.25 * CGFloat(i / 3)))
                        .opacity(paa ? 1 : 0)
                }
            }
            .frame(width: s, height: s)
        }
    }
}
