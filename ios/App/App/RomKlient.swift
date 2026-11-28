import Foundation
import Observation
import WebKit

/// Rommet rett fra Swift, uten nettsiden imellom: lage rom, bli med, hente tilstanden og gjøre handlinger mot
/// /api/rom, og høre fra Supabase Realtime når noen andre endrer rommet. Samme regler som rom.js:
/// - GET med ?v=versjon svarer 204 når ingenting er nytt
/// - handlingene sendes én om gangen, i rekkefølge
/// - sanntid sier bare «endret» (med versjonsnummer), så henter vi selv. Uten sanntid spør vi oftere.
/// Spillogikken bor på serveren (src/lib/rom.ts) – denne klienten bare spør og tegner ingenting.

// MARK: - Rå JSON

/// En JSON-verdi uten fast form. Lekedelen av rommet (`spill`) er ulik for hver lek, så den holdes rå
/// til hver lek får sin egen modell.
enum JSONVerdi: Codable, Equatable {
    case null
    case bool(Bool)
    case tall(Double)
    case tekst(String)
    case liste([JSONVerdi])
    case objekt([String: JSONVerdi])

    init(from decoder: Decoder) throws {
        let c = try decoder.singleValueContainer()
        if c.decodeNil() { self = .null }
        else if let b = try? c.decode(Bool.self) { self = .bool(b) }
        else if let n = try? c.decode(Double.self) { self = .tall(n) }
        else if let s = try? c.decode(String.self) { self = .tekst(s) }
        else if let l = try? c.decode([JSONVerdi].self) { self = .liste(l) }
        else { self = .objekt(try c.decode([String: JSONVerdi].self)) }
    }

    func encode(to encoder: Encoder) throws {
        var c = encoder.singleValueContainer()
        switch self {
        case .null: try c.encodeNil()
        case .bool(let b): try c.encode(b)
        case .tall(let n): try c.encode(n)
        case .tekst(let s): try c.encode(s)
        case .liste(let l): try c.encode(l)
        case .objekt(let o): try c.encode(o)
        }
    }

    subscript(_ k: String) -> JSONVerdi? { if case .objekt(let o) = self { return o[k] }; return nil }
    subscript(_ i: Int) -> JSONVerdi? { if case .liste(let l) = self, l.indices.contains(i) { return l[i] }; return nil }
    var tekst: String? { if case .tekst(let s) = self { return s }; return nil }
    var tall: Double? { if case .tall(let n) = self { return n }; return nil }
    var bool: Bool? { if case .bool(let b) = self { return b }; return nil }
    var liste: [JSONVerdi]? { if case .liste(let l) = self { return l }; return nil }
    var objekt: [String: JSONVerdi]? { if case .objekt(let o) = self { return o }; return nil }

    /// Som Foundation-verdier ([String: Any] osv.), slik de eksisterende skjermene leser data fra nettsiden
    var somAny: Any {
        switch self {
        case .null: return NSNull()
        case .bool(let b): return b
        case .tall(let n): return NSNumber(value: n)
        case .tekst(let s): return s
        case .liste(let l): return l.map(\.somAny)
        case .objekt(let o): return o.mapValues(\.somAny)
        }
    }
}

// MARK: - Rommet

/// En spiller slik serveren viser den (visning() i rom.ts). Venterommet sender bare id og navn, så alt annet er valgfritt.
struct RomSpiller: Decodable, Identifiable, Equatable {
    let id: String
    let navn: String
    let pynt: JSONVerdi?
    let figur: String
    let bruker: Bool
    let medlem: Bool
    let invitert: Bool
    let slurker: Int
    let gi: Int
    let immun: Int
    let lang: String

    private enum K: String, CodingKey { case id, navn, pynt, figur, bruker, medlem, invitert, slurker, gi, immun, lang }
    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: K.self)
        id = try c.decode(String.self, forKey: .id)
        navn = try c.decodeIfPresent(String.self, forKey: .navn) ?? ""
        pynt = try c.decodeIfPresent(JSONVerdi.self, forKey: .pynt)
        figur = try c.decodeIfPresent(String.self, forKey: .figur) ?? id
        bruker = try c.decodeIfPresent(Bool.self, forKey: .bruker) ?? false
        medlem = try c.decodeIfPresent(Bool.self, forKey: .medlem) ?? false
        invitert = try c.decodeIfPresent(Bool.self, forKey: .invitert) ?? false
        slurker = Int(try c.decodeIfPresent(Double.self, forKey: .slurker) ?? 0)
        gi = Int(try c.decodeIfPresent(Double.self, forKey: .gi) ?? 0)
        immun = Int(try c.decodeIfPresent(Double.self, forKey: .immun) ?? 0)
        lang = try c.decodeIfPresent(String.self, forKey: .lang) ?? "no"
    }
}

/// Det faste i rommet. `spill` (lekedelen) og hele svaret (`raa`) holdes rå til lekene får egne modeller i fase 3.
struct RomTilstand: Decodable {
    struct Hendelse: Decodable, Equatable { let nr: Int; let tekst: String }

    let versjon: Int
    let kode: String
    let vert: String
    let meg: String?
    let lang: String
    let spillere: [RomSpiller]
    let spill: JSONVerdi?
    let hendelse: Hendelse?
    /// Servertid i millisekunder da svaret ble laget (til nedtellinger)
    let naa: Double
    /// Venter på å bli sluppet inn i en gjengkveld
    let venter: Bool
    /// Hele svaret fra serveren, også det som ikke har egen modell ennå
    var raa: JSONVerdi = .null

    var jegErVert: Bool { meg != nil && meg == vert }
    func spiller(_ id: String?) -> RomSpiller? { spillere.first { $0.id == id } }

    private enum K: String, CodingKey { case versjon, kode, vert, meg, lang, spillere, spill, hendelse, naa, venter }
    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: K.self)
        versjon = Int(try c.decodeIfPresent(Double.self, forKey: .versjon) ?? 0)
        kode = try c.decodeIfPresent(String.self, forKey: .kode) ?? ""
        vert = try c.decodeIfPresent(String.self, forKey: .vert) ?? ""
        meg = try c.decodeIfPresent(String.self, forKey: .meg)
        lang = try c.decodeIfPresent(String.self, forKey: .lang) ?? "no"
        spillere = try c.decodeIfPresent([RomSpiller].self, forKey: .spillere) ?? []
        spill = try c.decodeIfPresent(JSONVerdi.self, forKey: .spill)
        hendelse = try c.decodeIfPresent(Hendelse.self, forKey: .hendelse)
        naa = try c.decodeIfPresent(Double.self, forKey: .naa) ?? 0
        // Venterommet svarer venter: true; den vanlige visningen har en liste med ventende gjester under samme navn
        venter = (try? c.decodeIfPresent(Bool.self, forKey: .venter)) ?? false
    }
}

/// Feil fra serveren (feil-koden fra rom.ts og meldingen på riktig språk), eller at nettet svikter
struct RomFeil: Error, Equatable, CustomStringConvertible {
    let kode: String
    let melding: String
    let status: Int
    var description: String { "\(kode) (\(status)): \(melding)" }
}

// MARK: - Klienten

@MainActor
@Observable
final class RomKlient {
    struct Meg: Codable, Equatable { let id: String; let pollett: String }
    enum Sanntid { case av, kobler, paa }

    static let base = URL(string: "https://www.mittvors.no")!

    private(set) var kode = ""
    private(set) var meg: Meg? = nil
    private(set) var tilstand: RomTilstand? = nil
    /// Lekelista: kommer med første svar på hvert språk (serveren slipper å sende den hver gang)
    private(set) var leker: JSONVerdi? = nil
    private(set) var sanntid: Sanntid = .av
    /// Siste feil (vises i appen), nullstilles når et kall går bra
    private(set) var feil: RomFeil? = nil
    var lang: String

    /// Innloggingen (Supabase access token), så serveren kan sjekke Pluss, pynt og gjeng
    @ObservationIgnored var token: (() -> String?)? = nil
    /// Kalles hver gang rommet er nytt
    @ObservationIgnored var endret: ((RomTilstand) -> Void)? = nil
    /// Hvor mange ganger sanntid har sagt fra (selvtesten bruker det)
    @ObservationIgnored private(set) var sanntidVarsler = 0
    @ObservationIgnored private let husk: Bool
    @ObservationIgnored private let okt: URLSession
    @ObservationIgnored private var aktiv = false
    @ObservationIgnored private var lekerLang = ""
    @ObservationIgnored private var lekerKode = ""
    @ObservationIgnored private var henter = false
    @ObservationIgnored private var henteIgjen = false
    @ObservationIgnored private var feilTeller = 0
    @ObservationIgnored private var planlagt: Task<Void, Never>? = nil
    @ObservationIgnored private var ko: Task<Void, Never>? = nil
    @ObservationIgnored private var ws: URLSessionWebSocketTask? = nil
    @ObservationIgnored private var wsRef = 0
    @ObservationIgnored private var hjerteslag: Task<Void, Never>? = nil
    /// Appen ligger i bakgrunnen: spør sjeldnere
    @ObservationIgnored var iBakgrunnen = false { didSet { if aktiv { planlegg() } } }

    /// `husk: false` lar være å lagre plassen i rommet på telefonen (selvtesten sin ekstra gjest)
    init(lang: String = "no", husk: Bool = true) {
        self.lang = lang == "en" ? "en" : "no"
        self.husk = husk
        let k = URLSessionConfiguration.default
        k.requestCachePolicy = .reloadIgnoringLocalCacheData
        k.timeoutIntervalForRequest = 15
        okt = URLSession(configuration: k)
    }

    // MARK: Inn i et rom

    /// Lager et nytt rom med deg som vert
    @discardableResult
    func lagRom(navn: String, lek: String = "", modus: String = "") async throws -> RomTilstand {
        let data = try await be("POST", "api/rom", body: ["navn": navn, "lang": lang, "lek": lek, "modus": modus])
        guard let data, let svar = try? JSONDecoder().decode(NyttRom.self, from: data), !svar.kode.isEmpty else {
            throw RomFeil(kode: "server", melding: tekst("Fikk ikke laget rommet.", "Couldn't create the room."), status: 0)
        }
        bytt(til: svar.kode, meg: Meg(id: svar.id, pollett: svar.pollett))
        if let l = try? JSONDecoder().decode(MedLeker.self, from: data), let liste = l.leker { leker = liste; lekerLang = svar.lang ?? lang; lekerKode = svar.kode }
        guard let t = try await hentNaa() else { throw RomFeil(kode: "server", melding: tekst("Fikk ikke hentet rommet.", "Couldn't load the room."), status: 0) }
        start()
        return t
    }

    /// Blir med i et rom. I en gjengkveld kan svaret være venterommet (`tilstand.venter`).
    @discardableResult
    func bliMed(kode ny: String, navn: String) async throws -> RomTilstand {
        let k = Self.rensKode(ny)
        let data = try await be("POST", "api/rom/" + k, body: ["handling": "bli-med", "navn": navn, "lang": lang])
        guard let data, let id = try? JSONDecoder().decode(NyttRom.Plass.self, from: data) else {
            throw RomFeil(kode: "server", melding: tekst("Fikk ikke blitt med.", "Couldn't join."), status: 0)
        }
        bytt(til: k, meg: Meg(id: id.id, pollett: id.pollett))
        guard let t = ta(data) else { throw RomFeil(kode: "server", melding: tekst("Fikk ikke lest rommet.", "Couldn't read the room."), status: 0) }
        start()
        return t
    }

    /// Tilbake til et rom du er med i fra før (plassen er lagret på telefonen). Nei hvis telefonen ikke husker den.
    @discardableResult
    func fortsett(kode ny: String) async -> Bool {
        let k = Self.rensKode(ny)
        guard let m = Self.lagretPlass(k) else { return false }
        bytt(til: k, meg: m)
        start()
        await hent()
        return meg != nil
    }

    /// Bruker plassen nettsiden allerede har i rommet. Mens lekene flyttes over én om gangen (fase 3) eier nettsiden
    /// fortsatt rommet (lobbyen, stua, frister og lyd), og de native lekene leser og handler selv gjennom denne.
    func bruk(kode ny: String, meg m: Meg, lang l: String) {
        let k = Self.rensKode(ny)
        lang = l == "en" ? "en" : "no"
        guard !k.isEmpty else { return }
        if k == kode && m == meg && aktiv { return }
        bytt(til: k, meg: m)
        start()
        Task { await hent() }
    }

    /// Den ene klienten de native lekene deler
    static let delt = RomKlient()

    // MARK: Handlinger

    /// Gjør noe i rommet (samme handlinger som nettsiden sender: «start», «slurk», «stem» …). Handlingene sendes én
    /// om gangen i den rekkefølgen de ble gjort. Svaret er rommet etterpå.
    @discardableResult
    func gjor(_ handling: [String: Any]) async throws -> RomTilstand? {
        guard let m = meg, !kode.isEmpty else { throw RomFeil(kode: "ikke-med", melding: tekst("Du er ikke i et rom.", "You're not in a room."), status: 0) }
        var h = handling
        h["id"] = m.id
        h["pollett"] = m.pollett
        let forrige = ko
        let sti = "api/rom/" + kode
        let oppgave = Task<Result<Data?, Error>, Never> { [weak self] in
            await forrige?.value
            guard let self else { return .success(nil) }
            do { return .success(try await self.be("POST", sti, body: h)) } catch { return .failure(error) }
        }
        ko = Task { _ = await oppgave.value }
        switch await oppgave.value {
        case .success(let data):
            feil = nil
            return data.flatMap { ta($0) }
        case .failure(let e):
            if let f = e as? RomFeil {
                feil = f
                if f.kode == "ikke-med" { glem() }
            }
            throw e
        }
    }

    /// Henter rommet nå (svarer ingenting nytt når versjonen er den samme)
    func hent() async {
        guard aktiv else { return }
        if henter { henteIgjen = true; return }
        henter = true
        planlagt?.cancel()
        do {
            _ = try await hentNaa()
            feilTeller = 0
        } catch let f as RomFeil where f.kode == "finnes-ikke" || f.kode == "ikke-med" {
            // Rommet er borte (utløpt i natt) eller du er kastet ut: glem det
            feil = f
            glem()
        } catch {
            feilTeller += 1
        }
        henter = false
        if henteIgjen && aktiv { henteIgjen = false; await hent() } else { planlegg() }
    }

    /// Ut av rommet på denne telefonen (serveren beholder plassen din til rommet utløper)
    func glem() {
        if husk && !kode.isEmpty { Self.lagrePlass(kode, nil) }
        stopp()
        meg = nil
        tilstand = nil
        kode = ""
    }

    /// Slutter å lytte og spørre (rommet og plassen beholdes)
    func stopp() {
        aktiv = false
        planlagt?.cancel()
        planlagt = nil
        stoppSanntid()
    }

    // MARK: Nettverk

    private struct NyttRom: Decodable {
        struct Plass: Decodable { let id: String; let pollett: String }
        let kode: String; let id: String; let pollett: String; let lang: String?
    }
    private struct MedLeker: Decodable { let leker: JSONVerdi? }
    private struct Feilsvar: Decodable { let feil: String?; let melding: String? }

    private func tekst(_ no: String, _ en: String) -> String { lang == "en" ? en : no }

    private func be(_ metode: String, _ sti: String, body: [String: Any]? = nil, query: [URLQueryItem] = []) async throws -> Data? {
        var u = URLComponents(url: Self.base.appendingPathComponent(sti), resolvingAgainstBaseURL: false)!
        if !query.isEmpty { u.queryItems = query }
        var r = URLRequest(url: u.url!)
        r.httpMethod = metode
        r.setValue("application/json", forHTTPHeaderField: "Content-Type")
        r.setValue(lang, forHTTPHeaderField: "x-lang")
        if !lekerLang.isEmpty && lekerKode == kode { r.setValue(lekerLang, forHTTPHeaderField: "x-leker") }
        if metode == "GET", let m = meg { r.setValue(m.id, forHTTPHeaderField: "x-spiller"); r.setValue(m.pollett, forHTTPHeaderField: "x-pollett") }
        if metode == "POST", let t = token?(), !t.isEmpty { r.setValue("Bearer " + t, forHTTPHeaderField: "Authorization") }
        if let body { r.httpBody = try JSONSerialization.data(withJSONObject: body) }
        let data: Data, svar: URLResponse
        do { (data, svar) = try await okt.data(for: r) }
        catch { throw RomFeil(kode: "nett", melding: tekst("Mistet kontakten. Prøver igjen …", "Lost connection. Retrying …"), status: 0) }
        let status = (svar as? HTTPURLResponse)?.statusCode ?? 0
        if status == 204 { return nil }
        guard (200..<300).contains(status) else {
            let f = try? JSONDecoder().decode(Feilsvar.self, from: data)
            throw RomFeil(kode: f?.feil ?? "server", melding: f?.melding ?? tekst("Det gikk ikke.", "That didn't work."), status: status)
        }
        return data
    }

    private func hentNaa() async throws -> RomTilstand? {
        guard !kode.isEmpty, meg != nil else { return nil }
        let v = tilstand?.versjon ?? 0
        guard let data = try await be("GET", "api/rom/" + kode, query: [URLQueryItem(name: "v", value: String(v))]) else { return tilstand }
        feil = nil
        return ta(data)
    }

    /// Leser et svar fra serveren. Et eldre svar enn det vi har (kom fram for sent), kastes.
    @discardableResult
    private func ta(_ data: Data) -> RomTilstand? {
        guard var t = try? JSONDecoder().decode(RomTilstand.self, from: data) else { return nil }
        t.raa = (try? JSONDecoder().decode(JSONVerdi.self, from: data)) ?? .null
        if let l = t.raa["leker"], l != .null { leker = l; lekerLang = t.lang; lekerKode = kode }
        if let gammel = tilstand, gammel.versjon > t.versjon { return gammel }
        tilstand = t
        endret?(t)
        return t
    }

    private func bytt(til ny: String, meg m: Meg) {
        if ny != kode { stopp(); tilstand = nil }
        kode = ny
        meg = m
        if husk { Self.lagrePlass(ny, m) }
    }

    private func start() {
        guard !aktiv else { return }
        aktiv = true
        kobleSanntid()
        planlegg()
    }

    /// Neste henting: sjelden når sanntid virker (endringene kommer uansett med én gang), oftere uten,
    /// og mye sjeldnere i bakgrunnen. Samme tider som rom.js.
    private func planlegg() {
        planlagt?.cancel()
        guard aktiv else { return }
        let ok = sanntid == .paa
        let ms = iBakgrunnen ? (ok ? 45000 : 10000) : ok ? 12000 : min(1500 + feilTeller * 1500, 8000)
        planlagt = Task { [weak self] in
            try? await Task.sleep(for: .milliseconds(ms))
            guard !Task.isCancelled else { return }
            await self?.hent()
        }
    }

    // MARK: Sanntid (Supabase Realtime, Phoenix-protokollen)

    private struct Oppsett: Decodable { let url: String; let anon: String }
    private static var oppsett: Oppsett? = nil

    private func kobleSanntid() {
        guard ws == nil, sanntid == .av, !kode.isEmpty else { return }
        sanntid = .kobler
        let k = kode
        Task { [weak self] in
            guard let o = await Self.hentOppsett() else { self?.sanntidBrutt(nil); return }
            guard let self, self.aktiv, self.kode == k, self.ws == nil else { return }
            var u = URLComponents(string: o.url.replacingOccurrences(of: "https://", with: "wss://") + "/realtime/v1/websocket")
            u?.queryItems = [URLQueryItem(name: "apikey", value: o.anon), URLQueryItem(name: "vsn", value: "1.0.0")]
            guard let url = u?.url else { self.sanntidBrutt(nil); return }
            let w = self.okt.webSocketTask(with: url)
            self.ws = w
            w.resume()
            let emne = "realtime:rom-" + k
            self.wsRef += 1
            let ref = String(self.wsRef)
            let config: [String: Any] = ["broadcast": ["ack": false, "self": false] as [String: Any], "presence": ["key": ""],
                                         "postgres_changes": [Any](), "private": false]
            let payload: [String: Any] = ["config": config, "access_token": o.anon]
            self.send(w, ["topic": emne, "event": "phx_join", "ref": ref, "join_ref": ref, "payload": payload])
            self.hjerteslag = Task { [weak self] in
                while !Task.isCancelled {
                    try? await Task.sleep(for: .seconds(25))
                    guard let self, self.ws === w else { return }
                    self.wsRef += 1
                    self.send(w, ["topic": "phoenix", "event": "heartbeat", "payload": [String: Any](), "ref": String(self.wsRef)])
                }
            }
            self.lytt(w, emne: emne)
        }
    }

    private static func hentOppsett() async -> Oppsett? {
        if let o = oppsett { return o }
        guard let svar = try? await URLSession.shared.data(from: base.appendingPathComponent("api/oppsett")),
              let o = try? JSONDecoder().decode(Oppsett.self, from: svar.0), !o.url.isEmpty, !o.anon.isEmpty else { return nil }
        oppsett = o
        return o
    }

    private func send(_ w: URLSessionWebSocketTask, _ m: [String: Any]) {
        guard let d = try? JSONSerialization.data(withJSONObject: m), let s = String(data: d, encoding: .utf8) else { return }
        w.send(.string(s)) { _ in }
    }

    private func lytt(_ w: URLSessionWebSocketTask, emne: String) {
        Task { [weak self] in
            while true {
                let m: URLSessionWebSocketTask.Message
                do { m = try await w.receive() } catch { self?.sanntidBrutt(w); return }
                guard let self, self.ws === w else { return }
                let data: Data?
                switch m {
                case .string(let s): data = s.data(using: .utf8)
                case .data(let d): data = d
                @unknown default: data = nil
                }
                if let data { self.sanntidMelding(data, emne: emne) }
            }
        }
    }

    private func sanntidMelding(_ data: Data, emne: String) {
        guard let m = try? JSONSerialization.jsonObject(with: data) as? [String: Any], m["topic"] as? String == emne else { return }
        let event = m["event"] as? String, payload = m["payload"] as? [String: Any]
        if event == "phx_reply", payload?["status"] as? String == "ok", sanntid != .paa {
            sanntid = .paa
            planlegg()
        }
        if event == "broadcast", payload?["event"] as? String == "endret" {
            sanntidVarsler += 1
            let v = ((payload?["payload"] as? [String: Any])?["v"] as? NSNumber)?.intValue ?? 0
            if v == 0 || v > (tilstand?.versjon ?? 0) { Task { await hent() } }
        }
    }

    /// Forbindelsen falt (eller kom aldri opp): spør oftere, og prøv igjen om fem sekunder
    private func sanntidBrutt(_ w: URLSessionWebSocketTask?) {
        if let w { guard ws === w else { return } } else if ws != nil { return }
        hjerteslag?.cancel()
        ws?.cancel(with: .goingAway, reason: nil)
        ws = nil
        sanntid = .av
        guard aktiv else { return }
        planlegg()
        let k = kode
        Task { [weak self] in
            try? await Task.sleep(for: .seconds(5))
            guard let self, self.aktiv, self.kode == k, self.ws == nil else { return }
            self.kobleSanntid()
        }
    }

    private func stoppSanntid() {
        hjerteslag?.cancel()
        hjerteslag = nil
        let w = ws
        ws = nil
        w?.cancel(with: .goingAway, reason: nil)
        sanntid = .av
    }

    // MARK: Plassen din i rommene (husket på telefonen)

    static func rensKode(_ k: String) -> String { String(k.uppercased().filter { $0.isLetter || $0.isNumber }.prefix(6)) }

    private static let plassNokkel = "mv_rom_plasser"
    static func lagretPlass(_ kode: String) -> Meg? {
        guard let d = UserDefaults.standard.data(forKey: plassNokkel), let alle = try? JSONDecoder().decode([String: Meg].self, from: d) else { return nil }
        return alle[kode]
    }
    private static func lagrePlass(_ kode: String, _ m: Meg?) {
        var alle: [String: Meg] = [:]
        if let d = UserDefaults.standard.data(forKey: plassNokkel), let l = try? JSONDecoder().decode([String: Meg].self, from: d) { alle = l }
        alle[kode] = m
        // Rom lever et døgn: noen få holder i massevis
        if alle.count > 20 { alle = Dictionary(uniqueKeysWithValues: alle.suffix(20).map { ($0.key, $0.value) }) }
        if let d = try? JSONEncoder().encode(alle) { UserDefaults.standard.set(d, forKey: plassNokkel) }
    }
}

// MARK: - En native lek som leser rommet selv (fase 3)

/// Det de native lekene i fase 3 deler: plassen i rommet fra nettsiden, figurene, og handlinger som går rett til
/// rommet. Nettsiden eier fortsatt rommet (lobbyen, stua, frister og lyd) – leken leser og handler gjennom RomKlient.delt.
/// Nyere rom.js sender `rom` ({kode, id, pollett, lang}) og `hoder` ({id: {n, oi}}) med skjermdataene. Med eldre rom.js
/// hentes plassen fra nettsidens localStorage, og figurene plukkes fra skjermdataene (`plukk`).
@MainActor
final class LekKobling {
    /// Til loggen i simulator-sjekken («ou: …»)
    let navn: String
    /// Klienten følger rommet for denne leken (ikke en gammel plass fra et tidligere rom)
    private(set) var koblet = false
    /// Figurene: id → {n: vanlig, oi: «oi»-ansiktet}
    private(set) var hoder: [String: [String: String]] = [:]
    /// Kalles når rommet er nytt
    var endret: @MainActor () -> Void = {}
    /// Handlingene kan gå rett til rommet (ellers trykkes nettsidens knapper)
    var direkte: Bool { koblet && rom.meg != nil }
    weak var nett: WKWebView?
    private var henterPlass = false
    var rom: RomKlient { RomKlient.delt }

    /// nonisolated: lekemodellene lager den som standardverdi for en egenskap
    nonisolated init(_ navn: String) { self.navn = navn }

    /// Fra nettsiden: plassen i rommet og figurene. `plukk` henter figurene fra skjermdataene når `hoder` mangler.
    func ta(_ dict: [String: Any], plukk: ([String: Any]) -> [(id: String, oi: Bool, png: String)]) {
        if let h = dict["hoder"] as? [String: [String: String]] { hoder.merge(h) { _, ny in ny } }
        else { for p in plukk(dict) where !p.png.isEmpty && !p.id.isEmpty { hoder[p.id, default: [:]][p.oi ? "oi" : "n"] = p.png } }
        if let r = dict["rom"] as? [String: Any], let k = r["kode"] as? String, let id = r["id"] as? String, let p = r["pollett"] as? String {
            koble(k, RomKlient.Meg(id: id, pollett: p), r["lang"] as? String ?? "no")
        } else if !koblet {
            hentPlass()
        }
    }

    /// Rommet når det er hentet og viser denne leken (`type` som i rom.ts)
    func tilstand(_ type: String) -> RomTilstand? {
        guard koblet, rom.meg != nil, let t = rom.tilstand, t.spill?["type"]?.tekst == type else { return nil }
        return t
    }

    /// Leken er over på denne telefonen: slutt å spørre (nettsiden har rommet videre)
    func slipp() {
        koblet = false
        rom.endret = nil
        rom.stopp()
    }

    /// Sender handlingen rett til rommet. Uten plass i rommet trykkes nettsidens egen knapp (`ellers`), som før.
    /// Nei hvis handlingen ikke kom fram.
    func gjor(_ handling: [String: Any], ellers g: String, _ attrs: [String: String] = [:]) async -> Bool {
        guard direkte else { trykkNett(g, attrs); return true }
        SjekkLogg.skriv("\(navn): \(handling["handling"] ?? "?") sendt fra Swift")
        do { _ = try await rom.gjor(handling); return true }
        catch { SjekkLogg.skriv("\(navn): \(handling["handling"] ?? "?") kom ikke fram – \(error)"); return false }
    }

    /// Trykker en av nettsidens egne knapper (stua, mer, sluttknappene – det som hører til rommet, ikke leken)
    func trykkNett(_ g: String, _ attrs: [String: String] = [:]) {
        guard let data = try? JSONSerialization.data(withJSONObject: [g, attrs]), let json = String(data: data, encoding: .utf8) else { return }
        nett?.evaluateJavaScript("window.__mvLek && window.__mvLek.trykk.apply(null, \(json))", completionHandler: nil)
    }

    /// Nettsidens lyd for en egen, åpen handling (eldre rom.js har ikke __mvLek.lyd: da blir det stille)
    func lyd(_ n: String) {
        guard let data = try? JSONSerialization.data(withJSONObject: [n]), let json = String(data: data, encoding: .utf8) else { return }
        nett?.evaluateJavaScript("window.__mvLek && window.__mvLek.lyd && window.__mvLek.lyd.apply(null, \(json))", completionHandler: nil)
    }

    private func koble(_ kode: String, _ meg: RomKlient.Meg, _ lang: String) {
        koblet = true
        rom.endret = { [weak self] _ in MainActor.assumeIsolated { self?.endret() } }
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
                    SjekkLogg.skriv("\(self.navn): plassen fra localStorage (\(k))")
                    self.koble(k, RomKlient.Meg(id: id, pollett: p), r["lang"] as? String ?? "no")
                } else {
                    SjekkLogg.skriv("\(self.navn): fant ikke plassen – nettsiden tegner skjermen")
                }
            }
        }
    }
}

/// Kortverdien slik nettsiden skriver den (vn i rom.js): 2–10, så Kn/D/K/A (J/Q/K/A på engelsk)
func kortVerdi(_ v: Int, en: Bool) -> String {
    if v <= 10 { return String(v) }
    return (en ? [11: "J", 12: "Q", 13: "K", 14: "A"] : [11: "Kn", 12: "D", 13: "K", 14: "A"])[v] ?? String(v)
}
func rodFarge(_ f: String) -> Bool { f == "♥" || f == "♦" }
/// Figuren til en spiller fra `hoder` (id → {n, oi}), med «oi»-ansiktet når det finnes og trengs
func figurPng(_ hoder: [String: [String: String]], _ id: String, oi: Bool = false) -> String {
    let h = hoder[id] ?? [:]
    if oi, let o = h["oi"], !o.isEmpty { return o }
    return h["n"] ?? ""
}

// MARK: - Selvtest i simulator-sjekken

/// MV_SJEKK=1: lager et rom med RomKlient, venter på sanntid, lar en gjest bli med fra en annen klient og sjekker at
/// verten får beskjed – gjennom sanntid, ikke bare ved å spørre. Resultatet havner i sjekk.log («romklient: …»).
/// Kjøres én gang per installasjon (appen startes mange ganger i sjekken).
enum RomKlientSjekk {
    @MainActor static func kjor() {
        let nokkel = "mv_romklient_sjekket"
        guard SjekkLogg.paa, !UserDefaults.standard.bool(forKey: nokkel) else { return }
        UserDefaults.standard.set(true, forKey: nokkel)
        Task { @MainActor in
            let vert = RomKlient(lang: "no", husk: false)
            let gjest = RomKlient(lang: "no", husk: false)
            defer { vert.stopp(); gjest.stopp() }
            do {
                let t = try await vert.lagRom(navn: "Klient")
                SjekkLogg.skriv("romklient: laget rom \(vert.kode) v\(t.versjon), \(t.spillere.count) spiller, vert=\(t.jegErVert), leker=\(vert.leker?.liste?.count ?? vert.leker?.objekt?.count ?? 0)")
                for _ in 0..<40 where vert.sanntid != .paa { try? await Task.sleep(for: .milliseconds(250)) }
                SjekkLogg.skriv("romklient: sanntid \(vert.sanntid == .paa ? "koblet" : "IKKE koblet")")
                let g = try await gjest.bliMed(kode: vert.kode, navn: "Gjest")
                SjekkLogg.skriv("romklient: gjest med, ser \(g.spillere.count) spillere")
                for _ in 0..<40 where (vert.tilstand?.spillere.count ?? 0) < 2 { try? await Task.sleep(for: .milliseconds(250)) }
                let n = vert.tilstand?.spillere.count ?? 0
                SjekkLogg.skriv("romklient: verten ser \(n) spillere, sanntidsvarsler=\(vert.sanntidVarsler) – \(n == 2 && vert.sanntidVarsler > 0 ? "OK" : "FEIL")")
                do {
                    try await gjest.gjor(["handling": "finnes-ikke-handling"])
                    SjekkLogg.skriv("romklient: ukjent handling ga ingen feil")
                } catch {
                    SjekkLogg.skriv("romklient: ukjent handling ga feil som ventet: \(error)")
                }
            } catch {
                SjekkLogg.skriv("romklient: FEIL \(error)")
            }
        }
    }
}
