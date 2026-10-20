import Foundation
import StoreKit
import WebKit
import UIKit

/// mittvors Pluss i appen: kjøp med StoreKit 2 (Apple krever det – aldri Vipps i appen). Kveldspass og Årspass er
/// «non-renewing subscriptions» i App Store Connect. Apples signerte transaksjon sendes til serveren vår via nettsiden
/// (window.__mvPluss.apple), som sjekker signaturen og gir Pluss på kontoen – samme spor som Vipps på nett.
@MainActor
final class PlussModell: ObservableObject {
    static let ider = ["no.mittvors.pluss.kveld", "no.mittvors.pluss.aar"]

    @Published var produkter: [Product] = []
    @Published var inne = false          // innlogget på mittvors-kontoen
    @Published var aktiv = false
    @Published var til: String = ""      // ISO-dato Pluss gjelder til
    @Published var gratisBrukt = true
    @Published var kveldspass = 0        // lagrede kveldspass (verving)
    @Published var travel: String? = nil // produkt-id det jobbes med, «gratis», «gjenopprett»
    @Published var melding: String = ""
    @Published var feil = false
    @Published var engelsk = false
    @Published var klarTilKjop = true    // StoreKit svarte med produkter
    weak var nett: WKWebView?
    var loggInn: (() -> Void)?
    var ferdig: (() -> Void)?

    func T(_ no: String, _ en: String) -> String { engelsk ? en : no }

    func last() {
        Task {
            await hentStatus()
            do {
                let p = try await Product.products(for: PlussModell.ider)
                produkter = PlussModell.ider.compactMap { id in p.first { $0.id == id } }
                klarTilKjop = !produkter.isEmpty
            } catch {
                klarTilKjop = false
                melding = T("Fikk ikke hentet prisene fra App Store. Prøv igjen om litt.", "Couldn’t load prices from the App Store. Try again shortly.")
            }
        }
    }

    func kjop(_ produkt: Product) {
        guard travel == nil else { return }
        guard inne else { loggInn?(); return }
        UIImpactFeedbackGenerator(style: .medium).impactOccurred()
        travel = produkt.id; feil = false; melding = ""
        Task {
            do {
                let r = try await produkt.purchase()
                switch r {
                case .success(let v):
                    let t = try sjekk(v)
                    let ok = await sendTilServer(v.jwsRepresentation)
                    if ok { await t.finish(); UINotificationFeedbackGenerator().notificationOccurred(.success); ferdig?() }
                case .userCancelled:
                    break
                case .pending:
                    melding = T("Kjøpet venter på godkjenning (f.eks. Be om å kjøpe). Pluss kommer når det er godkjent.", "The purchase is pending approval (e.g. Ask to Buy). Plus arrives once approved.")
                @unknown default:
                    break
                }
            } catch {
                feil = true; melding = T("Kjøpet gikk ikke gjennom. Prøv igjen.", "The purchase didn’t go through. Try again.")
            }
            travel = nil
        }
    }

    /// Gjenopprett: alle Apple-kjøp av våre produkter sendes til serveren igjen – den gir bare det som ikke er gitt før
    func gjenopprett() {
        guard travel == nil else { return }
        guard inne else { loggInn?(); return }
        travel = "gjenopprett"; feil = false; melding = ""
        Task {
            try? await AppStore.sync()
            var n = 0
            for await r in Transaction.all {
                guard case .verified(let t) = r, PlussModell.ider.contains(t.productID), t.revocationDate == nil else { continue }
                if await sendTilServer(r.jwsRepresentation, stille: true) { n += 1 }
            }
            await hentStatus()
            melding = n > 0 ? T("Kjøpene er hentet.", "Purchases restored.") : T("Fant ingen kjøp å hente.", "No purchases to restore.")
            travel = nil
        }
    }

    func gratis() {
        guard travel == nil else { return }
        guard inne else { loggInn?(); return }
        travel = "gratis"; feil = false; melding = ""
        Task {
            let d = await js("return await window.__mvPluss.gratis()", [:])
            if let f = d["feil"] as? String, !f.isEmpty { feil = true; melding = d["melding"] as? String ?? f }
            else { await hentStatus(); UINotificationFeedbackGenerator().notificationOccurred(.success); ferdig?() }
            travel = nil
        }
    }

    private func sjekk<T>(_ r: VerificationResult<T>) throws -> T {
        switch r { case .verified(let v): return v; case .unverified: throw NSError(domain: "pluss", code: 1) }
    }

    /// Serveren sjekker Apples signatur og gir Pluss. Svarer true når Pluss er på plass (nytt eller allerede gitt).
    private func sendTilServer(_ jws: String, stille: Bool = false) async -> Bool {
        let d = await js("return await window.__mvPluss.apple(jws)", ["jws": jws])
        if d["ok"] as? Bool == true { oppdater(d); return true }
        if !stille { feil = true; melding = d["melding"] as? String ?? T("Fikk ikke registrert kjøpet. Prøv «Gjenopprett kjøp» om litt.", "Couldn’t register the purchase. Try “Restore purchases” shortly.") }
        return false
    }

    private func hentStatus() async { oppdater(await js("return await window.__mvPluss.status()", [:])) }

    private func oppdater(_ d: [String: Any]) {
        if let i = d["innlogget"] as? Bool { inne = i }
        if let a = d["aktiv"] as? Bool { aktiv = a }
        til = d["til"] as? String ?? ""
        if let g = d["gratisBrukt"] as? Bool { gratisBrukt = g }
        kveldspass = d["kveldspass"] as? Int ?? 0
    }

    private func js(_ kode: String, _ arg: [String: Any]) async -> [String: Any] {
        guard let w = nett else { return ["feil": "ingen-side"] }
        return await withCheckedContinuation { c in
            w.callAsyncJavaScript(kode, arguments: arg, in: nil, in: .page) { res in
                if case .success(let v) = res, let d = v as? [String: Any] { c.resume(returning: d) } else { c.resume(returning: ["feil": "server"]) }
            }
        }
    }
}
