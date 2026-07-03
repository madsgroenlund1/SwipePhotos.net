import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { runFaceSwaps, pickBestFacePhoto } from '@/lib/faceswap'
import { sendReadyEmail } from '@/lib/resend'

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

  const imageUrls = uploads.map((u: { file_url: string }) => u.file_url)
  const faceUrl = pickBestFacePhoto(imageUrls)

  await supabase.from('orders').update({ status: 'generating' }).eq('id', orderId)

  try {
    const photoUrls = await runFaceSwaps(faceUrl)

    // Clear old generated photos first
    await supabase.from('generated_photos').delete().eq('order_id', orderId)

    for (const url of photoUrls) {
      await supabase.from('generated_photos').insert({ order_id: orderId, file_url: url })
    }

    await supabase.from('orders').update({ status: 'ready' }).eq('id', orderId)

    if (order.email) await sendReadyEmail(order.email, orderId).catch(console.error)

    return NextResponse.json({ ok: true, count: photoUrls.length, photos: photoUrls })
  } catch (err) {
    await supabase.from('orders').update({ status: 'failed' }).eq('id', orderId)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
