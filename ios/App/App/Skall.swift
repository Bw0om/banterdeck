import UIKit
import Capacitor

/// Skallet: iPhonens egen fanelinje nederst (Hjem, Spill, Leker, Deg), med nettsiden i. Et trykk på en fane bytter side
/// i nettvisningen, og nettsiden sier fra hvilken fane som er aktiv, og om linja skal gjemmes (under en lek).
/// Linja er iPhonens egen UITabBar, så den ser og kjennes ut som i andre apper – også på iOS 26.
final class SkallViewController: UIViewController, UITabBarDelegate {
    static weak var delt: SkallViewController?

    let nett = MittvorsViewController()
    let linje = UITabBar()
    private let faner = ["hjem", "spill", "leker", "deg"]
    private var nettBunnTilLinje: NSLayoutConstraint!
    private var nettBunnTilKant: NSLayoutConstraint!
    private(set) var skjult = false
    private var startfaneBrukt = false

    override func viewDidLoad() {
        super.viewDidLoad()
        SkallViewController.delt = self
        view.backgroundColor = UIColor(red: 1, green: 0.973, blue: 0.933, alpha: 1)   // #FFF8EE

        addChild(nett)
        nett.view.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(nett.view)
        nett.didMove(toParent: self)

        linje.translatesAutoresizingMaskIntoConstraints = false
        linje.delegate = self
        linje.tintColor = UIColor(red: 0.776, green: 0.235, blue: 0.067, alpha: 1)   // rust, som den aktive fanen på nettsiden
        let symboler: [(String, String)] = [("house", "house.fill"), ("die.face.5", "die.face.5.fill"), ("wineglass", "wineglass.fill"), ("person", "person.fill")]
        let navn = ["Hjem", "Spill", "Leker", "Deg"]
        linje.items = zip(symboler, navn).enumerated().map { (i, p) in
            let el = UITabBarItem(title: p.1, image: UIImage(systemName: p.0.0), selectedImage: UIImage(systemName: p.0.1))
            el.tag = i
            return el
        }
        linje.selectedItem = linje.items?.first
        view.addSubview(linje)

        nettBunnTilLinje = nett.view.bottomAnchor.constraint(equalTo: linje.topAnchor)
        nettBunnTilKant = nett.view.bottomAnchor.constraint(equalTo: view.bottomAnchor)
        NSLayoutConstraint.activate([
            nett.view.topAnchor.constraint(equalTo: view.topAnchor),
            nett.view.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            nett.view.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            nettBunnTilLinje,
            linje.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            linje.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            linje.bottomAnchor.constraint(equalTo: view.bottomAnchor)
        ])
    }

    override var childForStatusBarStyle: UIViewController? { nett }

    /// Fanen som er valgt, som id («hjem», «spill», «leker», «deg»)
    var valgtFane: String { faner[linje.selectedItem?.tag ?? 0] }

    func velg(fane: String) {
        guard let i = faner.firstIndex(of: fane), let el = linje.items?[i] else { return }
        linje.selectedItem = el
    }

    func sett(titler: [String: String]) {
        for el in linje.items ?? [] { if let t = titler[faner[el.tag]], !t.isEmpty { el.title = t } }
    }

    /// Gjem linja under en lek (skjermen er lekens), vis den igjen etterpå
    func skjul(_ skal: Bool) {
        guard skal != skjult else { return }
        skjult = skal
        view.layoutIfNeeded()
        nettBunnTilLinje.isActive = !skal
        nettBunnTilKant.isActive = skal
        UIView.animate(withDuration: 0.22, delay: 0, options: [.curveEaseOut]) {
            self.linje.transform = skal ? CGAffineTransform(translationX: 0, y: self.linje.bounds.height + 40) : .identity
            self.linje.alpha = skal ? 0 : 1
            self.view.layoutIfNeeded()
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

    // MARK: UITabBarDelegate
    func tabBar(_ tabBar: UITabBar, didSelect item: UITabBarItem) {
        UISelectionFeedbackGenerator().selectionChanged()
        gaaTil(fane: faner[item.tag])
    }
}

/// Capacitor-plugin: nettsiden snakker med skallet. Skall.klar({titler}) → {ok, fane}; Skall.fane({navn}); Skall.skjul({skjult}).
@objc(SkallPlugin)
public class SkallPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "SkallPlugin"
    public let jsName = "Skall"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "klar", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "fane", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "skjul", returnType: CAPPluginReturnPromise)
    ]

    @objc func klar(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard let s = SkallViewController.delt else { call.reject("ikke noe skall"); return }
            if let t = call.getObject("titler") {
                var titler: [String: String] = [:]
                for (k, v) in t { if let s = v as? String { titler[k] = s } }
                s.sett(titler: titler)
            }
            call.resolve(["ok": true, "fane": s.valgtFane])
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
