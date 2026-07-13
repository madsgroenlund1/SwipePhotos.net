import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 60
import { stripe, PackageId } from '@/lib/stripe'
import { createAdminClientDirect } from '@/lib/supabase/server'
import { sendWelcomeEmail } from '@/lib/resend'
import { submitFaceSwapJobs } from '@/lib/faceswap'
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

    const supabase = createAdminClientDirect()
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

    // Wait up to 15s for uploads to land (browser uploads happen just before Stripe redirect)
    let uploads: Array<{ file_url: string }> | null = null
    for (let attempt = 0; attempt < 5; attempt++) {
      const { data } = await supabase.from('uploads').select('file_url').eq('order_id', orderId)
      if (data?.length) { uploads = data; break }
      if (attempt < 4) await new Promise(r => setTimeout(r, 3_000))
    }
    const { data: orderFull } = await supabase.from('orders').select('selected_presets, package_type').eq('id', orderId).single()

    if (!uploads?.length) {
      console.warn('[verify] No uploads after retries for order', orderId, '— leaving as processing')
      return NextResponse.json({ ok: true, warning: 'no_uploads' })
    }

    const allUrls = uploads.map((u: { file_url: string }) => u.file_url)
    const tattooSourceUrl = allUrls.find(u => u.includes('tattoo-reference'))
    const imageUrls = allUrls.filter(u => u !== tattooSourceUrl)
    const selectedPresets = (orderFull?.selected_presets as string[] | null) ?? []
    const hasTattoos = selectedPresets.includes('has_tattoos')
    const packageId = (orderFull?.package_type as PackageId) ?? 'popular'

    try {
      async function toFalUrl(url: string) {
        return fal.storage.upload(
          await fetch(url).then(r => r.blob()).then(b => new File([b], 'face.jpg', { type: 'image/jpeg' }))
        )
      }

      const falPhotoUrls: string[] = []
      for (const url of imageUrls) {
        try {
          falPhotoUrls.push(await toFalUrl(url))
        } catch (e) { console.warn('[verify] Failed to upload photo to fal.ai:', e) }
      }
      if (!falPhotoUrls.length) throw new Error('Could not upload any customer photos to fal.ai')

      const falTattooUrl = tattooSourceUrl ? await toFalUrl(tattooSourceUrl).catch(() => undefined) : undefined

      const entries = await submitFaceSwapJobs(falPhotoUrls, packageId, hasTattoos, falTattooUrl)
      if (!entries.length) throw new Error('No jobs submitted')

      await supabase.from('orders').update({
        status: 'generating',
        replicate_training_id: JSON.stringify(entries),
      }).eq('id', orderId)

      console.log('[verify] Face-swap pipeline started, jobs:', entries.length)
      return NextResponse.json({ ok: true, jobs: entries.length })
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
