// iPhone-appen: nettsiden kjører inne i et Capacitor-skall (capacitor.config.json). Lastes bare der.
// Her skrus det app-aktige på: vibrering når du trykker, telefonens eget delingsark, statuslinja i appens farge,
// og lenker som åpner appen (mittvors.no/no/rom?k=…).
import { Capacitor, registerPlugin } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
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

  // Vibrasjon som følger det som skjer i leken (rommet sender 'mv-lyd' med samme navn som lydene, også når lyden er av):
  // din tur gir et lite «pling» i hånda, ringen som snurrer tikker som et hjul, må du drikke dunker det to ganger.
  const VIB = {
    tur: () => Haptics.notification({ type: NotificationType.Success }),
    slurk: () => Haptics.impact({ style: ImpactStyle.Heavy }).then(() => new Promise((r) => setTimeout(r, 140))).then(() => Haptics.impact({ style: ImpactStyle.Heavy })),
    bom: () => Haptics.notification({ type: NotificationType.Error }),
    knus: () => Haptics.notification({ type: NotificationType.Error }),
    tikk: () => Haptics.selectionChanged(),
    naa: () => Haptics.impact({ style: ImpactStyle.Medium }),
    pek: () => Haptics.impact({ style: ImpactStyle.Medium }),
    svar: () => Haptics.impact({ style: ImpactStyle.Light }),
    ding: () => Haptics.impact({ style: ImpactStyle.Light }),
    pop: () => Haptics.impact({ style: ImpactStyle.Light }),
    grip: () => Haptics.impact({ style: ImpactStyle.Light }),
  };
  document.addEventListener('mv-lyd', (e) => { const f = VIB[e.detail]; if (f) f().catch(() => {}); });

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

  // Statuslinja (klokke, batteri) følger lys/mørk modus: mørk tekst på lys bakgrunn, lys tekst på mørk
  const statuslinje = () => StatusBar.setStyle({ style: h.dataset.theme === 'dark' ? Style.Dark : Style.Light }).catch(() => {});
  statuslinje();
  new MutationObserver(statuslinje).observe(h, { attributes: true, attributeFilter: ['data-theme'] });
  document.addEventListener('astro:after-swap', statuslinje);
  SplashScreen.hide().catch(() => {});

  // Skallet (ios/App/App/Skall.swift): iPhonens egen fanelinje nederst. Finnes den, gjemmer nettsiden sin egen
  // (html.har-skall), sier fra hvilken fane som er aktiv, og ber linja gjemme seg under en lek.
  const Skall = registerPlugin('Skall');
  const FANER = { hjem: ['/no/', '/'], spill: ['/no/rom', '/room'], leker: ['/no/drinking-games', '/drinking-games'], deg: ['/no/account', '/account'] };
  const engelsk = () => !location.pathname.startsWith('/no');
  const norm = (p) => p.replace(/\/$/, '') || '/';
  window.__mvFane = (id) => { const r = FANER[id]; if (!r) return; const maal = engelsk() ? r[1] : r[0]; if (norm(location.pathname) !== norm(maal)) location.href = maal; };
  const fanenNaa = () => { const p = norm(location.pathname); for (const id in FANER) if (FANER[id].some((r) => norm(r) === p)) return id; return ''; };
  let harSkall = false, sistFane = '', sistSkjult = null;
  const synkSkall = () => {
    if (!harSkall) return;
    const f = fanenNaa(); if (f && f !== sistFane) { sistFane = f; Skall.fane({ navn: f }).catch(() => {}); }
    const skjul = h.classList.contains('i-spill') || h.classList.contains('bli-med');
    if (skjul !== sistSkjult) { sistSkjult = skjul; Skall.skjul({ skjult: skjul }).catch(() => {}); }
  };
  Skall.klar({ titler: engelsk() ? { hjem: 'Home', spill: 'Play', leker: 'Games', deg: 'You' } : { hjem: 'Hjem', spill: 'Spill', leker: 'Leker', deg: 'Deg' } })
    .then(() => { harSkall = true; h.classList.add('har-skall'); synkSkall(); }).catch(() => {});
  document.addEventListener('astro:page-load', synkSkall);
  new MutationObserver(synkSkall).observe(h, { attributes: true, attributeFilter: ['class'] });

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
    try {
      const u = new URL(url); if (!/(^|\.)mittvors\.no$/.test(u.hostname)) return;
      // mittvors.no/ABCD (QR-koden) er en omdirigering på serveren – i appen går vi rett til rommet
      const kode = u.pathname.match(/^\/([A-Za-z0-9]{4,6})\/?$/);
      location.href = kode ? '/no/rom?k=' + kode[1].toUpperCase() : (u.pathname === '/' ? '/no/rom' : u.pathname) + u.search + u.hash;
    } catch (e) {}
  });
}
