// Sender e-post fra post@mittvors.no via SMTP hos Webhuset.
// Miljøvariabler i Vercel: SMTP_HOST (smtp.webhuset.no), SMTP_PORT (465), SMTP_USER (post@mittvors.no), SMTP_PASS (passordet – Secret).
// Mangler de, sendes ingenting (siden virker likevel).
import nodemailer from 'nodemailer';
import { SELGER } from '../config';

function env(): any { return (typeof process !== 'undefined' && process.env) || {}; }
export function epostKlar() { const e = env(); return !!(e.SMTP_HOST && e.SMTP_USER && e.SMTP_PASS); }

let transport: any = null;
function hent() {
  if (transport) return transport;
  const e = env(), port = Number(e.SMTP_PORT || 465);
  transport = nodemailer.createTransport({
    host: e.SMTP_HOST, port, secure: port === 465,
    auth: { user: e.SMTP_USER, pass: e.SMTP_PASS },
  });
  return transport;
}

export async function sendEpost(til: string, emne: string, html: string, tekst: string) {
  if (!epostKlar() || !til) return false;
  const e = env();
  await hent().sendMail({ from: `"Mitt vors" <${e.SMTP_USER}>`, replyTo: e.SMTP_USER, to: til, subject: emne, html, text: tekst });
  return true;
}

const esc = (s: any) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' } as any)[c]);

/** Kvittering etter kjøp av Pluss (varig medium: bekrefter kjøpet og at angreretten falt bort). */
export function kvitteringEpost(b: { ref: string; produkt: string; belop_ore: number; fullfort?: string; laget?: string }, lenke: string) {
  const produkt = b.produkt === 'aar' ? 'Mitt vors Pluss – årspass (365 dager)' : 'Mitt vors Pluss – kveldspass (24 timer)';
  const kr = (b.belop_ore / 100).toFixed(2).replace('.', ',');
  const tid = new Date(b.fullfort || b.laget || Date.now()).toLocaleString('nb-NO', { timeZone: 'Europe/Oslo', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const angrerett = 'Pluss ble levert med en gang etter kjøpet. Før kjøpet samtykket du til at leveringen skulle starte umiddelbart, og bekreftet at angreretten dermed faller bort (angrerettloven § 22 bokstav n).';
  const selger = `${SELGER.navn} · Org.nr. ${SELGER.orgnr} · ${SELGER.adresse} · Tlf. ${SELGER.telefon} · ${SELGER.epost}`;
  const html = `<!doctype html><html lang="no"><body style="margin:0;background:#f7f1e6;font-family:Arial,Helvetica,sans-serif;color:#1d160c">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fffdf8;border-radius:16px;padding:28px">
<tr><td style="font-size:22px;font-weight:800;letter-spacing:-.5px">mitt<span style="color:#bb3b1d">vors</span></td></tr>
<tr><td style="padding-top:14px;font-size:24px;font-weight:800">Takk for kjøpet! ✨</td></tr>
<tr><td style="padding-top:8px;font-size:15px;line-height:1.5">Her er kvitteringen din. Pluss er allerede aktivert på kontoen din.</td></tr>
<tr><td style="padding-top:18px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:15px;border-top:2px solid #1d160c">
<tr><td style="padding:10px 0;border-bottom:1px solid #e6dccb">${esc(produkt)}</td><td align="right" style="padding:10px 0;border-bottom:1px solid #e6dccb;white-space:nowrap">${kr} kr</td></tr>
<tr><td style="padding:10px 0;font-weight:800">Totalt betalt (Vipps)</td><td align="right" style="padding:10px 0;font-weight:800">${kr} kr</td></tr></table></td></tr>
<tr><td style="padding-top:6px;font-size:13px;color:#6f604b">Ordrenummer ${esc(b.ref)} · ${esc(tid)}</td></tr>
<tr><td style="padding-top:16px;font-size:13.5px;line-height:1.5">${angrerett} Pluss fornyes ikke automatisk.</td></tr>
<tr><td style="padding-top:18px"><a href="${esc(lenke)}" style="display:inline-block;background:#f4b740;color:#1d160c;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:999px">Se kvitteringen på nett</a></td></tr>
<tr><td style="padding-top:22px;font-size:12px;line-height:1.5;color:#6f604b;border-top:1px solid #e6dccb">Selger: ${esc(selger)}<br>Spørsmål? Svar på denne e-posten.</td></tr>
</table></td></tr></table></body></html>`;
  const tekst = `Takk for kjøpet!\n\n${produkt}: ${kr} kr (betalt med Vipps)\nOrdrenummer: ${b.ref}\nTidspunkt: ${tid}\n\n${angrerett} Pluss fornyes ikke automatisk.\n\nKvitteringen på nett: ${lenke}\n\nSelger: ${selger}`;
  return { emne: `Kvittering: ${produkt}`, html, tekst };
}
