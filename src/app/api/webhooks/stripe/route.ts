import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClientDirect } from '@/lib/supabase/server'
import { sendWelcomeEmail } from '@/lib/resend'
import { submitFaceSwapJobs } from '@/lib/faceswap'
import { fal } from '@fal-ai/client'
import Stripe from 'stripe'

fal.config({ credentials: process.env.FAL_KEY })

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('Webhook signature failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const { orderId } = session.metadata || {}
    const email = session.metadata?.email || session.customer_details?.email || ''

    if (!orderId) return NextResponse.json({ ok: true })

    const supabase = createAdminClientDirect()

    // Idempotency
    const { data: existing } = await supabase.from('orders').select('status').eq('id', orderId).single()
    if (existing && !['pending', 'processing'].includes(existing.status)) {
      console.log('[stripe webhook] Already handled, status:', existing.status)
      return NextResponse.json({ ok: true })
    }

    const stripeCustomerId = typeof session.customer === 'string' ? session.customer : null
    if (stripeCustomerId && email) {
      await supabase.from('users').update({ stripe_customer_id: stripeCustomerId }).eq('email', email)
    }

    await supabase
      .from('orders')
      .update({ status: 'processing', stripe_session_id: session.id, ...(email ? { email } : {}) })
      .eq('id', orderId)

    if (email) await sendWelcomeEmail(email, orderId).catch(console.error)

    const [{ data: uploads }, { data: orderRow }] = await Promise.all([
      supabase.from('uploads').select('file_url').eq('order_id', orderId),
      supabase.from('orders').select('selected_presets, referred_by_code, user_id').eq('id', orderId).single(),
    ])

    if (!uploads?.length) {
      // Uploads may still be in-flight from the browser (race condition).
      // Leave status as 'processing' — the /api/checkout/verify fallback
      // called from the processing page will retry once uploads land.
      console.warn('[stripe webhook] No uploads yet for order', orderId, '— leaving as processing for verify fallback')
      return NextResponse.json({ ok: true })
    }

    const imageUrls = uploads.map((u: { file_url: string }) => u.file_url)
    const selectedPresets = (orderRow?.selected_presets as string[] | null) ?? []
    const preferredScene = selectedPresets.find(p => p !== 'has_tattoos')
    const hasTattoos = selectedPresets.includes('has_tattoos')

    try {
      // Upload all customer photos to fal.ai storage so we can rotate through them per template
      const falPhotoUrls: string[] = []
      for (const url of imageUrls) {
        try {
          const falUrl = await fal.storage.upload(
            await fetch(url).then(r => r.blob()).then(b => new File([b], 'face.jpg', { type: 'image/jpeg' }))
          )
          falPhotoUrls.push(falUrl)
        } catch (e) {
          console.warn('[stripe webhook] Failed to upload photo to fal.ai:', url, e)
        }
      }
      if (!falPhotoUrls.length) throw new Error('Could not upload any customer photos to fal.ai')

      const entries = await submitFaceSwapJobs(falPhotoUrls, preferredScene, hasTattoos)

      if (!entries.length) throw new Error('No jobs submitted')

      // Store {requestId, templateId}[] so the poll endpoint can trace each result back to its template
      await supabase
        .from('orders')
        .update({ status: 'generating', replicate_training_id: JSON.stringify(entries) })
        .eq('id', orderId)

      console.log(`[stripe webhook] ${entries.length} face-swap jobs queued for order ${orderId}`)

      // Create affiliate commission ONLY after jobs are queued successfully.
      // This prevents orphaned commissions for orders that never actually generated.
      const refCode = orderRow?.referred_by_code
      if (refCode) {
        await createCommission(supabase, refCode, orderId, orderRow?.user_id, session).catch(e =>
          console.error('[stripe webhook] Commission creation failed (non-fatal):', e)
        )
      }
    } catch (err) {
      console.error('[stripe webhook] Failed to start face-swaps:', err)
      await supabase.from('orders').update({ status: 'failed' }).eq('id', orderId)
    }
  }

  // Sync subscription state changes (cancellations, reactivations)
  if (event.type === 'customer.subscription.updated') {
    const sub = event.data.object as Stripe.Subscription
    const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id
    const supabase = createAdminClientDirect()
    await supabase
      .from('users')
      .update({ stripe_subscription_id: sub.id })
      .eq('stripe_customer_id', customerId)
    console.log(`[stripe webhook] subscription.updated ${sub.id} cancel_at_period_end=${sub.cancel_at_period_end}`)
  }

  // Mark subscription as ended when fully deleted
  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription
    const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id
    const supabase = createAdminClientDirect()
    await supabase
      .from('users')
      .update({ stripe_subscription_id: null })
      .eq('stripe_customer_id', customerId)
    console.log(`[stripe webhook] subscription.deleted ${sub.id}`)
  }

  // Reverse affiliate commission when Stripe issues a refund
  if (event.type === 'charge.refunded') {
    const charge = event.data.object as Stripe.Charge
    const sessionId = typeof charge.payment_intent === 'string'
      ? (await stripe.paymentIntents.retrieve(charge.payment_intent).then(pi => pi.latest_charge).catch(() => null))
      : null

    // Find commission by stripe_session_id (session was stored at checkout time)
    // We need to look up via payment_intent → checkout session
    let stripeSessionId: string | null = null
    try {
      const sessions = await stripe.checkout.sessions.list({ payment_intent: charge.payment_intent as string, limit: 1 })
      stripeSessionId = sessions.data[0]?.id ?? null
    } catch { /* noop */ }

    if (stripeSessionId) {
      const supabase = createAdminClientDirect()
      const { error } = await supabase
        .from('commissions')
        .update({ status: 'reversed', reversed_at: new Date().toISOString() })
        .eq('stripe_session_id', stripeSessionId)
        .in('status', ['pending', 'approved'])

      if (error) {
        console.error('[stripe webhook] Failed to reverse commission for session', stripeSessionId, error)
      } else {
        console.log('[stripe webhook] Commission reversed for session', stripeSessionId)
      }
    }
  }

  return NextResponse.json({ ok: true })
}

// Look up the affiliate for a ref code and create a 30% commission
async function createCommission(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  refCode: string,
  orderId: string,
  orderUserId: string | null,
  session: Stripe.Checkout.Session
) {
  // Find affiliate by users.referral_code first (authenticated affiliates)
  let affiliateId: string | null = null

  const { data: userRef } = await supabase
    .from('users')
    .select('id')
    .ilike('referral_code', refCode)
    .single()

  if (userRef?.id) {
    // Prevent self-referral
    if (userRef.id === orderUserId) {
      console.log('[commission] Self-referral detected, skipping')
      return
    }
    const { data: aff } = await supabase
      .from('affiliates')
      .select('id, status')
      .eq('user_id', userRef.id)
      .single()
    if (aff?.status === 'approved') affiliateId = aff.id
  }

  // Fall back to affiliates.metadata->>'slug' (external influencer affiliates)
  if (!affiliateId) {
    const { data: aff } = await supabase
      .from('affiliates')
      .select('id, status')
      .eq('metadata->>slug', refCode)
      .single()
    if (aff?.status === 'approved') affiliateId = aff.id
  }

  if (!affiliateId) {
    console.log('[commission] No approved affiliate found for ref code:', refCode)
    return
  }

  const amountCents = session.amount_total ?? 0
  const commissionCents = Math.floor(amountCents * 0.30)

  // Upsert prevents duplicate commissions if webhook fires twice
  const { error } = await supabase.from('commissions').upsert(
    {
      affiliate_id: affiliateId,
      order_id: orderId,
      amount_cents: amountCents,
      commission_cents: commissionCents,
      status: 'pending',
      stripe_session_id: session.id,
    },
    { onConflict: 'order_id', ignoreDuplicates: true }
  )

  if (error) {
    console.error('[commission] Insert error:', error)
    return
  }

  // Atomically increment affiliate stats
  await supabase.rpc('increment_affiliate_stats', {
    p_affiliate_id: affiliateId,
    p_conversions: 1,
    p_earnings_cents: commissionCents,
  })

  console.log(`[commission] Created $${(commissionCents / 100).toFixed(2)} commission for affiliate ${affiliateId}`)
}
