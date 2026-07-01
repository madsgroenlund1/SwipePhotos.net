import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/server'
import { sendWelcomeEmail, sendReadyEmail } from '@/lib/resend'
import { trainModel, generatePhoto } from '@/lib/replicate'
import Stripe from 'stripe'

export const runtime = 'nodejs'

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
    const { orderId, email, presets } = session.metadata || {}

    if (!orderId) return NextResponse.json({ ok: true })

    const supabase = await createAdminClient()

    // Update order status
    await supabase
      .from('orders')
      .update({ status: 'processing', stripe_session_id: session.id })
      .eq('id', orderId)

    // Send welcome email
    if (email) {
      await sendWelcomeEmail(email, orderId).catch(console.error)
    }

    // Start Replicate pipeline in background
    startPipeline(orderId, email, JSON.parse(presets || '[]')).catch(console.error)
  }

  return NextResponse.json({ ok: true })
}

async function startPipeline(orderId: string, email: string, presets: string[]) {
  const supabase = await createAdminClient()

  // Fetch uploaded photos
  const { data: uploads } = await supabase
    .from('uploads')
    .select('file_url')
    .eq('order_id', orderId)

  if (!uploads?.length) {
    console.error('No uploads found for order', orderId)
    return
  }

  const imageUrls = uploads.map(u => u.file_url)

  // Update status to training
  await supabase.from('orders').update({ status: 'training' }).eq('id', orderId)

  try {
    const training = await trainModel(imageUrls, orderId)

    await supabase
      .from('orders')
      .update({ replicate_training_id: training.id })
      .eq('id', orderId)

    // Poll training status
    let trainingDone = false
    let loraUrl = ''
    for (let i = 0; i < 60; i++) {
      await new Promise(r => setTimeout(r, 60000))
      const t = await fetch(`https://api.replicate.com/v1/trainings/${training.id}`, {
        headers: { Authorization: `Token ${process.env.REPLICATE_API_TOKEN}` },
      }).then(r => r.json())

      if (t.status === 'succeeded') {
        loraUrl = t.output?.weights || ''
        trainingDone = true
        break
      } else if (t.status === 'failed') {
        await supabase.from('orders').update({ status: 'failed' }).eq('id', orderId)
        return
      }
    }

    if (!trainingDone) {
      await supabase.from('orders').update({ status: 'failed' }).eq('id', orderId)
      return
    }

    // Update status to generating
    await supabase.from('orders').update({ status: 'generating' }).eq('id', orderId)

    // Generate photos for each preset
    const defaultPresets = presets.length ? presets : ['outdoor-adventure', 'city-life']
    for (const preset of defaultPresets) {
      const photoUrls = await generatePhoto(loraUrl, preset)
      for (const url of photoUrls) {
        await supabase.from('generated_photos').insert({
          order_id: orderId,
          file_url: url,
          preset,
        })
      }
    }

    // Mark as ready
    await supabase.from('orders').update({ status: 'ready' }).eq('id', orderId)

    // Send ready email
    if (email) {
      await sendReadyEmail(email, orderId).catch(console.error)
    }
  } catch (err) {
    console.error('Pipeline error:', err)
    await supabase.from('orders').update({ status: 'failed' }).eq('id', orderId)
  }
}
