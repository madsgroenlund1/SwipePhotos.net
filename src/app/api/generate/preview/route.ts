import { NextRequest, NextResponse } from 'next/server'
import { fal } from '@fal-ai/client'

const NEGATIVE = 'cartoon, anime, illustration, painting, 3d render, cgi, plastic skin, nsfw, blurry, bad quality, deformed, ugly, watermark, duplicate face, distorted hands, extra fingers, bad anatomy, weird pose, crossed legs, floating, stiff pose, sitting cross-legged, unnatural posture'

const STYLE_BASE: Record<string, string> = {
  restaurant: 'RAW photo of a man at an outdoor Italian restaurant on a cobblestone Mediterranean street, warm golden hour sunlight, white linen shirt, pizza on rustic wooden table, string lights, authentic Italian architecture background, Canon EOS R5, 85mm f/1.4, shallow depth of field, photorealistic, cinematic, 8k',
  formal: 'RAW photo of a man in a fitted navy blazer and white shirt, standing in an upscale hotel lobby with marble floors and warm ambient lighting, Canon EOS R5, 85mm f/1.8, shallow depth of field, photorealistic, editorial fashion, 8k',
  rooftop: 'RAW photo of a man at a luxury Manhattan rooftop bar at golden hour, city skyline bokeh background, fitted casual shirt, cocktail in hand, warm ambient orange light, Canon EOS R5, 85mm f/1.4, photorealistic, lifestyle editorial, 8k',
  beach: 'RAW photo of a man at a luxury Ibiza beach club, white macrame parasols, turquoise water background, open linen shirt, summer sunlight, Sony A7IV, 85mm f/1.8, shallow depth of field, photorealistic, 8k',
  park: 'RAW photo of a man in a sun-drenched urban park, green trees bokeh background, casual smart outfit, golden afternoon light, Canon EOS R5, 85mm f/1.4, shallow depth of field, photorealistic, lifestyle, 8k',
}

const EXPRESSIONS = [
  'genuine big smile showing teeth, relaxed confident energy, looking directly at camera',
  'relaxed natural smile, mouth closed, warm friendly eyes, slight head tilt',
  'serious confident expression, strong jaw, looking slightly off camera, calm and composed',
  'caught laughing candidly, eyes slightly squinted with joy, natural candid moment',
  'subtle smirk, one side smile, confident direct eye contact, mysterious and attractive',
]

export const maxDuration = 30

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('photo') as File | null
    const style = (formData.get('style') as string) || 'restaurant'
    if (!file) return NextResponse.json({ error: 'No photo' }, { status: 400 })

    const basePrompt = STYLE_BASE[style] ?? STYLE_BASE.restaurant

    const imageUrl = await fal.storage.upload(file)

    const jobs = await Promise.all(
      EXPRESSIONS.map((expression, i) =>
        fal.queue.submit('fal-ai/instantid', {
          input: {
            face_image_url: imageUrl,
            prompt: `${basePrompt}, ${expression}`,
            negative_prompt: NEGATIVE,
            num_inference_steps: 30,
            guidance_scale: 5.5,
            ip_adapter_scale: 0.85,
            controlnet_conditioning_scale: 0.85,
            image_size: { width: 576, height: 768 },
            num_images: 1,
          },
        })
      )
    )

    const requestIds = jobs.map(j => j.request_id)
    const indices = EXPRESSIONS.map((_, i) => `v${i}`)
    console.log('[preview] Submitted queue jobs:', requestIds)

    return NextResponse.json({ requestIds, styles: indices })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[preview] Submit error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
