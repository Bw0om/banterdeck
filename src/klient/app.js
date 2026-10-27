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
  // Vibrasjonsmønstre fra lekene (rom.js vibrer): tall eller [på, pause, på …] i ms – oversatt til iOS-haptikk.
  // Korte støt blir et lett dunk, lengre et tungt, og pausene holdes så rytmen kjennes igjen (bomba, nedtellingen, skålet).
  let vibKo = Promise.resolve();
  document.addEventListener('mv-vibrer', (e) => {
    const m = Array.isArray(e.detail) ? e.detail : [Number(e.detail) || 0];
    vibKo = vibKo.then(async () => {
      for (let i = 0; i < m.length; i++) {
        const ms = m[i];
        if (i % 2 === 1) { await new Promise((r) => setTimeout(r, Math.min(600, ms))); continue; }   // pause
        if (ms <= 0) continue;
        if (ms < 30) await Haptics.selectionChanged();
        else if (ms < 100) await Haptics.impact({ style: ImpactStyle.Light });
        else if (ms < 200) await Haptics.impact({ style: ImpactStyle.Medium });
        else { await Haptics.impact({ style: ImpactStyle.Heavy }); if (ms >= 300) { await new Promise((r) => setTimeout(r, 120)); await Haptics.impact({ style: ImpactStyle.Heavy }); } }
      }
    }).catch(() => {});
  });

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
  const statuslinje = () => {
    const moerk = h.dataset.theme === 'dark';
    StatusBar.setStyle({ style: moerk ? Style.Dark : Style.Light }).catch(() => {});
    if (Capacitor.isPluginAvailable('Skall')) registerPlugin('Skall').tema({ moerk }).catch(() => {});   // fanelinja følger appens mørke modus
  };
  statuslinje();
  new MutationObserver(statuslinje).observe(h, { attributes: true, attributeFilter: ['data-theme'] });
  document.addEventListener('astro:after-swap', statuslinje);
  SplashScreen.hide().catch(() => {});

  // Skallet (ios/App/App/Skall.swift): iPhonens egen fanelinje nederst, med én skjerm (nettvisning) per fane.
  // Finnes det, gjemmer nettsiden sin egen linje (html.har-skall), åpner lenker til andre faner i riktig fane,
  // og ber linja gjemme seg under en lek.
  const Skall = registerPlugin('Skall');
  // Forsiden på nettet (/ og /no/) er Spill-fanens startskjerm i appen – skallet bytter adressen (Skall.swift, aapne)
  const FANER = { spill: ['/no/rom', '/room', '/no/', '/'], leker: ['/no/drinking-games', '/drinking-games'], deg: ['/no/account', '/account'] };
  const engelsk = () => !location.pathname.startsWith('/no');
  const norm = (p) => p.replace(/\/$/, '') || '/';
  window.__mvFane = (id) => { const r = FANER[id]; if (!r) return; const maal = engelsk() ? r[1] : r[0]; if (norm(location.pathname) !== norm(maal)) location.href = maal; };
  const fanenFor = (sti) => { const p = norm(sti); for (const id in FANER) if (FANER[id].some((r) => norm(r) === p)) return id; return ''; };
  const fanenNaa = () => fanenFor(location.pathname);
  let harSkall = false, minFane = '', sistSkjult = null;
  if (Capacitor.isPluginAvailable('Skall')) h.classList.add('har-skall');
  const synkSkall = () => {
    if (!harSkall) return;
    // Siden havnet i en annen fane enn skjermen den står i (navigerte selv dit): skallet flytter den til riktig fane
    const f = fanenNaa(); if (f && minFane && f !== minFane) { Skall.fane({ navn: f, url: location.pathname + location.search }).catch(() => {}); return; }
    const skjul = h.classList.contains('i-spill') || h.classList.contains('bli-med');
    if (skjul !== sistSkjult) { sistSkjult = skjul; Skall.skjul({ skjult: skjul }).catch(() => {}); }
  };
  // Lenker til en annen fane (f.eks. «Spill i rommet» fra en lekeside) åpnes i den fanen – denne skjermen blir stående
  document.addEventListener('click', (e) => {
    if (!harSkall || !e.target.closest) return;
    const a = e.target.closest('a[href]'); if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
    let u; try { u = new URL(a.href, location.href); } catch (x) { return; }
    if (u.origin !== location.origin) return;
    const f = fanenFor(u.pathname); if (!f || f === minFane) return;
    e.preventDefault();
    Skall.aapne({ navn: f, url: u.pathname + u.search }).catch(() => { location.href = u.href; });
  }, true);
  // Siden sier hvilken skjerm den viser (rom.js meldSkjerm): på startskjermen legger skallet sin egen native startskjerm oppå
  let sistSkjerm = window.__mvSisteSkjerm || null;   // en side kan ha meldt skjermen sin før dette skriptet lyttet (lekelista)
  let skjermLogg = '';   // simulator-sjekken: hva som ble sendt til skallet
  const sendSkjerm = () => { if (harSkall && sistSkjerm) { skjermLogg += ' ' + sistSkjerm.skjerm + '>'; Skall.skjerm(sistSkjerm).then(() => { skjermLogg += 'ok'; }).catch((x) => { skjermLogg += 'FEIL(' + (x && x.message || x) + ')'; }); } };
  document.addEventListener('mv-skjerm', (e) => { sistSkjerm = e.detail || {}; skjermLogg += ' hendelse:' + sistSkjerm.skjerm + (harSkall ? '' : '(venter)'); sendSkjerm(); });
  // Lobbyen: «Alle lekene» åpner det native lekvelger-arket (ios/App/App/VelgerArk.swift)
  document.addEventListener('mv-velger', (e) => { if (harSkall) Skall.velger(e.detail || {}).catch(() => {}); });
  // Pluss i appen: kjøp med App Store (StoreKit) – serveren sjekker Apples kvittering og gir Pluss på kontoen
  const kontoSvar = (sti, opts) => {
    const K = window.BDKonto; if (!K || !K.api) return Promise.resolve({ feil: 'logg-inn' });
    return K.api(sti, Object.assign({ headers: { 'x-lang': engelsk() ? 'en' : 'no', 'content-type': 'application/json' } }, opts || {}))
      .then((r) => r.json().then((d) => Object.assign({ innlogget: !!(K.les && K.les()) }, d)).catch(() => ({ feil: 'server' })))
      .catch(() => ({ feil: 'server' }));
  };
  window.__mvPluss = {
    status: () => kontoSvar('/api/pluss/status'),
    gratis: () => kontoSvar('/api/pluss/gratis', { method: 'POST' }),
    apple: (jws) => kontoSvar('/api/pluss/apple', { method: 'POST', body: JSON.stringify({ jws }) }),
    ferdig: () => { try { window.__mvPlussEtter && window.__mvPlussEtter(); } catch (e) {} },
  };
  document.addEventListener('mv-pluss', (e) => { if (harSkall) Skall.pluss(e.detail || {}).catch(() => {}); });
  // Pluss-siden i appen: «Kjøp med Vipps» blir «Kjøp», og åpner arket
  const plussSide = () => {
    if (!harSkall) return;
    document.querySelectorAll('[data-kjop]').forEach((b) => { b.textContent = engelsk() ? 'Buy' : 'Kjøp'; b.dataset.app = '1'; });
  };
  document.addEventListener('click', (e) => {
    if (!harSkall || !e.target.closest) return;
    const b = e.target.closest('[data-kjop][data-app]'); if (!b) return;
    e.preventDefault(); e.stopImmediatePropagation();
    document.dispatchEvent(new CustomEvent('mv-pluss', { detail: { produkt: b.dataset.kjop } }));
  }, true);
  document.addEventListener('astro:page-load', plussSide);
  // Kontoen i appen: logg inn / ny konto / lenke som native ark (ios/App/App/LoggInnArk.swift). Nettsiden gjør jobben.
  const kontoFeil = (r) => r.json().catch(() => ({})).then((d) => ({ feil: d.feil || 'feil', melding: d.melding || (engelsk() ? 'Something went wrong. Try again.' : 'Noe gikk galt. Prøv igjen.') }));
  const loggInnMed = (d) => { const K = window.BDKonto; if (K && K.lagre) K.lagre({ access_token: d.access_token, refresh_token: d.refresh_token }); return { ok: true }; };
  const tilbake = () => (window.__MV_ORIGIN || location.origin) + (engelsk() ? '/account' : '/no/account');
  window.__mvKonto = {
    inn: (navn, pw) => fetch('/api/konto/logginn', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ navn, passord: pw }) })
      .then((r) => r.ok ? r.json().then(loggInnMed) : kontoFeil(r)).catch(() => ({ feil: 'nett', melding: engelsk() ? 'No connection. Try again.' : 'Ingen kontakt. Prøv igjen.' })),
    ny: (epost, navn, pw) => fetch('/api/konto/registrer', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ epost, brukernavn: navn, passord: pw }) })
      .then((r) => r.ok ? r.json().then((d) => d.access_token ? loggInnMed(d) : { ok: true, sendt: true, melding: engelsk() ? 'Check your email and confirm the account.' : 'Sjekk e-posten din og bekreft kontoen.' }) : kontoFeil(r))
      .catch(() => ({ feil: 'nett', melding: engelsk() ? 'No connection. Try again.' : 'Ingen kontakt. Prøv igjen.' })),
    lenke: (epost) => { const K = window.BDKonto; if (!K || !K.sb) return Promise.resolve({ feil: 'ikke-klar' }); return K.sb('/auth/v1/otp?redirect_to=' + encodeURIComponent(tilbake()), { method: 'POST', body: JSON.stringify({ email: epost, create_user: true }) })
      .then((r) => r.ok ? { ok: true, sendt: true, melding: engelsk() ? 'The link is sent – check your email.' : 'Lenken er sendt – sjekk e-posten.' } : kontoFeil(r)).catch(() => ({ feil: 'nett' })); },
    glemt: (epost) => { const K = window.BDKonto; if (!K || !K.sb) return Promise.resolve({ feil: 'ikke-klar' }); return K.sb('/auth/v1/recover?redirect_to=' + encodeURIComponent(tilbake()), { method: 'POST', body: JSON.stringify({ email: epost }) })
      .then((r) => r.ok ? { ok: true, sendt: true, melding: engelsk() ? 'We’ve sent a link to set a new password.' : 'Vi har sendt en lenke for å sette nytt passord.' } : kontoFeil(r)).catch(() => ({ feil: 'nett' })); },
    innlogget: () => { const K = window.BDKonto; return !!(K && K.les && K.les()); },
  };
  // Deg-siden: «Logg inn» / «Ny konto» åpner arket i stedet for skjemaet under
  document.addEventListener('click', (e) => {
    if (!harSkall || !e.target.closest) return;
    // Bare disse to – tilbakepila på kontosiden heter data-vis="profil". (Sjekken under lå en gang inne i kommentaren: da stoppet
    // denne lytteren HVERT trykk på nettsiden i appen – Alle lekene, Mer og alle knappene i lekene var døde.)
    const a = e.target.closest('[data-vis="inn"], [data-vis="ny"]');
    if (!a) return;
    e.preventDefault(); e.stopImmediatePropagation();
    Skall.logginn({ del: a.dataset.vis === 'ny' ? 'ny' : 'inn' }).catch(() => {});
  }, true);
  // Skrivefelt i lekene: iOS-dialog med feltene (rom.js beskriver skjemaet, skallet viser det, svaret sendes tilbake)
  document.addEventListener('mv-skjema', (e) => { if (harSkall) Skall.skjema(e.detail || {}).catch(() => {}); });
  // Et nettark (Mer, Stua, uke, regler …) er oppe: den native skjermen trekker seg til side så lenge
  document.addEventListener('mv-ark-aapen', (e) => { if (harSkall) Skall.arkAapen(e.detail || {}).catch(() => {}); });
  // «Si noe» i stua: iOS-dialog med tekstfelt (tastaturet håndteres av iOS)
  document.addEventListener('mv-si', (e) => { if (harSkall) Skall.si(e.detail || {}).catch(() => {}); });
  document.addEventListener('mv-stua', (e) => { if (harSkall && Skall.stua) Skall.stua(e.detail || {}).catch(() => {}); });
  // «Figuren din» og «Rommet» som native ark (ios/App/App/FigurArk.swift, RomArk.swift)
  document.addEventListener('mv-ark', (e) => { if (harSkall) Skall.ark(e.detail || {}).catch(() => {}); });
  // Inviter: iPhonens eget delingsark, med AirDrop øverst
  document.addEventListener('mv-del', (e) => { if (harSkall) Skall.del(e.detail || {}).catch(() => {}); });
  Skall.klar({ titler: engelsk() ? { spill: 'Play', leker: 'Games', deg: 'You' } : { spill: 'Spill', leker: 'Leker', deg: 'Deg' }, lang: engelsk() ? 'en' : 'no' })
    .then((r) => {
      harSkall = true; minFane = (r && r.fane) || fanenNaa(); h.classList.add('har-skall');
      if (r && r.gaaTil) { location.replace(r.gaaTil); return; }   // skjermen ble åpnet for en bestemt adresse
      synkSkall(); sendSkjerm(); plussSide();
      if (r && r.rull) setTimeout(() => window.scrollTo({ top: 700, behavior: 'smooth' }), 1500);
      if (r && r.moerk) h.dataset.theme = 'dark';   // simulator-sjekken: bilde i mørk modus
      if (r && r.sjekk) {
        // Simulator-sjekken: feil og en kort tilstand går til Documents/sjekk.log, som jobben henter ut
        const logg = (t) => Skall.logg({ tekst: new Date().toISOString().slice(11, 19) + ' ' + t }).catch(() => {});
        window.addEventListener('error', (e) => logg('FEIL ' + e.message + ' @ ' + (e.filename || '') + ':' + (e.lineno || '')));
        window.addEventListener('unhandledrejection', (e) => logg('AVVIST ' + (e.reason && e.reason.message || e.reason)));
        logg('side ' + location.pathname + ' klasser=' + h.className);
        setTimeout(() => {
          const stue = document.querySelector('.st-stue svg');
          const res = performance.getEntriesByType('resource').filter((x) => x.responseStatus >= 400 || (x.transferSize === 0 && x.decodedBodySize === 0 && !/^data:/.test(x.name))).map((x) => x.name.replace(/^.*\/\/[^/]+/, '')).slice(0, 15);
          logg('skjermer:' + skjermLogg + ' leker=' + (window.__mvLekerStatus || '-') + ' klasser=' + h.className);
          const ss = document.getElementById('romStartStua'), sr = ss && ss.getBoundingClientRect(), hs = getComputedStyle(h);
          logg('startstua: ' + (ss ? Math.round(sr.top) + ',' + Math.round(sr.left) + ' ' + Math.round(sr.width) + 'x' + Math.round(sr.height) + ' pos=' + getComputedStyle(ss).position + ' topp-var=' + h.style.getPropertyValue('--mv-stua-topp') + ' bredde-var=' + h.style.getPropertyValue('--mv-stua-bredde') : 'mangler') + ' __mvStart=' + !!window.__mvStart + ' sat=' + hs.getPropertyValue('--sat'));
          logg('etter 6s: stue-svg=' + (stue ? stue.children.length + ' barn, ' + Math.round(stue.getBoundingClientRect().height) + 'px' : 'mangler') + ' main-topp=' + Math.round((document.querySelector('.main') || document.body).getBoundingClientRect().top) + ' safe-top=' + getComputedStyle(h).getPropertyValue('--sat') + ' main-padding=' + getComputedStyle(document.querySelector('.main') || document.body).paddingTop + ' helt-topp=' + (document.querySelector('.st-helt') ? Math.round(document.querySelector('.st-helt').getBoundingClientRect().top) : '-') + ' body-bg=' + getComputedStyle(document.body).backgroundColor + ' html-bg=' + getComputedStyle(h).backgroundColor + ' vw=' + innerWidth + 'x' + innerHeight + ' ressurser-feilet=' + JSON.stringify(res));
        }, 6000);
        setTimeout(() => logg('etter 14s: skjermer:' + skjermLogg + ' leker=' + (window.__mvLekerStatus || '-')), 14000);
      }
    }).catch(() => {});
  document.addEventListener('astro:page-load', synkSkall);
  // Tilbake fra en dypere side (drag fra venstre kant): siden kommer fra hurtigminnet uten å laste på nytt – si fra om skjermen igjen
  window.addEventListener('pageshow', (e) => { if (e.persisted && harSkall) { synkSkall(); sendSkjerm(); } });
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
    if (harSkall) return;   // Swift-skallet åpner lenka selv, i Spill-fanen (SceneDelegate.swift)
    try {
      const u = new URL(url); if (!/(^|\.)mittvors\.no$/.test(u.hostname)) return;
      // mittvors.no/ABCD (QR-koden) er en omdirigering på serveren – i appen går vi rett til rommet
      const kode = u.pathname.match(/^\/([A-Za-z0-9]{4,6})\/?$/);
      location.href = kode ? '/no/rom?k=' + kode[1].toUpperCase() : (u.pathname === '/' ? '/no/rom' : u.pathname) + u.search + u.hash;
    } catch (e) {}
  });
}
