import SwiftUI
import UIKit
import WebKit

/// Ring of Fire som native skjerm: ringen av kort rundt kongekoppen, snurring med fingeren, og trekket med stø hånd
/// ut gjennom sporet (utenfor sporet bygger spenningen seg – ryker den, ryker ringen). Nettsiden under holder
/// tilstanden (rom.js rofData / window.__mvRof) og lyden; denne tegner, og eier bevegelsen.
struct RofData {
    let nr: Int, tatt: Set<Int>, min: Bool, ferdig: Bool, igjen: Int, konger: Int, ringBrutt: Bool, bruddPlass: Int, halv: Double
    let holderNavn: String, holderT: Double, holderSp: Double
    let bruddNr: Int, bruddNavn: String
    let tur: String, igjenTekst: String, kongerTekst: String, kortI: String, hint: String, greit: String, neste: String
    let kort: [String: Any]?, makker: [String: Any]?, makkere: String
    let slot: String, spenning: String, rok: String, drikkerOpp: String, stua: String, mer: String

    init(_ d: [String: Any]) {
        nr = d["nr"] as? Int ?? 0; tatt = Set(d["tatt"] as? [Int] ?? []); min = d["min"] as? Bool ?? false; ferdig = d["ferdig"] as? Bool ?? false
        igjen = d["igjen"] as? Int ?? 0; konger = d["konger"] as? Int ?? 0; ringBrutt = d["ringBrutt"] as? Bool ?? false; bruddPlass = d["bruddPlass"] as? Int ?? -1
        halv = (d["halv"] as? NSNumber)?.doubleValue ?? 30
        let h = d["holder"] as? [String: Any]
        holderNavn = h?["navn"] as? String ?? ""; holderT = (h?["t"] as? NSNumber)?.doubleValue ?? 0; holderSp = (h?["sp"] as? NSNumber)?.doubleValue ?? 0
        let b = d["brudd"] as? [String: Any]
        bruddNr = b?["nr"] as? Int ?? 0; bruddNavn = b?["navn"] as? String ?? ""
        tur = d["tur"] as? String ?? ""; igjenTekst = d["igjenTekst"] as? String ?? ""; kongerTekst = d["kongerTekst"] as? String ?? ""; kortI = d["kortI"] as? String ?? ""
        hint = d["hint"] as? String ?? ""; greit = d["greit"] as? String ?? "Greit"; neste = d["neste"] as? String ?? ""
        kort = d["kort"] as? [String: Any]; makker = d["makker"] as? [String: Any]; makkere = d["makkere"] as? String ?? ""
        slot = d["slot"] as? String ?? "UT HER"; spenning = d["spenning"] as? String ?? "SPENNING"; rok = d["rok"] as? String ?? "RINGEN RØK!"; drikkerOpp = d["drikkerOpp"] as? String ?? ""
        stua = d["stua"] as? String ?? "Stua"; mer = d["mer"] as? String ?? "Mer"
    }
}

/// Geometrien er den samme som nettsidens SVG (358 × 500), så alt ser likt ut på TV-en og for de andre
enum Rof {
    static let n = 52, steg = 360.0 / 52.0, cx = 179.0, cy = 318.0, r = 118.0
    static let spor: [(Double, Double)] = [(179, 190), (212, 150), (146, 110), (179, 50)]
    static func norm(_ a: Double) -> Double { var a = a.truncatingRemainder(dividingBy: 360); if a > 180 { a -= 360 }; if a < -180 { a += 360 }; return a }
    static func punkt(_ t: Double) -> CGPoint {
        let u = 1 - t, p = spor
        return CGPoint(x: u*u*u*p[0].0 + 3*u*u*t*p[1].0 + 3*u*t*t*p[2].0 + t*t*t*p[3].0, y: u*u*u*p[0].1 + 3*u*u*t*p[1].1 + 3*u*t*t*p[2].1 + t*t*t*p[3].1)
    }
    static func naermest(_ p: CGPoint) -> (Double, Double) {
        var best = 0.0, bd = 1e9
        for i in 0...60 { let t = Double(i) / 60, q = punkt(t), d = (q.x - p.x) * (q.x - p.x) + (q.y - p.y) * (q.y - p.y); if d < bd { bd = d; best = t } }
        return (best, bd.squareRoot())
    }
    static func farge(_ sp: Double) -> Color { sp < 0.5 ? Color(hex: "#63E2A8") : sp < 0.8 ? Color(hex: "#FFD23F") : Color(hex: "#FF5B1F") }
}

final class RofModell: ObservableObject {
    @Published var d: RofData? = nil
    @Published var vinkel: Double = 0          // ringens rotasjon (rofA)
    @Published var valgt: Int = -1             // kortet øverst
    @Published var drar = false                // holder i kortet
    @Published var draT: Double = 0, sp: Double = 0, vri: Double = 0
    @Published var holdt: CGPoint = CGPoint(x: 179, y: 190)
    @Published var skjelv = false
    @Published var skjultNr = -1               // kortet lagt bort for dette trekket
    @Published var rok: String? = nil          // «RINGEN RØK!»-banneret
    @Published var ute = false                 // kortet er ute (liten pause før serveren svarer)
    weak var nett: WKWebView?
    private var modus = ""                     // «dra» | «snurr» | «fri» | ""
    private var a0 = 0.0, v0 = 0.0, snurrNr = -1
    private var sistMeld: TimeInterval = 0, sistKnirk: TimeInterval = 0, sistBrudd = -1
    private var fri: (fra: Double, lengde: Double, t0: TimeInterval, varighet: Double, nr: Int)? = nil
    private var friTimer: Timer?
    private let tikk = UISelectionFeedbackGenerator(), slag = UIImpactFeedbackGenerator(style: .medium), tung = UINotificationFeedbackGenerator()

    func sett(_ dict: [String: Any]) {
        let ny = RofData(dict)
        if let g = d, g.nr != ny.nr { drar = false; modus = ""; draT = 0; sp = 0; ute = false }
        // Ringen røk (hos noen andre): banner og buzz
        if ny.bruddNr > 0 && sistBrudd >= 0 && ny.bruddNr != sistBrudd { visRok(ny.bruddNavn + ny.drikkerOpp, ny.rok) }
        sistBrudd = ny.bruddNr
        d = ny
        oppdaterValgt(stille: true)
    }

    func visRok(_ tekst: String, _ tittel: String) {
        rok = tittel + "\n" + tekst; tung.notificationOccurred(.error)
        DispatchQueue.main.asyncAfter(deadline: .now() + 2.8) { [weak self] in self?.rok = nil }
    }

    func topp(_ tatt: Set<Int>) -> Int {
        var best = -1, bestA = 999.0
        for i in 0..<Rof.n where !tatt.contains(i) { let a = abs(Rof.norm(Double(i) * Rof.steg + vinkel)); if a < bestA { bestA = a; best = i } }
        return best
    }
    private func oppdaterValgt(stille: Bool = false) {
        guard let d = d else { return }
        let ny = topp(d.tatt)
        if ny != valgt { valgt = ny; if !stille { tikk.selectionChanged(); lyd("tikk") } }
    }
    private func laas() {
        guard let d = d else { return }
        let p = topp(d.tatt); if p >= 0 { vinkel += Rof.norm(-(Double(p) * Rof.steg + vinkel)) }
        valgt = p
    }

    // MARK: Fingeren (i 358 × 500-koordinater)
    func start(_ p: CGPoint) {
        guard let d = d, d.min, !d.ferdig else { return }
        if d.ringBrutt { friStart(); return }
        let n = Rof.naermest(p), v = topp(d.tatt)
        if v >= 0 && n.0 < 0.12 && n.1 < 34 {
            modus = "dra"; drar = true; draT = 0; sp = 0; vri = 0; holdt = Rof.punkt(0)
            slag.impactOccurred(); lyd("grip")
            meld(tving: true)
        } else {
            modus = "snurr"; a0 = vinkel; v0 = vinkelTil(p)
        }
    }
    func flytt(_ p: CGPoint) {
        guard let d = d else { return }
        if modus == "snurr" { vinkel = a0 + Rof.norm(vinkelTil(p) - v0); oppdaterValgt(); return }
        guard modus == "dra" else { return }
        let n = Rof.naermest(p), t = n.0, avstand = n.1, naa = Date().timeIntervalSince1970
        // Utenfor sporet bygger spenningen seg opp, innenfor slipper den sakte
        let over = max(0, avstand - d.halv) / d.halv
        sp = max(0, sp + over * 0.14 - 0.012)
        draT = max(draT, t)
        let sx = Rof.punkt(draT)
        holdt = sx; vri = max(-18, min(18, (p.x - sx.x) * 0.8))
        skjelv = sp > 0.6
        if over > 0 { tikk.selectionChanged(); if naa - sistKnirk > 0.24 { sistKnirk = naa; lyd("knirk") } }
        if sp >= 1 { trekk(brutt: true); return }
        if draT >= 0.97 { trekk(brutt: false); return }
        meld(tving: false)
    }
    func slipp() {
        guard let d = d else { return }
        if modus == "snurr" { modus = ""; laas(); return }
        guard modus == "dra" else { return }
        // Slapp taket før kortet var ute: kortet glir tilbake i ringen
        modus = ""; drar = false; skjelv = false; draT = 0; sp = 0; holdt = Rof.punkt(0)
        meld(tving: true)
        _ = d
    }
    private func vinkelTil(_ p: CGPoint) -> Double { atan2(p.y - Rof.cy, p.x - Rof.cx) * 180 / .pi }

    private func trekk(brutt: Bool) {
        guard let d = d, modus != "" else { return }
        let p = valgt
        modus = ""; skjelv = false; drar = false
        if brutt { tung.notificationOccurred(.error); lyd("knus"); visRok("", d.rok) } else { ute = true; slag.impactOccurred(); lyd("pop") }
        skjultNr = -1
        js("window.__mvRof && window.__mvRof.trekk(\(p), \(brutt), \(d.nr))")
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.4) { [weak self] in self?.draT = 0; self?.sp = 0; self?.holdt = Rof.punkt(0) }
    }

    /// Ringen er brutt: ett trykk, så snurrer ringen av seg selv, bremser og stopper på et kort
    private func friStart() {
        guard fri == nil, let d = d else { return }
        fri = (fra: vinkel, lengde: 720 + Double.random(in: 0...720), t0: Date().timeIntervalSince1970, varighet: 2.4 + Double.random(in: 0...0.6), nr: d.nr)
        modus = "fri"; lyd("grip")
        js("window.__mvRof && window.__mvRof.holder(0.01, 0, \(d.nr))")
        friTimer?.invalidate()
        friTimer = Timer.scheduledTimer(withTimeInterval: 1.0 / 60, repeats: true) { [weak self] _ in self?.friSteg() }
    }
    private func friSteg() {
        guard let f = fri, let d = d, d.nr == f.nr else { friTimer?.invalidate(); fri = nil; modus = ""; return }
        let x = min(1, (Date().timeIntervalSince1970 - f.t0) / f.varighet), e = 1 - pow(1 - x, 3)
        vinkel = f.fra + f.lengde * e
        oppdaterValgt()
        if x < 1 { return }
        friTimer?.invalidate(); fri = nil
        laas()
        let p = valgt
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.35) { [weak self] in
            guard let self = self, let d2 = self.d, d2.nr == f.nr, p >= 0 else { self?.modus = ""; return }
            self.modus = "fri"; self.valgt = p; self.trekk(brutt: false)
        }
    }

    private func meld(tving: Bool) {
        guard let d = d else { return }
        let naa = Date().timeIntervalSince1970
        if !tving && naa - sistMeld < 0.4 { return }
        sistMeld = naa
        js("window.__mvRof && window.__mvRof.holder(\(String(format: "%.2f", draT)), \(String(format: "%.2f", sp)), \(d.nr))")
    }
    func lukk() { guard let d = d else { return }; skjultNr = d.nr; ute = false; slag.impactOccurred(); js("window.__mvRof && window.__mvRof.lukk()") }
    func lyd(_ n: String) { js("window.__mvRof && window.__mvRof.lyd('\(n)')") }
    func trykk(_ g: String, _ attrs: [String: String] = [:]) {
        slag.impactOccurred()
        guard let data = try? JSONSerialization.data(withJSONObject: [g, attrs]), let json = String(data: data, encoding: .utf8) else { return }
        js("window.__mvLek && window.__mvLek.trykk.apply(null, \(json))")
    }
    private func js(_ s: String) { nett?.evaluateJavaScript(s, completionHandler: nil) }
}

struct RingSkjerm: View {
    @ObservedObject var m: RofModell
    @Environment(\.colorScheme) private var modus
    private var papir: Color { modus == .dark ? Color(red: 0.11, green: 0.106, blue: 0.122) : Color(red: 1, green: 0.973, blue: 0.933) }
    private var kort: Color { modus == .dark ? Color.white.opacity(0.07) : .white }
    private var blekk: Color { modus == .dark ? Color(red: 1, green: 0.973, blue: 0.933) : Color(red: 0.086, green: 0.071, blue: 0.059) }
    private let gul = Color(hex: "#FFD23F"), oransje = Color(hex: "#FF5B1F"), rosa = Color(hex: "#FF9CC2"), mint = Color(hex: "#63E2A8"), morkBlekk = Color(red: 0.086, green: 0.071, blue: 0.059)

    var body: some View {
        ZStack {
            papir.ignoresSafeArea()
            if let d = m.d {
                VStack(spacing: 6) {
                    topp(d)
                    GeometryReader { g in
                        let skala = min(g.size.width / 358, g.size.height / 500)
                        let w = 358 * skala, h = 500 * skala
                        ZStack(alignment: .top) {
                            ringen(d, skala: skala)
                                .frame(width: w, height: h)
                                .offset(x: m.skjelv ? CGFloat.random(in: -2...2) : 0, y: m.skjelv ? CGFloat.random(in: -1...1) : 0)
                                .gesture(DragGesture(minimumDistance: 0, coordinateSpace: .local)
                                    .onChanged { v in
                                        let p = CGPoint(x: v.location.x / skala, y: v.location.y / skala)
                                        if v.translation == .zero && !m.drar { m.start(p) } else { m.flytt(p) }
                                    }
                                    .onEnded { _ in m.slipp() })
                            if let k = d.kort, m.skjultNr != d.nr, d.holderT <= 0 {
                                kortet(d, k).frame(width: w * 0.86).padding(.top, h * 0.06)
                            }
                            if let r = m.rok {
                                Text(r).font(.archivo(20, vekt: 900)).multilineTextAlignment(.center).foregroundColor(.white)
                                    .padding(18).background(RoundedRectangle(cornerRadius: 16).fill(morkBlekk)).padding(.top, h * 0.3).transition(.scale.combined(with: .opacity))
                            }
                        }
                        .frame(width: g.size.width, height: g.size.height)
                    }
                    Text(d.hint).font(.archivo(13, vekt: 500)).opacity(0.75).multilineTextAlignment(.center).padding(.horizontal, 16).fixedSize(horizontal: false, vertical: true)
                    makker(d)
                }
                .padding(.bottom, 10)
            }
        }
        .foregroundColor(blekk)
        .animation(.easeOut(duration: 0.2), value: m.rok)
    }

    private func topp(_ d: RofData) -> some View {
        HStack(spacing: 8) {
            VStack(alignment: .leading, spacing: 1) {
                Text("Ring of Fire").font(.archivo(12, vekt: 700)).opacity(0.65)
                Text(d.tur).font(.archivo(16, vekt: 900)).foregroundColor(d.min ? Color(hex: "#C63C11") : blekk)
            }
            Spacer()
            Text(d.igjenTekst).font(.archivo(12, vekt: 800)).padding(.horizontal, 9).padding(.vertical, 5).background(Capsule().fill(kort)).overlay(Capsule().stroke(blekk.opacity(0.3), lineWidth: 1.5))
            Text(d.kongerTekst).font(.archivo(12, vekt: 800)).padding(.horizontal, 9).padding(.vertical, 5).background(Capsule().fill(rosa)).foregroundColor(morkBlekk)
            liten(d.stua, "sofa.fill") { m.trykk("stua-ark") }
            liten(d.mer, "ellipsis") { m.trykk("mer-ark") }
        }.padding(.horizontal, 14).padding(.top, 4)
    }
    private func liten(_ t: String, _ sym: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: 4) { Image(systemName: sym).font(.system(size: 12, weight: .bold)); Text(t).font(.archivo(12, vekt: 800)) }
                .padding(.horizontal, 9).frame(height: 30).background(Capsule().fill(kort)).overlay(Capsule().stroke(blekk, lineWidth: 1.5))
        }.buttonStyle(.plain)
    }

    /// Selve ringen: tegnes i 358 × 500 og skaleres
    private func ringen(_ d: RofData, skala: CGFloat) -> some View {
        Canvas { ctx, size in
            ctx.scaleBy(x: skala, y: skala)
            let ink = modus == .dark ? Color(red: 1, green: 0.973, blue: 0.933) : Color(red: 0.086, green: 0.071, blue: 0.059)
            let visSpor = (d.min || d.holderT > 0) && !d.ringBrutt
            let spen = m.drar ? m.sp : d.holderSp
            // Sporet ut av ringen
            if visSpor {
                var bane = Path(); bane.move(to: Rof.punkt(0)); bane.addCurve(to: CGPoint(x: 179, y: 50), control1: CGPoint(x: 212, y: 150), control2: CGPoint(x: 146, y: 110))
                ctx.stroke(bane, with: .color(Rof.farge(spen).opacity(0.35)), style: StrokeStyle(lineWidth: min(80, d.halv * 2), lineCap: .round))
                ctx.stroke(bane, with: .color(ink.opacity(0.45)), style: StrokeStyle(lineWidth: 2, dash: [4, 6]))
            }
            if d.min && !d.ringBrutt {
                let slot = Path(roundedRect: CGRect(x: 153, y: 22, width: 52, height: 34), cornerRadius: 4)
                ctx.stroke(slot, with: .color(ink), style: StrokeStyle(lineWidth: 2, dash: [5, 4]))
                ctx.draw(Text(d.slot).font(.archivo(10, vekt: 900)).foregroundColor(ink), at: CGPoint(x: 179, y: 40))
            }
            // Kortene i ringen
            for i in 0..<Rof.n where !d.tatt.contains(i) {
                let valgt = i == m.valgt && (d.min || d.holderT > 0)
                var k = ctx
                k.translateBy(x: Rof.cx, y: Rof.cy); k.rotate(by: .degrees(Double(i) * Rof.steg + m.vinkel)); k.translateBy(x: -Rof.cx, y: -Rof.cy)
                let rect = CGRect(x: 168, y: valgt ? 175 : 183, width: 22, height: 34)
                let synlig = !(valgt && (m.drar || d.holderT > 0))
                if synlig {
                    k.fill(Path(roundedRect: rect, cornerRadius: 3), with: .color(valgt ? Color(hex: "#FFD23F") : Color(hex: "#FFF8EE")))
                    k.stroke(Path(roundedRect: rect, cornerRadius: 3), with: .color(ink), lineWidth: valgt ? 2.5 : 1.5)
                }
            }
            if d.ringBrutt && d.bruddPlass >= 0 {
                var k = ctx
                k.translateBy(x: Rof.cx, y: Rof.cy); k.rotate(by: .degrees(Double(d.bruddPlass) * Rof.steg)); k.translateBy(x: -Rof.cx, y: -Rof.cy)
                k.draw(Text("💥").font(.system(size: 22)), at: CGPoint(x: 179, y: 180))
            }
            // Koppen i midten, fylt med konger
            var kopp = Path(); kopp.move(to: CGPoint(x: 155, y: 280)); kopp.addLine(to: CGPoint(x: 203, y: 280)); kopp.addLine(to: CGPoint(x: 197, y: 352)); kopp.addLine(to: CGPoint(x: 161, y: 352)); kopp.closeSubpath()
            ctx.fill(kopp, with: .color(Color(hex: "#FFF8EE")))
            let fyll = CGRect(x: 160, y: 354 - CGFloat(min(4, d.konger)) * 17, width: 38, height: CGFloat(min(4, d.konger)) * 17)
            if d.konger > 0 { ctx.fill(Path(fyll), with: .color(Color(hex: "#FF5B1F"))) }
            ctx.stroke(kopp, with: .color(ink), lineWidth: 3)
            ctx.draw(Text(d.kortI).font(.archivo(12, vekt: 700)).foregroundColor(ink.opacity(0.7)), at: CGPoint(x: 179, y: 396))
            // Kortet på vei ut (mitt eller noen andres)
            let hp: CGPoint? = m.drar ? m.holdt : (d.holderT > 0 ? Rof.punkt(d.holderT) : nil)
            if let p = hp {
                var k = ctx
                k.translateBy(x: p.x, y: p.y); k.rotate(by: .degrees(m.drar ? m.vri : 0)); k.translateBy(x: -p.x, y: -p.y)
                let rect = CGRect(x: p.x - 14, y: p.y - 22, width: 28, height: 44)
                k.fill(Path(roundedRect: rect, cornerRadius: 4), with: .color(Color(hex: "#FFD23F")))
                k.stroke(Path(roundedRect: rect, cornerRadius: 4), with: .color(ink), lineWidth: 2.5)
            }
            // Spenningsmåleren nederst
            let navn = d.holderT > 0 && !m.drar ? d.holderNavn.uppercased() : d.spenning
            ctx.draw(Text(navn).font(.archivo(11, vekt: 900)).foregroundColor(ink), in: CGRect(x: 14, y: 471, width: 84, height: 16))
            ctx.fill(Path(roundedRect: CGRect(x: 100, y: 470, width: 244, height: 16), cornerRadius: 8), with: .color(ink.opacity(0.12)))
            let bredde = 244 * min(1, spen)
            if bredde > 0 { ctx.fill(Path(roundedRect: CGRect(x: 100, y: 470, width: bredde, height: 16), cornerRadius: 8), with: .color(Rof.farge(spen))) }
            ctx.stroke(Path(roundedRect: CGRect(x: 100, y: 470, width: 244, height: 16), cornerRadius: 8), with: .color(ink), lineWidth: 2)
        }
    }

    /// Kortet som ble trukket: verdi, regel, tekst og «Greit»
    private func kortet(_ d: RofData, _ k: [String: Any]) -> some View {
        let rod = k["rod"] as? Bool ?? false
        return VStack(spacing: 8) {
            Text(k["trakk"] as? String ?? "").font(.archivo(12, vekt: 800)).opacity(0.7)
            VStack(spacing: 6) {
                HStack { Text("\(k["v"] as? String ?? "")\(k["s"] as? String ?? "")").font(.archivo(18, vekt: 900)).foregroundColor(rod ? Color(hex: "#E2363B") : morkBlekk); Spacer() }
                Text(k["regel"] as? String ?? "").font(.archivo(26, vekt: 900)).multilineTextAlignment(.center).foregroundColor(morkBlekk)
                Text(k["tekst"] as? String ?? "").font(.archivo(14, vekt: 500)).multilineTextAlignment(.center).foregroundColor(morkBlekk).opacity(0.85)
                HStack { Spacer(); Text("\(k["v"] as? String ?? "")\(k["s"] as? String ?? "")").font(.archivo(18, vekt: 900)).rotationEffect(.degrees(180)).foregroundColor(rod ? Color(hex: "#E2363B") : morkBlekk) }
            }
            .padding(16).background(RoundedRectangle(cornerRadius: 16).fill(.white)).overlay(RoundedRectangle(cornerRadius: 16).stroke(morkBlekk, lineWidth: 3))
            .background(RoundedRectangle(cornerRadius: 16).fill(morkBlekk).offset(x: 5, y: 5))
            Button(action: m.lukk) {
                Text(d.greit.uppercased()).font(.archivo(16, vekt: 900)).frame(maxWidth: .infinity).frame(height: 50).foregroundColor(morkBlekk)
                    .background(ZStack { RoundedRectangle(cornerRadius: 12).fill(morkBlekk).offset(x: 3, y: 3); RoundedRectangle(cornerRadius: 12).fill(gul); RoundedRectangle(cornerRadius: 12).stroke(morkBlekk, lineWidth: 2.5) })
            }.buttonStyle(.plain)
            if !d.neste.isEmpty { Text(d.neste).font(.archivo(13, vekt: 700)).opacity(0.75) }
        }
        .padding(12).background(RoundedRectangle(cornerRadius: 18).fill(papir.opacity(0.96)))
        .transition(.scale(scale: 0.9).combined(with: .opacity))
    }

    @ViewBuilder private func makker(_ d: RofData) -> some View {
        if let mk = d.makker {
            VStack(spacing: 6) {
                Text(mk["tittel"] as? String ?? "").font(.archivo(13, vekt: 800))
                let valg = mk["valg"] as? [[String: Any]] ?? []
                if !valg.isEmpty {
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 8) {
                            ForEach(Array(valg.enumerated()), id: \.offset) { _, p in
                                Button(action: { m.trykk("rof-makker", ["paa": p["id"] as? String ?? ""]) }) {
                                    Text(p["navn"] as? String ?? "").font(.archivo(14, vekt: 800)).padding(.horizontal, 12).frame(height: 36)
                                        .background(Capsule().fill(gul)).overlay(Capsule().stroke(morkBlekk, lineWidth: 2)).foregroundColor(morkBlekk)
                                }.buttonStyle(.plain)
                            }
                        }.padding(.horizontal, 16)
                    }
                }
            }
        }
        if !d.makkere.isEmpty { Text(d.makkere).font(.archivo(12, vekt: 600)).opacity(0.7).padding(.horizontal, 16) }
    }
}
