import SwiftUI
import UIKit
import WebKit
import QuartzCore

/// Skålsprinten som native skjerm: hele flaten er knappen, glasset bobler mens dere venter, og i SKÅL-øyeblikket
/// (regnet ut fra servertiden) blir flaten gul og glass nummer to klinker inn.
/// Fase 3: skjermen leser rommet selv (RomKlient) og sender trykket selv, med reaksjonstiden målt her.
/// Nettsiden gir bare plassen i rommet, figurene og «Hva nå?»-knappene til slutt (de hører til rommet, ikke leken).
struct SkHode: Identifiable { let id: String; let navn: String; let png: String }
struct SkRad: Identifiable { let id: String; let navn: String; let png: String; let tekst: String; let bredde: Double; let kl: String; let stripe: Bool; let oi: Bool }
struct SkMitt { let tidlig: Bool, tekst: String }
struct SkVent { let tekst: String, skal: String, mitt: SkMitt?, hint: String, folk: [SkHode], status: String }

struct SkData {
    var fase = "", tid: Double = 0, nr = 0, antall = 5, runde = 1
    var tittel = "", chip = "", gul = false, smaa = ""
    var vent: SkVent? = nil, tittelRes = "", rader: [SkRad] = [], neste = "", stua = "Stua", mer = "Mer"
    /// Servertiden da nettsiden laget skjermen (bare i reserven)
    var naa: Double = 0

    /// Reserven: skjermen slik eldre rom.js lager den (skData), brukt til rommet er hentet her
    init(_ d: [String: Any]) {
        func s(_ k: String) -> String { d[k] as? String ?? "" }
        func n(_ k: String) -> Double { (d[k] as? NSNumber)?.doubleValue ?? 0 }
        fase = s("fase"); tid = n("tid"); nr = Int(n("nr")); antall = max(1, Int(n("antall"))); naa = n("naa")
        tittel = s("tittel"); chip = s("chip"); gul = d["gul"] as? Bool ?? false; smaa = s("smaa")
        if let v = d["vent"] as? [String: Any] {
            var mitt: SkMitt? = nil
            if let m = v["mitt"] as? [String: Any] { mitt = SkMitt(tidlig: m["tidlig"] as? Bool ?? false, tekst: m["tekst"] as? String ?? "") }
            vent = SkVent(tekst: v["tekst"] as? String ?? "", skal: v["skal"] as? String ?? "", mitt: mitt, hint: v["hint"] as? String ?? "",
                          folk: (v["folk"] as? [[String: Any]] ?? []).map { h in SkHode(id: h["id"] as? String ?? "", navn: h["navn"] as? String ?? "", png: h["png"] as? String ?? "") },
                          status: v["status"] as? String ?? "")
        }
        tittelRes = s("tittelRes"); neste = s("neste")
        rader = (d["rader"] as? [[String: Any]] ?? []).map { r in
            SkRad(id: r["id"] as? String ?? "", navn: r["navn"] as? String ?? "", png: r["png"] as? String ?? "", tekst: r["tekst"] as? String ?? "",
                  bredde: (r["bredde"] as? NSNumber)?.doubleValue ?? 100, kl: r["kl"] as? String ?? "", stripe: r["stripe"] as? Bool ?? false, oi: r["oi"] as? Bool ?? false)
        }
        if !s("stua").isEmpty { stua = s("stua") }
        if !s("mer").isEmpty { mer = s("mer") }
    }

    /// Skjermen bygd rett fra rommet: `spill` er serverens visning av Skålsprinten (sosVisning i rom.ts)
    init(rom t: RomTilstand, hoder: [String: [String: String]], mitt lokal: (tid: Double, tidlig: Bool, ms: Int?)?) {
        let s = t.spill ?? .null
        let en = t.lang == "en"
        func T(_ no: String, _ eng: String) -> String { en ? eng : no }
        func ider(_ v: JSONVerdi?) -> [String] { (v?.liste ?? []).compactMap(\.tekst) }
        let meg = t.meg ?? ""
        func navn(_ id: String) -> String { id == meg ? T("Du", "You") : (t.spiller(id)?.navn ?? "?") }
        func png(_ id: String, _ oi: Bool = false) -> String { let h = hoder[id] ?? [:]; return (oi ? h["oi"] : nil) ?? h["n"] ?? "" }

        fase = s["fase"]?.tekst ?? ""
        tid = s["tid"]?.tall ?? 0
        nr = Int(s["nr"]?.tall ?? 0)
        antall = max(1, Int(s["antall"]?.tall ?? 5))
        runde = Int(s["runde"]?.tall ?? 1)
        tittel = T("Skålsprinten", "Cheers sprint")
        chip = fase == "vent" ? T("Hold fingeren klar", "Finger ready") : fase == "fasit" ? T("Treigest drikker", "Slowest drinks") : T("Raskest i stua", "Fastest in the room")
        gul = fase != "fasit"
        smaa = T("Skål ", "Cheers ") + "\(min(antall, nr + 1))" + T(" av ", " of ") + "\(antall)"
        stua = T("Stua", "Lounge"); mer = T("Mer", "More")

        func rad(_ id: String, _ tekst: String, _ bredde: Double, kl: String = "", stripe: Bool = false, oi: Bool = false) -> SkRad {
            SkRad(id: id, navn: navn(id), png: png(id, oi), tekst: tekst, bredde: bredde, kl: kl, stripe: stripe, oi: oi)
        }

        if fase == "vent" {
            let har = ider(s["harTrykket"])
            var mitt: SkMitt? = nil
            if let l = lokal, l.tid == tid {
                mitt = SkMitt(tidlig: l.tidlig, tekst: l.tidlig ? T("Drikk 2", "Drink 2") : l.ms.map { "\($0) ms" } ?? "…")
            } else if har.contains(meg) {
                let tidlig = ider(s["tidlig"]).contains(meg)
                let ms = s["trykk"]?[meg]?.tall.map { Int($0) }
                mitt = SkMitt(tidlig: tidlig, tekst: tidlig ? T("Drikk 2", "Drink 2") : ms.map { "\($0) ms" } ?? "")
            }
            vent = SkVent(tekst: T("Vent …", "Wait …"), skal: T("Skål!", "Cheers!"), mitt: mitt,
                          hint: nr > 0 ? T("Neste skål kommer når du minst venter det.", "The next cheers comes when you least expect it.") : T("Trykk hvor som helst når det står SKÅL.", "Tap anywhere when it says CHEERS."),
                          folk: har.map { SkHode(id: $0, navn: navn($0), png: png($0)) },
                          status: "\(har.count)" + T(" av ", " of ") + "\(t.spillere.count)" + T(" har trykket", " have tapped"))
        } else if fase == "fasit", let res = s["resultat"], res != .null {
            let tider: [(String, Double)] = (res["tider"]?.liste ?? []).compactMap { x in
                guard let id = x[0]?.tekst, let ms = x[1]?.tall else { return nil }
                return (id, ms)
            }
            let maks = max(1, tider.map { $0.1 }.max() ?? 1)
            let treigest = res["treigest"]?.tekst
            let raskest = res["raskest"]?.tekst
            if let tr = treigest { tittelRes = navn(tr) + (tr == meg ? T(" var treigest", " were slowest") : T(" var treigest", " was slowest")) }
            else { tittelRes = T("Ingen treigest", "No slowest") }
            let raske: [SkRad] = tider.map { x in
                let sist = x.0 == treigest
                return rad(x.0, "\(Int(x.1)) ms", (100 * x.1 / maks).rounded(), kl: sist ? "feil" : x.0 == raskest ? "rett" : "", oi: sist)
            }
            let tidlige: [SkRad] = ider(res["tidlig"]).map { rad($0, T("For tidlig", "Too early"), 100, kl: "feil", stripe: true, oi: true) }
            let ikke: [SkRad] = ider(res["ikke"]).map { rad($0, T("Trykket ikke", "No tap"), 100, kl: "feil", stripe: true, oi: true) }
            rader = raske + tidlige + ikke
            neste = nr + 1 >= antall ? T("Siste skål er tatt …", "That was the last cheers …") : T("Neste skål kommer av seg selv.", "The next cheers comes by itself.")
        } else if fase == "ferdig" {
            let sum: [String: Double] = (s["sum"]?.objekt ?? [:]).compactMapValues(\.tall)
            let rekke = sum.keys.sorted { (sum[$0] ?? 0, $0) < (sum[$1] ?? 0, $1) }
            let mx = max(1, sum.values.max() ?? 1)
            if let f = rekke.first { tittelRes = navn(f) + (f == meg ? T(" er raskest", " are fastest") : T(" er raskest", " is fastest")) }
            rader = rekke.enumerated().map { j, id in
                let v = sum[id] ?? 0
                return rad(id, String(format: "%.2f s", v / 1000), (100 * v / mx).rounded(), kl: j == 0 ? "rett" : "")
            }
            neste = T("Samlet tid for fem skåler.", "Total time for five cheers.")
        }
    }
}

@MainActor
@Observable
final class SkModell: HarFigurer {
    var d: SkData? = nil
    /// SKÅL er kommet for denne skålen (tid)
    var naa: Double = 0
    /// Trykket her (før serveren har svart): hvilken skål, for tidlig eller ikke, og reaksjonstiden
    var trykket: (tid: Double, tidlig: Bool, ms: Int?)? = nil
    let blokker = KortModell()
    private var rom: RomKlient { RomKlient.delt }
    @ObservationIgnored private var hoder: [String: [String: String]] = [:]
    @ObservationIgnored private(set) var avvik: Double = 0
    @ObservationIgnored private var avvikFra: Double = 0
    @ObservationIgnored private var timer: Timer?
    /// Da SKÅL kom på skjermen (CACurrentMediaTime) – reaksjonstiden måles fra dette
    @ObservationIgnored private var vist: CFTimeInterval? = nil
    @ObservationIgnored weak var nett: WKWebView? { didSet { blokker.nett = nett } }

    /// Det nettsiden sendte sist – reserven til rommet er hentet (eller hvis plassen ikke finnes)
    @ObservationIgnored private var sist: [String: Any] = [:]
    @ObservationIgnored private var henterPlass = false
    /// Klienten følger rommet for denne leken (ikke en gammel plass fra et tidligere rom)
    @ObservationIgnored private var koblet = false

    /// Fra nettsiden. Nyere rom.js sender plassen i rommet (`rom`: {kode, id, pollett, lang}) og alle figurene
    /// (`hoder`: {id: {n, oi}}). Eldre rom.js sender bare den ferdige skjermen: da hentes plassen fra nettsidens
    /// localStorage, og figurene plukkes fra skjermdataene. «Hva nå?» til slutt (`slutt`) kommer fra begge.
    func sett(_ dict: [String: Any]) {
        sist = dict
        if let h = dict["hoder"] as? [String: [String: String]] { hoder.merge(h) { _, ny in ny } } else { plukkHoder(dict) }
        blokker.sett(["blokker": dict["slutt"] as? [[String: Any]] ?? [], "naa": 0])
        if let r = dict["rom"] as? [String: Any], let k = r["kode"] as? String, let id = r["id"] as? String, let p = r["pollett"] as? String {
            koble(k, RomKlient.Meg(id: id, pollett: p), r["lang"] as? String ?? "no")
        } else if !koblet {
            hentPlass()
        }
        bygg()
    }

    /// Leken er over på denne telefonen: slutt å spørre (nettsiden har rommet videre)
    func slipp() {
        timer?.invalidate(); timer = nil
        koblet = false
        rom.endret = nil
        rom.stopp()
        d = nil; naa = 0; trykket = nil; vist = nil; sist = [:]
    }

    private func koble(_ kode: String, _ meg: RomKlient.Meg, _ lang: String) {
        koblet = true
        rom.endret = { [weak self] _ in MainActor.assumeIsolated { self?.bygg() } }
        rom.bruk(kode: kode, meg: meg, lang: lang)
    }

    /// Eldre rom.js: plassen ligger i nettsidens localStorage (bd_rom_KODE), rommet i adressen (?k=) eller bd_sist_rom
    private func hentPlass() {
        guard !henterPlass, let w = nett else { return }
        henterPlass = true
        let js = """
        var k = new URLSearchParams(location.search).get('k') || '';
        try { if (!k) k = (JSON.parse(localStorage.getItem('bd_sist_rom') || '{}') || {}).k || ''; } catch (e) {}
        var m = null; try { m = JSON.parse(localStorage.getItem('bd_rom_' + k) || 'null'); } catch (e) {}
        return m && m.id && m.pollett && k ? { kode: k, id: m.id, pollett: m.pollett, lang: /^en/.test(document.documentElement.lang || '') ? 'en' : 'no' } : null;
        """
        w.callAsyncJavaScript(js, arguments: [:], in: nil, in: .page) { [weak self] res in
            MainActor.assumeIsolated {
                guard let self else { return }
                self.henterPlass = false
                if case .success(let v) = res, let r = v as? [String: Any], let k = r["kode"] as? String, let id = r["id"] as? String, let p = r["pollett"] as? String {
                    SjekkLogg.skriv("skal: plassen fra localStorage (\(k))")
                    self.koble(k, RomKlient.Meg(id: id, pollett: p), r["lang"] as? String ?? "no")
                } else {
                    SjekkLogg.skriv("skal: fant ikke plassen – nettsiden tegner skjermen")
                }
            }
        }
    }

    /// Eldre rom.js: figurene som står i skjermdataene (de som har trykket, og radene i lista)
    private func plukkHoder(_ dict: [String: Any]) {
        let folk = ((dict["vent"] as? [String: Any])?["folk"] as? [[String: Any]]) ?? []
        for h in folk { if let id = h["id"] as? String, let png = h["png"] as? String, !png.isEmpty { hoder[id, default: [:]]["n"] = png } }
        for r in dict["rader"] as? [[String: Any]] ?? [] {
            if let id = r["id"] as? String, let png = r["png"] as? String, !png.isEmpty { hoder[id, default: [:]][(r["oi"] as? Bool ?? false) ? "oi" : "n"] = png }
        }
    }

    /// Rommet fra RomKlient når det er hentet og viser Skålsprinten – ellers skjermen nettsiden sendte
    private func bygg() {
        let ny: SkData
        if koblet, let t = rom.tilstand, t.spill?["type"]?.tekst == "skal", rom.meg != nil {
            // Bare et nytt svar sier noe om klokka: et gammelt svar bygd på nytt ville flyttet SKÅL-øyeblikket
            if t.naa > 0 && t.naa != avvikFra { avvikFra = t.naa; avvik = t.naa - Date().timeIntervalSince1970 * 1000 }
            ny = SkData(rom: t, hoder: hoder, mitt: trykket)
        } else if !sist.isEmpty {
            ny = SkData(sist)
            if ny.naa > 0 { avvik = ny.naa - Date().timeIntervalSince1970 * 1000 }
        } else { return }
        planlegg(ny)
        withAnimation(.spring(response: 0.4, dampingFraction: 0.8)) { d = ny }
    }

    /// SKÅL vises når servertiden passerer `tid`
    private func planlegg(_ ny: SkData) {
        guard ny.fase == "vent", ny.tid > 0 else { timer?.invalidate(); timer = nil; naa = 0; vist = nil; return }
        if naa == ny.tid || (timer != nil && d?.tid == ny.tid) { return }
        if let t = trykket, t.tid != ny.tid { trykket = nil }
        vist = nil
        let om = (ny.tid - (Date().timeIntervalSince1970 * 1000 + avvik)) / 1000
        timer?.invalidate()
        if om <= 0 { naa = ny.tid; vist = CACurrentMediaTime(); return }
        timer = Timer.scheduledTimer(withTimeInterval: om, repeats: false) { [weak self] _ in
            MainActor.assumeIsolated {
                guard let self else { return }
                self.timer = nil
                self.vist = CACurrentMediaTime()
                self.naa = ny.tid
                Haptikk.melding(.success)
            }
        }
    }

    func trykk(_ g: String, _ attrs: [String: String] = [:]) {
        Haptikk.trykk()
        guard let data = try? JSONSerialization.data(withJSONObject: [g, attrs]), let json = String(data: data, encoding: .utf8) else { return }
        nett?.evaluateJavaScript("window.__mvLek && window.__mvLek.trykk.apply(null, \(json))", completionHandler: nil)
    }

    /// Skål-trykket: reaksjonstiden måles her (fra SKÅL kom på skjermen) og sendes rett til rommet
    func skaal() {
        guard let d = d, d.fase == "vent", d.vent?.mitt == nil, trykket == nil else { return }
        let tidlig = naa != d.tid || vist == nil
        let ms: Int? = tidlig ? nil : vist.map { Int(((CACurrentMediaTime() - $0) * 1000).rounded()) }
        trykket = (d.tid, tidlig, ms)
        Haptikk.trykk(tidlig ? .rigid : .heavy)
        guard koblet, rom.meg != nil else {
            // Fant ikke plassen i rommet: nettsiden måler og sender trykket, som før
            guard let data = try? JSONSerialization.data(withJSONObject: ["sk-trykk", [:]]), let json = String(data: data, encoding: .utf8) else { return }
            nett?.evaluateJavaScript("window.__mvLek && window.__mvLek.trykk.apply(null, \(json))", completionHandler: nil)
            return
        }
        bygg()
        let tid = d.tid
        let handling: [String: Any] = ["handling": "sk-trykk", "tidlig": tidlig, "ms": ms.map { $0 as Any } ?? NSNull()]
        SjekkLogg.skriv("skal: trykk sendt fra Swift – " + (tidlig ? "for tidlig" : "\(ms ?? 0) ms"))
        Task {
            do { _ = try await rom.gjor(handling) }
            catch {
                // Kom ikke fram: flaten blir klar igjen, så du kan trykke på nytt
                SjekkLogg.skriv("skal: trykket kom ikke fram – \(error)")
                if trykket?.tid == tid { trykket = nil; bygg() }
            }
        }
    }
}

struct SkalSkjerm: View {
    var m: SkModell
    @Environment(\.accessibilityReduceMotion) private var roligere
    private let rust = Color(red: 0.722, green: 0.22, blue: 0.039)
    private let ol = Color(red: 1, green: 0.72, blue: 0.2)

    var body: some View {
        ZStack {
            papir.ignoresSafeArea()
            if let d = m.d {
                VStack(spacing: 0) {
                    topp(d)
                    if let v = d.vent { flate(d, v) }
                    else {
                        ScrollView(showsIndicators: false) {
                            VStack(alignment: .leading, spacing: 12) { liste(d) }
                                .padding(.horizontal, 16).padding(.top, 4).padding(.bottom, 24)
                        }
                    }
                }
            }
        }
        .foregroundColor(blekk)
    }

    private func topp(_ d: SkData) -> some View {
        HStack(spacing: 8) {
            VStack(alignment: .leading, spacing: 3) {
                Text(d.tittel).font(.archivo(12, vekt: 700)).opacity(0.65).lineLimit(1)
                Text(d.chip).font(.archivo(16, vekt: 900)).foregroundColor(d.gul ? rust : blekk).lineLimit(1)
                HStack(spacing: 3) {
                    ForEach(0..<d.antall, id: \.self) { i in
                        let full = d.fase == "ferdig" || i < d.nr, naa = i == d.nr && d.fase != "ferdig"
                        GlassForm().fill(full ? ol : Color.clear).overlay(GlassForm().stroke(blekk, lineWidth: 1.5)).frame(width: 10, height: 14).opacity(full || naa ? 1 : 0.45)
                    }
                }.accessibilityLabel(d.smaa)
            }
            Spacer()
            liten(d.stua, "sofa.fill") { m.trykk("stua-ark") }
            liten(d.mer, "ellipsis") { m.trykk("mer-ark") }
        }
        .padding(.horizontal, 16).padding(.top, 6).padding(.bottom, 8)
    }
    private func hode(_ png: String, _ px: CGFloat) -> some View { Figur(png, px) }

    // MARK: Flaten – vent (bobler), SKÅL (gul, to glass), trykket (tiden din), for tidlig (veltet, rosa)
    private func flate(_ d: SkData, _ v: SkVent) -> some View {
        let skal = m.naa == d.tid && d.tid > 0
        let mitt: SkMitt? = v.mitt ?? (m.trykket.map { t in SkMitt(tidlig: t.tidlig, tekst: t.tidlig ? "" : "…") })
        let tidlig = mitt?.tidlig ?? false
        let bakgrunn: Color = tidlig ? rosa : skal || (mitt != nil) ? gul : kortFarge
        return Button(action: { m.skaal() }) {
            VStack(spacing: 10) {
                Spacer(minLength: 0)
                ZStack {
                    if tidlig {
                        Glass(bobler: false, skum: true).frame(width: 120, height: 168).rotationEffect(.degrees(78), anchor: .bottom).offset(x: 30, y: 10)
                        Ellipse().fill(ol.opacity(0.8)).frame(width: 150, height: 26).offset(x: 70, y: 80)
                    } else {
                        Glass(bobler: !skal, skum: true).frame(width: 150, height: 210).offset(x: skal ? -34 : 0).rotationEffect(.degrees(skal ? -8 : 0), anchor: .bottom)
                        if skal {
                            Glass(bobler: false, skum: true).frame(width: 120, height: 168).offset(x: 54, y: 20).rotationEffect(.degrees(10), anchor: .bottom)
                                .transition(.move(edge: .trailing).combined(with: .opacity))
                        }
                    }
                }
                .frame(height: 240)
                .animation(roligere ? nil : .spring(response: 0.35, dampingFraction: 0.6), value: skal)
                Text(tidlig ? v.skal : skal ? v.skal.uppercased() : v.tekst).font(.archivo(skal && !tidlig ? 64 : 34, vekt: 900)).foregroundColor(morkBlekk).lineLimit(1).minimumScaleFactor(0.5)
                if let mt = mitt { Text(mt.tekst).font(.archivo(26, vekt: 900)).foregroundColor(tidlig ? rust : morkBlekk).transition(.scale(scale: 0.7).combined(with: .opacity)) }
                Text(v.hint).font(.archivo(13, vekt: 700)).foregroundColor(morkBlekk).opacity(0.7).multilineTextAlignment(.center).padding(.horizontal, 24)
                Spacer(minLength: 0)
                HStack(spacing: 6) {
                    Hodestabel(antall: v.folk.count, maks: 6, storrelse: 30, avstand: -8) { i in hode(v.folk[i].png, 30) }
                    Text(v.status).font(.archivo(12, vekt: 800)).foregroundColor(morkBlekk).opacity(0.8)
                }.padding(.bottom, 14)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(RoundedRectangle(cornerRadius: 22).fill(bakgrunn))
            .overlay(RoundedRectangle(cornerRadius: 22).stroke(morkBlekk, lineWidth: 3))
            .background(RoundedRectangle(cornerRadius: 22).fill(morkBlekk).offset(x: 5, y: 5))
            .padding(.horizontal, 16).padding(.bottom, 20)
        }
        .buttonStyle(.plain)
        // ikke .disabled: SwiftUI gråner hele flaten – skaal() avviser selv trykk nummer to
        .accessibilityLabel(skal ? v.skal : v.tekst)
    }

    // MARK: Lista – hoder med stolper for tiden, treigest i rosa; summen til slutt
    private func liste(_ d: SkData) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(d.tittelRes).font(.archivo(24, vekt: 900)).fixedSize(horizontal: false, vertical: true).padding(.top, 4)
                .transition(.move(edge: .leading).combined(with: .opacity))
            VStack(spacing: 6) {
                ForEach(Array(d.rader.enumerated()), id: \.element.id) { j, r in
                    HStack(spacing: 10) {
                        hode(r.png, 36)
                        Text(r.navn).font(.archivo(14, vekt: 900)).lineLimit(1).frame(width: 64, alignment: .leading)
                        GeometryReader { g in
                            ZStack(alignment: .leading) {
                                RoundedRectangle(cornerRadius: 5).fill(papir).overlay(RoundedRectangle(cornerRadius: 5).stroke(blekk.opacity(0.3), lineWidth: 1))
                                RoundedRectangle(cornerRadius: 5).fill(r.kl == "feil" ? rosa : r.kl == "rett" ? mint : ol)
                                    .frame(width: max(8, g.size.width * CGFloat(r.bredde) / 100))
                                    .opacity(r.stripe ? 0.5 : 1)
                                    .overlay(RoundedRectangle(cornerRadius: 5).stroke(blekk, lineWidth: 1.5).frame(width: max(8, g.size.width * CGFloat(r.bredde) / 100)), alignment: .leading)
                            }
                        }.frame(height: 18)
                        Text(r.tekst).font(.archivo(13, vekt: 900)).lineLimit(1).frame(width: 76, alignment: .trailing)
                    }
                    .padding(.horizontal, 10).padding(.vertical, 7)
                    .background(RoundedRectangle(cornerRadius: 12).fill(kortFarge)).overlay(RoundedRectangle(cornerRadius: 12).stroke(r.kl == "feil" ? rust : blekk.opacity(0.5), lineWidth: r.kl == "feil" ? 2.5 : 1.5))
                    .transition(.move(edge: .leading).combined(with: .opacity))
                    .animation(roligere ? nil : .spring(response: 0.4, dampingFraction: 0.8).delay(Double(j) * 0.09), value: d.nr)
                }
            }
            HStack(spacing: 8) {
                GlassForm().fill(ol).overlay(GlassForm().stroke(blekk, lineWidth: 1.5)).frame(width: 14, height: 20)
                Text(d.neste).font(.archivo(14, vekt: 700)).opacity(0.8)
            }.padding(.top, 4)
            BlokkListe(m: m.blokker).padding(.top, 6)
        }
    }
}

/// Et ølglass med skum og bobler, som nettsidens `.sk-glass`
struct Glass: View {
    let bobler: Bool, skum: Bool
    @State private var fase = false
    private let ol = Color(red: 1, green: 0.72, blue: 0.2)
    var body: some View {
        GeometryReader { g in
            let w = g.size.width, h = g.size.height
            ZStack {
                GlassForm().fill(lys)
                GlassForm().fill(ol).padding(.top, h * 0.2).padding(.horizontal, w * 0.05)
                if bobler {
                    ForEach(0..<3, id: \.self) { i in
                        Circle().fill(lys.opacity(0.9)).frame(width: 6 + CGFloat(i) * 2, height: 6 + CGFloat(i) * 2)
                            .position(x: w * [0.33, 0.53, 0.69][i], y: fase ? h * 0.3 : h * 0.86)
                            .opacity(fase ? 0 : 0.9)
                            .animation(.easeOut(duration: 1.8).repeatForever(autoreverses: false).delay(Double(i) * 0.6), value: fase)
                    }
                }
                if skum { Skum().fill(lys).frame(height: h * 0.2).overlay(Skum().stroke(morkBlekk, lineWidth: 3).frame(height: h * 0.2), alignment: .top).frame(maxHeight: .infinity, alignment: .top) }
                GlassForm().stroke(morkBlekk, lineWidth: 4)
            }
            .onAppear { fase = true }
        }
    }
}
/// Glasset: litt smalere nederst
struct GlassForm: Shape {
    func path(in r: CGRect) -> Path {
        var p = Path()
        p.move(to: CGPoint(x: r.minX + r.width * 0.06, y: r.minY + r.height * 0.04))
        p.addLine(to: CGPoint(x: r.maxX - r.width * 0.06, y: r.minY + r.height * 0.04))
        p.addLine(to: CGPoint(x: r.maxX - r.width * 0.16, y: r.maxY - r.height * 0.02))
        p.addLine(to: CGPoint(x: r.minX + r.width * 0.16, y: r.maxY - r.height * 0.02))
        p.closeSubpath()
        return p
    }
}
/// Skummet på toppen: tre bølger
struct Skum: Shape {
    func path(in r: CGRect) -> Path {
        var p = Path()
        let y = r.minY + r.height * 0.45, b = r.width / 3.3
        p.move(to: CGPoint(x: r.minX + r.width * 0.07, y: r.maxY))
        p.addLine(to: CGPoint(x: r.minX + r.width * 0.07, y: y))
        for i in 0..<3 {
            let x0 = r.minX + r.width * 0.07 + b * CGFloat(i)
            p.addQuadCurve(to: CGPoint(x: x0 + b, y: y), control: CGPoint(x: x0 + b / 2, y: r.minY))
        }
        p.addLine(to: CGPoint(x: r.maxX - r.width * 0.07, y: r.maxY))
        p.closeSubpath()
        return p
    }
}
