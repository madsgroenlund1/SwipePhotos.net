import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClientDirect } from '@/lib/supabase/server'
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
      supabase.from('orders').select('selected_presets').eq('id', orderId).single(),
    ])

    if (!uploads?.length) {
      // Uploads may still be in-flight from the browser (race condition).
      // Leave status as 'processing' — the /api/checkout/verify fallback
      // called from the processing page will retry once uploads land.
      console.warn('[stripe webhook] No uploads yet for order', orderId, '— leaving as processing for verify fallback')
      return NextResponse.json({ ok: true })
    }

    const imageUrls = uploads.map((u: { file_url: string }) => u.file_url)
    const faceUrl = pickBestFacePhoto(imageUrls)
    const preferredScene = (orderRow?.selected_presets as string[] | null)?.[0]

    try {
      // Upload face to fal.ai storage once, reuse across all jobs
      const falFaceUrl = await fal.storage.upload(await fetch(faceUrl).then(r => r.blob())
        .then(b => new File([b], 'face.jpg', { type: 'image/jpeg' })))

      // Submit jobs — preferred scene first so preview photos match customer's style
      const requestIds = await submitFaceSwaps(falFaceUrl, preferredScene)

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
