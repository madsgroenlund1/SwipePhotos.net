import { NextRequest, NextResponse } from 'next/server'
import { createAdminClientDirect } from '@/lib/supabase/server'
import {
  APPLE_BUNDLE_ID,
  verifyAppleJWS,
  type AppleNotification,
  type AppleRenewalInfo,
  type AppleTransaction,
} from '@/lib/apple-iap'

// App Store Server Notifications V2. Configure in App Store Connect → App →
// App Information → "App Store Server Notifications" (Production + Sandbox URL):
//   https://www.swipephotos.net/api/webhooks/apple
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  if (typeof body.signedPayload !== 'string') return NextResponse.json({ error: 'Bad request' }, { status: 400 })

  let note: AppleNotification
  try {
    note = verifyAppleJWS<AppleNotification>(body.signedPayload)
  } catch (e) {
    console.warn('[apple webhook] rejected payload:', e instanceof Error ? e.message : e)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }
  if (note.data?.bundleId !== APPLE_BUNDLE_ID) return NextResponse.json({ ok: true, ignored: 'other app' })

  let tx: AppleTransaction | null = null
  let renewal: AppleRenewalInfo | null = null
  try {
    if (note.data?.signedTransactionInfo) tx = verifyAppleJWS<AppleTransaction>(note.data.signedTransactionInfo)
    if (note.data?.signedRenewalInfo) renewal = verifyAppleJWS<AppleRenewalInfo>(note.data.signedRenewalInfo)
  } catch (e) {
    console.warn('[apple webhook] bad nested payload:', e instanceof Error ? e.message : e)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }
  if (!tx) return NextResponse.json({ ok: true })

  const admin = createAdminClientDirect()

  // Find the account: by the order the purchase was made for, else by the stored subscription id.
  let userId: string | null = null
  if (tx.appAccountToken) {
    const { data } = await admin.from('orders').select('user_id').eq('id', tx.appAccountToken.toLowerCase()).maybeSingle()
    userId = data?.user_id ?? null
  }
  if (!userId) {
    const { data } = await admin.from('users').select('id').eq('apple_original_transaction_id', tx.originalTransactionId).maybeSingle()
    userId = data?.id ?? null
  }
  if (!userId) {
    console.log(`[apple webhook] ${note.notificationType}: no matching user (otid ${tx.originalTransactionId})`)
    return NextResponse.json({ ok: true })
  }

  const type = note.notificationType
  const update: Record<string, unknown> = {
    apple_original_transaction_id: tx.originalTransactionId,
    apple_product_id: tx.productId,
    apple_environment: tx.environment ?? null,
  }
  if (type === 'REFUND' || type === 'REVOKE') {
    update.apple_expires_at = new Date().toISOString()
    update.apple_auto_renew = false
  } else if (type === 'EXPIRED' || type === 'GRACE_PERIOD_EXPIRED') {
    update.apple_expires_at = tx.expiresDate ? new Date(tx.expiresDate).toISOString() : new Date().toISOString()
    update.apple_auto_renew = false
  } else {
    if (tx.expiresDate) update.apple_expires_at = new Date(tx.expiresDate).toISOString()
    if (renewal?.autoRenewStatus !== undefined) update.apple_auto_renew = renewal.autoRenewStatus === 1
  }

  await admin.from('users').update(update).eq('id', userId)
  console.log(`[apple webhook] ${type}${note.subtype ? '/' + note.subtype : ''} → user ${userId}`)
  return NextResponse.json({ ok: true })
}
