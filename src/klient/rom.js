// Rommet («Spill sammen» / «Play together»): all klientkode for /no/rom og /room.
// Ligger i en egen fil i stedet for inne i HTML-en: nettleseren og service workeren lagrer den, de to
// språkversjonene deler den, og telefonen slipper å tolke 200 kB JavaScript på nytt hver gang rommet åpnes.
// Startes fra Rom.astro ved hver sidevisning (astro:page-load), med lekenavnene og språket som argumenter.
import { lagStua, figurHtml, utseende, PYNT_SVG, BEVEG_SVG, hodeHtml, synkAnimasjoner } from './stua.js';
import { lagFigurVelger, FV_NAVN, FV_FARGENAVN, FV_SKJEGGNAVN, FV_FRISYRENAVN, FV_BOKS } from './figurvelger.js';
import { klistremerke } from '../lib/klistremerker';
import { TEMAER, temaLov, pyntNavn, PYNT, EKSTRA, sesong, STIL, STIL_PLUSS, FRISYRER, SKJEGG, FARGER, FARGBAR, synligPynt } from '../lib/pynt.js';

export function startRom(LEKNAVN, LANG) {
  // Språk: samme kode for /no/rom og /room. T('norsk', 'English') velger tekst.
  var EN = LANG === 'en';
  function T(no, en) { return EN ? en : no; }
  var LOKALE = EN ? 'en-GB' : 'nb-NO';
  var RUTE = EN
    ? { rom: '/room', pluss: '/plus', gjeng: '/crew', konto: '/account', leker: '/drinking-games', hjem: '/en' }
    : { rom: '/no/rom', pluss: '/no/pluss', gjeng: '/no/gjeng', konto: '/no/account', leker: '/no/drinking-games', hjem: '/no/' };
  var root = document.getElementById('rom');
  if (!root || root.dataset.bound) return; root.dataset.bound = '1';
  if (window.__bdRomStopp) window.__bdRomStopp();

  var kode = (new URLSearchParams(location.search).get('k') || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
  // Norsk først. Har man selv valgt engelsk med språklenken i rommet (bd_romsprak), huskes det.
  if (!EN && kode && les('bd_romsprak') === 'en') { location.replace('/room' + location.search); return; }
  var qs = new URLSearchParams(location.search);
  var onsketLek = LEKNAVN[qs.get('lek') || ''] ? qs.get('lek') : '', onsketModus = (qs.get('modus') || '').slice(0, 20), visAlle = false;
  // iPhone-appen (html.is-app settes i Base.astro): lobbyen har ett mål – start en lek. Resten ligger bak «Mer» (appMer).
  var erApp = document.documentElement.classList.contains('is-app'), appMer = false;
  // Skannet QR-koden på TV-en: husk TV-koden, og gå til rommet du er i (verten kobler den når rommet er lastet)
  var tvKobl = (qs.get('tv') || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
  if (tvKobl) {
    try { sessionStorage.setItem('mv_tv_kobl', tvKobl); } catch (e) {}
    if (!kode) { var tvRom = sistRom(); if (tvRom) { location.replace(location.pathname + '?k=' + tvRom); return; } setTimeout(function () { toast(T('Lag et rom først – så kobles TV-en til det.', 'Create a room first – then the TV connects to it.')); }, 900); }
  }
  // I appen: var du i et rom i kveld, lander du rett i det igjen (på nettet vises et banner i stedet)
  // Appen: Spill-fanen ER rommet. Har du et rom i kveld, går du rett inn i det (Hjem-fanen har lag rom / bli med).
  // Også «Spill i rommet» fra en lekeside går til rommet du er i – leken velges der med ett trykk.
  if (erApp && !kode && !tvKobl && qs.get('lag') !== '1') { var appRom = sistRom(); if (appRom) { location.replace(location.pathname + '?k=' + appRom); return; } }
  // Kommer man fra en gjengside, telles rommet for den gjengen
  var onsketGjeng = /^[0-9a-f-]{36}$/i.test(qs.get('gjeng') || '') ? qs.get('gjeng') : '';
  var vervSjekket = false, sisteSkjerm = '';
  var meg = null, tilstand = null, versjon = 0, timer = null, sisteNr = 0, opptatt = false, feilTeller = 0;
  var ikon = {
    del: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V3"/><path d="m7 8 5-5 5 5"/><path d="M5 13v7h14v-7"/></svg>',
    qr: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4v-3"/></svg>',
    pokal: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/></svg>',
    krone: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 7l4.5 4L12 4l4.5 7L21 7l-2 12H5z"/></svg>',
    stua: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 11V8a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v3"/><path d="M3 13a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4H3z"/><path d="M5 17v2M19 17v2"/></svg>',
    mer: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 16v-4.5M12 8h.01"/></svg>'
  };

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function les(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } }
  function skriv(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function toast(t) {
    var el = document.getElementById('toast'); if (!el) return;
    el.textContent = t; el.classList.add('show');
    // Lang nok til å rekke å lese den etter et par glass: minst 3 sekunder, lengre for lange beskjeder
    var ms = Math.min(7000, Math.max(3000, String(t).length * 75));
    clearTimeout(toast.t); toast.t = setTimeout(function () { el.classList.remove('show'); }, ms);
  }
  function settAdresse(k) {
    var u = location.pathname + (k ? '?k=' + k : '');
    history.replaceState(history.state, '', u);
    // Husk rommet, så «Spill sammen» og forsiden kan ta deg tilbake dit
    if (k) skriv('bd_sist_rom', { k: k, t: Date.now() });
  }

  /* ---------- nettverk ---------- */
  var lekerHar = { lang: '', kode: '', liste: null }, sender = 0, senderT = null;
  function api(metode, sti, body) {
    var h = { 'Content-Type': 'application/json', 'x-lang': LANG };
    if (lekerHar.lang && lekerHar.kode === kode) h['x-leker'] = lekerHar.lang;   // serveren slipper å sende lekelista på nytt
    if (meg && metode === 'GET') { h['x-spiller'] = meg.id; h['x-pollett'] = meg.pollett; }
    // Innlogget? Da kan serveren sjekke Pluss når verten starter en pakke
    var sesjon = window.BDKonto && window.BDKonto.les();
    if (metode === 'POST' && sesjon && sesjon.access_token) h.Authorization = 'Bearer ' + sesjon.access_token;
    // Trykk som venter på serveren: en tynn stripe øverst viser at noe skjer (vises først etter 150 ms, så raske svar ikke blinker)
    if (metode === 'POST') { sender++; clearTimeout(senderT); senderT = setTimeout(function () { if (sender > 0) document.documentElement.classList.add('rom-sender'); }, 150); }
    var ferdig = function () { if (metode === 'POST' && --sender <= 0) { sender = 0; clearTimeout(senderT); document.documentElement.classList.remove('rom-sender'); } };
    return fetch(sti, { method: metode, headers: h, body: body ? JSON.stringify(body) : undefined, cache: 'no-store' })
      .then(function (r) { ferdig(); return r; }, function (e) { ferdig(); throw e; })
      .then(function (r) {
        if (r.status === 204) return null;
        return r.json().then(function (d) { if (!r.ok) { var e = new Error(d.melding || T('Feil', 'Something went wrong')); e.kode = d.feil; e.status = r.status; throw e; } return d; });
      });
  }
  /** Kontokall (Pluss, verving, gjeng) sier også fra om språket. */
  function kontoApi(sti, opts) {
    opts = opts || {};
    opts.headers = Object.assign({ 'x-lang': LANG }, opts.headers || {});
    return window.BDKonto.api(sti, opts);
  }
  /* ---------- husk hvilke kort denne telefonen har sett, så neste kveld gir nye kort først ---------- */
  function settListe() { try { var x = JSON.parse(localStorage.getItem('bd_sett') || '{}'); return x && typeof x === 'object' ? x : {}; } catch (e) { return {}; } }
  function merkSett(lek, id) {
    if (!lek || !id) return;
    var x = settListe(), l = x[lek] || (x[lek] = []);
    if (l.indexOf(id) !== -1) return;
    l.push(id); if (l.length > 1500) l.splice(0, l.length - 1500);
    try { localStorage.setItem('bd_sett', JSON.stringify(x)); } catch (e) {}
  }
  function gjor(h) {
    if (!meg || opptatt) return;
    opptatt = true;
    h.id = meg.id; h.pollett = meg.pollett;
    if (h.handling === 'slurk') egenSlurkT = Date.now();
    if (h.handling === 'start' && h.lek) h.sett = (settListe()[h.lek] || []).slice(-1500);
    api('POST', '/api/rom/' + kode, h).then(function (d) { opptatt = false; ta(d); })
      .catch(function (e) { opptatt = false; if (e.kode === 'pluss') return visPlussTilbud(); toast(e.message); if (e.kode === 'ikke-med') glemRom(); });
  }
  var ko = Promise.resolve();
  function gjorAlltid(h) {
    if (!meg) return;
    h.id = meg.id; h.pollett = meg.pollett;
    if (h.handling === 'slurk') egenSlurkT = Date.now();
    ko = ko.then(function () { return api('POST', '/api/rom/' + kode, h).then(ta).catch(function (e) { toast(e.message); }); });
  }
  var henter = false, henteIgjen = false;
  function hent() {
    if (!kode || !meg) return;
    if (henter) { henteIgjen = true; return; }
    henter = true; clearTimeout(timer);
    api('GET', '/api/rom/' + kode + '?v=' + versjon).then(function (d) { feilTeller = 0; if (d) ta(d); })
      .catch(function (e) {
        // Rommet er borte (utløpt i natt): glem det og vis startskjermen, ikke en tom side
        if (e.kode === 'finnes-ikke') { var borte = e.message; glemRom(); settAdresse(''); kode = ''; tegnStart(borte); return; }
        feilTeller++;
      })
      .then(function () { henter = false; if (henteIgjen && meg) { henteIgjen = false; hent(); } else planlegg(); });
  }
  function planlegg() {
    clearTimeout(timer);
    if (!root.isConnected || !meg) return;
    // Med sanntid kommer endringene med én gang, så da sjekker vi bare av og til for sikkerhets skyld
    // Strømsparing: sjeldnere når sanntid virker (endringer kommer uansett med én gang), og mye sjeldnere når fanen er skjult
    var ms = document.hidden ? (rt.ok ? 45000 : 10000) : rt.ok ? 12000 : Math.min(1500 + feilTeller * 1500, 8000);
    timer = setTimeout(hent, ms);
  }

  /* ---------- sanntid: Supabase Realtime sier fra når rommet endres ---------- */
  var rt = { ws: null, ok: false, hb: null, ref: 0, kode: '', stopp: false };
  function rtSend(m) { try { rt.ws && rt.ws.readyState === 1 && rt.ws.send(JSON.stringify(m)); } catch (e) {} }
  function rtKobl() {
    var K = window.BDKonto;
    if (!K || !K.cfg || !K.cfg.url || !K.cfg.anon || !kode || !meg || !window.WebSocket) return;
    if (rt.ws && rt.kode === kode) return;
    rtStopp(); rt.stopp = false; rt.kode = kode;
    var emne = 'realtime:rom-' + kode, ws;
    try { ws = new WebSocket(K.cfg.url.replace(/^http/, 'ws') + '/realtime/v1/websocket?apikey=' + encodeURIComponent(K.cfg.anon) + '&vsn=1.0.0'); } catch (e) { return; }
    rt.ws = ws;
    ws.onopen = function () {
      var ref = String(++rt.ref);
      rtSend({ topic: emne, event: 'phx_join', ref: ref, join_ref: ref, payload: { config: { broadcast: { ack: false, self: false }, presence: { key: '' }, postgres_changes: [], private: false }, access_token: K.cfg.anon } });
      rt.hb = setInterval(function () { rtSend({ topic: 'phoenix', event: 'heartbeat', payload: {}, ref: String(++rt.ref) }); }, 25000);
    };
    ws.onmessage = function (e) {
      var m; try { m = JSON.parse(e.data); } catch (x) { return; }
      if (!m || m.topic !== emne) return;
      if (m.event === 'phx_reply' && m.payload && m.payload.status === 'ok' && !rt.ok) { rt.ok = true; planlegg(); }
      if (m.event === 'broadcast' && m.payload && m.payload.event === 'endret') {
        var v = m.payload.payload && m.payload.payload.v;
        if (!v || v > versjon) hent();
      }
    };
    ws.onclose = function () {
      clearInterval(rt.hb); if (rt.ws !== ws) return;
      rt.ws = null; rt.ok = false; planlegg();
      if (!rt.stopp) setTimeout(function () { if (!rt.stopp && meg && kode && document.getElementById('rom')) rtKobl(); }, 5000);
    };
    ws.onerror = function () { try { ws.close(); } catch (x) {} };
  }
  function rtStopp() {
    rt.stopp = true; rt.ok = false; clearInterval(rt.hb);
    if (rt.ws) { var w = rt.ws; rt.ws = null; try { w.close(); } catch (e) {} }
  }
  /* ---------- lyd: små effekter laget i nettleseren (ingen lydfiler) ---------- */
  var lyd = { ctx: null, paa: les('bd_lyd') !== false };
  function lydCtx() {
    if (!lyd.ctx) {
      try { lyd.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; }
      // Alt går gjennom en kompressor og en forsterker: høyere og jevnere, så lydene høres over musikken
      try {
        var k = lyd.ctx.createDynamicsCompressor(); k.threshold.value = -18; k.knee.value = 8; k.ratio.value = 6; k.attack.value = 0.002; k.release.value = 0.2;
        var g = lyd.ctx.createGain(); g.gain.value = 2.2; k.connect(g); g.connect(lyd.ctx.destination); lyd.ut = k;
      } catch (e) { lyd.ut = lyd.ctx.destination; }
    }
    if (lyd.ctx.state === 'suspended') lyd.ctx.resume().catch(function () {});
    return lyd.ctx;
  }
  // Telefoner krever et trykk før lyd kan spilles – lås opp ved første berøring
  document.addEventListener('pointerdown', function () { if (lyd.paa) lydCtx(); }, { passive: true });
  function tone(f, t0, varighet, type, volum, tilF, vibrato) {
    var c = lyd.ctx; if (!c) return;
    var o = c.createOscillator(), g = c.createGain(), lp = c.createBiquadFilter(), t = c.currentTime + t0;
    lp.type = 'lowpass'; lp.frequency.value = 1800; lp.Q.value = 0.7;   // runder av alt: ingen skarpe overtoner
    o.type = type || 'sine'; o.frequency.setValueAtTime(f, t);
    if (tilF) o.frequency.exponentialRampToValueAtTime(tilF, t + varighet);
    if (vibrato) { var l = c.createOscillator(), lg = c.createGain(); l.frequency.value = vibrato; lg.gain.value = f * 0.025; l.connect(lg); lg.connect(o.frequency); l.start(t); l.stop(t + varighet + 0.05); }
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(volum || 0.2, t + 0.018); g.gain.setValueAtTime(volum || 0.2, t + Math.max(0.019, varighet * 0.5)); g.gain.exponentialRampToValueAtTime(0.0001, t + varighet * 1.5);
    o.connect(lp); lp.connect(g); g.connect(lyd.ut || c.destination); o.start(t); o.stop(t + varighet * 1.5 + 0.05);
  }
  /** Støy (klirr, kortstokk, trommeslag) – filtrert rundt en frekvens. */
  function stoy(t0, varighet, volum, frekvens, filtertype) {
    var c = lyd.ctx; if (!c) return;
    var n = Math.max(1, Math.floor(c.sampleRate * varighet)), buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    var src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(), t = c.currentTime + t0;
    src.buffer = buf; f.type = filtertype || 'bandpass'; f.frequency.value = frekvens || 3000; g.gain.value = volum || 0.3;
    src.connect(f); f.connect(g); g.connect(lyd.ut || c.destination); src.start(t);
  }
  /** Lufthorn: flere skurrende toner litt ved siden av hverandre – skjærer gjennom musikk. */
  function horn(t0, varighet) {
    [392, 396, 494, 498, 587].forEach(function (f) { tone(f * 0.97, t0, varighet, 'sawtooth', 0.06, f); });
  }
  /* Lydpaletten: små, rolige lyder laget for appen (public/lyd/, valgt etter lytting). Trykk, hjul-tikk, din tur, kort,
     ringen røk og drikk. Lydene som ikke har en fil ennå (nedtelling, lunte, bombe), lages fortsatt som toner under. */
  var LYDFIL = { tikk: 'hjul', grip: 'trykk', pek: 'trykk', tur: 'tur', pop: 'kort', svar: 'kort', ding: 'kort', knus: 'knus', bom: 'bombe', slurk: 'slurk',
    naa: 'naa', fanfare: 'fanfare', womp: 'womp', lunte: 'lunte', vann: 'vann', skaal: 'skaal', forsent: 'forsent', terning: 'terning', kortsnu: 'kortsnu', kortlegg: 'kortlegg',
    dundun: 'dundun', bytt: 'bytt', kaching: 'kaching', mynt: 'mynt' };
  var lydFiler = {}, lydSist = {}, lunteStopp = null;
  function lydFil(navn) {
    if (!lydFiler[navn]) { var a = new Audio('/lyd/' + navn + '.mp3'); a.preload = 'auto'; a.volume = navn === 'hjul' || navn === 'trykk' ? 0.45 : 0.6; lydFiler[navn] = a; }
    return lydFiler[navn];
  }
  function spillFil(navn) {
    var naa = Date.now(); if (naa - (lydSist[navn] || 0) < 40) return true;   // hjulet tikker aldri tettere enn dette
    lydSist[navn] = naa;
    // Lunta freser sammenhengende så lenge bomba går – den startes ikke på nytt for hvert tikk, og stopper når bomba smeller
    if (navn === 'lunte') { try { var l = lydFil('lunte'); l.loop = true; if (l.paused) { var pl = l.play(); if (pl && pl.catch) pl.catch(function () {}); } clearTimeout(lunteStopp); lunteStopp = setTimeout(function () { l.pause(); l.currentTime = 0; }, 1500); } catch (e) {} return true; }
    if (navn === 'bombe' && lydFiler.lunte) { lydFiler.lunte.pause(); lydFiler.lunte.currentTime = 0; }
    try { var a = lydFil(navn); a.currentTime = 0; var p = a.play(); if (p && p.catch) p.catch(function () {}); return true; } catch (e) { return false; }
  }
  if (lyd.paa) setTimeout(function () { Object.keys(LYDFIL).forEach(function (k) { lydFil(LYDFIL[k]); }); }, 1500);   // last dem i bakgrunnen
  function spillLyd(navn, n) {
    try { document.dispatchEvent(new CustomEvent('mv-lyd', { detail: navn })); } catch (e) {}   // appen: vibrasjon som følger lyden
    if (!lyd.paa) return;
    if (navn === 'tell' && spillFil('tell' + n)) return;   // 3 – 2 – 1: tre tretoner som stiger
    if (LYDFIL[navn] && spillFil(LYDFIL[navn])) return;
    if (!lydCtx()) return;
    // Sofa-nedtelling: 3 – 2 – 1 stiger i tone, og «NÅ!» er et kort, lyst støt alle hører
    if (navn === 'tell') { var f = [0, 784, 659, 523][n] || 523; tone(f, 0, 0.12, 'square', 0.07); tone(f / 2, 0, 0.16, 'sine', 0.22); }
    if (navn === 'naa') { tone(1047, 0, 0.32, 'square', 0.08); tone(1568, 0, 0.32, 'triangle', 0.14); stoy(0, 0.06, 0.25, 3000, 'bandpass'); }
    // Bomben: et tørt klokketikk, og til slutt et dypt smell
    if (navn === 'lunte') { stoy(0, 0.018, 0.22, 3200, 'bandpass'); tone(1800, 0, 0.02, 'square', 0.04); }
    if (navn === 'bom') { stoy(0, 0.9, 0.9, 140, 'lowpass'); tone(90, 0, 0.7, 'sine', 0.5, 35); stoy(0.02, 0.3, 0.4, 900, 'bandpass'); }
    if (navn === 'tikk') { tone(440, 0, 0.035, 'sine', 0.12, 300); stoy(0, 0.02, 0.08, 900); }
    if (navn === 'grip') tone(180, 0, 0.06, 'sine', 0.14, 140);
    if (navn === 'pek') { tone(150, 0, 0.14, 'sine', 0.4, 80); stoy(0, 0.08, 0.3, 500); tone(330, 0.02, 0.2, 'triangle', 0.14); }
    // Utenfor sporet: et lavt knirk
    if (navn === 'knirk') { tone(110, 0, 0.3, 'sawtooth', 0.06, 150); stoy(0, 0.25, 0.1, 400); }
    if (navn === 'ding') { tone(440, 0, 0.35, 'triangle', 0.25); tone(660, 0.12, 0.5, 'triangle', 0.2); }
    // Din tur: tre lyse toner og en høy «pling» på slutten
    if (navn === 'tur') { tone(392, 0, 0.14, 'triangle', 0.16); tone(523, 0.13, 0.14, 'triangle', 0.16); tone(659, 0.26, 0.4, 'triangle', 0.22); tone(330, 0.26, 0.5, 'sine', 0.14); }
    // Du må drikke: to lufthorn-støt og så «glugg glugg»
    if (navn === 'slurk') {
      horn(0, 0.28); horn(0.36, 0.6);
      [1.05, 1.25, 1.45].forEach(function (t) { tone(260, t, 0.13, 'sine', 0.35, 780); });
    }
    if (navn === 'pop') { tone(220, 0, 0.12, 'sine', 0.3, 330); tone(165, 0.02, 0.18, 'triangle', 0.14); }
    if (navn === 'svar') { tone(262, 0, 0.12, 'triangle', 0.18); tone(392, 0.1, 0.25, 'triangle', 0.18); }
    // Kassaapparat: klikk + to lyse bjeller
    if (navn === 'kaching') { stoy(0, 0.06, 0.3, 2500, 'bandpass'); tone(1047, 0.05, 0.25, 'triangle', 0.22); tone(1319, 0.13, 0.6, 'triangle', 0.22); tone(1568, 0.13, 0.6, 'sine', 0.08); }
    if (navn === 'mynt') { tone(880, 0, 0.07, 'triangle', 0.08); tone(1319, 0.06, 0.2, 'triangle', 0.14); }
    // Tap: trist trombone «womp womp womp wooomp»
    if (navn === 'womp') { tone(311, 0, 0.28, 'sawtooth', 0.09); tone(294, 0.3, 0.28, 'sawtooth', 0.09); tone(277, 0.6, 0.28, 'sawtooth', 0.09); tone(262, 0.9, 0.9, 'sawtooth', 0.09, 247, 6); }
    // Dramatisk «dun dun DUNN» når noe blir meldt
    if (navn === 'dundun') { stoy(0, 0.25, 0.5, 120, 'lowpass'); tone(196, 0, 0.3, 'sawtooth', 0.1); tone(185, 0.35, 0.3, 'sawtooth', 0.1); stoy(0.7, 0.5, 0.6, 100, 'lowpass'); tone(156, 0.7, 1.1, 'sawtooth', 0.12, 150, 5); }
    // Seier: fanfare
    if (navn === 'fanfare') { [523, 659, 784].forEach(function (f, i) { tone(f, i * 0.13, 0.14, 'square', 0.08); }); tone(1047, 0.42, 0.7, 'square', 0.09, null, 6); tone(1319, 0.42, 0.7, 'triangle', 0.12); tone(784, 0.42, 0.7, 'triangle', 0.1); }
    // Glass som knuses (ringen røk)
    if (navn === 'knus') { stoy(0, 0.12, 0.9, 120, 'lowpass'); stoy(0.02, 0.4, 0.35, 1400, 'bandpass'); [980, 1300, 820, 1600].forEach(function (f, i) { tone(f, 0.04 + i * 0.05, 0.3, 'triangle', 0.07); }); tone(80, 0, 0.5, 'sine', 0.35, 45); stoy(0.45, 0.5, 0.3, 6000, 'highpass'); }
    // Kortstokk som stokkes
    if (navn === 'bytt') { for (var i = 0; i < 5; i++) stoy(i * 0.045, 0.04, 0.35, 1200 + i * 150); tone(450, 0.25, 0.1, 'triangle', 0.1, 700); }
    // Vannrunde: tre rolige dråper («plopp» med stigende tone) – ikke en alarm
    if (navn === 'vann') { tone(260, 0, 0.11, 'sine', 0.32, 700); tone(350, 0.24, 0.1, 'sine', 0.24, 900); tone(230, 0.52, 0.15, 'sine', 0.3, 625); }
  }
  /** Stor beskjed over hele skjermen når du må drikke – synes og høres selv med musikk på. */
  var drikkEl = null, drikkN = 0, drikkTimer = null, egenSlurkT = 0, drikkFra = [], sisteUtNr = null;
  function drikkAlarm(n, fra) {
    // «RINGEN RØK!» får stå alene først
    if (document.querySelector('.rof-knust') && !drikkEl) { setTimeout(function () { drikkAlarm(n); }, 2600); return; }
    drikkN = drikkEl ? drikkN + n : n;
    if (!drikkEl) drikkFra = [];
    (fra || []).forEach(function (x) { if (drikkFra.indexOf(x) === -1) drikkFra.push(x); });
    var fri = tilstand && tilstand.alkoholfri;
    if (!drikkEl) { drikkEl = document.createElement('div'); drikkEl.className = 'drikk-alarm'; drikkEl.setAttribute('role', 'alert'); drikkEl.addEventListener('click', function () { if (drikkEl) { drikkEl.remove(); drikkEl = null; } }); document.body.appendChild(drikkEl); spillLyd('slurk'); }
    drikkEl.innerHTML = '<b>' + (fri ? '⚠️ ' + T('STRAFFEPOENG!', 'PENALTY!') : '🍺 ' + T('DRIKK!', 'DRINK!')) + '</b><span>' + drikkN + ' ' + (fri ? T(drikkN === 1 ? 'straffepoeng' : 'straffepoeng', drikkN === 1 ? 'point' : 'points') : T(drikkN === 1 ? 'slurk' : 'slurker', drikkN === 1 ? 'sip' : 'sips')) + '</span>';
    if (drikkFra.length) drikkEl.innerHTML += '<small>' + T('fra ', 'from ') + esc(drikkFra.join(T(' og ', ' and '))) + '</small>';
    try { navigator.vibrate && navigator.vibrate([300, 120, 300, 120, 500]); } catch (e) {}
    clearTimeout(drikkTimer); drikkTimer = setTimeout(function () { if (drikkEl) { drikkEl.remove(); drikkEl = null; } }, drikkFra.length ? 4200 : 3200);
  }
  function sjekkSlurker(gammel, ny) {
    if (!gammel || !ny || !ny.meg) return;
    var f = (gammel.spillere || []).find(function (p) { return p.id === ny.meg; }), e = (ny.spillere || []).find(function (p) { return p.id === ny.meg; });
    if (!f || !e) return;
    var diff = (e.slurker || 0) - (f.slurker || 0);
    // Hvem delte ut til meg siden sist? (alle nye utdelinger, ikke bare den siste)
    var nye = (ny.utdelinger || []).filter(function (u) { return sisteUtNr !== null && u.nr > sisteUtNr; });
    sisteUtNr = (ny.utdelinger || []).reduce(function (m, u) { return Math.max(m, u.nr || 0); }, sisteUtNr || 0);
    var fra = nye.filter(function (u) { return (u.liste || []).some(function (x) { return x.id === ny.meg; }); }).map(function (u) { return navn(u.fra); });
    if (diff > 0 && diff < 60 && Date.now() - egenSlurkT > 2500) {   // ikke når du fører dine egne slurker
      var vent = vlUtsettTil - Date.now();
      if (vent > 0) setTimeout(function () { drikkAlarm(diff, fra); }, vent); else drikkAlarm(diff, fra);
    }
  }
  /** Vannrunde: et rolig blått varsel på alle telefonene – ingen straff, bare et glass vann. */
  var sisteVann = null, vannKode = '', vannEl = null, vannTimer = null;
  function sjekkVann(d) {
    var v = d && d.vann, nr = v ? v.nr : 0;
    if (vannKode !== kode) { vannKode = kode; sisteVann = null; }
    // Første svar fra rommet: ikke vis en vannrunde som var før du kom (eller åpnet siden på nytt)
    if (sisteVann === null) { sisteVann = nr; return; }
    // Lå telefonen i lomma lenge, er vannrunden gammel – da holder det å la være
    if (nr > sisteVann && (!v.tid || Date.now() + klokkeAvvik - v.tid < 5 * 60000)) vannAlarm(v.t);
    sisteVann = nr;
  }
  function vannAlarm(tekst) {
    // DRIKK! og RINGEN RØK! får stå først
    if (drikkEl || document.querySelector('.rof-knust')) { setTimeout(function () { vannAlarm(tekst); }, 3400); return; }
    lukkVann();
    vannEl = document.createElement('div'); vannEl.className = 'vann-alarm'; vannEl.setAttribute('role', 'alert');
    vannEl.innerHTML = '<i aria-hidden="true">💧</i><b>' + T('VANNRUNDE', 'WATER ROUND') + '</b><span>' + esc(tekst || '') + '</span>';
    vannEl.addEventListener('click', lukkVann);
    document.body.appendChild(vannEl);
    spillLyd('vann');
    try { navigator.vibrate && navigator.vibrate([90, 70, 90]); } catch (e) {}
    vannTimer = setTimeout(lukkVann, 9000);
  }
  function lukkVann() { clearTimeout(vannTimer); if (vannEl) { vannEl.remove(); vannEl = null; } }
  /** Når kommer neste vannrunde av seg selv? (Teksten under bryteren hos verten.) */
  function vannIgjen() {
    var n = tilstand.vannNeste;
    if (!n) return T('Rommet minner alle på et glass vann omtrent én gang i timen mens dere spiller.', 'The room reminds everyone to drink some water about once an hour while you play.');
    var min = Math.round((n - (Date.now() + klokkeAvvik)) / 60000);
    return min <= 1 ? T('Neste vannrunde kommer snart.', 'The next water round is coming up soon.') : T('Neste kommer av seg selv om ca. ' + min + ' min.', 'The next one comes by itself in about ' + min + ' min.');
  }
  /** Lyd når en aksje blir meldt, og fanfare når kvelden eller børsen kårer en vinner. */
  var meldtSett = null, vinnerSett = null;
  function sjekkHendelser(d) {
    var b = d && d.bors, ider = {};
    (b ? b.aksjer : []).forEach(function (a) { if (a.status === 'meldt') ider[a.id] = 1; });
    if (meldtSett && Object.keys(ider).some(function (id) { return !meldtSett[id]; })) spillLyd('dundun');
    meldtSett = ider;
    var v = (d.kveld && d.kveld.vinner) || (b && b.slutt && b.slutt.konge) || '';
    if (vinnerSett !== null && v && v !== vinnerSett) spillLyd('fanfare');
    vinnerSett = v;
  }
  /** Tikk som går saktere og saktere mens hjulet spinner, og et pling når det stopper. */
  function hjulLyd(ms) {
    if (!lyd.paa || !lydCtx()) return;
    var t = 0, steg = 45;
    while (t < ms - 150) { tone(1700, t / 1000, 0.025, 'square', 0.04); t += steg; steg *= 1.075; }
    setTimeout(function () { spillLyd('ding'); }, ms);
  }
  function erMinTur(t) {
    var s = t && t.spill, m = t && t.meg; if (!s || !m) return false;
    if (s.type === 'bussruta') return (s.fase === 1 && s.aktiv === m) || (s.fase === 3 && s.buss === m && s.bussRekke < s.maal);
    if (s.type === 'yatzy') return !s.ferdig && s.aktiv === m;
    if (s.type === 'overunder' || s.type === 'president') return s.tur === m;
    if (s.type === 'opus') return s.holder === m;
    if (s.type === 'tosannheter') return s.fase === 'skriv' && s.aktiv === m;
    if (s.type === 'forraeder') return s.fase === 'svar' && s.aktiv === m;
    return false;
  }
  /** Må jeg gjøre noe akkurat nå? Gir teksten til det lime merket øverst (og den lime skjermkanten), eller ''. */
  function minTurNaa(d) {
    var s = d && d.spill, m = d && d.meg; if (!s || !m) return '';
    if (s.ring && s.turId === m) return T('Din tur – trekk et kort!', 'Your turn – draw a card!');
    if (erMinTur(d)) return T('Din tur!', 'Your turn!');
    if (s.type === 'mest' && s.fase === 'stem' && !s.minStemme) return T('Stem nå!', 'Vote now!');
    if (s.type === 'forraeder' && s.fase === 'stem' && s.aktiv !== m && !s.minStemme) return T('Stem nå!', 'Vote now!');
    return '';
  }
  /** Lunta: hvor mye som er igjen (0–1), som en lunte som brenner ned. */
  function lunte(andel, ekstra) {
    var p = Math.max(0, Math.min(1, andel || 0));
    return '<div class="lunte' + (p <= 0 ? ' tom' : '') + (ekstra ? ' ' + ekstra : '') + '" aria-hidden="true"><i style="--igjen:' + (p * 100).toFixed(1) + '%"></i></div>';
  }
  var varMinTur = false, sisteFase = '';

  /* ---------- svarfrist: nedtelling på alle telefoner ---------- */
  var klokkeAvvik = 0, fristSendt = 0, fristTimer = null, fristTot = {};
  function fristHtml(s, tekst) {
    if (!s || !s.frist) return '';
    var igjen = Math.max(0, Math.ceil((s.frist - 1500 - (Date.now() + klokkeAvvik)) / 1000));
    fristTot[s.frist] = Math.max(fristTot[s.frist] || 0, igjen, 1);
    return lunte(igjen / fristTot[s.frist], 'frist-lunte') + '<p class="rom-frist"><span data-frist="' + s.frist + '">' + igjen + '</span> ' + esc(tekst || T('sekunder igjen', 'seconds left')) + '</p>';
  }
  function fristTikk() {
    clearInterval(fristTimer);
    fristTimer = setInterval(function () {
      var el = document.querySelector('[data-frist]');
      if (!el) return;
      var frist = Number(el.dataset.frist), igjen = Math.max(0, Math.ceil((frist - 1500 - (Date.now() + klokkeAvvik)) / 1000));
      el.textContent = igjen; el.parentNode.classList.toggle('snart', igjen <= 10);
      var kl = el.parentNode.classList.contains('nr-klokke') ? el.parentNode.querySelector('path') : null; if (kl) kl.setAttribute('d', nrPai(igjen / (fristTot[frist] || Math.max(igjen, 1))));
      var lu = document.querySelector('.frist-lunte'); if (lu) { var tot = fristTot[frist] || Math.max(igjen, 1); lu.firstChild.style.setProperty('--igjen', (100 * igjen / tot).toFixed(1) + '%'); lu.classList.toggle('snart', igjen <= 10); lu.classList.toggle('tom', igjen <= 0); }
      if (igjen <= 0 && fristSendt !== frist) {
        fristSendt = frist;
        // Klokka er ute: be serveren gå videre (den sjekker selv). Litt tilfeldig ventetid, så ikke alle sender samtidig.
        // Klokka viser 0 halvannet sekund før fristen; serveren godtar «tid ute» fra 0,8 s før. Vent derfor minst 0,9 s,
        // ellers kan alle telefonene spørre for tidlig – og da spør ingen igjen.
        setTimeout(function () { gjorAlltid({ handling: 'tid-ute' }); }, 900 + Math.random() * 900);
      }
    }, 250);
  }
  function ta(d) {
    if (!d) return;
    if (d.naa) klokkeAvvik = d.naa - Date.now();
    var varVenter = !!(tilstand && tilstand.venter === true);
    var haddeTilstand = !!tilstand;   // første svar etter at siden ble åpnet: ikke vis gamle hendelser som beskjed
    // Venter på å bli sluppet inn i en gjengkveld
    if (d.venter === true) { if (d.versjon) versjon = d.versjon; tilstand = d; rtKobl(); tegnVenter(); return; }
    if (varVenter && d.meg) { toast(T('Du er sluppet inn! 🎉', 'You’re in! 🎉')); spillLyd('tur'); }
    var naaTur = erMinTur(d); if (naaTur && !varMinTur && tilstand) spillLyd('tur'); varMinTur = naaTur;
    var fase = d.spill ? d.spill.type + ':' + (d.spill.fase || '') + ':' + (d.spill.i || 0) : '';
    if (tilstand && d.spill && /nyhetsrunden:svar|mest:resultat|forraeder:avslort|tosannheter:avslort/.test(fase) && fase !== sisteFase) spillLyd('svar');
    sisteFase = fase;
    if (d.versjon) versjon = d.versjon;
    // Lekelista sendes bare når telefonen ikke har den (første gang, eller nytt språk)
    if (d.leker) { lekerHar = { lang: d.lang || (d.leker && tilstand && tilstand.lang) || '', kode: kode, liste: d.leker }; }
    else if (lekerHar.liste && lekerHar.kode === kode) d.leker = lekerHar.liste;
    sjekkSlurker(tilstand, d);
    try { sjekkHendelser(d); } catch (x) {}
    try { sjekkVann(d); } catch (x) {}
    try { rofSjekkBrudd(d); } catch (x) {}
    tilstand = d;
    sjekkSprak(d);
    if (d.hendelse && d.hendelse.nr > sisteNr) { if (sisteNr || haddeTilstand) toast(d.hendelse.tekst); sisteNr = d.hendelse.nr; }
    borsPenger(d);
    borsBlalys(d);
    if (d.meg === null && meg) { glemRom(); if (varVenter) tegnStart(T('Du ble ikke sluppet inn denne gangen.', 'You weren’t let in this time.')); return; }
    // Alkoholfri for hele rommet: siden bytter slurker med straffepoeng på alle telefoner
    if (d.alkoholfri) document.documentElement.dataset.alkoholfri = '1';
    else if (document.documentElement.dataset.alkoholfri) delete document.documentElement.dataset.alkoholfri;
    // Vervet av en venn? Første rom med minst to telefoner gir begge et kveldspass
    if (!vervSjekket && d.spill && (d.spillere || []).length >= 2 && window.BDVerv) { vervSjekket = true; window.BDVerv.fullfor(); }
    if (onsketGjeng && meg && d.vert === d.meg && !d.gjeng) { var gid = onsketGjeng; onsketGjeng = ''; gjorAlltid({ handling: 'gjeng', gjengId: gid }); }
    rtKobl();
    // Skjermen holdes våken under en lek, og for verten i lobbyen (koden/QR-en står på skjermen) – ikke for gjester som venter
    if (d.spill || d.vert === d.meg) holdVaaken(); else slippVaaken();
    tegn();
  }
  // Byttet til det andre språket midt i rommet? Serveren husker språket fra da man ble med, så si fra.
  var sprakSendt = false;
  function sjekkSprak(d) {
    if (sprakSendt || !meg || !kode || !d || !d.meg) return;
    var jeg = (d.spillere || []).find(function (p) { return p.id === d.meg; }) || {};
    var hans = jeg.lang || d.lang;
    if (!hans || hans === LANG) return;
    sprakSendt = true;
    api('POST', '/api/rom/' + kode, { handling: 'sprak', lang: LANG, id: meg.id, pollett: meg.pollett })
      .then(function (x) { if (x && x.versjon) ta(x); }).catch(function () {});
  }
  /** Lenke til samme rom på det andre språket (for blandede grupper). */
  function sprakLenke(kl) {
    var til = EN ? 'no' : 'en', sti = (EN ? '/no/rom' : '/room') + (kode ? '?k=' + kode : location.search);
    return '<a class="rom-sprak' + (kl ? ' ' + kl : '') + '" href="' + esc(sti) + '" hreflang="' + til + '" lang="' + til + '" data-sprak="' + til + '" data-astro-reload>🌐 ' + (EN ? 'Norsk' : 'English') + '</a>';
  }
  root.addEventListener('click', function (e) { var a = e.target.closest && e.target.closest('[data-sprak]'); if (a) skriv('bd_romsprak', a.dataset.sprak); });
  function glemRom() {
    if (kode) { try { localStorage.removeItem('bd_rom_' + kode); var sr = les('bd_sist_rom'); if (sr && sr.k === kode) localStorage.removeItem('bd_sist_rom'); } catch (e) {} }
    meg = null; tilstand = null; versjon = 0; clearTimeout(timer); rtStopp(); lukkTavle(); lukkHjul(); slippVaaken();
    if (document.documentElement.dataset.alkoholfri) delete document.documentElement.dataset.alkoholfri;
    tegnStart();
  }

  /* ---------- skjermen sovner ikke mens dere spiller ----------
     Telefonen ligger ofte på bordet mens noen leser opp, og en låst skjerm midt i en runde er tungvint
     med kalde fingre og et glass i hånda. Låsen slippes når du går ut av rommet, og etter 10 minutter
     uten noe nytt i rommet (så telefonen ikke står og lyser hele natta). Nettleseren slipper den selv
     når fanen skjules – da hentes den igjen når du kommer tilbake. */
  var vaaken = { las: null, venter: false, sist: Date.now(), t: null };
  function holdVaaken() {
    vaaken.sist = Date.now();
    if (!meg || vaaken.las || vaaken.venter || document.hidden || !navigator.wakeLock || !root.isConnected) return;
    vaaken.venter = true;
    navigator.wakeLock.request('screen').then(function (l) {
      vaaken.venter = false; vaaken.las = l;
      l.addEventListener('release', function () { if (vaaken.las === l) vaaken.las = null; });
      if (!meg || !root.isConnected) slippVaaken();
    }).catch(function () { vaaken.venter = false; });
    if (!vaaken.t) vaaken.t = setInterval(function () {
      if (!root.isConnected) { slippVaaken(); clearInterval(vaaken.t); vaaken.t = null; return; }
      if (vaaken.las && Date.now() - vaaken.sist > 5 * 60 * 1000) slippVaaken();
    }, 60 * 1000);
  }
  function slippVaaken() { var l = vaaken.las; vaaken.las = null; if (l) { try { l.release(); } catch (e) {} } }
  root.addEventListener('click', function () { if (meg && tilstand && (tilstand.spill || tilstand.vert === tilstand.meg)) holdVaaken(); });
  if (window.__bdQrLytter) document.removeEventListener('bdqr-klar', window.__bdQrLytter);
  window.__bdQrLytter = function () { if (tilstand && root.isConnected && root.querySelector('.rom-qr') && !root.querySelector('.rom-qrbilde')) tegn(); };
  document.addEventListener('bdqr-klar', window.__bdQrLytter);

  window.__bdRomStopp = function () { clearTimeout(timer); clearInterval(fristTimer); rtStopp(); lukkTavle(); slippVaaken(); };
  document.addEventListener('astro:before-swap', function stopp() { clearTimeout(timer); rtStopp(); lukkTavle(); lukkBors(); slippVaaken(); document.removeEventListener('astro:before-swap', stopp); }, { once: true });
  // (en gammel utgave av rommet fra før en sidebytte skal ikke hente eller holde skjermen våken)
  document.addEventListener('visibilitychange', function () { if (!document.hidden && meg && root.isConnected) { hent(); holdVaaken(); } });
  if (window.__bdRomEsc) document.removeEventListener('keydown', window.__bdRomEsc);
  window.__bdRomEsc = function (e) {
    if (e.key !== 'Escape') return;
    var pt = document.querySelector('.pluss-tilbud'); if (pt) return pt.remove();
    if (borsModal) return lukkBors();
    if (tavleHjul) return lukkHjul();
    if (tavle) return lukkTavle();
  };
  document.addEventListener('keydown', window.__bdRomEsc);

  /* ---------- start: lag eller bli med ---------- */
  /** Er du allerede i et rom (lagret på denne telefonen)? Da vises en snarvei tilbake. */
  function sistRom() {
    var sr = les('bd_sist_rom'); if (!sr || !sr.k || kode === sr.k) return null;
    if (Date.now() - (sr.t || 0) > 24 * 3600 * 1000 || !les('bd_rom_' + sr.k)) return null;
    return sr.k;
  }
  function fortsettBanner() {
    var k = sistRom(); if (!k) return '';
    var ln = onsketLek ? LEKNAVN[onsketLek] : '';
    return '<a class="rom-fortsett" href="' + esc(location.pathname + '?k=' + k) + '"><span><b>' + T('Du er i rom ', 'You’re in room ') + esc(k) + '</b><small>' +
      (ln ? T('Gå tilbake og velg ' + esc(ln) + ' der', 'Go back and pick ' + esc(ln) + ' there') : T('Trykk for å gå tilbake til rommet', 'Tap to go back to the room')) + '</small></span><span aria-hidden="true">→</span></a>';
  }
  /** Bli med-skjermen: vis kodefeltet (feil kode, eller rommet finnes ikke). */
  function visKodefelt() {
    var r = document.getElementById('kodeRad'); if (r) r.hidden = false;
    var f = document.getElementById('romKode'); if (f) { f.focus(); f.select(); }
  }
  /** Bli med-skjermen: hvem er her, og hva spilles? Gir gjesten trygghet på at det er riktig rom – eller sier fra med en gang hvis koden er feil. */
  function kikk() {
    var k = kode;
    fetch('/api/rom/' + k + '?kikk=1&lang=' + LANG, { cache: 'no-store', headers: { 'x-lang': LANG } })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (x) {
        var el = document.getElementById('romKikk'); if (!el || kode !== k || meg) return;
        if (!x.ok) {
          if (x.d && x.d.feil === 'finnes-ikke') { el.innerHTML = '<p class="rom-feil" role="alert">' + T('Fant ikke rom ', 'Couldn’t find room ') + esc(k) + T('. Sjekk koden med verten.', '. Check the code with the host.') + '</p>'; visKodefelt(); }
          return;
        }
        var d = x.d, sp = d.spillere || [], vert = sp.find(function (p) { return p.id === d.vert; }) || sp[0];
        if (!vert) return;
        var andre = sp.filter(function (p) { return p !== vert; });
        var hvem = '<b>' + esc(vert.navn) + '</b>' + (andre.length === 0 ? T(' venter på deg.', ' is waiting for you.')
          : andre.length === 1 ? T(' og ', ' and ') + '<b>' + esc(andre[0].navn) + '</b>' + T(' er her.', ' are here.')
          : T(' og ', ' and ') + andre.length + T(' andre er her.', ' others are here.'));
        el.innerHTML = '<div class="rom-kikk-folk" aria-hidden="true">' + sp.slice(0, 7).map(function (p) { return '<span' + (p === vert ? ' class="vert"' : '') + '>' + esc(String(p.navn).slice(0, 2)) + '</span>'; }).join('') +
          (sp.length > 7 ? '<span>+' + (sp.length - 7) + '</span>' : '') + '</div>' +
          '<p class="lead">' + hvem + (d.spill && d.spill.navn ? ' ' + T('Nå spilles ', 'Now playing ') + '<b>' + esc(d.spill.navn) + '</b>.' : '') + '</p>';
      }).catch(function () {});
  }
  function tegnStart(melding) {
    document.documentElement.classList.remove('i-spill', 'min-tur', 'hemmelig', 'i-rom');
    var navn = les('bd_mittnavn') || '';
    var ln = onsketLek ? LEKNAVN[onsketLek] : '';
    var medKode = !!kode && !ln;
    // Med kode i lenken har gjesten bare én oppgave: bli med. Bunnmenyen tar da bare plass.
    document.documentElement.classList.toggle('bli-med', medKode);
    root.innerHTML =
      '<h1 class="rom-h1">' + (medKode ? T('Bli med i rom ', 'Join room ') + esc(kode) : ln ? T(esc(ln) + ' fra hver sin telefon', 'Play ' + esc(ln) + ' on your phones') : T('Spill sammen', 'Play together')) + '</h1>' +
      (medKode ? '<div class="rom-kikk" id="romKikk" aria-live="polite"><p class="lead">' + T('Skriv navnet ditt, så er du med.', 'Enter your name and you’re in.') + '</p></div>'
        : '') +
      (erApp ? '' : '<p class="small">' + sprakLenke() + '</p>') +   // i appen byttes språk under Deg
      (melding ? '<p class="rom-feil" role="alert">' + esc(melding) + '</p>' : '') +
      fortsettBanner() +
      '<div class="rom-start' + (kode ? ' med-kode' : ' uten-kode') + '">' +
        '<form class="rom-boks" id="blimedSkjema">' +
          '<div class="rom-koderad" id="kodeRad"' + (medKode ? ' hidden' : '') + '><label for="romKode">' + T('Kode fra verten', 'Code from the host') + '</label>' +
          '<input id="romKode" class="rom-kodefelt" inputmode="text" autocomplete="off" autocapitalize="characters" autocorrect="off" spellcheck="false" enterkeyhint="next" maxlength="6" placeholder="ABCD" value="' + esc(kode) + '"></div>' +
          '<label for="romNavn1"' + (medKode ? '' : ' hidden') + '>' + T('Navnet ditt', 'Your name') + '</label>' +
          '<input id="romNavn1"' + (medKode ? '' : ' hidden') + ' maxlength="20" autocomplete="nickname" autocapitalize="words" autocorrect="off" spellcheck="false" enterkeyhint="go" placeholder="' + T('F.eks. Jonas', 'E.g. Alex') + '" value="' + esc(navn) + '">' +
          '<button class="btn gold rom-knapp" type="submit">' + T('Bli med', 'Join') + '</button>' +
          (medKode ? '<p class="rom-alder">' + T('Ved å bli med bekrefter du at du er over 18. Drikk med vett – og aldri kjør etterpå.', 'By joining you confirm you’re over 18. Drink responsibly – and never drive afterwards.') + '</p>' +
            '<p class="small rom-annet"><button type="button" class="linkbtn" id="visKode">' + T('Feil kode?', 'Wrong code?') + '</button> · <button type="button" class="linkbtn" id="visLag">' + T('Lag et eget rom', 'Create your own room') + '</button></p>' : '') +
        '</form>' +
        (medKode ? '' : '<p class="rom-eller" aria-hidden="true">' + T('eller', 'or') + '</p>') +
        '<form class="rom-boks lag' + (medKode ? ' skjult-lag' : '') + '" id="lagSkjema">' +
          (ln ? '<h2>' + T('Lag rom for ', 'Create a room for ') + esc(ln) + '</h2>' : '') +
          '<label for="romNavn2">' + T('Navnet ditt', 'Your name') + '</label>' +
          '<input id="romNavn2" maxlength="20" autocomplete="nickname" autocapitalize="words" autocorrect="off" spellcheck="false" enterkeyhint="go" placeholder="' + T('F.eks. Maria', 'E.g. Sam') + '" value="' + esc(navn) + '">' +
          '<button class="btn gold rom-knapp" type="submit">' + T('Lag rom', 'Create room') + '</button>' +
          (medKode ? '<p class="rom-alder">' + T('Ved å lage et rom bekrefter du at du er over 18.', 'By creating a room you confirm you’re over 18.') + '</p>' : '') +
        '</form>' +
      '</div>' +
      '';
    // Appen: navnet huskes (endres under Deg), så feltet er borte. «Lag rom» og «Bli med» er da ett trykk.
    if (erApp && navn) {
      ['romNavn1', 'romNavn2'].forEach(function (id) {
        var f = document.getElementById(id); if (!f) return;
        var lab = root.querySelector('label[for="' + id + '"]');
        f.hidden = true; if (lab) lab.hidden = true;
      });
      root.classList.add('navn-kjent');
    }
    var vk = document.getElementById('visKode');
    if (vk) vk.addEventListener('click', visKodefelt);
    if (medKode) kikk();
    var vl = document.getElementById('visLag');
    if (vl) vl.addEventListener('click', function () { var f = document.getElementById('lagSkjema'); if (f) { f.classList.remove('skjult-lag'); f.scrollIntoView({ block: 'center', behavior: 'smooth' }); } vl.parentNode.remove(); });
    if (qs.get('lag') === '1' && !kode) { var nf2 = document.getElementById('romNavn2'); if (nf2) setTimeout(function () { nf2.focus(); nf2.scrollIntoView({ block: 'center' }); }, 60); }
    /** Bli med i et rom. Gir {ok} eller {feil}. `alder` = knappen som ble trykket bekrefter at man er over 18 (lenke med kode, native startskjerm). */
    function startBliMed(k, n, alder) {
      k = String(k || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); n = String(n || '').trim();
      if (k.length < 4) return Promise.resolve({ feil: T('Skriv inn koden.', 'Enter the code.') });
      if (!n) return Promise.resolve({ feil: T('Skriv inn navnet ditt.', 'Enter your name.') });
      skriv('bd_mittnavn', n);
      if (alder) { try { localStorage.setItem('la_age_ok', '1'); } catch (x) {} }
      return api('POST', '/api/rom/' + k, { handling: 'bli-med', navn: n, lang: LANG }).then(function (d) {
        kode = k; meg = { id: d.id, pollett: d.pollett }; skriv('bd_rom_' + kode, meg); settAdresse(kode); ta(d); planlegg();
        return { ok: true, kode: k };
      }, function (err) { return { feil: err.message }; });
    }
    /** Lag et nytt rom (med leken fra lenka, om noen). Gir {ok, kode} eller {feil}. */
    function startLag(n, alder) {
      n = String(n || '').trim();
      if (!n) return Promise.resolve({ feil: T('Skriv inn navnet ditt.', 'Enter your name.') });
      skriv('bd_mittnavn', n);
      if (alder) { try { localStorage.setItem('la_age_ok', '1'); } catch (x) {} }
      return api('POST', '/api/rom', { navn: n, lek: onsketLek, modus: onsketModus, lang: LANG }).then(function (d) {
        kode = d.kode; meg = { id: d.id, pollett: d.pollett }; skriv('bd_rom_' + kode, meg); settAdresse(kode);
        versjon = 0; hent();
        return { ok: true, kode: d.kode };
      }, function (err) { return { feil: err.message }; });
    }
    document.getElementById('blimedSkjema').addEventListener('submit', function (e) {
      e.preventDefault();
      var k = document.getElementById('romKode').value;
      var n = (document.getElementById('romNavn1').value || (document.getElementById('romNavn2') || { value: '' }).value);
      startBliMed(k, n, medKode).then(function (r) { if (r.feil) { if (/^(Skriv inn|Enter)/.test(r.feil)) toast(r.feil); else tegnStart(r.feil); } });
    });
    // Kom man med en kode, er navnet det eneste som mangler
    if (kode) { var nf = document.getElementById('romNavn1'); if (nf && !nf.value) setTimeout(function () { nf.focus(); }, 50); }
    // Skriver du koden selv: store bokstaver, og videre til navnet når fire tegn er på plass
    var kf = document.getElementById('romKode');
    if (kf) kf.addEventListener('input', function () {
      var v = kf.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6); if (v !== kf.value) kf.value = v;
      var nf1 = document.getElementById(medKode ? 'romNavn1' : 'romNavn2'); if (v.length === 4 && nf1 && !nf1.value) nf1.focus();
    });
    // Appen: «Lag rom» på Hjem (?lag=1) og «Spill i rommet» på en lekeside (?lek=…) lager rommet med en gang når navnet er kjent
    // Bare første gang siden vises: forlater du rommet, skal du stå på startskjermen – ikke havne i et nytt rom
    var autoLag = erApp && (qs.get('lag') === '1' || onsketLek) && navn && !kode && !melding && !autoLagBrukt;
    if (autoLag) autoLagBrukt = true;
    if (autoLag) setTimeout(function () { var f = document.getElementById('lagSkjema'); if (f) f.requestSubmit(); }, 0);
    document.getElementById('lagSkjema').addEventListener('submit', function (e) {
      e.preventDefault();
      startLag(document.getElementById('romNavn2').value, medKode).then(function (r) { if (r.feil) { if (/^(Skriv inn|Enter)/.test(r.feil)) toast(r.feil); else tegnStart(r.feil); } });
    });
    // Swift-skallet: den native startskjermen ligger over denne siden og bruker disse for å lage/bli med i rommet
    window.__mvStart = {
      navn: function () { return navn; },
      lag: function (n) { return startLag(n, true); },
      bliMed: function (k, n) { return startBliMed(k, n, true); },
      fortsett: function () { var k = sistRom(); if (k) location.href = location.pathname + '?k=' + k; return { ok: !!k }; }
    };
    meldSkjerm(autoLag ? 'laster' : 'start', { navn: navn, kode: medKode ? kode : '', fortsett: sistRom() || '', melding: melding || '' });
  }
  /** Sier fra til app-skallet hvilken skjerm siden viser (start / laster / rom), så den native startskjermen kan vises eller gå bort */
  var sistSkjerm = '', autoLagBrukt = false;
  function meldSkjerm(skjerm, ekstra) {
    var n = skjerm + '|' + JSON.stringify(ekstra || {}); if (n === sistSkjerm) return; sistSkjerm = n;
    try { document.dispatchEvent(new CustomEvent('mv-skjerm', { detail: Object.assign({ skjerm: skjerm }, ekstra || {}) })); } catch (e) {}
  }

  /* ---------- gjengkveld: venterommet ---------- */
  function tegnVenter() {
    var t = tilstand;
    root.innerHTML = '<div class="rom-venter">' + (t.gjeng ? '<p class="rom-etikett">' + esc(t.gjeng.navn) + '</p>' : '') +
      '<h1 class="rom-h1">🚪 ' + T('Venter på å bli sluppet inn', 'Waiting to be let in') + '</h1>' +
      '<p>' + T('Du har bedt om å bli med som <b>' + esc(t.navn) + '</b>. ' + (t.vertNavn ? esc(t.vertNavn) + ' eller noen andre i gjengen' : 'Noen i gjengen') + ' må slippe deg inn.',
        'You asked to join as <b>' + esc(t.navn) + '</b>. ' + (t.vertNavn ? esc(t.vertNavn) + ' or someone else in the crew' : 'Someone in the crew') + ' needs to let you in.') + '</p>' +
      '<div class="rom-vent-prikker" aria-hidden="true"><span></span><span></span><span></span></div>' +
      ((t.spillere || []).length ? '<p class="small">' + T('Med i kveld: ', 'In tonight: ') + t.spillere.map(function (p) { return esc(p.navn); }).join(', ') + '</p>' : '') +
      '<p class="rom-forlat"><button class="linkbtn" data-g="forlat" type="button">' + T('Avbryt', 'Cancel') + '</button></p></div>';
  }
  /** Gjester som venter: verten og medlemmene kan slippe dem inn som gjest eller som nytt medlem. */
  function venterStripe() {
    var v = tilstand.venter || []; if (!v.length) return '';
    return '<div class="gk-venter" role="status">' + v.map(function (x) {
      return '<div class="gk-venter-rad"><span>🚪 <b>' + esc(x.navn) + '</b> ' + T('vil bli med', 'wants to join') + '</span><span class="gk-venter-knapper">' +
        '<button class="btn small gold" data-g="slipp-inn" data-id="' + esc(x.id) + '" data-som="gjest" type="button">' + T('Gjest i kveld', 'Guest tonight') + '</button>' +
        (tilstand.gjeng ? '<button class="btn small ghost" data-g="slipp-inn" data-id="' + esc(x.id) + '" data-som="medlem" type="button">' + T('Som medlem', 'As a member') + '</button>' : '') +
        '<button class="linkbtn" data-g="avvis-inn" data-id="' + esc(x.id) + '" type="button">' + T('Nei', 'No') + '</button></span></div>';
    }).join('') + '</div>';
  }
  /** Reglene i lovboka som gjelder i kveld. */
  function reglerKort() {
    var g = tilstand.gjeng; if (!g) return '';
    var r = g.regler || [];
    if (!r.length) return '<p class="gk-regler tom">📜 ' + T('Lovboka til ' + esc(g.navn) + ' er tom. Kveldens vinner skriver den første regelen.', esc(g.navn) + '’s law book is empty. Tonight’s winner writes the first rule.') + '</p>';
    var vis = r.slice(0, 6);
    return '<details class="gk-regler"' + (erApen('regler', true) ? ' open' : '') + ' data-gruppe="regler"><summary>📜 ' + T('Gjengens lov', 'The crew’s law') + ' <small>' + r.length + T(' regler gjelder i kveld', r.length === 1 ? ' rule applies tonight' : ' rules apply tonight') + '</small></summary><ol>' +
      vis.map(function (x) { return '<li><b>' + esc(x.tekst) + '</b><small>' + esc(x.av) + '</small></li>'; }).join('') + '</ol>' +
      (r.length > vis.length ? '<p class="small"><a href="' + RUTE.gjeng + '?k=' + esc(g.kode) + '#lovboka" target="_blank" rel="noopener">' + T('+ ' + (r.length - vis.length) + ' til i lovboka', '+ ' + (r.length - vis.length) + ' more in the law book') + '</a></p>' : '') + '</details>';
  }
  /** Kveldspoengene: 3–2–1 i hver lek. Verten velger vinneren av leker appen ikke kan måle. */
  function kveldKort() {
    var t = tilstand, k = t.kveld;
    if (!k) return '';
    var sp = '';
    if (k.sporsmal && erVert()) sp = '<div class="gk-sporsmal"><p><b>' + T('Hvem vant «' + esc(k.sporsmal.navn) + '»?', 'Who won “' + esc(k.sporsmal.navn) + '”?') + '</b> <small>' + T('Appen kunne ikke måle denne leken.', 'The app couldn’t measure this game.') + '</small></p><div class="rom-valg">' +
      t.spillere.map(function (p) { return '<button type="button" data-g="kv-vinner" data-id="' + p.id + '">' + esc(p.navn) + '</button>'; }).join('') +
      '<button type="button" data-g="kv-vinner" data-id="">' + T('Ingen / hopp over', 'Nobody / skip') + '</button></div></div>';
    var med = (k.stilling || []).filter(function (x) { return x.p > 0; });
    if (!med.length) return sp ? '<div class="gk-poeng">' + sp + '</div>' : '';
    var siste = (k.runder || [])[k.runder.length - 1];
    return '<div class="gk-poeng">' + sp + '<p class="rom-etikett">🏅 ' + T('Kveldens stilling', 'Tonight’s standings') + '</p><ol class="gk-stilling">' +
      med.slice(0, 6).map(function (x, i) { return '<li class="' + (x.id === t.meg ? 'meg' : '') + '"><span>' + (i === 0 ? '👑 ' : '') + esc(navn(x.id)) + '</span><b>' + x.p + '</b></li>'; }).join('') + '</ol>' +
      (siste ? '<p class="small">' + T('Sist: ', 'Last: ') + esc(siste.navn) + ' – ' + siste.plass.map(function (g, i) { return g.map(function (id) { return esc(navn(id)); }).join(' & ') + ' ' + [3, 2, 1][i]; }).join(', ') + '</p>' : '') + '</div>';
  }
  /** Planen verten valgte da kvelden ble startet fra gjengen. */
  function planLek(id) {
    var l = (tilstand.leker || []).find(function (x) { return x.id === id; }); if (!l) return null;
    return { id: l.id, navn: l.navn, modus: l.type === 'nyhetsrunden' && l.moduser && l.moduser[0] ? l.moduser[0].v : '*', pluss: !!l.pluss };
  }
  /** Neste lek i planen: den første som ikke er spilt ennå (etter den som spilles nå). */
  function nestePlan() {
    var t = tilstand; if (!t.plan || !t.plan.length) return null;
    var leker = t.plan.filter(function (id) { return id !== 'bors'; }).map(planLek).filter(Boolean);
    if (!leker.length) return null;
    var spilt = (t.historikk || []).map(String), naa = t.spill ? String(t.spill.navn) : '';
    var ikke = leker.filter(function (l) { return spilt.indexOf(l.navn) === -1 && l.navn !== naa; });
    if (ikke.length) return ikke[0];
    // Alt er spilt: start runden på nytt, men ikke samme lek som nå
    return leker.find(function (l) { return l.navn !== naa; }) || null;
  }
  /** Start neste lek i planen – og Vorsbørsen i bakgrunnen første gang, hvis den er med i planen. */
  function startPlan() {
    var t = tilstand, l = nestePlan();
    if (t.plan && t.plan.indexOf('bors') !== -1 && !t.bors) {
      if (t.spillere.length >= 3) gjorAlltid({ handling: 'bs-start', fokus: !l });
      else toast(T('Vorsbørsen starter når dere er minst tre.', 'The Exchange starts once there are at least three of you.'));
    }
    if (!l) return;
    if (l.pluss && !t.pluss) return visPlussTilbud();
    gjorAlltid({ handling: 'start', lek: l.id, modus: l.modus, sett: (settListe()[l.id] || []).slice(-1500) });
  }
  function planBoks() {
    var t = tilstand; if (!erVert() || !t.plan || !t.plan.length) return '';
    var spilt = (t.historikk || []).map(String), neste = nestePlan(), forste = !spilt.length && !t.bors;
    return '<div class="gk-plan"><p class="rom-etikett">' + T('Kveldens plan', 'Tonight’s plan') + '</p>' +
      '<button class="rom-stor-knapp gk-planstart" data-g="plan-start" type="button">' + (forste ? '▶ ' + T('Start kvelden', 'Start the night') : '⏭ ' + T('Neste lek', 'Next game')) +
        (neste ? '<small>' + esc(neste.navn) + (forste && t.plan.indexOf('bors') !== -1 ? T(' + Vorsbørsen i bakgrunnen', ' + the Exchange in the background') : '') + '</small>' : (t.plan.indexOf('bors') !== -1 ? '<small>' + T('Vorsbørsen', 'The Exchange') + '</small>' : '')) + '</button>' +
      '<p class="small">' + T('Eller velg fritt fra planen:', 'Or pick freely from the plan:') + '</p><div class="rom-valg">' + t.plan.map(function (id) {
        if (id === 'bors') return t.bors ? '' : '<button type="button" data-g="bs-start">📈 ' + T('Vorsbørsen', 'The Exchange') + '</button>';
        var l = planLek(id); if (!l) return '';
        return '<button type="button" data-g="start" data-lek="' + esc(l.id) + '" data-modus="' + esc(l.modus) + '">' + (spilt.indexOf(l.navn) !== -1 ? '✓ ' : '') + esc(l.navn) + '</button>';
      }).join('') + '</div></div>';
  }
  /** Slutten av kvelden: kveldens vinner – og i en gjeng: vinneren velger regel. */
  function kveldVinnerBoks() {
    var t = tilstand, k = t.kveld || {}, v = k.vinner;
    if (!v) return t.kveld ? '<p class="small">' + T('Ingen fikk kveldspoeng i kveld.', 'Nobody got night points tonight.') + '</p>' : '';
    var poeng = ((k.stilling || []).find(function (x) { return x.id === v; }) || {}).p || 0;
    var ut = '<div class="gk-vinner"><p class="gk-krone" aria-hidden="true">🏆</p><h2>' + esc(navn(v)) + T(' vant kvelden!', ' won the night!') + '</h2><p class="small">' + poeng + T(' kveldspoeng', ' night points') + '</p>';
    if (!t.gjeng) return ut + '</div>';
    var lv = k.lovValg;
    if (lv) {
      ut += lv.type === 'ny' ? '<p class="rom-etikett">📜 ' + T('Ny regel i lovboka', 'New rule in the law book') + '</p><p class="gk-regel">«' + esc(lv.tekst) + '»</p>'
        : lv.type === 'opphev' ? '<p class="rom-etikett">🗑️ ' + T('Opphevet', 'Repealed') + '</p><p class="gk-regel strek">«' + esc(lv.tekst) + '»</p>'
        : '<p>' + T('Lovboka står som den er.', 'The law book stays as it is.') + '</p>';
      ut += lv.lagret ? '<p class="small">' + T('Lagret i lovboka til ' + esc(t.gjeng.navn) + '. Gjelder fra neste kveld – til noen opphever den.', 'Saved in ' + esc(t.gjeng.navn) + '’s law book. Applies from the next night – until someone repeals it.') + '</p>' : '<p class="small">' + T('Lagrer …', 'Saving …') + '</p>';
      if (lv.type !== 'ingen') ut += '<button class="btn ghost small" data-g="lov-del" type="button">' + T('Del regelen', 'Share the rule') + '</button>';
      return ut + '</div>';
    }
    if (v !== t.meg) return ut + '<p>' + esc(navn(v)) + T(' velger en regel til lovboka …', ' is picking a rule for the law book …') + '</p></div>';
    var r = t.gjeng.regler || [];
    return ut + '<p class="rom-etikett">' + T('Du vant! Skriv en ny regel', 'You won! Write a new rule') + '</p>' +
      '<p class="small">' + T('Regelen gjelder hver gang gjengen spiller – til en senere vinner opphever den, eller flertallet stemmer den bort.', 'The rule applies every time the crew plays – until a later winner repeals it, or the majority votes it out.') + '</p>' +
      '<form class="rf-skjema" id="lovNySkjema"><div class="rf-rad"><input id="lovNyTekst" maxlength="140" autocomplete="off" enterkeyhint="send" placeholder="' + T('F.eks. «Alle skåler på norsk dialekt»', 'E.g. “Every toast is in a pirate voice”') + '"><button class="btn gold" type="submit">' + T('Innfør', 'Introduce') + '</button></div></form>' +
      (r.length ? '<p class="rom-etikett">' + T('… eller opphev en regel', '… or repeal a rule') + '</p><div class="rom-valg en">' + r.map(function (x) { return '<button type="button" data-g="lov-opphev" data-id="' + esc(x.id) + '">🗑️ ' + esc(x.tekst) + '</button>'; }).join('') + '</div>' : '') +
      '<p><button class="linkbtn" data-g="lov-ingen" type="button">' + T('La lovboka være som den er', 'Leave the law book as it is') + '</button></p></div>';
  }

  /* ---------- selve rommet ---------- */
  function sofaFolk() { return (tilstand && tilstand.stua && tilstand.stua.sofa) || []; }
  function navn(id) { var p = (tilstand.spillere || []).concat(sofaFolk()).find(function (x) { return x.id === id; }); return p ? p.navn : '?'; }
  function erVert() { return tilstand && meg && tilstand.vert === meg.id; }

  function hode() { var rivalTopp = null, rivalBunn = null;
    var t = tilstand;
    return '<div class="rom-hode">' +
      '<div class="rom-hode-v"><a class="rom-hjem" href="' + RUTE.hjem + '" aria-label="' + T('Til forsiden (du blir i rommet)', 'Home (you stay in the room)') + '"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v9.5h13V10"/></svg></a>' +
      '<div><span class="rom-etikett">' + (t.gjeng && t.gjeng.kveld ? esc(t.gjeng.navn) + ' · ' : '') + T('Rom', 'Room') + '</span><b class="rom-kode">' + esc(kode) + '</b> ' + sprakLenke('small') + '</div></div>' +
      '<span class="rom-hodeknapper">' +
        [['hjul-aapne', klistremerke('hjul', 'rom-hk-merke'), T('Hjul', 'Wheel'), T('Straffehjulet', 'Penalty wheel')], ['tavle', klistremerke('pokal', 'rom-hk-merke'), T('Poeng', 'Score'), T('Poengtavla', 'Scoreboard')],
         ['qr', ikon.qr, 'QR', T('Vis QR-kode', 'Show QR code')], ['del', ikon.del, T('Inviter', 'Invite'), T('Inviter flere', 'Invite more people')]]
         // Under leken på mobil ligger stua og resten (regler, slurker, vertens knapper) bak to knapper, så leken får hele skjermen
         .concat(t.spill ? [['stua-ark', ikon.stua, T('Stua', 'Room'), T('Stua', 'The living room')], ['mer-ark', ikon.mer, T('Mer', 'More'), T('Regler og mer', 'Rules and more')]] : []).map(function (k) {
          return '<button class="rom-hk" data-g="' + k[0] + '" type="button" aria-label="' + k[3] + '"><span class="rom-hk-ikon">' + k[1] + '</span><span class="rom-hk-tekst">' + k[2] + '</span></button>';
        }).join('') + '</span>' +
    '</div>' +
    '<div class="rom-spillere">' + (function () {
      // Rivalisering: 🔥 på den som har drukket mest, 😇 på den som har drukket minst – bare når det er klart hvem
      var sl = t.spillere.map(function (p) { return p.slurker || 0; }).sort(function (a, b) { return a - b; }), n = sl.length;
      rivalTopp = n >= 2 && sl[n - 1] > 0 && sl[n - 1] > sl[n - 2] ? sl[n - 1] : null;
      rivalBunn = n >= 3 && sl[n - 1] > 0 && sl[0] < sl[1] ? sl[0] : null;
      return '';
    })() + t.spillere.map(function (p) {
      var rival = rivalTopp !== null && (p.slurker || 0) === rivalTopp ? '<i class="rom-rival" title="' + T('Flest slurker i kveld', 'Most sips tonight') + '">' + klistremerke('flamme', 'rom-rival-merke') + '</i>'
        : rivalBunn !== null && (p.slurker || 0) === rivalBunn ? '<i class="rom-rival" title="' + T('Færrest slurker i kveld', 'Fewest sips tonight') + '">' + klistremerke('glorie', 'rom-rival-merke') + '</i>' : '';
      return '<span class="' + (p.id === t.meg ? 'meg' : '') + '">' + (p.id === t.vert ? ikon.krone : '') + esc(p.navn) + rival +
        (p.slurker ? ' <small>' + p.slurker + '</small>' : '') + (p.immun ? ' <small title="' + T('Immunitet', 'Immunity') + '">🛡️' + (p.immun > 1 ? p.immun : '') + '</small>' : '') +
        (erVert() && p.id !== t.vert ? ' <button class="rom-fjern" data-g="fjern" data-id="' + p.id + '" aria-label="' + T('Fjern ', 'Remove ') + esc(p.navn) + '">×</button>' : '') + '</span>';
    }).join('') + '</div>';
  }


  /** Under leken på mobil: spillerne som små hoder på én rad i stedet for navnebrikker. Den som har tur, lyser. */
  function hoderad(s) {
    var tur = s && s.turId || null;
    return '<div class="rom-hoder" aria-label="' + T('Spillerne', 'The players') + '">' + (tilstand.spillere || []).map(function (p) {
      return '<span class="rh' + (p.id === tilstand.meg ? ' meg' : '') + (p.id === tur ? ' tur' : '') + '">' + nrHode(p.id) + '<small>' + esc(p.navn) + '</small></span>';
    }).join('') + '</div>';
  }
  function erMobil() { return window.matchMedia('(max-width:899px)').matches; }

  // På mittvors.no holder det med mittvors.no/KODE (kortere lenke og enklere QR-kode)
  var kortDomene = /(^|\.)mittvors\.no$/.test(location.hostname) || erApp;   // appen: sidene ligger lokalt, men lenkene skal til mittvors.no
  function lenke() { return kortDomene ? 'https://mittvors.no/' + kode : (window.__MV_ORIGIN || location.origin) + RUTE.rom + '?k=' + kode; }
  function qrBoks(stor) {
    var svg = window.BDqr ? window.BDqr(lenke()) : '';
    return '<div class="rom-qr' + (stor ? ' stor' : '') + '">' + (svg ? '<div class="rom-qrbilde">' + svg + '</div>' : '') +
      '<div><b>' + T('Scan for å bli med', 'Scan to join') + '</b><span>' + (kortDomene ? T('Eller gå til ', 'Or go to ') + '<b>mittvors.no/' + esc(kode) + '</b>' : T('Eller gå til ', 'Or go to ') + esc(location.host) + RUTE.rom + T(' og skriv ', ' and enter ') + '<b>' + esc(kode) + '</b>') + '</span></div></div>';
  }
  /* ---------- Bare vertens telefon: sofaen i stua ----------
     Blir ingen med etter et minutt, kommer et kort: «Start med bare min telefon». Da skriver verten navnene på dem som er her,
     og de setter seg i sofaen i stua (de er ikke spillere i rommet, så de vanlige lekene påvirkes ikke).
     Lekene her spilles på én telefon: kortet går rundt, og verten trykker hvem som drakk. */
  var sofaFane = 'leser', aleneFra = 0, aleneLukket = 0, aleneTimer = null;
  function sofaNokkel() { return 'bd_sofa_' + kode; }
  function sofaModus() {
    if (sofaFolk().length) return true;
    try { return localStorage.getItem(sofaNokkel()) === '1'; } catch (e) { return false; }
  }
  // «Verten leser»: kortet leses høyt, verten teller ned, og alle svarer høyt samtidig. «Send rundt»: telefonen går fra hånd til hånd.
  var EN_LEKER = [
    ['jeg-har-aldri', 'leser', T('Jeg har aldri', 'Never have I ever'), T('Les høyt, tell ned – har du gjort det, drikker du.', 'Read it out, count down – done it? Drink.'), 'kort'],
    ['pekeleken', 'leser', T('Pekeleken', 'Most likely to'), T('Les høyt, tell ned – alle peker samtidig.', 'Read it out, count down – everyone points at once.'), 'pek'],
    ['enten-eller', 'leser', T('Enten eller', 'Would you rather'), T('Les høyt, tell ned – alle sier sitt valg samtidig.', 'Read it out, count down – everyone says their pick at once.'), 'kort'],
    ['samme', 'leser', T('Saueflokken', 'The herd'), T('Les høyt, tell ned – alle roper ett ord. Står du alene, drikker du.', 'Read it out, count down – everyone shouts one word. Alone? Drink.'), 'kort'],
    ['nodt-eller-sannhet', 'leser', T('Nødt eller sannhet', 'Truth or dare'), T('Den i stolen velger – gjør det, eller drikk.', 'Whoever is in the chair picks – do it, or drink.'), 'kort'],
    ['kategorier', 'rundt', T('Kategorier', 'Categories'), T('Telefonen er bomba. Si et ord og gi den videre før den smeller.', 'The phone is the bomb. Say a word and pass it on before it blows.'), 'bombe'],
    ['ring-of-fire', 'rundt', T('Ring of Fire', 'Ring of Fire'), T('Trekk ditt eget kort, les regelen og gi telefonen videre.', 'Draw your own card, read the rule and pass the phone on.'), 'kort'],
  ];
  var EN_IKON = { kort: 'M6 3h12v18h-12zM9 8h6M9 12h6', pek: 'M12 21v-9M8 12l4-9 4 9', bombe: 'M11 21a7 7 0 1 1 0-14 7 7 0 0 1 0 14zM15 8l3-3M18 5h2' };
  function sofaLobby() {
    var folk = sofaFolk(), n = folk.length;
    var ut = '<div class="sofa-lobby"><p class="nr-etikett">' + T('Bare din telefon', 'Just your phone') + '</p><h2 class="sofa-tittel">' + T('Hvem er her?', 'Who’s here?') + '</h2>' +
      '<form id="sofaSkjema" class="sofa-skjema"><label><span class="sr-only">' + T('Navn', 'Name') + '</span><input id="sofaNavn" maxlength="16" autocomplete="off" placeholder="' + T('Navn på en som er her', 'Name of someone here') + '"></label>' +
      '<button type="submit" aria-label="' + T('Sett i sofaen', 'Seat on the sofa') + '"' + (n >= 6 ? ' disabled' : '') + '>+</button></form>' +
      (n ? '<p class="small sofa-antall">' + T('Du + ', 'You + ') + n + T(' i sofaen', ' on the sofa') + (n >= 6 ? T(' · sofaen er full', ' · the sofa is full') : '') + '</p>' : '') +
      (n ? '<div class="sofa-chips">' + folk.map(function (p) { return '<button type="button" data-g="sofa-fjern" data-paa="' + esc(p.id) + '" aria-label="' + T('Fjern ', 'Remove ') + esc(p.navn) + '">' + esc(p.navn) + ' <span aria-hidden="true">×</span></button>'; }).join('') + '</div>' : '');
    if (n) {
      var leser = sofaFane === 'leser';
      ut += '<h2 class="sofa-tittel">' + T('Velg lek', 'Pick a game') + '</h2>' +
        '<div class="sofa-faner" role="group" aria-label="' + T('Hvordan spiller dere?', 'How do you play?') + '"><i class="' + (leser ? 'h' : '') + '"></i>' +
        '<button type="button" data-g="sofa-fane" data-v="rundt" aria-pressed="' + !leser + '">' + T('Send rundt', 'Pass it round') + '</button>' +
        '<button type="button" data-g="sofa-fane" data-v="leser" aria-pressed="' + leser + '">' + T('Verten leser', 'Host reads') + '</button></div>' +
        '<div class="sofa-leker">' + EN_LEKER.filter(function (l) { return l[1] === sofaFane; }).map(function (l, i) {
          return '<button type="button" class="sofa-lek" data-g="en-start" data-lek="' + l[0] + '" style="--f:' + i * 40 + 'ms"><span class="sofa-lek-merke"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + EN_IKON[l[4]] + '"/></svg></span><b>' + l[2] + '</b><small>' + l[3] + '</small></button>';
        }).join('') + '</div>';
    } else ut += '<button class="linkbtn sofa-av" data-g="sofa-av" type="button">' + T('Tilbake – vent på telefoner', 'Back – wait for phones') + '</button>';
    return ut + '</div>';
  }
  function aleneArk() {
    var t = tilstand;
    if (!erVert() || t.spill || sofaModus() || (t.spillere || []).length > 1) { aleneFra = 0; return ''; }
    if (!aleneFra) aleneFra = Date.now();
    if (aleneLukket === Infinity) return '';
    try { if (sessionStorage.getItem('bd_alene_vent_' + kode)) { aleneLukket = Infinity; return ''; } } catch (e) {}
    var vent = 60000 - (Date.now() - Math.max(aleneFra, aleneLukket));
    if (vent > 0) { clearTimeout(aleneTimer); aleneTimer = setTimeout(tegn, vent + 50); return ''; }
    return '<div class="sofa-ark" role="dialog" aria-label="' + T('Ingen telefoner oppe?', 'No phones out?') + '"><i class="sofa-ark-hank"></i><b>' + T('Ingen telefoner oppe?', 'No phones out?') + '</b>' +
      '<button class="rom-stor-knapp" data-g="sofa-start" type="button">' + T('Start med bare min telefon', 'Start with just my phone') + '</button>' +
      '<button class="linkbtn" data-g="sofa-vent" type="button">' + T('Vent litt til', 'Wait a bit longer') + '</button></div>';
  }
  /** Lekene på én telefon. Lese-spill: kortet leses høyt, verten teller ned 3 – 2 – 1, og alle svarer samtidig. Ingen trykker
      for andre – dere tar drikkingen selv. Sende-rundt-spill: telefonen går fra hånd til hånd (bomba i Kategorier, kortet i Ring of Fire). */
  var enSett = {}, enTell = { k: '', fase: 'klar', tall: 3, t: [] }, enBombe = { k: '', fase: 'klar', holder: 0, start: 0, lengde: 0, timer: null };
  var EN_TELL = {
    'jeg-har-aldri': [T('Drikk!', 'Drink!'), T('Har du gjort det? Drikk – alle samtidig.', 'Done it? Drink – all at once.')],
    'pekeleken': [T('Pek!', 'Point!'), T('Flest fingre drikker like mange slurker.', 'Most fingers drinks that many sips.')],
    'enten-eller': [T('Si det!', 'Say it!'), T('Færrest på sin side? Drikk 1. Likt? Alle drikker.', 'Fewest on your side? Drink 1. A tie? Everyone drinks.')],
    'samme': [T('Si det!', 'Say it!'), T('Sa du noe ingen andre sa? Du er et svart får – drikk 1.', 'Said something nobody else did? Black sheep – drink 1.')]
  };
  function enFolk(s) { return (s.lesere || [tilstand.vert]).concat((tilstand.spillere || []).filter(function (p) { return (s.lesere || []).indexOf(p.id) === -1; }).map(function (p) { return p.id; })); }
  function enNavn(id) { return id === tilstand.meg ? T('du', 'you') : esc(navn(id)); }
  function enNedtelling(k) {
    enTell.t.forEach(clearTimeout);
    enTell = { k: k, fase: 'teller', tall: 3, t: [] };
    spillLyd('tell', 3);
    enTell.t = [setTimeout(function () { enTell.tall = 2; spillLyd('tell', 2); tegn(); }, 800), setTimeout(function () { enTell.tall = 1; spillLyd('tell', 1); tegn(); }, 1600),
      setTimeout(function () { enTell.fase = 'sagt'; spillLyd('naa'); try { navigator.vibrate && navigator.vibrate(80); } catch (e) {} tegn(); }, 2400)];
    tegn();
  }
  function enBombeStart(k) {
    clearInterval(enBombe.timer);
    enBombe = { k: k, fase: 'gaar', holder: 0, start: Date.now(), lengde: 20000 + Math.random() * 30000, timer: null, tikk: 0 };
    enBombe.timer = setInterval(function () {
      var el = document.querySelector('.en-bombe svg'), naa = Date.now(), a = (naa - enBombe.start) / enBombe.lengde;
      if (a >= 1) { clearInterval(enBombe.timer); enBombe.fase = 'bom'; try { navigator.vibrate && navigator.vibrate([200, 80, 300]); } catch (e) {} spillLyd('bom'); return tegn(); }
      // Lunta tikker i samme takt som bomben pulserer – raskere mot slutten
      var d = a < .5 ? 1000 : a < .8 ? 600 : 320;
      if (el) el.style.setProperty('--d', d + 'ms');
      if (naa - enBombe.tikk >= d - 20) { enBombe.tikk = naa; spillLyd('lunte'); }
    }, 80);
    tegn();
  }
  function enSpill(s) { return '<div class="en-flate">' + enSpillInnhold(s) + '</div>'; }
  function enSpillInnhold(s) {
    var nk = (s.runde || 1) + ':' + s.pos, ny = !enSett[nk]; enSett[nk] = 1;
    var lek = EN_LEKER.find(function (l) { return l[0] === s.lek; }) || [s.lek, 'leser', s.navn];
    var rundt = lek[1] === 'rundt';
    var chip = s.ferdig ? T('Bunken er tom', 'Deck done') : rundt ? enNavn(s.leser).replace(/^./, function (c) { return c.toUpperCase(); }) + T(' har telefonen', ' has the phone') : esc(navn(s.leser)) + T(' leser', ' reads');
    var topp = jaTopp(esc(lek[2]) + T(' · én telefon', ' · one phone'), chip, !s.ferdig, false);
    if (s.ferdig) {
      enTell.t.forEach(clearTimeout); clearInterval(enBombe.timer);
      return topp + (s.lek === 'ring-of-fire' && s.konger >= 4 ? '<p class="en-regel">' + T('Fjerde konge er trukket – leken er over.', 'The fourth king is drawn – the game is over.') + '</p>' : '') +
        lekSlutt([['runde', T('Spill igjen', 'Play again'), T('Ny bunke – teller i kvelden', 'New deck – counts tonight')]]);
    }
    var k = s.kort || {}, t = String(k.t || '');
    var str = function (tekst, maks, min) { var l = Math.max.apply(null, tekst.split(/\s+/).map(function (w) { return w.length; }).concat([1])); return Math.max(min, Math.min(maks, Math.floor(290 / (l * 0.56)), Math.floor(1000 / (Math.max(1, tekst.length) * 0.55)))); };
    var neste = enNavn(s.neste);
    // ---- Kategorier: telefonen er bomba
    if (s.lek === 'kategorier') {
      if (enBombe.k !== nk) { clearInterval(enBombe.timer); enBombe = { k: nk, fase: 'klar', holder: enBombe.holder || 0, start: 0, lengde: 0, timer: null }; }
      var folk = enFolk(s), h = folk[enBombe.holder % folk.length], hn = folk[(enBombe.holder + 1) % folk.length];
      var kat = '<div class="en-kat"><small>' + T('Kategori', 'Category') + '</small><b>' + esc(t) + '</b></div>';
      topp = jaTopp(esc(lek[2]) + T(' · én telefon', ' · one phone'), enBombe.fase === 'gaar' ? esc(navn(h)) + T(' har bomba', ' has the bomb') : enBombe.fase === 'bom' ? T('Bomba smalt!', 'The bomb went off!') : T('Les kategorien høyt', 'Read the category out'), true, false);
      if (enBombe.fase === 'bom') return topp.replace('ja-topp', 'ja-topp en-bom-topp') + kat + '<div class="en-bom"><b>' + T('BOM!', 'BOOM!') + '</b><span>' + esc(navn(h)) + T(' drikker 2', ' drinks 2') + '</span></div>' +
        '<button type="button" class="rom-stor-knapp" data-g="en-bom-neste" data-paa="' + esc(h) + '">' + T('Ny kategori', 'New category') + '</button>';
      var gaar = enBombe.fase === 'gaar';
      return topp + kat + '<div class="en-bombe' + (gaar ? ' gaar' : '') + '"><svg viewBox="0 0 210 210" aria-hidden="true"><path d="M128 52 C140 30 160 22 176 24" class="lunte"/><rect x="104" y="44" width="34" height="26" rx="6" transform="rotate(30 121 57)" class="hals"/><circle cx="96" cy="124" r="70" class="kule"/><path d="M58 98 C66 80 82 70 100 68" class="glans"/>' +
          (gaar ? '<g class="gnist"><circle cx="178" cy="24" r="10"/><path d="M178 4 V12 M198 24 H190 M178 44 V36 M158 24 H166"/></g>' : '') + '</svg>' +
          '<b>' + (gaar ? esc(navn(h)) + T(' har bomba', ' has the bomb') : T('Klar?', 'Ready?')) + '</b><span>' + (gaar ? T('Si et ord som passer, og gi telefonen videre. Ingen vet når den smeller.', 'Say a word that fits and pass the phone on. Nobody knows when it blows.') : T('Les kategorien høyt, trykk start og gi telefonen til ', 'Read the category out, press start and hand the phone to ') + esc(navn(h)) + '.') + '</span></div>' +
        '<button type="button" class="rom-stor-knapp en-send" data-g="' + (gaar ? 'en-bombe-send' : 'en-bombe-start') + '">' + (gaar ? T('Sagt! Gi til ', 'Said it! Pass to ') + esc(navn(hn)) + ' →' : T('Start bomba', 'Start the bomb')) + '</button>';
    }
    // ---- Ring of Fire: den som har telefonen, trekker
    if (s.lek === 'ring-of-fire') {
      var kopp = ''; for (var q = 0; q < 4; q++) kopp += '<i class="' + (q < s.konger ? 'paa' : '') + '"></i>';
      var siste = k.konge && s.konger >= 4;
      return topp + '<div class="en-kopp" aria-label="' + s.konger + T(' av 4 konger', ' of 4 kings') + '"><span>' + T('Kongekoppen', 'King’s cup') + '</span><span class="en-kopp-prikker">' + kopp + '</span></div>' +
        '<button type="button" class="en-rof' + (k.rod ? ' rod' : '') + '" data-g="en-neste" aria-label="' + T('Trekk neste kort', 'Draw the next card') + '"><span class="' + (ny && s.pos ? 'snu' : '') + '">' +
          '<span class="en-rof-hj"><b>' + esc(k.v || '') + '</b><i>' + esc(k.s || '') + '</i></span>' +
          '<span class="en-rof-midt"><b>' + esc(siste ? T('Fjerde konge!', 'Fourth king!') : k.regel || '') + '</b><span>' + esc(siste ? enNavn(s.leser).replace(/^./, function (c) { return c.toUpperCase(); }) + T(' drikker opp koppen.', ' finishes the cup.') : k.tekst || '') + '</span></span>' +
          '<em>' + (siste ? T('Trykk for å avslutte', 'Tap to finish') : T('Les regelen høyt – gi telefonen til ', 'Read the rule out – pass the phone to ') + neste + T(', som trykker for neste kort', ', who taps for the next card')) + '</em></span></button>';
    }
    // ---- Lese-spillene: kortet, så 3 – 2 – 1
    if (enTell.k !== nk) { enTell.t.forEach(clearTimeout); enTell = { k: nk, fase: 'klar', tall: 3, t: [] }; }
    var kortHtml;
    if (s.lek === 'enten-eller' && s.a) kortHtml = '<div class="en-ee' + (ny && s.pos ? ' inn' : '') + '"><span><small>' + T('Enten', 'Either') + '</small><b>' + esc(s.a) + '</b></span><span><small>' + T('Eller', 'Or') + '</small><b>' + esc(s.b) + '</b></span></div>';
    else kortHtml = '<div class="en-lest' + (ny && s.pos ? ' inn' : '') + '">' + (k.k ? '<small>' + esc(k.k) + '</small>' : s.lek === 'samme' ? '<small>' + T('Tenk som flokken', 'Think like the herd') + '</small>' : '') + '<b style="font-size:' + str(t, 34, 22) + 'px">' + esc(t) + '</b></div>';
    var tell = EN_TELL[s.lek], midt = '';
    if (tell) {
      if (enTell.fase === 'klar') midt = '<button type="button" class="en-tell" data-g="en-tell">' + T('Les høyt,', 'Read it out,') + '<br>' + T('så tell ned', 'then count down') + '</button>';
      else if (enTell.fase === 'teller') midt = '<b class="en-tall t' + enTell.tall + '" aria-live="assertive">' + enTell.tall + '</b>';
      else midt = '<b class="en-si">' + tell[0] + '</b><p class="en-regel">' + tell[1] + '</p>';
    } else midt = '<p class="en-regel">' + (s.lek === 'nodt-eller-sannhet' ? T('Den i stolen velger, og gjør det – eller drikker.', 'Whoever is in the chair picks, and does it – or drinks.') : T('Les høyt.', 'Read it out.')) + '</p>';
    var klar = !tell || enTell.fase === 'sagt';
    return topp + kortHtml + '<div class="en-midt">' + midt + '</div>' +
      '<button type="button" class="rom-stor-knapp en-neste' + (klar ? '' : ' svak') + '" data-g="en-neste">' + T('Neste kort – ', 'Next card – ') + esc(navn(s.neste)) + T(' leser', ' reads') + '</button>';
  }
  function lobby() {
    var t = tilstand;
    if (t.valgt && !visAlle) return valgtLobby();
    if (!erVert()) {
      var venter = '<div class="rom-vent"><p class="rom-stor">' + esc(navn(t.vert)) + (t.plan && t.plan.length ? T(' starter kvelden', ' is starting the night') : T(' velger lek', ' is picking a game')) + '</p>' +
        '<div class="rom-vent-prikker" aria-hidden="true"><span></span><span></span><span></span></div>';
      // Appen: gjesten trenger bare stua og beskjeden om at verten velger – ikke kveldskort, regler eller merker
      if (erApp) return venter + '</div>';
      return venter + romMerker() + '</div>' + kveldKort() + reglerKort();
    }
    if (sofaModus()) return sofaLobby();
    if (erApp && !appMer) return appLobby();
    var borsFull = t.bors && t.bors.paa && !t.bors.fokus ? '<p><button class="btn ghost" data-g="bs-fokus" type="button">' + T('📈 Gjør Vorsbørsen til hovedspill', '📈 Make the Exchange the main game') + '</button></p>' : '';
    return (erApp ? '<p class="app-tilbake"><button type="button" class="linkbtn" data-g="app-tilbake">← ' + T('Tilbake til lekene', 'Back to the games') + '</button></p>' : '') + plassInfo() + planBoks() +
      (t.spillere.length > 1 ? '' : qrBoks()) +
      '<div class="rom-knapperad">' + (visSkjerm ? '' : '<button type="button" class="rom-knapp-stor" data-g="skjerm">📺 ' + T('Vis på TV', 'Show on TV') + '</button>') +
        '<button type="button" class="rom-knapp-stor" data-g="sofa-start">🛋️ ' + T('Bare min telefon', 'Just my phone') + '</button></div>' +
      '<h2 class="rom-h2">' + T('Velg en lek', 'Pick a game') + '</h2>' + kveldKort() + reglerKort() + anbefalteLeker() +
      lekeGrupper(t.leker.filter(function (l) { return !l.pluss && !l.skjult; }), function (l) {
        var mod = l.moduser && (l.moduser.length > 1 || l.type === 'nyhetsrunden') ? l.moduser : [];
        var min = forFa(l);
        var infoKn = '<button type="button" class="lek-info" data-g="lek-info" data-lek="' + esc(l.id) + '" aria-label="' + T('Om ', 'About ') + esc(l.navn) + '">i</button>';
        if (min) return '<div class="rom-lek for-fa">' + klistremerke(l.id, 'rom-lek-merke') + '<b>' + esc(l.navn) + infoKn + '</b><p class="small">👥 ' + T('Minst ' + min, 'At least ' + min) + '</p></div>';
        var lekId = l.id === 'pekeleken' && pkMobil ? 'mest' : l.id;
        return '<div class="rom-lek">' + klistremerke(l.id, 'rom-lek-merke') + '<b>' + esc(l.navn) + infoKn + '</b>' + (l.id === 'pekeleken' ? pkVariant() : '') +
          '<div class="rom-mod">' + (mod.length
            ? mod.slice(0, l.type === 'nyhetsrunden' ? 4 : 99).map(function (m) { return '<button type="button" data-g="start" data-lek="' + lekId + '" data-modus="' + esc(m.v) + '">' + esc(m.t) + '</button>'; }).join('') +
              (l.type !== 'bingo' && l.type !== 'nyhetsrunden' ? '<button type="button" data-g="start" data-lek="' + lekId + '" data-modus="*">' + T('Alle', 'All') + '</button>' : '') +
              (l.type === 'nyhetsrunden' && mod.length > 4 ? '<select class="rom-nr-arkiv" data-nr-arkiv aria-label="' + T('Eldre uker', 'Older weeks') + '"><option value="">' + T('Eldre uker …', 'Older weeks …') + '</option>' +
                mod.slice(4).map(function (m) { return '<option value="' + esc(m.v) + '">' + esc(m.t) + (nrSpilt().indexOf(m.v) !== -1 ? ' ✓' : '') + '</option>'; }).join('') + '</select>' : '')
            : '<button type="button" data-g="start" data-lek="' + l.id + '" data-modus="*">Start</button>') +
          '</div></div>';
      }) + plussLeker() + egneStokker() +
      '<h2 class="rom-h2">' + T('Hele kvelden', 'All night') + '</h2>' + bakgrunnBoks() + borsFull + romValg() + gjengBoks() + aleneArk();
  }
  /** Appen: lobbyen for verten. Én oppgave – start en lek. Hver lek har én knapp («Alle» varianter), ingen grupper som må
      åpnes. QR, TV, bare min telefon, bakgrunnslekene og innstillingene ligger bak «Mer» (den vanlige lobbyen). */
  /** Toppen i app-lobbyene: alene = invitasjonen som det store gule kortet, ellers en stille rad med koden. */
  function appTopp(n) {
    return n <= 1
      ? '<div class="app-alene"><b>' + T('Bare du så langt', 'Just you so far') + '</b><span>' + T('Koden er ', 'The code is ') + '<b class="app-alene-kode">' + esc(kode) + '</b>. ' + T('Del den, så er de med på sekunder.', 'Share it and they are in within seconds.') + '</span>' +
          '<button type="button" class="rom-stor-knapp" data-g="del">' + T('Inviter', 'Invite') + '</button></div>'
      : '<div class="app-del"><span><b>' + n + T(' i rommet', ' in the room') + '</b><small>' + T('Koden er ', 'The code is ') + '<b>' + esc(kode) + '</b></small></span>' +
          '<button type="button" class="btn gold small" data-g="del">' + T('Inviter', 'Invite') + '</button></div>';
  }
  function appLobby() {
    var t = tilstand, n = t.spillere.length, alene = n <= 1;
    var leker = (t.leker || []).filter(function (l) { return !l.skjult; });
    function rad(l) {
      var laast = l.pluss && !t.pluss;
      var lekId = l.id === 'pekeleken' && pkMobil ? 'mest' : l.id;
      var mod = l.type === 'nyhetsrunden' && l.moduser && l.moduser[0] ? l.moduser[0].v : '*';
      // Nyhetsrunden: velg uke først. Ring of Fire: kortreglene kan endres før start. Resten starter med ett trykk.
      var g = laast ? 'start' : l.type === 'nyhetsrunden' ? 'app-uke' : l.id === 'ring-of-fire' ? 'app-rof' : 'start';
      return '<button type="button" class="app-lek' + (laast ? ' laast' : '') + '" data-g="' + g + '" data-lek="' + esc(lekId) + '" data-modus="' + esc(mod) + '">' + klistremerke(l.id, 'app-lek-merke') +
        '<span><b>' + esc(l.navn) + '</b></span><span class="lek-info" role="button" tabindex="0" data-g="lek-info" data-lek="' + esc(l.id) + '" aria-label="' + T('Om ', 'About ') + esc(l.navn) + '">i</span><i aria-hidden="true">' + (laast ? '🔒' : '▶') + '</i></button>';
    }
    function senereRad(l) {
      return '<div class="app-lek for-fa">' + klistremerke(l.id, 'app-lek-merke') + '<span><b>' + esc(l.navn) + '</b><small>' + T('Minst ' + forFa(l) + ' spillere', 'At least ' + forFa(l) + ' players') + '</small></span><span class="lek-info" role="button" tabindex="0" data-g="lek-info" data-lek="' + esc(l.id) + '" aria-label="' + T('Om ', 'About ') + esc(l.navn) + '">i</span></div>';
    }
    // Lekene dere kan starte nå, gruppert. De som trenger flere telefoner samles nederst i én linje.
    var brukt = {}, grupper = '', senere = [];
    function del(liste) { var klare = liste.filter(function (l) { if (forFa(l)) { senere.push(l); return false; } return true; }); return klare.map(rad).join(''); }
    GRUPPER.forEach(function (g, i) {
      var l = leker.filter(function (x) { return g[1].indexOf(x.id) !== -1 && !x.pluss; });
      var pl = i === 1 ? leker.filter(function (x) { return x.pluss && KORT_PLUSS.indexOf(x.id) !== -1; }) : [];
      if (!l.length && !pl.length) return;
      l.concat(pl).forEach(function (x) { brukt[x.id] = 1; });
      var rader = del(l.concat(pl));
      if (rader) grupper += '<p class="rom-etikett app-etikett">' + esc(g[0]) + '</p>' + rader;
    });
    var rest = leker.filter(function (x) { return !brukt[x.id] && !x.pluss; }), pluss = leker.filter(function (x) { return !brukt[x.id] && x.pluss; });
    var restRader = del(rest); if (restRader) grupper += '<p class="rom-etikett app-etikett">' + T('Kortstokker med spørsmål', 'Question decks') + '</p>' + restRader;
    var plussRader = del(pluss); if (plussRader) grupper += '<p class="rom-etikett app-etikett">✨ ' + T('Med Pluss', 'With Pluss') + '</p>' + plussRader;
    var flere = '';
    if (senere.length) {
      flere = '<details class="app-flere" data-gruppe="app-flere"' + (erApen('app-flere', false) ? ' open' : '') + '><summary>' + senere.length + T(' leker til når dere er flere', ' more games once more of you are in') + '</summary>' + senere.map(senereRad).join('') + '</details>';
    }
    // Alene: først og fremst få folk inn. Med gjester: koden som en stille rad, lekene i fokus.
    return plassInfo() + planBoks() + appTopp(n) +
      '<h2 class="rom-h2">' + T('Start en lek', 'Start a game') + '</h2>' + kveldKort() + reglerKort() + anbefalteLeker() +
      (harSkall() ? '<button type="button" class="btn gold rom-knapp app-velger" data-g="velger">' + T('Alle lekene', 'All the games') + ' <i aria-hidden="true">›</i></button><div class="app-leker">' + egneStokker() + '</div>'
        : '<div class="app-leker">' + grupper + egneStokker() + flere + '</div>') +
      '<button type="button" class="app-mer" data-g="app-mer"><b>' + T('Mer', 'More') + '</b><small>' + T('TV, QR, bare min telefon, hele kvelden, varianter', 'TV, QR, just my phone, all night, variants') + '</small><i aria-hidden="true">›</i></button>';
  }
  /** Swift-skallet (iPhone-appen): lekvelgeren er et native ark. Dette er lista den får, med det samme et trykk på raden ville gjort. */
  function harSkall() { return document.documentElement.classList.contains('har-skall'); }
  function lekerForVelger() {
    var t = tilstand, leker = (t.leker || []).filter(function (l) { return !l.skjult; });
    function en(l) {
      var laast = !!(l.pluss && !t.pluss), min = forFa(l);
      var lekId = l.id === 'pekeleken' && pkMobil ? 'mest' : l.id;
      var mod = l.type === 'nyhetsrunden' && l.moduser && l.moduser[0] ? l.moduser[0].v : '*';
      var g = laast ? 'start' : l.type === 'nyhetsrunden' ? 'app-uke' : l.id === 'ring-of-fire' ? 'app-rof' : 'start';
      return { id: l.id, navn: l.navn, om: l.om || '', g: g, lek: lekId, modus: mod, laast: laast, pluss: !!l.pluss, min: min || 0,
        regler: (REGLER[reglerNokkelFor(l)] || []).map(function (x) { return T(x[0], x[1]); }) };
    }
    var brukt = {}, grupper = [];
    GRUPPER.forEach(function (g, i) {
      var l = leker.filter(function (x) { return g[1].indexOf(x.id) !== -1 && !x.pluss; });
      var pl = i === 1 ? leker.filter(function (x) { return x.pluss && KORT_PLUSS.indexOf(x.id) !== -1; }) : [];
      l.concat(pl).forEach(function (x) { brukt[x.id] = 1; });
      if (l.length || pl.length) grupper.push({ navn: g[0], leker: l.concat(pl).map(en) });
    });
    var rest = leker.filter(function (x) { return !brukt[x.id] && !x.pluss; }), pluss = leker.filter(function (x) { return !brukt[x.id] && x.pluss; });
    if (rest.length) grupper.push({ navn: T('Kortstokker med spørsmål', 'Question decks'), leker: rest.map(en) });
    if (pluss.length) grupper.push({ navn: '✨ ' + T('Med Pluss', 'With Pluss'), leker: pluss.map(en) });
    var n = t.spillere.length, anbefalt = (n >= 3 ? ['hvemskrev', 'mest', 'spion'] : ['mest', 'ring-of-fire', 'skal']);
    return { tittel: T('Velg lek', 'Pick a game'), anbefalt: anbefalt, spillere: n, grupper: grupper, senere: T('Når dere er flere', 'Once more of you are in'), anbefaltNavn: T('Anbefalt nå', 'Recommended now'), start: T('Start', 'Start'), minst: T('Minst', 'At least'), spillereOrd: T('spillere', 'players'), plussTekst: T('Krever Pluss', 'Needs Pluss') };
  }
  window.__mvLobby = {
    leker: lekerForVelger,
    // Det native arket valgte en lek: gjør akkurat det raden i lista ville gjort (start, uke-valg, Ring of Fire-regler …)
    trykk: function (g, lek, modus) {
      var b = document.createElement('button'); b.type = 'button'; b.hidden = true;
      b.dataset.g = g; b.dataset.lek = lek || ''; b.dataset.modus = modus || '*';
      root.appendChild(b); b.click(); b.remove();
    }
  };
  /* ---------- Swift-skallet: «Figuren din» og «Rommet» som native ark ----------
     Bildene av hvert valg lages her (SVG → PNG) og sendes til arket; valgene gjøres og lagres her, så alt virker som i nettutgaven. */
  var pngCache = {};
  function svgTilPng(svg, viewBox, px) {
    return new Promise(function (res) {
      var n = viewBox + '|' + px + '|' + svg; if (pngCache[n]) return res(pngCache[n]);
      var vb = viewBox.split(' ').map(Number), h = Math.round(px * vb[3] / vb[2]);
      var s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + viewBox + '" width="' + px + '" height="' + h + '">' + svg + '</svg>';
      var img = new Image();
      img.onload = function () { try { var c = document.createElement('canvas'); c.width = px; c.height = h; c.getContext('2d').drawImage(img, 0, 0, px, h); pngCache[n] = c.toDataURL('image/png').split(',')[1]; res(pngCache[n]); } catch (e) { res(''); } };
      img.onerror = function () { res(''); };
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
    });
  }
  var fvSt = null, fvLagreT = null;
  function fvStart() {
    if (fvSt) return Promise.resolve(fvSt);
    var megS = megSpiller();
    fvSt = { inne: innlogget(), laast: [], valgt: Object.assign({}, megS.pynt || {}), kvelder: 0, nokkel: megS.figur || tilstand.meg };
    if (!fvSt.inne) return Promise.resolve(fvSt);
    return kontoApi('/api/konto/pynt').then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
      if (d) { fvSt.laast = d.laast || []; fvSt.valgt = Object.assign({}, d.valgt || {}); fvSt.kvelder = d.kvelder || 0; }
      return fvSt;
    }).catch(function () { return fvSt; });
  }
  function fvLagre() {
    clearTimeout(fvLagreT);
    fvLagreT = setTimeout(function () {
      kontoApi('/api/konto/pynt', { method: 'POST', body: JSON.stringify({ valgt: fvSt.valgt }) }).then(function (r) { if (r.ok) gjorAlltid({ handling: 'min-pynt' }); else toast(T('Fikk ikke lagret. Prøv igjen.', 'Could not save. Try again.')); }).catch(function () {});
    }, 350);
  }
  function fvData() {
    return fvStart().then(function (st) {
      var har = {}; st.laast.forEach(function (id) { har[id] = true; });
      var p = utseende(st.nokkel, st.valgt), ses = sesong(), L = EN ? 1 : 0, jobber = [];
      var ting = synligPynt(st.laast).map(function (x) {
        var svg = x.slot === 'beveg' ? BEVEG_SVG[x.id] || '' : PYNT_SVG[x.id] || '';
        if (x.slot === 'hode' && st.valgt.fhode && FARGBAR[x.id]) svg = svg.split(FARGBAR[x.id]).join(st.valgt.fhode);
        var t = { id: x.id, slot: x.slot, navn: x.navn[L], kan: st.inne && !!har[x.id] && (!x.sesong || x.sesong === ses), har: !!har[x.id], laas: !har[x.id] ? x.laas[L] : T('Kommer tilbake i sesongen', 'Back in season'), png: '' };
        jobber.push(svgTilPng(svg, FV_BOKS[x.slot], 120).then(function (b) { t.png = b; }));
        return t;
      });
      var frisyrer = FRISYRER.map(function (f) { var t = { id: f, navn: (FV_FRISYRENAVN[f] || [f, f])[L], png: '' }; jobber.push(svgTilPng(figurHtml(Object.assign({}, p, { haar: f }), {}), '-24 -84 48 44', 120).then(function (b) { t.png = b; })); return t; });
      var skjegg = SKJEGG.map(function (k) { var t = { id: k, navn: FV_SKJEGGNAVN[k][L], png: '' }; jobber.push(svgTilPng(figurHtml(Object.assign({}, p, { skjegg: k === 'ingen' ? null : k }), {}), '-24 -84 48 50', 120).then(function (b) { t.png = b; })); return t; });
      return Promise.all(jobber).then(function () {
        var fn = {}; Object.keys(FV_FARGENAVN).forEach(function (k) { fn[k] = FV_FARGENAVN[k][L]; });
        var valgt = {}; Object.keys(st.valgt).forEach(function (k) { if (st.valgt[k] != null && typeof st.valgt[k] !== 'object') valgt[k] = String(st.valgt[k]); });
        return { inne: st.inne, kvelder: st.kvelder, valgt: valgt, naa: { haar: p.haar || '', h: p.h || '', hud: p.hud || '', topp: p.topp || '', skjegg: p.skjegg || 'ingen' },
          slots: ['hode', 'deg', 'ansikt', 'bryst', 'venn', 'beveg'].map(function (s) { return { id: s, navn: FV_NAVN[EN ? 'en' : 'no'][s] }; }),
          ting: ting, frisyrer: frisyrer, skjegg: skjegg, farger: FARGER, fargenavn: fn, fargbar: FARGBAR, konto: RUTE.konto + '#signin',
          tekst: { tittel: T('Figuren din', 'Your figure'), ingenting: T('Ingenting', 'Nothing'), frisyre: T('Frisyre', 'Hairstyle'), skjegg: T('Skjegg', 'Beard'), av: T('av', 'of'), laastOpp: T('låst opp', 'unlocked'),
            kveld: T('kveld spilt', 'night played'), kvelder: T('kvelder spilt', 'nights played'), laast: T('låst', 'locked'), loggInn: T('Logg inn', 'Sign in'), nyKonto: T('Ny konto', 'New account'),
            beveg: T('Trykk på deg selv i stua, så gjør figuren bevegelsen – hos alle.', 'Tap yourself in the living room and your figure does the move – for everyone.'),
            gjest: T('Logg inn for å låse opp og ta på ting.', 'Sign in to unlock and wear things.') } };
      });
    });
  }
  window.__mvFigur = {
    data: fvData,
    // En endring fra arket: {slot, id} (tom id = ingenting), {farge, verdi}, {haar}, {skjegg}
    velg: function (e) {
      return fvStart().then(function (st) {
        e = e || {};
        if (e.farge) st.valgt[e.farge] = e.verdi;
        else if (e.haar) st.valgt.haar = e.haar;
        else if (e.skjegg) { if (e.skjegg === 'ingen') delete st.valgt.skjegg; else st.valgt.skjegg = e.skjegg; }
        else if (e.slot) st.valgt[e.slot] = e.id ? (st.valgt[e.slot] === e.id && e.slot !== 'beveg' ? null : e.id) : null;
        fvLagre();
        return fvData();
      });
    }
  };
  function rmData() {
    var st = tilstand.stua || {}, harPluss = !!(tilstand.pluss && tilstand.pluss.til > Date.now()), naa = st.tema || 'stue', paa = st.ekstra || [], lov = st.ekstraLov || [], L = EN ? 1 : 0, pl = 'Pluss';
    return { tittel: T('Rommet', 'The room'), husk: innlogget() ? T('Huskes til neste gang', 'Remembered for next time') : '', rader: [
      { id: 'tema', navn: T('Rom', 'Room'), ruter: TEMAER.map(function (t) { var ok = temaLov(t.id, harPluss), gratisNaa = t.gratisI && t.gratisI === sesong(); return { v: t.id, navn: t.navn[L], farger: TEMAFARGER[t.id] || TEMAFARGER.stue, ikon: '', paa: naa === t.id, laas: ok ? '' : (gratisNaa ? T('Gratis nå', 'Free now') : pl) }; }) },
      { id: 'gulv', navn: T('Gulv', 'Floor'), ruter: STIL.gulv.map(function (v) { var laast = STIL_PLUSS.indexOf(v) !== -1 && !harPluss; return { v: v, navn: v === 'disko' ? T('Disko', 'Disco') : T('Fliser', 'Tiles'), farger: v === 'disko' ? ['#FF9CC2', '#63E2A8', '#5A8DEE', '#FFD23F'] : [], ikon: v, paa: (st.gulv || 'fliser') === v, laas: laast ? pl : '' }; }) },
      { id: 'lys', navn: T('Lys', 'Light'), ruter: STIL.lys.map(function (v) { var laast = STIL_PLUSS.indexOf(v) !== -1 ? !harPluss : (v === 'lys' && lov.indexOf('lys') === -1); return { v: v, navn: v === 'lampe' ? T('Lampe', 'Lamp') : v === 'lys' ? T('Lyslenke', 'String lights') : T('Diskokule', 'Disco ball'), farger: [], ikon: v, paa: (st.lys || 'lampe') === v, laas: laast ? (v === 'lys' ? '🔒' : pl) : '' }; }) },
      { id: 'ting', navn: T('Ting', 'Things'), ruter: EKSTRA.filter(function (e) { return e.id !== 'lys'; }).map(function (e) { return { v: e.id, navn: e.navn[L], farger: [], ikon: e.id, paa: paa.indexOf(e.id) !== -1, laas: lov.indexOf(e.id) !== -1 ? '' : '🔒' }; }) }
    ] };
  }
  window.__mvRom = {
    data: rmData,
    velg: function (g, v) {
      var d = rmData(), rad = d.rader.find(function (r) { return r.id === g; }), rute = rad && rad.ruter.find(function (r) { return r.v === v; });
      if (!rute) return { feil: 'ukjent' };
      if (rute.laas) {
        if (g === 'ting' || (g === 'lys' && v === 'lys')) { var e2 = EKSTRA.find(function (x) { return x.id === (g === 'lys' ? 'lys' : v); }); return { melding: e2 ? e2.laas[EN ? 1 : 0] : '' }; }
        return { pluss: true };
      }
      var st = tilstand.stua || {}, rom = { tema: st.tema || 'stue', gulv: st.gulv || 'fliser', lys: st.lys || 'lampe', ekstra: (st.ekstra || []).slice() };
      if (g === 'tema') { rom.tema = v; gjor({ handling: 'stua-tema', tema: v }); }
      else if (g === 'gulv' || g === 'lys') { rom[g] = v; gjorAlltid({ handling: 'stua-stil', gulv: rom.gulv, lys: rom.lys }); }
      else if (g === 'ting') { var i = rom.ekstra.indexOf(v); if (i === -1) rom.ekstra.push(v); else rom.ekstra.splice(i, 1); gjorAlltid({ handling: 'stua-ekstra', liste: rom.ekstra }); }
      huskRom(rom);
      // Arket viser valget med en gang; serveren bekrefter på neste henting
      tilstand.stua = Object.assign({}, st, { tema: rom.tema, gulv: rom.gulv, lys: rom.lys, ekstra: rom.ekstra });
      return { ok: true, data: rmData() };
    },
    pluss: function () { visPlussTilbud(); }
  };
  /** Bakgrunnslekene: går hele kvelden, uansett hvilken hovedlek dere spiller. Verten slår dem av og på. */
  function bakgrunnBoks() {
    var t = tilstand, rader = [];
    var bors = t.bors && (t.bors.paa || t.bors.slutt);
    rader.push({ ikon: klistremerke('graf'), navn: T('Vorsbørsen', 'The Exchange'), om: T('Kjøp aksjer i det du tror skjer i kveld – «Hvem søler først?». Vinn vorskroner når det skjer.', 'Buy shares in what you think will happen tonight – “Who spills first?”. Win coins when it does.'),
      paa: !!bors, knapp: bors ? '<button class="btn small ghost" data-g="bs-aapne" type="button">' + T('Åpne', 'Open') + '</button>' : '<button class="btn small gold" data-g="bs-start" type="button">' + T('Slå på', 'Turn on') + '</button>' });
    rader.push({ ikon: klistremerke('sporsmal'), navn: T('Spørsmålsmester', 'Question master'), om: t.mester ? T('Mester nå: ', 'Master now: ') + '<b>' + esc(navn(t.mester.id)) + '</b>. ' + T('Svarer du på et spørsmål fra hen, drikker du. Ny mester hvert 25. minutt.', 'Answer one of their questions and you drink. New master every 25 minutes.') : T('Én er mester. Svarer du på et spørsmål fra mesteren, drikker du. Appen bytter mester hvert 25. minutt.', 'One person is master. Answer a question from the master and you drink. The app swaps master every 25 minutes.'),
      paa: !!t.mester, knapp: t.mester ? '<button class="btn small ghost" data-g="mester-bytt" type="button">' + T('Bytt', 'Swap') + '</button><button class="linkbtn" data-g="mester-av" type="button">' + T('Slå av', 'Turn off') + '</button>' : '<button class="btn small gold" data-g="mester-paa" type="button">' + T('Slå på', 'Turn on') + '</button>' });
    rader.push({ ikon: klistremerke('agent'), navn: T('Agent 0,5', 'Agent 0.5') + (t.pluss ? '' : ' <span class="rom-bg-pluss">✨ Pluss</span>'), om: T('Hemmelige oppdrag: alle får ett, som å få noen til å si «sykt». Klarer du det, deler du ut slurker.', 'Everyone gets a secret mission, like getting someone to say “insane”. Pull it off and you hand out sips.'),
      paa: !!t.oppdrag, knapp: t.oppdrag ? '<button class="linkbtn" data-g="op-av" type="button">' + T('Slå av', 'Turn off') + '</button>' : '<button class="btn small gold" data-g="op-paa" type="button">' + T('Slå på', 'Turn on') + '</button>' });
    return '<div class="rom-bg">' + rader.map(function (r) {
      return '<div class="rom-bg-rad' + (r.paa ? ' paa' : '') + '"><span class="rom-bg-ikon" aria-hidden="true">' + r.ikon + '</span><b>' + r.navn + (r.paa ? ' <span class="rom-bg-status">' + T('På', 'On') + '</span>' : '') + '</b>' +
        '<button type="button" class="rom-bg-hjelp" data-g="bg-hjelp" aria-expanded="false" aria-label="' + T('Hva er dette?', 'What is this?') + '">?</button><div class="rom-bg-knapper">' + r.knapp + '</div><small class="rom-bg-om" hidden>' + r.om + '</small></div>';
    }).join('') + '</div>';
  }
  /** Hvem som er spørsmålsmester – vises for alle, både i lobbyen og under lekene. */
  function mesterStripe() {
    var m = tilstand.mester; if (!m) return '';
    var jeg = m.id === tilstand.meg;
    return '<p class="rom-mester' + (jeg ? ' meg' : '') + '">❓ ' + (jeg ? T('<b>Du er spørsmålsmester!</b> Får du noen til å svare på et spørsmål, drikker de.', '<b>You’re the question master!</b> Get someone to answer one of your questions and they drink.')
      : T('Spørsmålsmester: <b>' + esc(navn(m.id)) + '</b> – svar på et spørsmål fra hen, så drikker du.', 'Question master: <b>' + esc(navn(m.id)) + '</b> – answer one of their questions and you drink.')) + '</p>';
  }
  /** Når en lek er ferdig: hva nå? Verten velger – neste lek i planen (hvis dere har en), spill igjen,
      en annen lek, eller avslutt kvelden. De andre ser hva verten holder på å velge. Planen beholdes uansett. */
  function lekSlutt(igjen) {
    var t = tilstand, neste = t.plan && t.plan.length ? nestePlan() : null, gjeng = !!t.gjeng;
    if (!erVert()) return '<p class="nr-vent">' + esc(navn(t.vert)) + T(' velger hva dere gjør nå …', ' is choosing what to do next …') + '</p>';
    var valg = '';
    if (neste) valg += '<button class="rom-stor-knapp slutt-plan" data-g="plan-start" type="button">' + T('Neste i planen', 'Next in the plan') + '<small>' + esc(neste.navn) + '</small></button>';
    var igjenListe = (igjen || []).filter(Boolean);
    valg += '<div class="slutt-valg">' + igjenListe.map(function (v, i) {
      return '<button type="button" class="slutt-knapp' + (!neste && i === 0 ? ' hoved' : '') + '" data-g="' + v[0] + '"><b>' + esc(v[1]) + '</b><small>' + esc(v[2]) + '</small></button>'; }).join('') +
      '<button type="button" class="slutt-knapp" data-g="avslutt"><b>' + T('Velg en annen lek', 'Pick another game') + '</b><small>' + (neste ? T('Utenom planen', 'Outside the plan') : T('Tilbake til lekene', 'Back to the games')) + '</small></button>' +
      '<button type="button" class="slutt-knapp" data-g="avslutt-kvelden"><b>' + (gjeng ? T('Avslutt gjengkvelden', 'End the crew night') : T('Avslutt kvelden', 'End the night')) + '</b><small>' + (gjeng ? T('Lagres i gjengens sesong', 'Saved to the crew’s season') : T('Kåringer og oppsummering', 'Awards and recap')) + '</small></button>' +
    '</div>';
    return '<div class="lek-slutt"><p class="nr-etikett">' + T('Hva nå?', 'What now?') + '</p>' + valg + '</div>';
  }
  /** Verktøy for verten: raske knapper under leken, og resten forklart i en liste. */
  function vertVerktoy(s) {
    if (!erVert()) return '';
    var t = tilstand, rask = '';
    if (s && t.plan && nestePlan()) rask += '<button class="btn gold small" data-g="plan-start" type="button">⏭ ' + T('Neste: ', 'Next: ') + esc(nestePlan().navn) + '</button>';
    if (s) rask += '<button class="btn ghost small" data-g="avslutt" type="button">' + T('↩︎ Bytt lek', '↩︎ Switch game') + '</button>';
    if (s && !visSkjerm) rask += '<button class="btn ghost small" data-g="skjerm" type="button">📺 ' + T('Vis på TV', 'Show on TV') + '</button>';
    var rader = [];
    // I lobbyen står bakgrunnslekene som eget steg. Under en lek kan verten slå dem av og på herfra.
    if (s) {
      if (!t.bors) rader.push(['bs-start', '📈', T('Slå på Vorsbørsen', 'Turn on the Exchange'), T('Et aksjemarked på vennene dine som går i bakgrunnen resten av kvelden.', 'A stock market on your friends that runs in the background for the rest of the night.')]);
      rader.push(t.mester ? ['mester-av', '❓', T('Slå av spørsmålsmester', 'Turn off question master'), T('Mester nå: ', 'Master now: ') + navn(t.mester.id)]
        : ['mester-paa', '❓', T('Slå på spørsmålsmester', 'Turn on question master'), T('Svarer du på et spørsmål fra mesteren, drikker du.', 'Answer a question from the master and you drink.')]);
      rader.push(t.oppdrag ? ['op-av', '🕵️', T('Slå av Agent 0,5', 'Turn off Agent 0.5'), T('Oppdragene forsvinner fra alle telefonene.', 'The missions disappear from every phone.')]
        : ['op-paa', '🕵️', T('Agent 0,5 ✨', 'Agent 0.5 ✨'), (t.pluss ? T('Alle får et hemmelig oppdrag som varer hele kvelden.', 'Everyone gets a secret mission that lasts all night.') : T('Alle får et hemmelig oppdrag som varer hele kvelden. Krever Pluss.', 'Everyone gets a secret mission that lasts all night. Needs Pluss.'))]);
    }
    // Vannrunde: verten kan ta en nå, og slå av den som kommer av seg selv hver time (ikke i alkoholfrie rom)
    if (!t.alkoholfri) {
      if (s) rader.push(['vann-naa', '💧', T('Vannrunde nå', 'Water round now'), T('Alle får beskjed om å ta et glass vann – senker tempoet uten å peke på noen.', 'Everyone is told to drink a glass of water – slows things down without singling anyone out.')]);
      rader.push(t.vannAv ? ['vann-auto', '⏱️', T('Slå på vannrunde hver time', 'Turn on the hourly water round'), T('Av nå. Rommet kan minne alle på et glass vann omtrent én gang i timen.', 'Off now. The room can remind everyone to drink some water about once an hour.')]
        : ['vann-auto', '⏱️', T('Slå av vannrunde hver time', 'Turn off the hourly water round'), vannIgjen()]);
    }
    if (s) rader.unshift(['skjerm', '📺', T('Storskjerm på TV-en', 'Big screen on the TV'), T('Vis rommet stort på en PC eller et nettbrett koblet til TV-en – med lyd over musikken.', 'Show the room big on a laptop or tablet hooked up to the TV – with sound over the music.')]);
    rader.push(['nullstill', '🔄', T('Nullstill slurker', 'Reset sips'), T('Starter tellingen på poengtavla på nytt.', 'Restarts the count on the scoreboard.')]);
    if (!t.ferdig) rader.push(['avslutt-kvelden', '🏁', T('Avslutt kvelden', 'End the night'), T('Kårer kveldens vinner og viser oppsummeringen.', 'Crowns tonight’s winner and shows the recap.')]);
    return '<div class="rom-vert">' + (visSkjerm && t.skjermPin ? skjermBoks() : '') + (rask ? '<div class="rom-vert-rask">' + rask + '</div>' : '') +
      '<details class="rom-verktoy" data-gruppe="' + (s ? 'verktoy-spill' : 'verktoy-lobby') + '"' + (erApen(s ? 'verktoy-spill' : 'verktoy-lobby', !s) ? ' open' : '') + '><summary>⚙️ ' + (s ? T('Mer for verten', 'More for the host') : T('Mer til kvelden', 'More for the night')) + '</summary>' +
      rader.map(function (r) { return '<button type="button" class="rom-verktoy-rad" data-g="' + r[0] + '"><span aria-hidden="true">' + r[1] + '</span><b>' + r[2] + '</b></button>'; }).join('') + '</details></div>';
  }
  /** Verten skannet QR-koden på TV-en (eller laget rommet etterpå): koble TV-en til dette rommet. */
  function tvKoblSjekk() {
    var tk = null; try { tk = sessionStorage.getItem('mv_tv_kobl'); } catch (e) {}
    if (!tk || !tilstand || !meg) return;
    try { sessionStorage.removeItem('mv_tv_kobl'); } catch (e) {}
    if (!erVert()) return toast(T('Bare verten kan koble TV-en til rommet.', 'Only the host can connect the TV to the room.'));
    gjorAlltid({ handling: 'skjerm-kobl', tv: tk });
    toast(T('TV-en kobles til rommet 📺', 'Connecting the TV to the room 📺'));
  }
  /** Storskjerm: hvor verten finner adressen og PIN-en til TV-en. */
  var visSkjerm = false;
  // iPhone-appen: en TV kobles til (AirPlay). Verten får storskjermen opp på TV-en uten å trykke noe.
  window.addEventListener('mv-skjerm', function (e) {
    if (!tilstand || !meg) return;
    if (e.detail && e.detail.koblet && erVert()) { visSkjerm = true; if (!tilstand.skjermPin) gjor({ handling: 'skjerm-lag' }); }
    tegn();
  });
  // Speilet verten telefonen FØR rommet fantes (eller før siden var lastet)? Da kom hendelsen for tidlig – sjekk ved hver tegning.
  var skjermBedt = false;
  function tvSjekk() {
    var sk = window.__mvSkjerm; if (!sk || !sk.koblet || !tilstand || !meg || !erVert()) return;
    if (!tilstand.skjermPin) { if (!skjermBedt) { skjermBedt = true; visSkjerm = true; gjor({ handling: 'skjerm-lag' }); } return; }
    sk.vis(skjermLenke() + '&auto=1');
  }
  function skjermAdresse() { return (kortDomene ? 'https://mittvors.no' : (window.__MV_ORIGIN || location.origin)) + (EN ? '/tv' : '/no/tv'); }
  function skjermLenke() { return skjermAdresse() + '?k=' + kode + '&p=' + tilstand.skjermPin; }
  function skjermBoks() {
    var adr = skjermAdresse().replace(/^https?:\/\//, '');
    var speil = '<div class="rom-skjerm-vei"><b>' + T('Bare din telefon? Speil den', 'Just your phone? Mirror it') + '</b>' +
      '<ol><li>' + T('iPhone: åpne Kontrollsenter → Skjermspeiling → velg TV-en.', 'iPhone: open Control Center → Screen Mirroring → pick the TV.') + '</li>' +
      '<li>' + T('Android: dra ned fra toppen → Smart View (eller Cast) → velg TV-en.', 'Android: swipe down from the top → Smart View (or Cast) → pick the TV.') + '</li>' +
      '<li>' + T('Legg telefonen på siden – da blir bildet stort på TV-en.', 'Turn the phone on its side – the picture fills the TV.') + '</li></ol></div>';
    var nett = '<div class="rom-skjerm-vei"><b>' + T('Alle har telefon? Åpne nettleseren på TV-en', 'Everyone has a phone? Open the browser on the TV') + '</b>' +
      '<ol><li>' + T('På TV-en (eller en PC ved TV-en): gå til ', 'On the TV (or a laptop by it): go to ') + '<b>' + esc(adr) + '</b></li>' +
      '<li>' + T('Skann QR-koden som kommer opp, med kameraet på telefonen din.', 'Scan the QR code that appears with your phone’s camera.') + '</li>' +
      '<li>' + T('Ferdig! Eller skriv inn ', 'Done! Or enter ') + '<b>' + esc(kode) + '</b> ' + T('og PIN', 'and PIN') + ' <b class="rom-skjerm-pin">' + esc(tilstand.skjermPin) + '</b></li></ol></div>';
    // I iPhone-appen: speil via AirPlay, så tar appen over TV-en og viser storskjermen der
    var app = window.__mvSkjerm && document.documentElement.classList.contains('is-app');
    if (app) {
      window.__mvSkjerm.vis(skjermLenke() + '&auto=1');
      speil = '<div class="rom-skjerm-vei"><b>' + (window.__mvSkjerm.koblet ? T('TV-en viser rommet ✓', 'The TV is showing the room ✓') : T('Speil telefonen, så tar appen over TV-en', 'Mirror the phone and the app takes over the TV')) + '</b>' +
        '<ol><li>' + T('Sveip ned fra øverst til høyre → Skjermspeiling → velg TV-en.', 'Swipe down from the top right → Screen Mirroring → pick the TV.') + '</li>' +
        '<li>' + T('Storskjermen dukker opp på TV-en av seg selv. Telefonen beholder knappene dine.', 'The big screen appears on the TV by itself. Your phone keeps its buttons.') + '</li></ol></div>';
      return '<div class="rom-skjerm"><p class="rom-etikett">📺 ' + T('Vis på TV', 'Show on TV') + '</p>' + speil + nett +
        '<div class="gt-row"><button class="btn small ghost" data-g="skjerm-ny" type="button">' + T('Ny PIN', 'New PIN') + '</button>' +
        '<button class="linkbtn" data-g="skjerm-lukk" type="button">' + T('Lukk', 'Close') + '</button></div></div>';
    }
    return '<div class="rom-skjerm"><p class="rom-etikett">📺 ' + T('Vis på TV', 'Show on TV') + '</p>' + (sofaModus() ? speil + nett : nett + speil) +
      '<div class="gt-row"><button class="btn small gold" data-g="skjerm-del" type="button">' + T('Send lenken til PC-en', 'Send the link to the laptop') + '</button>' +
      '<button class="btn small ghost" data-g="skjerm-ny" type="button">' + T('Ny PIN', 'New PIN') + '</button>' +
      '<button class="linkbtn" data-g="skjerm-lukk" type="button">' + T('Lukk', 'Close') + '</button></div>' +
      '<p class="small">' + T('Storskjermen er ingen spiller: den ser aldri hemmelige roller eller hendene på børsen.', 'The big screen isn’t a player: it never sees secret roles or anyone’s hand on the Exchange.') + '</p></div>';
  }
  /** Hvor mange spillere lekene trenger (samme regler som serveren). */
  var MIN_SPILLERE = { hvemskrev: 3, bloff: 3, samme: 3, spion: 3, pannekort: 3, forraeder: 3, gris: 3, president: 3, skal: 2, pyramiden: 2, bussruta: 2, tosannheter: 2, mest: 2, dealer: 2 };
  function forFa(l) { var min = MIN_SPILLERE[l.id] || MIN_SPILLERE[l.type] || 0; return min && tilstand.spillere.length < min ? min : 0; }
  /** Tre leker som er lette å starte med – ut fra hvor mange dere er. */
  function anbefalteLeker() {
    var t = tilstand, n = t.spillere.length;
    var ider = n >= 3 ? ['hvemskrev', 'mest', 'spion'] : ['mest', 'ring-of-fire', 'skal'];
    var liste = ider.map(function (id) { return (t.leker || []).find(function (x) { return x.id === id; }); }).filter(function (l) { return l && !l.pluss && !forFa(l); });
    if (!liste.length) return '';
    return '<div class="rom-anbefalt">' +
      liste.map(function (l) {
        var mod = l.type === 'nyhetsrunden' && l.moduser && l.moduser[0] ? l.moduser[0].v : '*';
        return '<button type="button" class="rom-anbefalt-lek" data-g="start" data-lek="' + esc(l.id) + '" data-modus="' + esc(mod) + '">' + klistremerke(l.id, 'rom-anbefalt-merke') + '<b>' + esc(l.navn) + '</b><span class="lek-info" role="button" tabindex="0" data-g="lek-info" data-lek="' + esc(l.id) + '" aria-label="' + T('Om ', 'About ') + esc(l.navn) + '">i</span><i aria-hidden="true">▶</i></button>';
      }).join('') + '</div>';
  }
  /** Kort forklaring av hver lek i rommet – åpen første gang du ser leken. */
  var REGLER = {
    hvemskrev: [['Alle svarer anonymt på samme spørsmål på sin telefon.', 'Everyone answers the same question anonymously on their phone.'], ['Svarene vises ett og ett – gjett hvem som skrev hva.', 'The answers are shown one at a time – guess who wrote what.'], ['Gjetter du feil, drikker du. Lurer du alle, får du slurker å dele ut.', 'Guess wrong and you drink. Fool everyone and you get sips to hand out.']],
    bloff: [['Et spørsmål står som et oppslag i leksikonet. Alle dikter opp et svar som høres ekte ut.', 'A question appears as an encyclopedia entry. Everyone makes up an answer that sounds real.'], ['Det ekte svaret blandes inn. Trykk på det du tror er ekte – lurt = drikk 1, og den som diktet opp, deler ut 1 per lurt.', 'The real answer is mixed in. Tap the one you think is real – fooled = drink 1, and whoever made it up hands out 1 per person fooled.'], ['Fem oppslag i en runde – neste kommer av seg selv. Den som lurte flest, er beste skrønemaker.', 'Five entries in a round – the next comes by itself. Whoever fooled the most is the best fibber.']],
    samme: [['Alle skriver ett ord i hemmelighet som passer oppgaven.', 'Everyone secretly writes one word that fits the prompt.'], ['Målet er å svare det samme som de andre.', 'The goal is to answer the same as the others.'], ['Står du alene med svaret ditt, drikker du.', 'If nobody else wrote your answer, you drink.']],
    spion: [['Hold kortet for å se ordet ditt. Alle har samme ord – bortsett fra muldvarpen, som har et nesten likt og ikke vet det selv.', 'Hold your card to see your word. Everyone has the same word – except the mole, who has a near miss and doesn’t know it.'], ['Si én ting om ordet ditt, to runder rundt bordet. Ikke si ordet. Så stemmer alle på telefonen.', 'Say one thing about your word, two rounds around the table. Don’t say the word. Then everyone votes on their phone.'], ['Tatt: muldvarpen får gjette ordet. Bom = drikk 3, de som stemte rett deler ut 1. Treff eller slapp unna = alle andre drikker 2.', 'Caught: the mole gets to guess the word. Miss = drink 3, correct voters hand out 1. Hit or got away = everyone else drinks 2.']],
    spionGammel: [['Hold kortet for å se stedet. Én av dere er muldvarpen og vet det ikke.', 'Hold your card to see the location. One of you is the mole and doesn’t know it.'], ['Den som har tur, spør noen og trykker på hodet deres – så har den personen tur.', 'Whoever’s turn it is asks someone and taps their head – then it’s their turn.'], ['Tror du at du vet hvem det er? Si det høyt – verten snur kortet. Feil: de som pekte drikker 2. Tatt: muldvarpen drikker 3.', 'Think you know? Say it out loud – the host flips the card. Wrong: those who called it drink 2. Caught: the mole drinks 3.']],
    pannekort: [['Skriv en person, figur eller ting på lappen til den du har fått.', 'Write a person, character or thing on the note for the person you got.'], ['Alle ser lappene til de andre – bare ikke sin egen. Still ja/nei-spørsmål på omgang.', 'Everyone sees the other notes – just not their own. Take turns asking yes/no questions.'], ['Trykk «Gjettet!» når noen klarer det. Først ut deler ut 2, sistemann drikker 3.', 'Tap “Got it!” when someone gets it. First out hands out 2, the last one drinks 3.']],
    skal: [['Glasset bobler – vent til det står SKÅL! Trykk hvor som helst så fort du kan.', 'The glass fizzes – wait until it says CHEERS! Tap anywhere as fast as you can.'], ['Treigest drikker 1. Trykker du for tidlig, drikker du 2.', 'Slowest drinks 1. Tap too early and you drink 2.'], ['Fem skåler i en sprint – neste kommer av seg selv. Raskest samlet vinner.', 'Five cheers in a sprint – the next comes by itself. Fastest total wins.']],
    mest: [['Ett «Hvem er mest sannsynlig …»-kort om gangen.', 'One “Who’s most likely …” card at a time.'], ['Trykk på hodet til den det passer best på. Ingen ser hva du stemte.', 'Tap the head of whoever it fits best. Nobody sees your vote.'], ['Hver stemme er én slurk.', 'Every vote is one sip.']],
    forraeder: [['Den som har tur, holder på kortet for å se om hen skal lyve eller si sannheten – og fullfører setningen høyt.', 'Whoever’s turn it is holds the card to see whether to lie or tell the truth – and finishes the sentence out loud.'], ['Grill hen med oppfølgingsspørsmål. Så stemmer resten: sant eller løgn?', 'Grill them with follow-up questions. Then everyone else votes: true or lie?'], ['Feil: drikk to (helt sikker: fire). Den som forteller deler ut én per person som ble lurt.', 'Wrong: drink two (absolutely sure: four). The teller hands out one per person fooled.']],
    tosannheter: [['Én sitter i stolen og skriver tre ting om seg selv – to sanne og én løgn.', 'One player sits in the chair and writes three things about themselves – two true, one lie.'], ['De andre trykker på kortet de tror er løgnen. Når alle har stemt, snus kortene.', 'Everyone else taps the card they think is the lie. When everyone has voted, the cards flip.'], ['Bommet eller ikke stemt: drikk 1. Stolen drikker 1 per person som så løgnen. Alle sitter i stolen én gang.', 'Missed or didn’t vote: drink 1. The chair drinks 1 per person who saw the lie. Everyone takes the chair once.']],
    regelfabrikken: [['Alle skriver så mange drikkekort de rekker før tiden går ut.', 'Everyone writes as many drinking cards as they can before time runs out.'], ['Kortene stokkes og trekkes ett og ett.', 'The cards are shuffled and drawn one by one.'], ['Gjør det kortet sier!', 'Do what the card says!']],
    bussruta: [['Billetten: på din tur svarer du fire ganger om kortene dine – riktig = del ut, feil = drikk.', 'The ticket: on your turn you answer four questions about your cards – right = hand out, wrong = drink.'], ['Pyramiden snus av seg selv. Har du kortet, legger du det på og deler ut like mange som raden.', 'The pyramid flips by itself. Have the card? Play it and hand out as many as the row number.'], ['Bussen: den med flest kort igjen kjører. Fem trygge kort på rad, ellers drikk og tilbake til start.', 'The bus: whoever has the most cards left rides it. Five safe cards in a row, or drink and back to the start.']],
    yatzy: [['Trykk på begeret når det er din tur – opptil tre kast. Trykk på en terning for å holde den.', 'Tap the cup on your turn – up to three rolls. Tap a die to hold it.'], ['Trykk på en rad i blokka for å føre. Ny ener i kastet = drikk 2, fire like = drikk tallet på terningen, Yatzy = del ut 5. Terninger du holder, teller ikke på nytt.', 'Tap a row on the scorecard to score. A new one in the roll = drink 2, four of a kind = drink the number on the dice, Yahtzee = hand out 5. Dice you hold don’t count again.'], ['Stryker du et felt, drikker du 2. Den med minst til slutt drikker opp. Verten kan stryke et felt for den som somler.', 'Scratch a box and you drink 2. Lowest score at the end finishes their drink. The host can scratch a box for anyone who stalls.']],
    overunder: [['Den som har tur, gjetter om neste kort er over eller under. Verten kan trykke for den som ikke har telefonen oppe.', 'Whoever’s turn it is guesses if the next card is higher or lower. The host can tap for anyone without their phone out.'], ['Riktig: potten vokser med én slurk, og turen går videre.', 'Right: the pot grows by one sip and the turn moves on.'], ['Feil eller likt: du drikker hele potten. Når stokken er tom, er leken over.', 'Wrong or equal: you drink the whole pot. When the deck runs out, the game is over.']],
    veddelopet: [['Trykk på banen til hesten du tror vinner, og velg innsats.', 'Tap the lane of the horse you think wins and pick your stake.'], ['Når alle har veddet, går løpet av seg selv – ett kort i sekundet. Sidekortene sender en hest ett steg tilbake.', 'When everyone has bet, the race runs itself – one card a second. Side cards send a horse one step back.'], ['Vinnerne deler ut dobbelt – de andre drikker innsatsen.', 'The winners hand out double – everyone else drinks their stake.']],
    dealer: [['Bare dealeren bruker telefonen og ser kortet. Noen sier en verdi høyt – dealeren trykker den.', 'Only the dealer uses the phone and sees the card. Someone calls a value out loud – the dealer taps it.'], ['Treff på første: dealeren drikker kortets verdi. Bom: dealeren sier «høyere» eller «lavere», ett forsøk til. Treff nå: halve kortet.', 'Hit on the first try: the dealer drinks the card’s value. Miss: the dealer says “higher” or “lower”, one more try. Hit now: half the card.'], ['Bom igjen: gjetteren drikker avstanden til kortet. Tre bom på rad, og stokken går videre. Brukte kort ligger på tellebrettet – tell!', 'Miss again: the guesser drinks the distance to the card. Three misses in a row and the deck moves on. Used cards sit on the tally board – count them!']],
    pyramiden: [['Fire kort med baksiden opp – hold fingeren på dem for å kikke. Pyramiden snus av seg selv, ett kort hvert tiende sekund.', 'Four face-down cards – hold your finger on them to peek. The pyramid flips by itself, one card every ten seconds.'], ['Legg et kort med baksiden opp på det som er snudd, og del ut radens slurker. Riktig verdi er sant, feil er bløff.', 'Lay a card face down on the flipped one and hand out the row’s sips. Same value is true, anything else is a bluff.'], ['Rop LØGN! Bløff = den som la på drikker dobbelt og får kortet tilbake. Sant = du drikker dobbelt. Ingen roper: kortet er borte.', 'Call LIAR! Bluff = they drink double and take the card back. True = you drink double. Nobody calls: the card is gone.']],
    gris: [['Trykk på kortet du vil sende til venstre – 10 sekunder per bytte, ellers sendes kortet lengst til venstre.', 'Tap the card to pass left – 10 seconds per swap, or your leftmost card goes.'], ['Fire like? Trykk på trynet. Da har resten 5 sekunder – sistemann får en bokstav. For tidlig = bokstav.', 'Four of a kind? Tap the snout. The rest get 5 seconds – the last one gets a letter. Too early = a letter.'], ['Den som staver G-R-I-S først, er grisen og tar en shot.', 'The first to spell P-I-G-S is the pig and takes a shot.']],
    president: [['Bli kvitt kortene først: legg like mange som ligger, men høyere. Toer er høyest og feier bordet.', 'Get rid of your cards first: play as many as lie there, but higher. Twos are highest and clear the table.'], ['20 sekunder per tur – ellers passes det for deg.', '20 seconds per turn – otherwise you pass.'], ['Rævkjøreren drikker 3, Viserævkjøreren 2, Presidenten deler ut 3. Neste runde gir Rævkjøreren sitt beste kort til Presidenten.', 'The Scumbag drinks 3, the Vice Scumbag 2, the President hands out 3. Next round the Scumbag gives their best card to the President.']],
    bingo: [['Alle får sitt eget bingobrett med sanger.', 'Everyone gets their own bingo card with songs.'], ['Spill spillelista og kryss av sangene du hører.', 'Play the playlist and mark the songs you hear.'], ['Rekke: del ut to slurker. Fullt brett: BINGO – alle andre drikker opp, og leken er ferdig.', 'A line: hand out two sips. Full card: BINGO – everyone else finishes their drink, and the game is over.']],
    pekeleken: [['Den som leser, leser kortet høyt og starter nedtellingen. Alle telefonene sier PEK! samtidig.', 'The reader reads the card out loud and starts the countdown. Every phone says POINT! at the same time.'], ['Pek på den det passer best på. Trykk inn hvor mange som pekte på deg.', 'Point at who it fits best. Then tap how many pointed at you.'], ['Flest fingre drikker like mange slurker. Av og til kommer en vri.', 'Most fingers drinks that many sips. Now and then there is a twist.']],
    nyhetsrunden: [['Spørsmålet dukker opp på alle telefonene – verten leser det høyt.', 'The question appears on every phone – the host reads it out loud.'], ['Svar før klokka går ut. Du kan bytte svar helt til svaret vises.', 'Answer before the clock runs out. You can change your answer until it is shown.'], ['Riktig: del ut én. Feil: drikk én. Tallspørsmål: den nærmest deler ut to, lengst unna drikker.', 'Right: hand out one. Wrong: drink one. Number questions: closest hands out two, furthest off drinks.']],
    ring: [['Telefonene er kortstokken – alle ser samme kort.', 'The phones are the deck – everyone sees the same card.'], ['Den som har tur, trekker og gjør det kortet sier.', 'Whoever’s turn it is draws and does what the card says.'], ['Den som trekker fjerde konge, drikker opp!', 'Whoever draws the fourth king finishes their drink!']],
    ringr: [['Kortene ligger i en ring rundt glasset. Den som har tur, snurrer ringen med fingeren – kortet øverst lyser opp.', 'The cards lie in a ring around the glass. Whoever’s turn it is spins the ring with a finger – the top card lights up.'],
      ['Hold på det gule kortet og følg sporet ut av ringen. Går du utenfor sporet, bygger spenningen seg opp – ryker ringen, drikker du opp glasset ditt!', 'Hold the yellow card and follow the lane out of the ring. Leave the lane and the tension builds – if the ring breaks, finish your drink!'],
      ['Jo færre kort som er igjen, jo strammere blir ringen. Ringen kan bare brytes én gang – etter det er resten trygt.', 'The fewer cards left, the tighter the ring gets. The ring can only break once – after that the rest is safe.'],
      ['Gjør det kortet sier. Hver konge fyller kongekoppen – den som trekker fjerde konge, drikker den.', 'Do what the card says. Each king fills the king’s cup – whoever draws the fourth king drinks it.']],
    aldri: [['Kortet kommer opp på alle telefonene.', 'The card shows up on every phone.'], ['Svar «Jeg har» eller «Aldri». Ingen ser svaret før alle har svart.', 'Answer “I have” or “Never”. Nobody sees the answers until everyone has answered.'], ['De som har gjort det, drikker én slurk. Så trykker noen «Neste kort».', 'Everyone who has done it drinks one sip. Then someone taps “Next card”.'], ['Bare én har gjort det? Hen forteller historien og drikker to, eller fire hvis hen nekter. Ingen? Den som trakk kortet, drikker én.', 'Only one has done it? They tell the story and drink two, or four if they refuse. Nobody? Whoever drew the card drinks one.'], ['30 kort i en runde. Så velger verten hva dere gjør nå.', '30 cards a round. Then the host picks what to do next.']],
    lat: [['Alle skriver inn én låt som passer kategorien – i hemmelighet.', 'Everyone enters one song that fits the category – in secret.'], ['Låtene kommer én og én. Verten spiller dem på Spotify. Gjett hvem som valgte den – feil gjett drikker én.', 'The songs come one by one. The host plays them on Spotify. Guess who picked it – wrong guesses drink one.'], ['Eieren forteller historien bak. Til slutt stemmer dere på beste historie; vinneren deler ut 3.', 'The owner tells the story behind it. Finally you vote for the best story; the winner hands out 3.']],
    kategori: [['Bomba går rundt. Har du den, sier du noe i kategorien og trykker «Sagt!».', 'The bomb goes around. When you have it, say something in the category and tap “Said it!”.'], ['Ingen vet når den smeller. Den som har den da, drikker 2.', 'Nobody knows when it goes off. Whoever has it then drinks 2.'], ['Gjentar noen seg, trykker de andre «Sagt før!».', 'If someone repeats, the others tap “Said before!”.']],
    nodt: [['Appen setter én i stolen for hvert kort, etter tur.', 'The app puts one person in the hot seat for each card, in turn.'], ['Den i stolen velger nødt eller sannhet på telefonen. Så snus kortet.', 'The person in the hot seat picks truth or dare on their phone. Then the card flips.'], ['Gjør det eller svar ærlig – eller feig ut og drikk 3.', 'Do it or answer honestly – or chicken out and drink 3.'], ['Alle andre dømmer: «Godkjent» eller «Juks!». Flertallet bestemmer, likt er godkjent. Juks: drikk 2.', 'Everyone else judges: “Approved” or “Cheat!”. The majority decides, a tie is approved. Cheat: drink 2.']],
    rygg: [['Appen velger et par for hvert kort: A og B, B og C, C og A … Så er alle med på rundt seks kort.', 'The app picks a pair for each card: A and B, B and C, C and A … so everyone gets about six cards.'], ['De to setter seg rygg mot rygg og peker i hemmelighet på telefonen: på seg selv eller på den andre.', 'The two sit back to back and point in secret on their phones: at themselves or at the other.'], ['Alle andre gjetter: den ene, den andre eller «uenige». Gjetter du feil, drikker du én.', 'Everyone else guesses: one, the other or “disagree”. Guess wrong and you drink one.'], ['Enige: den de pekte på drikker én. Uenige: begge drikker én.', 'Agreed: the one they pointed at drinks one. Disagreed: both drink one.']],
    enten: [['Kortet har to valg. Velg side på telefonen – ingen ser hva du velger før klokka er ute.', 'The card has two options. Pick a side on your phone – nobody sees your pick until the clock runs out.'], ['Mindretallet drikker én. Like mange på hver side: ingen drikker. Alle likt: den som trakk kortet, drikker én.', 'The minority drinks one. Equal sides: nobody drinks. Everyone the same: whoever drew the card drinks one.'], ['Står én helt alene, får hen 20 sekunder til å forsvare valget. Får hen med seg én, drikker den personen – ellers drikker hen to.', 'If one person stands alone, they get 20 seconds to defend the pick. Win one person over and that person drinks – otherwise drink two.'], ['30 kort i en runde. Så velger verten hva dere gjør nå.', '30 cards a round. Then the host picks what to do next.']],
    kort: [['Alle ser samme kort på skjermen.', 'Everyone sees the same card on screen.'], ['Les det høyt og gjør det kortet sier.', 'Read it out loud and do what it says.'], ['Verten og den som har tur trykker «Neste kort».', 'Anyone can tap “Next card”.']],
  };
  function reglerPanel(s) {
    var nokkel = s.type === 'kort' ? (s.lek === 'ring-of-fire' ? (s.ring ? 'ringr' : 'ring') : (s.pek ? 'pekeleken' : s.aldri || s.svarPaa ? 'aldri' : s.ee || s.lek === 'enten-eller' ? 'enten' : s.rr || s.lek === 'rygg-mot-rygg' ? 'rygg' : s.ns || s.lek === 'nodt-eller-sannhet' ? 'nodt' : s.kb || s.lek === 'kategorier' ? 'kategori' : s.lb || s.lek === 'tanken-bak-sangen' ? 'lat' : 'kort')) : s.type, r = REGLER[nokkel];
    if (!r) return '';
    var sett = les('bd_regler_sett') || [], forste = sett.indexOf(nokkel) === -1;
    if (forste) { sett.push(nokkel); skriv('bd_regler_sett', sett.slice(-40)); apneRegler[nokkel] = true; }
    return '<details class="rom-regler" data-regler="' + nokkel + '"' + (apneRegler[nokkel] ? ' open' : '') + '><summary>❓ ' + T('Slik spiller dere', 'How to play') + '</summary><ol>' +
      r.map(function (x) { return '<li>' + esc(T(x[0], x[1])) + '</li>'; }).join('') + '</ol></details>';
  }
  var apneRegler = {};
  root.addEventListener('toggle', function (e) { var d = e.target; if (d && d.dataset && d.dataset.regler) apneRegler[d.dataset.regler] = d.open; }, true);
  /** Lekene i lobbyen sortert i grupper som kan åpnes og lukkes, så lista ikke blir uendelig lang. */
  var GRUPPER = [
    [T('Snakk, stem og avslør', 'Talk, vote and reveal'), ['nyhetsrunden', 'hvemskrev', 'samme', 'spion', 'pannekort', 'mest', 'tosannheter', 'regelfabrikken']],
    [T('Kort og terninger', 'Cards and dice'), ['ring-of-fire', 'dealer', 'veddelopet', 'overunder', 'bingo']],
    [T('Raske runder', 'Quick rounds'), ['skal']],
  ];
  // Husk hvilke grupper verten har åpnet, siden lobbyen tegnes på nytt når noen blir med
  var apneGrupper = {};
  function erApen(n, standard) { return n in apneGrupper ? apneGrupper[n] : standard; }
  root.addEventListener('toggle', function (e) { var d = e.target; if (d && d.dataset && d.dataset.gruppe) apneGrupper[d.dataset.gruppe] = d.open; }, true);
  /** Pekeleken har to måter: pek med fingeren i rommet, eller stem i det stille på mobilen (det som før var «Mest sannsynlig»). */
  var pkMobil = false; try { pkMobil = localStorage.getItem('bd_pk_mobil') === '1'; } catch (e) {}
  function pkVariant() {
    return '<div class="pk-variant" role="group" aria-label="' + T('Hvordan peker dere?', 'How do you point?') + '">' +
      '<button type="button" data-g="pk-variant" data-v="rom" aria-pressed="' + !pkMobil + '">' + T('Pek i rommet', 'Point in the room') + '</button>' +
      '<button type="button" data-g="pk-variant" data-v="mobil" aria-pressed="' + pkMobil + '">' + T('Stem på mobilen', 'Vote on phones') + '</button></div>';
  }
  // Kort- og terningspill som krever Pluss: står i «Kort og terninger» med lås, ikke i en egen Pluss-gruppe
  var KORT_PLUSS = ['bussruta', 'pyramiden', 'gris', 'president', 'yatzy'];
  function plussFlis(x) {
    var aapen = !!tilstand.pluss;
    return '<div class="rom-lek pluss' + (aapen ? '' : ' laast') + '">' + klistremerke(x.id || '', 'rom-lek-merke') + '<b>' + (aapen ? '' : '🔒 ') + esc(x.navn) + '</b><span>' + esc(x.om || '') + '</span>' +
      '<div class="rom-mod"><button type="button" data-g="start" data-lek="' + x.id + '" data-modus="*">' + (aapen ? 'Start' : T('Lås opp', 'Unlock')) + '</button></div></div>';
  }
  function lekeGrupper(leker, tegnLek) {
    var brukt = {}, ut = '';
    GRUPPER.forEach(function (g, i) {
      var l = leker.filter(function (x) { return g[1].indexOf(x.id) !== -1; });
      var pl = i === 1 && tilstand && tilstand.leker ? tilstand.leker.filter(function (x) { return x.pluss && KORT_PLUSS.indexOf(x.id) !== -1; }) : [];
      if (!l.length && !pl.length) return;
      l.forEach(function (x) { brukt[x.id] = 1; });
      ut += '<details class="rom-gruppe" data-gruppe="' + i + '"' + (erApen(String(i), false) ? ' open' : '') + '><summary>' + esc(g[0]) + ' <small>' + (l.length + pl.length) + '</small></summary><div class="rom-leker">' + l.map(tegnLek).join('') + pl.map(plussFlis).join('') + '</div></details>';
    });
    var rest = leker.filter(function (x) { return !brukt[x.id]; });
    if (rest.length) ut += '<details class="rom-gruppe" data-gruppe="rest"' + (erApen('rest', false) ? ' open' : '') + '><summary>' + T('Kortstokker med spørsmål', 'Question decks') + ' <small>' + rest.length + '</small></summary><div class="rom-leker">' + rest.map(tegnLek).join('') + '</div></details>';
    return ut;
  }
  function plussLeker() {
    var t = tilstand, l = (t.leker || []).filter(function (x) { return x.pluss && KORT_PLUSS.indexOf(x.id) === -1; }); if (!l.length) return '';
    var aapen = !!t.pluss;
    return '<details class="rom-gruppe pluss" data-gruppe="pluss"' + (erApen('pluss', aapen) ? ' open' : '') + '><summary>' + T('✨ Med Pluss', '✨ With Pluss') + ' <small>' + l.length + '</small></summary>' + 
      '<div class="rom-leker">' + l.map(function (x) {
        return '<div class="rom-lek pluss' + (aapen ? '' : ' laast') + '">' + klistremerke(x.id || '', 'rom-lek-merke') + '<b>' + (aapen ? '' : '🔒 ') + esc(x.navn) + '</b><span>' + esc(x.om || '') + '</span>' +
          '<div class="rom-mod"><button type="button" data-g="start" data-lek="' + x.id + '" data-modus="*">' + (aapen ? 'Start' : T('Lås opp', 'Unlock')) + '</button></div></div>';
      }).join('') + '</div></details>';
  }
  /** Hvor mange gratisplasser som er brukt, og beskjed hvis noen ble stoppet i døra. */
  function plassInfo() {
    var t = tilstand; if (!erVert() || t.pluss || !t.gratisPlasser) return '';
    var n = t.spillere.length, maks = t.gratisPlasser, nylig = t.fullForsok && (Date.now() + klokkeAvvik) - t.fullForsok < 10 * 60000;
    if (nylig) return '<div class="rom-plass full"><b>' + T('Noen prøvde å bli med, men rommet er fullt.', 'Someone tried to join, but the room is full.') + '</b><span>' + T('Gratisversjonen har plass til ' + maks + ' telefoner. Med Pluss kan dere være opptil 16.', 'The free version fits ' + maks + ' phones. With Pluss you can have up to 16.') + '</span><button class="btn gold small" data-g="pluss-tilbud" type="button">' + T('Lås opp rommet', 'Unlock the room') + '</button></div>';
    if (n >= maks - 1) return '<p class="rom-plass">' + n + T(' av ', ' of ') + maks + T(' gratis plasser er brukt.', ' free spots used.') + ' <button class="linkbtn" data-g="pluss-tilbud" type="button">' + T('Flere? Lås opp med Pluss', 'More people? Unlock with Pluss') + '</button></p>';
    return '';
  }
  function visPlussTilbud() {
    if (harSkall()) {
      // iPhone-appen: kjøp går gjennom App Store (ios/App/App/PlussArk.swift). Når Pluss er på plass, skrus det på her.
      window.__mvPlussEtter = function () { plussSjekket = false; aktiverPluss(true); };
      try { document.dispatchEvent(new CustomEvent('mv-pluss', { detail: {} })); } catch (x) {}
      return;
    }
    if (document.querySelector('.pluss-tilbud')) return;
    var m = document.createElement('div'); m.className = 'rom-tavle pluss-tilbud'; m.setAttribute('role', 'dialog');
    var inne = window.BDKonto && window.BDKonto.les();
    m.innerHTML = '<div class="rom-tavle-innhold"><div class="rom-tavle-topp"><h2>' + T('✨ mittvors pluss', '✨ mittvors pluss') + '</h2><button class="linkbtn" data-p="lukk" type="button">' + T('Lukk', 'Close') + '</button></div>' +
      '<p>' + T('Med Pluss hos <b>verten</b> får hele rommet alle lekene og pakkene, og dere kan være opptil 16 telefoner. Gjestene trenger ikke betale.', 'When the <b>host</b> has Pluss, the whole room gets every game and pack, and you can have up to 16 phones. Guests don\'t pay a thing.') + '</p>' +
      '<p>' + T('<b>Første kveld er gratis.</b> Etterpå 29 kr for en kveld eller 199 kr for et år.', '<b>Your first night is free.</b> After that it\'s NOK 29 for a night or NOK 199 for a year.') + '</p>' +
      '<div class="dl-knapper">' + (inne ? '<button class="btn gold" data-p="gratis" type="button">' + T('Prøv gratis i kveld', 'Try it free tonight') + '</button>' : '<a class="btn gold" data-tilbake href="' + RUTE.konto + '">' + T('Logg inn for å prøve gratis', 'Log in to try it free') + '</a>') +
      '<a class="btn ghost" href="' + RUTE.pluss + '" target="_blank" rel="noopener">' + T('Se Pluss', 'See Pluss') + '</a></div><p class="formmsg" role="status"></p></div>';
    m.addEventListener('click', function (e) {
      if (e.target === m || e.target.closest('[data-p=lukk]')) return m.remove();
      if (e.target.closest('[data-tilbake]')) { try { sessionStorage.setItem('bd_etter_innlogging', location.pathname + location.search); } catch (x) {} return; }
      var b = e.target.closest('[data-p=gratis]'); if (!b) return;
      b.disabled = true;
      kontoApi('/api/pluss/gratis', { method: 'POST' }).then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); }).then(function (x) {
        var msg = m.querySelector('.formmsg');
        if (!x.ok && x.d.feil !== 'brukt') { msg.textContent = x.d.melding || T('Det gikk ikke.', 'That didn\'t work.'); msg.className = 'formmsg err'; b.disabled = false; return; }
        if (x.d.feil === 'brukt') { msg.innerHTML = (x.d.melding ? esc(x.d.melding) : T('Gratiskvelden er brukt.', 'Your free night is used up.')) + ' <a href="' + RUTE.pluss + '">' + T('Kjøp et pass', 'Buy a pass') + '</a>.'; msg.className = 'formmsg err'; return; }
        m.remove(); plussSjekket = false; aktiverPluss(true);
      });
    });
    document.body.appendChild(m);
    // Har verten et lagret kveldspass (f.eks. fra verving)? Da kan det brukes med én gang.
    if (inne) kontoApi('/api/pluss/status').then(function (r) { return r.json(); }).then(function (d) {
      if (!d.kveldspass || !m.isConnected) return;
      var k = m.querySelector('.dl-knapper'), b = document.createElement('button');
      b.className = 'btn gold'; b.type = 'button'; b.dataset.g = 'kveldspass';
      b.textContent = T('Bruk et lagret kveldspass (', 'Use a saved night pass (') + d.kveldspass + ')';
      b.addEventListener('click', function () {
        b.disabled = true;
        kontoApi('/api/verv', { method: 'POST' }).then(function (r) { return r.json().then(function (x) { return { ok: r.ok, d: x }; }); }).then(function (x) {
          if (!x.ok) { b.disabled = false; return toast(x.d.melding || T('Det gikk ikke.', 'That didn\'t work.')); }
          m.remove(); plussSjekket = false; aktiverPluss(true);
        });
      });
      k.insertBefore(b, k.firstChild);
    }).catch(function () {});
  }
  // Er verten logget inn med Pluss? Da låses rommet opp automatisk.
  var plussSjekket = false;
  function aktiverPluss(tving) {
    if (plussSjekket || !erVert() || (tilstand && tilstand.pluss) || !window.BDKonto || !window.BDKonto.les()) return;
    plussSjekket = true;
    kontoApi('/api/pluss/status').then(function (r) { return r.json(); }).then(function (d) {
      if (d.aktiv) gjorAlltid({ handling: 'pluss-aktiver' });
      else if (tving) toast(T('Fant ikke Pluss på kontoen.', 'Couldn\'t find Pluss on your account.'));
    }).catch(function () {});
  }

  /* ---------- venterom for en lek som er valgt på forhånd ---------- */
  function valgtLobby() {
    var t = tilstand, v = t.valgt, l = (t.leker || []).find(function (x) { return x.id === v.lek; }) || { navn: LEKNAVN[v.lek] || v.lek, moduser: [] };
    var liste = '<ul class="rom-venter">' + t.spillere.map(function (p) { return '<li>' + (p.id === t.vert ? ikon.krone : '') + esc(p.navn) + '</li>'; }).join('') + '</ul>';
    if (!erVert()) {
      return '<div class="rom-vent"><p class="rom-etikett">' + T('Neste lek', 'Next game') + '</p><p class="rom-stor">' + esc(l.navn) + '</p>' +
        '<p>' + T('Venter på at ' + esc(navn(t.vert)) + ' starter når alle er med …', 'Waiting for ' + esc(navn(t.vert)) + ' to start once everyone\'s in …') + '</p>' + liste + romMerker() + '</div>';
    }
    var mod = l.moduser || [], valgtMod = mod.some(function (m) { return m.v === v.modus; }) || (l.type === 'nyhetsrunden' && /^\d{4}-\d{2}$/.test(v.modus || '')) ? v.modus : '';
    // Nyhetsrunden: nyeste uke er valgt, men verten kan velge en eldre uke før start
    if (l.type === 'nyhetsrunden' && mod.length > 1) {
      var uke = mod.some(function (m) { return m.v === nrUke; }) ? nrUke : (valgtMod || mod[0].v);
      var ukevalg = '<label class="rom-nr-uke"><span class="rom-etikett">' + T('Uke', 'Week') + '</span><select data-nr-uke>' + mod.map(function (m) { return '<option value="' + esc(m.v) + '"' + (m.v === uke ? ' selected' : '') + '>' + esc(m.t) + (nrSpilt().indexOf(m.v) !== -1 ? ' ✓' : '') + '</option>'; }).join('') + '</select></label>';
      var nrStart = '<button class="rom-stor-knapp' + (erApp ? ' app-start' : '') + '" data-g="start" data-lek="' + l.id + '" data-modus="' + esc(uke) + '" type="button">Start ' + esc(l.navn) + '</button>';
      var annen = '<p><button class="linkbtn" data-g="velg-annen" type="button">' + T('Velg en annen lek', 'Pick another game') + '</button></p>';
      if (erApp) return plassInfo() + appTopp(t.spillere.length) +
        '<p class="rom-etikett">' + T('Dere skal spille', 'You’re playing') + '</p><h2 class="rom-h2" style="margin-top:0">' + esc(l.navn) + '</h2>' + (t.spillere.length > 1 ? liste : '') +
        ukevalg + nrStart + annen;
      return '<p class="rom-etikett">' + T('Dere skal spille', 'You\'re playing') + '</p><h2 class="rom-h2" style="margin-top:0">' + esc(l.navn) + '</h2>' +
        plassInfo() + qrBoks() + romValg() + '<p class="rom-status">' + t.spillere.length + T(' med i rommet', ' in the room') + '</p>' + liste +
        ukevalg + nrStart + annen;
    }
    if (erApp) {
      // Appen: invitasjonen først, så én startknapp (alle varianter). Variantene ligger bak «Velg en annen lek» → «Mer».
      var modApp = valgtMod || (mod[0] && l.type === 'nyhetsrunden' ? mod[0].v : '*');
      return plassInfo() + appTopp(t.spillere.length) +
        '<p class="rom-etikett">' + T('Dere skal spille', 'You’re playing') + '</p><h2 class="rom-h2" style="margin-top:0">' + esc(l.navn) + '</h2>' + (t.spillere.length > 1 ? liste : '') +
        '<button class="rom-stor-knapp app-start" data-g="start" data-lek="' + l.id + '" data-modus="' + esc(modApp) + '" type="button">Start ' + esc(l.navn) + '</button>' +
        '<p><button class="linkbtn" data-g="velg-annen" type="button">' + T('Velg en annen lek', 'Pick another game') + '</button></p>';
    }
    var startKnapper = mod.length > 1 && !valgtMod
      ? '<p class="small">' + T('Velg variant for å starte:', 'Pick a version to start:') + '</p><div class="rom-mod stor">' + mod.map(function (m) { return '<button type="button" data-g="start" data-lek="' + l.id + '" data-modus="' + esc(m.v) + '">' + esc(m.t) + '</button>'; }).join('') + '</div>'
      : '<button class="rom-stor-knapp" data-g="start" data-lek="' + l.id + '" data-modus="' + esc(valgtMod || (mod[0] && l.type === 'nyhetsrunden' ? mod[0].v : '*')) + '" type="button">Start ' + esc(l.navn) + '</button>';
    return '<p class="rom-etikett">' + T('Dere skal spille', 'You\'re playing') + '</p><h2 class="rom-h2" style="margin-top:0">' + esc(l.navn) + '</h2>' +
      plassInfo() + qrBoks() + romValg() + '<p class="rom-status">' + t.spillere.length + T(' med i rommet', ' in the room') + '</p>' + liste +
      startKnapper +
      '<p><button class="linkbtn" data-g="velg-annen" type="button">' + T('Velg en annen lek', 'Pick another game') + '</button></p>';
  }

  /* ---------- innstillinger for kvelden: alkoholfri og fast gjeng ---------- */
  var mineGjenger = null, gjengerHentet = false;
  function hentMineGjenger() {
    if (gjengerHentet || !window.BDKonto || !window.BDKonto.les()) return; gjengerHentet = true;
    kontoApi('/api/gjeng').then(function (r) { return r.ok ? r.json() : { gjenger: [] }; })
      .then(function (d) { mineGjenger = d.gjenger || []; tegn(); }).catch(function () { mineGjenger = []; });
  }
  function romValg() {
    var t = tilstand; if (!erVert()) return '';
    hentMineGjenger();
    var inne = window.BDKonto && window.BDKonto.les(), gj = '';
    if (t.gjeng) gj = '<p class="rom-gjeng">' + T('🏆 Kvelden telles i sesongen til ', '🏆 Tonight counts toward the season for ') + '<a href="' + RUTE.gjeng + '?k=' + esc(t.gjeng.kode) + '" target="_blank" rel="noopener"><b>' + esc(t.gjeng.navn) + '</b></a>' + (t.gjeng.kveld ? '' : ' · <button class="linkbtn" data-g="gjeng-av" type="button">' + T('Fjern', 'Remove') + '</button>') + '</p>';
    else if (mineGjenger && mineGjenger.length) gj = '<label class="rom-gjeng">' + T('🏆 Fast gjeng? ', '🏆 Regular crew? ') + '<select id="romGjeng"><option value="">' + T('Velg gjeng …', 'Pick a crew …') + '</option>' +
      mineGjenger.map(function (g) { return '<option value="' + esc(g.id) + '">' + esc(g.navn) + '</option>'; }).join('') + '</select></label>';
    else if (inne && mineGjenger) gj = '<p class="rom-gjeng small"><a href="' + RUTE.gjeng + '" target="_blank" rel="noopener">🏆 ' + T('Lag en fast gjeng', 'Make a crew') + '</a></p>';
    return '<div class="rom-innst"><button type="button" class="alkfri-bryter" data-g="alkoholfri" aria-pressed="' + !!t.alkoholfri + '"><span class="alkfri-knott" aria-hidden="true"></span>' + T('🥤 Alkoholfri for alle', '🥤 Alcohol-free for everyone') + '</button>' +
      gj + '</div>';
  }
  /** Det gjestene ser: at kvelden er alkoholfri eller telles for en gjeng. */
  function romMerker() {
    var t = tilstand, ut = '';
    if (t.alkoholfri) ut += '<p class="small">' + T('🥤 Alkoholfri kveld – straffepoeng i stedet for alkohol.', '🥤 Alcohol-free night – penalty points instead of drinks.') + '</p>';
    if (t.gjeng) ut += '<p class="small">' + T('🏆 Kvelden telles i sesongen til ', '🏆 Tonight counts toward the season for ') + '<a href="' + RUTE.gjeng + '?k=' + esc(t.gjeng.kode) + '" target="_blank" rel="noopener">' + esc(t.gjeng.navn) + '</a>.</p>';
    ut += gjengBoks();
    return ut;
  }

  /* ---------- egne kortstokker fra kontoen ---------- */
  var mineStokker = null, stokkerHentet = false;
  function hentMineStokker() {
    if (stokkerHentet || !window.BDKonto) return; stokkerHentet = true;
    window.BDKonto.bruker().then(function (u) {
      if (!u) { mineStokker = []; return; }
      return window.BDKonto.stokker.liste().then(function (l) { mineStokker = l; });
    }).catch(function () { mineStokker = []; }).then(function () { mineStokker = mineStokker || []; tegn(); });
  }
  function egneStokker() {
    hentMineStokker();
    var klar = les('bd_stokk_rom'), liste = (mineStokker || []).slice();
    if (klar && klar.kort) liste = [klar].concat(liste.filter(function (x) { return x.id !== klar.id; }));
    var logget = window.BDKonto && window.BDKonto.les();
    if (!liste.length) return '';
    return '<h2 class="rom-h2">' + T('Dine kortstokker', 'Your decks') + '</h2><div class="rom-leker">' + liste.map(function (x, i) {
      return '<div class="rom-lek' + (klar && i === 0 ? ' klar' : '') + '"><b>' + esc(x.navn) + '</b><span>' + (x.kort || []).length + T(' kort', ' cards') + '</span>' +
        '<div class="rom-mod"><button type="button" data-g="egen" data-i="' + i + '">Start</button></div></div>';
    }).join('') + '</div>';
  }
  function egenListe() {
    var klar = les('bd_stokk_rom'), liste = (mineStokker || []).slice();
    if (klar && klar.kort) liste = [klar].concat(liste.filter(function (x) { return x.id !== klar.id; }));
    return liste;
  }
  function lagreSomStokk() {
    var s = tilstand && tilstand.spill; if (!s || !s.alleKort || !s.alleKort.length) return;
    var d = new Date(), navn = T('Skriv og drikk ' + d.getDate() + '.' + (d.getMonth() + 1) + '.', 'Write & Drink ' + d.getDate() + '/' + (d.getMonth() + 1));
    var K = window.BDKonto;
    (K ? K.bruker() : Promise.resolve(null)).then(function (u) {
      if (!u) {
        skriv('bd_stokk_utkast', { navn: navn, kort: s.alleKort });
        toast(T('Kortene er lagt til side. Logg inn på Profil for å lagre dem.', 'The cards are set aside. Log in under Profiles to save them.'));
        return;
      }
      return K.stokker.lagre({ navn: navn, kort: s.alleKort }).then(function () { toast(T('Lagret som kortstokk på kontoen din ✓', 'Saved as a deck on your account ✓')); stokkerHentet = false; mineStokker = null; });
    }).catch(function (e) { toast(e.message || T('Fikk ikke lagret.', 'Couldn\'t save.')); });
  }

  /** Makkere (8): den som trakk åtteren, velger makker. Etterpå vises parene under kortet. */
  function makkerHtml(s) {
    var ut = '';
    if (s.velgMakker && (s.velgMakker === tilstand.meg || erVert())) {
      var jeg = s.velgMakker === tilstand.meg;
      ut += '<div class="rof-makker-valg"><p class="rom-etikett">🤝 ' + (jeg ? T('Velg makkeren din', 'Pick your mate') : esc(navn(s.velgMakker)) + T(' velger makker', ' picks a mate')) + '</p><div class="rom-valg">' +
        tilstand.spillere.filter(function (p) { return p.id !== s.velgMakker; }).map(function (p) { return '<button type="button" data-g="rof-makker" data-paa="' + p.id + '">' + esc(p.navn) + '</button>'; }).join('') + '</div></div>';
    } else if (s.velgMakker) ut += '<p class="small">🤝 ' + esc(navn(s.velgMakker)) + T(' velger makker …', ' is picking a mate …') + '</p>';
    if (s.makkere && s.makkere.length) ut += '<p class="rof-makkere">🤝 ' + s.makkere.map(function (m) { return esc(navn(m[0])) + ' ↔ ' + esc(navn(m[1])); }).join(' · ') + '</p>';
    return ut;
  }
  /* ---------- Ring of Fire: ringen rundt koppen, og trekket med stø hånd ----------
     Snurr: sveip rundt ringen. Trekk: hold på det gule kortet øverst og følg sporet ut av ringen.
     Fart er umulig å dosere med tommelen, så det er presisjonen som teller: utenfor sporet bygger spenningen
     seg opp (ringen skjelver, telefonen surrer), innenfor slipper den sakte. Sporet blir smalere for hvert kort.
     Alt tegnes i én SVG (358×500), så det skalerer med telefonen. De andre ser kortet ditt på vei ut. */
  var rofFor = -2, rofA = 0, rofDrar = null, rofVentTegn = false, rofBruddSett = null, rofValgt = -1, rofVistNr = -1, rofSkjult = -1, rofSendt = 0, rofKnirk = 0;
  var ROF_N = 52, ROF_STEG = 360 / 52, ROF_CX = 179, ROF_CY = 318, ROF_R = 118;
  var ROF_SPOR = [[179, 190], [212, 150], [146, 110], [179, 50]];
  var ROF_D = 'M179 190 C 212 150, 146 110, 179 50';
  function rofNorm(a) { a = a % 360; if (a > 180) a -= 360; if (a < -180) a += 360; return a; }
  /** Punktet på sporet ved t (0 = i ringen, 1 = ute). */
  function rofSpor(t) {
    var P = ROF_SPOR, u = 1 - t;
    return [u * u * u * P[0][0] + 3 * u * u * t * P[1][0] + 3 * u * t * t * P[2][0] + t * t * t * P[3][0],
      u * u * u * P[0][1] + 3 * u * u * t * P[1][1] + 3 * u * t * t * P[2][1] + t * t * t * P[3][1]];
  }
  /** Nærmeste t på sporet, og avstanden dit. */
  function rofNaermest(px, py) {
    var best = 0, bd = 1e9;
    for (var i = 0; i <= 60; i++) { var t = i / 60, p = rofSpor(t), d = (p[0] - px) * (p[0] - px) + (p[1] - py) * (p[1] - py); if (d < bd) { bd = d; best = t; } }
    return [best, Math.sqrt(bd)];
  }
  /** Sporets halvbredde: romslig i første runde, smalere jo færre kort som er igjen. Brutt ring = kan ikke ryke. */
  function rofHalv(s) {
    if (s.ringBrutt) return 999;
    var igjen = ROF_N - (s.tatt || []).length, forste = (s.nr || 0) < (tilstand.spillere || []).length;
    return (forste ? 30 : 26) - 14 * (1 - igjen / ROF_N);
  }
  /** Kortet som ligger nærmest toppen av ringen (av dem som er igjen). */
  function rofTopp(tatt) {
    var best = -1, bestA = 999;
    for (var i = 0; i < ROF_N; i++) { if (tatt.indexOf(i) !== -1) continue; var a = Math.abs(rofNorm(i * ROF_STEG + rofA)); if (a < bestA) { bestA = a; best = i; } }
    return best;
  }
  function rofFarge(sp) { return sp < 0.5 ? '#63E2A8' : (sp < 0.8 ? '#FFD23F' : '#FF5B1F'); }
  function rofKortHtml(k, nr) {
    var snu = nr !== rofVistNr; rofVistNr = nr;   // inn-animasjonen bare første gang kortet vises
    return '<div class="rof-kort rom-rof' + (snu ? ' rof-inn' : '') + (k.rod ? ' rod' : '') + '"><div class="rof-hj"><b>' + esc(k.v) + '</b><span>' + esc(k.s) + '</span></div>' +
      '<div class="rof-midt"><b class="rof-regel">' + esc(k.regel) + '</b><span class="rof-tekst">' + esc(k.tekst) + '</span></div>' +
      '<div class="rof-hj rof-hj2"><b>' + esc(k.v) + '</b><span>' + esc(k.s) + '</span></div></div>';
  }
  function rofSpill(s) {
    // Verten kan trekke for den som har tur (f.eks. hvis telefonen er borte) – gjelder bare dette trekket
    var tatt = s.tatt || [], min = !s.ferdig && (s.turId === tilstand.meg || (erVert() && rofFor === s.nr)), k = s.kort;
    var igjen = s.igjen != null ? s.igjen : ROF_N - tatt.length, konger = s.konger || 0;
    var holder = s.holder && s.holder.hvem !== tilstand.meg && s.holder.t > 0 ? s.holder : null;   // noen andre er i gang med et trekk
    rofValgt = rofTopp(tatt);
    var kort = '';
    for (var i = 0; i < ROF_N; i++) {
      if (tatt.indexOf(i) !== -1) continue;
      var valgt = i === rofValgt && (min || holder);
      kort += '<rect class="ring-k' + (valgt ? ' valgt' : '') + (valgt && holder ? ' drar' : '') + '" data-p="' + i + '" x="168" y="' + (valgt ? 175 : 183) + '" width="22" height="34" rx="3" transform="rotate(' + (i * ROF_STEG).toFixed(2) + ' ' + ROF_CX + ' ' + ROF_CY + ')"/>';
    }
    var halv = rofHalv(s), sp = holder ? holder.sp : 0, hp = holder ? rofSpor(holder.t) : null;
    var visSpor = (min || holder) && !s.ringBrutt;
    var visKort = k && rofSkjult !== s.nr && !holder;   // kortet ligger over ringen til neste trekk begynner (eller du legger det bort)
    return '<div class="ring-topp"><div class="ring-tur' + (min ? ' min' : '') + '"><span>Ring of Fire</span><b>' + (s.ferdig ? T('Siste kort', 'Last card') : min ? T('Din tur', 'Your turn') : esc(navn(s.turId)) + T(' trekker', ' draws')) + '</b></div>' +
      '<div class="ring-merker"><span>' + igjen + T(' igjen', ' left') + '</span><span class="rosa">' + T('Konger', 'Kings') + ' ' + konger + '/4</span></div></div>' +
      '<div class="ring-boks' + (min ? ' aktiv' : '') + (s.ringBrutt ? ' fri' : '') + '" data-nr="' + s.nr + '">' +
        '<svg class="ring-svg" viewBox="0 0 358 500" role="img" aria-label="' + T('Ringen av kort rundt kongekoppen', 'The ring of cards around the king’s cup') + '">' +
          (visSpor ? '<path class="ring-spor-bred" d="' + ROF_D + '" stroke-width="' + Math.min(80, halv * 2) + '" stroke="' + rofFarge(sp) + '"/><path class="ring-spor" d="' + ROF_D + '"/>' : '') +
          (min && !s.ringBrutt ? '<g class="ring-slot"><rect x="153" y="22" width="52" height="34" rx="4"/><text x="179" y="44">' + T('UT HER', 'OUT HERE') + '</text></g>' : '') +
          '<g class="ring-rist"><g class="ring-rotor" transform="rotate(' + rofA + ' ' + ROF_CX + ' ' + ROF_CY + ')">' + kort +
            (s.ringBrutt && s.bruddPlass != null ? '<text class="ring-sprekk" x="179" y="186" transform="rotate(' + (s.bruddPlass * ROF_STEG).toFixed(2) + ' ' + ROF_CX + ' ' + ROF_CY + ')">💥</text>' : '') + '</g></g>' +
          '<g class="ring-kopp" transform="translate(147 276)"><path d="M8 4h48l-6 72a6 6 0 0 1-6 6H20a6 6 0 0 1-6-6z"/><rect class="ring-kopp-fyll" x="13" y="' + (78 - Math.min(4, konger) * 17) + '" width="38" height="' + (Math.min(4, konger) * 17) + '"/><path class="ring-krone" d="M22 28l6 8 4-12 4 12 6-8-2 16H24z"/></g>' +
          '<text class="ring-tall" x="179" y="396">' + igjen + T(' kort i ringen', ' cards in the ring') + '</text>' +
          '<rect class="ring-holdt" x="' + ((hp ? hp[0] : 179) - 14) + '" y="' + ((hp ? hp[1] : 190) - 22) + '" width="28" height="44" rx="4"' + (hp ? '' : ' visibility="hidden"') + '/>' +
          '<g class="ring-maaler"><text x="14" y="482">' + (holder ? esc(navn(holder.hvem)).toUpperCase() : T('SPENNING', 'TENSION')) + '</text><rect class="ring-maaler-bak" x="100" y="470" width="244" height="14" rx="3"/><rect class="ring-maaler-i" x="100" y="470" width="' + Math.round(244 * Math.min(1, sp)) + '" height="14" rx="3" fill="' + rofFarge(sp) + '"/></g>' +
        '</svg>' +
        (visKort ? '<div class="ring-over"><p class="rom-etikett">' + esc(k.hvem || '') + T(' trakk', ' drew') + '</p>' + rofKortHtml(k, s.nr) +
          '<button class="btn gold" data-g="rof-lukk" type="button">' + (min ? T('Greit – din tur', 'Got it – your turn') : T('Greit', 'Got it')) + '</button>' +
          (!min && s.turId && !s.ferdig ? '<p class="ring-neste">' + T('Neste: ', 'Next: ') + esc(navn(s.turId)) + '</p>' : '') + '</div>' : '') +
      '</div>' +
      '<p class="ring-hint">' + (s.ringBrutt ? (min ? '💥 ' + T('Ringen er brutt. Trykk på ringen – den snurrer og velger kortet for deg.', 'The ring is broken. Tap the ring – it spins and picks the card for you.')
          : holder ? esc(navn(holder.hvem)) + T(' snurrer ringen …', ' is spinning the ring …') : '💥 ' + T('Ringen er brutt av ', 'The ring was broken by ') + esc((s.brudd && s.brudd.navn) || '') + T('. Nå snurrer ringen og velger kortet.', '. The ring now spins and picks the card.'))
        : min ? T('Snurr ringen. Hold på det gule kortet og følg sporet ut – stø hånd.', 'Spin the ring. Hold the yellow card and follow the lane out – steady hand.')
        : holder ? esc(navn(holder.hvem)) + T(' drar … ryker ringen, drikker de opp.', ' is pulling … if the ring breaks, they finish their drink.')
        : T('Ryker ringen, drikker ', 'If the ring breaks, ') + esc(navn(s.turId)) + T(' opp glasset.', ' finishes their drink.')) + '</p>' +
      makkerHtml(s) + (erMobil() ? '' : rofMer(s));
  }
  /** Bingo: hvor nærme de andre er. */
  function bgAndre(s) {
    var megId = tilstand.meg, andre = (s.andre || []).slice().sort(function (a, c) { return c.n - a.n; });
    return '<p class="nr-etikett">' + T('Hvor nærme er de?', 'How close are they?') + '</p><ul class="bg-andre">' + andre.map(function (a) {
      return '<li' + (a.id === megId ? ' class="meg"' : '') + '>' + nrHode(a.id, '', '') + '<b>' + jaNavn(a.id) + '</b><span class="bg-stripe"><i style="transform:scaleX(' + (a.n / 16) + ')"></i></span><b>' + a.n + '/16</b></li>';
    }).join('') + '</ul>';
  }
  /** Det hver lek legger i «Mer» på mobil – det som ellers lå under spillet. */
  var merEkstra = { 'ring-of-fire': function (s) { return rofMer(s); }, bingo: function (s) { return bgAndre(s); } };
  /** Vertens knapper i Ring of Fire. På mobil ligger de bak «Mer», så ringen får plassen. */
  function rofMer(s) {
    if (!erVert()) return '';
    var min = !s.ferdig && (s.turId === tilstand.meg || rofFor === s.nr);
    return '<p class="ring-knapper">' + (!min && !s.ferdig ? '<button class="btn ghost small" data-g="rof-for" type="button">' + T('Trekk for ', 'Draw for ') + esc(navn(s.turId)) + '</button>' : '') +
      '<button class="btn ghost small" data-g="rof-regler" type="button">🃏 ' + T('Kortregler', 'Card rules') + (tilstand.rofRegler ? ' · ' + Object.keys(tilstand.rofRegler).length : '') + '</button></p>';
  }
  /** Ringen røk: alle telefonene får vite det. */
  function rofSjekkBrudd(d) {
    var sp = d && d.spill, b = sp && sp.ring ? sp.brudd : null, nr = b ? b.nr : 0;
    if (rofBruddSett !== null && b && nr !== rofBruddSett) rofKnust(b.navn);
    rofBruddSett = nr;
  }
  function rofKnust(hvem) {
    spillLyd('knus');
    var el = document.createElement('div'); el.className = 'rof-knust'; el.setAttribute('role', 'alert');
    el.innerHTML = '<b>💥 ' + T('RINGEN RØK!', 'THE RING BROKE!') + '</b><span>' + esc(hvem || '') + T(' drikker opp glasset', ' finishes their drink') + '</span>';
    document.body.appendChild(el); setTimeout(function () { el.remove(); }, 2800);
    try { navigator.vibrate && navigator.vibrate([400, 100, 400]); } catch (e) {}
  }
  function rofOppdaterValgt(boks) {
    var s = tilstand.spill, ny = rofTopp(s.tatt || []);
    if (ny === rofValgt) return;
    rofValgt = ny; spillLyd('tikk');
    boks.querySelectorAll('.ring-k').forEach(function (e) { var v = Number(e.dataset.p) === ny; e.classList.toggle('valgt', v); e.setAttribute('y', v ? 175 : 183); });
  }
  /** Fingeren i SVG-ens koordinater (358×500), uansett hvor stor telefonen er. */
  function rofPunkt(svg, e) { var p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; var m = svg.getScreenCTM(); if (!m) return [0, 0]; var q = p.matrixTransform(m.inverse()); return [q.x, q.y]; }
  function rofVinkel(svg, e) { var p = rofPunkt(svg, e); return Math.atan2(p[1] - ROF_CY, p[0] - ROF_CX) * 180 / Math.PI; }
  function rofFerdig(sendTegn) { rofDrar = null; if (rofVentTegn || sendTegn) { rofVentTegn = false; tegn(); } }
  /** De andre får se kortet på vei ut: først med en gang, så høyst hvert 400 ms. */
  function rofMeld(d, naa, tving) {
    if (!tving && naa - rofSendt < 400) return;
    rofSendt = naa; gjorAlltid({ handling: 'rof-holder', t: Math.round(d.t * 100) / 100, sp: Math.round(d.sp * 100) / 100, nr: d.nr });
  }
  /* Ringen er brutt: ett trykk, så snurrer ringen av seg selv (to–fire runder), bremser og stopper på et kort. Det kortet trekkes. */
  var rofFri = null;
  function rofFriStart(boks, svg, s) {
    if (rofFri) return;
    rofFri = { boks: boks, svg: svg, nr: s.nr, fra: rofA, lengde: 720 + Math.random() * 720, t0: performance.now(), varighet: 2400 + Math.random() * 600 };
    rofDrar = { type: 'fri' };   // ringen skal ikke tegnes på nytt midt i snurringen
    spillLyd('grip');
    gjorAlltid({ handling: 'rof-holder', t: 0.01, sp: 0, nr: s.nr });   // de andre ser at det snurres
    requestAnimationFrame(rofFriSteg);
  }
  function rofFriSteg(naa) {
    var d = rofFri; if (!d) return;
    if (!tilstand || !tilstand.spill || tilstand.spill.nr !== d.nr || !d.svg.isConnected) { rofFri = null; rofFerdig(false); return; }
    var x = Math.min(1, (naa - d.t0) / d.varighet), e = 1 - Math.pow(1 - x, 3);
    rofA = d.fra + d.lengde * e;
    d.svg.querySelector('.ring-rotor').setAttribute('transform', 'rotate(' + rofA + ' ' + ROF_CX + ' ' + ROF_CY + ')');
    rofOppdaterValgt(d.boks);
    if (x < 1) return requestAnimationFrame(rofFriSteg);
    // Stopp: lås ringen med det øverste kortet rett opp, og trekk det
    var s = tilstand.spill, p = rofTopp(s.tatt || []);
    if (p >= 0) rofA = rofA + rofNorm(-(p * ROF_STEG + rofA));
    var rotor = d.svg.querySelector('.ring-rotor'); rotor.classList.add('laas'); rotor.setAttribute('transform', 'rotate(' + rofA + ' ' + ROF_CX + ' ' + ROF_CY + ')');
    rofFri = null; rofDrar = null;
    if (p >= 0) setTimeout(function () { if (tilstand && tilstand.spill && tilstand.spill.nr === d.nr) rofTrekk({ boks: d.boks, svg: d.svg, p: p, nr: d.nr }, false); }, 350);
  }
  document.addEventListener('pointerdown', function (e) {
    var boks = e.target.closest && e.target.closest('.ring-boks.aktiv'); if (!boks || !tilstand || !tilstand.spill || !tilstand.spill.ring) return;
    if (e.target.closest('.ring-over')) return;
    e.preventDefault();
    var svg = boks.querySelector('.ring-svg'), s = tilstand.spill, p = rofPunkt(svg, e), n = rofNaermest(p[0], p[1]);
    if (s.ringBrutt) { rofFriStart(boks, svg, s); return; }
    try { boks.setPointerCapture(e.pointerId); } catch (x) {}
    var kortEl = e.target.closest('.ring-k.valgt') || (n[0] < 0.12 && n[1] < 34 ? boks.querySelector('.ring-k.valgt') : null);
    if (kortEl) {
      rofDrar = { type: 'dra', boks: boks, svg: svg, el: kortEl, p: Number(kortEl.dataset.p), t: 0, sp: 0, halv: rofHalv(s), nr: s.nr, tid: performance.now() };
      kortEl.classList.add('drar');
      var h = svg.querySelector('.ring-holdt'); h.removeAttribute('visibility');
      spillLyd('grip');
      rofMeld(rofDrar, performance.now(), true);
    } else {
      rofDrar = { type: 'snurr', boks: boks, svg: svg, a0: rofA, v0: rofVinkel(svg, e) };
    }
  });
  window.addEventListener('pointermove', function (e) {
    var d = rofDrar; if (!d || d.type === 'fri') return;
    if (e.cancelable) e.preventDefault();
    if (d.type === 'snurr') {
      rofA = d.a0 + rofNorm(rofVinkel(d.svg, e) - d.v0);
      d.svg.querySelector('.ring-rotor').setAttribute('transform', 'rotate(' + rofA + ' ' + ROF_CX + ' ' + ROF_CY + ')');
      rofOppdaterValgt(d.boks);
      return;
    }
    var p = rofPunkt(d.svg, e), n = rofNaermest(p[0], p[1]), t = n[0], avstand = n[1], naa = performance.now();
    // Utenfor sporet bygger spenningen seg opp, innenfor slipper den sakte
    var over = Math.max(0, avstand - d.halv) / d.halv;
    d.sp = Math.max(0, d.sp + over * 0.14 - 0.012);
    d.t = Math.max(d.t, t);
    var sx = rofSpor(d.t), vri = Math.max(-18, Math.min(18, (p[0] - sx[0]) * 0.8));
    var h = d.svg.querySelector('.ring-holdt'); h.setAttribute('x', sx[0] - 14); h.setAttribute('y', sx[1] - 22); h.setAttribute('transform', 'rotate(' + vri.toFixed(1) + ' ' + sx[0] + ' ' + sx[1] + ')');
    var f = rofFarge(d.sp), m = d.svg.querySelector('.ring-maaler-i'); m.setAttribute('width', Math.round(244 * Math.min(1, d.sp))); m.setAttribute('fill', f);
    var bred = d.svg.querySelector('.ring-spor-bred'); if (bred) bred.setAttribute('stroke', f);
    d.boks.classList.toggle('skjelv', d.sp > 0.6);
    if (over > 0) { try { navigator.vibrate && navigator.vibrate(8); } catch (x) {} if (naa - rofKnirk > 240) { rofKnirk = naa; spillLyd('knirk'); } }
    if (d.sp >= 1) { rofTrekk(d, true); return; }
    if (d.t >= 0.97) { rofTrekk(d, false); return; }
    rofMeld(d, naa, false);
  });
  function rofSlipp() {
    var d = rofDrar; if (!d || d.type === 'fri') return;
    if (d.type === 'snurr') {
      // Lås ringen slik at det valgte kortet står rett øverst
      var s = tilstand.spill, p = rofTopp(s.tatt || []);
      if (p >= 0) rofA = rofA + rofNorm(-(p * ROF_STEG + rofA));
      var rotor = d.svg.querySelector('.ring-rotor'); rotor.classList.add('laas'); rotor.setAttribute('transform', 'rotate(' + rofA + ' ' + ROF_CX + ' ' + ROF_CY + ')');
      return rofFerdig(false);
    }
    // Slapp taket før kortet var ute: kortet glir tilbake i ringen
    d.el.classList.remove('drar'); d.boks.classList.remove('skjelv');
    d.svg.querySelector('.ring-holdt').setAttribute('visibility', 'hidden');
    d.svg.querySelector('.ring-maaler-i').setAttribute('width', 0);
    d.t = 0; d.sp = 0; rofMeld(d, performance.now(), true);
    rofFerdig(false);
  }
  window.addEventListener('pointerup', rofSlipp); window.addEventListener('pointercancel', rofSlipp);
  function rofTrekk(d, brutt) {
    rofDrar = null;
    d.boks.classList.remove('skjelv');
    if (brutt) { d.boks.classList.add('brutt'); spillLyd('knus'); }
    else { d.svg.querySelector('.ring-holdt').classList.add('ute'); spillLyd('pop'); }
    rofBruddSett = null;   // vårt eget brudd vises av knus-effekten over, ikke to ganger
    rofSkjult = -1;
    gjorAlltid({ handling: 'rof-trekk', plass: d.p, brutt: brutt, nr: d.nr });
    setTimeout(function () { rofFerdig(true); }, brutt ? 700 : 220);
  }
  root.addEventListener('click', function (e) {
    if (!e.target.closest || !e.target.closest('[data-g="rof-lukk"]')) return;
    rofSkjult = tilstand && tilstand.spill ? tilstand.spill.nr : -1; tegn();
  });
  /* ---------- Pekeleken: 3 · 2 · 1 · PEK! og fingertelling ----------
     Nedtellingen regnes fra et felles starttidspunkt (justert for klokkeavvik), så alle telefonene og
     TV-en sier «PEK!» i samme øyeblikk. Tallene bytter med en kort fjær; resten står stille. */
  var PK_PRE = /^(Hvem er mest sannsynlig til å|Who's most likely to|Who is most likely to)\s+/i;
  var PK_DUO_PRE = /^(Hvem hadde|Which two would)\s+/i;
  var PK_VRI = {
    lukk: [T('Lukk øynene og pek', 'Close your eyes and point'), T('Ingen ser hvem du peker på før alle åpner samtidig.', 'Nobody sees who you point at until everyone opens at once.')],
    flertall: [T('Pek der flertallet peker', 'Point where the majority points'), T('Ikke hvem det passer på – hvem du tror de andre velger. De som bommer, drikker én.', 'Not who it fits – who you think the others pick. Miss and you drink one.')],
    forsvar: [T('Forsvarstale', 'Defence speech'), T('Den med flest fingre får 15 sekunder. Får du én til å snu, slipper du.', 'Most fingers gets 15 seconds. Turn one person and you are off the hook.')],
    selv: [T('Pek på deg selv hvis det stemmer', 'Point at yourself if it is true'), T('Ærlighet lønner seg: del ut én.', 'Honesty pays: hand out one.')],
    dobbel: [T('Dobbel', 'Double'), T('Fingrene teller dobbelt denne runden.', 'Fingers count double this round.')],
  };
  var pkVist = '', pkTimer = null, pkSist = '';
  function pkTid(pk) { return Date.now() + klokkeAvvik - (pk.start || 0); }
  function pkTrinn(pk) { var t = pkTid(pk); return t < 0 ? 3 : t < 800 ? 3 : t < 1600 ? 2 : t < pk.tell ? 1 : 0; }
  function pkTikk() {
    clearInterval(pkTimer);
    pkTimer = setInterval(function () {
      var el = document.getElementById('pkTall'), sp = tilstand && tilstand.spill, pk = sp && sp.pek;
      if (!el || !pk || pk.fase !== 'teller') { clearInterval(pkTimer); return; }
      var trinn = pkTrinn(pk), nokkel = pk.start + ':' + trinn;
      if (nokkel !== pkSist) {
        pkSist = nokkel;
        el.textContent = trinn ? trinn : pk.duo ? T('Pek på to!', 'Point at two!') : T('Pek!', 'Point!');
        el.className = 'pk-tall' + (trinn ? '' : ' pek') + (trinn === 1 ? ' en' : '');
        void el.offsetWidth; el.classList.add('inn');
        if (trinn) spillLyd('tikk'); else { spillLyd('pek'); try { navigator.vibrate && navigator.vibrate(80); } catch (e) {} }
        var hand = document.getElementById('pkHand'); if (hand) { if (trinn) hand.setAttribute('hidden', ''); else hand.removeAttribute('hidden'); }
      }
      if (pkTid(pk) > pk.tell + 1400) { clearInterval(pkTimer); tegn(); }
    }, 60);
  }
  function pkKort(s, vri) {
    var tekst = String((s.kort && s.kort.t) || ''), duo = s.pek && s.pek.duo, m = tekst.match(duo ? PK_DUO_PRE : PK_PRE), rest = m ? tekst.slice(m[0].length) : tekst;
    var v = duo ? [T('Pek på to', 'Point at two'), T('Én hånd på hver.', 'One hand on each.')] : vri && PK_VRI[vri];
    if (duo) return '<div class="pk-kort med-vri duo"><div class="pk-vri"><b>Duo</b><span>' + esc(v[0]) + '</span></div>' +
      (m ? '<span class="pk-pre">' + esc(m[1]) + ' …</span>' : '') + '<p>' + esc(rest) + '</p><small class="pk-vri-tekst">' + esc(v[1]) + '</small></div>';
    return '<div class="pk-kort' + (v ? ' med-vri' : '') + '">' + (v ? '<div class="pk-vri"><b>' + T('Vri', 'Twist') + '</b><span>' + esc(v[0]) + '</span></div>' : '') +
      (m ? '<span class="pk-pre">' + esc(m[1]) + ' …</span>' : '') + '<p>' + esc(rest) + '</p>' + (v ? '<small class="pk-vri-tekst">' + esc(v[1]) + '</small>' : '') + '</div>';
  }
  /** «Videre» i kortlekene. I lekene dere gjør i virkeligheten får bare verten og den som har tur knappen – resten kan legge bort telefonen. */
  function videreKnapp(s, tekst) {
    if (!s.videre || s.videre.indexOf(tilstand.meg) !== -1) return '<button class="rom-stor-knapp" data-g="neste" data-pos="' + s.pos + '" type="button">' + tekst + '</button>';
    var navnene = s.videre.filter(function (id, i, a) { return a.indexOf(id) === i; }).map(function (id) { return esc(navn(id)); });
    return '<p class="nr-vent">' + navnene.join(T(' eller ', ' or ')) + T(' går videre.', ' moves on.') + '</p>';
  }
  function pkNesteLeser(pk) {
    var l = tilstand.spillere || [], i = l.findIndex(function (p) { return p.id === pk.leser; });
    return l.length ? l[(i + 1) % l.length] : null;
  }
  function pekSpill(s) {
    var pk = s.pek, vert = erVert(), jegLeser = pk.leser === tilstand.meg, kan = jegLeser || vert, alle = tilstand.spillere || [];
    var topp = '<div class="nr-topp pk-topp"><div class="nr-topp-tekst"><span>' + T('Pekeleken · kort ', 'Most likely to · card ') + (s.pos + 1) + '</span><b' + (jegLeser ? ' class="gul"' : '') + '>' +
      (jegLeser ? T('Du leser', 'You read') : esc(navn(pk.leser)) + T(' leser', ' reads')) + '</b></div></div>';
    if (pk.fase === 'klar') {
      return topp + pkKort(s, pk.vri) +
        (kan ? '<button class="rom-stor-knapp pk-start" data-g="pek-start" type="button">' + T('Tell ned – 3 · 2 · 1', 'Count down – 3 · 2 · 1') + '</button>' +
              '<p class="nr-vent">' + (jegLeser ? T('Les kortet høyt først. Alle telefonene teller ned samtidig.', 'Read the card out loud first. All the phones count down together.') : T('Du kan starte for ', 'You can start for ') + esc(navn(pk.leser)) + '.') + '</p>'
            : '<p class="nr-vent">' + esc(navn(pk.leser)) + T(' leser høyt og starter nedtellingen. Gjør deg klar til å peke.', ' reads it out and starts the countdown. Get ready to point.') + '</p>');
    }
    if (pk.fase === 'teller' && pkTid(pk) <= pk.tell + 1400) {
      var trinn = pkTrinn(pk); pkSist = pk.start + ':' + trinn; setTimeout(pkTikk, 0);
      return topp + pkKort(s, pk.vri) +
        '<div class="pk-scene" aria-live="assertive"><svg id="pkHand" class="pk-hand" viewBox="0 0 160 90" aria-hidden="true"' + (trinn ? ' hidden' : '') + '><path class="f" d="M84 40h56a10 10 0 0 1 0 20H96"/><path class="f" d="M14 34c0-6 6-10 14-10h30c10 0 16 6 26 16v34c0 6-6 10-12 10H34C22 84 14 76 14 64z"/><path class="s" d="M58 58h20M58 70h16"/></svg>' +
        '<span id="pkTall" class="pk-tall' + (trinn ? '' : ' pek') + (trinn === 1 ? ' en' : '') + '">' + (trinn || (pk.duo ? T('Pek på to!', 'Point at two!') : T('Pek!', 'Point!'))) + '</span></div>';
    }
    if (pk.fase === 'teller') {
      var mine = pk.mine, har = pk.harTalt || [], maks = Math.max(1, Math.min(6, alle.length - 1));
      var knapper = []; for (var i = 0; i <= maks; i++) knapper.push('<button type="button" data-g="pek-fingre" data-n="' + i + '" aria-pressed="' + (mine === i) + '">' + (i === maks && alle.length - 1 > maks ? i + '+' : i) + '</button>');
      var mangler = alle.length - har.length;
      return topp + pkKort(s, pk.vri) +
        '<p class="pk-sporsmal">' + (pk.vri === 'dobbel' ? T('Hvor mange pekte på deg? (Teller dobbelt)', 'How many pointed at you? (Counts double)') : T('Hvor mange pekte på deg?', 'How many pointed at you?')) + '</p>' +
        '<div class="pk-fingre" style="--n:' + (maks + 1) + '">' + knapper.join('') + '</div>' +
        (pk.vri === 'selv' ? '<button type="button" class="pk-selv" data-g="pek-selv"' + (pk.selv.indexOf(tilstand.meg) !== -1 ? ' disabled' : '') + '>' + (pk.selv.indexOf(tilstand.meg) !== -1 ? T('Ærlig – du deler ut én', 'Honest – you hand out one') : T('Jeg pekte på meg selv – del ut én', 'I pointed at myself – hand out one')) + '</button>' : '') +
        (kan && mangler > 0 ? '<button class="btn ghost small pk-videre" data-g="pek-tell-ferdig" type="button">' + T('Gå videre uten de siste', 'Move on without the rest') + '</button>' : '');
    }
    var r = pk.resultat || {}, inn = pkVist !== s.pos + ':' + pk.fase; pkVist = s.pos + ':' + pk.fase;
    var navnene = (r.topp || []).map(function (id) { return id === tilstand.meg ? T('Du', 'You') : esc(navn(id)); }).join(T(' og ', ' and '));
    if (pk.fase === 'forsvar') {
      var igjen = Math.max(0, 15 - Math.floor((Date.now() + klokkeAvvik - (pk.forsvarFra || Date.now())) / 1000));
      return topp + pkKort(s, pk.vri) +
        '<div class="pk-resultat forsvar' + (inn ? ' inn' : '') + '"><div class="pk-res-topp">' + (r.topp || []).map(function (id) { return nrPille(id); }).join('') + '<b>' + navnene + T(' – forsvar deg!', ' – defend yourself!') + '</b></div>' +
          '<span>' + T('15 sekunder. Får du én til å snu, slipper du ', '15 seconds. Turn one person and you skip ') + r.slurker + T(' slurker.', ' sips.') + '</span><i class="pk-forsvar-tid" style="--s:' + igjen + 's"></i></div>' +
        (kan ? '<div class="pk-forsvar-valg"><button type="button" data-g="pek-forsvar" data-slapp="1">' + T('Slapp unna', 'Got away') + '</button><button type="button" class="drikk" data-g="pek-forsvar" data-slapp="0">' + T('Drikk', 'Drink') + '</button></div>' : '<p class="nr-vent">' + esc(navn(pk.leser)) + T(' bestemmer.', ' decides.') + '</p>');
    }
    // Ferdig
    var ford = r.fordeling || {}, maksN = Math.max(1, r.maks || 0);
    var rader = alle.slice().sort(function (a, b) { return (ford[b.id] || 0) - (ford[a.id] || 0); }).filter(function (p) { return ford[p.id] > 0 || p.id === tilstand.meg; });
    var nesteL = pkNesteLeser(pk);
    var tittel = r.duo ? (r.topp || []).map(function (id) { return id === tilstand.meg ? T('Du', 'You') : esc(navn(id)); }).join(' & ') + T(' – skål sammen!', ' – cheers together!') : !(r.topp || []).length ? T('Ingen fikk fingre', 'Nobody got any fingers') : r.slapp ? navnene + T(' slapp unna!', ' got away!') : navnene + T(' – drikk ', ' – drink ') + r.slurker;
    return topp + pkKort(s, pk.vri) +
      '<div class="pk-resultat' + ((r.topp || []).length && !r.slapp ? ' drikk' : '') + (r.duo ? ' duo' : '') + (inn ? ' inn' : '') + '"><div class="pk-res-topp">' + (r.topp || []).map(function (id) { return nrPille(id); }).join('') + '<b>' + tittel + '</b></div>' +
        (r.duo ? '<span>' + r.topp.map(function (id) { return (id === tilstand.meg ? T('Du', 'You') : esc(navn(id))) + ' ' + r.hver[id]; }).join(' · ') + '</span>' : (r.topp || []).length ? '<span>' + r.maks + (r.maks === 1 ? T(' finger pekte', ' finger pointed') : T(' fingre pekte', ' fingers pointed')) + (pk.vri === 'dobbel' ? T(' – dobbelt opp.', ' – doubled.') : '.') + '</span>' : '') + '</div>' +
      (pk.vri === 'flertall' && (r.topp || []).length ? '<p class="pk-merk">' + T('Pekte du ikke på ', 'Didn’t point at ') + navnene + T('? Drikk én.', '? Drink one.') + '</p>' : '') +
      (rader.length ? '<ul class="pk-soyler' + (inn ? ' inn' : '') + '">' + rader.map(function (p, i) {
        var n = ford[p.id] || 0;
        return '<li style="--i:' + i + '"><span>' + (p.id === tilstand.meg ? T('Du', 'You') : esc(p.navn)) + '</span><i><b style="transform:scaleX(' + (n / maksN).toFixed(3) + ');background:' + nrFarge(p.id) + '"></b></i><em>' + n + '</em></li>'; }).join('') + '</ul>' : '') +
      videreKnapp(s, T('Neste kort', 'Next card') + (nesteL ? ' – ' + (nesteL.id === tilstand.meg ? T('du leser', 'you read') : esc(nesteL.navn) + T(' leser', ' reads')) : ''));
  }

  function kortSpill(s) {
    // Ringen er tom: siste kort vises først, og når det er lagt bort kommer «Hva nå?»
    if (s.ring && s.ferdig && rofSkjult === s.nr) return rofSlutt(s);
    if (s.ring) return rofSpill(s);
    if (s.ferdig) return s.lek === 'jeg-har-aldri' ? aldriFerdig(s) : s.lek === 'ring-of-fire' ? rofSlutt(s) : kortFerdig(s);
    if (s.ee) return eeSpill(s);
    if (s.rr) return rrSpill(s);
    if (s.ns) return nsSpill(s);
    if (s.kb) return kbSpill(s);
    if (s.lb) return lbSpill(s);
    if (s.pek && s.pek.fase !== 'hendelse') return pekSpill(s) + pekBenk(s);
    if (s.aldri) return aldriSpill(s) + aldriBryter(s);
    var k = s.kort || {};
    if (k.id) merkSett(s.lek, k.id);
    var rof = s.lek === 'ring-of-fire';
    var kortHtml = rof
      ? '<div class="rof-kort rom-rof' + (k.rod ? ' rod' : '') + '"><div class="rof-hj"><b>' + esc(k.v) + '</b><span>' + esc(k.s) + '</span></div>' +
        '<div class="rof-midt"><b class="rof-regel">' + esc(k.regel) + '</b><span class="rof-tekst">' + esc(k.tekst) + '</span></div>' +
        '<div class="rof-hj rof-hj2"><b>' + esc(k.v) + '</b><span>' + esc(k.s) + '</span></div></div>'
      : '<div class="rom-kort' + (k.h ? ' hendelse' : '') + '">' + (k.k ? '<span class="sw-tag">' + esc(k.k) + '</span>' : '<span></span>') + '<p>' + esc(k.t) + '</p><span class="rom-teller">' + (s.pos + 1) + ' / ' + s.antall + '</span></div>';
    return (rof && k.hvem ? '<div class="rof-tur"><span>' + T('Trekker', 'Drawing') + '</span><b>' + esc(k.hvem) + '</b></div>' : '') +
      (rof ? '<p class="rom-status">' + (s.antall - s.pos - 1) + T(' kort igjen · ', ' cards left · ') + (s.konger || 0) + T(' konger', ' kings') + '</p>' : '') +
      kortHtml + lunte((s.antall - s.pos - 1) / Math.max(1, s.antall)) + (rof ? makkerHtml(s) : '') +
      videreKnapp(s, T('Neste kort', 'Next card')) + aldriBryter(s);
  }

  /* ---------- Alle svarer (Jeg har aldri): hver telefon svarer i hemmelighet, så vises det samtidig ----------
     Bevegelse bare når noe skjer: et nytt svar fyller én prikk, avsløringen toner inn én gang.
     Klassene settes bare ved endring, ellers ville hver ny tegning spilt dem på nytt. */
  var aldriAvslort = '', aldriSvartFor = { nokkel: '', svart: null };
  var JA_PRE = /^(Jeg har aldri|Never have I ever)\s+/i;
  function slurkOrd(n) { return tilstand && tilstand.alkoholfri ? T('straffepoeng', n === 1 ? 'penalty point' : 'penalty points') : (n === 1 ? T('slurk', 'sip') : T('slurker', 'sips')); }
  function initialer(p) { return p.id === tilstand.meg ? T('Du', 'You') : String(p.navn || '?').slice(0, 2); }
  function aldriBryter(s) {
    if (!erVert() || !s.kanSvar || s.ferdig) return '';
    return '<p class="aldri-bryter"><button class="linkbtn" data-g="aldri-modus" data-paa="' + (s.svarPaa ? '0' : '1') + '" type="button">' +
      (s.svarPaa ? T('Bare trekk kort, uten svar', 'Just draw cards, no answers') : T('La alle svare på telefonen', 'Let everyone answer on their phone')) + '</button></p>';
  }
  function jaTopp(tekst, chip, gul, klokke) {
    return '<div class="nr-topp ja-topp"><div class="nr-topp-tekst"><span>' + tekst + '</span><b' + (gul ? ' class="gul"' : '') + '>' + chip + '</b></div>' + (klokke ? nrKlokke() : '') + '</div>';
  }
  function jaNr(s) { return T('Jeg har aldri · kort ', 'Never have I ever · card ') + (s.pos + 1) + T(' av ', ' of ') + s.antall; }
  /** Kortet uten «Jeg har aldri» foran – det står over teksten i stedet, så selve påstanden blir stor. */
  function jaKort(s, liten) {
    var k = s.kort || {}, tekst = String(k.t || ''), m = tekst.match(JA_PRE), rest = m ? tekst.slice(m[0].length) : tekst;
    return '<div class="pk-kort ja-kort' + (liten ? ' liten' : '') + '">' + (k.k ? '<span class="ja-tag">' + esc(k.k) + '</span>' : '') +
      '<span class="pk-pre">' + (m ? esc(m[1]) : T('Jeg har aldri', 'Never have I ever')) + ' …</span><p>' + esc(rest) + '</p></div>';
  }
  /** Et stort hode i stedet for initialer (søkelys og vinnere). */
  function hodeMerke(id, uttrykk) { var p = (tilstand.spillere || []).find(function (x) { return x.id === id; }) || { id: id }; return '<span class="hode-merke">' + eeHode(p, uttrykk) + '</span>'; }
  function jaNavn(id) { return id === tilstand.meg ? T('Du', 'You') : esc(navn(id)); }
  /* ---------- Jeg har aldri: svar i hemmelighet, så snus ett kort per person ----------
     Bevegelse bare når noe skjer: et nytt svar spretter inn i raden, kortene snus ett om gangen når alle har svart,
     og den ensomme ulven får søkelyset. Klassen «inn» settes bare første gang, ellers ville hver tegning spilt det på nytt. */
  /** Benken etter avsløringen i Jeg har aldri: «Har gjort det» til venstre, «Aldri» til høyre. fokus får «OI»-fjeset og alles blikk. */
  function jaBenk(alle, har, fokus) {
    return hodeBenk(alle, { oppe: true, sider: { a: har, b: alle.filter(function (p) { return har.indexOf(p.id) === -1; }).map(function (p) { return p.id; }), la: T('Har gjort det', 'Has done it'), lb: T('Aldri', 'Never'), fa: 'var(--oransje)', fb: 'var(--card)' },
      oi: fokus ? [fokus] : [], stirr: fokus || '', flat: true });
  }
  function aldriSpill(s) {
    var t = tilstand, a = s.aldri, k = s.kort || {}, alle = t.spillere || [], nokkel = s.pos + ':' + s.antall;
    if (k.id) merkSett(s.lek, k.id);
    if (a.fase === 'avslort') {
      var inn = aldriAvslort !== nokkel; aldriAvslort = nokkel;
      var har = a.har || [], n = alle.length, sist = s.pos + 1 >= s.antall;
      var videre = videreKnapp(s, (sist ? T('Til oppsummeringen', 'To the recap') : T('Neste kort', 'Next card')));
      if (a.ulv) {
        var jeg = a.ulv === t.meg, kan = jeg || erVert();
        return jaTopp(jaNr(s), T('Snudd!', 'Flipped!'), true) + jaKort(s, true) +
          '<div class="ja-ulv' + (inn ? ' inn' : '') + '"><span class="ja-ulv-etikett">' + T('Bare én har gjort det', 'Only one has done it') + '</span>' + hodeMerke(a.ulv, 'oi') +
            '<b class="ja-ulv-navn">' + jaNavn(a.ulv) + '</b><span class="ja-ulv-be">' + T('Fortell historien!', 'Tell the story!') + '</span>' +
            '<p>' + (a.nektet ? (jeg ? T('Du nektet. Fire ', 'You refused. Four ') : esc(navn(a.ulv)) + T(' nektet. Fire ', ' refused. Four ')) + slurkOrd(4) + '.'
              : (jeg ? T('Du drikker to. Nekter du å fortelle, blir det fire.', 'You drink two. Refuse to tell and it’s four.') : esc(navn(a.ulv)) + T(' drikker to. Nekter hen å fortelle, blir det fire.', ' drinks two. Refuse to tell and it’s four.'))) + '</p>' +
            (kan && !a.nektet ? '<button type="button" class="ja-nekt" data-g="aldri-nekt">' + (jeg ? T('Jeg nekter (+2)', 'I refuse (+2)') : T('Nekter å fortelle (+2)', 'Refuses to tell (+2)')) + '</button>' : '') + '</div>' +
          videre + jaBenk(alle, har, a.ulv);
      }
      var dom;
      if (!har.length) dom = '<b>' + T('Ingen har gjort det.', 'Nobody has.') + '</b> ' + T('Et uskyldig rom.', 'What an innocent room.') +
        (a.kjedelig ? ' ' + (a.kjedelig === t.meg ? T('Du trakk kortet og drikker én for å ha valgt et kjedelig kort.', 'You drew it, so you drink one for picking a boring card.') : esc(navn(a.kjedelig)) + T(' trakk kortet og drikker én for å ha valgt et kjedelig kort.', ' drew it and drinks one for picking a boring card.')) : '');
      else if (har.length === n && n > 1) dom = '<b>' + T('Alle har gjort det.', 'Everyone has.') + '</b> ' + T('Skål – dere er like ille alle sammen.', 'Cheers – you’re all as bad as each other.');
      else dom = '<b>' + har.length + T(' av ', ' of ') + n + T(' har gjort det', ' have done it') + '</b> – ' + (har.indexOf(t.meg) !== -1 ? T('dere drikker én.', 'you drink one.') : T('de drikker én.', 'they drink one.'));
      return jaTopp(jaNr(s), T('Snudd!', 'Flipped!'), true) + jaKort(s, true) +
        '<p class="ja-dom' + (inn ? ' inn' : '') + '" style="--n:0">' + dom + '</p>' +
        (a.mest ? '<p class="ja-mest">' + esc(navn(a.mest.id)) + T(' har gjort det ', ' has done it ') + a.mest.n + T(' ganger i kveld. Mest av alle.', ' times tonight. More than anyone.') + '</p>' : '') +
        videre + jaBenk(alle, har, a.kjedelig);
    }
    // Svarrunden: hvem som har svart (ikke hva). Et nytt svar spretter inn i raden.
    if (aldriSvartFor.nokkel !== nokkel) aldriSvartFor = { nokkel: nokkel, svart: null };
    var forrige = aldriSvartFor.svart, svart = a.harSvart || [], naa = {};
    var folk = alle.map(function (p) {
      var h = svart.indexOf(p.id) !== -1; if (h) naa[p.id] = 1;
      return nrPille(p.id, (h ? 'svart' : 'mangler') + (h && forrige && !forrige[p.id] ? ' ny' : ''));
    }).join('');
    aldriSvartFor.svart = naa;
    var mangler = alle.filter(function (p) { return !naa[p.id]; });
    var hint = !a.mitt ? T('Ingen ser hva du svarer før alle har svart.', 'Nobody sees your answer until everyone has answered.')
      : mangler.length ? T('Venter på ', 'Waiting for ') + mangler.slice(0, 3).map(function (p) { return esc(p.navn); }).join(', ') + (mangler.length > 3 ? T(' og ', ' and ') + (mangler.length - 3) + T(' til', ' more') : '') + T('. Du kan bytte svar så lenge.', '. You can still change your answer.') : '';
    return jaTopp(jaNr(s), T('Svar i hemmelighet', 'Answer in secret'), false, true) + jaKort(s) +
      '<div class="aldri-valg ja-valg"><button type="button" class="aldri-har" data-g="aldri-svar" data-v="har" aria-pressed="' + (a.mitt === 'har') + '"><b>' + T('Jeg har', 'I have') + '</b><small>' + T('og drikker', 'and drink') + '</small></button>' +
        '<button type="button" class="aldri-aldri" data-g="aldri-svar" data-v="aldri" aria-pressed="' + (a.mitt === 'aldri') + '"><b>' + T('Aldri', 'Never') + '</b><small>' + T('går fri', 'off the hook') + '</small></button></div>' +
      (hint ? '<p class="nr-vent">' + hint + '</p>' : '') +
      (erVert() && svart.length ? '<p class="ja-vis"><button type="button" class="linkbtn" data-g="avslor">' + T('Vis svarene nå', 'Show the answers now') + '</button></p>' : '') +
      hodeBenk(alle, { oppe: svart, status: svart.length + T(' av ', ' of ') + alle.length + T(' har svart', ' answered') });
  }
  /** Ring of Fire når kortene er brukt opp: hvordan det gikk med ringen, og så ny ring eller noe annet. */
  function rofSlutt(s) {
    var b = s.brudd;
    var midt = '<div class="pk-kort sd-ferdig"><b>' + (s.konger || 0) + '/4</b><p>' + T('konger. ', 'kings. ') +
      (s.ring ? (s.ringBrutt && b ? esc(b.navn || '') + T(' brøt ringen.', ' broke the ring.') : T('Ringen holdt hele veien!', 'The ring held all the way!')) : T('Alle kortene er trukket.', 'Every card has been drawn.')) + '</p></div>';
    return jaTopp('Ring of Fire · 52 ' + T('kort', 'cards'), s.ring ? T('Ringen er tom', 'The ring is empty') : T('Kortene er brukt opp', 'The cards are used up'), true) + midt +
      lekSlutt([['kort-igjen', s.ring ? T('Ny ring', 'New ring') : T('Ny kortstokk', 'New deck'), T('Alle 52 kortene ut igjen', 'All 52 cards out again')]]);
  }
  /* ---------- Enten eller: velg side i hemmelighet, så ser alle hvem som valgte hva ----------
     Hodene står med skuldrene nederst i ruta. Før du har valgt stikker bare toppen av hodet opp; når du velger,
     reiser hodet seg (fjær). Øynene kikker på hverandre (eeTikk flytter pupillene, uten å tegne på nytt).
     Når klokka er ute glir hodene til hver sin side. Er én alene, stirrer alle på hen – og hen får «OI»-fjeset. */
  var eeVist = '', eeTimer = null, eeVelgMed = false;
  function eeHode(p, uttrykk) { return '<svg class="mv-hode" viewBox="-30 -42 60 92" aria-hidden="true">' + hodeHtml(utseende(p.figur || p.id, p.pynt), uttrykk) + '</svg>'; }
  /** Plassen til hvert hode: på rekke, eller samlet på hver sin side (Enten til venstre, Eller til høyre). */
  function eePlasser(alle, r) {
    var n = alle.length, ut = {};
    if (!r) { alle.forEach(function (p, i) { ut[p.id] = n === 1 ? 50 : (i / (n - 1)) * 100; }); return ut; }
    var a = alle.filter(function (p) { return (r.a || []).indexOf(p.id) !== -1; }), b = alle.filter(function (p) { return (r.b || []).indexOf(p.id) !== -1; });
    var rest = alle.filter(function (p) { return a.indexOf(p) === -1 && b.indexOf(p) === -1; });
    var side = function (liste, fra, til) { liste.forEach(function (p, i) { ut[p.id] = liste.length === 1 ? (fra + til) / 2 : fra + (i / (liste.length - 1)) * (til - fra); }); };
    side(a, 0, 38); side(b, 62, 100); side(rest, 46, 54);
    return ut;
  }
  /* ---------- Benken: de søte hodene nederst, brukt i alle leker der folk svarer eller stemmer ----------
     o.oppe: ider som har reist seg (eller true for alle) · o.sider: { a, b, la, lb, fa, fb } – del benken i to
     o.oi: ider med «OI»-fjes · o.stirr: id alle stirrer på · o.flat: de andre får en flau munn når noen får «OI»
     o.merk: ider med ekstra ring rundt navnet (f.eks. «helt sikker») · o.status: liten tekst øverst til venstre */
  function hodeBenk(alle, o) {
    o = o || {}; var r = o.sider || null, n = alle.length, oi = o.oi || [];
    if (!n) return '';
    var w = o.par || o.duo ? (n <= 4 ? 78 : n <= 6 ? 62 : 48) : r ? (n <= 4 ? 84 : n <= 7 ? 64 : 50) : (n <= 5 ? 96 : n <= 8 ? 72 : 56), plass = o.par ? rrPlasser(alle, o.par) : o.duo ? duoPlasser(alle, o.duo) : o.stol && r ? stolSider(alle, o.stol, r) : o.stol ? stolPlasser(alle, o.stol) : eePlasser(alle, r);
    var stil = '--w:' + w + 'px' + (r && r.fa ? ';--fa:' + r.fa : '') + (r && r.fb ? ';--fb:' + r.fb : '');
    setTimeout(benkTikk, 0);
    var bombe = o.bombe && plass[o.bombe.id] != null ? kbBombe(plass[o.bombe.id], o.bombe) : '';
    return '<div class="ee-benk' + (r ? ' delt' : '') + (o.par ? ' rygg' + (o.par.snudd ? ' snudd' : '') : '') + (o.stol ? ' stolen' : '') + (o.duo ? ' duo' : '') + (o.takt ? ' takt' : '') + '" data-stirr="' + (o.stirr || '') + '" style="' + stil + '">' +
      (r ? '<i class="ee-midt"></i>' + (r.la ? '<span class="ee-sidenavn a">' + esc(r.la) + '</span><span class="ee-sidenavn b">' + esc(r.lb) + '</span>' : '') : '') +
      (o.status && !r ? '<span class="ee-status">' + esc(o.status) + '</span>' : '') + bombe + (o.duo ? '<i class="duo-hjerte' + (o.duoInn ? ' inn' : '') + '"><svg viewBox="-20 -18 40 36" aria-hidden="true"><path d="M0 14C-22 0 -16 -16 -6 -14C-2 -13 0 -9 0 -7C0 -9 2 -13 6 -14C16 -16 22 0 0 14Z" fill="#FF9CC2" stroke="#16120F" stroke-width="3" stroke-linejoin="round"/></svg></i>' : '') +
      alle.map(function (p, i) {
        var oppe = o.oppe === true || (o.oppe || []).indexOf(p.id) !== -1 || p.id === o.stol, erOi = oi.indexOf(p.id) !== -1;
        var uttrykk = erOi ? 'oi' : o.uttrykk && o.uttrykk[p.id] ? o.uttrykk[p.id] : o.flat && oi.length ? 'flat' : 'vanlig';
        var parKl = o.par ? (p.id === o.par.a ? ' par-a' : p.id === o.par.b ? ' par-b' : '') : p.id === o.stol ? ' stol' : o.bombe && p.id === o.bombe.id ? ' holder' : o.duo ? (p.id === o.duo[0] ? ' duo-a' : p.id === o.duo[1] ? ' duo-b' : '') : o.gul === p.id ? ' holder' : '';
        var tall = o.tall && o.tall[p.id] ? '<b class="ee-tall' + (o.tallInn ? ' inn' : '') + '">' + o.tall[p.id] + '</b>' : '';
        return '<div class="ee-hode' + (erOi ? ' alene' : '') + parKl + '" data-id="' + p.id + '" style="--x:' + (plass[p.id] / 100).toFixed(3) + ';--i:' + i + '"><div class="ee-hev' + (oppe ? ' oppe' : '') + '">' + tall +
          '<span class="ee-navn' + (oppe ? ' har' : '') + ((o.merk || []).indexOf(p.id) !== -1 ? ' sikker' : '') + '">' + esc(p.id === tilstand.meg ? T('Du', 'You') : p.navn) + '</span>' + lhHodeEkstra(eeHode(p, uttrykk), p, o) + '</div></div>'; }).join('') + '</div>';
  }
  /** Rygg mot rygg: paret i midten, de andre fordelt på hver side. Snudd: paret rykker litt nærmere. */
  function rrPlasser(alle, par) {
    var ut = {}, andre = alle.filter(function (p) { return p.id !== par.a && p.id !== par.b; }), v = Math.ceil(andre.length / 2);
    ut[par.a] = par.snudd ? 39 : 35; ut[par.b] = par.snudd ? 61 : 65;
    andre.forEach(function (p, i) {
      var venstre = i < v, k = venstre ? i : i - v, m = venstre ? v : andre.length - v;
      var fra = venstre ? 0 : 82, til = venstre ? 18 : 100;
      ut[p.id] = m === 1 ? (venstre ? fra : til) : fra + (k / (m - 1)) * (til - fra);
    });
    return ut;
  }
  /** Nødt eller sannhet: den i stolen står i midten, de andre fordelt på hver side. */
  function stolPlasser(alle, stol) {
    var ut = {}, andre = alle.filter(function (p) { return p.id !== stol; }), v = Math.ceil(andre.length / 2);
    ut[stol] = 50;
    andre.forEach(function (p, i) {
      var venstre = i < v, k = venstre ? i : i - v, m = venstre ? v : andre.length - v;
      var fra = venstre ? 0 : 80, til = venstre ? 20 : 100;
      ut[p.id] = m === 1 ? (venstre ? 6 : 94) : fra + (k / (m - 1)) * (til - fra);
    });
    return ut;
  }
  var pkDuoVist = '';
  /** Duoen midt på benken, side om side; de andre fordelt ut mot kantene. */
  function duoPlasser(alle, duo) {
    var ut = {}, andre = alle.filter(function (p) { return duo.indexOf(p.id) === -1; }), v = Math.ceil(andre.length / 2);
    ut[duo[0]] = 36; ut[duo[1]] = 64;
    andre.forEach(function (p, i) {
      var venstre = i < v, k = venstre ? i : i - v, m = venstre ? v : andre.length - v;
      var fra = venstre ? 0 : 80, til = venstre ? 20 : 100;
      ut[p.id] = m === 1 ? (venstre ? 6 : 94) : fra + (k / (m - 1)) * (til - fra);
    });
    return ut;
  }
  /** Benken tegnes på nytt hver gang: hoder som har flyttet seg, glir fra der de var (FLIP med fjær, bare transform). */
  function benkRekter() {
    var ut = {}; root.querySelectorAll('.ee-benk .ee-hode').forEach(function (h) { ut[h.dataset.id] = h.getBoundingClientRect().left; }); return ut;
  }
  function benkGli(fra) {
    if (roligBevegelse()) return;
    root.querySelectorAll('.ee-benk .ee-hode').forEach(function (h) {
      var x = fra[h.dataset.id]; if (x == null || !h.animate) return;
      var dx = x - h.getBoundingClientRect().left; if (Math.abs(dx) < 2) return;
      h.animate([{ transform: 'translateX(' + dx + 'px)' }, { transform: 'none' }], { duration: 620, easing: KB_FJAER });
    });
  }
  function eeBenk(s, e, alle, r) {
    return hodeBenk(alle, r ? { oppe: true, sider: { a: r.a, b: r.b }, oi: r.alene ? [r.alene] : [], stirr: r.alene, flat: true } : { oppe: e.harSvart || [] });
  }
  /** Øynene: hvert 1,4 s ser hvert hode på et annet (oftest naboen). Står noen i fokus, stirrer alle på hen. */
  var benkTimer = null;
  function benkTikk() {
    clearInterval(benkTimer);
    var se = function () {
      var benk = document.querySelector('.ee-benk');
      if (!benk) { clearInterval(benkTimer); return; }
      var hoder = Array.prototype.slice.call(benk.querySelectorAll('.ee-hode')), stirr = benk.dataset.stirr;
      var x = function (h) { return parseFloat(h.style.getPropertyValue('--x')) || 0; };
      var mal = stirr ? hoder.find(function (o) { return o.dataset.id === stirr; }) : null;
      var snudd = benk.classList.contains('snudd');
      hoder.forEach(function (h, i) {
        var pup = h.querySelector('.mv-pup'); if (!pup) return;
        var dx = 0, dy = -0.5;
        // Rygg mot rygg: paret ser utover (bort fra hverandre), og mot hverandre når de har snudd seg
        if (h.classList.contains('par-a')) { dx = snudd ? 3 : -3.2; dy = 0.4; }
        else if (h.classList.contains('par-b')) { dx = snudd ? -3 : 3.2; dy = 0.4; }
        else if (h.classList.contains('alene')) { dy = 2.4; }
        else if (mal) { dx = Math.max(-3.2, Math.min(3.2, (x(mal) - x(h)) * 8)); dy = 0.4; }
        else if (Math.random() > 0.18 && hoder.length > 1) {
          var j = i + (Math.random() < 0.5 ? -1 : 1); if (j < 0 || j >= hoder.length || Math.random() < 0.3) j = Math.floor(Math.random() * hoder.length);
          if (j !== i) { dx = Math.max(-3, Math.min(3, (x(hoder[j]) - x(h)) * 8)); dy = 0.6; }
        }
        pup.style.transform = 'translate(' + dx.toFixed(2) + 'px,' + dy.toFixed(2) + 'px)';
      });
    };
    se(); benkTimer = setInterval(se, 1400);
  }
  function eeTikk() { benkTikk(); }
  /** Benken i Pekeleken: reiser seg når de har talt fingre, og etterpå stirrer alle på den som fikk flest. */
  function pekBenk(s) {
    var pk = s.pek, alle = tilstand.spillere || []; if (!pk) return '';
    if (pk.fase === 'teller' && pkTid(pk) > pk.tell + 1400) { var har = pk.harTalt || []; return hodeBenk(alle, { oppe: har, status: har.length + T(' av ', ' of ') + alle.length + T(' har talt', ' counted') }); }
    if ((pk.fase === 'ferdig' || pk.fase === 'forsvar') && pk.resultat) {
      if (pk.resultat.duo) { var dk = s.pos + ':' + pk.resultat.topp.join(), dInn = pkDuoVist !== dk; pkDuoVist = dk; return hodeBenk(alle, { oppe: true, duo: pk.resultat.topp, duoInn: dInn }); }
      var topp = pk.resultat.slapp ? [] : pk.resultat.topp || [];
      if (pk.fase === 'forsvar') topp = pk.resultat.topp || [];
      return hodeBenk(alle, { oppe: true, oi: topp, stirr: topp.length === 1 ? topp[0] : '', flat: true });
    }
    return '';
  }
  /** Benken i Løgnhalsen: den som forteller sitter i stolen midt på, og alle stirrer på hen. Mens de stemmer, svetter hen.
      Avsløringen: løy hen, vokser nesa. De andre går til hver sin side, og de som ble lurt får «OI». */
  var lhBenkVist = '';
  function lhBenk(s) {
    var alle = tilstand.spillere || [], a = s.aktiv, ant = alle.length - 1;
    if (!alle.some(function (p) { return p.id === a; })) return '';
    if (s.fase === 'svar') return hodeBenk(alle, { oppe: [a], stol: a, stirr: a, nese: a });
    if (s.fase === 'stem') {
      var har = s.harStemt || [], u = {}; u[a] = 'flat';
      return hodeBenk(alle, { oppe: har, stol: a, stirr: a, nese: a, svett: a, uttrykk: u, status: har.length + T(' av ', ' of ') + ant + T(' har stemt', ' voted') });
    }
    if (s.fase !== 'avslort' || !s.resultat) return '';
    var r = s.resultat, st = r.stemmer || {}, sk = r.sikker || {}, lyv = r.svar === 'lyv', k = a + ':' + s.runde, inn = lhBenkVist !== k; lhBenkVist = k;
    var ider = function (svar) { return alle.filter(function (p) { return p.id !== a && st[p.id] === svar; }).map(function (p) { return p.id; }); };
    var sant = ider('sannhet'), logn = ider('lyv');
    return hodeBenk(alle, { oppe: true, stol: a, stirr: a, nese: a, neseLang: lyv, neseInn: inn,
      sider: { a: sant, b: logn, la: T('Trodde sant', 'Believed it'), lb: T('Trodde løgn', 'Called the lie'), fa: 'var(--mint)', fb: 'var(--rosa)' },
      oi: lyv ? sant : logn, merk: alle.filter(function (p) { return sk[p.id]; }).map(function (p) { return p.id; }) });
  }
  /** Løgnhalsen: nese (vokser når fortelleren løy) og svettedråper, lagt oppå hodet. */
  function lhHodeEkstra(svg, p, o) {
    var x = '';
    if (o.nese === p.id) x += '<g class="lh-nese' + (o.neseLang ? (o.neseInn ? ' vokser' : ' lang') : '') + '"><rect x="-3" y="8" width="40" height="7" rx="3.5" fill="' + utseende(p.figur || p.id, p.pynt).hud + '" stroke="#16120F" stroke-width="2.5" vector-effect="non-scaling-stroke"/></g>';
    if (o.svett === p.id) x += '<g class="lh-svette"><path d="M17 -16q3 5 0 7q-3-2 0-7z"/><path d="M-19 -10q3 5 0 7q-3-2 0-7z"/></g>';
    return x ? svg.replace('</svg>', x + '</svg>') : svg;
  }
  /** Stolen i midten og benken delt i to: hver side samler seg ytterst, de som ikke har stemt står nærmere stolen. */
  function stolSider(alle, stol, r) {
    var ut = {}; ut[stol] = 50;
    var side = function (l, fra, til, en) { l.forEach(function (id, i) { ut[id] = l.length === 1 ? en : fra + (i / (l.length - 1)) * (til - fra); }); };
    var a = alle.filter(function (p) { return p.id !== stol && (r.a || []).indexOf(p.id) !== -1; }).map(function (p) { return p.id; });
    var b = alle.filter(function (p) { return p.id !== stol && (r.b || []).indexOf(p.id) !== -1; }).map(function (p) { return p.id; });
    var rest = alle.filter(function (p) { return p.id !== stol && a.indexOf(p.id) === -1 && b.indexOf(p.id) === -1; });
    side(a, 0, 24, 6); side(b, 76, 100, 94);
    rest.forEach(function (p, i) { ut[p.id] = i % 2 ? 70 : 30; });
    return ut;
  }
  /** Benken i Nyhetsrunden: hodene reiser seg når de har svart. */
  function nrBenk(s) {
    if (s.fase !== 'spm') return '';
    var alle = tilstand.spillere || [], har = s.harSvart || [];
    return hodeBenk(alle, { oppe: har, status: har.length + T(' av ', ' of ') + alle.length + T(' har svart', ' answered') });
  }
  function eeSpill(s) {
    var t = tilstand, e = s.ee, alle = t.spillere || [], r = e.resultat, nokkel = s.pos + ':' + s.antall + ':' + e.fase;
    var inn = eeVist !== nokkel; if (inn) { eeVist = nokkel; eeVelgMed = false; }
    setTimeout(eeTikk, 0);
    var topp = jaTopp(T('Enten eller · kort ', 'Would you rather · card ') + (s.pos + 1) + T(' av ', ' of ') + s.antall,
      e.fase === 'svar' ? T('Velg side', 'Pick a side') : e.fase === 'forsvar' ? T('Én alene!', 'One alone!') : T('Snudd!', 'Flipped!'), e.fase !== 'svar', e.fase === 'svar');
    if (e.fase === 'svar') {
      var svart = e.harSvart || [], mangler = alle.filter(function (p) { return svart.indexOf(p.id) === -1; });
      return topp + '<div class="ee-valg' + (inn ? ' inn' : '') + '">' +
        '<button type="button" class="ee-knapp a" data-g="ee-velg" data-v="a" aria-pressed="' + (e.mitt === 'a') + '"><span>' + T('Enten', 'Either') + '</span><b>' + esc(e.a) + '</b></button>' +
        '<i class="ee-eller">' + T('eller', 'or') + '</i>' +
        '<button type="button" class="ee-knapp b" data-g="ee-velg" data-v="b" aria-pressed="' + (e.mitt === 'b') + '"><span>' + T('Eller', 'Or') + '</span><b>' + esc(e.b) + '</b></button></div>' +
        '<p class="nr-vent">' + (e.mitt ? (mangler.length ? T('Valgt. Ingen ser noe før klokka er ute – du kan bytte så lenge.', 'Picked. Nobody sees anything until the clock runs out – you can still change.') : T('Alle har valgt. Snus om et øyeblikk …', 'Everyone has picked. Flipping in a moment …'))
          : T('Velg, så reiser hodet ditt seg. Ingen ser hva du velger før klokka er ute. Mindretallet drikker.', 'Pick, and your head rises. Nobody sees your pick until the clock runs out. The minority drinks.')) + '</p>' +
        (erVert() && svart.length && mangler.length ? '<p class="ja-vis"><button type="button" class="linkbtn" data-g="avslor">' + T('Snu nå', 'Flip now') + '</button></p>' : '') +
        eeBenk(s, e, alle, null);
    }
    var sist = s.pos + 1 >= s.antall, videre = videreKnapp(s, (sist ? T('Til oppsummeringen', 'To the recap') : T('Neste kort', 'Next card')));
    var navnA = function (id) { return id === t.meg ? T('Du', 'You') : esc(navn(id)); };
    var sider = '<div class="ee-sider' + (inn ? ' inn' : '') + '"><div class="ee-side a"><span>' + T('Enten', 'Either') + ' · ' + r.a.length + '</span><b>' + esc(e.a) + '</b><div>' + r.a.map(function (id) { return nrPille(id); }).join('') + '</div></div>' +
      '<div class="ee-side b"><span>' + T('Eller', 'Or') + ' · ' + r.b.length + '</span><b>' + esc(e.b) + '</b><div>' + r.b.map(function (id) { return nrPille(id); }).join('') + '</div></div></div>';
    if (e.fase === 'forsvar') {
      var jeg = r.alene === t.meg, kan = jeg || erVert(), igjen = Math.max(0, e.forsvar - Math.floor((Date.now() + klokkeAvvik - (e.forsvarFra || Date.now())) / 1000));
      var andre = alle.filter(function (p) { return p.id !== r.alene; });
      var valgA = r.a.indexOf(r.alene) !== -1;
      return topp + sider +
        '<div class="ja-ulv ee-alene' + (inn ? ' inn' : '') + '"><span class="ja-ulv-etikett">' + T('Alene om ', 'Alone on ') + '«' + esc(valgA ? e.a : e.b) + '»</span>' +
          '<b class="ja-ulv-navn">' + navnA(r.alene) + '</b><span class="ja-ulv-be">' + (jeg ? T('Forsvar valget ditt!', 'Defend your pick!') : T('Forsvar valget!', 'Defend the pick!')) + '</span>' +
          '<p>' + T('20 sekunder. Får ', '20 seconds. If ') + (jeg ? T('du', 'you') : esc(navn(r.alene))) + T(' med seg én, drikker den personen. Ellers ', ' wins one person over, that person drinks. Otherwise ') + (jeg ? T('drikker du to.', 'you drink two.') : T('drikker hen to.', 'they drink two.')) + '</p>' +
          '<i class="pk-forsvar-tid" style="--s:' + igjen + 's"></i></div>' +
        (kan ? (eeVelgMed
          ? '<p class="nr-etikett">' + T('Hvem byttet side?', 'Who switched?') + '</p><div class="ee-med">' + andre.map(function (p) { return '<button type="button" data-g="ee-forsvar" data-med="' + p.id + '">' + nrPille(p.id) + '<span>' + esc(p.navn) + '</span></button>'; }).join('') + '</div>'
          : '<div class="pk-forsvar-valg"><button type="button" data-g="ee-med">' + T('Fikk med én', 'Won one over') + '</button><button type="button" class="drikk" data-g="ee-forsvar">' + T('Drikk to', 'Drink two') + '</button></div>')
          : '<p class="nr-vent">' + esc(navn(r.alene)) + T(' (eller verten) trykker når talen er holdt.', ' (or the host) taps once the speech is done.') + '</p>') +
        eeBenk(s, e, alle, r);
    }
    // Avslørt
    var dom;
    if (r.uavgjort) dom = '<b>' + T('Uavgjort!', 'A tie!') + '</b> ' + T('Skål, alle sammen.', 'Cheers, everyone.');
    else if (r.kjedelig) dom = '<b>' + T('Enstemmig.', 'Unanimous.') + '</b> ' + T('For lett kort – ', 'Too easy a card – ') + navnA(r.kjedelig) + T(' trakk det og drikker én.', ' drew it and drinks one.');
    else if (r.alene) dom = r.med ? '<b>' + navnA(r.alene) + T(' fikk med seg ', ' won over ') + navnA(r.med) + '.</b> ' + navnA(r.med) + T(' drikker én.', ' drinks one.') : '<b>' + navnA(r.alene) + T(' sto alene.', ' stood alone.') + '</b> ' + T('Drikker to.', 'Drinks two.');
    else if (r.mindretall.length) dom = '<b>' + r.mindretall.map(navnA).join(T(' og ', ' and ')) + T(' er i mindretall.', r.mindretall.length === 1 ? ' is in the minority.' : ' are in the minority.') + '</b> ' + T('Én slurk hver.', 'One sip each.');
    else dom = T('Ingen valgte. Et stille rom.', 'Nobody picked. A quiet room.');
    return topp + sider + '<p class="ja-dom' + (inn ? ' inn' : '') + '" style="--n:0">' + dom + '</p>' + videre + eeBenk(s, e, alle, r);
  }
  /* ---------- Rygg mot rygg: to peker i hemmelighet, alle andre gjetter ----------
     Paret står i midten av benken og lener seg fra hverandre (rygg mot rygg) med øynene utover. Når tiden er ute,
     snur de seg mot hverandre (fjær). Uenige: begge får «OI»-fjeset. */
  var rrVist = '';
  function rrSpill(s) {
    var t = tilstand, r = s.rr, alle = t.spillere || [], jeg = t.meg, iPar = jeg === r.a || jeg === r.b, annen = jeg === r.a ? r.b : r.a;
    var nokkel = s.pos + ':' + s.antall + ':' + r.fase, inn = rrVist !== nokkel; rrVist = nokkel;
    var k = s.kort || {}, tekst = String(k.t || ''), m = tekst.match(/^(Hvem av dere|Which of you|Who of you)\s+/i), rest = m ? tekst.slice(m[0].length) : tekst;
    var nv = function (id) { return id === jeg ? T('Du', 'You') : esc(navn(id)); };
    var res = r.resultat;
    var chip = r.fase === 'svar' ? (iPar ? T('Rygg mot rygg', 'Back to back') : T('Gjett', 'Guess')) : res && res.fasit ? (res.enige ? T('Enige!', 'Agreed!') : T('Uenige!', 'Disagreed!')) : T('Snudd!', 'Flipped!');
    var topp = jaTopp(T('Rygg mot rygg · kort ', 'Back to back · card ') + (s.pos + 1) + T(' av ', ' of ') + s.antall, chip, r.fase !== 'svar', r.fase === 'svar');
    var kort = '<div class="pk-kort rr-kort"><span class="pk-pre">' + (iPar ? '' : esc(navn(r.a)) + T(' og ', ' and ') + esc(navn(r.b)) + ': ') + (m ? esc(m[1]) : T('Hvem av dere', 'Which of you')) + ' …</span><p>' + esc(rest) + '</p></div>';
    var gjettere = alle.filter(function (p) { return p.id !== r.a && p.id !== r.b; });
    if (r.fase === 'svar') {
      var pekt = r.harPekt || [], gjettet = r.harGjettet || [];
      var status = pekt.length + T(' av 2 har pekt', ' of 2 pointed') + (gjettere.length ? ' · ' + gjettet.length + T(' av ', ' of ') + gjettere.length + T(' har gjettet', ' guessed') : '');
      var midt;
      if (iPar) midt = '<p class="rr-hint">' + T('Snu ryggen til ', 'Turn your back to ') + esc(navn(annen)) + T('. Ikke se – pek i hemmelighet.', '. No peeking – point in secret.') + '</p>' +
        '<div class="rr-valg' + (inn ? ' inn' : '') + '"><button type="button" class="rr-knapp meg" data-g="rr-pek" data-v="' + jeg + '" aria-pressed="' + (r.mitt === jeg) + '"><span>' + T('Pek på', 'Point at') + '</span><b>' + T('Meg', 'Me') + '</b></button>' +
          '<button type="button" class="rr-knapp den" data-g="rr-pek" data-v="' + annen + '" aria-pressed="' + (r.mitt === annen) + '"><span>' + T('Pek på', 'Point at') + '</span><b>' + esc(navn(annen)) + '</b></button></div>' +
        '<p class="nr-vent">' + (r.mitt ? T('Pekt. ', 'Pointed. ') + esc(navn(annen)) + T(' ser ikke hva du valgte – og du ser ikke hva hen valgte.', ' can’t see your pick – and you can’t see theirs.') : (gjettere.length ? T('De andre gjetter hva dere peker på.', 'The others are guessing what you point at.') : T('Blir dere enige?', 'Will you agree?'))) + '</p>';
      else midt = '<p class="rr-hint">' + T('Hva tror du de to peker på? Gjetter du feil, drikker du én.', 'What do you think the two point at? Guess wrong and you drink one.') + '</p>' +
        '<div class="rr-valg tre' + (inn ? ' inn' : '') + '"><button type="button" class="rr-knapp den" data-g="rr-gjett" data-v="' + r.a + '" aria-pressed="' + (r.mitt === r.a) + '"><span>' + T('Begge peker på', 'Both point at') + '</span><b>' + esc(navn(r.a)) + '</b></button>' +
          '<button type="button" class="rr-knapp meg" data-g="rr-gjett" data-v="' + r.b + '" aria-pressed="' + (r.mitt === r.b) + '"><span>' + T('Begge peker på', 'Both point at') + '</span><b>' + esc(navn(r.b)) + '</b></button>' +
          '<button type="button" class="rr-knapp uenig" data-g="rr-gjett" data-v="uenig" aria-pressed="' + (r.mitt === 'uenig') + '"><b>' + T('De blir uenige', 'They disagree') + '</b><span>' + T('Peker på hver sin', 'Each points at someone else') + '</span></button></div>' +
        '<p class="nr-vent">' + (r.mitt ? T('Gjettet – hodet ditt reiser seg. Du kan bytte til tiden er ute.', 'Guessed – your head rises. You can change until time is up.') : T('Ingen ser hva du gjetter før de to har pekt.', 'Nobody sees your guess until the two have pointed.')) + '</p>';
      return topp + kort + midt +
        (erVert() && (pekt.length || gjettet.length) ? '<p class="ja-vis"><button type="button" class="linkbtn" data-g="avslor">' + T('Snu dem nå', 'Turn them now') + '</button></p>' : '') +
        hodeBenk(alle, { oppe: [r.a, r.b].concat(gjettet), par: { a: r.a, b: r.b }, status: status });
    }
    // Snudd
    var dom, kl;
    if (!res.fasit) { kl = 'tom'; dom = '<span>' + T('Snudd', 'Flipped') + '</span><b>' + res.mangler.map(nv).join(T(' og ', ' and ')) + T(' pekte ikke', ' didn’t point') + '</b><small>' + T('Glemte du det? Én slurk.', 'Forgot? One sip.') + '</small>'; }
    else if (res.enige) { kl = 'enige'; dom = '<span>' + T('Enige!', 'Agreed!') + '</span><b>' + T('Begge pekte på ', 'Both pointed at ') + (res.pa === jeg ? T('deg', 'you') : esc(navn(res.pa))) + '</b><small>' + nv(res.pa) + (res.pa === jeg ? T(' drikker én.', ' drink one.') : T(' drikker én.', ' drinks one.')) + '</small>'; }
    else { kl = 'uenige'; var selv = function (id) { return id === jeg ? T('deg selv', 'yourself') : T('seg selv', 'themself'); }; dom = '<span>' + T('Uenige!', 'Disagreed!') + '</span><b>' + nv(r.a) + T(' pekte på ', ' pointed at ') + (res.pa === r.a ? selv(r.a) : (res.pa === jeg ? T('deg', 'you') : nv(res.pa))) + ', ' + nv(r.b) + T(' på ', ' at ') + (res.pb === r.b ? selv(r.b) : (res.pb === jeg ? T('deg', 'you') : nv(res.pb))) + '</b><small>' + T('Dere kjenner ikke hverandre så godt som dere tror. Begge drikker én.', 'You don’t know each other as well as you think. Both drink one.') + '</small>'; }
    var g = res.gjett || {}, gNavn = function (v) { return v === 'uenig' ? T('uenige', 'disagree') : esc(navn(v)); };
    var linjer = gjettere.filter(function (p) { return g[p.id]; }).map(function (p) {
      var feil = res.feil.indexOf(p.id) !== -1;
      return '<li class="' + (feil ? 'feil' : 'rett') + '"><b>' + nv(p.id) + '</b><span>' + T('gjettet ', 'guessed ') + gNavn(g[p.id]) + '</span><em>' + (res.fasit ? (feil ? T('Drikk én', 'Drink one') : T('Riktig', 'Right')) : '') + '</em></li>'; }).join('');
    var bi = alle.findIndex(function (p) { return p.id === r.b; }), nesteB = alle.length > 2 ? alle[(bi + 1) % alle.length] : alle.find(function (p) { return p.id === r.a; });
    var sist = s.pos + 1 >= s.antall;
    return topp + kort + '<div class="rr-dom ' + kl + (inn ? ' inn' : '') + '">' + dom + '</div>' + (linjer ? '<ul class="rr-gjett">' + linjer + '</ul>' : '') +
      videreKnapp(s, (sist ? T('Til oppsummeringen', 'To the recap') : T('Neste par: ', 'Next pair: ') + esc(navn(r.b)) + T(' og ', ' and ') + esc(nesteB ? nesteB.navn : ''))) +
      hodeBenk(alle, { oppe: true, par: { a: r.a, b: r.b, snudd: true }, oi: res.fasit && !res.enige ? [r.a, r.b] : res.mangler || [] });
  }
  /* ---------- Nødt eller sannhet: én i stolen, alle andre er dommere ----------
     Den i stolen står i midten av benken, større og i søkelyset; alle de andre ser på hen. Hen velger nødt
     eller sannhet, og først da snus kortet. Dommerne reiser seg når de har stemt. Feig eller juks: «OI». */
  var nsVist = '';
  function nsSpill(s) {
    var t = tilstand, r = s.ns, alle = t.spillere || [], jeg = t.meg, iStol = jeg === r.hvem, han = esc(navn(r.hvem));
    var nokkel = s.pos + ':' + s.antall + ':' + r.fase, inn = nsVist !== nokkel; nsVist = nokkel;
    var res = r.resultat, nodt = r.valg === 'nodt';
    var nv = function (id) { return id === jeg ? T('Du', 'You') : esc(navn(id)); };
    var chip = r.fase === 'velg' ? (iStol ? T('Du i stolen', 'You’re up') : han + T(' i stolen', ' is up')) : r.fase === 'avslort' ? (res.feig ? T('Feig!', 'Chicken!') : res.juks ? T('Juks!', 'Cheat!') : T('Godkjent!', 'Approved!')) : nodt ? T('Nødt', 'Dare') : T('Sannhet', 'Truth');
    var topp = jaTopp(T('Nødt eller sannhet · kort ', 'Truth or dare · card ') + (s.pos + 1) + T(' av ', ' of ') + s.antall, chip, r.fase === 'velg' || r.fase === 'avslort', !!s.frist);
    var dommere = alle.filter(function (p) { return p.id !== r.hvem; }), stemt = r.harStemt || [];
    var kort = function (liten) {
      var k = s.kort || {};
      return '<div class="pk-kort ns-kort ' + (nodt ? 'nodt' : 'sannhet') + (liten ? ' liten' : '') + (inn && r.fase === 'gjor' ? ' inn' : '') + '"><span class="pk-pre">' + (nodt ? T('Nødt for ', 'Dare for ') : T('Sannhet for ', 'Truth for ')) + (iStol ? T('deg', 'you') : han) + (r.auto ? T(' · appen valgte', ' · the app picked') : '') + '</span><p>' + esc(k.t || '') + '</p></div>';
    };
    var benk = function (o) { o.stol = r.hvem; o.stirr = r.hvem; return hodeBenk(alle, o); };
    if (r.fase === 'velg') {
      var midt = iStol
        ? '<p class="ns-stor">' + T('Du sitter i stolen.<br>Hva tør du?', 'You’re in the hot seat.<br>What do you dare?') + '</p>' +
          '<div class="rr-valg en' + (inn ? ' inn' : '') + '"><button type="button" class="rr-knapp nodt" data-g="ns-velg" data-v="nodt"><span>' + T('Gjør noe – foran alle', 'Do something – in front of everyone') + '</span><b>' + T('Nødt', 'Dare') + '</b></button>' +
            '<button type="button" class="rr-knapp sann" data-g="ns-velg" data-v="sannhet"><span>' + T('Svar ærlig – høyt', 'Answer honestly – out loud') + '</span><b>' + T('Sannhet', 'Truth') + '</b></button></div>' +
          '<p class="nr-vent">' + T('Velger du ikke før klokka er ute, velger appen for deg.', 'If you don’t pick before time runs out, the app picks for you.') + '</p>'
        : '<p class="ns-stor">' + han + T(' sitter i stolen.', ' is in the hot seat.') + '</p><p class="nr-vent">' + T('Hen velger nødt eller sannhet. Så blir du dommer.', 'They pick truth or dare. Then you judge.') + '</p>' +
          (erVert() ? '<p class="ja-vis"><button type="button" class="linkbtn" data-g="ns-velg" data-v="nodt">' + T('Velg nødt for ', 'Pick dare for ') + han + '</button> · <button type="button" class="linkbtn" data-g="ns-velg" data-v="sannhet">' + T('sannhet', 'truth') + '</button></p>' : '');
      return topp + midt + benk({ oppe: [], status: iStol ? T('Alle ser på deg', 'Everyone’s looking at you') : T('Alle venter på ', 'Everyone waits for ') + han });
    }
    if (r.fase === 'gjor') {
      var knapper = iStol || erVert()
        ? '<button class="rom-stor-knapp" data-g="ns-ferdig" type="button">' + (iStol ? T('Ferdig – la dem dømme', 'Done – let them judge') : T('Ferdig – la dem dømme ', 'Done – judge ') + han) + '</button>' +
          '<button class="rom-knapp ns-feig" data-g="ns-feig" type="button">' + (iStol ? T('Feig ut · drikk 3', 'Chicken out · drink 3') : han + T(' feiget ut · drikker 3', ' chickened out · drinks 3')) + '</button>'
        : '<p class="nr-vent">' + han + (nodt ? T(' gjør det nå. Når hen er ferdig, dømmer du.', ' is doing it now. When they’re done, you judge.') : T(' svarer nå. Når hen er ferdig, dømmer du.', ' is answering now. When they’re done, you judge.')) + '</p>';
      return topp + kort(false) + knapper + benk({ oppe: [], status: nodt ? han + T(' gjør det nå', ' is doing it') : han + T(' svarer nå', ' is answering') });
    }
    var status = stemt.length + T(' av ', ' of ') + dommere.length + T(' har dømt', ' judged');
    if (r.fase === 'dom') {
      var midt2 = iStol
        ? '<p class="ns-stor liten">' + T('De andre dømmer deg nå …', 'The others are judging you …') + '</p><button class="rom-knapp ns-feig" data-g="ns-feig" type="button">' + T('Feig ut likevel · drikk 3', 'Chicken out anyway · drink 3') + '</button>'
        : '<p class="rr-hint">' + (nodt ? T('Du er dommer. Gjorde ', 'You’re the judge. Did ') + han + T(' det skikkelig?', ' really do it?') : T('Du er dommer. Tror du på ', 'You’re the judge. Do you believe ') + han + '?') + '</p>' +
          '<div class="rr-valg' + (inn ? ' inn' : '') + '"><button type="button" class="rr-knapp ja" data-g="ns-stem" data-v="ja" aria-pressed="' + (r.mitt === 'ja') + '"><span>' + (nodt ? T('Det telte', 'That counts') : T('Jeg tror deg', 'I believe it')) + '</span><b>' + T('Godkjent', 'Approved') + '</b></button>' +
            '<button type="button" class="rr-knapp nei" data-g="ns-stem" data-v="nei" aria-pressed="' + (r.mitt === 'nei') + '"><span>' + (nodt ? T('Det der telte ikke', 'That didn’t count') : T('Det er løgn', 'That’s a lie')) + '</span><b>' + T('Juks!', 'Cheat!') + '</b></button></div>' +
          '<p class="nr-vent">' + (r.mitt ? T('Dømt. Ingen ser hva du stemte før alle har stemt.', 'Judged. Nobody sees your vote until everyone has voted.') : T('Flertallet bestemmer. Likt = godkjent.', 'The majority decides. A tie = approved.')) + '</p>';
      return topp + kort(true) + midt2 +
        (erVert() && stemt.length ? '<p class="ja-vis"><button type="button" class="linkbtn" data-g="avslor">' + T('Døm nå', 'Judge now') + '</button></p>' : '') +
        benk({ oppe: stemt, status: status });
    }
    // Dommen
    var dom, kl;
    if (res.feig) { kl = 'feig'; dom = '<span>' + T('Feig!', 'Chicken!') + '</span><b>' + nv(r.hvem) + (iStol ? T(' drikker 3', ' drink 3') : T(' drikker 3', ' drinks 3')) + '</b><small>' + T('Alle så det. Neste gang tør du.', 'Everyone saw it. Next time you’ll dare.') + '</small>'; }
    else if (res.juks) { kl = 'uenige'; dom = '<span>' + T('Juks · ', 'Cheat · ') + res.nei + T(' mot ', ' to ') + res.ja + '</span><b>' + nv(r.hvem) + (iStol ? T(' drikker 2', ' drink 2') : T(' drikker 2', ' drinks 2')) + '</b><small>' + T('Det der telte ikke, mener flertallet.', 'That didn’t count, says the majority.') + '</small>'; }
    else { kl = 'enige'; dom = '<span>' + T('Godkjent', 'Approved') + (res.ja + res.nei ? ' · ' + res.ja + T(' mot ', ' to ') + res.nei : '') + '</span><b>' + (nodt ? (iStol ? T('Du klarte det!', 'You did it!') : han + T(' klarte det!', ' did it!')) : (iStol ? T('De tror deg', 'They believe you') : T('Vi tror på ', 'We believe ') + han)) + '</b><small>' + (iStol ? T('Du slipper å drikke.', 'You don’t drink.') : han + T(' slipper å drikke.', ' doesn’t drink.')) + '</small>'; }
    var st = res.stemmer || {};
    var linjer = dommere.filter(function (p) { return st[p.id]; }).map(function (p) {
      return '<li class="' + (st[p.id] === 'nei' ? 'feil' : 'rett') + '"><b>' + nv(p.id) + '</b><span></span><em>' + (st[p.id] === 'nei' ? T('Juks', 'Cheat') : T('Godkjent', 'Approved')) + '</em></li>'; }).join('');
    var hi = alle.findIndex(function (p) { return p.id === r.hvem; }), neste = alle[(hi + 1) % alle.length];
    var sist = s.pos + 1 >= s.antall;
    return topp + kort(true) + '<div class="rr-dom ' + kl + (inn ? ' inn' : '') + '">' + dom + '</div>' + (linjer ? '<ul class="rr-gjett">' + linjer + '</ul>' : '') +
      videreKnapp(s, (sist ? T('Til oppsummeringen', 'To the recap') : T('Neste i stolen: ', 'Next in the hot seat: ') + esc(neste ? (neste.id === jeg ? T('deg', 'you') : neste.navn) : ''))) +
      benk({ oppe: true, oi: res.feig || res.juks ? [r.hvem] : [], flat: false });
  }
  /* ---------- Kategorier: bomba går rundt ----------
     Bomba sitter ved hodet til den som har den, og flyr i en bue med fjær til neste (kbFly). Gnisten blafrer,
     og bomba skjelver raskere jo nærmere smellet. BOM: stjerne, skjermen rister, «OI» på den som satt med den. */
  var kbVist = '', kbTimer = null, kbIntervall = null;
  var KB_FJAER = 'linear(0, 0.0249, 0.0878, 0.1741, 0.2724, 0.3744, 0.4742, 0.5677, 0.6526, 0.7275, 0.792, 0.8462, 0.8909, 0.9269, 0.9552, 0.9768, 0.9928, 1.0042, 1.0119, 1.0166, 1.0191, 1.0199, 1.0195, 1.0184, 1.0167, 1.0148, 1.0127, 1.0107, 1.0089, 1.0071, 1.0056, 1.0043, 1.0032, 1.0023, 1.0015, 1.001, 1.0005, 1.0002, 1)';
  var KB_SVG = '<svg viewBox="-34 -46 68 80" aria-hidden="true"><path class="kb-lunte" d="M10 -22q8 -14 20 -16" fill="none" stroke-width="4" stroke-linecap="round"/>' +
    '<g class="kb-gnist"><circle cx="31" cy="-39" r="7" fill="#FFD23F"/><circle cx="31" cy="-39" r="3.5" fill="#FF5B1F"/><path d="M31 -50v-5M42 -39h5M38 -47l4-4M24 -47l-4-4" stroke="#FFD23F" stroke-width="3" stroke-linecap="round"/></g>' +
    '<rect x="-2" y="-27" width="18" height="10" rx="2" transform="rotate(30 7 -22)" fill="#4A3F37" stroke="#16120F" stroke-width="3"/><circle class="kb-kropp" cx="0" cy="2" r="28" stroke-width="3.5"/>' +
    '<path d="M-15 -12a18 18 0 0 1 12 -7" fill="none" stroke="#FFF8EE" stroke-width="4" stroke-linecap="round" opacity=".7"/></svg>';
  var KB_BOM = '<svg viewBox="-60 -60 120 120" aria-hidden="true"><path d="M0 -56L12 -22L46 -36L26 -6L56 12L20 16L28 52L0 26L-28 52L-20 16L-56 12L-26 -6L-46 -36L-12 -22Z" fill="#FFD23F" stroke="#16120F" stroke-width="4" stroke-linejoin="round"/>' +
    '<path d="M0 -30L7 -12L26 -18L14 0L30 10L10 10L14 30L0 16L-14 30L-10 10L-30 10L-14 0L-26 -18L-7 -12Z" fill="#FF5B1F"/></svg>';
  /** Hvor langt bomba har brent (0–1): bestemmer hvor fort den skjelver. */
  function kbBrent(b) { var naa = Date.now() + klokkeAvvik; return Math.max(0, Math.min(1, (naa - b.start) / Math.max(1, b.smell - b.start))); }
  function kbFart(b) { return Math.round(700 - 560 * kbBrent(b)) + 'ms'; }
  function kbBombe(x, o) {
    return '<div class="kb-bombe' + (o.bom ? ' bom' : '') + '" style="--x:' + (x / 100).toFixed(3) + '">' + (o.bom ? '<i class="kb-smell">' + KB_BOM + '<b>BOM!</b></i>' : '<i class="kb-rist" style="--fart:' + o.fart + '">' + KB_SVG + '</i>') + '</div>';
  }
  /** Bomba flyr fra der den var til der den er nå: en bue med fjær (FLIP, bare transform). */
  function kbRekt() { var e = root.querySelector('.kb-bombe:not(.bom)'); return e ? e.getBoundingClientRect() : null; }
  function kbFly(fra) {
    var e = root.querySelector('.kb-bombe:not(.bom)'); if (!e || !fra || !e.animate || roligBevegelse()) return;
    var til = e.getBoundingClientRect(), dx = fra.left - til.left, dy = fra.top - til.top;
    if (Math.abs(dx) < 2 && Math.abs(dy) < 2) return;
    e.animate([{ transform: 'translate(' + dx + 'px,' + dy + 'px)' }, { transform: 'translate(' + (dx / 2) + 'px,' + (dy / 2 - 46) + 'px) rotate(' + (dx > 0 ? -160 : 160) + 'deg)', offset: 0.45 }, { transform: 'none' }],
      { duration: 520, easing: KB_FJAER });
  }
  function kbSpill(s) {
    var t = tilstand, b = s.kb, alle = t.spillere || [], jeg = t.meg, har = b.holder === jeg, han = esc(navn(b.holder));
    var nokkel = s.pos + ':' + s.antall + ':' + b.fase + ':' + b.holder, ny = kbVist !== nokkel, varFase = kbVist.split(':')[2]; kbVist = nokkel;
    if (ny && b.fase === 'gaar' && har) { spillLyd('tur'); try { navigator.vibrate && navigator.vibrate(60); } catch (e) {} }
    if (ny && b.fase === 'bom' && varFase === 'gaar') { spillLyd('dundun'); if (har) { try { navigator.vibrate && navigator.vibrate([90, 50, 160]); } catch (e) {} } }
    clearTimeout(kbTimer); clearInterval(kbIntervall);
    if (b.fase === 'gaar') {
      kbTimer = setTimeout(function () { gjorAlltid({ handling: 'kb-smell' }); }, Math.max(0, b.smell - (Date.now() + klokkeAvvik)) + 250 + Math.random() * 600);
      kbIntervall = setInterval(function () { var r = root.querySelector('.kb-rist'); if (!r) return clearInterval(kbIntervall); r.style.setProperty('--fart', kbFart(b)); }, 1000);
    }
    var chip = b.fase === 'bom' ? 'BOM!' : har ? T('Din tur!', 'Your turn!') : han + T(' har bomba', ' has the bomb');
    var topp = jaTopp(T('Kategorier · kort ', 'Categories · card ') + (s.pos + 1) + T(' av ', ' of ') + s.antall, chip, b.fase === 'gaar' && !har, false);
    var kort = '<div class="pk-kort kb-kort"><span class="pk-pre">' + T('Kategori', 'Category') + '</span><p>' + esc((s.kort && s.kort.t) || '') + '</p></div>';
    var protest = (b.protest || []).length ? '<p class="kb-protest">' + T('Sagt før!', 'Said before!') + ' <span>' + b.protest.map(function (id) { return esc(id === jeg ? T('du', 'you') : navn(id)); }).join(', ') + '</span></p>' : '';
    var benk = hodeBenk(alle, { oppe: true, stirr: b.holder, bombe: { id: b.holder, fart: kbFart(b), bom: b.fase === 'bom' }, oi: b.fase === 'bom' ? [b.holder] : [], flat: false, status: b.svar ? b.svar + T(' svar', ' answers') : '' });
    if (b.fase === 'gaar') {
      var midt = har
        ? '<button type="button" class="kb-knapp" data-g="kb-send" data-fra="' + b.holder + '"><b>' + T('Sagt!', 'Said it!') + '</b><span>' + T('Send bomba →', 'Pass the bomb →') + '</span></button>' + protest
        : protest + ((b.protest || []).indexOf(jeg) === -1 ? '<button type="button" class="ns-feig kb-sagt" data-g="kb-protest">' + T('Sagt før!', 'Said before!') + '</button>' : '') +
          (erVert() ? '<p class="ja-vis"><button type="button" class="linkbtn" data-g="kb-send" data-fra="' + b.holder + '">' + T('Send for ', 'Pass for ') + han + '</button></p>' : '');
      return topp + kort + midt + benk;
    }
    var sist = s.pos + 1 >= s.antall;
    return '<div class="kb-skjelv' + (ny ? ' na' : '') + '">' + topp + kort + '<div class="rr-dom uenige' + (ny ? ' inn' : '') + '"><span>BOM! · ' + b.resultat.svar + T(' svar', ' answers') + '</span><b>' + (har ? T('Du drikker 2', 'You drink 2') : han + T(' drikker 2', ' drinks 2')) + '</b></div>' +
      videreKnapp(s, (sist ? T('Til oppsummeringen', 'To the recap') : T('Ny kategori', 'New category'))) + '</div>' + benk;
  }
  /* ---------- Låtbekjennelsen: hvem valgte låta? ----------
     Platen glir ut og snurrer mens låta spilles (bare verten har Spotify-knappen), og hodene vugger i takt.
     Avsløringen: eieren får gul navnelapp, alle ser på hen. Til slutt: beste historie. */
  var lbVist = '';
  var LB_FARGER = ['#FF5B1F', '#FF9CC2', '#63E2A8', '#FFD23F', '#7CC6FE'];
  function lbDel(tekst) { var d = String(tekst || '').split(/\s+[–-]\s+/); return { tittel: d[0] || '', artist: d.slice(1).join(' – ') }; }
  function lbPlate(farge, inn) {
    return '<div class="lb-plate' + (inn ? ' inn' : '') + '"><svg class="lb-spinn" viewBox="-50 -50 100 100" aria-hidden="true"><circle r="48" fill="#16120F"/>' +
      '<circle r="41" fill="none" stroke="#3A3940" stroke-width="1.5"/><circle r="35" fill="none" stroke="#3A3940" stroke-width="1.5"/><circle r="29" fill="none" stroke="#3A3940" stroke-width="1.5"/>' +
      '<path d="M-30 -30A42 42 0 0 1 10 -40" fill="none" stroke="#FFF8EE" stroke-width="3" stroke-linecap="round" opacity=".35"/>' +
      '<circle r="17" fill="' + farge + '" stroke="#16120F" stroke-width="2"/><circle r="3" fill="#16120F"/></svg></div>';
  }
  function lbHoder(valgt, data, unntak) {
    var alle = tilstand.spillere || [];
    return '<div class="ms-valg" style="--kol:' + (alle.length - 1 <= 4 ? 2 : 3) + '">' + alle.filter(function (p) { return unntak.indexOf(p.id) === -1; }).map(function (p, i) {
      return '<button type="button" class="ms-hode" style="--i:' + i + '" data-g="' + data + '" data-paa="' + p.id + '" aria-pressed="' + (valgt === p.id) + '">' + eeHode(p, 'vanlig') + '<span>' + esc(p.navn) + '</span></button>'; }).join('') + '</div>';
  }
  function lbSpill(s) {
    var t = tilstand, b = s.lb, alle = t.spillere || [], jeg = t.meg;
    var nokkel = s.pos + ':' + b.fase + ':' + b.nr, inn = lbVist !== nokkel; lbVist = nokkel;
    var nv = function (id) { return id === jeg ? T('Du', 'You') : esc(navn(id)); };
    var tittel = T('Låtbekjennelsen · kategori ', 'Song confessions · category ') + (s.pos + 1) + T(' av ', ' of ') + s.antall;
    var kort = '<div class="pk-kort lb-kort"><p>' + esc((s.kort && s.kort.t) || '') + '</p></div>';
    if (b.fase === 'skriv') {
      var har = b.harSkrevet || [];
      var midt = b.min
        ? '<p class="ns-stor lb-min' + (inn ? '' : '') + '">«' + esc(b.min) + '»</p><p class="nr-vent">' + T('Ligger i bunken.', 'In the pile.') + '</p>'
        : '<form class="nr-fritt lb-skjema" id="lbSkjema"><label for="lbInput">' + T('Din låt', 'Your song') + '</label><div><input id="lbInput" maxlength="80" autocomplete="off" enterkeyhint="send" placeholder="' + T('Låt – artist', 'Song – artist') + '"><button type="submit">' + T('Legg i bunken', 'Add it') + '</button></div></form>';
      return jaTopp(tittel, b.min ? T('Valgt', 'Picked') : T('Velg en låt', 'Pick a song'), !b.min, true) + kort + midt +
        (erVert() && har.length ? '<p class="ja-vis"><button type="button" class="linkbtn" data-g="avslor">' + T('Start nå', 'Start now') + '</button></p>' : '') +
        hodeBenk(alle, { oppe: har, status: har.length + T(' av ', ' of ') + alle.length + T(' har valgt', ' picked') });
    }
    if (b.fase === 'gjett' || b.fase === 'avslort') {
      var lat = lbDel(b.lat), farge = LB_FARGER[b.nr % LB_FARGER.length], sv = b.svar;
      var plate = '<div class="lb-lat">' + lbPlate(farge, inn && b.fase === 'gjett') + '<div class="lb-lat-tekst"><b>' + esc(lat.tittel) + '</b>' + (lat.artist ? '<span>' + esc(lat.artist) + '</span>' : '') +
        (erVert() ? '<a class="lb-spotify" href="https://open.spotify.com/search/' + encodeURIComponent(b.lat || '') + '" target="_blank" rel="noopener">' + T('Spill på Spotify', 'Play on Spotify') + '</a>' : '') + '</div></div>';
      var topp = jaTopp(tittel, T('Låt ', 'Song ') + (b.nr + 1) + T(' av ', ' of ') + b.antall, b.fase === 'avslort', b.fase === 'gjett');
      if (b.fase === 'gjett') {
        var hg = b.harGjettet || [], midt2 = b.minLat
          ? '<p class="ns-stor liten">' + T('Din låt! Hold maska.', 'Your song! Keep a straight face.') + '</p>'
          : '<p class="rr-hint">' + T('Hvem valgte den?', 'Who picked it?') + '</p>' + lbHoder(b.mittGjett, 'lb-gjett', [jeg]);
        return topp + kort + plate + midt2 +
          (erVert() && hg.length ? '<p class="ja-vis"><button type="button" class="linkbtn" data-g="avslor">' + T('Vis hvem nå', 'Reveal now') + '</button></p>' : '') +
          hodeBenk(alle, { oppe: true, takt: true, status: hg.length + T(' har gjettet', ' guessed') });
      }
      var minDom = sv.eier === jeg ? T('Din låt – fortell!', 'Your song – tell the story!') : (sv.rett.indexOf(jeg) !== -1 ? T('Riktig!', 'Right!') : sv.feil.indexOf(jeg) !== -1 ? T('Feil – drikk én', 'Wrong – drink one') : '');
      var sist = b.nr + 1 >= b.antall;
      return topp + kort + plate +
        '<div class="rr-dom ' + (sv.eier === jeg ? 'lb-gul' : sv.feil.indexOf(jeg) !== -1 ? 'uenige' : 'enige') + (inn ? ' inn' : '') + '"><span>' + minDom + '</span><b>' + nv(sv.eier) + T(' – fortell!', ' – tell us!') + '</b>' +
          (sv.feil.length ? '<small>' + T('Bommet: ', 'Missed: ') + sv.feil.map(nv).join(', ') + '</small>' : '') + '</div>' +
        '<button class="rom-stor-knapp" data-g="lb-neste" data-nr="' + b.nr + '" type="button">' + (sist ? T('Til avstemningen', 'To the vote') : T('Neste låt', 'Next song')) + '</button>' +
        hodeBenk(alle, { oppe: true, takt: true, stirr: sv.eier, gul: sv.eier });
    }
    if (b.fase === 'stem') {
      var hs = b.harStemt || [];
      return jaTopp(tittel, b.minStemme ? T('Stemt', 'Voted') : T('Beste historie?', 'Best story?'), !b.minStemme, true) + kort +
        '<p class="rr-hint">' + T('Hvem hadde den beste historien?', 'Who told the best story?') + '</p>' + lbHoder(b.minStemme, 'lb-stem', [jeg]) +
        (erVert() && hs.length ? '<p class="ja-vis"><button type="button" class="linkbtn" data-g="avslor">' + T('Vis nå', 'Show now') + '</button></p>' : '') +
        hodeBenk(alle, { oppe: hs, status: hs.length + T(' av ', ' of ') + alle.length + T(' har stemt', ' voted') });
    }
    // Ferdig
    var r = b.resultat || {}, vinn = r.vinnere || [];
    var logg = (b.logg || []).map(function (x, i) { var l = lbDel(x.tekst); return '<li style="--f:' + LB_FARGER[i % LB_FARGER.length] + '"><i></i><span><b>' + esc(l.tittel) + '</b>' + (l.artist ? ' · ' + esc(l.artist) : '') + '</span><em>' + nv(x.eier) + '</em></li>'; }).join('');
    var sisteKat = s.pos + 1 >= s.antall;
    return jaTopp(tittel, vinn.length ? T('Vinner!', 'Winner!') : T('Ferdig', 'Done'), true, false) + kort +
      (vinn.length ? '<div class="rr-dom lb-gul' + (inn ? ' inn' : '') + '"><span>' + T('Beste historie · ', 'Best story · ') + r.stemmer + (r.stemmer === 1 ? T(' stemme', ' vote') : T(' stemmer', ' votes')) + '</span><b>' + vinn.map(nv).join(' & ') + '</b><small>' + T('Deler ut 3.', 'Hands out 3.') + '</small></div>' : '') +
      (logg ? '<ul class="lb-logg">' + logg + '</ul>' : '') +
      videreKnapp(s, (sisteKat ? T('Til oppsummeringen', 'To the recap') : T('Neste kategori', 'Next category'))) +
      hodeBenk(alle, { oppe: true, oi: [], stirr: vinn.length === 1 ? vinn[0] : '', gul: vinn[0] });
  }
  /** De andre kortlekene når bunken er tom: hvor mange kort dere spilte (i Pekeleken: hvem som ble pekt mest på), og så hva nå. */
  function kortFerdig(s) {
    var pt = s.pekSlutt || [], forste = pt[0], maks = Math.max(1, forste ? forste.n : 0);
    var midt = s.lek === 'pekeleken' && forste
      ? '<div class="ja-tavle"><p class="nr-etikett">' + T('Mest utpekt i kveld', 'Most pointed at tonight') + '</p>' +
          '<div class="ja-vinner">' + hodeMerke(forste.id) + '<b>' + jaNavn(forste.id) + '</b><em>' + forste.n + '</em></div>' +
          (pt.length > 1 ? '<ul class="pk-soyler inn">' + pt.slice(1).map(function (x, i) {
            return '<li style="--i:' + i + '"><span>' + jaNavn(x.id) + '</span><i><b style="transform:scaleX(' + (x.n / maks).toFixed(3) + ');background:' + nrFarge(x.id) + '"></b></i><em>' + x.n + '</em></li>'; }).join('') + '</ul>' : '') + '</div>'
      : '<div class="pk-kort sd-ferdig"><b>' + s.antall + '</b><p>' + T('kort spilt. Det var det.', 'cards played. That was it.') + '</p></div>';
    return jaTopp(esc(s.navn || '') + ' · ' + s.antall + T(' kort', ' cards'), T('Kortene er brukt opp', 'The cards are used up'), true) + midt +
      lekSlutt([['kort-igjen', T('Nye kort', 'New cards'), T('Kort dere ikke har hatt', 'Cards you haven’t had')]]);
  }
  /** Når kortene er brukt opp: hvem som har gjort mest, og så hva dere gjør nå. */
  function aldriFerdig(s) {
    var l = s.jaTavle || [], forste = l[0], maks = Math.max(1, forste ? forste.n : 0), sist = l[l.length - 1];
    var tavle = forste && forste.n
      ? '<div class="ja-tavle"><p class="nr-etikett">' + T('Mest erfaren', 'Most experienced') + '</p>' +
          '<div class="ja-vinner">' + hodeMerke(forste.id) + '<b>' + jaNavn(forste.id) + '</b><em>' + forste.n + '</em></div>' +
          (l.length > 1 ? '<ul class="pk-soyler inn">' + l.slice(1).map(function (x, i) {
            return '<li style="--i:' + i + '"><span>' + jaNavn(x.id) + '</span><i><b style="transform:scaleX(' + (x.n / maks).toFixed(3) + ');background:' + nrFarge(x.id) + '"></b></i><em>' + x.n + '</em></li>'; }).join('') + '</ul>' : '') +
          (l.length > 2 && sist.n < forste.n ? '<p class="ja-kommentar">' + jaNavn(sist.id) + T(': «Et uskyldig liv.» Eller en god løgner.', ': “An innocent life.” Or a good liar.') + '</p>' : '') + '</div>'
      : '<p class="nr-vent">' + T('Ingen har gjort noe av det. Et uskyldig rom – eller en gjeng gode løgnere.', 'Nobody has done any of it. An innocent room – or a bunch of good liars.') + '</p>';
    return jaTopp(T('Jeg har aldri · ', 'Never have I ever · ') + s.antall + T(' kort', ' cards'), T('Kortene er brukt opp', 'The cards are used up'), true) + tavle +
      lekSlutt([['aldri-igjen', T('Nye kort', 'New cards'), T('Kort dere ikke har hatt', 'Cards you haven’t had')]]);
  }

  /* ---------- Pekeleken på mobilen: trykk på hodet til den det passer best på ----------
     Hodene reiser seg på benken når folk har stemt. Resultatet: stemmetall spretter opp over hodene,
     den med flest får «OI» og alle stirrer. Hver stemme er én slurk. */
  var msVist = '';
  function mestSpill(s) {
    var t = tilstand, alle = t.spillere || [], jeg = t.meg, nokkel = (s.runde || 0) + ':' + s.fase, inn = msVist !== nokkel; msVist = nokkel;
    var tekst = String(s.tekst || ''), m = tekst.match(PK_PRE), rest = m ? tekst.slice(m[0].length) : tekst;
    var kort = '<div class="pk-kort ms-kort">' + (m ? '<span class="pk-pre">' + esc(m[1]) + ' …</span>' : '') + '<p>' + esc(rest) + '</p></div>';
    var nv = function (id) { return id === jeg ? T('Du', 'You') : esc(navn(id)); };
    if (s.fase === 'ferdig') {
      var tot = s.tot || {}, rang = alle.slice().sort(function (a, b) { return (tot[b.id] || 0) - (tot[a.id] || 0); });
      var vinner = rang[0] && tot[rang[0].id] ? rang[0] : null;
      return jaTopp(T('Pekeleken · på mobilen', 'Most likely to'), T('Kåringen', 'The verdict'), true, false) +
        '<div class="rr-dom uenige inn"><span>' + T('Flest stemmer i kveld', 'Most votes tonight') + '</span><b>' + (vinner ? nv(vinner.id) : T('Ingen', 'Nobody')) + '</b><small>' +
          rang.map(function (p) { return nv(p.id) + ' ' + (tot[p.id] || 0); }).join(' · ') + '</small></div>' +
        hodeBenk(alle, { oppe: true, oi: vinner ? [vinner.id] : [], stirr: vinner ? vinner.id : '', flat: true, tall: tot, tallInn: true }) +
        lekSlutt([['runde', T('Spill igjen', 'Play again'), T('Nye spørsmål – teller i kvelden', 'New questions – counts tonight')]]);
    }
    if (s.fase === 'resultat') {
      var res = s.resultat || [], maks = res.length ? res[0].stemmer : 0, topp = res.filter(function (r) { return r.stemmer === maks; }).map(function (r) { return r.id; });
      var tall = {}; res.forEach(function (r) { tall[r.id] = r.stemmer; });
      var resten = res.filter(function (r) { return topp.indexOf(r.id) === -1; });
      var chip = topp.length ? topp.map(nv).join(' & ') : T('Ingen stemmer', 'No votes');
      return jaTopp(T('Pekeleken · på mobilen', 'Most likely to'), chip, true, false) + kort +
        (topp.length ? '<div class="rr-dom uenige' + (inn ? ' inn' : '') + '"><span>' + T('Flest stemmer · ', 'Most votes · ') + maks + '</span><b>' + topp.map(nv).join(T(' og ', ' and ')) + (topp.length === 1 && topp[0] === jeg ? T(' drikker ', ' drink ') : T(' drikker ', ' drinks ')) + maks + '</b>' +
          (resten.length ? '<small>' + resten.map(function (r) { return nv(r.id) + ' ' + r.stemmer; }).join(' · ') + '</small>' : '') + '</div>' : '') +
        '<button class="rom-stor-knapp" data-g="runde" type="button">' + ((s.runde || 1) >= (s.antall || alle.length) ? T('Se kåringen', 'See the verdict') : T('Neste spørsmål', 'Next question')) + '</button>' +
        hodeBenk(alle, { oppe: true, oi: topp, stirr: topp.length === 1 ? topp[0] : '', flat: true, tall: tall, tallInn: inn });
    }
    var har = s.harStemt || [];
    return jaTopp(T('Pekeleken · på mobilen · runde ', 'Most likely to · round ') + (s.runde || 1), s.minStemme ? T('Stemt', 'Voted') : T('Trykk på én', 'Tap someone'), !s.minStemme, true) + kort +
      '<div class="ms-valg' + (inn ? ' inn' : '') + '" style="--kol:' + (alle.length <= 4 ? 2 : 3) + '">' + alle.map(function (p, i) {
        return '<button type="button" class="ms-hode" style="--i:' + i + '" data-g="stem" data-paa="' + p.id + '" aria-pressed="' + (s.minStemme === p.id) + '">' + eeHode(p, 'vanlig') + '<span>' + (p.id === jeg ? T('Meg', 'Me') : esc(p.navn)) + '</span></button>';
      }).join('') + '</div>' +
      hodeBenk(alle, { oppe: har, status: har.length + T(' av ', ' of ') + alle.length + T(' har stemt', ' voted') });
  }
  /* ---------- Løgnhalsen: hold for å se rollen, grill og stem, avsløring med stempel ----------
     Rollen ligger under et nøytralt kort og vises bare mens du holder fingeren på det; lyv og sannhet
     ser like ut, så ingen kan lese rollen på fargen fra sofaen. Den som forteller kan få en idé og
     bytte kort én gang. De andre kan være «helt sikre» (dobbel innsats). Løgneren deler ut én per lurt. */
  var lhSikker = { k: '', v: false }, lhVist = '', lhIdeNr = 0;
  var LH_STED = EN ? ['in Gran Canaria', 'on a cabin trip', 'at a Christmas party', 'in Copenhagen', 'at a petrol station by the airport', 'at a wedding', 'at a festival', 'in a lift at work']
    : ['på Gran Canaria', 'på en hyttetur på Geilo', 'på et julebord i Bergen', 'i Kiel', 'på en bensinstasjon på Gardermoen', 'i et bryllup', 'på Roskilde', 'i en heis på jobb'];
  var LH_HVEM = EN ? ['with a colleague', 'with my brother-in-law', 'with someone I had just met', 'with three friends from school', 'all alone', 'with a former teacher']
    : ['med en kollega', 'med svogeren min', 'med en jeg nettopp hadde møtt', 'med tre venner fra videregående', 'helt alene', 'med en tidligere lærer'];
  var LH_DETALJ = EN ? ['mention a dog', 'say it cost 4,000', 'say the police showed up', 'say your mum still does not know', 'say it ended up on Snapchat', 'say you still have the receipt']
    : ['nevn en hund', 'si at det kostet 4 000 kroner', 'si at politiet kom innom', 'si at mamma fortsatt ikke vet om det', 'si at det havnet på Snapchat', 'si at du fortsatt har kvitteringen'];
  function lhIde() {
    lhIdeNr++;
    var v = function (l, n) { return l[(Math.floor(Math.random() * 997) + n) % l.length]; };
    return T('Si at det skjedde ', 'Say it happened ') + v(LH_STED, lhIdeNr) + ' ' + v(LH_HVEM, lhIdeNr) + ', og ' + v(LH_DETALJ, lhIdeNr) + T('. Hold deg til detaljene når de griller deg.', '. Stick to the details when they grill you.');
  }
  function lhTopp(tekst, chip, gul, klokke) { return jaTopp(tekst, chip, gul, klokke).replace('ja-topp', 'ja-topp lh-topp'); }
  function lhKort(s, merke, liten) {
    return '<div class="nr-kort lh-kort' + (liten ? ' liten' : '') + '">' + (merke ? '<span class="nr-type lh-merke">' + merke + '</span>' : '') + '<p>' + esc(s.tekst) + '</p></div>';
  }
  /** Grillspørsmål: ett om gangen – trykk for et nytt. */
  var LH_GRILL = [['Hvem var med?', 'Who was there?'], ['Hvor skjedde det?', 'Where was it?'], ['Hva sa du da?', 'What did you say?'], ['Hvor gammel var du?', 'How old were you?'],
    ['Hvor er den nå?', 'Where is it now?'], ['Hva skjedde rett etterpå?', 'What happened right after?'], ['Hvem andre vet om det?', 'Who else knows?'], ['Hvordan endte det?', 'How did it end?']];
  var lhGrillI = 0, lhGrillK = '';
  function lhGrill(han) {
    var g = LH_GRILL[lhGrillI % LH_GRILL.length];
    return '<button type="button" class="lh-grill" data-g="lh-grill"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v11H9l-5 4z"/><path class="q" d="M10 9.5a2 2 0 1 1 2.6 1.9c-.5.2-.6.5-.6 1.1M12 14h.01"/></svg>' +
      '<span><small>' + T('Grill ', 'Grill ') + han + '</small><b>«' + esc(T(g[0], g[1])) + '»</b></span></button>';
  }
  /** Stem: trykk = vanlig stemme, hold = helt sikker (dobbel innsats). Holdet overlever at skjermen tegnes på nytt. */
  var LH_HOLD_MS = 700, lhHold = null, lhHoldT = null;
  function lhStemKnapp(s, paa, tekst) {
    var valgt = s.minStemme === paa, h = lhHold && lhHold.paa === paa;
    return '<button type="button" class="lh-stemknapp ' + (paa === 'lyv' ? 'logn' : 'sant') + (h ? ' holder' : '') + '" data-paa="' + paa + '" aria-pressed="' + valgt + '"' +
      (h ? ' style="--hold:-' + Math.min(LH_HOLD_MS, Date.now() - lhHold.t0) + 'ms"' : '') + '><i class="lh-fyll" aria-hidden="true"></i><b>' + tekst + '</b>' +
      (valgt && s.minSikker ? '<em class="lh-x2">×2</em>' : '') + '</button>';
  }
  var LH_NESE = '<svg viewBox="0 0 80 40" aria-hidden="true"><circle cx="22" cy="20" r="15"/><rect x="22" y="17" width="54" height="7" rx="3.5"/><circle class="o" cx="18" cy="16" r="2.5"/></svg>';
  function forraederSpill(s) {
    var t = tilstand, jeg = t.meg === s.aktiv, han = esc(navn(s.aktiv)), nokkel = s.aktiv + ':' + s.runde, lyvRolle = s.hemmelig === 'lyv';
    var rTekst = T('Løgnhalsen', 'The liar');
    if (s.fase === 'ferdig') {
      var tavle = s.lurtTavle || [], best = tavle[0];
      return lhTopp(rTekst, T('Alle har sittet i stolen', 'Everyone has been in the chair'), true) +
        '<div class="rr-dom uenige inn"><span>' + T('Beste løgnhals', 'Best liar') + '</span><b>' + (best ? jaNavn(best.id) : T('Ingen lurte noen', 'Nobody fooled anyone')) + '</b>' +
          (tavle.length ? '<small>' + tavle.map(function (x) { return jaNavn(x.id) + T(' lurte ', ' fooled ') + x.n; }).join(' · ') + '</small>' : '') + '</div>' +
        lekSlutt([['runde', T('Spill igjen', 'Play again'), T('En ny runde i stolen – teller i kvelden', 'Another round in the chair – counts tonight')]]);
    }
    if (lhGrillK !== nokkel) { lhGrillK = nokkel; lhGrillI = Math.floor(Math.random() * LH_GRILL.length); }
    if (s.fase === 'svar') {
      if (jeg) return lhTopp(rTekst, T('Din tur', 'Your turn'), true) +
        lhKort(s, T('Fullfør høyt', 'Finish it out loud')) +
        '<button type="button" class="lh-kikk" aria-label="' + T('Hold for å se om du skal lyve eller si sannheten', 'Hold to see whether to lie or tell the truth') + '">' +
          '<span class="lh-bak">' + LH_NESE + '<b>' + T('Hold for å se', 'Hold to see') + '</b></span>' +
          '<span class="lh-forside ' + (lyvRolle ? 'logn' : 'sant') + '" aria-hidden="true"><b>' + (lyvRolle ? T('Lyv', 'Lie') : T('Sannhet', 'Truth')) + '</b><small>' +
            (lyvRolle ? T('Gjør det troverdig.', 'Make it believable.') : T('Fortell det som skjedde.', 'Tell what happened.')) + '</small></span>' +
        '</button>' +
        '<div class="lh-hjelp"><button type="button" data-g="lh-ide">' + T('Idé', 'Idea') + '</button>' +
          '<button type="button" data-g="lh-bytt"' + (s.byttet ? ' disabled' : '') + '>' + (s.byttet ? T('Byttet', 'Swapped') : T('Bytt kort', 'Swap card')) + '</button></div>' +
        '<p class="lh-ide" id="lhIde" hidden></p>' +
        '<button class="rom-stor-knapp" data-g="svart" type="button">' + T('Ferdig – grill meg', 'Done – grill me') + '</button>';
      return lhTopp(rTekst, han + T(' forteller', ' is telling'), true) + lhKort(s) + lhGrill(han) +
        (erVert() ? '<button class="rom-stor-knapp lh-hvit" data-g="svart" type="button">' + T('Til stemming', 'Go to voting') + '</button>' : '');
    }
    if (s.fase === 'stem') {
      if (jeg) return lhTopp(rTekst, T('De stemmer', 'They are voting'), true, true) + lhKort(s, '', true) +
        '<p class="lh-maske">' + T('Hold<br>masken.', 'Keep a<br>straight face.') + '</p>';
      return lhTopp(rTekst, han + T(' forteller', ' is telling'), true, true) + lhKort(s, '', true) + lhGrill(han) +
        '<div class="lh-stem">' + lhStemKnapp(s, 'sannhet', T('Sant', 'True')) + lhStemKnapp(s, 'lyv', T('Løgn', 'Lie')) + '</div>' +
        '<p class="lh-holdhint">' + T('Hold = helt sikker. Rett: del ut 1 · feil: drikk 4', 'Hold = absolutely sure. Right: hand out 1 · wrong: drink 4') + '</p>';
    }
    // Avsløringen: stempel, og bare det som gjelder deg
    var r = s.resultat || {}, inn = lhVist !== nokkel, lyv = r.svar === 'lyv', st = r.stemmer || {}, sk = r.sikker || {}, lurte = r.lurte || 0, rader = [];
    if (jeg) rader.push(lurte ? ['rett', lurte + T(' ble lurt', ' fooled'), T('Del ut ', 'Hand out ') + lurte] : ['feil', T('Ingen ble lurt', 'Nobody fooled'), T('Drikk 3', 'Drink 3')]);
    else {
      var mitt = st[t.meg];
      if (mitt) rader.push(mitt === r.svar
        ? ['rett', sk[t.meg] ? T('Helt sikker – og rett', 'Sure – and right') : T('Du så det', 'You saw it'), sk[t.meg] ? T('Del ut 1', 'Hand out 1') : T('Slipper', 'Safe')]
        : ['feil', sk[t.meg] ? T('Helt sikker – og lurt', 'Sure – and fooled') : T('Du ble lurt', 'You were fooled'), T('Drikk ', 'Drink ') + (sk[t.meg] ? 4 : 2)]);
      rader.push(lurte ? ['', han + T(' lurte ', ' fooled ') + lurte, T('Deler ut ', 'Hands out ') + lurte] : ['', han + T(' lurte ingen', ' fooled nobody'), T('Drikker 3', 'Drinks 3')]);
    }
    var andre = (r.drikker || []).filter(function (x) { return x.id !== s.aktiv && x.id !== t.meg; });
    if (andre.length) rader.push(['', andre.map(function (x) { return esc(x.navn) + ' ' + x.slurker; }).join(' · '), T('Drikker', 'Drink')]);
    var ut = lhTopp(rTekst, T('Avslørt', 'Revealed'), false) +
      '<div class="lh-avslor ' + (lyv ? 'logn' : 'sant') + '"><span>' + esc(s.tekst) + '</span>' +
        '<em class="lh-stempel' + (inn ? ' inn' : '') + '">' + (jeg ? (lyv ? T('Du løy!', 'You lied!') : T('Du sa sant!', 'You told the truth!')) : han + ' ' + (lyv ? T('løy!', 'lied!') : T('sa sant!', 'told the truth!'))) + '</em></div>' +
      '<ul class="lh-utfall' + (inn ? ' inn' : '') + '">' + rader.map(function (x, i) { return '<li class="' + x[0] + '" style="--i:' + i + '"><b>' + x[1] + '</b><span>' + x[2] + '</span></li>'; }).join('') + '</ul>' +
      '<button class="rom-stor-knapp" data-g="runde" type="button">' + ((s.runde || 1) >= (s.antall || (t.spillere || []).length) ? T('Se hvem som lurte flest', 'See who fooled the most') : T('Neste i stolen', 'Next in the chair')) + '</button>';
    lhVist = nokkel;
    return ut;
  }
  // Hold for å se: rollen vises bare mens fingeren ligger på kortet
  function lhSkjul() { document.querySelectorAll('.lh-kikk.vis').forEach(function (e) { e.classList.remove('vis'); }); }
  document.addEventListener('pointerdown', function (e) {
    var k = e.target.closest && e.target.closest('.lh-kikk'); if (!k) return;
    e.preventDefault(); try { k.setPointerCapture(e.pointerId); } catch (x) {}
    k.classList.add('vis'); try { navigator.vibrate && navigator.vibrate(10); } catch (x) {}
  });
  window.addEventListener('pointerup', lhSkjul); window.addEventListener('pointercancel', lhSkjul); window.addEventListener('blur', lhSkjul);
  document.addEventListener('contextmenu', function (e) { if (e.target.closest && e.target.closest('.lh-kikk,.lh-stemknapp')) e.preventDefault(); });
  document.addEventListener('keydown', function (e) { if ((e.key === ' ' || e.key === 'Enter') && e.target.classList && e.target.classList.contains('lh-kikk')) { e.preventDefault(); e.target.classList.add('vis'); } });
  document.addEventListener('keyup', function (e) { if (e.target.classList && e.target.classList.contains('lh-kikk')) lhSkjul(); });
  document.addEventListener('input', function (e) {
    if (e.target && e.target.id === 'sosInput' && tilstand && tilstand.spill && tilstand.spill.type === 'bloff') { var bl = document.getElementById('bfLinje'); if (bl) bl.textContent = e.target.value; return; }
    if (!e.target || e.target.id !== 'sosInput' || !tilstand || !tilstand.spill || tilstand.spill.type !== 'pannekort') return;
    var l = document.getElementById('pkLapp'); if (!l) return;
    var t = e.target.value.trim(); l.textContent = t || '…'; l.classList.toggle('tom', !t); l.style.fontSize = passFont(t || '…', 128, 26) + 'px';
  });
  // Sant / Løgn: kort trykk stemmer, hold i 0,7 s = helt sikker
  document.addEventListener('pointerdown', function (e) {
    var b = e.target.closest && e.target.closest('.lh-stemknapp'); if (!b || e.button > 0) return;
    e.preventDefault(); clearTimeout(lhHoldT);
    lhHold = { paa: b.dataset.paa, t0: Date.now() }; b.style.removeProperty('--hold'); b.classList.add('holder');
    lhHoldT = setTimeout(function () {
      var p = lhHold && lhHold.paa; lhHold = null; if (!p) return;
      try { navigator.vibrate && navigator.vibrate(20); } catch (x) {}
      gjorAlltid({ handling: 'stem', paa: p, sikker: true });
    }, LH_HOLD_MS);
  });
  function lhSlipp(avbryt) {
    if (!lhHold) return;
    var p = lhHold.paa; lhHold = null; clearTimeout(lhHoldT);
    if (avbryt) { document.querySelectorAll('.lh-stemknapp.holder').forEach(function (b) { b.classList.remove('holder'); }); return; }
    gjorAlltid({ handling: 'stem', paa: p, sikker: false });
  }
  window.addEventListener('pointerup', function () { lhSlipp(false); });
  window.addEventListener('pointercancel', function () { lhSlipp(true); });
  document.addEventListener('keydown', function (e) {
    var b = e.target.classList && e.target.classList.contains('lh-stemknapp') ? e.target : null;
    if (b && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); gjorAlltid({ handling: 'stem', paa: b.dataset.paa, sikker: false }); }
  });

  /* ---------- Drikke-bingo: bingotusjen ----------
     Trykk når låta går: en klatt lander på ruta. Fire på rad tegner en strek. Fullt brett: BINGO, og leken er ferdig.
     Klatter og streker spretter bare inn første gang de dukker opp (husket per runde). */
  var BG_LINJER = (function () { var l = []; for (var r = 0; r < 4; r++) { l.push([r * 4, r * 4 + 1, r * 4 + 2, r * 4 + 3]); l.push([r, r + 4, r + 8, r + 12]); } l.push([0, 5, 10, 15]); l.push([3, 6, 9, 12]); return l; })();
  var bgSett = {}, bgAntall = {}, bgRekkeTid = 0;
  var BG_KLATT = '<svg class="bg-klatt" viewBox="0 0 60 60" aria-hidden="true"><path d="M30 4c9 0 13 6 19 9s8 11 6 18-1 13-8 18-15 6-22 4-13-7-16-14-2-15 2-22 10-13 19-13z"/></svg>';
  function bgFont(t) {
    var l = Math.max.apply(null, String(t || '').split(/\s+/).map(function (w) { return w.length; }).concat([1]));
    return Math.max(8, Math.min(15, Math.floor(60 / (l * 0.72)), Math.floor(170 / (String(t || '').length * 0.66))));
  }
  function bingoSpill(s) {
    var b = s.mittBrett || [], m = s.mineMerker || [], r = s.runde || 1, meg = tilstand.meg, jegBingo = (s.bingo || []).indexOf(meg) !== -1;
    var ut = '<div class="bg-topp">' + jaTopp(T('Drikke-bingo', 'Drinking bingo'), s.ferdig ? 'Bingo!' : esc(s.tittel), !s.ferdig, false) +
      (erVert() && s.spotify ? '<a class="bg-lista" href="' + esc(s.spotify) + '" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/></svg>' + T('Lista', 'Playlist') + '</a>' : '') + '</div>';
    var fulle = BG_LINJER.map(function (l, k) { return l.every(function (x) { return m[x]; }) ? k : -1; }).filter(function (k) { return k !== -1; });
    var forr = bgAntall[r] == null ? fulle.length : bgAntall[r];
    if (fulle.length > forr && !s.ferdig) bgRekkeTid = Date.now();
    bgAntall[r] = fulle.length;
    ut += '<div class="bg-brett' + (s.ferdig && jegBingo && !bgSett[r + ':bingo'] ? ' hopp' : '') + '"><div class="bg-ruter">' + b.map(function (x, i) {
      var k = r + ':' + i, ny = m[i] && !bgSett[k]; if (m[i]) bgSett[k] = 1; else delete bgSett[k];
      return '<button type="button" data-g="merk" data-i="' + i + '" aria-pressed="' + !!m[i] + '"' + (s.ferdig ? ' disabled' : '') + '>' +
        (m[i] ? BG_KLATT.replace('class="bg-klatt"', 'class="bg-klatt' + (ny ? ' inn' : '') + '" style="--r:' + ((i * 47) % 50 - 25) + 'deg"') : '') +
        '<b style="font-size:' + bgFont(x[1]) + 'px' + (Math.max.apply(null, String(x[1]).split(/\s+/).map(function (w) { return w.length; })) > 12 ? ';overflow-wrap:anywhere' : '') + '">' + esc(x[1]) + '</b><span>' + esc(x[0]) + '</span></button>';
    }).join('') + '</div><svg class="bg-streker" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">' + (s.ferdig && jegBingo ? [] : fulle).map(function (k) {
      var l = BG_LINJER[k], a = l[0], z = l[3], ax = (a % 4 + .5) * 25, ay = (Math.floor(a / 4) + .5) * 25, zx = (z % 4 + .5) * 25, zy = (Math.floor(z / 4) + .5) * 25;
      var dx = Math.sign(zx - ax) * 4, dy = Math.sign(zy - ay) * 4, nk = r + ':l' + k, ny = !bgSett[nk]; bgSett[nk] = 1;
      return '<path' + (ny ? ' class="inn"' : '') + ' d="M' + (ax - dx) + ' ' + (ay - dy) + 'L' + (zx + dx) + ' ' + (zy + dy) + '"/>';
    }).join('') + '</svg>' + (s.ferdig && jegBingo ? '<span class="bg-bingo' + (bgSett[r + ':bingo'] ? '' : ' inn') + '">Bingo!</span>' : '') + '</div>';
    if (s.ferdig) bgSett[r + ':bingo'] = 1;
    var siden = Date.now() - bgRekkeTid;
    if (!s.ferdig && siden < 4000) ut += '<div class="bg-rekke" style="animation-delay:-' + siden + 'ms"><b>' + T('Rekke!', 'Line!') + '</b><span>' + T('Del ut 2 slurker', 'Hand out 2 sips') + '</span></div>';
    if (s.ferdig) {
      var vinner = (s.bingo || [])[0];
      ut += '<div class="hs-dom ' + (jegBingo ? 'rett' : 'feil') + ' inn"><b>' + (jegBingo ? T('Alle andre drikker opp', 'Everyone else finishes their drink') : 'Bingo ' + T('for ', 'for ') + esc(navn(vinner)) + T(' – drikk opp!', ' – finish your drink!')) + '</b></div>';
      return ut + lekSlutt([['runde', T('Spill igjen', 'Play again'), T('Nye brett – teller i kvelden', 'New boards – counts tonight')]]);
    }
    ut += erMobil() ? '' : bgAndre(s);   // på mobil ligger de andres brett bak «Mer», så ditt eget får plassen
    if (!m.some(Boolean)) ut += '<button class="bg-bytt" data-g="nytt-brett" type="button">' + T('Bytt brett', 'New board') + '</button>';
    return ut;
  }


  /* ---------- kort og terninger ---------- */
  function vn(v) { return v <= 10 ? String(v) : (EN ? { 11: 'J', 12: 'Q', 13: 'K', 14: 'A' } : { 11: 'Kn', 12: 'D', 13: 'K', 14: 'A' })[v]; }
  function kk(k, kl, attr) {
    if (!k) return '<span class="kk bak ' + (kl || '') + '"></span>';
    var rod = k.f === '♥' || k.f === '♦';
    return '<span class="kk ' + (rod ? 'rod ' : '') + (kl || '') + '"' + (attr || '') + '><b>' + vn(k.v) + '</b><i>' + k.f + '</i></span>';
  }
  var PRIKKER = { 1: [5], 2: [1, 9], 3: [1, 5, 9], 4: [1, 3, 7, 9], 5: [1, 3, 5, 7, 9], 6: [1, 3, 4, 6, 7, 9] };
  function terning(n) { var s = '<span class="dice" data-n="' + n + '">'; for (var i = 1; i <= 9; i++) s += '<i' + (PRIKKER[n].indexOf(i) !== -1 ? ' class="p"' : '') + '></i>'; return s + '</span>'; }
  var sisteKastNr = 0, presValg = [];

  function opusSpill(s) {
    var jeg = s.holder === tilstand.meg;
    var ny = s.nr !== sisteKastNr; sisteKastNr = s.nr;
    return '<p><a class="btn ghost small" href="https://open.spotify.com/search/Opus%20Eric%20Prydz" target="_blank" rel="noopener">' + T('«Opus» i Spotify ↗', '“Opus” on Spotify ↗') + '</a></p>' +
      '<p class="rom-etikett">' + T('Terningen er hos', 'The die is with') + '</p><p class="dl-holder">' + esc(navn(s.holder)) + (jeg ? T(' (deg!)', ' (you!)') : '') + '</p>' +
      '<div class="dl-terninger' + (ny && s.kast ? ' landet' : '') + '">' + terning(s.kast || 6) + '</div>' +
      '<p class="dl-melding dl-stor">' + (s.kast === 6 && s.fra ? T('SEKSER! ', 'SIX! ') + esc(navn(s.fra)) + T(' sendte videre.', ' passed it on.') : s.kast ? s.kast + (jeg ? T(' – trill igjen!', ' – roll again!') : '') : T('Start sangen og trill!', 'Start the song and roll!')) + '</p>' +
      (jeg ? '<button class="rom-stor-knapp" data-g="kast" type="button">' + T('Trill', 'Roll') + '</button>' : '<p class="small">' + T('Vent til terningen kommer til deg.', 'Wait until the die comes to you.') + '</p>') +
      '<p class="rom-status">' + s.antall + T(' kast', ' rolls') + '</p>' +
      (erVert() ? '<button class="btn ghost" data-g="drop" type="button">' + T('Droppet kom!', 'The drop hit!') + '</button>' : '');
  }
  /* ---------- Over eller under: potten ----------
     Den som har tur trykker OVER eller UNDER – eller verten svarer for hen, så ikke alle trenger telefonen oppe.
     Bare verten kan hoppe over. Kortet snus inn bare når det er nytt (husket per trekk). */
  var ouSett = {};
  function ouKort(k, kl) {
    var rod = k && (k.f === '♥' || k.f === '♦');
    return '<div class="ou-kort' + (rod ? ' rod' : '') + (kl ? ' ' + kl : '') + '"><b>' + (k ? vn(k.v) : '') + '</b><span>' + (k ? k.f : '') + '</span><b>' + (k ? vn(k.v) : '') + '</b></div>';
  }
  function overunderSpill(s) {
    var meg = tilstand.meg, vert = erVert(), jeg = s.tur === meg, si = s.sist, r = s.runde || 1;
    var nokkel = r + ':' + (s.n || 0), ny = !ouSett[nokkel]; ouSett[nokkel] = 1;
    var bom = si && !si.riktig, topp = T('Over eller under', 'Higher or lower');
    var chip = s.ferdig ? T('Stokken er tom', 'Deck’s empty') : jeg ? T('Din tur', 'Your turn') : esc(navn(s.tur)) + T(' gjetter', ' is guessing');
    var folk = '<div class="ou-folk">' + (s.ider || tilstand.spillere.map(function (p) { return p.id; })).map(function (id) {
      var d = (s.drukket || {})[id], oi = bom && ny && si.hvem === id;
      return '<div class="' + (id === s.tur && !s.ferdig ? 'tur' : '') + '">' + nrHode(id, '', oi ? 'oi' : '') + '<b>' + jaNavn(id) + '</b>' + (d ? '<span' + (oi ? ' class="inn"' : '') + '>−' + d + '</span>' : '') + '</div>';
    }).join('') + '</div>';
    var lag = '', antLag = Math.min(6, (bom && ny ? si.bunke : s.bunke) - 1);
    for (var i = antLag; i >= 1; i--) lag += '<i class="ou-lag' + (bom && ny ? ' sklir' : '') + '" style="--x:' + (-i * 4) + 'px;--y:' + (i * 4) + 'px;--r:' + ((i % 2 ? 1 : -1) * i * 1.2) + 'deg"></i>';
    var bord = '<div class="ou-bord"><div class="ou-bunke">' + lag + ouKort(s.kort, ny && s.n ? 'snu' : '') + '</div>' +
      '<div class="ou-pott"><span><b>' + s.bunke + '</b></span><small>' + T('I potten', 'In the pot') + '</small></div></div>';
    var tot = (s.over || 0) + (s.under || 0);
    var stripe = '<div class="ou-sjanse"><div><i style="transform:scaleX(' + (tot ? s.over / tot : .5).toFixed(3) + ')"></i></div><p><span>' + (s.over || 0) + T(' høyere igjen', ' higher left') + '</span><span>' + (s.under || 0) + T(' lavere igjen', ' lower left') + '</span></p></div>';
    var svar = si ? '<div class="ou-svar ' + (si.riktig ? 'rett' : 'feil') + (ny ? ' inn' : '') + '"><b>' + (si.riktig ? T('Riktig!', 'Right!') : jaNavn(si.hvem) + T(' bommet', ' missed')) + '</b><span>' +
      (si.riktig ? T('Potten vokser.', 'The pot grows.') : T('Drikker ', 'Drinks ') + si.bunke + T('. Potten starter på nytt.', '. The pot starts over.')) + '</span></div>' : '';
    var ut = jaTopp(topp, chip, jeg && !s.ferdig, false) + folk + bord + stripe + svar;
    if (s.ferdig) {
      return ut + (s.storst ? '<div class="hs-dom gul inn"><b>' + T('Største pott drukket: ', 'Biggest pot drunk: ') + jaNavn(s.storst.id) + ' – ' + s.storst.n + '</b></div>' : '') +
        lekSlutt([['runde', T('Spill igjen', 'Play again'), T('Ny stokk – teller i kvelden', 'New deck – counts tonight')]]);
    }
    var knapper = '<div class="ou-knapper"><button type="button" class="ou-over" data-g="ou-gjett" data-paa="over"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20V5M5 11l7-7 7 7"/></svg><b>' + T('Over', 'Higher') + '</b></button>' +
      '<button type="button" class="ou-under" data-g="ou-gjett" data-paa="under"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v15M5 13l7 7 7-7"/></svg><b>' + T('Under', 'Lower') + '</b></button></div>';
    if (jeg) return ut + knapper;
    if (vert) return ut + '<p class="ou-for">' + T('Svarer for ', 'Answering for ') + esc(navn(s.tur)) + '</p>' + knapper + '<button class="ou-hopp" data-g="ou-hopp" type="button">' + T('Hopp over ', 'Skip ') + esc(navn(s.tur)) + '</button>';
    return ut + '<p class="nr-vent">' + esc(navn(s.tur)) + T(' svarer – rop det høyt, så kan ', ' answers – shout it out and ') + esc(navn(tilstand.vert)) + T(' trykke.', ' can tap it.') + '</p>';
  }
  /* ---------- Veddeløpet: travbanen ----------
     Trykk på en bane for å vedde. Når alle har veddet (eller verten starter), går løpet av seg selv:
     telefonen til verten snur ett kort i sekundet, så ingen andre trenger telefonen oppe. */
  var VL_F = ['♥', '♠', '♦', '♣'], vlSats = 2, vlTimer = null, vlSett = {}, vlPos = {};
  /* Veddeløpet har musikk og kommentator (public/lyd/veddelop/, laget med ElevenLabs). Vertens telefon spiller dem –
     men ikke når en TV er koblet til, for da er det TV-en som er høyttaleren. Bare når lyden er på. */
  var VL_FIL = { '♥': 'hjerter', '♠': 'spar', '♦': 'ruter', '♣': 'klover' };
  var vlLydSt = { runde: 0, fase: '', leder: '', jevnt: false, sist: 0, n: 0, pos: null }, vlMusikkEl = null, vlUtsettTil = 0;
  var VL_ANT = { start: 4, fram: 4, tilbake: 2, leder: 3, jevnt: 3, vinner: 2, seier: 3, fyll: 4 };   // antall varianter per replikk
  function vlVariant(navn) { var n = VL_ANT[navn.split('-')[0]] || 1; return navn + '-' + 'abcd'.charAt(Math.floor(Math.random() * n)); }
  function vlMusikk(paa) {
    if (paa) {
      if (!vlMusikkEl) { vlMusikkEl = new Audio('/lyd/veddelop/musikk.mp3'); vlMusikkEl.loop = true; }
      vlMusikkEl.volume = 0.35; var p = vlMusikkEl.play(); if (p && p.catch) p.catch(function () {});
    } else if (vlMusikkEl && !vlMusikkEl.paused) {
      var el = vlMusikkEl, fade = setInterval(function () { el.volume = Math.max(0, el.volume - 0.05); if (el.volume <= 0.01) { clearInterval(fade); el.pause(); el.currentTime = 0; } }, 80);
    }
  }
  function vlSi(navn, tving) {
    var naa = Date.now(); if (!tving && naa - vlLydSt.sist < 2300) return false; vlLydSt.sist = naa;
    try { var a = new Audio('/lyd/veddelop/' + navn + '.mp3'); a.volume = 0.9; var p = a.play(); if (p && p.catch) p.catch(function () {}); } catch (e) {}
    return true;
  }
  function vlLyd(s) {
    var r = s.runde || 1, f = s.fase;
    if (f === 'ferdig' && vlLydSt.fase !== 'ferdig') vlUtsettTil = Date.now() + 5500;   // alle venter med slurkene til jubelen er over
    if (!lyd.paa || !erVert() || tilstand.skjermPin) { vlMusikk(false); vlLydSt.fase = f; return; }
    if (r !== vlLydSt.runde) vlLydSt = { runde: r, fase: '', leder: '', jevnt: false, sist: 0 };
    if (f === 'lop' && vlLydSt.fase !== 'lop') { vlMusikk(true); vlLydSt.sist = 0; vlSi(vlVariant('start'), true); vlLydSt.pos = Object.assign({}, s.pos || {}); }
    if (f === 'lop' && s.n !== vlLydSt.n) {
      // Nytt kort: hva skjedde? Tilbake-rykk først, så lederskifte, så jevnt, ellers «rykker fram»
      vlLydSt.n = s.n;
      var pos = s.pos || {}, forrige = vlLydSt.pos || {}, best = -1, leder = '', delt = false, tilbake = '';
      VL_F.forEach(function (x) { var p = pos[x] || 0; if (p < (forrige[x] || 0)) tilbake = x; if (p > best) { best = p; leder = x; delt = false; } else if (p === best) delt = true; });
      vlLydSt.pos = Object.assign({}, pos);
      var sist = '', verst = 99; VL_F.forEach(function (x) { var p = pos[x] || 0; if (p < verst) { verst = p; sist = x; } });
      var sistAlene = VL_F.filter(function (x) { return (pos[x] || 0) === verst; }).length === 1 && best - verst >= 3;
      if (tilbake) vlSi(vlVariant('tilbake-' + VL_FIL[tilbake]));
      else if (best >= 2 && !delt && leder !== vlLydSt.leder && vlSi(vlVariant('leder-' + VL_FIL[leder]))) vlLydSt.leder = leder;
      else if (best >= 6 && delt && !vlLydSt.jevnt && vlSi(vlVariant('jevnt'))) vlLydSt.jevnt = true;
      else if (sistAlene && !vlLydSt.sistSagt && vlSi('sist-' + VL_FIL[sist])) vlLydSt.sistSagt = true;
      else if (best >= 3 && Math.random() < 0.3) vlSi(vlVariant('fyll'));
      else if (s.sist && s.sist.f) vlSi(vlVariant('fram-' + VL_FIL[s.sist.f]));
    }
    if (f === 'ferdig' && vlLydSt.fase !== 'ferdig') {
      // I mål: jubel og «X VINNER!» først. Slurkene kommer etterpå (drikk-varselet venter).
      vlMusikk(false); vlUtsettTil = Date.now() + 5500;
      try { var j = new Audio('/lyd/veddelop/jubel.mp3'); j.volume = 0.8; var pj = j.play(); if (pj && pj.catch) pj.catch(function () {}); } catch (e) {}
      var v = s.vinner; setTimeout(function () { vlLydSt.sist = 0; if (v) vlSi(vlVariant('vinner-' + VL_FIL[v]), true); }, 900);
      setTimeout(function () { vlLydSt.sist = 0; vlSi(vlVariant('seier'), true); }, 3800);
    }
    vlLydSt.fase = f;
  }
  function vlNavn(f) { return (EN ? { '♥': 'Hearts', '♠': 'Spades', '♦': 'Diamonds', '♣': 'Clubs' } : { '♥': 'Hjerter', '♠': 'Spar', '♦': 'Ruter', '♣': 'Kløver' })[f]; }
  /** Klokkene i lekene drives av den telefonen som er våken: verten først, de andre halvannet sekund etter.
      Da stopper ikke leken om vertens telefon ligger i lomma. Serveren holder takten uansett. */
  function driverVent() { return erVert() ? 0 : 1500; }
  function vlDriv() {
    if (vlTimer) return;
    vlTimer = setInterval(function () {
      var sp = tilstand && tilstand.spill;
      if (!sp || sp.type !== 'veddelopet' || sp.fase !== 'lop') { clearInterval(vlTimer); vlTimer = null; return; }
      if (document.hidden) return;
      gjorAlltid({ handling: 'snu' });
    }, 2600 + driverVent());
  }
  function veddelopetSpill(s) {
    vlLyd(s);
    var meg = tilstand.meg, vert = erVert(), f = s.fase, mv = s.mittVeddemaal, vm = s.veddemaal || {}, r = s.runde || 1;
    if (mv && f === 'vedd') vlSats = mv.slurker;
    if (f === 'lop' && vert) vlDriv();
    var antVeddet = Object.keys(vm).length, alle = (tilstand.spillere || []).length;
    var chip = f === 'vedd' ? (antVeddet >= alle ? T('Klar … ferdig …', 'Ready … set …') : T('Vedd på en hest', 'Bet on a horse')) : f === 'lop' ? T('Løpet går!', 'They’re off!') : vlNavn(s.vinner) + T(' vant!', ' won!');
    var jegVant = mv && s.vinner === mv.farge;
    var ut = jaTopp(T('Veddeløpet', 'The horse race'), chip, f === 'vedd', false);
    ut += '<p class="vl-hjelp">' + (f === 'vedd' ? T('Trykk på banen du tror vinner.', 'Tap the lane you think wins.') : f === 'lop' ? T('Ett kort i sekundet. Sidekortene sender en hest ett steg tilbake.', 'One card a second. Side cards send a horse one step back.') : '') + '</p>';
    var sider = '<div class="vl-sider">' + s.bane.map(function (k, i) {
      var snudd = !!(s.snudd || [])[i] || !!k, ny = snudd && !vlSett[r + ':s' + i]; if (snudd) vlSett[r + ':s' + i] = 1;
      return '<span class="vl-side' + (snudd ? ' snudd' : '') + (ny ? ' ny' : '') + '" style="--i:' + (i + 1) + '"><span><i class="bak"></i><i class="fram' + (k && (k.f === '♥' || k.f === '♦') ? ' rod' : '') + '">' + (k ? k.f : '') + '</i></span></span>';
    }).join('') + '</div>';
    var baner = VL_F.map(function (x) {
      var hoder = Object.keys(vm).filter(function (id) { return vm[id].farge === x; });
      var vant = s.vinner === x, valgt = mv && mv.farge === x, rod = x === '♥' || x === '♦';
      var pNa = Math.min(8, s.pos[x] || 0), pFra = vlPos[r + ':' + x], flytt = pFra != null && pFra !== pNa; vlPos[r + ':' + x] = pNa;
      var inn = '<i class="vl-mal"></i><span class="vl-hest' + (flytt ? ' flytt' : '') + '" style="--p:' + pNa + ';--fra:' + (flytt ? pFra : pNa) + '"><span class="' + (f === 'lop' ? 'galopp' : '') + (rod ? ' rod' : '') + '"><b>A</b><span>' + x + '</span></span></span>' +
        (vant ? '<span class="vl-rosett">1</span>' : '') +
        '<span class="vl-hoder">' + hoder.map(function (id) { return nrHode(id, f === 'vedd' ? 'inn' : '', f === 'ferdig' && !vant ? 'oi' : ''); }).join('') + '</span>';
      var kl = 'vl-bane' + (valgt ? ' valgt' : '') + (vant ? ' vant' : '');
      return f === 'vedd' ? '<button type="button" class="' + kl + '" data-g="vl-vedd" data-farge="' + x + '" aria-pressed="' + !!valgt + '" aria-label="' + vlNavn(x) + '">' + inn + '</button>' : '<div class="' + kl + '">' + inn + '</div>';
    }).join('');
    ut += '<div class="vl-banen">' + sider + '<div class="vl-baner">' + baner + '</div></div>';
    if (f === 'vedd') {
      ut += '<div class="vl-sats"><span>' + T('Innsats', 'Stake') + '</span><button type="button" data-g="vl-sats" data-d="-1" aria-label="' + T('Færre slurker', 'Fewer sips') + '">−</button><b>' + vlSats + '</b>' +
        '<button type="button" class="pluss" data-g="vl-sats" data-d="1" aria-label="' + T('Flere slurker', 'More sips') + '">+</button></div>' +
        '<div class="ts-status"><span class="ts-stemt">' + Object.keys(vm).map(function (id) { return nrHode(id, 'inn', ''); }).join('') + '</span><b>' +
        (antVeddet >= alle ? T('Alle har veddet – løpet starter …', 'Everyone’s in – the race starts …') : antVeddet + T(' av ', ' of ') + alle + T(' har veddet', ' have bet')) + '</b></div>' +
        fristHtml(tilstand.spill, T('sekunder til løpet starter', 'seconds until the race starts'));
      if (vert && antVeddet && antVeddet < alle) ut += '<button class="rom-stor-knapp" data-g="vl-start" type="button">' + T('Start løpet nå', 'Start the race now') + '</button>';
      return ut;
    }
    if (s.sist) {
      var nk = r + ':t' + s.n, nyT = !vlSett[nk]; vlSett[nk] = 1;
      ut += '<div class="vl-trekk"><span class="' + (nyT ? 'inn' : '') + '">' + ouKort(s.sist, 'liten') + '</span><b>' + vlNavn(s.sist.f) + T(' rykker fram', ' moves up') + '</b></div>';
    }
    if (f === 'ferdig') {
      ut += mv ? '<div class="hs-dom ' + (jegVant ? 'rett' : 'feil') + ' inn"><b>' + (jegVant ? T('Du vant! Del ut ', 'You won! Hand out ') + mv.slurker * 2 : T('Du tapte – drikk ', 'You lost – drink ') + mv.slurker) + '</b></div>' : '';
      return ut + lekSlutt([['runde', T('Spill igjen', 'Play again'), T('Nytt løp – teller i kvelden', 'New race – counts tonight')]]);
    }
    return ut;
  }
  /* ---------- Pyramiden: pokerfjes i halvmørket ----------
     Mørk filt og messing, så den ikke ligner den lyse pyramiden i Bussruta. Kortene dine ligger med baksiden opp; hold
     fingeren på dem for å kikke. Vertens telefon snur ett kort hvert tiende sekund. Legg på et kort med baksiden opp –
     riktig verdi er sant, feil er bløff. LØGN! snur kortet. Bevegelse bare når noe skjer første gang. */
  var pySett = {}, pyDriver = null, pyVelg = false, pyAvsl = null, pyAvslTil = 0, pyLytt = false, pySistPos = 0;
  function pyKort(k, kl) {
    if (!k) return '<span class="py-kort bak' + (kl ? ' ' + kl : '') + '"></span>';
    var rod = k.f === '♥' || k.f === '♦';
    return '<span class="py-kort' + (rod ? ' rod' : '') + (kl ? ' ' + kl : '') + '"><b>' + vn(k.v) + '</b><i>' + k.f + '</i></span>';
  }
  function pyRad(pos) { return pos < 5 ? 1 : pos < 9 ? 2 : pos < 12 ? 3 : pos < 14 ? 4 : 5; }
  function pyDriv() {
    // Bare verten: ett kort hvert tiende sekund, så ingen trenger å trykke «snu»
    if (pyDriver) return;
    pyDriver = setInterval(function () {
      var sp = tilstand && tilstand.spill;
      if (!sp || sp.type !== 'pyramiden' || sp.ferdig) { clearInterval(pyDriver); pyDriver = null; return; }
      if (document.hidden) return;
      if (Date.now() + klokkeAvvik - sp.snuddVed >= sp.vindu + driverVent()) gjorAlltid({ handling: 'snu' });
    }, 1000);
  }
  function pyKikk() {
    // Kikk uten ny tegning: klassen settes rett på hånda mens fingeren ligger på
    if (pyLytt) return; pyLytt = true;
    var av = function () { var h = document.querySelector('.py-hand.kikk:not(.velg)'); if (h) h.classList.remove('kikk'); };
    document.addEventListener('pointerdown', function (e) { var h = e.target.closest && e.target.closest('.py-hand'); if (h) h.classList.add('kikk'); });
    document.addEventListener('pointerup', av); document.addEventListener('pointercancel', av);
    document.addEventListener('contextmenu', function (e) { if (e.target.closest && e.target.closest('.py-hand')) e.preventDefault(); });
  }
  function pyDrikker(id, n) { return (id === tilstand.meg ? T('Du drikker ', 'You drink ') : esc(navn(id)) + T(' drikker ', ' drinks ')) + n + '.'; }
  function pyramidenSpill(s) {
    var meg = tilstand.meg, vert = erVert(), naaI = s.pos - 1, naa = s.pyr[naaI], rad = pyRad(naaI), past = s.pastander || [];
    if (s.pos < pySistPos) pySett = {};
    if (pySistPos && s.pos > pySistPos) spillLyd('kortsnu');
    pySistPos = s.pos;
    if (!s.ferdig) pyDriv();
    pyKikk();
    var topp = '<div class="py-topp"><span>' + T('Pyramiden', 'The pyramid') + '</span><b>' + (s.ferdig ? T('Toppen er snudd', 'The top is flipped') : T('Rad ', 'Row ') + rad + T(' · del ut ', ' · hand out ') + rad) + '</b>' +
      (s.ferdig ? '' : '<small>' + (15 - s.pos) + T(' kort igjen', ' cards left') + '</small>') + '</div>';
    var RADER = [[14], [12, 13], [9, 10, 11], [5, 6, 7, 8], [0, 1, 2, 3, 4]];
    var pyr = '<div class="py-pyr">' + RADER.map(function (r, ri) {
      return '<div><em' + (5 - ri === rad && !s.ferdig ? ' class="naa"' : '') + '>' + (5 - ri) + '</em>' + r.map(function (i) {
        if (i >= s.pos) return pyKort(null, 'liten');
        var er = i === naaI && !s.ferdig, ny = er && pySett.start && !pySett['k' + i];
        return '<span class="py-plass' + (er ? ' naa' : '') + '">' + pyKort(s.pyr[i], 'liten' + (ny ? ' snu' : '')) + (er && past.length ? '<small>' + past.length + '</small>' : '') + '</span>';
      }).join('') + '</div>'; }).join('') + '</div>';
    for (var q = 0; q < s.pos; q++) pySett['k' + q] = 1;
    // LØGN!: kortet snus stort et lite øyeblikk, for alle
    var av = s.avsl;
    if (av && !pySett['a' + av.nr]) { pySett['a' + av.nr] = 1; if (pySett.start) { pyAvsl = av; pyAvslTil = Date.now() + 2800; setTimeout(tegn, 2900); } }
    pySett.start = 1;
    var avsl = pyAvsl && Date.now() < pyAvslTil ? '<div class="py-avsl" role="status"><span class="py-avsl-over">' + jaNavn(pyAvsl.av) + T(' ropte løgn på ', ' called out ') + (pyAvsl.id === meg ? T('deg', 'you') : esc(navn(pyAvsl.id))) + '</span>' +
      '<span class="py-avsl-kort">' + pyKort(pyAvsl.kort, 'stor snu') + '<em class="' + (pyAvsl.sant ? 'sant' : 'bloff') + '">' + (pyAvsl.sant ? T('Sant', 'True') : T('Bløff', 'Bluff')) + '</em></span>' +
      '<b>' + (pyAvsl.sant ? jaNavn(pyAvsl.id) + T(' hadde den. ', ' had it. ') + pyDrikker(pyAvsl.av, pyAvsl.n) : jaNavn(pyAvsl.id) + T(' bløffet! ', ' bluffed! ') + pyDrikker(pyAvsl.id, pyAvsl.n)) + '</b></div>' : '';
    if (s.ferdig) {
      pyVelg = false;
      var lurt = s.lurt || {}, best = Object.keys(lurt).sort(function (a, b) { return lurt[b] - lurt[a]; })[0], hender = s.fasit || {};
      return '<div class="py-bord ferdig">' + topp + pyr + '<div class="py-slutt"><p class="py-etikett">' + T('Største bløffer', 'Biggest bluffer') + '</p><b>' + (best ? jaNavn(best) : T('Ingen – for ærlige folk!', 'Nobody – too honest!')) + '</b>' +
        (best ? '<small>' + lurt[best] + (lurt[best] === 1 ? T(' bløff', ' bluff') : T(' bløffer', ' bluffs')) + T(' uten å bli tatt', ' without getting caught') + '</small>' : '') + '</div>' +
        '<div class="py-hender">' + Object.keys(hender).map(function (id) { return '<div>' + nrHode(id) + '<b>' + jaNavn(id) + '</b><span>' + (hender[id].length ? hender[id].map(function (k) { return pyKort(k, 'mini'); }).join('') : T('tom hånd', 'empty hand')) + '</span></div>'; }).join('') + '</div></div>' +
        avsl + lekSlutt([['runde', T('Spill igjen', 'Play again'), T('Ny pyramide – teller i kvelden', 'New pyramid – counts tonight')]]);
    }
    var NAVN = EN ? { 11: 'jack', 12: 'queen', 13: 'king', 14: 'ace' } : { 11: 'knekt', 12: 'dame', 13: 'konge', 14: 'ess' };
    var vindu = Math.max(0, Math.min(s.vindu, Date.now() + klokkeAvvik - s.snuddVed));
    var liste = past.map(function (p) {
      var min = p.id === meg, nk = 'p' + naaI + p.id, ny = !pySett[nk]; pySett[nk] = 1;
      var domm = p.avgjort === 'sant' ? '<span class="py-domm sant">' + T('Sant', 'True') + '</span>' : p.avgjort === 'bløff' ? '<span class="py-domm bloff">' + T('Bløff', 'Bluff') + '</span>' : '';
      return '<div class="py-past' + (ny ? ' inn' : '') + '">' + nrHode(p.id) + '<span><b>' + jaNavn(p.id) + '</b><small>' +
        (min ? T('Du la på ', 'You laid ') + (p.kort ? vn(p.kort.v) + p.kort.f : '') + T(' – delte ut ', ' – handed out ') + p.rad : T('la på et kort og deler ut ', 'laid a card and hands out ') + p.rad) +
        (p.av ? ' · ' + jaNavn(p.av) + T(' ropte løgn', ' called it') : '') + '</small></span>' +
        (domm || (min ? '' : '<button type="button" class="py-logn" data-g="utfordre" data-paa="' + p.id + '">' + T('LØGN!', 'LIAR!') + '</button>')) + '</div>';
    }).join('');
    var hand = s.minHand, minPast = past.some(function (p) { return p.id === meg; });
    if (minPast || !hand || !hand.length) pyVelg = false;
    var handHtml = !hand ? '<p class="py-etikett">' + T('Du er med fra neste pyramide.', 'You’re in from the next pyramid.') + '</p>'
      : !hand.length ? '<p class="py-etikett">' + T('Tom hånd – fint spilt!', 'Empty hand – well played!') + '</p>'
      : '<p class="py-etikett">' + (pyVelg ? T('Velg kortet du legger på', 'Pick the card to lay') : T('Hold fingeren på kortene for å kikke', 'Hold your finger on the cards to peek')) + '</p>' +
        '<div class="py-hand' + (pyVelg ? ' kikk velg' : '') + '" style="--n:' + hand.length + '">' + hand.map(function (k, i) {
          return '<button type="button" class="py-hk" data-g="py-velg" data-i="' + i + '" style="--i:' + i + '"' + (pyVelg ? '' : ' tabindex="-1"') + ' aria-label="' + (pyVelg ? vn(k.v) + k.f : T('Skjult kort', 'Hidden card')) + '">' + pyKort(k) + '</button>'; }).join('') + '</div>' +
        '<button type="button" class="py-legg' + (minPast ? ' brukt' : pyVelg ? ' avbryt' : '') + '" data-g="py-modus"' + (minPast ? ' disabled' : '') + '>' +
          (minPast ? T('Du har lagt på', 'You’ve laid a card') : pyVelg ? T('Avbryt', 'Cancel') : T('Legg på et kort', 'Lay a card')) + '</button>';
    return '<div class="py-bord">' + topp + pyr + '<div class="py-vindu" aria-hidden="true"><i style="animation-duration:' + s.vindu + 'ms;animation-delay:-' + vindu + 'ms"></i></div>' +
      '<div class="py-liste">' + (liste || '<p class="py-tom">' + T('Ingen har lagt på ennå. Har du en ', 'Nobody has laid a card yet. Got a ') + (naa ? (NAVN[naa.v] || naa.v) : '') + '?</p>') + '</div>' +
      handHtml + '</div>' + avsl;
  }
  /* ---------- Fuck the Dealer: tastaturet og tellebrettet ----------
     Krem og mint, hard skygge. Bare dealeren ser kortet og tastaturet; de andre ser tellebrettet og hvem som deler.
     Ett kort på brettet per avgjørelse. Kortet snus for alle når det er avgjort, slurkene smeller inn under. */
  var ftdSett = {}, ftdSistPos = null;
  function ftdVn(v) { return v === 1 ? 'A' : v <= 10 ? String(v) : (EN ? { 11: 'J', 12: 'Q', 13: 'K' } : { 11: 'Kn', 12: 'D', 13: 'K' })[v]; }
  function ftdKort(k, kl) {
    if (!k) return '<span class="ftd-kort bak' + (kl ? ' ' + kl : '') + '"></span>';
    var rod = k.f === '♥' || k.f === '♦';
    return '<span class="ftd-kort' + (rod ? ' rod' : '') + (kl ? ' ' + kl : '') + '"><b>' + ftdVn(k.v) + '<i>' + k.f + '</i></b><em>' + ftdVn(k.v) + '</em></span>';
  }
  function ftdPrikker(n, kl) {
    var ut = '<span class="ftd-prikker' + (kl ? ' ' + kl : '') + '" aria-label="' + n + T(' av 3 bom', ' of 3 misses') + '">';
    for (var i = 0; i < 3; i++) ut += '<i' + (i < n ? ' class="paa"' : '') + '></i>';
    return ut + '</span>';
  }
  function ftdBrett(s, stort) {
    var ut = '<div class="ftd-brett' + (stort ? ' stor' : '') + '" aria-label="' + T('Tellebrettet', 'The tally board') + '">';
    for (var v = 1; v <= 13; v++) {
      var n = s.brukt[v] || 0;
      ut += '<div' + (n >= 4 ? ' class="ute"' : '') + '><b>' + ftdVn(v) + '</b>';
      for (var i = 0; i < 4; i++) ut += '<i' + (i < n ? ' class="full' + (n >= 4 ? ' rod' : '') + '"' : '') + '></i>';
      ut += '</div>';
    }
    return ut + '</div>';
  }
  function dealerSpill(s) {
    var meg = tilstand.meg, vert = erVert(), jeg = s.dealer === meg, styrer = jeg || vert, k = s.kort, r = s.res;
    if (s.runde && ftdSett.runde !== s.runde) ftdSett = { runde: s.runde };
    if (ftdSistPos !== null && s.pos !== ftdSistPos && s.fase !== 'ferdig') spillLyd('kortsnu');
    ftdSistPos = s.pos;
    var topp = '<div class="ftd-topp"><div><span>Fuck the Dealer · ' + (s.pos + (s.fase === 'ferdig' ? 0 : 1)) + ' / 52</span><b>' +
      (s.fase === 'ferdig' ? T('Stokken er tom', 'The deck is empty') : jeg ? T('Du deler', 'You deal') : esc(navn(s.dealer)) + T(' deler', ' deals')) + '</b></div>' +
      (s.fase === 'ferdig' ? '' : ftdPrikker(s.bom)) + '</div>';
    if (s.fase === 'ferdig') {
      var dr = s.drukket || {}, dt = s.dealt || {}, rekke = (s.ider || []).slice().sort(function (a, b) { return (dr[b] || 0) - (dr[a] || 0); }), topp1 = rekke[0];
      return '<div class="ftd">' + topp + '<div class="ftd-dealer"><span class="ftd-visir"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11c0-2 2-3 9-3s9 1 9 3l-2 4H5z"/><path d="M8 8V6a4 4 0 0 1 8 0v2"/></svg></span>' +
        '<div><small>' + T('Kveldens dealer', 'Dealer of the night') + '</small><b>' + (topp1 ? jaNavn(topp1) : '–') + '</b><span>' + (topp1 ? T('Drakk ', 'Drank ') + (dr[topp1] || 0) + T(' slurker bak stokken.', ' sips behind the deck.') : '') + '</span></div></div>' +
        '<p class="ftd-etikett">' + T('Slurker som dealer', 'Sips as dealer') + '</p><div class="ftd-liste">' + rekke.map(function (id, i) {
          return '<div class="ftd-rad' + (i === 0 ? ' topp' : '') + '"><em>' + (i + 1) + '</em>' + nrHode(id) + '<b>' + jaNavn(id) + '</b><small>' + (dt[id] || 0) + T(' kort delt', ' cards dealt') + '</small><strong>' + (dr[id] || 0) + '</strong></div>'; }).join('') + '</div>' +
        lekSlutt([['runde', T('Spill igjen', 'Play again'), T('Ny stokk – nestemann deler', 'New deck – next one deals')]]) + '</div>';
    }
    // Avgjort: kortet snus for alle, slurkene smeller inn
    if (s.fase === 'res' && r) {
      var ny = !ftdSett['r' + r.nr]; ftdSett['r' + r.nr] = 1;
      var treff = r.type !== 'bom';
      var smell = treff
        ? '<div class="ftd-smell treff' + (ny ? ' inn' : '') + '"><small>' + (r.type === 'treff1' ? T('Treff på første · dealeren drikker kortet', 'First-try hit · the dealer drinks the card') : T('Treff på andre · dealeren drikker halve', 'Second-try hit · the dealer drinks half')) + '</small><b>' + r.n + '</b><span>' + (jeg ? T('Fuck the dealer 🍻', 'Fuck the dealer 🍻') : esc(navn(s.dealer)) + T(' drikker', ' drinks')) + '</span></div>'
        : '<div class="ftd-smell bom' + (ny ? ' inn' : '') + '"><small>' + T('Avstanden ', 'The distance ') + ftdVn(r.g) + '–' + ftdVn(r.kort.v) + T(' · gjetteren drikker', ' · the guesser drinks') + '</small><b>' + r.n + '</b></div>';
      var gjett = treff ? '' : '<div class="ftd-gjettet"><span><small>' + T('Gjettet', 'Guessed') + '</small><b>' + ftdVn(r.g1) + '</b><b>' + ftdVn(r.g) + '</b></span><i>→</i></div>';
      var videre = s.bom >= 3 ? '<p class="ftd-merk">' + T('Tre bom på rad – stokken går videre.', 'Three misses in a row – the deck moves on.') + '</p>' : '';
      return '<div class="ftd' + (treff ? ' morkt' : '') + '">' + topp + '<div class="ftd-res">' + gjett + ftdKort(r.kort, 'stor' + (ny ? ' snu' : '')) + smell + '</div>' + videre +
        (styrer ? '<button type="button" class="rom-stor-knapp ftd-neste" data-g="ftd-neste">' + T('Neste kort →', 'Next card →') + '</button>' : '<p class="nr-vent">' + esc(navn(s.dealer)) + T(' trykker neste.', ' taps next.') + '</p>') +
        ftdBrett(s) + '</div>';
    }
    var andre = s.fase === 'andre';
    var hint = andre ? '<div class="ftd-hint"><span class="ftd-pil' + (s.hint === 'hoy' ? '' : ' ned') + '"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20V4"/><path d="M5 11l7-7 7 7"/></svg></span><div><small>' + (jeg ? T('Si høyt', 'Say it out loud') : esc(navn(s.dealer)) + T(' sier', ' says')) + '</small><b>' + (s.hint === 'hoy' ? T('«Høyere»', '“Higher”') : T('«Lavere»', '“Lower”')) + '</b><span>' + T('enn ', 'than ') + ftdVn(s.g1) + '</span></div></div>' : '';
    var bytt = s.bytt && !ftdSett['b' + s.pos] ? '<p class="ftd-merk inn">' + (s.bytt.fra === meg ? T('Tre bom på rad – stokken gikk til ', 'Three misses in a row – the deck went to ') + esc(navn(s.bytt.til)) + '.' : jeg ? T('Tre bom på rad hos ', 'Three misses in a row for ') + esc(navn(s.bytt.fra)) + T(' – du deler nå!', ' – you deal now!') : T('Stokken gikk til ', 'The deck went to ') + esc(navn(s.bytt.til)) + '.') + '</p>' : '';
    if (!styrer) {
      // De andre: hvem som deler, hva som ble sagt, og tellebrettet
      return '<div class="ftd">' + topp + bytt + '<div class="ftd-vent"><span class="ftd-visir"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11c0-2 2-3 9-3s9 1 9 3l-2 4H5z"/><path d="M8 8V6a4 4 0 0 1 8 0v2"/></svg></span>' +
        '<div><b>' + (andre ? T('Ett forsøk til', 'One more try') : T('Noen gjetter', 'Someone guesses')) + '</b><span>' + (andre ? esc(navn(s.dealer)) + T(' sa «', ' said “') + (s.hint === 'hoy' ? T('høyere', 'higher') : T('lavere', 'lower')) + T('» enn ', '” than ') + ftdVn(s.g1) : T('Si en verdi høyt – ', 'Call a value out loud – ') + esc(navn(s.dealer)) + T(' trykker den.', ' taps it.')) + '</span></div></div>' +
        ftdBrett(s, true) + '</div>';
    }
    // Dealeren (eller verten for en dealer som er borte): kortet og tastaturet
    var nyttKort = !ftdSett['k' + s.pos]; ftdSett['k' + s.pos] = 1;
    var taster = '';
    for (var v = 1; v <= 13; v++) {
      var ute = (s.brukt[v] || 0) >= 4, feilSide = andre && ((s.hint === 'hoy' && v <= s.g1) || (s.hint === 'lav' && v >= s.g1));
      taster += '<button type="button" class="ftd-tast' + (ute ? ' ute' : feilSide ? ' ute' : andre ? ' mulig' : '') + (andre && v === s.g1 ? ' streket' : '') + (v === 13 ? ' bred' : '') + '" data-g="ftd-gjett" data-v="' + v + '"' + (ute || feilSide ? ' disabled' : '') + '>' + ftdVn(v) + '</button>';
    }
    var treffN = andre ? Math.ceil(k.v / 2) : k.v;
    return '<div class="ftd">' + topp + bytt + '<div class="ftd-hode">' + ftdKort(k, nyttKort ? 'inn' : '') + '<div class="ftd-hode-t">' +
      (jeg ? '<span class="ftd-bare"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18"/><path d="M10.6 10.6a2 2 0 0 0 2.8 2.8"/><path d="M9.9 5.1A10 10 0 0 1 21 12a10.7 10.7 0 0 1-2.2 3.2"/><path d="M6.6 6.6A10.6 10.6 0 0 0 3 12a10 10 0 0 0 13.4 4.4"/></svg>' + T('Bare du', 'Only you') + '</span>' : '<span class="ftd-bare">' + T('Du trykker for ', 'You tap for ') + esc(navn(s.dealer)) + '</span>') +
      (andre ? '' : '<b>' + T('Noen gjetter', 'Someone guesses') + '</b><span>' + T('Trykk det som sies ↓', 'Tap what they say ↓') + '</span>') + '</div></div>' + hint +
      (andre ? '<p class="ftd-etikett">' + T('Ett forsøk til – trykk det som sies ↓', 'One more try – tap what they say ↓') + '</p>' : '') +
      '<div class="ftd-taster" aria-label="' + T('Trykk det som sies', 'Tap what they say') + '">' + taster + '</div>' +
      '<div class="ftd-info"><div class="treff"><b>' + treffN + '</b><span>' + (andre ? T('treff<br>du drikker halve', 'hit<br>you drink half') : T('treff<br>du drikker kortet', 'hit<br>you drink the card')) + '</span></div>' +
      (andre ? '<div class="bom"><b>|' + ftdVn(k.v) + '–?|</b><span>' + T('bom<br>gjetteren drikker', 'miss<br>the guesser drinks') + '</span></div>' : '<div class="hint"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 7l4-4 4 4"/><path d="M12 3v8"/><path d="M8 17l4 4 4-4"/><path d="M12 13v8"/></svg><span>' + T('bom<br>si høyere/lavere', 'miss<br>say higher/lower') + '</span></div>') + '</div>' +
      ftdBrett(s) + '</div>';
  }
  /* ---------- Gris: fjøset og trynet ----------
     Halmgult og låverødt. Kortet du sender sklir ut til venstre, det nye kommer inn fra høyre. Det rosa trynet pulserer
     når noen har fire like. Bokstavene males på brettet ditt én gang. Vertens telefon driver klokka (10 s per bytte,
     5 s på nesa, 4 s pause) – ingen trenger å trykke «neste». */
  var grSett = {}, grDriver = null;
  function grDriv() {
    if (grDriver) return;
    grDriver = setInterval(function () {
      var sp = tilstand && tilstand.spill;
      if (!sp || sp.type !== 'gris' || sp.fase === 'slutt') { clearInterval(grDriver); grDriver = null; return; }
      if (document.hidden || !sp.vinduer) return;
      var naa = Date.now() + klokkeAvvik - driverVent(), v = sp.vinduer;
      if ((sp.fase === 'send' && naa - sp.sendVed >= v.bytt) || (sp.fase === 'nese' && naa - sp.neseVed >= v.nese) || (sp.fase === 'ferdig' && naa - sp.ferdigVed >= v.pause)) gjorAlltid({ handling: 'gr-tikk' });
    }, 700);
  }
  function grKort(k, kl) {
    var rod = k.f === '♥' || k.f === '♦';
    return '<span class="gr-kort' + (rod ? ' rod' : '') + (kl ? ' ' + kl : '') + '"><b>' + vn(k.v) + '</b><i>' + k.f + '</i></span>';
  }
  function grBrett(s, id, start) {
    var n = (s.bokstaver || {})[id] || 0, ord = T('GRIS', 'PIGS'), nk = 'b' + id + ':' + n, ny = start && n && !grSett[nk]; grSett[nk] = 1;
    return '<span class="gr-bokst">' + ord.split('').map(function (t, j) { return '<i class="' + (j < n ? 'paa' : '') + (ny && j === n - 1 ? ' mal' : '') + '">' + t + '</i>'; }).join('') + '</span>';
  }
  function grisSpill(s) {
    var meg = tilstand.meg, vert = erVert(), ider = s.ider || [], start = !!grSett.start;
    if (s.fase !== 'slutt') grDriv();
    var naa = Date.now() + klokkeAvvik, tatt = s.neser.indexOf(meg) !== -1, valgt = s.mittValg != null;
    var folk = '<div class="gr-folk">' + ider.map(function (id) {
      var klar = s.fase === 'send' ? s.harValgt.indexOf(id) !== -1 : s.neser.indexOf(id) !== -1, nr = s.neser.indexOf(id);
      var status = s.fase === 'send' ? (klar ? T('valgt', 'picked') : '') : nr !== -1 ? T('nr ', 'no. ') + (nr + 1) : ((s.fase === 'ferdig' || s.fase === 'slutt') && s.taper === id ? T('sist!', 'last!') : '');
      return '<div class="' + (s.taper === id && s.fase !== 'send' ? 'taper' : '') + (klar ? ' klar' : '') + '">' + nrHode(id) + '<span><b>' + jaNavn(id) + '</b>' + grBrett(s, id, start) + '</span><small>' + status + '</small></div>';
    }).join('') + '</div>';
    grSett.start = 1;
    if (s.fase === 'slutt') {
      return jaTopp(T('Gris', 'Pigs'), jaNavn(s.gris) + T(' er GRIS!', ' is the PIG!'), true, false) +
        '<div class="gr-slutt"><b>' + T('GRIS!', 'PIGS!') + '</b><span>' + jaNavn(s.gris) + T(' tar en shot.', ' takes a shot.') + '</span></div>' + folk +
        lekSlutt([['runde', T('Spill igjen', 'Play again'), T('Nye brett – teller i kvelden', 'New boards – counts tonight')]]);
    }
    var halm = '';
    if (s.fase === 'send' || s.fase === 'nese') {
      var lengde = s.fase === 'send' ? s.vinduer.bytt : s.vinduer.nese, ved = s.fase === 'send' ? s.sendVed : s.neseVed;
      halm = '<div class="gr-halm' + (s.fase === 'nese' ? ' nese' : '') + '" aria-hidden="true"><i style="animation-duration:' + lengde + 'ms;animation-delay:-' + Math.max(0, Math.min(lengde, naa - ved)) + 'ms"></i></div>';
    }
    var hand = s.minHand || [], bk = 'k' + s.runde + ':' + s.byttNr, nyBytt = start && s.byttNr > 0 && !grSett[bk]; grSett[bk] = 1;
    var balle = !s.minHand ? '<p class="gr-hjelp">' + T('Du er med fra neste runde.', 'You’re in from the next round.') + '</p>' :
      '<div class="gr-balle"><span class="gr-merke">' + (s.fase === 'send' ? (valgt ? T('Sendt!', 'Sent!') : T('Trykk på kortet du sender', 'Tap the card to pass')) : T('Hånda di', 'Your hand')) + '</span><div class="gr-hand">' +
        hand.map(function (k, i) {
          var kl = (valgt && s.mittValg === i ? ' ut' : '') + (nyBytt && i === 3 ? ' inn' : '') + (s.harFire && s.fase === 'send' ? ' fire' : '');
          return '<button type="button" class="gr-hk' + kl + '" data-g="velg" data-i="' + i + '" style="--i:' + i + '"' + (s.fase !== 'send' || valgt ? ' disabled' : '') + ' aria-label="' + T('Send ', 'Pass ') + vn(k.v) + k.f + '">' + grKort(k) + '</button>';
        }).join('') + '</div></div>';
    var pust = (s.fase === 'nese' && !tatt) || (s.harFire && s.fase === 'send');
    var tryne = '<button type="button" class="gr-tryne' + (pust ? ' pust' : '') + (s.fase === 'nese' || s.harFire ? ' paa' : '') + '" data-g="nese" aria-pressed="' + tatt + '" aria-label="' + T('Ta deg på nesa', 'Touch your nose') + '"' + (s.fase === 'ferdig' || tatt ? ' disabled' : '') + '><span><i></i><i></i></span></button>' +
      '<b class="gr-tryne-t">' + (s.fase === 'nese' ? (tatt ? T('Tatt!', 'Got it!') : T('NESA!', 'NOSE!')) : T('Nesa', 'The nose')) + '</b>' +
      '<p class="gr-hjelp">' + (s.fase === 'nese' ? (tatt ? T('Vent på de andre – sistemann får en bokstav.', 'Wait for the others – the last one gets a letter.') : T('Noen har fire like. Trykk før det er for sent!', 'Someone has four of a kind. Tap before it’s too late!'))
        : s.fase === 'ferdig' ? T('Ny runde kommer straks …', 'A new round is coming …') : T('Har du fire like? Trykk. Trykker du for tidlig, får du en bokstav.', 'Four of a kind? Tap. Tap too early and you get a letter.')) + '</p>';
    var bokst = function (id) { var n = Math.min(4, (s.bokstaver || {})[id] || 0); return T('GRIS', 'PIGS').slice(n - 1, n); };
    var chip = s.fase === 'send' ? (s.harFire ? T('Fire like! Trykk på trynet', 'Four of a kind! Tap the snout') : valgt ? T('Venter på de andre …', 'Waiting for the others …') : T('Send et kort til venstre', 'Pass a card to the left'))
      : s.fase === 'nese' ? (tatt ? T('Du var nr ', 'You were no. ') + (s.neser.indexOf(meg) + 1) : T('NESA! Fort!', 'NOSE! Quick!'))
      : s.taper ? jaNavn(s.taper) + T(' var sist – ', ' was last – ') + bokst(s.taper) + '!' : T('Alle rakk nesa', 'Everyone made it');
    return jaTopp(T('Gris · runde ', 'Pigs · round ') + s.runde, chip, s.fase === 'nese' && !tatt, false) +
      '<div class="gr-fjos' + (s.fase === 'nese' ? ' nese' : '') + '">' + folk + halm + balle + '<div class="gr-tryne-boks">' + tryne + '</div></div>';
  }
  /* ---------- President: trappa ----------
     Appens egne farger. Trappa øverst: den som går tom, hopper opp på sitt trinn. Kortene smelles ned på bordet og
     feies av når ingen går over. 20 s per tur – vertens telefon passer for den som somler. */
  var prSett = {}, prDriver = null, prForrigeBord = [];
  var PR_FARGER = ['#FFD23F', '#63E2A8', '#7CC6FE', '#C9B3FF', '#FF9CC2', '#FFB38A'];
  function prRang(v) { return v === 2 ? 15 : v; }
  function prDriv() {
    if (prDriver) return;
    prDriver = setInterval(function () {
      var sp = tilstand && tilstand.spill;
      if (!sp || sp.type !== 'president' || sp.fase === 'ferdig') { clearInterval(prDriver); prDriver = null; return; }
      if (document.hidden) return;
      if (Date.now() + klokkeAvvik - sp.turVed >= sp.turTid + driverVent()) gjorAlltid({ handling: 'pr-tikk' });
    }, 1000);
  }
  function prKort(k, kl, stil) {
    var rod = k.f === '♥' || k.f === '♦';
    return '<span class="pr-kort' + (rod ? ' rod' : '') + (kl ? ' ' + kl : '') + '"' + (stil ? ' style="' + stil + '"' : '') + '><b>' + vn(k.v) + '</b><i>' + k.f + '</i></span>';
  }
  function prPlassNavn(i, n) {
    if (i === 0) return T('President', 'President');
    if (i === n - 1) return T('Rævkjører', 'Scumbag');
    if (n > 3 && i === 1) return T('Visepres.', 'Vice pres.');
    if (n > 3 && i === n - 2) return T('Vise-ræv', 'Vice scum');
    return T('Folket', 'People');
  }
  function prTrapp(s, start) {
    var ider = s.ider || [], n = ider.length;
    return '<div class="pr-trapp" style="--n:' + n + '">' + ider.map(function (_, i) {
      var plass = n - 1 - i, hvem = s.ferdige[plass], hk = 'f' + s.runde + ':' + hvem, ny = hvem && start && !prSett[hk]; if (hvem) prSett[hk] = 1;
      return '<div style="--i:' + i + ';--f:' + PR_FARGER[Math.min(plass, PR_FARGER.length - 1)] + '"' + (plass === 0 ? ' class="topp"' : '') + '><small>' + prPlassNavn(plass, n) + '</small>' +
        (hvem ? '<span class="pr-paa' + (ny ? ' hopp' : '') + '">' + nrHode(hvem) + '</span>' : '') + '</div>';
    }).join('') + '</div>';
  }
  function presidentSpill(s) {
    var meg = tilstand.meg, vert = erVert(), start = !!prSett.start, ferdig = s.fase === 'ferdig';
    if (!ferdig) prDriv();
    var hand = s.minHand || [], jeg = s.tur === meg && !ferdig, naa = Date.now() + klokkeAvvik;
    presValg = presValg.filter(function (i) { return i < hand.length; });
    if (!jeg) presValg = [];
    var trapp = prTrapp(s, start);
    var folk = '<div class="pr-folk">' + (s.ider || []).map(function (id) {
      var ute = s.ferdige.indexOf(id) !== -1, tur = s.tur === id && !ferdig;
      var ring = tur ? ' style="animation-duration:' + s.turTid + 'ms;animation-delay:-' + Math.max(0, Math.min(s.turTid, naa - s.turVed)) + 'ms"' : '';
      return '<span class="' + (ute ? 'ute' : '') + (tur ? ' tur' : '') + '"><span class="pr-ring"' + ring + '>' + nrHode(id) + '</span><b>' + jaNavn(id) + '</b><small>' +
        (ute ? T('ute', 'out') : s.pass.indexOf(id) !== -1 ? 'pass' : tur ? T('har tur', 'to play') : (s.antall[id] || 0) + T(' kort', ' cards')) + '</small></span>';
    }).join('') + '</div>';
    if (ferdig) {
      prSett.start = 1;
      var d = s.drikk || { drikker: [] }, n = s.ferdige.length;
      return jaTopp(T('President · runde ', 'President · round ') + s.runde, jaNavn(s.ferdige[0]) + T(' er President!', ' is President!'), true, false) + trapp +
        '<ol class="pr-titler">' + s.ferdige.map(function (id, i) {
          var dr = d.drikker.find(function (x) { return x.id === id; });
          return '<li style="--f:' + PR_FARGER[Math.min(i, PR_FARGER.length - 1)] + '">' + nrHode(id) + '<span><b>' + jaNavn(id) + '</b><small>' + prPlassNavn(i, n) + '</small></span><em>' +
            (i === 0 ? T('Deler ut ', 'Hands out ') + d.deler : dr ? T('Drikk ', 'Drink ') + dr.n : '') + '</em></li>';
        }).join('') + '</ol>' +
        lekSlutt([['runde', T('Neste runde', 'Next round'), T('Rævkjøreren gir beste kort til Presidenten', 'The Scumbag gives their best card to the President')]]);
    }
    // Bordet: kortene smelles ned én gang; en feid bunke sklir av bordet
    var lk = 'l' + s.runde + ':' + s.leggNr, nyLegg = start && s.leggNr && !prSett[lk]; prSett[lk] = 1;
    var fk = 'e' + s.runde + ':' + s.feiNr, nyFei = start && s.feiNr && !prSett[fk]; prSett[fk] = 1;
    var bunke = s.bord.length ? s.bord : (nyFei ? prForrigeBord : []), bn = bunke.length;
    var bord = '<div class="pr-bord"><span class="pr-bord-t">' + prBordTekst(s) + '</span><div class="pr-bunke' + (!s.bord.length && nyFei ? ' fei' : '') + '">' +
      bunke.map(function (k, i) { var r = ((i - (bn - 1) / 2) * 12 + (s.leggNr % 3 - 1) * 4); return prKort(k, s.bord.length && nyLegg ? 'smell' : '', '--r:' + r + 'deg;--x:' + ((i - (bn - 1) / 2) * 30) + 'px'); }).join('') + '</div>' +
      (s.bytte && !s.sist ? '<p class="pr-bytte">' + jaNavn(s.bytte.fra) + T(' ga ', ' gave ') + vn(s.bytte.kort.v) + s.bytte.kort.f + T(' til ', ' to ') + jaNavn(s.bytte.til) + '</p>' : '') + '</div>';
    if (s.bord.length) prForrigeBord = s.bord.slice();
    if (nyLegg && s.bord.length) spillLyd('kortlegg');
    prSett.start = 1;
    var hn = hand.length, steg = hn > 1 ? Math.min(31, (300 - 52) / (hn - 1)) : 0;
    var handHtml = !s.minHand ? '<p class="gr-hjelp">' + T('Du er med fra neste runde.', 'You’re in from the next round.') + '</p>' :
      '<div class="pr-hand">' + hand.map(function (k, i) {
        var v = presValg.indexOf(i) !== -1;
        return '<button type="button" class="pr-hk' + (v ? ' valgt' : '') + '" data-g="pvelg" data-i="' + i + '" aria-pressed="' + v + '" style="--x:' + ((i - (hn - 1) / 2) * steg).toFixed(1) + 'px;--r:' + ((i - (hn - 1) / 2) * 2.5).toFixed(1) + 'deg"' + (jeg ? '' : ' disabled') + '>' + prKort(k) + '</button>';
      }).join('') + '</div>';
    var sv = presValg.map(function (i) { return hand[i]; }), b = s.bord;
    var gyldig = sv.length && sv.every(function (k) { return k.v === sv[0].v; }) && (!b.length || (sv.length === b.length && prRang(sv[0].v) > prRang(b[0].v)));
    var leggT = gyldig ? T('Legg ', 'Play ') + sv.length + ' × ' + vn(sv[0].v) : sv.length ? T('Ikke gyldig', 'Not valid') : b.length ? T('Velg ', 'Pick ') + b.length + T(' like over ', ' alike over ') + vn(b[0].v) : T('Velg kort', 'Pick cards');
    var knapper = jeg ? '<div class="pr-knapper"><button type="button" class="pr-legg' + (gyldig ? ' klar' : '') + '" data-g="legg"' + (gyldig ? '' : ' disabled') + '>' + leggT + '</button>' +
      '<button type="button" class="pr-pass" data-g="pass"' + (b.length ? '' : ' disabled') + '>Pass</button></div>'
      : '<p class="nr-vent">' + T('Vent på ', 'Wait for ') + esc(navn(s.tur)) + '.' + (vert && b.length ? ' <button type="button" class="linkbtn" data-g="pass">' + T('Pass for ', 'Pass for ') + esc(navn(s.tur)) + '</button>' : '') + '</p>';
    var chip = jeg ? (b.length ? T('Din tur – over ', 'Your turn – beat ') + b.length + ' × ' + vn(b[0].v) + '?' : T('Din tur – legg ut noe', 'Your turn – play anything')) : esc(navn(s.tur)) + T(' har tur', ' to play');
    return jaTopp(T('President · runde ', 'President · round ') + s.runde, chip, jeg, false) + trapp + folk + bord + handHtml + knapper;
  }
  function prBordTekst(s) {
    var x = s.sist;
    if (!s.bord.length) return x && x.kort && x.kort[0].v === 2 ? jaNavn(x.id) + T(' la toer – bordet er feid', ' played a two – table cleared') : T('Bordet er tomt – ', 'The table is empty – ') + jaNavn(s.tur) + T(' starter', ' starts');
    if (!x) return '';
    return x.pass ? jaNavn(x.id) + T(' passer', ' passes') : jaNavn(x.id) + T(' la ', ' played ') + x.kort.length + ' × ' + vn(x.kort[0].v);
  }

  var rfOffset = 0, rfTimer = null;
  function rfIgjen(s) { return Math.max(0, Math.ceil((s.frist - 3000 - (Date.now() + rfOffset)) / 1000)); }
  function rfTikk() {
    clearInterval(rfTimer);
    rfTimer = setInterval(function () {
      var s = tilstand && tilstand.spill, el = document.getElementById('rfTid');
      if (!s || s.type !== 'regelfabrikken' || s.fase !== 'skriv' || !el) { clearInterval(rfTimer); return; }
      var n = rfIgjen(s); el.textContent = n;
      el.classList.toggle('snart', n <= 10);
      if (n <= 0) { var inp = document.getElementById('rfInput'); if (inp) inp.disabled = true; var f = document.getElementById('rfTekst'); if (f) f.textContent = T('Tiden er ute!', 'Time\'s up!'); }
    }, 250);
  }
  /* ---------- Skriv og drikk: skriv kort til noen, trekk, og Skammekroken ----------
     Skrivesiden er bare klokka, kortet du skriver på og bunken din. Hver person får tre forslag fra en stor
     samling, nye etter hvert kort. Kort kan være til alle, den som trekker, én person eller to tilfeldige. */
  var SD_STARTERE = EN ? [
    'Whoever last sent a voice message over a minute long, …', 'Everyone with a dead plant at home, drink …', 'If you have ever fallen asleep at the cinema, …',
    'Whoever has the most unread messages right now, …', 'Everyone who has been to IKEA this year, …', 'Whoever lives closest, hand out …',
    'If you have cried at an advert, …', 'Whoever last had a haircut, …', 'Everyone wearing odd socks, …', 'If you have argued with a self-checkout, …',
    'Whoever has the longest name, cheers with …', 'Everyone still following an ex, …', 'Whoever was born furthest north, …', 'If you watch series at double speed, …',
    'Swap seats with whoever …', 'Whoever has the most apps on their phone, …', 'If you have ever been recognised by a former teacher on a night out, …',
    'Whoever spent the most on food today, …', 'Everyone who has a nickname nobody here uses, …', 'If your phone is under 20 % right now, …',
    'Whoever has been in the longest relationship, …', 'Everyone who has lied about reading the terms and conditions, …', 'Whoever arrived last tonight, …',
    'If you have a screenshot of this group chat, …', 'Whoever has the worst handwriting, write …', 'Everyone who has sung in the shower this week, …'
  ] : [
    'Den som sist sendte en talemelding over ett minutt, …', 'Alle som har en død plante hjemme, drikk …', 'Hvis du har sovnet på kino, …',
    'Den med flest uleste meldinger akkurat nå, …', 'Alle som har vært på Ikea i år, …', 'Den som bor nærmest, del ut …',
    'Hvis du har grått av en reklame, …', 'Den som sist var hos frisøren, …', 'Alle med sokker i to forskjellige farger, …', 'Hvis du har kranglet med en selvbetjent kasse, …',
    'Den som har lengst navn, skål med …', 'Alle som fortsatt følger en eks, …', 'Den som er født lengst nord, …', 'Hvis du ser serier på dobbel hastighet, …',
    'Bytt plass med den som …', 'Den med flest apper på telefonen, …', 'Hvis du har møtt en gammel lærer på byen, …',
    'Den som har brukt mest på mat i dag, …', 'Alle som har et kallenavn ingen her bruker, …', 'Hvis telefonen din er under 20 % nå, …',
    'Den som har vært lengst i et forhold, …', 'Alle som har løyet om å ha lest vilkårene, …', 'Den som kom sist i kveld, …',
    'Hvis du har et skjermbilde av denne gruppechatten, …', 'Den med styggest håndskrift, skriv …', 'Alle som har sunget i dusjen denne uka, …',
    'Den som sist ble stoppet av en dørvakt, …', 'Hvis du har en app du skammer deg over, …', 'Den som har flest søsken, …', 'Alle som har kalt læreren «mamma», …'
  ];
  var sdTil = 'alle', sdStartere = null, sdSistAntall = -1, sdTilDegVist = '', sdVist = '';
  function sdNyeStartere() {
    var l = SD_STARTERE.slice(), ut = [];
    while (ut.length < 3 && l.length) ut.push(l.splice(Math.floor(Math.random() * l.length), 1)[0]);
    sdStartere = ut;
  }
  function sdPlass() {
    if (sdTil === 'alle') return T('Alle som har på seg svart, drikker to', 'Everyone wearing black drinks two');
    if (sdTil === 'trekker') return T('Den som trekker dette, må …', 'Whoever draws this has to …');
    if (sdTil === 'to') return T('Disse to skåler og forteller …', 'These two cheers and tell …');
    return T('Fortell hvem du sist sendte melding til, eller drikk tre', 'Say who you last texted, or drink three');
  }
  function sdTilPiller(s) {
    var l = s.mottakere || [];
    if (!l.length) return '<span class="sd-til-alle">' + (s.til === 'trekker' ? T('Til den som trekker', 'To whoever draws') : T('Til alle', 'To everyone')) + '</span>';
    return '<span class="sd-til-lapp">' + T('Til', 'To') + '</span>' + l.map(function (id) { return '<span class="sd-til-navn">' + nrPille(id) + esc(id === tilstand.meg ? T('Deg', 'You') : navn(id)) + '</span>'; }).join('');
  }
  function regelfabrikkenSpill(s) {
    rfOffset = s.naa - Date.now();
    var vert = erVert(), alle = tilstand.spillere || [];
    var topp = function (tekst, gul, klokke) {
      return '<div class="nr-topp sd-topp"><div class="nr-topp-tekst"><span>' + T('Skriv og drikk', 'Write & Drink') + (s.fase === 'trekk' ? ' · ' + (s.pos + 1) + T(' av ', ' of ') + s.totalt : '') + '</span><b' + (gul ? ' class="gul"' : '') + '>' + tekst + '</b></div>' + (klokke ? nrKlokke() : '') + '</div>';
    };
    if (s.fase === 'klar') {
      return topp(T('Klar?', 'Ready?'), false) +
        '<div class="pk-kort sd-intro"><p>' + T('Alle skriver drikkekort i ', 'Everyone writes drinking cards for ') + s.sek + T(' sekunder. Så stokkes de og trekkes – og noen er til deg.', ' seconds. Then they are shuffled and drawn – and some are for you.') + '</p></div>' +
        '<div class="nr-folk">' + alle.map(function (p) { return nrPille(p.id, 'har'); }).join('') + '<span>' + alle.length + T(' med', ' in') + '</span></div>' +
        (vert ? '<button class="rom-stor-knapp" data-g="startklokke" type="button">' + T('Start klokka', 'Start the clock') + '</button>' : '<p class="nr-vent">' + T('Venter på at ', 'Waiting for ') + esc(navn(tilstand.vert)) + T(' starter klokka …', ' to start the clock …') + '</p>') +
        '<p class="sd-med"><button class="linkbtn" data-g="rf-velg" type="button">' + T('Ta med kort fra kortstokkene dine', 'Bring cards from your decks') + '</button>' + (s.mineMed ? ' · ' + s.mineMed + T(' tatt med', ' brought') : '') + '</p>';
    }
    if (s.fase === 'skriv') {
      var n = rfIgjen(s), mine = s.mineKort || [];
      if (!sdStartere) sdNyeStartere();
      var ny = mine.length > sdSistAntall && sdSistAntall >= 0; sdSistAntall = mine.length;
      var valg = [['alle', T('Alle', 'Everyone')], ['trekker', T('Den som trekker', 'Whoever draws')]].concat(alle.filter(function (p) { return p.id !== tilstand.meg; }).map(function (p) { return [p.id, p.navn]; })).concat([['to', T('To tilfeldige', 'Two at random')]]);
      if (!valg.some(function (v) { return v[0] === sdTil; })) sdTil = 'alle';
      var bunke = mine.slice(-3).map(function (t, i, l) {
        return '<div class="sd-bunke-kort' + (ny && i === l.length - 1 ? ' inn' : '') + '" style="--i:' + i + '"><span>' + esc(t) + '</span></div>'; }).join('');
      return topp(n > 0 ? T('Skriv!', 'Write!') : T('Tiden er ute', 'Time is up'), n > 0, n > 0) +
        '<form class="sd-skriv" id="rfSkjema">' +
          '<div class="sd-til" role="group" aria-label="' + T('Hvem kortet er til', 'Who the card is for') + '"><span>' + T('Til', 'To') + '</span>' + valg.map(function (v) {
            var p = alle.find(function (x) { return x.id === v[0]; });
            return '<button type="button" data-g="rf-til" data-til="' + esc(v[0]) + '" aria-pressed="' + (sdTil === v[0]) + '"' + (p ? ' style="--f:' + nrFarge(p.id) + '"' : '') + '>' + esc(v[1]) + '</button>'; }).join('') + '</div>' +
          '<label for="rfInput" class="sr-only">' + T('Kortet', 'The card') + '</label><textarea id="rfInput" rows="3" maxlength="140" enterkeyhint="send" placeholder="' + esc(sdPlass()) + '"' + (n > 0 ? '' : ' disabled') + '></textarea>' +
          '<div class="sd-startere">' + sdStartere.map(function (t) { return '<button type="button" data-g="rf-starter" data-t="' + esc(t) + '">' + esc(t) + '</button>'; }).join('') + '</div>' +
          '<button class="sd-legg" type="submit"' + (n > 0 ? '' : ' disabled') + '>' + T('Legg i bunken', 'Add to the pile') + '</button>' +
        '</form>' +
        '<div class="sd-bunken"><div class="sd-bunke">' + bunke + '</div><div class="sd-tall"><b' + (ny ? ' class="inn"' : '') + '>' + mine.length + '</b><span>' + T('kort fra deg', 'cards from you') + '</span><span>' + s.totalt + T(' i bunken', ' in the pile') + '</span></div></div>' +
        (n <= 0 ? '<button class="rom-stor-knapp" data-g="stokk" type="button">' + T('Stokk ', 'Shuffle ') + s.totalt + T(' kort', ' cards') + '</button>'
          : vert ? '<p class="sd-med"><button class="linkbtn" data-g="stokk" type="button">' + T('Stopp og stokk nå', 'Stop and shuffle now') + '</button></p>' : '');
    }
    if (s.fase === 'skam') {
      var nokkel = 'skam:' + (s.skam || []).length, inn = sdVist !== nokkel; sdVist = nokkel;
      return topp(T('Bunken er tom', 'The pile is empty'), false) +
        '<span class="sd-skam-stempel' + (inn ? ' inn' : '') + '">' + T('Skammekroken', 'Corner of shame') + '</span>' +
        '<p class="sd-skam-intro">' + T('Disse kortene kom aldri med i bunken.', 'These cards never made it into the pile.') + '</p>' +
        '<ul class="sd-skam">' + (s.skam || []).map(function (k, i) {
          return '<li style="--i:' + i + '"' + (inn ? ' class="inn"' : '') + '><div>' + nrPille(k.fra) + '<b>' + esc(k.fra === tilstand.meg ? T('Du', 'You') : navn(k.fra)) + T(' skrev:', ' wrote:') + '</b></div><s>«' + esc(k.t) + '»</s><p>' + esc(k.kommentar) + '</p></li>'; }).join('') + '</ul>' +
        '<p class="sd-straff">' + T('Straff: én slurk for hvert forsøk.', 'Penalty: one sip per attempt.') + '</p>' +
        '<button class="rom-stor-knapp" data-g="neste" type="button">' + T('Stokk og spill videre', 'Shuffle and play on') + '</button>';
    }
    if (s.fase === 'ferdig') return topp(T('Bunken er tom', 'The pile is empty'), true) +
      '<div class="pk-kort sd-ferdig"><b>' + (s.trukket || 0) + '</b><p>' + T('kort trukket. Det var det.', 'cards drawn. That was it.') + '</p></div>' +
      lekSlutt([
        !s.egen ? ['nytt', T('Ny skriverunde', 'New writing round'), T('Alle skriver nye kort', 'Everyone writes new cards')] : null,
        ['rf-igjen', T('Samme bunke igjen', 'Same pile again'), T('Stokk de samme kortene', 'Shuffle the same cards')],
      ]);
    // Trekk
    var tilMeg = (s.mottakere || []).indexOf(tilstand.meg) !== -1, kn = s.pos + ':' + s.totalt + ':' + s.kortet;
    var innK = sdVist !== kn; sdVist = kn;
    if (tilMeg && sdTilDegVist !== kn) { sdTilDegVist = kn; try { navigator.vibrate && navigator.vibrate([60, 60, 120]); } catch (e) {} spillLyd('ding'); }
    var kk = s.kast;
    var kast = kk ? '<div class="sd-kast"><b>' + T('Kaste kortet i Skammekroken?', 'Bin the card to the corner of shame?') + '</b><span>' + kk.ja + T(' av ', ' of ') + kk.stemmere + T(' har sagt ja. Alle må si ja.', ' said yes. Everyone has to say yes.') + '</span>' +
        (kk.kanStemme ? '<div class="sd-kast-valg"><button type="button" data-g="rf-kast-stem" data-ja="1" aria-pressed="' + (kk.mitt === 'ja') + '">' + T('Ja, kast', 'Yes, bin it') + '</button><button type="button" data-g="rf-kast-stem" data-ja="0">' + T('Nei, behold', 'No, keep it') + '</button></div>'
          : '<span>' + T('Du kan ikke stemme på dette kortet.', 'You can’t vote on this card.') + '</span>') +
        (vert ? '<button type="button" class="linkbtn" data-g="rf-kast-avbryt">' + T('Avbryt', 'Cancel') + '</button>' : '') + '</div>' : '';
    return topp(s.trekker ? (s.trekker === tilstand.meg ? T('Du trakk', 'You drew') : esc(navn(s.trekker)) + T(' trakk', ' drew')) : T('Trekk!', 'Draw!'), false) +
      '<div class="sd-trekk' + (tilMeg ? ' til-deg' : '') + '">' + (tilMeg ? '<span class="sd-til-deg-stempel' + (innK ? ' inn' : '') + '">' + T('Til deg!', 'For you!') + '</span>' : '') +
        '<div class="sd-stabel"><div class="sd-kortet' + (innK ? ' inn' : '') + '"><div class="sd-til-rad">' + sdTilPiller(s) + '</div><p>' + esc(s.kortet) + '</p><small>' + (s.egen ? '' : T('Skrevet av en av dere', 'Written by one of you')) + '</small></div></div>' +
      '</div>' + kast +
      videreKnapp(s, T('Trekk neste', 'Draw next')) +
      '<p class="sd-med">' + (vert && !s.egen && !kk ? '<button class="linkbtn" data-g="rf-kast" type="button">' + T('Kast i Skammekroken', 'Bin to the corner of shame') + '</button> · ' : '') +
        (!s.egen && s.alleKort ? '<button class="linkbtn" data-g="lagrestokk" type="button">' + T('Lagre kortene', 'Save the cards') + '</button>' : '') + '</p>';
  }

  /* ---------- To sannheter og en løgn: stolen ----------
     Én sitter i stolen og skriver tre kort, stempler løgnen. De andre trykker på kortet de tror er løgnen – hodet lander der.
     Fasiten står mens neste i stolen allerede skriver, så ingen trenger å trykke «neste». Animasjonene spilles bare første gang. */
  var tsSett = {};
  var TS_STOL = '<svg class="ts-stolsvg" viewBox="0 0 92 112" aria-hidden="true"><path d="M18 30h56v40h-56z"/><path d="M10 70h72v12h-72z"/><path class="bein" d="M16 82v26M76 82v26"/></svg>';
  function tsFont(t) {
    var l = Math.max.apply(null, String(t || '').split(/\s+/).map(function (w) { return w.length; }).concat([1]));
    return Math.max(14, Math.min(21, Math.floor(210 / (l * 0.56)), Math.floor(420 / (String(t || '').length * 0.5))));
  }
  function tsStol(id, under, oi, prikker) {
    return '<div class="ts-stolrad"><span class="ts-stol">' + TS_STOL + nrHode(id, '', oi ? 'oi' : '') + '</span><div class="ts-stoltekst"><b>' +
      (id === tilstand.meg ? T('Du i stolen', 'You’re in the chair') : esc(navn(id)) + T(' i stolen', ' in the chair')) + '</b>' +
      (prikker ? '<span class="ts-prikker" aria-label="' + T('skriver', 'writing') + '"><i></i><i></i><i></i></span>' : '') + (under ? '<span>' + under + '</span>' : '') + '</div></div>';
  }
  /** De tre kortene. o: { logn, stemmer, valgt, kan, dinLogn, aapen, ny } */
  function tsKort(past, o) {
    var meg = tilstand.meg;
    return '<div class="ts-bord">' + (past || []).map(function (t, i) {
      var logn = o.aapen && i === o.logn, forsink = o.aapen ? (logn ? 760 : i * 260) : 0;
      var hoder = o.aapen ? Object.keys(o.stemmer || {}).filter(function (id) { return o.stemmer[id] === i; }) : (o.valgt === i ? [meg] : []);
      var kl = 'ts-kort' + (o.aapen ? (logn ? ' logn' : ' sann') : '') + (!o.aapen && o.valgt === i ? ' valgt' : '') + (o.ny ? ' ny' : '');
      var inn = '<span class="ts-nr">' + (i + 1) + '</span><span class="ts-tekst" style="font-size:' + tsFont(t) + 'px">' + esc(t) + '</span><span class="ts-hoder">' +
        hoder.map(function (id, j) { return '<span class="ts-land' + (o.ny || !o.aapen ? ' inn' : '') + '" style="--f:' + (o.aapen ? forsink + 200 + j * 70 : 0) + 'ms">' + nrHode(id, '', o.aapen && !logn ? 'oi' : '') + '</span>'; }).join('') + '</span>';
      return '<div class="ts-plass' + (logn && o.ny ? ' rist' : '') + '" style="--f:' + forsink + 'ms">' +
        (o.kan ? '<button type="button" class="' + kl + '" data-g="stem" data-paa="' + i + '" aria-pressed="' + (o.valgt === i) + '">' + inn + '</button>' : '<div class="' + kl + '">' + inn + '</div>') +
        (o.aapen ? '<span class="ts-stempel' + (logn ? ' logn' : '') + (o.ny ? ' inn' : '') + '">' + (logn ? T('Løgn', 'Lie') : T('Sann', 'True')) + '</span>' : '') +
        (o.dinLogn === i ? '<span class="ts-din">' + T('Din løgn', 'Your lie') + '</span>' : '') + '</div>';
    }).join('') + '</div>';
  }
  function tsFasit(fr, ny) {
    var velgere = Object.keys(fr.stemmer || {}).length;
    return tsStol(fr.aktiv, fr.riktige + T(' så løgnen', ' saw the lie'), fr.riktige > 0) +
      tsKort(fr.pastander, { aapen: true, logn: fr.logn, stemmer: fr.stemmer, ny: ny }) +
      ((fr.drikker || []).length ? '<div class="ts-drikk">' + fr.drikker.map(function (x, j) {
        return '<span class="' + (ny ? 'inn' : '') + '" style="--f:' + (1200 + j * 80) + 'ms">' + jaNavn(x.id) + (x.id === tilstand.meg ? T(' drikker ', ' drink ') : T(' drikker ', ' drinks ')) + x.slurker + '</span>';
      }).join('') + '</div>' : '') + (velgere ? '' : '');
  }
  function tosannheterSpill(s) {
    var meg = tilstand.meg, jeg = s.aktiv === meg, f = s.fase, fr = s.forrige, topp = T('To sannheter og en løgn', 'Two truths and a lie');
    var frNy = fr && !tsSett[fr.n]; if (fr) tsSett[fr.n] = 1;
    if (f === 'ferdig') {
      var l = (s.lurt || []).slice(0, 3), rek = [l[1], l[0], l[2]];
      return jaTopp(topp, T('Alle har sittet', 'Everyone’s had a go'), false, false) + (fr ? tsFasit(fr, frNy) : '') +
        '<p class="ts-pall-tittel">' + T('Beste løgner', 'Best liar') + '</p><div class="ts-pall">' + rek.map(function (x, j) {
          if (!x) return '';
          var plass = [2, 1, 3][j];
          return '<div class="ts-pallplass p' + plass + '" style="--f:' + [240, 480, 0][j] + 'ms">' + nrHode(x.id, '', '') + '<b>' + jaNavn(x.id) + '</b><span><b>' + x.n + '</b><small>' + T('lurt', 'fooled') + '</small></span></div>';
        }).join('') + '</div>' +
        lekSlutt([['runde', T('Spill igjen', 'Play again'), T('En ny runde i stolen – teller i kvelden', 'Another round in the chair – counts tonight')]]);
    }
    if (f === 'skriv') {
      var ut = jaTopp(topp, jeg ? T('Din tur', 'Your turn') : esc(navn(s.aktiv)) + T(' skriver', ' is writing'), true, false);
      if (jeg) {
        ut += '<p class="ts-du">' + T('Du sitter i stolen', 'You’re in the chair') + '</p><p class="ts-hjelp">' + T('Tre ting om deg. Stemple løgnen.', 'Three things about you. Stamp the lie.') + '</p>' +
          '<form id="tsSkjema" class="ts-skjema">' + [0, 1, 2].map(function (i) {
            return '<div class="ts-rad" style="--f:' + i * 70 + 'ms"><label><span>' + T('Kort ', 'Card ') + (i + 1) + '</span><input id="tsR' + i + '" maxlength="120" autocomplete="off" placeholder="' +
              [T('Noe sant …', 'Something true …'), T('Noe sant til …', 'Something else true …'), T('Eller en løgn …', 'Or a lie …')][i] + '"></label>' +
              '<label class="ts-stempelvalg"><input type="radio" name="tsL" value="' + i + '"><span>' + T('Løgn', 'Lie') + '</span></label></div>';
          }).join('') + '<button class="rom-stor-knapp" type="submit">' + T('Legg dem på bordet', 'Put them on the table') + '</button></form>';
        if (fr) ut += '<p class="nr-etikett">' + T('Forrige runde', 'Last round') + '</p>' + tsFasit(fr, frNy);
        return ut;
      }
      if (fr) return ut + tsFasit(fr, frNy) + '<div class="ts-neste"><span>' + T('Neste i stolen', 'Next in the chair') + '</span><span class="ts-prikker"><i></i><i></i><i></i></span><b>' + esc(navn(s.aktiv)) + '</b></div>';
      return ut + tsStol(s.aktiv, T('Gjør deg klar til å avsløre.', 'Get ready to call it.'), false, true);
    }
    var velgere = s.velgere || [], stemt = s.harStemt || [], alleStemt = velgere.length && stemt.length >= velgere.length;
    var chip = alleStemt ? T('Alle har stemt', 'Everyone voted') : jeg ? T('Hold pokerfjes', 'Poker face') : T('Finn løgnen', 'Find the lie');
    return jaTopp(topp, chip, true, false) + tsStol(s.aktiv, jeg ? T('Ikke avslør deg.', 'Don’t give yourself away.') : T('Trykk på løgnen.', 'Tap the lie.'), false, false) +
      tsKort(s.pastander, { kan: !jeg, valgt: s.minStemme, dinLogn: jeg ? s.logn : null }) +
      '<div class="ts-status"><span class="ts-stemt">' + stemt.map(function (id) { return nrHode(id, 'inn', ''); }).join('') + '</span><b>' +
      (alleStemt ? T('Snur kortene …', 'Flipping the cards …') : stemt.length + T(' av ', ' of ') + velgere.length + T(' har stemt', ' have voted')) + '</b></div>' +
      fristHtml(tilstand.spill, T('sekunder til avsløringen', 'seconds to the reveal'));
  }
  /* ---------- Bussruta ---------- */
  /* ---------- Bussruta: billetten, pyramiden og bussen ----------
     Et linjekart viser hvor dere er (ingen «runde 1 av 3»). Pyramiden snus av seg selv: vertens telefon snur ett kort
     hvert tredje sekund. Har du kortet, flyr det fra hånda di. Bussen kjører ett stopp per trygt kort. */
  var brSett = {}, brDriver = null, brBussFra = null;
  function brKort(k, kl, stil) {
    var rod = k && (k.f === '♥' || k.f === '♦');
    return '<span class="br-kort' + (rod ? ' rod' : '') + (kl ? ' ' + kl : '') + '"' + (stil ? ' style="' + stil + '"' : '') + '><b>' + (k ? vn(k.v) : '') + '</b><i>' + (k ? k.f : '') + '</i></span>';
  }
  function brVifte(hand, nyNr) {
    var n = hand.length;
    return '<div class="br-vifte">' + hand.map(function (k, i) { return brKort(k, i === n - 1 && nyNr ? 'snu' : '', '--r:' + ((i - (n - 1) / 2) * 7).toFixed(1) + 'deg;--x:' + ((i - (n - 1) / 2) * 56).toFixed(0) + 'px'); }).join('') + '</div>';
  }
  function brDriv() {
    // Bare verten: pyramiden snus av seg selv, og når den er snudd, kommer bussen
    if (brDriver) return;
    brDriver = setInterval(function () {
      var sp = tilstand && tilstand.spill;
      if (!sp || sp.type !== 'bussruta' || sp.fase !== 2) { clearInterval(brDriver); brDriver = null; return; }
      if (document.hidden) return;
      if (sp.pyrPos < 15) gjorAlltid({ handling: 'br-snu', pos: sp.pyrPos }); else gjorAlltid({ handling: 'br-buss' });
    }, 3000 + driverVent());
  }
  function bussrutaSpill(s) {
    var meg = tilstand.meg, vert = erVert(), jeg = s.aktiv === meg;
    var linje = '<div class="br-linje">' + [T('Billetten', 'The ticket'), T('Pyramiden', 'The pyramid'), T('Bussen', 'The bus')].map(function (t, i) {
      return '<span class="' + (i + 1 < s.fase ? 'ferdig' : i + 1 === s.fase ? 'naa' : '') + '"><i></i><b>' + t + '</b></span>'; }).join('') + '</div>';
    var chip, ut = '';
    if (s.fase === 1) {
      var hand = (s.hender || {})[s.aktiv] || [], sv = s.sistSvar, nySv = sv && !brSett['s' + sv.nr]; if (sv) brSett['s' + sv.nr] = 1;
      chip = jeg ? T('Din tur · kort ', 'Your turn · card ') + (s.steg + 1) : esc(navn(s.aktiv)) + T(' svarer', ' is answering');
      var VALG = [[['rod', T('Rød', 'Red'), 'rosa'], ['svart', T('Svart', 'Black'), 'svart']], [['over', T('Over', 'Higher'), 'mint'], ['under', T('Under', 'Lower'), 'rosa']],
        [['inn', T('Innenfor', 'Inside'), 'gul'], ['ut', T('Utenfor', 'Outside'), 'hvit']], [['♥', '♥', 'hvit rod'], ['♦', '♦', 'hvit rod'], ['♠', '♠', 'hvit'], ['♣', '♣', 'hvit']]];
      var kanSvare = jeg || vert;
      ut = '<p class="br-sporsmal">' + esc(s.sporsmal || '') + '</p>' + brVifte(hand, nySv && sv.id === s.aktiv ? 1 : 0) +
        (sv ? '<div class="br-svar ' + (sv.ok ? 'rett' : 'feil') + (nySv ? ' inn' : '') + '"><b>' + jaNavn(sv.id) + ': ' + (sv.ok ? T('riktig!', 'right!') : T('feil!', 'wrong!')) + '</b><span>' + (sv.ok ? T('Del ut ', 'Hand out ') : T('Drikk ', 'Drink ')) + sv.n + '.</span></div>' : '') +
        (kanSvare ? '<div class="br-knapper' + (s.steg === 3 ? ' fire' : '') + '">' + VALG[s.steg].map(function (v) { return '<button type="button" class="' + v[2] + '" data-g="br-svar" data-v="' + v[0] + '">' + v[1] + '</button>'; }).join('') + '</div>'
          : '<p class="nr-vent">' + T('Vent på ', 'Wait for ') + esc(navn(s.aktiv)) + '.</p>');
    } else if (s.fase === 2) {
      brDriv();
      var tr = s.treff, nyTr = tr && tr.pos === s.pyrPos - 1 && !brSett['p' + tr.pos]; if (tr) brSett['p' + tr.pos] = 1;
      chip = s.pyrPos < 15 ? T('Pyramiden snus', 'The pyramid flips') : T('Bussen kommer …', 'The bus is coming …');
      var rader = [[0, 5], [5, 9], [9, 12], [12, 14], [14, 15]];
      ut = '<div class="br-pyramide">' + rader.map(function (r) {
        var rad = ''; for (var i = r[0]; i < r[1]; i++) rad += i < s.pyrPos ? brKort(s.pyr[i], i === s.pyrPos - 1 ? 'naa' + (brSett['k' + i] ? '' : ' snu') : '') : brKort(null, 'bak');
        return '<div>' + rad + '</div>'; }).join('') + '</div>';
      for (var q = 0; q < s.pyrPos; q++) brSett['k' + q] = 1;
      if (tr && tr.pos === s.pyrPos - 1) ut += tr.ider.length
        ? '<div class="br-svar rett' + (nyTr ? ' inn' : '') + '"><b>' + (tr.ider.indexOf(meg) !== -1 ? T('Du har den!', 'You have it!') : tr.ider.map(function (id) { return esc(navn(id)); }).join(', ') + T(' har den!', ' have it!')) + '</b><span>' + T('Del ut ', 'Hand out ') + tr.n + '.</span></div>'
        : '';
      var min = (s.hender || {})[meg] || [];
      ut += '<p class="br-etikett">' + T('Din hånd', 'Your hand') + (min.length ? '' : ' · ' + T('tom – fint!', 'empty – nice!')) + '</p>' + brVifte(min, 0).replace('br-vifte', 'br-vifte liten');
    } else {
      var sjafor = s.buss === meg, bs = s.bussSist, nyB = bs && !brSett['b' + bs.nr]; if (bs) brSett['b' + bs.nr] = 1;
      var fra = brBussFra == null ? s.bussRekke : brBussFra; brBussFra = s.bussRekke;
      chip = s.ferdig ? T('Bussen er i mål!', 'The bus made it!') : sjafor ? T('Du kjører bussen!', 'You’re riding the bus!') : esc(navn(s.buss)) + T(' kjører bussen', ' rides the bus');
      var stopp = ''; for (var j = 0; j <= s.maal; j++) stopp += '<i class="' + (j <= s.bussRekke ? 'paa' : '') + '" style="--j:' + j + '"></i>';
      ut = '<p class="br-hjelp">' + T('Fem kort uten bildekort eller ess. Bildekort eller ess = drikk og tilbake til start.', 'Five cards without a face card or ace. Face card or ace = drink and back to the start.') + '</p>' +
        '<div class="br-vei" style="--maal:' + s.maal + '">' + stopp + '<span class="br-buss' + (fra !== s.bussRekke ? ' kjor' : '') + '" style="--p:' + s.bussRekke + ';--fra:' + fra + '"><svg viewBox="0 0 64 36" aria-hidden="true"><rect x="2" y="4" width="58" height="24" rx="5" class="kropp"/><rect x="8" y="9" width="10" height="8"/><rect x="22" y="9" width="10" height="8"/><rect x="36" y="9" width="10" height="8"/><rect x="49" y="9" width="8" height="12" class="rute"/><circle cx="16" cy="29" r="5"/><circle cx="46" cy="29" r="5"/></svg></span><b>' + T('Mål', 'Finish') + '</b></div>' +
        (bs ? '<div class="br-svar ' + (bs.straff ? 'feil' : 'rett') + (nyB ? ' inn' : '') + '">' + brKort(bs.k, 'liten') + '<span><b>' + (bs.straff ? T('Au! Drikk ', 'Ouch! Drink ') + bs.straff : T('Trygt!', 'Safe!')) + '</b>' +
          (bs.straff ? T(' – tilbake til start.', ' – back to the start.') : s.ferdig ? T(' Bussen er fri.', ' The bus is free.') : ' ' + (s.maal - s.bussRekke) + T(' stopp igjen.', ' stops to go.')) + '</span></div>' : '');
      if (s.ferdig) ut += lekSlutt([['runde', T('Spill igjen', 'Play again'), T('Ny rute – teller i kvelden', 'New route – counts tonight')]]);
      else if (sjafor || vert) ut += '<button type="button" class="br-bunke" data-g="br-kjor" aria-label="' + T('Snu neste kort', 'Flip the next card') + '"><i></i><span>' + T('Snu', 'Flip') + '</span></button>';
      else ut += '<p class="nr-vent">' + esc(navn(s.buss)) + T(' snur kortene.', ' flips the cards.') + '</p>';
    }
    return jaTopp(T('Bussruta', 'Ride the bus'), chip, !s.ferdig, false) + linje + ut;
  }
  /* ---------- Drikke-Yatzy ---------- */
  var YZF = EN ? [['1', 'Ones'], ['2', 'Twos'], ['3', 'Threes'], ['4', 'Fours'], ['5', 'Fives'], ['6', 'Sixes'], ['p', 'One pair'], ['pp', 'Two pairs'], ['3l', 'Three of a kind'], ['4l', 'Four of a kind'], ['ls', 'Small straight'], ['ss', 'Large straight'], ['hus', 'Full house'], ['sj', 'Chance'], ['y', 'Yatzy']] : [['1', 'Enere'], ['2', 'Toere'], ['3', 'Treere'], ['4', 'Firere'], ['5', 'Femmere'], ['6', 'Seksere'], ['p', 'Ett par'], ['pp', 'To par'], ['3l', 'Tre like'], ['4l', 'Fire like'], ['ls', 'Liten straight'], ['ss', 'Stor straight'], ['hus', 'Hus'], ['sj', 'Sjanse'], ['y', 'Yatzy']];
  /* ---------- Drikke-Yatzy: raflebegeret og blokka ----------
     Terninger på grønn filt og den kjente blokka med blyant. Begeret rister og terningene triller bare når et nytt kast
     kommer (s.nr), en holdt terning glir opp på kanten, og et nytt tall skrives inn med blyant én gang. */
  var YZ_HVILE = [[5, 100, -10], [24, 158, 12], [42, 96, -5], [59, 154, 16], [6, 166, 8]];
  var yzSett = {}, yzHoldF = null, yzSomleT = 0;
  function yzT(n) { var h = '<span class="yz-t' + (n === 1 ? ' en' : '') + '">'; for (var i = 1; i <= 9; i++) h += '<i' + (PRIKKER[n].indexOf(i) !== -1 ? ' class="p"' : '') + '></i>'; return h + '</span>'; }
  function yzFeltNavn(f) { var x = YZF.find(function (y) { return y[0] === f; }); return x ? x[1] : f; }
  function yzBlokk(s, kan, megId) {
    var ider = s.ider || [], cols = 'grid-template-columns:minmax(84px,1.5fr) repeat(' + ider.length + ',minmax(0,1fr))';
    var sf = s.sistFelt, nyF = sf && !yzSett['f' + sf.nr]; if (sf) yzSett['f' + sf.nr] = 1;
    var ov = function (b) { return ['1', '2', '3', '4', '5', '6'].reduce(function (a, f) { return a + (b[f] || 0); }, 0); };
    var aktiv = function (id) { return id === s.aktiv && !s.ferdig ? ' aktiv' : ''; };
    var rad = function (navnTekst, kl, celle) { return '<div class="yz-rad' + (kl ? ' ' + kl : '') + '" style="' + cols + '"><span>' + navnTekst + '</span>' + ider.map(celle).join('') + '</div>'; };
    var felt = function (f, navnTekst) {
      return rad(navnTekst, '', function (id) {
        var v = (s.blokker[id] || {})[f];
        if (kan && id === s.aktiv && v == null) { var m = s.mulige ? s.mulige[f] : 0; return '<button type="button" class="yz-c mulig" data-g="yz-felt" data-f="' + f + '" aria-label="' + T('Før ', 'Score ') + m + T(' på ', ' in ') + esc(navnTekst) + '">' + (m ? '+' + m : T('stryk', 'scratch')) + '</button>'; }
        return '<span class="yz-c' + aktiv(id) + (nyF && sf.id === id && sf.f === f ? ' skriv' : '') + '">' + (v == null ? '' : v === 0 ? '–' : v) + '</span>';
      });
    };
    var sum = function (navnTekst, kl, fn) { return rad(navnTekst, 'sum' + (kl ? ' ' + kl : ''), function (id) { return '<span class="yz-c' + aktiv(id) + '">' + fn(s.blokker[id] || {}, id) + '</span>'; }); };
    return '<div class="yz-blokk2"><div class="yz-rad hode" style="' + cols + '"><span>Yatzy</span>' + ider.map(function (id) { return '<span class="yz-c' + aktiv(id) + '">' + (id === megId ? T('Du', 'You') : esc(navn(id))) + '</span>'; }).join('') + '</div>' +
      YZF.slice(0, 6).map(function (x) { return felt(x[0], x[1]); }).join('') +
      sum(T('Sum', 'Sum'), '', function (b) { return ov(b); }) + sum('Bonus', 'bonus', function (b) { return ov(b) >= 63 ? 50 : ''; }) +
      YZF.slice(6).map(function (x) { return felt(x[0], x[1]); }).join('') +
      sum('Total', 'total', function (b, id) { return (s.summer || {})[id] || 0; }) + '</div>';
  }
  function yatzySpill(s) {
    var meg = tilstand.meg, vert = erVert(), borte = true;
    var tittel = T('Drikke-Yatzy', 'Drinking Yahtzee');
    if (s.ferdig) {
      var fe = s.ferdig;
      return jaTopp(tittel, esc(fe[0].navn) + T(' vant!', ' won!'), true, false) +
        '<div class="yz-slutt"><b>' + esc(fe[0].navn) + '</b><span>' + fe[0].sum + T(' poeng · deler ut 5', ' points · hands out 5') + '</span></div>' +
        '<p class="yz-lapp rod">' + esc(fe[fe.length - 1].navn) + T(' tapte og drikker opp.', ' lost and finishes their drink.') + '</p>' +
        yzBlokk(s, false, meg) + lekSlutt([['runde', T('Spill igjen', 'Play again'), T('Ny blokk – teller i kvelden', 'New scorecard – counts tonight')]]);
    }
    var jeg = s.aktiv === meg || (vert && borte), hvem = s.aktiv === meg ? T('Du', 'You') : esc(navn(s.aktiv));
    var nytt = s.kast > 0 && !yzSett['k' + s.nr]; if (s.kast > 0) yzSett['k' + s.nr] = 1;
    var forr = yzHoldF && yzHoldF.nr === s.nr ? yzHoldF.hold : null;
    var d = s.drikk && s.drikk.nr === s.nr && s.kast > 0 ? s.drikk : null;
    var pos = function (i, h) { return h ? [5 + i * 17.3, 16, 0] : YZ_HVILE[i]; };
    var naaHold = s.terninger.map(function (_, i) { return !!s.hold[i] && s.kast > 0; });
    var terninger = s.terninger.map(function (v, i) {
      var h = naaHold[i], p = pos(i, h), kl = '', ekstra = '';
      if (nytt && !(s.hold[i] && s.kast > 1)) kl = ' trill';
      else if (forr && forr[i] !== h) { var q = pos(i, !h); kl = ' flytt'; ekstra = ';--fx:' + q[0] + ';--fy:' + q[1] + ';--fr:' + q[2]; }
      if (d && d.ener && v === 1) kl += ' ring';
      return '<button type="button" class="yz-terning' + kl + (s.kast ? '' : ' borte') + '" data-g="yz-hold" data-i="' + i + '" aria-pressed="' + h + '" aria-label="' + T('Terning ', 'Die ') + (i + 1) + T(', viser ', ', shows ') + v + '"' +
        ' style="--x:' + p[0] + ';--y:' + p[1] + ';--r:' + p[2] + ';--f:' + i * 45 + 'ms' + ekstra + '"' + (jeg && s.kast && s.kast < 3 ? '' : ' disabled') + '>' + yzT(v) + '</button>';
    }).join('');
    yzHoldF = { nr: s.nr, hold: naaHold };
    var kanKaste = jeg && s.kast < 3;
    var beger = '<button type="button" class="yz-beger' + (nytt ? ' rist' : '') + '" data-g="yz-kast" aria-label="' + T('Rist begeret og trill', 'Shake the cup and roll') + '"' + (kanKaste ? '' : ' disabled') + '>' +
      '<svg viewBox="0 0 78 96" aria-hidden="true"><path d="M8 8 H70 L62 90 H16 Z" class="kropp"/><path d="M8 8 H70" class="kant"/><path d="M12 26 H66 M14 72 H64" class="baand"/><path d="M24 36 L22 64" class="glans"/></svg>' +
      (kanKaste && !s.kast ? '<span>' + T('Trykk på begeret', 'Tap the cup') + '</span>' : '') + '</button>';
    var prikker = '<span class="yz-prikker" aria-label="' + T('Kast ', 'Roll ') + s.kast + T(' av 3', ' of 3') + '">' + [0, 1, 2].map(function (i) { return '<i' + (i < s.kast ? ' class="paa"' : '') + '></i>'; }).join('') + '</span>';
    var krus = d && d.yatzy ? '<div class="yz-krus' + (nytt ? ' inn' : '') + '" aria-hidden="true"><svg viewBox="0 0 300 110"><path d="M20 70 C60 20 110 18 150 50 C190 82 250 80 284 30" stroke-width="7"/><path d="M30 90 C90 70 200 100 270 76" stroke-width="5"/></svg><b>YATZY!</b></div>' : '';
    var lapp = '';
    if (d && (d.yatzy || d.fire || d.ener)) {
      var deler = [];
      if (d.yatzy) deler.push('YATZY! ' + hvem + T(' deler ut 5 – eller en shot', ' hand' + (s.aktiv === meg ? '' : 's') + ' out 5 – or a shot'));
      else if (d.fire) deler.push(T('Fire like – ', 'Four of a kind – ') + (s.aktiv === meg ? T('drikk ', 'drink ') : hvem + T(' drikker ', ' drinks ')) + d.fire);
      if (d.ener) deler.push(T('Ener i kastet – ', 'A one in the roll – ') + (s.aktiv === meg ? T('drikk 2', 'drink 2') : hvem + T(' drikker 2', ' drinks 2')));
      lapp = '<p class="yz-lapp ' + (d.yatzy ? 'gull' : 'rod') + (nytt ? ' inn' : '') + '" aria-live="polite">' + deler.join(' · ') + '</p>';
    } else if (!s.kast && s.sistFelt) {
      var sf = s.sistFelt, sv = (s.blokker[sf.id] || {})[sf.f];
      var hvemF = sf.id === meg ? T('Du', 'You') : esc(navn(sf.id));
      lapp = '<p class="yz-lapp' + (sf.drakk ? ' rod' : '') + '">' + hvemF + (sf.stroket ? T(' fikk ', ' had ') + yzFeltNavn(sf.f) + T(' strøket', ' scratched') : sf.drakk ? T(' strøk ', ' scratched ') + yzFeltNavn(sf.f) : T(' førte ', ' scored ') + sv + T(' på ', ' in ') + yzFeltNavn(sf.f)) +
        (sf.drakk ? (sf.id === meg ? T(' – drikk ', ' – drink ') : T(' – drikker ', ' – drinks ')) + sf.drakk : '') + '</p>';
    }
    var chip = s.aktiv === meg ? (s.kast ? (s.kast < 3 ? T('Hold, trill igjen eller før', 'Hold, roll again or score') : T('Velg et felt', 'Pick a box')) : T('Din tur – rist begeret', 'Your turn – shake the cup'))
      : jeg ? T('Du fører for ', 'You play for ') + esc(navn(s.aktiv)) : esc(navn(s.aktiv)) + (s.kast ? T(' · kast ', ' · roll ') + s.kast : T(' rister begeret', ' is shaking the cup'));
    // Verten kan stryke et felt for den som somler – knappen kommer etter ett minutt
    var stryk = '';
    if (vert && !jeg) {
      var igjen = s.trekkVed + s.somle - (Date.now() + klokkeAvvik);
      if (igjen <= 0) stryk = '<button type="button" class="btn ghost small yz-stryk" data-g="yz-stryk">' + T('Stryk et felt for ', 'Scratch a box for ') + esc(navn(s.aktiv)) + '</button>';
      else if (yzSomleT !== s.trekkVed) { yzSomleT = s.trekkVed; setTimeout(tegn, igjen + 300); }
    }
    return jaTopp(tittel, chip, s.aktiv === meg, false) +
      '<div class="yz-brett"><span class="yz-kant" aria-hidden="true"><b>' + T('Holdt', 'Held') + '</b></span>' + prikker + terninger + beger + krus + '</div>' +
      '<div class="yz-lapprad">' + lapp + '</div>' + yzBlokk(s, jeg && s.kast > 0, meg) + stryk;
  }
  /* ---------- Nyhetsrunden: alle ser spørsmålet, verten leser det høyt, avsløringen er et øyeblikk ----------
     Valg og sant/tull: A–D-klistremerker. Tall: eget tastatur (mobiltastaturet dekker ikke spørsmålet),
     og en tallinje når svaret vises – nærmest deler ut to. Fritt: et tekstfelt. Bevegelse bare første gang
     noe vises (stempelet, resultatet, nålene, pallen), så nye tegninger ikke spiller det av igjen. */
  var TYPER = EN ? { valg: 'Pick the right one', sant: 'True or nonsense?', tall: 'Which number? Closest wins', fritt: 'Free answer' } : { valg: 'Velg riktig', sant: 'Sant eller tull?', tall: 'Hvilket tall? Nærmest vinner', fritt: 'Svar fritt' };
  var NR_FARGER = ['#FF9CC2', '#63E2A8', '#FFD23F', '#7CC6FE', '#FF5B1F', '#C9B3FF', '#FFB38A', '#B8E986'];
  var nrTall = { k: '', v: '' }, nrVist = '';
  function nrFarge(id) { var i = (tilstand.spillere || []).findIndex(function (p) { return p.id === id; }); return NR_FARGER[(i < 0 ? 0 : i) % NR_FARGER.length]; }
  function nrPille(id, klasse) {
    var p = (tilstand.spillere || []).find(function (x) { return x.id === id; }) || { id: id, navn: '?' };
    return '<span class="nr-p' + (klasse ? ' ' + klasse : '') + (id === tilstand.meg ? ' meg' : '') + '" style="--f:' + nrFarge(id) + '" title="' + esc(p.navn) + '">' + esc(initialer(p)) + '</span>';
  }
  /** Det lille hodet til en spiller (samme figur som på benken) – brukes i stedet for initialer. */
  function nrHode(id, klasse, uttrykk) {
    var p = (tilstand.spillere || []).concat(sofaFolk()).find(function (x) { return x.id === id; }) || { id: id, navn: '?' };
    return '<span class="nr-h' + (klasse ? ' ' + klasse : '') + (id === tilstand.meg ? ' meg' : '') + '" title="' + esc(p.navn) + '"><svg viewBox="-28 -36 56 62" aria-hidden="true">' + hodeHtml(utseende(p.figur || p.id, p.pynt), uttrykk) + '</svg></span>';
  }
  function nrFormat(v) { var n = Number(v); return isFinite(n) && String(v) !== '' ? n.toLocaleString(EN ? 'en-GB' : 'nb-NO') : String(v || ''); }
  function nrPai(andel) {
    if (!(andel > 0)) return '';
    if (andel >= 0.999) return 'M28 4 A24 24 0 1 1 27.99 4 Z';
    var v = andel * Math.PI * 2, x = 28 + 24 * Math.sin(v), y = 28 - 24 * Math.cos(v);
    return 'M28 28 L28 4 A24 24 0 ' + (v > Math.PI ? 1 : 0) + ' 1 ' + x.toFixed(2) + ' ' + y.toFixed(2) + ' Z';
  }
  function nrKlokke() {
    var sp = tilstand.spill; if (!sp || !sp.frist) return '';
    var igjen = Math.max(0, Math.ceil((sp.frist - 1500 - (Date.now() + klokkeAvvik)) / 1000));
    fristTot[sp.frist] = Math.max(fristTot[sp.frist] || 0, igjen, 1);
    return '<div class="nr-klokke' + (igjen <= 10 ? ' snart' : '') + '"><svg viewBox="0 0 56 56" aria-hidden="true"><circle cx="28" cy="28" r="24"/><path d="' + nrPai(igjen / fristTot[sp.frist]) + '"/><circle class="kant" cx="28" cy="28" r="24"/></svg>' +
      '<span data-frist="' + sp.frist + '" aria-label="' + T('sekunder igjen', 'seconds left') + '">' + igjen + '</span></div>';
  }
  function nrTopp(s, tekst, klokke) {
    return '<div class="nr-topp nr-avis"><div class="nr-avis-tekst"><b>Nyhetsrunden</b><span>' + T('Uke ', 'Week ') + s.uke + ' · ' + tekst + '</span></div>' + (klokke ? nrKlokke() : '') + '</div>';
  }
  function nrSporsmal(s, liten) {
    return '<div class="nr-kort' + (liten ? ' liten' : '') + '"><span class="nr-type">' + esc(TYPER[s.qtype] || '') + '</span>' + (erVert() && s.fase === 'spm' ? '<span class="nr-les">' + T('Les det høyt', 'Read it out loud') + '</span>' : '') +
      '<p>' + esc(s.q) + '</p></div>';
  }
  function nrTastatur(s) {
    var nokkel = s.rid + ':' + s.i, mitt = s.mittSvar;
    if (nrTall.k !== nokkel) nrTall = { k: nokkel, v: mitt ? String(mitt).replace(/\D/g, '') : '' };
    var taster = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '000', '0', '⌫'];
    return '<div class="nr-tall"><label for="nrTallUt">' + T('Gjetningen din', 'Your guess') + '</label><output id="nrTallUt" class="nr-tall-ut">' + (nrFormat(nrTall.v) || '0') + '</output>' +
      '<div class="nr-taster">' + taster.map(function (k) { return '<button type="button" data-g="nr-tast" data-k="' + k + '"' + (k === '⌫' ? ' aria-label="' + T('Slett', 'Delete') + '" class="graa"' : k === '000' ? ' class="graa"' : '') + '>' + k + '</button>'; }).join('') + '</div>' +
      '<button type="button" class="nr-las" id="nrLas" data-g="nr-las">' + nrLasTekst(mitt) + '</button></div>';
  }
  function nrLasTekst(mitt) {
    var v = nrFormat(nrTall.v) || '0';
    if (mitt && String(mitt).replace(/\D/g, '') === nrTall.v) return T('Låst inn: ', 'Locked in: ') + v;
    return (mitt ? T('Bytt til ', 'Change to ') : T('Lås inn ', 'Lock in ')) + v;
  }
  function nrTallinje(s) {
    var t = s.tall; if (!t) return '';
    // Fasiten i midten, gjetningene etter hvor mange ganger for høyt eller lavt de var (så én vill gjetning ikke klemmer resten sammen)
    var pos;
    if (t.fasit > 0 && t.gjett.every(function (g) { return g.v > 0; })) {
      var r = t.gjett.map(function (g) { return Math.abs(Math.log(g.v / t.fasit)); }), maks = Math.max.apply(null, [0.05].concat(r));
      pos = function (v) { return (50 + 44 * Math.log(v / t.fasit) / maks).toFixed(2); };
    } else {
      var alle = t.gjett.map(function (g) { return g.v; }).concat([t.fasit]);
      var lo = Math.min.apply(null, alle), hi = Math.max.apply(null, alle); if (hi - lo < 1e-9) { lo -= 1; hi += 1; }
      var pad = (hi - lo) * 0.08; pos = function (v) { return ((v - lo + pad) / (hi - lo + 2 * pad) * 100).toFixed(2); };
    }
    // Nålene over linja, i rader så de ikke dekker hverandre; fasiten som et flagg under linja
    var sortert = t.gjett.slice().sort(function (a, b) { return a.v - b.v; }), rader = [];
    var pinner = sortert.map(function (g, i) {
      var x = Number(pos(g.v)), rad = 0;
      while (rader[rad] != null && x - rader[rad] < 17) rad++;
      rader[rad] = x;
      return '<div class="nr-pinne" style="left:' + x + '%;--i:' + i + ';--h:' + (14 + rad * 46) + 'px;z-index:' + (10 - rad) + '">' + nrHode(g.id, s.resultat[g.id] === 2 ? 'beste' : '', s.resultat[g.id] < 0 ? 'flat' : '') + '<small>' + esc(nrFormat(g.v)) + '</small><i></i></div>';
    }).join('');
    var hoyde = 96 + Math.max(0, rader.length - 1) * 46;
    return '<div class="nr-linje' + (nrVist !== s.rid + ':' + s.i ? ' inn' : '') + '" style="height:' + (hoyde + 56) + 'px" role="img" aria-label="' + T('Svaret er ', 'The answer is ') + esc(nrFormat(t.fasit)) + '">' + pinner +
      '<div class="nr-fasit-flagg" style="left:' + pos(t.fasit) + '%;--n:' + sortert.length + '"><i></i><b>' + esc(nrFormat(t.fasit)) + '</b></div><div class="nr-akse"></div></div>';
  }
  function nrResultat(s, k) {
    var tall = s.qtype === 'tall', mitt = s.mittSvar;
    var tittel = k === 2 ? T('Nærmest – del ut to', 'Closest – hand out two') : k === 1 ? (tall ? T('Innen 10 % – del ut én', 'Within 10% – hand out one') : T('Riktig – del ut én', 'Right – hand out one'))
      : k === 0 ? T('Midt på treet – ingenting', 'Somewhere in between – nothing') : !mitt ? T('Ingen svar – drikk én', 'No answer – drink one') : tall ? T('Lengst unna – drikk én', 'Furthest off – drink one') : T('Feil – drikk én', 'Wrong – drink one');
    return '<div class="nr-resultat ' + (k > 0 ? 'rett' : k === 0 ? 'null' : 'feil') + (nrVist !== s.rid + ':' + s.i ? ' inn' : '') + '"><b>' + tittel + '</b>' +
      (s.info ? '<span>' + esc(s.info) + (s.url ? ' <a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + T('Les saken hos ', 'Read it at ') + esc(s.kilde) + '</a>' : '') + '</span>' : '') + '</div>';
  }
  function nyhetsrundenSpill(s) {
    var vert = erVert(), alle = tilstand.spillere || [];
    if (s.fase === 'klar') {
      var valg = [10, 15, 30].filter(function (n) { return n < s.totalt; }).concat([s.totalt]).filter(function (n, i, a) { return a.indexOf(n) === i; });
      return nrTopp(s, s.lengde + T(' spørsmål', ' questions'), false) +
        '<p class="nr-forside">' + T('Uke ', 'Week ') + s.uke + '.<br>' + T('Hva fikk dere med dere?', 'Were you paying attention?') + '</p>' +
        '<div class="nr-folk nr-folk-h">' + alle.map(function (p, i) { return '<span style="--i:' + i + '">' + nrHode(p.id) + '</span>'; }).join('') + '</div>' +
        (vert ? '<div class="nr-lengder">' + valg.map(function (n) {
              return '<button type="button" data-g="nr-lengde" data-n="' + n + '" aria-pressed="' + (s.lengde === n) + '"><b>' + n + '</b><small>' + (n === s.totalt ? T('Hele', 'All') : n <= 10 ? T('Kort', 'Short') : T('Vanlig', 'Usual')) + '</small></button>'; }).join('') + '</div>' +
            '<button class="rom-stor-knapp" data-g="nr-start" type="button">' + T('Første spørsmål', 'First question') + '</button>'
          : '<p class="nr-vent">' + T('Venter på at ', 'Waiting for ') + esc(navn(s.vert)) + T(' starter …', ' to start …') + '</p>');
    }
    if (s.fase === 'ferdig') return nrFerdig(s, vert);
    var spm = s.fase === 'spm', har = s.harSvart || [];
    var topp = nrTopp(s, T('Spørsmål ', 'Question ') + (s.i + 1) + T(' av ', ' of ') + s.antall, spm);
    if (spm) {
      var mitt = s.mittSvar, input;
      if (s.alt) input = '<div class="nr-alt' + (s.alt.length === 2 ? ' to' : '') + '">' + s.alt.map(function (a, i) {
        return '<button type="button" class="nr-a" data-g="nr-svar" data-v="' + esc(a) + '" aria-pressed="' + (mitt === a) + '"><i>' + 'ABCD'.charAt(i) + '</i><span>' + esc(a) + '</span></button>'; }).join('') + '</div>';
      else if (s.qtype === 'tall') input = nrTastatur(s);
      else input = '<form class="nr-fritt" id="nrSkjema"><label for="nrInput">' + T('Svaret ditt', 'Your answer') + '</label><div><input id="nrInput" maxlength="80" autocomplete="off" enterkeyhint="send" placeholder="' + T('Skriv svaret ditt', 'Type your answer') + '" value="' + esc(mitt || '') + '">' +
        '<button type="submit">' + (mitt ? T('Endre', 'Change') : T('Svar', 'Answer')) + '</button></div>' + (mitt ? '<small>' + T('Du svarte: ', 'You answered: ') + '<b>' + esc(mitt) + '</b></small>' : '') + '</form>';
      var mangler = alle.length - har.length;
      return topp +
        nrSporsmal(s) + input +
        (vert ? '<button class="rom-stor-knapp nr-vis" data-g="nr-vis" type="button"' + (mangler > 0 ? ' data-vent="1"' : '') + '>' + (mangler > 0 ? T('Vis svaret nå', 'Show the answer now') + ' <small>(' + mangler + T(' mangler', ' missing') + ')</small>' : T('Vis svaret', 'Show the answer')) + '</button>'
          : '<p class="nr-vent">' + (mitt ? T('Låst inn.', 'Locked in.') : '') + '</p>');
    }
    // Svaret er vist
    var nokkel = s.rid + ':' + s.i, inn = nrVist !== nokkel, res = s.resultat || {}, sv = s.svarene || {};
    var midt = '';
    if (s.alt) midt = '<div class="nr-alt' + (s.alt.length === 2 ? ' to' : '') + (inn ? ' inn' : '') + '">' + s.alt.map(function (a, i) {
      var rett = a === s.fasit, minn = s.mittSvar === a, hvem = alle.filter(function (p) { return sv[p.id] === a; });
      return '<div class="nr-a avslort' + (rett ? ' rett' : minn ? ' feil' : ' dempet') + '"><i>' + 'ABCD'.charAt(i) + '</i><span>' + esc(a) + '</span><span class="nr-hvem">' + hvem.map(function (p, j) { return '<span style="--i:' + (i * 2 + j) + '">' + nrHode(p.id, '', rett ? '' : 'flat') + '</span>'; }).join('') + '</span>' +
        (rett || minn ? '<em class="nr-stempel' + (inn ? ' inn' : '') + '">' + (rett ? T('Riktig', 'Right') : T('Feil', 'Wrong')) + '</em>' : '') + '</div>'; }).join('') + '</div>';
    else if (s.qtype === 'tall' && s.tall) midt = '<div class="nr-fasit-boks"><span>' + T('Svaret', 'The answer') + '</span><b>' + esc(s.fasit) + '</b></div>' + nrTallinje(s);
    else midt = '<div class="nr-fasit-boks"><span>' + T('Svaret', 'The answer') + '</span><b>' + esc(s.fasit) + '</b></div>';
    // Fritt og tall: hva hver enkelt svarte (verten kan rette en vurdering)
    var liste = s.alt ? '' : '<ul class="nr-liste">' + alle.slice().sort(function (a, b) { return (res[b.id] || -1) - (res[a.id] || -1); }).map(function (p) {
      var k = res[p.id], merke = k === 2 ? T('Nærmest', 'Closest') : k === 1 ? (s.qtype === 'tall' ? T('Innen 10 %', 'Within 10%') : T('Riktig', 'Right')) : k === 0 ? '–' : T('Drikk', 'Drink');
      return '<li class="' + (k > 0 ? 'rett' : k === 0 ? 'null' : 'feil') + '">' + nrHode(p.id, '', k < 0 ? 'flat' : '') + '<span class="nr-navn">' + esc(p.navn) + '</span><span class="nr-hva">' + (sv[p.id] ? esc(s.qtype === 'tall' && /^\d+$/.test(sv[p.id]) ? nrFormat(sv[p.id]) : sv[p.id]) : '<i>' + T('ingen svar', 'no answer') + '</i>') + '</span>' +
        (vert ? '<button type="button" data-g="nr-flipp" data-id="' + p.id + '" aria-label="' + T('Endre vurdering for ', 'Change the verdict for ') + esc(p.navn) + '">' + merke + '</button>' : '<b>' + merke + '</b>') + '</li>';
    }).join('') + '</ul>';
    var megMed = alle.some(function (p) { return p.id === tilstand.meg; });
    var ut = topp + nrSporsmal(s, true) + midt + (megMed ? nrResultat(s, res[tilstand.meg]) : '') + liste +
      (vert ? '<button class="rom-stor-knapp" data-g="nr-neste" type="button">' + (s.i + 1 < s.antall ? T('Neste spørsmål', 'Next question') : T('Se hvem som vant', 'See who won')) + '</button>'
        : '<p class="nr-vent">' + esc(navn(s.vert)) + T(' tar neste spørsmål.', ' moves on to the next question.') + '</p>');
    nrVist = nokkel;
    return ut;
  }
  function nrFerdig(s, vert) {
    var l = s.tavle || [], k = s.kaaringer || {}, nokkel = 'slutt:' + s.rid + ':' + s.antall, inn = nrVist !== nokkel;
    if (s.rid) { var sp = nrSpilt(); if (sp.indexOf(s.rid) === -1) { sp.push(s.rid); skriv('bd_nr_spilt', sp.slice(-300)); } }
    var delt = l.filter(function (x) { return l[0] && x.riktige === l[0].riktige; });
    var tittel = !l[0] || !l[0].riktige ? T('Ingen fikk noe riktig', 'Nobody got anything right') : delt.length > 1 ? T('Delt seier: ', 'Shared win: ') + delt.map(function (x) { return esc(x.navn); }).join(T(' og ', ' and ')) : T('Ukens nyhetsnerd: ', 'News nerd of the week: ') + esc(l[0].navn);
    var plass = [l[1], l[0], l[2]], hoyde = [0.66, 1, 0.48];
    var pall = '<div class="nr-pall' + (inn ? ' inn' : '') + '">' + plass.map(function (x, i) {
      if (!x) return '<div></div>';
      return '<div class="nr-pall-plass' + (i === 1 ? ' forst' : '') + '" style="--h:' + hoyde[i] + ';--i:' + [1, 2, 0][i] + '">' + (i === 1 ? '<svg class="nr-krone" viewBox="0 0 40 26" aria-hidden="true"><path d="M3 23l3-19 8 8 6-11 6 11 8-8 3 19z"/></svg>' : '') +
        nrHode(x.id, 'stor') + '<b>' + esc(x.navn) + '</b><div class="nr-pall-blokk"><span>' + x.riktige + '</span></div></div>';
    }).join('') + '</div>';
    var kaar = [];
    if (k.tall) kaar.push('<b>' + T('Tallgeni:', 'Number genius:') + '</b> ' + esc(navn(k.tall.id)) + T(' var nærmest på ', ' was closest on ') + k.tall.n + T(' av ', ' of ') + k.tallAntall + T(' tallspørsmål', ' number questions'));
    if (k.lurt) kaar.push('<b>' + T('Lurt av tull:', 'Fooled by nonsense:') + '</b> ' + esc(navn(k.lurt.id)) + T(' trodde på ', ' believed ') + k.lurt.n + T(' av ', ' of ') + k.tullAntall + T(' tullesaker', ' made-up stories'));
    if (k.ingen) kaar.push('<b>' + T('Ingen fikk:', 'Nobody got:') + '</b> «' + esc(String(k.ingen.q).slice(0, 90)) + (String(k.ingen.q).length > 90 ? '…' : '') + '» (' + esc(k.ingen.svar) + ')');
    var rest = l.slice(3);
    var valg = [10, 15, 30].filter(function (n) { return n < s.totalt; }).concat([s.totalt]).filter(function (n, i, a) { return a.indexOf(n) === i; });
    var ut = '<p class="nr-etikett">' + T('Nyhetsrunden · uke ', 'Nyhetsrunden · week ') + s.uke + ' · ' + s.antall + T(' spørsmål', ' questions') + '</p><h2 class="nr-vinner">' + tittel + '</h2>' + pall +
      (kaar.length ? '<ul class="nr-kaaringer">' + kaar.map(function (x, i) { return '<li style="--i:' + i + '">' + x + '</li>'; }).join('') + '</ul>' : '') +
      (rest.length ? '<ol class="nr-rest" start="4">' + rest.map(function (x) { return '<li>' + nrHode(x.id) + '<span>' + esc(x.navn) + '</span><b>' + x.riktige + '</b></li>'; }).join('') + '</ol>' : '') +
      (vert ? '<p class="nr-etikett">' + T('Ny runde fra uke ', 'New round from week ') + s.uke + '</p><div class="nr-lengder">' + valg.map(function (n) {
            return '<button type="button" data-g="nr-nytt" data-n="' + n + '"><b>' + n + '</b><small>' + (n === s.totalt ? T('Hele', 'All') : n <= 10 ? T('Kort', 'Short') : T('Vanlig', 'Usual')) + '</small></button>'; }).join('') + '</div>' +
          '<p class="small">' + T('Kort og vanlig tar spørsmål dere ikke har hatt ennå.', 'Short and usual pick questions you have not had yet.') + '</p>' : '');
    nrVist = nokkel;
    return ut;
  }
  root.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-g="nr-tast"],[data-g="nr-las"]'); if (!b || !tilstand || !tilstand.spill) return;
    e.stopPropagation();
    if (b.dataset.g === 'nr-las') { if (nrTall.v) gjorAlltid({ handling: 'nr-svar', v: nrTall.v }); return; }
    var k = b.dataset.k;
    if (k === '⌫') nrTall.v = nrTall.v.slice(0, -1);
    else if (nrTall.v.length < 12) nrTall.v = (nrTall.v === '0' ? '' : nrTall.v) + k;
    nrTall.v = nrTall.v.replace(/^0+(?=\d)/, '');
    var ut = document.getElementById('nrTallUt'), las = document.getElementById('nrLas');
    if (ut) ut.textContent = nrFormat(nrTall.v) || '0';
    if (las) las.textContent = nrLasTekst(tilstand.spill.mittSvar);
    try { navigator.vibrate && navigator.vibrate(6); } catch (x) {}
  }, true);

  /* ---------- reaksjoner og «send en slurk» ---------- */
  /* Snakkebobler: det du skriver står over figuren din i 20 sekunder, hos alle. Noen ord gjør noe ekstra i stua:
     «skål» får alle til å drikke, «disco» tenner diskokula, navnet på en i rommet får dem til å vinke til deg,
     og et ❤️ eller «elsker» gjør figuren din forelsket. */
  function stuaSnakk(st, fra, tekst) {
    st.personSi(fra, tekst, 20000);
    var t = String(tekst).toLowerCase(), alle = (tilstand.spillere || []).map(function (p) { return p.id; });
    if (/sk[åa]l|cheers|🍻/.test(t)) setTimeout(function () { st.hendelse('drikk', alle); }, 400);
    else if (/disco|disko|🪩/.test(t)) { try { st.disco(); } catch (e) {} }
    else if (/❤|elsker|love|😍/.test(t)) setTimeout(function () { st.reaksjon(fra, '😍', null); }, 400);
    else if (/😂|haha|lol/.test(t)) setTimeout(function () { st.reaksjon(fra, '😂', null); }, 400);
    (tilstand.spillere || []).forEach(function (p) {
      if (p.id !== fra && p.navn && p.navn.length >= 3 && t.indexOf(p.navn.toLowerCase()) !== -1) setTimeout(function () { st.reaksjon(p.id, '✨', 'vink'); }, 600);
    });
  }
  /** «Si noe»: et lite ark med ett felt. Sendes som reaksjon, så alle får boblen samtidig. */
  function siArk() {
    lukkArk();
    var m = lagArk('si-ark', T('Si noe', 'Say something')), kropp = m.querySelector('.ark-kropp');
    kropp.innerHTML = '<form class="si-skjema" id="siSkjema"><input id="siInput" maxlength="40" autocomplete="off" enterkeyhint="send" placeholder="' + T('Maks 40 tegn …', 'Max 40 characters …') + '">' +
      '<button class="btn gold" type="submit">' + T('Send', 'Send') + '</button></form>' +
      '<p class="small">' + T('Står over figuren din i stua i 20 sekunder – hos alle. Prøv «skål» eller navnet på noen. Hatefulle ord vises ikke – og koster en slurk.', 'Stays above your figure for 20 seconds – for everyone. Try “cheers” or someone’s name. Hateful words are hidden – and cost a sip.') + '</p>';
    kropp.querySelector('#siSkjema').addEventListener('submit', function (e) {
      e.preventDefault(); var t = kropp.querySelector('#siInput').value.trim(); if (!t) return;
      gjorAlltid({ handling: 'si', tekst: t }); lukkArk();
    });
    aapentArk = { el: m, oppdater: function () {} };
    setTimeout(function () { var i = kropp.querySelector('#siInput'); if (i) i.focus(); }, 50);
  }
  var sisteReak = -1, reakMer = false;
  function visReaksjoner(liste) {
    if (!liste || !liste.length) { if (sisteReak < 0) sisteReak = 0; return; }
    var nyeste = liste[liste.length - 1].nr;
    if (sisteReak < 0) { sisteReak = nyeste; return; }   // ikke spill av gamle reaksjoner når man kommer inn
    liste.forEach(function (r) {
      if (r.nr <= sisteReak) return;
      var el = document.createElement('div');
      el.className = 'reak-fly' + (r.til ? ' send' : '');
      el.style.left = (8 + Math.random() * 55) + '%';
      el.innerHTML = '<span>' + esc(r.e) + '</span>' + (r.til ? '<small>' + esc(navn(r.fra)) + ' → ' + esc(navn(r.til)) + '</small>' : '<small>' + esc(navn(r.fra)) + '</small>');
      document.body.appendChild(el);
      setTimeout(function () { el.remove(); }, 2600);
      // Figuren i stua gjør det samme – hos alle
      if (r.t) { if (stua) stuaSnakk(stua, r.fra, r.t); el.remove(); return; }
      if (r.slurk) { if (stua) stua.straff(r.fra, T('Ikke sånt her 🍺', 'Not here 🍺')); if (r.fra === tilstand.meg) { spillLyd('womp'); toast(T('Sånt sier vi ikke her. Det kostet en slurk 🍺', 'We don’t say that here. That cost you a sip 🍺')); } return; }
      if (stua && !r.til) stua.reaksjon(r.fra, r.e, r.b || null);
      if (!(r.til && r.til === tilstand.meg) && r.fra !== tilstand.meg) spillLyd('pop');
      if (r.til && r.til === tilstand.meg) {
        toast(navn(r.fra) + T(' sendte deg en slurk 🍺', ' sent you a sip 🍺'));   // lyd og DRIKK-varsel kommer fra slurketelleren
      }
    });
    sisteReak = nyeste;
  }
  function reaksjonslinje() {
    var megS = (tilstand.spillere || []).find(function (p) { return p.id === tilstand.meg; }) || {};
    var hint = les('bd_intro_reak') ? '' : '<p class="small reak-hint">' + T('👆 Trykk en emoji for å sende den til alle telefonene. 🔊 slår lyden av og på.', '👆 Tap an emoji to send it to every phone. 🔊 turns sound on and off.') + '</p>';
    return hint + '<div class="reak-linje' + (reakMer ? ' aapen' : '') + '" id="reakLinje">' + ['🍻', '😂', '🔥', '😱', '👏'].map(function (e) {
      return '<button type="button" data-g="reager" data-e="' + e + '" aria-label="Send ' + e + '">' + e + '</button>';
    }).join('') + '<span class="reak-ekstra">' + ['😍', '🤢', '🥴', '🙈', '🤘'].map(function (e) {
      return '<button type="button" data-g="reager" data-e="' + e + '" aria-label="Send ' + e + '">' + e + '</button>';
    }).join('') + '</span><button type="button" class="reak-mer" data-g="reak-mer" aria-expanded="' + reakMer + '" aria-label="' + T('Flere reaksjoner', 'More reactions') + '">' + (reakMer ? '↩' : '+') + '</button>' +
      '<button type="button" data-g="si-aapne" aria-label="' + T('Si noe', 'Say something') + '">💬</button>' +
      '<button type="button" data-g="lyd" aria-label="' + (lyd.paa ? T('Skru av lyd', 'Turn sound off') : T('Skru på lyd', 'Turn sound on')) + '" aria-pressed="' + lyd.paa + '">' + (lyd.paa ? '🔊' : '🔇') + '</button>' +
      (megS.gi ? '' : '<!-- ingen slurker å dele ut -->') + '<button type="button" class="reak-send" data-g="del-ut"' + (megS.gi ? '' : ' hidden') + ' aria-label="' + T('Del ut ', 'Hand out ') + (megS.gi || 0) + '">' + T('Del ut', 'Hand out') + ' <b>' + (megS.gi || 0) + '</b></button></div>';
  }
  /* ---------- Slurker: hva du har drukket, og hva du kan dele ut ----------
     Linja under leken viser begge tallene hele tiden. «Del ut» åpner et ark der du velger hvor mange,
     og om de skal fordeles på alle andre eller på dem du velger. Går det ikke opp, får de som har
     drukket minst resten – det er rettferdig og lett å forklare. */
  var sisteEgne = { slurker: null, gi: null };
  function slurkelinje() {
    var p = (tilstand.spillere || []).find(function (x) { return x.id === tilstand.meg; }); if (!p) return '';
    var sl = p.slurker || 0, gi = p.gi || 0;
    var drakk = sisteEgne.slurker !== null && sl > sisteEgne.slurker, fikk = sisteEgne.gi !== null && gi > sisteEgne.gi;
    sisteEgne = { slurker: sl, gi: gi };
    return '<div class="slurkelinje"><div class="sl-celle"><small>' + (tilstand.alkoholfri ? T('Straffepoeng i kveld', 'Penalty points tonight') : T('Drukket i kveld', 'Drunk tonight')) + '</small><b class="sl-tall' + (drakk ? ' okt' : '') + '">' + sl + '</b></div>' +
      '<button type="button" class="sl-gi' + (fikk ? ' okt' : '') + '" data-g="del-ut"' + (gi ? '' : ' disabled') + '><small>' + T('Du kan dele ut', 'You can hand out') + '</small><span><b class="sl-tall">' + gi + '</b>' + (gi ? '<em>' + T('Del ut', 'Hand out') + '</em>' : '') + '</span></button></div>';
  }
  /** Fordel `antall` likt på mottakerne. Resten går til dem som har drukket minst. */
  function fordel(mottakere, antall) {
    var ut = {}; if (!mottakere.length) return ut;
    var base = Math.floor(antall / mottakere.length), rest = antall % mottakere.length;
    mottakere.forEach(function (p) { ut[p.id] = base; });
    mottakere.slice().sort(function (a, b) { return (a.slurker || 0) - (b.slurker || 0); }).forEach(function (p) { if (rest > 0) { ut[p.id]++; rest--; } });
    return ut;
  }
  var GLASS = '<svg viewBox="0 0 24 28" aria-hidden="true"><path d="M4 3h16l-1.8 22H5.8z"/></svg>';
  function delUtArk() {
    var megS = (tilstand.spillere || []).find(function (p) { return p.id === tilstand.meg; }) || {};
    var gi = megS.gi || 0;
    if (!gi) return toast(T('Du har ingenting å dele ut ennå. Vinn noe først!', 'You have nothing to hand out yet. Win something first!'));
    var andre = tilstand.spillere.filter(function (p) { return p.id !== tilstand.meg; });
    if (!andre.length) return toast(T('Det er ingen andre i rommet ennå.', 'There’s nobody else in the room yet.'));
    var st = { antall: gi, modus: 'alle', valgt: {} };
    var m = document.createElement('div'); m.className = 'rom-tavle ut-ark'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-label', T('Del ut', 'Hand out'));
    m.innerHTML = '<div class="rom-tavle-innhold"><div class="rom-tavle-topp"><h2>' + T('Del ut ', 'Hand out ') + '<em data-u="tittel"></em></h2><button class="linkbtn" data-u="lukk" type="button">' + T('Lukk', 'Close') + '</button></div>' +
      '<div class="ut-rad">' + (gi <= 10 ? '<div class="ut-glass">' + Array(gi + 1).join(GLASS) + '</div>' : '<div class="ut-glass"></div>') +
      '<div class="ut-steg"><button type="button" data-u="faerre" aria-label="' + T('Én færre', 'One fewer') + '">−</button><button type="button" data-u="flere" aria-label="' + T('Én flere', 'One more') + '">+</button></div></div>' +
      '<p class="ut-spar" data-u="spar" aria-live="polite"></p>' +
      '<div class="ut-modus" role="group"><i aria-hidden="true"></i><button type="button" data-u="alle">' + T('Alle andre', 'Everyone else') + '</button><button type="button" data-u="velg">' + T('Velg hvem', 'Choose who') + '</button></div>' +
      '<p class="ut-forklar" data-u="forklar"></p>' +
      '<ul class="ut-liste">' + andre.map(function (p) {
        return '<li><button type="button" data-u="rad" data-id="' + p.id + '"><span class="ut-init">' + esc(String(p.navn).slice(0, 2)) + '</span><span class="ut-navn"><b>' + esc(p.navn) + '</b><small>' +
          (tilstand.alkoholfri ? T('har ', 'has ') + (p.slurker || 0) + T(' straffepoeng', ' penalty points') : T('har drukket ', 'has drunk ') + (p.slurker || 0)) + '</small></span><span class="ut-merke"></span></button></li>'; }).join('') + '</ul>' +
      '<button type="button" class="rom-stor-knapp ut-send" data-u="send"></button></div>';
    function mottakere() { return st.modus === 'alle' ? andre : andre.filter(function (p) { return st.valgt[p.id]; }); }
    function oppdater() {
      var velg = st.modus === 'velg', mot = mottakere(), f = fordel(mot, st.antall), spar = gi - st.antall, ingen = velg && !mot.length;
      m.querySelector('[data-u=tittel]').textContent = st.antall + ' ' + slurkOrd(st.antall);
      m.querySelectorAll('.ut-glass svg').forEach(function (g, i) { g.classList.toggle('fylt', i < st.antall); });
      m.querySelector('[data-u=faerre]').disabled = st.antall <= 1;
      m.querySelector('[data-u=flere]').disabled = st.antall >= gi;
      m.querySelector('[data-u=spar]').textContent = spar ? T('Du deler ut ' + st.antall + ' nå og sparer ' + spar + ' til senere.', 'You hand out ' + st.antall + ' now and keep ' + spar + ' for later.') : T('Du deler ut alle nå.', 'You hand out all of them now.');
      m.querySelector('.ut-modus').classList.toggle('velg', velg);
      m.querySelector('[data-u=alle]').setAttribute('aria-pressed', String(!velg));
      m.querySelector('[data-u=velg]').setAttribute('aria-pressed', String(velg));
      m.querySelector('[data-u=forklar]').textContent = velg
        ? (ingen ? T('Trykk på dem som skal drikke. Det fordeles likt mellom dem.', 'Tap the people who should drink. It’s split evenly between them.') : T('Fordeles likt mellom dem du har valgt. Går det ikke opp, får den som har drukket minst resten.', 'Split evenly between the people you chose. If it doesn’t divide evenly, whoever has drunk least gets the rest.'))
        : T('Fordeles likt på alle andre enn deg. Går det ikke opp, får de som har drukket minst resten.', 'Split evenly between everyone but you. If it doesn’t divide evenly, whoever has drunk least gets the rest.');
      m.querySelectorAll('[data-u=rad]').forEach(function (r) {
        var id = r.dataset.id, n = f[id] || 0, valgt = !!st.valgt[id], merke = r.querySelector('.ut-merke');
        r.classList.toggle('valgbar', velg); r.classList.toggle('valgt', velg && valgt);
        if (velg) r.setAttribute('aria-pressed', String(valgt)); else r.removeAttribute('aria-pressed');
        merke.textContent = n ? '+' + n : (velg && !valgt ? '' : '0');
        merke.classList.toggle('pa', n > 0); merke.classList.toggle('tom', velg && !valgt);
      });
      var send = m.querySelector('[data-u=send]');
      send.disabled = ingen;
      send.textContent = ingen ? T('Velg hvem som skal drikke', 'Choose who drinks') : T('Send ', 'Send ') + st.antall + ' ' + slurkOrd(st.antall);
    }
    m.addEventListener('click', function (e) {
      if (e.target === m) return m.remove();
      var b = e.target.closest('[data-u]'); if (!b || b.disabled) return;
      var u = b.dataset.u;
      if (u === 'lukk') return m.remove();
      if (u === 'faerre') st.antall = Math.max(1, st.antall - 1);
      if (u === 'flere') st.antall = Math.min(gi, st.antall + 1);
      if (u === 'alle' || u === 'velg') st.modus = u;
      if (u === 'rad') { if (st.modus !== 'velg') { st.modus = 'velg'; st.valgt = {}; } st.valgt[b.dataset.id] = !st.valgt[b.dataset.id]; }
      if (u === 'send') {
        var f = fordel(mottakere(), st.antall);
        var liste = Object.keys(f).filter(function (id) { return f[id] > 0; }).map(function (id) { return { id: id, n: f[id] }; });
        if (liste.length) gjorAlltid({ handling: 'del-ut', liste: liste });
        return m.remove();
      }
      oppdater();
    });
    oppdater();
    document.body.appendChild(m);
  }

  /* ---------- Gjengens lov ---------- */
  var gjengSjekk = '', gjengSjekket = false;
  /** Kobler denne telefonen til kontoen i gjengen (medlemmer kan stemme over lover). */
  function sjekkGjengMedlem() {
    var t = tilstand; if (!t || !t.gjeng || !meg || gjengSjekket) return;
    var jeg = (t.spillere || []).find(function (p) { return p.id === t.meg; });
    if (!jeg || jeg.medlem) return;
    if (!(window.BDKonto && window.BDKonto.les())) { gjengSjekk = 'logg-inn'; return; }
    gjengSjekket = true;
    api('POST', '/api/rom/' + kode, { handling: 'gjeng-meg', id: meg.id, pollett: meg.pollett }).then(ta).catch(function (e) { gjengSjekk = e.kode || 'feil'; tegn(); });
  }
  function gjengBoks() {
    var t = tilstand; if (!t.gjeng) return '';
    var jeg = (t.spillere || []).find(function (p) { return p.id === t.meg; });
    if (!jeg || jeg.medlem) return '';
    if (!jeg.invitert && !erVert()) return '';
    if (gjengSjekk === 'logg-inn') return '<p class="lov-medlem">🤝 ' + T('Du er invitert inn i <b>' + esc(t.gjeng.navn) + '</b>. Logg inn eller lag en gratis konto for å bli medlem. ', 'You’re invited to join <b>' + esc(t.gjeng.navn) + '</b>. Log in or create a free account to become a member. ') + '<a href="' + RUTE.konto + '" data-lov-login>' + T('Logg inn', 'Log in') + '</a></p>';
    if (gjengSjekk === 'ikke-medlem') return '<p class="lov-medlem">' + T('Du er ikke med i ', 'You’re not in ') + '<b>' + esc(t.gjeng.navn) + '</b>' + T(' ennå. ', ' yet. ') + '<button class="btn small gold" data-g="lov-bli" type="button">' + T('Bli med i gjengen', 'Join the crew') + '</button></p>';
    return '';
  }
  /* ---------- sosiale leker ---------- */
  function skriveFelt(plass, knapp, maks) {
    return '<form class="rf-skjema" id="sosSkjema"><div class="rf-rad"><input id="sosInput" maxlength="' + (maks || 120) + '" autocomplete="off" enterkeyhint="send" placeholder="' + esc(plass) + '">' +
      '<button class="btn gold" type="submit">' + esc(knapp) + '</button></div></form>';
  }
  function hvem(ider) { return (ider || []).map(function (id) { return esc(navn(id)); }).join(', '); }
  function spillerKnapper(g, unntak, valgt) {
    return '<div class="rom-valg">' + tilstand.spillere.filter(function (p) { return (unntak || []).indexOf(p.id) === -1; }).map(function (p) {
      return '<button type="button" data-g="' + g + '" data-paa="' + p.id + '" aria-pressed="' + (valgt === p.id) + '">' + esc(p.navn) + '</button>';
    }).join('') + '</div>';
  }
  function nyRundeKnapp(tekst) { return '<button class="rom-stor-knapp" data-g="runde" type="button">' + esc(tekst) + '</button>'; }

  /* ---------- Ukjent avsender: svarene kommer som meldinger fra et ukjent nummer ---------- */
  var hsEndre = false, hsSist = null, hsVist = '', hsSendtVist = '';
  var HS_KONVOLUTT = '<svg class="hs-konv" viewBox="0 0 120 92" aria-hidden="true"><rect class="hs-lapp" x="22" y="4" width="76" height="52" rx="4"/><path class="hs-lapp hs-linjer" d="M32 18h56M32 28h40"/><rect class="hs-kropp" x="6" y="30" width="108" height="58" rx="6"/><path class="hs-fold" d="M6 88l44-32h20l44 32"/><path class="hs-klaff" d="M6 30l54 38 54-38z"/></svg>';
  function hsTopp(s, chip, gul, klokke) {
    var et = s.fase === 'gjett' || s.fase === 'fasit' ? T('Ukjent avsender · melding ', 'Unknown sender · message ') + (s.i + 1) + T(' av ', ' of ') + s.antallSvar : T('Ukjent avsender · runde ', 'Unknown sender · round ') + (s.runde || 1);
    return jaTopp(et, chip, gul, klokke);
  }
  function hsNavn(id) { return id === tilstand.meg ? T('Du', 'You') : esc(navn(id)); }
  function hsMelding(s, inn) {
    var fasit = s.fase === 'fasit';
    var kontakt = fasit ? '<span class="hs-avatar' + (inn ? ' inn' : '') + '">' + nrHode(s.forfatter) + '</span><span class="hs-hvem"><b' + (inn ? ' class="inn"' : '') + '>' + (s.forfatter === tilstand.meg ? T('Deg', 'You') : esc(navn(s.forfatter))) + '</b>'
      : '<span class="hs-ukjent" aria-hidden="true">?</span><span class="hs-hvem"><b>' + T('Ukjent avsender', 'Unknown sender') + '</b>';
    return '<div class="hs-melding' + (inn && !fasit ? ' ny' : '') + '"><div class="hs-kontakt">' + kontakt + '<small>' + T('Melding ', 'Message ') + (s.i + 1) + T(' av ', ' of ') + s.antallSvar + '</small></span></div>' +
      '<div class="hs-innhold">' + (inn && !fasit ? '<span class="hs-prikker" aria-hidden="true"><i></i><i></i><i></i></span>' : '') + '<p class="hs-boble">' + esc(s.tekst || '') + '</p></div></div>';
  }
  function hsStatus(s, n) { return '<p class="hs-status">' + (s.harStemt || []).length + T(' av ', ' of ') + Math.max(0, n - 1) + T(' har gjettet', ' guessed') + '</p>'; }
  function hvemskrevSpill(s) {
    var alle = tilstand.spillere || [], n = alle.length, meg = tilstand.meg;
    var oppg = function (liten) { return '<div class="nr-kort hs-oppgave' + (liten ? ' liten' : '') + '"><p>' + esc(s.oppgave) + '</p></div>'; };
    if (s.fase === 'skriv') {
      if (s.mittSvar !== hsSist) { hsSist = s.mittSvar; hsEndre = false; }
      var skjema = !s.mittSvar || hsEndre, sk = (s.runde || 1) + ':' + (s.mittSvar || ''), sInn = hsSendtVist !== sk; if (!skjema) hsSendtVist = sk;
      return hsTopp(s, T('Svar anonymt', 'Answer anonymously'), true, true) + oppg(false) +
        (skjema ? '<form class="hs-skjema" id="sosSkjema"><label for="sosInput">' + T('Ingen får vite at det var deg', 'Nobody will know it was you') + '</label>' +
            '<textarea id="sosInput" rows="3" maxlength="160" placeholder="' + T('Svaret ditt …', 'Your answer …') + '">' + (hsEndre ? esc(s.mittSvar || '') : '') + '</textarea>' +
            '<button class="rom-stor-knapp" type="submit">' + T('Send anonymt', 'Send anonymously') + '</button></form>'
          : '<div class="hs-sendt' + (sInn ? ' inn' : '') + '">' + HS_KONVOLUTT + '<p>' + T('Sendt anonymt', 'Sent anonymously') + '</p><button type="button" class="hs-endre" data-g="hs-endre">' + T('Endre svaret', 'Edit your answer') + '</button></div>') +
        hodeBenk(alle, { oppe: s.harSkrevet || [], status: (s.harSkrevet || []).length + T(' av ', ' of ') + n + T(' har svart', ' answered') });
    }
    if (s.fase === 'gjett' || s.fase === 'fasit') {
      var k = (s.runde || 1) + ':' + s.i + ':' + s.fase, inn = hsVist !== k; hsVist = k;
      var ut = hsTopp(s, s.fase === 'gjett' ? T('Hvem sendte den?', 'Who sent it?') : T('Avslørt', 'Revealed'), s.fase === 'gjett', s.fase === 'gjett') + oppg(true) + hsMelding(s, inn);
      if (s.fase === 'gjett') {
        if (s.erMitt) return ut + '<p class="lh-maske">' + T('Det er din.<br>Hold masken.', 'It’s yours.<br>Keep a straight face.') + '</p>' + hsStatus(s, n);
        return ut + '<div class="hs-valg' + (inn ? ' inn' : '') + '">' + alle.filter(function (p) { return p.id !== meg; }).map(function (p, i) {
          return '<button type="button" data-g="hs-stem" data-paa="' + p.id + '" aria-pressed="' + (s.minStemme === p.id) + '" style="--i:' + i + '">' + nrHode(p.id) + '<span>' + esc(p.navn) + '</span></button>'; }).join('') + '</div>' + hsStatus(s, n);
      }
      var st = s.stemmer || {}, ider = Object.keys(st), riktige = ider.filter(function (id) { return st[id] === s.forfatter; }), mitt = st[meg], erMin = s.forfatter === meg;
      var dom = erMin ? (riktige.length ? ['', T('Avslørt – ', 'Caught – ') + riktige.length + T(' gjettet deg', ' guessed you')] : ['gul', T('Ingen gjettet deg – del ut 2', 'Nobody guessed you – hand out 2')])
        : !mitt ? ['', T('Du gjettet ikke', 'You didn’t guess')] : mitt === s.forfatter ? ['rett', T('Riktig gjettet', 'Right guess')] : ['feil', T('Feil – drikk 1', 'Wrong – drink 1')];
      ut += '<div class="hs-dom ' + dom[0] + (inn ? ' inn' : '') + '"><b>' + dom[1] + '</b></div>' +
        '<ul class="hs-gjett' + (inn ? ' inn' : '') + '">' + ider.map(function (id, i) {
          var r = st[id] === s.forfatter;
          return '<li class="' + (r ? 'rett' : '') + '" style="--i:' + i + '">' + nrHode(id, '', r ? '' : 'flat') + '<span>' + hsNavn(id) + '</span><small>' + T('gjettet', 'guessed') + '</small><b>' + (st[id] === meg ? T('deg', 'you') : esc(navn(st[id]))) + '</b><em>' + (r ? T('Riktig', 'Right') : T('Drikk 1', 'Drink 1')) + '</em></li>';
        }).join('') + '</ul>' +
        (!erMin && !riktige.length && ider.length ? '<p class="hs-info">' + esc(navn(s.forfatter)) + T(' lurte alle – deler ut 2', ' fooled everyone – hands out 2') + '</p>' : '');
      return ut + '<button class="rom-stor-knapp" data-g="hs-neste" data-i="' + s.i + '" type="button">' + (s.i + 1 < s.antallSvar ? T('Neste melding', 'Next message') : T('Se hvem som gjemte seg best', 'See who hid best')) + '</button>';
    }
    var logg = s.logg || [], best = logg.slice().sort(function (a, b) { return b.lurte - a.lurte; })[0];
    return hsTopp(s, T('Alle avslørt', 'All revealed'), false) +
      (best && best.lurte ? '<div class="hs-best"><span>' + T('Best gjemt', 'Hid best') + '</span><b>' + hsNavn(best.av) + '</b><small>' + T('lurte ', 'fooled ') + best.lurte + '</small></div>' : '') +
      '<ul class="hs-alle">' + logg.map(function (x, i) { return '<li style="--i:' + i + '">' + nrHode(x.av) + '<span><b>' + hsNavn(x.av) + '</b>' + esc(x.t) + '</span></li>'; }).join('') + '</ul>' +
      lekSlutt([['runde', T('Spill igjen', 'Play again'), T('Nytt spørsmål – teller i kvelden', 'New question – counts tonight')]]);
  }

  /* ---------- Skrøna: leksikonet som lyver ----------
     Spørsmålet står som et oppslag. Alle dikter opp et falskt svar (skrives inn med skrivemaskin), så står alle forslagene
     som nummererte betydninger – ett er ekte. Fasit: skrønene strekes over med rød penn, den som diktet opp står i margen,
     og det ekte ringes rundt med grønn penn. Ingen kort og stempler, så leken ikke ligner To sannheter. */
  var bfSett = {};
  function bfBoker(s) {
    var ut = '', nr = s.nr || 0, ant = s.antall || 5;
    for (var i = 0; i < ant; i++) ut += '<i class="' + (s.fase === 'ferdig' || i < nr ? 'full' : i === nr ? 'naa' : '') + '"></i>';
    return '<span class="bf-boker" aria-label="' + T('Oppslag ', 'Entry ') + Math.min(ant, nr + 1) + T(' av ', ' of ') + ant + '">' + ut + '</span>';
  }
  function bfSide(s, innhold) {
    var q = String(s.q || ''), str = Math.max(22, Math.min(34, Math.floor(900 / Math.max(10, q.length))));
    return '<div class="bf-side"><span class="bf-margtekst" aria-hidden="true">' + T('LEKSIKON · OPPSLAG ', 'ENCYCLOPEDIA · ENTRY ') + Math.min(s.antall || 5, (s.nr || 0) + 1) + '</span>' +
      '<h3 class="bf-ord" style="font-size:' + str + 'px">' + esc(q) + '</h3><p class="bf-hint">' + (s.fase === 'skriv' ? T('Ett av forslagene blir det ekte. Dikt opp resten.', 'One of the suggestions will be the real one. Make up the rest.') : T('Ett av forslagene er ekte.', 'One of the suggestions is real.')) + '</p>' + innhold + '</div>';
  }
  function bloffSpill(s) {
    var meg = tilstand.meg, alle = tilstand.spillere || [], n = alle.length, nk = (s.runde || 1) + ':' + (s.nr || 0) + ':' + s.fase, ny = !bfSett[nk]; bfSett[nk] = 1;
    var topp = function (chip, gul) { return '<div class="sk-topp">' + jaTopp(T('Skrøna · leksikonet', 'Tall tales · the encyclopedia'), chip, gul, false) + bfBoker(s) + '</div>'; };
    if (s.fase === 'ferdig') {
      var l = (s.lurt || []).slice(0, 3);
      return topp(T('Beste skrønemaker', 'Best fibber'), false) + '<ol class="bf-best">' + l.map(function (x, i) {
        return '<li style="--f:' + i * 120 + 'ms">' + nrHode(x.id, '', '') + '<b>' + jaNavn(x.id) + '</b><span>' + T('lurte ', 'fooled ') + x.n + '</span></li>'; }).join('') +
        (l.length ? '' : '<li><b>' + T('Ingen ble lurt – for et ærlig lag!', 'Nobody got fooled – what an honest crew!') + '</b></li>') + '</ol>' +
        lekSlutt([['runde', T('Spill igjen', 'Play again'), T('Fem nye oppslag – teller i kvelden', 'Five new entries – counts tonight')]]);
    }
    var skjult = s.frist ? '<span class="sk-frist" hidden><span data-frist="' + s.frist + '"></span></span>' : '';
    if (s.fase === 'skriv') {
      var inn = s.mittSvar
        ? '<p class="bf-linje">1. ' + esc(s.mittSvar) + '</p><p class="bf-penn rod">← ' + T('ditt falske oppslag', 'your fake entry') + '</p>' +
          '<form class="sm-skjema" id="sosSkjema"><input id="sosInput" maxlength="80" autocomplete="off" enterkeyhint="send" aria-label="' + T('Endre skrøna', 'Change your fib') + '" placeholder="' + T('Endre …', 'Change …') + '"><button class="btn ghost" type="submit">' + T('Endre', 'Change') + '</button></form>'
        : '<p class="bf-linje">1. <span id="bfLinje"></span><i class="bf-markor" aria-hidden="true"></i></p>' +
          '<form class="sm-skjema stor" id="sosSkjema"><label for="sosInput">' + T('Dikt opp et svar som høres ekte ut', 'Make up an answer that sounds real') + '</label><input id="sosInput" maxlength="80" autocomplete="off" enterkeyhint="send" placeholder="' + T('Din skrøne …', 'Your fib …') + '"><button class="rom-stor-knapp" type="submit">' + T('Før det inn', 'Write it in') + '</button></form>';
      return topp(T('Dikt opp', 'Make it up'), true) + bfSide(s, inn) +
        hodeBenk(alle, { oppe: s.harSkrevet || [], status: (s.harSkrevet || []).length + T(' av ', ' of ') + n + T(' har skrevet', ' have written') }) +
        fristHtml(tilstand.spill, T('sekunder igjen', 'seconds left'));
    }
    var aapen = s.fase === 'fasit', stemmer = s.stemmer || {};
    var velgere = function (i) { return Object.keys(stemmer).filter(function (id) { return stemmer[id] === i; }); };
    var navnene = function (ider) { return ider.map(jaNavn).join(', '); };
    var liste = '<ol class="bf-liste">' + (s.valg || []).map(function (v, i) {
      var sann = aapen && v.av && v.av[0] === 'sant', valgt = s.minStemme === i, f = sann ? 900 : 200 + i * 180, vg = velgere(i);
      var tekst = '<span class="bf-tekst">' + (valgt && !aapen ? '<i class="bf-tusj' + (ny ? '' : ' fast') + '"></i>' : '') + '<span>' + (i + 1) + '. ' + esc(v.t) + '</span></span>';
      var penn = aapen ? (sann ? '<svg class="bf-ring' + (ny ? ' inn' : '') + '" style="--f:' + f + 'ms" viewBox="0 0 300 70" preserveAspectRatio="none" aria-hidden="true"><path d="M20 10 C100 -4 250 0 288 22 C302 44 230 66 140 64 C50 62 2 52 6 32 C10 14 40 8 70 8"/></svg>'
        : '<svg class="bf-strek' + (ny ? ' inn' : '') + '" style="--f:' + f + 'ms" viewBox="0 0 300 40" preserveAspectRatio="none" aria-hidden="true"><path d="M2 22 Q80 14 150 20 T298 16"/></svg>') : '';
      var marg = aapen && !sann && v.av && v.av.length ? '<span class="bf-marg' + (ny ? ' inn' : '') + '" style="--f:' + (f + 150) + 'ms">' + nrHode(v.av[0], '', '') + '</span>' : '';
      var notat = aapen ? '<span class="bf-penn ' + (sann ? 'gronn' : 'rod') + (ny ? ' inn' : '') + '" style="--f:' + (f + 250) + 'ms">' +
        (sann ? '✓ ' + (vg.length ? navnene(vg) + T(' fant det', ' found it') : T('ingen fant det', 'nobody found it'))
          : (v.av || []).map(function (id) { return id === meg ? T('din', 'your') : esc(navn(id)) + T('s', '’s'); }).join(' + ') + T(' skrøne', ' fib') + (vg.length ? T(' – lurte ', ' – fooled ') + navnene(vg) : '')) + '</span>' : '';
      var knapp = !aapen && !v.min ? '<button type="button" data-g="bf-stem" data-i="' + i + '" aria-pressed="' + valgt + '">' + tekst + '</button>' : '<div class="' + (v.min && !aapen ? 'egen' : '') + '">' + tekst + penn + '</div>';
      return '<li class="' + (ny ? 'inn' : '') + '" style="--f:' + i * 60 + 'ms">' + marg + knapp + notat + '</li>';
    }).join('') + '</ol>';
    if (!aapen) return topp(T('Hvilket er ekte?', 'Which is real?'), true) + bfSide(s, liste + '<p class="bf-status">' + (s.minStemme == null ? T('Trykk på betydningen du tror er ekte.', 'Tap the meaning you think is real.') : T('Markert! Du kan bytte til alle har valgt.', 'Marked! You can switch until everyone has picked.')) + '</p>') +
      hodeBenk(alle, { oppe: s.harStemt || [], status: (s.harStemt || []).length + T(' av ', ' of ') + n + T(' har valgt', ' have picked') }) + fristHtml(tilstand.spill, T('sekunder igjen', 'seconds left'));
    var mitt = (s.valg || []).findIndex(function (v) { return v.av && v.av.indexOf(meg) !== -1; }), min = s.minStemme, jegRett = min != null && s.valg[min] && s.valg[min].av[0] === 'sant';
    var lurte = mitt === -1 ? 0 : velgere(mitt).length;
    var dom = '<div class="bf-dom' + (ny ? ' inn' : '') + '">' + (min == null ? '<span class="feil">' + T('Valgte ikke – drikk 1', 'Didn’t pick – drink 1') + '</span>' : jegRett ? '<span class="rett">' + T('Du fant fakta – del ut 1', 'You found the fact – hand out 1') + '</span>' : '<span class="feil">' + T('Du ble lurt – drikk 1', 'You got fooled – drink 1') + '</span>') +
      (mitt !== -1 ? (lurte ? '<span class="gul">' + T('Skrøna di lurte ', 'Your fib fooled ') + lurte + T(' – del ut ', ' – hand out ') + lurte + '</span>' : '<span>' + T('Ingen falt for skrøna di', 'Nobody fell for your fib') + '</span>') : '') + '</div>';
    var fakta = s.fakta ? '<div class="bf-fakta"><b>' + T('Visste du at …', 'Did you know …') + '</b><p>' + esc(s.fakta) + '</p></div>' : '';
    return topp(jegRett ? T('Du fant det!', 'You found it!') : T('Fasit', 'Answer'), false) + bfSide(s, liste + fakta) + dom +
      '<p class="bf-neste">' + ((s.nr || 0) + 1 >= (s.antall || 5) ? T('Det var siste oppslag …', 'That was the last entry …') : T('Neste oppslag kommer av seg selv.', 'The next entry comes by itself.')) + '</p>' + skjult;
  }
  /* ---------- Saueflokken: finn flokken din. Står du alene, er du et svart får. ---------- */
  var smVist = '', smSlaa = null, smSendtVist = '';
  var SM_SAU_SVART = '<i class="sm-svart" title="' + T('Den svarte sauen', 'The black sheep') + '">🐑</i>';
  var SM_SAU = '<svg class="sm-sau" viewBox="0 0 64 48" aria-hidden="true"><g class="ull"><circle cx="20" cy="22" r="10"/><circle cx="32" cy="16" r="11"/><circle cx="44" cy="22" r="10"/><circle cx="26" cy="30" r="10"/><circle cx="40" cy="30" r="10"/></g><ellipse class="fjes" cx="12" cy="26" rx="7" ry="8"/><circle class="oye" cx="10" cy="24" r="1.6"/><path class="bein" d="M24 38v8M40 38v8"/></svg>';
  function sammeSpill(s) {
    var alle = tilstand.spillere || [], n = alle.length, meg = tilstand.meg, vert = erVert();
    var et = T('Saueflokken', 'The herd');
    if (s.fase === 'slutt') {
      var vinnere = s.vinnere || [], poeng = s.poeng || {};
      var rekke = alle.slice().sort(function (a, b) { return (poeng[b.id] || 0) - (poeng[a.id] || 0); });
      return jaTopp(et, T('Flokken er samlet', 'The herd is home'), true, false) +
        '<div class="rr-dom enige inn"><span>' + (s.antall || n) + T(' spørsmål', ' questions') + '</span><b>' + (vinnere.length ? vinnere.map(function (id) { return esc(navn(id)); }).join(T(' og ', ' and ')) + T(' tenkte mest som flokken!', ' thought most like the herd!') : T('Ferdig for denne gang!', 'That’s it for now!')) + '</b>' +
          '<small>' + (vinnere.length ? T('Deler ut 3 hver.', 'Hand out 3 each.') : '') + (s.svartSau ? ' ' + esc(navn(s.svartSau)) + T(' satt igjen med den svarte sauen – drikk 2.', ' got stuck with the black sheep – drink 2.') : '') + '</small></div>' +
        '<div class="sm-stilling">' + rekke.map(function (p) { return '<div class="sm-rad' + (vinnere.indexOf(p.id) !== -1 ? ' vant' : '') + '">' + nrHode(p.id, '', s.svartSau === p.id ? 'oi' : '') + '<b>' + (p.id === meg ? T('Du', 'You') : esc(p.navn)) + '</b>' + (s.svartSau === p.id ? SM_SAU_SVART : '') + '<span>' + (poeng[p.id] || 0) + '</span></div>'; }).join('') + '</div>' +
        lekSlutt([['runde', T('Spill igjen', 'Play again'), T('Nye spørsmål – teller i kvelden', 'New questions – counts tonight')]]);
    }
    var opp = '<div class="nr-kort sm-oppgave' + (s.fase === 'fasit' ? ' liten' : '') + '"><p>' + esc(s.oppgave) + '</p></div>';
    if (s.fase === 'skriv') {
      smSlaa = null;
      var sk = (s.runde || 1) + ':' + (s.mittSvar || ''), sInn = smSendtVist !== sk; if (s.mittSvar) smSendtVist = sk;
      return jaTopp(et, T('Tenk som flokken', 'Think like the herd'), true, true) + opp +
        (s.mittSvar ? '<div class="sm-sendt' + (sInn ? ' inn' : '') + '">' + SM_SAU + '<p><b>«' + esc(s.mittSvar) + '»</b>' + T('ligger i flokken', 'is in the herd') + '</p></div>' +
            '<form class="sm-skjema" id="sosSkjema"><input id="sosInput" maxlength="40" autocomplete="off" enterkeyhint="send" aria-label="' + T('Bytt ord', 'Change word') + '" placeholder="' + T('Bytt ord …', 'Change word …') + '"><button class="btn ghost" type="submit">' + T('Bytt', 'Change') + '</button></form>'
          : '<form class="sm-skjema stor" id="sosSkjema"><label for="sosInput">' + T('Ett ord', 'One word') + '</label><input id="sosInput" maxlength="40" autocomplete="off" enterkeyhint="send" placeholder="' + T('Det flokken tenker', 'What the herd thinks') + '"><button class="rom-stor-knapp" type="submit">Send</button></form>') +
        hodeBenk(alle, { oppe: s.harSkrevet || [], status: (s.harSkrevet || []).length + T(' av ', ' of ') + n + T(' har skrevet', ' wrote') });
    }
    // Flokkene kommer én og én: de som står alene først, den største flokken sist (øverst)
    var k = (s.runde || 1) + ':' + (s.slaatt || 0), forste = smVist.split(':')[0] !== String(s.runde || 1), inn = smVist !== k; smVist = k;
    var gr = (s.grupper || []).map(function (g, i) { return { g: g, i: i }; }), med = {};
    gr.forEach(function (x) { x.g.ider.forEach(function (id) { med[id] = 1; }); });
    var uten = alle.filter(function (p) { return !med[p.id]; }).map(function (p) { return p.id; });
    var maks = gr.reduce(function (m, x) { return Math.max(m, x.g.ider.length); }, 0), flere = gr.filter(function (x) { return x.g.ider.length === maks; }).length;
    var vis = gr.slice().sort(function (a, b) { return b.g.ider.length - a.g.ider.length; }), antall = vis.length + (uten.length ? 1 : 0), STEG = 700;
    var kan = !!(smSlaa && vert);
    var flokk = function (tekst, ider, alene, stor, i, j) {
      var valgt = kan && smSlaa.valgt === i, tag = kan && i != null ? 'button' : 'div';
      return '<' + tag + (tag === 'button' ? ' type="button" data-g="sm-kort" data-i="' + i + '" aria-pressed="' + valgt + '"' : '') +
        ' class="sm-flokk ' + (alene ? 'alene' : stor ? 'stor' : 'trygg') + (forste && inn ? ' inn' : '') + (kan && i != null ? ' velg' : '') + (valgt ? ' valgt' : '') + '" style="--f:' + (forste ? (antall - 1 - j) * STEG : 0) + 'ms">' +
        '<span class="sm-topp"><b>' + esc(tekst) + '</b><small>' + (i == null ? T('Ingen svar · drikk 1', 'No answer · drink 1') : alene ? T('Svart får · drikk 1', 'Black sheep · drink 1') : stor ? ider.length + T(' i flokken', ' in the herd') : T('Trygge', 'Safe')) + '</small></span>' +
        '<span class="sm-hoder' + (inn ? ' hopp' : '') + '">' + ider.map(function (id, h) { return '<span style="--h:' + h + '">' + nrHode(id, '', alene ? 'oi' : '') + '</span>'; }).join('') + '</span>' +
        (stor ? '<em class="sm-stempel">' + T('Flokken! +1', 'The herd! +1') + '</em>' : '') + '</' + tag + '>';
    };
    var kort = vis.map(function (x, j) { var alene = x.g.ider.length === 1; return flokk(x.g.t, x.g.ider, alene, !alene && x.g.ider.length === maks && flere === 1, x.i, j); }).join('') +
      (uten.length ? flokk(T('Ingen svar', 'No answer'), uten, true, false, null, vis.length) : '');
    var minG = gr.find(function (x) { return x.g.ider.indexOf(meg) !== -1; }), poeng = s.poeng || {};
    var stilling = '<div class="sm-stilling liten">' + alle.slice().sort(function (a, b) { return (poeng[b.id] || 0) - (poeng[a.id] || 0); }).map(function (p) {
      return '<div class="sm-rad">' + nrHode(p.id, '', s.svartSau === p.id ? 'oi' : '') + '<b>' + (p.id === meg ? T('Du', 'You') : esc(p.navn)) + '</b>' + (s.svartSau === p.id ? SM_SAU_SVART : '') + '<span>' + (poeng[p.id] || 0) + '</span></div>'; }).join('') +
      (s.svartSau ? '<p class="small">🐑 ' + (s.svartSau === meg ? T('Du har den svarte sauen. Den går videre til neste som står alene – og du kan ikke vinne med den.', 'You have the black sheep. It moves on to the next loner – and you can’t win while holding it.') : esc(navn(s.svartSau)) + T(' har den svarte sauen.', ' has the black sheep.')) + '</p>' : '') + '</div>';
    var dom = !alle.some(function (p) { return p.id === meg; }) ? null : !minG ? ['feil', T('Ingen svar – drikk 1', 'No answer – drink 1')] : minG.g.ider.length === 1 ? ['feil', T('Svart får – drikk 1', 'Black sheep – drink 1')] : ['rett', T('Du er trygg', 'You’re safe')];
    return jaTopp(et, T('Flokkene', 'The herds'), false) + opp + '<div class="sm-flokker">' + kort + '</div>' +
      (dom ? '<div class="hs-dom ' + dom[0] + (forste && inn ? ' inn' : '') + '" style="--f:' + (forste ? antall * STEG : 0) + 'ms"><b>' + dom[1] + '</b></div>' : '') + stilling +
      (vert ? '<div class="sm-vert"><button type="button" class="btn ghost' + (smSlaa ? ' paa' : '') + '" data-g="sm-slaa-modus">' + (!smSlaa ? T('Slå sammen', 'Merge') : smSlaa.valgt == null ? T('Trykk på et svar', 'Tap an answer') : T('Trykk på det andre', 'Tap the other one')) + '</button>' +
          '<button class="rom-stor-knapp" data-g="runde" type="button">' + ((s.nr || 0) + 1 >= (s.antall || n) ? T('Avslutt', 'Finish') : T('Nytt spørsmål', 'New question')) + '</button></div>'
        : '<p class="nr-vent">' + esc(navn(tilstand.vert)) + T(' tar neste spørsmål.', ' picks the next question.') + '</p>');
  }

  /* ---------- Muldvarpen: ingen klokke. Turen går i ring – den som har tur, trykker på den hen spør.
     Verten snur kortene når noen peker ut muldvarpen. ---------- */
  var MV_SVG = '<svg class="mv-dyr" viewBox="0 0 120 90" aria-hidden="true"><g class="kropp"><path d="M28 78c0-34 14-54 32-54s32 20 32 54z"/><ellipse class="snute" cx="60" cy="40" rx="8" ry="6"/><circle class="oye" cx="49" cy="50" r="2.6"/><circle class="oye" cx="71" cy="50" r="2.6"/><path class="klo" d="M36 70l-6 6M40 72l-4 7M80 70l6 6M84 72l4 7"/></g><path class="jord" d="M4 86c8-14 24-18 40-14 8-6 24-6 32 0 16-4 32 0 40 14z"/></svg>';
  var mvSett = {};
  /** Skriften krymper til det lengste ordet passer i bredden. */
  function passFont(t, bredde, maks, min) {
    var l = Math.max.apply(null, String(t || '').split(/\s+/).map(function (w) { return w.length; }).concat([1]));
    return Math.max(min || 9, Math.min(maks, Math.floor((bredde - 10) / (l * 0.6))));
  }
  /* Muldvarpen: alle har samme ord, muldvarpen et nesten likt, og ingen vet om de er muldvarpen. Snakk rundt bordet,
     stem på telefonen, og la den som blir tatt gjette ordet. */
  var mvTellSendt = 0;
  function spionSpill(s) {
    var alle = tilstand.spillere || [], meg = tilstand.meg, vert = erVert(), f = s.fase, vn = esc(navn(tilstand.vert));
    var tema = s.temaNavn ? (EN ? s.temaNavn[1] : s.temaNavn[0]) : '';
    var chip = f === 'snakk' ? T('Snakk sammen', 'Talk it out') : f === 'stem' ? T('Stem', 'Vote') : f === 'gjett' || s.utfall === 'fanget' ? T('Tatt!', 'Caught!') : T('Slapp unna', 'Got away');
    var ut = jaTopp(T('Muldvarpen', 'The mole'), chip, f === 'snakk' || f === 'stem', false).replace('ja-topp', 'ja-topp mv-topp');
    if (f === 'snakk' || f === 'stem') {
      ut += '<button type="button" class="lh-kikk mv-kikk" aria-label="' + T('Hold for å se ordet ditt', 'Hold to see your word') + '">' +
        '<span class="mv-innhold"><span class="mv-sted"><small>' + T('Ditt ord', 'Your word') + (tema ? ' · ' + esc(tema) : '') + '</small><b style="font-size:' + passFont(s.ord || '', 300, 44, 22) + 'px">' + esc(s.ord || '') + '</b></span></span>' +
        '<span class="mv-dekk"><b>' + T('Hold for å se ordet ditt', 'Hold to see your word') + '</b></span></button>';
    }
    if (f === 'snakk') {
      ut += '<p class="mv-hjelp"><b>' + esc(navn(s.starter)) + T(' begynner.', ' starts.') + '</b> ' + T('Si én ting om ordet ditt, to runder rundt bordet. Ikke si selve ordet – og vær akkurat vag nok til at muldvarpen ikke skjønner det. Én av dere har et nesten likt ord og vet det ikke selv.', 'Say one thing about your word, two rounds around the table. Don’t say the word itself – and stay just vague enough that the mole can’t work it out. One of you has a near-miss word and doesn’t know it.') + '</p>';
      ut += vert ? '<button class="rom-stor-knapp" data-g="sp-stem-start" type="button">' + T('Vi er klare til å stemme', 'We’re ready to vote') + '</button>'
        : '<p class="nr-vent">' + vn + T(' sier fra når dere skal stemme.', ' calls the vote when you’re ready.') + '</p>';
      return ut;
    }
    if (f === 'stem') {
      var harStemt = s.harStemt || [];
      if (vert && s.frist && Date.now() + klokkeAvvik > s.frist && mvTellSendt !== s.frist) { mvTellSendt = s.frist; gjorAlltid({ handling: 'sp-tell' }); }
      ut += '<p class="mv-hjelp">' + T('Hvem har et annet ord? Trykk på den du tror er muldvarpen.', 'Who has a different word? Tap the one you think is the mole.') + '</p>' +
        '<div class="mv-stem">' + alle.map(function (p) {
          var erMeg = p.id === meg, stemt = harStemt.indexOf(p.id) !== -1;
          return '<button type="button" class="mv-stemknapp' + (erMeg ? ' meg' : '') + '" data-g="sp-stem" data-paa="' + p.id + '" aria-pressed="' + (s.minStemme === p.id) + '"' + (erMeg ? ' disabled' : '') + '>' + nrHode(p.id) + '<b>' + (erMeg ? T('Du', 'You') : esc(p.navn)) + '</b>' + (stemt ? '<em class="mv-hake">✓</em>' : '') + '</button>';
        }).join('') + '</div>' +
        '<p class="ts-status"><b>' + harStemt.length + T(' av ', ' of ') + alle.length + T(' har stemt', ' have voted') + '</b></p>' + fristHtml(s, T('sekunder til stemmene telles', 'seconds until the votes are counted'));
      if (vert && harStemt.length) ut += '<button class="btn ghost" data-g="sp-tell" type="button">' + T('Tell opp nå', 'Count the votes now') + '</button>';
      return ut;
    }
    if (f === 'gjett') {
      if (vert && s.frist && Date.now() + klokkeAvvik > s.frist && mvTellSendt !== s.frist) { mvTellSendt = s.frist; gjorAlltid({ handling: 'sp-tell' }); }
      if (meg === s.spion) ut += '<div class="hs-dom feil inn"><b>' + T('Du er tatt!', 'You’re caught!') + '</b></div><p class="mv-hjelp">' + T('Siste sjanse: hvilket ord hadde de andre? Treffer du, drikker de – bommer du, drikker du 3.', 'Last chance: which word did the others have? Hit it and they drink – miss and you drink 3.') + '</p>' +
        '<div class="mv-valg">' + (s.valg || []).map(function (v) { return '<button type="button" class="btn" data-g="sp-gjett" data-ord="' + esc(v) + '">' + esc(v) + '</button>'; }).join('') + '</div>';
      else ut += '<div class="hs-dom rett inn"><b>' + esc(navn(s.spion)) + T(' er muldvarpen!', ' is the mole!') + '</b></div><p class="mv-hjelp">' + T('Nå gjetter hen hva ordet deres var …', 'Now they’re guessing your word …') + '</p>';
      return ut + fristHtml(s, T('sekunder igjen', 'seconds left'));
    }
    // fasit
    var rett = Object.keys(s.stemmer || {}).filter(function (id) { return s.stemmer[id] === s.spion && id !== s.spion; }).map(function (id) { return esc(navn(id)); });
    ut += '<div class="mv-fasit"><p>' + T('Ordet var ', 'The word was ') + '<b>' + esc(s.ordA || '') + '</b>. ' + esc(navn(s.spion)) + T(' var muldvarpen og hadde ', ' was the mole and had ') + '<b>' + esc(s.ordB || '') + '</b>.' +
      (s.gjett ? ' ' + T('Hen gjettet ', 'They guessed ') + '<b>' + esc(s.gjett) + '</b>.' : '') + '</p></div>' +
      '<div class="hs-dom ' + (s.utfall === 'fanget' ? 'rett' : 'feil') + ' inn"><b>' + (s.utfall === 'fanget' ? esc(navn(s.spion)) + T(' drikker 3', ' drinks 3') + (rett.length ? ' · ' + rett.join(T(' og ', ' and ')) + T(' deler ut 1', ' hand out 1') : '')
        : s.utfall === 'spion-gjettet' ? esc(navn(s.spion)) + T(' gjettet ordet – alle andre drikker 2', ' guessed the word – everyone else drinks 2') : esc(navn(s.spion)) + T(' slapp unna – alle andre drikker 2', ' got away – everyone else drinks 2')) + '</b></div>' +
      '<div class="mv-stem fasit">' + alle.map(function (p) {
        var til = (s.stemmer || {})[p.id];
        return '<div class="mv-stemknapp' + (p.id === s.spion ? ' muldvarp' : '') + '">' + nrHode(p.id, '', p.id === s.spion ? 'oi' : '') + '<b>' + esc(p.navn) + '</b><small>' + (til ? '→ ' + esc(navn(til)) : T('stemte ikke', 'didn’t vote')) + '</small></div>';
      }).join('') + '</div>';
    return ut + lekSlutt([['runde', T('Spill igjen', 'Play again'), T('Nytt ord og ny muldvarp – teller i kvelden', 'New word and new mole – counts tonight')]]);
  }

  /* ---------- Hvem er jeg?: lappen i panna. Ordet dukker opp på lappen mens du skriver. ---------- */
  var pkSett = {}, pkTimer = null, pkSkrevetVist = '';
  function pkLapp(tekst, bredde, maks, kl, id) {
    return '<span class="pk-lapp' + (kl ? ' ' + kl : '') + '"' + (id ? ' id="' + id + '"' : '') + ' style="width:' + bredde + 'px;font-size:' + passFont(tekst, bredde, maks) + 'px">' + esc(tekst) + '</span>';
  }
  /* Hvem er jeg: kategorier med forslag til den som skriver, og spørsmål å stille for den som gjetter.
     Kategorien du velger, følger lappen og vises som hint til den som skal gjette. */
  var PK_KAT = [
    ['kjendis', 'Kjendis', 'Celebrity', ['Beyoncé', 'Elon Musk', 'Dolly Parton', 'Zlatan', 'Taylor Swift', 'Tom Cruise', 'Rihanna', 'Leonardo DiCaprio', 'Oprah', 'Gordon Ramsay', 'Kim Kardashian', 'Donald Trump', 'Dronning Elizabeth', 'Snoop Dogg', 'Keanu Reeves', 'Paris Hilton', 'Will Smith', 'Greta Thunberg', 'Jennifer Aniston', 'Pave Frans', 'Mr. Beast', 'Dwayne «The Rock» Johnson', 'Kylie Jenner', 'Ryan Reynolds', 'Harry Styles', 'Zendaya', 'Mark Zuckerberg', 'Pamela Anderson']],
    ['norsk', 'Norsk kjendis', 'Norwegian celebrity', ['Erling Braut Haaland', 'Kygo', 'Petter Northug', 'Else Kåss Furuseth', 'Kristofer Hivju', 'Jonas Gahr Støre', 'Atle Antonsen', 'Kronprins Haakon', 'Ingrid Gjessing Linhave', 'Herman Flesvig', 'Petter Stordalen', 'Kjell Inge Røkke', 'Sophie Elise', 'Jahn Teigen', 'Erna Solberg', 'Thomas Giertsen', 'Dagfinn Lyngbø', 'Linni Meister', 'Aksel Hennie', 'Sigrid', 'Ari Behn', 'Carl I. Hagen', 'Bård Tufte Johansen', 'Alexander Rybak', 'Fredrik Skavlan', 'Dorthe Skappel', 'Märtha Louise', 'Durek Verrett', 'Sylvi Listhaug', 'Harald Eia', 'Nicolay Ramm', 'Odd Nordstoga', 'Trygve Slagsvold Vedum', 'Jan Thomas', 'Mia Gundersen', 'Vegard Harm']],
    ['figur', 'Film- og seriefigur', 'Film & TV character', ['Harry Potter', 'Darth Vader', 'Shrek', 'Homer Simpson', 'Barbie', 'Jack Sparrow', 'Hermine Grang', 'Walter White', 'Forrest Gump', 'Wednesday Addams', 'James Bond', 'Gollum', 'Joker', 'Tony Soprano', 'Rocky Balboa', 'Hannibal Lecter', 'Katniss Everdeen', 'Michael Scott', 'Eleven fra Stranger Things', 'Jon Snow', 'Yoda', 'Egon Olsen', 'Elling', 'Mr. Bean', 'Ted Lasso', 'Thor', 'Carrie Bradshaw', 'Gandalf', 'Marty McFly', 'Edward Cullen']],
    ['tegne', 'Tegnefilm og barne-TV', 'Cartoons & kids’ TV', ['Pippi Langstrømpe', 'Donald Duck', 'Pikachu', 'Peppa Gris', 'Spider-Man', 'Elsa fra Frost', 'Ole Brumm', 'Kaptein Sabeltann', 'SpongeBob', 'Postmann Pat', 'Bamse', 'Scooby-Doo', 'Fantorangen', 'Karsten og Petra', 'Teletubbies', 'Bart Simpson', 'Mikke Mus', 'Ash Ketchum', 'Snurre Sprett', 'Simba', 'Brannmann Sam', 'Minions', 'Pingu', 'Garfield', 'Askeladden', 'Mummitrollet', 'Reodor Felgen', 'Vaiana', 'Bluey', 'Smurfene']],
    ['idrett', 'Idrettsstjerne', 'Sports star', ['Cristiano Ronaldo', 'Serena Williams', 'Magnus Carlsen', 'Therese Johaug', 'Usain Bolt', 'Casper Ruud', 'Marit Bjørgen', 'Lionel Messi', 'Ada Hegerberg', 'Michael Jordan', 'Ole Gunnar Solskjær', 'Karsten Warholm', 'Tiger Woods', 'Johannes Høsflot Klæbo', 'Jakob Ingebrigtsen', 'Martin Ødegaard', 'Mike Tyson', 'Petter Solberg', 'Lewis Hamilton', 'Aksel Lund Svindal', 'Novak Djokovic', 'Bjørn Dæhlie', 'Conor McGregor', 'Viktor Hovland', 'Simone Biles', 'Ole Einar Bjørndalen', 'Tom Brady', 'Cecilia Brækhus', 'Shaquille O’Neal', 'Mo Salah']],
    ['musikk', 'Musiker', 'Musician', ['Elvis', 'Madonna', 'Eminem', 'Morten Harket', 'Adele', 'Bob Marley', 'Astrid S', 'Freddie Mercury', 'Karpe', 'Britney Spears', 'Michael Jackson', 'Lady Gaga', 'Drake', 'Alan Walker', 'Åge Aleksandersen', 'Bruce Springsteen', 'Ariana Grande', 'Marcus & Martinus', 'Justin Bieber', 'Shakira', 'Kurt Nilsen', 'Bad Bunny', 'DDE', 'Billie Eilish', 'Ed Sheeran', 'Tix', 'Postgirobygget', 'Lars Vaular', 'Ramón', 'Prince', 'Amy Winehouse', 'Jan Eggum']],
    ['historisk', 'Historisk person', 'Historical figure', ['Napoleon', 'Kleopatra', 'Leonardo da Vinci', 'Roald Amundsen', 'Albert Einstein', 'Gandhi', 'Olav den hellige', 'Marie Curie', 'Julius Cæsar', 'Henrik Ibsen', 'Harald Hårfagre', 'Jesus', 'Edvard Munch', 'Leiv Eriksson', 'Marilyn Monroe', 'Fridtjof Nansen', 'Winston Churchill', 'Mozart', 'Gro Harlem Brundtland', 'Shakespeare', 'Nelson Mandela', 'Kong Olav', 'Pablo Picasso', 'Christopher Columbus', 'Sonja Henie', 'Charlie Chaplin', 'Buddha', 'Ivar Aasen', 'Frida Kahlo', 'Thor Heyerdahl']],
    ['dyr', 'Dyr', 'Animal', ['Elefant', 'Pingvin', 'Elg', 'Delfin', 'Katt', 'Ørn', 'Skilpadde', 'Laks', 'Sjiraff', 'Humle', 'Isbjørn', 'Sau', 'Hai', 'Måke', 'Reinsdyr', 'Dovendyr', 'Flaggermus', 'Ku', 'Hummer', 'Kenguru', 'Mygg', 'Ulv', 'Pytonslange', 'Hamster', 'Flodhest', 'Papegøye', 'Gullfisk', 'Alpakka', 'Krokodille', 'Lemen']],
    ['ting', 'Ting', 'Thing', ['Tannbørste', 'Kaffe', 'Ostehøvel', 'Sofa', 'Mobiltelefon', 'Boblebad', 'Paraply', 'Ski', 'Toalettpapir', 'Grandiosa', 'Vaffeljern', 'Brunost', 'Flaskeåpner', 'Tinder', 'Pølse med lompe', 'Kvikk Lunsj', 'Lommelykt', 'Vipps', 'Trampoline', 'Taxi', 'Solbriller', 'Bunad', 'Mikrobølgeovn', 'Smultring', 'Bompenger', 'Sovepose', 'Fiskekake', 'Slalåmstøvel', 'Kebab', 'Sparkesykkel', 'Selfiestang', 'Tollvesenet', 'Snus', 'Pant', 'Tacosaus']],
    ['droyt', 'Drøyt (18+)', 'Edgy (18+)', ['Fylla på byen', 'Eksen din', 'Angrepillen', 'En fyllesyk søndag', 'Nach', 'Tinder-daten som ikke lignet bildet', 'Nabokjerringa', 'Kondomet som ble glemt', 'Bakrusen på julebordet', 'Sjefen etter tre øl', 'Ex on the Beach', 'En hjemmesnekra shot', 'Et pinlig øyeblikk på dansegulvet', 'Fylleangsten', 'Daten som endte på legevakta', 'Toalettkøen på byen', 'Barnebursdag med fri bar', 'Sjekkereplikken «har du vondt i knærne?»', 'Han som alltid betaler minst på Vipps', 'Blackouten fra 17. mai', 'Den rare onkelen i konfirmasjonen', 'Tissepause i buskene', 'Frokosten på nachet', 'Taxisjåføren klokka fire', 'Et russekort med drøy regel', 'Kebaben etter byen', 'Snapchat-streaken med eksen', 'Fylleringen til eksen klokka tre', 'Hangover-fisen', 'Den som sovnet på vorset']],
    ['rommet', 'Noen her i rommet', 'Someone in the room', []]
  ];
  var PK_SPM = [
    [T('Begynn bredt', 'Start broad'), [T('Er jeg en ekte person?', 'Am I a real person?'), T('Er jeg et menneske?', 'Am I human?'), T('Lever jeg?', 'Am I alive?'), T('Er jeg en mann?', 'Am I a man?'), T('Er jeg norsk?', 'Am I Norwegian?'), T('Kjenner alle her meg?', 'Does everyone here know me?')]],
    [T('Finn feltet', 'Find the field'), [T('Er jeg kjent fra TV eller film?', 'Am I known from TV or film?'), T('Er jeg kjent fra musikk?', 'Am I known from music?'), T('Er jeg kjent fra idrett?', 'Am I known from sports?'), T('Er jeg fra en tegnefilm?', 'Am I from a cartoon?'), T('Finnes jeg i virkeligheten?', 'Do I exist in real life?'), T('Er jeg fra før år 2000?', 'Am I from before the year 2000?'), T('Har jeg vært med i et realityprogram?', 'Have I been on a reality show?')]],
    [T('Er jeg et dyr eller en ting?', 'Am I an animal or a thing?'), [T('Kan man spise meg?', 'Can you eat me?'), T('Er jeg større enn en bil?', 'Am I bigger than a car?'), T('Finnes jeg i dette rommet?', 'Am I in this room?'), T('Har jeg fire bein?', 'Do I have four legs?'), T('Bor jeg i vann?', 'Do I live in water?'), T('Bruker folk meg hver dag?', 'Do people use me every day?')]],
    [T('Snevre inn', 'Narrow it down'), [T('Er jeg over 50 år?', 'Am I over 50?'), T('Har jeg vunnet noe stort?', 'Have I won something big?'), T('Er jeg mest kjent i Norge?', 'Am I mostly known in Norway?'), T('Har jeg vært i nyhetene i år?', 'Have I been in the news this year?'), T('Begynner navnet mitt på A–M?', 'Does my name start with A–M?'), T('Ville jeg passet inn på dette vorset?', 'Would I fit in at this pre-party?')]]
  ];
  var pkKat = '', pkForslag = null, pkValgtForslag = '';
  function pkKatNavn(id) { var k = PK_KAT.find(function (x) { return x[0] === id; }); return k ? (EN ? k[2] : k[1]) : ''; }
  /** Tre forslag fra hele bunken, fra ulike kategorier. Bruker du et forslag, følger kategorien med som hint til den som gjetter. */
  function pkTrekkForslag() {
    var alle = []; PK_KAT.forEach(function (k) { k[3].forEach(function (t) { alle.push({ t: t, kat: k[0] }); }); });
    var ut = [], brukt = {};
    alle.sort(function () { return Math.random() - 0.5; }).forEach(function (f) { if (ut.length < 3 && !brukt[f.kat]) { ut.push(f); brukt[f.kat] = 1; } });
    return ut;
  }
  function pkSporsmalArk() {
    lukkArk();
    var m = lagArk('pk-ark', T('Spørsmål å stille', 'Questions to ask')), kropp = m.querySelector('.ark-kropp');
    var kat = tilstand.spill && tilstand.spill.minKat ? pkKatNavn(tilstand.spill.minKat) : '';
    kropp.innerHTML = (kat ? '<p class="pk-kat-stor">' + T('Hint: du er ', 'Hint: you are ') + '<b>' + esc(kat.toLowerCase()) + '</b></p>' : '') +
      '<p class="small">' + T('Bare ja/nei-spørsmål. Får du nei, går turen videre.', 'Yes/no questions only. A no passes the turn.') + '</p>' +
      PK_SPM.map(function (g) { return '<p class="rom-etikett">' + esc(g[0]) + '</p><ul class="pk-spm">' + g[1].map(function (q) { return '<li>' + esc(q) + '</li>'; }).join('') + '</ul>'; }).join('');
    aapentArk = { el: m, oppdater: function () {} };
  }
  function pannekortSpill(s) {
    var alle = (tilstand.spillere || []).filter(function (p) { return !s.med || !s.med.length || s.med.indexOf(p.id) !== -1; }), meg = tilstand.meg, r = s.runde || 1;
    if (s.fase === 'skriv') {
      var mal = s.mitMaal, mitt = mal && s.ord[mal] ? s.ord[mal].t : '', sk = r + ':' + mitt, klask = mitt && pkSkrevetVist !== sk; if (mitt) pkSkrevetVist = sk;
      return jaTopp(T('Lappen i panna', 'The forehead note'), T('Skriv en lapp', 'Write a note'), true, true) +
        (mal ? '<div class="pk-skriv"><span class="pk-stor">' + nrHode(mal) + pkLapp(mitt || '…', 128, 26, (mitt ? '' : 'tom') + (klask ? ' klask' : ''), 'pkLapp') + '</span>' +
          '<p>' + (mitt ? T('Klask! Den sitter.', 'Slap! It’s on.') : T('Til ', 'For ') + esc(navn(mal))) + '</p></div>' +
          (mitt ? '' : (pkForslag ? '<div class="pk-forslag">' + pkForslag.map(function (f) { return '<button type="button" data-g="pk-fyll" data-t="' + esc(f.t) + '" data-k="' + f.kat + '">' + esc(f.t) + '<small>' + esc(pkKatNavn(f.kat)) + '</small></button>'; }).join('') +
              '<button type="button" class="linkbtn" data-g="pk-forslag">' + T('Nye forslag', 'New ideas') + '</button></div>'
              : '<p><button type="button" class="linkbtn" data-g="pk-forslag">' + T('Tom i hodet? Få forslag', 'Stuck? Get ideas') + '</button></p>')) +
          '<form class="sm-skjema' + (mitt ? '' : ' stor') + '" id="sosSkjema">' + (mitt ? '' : '<label for="sosInput">' + T('Person, figur eller ting', 'Person, character or thing') + '</label>') +
            '<input id="sosInput" maxlength="40" autocomplete="off" enterkeyhint="send" placeholder="' + (mitt ? T('Bytt ord …', 'Change word …') : T('F.eks. Elvis', 'E.g. Elvis')) + '">' +
            '<button class="' + (mitt ? 'btn ghost' : 'rom-stor-knapp') + '" type="submit">' + (mitt ? T('Bytt', 'Change') : T('Klask den på', 'Slap it on')) + '</button></form>' : '') +
        hodeBenk(alle, { oppe: s.harSkrevet || [], status: (s.harSkrevet || []).length + T(' av ', ' of ') + alle.length + T(' har skrevet', ' wrote') });
    }
    var spill = s.fase === 'spill', naa = Date.now(), angreMulig = false;
    var kort = alle.map(function (p) {
      var id = p.id, erMeg = id === meg, gj = (s.gjettet || []).indexOf(id) !== -1, o = s.ord[id], k = r + ':' + id;
      if (gj && !pkSett[k]) pkSett[k] = naa;
      if (!gj) delete pkSett[k];
      var fersk = gj && naa - pkSett[k] < 5000, nyFall = gj && naa - pkSett[k] < 900;
      if (fersk && spill) angreMulig = true;
      var ord = erMeg && !gj && spill ? '?' : o ? o.t : '–';
      var lapp = spill ? (gj && !nyFall ? '' : pkLapp(ord, 84, erMeg ? 30 : 17, (erMeg && !gj ? 'meg' : '') + (nyFall ? ' fall' : ''))) : pkLapp(o ? o.t : '–', 84, 17, 'snupp');
      var under = gj ? '<span class="pk-merke rett">' + ((s.gjettet || [])[0] === id ? T('Først! Del ut 2', 'First! Hand out 2') : T('Gjettet', 'Guessed')) + '</span>'
        : erMeg && spill ? '<span class="pk-merke">' + (s.minKat ? esc(pkKatNavn(s.minKat)) : T('Spør de andre', 'Ask the others')) + '</span>' : '';
      var knapp = !spill ? '' : gj && fersk ? '<button type="button" class="pk-knapp hvit" data-g="pk-angre" data-paa="' + id + '">' + T('Angre', 'Undo') + '</button>'
        : !gj && !erMeg ? '<button type="button" class="pk-knapp" data-g="pk-riktig" data-paa="' + id + '">' + T('Gjettet!', 'Got it!') + '</button>' : '';
      var sist = !spill && s.sist === id;
      return '<div class="pk-kort2' + (gj ? ' gjettet' : '') + (sist ? ' sist' : '') + '"><span class="pk-hode">' + nrHode(id, '', sist ? 'oi' : '') + lapp + (gj ? '<em class="mv-hake">✓</em>' : '') + '</span>' +
        '<b>' + (erMeg ? T('Du', 'You') : esc(p.navn)) + '</b>' + (fersk ? '' : under) + knapp + '</div>';
    }).join('');
    clearTimeout(pkTimer); if (angreMulig) pkTimer = setTimeout(tegn, 1000);
    if (spill) return jaTopp(T('Lappen i panna', 'The forehead note'), T('Hvem er du?', 'Who are you?'), true, false) +
      '<p class="mv-hjelp liten">' + T('Still ja/nei-spørsmål på omgang. Nei = neste. Trykk «Gjettet!» når noen klarer det.', 'Take turns asking yes/no questions. No = next. Tap “Got it!” when someone gets it.') + '</p>' +
      '<div class="pk-grid">' + kort + '</div>' +
      ((s.gjettet || []).indexOf(meg) === -1 ? '<p class="pk-hjelp"><button type="button" class="btn ghost small" data-g="pk-sporsmal">❓ ' + T('Trenger du spørsmål?', 'Need questions?') + '</button></p>' : '');
    return jaTopp(T('Lappen i panna', 'The forehead note'), T('Runden er over', 'Round over'), false, false) +
      (s.sist ? '<div class="hs-dom feil"><b>' + esc(navn(s.sist)) + T(' ble sist – drikk 3', ' came last – drink 3') + '</b></div>' : '') +
      '<div class="pk-grid">' + kort + '</div>' +
      lekSlutt([['runde', T('Spill igjen', 'Play again'), T('Nye lapper – teller i kvelden', 'New notes – counts tonight')]]);
  }

  var skalVist = null, skalTid = null, skalTimer = null, skalMitt = {}, skalSett = {};
  /* ---------- Skålsprinten: glasset ----------
     Hele flaten er knappen. Glasset bobler mens dere venter (ingen nedtelling). Når SKÅL kommer, settes klassen «naa»
     direkte på knappen (uten ny tegning), så reaksjonstiden måles presist. Fem skåler i en sprint; neste kommer av seg selv. */
  var SK_GLASS = '<svg class="sk-glass" viewBox="0 0 150 210" aria-hidden="true"><path class="kant" d="M10 8h130l-15 194h-100z"/><path class="ol" d="M17 50h116l-11 144h-94z"/>' +
    '<circle class="sk-boble" style="--d:0s" cx="50" cy="180" r="4"/><circle class="sk-boble" style="--d:.8s" cx="80" cy="186" r="3"/><circle class="sk-boble" style="--d:1.5s" cx="104" cy="178" r="4.5"/>' +
    '<path class="skum" d="M12 18q19-18 38 0q19-18 38 0q19-18 38 0q10-10 15 3l-3 32h-125z"/></svg>';
  var SK_MOT = '<svg class="sk-mot" viewBox="0 0 120 170" aria-hidden="true"><path class="kant" d="M8 6h104l-12 156h-80z"/><path class="ol" d="M14 40h92l-9 116h-74z"/><path class="skum" d="M10 14q15-14 30 0q15-14 30 0q15-14 30 0q8-8 12 2l-2 26h-96z"/></svg>';
  function skSma(s) {
    var ut = '', nr = s.nr || 0, ant = s.antall || 5;
    for (var i = 0; i < ant; i++) ut += '<i class="' + (s.fase === 'ferdig' || i < nr ? 'full' : i === nr ? 'naa' : '') + '"></i>';
    return '<span class="sk-sma" aria-label="' + T('Skål ', 'Cheers ') + Math.min(ant, nr + 1) + T(' av ', ' of ') + ant + '">' + ut + '</span>';
  }
  function skRader(rader, ny) {
    return '<div class="sk-liste">' + rader.map(function (r, j) {
      return '<div class="sk-rad' + (r.kl ? ' ' + r.kl : '') + (ny ? ' inn' : '') + '" style="--f:' + j * 90 + 'ms">' + nrHode(r.id, '', r.oi ? 'oi' : '') + '<b>' + jaNavn(r.id) + '</b>' +
        '<span class="sk-stolpe"><i class="' + (r.stripe ? 'stripe' : '') + (ny ? ' inn' : '') + '" style="--f:' + (j * 90 + 150) + 'ms;width:' + r.bredde + '%"></i></span><b>' + r.tekst + '</b></div>';
    }).join('') + '</div>';
  }
  function skalSpill(s) {
    var meg = tilstand.meg, r = s.runde || 1, topp = '<div class="sk-topp">';
    var chip = s.fase === 'vent' ? T('Hold fingeren klar', 'Finger ready') : s.fase === 'fasit' ? T('Treigest drikker', 'Slowest drinks') : T('Raskest i stua', 'Fastest in the room');
    topp += jaTopp(T('Skålsprinten', 'Cheers sprint'), chip, s.fase !== 'fasit', false) + skSma(s) + '</div>';
    var skjult = s.frist ? '<span class="sk-frist" hidden><span data-frist="' + s.frist + '"></span></span>' : '';
    if (s.fase === 'vent') {
      if (skalTid !== s.tid) {   // ny skål: planlegg når SKÅL vises på denne telefonen
        skalTid = s.tid; skalVist = null; clearTimeout(skalTimer);
        var om = s.tid - (Date.now() + klokkeAvvik);
        skalTimer = setTimeout(function () {
          skalVist = performance.now();
          var b = document.getElementById('skalKnapp'); if (b && !b.disabled) b.classList.add('naa');
          spillLyd('skaal');
          try { navigator.vibrate && navigator.vibrate(80); } catch (e) {}
        }, Math.max(0, om));
      }
      var mitt = skalMitt[s.tid] || (s.harTrykket.indexOf(meg) !== -1 ? { tidlig: (s.tidlig || []).indexOf(meg) !== -1, ms: (s.trykk || {})[meg] } : null);
      if (mitt && mitt.tidlig && !skalSett['t' + s.tid]) { skalSett['t' + s.tid] = 1; spillLyd('forsent'); }
      var kl = 'sk-flate' + (mitt ? (mitt.tidlig ? ' tidlig' : ' trykket naa') : skalVist ? ' naa' : '');
      return topp + '<button class="' + kl + '" id="skalKnapp" data-g="sk-trykk" type="button"' + (mitt ? ' disabled' : '') + '>' +
        '<span class="sk-scene">' + SK_GLASS + SK_MOT + '<i class="sk-dam"></i></span>' +
        '<b class="sk-vent">' + T('Vent …', 'Wait …') + '</b><b class="sk-skal">' + T('Skål!', 'Cheers!') + '</b>' +
        '<span class="sk-tall">' + (mitt ? (mitt.tidlig ? T('Drikk 2', 'Drink 2') : mitt.ms + ' ms') : '') + '</span>' +
        '<small class="sk-hint">' + ((s.nr || 0) ? T('Neste skål kommer når du minst venter det.', 'The next cheers comes when you least expect it.') : T('Trykk hvor som helst når det står SKÅL.', 'Tap anywhere when it says CHEERS.')) + '</small></button>' +
        '<div class="ts-status"><span class="ts-stemt">' + s.harTrykket.map(function (id) { return nrHode(id, 'inn', ''); }).join('') + '</span><b>' +
        s.harTrykket.length + T(' av ', ' of ') + tilstand.spillere.length + T(' har trykket', ' have tapped') + '</b></div>' + skjult;
    }
    var nk = r + ':' + (s.nr || 0) + ':' + s.fase, ny = !skalSett[nk]; skalSett[nk] = 1;
    if (s.fase === 'fasit' && s.resultat) {
      var res = s.resultat, tider = res.tider || [], maks = Math.max.apply(null, tider.map(function (x) { return x[1]; }).concat([1]));
      var rader = tider.map(function (x) { var sist = x[0] === res.treigest; return { id: x[0], tekst: x[1] + ' ms', bredde: Math.round(100 * x[1] / maks), kl: sist ? 'feil' : x[0] === res.raskest ? 'rett' : '', oi: sist }; })
        .concat((res.tidlig || []).map(function (id) { return { id: id, tekst: T('For tidlig', 'Too early'), bredde: 100, stripe: true, kl: 'feil', oi: true }; }))
        .concat((res.ikke || []).map(function (id) { return { id: id, tekst: T('Trykket ikke', 'No tap'), bredde: 100, stripe: true, kl: 'feil', oi: true }; }));
      var tittel = res.treigest ? jaNavn(res.treigest) + (res.treigest === meg ? T(' var treigest', ' were slowest') : T(' var treigest', ' was slowest')) : T('Ingen treigest', 'No slowest');
      return topp + '<p class="sk-tittel' + (ny ? ' inn' : '') + '">' + tittel + '</p>' + skRader(rader, ny) +
        '<p class="sk-neste"><span class="sk-fyll"><svg viewBox="0 0 20 28" aria-hidden="true"><path class="kant" d="M2 2h16l-2 24h-12z"/><path class="ol" d="M3.2 9h13.6l-1.4 16h-10.8z"/></svg></span>' +
        ((s.nr || 0) + 1 >= (s.antall || 5) ? T('Siste skål er tatt …', 'That was the last cheers …') : T('Neste skål kommer av seg selv.', 'The next cheers comes by itself.')) + '</p>' + skjult;
    }
    if (s.fase === 'ferdig') {
      var sum = s.sum || {}, ider = Object.keys(sum).sort(function (a, b) { return sum[a] - sum[b]; }), mx = Math.max.apply(null, ider.map(function (id) { return sum[id]; }).concat([1]));
      return topp + '<p class="sk-tittel' + (ny ? ' inn' : '') + '">' + (ider[0] ? jaNavn(ider[0]) + (ider[0] === meg ? T(' er raskest', ' are fastest') : T(' er raskest', ' is fastest')) : '') + '</p>' +
        skRader(ider.map(function (id, j) { return { id: id, tekst: (sum[id] / 1000).toFixed(2) + ' s', bredde: Math.round(100 * sum[id] / mx), kl: j === 0 ? 'rett' : '' }; }), ny) +
        '<p class="sk-neste">' + T('Samlet tid for fem skåler.', 'Total time for five cheers.') + '</p>' +
        lekSlutt([['runde', T('Spill igjen', 'Play again'), T('Fem nye skåler – teller i kvelden', 'Five new cheers – counts tonight')]]);
    }
    return topp;
  }

  /* ---------- hemmelige oppdrag ---------- */
  /* ---------- Vorsbørsen ---------- */
  /** +xx / −xx som flyter opp på skjermen når pengene dine endrer seg på børsen. */
  var sisteBev = null;
  function borsPenger(d) {
    var liste = d && d.bors && d.bors.bev; if (!liste) { sisteBev = null; return; }
    var maks = liste.reduce(function (x, e) { return Math.max(x, e.n); }, 0);
    if (sisteBev === null || maks < sisteBev) { sisteBev = maks; return; }   // første visning eller ny børs: ikke vis gammelt
    liste.filter(function (e) { return e.n > sisteBev; }).forEach(function (e, i) { setTimeout(function () { visPenger(e); }, 900 * i); });
    sisteBev = maks;
  }
  function visPenger(e) {
    var el = document.createElement('div'), pluss = e.kr > 0, stor = Math.abs(e.kr) >= 100;
    el.className = 'bs-penger ' + (pluss ? 'opp' : 'ned') + (stor ? ' stor' : '');
    el.setAttribute('role', 'status');
    el.innerHTML = '<b>' + (pluss ? '+' : '−') + Math.abs(e.kr).toLocaleString(LOKALE) + T(' kr', ' 🪙') + (stor ? (pluss ? ' 💰' : ' 💸') : '') + '</b><span>' + esc(e.t || '') + '</span>';
    document.body.appendChild(el);
    if (stor && navigator.vibrate) try { navigator.vibrate(pluss ? [40, 60, 40] : 120); } catch (x) {}
    try { spillLyd(pluss ? (stor ? 'kaching' : 'mynt') : (stor ? 'womp' : '')); } catch (x) {}
    setTimeout(function () { el.remove(); }, 2600);
  }
  var borsReglerApen = false; window.__bdBsRegler = function (v) { borsReglerApen = v; };
  var borsBytt = null, borsModal = null, borsFane = 'aksjer', borsMeld = null, borsAnmeld = null, borsTikkSendt = 0, borsFilter = 'apne', borsApen = null;
  function kr(n) { return Math.round(n).toLocaleString(LOKALE) + T(' kr', ' 🪙'); }
  function borsTrengerMeg() {
    var b = tilstand && tilstand.bors; if (!b || !b.paa) return '';
    var m = tilstand.meg;
    if (b.aksjer.some(function (a) { return a.status === 'meldt' && a.melding && a.melding.subjekt !== m && !a.melding.minStemme; })) return 'stem';
    if (b.saker.some(function (s) { return (s.fase === 'stem' || s.fase === 'forsvar') && (s.utenfor || []).indexOf(m) === -1 && !s.minStemme; })) return 'tilsyn';
    if (erVert() && b.aksjer.some(function (a) { return a.status === 'venter'; })) return 'godkjenn';
    return '';
  }
  function borsPille() {
    var b = tilstand.bors; if (!b) return '';
    var trenger = borsTrengerMeg();
    // Børsen fyller allerede skjermen (hovedspill): ingen grunn til å vise knappen i tillegg
    if (b.fokus && !tilstand.spill && !tilstand.ferdig && !trenger) return '';
    // Hurtigvalget over leken viser allerede det som trenger deg – da holder det med en rolig knapp
    if ((trenger === 'stem' || trenger === 'tilsyn') && /varsel/.test(borsHurtig())) trenger = '';
    var tekst = b.paa ? '📈 ' + T('Vorsbørsen', 'The Exchange') + ' · ' + kr(b.formue || 0) : '📈 ' + T('Børsen er stengt – se resultatet', 'The Exchange is closed – see the results');
    if (trenger === 'stem') tekst = '🗳️ ' + T('Børsen: stem – skjedde det?', 'Exchange: vote – did it happen?');
    if (trenger === 'tilsyn') tekst = '🚨 ' + T('Børstilsynet trenger stemmen din', 'The watchdog needs your vote');
    if (trenger === 'godkjenn') tekst = '🧾 ' + T('Ny aksje venter på godkjenning', 'A new share awaits approval');
    return '<button class="bs-pille' + (trenger ? ' varsel' : '') + '" data-g="bs-aapne" type="button">' + tekst + '</button>';
  }
  /** Blålys: sirene og blinkende skjerm når noen blir anmeldt – og når noen blir dømt. */
  var sakerSett = null;
  function borsBlalys(d) {
    var saker = (d && d.bors && d.bors.saker) || [];
    var naa = {}; saker.forEach(function (s) { naa[s.id] = s.resultat ? (s.resultat.dom ? 'dom' : 'ferdig') : 'aapen'; });
    if (sakerSett === null) { sakerSett = naa; return; }
    var ny = saker.some(function (s) { return !sakerSett[s.id]; });
    var dom = saker.some(function (s) { return naa[s.id] === 'dom' && sakerSett[s.id] !== 'dom'; });
    sakerSett = naa;
    if (ny || dom) blalys(dom);
  }
  function blalys(dom) {
    var el = document.createElement('div'); el.className = 'bs-blalys' + (dom ? ' dom' : ''); el.setAttribute('aria-hidden', 'true');
    el.innerHTML = '<span>' + (dom ? '🚨 ' + T('DØMT!', 'CONVICTED!') : '🚨 ' + T('BØRSTILSYNET', 'MARKET WATCHDOG')) + '</span>';
    document.body.appendChild(el); setTimeout(function () { el.remove(); }, 2600);
    if (navigator.vibrate) try { navigator.vibrate([200, 100, 200, 100, 200]); } catch (x) {}
    if (!lyd.paa || !lydCtx()) return;
    // Sirene: to toner som veksler, med glidende overgang (som et utrykningskjøretøy)
    for (var i = 0; i < 4; i++) { tone(650, i * 0.5, 0.25, 'sawtooth', 0.07, 950); tone(950, i * 0.5 + 0.25, 0.25, 'sawtooth', 0.07, 650); }
    if (dom) setTimeout(function () { tone(220, 0, 0.5, 'square', 0.12, 110); }, 2000);
  }
  /**
   * Børsen i bakgrunnen: det som trenger deg (stemme, dømme) og aksjer som snart stenger,
   * vises rett over leken dere spiller – så du slipper å åpne børsen.
   */
  function borsHurtig() {
    var t = tilstand, b = t.bors, m = t.meg; if (!b || !b.paa) return '';
    if (b.fokus && !t.spill && !t.ferdig) return '';   // børsen er allerede hele skjermen
    var stem = b.aksjer.find(function (a) { return a.status === 'meldt' && a.melding && a.melding.subjekt !== m && a.melding.av !== m && !a.melding.minStemme; });
    if (stem) {
      var ml = stem.melding;
      return '<div class="bs-hurtig varsel"><p>🗳️ <b>' + esc(navn(ml.av)) + '</b>' + T(' melder: ', ' reports: ') + '<b>' + esc(utfallNavn(stem, ml.utfall)) + '</b> – ' + esc(stem.q) + '</p>' +
        '<div class="rom-valg en"><button type="button" data-b="stem" data-v="ja" data-a="' + stem.id + '">' + T('✅ Skjedde', '✅ Happened') + '</button><button type="button" data-b="stem" data-v="nei" data-a="' + stem.id + '">' + T('❌ Nei', '❌ No') + '</button><button type="button" data-b="stem" data-v="vet" data-a="' + stem.id + '">' + T('🤷 Så ikke', '🤷 Didn’t see') + '</button></div></div>';
    }
    var sak = b.saker.find(function (s) { return (s.fase === 'stem' || s.fase === 'forsvar') && (s.utenfor || []).indexOf(m) === -1 && !s.minStemme; });
    if (sak) return '<div class="bs-hurtig varsel sak"><p>🚨 ' + T('Sak: ', 'Case: ') + '<b>' + esc(navn(sak.av)) + '</b>' + T(' anmelder ', ' reports ') + '<b>' + esc(navn(sak.mot)) + '</b> – ' + esc(sak.q) + '</p>' +
      '<div class="rom-valg en"><button type="button" data-b="sak-stem" data-v="skyldig" data-s="' + sak.id + '">' + T('🚨 Skyldig', '🚨 Guilty') + '</button><button type="button" data-b="sak-stem" data-v="uskyldig" data-s="' + sak.id + '">' + T('😇 Uskyldig', '😇 Not guilty') + '</button><button type="button" data-g="bs-aapne">' + T('Se loggen', 'See the log') + '</button></div></div>';
    var naa = Date.now() + klokkeAvvik;
    var snart = b.aksjer.filter(function (a) { return a.status === 'apen' && !a.laast && a.stenger && a.stenger - naa < 10 * 60000 && a.stenger > naa; });
    if (snart.length) return '<div class="bs-hurtig"><p>⏳ ' + (snart.length === 1 ? '«' + esc(snart[0].q) + '»' + T(' stenger om ', ' closes in ') + Math.max(1, Math.round((snart[0].stenger - naa) / 60000)) + ' min' : snart.length + T(' aksjer stenger innen 10 min', ' shares close within 10 min')) + '</p>' +
      '<div class="rom-valg en"><button type="button" data-g="bs-aapne">' + T('Handle nå', 'Trade now') + '</button></div></div>';
    return '';
  }
  function utfallNavn(a, u) { return a.type === 'hvem' ? navn(u) : (u === 'ja' ? T('Ja', 'Yes') : T('Nei', 'No')); }
  function borsTid(a) {
    if (!a.stenger) return '<span class="bs-tid">' + T('åpen hele kvelden', 'open all night') + '</span>';
    var min = Math.round((a.stenger - (Date.now() + klokkeAvvik)) / 60000);
    if (min <= 0) return '<span class="bs-tid">🔒 ' + T('stengt for handel', 'closed for trading') + '</span>';
    return '<span class="bs-tid">⏳ ' + T('stenger om ', 'closes in ') + (min >= 60 ? Math.floor(min / 60) + ' t ' + (min % 60) + ' min' : min + ' min') + '</span>';
  }
  function borsAksjeHtml(a) {
    var b = tilstand.bors, m = tilstand.meg;
    var katNavn = (BS_KAT.find(function (k) { return k[0] === a.kat; }) || [])[T(1, 2)];
    var hode = '<div class="bs-aksje-topp"><span class="bs-type">' + (a.type === 'hvem' ? T('Hvem', 'Who') : T('Ja/nei', 'Yes/no')) + (katNavn ? ' · ' + esc(katNavn) : '') + (a.egen ? ' · ' + T('notert av ', 'listed by ') + esc(navn(a.av)) : '') + '</span><b>' + esc(a.q) + '</b>' + (a.status === 'apen' || a.status === 'stengt' ? borsTid(a) : '') + '</div>';
    if (a.status === 'venter') {
      return '<div class="bs-aksje venter">' + hode + (erVert() ? '<p class="small">' + T('Godkjenne aksjen? Avviser du, får hen pengene tilbake.', 'Approve this share? If you reject it, they get their money back.') + '</p><div class="dl-knapper"><button class="btn small gold" data-b="godkjenn" data-a="' + a.id + '" type="button">' + T('Godkjenn', 'Approve') + '</button><button class="btn small ghost" data-b="avvis" data-a="' + a.id + '" type="button">' + T('Avvis', 'Reject') + '</button></div>' : '<p class="small">' + T('Venter på at verten godkjenner.', 'Waiting for the host to approve.') + '</p>') + '</div>';
    }
    if (a.laast) {
      return '<div class="bs-aksje laast">' + hode + '<p class="small">🔒 ' + T('Låst i gratisbørsen. ', 'Locked on the free exchange. ') + '<button class="linkbtn" data-g="pluss-tilbud" type="button">' + T('Lås opp med Pluss', 'Unlock with Pluss') + '</button></p></div>';
    }
    if (a.status === 'meldt' && a.melding) {
      var ml = a.melding, kanStemme = ml.subjekt !== m;
      return '<div class="bs-aksje meldt">' + hode + '<p class="bs-meldt">🔒 📣 <b>' + esc(navn(ml.av)) + '</b>' + T(' melder: ', ' reports: ') + '<b>' + esc(utfallNavn(a, ml.utfall)) + '</b>' + (ml.vitne ? T(' · vitne: ', ' · witness: ') + esc(navn(ml.vitne)) : '') + '</p>' +
        '<p class="small">' + T('Aksjen er låst for handel mens dere stemmer.', 'The share is locked for trading while you vote.') + '</p>' +
        (a.bilde ? '<img class="bs-bilde" src="' + a.bilde + '" alt="' + T('Bevis', 'Evidence') + '">' : '') +
        (kanStemme ? '<div class="rom-valg en bs-stem"><button type="button" data-b="stem" data-v="ja" data-a="' + a.id + '" aria-pressed="' + (ml.minStemme === 'ja') + '">' + T('✅ Det skjedde', '✅ It happened') + '</button><button type="button" data-b="stem" data-v="nei" data-a="' + a.id + '" aria-pressed="' + (ml.minStemme === 'nei') + '">' + T('❌ Skjedde ikke', '❌ Didn’t happen') + '</button><button type="button" data-b="stem" data-v="vet" data-a="' + a.id + '" aria-pressed="' + (ml.minStemme === 'vet') + '">' + T('🤷 Så det ikke', '🤷 Didn’t see it') + '</button></div>'
          : '<p class="small">' + T('Dette handler om deg, så du stemmer ikke.', 'This is about you, so you don’t vote.') + '</p>') +
        '<p class="rom-status">' + ml.harStemt.length + T(' har stemt', ' have voted') + '</p>' +
        (ml.utsatt ? '<p class="small">⏳ ' + T('For få har stemt. Den venter på at noen til sier ja eller nei' + (tilstand.gjeng ? ' – og etter kvelden kan dere stemme på gjengsiden.' : '.'), 'Too few votes. It waits for one more yes or no' + (tilstand.gjeng ? ' – and after the night you can vote on the crew page.' : '.')) + '</p>' : fristHtml({ frist: ml.frist }, T('sekunder igjen', 'seconds left'))) + '</div>';
    }
    if (a.status === 'utsatt') return '<div class="bs-aksje meldt">' + hode + '<p class="small">⏳ ' + T('Mangler stemmer – avgjøres på gjengsiden innen 48 timer. Blir den godkjent, betales gevinsten inn i lommeboka di i gjengen.', 'Missing votes – settled on the crew page within 48 hours. If confirmed, the payout goes into your crew wallet.') + '</p></div>';
    if (a.status === 'avgjort' || a.status === 'ugyldig') {
      var kanAnmelde = a.status === 'avgjort' && b.paa && a.vinnere && a.vinnere.length;
      return '<div class="bs-aksje ferdig">' + hode + '<p>' + (a.status === 'avgjort' ? '✅ ' + esc(utfallNavn(a, a.vinner)) : T('Ugyldig – pengene tilbake', 'Void – money returned')) + (a.fikk ? ' · <b>' + T('Du fikk ', 'You got ') + kr(a.fikk) + '</b>' : '') + '</p>' +
        (kanAnmelde ? '<button class="linkbtn" data-b="anmeld-aapne" data-a="' + a.id + '" type="button">' + T('🚨 Anmeld en vinner for innsidehandel', '🚨 Report a winner for insider trading') + '</button>' : '') +
        (kanAnmelde && borsAnmeld === a.id ? '<div class="bs-anmeld"><p class="small">' + T('Bare de som tjente på aksjen kan anmeldes. Handler og pengegaver vises i tilsynet. Blir hen frikjent, betaler du 200 kr.', 'Only those who profited from the share can be reported. Trades and money gifts are shown to the watchdog. If they’re acquitted, you pay 200.') + '</p><div class="rom-valg">' +
          a.vinnere.map(function (id) { return '<label class="bs-kryss"><input type="radio" name="bsMot" value="' + esc(id) + '"> ' + esc(navn(id)) + '</label>'; }).join('') +
          '</div><button class="btn small gold" data-b="anmeld" data-a="' + a.id + '" type="button">' + T('Send til Børstilsynet', 'Send to the watchdog') + '</button></div>' : '') + '</div>';
    }
    // Åpen eller stengt for handel
    var stengt = a.status === 'stengt';
    var rader = a.utfall.map(function (x) {
      var meg0 = a.type === 'hvem' && x.u === m, egen = a.av === m;
      var knapper = '';
      if (meg0 || egen) knapper = '<span class="bs-sperret">' + (meg0 ? T('deg selv', 'yourself') : T('din aksje', 'your share')) + '</span>';
      if (x.skjult) return '<div class="bs-rad bs-meg"><span class="bs-navn">' + esc(utfallNavn(a, x.u)) + '</span><span class="bs-kurs">🙈<small>' + T('skjult', 'hidden') + '</small></span><span class="bs-sperret">' + T('+' + ((b.priser && b.priser.hovedrolle) || 30) + ' kr hvis det blir deg', '+' + ((b.priser && b.priser.hovedrolle) || 30) + ' if it’s you') + '</span></div>';
      else if (stengt) knapper = x.mine ? '<span class="bs-sperret">' + T('du har ', 'you own ') + x.mine + '</span>' : '';
      else knapper = '<span class="bs-knapper"><button type="button" class="bs-kjop" data-b="kjop" data-a="' + a.id + '" data-u="' + esc(x.u) + '">' + T('Kjøp ', 'Buy ') + x.kurs + '</button>' +
        (x.mine ? (x.klare ? '<button type="button" class="bs-selg" data-b="selg" data-a="' + a.id + '" data-u="' + esc(x.u) + '">' + T('Selg ', 'Sell ') + x.selg + '</button>'
          : '<button type="button" class="bs-selg" disabled title="' + T('Du må eie aksjen i 10 minutter før du kan selge', 'You must hold the share for 10 minutes before selling') + '">🔒 ' + x.selgOm + ' min</button>') : '') + '</span>';
      return '<div class="bs-rad"><span class="bs-navn">' + esc(utfallNavn(a, x.u)) + (x.mine && !stengt ? ' <small>' + T('du har ', 'you own ') + x.mine + '</small>' : '') + '</span><span class="bs-kurs">' + x.kurs + '<small>' + T('odds ', 'odds ') + String(x.odds).replace('.', EN ? '.' : ',') + '</small></span>' + knapper + '</div>';
    }).join('');
    var meld = borsMeld === a.id
      ? '<div class="bs-meld"><p class="small">' + T('Hva skjedde? Aksjen låses med en gang. Legg gjerne ved bilde eller et vitne – så stemmer de andre.', 'What happened? The share locks right away. Add a photo or a witness if you like – then the others vote.') + '</p>' +
        (a.type === 'hvem' ? '<label class="lab">' + T('Hvem?', 'Who?') + '</label><select id="bsHvem">' + a.utfall.map(function (x) { return '<option value="' + esc(x.u) + '">' + esc(navn(x.u)) + '</option>'; }).join('') + '</select>' : '') +
        '<label class="lab">' + T('Vitne (valgfritt)', 'Witness (optional)') + '</label><select id="bsVitne"><option value="">' + T('Ingen', 'None') + '</option>' + tilstand.spillere.filter(function (p) { return p.id !== m; }).map(function (p) { return '<option value="' + p.id + '">' + esc(p.navn) + '</option>'; }).join('') + '</select>' +
        '<label class="lab">' + T('Bilde (valgfritt – slettes når aksjen er avgjort)', 'Photo (optional – deleted once settled)') + '</label><input id="bsBilde" type="file" accept="image/*" capture="environment">' +
        '<div class="dl-knapper"><button class="btn small gold" data-b="meld" data-a="' + a.id + '" type="button">' + T('Meld', 'Report') + '</button><button class="btn small ghost" data-b="meld-avbryt" type="button">' + T('Avbryt', 'Cancel') + '</button></div></div>'
      : '<button class="btn small ghost bs-meldknapp" data-b="meld-aapne" data-a="' + a.id + '" type="button">' + (a.type === 'hvem' ? T('📣 Det skjedde!', '📣 It happened!') : T('📣 Det skjedde – ja!', '📣 It happened – yes!')) + '</button>';
    return '<div class="bs-aksje' + (stengt ? ' stengt' : '') + '">' + hode + '<div class="bs-rader"><div class="bs-rad bs-rad-topp"><span></span><span>' + T('Kurs', 'Price') + '</span><span></span></div>' + rader + '</div>' + meld + '</div>';
  }
  /** Kort oppsummering av en aksje i lista: trykk for å åpne den. */
  function borsRad(a) {
    var m = tilstand.meg, venstre = '', hoyre = '';
    var mine = a.utfall.filter(function (x) { return x.mine; });
    if (a.status === 'avgjort' || a.status === 'ugyldig') {
      hoyre = a.status === 'avgjort' ? '✅ ' + esc(utfallNavn(a, a.vinner)) : T('Ugyldig', 'Void');
      if (a.fikk) hoyre += ' · <b>+' + kr(a.fikk) + '</b>';
    } else if (a.laast) hoyre = '🔒 Pluss';
    else if (a.status === 'meldt') hoyre = '📣 ' + T('meldt – stemmes over', 'reported – being voted on');
    else if (a.status === 'venter') hoyre = '🧾 ' + T('venter på verten', 'awaiting the host');
    else if (a.status === 'utsatt') hoyre = '⏳ ' + T('venter på stemmer', 'awaiting votes');
    else {
      // Favoritten vises ikke i lista – da hiver ikke alle seg på den samme. Oddsen ser du når du åpner aksjen.
      hoyre = T('Handle ›', 'Trade ›');
    }
    venstre = (a.status === 'apen' && a.stenger ? borsTid(a) : a.status === 'stengt' ? '<span class="bs-tid">🔒 ' + T('stengt for handel', 'closed for trading') + '</span>' : '') +
      (mine.length ? '<span class="bs-mine">' + T('Du: ', 'You: ') + mine.map(function (x) { return x.mine + '× ' + esc(utfallNavn(a, x.u)); }).join(', ') + '</span>' : '');
    var kanMelde = (a.status === 'apen' || a.status === 'stengt') && !a.laast && tilstand.bors.paa;
    var anmeld = kanMelde ? '<button class="btn small ghost bs-anmeldknapp" data-b="meld-rask" data-a="' + a.id + '" type="button">📣 ' + T('Det skjedde!', 'It happened!') + '</button>' : (a.status === 'avgjort' && tilstand.bors.paa && a.vinnere && a.vinnere.length) ? '<button class="btn small ghost bs-anmeldknapp" data-b="anmeld-aapne" data-a="' + a.id + '" type="button">🚨 ' + T('Anmeld', 'Report') + '</button>' : '';
    // Bytt: aksjer på hånda du ikke eier noe i kan byttes mot en ny fra potten
    var hd = tilstand.bors.hand;
    var bytt = '';
    if (a.iHand && a.status === 'apen' && !mine.length && hd && tilstand.bors.paa) {
      var sl = tilstand.alkoholfri ? T('1 straffepoeng', '1 penalty point') : T('1 slurk 🍺', '1 sip 🍺');
      bytt = borsBytt === a.id
        ? '<span class="bs-byttvalg">' + T('Bytt for:', 'Swap for:') + ' <button class="btn small gold" data-b="bytt-ok" data-med="kr" data-a="' + a.id + '" type="button">' + kr(hd.pris) + '</button><button class="btn small gold" data-b="bytt-ok" data-med="slurk" data-a="' + a.id + '" type="button">' + sl + '</button><button class="linkbtn" data-b="bytt" data-a="' + a.id + '" type="button">' + T('Avbryt', 'Cancel') + '</button></span>'
        : '<button class="btn small ghost bs-byttknapp" data-b="bytt" data-a="' + a.id + '" type="button" title="' + T('Bytt mot en ny aksje', 'Swap for a new share') + '">🔄 ' + T('Bytt', 'Swap') + '</button>';
    }
    return '<div class="bs-kompakt' + (a.status === 'avgjort' || a.status === 'ugyldig' ? ' ferdig' : '') + '"><button type="button" class="bs-kompakt-knapp" data-b="aksje-aapne" data-a="' + a.id + '">' +
      '<span class="bs-kompakt-q">' + esc(a.q) + '</span><span class="bs-kompakt-meta">' + venstre + '</span><span class="bs-kompakt-hoyre">' + hoyre + '</span></button>' + (anmeld || bytt ? '<div class="bs-kompakt-knapper">' + anmeld + bytt + '</div>' : '') +
      (borsAnmeld === a.id ? anmeldSkjema(a) : '') + '</div>';
  }
  /** Hvorfor det ikke går an å anmelde noen for denne aksjen. */
  function hvorforIkke(a) {
    if (!tilstand.bors.paa) return T('Børsen er stengt – gevinstene er endelige.', 'The Exchange is closed – payouts are final.');
    if (a.status === 'ugyldig') return T('Ugyldig – alle fikk pengene tilbake, ingen tjente på den.', 'Void – everyone was refunded, nobody profited.');
    if (!a.antallVinnere) return T('Ingen hadde kjøpt det som skjedde – ingen å anmelde.', 'Nobody had bought what happened – nobody to report.');
    if (a.jegVant && a.antallVinnere === 1) return T('Bare du tjente på denne – du kan ikke anmelde deg selv.', 'Only you profited from this – you can’t report yourself.');
    return T('Alle som tjente på denne er allerede etterforsket.', 'Everyone who profited from this has already been investigated.');
  }
  function anmeldSkjema(a) {
    return '<div class="bs-anmeld"><p class="small">' + T('Hvem tror du fikset det sammen med noen? Bare de som tjente på aksjen kan anmeldes. Tilsynet åpner handlene og pengegavene deres. Skyldig: hele gevinsten beslaglegges, 300 kr i bot og 5 slurker. Frikjent: du betaler 200 kr.', 'Who do you think set it up with someone? Only those who profited can be reported. The watchdog opens their trades and money gifts. Guilty: the whole payout is seized, a 300 fine and 5 sips. Acquitted: you pay 200.') + '</p><div class="rom-valg">' +
      a.vinnere.map(function (id) { return '<label class="bs-kryss"><input type="radio" name="bsMot" value="' + esc(id) + '"' + (a.vinnere.length === 1 ? ' checked' : '') + '> ' + esc(navn(id)) + '</label>'; }).join('') +
      '</div><div class="dl-knapper"><button class="btn small gold" data-b="anmeld" data-a="' + a.id + '" type="button">' + T('Send til Børstilsynet', 'Send to the watchdog') + '</button><button class="btn small ghost" data-b="anmeld-aapne" data-a="' + a.id + '" type="button">' + T('Avbryt', 'Cancel') + '</button></div></div>';
  }
  /** Børsen som hovedspill: vises på hele skjermen i stedet for lobbyen. */
  function borsSide() {
    var html = borsInnhold().replace(/<div class="rom-tavle-topp">[\s\S]*?<\/div>/, '<h1 class="rom-h1">📈 ' + T('Vorsbørsen', 'The Exchange') + '</h1><p class="small">' + T('Børsen er kveldens hovedspill. Kjøp aksjer i det dere tror skjer – og meld det når det gjør det.', 'The Exchange is tonight’s main game. Buy shares in what you think will happen – and report it when it does.') + '</p>');
    return '<div class="bs-side">' + html + (erVert() ? '<div class="bs-side-vert"><button class="btn ghost" data-b="bakgrunn" type="button">' + T('🎲 Spill en lek ved siden av (børsen fortsetter i bakgrunnen)', '🎲 Play a game on the side (the Exchange keeps running)') + '</button></div>' : '') + '</div>';
  }
  function borsInnhold() {
    var b = tilstand.bors, m = tilstand.meg;
    var faner = [['aksjer', T('Aksjer', 'Shares')], ['tavle', T('Tavla', 'Board')], ['butikk', T('🛒 Butikk', '🛒 Shop')], ['tilsyn', T('Tilsynet', 'Watchdog') + (b.saker.some(function (s) { return s.fase !== 'ferdig'; }) ? ' 🚨' : '')]];
    var ut = '<div class="rom-tavle-topp"><h2>📈 ' + T('Vorsbørsen', 'The Exchange') + '</h2><button class="linkbtn" data-b="lukk" type="button">' + T('Lukk', 'Close') + '</button></div>';
    if (b.slutt) {
      return ut + '<p class="dl-melding dl-stor">' + T('Børsen er stengt!', 'The Exchange is closed!') + '</p><ol class="bs-tavle">' + b.slutt.rang.map(function (x, i) {
        return '<li class="' + (x.id === m ? 'meg' : '') + '"><span>' + (x.id === b.slutt.konge ? '👑 ' : x.id === b.slutt.konkurs ? '📉 ' : (i + 1) + '. ') + esc(navn(x.id)) + '</span><b>' + kr(x.kr) + (x.gevinst != null && b.startKr != null ? ' <small>(' + (x.gevinst >= 0 ? '+' : '−') + Math.abs(x.gevinst) + T(' i kveld', ' tonight') + ')</small>' : '') + '</b></li>'; }).join('') + '</ol>' +
        '<p>' + '👑 ' + esc(navn(b.slutt.konge)) + T(' er Børskongen. ', ' is the Market King. ') + '📉 ' + esc(navn(b.slutt.konkurs)) + T(' gikk konkurs og spinner straffehjulet!', ' went bankrupt and spins the penalty wheel!') + '</p>' +
        '<div class="dl-knapper"><button class="btn gold" data-g="hjul-aapne" type="button">🎡 ' + T('Straffehjulet', 'Penalty wheel') + '</button>' + (erVert() ? '<button class="btn ghost" data-b="fjern" type="button">' + T('Fjern børsen', 'Remove the Exchange') + '</button>' : '') + '</div>';
    }
    ut += '<p class="bs-saldo">' + T('Kontanter ', 'Cash ') + '<b>' + kr(b.saldo || 0) + '</b> · ' + T('formue ', 'net worth ') + '<b>' + kr(b.formue || 0) + '</b>' +
      (b.startKr != null ? ' <small>' + T('(tok med ' + kr(b.startKr) + ' fra gjengen)', '(brought ' + kr(b.startKr) + ' from the crew)') + '</small>' : '') + '</p>';
    ut += '<div class="rom-mod bs-faner">' + faner.map(function (f) { return '<button type="button" data-b="fane" data-f="' + f[0] + '" aria-pressed="' + (borsFane === f[0]) + '">' + esc(f[1]) + '</button>'; }).join('') + '</div>';
    if (borsFane === 'butikk') {
      var bu = b.butikk || {}, andre = tilstand.spillere.filter(function (p) { return p.id !== m; });
      return ut + '<p class="small">' + T('Bruk vorskronene på hverandre. Alt du kjøper, vises for alle.', 'Spend your coins on each other. Everything you buy is shown to everyone.') + '</p>' +
        '<div class="bs-vare"><b>🍺 ' + T('Send slurker', 'Send sips') + '</b><span class="small">' + T('Hver slurk du kjøper i kveld gjør den neste dyrere.', 'Every sip you buy tonight makes the next one pricier.') + '</span>' +
          '<select id="bsSlurkTil">' + andre.map(function (p) { return '<option value="' + p.id + '">' + esc(p.navn) + (p.immun ? ' 🛡️' : '') + '</option>'; }).join('') + '</select>' +
          '<div class="dl-knapper">' + [1, 2, 3, 5].map(function (n) { return '<button class="btn small ghost" data-b="kjop-slurk" data-n="' + n + '" type="button">' + n + ' · ' + kr((bu.slurkPriser || {})[n] || n * bu.slurk) + '</button>'; }).join('') + '</div></div>' +
        '<div class="bs-vare"><b>🛡️ ' + T('Immunitet', 'Immunity') + '</b><span class="small">' + T('Slipp neste gang du får slurker – fra en lek, butikken eller 🍺. Du har ', 'Skip the next time you get sips – from a game, the shop or 🍺. You have ') + (bu.immun || 0) + T(' av ', ' of ') + bu.maksImmun + '.</span>' +
          '<button class="btn small gold" data-b="kjop-immun" type="button"' + ((bu.immun || 0) >= bu.maksImmun ? ' disabled' : '') + '>' + T('Kjøp', 'Buy') + ' · ' + kr(bu.prisImmun) + '</button></div>' +
        '<div class="bs-vare"><b>🏅 ' + T('Kjøp et kveldspoeng', 'Buy a night point') + '</b><span class="small">' + T('Ett per person per kveld. Kan avgjøre hvem som vinner kvelden – og får velge regel.', 'One per person per night. Could decide who wins the night – and picks the rule.') + '</span>' +
          '<button class="btn small gold" data-b="kjop-poeng" type="button"' + (bu.poengKjopt ? ' disabled' : '') + '>' + (bu.poengKjopt ? T('Kjøpt i kveld ✓', 'Bought tonight ✓') : T('Kjøp', 'Buy') + ' · ' + kr(bu.prisPoeng || bu.poeng)) + '</button></div>' +
        (bu.faktor > 1 ? '<p class="small">📈 ' + T('Prisene følger formuen i rommet – dere er rike, så alt koster ' + String(bu.faktor).replace('.', ',') + ' ganger så mye i kveld.', 'Prices follow the wealth in the room – you’re rich, so everything costs ' + bu.faktor + '× tonight.') + '</p>' : '<p class="small">' + T('Prisene stiger når dere blir rikere.', 'Prices rise as you get richer.') + '</p>');
    }
    if (borsFane === 'tavle') {
      return ut + '<ol class="bs-tavle">' + b.tavle.map(function (x, i) { return '<li class="' + (x.id === m ? 'meg' : '') + '"><span>' + (i + 1) + '. ' + esc(navn(x.id)) + '</span><b>' + kr(x.kr) + '</b></li>'; }).join('') + '</ol>' +
        '<p class="small">' + T('Formue = kontanter + dagens verdi av aksjene. Handler og gaver er hemmelige – til noen anmelder dem.', 'Net worth = cash + current value of your shares. Trades and gifts are secret – until someone reports them.') + '</p>' +
        (b.paa ? '<details class="bs-noter bs-gi"><summary>' + T('💸 Gi vorskroner til noen', '💸 Give coins to someone') + '</summary><p class="small">' + T('Lov og hemmelig – men dukker opp i tilsynet hvis mottakeren eller giveren blir anmeldt.', 'Allowed and secret – but shows up to the watchdog if the giver or receiver is reported.') + '</p>' +
          '<select id="bsGiTil">' + tilstand.spillere.filter(function (p) { return p.id !== m; }).map(function (p) { return '<option value="' + p.id + '">' + esc(p.navn) + '</option>'; }).join('') + '</select>' +
          '<div class="dl-knapper">' + [50, 100, 200].map(function (n) { return '<button class="btn small ghost" data-b="gi" data-kr="' + n + '" type="button">' + kr(n) + '</button>'; }).join('') + '</div></details>' : '') +
        (b.mineGaver && b.mineGaver.length ? '<p class="small">' + b.mineGaver.map(function (g) { return g.fra === m ? T('Du ga ', 'You gave ') + esc(navn(g.til)) + ' ' + kr(g.kr) : esc(navn(g.fra)) + T(' ga deg ', ' gave you ') + kr(g.kr); }).join(' · ') + '</p>' : '') +
        (erVert() ? '<button class="btn ghost" data-b="avslutt" type="button">' + T('Steng børsen og kår Børskongen', 'Close the Exchange and crown the Market King') + '</button>' : '');
    }
    if (borsFane === 'tilsyn') {
      // Alle avgjorte aksjer vises – med forklaring når det ikke er noen å anmelde
      var alleAvgjort = b.aksjer.filter(function (a) { return a.status === 'avgjort' || a.status === 'ugyldig'; }).reverse();
      var anm = '<div class="bs-anmeld-liste"><p class="rom-etikett">🚨 ' + T('Anmeld innsidehandel', 'Report insider trading') + '</p>' +
        (alleAvgjort.length ? '<p class="small">' + T('Mistenker du at en vinner fikset det sammen med noen? Trykk «Anmeld» på aksjen. Bare de som tjente på den kan anmeldes.', 'Suspect a winner set it up with someone? Tap “Report” on the share. Only those who profited from it can be reported.') + '</p>' +
          alleAvgjort.map(function (a) { return borsRad(a) + (a.vinnere && a.vinnere.length && b.paa ? '' : '<p class="small bs-hvorfor">' + hvorforIkke(a) + '</p>'); }).join('')
          : '<p class="small">' + T('Ingen aksjer er avgjort ennå. Når noen melder «📣 Det skjedde!» og det blir bekreftet, kan du anmelde dem som tjente på den her.', 'No shares are settled yet. When someone reports “📣 It happened!” and it’s confirmed, you can report those who profited from it here.') + '</p>') + '</div>';
      if (!b.saker.length) return ut + anm;
      return ut + anm + '<p class="rom-etikett">⚖️ ' + T('Saker', 'Cases') + '</p>' + b.saker.slice().reverse().map(function (s) {
        var part = (s.utenfor || []).indexOf(m) !== -1;
        return '<div class="bs-sak"><p class="rom-etikett">🚨 ' + T('Sak: ', 'Case: ') + esc(s.q) + '</p><p>' + esc(navn(s.av)) + T(' anmelder ', ' reports ') + '<b>' + esc(navn(s.mot)) + '</b>' + (s.vinner ? T(' · utfall: ', ' · outcome: ') + esc(s.type === 'hvem' ? navn(s.vinner) : s.vinner) : '') + '</p>' +
          '<table class="bs-logg"><thead><tr><th>' + T('Hvem', 'Who') + '</th><th>' + T('Handel', 'Trade') + '</th><th>kr</th><th>' + T('Før', 'Before') + '</th></tr></thead><tbody>' +
          s.logg.map(function (l) { return '<tr class="' + (l.mistenkelig ? 'mistenkelig' : '') + '"><td>' + esc(l.navn) + '</td><td>' + (l.n > 0 ? T('kjøpte ', 'bought ') : T('solgte ', 'sold ')) + Math.abs(l.n) + ' ' + esc(s.type === 'hvem' ? navn(l.utfall) : l.utfall) + '</td><td>' + Math.abs(l.kr) + '</td><td>' + l.minFor + ' min' + (l.mistenkelig ? ' ⚠️' : '') + '</td></tr>'; }).join('') +
          '</tbody></table>' +
          (s.penger && s.penger.length ? '<p class="rom-etikett">💸 ' + T('Pengegaver', 'Money gifts') + '</p><table class="bs-logg"><thead><tr><th>' + T('Fra', 'From') + '</th><th>' + T('Til', 'To') + '</th><th>kr</th><th>' + T('Når', 'When') + '</th></tr></thead><tbody>' +
            s.penger.map(function (g) { return '<tr class="' + (g.mistenkelig ? 'mistenkelig' : '') + '"><td>' + esc(g.fra) + '</td><td>' + esc(g.til) + '</td><td>' + g.kr + '</td><td>' + (g.minEtter < 0 ? -g.minEtter + T(' min før', ' min before') : g.minEtter + T(' min etter', ' min after')) + (g.mistenkelig ? ' ⚠️' : '') + '</td></tr>'; }).join('') + '</tbody></table>' : '') +
          (s.fase === 'forsvar' ? '<p class="small">' + T('Begge sider får 30 sekunder hver. Så stemmer resten – 2/3 må si skyldig.', 'Both sides get 30 seconds each. Then the rest vote – 2/3 must say guilty.') + '</p>' + fristHtml({ frist: s.frist }, T('sekunder til avstemning', 'seconds until the vote')) + (erVert() ? '<button class="btn small ghost" data-b="sak-videre" data-s="' + s.id + '" type="button">' + T('Til avstemning nå', 'Vote now') + '</button>' : '') : '') +
          (s.fase === 'stem' || s.fase === 'forsvar' ? (part ? '<p class="small">' + T('Du er part i saken og stemmer ikke.', 'You’re part of the case and don’t vote.') + '</p>'
            : '<div class="rom-valg en"><button type="button" data-b="sak-stem" data-v="skyldig" data-s="' + s.id + '" aria-pressed="' + (s.minStemme === 'skyldig') + '">' + T('🚨 Skyldig', '🚨 Guilty') + '</button><button type="button" data-b="sak-stem" data-v="uskyldig" data-s="' + s.id + '" aria-pressed="' + (s.minStemme === 'uskyldig') + '">' + T('😇 Uskyldig', '😇 Not guilty') + '</button></div>') +
            (s.fase === 'stem' ? fristHtml({ frist: s.frist }, T('sekunder igjen', 'seconds left')) : '') : '') +
          (s.resultat ? '<p class="dl-melding">' + (s.resultat.henlagt ? T('⚖️ Ingen stemte – saken er henlagt. Ingen straffes.', '⚖️ Nobody voted – the case is dropped. Nobody is punished.') : (s.resultat.bevis ? T('🔎 For få til å stemme – bevisene avgjorde: ', '🔎 Too few to vote – the evidence decided: ') : '') + (s.resultat.dom ? T('🚨 Skyldig! ' + (s.resultat.beslag ? kr(s.resultat.beslag) + ' i gevinst beslaglagt' : 'Gevinsten beslaglagt') + ', 300 kr i bot og 5 slurker.', '🚨 Guilty! ' + (s.resultat.beslag ? kr(s.resultat.beslag) + ' in profits seized' : 'Profits seized') + ', a 300 fine and 5 sips.') + (s.resultat.medskyldig ? ' ' + esc(navn(s.resultat.medskyldig)) + T(' var medskyldig: gaven inndras, 300 kr i bot og 3 slurker.', ' was an accomplice: the gift is seized, a 300 fine and 3 sips.') : '') : T('😇 Frikjent. Anmelderen betaler 200 kr.', '😇 Acquitted. The reporter pays 200.')) + (s.resultat.bevis ? '' : ' (' + s.resultat.skyldig + '–' + s.resultat.frikjent + ')')) + '</p>' : '') + '</div>';
      }).join('');
    }
    // Det som trenger deg nå (stemme, godkjenne) står øverst og åpent. Resten er en kort liste – trykk for å handle.
    var trenger = b.aksjer.filter(function (a) { return (a.status === 'meldt' && a.melding && a.melding.subjekt !== m && !a.melding.minStemme && a.melding.av !== m) || (a.status === 'venter' && erVert()); });
    var ferdige = b.aksjer.filter(function (a) { return a.status === 'avgjort' || a.status === 'ugyldig'; }).reverse();
    var apne = b.aksjer.filter(function (a) { return !a.laast && trenger.indexOf(a) === -1 && ferdige.indexOf(a) === -1; }).sort(function (x, y) {
      var r = { meldt: 0, venter: 1, apen: 2, stengt: 3, utsatt: 4 };
      return ((x.laast ? 9 : r[x.status] || 0) - (y.laast ? 9 : r[y.status] || 0)) || ((x.stenger || 9e15) - (y.stenger || 9e15));
    });
    var mine = b.aksjer.filter(function (a) { return a.utfall.some(function (x) { return x.mine; }) || (a.fikk && a.status === 'avgjort'); });
    var anmeldbare = ferdige.filter(function (a) { return a.status === 'avgjort' && a.vinnere && a.vinnere.length; }).length;
    // Første gang du åpner børsen, står reglene åpne
    var bsForste = !les('bd_bors_regler'); if (bsForste) skriv('bd_bors_regler', 1);
    if (bsForste) borsReglerApen = true;
    var reglerHtml = '<details class="bs-regler"' + (borsReglerApen ? ' open' : '') + ' ontoggle="window.__bdBsRegler && window.__bdBsRegler(this.open)"><summary>❓ ' + T('Slik funker børsen', 'How the Exchange works') + '</summary><ul>' +
      [T('Hver aksje betaler <b>100 kr</b> hvis den skjer. Oddsen viser hvor mange ganger pengene du får igjen.', 'Each share pays <b>100</b> if it happens. The odds show how many times your money you get back.'),
       T('Prisen stiger for hver som kjøper – det lønner seg å være tidlig ute.', 'The price rises with every purchase – it pays to be early.'),
       T('Selge: du må ha eid aksjen i 10 minutter, og 25 % går til kurtasje.', 'Selling: you must hold the share for 10 minutes, and 25% goes in fees.'),
       T('Kursen på deg selv er skjult. Blir det deg, får du 30 kr i hovedrollebonus.', 'Your own price is hidden. If it’s you, you get a 30 starring bonus.'),
       T('Du har din egen hånd på 6 aksjer, trukket tilfeldig fra kveldens pott (40 aksjer, 100 med Pluss). Ingen vet hvem som har de samme – eller aksjen om dem.', 'You have your own hand of 6 shares, drawn at random from tonight’s pot (40 shares, 100 with Pluss). Nobody knows who holds the same ones – or the one about them.'),
       T('Liker du ikke en aksje? Trykk «🔄 Bytt» – det koster 25 kr eller én slurk, du velger. Stenger eller avgjøres en aksje, får du en ny gratis.', 'Don’t like a share? Tap “🔄 Swap” – it costs 25 or one sip, your choice. When a share closes or settles, you get a new one for free.'),
       T('Skjer det? Trykk «📣 Det skjedde!» – aksjen avsløres for alle, låses, og de andre stemmer. Blir det bekreftet, får du 20 kr i meldebonus – også om du ikke eide noe i den.', 'Did it happen? Tap “📣 It happened!” – the share is revealed to everyone, locks and the others vote. If confirmed, you get a 20 reporter bonus – even if you didn’t own any.'),
       T('Innsidehandel: har en vinner fikset det sammen med noen, kan hen anmeldes under «Avgjort». Skyldig mister hele gevinsten, får 300 kr i bot og 5 slurker.', 'Insider trading: if a winner set it up with someone, report them under “Settled”. Guilty loses the whole payout, gets a 300 fine and 5 sips.')].map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul></details>';
    ut += reglerHtml;
    if (trenger.length) ut += '<p class="rom-etikett">🔔 ' + T('Trenger deg nå', 'Needs you now') + '</p>' + trenger.map(borsAksjeHtml).join('');
    ut += '<div class="rom-mod bs-filter">' + [['apne', T('Åpne', 'Open'), apne.length], ['mine', T('Mine', 'Mine'), mine.length], ['ferdige', T('Avgjort', 'Settled') + (anmeldbare ? ' 🚨' : ''), ferdige.length]].map(function (f) {
      return '<button type="button" data-b="filter" data-f="' + f[0] + '" aria-pressed="' + (borsFilter === f[0]) + '">' + esc(f[1]) + ' <small>' + f[2] + '</small></button>'; }).join('') + '</div>';
    var liste = borsFilter === 'mine' ? mine : borsFilter === 'ferdige' ? ferdige : apne;
    if (borsFilter === 'ferdige' && anmeldbare) ut += '<p class="small">🚨 ' + T('Tror du noen fikset en aksje sammen? Trykk «Anmeld» – bare de som tjente på den kan anmeldes.', 'Think someone set a share up together? Tap “Report” – only those who profited can be reported.') + '</p>';
    ut += liste.map(function (a) { return borsApen === a.id && borsFilter !== 'ferdige' ? '<div class="bs-apen">' + borsAksjeHtml(a) + '<button class="linkbtn bs-lukkaksje" data-b="aksje-aapne" data-a="' + a.id + '" type="button">' + T('Lukk ▲', 'Close ▲') + '</button></div>'
      : borsRad(a) + (borsFilter === 'ferdige' && !(a.vinnere && a.vinnere.length && b.paa) ? '<p class="small bs-hvorfor">' + hvorforIkke(a) + '</p>' : ''); }).join('') ||
      '<p class="small">' + (borsFilter === 'mine' ? T('Du eier ingen aksjer ennå. Trykk på en aksje under «Åpne» for å kjøpe.', 'You don’t own any shares yet. Tap a share under “Open” to buy.') : borsFilter === 'ferdige' ? T('Ingen aksjer er avgjort ennå.', 'No shares settled yet.') : T('Ingen åpne aksjer akkurat nå.', 'No open shares right now.')) + '</p>';
    if (borsFilter === 'apne') {
      if (b.laaste) ut += '<p class="small bs-pluss">' + b.laaste + T(' aksjer er låst i gratisbørsen. ', ' shares are locked on the free exchange. ') + '<button class="linkbtn" data-g="pluss-tilbud" type="button">' + T('Lås opp alle med Pluss', 'Unlock all with Pluss') + '</button></p>';
      if (b.hand) ut += '<p class="small bs-hand">🃏 ' + T('Din hånd: ' + b.hand.str + ' aksjer · ' + 'bytte koster ' + kr(b.hand.pris) + ' eller en slurk' + ' · ' + b.hand.igjen + ' ukjente aksjer i potten', 'Your hand: ' + b.hand.str + ' shares · ' + 'a swap costs ' + kr(b.hand.pris) + ' or a sip' + ' · ' + b.hand.igjen + ' unseen shares in the pot') + '</p>';
      if (!b.fri && !b.laaste) ut += '<p class="small bs-pluss">' + T('Gratisbørsen har 40 aksjer i potten i kveld. ', 'The free exchange has 40 shares in the pot tonight. ') + '<button class="linkbtn" data-g="pluss-tilbud" type="button">' + T('Med Pluss blir det 100', 'Pluss makes it 100') + '</button></p>';
      if (!b.harNotert) ut += '<details class="bs-noter"><summary>' + T('🧾 Noter en egen aksje (200 kr)', '🧾 List your own share (200)') + '</summary><p class="small">' + T('Én per person per kveld. Du får 2 kr for hvert kjøp andre gjør i den, men kan ikke handle i den selv. Verten godkjenner.', 'One per person per night. You get 2 for every purchase others make in it, but can’t trade in it yourself. The host approves.') + '</p>' +
        '<div class="rom-mod"><label><input type="radio" name="bsType" value="hvem" checked> ' + T('Hvem …?', 'Who …?') + '</label> <label><input type="radio" name="bsType" value="janei"> ' + T('Ja/nei', 'Yes/no') + '</label></div>' +
        '<input id="bsNyTekst" maxlength="100" placeholder="' + T('F.eks. «Hvem ringer mamma før midnatt?»', 'E.g. “Who calls their mum before midnight?”') + '"><button class="btn small gold" data-b="noter" type="button">' + T('Noter (200 kr)', 'List (200)') + '</button></details>';
    }

    return ut;
  }
  function tegnBors() {
    if (!borsModal || !tilstand || !tilstand.bors) { if (borsModal && (!tilstand || !tilstand.bors)) lukkBors(); return; }
    var akt = document.activeElement;
    if (akt && borsModal.contains(akt) && (akt.tagName === 'INPUT' || akt.tagName === 'SELECT')) return;   // ikke forstyrr mens du skriver
    if (borsMeld || borsAnmeld) { var aapen = borsModal.querySelector('.bs-meld, .bs-anmeld'); if (aapen) return; }
    var y = borsModal.querySelector('.rom-tavle-innhold') ? borsModal.querySelector('.rom-tavle-innhold').scrollTop : 0;
    var valg = {}; ['bsSlurkTil', 'bsGiTil'].forEach(function (id) { var e = borsModal.querySelector('#' + id); if (e) valg[id] = e.value; });
    borsModal.innerHTML = '<div class="rom-tavle-innhold bs-innhold">' + borsInnhold() + '</div>';
    Object.keys(valg).forEach(function (id) { var e = borsModal.querySelector('#' + id); if (e && valg[id]) e.value = valg[id]; });
    var inn = borsModal.querySelector('.rom-tavle-innhold'); if (inn) inn.scrollTop = y;
  }
  function aapneBors() {
    if (!tilstand || !tilstand.bors) return;
    lukkBors();
    var tr = borsTrengerMeg(); if (tr === 'tilsyn') borsFane = 'tilsyn'; else if (tr) borsFane = 'aksjer';
    borsModal = document.createElement('div'); borsModal.className = 'rom-tavle bs-modal'; borsModal.setAttribute('role', 'dialog');
    borsModal.addEventListener('click', borsKlikk);
    document.body.appendChild(borsModal);
    tegnBors();
  }
  function lukkBors() { if (borsModal) { borsModal.remove(); borsModal = null; } borsMeld = null; borsAnmeld = null; }
  function komprimer(fil) {
    return new Promise(function (ok) {
      if (!fil) return ok(null);
      var r = new FileReader();
      r.onload = function () {
        var img = new Image();
        img.onload = function () {
          var maks = 640, s = Math.min(1, maks / Math.max(img.width, img.height));
          var c = document.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          var d = c.toDataURL('image/jpeg', 0.6);
          if (d.length > 150000) { c.width = Math.round(c.width * 0.7); c.height = Math.round(c.height * 0.7); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); d = c.toDataURL('image/jpeg', 0.5); }
          ok(d.length < 158000 ? d : null);
        };
        img.onerror = function () { ok(null); };
        img.src = r.result;
      };
      r.onerror = function () { ok(null); };
      r.readAsDataURL(fil);
    });
  }
  /** Tegn børsen på nytt der den vises: i vinduet, eller på hele skjermen (hovedspill). */
  function tegnBorsOmrade(ny) {
    if (borsModal) { if (ny) borsModal.innerHTML = '<div class="rom-tavle-innhold bs-innhold">' + borsInnhold() + '</div>'; else tegnBors(); }
    else { borsLas = false; tegn(); }
  }
  var borsLas = false;
  function borsKlikk(e) {
    if (borsModal && e.target === borsModal) return lukkBors();
    var b = e.target.closest('[data-b]'); if (!b) return;
    var cont = b.closest('.bs-modal, .bs-side') || borsModal || root;
    var a = b.dataset.b;
    if (a === 'lukk') return lukkBors();
    if (a === 'fane') { borsFane = b.dataset.f; borsMeld = null; borsAnmeld = null; return tegnBorsOmrade(true); }
    if (a === 'filter') { borsFilter = b.dataset.f; borsApen = null; borsMeld = null; borsAnmeld = null; return tegnBorsOmrade(true); }
    if (a === 'meld-rask') { borsApen = b.dataset.a; borsMeld = b.dataset.a; borsFilter = borsFilter === 'ferdige' ? 'apne' : borsFilter; tegnBorsOmrade(true); borsLas = !borsModal; return; }
    if (a === 'aksje-aapne') { borsApen = borsApen === b.dataset.a ? null : b.dataset.a; borsMeld = null; return tegnBorsOmrade(true); }
    if (a === 'bytt') { borsBytt = borsBytt === b.dataset.a ? null : b.dataset.a; return tegnBorsOmrade(true); }
    if (a === 'bytt-ok') { borsBytt = null; if (borsApen === b.dataset.a) borsApen = null; spillLyd('bytt'); return gjorAlltid({ handling: 'bs-bytt', aksje: b.dataset.a, med: b.dataset.med }); }
    if (a === 'kjop') return gjorAlltid({ handling: 'bs-handel', aksje: b.dataset.a, utfall: b.dataset.u, n: 1 });
    if (a === 'selg') return gjorAlltid({ handling: 'bs-handel', aksje: b.dataset.a, utfall: b.dataset.u, n: -1 });
    if (a === 'meld-aapne') { borsMeld = b.dataset.a; tegnBorsOmrade(true); borsLas = !borsModal; return; }
    if (a === 'meld-avbryt') { borsMeld = null; return tegnBorsOmrade(true); }
    if (a === 'meld') {
      var hvem = cont.querySelector('#bsHvem'), vitne = cont.querySelector('#bsVitne'), fil = cont.querySelector('#bsBilde');
      b.disabled = true; b.textContent = T('Sender …', 'Sending …');
      return komprimer(fil && fil.files && fil.files[0]).then(function (bilde) {
        if (fil && fil.files && fil.files[0] && !bilde) toast(T('Bildet var for stort – sendt uten bilde', 'The photo was too big – sent without it'));
        borsMeld = null; borsLas = false;
        gjorAlltid({ handling: 'bs-meld', aksje: b.dataset.a, utfall: hvem ? hvem.value : 'ja', vitne: vitne ? vitne.value : '', bilde: bilde || '' });
      });
    }
    if (a === 'stem') return gjorAlltid({ handling: 'bs-stem', aksje: b.dataset.a, v: b.dataset.v });
    if (a === 'godkjenn' || a === 'avvis') return gjorAlltid({ handling: 'bs-godkjenn', aksje: b.dataset.a, ok: a === 'godkjenn' });
    if (a === 'anmeld-aapne') { borsAnmeld = borsAnmeld === b.dataset.a ? null : b.dataset.a; tegnBorsOmrade(true); borsLas = !borsModal && !!borsAnmeld; return; }
    if (a === 'anmeld') {
      var valgt = cont.querySelector('input[name=bsMot]:checked'), mot = valgt ? valgt.value : '';
      if (!mot) return toast(T('Velg hvem du anmelder', 'Pick who you’re reporting'));
      if (!confirm(T('Anmelde for innsidehandel? Blir hen frikjent, betaler du 200 kr.', 'Report for insider trading? If they’re acquitted, you pay 200.'))) return;
      borsAnmeld = null; borsLas = false; borsFane = 'tilsyn';
      return gjorAlltid({ handling: 'bs-anmeld', aksje: b.dataset.a, mot: mot });
    }
    if (a === 'gi') {
      var til = cont.querySelector('#bsGiTil'), n = Number(b.dataset.kr);
      if (!til || !til.value) return;
      if (!confirm(T('Gi ', 'Give ') + kr(n) + T(' til ', ' to ') + navn(til.value) + '?')) return;
      return gjorAlltid({ handling: 'bs-gi', til: til.value, kr: n });
    }
    if (a === 'kjop-slurk') {
      var til2 = cont.querySelector('#bsSlurkTil'); if (!til2 || !til2.value) return;
      var n2 = Number(b.dataset.n);
      if (!confirm(T('Kjøpe ' + n2 + (n2 === 1 ? ' slurk' : ' slurker') + ' til ' + navn(til2.value) + '?', 'Buy ' + navn(til2.value) + ' ' + n2 + (n2 === 1 ? ' sip' : ' sips') + '?'))) return;
      return gjorAlltid({ handling: 'bs-butikk', vare: 'slurk', til: til2.value, n: n2 });
    }
    if (a === 'kjop-immun') return gjorAlltid({ handling: 'bs-butikk', vare: 'immun' });
    if (a === 'kjop-poeng') { if (!confirm(T('Kjøpe et kveldspoeng?', 'Buy a night point?'))) return; return gjorAlltid({ handling: 'bs-butikk', vare: 'poeng' }); }
    if (a === 'sak-stem') return gjorAlltid({ handling: 'bs-sak-stem', sak: b.dataset.s, v: b.dataset.v });
    if (a === 'sak-videre') return gjorAlltid({ handling: 'bs-sak-videre', sak: b.dataset.s });
    if (a === 'noter') {
      var t = (cont.querySelector('#bsNyTekst') || {}).value || '', type = (cont.querySelector('input[name=bsType]:checked') || {}).value || 'hvem';
      if (t.trim().length < 8) return toast(T('Skriv hele spørsmålet', 'Write the whole question'));
      if (!confirm(T('Notere aksjen for 200 kr?', 'List the share for 200?'))) return;
      return gjorAlltid({ handling: 'bs-noter', tekst: t.trim(), type: type });
    }
    if (a === 'avslutt') { if (!confirm(T('Stenge børsen og kåre Børskongen? Åpne ja/nei-aksjer blir «nei», andre får pengene tilbake.', 'Close the Exchange and crown the Market King? Open yes/no shares resolve as “no”, others are refunded.'))) return; return gjorAlltid({ handling: 'bs-avslutt' }); }
    if (a === 'fjern') { lukkBors(); return gjorAlltid({ handling: 'bs-lukk' }); }
    if (a === 'bakgrunn') return gjor({ handling: 'bs-fokus', paa: false });
    if (a === 'fokus') { lukkBors(); return gjor({ handling: 'bs-fokus', paa: true }); }
  }
  var BS_KAT = [['drikke', '🍻 Drikke og skål', '🍻 Drinks'], ['musikk', '🎶 Musikk og dans', '🎶 Music'], ['mat', '🍕 Mat', '🍕 Food'], ['mobil', '📱 Mobil og bilder', '📱 Phones'], ['kaos', '💥 Kaos og uhell', '💥 Chaos'], ['prat', '💬 Prat og klassikere', '💬 Chat'], ['kvelden', '🌙 Kvelden og veien videre', '🌙 The night']];
  function borsStartValg() {
    var m = document.createElement('div'); m.className = 'rom-tavle'; m.setAttribute('role', 'dialog');
    m.innerHTML = '<div class="rom-tavle-innhold"><div class="rom-tavle-topp"><h2>📈 ' + T('Start Vorsbørsen', 'Start the Exchange') + '</h2><button class="linkbtn" data-v="lukk" type="button">' + T('Lukk', 'Close') + '</button></div>' +
      '<p>' + T('Alle får 1000 vorskroner og kjøper aksjer i hva som skjer i løpet av kvelden. Hver aksje betaler 100 kr hvis den skjer – og prisen stiger jo flere som kjøper. Noen aksjer stenger underveis.', 'Everyone gets 1,000 coins and buys shares in what happens during the night. Each share pays 100 if it happens – and the price rises the more people buy. Some shares close along the way.') + '</p>' +
      '<div class="bs-valg"><button class="btn gold" data-v="fokus" type="button"><b>' + T('📈 Bare Vorsbørsen', '📈 Just the Exchange') + '</b><small>' + T('Børsen er hovedspillet – på alles skjerm', 'The Exchange is the main game – on everyone’s screen') + '</small></button>' +
      '<button class="btn ghost" data-v="bakgrunn" type="button"><b>' + T('🎲 Børs i bakgrunnen', '🎲 Exchange in the background') + '</b><small>' + T('Spill andre leker – børsen går ved siden av', 'Play other games – the Exchange runs alongside') + '</small></button></div>' +
      '<p class="rom-etikett">' + T('Hva slags aksjer?', 'What kind of shares?') + '</p><div class="rom-mod bs-kat">' + BS_KAT.map(function (k) { return '<button type="button" data-k="' + k[0] + '" aria-pressed="true">' + esc(T(k[1], k[2])) + '</button>'; }).join('') + '</div>' +
      '<p class="small">' + T('Du kan bytte mellom hovedspill og bakgrunn når som helst.', 'You can switch between main game and background at any time.') + '</p></div>';
    m.addEventListener('click', function (e) {
      var k = e.target.closest('[data-k]');
      if (k) { k.setAttribute('aria-pressed', String(k.getAttribute('aria-pressed') !== 'true')); if (!m.querySelector('[data-k][aria-pressed=true]')) k.setAttribute('aria-pressed', 'true'); return; }
      var b = e.target.closest('[data-v]'); if (e.target === m || (b && b.dataset.v === 'lukk')) return m.remove(); if (!b) return;
      var kat = Array.prototype.map.call(m.querySelectorAll('[data-k][aria-pressed=true]'), function (x) { return x.dataset.k; });
      m.remove(); gjor({ handling: 'bs-start', fokus: b.dataset.v === 'fokus', kat: kat.length === BS_KAT.length ? null : kat });
    });
    document.body.appendChild(m);
  }
  /** Tidsstyrte ting på børsen (ny aksje, frister) – en tilfeldig telefon sier fra til serveren. */
  if (window.__bdBorsTikk) clearInterval(window.__bdBorsTikk);
  window.__bdBorsTikk = setInterval(function () {
    if (!document.getElementById('rom')) { clearInterval(window.__bdBorsTikk); return; }
    var b = tilstand && tilstand.bors; if (!b || !b.paa || !meg || document.hidden) return;
    var naa = Date.now() + klokkeAvvik, forfalt = b.aksjer.some(function (a) { return a.status === 'apen' && a.stenger && naa >= a.stenger; }) ||
      b.aksjer.some(function (a) { return a.status === 'meldt' && a.melding && naa >= a.melding.frist; }) ||
      b.saker.some(function (s) { return s.fase !== 'ferdig' && s.frist && naa >= s.frist; });
    if (!forfalt || Date.now() - borsTikkSendt < 8000) return;
    borsTikkSendt = Date.now();
    setTimeout(function () { gjorAlltid({ handling: 'bs-tikk' }); }, Math.random() * 2500);
  }, 5000);

  var opModal = null, opSettNokkel = '';
  function oppdragKnapp() {
    var o = tilstand.oppdrag; if (!o) return '';
    return '<button class="op-pille" data-g="op-aapne" type="button">' + T('🕵️ Ditt hemmelige oppdrag', '🕵️ Your secret mission') + '</button>';
  }
  function aapneOppdrag() {
    var o = tilstand.oppdrag; if (!o) return;
    lukkOppdrag();
    opModal = document.createElement('div'); opModal.className = 'rom-tavle'; opModal.setAttribute('role', 'dialog');
    opModal.innerHTML = '<div class="rom-tavle-innhold"><div class="rom-tavle-topp"><h2>' + T('🕵️ Ditt oppdrag', '🕵️ Your mission') + '</h2><button class="linkbtn" data-o="lukk" type="button">' + T('Lukk', 'Close') + '</button></div>' +
      (o.mitt ? '<p class="op-tekst">' + esc(o.mitt.t) + '</p>' : '<p>' + T('Du får et oppdrag straks.', 'You\'ll get a mission shortly.') + '</p>') +
      '<p class="small">' + T('Klarer du det, trykk «Fullført» – den andre må bekrefte. Da deler du ut 3. Ikke vis dette til noen!', 'Pull it off, then tap “Done!” – the other person has to confirm. Then you hand out 3. Don\'t show this to anyone!') + '</p>' +
      '<div class="dl-knapper"><button class="btn gold" data-o="fullfort" type="button"' + (o.venterPaaBekreftelse ? ' disabled' : '') + '>' + (o.venterPaaBekreftelse ? T('Venter på bekreftelse …', 'Waiting for confirmation …') : T('Fullført!', 'Done!')) + '</button>' +
      '<button class="btn ghost" data-o="bytt" type="button">' + T('Bytt oppdrag (drikk 1)', 'Swap mission (drink 1)') + '</button></div>' +
      '<h3>' + T('Mistenker du noen?', 'Suspect someone?') + '</h3><p class="small">' + T('Tror du noen holder på med sitt oppdrag? Treffer du, drikker de 2. Bommer du, drikker du 1.', 'Think someone is working on their mission? If you\'re right, they drink 2. If you\'re wrong, you drink 1.') + '</p>' +
      (o.minAnklage ? '<p class="small">' + T('Venter på svar på anklagen din …', 'Waiting for an answer to your accusation …') + '</p>' :
        '<div class="rom-valg">' + tilstand.spillere.filter(function (p) { return p.id !== tilstand.meg; }).map(function (p) { return '<button type="button" data-o="beskyld" data-id="' + p.id + '">' + esc(p.navn) + '</button>'; }).join('') + '</div>') +
      '</div>';
    opModal.addEventListener('click', function (e) {
      if (e.target === opModal) return lukkOppdrag();
      var b = e.target.closest('[data-o]'); if (!b) return;
      var a = b.dataset.o;
      if (a === 'lukk') return lukkOppdrag();
      if (a === 'fullfort') { gjorAlltid({ handling: 'op-fullfort' }); toast(T('Sendt – venter på at den andre bekrefter', 'Sent – waiting for the other person to confirm')); return lukkOppdrag(); }
      if (a === 'bytt') { gjorAlltid({ handling: 'op-bytt' }); return lukkOppdrag(); }
      if (a === 'beskyld') { gjorAlltid({ handling: 'op-beskyld', hvem: b.dataset.id }); toast(T('Anklagen er sendt 👀', 'Accusation sent 👀')); return lukkOppdrag(); }
    });
    document.body.appendChild(opModal);
  }
  function lukkOppdrag() { if (opModal) { opModal.remove(); opModal = null; } }
  /** Spørsmål som må besvares: «stemmer det at hen fikk deg til …?» og anklager mot deg. */
  function sjekkOppdrag() {
    var o = tilstand && tilstand.oppdrag; if (!o) { lukkOppdrag(); return; }
    var sporsmal = (o.bekreft || []).map(function (b) { return 'b:' + b.fra + ':' + b.t; }).concat((o.anklager || []).map(function (a) { return 'a:' + a.fra; }));
    var nokkel = sporsmal[0] || '';
    if (!nokkel || nokkel === opSettNokkel || document.querySelector('.op-sporsmal')) return;
    opSettNokkel = nokkel;
    var m = document.createElement('div'); m.className = 'rom-tavle op-sporsmal'; m.setAttribute('role', 'dialog');
    if (nokkel[0] === 'b') {
      var b = o.bekreft[0];
      m.innerHTML = '<div class="rom-tavle-innhold"><h2>' + T('🕵️ Avslørt oppdrag', '🕵️ Mission revealed') + '</h2><p><b>' + esc(navn(b.fra)) + '</b>' + T(' hadde oppdraget:', ' had the mission:') + '</p><p class="op-tekst">' + esc(b.t) + '</p><p>' + T('Klarte hen det?', 'Did they pull it off?') + '</p>' +
        '<div class="dl-knapper"><button class="btn gold" data-s="ja" type="button">' + T('Ja, jeg ble lurt', 'Yes, I fell for it') + '</button><button class="btn ghost" data-s="nei" type="button">' + T('Nei', 'No') + '</button></div></div>';
      m.addEventListener('click', function (e) { var k = e.target.closest('[data-s]'); if (!k) return; gjorAlltid({ handling: 'op-bekreft', fra: b.fra, ja: k.dataset.s === 'ja' }); m.remove(); });
    } else {
      var a = o.anklager[0];
      m.innerHTML = '<div class="rom-tavle-innhold"><h2>' + T('👀 Du er mistenkt!', '👀 You\'re a suspect!') + '</h2><p><b>' + esc(navn(a.fra)) + '</b>' + T(' tror du holder på med ditt hemmelige oppdrag.', ' thinks you\'re working on your secret mission.') + '</p><p>' + T('Vær ærlig: har du prøvd på det?', 'Be honest: have you been trying?') + '</p>' +
        '<div class="dl-knapper"><button class="btn gold" data-s="tatt" type="button">' + T('Ja, tatt (drikk 2)', 'Yes, caught (drink 2)') + '</button><button class="btn ghost" data-s="nei" type="button">' + T('Nei, feil', 'No, wrong') + '</button></div></div>';
      m.addEventListener('click', function (e) { var k = e.target.closest('[data-s]'); if (!k) return; gjorAlltid({ handling: 'op-svar', fra: a.fra, tatt: k.dataset.s === 'tatt' }); m.remove(); });
    }
    document.body.appendChild(m);
    spillLyd('tur');
  }

  /* ---------- «hopp over» når den som har tur har forsvunnet ---------- */
  setInterval(function () {
    var el = document.querySelector('.rom-hopp'); if (!el) return;
    el.hidden = (Date.now() + klokkeAvvik) - Number(el.dataset.turstart) < 40000;
  }, 1000);
  window.__bdFeilKontekst = function () {
    var t = tilstand || {}, sp = t.spill || {};
    // lekId er alltid lekens faste id (aldri navnet på en egen kortstokk) – den automatiske feilfangsten bruker bare lekId og fase
    return { rom: kode, lek: sp.navn || (t.ferdig ? 'oppsummering' : 'lobby'), lekId: String(sp.lek || sp.type || (t.ferdig ? 'oppsummering' : 'lobby')).slice(0, 40), fase: String(sp.fase || sp.type || ''), versjon: versjon, vert: erVert(), spillere: (t.spillere || []).length };
  };

  /* ---------- straffehjulet ---------- */
  var tavleHjul = null, sisteHjul = -1, hjulSpinner = false;
  var HJULFARGER = ['#E4C47F', '#D9503C', '#2A1A22', '#8C6A2C'];
  function hjulSvg(liste) {
    var n = liste.length, r = 150, seg = 360 / n, deler = '';
    liste.forEach(function (tekst, i) {
      var a0 = (i * seg - 90) * Math.PI / 180, a1 = ((i + 1) * seg - 90) * Math.PI / 180;
      var x0 = 160 + r * Math.cos(a0), y0 = 160 + r * Math.sin(a0), x1 = 160 + r * Math.cos(a1), y1 = 160 + r * Math.sin(a1);
      var farge = HJULFARGER[i % 4] === HJULFARGER[0] && i === n - 1 && n % 4 === 1 ? HJULFARGER[1] : HJULFARGER[i % 4];
      var tekstFarge = farge === '#2A1A22' ? '#F7EFE3' : '#1A1012', midt = (i + 0.5) * seg;
      var kort = tekst.length > 18 ? tekst.slice(0, 17) + '…' : tekst, fs = Math.max(9, Math.min(n > 8 ? 11.5 : 13.5, 108 / (kort.length * 0.6)));
      deler += '<path d="M160 160 L' + x0.toFixed(1) + ' ' + y0.toFixed(1) + ' A' + r + ' ' + r + ' 0 ' + (seg > 180 ? 1 : 0) + ' 1 ' + x1.toFixed(1) + ' ' + y1.toFixed(1) + ' Z" fill="' + farge + '" stroke="#1A1012" stroke-width="2"/>' +
        '<text x="160" y="160" transform="rotate(' + (midt - 90) + ' 160 160) translate(34 4)" fill="' + tekstFarge + '" font-size="' + fs.toFixed(1) + '" font-weight="700">' + esc(kort) + '</text>';
    });
    return '<div class="hjul-ramme"><svg class="hjul" viewBox="0 0 320 320" aria-hidden="true"><g class="hjul-snurr">' + deler + '</g><circle cx="160" cy="160" r="22" fill="#1A1012" stroke="#E4C47F" stroke-width="3"/></svg><span class="hjul-pil" aria-hidden="true"></span></div>';
  }
  function aapneHjul() {
    if (tavleHjul) return;
    tavleHjul = document.createElement('div'); tavleHjul.className = 'rom-tavle'; tavleHjul.setAttribute('role', 'dialog'); tavleHjul.setAttribute('aria-label', T('Straffehjul', 'Penalty wheel'));
    tavleHjul.addEventListener('click', function (e) {
      if (e.target === tavleHjul) return lukkHjul();
      var b = e.target.closest('[data-h]'); if (!b) return;
      var h = b.dataset.h;
      if (h === 'lukk') return lukkHjul();
      if (h === 'spinn') { var sel = tavleHjul.querySelector('#hjulHvem'); return gjor({ handling: 'hjul', hvem: sel ? sel.value : '' }); }
      if (h === 'rediger') { tavleHjul.querySelector('.hjul-rediger').hidden = false; return; }
      if (h === 'lagre-liste') {
        var l = tavleHjul.querySelector('#hjulListe').value.split('\n').map(function (x) { return x.trim(); }).filter(Boolean);
        if (l.length < 2) return toast(T('Skriv minst to utfall.', 'Write at least two outcomes.'));
        return gjor({ handling: 'hjul-liste', liste: l });
      }
      if (h === 'standard') return gjor({ handling: 'hjul-liste', liste: [] });
    });
    document.body.appendChild(tavleHjul);
    tegnHjulModal(true);
  }
  function lukkHjul() { if (tavleHjul) { tavleHjul.remove(); tavleHjul = null; } }
  function tegnHjulModal(ny) {
    if (!tavleHjul || !tilstand || hjulSpinner) return;
    var liste = tilstand.hjulListe || [], hj = tilstand.hjul, vert = erVert();
    var red = tavleHjul.querySelector('.hjul-rediger'), redApen = red && !red.hidden, redTekst = redApen ? tavleHjul.querySelector('#hjulListe').value : null;
    var gSel = tavleHjul.querySelector('#hjulHvem'), gHvem = gSel ? gSel.value : null;
    tavleHjul.innerHTML = '<div class="rom-tavle-innhold hjul-innhold"><div class="rom-tavle-topp"><h2>' + T('Straffehjulet', 'The penalty wheel') + '</h2><button class="linkbtn" data-h="lukk" type="button">' + T('Lukk', 'Close') + '</button></div>' +
      hjulSvg(liste) +
      '<p class="hjul-resultat" aria-live="polite">' + (hj && !ny ? '<b>' + esc(navn(hj.hvem)) + '</b>: ' + esc(hj.tekst) : T('Tapte du? Spinn hjulet – alle ser hvor det stopper.', 'Lost? Spin the wheel – everyone sees where it lands.')) + '</p>' +
      (vert ? '<label class="rof-lab" for="hjulHvem">' + T('Hvem skal spinne?', 'Who\'s spinning?') + '</label><select id="hjulHvem" class="rof-inp">' + tilstand.spillere.map(function (p) { return '<option value="' + p.id + '"' + (p.id === tilstand.meg ? ' selected' : '') + '>' + esc(p.navn) + '</option>'; }).join('') + '</select>' : '') +
      '<button class="rom-stor-knapp" data-h="spinn" type="button">' + T('Spinn', 'Spin') + '</button>' +
      (vert ? '<p><button class="linkbtn" data-h="rediger" type="button">' + T('Endre utfallene', 'Edit the outcomes') + '</button></p><div class="hjul-rediger" hidden><label class="rof-lab" for="hjulListe">' + T('Ett utfall per linje (2–12). «Drikk 3», «Del ut 2», «Shot» og «Alle andre drikker 1» føres på tavla av seg selv.', 'One outcome per line (2–12). “Drink 3”, “Hand out 2”, “Shot” and “Everyone else drinks 1” are added to the board automatically.') + '</label>' +
        '<textarea id="hjulListe" class="rof-inp rf-tekst" rows="7">' + esc(liste.join('\n')) + '</textarea><div class="dl-knapper"><button class="btn gold" data-h="lagre-liste" type="button">' + T('Lagre hjulet', 'Save the wheel') + '</button><button class="btn ghost" data-h="standard" type="button">' + T('Tilbake til standard', 'Back to default') + '</button></div></div>' : '') +
      '</div>';
    if (redApen) { tavleHjul.querySelector('.hjul-rediger').hidden = false; tavleHjul.querySelector('#hjulListe').value = redTekst; }
    var nSel = tavleHjul.querySelector('#hjulHvem'); if (nSel && gHvem) nSel.value = gHvem;
    if (hj && !ny) settVinkel(hj.i, liste.length, false);
  }
  function settVinkel(i, n, animer, runder) {
    var g = tavleHjul && tavleHjul.querySelector('.hjul-snurr'); if (!g) return;
    var seg = 360 / n, maal = (runder || 0) * 360 + (360 - (i + 0.5) * seg);
    g.style.transition = animer ? 'transform 4s cubic-bezier(.17,.67,.2,1)' : 'none';
    g.style.transform = 'rotate(' + maal + 'deg)';
  }
  function sjekkHjul() {
    var hj = tilstand && tilstand.hjul;
    if (!hj) { if (sisteHjul < 0) sisteHjul = 0; return; }
    if (sisteHjul < 0) { sisteHjul = hj.nr; return; }   // ikke spill av gamle spinn
    if (hj.nr <= sisteHjul) return;
    sisteHjul = hj.nr;
    if ((Date.now() + klokkeAvvik) - hj.tid > 15000) return;
    if (!tavleHjul) aapneHjul();
    hjulSpinner = false; tegnHjulModal(true);
    hjulSpinner = true;
    var res = tavleHjul.querySelector('.hjul-resultat'); res.textContent = navn(hj.hvem) + T(' spinner …', ' is spinning …');
    settVinkel(0, hj.antall, false);
    requestAnimationFrame(function () { requestAnimationFrame(function () { settVinkel(hj.i, hj.antall, true, 5); }); });
    hjulLyd(4000);
    setTimeout(function () {
      hjulSpinner = false;
      if (!tavleHjul) return;
      res.innerHTML = '<b>' + esc(navn(hj.hvem)) + '</b>: ' + esc(hj.tekst);
      res.classList.add('landet');
      if (hj.hvem === tilstand.meg) { try { navigator.vibrate && navigator.vibrate(120); } catch (e) {} }
    }, 4100);
  }

  /* ---------- kveldens oppsummering ---------- */
  function kveldsTall() {
    var l = (tilstand.spillere || []).slice(), t = {};
    function maks(felt) { var m = l.slice().sort(function (a, b) { return (b[felt] || 0) - (a[felt] || 0); })[0]; return m && m[felt] ? m : null; }
    t.sumSlurker = l.reduce(function (n, p) { return n + (p.slurker || 0); }, 0);
    t.sumSendt = l.reduce(function (n, p) { return n + (p.sendt || 0); }, 0);
    var leker = {}; (tilstand.historikk || []).forEach(function (n) { leker[n] = (leker[n] || 0) + 1; });
    t.leker = Object.keys(leker).map(function (n) { return n + (leker[n] > 1 ? ' ×' + leker[n] : ''); });
    t.minutter = Math.max(1, Math.round(((tilstand.ferdig || Date.now()) - (tilstand.laget || Date.now())) / 60000));
    t.kaaring = [];
    if (tilstand.kaaringer && tilstand.kaaringer.length) {
      t.kaaring = tilstand.kaaringer.map(function (x) { return { ikon: x.ikon, tittel: x.tittel, navn: x.navn, tall: x.tall }; });
      t.rangert = l.sort(function (a, b) { return (b.slurker || 0) - (a.slurker || 0); });
      return t;
    }
    var torst = maks('slurker'); if (torst) t.kaaring.push({ ikon: '🏆', tittel: T('Kveldens tørstigste', 'Thirstiest of the night'), navn: torst.navn, tall: torst.slurker + T(' slurker', ' sips') });
    if (l.length >= 3 && t.sumSlurker) { var edru = l.slice().sort(function (a, b) { return (a.slurker || 0) - (b.slurker || 0); })[0]; t.kaaring.push({ ikon: '🧊', tittel: T('Mest edru', 'Most sober'), navn: edru.navn, tall: (edru.slurker || 0) + T(' slurker', ' sips') }); }
    var gavmild = maks('sendt'); if (gavmild) t.kaaring.push({ ikon: '🎁', tittel: T('Mest gavmild', 'Most generous'), navn: gavmild.navn, tall: gavmild.sendt + T(' 🍺 sendt', ' 🍺 sent') });
    var mobbet = maks('mottatt'); if (mobbet) t.kaaring.push({ ikon: '🎯', tittel: T('Mest mobbet', 'Most picked on'), navn: mobbet.navn, tall: mobbet.mottatt + T(' 🍺 fått', ' 🍺 received') });
    var quiz = maks('quiz'); if (quiz) t.kaaring.push({ ikon: '🧠', tittel: T('Quizmester', 'Quiz master'), navn: quiz.navn, tall: quiz.quiz + T(' riktige', ' correct') });
    t.rangert = l.sort(function (a, b) { return (b.slurker || 0) - (a.slurker || 0); });
    return t;
  }
  /* ---------- Figuren din og Rommet: arkene du åpner ved å trykke i stua ----------
     Figuren: det kontoen har låst opp kan tas på, resten viser hva som skal til. Rommet (verten): tema og små ting.
     Arkene bruker sidens farger (lys eller mørk modus) – stua inni rommet har sine egne farger uansett. */
  var aapentArk = null;
  var SLOTBOKS = { hode: '-30 -100 60 56', ansikt: '-24 -74 48 32', bryst: '-26 -52 52 36', venn: '-16 -30 44 34', beveg: '-24 -34 48 40' };
  var SLOTNAVN = EN ? { hode: 'On your head', ansikt: 'Glasses', bryst: 'On your chest', venn: 'Pet', beveg: 'Moves' } : { hode: 'På hodet', ansikt: 'Briller', bryst: 'På brystet', venn: 'Kjæledyr', beveg: 'Bevegelser' };
  function megSpiller() { return (tilstand.spillere || []).find(function (p) { return p.id === tilstand.meg; }) || {}; }
  function innlogget() { var K = window.BDKonto; return !!(K && K.les && K.les()); }
  /** Kortreglene i Ring of Fire: standard på hvert kort, alternativer å velge mellom, eller vertens egen tekst. Gjelder rommet i kveld. */
  var rrApen = null;
  function rofReglerArk() {
    lukkArk();
    var m = lagArk('rr-ark', T('Kortregler', 'Card rules')), kropp = m.querySelector('.ark-kropp');
    var info = (tilstand.leker || []).find(function (l) { return l.id === 'ring-of-fire'; }), kr = info && info.kortregler;
    if (!kr) { kropp.innerHTML = '<p class="small">' + T('Reglene er ikke lastet ennå.', 'The rules have not loaded yet.') + '</p>'; aapentArk = { el: m, oppdater: function () {} }; return; }
    var VIS = { A: T('Ess', 'Ace'), J: T('Knekt', 'Jack'), Q: T('Dronning', 'Queen') };
    function tegnListe() {
      var egne = tilstand.rofRegler || {};
      kropp.innerHTML = '<p class="small rr-intro">' + T('Trykk på et kort for å bytte regelen. Standard er alltid ett trykk unna.', 'Tap a card to change its rule. Standard is always one tap away.') + '</p>' +
        kr.rekke.map(function (v) {
          var naa = egne[v] || kr.std[v], erStd = !egne[v], apen = rrApen === v;
          var std = kr.std[v], alt = kr.alt[v] || [];
          var valg = '<div class="rom-mod rr-valg">' +
            '<button type="button" data-rr="std" data-v="' + v + '" aria-pressed="' + erStd + '">' + esc(std[0]) + ' · ' + T('standard', 'standard') + '</button>' +
            alt.map(function (a) { var paa = !erStd && egne[v][0] === a[0]; return '<button type="button" data-rr="alt" data-v="' + v + '" data-navn="' + esc(a[0]) + '" data-tekst="' + esc(a[1]) + '" aria-pressed="' + paa + '">' + esc(a[0]) + '</button>'; }).join('') +
            '<button type="button" data-rr="egen" data-v="' + v + '">' + T('Egen …', 'Custom …') + '</button></div>' +
            (apen === 'egen:' + v || rrApen === 'egen:' + v ? '<form class="rr-egen" data-v="' + v + '"><input name="navn" maxlength="30" placeholder="' + T('Navn, f.eks. Hopp', 'Name, e.g. Jump') + '" required><input name="tekst" maxlength="160" placeholder="' + T('Regelen', 'The rule') + '" required><button class="btn gold small" type="submit">' + T('Bruk', 'Use') + '</button></form>' : '');
          return '<div class="rr-rad' + (apen || rrApen === 'egen:' + v ? ' apen' : '') + (erStd ? '' : ' egen') + '"><button type="button" class="rr-kort" data-rr="apne" data-v="' + v + '" aria-expanded="' + !!(apen || rrApen === 'egen:' + v) + '">' +
            '<b class="rr-v">' + esc(VIS[v] || v) + '</b><span class="rr-tekst"><b>' + esc(naa[0]) + '</b><small>' + esc(naa[1]) + '</small></span><i aria-hidden="true">' + (erStd ? '' : '✎') + '</i></button>' +
            (apen || rrApen === 'egen:' + v ? valg : '') + '</div>';
        }).join('') +
        '<p class="rr-fot small">' + T('Kongen kan ikke byttes: første konge drikker 5, så 10, 15 og 20.', 'The king cannot be changed: first king drinks 5, then 10, 15 and 20.') + '</p>';
    }
    kropp.addEventListener('click', function (e) {
      var b = e.target.closest('[data-rr]'); if (!b) return;
      var v = b.dataset.v;
      if (b.dataset.rr === 'apne') { rrApen = rrApen === v || rrApen === 'egen:' + v ? null : v; tegnListe(); return; }
      if (b.dataset.rr === 'std') { gjor({ handling: 'rof-regel', v: v, std: true }); rrApen = null; return; }
      if (b.dataset.rr === 'alt') { gjor({ handling: 'rof-regel', v: v, navn: b.dataset.navn, tekst: b.dataset.tekst }); rrApen = null; return; }
      if (b.dataset.rr === 'egen') { rrApen = 'egen:' + v; tegnListe(); var f = kropp.querySelector('.rr-egen input'); if (f) f.focus(); return; }
    });
    kropp.addEventListener('submit', function (e) {
      var f = e.target.closest('.rr-egen'); if (!f) return; e.preventDefault();
      gjor({ handling: 'rof-regel', v: f.dataset.v, navn: f.navn.value.trim(), tekst: f.tekst.value.trim() }); rrApen = null;
    });
    tegnListe();
    aapentArk = { el: m, oppdater: tegnListe };
  }
  function lagArk(klasse, tittel) {
    var m = document.createElement('div'); m.className = 'rom-tavle ' + klasse; m.setAttribute('role', 'dialog'); m.setAttribute('aria-label', tittel);
    m.innerHTML = '<div class="rom-tavle-innhold"><div class="rom-tavle-topp"><i class="ark-hank" aria-hidden="true"></i><h2>' + esc(tittel) + '</h2><button class="linkbtn" data-u="lukk" type="button">' + T('Lukk', 'Close') + '</button></div><div class="ark-kropp"></div></div>';
    m.addEventListener('click', function (e) { if (e.target === m || e.target.closest('[data-u=lukk]')) lukkArk(); });
    // Dra arket ned i toppen for å lukke det – som arkene ellers på telefonen
    var inn = m.querySelector('.rom-tavle-innhold'), topp = m.querySelector('.rom-tavle-topp'), y0 = null, dy = 0;
    topp.addEventListener('pointerdown', function (e) { if (e.target.closest('button')) return; y0 = e.clientY; dy = 0; inn.style.transition = 'none'; try { topp.setPointerCapture(e.pointerId); } catch (x) {} });
    topp.addEventListener('pointermove', function (e) { if (y0 === null) return; dy = Math.max(0, e.clientY - y0); inn.style.transform = 'translateY(' + dy + 'px)'; });
    function slipp() { if (y0 === null) return; y0 = null; inn.style.transition = ''; if (dy > 80) lukkArk(); else inn.style.transform = ''; }
    topp.addEventListener('pointerup', slipp); topp.addEventListener('pointercancel', slipp);
    document.body.appendChild(m);
    return m;
  }
  function lukkArk() {
    if (!aapentArk) return;
    var varStua = aapentArk.stua; aapentArk.el.remove(); aapentArk = null;
    // Stua var i arket: legg den tilbake der den hører hjemme (gjemt under leken, i rommet ellers)
    if (varStua && stuaEl) { stuaGjem().appendChild(stuaEl); if (tilstand && !(tilstand.spill && erMobil())) setTimeout(tegn, 0); }
  }
  /** Stua som ark under leken: samme stue, bare over spillet. Lukk, og du er tilbake der du var. */
  function stuaArk() {
    lukkArk();
    var m = lagArk('stua-ark', T('Stua', 'The living room'));
    aapentArk = { el: m, stua: true, oppdater: function () {} };
    tegnStua(tilstand.spill);
  }
  /** Hvilken regeltekst hører til leken? (samme nøkler som reglerPanel bruker under leken) */
  function reglerNokkelFor(l) {
    var egne = { 'ring-of-fire': 'ringr', pekeleken: 'pekeleken', 'jeg-har-aldri': 'aldri', 'enten-eller': 'enten', 'rygg-mot-rygg': 'rygg', 'nodt-eller-sannhet': 'nodt', kategorier: 'kategori', 'tanken-bak-sangen': 'lat' };
    return egne[l.id] || (l.type === 'kort' ? 'kort' : l.type);
  }
  /** ⓘ ved en lek i lobbyen: hva den går ut på og hvordan den spilles, uten å starte den. */
  function lekInfoArk(id) {
    lukkArk();
    var l = (tilstand.leker || []).find(function (x) { return x.id === id; }); if (!l) return;
    var m = lagArk('info-ark', l.navn), kropp = m.querySelector('.ark-kropp'), r = REGLER[reglerNokkelFor(l)] || [];
    kropp.innerHTML = (l.om ? '<p class="info-om">' + esc(l.om) + '</p>' : '') +
      (r.length ? '<p class="rom-etikett">' + T('Slik spiller dere', 'How to play') + '</p><ol class="info-regler">' + r.map(function (x) { return '<li>' + esc(T(x[0], x[1])) + '</li>'; }).join('') + '</ol>' : '') +
      (forFa(l) ? '<p class="small">👥 ' + T('Minst ' + forFa(l) + ' spillere', 'At least ' + forFa(l) + ' players') + '</p>' : '') +
      (erVert() && !forFa(l) && !(l.pluss && !tilstand.pluss) ? '<div class="dl-knapper"><button type="button" class="btn gold" data-g="start" data-lek="' + esc(l.id === 'pekeleken' && pkMobil ? 'mest' : l.id) + '" data-modus="' + esc(l.type === 'nyhetsrunden' && l.moduser && l.moduser[0] ? l.moduser[0].v : '*') + '">Start ' + esc(l.navn) + '</button></div>' : '');
    aapentArk = { el: m, oppdater: function () {} };
  }
  /** Appen, før start: Nyhetsrunden – hvilken uke? Nyeste øverst, spilte uker er merket. */
  function ukeArk() {
    lukkArk();
    var l = (tilstand.leker || []).find(function (x) { return x.type === 'nyhetsrunden'; }); if (!l) return;
    var m = lagArk('uke-ark', l.navn), kropp = m.querySelector('.ark-kropp'), spilt = nrSpilt();
    kropp.innerHTML = '<p class="small">' + T('Velg uke. Nyeste først.', 'Pick a week. Newest first.') + '</p><div class="uke-liste">' + (l.moduser || []).map(function (mo) {
      return '<button type="button" class="btn' + (spilt.indexOf(mo.v) !== -1 ? ' ghost' : ' gold') + '" data-g="start" data-lek="' + l.id + '" data-modus="' + esc(mo.v) + '">' + esc(mo.t) + (spilt.indexOf(mo.v) !== -1 ? ' ✓' : '') + '</button>';
    }).join('') + '</div>';
    aapentArk = { el: m, oppdater: function () {} };
  }
  /** Appen, før start: Ring of Fire – start, eller se og endre kortreglene først. */
  function rofStartArk() {
    lukkArk();
    var m = lagArk('rof-start-ark', 'Ring of Fire'), kropp = m.querySelector('.ark-kropp');
    kropp.innerHTML = '<p class="small">' + T('Standardreglene ligger på kortene. Verten kan bytte regel på hvert kort, også underveis (under «Mer»).', 'The standard rules are on the cards. The host can swap the rule on any card, also mid-game (under “More”).') + '</p>' +
      '<div class="dl-knapper"><button type="button" class="btn gold" data-g="start" data-lek="ring-of-fire" data-modus="*">Start Ring of Fire</button>' +
      '<button type="button" class="btn ghost" data-g="rof-regler">🃏 ' + T('Kortregler', 'Card rules') + (tilstand.rofRegler ? ' · ' + Object.keys(tilstand.rofRegler).length : '') + '</button></div>';
    aapentArk = { el: m, oppdater: function () {} };
  }
  /** «Mer» under leken: slurkene dine, reglene, lekens egne valg og vertens knapper – alt som ellers lå under spillet. */
  function merArk() {
    lukkArk();
    if (!tilstand.spill) return;
    var m = lagArk('mer-ark', tilstand.spill.navn || LEKNAVN[tilstand.spill.lek] || T('Mer', 'More')), kropp = m.querySelector('.ark-kropp');
    function fyll() {
      var s = tilstand.spill; if (!s) { lukkArk(); return; }
      kropp.innerHTML = slurkelinje() + reglerPanel(s).replace('<details class="rom-regler"', '<details class="rom-regler" open') +
        (merEkstra[s.lek] ? merEkstra[s.lek](s) : '') + vertVerktoy(s) +
        '<p class="rom-forlat"><button class="linkbtn" data-g="forlat" type="button">' + T('Forlat rommet', 'Leave the room') + '</button> · <button type="button" class="feilknapp" data-feil>' + T('Noe galt?', 'Something wrong?') + '</button></p>';
    }
    fyll();
    aapentArk = { el: m, oppdater: fyll };
  }
  function figurArk() {
    if (harSkall()) { try { document.dispatchEvent(new CustomEvent('mv-ark', { detail: { type: 'figur' } })); } catch (x) {} return; }
    lukkArk();
    var m = lagArk('figur-ark', T('Figuren din', 'Your figure')), kropp = m.querySelector('.ark-kropp');
    var megS = megSpiller(), timer = null, inne = innlogget();
    var velger = lagFigurVelger(kropp, { lang: EN ? 'en' : 'no', nokkel: megS.figur || tilstand.meg, inne: inne, laast: [], valgt: Object.assign({}, megS.pynt || {}), kvelder: 0, kontoHref: RUTE.konto,
      onEndre: function (valgt) {
        clearTimeout(timer);
        timer = setTimeout(function () {
          kontoApi('/api/konto/pynt', { method: 'POST', body: JSON.stringify({ valgt: valgt }) }).then(function (r) { if (r.ok) gjorAlltid({ handling: 'min-pynt' }); else toast(T('Fikk ikke lagret. Prøv igjen.', 'Could not save. Try again.')); }).catch(function () { toast(T('Fikk ikke lagret. Prøv igjen.', 'Could not save. Try again.')); });
        }, 350);
      } });
    if (inne) kontoApi('/api/konto/pynt').then(function (r) { return r.ok ? r.json() : null; }).then(function (d) { if (!d || !aapentArk || aapentArk.el !== m) return; velger.sett({ laast: d.laast || [], valgt: d.valgt || {}, kvelder: d.kvelder || 0 }); }).catch(function () {});
    aapentArk = { el: m, oppdater: function () {} };
  }
  /** Verten former rommet: Rom, Gulv, Lys, Ting – én rute per valg. Lagres på kontoen, så neste rom starter likt. */
  var TEMAFARGER = { stue: ['#63E2A8', '#FFF8EE', '#FFD23F', '#FFC928'], hytte: ['#B9773F', '#C98D63', '#D9A26A', '#CF9660'], julebord: ['#2EA873', '#FFF8EE', '#E2363B', '#D32F34'] };
  var RS_IKON = {
    fliser: '<path d="M4 4h16v16H4zM12 4v16M4 12h16"/>', disko: '<path d="M4 4h16v16H4zM12 4v16M4 12h16"/><path d="M4 4l8 8M12 12l8 8" stroke-width="4" opacity=".4"/>',
    lampe: '<path d="M8 3h8l3 8H5zM12 11v9M8 20h8"/>', lys: '<path d="M3 7q9 8 18 0"/><circle cx="7" cy="11" r="2"/><circle cx="12" cy="12.5" r="2"/><circle cx="17" cy="11" r="2"/>', diskokule: '<path d="M12 2v4"/><circle cx="12" cy="13" r="7"/><path d="M5 13h14M12 6v14M7 8l10 10M17 8L7 18"/>',
    plante: '<path d="M7 20h10l1-6H6zM12 14V8M12 8q-5 0-6-5 5 0 6 5zM12 8q5 0 6-5-5 0-6 5z"/>', plakat: '<rect x="5" y="3" width="14" height="18" rx="1"/><circle cx="12" cy="12" r="3"/>', platespiller: '<rect x="3" y="7" width="18" height="12" rx="2"/><circle cx="10" cy="13" r="3.5"/><path d="M17 10v4"/>',
  };
  function rsIkon(id) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + (RS_IKON[id] || '') + '</svg>'; }
  function rsFlis(f) { return '<span class="rs-flis" aria-hidden="true">' + f.map(function (c) { return '<i style="background:' + c + '"></i>'; }).join('') + '</span>'; }
  function rsRute(gruppe, v, inne, paa, laas, tekst) {
    return '<button type="button" class="rs-rute' + (laas ? ' laast' : '') + '" data-rs="' + gruppe + '" data-v="' + v + '" aria-pressed="' + !!paa + '" aria-label="' + esc(tekst) + (laas ? ' – ' + esc(laas) : '') + '">' + inne +
      (laas === '🔒' ? '<i class="rs-laas rs-lock" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg></i>' : laas ? '<i class="rs-laas">' + esc(laas) + '</i>' : '') + '<small>' + esc(tekst) + '</small></button>';
  }
  function romArk() {
    if (harSkall()) { try { document.dispatchEvent(new CustomEvent('mv-ark', { detail: { type: 'rom', data: rmData() } })); } catch (x) {} return; }
    lukkArk();
    var m = lagArk('rom-ark', T('Rommet', 'The room')), kropp = m.querySelector('.ark-kropp');
    function tegnArk() {
      var st = tilstand.stua || {}, harPluss = !!(tilstand.pluss && tilstand.pluss.til > Date.now()), naa = st.tema || 'stue', paa = st.ekstra || [], lov = st.ekstraLov || [];
      var rad = function (navn, ruter) { return '<div class="rs-rad"><b>' + navn + '</b><div class="rs-ruter">' + ruter + '</div></div>'; };
      var pl = 'Pluss';
      kropp.innerHTML =
        (innlogget() ? '<p class="rs-husk">' + T('Huskes til neste gang', 'Remembered for next time') + '</p>' : '') +
        rad(T('Rom', 'Room'), TEMAER.map(function (t) {
          var ok = temaLov(t.id, harPluss), gratisNaa = t.gratisI && t.gratisI === sesong();
          return rsRute('tema', t.id, rsFlis(TEMAFARGER[t.id] || TEMAFARGER.stue), naa === t.id, ok ? '' : (gratisNaa ? T('Gratis nå', 'Free now') : pl), t.navn[EN ? 1 : 0]);
        }).join('')) +
        rad(T('Gulv', 'Floor'), STIL.gulv.map(function (v) {
          var laast = STIL_PLUSS.indexOf(v) !== -1 && !harPluss;
          return rsRute('gulv', v, v === 'disko' ? rsFlis(['#FF9CC2', '#63E2A8', '#5A8DEE', '#FFD23F']) : rsIkon(v), (st.gulv || 'fliser') === v, laast ? pl : '', v === 'disko' ? T('Disko', 'Disco') : T('Fliser', 'Tiles'));
        }).join('')) +
        rad(T('Lys', 'Light'), STIL.lys.map(function (v) {
          var laast = STIL_PLUSS.indexOf(v) !== -1 ? !harPluss : (v === 'lys' && lov.indexOf('lys') === -1);
          return rsRute('lys', v, rsIkon(v), (st.lys || 'lampe') === v, laast ? (v === 'lys' ? '🔒' : pl) : '', v === 'lampe' ? T('Lampe', 'Lamp') : v === 'lys' ? T('Lyslenke', 'String lights') : T('Diskokule', 'Disco ball'));
        }).join('')) +
        rad(T('Ting', 'Things'), EKSTRA.filter(function (e) { return e.id !== 'lys'; }).map(function (e) {
          var ok = lov.indexOf(e.id) !== -1;
          return rsRute('ting', e.id, rsIkon(e.id), paa.indexOf(e.id) !== -1, ok ? '' : '🔒', e.navn[EN ? 1 : 0]);
        }).join(''));
    }
    kropp.addEventListener('click', function (e) {
      var b = e.target.closest('[data-rs]'); if (!b) return;
      var st = tilstand.stua || {}, g = b.dataset.rs, v = b.dataset.v, harPluss = !!(tilstand.pluss && tilstand.pluss.til > Date.now());
      if (b.classList.contains('laast')) {
        if (g === 'ting' || (g === 'lys' && v === 'lys')) { var e2 = EKSTRA.find(function (x) { return x.id === (g === 'lys' ? 'lys' : v); }); return toast(e2 ? e2.laas[EN ? 1 : 0] : ''); }
        lukkArk(); return visPlussTilbud();
      }
      var rom = { tema: st.tema || 'stue', gulv: st.gulv || 'fliser', lys: st.lys || 'lampe', ekstra: (st.ekstra || []).slice() };
      if (g === 'tema') { rom.tema = v; gjor({ handling: 'stua-tema', tema: v }); }
      else if (g === 'gulv' || g === 'lys') { rom[g] = v; gjorAlltid({ handling: 'stua-stil', gulv: rom.gulv, lys: rom.lys }); }
      else if (g === 'ting') { var i = rom.ekstra.indexOf(v); if (i === -1) rom.ekstra.push(v); else rom.ekstra.splice(i, 1); gjorAlltid({ handling: 'stua-ekstra', liste: rom.ekstra }); }
      void harPluss;
      huskRom(rom);
    });
    tegnArk();
    aapentArk = { el: m, oppdater: tegnArk };
  }
  /** Rommet lagres sammen med pynten på kontoen, så neste rom verten lager starter likt. */
  var huskT = null;
  function huskRom(rom) {
    if (!innlogget()) return;
    clearTimeout(huskT);
    huskT = setTimeout(function () {
      kontoApi('/api/konto/pynt').then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
        if (!d) return;
        var valgt = d.valgt || {}; valgt.rom = rom;
        return kontoApi('/api/konto/pynt', { method: 'POST', body: JSON.stringify({ valgt: valgt }) });
      }).catch(function () {});
    }, 600);
  }
  // Nytt rom: verten får rommet slik det sist var (bare det som fortsatt er lov)
  var romHusket = false;
  function hentHusketRom() {
    if (romHusket || !erVert() || !innlogget() || !tilstand) return; romHusket = true;
    var st = tilstand.stua || {};
    if ((st.tema || 'stue') !== 'stue' || (st.gulv || 'fliser') !== 'fliser' || (st.lys || 'lampe') !== 'lampe' || (st.ekstra || []).length || (tilstand.historikk || []).length) return;
    kontoApi('/api/konto/pynt').then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
      var r = d && d.valgt && d.valgt.rom; if (!r) return;
      var harPluss = !!(tilstand.pluss && tilstand.pluss.til > Date.now()), lov = (tilstand.stua || {}).ekstraLov || [];
      if (r.tema !== 'stue' && temaLov(r.tema, harPluss)) gjorAlltid({ handling: 'stua-tema', tema: r.tema });
      var gulv = STIL_PLUSS.indexOf(r.gulv) !== -1 && !harPluss ? 'fliser' : r.gulv, lys = (STIL_PLUSS.indexOf(r.lys) !== -1 && !harPluss) || (r.lys === 'lys' && lov.indexOf('lys') === -1) ? 'lampe' : r.lys;
      if (gulv !== 'fliser' || lys !== 'lampe') gjorAlltid({ handling: 'stua-stil', gulv: gulv, lys: lys });
      var ekstra = (r.ekstra || []).filter(function (id) { return lov.indexOf(id) !== -1; });
      if (ekstra.length) gjorAlltid({ handling: 'stua-ekstra', liste: ekstra });
    }).catch(function () {});
  }
  /** Døra: ut på takterrassen, eller inn igjen. Åpen når rommet har Pluss. */
  function dorArk() {
    lukkArk();
    var m = lagArk('dor-ark', T('Døra', 'The door')), kropp = m.querySelector('.ark-kropp');
    function tegnArk() {
      var st = tilstand.stua || {}, ute = st.ute || [], harPluss = !!(tilstand.pluss && tilstand.pluss.til > Date.now()), jegUte = ute.indexOf(meg.id) !== -1;
      kropp.innerHTML = (ute.length ? '<div class="dor-ute">' + ute.map(function (id) { return '<span>' + esc(navn(id)) + '</span>'; }).join('') + '</div>' : '') +
        (jegUte ? '<button type="button" class="rom-stor-knapp" data-d="ut">' + T('Gå inn igjen', 'Go back in') + '</button>'
          : harPluss ? '<button type="button" class="rom-stor-knapp dor-ut" data-d="ut">' + T('Gå ut på takterrassen', 'Go out to the rooftop') + '</button>'
          : '<button type="button" class="rom-stor-knapp dor-laast" data-d="pluss">🔒 ' + T('Gå ut på takterrassen', 'Go out to the rooftop') + '</button>' +
            '<button type="button" class="btn dor-pluss" data-d="pluss">' + T('Pluss åpner døra for alle', 'Pluss opens the door for everyone') + '</button>') +
        (erVert() ? '<p class="small"><button type="button" class="linkbtn" data-d="rom">' + T('Rommet', 'The room') + '</button></p>' : '');
    }
    kropp.addEventListener('click', function (e) {
      var b = e.target.closest('[data-d]'); if (!b) return;
      if (b.dataset.d === 'ut') { gjorAlltid({ handling: 'stua-ut' }); lukkArk(); }
      else if (b.dataset.d === 'pluss') { lukkArk(); visPlussTilbud(); }
      else if (b.dataset.d === 'rom') romArk();
    });
    tegnArk();
    aapentArk = { el: m, oppdater: tegnArk };
  }
  root.addEventListener('click', function (e) {
    if (!e.target.closest) return;
    if (e.target.closest('[data-g="figur-ark"]')) figurArk();
    else if (e.target.closest('[data-g="rom-ark"]') && erVert()) romArk();
  });

  /** Nytt i garderoben etter kvelden – eller et lite dytt om å lage bruker, så pynten kan samles på. */
  function nyPyntBoks() {
    var meg2 = (tilstand.spillere || []).find(function (p) { return p.id === tilstand.meg; });
    if (tilstand.nyPynt && tilstand.nyPynt.length) {
      return '<div class="rom-nypynt">' + klistremerke('gnist', 'rom-inline-merke') + '<b>' + T('Nytt i garderoben: ', 'New in your wardrobe: ') + esc(tilstand.nyPynt.map(function (id) { return pyntNavn(id, EN ? 'en' : 'no'); }).join(', ')) + '</b>' +
        '<button class="btn small gold" type="button" data-g="figur-ark">' + T('Ta det på nå', 'Put it on now') + '</button></div>';
    }
    if (meg2 && !meg2.bruker) return '<p class="rom-nypynt-dytt">' + T('Med en bruker låser du opp luer, briller og kjæledyr til figuren din når du spiller. Alt er gratis.', 'With an account you unlock hats, glasses and pets for your figure as you play. All free.') + ' <a href="' + RUTE.konto + '">' + T('Lag bruker', 'Create an account') + '</a></p>';
    return '';
  }
  function oppsummering() {
    var t = kveldsTall();
    return kveldVinnerBoks() + nyPyntBoks() + '<div class="kveld-sum"><p class="rom-etikett">' + T('Kvelden er over', 'The night is over') + '</p><h2 class="rom-h2" style="margin-top:0">' + T('Kveldens oppsummering', 'Tonight\'s recap') + '</h2>' +
      '<div class="stat-tall"><div><b>' + t.sumSlurker + '</b><span>' + T('slurker til sammen', 'sips in total') + '</span></div><div><b>' + t.leker.length + '</b><span>' + T('leker spilt', 'games played') + '</span></div>' +
      '<div><b>' + t.sumSendt + '</b><span>' + T('🍺 sendt', '🍺 sent') + '</span></div><div><b>' + (t.minutter >= 60 ? Math.floor(t.minutter / 60) + T('t ', 'h ') + (t.minutter % 60) + 'm' : t.minutter + ' min') + '</b><span>' + T('i rommet', 'in the room') + '</span></div></div>' +
      (t.kaaring.length ? '<div class="rom-kaaring">' + t.kaaring.map(function (x) { return '<div><span>' + x.ikon + '</span><small>' + esc(x.tittel) + '</small><b>' + esc(x.navn) + ' · ' + esc(x.tall) + '</b></div>'; }).join('') + '</div>' : '') +
      (t.leker.length ? '<p class="small">' + T('Dere spilte: ', 'You played: ') + t.leker.map(esc).join(', ') + '</p>' : '') +
      '<ol class="rom-resultat">' + t.rangert.map(function (p) { return '<li><span>' + esc(p.navn) + '</span><b>' + (p.slurker || 0) + '</b></li>'; }).join('') + '</ol>' +
      (tilstand.gjeng ? '<p class="rom-gjeng">' + T('🏆 Kvelden er lagret i sesongtabellen til ', '🏆 Tonight is saved in the season table for ') + '<a href="' + RUTE.gjeng + '?k=' + esc(tilstand.gjeng.kode) + '"><b>' + esc(tilstand.gjeng.navn) + '</b></a>.</p>'
        : erVert() ? '<p class="small">' + T('Spiller dere ofte sammen?', 'Play together often?') + ' <a href="' + RUTE.gjeng + '">' + T('Lag en fast gjeng', 'Make a crew') + '</a>' + T(', så samles poengene fra kveld til kveld.', ' and your points add up night after night.') + '</p>' : '') +
      '<div class="dl-knapper"><button class="btn gold" data-g="del-kveld" type="button">' + T('Del på Snap, Insta eller Messenger', 'Share on Snap, Insta or Messenger') + '</button>' +
      (erVert() ? '<button class="btn ghost" data-g="fortsett-kvelden" type="button">' + T('Fortsett kvelden', 'Keep the night going') + '</button>' : '') + '</div></div>';
  }
  /** Tekst på delingsbilder følger alkoholfri modus. */
  function torr(x) { return window.BDTorr ? window.BDTorr.tekst(String(x)) : String(x); }
  function medT(g) { var ft = g.fillText.bind(g); g.fillText = function (x, a, b2, c) { return c ? ft(torr(x), a, b2, c) : ft(torr(x), a, b2); }; return g; }
  var vervKode = null;
  function hentVervKode() {
    if (vervKode !== null || !window.BDKonto || !window.BDKonto.les()) return;
    vervKode = '';
    kontoApi('/api/verv').then(function (r) { return r.ok ? r.json() : {}; }).then(function (d) { vervKode = d.kode || ''; }).catch(function () {});
  }
  /** Kveldens oppsummering som story-bilde (1080×1920) – passer Snapchat og Instagram. */
  function storyBilde() {
    var t = kveldsTall(), W = 1080, H = 1920, font = '"Archivo Variable", "Archivo", system-ui, sans-serif';
    var c = document.createElement('canvas'); c.width = W; c.height = H;
    var g = medT(c.getContext('2d'));
    var bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#2A1A22'); bg.addColorStop(0.45, '#1A1012'); bg.addColorStop(1, '#0A0609');
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    // logoen (flisen med to kopper) i hjørnet
    (function () {
      g.save(); g.translate(905, 190); g.rotate(0.1); g.scale(2.3, 2.3); g.translate(-50, -50);
      g.fillStyle = '#E4C47F'; g.beginPath(); if (g.roundRect) g.roundRect(0, 0, 100, 100, 26); else g.rect(0, 0, 100, 100); g.fill();
      [[28, 14], [72, -14]].forEach(function (k) { g.save(); g.translate(k[0], 87); g.rotate(k[1] * Math.PI / 180); g.fillStyle = '#1A1012'; g.fill(new Path2D('M-7.5 -60 H7.5 Q8 -32 0 -27 Q-8 -32 -7.5 -60 Z')); g.fillRect(-1.6, -28, 3.2, 25); g.fillRect(-9, -4.5, 18, 4.5); g.restore(); });
      g.strokeStyle = '#1A1012'; g.lineWidth = 4; g.lineCap = 'round';
      g.stroke(new Path2D('M50 22 V12 M41.5 24 L37 17 M58.5 24 L63 17'));
      g.restore();
    })();
    function sentrert(x, y, stil, farge) { g.font = stil; g.fillStyle = farge; g.fillText(x, 80, y); }
    g.font = '800 44px ' + font; g.fillStyle = '#F7EFE3'; g.fillText('mitt', 80, 150);
    var bredde = g.measureText('mitt').width; g.fillStyle = '#E4C47F'; g.fillText('vors', 80 + bredde, 150);
    g.font = '800 104px ' + font; g.fillStyle = '#F7EFE3';
    g.fillText(T('Kveldens', 'Tonight\'s'), 80, 330); g.fillText(T('oppsummering', 'recap'), 80, 440);
    var dag = new Date(tilstand.ferdig || Date.now()).toLocaleDateString(LOKALE, { weekday: 'long', day: 'numeric', month: 'long' });
    sentrert(dag.charAt(0).toUpperCase() + dag.slice(1) + (tilstand.gjeng ? ' · ' + tilstand.gjeng.navn : ''), 510, '500 38px ' + font, '#C4B5B2');
    // tre store tall
    var tall = [[t.sumSlurker, T('slurker', t.sumSlurker === 1 ? 'sip' : 'sips')], [t.leker.length, t.leker.length === 1 ? T('lek', 'game') : T('leker', 'games')], [t.minutter >= 60 ? Math.floor(t.minutter / 60) + T('t ', 'h ') + (t.minutter % 60) + 'm' : t.minutter + ' min', T('sammen', 'together')]];
    tall.forEach(function (x, i) {
      var bx = 80 + i * 310;
      g.fillStyle = 'rgba(200,255,46,.10)'; g.beginPath(); if (g.roundRect) g.roundRect(bx, 570, 290, 170, 28); else g.rect(bx, 570, 290, 170); g.fill();
      g.fillStyle = '#E4C47F'; g.font = '800 70px ' + font; g.fillText(String(x[0]), bx + 28, 668);
      g.fillStyle = '#C4B5B2'; g.font = '500 32px ' + font; g.fillText(x[1], bx + 30, 716);
    });
    var y = 830;
    t.kaaring.slice(0, 4).forEach(function (x) {
      g.fillStyle = 'rgba(248,233,210,.06)'; g.beginPath(); if (g.roundRect) g.roundRect(80, y - 20, W - 160, 132, 26); else g.rect(80, y - 20, W - 160, 132); g.fill();
      g.font = '64px system-ui, "Apple Color Emoji", "Segoe UI Emoji", sans-serif'; g.fillStyle = '#fff'; g.fillText(x.ikon, 110, y + 72);
      g.fillStyle = '#C4B5B2'; g.font = '500 32px ' + font; g.fillText(x.tittel, 210, y + 30);
      g.fillStyle = '#F7EFE3'; g.font = '700 48px ' + font; g.fillText((x.navn + ' · ' + x.tall).slice(0, 34), 210, y + 90);
      y += 152;
    });
    y += 30;
    g.fillStyle = '#E4C47F'; g.font = '700 40px ' + font; g.fillText(T('Slurketavla', 'Sip board'), 80, y); y += 20;
    var topp = Math.max(1, t.rangert[0] ? t.rangert[0].slurker || 0 : 1);
    t.rangert.slice(0, Math.max(3, Math.min(6, Math.floor((1700 - y) / 76)))).forEach(function (p, i) {
      y += 76;
      g.fillStyle = i === 0 ? '#E4C47F' : '#F7EFE3'; g.font = '700 42px ' + font; g.fillText((i + 1) + '. ' + p.navn.slice(0, 16), 80, y);
      g.fillStyle = 'rgba(200,255,46,.18)'; g.fillRect(560, y - 30, 300, 26);
      g.fillStyle = '#E4C47F'; g.fillRect(560, y - 30, Math.round(300 * (p.slurker || 0) / topp), 26);
      g.fillStyle = '#F7EFE3'; g.textAlign = 'right'; g.fillText(String(p.slurker || 0), W - 80, y); g.textAlign = 'left';
    });
    if (t.leker.length && y < 1560) {
      y += 90; g.fillStyle = '#C4B5B2'; g.font = '500 32px ' + font; g.fillText(T('Dere spilte', 'You played'), 80, y);
      g.fillStyle = '#F7EFE3'; g.font = '600 38px ' + font;
      var linje = '', ord = t.leker.join(' · ').split(' ');
      ord.forEach(function (w) { var prov = linje ? linje + ' ' + w : w; if (g.measureText(prov).width > W - 160 && linje) { y += 52; if (y < 1700) g.fillText(linje, 80, y); linje = w; } else linje = prov; });
      y += 52; if (y < 1700) g.fillText(linje, 80, y);
    }
    g.fillStyle = '#E4C47F'; g.fillRect(80, H - 170, W - 160, 4);
    g.fillStyle = '#F7EFE3'; g.font = '700 44px ' + font; g.fillText(T('Spill med oss neste gang', 'Play with us next time'), 80, H - 95);
    g.fillStyle = '#C4B5B2'; g.font = '600 38px ' + font; g.fillText('mittvors.no', 80, H - 45);
    return new Promise(function (ok) {
      c.toBlob(function (blob) { ok(blob ? new File([blob], 'mittvors-kveld.png', { type: 'image/png' }) : null); }, 'image/png');
    });
  }

  /** Gjengens lov som story-bilde (1080×1920): den nye loven, tittelen og konvolutten. */
  function lovStoryBilde() {
    var W = 1080, H = 1920, font = '"Archivo Variable", "Archivo", system-ui, sans-serif';
    var c = document.createElement('canvas'); c.width = W; c.height = H;
    var g = medT(c.getContext('2d'));
    var bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#3A2230'); bg.addColorStop(0.5, '#1A1012'); bg.addColorStop(1, '#0A0609');
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    g.font = '800 44px ' + font; g.fillStyle = '#F7EFE3'; g.fillText('mitt', 80, 150);
    var b = g.measureText('mitt').width; g.fillStyle = '#E4C47F'; g.fillText('vors', 80 + b, 150);
    function linjer(tekst, stil, maks) {
      g.font = stil; var ut = [], l = '';
      String(tekst).split(' ').forEach(function (w) { var p = l ? l + ' ' + w : w; if (g.measureText(p).width > maks && l) { ut.push(l); l = w; } else l = p; });
      if (l) ut.push(l); return ut;
    }
    var kv = tilstand.kveld || {}, lv = kv.lovValg || {};
    g.fillStyle = '#C4B5B2'; g.font = '600 40px ' + font; g.fillText('⚖️ ' + T('Gjengens lov', 'The Crew’s Law') + (tilstand.gjeng ? ' · ' + tilstand.gjeng.navn : ''), 80, 300);
    g.fillStyle = '#F7EFE3'; g.font = '800 64px ' + font; g.fillText(linjer('🏆 ' + (kv.vinner ? navn(kv.vinner) : '') + T(' vant kvelden', ' won the night'), '800 64px ' + font, W - 160)[0], 80, 380);
    var y = 520;
    var boks = function (hoyde, farge) { g.fillStyle = farge; g.beginPath(); if (g.roundRect) g.roundRect(80, y, W - 160, hoyde, 36); else g.rect(80, y, W - 160, hoyde); g.fill(); };
    if (lv.tekst) {
      var l = linjer('«' + lv.tekst + '»', '800 72px ' + font, W - 260), hh = 200 + l.length * 88;
      boks(hh, lv.type === 'opphev' ? '#3A2230' : '#F7EFE3');
      g.fillStyle = lv.type === 'opphev' ? '#D9503C' : '#8A2A1D'; g.font = '700 36px ' + font; g.fillText(lv.type === 'opphev' ? '🗑️ ' + T('OPPHEVET', 'REPEALED') : '📜 ' + T('NY REGEL', 'NEW RULE'), 130, y + 90);
      g.fillStyle = lv.type === 'opphev' ? '#C4B5B2' : '#1A1012'; g.font = '800 72px ' + font; l.forEach(function (x, i) { g.fillText(x, 130, y + 190 + i * 88); });
      y += hh + 50;
    }
    var antall = ((tilstand.gjeng && tilstand.gjeng.regler) || []).length;
    if (antall) { g.fillStyle = '#E4C47F'; g.font = '700 48px ' + font; g.fillText('📜 ' + antall + T(antall === 1 ? ' regel i lovboka' : ' regler i lovboka', antall === 1 ? ' rule in the law book' : ' rules in the law book'), 80, y + 60); }
    y += 120;
    if (y < 1380) {
      // Logoen (flisen) fyller tomrommet nederst
      var cy = Math.min(1500, y + (1700 - y) / 2), sk = Math.min(4.2, (1700 - y) / 130);
      g.save(); g.translate(W / 2, cy); g.rotate(-0.08); g.scale(sk, sk); g.translate(-50, -50);
      g.fillStyle = '#E4C47F'; g.beginPath(); if (g.roundRect) g.roundRect(0, 0, 100, 100, 26); else g.rect(0, 0, 100, 100); g.fill();
      [[28, 14], [72, -14]].forEach(function (k) { g.save(); g.translate(k[0], 87); g.rotate(k[1] * Math.PI / 180); g.fillStyle = '#1A1012'; g.fill(new Path2D('M-7.5 -60 H7.5 Q8 -32 0 -27 Q-8 -32 -7.5 -60 Z')); g.fillRect(-1.6, -28, 3.2, 25); g.fillRect(-9, -4.5, 18, 4.5); g.restore(); });
      g.strokeStyle = '#1A1012'; g.lineWidth = 4; g.lineCap = 'round'; g.stroke(new Path2D('M50 22 V12 M41.5 24 L37 17 M58.5 24 L63 17'));
      g.restore();
    }
    g.fillStyle = '#E4C47F'; g.fillRect(80, H - 170, W - 160, 4);
    g.fillStyle = '#F7EFE3'; g.font = '700 44px ' + font; g.fillText(T('Hvilke lover har din gjeng?', 'What laws does your crew have?'), 80, H - 95);
    g.fillStyle = '#C4B5B2'; g.font = '600 38px ' + font; g.fillText('mittvors.no', 80, H - 45);
    return new Promise(function (ok) { c.toBlob(function (bl) { ok(bl ? new File([bl], 'mittvors-lov.png', { type: 'image/png' }) : null); }, 'image/png'); });
  }
  function delLov() {
    var lov = (tilstand.kveld && tilstand.kveld.lovValg) || null;
    var url = (window.__MV_ORIGIN || location.origin) + RUTE.hjem + (vervKode ? '?v=' + vervKode : '');
    var tekst = lov && lov.type === 'ny' ? T('📜 Ny regel i ' + (tilstand.gjeng ? tilstand.gjeng.navn : 'gjengen') + ': «' + lov.tekst + '»', '📜 New rule in ' + (tilstand.gjeng ? tilstand.gjeng.navn : 'the crew') + ': “' + lov.tekst + '”') : T('Gjengens lov på mittvors ⚖️', 'The Crew’s Law on mittvors ⚖️');
    hentVervKode();
    if (window.BDDel) return window.BDDel.lenke(url, tekst, { tittel: T('Del kvelden', 'Share the night'), bilde: lovStoryBilde });
    lovStoryBilde().then(function (fil) {
      if (fil && navigator.canShare && navigator.canShare({ files: [fil] })) navigator.share({ files: [fil], text: tekst + ' ' + url }).catch(function () {});
    });
  }
  function delKveld() {
    var url = tilstand.gjeng ? (window.__MV_ORIGIN || location.origin) + RUTE.gjeng + '?k=' + tilstand.gjeng.kode : (window.__MV_ORIGIN || location.origin) + RUTE.hjem + (vervKode ? '?v=' + vervKode : '');
    var t = kveldsTall();
    var tekst = torr(t.kaaring[0] ? t.kaaring[0].tittel + ': ' + t.kaaring[0].navn + ' 🏆 ' : '') + T('Kveldens oppsummering fra mittvors –', 'Tonight\'s recap from mittvors –');
    if (!window.BDDel) {
      // Uten delingsarket: del bildet direkte, eller last det ned
      return storyBilde().then(function (fil) {
        if (!fil) return toast(T('Fikk ikke laget bildet.', 'Couldn\'t create the image.'));
        if (navigator.canShare && navigator.canShare({ files: [fil] })) return navigator.share({ files: [fil], title: 'mittvors', text: tekst + ' ' + url }).catch(function () {});
        var a = document.createElement('a'); a.href = URL.createObjectURL(fil); a.download = fil.name;
        document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 5000);
      });
    }
    window.BDDel.lenke(url, tekst, { tittel: T('Del kvelden', 'Share the night'), ingress: T('Bildet passer rett i storyen på Snapchat og Instagram. Lenken kan sendes på Messenger eller SMS.', 'The image fits straight into your Snapchat or Instagram story. The link can be sent on Messenger or by text.'), bilde: storyBilde });
  }

  /* ---------- poengtavla ---------- */
  var tavle = null;
  function rangert() {
    return (tilstand.spillere || []).slice().sort(function (a, b) { return (b.slurker || 0) - (a.slurker || 0) || a.navn.localeCompare(b.navn); });
  }
  function kaaring() {
    var l = rangert(), sum = l.reduce(function (n, p) { return n + (p.slurker || 0); }, 0), ut = [];
    if (!sum) return ut;
    ut.push({ ikon: '🏆', tittel: T('Kveldens tørstigste', 'Thirstiest of the night'), navn: l[0].navn, n: l[0].slurker });
    if (l.length >= 3) { var sist = l[l.length - 1]; ut.push({ ikon: '🧊', tittel: T('Kveldens edruste', 'Soberest of the night'), navn: sist.navn, n: sist.slurker || 0 }); }
    ut.push({ ikon: '🍻', tittel: T('Hele gjengen', 'The whole crew'), navn: sum + ' ' + T('slurker til sammen', 'sips in total'), n: null });
    return ut;
  }
  function tavleHtml() {
    var l = rangert(), k = kaaring();
    return '<div class="rom-tavle-innhold" role="document"><div class="rom-tavle-topp"><h2>' + T('Poengtavla', 'The scoreboard') + '</h2><button class="linkbtn" data-t="lukk" type="button">' + T('Lukk', 'Close') + '</button></div>' +
      '<p class="small">' + T('Lekene fører slurkene selv. 🍺 er slurker du har vunnet og kan sende til andre.', 'The games keep track of sips themselves. 🍺 are sips you\'ve won and can send to others.') + '</p>' +
      '<ol class="rom-tavle-liste">' + l.map(function (p, i) {
        return '<li class="' + (p.id === tilstand.meg ? 'meg' : '') + '"><span class="rt-plass">' + (i + 1) + '</span><span class="rt-navn">' + esc(p.navn) + '</span>' +
          '<b class="rt-tall">' + (p.slurker || 0) + '</b>' + (p.gi ? '<span class="rt-gi" title="' + T('Slurker å dele ut', 'Sips to hand out') + '">🍺' + p.gi + '</span>' : '') +
          '</li>';
      }).join('') + '</ol>' +
      (k.length ? '<div class="rom-kaaring">' + k.map(function (x) { return '<div><span>' + x.ikon + '</span><small>' + esc(x.tittel) + '</small><b>' + esc(x.navn) + (x.n !== null ? ' · ' + x.n : '') + '</b></div>'; }).join('') + '</div>' : '') +
      '<div class="dl-knapper"><button class="btn gold" data-t="del" type="button">' + T('Del tavla som bilde', 'Share the board as an image') + '</button></div></div>';
  }
  function aapneTavle() {
    if (tavle) return;
    tavle = document.createElement('div'); tavle.className = 'rom-tavle'; tavle.setAttribute('role', 'dialog'); tavle.setAttribute('aria-label', T('Poengtavle', 'Scoreboard'));
    tavle.innerHTML = tavleHtml();
    tavle.addEventListener('click', function (e) {
      if (e.target === tavle) return lukkTavle();
      var b = e.target.closest('[data-t]'); if (!b) return;
      var t = b.dataset.t;
      if (t === 'lukk') return lukkTavle();
      if (t === 'del') return delTavle(b);
    });
    document.body.appendChild(tavle);
  }
  function lukkTavle() { if (tavle) { tavle.remove(); tavle = null; } }
  function delTavle(knapp) {
    var l = rangert(), k = kaaring(), W = 1080, H = Math.max(1080, 420 + l.length * 96 + k.length * 110);
    var c = document.createElement('canvas'); c.width = W; c.height = H;
    var g = medT(c.getContext('2d')), font = '"Archivo Variable", "Archivo", system-ui, sans-serif';
    g.fillStyle = '#1A1012'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#E4C47F'; g.font = '800 84px ' + font; g.fillText(T('Kveldens tavle', 'Tonight\'s board'), 80, 160);
    g.fillStyle = '#C4B5B2'; g.font = '500 36px ' + font;
    g.fillText(new Date().toLocaleDateString(LOKALE, { weekday: 'long', day: 'numeric', month: 'long' }) + T(' · rom ', ' · room ') + kode, 80, 220);
    var y = 320, maks = Math.max(1, l[0] ? l[0].slurker || 0 : 1);
    l.forEach(function (p, i) {
      g.fillStyle = i === 0 ? '#E4C47F' : '#F7EFE3'; g.font = '800 48px ' + font; g.fillText((i + 1) + '.', 80, y);
      g.font = '700 48px ' + font; g.fillText(p.navn.slice(0, 18), 160, y);
      g.fillStyle = 'rgba(200,255,46,.25)'; g.fillRect(620, y - 34, 300, 30);
      g.fillStyle = '#E4C47F'; g.fillRect(620, y - 34, Math.round(300 * (p.slurker || 0) / maks), 30);
      g.fillStyle = '#F7EFE3'; g.font = '800 48px ' + font; g.textAlign = 'right'; g.fillText(String(p.slurker || 0), W - 80, y); g.textAlign = 'left';
      y += 96;
    });
    y += 30;
    k.forEach(function (x) {
      g.fillStyle = '#C4B5B2'; g.font = '500 32px ' + font; g.fillText(x.ikon + '  ' + x.tittel, 80, y);
      g.fillStyle = '#F7EFE3'; g.font = '700 44px ' + font; g.fillText(x.navn + (x.n !== null ? ' · ' + x.n : ''), 80, y + 52); y += 110;
    });
    g.fillStyle = '#8F81AD'; g.font = '600 32px ' + font; g.fillText('mittvors.no', 80, H - 70);
    c.toBlob(function (blob) {
      if (!blob) return toast(T('Fikk ikke laget bildet.', 'Couldn\'t create the image.'));
      var fil = new File([blob], 'mittvors-tavle.png', { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [fil] })) {
        navigator.share({ files: [fil], title: T('Kveldens tavle', 'Tonight\'s board'), text: T('Kveldens tavle fra mittvors', 'Tonight\'s board from mittvors') }).catch(function () {});
      } else {
        var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'mittvors-tavle.png';
        document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 5000);
      }
    }, 'image/png');
  }

  function tegn() {
    tvKoblSjekk(); tvSjekk();
    if (tavle && tilstand) tavle.innerHTML = tavleHtml();
    if (!tilstand) return;
    if (rofDrar) { rofVentTegn = true; return; }   // ikke tegn ringen på nytt midt i et drag
    if (document.documentElement.classList.contains('stua-drar') && Date.now() - stuaDrarFra < 8000) { stuaVentTegn = true; return; }   // eller stua mens noen holder en person (høyst 8 s)
    if (borsLas && document.querySelector('.bs-side .bs-meld, .bs-side .bs-anmeld')) return;   // ikke mist bildet/valgene mens du melder
    var aktivt = document.activeElement;
    if (aktivt && aktivt.closest && aktivt.closest('.bs-side') && (aktivt.tagName === 'SELECT' || aktivt.tagName === 'INPUT')) return;   // ikke forstyrr mens du velger/skriver
    var bsValg = {}; ['bsSlurkTil', 'bsGiTil'].forEach(function (id) { var e = document.getElementById(id); if (e) bsValg[id] = e.value; });
    var bsTekst = document.getElementById('bsNyTekst'), bsTekstV = bsTekst && !borsModal ? bsTekst.value : null;
    var s = tilstand.spill, innhold = '';
    if (!s) aktiverPluss(false);
    if (!s && tilstand.ferdig) { innhold = oppsummering(); hentVervKode(); }
    else if (!s && tilstand.bors && tilstand.bors.fokus && (tilstand.bors.paa || tilstand.bors.slutt)) innhold = borsSide();
    else if (!s) innhold = lobby();
    else {
      innhold = '<div class="rom-spill"><p class="rom-spillnavn">' + esc(s.navn) + (s.modus && s.modus !== '*' && s.type !== 'bingo' && s.lek !== 'ring-of-fire' ? ' · ' + esc(s.modus) : '') + '</p>' +
        ({ kort: kortSpill, mest: mestSpill, forraeder: function (s) { return forraederSpill(s) + lhBenk(s); }, bingo: bingoSpill, en: enSpill, opus: opusSpill, overunder: overunderSpill,
           veddelopet: veddelopetSpill, pyramiden: pyramidenSpill, dealer: dealerSpill, gris: grisSpill, president: presidentSpill, regelfabrikken: regelfabrikkenSpill, tosannheter: tosannheterSpill, bussruta: bussrutaSpill, yatzy: yatzySpill, nyhetsrunden: function (s) { return nyhetsrundenSpill(s) + nrBenk(s); }, hvemskrev: hvemskrevSpill, bloff: bloffSpill, samme: sammeSpill, spion: spionSpill, pannekort: pannekortSpill, skal: skalSpill }[s.type] || function () { return ''; })(s) + slurkelinje() + reglerPanel(s) + '</div>';
      // Nyhetsrunden finnes bare på norsk
      if (EN && s.type === 'nyhetsrunden') innhold = innhold.replace('</p>', '</p><p class="small">🇳🇴 ' + T('', 'Questions are in Norwegian') + '</p>');
    }
    if (s && s.turStart && erVert()) innhold += '<p class="rom-hopp" data-turstart="' + s.turStart + '" hidden><button class="btn ghost small" data-g="hopp-over" type="button">' + T('Hopp over den som har tur', 'Skip whoever\'s turn it is') + '</button></p>';
    var vert = erApp && !s && !appMer && !visSkjerm ? '' : vertVerktoy(s);   // app-lobbyen: alt for verten ligger bak «Mer»
    var tsLagret = [0, 1, 2].map(function (i) { var e = document.getElementById('tsR' + i); return e ? e.value : null; }), tsValgt = (document.querySelector('input[name=tsL]:checked') || {}).value;
    var tsFokus = document.activeElement && /^tsR\d$/.test(document.activeElement.id) ? document.activeElement.id : null;
    var y = window.scrollY, gammel = document.getElementById('rfInput'), gVerdi = gammel ? gammel.value : null, gFokus = gammel && document.activeElement === gammel;
    var nrGammel = document.getElementById('nrInput'), nrVerdi = nrGammel ? nrGammel.value : null, nrFokus = nrGammel && document.activeElement === nrGammel;
    var lbGammel = document.getElementById('lbInput'), lbVerdi = lbGammel ? lbGammel.value : null, lbFokus = lbGammel && document.activeElement === lbGammel;
    var sosGammel = document.getElementById('sosInput'), sosVerdi = sosGammel ? sosGammel.value : null, sosFokus = sosGammel && document.activeElement === sosGammel;
    var lovGammel = document.getElementById('lovNyTekst'), lovVerdi = lovGammel ? lovGammel.value : null, lovFokus = lovGammel && document.activeElement === lovGammel;
    // Under en lek: leken først, det som går i bakgrunnen etterpå, reaksjonene i en dokk nederst (se natt.css).
    // I lobbyen: som før.
    var turTekst = minTurNaa(tilstand);
    var topp = hode() + (tilstand.pluss ? '<p class="rom-pluss">' + klistremerke('gnist', 'rom-inline-merke') + T('Pluss i kveld – alle leker er åpne, plass til 16', 'Pluss tonight – every game is open, room for 16') + '</p>' : '') + venterStripe();
    var merker = '<div class="tur-merke" aria-live="polite">' + esc(turTekst) + '</div><div class="hemmelig-merke">' + klistremerke('hysj', 'rom-inline-merke') + T('Bare du ser dette – hold skjermen for deg selv', 'Only you can see this – keep the screen to yourself') + '</div>';
    var forlat = '<p class="rom-forlat"><button class="linkbtn" data-g="forlat" type="button">' + T('Forlat rommet', 'Leave the room') + '</button> · <button type="button" class="feilknapp" data-feil>' + T('Noe galt?', 'Something wrong?') + '</button></p>';
    // Nytt kort? Ta vare på det gamle, så det kan kastes ut av skjermen når det nye deles ut
    var nyKN = kortNokkel(s), kortByttet = !!(tegnetFor && nyKN && nyKN !== sistKortNokkel) && !roligBevegelse();
    tegnetFor = true;
    var gammeltKort = kortByttet ? root.querySelector('.rom-kort, .rof-kort.rom-rof') : null;
    var gammelRekt = gammeltKort ? gammeltKort.getBoundingClientRect() : null;
    sistKortNokkel = nyKN;
    var lekSkjerm = !!s && erMobil();   // leken fyller skjermen: stua, regler, slurker og vertens knapper ligger bak «Stua» og «Mer» i toppen
    var stuaPlass = tilstand.ferdig || lekSkjerm ? '' : STUA_PLASS;
    var kbFra = kbRekt(), benkFra = benkRekter();
    settRot(s
      ? topp + (lekSkjerm ? hoderad(s) : '') + merker + borsHurtig() + innhold + stuaPlass + '<div class="rom-bakgrunn">' + oppdragKnapp() + borsPille() + mesterStripe() + '</div>' + reaksjonslinje() + (lekSkjerm ? '' : vert + forlat)
      : topp + stuaPlass + oppdragKnapp() + borsPille() + borsHurtig() + mesterStripe() + (tilstand.bors || tilstand.oppdrag ? reaksjonslinje() : '') + innhold + vert + forlat);
    tegnStua(s);
    kbFly(kbFra); benkGli(benkFra);
    merkNyttInnhold(s);
    trinnEtterTegning();
    // Skjermkanten: lime når det er din tur, stripete når skjermen viser noe hemmelig
    var rotEl = document.documentElement;
    rotEl.classList.add('i-rom');   // i rommet: menyen nederst på mobil skjules, så ingen trykker seg ut ved et uhell (natt.css)
    rotEl.classList.remove('bli-med');   // «bli med»-skjermen er forbi
    meldSkjerm('rom');
    rotEl.classList.toggle('alene', erApp && !s && erVert() && (tilstand.spillere || []).length <= 1);   // app-lobby uten gjester: invitasjonen først
    rotEl.classList.toggle('app-gjest', erApp && !s && !erVert() && !tilstand.valgt);   // gjestens venterom i appen: stua og én linje, ingenting å bla i
    rotEl.classList.toggle('i-spill', !!s);
    if (vlMusikkEl && !(s && s.type === 'veddelopet' && s.fase === 'lop')) vlMusikk(false);
    rotEl.classList.toggle('min-tur', !!turTekst);
    rotEl.classList.toggle('hemmelig', !!root.querySelector('[data-hemmelig]'));
    // Nytt skjermbilde (lobby, ny lek, oppsummering): start øverst. Ellers: behold plassen.
    var skjerm = s ? 'spill:' + s.type + ':' + (s.navn && s.navn.no ? s.navn.no : s.navn) : tilstand.ferdig ? 'ferdig' : 'lobby';
    // 'instant': ellers stopper neste tegning en myk rulling midt på siden
    // Ny lek (ikke første tegning): leken toner inn, og første kort deles ikke ut i tillegg
    var nyLek = !!(s && sisteSkjerm && skjerm !== sisteSkjerm);
    if (nyLek) spillInnFra = Date.now();
    if (skjerm !== sisteSkjerm) { sisteSkjerm = skjerm; window.scrollTo({ top: 0, behavior: 'instant' }); } else window.scrollTo({ top: y, behavior: 'instant' });
    if (kortByttet && !nyLek) delUtKort(gammeltKort, gammelRekt);
    spillInn();
    tsLagret.forEach(function (v, i) { var e = document.getElementById('tsR' + i); if (e && v !== null) e.value = v; });
    if (tsValgt !== undefined) { var r = document.querySelector('input[name=tsL][value="' + tsValgt + '"]'); if (r) r.checked = true; }
    if (tsFokus) { var tf = document.getElementById(tsFokus); if (tf) { tf.focus({ preventScroll: true }); tf.setSelectionRange(tf.value.length, tf.value.length); } }
    var nrNy = document.getElementById('nrInput');
    if (nrNy && nrVerdi !== null) { nrNy.value = nrVerdi; if (nrFokus) nrNy.focus({ preventScroll: true }); }
    var lbNy = document.getElementById('lbInput');
    if (lbNy && lbVerdi !== null) { lbNy.value = lbVerdi; if (lbFokus) lbNy.focus({ preventScroll: true }); }
    var lbS = document.getElementById('lbSkjema');
    if (lbS) lbS.addEventListener('submit', function (e) {
      e.preventDefault(); var i = document.getElementById('lbInput'), v = i.value.trim(); if (!v) return i.focus();
      spillLyd('pop'); gjorAlltid({ handling: 'lb-lat', v: v }); i.blur();
    });
    var nrS = document.getElementById('nrSkjema');
    if (nrS) nrS.addEventListener('submit', function (e) {
      e.preventDefault(); var i = document.getElementById('nrInput'); gjorAlltid({ handling: 'nr-svar', v: i.value.trim() }); i.blur();
    });
    var sosNy = document.getElementById('sosInput');
    if (sosNy && sosVerdi !== null) { sosNy.value = sosVerdi; if (sosFokus) sosNy.focus({ preventScroll: true }); }
    Object.keys(bsValg).forEach(function (id) { var e = document.getElementById(id); if (e && bsValg[id]) e.value = bsValg[id]; });
    var lovNy = document.getElementById('lovNyTekst');
    if (lovNy && lovVerdi !== null) { lovNy.value = lovVerdi; if (lovFokus) lovNy.focus({ preventScroll: true }); }
    var lovSkj = document.getElementById('lovNySkjema');
    if (lovSkj) lovSkj.addEventListener('submit', function (e) {
      e.preventDefault();
      var tx = (document.getElementById('lovNyTekst') || {}).value || '';
      if (tx.trim().length < 4) return toast(T('Skriv hele regelen.', 'Write the whole rule.'));
      if (!confirm(T('Innføre regelen «' + tx.trim() + '»?', 'Introduce the rule “' + tx.trim() + '”?'))) return;
      gjor({ handling: 'lov-valg', type: 'ny', tekst: tx.trim() });
    });
    var sosS = document.getElementById('sosSkjema');
    if (sosS) sosS.addEventListener('submit', function (e) {
      e.preventDefault();
      var i = document.getElementById('sosInput'), t = i.value.trim(); if (!t) return;
      var typ = tilstand.spill && tilstand.spill.type;
      var hd = { hvemskrev: 'hs-skriv', bloff: 'bf-skriv', samme: 'sm-skriv', pannekort: 'pk-skriv' }[typ]; if (!hd) return;
      i.value = ''; i.blur(); gjorAlltid(typ === 'pannekort' ? { handling: hd, tekst: t, kat: t === pkValgtForslag ? pkKat : '' } : { handling: hd, tekst: t });
    });
    var lovS = document.getElementById('lovSkjema');
    if (lovS) lovS.addEventListener('submit', function (e) { e.preventDefault(); var i = document.getElementById('lovInput'), t = i.value.trim(); if (!t) return; if (!confirm(T('Foreslå loven «' + t + '»?', 'Propose the law “' + t + '”?'))) return; gjor({ handling: 'lov-forslag', tekst: t }); });
    var titS = document.getElementById('tittelSkjema');
    if (titS) titS.addEventListener('submit', function (e) { e.preventDefault(); var t = document.getElementById('tittelInput').value.trim(); if (t) gjor({ handling: 'lov-tittel', tittel: t }); });
    var lsS = document.getElementById('lovSvarSkjema');
    if (lsS) lsS.addEventListener('submit', function (e) {
      e.preventDefault(); var i = document.getElementById('lovSvar'), t = i.value.trim(); if (!t) return;
      var r = tilstand.spill && tilstand.spill.r; i.value = ''; i.blur();
      gjorAlltid(r && r.type === 'mage' ? { handling: 'lov-svar', tall: t } : { handling: 'lov-svar', tekst: t });
    });
    sjekkGjengMedlem();
    if (bsTekstV) { var bsNy = document.getElementById('bsNyTekst'); if (bsNy) { bsNy.value = bsTekstV; bsNy.closest('details') && (bsNy.closest('details').open = true); } }
    sjekkOppdrag();
    tegnBors();
    visReaksjoner(tilstand.reak);
    sjekkHjul();
    if (tavleHjul) tegnHjulModal(false);
    if (document.querySelector('[data-frist]')) fristTikk(); else clearInterval(fristTimer);
    var ny = document.getElementById('rfInput');
    if (ny && gVerdi !== null) { ny.value = gVerdi; if (gFokus) ny.focus({ preventScroll: true }); }
    var sofaSk = document.getElementById('sofaSkjema');
    if (sofaSk) sofaSk.addEventListener('submit', function (e) {
      e.preventDefault();
      var inp = document.getElementById('sofaNavn'), v = inp ? inp.value.trim() : '';
      if (!v) return;
      inp.value = ''; gjorAlltid({ handling: 'sofa-ny', navn: v });
      setTimeout(function () { var i2 = document.getElementById('sofaNavn'); if (i2) i2.focus({ preventScroll: true }); }, 60);
    });
    var ts = document.getElementById('tsSkjema');
    if (ts) ts.addEventListener('submit', function (e) {
      e.preventDefault();
      var p = [0, 1, 2].map(function (i) { return document.getElementById('tsR' + i).value.trim(); });
      var l = ts.querySelector('input[name=tsL]:checked');
      if (p.some(function (x) { return !x; }) || !l) return toast(T('Skriv tre påstander og merk løgnen.', 'Write three statements and mark the lie.'));
      gjor({ handling: 'pastander', p: p, logn: Number(l.value) });
    });
    var sk = document.getElementById('rfSkjema');
    if (sk) sk.addEventListener('submit', function (e) {
      e.preventDefault();
      var i = document.getElementById('rfInput'), t = i.value.trim(); if (!t) return;
      i.value = ''; i.focus({ preventScroll: true });
      sdNyeStartere();
      gjorAlltid({ handling: 'skriv', tekst: t, til: sdTil });
    });
    var sdFelt = document.getElementById('rfInput');
    if (sdFelt && sdFelt.tagName === 'TEXTAREA') sdFelt.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); var f = document.getElementById('rfSkjema'); if (f && f.requestSubmit) f.requestSubmit(); }
    });
  }

  /* ---------- stua: alle i rommet som tegnede figurer ----------
     Den samme stua står på alle telefonene og på TV-en. Nye spillere går inn døra, alle kan dras rundt,
     og plasseringen lagres på serveren så alle ser det samme. Flytter du de andre for ofte, må du ta en slurk.
     Elementet lever på tvers av tegningene (root tegnes på nytt hele tiden), og flyttes inn i plassholderen. */
  var stuaHendSett = null, stuaPallVist = false;
  var stuaEl = null, stua = null, stuaVentTegn = false, stuaStraffSett = null, stuaVarslet = 0, stuaDrarFra = 0;
  var stuaVis = 'inne', stuaJegUte = false, stuaBytt = false;
  document.addEventListener('pointerdown', function (e) { if (e.target.closest && e.target.closest('.rom-stua .figur')) stuaDrarFra = Date.now(); }, true);
  function stuaKort(s) {
    if (!s) return '';
    if (s.kort) return s.kort.regel ? s.kort.regel + (s.kort.t ? ': ' + s.kort.t : '') : (s.kort.t || '');
    if (s.tekst && typeof s.tekst === 'string') return s.tekst;
    if (s.oppgave) return s.oppgave;
    if (s.q) return s.q;
    if (s.kortet) return s.kortet;
    return '';
  }
  /* Stua blir stående i siden mens resten tegnes om rundt den. Ellers starter alt som beveger seg der
     (diskolys, lyslenke, figurer som danser) på nytt hver gang noen trykker på noe. */
  var STUA_PLASS = '<div class="rom-stua-plass" id="romStuaPlass"></div>';
  function settRot(html) {
    var plassEl = document.getElementById('romStuaPlass'), i = html.indexOf(STUA_PLASS);
    if (!plassEl || plassEl.parentNode !== root || i === -1 || !stuaEl || stuaEl.parentNode !== plassEl) { root.innerHTML = html; return; }
    Array.prototype.slice.call(root.childNodes).forEach(function (n) { if (n !== plassEl) root.removeChild(n); });
    plassEl.insertAdjacentHTML('beforebegin', html.slice(0, i));
    plassEl.insertAdjacentHTML('afterend', html.slice(i + STUA_PLASS.length));
  }
  var stuaGjemEl = null;
  /** Stedet stua ligger når den ikke synes (under leken på mobil). Skjult, så ingen animasjoner tegnes. */
  function stuaGjem() { if (!stuaGjemEl) { stuaGjemEl = document.createElement('div'); stuaGjemEl.hidden = true; document.body.appendChild(stuaGjemEl); } return stuaGjemEl; }
  function tegnStua(s) {
    if (!meg) return;
    var iArk = !!(aapentArk && aapentArk.stua), plass = iArk ? aapentArk.el.querySelector('.ark-kropp') : root.querySelector('#romStuaPlass');
    if (!plass) { if (stuaEl && stuaEl.parentNode !== stuaGjem()) stuaGjem().appendChild(stuaEl); if (aapentArk) aapentArk.oppdater(); return; }
    if (!stuaEl) {
      stuaEl = document.createElement('div'); stuaEl.className = 'rom-stua';
      stuaEl.innerHTML = '<svg role="img" aria-label="' + T('Stua: alle i rommet som tegnede figurer. Trykk på gulvet for å gå dit, dra i folka for å flytte dem.', 'The living room: everyone in the room as drawn figures. Tap the floor to walk there, drag people to move them.') + '"></svg>' +
        '<span class="rom-stua-hint" aria-hidden="true">' + T('Trykk for å gå', 'Tap to walk') + '</span>';
      stua = lagStua(stuaEl.querySelector('svg'), {
        lang: EN ? 'en' : 'no', navn: true, vandre: true, meg: meg.id,
        onSlipp: function (id, x, y) { gjorAlltid({ handling: 'stua-flytt', hvem: id, x: x, y: y }); },
        onFerdig: function () { if (stuaVentTegn) { stuaVentTegn = false; tegn(); } },
        // Trykk på deg selv: figuren gjør «din» bevegelse (vink er gratis). Arket åpnes fra lenka under stua.
        onTrykk: function (id) { if (id === meg.id) { var b = (megSpiller().pynt || {}).beveg || 'vink'; gjorAlltid({ handling: 'beveg', b: b }); } },
        onDor: dorArk,
      });
      stuaEl.appendChild(Object.assign(document.createElement('p'), { className: 'rom-stua-tips' }));
    }
    stuaEl.querySelector('.rom-stua-tips').innerHTML = (erVert() ? '<button type="button" class="linkbtn" data-g="rom-ark">' + T('Rommet', 'The room') + '</button>' : '') +
      '<button type="button" class="linkbtn" data-g="figur-ark">' + T('Figuren din', 'Your figure') + '</button>' +
      '<button type="button" class="linkbtn" data-g="si-aapne">💬 ' + T('Si noe', 'Say something') + '</button>';
    if (stuaEl.parentNode !== plass) plass.appendChild(stuaEl);
    stuaEl.classList.toggle('kompakt', !!s && !iArk);
    var st = tilstand.stua || {}, ute = st.ute || [], jegUte = ute.indexOf(meg.id) !== -1, alle = (tilstand.spillere || []).concat(st.sofa || []);
    // Går du ut eller inn, følger skjermen deg
    if (jegUte !== stuaJegUte) { stuaJegUte = jegUte; stuaVis = jegUte ? 'ute' : 'inne'; }
    if (stuaVis === 'ute' && !ute.length) stuaVis = 'inne';
    stua.scene(stuaVis === 'ute');
    stuaEl.classList.toggle('ute', stuaVis === 'ute');
    stua.tema(st.tema || 'stue');
    stua.stil({ gulv: st.gulv, lys: st.lys });
    var her = alle.filter(function (p) { return (ute.indexOf(p.id) !== -1) === (stuaVis === 'ute'); });
    if (stuaBytt) { stuaBytt = false; stua.bytt(her, st.pos); } else stua.settFolk(her, st.pos);
    stua.ekstra(st.ekstra || []);
    var fan = stuaEl.querySelector('.stua-faner');
    if (ute.length || tilstand.pluss) {
      if (!fan) { fan = document.createElement('div'); fan.className = 'stua-faner'; stuaEl.insertBefore(fan, stuaEl.firstChild); }
      fan.innerHTML = '<button type="button" data-g="stua-vis" data-v="inne" aria-pressed="' + (stuaVis === 'inne') + '">' + T('Inne', 'In') + ' <small>' + (alle.length - ute.length) + '</small></button>' +
        '<button type="button" data-g="stua-vis" data-v="ute" aria-pressed="' + (stuaVis === 'ute') + '">' + T('Ute', 'Out') + ' <small>' + ute.length + '</small></button>';
    } else if (fan) fan.remove();
    hentHusketRom();
    if (aapentArk) aapentArk.oppdater();
    synkAnimasjoner(stuaEl);
    var kt = stuaKort(s);
    if (kt) stua.tv(kt, s.navn); else stua.kode(kode);
    // Det som skjer i spillet, vises på figurene: slurker, bomba, hvem som vant
    var hn = tilstand.stuaHend;
    if (hn) { if (stuaHendSett === null) stuaHendSett = hn.nr; else if (hn.nr > stuaHendSett) { stuaHendSett = hn.nr; stua.hendelse(hn.type, hn.ider); } }
    // Kvelden er over: pallen
    if (tilstand.ferdig && tilstand.kaaringer && !stuaPallVist) { stuaPallVist = true; var kv = tilstand.kaaringer.find(function (k) { return k.kode === 'vinner'; }) || tilstand.kaaringer.find(function (k) { return k.kode === 'slapp'; }), kt = tilstand.kaaringer.find(function (k) { return k.kode === 'torst'; }); if (kv) stua.pall(kv.id, kt && kt.id !== kv.id ? kt.id : null); }
    if (!tilstand.ferdig) stuaPallVist = false;
    // Påskeegget: noen plaget de andre for mye og må ta en slurk – vises på alle skjermer
    var nr = st.straff ? st.straff.nr : 0;
    if (stuaStraffSett === null) stuaStraffSett = nr;
    else if (nr > stuaStraffSett) { stuaStraffSett = nr; stua.straff(st.straff.hvem, tilstand.alkoholfri ? T('Straffepoeng!', 'Penalty!') : T('Skål da …', 'Fine, cheers …')); }
    // Et lite hint før det smeller
    if (st.plager >= (st.grense || 6) - 2 && st.plager > stuaVarslet) { stuaVarslet = st.plager; toast(T('Rolig nå! Flytter du de andre ' + ((st.grense || 6) - st.plager) + ' ganger til, må du ta en slurk.', 'Easy! Move the others ' + ((st.grense || 6) - st.plager) + ' more times and you drink.')); }
    if (!st.plager) stuaVarslet = 0;
  }

  root.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('.bs-side [data-b], .bs-hurtig [data-b]')) borsKlikk(e); });
  root.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('[data-lov-login]')) { try { sessionStorage.setItem('bd_etter_innlogging', location.pathname + location.search); } catch (x) {} } });
  /* ---------- nytt kort: det gamle kastes ut, det nye «deles ut» ----------
     Alle telefonene får samme kort samtidig. En kjapp bevegelse (et kvart sekund) gjør at alle
     ser at noe nytt kom – også den som så bort – og telefonen føles som en kortstokk. */
  var sistKortNokkel = '', tegnetFor = false;   // første tegning (f.eks. etter oppdatering av siden) skal ikke animeres
  var spillInnFra = 0;   // når en ny lek kom inn på skjermen – inngangen skal overleve neste tegning
  function roligBevegelse() { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } }
  function kortNokkel(s) {
    if (!s || s.ring) return '';   // ringen i Ring of Fire har sin egen dra-bevegelse
    var k = s.kort ? (s.kort.t ? (s.kort.t.no || s.kort.t) : String(s.kort.v || '') + (s.kort.s || '')) : '';
    return [s.type, s.lek, s.pos, k, s.tekst, s.fase, s.runde, s.i].join('|');
  }
  function delUtKort(gammelt, rekt) {
    var inn = root.querySelector('.rom-kort, .rof-kort.rom-rof, .rom-sporsmal, .rom-hemmelig');
    if (inn) { inn.classList.add('kort-inn'); inn.addEventListener('animationend', function () { inn.classList.remove('kort-inn'); }, { once: true }); }
    if (!gammelt || !rekt || rekt.bottom < 0 || rekt.top > innerHeight) return;
    var klon = gammelt.cloneNode(true);
    klon.classList.add('kort-ut'); klon.setAttribute('aria-hidden', 'true');
    klon.style.cssText = 'position:fixed;left:' + rekt.left + 'px;top:' + rekt.top + 'px;width:' + rekt.width + 'px;height:' + rekt.height + 'px;margin:0;z-index:60;pointer-events:none';
    document.body.appendChild(klon);
    setTimeout(function () { klon.remove(); }, 450);
  }
  /** Ny lek: la leken tone inn. Kommer det en ny tegning midt i, fortsetter den der den var. */
  function spillInn() {
    var gaatt = Date.now() - spillInnFra, el = root.querySelector('.rom-spill');
    if (!el || gaatt >= 300) return;
    el.style.animationDelay = -gaatt + 'ms';
    el.classList.add('spill-inn');
    el.addEventListener('animationend', function (e) { if (e.target === el) { el.classList.remove('spill-inn'); el.style.animationDelay = ''; } });
  }

  /* ---------- «Trykk igjen»: det som ikke kan angres, krever to rolige trykk ----------
     Et glass i den ene hånda og et bord som rister: ett bomtrykk skal ikke kaste noen ut av rommet.
     Første trykk gjør knappen om til «Trykk igjen …» i fire sekunder. Andre trykk må komme etter
     minst 0,4 s, så et utilsiktet dobbelttrykk ikke teller som to. Tilstanden overlever at rommet
     tegnes på nytt (det skjer hele tiden når de andre trykker). */
  var trinn = { nokkel: '', t: 0, tekst: '', timer: null };
  function trinnNokkel(b) { return (b.dataset.g || '') + ':' + (b.dataset.id || b.dataset.i || ''); }
  function visTrinn(b) {
    if (!b || b.classList.contains('to-trinn')) return;
    b.dataset.foer = b.innerHTML;
    b.classList.add('to-trinn');
    (b.querySelector('b') || b).textContent = trinn.tekst;
  }
  function nullTrinn() {
    clearTimeout(trinn.timer); trinn.nokkel = '';
    root.querySelectorAll('.to-trinn').forEach(function (el) { el.classList.remove('to-trinn'); if (el.dataset.foer != null) { el.innerHTML = el.dataset.foer; delete el.dataset.foer; } });
  }
  function trinnEtterTegning() {
    if (!trinn.nokkel) return;
    var del = trinn.nokkel.split(':'), g = del[0], id = del.slice(1).join(':');
    var el = Array.prototype.find.call(root.querySelectorAll('[data-g="' + g + '"]'), function (x) { return (x.dataset.id || x.dataset.i || '') === id; });
    if (el) visTrinn(el); else nullTrinn();
  }
  function bekreftet(b, tekst) {
    var k = trinnNokkel(b), naa = Date.now();
    if (trinn.nokkel === k) { if (naa - trinn.t < 400) return false; nullTrinn(); return true; }
    nullTrinn();
    trinn.nokkel = k; trinn.t = naa; trinn.tekst = tekst; visTrinn(b);
    trinn.timer = setTimeout(nullTrinn, 4000);
    try { navigator.vibrate && navigator.vibrate(25); } catch (x) {}
    return false;
  }
  function farligTekst(g, b) {
    if (g === 'fjern') return T('Fjern?', 'Remove?');
    if (g === 'forlat') return tilstand && tilstand.venter === true ? '' : T('Trykk igjen for å gå ut', 'Tap again to leave');
    if (g === 'avslutt') return T('Trykk igjen – avslutt leken', 'Tap again – end the game');
    if (g === 'nytt-brett') return T('Nytt brett? Trykk igjen', 'New board? Tap again');
    if (g === 'nullstill') return T('Trykk igjen – nullstill tavla', 'Tap again – reset the scores');
    if (g === 'avslutt-kvelden') return T('Trykk igjen – avslutt kvelden', 'Tap again – end the night');
    if (g === 'lov-opphev') return T('Trykk igjen – opphev', 'Tap again – repeal');
    if (g === 'lov-ingen') return T('Trykk igjen – ingen endring', 'Tap again – no change');
    return '';
  }
  // Dobbelttrykk-sperre: kommer det et nytt kort eller en ny runde, teller ikke trykk på den store
  // knappen det første 0,7 sekundet – ellers hopper et dobbelttrykk over kortet ingen rakk å lese.
  var sistInnhold = '', sperreTil = 0;
  function merkNyttInnhold(s) {
    var k = s ? [s.type, s.lek, s.pos, s.fase, s.runde, s.i, s.kast, s.tur, s.aldri ? s.aldri.fase : '', s.ee ? s.ee.fase : '', s.rr ? s.rr.fase : '', s.ns ? s.ns.fase : '', s.kb ? s.kb.fase : '', s.lb ? s.lb.fase + s.lb.nr : '', s.ferdig ? 'f' : ''].join('|') : 'ingen';
    if (k !== sistInnhold) { if (sistInnhold) sperreTil = Date.now() + 700; sistInnhold = k; }
  }

  function romKlikk(e) {
    var b = e.target.closest('[data-g]');
    if (trinn.nokkel && (!b || trinnNokkel(b) !== trinn.nokkel)) nullTrinn();
    if (!b || !tilstand) return;
    var g = b.dataset.g;
    if (g === 'stua-ark') return stuaArk();
    if (g === 'mer-ark') return merArk();
    if (g === 'app-uke') return ukeArk();
    if (g === 'app-rof') return rofStartArk();
    if (g === 'lek-info') return lekInfoArk(b.dataset.lek);
    if (g === 'si-aapne') return siArk();
    if (g === 'velger') { try { document.dispatchEvent(new CustomEvent('mv-velger', { detail: lekerForVelger() })); } catch (x) {} return; }
    if (b.classList.contains('rom-stor-knapp') && Date.now() < sperreTil) return;
    var farlig = farligTekst(g, b);
    if (farlig && !bekreftet(b, farlig)) return;
    if (g === 'del') {
      var url = (window.__MV_ORIGIN || location.origin) + RUTE.rom + '?k=' + kode;
      var tekst = T('Bli med på mittvors! Kode: ', 'Join me on mittvors! Code: ') + kode;
      // Swift-skallet: iPhonens eget delingsark (AirDrop til telefonene ved siden av, Meldinger, Snap …)
      if (harSkall()) { try { document.dispatchEvent(new CustomEvent('mv-del', { detail: { tekst: tekst, url: url } })); } catch (x) {} return; }
      if (window.BDDel) return window.BDDel.lenke(url, tekst, { tittel: T('Inviter til rommet', 'Invite to the room'), ingress: T('Romkode: ', 'Room code: ') + kode });
      if (navigator.share) navigator.share({ title: 'mittvors', text: tekst, url: url }).catch(function () {});
      else if (navigator.clipboard) navigator.clipboard.writeText(tekst + '\n' + url).then(function () { toast(T('Lenken er kopiert', 'Link copied')); });
      return;
    }
    if (g === 'tavle') return aapneTavle();
    if (g === 'hjul-aapne') return aapneHjul();
    if (g === 'pluss-tilbud') return visPlussTilbud();
    if (g === 'op-aapne') return aapneOppdrag();
    if (g === 'bs-aapne') return aapneBors();
    if (g === 'bs-fokus') return gjor({ handling: 'bs-fokus', paa: true });
    if (g === 'bs-start') return borsStartValg();
    if (g === 'op-paa' || g === 'op-av') return gjor({ handling: g });
    if (g === 'mester-paa' || g === 'mester-bytt' || g === 'mester-av') return gjor({ handling: g });
    if (g === 'vann-naa') return gjor({ handling: 'vann-naa' });
    if (g === 'vann-auto') return gjor({ handling: tilstand.vannAv ? 'vann-paa' : 'vann-av' });
    if (g === 'hs-stem') return gjor({ handling: 'hs-stem', hvem: b.dataset.paa });
    if (g === 'hs-endre') { hsEndre = true; tegn(); var hi = document.getElementById('sosInput'); if (hi) hi.focus(); return; }
    if (g === 'sm-slaa-modus') { smSlaa = smSlaa ? null : { valgt: null }; return tegn(); }
    if (g === 'sm-kort') {
      if (!smSlaa) return;
      var ix = Number(b.dataset.i);
      if (smSlaa.valgt == null || smSlaa.valgt === ix) { smSlaa.valgt = smSlaa.valgt === ix ? null : ix; return tegn(); }
      var fraI = smSlaa.valgt; smSlaa = null; return gjor({ handling: 'sm-slaa', fra: fraI, til: ix });
    }
    if (g === 'sp-stem') return gjor({ handling: 'sp-stem', hvem: b.dataset.paa });
    if (g === 'sp-gjett') return gjor({ handling: 'sp-gjett', sted: b.dataset.sted });
    if (g === 'bf-stem') return gjor({ handling: 'bf-stem', i: Number(b.dataset.i) });
    if (g === 'pk-forslag') { pkForslag = pkTrekkForslag(); return tegn(); }
    if (g === 'pk-fyll') { var inp = document.getElementById('sosInput'); if (inp) { inp.value = b.dataset.t; pkValgtForslag = b.dataset.t; pkKat = b.dataset.k || ''; inp.focus(); } return; }
    if (g === 'pk-sporsmal') return pkSporsmalArk();
    if (g === 'pk-riktig') return gjor({ handling: 'pk-riktig', hvem: b.dataset.paa });
    if (g === 'pk-angre') return gjor({ handling: 'pk-angre', hvem: b.dataset.paa });
    if (g === 'sp-stem') return gjor({ handling: 'sp-stem', hvem: b.dataset.paa });
    if (g === 'sp-gjett') return gjor({ handling: 'sp-gjett', ord: b.dataset.ord });
    if (g === 'sp-stem-start' || g === 'sp-tell') return gjor({ handling: g });
    if (g === 'sk-trykk') {
      var tidlig = !skalVist, ms = skalVist ? Math.round(performance.now() - skalVist) : null, skSp = tilstand.spill;
      if (skSp) skalMitt[skSp.tid] = { tidlig: tidlig, ms: ms };
      b.disabled = true; b.classList.add(tidlig ? 'tidlig' : 'trykket');
      var skT = b.querySelector('.sk-tall'); if (skT) skT.textContent = tidlig ? T('Drikk 2', 'Drink 2') : ms + ' ms';
      return gjorAlltid({ handling: 'sk-trykk', tidlig: tidlig, ms: ms });
    }
    if (g === 'hs-neste') return gjor({ handling: g, i: Number(b.dataset.i) });
    if (['sp-til-stemming', 'pk-avslutt'].indexOf(g) !== -1) return gjor({ handling: g });
    if (g === 'hopp-over') return gjor({ handling: 'hopp-over' });
    if (g === 'lov-del') return delLov();
    if (g === 'lov-opphev') return gjor({ handling: 'lov-valg', type: 'opphev', regel: b.dataset.id });
    if (g === 'lov-ingen') return gjor({ handling: 'lov-valg', type: 'ingen' });
    if (g === 'plan-start') return startPlan();
    if (g === 'kv-vinner') return gjor({ handling: 'kv-vinner', hvem: b.dataset.id || null });
    if (g === 'slipp-inn' || g === 'avvis-inn') return gjor({ handling: g, hvem: b.dataset.id, som: b.dataset.som || 'gjest' });
    if (g === 'lov-bli') { gjengSjekket = true; return api('POST', '/api/rom/' + kode, { handling: 'gjeng-meg', bli: true, id: meg.id, pollett: meg.pollett }).then(function (d) { gjengSjekk = ''; ta(d); toast(T('Velkommen i gjengen! 🤝', 'Welcome to the crew! 🤝')); }).catch(function (e) { toast(e.message); }); }
    if (g === 'qr') {
      var m = document.createElement('div'); m.className = 'rom-qrmodal'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-label', T('QR-kode', 'QR code'));
      m.innerHTML = qrBoks(true) + '<button class="btn gold" type="button">' + T('Lukk', 'Close') + '</button>';
      m.addEventListener('click', function () { m.remove(); });
      document.body.appendChild(m); return;
    }
    if (g === 'forlat') { glemRom(); settAdresse(''); kode = ''; tegnStart(); return; }
    if (g === 'app-mer') { appMer = true; tegn(); window.scrollTo({ top: 0 }); return; }
    if (g === 'app-tilbake') { appMer = false; tegn(); window.scrollTo({ top: 0 }); return; }
    if (g === 'start') {
      appMer = false;
      var lekInfo = (tilstand.leker || []).find(function (x) { return x.id === b.dataset.lek; });
      if (lekInfo && lekInfo.pluss && !tilstand.pluss) return visPlussTilbud();
      return gjor({ handling: 'start', lek: b.dataset.lek, modus: b.dataset.modus });
    }
    if (g === 'egen') {
      var st = egenListe()[Number(b.dataset.i)]; if (!st) return;
      var klar = les('bd_stokk_rom'); if (klar && klar.navn === st.navn) { try { localStorage.removeItem('bd_stokk_rom'); } catch (x) {} }
      return gjor({ handling: 'start', lek: 'egen', navn: st.navn, kort: st.kort });
    }
    if (g === 'lagrestokk') return lagreSomStokk();
    if (g === 'rf-til') { sdTil = b.dataset.til; var fe = document.getElementById('rfInput'); document.querySelectorAll('[data-g="rf-til"]').forEach(function (x) { x.setAttribute('aria-pressed', x.dataset.til === sdTil); }); if (fe) fe.placeholder = sdPlass(); return; }
    if (g === 'rf-starter') { var ft = document.getElementById('rfInput'); if (ft) { ft.value = b.dataset.t.replace(/\s*…\s*$/, ' '); ft.focus(); ft.setSelectionRange(ft.value.length, ft.value.length); } return; }
    if (g === 'rf-kast') return gjor({ handling: 'rf-kast' });
    if (g === 'rf-kast-stem') return gjorAlltid({ handling: 'rf-kast-stem', ja: b.dataset.ja === '1' });
    if (g === 'rf-kast-avbryt') return gjor({ handling: 'rf-kast-avbryt' });
    if (g === 'rf-igjen') return gjor({ handling: 'rf-igjen' });
    if (g === 'rf-velg') {
      if (!window.BDVelgKort) return;
      return window.BDVelgKort({ maks: 60 }).then(function (kort) {
        if (kort.length) { gjorAlltid({ handling: 'rf-legg-til', kort: kort }); toast(kort.length + T(' kort er lagt i bunken din', ' cards added to your pile')); }
      });
    }
    if (g === 'rf-lagre-mine') {
      var sp = tilstand.spill, d = new Date(), nv = T('Mine kort ' + d.getDate() + '.' + (d.getMonth() + 1) + '.', 'My cards ' + d.getDate() + '/' + (d.getMonth() + 1));
      return window.BDLagreKort(nv, sp.mineKort || []).then(function (r) {
        toast(r === 'lagret' ? T('Kortene dine er lagret på kontoen ✓', 'Your cards are saved to your account ✓') : T('Kortene er lagt til side. Logg inn på Profil for å lagre dem.', 'The cards are set aside. Log in under Profiles to save them.'));
      }).catch(function (e) { toast(e.message || T('Fikk ikke lagret.', 'Couldn\'t save.')); });
    }
    if (g === 'del-kveld') return delKveld();
    if (g === 'alkoholfri') return gjorAlltid({ handling: 'alkoholfri', paa: !tilstand.alkoholfri });
    if (g === 'gjeng-av') return gjorAlltid({ handling: 'gjeng', gjengId: '' });
    if (g === 'skjerm') {
      visSkjerm = true;
      var tilSkjerm = function () { setTimeout(function () { var e = document.querySelector('.rom-skjerm'); if (e) e.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 120); };
      if (!tilstand.skjermPin) { gjor({ handling: 'skjerm-lag' }); setTimeout(tilSkjerm, 700); return; }
      tegn(); return tilSkjerm();
    }
    if (g === 'skjerm-ny') return gjor({ handling: 'skjerm-lag', ny: true });
    if (g === 'skjerm-lukk') { visSkjerm = false; return tegn(); }
    if (g === 'skjerm-del') {
      var sl = skjermLenke();
      if (navigator.share) { navigator.share({ title: T('mittvors – storskjerm', 'mittvors – big screen'), url: sl }).catch(function () {}); return; }
      try { navigator.clipboard.writeText(sl); toast(T('Lenken er kopiert ✓', 'Link copied ✓')); } catch (e) { prompt(T('Kopier lenken:', 'Copy the link:'), sl); }
      return;
    }
    if (g === 'avslutt-kvelden' || g === 'fortsett-kvelden') return gjor({ handling: g });
    if (g === 'velg-annen') { visAlle = true; if (erVert()) gjor({ handling: 'velg-annen' }); return tegn(); }
    if (g === 'lyd') { lyd.paa = !lyd.paa; skriv('bd_lyd', lyd.paa); if (lyd.paa) { lydCtx(); spillLyd('tur'); } return tegn(); }
    if (g === 'reak-mer') { reakMer = !reakMer; return tegn(); }
    if (g === 'reager') { if (!les('bd_intro_reak')) { skriv('bd_intro_reak', 1); var hh = document.querySelector('.reak-hint'); if (hh) hh.remove(); } return gjorAlltid({ handling: 'reager', e: b.dataset.e }); }
    if (g === 'intro-lukk') { skriv(b.dataset.k, 1); return tegn(); }
    if (g === 'stua-vis') { if (stuaVis !== b.dataset.v) { stuaVis = b.dataset.v; stuaBytt = true; tegn(); } return; }
    if (g === 'bg-hjelp') { var om = b.closest('.rom-bg-rad').querySelector('.rom-bg-om'); om.hidden = !om.hidden; b.setAttribute('aria-expanded', String(!om.hidden)); return; }
    if (g === 'send-velg' || g === 'del-ut') return delUtArk();
    if (g === 'aldri-svar') { if (b.getAttribute('aria-pressed') === 'true') return; gjorAlltid({ handling: 'aldri-svar', v: b.dataset.v }); return; }
    if (g === 'aldri-nekt') return gjor({ handling: 'aldri-nekt' });
    if (g === 'ee-velg') { if (b.getAttribute('aria-pressed') === 'true') return; spillLyd('pop'); gjorAlltid({ handling: 'ee-velg', v: b.dataset.v }); return; }
    if (g === 'ee-med') { eeVelgMed = true; return tegn(); }
    if (g === 'lb-gjett' || g === 'lb-stem') { if (b.getAttribute('aria-pressed') === 'true') return; spillLyd('pop'); gjorAlltid({ handling: g, v: b.dataset.paa }); return; }
    if (g === 'lb-neste') { spillLyd('pop'); gjorAlltid({ handling: 'lb-neste', nr: Number(b.dataset.nr) }); return; }
    if (g === 'pk-variant') { pkMobil = b.dataset.v === 'mobil'; try { localStorage.setItem('bd_pk_mobil', pkMobil ? '1' : '0'); } catch (e) {} spillLyd('pop'); return tegn(); }
    if (g === 'kb-send') { spillLyd('pop'); gjorAlltid({ handling: 'kb-send', fra: b.dataset.fra }); return; }
    if (g === 'kb-protest') { spillLyd('womp'); gjorAlltid({ handling: 'kb-protest' }); return; }
    if (g === 'ns-velg' || g === 'ns-stem') { if (b.getAttribute('aria-pressed') === 'true') return; spillLyd('pop'); gjorAlltid({ handling: g, v: b.dataset.v }); return; }
    if (g === 'ns-ferdig' || g === 'ns-feig') { spillLyd('pop'); gjorAlltid({ handling: g }); return; }
    if (g === 'rr-pek' || g === 'rr-gjett') { if (b.getAttribute('aria-pressed') === 'true') return; spillLyd('pop'); gjorAlltid({ handling: g, v: b.dataset.v }); return; }
    if (g === 'ee-forsvar') return gjor({ handling: 'ee-forsvar', med: b.dataset.med || null });
    if (g === 'aldri-igjen' || g === 'kort-igjen') { var lekId = tilstand.spill ? tilstand.spill.lek : ''; return gjor({ handling: 'kort-igjen', sett: (settListe()[lekId] || []).slice(-1500) }); }
    if (g === 'aldri-modus') return gjorAlltid({ handling: 'aldri-modus', paa: b.dataset.paa === '1' });
    if (g === 'br-svar') return gjor({ handling: 'br-svar', v: b.dataset.v });
    if (g === 'br-snu') return gjor({ handling: 'br-snu', pos: Number(b.dataset.pos) });
    if (g === 'yz-hold') return gjor({ handling: 'yz-hold', i: Number(b.dataset.i) });
    if (g === 'yz-felt') return gjor({ handling: 'yz-felt', f: b.dataset.f });
    if (g === 'yz-stryk') return gjor({ handling: 'yz-stryk' });
    if (g === 'py-modus') { pyVelg = !pyVelg; return tegn(); }
    if (g === 'py-velg') {
      if (!pyVelg) return;
      var pyI = Number(b.dataset.i); b.classList.add('flyr'); pyVelg = false;
      return setTimeout(function () { gjor({ handling: 'py-legg', i: pyI }); }, 420);
    }
    if (g === 'nr-svar') return gjorAlltid({ handling: 'nr-svar', v: b.dataset.v });
    if (g === 'nr-flipp') return gjor({ handling: 'nr-flipp', hvem: b.dataset.id });
    if (g === 'nr-lengde') return gjor({ handling: 'nr-lengde', antall: Number(b.dataset.n) });
    if (g === 'nr-nytt') return gjor({ handling: 'nytt', antall: Number(b.dataset.n) });
    if (g === 'yz-kast') spillLyd('terning');
    if (['br-buss', 'br-kjor', 'yz-kast', 'nr-vis', 'nr-neste', 'nr-start'].indexOf(g) !== -1) return gjor({ handling: g });
    if (g === 'neste') return gjor({ handling: 'neste', pos: Number(b.dataset.pos) });
    if (g === 'rof-makker') return gjor({ handling: 'rof-makker', paa: b.dataset.paa });
    if (g === 'rof-for') { rofFor = tilstand.spill ? tilstand.spill.nr : -1; return tegn(); }
    if (g === 'rof-regler') return rofReglerArk();
    if (g === 'stem') {
      var sp0 = tilstand && tilstand.spill;
      if (sp0 && sp0.type === 'forraeder') return gjor({ handling: 'stem', paa: b.dataset.paa, sikker: sp0.minStemme ? !!sp0.minSikker : lhSikker.v });
      return gjor({ handling: 'stem', paa: b.dataset.paa });
    }
    if (g === 'lh-sikker') {
      var sp1 = tilstand.spill;
      if (sp1.minStemme) return gjorAlltid({ handling: 'stem', paa: sp1.minStemme, sikker: !sp1.minSikker });
      lhSikker.v = !lhSikker.v; return tegn();
    }
    if (g === 'lh-bytt') return gjor({ handling: 'lh-bytt' });
    if (g === 'lh-grill') { lhGrillI++; return tegn(); }
    if (g === 'pek-start') return gjor({ handling: 'pek-start' });
    if (g === 'pek-fingre') return gjorAlltid({ handling: 'pek-fingre', n: Number(b.dataset.n) });
    if (g === 'pek-selv') return gjor({ handling: 'pek-selv' });
    if (g === 'pek-tell-ferdig') return gjor({ handling: 'pek-tell-ferdig' });
    if (g === 'pek-forsvar') return gjor({ handling: 'pek-forsvar', slapp: b.dataset.slapp === '1' });
    if (g === 'lh-ide') { var ide = document.getElementById('lhIde'); if (ide) { ide.textContent = lhIde(); ide.hidden = false; ide.classList.remove('inn'); void ide.offsetWidth; ide.classList.add('inn'); } return; }
    if (g === 'merk') return gjor({ handling: 'merk', i: Number(b.dataset.i) });
    if (g === 'sofa-start') { try { localStorage.setItem(sofaNokkel(), '1'); } catch (e) {} return tegn(); }
    if (g === 'sofa-vent') { aleneLukket = Infinity; try { sessionStorage.setItem('bd_alene_vent_' + kode, '1'); } catch (e) {} return tegn(); }
    if (g === 'sofa-av') { try { localStorage.removeItem(sofaNokkel()); } catch (e) {} aleneFra = Date.now(); return tegn(); }
    if (g === 'sofa-fane') { sofaFane = b.dataset.v === 'leser' ? 'leser' : 'rundt'; return tegn(); }
    if (g === 'sofa-fjern') return gjor({ handling: 'sofa-fjern', hvem: b.dataset.paa });
    if (g === 'en-start') return gjor({ handling: 'en-start', lek: b.dataset.lek });
    if (g === 'ftd-gjett') return gjor({ handling: 'ftd-gjett', v: Number(b.dataset.v) });
    if (g === 'ftd-neste') return gjor({ handling: 'ftd-neste' });
    if (g === 'en-tell') return enNedtelling(enTell.k);
    if (g === 'en-bombe-start') return enBombeStart(enBombe.k);
    if (g === 'en-bombe-send') { enBombe.holder++; return tegn(); }
    if (g === 'en-bom-neste') { enBombe.fase = 'klar'; return gjor({ handling: 'en-neste', har: [b.dataset.paa], n: 2 }); }
    if (g === 'en-neste') { enTell.t.forEach(clearTimeout); return gjor({ handling: 'en-neste' }); }
    if (g === 'ou-gjett') return gjor({ handling: 'gjett', paa: b.dataset.paa });
    if (g === 'ou-hopp') return gjor({ handling: 'ou-hopp' });
    if (g === 'vl-vedd') return gjorAlltid({ handling: 'vedd', farge: b.dataset.farge, slurker: vlSats });
    if (g === 'vl-sats') {
      vlSats = Math.max(1, Math.min(10, vlSats + Number(b.dataset.d)));
      var vs0 = tilstand.spill && tilstand.spill.mittVeddemaal;
      if (vs0) return gjorAlltid({ handling: 'vedd', farge: vs0.farge, slurker: vlSats });
      return tegn();
    }
    if (g === 'vl-start') return gjor({ handling: 'vl-start' });
    if (g === 'fjern') return gjor({ handling: 'fjern', hvem: b.dataset.id });
    if (g === 'gjett') return gjor({ handling: 'gjett', paa: b.dataset.paa });
    if (g === 'vedd') { var sl = document.getElementById('veddSl'); return gjor({ handling: 'vedd', farge: b.dataset.farge, slurker: sl ? Number(sl.value) : 2 }); }
    if (g === 'utfordre') return gjor({ handling: 'utfordre', paa: b.dataset.paa });
    if (g === 'velg') { spillLyd('kortlegg'); return gjor({ handling: 'velg', i: Number(b.dataset.i) }); }
    if (g === 'pvelg') { var i = Number(b.dataset.i), j = presValg.indexOf(i); if (j === -1) presValg.push(i); else presValg.splice(j, 1); return tegn(); }
    if (g === 'legg') { var valgte = presValg.slice(); presValg = []; return gjor({ handling: 'legg', kort: valgte }); }
    if (['kast', 'drop', 'lop', 'snu', 'nytt', 'pastand', 'nese', 'pass', 'stokk', 'startklokke'].indexOf(g) !== -1) return gjor({ handling: g });
    if (['avslutt', 'nullstill', 'svart', 'avslor', 'runde', 'nytt-brett'].indexOf(g) !== -1) return gjor({ handling: g });
  }
  root.addEventListener('click', romKlikk);
  // Arkene ligger utenfor rommet i dokumentet, men knappene i dem (stua, slurker, vertens knapper) gjør det samme
  document.addEventListener('click', function (e) {
    if (!e.target.closest || root.contains(e.target) || !e.target.closest('.stua-ark, .mer-ark, .uke-ark, .rof-start-ark, .info-ark')) return;
    if (e.target.closest('[data-g="figur-ark"]')) return figurArk();
    if (e.target.closest('[data-g="rom-ark"]')) { if (erVert()) romArk(); return; }
    if (e.target.closest('[data-g="si-aapne"]')) return siArk();
    if (e.target.closest('[data-g="start"]')) lukkArk();   // leken starter: arket skal bort
    romKlikk(e);
  });

  function nrSpilt() { var l = les('bd_nr_spilt'); return Array.isArray(l) ? l : []; }
  var nrUke = '';
  root.addEventListener('change', function (e) {
    if (e.target && e.target.dataset && 'nrUke' in e.target.dataset) { nrUke = e.target.value; var sk = root.querySelector('.rom-stor-knapp[data-lek="nyhetsrunden"]'); if (sk) sk.dataset.modus = nrUke; return; }
    if (e.target && e.target.dataset && 'nrArkiv' in e.target.dataset && e.target.value) return gjor({ handling: 'start', lek: 'nyhetsrunden', modus: e.target.value });
    if (e.target && e.target.id === 'romGjeng' && e.target.value) gjorAlltid({ handling: 'gjeng', gjengId: e.target.value });
  });

  /* ---------- oppstart ---------- */
  if (kode) meg = les('bd_rom_' + kode);
  if (kode && meg) {
    // Et skjelett av rommet mens det kobler til: koden står der med en gang, så man vet at man er på rett sted
    document.documentElement.classList.add('i-rom');
    meldSkjerm('rom');
    root.innerHTML = '<div class="rom-laster" aria-busy="true"><div class="rom-hode"><div class="rom-hode-v"><div><span class="rom-etikett">' + T('Rom', 'Room') + '</span><b class="rom-kode">' + esc(kode) + '</b></div></div>' +
      '<span class="rom-hodeknapper"><i></i><i></i><i></i><i></i></span></div><div class="skj-rad"><i></i><i></i><i></i></div><div class="skj-kort"></div>' +
      '<p class="rom-laster-tekst" role="status">' + T('Kobler til rom ', 'Connecting to room ') + esc(kode) + ' …</p></div>';
    hent();
  }
  else tegnStart();
}
