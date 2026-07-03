import { NextRequest, NextResponse } from 'next/server'
import { fal } from '@fal-ai/client'

fal.config({ credentials: process.env.FAL_KEY })

const SUPABASE = 'https://uxllirottbektcirajjm.supabase.co/storage/v1/object/public/references'

// One representative reference photo per style for preview
const STYLE_REFERENCE: Record<string, string> = {
  formal:     `${SUPABASE}/ref-suit-2.jpg`,
  rooftop:    `${SUPABASE}/ref-suit-1.jpg`,
  city:       `${SUPABASE}/ref-metro.jpg`,
  social:     `${SUPABASE}/670580191.jpg`,
  casual:     `${SUPABASE}/tom-casual.webp`,
  outdoor:    `${SUPABASE}/urban-wall-1.jpg`,
  nature:     `${SUPABASE}/kyle-nature.webp`,
  restaurant: `${SUPABASE}/radu-restaurant.webp`,
  beach:      `${SUPABASE}/salvatore-nature.webp`,
}

const DEFAULT_REF = `${SUPABASE}/ref-suit-1.jpg`

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    let formData: FormData
    try {
      formData = await req.formData()
    } catch {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }
    const file = formData.get('photo') as File | null
    const style = (formData.get('style') as string) || 'restaurant'

    if (!file) return NextResponse.json({ error: 'No photo' }, { status: 400 })

    // Upload customer photo to fal.ai storage
    const faceImageUrl = await fal.storage.upload(file)
    console.log('[preview] Face uploaded, style:', style)

    const targetUrl = STYLE_REFERENCE[style] ?? DEFAULT_REF

    // Run face-swap: customer face → reference scene
    type FaceSwapResult = { image?: { url: string }; images?: Array<{ url: string }> }
    const result = await fal.subscribe('fal-ai/face-swap', {
      input: {
        base_image_url: targetUrl,
        swap_image_url: faceImageUrl,
      },
      logs: false,
    }) as FaceSwapResult

    const url = result?.image?.url ?? result?.images?.[0]?.url

    if (!url) {
      console.error('[preview] No URL in face-swap result', result)
      return NextResponse.json({ photos: {} })
    }

    console.log('[preview] Face-swap done:', url)
    // Return as a map keyed by style so the client can display it
    return NextResponse.json({ photos: { [style]: url }, done: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[preview] Error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
