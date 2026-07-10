import { fal } from '@fal-ai/client'
import { pickPaidTemplates, getPreviewTemplates, pickCustomerPhotoForTemplate } from './templates'

fal.config({ credentials: process.env.FAL_KEY })

// ─── Model ────────────────────────────────────────────────────────────────────
//
// easel-ai/advanced-face-swap: swaps ONLY the face into the target image.
// Preserves the template's background, lighting, pose, and clothing.
//
// workflow_type:
//   "user_hair"   → keeps the CUSTOMER's own hair. Better identity recognition —
//                   the customer sees their own hairstyle. ← USED BY DEFAULT
//   "target_hair" → keeps the TEMPLATE model's hair. More polished studio look
//                   but customer may not recognise themselves as easily.
//
// upscale: true adds 2× resolution boost for sharper output.
//
const MODEL = 'easel-ai/advanced-face-swap'

// "user_hair" is the default — customers recognise themselves much better
// when their own hairstyle is preserved rather than the template model's.
const DEFAULT_WORKFLOW = 'user_hair'

// With upscale:true, output images are typically 400–1200 KB.
// Raise threshold from 80 KB to 150 KB to filter no-op / failed swaps.
const MIN_VALID_SIZE_BYTES = 150_000

// ─── Types ────────────────────────────────────────────────────────────────────

type FaceSwapInput = {
  face_image_0: string   // customer face URL
  target_image: string   // template (model photo) URL
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
  const templates = getPreviewTemplates()
  const ordered = preferredCategory
    ? [
        ...templates.filter(t => t.category === preferredCategory),
        ...templates.filter(t => t.category !== preferredCategory),
      ].slice(0, 5)
    : templates

  // Always use "user_hair" so the customer recognises their own hair in the output.
  // If the customer has tattoos, log it — face/neck tattoos transfer naturally through
  // the face swap; body tattoos stay with the template model's skin (model limitation).
  const workflowType = DEFAULT_WORKFLOW
  if (hasTattoos) console.log('[preview] Customer has tattoos — face/neck tattoos will transfer; body tattoos follow template skin')

  function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
    return Promise.race([
      p,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`Job timed out after ${ms}ms`)), ms)
      ),
    ])
  }

  const results = await Promise.allSettled(
    ordered.map((template, idx) => {
      const customerUrl = pickCustomerPhotoForTemplate([customerFaceUrl], idx)
      return withTimeout(
        fal.subscribe(MODEL, {
          input: {
            face_image_0: customerUrl,
            target_image: template.url,
            workflow_type: workflowType,
            upscale: true,
          } as FaceSwapInput,
          logs: false,
        }) as Promise<{ data: FaceSwapResult }>,
        60_000
      )
    })
  )

  const photos: Record<string, string> = {}
  for (let i = 0; i < results.length; i++) {
    const r = results[i]
    if (r.status === 'fulfilled') {
      const url = r.value?.data?.image?.url
      if (url) {
        photos[String(i)] = url
        console.log(`[preview] Job ${i} OK — ${ordered[i].id}`)
      } else {
        console.warn(`[preview] Job ${i} no URL in result — ${ordered[i].id}`)
      }
    } else {
      console.error(`[preview] Job ${i} failed (${ordered[i].id}):`, r.reason)
    }
  }

  return photos
}

// ─── Paid generation (async queue, post-payment) ──────────────────────────────

export async function submitFaceSwapJobs(
  customerPhotoUrls: string[],
  preferredCategory?: string,
  hasTattoos?: boolean
): Promise<string[]> {
  if (!customerPhotoUrls.length) throw new Error('No customer photos provided')

  const templates = pickPaidTemplates(preferredCategory, 20)
  const workflowType = DEFAULT_WORKFLOW
  console.log(`[faceswap] Submitting ${templates.length} jobs — workflow: ${workflowType}, tattoos: ${!!hasTattoos}, photos: ${customerPhotoUrls.length}`)

  const jobs = await Promise.allSettled(
    templates.map((template, idx) => {
      const customerUrl = pickCustomerPhotoForTemplate(customerPhotoUrls, idx)
      return fal.queue.submit(MODEL, {
        input: {
          face_image_0: customerUrl,
          target_image: template.url,
          workflow_type: workflowType,
          upscale: true,
        } as FaceSwapInput,
      })
    })
  )

  const requestIds: string[] = []
  for (const job of jobs) {
    if (job.status === 'fulfilled' && job.value.request_id) {
      requestIds.push(job.value.request_id)
    } else if (job.status === 'rejected') {
      console.error('[faceswap] Submit failed:', job.reason)
    }
  }

  console.log(`[faceswap] Queued ${requestIds.length}/${templates.length} jobs`)
  return requestIds
}

// ─── Polling (called every 10s from the poll endpoint) ───────────────────────

export async function pollFaceSwapJobs(requestIds: string[]): Promise<{
  passedUrls: string[]
  failedUrls: string[]
  pending: string[]
}> {
  const passedUrls: string[] = []
  const failedUrls: string[] = []
  const pending: string[] = []

  await Promise.allSettled(
    requestIds.map(async (requestId) => {
      try {
        const status = await fal.queue.status(MODEL, { requestId, logs: false })
        const s = status.status as string

        if (s === 'COMPLETED') {
          const result = await fal.queue.result(MODEL, { requestId }) as { data: FaceSwapResult }
          const url = result?.data?.image?.url
          if (!url) {
            failedUrls.push(`no-url:${requestId}`)
            return
          }

          const score = await scoreOutput(url)
          if (score.passed) {
            passedUrls.push(url)
            console.log(`[faceswap] ✓ ${requestId} — ${score.fileSizeBytes} bytes`)
          } else {
            failedUrls.push(url)
            console.warn(`[faceswap] ✗ ${requestId} — REJECTED: ${score.failReason}`)
          }
        } else if (s === 'FAILED' || s === 'CANCELLED') {
          failedUrls.push(`failed:${requestId}`)
          console.warn(`[faceswap] Job ${requestId} ${s}`)
        } else {
          pending.push(requestId)
        }
      } catch (err) {
        console.error(`[faceswap] Poll error for ${requestId}:`, err)
        pending.push(requestId)
      }
    })
  )

  return { passedUrls, failedUrls, pending }
}

// ─── Legacy exports ───────────────────────────────────────────────────────────

/** @deprecated use submitFaceSwapJobs */
export async function submitFaceSwaps(
  customerPhotoUrl: string,
  preferredScene?: string
): Promise<string[]> {
  return submitFaceSwapJobs([customerPhotoUrl], preferredScene)
}

/** @deprecated use pollFaceSwapJobs */
export async function pollFaceSwaps(
  requestIds: string[]
): Promise<{ urls: string[]; pending: string[] }> {
  const { passedUrls, pending } = await pollFaceSwapJobs(requestIds)
  return { urls: passedUrls, pending }
}

export function pickBestFacePhoto(photoUrls: string[]): string {
  return photoUrls[0]
}
