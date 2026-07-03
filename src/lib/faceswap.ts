import { fal } from '@fal-ai/client'

fal.config({ credentials: process.env.FAL_KEY })

// ─── Reference photo library ──────────────────────────────────────────────────
// Curated male model photos stored in Supabase Storage.
// Add more via Supabase dashboard → Storage → references bucket.
const REFERENCE_PHOTOS: Array<{ url: string; scene: string }> = [
  // Museum / formal event (grey suit)
  { scene: 'formal', url: 'https://uxllirottbektcirajjm.supabase.co/storage/v1/object/public/references/ref-suit-1.jpg' },
  { scene: 'formal', url: 'https://uxllirottbektcirajjm.supabase.co/storage/v1/object/public/references/ref-suit-2.jpg' },
  // Metro / city (green jacket, escalator)
  { scene: 'city',   url: 'https://uxllirottbektcirajjm.supabase.co/storage/v1/object/public/references/ref-metro.jpg' },
  // Metro / city (green jacket, looking back in train)
  { scene: 'city',   url: 'https://uxllirottbektcirajjm.supabase.co/storage/v1/object/public/references/670580191.jpg' },
  // Additional model shots
  { scene: 'casual', url: 'https://uxllirottbektcirajjm.supabase.co/storage/v1/object/public/references/536607362.jpg' },
  { scene: 'casual', url: 'https://uxllirottbektcirajjm.supabase.co/storage/v1/object/public/references/536640715.jpg' },
  { scene: 'casual', url: 'https://uxllirottbektcirajjm.supabase.co/storage/v1/object/public/references/671193930.jpg' },
]

type FaceSwapResult = {
  image?: { url?: string }
  images?: Array<{ url?: string }>
}

export async function runFaceSwaps(
  customerPhotoUrl: string,
  count = 15
): Promise<string[]> {
  const refs = REFERENCE_PHOTOS.slice(0, count)

  console.log(`[faceswap] Starting ${refs.length} face-swaps in parallel`)

  const results = await Promise.allSettled(
    refs.map((ref) =>
      fal.subscribe('fal-ai/face-swap', {
        input: {
          base_image_url: ref.url,         // professional scene (body/background)
          swap_image_url: customerPhotoUrl, // customer's face
        },
        logs: false,
      })
    )
  )

  const urls: string[] = []
  for (const [i, result] of results.entries()) {
    if (result.status === 'rejected') {
      console.error(`[faceswap] Job ${i} (${refs[i].scene}) failed:`, result.reason)
      continue
    }
    const data = result.value as FaceSwapResult
    const url = data?.image?.url ?? data?.images?.[0]?.url
    if (url) {
      urls.push(url)
    } else {
      console.warn(`[faceswap] Job ${i} returned no URL`, data)
    }
  }

  console.log(`[faceswap] Done: ${urls.length}/${refs.length} succeeded`)
  return urls
}

// Pick the best customer photo for face-swapping.
// Prefers front-facing, well-lit, unobstructed face shots.
// For now returns first URL — can later call GPT-4o Vision to score.
export function pickBestFacePhoto(photoUrls: string[]): string {
  return photoUrls[0]
}
