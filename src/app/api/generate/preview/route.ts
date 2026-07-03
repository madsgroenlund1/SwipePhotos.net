import { NextRequest, NextResponse } from 'next/server'
import { fal } from '@fal-ai/client'

fal.config({ credentials: process.env.FAL_KEY })

// 5 scene variations per setting — PuLID preserves identity, prompt drives the scene
const SCENE_PROMPTS: Record<string, string[]> = {
  restaurant: [
    'professional photo of a handsome man seated at a luxury outdoor Italian restaurant, white linen shirt, warm golden hour sunlight, cobblestone street, relaxed confident smile showing teeth, shallow depth of field, photorealistic',
    'lifestyle photo of a handsome man at an upscale European cafe terrace, white shirt open collar, leaning back in chair, candles on table, evening golden light, natural candid smile, photorealistic',
    'candid photo of a handsome man dining at a stylish outdoor restaurant, linen shirt, wine glass in hand, blurred bokeh background of city street, warm amber lighting, photorealistic',
    'photo of a handsome man seated at an Italian restaurant table, white linen shirt, pasta and wine in foreground bokeh, soft warm natural lighting, relaxed expression, photorealistic portrait',
    'editorial photo of a handsome man at a rooftop restaurant, white shirt, city lights in soft bokeh background, smiling naturally, warm evening light, photorealistic',
  ],
  formal: [
    'professional photo of a handsome man in a dark navy blazer and white shirt, standing in a modern upscale hotel lobby, confident direct gaze, warm ambient lighting, photorealistic portrait',
    'photo of a handsome man wearing a fitted dark suit jacket, stylish bar interior background, soft bokeh, confident relaxed expression, photorealistic',
    'editorial photo of a handsome man in a navy blazer, hands in pockets, upscale interior with marble and ambient lighting, natural smile, photorealistic',
    'photo of a handsome man in a dark blazer and white shirt, luxury lounge setting, warm moody lighting, confident posture leaning slightly forward, photorealistic portrait',
    'lifestyle photo of a handsome man dressed in smart casual blazer, modern city office background through glass windows, golden hour light, photorealistic',
  ],
  rooftop: [
    'photo of a handsome man leaning against a rooftop bar railing, casual shirt, city skyline at golden hour behind him in bokeh, relaxed confident smile, photorealistic',
    'lifestyle photo of a handsome man at a luxury rooftop pool bar at dusk, striped casual shirt, city lights and sea in soft focus background, photorealistic',
    'candid photo of a handsome man at a rooftop terrace party, casual open shirt, panoramic city skyline in background, blue hour sky, warm light, photorealistic portrait',
    'editorial photo of a handsome man relaxing at a rooftop bar, casual shirt, cocktail on railing beside him, city below in bokeh, confident smile, photorealistic',
    'photo of a handsome man at sunset rooftop lounge, light button-up shirt, golden sky and cityscape behind him, candid relaxed expression, photorealistic',
  ],
  beach: [
    'photo of a handsome man at a luxury beach club, white linen shirt open, turquoise sea background, relaxed confident smile, warm Mediterranean sunlight, photorealistic',
    'lifestyle photo of a handsome man at an exclusive beach club lounge, white linen shirt, sun loungers and palm trees in background, sunglasses pushed up, photorealistic',
    'candid photo of a handsome man walking along a luxury beach, white linen shirt, turquoise shallow water, bright sun, relaxed casual expression, photorealistic',
    'editorial photo of a handsome man at a Maldives beach club, white shirt open, overwater bungalows in soft background bokeh, golden sunlight, photorealistic portrait',
    'photo of a handsome man at beach bar, white linen open shirt, tropical backdrop, cocktail on table in foreground bokeh, natural warm smile, photorealistic',
  ],
}

const NEGATIVE = 'cartoon, anime, painting, illustration, 3d render, cgi, digital art, plastic skin, waxy, airbrushed, fake, deformed, bad anatomy, extra fingers, missing limbs, blurry, watermark, text, nsfw, nudity, duplicate face, two people, red skin, pink skin, strong color cast, ugly, disfigured'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('photo') as File | null
    const style = (formData.get('style') as string) || 'restaurant'
    if (!file) return NextResponse.json({ error: 'No photo' }, { status: 400 })

    const prompts = SCENE_PROMPTS[style] ?? SCENE_PROMPTS.restaurant

    // Upload face photo once
    const faceImageUrl = await fal.storage.upload(file)
    console.log('[preview] Face uploaded, style:', style)

    // PuLID: Flux-based identity-preserving generation — each prompt = one scene variation
    const jobs = await Promise.all(
      prompts.map(prompt =>
        fal.queue.submit('fal-ai/pulid', {
          input: {
            reference_images: [{ image_url: faceImageUrl }],
            prompt,
            negative_prompt: NEGATIVE,
            num_inference_steps: 25,
            guidance_scale: 4.0,
            image_size: { width: 576, height: 768 },
            num_images: 1,
          },
        })
      )
    )

    const requestIds = jobs.map(j => j.request_id)
    const styles = prompts.map((_, i) => `v${i}`)
    console.log('[preview] Submitted', requestIds.length, 'PuLID jobs')
    return NextResponse.json({ requestIds, styles })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[preview] Error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
