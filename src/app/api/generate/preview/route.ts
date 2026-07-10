import { NextRequest, NextResponse } from 'next/server'
import { fal } from '@fal-ai/client'
import { runPreviewFaceSwaps } from '@/lib/faceswap'

fal.config({ credentials: process.env.FAL_KEY })

// Map onboarding style IDs → template category names
const STYLE_TO_CATEGORY: Record<string, string> = {
  restaurant: 'restaurant',
  formal:     'formal',
  rooftop:    'city',
  beach:      'casual',
}

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    let formData: FormData
    try { formData = await req.formData() } catch {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const file = formData.get('photo') as File | null
    const style = (formData.get('style') as string) || 'restaurant'
    if (!file || file.size === 0) return NextResponse.json({ error: 'No photo' }, { status: 400 })

    const category = STYLE_TO_CATEGORY[style] ?? 'restaurant'

    // Upload customer face to fal.ai storage once, reuse across all 5 jobs
    const faceUrl = await fal.storage.upload(file)
    console.log('[preview] Uploaded face, preferred category:', category)

    const photos = await runPreviewFaceSwaps(faceUrl, category)

    const count = Object.keys(photos).length
    console.log('[preview] Done —', count, 'photos returned')

    if (count === 0) {
      return NextResponse.json({ error: 'Face swap failed — please try again' }, { status: 500 })
    }

    return NextResponse.json({ photos, done: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[preview] Error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
