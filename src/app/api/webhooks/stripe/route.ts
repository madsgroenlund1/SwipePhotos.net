import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/server'
import { sendWelcomeEmail } from '@/lib/resend'
import { trainModel } from '@/lib/replicate'
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

    // Check if already handled (idempotency — skip only if training has actually started)
    const { data: existing } = await supabase.from('orders').select('status').eq('id', orderId).single()
    if (existing && !['pending', 'processing'].includes(existing.status)) {
      console.log('[stripe webhook] Order already handled, status:', existing.status)
      return NextResponse.json({ ok: true })
    }

    // Save stripe_customer_id to users table (critical for cancel-subscription to work)
    const stripeCustomerId = typeof session.customer === 'string' ? session.customer : null
    if (stripeCustomerId && email) {
      await supabase.from('users').update({ stripe_customer_id: stripeCustomerId }).eq('email', email)
    }

    // Update order status + email
    await supabase
      .from('orders')
      .update({ status: 'processing', stripe_session_id: session.id, ...(email ? { email } : {}) })
      .eq('id', orderId)

    // Send welcome email
    if (email) await sendWelcomeEmail(email, orderId).catch(console.error)

    // Fetch uploaded photos
    const { data: uploads } = await supabase
      .from('uploads')
      .select('file_url')
      .eq('order_id', orderId)

    if (!uploads?.length) {
      console.error('[stripe webhook] No uploads for order', orderId)
      return NextResponse.json({ ok: true })
    }

    const imageUrls = uploads.map((u: { file_url: string }) => u.file_url)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://swipephotos.net'
    const webhookUrl = `${appUrl}/api/webhooks/replicate?orderId=${orderId}&email=${encodeURIComponent(email || '')}`

    // Start training — Replicate calls our webhook when done (no polling needed)
    try {
      await supabase.from('orders').update({ status: 'training' }).eq('id', orderId)
      const training = await trainModel(imageUrls, orderId, webhookUrl)
      await supabase.from('orders').update({ replicate_training_id: training.id }).eq('id', orderId)
    } catch (err) {
      console.error('[stripe webhook] Training start failed:', err)
      await supabase.from('orders').update({ status: 'failed' }).eq('id', orderId)
    }
  }

  return NextResponse.json({ ok: true })
}
