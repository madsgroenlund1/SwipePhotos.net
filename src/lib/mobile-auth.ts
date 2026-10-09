import { createHash, createHmac, createPublicKey, randomInt, timingSafeEqual, verify } from 'node:crypto'
import type { JsonWebKey } from 'node:crypto'
import { clerkClient } from '@clerk/nextjs/server'
import { createAdminClientDirect } from '@/lib/supabase/server'
import { sendLoginCodeEmail } from '@/lib/resend'
import { APPLE_BUNDLE_ID } from '@/lib/apple-iap'

// ─── Mobile sign-in ──────────────────────────────────────────────────────────
//
// The iOS app signs in WITHOUT passwords:
//   • e-mail one-time code (also creates the account on first use), or
//   • Sign in with Apple.
// Both resolve to a Clerk user (found/created by verified e-mail — the same
// identity the website uses, so web customers see their photos in the app).
// The app then holds a signed session token, sent as `X-SwipePhotos-Token`,
// which getDbUser() understands. Apple/e-mail ownership is proven before any
// token is minted.

const TOKEN_TTL_S = 60 * 60 * 24 * 90 // 90 days
const CODE_TTL_MS = 10 * 60 * 1000
const MAX_CODE_ATTEMPTS = 5
const MAX_CODES_PER_10_MIN = 5

function secret(): Buffer {
  const k = process.env.CLERK_SECRET_KEY
  if (!k) throw new Error('CLERK_SECRET_KEY is not set')
  return createHash('sha256').update(`swipephotos-mobile-v1|${k}`).digest()
}

const b64u = (b: Buffer | string) =>
  Buffer.from(b).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const b64uDecode = (s: string) => Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64')

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  return ab.length === bb.length && timingSafeEqual(ab, bb)
}

// ─── Session token (HS256 JWT) ───────────────────────────────────────────────

export type MobileClaims = { sub: string; email: string; exp: number }

export function signMobileToken(claims: { sub: string; email: string }): string {
  const header = b64u(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = b64u(JSON.stringify({ ...claims, exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_S }))
  const sig = b64u(createHmac('sha256', secret()).update(`${header}.${body}`).digest())
  return `${header}.${body}.${sig}`
}

export function verifyMobileToken(token: string): MobileClaims | null {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [h, b, s] = parts
  try {
    const expected = b64u(createHmac('sha256', secret()).update(`${h}.${b}`).digest())
    if (!safeEqual(s, expected)) return null
    const header = JSON.parse(b64uDecode(h).toString('utf8'))
    if (header.alg !== 'HS256') return null
    const claims = JSON.parse(b64uDecode(b).toString('utf8')) as MobileClaims
    if (!claims.sub || !claims.email || claims.exp < Math.floor(Date.now() / 1000)) return null
    return claims
  } catch {
    return null
  }
}

// ─── E-mail helpers ──────────────────────────────────────────────────────────

export function normalizeEmail(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const email = raw.trim().toLowerCase()
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) && email.length <= 254 ? email : null
}

function codeHash(email: string, code: string): string {
  return createHmac('sha256', secret()).update(`${email}|${code}`).digest('hex')
}

// App Review needs to sign in without access to an inbox. When BOTH env vars
// are set, this one demo account accepts a fixed code (no e-mail is sent).
function isReviewAccount(email: string): boolean {
  const e = process.env.APPLE_REVIEW_EMAIL?.trim().toLowerCase()
  return !!e && !!process.env.APPLE_REVIEW_CODE && email === e
}

export type CodeResult = { ok: true } | { ok: false; status: number; error: string }

export async function startEmailCode(email: string): Promise<CodeResult> {
  if (isReviewAccount(email)) return { ok: true }

  const admin = createAdminClientDirect()
  const since = new Date(Date.now() - 10 * 60 * 1000).toISOString()
  const { count } = await admin
    .from('mobile_login_codes')
    .select('id', { count: 'exact', head: true })
    .eq('email', email)
    .gt('created_at', since)
  if ((count ?? 0) >= MAX_CODES_PER_10_MIN) {
    return { ok: false, status: 429, error: 'Too many codes requested. Try again in a few minutes.' }
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, '0')
  const { error } = await admin.from('mobile_login_codes').insert({
    email,
    code_hash: codeHash(email, code),
    expires_at: new Date(Date.now() + CODE_TTL_MS).toISOString(),
  })
  if (error) {
    console.error('[mobile-auth] could not store login code:', error.message)
    return { ok: false, status: 500, error: 'Could not send code. Please try again.' }
  }

  try {
    await sendLoginCodeEmail(email, code)
  } catch (e) {
    console.error('[mobile-auth] could not send login code e-mail:', e)
    return { ok: false, status: 500, error: 'Could not send the e-mail. Please try again.' }
  }
  return { ok: true }
}

export async function verifyEmailCode(email: string, rawCode: unknown): Promise<CodeResult> {
  const code = typeof rawCode === 'string' ? rawCode.trim() : ''
  if (!/^\d{6}$/.test(code)) return { ok: false, status: 400, error: 'Enter the 6-digit code.' }

  if (isReviewAccount(email)) {
    return safeEqual(code, process.env.APPLE_REVIEW_CODE!.trim())
      ? { ok: true }
      : { ok: false, status: 401, error: 'Incorrect code.' }
  }

  const admin = createAdminClientDirect()
  const { data: rows } = await admin
    .from('mobile_login_codes')
    .select('id, code_hash, attempts')
    .eq('email', email)
    .eq('consumed', false)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
  const row = rows?.[0]
  if (!row) return { ok: false, status: 401, error: 'That code has expired. Request a new one.' }

  if (row.attempts >= MAX_CODE_ATTEMPTS) {
    await admin.from('mobile_login_codes').update({ consumed: true }).eq('id', row.id)
    return { ok: false, status: 429, error: 'Too many attempts. Request a new code.' }
  }
  // Count the attempt BEFORE comparing so parallel guesses can't dodge the limit.
  await admin.from('mobile_login_codes').update({ attempts: row.attempts + 1 }).eq('id', row.id)

  if (!safeEqual(codeHash(email, code), row.code_hash)) {
    return { ok: false, status: 401, error: 'Incorrect code.' }
  }
  await admin.from('mobile_login_codes').update({ consumed: true }).eq('id', row.id)
  return { ok: true }
}

// ─── Clerk identity ──────────────────────────────────────────────────────────

/** Finds the Clerk user for a VERIFIED e-mail, creating one on first sign-in. */
export async function findOrCreateClerkUser(email: string): Promise<{ clerkId: string; email: string }> {
  const clerk = await clerkClient()
  const existing = await clerk.users.getUserList({ emailAddress: [email], limit: 1 })
  if (existing.data[0]) return { clerkId: existing.data[0].id, email }
  const created = await clerk.users.createUser({ emailAddress: [email], skipPasswordRequirement: true })
  return { clerkId: created.id, email }
}

// ─── Sign in with Apple ──────────────────────────────────────────────────────

type AppleJwk = JsonWebKey & { kid: string }
let jwksCache: { keys: AppleJwk[]; at: number } | null = null

async function appleKeys(): Promise<AppleJwk[]> {
  if (jwksCache && Date.now() - jwksCache.at < 60 * 60 * 1000) return jwksCache.keys
  const res = await fetch('https://appleid.apple.com/auth/keys')
  if (!res.ok) throw new Error(`Apple JWKS HTTP ${res.status}`)
  const { keys } = (await res.json()) as { keys: AppleJwk[] }
  jwksCache = { keys, at: Date.now() }
  return keys
}

export type AppleIdentity = { sub: string; email: string }

/** Verifies the identity token from ASAuthorizationAppleIDCredential. `keys` is injectable for tests. */
export async function verifyAppleIdentityToken(token: string, keys?: AppleJwk[]): Promise<AppleIdentity> {
  const parts = token.split('.')
  if (parts.length !== 3) throw new Error('Malformed identity token')
  const [h, p, s] = parts
  const header = JSON.parse(b64uDecode(h).toString('utf8')) as { kid?: string; alg?: string }
  if (header.alg !== 'RS256' || !header.kid) throw new Error('Unexpected identity token header')

  const jwk = (keys ?? (await appleKeys())).find(k => k.kid === header.kid)
  if (!jwk) throw new Error('Unknown signing key')
  const ok = verify('RSA-SHA256', Buffer.from(`${h}.${p}`), createPublicKey({ key: jwk, format: 'jwk' }), b64uDecode(s))
  if (!ok) throw new Error('Bad identity token signature')

  const claims = JSON.parse(b64uDecode(p).toString('utf8')) as {
    iss?: string; aud?: string; exp?: number; sub?: string; email?: string; email_verified?: boolean | string
  }
  if (claims.iss !== 'https://appleid.apple.com') throw new Error('Wrong issuer')
  if (claims.aud !== APPLE_BUNDLE_ID) throw new Error('Wrong audience')
  if (!claims.exp || claims.exp < Math.floor(Date.now() / 1000)) throw new Error('Identity token expired')
  if (!claims.sub) throw new Error('Missing subject')
  const email = normalizeEmail(claims.email)
  if (!email) throw new Error('Apple did not provide an e-mail address')
  if (claims.email_verified === false || claims.email_verified === 'false') throw new Error('E-mail not verified')
  return { sub: claims.sub, email }
}
