import { NextRequest, NextResponse } from 'next/server'
import { fal } from '@fal-ai/client'

const STYLE_PROMPTS: Record<string, string> = {
  restaurant: 'photo of a man sitting at an outdoor Italian restaurant, Mediterranean cobblestone street, white linen shirt, relaxed natural smile, pizza on table, warm sunlight, bokeh background, candid lifestyle photo, photorealistic, 4k',
  formal: 'photo of a man in smart casual outfit standing in an upscale hotel lobby, confident expression, looking at camera, warm ambient light, shallow depth of field, photorealistic, 4k',
  rooftop: 'photo of a man at a luxury rooftop bar at night, city lights bokeh background, casual shirt, relaxed pose, ambient warm light, cocktail in hand, photorealistic portrait, 4k',
  beach: 'photo of a man at a beach club, macrame umbrellas, white open linen shirt, sunglasses, holding cocktail, summer vibes, relaxed look, photorealistic, 4k',
}

const NEGATIVE = 'cartoon, anime, illustration, painting, 3d render, cgi, fake, plastic skin, nsfw, blurry, bad quality, deformed, ugly, watermark'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('photo') as File | null
    if (!file) return NextResponse.json({ error: 'No photo' }, { status: 400 })

    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')
    const dataUrl = `data:${file.type || 'image/jpeg'};base64,${base64}`

    const styles = Object.keys(STYLE_PROMPTS)

    const results = await Promise.allSettled(
      styles.map(style =>
        fal.run('fal-ai/instantid', {
          input: {
            face_image_url: dataUrl,
            prompt: STYLE_PROMPTS[style],
            negative_prompt: NEGATIVE,
            num_inference_steps: 30,
            guidance_scale: 5,
            ip_adapter_scale: 0.8,
            controlnet_conditioning_scale: 0.8,
            image_size: { width: 768, height: 1024 },
            num_images: 1,
          },
        })
      )
    )

    const photos: Record<string, string> = {}
    results.forEach((result, i) => {
      if (result.status === 'fulfilled') {
        const output = result.value as { images?: Array<{ url: string }>; image?: { url: string } }
        const url = output?.images?.[0]?.url || output?.image?.url
        if (url) photos[styles[i]] = url
      }
    })

    if (Object.keys(photos).length === 0) {
      return NextResponse.json({ error: 'All generations failed' }, { status: 500 })
    }

    return NextResponse.json({ photos })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('fal.ai preview error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
