import { a as Fragment, d as renderTemplate, f as maybeRenderHead, h as defineScriptVars, i as renderComponent, m as addAttribute, w as createAstro } from "./server_Bjx7FWTN.mjs";
import { t as createComponent } from "./compiler_Bf6GLUpQ.mjs";
import { n as ui, t as $$Base } from "./Base_DV8X_pRs.mjs";
import { a as supabaseAnonKey, o as supabaseDebug, s as supabaseUrl } from "./config_DZEmFZJP.mjs";
//#region src/components/pages/Account.astro
createAstro("https://www.mittvors.no");
var $$Account = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$Account;
	const { lang = "en" } = Astro.props;
	const L = ui(lang);
	const SUPABASE_URL = supabaseUrl();
	const SUPABASE_ANON_KEY = supabaseAnonKey();
	const configured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
	const dbg = configured ? null : supabaseDebug();
	const no = lang === "no";
	const T = no ? {
		tabLogin: "Logg inn",
		tabNew: "Ny konto",
		tabLink: "E-postlenke",
		userOrEmail: "Brukernavn eller e-post",
		password: "Passord",
		login: "Logg inn",
		forgot: "Glemt passordet?",
		username: "Brukernavn",
		usernameHelp: "3–20 tegn. Vises for deg, aldri for andre.",
		newPw: "Passord (minst 8 tegn)",
		create: "Lag konto",
		linkLead: "Vil du slippe passord? Få en innloggingslenke på e-post.",
		forgotLead: "Skriv e-postadressen din, så sender vi en lenke for å velge nytt passord.",
		sendReset: "Send lenke",
		back: "Tilbake",
		resetSent: "Sjekk innboksen – lenken er på vei.",
		confirmSent: "Nesten ferdig! Sjekk innboksen og trykk på lenken for å bekrefte e-posten.",
		choosePw: "Velg nytt passord",
		savePw: "Lagre passord",
		pwSaved: "Passordet er endret ✓",
		pwShort: "Passordet må være minst 8 tegn.",
		fillAll: "Fyll ut alle feltene.",
		setUser: "Velg et brukernavn",
		setUserLead: "Da kan du logge inn med brukernavn og passord neste gang.",
		save: "Lagre",
		setPw: "Sett passord",
		setPwLead: "Logget inn med lenke? Sett et passord, så kan du logge inn med brukernavnet ditt.",
		decks: "Mine kortstokker",
		decksLead: "Lag egne drikkekort, og spill dem alene eller i et rom med vennene dine.",
		newDeck: "Ny kortstokk",
		deckName: "Navn",
		deckCards: "Kort – ett per linje",
		deckPh: "Alle med hvite sokker drikker\nDen yngste deler ut tre slurker",
		saveDeck: "Lagre kortstokk",
		play: "Spill",
		playRoom: "Spill i rom",
		edit: "Rediger",
		del: "Slett",
		cancel: "Avbryt",
		cards: "kort",
		noDecks: "Ingen kortstokker ennå. Lag en her, eller lagre kortene etter en runde Hjemmesnekra.",
		draft: "kort fra Hjemmesnekra er ikke lagret ennå.",
		saveDraft: "Lagre dem",
		delConfirm: "Trykk igjen for å slette",
		next: "Neste kort",
		close: "Lukk",
		of: "av",
		saved: "Lagret ✓",
		stats: "Statistikk",
		settings: "Konto",
		share: "Del",
		unshare: "Slutt å dele",
		shared: "delt",
		linkCopied: "Lenken er kopiert – send den til hvem du vil.",
		unshared: "Lenken virker ikke lenger.",
		changeUser: "Endre brukernavn",
		changeUserLead: "Du logger inn med det nye navnet fra nå av. Det gamle blir ledig for andre.",
		changePw: "Endre passord",
		deleteAcc: "Slett konto",
		deleteLead: "Sletter kontoen, brukernavnet, kortstokkene og replikkene dine for godt. Det kan ikke angres.",
		deleteType: "Skriv SLETT for å bekrefte",
		deleteBtn: "Slett kontoen min",
		deleted: "Kontoen er slettet."
	} : {
		tabLogin: "Sign in",
		tabNew: "New account",
		tabLink: "Email link",
		userOrEmail: "Username or email",
		password: "Password",
		login: "Sign in",
		forgot: "Forgot your password?",
		username: "Username",
		usernameHelp: "3–20 characters. Only shown to you.",
		newPw: "Password (at least 8 characters)",
		create: "Create account",
		linkLead: "Rather skip passwords? Get a sign-in link by email.",
		forgotLead: "Enter your email and we will send a link to choose a new password.",
		sendReset: "Send link",
		back: "Back",
		resetSent: "Check your inbox — the link is on its way.",
		confirmSent: "Almost done! Check your inbox and tap the link to confirm your email.",
		choosePw: "Choose a new password",
		savePw: "Save password",
		pwSaved: "Password changed ✓",
		pwShort: "The password must be at least 8 characters.",
		fillAll: "Fill in all the fields.",
		setUser: "Pick a username",
		setUserLead: "Then you can sign in with username and password next time.",
		save: "Save",
		setPw: "Set a password",
		setPwLead: "Signed in with a link? Set a password so you can sign in with your username.",
		decks: "My card decks",
		decksLead: "Write your own drinking cards and play them alone or in a room with friends.",
		newDeck: "New deck",
		deckName: "Name",
		deckCards: "Cards – one per line",
		deckPh: "Everyone in white socks drinks\nThe youngest hands out three sips",
		saveDeck: "Save deck",
		play: "Play",
		playRoom: "Play in a room",
		edit: "Edit",
		del: "Delete",
		cancel: "Cancel",
		cards: "cards",
		noDecks: "No decks yet. Make one here, or save the cards after a round of Rule Factory.",
		draft: "cards from Rule Factory are not saved yet.",
		saveDraft: "Save them",
		delConfirm: "Tap again to delete",
		next: "Next card",
		close: "Close",
		of: "of",
		saved: "Saved ✓",
		stats: "Statistics",
		settings: "Account",
		share: "Share",
		unshare: "Stop sharing",
		shared: "shared",
		linkCopied: "Link copied.",
		unshared: "The link no longer works.",
		changeUser: "Change username",
		changeUserLead: "You sign in with the new name from now on. The old one becomes available to others.",
		changePw: "Change password",
		deleteAcc: "Delete account",
		deleteLead: "Deletes your account, username, decks and lines for good. This cannot be undone.",
		deleteType: "Type DELETE to confirm",
		deleteBtn: "Delete my account",
		deleted: "Your account has been deleted."
	};
	return renderTemplate`${renderComponent($$result, "Base", $$Base, {
		"title": L.accountTitle,
		"description": L.accountLead,
		"lang": lang,
		"noindex": true
	}, { "default": ($$result) => renderTemplate`${maybeRenderHead($$result)}<h1>${L.accountTitle}</h1><p class="lead">${L.accountLead}</p>${!configured && renderTemplate`<div class="notice"><p>${L.notConfigured}</p><p class="small" style="margin-top:10px">Diagnose · kjører på server: ${dbg.runtime} · variabler synlige: ${dbg.antall} · Supabase-navn funnet: ${dbg.funnet}</p></div>`}${configured && renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": ($$result) => renderTemplate`<section id="signin" class="konto"><div class="konto-faner" role="tablist"><button type="button" role="tab" data-fane="inn" aria-selected="true">${T.tabLogin}</button><button type="button" role="tab" data-fane="ny" aria-selected="false">${T.tabNew}</button><button type="button" role="tab" data-fane="lenke" aria-selected="false">${T.tabLink}</button></div><form class="form" id="innForm" data-panel="inn" novalidate><div class="field"><label class="lab" for="innNavn">${T.userOrEmail}</label><input id="innNavn" autocomplete="username" autocapitalize="none" spellcheck="false" required></div><div class="field"><label class="lab" for="innPw">${T.password}</label><input id="innPw" type="password" autocomplete="current-password" required></div><button class="btn gold" type="submit">${T.login}</button><p><button type="button" class="linkbtn" data-fane="glemt">${T.forgot}</button></p></form><form class="form" id="nyForm" data-panel="ny" novalidate hidden><div class="field"><label class="lab" for="nyEpost">${L.email}</label><input id="nyEpost" type="email" autocomplete="email" required placeholder="deg@example.com"></div><div class="field"><label class="lab" for="nyNavn">${T.username}</label><input id="nyNavn" autocomplete="username" autocapitalize="none" spellcheck="false" maxlength="20" pattern="[A-Za-z0-9_.\\-]{3,20}" required><p class="help">${T.usernameHelp}</p></div><div class="field"><label class="lab" for="nyPw">${T.newPw}</label><input id="nyPw" type="password" autocomplete="new-password" minlength="8" required></div><button class="btn gold" type="submit">${T.create}</button></form><form class="form" id="loginForm" data-panel="lenke" novalidate hidden><p class="small">${T.linkLead}</p><div class="field"><label class="lab" for="email">${L.email}</label><input id="email" type="email" autocomplete="email" required placeholder="deg@example.com"></div><button class="btn gold" type="submit" id="linkBtn">${L.sendLink}</button></form><form class="form" id="glemtForm" data-panel="glemt" novalidate hidden><p class="small">${T.forgotLead}</p><div class="field"><label class="lab" for="glemtEpost">${L.email}</label><input id="glemtEpost" type="email" autocomplete="email" required></div><button class="btn gold" type="submit">${T.sendReset}</button><p><button type="button" class="linkbtn" data-fane="inn">${T.back}</button></p></form><p id="loginMsg" class="formmsg" role="status" aria-live="polite"></p></section><section id="dash" hidden><div class="dashbar"><p class="small"><span>${L.signedInAs}</span> <strong id="who"></strong></p><span class="dashknapper"><a class="btn ghost small" id="statLenke" href="/no/statistikk" hidden>${T.stats}</a><button class="btn ghost small" id="outBtn">${L.signOut}</button></span></div><div class="konto-valg"><button type="button" class="mini" id="endreNavnBtn">${T.changeUser}</button><button type="button" class="mini" id="endrePwBtn">${T.changePw}</button><button type="button" class="mini danger" id="slettBtn">${T.deleteAcc}</button></div><p id="plussLinje" class="konto-pluss" hidden></p>${no ? renderTemplate`<div class="konto-ekstra"><a class="konto-kort" href="/no/gjeng"><span>👥</span><b>Gjengene dine</b><small id="gjengTall">Sesongtabell over flere kvelder</small></a><div class="konto-kort" id="vervKort"><span>🎁</span><b>Verv en venn</b><small id="vervTekst">Dere får et gratis kveldspass hver når vennen har spilt sitt første rom.</small><div class="dl-knapper"><button class="btn gold small" id="vervDel" type="button" disabled>Del vervelenken</button><button class="btn ghost small" id="vervBruk" type="button" hidden>Bruk et kveldspass</button></div></div></div>` : renderTemplate`<div class="konto-ekstra"><a class="konto-kort" href="/crew"><span>👥</span><b>Your crews</b><small id="gjengTall">A season table across many nights</small></a><div class="konto-kort" id="vervKort"><span>🎁</span><b>Refer a friend</b><small id="vervTekst">You each get a free night pass once your friend has played their first room.</small><div class="dl-knapper"><button class="btn gold small" id="vervDel" type="button" disabled>Share your referral link</button><button class="btn ghost small" id="vervBruk" type="button" hidden>Use a night pass</button></div></div></div>`}<p id="syncMsg" class="formmsg" role="status" aria-live="polite"></p><form class="form konto-boks" id="pwForm" hidden novalidate><h2 id="pwTittel">${T.setPw}</h2><p class="small" id="pwLead">${T.setPwLead}</p><div class="field"><label class="lab" for="pwNy">${T.newPw}</label><input id="pwNy" type="password" autocomplete="new-password" minlength="8"></div><div class="dl-knapper"><button class="btn gold" type="submit">${T.savePw}</button><button class="btn ghost" type="button" data-lukk="pwForm">${T.cancel}</button></div></form><form class="form konto-boks" id="navnForm" hidden novalidate><h2 id="navnTittel">${T.setUser}</h2><p class="small" id="navnLead">${T.setUserLead}</p><div class="field"><label class="lab" for="navnNy">${T.username}</label><input id="navnNy" autocomplete="username" autocapitalize="none" spellcheck="false" maxlength="20"></div><div class="dl-knapper"><button class="btn gold" type="submit">${T.save}</button><button class="btn ghost" type="button" data-lukk="navnForm">${T.cancel}</button></div></form><form class="form konto-boks" id="slettForm" hidden novalidate><h2>${T.deleteAcc}</h2><p class="small">${T.deleteLead}</p><div class="field"><label class="lab" for="slettOrd">${T.deleteType}</label><input id="slettOrd" autocomplete="off" autocapitalize="characters" spellcheck="false"></div><div class="dl-knapper"><button class="btn danger" type="submit">${T.deleteBtn}</button><button class="btn ghost" type="button" data-lukk="slettForm">${T.cancel}</button></div></form><h2>${T.decks}</h2><p class="small">${T.decksLead}</p><div id="utkast" class="konto-utkast" hidden></div><div id="stokker" class="stokk-liste"></div><button class="btn" type="button" id="nyStokk">+ ${T.newDeck}</button><form class="form konto-boks" id="stokkForm" hidden novalidate><div class="field"><label class="lab" for="stNavn">${T.deckName}</label><input id="stNavn" maxlength="40" autocomplete="off"></div><div class="field"><label class="lab" for="stKort">${T.deckCards}</label><textarea id="stKort" rows="8"${addAttribute(T.deckPh, "placeholder")}></textarea><p class="help" id="stAntall"></p></div><div class="dl-knapper"><button class="btn gold" type="submit">${T.saveDeck}</button><button class="btn ghost" type="button" id="stAvbryt">${T.cancel}</button></div></form><h2>${L.myLines}</h2><form class="form addform" id="addForm" novalidate><div class="field"><label class="lab" for="aCtx">${L.fWhen}<span class="opt">${L.optional}</span></label><input id="aCtx" maxlength="120" autocomplete="off"${addAttribute(L.fWhenPh, "placeholder")}></div><div class="field"><label class="lab" for="aLine">${L.fLine}</label><textarea id="aLine" rows="2" maxlength="300"${addAttribute(L.fLinePh, "placeholder")}></textarea></div><button class="btn gold" type="submit">${L.addLine}</button></form><div id="mine" class="cards"></div></section><div id="stokkSpill" class="stokk-spill" hidden role="dialog" aria-modal="true" aria-labelledby="ssNavn"><p class="stokk-spill-navn" id="ssNavn"></p><div class="rom-kort rf-kort"><span class="sw-tag" id="ssTeller"></span><p id="ssKort"></p><span></span></div><button class="rom-stor-knapp" type="button" id="ssNeste">${T.next}</button><button class="btn ghost" type="button" id="ssLukk">${T.close}</button></div><script data-astro-rerun>(function(){${defineScriptVars({
		LANG: lang,
		T: {
			linkSent: L.linkSent,
			syncing: L.syncing,
			synced: L.synced,
			none: L.noLines,
			del: L.delete,
			generic: L.errGeneric,
			copyHint: L.copyHint,
			linkBad: L.linkBad,
			...T
		}
	})}
      (function () {
        var root = document.getElementById('signin');
        if (!root || root.dataset.bound || !window.BDKonto) return; root.dataset.bound = '1';
        var K = window.BDKonto, LOCAL = 'bd_mine', UTKAST = 'bd_stokk_utkast';
        var mine = [], bruker = null, stokker = [], redigerer = null, erGjenoppretting = false;
        var $ = function (id) { return document.getElementById(id); };
        function say(el, text, kind) { el.textContent = text; el.className = 'formmsg' + (kind ? ' ' + kind : ''); }
        function esc(s) { return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
        function lesLS(k, d) { try { return JSON.parse(localStorage.getItem(k) || 'null') || d; } catch (e) { return d; } }
        function skrivLS(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
        var msg = $('loginMsg');

        /* ---------- faner ---------- */
        function fane(navn) {
          root.querySelectorAll('[role=tab]').forEach(function (b) { b.setAttribute('aria-selected', b.dataset.fane === navn); });
          root.querySelectorAll('[data-panel]').forEach(function (p) { p.hidden = p.dataset.panel !== navn; });
          say(msg, '');
        }
        root.addEventListener('click', function (e) { var b = e.target.closest('[data-fane]'); if (b) fane(b.dataset.fane); });

        function loggInnMed(d) {
          K.lagre({ access_token: d.access_token, refresh_token: d.refresh_token });
          start();
        }
        function feilFra(r) { return r.json().catch(function () { return {}; }).then(function (d) { return d.melding || T.generic; }); }

        $('innForm').addEventListener('submit', function (e) {
          e.preventDefault();
          var navn = $('innNavn').value.trim(), pw = $('innPw').value;
          if (!navn || !pw) return say(msg, T.fillAll, 'err');
          var knapp = this.querySelector('button[type=submit]'); knapp.disabled = true;
          fetch('/api/konto/logginn', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ navn: navn, passord: pw }) })
            .then(function (r) { return r.ok ? r.json().then(loggInnMed) : feilFra(r).then(function (m) { say(msg, m, 'err'); }); })
            .catch(function () { say(msg, T.generic, 'err'); })
            .then(function () { knapp.disabled = false; });
        });

        $('nyForm').addEventListener('submit', function (e) {
          e.preventDefault();
          var epost = $('nyEpost').value.trim(), navn = $('nyNavn').value.trim(), pw = $('nyPw').value;
          if (!epost || !navn || !pw) return say(msg, T.fillAll, 'err');
          if (pw.length < 8) return say(msg, T.pwShort, 'err');
          var knapp = this.querySelector('button[type=submit]'); knapp.disabled = true;
          fetch('/api/konto/registrer', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ epost: epost, brukernavn: navn, passord: pw }) })
            .then(function (r) {
              if (!r.ok) return feilFra(r).then(function (m) { say(msg, m, 'err'); });
              return r.json().then(function (d) { if (d.access_token) loggInnMed(d); else { say(msg, T.confirmSent, 'ok'); $('nyForm').reset(); } });
            })
            .catch(function () { say(msg, T.generic, 'err'); })
            .then(function () { knapp.disabled = false; });
        });

        $('loginForm').addEventListener('submit', function (e) {
          e.preventDefault();
          var email = $('email').value.trim(); if (!email) return;
          $('linkBtn').disabled = true;
          var back = location.origin + location.pathname;
          K.sb('/auth/v1/otp?redirect_to=' + encodeURIComponent(back), { method: 'POST', body: JSON.stringify({ email: email, create_user: true }) })
            .then(function (r) { say(msg, r.ok ? T.linkSent : T.generic, r.ok ? 'ok' : 'err'); })
            .catch(function () { say(msg, T.generic, 'err'); })
            .then(function () { $('linkBtn').disabled = false; });
        });

        $('glemtForm').addEventListener('submit', function (e) {
          e.preventDefault();
          var email = $('glemtEpost').value.trim(); if (!email) return;
          var back = location.origin + location.pathname;
          K.sb('/auth/v1/recover?redirect_to=' + encodeURIComponent(back), { method: 'POST', body: JSON.stringify({ email: email }) })
            .then(function (r) { say(msg, r.ok ? T.resetSent : T.generic, r.ok ? 'ok' : 'err'); })
            .catch(function () { say(msg, T.generic, 'err'); });
        });

        /* ---------- lenker fra e-post via mittvors.no (…?token_hash=…&type=…) ----------
           E-postmalene peker hit i stedet for til Supabase, så lenken viser vår egen adresse. */
        try { if (sessionStorage.getItem('bd_gjenoppretting') === '1') { erGjenoppretting = true; sessionStorage.removeItem('bd_gjenoppretting'); } } catch (x) {}
        (function tokenHash() {
          var q = new URLSearchParams(location.search), th = q.get('token_hash'), ty = q.get('type');
          if (!th || !ty) return;
          history.replaceState(null, '', location.pathname);
          // Ulike Supabase-versjoner vil ha ulik type – prøv den fra lenken først, så «email»
          var typer = [ty].concat(ty === 'signup' || ty === 'magiclink' || ty === 'invite' ? ['email'] : []);
          say(msg, document.documentElement.lang === 'en' ? 'Checking the link …' : 'Sjekker lenken …', 'ok');
          try { K.lagre(null); } catch (x) {}   // en gammel innlogging skal ikke blande seg inn
          function prov(i) {
            return fetch(K.cfg.url + '/auth/v1/verify', { method: 'POST', headers: { apikey: K.cfg.anon, 'Content-Type': 'application/json' }, body: JSON.stringify({ type: typer[i], token_hash: th }) })
              .then(function (r) { return r.json().catch(function () { return {}; }).then(function (d) { d._ok = r.ok; return d; }); })
              .then(function (d) { return (!d._ok || !d.access_token) && i + 1 < typer.length ? prov(i + 1) : d; });
          }
          prov(0).then(function (d) {
            if (!d._ok || !d.access_token) { say(msg, T.linkBad + (d.msg || d.error_description ? ' (' + (d.msg || d.error_description) + ')' : ''), 'err'); return; }
            K.lagre({ access_token: d.access_token, refresh_token: d.refresh_token });
            try { if (ty === 'recovery') sessionStorage.setItem('bd_gjenoppretting', '1'); } catch (x) {}
            location.replace(location.pathname);
          }).catch(function () { say(msg, T.generic, 'err'); });
        })();

        /* ---------- lenker fra e-post (innlogging, bekreftelse, nytt passord) ---------- */
        (function catchHash() {
          var h = location.hash || '';
          if (h.indexOf('error') !== -1) {
            var ep = new URLSearchParams(h.slice(1));
            var why = (ep.get('error_description') || ep.get('error') || '').replace(/\\+/g, ' ');
            say(msg, T.linkBad + (why ? ' (' + why + ')' : ''), 'err');
            history.replaceState(null, '', location.pathname);
            return;
          }
          if (h.indexOf('access_token') === -1) return;
          var p = new URLSearchParams(h.slice(1));
          if (p.get('access_token')) K.lagre({ access_token: p.get('access_token'), refresh_token: p.get('refresh_token') });
          erGjenoppretting = p.get('type') === 'recovery';
          history.replaceState(null, '', location.pathname);
        })();

        /* ---------- passord og brukernavn ---------- */
        $('pwForm').addEventListener('submit', function (e) {
          e.preventDefault();
          var pw = $('pwNy').value;
          if (pw.length < 8) return say($('syncMsg'), T.pwShort, 'err');
          K.sb('/auth/v1/user', { method: 'PUT', body: JSON.stringify({ password: pw }) }).then(function (r) {
            if (!r.ok) return say($('syncMsg'), T.generic, 'err');
            $('pwNy').value = ''; $('pwForm').hidden = true; say($('syncMsg'), T.pwSaved, 'ok');
          });
        });
        $('navnForm').addEventListener('submit', function (e) {
          e.preventDefault();
          var navn = $('navnNy').value.trim(); if (!navn) return;
          K.api('/api/konto/brukernavn', { method: 'POST', body: JSON.stringify({ brukernavn: navn }) }).then(function (r) {
            if (!r.ok) return feilFra(r).then(function (m) { say($('syncMsg'), m, 'err'); });
            bruker.brukernavn = navn; $('navnForm').hidden = true; $('navnNy').value = ''; visHvem(); say($('syncMsg'), T.saved, 'ok');
          });
        });

        /* ---------- kortstokker ---------- */
        function tegnStokker() {
          $('stokker').innerHTML = stokker.length ? stokker.map(function (s, i) {
            return '<article class="stokk-kort"><div><b>' + esc(s.navn) + '</b><span>' + (s.kort || []).length + ' ' + esc(T.cards) + (s.delt ? ' · ' + esc(T.shared) : '') + '</span></div>' +
              '<div class="stokk-knapper">' +
                '<button class="btn gold small" data-st="spill" data-i="' + i + '" type="button">' + esc(T.play) + '</button>' +
                '<button class="btn small" data-st="rom" data-i="' + i + '" type="button">' + esc(T.playRoom) + '</button>' +
                '<button class="mini" data-st="del" data-i="' + i + '" type="button">' + esc(T.share) + '</button>' +
                (s.delt ? '<button class="mini" data-st="udel" data-i="' + i + '" type="button">' + esc(T.unshare) + '</button>' : '') +
                '<button class="mini" data-st="rediger" data-i="' + i + '" type="button">' + esc(T.edit) + '</button>' +
                '<button class="mini danger" data-st="slett" data-i="' + i + '" type="button">' + esc(T.del) + '</button>' +
              '</div></article>';
          }).join('') : '<p class="small">' + esc(T.noDecks) + '</p>';
          var u = lesLS(UTKAST, null);
          $('utkast').hidden = !(u && u.kort && u.kort.length);
          if (u && u.kort && u.kort.length) $('utkast').innerHTML = '<p><b>' + u.kort.length + '</b> ' + esc(T.draft) + '</p><button class="btn gold small" type="button" id="lagreUtkast">' + esc(T.saveDraft) + '</button>';
        }
        function hentStokker() {
          return K.stokker.liste().then(function (l) { stokker = l; tegnStokker(); })
            .catch(function (e) { say($('syncMsg'), e.message, 'err'); tegnStokker(); });
        }
        function aapneSkjema(s) {
          redigerer = s || null;
          $('stNavn').value = s ? s.navn : '';
          $('stKort').value = s ? (s.kort || []).join('\\n') : '';
          $('stokkForm').hidden = false; $('nyStokk').hidden = true; tellKort();
          $('stNavn').focus();
        }
        function lukkSkjema() { $('stokkForm').hidden = true; $('nyStokk').hidden = false; redigerer = null; }
        function kortFraFelt() { return $('stKort').value.split('\\n').map(function (t) { return t.trim(); }).filter(Boolean).slice(0, 300); }
        function tellKort() { $('stAntall').textContent = kortFraFelt().length + ' / 300 ' + T.cards; }
        $('stKort').addEventListener('input', tellKort);
        $('nyStokk').addEventListener('click', function () { aapneSkjema(null); });
        $('stAvbryt').addEventListener('click', lukkSkjema);
        $('stokkForm').addEventListener('submit', function (e) {
          e.preventDefault();
          var kort = kortFraFelt(), navn = $('stNavn').value.trim() || T.newDeck;
          if (!kort.length) return say($('syncMsg'), T.fillAll, 'err');
          K.stokker.lagre({ id: redigerer && redigerer.id, navn: navn, kort: kort }).then(function () {
            lukkSkjema(); say($('syncMsg'), T.saved, 'ok'); return hentStokker();
          }).catch(function (err) { say($('syncMsg'), err.message, 'err'); });
        });
        $('utkast').addEventListener('click', function (e) {
          if (!e.target.closest('#lagreUtkast')) return;
          var u = lesLS(UTKAST, null); if (!u) return;
          K.stokker.lagre({ navn: u.navn || 'Hjemmesnekra', kort: u.kort }).then(function () {
            skrivLS(UTKAST, null); say($('syncMsg'), T.saved, 'ok'); return hentStokker();
          }).catch(function (err) { say($('syncMsg'), err.message, 'err'); });
        });
        $('stokker').addEventListener('click', function (e) {
          var b = e.target.closest('[data-st]'); if (!b) return;
          var s = stokker[+b.dataset.i]; if (!s) return;
          if (b.dataset.st === 'rediger') return aapneSkjema(s);
          if (b.dataset.st === 'del') {
            var lenke = location.origin + (LANG === 'no' ? '/no/kortstokk?s=' : '/deck?s=') + s.id;
            var dele = function () {
              if (navigator.share) return navigator.share({ title: s.navn, text: LANG === 'no' ? 'Spill kortstokken «' + s.navn + '» på Mitt vors' : 'Play the deck “' + s.navn + '” on Mitt vors', url: lenke }).catch(function () {});
              if (navigator.clipboard) navigator.clipboard.writeText(lenke).then(function () { say($('syncMsg'), T.linkCopied, 'ok'); });
            };
            if (s.delt) return dele();
            return K.stokker.del(s.id, true).then(function () { s.delt = true; tegnStokker(); dele(); }).catch(function (err) { say($('syncMsg'), err.message, 'err'); });
          }
          if (b.dataset.st === 'udel') return K.stokker.del(s.id, false).then(function () { s.delt = false; tegnStokker(); say($('syncMsg'), T.unshared, 'ok'); }).catch(function (err) { say($('syncMsg'), err.message, 'err'); });
          if (b.dataset.st === 'spill') return spill(s);
          if (b.dataset.st === 'rom') { skrivLS('bd_stokk_rom', { id: s.id, navn: s.navn, kort: s.kort }); location.href = LANG === 'no' ? '/no/rom' : '/room'; return; }
          if (b.dataset.st === 'slett') {
            if (b.dataset.sikker !== '1') { b.dataset.sikker = '1'; b.textContent = T.delConfirm; return; }
            K.stokker.slett(s.id).then(hentStokker).catch(function (err) { say($('syncMsg'), err.message, 'err'); });
          }
        });

        /* ---------- spill en kortstokk alene: send telefonen rundt ---------- */
        var rekke = [], pos = 0;
        function stokk(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
        function visKort() { $('ssKort').textContent = rekke[pos]; $('ssTeller').textContent = (pos + 1) + ' ' + T.of + ' ' + rekke.length; }
        function spill(s) {
          rekke = stokk(s.kort || []); pos = 0; if (!rekke.length) return;
          apner = document.activeElement; $('ssNavn').textContent = s.navn; visKort(); $('stokkSpill').hidden = false; document.body.classList.add('stokk-aapen'); $('ssNeste').focus();
        }
        $('ssNeste').addEventListener('click', function () { pos++; if (pos >= rekke.length) { rekke = stokk(rekke); pos = 0; } visKort(); });
        // Lukk spillvinduet og gi fokus tilbake til knappen som åpnet det
        var apner = null;
        function lukkSpill() { $('stokkSpill').hidden = true; document.body.classList.remove('stokk-aapen'); if (apner && apner.isConnected) apner.focus(); }
        $('ssLukk').addEventListener('click', lukkSpill);
        $('stokkSpill').addEventListener('keydown', function (e) { if (e.key === 'Escape') lukkSpill(); });

        /* ---------- egne replikker (som før) ---------- */
        function loadLocal() { return lesLS(LOCAL, []); }
        function saveLocal() { skrivLS(LOCAL, mine); }
        function pull() { return K.data.hent(); }
        function push() {
          if (!bruker) return;
          say($('syncMsg'), T.syncing);
          K.data.lagre({ lines: mine }).then(function (ok) { say($('syncMsg'), ok ? T.synced : T.generic, ok ? 'ok' : 'err'); });
        }
        function render() {
          if (!mine.length) { $('mine').innerHTML = '<p class="small">' + T.none + '</p>'; return; }
          $('mine').innerHTML = mine.map(function (it, i) {
            return '<article class="card item" data-copy="' + esc(it.line) + '" tabindex="0" title="' + esc(T.copyHint) + '">' +
              (it.ctx ? '<p class="ctx">' + esc(it.ctx) + '</p>' : '') +
              '<p class="line">«' + esc(it.line) + '»</p>' +
              '<div class="acts"><button class="mini danger" data-del="' + i + '">' + esc(T.del) + '</button></div></article>';
          }).join('');
        }
        $('mine').addEventListener('click', function (e) {
          var d = e.target.closest('[data-del]'); if (!d) return;
          e.stopPropagation(); mine.splice(+d.dataset.del, 1); saveLocal(); render(); push();
        });
        $('addForm').addEventListener('submit', function (e) {
          e.preventDefault();
          var line = $('aLine').value.trim(); if (!line) return;
          var entry = { line: line }, ctx = $('aCtx').value.trim(); if (ctx) entry.ctx = ctx;
          mine.push(entry); $('aLine').value = ''; $('aCtx').value = '';
          saveLocal(); render(); push();
        });

        $('dash').addEventListener('click', function (e) {
          var l = e.target.closest('[data-lukk]'); if (l) { $(l.dataset.lukk).hidden = true; return; }
        });
        $('endreNavnBtn').addEventListener('click', function () {
          $('navnTittel').textContent = bruker.brukernavn ? T.changeUser : T.setUser;
          $('navnLead').textContent = bruker.brukernavn ? T.changeUserLead : T.setUserLead;
          $('navnNy').value = bruker.brukernavn || '';
          $('navnForm').hidden = false; $('navnNy').focus(); $('navnNy').select();
        });
        $('endrePwBtn').addEventListener('click', function () {
          $('pwTittel').textContent = T.changePw; $('pwLead').hidden = true; $('pwForm').hidden = false; $('pwNy').focus();
        });
        $('slettBtn').addEventListener('click', function () { $('slettForm').hidden = false; $('slettOrd').focus(); });
        $('slettForm').addEventListener('submit', function (e) {
          e.preventDefault();
          var ord = $('slettOrd').value.trim().toUpperCase();
          if (ord !== 'SLETT' && ord !== 'DELETE') return say($('syncMsg'), T.deleteType, 'err');
          K.api('/api/konto/slett', { method: 'POST', body: JSON.stringify({ bekreft: true }) }).then(function (r) {
            if (!r.ok) return feilFra(r).then(function (m) { say($('syncMsg'), m, 'err'); });
            try { localStorage.removeItem(LOCAL); localStorage.removeItem(UTKAST); localStorage.removeItem('bd_stokk_rom'); } catch (x) {}
            K.lagre(null);
            $('dash').hidden = true; $('signin').hidden = false; say(msg, T.deleted, 'ok');
          });
        });

        var verv = null, EN = LANG === 'en', EN_HODE = EN ? { headers: { 'x-lang': 'en' } } : undefined;
        function visVerv() {
          K.api('/api/verv', EN_HODE).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
            if (!d || !d.kode) return;
            verv = d;
            $('vervDel').disabled = false;
            $('vervTekst').textContent = EN
              ? (d.antall ? 'You\\u2019ve referred ' + d.antall + (d.antall === 1 ? ' friend' : ' friends') + '. ' : 'You each get a free night pass once your friend has played their first room. ') +
                (d.kveldspass ? 'You have ' + d.kveldspass + (d.kveldspass === 1 ? ' night pass' : ' night passes') + ' saved up.' : '')
              : (d.antall ? 'Du har vervet ' + d.antall + (d.antall === 1 ? ' venn' : ' venner') + '. ' : 'Dere får et gratis kveldspass hver når vennen har spilt sitt første rom. ') +
                (d.kveldspass ? 'Du har ' + d.kveldspass + ' kveldspass på lur.' : '');
            $('vervBruk').hidden = !d.kveldspass;
          }).catch(function () {});
        }
        function visGjenger() {
          K.api('/api/gjeng', EN_HODE).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
            if (!d || !d.gjenger) return;
            var n = d.gjenger.length, navn = d.gjenger.slice(0, 3).map(function (g) { return g.navn; }).join(', ');
            $('gjengTall').textContent = EN
              ? (n ? n + (n === 1 ? ' crew: ' : ' crews: ') + navn : 'Create a crew and get a season table across many nights')
              : (n ? n + (n === 1 ? ' gjeng: ' : ' gjenger: ') + navn : 'Lag en gjeng og få sesongtabell over flere kvelder');
          }).catch(function () {});
        }
        if ($('vervDel')) {
          $('vervDel').addEventListener('click', function () {
            if (!verv) return;
            if (EN) return window.BDDel.lenke(location.origin + '/en?v=' + verv.kode, 'Join me on Mitt vors – drinking games where everyone plays from their own phone. Use my link and we both get a free night of Plus 🎁', {
              tittel: 'Refer a friend', ingress: 'When your friend creates an account and plays their first room, you each get a night pass.',
            });
            window.BDDel.lenke(location.origin + '/no/?v=' + verv.kode, 'Bli med på Mitt vors – drikkeleker der alle spiller fra sin egen telefon. Bruk lenken min, så får vi begge en gratis kveld med Pluss 🎁', {
              tittel: 'Verv en venn', ingress: 'Når vennen lager konto og spiller sitt første rom, får dere et kveldspass hver.',
            });
          });
          $('vervBruk').addEventListener('click', function () {
            var b = this; b.disabled = true;
            K.api('/api/verv', Object.assign({ method: 'POST' }, EN_HODE || {})).then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); }).then(function (x) {
              b.disabled = false;
              if (!x.ok) return say($('syncMsg'), x.d.melding || (EN ? 'That didn\\u2019t work.' : 'Det gikk ikke.'), 'err');
              say($('syncMsg'), EN ? '✨ Plus is on for 24 hours. Have a great night!' : '✨ Pluss er på i 24 timer. God kveld!', 'ok');
              setTimeout(function () { location.reload(); }, 900);
            });
          });
        }

        /** Lenke til siste kvittering (lagret på denne enheten etter kjøp). */
        function kvitteringer(el) {
          var l = []; try { l = JSON.parse(localStorage.getItem('bd_kvitteringer') || '[]'); } catch (x) {}
          if (!l.length) return;
          el.innerHTML += ' · <a href="' + (LANG === 'no' ? '/no/kvittering?ref=' : '/receipt?ref=') + encodeURIComponent(l[0]) + '">' + (LANG === 'no' ? 'Kvittering' : 'Receipt') + '</a>';
        }

        function visHvem() { $('who').textContent = bruker.brukernavn ? bruker.brukernavn + ' · ' + bruker.email : bruker.email; }

        function start() {
          mine = loadLocal();
          K.bruker(true).then(function (u) {
            bruker = u;
            if (!u) { render(); return; }
            $('signin').hidden = true; $('dash').hidden = false;
            visHvem();
            $('navnForm').hidden = !!u.brukernavn;
            if (erGjenoppretting) { $('pwForm').hidden = false; $('pwTittel').textContent = T.choosePw; $('pwLead').hidden = true; $('pwNy').focus(); }
            else if (!u.brukernavn) $('pwForm').hidden = false;
            K.api('/api/statistikk?sjekk=1').then(function (r) { return r.ok ? r.json() : {}; }).then(function (d) { $('statLenke').hidden = !d.ok; }).catch(function () {});
            hentStokker();
            K.api('/api/pluss/status', EN_HODE).then(function (r) { return r.json(); }).then(function (d) {
              var el = $('plussLinje'); el.hidden = false;
              var kode = null; try { kode = localStorage.getItem('bd_gavekode'); } catch (x) {}
              if (EN) {
                if (kode) { el.innerHTML = '🎁 You have a gift code waiting – <a href="/plus">activate it now</a>'; return; }
                el.innerHTML = d.aktiv
                  ? '✨ <b>Plus</b> until ' + esc(new Date(d.til).toLocaleString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })) + ' · <a href="/plus">More</a>'
                  : '✨ <a href="/plus">' + (d.gratisBrukt ? 'Get Mitt vors Plus' : 'Try Mitt vors Plus free tonight') + '</a>';
                kvitteringer(el);
                return;
              }
              if (kode) { el.innerHTML = '🎁 Du har en gavekode som venter – <a href="/no/pluss">aktiver den nå</a>'; return; }
              el.innerHTML = d.aktiv
                ? '✨ <b>Pluss</b> til ' + esc(new Date(d.til).toLocaleString('nb-NO', { day: 'numeric', month: 'long', year: 'numeric' })) + ' · <a href="/no/pluss">Mer</a>'
                : '✨ <a href="/no/pluss">' + (d.gratisBrukt ? 'Få Mitt vors Pluss' : 'Prøv Mitt vors Pluss gratis i kveld') + '</a>';
              kvitteringer(el);
            }).catch(function () {});
            {
              // Kom man hit for å logge inn fra en annen side (f.eks. en gjenglenke), gå tilbake dit
              var tilbake = null; try { tilbake = sessionStorage.getItem('bd_etter_innlogging'); sessionStorage.removeItem('bd_etter_innlogging'); } catch (x) {}
              if (tilbake && (EN ? /^\\/(?!no\\/|\\/)[a-z0-9/?=&%-]*$/i : /^\\/no\\/[a-z0-9/?=&%-]*$/i).test(tilbake)) { location.href = tilbake; return; }
              visVerv(); visGjenger();
            }
            try { sessionStorage.setItem('bd_favsynk', '1'); } catch (x) {}
            K.synkFav().catch(function () {}).then(pull).then(function (remote) {
              if (remote && remote.lines) {
                var seen = {};
                mine.concat(remote.lines).forEach(function (it) { seen[JSON.stringify(it)] = it; });
                mine = Object.keys(seen).map(function (k) { return seen[k]; });
                saveLocal();
              }
              render(); push();
            });
          });
        }
        $('outBtn').addEventListener('click', function () { K.loggUt(); location.reload(); });
        start();
      })();
      })();<\/script>` })}`}` })}`;
}, "C:/Users/jonas/Documents/GitHub/banterdeck/src/components/pages/Account.astro", void 0);
//#endregion
export { $$Account as t };
