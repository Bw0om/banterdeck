// iPhone-appen: nettsiden kjører inne i et Capacitor-skall (capacitor.config.json). Lastes bare der.
// Her skrus det app-aktige på: vibrering når du trykker, telefonens eget delingsark, statuslinja i appens farge,
// og lenker som åpner appen (mittvors.no/no/rom?k=…).
import { Capacitor, registerPlugin } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Share } from '@capacitor/share';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { App } from '@capacitor/app';

if (Capacitor.isNativePlatform() && !window.__mvApp) {
  window.__mvApp = true;
  const h = document.documentElement;
  h.classList.add('is-app', 'is-standalone');

  // Et lite dunk i fingeren på hver knapp, litt mer på de store
  document.addEventListener('click', (e) => {
    const b = e.target.closest && e.target.closest('button, .btn, [role="button"]');
    if (!b || b.disabled) return;
    const stor = b.matches('.btn.gold, .rom-stor-knapp, .reaksjon, .tool.dice');
    Haptics.impact({ style: stor ? ImpactStyle.Medium : ImpactStyle.Light }).catch(() => {});
  }, true);

  // Deling går gjennom telefonens delingsark. Bilder (tavla) deles som før, om nettleseren kan.
  const egen = navigator.share ? navigator.share.bind(navigator) : null;
  const kanFiler = navigator.canShare ? navigator.canShare.bind(navigator) : () => false;
  try {
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: (d) => {
        d = d || {};
        if (d.files && d.files.length) return egen && kanFiler(d) ? egen(d) : Share.share({ title: d.title, text: d.text });
        return Share.share({ title: d.title, text: d.text, url: d.url, dialogTitle: d.title });
      },
    });
  } catch (e) {}

  // Statuslinja: mørk tekst, siden toppen alltid er oransje (theme-color)
  StatusBar.setStyle({ style: Style.Light }).catch(() => {});
  SplashScreen.hide().catch(() => {});

  // TV-en via AirPlay: appen viser storskjermen på TV-en (ios/App/App/TvSkjerm.swift). Rommet sier hvilken lenke.
  const Skjerm = registerPlugin('Skjerm');
  let sistUrl = '';
  window.__mvSkjerm = {
    koblet: false,
    vis(url) { if (url === sistUrl) return; sistUrl = url; Skjerm.vis({ url }).catch(() => {}); },
    skjul() { sistUrl = ''; Skjerm.skjul().catch(() => {}); },
  };
  const skjermStatus = (r) => { window.__mvSkjerm.koblet = !!(r && r.koblet); window.dispatchEvent(new CustomEvent('mv-skjerm', { detail: { koblet: window.__mvSkjerm.koblet } })); };
  Skjerm.status().then(skjermStatus).catch(() => {});
  Skjerm.addListener('koblet', skjermStatus);

  // Trykker noen på en mittvors-lenke i Messenger eller Snap, åpner den her i appen
  App.addListener('appUrlOpen', ({ url }) => {
    try { const u = new URL(url); if (/(^|\.)mittvors\.no$/.test(u.hostname)) location.href = u.pathname + u.search + u.hash; } catch (e) {}
  });
}
