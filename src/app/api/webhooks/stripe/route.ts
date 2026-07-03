import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/server'
import { sendWelcomeEmail } from '@/lib/resend'
import { submitFaceSwaps, pickBestFacePhoto } from '@/lib/faceswap'
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

    const supabase = await createAdminClient()

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

    try {
      // Upload face to fal.ai storage once, reuse across all jobs
      const falFaceUrl = await fal.storage.upload(await fetch(faceUrl).then(r => r.blob())
        .then(b => new File([b], 'face.jpg', { type: 'image/jpeg' })))

      // Submit all jobs to fal.ai queue — returns immediately, no timeout risk
      const requestIds = await submitFaceSwaps(falFaceUrl)

      if (!requestIds.length) throw new Error('No jobs submitted')

      // Store job IDs so the poll endpoint can check them
      await supabase
        .from('orders')
        .update({ status: 'generating', replicate_training_id: JSON.stringify(requestIds) })
        .eq('id', orderId)

      console.log(`[stripe webhook] ${requestIds.length} face-swap jobs queued for order ${orderId}`)
    } catch (err) {
      console.error('[stripe webhook] Failed to start face-swaps:', err)
      await supabase.from('orders').update({ status: 'failed' }).eq('id', orderId)
    }
  }

  return NextResponse.json({ ok: true })
}
