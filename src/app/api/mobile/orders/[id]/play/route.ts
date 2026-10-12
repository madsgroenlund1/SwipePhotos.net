import { NextRequest, NextResponse } from 'next/server'
import { createAdminClientDirect } from '@/lib/supabase/server'
import { acknowledgePlayPurchase, PlayVerificationError, verifyPlayPurchase } from '@/lib/google-play'
import { recordGoogleSubscription } from '@/lib/google-subscription'
import { startOrderGeneration } from '@/lib/start-generation'
import { fail, loadOwnedOrder, requireUser } from '@/lib/mobile-api'

export const maxDuration = 120

// Redeems a Google Play subscription purchase for an order. Google is asked
// whether the token is real; it must carry this order's id (obfuscated account
// id), match the plan, be active and be unused (unique index).
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser()
  if ('response' in auth) return auth.response
  const { id } = await params

  const order = await loadOwnedOrder(id, auth.user.id)
  if (!order) return fail('Order not found.', 404)

  const body = await req.json().catch(() => ({}))
  if (typeof body.purchaseToken !== 'string' || typeof body.productId !== 'string') return fail('Missing purchase data.')

  if (order.google_purchase_token === body.purchaseToken) {
    return NextResponse.json({ ok: true, status: order.status === 'pending' ? 'processing' : order.status })
  }
  if (order.status !== 'pending') return fail('This order has already been paid.', 409)

  let sub
  try {
    sub = await verifyPlayPurchase(body.purchaseToken, body.productId)
  } catch (e) {
    console.warn('[mobile/play] rejected purchase:', e instanceof Error ? e.message : e)
    return fail(e instanceof PlayVerificationError ? 'We could not verify your purchase.' : 'Invalid purchase.', 400)
  }

  if (sub.accountId?.toLowerCase() !== order.id.toLowerCase()) return fail('This purchase belongs to a different order.', 400)
  if (sub.planId !== order.package_type) return fail('Purchase does not match the selected plan.', 400)
  if (!sub.active) return fail('This subscription is no longer active.', 400)

  const admin = createAdminClientDirect()
  const { error } = await admin
    .from('orders')
    .update({ google_purchase_token: sub.purchaseToken })
    .eq('id', order.id)
    .eq('status', 'pending')
  if (error) {
    return fail(error.code === '23505' ? 'This purchase has already been used.' : 'Could not record your purchase.', error.code === '23505' ? 409 : 500)
  }

  await recordGoogleSubscription(auth.user.id, sub)
  if (!sub.acknowledged) await acknowledgePlayPurchase(sub.productId, sub.purchaseToken)

  const result = await startOrderGeneration(order.id)
  if (!result.ok) return fail('Your purchase went through, but we could not start your photos. Please contact support.', 500)
  return NextResponse.json({ ok: true, status: 'generating' })
}
