// Offline test for the pure parts of src/lib/mobile-auth.ts (session tokens,
// Sign in with Apple identity-token verification). No network, no database.
//
//   npx tsx scripts/test-mobile-auth.mts
process.env.CLERK_SECRET_KEY = 'sk_test_unit_test_secret'

import { createHmac, generateKeyPairSync, sign as cryptoSign } from 'node:crypto'
import {
  normalizeEmail,
  signMobileToken,
  verifyAppleIdentityToken,
  verifyMobileToken,
} from '../src/lib/mobile-auth'
import { APPLE_BUNDLE_ID } from '../src/lib/apple-iap'

let passed = 0
let failed = 0
const check = (name: string, ok: boolean) => { ok ? passed++ : failed++; console.log(`  ${ok ? '✓' : '✗'} ${name}`) }
const b64u = (b: Buffer | string) => Buffer.from(b).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

async function rejects(name: string, fn: () => Promise<unknown>) {
  try { await fn(); check(name, false) } catch (e) { check(`${name} (${(e as Error).message})`, true) }
}

console.log('Session token')
const token = signMobileToken({ sub: 'user_123', email: 'a@b.co' })
const claims = verifyMobileToken(token)
check('round-trips', claims?.sub === 'user_123' && claims.email === 'a@b.co')
check('expires ~90 days out', !!claims && claims.exp - Date.now() / 1000 > 89 * 86400)
const [h, p, s] = token.split('.')
check('tampered payload rejected', verifyMobileToken(`${h}.${b64u(JSON.stringify({ sub: 'user_999', email: 'a@b.co', exp: 9999999999 }))}.${s}`) === null)
check('tampered signature rejected', verifyMobileToken(`${h}.${p}.${s.slice(0, -2)}AA`) === null)
check('garbage rejected', verifyMobileToken('nope') === null && verifyMobileToken('') === null)
const expiredBody = b64u(JSON.stringify({ sub: 'u', email: 'a@b.co', exp: 1 }))
check('expired token rejected', verifyMobileToken(`${h}.${expiredBody}.${b64u(createHmac('sha256', 'wrong').update(`${h}.${expiredBody}`).digest())}`) === null)
const noneHeader = b64u(JSON.stringify({ alg: 'none', typ: 'JWT' }))
check('alg=none rejected', verifyMobileToken(`${noneHeader}.${p}.`) === null)

console.log('E-mail normalisation')
check('lowercases + trims', normalizeEmail('  Mads@Example.COM ') === 'mads@example.com')
check('rejects junk', normalizeEmail('nope') === null && normalizeEmail('a@b') === null && normalizeEmail(42) === null)

console.log('Sign in with Apple identity token')
const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
const jwk = { ...publicKey.export({ format: 'jwk' }), kid: 'TESTKID', alg: 'RS256', use: 'sig' } as never
const wrongKey = generateKeyPairSync('rsa', { modulusLength: 2048 }).privateKey

function idToken(over: Record<string, unknown> = {}, key = privateKey, headerOver: Record<string, unknown> = {}) {
  const header = b64u(JSON.stringify({ alg: 'RS256', kid: 'TESTKID', ...headerOver }))
  const body = b64u(JSON.stringify({
    iss: 'https://appleid.apple.com', aud: APPLE_BUNDLE_ID, sub: '001234.abc',
    exp: Math.floor(Date.now() / 1000) + 600, email: 'Hidden@privaterelay.appleid.com', email_verified: 'true', ...over,
  }))
  return `${header}.${body}.${b64u(cryptoSign('RSA-SHA256', Buffer.from(`${header}.${body}`), key))}`
}

const ok = await verifyAppleIdentityToken(idToken(), [jwk])
check('valid token accepted', ok.sub === '001234.abc' && ok.email === 'hidden@privaterelay.appleid.com')
await rejects('wrong audience rejected', () => verifyAppleIdentityToken(idToken({ aud: 'com.other.app' }), [jwk]))
await rejects('wrong issuer rejected', () => verifyAppleIdentityToken(idToken({ iss: 'https://evil.example' }), [jwk]))
await rejects('expired rejected', () => verifyAppleIdentityToken(idToken({ exp: 1 }), [jwk]))
await rejects('bad signature rejected', () => verifyAppleIdentityToken(idToken({}, wrongKey), [jwk]))
await rejects('unknown kid rejected', () => verifyAppleIdentityToken(idToken({}, privateKey, { kid: 'OTHER' }), [jwk]))
await rejects('missing email rejected', () => verifyAppleIdentityToken(idToken({ email: undefined }), [jwk]))
await rejects('unverified email rejected', () => verifyAppleIdentityToken(idToken({ email_verified: 'false' }), [jwk]))
await rejects('alg confusion (HS256) rejected', () => verifyAppleIdentityToken(idToken({}, privateKey, { alg: 'HS256' }), [jwk]))

console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed ? 1 : 0)
