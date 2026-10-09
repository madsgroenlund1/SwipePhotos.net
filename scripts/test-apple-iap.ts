// Offline test for src/lib/apple-iap.ts. Builds a fake Apple-style certificate
// chain with openssl, signs JWS payloads with it, and checks that the verifier
// accepts genuine chains and rejects every kind of forgery.
//
//   npx tsx scripts/test-apple-iap.ts
import {
  APPLE_BUNDLE_ID,
  APPLE_ROOT_CA_G3_PEM,
  AppleVerificationError,
  verifyAppleJWS,
  verifyTransaction,
} from '../src/lib/apple-iap'

import { makeChain, signJWS, b64u } from './lib/fake-apple'

let passed = 0
let failed = 0
function check(name: string, ok: boolean) {
  if (ok) { passed++; console.log(`  ✓ ${name}`) } else { failed++; console.log(`  ✗ ${name}`) }
}
function rejects(name: string, fn: () => unknown) {
  try { fn(); check(name, false) } catch (e) { check(`${name} (${e instanceof AppleVerificationError ? e.message : 'non-Apple error: ' + (e as Error).message})`, e instanceof AppleVerificationError) }
}

const tx = {
  transactionId: '2000000000000001',
  originalTransactionId: '2000000000000001',
  bundleId: APPLE_BUNDLE_ID,
  productId: 'net.swipephotos.app.premium.monthly',
  expiresDate: Date.now() + 86_400_000,
  appAccountToken: '11111111-2222-3333-4444-555555555555',
  environment: 'Sandbox',
}

console.log('Genuine chain')
const good = makeChain()
const jws = signJWS(good, tx)
const out = verifyAppleJWS<typeof tx>(jws, good.rootPem)
check('verifies and returns payload', out.transactionId === tx.transactionId)
check('verifyTransaction accepts known product + bundle', verifyTransaction(jws, good.rootPem).productId === tx.productId)

console.log('Forgeries')
rejects('chain not rooted in the pinned root is rejected', () => verifyAppleJWS(jws)) // real Apple root pinned
const [h, , s] = jws.split('.')
rejects('tampered payload is rejected', () => verifyAppleJWS(`${h}.${b64u(JSON.stringify({ ...tx, productId: 'net.swipephotos.app.pro.yearly' }))}.${s}`, good.rootPem))
rejects('wrong alg is rejected', () => verifyAppleJWS(signJWS(good, tx, { alg: 'HS256' }), good.rootPem))
rejects('2-cert chain is rejected', () => verifyAppleJWS(signJWS(good, tx, { x5c: good.x5c.slice(0, 2) }), good.rootPem))
rejects('garbage is rejected', () => verifyAppleJWS('a.b', good.rootPem))
const noLeafOid = makeChain({ leafOid: false, intermediateOid: true })
rejects('leaf without Apple OID is rejected', () => verifyAppleJWS(signJWS(noLeafOid, tx), noLeafOid.rootPem))
const noIntOid = makeChain({ leafOid: true, intermediateOid: false })
rejects('intermediate without Apple OID is rejected', () => verifyAppleJWS(signJWS(noIntOid, tx), noIntOid.rootPem))
const other = makeChain()
rejects('leaf key from a different chain is rejected', () => verifyAppleJWS(signJWS({ ...good, leafKey: other.leafKey }, tx), good.rootPem))
rejects('wrong bundle id is rejected', () => verifyTransaction(signJWS(good, { ...tx, bundleId: 'com.evil.app' }), good.rootPem))
rejects('unknown product is rejected', () => verifyTransaction(signJWS(good, { ...tx, productId: 'com.evil.free' }), good.rootPem))
rejects('cert not yet valid at signing time is rejected', () => verifyAppleJWS(signJWS(good, { ...tx, signedDate: 1_000_000_000_000 }), good.rootPem))

console.log('Pinned Apple root')
check('embedded Apple Root CA G3 PEM parses', APPLE_ROOT_CA_G3_PEM.includes('BEGIN CERTIFICATE'))

console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed ? 1 : 0)
