import { NextRequest, NextResponse } from 'next/server'
import { fal } from '@fal-ai/client'

const STYLES = ['restaurant', 'formal', 'rooftop', 'beach'] as const

const STYLE_PROMPTS: Record<string, string> = {
  restaurant: 'photo of a man sitting at an outdoor Italian restaurant, Mediterranean cobblestone street, white linen shirt, relaxed natural smile, pizza on table, warm sunlight, bokeh background, candid lifestyle photo, photorealistic, 4k',
  formal: 'photo of a man in smart casual outfit standing in an upscale hotel lobby, confident expression, looking at camera, warm ambient light, shallow depth of field, photorealistic, 4k',
  rooftop: 'photo of a man at a luxury rooftop bar at night, city lights bokeh background, casual shirt, relaxed pose, ambient warm light, cocktail in hand, photorealistic portrait, 4k',
  beach: 'photo of a man at a beach club, macrame umbrellas, white open linen shirt, sunglasses, holding cocktail, summer vibes, relaxed look, photorealistic, 4k',
}

const NEGATIVE = 'cartoon, anime, illustration, painting, 3d render, cgi, fake, plastic skin, nsfw, blurry, bad quality, deformed, ugly, watermark'

export const maxDuration = 30

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('photo') as File | null
    if (!file) return NextResponse.json({ error: 'No photo' }, { status: 400 })

    // Upload photo to fal.ai CDN so queue jobs can reference it by URL
    const imageUrl = await fal.storage.upload(file)

    // Submit all 4 jobs to fal.ai queue (non-blocking — returns request IDs instantly)
    const jobs = await Promise.all(
      STYLES.map(style =>
        fal.queue.submit('fal-ai/instantid', {
          input: {
            face_image_url: imageUrl,
            prompt: STYLE_PROMPTS[style],
            negative_prompt: NEGATIVE,
            num_inference_steps: 25,
            guidance_scale: 5,
            ip_adapter_scale: 0.8,
            controlnet_conditioning_scale: 0.8,
            image_size: { width: 576, height: 768 },
            num_images: 1,
          },
        })
      )
    )

    const requestIds = jobs.map(j => j.request_id)
    console.log('[preview] Submitted queue jobs:', requestIds)

    return NextResponse.json({ requestIds, styles: [...STYLES] })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[preview] Submit error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
