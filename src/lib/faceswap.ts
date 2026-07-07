import { fal } from '@fal-ai/client'

fal.config({ credentials: process.env.FAL_KEY })

const SUPABASE = 'https://uxllirottbektcirajjm.supabase.co/storage/v1/object/public/references'

export const REFERENCE_PHOTOS: Array<{ url: string; scene: string }> = [
  // City / urban European streets
  { scene: 'city', url: `${SUPABASE}/model-566594022.jpg` },
  { scene: 'city', url: `${SUPABASE}/model-590915174.jpg` },
  { scene: 'city', url: `${SUPABASE}/model-601551406.jpg` },
  { scene: 'city', url: `${SUPABASE}/model-656384899.jpg` },
  { scene: 'city', url: `${SUPABASE}/model-656788933.jpg` },
  { scene: 'city', url: `${SUPABASE}/model-682657360.jpg` },
  { scene: 'city', url: `${SUPABASE}/model-703861624.jpg` },
  { scene: 'city', url: `${SUPABASE}/model-704784546.jpg` },
  { scene: 'city', url: `${SUPABASE}/model-708089048.jpg` },
  { scene: 'city', url: `${SUPABASE}/model-708793199.jpg` },
  { scene: 'city', url: `${SUPABASE}/model-728893385.jpg` },
  // Casual / relaxed street
  { scene: 'casual', url: `${SUPABASE}/model-609644343.jpg` },
  { scene: 'casual', url: `${SUPABASE}/model-610581112.jpg` },
  { scene: 'casual', url: `${SUPABASE}/model-610613378.jpg` },
  { scene: 'casual', url: `${SUPABASE}/model-671808132.jpg` },
  { scene: 'casual', url: `${SUPABASE}/model-705365478.jpg` },
  { scene: 'casual', url: `${SUPABASE}/model-706035720.jpg` },
  { scene: 'casual', url: `${SUPABASE}/model-715412525.jpg` },
  { scene: 'casual', url: `${SUPABASE}/model-731072445.jpg` },
  // Outdoor / waterfront / harbour
  { scene: 'outdoor', url: `${SUPABASE}/model-568282345.jpg` },
  { scene: 'outdoor', url: `${SUPABASE}/model-643582149.jpg` },
  { scene: 'outdoor', url: `${SUPABASE}/model-658442365.jpg` },
  { scene: 'outdoor', url: `${SUPABASE}/model-687476205.jpg` },
  { scene: 'outdoor', url: `${SUPABASE}/model-689274595.jpg` },
  { scene: 'outdoor', url: `${SUPABASE}/model-710537485.jpg` },
  { scene: 'outdoor', url: `${SUPABASE}/model-731736194.jpg` },
  // Formal / hotel / suit
  { scene: 'formal', url: `${SUPABASE}/model-651983567.jpg` },
  { scene: 'formal', url: `${SUPABASE}/model-653691675.jpg` },
  { scene: 'formal', url: `${SUPABASE}/model-708999683.jpg` },
  { scene: 'formal', url: `${SUPABASE}/model-710423421.jpg` },
  // Restaurant / cafe
  { scene: 'restaurant', url: `${SUPABASE}/model-670874313.jpg` },
  { scene: 'restaurant', url: `${SUPABASE}/model-670986892.jpg` },
  { scene: 'restaurant', url: `${SUPABASE}/model-671108876.jpg` },
  { scene: 'restaurant', url: `${SUPABASE}/model-671250925.jpg` },
  { scene: 'restaurant', url: `${SUPABASE}/model-724685144.jpg` },
  { scene: 'restaurant', url: `${SUPABASE}/model-726838267.jpg` },
  { scene: 'restaurant', url: `${SUPABASE}/model-727190138.jpg` },
]

type FaceSwapResult = {
  image?: { url?: string }
  images?: Array<{ url?: string }>
}

// Submit all face-swap jobs to fal.ai queue and return request IDs immediately.
// preferredScene: put photos from this scene first so the dashboard preview
// shows the customer's chosen style.
export async function submitFaceSwaps(customerPhotoUrl: string, preferredScene?: string): Promise<string[]> {
  const ordered = preferredScene
    ? [
        ...REFERENCE_PHOTOS.filter(r => r.scene === preferredScene),
        ...REFERENCE_PHOTOS.filter(r => r.scene !== preferredScene),
      ]
    : REFERENCE_PHOTOS

  const jobs = await Promise.allSettled(
    ordered.map((ref) =>
      fal.queue.submit('fal-ai/face-swap', {
        input: {
          base_image_url: ref.url,
          swap_image_url: customerPhotoUrl,
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

  console.log(`[faceswap] Submitted ${requestIds.length}/${REFERENCE_PHOTOS.length} jobs`)
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
