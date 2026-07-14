/**
 * Core job-processing logic shared between:
 *   - GET /api/orders/[id]/poll  (frontend polling)
 *   - GET /api/cron/poll-generating  (server-side Vercel cron)
 *
 * Invariant: this function is idempotent — calling it multiple times for
 * the same order when jobs are still running is always safe.
 */

import { pollFaceSwapJobs, parseJobEntries, resubmitTemplateJob, JobEntry } from './faceswap'
import { assessPhotoQuality, QC_MAX_RETRIES } from './quality-control'
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

  const { passed: allPassed, failedCount, pending: falPending } = await pollFaceSwapJobs(entries)
  if (failedCount) console.warn(`[job-processor] ${failedCount} rejected by quality gate for order ${orderId}`)

  // Cap how many completed-but-unprocessed jobs get QC + saved in a single
  // invocation. Each QC check is a fal.ai vision call, and when many templates
  // finish around the same time (common for a 15/45-photo package), running
  // QC + storage save for all of them at once can blow past the serverless
  // function's maxDuration — the whole invocation gets killed and NOTHING
  // commits, which looked like the order being permanently stuck at 0 saved.
  // Deferred ones are simply treated as still-pending; the next poll (fal's
  // own completion check is cheap and idempotent) picks them up and makes
  // real incremental progress every cycle instead of risking an all-or-nothing
  // timeout.
  const MAX_QC_PER_INVOCATION = 6
  const passed   = allPassed.slice(0, MAX_QC_PER_INVOCATION)
  const deferred = allPassed.slice(MAX_QC_PER_INVOCATION)
  const pending  = [...falPending, ...deferred.map(d => d.entry)]

  // ── Critical quality control ────────────────────────────────────────────
  // Every completed photo is checked against the customer's own reference
  // photo before it's ever saved — wrong identity, AI-artifact skin,
  // malformed hands, or a mismatched pose gets discarded and that ONE
  // template is resubmitted for a fresh attempt (up to QC_MAX_RETRIES times).
  // Entries from before this system shipped won't carry customerPhotoUrls —
  // those fail open (saved as-is) rather than blocking older in-flight orders.
  const resubmitted: JobEntry[] = []
  const qcApproved: { url: string; templateId: string }[] = []

  await Promise.allSettled(
    passed.map(async ({ url, templateId, entry }) => {
      const customerRef = entry.customerPhotoUrls?.[0]
      if (!customerRef) {
        qcApproved.push({ url, templateId })
        return
      }

      const qc = await assessPhotoQuality(customerRef, url)
      if (qc.pass) {
        qcApproved.push({ url, templateId })
        return
      }

      const retries = entry.qcRetries ?? 0
      console.warn(`[job-processor] QC REJECTED ${templateId} (attempt ${retries + 1}): ${qc.reason}`)

      if (retries < QC_MAX_RETRIES) {
        const resubmittedEntry = await resubmitTemplateJob(entry)
        if (resubmittedEntry) {
          resubmitted.push(resubmittedEntry)
          return
        }
        // Resubmit itself failed (fal.ai error) — fall through and accept
        // the original rather than losing the photo entirely.
      } else {
        console.warn(`[job-processor] QC exhausted ${QC_MAX_RETRIES} retries for ${templateId} — accepting best effort`)
      }
      qcApproved.push({ url, templateId })
    })
  )

  // Persist newly completed, QC-approved photos
  let savedThisRound = 0
  for (const { url: falUrl, templateId } of qcApproved) {
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
  const allPending = [...pending, ...resubmitted]

  if (allPending.length === 0) {
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

  // Still running (or awaiting a QC-triggered retry) — persist the updated list
  await supabase
    .from('orders')
    .update({ replicate_training_id: JSON.stringify(allPending) })
    .eq('id', orderId)

  return { status: 'generating', saved: totalSaved, pending: allPending.length }
}
