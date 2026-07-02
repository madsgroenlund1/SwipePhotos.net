import { NextRequest, NextResponse } from 'next/server'
import { fal } from '@fal-ai/client'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://swipephotos.net'

// Preset scene images — used as pose/composition reference so output matches exactly
const SCENE_IMAGES: Record<string, string> = {
  restaurant: `${APP_URL}/photos/presets/scene-restaurant.jpg`,
  formal:     `${APP_URL}/photos/presets/scene-formal.jpg`,
  rooftop:    `${APP_URL}/photos/presets/scene-rooftop.jpg`,
  beach:      `${APP_URL}/photos/presets/scene-beach.jpg`,
  park:       `${APP_URL}/photos/presets/scene-restaurant.jpg`,
}

// Minimal prompts — scene image handles composition, prompt just confirms person + quality
const STYLE_PROMPT: Record<string, string> = {
  restaurant: 'RAW photo, real person, photorealistic, natural skin texture, same background and setting as reference image, 8k, high quality',
  formal:     'RAW photo, real person, photorealistic, natural skin texture, same background and setting as reference image, 8k, high quality',
  rooftop:    'RAW photo, real person, photorealistic, natural skin texture, same background and setting as reference image, 8k, high quality',
  beach:      'RAW photo, real person, photorealistic, natural skin texture, same background and setting as reference image, 8k, high quality',
  park:       'RAW photo, real person, photorealistic, natural skin texture, same background and setting as reference image, 8k, high quality',
}

const NEGATIVE = [
  'cartoon, anime, illustration, painting, drawing, cgi, digital art',
  'plastic skin, waxy skin, airbrushed, oversaturated',
  'deformed, disfigured, bad anatomy, extra fingers, missing fingers',
  'blurry, out of focus, watermark, text, logo',
  'duplicate head, two faces, extra person',
  'nsfw, nudity, mannequin, dummy, plastic body',
].join(', ')

// 5 expression variations
const EXPRESSIONS = [
  'genuine big smile showing teeth, looking directly at camera',
  'relaxed natural closed-mouth smile, warm friendly eyes',
  'calm serious expression, looking slightly off-camera',
  'caught mid-laugh, candid joyful moment',
  'subtle confident smirk, direct eye contact',
]

export const maxDuration = 30

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('photo') as File | null
    const style = (formData.get('style') as string) || 'restaurant'
    if (!file) return NextResponse.json({ error: 'No photo' }, { status: 400 })

    const sceneImageUrl = SCENE_IMAGES[style] ?? SCENE_IMAGES.restaurant
    const basePrompt = STYLE_PROMPT[style] ?? STYLE_PROMPT.restaurant

    // Upload user's face photo to fal CDN
    const faceImageUrl = await fal.storage.upload(file)

    const jobs = await Promise.all(
      EXPRESSIONS.map((expression) =>
        fal.queue.submit('fal-ai/instantid', {
          input: {
            face_image_url: faceImageUrl,
            pose_image_url: sceneImageUrl,   // ← exact scene as composition reference
            prompt: `${basePrompt}, ${expression}`,
            negative_prompt: NEGATIVE,
            num_inference_steps: 35,
            guidance_scale: 6,
            ip_adapter_scale: 0.9,
            controlnet_conditioning_scale: 1.0, // max — stick as close as possible to scene
            image_size: { width: 576, height: 768 },
            num_images: 1,
          },
        })
      )
    )

    const requestIds = jobs.map(j => j.request_id)
    const indices = EXPRESSIONS.map((_, i) => `v${i}`)
    console.log('[preview] Submitted jobs for style:', style, requestIds)

    return NextResponse.json({ requestIds, styles: indices })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[preview] Submit error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
