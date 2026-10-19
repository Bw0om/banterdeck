import UIKit
import Capacitor

/// Skallet: iPhonens egen fanelinje nederst (Hjem, Spill, Leker, Deg), med nettsiden i. Et trykk på en fane bytter side
/// i nettvisningen, og nettsiden sier fra hvilken fane som er aktiv, og om linja skal gjemmes (under en lek).
/// Linja er iPhonens egen (UITabBarController), så den ser og kjennes ut som i andre apper: på iOS 26 krymper den
/// til en liten knapp når du blar nedover, og kommer tilbake når du blar opp.
final class SkallViewController: UITabBarController, UITabBarControllerDelegate {
    static weak var delt: SkallViewController?

    let nett = MittvorsViewController()
    private let faner = ["hjem", "spill", "leker", "deg"]
    private(set) var skjult = false
    private var startfaneBrukt = false

    override func viewDidLoad() {
        super.viewDidLoad()
        SkallViewController.delt = self
        delegate = self
        view.backgroundColor = UIColor(red: 1, green: 0.973, blue: 0.933, alpha: 1)   // #FFF8EE
        tabBar.tintColor = UIColor(red: 0.776, green: 0.235, blue: 0.067, alpha: 1)   // rust, som den aktive fanen på nettsiden

        // Fire tomme sider i fanelinja. Nettsiden (én og samme nettvisning) flyttes inn i den som er valgt.
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
        flyttNett(til: viewControllers![0])
    }

    override var childForStatusBarStyle: UIViewController? { nett }

    /// Nettvisningen bor i den valgte fanen – samme side, samme tilstand, uansett hvilken fane som er trykket
    private func flyttNett(til vc: UIViewController) {
        guard nett.parent !== vc else { return }
        if nett.parent != nil { nett.willMove(toParent: nil); nett.view.removeFromSuperview(); nett.removeFromParent() }
        vc.addChild(nett)
        nett.view.translatesAutoresizingMaskIntoConstraints = false
        vc.view.addSubview(nett.view)
        NSLayoutConstraint.activate([
            nett.view.topAnchor.constraint(equalTo: vc.view.topAnchor),
            nett.view.leadingAnchor.constraint(equalTo: vc.view.leadingAnchor),
            nett.view.trailingAnchor.constraint(equalTo: vc.view.trailingAnchor),
            nett.view.bottomAnchor.constraint(equalTo: vc.view.bottomAnchor)
        ])
        nett.didMove(toParent: vc)
    }

    /// Fanen som er valgt, som id («hjem», «spill», «leker», «deg»)
    var valgtFane: String { faner[min(selectedIndex, faner.count - 1)] }

    func velg(fane: String) {
        guard let i = faner.firstIndex(of: fane), i != selectedIndex, let vc = viewControllers?[i] else { return }
        selectedIndex = i
        flyttNett(til: vc)
    }

    func sett(titler: [String: String]) {
        for vc in viewControllers ?? [] { if let t = titler[faner[vc.tabBarItem.tag]], !t.isEmpty { vc.tabBarItem.title = t } }
    }

    /// Gjem linja under en lek (skjermen er lekens), vis den igjen etterpå
    func skjul(_ skal: Bool) {
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

    /// Simulator-sjekken på GitHub starter appen med MV_FANE=leker osv. for å ta bilde av hver fane
    func brukStartfane() {
        guard !startfaneBrukt, let f = ProcessInfo.processInfo.environment["MV_FANE"], faner.contains(f) else { return }
        startfaneBrukt = true
        velg(fane: f)
        gaaTil(fane: f)
    }

    private func gaaTil(fane: String) {
        nett.webView?.evaluateJavaScript("window.__mvFane && window.__mvFane('\(fane)')", completionHandler: nil)
    }

    // MARK: UITabBarControllerDelegate
    func tabBarController(_ tabBarController: UITabBarController, shouldSelect viewController: UIViewController) -> Bool {
        UISelectionFeedbackGenerator().selectionChanged()
        flyttNett(til: viewController)
        gaaTil(fane: faner[viewController.tabBarItem.tag])
        return true
    }
}

/// Capacitor-plugin: nettsiden snakker med skallet. Skall.klar({titler}) → {ok, fane, rull}; Skall.fane({navn}); Skall.skjul({skjult}).
@objc(SkallPlugin)
public class SkallPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "SkallPlugin"
    public let jsName = "Skall"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "klar", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "fane", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "skjul", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "logg", returnType: CAPPluginReturnPromise)
    ]

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
        DispatchQueue.main.async {
            guard let s = SkallViewController.delt else { call.reject("ikke noe skall"); return }
            if let t = call.getObject("titler") {
                var titler: [String: String] = [:]
                for (k, v) in t { if let s = v as? String { titler[k] = s } }
                s.sett(titler: titler)
            }
            // rull: simulator-sjekken ber nettsiden bla nedover, så bildet viser linja i krympet stand
            call.resolve(["ok": true, "fane": s.valgtFane, "rull": ProcessInfo.processInfo.environment["MV_RULL"] == "1", "sjekk": ProcessInfo.processInfo.environment["MV_SJEKK"] == "1"])
            s.brukStartfane()
        }
    }

    @objc func fane(_ call: CAPPluginCall) {
        let navn = call.getString("navn") ?? ""
        DispatchQueue.main.async {
            SkallViewController.delt?.velg(fane: navn)
            call.resolve()
        }
    }

    @objc func skjul(_ call: CAPPluginCall) {
        let skal = call.getBool("skjult") ?? false
        DispatchQueue.main.async {
            SkallViewController.delt?.skjul(skal)
            call.resolve()
        }
    }
}
