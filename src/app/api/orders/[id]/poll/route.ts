import { NextRequest, NextResponse } from 'next/server'
import { createAdminClientDirect } from '@/lib/supabase/server'
import { pollFaceSwapJobs, parseJobEntries } from '@/lib/faceswap'
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

  if (order.status !== 'generating') {
    return NextResponse.json({ status: order.status })
  }

  // Parse job entries — handles both old string[] format and new {requestId,templateId}[] format
  const entries = parseJobEntries(order.replicate_training_id || '[]')
  if (!entries.length) return NextResponse.json({ status: order.status })

  const { data: existingPhotos } = await supabase
    .from('generated_photos')
    .select('id, file_url')
    .eq('order_id', orderId)

  const alreadySavedCount = existingPhotos?.length ?? 0
  const alreadySavedUrls = new Set((existingPhotos || []).map((p: { file_url: string }) => p.file_url))

  const { passed, failedCount, pending } = await pollFaceSwapJobs(entries)
  if (failedCount) console.warn(`[poll] ${failedCount} rejected by quality gate for order ${orderId}`)

  // Save newly completed photos with template_id for full traceability
  let savedThisRound = 0
  for (const { url: falUrl, templateId } of passed) {
    if (alreadySavedUrls.has(falUrl)) continue

    const savedIdx = alreadySavedCount + savedThisRound
    const permanentUrl = await saveToStorage(supabase, falUrl, orderId, savedIdx)
    await supabase.from('generated_photos').insert({
      order_id: orderId,
      file_url: permanentUrl,
      template_id: templateId,
    })
    alreadySavedUrls.add(falUrl)
    savedThisRound++
  }

  const totalSaved = alreadySavedCount + savedThisRound

  if (pending.length === 0) {
    if (totalSaved > 0) {
      await supabase.from('orders').update({ status: 'ready' }).eq('id', orderId)
      if (order.email) await sendReadyEmail(order.email, orderId, totalSaved).catch(console.error)
      return NextResponse.json({ status: 'ready', count: totalSaved })
    } else {
      console.error(`[poll] All jobs failed quality gate for order ${orderId}`)
      await supabase.from('orders').update({ status: 'failed' }).eq('id', orderId)
      return NextResponse.json({ status: 'failed' })
    }
  }

  // Store remaining pending entries for next poll
  if (pending.length !== entries.length) {
    await supabase
      .from('orders')
      .update({ replicate_training_id: JSON.stringify(pending) })
      .eq('id', orderId)
  }

  return NextResponse.json({ status: 'generating', saved: totalSaved, pending: pending.length })
}
