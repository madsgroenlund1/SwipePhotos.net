import { NextRequest, NextResponse } from 'next/server'
import { createAdminClientDirect } from '@/lib/supabase/server'
import { APPLE_PRODUCTS, AppleVerificationError, verifyTransaction } from '@/lib/apple-iap'
import { recordAppleSubscription } from '@/lib/apple-subscription'
import { startOrderGeneration } from '@/lib/start-generation'
import { fail, loadOwnedOrder, requireUser } from '@/lib/mobile-api'

export const maxDuration = 120

// Redeems an Apple In-App Purchase for an order. The signed transaction is
// verified against Apple's root certificate, must carry this order's id as its
// appAccountToken, match the plan, be unexpired and be unused (unique index).
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser()
  if ('response' in auth) return auth.response
  const { id } = await params

  const order = await loadOwnedOrder(id, auth.user.id)
  if (!order) return fail('Order not found.', 404)

  const body = await req.json().catch(() => ({}))
  if (typeof body.signedTransaction !== 'string') return fail('Missing purchase data.')

  let tx
  try {
    tx = verifyTransaction(body.signedTransaction)
  } catch (e) {
    console.warn('[mobile/iap] rejected transaction:', e instanceof Error ? e.message : e)
    return fail(e instanceof AppleVerificationError ? 'We could not verify your purchase.' : 'Invalid purchase.', 400)
  }

  // Idempotent retry of an order that this very transaction already paid for.
  if (order.apple_transaction_id === tx.transactionId) {
    return NextResponse.json({ ok: true, status: order.status === 'pending' ? 'processing' : order.status })
  }
  if (order.status !== 'pending') return fail('This order has already been paid.', 409)

  if (tx.appAccountToken?.toLowerCase() !== order.id.toLowerCase()) return fail('This purchase belongs to a different order.', 400)
  if (APPLE_PRODUCTS[tx.productId].planId !== order.package_type) return fail('Purchase does not match the selected plan.', 400)
  if (tx.revocationDate) return fail('This purchase was refunded.', 400)
  if (!tx.expiresDate || tx.expiresDate < Date.now()) return fail('This subscription is no longer active.', 400)

  const admin = createAdminClientDirect()
  const { error } = await admin
    .from('orders')
    .update({ apple_transaction_id: tx.transactionId })
    .eq('id', order.id)
    .eq('status', 'pending')
  if (error) {
    // 23505 = unique violation: this transaction already paid for another order.
    return fail(error.code === '23505' ? 'This purchase has already been used.' : 'Could not record your purchase.', error.code === '23505' ? 409 : 500)
  }

  await recordAppleSubscription(auth.user.id, tx)

  const result = await startOrderGeneration(order.id)
  if (!result.ok) return fail('Your purchase went through, but we could not start your photos. Please contact support.', 500)
  return NextResponse.json({ ok: true, status: 'generating' })
}
