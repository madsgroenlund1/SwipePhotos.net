import { NextRequest, NextResponse } from 'next/server'
import { fal } from '@fal-ai/client'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://swipephotos.net'

const SCENE_IMAGES: Record<string, string> = {
  restaurant: `${APP_URL}/photos/presets/scene-restaurant.jpg`,
  formal:     `${APP_URL}/photos/presets/scene-formal.jpg`,
  rooftop:    `${APP_URL}/photos/presets/scene-rooftop.jpg`,
  beach:      `${APP_URL}/photos/presets/scene-beach.jpg`,
}

// Scene-specific prompts — explicit upright poses to prevent bad body language
const STYLE_PROMPTS: Record<string, string> = {
  restaurant: 'RAW photo, handsome young man seated upright at outdoor Italian restaurant table, white linen shirt, arms resting on table, warm golden hour sunlight, cobblestone street, photorealistic, natural skin tone, 8k',
  formal:     'RAW photo, handsome young man standing confidently in dark blazer and white shirt, upscale interior, hands in pockets, warm ambient light, photorealistic, natural skin tone, 8k',
  rooftop:    'RAW photo, handsome young man leaning against rooftop bar railing, city skyline at golden hour behind him, casual shirt, relaxed confident posture, photorealistic, natural skin tone, 8k',
  beach:      'RAW photo, handsome young man standing at luxury beach club, white linen shirt open, turquoise sea background, relaxed arms at sides, Mediterranean sunlight, photorealistic, natural skin tone, 8k',
}

const NEGATIVE = [
  'sitting on floor, crouching, cross-legged, uncomfortable pose, mannequin, dummy',
  'cartoon, anime, painting, illustration, 3d render, cgi, digital art',
  'plastic skin, waxy, airbrushed, fake, artificial',
  'deformed, bad anatomy, extra fingers, missing limbs',
  'blurry, watermark, text, logo',
  'red skin, pink skin, wrong skin color, strong color cast',
  'nsfw, nudity, duplicate face, two people',
].join(', ')

const EXPRESSIONS = [
  'big genuine smile showing teeth, eyes crinkled with joy, looking at camera',
  'relaxed natural closed-mouth smile, warm eyes',
  'calm confident expression, looking slightly to the side',
  'caught mid-laugh, candid joyful moment',
  'subtle smirk, confident direct eye contact',
]

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('photo') as File | null
    const style = (formData.get('style') as string) || 'restaurant'
    if (!file) return NextResponse.json({ error: 'No photo' }, { status: 400 })

    const sceneUrl = SCENE_IMAGES[style] ?? SCENE_IMAGES.restaurant
    const basePrompt = STYLE_PROMPTS[style] ?? STYLE_PROMPTS.restaurant
    const faceImageUrl = await fal.storage.upload(file)

    // InstantID with scene for atmosphere + strength 0.75 for pose freedom
    const jobs = await Promise.all(
      EXPRESSIONS.map(expression =>
        fal.queue.submit('fal-ai/instantid', {
          input: {
            face_image_url: faceImageUrl,
            image_url: sceneUrl,
            prompt: `${basePrompt}, ${expression}`,
            negative_prompt: NEGATIVE,
            num_inference_steps: 40,
            guidance_scale: 7,
            ip_adapter_scale: 0.9,
            controlnet_conditioning_scale: 0.8,
            strength: 0.75,
            image_size: { width: 576, height: 768 },
            num_images: 1,
          },
        })
      )
    )

    const requestIds = jobs.map(j => j.request_id)
    const styles = EXPRESSIONS.map((_, i) => `v${i}`)
    console.log('[preview] Submitted', requestIds.length, 'jobs for style:', style)
    return NextResponse.json({ requestIds, styles })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[preview] Error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
