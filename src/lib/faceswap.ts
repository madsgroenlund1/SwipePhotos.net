import { fal } from '@fal-ai/client'
import { getPreviewTemplates, pickPaidTemplates, pickCustomerPhotoForTemplate } from './templates'

fal.config({ credentials: process.env.FAL_KEY })

// ─── Model ────────────────────────────────────────────────────────────────────
//
// easel-ai/advanced-face-swap: swaps ONLY the face into the target image.
// Preserves the template's background, lighting, pose, and clothing.
//
// workflow_type:
//   "user_hair"   → keeps the CUSTOMER's own hair
//   "target_hair" → keeps the TEMPLATE model's hair
//
// upscale: true adds 2× resolution boost for sharper output.
//
const MODEL = 'easel-ai/advanced-face-swap'
const DEFAULT_WORKFLOW = 'user_hair'

// With upscale:true, output images are typically 400–1200 KB.
const MIN_VALID_SIZE_BYTES = 150_000

// ─── Types ────────────────────────────────────────────────────────────────────

type FaceSwapInput = {
  face_image_0: string
  target_image: string
  workflow_type: string
  upscale: boolean
}

type FaceSwapResult = {
  image?: { url?: string; width?: number; height?: number }
}

export type QualityResult = {
  url: string
  fileSizeBytes: number
  passed: boolean
  failReason?: string
}

// Tracks which fal.ai request belongs to which template — stored as JSON in orders.replicate_training_id
export type JobEntry = {
  requestId: string
  templateId: string
}

// ─── Quality control ──────────────────────────────────────────────────────────

export async function scoreOutput(url: string): Promise<QualityResult> {
  try {
    const head = await fetch(url, { method: 'HEAD' })
    if (!head.ok) {
      return { url, fileSizeBytes: 0, passed: false, failReason: `HTTP ${head.status}` }
    }
    const contentLength = parseInt(head.headers.get('content-length') ?? '0', 10)
    if (contentLength > 0 && contentLength < MIN_VALID_SIZE_BYTES) {
      return {
        url,
        fileSizeBytes: contentLength,
        passed: false,
        failReason: `Too small (${contentLength} bytes) — likely no-op or failed swap`,
      }
    }

    if (contentLength === 0) {
      const resp = await fetch(url)
      if (!resp.ok) return { url, fileSizeBytes: 0, passed: false, failReason: `GET ${resp.status}` }
      const buf = await resp.arrayBuffer()
      const size = buf.byteLength
      if (size < MIN_VALID_SIZE_BYTES) {
        return { url, fileSizeBytes: size, passed: false, failReason: `Too small (${size} bytes)` }
      }
      return { url, fileSizeBytes: size, passed: true }
    }

    return { url, fileSizeBytes: contentLength, passed: true }
  } catch (err) {
    return { url, fileSizeBytes: 0, passed: false, failReason: String(err) }
  }
}

// ─── Preview (5 photos, synchronous, called before payment) ──────────────────

export async function runPreviewFaceSwaps(
  customerFaceUrl: string,
  preferredCategory?: string,
  hasTattoos?: boolean
): Promise<Record<string, string>> {
  // Use the dedicated preview selector — picks 5 high-quality varied templates
  const templates = getPreviewTemplates()

  if (hasTattoos) {
    console.log('[preview] Customer has tattoos — face/neck tattoos transfer via face-swap; body tattoos follow template skin (model limitation)')
  }

  function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
    return Promise.race([
      p,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`Job timed out after ${ms}ms`)), ms)
      ),
    ])
  }

  const results = await Promise.allSettled(
    templates.map((template, idx) => {
      const customerUrl = pickCustomerPhotoForTemplate([customerFaceUrl], idx)
      return withTimeout(
        fal.subscribe(MODEL, {
          input: {
            face_image_0: customerUrl,
            target_image: template.url,
            workflow_type: DEFAULT_WORKFLOW,
            upscale: true,
          } as FaceSwapInput,
          logs: false,
        }) as Promise<{ data: FaceSwapResult }>,
        60_000
      ).then(r => ({ r, template }))
    })
  )

  const photos: Record<string, string> = {}
  for (let i = 0; i < results.length; i++) {
    const job = results[i]
    if (job.status === 'fulfilled') {
      const url = job.value.r?.data?.image?.url
      if (url) {
        photos[String(i)] = url
        console.log(`[preview] Job ${i} OK — ${job.value.template.id}`)
      } else {
        console.warn(`[preview] Job ${i} no URL — ${job.value.template.id}`)
      }
    } else {
      console.error(`[preview] Job ${i} failed:`, job.reason)
    }
  }

  return photos
}

// ─── Paid generation (async queue, post-payment) ──────────────────────────────

export async function submitFaceSwapJobs(
  customerPhotoUrls: string[],
  preferredCategory?: string,
  hasTattoos?: boolean
): Promise<JobEntry[]> {
  if (!customerPhotoUrls.length) throw new Error('No customer photos provided')

  // Use pickPaidTemplates for proper variety: 40% preferred category + 60% varied from others
  const templates = pickPaidTemplates(preferredCategory, 20)

  console.log(
    `[faceswap] Submitting ${templates.length} jobs — workflow: ${DEFAULT_WORKFLOW}, tattoos: ${!!hasTattoos}, photos: ${customerPhotoUrls.length}`,
    templates.map(t => t.id)
  )

  const jobs = await Promise.allSettled(
    templates.map((template, idx) => {
      const customerUrl = pickCustomerPhotoForTemplate(customerPhotoUrls, idx)
      return fal.queue
        .submit(MODEL, {
          input: {
            face_image_0: customerUrl,
            target_image: template.url,
            workflow_type: DEFAULT_WORKFLOW,
            upscale: true,
          } as FaceSwapInput,
        })
        .then(result => ({ result, templateId: template.id }))
    })
  )

  const entries: JobEntry[] = []
  for (const job of jobs) {
    if (job.status === 'fulfilled' && job.value.result.request_id) {
      entries.push({ requestId: job.value.result.request_id, templateId: job.value.templateId })
    } else if (job.status === 'rejected') {
      console.error('[faceswap] Submit failed:', job.reason)
    }
  }

  console.log(`[faceswap] Queued ${entries.length}/${templates.length} jobs`)
  return entries
}

// ─── Polling (called every 10s from the poll endpoint) ───────────────────────

export async function pollFaceSwapJobs(entries: JobEntry[]): Promise<{
  passed: { url: string; templateId: string }[]
  failedCount: number
  pending: JobEntry[]
}> {
  const passed: { url: string; templateId: string }[] = []
  let failedCount = 0
  const pending: JobEntry[] = []

  await Promise.allSettled(
    entries.map(async ({ requestId, templateId }) => {
      try {
        const status = await fal.queue.status(MODEL, { requestId, logs: false })
        const s = status.status as string

        if (s === 'COMPLETED') {
          const result = await fal.queue.result(MODEL, { requestId }) as { data: FaceSwapResult }
          const url = result?.data?.image?.url
          if (!url) {
            failedCount++
            return
          }

          const score = await scoreOutput(url)
          if (score.passed) {
            passed.push({ url, templateId })
            console.log(`[faceswap] ✓ ${requestId} (${templateId}) — ${score.fileSizeBytes} bytes`)
          } else {
            failedCount++
            console.warn(`[faceswap] ✗ ${requestId} (${templateId}) — REJECTED: ${score.failReason}`)
          }
        } else if (s === 'FAILED' || s === 'CANCELLED') {
          failedCount++
          console.warn(`[faceswap] Job ${requestId} (${templateId}) ${s}`)
        } else {
          pending.push({ requestId, templateId })
        }
      } catch (err) {
        console.error(`[faceswap] Poll error for ${requestId}:`, err)
        pending.push({ requestId, templateId })
      }
    })
  )

  return { passed, failedCount, pending }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Parse replicate_training_id from the orders table.
 * Supports both old format (string[]) and new format (JobEntry[]).
 */
export function parseJobEntries(raw: string): JobEntry[] {
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed) || !parsed.length) return []
    // Old format: ["uuid1", "uuid2", ...]
    if (typeof parsed[0] === 'string') {
      return parsed.map((id: string) => ({ requestId: id, templateId: 'unknown' }))
    }
    // New format: [{requestId, templateId}, ...]
    return parsed as JobEntry[]
  } catch {
    return []
  }
}

// ─── Legacy exports ───────────────────────────────────────────────────────────

/** @deprecated use submitFaceSwapJobs */
export async function submitFaceSwaps(
  customerPhotoUrl: string,
  preferredScene?: string
): Promise<JobEntry[]> {
  return submitFaceSwapJobs([customerPhotoUrl], preferredScene)
}

export function pickBestFacePhoto(photoUrls: string[]): string {
  return photoUrls[0]
}
