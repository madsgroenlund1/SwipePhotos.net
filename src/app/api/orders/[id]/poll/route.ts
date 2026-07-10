import { NextRequest, NextResponse } from 'next/server'
import { createAdminClientDirect } from '@/lib/supabase/server'
import { pollFaceSwaps } from '@/lib/faceswap'
import { sendReadyEmail } from '@/lib/resend'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: orderId } = await params
  const supabase = createAdminClientDirect()

  const { data: order } = await supabase
    .from('orders')
    .select('id, status, email, replicate_training_id')
    .eq('id', orderId)
    .single()

  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Only poll if currently generating
  if (order.status !== 'generating') {
    return NextResponse.json({ status: order.status })
  }

  // Parse stored fal.ai request IDs
  let requestIds: string[] = []
  try {
    requestIds = JSON.parse(order.replicate_training_id || '[]')
  } catch {
    return NextResponse.json({ status: order.status })
  }

  if (!requestIds.length) return NextResponse.json({ status: order.status })

  // Check which jobs are done
  const { data: existingPhotos } = await supabase
    .from('generated_photos')
    .select('file_url')
    .eq('order_id', orderId)

  const alreadySaved = new Set((existingPhotos || []).map((p: { file_url: string }) => p.file_url))

  const { urls: newUrls, pending } = await pollFaceSwaps(requestIds)

  // Save newly completed photos
  for (const url of newUrls) {
    if (!alreadySaved.has(url)) {
      await supabase.from('generated_photos').insert({ order_id: orderId, file_url: url })
      alreadySaved.add(url)
    }
  }

  const totalSaved = alreadySaved.size

  // If no more pending jobs, mark order ready
  if (pending.length === 0 && totalSaved > 0) {
    await supabase.from('orders').update({ status: 'ready' }).eq('id', orderId)
    if (order.email) await sendReadyEmail(order.email, orderId, totalSaved).catch(console.error)
    return NextResponse.json({ status: 'ready', count: totalSaved })
  }

  // Update pending IDs for next poll
  if (pending.length !== requestIds.length) {
    await supabase
      .from('orders')
      .update({ replicate_training_id: JSON.stringify(pending) })
      .eq('id', orderId)
  }

  return NextResponse.json({ status: 'generating', saved: totalSaved, pending: pending.length })
}
