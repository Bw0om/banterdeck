import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import "./config_DZEmFZJP.mjs";
//#region src/pages/api/forslag.ts
var forslag_exports = /* @__PURE__ */ __exportAll({
	POST: () => POST,
	prerender: () => false
});
var json = (body, status = 200) => new Response(JSON.stringify(body), {
	status,
	headers: { "Content-Type": "application/json" }
});
var siste = /* @__PURE__ */ new Map();
var POST = async ({ request, clientAddress }) => {
	let d;
	try {
		d = await request.json();
	} catch {
		return json({
			ok: false,
			error: "Ugyldig forespørsel"
		}, 400);
	}
	if (d.website) return json({ ok: true });
	const ip = String(clientAddress || request.headers.get("x-forwarded-for") || "?");
	const naa = Date.now(), liste = (siste.get(ip) || []).filter((t) => naa - t < 36e5);
	if (liste.length && naa - liste[liste.length - 1] < 2e4 || liste.length >= 30) return json({
		ok: false,
		error: "Vent litt før du sender en ny."
	}, 429);
	liste.push(naa);
	siste.set(ip, liste);
	if (siste.size > 5e3) siste.clear();
	if (d.type === "lek") return foreslaLek(d);
	const line = String(d.line || "").trim();
	const ctx = String(d.ctx || "").trim().slice(0, 120);
	const kategori = String(d.kategori || "").trim().slice(0, 80);
	const navn = String(d.navn || "").trim().slice(0, 60);
	if (line.length < 3 || line.length > 300) return json({
		ok: false,
		error: "Replikken må være 3–300 tegn"
	}, 400);
	const env = typeof process !== "undefined" && process.env || {};
	const token = env.GITHUB_TOKEN || void 0;
	const repo = env.GITHUB_REPO || "Bw0om/banterdeck";
	if (!token) return json({
		ok: false,
		error: "GITHUB_TOKEN mangler i Vercel (Settings → Environment Variables)"
	}, 500);
	if (!repo) return json({
		ok: false,
		error: "GITHUB_REPO mangler i Vercel (Settings → Environment Variables)"
	}, 500);
	const meta = JSON.stringify({
		k: kategori,
		c: ctx,
		l: line,
		n: navn
	});
	const body = [
		`**Kategori:** ${kategori || "ikke valgt"}`,
		ctx ? `**Kontekst:** ${ctx}` : "",
		`**Replikk:** ${line}`,
		navn ? `**Fra:** ${navn}` : "",
		"",
		`<!-- ${meta} -->`
	].filter((x) => x !== "").join("\n");
	const r = await fetch(`https://api.github.com/repos/${repo}/issues`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${token}`,
			Accept: "application/vnd.github+json",
			"Content-Type": "application/json"
		},
		body: JSON.stringify({
			title: `Forslag: ${line.slice(0, 60)}`,
			body,
			labels: ["forslag"]
		})
	});
	if (!r.ok) {
		let detail = "";
		try {
			detail = (await r.json()).message || "";
		} catch {}
		return json({
			ok: false,
			error: `GitHub svarte ${r.status}. ${detail}`.trim()
		}, 502);
	}
	return json({ ok: true });
};
async function foreslaLek(d) {
	const rens = (x, n) => String(x || "").replace(/[\u0000-\u0008\u000b-\u001f<>]/g, "").trim().slice(0, n);
	const navn = rens(d.lekNavn, 60), pl = rens(d.pl, 12), utstyr = rens(d.utstyr, 120), regler = rens(d.regler, 3e3), fra = rens(d.navn, 60);
	if (navn.length < 2) return json({
		ok: false,
		error: "Gi leken et navn."
	}, 400);
	if (regler.length < 30) return json({
		ok: false,
		error: "Skriv reglene litt mer utfyllende (minst 30 tegn)."
	}, 400);
	const env = typeof process !== "undefined" && process.env || {};
	const token = env.GITHUB_TOKEN || void 0;
	const repo = env.GITHUB_REPO || "Bw0om/banterdeck";
	if (!token || !repo) return json({
		ok: false,
		error: "Forslag er ikke satt opp ennå."
	}, 500);
	const meta = JSON.stringify({
		t: "lek",
		navn,
		pl,
		utstyr,
		regler,
		n: fra
	});
	const body = [
		`**Ny drikkelek:** ${navn}`,
		pl ? `**Spillere:** ${pl}` : "",
		utstyr ? `**Utstyr:** ${utstyr}` : "",
		"",
		"**Regler:**",
		regler,
		"",
		fra ? `**Fra:** ${fra}` : "",
		"",
		`<!-- ${meta.replace(/-->/g, "—>")} -->`
	].filter((x, i, a) => x !== "" || a[i - 1] !== "").join("\n");
	const r = await fetch(`https://api.github.com/repos/${repo}/issues`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${token}`,
			Accept: "application/vnd.github+json",
			"Content-Type": "application/json"
		},
		body: JSON.stringify({
			title: `Forslag (lek): ${navn}`,
			body,
			labels: ["forslag"]
		})
	});
	if (!r.ok) return json({
		ok: false,
		error: `GitHub svarte ${r.status}.`
	}, 502);
	return json({ ok: true });
}
//#endregion
//#region \0virtual:astro:page:src/pages/api/forslag@_@ts
var page = () => forslag_exports;
//#endregion
export { page };
