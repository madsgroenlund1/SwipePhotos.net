import { fal } from '@fal-ai/client'
import { getPreviewTemplatesForCategory, pickPaidTemplates, pickCustomerPhotoForTemplate, Template, TEMPLATES } from './templates'

fal.config({ credentials: process.env.FAL_KEY })

// ─── Model ────────────────────────────────────────────────────────────────────
//
// bytedance/seedream/v5/pro/edit
//
// Region-precise image editing model. Accepts up to 10 reference images.
// Input: { image_urls: [template, customer1, customer2?], prompt: string }
// Output: { images: [{ url, width, height }] }
//
// Replaces the deprecated half-moon-ai/ai-face-swap/faceswapimagemulti.
//
const MODEL = 'bytedance/seedream/v5/pro/edit'

const MIN_VALID_SIZE_BYTES = 80_000
const MAX_ATTEMPTS_PER_TEMPLATE = 2

// ─── Types ────────────────────────────────────────────────────────────────────

type SeedreamInput = {
  image_urls: string[]
  prompt: string
}

type SeedreamOutput = {
  images?: Array<{ url?: string; width?: number; height?: number }>
  image?:  { url?: string }
  url?:    string
}

export type QualityResult = {
  url: string
  fileSizeBytes: number
  passed: boolean
  failReason?: string
}

export type JobEntry = {
  requestId: string
  templateId: string
}

// ─── Prompt builder ───────────────────────────────────────────────────────────

// Preview expression variants — both previews use the customer's chosen
// setting, differentiated by facial expression.
export const PREVIEW_EXPRESSIONS = [
  'Give him a confident, slightly serious "bad boy" expression: closed mouth, relaxed jaw, direct gaze with a hint of intensity.',
  'Give him a warm, closed-mouth slight smile: relaxed, approachable, soft eyes.',
] as const

function buildPrompt(template: Template, customerPhotoCount: number, expressionNote?: string): string {
  const refPhotos = customerPhotoCount >= 2
    ? '#2 and #3 are reference photos of the same real person from different angles. Use both to reconstruct the exact identity.'
    : '#2 is a reference photo of the real person.'

  const glassesNote = template.hasGlasses
    ? ' Keep the sunglasses exactly as positioned in #1.'
    : ''

  const isMannequin = template.isMannequin ?? false
  const headNote = isMannequin
    ? 'The figure in #1 has a blank mannequin head. Replace it with'
    : 'Replace the face and head in #1 with'

  return `#1 is the target scene. Preserve every detail of #1 exactly: the ${template.setting} setting, clothing, body, arms, hands, pose, lighting and camera angle. Do not change anything in #1 except the face and head.

${refPhotos} Extract the exact identity: face shape, eyes, eyebrows, nose, lips, jawline, skin tone, skin texture, hair colour, hairline and hairstyle.

${headNote} the exact identity from the reference photos. Adapt the head naturally to the angle and lighting of #1. Blend seamlessly at the hairline, neck and ears.${glassesNote}${expressionNote ? ` ${expressionNote}` : ''}

Do not idealise, slim or smooth the face. Reproduce the exact real person from the reference photos.

The result must look like one authentic photograph of this specific real person in the scene from #1.`
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractOutputUrl(result: unknown): string | null {
  if (!result || typeof result !== 'object') return null
  const r = result as { data?: SeedreamOutput } & SeedreamOutput

  const data = (r.data ?? r) as SeedreamOutput
  if (!data || typeof data !== 'object') return null

  if (data.images?.[0]?.url) return data.images[0].url
  if (data.image?.url)        return data.image.url
  if (data.url)               return data.url

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

export async function scoreOutput(url: string): Promise<QualityResult> {
  try {
    const head = await fetch(url, { method: 'HEAD' })
    if (!head.ok) {
      return { url, fileSizeBytes: 0, passed: false, failReason: `HTTP ${head.status}` }
    }
    const contentLength = parseInt(head.headers.get('content-length') ?? '0', 10)

    if (contentLength > 0) {
      if (contentLength < MIN_VALID_SIZE_BYTES) {
        return { url, fileSizeBytes: contentLength, passed: false, failReason: `Too small (${contentLength}B)` }
      }
      return { url, fileSizeBytes: contentLength, passed: true }
    }

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

// ─── Preview: exactly 2 results, with streaming status callbacks ─────────────

// Each onboarding style maps to EXACTLY ONE mannequin template — rooftop and
// beach are both category 'outdoor', so category lookup alone picks the wrong
// scene for one of them.
const STYLE_TO_TEMPLATE_ID: Record<string, string> = {
  restaurant: 'mannequin-italian-restaurant',
  formal:     'mannequin-smart-formal',
  rooftop:    'mannequin-rooftop-pool',
  beach:      'mannequin-beach-club',
}

export type TattooRef = { url: string; description?: string }

export async function runTwoPreviewFaceSwaps(
  customerPhotoUrls: string[],
  style: string,
  hasTattoos: boolean,
  onStatus: (status: string) => void,
  tattooRef?: TattooRef
): Promise<string[]> {
  // Both previews use the customer's CHOSEN setting (its mannequin scene),
  // differentiated by expression: one "bad boy" serious, one slight smile.
  const templateId = STYLE_TO_TEMPLATE_ID[style]
  const template =
    (templateId && TEMPLATES.find(t => t.id === templateId)) ||
    getPreviewTemplatesForCategory(style)[0]
  if (!template) return []
  const variants = PREVIEW_EXPRESSIONS.slice(0, 2)

  if (hasTattoos) {
    console.log('[preview] hasTattoos=true — face/neck tattoos may transfer')
  }

  onStatus('gen_1')

  const results: (string | null)[] = new Array(variants.length).fill(null)
  let firstDone = false

  const jobs = variants.map((expressionNote, idx) => {
    const imageUrls = [template.url, ...customerPhotoUrls.slice(0, 2)]
    let prompt = buildPrompt(template, customerPhotoUrls.length, expressionNote)

    // Tattoo reference: appended as the LAST image so numbering is stable
    if (tattooRef) {
      imageUrls.push(tattooRef.url)
      const refNum = imageUrls.length
      prompt += `\n\n#${refNum} shows the person's real tattoos${tattooRef.description ? ` (${tattooRef.description})` : ''}. Reproduce these tattoos accurately on the same body parts wherever they are visible in the scene. Do not invent tattoos that are not in #${refNum}.`
    }

    return withTimeout(
      fal.subscribe(MODEL, { input: { image_urls: imageUrls, prompt } as SeedreamInput, logs: false }),
      120_000
    )
      .then(raw => {
        const url = extractOutputUrl(raw)
        if (url) {
          results[idx] = url
          console.log(`[preview] ✓ Job ${idx} (${template.id})`)
        }
      })
      .catch(err => {
        console.error(`[preview] ✗ Job ${idx} (${template.id}):`, err instanceof Error ? err.message : err)
      })
      .finally(() => {
        if (!firstDone) {
          firstDone = true
          if (variants.length > 1) onStatus('gen_2')
        }
      })
  })

  await Promise.allSettled(jobs)
  return results.filter((u): u is string => u !== null)
}

// ─── Preview (synchronous, called before payment) ────────────────────────────

export async function runPreviewFaceSwaps(
  customerPhotoUrls: string[],
  preferredCategory?: string,
  hasTattoos?: boolean
): Promise<Record<string, string>> {
  const templates = getPreviewTemplatesForCategory(preferredCategory ?? 'restaurant')

  if (hasTattoos) {
    console.log('[preview] hasTattoos=true — face/neck tattoos may transfer; body tattoos follow template')
  }

  const results = await Promise.allSettled(
    templates.map(async (template, idx) => {
      const imageUrls = [template.url, ...customerPhotoUrls.slice(0, 2)]
      const prompt = buildPrompt(template, customerPhotoUrls.length)

      const raw = await withTimeout(
        fal.subscribe(MODEL, {
          input: { image_urls: imageUrls, prompt } as SeedreamInput,
          logs: false,
        }),
        120_000
      )

      const url = extractOutputUrl(raw)
      if (!url) throw new Error(`[preview] Job ${idx} (${template.id}): no URL in result`)

      const score = await scoreOutput(url)
      if (!score.passed) throw new Error(`[preview] Job ${idx} (${template.id}): quality failed — ${score.failReason}`)

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
      // Rotate customer photos for variety; always include the second photo if available
      const primary = pickCustomerPhotoForTemplate(customerPhotoUrls, idx)
      const secondary = customerPhotoUrls.find(u => u !== primary)
      const imageUrls = secondary
        ? [template.url, primary, secondary]
        : [template.url, primary]
      const prompt = buildPrompt(template, imageUrls.length - 1)

      return fal.queue
        .submit(MODEL, { input: { image_urls: imageUrls, prompt } as SeedreamInput })
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

// ─── Polling ──────────────────────────────────────────────────────────────────

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
            console.warn(`[faceswap] ✗ ${requestId} (${templateId}) — no URL`)
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

export function parseJobEntries(raw: string): JobEntry[] {
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed) || !parsed.length) return []
    if (typeof parsed[0] === 'string') {
      return parsed.map((id: string) => ({ requestId: id, templateId: 'unknown' }))
    }
    return parsed as JobEntry[]
  } catch {
    return []
  }
}

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
