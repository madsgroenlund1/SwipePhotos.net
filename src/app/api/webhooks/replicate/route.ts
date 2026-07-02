import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendReadyEmail } from '@/lib/resend'
import { generatePhotos } from '@/lib/replicate'

export const runtime = 'nodejs'
export const maxDuration = 300 // 5 min for photo generation

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const orderId = searchParams.get('orderId')
  const email = searchParams.get('email') || ''

  if (!orderId) return NextResponse.json({ error: 'Missing orderId' }, { status: 400 })

  const body = await req.json()
  console.log('[replicate webhook] status:', body.status, 'orderId:', orderId)

  const supabase = await createAdminClient()

  if (body.status === 'failed' || body.status === 'canceled') {
    await supabase.from('orders').update({ status: 'failed' }).eq('id', orderId)
    return NextResponse.json({ ok: true })
  }

  if (body.status !== 'succeeded') {
    return NextResponse.json({ ok: true })
  }

  // Training succeeded — get LoRA weights URL
  const loraUrl = body.output?.weights
  if (!loraUrl) {
    console.error('[replicate webhook] No weights URL in output')
    await supabase.from('orders').update({ status: 'failed' }).eq('id', orderId)
    return NextResponse.json({ ok: true })
  }

  // Generate photos
  await supabase.from('orders').update({ status: 'generating' }).eq('id', orderId)

  try {
    const photoUrls = await generatePhotos(loraUrl)

    for (const url of photoUrls) {
      await supabase.from('generated_photos').insert({ order_id: orderId, file_url: url })
    }

    await supabase.from('orders').update({ status: 'ready' }).eq('id', orderId)

    if (email) await sendReadyEmail(email, orderId).catch(console.error)
  } catch (err) {
    console.error('[replicate webhook] Generation failed:', err)
    await supabase.from('orders').update({ status: 'failed' }).eq('id', orderId)
  }

  return NextResponse.json({ ok: true })
}
