// Offline test for src/lib/apple-iap.ts. Builds a fake Apple-style certificate
// chain with openssl, signs JWS payloads with it, and checks that the verifier
// accepts genuine chains and rejects every kind of forgery.
//
//   npx tsx scripts/test-apple-iap.ts
import { execFileSync } from 'node:child_process'
import { createPrivateKey, sign as cryptoSign } from 'node:crypto'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  APPLE_BUNDLE_ID,
  APPLE_ROOT_CA_G3_PEM,
  AppleVerificationError,
  verifyAppleJWS,
  verifyTransaction,
} from '../src/lib/apple-iap'

const dir = mkdtempSync(join(tmpdir(), 'iap-test-'))
const sh = (args: string[]) => execFileSync('openssl', args, { cwd: dir, stdio: 'pipe' })

function makeChain(opts: { leafOid: boolean; intermediateOid: boolean } = { leafOid: true, intermediateOid: true }) {
  const t = Math.random().toString(36).slice(2, 7)
  writeFileSync(join(dir, `ext-${t}.cnf`), [
    '[ req ]', 'distinguished_name=dn', 'prompt=no', '[ dn ]', 'CN=placeholder',
    '[ v3_root ]', 'basicConstraints=critical,CA:true', 'keyUsage=critical,keyCertSign,cRLSign',
    '[ v3_int ]', 'basicConstraints=critical,CA:true', 'keyUsage=critical,keyCertSign,cRLSign',
    ...(opts.intermediateOid ? ['1.2.840.113635.100.6.2.1=ASN1:NULL'] : []),
    '[ v3_leaf ]', 'basicConstraints=critical,CA:false', 'keyUsage=critical,digitalSignature',
    ...(opts.leafOid ? ['1.2.840.113635.100.6.11.1=ASN1:NULL'] : []),
  ].join('\n'))
  const cnf = `ext-${t}.cnf`

  sh(['ecparam', '-name', 'secp384r1', '-genkey', '-noout', '-out', `${t}-root.key`])
  sh(['req', '-new', '-x509', '-key', `${t}-root.key`, '-sha384', '-days', '3000', '-subj', '/CN=Test Root', '-extensions', 'v3_root', '-config', cnf, '-out', `${t}-root.pem`])
  sh(['ecparam', '-name', 'secp384r1', '-genkey', '-noout', '-out', `${t}-int.key`])
  sh(['req', '-new', '-key', `${t}-int.key`, '-subj', '/CN=Test Intermediate', '-out', `${t}-int.csr`])
  sh(['x509', '-req', '-in', `${t}-int.csr`, '-CA', `${t}-root.pem`, '-CAkey', `${t}-root.key`, '-CAcreateserial', '-sha384', '-days', '2000', '-extfile', cnf, '-extensions', 'v3_int', '-out', `${t}-int.pem`])
  sh(['ecparam', '-name', 'prime256v1', '-genkey', '-noout', '-out', `${t}-leaf.key`])
  sh(['req', '-new', '-key', `${t}-leaf.key`, '-subj', '/CN=Test Leaf', '-out', `${t}-leaf.csr`])
  sh(['x509', '-req', '-in', `${t}-leaf.csr`, '-CA', `${t}-int.pem`, '-CAkey', `${t}-int.key`, '-CAcreateserial', '-sha256', '-days', '1000', '-extfile', cnf, '-extensions', 'v3_leaf', '-out', `${t}-leaf.pem`])

  const der = (f: string) => {
    const pem = readFileSync(join(dir, f), 'utf8')
    return pem.replace(/-----[A-Z ]+-----/g, '').replace(/\s/g, '')
  }
  return {
    rootPem: readFileSync(join(dir, `${t}-root.pem`), 'utf8'),
    x5c: [der(`${t}-leaf.pem`), der(`${t}-int.pem`), der(`${t}-root.pem`)],
    leafKey: createPrivateKey(readFileSync(join(dir, `${t}-leaf.key`))),
  }
}

const b64u = (b: Buffer | string) =>
  Buffer.from(b).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

function signJWS(chain: ReturnType<typeof makeChain>, payload: object, headerOverride: object = {}) {
  const h = b64u(JSON.stringify({ alg: 'ES256', x5c: chain.x5c, ...headerOverride }))
  const p = b64u(JSON.stringify({ signedDate: Date.now(), ...payload }))
  const sig = cryptoSign('sha256', Buffer.from(`${h}.${p}`), { key: chain.leafKey, dsaEncoding: 'ieee-p1363' })
  return `${h}.${p}.${b64u(sig)}`
}

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
