// Kjøp i iPhone-appen (StoreKit 2): appen sender Apples signerte transaksjon (en JWS) hit, og vi sjekker signaturen
// selv mot Apples rotsertifikat – ingen nøkler, ingen kall til Apple. Deretter gis Pluss på kontoen akkurat som etter et Vipps-kjøp.
import { X509Certificate, verify as kryptoVerify } from 'node:crypto';

export const APPLE_PRODUKTER: Record<string, string> = {
  'no.mittvors.pluss.kveld': 'kveld',
  'no.mittvors.pluss.aar': 'aar',
};
export const APPLE_BUNDLE = 'no.mittvors.app';

/** Apple Root CA - G3 (https://www.apple.com/certificateauthority/). Alle App Store-signaturer ender her. */
const APPLE_ROT_PEM = `-----BEGIN CERTIFICATE-----
MIICQzCCAcmgAwIBAgIILcX8iNLFS5UwCgYIKoZIzj0EAwMwZzEbMBkGA1UEAwwS
QXBwbGUgUm9vdCBDQSAtIEczMSYwJAYDVQQLDB1BcHBsZSBDZXJ0aWZpY2F0aW9u
IEF1dGhvcml0eTETMBEGA1UECgwKQXBwbGUgSW5jLjELMAkGA1UEBhMCVVMwHhcN
MTQwNDMwMTgxOTA2WhcNMzkwNDMwMTgxOTA2WjBnMRswGQYDVQQDDBJBcHBsZSBS
b290IENBIC0gRzMxJjAkBgNVBAsMHUFwcGxlIENlcnRpZmljYXRpb24gQXV0aG9y
aXR5MRMwEQYDVQQKDApBcHBsZSBJbmMuMQswCQYDVQQGEwJVUzB2MBAGByqGSM49
AgEGBSuBBAAiA2IABJjpLz1AcqTtkyJygRMc3RCV8cWjTnHcFBbZDuWmBSp3ZHtf
TjjTuxxEtX/1H7YyYl3J6YRbTzBPEVoA/VhYDKX1DyxNB0cTddqXl5dvMVztK517
IDvYuVTZXpmkOlEKMaNCMEAwHQYDVR0OBBYEFLuw3qFYM4iapIqZ3r6966/ayySr
MA8GA1UdEwEB/wQFMAMBAf8wDgYDVR0PAQH/BAQDAgEGMAoGCCqGSM49BAMDA2gA
MGUCMQCD6cHEFl4aXTQY2e3v9GwOAEZLuN+yRhHFD/3meoyhpmvOwgPUnPWTxnS4
at+qIxUCMG1mihDK1A3UT82NQz60imOlM27jbdoXt2QfyFMm+YhidDkLF1vLUagM
6BgD56KyKA==
-----END CERTIFICATE-----`;
const APPLE_ROT_FINGERAVTRYKK = '63:34:3A:BF:B8:9A:6A:03:EB:B5:7E:9B:3F:5F:A7:BE:7C:4F:5C:75:6F:30:17:B3:A8:C4:88:C3:65:3E:91:79';

export type AppleTransaksjon = {
  transactionId: string; originalTransactionId: string; productId: string; bundleId: string;
  purchaseDate: number; environment: string; type: string; revocationDate?: number; quantity?: number;
};

function b64url(s: string) { return Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64'); }
function pem(der: Buffer) { return '-----BEGIN CERTIFICATE-----\n' + der.toString('base64').match(/.{1,64}/g)!.join('\n') + '\n-----END CERTIFICATE-----'; }

/**
 * Sjekker en signert transaksjon fra StoreKit 2. Kaster med en kort norsk melding om noe er galt.
 * - sertifikatkjeden (x5c) må ende i Apples rotsertifikat, og hvert ledd må være signert av det neste
 * - signaturen (ES256) må stemme med bladsertifikatets nøkkel
 * - appen må være vår, produktet et av våre, og kjøpet ikke tilbakebetalt
 */
export function sjekkAppleJws(jws: string): AppleTransaksjon {
  const deler = String(jws || '').split('.');
  if (deler.length !== 3) throw new Error('Ikke en gyldig kvittering.');
  let hode: any; try { hode = JSON.parse(b64url(deler[0]).toString('utf8')); } catch { throw new Error('Ikke en gyldig kvittering.'); }
  if (hode.alg !== 'ES256' || !Array.isArray(hode.x5c) || hode.x5c.length < 2) throw new Error('Kvitteringen har feil form.');

  const kjede = hode.x5c.map((c: string) => new X509Certificate(pem(Buffer.from(c, 'base64'))));
  const rot = new X509Certificate(APPLE_ROT_PEM);
  if (rot.fingerprint256 !== APPLE_ROT_FINGERAVTRYKK) throw new Error('Rotsertifikatet stemmer ikke.');
  const naa = Date.now();
  for (let i = 0; i < kjede.length; i++) {
    const c = kjede[i], utsteder = i + 1 < kjede.length ? kjede[i + 1] : rot;
    if (naa < Date.parse(c.validFrom) || naa > Date.parse(c.validTo)) throw new Error('Et sertifikat i kjeden er utløpt.');
    if (!c.verify(utsteder.publicKey)) throw new Error('Sertifikatkjeden er brutt.');
  }
  // Siste ledd i kjeden skal være rota selv, eller være signert av den (sjekket over)
  const sist = kjede[kjede.length - 1];
  if (sist.fingerprint256 !== APPLE_ROT_FINGERAVTRYKK && !sist.verify(rot.publicKey)) throw new Error('Kjeden ender ikke hos Apple.');

  const ok = kryptoVerify('sha256', Buffer.from(deler[0] + '.' + deler[1], 'ascii'), { key: kjede[0].publicKey, dsaEncoding: 'ieee-p1363' }, b64url(deler[2]));
  if (!ok) throw new Error('Signaturen stemmer ikke.');

  let t: AppleTransaksjon; try { t = JSON.parse(b64url(deler[1]).toString('utf8')); } catch { throw new Error('Ikke en gyldig kvittering.'); }
  if (t.bundleId !== APPLE_BUNDLE) throw new Error('Kvitteringen gjelder en annen app.');
  if (!APPLE_PRODUKTER[t.productId]) throw new Error('Ukjent produkt.');
  if (t.revocationDate) throw new Error('Kjøpet er tilbakebetalt.');
  if (!t.transactionId) throw new Error('Kvitteringen mangler id.');
  return t;
}
