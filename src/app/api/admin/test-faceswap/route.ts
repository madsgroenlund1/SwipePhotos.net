import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { submitFaceSwaps, pollFaceSwaps, pickBestFacePhoto } from '@/lib/faceswap'
import { fal } from '@fal-ai/client'
import { sendReadyEmail } from '@/lib/resend'

fal.config({ credentials: process.env.FAL_KEY })

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  const { password, orderId } = await req.json()

  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createAdminClient()

  const { data: order } = await supabase
    .from('orders')
    .select('id, email, status')
    .eq('id', orderId)
    .single()

  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

  const { data: uploads } = await supabase
    .from('uploads')
    .select('file_url')
    .eq('order_id', orderId)

  if (!uploads?.length) return NextResponse.json({ error: 'No uploads for this order' }, { status: 400 })

  const faceUrl = pickBestFacePhoto(uploads.map((u: { file_url: string }) => u.file_url))

  await supabase.from('generated_photos').delete().eq('order_id', orderId)
  await supabase.from('orders').update({ status: 'generating' }).eq('id', orderId)

  try {
    const falFaceUrl = await fal.storage.upload(
      await fetch(faceUrl).then(r => r.blob()).then(b => new File([b], 'face.jpg', { type: 'image/jpeg' }))
    )

    // Submit jobs async
    const requestIds = await submitFaceSwaps(falFaceUrl)
    await supabase.from('orders').update({ replicate_training_id: JSON.stringify(requestIds) }).eq('id', orderId)

    // Poll until done (max 50s)
    const start = Date.now()
    let pending = requestIds
    const allUrls: string[] = []

    while (pending.length > 0 && Date.now() - start < 50000) {
      await new Promise(r => setTimeout(r, 3000))
      const { urls, pending: stillPending } = await pollFaceSwaps(pending)
      allUrls.push(...urls)
      pending = stillPending
    }

    for (const url of allUrls) {
      await supabase.from('generated_photos').insert({ order_id: orderId, file_url: url })
    }

    if (allUrls.length > 0) {
      await supabase.from('orders').update({ status: 'ready' }).eq('id', orderId)
      if (order.email) await sendReadyEmail(order.email, orderId).catch(console.error)
    }

    return NextResponse.json({ ok: true, count: allUrls.length, pending: pending.length })
  } catch (err) {
    await supabase.from('orders').update({ status: 'failed' }).eq('id', orderId)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
