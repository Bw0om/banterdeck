import UIKit
import Capacitor

/// Skallet: iPhonens egen fanelinje nederst (Hjem, Spill, Leker, Deg). Hver fane har sin egen skjerm (nettvisning)
/// som lever videre når du bytter fane – rommet fortsetter i Spill mens du kikker i Leker, og et fanetrykk er
/// øyeblikkelig, uten ny sidelasting. Skjermene lages først når fanen åpnes. Linja er iPhonens egen
/// (UITabBarController): på iOS 26 krymper den til en liten knapp når du blar nedover.
final class SkallViewController: UITabBarController, UITabBarControllerDelegate {
    static weak var delt: SkallViewController?

    let faner = ["hjem", "spill", "leker", "deg"]
    /// Startsiden for hver fane, per språk (stier i app-pakken, slik Astro bygger dem)
    private let ruter: [String: [String]] = [
        "no": ["no", "no/rom", "no/drinking-games", "no/account"],
        "en": ["", "room", "drinking-games", "account"]
    ]
    private var visninger: [Int: MittvorsViewController] = [:]
    private var skjultPer: [Int: Bool] = [:]
    private var ventende: [Int: String] = [:]   // adresse en nyopprettet skjerm skal gå til så snart siden er klar
    private(set) var skjult = false
    private var startfaneBrukt = false

    /// Språket sidene bruker. Nettsiden sier fra (Skall.klar), og neste fane åpnes på samme språk.
    var spraak: String {
        get {
            if let l = UserDefaults.standard.string(forKey: "mv_spraak") { return l }
            let norsk = Locale.preferredLanguages.contains { $0.hasPrefix("nb") || $0.hasPrefix("nn") || $0.hasPrefix("no") }
            return norsk ? "no" : "en"
        }
        set { UserDefaults.standard.set(newValue, forKey: "mv_spraak") }
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        SkallViewController.delt = self
        delegate = self
        view.backgroundColor = UIColor(red: 1, green: 0.973, blue: 0.933, alpha: 1)   // #FFF8EE
        tabBar.tintColor = UIColor(red: 0.776, green: 0.235, blue: 0.067, alpha: 1)   // rust, som den aktive fanen på nettsiden

        // Fire sider i fanelinja. Skjermen til hver fane legges inn i sin side når fanen åpnes første gang.
        let symboler: [(String, String)] = [("house", "house.fill"), ("die.face.5", "die.face.5.fill"), ("wineglass", "wineglass.fill"), ("person", "person.fill")]
        let navn = ["Hjem", "Spill", "Leker", "Deg"]
        viewControllers = zip(symboler, navn).enumerated().map { (i, p) in
            let vc = UIViewController()
            vc.view.backgroundColor = view.backgroundColor
            vc.tabBarItem = UITabBarItem(title: p.1, image: UIImage(systemName: p.0.0), selectedImage: UIImage(systemName: p.0.1))
            vc.tabBarItem.tag = i
            return vc
        }
        if #available(iOS 26.0, *) {
            tabBarMinimizeBehavior = .onScrollDown   // linja krymper når du blar nedover
        }
        selectedIndex = 0
        visning(0)
    }

    override var childForStatusBarStyle: UIViewController? { visninger[selectedIndex] }

    /// Skjermen til en fane – lages første gang fanen åpnes, og starter rett på fanens side
    @discardableResult
    func visning(_ i: Int) -> MittvorsViewController {
        if let v = visninger[i] { return v }
        let sti = (ruter[spraak] ?? ruter["no"]!)[i]
        let v = MittvorsViewController(startSti: sti.isEmpty ? nil : sti)
        visninger[i] = v
        if let side = viewControllers?[i] {
            side.addChild(v)
            v.view.translatesAutoresizingMaskIntoConstraints = false
            side.view.addSubview(v.view)
            NSLayoutConstraint.activate([
                v.view.topAnchor.constraint(equalTo: side.view.topAnchor),
                v.view.leadingAnchor.constraint(equalTo: side.view.leadingAnchor),
                v.view.trailingAnchor.constraint(equalTo: side.view.trailingAnchor),
                v.view.bottomAnchor.constraint(equalTo: side.view.bottomAnchor)
            ])
            v.didMove(toParent: side)
        }
        return v
    }

    /// Hvilken fane en nettvisning hører til (pluginen spør med bridge.viewController)
    func fane(for vc: UIViewController?) -> Int? {
        guard let vc = vc else { return nil }
        return visninger.first { $0.value === vc }?.key
    }

    /// Fanen som er valgt, som id («hjem», «spill», «leker», «deg»)
    var valgtFane: String { faner[min(selectedIndex, faner.count - 1)] }

    func velg(fane: String) {
        guard let i = faner.firstIndex(of: fane) else { return }
        selectedIndex = i
        visning(i)
        oppdaterSkjul()
        setNeedsStatusBarAppearanceUpdate()
    }

    /// Åpne en adresse i fanen den hører til (f.eks. «Lag rom» fra Hjem → Spill-fanen). Skjermen som ba om det, blir der den er.
    func aapne(fane: String, url: String) {
        guard let i = faner.firstIndex(of: fane) else { return }
        let fantes = visninger[i] != nil
        velg(fane: fane)
        if fantes { gaa(visninger[i], til: url) } else { ventende[i] = url }   // ny skjerm: siden sier fra når den er klar (Skall.klar) og får adressen da
    }

    /// Siden i en skjerm havnet i en annen fane enn sin egen (programmert navigering): flytt den dit, og send skjermen hjem igjen
    func flytt(fane: String, url: String, fra: UIViewController?) {
        let j = self.fane(for: fra)
        aapne(fane: fane, url: url)
        if let j = j, let hjem = (ruter[spraak] ?? ruter["no"]!)[safe: j] { gaa(visninger[j], til: "/" + hjem) }
    }

    func hentVentende(_ i: Int) -> String? { defer { ventende[i] = nil }; return ventende[i] }

    private func gaa(_ v: MittvorsViewController?, til url: String) {
        guard let data = try? JSONSerialization.data(withJSONObject: [url]), let json = String(data: data, encoding: .utf8) else { return }
        v?.webView?.evaluateJavaScript("location.href = \(json)[0]", completionHandler: nil)
    }

    func sett(titler: [String: String]) {
        for vc in viewControllers ?? [] { if let t = titler[faner[vc.tabBarItem.tag]], !t.isEmpty { vc.tabBarItem.title = t } }
    }

    /// Gjem linja under en lek (skjermen er lekens), vis den igjen etterpå. Husker ønsket per fane.
    func skjul(_ skal: Bool, fra: UIViewController?) {
        let i = fane(for: fra) ?? selectedIndex
        skjultPer[i] = skal
        oppdaterSkjul()
    }

    private func oppdaterSkjul() { settSkjult(skjultPer[selectedIndex] ?? false) }

    private func settSkjult(_ skal: Bool) {
        guard skal != skjult else { return }
        skjult = skal
        if #available(iOS 18.0, *) {
            setTabBarHidden(skal, animated: true)
        } else {
            UIView.animate(withDuration: 0.22) {
                self.tabBar.transform = skal ? CGAffineTransform(translationX: 0, y: self.tabBar.bounds.height + 40) : .identity
                self.tabBar.alpha = skal ? 0 : 1
            }
        }
    }

    /// Mørk modus er et valg i appen (Deg → Mørk modus), ikke telefonens. Fanelinja følger appen.
    func sett(moerk: Bool) {
        overrideUserInterfaceStyle = moerk ? .dark : .light
        // Den valgte fanen: rust på lys bakgrunn, gul på mørk – ellers drukner den i den mørke linja
        tabBar.tintColor = moerk ? UIColor(red: 1, green: 0.824, blue: 0.247, alpha: 1) : UIColor(red: 0.776, green: 0.235, blue: 0.067, alpha: 1)
    }

    /// Simulator-sjekken på GitHub starter appen med MV_FANE=leker osv. for å ta bilde av hver fane
    func brukStartfane() {
        guard !startfaneBrukt, let f = ProcessInfo.processInfo.environment["MV_FANE"], faner.contains(f) else { return }
        startfaneBrukt = true
        velg(fane: f)
    }

    // MARK: UITabBarControllerDelegate
    func tabBarController(_ tabBarController: UITabBarController, shouldSelect viewController: UIViewController) -> Bool {
        UISelectionFeedbackGenerator().selectionChanged()
        visning(viewController.tabBarItem.tag)
        return true
    }

    func tabBarController(_ tabBarController: UITabBarController, didSelect viewController: UIViewController) {
        oppdaterSkjul()
        setNeedsStatusBarAppearanceUpdate()
    }
}

private extension Array {
    subscript(safe i: Int) -> Element? { indices.contains(i) ? self[i] : nil }
}

/// Capacitor-plugin: nettsiden snakker med skallet. Hver skjerm har sin egen bridge, så pluginen vet hvilken fane som ringer.
/// Skall.klar({titler, lang}) → {ok, fane, gaaTil?, rull, sjekk, moerk}; Skall.aapne({navn, url}); Skall.fane({navn, url}); Skall.skjul({skjult}).
@objc(SkallPlugin)
public class SkallPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "SkallPlugin"
    public let jsName = "Skall"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "klar", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "fane", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "aapne", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "skjul", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "logg", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "tema", returnType: CAPPluginReturnPromise)
    ]

    @objc func tema(_ call: CAPPluginCall) {
        let moerk = call.getBool("moerk") ?? false
        DispatchQueue.main.async {
            SkallViewController.delt?.sett(moerk: moerk)
            call.resolve()
        }
    }

    /// Simulator-sjekken: nettsiden sender feil og en kort tilstand hit, og det havner i Documents/sjekk.log
    @objc func logg(_ call: CAPPluginCall) {
        let tekst = (call.getString("tekst") ?? "") + "\n"
        if let dir = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first {
            let fil = dir.appendingPathComponent("sjekk.log")
            if let h = try? FileHandle(forWritingTo: fil) { h.seekToEndOfFile(); h.write(tekst.data(using: .utf8)!); try? h.close() }
            else { try? tekst.write(to: fil, atomically: true, encoding: .utf8) }
        }
        call.resolve()
    }

    @objc func klar(_ call: CAPPluginCall) {
        let vc = bridge?.viewController
        DispatchQueue.main.async {
            guard let s = SkallViewController.delt else { call.reject("ikke noe skall"); return }
            if let t = call.getObject("titler") {
                var titler: [String: String] = [:]
                for (k, v) in t { if let s = v as? String { titler[k] = s } }
                s.sett(titler: titler)
            }
            if let l = call.getString("lang"), l == "no" || l == "en" { s.spraak = l }
            let i = s.fane(for: vc)
            // rull: simulator-sjekken ber nettsiden bla nedover, så bildet viser linja i krympet stand
            let env = ProcessInfo.processInfo.environment
            var svar: [String: Any] = ["ok": true, "fane": i.map { s.faner[$0] } ?? s.valgtFane, "flere": true,
                                       "rull": env["MV_RULL"] == "1", "sjekk": env["MV_SJEKK"] == "1", "moerk": env["MV_MORK"] == "1"]
            if let i = i, let u = s.hentVentende(i) { svar["gaaTil"] = u }
            call.resolve(svar)
            s.brukStartfane()
        }
    }

    /// Siden står i feil fane (den navigerte selv dit): skallet flytter adressen til riktig fane og sender denne skjermen hjem
    @objc func fane(_ call: CAPPluginCall) {
        let navn = call.getString("navn") ?? "", url = call.getString("url") ?? ""
        let vc = bridge?.viewController
        DispatchQueue.main.async {
            if url.isEmpty { SkallViewController.delt?.velg(fane: navn) } else { SkallViewController.delt?.flytt(fane: navn, url: url, fra: vc) }
            call.resolve()
        }
    }

    /// En lenke til en annen fane: åpne den der
    @objc func aapne(_ call: CAPPluginCall) {
        let navn = call.getString("navn") ?? "", url = call.getString("url") ?? ""
        DispatchQueue.main.async {
            SkallViewController.delt?.aapne(fane: navn, url: url)
            call.resolve()
        }
    }

    @objc func skjul(_ call: CAPPluginCall) {
        let skal = call.getBool("skjult") ?? false
        let vc = bridge?.viewController
        DispatchQueue.main.async {
            SkallViewController.delt?.skjul(skal, fra: vc)
            call.resolve()
        }
    }
}
