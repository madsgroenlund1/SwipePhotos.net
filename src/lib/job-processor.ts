/**
 * Core job-processing logic shared between:
 *   - GET /api/orders/[id]/poll  (frontend polling)
 *   - GET /api/cron/poll-generating  (server-side Vercel cron)
 *
 * Invariant: this function is idempotent — calling it multiple times for
 * the same order when jobs are still running is always safe.
 */

import { pollFaceSwapJobs, parseJobEntries } from './faceswap'
import { sendReadyEmail, sendFailedEmail } from './resend'

const STORAGE_BUCKET = 'generated-photos'
const SUPABASE_URL   = process.env.NEXT_PUBLIC_SUPABASE_URL || ''

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
    const buf  = await resp.arrayBuffer()
    const path = `${orderId}/${idx}.jpg`

    await supabase.storage.createBucket(STORAGE_BUCKET, { public: true }).catch(() => {})

    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(path, buf, { contentType: 'image/jpeg', upsert: true })

    if (error) {
      console.warn('[job-processor] storage upload failed:', error.message)
      return falUrl
    }

    return `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${path}`
  } catch (e) {
    console.warn('[job-processor] saveToStorage error:', e)
    return falUrl
  }
}

export type ProcessResult =
  | { status: 'ready';      count: number }
  | { status: 'failed' }
  | { status: 'generating'; saved: number; pending: number }
  | { status: string }   // any other order status (not generating)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function processOrderJobs(orderId: string, supabase: any): Promise<ProcessResult> {
  const { data: order } = await supabase
    .from('orders')
    .select('id, status, email, replicate_training_id')
    .eq('id', orderId)
    .single()

  if (!order) return { status: 'not_found' }

  if (order.status !== 'generating') return { status: order.status }

  const entries = parseJobEntries(order.replicate_training_id || '[]')
  if (!entries.length) return { status: order.status }

  // Fetch already-saved photos to avoid duplicate inserts
  const { data: existingPhotos } = await supabase
    .from('generated_photos')
    .select('id, file_url')
    .eq('order_id', orderId)

  const alreadySavedCount = existingPhotos?.length ?? 0
  const alreadySavedUrls  = new Set((existingPhotos || []).map((p: { file_url: string }) => p.file_url))

  const { passed, failedCount, pending } = await pollFaceSwapJobs(entries)
  if (failedCount) console.warn(`[job-processor] ${failedCount} rejected by quality gate for order ${orderId}`)

  // Persist newly completed photos
  let savedThisRound = 0
  for (const { url: falUrl, templateId } of passed) {
    if (alreadySavedUrls.has(falUrl)) continue

    const savedIdx    = alreadySavedCount + savedThisRound
    const permanentUrl = await saveToStorage(supabase, falUrl, orderId, savedIdx)

    await supabase.from('generated_photos').insert({
      order_id:    orderId,
      file_url:    permanentUrl,
      template_id: templateId,
    })
    alreadySavedUrls.add(falUrl)
    savedThisRound++
  }

  const totalSaved = alreadySavedCount + savedThisRound

  if (pending.length === 0) {
    if (totalSaved > 0) {
      await supabase.from('orders').update({ status: 'ready' }).eq('id', orderId)
      if (order.email) {
        await sendReadyEmail(order.email, orderId, totalSaved).catch(e =>
          console.error('[job-processor] ready email failed:', e)
        )
      }
      console.log(`[job-processor] Order ${orderId} READY — ${totalSaved} photos`)
      return { status: 'ready', count: totalSaved }
    } else {
      console.error(`[job-processor] Order ${orderId} FAILED — all ${failedCount} jobs rejected`)
      await supabase.from('orders').update({ status: 'failed' }).eq('id', orderId)
      if (order.email) {
        await sendFailedEmail(order.email, orderId).catch(e =>
          console.error('[job-processor] failure email failed:', e)
        )
      }
      return { status: 'failed' }
    }
  }

  // Still running — update the remaining pending entries if changed
  if (pending.length !== entries.length) {
    await supabase
      .from('orders')
      .update({ replicate_training_id: JSON.stringify(pending) })
      .eq('id', orderId)
  }

  return { status: 'generating', saved: totalSaved, pending: pending.length }
}
