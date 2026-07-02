import { NextRequest, NextResponse } from 'next/server'
import { fal } from '@fal-ai/client'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://swipephotos.net'

const SCENE_IMAGES: Record<string, string> = {
  restaurant: `${APP_URL}/photos/presets/scene-restaurant.jpg`,
  formal:     `${APP_URL}/photos/presets/scene-formal.jpg`,
  rooftop:    `${APP_URL}/photos/presets/scene-rooftop.jpg`,
  beach:      `${APP_URL}/photos/presets/scene-beach.jpg`,
}

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('photo') as File | null
    if (!file) return NextResponse.json({ error: 'No photo' }, { status: 400 })

    const faceImageUrl = await fal.storage.upload(file)

    // Face-swap user's face into all 4 scene images in parallel
    const scenes = Object.entries(SCENE_IMAGES)
    const results = await Promise.allSettled(
      scenes.map(async ([style, sceneUrl]) => {
        const result = await fal.run('fal-ai/face-swap', {
          input: {
            source_url: faceImageUrl,
            target_url: sceneUrl,
          },
        }) as { image?: { url: string }; images?: Array<{ url: string }> }

        const url = result?.image?.url ?? result?.images?.[0]?.url
        if (!url) throw new Error(`No output for scene: ${style}`)
        return { style, url }
      })
    )

    const photos: Record<string, string> = {}
    for (const r of results) {
      if (r.status === 'fulfilled') {
        photos[r.value.style] = r.value.url
      } else {
        console.error('[preview/face-swap] Failed:', r.reason)
      }
    }

    console.log('[preview] Face-swap done, got', Object.keys(photos).length, 'photos')
    return NextResponse.json({ photos, done: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[preview] Error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
