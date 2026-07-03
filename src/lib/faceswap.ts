import { fal } from '@fal-ai/client'

fal.config({ credentials: process.env.FAL_KEY })

const SUPABASE = 'https://uxllirottbektcirajjm.supabase.co/storage/v1/object/public/references'

export const REFERENCE_PHOTOS: Array<{ url: string; scene: string }> = [
  { scene: 'formal', url: `${SUPABASE}/ref-suit-1.jpg` },
  { scene: 'formal', url: `${SUPABASE}/ref-suit-2.jpg` },
  { scene: 'city',   url: `${SUPABASE}/ref-metro.jpg` },
  { scene: 'city',   url: `${SUPABASE}/670580191.jpg` },
  { scene: 'casual', url: `${SUPABASE}/536607362.jpg` },
  { scene: 'casual', url: `${SUPABASE}/536640715.jpg` },
  { scene: 'casual', url: `${SUPABASE}/671193930.jpg` },
]

type FaceSwapResult = {
  image?: { url?: string }
  images?: Array<{ url?: string }>
}

// Submit all face-swap jobs to fal.ai queue and return request IDs immediately.
// Does NOT wait for results — use pollFaceSwaps() to collect them.
export async function submitFaceSwaps(customerPhotoUrl: string): Promise<string[]> {
  const jobs = await Promise.allSettled(
    REFERENCE_PHOTOS.map((ref) =>
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
