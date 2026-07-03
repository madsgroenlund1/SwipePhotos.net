import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/server'
import { sendWelcomeEmail, sendReadyEmail } from '@/lib/resend'
import { runFaceSwaps, pickBestFacePhoto } from '@/lib/faceswap'
import Stripe from 'stripe'

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

    const supabase = await createAdminClient()

    // Idempotency — skip if already past processing
    const { data: existing } = await supabase.from('orders').select('status').eq('id', orderId).single()
    if (existing && !['pending', 'processing'].includes(existing.status)) {
      console.log('[stripe webhook] Order already handled, status:', existing.status)
      return NextResponse.json({ ok: true })
    }

    // Save stripe_customer_id for cancel-subscription to work
    const stripeCustomerId = typeof session.customer === 'string' ? session.customer : null
    if (stripeCustomerId && email) {
      await supabase.from('users').update({ stripe_customer_id: stripeCustomerId }).eq('email', email)
    }

    // Update order status
    await supabase
      .from('orders')
      .update({ status: 'processing', stripe_session_id: session.id, ...(email ? { email } : {}) })
      .eq('id', orderId)

    if (email) await sendWelcomeEmail(email, orderId).catch(console.error)

    // Fetch uploaded photos
    const { data: uploads } = await supabase
      .from('uploads')
      .select('file_url')
      .eq('order_id', orderId)

    if (!uploads?.length) {
      console.error('[stripe webhook] No uploads for order', orderId)
      await supabase.from('orders').update({ status: 'failed' }).eq('id', orderId)
      return NextResponse.json({ ok: true })
    }

    const imageUrls = uploads.map((u: { file_url: string }) => u.file_url)
    const faceUrl = pickBestFacePhoto(imageUrls)

    // Run face-swaps against reference library (~20–40 sec in parallel)
    await supabase.from('orders').update({ status: 'generating' }).eq('id', orderId)

    try {
      const photoUrls = await runFaceSwaps(faceUrl)

      if (!photoUrls.length) {
        throw new Error('Face-swap returned no results')
      }

      for (const url of photoUrls) {
        await supabase.from('generated_photos').insert({ order_id: orderId, file_url: url })
      }

      await supabase.from('orders').update({ status: 'ready' }).eq('id', orderId)

      if (email) await sendReadyEmail(email, orderId).catch(console.error)

      console.log(`[stripe webhook] Done — ${photoUrls.length} photos for order ${orderId}`)
    } catch (err) {
      console.error('[stripe webhook] Face-swap failed:', err)
      await supabase.from('orders').update({ status: 'failed' }).eq('id', orderId)
    }
  }

  return NextResponse.json({ ok: true })
}
