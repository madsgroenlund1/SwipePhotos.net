import { createSign } from 'node:crypto'
import { APPLE_PRODUCTS, type PlanId } from '@/lib/apple-iap'

// ─── Google Play Billing server-side verification ───────────────────────────
//
// The Android app sends the purchase token it got from Play Billing. We ask the
// Play Developer API (with a service account) what that token really is, so a
// made-up token can never unlock photos. Product ids are the same as on iOS.

export const PLAY_PACKAGE = process.env.GOOGLE_PLAY_PACKAGE_NAME || 'net.swipephotos.app'

export class PlayVerificationError extends Error {}

export const PLAY_PRODUCTS: Record<string, { planId: PlanId; interval: 'month' | 'year' }> = APPLE_PRODUCTS

export type PlaySubscription = {
  productId: string
  purchaseToken: string
  planId: PlanId
  interval: 'month' | 'year'
  expiresAt: number
  autoRenew: boolean
  accountId: string | null // obfuscatedExternalAccountId (we set it to the order id)
  acknowledged: boolean
  active: boolean
}

type ServiceAccount = { client_email: string; private_key: string; token_uri?: string }

function serviceAccount(): ServiceAccount {
  const raw = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON
  if (!raw) throw new PlayVerificationError('Google Play is not configured')
  try {
    const json = JSON.parse(raw.trim().startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8'))
    if (!json.client_email || !json.private_key) throw new Error('missing fields')
    return json
  } catch {
    throw new PlayVerificationError('Google Play service account is invalid')
  }
}

const b64u = (b: Buffer | string) => Buffer.from(b).toString('base64url')

let cached: { token: string; exp: number } | null = null

async function accessToken(): Promise<string> {
  if (cached && cached.exp > Date.now() + 60_000) return cached.token
  const sa = serviceAccount()
  const now = Math.floor(Date.now() / 1000)
  const head = b64u(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const claims = b64u(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/androidpublisher',
    aud: sa.token_uri || 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3000,
  }))
  const sig = createSign('RSA-SHA256').update(`${head}.${claims}`).sign(sa.private_key).toString('base64url')
  const res = await fetch(sa.token_uri || 'https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${head}.${claims}.${sig}`,
    }),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok || !json.access_token) throw new PlayVerificationError('Could not authenticate with Google Play')
  cached = { token: json.access_token, exp: Date.now() + (json.expires_in ?? 3000) * 1000 }
  return cached.token
}

const API = 'https://androidpublisher.googleapis.com/androidpublisher/v3/applications'

/** Looks a purchase token up at Google. `claimedProductId` must match the token. */
export async function verifyPlayPurchase(purchaseToken: string, claimedProductId?: string): Promise<PlaySubscription> {
  if (!purchaseToken || purchaseToken.length > 2000) throw new PlayVerificationError('Bad purchase token')
  const token = await accessToken()
  const res = await fetch(`${API}/${PLAY_PACKAGE}/purchases/subscriptionsv2/tokens/${encodeURIComponent(purchaseToken)}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new PlayVerificationError(`Google rejected the purchase token (${res.status})`)
  const data = await res.json()

  const item = (data.lineItems ?? [])[0]
  const productId: string | undefined = item?.productId
  if (!productId || !PLAY_PRODUCTS[productId]) throw new PlayVerificationError('Unknown product')
  if (claimedProductId && claimedProductId !== productId) throw new PlayVerificationError('Product mismatch')
  const expiresAt = item.expiryTime ? Date.parse(item.expiryTime) : 0
  const state: string = data.subscriptionState ?? ''
  const active = ['SUBSCRIPTION_STATE_ACTIVE', 'SUBSCRIPTION_STATE_IN_GRACE_PERIOD', 'SUBSCRIPTION_STATE_CANCELED'].includes(state)
    && expiresAt > Date.now()

  return {
    productId,
    purchaseToken,
    ...PLAY_PRODUCTS[productId],
    expiresAt,
    autoRenew: !!item.autoRenewingPlan?.autoRenewEnabled,
    accountId: data.externalAccountIdentifiers?.obfuscatedExternalAccountId ?? null,
    acknowledged: data.acknowledgementState === 'ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED',
    active,
  }
}

/** Google refunds un-acknowledged purchases after 3 days; the app also acknowledges, this is a backstop. */
export async function acknowledgePlayPurchase(productId: string, purchaseToken: string) {
  try {
    const token = await accessToken()
    await fetch(`${API}/${PLAY_PACKAGE}/purchases/subscriptions/${productId}/tokens/${encodeURIComponent(purchaseToken)}:acknowledge`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: '{}',
    })
  } catch (e) {
    console.warn('[google-play] acknowledge failed:', e)
  }
}
