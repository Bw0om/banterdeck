import UIKit
import Capacitor

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }

        window = UIWindow(windowScene: windowScene)
        window?.rootViewController = SkallViewController()   // iPhonens egen fanelinje, med nettsiden i (Skall.swift)
        window?.makeKeyAndVisible()

        SceneDelegateProxy.shared.scene(scene, willConnectTo: session, options: connectionOptions)
        // Appen ble startet fra en lenke (AirDrop, Meldinger, QR): rett til rommet i Spill-fanen
        if let u = connectionOptions.urlContexts.first?.url ?? connectionOptions.userActivities.first?.webpageURL {
            _ = SkallViewController.delt?.aapneLenke(u)
        }
    }

    // Lenker inn i appen mens den kjører: skallet åpner dem i riktig fane. Andre lenker går til Capacitor som før.
    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        if let u = URLContexts.first?.url, SkallViewController.delt?.aapneLenke(u) == true { return }
        SceneDelegateProxy.shared.scene(scene, openURLContexts: URLContexts)
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        if userActivity.activityType == NSUserActivityTypeBrowsingWeb, let u = userActivity.webpageURL, SkallViewController.delt?.aapneLenke(u) == true { return }
        SceneDelegateProxy.shared.scene(scene, continue: userActivity)
    }
}
