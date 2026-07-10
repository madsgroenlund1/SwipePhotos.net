import { fal } from '@fal-ai/client'
import { pickPaidTemplates, getPreviewTemplates, pickCustomerPhotoForTemplate, type Template } from './templates'

fal.config({ credentials: process.env.FAL_KEY })

// ─── Parameters ───────────────────────────────────────────────────────────────
//
// face_restore_weight is the most important quality lever.
//
//  0.75  → GFPGAN/CodeFormer applies heavy correction → PLASTIC SKIN, fake teeth,
//           over-sharpened eyes. Looks unmistakably AI-generated.
//
//  0.25  → Light correction. Preserves natural skin texture, pores, micro-shadows.
//           The swap itself (InSwapper/InsightFace) handles identity; restoration
//           only cleans up obvious artefacts. Looks photographic.
//
//  0.0   → No restoration at all. May leave blending seams on low-quality inputs.
//
// For most customers 0.25–0.30 is the sweet spot.
//
const FACE_RESTORE_WEIGHT = 0.25   // KEY FIX: was 0.75, caused plastic look
const FACE_RESTORE_VERSION = 'v1.4' // GFPGAN v1.4 — solid at low weights

// Minimum file size we accept as a valid swap result.
// A successful swap on a half-body photo is typically 200–900 KB.
// Under 80 KB usually means the model returned a blank/failed image.
const MIN_VALID_SIZE_BYTES = 80_000

// ─── Types ────────────────────────────────────────────────────────────────────

type FaceSwapInput = {
  base_image_url: string  // template (model photo)
  swap_image_url: string  // customer face
  face_restore_version: string
  face_restore_weight: number
}

type FaceSwapResult = {
  image?: { url?: string; content_type?: string }
  images?: Array<{ url?: string }>
}

export type QualityResult = {
  url: string
  fileSizeBytes: number
  passed: boolean
  failReason?: string
}

// ─── Quality control ──────────────────────────────────────────────────────────

/**
 * Fetch the output image and check basic quality signals:
 * - File actually loads (HTTP 200)
 * - File is large enough to be a real photo (not a blank/error image)
 *
 * We intentionally keep this cheap (one HEAD/GET request) so it doesn't
 * add more than ~1s per image. A future enhancement can call a face-detection
 * API for identity similarity scoring.
 */
export async function scoreOutput(url: string): Promise<QualityResult> {
  try {
    // HEAD first — just get Content-Length without downloading the body
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
        failReason: `Too small (${contentLength} bytes) — likely a blank or failed swap`,
      }
    }

    // If Content-Length isn't set, do a GET and measure
    if (contentLength === 0) {
      const resp = await fetch(url)
      if (!resp.ok) return { url, fileSizeBytes: 0, passed: false, failReason: `GET ${resp.status}` }
      const buf = await resp.arrayBuffer()
      const size = buf.byteLength
      if (size < MIN_VALID_SIZE_BYTES) {
        return {
          url,
          fileSizeBytes: size,
          passed: false,
          failReason: `Too small (${size} bytes)`,
        }
      }
      return { url, fileSizeBytes: size, passed: true }
    }

    return { url, fileSizeBytes: contentLength, passed: true }
  } catch (err) {
    return { url, fileSizeBytes: 0, passed: false, failReason: String(err) }
  }
}

// ─── Preview (5 photos, synchronous, called before payment) ──────────────────

/**
 * Run 5 face-swap jobs synchronously for the free preview.
 * Uses fal.subscribe (waits for result) with a per-job timeout.
 * Returns however many photos completed within the 50s window.
 */
export async function runPreviewFaceSwaps(
  customerFaceUrl: string,
  preferredCategory?: string
): Promise<Record<string, string>> {
  const templates = getPreviewTemplates()
  // Put preferred category first
  const ordered = preferredCategory
    ? [
        ...templates.filter(t => t.category === preferredCategory),
        ...templates.filter(t => t.category !== preferredCategory),
      ].slice(0, 5)
    : templates

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
        fal.subscribe('fal-ai/face-swap', {
          input: {
            base_image_url: template.url,
            swap_image_url: customerUrl,
            face_restore_version: FACE_RESTORE_VERSION,
            face_restore_weight: FACE_RESTORE_WEIGHT,
          } as FaceSwapInput,
          logs: false,
        }) as Promise<FaceSwapResult>,
        50_000
      )
    })
  )

  const photos: Record<string, string> = {}
  for (let i = 0; i < results.length; i++) {
    const r = results[i]
    if (r.status === 'fulfilled') {
      const url = r.value?.image?.url ?? r.value?.images?.[0]?.url
      if (url) {
        photos[String(i)] = url
        console.log(`[preview] Job ${i} OK — ${ordered[i].id}`)
      }
    } else {
      console.error(`[preview] Job ${i} failed (${ordered[i].id}):`, r.reason)
    }
  }

  return photos
}

// ─── Paid generation (async queue, post-payment) ──────────────────────────────

/**
 * Submit all paid face-swap jobs to the fal.ai queue.
 * Returns the list of fal.ai request IDs — these are polled later.
 *
 * customerPhotoUrls: all photos the customer uploaded.
 * We rotate through them per template so the model sees different
 * angles/expressions, which improves variety and match quality.
 */
export async function submitFaceSwapJobs(
  customerPhotoUrls: string[],
  preferredCategory?: string
): Promise<string[]> {
  if (!customerPhotoUrls.length) throw new Error('No customer photos provided')

  const templates = pickPaidTemplates(preferredCategory, 20)
  console.log(`[faceswap] Submitting ${templates.length} jobs (customer has ${customerPhotoUrls.length} photos)`)

  const jobs = await Promise.allSettled(
    templates.map((template, idx) => {
      const customerUrl = pickCustomerPhotoForTemplate(customerPhotoUrls, idx)
      return fal.queue.submit('fal-ai/face-swap', {
        input: {
          base_image_url: template.url,
          swap_image_url: customerUrl,
          face_restore_version: FACE_RESTORE_VERSION,
          face_restore_weight: FACE_RESTORE_WEIGHT,
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

/**
 * Check status of queued jobs.
 * Completed results are quality-scored — only URLs that pass are returned.
 * Failed/cancelled jobs are dropped (not retried — template diversity means
 * losing 1–2 jobs out of 20 is acceptable).
 */
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
        const status = await fal.queue.status('fal-ai/face-swap', { requestId, logs: false })
        const s = status.status as string

        if (s === 'COMPLETED') {
          const result = await fal.queue.result('fal-ai/face-swap', { requestId }) as FaceSwapResult
          const url = result?.image?.url ?? result?.images?.[0]?.url
          if (!url) {
            failedUrls.push(`no-url:${requestId}`)
            return
          }

          // Quality gate
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
        pending.push(requestId) // retry next poll
      }
    })
  )

  return { passedUrls, failedUrls, pending }
}

// ─── Legacy exports (keep old names working so other files don't break) ───────

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
