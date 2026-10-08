import { a as Fragment, d as renderTemplate, f as maybeRenderHead, h as defineScriptVars, i as renderComponent, m as addAttribute, w as createAstro } from "./server_Bjx7FWTN.mjs";
import { t as createComponent } from "./compiler_Bf6GLUpQ.mjs";
import { t as $$Base } from "./Base_CrQzSnO-.mjs";
import { a as rundeId, i as publiserteRunder, r as publiseringstid } from "./nyhetsrunden_D1RpSAip.mjs";
import { t as $$NyhetsVarsel } from "./NyhetsVarsel_v9bk1ffm.mjs";
//#region src/components/pages/Nyhetsrunden.astro
createAstro("https://www.mittvors.no");
var $$Nyhetsrunden = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$Nyhetsrunden;
	const { runde, erSiste = false, neste = null } = Astro.props;
	const nesteTid = neste ? new Intl.DateTimeFormat("nb-NO", {
		timeZone: "Europe/Oslo",
		weekday: "long",
		hour: "2-digit",
		minute: "2-digit"
	}).format(new Date(publiseringstid(neste))) : "";
	const andre = publiserteRunder().filter((r) => rundeId(r) !== rundeId(runde));
	return renderTemplate`${renderComponent($$result, "Base", $$Base, {
		"title": `Nyhetsrunden – uke ${runde.uke}`,
		"lang": "no",
		"gate": true,
		"bilde": "/og/nyhetsrunden.jpg",
		"description": `Ukas nyheter som drikkelek. ${runde.ingress}`
	}, { "default": ($$result) => renderTemplate`${maybeRenderHead($$result)}<p class="crumb"><a href="/no/">Forside</a> › <a href="/no/drinking-games">Drikkeleker</a> › <a href="/no/nyhetsrunden">Nyhetsrunden</a>${!erSiste && renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": ($$result) => renderTemplate` › Uke ${runde.uke}` })}`}</p><p class="nr-uke">${runde.aar} · uke ${runde.uke}</p><h1>Nyhetsrunden</h1><p class="lead">${runde.ingress}</p>${neste && renderTemplate`<p class="nr-neste">Uke ${neste.uke} slippes ${nesteTid}.</p>`}<p><a class="btn ghost small"${addAttribute(`/no/rom?lek=nyhetsrunden&modus=${rundeId(runde)}`, "href")}>Spill fra hver sin telefon</a></p><span hidden data-spilt="lek:nyhetsrunden"></span><section class="gt nr"${addAttribute(rundeId(runde), "data-runde")}><div class="gt-body"></div><script data-astro-rerun>(function(){${defineScriptVars({ R: runde })}
    (function () {
      var root = document.currentScript.closest('.nr');
      var body = root.querySelector('.gt-body');
      if (root.dataset.bound) return; root.dataset.bound = '1';
      var TYPER = { valg:'Velg riktig', sant:'Sant eller tull?', tall:'Hvilket tall?', fritt:'Svar fritt' };
      var nr = 0, S = R.sporsmal, rekkefolge = {}, folk = [], poeng = [], svarLogg = {};
      // alternativene stokkes, så det riktige svaret ikke alltid står på samme plass
      function alternativer(i){
        if (!rekkefolge[i]){ var a = S[i].alt.slice();
          for (var k=a.length-1;k>0;k--){ var j=Math.floor(Math.random()*(k+1)); var t=a[k]; a[k]=a[j]; a[j]=t; }
          rekkefolge[i] = a; }
        return rekkefolge[i];
      }
      function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
      function vis(html){
        body.innerHTML = html;
        var topp = window.innerWidth < 900 ? 130 : 24, y = root.getBoundingClientRect().top;
        if (y < topp - 40 || y > window.innerHeight * 0.5) window.scrollTo({ top: window.scrollY + y - topp, behavior: 'smooth' });
      }
      function start(){
        vis('<ul class="nr-regler">' +
          '<li>Telefonen går rundt bordet. Les spørsmålet høyt for den som står for tur.</li>' +
          '<li><b>Riktig:</b> del ut én slurk. <b>Feil:</b> drikk én.</li>' +
          '<li><b>Står du over:</b> drikk én – og bordet kan stjele. Riktig gir to slurker å dele ut, feil gir to å drikke.</li>' +
          '<li>På tallspørsmål er alt innenfor 10 prosent riktig.</li></ul>' +
          '<label class="rof-lab" for="nrFolk">Hvem er med? <span class="small">(valgfritt – da teller siden poengene)</span></label>' +
          '<input class="rof-inp" id="nrFolk" placeholder="Jonas, Maria, Petter" value="' + esc(husk()) + '">' +
          '<button class="btn gold vp-big" data-a="start">Start runden · ' + S.length + ' spørsmål</button>');
      }
      function husk(v){ try { if (v === undefined) return localStorage.getItem('bd_spillere') || ''; localStorage.setItem('bd_spillere', v); } catch (e) { return ''; } }
      function hvem(){ return folk.length ? folk[nr % folk.length] : ''; }
      function spm(visSvar){
        var s = S[nr];
        var alt = s.type === 'valg' ? '<ol class="nr-alt">' + alternativer(nr).map(function(a){
              return '<li class="' + (visSvar && a === s.svar ? 'rett' : '') + '">' + esc(a) + '</li>'; }).join('') + '</ol>' : '';
        vis('<p class="gt-count">' + (nr+1) + ' / ' + S.length + ' · ' + TYPER[s.type] + '</p>' +
          (folk.length ? '<p class="nr-tur">Til <b>' + esc(hvem()) + '</b></p>' : '') +
          '<p class="gt-text">' + esc(s.q) + '</p>' + alt +
          (visSvar
            ? '<div class="nr-svar"><p class="nr-fasit">' + esc(s.svar) + '</p>' + (s.info ? '<p>' + esc(s.info) + '</p>' : '') +
              (s.url ? '<p class="small"><a href="' + esc(s.url) + '" target="_blank" rel="noopener">Les saken hos ' + esc(s.kilde) + ' ↗</a></p>' : '') + '</div>' +
              (folk.length
                ? '<div class="nr-dom"><button class="btn gold" data-a="rett">✓ ' + esc(hvem()) + ' hadde rett</button><button class="btn ghost" data-a="feil">✗ Feil</button></div>'
                : '<button class="btn gold vp-big" data-a="neste">' + (nr < S.length-1 ? 'Neste person' : 'Avslutt runden') + '</button>')
            : '<button class="btn gold vp-big" data-a="svar">Vis svar</button>') +
          '<div class="gt-row"><button class="btn ghost" data-a="tilbake"' + (nr===0 ? ' disabled' : '') + '>Tilbake</button></div>');
      }
      function slutt(){
        try { var sp = JSON.parse(localStorage.getItem('bd_nr_spilt') || '[]'); var id = root.dataset.runde;
          if (sp.indexOf(id) === -1) { sp.push(id); localStorage.setItem('bd_nr_spilt', JSON.stringify(sp.slice(-300))); } } catch (e) {}
        if (folk.length) {
          var liste = folk.map(function (n, i) { return { n: n, p: poeng[i] }; }).sort(function (a, b) { return b.p - a.p; });
          var topp = liste[0].p, vinnere = liste.filter(function (x) { return x.p === topp; }).map(function (x) { return x.n; });
          vis('<div class="vp-center"><h2>🏆 ' + esc(vinnere.join(' og ')) + ' vant uka!</h2><p>Vinneren deler ut tre slurker. Sistemann skåler for nyhetsbildet.</p></div>' +
            '<ol class="rom-resultat">' + liste.map(function (x) { return '<li><span>' + esc(x.n) + '</span><b>' + x.p + ' riktige</b></li>'; }).join('') + '</ol>' +
            '<button class="btn gold vp-big" data-a="igjen">Ta runden på nytt</button>');
          return;
        }
        vis('<div class="vp-center"><h2>Det var uka.</h2><p>Alle skåler for nyhetsbildet. Ny runde kommer fredag kl. 12.</p></div>' +
          '<button class="btn gold vp-big" data-a="igjen">Ta runden på nytt</button>');
      }
      body.addEventListener('click', function(e){
        var b = e.target.closest('button'); if (!b) return;
        var a = b.dataset.a;
        if (a === 'start'){
          var inp = body.querySelector('#nrFolk'), v = inp ? inp.value : '';
          folk = v.split(',').map(function (x) { return x.trim(); }).filter(Boolean).slice(0, 12);
          if (folk.length) husk(v);
          poeng = folk.map(function () { return 0; }); svarLogg = {};
        }
        if (a === 'igjen'){ poeng = folk.map(function () { return 0; }); svarLogg = {}; }
        if (a === 'start' || a === 'igjen'){ nr = 0; rekkefolge = {}; spm(false); }
        else if (a === 'rett' || a === 'feil'){
          var i = nr % folk.length;
          if (svarLogg[nr] === true) poeng[i]--;              // rettet et tidligere svar
          svarLogg[nr] = a === 'rett'; if (a === 'rett') poeng[i]++;
          if (nr < S.length-1){ nr++; spm(false); } else slutt();
        }
        else if (a === 'svar') spm(true);
        else if (a === 'neste'){ if (nr < S.length-1){ nr++; spm(false); } else slutt(); }
        else if (a === 'tilbake' && nr > 0){ nr--; spm(false); }
        if (folk.length && !body.querySelector('.vp-center') && (a === 'svar' || a === 'rett' || a === 'feil' || a === 'tilbake')) {
          var t = body.querySelector('.nr-stilling');
          if (!t) { t = document.createElement('p'); t.className = 'nr-stilling small'; body.appendChild(t); }
          t.textContent = folk.map(function (n, i) { return n + ' ' + poeng[i]; }).join(' · ');
        }
      });
      start();
    })();
    })();<\/script></section>${renderComponent($$result, "NyhetsVarsel", $$NyhetsVarsel, {})}${andre.length > 0 && renderTemplate`<section class="more"><h2>Tidligere uker</h2><ul class="nr-arkiv">${andre.slice(0, 4).map((r) => renderTemplate`<li><a${addAttribute(`/no/nyhetsrunden/${rundeId(r)}`, "href")}><b>${r.aar} · uke ${r.uke}</b><span>${r.ingress}</span></a></li>`)}</ul><p><a class="btn ghost" href="/no/nyhetsrunden/arkiv">Hele arkivet · ${andre.length + 1} uker</a></p></section>`}<p class="small" style="margin-top:22px">Ny runde hver fredag kl. 12, laget fra ukas saker i norske nyhetsmedier.</p>` })}`;
}, "C:/Users/jonas/Documents/GitHub/banterdeck/src/components/pages/Nyhetsrunden.astro", void 0);
//#endregion
//#region src/components/pages/NyhetsrundenKommer.astro
createAstro("https://www.mittvors.no");
var $$NyhetsrundenKommer = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$props, $$slots);
	Astro.self = $$NyhetsrundenKommer;
	const { neste } = Astro.props;
	const fra = neste ? publiseringstid(neste) : 0;
	const naar = neste ? new Intl.DateTimeFormat("nb-NO", {
		timeZone: "Europe/Oslo",
		weekday: "long",
		day: "numeric",
		month: "long",
		hour: "2-digit",
		minute: "2-digit"
	}).format(new Date(fra)) : "";
	const tidligere = publiserteRunder().slice(0, 6);
	return renderTemplate`${renderComponent($$result, "Base", $$Base, {
		"title": neste ? `Nyhetsrunden – uke ${neste.uke}` : "Nyhetsrunden",
		"lang": "no",
		"gate": true,
		"bilde": "/og/nyhetsrunden.jpg",
		"description": "Ukas nyheter som drikkelek. Ny runde hver fredag kl. 12."
	}, { "default": ($$result) => renderTemplate`${maybeRenderHead($$result)}<p class="crumb"><a href="/no/">Forside</a> › <a href="/no/drinking-games">Drikkeleker</a> › Nyhetsrunden</p><h1>Nyhetsrunden</h1>${neste ? renderTemplate`<div class="nr-kommer"${addAttribute(fra, "data-fra")}><p class="nr-uke">${neste.aar} · uke ${neste.uke}</p><p class="dl-melding dl-stor">Slippes ${naar}</p><p class="nr-nedtelling" id="nrNed" aria-live="off"></p></div>` : renderTemplate`<p class="lead">Første runde kommer snart.</p>`}${renderComponent($$result, "NyhetsVarsel", $$NyhetsVarsel, {})}${tidligere.length > 0 && renderTemplate`<section class="more"><h2>Spill en tidligere uke</h2><ul class="nr-arkiv">${tidligere.map((r) => renderTemplate`<li><a${addAttribute(`/no/nyhetsrunden/${rundeId(r)}`, "href")}><b>${r.aar} · uke ${r.uke}</b><span>${r.ingress}</span></a></li>`)}</ul></section>`}<script data-astro-rerun>
  (function () {
    var el = document.querySelector('.nr-kommer'), ut = document.getElementById('nrNed');
    if (!el || !ut || el.dataset.bound) return; el.dataset.bound = '1';
    var fra = Number(el.dataset.fra), t = setInterval(tikk, 1000);
    function tikk() {
      var igjen = Math.max(0, fra - Date.now());
      if (!document.body.contains(ut)) return clearInterval(t);
      if (igjen <= 0) { clearInterval(t); ut.textContent = 'Den er ute nå!'; setTimeout(function () { location.reload(); }, 1500 + Math.random() * 3000); return; }
      var s = Math.floor(igjen / 1000), d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60), sek = s % 60;
      ut.textContent = (d ? d + ' d ' : '') + String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ':' + String(sek).padStart(2, '0');
    }
    tikk();
  })();
  <\/script>` })}`;
}, "C:/Users/jonas/Documents/GitHub/banterdeck/src/components/pages/NyhetsrundenKommer.astro", void 0);
//#endregion
export { $$Nyhetsrunden as n, $$NyhetsrundenKommer as t };
