import { NextRequest, NextResponse } from 'next/server'
import { createAdminClientDirect } from '@/lib/supabase/server'
import { pollFaceSwapJobs } from '@/lib/faceswap'
import { sendReadyEmail } from '@/lib/resend'

export const runtime = 'nodejs'
export const maxDuration = 60

const STORAGE_BUCKET = 'generated-photos'
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''

// Download from fal.ai and re-upload to Supabase Storage for a permanent URL.
// Falls back to the original fal URL on any failure so generation is never lost.
async function saveToStorage(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  falUrl: string,
  orderId: string,
  idx: number
): Promise<string> {
  try {
    const resp = await fetch(falUrl)
    if (!resp.ok) return falUrl
    const buf = await resp.arrayBuffer()
    const path = `${orderId}/${idx}.jpg`

    // Ensure the bucket exists (idempotent)
    await supabase.storage.createBucket(STORAGE_BUCKET, { public: true }).catch(() => {})

    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(path, buf, { contentType: 'image/jpeg', upsert: true })

    if (error) {
      console.warn('[poll] storage upload failed:', error.message)
      return falUrl
    }

    return `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${path}`
  } catch (e) {
    console.warn('[poll] saveToStorage error:', e)
    return falUrl
  }
}

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

  const { passedUrls, failedUrls, pending } = await pollFaceSwapJobs(requestIds)
  if (failedUrls.length) console.warn(`[poll] ${failedUrls.length} rejected by quality gate for order ${orderId}`)

  // Save newly completed photos: download from fal.ai → re-upload to Supabase Storage
  for (const falUrl of passedUrls) {
    if (!alreadySaved.has(falUrl)) {
      const savedIdx = alreadySaved.size
      const permanentUrl = await saveToStorage(supabase, falUrl, orderId, savedIdx)
      await supabase.from('generated_photos').insert({ order_id: orderId, file_url: permanentUrl })
      alreadySaved.add(falUrl) // dedup by original fal URL
    }
  }

  const totalSaved = alreadySaved.size

  // If no more pending jobs — either mark ready or failed
  if (pending.length === 0) {
    if (totalSaved > 0) {
      await supabase.from('orders').update({ status: 'ready' }).eq('id', orderId)
      if (order.email) await sendReadyEmail(order.email, orderId, totalSaved).catch(console.error)
      return NextResponse.json({ status: 'ready', count: totalSaved })
    } else {
      // All jobs completed but none passed quality gate
      console.error(`[poll] All jobs failed quality gate for order ${orderId}`)
      await supabase.from('orders').update({ status: 'failed' }).eq('id', orderId)
      return NextResponse.json({ status: 'failed' })
    }
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
