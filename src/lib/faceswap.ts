import { fal } from '@fal-ai/client'

fal.config({ credentials: process.env.FAL_KEY })

const SUPABASE = 'https://uxllirottbektcirajjm.supabase.co/storage/v1/object/public/references'

// expression: the vibe of the reference photo — used to ensure preview shows variety
// best: true = include in post-payment set (user curates this)
export const REFERENCE_PHOTOS: Array<{ url: string; scene: string; expression: string; best?: boolean }> = [
  // City / urban European streets
  { scene: 'city', expression: 'smile',      url: `${SUPABASE}/model-566594022.jpg` },
  { scene: 'city', expression: 'serious',    url: `${SUPABASE}/model-590915174.jpg` },
  { scene: 'city', expression: 'relaxed',    url: `${SUPABASE}/model-601551406.jpg` },
  { scene: 'city', expression: 'confident',  url: `${SUPABASE}/model-656384899.jpg` },
  { scene: 'city', expression: 'candid',     url: `${SUPABASE}/model-656788933.jpg` },
  { scene: 'city', expression: 'smile',      url: `${SUPABASE}/model-682657360.jpg` },
  { scene: 'city', expression: 'serious',    url: `${SUPABASE}/model-703861624.jpg` },
  { scene: 'city', expression: 'relaxed',    url: `${SUPABASE}/model-704784546.jpg` },
  { scene: 'city', expression: 'confident',  url: `${SUPABASE}/model-708089048.jpg` },
  { scene: 'city', expression: 'candid',     url: `${SUPABASE}/model-708793199.jpg` },
  { scene: 'city', expression: 'smile',      url: `${SUPABASE}/model-728893385.jpg` },
  // Casual / relaxed street
  { scene: 'casual', expression: 'smile',     url: `${SUPABASE}/model-609644343.jpg` },
  { scene: 'casual', expression: 'serious',   url: `${SUPABASE}/model-610581112.jpg` },
  { scene: 'casual', expression: 'relaxed',   url: `${SUPABASE}/model-610613378.jpg` },
  { scene: 'casual', expression: 'confident', url: `${SUPABASE}/model-671808132.jpg` },
  { scene: 'casual', expression: 'candid',    url: `${SUPABASE}/model-705365478.jpg` },
  { scene: 'casual', expression: 'smile',     url: `${SUPABASE}/model-706035720.jpg` },
  { scene: 'casual', expression: 'serious',   url: `${SUPABASE}/model-715412525.jpg` },
  { scene: 'casual', expression: 'relaxed',   url: `${SUPABASE}/model-731072445.jpg` },
  // Outdoor / waterfront / harbour
  { scene: 'outdoor', expression: 'smile',     url: `${SUPABASE}/model-568282345.jpg` },
  { scene: 'outdoor', expression: 'serious',   url: `${SUPABASE}/model-643582149.jpg` },
  { scene: 'outdoor', expression: 'relaxed',   url: `${SUPABASE}/model-658442365.jpg` },
  { scene: 'outdoor', expression: 'confident', url: `${SUPABASE}/model-687476205.jpg` },
  { scene: 'outdoor', expression: 'candid',    url: `${SUPABASE}/model-689274595.jpg` },
  { scene: 'outdoor', expression: 'smile',     url: `${SUPABASE}/model-710537485.jpg` },
  { scene: 'outdoor', expression: 'serious',   url: `${SUPABASE}/model-731736194.jpg` },
  // Formal / hotel / suit
  { scene: 'formal', expression: 'confident', url: `${SUPABASE}/model-651983567.jpg` },
  { scene: 'formal', expression: 'serious',   url: `${SUPABASE}/model-653691675.jpg` },
  { scene: 'formal', expression: 'smile',     url: `${SUPABASE}/model-708999683.jpg` },
  { scene: 'formal', expression: 'relaxed',   url: `${SUPABASE}/model-710423421.jpg` },
  // Restaurant / cafe
  { scene: 'restaurant', expression: 'smile',     url: `${SUPABASE}/model-670874313.jpg` },
  { scene: 'restaurant', expression: 'candid',    url: `${SUPABASE}/model-670986892.jpg` },
  { scene: 'restaurant', expression: 'relaxed',   url: `${SUPABASE}/model-671108876.jpg` },
  { scene: 'restaurant', expression: 'serious',   url: `${SUPABASE}/model-671250925.jpg` },
  { scene: 'restaurant', expression: 'confident', url: `${SUPABASE}/model-724685144.jpg` },
  { scene: 'restaurant', expression: 'smile',     url: `${SUPABASE}/model-726838267.jpg` },
  { scene: 'restaurant', expression: 'candid',    url: `${SUPABASE}/model-727190138.jpg` },
]

// The 5 expression types we always want in a preview set (variety = more attractive)
const PREVIEW_EXPRESSIONS = ['smile', 'serious', 'relaxed', 'confident', 'candid'] as const

// Pick exactly 5 photos for preview: one per expression type from the chosen scene.
// Falls back to any scene photo if a scene doesn't cover all 5 expressions.
export function pickPreviewPhotos(scene: string): typeof REFERENCE_PHOTOS {
  const scenePhotos = REFERENCE_PHOTOS.filter(r => r.scene === scene)
  const picked: typeof REFERENCE_PHOTOS = []
  for (const expr of PREVIEW_EXPRESSIONS) {
    const match = scenePhotos.find(r => r.expression === expr && !picked.includes(r))
    if (match) picked.push(match)
  }
  // Fill up to 5 if scene doesn't have all expressions
  if (picked.length < 5) {
    for (const p of scenePhotos) {
      if (!picked.includes(p)) picked.push(p)
      if (picked.length === 5) break
    }
  }
  return picked.slice(0, 5)
}

// Post-payment: only photos marked best:true — user curates this list
// TODO: set best:true on your top 10-20 photos after reviewing them
export function pickBestPhotos(): typeof REFERENCE_PHOTOS {
  const best = REFERENCE_PHOTOS.filter(r => r.best)
  return best.length >= 10 ? best : REFERENCE_PHOTOS // fallback until curated
}

type FaceSwapResult = {
  image?: { url?: string }
  images?: Array<{ url?: string }>
}

// Submit face-swap jobs to fal.ai queue after payment.
// Uses only the curated best photos (set best:true above) — quality over quantity.
// preferredScene photos are submitted first so the dashboard preview loads the right style.
export async function submitFaceSwaps(customerPhotoUrl: string, preferredScene?: string): Promise<string[]> {
  const pool = pickBestPhotos()
  const ordered = preferredScene
    ? [
        ...pool.filter(r => r.scene === preferredScene),
        ...pool.filter(r => r.scene !== preferredScene),
      ]
    : pool

  const jobs = await Promise.allSettled(
    ordered.map((ref) =>
      fal.queue.submit('fal-ai/face-swap', {
        input: {
          base_image_url: ref.url,
          swap_image_url: customerPhotoUrl,
          face_restore_version: 'v1.4',
          face_restore_weight: 0.75,
        },
      })
    )
  )

  const requestIds: string[] = []
  for (const job of jobs) {
    if (job.status === 'fulfilled' && job.value.request_id) {
      requestIds.push(job.value.request_id)
    } else if (job.status === 'rejected') {
      console.error('[faceswap] Submit failed:', job.reason)
    }
  }

  console.log(`[faceswap] Submitted ${requestIds.length}/${ordered.length} jobs`)
  return requestIds
}

// Check status of queued jobs and return URLs of completed ones.
export async function pollFaceSwaps(requestIds: string[]): Promise<{ urls: string[]; pending: string[] }> {
  const urls: string[] = []
  const pending: string[] = []

  await Promise.allSettled(
    requestIds.map(async (requestId) => {
      try {
        const status = await fal.queue.status('fal-ai/face-swap', { requestId, logs: false })
        const s = status.status as string

        if (s === 'COMPLETED') {
          const result = await fal.queue.result('fal-ai/face-swap', { requestId }) as FaceSwapResult
          const url = result?.image?.url ?? result?.images?.[0]?.url
          if (url) urls.push(url)
        } else if (s !== 'FAILED' && s !== 'CANCELLED') {
          pending.push(requestId)
        }
      } catch (err) {
        console.error(`[faceswap] Poll error for ${requestId}:`, err)
        pending.push(requestId) // retry next time
      }
    })
  )

  return { urls, pending }
}

export function pickBestFacePhoto(photoUrls: string[]): string {
  return photoUrls[0]
}
