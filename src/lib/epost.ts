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

export async function sendEpost(til: string, emne: string, html: string, tekst: string, svarTil?: string) {
  if (!epostKlar() || !til) return false;
  const e = env();
  await hent().sendMail({ from: `"Mitt vors" <${e.SMTP_USER}>`, replyTo: svarTil || e.SMTP_USER, to: til, subject: emne, html, text: tekst });
  return true;
}

const esc = (s: any) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' } as any)[c]);

/** Kvittering etter kjøp av Pluss (varig medium: bekrefter kjøpet og at angreretten falt bort). */
export function kvitteringEpost(b: { ref: string; produkt: string; belop_ore: number; fullfort?: string; laget?: string }, lenke: string) {
  const produkt = b.produkt === 'aar' ? 'mittvors pluss – årspass (365 dager)' : 'mittvors pluss – kveldspass (24 timer)';
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

/** Invitasjon fra en venn. Teksten tilpasses lenken: rom, gjeng, verving eller bare siden. */
export function invitasjonEpost(o: { navn: string; melding: string; lenke: string; en: boolean }) {
  const T = (no: string, en: string) => (o.en ? en : no);
  const u = new URL(o.lenke);
  const k = u.searchParams.get('k') || (/^\/[A-Za-z0-9]{4}$/.test(u.pathname) ? u.pathname.slice(1).toUpperCase() : '');
  const erRom = /\/(rom|room)$/.test(u.pathname) || /^\/[A-Za-z0-9]{4}$/.test(u.pathname);
  const erGjeng = /\/(gjeng|crew)$/.test(u.pathname);
  const erVerv = u.searchParams.has('v');
  const navn = esc(o.navn);
  const emne = erRom ? T(`${o.navn} inviterer deg til vors på Mitt vors`, `${o.navn} invited you to a party on Mitt vors`)
    : erGjeng ? T(`${o.navn} vil ha deg med i gjengen på Mitt vors`, `${o.navn} wants you in their crew on Mitt vors`)
    : T(`${o.navn} inviterer deg til Mitt vors`, `${o.navn} invited you to Mitt vors`);
  const ingress = erRom ? T('Bli med i rommet – alle spiller fra sin egen telefon. Ingen app å laste ned.', 'Join the room – everyone plays from their own phone. No app to download.')
    : erGjeng ? T('Bli med i gjengen og følg sesongtabellen fra kveld til kveld.', 'Join the crew and follow the season table from night to night.')
    : erVerv ? T('Lag en gratis konto med lenken – spiller du ditt første rom, får dere begge en gratis kveld med Pluss 🎁', 'Create a free account with the link – play your first room and you both get a free night of Pluss 🎁')
    : T('Drikkeleker og vorsmoro der alle spiller fra sin egen telefon.', 'Drinking games and pre-party fun where everyone plays from their own phone.');
  const knapp = erRom ? T('Bli med i rommet', 'Join the room') : erGjeng ? T('Se gjengen', 'See the crew') : T('Åpne Mitt vors', 'Open Mitt vors');
  const html = `<!doctype html><html lang="${o.en ? 'en' : 'no'}"><body style="margin:0;background:#f7f1e6;font-family:Arial,Helvetica,sans-serif;color:#1d160c">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fffdf8;border-radius:16px;padding:28px">
<tr><td style="font-size:22px;font-weight:800;letter-spacing:-.5px">mitt<span style="color:#bb3b1d">vors</span></td></tr>
<tr><td style="padding-top:14px;font-size:24px;font-weight:800;line-height:1.25">${esc(emne)} 🎉</td></tr>
${o.melding ? `<tr><td style="padding-top:14px"><div style="background:#f4b74026;border-left:4px solid #f4b740;padding:10px 14px;font-size:16px;font-style:italic">«${esc(o.melding)}»<br><span style="font-style:normal;font-size:13px;color:#6f604b">– ${navn}</span></div></td></tr>` : ''}
<tr><td style="padding-top:14px;font-size:15px;line-height:1.5">${ingress}</td></tr>
${erRom && k ? `<tr><td style="padding-top:14px;font-size:14px;color:#6f604b">${T('Romkode', 'Room code')}: <b style="font-size:22px;letter-spacing:3px;color:#1d160c">${esc(k)}</b></td></tr>` : ''}
<tr><td style="padding-top:18px"><a href="${esc(o.lenke)}" style="display:inline-block;background:#ff6a4d;color:#141009;text-decoration:none;font-weight:700;padding:13px 22px;border-radius:999px">${knapp}</a></td></tr>
<tr><td style="padding-top:22px;font-size:12px;line-height:1.5;color:#6f604b;border-top:1px solid #e6dccb">${T(`Du får denne e-posten fordi ${navn} skrev inn adressen din på mittvors.no. Vi lagrer den ikke, og du får ingen flere e-poster fra oss uten at noen inviterer deg igjen. Svar på e-posten for å svare ${navn}. Mitt vors er for personer over 18 år.`, `You’re getting this because ${navn} entered your address on mittvors.no. We don’t store it, and you won’t get more emails from us unless someone invites you again. Reply to answer ${navn}. Mitt vors is for people over 18.`)}</td></tr>
</table></td></tr></table></body></html>`;
  const tekst = `${emne}\n\n${o.melding ? '«' + o.melding + '» – ' + o.navn + '\n\n' : ''}${ingress.replace(/<[^>]+>/g, '')}\n${erRom && k ? T('Romkode', 'Room code') + ': ' + k + '\n' : ''}\n${o.lenke}\n\n${T('Du får denne e-posten fordi ' + o.navn + ' skrev inn adressen din på mittvors.no. Vi lagrer den ikke.', 'You’re getting this because ' + o.navn + ' entered your address on mittvors.no. We don’t store it.')}`;
  return { emne, html, tekst };
}
