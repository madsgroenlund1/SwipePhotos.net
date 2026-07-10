import { NextRequest, NextResponse } from 'next/server'
import { fal } from '@fal-ai/client'
import { pickPreviewPhotos } from '@/lib/faceswap'

fal.config({ credentials: process.env.FAL_KEY })

// Map onboarding style IDs → faceswap scene names
const STYLE_TO_SCENE: Record<string, string> = {
  restaurant: 'restaurant',
  formal:     'formal',
  rooftop:    'city',    // city-style urban references
  beach:      'casual',  // casual outdoor references
}

export const maxDuration = 60

type FaceSwapResult = { image?: { url: string }; images?: Array<{ url: string }> }

export async function POST(req: NextRequest) {
  try {
    let formData: FormData
    try { formData = await req.formData() } catch {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const file = formData.get('photo') as File | null
    const style = (formData.get('style') as string) || 'restaurant'
    if (!file) return NextResponse.json({ error: 'No photo' }, { status: 400 })

    const scene = STYLE_TO_SCENE[style] ?? 'restaurant'
    // Pick 5 photos with expression variety: smile, serious, relaxed, confident, candid
    const refs = pickPreviewPhotos(scene)
    if (!refs.length) return NextResponse.json({ error: 'No references' }, { status: 400 })

    // Upload customer face once, reuse across all jobs
    const faceUrl = await fal.storage.upload(file)
    console.log('[preview] Uploaded face, scene:', scene, 'expressions:', refs.map(r => r.expression))

    // Run all 5 face-swaps in parallel (~15s each → ~15-20s total)
    const results = await Promise.allSettled(
      refs.map(ref =>
        fal.subscribe('fal-ai/face-swap', {
          input: {
            base_image_url: ref.url,
            swap_image_url: faceUrl,
            face_restore_version: 'v1.4',
            face_restore_weight: 0.75,
          },
          logs: false,
        }) as Promise<FaceSwapResult>
      )
    )

    const photos: Record<string, string> = {}
    results.forEach((r, i) => {
      if (r.status === 'fulfilled') {
        const url = r.value?.image?.url ?? r.value?.images?.[0]?.url
        if (url) photos[String(i)] = url
      } else {
        console.error(`[preview] Job ${i} failed:`, r.reason)
      }
    })

    console.log('[preview] Done, photos:', Object.keys(photos).length)
    return NextResponse.json({ photos, done: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[preview] Error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
