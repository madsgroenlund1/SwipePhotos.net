import { NextRequest, NextResponse } from 'next/server'
import { verifyTransaction, type AppleTransaction } from '@/lib/apple-iap'
import { recordAppleSubscription } from '@/lib/apple-subscription'
import { getEntitlement } from '@/lib/entitlement'
import { fail, requireUser } from '@/lib/mobile-api'

// "Restore purchases" / renewal sync: the app sends its current StoreKit
// transactions; we verify them and store the newest active subscription.
export async function POST(req: NextRequest) {
  const auth = await requireUser()
  if ('response' in auth) return auth.response

  const body = await req.json().catch(() => ({}))
  const signed: unknown[] = Array.isArray(body.signedTransactions) ? body.signedTransactions.slice(0, 20) : []
  if (!signed.length && body.signedTransactions !== undefined) return fail('Invalid data.')

  const valid: AppleTransaction[] = []
  for (const s of signed) {
    if (typeof s !== 'string') continue
    try { valid.push(verifyTransaction(s)) } catch { /* ignore forged/foreign entries */ }
  }

  const active = valid
    .filter(t => !t.revocationDate && t.expiresDate && t.expiresDate > Date.now())
    .sort((a, b) => (b.expiresDate ?? 0) - (a.expiresDate ?? 0))[0]
  if (active) await recordAppleSubscription(auth.user.id, active, body.autoRenew !== false)

  return NextResponse.json({ entitlement: await getEntitlement(auth.user.id), restored: !!active })
}
