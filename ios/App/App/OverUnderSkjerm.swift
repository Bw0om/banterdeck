import SwiftUI
import UIKit
import WebKit

/// Over eller under som native skjerm: folket med hvem som har tur, bunken med kortet som snus inn, potten,
/// sjansestripa, svaret og OVER/UNDER-knappene.
/// Fase 3: skjermen leser rommet selv (LekKobling/RomKlient) og sender gjett og hopp rett til rommet. Nettsiden gir
/// plassen i rommet, figurene og «Hva nå?»-knappene til slutt. Med eldre rom.js brukes ouData som reserve.
struct OuFolk: Identifiable { let id: String; let navn: String; let png: String; let tur: Bool; let drukket: Int; let oi: Bool }
struct OuKort { let v: String, f: String, rod: Bool }
struct OuSvar { let riktig: Bool, tittel: String, tekst: String }

struct OuData {
    var runde = 1, n = 0, ferdig = false, jeg = false, vert = false, naa: Double = 0, tittel = "", chip = "", gul = false
    var folk: [OuFolk] = [], kort: OuKort? = nil, bunke = 1, pottTekst = "", lagFor = 0
    var over = 0, under = 0, andel = 0.5, overTekst = "", underTekst = "", svar: OuSvar? = nil
    var overKnapp = "", underKnapp = "", kan = false, svarerFor = "", hopp = "", vent = "", storst = ""
    var stua = "Stua", mer = "Mer"

    /// Reserven: skjermen slik eldre rom.js lager den (ouData)
    init(_ d: [String: Any]) {
        func s(_ k: String) -> String { d[k] as? String ?? "" }
        func b(_ k: String) -> Bool { d[k] as? Bool ?? false }
        func i(_ k: String) -> Int { (d[k] as? NSNumber)?.intValue ?? 0 }
        runde = i("runde"); n = i("n"); ferdig = b("ferdig"); jeg = b("jeg"); vert = b("vert"); naa = (d["naa"] as? NSNumber)?.doubleValue ?? 0
        tittel = s("tittel"); chip = s("chip"); gul = b("gul")
        folk = (d["folk"] as? [[String: Any]] ?? []).map { f in OuFolk(id: f["id"] as? String ?? "", navn: f["navn"] as? String ?? "", png: f["png"] as? String ?? "", tur: f["tur"] as? Bool ?? false, drukket: (f["drukket"] as? NSNumber)?.intValue ?? 0, oi: f["oi"] as? Bool ?? false) }
        if let k = d["kort"] as? [String: Any] { kort = OuKort(v: k["v"] as? String ?? "", f: k["f"] as? String ?? "", rod: k["rod"] as? Bool ?? false) }
        bunke = max(1, i("bunke")); pottTekst = s("pottTekst"); lagFor = i("lagFor")
        over = i("over"); under = i("under"); andel = (d["andel"] as? NSNumber)?.doubleValue ?? 0.5; overTekst = s("overTekst"); underTekst = s("underTekst")
        if let v = d["svar"] as? [String: Any] { svar = OuSvar(riktig: v["riktig"] as? Bool ?? false, tittel: v["tittel"] as? String ?? "", tekst: v["tekst"] as? String ?? "") }
        overKnapp = s("overKnapp"); underKnapp = s("underKnapp"); kan = b("kan"); svarerFor = s("svarerFor"); hopp = s("hopp"); vent = s("vent"); storst = s("storst")
        if !s("stua").isEmpty { stua = s("stua") }
        if !s("mer").isEmpty { mer = s("mer") }
    }

    /// Skjermen bygd rett fra rommet: `spill` er serverens visning av Over eller under (ekstraVisning i rom.ts)
    init(rom t: RomTilstand, hoder: [String: [String: String]]) {
        let s = t.spill ?? .null
        let en = t.lang == "en"
        func T(_ no: String, _ eng: String) -> String { en ? eng : no }
        let meg = t.meg ?? ""
        func navn(_ id: String) -> String { t.spiller(id)?.navn ?? "?" }
        func nv(_ id: String) -> String { id == meg ? T("Du", "You") : navn(id) }
        func tall(_ v: JSONVerdi?) -> Int { Int(v?.tall ?? 0) }

        let tur = s["tur"]?.tekst ?? ""
        ferdig = s["ferdig"]?.bool ?? false
        jeg = tur == meg
        vert = t.jegErVert
        runde = max(1, tall(s["runde"])); n = tall(s["n"]); naa = t.naa
        let si = s["sist"].flatMap { $0 == .null ? nil : $0 }
        let riktig = si?["riktig"]?.bool ?? false, hvem = si?["hvem"]?.tekst ?? "", siBunke = tall(si?["bunke"])
        let bom = si != nil && !riktig
        var ider = (s["ider"]?.liste ?? []).compactMap(\.tekst)
        if ider.isEmpty { ider = t.spillere.map(\.id) }

        tittel = T("Over eller under", "Higher or lower")
        chip = ferdig ? T("Stokken er tom", "Deck’s empty") : jeg ? T("Din tur", "Your turn") : navn(tur) + T(" gjetter", " is guessing")
        gul = jeg && !ferdig
        let drukket = s["drukket"]?.objekt ?? [:], tomt = ferdig
        folk = ider.map { id in
            let oi = bom && hvem == id
            return OuFolk(id: id, navn: nv(id), png: figurPng(hoder, id, oi: oi), tur: id == tur && !tomt, drukket: tall(drukket[id]), oi: oi)
        }
        if let ko = s["kort"], let v = ko["v"]?.tall, let f = ko["f"]?.tekst { kort = OuKort(v: kortVerdi(Int(v), en: en), f: f, rod: rodFarge(f)) }
        bunke = max(1, tall(s["bunke"])); pottTekst = T("I potten", "In the pot")
        lagFor = bom ? siBunke : 0
        over = tall(s["over"]); under = tall(s["under"])
        andel = over + under > 0 ? Double(over) / Double(over + under) : 0.5
        overTekst = "\(over)" + T(" høyere igjen", " higher left"); underTekst = "\(under)" + T(" lavere igjen", " lower left")
        if si != nil {
            svar = OuSvar(riktig: riktig, tittel: riktig ? T("Riktig!", "Right!") : nv(hvem) + T(" bommet", " missed"),
                          tekst: riktig ? T("Potten vokser.", "The pot grows.") : T("Drikker ", "Drinks ") + "\(siBunke)" + T(". Potten starter på nytt.", ". The pot starts over."))
        }
        overKnapp = T("Over", "Higher"); underKnapp = T("Under", "Lower")
        kan = !ferdig && (jeg || vert)
        svarerFor = !ferdig && !jeg && vert ? T("Svarer for ", "Answering for ") + navn(tur) : ""
        hopp = !ferdig && !jeg && vert ? T("Hopp over ", "Skip ") + navn(tur) : ""
        vent = !ferdig && !jeg && !vert ? navn(tur) + T(" svarer – rop det høyt, så kan ", " answers – shout it out and ") + navn(t.vert) + T(" trykke.", " can tap it.") : ""
        if ferdig, let st = s["storst"], let id = st["id"]?.tekst { storst = T("Største pott drukket: ", "Biggest pot drunk: ") + nv(id) + " – " + "\(tall(st["n"]))" }
        stua = T("Stua", "Lounge"); mer = T("Mer", "More")
    }
}

@MainActor
@Observable
final class OuModell: HarFigurer {
    var d: OuData? = nil
    let blokker = KortModell()
    private let kobling = LekKobling("ou")
    /// Det nettsiden sendte sist – reserven til rommet er hentet (eller hvis plassen ikke finnes)
    @ObservationIgnored private var sist: [String: Any] = [:]
    /// Et gjett er på vei: ett trykk gir ett gjett
    @ObservationIgnored private var sender = false
    @ObservationIgnored weak var nett: WKWebView? { didSet { blokker.nett = nett; kobling.nett = nett } }

    init() { kobling.endret = { [weak self] in self?.bygg() } }

    func sett(_ dict: [String: Any]) {
        sist = dict
        blokker.sett(["blokker": dict["slutt"] as? [[String: Any]] ?? [], "naa": dict["naa"] ?? 0])
        kobling.ta(dict) { d in
            (d["folk"] as? [[String: Any]] ?? []).map { f in (id: f["id"] as? String ?? "", oi: f["oi"] as? Bool ?? false, png: f["png"] as? String ?? "") }
        }
        bygg()
    }

    /// Leken er over på denne telefonen
    func slipp() { kobling.slipp(); d = nil; sist = [:]; sender = false }

    /// Rommet når det er hentet og viser Over eller under – ellers skjermen nettsiden sendte
    private func bygg() {
        let ny: OuData
        if let t = kobling.tilstand("overunder") { ny = OuData(rom: t, hoder: kobling.hoder) }
        else if !sist.isEmpty { ny = OuData(sist) }
        else { return }
        withAnimation(.spring(response: 0.45, dampingFraction: 0.78)) { d = ny }
    }

    /// OVER eller UNDER – rett til rommet
    func gjett(_ paa: String) {
        guard !sender, d?.kan == true else { return }
        sender = true
        Haptikk.trykk()
        Task {
            let ok = await kobling.gjor(["handling": "gjett", "paa": paa], ellers: "ou-gjett", ["paa": paa])
            sender = false
            if !ok { Haptikk.melding(.error) }
        }
    }

    /// Verten hopper over den som har tur
    func hopp() {
        guard !sender, d?.hopp.isEmpty == false else { return }
        sender = true
        Haptikk.trykk()
        Task {
            let ok = await kobling.gjor(["handling": "ou-hopp"], ellers: "ou-hopp")
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

struct OverUnderSkjerm: View {
    var m: OuModell
    @State private var kortInn = false
    @State private var sklir = false
    private let rust = Color(red: 0.722, green: 0.22, blue: 0.039)

    var body: some View {
        ZStack {
            papir.ignoresSafeArea()
            if let d = m.d {
                VStack(spacing: 0) {
                    topp(d)
                    ScrollView(showsIndicators: false) {
                        VStack(alignment: .leading, spacing: 12) {
                            folk(d)
                            bord(d)
                            sjanse(d)
                            if let v = d.svar { svar(v) }
                            if d.ferdig {
                                if !d.storst.isEmpty {
                                    Text(d.storst).font(.archivo(17, vekt: 900)).foregroundColor(morkBlekk).padding(12).frame(maxWidth: .infinity, alignment: .leading)
                                        .background(RoundedRectangle(cornerRadius: 10).fill(gul)).overlay(RoundedRectangle(cornerRadius: 10).stroke(morkBlekk, lineWidth: 3))
                                }
                                BlokkListe(m: m.blokker).padding(.top, 6)
                            } else {
                                if !d.svarerFor.isEmpty { Text(d.svarerFor.uppercased()).font(.archivo(13, vekt: 900)).opacity(0.6) }
                                if d.kan { knapper(d) }
                                if !d.hopp.isEmpty {
                                    Button(action: { m.hopp() }) { Text(d.hopp).font(.archivo(14, vekt: 800)).underline().opacity(0.7).padding(.vertical, 8).frame(maxWidth: .infinity) }.buttonStyle(.plain)
                                }
                                if !d.vent.isEmpty { Text(d.vent).font(.archivo(15, vekt: 600)).opacity(0.7).fixedSize(horizontal: false, vertical: true) }
                            }
                        }
                        .padding(.horizontal, 16).padding(.top, 4).padding(.bottom, 24)
                    }
                }
            }
        }
        .foregroundColor(blekk)
    }

    private func topp(_ d: OuData) -> some View {
        Topplinje(tittel: d.tittel, chip: d.chip, uthevet: d.gul, stua: d.stua, mer: d.mer, trykk: { m.trykk($0) })
    }
    private func hode(_ png: String, _ px: CGFloat) -> some View { Figur(png, px) }

    /// Folket: den som har tur løftes opp med gul ring, slurkene drukket som rosa pille
    private func folk(_ d: OuData) -> some View {
        LazyVGrid(columns: benkKolonner(64), alignment: .leading, spacing: 10) {   // bryter linje med mange spillere
            ForEach(d.folk) { f in
                VStack(spacing: 4) {
                    hode(f.png, 48)
                        .background(f.tur ? Circle().stroke(gul, lineWidth: 5).padding(-2) : nil)
                        .offset(y: f.tur ? -6 : 0)
                    Text(f.navn).font(.archivo(14, vekt: 900)).lineLimit(1).minimumScaleFactor(0.7)
                    if f.drukket > 0 {
                        Text("−\(f.drukket)").font(.archivo(13, vekt: 900)).foregroundColor(morkBlekk).padding(.horizontal, 8).padding(.vertical, 1)
                            .background(Capsule().fill(rosa)).overlay(Capsule().stroke(morkBlekk, lineWidth: 2.5))
                    }
                }.frame(width: 64)
            }
        }
        .padding(.top, 8)
    }

    /// Bordet: bunken (lagene under og kortet som snus inn) og potten
    private func bord(_ d: OuData) -> some View {
        let lag = min(6, (sklir ? d.lagFor : d.bunke) - 1)
        return HStack(spacing: 26) {
            ZStack {
                ForEach((1...max(1, lag)).reversed(), id: \.self) { i in
                    if lag >= 1 {
                        RoundedRectangle(cornerRadius: 12).fill(kortFarge).overlay(RoundedRectangle(cornerRadius: 12).stroke(blekk, lineWidth: 3))
                            .frame(width: 150, height: 210)
                            .rotationEffect(.degrees(Double(i % 2 == 1 ? 1 : -1) * Double(i) * 1.2))
                            .offset(x: CGFloat(-i) * 4, y: CGFloat(i) * 4)
                            .offset(y: sklir ? -260 : 0).scaleEffect(sklir ? 0.4 : 1).opacity(sklir ? 0 : 1)
                    }
                }
                if let k = d.kort {
                    VStack {
                        HStack { Text(k.v).font(.archivo(30, vekt: 900)); Spacer() }
                        Spacer()
                        Text(k.f).font(.system(size: 88))
                        Spacer()
                        HStack { Spacer(); Text(k.v).font(.archivo(30, vekt: 900)).rotationEffect(.degrees(180)) }
                    }
                    .padding(.horizontal, 14).padding(.vertical, 12)
                    .frame(width: 150, height: 210).foregroundColor(k.rod ? kortRod : morkBlekk)
                    .background(RoundedRectangle(cornerRadius: 12).fill(Color.white)).overlay(RoundedRectangle(cornerRadius: 12).stroke(morkBlekk, lineWidth: 4))
                    .background(RoundedRectangle(cornerRadius: 12).fill(morkBlekk).offset(x: 6, y: 6))
                    .rotation3DEffect(.degrees(kortInn ? 0 : 180), axis: (x: 0, y: 1, z: 0))
                    .rotationEffect(.degrees(kortInn ? 0 : 8)).offset(x: kortInn ? 0 : 120, y: kortInn ? 0 : -30)
                    .id(d.n)
                    .onAppear {
                        if d.n > 0 { kortInn = false; DispatchQueue.main.asyncAfter(deadline: .now() + 0.03) { withAnimation(.spring(response: 0.6, dampingFraction: 0.75)) { kortInn = true } } }
                        else { kortInn = true }
                        if d.lagFor > 1 { sklir = false; DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) { withAnimation(.easeIn(duration: 0.7)) { sklir = true } } }
                        else { sklir = false }
                    }
                }
            }
            .frame(width: 160, height: 220)
            VStack(spacing: 6) {
                Text("\(d.bunke)").font(.archivo(44, vekt: 900)).foregroundColor(morkBlekk).frame(width: 88, height: 88)
                    .background(Circle().fill(gul)).overlay(Circle().stroke(morkBlekk, lineWidth: 4))
                    .background(Circle().fill(morkBlekk).offset(x: 4, y: 4))
                Text(d.pottTekst.uppercased()).font(.archivo(13, vekt: 900))
            }
        }
        .frame(maxWidth: .infinity).frame(minHeight: 250)
    }

    /// Sjansen: mint for høyere, rosa for lavere
    private func sjanse(_ d: OuData) -> some View {
        VStack(spacing: 6) {
            GeometryReader { g in
                ZStack(alignment: .leading) {
                    Capsule().fill(rosa)
                    Rectangle().fill(mint).frame(width: g.size.width * CGFloat(d.andel))
                        .overlay(Rectangle().fill(morkBlekk).frame(width: 3), alignment: .trailing)
                        .animation(.spring(response: 0.42, dampingFraction: 0.8), value: d.andel)
                }
                .clipShape(Capsule()).overlay(Capsule().stroke(blekk, lineWidth: 3))
            }.frame(height: 16)
            HStack { Text(d.overTekst); Spacer(); Text(d.underTekst) }.font(.archivo(13, vekt: 900))
        }
    }

    private func svar(_ v: OuSvar) -> some View {
        HStack(spacing: 10) {
            Text(v.tittel.uppercased()).font(.archivo(22, vekt: 900)).lineLimit(1).minimumScaleFactor(0.6)
            Text(v.tekst).font(.archivo(15, vekt: 800)).fixedSize(horizontal: false, vertical: true)
            Spacer(minLength: 0)
        }
        .padding(.horizontal, 14).padding(.vertical, 10).frame(maxWidth: .infinity, alignment: .leading).foregroundColor(morkBlekk)
        .background(RoundedRectangle(cornerRadius: 10).fill(v.riktig ? mint : rosa)).overlay(RoundedRectangle(cornerRadius: 10).stroke(morkBlekk, lineWidth: 3))
        .background(RoundedRectangle(cornerRadius: 10).fill(morkBlekk).offset(x: 4, y: 4))
        .transition(.asymmetric(insertion: .offset(y: 12).combined(with: .opacity), removal: .opacity))
    }

    /// OVER (mint, pil opp) og UNDER (rosa, pil ned)
    private func knapper(_ d: OuData) -> some View {
        HStack(spacing: 12) {
            gjettKnapp(d.overKnapp, "arrow.up", mint) { m.gjett("over") }
            gjettKnapp(d.underKnapp, "arrow.down", rosa) { m.gjett("under") }
        }
    }
    private func gjettKnapp(_ t: String, _ sym: String, _ farge: Color, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            VStack(spacing: 2) {
                Image(systemName: sym).font(.system(size: 30, weight: .black))
                Text(t.uppercased()).font(.archivo(30, vekt: 900)).lineLimit(1).minimumScaleFactor(0.6)
            }
            .frame(maxWidth: .infinity).frame(minHeight: 108).foregroundColor(morkBlekk)
            .background(RoundedRectangle(cornerRadius: 14).fill(farge)).overlay(RoundedRectangle(cornerRadius: 14).stroke(morkBlekk, lineWidth: 3))
            .background(RoundedRectangle(cornerRadius: 14).fill(morkBlekk).offset(x: 5, y: 5))
        }.buttonStyle(.plain)
    }
}
