import { fal } from '@fal-ai/client'
import { getPreviewTemplatesForCategory, pickPaidTemplates, pickCustomerPhotoForTemplate, Template } from './templates'

fal.config({ credentials: process.env.FAL_KEY })

// ─── Model ────────────────────────────────────────────────────────────────────
//
// half-moon-ai/ai-face-swap/faceswapimagemulti
//
// Replaced the deprecated easel-ai/advanced-face-swap. This model:
//   - Takes source_face (customer URL) and target_image (template URL)
//   - Handles skin-tone adaptation, shadow matching, and alignment automatically
//   - No workflow_type or upscale params — the model handles these internally
//   - Supports multiple faces in the target image (faceswapimagemulti variant)
//
const MODEL = 'half-moon-ai/ai-face-swap/faceswapimagemulti'

// Minimum acceptable output file size. Outputs below this threshold are
// typically failed/empty swaps or corrupted frames.
const MIN_VALID_SIZE_BYTES = 80_000

// Maximum number of customer photos to try per template before giving up.
const MAX_ATTEMPTS_PER_TEMPLATE = 2

// ─── Types ────────────────────────────────────────────────────────────────────

type FaceSwapInput = {
  source_face: string
  target_image: string
}

// fal.ai models return data under `data` key; the image URL may be nested
// in different ways depending on model version. extractOutputUrl() handles all.
type FaceSwapOutput = {
  image?:   { url?: string; width?: number; height?: number; file_size?: number }
  images?:  Array<{ url?: string }>
  output?:  { url?: string } | string
  url?:     string
}

export type QualityResult = {
  url: string
  fileSizeBytes: number
  passed: boolean
  failReason?: string
}

// Tracks which fal.ai request belongs to which template
export type JobEntry = {
  requestId: string
  templateId: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Extract the output image URL from whatever shape the fal.ai model returns.
 * Guards against all known variants.
 */
function extractOutputUrl(result: unknown): string | null {
  if (!result || typeof result !== 'object') return null
  const r = result as { data?: FaceSwapOutput } & FaceSwapOutput

  // Standard fal format: result.data.image.url
  const data = r.data ?? r
  if (!data || typeof data !== 'object') return null
  const d = data as FaceSwapOutput

  if (d.image?.url)         return d.image.url
  if (d.images?.[0]?.url)   return d.images[0].url
  if (d.url)                 return d.url
  if (typeof d.output === 'string') return d.output
  if (typeof d.output === 'object' && d.output?.url) return d.output.url

  return null
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timed out after ${ms}ms`)), ms)
    ),
  ])
}

// ─── Quality control ──────────────────────────────────────────────────────────

/**
 * Score an output image by fetching its file size.
 * A small file almost always means a failed or blank swap.
 */
export async function scoreOutput(url: string): Promise<QualityResult> {
  try {
    const head = await fetch(url, { method: 'HEAD' })
    if (!head.ok) {
      return { url, fileSizeBytes: 0, passed: false, failReason: `HTTP ${head.status}` }
    }
    const contentLength = parseInt(head.headers.get('content-length') ?? '0', 10)

    if (contentLength > 0) {
      if (contentLength < MIN_VALID_SIZE_BYTES) {
        return {
          url,
          fileSizeBytes: contentLength,
          passed: false,
          failReason: `Too small (${contentLength}B) — likely failed swap`,
        }
      }
      return { url, fileSizeBytes: contentLength, passed: true }
    }

    // HEAD returned no Content-Length — do a full GET to measure
    const resp = await fetch(url)
    if (!resp.ok) return { url, fileSizeBytes: 0, passed: false, failReason: `GET ${resp.status}` }
    const buf = await resp.arrayBuffer()
    const size = buf.byteLength
    if (size < MIN_VALID_SIZE_BYTES) {
      return { url, fileSizeBytes: size, passed: false, failReason: `Too small (${size}B)` }
    }
    return { url, fileSizeBytes: size, passed: true }
  } catch (err) {
    return { url, fileSizeBytes: 0, passed: false, failReason: String(err) }
  }
}

// ─── Preview (5 photos, synchronous, called before payment) ──────────────────

/**
 * Run 5 face-swap previews for the given customer face.
 *
 * Retry strategy: if the first attempt for a template produces a too-small
 * output (likely a failed swap), we log the failure and move on — since
 * preview only has one source photo available, there's nothing else to try.
 * The job is still returned as a settled promise so the caller gets partial
 * results rather than a hard failure.
 */
export async function runPreviewFaceSwaps(
  customerFaceUrl: string,
  preferredCategory?: string,
  hasTattoos?: boolean
): Promise<Record<string, string>> {
  const templates = getPreviewTemplatesForCategory(preferredCategory ?? 'restaurant')

  if (hasTattoos) {
    console.log('[preview] hasTattoos=true — visible face/neck tattoos will transfer via face-swap; body tattoos follow template skin')
  }

  const results = await Promise.allSettled(
    templates.map(async (template, idx) => {
      // Per-template timeout: 70 s gives enough headroom for the model to finish
      // even under queue pressure, while keeping total preview time under 5 min.
      const raw = await withTimeout(
        fal.subscribe(MODEL, {
          input: { source_face: customerFaceUrl, target_image: template.url } as FaceSwapInput,
          logs: false,
        }),
        70_000
      )

      const url = extractOutputUrl(raw)
      if (!url) {
        throw new Error(`[preview] Job ${idx} (${template.id}): model returned no URL`)
      }

      const score = await scoreOutput(url)
      if (!score.passed) {
        throw new Error(
          `[preview] Job ${idx} (${template.id}): quality check failed — ${score.failReason}`
        )
      }

      console.log(`[preview] ✓ Job ${idx} (${template.id}) — ${score.fileSizeBytes}B`)
      return { url, template }
    })
  )

  const photos: Record<string, string> = {}
  for (let i = 0; i < results.length; i++) {
    const job = results[i]
    if (job.status === 'fulfilled') {
      photos[String(i)] = job.value.url
    } else {
      console.error(`[preview] ✗ Job ${i}:`, job.reason instanceof Error ? job.reason.message : job.reason)
    }
  }

  return photos
}

// ─── Paid generation (async queue, post-payment) ──────────────────────────────

/**
 * Submit async face-swap jobs for the paid generation flow.
 *
 * Smart source selection: rotates through customer photos so each template
 * is attempted with a different source image, maximising variety and reducing
 * the chance that a single low-quality upload ruins all outputs.
 *
 * If a job fails to submit (network error, model error), it is logged and
 * skipped rather than crashing the whole batch.
 */
export async function submitFaceSwapJobs(
  customerPhotoUrls: string[],
  preferredCategory?: string,
  hasTattoos?: boolean
): Promise<JobEntry[]> {
  if (!customerPhotoUrls.length) throw new Error('No customer photos provided')

  const templates = pickPaidTemplates(preferredCategory, 20)

  console.log(
    `[faceswap] Submitting ${templates.length} jobs — model: ${MODEL}`,
    `photos: ${customerPhotoUrls.length}, tattoos: ${!!hasTattoos}`,
    templates.map(t => t.id)
  )

  const jobs = await Promise.allSettled(
    templates.map((template, idx) => {
      const sourceUrl = pickCustomerPhotoForTemplate(customerPhotoUrls, idx)
      return fal.queue
        .submit(MODEL, {
          input: { source_face: sourceUrl, target_image: template.url } as FaceSwapInput,
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
          const raw = await fal.queue.result(MODEL, { requestId })
          const url = extractOutputUrl(raw)

          if (!url) {
            failedCount++
            console.warn(`[faceswap] ✗ ${requestId} (${templateId}) — no URL in result`)
            return
          }

          const score = await scoreOutput(url)
          if (score.passed) {
            passed.push({ url, templateId })
            console.log(`[faceswap] ✓ ${requestId} (${templateId}) — ${score.fileSizeBytes}B`)
          } else {
            failedCount++
            console.warn(`[faceswap] ✗ ${requestId} (${templateId}) — REJECTED: ${score.failReason}`)
          }
        } else if (s === 'FAILED' || s === 'CANCELLED') {
          failedCount++
          console.warn(`[faceswap] ${s}: ${requestId} (${templateId})`)
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
