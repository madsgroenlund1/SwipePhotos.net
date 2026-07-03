import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 60
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/server'
import { sendWelcomeEmail } from '@/lib/resend'
import { submitFaceSwaps, pickBestFacePhoto } from '@/lib/faceswap'
import { fal } from '@fal-ai/client'

fal.config({ credentials: process.env.FAL_KEY })

// Called from the processing page as a fallback if Stripe webhook never fired.
// Verifies payment and starts the face-swap pipeline.
export async function POST(req: NextRequest) {
  try {
    const { sessionId, orderId } = await req.json()
    if (!sessionId || !orderId) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

    const session = await stripe.checkout.sessions.retrieve(sessionId)
    if (session.payment_status !== 'paid' && session.status !== 'complete') {
      return NextResponse.json({ error: 'Not paid yet' }, { status: 402 })
    }

    const supabase = await createAdminClient()
    const { data: order } = await supabase.from('orders').select('status, email').eq('id', orderId).single()
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

    // Already handled by webhook — skip
    if (!['pending', 'processing'].includes(order.status)) {
      return NextResponse.json({ ok: true, status: order.status })
    }

    const email = order.email || (session.customer_details?.email ?? '')

    await supabase.from('orders').update({
      status: 'processing',
      stripe_session_id: sessionId,
      ...(email && !order.email ? { email } : {}),
    }).eq('id', orderId)

    if (email) await sendWelcomeEmail(email, orderId).catch(console.error)

    const { data: uploads } = await supabase.from('uploads').select('file_url').eq('order_id', orderId)
    if (!uploads?.length) {
      console.error('[verify] No uploads for order', orderId)
      await supabase.from('orders').update({ status: 'failed' }).eq('id', orderId)
      return NextResponse.json({ ok: true, warning: 'no_uploads' })
    }

    const imageUrls = uploads.map((u: { file_url: string }) => u.file_url)
    const faceUrl = pickBestFacePhoto(imageUrls)

    try {
      const falFaceUrl = await fal.storage.upload(
        await fetch(faceUrl).then(r => r.blob()).then(b => new File([b], 'face.jpg', { type: 'image/jpeg' }))
      )
      const requestIds = await submitFaceSwaps(falFaceUrl)
      if (!requestIds.length) throw new Error('No jobs submitted')

      await supabase.from('orders').update({
        status: 'generating',
        replicate_training_id: JSON.stringify(requestIds),
      }).eq('id', orderId)

      console.log('[verify] Face-swap pipeline started, jobs:', requestIds.length)
      return NextResponse.json({ ok: true, jobs: requestIds.length })
    } catch (err) {
      console.error('[verify] Failed to start face-swaps:', err)
      await supabase.from('orders').update({ status: 'failed' }).eq('id', orderId)
      return NextResponse.json({ error: String(err) }, { status: 500 })
    }
  } catch (err) {
    console.error('[verify] Error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
