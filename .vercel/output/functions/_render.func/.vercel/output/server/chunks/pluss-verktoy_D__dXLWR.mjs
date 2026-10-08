import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { a as Fragment, d as renderTemplate, f as maybeRenderHead, h as defineScriptVars, i as renderComponent, m as addAttribute, w as createAstro } from "./server_Bjx7FWTN.mjs";
import { t as createComponent } from "./compiler_Bf6GLUpQ.mjs";
import { a as t, i as games } from "./content_g9BS9nOd.mjs";
import { o as innloggetBruker } from "./konto_Cyp1VvAa.mjs";
import { a as plussStatus } from "./pluss_Bsul_2hb.mjs";
import { a as bingo_default, i as decks_en_default, n as PLUSS_SLUGS, o as decks_default, r as bingo_en_default } from "./plussleker_D1MVk9p6.mjs";
//#region src/components/GameTool.astro
createAstro("https://www.mittvors.no");
var $$GameTool = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$GameTool;
	const { slug, lang = "en" } = Astro.props;
	const en = lang === "en";
	const EN = en;
	const bingoData = en ? bingo_en_default : bingo_default;
	const deck = lang === "no" || en ? (en ? decks_en_default : decks_default)[slug] : null;
	const bingoFull = (lang === "no" || en) && slug === "drikke-bingo" ? bingoData : null;
	const bingo = bingoFull && {
		...bingoFull,
		blandet: bingoFull.blandet && {
			title: bingoFull.blandet.title,
			spotify: bingoFull.blandet.spotify
		}
	};
	const aarData = { eras: bingoData.eras };
	return renderTemplate`${deck && deck.kind === "deck" && renderTemplate`${maybeRenderHead($$result)}<section class="gt" data-gt="deck"><h2>${deck.title}</h2><div class="gt-body"></div><script data-astro-rerun>(function(){${defineScriptVars({
		D: deck,
		EN
	})}
    (function () {
      var root = document.currentScript.closest('.gt');
      var body = root.querySelector('.gt-body');
      if (root.dataset.bound) return; root.dataset.bound = '1';
      var modes = D.modes.length > 1 ? D.modes.concat([{ v: '*', t: EN ? 'All' : 'Alle' }]) : D.modes;
      var mode = modes[0].v, order = [], pos = 0;
      function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
      function stokk(){
        order = D.items.filter(function(x){ return mode === '*' || D.modes.length === 1 || x.m === mode; }).slice();
        for (var i=order.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=order[i]; order[i]=order[j]; order[j]=t; }
        if (D.alt){ // annenhver type, f.eks. «Jeg har aldri» og snusboksen i 50/50
          var typer = {}, navn = [];
          order.forEach(function(x){ if (!typer[x.k]){ typer[x.k]=[]; navn.push(x.k); } typer[x.k].push(x); });
          var ut = [], n = 0; while (ut.length < order.length){ var l = typer[navn[n % navn.length]]; if (l.length) ut.push(l.shift()); n++; if (n > order.length*3) break; }
          order = ut;
        }
        pos = 0;
      }
      // Neste/tilbake: det gamle kortet kastes ut, det nye deles ut (et kvart sekund – som en ekte kortstokk)
      function rolig(){ try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } }
      function tegn(retning){
        var x = order[pos];
        var gammelt = retning && !rolig() ? body.querySelector('.gt-card') : null, rekt = gammelt ? gammelt.getBoundingClientRect() : null;
        body.innerHTML =
          (modes.length > 1 ? '<div class="gt-modes">' + modes.map(function(m){
            return '<button class="gt-mode" data-m="'+m.v+'" aria-pressed="'+(m.v===mode)+'">'+esc(m.t)+'</button>'; }).join('') + '</div>' : '') +
          '<div class="gt-card"><p class="gt-count">'+(pos+1)+' / '+order.length+(x.k ? ' · <span class="gt-kind">'+esc(x.k)+'</span>' : '')+'</p><p class="gt-text">'+esc(x.t)+'</p></div>' +
          '<div class="gt-row"><button class="btn ghost" data-a="tilbake"'+(pos===0?' disabled':'')+'>'+(EN ? 'Back' : 'Tilbake')+'</button>' +
          '<button class="btn gold" data-a="neste">'+(pos === order.length-1 ? (EN ? 'Shuffle again' : 'Stokk på nytt') : (EN ? 'Next' : 'Neste'))+'</button></div>';
        if (!retning || rolig()) return;
        var nytt = body.querySelector('.gt-card');
        if (nytt) { nytt.classList.add('kort-inn'); if (retning < 0) nytt.classList.add('tilbake'); nytt.addEventListener('animationend', function(){ nytt.classList.remove('kort-inn', 'tilbake'); }, { once: true }); }
        if (gammelt && rekt && rekt.bottom > 0 && rekt.top < innerHeight){
          var klon = gammelt.cloneNode(true); klon.classList.add('kort-ut'); if (retning < 0) klon.classList.add('tilbake'); klon.setAttribute('aria-hidden', 'true');
          klon.style.cssText = 'position:fixed;left:'+rekt.left+'px;top:'+rekt.top+'px;width:'+rekt.width+'px;height:'+rekt.height+'px;margin:0;z-index:60;pointer-events:none';
          document.body.appendChild(klon); setTimeout(function(){ klon.remove(); }, 450);
        }
      }
      body.addEventListener('click', function (e) {
        var b = e.target.closest('button'); if (!b) return;
        if (b.dataset.m){ mode = b.dataset.m; stokk(); return tegn(); }
        if (b.dataset.a === 'neste'){ if (pos < order.length-1) pos++; else stokk(); tegn(1); }
        if (b.dataset.a === 'tilbake' && pos > 0){ pos--; tegn(-1); }
      });
      stokk(); tegn();
    })();
    })();<\/script></section>`}${deck && deck.kind === "rules" && renderTemplate`<section class="gt" data-gt="rules"><h2>${deck.title}</h2><p class="small">${en ? "Tap a rule to swap it out." : "Trykk på en regel for å bytte den ut."}</p><div class="gt-body"></div><script data-astro-rerun>(function(){${defineScriptVars({
		D: deck,
		EN
	})}
    (function () {
      var root = document.currentScript.closest('.gt');
      var body = root.querySelector('.gt-body');
      if (root.dataset.bound) return; root.dataset.bound = '1';
      var valgt = [];
      function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
      function ny(){ var i; do { i = Math.floor(Math.random()*D.items.length); } while (valgt.indexOf(i) !== -1); return i; }
      function trekk(){ valgt = []; for (var k=0; k<Math.min(D.draw, D.items.length); k++) valgt.push(ny()); }
      function tegn(){
        body.innerHTML = '<ol class="gt-rules">' + valgt.map(function(i,k){
          return '<li><button class="gt-rule" data-k="'+k+'">'+esc(D.items[i])+'<span aria-hidden="true">↻</span></button></li>'; }).join('') + '</ol>' +
          '<button class="btn gold vp-big" data-a="alle">'+(EN ? 'Draw new rules' : 'Trekk nye regler')+'</button>';
      }
      body.addEventListener('click', function (e) {
        var b = e.target.closest('button'); if (!b) return;
        if (b.dataset.k !== undefined){ var k=+b.dataset.k; var gammel=valgt[k]; valgt[k]=-1; var n=ny(); valgt[k]=n; if (n===gammel) valgt[k]=ny(); tegn(); }
        if (b.dataset.a === 'alle'){ trekk(); tegn(); }
      });
      trekk(); tegn();
    })();
    })();<\/script></section>`}${bingo && renderTemplate`<section class="gt" data-gt="bingo"><h2>${en ? "Make your bingo card" : "Lag ditt bingobrett"}</h2><p class="small">${en ? "Everyone makes their own card on their own phone – no two cards are the same." : "Alle lager sitt eget brett på egen mobil – brettene blir forskjellige."}</p><div class="gt-body"></div><script data-astro-rerun>(function(){${defineScriptVars({
		B: bingo,
		EN
	})}
    (function () {
      if (B.blandet && !B.blandet.songs) { var bs = {}; B.blandet.songs = []; B.eras.forEach(function (e) { e.songs.forEach(function (x) { var k = x[0] + '|' + x[1]; if (!bs[k]) { bs[k] = 1; B.blandet.songs.push(x); } }); }); }
      var root = document.currentScript.closest('.gt');
      var body = root.querySelector('.gt-body');
      if (root.dataset.bound) return; root.dataset.bound = '1';
      var VALG = B.eras.map(function(e){ return { v:e.id, t:e.title }; })
        .concat([{ v:'blandet', t: EN ? 'Mixed' : 'Blandet' }, { v:'kvelden', t: EN ? 'The night' : 'Kvelden' }]);
      var valg = '80', brett = [], merket = {}, meldt = {};
      function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
      function pott(v){
        if (v === 'kvelden') return B.kvelden.map(function(t){ return { t:t }; });
        var eras = v === 'blandet' ? (B.blandet ? [B.blandet] : B.eras) : B.eras.filter(function(e){ return e.id === v; });
        var sett = {}, ut = [];
        eras.forEach(function(e){ e.songs.forEach(function(s){ var k=s[0]+'|'+s[1]; if (!sett[k]){ sett[k]=1; ut.push({ a:s[0], t:s[1] }); } }); });
        return ut;
      }
      function nyttBrett(){
        var p = pott(valg).slice();
        for (var i=p.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var x=p[i]; p[i]=p[j]; p[j]=x; }
        brett = p.slice(0,16); merket = {}; meldt = {};
      }
      var LINJER = [];
      for (var r=0;r<4;r++){ LINJER.push([r*4,r*4+1,r*4+2,r*4+3]); LINJER.push([r,r+4,r+8,r+12]); }
      LINJER.push([0,5,10,15]); LINJER.push([3,6,9,12]);
      function sjekk(){
        var nye = 0;
        LINJER.forEach(function(l,i){ if (!meldt[i] && l.every(function(k){ return merket[k]; })){ meldt[i]=1; nye++; } });
        var fullt = Object.keys(merket).length === 16;
        return fullt ? (EN ? 'BINGO! Everyone else finishes their drink.' : 'BINGO! Alle andre drikker opp.') : (nye ? (EN ? 'Line! Hand out two sips.' : 'Rekke! Del ut to slurker.') : '');
      }
      function liste(){
        if (valg === 'kvelden') return '';
        var eras = valg === 'blandet' ? (B.blandet ? [B.blandet] : B.eras) : B.eras.filter(function(e){ return e.id === valg; });
        return eras.map(function(e){
          var tekst = e.songs.map(function(s){ return s[0]+' – '+s[1]; }).join('\\n');
          return '<details class="gt-list"><summary>'+(EN ? 'Playlist: ' : 'Spilleliste: ')+esc(e.title)+' ('+e.songs.length+(EN ? ' songs)' : ' låter)')+'</summary>' +
            '<ol>'+e.songs.map(function(s){ return '<li>'+esc(s[0])+' – '+esc(s[1])+'</li>'; }).join('')+'</ol>' +
            '<p class="gt-row"><button class="btn ghost" data-copy="'+esc(tekst)+'">'+(EN ? 'Copy the list' : 'Kopier listen')+'</button>' +
            [].concat(e.spotify || []).map(function(u, i, a){
              return '<a class="btn gold" href="'+esc(u)+'" target="_blank" rel="noopener">'+(a.length > 1 ? (EN ? 'Spotify part ' : 'Spotify del ')+(i+1) : (EN ? 'Open in Spotify' : 'Åpne i Spotify'))+' ↗</a>';
            }).join('') + '</p></details>';
        }).join('');
      }
      function tegn(melding){
        body.innerHTML =
          '<div class="gt-modes">' + VALG.map(function(m){
            return '<button class="gt-mode" data-v="'+m.v+'" aria-pressed="'+(m.v===valg)+'">'+esc(m.t)+'</button>'; }).join('') + '</div>' +
          '<div class="gt-bingo">' + brett.map(function(s,k){
            return '<button class="gt-cell'+(merket[k]?' on':'')+'" data-c="'+k+'"><b>'+esc(s.t)+'</b>'+(s.a?'<span>'+esc(s.a)+'</span>':'')+'</button>'; }).join('') + '</div>' +
          '<p class="gt-msg" role="status">'+(melding||'&nbsp;')+'</p>' +
          '<button class="btn gold vp-big" data-a="nytt">'+(EN ? 'New card' : 'Nytt brett')+'</button>' + liste();
      }
      body.addEventListener('click', function (e) {
        var b = e.target.closest('button'); if (!b) return;
        if (b.dataset.v){ valg = b.dataset.v; nyttBrett(); return tegn(); }
        if (b.dataset.c !== undefined){ var k=+b.dataset.c; if (merket[k]) delete merket[k]; else merket[k]=1; return tegn(sjekk()); }
        if (b.dataset.a === 'nytt'){ nyttBrett(); tegn(); }
      });
      nyttBrett(); tegn();
    })();
    })();<\/script></section>`}${deck && deck.kind === "wheel" && renderTemplate`<section class="gt" data-gt="wheel"><h2>${deck.title}</h2><div class="gt-body"></div><script data-astro-rerun>(function(){${defineScriptVars({
		D: deck,
		EN
	})}
    (function () {
      var root = document.currentScript.closest('.gt');
      var body = root.querySelector('.gt-body');
      if (root.dataset.bound) return; root.dataset.bound = '1';
      var N = D.items.length, SEG = 360 / N, vinkel = 0, snurrer = false;
      var FARGER = [['#C8FF2E','#1a0f08'],['#2a2014','#F5F0FF'],['#FF5B1F','#1a0f08']];
      function p(a, r){ var t = a * Math.PI / 180; return (Math.sin(t)*r).toFixed(2)+' '+(-Math.cos(t)*r).toFixed(2); }
      function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
      var deler = D.items.map(function(x,i){
        var a0 = i*SEG, a1 = a0+SEG, c = a0+SEG/2, f = FARGER[i % 3];
        return '<path d="M0 0 L'+p(a0,96)+' A96 96 0 0 1 '+p(a1,96)+' Z" fill="'+f[0]+'" stroke="#120A1D" stroke-width="1"/>' +
          // venstre halvdel snus, så teksten aldri står opp ned
          (c > 180
            ? '<text transform="rotate('+(c+90)+') translate(-31 0)" text-anchor="end"'
            : '<text transform="rotate('+(c-90)+') translate(31 0)"') +
          ' dominant-baseline="middle" fill="'+f[1]+'" font-size="7.4" font-weight="700" font-family="Archivo Variable, Archivo, sans-serif">'+esc(x.t)+'</text>';
      }).join('');
      body.innerHTML =
        '<div class="gt-wheel"><svg class="gt-pointer" viewBox="0 0 20 16" aria-hidden="true"><path d="M0 0 H20 L10 16 Z" fill="#F5F0FF"/></svg>' +
        '<svg class="gt-disc" viewBox="-100 -100 200 200" role="img" aria-label="'+(EN ? 'Drinking wheel' : 'Drikkehjul')+'"><g class="gt-rot">'+deler+'</g>' +
        '<circle r="14" fill="#120A1D" stroke="#C8FF2E" stroke-width="2"/></svg></div>' +
        '<p class="gt-result" role="status">&nbsp;</p><p class="gt-desc small">&nbsp;</p>' +
        '<button class="btn gold vp-big" data-a="snurr">'+(EN ? 'Spin' : 'Snurr')+'</button>';
      var rot = body.querySelector('.gt-rot'), res = body.querySelector('.gt-result'), desc = body.querySelector('.gt-desc');
      body.querySelector('[data-a=snurr]').addEventListener('click', function(){
        if (snurrer) return; snurrer = true;
        var i = Math.floor(Math.random()*N), senter = i*SEG + SEG/2 + (Math.random()-0.5)*SEG*0.6;
        var maal = (360 - senter) % 360, naa = ((vinkel % 360) + 360) % 360;
        vinkel += 5*360 + ((maal - naa + 360) % 360);
        res.innerHTML = '&nbsp;'; desc.innerHTML = '&nbsp;';
        rot.style.transform = 'rotate('+vinkel+'deg)';
        setTimeout(function(){ res.textContent = D.items[i].r || D.items[i].t; desc.textContent = D.items[i].d; snurrer = false; }, 3300);
      });
    })();
    })();<\/script></section>`}${deck && deck.kind === "forraeder" && renderTemplate`<section class="gt fr" data-gt="forraeder"><h2>${deck.title}</h2><div class="gt-body"></div><script data-astro-rerun>(function(){${defineScriptVars({
		D: deck,
		EN
	})}
    (function () {
      var root = document.currentScript.closest('.gt');
      var body = root.querySelector('.gt-body');
      if (root.dataset.bound) return; root.dataset.bound = '1';
      var mode = 'snill', order = [], pos = 0, sann = true;
      function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
      function stokk(){
        order = D.items.filter(function(x){ return mode === '*' || x.m === mode; });
        for (var i=order.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=order[i]; order[i]=order[j]; order[j]=t; }
        pos = 0;
      }
      function valg(){
        return '<div class="gt-modes">' + D.modes.concat([{v:'*',t: EN ? 'All' : 'Alle'}]).map(function(m){
          return '<button class="gt-mode" data-m="'+m.v+'" aria-pressed="'+(m.v===mode)+'">'+esc(m.t)+'</button>'; }).join('') + '</div>';
      }
      function klar(){
        body.innerHTML = valg() + '<div class="gt-card vp-center"><p class="gt-count">' + (EN ? 'Card ' : 'Kort ') + (pos+1) + (EN ? ' of ' : ' av ') + order.length + '</p>' +
          (EN ? '<p class="gt-text">Hand the phone to whoever\\'s turn it is.</p><p class="small">Don\\'t let the others see the screen.</p></div>'
              : '<p class="gt-text">Gi telefonen til den som står for tur.</p><p class="small">Ikke la de andre se skjermen.</p></div>') +
          '<button class="btn gold vp-big" data-a="hemmelig">' + (EN ? 'I\\'m ready' : 'Jeg er klar') + '</button>';
      }
      function hemmelig(){
        sann = Math.random() < 0.5;
        body.innerHTML = '<div class="gt-card"><p class="gt-count">' + (EN ? 'Just for you' : 'Bare for deg') + '</p><p class="gt-text">' + esc(order[pos].t) + '</p>' +
          '<p class="fr-ordre ' + (sann ? 'sann' : 'logn') + '">' + (sann ? (EN ? 'Tell the truth' : 'Si sannheten') : (EN ? 'Lie' : 'Lyv')) + '</p>' +
          '<p class="small">' + (sann ? (EN ? 'Finish the sentence with something that\\'s actually true.' : 'Fullfør setningen med noe som faktisk er sant.') : (EN ? 'Make up something believable – and keep a straight face.' : 'Dikt opp noe troverdig – og hold maska.')) + '</p></div>' +
          '<button class="btn gold vp-big" data-a="offentlig">' + (EN ? 'Hide it and show the others' : 'Skjul og vis de andre') + '</button>';
      }
      function offentlig(){
        body.innerHTML = '<div class="gt-card"><p class="gt-count">' + (EN ? 'Tell' : 'Fortell') + '</p><p class="gt-text">' + esc(order[pos].t) + '</p>' +
          '<p class="small">' + (EN ? 'Everyone else gets to ask one question each. Then vote on three: truth or lie?' : 'Alle andre får stille ett spørsmål hver. Så stemmer dere på tre: sant eller løgn?') + '</p></div>' +
          '<button class="btn gold vp-big" data-a="avslor">' + (EN ? 'Reveal' : 'Avslør') + '</button>';
      }
      function avslor(){
        body.innerHTML = '<div class="gt-card vp-center"><p class="gt-count">' + (EN ? 'The answer' : 'Svaret') + '</p>' +
          '<p class="fr-ordre ' + (sann ? 'sann' : 'logn') + '">' + (sann ? (EN ? 'It was true' : 'Det var sant') : (EN ? 'It was a lie' : 'Det var løgn')) + '</p>' +
          (EN ? '<p>Voted wrong: drink two.<br>Everyone guessed right: the storyteller drinks three.</p></div>' : '<p>Stemte du feil: drikk to.<br>Gjettet alle riktig: fortelleren drikker tre.</p></div>') +
          '<button class="btn gold vp-big" data-a="neste">' + (EN ? 'Next person' : 'Neste person') + '</button>';
      }
      body.addEventListener('click', function(e){
        var b = e.target.closest('button'); if (!b) return;
        if (b.dataset.m){ mode = b.dataset.m; stokk(); return klar(); }
        var a = b.dataset.a;
        if (a === 'hemmelig') hemmelig();
        else if (a === 'offentlig') offentlig();
        else if (a === 'avslor') avslor();
        else if (a === 'neste'){ pos++; if (pos >= order.length) stokk(); klar(); }
      });
      stokk(); klar();
    })();
    })();<\/script></section>`}${deck && deck.kind === "aar" && renderTemplate`<section class="gt" data-gt="aar"><h2>${deck.title}</h2><div class="gt-body"></div><script data-astro-rerun>(function(){${defineScriptVars({
		B: aarData,
		EN
	})}
    (function () {
      var root = document.currentScript.closest('.gt');
      var body = root.querySelector('.gt-body');
      if (root.dataset.bound) return; root.dataset.bound = '1';
      var VALG = B.eras.map(function(e){ return { v:e.id, t:e.title }; }).concat([{ v:'blandet', t: EN ? 'Mixed' : 'Blandet' }]);
      var valg = 'blandet', order = [], pos = 0;
      function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
      function stokk(){
        var eras = valg === 'blandet' ? B.eras : B.eras.filter(function(e){ return e.id === valg; }), sett = {};
        order = [];
        eras.forEach(function(e){ e.songs.forEach(function(s){
          if (s.length > 2 && !sett[s[0]+s[1]]){ sett[s[0]+s[1]] = 1; order.push({ a:s[0], t:s[1], y:s[2], i:s[3] || '' }); } }); });
        for (var i=order.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var x=order[i]; order[i]=order[j]; order[j]=x; }
        pos = 0;
      }
      function tegn(vis){
        var s = order[pos];
        var spotify = 'https://open.spotify.com/search/' + encodeURIComponent(s.a + ' ' + s.t);
        body.innerHTML = '<div class="gt-modes">' + VALG.map(function(m){
            return '<button class="gt-mode" data-v="'+m.v+'" aria-pressed="'+(m.v===valg)+'">'+esc(m.t)+'</button>'; }).join('') + '</div>' +
          '<div class="gt-card"><p class="gt-count">' + (pos+1) + ' / ' + order.length + '</p>' +
          '<p class="gt-text">' + esc(s.t) + '</p><p class="aar-artist">' + esc(s.a) + '</p>' +
          (vis ? '<p class="aar-aar">' + s.y + '</p>' + (s.i ? '<p class="small">' + esc(s.i) + '</p>' : '') : '') + '</div>' +
          '<div class="gt-row"><a class="btn ghost" href="' + spotify + '" target="_blank" rel="noopener">' + (EN ? 'Play on Spotify' : 'Spill av på Spotify') + ' ↗</a></div>' +
          (vis ? '<button class="btn gold vp-big" data-a="neste">' + (EN ? 'Next song' : 'Neste låt') + '</button>'
               : '<button class="btn gold vp-big" data-a="vis">' + (EN ? 'Show the year' : 'Vis året') + '</button>') +
          '<p class="small aar-regel">' + (EN ? 'Right year: hand out three · one year off: hand out one · otherwise one sip for every five years you were off, max three.' : 'Riktig år: del ut tre · ett år unna: del ut én · ellers én slurk per fem år du bommet, maks tre.') + '</p>';
      }
      body.addEventListener('click', function(e){
        var b = e.target.closest('button'); if (!b) return;
        if (b.dataset.v){ valg = b.dataset.v; stokk(); return tegn(false); }
        if (b.dataset.a === 'vis') tegn(true);
        if (b.dataset.a === 'neste'){ pos++; if (pos >= order.length) stokk(); tegn(false); }
      });
      stokk(); tegn(false);
    })();
    })();<\/script></section>`}${deck && deck.kind === "ringoffire" && renderTemplate`<section class="gt rof" data-gt="ringoffire"><h2>${en ? "Play with the phone as the deck" : "Spill med telefonen som kortstokk"}</h2><p class="small">${en ? "No deck of cards? Put the phone in the middle of the table and draw from here. Type in the names and it'll tell you whose turn it is to draw." : "Ingen kortstokk? Legg telefonen midt på bordet og trekk herfra. Skriv inn navnene, så sier den hvem som skal trekke."}</p><label class="rof-lab" for="rofNavn">${en ? "Players (optional, separate with commas)" : "Spillere (valgfritt, skill med komma)"}</label><input class="rof-inp" id="rofNavn" type="text" autocomplete="off"${addAttribute(en ? "Alex, Sam, Jamie" : "Jonas, Maria, Petter", "placeholder")}><button class="btn gold rof-start" type="button" data-rof="start">${en ? "Start game mode" : "Start spillmodus"}</button><div class="rof-full" hidden role="dialog" aria-modal="true" aria-label="Ring of Fire"><div class="rof-top"><button class="rof-x" data-rof="lukk"${addAttribute(en ? "End the game" : "Avslutt leken", "aria-label")}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12"></path><path d="M18 6 6 18"></path></svg></button><div class="rof-status"><b>Ring of Fire</b><span class="rof-igjen"></span></div><span class="rof-x" aria-hidden="true"></span></div><div class="rof-tur"><span>${en ? "Your turn" : "Din tur"}</span><b class="rof-navn"></b></div><div class="rof-kort" aria-live="polite"><div class="rof-hj rof-hj1"><b class="rof-v"></b><span class="rof-s"></span></div><div class="rof-midt"><b class="rof-regel"></b><span class="rof-tekst"></span></div><div class="rof-hj rof-hj2"><b class="rof-v"></b><span class="rof-s"></span></div></div><div class="rof-spillere"></div><button class="rof-trekk" data-rof="trekk">${en ? "Draw the next card" : "Trekk neste kort"}</button></div><script data-astro-rerun>(function(){${defineScriptVars({
		D: deck,
		EN
	})}
    (function () {
      var root = document.currentScript.closest('.gt');
      if (root.dataset.bound) return; root.dataset.bound = '1';
      var full = root.querySelector('.rof-full'), inp = root.querySelector('.rof-inp');
      var SORTER = [['♥', 1], ['♦', 1], ['♠', 0], ['♣', 0]];
      var VERDIER = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
      var stokk = [], konger = 0, spillere = [], tur = -1, trukket = 0;
      try { inp.value = localStorage.getItem('bd_spillere') || ''; } catch (e) {}
      function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
      function nyStokk() {
        stokk = [];
        SORTER.forEach(function (s) { VERDIER.forEach(function (v) { stokk.push({ v: v, s: s[0], rod: s[1] }); }); });
        for (var i = stokk.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var x = stokk[i]; stokk[i] = stokk[j]; stokk[j] = x; }
        konger = 0; trukket = 0;
      }
      function status() {
        root.querySelector('.rof-igjen').textContent = EN
          ? stokk.length + ' cards left · ' + konger + (konger === 1 ? ' king' : ' kings') + ' drawn'
          : stokk.length + ' kort igjen · ' + konger + (konger === 1 ? ' konge' : ' konger') + ' trukket';
      }
      function visSpillere() {
        root.querySelector('.rof-spillere').innerHTML = spillere.map(function (n, i) {
          return '<span class="' + (i === tur ? 'on' : '') + '">' + esc(n) + '</span>';
        }).join('');
        var navn = root.querySelector('.rof-navn');
        navn.textContent = spillere.length ? spillere[tur] : '';
        root.querySelector('.rof-tur').hidden = !spillere.length;
      }
      function trekk() {
        if (!stokk.length) nyStokk();
        var k = stokk.pop(); trukket++;
        if (spillere.length) tur = (tur + 1) % spillere.length;
        var info = D.kort[k.v], navn = info[0], tekst = info[1];
        if (k.v === 'K') {
          konger++;
          var slurker = D.konger[Math.min(konger, D.konger.length) - 1];
          var nr = (EN ? ['First', 'Second', 'Third', 'Fourth'] : ['Første', 'Andre', 'Tredje', 'Fjerde'])[konger - 1] || (EN ? 'Next' : 'Neste');
          navn = nr + (EN ? ' king' : ' konge');
          tekst = (EN ? 'Drink ' : 'Drikk ') + slurker + (EN ? ' sips.' : ' slurker.') + (konger === 4 ? (EN ? ' That was the last king!' : ' Det var siste konge!') : '');
        }
        var kort = root.querySelector('.rof-kort');
        kort.classList.toggle('rod', !!k.rod);
        kort.querySelectorAll('.rof-v').forEach(function (e) { e.textContent = EN ? k.v : (k.v === 'J' ? 'Kn' : (k.v === 'Q' ? 'D' : k.v)); });
        kort.querySelectorAll('.rof-s').forEach(function (e) { e.textContent = k.s; });
        root.querySelector('.rof-regel').textContent = navn;
        root.querySelector('.rof-tekst').textContent = tekst;
        kort.classList.remove('flipp'); void kort.offsetWidth; kort.classList.add('flipp');
        root.querySelector('.rof-trekk').textContent = stokk.length ? (EN ? 'Draw the next card' : 'Trekk neste kort') : (EN ? 'Shuffle and start over' : 'Stokk og start på nytt');
        status(); visSpillere();
      }
      root.addEventListener('click', function (e) {
        var b = e.target.closest('[data-rof]'); if (!b) return;
        var a = b.dataset.rof;
        if (a === 'start') {
          spillere = inp.value.split(',').map(function (s) { return s.trim(); }).filter(Boolean).slice(0, 20);
          try { localStorage.setItem('bd_spillere', inp.value); } catch (err) {}
          tur = -1; nyStokk();
          full.hidden = false; document.body.classList.add('noscroll');
          trekk();
        }
        if (a === 'trekk') trekk();
        if (a === 'lukk') { full.hidden = true; document.body.classList.remove('noscroll'); }
      });
      full.addEventListener('keydown', function (e) { if (e.key === 'Escape') { full.hidden = true; document.body.classList.remove('noscroll'); } });
    })();
    })();<\/script></section>`}`;
}, "C:/Users/jonas/Documents/GitHub/banterdeck/src/components/GameTool.astro", void 0);
//#endregion
//#region src/lib/romlenke.ts
var ROMLEK = {
	"nyhetsrunden": "nyhetsrunden",
	"bussruta": "bussruta",
	"drikke-yatzy": "yatzy",
	"over-eller-under": "overunder",
	"veddelopet": "veddelopet",
	"pyramiden": "pyramiden",
	"president": "president",
	"gris": "gris",
	"to-sannheter-og-en-logn": "tosannheter",
	"regelfabrikken": "regelfabrikken",
	"forraeder": "forraeder",
	"drikke-bingo": "bingo",
	"ring-of-fire": "ring-of-fire",
	"pekeleken": "pekeleken",
	"jeg-har-aldri": "jeg-har-aldri",
	"enten-eller": "enten-eller",
	"kategorier": "kategorier",
	"nodt-eller-sannhet": "nodt-eller-sannhet",
	"rygg-mot-rygg": "rygg-mot-rygg",
	"duoleken": "duoleken",
	"50-50": "50-50",
	"sannhet-eller-drikk": "sannhet-eller-drikk",
	"tanken-bak-sangen": "tanken-bak-sangen",
	"hvem-skrev-det": "hvemskrev",
	"bloffquizen": "bloff",
	"samme-svar": "samme",
	"spionen": "spion",
	"hvem-er-jeg": "pannekort",
	"skal-refleksen": "skal"
};
/** Lenke til rommet med leken valgt. Norsk: /no/rom, engelsk: /room – samme spørreparametre. */
function romLenke(slug, modus = "", lang = "no") {
	const lek = ROMLEK[slug];
	const base = lang === "en" ? "/room" : "/no/rom";
	return lek ? `${base}?lek=${encodeURIComponent(lek)}${modus ? "&modus=" + encodeURIComponent(modus) : ""}` : base;
}
//#endregion
//#region src/components/KortVelger.astro
var $$KortVelger = createComponent(($$result, $$props, $$slots) => {
	return renderTemplate`<script>
(function () {
  if (window.BDVelgKort) return;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  // Språket leses ved hvert kall – sidenavigasjonen bytter <html lang> mellom norsk og engelsk.
  function T(no, en) { return document.documentElement.lang === 'en' ? en : no; }
  window.BDVelgKort = function (opts) {
    opts = opts || {};
    var maks = opts.maks || 100, K = window.BDKonto, KONTO = T('/no/account', '/account');
    return new Promise(function (ferdig) {
      var m = document.createElement('div'); m.className = 'rom-tavle kv-velger'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-label', T('Velg kort', 'Pick cards'));
      m.innerHTML = '<div class="rom-tavle-innhold"><div class="rom-tavle-topp"><h2>' + T('Ta med kort', 'Bring cards') + '</h2><button class="linkbtn" data-v="lukk" type="button">' + T('Lukk', 'Close') + '</button></div><div class="kv-velger-body"><p class="small">' + T('Henter kortstokkene dine …', 'Fetching your decks …') + '</p></div></div>';
      document.body.appendChild(m);
      var body = m.querySelector('.kv-velger-body'), stokker = [];
      function lukk(kort) { m.remove(); ferdig(kort || []); }
      function valgte() { return Array.prototype.map.call(m.querySelectorAll('input[data-kort]:checked'), function (x) { return x.value; }); }
      function tell() {
        var n = valgte().length, b = m.querySelector('[data-v=ok]');
        if (b) { b.textContent = n ? T('Legg til ' + n + ' kort', 'Add ' + n + (n === 1 ? ' card' : ' cards')) : T('Velg kort', 'Pick cards'); b.disabled = !n || n > maks; }
        var i = m.querySelector('.kv-velger-info'); if (i) i.textContent = n > maks ? T('Du kan ta med maks ' + maks + ' kort.', 'You can bring up to ' + maks + ' cards.') : '';
      }
      m.addEventListener('click', function (e) {
        if (e.target === m) return lukk();
        var b = e.target.closest('[data-v]'); if (!b) return;
        if (b.dataset.v === 'lukk') return lukk();
        if (b.dataset.v === 'ok') return lukk(valgte().slice(0, maks));
        if (b.dataset.v === 'alle') {
          var boks = m.querySelectorAll('input[data-stokk="' + b.dataset.i + '"]'), paa = Array.prototype.some.call(boks, function (x) { return !x.checked; });
          boks.forEach(function (x) { x.checked = paa; }); tell();
        }
      });
      m.addEventListener('change', tell);
      if (!K || !K.les()) {
        body.innerHTML = T('<p>Logg inn for å bruke kortstokkene dine. Du kan også lage en kortstokk på forhånd under «Min stokk».</p>', '<p>Log in to use your decks. You can also make a deck in advance under “My deck”.</p>') + '<p><a class="btn gold" href="' + KONTO + '">' + T('Logg inn eller lag konto', 'Log in or create an account') + '</a></p>';
        return;
      }
      K.stokker.liste().then(function (l) {
        stokker = l || [];
        if (!stokker.length) { body.innerHTML = '<p>' + T('Du har ingen lagrede kortstokker ennå.', "You don't have any saved decks yet.") + '</p><p><a class="btn gold" href="' + KONTO + '">' + T('Lag en kortstokk', 'Make a deck') + '</a></p>'; return; }
        body.innerHTML = stokker.map(function (s, i) {
          return '<details class="kv-stokk"' + (i === 0 ? ' open' : '') + '><summary><b>' + esc(s.navn) + '</b><span>' + (s.kort || []).length + T(' kort', ' cards') + '</span></summary>' +
            '<button class="mini" type="button" data-v="alle" data-i="' + i + '">' + T('Velg alle / ingen', 'Select all / none') + '</button>' +
            '<ul>' + (s.kort || []).map(function (k) { return '<li><label><input type="checkbox" data-kort data-stokk="' + i + '" value="' + esc(k) + '"> ' + esc(k) + '</label></li>'; }).join('') + '</ul></details>';
        }).join('') + '<p class="small kv-velger-info" role="status"></p><button class="btn gold" type="button" data-v="ok" disabled>' + T('Velg kort', 'Pick cards') + '</button>';
      }).catch(function () { body.innerHTML = '<p class="rom-feil">' + T('Fikk ikke hentet kortstokkene.', "Couldn't fetch your decks.") + '</p>'; });
    });
  };
  /** Lagre kort som en ny kortstokk – på kontoen, eller til side til man logger inn. */
  window.BDLagreKort = function (navn, kort) {
    var K = window.BDKonto;
    return (K ? K.bruker() : Promise.resolve(null)).then(function (u) {
      if (!u) {
        try { localStorage.setItem('bd_stokk_utkast', JSON.stringify({ navn: navn, kort: kort.slice(0, 300) })); } catch (e) {}
        return 'utkast';
      }
      return K.stokker.lagre({ navn: navn, kort: kort }).then(function () { return 'lagret'; });
    });
  };
})();
<\/script>`;
}, "C:/Users/jonas/Documents/GitHub/banterdeck/src/components/KortVelger.astro", void 0);
//#endregion
//#region src/components/DigitalLek.astro
createAstro("https://www.mittvors.no");
var $$DigitalLek = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$DigitalLek;
	const { slug, lang = "no" } = Astro.props;
	const en = lang === "en";
	const DIGITALE = [
		"over-eller-under",
		"fuck-the-dealer",
		"krig",
		"veddelopet",
		"bussruta",
		"terningen-bestemmer",
		"21-med-terninger",
		"opus",
		"regelfabrikken",
		"power-hour",
		"snurr-flasken",
		"drikke-yatzy",
		"beer-pong",
		"rask-fakta",
		"to-sannheter-og-en-logn",
		"jug",
		"14-sporsmal",
		"bossen-sier",
		"stilleleken"
	];
	const RomLeker = [
		"regelfabrikken",
		"over-eller-under",
		"veddelopet",
		"pyramiden",
		"president",
		"gris",
		"to-sannheter-og-en-logn",
		"bussruta",
		"drikke-yatzy"
	];
	const har = DIGITALE.includes(slug);
	const romHref = romLenke(slug, "", en ? "en" : "no");
	const bareRom = [
		"pyramiden",
		"president",
		"gris"
	].includes(slug);
	const overskrift = bareRom ? en ? "Play without a deck of cards" : "Spill uten kortstokk" : (en ? {
		"terningen-bestemmer": "The phone is the die",
		"21-med-terninger": "The phone is the dice",
		"opus": "The phone is the die",
		"drikke-yatzy": "The phone is the dice and the scorecard",
		"regelfabrikken": "Write the cards",
		"power-hour": "The clock",
		"snurr-flasken": "The phone is the bottle",
		"beer-pong": "Cup counter",
		"rask-fakta": "Five seconds",
		"to-sannheter-og-en-logn": "Write and reveal",
		"jug": "The host's secret draw",
		"14-sporsmal": "The rule board",
		"bossen-sier": "The boss machine",
		"stilleleken": "The phone is listening"
	} : {
		"terningen-bestemmer": "Telefonen er terningen",
		"21-med-terninger": "Telefonen er terningen",
		"opus": "Telefonen er terningen",
		"drikke-yatzy": "Telefonen er terningene og blokka",
		"regelfabrikken": "Skriv kortene",
		"power-hour": "Klokka",
		"snurr-flasken": "Telefonen er flaska",
		"beer-pong": "Koppteller",
		"rask-fakta": "Fem sekunder",
		"to-sannheter-og-en-logn": "Skriv og avslør",
		"jug": "Vertens hemmelige trekk",
		"14-sporsmal": "Regeltavla",
		"bossen-sier": "Boss-maskinen",
		"stilleleken": "Telefonen lytter"
	})[slug] || (en ? "The phone is the deck" : "Telefonen er kortstokken");
	const romNavn = en ? t((games.find((g) => g.slug === slug) || {}).name, "en") : slug === "pyramiden" ? "Pyramiden" : slug === "president" ? "President" : "Gris";
	return renderTemplate`${(har || bareRom) && renderTemplate`${maybeRenderHead($$result)}<section class="gt dl"${addAttribute(slug, "data-dl")}><h2>${overskrift}</h2>${bareRom ? en ? renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": ($$result) => renderTemplate`<p>In this one everyone has hidden cards in their hand, so you each play from your own phone. Create a room, share the code and pick ${romNavn}.</p><p><a class="btn gold"${addAttribute(romHref, "href")}>Create a room</a></p>` })}` : renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": ($$result) => renderTemplate`<p>Her har hver spiller skjulte kort på hånda, så dere spiller fra hver deres telefon. Lag et rom, del koden og velg ${romNavn}.</p><p><a class="btn gold"${addAttribute(romHref, "href")}>Lag et rom</a></p>` })}` : renderTemplate`<div class="dl-body"></div>`}${RomLeker.includes(slug) && !bareRom && (en ? renderTemplate`<p class="small dl-romtips">Want to play from your own phones? <a${addAttribute(romHref, "href")}>Create a room for this game</a>.</p>` : renderTemplate`<p class="small dl-romtips">Vil dere spille fra hver sin telefon? <a${addAttribute(romHref, "href")}>Lag et rom for leken</a>.</p>`)}</section>`}${har && renderTemplate`<script data-astro-rerun>
/* Felles hjelpere for kort og terninger – defineres én gang */
if (!window.BDK) window.BDK = (function () {
  function bland(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function stokk(utenEss) {
    var s = [];
    ['♥', '♦', '♠', '♣'].forEach(function (f) { for (var v = 2; v <= 14; v++) if (!(utenEss && v === 14)) s.push({ v: v, f: f }); });
    return bland(s);
  }
  function erEn() { return document.documentElement.lang === 'en'; }
  function T(no, en) { return erEn() ? en : no; }
  function vn(v) { return v <= 10 ? String(v) : (erEn() ? { 11: 'J', 12: 'Q', 13: 'K', 14: 'A' } : { 11: 'Kn', 12: 'D', 13: 'K', 14: 'A' })[v]; }
  function rod(k) { return k.f === '♥' || k.f === '♦'; }
  function kort(k, kl) {
    if (!k) return '<span class="kk tom ' + (kl || '') + '"></span>';
    return '<span class="kk ' + (rod(k) ? 'rod ' : '') + (kl || '') + '"><b>' + vn(k.v) + '</b><i>' + k.f + '</i></span>';
  }
  function bakside(kl) { return '<span class="kk bak ' + (kl || '') + '"></span>'; }
  var PRIKKER = { 1: [5], 2: [1, 9], 3: [1, 5, 9], 4: [1, 3, 7, 9], 5: [1, 3, 5, 7, 9], 6: [1, 3, 4, 6, 7, 9] };
  function terning(n) {
    var s = '<span class="dice" data-n="' + n + '" aria-label="' + T('Terning viser ', 'Die showing ') + n + '">';
    for (var i = 1; i <= 9; i++) s += '<i' + (PRIKKER[n].indexOf(i) !== -1 ? ' class="p"' : '') + '></i>';
    return s + '</span>';
  }
  /* Spinner terningene i et lite øyeblikk før de lander */
  function kast(el, antall, ferdig) {
    var slutt = []; for (var i = 0; i < antall; i++) slutt.push(1 + Math.floor(Math.random() * 6));
    var redusert = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var runder = redusert ? 0 : 9, r = 0;
    el.classList.add('spinner');
    (function steg() {
      if (r < runder) {
        el.innerHTML = slutt.map(function () { return terning(1 + Math.floor(Math.random() * 6)); }).join('');
        r++; return setTimeout(steg, 55 + r * 8);
      }
      el.classList.remove('spinner');
      el.innerHTML = slutt.map(terning).join('');
      ferdig(slutt);
    })();
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function navn(inp) { return inp.value.split(',').map(function (s) { return s.trim(); }).filter(Boolean).slice(0, 12); }
  function husk(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function hent(k) { try { return localStorage.getItem(k) || ''; } catch (e) { return ''; } }
  return { T: T, bland: bland, stokk: stokk, vn: vn, kort: kort, bakside: bakside, terning: terning, kast: kast, esc: esc, navn: navn, husk: husk, hent: hent };
})();
<\/script>`}${slug === "over-eller-under" && renderTemplate`<script data-astro-rerun>
(function () {
  var root = document.querySelector('[data-dl="over-eller-under"] .dl-body'); if (!root || root.dataset.bound) return; root.dataset.bound = '1';
  var K = window.BDK, T = K.T, stokk, naa, bunke, melding;
  function start() { stokk = K.stokk(); naa = stokk.pop(); bunke = 1; melding = T('Neste spiller: høyere eller lavere?', 'Next player: higher or lower?'); tegn(); }
  function tegn(sist) {
    root.innerHTML = '<div class="dl-bord">' + K.kort(naa, 'stor' + (sist ? ' inn' : '')) + '</div>' +
      '<p class="dl-melding" aria-live="polite">' + K.esc(melding) + '</p>' +
      '<p class="dl-info">' + T('Bunken', 'Pile') + ': <b>' + bunke + '</b> ' + (bunke === 1 ? T('kort', 'card') : T('kort', 'cards')) + ' · ' + stokk.length + T(' igjen i stokken', ' left in the deck') + '</p>' +
      '<div class="dl-knapper"><button class="btn gold" data-v="over">' + T('Høyere', 'Higher') + ' ↑</button><button class="btn gold" data-v="under">' + T('Lavere', 'Lower') + ' ↓</button></div>' +
      '<p class="small">' + T('Ess er høyest. Likt teller som feil.', 'Aces are high. A tie counts as wrong.') + '</p>';
  }
  root.addEventListener('click', function (e) {
    var b = e.target.closest('[data-v]'); if (!b) return;
    if (!stokk.length) { stokk = K.stokk(); }
    var nytt = stokk.pop(), riktig = b.dataset.v === 'over' ? nytt.v > naa.v : nytt.v < naa.v;
    if (riktig) { bunke++; melding = T('Riktig! Turen går videre.', 'Correct! Pass it on.'); }
    else { melding = T('Feil! Drikk ', 'Wrong! Drink ') + bunke + (bunke === 1 ? T(' slurk.', ' sip.') : T(' slurker.', ' sips.')); bunke = 1; }
    naa = nytt; tegn(true);
  });
  start();
})();
<\/script>`}${slug === "fuck-the-dealer" && renderTemplate`<script data-astro-rerun>
(function () {
  var root = document.querySelector('[data-dl="fuck-the-dealer"] .dl-body'); if (!root || root.dataset.bound) return; root.dataset.bound = '1';
  var K = window.BDK, T = K.T, stokk, kortet, forsok, rad, brukt, melding, hint, avslort;
  function start() { stokk = K.stokk(); brukt = {}; rad = 0; nyttKort(); melding = T('Spilleren til venstre for dealeren gjetter.', "The player on the dealer's left guesses."); tegn(); }
  function nyttKort() { if (!stokk.length) { stokk = K.stokk(); brukt = {}; } kortet = stokk.pop(); forsok = 1; hint = ''; avslort = false; }
  function tegn() {
    var verdier = []; for (var v = 2; v <= 14; v++) verdier.push(v);
    root.innerHTML = '<div class="dl-bord">' + (avslort ? K.kort(kortet, 'stor inn') : K.bakside('stor')) + '</div>' +
      '<p class="dl-melding" aria-live="polite">' + K.esc(melding) + (hint ? ' <b class="dl-hint">' + hint + '</b>' : '') + '</p>' +
      (avslort
        ? '<div class="dl-knapper"><button class="btn gold" data-a="neste">' + T('Neste spiller', 'Next player') + '</button></div>'
        : '<p class="dl-info">' + (forsok === 1 ? T('Gjett verdien', 'Guess the value') : T('Gjett én gang til', 'Guess one more time')) + '</p><div class="dl-verdier">' + verdier.map(function (v) {
            var n = brukt[v] || 0;
            return '<button data-g="' + v + '"' + (n >= 4 ? ' disabled' : '') + '><b>' + K.vn(v) + '</b><small>' + (4 - n) + T(' igjen', ' left') + '</small></button>';
          }).join('') + '</div>') +
      '<p class="dl-info">' + T('Dealeren har klart <b>', 'The dealer has survived <b>') + rad + T('</b> av 3 på rad · ', '</b> of 3 in a row · ') + stokk.length + T(' kort igjen', ' cards left') + '</p>';
  }
  root.addEventListener('click', function (e) {
    var g = e.target.closest('[data-g]'), a = e.target.closest('[data-a]');
    if (a) { nyttKort(); melding = T('Neste spiller gjetter.', 'Next player guesses.'); return tegn(); }
    if (!g) return;
    var v = Number(g.dataset.g);
    if (v === kortet.v) {
      melding = forsok === 1 ? T('Rett på første! Dealeren drikker 5.', 'First try! The dealer drinks 5.') : T('Riktig! Dealeren drikker 2.', 'Correct! The dealer drinks 2.');
      rad = 0; avslort = true; brukt[kortet.v] = (brukt[kortet.v] || 0) + 1;
    } else if (forsok === 1) {
      forsok = 2; hint = kortet.v > v ? T('Høyere!', 'Higher!') : T('Lavere!', 'Lower!'); melding = T('Feil.', 'Wrong.');
    } else {
      var diff = Math.abs(kortet.v - v);
      melding = T('Feil igjen – drikk ', 'Wrong again – drink ') + diff + (diff === 1 ? T(' slurk.', ' sip.') : T(' slurker.', ' sips.')); hint = '';
      rad++; avslort = true; brukt[kortet.v] = (brukt[kortet.v] || 0) + 1;
      if (rad >= 3) { melding += T(' Dealeren har klart tre på rad – send telefonen til ny dealer.', ' The dealer survived three in a row – pass the phone to a new dealer.'); rad = 0; }
    }
    tegn();
  });
  start();
})();
<\/script>`}${slug === "krig" && renderTemplate`<script data-astro-rerun>
(function () {
  var root = document.querySelector('[data-dl="krig"] .dl-body'); if (!root || root.dataset.bound) return; root.dataset.bound = '1';
  var K = window.BDK, T = K.T, A, B, na = T('Spiller 1', 'Player 1'), nb = T('Spiller 2', 'Player 2'), vist = null, melding = '';
  function oppsett() {
    root.innerHTML = '<div class="dl-navn"><label for="krA">' + T('Spiller 1', 'Player 1') + '</label><input id="krA" maxlength="20" placeholder="' + T('Navn', 'Name') + '">' +
      '<label for="krB">' + T('Spiller 2', 'Player 2') + '</label><input id="krB" maxlength="20" placeholder="' + T('Navn', 'Name') + '"></div>' +
      '<button class="btn gold" data-a="start">' + T('Del ut', 'Deal') + '</button>';
  }
  function start() {
    var s = K.stokk(); A = s.slice(0, 26); B = s.slice(26); vist = null; melding = T('Trykk for å snu samtidig.', 'Tap to flip at the same time.');
    tegn();
  }
  function tegn() {
    root.innerHTML = '<div class="dl-krig">' +
      '<div><p class="dl-spiller">' + K.esc(na) + '</p>' + (vist ? K.kort(vist.a, 'stor inn') : K.bakside('stor')) + '<p class="dl-info"><b>' + A.length + '</b> ' + T('kort', 'cards') + '</p></div>' +
      '<div><p class="dl-spiller">' + K.esc(nb) + '</p>' + (vist ? K.kort(vist.b, 'stor inn') : K.bakside('stor')) + '<p class="dl-info"><b>' + B.length + '</b> ' + T('kort', 'cards') + '</p></div>' +
      '</div><p class="dl-melding" aria-live="polite">' + K.esc(melding) + '</p>' +
      (A.length && B.length ? '<div class="dl-knapper"><button class="btn gold" data-a="snu">' + T('Snu', 'Flip') + '</button></div>'
        : '<div class="dl-knapper"><button class="btn gold" data-a="start">' + T('Ny runde', 'New round') + '</button></div>');
  }
  function snu() {
    var pott = [], meld = [], a, b, kriger = 0;
    while (true) {
      if (!A.length || !B.length) break;
      a = A.shift(); b = B.shift(); pott.push(a, b);
      if (a.v !== b.v) break;
      kriger++; meld.push(T('KRIG! Begge drikker 2.', 'WAR! Both drink 2.'));
      for (var i = 0; i < 3 && A.length > 1; i++) pott.push(A.shift());
      for (var j = 0; j < 3 && B.length > 1; j++) pott.push(B.shift());
    }
    vist = { a: a, b: b };
    if (a && b && a.v !== b.v) {
      var vinnerA = a.v > b.v, taper = vinnerA ? nb : na;
      (vinnerA ? A : B).push.apply(vinnerA ? A : B, K.bland(pott));
      if (kriger) meld.push(taper + T(' tapte krigen – drikk 3.', ' lost the war – drink 3.'));
      else if ((vinnerA ? a.v : b.v) >= 11) meld.push(taper + T(' mistet et kort til et bildekort – drikk 1.', ' lost a card to a face card – drink 1.'));
      else meld.push((vinnerA ? na : nb) + T(' tar stikket.', ' takes the trick.'));
    }
    if (!A.length || !B.length) meld.push((A.length ? na : nb) + T(' vant hele stokken!', ' won the whole deck!'));
    melding = meld.join(' ');
    tegn();
  }
  root.addEventListener('click', function (e) {
    var b = e.target.closest('[data-a]'); if (!b) return;
    if (b.dataset.a === 'start') {
      var ia = root.querySelector('#krA'), ib = root.querySelector('#krB');
      if (ia) { na = ia.value.trim() || T('Spiller 1', 'Player 1'); nb = ib.value.trim() || T('Spiller 2', 'Player 2'); }
      start();
    }
    if (b.dataset.a === 'snu') snu();
  });
  oppsett();
})();
<\/script>`}${slug === "veddelopet" && renderTemplate`<script data-astro-rerun>
(function () {
  var root = document.querySelector('[data-dl="veddelopet"] .dl-body'); if (!root || root.dataset.bound) return; root.dataset.bound = '1';
  var K = window.BDK, T = K.T, FARGER = ['♥', '♠', '♦', '♣'], LENGDE = 7;
  var FNAVN = T({ '♥': 'Hjerter', '♠': 'Spar', '♦': 'Ruter', '♣': 'Kløver' }, { '♥': 'Hearts', '♠': 'Spades', '♦': 'Diamonds', '♣': 'Clubs' });
  var stokk, bane, snudd, pos, sist, vinner, auto = null, melding;
  function start() {
    stokk = K.stokk(true); bane = stokk.splice(0, LENGDE); snudd = []; pos = { '♥': 0, '♠': 0, '♦': 0, '♣': 0 };
    sist = null; vinner = null; melding = T('Vedd slurker på en farge før start. Snu kort for å kjøre løpet.', 'Bet sips on a suit before the start. Flip cards to run the race.'); tegn();
  }
  function tegn() {
    root.innerHTML = '<div class="dl-bane" style="--lengde:' + (LENGDE + 2) + '">' + FARGER.map(function (f) {
      var celler = '';
      for (var i = 0; i <= LENGDE + 1; i++) celler += '<span class="dl-celle' + (i === LENGDE + 1 ? ' mal' : '') + '">' + (pos[f] === i ? K.kort({ v: 14, f: f }, 'liten' + (vinner === f ? ' vinner' : '')) : '') + '</span>';
      return '<div class="dl-rad">' + celler + '</div>';
    }).join('') +
    '<div class="dl-rad banekort"><span class="dl-celle"></span>' + bane.map(function (k, i) { return '<span class="dl-celle">' + (snudd[i] ? K.kort(k, 'liten') : K.bakside('liten')) + '</span>'; }).join('') + '<span class="dl-celle"></span></div>' +
    '</div>' +
    '<div class="dl-bord">' + (sist ? K.kort(sist, 'stor inn') : '') + '</div>' +
    '<p class="dl-melding" aria-live="polite">' + K.esc(melding) + '</p>' +
    '<div class="dl-knapper">' + (vinner ? '<button class="btn gold" data-a="start">' + T('Nytt løp', 'New race') + '</button>'
      : '<button class="btn gold" data-a="snu">' + T('Snu kort', 'Flip card') + '</button><button class="btn ghost" data-a="auto">' + (auto ? 'Pause' : T('Kjør automatisk', 'Auto-play')) + '</button>') + '</div>';
  }
  function snu() {
    if (vinner) return;
    if (!stokk.length) { stokk = K.stokk(true); }
    sist = stokk.pop(); pos[sist.f]++;
    melding = FNAVN[sist.f] + T(' rykker fram.', ' moves forward.');
    // Når alle hestene har passert et banekort, snus det, og den fargen går ett tilbake
    var minst = Math.min.apply(null, FARGER.map(function (f) { return pos[f]; }));
    for (var i = 0; i < LENGDE; i++) if (!snudd[i] && minst >= i + 1) { snudd[i] = true; var f = bane[i].f; if (pos[f] > 0 && pos[f] <= LENGDE) { pos[f]--; melding += T(' Banekortet er ', ' The track card is ') + K.vn(bane[i].v) + bane[i].f + T(' – den hesten går ett tilbake.', ' – that horse goes back one.'); } }
    FARGER.forEach(function (f) { if (pos[f] >= LENGDE + 1 && !vinner) vinner = f; });
    if (vinner) { melding = FNAVN[vinner] + T(' vant! Riktig veddemål: del ut det dobbelte. Alle andre drikker innsatsen.', ' won! Right bet: hand out double. Everyone else drinks what they bet.'); stopp(); }
    tegn();
  }
  function stopp() { if (auto) { clearInterval(auto); auto = null; } }
  root.addEventListener('click', function (e) {
    var b = e.target.closest('[data-a]'); if (!b) return;
    if (b.dataset.a === 'snu') snu();
    if (b.dataset.a === 'start') start();
    if (b.dataset.a === 'auto') { if (auto) stopp(); else auto = setInterval(snu, 850); tegn(); }
  });
  document.addEventListener('astro:before-swap', stopp, { once: true });
  start();
})();
<\/script>`}${slug === "bussruta" && renderTemplate`<script data-astro-rerun>
(function () {
  var root = document.querySelector('[data-dl="bussruta"] .dl-body'); if (!root || root.dataset.bound) return; root.dataset.bound = '1';
  var K = window.BDK, T = K.T, spillere = [], stokk, fase, sp, steg, melding, pyr, pyrPos, buss, bussMaal = 5, bussRekke = 0, sist;
  var SPORSMAL = T(['Rød eller svart?', 'Over eller under forrige kort?', 'Innenfor eller utenfor de to første?', 'Hvilken kortfarge?'],
    ['Red or black?', 'Higher or lower than the last card?', 'Between or outside the first two?', 'Which suit?']);
  var VALG = [[['rod', T('Rød', 'Red')], ['svart', T('Svart', 'Black')]], [['over', T('Over', 'Higher')], ['under', T('Under', 'Lower')]], [['inn', T('Innenfor', 'Between')], ['ut', T('Utenfor', 'Outside')]], [['♥', '♥'], ['♦', '♦'], ['♠', '♠'], ['♣', '♣']]];
  function oppsett() {
    root.innerHTML = '<label class="rof-lab" for="brNavn">' + T('Spillere (skill med komma)', 'Players (separate with commas)') + '</label><input class="rof-inp" id="brNavn" placeholder="' + T('Jonas, Maria, Petter', 'Alex, Sam, Jamie') + '" value="' + K.esc(K.hent('bd_spillere')) + '">' +
      '<button class="btn gold rof-start" data-a="start">' + T('Start bussruta', 'Start Ride the Bus') + '</button>';
  }
  function trekk() { if (!stokk.length) stokk = K.stokk(); return stokk.pop(); }
  function tegnRunde1() {
    var p = spillere[sp];
    root.innerHTML = '<p class="dl-steg">' + T('Runde 1 av 3 · ', 'Round 1 of 3 · ') + K.esc(p.navn) + T(' · spørsmål ', ' · question ') + (steg + 1) + T(' av 4', ' of 4') + '</p>' +
      '<div class="dl-hand">' + p.hand.map(function (k) { return K.kort(k); }).join('') + K.bakside() + '</div>' +
      (sist ? '<p class="dl-melding" aria-live="polite">' + K.esc(melding) + '</p>' : '') +
      '<p class="dl-sporsmal">' + SPORSMAL[steg] + '</p>' +
      '<div class="dl-knapper">' + VALG[steg].map(function (v) { return '<button class="btn gold" data-v="' + v[0] + '">' + v[1] + '</button>'; }).join('') + '</div>';
  }
  function svar(v) {
    var p = spillere[sp], k = trekk(), h = p.hand, ok;
    if (steg === 0) ok = (v === 'rod') === (k.f === '♥' || k.f === '♦');
    if (steg === 1) ok = v === 'over' ? k.v > h[0].v : k.v < h[0].v;
    if (steg === 2) { var lo = Math.min(h[0].v, h[1].v), hi = Math.max(h[0].v, h[1].v); var inn = k.v > lo && k.v < hi; ok = v === 'inn' ? inn : (k.v < lo || k.v > hi); }
    if (steg === 3) ok = k.f === v;
    h.push(k); sist = k;
    var n = steg + 1;
    melding = K.vn(k.v) + k.f + ' – ' + (ok ? T('riktig! Del ut ', 'correct! Hand out ') + n + '.' : T('feil! Drikk ', 'wrong! Drink ') + n + '.');
    steg++;
    if (steg === 4) { steg = 0; sp++; }
    if (sp >= spillere.length) { fase = 2; pyr = []; for (var i = 0; i < 15; i++) pyr.push(trekk()); pyrPos = 0; melding = T('Alle har fire kort. Nå snus pyramiden, nedenfra og opp.', 'Everyone has four cards. Now the pyramid gets flipped, from the bottom up.'); return tegnRunde2(); }
    tegnRunde1();
  }
  function rad(i) { return i < 5 ? 1 : i < 9 ? 2 : i < 12 ? 3 : i < 14 ? 4 : 5; }
  function tegnRunde2() {
    var rader = [[14], [12, 13], [9, 10, 11], [5, 6, 7, 8], [0, 1, 2, 3, 4]];
    root.innerHTML = '<p class="dl-steg">' + T('Runde 2 av 3 · pyramiden', 'Round 2 of 3 · the pyramid') + '</p><div class="dl-pyramide">' + rader.map(function (r) {
      return '<div>' + r.map(function (i) { return i < pyrPos ? K.kort(pyr[i], 'liten') : K.bakside('liten'); }).join('') + '</div>';
    }).join('') + '</div>' +
      '<p class="dl-melding" aria-live="polite">' + K.esc(melding) + '</p>' +
      '<div class="dl-hender">' + spillere.map(function (p) { return '<div><b>' + K.esc(p.navn) + '</b><span>' + p.hand.map(function (k) { return K.kort(k, 'mini'); }).join('') + '</span></div>'; }).join('') + '</div>' +
      '<div class="dl-knapper"><button class="btn gold" data-a="' + (pyrPos < 15 ? 'pyr' : 'buss') + '">' + (pyrPos < 15 ? T('Snu neste', 'Flip next') : T('Til bussen', 'To the bus')) + '</button></div>';
  }
  function snuPyr() {
    var k = pyr[pyrPos], n = rad(pyrPos), treff = [];
    spillere.forEach(function (p) {
      var i = p.hand.findIndex(function (x) { return x.v === k.v; });
      if (i !== -1) { p.hand.splice(i, 1); treff.push(p.navn); }
    });
    pyrPos++;
    melding = K.vn(k.v) + k.f + T(' (rad ', ' (row ') + n + ') – ' + (treff.length ? treff.join(', ') + T(' legger på og deler ut ', ' play it and hand out ') + n + '.' : T('ingen har den.', 'nobody has it.'));
    tegnRunde2();
  }
  function tilBuss() {
    var maks = Math.max.apply(null, spillere.map(function (p) { return p.hand.length; }));
    var kandidater = spillere.filter(function (p) { return p.hand.length === maks; });
    buss = kandidater[Math.floor(Math.random() * kandidater.length)];
    fase = 3; bussRekke = 0; stokk = K.stokk(); sist = null;
    melding = buss.navn + T(' har flest kort igjen (', ' has the most cards left (') + maks + T(') og kjører bussen! Kom deg forbi ', ') and rides the bus! Get past ') + bussMaal + T(' kort uten bildekort eller ess.', ' cards without a face card or an ace.');
    tegnBuss();
  }
  function tegnBuss() {
    var prikker = ''; for (var i = 0; i < bussMaal; i++) prikker += '<i' + (i < bussRekke ? ' class="ok"' : '') + '></i>';
    root.innerHTML = '<p class="dl-steg">' + T('Runde 3 av 3 · bussen', 'Round 3 of 3 · the bus') + '</p><div class="dl-bord">' + (sist ? K.kort(sist, 'stor inn') : K.bakside('stor')) + '</div>' +
      '<div class="dl-buss">' + prikker + '</div><p class="dl-melding" aria-live="polite">' + K.esc(melding) + '</p>' +
      '<div class="dl-knapper">' + (bussRekke >= bussMaal ? '<button class="btn gold" data-a="start">' + T('Ny runde', 'New round') + '</button>' : '<button class="btn gold" data-a="kjor">' + T('Snu kort', 'Flip card') + '</button>') + '</div>';
  }
  function kjor() {
    sist = trekk();
    var straff = { 11: 1, 12: 2, 13: 3, 14: 4 }[sist.v];
    if (straff) { melding = K.vn(sist.v) + sist.f + ' – ' + buss.navn + T(' drikker ', ' drinks ') + straff + T(' og starter på nytt.', ' and starts over.'); bussRekke = 0; }
    else { bussRekke++; melding = K.vn(sist.v) + sist.f + T(' – trygt! ', ' – safe! ') + (bussRekke >= bussMaal ? buss.navn + T(' er i mål. Bussen er fri!', ' made it. Off the bus!') : (bussMaal - bussRekke) + T(' igjen.', ' to go.')); }
    tegnBuss();
  }
  root.addEventListener('click', function (e) {
    var b = e.target.closest('[data-a],[data-v]'); if (!b) return;
    if (b.dataset.v) return svar(b.dataset.v);
    var a = b.dataset.a;
    if (a === 'start') {
      var inp = root.querySelector('#brNavn');
      if (inp) { var ns = K.navn(inp); if (!ns.length) ns = T(['Spiller 1', 'Spiller 2', 'Spiller 3'], ['Player 1', 'Player 2', 'Player 3']); K.husk('bd_spillere', inp.value); spillere = ns.map(function (n) { return { navn: n, hand: [] }; }); }
      else spillere.forEach(function (p) { p.hand = []; });
      stokk = K.stokk(); fase = 1; sp = 0; steg = 0; sist = null; melding = ''; tegnRunde1();
    }
    if (a === 'pyr') snuPyr();
    if (a === 'buss') tilBuss();
    if (a === 'kjor') kjor();
  });
  oppsett();
})();
<\/script>`}${slug === "terningen-bestemmer" && renderTemplate`<script data-astro-rerun>
(function () {
  var root = document.querySelector('[data-dl="terningen-bestemmer"] .dl-body'); if (!root || root.dataset.bound) return; root.dataset.bound = '1';
  var K = window.BDK, T = K.T;
  var REGLER = T({ 1: 'Del ut én slurk.', 2: 'Ta én slurk selv.', 3: 'Pek på noen som drikker.', 4: 'Alle drikker!', 5: 'Lag en regel som gjelder resten av leken.', 6: 'Velg en utfordring til personen til venstre.' },
    { 1: 'Hand out one sip.', 2: 'Take one sip yourself.', 3: 'Point at someone who drinks.', 4: 'Everyone drinks!', 5: 'Make a rule that lasts for the rest of the game.', 6: 'Pick a challenge for the person on your left.' });
  root.innerHTML = '<div class="dl-terninger">' + K.terning(6) + '</div><p class="dl-melding dl-stor" aria-live="polite">' + T('Trykk på terningen', 'Tap the die') + '</p><div class="dl-knapper"><button class="btn gold" data-a="kast">' + T('Trill', 'Roll') + '</button></div>';
  var t = root.querySelector('.dl-terninger'), m = root.querySelector('.dl-melding'), opptatt = false;
  function kast() { if (opptatt) return; opptatt = true; m.textContent = '…'; K.kast(t, 1, function (r) { m.textContent = r[0] + ' – ' + REGLER[r[0]]; opptatt = false; }); }
  root.addEventListener('click', function (e) { if (e.target.closest('[data-a], .dl-terninger')) kast(); });
})();
<\/script>`}${slug === "21-med-terninger" && renderTemplate`<script data-astro-rerun>
(function () {
  var root = document.querySelector('[data-dl="21-med-terninger"] .dl-body'); if (!root || root.dataset.bound) return; root.dataset.bound = '1';
  var K = window.BDK, T = K.T, sum = 0, ferdig = true, opptatt = false;
  root.innerHTML = '<div class="dl-terninger"></div><p class="dl-sum" aria-live="polite"></p><p class="dl-melding"></p><div class="dl-knapper"></div>';
  var t = root.querySelector('.dl-terninger'), s = root.querySelector('.dl-sum'), m = root.querySelector('.dl-melding'), kn = root.querySelector('.dl-knapper');
  function knapper() {
    kn.innerHTML = ferdig ? '<button class="btn gold" data-a="ny">' + T('Trill to terninger', 'Roll two dice') + '</button>'
      : '<button class="btn gold" data-a="en">' + T('Trill én til', 'Roll one more') + '</button><button class="btn ghost" data-a="stopp">' + T('Stopp på ', 'Stop at ') + sum + '</button>';
  }
  function kast(antall) {
    if (opptatt) return; opptatt = true;
    K.kast(t, antall, function (r) {
      sum += r.reduce(function (a, b) { return a + b; }, 0);
      s.textContent = sum;
      if (sum > 21) { m.textContent = T('Over 21 – drikk med én gang!', 'Over 21 – drink right away!'); ferdig = true; }
      else if (sum === 21) { m.textContent = T('Blank 21! Del ut tre.', 'Exactly 21! Hand out three.'); ferdig = true; }
      else m.textContent = T('Trill én til, eller stopp.', 'Roll one more, or stop.');
      opptatt = false; knapper();
    });
  }
  root.addEventListener('click', function (e) {
    var b = e.target.closest('[data-a]'); if (!b) return;
    if (b.dataset.a === 'ny') { sum = 0; ferdig = false; kast(2); }
    if (b.dataset.a === 'en') kast(1);
    if (b.dataset.a === 'stopp') { ferdig = true; m.textContent = T('Du stoppet på ', 'You stopped at ') + sum + T('. Send telefonen videre. Den som havner lengst unna 21, drikker.', '. Pass the phone on. Whoever ends up furthest from 21 drinks.'); knapper(); }
  });
  t.innerHTML = K.terning(3) + K.terning(4); s.textContent = ''; m.textContent = T('Nærmest 21 uten å gå over.', 'Closest to 21 without going over.'); knapper();
})();
<\/script>`}${slug === "opus" && renderTemplate`<script data-astro-rerun>
(function () {
  var root = document.querySelector('[data-dl="opus"] .dl-body'); if (!root || root.dataset.bound) return; root.dataset.bound = '1';
  var K = window.BDK, T = K.T, laas = null, opptatt = false;
  root.innerHTML = T('<p>Telefonen <b>er</b> terningen. Send selve mobilen rundt i ringen. Er dere mange, åpne siden på flere telefoner og send dem rundt samtidig.</p>',
      '<p>The phone <b>is</b> the die. Pass the phone itself around the circle. If there are lots of you, open this page on a few phones and pass them all around at once.</p>') +
    '<p><a class="btn ghost" href="https://open.spotify.com/search/Opus%20Eric%20Prydz" target="_blank" rel="noopener">' + T('Åpne «Opus» i Spotify', 'Open “Opus” in Spotify') + ' ↗</a></p>' +
    '<button class="btn gold rof-start" data-a="start">' + T('Gjør telefonen til terning', 'Turn the phone into a die') + '</button>' +
    '<div class="op-full" hidden role="dialog" aria-modal="true" aria-label="' + T('Opus-terning', 'Opus die') + '">' +
      '<button class="op-lukk" data-a="lukk" aria-label="' + T('Lukk', 'Close') + '">×</button>' +
      '<button class="op-flate" data-a="kast" aria-label="' + T('Trill terningen', 'Roll the die') + '">' +
        '<span class="dl-terninger">' + K.terning(6) + '</span>' +
        '<b class="op-tekst">' + T('Trykk hvor som helst for å trille', 'Tap anywhere to roll') + '</b>' +
      '</button>' +
    '</div>';
  var full = root.querySelector('.op-full'), flate = root.querySelector('.op-flate'), tekst = root.querySelector('.op-tekst'), t = root.querySelector('.dl-terninger');
  function vaken() { try { if (navigator.wakeLock) navigator.wakeLock.request('screen').then(function (l) { laas = l; }).catch(function () {}); } catch (e) {} }
  function lukk() { full.hidden = true; document.body.classList.remove('noscroll'); try { if (laas) laas.release(); } catch (e) {} laas = null; }
  root.addEventListener('click', function (e) {
    var b = e.target.closest('[data-a]'); if (!b) return;
    if (b.dataset.a === 'start') { full.hidden = false; document.body.classList.add('noscroll'); flate.classList.remove('sekser'); tekst.textContent = T('Trykk hvor som helst for å trille', 'Tap anywhere to roll'); vaken(); }
    if (b.dataset.a === 'lukk') { e.stopPropagation(); lukk(); }
    if (b.dataset.a === 'kast' && !opptatt) {
      opptatt = true; flate.classList.remove('sekser'); tekst.textContent = '…';
      K.kast(t, 1, function (r) {
        opptatt = false;
        if (r[0] === 6) {
          flate.classList.add('sekser'); tekst.textContent = T('SEKSER! Send telefonen videre', 'SIX! Pass the phone on');
          try { if (navigator.vibrate) navigator.vibrate([120, 60, 120]); } catch (e) {}
        } else tekst.textContent = r[0] + T(' – trill igjen!', ' – roll again!');
      });
    }
  });
  document.addEventListener('astro:before-swap', lukk, { once: true });
})();
<\/script>`}${slug === "regelfabrikken" && renderTemplate`${renderComponent($$result, "KortVelger", $$KortVelger, {})}`}${slug === "regelfabrikken" && renderTemplate`<script data-astro-rerun>
(function () {
  var root = document.querySelector('[data-dl="regelfabrikken"] .dl-body'); if (!root || root.dataset.bound) return; root.dataset.bound = '1';
  var K = window.BDK, T = K.T, sek = 60, kort = [], skriver = 0, klokke = null, rekke = [], pos = 0;
  function oppsett() {
    root.innerHTML = '<p>' + T('Én telefon går rundt. Hver får like lang tid til å skrive så mange drikkekort som mulig. Så stokkes alt sammen.', 'One phone goes around. Everyone gets the same amount of time to write as many drinking cards as they can. Then it all gets shuffled together.') + '</p>' +
      '<div class="rom-mod">' + [45, 60, 90].map(function (n) { return '<button type="button" data-sek="' + n + '" aria-pressed="' + (n === sek) + '">' + n + T(' sek', ' sec') + '</button>'; }).join('') + '</div>' +
      '<button class="btn gold rof-start" data-a="klar">' + T('Første spiller: start', 'First player: start') + '</button>' +
      '<div class="rf-forbered"><p class="small">' + (kort.length ? '<b>' + kort.length + '</b>' + T(' kort ligger allerede i bunken.', ' cards are already in the pile.') : T('Vil dere ha med kort fra før?', 'Want to bring in cards you already have?')) + '</p>' +
      '<div class="dl-knapper"><button class="btn ghost" data-a="velg">' + T('Ta med lagrede kort', 'Add saved cards') + '</button><button class="btn ghost" data-a="forhand">' + T('Skriv kort på forhånd', 'Write cards in advance') + '</button></div></div>';
  }
  function forhand() {
    root.innerHTML = '<p class="dl-melding">' + T('Skriv kort i ro og mak – ett per linje. Legg dem i bunken nå, eller lagre dem som kortstokk til senere.', 'Write cards at your own pace – one per line. Add them to the pile now, or save them as a deck for later.') + '</p>' +
      '<label class="rof-lab" for="rfFNavn">' + T('Navn på kortstokken', 'Deck name') + '</label><input class="rof-inp" id="rfFNavn" maxlength="40" value="' + T('Hyttetur-regler', 'Cabin trip rules') + '">' +
      '<label class="rof-lab" for="rfFKort">' + T('Kort', 'Cards') + '</label><textarea class="rof-inp rf-tekst" id="rfFKort" rows="8" placeholder="' + T('Alle med briller drikker\\nDen siste som kom hit deler ut tre', 'Everyone wearing glasses drinks\\nThe last person to arrive hands out three') + '"></textarea>' +
      '<div class="dl-knapper"><button class="btn gold" data-a="forhand-legg">' + T('Legg i bunken', 'Add to the pile') + '</button><button class="btn ghost" data-a="forhand-lagre">' + T('Lagre som kortstokk', 'Save as a deck') + '</button><button class="btn ghost" data-a="tilbake">' + T('Tilbake', 'Back') + '</button></div>' +
      '<p class="dl-info" id="rfFMsg" role="status"></p>';
  }
  function forhandKort() { return root.querySelector('#rfFKort').value.split('\\n').map(function (x) { return x.trim().slice(0, 140); }).filter(Boolean).slice(0, 300); }
  function klar() {
    root.innerHTML = '<p class="dl-steg">' + T('Spiller ', 'Player ') + (skriver + 1) + '</p><p class="dl-melding dl-stor">' + T('Klar? Du får ', 'Ready? You get ') + sek + T(' sekunder.', ' seconds.') + '</p>' +
      '<p class="dl-info">' + kort.length + T(' kort i bunken så langt', ' cards in the pile so far') + '</p>' +
      '<div class="dl-knapper"><button class="btn gold" data-a="skriv">' + T('Start klokka', 'Start the clock') + '</button>' + (kort.length ? '<button class="btn ghost" data-a="spill">' + T('Alle har skrevet – stokk', "Everyone's done – shuffle") + '</button>' : '') + '</div>';
  }
  function skriv() {
    var slutt = Date.now() + sek * 1000, mine = 0;
    root.innerHTML = '<div class="rf-tid" id="rfTidS">' + sek + '</div>' +
      '<form class="rf-skjema"><label for="rfSolo" class="small">' + T('F.eks. «Alle med hvite sokker drikker»', 'E.g. “Everyone wearing white socks drinks”') + '</label>' +
      '<div class="rf-rad"><input id="rfSolo" maxlength="140" autocomplete="off" enterkeyhint="send" placeholder="' + T('Skriv et kort …', 'Write a card …') + '"><button class="btn gold" type="submit">' + T('Legg til', 'Add') + '</button></div></form>' +
      '<p class="dl-info" id="rfAnt">' + T('0 kort', '0 cards') + '</p>';
    var inp = root.querySelector('#rfSolo'), tid = root.querySelector('#rfTidS'), ant = root.querySelector('#rfAnt');
    inp.focus();
    root.querySelector('form').addEventListener('submit', function (e) {
      e.preventDefault(); var v = inp.value.trim(); if (!v || inp.disabled) return;
      kort.push(v.slice(0, 140)); mine++; inp.value = ''; ant.textContent = mine + (mine === 1 ? T(' kort', ' card') : T(' kort', ' cards')); inp.focus();
    });
    clearInterval(klokke);
    klokke = setInterval(function () {
      var n = Math.max(0, Math.ceil((slutt - Date.now()) / 1000));
      tid.textContent = n; tid.classList.toggle('snart', n <= 10);
      if (n <= 0) {
        clearInterval(klokke); inp.disabled = true;
        if (inp.value.trim()) { kort.push(inp.value.trim().slice(0, 140)); mine++; }
        skriver++;
        root.innerHTML = '<p class="dl-melding dl-stor">' + T('Tiden er ute! Du skrev ', "Time's up! You wrote ") + mine + (mine === 1 ? T(' kort.', ' card.') : T(' kort.', ' cards.')) + '</p><p>' + T('Send telefonen videre uten å vise hva du skrev.', 'Pass the phone on without showing what you wrote.') + '</p>' +
          '<div class="dl-knapper"><button class="btn gold" data-a="klar">' + T('Neste spiller', 'Next player') + '</button><button class="btn ghost" data-a="spill">' + T('Alle har skrevet – stokk', "Everyone's done – shuffle") + '</button></div>';
      }
    }, 250);
  }
  function spill() { rekke = K.bland(kort); pos = 0; vis(); }
  function vis() {
    root.innerHTML = '<div class="rom-kort rf-kort"><span class="sw-tag">' + T('Kort ', 'Card ') + (pos + 1) + T(' av ', ' of ') + rekke.length + '</span><p>' + K.esc(rekke[pos]) + '</p><span></span></div>' +
      '<div class="dl-knapper"><button class="btn gold" data-a="neste">' + T('Trekk neste', 'Draw next') + '</button><button class="btn ghost" data-a="nytt">' + T('Ny skriverunde', 'New writing round') + '</button>' +
      '<button class="btn ghost" data-a="lagre">' + T('Lagre som kortstokk', 'Save as a deck') + '</button></div><p class="dl-info" id="rfLagret" role="status"></p>';
  }
  function lagre() {
    var d = new Date(), navn = T('Hjemmesnekra ' + d.getDate() + '.' + (d.getMonth() + 1) + '.', 'Homemade ' + d.getDate() + '/' + (d.getMonth() + 1)), ut = root.querySelector('#rfLagret');
    var KO = window.BDKonto;
    (KO ? KO.bruker() : Promise.resolve(null)).then(function (u) {
      if (!u) {
        try { localStorage.setItem('bd_stokk_utkast', JSON.stringify({ navn: navn, kort: kort.slice(0, 300) })); } catch (e) {}
        ut.innerHTML = T('Kortene er lagt til side. <a href="/no/account">Logg inn eller lag konto</a> for å lagre dem.', 'The cards have been set aside. <a href="/account">Log in or create an account</a> to save them.');
        return;
      }
      return KO.stokker.lagre({ navn: navn, kort: kort }).then(function () { ut.innerHTML = T('Lagret ✓ Finn den under <a href="/no/account">Min stokk</a>.', 'Saved ✓ Find it under <a href="/account">My deck</a>.'); });
    }).catch(function (e) { ut.textContent = e.message || T('Fikk ikke lagret.', "Couldn't save."); });
  }
  root.addEventListener('click', function (e) {
    var sb = e.target.closest('[data-sek]'); if (sb) { sek = Number(sb.dataset.sek); return oppsett(); }
    var b = e.target.closest('[data-a]'); if (!b) return;
    var a = b.dataset.a;
    if (a === 'klar') klar();
    if (a === 'skriv') skriv();
    if (a === 'spill') spill();
    if (a === 'neste') { pos++; if (pos >= rekke.length) { rekke = K.bland(rekke); pos = 0; } vis(); }
    if (a === 'nytt') { kort = []; skriver = 0; oppsett(); }
    if (a === 'lagre') lagre();
    if (a === 'tilbake') oppsett();
    if (a === 'forhand') forhand();
    if (a === 'velg' && window.BDVelgKort) window.BDVelgKort({ maks: 200 }).then(function (valgt) { valgt.forEach(function (x) { if (kort.indexOf(x) === -1) kort.push(x); }); oppsett(); });
    if (a === 'forhand-legg') { var fk = forhandKort(); if (!fk.length) return; fk.forEach(function (x) { kort.push(x); }); oppsett(); }
    if (a === 'forhand-lagre') {
      var fk2 = forhandKort(), ut = root.querySelector('#rfFMsg'), nv = (root.querySelector('#rfFNavn').value.trim() || T('Mine kort', 'My cards')).slice(0, 40);
      if (!fk2.length) { ut.textContent = T('Skriv minst ett kort.', 'Write at least one card.'); return; }
      window.BDLagreKort(nv, fk2).then(function (r) {
        ut.innerHTML = r === 'lagret' ? T('Lagret ✓ Du finner den under <a href="/no/account">Min stokk</a> – og kan ta den med i neste runde.', 'Saved ✓ You\\'ll find it under <a href="/account">My deck</a> – and can bring it into the next round.') : T('Lagt til side. <a href="/no/account">Logg inn eller lag konto</a> for å lagre den.', 'Set aside. <a href="/account">Log in or create an account</a> to save it.');
      }).catch(function (e) { ut.textContent = e.message || T('Fikk ikke lagret.', "Couldn't save."); });
    }
  });
  document.addEventListener('astro:before-swap', function () { clearInterval(klokke); }, { once: true });
  oppsett();
})();
<\/script>`}${slug === "stilleleken" && renderTemplate`<script data-astro-rerun>
(function () {
  var root = document.querySelector('[data-dl="stilleleken"] .dl-body'); if (!root || root.dataset.bound) return; root.dataset.bound = '1';
  var strom = null, ctx = null, analyser = null, buf = null, loop = null, slutt = 0, grunn = 0, over = 0, folsom = 2, aktiv = false;
  var GRENSE = { 1: 22, 2: 14, 3: 8 };   // hvor mye over stillheten det skal til
  var T = window.BDK.T;
  function oppsett(melding) {
    root.innerHTML = (melding ? '<p class="dl-melding dl-stor">' + melding + '</p>' : '') +
      '<p>' + T('Legg telefonen midt på bordet. Én prøver å få de andre til å le – telefonen hører om noen lager lyd.', 'Put the phone in the middle of the table. One person tries to make the others laugh – the phone hears if anyone makes a sound.') + '</p>' +
      '<p class="rof-lab">' + T('Følsomhet', 'Sensitivity') + '</p><div class="rom-mod">' + [[1, T('Lav', 'Low')], [2, T('Middels', 'Medium')], [3, T('Høy', 'High')]].map(function (x) {
        return '<button type="button" data-f="' + x[0] + '" aria-pressed="' + (folsom === x[0]) + '">' + x[1] + '</button>'; }).join('') + '</div>' +
      '<button class="btn gold rof-start" data-a="start">' + T('Start 60 sekunder', 'Start 60 seconds') + '</button>' +
      '<p class="small">' + T('Telefonen spør om lov til å bruke mikrofonen. Lyden lagres ikke og sendes ingen steder.', "The phone will ask for permission to use the microphone. The sound isn't recorded or sent anywhere.") + '</p>';
  }
  function stopp() {
    aktiv = false; cancelAnimationFrame(loop);
    if (strom) strom.getTracks().forEach(function (t) { t.stop(); }); strom = null;
    if (ctx) { ctx.close().catch(function () {}); ctx = null; }
  }
  function niva() {
    analyser.getFloatTimeDomainData(buf);
    var sum = 0; for (var i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
    var rms = Math.sqrt(sum / buf.length);
    return Math.max(0, Math.min(100, 20 * Math.log10(rms + 1e-8) + 100));   // ca. 0–100
  }
  function start() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return oppsett(T('Nettleseren din gir ikke tilgang til mikrofonen.', "Your browser doesn't allow access to the microphone."));
    navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } }).then(function (s) {
      strom = s; ctx = new (window.AudioContext || window.webkitAudioContext)();
      var kilde = ctx.createMediaStreamSource(s); analyser = ctx.createAnalyser(); analyser.fftSize = 1024; buf = new Float32Array(analyser.fftSize); kilde.connect(analyser);
      root.innerHTML = '<p class="dl-melding dl-stor" id="stTekst">' + T('Helt stille … måler rommet', 'Dead quiet … measuring the room') + '</p><div class="st-maaler"><i id="stNiva"></i><b id="stGrense"></b></div><div class="rf-tid" id="stTid">60</div>' +
        '<div class="dl-knapper"><button class="btn ghost" data-a="avbryt">' + T('Avbryt', 'Cancel') + '</button></div>';
      var t0 = performance.now(), maalinger = []; aktiv = true; over = 0;
      (function kalibrer() {
        if (!aktiv) return;
        maalinger.push(niva());
        if (performance.now() - t0 < 1500) { loop = requestAnimationFrame(kalibrer); return; }
        maalinger.sort(function (a, b) { return a - b; }); grunn = maalinger[Math.floor(maalinger.length * 0.7)];
        slutt = Date.now() + 60000; document.getElementById('stTekst').textContent = T('Klovnen kan begynne!', 'Clown, you can start!');
        document.getElementById('stGrense').style.left = Math.min(98, grunn + GRENSE[folsom]) + '%';
        lytt();
      })();
    }).catch(function () { oppsett(T('Fikk ikke bruke mikrofonen. Sjekk at du har gitt tillatelse.', "Couldn't use the microphone. Check that you've given permission.")); });
  }
  function lytt() {
    if (!aktiv) return;
    var n = niva(), grense = grunn + GRENSE[folsom], igjen = Math.max(0, Math.ceil((slutt - Date.now()) / 1000));
    var el = document.getElementById('stNiva'); if (el) { el.style.width = n + '%'; el.classList.toggle('hoy', n > grense); }
    var tid = document.getElementById('stTid'); if (tid) { tid.textContent = igjen; tid.classList.toggle('snart', igjen <= 10); }
    over = n > grense ? over + 1 : Math.max(0, over - 1);
    if (over > 10) {   // ca. 0,2 sekunder over grensen
      var sek = 60 - igjen; stopp();
      try { navigator.vibrate && navigator.vibrate([200, 80, 200]); } catch (e) {}
      root.closest('.dl').classList.add('st-alarm'); setTimeout(function () { var d = root.closest('.dl'); if (d) d.classList.remove('st-alarm'); }, 1200);
      return oppsett(T('🚨 Noen lagde lyd etter ', '🚨 Someone made a sound after ') + sek + T(' sekunder! Den skyldige drikker to.', ' seconds! The guilty one drinks two.'));
    }
    if (igjen <= 0) { stopp(); return oppsett(T('🤫 Alle holdt seg i 60 sekunder! Klovnen drikker to.', '🤫 Everyone kept it together for 60 seconds! The clown drinks two.')); }
    loop = requestAnimationFrame(lytt);
  }
  root.addEventListener('click', function (e) {
    var f = e.target.closest('[data-f]'); if (f) { folsom = Number(f.dataset.f); return oppsett(); }
    var b = e.target.closest('[data-a]'); if (!b) return;
    if (b.dataset.a === 'start') start();
    if (b.dataset.a === 'avbryt') { stopp(); oppsett(); }
  });
  document.addEventListener('astro:before-swap', stopp, { once: true });
  oppsett();
})();
<\/script>`}${slug === "power-hour" && renderTemplate`<script data-astro-rerun>
(function () {
  var root = document.querySelector('[data-dl="power-hour"] .dl-body'); if (!root || root.dataset.bound) return; root.dataset.bound = '1';
  var K = window.BDK, T = K.T, totalt = 60, start = null, pauseVed = null, tikk = null, laas = null, lyd = null, sistMin = 0;
  function pip() {
    try {
      lyd = lyd || new (window.AudioContext || window.webkitAudioContext)();
      var o = lyd.createOscillator(), g = lyd.createGain();
      o.frequency.value = 880; o.connect(g); g.connect(lyd.destination);
      g.gain.setValueAtTime(0.0001, lyd.currentTime); g.gain.exponentialRampToValueAtTime(0.4, lyd.currentTime + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, lyd.currentTime + 0.5);
      o.start(); o.stop(lyd.currentTime + 0.55);
    } catch (e) {}
    try { if (navigator.vibrate) navigator.vibrate([200, 100, 200]); } catch (e) {}
  }
  function oppsett() {
    root.innerHTML = '<div class="rom-mod">' + [[30, T('Halv time', 'Half hour')], [60, 'Power hour'], [100, 'Centurion (100)']].map(function (x) {
      return '<button type="button" data-min="' + x[0] + '" aria-pressed="' + (x[0] === totalt) + '">' + x[1] + '</button>'; }).join('') + '</div>' +
      '<p class="small">' + T('Telefonen piper og vibrerer hvert minutt. Hold den på bordet med lyden på.', 'The phone beeps and vibrates every minute. Keep it on the table with the sound on.') + '</p>' +
      '<button class="btn gold rof-start" data-a="start">Start ' + totalt + T(' minutter', ' minutes') + '</button>';
  }
  function tegn() {
    var gaatt = (pauseVed || Date.now()) - start, min = Math.floor(gaatt / 60000), sek = 60 - Math.floor((gaatt % 60000) / 1000);
    if (min >= totalt) { stopp(); root.innerHTML = '<p class="ph-tall">' + totalt + '</p><p class="dl-melding dl-stor">' + T('Ferdig! Dere klarte ', 'Done! You made it through ') + totalt + T(' minutter.', ' minutes.') + '</p><button class="btn gold" data-a="ny">' + T('Ny runde', 'New round') + '</button>'; return; }
    if (min > sistMin) { sistMin = min; pip(); var f = root.querySelector('.ph'); if (f) { f.classList.remove('skal'); void f.offsetWidth; f.classList.add('skal'); } }
    var el = root.querySelector('.ph');
    if (!el) {
      root.innerHTML = '<div class="ph"><span class="dl-steg">' + T('Minutt', 'Minute') + '</span><p class="ph-tall"></p><p class="ph-neste"></p></div>' +
        '<div class="dl-bar"><i></i></div><div class="dl-knapper"><button class="btn ghost" data-a="pause"></button><button class="btn ghost" data-a="avslutt">' + T('Avslutt', 'End') + '</button></div>';
      el = root.querySelector('.ph');
    }
    root.querySelector('.ph-tall').textContent = (min + 1) + ' / ' + totalt;
    root.querySelector('.ph-neste').textContent = min === 0 && gaatt < 3000 ? T('Første slurk nå – SKÅL!', 'First sip now – CHEERS!') : T('Neste slurk om ', 'Next sip in ') + sek + T(' sek', ' sec');
    root.querySelector('.dl-bar i').style.width = (100 * gaatt / (totalt * 60000)) + '%';
    root.querySelector('[data-a="pause"]').textContent = pauseVed ? T('Fortsett', 'Resume') : 'Pause';
  }
  function stopp() { clearInterval(tikk); tikk = null; try { if (laas) laas.release(); } catch (e) {} laas = null; }
  root.addEventListener('click', function (e) {
    var m = e.target.closest('[data-min]'); if (m) { totalt = Number(m.dataset.min); return oppsett(); }
    var b = e.target.closest('[data-a]'); if (!b) return;
    var a = b.dataset.a;
    if (a === 'start') { start = Date.now(); pauseVed = null; sistMin = 0; pip(); try { if (navigator.wakeLock) navigator.wakeLock.request('screen').then(function (l) { laas = l; }).catch(function () {}); } catch (err) {} tikk = setInterval(tegn, 250); tegn(); }
    if (a === 'pause') { if (pauseVed) { start += Date.now() - pauseVed; pauseVed = null; } else pauseVed = Date.now(); tegn(); }
    if (a === 'avslutt' || a === 'ny') { stopp(); oppsett(); }
  });
  document.addEventListener('astro:before-swap', stopp, { once: true });
  oppsett();
})();
<\/script>`}${slug === "snurr-flasken" && renderTemplate`<script data-astro-rerun>
(function () {
  var root = document.querySelector('[data-dl="snurr-flasken"] .dl-body'); if (!root || root.dataset.bound) return; root.dataset.bound = '1';
  var vinkel = 0, opptatt = false, T = window.BDK.T;
  root.innerHTML = '<p class="small">' + T('Legg telefonen flatt midt i ringen og trykk på flaska.', 'Lay the phone flat in the middle of the circle and tap the bottle.') + '</p>' +
    '<button class="sf" data-a="snurr" aria-label="' + T('Snurr flaska', 'Spin the bottle') + '"><svg class="sf-flaske" viewBox="0 0 100 300" aria-hidden="true">' +
    '<rect x="41" y="4" width="18" height="14" rx="3" fill="#7DA80F"/><path d="M42 18h16v48c0 10 20 22 20 44v170c0 14-8 18-28 18s-28-4-28-18V110c0-22 20-34 20-44z" fill="#3f7a3a"/>' +
    '<rect x="26" y="150" width="48" height="60" rx="6" fill="#F5F0FF"/><text x="50" y="186" text-anchor="middle" font-family="sans-serif" font-weight="800" font-size="15" fill="#1a0f08">BD</text></svg></button>' +
    '<p class="dl-melding" aria-live="polite">' + T('Trykk for å snurre', 'Tap to spin') + '</p>';
  var fl = root.querySelector('.sf-flaske'), m = root.querySelector('.dl-melding');
  root.addEventListener('click', function (e) {
    if (!e.target.closest('[data-a="snurr"]') || opptatt) return;
    opptatt = true; m.textContent = '…';
    vinkel += 1080 + Math.floor(Math.random() * 1440);
    var redusert = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    fl.style.transition = redusert ? 'none' : 'transform 3.2s cubic-bezier(.12,.72,.18,1)';
    fl.style.transform = 'rotate(' + vinkel + 'deg)';
    setTimeout(function () { opptatt = false; m.textContent = T('Den korken peker mot: svar på et spørsmål fra den som snurret – eller drikk!', 'Whoever the cap points at: answer a question from the spinner – or drink!'); }, redusert ? 50 : 3300);
  });
})();
<\/script>`}${slug === "drikke-yatzy" && renderTemplate`<script data-astro-rerun>
(function () {
  var root = document.querySelector('[data-dl="drikke-yatzy"] .dl-body'); if (!root || root.dataset.bound) return; root.dataset.bound = '1';
  var K = window.BDK, T = K.T, spillere = [], tur = 0, terninger = [1, 2, 3, 4, 5], hold = [false, false, false, false, false], kast = 0, opptatt = false, melding = '';
  var FELT = T([['1', 'Enere'], ['2', 'Toere'], ['3', 'Treere'], ['4', 'Firere'], ['5', 'Femmere'], ['6', 'Seksere'], ['p', 'Ett par'], ['pp', 'To par'], ['3l', 'Tre like'], ['4l', 'Fire like'],
    ['ls', 'Liten straight'], ['ss', 'Stor straight'], ['hus', 'Hus'], ['sj', 'Sjanse'], ['y', 'Yatzy']],
    [['1', 'Ones'], ['2', 'Twos'], ['3', 'Threes'], ['4', 'Fours'], ['5', 'Fives'], ['6', 'Sixes'], ['p', 'One pair'], ['pp', 'Two pairs'], ['3l', 'Three of a kind'], ['4l', 'Four of a kind'],
    ['ls', 'Small straight'], ['ss', 'Large straight'], ['hus', 'Full house'], ['sj', 'Chance'], ['y', 'Yahtzee']]);
  function tell(t) { var c = [0, 0, 0, 0, 0, 0, 0]; t.forEach(function (x) { c[x]++; }); return c; }
  function poeng(f, t) {
    var c = tell(t), sum = t.reduce(function (a, b) { return a + b; }, 0), i;
    if (/^[1-6]$/.test(f)) return c[+f] * +f;
    if (f === 'p') { for (i = 6; i >= 1; i--) if (c[i] >= 2) return i * 2; return 0; }
    if (f === 'pp') { var par = []; for (i = 6; i >= 1; i--) if (c[i] >= 2) par.push(i); return par.length >= 2 ? par[0] * 2 + par[1] * 2 : 0; }
    if (f === '3l') { for (i = 6; i >= 1; i--) if (c[i] >= 3) return i * 3; return 0; }
    if (f === '4l') { for (i = 6; i >= 1; i--) if (c[i] >= 4) return i * 4; return 0; }
    if (f === 'ls') return [1, 2, 3, 4, 5].every(function (x) { return c[x] === 1; }) ? 15 : 0;
    if (f === 'ss') return [2, 3, 4, 5, 6].every(function (x) { return c[x] === 1; }) ? 20 : 0;
    if (f === 'hus') { var tre = 0, to = 0; for (i = 1; i <= 6; i++) { if (c[i] === 3) tre = i; if (c[i] === 2) to = i; } return tre && to ? sum : 0; }
    if (f === 'sj') return sum;
    if (f === 'y') return c.some(function (x) { return x === 5; }) ? 50 : 0;
  }
  function total(p) { var ov = 0, sum = 0; FELT.forEach(function (f) { var v = p.blokk[f[0]]; if (v != null) { sum += v; if (/^[1-6]$/.test(f[0])) ov += v; } }); return { sum: sum + (ov >= 63 ? 50 : 0), ov: ov }; }
  function oppsett() {
    root.innerHTML = '<label class="rof-lab" for="yzNavn">' + T('Spillere (skill med komma)', 'Players (separate with commas)') + '</label><input class="rof-inp" id="yzNavn" placeholder="' + T('Jonas, Maria', 'Alex, Sam') + '" value="' + K.esc(K.hent('bd_spillere')) + '">' +
      '<button class="btn gold rof-start" data-a="start">' + T('Start drikke-yatzy', 'Start Drinking Yahtzee') + '</button>';
  }
  function tegn() {
    var p = spillere[tur], ferdig = spillere.every(function (x) { return FELT.every(function (f) { return x.blokk[f[0]] != null; }); });
    if (ferdig) {
      var liste = spillere.map(function (x) { return { n: x.navn, s: total(x).sum }; }).sort(function (a, b) { return b.s - a.s; });
      root.innerHTML = '<p class="dl-melding dl-stor">' + K.esc(liste[0].n) + T(' vant med ', ' won with ') + liste[0].s + T(' poeng!', ' points!') + '</p><ol class="rom-resultat">' + liste.map(function (x) { return '<li><span>' + K.esc(x.n) + '</span><b>' + x.s + '</b></li>'; }).join('') + '</ol>' +
        '<p class="dl-melding">' + K.esc(liste[liste.length - 1].n) + T(' tapte – drikk opp eller ta en shot!', ' lost – finish your drink or take a shot!') + '</p><button class="btn gold" data-a="ny">' + T('Nytt spill', 'New game') + '</button>';
      return;
    }
    root.innerHTML = '<p class="dl-steg">' + K.esc(p.navn) + T(' sin tur · kast ', "'s turn · roll ") + kast + T(' av 3', ' of 3') + '</p>' +
      '<div class="yz-terninger">' + terninger.map(function (t, i) { return '<button type="button" data-h="' + i + '" aria-pressed="' + hold[i] + '" aria-label="' + T('Hold terning ', 'Hold die ') + (i + 1) + '">' + K.terning(t) + '</button>'; }).join('') + '</div>' +
      '<p class="small">' + (kast ? T('Trykk på terninger du vil holde.', 'Tap the dice you want to hold.') : T('Trill for å starte turen.', 'Roll to start your turn.')) + '</p>' +
      '<p class="dl-melding" aria-live="polite">' + K.esc(melding) + '</p>' +
      '<div class="dl-knapper"><button class="btn gold" data-a="kast"' + (kast >= 3 ? ' disabled' : '') + '>' + (kast ? T('Trill igjen', 'Roll again') : T('Trill', 'Roll')) + '</button></div>' +
      '<div class="yz-blokk">' + FELT.map(function (f) {
        var v = p.blokk[f[0]], mulig = kast && v == null ? poeng(f[0], terninger) : null;
        return '<button type="button" data-f="' + f[0] + '"' + (v != null || !kast ? ' disabled' : '') + '><span>' + f[1] + '</span><b>' + (v != null ? v : (mulig != null ? '+' + mulig : '')) + '</b></button>';
      }).join('') + '</div>' +
      '<p class="dl-info">' + spillere.map(function (x) { var tt = total(x); return K.esc(x.navn) + ': ' + tt.sum + (tt.ov >= 63 ? ' (bonus)' : ''); }).join(' · ') + '</p>';
  }
  function trill() {
    if (opptatt || kast >= 3) return; opptatt = true;
    var el = root.querySelector('.yz-terninger'), frie = [];
    hold.forEach(function (h, i) { if (!h) frie.push(i); });
    var r = 0;
    var anim = setInterval(function () {
      frie.forEach(function (i) { terninger[i] = 1 + Math.floor(Math.random() * 6); });
      el.querySelectorAll('button').forEach(function (b, i) { if (!hold[i]) b.innerHTML = K.terning(terninger[i]); });
      if (++r >= 8) {
        clearInterval(anim); kast++; opptatt = false;
        var c = tell(terninger), deler = [];
        if (c[1] > 0) deler.push(T('Ener i kastet – drikk 2.', 'A one in the roll – drink 2.'));
        if (c.some(function (x) { return x === 5; })) deler.push(T('YATZY! Du bestemmer hvem som tar en shot.', 'YAHTZEE! You pick who takes a shot.'));
        else if (c.some(function (x) { return x >= 4; })) deler.push(T('Fire like – drikk ', 'Four of a kind – drink ') + terninger.reduce(function (a, b) { return a + b; }, 0) + T(' slurker.', ' sips.'));
        melding = deler.join(' ') || (kast < 3 ? T('Hold og trill igjen, eller velg et felt.', 'Hold and roll again, or pick a box.') : T('Velg et felt.', 'Pick a box.'));
        tegn();
      }
    }, 70);
  }
  root.addEventListener('click', function (e) {
    var h = e.target.closest('[data-h]'); if (h && kast && kast < 3) { var i = +h.dataset.h; hold[i] = !hold[i]; h.setAttribute('aria-pressed', hold[i]); return; }
    var f = e.target.closest('[data-f]'); if (f && !f.disabled) {
      spillere[tur].blokk[f.dataset.f] = poeng(f.dataset.f, terninger);
      tur = (tur + 1) % spillere.length; kast = 0; hold = [false, false, false, false, false]; melding = ''; return tegn();
    }
    var b = e.target.closest('[data-a]'); if (!b) return;
    if (b.dataset.a === 'start') { var inp = root.querySelector('#yzNavn'); var ns = K.navn(inp); if (!ns.length) ns = T(['Spiller 1', 'Spiller 2'], ['Player 1', 'Player 2']); K.husk('bd_spillere', inp.value); spillere = ns.map(function (n) { return { navn: n, blokk: {} }; }); tur = 0; kast = 0; tegn(); }
    if (b.dataset.a === 'kast') trill();
    if (b.dataset.a === 'ny') oppsett();
  });
  oppsett();
})();
<\/script>`}${slug === "beer-pong" && renderTemplate`<script data-astro-rerun>
(function () {
  var root = document.querySelector('[data-dl="beer-pong"] .dl-body'); if (!root || root.dataset.bound) return; root.dataset.bound = '1';
  var K = window.BDK, T = K.T, antall = 10, lag = [];
  var RADER = { 6: [3, 2, 1], 10: [4, 3, 2, 1] };
  function oppsett() {
    root.innerHTML = '<div class="rom-mod">' + [6, 10].map(function (n) { return '<button type="button" data-n="' + n + '" aria-pressed="' + (n === antall) + '">' + n + T(' kopper', ' cups') + '</button>'; }).join('') + '</div>' +
      '<div class="dl-navn"><label for="bpA">' + T('Lag 1', 'Team 1') + '</label><input id="bpA" maxlength="20" placeholder="' + T('Lagnavn', 'Team name') + '"><label for="bpB">' + T('Lag 2', 'Team 2') + '</label><input id="bpB" maxlength="20" placeholder="' + T('Lagnavn', 'Team name') + '"></div>' +
      '<button class="btn gold" data-a="start">' + T('Start kampen', 'Start the match') + '</button>';
  }
  function stativ(l, li) {
    var i = 0;
    return '<div class="bp-stativ">' + RADER[antall].map(function (n) {
      var s = '<div>'; for (var k = 0; k < n; k++, i++) s += '<button type="button" data-l="' + li + '" data-k="' + i + '" aria-pressed="' + !!l.truffet[i] + '" aria-label="' + T('Kopp ', 'Cup ') + (i + 1) + '"></button>'; return s + '</div>';
    }).join('') + '</div>';
  }
  function tegn(melding) {
    var igjen = lag.map(function (l) { return antall - Object.keys(l.truffet).length; });
    var vinner = igjen[0] === 0 ? 1 : igjen[1] === 0 ? 0 : -1;
    root.innerHTML = lag.map(function (l, li) { return '<div class="bp-lag"><p class="dl-spiller">' + K.esc(l.navn) + ' · ' + igjen[li] + T(' kopper igjen', ' cups left') + '</p>' + stativ(l, li) + '</div>'; }).join('<p class="bp-mot">' + T('mot', 'vs') + '</p>') +
      '<p class="dl-melding" aria-live="polite">' + K.esc(vinner >= 0 ? lag[vinner].navn + T(' vant! Taperne får ett siste forsøk på å redde seg.', ' won! The losers get one last shot at redemption.') : (melding || T('Trykk på en kopp når den blir truffet.', 'Tap a cup when it gets hit.'))) + '</p>' +
      '<div class="dl-knapper"><button class="btn ghost" data-a="angre">' + T('Angre', 'Undo') + '</button><button class="btn ghost" data-a="ny">' + T('Ny kamp', 'New match') + '</button></div>';
  }
  var logg = [];
  root.addEventListener('click', function (e) {
    var n = e.target.closest('[data-n]'); if (n) { antall = +n.dataset.n; return oppsett(); }
    var k = e.target.closest('[data-k]');
    if (k) { var l = lag[+k.dataset.l], i = +k.dataset.k; if (l.truffet[i]) { delete l.truffet[i]; } else { l.truffet[i] = true; logg.push([+k.dataset.l, i]); } return tegn(l.navn + T(' drikker koppen!', ' drinks the cup!')); }
    var b = e.target.closest('[data-a]'); if (!b) return;
    if (b.dataset.a === 'start') { lag = [{ navn: root.querySelector('#bpA').value.trim() || T('Lag 1', 'Team 1'), truffet: {} }, { navn: root.querySelector('#bpB').value.trim() || T('Lag 2', 'Team 2'), truffet: {} }]; logg = []; tegn(); }
    if (b.dataset.a === 'angre') { var s = logg.pop(); if (s) delete lag[s[0]].truffet[s[1]]; tegn(); }
    if (b.dataset.a === 'ny') oppsett();
  });
  oppsett();
})();
<\/script>`}${slug === "rask-fakta" && renderTemplate`<script data-astro-rerun>
(function () {
  var root = document.querySelector('[data-dl="rask-fakta"] .dl-body'); if (!root || root.dataset.bound) return; root.dataset.bound = '1';
  var K = window.BDK, T = K.T, navn = T(['Spiller 1', 'Spiller 2'], ['Player 1', 'Player 2']), prikker = [0, 0], tur = 0, klokke = null;
  function oppsett() {
    root.innerHTML = '<div class="dl-navn"><label for="rfA">' + T('Spiller 1', 'Player 1') + '</label><input id="rfA" maxlength="20" placeholder="' + T('Navn', 'Name') + '"><label for="rfB">' + T('Spiller 2', 'Player 2') + '</label><input id="rfB" maxlength="20" placeholder="' + T('Navn', 'Name') + '"></div><button class="btn gold" data-a="start">Start</button>';
  }
  function tegn(tekst) {
    root.innerHTML = '<p class="dl-steg">' + K.esc(navn[tur]) + T(' sin tur', "'s turn") + '</p><div class="rf-tid" id="rkTid">5</div>' +
      '<p class="dl-melding" aria-live="polite">' + K.esc(tekst || T('Si en fakta om ', 'Say a fact about ') + navn[1 - tur] + T(' innen 5 sekunder!', ' within 5 seconds!')) + '</p>' +
      '<div class="dl-knapper"><button class="btn gold" data-a="go">' + T('Start 5 sek', 'Start 5 sec') + '</button><button class="btn ghost" data-a="ok">' + T('Stemte', 'Correct') + '</button><button class="btn ghost" data-a="feil">' + T('Feil / for sent', 'Wrong / too slow') + '</button></div>' +
      '<div class="rk-prikker">' + [0, 1].map(function (i) { return '<div><b>' + K.esc(navn[i]) + '</b><span>' + '●'.repeat(prikker[i]) + '○'.repeat(3 - prikker[i]) + '</span></div>'; }).join('') + '</div>';
  }
  root.addEventListener('click', function (e) {
    var b = e.target.closest('[data-a]'); if (!b) return; var a = b.dataset.a;
    if (a === 'start') { navn = [root.querySelector('#rfA').value.trim() || T('Spiller 1', 'Player 1'), root.querySelector('#rfB').value.trim() || T('Spiller 2', 'Player 2')]; prikker = [0, 0]; tur = 0; tegn(); }
    if (a === 'go') { clearInterval(klokke); var slutt = Date.now() + 5000, el = root.querySelector('#rkTid');
      klokke = setInterval(function () { var n = Math.max(0, Math.ceil((slutt - Date.now()) / 1000)); el.textContent = n; el.classList.toggle('snart', n <= 2); if (!n) { clearInterval(klokke); try { if (navigator.vibrate) navigator.vibrate(300); } catch (err) {} } }, 100); }
    if (a === 'ok') { clearInterval(klokke); tur = 1 - tur; tegn(); }
    if (a === 'feil') { clearInterval(klokke); prikker[tur]++;
      if (prikker[tur] >= 3) { var t = navn[tur] + T(' har tre prikker – ta en shot!', ' has three strikes – take a shot!'); prikker[tur] = 0; tur = 1 - tur; return tegn(t); }
      var tx = navn[tur] + T(' får en prikk.', ' gets a strike.'); tur = 1 - tur; tegn(tx); }
  });
  document.addEventListener('astro:before-swap', function () { clearInterval(klokke); }, { once: true });
  oppsett();
})();
<\/script>`}${slug === "to-sannheter-og-en-logn" && renderTemplate`<script data-astro-rerun>
(function () {
  var root = document.querySelector('[data-dl="to-sannheter-og-en-logn"] .dl-body'); if (!root || root.dataset.bound) return; root.dataset.bound = '1';
  var K = window.BDK, T = K.T, rekke = [], logn = -1;
  function skriv() {
    root.innerHTML = '<p>' + T('Skriv tre påstander om deg selv, og merk hvilken som er løgnen. Så viser du telefonen til de andre.', 'Write three statements about yourself and mark which one is the lie. Then show the phone to the others.') + '</p>' +
      [0, 1, 2].map(function (i) { return '<div class="ts-rad"><input id="ts' + i + '" maxlength="120" placeholder="' + T('Påstand ', 'Statement ') + (i + 1) + '"><label><input type="radio" name="tsLogn" value="' + i + '"> ' + T('Løgn', 'Lie') + '</label></div>'; }).join('') +
      '<button class="btn gold" data-a="vis">' + T('Stokk og vis de andre', 'Shuffle and show the others') + '</button>';
  }
  function vis() {
    var p = [0, 1, 2].map(function (i) { return root.querySelector('#ts' + i).value.trim(); });
    var valgt = root.querySelector('input[name=tsLogn]:checked');
    if (p.some(function (x) { return !x; }) || !valgt) return K.esc && (root.querySelector('.ts-feil') || root.insertAdjacentHTML('beforeend', '<p class="ts-feil dl-melding">' + T('Fyll inn alle tre og merk løgnen.', 'Fill in all three and mark the lie.') + '</p>'));
    var idx = K.bland([0, 1, 2]); rekke = idx.map(function (i) { return p[i]; }); logn = idx.indexOf(+valgt.value);
    root.innerHTML = '<p class="dl-melding dl-stor">' + T('Hvilken er løgnen?', 'Which one is the lie?') + '</p><div class="ts-valg">' + rekke.map(function (t, i) { return '<div><b>' + (i + 1) + '</b><span>' + K.esc(t) + '</span></div>'; }).join('') + '</div>' +
      '<p class="small">' + T('Diskuter og pek – så trykker den som skrev.', 'Discuss and point – then the writer taps.') + '</p><button class="btn gold" data-a="fasit">' + T('Vis fasit', 'Reveal the answer') + '</button>';
  }
  function fasit() {
    root.querySelectorAll('.ts-valg > div').forEach(function (d, i) { d.classList.add(i === logn ? 'logn' : 'sann'); });
    root.querySelector('[data-a="fasit"]').outerHTML = '<p class="dl-melding">' + T('Løgnen var nr. ', 'The lie was number ') + (logn + 1) + T('. Gjettet dere feil, drikker dere. Gjettet dere riktig, drikker den som skrev.', '. Guessed wrong? You drink. Guessed right? The writer drinks.') + '</p><button class="btn gold" data-a="ny">' + T('Neste spiller', 'Next player') + '</button>';
  }
  root.addEventListener('click', function (e) {
    var b = e.target.closest('[data-a]'); if (!b) return;
    if (b.dataset.a === 'vis') vis(); if (b.dataset.a === 'fasit') fasit(); if (b.dataset.a === 'ny') skriv();
  });
  skriv();
})();
<\/script>`}${slug === "jug" && renderTemplate`<script data-astro-rerun>
(function () {
  var root = document.querySelector('[data-dl="jug"] .dl-body'); if (!root || root.dataset.bound) return; root.dataset.bound = '1';
  var n = 5, T = window.BDK.T;
  function oppsett() {
    root.innerHTML = '<p>' + T('Verten nummererer glassene i hemmelighet. Telefonen bestemmer hvilket glass som blir det rare, så ikke engang verten velger selv.', 'The host secretly numbers the glasses. The phone decides which glass is the odd one out, so not even the host gets to choose.') + '</p>' +
      '<label class="rof-lab" for="jugN">' + T('Antall glass', 'Number of glasses') + '</label><input class="rof-inp" id="jugN" type="number" min="3" max="20" value="' + n + '">' +
      '<button class="btn gold rof-start" data-a="trekk">' + T('Trekk det rare glasset', 'Draw the odd glass') + '</button>';
  }
  root.addEventListener('click', function (e) {
    var b = e.target.closest('[data-a]'); if (!b) return;
    if (b.dataset.a === 'trekk') { n = Math.max(3, Math.min(20, +root.querySelector('#jugN').value || 5)); var x = 1 + Math.floor(Math.random() * n);
      root.innerHTML = '<p class="small">' + T('Bare verten ser dette.', 'Only the host should see this.') + '</p><p class="ph-tall">Glass ' + x + '</p><p class="dl-melding">' + T('Fyll glass nummer ', 'Fill glass number ') + x + T(' med det som smaker annerledes.', ' with the one that tastes different.') + '</p><button class="btn ghost" data-a="skjul">' + T('Skjul og start runden', 'Hide and start the round') + '</button>'; }
    if (b.dataset.a === 'skjul') { root.innerHTML = '<p class="dl-melding dl-stor">' + T('Del ut glassene og smak samtidig!', 'Hand out the glasses and taste at the same time!') + '</p><p>' + T('Diskuter og pek samtidig på tre. Tar flertallet feil, drikker alle som pekte feil. Tar dere riktig, drikker den som ble avslørt.', 'Talk it over, then everyone points on three. If the majority is wrong, everyone who pointed wrong drinks. If you get it right, the one you caught drinks.') + '</p><button class="btn gold" data-a="ny">' + T('Ny runde med ny vert', 'New round with a new host') + '</button>'; }
    if (b.dataset.a === 'ny') oppsett();
  });
  oppsett();
})();
<\/script>`}${slug === "14-sporsmal" && renderTemplate`<script data-astro-rerun>
(function () {
  var root = document.querySelector('[data-dl="14-sporsmal"] .dl-body'); if (!root || root.dataset.bound) return; root.dataset.bound = '1';
  var K = window.BDK, T = K.T, regler = { 7: T('Ikke si 7', "Don't say 7") };
  try { regler = JSON.parse(localStorage.getItem('bd_14') || 'null') || regler; } catch (e) {}
  function lagre() { try { localStorage.setItem('bd_14', JSON.stringify(regler)); } catch (e) {} }
  function tegn() {
    var ruter = ''; for (var i = 1; i <= 14; i++) ruter += '<button type="button" class="' + (regler[i] ? 'har' : '') + '" data-t="' + i + '"><b>' + i + '</b><span>' + K.esc(regler[i] || '') + '</span></button>';
    root.innerHTML = '<div class="ft-tavle">' + ruter + '</div><p class="small">' + T('Trykk på et tall for å gi det en regel. Tavla huskes på denne telefonen.', 'Tap a number to give it a rule. The board is saved on this phone.') + '</p>' +
      '<div class="ft-skjema" hidden><label class="rof-lab" for="ftInp">' + T('Regel for ', 'Rule for ') + '<b class="ft-nr"></b></label><div class="rf-rad"><input id="ftInp" maxlength="40" placeholder="' + T('F.eks. bytt med «hallo»', 'E.g. replace it with “hello”') + '"><button class="btn gold" data-a="lagre">' + T('Lagre', 'Save') + '</button></div><button class="btn ghost small" data-a="fjern">' + T('Fjern regelen', 'Remove the rule') + '</button></div>' +
      '<button class="btn ghost" data-a="nullstill">' + T('Nullstill tavla', 'Reset the board') + '</button>';
  }
  var valgt = null;
  root.addEventListener('click', function (e) {
    var t = e.target.closest('[data-t]');
    if (t) { valgt = +t.dataset.t; var f = root.querySelector('.ft-skjema'); f.hidden = false; root.querySelector('.ft-nr').textContent = valgt; var i = root.querySelector('#ftInp'); i.value = regler[valgt] || ''; i.focus(); return; }
    var b = e.target.closest('[data-a]'); if (!b) return;
    if (b.dataset.a === 'lagre' && valgt) { var v = root.querySelector('#ftInp').value.trim(); if (v) regler[valgt] = v.slice(0, 40); lagre(); tegn(); }
    if (b.dataset.a === 'fjern' && valgt) { delete regler[valgt]; lagre(); tegn(); }
    if (b.dataset.a === 'nullstill') { regler = { 7: T('Ikke si 7', "Don't say 7") }; lagre(); tegn(); }
  });
  tegn();
})();
<\/script>`}${slug === "bossen-sier" && renderTemplate`<script data-astro-rerun>
(function () {
  var root = document.querySelector('[data-dl="bossen-sier"] .dl-body'); if (!root || root.dataset.bound) return; root.dataset.bound = '1';
  var K = window.BDK, T = K.T, KOM = ["Ta deg på nesa", "Reis deg opp", "Klapp tre ganger", "Pek på den som sist var på do", "Hold hånda i været", "Bytt plass med personen til venstre", "Ta på gulvet", "Lukk øynene", "Gi en high five til noen", "Snu deg rundt", "Legg tommelen på bordet", "Si navnet ditt baklengs", "Ta deg på hodet", "Stå på ett bein", "Lag en kattelyd", "Vink til noen", "Syng første linje av en julesang", "Si «skål» på et annet språk"];
  if (T(0, 1)) KOM = ["Touch your nose", "Stand up", "Clap three times", "Point at whoever last went to the loo", "Put your hand in the air", "Swap seats with the person on your left", "Touch the floor", "Close your eyes", "High-five someone", "Turn around", "Put your thumb on the table", "Say your name backwards", "Touch your head", "Stand on one leg", "Make a cat noise", "Wave at someone", "Sing the first line of a Christmas song", "Say “cheers” in another language"];
  var auto = null;
  root.innerHTML = '<p class="small">' + T('La telefonen være boss. Den roper kommandoer – bare de som starter med «Bossen sier» skal følges. Sistemann eller den som gjør feil, drikker.', 'Let the phone be the boss. It shouts out commands – only follow the ones that start with “Boss says”. The last one to do it, or anyone who gets it wrong, drinks.') + '</p>' +
    '<div class="boss-kort"><p class="boss-tekst">' + T('Klar?', 'Ready?') + '</p></div>' +
    '<div class="dl-knapper"><button class="btn gold" data-a="neste">' + T('Ny kommando', 'New command') + '</button><button class="btn ghost" data-a="auto">' + T('Automatisk', 'Auto') + '</button></div>';
  var el = root.querySelector('.boss-tekst'), kort = root.querySelector('.boss-kort');
  function neste() {
    var ekte = Math.random() < 0.7, k = KOM[Math.floor(Math.random() * KOM.length)];
    el.textContent = (ekte ? T('Bossen sier: ', 'Boss says: ') : '') + k + '!';
    kort.classList.toggle('lur', !ekte); kort.classList.remove('ny'); void kort.offsetWidth; kort.classList.add('ny');
  }
  function stopp() { clearTimeout(auto); auto = null; var b = root.querySelector('[data-a="auto"]'); if (b) b.textContent = T('Automatisk', 'Auto'); }
  function loop() { neste(); auto = setTimeout(loop, 5000 + Math.random() * 7000); }
  root.addEventListener('click', function (e) {
    var b = e.target.closest('[data-a]'); if (!b) return;
    if (b.dataset.a === 'neste') neste();
    if (b.dataset.a === 'auto') { if (auto) stopp(); else { loop(); b.textContent = T('Stopp', 'Stop'); } }
  });
  document.addEventListener('astro:before-swap', stopp, { once: true });
})();
<\/script>`}`;
}, "C:/Users/jonas/Documents/GitHub/banterdeck/src/components/DigitalLek.astro", void 0);
//#endregion
//#region src/pages/pluss-verktoy.astro
var pluss_verktoy_exports = /* @__PURE__ */ __exportAll({
	default: () => $$PlussVerktoy,
	file: () => $$file,
	prerender: () => false,
	url: () => $$url
});
createAstro("https://www.mittvors.no");
var $$PlussVerktoy = createComponent(async ($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$PlussVerktoy;
	const u = new URL(Astro.request.url);
	const slug = String(u.searchParams.get("slug") || "");
	const lang = u.searchParams.get("lang") === "en" ? "en" : "no";
	Astro.response.headers.set("Cache-Control", "private, no-store");
	Astro.response.headers.set("X-Robots-Tag", "noindex");
	let ok = false;
	if (PLUSS_SLUGS.includes(slug)) try {
		const b = await innloggetBruker(Astro.request);
		if (b) ok = (await plussStatus(b.id)).aktiv;
	} catch (e) {
		console.warn("Pluss-verktøy feilet:", e.message);
	}
	if (!ok) Astro.response.status = 403;
	return renderTemplate`${ok && renderTemplate`${renderComponent($$result, "GameTool", $$GameTool, {
		"slug": slug,
		"lang": lang
	})}`}${ok && renderTemplate`${renderComponent($$result, "DigitalLek", $$DigitalLek, {
		"slug": slug,
		"lang": lang
	})}`}`;
}, "C:/Users/jonas/Documents/GitHub/banterdeck/src/pages/pluss-verktoy.astro", void 0);
var $$file = "C:/Users/jonas/Documents/GitHub/banterdeck/src/pages/pluss-verktoy.astro";
var $$url = "/pluss-verktoy";
//#endregion
//#region \0virtual:astro:page:src/pages/pluss-verktoy@_@astro
var page = () => pluss_verktoy_exports;
//#endregion
export { page };
