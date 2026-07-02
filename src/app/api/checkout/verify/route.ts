import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 60
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/server'
import { sendWelcomeEmail } from '@/lib/resend'
import { trainModel } from '@/lib/replicate'

// Called from the processing page as a webhook fallback.
// If the Stripe webhook never fired, this verifies the session and starts the pipeline.
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
    if (order.status !== 'pending') {
      return NextResponse.json({ ok: true, status: order.status })
    }

    const email = order.email || (session.customer_details?.email ?? '')

    // Update order with Stripe session and email
    await supabase.from('orders').update({
      status: 'processing',
      stripe_session_id: sessionId,
      ...(email && !order.email ? { email } : {}),
    }).eq('id', orderId)

    if (email) await sendWelcomeEmail(email, orderId).catch(console.error)

    // Fetch uploaded photos
    const { data: uploads } = await supabase.from('uploads').select('file_url').eq('order_id', orderId)
    if (!uploads?.length) {
      console.error('[verify] No uploads for order', orderId)
      return NextResponse.json({ ok: true, warning: 'no_uploads' })
    }

    const imageUrls = uploads.map((u: { file_url: string }) => u.file_url)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://swipephotos.net'
    const webhookUrl = `${appUrl}/api/webhooks/replicate?orderId=${orderId}&email=${encodeURIComponent(email)}`

    await supabase.from('orders').update({ status: 'training' }).eq('id', orderId)
    const training = await trainModel(imageUrls, orderId, webhookUrl)
    await supabase.from('orders').update({ replicate_training_id: training.id }).eq('id', orderId)

    console.log('[verify] Pipeline started, training id:', training.id)
    return NextResponse.json({ ok: true, trainingId: training.id })
  } catch (err) {
    console.error('[verify] Error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
