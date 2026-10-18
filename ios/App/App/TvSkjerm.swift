import UIKit
import WebKit
import Capacitor

/// TV-en via AirPlay: når telefonen speiles, tar appen over TV-en og viser storskjermen (mittvors.no/no/tv) der,
/// mens telefonen beholder sin egen visning. Nettsiden sier hvilken adresse TV-en skal vise (Skjerm.vis).
final class TvSkjerm {
    static let delt = TvSkjerm()
    var url: URL? { didSet { last() } }
    private(set) var vindu: UIWindow?
    private weak var nett: WKWebView?
    var koblet: Bool { vindu != nil }
    var vedEndring: ((Bool) -> Void)?

    func kobleTil(_ scene: UIWindowScene) {
        let v = UIWindow(windowScene: scene)
        let vc = UIViewController()
        vc.view.backgroundColor = UIColor(red: 1, green: 0.973, blue: 0.933, alpha: 1)
        let k = WKWebViewConfiguration()
        k.allowsInlineMediaPlayback = true
        k.mediaTypesRequiringUserActionForPlayback = []   // lyden fra storskjermen skal gå uten at noen trykker på TV-en
        let w = WKWebView(frame: vc.view.bounds, configuration: k)
        w.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        w.isOpaque = false
        w.backgroundColor = vc.view.backgroundColor
        vc.view.addSubview(w)
        v.rootViewController = vc
        v.isHidden = false
        vindu = v
        nett = w
        last()
        vedEndring?(true)
    }

    func kobleFra() {
        vindu?.isHidden = true
        vindu = nil
        nett = nil
        vedEndring?(false)
    }

    private func last() {
        guard let w = nett else { return }
        if let u = url {
            if w.url != u { w.load(URLRequest(url: u)) }
        } else {
            w.loadHTMLString(ventHtml, baseURL: nil)
        }
    }

    // Vises på TV-en til rommet har en storskjerm-lenke
    private let ventHtml = "<!doctype html><meta charset=\"utf-8\"><body style=\"margin:0;height:100vh;display:grid;place-items:center;background:#FFF8EE;font-family:-apple-system,sans-serif;font-size:6vh;font-weight:900;color:#16120F\"><div><span style=\"background:#FFD23F;border:.4vh solid #16120F;border-radius:2vh;padding:1vh 3vh;box-shadow:.8vh .8vh 0 #16120F\">mittvors</span></div></body>"
}

/// Scenen for den eksterne skjermen (AirPlay eller HDMI)
class TvSceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let ws = scene as? UIWindowScene else { return }
        TvSkjerm.delt.kobleTil(ws)
        window = TvSkjerm.delt.vindu
    }

    func sceneDidDisconnect(_ scene: UIScene) {
        TvSkjerm.delt.kobleFra()
    }
}

/// Capacitor-plugin: nettsiden styrer TV-en. Skjerm.vis({url}), Skjerm.skjul(), Skjerm.status() → {koblet}; hendelsen «koblet».
@objc(SkjermPlugin)
public class SkjermPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "SkjermPlugin"
    public let jsName = "Skjerm"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "vis", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "skjul", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "status", returnType: CAPPluginReturnPromise)
    ]

    public override func load() {
        TvSkjerm.delt.vedEndring = { [weak self] k in
            self?.notifyListeners("koblet", data: ["koblet": k])
        }
    }

    @objc func vis(_ call: CAPPluginCall) {
        guard let s = call.getString("url"), let u = URL(string: s) else { call.reject("url mangler"); return }
        DispatchQueue.main.async {
            TvSkjerm.delt.url = u
            call.resolve(["koblet": TvSkjerm.delt.koblet])
        }
    }

    @objc func skjul(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            TvSkjerm.delt.url = nil
            call.resolve()
        }
    }

    @objc func status(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            call.resolve(["koblet": TvSkjerm.delt.koblet])
        }
    }
}

/// Sidene ligger som mapper i app-pakken (no/rom/index.html), slik Astro bygger dem. Capacitors egen ruter
/// sender alt uten filendelse til én index.html (laget for apper med én side) – denne finner riktig fil.
struct MittvorsRuter: Router {
    var basePath: String = ""
    func route(for path: String) -> String {
        let fm = FileManager.default
        var sti = path
        if sti.hasSuffix("/") { sti.removeLast() }
        if !sti.isEmpty && !URL(fileURLWithPath: sti).pathExtension.isEmpty && fm.fileExists(atPath: basePath + sti) { return basePath + sti }
        if fm.fileExists(atPath: basePath + sti + "/index.html") { return basePath + sti + "/index.html" }
        if fm.fileExists(atPath: basePath + sti + ".html") { return basePath + sti + ".html" }
        return basePath + (fm.fileExists(atPath: basePath + "/404.html") ? "/404.html" : "/index.html")
    }
}

/// Telefonens visning, med Skjerm-pluginen registrert
class MittvorsViewController: CAPBridgeViewController {
    override open func router() -> Router {
        return MittvorsRuter()
    }
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(SkjermPlugin())
        bridge?.registerPluginInstance(SkallPlugin())
        // Hold-trykk på en lenke skal ikke vise forhåndsvisning med nettadressen – det er en app, ikke en nettside
        webView?.allowsLinkPreview = false
    }
}
