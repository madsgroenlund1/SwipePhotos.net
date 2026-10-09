import { X509Certificate, verify as cryptoVerify } from 'node:crypto'

// ─── Apple In-App Purchase (StoreKit 2) server-side verification ─────────────
//
// StoreKit 2 hands the app a signed JWS for every transaction, and Apple's App
// Store Server Notifications V2 are JWS too. Both are signed with a leaf cert
// that chains (leaf → WWDR intermediate → Apple Root CA - G3). We verify the
// whole chain against Apple's root, so a forged "receipt" can never unlock
// photos.

export const APPLE_BUNDLE_ID = process.env.APPLE_BUNDLE_ID || 'net.swipephotos.app'

// Apple Root CA - G3 (public certificate, valid until 2039-04-30).
// SHA-256: 63:34:3A:BF:B8:9A:6A:03:EB:B5:7E:9B:3F:5F:A7:BE:7C:4F:5C:75:6F:30:17:B3:A8:C4:88:C3:65:3E:91:79
export const APPLE_ROOT_CA_G3_PEM = `-----BEGIN CERTIFICATE-----
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
-----END CERTIFICATE-----`

// DER-encoded Apple marker OIDs that must be present on the chain certs:
//   1.2.840.113635.100.6.11.1  (leaf: "Mac App Store Receipt Signing")
//   1.2.840.113635.100.6.2.1   (intermediate: "Worldwide Developer Relations")
const OID_LEAF = Buffer.from('060a2a864886f76364060b01', 'hex')
const OID_INTERMEDIATE = Buffer.from('060a2a864886f76364060201', 'hex')

// Local end-to-end tests (scripts/test-iap-flow.mts) sign with their own
// certificate chain. This override only exists outside production, so it can
// never weaken verification on Vercel (NODE_ENV is always "production" there).
const TEST_ROOT_PEM = process.env.NODE_ENV !== 'production' ? process.env.APPLE_IAP_TEST_ROOT_PEM : undefined

export class AppleVerificationError extends Error {}

function b64urlDecode(s: string): Buffer {
  return Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64')
}

/**
 * Verifies an Apple-signed JWS (StoreKit 2 transaction/renewal info or an App
 * Store Server Notification) and returns its decoded payload.
 * `rootPem` is overridable for tests only.
 */
export function verifyAppleJWS<T = Record<string, unknown>>(
  jws: string,
  rootPem: string = TEST_ROOT_PEM ?? APPLE_ROOT_CA_G3_PEM,
  now: Date = new Date()
): T {
  const parts = jws.split('.')
  if (parts.length !== 3) throw new AppleVerificationError('Malformed JWS')
  const [h, p, s] = parts

  let header: { alg?: string; x5c?: string[] }
  let payload: Record<string, unknown>
  try {
    header = JSON.parse(b64urlDecode(h).toString('utf8'))
    payload = JSON.parse(b64urlDecode(p).toString('utf8'))
  } catch {
    throw new AppleVerificationError('Malformed JWS JSON')
  }

  if (header.alg !== 'ES256') throw new AppleVerificationError('Unexpected alg')
  const x5c = header.x5c
  if (!Array.isArray(x5c) || x5c.length !== 3) throw new AppleVerificationError('Bad certificate chain')

  const [leaf, intermediate, root] = x5c.map(c => new X509Certificate(Buffer.from(c, 'base64')))
  const pinnedRoot = new X509Certificate(rootPem)

  // The chain's root must be exactly Apple's root.
  if (root.fingerprint256 !== pinnedRoot.fingerprint256) throw new AppleVerificationError('Untrusted root')
  if (!leaf.raw.includes(OID_LEAF)) throw new AppleVerificationError('Leaf is not an Apple receipt cert')
  if (!intermediate.raw.includes(OID_INTERMEDIATE)) throw new AppleVerificationError('Intermediate is not Apple WWDR')

  // Chain signatures
  if (!leaf.verify(intermediate.publicKey)) throw new AppleVerificationError('Leaf not signed by intermediate')
  if (!intermediate.verify(pinnedRoot.publicKey)) throw new AppleVerificationError('Intermediate not signed by root')

  // Validity window: judge at the time Apple signed the payload (leaf certs are
  // short-lived), falling back to "now".
  const signedMs = typeof payload.signedDate === 'number' ? payload.signedDate : now.getTime()
  const at = new Date(signedMs)
  for (const cert of [leaf, intermediate, pinnedRoot]) {
    if (at < new Date(cert.validFrom) || at > new Date(cert.validTo)) {
      throw new AppleVerificationError('Certificate not valid at signing time')
    }
  }

  // JWS signature is raw r||s (IEEE P1363), not DER.
  const ok = cryptoVerify(
    'sha256',
    Buffer.from(`${h}.${p}`),
    { key: leaf.publicKey, dsaEncoding: 'ieee-p1363' },
    b64urlDecode(s)
  )
  if (!ok) throw new AppleVerificationError('Bad signature')

  return payload as T
}

// ─── Transaction / notification shapes (only the fields we use) ──────────────

export type AppleTransaction = {
  transactionId: string
  originalTransactionId: string
  bundleId: string
  productId: string
  purchaseDate?: number
  expiresDate?: number
  appAccountToken?: string
  environment?: 'Production' | 'Sandbox' | 'Xcode' | string
  revocationDate?: number
  type?: string
  signedDate?: number
}

export type AppleRenewalInfo = {
  autoRenewStatus?: number // 1 = will renew, 0 = turned off
  autoRenewProductId?: string
  expirationIntent?: number
  originalTransactionId?: string
}

export type AppleNotification = {
  notificationType: string
  subtype?: string
  data?: {
    bundleId?: string
    environment?: string
    signedTransactionInfo?: string
    signedRenewalInfo?: string
  }
}

// ─── Product catalog (App Store Connect product IDs ↔ our plans) ─────────────
// Subscription group: "SwipePhotos Plans". Keep these IDs in sync with
// ios/SwipePhotos/Resources/Products.storekit and App Store Connect.

export type PlanId = 'starter' | 'popular' | 'elite'

export const APPLE_PRODUCTS: Record<string, { planId: PlanId; interval: 'month' | 'year' }> = {
  'net.swipephotos.app.starter.monthly': { planId: 'starter', interval: 'month' },
  'net.swipephotos.app.starter.yearly':  { planId: 'starter', interval: 'year' },
  'net.swipephotos.app.premium.monthly': { planId: 'popular', interval: 'month' },
  'net.swipephotos.app.premium.yearly':  { planId: 'popular', interval: 'year' },
  'net.swipephotos.app.pro.monthly':     { planId: 'elite',   interval: 'month' },
  'net.swipephotos.app.pro.yearly':      { planId: 'elite',   interval: 'year' },
}

/** Verifies a signed transaction and checks it belongs to THIS app + a known product. */
export function verifyTransaction(signed: string, rootPem?: string): AppleTransaction {
  const tx = verifyAppleJWS<AppleTransaction>(signed, rootPem)
  if (tx.bundleId !== APPLE_BUNDLE_ID) throw new AppleVerificationError('Wrong bundle id')
  if (!APPLE_PRODUCTS[tx.productId]) throw new AppleVerificationError('Unknown product')
  if (!tx.transactionId || !tx.originalTransactionId) throw new AppleVerificationError('Missing transaction ids')
  return tx
}
