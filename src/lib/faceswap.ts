import { fal } from '@fal-ai/client'

fal.config({ credentials: process.env.FAL_KEY })

// ─── Reference photo library ──────────────────────────────────────────────────
// Professional male model photos in varied scenes.
// base_image_url = the target scene/body (replace with your curated library)
// Tip: upload your own photos to Supabase Storage for full control.
const REFERENCE_PHOTOS: Array<{ url: string; scene: string }> = [
  // Restaurant / dining
  { scene: 'restaurant', url: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=768&q=90' },
  { scene: 'restaurant', url: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=768&q=90' },
  // Rooftop / city
  { scene: 'rooftop',    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=768&q=90' },
  { scene: 'rooftop',    url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=768&q=90' },
  // Beach / outdoor
  { scene: 'beach',      url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=768&q=90' },
  { scene: 'beach',      url: 'https://images.unsplash.com/photo-1488161628813-04466f872be2?w=768&q=90' },
  // Formal / blazer
  { scene: 'formal',     url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=768&q=90' },
  { scene: 'formal',     url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=768&q=90' },
  // City / street
  { scene: 'city',       url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=768&q=90' },
  { scene: 'city',       url: 'https://images.unsplash.com/photo-1496345875659-11f7dd282d1d?w=768&q=90' },
  // Casual / lifestyle
  { scene: 'casual',     url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=768&q=90' },
  { scene: 'casual',     url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=768&q=90' },
  // Social / bar
  { scene: 'social',     url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=768&q=90' },
  { scene: 'social',     url: 'https://images.unsplash.com/photo-1542178243-bc20204b769f?w=768&q=90' },
  // Nature / travel
  { scene: 'nature',     url: 'https://images.unsplash.com/photo-1530268729831-4b0b9e170218?w=768&q=90' },
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
